<?php
/**
 * Live gates 3–7 against a running backend (local php -S, staging, or production).
 *
 * Skips when health is unreachable unless MUGIN_REQUIRE_LIVE=1.
 *
 * Run: php scripts/production-live-gates.php
 * Env: MUGIN_STRESS_BASE (default http://127.0.0.1:8080)
 *      MUGIN_LIVE_GATES=security,quality,stability,deploy (default all)
 */

$configPath = dirname(__DIR__) . '/backend/config/config.php';
if (is_file($configPath)) {
    require_once $configPath;
}
require_once dirname(__DIR__) . '/backend/app/public-search-lib.php';

$base = rtrim((string) (getenv('MUGIN_STRESS_BASE') ?: 'http://127.0.0.1:8080'), '/');
$requireLive = getenv('MUGIN_REQUIRE_LIVE') === '1';
$gateFilter = strtolower(trim((string) (
    ($argv[1] ?? '') !== ''
        ? $argv[1]
        : (getenv('MUGIN_LIVE_GATES') ?: 'security,quality,stability,deploy')
)));
$wanted = array_fill_keys(array_filter(array_map('trim', explode(',', $gateFilter))), true);

$publicSearchUrl = $base . '/public-api/v1/search';
$publicHealthUrl = $base . '/public-api/v1/health';
$unifiedUrl = $base . '/backend/api/UnifiedSearch.php';

$apiKey = '';
if (defined('MUGIN_API_CLIENTS') && is_array(MUGIN_API_CLIENTS)) {
    foreach (MUGIN_API_CLIENTS as $clientCfg) {
        if (!empty($clientCfg['enabled']) && !empty($clientCfg['api_key'])) {
            $apiKey = (string) $clientCfg['api_key'];
            break;
        }
    }
}
if (getenv('MUGIN_API_KEY')) {
    $apiKey = (string) getenv('MUGIN_API_KEY');
}

$failures = 0;
function liveAssert(bool $condition, string $message): void
{
    global $failures;
    if ($condition) {
        echo "PASS: $message\n";
        return;
    }
    $failures++;
    echo "FAIL: $message\n";
}

function liveHttp(string $method, string $url, array $headers, ?string $body, int $timeoutSeconds = 120): array
{
    $ch = curl_init($url);
    $headerLines = [];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $headerLines,
        CURLOPT_TIMEOUT => $timeoutSeconds,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $started = microtime(true);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $elapsedMs = (int) round((microtime(true) - $started) * 1000);
    if ($raw === false) {
        return [
            'ok' => false,
            'status' => $status,
            'error' => $error !== '' ? $error : ('curl errno ' . $errno),
            'headers' => '',
            'body' => '',
            'json' => null,
            'elapsedMs' => $elapsedMs,
        ];
    }
    $headerRaw = substr($raw, 0, $headerSize);
    $bodyRaw = substr($raw, $headerSize);
    $json = null;
    $trim = ltrim($bodyRaw);
    if ($trim !== '' && ($trim[0] === '{' || $trim[0] === '[')) {
        $decoded = json_decode($bodyRaw, true);
        $json = is_array($decoded) ? $decoded : null;
    }
    return [
        'ok' => $errno === 0,
        'status' => $status,
        'error' => $error,
        'headers' => $headerRaw,
        'body' => $bodyRaw,
        'json' => $json,
        'elapsedMs' => $elapsedMs,
    ];
}

function liveEncodeForm(array $params): string
{
    $parts = [];
    foreach ($params as $key => $value) {
        if (is_array($value)) {
            foreach ($value as $item) {
                $parts[] = rawurlencode((string) $key) . '=' . rawurlencode((string) $item);
            }
        } elseif ($value !== null) {
            $parts[] = rawurlencode((string) $key) . '=' . rawurlencode((string) $value);
        }
    }
    return implode('&', $parts);
}

function liveWanted(array $wanted, string $gate): bool
{
    return isset($wanted[$gate]) || isset($wanted['all']);
}

function livePubmedQuery(?array $json): string
{
    if (!is_array($json)) {
        return '';
    }
    $resolved = is_array($json['resolvedQueries'] ?? null) ? $json['resolvedQueries'] : [];
    foreach (['hardFilterQuery', 'pubmedQuery'] as $key) {
        $value = $resolved[$key] ?? '';
        if (is_string($value) && trim($value) !== '') {
            return $value;
        }
    }
    return '';
}

$health = liveHttp('GET', $publicHealthUrl, ['Accept' => 'application/json'], null, 8);
if (($health['status'] ?? 0) !== 200) {
    $detail = 'health HTTP ' . ($health['status'] ?? 0) . ' ' . (string) ($health['error'] ?? '');
    if (!$requireLive) {
        echo "SKIP: live gates ($detail). Start the backend or set MUGIN_REQUIRE_LIVE=1.\n";
        exit(0);
    }
    fwrite(STDERR, "Live backend required but unavailable: $detail\n");
    exit(1);
}
echo "Live backend: {$base}\n";

$auth = $apiKey !== '' ? ['X-API-Key' => $apiKey] : [];
$formHeaders = ['Content-Type' => 'application/x-www-form-urlencoded', 'Accept' => 'application/json'];
$jsonHeaders = ['Content-Type' => 'application/json', 'Accept' => 'application/json'];

$catalogForm = liveEncodeForm([
    'domain' => 'template',
    'topic' => 'S010030#s',
    'databases' => 'pubmed',
    'ai' => 'false',
    'sort' => 'relevance',
    'pagesize' => '10',
]);

