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

qpmApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');

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
$domain = qpmResolveDomain();
$params['api_key'] = qpmGetNlmApiKey($domain);
$params['email'] = qpmGetNlmEmail($domain);
$params['tool'] = 'QuickPubMed';
$params['db'] = $params['db'] ?? 'pubmed';
$params['retmode'] = $params['retmode'] ?? 'json';
$nlmBaseUrl = qpmGetNlmBaseUrl($domain);

$url = $nlmBaseUrl . '/esearch.fcgi';

// Make request to NLM (use POST to avoid long URL issues)
qpmThrottleNlmRequests(10);
$result = qpmHttpRequest($url, [
    'method' => 'POST',
    'timeout' => 30,
    'user_agent' => 'QuickPubMed/1.0',
    'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
    'body' => http_build_query($params),
]);

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
