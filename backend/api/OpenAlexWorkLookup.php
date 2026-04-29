<?php
/**
 * OpenAlex single-work lookup proxy.
 * Resolves one work by DOI or OpenAlex ID.
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

function qpmNormalizeOpenAlexLookupDoi($value): string
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
 * Normalize an OpenAlex work ID to the short form (e.g. W2088009199).
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeOpenAlexLookupId($value): string
{
    $id = trim((string) $value);
    if ($id === '') {
        return '';
    }
    $id = preg_replace('~^https?://openalex\.org/~i', '', $id);
    $id = trim((string) $id);
    if (preg_match('/^W[0-9]+$/i', $id)) {
        return strtoupper($id);
    }
    return '';
}

function qpmGetOpenAlexWorkCacheTtl(bool $isNegative = false): int
{
    $fallback = $isNegative ? 600 : 3600;
    if (defined('QPM_OPENALEX_WORK_CACHE_TTL_SECONDS')) {
        $configured = QPM_OPENALEX_WORK_CACHE_TTL_SECONDS;
        if (is_array($configured)) {
            $key = $isNegative ? 'negative' : 'positive';
            return max(0, (int) ($configured[$key] ?? $configured['default'] ?? $fallback));
        }
        return max(0, (int) $configured);
    }
    return $fallback;
}

function qpmGetOpenAlexWorkCacheDir(): string
{
    $cacheDir = dirname(__DIR__, 2) . '/data/cache/openalex-work';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0775, true);
    }
    return $cacheDir;
}

function qpmGetOpenAlexWorkCachePath(string $type, string $value, string $domain): string
{
    $payload = [
        'type' => strtolower(trim($type)),
        'value' => strtolower(trim($value)),
        'domain' => strtolower(trim($domain)),
        'selectVersion' => '2026-04-28',
    ];
    $cacheKey = hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES));
    return qpmGetOpenAlexWorkCacheDir() . '/' . $cacheKey . '.json';
}

function qpmReadOpenAlexWorkCache(string $type, string $value, string $domain): array
{
    if ($value === '') {
        return ['hit' => false, 'value' => null];
    }
    $path = qpmGetOpenAlexWorkCachePath($type, $value, $domain);
    if (!is_file($path)) {
        return ['hit' => false, 'value' => null];
    }
    $raw = @file_get_contents($path);
    if (!is_string($raw) || $raw === '') {
        return ['hit' => false, 'value' => null];
    }
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        return ['hit' => false, 'value' => null];
    }
    $isNegative = !empty($payload['negative']);
    $storedAt = (int) ($payload['storedAt'] ?? 0);
    if ($storedAt <= 0 || time() - $storedAt > qpmGetOpenAlexWorkCacheTtl($isNegative)) {
        return ['hit' => false, 'value' => null];
    }
    return ['hit' => true, 'value' => $payload['value'] ?? null];
}

function qpmWriteOpenAlexWorkCache(string $type, string $value, string $domain, $cacheValue, bool $isNegative = false): void
{
    if ($value === '' || qpmGetOpenAlexWorkCacheTtl($isNegative) <= 0) {
        return;
    }
    $payload = json_encode([
        'storedAt' => time(),
        'negative' => $isNegative,
        'value' => $cacheValue,
    ], JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        return;
    }
    @file_put_contents(qpmGetOpenAlexWorkCachePath($type, $value, $domain), $payload, LOCK_EX);
}

function qpmIsLocalOpenAlexLookupRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function qpmOpenAlexWorkShellCurlRequest(string $url, array $headers, int $timeout = 30): array
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

function qpmOpenAlexWorkLocalDevProxyRequest(string $lookupValue, string $apiKey = '', string $mailto = ''): array
{
    if (!qpmIsLocalOpenAlexLookupRequest()) {
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
        $url = 'http://' . $host . ':5173/openalex-api/works/' . rawurlencode($lookupValue) . $queryString;
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

function qpmOpenAlexWorkListLocalDevProxyRequest(array $requestParams): array
{
    if (!qpmIsLocalOpenAlexLookupRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $hosts = ['localhost', '127.0.0.1'];
    $queryString = http_build_query($requestParams);
    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/openalex-api/works?' . $queryString;
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

$doi = qpmNormalizeOpenAlexLookupDoi($params['doi'] ?? '');
$doisInput = $params['dois'] ?? [];
$dois = is_array($doisInput) ? $doisInput : ($doisInput !== '' ? [$doisInput] : []);
$normalizedDois = array_values(array_unique(array_filter(array_map('qpmNormalizeOpenAlexLookupDoi', $dois))));
$openAlexId = trim((string) ($params['openAlexId'] ?? ''));
$openAlexIdsInput = $params['openAlexIds'] ?? [];
$openAlexIds = is_array($openAlexIdsInput) ? $openAlexIdsInput : ($openAlexIdsInput !== '' ? [$openAlexIdsInput] : []);
$normalizedOpenAlexIds = array_values(array_unique(array_filter(array_map('qpmNormalizeOpenAlexLookupId', $openAlexIds))));
$domain = trim((string) ($params['domain'] ?? ''));
$lookupValue = $openAlexId !== '' ? $openAlexId : ($doi !== '' ? ('https://doi.org/' . $doi) : '');
$isBatchLookup = count($normalizedDois) > 0 || count($normalizedOpenAlexIds) > 0;

if (!$isBatchLookup && $lookupValue === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing DOI, DOI list, OpenAlex ID, or OpenAlex ID list']);
    exit;
}

$openAlexApiKey = qpmGetOpenAlexApiKey($domain);
$openAlexEmail = qpmGetOpenAlexEmail($domain);
if ($isBatchLookup) {
    $cachedWorks = [];
    $missingDois = [];
    $missingOpenAlexIds = [];
    foreach ($normalizedDois as $normalizedDoi) {
        $cached = qpmReadOpenAlexWorkCache('doi', $normalizedDoi, $domain);
        if ($cached['hit']) {
            if (is_array($cached['value'])) {
                $cachedWorks[] = $cached['value'];
            }
            continue;
        }
        $missingDois[] = $normalizedDoi;
    }
    foreach ($normalizedOpenAlexIds as $normalizedId) {
        $cached = qpmReadOpenAlexWorkCache('openalex', $normalizedId, $domain);
        if ($cached['hit']) {
            if (is_array($cached['value'])) {
                $cachedWorks[] = $cached['value'];
            }
            continue;
        }
        $missingOpenAlexIds[] = $normalizedId;
    }
    $allWorks = [];
    $filterChunks = [];
    foreach (array_chunk($missingDois, 100) as $chunk) {
        $filterChunks[] = ['filter' => 'doi:' . implode('|', $chunk), 'count' => count($chunk)];
    }
    foreach (array_chunk($missingOpenAlexIds, 100) as $chunk) {
        $filterChunks[] = ['filter' => 'openalex:' . implode('|', $chunk), 'count' => count($chunk)];
    }
    foreach ($filterChunks as $filterChunk) {
        $requestParams = [
            'filter' => $filterChunk['filter'],
            'per_page' => $filterChunk['count'],
            'select' => 'id,doi,ids,display_name,title,publication_date,publication_year,biblio,abstract_inverted_index,authorships,primary_location,language,type,type_crossref',
        ];
        if ($openAlexApiKey !== '') {
            $requestParams['api_key'] = $openAlexApiKey;
        }
        if ($openAlexEmail !== '') {
            $requestParams['mailto'] = $openAlexEmail;
        }
        $requestUrl = 'https://api.openalex.org/works?' . http_build_query($requestParams);

        qpmThrottleNlmRequests(5);
        $result = qpmOpenAlexWorkListLocalDevProxyRequest($requestParams);
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
            $shellResult = qpmOpenAlexWorkShellCurlRequest($requestUrl, ['Accept: application/json'], 30);
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
            echo json_encode(['error' => 'Invalid response from OpenAlex']);
            exit;
        }

        $results = isset($decoded['results']) && is_array($decoded['results']) ? $decoded['results'] : [];
        $allWorks = array_merge($allWorks, $results);
    }

    $works = [];
    $resolvedDoiKeys = [];
    $resolvedOpenAlexKeys = [];
    foreach ($allWorks as $work) {
        if (!is_array($work)) {
            continue;
        }
        $workDoi = qpmNormalizeOpenAlexLookupDoi($work['doi'] ?? ($work['ids']['doi'] ?? ''));
        $workOpenAlexId = trim((string) ($work['id'] ?? ''));
        if ($workDoi === '' && $workOpenAlexId === '') {
            continue;
        }
        $works[] = [
            'doi' => $workDoi,
            'openAlexId' => $workOpenAlexId,
            'work' => $work,
        ];
        $workEntry = $works[count($works) - 1];
        if ($workDoi !== '') {
            $resolvedDoiKeys[strtolower($workDoi)] = true;
            qpmWriteOpenAlexWorkCache('doi', $workDoi, $domain, $workEntry);
        }
        $shortOpenAlexId = qpmNormalizeOpenAlexLookupId($workOpenAlexId);
        if ($shortOpenAlexId !== '') {
            $resolvedOpenAlexKeys[$shortOpenAlexId] = true;
            qpmWriteOpenAlexWorkCache('openalex', $shortOpenAlexId, $domain, $workEntry);
        }
    }
    foreach ($missingDois as $missingDoi) {
        if (empty($resolvedDoiKeys[strtolower($missingDoi)])) {
            qpmWriteOpenAlexWorkCache('doi', $missingDoi, $domain, null, true);
        }
    }
    foreach ($missingOpenAlexIds as $missingId) {
        if (empty($resolvedOpenAlexKeys[$missingId])) {
            qpmWriteOpenAlexWorkCache('openalex', $missingId, $domain, null, true);
        }
    }

    echo json_encode([
        'dois' => $normalizedDois,
        'openAlexIds' => $normalizedOpenAlexIds,
        'works' => array_merge($cachedWorks, $works),
    ]);
    exit;
}

$singleCacheType = $openAlexId !== '' ? 'openalex' : 'doi';
$singleCacheValue = $openAlexId !== '' ? qpmNormalizeOpenAlexLookupId($openAlexId) : $doi;
$singleCached = qpmReadOpenAlexWorkCache($singleCacheType, $singleCacheValue, $domain);
if ($singleCached['hit']) {
    if (is_array($singleCached['value'])) {
        echo json_encode($singleCached['value']);
        exit;
    }
}

$requestUrl = 'https://api.openalex.org/works/' . rawurlencode($lookupValue);
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
$result = qpmOpenAlexWorkLocalDevProxyRequest($lookupValue, $openAlexApiKey, $openAlexEmail);
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
    $shellResult = qpmOpenAlexWorkShellCurlRequest($requestUrl, ['Accept: application/json'], 30);
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
    echo json_encode(['error' => 'Invalid response from OpenAlex']);
    exit;
}

$singleResponse = [
    'doi' => $doi,
    'openAlexId' => trim((string) ($decoded['id'] ?? $openAlexId)),
    'work' => $decoded,
];
qpmWriteOpenAlexWorkCache($singleCacheType, $singleCacheValue, $domain, $singleResponse);
echo json_encode($singleResponse);
