<?php
/**
 * CORE semantic-style search proxy.
 * Uses the deduplicated works search with a title/abstract-focused query.
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
function qpmIsLocalCoreRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

/**
 * Local dev fallback through Vite proxy (http), still backend-initiated.
 *
 * @param string $proxyPath
 * @param string $body
 * @param array<int,string> $headers
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmCoreLocalDevProxyRequest(string $proxyPath, string $body, array $headers): array
{
    $hosts = ['localhost', '127.0.0.1'];
    $lastStatus = 0;
    if (!qpmIsLocalCoreRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $normalizedProxyPath = '/' . ltrim($proxyPath, '/');
    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173' . $normalizedProxyPath;
        $result = qpmHttpRequest($url, [
            'method' => 'POST',
            'timeout' => 45,
            'user_agent' => 'QuickPubMed/1.0',
            'headers' => $headers,
            'body' => $body,
        ]);
        $lastStatus = (int)($result['status'] ?? 0);
        if ($result['ok'] && $lastStatus >= 200 && $lastStatus < 300) {
            return [
                'ok' => true,
                'status' => $lastStatus,
                'body' => (string)$result['body'],
                'error' => '',
            ];
        }
        $errors[] = $host . ': ' . ($result['error'] !== '' ? $result['error'] : ('HTTP ' . (string)$lastStatus));
    }

    return [
        'ok' => false,
        'status' => $lastStatus,
        'body' => '',
        'error' => implode(' | ', $errors),
    ];
}

/**
 * Fallback HTTP request for CORE with relaxed SSL verification.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param string $method
 * @param string $body
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmCoreFallbackRequest(
    string $url,
    array $headers,
    string $method = 'GET',
    string $body = '',
    int $timeout = 45
): array
{
    $headerLines = $headers;
    $headerLines[] = 'User-Agent: QuickPubMed/1.0';

    $context = stream_context_create([
        'http' => [
            'method' => strtoupper($method),
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
            'error' => $message !== '' ? $message : 'CORE fallback request failed',
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => $status >= 200 && $status < 300 ? '' : 'CORE fallback returned HTTP ' . (string)$status,
    ];
}

/**
 * Last-resort fallback using OS curl binary for CORE requests.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param string $method
 * @param string $body
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmCoreShellCurlRequest(
    string $url,
    array $headers,
    string $method = 'GET',
    string $body = '',
    int $timeout = 45
): array
{
    if (!function_exists('exec')) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'exec() is disabled',
        ];
    }

    $parts = ['curl', '-sS', '-L', '--max-time', (string)max(1, (int)$timeout), '-X', strtoupper($method)];
    foreach ($headers as $header) {
        $parts[] = '-H';
        $parts[] = (string)$header;
    }
    if ($body !== '') {
        $parts[] = '--data';
        $parts[] = $body;
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
 * Windows-specific fallback using PowerShell web request.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param string $method
 * @param string $body
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmCorePowerShellRequest(
    string $url,
    array $headers,
    string $method = 'GET',
    string $body = '',
    int $timeout = 45
): array
{
    if (DIRECTORY_SEPARATOR !== '\\' || !function_exists('exec')) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'PowerShell fallback unavailable',
        ];
    }

    $headerMap = [];
    foreach ($headers as $headerLine) {
        $separatorPos = strpos((string)$headerLine, ':');
        if ($separatorPos === false) {
            continue;
        }
        $name = trim(substr((string)$headerLine, 0, $separatorPos));
        $value = trim(substr((string)$headerLine, $separatorPos + 1));
        if ($name === '') {
            continue;
        }
        $headerMap[$name] = $value;
    }

    $script = <<<'PS'
$ErrorActionPreference = 'Stop'
$headersJson = $env:QPM_CORE_HEADERS_JSON
$body = $env:QPM_CORE_BODY
$url = $env:QPM_CORE_URL
$method = $env:QPM_CORE_METHOD
$timeoutSec = [int]$env:QPM_CORE_TIMEOUT
$headers = @{}
if (![string]::IsNullOrWhiteSpace($headersJson)) {
    $decoded = ConvertFrom-Json $headersJson
    foreach ($prop in $decoded.PSObject.Properties) {
        $headers[$prop.Name] = [string]$prop.Value
    }
}
try {
    $params = @{
        Uri = $url
        Method = $method
        Headers = $headers
        TimeoutSec = $timeoutSec
        UseBasicParsing = $true
    }
    if ($method -ne 'GET' -and $body -ne '') {
        $params['Body'] = $body
    }
    $response = Invoke-WebRequest @params
    $status = [int]$response.StatusCode
    $content = if ($null -ne $response.Content) { [string]$response.Content } else { '' }
    Write-Output $content
    Write-Output '__QPM_STATUS__:' + $status
    exit 0
} catch {
    if ($_.Exception.Response) {
        $response = $_.Exception.Response
        $status = [int]$response.StatusCode.value__
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $reader.Close()
        if ($stream) {
            $stream.Close()
        }
        Write-Output $content
        Write-Output '__QPM_STATUS__:' + $status
        exit 0
    }
    Write-Output '__QPM_ERROR__:' + $_.Exception.Message
    exit 1
}
PS;

    $scriptUtf16 = function_exists('mb_convert_encoding')
        ? mb_convert_encoding($script, 'UTF-16LE', 'UTF-8')
        : (function_exists('iconv') ? iconv('UTF-8', 'UTF-16LE', $script) : false);
    if (!is_string($scriptUtf16) || $scriptUtf16 === '') {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'Could not encode PowerShell script',
        ];
    }
    $encodedScript = base64_encode($scriptUtf16);
    putenv('QPM_CORE_URL=' . $url);
    putenv('QPM_CORE_METHOD=' . strtoupper($method));
    putenv('QPM_CORE_TIMEOUT=' . (string)max(1, (int)$timeout));
    putenv('QPM_CORE_BODY=' . $body);
    putenv('QPM_CORE_HEADERS_JSON=' . json_encode($headerMap));

    $command = 'powershell -NoProfile -NonInteractive -EncodedCommand ' . escapeshellarg($encodedScript);
    $output = [];
    $exitCode = 0;
    @exec($command, $output, $exitCode);

    putenv('QPM_CORE_URL');
    putenv('QPM_CORE_METHOD');
    putenv('QPM_CORE_TIMEOUT');
    putenv('QPM_CORE_BODY');
    putenv('QPM_CORE_HEADERS_JSON');

    if (!is_array($output) || count($output) === 0) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'PowerShell produced no output',
        ];
    }

    $status = 0;
    $error = '';
    $bodyLines = [];
    foreach ($output as $line) {
        $text = (string)$line;
        if (strpos($text, '__QPM_STATUS__:') === 0) {
            $status = (int)substr($text, strlen('__QPM_STATUS__:'));
            continue;
        }
        if (strpos($text, '__QPM_ERROR__:') === 0) {
            $error = trim(substr($text, strlen('__QPM_ERROR__:')));
            continue;
        }
        $bodyLines[] = $text;
    }

    $responseBody = implode("\n", $bodyLines);
    if ($error !== '') {
        return [
            'ok' => false,
            'status' => $status,
            'body' => $responseBody,
            'error' => $error,
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => $responseBody,
        'error' => $status >= 200 && $status < 300 ? '' : 'PowerShell returned HTTP ' . (string)$status,
    ];
}

/**
 * Normalize DOI values from CORE.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeCoreDoi($value): string
{
    $doi = trim((string)$value);
    if ($doi === '') {
        return '';
    }
    $doi = preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $doi);
    $doi = preg_replace('~^doi:\s*~i', '', (string)$doi);
    return trim((string)$doi);
}

/**
 * Normalize PMID values from CORE.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeCorePmid($value): string
{
    if (is_array($value)) {
        $candidates = [
            $value['value'] ?? null,
            $value['id'] ?? null,
            $value['pmid'] ?? null,
            $value['preferred'] ?? null,
        ];
        foreach ($candidates as $candidate) {
            $normalized = qpmNormalizeCorePmid($candidate);
            if ($normalized !== '') {
                return $normalized;
            }
        }
        return '';
    }

    $pmid = trim((string)$value);
    return preg_match('/^[0-9]+$/', $pmid) ? $pmid : '';
}

/**
 * Extract DOI from a CORE work payload.
 *
 * @param array<string,mixed> $work
 * @return string
 */
