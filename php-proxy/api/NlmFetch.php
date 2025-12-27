<?php
/**
 * NLM efetch API Proxy
 * Proxies requests to NCBI E-utilities efetch endpoint
 */

require_once __DIR__ . '/../config.php';

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = getAllowedOrigin($origin);

if ($allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
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
    header('Content-Type: application/json');
    echo json_encode(['error' => curl_error($ch)]);
    curl_close($ch);
    exit;
}

curl_close($ch);

http_response_code($httpCode);
echo $response;

