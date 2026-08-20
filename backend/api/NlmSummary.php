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

muginApplyNlmCorsHeaders('GET, OPTIONS', 'application/json');

function muginIsLocalNlmSummaryRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function muginNlmSummaryLocalDevProxyRequest(array $params, int $timeout = 30): array
{
    $hosts = ['localhost', '127.0.0.1'];
    if (!muginIsLocalNlmSummaryRequest()) {
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
        $result = muginHttpRequest($url, [
            'method' => 'GET',
            'timeout' => $timeout,
            'user_agent' => 'MuginScholar/1.0',
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
$domain = muginResolveDomain();
$nlmApiKey = muginGetNlmApiKey($domain);
if ($nlmApiKey !== '') {
    $params['api_key'] = $nlmApiKey;
} else {
    unset($params['api_key']);
}
$params['email'] = muginGetNlmEmail($domain);
$params['tool'] = 'MuginScholar';
$params['db'] = $params['db'] ?? 'pubmed';
$params['retmode'] = $params['retmode'] ?? 'json';
$nlmBaseUrl = muginGetNlmBaseUrl($domain);

$url = $nlmBaseUrl . '/esummary.fcgi?' . http_build_query($params);
$cachedResult = muginReadNlmResponseCache('esummary', (string) $domain, $params);
if ($cachedResult !== null) {
    http_response_code($cachedResult['status'] > 0 ? $cachedResult['status'] : 200);
    echo $cachedResult['body'];
    exit;
}

// Make request to NLM
muginThrottleNlmRequests(10);
$result = muginNlmSummaryLocalDevProxyRequest($params, 30);
if (!$result['ok']) {
    $result = muginHttpRequest($url, [
        'method' => 'GET',
        'timeout' => 30,
        'user_agent' => 'MuginScholar/1.0',
    ]);
}

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

muginWriteNlmResponseCache('esummary', (string) $domain, $params, $result);
http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