function qpmExtractCoreDoi(array $work): string
{
    $direct = qpmNormalizeCoreDoi($work['doi'] ?? '');
    if ($direct !== '') {
        return $direct;
    }

    $identifiers = $work['identifiers'] ?? [];
    if (is_array($identifiers)) {
        foreach ($identifiers as $identifier) {
            if (is_array($identifier)) {
                $type = strtolower(trim((string)($identifier['type'] ?? '')));
                if ($type === 'doi') {
                    $resolved = qpmNormalizeCoreDoi($identifier['identifier'] ?? '');
                    if ($resolved !== '') {
                        return $resolved;
                    }
                }
            }
        }
    }

    return '';
}

/**
 * Extract PMID from a CORE work payload.
 *
 * @param array<string,mixed> $work
 * @return string
 */
function qpmExtractCorePmid(array $work): string
{
    $direct = qpmNormalizeCorePmid($work['pubmedId'] ?? $work['pubmed_id'] ?? '');
    if ($direct !== '') {
        return $direct;
    }

    $identifiers = $work['identifiers'] ?? [];
    if (is_array($identifiers)) {
        foreach ($identifiers as $identifier) {
            if (!is_array($identifier)) {
                continue;
            }
            $type = strtolower(trim((string)($identifier['type'] ?? '')));
            if (!in_array($type, ['pubmed', 'pubmedid', 'pmid'], true)) {
                continue;
            }
            $resolved = qpmNormalizeCorePmid($identifier['identifier'] ?? '');
            if ($resolved !== '') {
                return $resolved;
            }
        }
    }

    return '';
}

