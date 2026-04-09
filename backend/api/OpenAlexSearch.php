<?php
/**
 * OpenAlex semantic search proxy.
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
function qpmIsLocalOpenAlexRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

/**
 * Fallback HTTP GET request with relaxed SSL verification.
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmOpenAlexFallbackRequest(string $url, array $headers, int $timeout = 30): array
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
            'error' => $message !== '' ? $message : 'OpenAlex fallback request failed',
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
 *
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmOpenAlexShellCurlRequest(string $url, array $headers, int $timeout = 30): array
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
 * @param array<string,mixed> $requestParams
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmOpenAlexLocalDevProxyRequest(array $requestParams): array
{
    $hosts = ['localhost', '127.0.0.1'];
    $lastStatus = 0;
    if (!qpmIsLocalOpenAlexRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $queryString = http_build_query($requestParams);

    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/openalex-api/works?' . $queryString;
        $result = null;
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            $result = qpmHttpRequest($url, [
                'method' => 'GET',
                'timeout' => 30,
                'user_agent' => 'QuickPubMed/1.0',
                'headers' => ['Accept: application/json'],
            ]);
            $lastStatus = (int) ($result['status'] ?? 0);
            if ($result['ok'] && $lastStatus >= 200 && $lastStatus < 300) {
                return [
                    'ok' => true,
                    'status' => $lastStatus,
                    'body' => (string)$result['body'],
                    'error' => '',
                ];
            }
            if ($lastStatus !== 429 || $attempt === 2) {
                break;
            }
            usleep(1500000 * $attempt);
        }
        $errors[] = $host . ': ' . ($result['error'] !== '' ? $result['error'] : ('HTTP ' . (string) ($result['status'] ?? 0)));
    }

    return [
        'ok' => false,
        'status' => $lastStatus,
        'body' => '',
        'error' => implode(' | ', $errors),
    ];
}

/**
 * Normalize PubMed IDs from OpenAlex values.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeOpenAlexPmid($value): string
{
    $raw = trim((string) $value);
    if ($raw === '') {
        return '';
    }
    if (preg_match('/(\d+)/', $raw, $matches)) {
        return (string) $matches[1];
    }
    return '';
}

/**
 * Normalize DOI values from OpenAlex.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeOpenAlexDoi($value): string
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
 * Normalize language values to OpenAlex filter codes.
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeOpenAlexLanguageCode($value): string
{
    $normalized = strtolower(trim((string) $value));
    if ($normalized === '') {
        return '';
    }
    $compact = preg_replace('/[\s_-]+/', '', $normalized);
    $aliasMap = [
        'english' => 'en',
        'eng' => 'en',
        'danish' => 'da',
        'dansk' => 'da',
        'german' => 'de',
        'deutsch' => 'de',
        'french' => 'fr',
        'spanish' => 'es',
        'italian' => 'it',
        'dutch' => 'nl',
        'norwegian' => 'no',
        'norwegianbokmal' => 'nb',
        'norwegiannynorsk' => 'nn',
        'swedish' => 'sv',
        'portuguese' => 'pt',
    ];
    if (isset($aliasMap[$compact])) {
        return $aliasMap[$compact];
    }
    return preg_match('/^[a-z]{2}$/', $normalized) ? $normalized : '';
}

/**
 * Normalize requested OpenAlex language filters.
 *
 * @param mixed $value
 * @return array<int,string>
 */
function qpmNormalizeOpenAlexLanguageFilters($value): array
{
    $values = is_array($value) ? $value : [$value];
    $seen = [];
    $output = [];
    foreach ($values as $entry) {
        $normalized = qpmNormalizeOpenAlexLanguageCode($entry);
        if ($normalized === '' || isset($seen[$normalized])) {
            continue;
        }
        $seen[$normalized] = true;
        $output[] = $normalized;
    }
    return $output;
}

/**
 * Normalize simple OpenAlex filter values against a whitelist.
 *
 * @param mixed $value
 * @param array<string,string> $allowedValues
 * @return array<int,string>
 */
