<?php
/**
 * Semantic Scholar paper search proxy.
 * Accepts a plain-text query and returns deduplicated PubMed IDs plus candidate metadata.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

qpmApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');
@ini_set('max_execution_time', '180');
@set_time_limit(180);

function qpmIsLocalSemanticScholarRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

/**
 * Fallback HTTP GET request for Semantic Scholar.
 * Tries stream context with relaxed SSL verification for local dev environments
 * where CA bundles are often missing.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmSemanticScholarFallbackRequest(string $url, array $headers, int $timeout = 30): array
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

    $body = @file_get_contents($url, false, $context);
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

    if ($body === false) {
        $lastError = error_get_last();
        $message = is_array($lastError) ? (string)($lastError['message'] ?? '') : '';
        return [
            'ok' => false,
            'status' => $status,
            'body' => '',
            'error' => $message !== '' ? $message : 'Semantic Scholar fallback request failed',
            'response_headers' => is_array($responseHeaders) ? array_values($responseHeaders) : [],
        ];
    }

    return [
        'ok' => true,
        'status' => $status,
        'body' => (string)$body,
        'error' => '',
        'response_headers' => is_array($responseHeaders) ? array_values($responseHeaders) : [],
    ];
}

/**
 * Last-resort fallback using OS curl binary.
 * Useful when PHP cURL extension and HTTPS stream wrapper are unavailable.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmSemanticScholarShellCurlRequest(string $url, array $headers, int $timeout = 30): array
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
            'response_headers' => [],
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
            'response_headers' => [],
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'body' => (string)$body,
        'error' => $status >= 200 && $status < 300 ? '' : 'curl binary returned HTTP ' . (string)$status,
        'response_headers' => [],
    ];
}

/**
 * Local dev fallback through Vite proxy (http), still backend-initiated.
 *
 * @param string $query
 * @param int $limit
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmSemanticScholarLocalDevProxyRequest(
    string $query,
    int $limit,
    int $offset = 0,
    string $year = '',
    array $publicationTypes = [],
    string $publicationDateOrYear = ''
): array
{
    $hosts = ['localhost', '127.0.0.1'];
    $isLocalRequest = qpmIsLocalSemanticScholarRequest();
    $lastStatus = 0;
    $lastResponseHeaders = [];
    if (!$isLocalRequest) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
            'response_headers' => [],
        ];
    }

    $queryString = qpmBuildSemanticScholarSearchQueryString(
        $query,
        $limit,
        $offset,
        $year,
        $publicationTypes,
        $publicationDateOrYear
    );

    $headerCandidates = [
        ['Accept: application/json'],
    ];
    if (defined('SEMANTIC_SCHOLAR_API_KEY') && SEMANTIC_SCHOLAR_API_KEY !== '') {
        array_unshift($headerCandidates, [
            'Accept: application/json',
            'x-api-key: ' . SEMANTIC_SCHOLAR_API_KEY,
        ]);
    }

    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/semantic-scholar-api/graph/v1/paper/search?' . $queryString;
        foreach ($headerCandidates as $headers) {
            $result = qpmHttpRequest($url, [
                'method' => 'GET',
                'timeout' => 30,
                'user_agent' => 'QuickPubMed/1.0',
                'headers' => $headers,
            ]);
            $lastStatus = (int) ($result['status'] ?? 0);
            $lastResponseHeaders = is_array($result['response_headers'] ?? null)
                ? array_values($result['response_headers'])
                : [];
            if ($result['ok'] && (int)$result['status'] >= 200 && (int)$result['status'] < 300) {
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
    }

    return [
        'ok' => false,
        'status' => $lastStatus,
        'body' => '',
        'error' => implode(' | ', $errors),
        'response_headers' => $lastResponseHeaders,
    ];
}

/**
 * Extract Semantic Scholar rate limit metadata from response headers.
 *
 * @param array<int,string> $headers
 * @param int $status
 * @return array<string,mixed>
 */