/**
 * Extract journal/venue title from a CORE work payload.
 *
 * @param array<string,mixed> $work
 * @return string
 */
function qpmExtractCoreVenue(array $work): string
{
    $journals = $work['journals'] ?? [];
    if (is_array($journals)) {
        foreach ($journals as $journal) {
            if (!is_array($journal)) {
                continue;
            }
            $title = trim((string)($journal['title'] ?? ''));
            if ($title !== '') {
                return $title;
            }
        }
    }

    return '';
}

/**
 * Normalize free-text for CORE query construction.
 *
 * @param string $value
 * @return string
 */
function qpmNormalizeCoreQueryText(string $value): string
{
    return trim((string)preg_replace('/\s+/u', ' ', $value));
}

/**
 * Sanitize text before embedding it in a CORE field lookup.
 *
 * @param string $value
 * @return string
 */
function qpmSanitizeCoreFieldLookupValue(string $value): string
{
    $sanitized = preg_replace('/["():\[\]\{\}]+/u', ' ', $value);
    return qpmNormalizeCoreQueryText((string)$sanitized);
}

/**
 * Quote a CORE field lookup value.
 *
 * @param string $value
 * @return string
 */
function qpmQuoteCoreFieldLookupValue(string $value): string
{
    $sanitized = qpmSanitizeCoreFieldLookupValue($value);
    return $sanitized !== '' ? '"' . $sanitized . '"' : '';
}

/**
 * Normalize string filter arrays received from the frontend.
 *
 * @param mixed $value
 * @return array<int,string>
 */
function qpmNormalizeCoreFilterStringArray($value): array
{
    if (!is_array($value)) {
        return [];
    }

    $normalizedValues = [];
    foreach ($value as $entry) {
        $normalized = qpmSanitizeCoreFieldLookupValue((string)$entry);
        if ($normalized === '') {
            continue;
        }
        $normalizedValues[strtolower($normalized)] = $normalized;
    }

    return array_values($normalizedValues);
}

/**
 * Normalize year filters received from the frontend.
 *
 * @param mixed $value
 * @return array<int,int>
 */
function qpmNormalizeCoreYearFilterArray($value): array
{
    if (!is_array($value)) {
        return [];
    }

    $years = [];
    foreach ($value as $entry) {
        $year = (int)$entry;
        if ($year > 0) {
            $years[$year] = $year;
        }
    }
    ksort($years);

    return array_values($years);
}

/**
 * Build a more precise CORE works query from free text and existing hard filters.
 *
 * @param string $query
 * @param array<string,mixed> $filters
 * @return string
 */
