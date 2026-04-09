<?php
/**
 * Scite semantic search proxy.
 * Accepts a plain-text query and returns normalized DOI candidates.
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

/**
 * Fallback GET request for Scite with relaxed SSL verification.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmSciteFallbackGetRequest(string $url, array $headers, int $timeout = 45): array
{
    $headerLines = $headers;
    $headerLines[] = 'User-Agent: QuickPubMed/1.0';

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $headerLines),
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
            'error' => $message !== '' ? $message : 'Scite fallback request failed',
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => $status >= 200 && $status < 300 ? '' : 'Scite fallback returned HTTP ' . (string)$status,
    ];
}

/**
 * Last-resort fallback using OS curl binary for Scite GET requests.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmSciteShellCurlRequest(string $url, array $headers, int $timeout = 45): array
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

/**
 * Normalize DOI values from Scite.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeSciteDoi($value): string
{
    $doi = trim((string)$value);
    if ($doi === '') {
        return '';
    }
    $doi = preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $doi);
    $doi = preg_replace('~^doi:\s*~i', '', (string)$doi);
    return trim((string)$doi);
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

$query = trim((string)($params['query'] ?? ''));
$domain = trim((string)($params['domain'] ?? ''));
$configuredLimit = qpmGetSemanticSourceLimit('scite', 100);
$limit = (int)($params['limit'] ?? $configuredLimit);
if ($limit <= 0) {
    $limit = $configuredLimit;
}
if ($limit > $configuredLimit) {
    $limit = $configuredLimit;
}

if ($query === '') {
    echo json_encode([
        'query' => '',
        'pmids' => [],
        'dois' => [],
        'candidates' => [],
        'total' => 0,
    ]);
    exit;
}

$apiKey = qpmGetSciteApiKey($domain);
if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'SCITE_API_KEY is not configured']);
    exit;
}

$requestUrl = qpmGetSciteApiUrl($domain);
$requestParams = [
    'format' => 'json',
    'mode' => 'papers',
    'term' => $query,
    'limit' => $limit,
    'offset' => 0,
];
$requestUrlWithQuery = $requestUrl . '?' . http_build_query($requestParams);
$requestHeaders = [
    'Accept: application/json',
    'Authorization: Bearer ' . $apiKey,
];

qpmThrottleNlmRequests(5);
$result = qpmHttpRequest($requestUrlWithQuery, [
    'method' => 'GET',
    'timeout' => 45,
    'user_agent' => 'QuickPubMed/1.0',
    'headers' => $requestHeaders,
]);

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $fallbackResult = qpmSciteFallbackGetRequest($requestUrlWithQuery, $requestHeaders, 45);
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
    $shellResult = qpmSciteShellCurlRequest($requestUrlWithQuery, $requestHeaders, 45);
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

$decoded = json_decode((string)$result['body'], true);
if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from Scite']);
    exit;
}

$hits = isset($decoded['hits']) && is_array($decoded['hits']) ? $decoded['hits'] : [];
$dois = [];
$candidates = [];

foreach ($hits as $index => $hit) {
    if (!is_array($hit)) {
        continue;
    }
    $doi = qpmNormalizeSciteDoi($hit['doi'] ?? '');
    if ($doi === '') {
        continue;
    }
    $dois[$doi] = true;
    $candidates[] = [
        'source' => 'scite',
        'rank' => $index + 1,
        'pmid' => '',
        'doi' => $doi,
        'title' => trim((string)($hit['title'] ?? '')),
        'abstract' => trim((string)($hit['abstract'] ?? '')),
        'score' => isset($hit['relevancyScore']) ? (float)$hit['relevancyScore'] : null,
        'metadata' => [
            'year' => isset($hit['year']) ? (string)$hit['year'] : '',
            'venue' => trim((string)($hit['journal'] ?? $hit['shortJournal'] ?? '')),
            'publicationTypes' => isset($hit['normalizedTypes']) && is_array($hit['normalizedTypes'])
                ? array_values(array_map('strval', $hit['normalizedTypes']))
                : [],
        ],
    ];
}

echo json_encode([
    'query' => $query,
    'pmids' => [],
    'dois' => array_values(array_keys($dois)),
    'candidates' => $candidates,
    'total' => isset($decoded['count']) ? (int)$decoded['count'] : count($hits),
]);