function qpmBuildSemanticScholarRateLimitInfo(array $headers, int $status): array
{
    $headerMap = qpmBuildResponseHeaderMap($headers);
    $limit = qpmParseIntegerHeaderValue(
        $headerMap['x-ratelimit-limit'] ?? ($headerMap['ratelimit-limit'] ?? '')
    );
    if ($limit !== null && $limit <= 0) {
        $limit = null;
    }

    $remaining = qpmParseIntegerHeaderValue(
        $headerMap['x-ratelimit-remaining'] ?? ($headerMap['ratelimit-remaining'] ?? '')
    );
    if ($remaining !== null) {
        $remaining = max(0, $remaining);
    }

    $resetWindow = qpmParseRateLimitResetWindow(
        $headerMap['x-ratelimit-reset'] ?? ($headerMap['ratelimit-reset'] ?? ''),
        $headerMap['retry-after'] ?? ''
    );
    $isLimited = $status === 429 || ($remaining !== null && $remaining <= 0);

    if (
        $limit === null &&
        $remaining === null &&
        $resetWindow['resetAt'] === '' &&
        $resetWindow['resetInSeconds'] === null &&
        $status <= 0 &&
        !$isLimited
    ) {
        return [];
    }

    return [
        'limit' => $limit,
        'remaining' => $remaining,
        'resetAt' => $resetWindow['resetAt'],
        'resetInSeconds' => $resetWindow['resetInSeconds'],
        'status' => $status,
        'isLimited' => $isLimited,
    ];
}

/**
 * Normalize a Semantic Scholar year filter.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeSemanticScholarYearFilter($value): string
{
    $normalized = trim((string)$value);
    return preg_match('/^\d{4}(?:-\d{4})?$/', $normalized) ? $normalized : '';
}

/**
 * Normalize a Semantic Scholar publicationDateOrYear filter.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeSemanticScholarPublicationDateOrYearFilter($value): string
{
    $normalized = trim((string)$value);
    if ($normalized === '') {
        return '';
    }
    return preg_match('/^(\d{4}(?:-\d{2}(?:-\d{2})?)?)?(?::(\d{4}(?:-\d{2}(?:-\d{2})?)?)?)?$/', $normalized)
        ? $normalized
        : '';
}

/**
 * Normalize publication type list input for Semantic Scholar.
 *
 * @param mixed $value
 * @return array<int,string>
 */
function qpmNormalizeSemanticScholarPublicationTypes($value): array
{
    $rawValues = [];
    if (is_array($value)) {
        $rawValues = $value;
    } elseif (is_string($value)) {
        $rawValues = explode(',', $value);
    } elseif ($value !== null && $value !== '') {
        $rawValues = [(string)$value];
    }

    $normalized = [];
    foreach ($rawValues as $entry) {
        $trimmed = trim((string)$entry);
        if ($trimmed === '') {
            continue;
        }
        $normalized[$trimmed] = true;
    }

    return array_values(array_keys($normalized));
}

/**
 * Build Semantic Scholar relevance-search query string.
 *
 * @param string $query
 * @param int $limit
 * @param int $offset
 * @param string $year
 * @param array<int,string> $publicationTypes
 * @param string $publicationDateOrYear
 * @return string
 */
function qpmBuildSemanticScholarSearchQueryString(
    string $query,
    int $limit,
    int $offset,
    string $year = '',
    array $publicationTypes = [],
    string $publicationDateOrYear = ''
): string
{
    $queryString = http_build_query([
        'query' => $query,
        'limit' => $limit,
        'offset' => $offset,
        'fields' => 'externalIds,title,abstract,venue,year,publicationTypes,publicationDate,citationCount,influentialCitationCount,isOpenAccess,s2FieldsOfStudy,tldr',
    ]);

    if ($year !== '') {
        $queryString .= '&year=' . rawurlencode($year);
    }
    if (!empty($publicationTypes)) {
        $queryString .= '&publicationTypes=' . rawurlencode(implode(',', $publicationTypes));
    }
    if ($publicationDateOrYear !== '') {
        $queryString .= '&publicationDateOrYear=' . rawurlencode($publicationDateOrYear);
    }

    return $queryString;
}

