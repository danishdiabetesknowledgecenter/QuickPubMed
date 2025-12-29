<?php
/**
 * CheckIfResourceIsForbidden API
 * Checks if a URL is accessible (no longer needs Azure - PHP can make cross-origin requests)
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load config
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    require_once $configPath;
}

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

// Read request body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$url = $input['url'] ?? null;

if (!$url) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing url']);
    exit;
}

try {
    // Extract domain from URL for Referer header
    $parsedUrl = parse_url($url);
    $domain = ($parsedUrl['scheme'] ?? 'https') . '://' . ($parsedUrl['host'] ?? '');

    // Try to fetch the resource
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_HTTPHEADER => [
            'User-Agent: Other',
            'Referer: ' . $domain,
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.5',
            'Connection: keep-alive'
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Connection error: ' . $curlError]);
        exit;
    }

    if ($httpCode >= 400) {
        http_response_code($httpCode);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Resource returned HTTP ' . $httpCode]);
        exit;
    }

    if (empty($response)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Resource file not found']);
        exit;
    }

    // Success
    header('Content-Type: application/json');
    echo json_encode(['message' => 'Resource can be downloaded successfully']);

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => $e->getMessage()]);
}
