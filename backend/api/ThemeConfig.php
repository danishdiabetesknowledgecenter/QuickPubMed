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
} elseif ($origin !== '') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Origin is not allowed']);
    exit;
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Vary: Origin');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$domain = qpmNormalizeDomainKey((string) ($_GET['domain'] ?? ''));
$globalTheme = defined('QPM_THEME_GLOBAL_OVERRIDES') && is_array(QPM_THEME_GLOBAL_OVERRIDES)
    ? QPM_THEME_GLOBAL_OVERRIDES
    : [];
$themeByDomain = defined('QPM_THEME_DOMAIN_OVERRIDES') && is_array(QPM_THEME_DOMAIN_OVERRIDES)
    ? QPM_THEME_DOMAIN_OVERRIDES
    : [];
$globalClassOverrides = defined('QPM_CLASS_OVERRIDES_GLOBAL') && is_array(QPM_CLASS_OVERRIDES_GLOBAL)
    ? qpmNormalizeClassOverridesMap(QPM_CLASS_OVERRIDES_GLOBAL)
    : [];
$unpaywall = [
    'baseUrl' => defined('UNPAYWALL_BASE_URL') ? (string) UNPAYWALL_BASE_URL : '',
    'email' => qpmGetUnpaywallEmail($domain),
];
$translationSources = qpmGetDomainTranslationSources($domain);
$translationSourcesConfigured = qpmHasDomainTranslationSourcesConfig($domain);
$semanticSourceLimits = [
    'semanticScholar' => qpmGetSemanticSourceLimit('semanticScholar', 400),
    'openAlex' => qpmGetSemanticSourceLimit('openAlex', 100),
    'elicit' => qpmGetSemanticSourceLimit('elicit', 100),
    'scite' => qpmGetSemanticSourceLimit('scite', 100),
    'core' => qpmGetSemanticSourceLimit('core', 100),
    'pubmedBestMatch' => qpmGetSemanticSourceLimit('pubmedBestMatch', 200),
];
$rerankConfig = defined('QPM_RERANK_CONFIG') && is_array(QPM_RERANK_CONFIG)
    ? QPM_RERANK_CONFIG
    : [];

$domainTheme = [];
if ($domain !== '' && isset($themeByDomain[$domain]) && is_array($themeByDomain[$domain])) {
    $domainTheme = $themeByDomain[$domain];
}
$domainTheme = array_merge($domainTheme, qpmGetDomainThemeOverrides($domain));
$domainClassOverrides = qpmGetDomainClassOverrides($domain);
if (!empty($globalClassOverrides)) {
    $domainClassOverrides = array_merge($globalClassOverrides, $domainClassOverrides);
}

echo json_encode([
    'globalTheme' => $globalTheme,
    'themeByDomain' => $themeByDomain,
    'domain' => $domain,
    'domainTheme' => $domainTheme,
    'globalClassOverrides' => $globalClassOverrides,
    'domainClassOverrides' => $domainClassOverrides,
    'unpaywall' => $unpaywall,
    'translationSources' => $translationSources,
    'translationSourcesConfigured' => $translationSourcesConfigured,
    'semanticSourceLimits' => $semanticSourceLimits,
    'rerankConfig' => $rerankConfig,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
