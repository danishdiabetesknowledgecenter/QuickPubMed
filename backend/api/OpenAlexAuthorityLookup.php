<?php
/**
 * OpenAlex authority signals lookup (authors + journal sources in one batch).
 * Returns h_index / summary_stats per author and 2yr_mean_citedness / h_index /
 * is_in_doaj per journal source. Used by the rerank authority multiplier.
 *
 * Authority signals are methodologically controversial and are default-disabled
 * on the frontend via authorityClamp=[1.0, 1.0].
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

// OpenAlex filter clauses become increasingly fragile above ~50 ids in a single
// request, so we cap batches at 50.
const QPM_OPENALEX_AUTHORITY_BATCH_LIMIT = 50;

function qpmIsLocalOpenAlexAuthorityRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

/**
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmOpenAlexAuthorityFallbackRequest(string $url, array $headers, int $timeout = 30): array
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
            'error' => $message !== '' ? $message : 'OpenAlex authority fallback request failed',
        ];
    }

    return ['ok' => true, 'status' => $status, 'body' => (string)$body, 'error' => ''];
}

/**
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmOpenAlexAuthorityShellCurlRequest(string $url, array $headers, int $timeout = 30): array
{
    if (!function_exists('exec')) {
        return ['ok' => false, 'status' => 0, 'body' => '', 'error' => 'exec() is disabled'];
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
        return ['ok' => false, 'status' => 0, 'body' => '', 'error' => 'curl binary produced no output'];
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
 * @param string $path Path under /openalex-api (e.g. 'authors' or 'sources')
 * @param array<string,mixed> $requestParams
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmOpenAlexAuthorityLocalDevProxyRequest(string $path, array $requestParams): array
{
    if (!qpmIsLocalOpenAlexAuthorityRequest()) {
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
        $url = 'http://' . $host . ':5173/openalex-api/' . $path . '?' . $queryString;
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

    return ['ok' => false, 'status' => 0, 'body' => '', 'error' => implode(' | ', $errors)];
}

/**
 * Normalize an OpenAlex identifier to its short id form (e.g. 'A12345').
 *
 * @param mixed $value
 * @return string
 */
function qpmNormalizeOpenAlexShortId($value): string
{
    $raw = trim((string) $value);
    if ($raw === '') {
        return '';
    }
    $raw = preg_replace('~^https?://openalex\.org/~i', '', $raw);
    $raw = ltrim((string) $raw, '/');
    $raw = strtoupper((string) $raw);
    return preg_match('/^[A-Z][0-9]+$/', $raw) ? $raw : '';
}

/**
 * @param array<int,string> $ids
 * @param string $entityPath 'authors' or 'sources'
 * @param string $select
 * @param string $domain
 * @return array<string,array<string,mixed>>
 */
