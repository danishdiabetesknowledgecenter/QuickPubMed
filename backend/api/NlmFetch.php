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

// CORS headers - check both Origin and Referer for compatibility
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
    $parsed = parse_url($_SERVER['HTTP_REFERER']);
    $origin = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
}
$allowedOrigin = getAllowedOrigin($origin);

if ($allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
} else {
    // Fallback: allow all origins for GET requests (public API data)
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Build NLM API URL with server-side credentials
$params = $_GET;
$params['api_key'] = NLM_API_KEY;
$params['email'] = NLM_EMAIL;
$params['tool'] = 'QuickPubMed';
$params['db'] = $params['db'] ?? 'pubmed';

// Set content type based on retmode
$retmode = $params['retmode'] ?? 'xml';
if ($retmode === 'json') {
    header('Content-Type: application/json');
} else {
    header('Content-Type: application/xml');
}

$url = NLM_BASE_URL . '/efetch.fcgi?' . http_build_query($params);

// Make request to NLM
qpmThrottleNlmRequests(10);
$result = qpmHttpRequest($url, [
    'method' => 'GET',
    'timeout' => 30,
    'user_agent' => 'QuickPubMed/1.0',
]);

if (!$result['ok']) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