function qpmNormalizeOpenAlexEnumFilters($value, array $allowedValues): array
{
    $values = is_array($value) ? $value : [$value];
    $seen = [];
    $output = [];
    foreach ($values as $entry) {
        $normalized = strtolower(trim((string) $entry));
        if ($normalized === '') {
            continue;
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $resolved = $allowedValues[$compact] ?? $allowedValues[$normalized] ?? '';
        if ($resolved === '' || isset($seen[$resolved])) {
            continue;
        }
        $seen[$resolved] = true;
        $output[] = $resolved;
    }
    return $output;
}

/**
 * Normalize publication year filter for OpenAlex semantic search.
 *
 * Allowed formats: YYYY or YYYY-YYYY
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeOpenAlexPublicationYearFilter($value): string
{
    $normalized = trim((string) $value);
    return preg_match('/^\d{4}(?:-\d{4})?$/', $normalized) ? $normalized : '';
}

/**
 * Emit a degraded OpenAlex payload instead of hard-failing.
 *
 * @param string $query
 * @param string $warning
 * @return void
 */
function qpmRespondWithOpenAlexWarning(string $query, string $warning): void
{
    echo json_encode([
        'query' => $query,
        'pmids' => [],
        'dois' => [],
        'candidates' => [],
        'total' => 0,
        'partial' => true,
        'warning' => $warning,
    ]);
    exit;
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
$domain = trim((string) ($params['domain'] ?? ''));
$configuredLimit = qpmGetSemanticSourceLimit('openAlex', 50);
$limit = (int) ($params['limit'] ?? $configuredLimit);
$languageFilters = qpmNormalizeOpenAlexLanguageFilters($params['languages'] ?? ($params['language'] ?? []));
$sourceTypes = qpmNormalizeOpenAlexEnumFilters(
    $params['sourceTypes'] ?? ($params['sourceType'] ?? []),
    [
        'bookseries' => 'book series',
        'journal' => 'journal',
        'conference' => 'conference',
        'ebookplatform' => 'ebook platform',
        'other' => 'other',
        'repository' => 'repository',
    ]
);
$workTypes = qpmNormalizeOpenAlexEnumFilters(
    $params['workTypes'] ?? ($params['workType'] ?? []),
    [
        'article' => 'article',
        'book' => 'book',
        'bookchapter' => 'book-chapter',
        'dataset' => 'dataset',
        'dissertation' => 'dissertation',
        'review' => 'review',
        'preprint' => 'preprint',
        'editorial' => 'editorial',
        'erratum' => 'erratum',
        'letter' => 'letter',
        'libguides' => 'libguides',
        'other' => 'other',
        'paratext' => 'paratext',
        'peerreview' => 'peer-review',
        'referenceentry' => 'reference-entry',
        'report' => 'report',
        'retraction' => 'retraction',
        'standard' => 'standard',
        'supplementarymaterials' => 'supplementary-materials',
    ]
);
$publicationYearFilter = qpmNormalizeOpenAlexPublicationYearFilter(
    $params['publicationYear'] ?? ($params['publication_year'] ?? '')
);
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

$requestParams = [
    'search.semantic' => $query,
    'per_page' => $limit,
    'select' => 'id,display_name,doi,ids,publication_year,relevance_score,type',
];
if (!empty($languageFilters) || !empty($workTypes) || $publicationYearFilter !== '') {
    $filterParts = [];
    if (!empty($languageFilters)) {
        $filterParts[] = 'language:' . implode('|', $languageFilters);
    }
    if (!empty($workTypes)) {
        $filterParts[] = 'type:' . implode('|', $workTypes);
    }
    if ($publicationYearFilter !== '') {
        $filterParts[] = 'publication_year:' . $publicationYearFilter;
    }
    $requestParams['filter'] = implode(',', $filterParts);
}
$openAlexApiKey = qpmGetOpenAlexApiKey($domain);
if ($openAlexApiKey !== '') {
    $requestParams['api_key'] = $openAlexApiKey;
}
$openAlexEmail = qpmGetOpenAlexEmail($domain);
if ($openAlexEmail !== '') {
    $requestParams['mailto'] = $openAlexEmail;
}

qpmThrottleNlmRequests(1);
$url = 'https://api.openalex.org/works?' . http_build_query($requestParams);
$result = qpmOpenAlexLocalDevProxyRequest($requestParams);
if (!$result['ok'] && (int) ($result['status'] ?? 0) === 429) {
    qpmRespondWithOpenAlexWarning($query, 'OpenAlex request was rate limited');
}
if (!$result['ok']) {
    $result = qpmHttpRequest($url, [
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
    $fallbackResult = qpmOpenAlexFallbackRequest($url, ['Accept: application/json'], 30);
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
    $shellCurlResult = qpmOpenAlexShellCurlRequest($url, ['Accept: application/json'], 30);
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
    qpmRespondWithOpenAlexWarning($query, (string) $result['error']);
}

$decoded = json_decode($result['body'], true);
if (!is_array($decoded)) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from OpenAlex']);
    exit;
}

$results = $decoded['results'] ?? [];
if (!is_array($results)) {
    $results = [];
}

$pmids = [];
$dois = [];
$candidates = [];

foreach ($results as $index => $work) {
    if (!is_array($work)) {
        continue;
    }
    $ids = isset($work['ids']) && is_array($work['ids']) ? $work['ids'] : [];
    $pmid = qpmNormalizeOpenAlexPmid($work['pmid'] ?? ($ids['pmid'] ?? ''));
    $doi = qpmNormalizeOpenAlexDoi($work['doi'] ?? ($ids['doi'] ?? ''));
    if ($pmid === '' && $doi === '') {
        continue;
    }

    if ($pmid !== '') {
        $pmids[$pmid] = true;
    }
    if ($doi !== '') {
        $dois[$doi] = true;
    }

    $relevanceScore = $work['relevance_score'] ?? null;
    $primaryLocation = isset($work['primary_location']) && is_array($work['primary_location'])
        ? $work['primary_location']
        : [];
    $source = isset($primaryLocation['source']) && is_array($primaryLocation['source'])
        ? $primaryLocation['source']
        : [];
    $candidates[] = [
        'source' => 'openAlex',
        'rank' => $index + 1,
        'pmid' => $pmid,
        'doi' => $doi,
        'openAlexId' => trim((string) ($work['id'] ?? '')),
        'title' => trim((string) ($work['display_name'] ?? $work['title'] ?? '')),
        'score' => is_numeric($relevanceScore) ? (float) $relevanceScore : null,
        'metadata' => [
            'publicationYear' => isset($work['publication_year']) ? (string) $work['publication_year'] : '',
            'workType' => trim((string) ($work['type'] ?? '')),
            'sourceType' => trim((string) ($source['type'] ?? '')),
            'sourceDisplayName' => trim((string) ($source['display_name'] ?? '')),
            'sourceAbbreviatedTitle' => trim((string) ($source['abbreviated_title'] ?? '')),
        ],
    ];
}

echo json_encode([
    'query' => $query,
    'pmids' => array_values(array_keys($pmids)),
    'dois' => array_values(array_keys($dois)),
    'candidates' => $candidates,
    'total' => isset($decoded['meta']['count']) ? (int) $decoded['meta']['count'] : count($results),
]);