function qpmBuildCoreWorksQuery(string $query, array $filters = []): string
{
    $normalizedQuery = qpmNormalizeCoreQueryText($query);
    if ($normalizedQuery === '') {
        return '';
    }

    $keywordQuery = qpmSanitizeCoreFieldLookupValue($normalizedQuery);
    $phraseQuery = qpmQuoteCoreFieldLookupValue($normalizedQuery);
    $textClauses = [];
    if ($phraseQuery !== '') {
        $textClauses[] = 'title:' . $phraseQuery;
        $textClauses[] = 'abstract:' . $phraseQuery;
    }
    if ($keywordQuery !== '') {
        $textClauses[] = 'title:' . $keywordQuery;
        $textClauses[] = 'abstract:' . $keywordQuery;
    }
    $textClauses = array_values(array_unique($textClauses));
    if (empty($textClauses)) {
        return '';
    }

    $queryClauses = ['(' . implode(' OR ', $textClauses) . ')'];

    $documentTypes = qpmNormalizeCoreFilterStringArray($filters['documentType'] ?? []);
    if (!empty($documentTypes)) {
        $documentTypeClauses = [];
        foreach ($documentTypes as $documentType) {
            $quotedValue = qpmQuoteCoreFieldLookupValue($documentType);
            if ($quotedValue !== '') {
                $documentTypeClauses[] = 'documentType:' . $quotedValue;
            }
        }
        $documentTypeClauses = array_values(array_unique($documentTypeClauses));
        if (!empty($documentTypeClauses)) {
            $queryClauses[] = '(' . implode(' OR ', $documentTypeClauses) . ')';
        }
    }

    $publicationYears = qpmNormalizeCoreYearFilterArray(
        $filters['publicationYear'] ?? ($filters['publicationDateYears'] ?? [])
    );
    if (!empty($publicationYears)) {
        $yearClauses = [];
        foreach ($publicationYears as $publicationYear) {
            $yearClauses[] = 'yearPublished:' . (string)$publicationYear;
        }
        $queryClauses[] = count($yearClauses) === 1
            ? $yearClauses[0]
            : '(' . implode(' OR ', $yearClauses) . ')';
    }

    return implode(' AND ', $queryClauses);
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
$filters = isset($params['filters']) && is_array($params['filters']) ? $params['filters'] : [];
$domain = trim((string)($params['domain'] ?? ''));
$configuredLimit = qpmGetSemanticSourceLimit('core', 100);
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

$apiKey = qpmGetCoreApiKey($domain);
if ($apiKey === '') {
    http_response_code(500);
    echo json_encode(['error' => 'CORE_API_KEY is not configured']);
    exit;
}

$requestUrl = rtrim(qpmGetCoreApiUrl($domain), '/');
$requestUrlPath = (string)(parse_url($requestUrl, PHP_URL_PATH) ?? '/v3/search/works');
$resolvedQuery = qpmBuildCoreWorksQuery($query, $filters);
$requestPayload = [
    'q' => $resolvedQuery !== '' ? $resolvedQuery : $query,
    'scroll' => false,
    'offset' => 0,
    'limit' => $limit,
    'stats' => false,
];
$requestBody = json_encode($requestPayload);
$requestHeaders = [
    'Accept: application/json',
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey,
];

qpmThrottleNlmRequests(5);
$result = qpmCoreLocalDevProxyRequest('/core-api' . $requestUrlPath, $requestBody, $requestHeaders);
if (!$result['ok']) {
    $result = qpmHttpRequest($requestUrl, [
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
    $fallbackResult = qpmCoreFallbackRequest($requestUrl, $requestHeaders, 'POST', $requestBody, 45);
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
    $powerShellResult = qpmCorePowerShellRequest($requestUrl, $requestHeaders, 'POST', $requestBody, 45);
    if ($powerShellResult['ok']) {
        $result = [
            'ok' => true,
            'status' => $powerShellResult['status'],
            'body' => $powerShellResult['body'],
            'content_type' => 'application/json',
            'error' => '',
        ];
    } else {
        $result['error'] = trim((string)$result['error'] . ' | ' . (string)$powerShellResult['error'], ' |');
    }
}

if (
    !$result['ok'] &&
    (
        strpos((string)$result['error'], 'stream fallback') !== false ||
        strpos((string)$result['error'], 'PowerShell') !== false
    )
) {
    $shellResult = qpmCoreShellCurlRequest($requestUrl, $requestHeaders, 'POST', $requestBody, 45);
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
    echo json_encode(['error' => 'Invalid response from CORE']);
    exit;
}

$results = isset($decoded['results']) && is_array($decoded['results']) ? $decoded['results'] : [];
$pmids = [];
$dois = [];
$candidates = [];

foreach ($results as $index => $work) {
    if (!is_array($work)) {
        continue;
    }

    $pmid = qpmExtractCorePmid($work);
    $doi = qpmExtractCoreDoi($work);
    if ($pmid === '' && $doi === '') {
        continue;
    }

    if ($pmid !== '') {
        $pmids[$pmid] = true;
    }
    if ($doi !== '') {
        $dois[$doi] = true;
    }

    $documentTypes = $work['documentType'] ?? $work['document_type'] ?? [];
    if (!is_array($documentTypes)) {
        $documentTypes = $documentTypes !== '' ? [$documentTypes] : [];
    }

    $candidates[] = [
        'source' => 'core',
        'rank' => $index + 1,
        'pmid' => $pmid,
        'doi' => $doi,
        'title' => trim((string)($work['title'] ?? '')),
        'abstract' => trim((string)($work['abstract'] ?? '')),
        'score' => isset($work['_score']) && is_numeric($work['_score']) ? (float)$work['_score'] : null,
        'metadata' => [
            'year' => isset($work['yearPublished']) ? (string)$work['yearPublished'] : (isset($work['year_published']) ? (string)$work['year_published'] : ''),
            'venue' => qpmExtractCoreVenue($work),
            'publicationTypes' => array_values(array_map('strval', $documentTypes)),
        ],
    ];
}

echo json_encode([
    'query' => $query,
    'resolvedQuery' => $resolvedQuery !== '' ? $resolvedQuery : $query,
    'pmids' => array_values(array_keys($pmids)),
    'dois' => array_values(array_keys($dois)),
    'candidates' => $candidates,
    'total' => isset($decoded['totalHits']) ? (int)$decoded['totalHits'] : (isset($decoded['total_hits']) ? (int)$decoded['total_hits'] : count($results)),
]);
