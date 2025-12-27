<?php
/**
 * NLM esearch API Proxy
 * Proxies requests to NCBI E-utilities esearch endpoint
 */

require_once __DIR__ . '/../config.php';

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
header('Content-Type: application/json');

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
$params['retmode'] = $params['retmode'] ?? 'json';

$url = NLM_BASE_URL . '/esearch.fcgi?' . http_build_query($params);

// Make request to NLM
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_USERAGENT => 'QuickPubMed/1.0'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

http_response_code($httpCode);
echo $response;

