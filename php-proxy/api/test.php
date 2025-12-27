<?php
/**
 * Simple test file to verify PHP and configuration
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Check if config exists
$configPath = __DIR__ . '/../config.php';
$configExists = file_exists($configPath);

if ($configExists) {
    require_once $configPath;
}

// Check if helpers.php exists
$helpersPath = __DIR__ . '/../helpers.php';
$helpersExists = file_exists($helpersPath);

$response = [
    'status' => 'ok',
    'php_version' => PHP_VERSION,
    'config_exists' => $configExists,
    'config_path' => $configPath,
    'helpers_exists' => $helpersExists,
    'helpers_path' => $helpersPath,
    'allowed_domains' => defined('ALLOWED_DOMAINS') ? ALLOWED_DOMAINS : 'NOT SET',
    'getAllowedOrigin_exists' => function_exists('getAllowedOrigin'),
    'openai_key_set' => defined('OPENAI_API_KEY') && !empty(OPENAI_API_KEY),
    'openai_key_preview' => defined('OPENAI_API_KEY') ? substr(OPENAI_API_KEY, 0, 10) . '...' : 'NOT SET',
    'nlm_key_set' => defined('NLM_API_KEY') && !empty(NLM_API_KEY),
    'curl_available' => function_exists('curl_init'),
    'server_time' => date('Y-m-d H:i:s'),
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'test_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'none'
];

echo json_encode($response, JSON_PRETTY_PRINT);

