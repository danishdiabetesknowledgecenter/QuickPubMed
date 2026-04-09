<?php
/**
 * NLM esearch API Proxy
 * Proxies requests to NCBI E-utilities esearch endpoint
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

qpmApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');

function qpmIsLocalNlmRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function qpmNlmFallbackPostRequest(string $url, array $headers, string $body, int $timeout = 30): array
{
    $headerLines = $headers;
    $headerLines[] = 'User-Agent: QuickPubMed/1.0';

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headerLines),
            'content' => $body,
            'timeout' => $timeout,
            'ignore_errors' => true,
            'protocol_version' => 1.1,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ],
    ]);

    $responseBody = @file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $status = 0;
    if (is_array($responseHeaders)) {
        foreach ($responseHeaders as $index => $line) {
            if ($index === 0 && preg_match('/\s(\d{3})\s/', (string)$line, $matches)) {
                $status = (int)$matches[1];
                break;
            }
        }
    }

    if ($responseBody === false) {
        $lastError = error_get_last();
        $message = is_array($lastError) ? (string)($lastError['message'] ?? '') : '';
        return [
            'ok' => false,
            'status' => $status,
            'body' => '',
            'error' => $message !== '' ? $message : 'NLM fallback request failed',
        ];
    }

    return [
        'ok' => true,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => '',
    ];
}

function qpmNlmShellCurlPostRequest(string $url, array $headers, string $body, int $timeout = 30): array
{
    if (!function_exists('exec')) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'exec() is disabled',
        ];
    }

    $parts = ['curl', '-sS', '-L', '--max-time', (string)max(1, (int)$timeout), '-X', 'POST'];
    foreach ($headers as $header) {
        $parts[] = '-H';
        $parts[] = (string)$header;
    }
    $parts[] = '--data';
    $parts[] = $body;
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
    $responseBody = implode("\n", $output);

    if ($exitCode !== 0) {
        return [
            'ok' => false,
            'status' => $status,
            'body' => $responseBody,
            'error' => 'curl binary failed with exit code ' . (string)$exitCode,
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => $status >= 200 && $status < 300 ? '' : 'curl binary returned HTTP ' . (string)$status,
    ];
}

function qpmNlmLocalDevProxyRequest(string $body, int $timeout = 30): array
{
    $hosts = ['localhost', '127.0.0.1'];
    if (!qpmIsLocalNlmRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/nlm-api/entrez/eutils/esearch.fcgi';
        $result = qpmHttpRequest($url, [
            'method' => 'POST',
            'timeout' => $timeout,
            'user_agent' => 'QuickPubMed/1.0',
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body' => $body,
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

// Build NLM API URL with server-side credentials
$params = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
if (empty($params)) {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        parse_str($rawInput, $params);
    }
}
if (empty($params)) {
    $params = $_GET;
}
$domain = qpmResolveDomain();
$params['api_key'] = qpmGetNlmApiKey($domain);
$params['email'] = qpmGetNlmEmail($domain);
$params['tool'] = 'QuickPubMed';
$params['db'] = $params['db'] ?? 'pubmed';
$params['retmode'] = $params['retmode'] ?? 'json';
$nlmBaseUrl = qpmGetNlmBaseUrl($domain);

$url = $nlmBaseUrl . '/esearch.fcgi';

// Make request to NLM (use POST to avoid long URL issues)
qpmThrottleNlmRequests(10);
$requestBody = http_build_query($params);
$requestHeaders = ['Content-Type' => 'application/x-www-form-urlencoded'];

$result = qpmNlmLocalDevProxyRequest($requestBody, 30);
if (!$result['ok']) {
    $result = qpmHttpRequest($url, [
        'method' => 'POST',
        'timeout' => 30,
        'user_agent' => 'QuickPubMed/1.0',
        'headers' => $requestHeaders,
        'body' => $requestBody,
    ]);
}

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $fallbackResult = qpmNlmFallbackPostRequest($url, $requestHeaders, $requestBody, 30);
    if ($fallbackResult['ok']) {
        $result = [
            'ok' => true,
            'status' => $fallbackResult['status'],
            'body' => $fallbackResult['body'],
            'content_type' => 'application/json',
            'error' => '',
        ];
    } else {
        $result['error'] = trim((string)$result['error'] . ' | ' . (string)$fallbackResult['error'], ' |');
    }
}

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $shellCurlResult = qpmNlmShellCurlPostRequest($url, $requestHeaders, $requestBody, 30);
    if ($shellCurlResult['ok']) {
        $result = [
            'ok' => true,
            'status' => $shellCurlResult['status'],
            'body' => $shellCurlResult['body'],
            'content_type' => 'application/json',
            'error' => '',
        ];
    } else {
        $result['error'] = trim((string)$result['error'] . ' | ' . (string)$shellCurlResult['error'], ' |');
    }
}

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
