<?php
/**
 * Theme configuration endpoint.
 * Exposes frontend-safe CSS variable overrides from backend config.
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
    // Public, read-only response
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$domain = strtolower(trim((string) ($_GET['domain'] ?? '')));
$globalTheme = defined('QPM_THEME_GLOBAL_OVERRIDES') && is_array(QPM_THEME_GLOBAL_OVERRIDES)
    ? QPM_THEME_GLOBAL_OVERRIDES
    : [];
$themeByDomain = defined('QPM_THEME_DOMAIN_OVERRIDES') && is_array(QPM_THEME_DOMAIN_OVERRIDES)
    ? QPM_THEME_DOMAIN_OVERRIDES
    : [];

$domainTheme = [];
if ($domain !== '' && isset($themeByDomain[$domain]) && is_array($themeByDomain[$domain])) {
    $domainTheme = $themeByDomain[$domain];
}

echo json_encode([
    'globalTheme' => $globalTheme,
    'themeByDomain' => $themeByDomain,
    'domain' => $domain,
    'domainTheme' => $domainTheme,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
