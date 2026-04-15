<?php
$configPath = dirname(__DIR__, 2) . '/backend/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__, 2) . '/backend/config.php';
}
require_once $configPath;
require_once dirname(__DIR__, 2) . '/backend/app/public-search-request.php';

qpmPublicSearchApplyNoStoreHeaders();
header('Content-Type: application/json; charset=utf-8');

$config = qpmPublicSearchGetConfig();
$clients = qpmPublicSearchGetClients();

echo qpmPublicSearchSafeJsonEncode([
    'status' => 'ok',
    'service' => 'nempubmed-public-search-api',
    'version' => '1',
    'timestamp' => gmdate('c'),
    'config' => [
        'basePath' => $config['basePath'],
        'getSearchEnabled' => $config['getSearchEnabled'],
        'urlApiKeyEnabled' => $config['urlApiKeyEnabled'],
        'hasClientsConfigured' => count($clients) > 0,
        'clientCount' => count($clients),
    ],
]);
