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
 * @return array{ok: bool, status: int, body: string, error: string}
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
        ];
    }

    return [
        'ok' => true,
        'status' => $status,
        'body' => (string)$body,
        'error' => '',
    ];
}

/**
 * Last-resort fallback using OS curl binary.
 * Useful when PHP cURL extension and HTTPS stream wrapper are unavailable.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmSemanticScholarShellCurlRequest(string $url, array $headers, int $timeout = 30): array
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

/**
 * Local dev fallback through Vite proxy (http), still backend-initiated.
 *
 * @param string $query
 * @param int $limit
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmSemanticScholarLocalDevProxyRequest(string $query, int $limit, int $offset = 0): array
{
    $hosts = ['localhost', '127.0.0.1'];
    $isLocalRequest = qpmIsLocalSemanticScholarRequest();
    if (!$isLocalRequest) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $queryString = http_build_query([
        'query' => $query,
        'limit' => $limit,
        'offset' => $offset,
        'fields' => 'externalIds,title,venue,year,publicationTypes',
    ]);

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
    }

    return [
        'ok' => false,
        'status' => 0,
        'body' => '',
        'error' => implode(' | ', $errors),
    ];
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
 * @return array<int,array{source:string,rank:int,pmid:string,doi:string,title:string,score:null}>
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

        $candidates[] = [
            'source' => 'semanticScholar',
            'rank' => $rankOffset + $index + 1,
            'pmid' => $pmid,
            'doi' => $doi,
            'title' => trim((string) ($paper['title'] ?? '')),
            'score' => null,
            'metadata' => [
                'year' => isset($paper['year']) ? (string) $paper['year'] : '',
                'venue' => trim((string) ($paper['venue'] ?? '')),
                'publicationTypes' => isset($paper['publicationTypes']) && is_array($paper['publicationTypes'])
                    ? array_values(array_map('strval', $paper['publicationTypes']))
                    : [],
            ],
        ];
    }

    return $candidates;
}

/**
 * Fetch one Semantic Scholar search batch with all available fallbacks.
 *
 * @param string $query
 * @param int $limit
 * @param int $offset
 * @param array<int,array<int,string>> $headerCandidates
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmSemanticScholarFetchBatch(string $query, int $limit, int $offset, array $headerCandidates): array
{
    qpmThrottleRequestRate('semantic_scholar', 3);

    $url = 'https://api.semanticscholar.org/graph/v1/paper/search?' . http_build_query([
        'query' => $query,
        'limit' => $limit,
        'offset' => $offset,
        'fields' => 'externalIds,title,venue,year,publicationTypes',
    ]);

    $requestErrors = [];

    if (qpmIsLocalSemanticScholarRequest()) {
        $localDevProxyResult = qpmSemanticScholarLocalDevProxyRequest($query, $limit, $offset);
        if ($localDevProxyResult['ok']) {
            return [
                'ok' => true,
                'status' => $localDevProxyResult['status'],
                'body' => $localDevProxyResult['body'],
                'error' => '',
            ];
        }
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
                ];
            } else {
                $attemptResult['error'] = trim((string)$attemptResult['error'] . ' | ' . (string)$shellCurlResult['error'], ' |');
            }
        }

        if ($attemptResult['ok'] && (int)$attemptResult['status'] >= 200 && (int)$attemptResult['status'] < 300) {
            return [
                'ok' => true,
                'status' => (int)$attemptResult['status'],
                'body' => (string)$attemptResult['body'],
                'error' => '',
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
        'status' => 500,
        'body' => '',
        'error' => implode(' | ', array_filter($requestErrors)) ?: 'Semantic Scholar request failed',
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

while ($offset < $limit) {
    $currentLimit = min($batchSize, $limit - $offset);
    $result = qpmSemanticScholarFetchBatch($query, $currentLimit, $offset, $headerCandidates);
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
]);
