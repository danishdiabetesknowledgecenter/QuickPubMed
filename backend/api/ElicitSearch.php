<?php
/**
 * Elicit semantic search proxy.
 * Accepts a plain-text query and returns normalized PMID/DOI candidates.
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
 * Detect local development host.
 *
 * @return bool
 */
function qpmIsLocalElicitRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

/**
 * Fallback HTTP POST request for Elicit with relaxed SSL verification.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param string $body
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmElicitFallbackRequest(string $url, array $headers, string $body, int $timeout = 45): array
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
            'error' => $message !== '' ? $message : 'Elicit fallback request failed',
            'response_headers' => is_array($responseHeaders) ? array_values($responseHeaders) : [],
        ];
    }

    return [
        'ok' => true,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => '',
        'response_headers' => is_array($responseHeaders) ? array_values($responseHeaders) : [],
    ];
}

/**
 * HTTP request helper for Elicit that preserves response headers.
 *
 * @param string $url
 * @param array<string,mixed> $options
 * @return array{ok: bool, status: int, body: string, content_type: string, error: string, response_headers: array<int,string>}
 */
function qpmElicitHttpRequest(string $url, array $options = []): array
{
    $method = strtoupper((string)($options['method'] ?? 'GET'));
    $headers = $options['headers'] ?? [];
    $timeout = (int)($options['timeout'] ?? 30);
    $userAgent = (string)($options['user_agent'] ?? 'QuickPubMed/1.0');
    $body = (string)($options['body'] ?? '');

    if (function_exists('curl_init')) {
        $curlHeaders = [];
        foreach ($headers as $name => $value) {
            if (is_int($name)) {
                $curlHeaders[] = (string)$value;
            } else {
                $curlHeaders[] = $name . ': ' . $value;
            }
        }
        if ($userAgent !== '') {
            $curlHeaders[] = 'User-Agent: ' . $userAgent;
        }

        $responseHeaders = [];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $curlHeaders,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HEADERFUNCTION => static function ($curl, $line) use (&$responseHeaders) {
                $trimmed = trim((string)$line);
                if ($trimmed !== '') {
                    $responseHeaders[] = $trimmed;
                }
                return strlen((string)$line);
            },
        ]);

        $responseBody = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = (string)(curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?? '');
        $error = curl_errno($ch) ? (string)curl_error($ch) : '';
        curl_close($ch);

        if ($responseBody === false) {
            $responseBody = '';
        }

        return [
            'ok' => $error === '',
            'status' => $status,
            'body' => (string)$responseBody,
            'content_type' => $contentType,
            'error' => $error,
            'response_headers' => $responseHeaders,
        ];
    }

    $headerLines = [];
    foreach ($headers as $name => $value) {
        if (is_int($name)) {
            $headerLines[] = (string)$value;
        } else {
            $headerLines[] = $name . ': ' . $value;
        }
    }
    if ($userAgent !== '') {
        $headerLines[] = 'User-Agent: ' . $userAgent;
    }

    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headerLines),
            'content' => $body,
            'timeout' => $timeout,
            'ignore_errors' => true,
            'protocol_version' => 1.1,
        ],
    ]);

    $responseBody = @file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $status = 0;
    $contentType = '';
    if (is_array($responseHeaders)) {
        foreach ($responseHeaders as $index => $line) {
            if ($index === 0 && preg_match('/\s(\d{3})\s/', (string)$line, $matches)) {
                $status = (int)$matches[1];
                continue;
            }
            if (stripos((string)$line, 'Content-Type:') === 0) {
                $contentType = trim(substr((string)$line, strlen('Content-Type:')));
            }
        }
    }

    $error = '';
    if ($responseBody === false) {
        $responseBody = '';
        $error = 'HTTP request failed (stream fallback)';
    }

    return [
        'ok' => $error === '',
        'status' => $status,
        'body' => (string)$responseBody,
        'content_type' => $contentType,
        'error' => $error,
        'response_headers' => is_array($responseHeaders) ? array_values($responseHeaders) : [],
    ];
}

