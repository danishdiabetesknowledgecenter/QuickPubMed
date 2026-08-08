<?php
/**
 * CheckIfResourceIsForbidden API
 * Forwards to Azure Function for resource checking (Azure has better access to scientific publishers)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load config
$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
if (file_exists($configPath)) {
    require_once $configPath;
}
require_once __DIR__ . '/NlmApiHelpers.php';
require_once __DIR__ . '/SummarizeArticleHelpers.php';

// Azure Function URL - use same server as PDF/HTML fetching
define('AZURE_CHECK_URL', 'https://qpm-openai-service.azurewebsites.net/api/CheckIfResourceIsForbidden');

qpmApplyNlmCorsHeaders('POST, OPTIONS', 'application/json');

// Only POST allowed
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$inputBody = file_get_contents('php://input');
$input = is_string($inputBody) && $inputBody !== '' ? json_decode($inputBody, true) : null;
if (!is_array($input)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$url = qpmRequirePublicHttpsUrl($input['url'] ?? '', 'url');
$forwardBody = json_encode(['url' => $url], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Forward to Azure Function
$ch = curl_init(AZURE_CHECK_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $forwardBody,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_FOLLOWLOCATION => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Proxy error: ' . $curlError]);
    exit;
}

header('Content-Type: application/json');
http_response_code($httpCode > 0 ? $httpCode : 502);
echo is_string($response) ? $response : json_encode(['error' => 'Empty upstream response']);
