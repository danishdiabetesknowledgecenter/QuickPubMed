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
require_once dirname(__DIR__) . '/app/source-clients/openalex-helpers.php';

muginApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');
@ini_set('max_execution_time', '60');
@set_time_limit(60);

function muginIsLocalOpenAlexLookupRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function muginOpenAlexWorkLocalDevProxyRequest(string $lookupValue, string $apiKey = '', string $mailto = ''): array
{
    if (!muginIsLocalOpenAlexLookupRequest()) {
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
        $result = muginHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 30,
            'user_agent' => 'MuginScholar/1.0',
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

function muginOpenAlexWorkListLocalDevProxyRequest(array $requestParams): array
{
    if (!muginIsLocalOpenAlexLookupRequest()) {
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
        $result = muginHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 30,
            'user_agent' => 'MuginScholar/1.0',
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

$doi = muginNormalizeOpenAlexLookupDoi($params['doi'] ?? '');
$doisInput = $params['dois'] ?? [];
$dois = is_array($doisInput) ? $doisInput : ($doisInput !== '' ? [$doisInput] : []);
$normalizedDois = array_values(array_unique(array_filter(array_map('muginNormalizeOpenAlexLookupDoi', $dois))));
$openAlexId = trim((string) ($params['openAlexId'] ?? ''));
$openAlexIdsInput = $params['openAlexIds'] ?? [];
$openAlexIds = is_array($openAlexIdsInput) ? $openAlexIdsInput : ($openAlexIdsInput !== '' ? [$openAlexIdsInput] : []);
$normalizedOpenAlexIds = array_values(array_unique(array_filter(array_map('muginNormalizeOpenAlexLookupId', $openAlexIds))));
$domain = trim((string) ($params['domain'] ?? ''));
$lookupValue = $openAlexId !== '' ? $openAlexId : ($doi !== '' ? ('https://doi.org/' . $doi) : '');
$isBatchLookup = count($normalizedDois) > 0 || count($normalizedOpenAlexIds) > 0;
// DOI-rule validation only needs lightweight metadata (year, source, biblio, type),
// not the heavy abstract_inverted_index / authorships fields. A light batch keeps the
// OpenAlex payload small and is cached under a separate namespace so it never
// overwrites the full record that hydration/display relies on.
$lightSelect = !empty($params['light']);
$selectVariant = $lightSelect ? 'light' : 'full';

if (!$isBatchLookup && $lookupValue === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing DOI, DOI list, OpenAlex ID, or OpenAlex ID list']);
    exit;
}

$openAlexApiKey = muginGetOpenAlexApiKey($domain);
$openAlexEmail = muginGetOpenAlexEmail($domain);
if ($isBatchLookup) {
    $cachedWorks = [];
    $missingDois = [];
    $missingOpenAlexIds = [];
    foreach ($normalizedDois as $normalizedDoi) {
        $cached = muginReadOpenAlexWorkCache('doi', $normalizedDoi, $domain, $selectVariant);
        if ($cached['hit']) {
            $normalized = muginNormalizeOpenAlexWorkLookupEntry($cached['value']);
            if ($normalized !== null) {
                $cachedWorks[] = $normalized;
            }
            continue;
        }
        $missingDois[] = $normalizedDoi;
    }
    foreach ($normalizedOpenAlexIds as $normalizedId) {
        $cached = muginReadOpenAlexWorkCache('openalex', $normalizedId, $domain, $selectVariant);
        if ($cached['hit']) {
            $normalized = muginNormalizeOpenAlexWorkLookupEntry($cached['value']);
            if ($normalized !== null) {
                $cachedWorks[] = $normalized;
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
            'select' => $lightSelect
                ? 'id,doi,ids,display_name,title,publication_date,publication_year,biblio,primary_location,language,type,type_crossref'
                : 'id,doi,ids,display_name,title,publication_date,publication_year,biblio,abstract_inverted_index,authorships,primary_location,language,type,type_crossref,primary_topic,topics,keywords,open_access,is_retracted,cited_by_count',
        ];
        if ($openAlexApiKey !== '') {
            $requestParams['api_key'] = $openAlexApiKey;
        }
        if ($openAlexEmail !== '') {
            $requestParams['mailto'] = $openAlexEmail;
        }
        $requestUrl = 'https://api.openalex.org/works?' . http_build_query($requestParams);

        muginThrottleRequestRate('openalex', 5);
        $result = muginOpenAlexWorkListLocalDevProxyRequest($requestParams);
        if (!$result['ok']) {
            $result = muginHttpRequest($requestUrl, [
                'method' => 'GET',
                'timeout' => 30,
                'user_agent' => 'MuginScholar/1.0',
                'headers' => ['Accept: application/json'],
            ]);
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
        $workDoi = muginNormalizeOpenAlexLookupDoi($work['doi'] ?? ($work['ids']['doi'] ?? ''));
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
            muginWriteOpenAlexWorkCache('doi', $workDoi, $domain, $workEntry, false, $selectVariant);
        }
        $shortOpenAlexId = muginNormalizeOpenAlexLookupId($workOpenAlexId);
        if ($shortOpenAlexId !== '') {
            $resolvedOpenAlexKeys[$shortOpenAlexId] = true;
            muginWriteOpenAlexWorkCache('openalex', $shortOpenAlexId, $domain, $workEntry, false, $selectVariant);
        }
    }
    foreach ($missingDois as $missingDoi) {
        if (empty($resolvedDoiKeys[strtolower($missingDoi)])) {
            muginWriteOpenAlexWorkCache('doi', $missingDoi, $domain, null, true, $selectVariant);
        }
    }
    foreach ($missingOpenAlexIds as $missingId) {
        if (empty($resolvedOpenAlexKeys[$missingId])) {
            muginWriteOpenAlexWorkCache('openalex', $missingId, $domain, null, true, $selectVariant);
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
$singleCacheValue = $openAlexId !== '' ? muginNormalizeOpenAlexLookupId($openAlexId) : $doi;
$singleCached = muginReadOpenAlexWorkCache($singleCacheType, $singleCacheValue, $domain);
if ($singleCached['hit']) {
    $normalized = muginNormalizeOpenAlexWorkLookupEntry($singleCached['value']);
    if ($normalized !== null) {
        echo json_encode($normalized);
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

muginThrottleRequestRate('openalex', 5);
$result = muginOpenAlexWorkLocalDevProxyRequest($lookupValue, $openAlexApiKey, $openAlexEmail);
if (!$result['ok']) {
    $result = muginHttpRequest($requestUrl, [
        'method' => 'GET',
        'timeout' => 30,
        'user_agent' => 'MuginScholar/1.0',
        'headers' => ['Accept: application/json'],
    ]);
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
muginWriteOpenAlexWorkCache($singleCacheType, $singleCacheValue, $domain, $singleResponse);
echo json_encode($singleResponse);