/**
 * Last-resort fallback using OS curl binary for Elicit POST requests.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param string $body
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmElicitShellCurlRequest(string $url, array $headers, string $body, int $timeout = 45): array
{
    if (!function_exists('exec')) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'exec() is disabled',
            'response_headers' => [],
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
            'response_headers' => [],
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
            'response_headers' => [],
        ];
    }

    return [
        'ok' => true,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => '',
        'response_headers' => [],
    ];
}

/**
 * Local dev fallback through Vite proxy (http), still backend-initiated.
 *
 * @param string $body
 * @param array<int,string> $headers
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmElicitLocalDevProxyRequest(string $body, array $headers): array
{
    $hosts = ['localhost', '127.0.0.1'];
    if (!qpmIsLocalElicitRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
            'response_headers' => [],
        ];
    }

    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/elicit-api/api/v1/search';
        $result = qpmElicitHttpRequest($url, [
            'method' => 'POST',
            'timeout' => 45,
            'user_agent' => 'QuickPubMed/1.0',
            'headers' => $headers,
            'body' => $body,
        ]);
        if ($result['ok']) {
            return [
                'ok' => true,
                'status' => (int)$result['status'],
                'body' => (string)$result['body'],
                'error' => '',
                'response_headers' => is_array($result['response_headers'] ?? null)
                    ? array_values($result['response_headers'])
                    : [],
            ];
        }
        $errors[] = $host . ': ' . ($result['error'] !== '' ? $result['error'] : ('HTTP ' . (string)$result['status']));
    }

    return [
        'ok' => false,
        'status' => 0,
        'body' => '',
        'error' => implode(' | ', $errors),
        'response_headers' => [],
    ];
}

/**
 * Convert raw response headers to a lower-cased map.
 *
 * @param array<int,string> $headers
 * @return array<string,string>
 */
function qpmElicitBuildHeaderMap(array $headers): array
{
    $headerMap = [];
    foreach ($headers as $line) {
        $separatorPos = strpos((string)$line, ':');
        if ($separatorPos === false) {
            continue;
        }
        $name = strtolower(trim(substr((string)$line, 0, $separatorPos)));
        $value = trim(substr((string)$line, $separatorPos + 1));
        if ($name === '') {
            continue;
        }
        if (isset($headerMap[$name]) && $headerMap[$name] !== '' && $value === '') {
            continue;
        }
        $headerMap[$name] = $value;
    }
    return $headerMap;
}

/**
 * Extract the first integer value from a response header.
 *
 * @param string $value
 * @return ?int
 */
function qpmElicitParseIntegerHeaderValue(string $value): ?int
{
    $normalizedValue = trim($value);
    if ($normalizedValue === '') {
        return null;
    }

    if (preg_match('/-?\d+/', $normalizedValue, $matches)) {
        return (int)$matches[0];
    }

    return null;
}

/**
 * Parse Elicit reset header into ISO datetime and seconds remaining.
 *
 * @param string $resetValue
 * @param string $retryAfterValue
 * @return array{resetAt: string, resetInSeconds: ?int}
 */
function qpmElicitParseResetWindow(string $resetValue, string $retryAfterValue): array
{
    $nowTs = time();
    $targetTs = 0;
    $normalizedResetValue = trim($resetValue);
    $normalizedRetryAfterValue = trim($retryAfterValue);

    if ($normalizedResetValue !== '') {
        $numericReset = qpmElicitParseIntegerHeaderValue($normalizedResetValue);
        if ($numericReset !== null) {
            if ($numericReset > 1000000000000) {
                $targetTs = (int)floor($numericReset / 1000);
            } elseif ($numericReset > 1000000000) {
                $targetTs = $numericReset;
            } elseif ($numericReset > 0) {
                $targetTs = $nowTs + $numericReset;
            }
        } else {
            $parsedTs = strtotime($normalizedResetValue);
            if ($parsedTs !== false) {
                $targetTs = (int)$parsedTs;
            }
        }
    }

    if ($targetTs <= 0 && $normalizedRetryAfterValue !== '') {
        if (preg_match('/^\d+$/', $normalizedRetryAfterValue)) {
            $targetTs = $nowTs + (int)$normalizedRetryAfterValue;
        } else {
            $parsedTs = strtotime($normalizedRetryAfterValue);
            if ($parsedTs !== false) {
                $targetTs = (int)$parsedTs;
            }
        }
    }

    if ($targetTs <= 0) {
        return [
            'resetAt' => '',
            'resetInSeconds' => null,
        ];
    }

    return [
        'resetAt' => gmdate('c', $targetTs),
        'resetInSeconds' => max(0, $targetTs - $nowTs),
    ];
}