/**
 * Extract unique PubMed IDs from a Semantic Scholar response payload.
 *
 * @param array<string,mixed> $decoded
 * @return array<int,string>
 */
function qpmExtractSemanticScholarPmids(array $decoded): array
{
    $pmids = [];
    $data = $decoded['data'] ?? [];
    if (!is_array($data)) {
        return [];
    }

    foreach ($data as $paper) {
        if (!is_array($paper)) {
            continue;
        }
        $externalIds = $paper['externalIds'] ?? null;
        if (!is_array($externalIds)) {
            continue;
        }
        $pubmedId = $externalIds['PubMed'] ?? null;
        if ($pubmedId === null) {
            continue;
        }
        $pmid = trim((string)$pubmedId);
        if ($pmid !== '' && preg_match('/^[0-9]+$/', $pmid)) {
            $pmids[$pmid] = true;
        }
    }

    return array_values(array_keys($pmids));
}

/**
 * Normalize DOI values from Semantic Scholar externalIds.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeSemanticScholarDoi($value): string
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
 * Extract normalized candidates from a Semantic Scholar response payload.
 *
 * @param array<string,mixed> $decoded
 * @param int $rankOffset
 * @return array<int,array{source:string,rank:int,pmid:string,doi:string,title:string,abstract:string,score:null}>
 */
function qpmExtractSemanticScholarCandidates(array $decoded, int $rankOffset = 0): array
{
    $candidates = [];
    $data = $decoded['data'] ?? [];
    if (!is_array($data)) {
        return [];
    }

    foreach ($data as $index => $paper) {
        if (!is_array($paper)) {
            continue;
        }
        $externalIds = $paper['externalIds'] ?? null;
        if (!is_array($externalIds)) {
            $externalIds = [];
        }

        $pmid = trim((string) ($externalIds['PubMed'] ?? ''));
        if ($pmid !== '' && !preg_match('/^[0-9]+$/', $pmid)) {
            $pmid = '';
        }
        $doi = qpmNormalizeSemanticScholarDoi($externalIds['DOI'] ?? '');
        if ($pmid === '' && $doi === '') {
            continue;
        }

        $citationCountRaw = $paper['citationCount'] ?? null;
        $influentialCitationCountRaw = $paper['influentialCitationCount'] ?? null;
        $isOpenAccessRaw = $paper['isOpenAccess'] ?? null;

        $s2Fields = [];
        if (isset($paper['s2FieldsOfStudy']) && is_array($paper['s2FieldsOfStudy'])) {
            foreach ($paper['s2FieldsOfStudy'] as $fieldEntry) {
                if (is_array($fieldEntry) && isset($fieldEntry['category'])) {
                    $categoryName = trim((string) $fieldEntry['category']);
                    if ($categoryName !== '') {
                        $s2Fields[$categoryName] = true;
                    }
                } elseif (is_string($fieldEntry)) {
                    $categoryName = trim($fieldEntry);
                    if ($categoryName !== '') {
                        $s2Fields[$categoryName] = true;
                    }
                }
            }
        }

        $tldrText = '';
        if (isset($paper['tldr']) && is_array($paper['tldr']) && isset($paper['tldr']['text'])) {
            $tldrText = trim((string) $paper['tldr']['text']);
        }

        $candidates[] = [
            'source' => 'semanticScholar',
            'rank' => $rankOffset + $index + 1,
            'pmid' => $pmid,
            'doi' => $doi,
            'title' => trim((string) ($paper['title'] ?? '')),
            'abstract' => trim((string) ($paper['abstract'] ?? '')),
            'score' => null,
            'metadata' => [
                'year' => isset($paper['year']) ? (string) $paper['year'] : '',
                'publicationDate' => trim((string) ($paper['publicationDate'] ?? '')),
                'venue' => trim((string) ($paper['venue'] ?? '')),
                'publicationTypes' => isset($paper['publicationTypes']) && is_array($paper['publicationTypes'])
                    ? array_values(array_map('strval', $paper['publicationTypes']))
                    : [],
                'citationCount' => is_numeric($citationCountRaw) ? (int) $citationCountRaw : null,
                'influentialCitationCount' => is_numeric($influentialCitationCountRaw) ? (int) $influentialCitationCountRaw : null,
                'isOpenAccess' => is_bool($isOpenAccessRaw) ? $isOpenAccessRaw : null,
                's2FieldsOfStudy' => array_values(array_keys($s2Fields)),
                'tldr' => $tldrText,
            ],
        ];
    }

    return $candidates;
}

