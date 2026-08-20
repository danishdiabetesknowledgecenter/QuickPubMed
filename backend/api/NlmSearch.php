<?php
/**
 * NLM esearch API Proxy
 * Proxies requests to NCBI E-utilities esearch endpoint
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';
require_once dirname(__DIR__) . '/app/local-dev-proxy.php';

muginApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');

function muginNlmLocalDevProxyRequest(string $body, int $timeout = 30): array
{
    return muginLocalDevProxyRequest('nlm-api/entrez/eutils/esearch.fcgi', [
        'method' => 'POST',
        'timeout' => $timeout,
        'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
        'body' => $body,
    ]);
}

// Build NLM API URL with server-side credentials
$params = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
if (empty($params)) {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        parse_str($rawInput, $params);
    }
}
if (empty($params)) {
    $params = $_GET;
}
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

$url = $nlmBaseUrl . '/esearch.fcgi';

// Make request to NLM (use POST to avoid long URL issues)
muginThrottleNlmRequests(10);
$requestBody = http_build_query($params);
$requestHeaders = ['Content-Type' => 'application/x-www-form-urlencoded'];

$result = muginNlmLocalDevProxyRequest($requestBody, 30);
if (!$result['ok']) {
    $result = muginHttpRequest($url, [
        'method' => 'POST',
        'timeout' => 30,
        'user_agent' => 'MuginScholar/1.0',
        'headers' => $requestHeaders,
        'body' => $requestBody,
    ]);
}

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
