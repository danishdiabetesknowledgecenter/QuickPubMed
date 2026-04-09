<?php
/**
 * OpenAlex single-source lookup proxy.
 * Resolves one source by OpenAlex source ID.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

qpmApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');
@ini_set('max_execution_time', '60');
@set_time_limit(60);

function qpmIsLocalOpenAlexSourceLookupRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function qpmOpenAlexSourceShellCurlRequest(string $url, array $headers, int $timeout = 30): array
{
    if (!function_exists('exec')) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'exec() is disabled',
        ];
    }

    $parts = ['curl', '-sS', '-L', '--max-time', (string)max(1, (int)$timeout)];
    foreach ($headers as $header) {
        $parts[] = '-H';
        $parts[] = (string)$header;
    }
    $parts[] = '-w';
    $parts[] = '\n%{http_code}';
    $parts[] = $url;

    $escaped = array_map('escapeshellarg', $parts);
    $command = implode(' ', $escaped);

    $output = [];
    $exitCode = 0;
    @exec($command, $output, $exitCode);
    if (!is_array($output) || count($output) === 0) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'curl binary produced no output',
        ];
    }

    $lastLine = (string)$output[count($output) - 1];
    $status = ctype_digit(trim($lastLine)) ? (int)trim($lastLine) : 0;
    if ($status > 0) {
        array_pop($output);
    }
    $body = implode("\n", $output);

    if ($exitCode !== 0) {
        return [
            'ok' => false,
            'status' => $status,
            'body' => $body,
            'error' => 'curl binary failed with exit code ' . (string)$exitCode,
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => (string)$body,
        'error' => $status >= 200 && $status < 300 ? '' : 'curl binary returned HTTP ' . (string)$status,
    ];
}

function qpmOpenAlexSourceLocalDevProxyRequest(string $sourceId, string $apiKey = '', string $mailto = ''): array
{
    if (!qpmIsLocalOpenAlexSourceLookupRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $hosts = ['localhost', '127.0.0.1'];
    $queryParams = [];
    if ($apiKey !== '') {
        $queryParams['api_key'] = $apiKey;
    }
    if ($mailto !== '') {
        $queryParams['mailto'] = $mailto;
    }
    $queryString = !empty($queryParams) ? ('?' . http_build_query($queryParams)) : '';

    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/openalex-api/sources/' . rawurlencode($sourceId) . $queryString;
        $result = qpmHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 30,
            'user_agent' => 'QuickPubMed/1.0',
            'headers' => ['Accept: application/json'],
        ]);
        if ($result['ok'] && (int)$result['status'] >= 200 && (int)$result['status'] < 300) {
            return [
                'ok' => true,
                'status' => (int)$result['status'],
                'body' => (string)$result['body'],
                'error' => '',
            ];
        }
        $errors[] = $host . ': ' . ($result['error'] !== '' ? $result['error'] : ('HTTP ' . (string)$result['status']));
    }

    return [
        'ok' => false,
        'status' => 0,
        'body' => '',
        'error' => implode(' | ', $errors),
    ];
}

$params = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
if (empty($params)) {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $decoded = json_decode($rawInput, true);
        if (is_array($decoded)) {
            $params = $decoded;
        } else {
            parse_str($rawInput, $params);
        }
    }
}

$sourceId = trim((string) ($params['sourceId'] ?? ''));
$domain = trim((string) ($params['domain'] ?? ''));
if ($sourceId === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing OpenAlex source ID']);
    exit;
}

$openAlexApiKey = qpmGetOpenAlexApiKey($domain);
$openAlexEmail = qpmGetOpenAlexEmail($domain);
$requestUrl = 'https://api.openalex.org/sources/' . rawurlencode($sourceId);
if ($openAlexApiKey !== '' || $openAlexEmail !== '') {
    $requestParams = [];
    if ($openAlexApiKey !== '') {
        $requestParams['api_key'] = $openAlexApiKey;
    }
    if ($openAlexEmail !== '') {
        $requestParams['mailto'] = $openAlexEmail;
    }
    $requestUrl .= '?' . http_build_query($requestParams);
}

qpmThrottleNlmRequests(5);
$result = qpmOpenAlexSourceLocalDevProxyRequest($sourceId, $openAlexApiKey, $openAlexEmail);
if (!$result['ok']) {
    $result = qpmHttpRequest($requestUrl, [
        'method' => 'GET',
        'timeout' => 30,
        'user_agent' => 'QuickPubMed/1.0',
        'headers' => ['Accept: application/json'],
    ]);
}

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $shellResult = qpmOpenAlexSourceShellCurlRequest($requestUrl, ['Accept: application/json'], 30);
    if ($shellResult['ok']) {
        $result = [
            'ok' => true,
            'status' => $shellResult['status'],
            'body' => $shellResult['body'],
            'content_type' => 'application/json',
            'error' => '',
        ];
    } else {
        $result['error'] = trim((string)$result['error'] . ' | ' . (string)$shellResult['error'], ' |');
    }
}

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

$decoded = json_decode($result['body'], true);
if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from OpenAlex source']);
    exit;
}

echo json_encode([
    'sourceId' => $sourceId,
    'source' => $decoded,
]);