/**
 * Collect debug-only dropped records from Semantic Scholar normalization.
 *
 * @param array<string,mixed> $decoded
 * @param int $rankOffset
 * @return array{records: array<int,array<string,mixed>>, reasons: array<string,int>}
 */
function qpmCollectSemanticScholarDroppedRecords(array $decoded, int $rankOffset = 0): array
{
    $records = [];
    $reasons = [];
    $data = $decoded['data'] ?? [];
    if (!is_array($data)) {
        return [
            'records' => [],
            'reasons' => [],
        ];
    }

    foreach ($data as $index => $paper) {
        if (!is_array($paper)) {
            continue;
        }
        $externalIds = $paper['externalIds'] ?? null;
        if (!is_array($externalIds)) {
            $externalIds = [];
        }
        $pmid = trim((string) ($externalIds['PubMed'] ?? ''));
        if ($pmid !== '' && !preg_match('/^[0-9]+$/', $pmid)) {
            $pmid = '';
        }
        $doi = qpmNormalizeSemanticScholarDoi($externalIds['DOI'] ?? '');
        if ($pmid !== '' || $doi !== '') {
            continue;
        }
        $reason = 'missing_pmid_and_doi';
        $reasons[$reason] = (int) ($reasons[$reason] ?? 0) + 1;
        $records[] = [
            'source' => 'semanticScholar',
            'rank' => $rankOffset + $index + 1,
            'pmid' => '',
            'doi' => '',
            'title' => trim((string) ($paper['title'] ?? '')),
            'reason' => $reason,
        ];
    }

    return [
        'records' => $records,
        'reasons' => $reasons,
    ];
}

/**
 * Fetch one Semantic Scholar search batch with all available fallbacks.
 *
 * @param string $query
 * @param int $limit
 * @param int $offset
 * @param array<int,array<int,string>> $headerCandidates
 * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
 */