function qpmOpenAlexAuthorityBatchFetch(array $ids, string $entityPath, string $select, string $domain): array
{
    $results = [];
    if (empty($ids)) {
        return $results;
    }

    $openAlexApiKey = qpmGetOpenAlexApiKey($domain);
    $openAlexEmail = qpmGetOpenAlexEmail($domain);

    foreach (array_chunk($ids, QPM_OPENALEX_AUTHORITY_BATCH_LIMIT) as $chunk) {
        $filter = 'openalex:' . implode('|', $chunk);
        $requestParams = [
            'filter' => $filter,
            'per_page' => count($chunk),
            'select' => $select,
        ];
        if ($openAlexApiKey !== '') {
            $requestParams['api_key'] = $openAlexApiKey;
        }
        if ($openAlexEmail !== '') {
            $requestParams['mailto'] = $openAlexEmail;
        }

        $requestUrl = 'https://api.openalex.org/' . $entityPath . '?' . http_build_query($requestParams);
        qpmThrottleRequestRate('openalex', 10);

        $result = qpmOpenAlexAuthorityLocalDevProxyRequest($entityPath, $requestParams);
        if (!$result['ok']) {
            $result = qpmHttpRequest($requestUrl, [
                'method' => 'GET',
                'timeout' => 30,
                'user_agent' => 'QuickPubMed/1.0',
                'headers' => ['Accept: application/json'],
            ]);
        }

        if (!$result['ok'] && strpos((string)$result['error'], 'stream fallback') !== false) {
            $fallback = qpmOpenAlexAuthorityFallbackRequest($requestUrl, ['Accept: application/json'], 30);
            if ($fallback['ok']) {
                $result = [
                    'ok' => true,
                    'status' => $fallback['status'],
                    'body' => $fallback['body'],
                    'content_type' => 'application/json',
                    'error' => '',
                ];
            } else {
                $result['error'] = trim((string)$result['error'] . ' | ' . (string)$fallback['error'], ' |');
            }
        }

        if (!$result['ok'] && strpos((string)$result['error'], 'stream fallback') !== false) {
            $shellResult = qpmOpenAlexAuthorityShellCurlRequest($requestUrl, ['Accept: application/json'], 30);
            if ($shellResult['ok']) {
                $result = [
                    'ok' => true,
                    'status' => $shellResult['status'],
                    'body' => $shellResult['body'],
                    'content_type' => 'application/json',
                    'error' => '',
                ];
            }
        }

        if (!$result['ok']) {
            continue;
        }

        $decoded = json_decode($result['body'], true);
        if (!is_array($decoded)) {
            continue;
        }

        $rows = isset($decoded['results']) && is_array($decoded['results']) ? $decoded['results'] : [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $shortId = qpmNormalizeOpenAlexShortId($row['id'] ?? '');
            if ($shortId === '') {
                continue;
            }
            $results[$shortId] = $row;
        }
    }

    return $results;
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

$domain = trim((string) ($params['domain'] ?? ''));

$authorIdsInput = $params['authorIds'] ?? [];
if (is_string($authorIdsInput)) {
    $authorIdsInput = preg_split('/[,\s]+/', $authorIdsInput) ?: [];
}
$sourceIdsInput = $params['sourceIds'] ?? [];
if (is_string($sourceIdsInput)) {
    $sourceIdsInput = preg_split('/[,\s]+/', $sourceIdsInput) ?: [];
}

$authorIds = [];
foreach ((is_array($authorIdsInput) ? $authorIdsInput : []) as $raw) {
    $normalized = qpmNormalizeOpenAlexShortId($raw);
    if ($normalized !== '') {
        $authorIds[$normalized] = true;
    }
}
$authorIds = array_keys($authorIds);

$sourceIds = [];
foreach ((is_array($sourceIdsInput) ? $sourceIdsInput : []) as $raw) {
    $normalized = qpmNormalizeOpenAlexShortId($raw);
    if ($normalized !== '') {
        $sourceIds[$normalized] = true;
    }
}
$sourceIds = array_keys($sourceIds);

$authorRecords = [];
$sourceRecords = [];

if (!empty($authorIds)) {
    $authorRaw = qpmOpenAlexAuthorityBatchFetch(
        $authorIds,
        'authors',
        'id,display_name,summary_stats,works_count',
        $domain
    );
    foreach ($authorRaw as $shortId => $row) {
        $summary = isset($row['summary_stats']) && is_array($row['summary_stats']) ? $row['summary_stats'] : [];
        $hIndex = $summary['h_index'] ?? null;
        $i10 = $summary['i10_index'] ?? null;
        $meanCitedness = $summary['2yr_mean_citedness'] ?? null;
        $authorRecords[$shortId] = [
            'hIndex' => is_numeric($hIndex) ? (int) $hIndex : null,
            'i10Index' => is_numeric($i10) ? (int) $i10 : null,
            'meanCitedness' => is_numeric($meanCitedness) ? (float) $meanCitedness : null,
            'worksCount' => isset($row['works_count']) && is_numeric($row['works_count']) ? (int) $row['works_count'] : null,
        ];
    }
}

if (!empty($sourceIds)) {
    $sourceRaw = qpmOpenAlexAuthorityBatchFetch(
        $sourceIds,
        'sources',
        'id,display_name,summary_stats,is_in_doaj,works_count',
        $domain
    );
    foreach ($sourceRaw as $shortId => $row) {
        $summary = isset($row['summary_stats']) && is_array($row['summary_stats']) ? $row['summary_stats'] : [];
        $hIndex = $summary['h_index'] ?? null;
        $meanCitedness = $summary['2yr_mean_citedness'] ?? null;
        $isInDoaj = isset($row['is_in_doaj']) ? (bool) $row['is_in_doaj'] : null;
        $sourceRecords[$shortId] = [
            'hIndex' => is_numeric($hIndex) ? (int) $hIndex : null,
            'meanCitedness' => is_numeric($meanCitedness) ? (float) $meanCitedness : null,
            'isInDoaj' => $isInDoaj,
            'worksCount' => isset($row['works_count']) && is_numeric($row['works_count']) ? (int) $row['works_count'] : null,
        ];
    }
}

echo json_encode([
    'authors' => (object) $authorRecords,
    'sources' => (object) $sourceRecords,
    'requestedAuthorCount' => count($authorIds),
    'requestedSourceCount' => count($sourceIds),
    'returnedAuthorCount' => count($authorRecords),
    'returnedSourceCount' => count($sourceRecords),
]);
