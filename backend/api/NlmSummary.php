<?php
/**
 * NLM esummary API Proxy
 * Proxies requests to NCBI E-utilities esummary endpoint
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';
require_once __DIR__ . '/NlmResponseCache.php';

qpmApplyNlmCorsHeaders('GET, OPTIONS', 'application/json');

function qpmIsLocalNlmSummaryRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function qpmNlmSummaryFallbackGetRequest(string $url, int $timeout = 30): array
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => $timeout,
            'ignore_errors' => true,
            'protocol_version' => 1.1,
            'header' => "User-Agent: QuickPubMed/1.0\r\n",
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
            'error' => $message !== '' ? $message : 'NLM summary fallback request failed',
        ];
    }

    return [
        'ok' => true,
        'status' => $status,
        'body' => (string)$responseBody,
        'error' => '',
    ];
}

function qpmNlmSummaryShellCurlRequest(string $url, int $timeout = 30): array
{
    if (!function_exists('exec')) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'exec() is disabled',
        ];
    }

    $parts = [
        'curl',
        '-sS',
        '-L',
        '--max-time',
        (string)max(1, (int)$timeout),
        '-H',
        'User-Agent: QuickPubMed/1.0',
        '-w',
        '\n%{http_code}',
        $url,
    ];
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

function qpmNlmSummaryLocalDevProxyRequest(array $params, int $timeout = 30): array
{
    $hosts = ['localhost', '127.0.0.1'];
    if (!qpmIsLocalNlmSummaryRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $queryString = http_build_query($params);
    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/nlm-api/entrez/eutils/esummary.fcgi?' . $queryString;
        $result = qpmHttpRequest($url, [
            'method' => 'GET',
            'timeout' => $timeout,
            'user_agent' => 'QuickPubMed/1.0',
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

// Build NLM API URL with server-side credentials
$params = $_GET;
$domain = qpmResolveDomain();
$params['api_key'] = qpmGetNlmApiKey($domain);
$params['email'] = qpmGetNlmEmail($domain);
$params['tool'] = 'QuickPubMed';
$params['db'] = $params['db'] ?? 'pubmed';
$params['retmode'] = $params['retmode'] ?? 'json';
$nlmBaseUrl = qpmGetNlmBaseUrl($domain);

$url = $nlmBaseUrl . '/esummary.fcgi?' . http_build_query($params);
$cachedResult = qpmReadNlmResponseCache('esummary', (string) $domain, $params);
if ($cachedResult !== null) {
    http_response_code($cachedResult['status'] > 0 ? $cachedResult['status'] : 200);
    echo $cachedResult['body'];
    exit;
}

// Make request to NLM
qpmThrottleNlmRequests(10);
$result = qpmNlmSummaryLocalDevProxyRequest($params, 30);
if (!$result['ok']) {
    $result = qpmHttpRequest($url, [
        'method' => 'GET',
        'timeout' => 30,
        'user_agent' => 'QuickPubMed/1.0',
    ]);
}

if (
    !$result['ok'] &&
    strpos((string)$result['error'], 'stream fallback') !== false
) {
    $fallbackResult = qpmNlmSummaryFallbackGetRequest($url, 30);
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
    $shellCurlResult = qpmNlmSummaryShellCurlRequest($url, 30);
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
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

qpmWriteNlmResponseCache('esummary', (string) $domain, $params, $result);
http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