function qpmSemanticScholarFetchBatch(
    string $query,
    int $limit,
    int $offset,
    array $headerCandidates,
    string $year = '',
    array $publicationTypes = [],
    string $publicationDateOrYear = ''
): array
{
    qpmThrottleRequestRate('semantic_scholar', 3);

    $url = 'https://api.semanticscholar.org/graph/v1/paper/search?' .
        qpmBuildSemanticScholarSearchQueryString(
            $query,
            $limit,
            $offset,
            $year,
            $publicationTypes,
            $publicationDateOrYear
        );

    $requestErrors = [];
    $lastStatus = 0;
    $lastResponseHeaders = [];

    if (qpmIsLocalSemanticScholarRequest()) {
        $localDevProxyResult = qpmSemanticScholarLocalDevProxyRequest(
            $query,
            $limit,
            $offset,
            $year,
            $publicationTypes,
            $publicationDateOrYear
        );
        if ($localDevProxyResult['ok']) {
            return [
                'ok' => true,
                'status' => $localDevProxyResult['status'],
                'body' => $localDevProxyResult['body'],
                'error' => '',
                'response_headers' => is_array($localDevProxyResult['response_headers'] ?? null)
                    ? array_values($localDevProxyResult['response_headers'])
                    : [],
            ];
        }
        $lastStatus = (int) ($localDevProxyResult['status'] ?? 0);
        $lastResponseHeaders = is_array($localDevProxyResult['response_headers'] ?? null)
            ? array_values($localDevProxyResult['response_headers'])
            : [];
        $requestErrors[] = (string)$localDevProxyResult['error'];
    }

    foreach ($headerCandidates as $headers) {
        $attemptResult = qpmHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 12,
            'user_agent' => 'QuickPubMed/1.0',
            'headers' => $headers,
        ]);

        if (
            !$attemptResult['ok'] &&
            strpos((string)$attemptResult['error'], 'stream fallback') !== false
        ) {
            $fallbackResult = qpmSemanticScholarFallbackRequest($url, $headers, 12);
            if ($fallbackResult['ok']) {
                $attemptResult = [
                    'ok' => true,
                    'status' => $fallbackResult['status'],
                    'body' => $fallbackResult['body'],
                    'content_type' => 'application/json',
                    'error' => '',
                    'response_headers' => $fallbackResult['response_headers'],
                ];
            } else {
                $attemptResult['error'] = trim((string)$attemptResult['error'] . ' | ' . (string)$fallbackResult['error'], ' |');
            }
        }

        if (
            !$attemptResult['ok'] &&
            strpos((string)$attemptResult['error'], 'stream fallback') !== false
        ) {
            $shellCurlResult = qpmSemanticScholarShellCurlRequest($url, $headers, 12);
            if ($shellCurlResult['ok']) {
                $attemptResult = [
                    'ok' => true,
                    'status' => $shellCurlResult['status'],
                    'body' => $shellCurlResult['body'],
                    'content_type' => 'application/json',
                    'error' => '',
                    'response_headers' => $shellCurlResult['response_headers'],
                ];
            } else {
                $attemptResult['error'] = trim((string)$attemptResult['error'] . ' | ' . (string)$shellCurlResult['error'], ' |');
            }
        }

        $lastStatus = (int) ($attemptResult['status'] ?? 0);
        $lastResponseHeaders = is_array($attemptResult['response_headers'] ?? null)
            ? array_values($attemptResult['response_headers'])
            : [];
        if ($attemptResult['ok'] && (int)$attemptResult['status'] >= 200 && (int)$attemptResult['status'] < 300) {
            return [
                'ok' => true,
                'status' => (int)$attemptResult['status'],
                'body' => (string)$attemptResult['body'],
                'error' => '',
                'response_headers' => $lastResponseHeaders,
            ];
        }

        if (!$attemptResult['ok']) {
            $requestErrors[] = (string)$attemptResult['error'];
        } else {
            $requestErrors[] = 'HTTP ' . (string)$attemptResult['status'] . ': ' . substr((string)$attemptResult['body'], 0, 300);
        }
    }

    return [
        'ok' => false,
        'status' => $lastStatus,
        'body' => '',
        'error' => implode(' | ', array_filter($requestErrors)) ?: 'Semantic Scholar request failed',
        'response_headers' => $lastResponseHeaders,
    ];
}

/**
 * Detect recoverable Semantic Scholar request errors.
 *
 * @param string $error
 * @return bool
 */
function qpmIsRecoverableSemanticScholarError(string $error): bool
{
    $normalized = strtolower(trim($error));
    if ($normalized === '') {
        return false;
    }

    return
        strpos($normalized, 'http 429') !== false ||
        strpos($normalized, 'rate limit') !== false ||
        strpos($normalized, 'stream fallback') !== false ||
        strpos($normalized, 'curl binary failed with exit code 3') !== false ||
        strpos($normalized, 'failed to open stream') !== false;
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
$debugSearchFlow = qpmIsSearchFlowDebugRequest($params);
$year = qpmNormalizeSemanticScholarYearFilter($params['year'] ?? '');
$publicationTypes = qpmNormalizeSemanticScholarPublicationTypes(
    $params['publicationTypes'] ?? ($params['publication_types'] ?? [])
);
$publicationDateOrYear = qpmNormalizeSemanticScholarPublicationDateOrYearFilter(
    $params['publicationDateOrYear'] ?? ($params['publication_date_or_year'] ?? '')
);
$configuredLimit = qpmGetSemanticSourceLimit('semanticScholar', 400);
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
    ]);
    exit;
}

