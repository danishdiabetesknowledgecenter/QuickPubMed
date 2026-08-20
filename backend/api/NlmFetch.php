<?php
/**
 * NLM efetch API Proxy
 * Proxies requests to NCBI E-utilities efetch endpoint
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';
require_once __DIR__ . '/NlmResponseCache.php';

muginApplyNlmCorsHeaders('GET, OPTIONS');

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
$nlmBaseUrl = muginGetNlmBaseUrl($domain);

// Set content type based on retmode
$retmode = $params['retmode'] ?? 'xml';
if ($retmode === 'json') {
    header('Content-Type: application/json');
} else {
    header('Content-Type: application/xml');
}

$url = $nlmBaseUrl . '/efetch.fcgi?' . http_build_query($params);
$cachedResult = muginReadNlmResponseCache('efetch', (string) $domain, $params);
if ($cachedResult !== null) {
    http_response_code($cachedResult['status'] > 0 ? $cachedResult['status'] : 200);
    echo $cachedResult['body'];
    exit;
}

// Make request to NLM
muginThrottleNlmRequests(10);
$result = muginHttpRequest($url, [
    'method' => 'GET',
    'timeout' => 30,
    'user_agent' => 'MuginScholar/1.0',
]);

if (!$result['ok']) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $result['error']]);
    exit;
}

muginWriteNlmResponseCache('efetch', (string) $domain, $params, $result);
http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
