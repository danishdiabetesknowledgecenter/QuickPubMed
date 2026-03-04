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

qpmApplyNlmCorsHeaders('GET, OPTIONS', 'application/json');

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

// Make request to NLM
qpmThrottleNlmRequests(10);
$result = qpmHttpRequest($url, [
    'method' => 'GET',
    'timeout' => 30,
    'user_agent' => 'QuickPubMed/1.0',
]);

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