$headerCandidates = [
    ['Accept: application/json'],
];
if (defined('SEMANTIC_SCHOLAR_API_KEY') && SEMANTIC_SCHOLAR_API_KEY !== '') {
    array_unshift($headerCandidates, [
        'Accept: application/json',
        'x-api-key: ' . SEMANTIC_SCHOLAR_API_KEY,
    ]);
}

$pmids = [];
$dois = [];
$candidates = [];
$total = null;
$offset = 0;
$batchSize = 100;
$requestErrors = [];
$warning = '';
$debugDroppedRecords = [];
$debugDroppedReasons = [];
$rateLimit = [];

while ($offset < $limit) {
    $currentLimit = min($batchSize, $limit - $offset);
    $result = qpmSemanticScholarFetchBatch(
        $query,
        $currentLimit,
        $offset,
        $headerCandidates,
        $year,
        $publicationTypes,
        $publicationDateOrYear
    );
    $batchRateLimit = qpmBuildSemanticScholarRateLimitInfo(
        is_array($result['response_headers'] ?? null) ? $result['response_headers'] : [],
        (int) ($result['status'] ?? 0)
    );
    if (!empty($batchRateLimit)) {
        $rateLimit = $batchRateLimit;
    }
    if (!$result['ok']) {
        $requestErrors[] = (string) $result['error'];
        $hasPartialData = !empty($candidates) || !empty($pmids) || !empty($dois);
        if ($hasPartialData || qpmIsRecoverableSemanticScholarError((string) $result['error'])) {
            $warning = implode(' | ', array_filter($requestErrors));
            break;
        }

        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
        exit;
    }

    $decoded = json_decode($result['body'], true);
    if (!is_array($decoded)) {
        http_response_code(502);
        echo json_encode(['error' => 'Invalid response from Semantic Scholar']);
        exit;
    }

    foreach (qpmExtractSemanticScholarCandidates($decoded, $offset) as $candidate) {
        $candidates[] = $candidate;
        if ($candidate['pmid'] !== '') {
            $pmids[$candidate['pmid']] = true;
        }
        if ($candidate['doi'] !== '') {
            $dois[$candidate['doi']] = true;
        }
    }
    if ($debugSearchFlow) {
        $debugBatch = qpmCollectSemanticScholarDroppedRecords($decoded, $offset);
        $debugDroppedRecords = array_merge($debugDroppedRecords, $debugBatch['records']);
        foreach ($debugBatch['reasons'] as $reason => $count) {
            $debugDroppedReasons[$reason] = (int) ($debugDroppedReasons[$reason] ?? 0) + (int) $count;
        }
    }

    if ($total === null && isset($decoded['total'])) {
        $total = (int)$decoded['total'];
    }

    $data = $decoded['data'] ?? [];
    $dataCount = is_array($data) ? count($data) : 0;
    if ($dataCount === 0) {
        break;
    }

    $nextOffset = isset($decoded['next']) ? (int)$decoded['next'] : ($offset + $dataCount);
    if ($nextOffset <= $offset) {
        break;
    }
    $offset = $nextOffset;

    if ($total !== null && $offset >= $total) {
        break;
    }
}

echo json_encode([
    'query' => $query,
    'pmids' => array_values(array_keys($pmids)),
    'dois' => array_values(array_keys($dois)),
    'candidates' => $candidates,
    'total' => $total,
    'partial' => $warning !== '',
    'warning' => $warning,
    'rateLimit' => !empty($rateLimit) ? $rateLimit : (object) [],
    'debug' => $debugSearchFlow ? [
        'upstreamTotal' => $total === null ? count($candidates) + count($debugDroppedRecords) : (int) $total,
        'normalizedTotal' => count($candidates),
        'droppedBeforeReturn' => count($debugDroppedRecords),
        'droppedReasons' => (object) $debugDroppedReasons,
        'droppedRecords' => $debugDroppedRecords,
    ] : (object) [],
]);
