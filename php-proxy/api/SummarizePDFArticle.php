<?php
/**
 * SummarizePDFArticle API Proxy
 * Simply forwards requests to Azure Function (solves CORS)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load config
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

// Azure Function URL
define('AZURE_FUNCTION_URL', 'https://qpm-openai-service.azurewebsites.net/api/SummarizePDFArticle');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (function_exists('getAllowedOrigin')) {
    $allowedOrigin = getAllowedOrigin($origin);
    if ($allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
    }
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get raw request body
$inputBody = file_get_contents('php://input');

// Debug info removed - forwarding to Azure

// Forward to Azure Function
$ch = curl_init(AZURE_FUNCTION_URL);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $inputBody,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: */*'
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 300,
    CURLOPT_FOLLOWLOCATION => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);

curl_close($ch);

// Forward response
if ($contentType) {
    header('Content-Type: ' . $contentType);
}

http_response_code($httpCode);

if ($curlError) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error: ' . $curlError]);
} else {
    echo $response;
}
