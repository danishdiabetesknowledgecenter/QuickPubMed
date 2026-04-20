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
    $allWorks = [];
    $filterChunks = [];
    foreach (array_chunk($normalizedDois, 100) as $chunk) {
        $filterChunks[] = ['filter' => 'doi:' . implode('|', $chunk), 'count' => count($chunk)];
    }
    foreach (array_chunk($normalizedOpenAlexIds, 100) as $chunk) {
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
    }

    echo json_encode([
        'dois' => $normalizedDois,
        'openAlexIds' => $normalizedOpenAlexIds,
        'works' => $works,
    ]);
    exit;
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

echo json_encode([
    'doi' => $doi,
    'openAlexId' => trim((string) ($decoded['id'] ?? $openAlexId)),
    'work' => $decoded,
]);
