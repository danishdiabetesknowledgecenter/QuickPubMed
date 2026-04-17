<?php
/**
 * NIH iCite batch lookup proxy.
 * Returns field-normalized citation metrics (RCR, NIH percentile) and clinical
 * signals (is_clinical, cited_by_clin, apt) for one or more PubMed IDs.
 *
 * iCite is free, requires no API key, and is specifically designed for
 * biomedical literature. PMIDs only — DOI-only records must fall back to
 * other sources (OpenAlex FWCI) in the rerank cascade.
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

// Limit batch size to 500 to avoid hitting URL length caps in upstream proxies
// (1000 × ~9 chars ≈ 9 KB which exceeds some 8 KB limits).
const QPM_ICITE_BATCH_LIMIT = 500;

function qpmIsLocalICiteRequest(): bool
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
function qpmICiteFallbackRequest(string $url, array $headers, int $timeout = 30): array
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
            'error' => $message !== '' ? $message : 'iCite fallback request failed',
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
 * @param string $url
 * @param array<int,string> $headers
 * @param int $timeout
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmICiteShellCurlRequest(string $url, array $headers, int $timeout = 30): array
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
 * @param array<int,string> $pmids
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmICiteLocalDevProxyRequest(array $pmids): array
{
    if (!qpmIsLocalICiteRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $hosts = ['localhost', '127.0.0.1'];
    $queryString = http_build_query([
        'pmids' => implode(',', $pmids),
    ]);
    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/icite-api/api/pubs?' . $queryString;
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

/**
 * Fetch one iCite batch with all available fallbacks.
 *
 * @param array<int,string> $pmids
 * @return array{ok: bool, status: int, body: string, error: string}
 */
function qpmICiteFetchBatch(array $pmids): array
{
    qpmThrottleRequestRate('icite', 5);

    $url = 'https://icite.od.nih.gov/api/pubs?' . http_build_query([
        'pmids' => implode(',', $pmids),
    ]);
    $headers = ['Accept: application/json'];

    if (qpmIsLocalICiteRequest()) {
        $localDevProxyResult = qpmICiteLocalDevProxyRequest($pmids);
        if ($localDevProxyResult['ok']) {
            return $localDevProxyResult;
        }
    }

    $result = qpmHttpRequest($url, [
        'method' => 'GET',
        'timeout' => 20,
        'user_agent' => 'QuickPubMed/1.0',
        'headers' => $headers,
    ]);

    if (
        !$result['ok'] &&
        strpos((string)$result['error'], 'stream fallback') !== false
    ) {
        $fallbackResult = qpmICiteFallbackRequest($url, $headers, 20);
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
        $shellCurlResult = qpmICiteShellCurlRequest($url, $headers, 20);
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

    if ($result['ok'] && (int)$result['status'] >= 200 && (int)$result['status'] < 300) {
        return [
            'ok' => true,
            'status' => (int)$result['status'],
            'body' => (string)$result['body'],
            'error' => '',
        ];
    }

    return [
        'ok' => false,
        'status' => (int)($result['status'] ?? 0),
        'body' => (string)($result['body'] ?? ''),
        'error' => (string)($result['error'] ?? 'iCite request failed'),
    ];
}

/**
 * Normalize one iCite record to the rerank-layer schema.
 * Missing fields become null (not zero) to preserve "signal absent" semantics.
 *
 * @param array<string,mixed> $record
 * @return array<string,mixed>
 */
function qpmNormalizeICiteRecord(array $record): array
{
    $rcr = $record['relative_citation_ratio'] ?? null;
    $nihPercentile = $record['nih_percentile'] ?? null;
    $apt = $record['apt'] ?? null;
    $fieldCitationRate = $record['field_citation_rate'] ?? null;
    $citedByClin = $record['cited_by_clin'] ?? null;
    if (is_array($citedByClin)) {
        $citedByClin = count($citedByClin);
    }
    $isClinical = isset($record['is_clinical']) ? (bool) $record['is_clinical'] : null;

    return [
        'relativeCitationRatio' => is_numeric($rcr) ? (float) $rcr : null,
        'nihPercentile' => is_numeric($nihPercentile) ? (float) $nihPercentile : null,
        'isClinical' => $isClinical,
        'citedByClin' => is_numeric($citedByClin) ? (int) $citedByClin : null,
        'apt' => is_numeric($apt) ? (float) $apt : null,
        'fieldCitationRate' => is_numeric($fieldCitationRate) ? (float) $fieldCitationRate : null,
        'citedByCount' => isset($record['citation_count']) && is_numeric($record['citation_count'])
            ? (int) $record['citation_count']
            : null,
        'year' => isset($record['year']) && is_numeric($record['year'])
            ? (int) $record['year']
            : null,
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

$pmidsInput = $params['pmids'] ?? [];
if (is_string($pmidsInput)) {
    $pmidsInput = preg_split('/[,\s]+/', $pmidsInput) ?: [];
}
if (!is_array($pmidsInput)) {
    $pmidsInput = [];
}

$normalizedPmids = [];
foreach ($pmidsInput as $value) {
    $pmid = trim((string) $value);
    if ($pmid === '' || !preg_match('/^[0-9]+$/', $pmid)) {
        continue;
    }
    $normalizedPmids[$pmid] = true;
}
$normalizedPmids = array_keys($normalizedPmids);

if (empty($normalizedPmids)) {
    echo json_encode([
        'pmids' => [],
        'records' => (object) [],
        'batchCount' => 0,
    ]);
    exit;
}

$records = [];
$requestErrors = [];
$partial = false;
$batchCount = 0;

foreach (array_chunk($normalizedPmids, QPM_ICITE_BATCH_LIMIT) as $chunk) {
    $batchCount += 1;
    $result = qpmICiteFetchBatch($chunk);
    if (!$result['ok']) {
        $requestErrors[] = (string) $result['error'];
        $partial = true;
        continue;
    }

    $decoded = json_decode($result['body'], true);
    if (!is_array($decoded)) {
        $requestErrors[] = 'Invalid iCite response body';
        $partial = true;
        continue;
    }

    $data = $decoded['data'] ?? [];
    if (!is_array($data)) {
        continue;
    }

    foreach ($data as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $pmid = isset($entry['pmid']) ? trim((string) $entry['pmid']) : '';
        if ($pmid === '' || !preg_match('/^[0-9]+$/', $pmid)) {
            continue;
        }
        $records[$pmid] = qpmNormalizeICiteRecord($entry);
    }
}

echo json_encode([
    'pmids' => array_values($normalizedPmids),
    'records' => (object) $records,
    'batchCount' => $batchCount,
    'partial' => $partial,
    'warnings' => $partial ? implode(' | ', array_filter($requestErrors)) : '',
]);