/**
 * Extract Elicit rate limit metadata from response headers.
 *
 * @param array<int,string> $headers
 * @param int $status
 * @return array<string,mixed>
 */
function qpmElicitBuildRateLimitInfo(array $headers, int $status): array
{
    $headerMap = qpmElicitBuildHeaderMap($headers);
    $limit = qpmElicitParseIntegerHeaderValue((string)($headerMap['x-ratelimit-limit'] ?? ''));
    if ($limit !== null && $limit <= 0) {
        $limit = null;
    }
    $remaining = null;
    $remainingValue = qpmElicitParseIntegerHeaderValue((string)($headerMap['x-ratelimit-remaining'] ?? ''));
    if ($remainingValue !== null) {
        $remaining = max(0, $remainingValue);
    } elseif ($status === 429) {
        $remaining = 0;
    }

    $resetWindow = qpmElicitParseResetWindow(
        (string)($headerMap['x-ratelimit-reset'] ?? ''),
        (string)($headerMap['retry-after'] ?? '')
    );

    return [
        'limit' => $limit,
        'remaining' => $remaining,
        'resetAt' => $resetWindow['resetAt'],
        'resetInSeconds' => $resetWindow['resetInSeconds'],
        'status' => $status,
        'isLimited' => $status === 429 || ($remaining !== null && $remaining <= 0),
    ];
}

/**
 * Normalize PMIDs from Elicit values.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeElicitPmid($value): string
{
    $pmid = trim((string) $value);
    return preg_match('/^[0-9]+$/', $pmid) ? $pmid : '';
}

/**
 * Normalize DOI values from Elicit.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeElicitDoi($value): string
{
    $doi = trim((string) $value);
    if ($doi === '') {
        return '';
    }
    $doi = preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $doi);
    $doi = preg_replace('~^doi:\s*~i', '', (string) $doi);
    return trim((string) $doi);
}

/**
 * Normalize Elicit typeTags to documented values.
 *
 * @param mixed $value
 * @return array<int,string>
 */