if (liveWanted($wanted, 'security') || liveWanted($wanted, 'deploy')) {
    liveAssert(($health['status'] ?? 0) === 200, 'Deploy/security: GET /v1/health is 200');
    $noAuth = liveHttp('POST', $publicSearchUrl, $jsonHeaders, json_encode([
        'apiVersion' => '1',
        'query' => ['text' => 'diabetes'],
        'sources' => ['pubmed'],
    ], JSON_UNESCAPED_UNICODE), 30);
    liveAssert(($noAuth['status'] ?? 0) === 401, 'Security: public search without API key is 401');
    $unknownField = liveHttp(
        'POST',
        $publicSearchUrl,
        $jsonHeaders + $auth,
        json_encode([
            'apiVersion' => '1',
            'query' => ['text' => 'diabetes'],
            'sources' => ['pubmed'],
            'nope' => true,
        ], JSON_UNESCAPED_UNICODE),
        30
    );
    liveAssert(($unknownField['status'] ?? 0) === 422, 'Security: unknown JSON field is 422');
    if ($apiKey !== '') {
        $search = liveHttp('POST', $publicSearchUrl, $formHeaders + $auth, $catalogForm, 120);
        liveAssert(
            ($search['status'] ?? 0) === 200,
            'Security: authenticated catalog search is 200'
                . (($search['status'] ?? 0) !== 200 ? ' (got ' . ($search['status'] ?? 0) . ' ' . substr((string) ($search['body'] ?? $search['error'] ?? ''), 0, 180) . ')' : '')
        );
        liveAssert(
            stripos((string) ($search['headers'] ?? ''), 'no-store') !== false,
            'Security: search response has Cache-Control no-store'
        );
        $blob = strtolower((string) ($search['body'] ?? ''));
        liveAssert(
            strpos($blob, strtolower($apiKey)) === false,
            'Security: API key does not appear in the search body'
        );
        foreach (['OPENAI_API_KEY', 'REQUESTY_API_KEY', 'ELICIT_API_KEY', 'NLM_API_KEY'] as $constantName) {
            if (!defined($constantName)) {
                continue;
            }
            $secret = trim((string) constant($constantName));
            if ($secret === '' || stripos($secret, 'INSERT') !== false || stripos($secret, 'REPLACE') !== false) {
                continue;
            }
            liveAssert(
                strpos((string) ($search['body'] ?? ''), $secret) === false,
                'Security: ' . $constantName . ' does not appear in the search body'
            );
        }
    } else {
        echo "SKIP: authenticated security checks (no API key in config/env)\n";
    }
}

if (liveWanted($wanted, 'quality') || liveWanted($wanted, 'deploy')) {
    if ($apiKey === '') {
        echo "SKIP: quality live searches (no API key)\n";
    } else {
        $lookbackForm = liveEncodeForm([
            'domain' => 'template',
            'topic' => 'S010030#s',
            'databases' => 'pubmed',
            'ai' => 'false',
            'sort' => 'relevance',
            'pagesize' => '10',
            'limit' => 'L070010#s',
        ]);
        $lookback = liveHttp('POST', $publicSearchUrl, $formHeaders + $auth, $lookbackForm, 120);
        $q = livePubmedQuery($lookback['json'] ?? null);
        liveAssert(
            ($lookback['status'] ?? 0) === 200,
            'Quality: 1-year lookback search is 200'
                . (($lookback['status'] ?? 0) !== 200 ? ' (got ' . ($lookback['status'] ?? 0) . ' ' . substr((string) ($lookback['body'] ?? $lookback['error'] ?? ''), 0, 180) . ')' : '')
        );
        liveAssert(
            strpos($q, 'y_1[Filter]') !== false && strpos($q, '1:1[dp]') === false,
            'Quality: lookback query uses y_1[Filter] not 1:1[dp]'
        );
        liveAssert(
            (int) (($lookback['json']['total'] ?? 0)) > 0,
            'Quality: lookback search returns hits'
        );

        $sexForm = liveEncodeForm([
            'domain' => 'template',
            'topic' => 'S010030#s',
            'databases' => 'pubmed',
            'ai' => 'false',
            'pagesize' => '10',
            'limit' => ['L050010#s', 'L050020#s'],
        ]);
        $sex = liveHttp('POST', $publicSearchUrl, $formHeaders + $auth, $sexForm, 120);
        $sexQuery = livePubmedQuery($sex['json'] ?? null);
        liveAssert(
            strpos($sexQuery, ') AND (') !== false,
            'Quality: female+male AND-groups are parenthesized in the live query'
        );
    }
}

if (liveWanted($wanted, 'stability')) {
    if ($apiKey === '') {
        echo "SKIP: stability (no API key)\n";
    } else {
        $elapsed = [];
        $allOk = true;
        for ($i = 0; $i < 3; $i++) {
            $row = liveHttp('POST', $publicSearchUrl, $formHeaders + $auth, $catalogForm, 120);
            $elapsed[] = (int) ($row['elapsedMs'] ?? 0);
            if (($row['status'] ?? 0) !== 200) {
                $allOk = false;
            }
        }
        liveAssert($allOk, 'Stability: three sequential pubmed-only searches returned 200');
        $maxMs = $elapsed === [] ? 0 : max($elapsed);
        liveAssert($maxMs > 0 && $maxMs < 90000, 'Stability: each sequential search finished under 90s (max ' . $maxMs . ' ms)');
        $unified = liveHttp('POST', $unifiedUrl, $formHeaders, $catalogForm, 120);
        liveAssert(($unified['status'] ?? 0) === 200, 'Stability: UnifiedSearch pubmed-only is 200');
    }
}

if ($failures > 0) {
    fwrite(STDERR, "\n{$failures} live gate assertion(s) failed.\n");
    exit(1);
}
echo "\nRequested live gates passed.\n";