function qpmNormalizeElicitTypeTags($value): array
{
    $values = is_array($value) ? $value : [$value];
    $seen = [];
    $output = [];
    $allowed = [
        'review' => 'Review',
        'meta-analysis' => 'Meta-Analysis',
        'metaanalysis' => 'Meta-Analysis',
        'systematic review' => 'Systematic Review',
        'systematicreview' => 'Systematic Review',
        'rct' => 'RCT',
        'longitudinal' => 'Longitudinal',
    ];
    foreach ($values as $entry) {
        $normalized = strtolower(trim((string) $entry));
        if ($normalized === '') {
            continue;
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $resolved = $allowed[$normalized] ?? $allowed[$compact] ?? '';
        if ($resolved === '' || isset($seen[$resolved])) {
            continue;
        }
        $seen[$resolved] = true;
        $output[] = $resolved;
    }
    return $output;
}

/**
 * Normalize keyword list for Elicit filters.
 *
 * @param mixed $value
 * @return array<int,string>
 */
function qpmNormalizeElicitKeywords($value): array
{
    $values = is_array($value) ? $value : [$value];
    $seen = [];
    $output = [];
    foreach ($values as $entry) {
        $normalized = trim((string) $entry);
        if ($normalized === '') {
            continue;
        }
        $key = strtolower($normalized);
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $output[] = $normalized;
    }
    return $output;
}

/**
 * Extract an upstream Elicit error message from a decoded response body.
 *
 * @param array<string,mixed> $decoded
 * @return string
 */
function qpmExtractElicitErrorMessage(array $decoded): string
{
    $error = $decoded['error'] ?? '';
    if (is_string($error) && trim($error) !== '') {
        return trim($error);
    }
    if (is_array($error)) {
        $nestedMessage = $error['message'] ?? $error['detail'] ?? $error['code'] ?? '';
        if (is_string($nestedMessage) && trim($nestedMessage) !== '') {
            return trim($nestedMessage);
        }
    }

    foreach ([$decoded['message'] ?? '', $decoded['detail'] ?? ''] as $candidate) {
        if (is_string($candidate) && trim($candidate) !== '') {
            return trim($candidate);
        }
    }

    return '';
}

/**
 * Build structured retry hints for filter-specific Elicit request failures.
 *
 * @param string $message
 * @param array<string,mixed> $filters
 * @return array<string,mixed>
 */
function qpmBuildElicitRetryHints(string $message, array $filters): array
{
    $normalized = strtolower(trim($message));
    if ($normalized === '') {
        return [];
    }

    $requestFields = [];
    if (
        !empty($filters['typeTags']) &&
        (
            strpos($normalized, 'typetags') !== false ||
            strpos($normalized, 'type_tags') !== false ||
            strpos($normalized, 'type tags') !== false
        )
    ) {
        $requestFields[] = 'typeTags';
    }
    if (
        !empty($filters['includeKeywords']) &&
        (
            strpos($normalized, 'includekeywords') !== false ||
            strpos($normalized, 'include_keywords') !== false ||
            strpos($normalized, 'include keywords') !== false
        )
    ) {
        $requestFields[] = 'includeKeywords';
    }
    if (
        !empty($filters['excludeKeywords']) &&
        (
            strpos($normalized, 'excludekeywords') !== false ||
            strpos($normalized, 'exclude_keywords') !== false ||
            strpos($normalized, 'exclude keywords') !== false
        )
    ) {
        $requestFields[] = 'excludeKeywords';
    }

    $requestFields = array_values(array_unique($requestFields));
    if (empty($requestFields)) {
        return [];
    }

    return [
        'requestFields' => $requestFields,
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

$query = trim((string) ($params['query'] ?? ''));
$configuredLimit = qpmGetSemanticSourceLimit('elicit', 100);
$limit = (int) ($params['limit'] ?? $configuredLimit);
$rawFilters = isset($params['filters']) && is_array($params['filters']) ? $params['filters'] : [];
$debugSearchFlow = qpmIsSearchFlowDebugRequest($params);
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

$apiKey = defined('ELICIT_API_KEY') ? trim((string) ELICIT_API_KEY) : '';
if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'ELICIT_API_KEY is not configured']);
    exit;
}

$requestHeaders = [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
];
$filters = [];
$typeTags = qpmNormalizeElicitTypeTags($rawFilters['typeTags'] ?? []);
if (!empty($typeTags)) {
    $filters['typeTags'] = $typeTags;
}
$includeKeywords = qpmNormalizeElicitKeywords($rawFilters['includeKeywords'] ?? []);
if (!empty($includeKeywords)) {
    $filters['includeKeywords'] = $includeKeywords;
}
$excludeKeywords = qpmNormalizeElicitKeywords($rawFilters['excludeKeywords'] ?? []);
if (!empty($excludeKeywords)) {
    $filters['excludeKeywords'] = $excludeKeywords;
}
$requestPayload = [
    'query' => $query,
    'maxResults' => $limit,
];
if (!empty($filters)) {
    $requestPayload['filters'] = $filters;
}
$requestBody = json_encode($requestPayload);

$elicitUrl = 'https://elicit.com/api/v1/search';

$result = qpmElicitLocalDevProxyRequest($requestBody, $requestHeaders);
if (!$result['ok']) {
    $result = qpmElicitHttpRequest($elicitUrl, [
        'method' => 'POST',
        'timeout' => 45,
        'user_agent' => 'QuickPubMed/1.0',
        'headers' => $requestHeaders,
        'body' => $requestBody,
    ]);
}

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $fallbackResult = qpmElicitFallbackRequest(
        $elicitUrl,
        $requestHeaders,
        $requestBody,
        45
    );
    if ($fallbackResult['ok']) {
        $result = [
            'ok' => true,
            'status' => $fallbackResult['status'],
            'body' => $fallbackResult['body'],
            'content_type' => 'application/json',
            'error' => '',
            'response_headers' => $fallbackResult['response_headers'],
        ];
    } else {
        $result['error'] = trim((string)$result['error'] . ' | ' . (string)$fallbackResult['error'], ' |');
    }
}

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $shellCurlResult = qpmElicitShellCurlRequest(
        $elicitUrl,
        $requestHeaders,
        $requestBody,
        45
    );
    if ($shellCurlResult['ok']) {
        $result = [
            'ok' => true,
            'status' => $shellCurlResult['status'],
            'body' => $shellCurlResult['body'],
            'content_type' => 'application/json',
            'error' => '',
            'response_headers' => $shellCurlResult['response_headers'],
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

$decoded = json_decode($result['body'], true);
if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from Elicit']);
    exit;
}

$rateLimit = qpmElicitBuildRateLimitInfo(
    is_array($result['response_headers'] ?? null) ? $result['response_headers'] : [],
    (int)($result['status'] ?? 0)
);
$upstreamError = qpmExtractElicitErrorMessage($decoded);
$retryHints = qpmBuildElicitRetryHints($upstreamError, $filters);

$papers = $decoded['papers'] ?? [];
if (!is_array($papers)) {
    $papers = [];
}

$pmids = [];
$dois = [];
$candidates = [];
$debugDroppedRecords = [];
$debugDroppedReasons = [];

foreach ($papers as $index => $paper) {
    if (!is_array($paper)) {
        continue;
    }
    $pmid = qpmNormalizeElicitPmid($paper['pmid'] ?? '');
    $doi = qpmNormalizeElicitDoi($paper['doi'] ?? '');
    if ($pmid === '' && $doi === '') {
        if ($debugSearchFlow) {
            $debugDroppedReasons['missing_pmid_and_doi'] = (int) ($debugDroppedReasons['missing_pmid_and_doi'] ?? 0) + 1;
            $debugDroppedRecords[] = [
                'source' => 'elicit',
                'rank' => $index + 1,
                'pmid' => '',
                'doi' => '',
                'title' => trim((string) ($paper['title'] ?? '')),
                'reason' => 'missing_pmid_and_doi',
            ];
        }
        continue;
    }

    if ($pmid !== '') {
        $pmids[$pmid] = true;
    }
    if ($doi !== '') {
        $dois[$doi] = true;
    }

    $candidates[] = [
        'source' => 'elicit',
        'rank' => $index + 1,
        'pmid' => $pmid,
        'doi' => $doi,
        'title' => trim((string) ($paper['title'] ?? '')),
        'score' => null,
        'metadata' => [
            'year' => isset($paper['year']) ? (string) $paper['year'] : '',
            'venue' => trim((string) ($paper['journal'] ?? $paper['journal_name'] ?? $paper['venue'] ?? '')),
            'publicationTypes' => isset($paper['publication_types']) && is_array($paper['publication_types'])
                ? array_values(array_map('strval', $paper['publication_types']))
                : [],
        ],
    ];
}

echo json_encode([
    'query' => $query,
    'pmids' => array_values(array_keys($pmids)),
    'dois' => array_values(array_keys($dois)),
    'candidates' => $candidates,
    'total' => count($papers),
    'error' => $upstreamError,
    'retryHints' => !empty($retryHints) ? $retryHints : (object)[],
    'rateLimit' => $rateLimit,
    'debug' => $debugSearchFlow ? [
        'upstreamTotal' => count($papers),
        'normalizedTotal' => count($candidates),
        'droppedBeforeReturn' => count($debugDroppedRecords),
        'droppedReasons' => (object) $debugDroppedReasons,
        'droppedRecords' => $debugDroppedRecords,
    ] : (object) [],
]);
