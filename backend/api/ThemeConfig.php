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

$elicitKeyRaw = $_GET['elicitKey'] ?? null;
$elicitKey = is_string($elicitKeyRaw) ? trim($elicitKeyRaw) : '';
$elicitUnlocked = qpmIsElicitUnlocked($elicitKey !== '' ? $elicitKey : null);
if (qpmIsElicitUnlockConfigured()) {
    // When gating is configured, Elicit availability is controlled entirely by
    // the unlock check: add it when unlocked, remove it otherwise. This ignores
    // the domain's translation_sources for the 'elicit' entry only.
    if (!$translationSourcesConfigured) {
        $translationSources = ['pubmed', 'semanticScholar', 'openAlex'];
        $translationSourcesConfigured = true;
    }
    $translationSources = array_values(
        array_filter($translationSources, static fn($source) => $source !== 'elicit')
    );
    if ($elicitUnlocked) {
        $translationSources[] = 'elicit';
    }
}
$semanticSourceLimits = [
    'semanticScholar' => qpmGetSemanticSourceLimit('semanticScholar', 400),
    'openAlex' => qpmGetSemanticSourceLimit('openAlex', 100),
    'elicit' => qpmGetSemanticSourceLimit('elicit', 100),
    'pubmedBestMatch' => qpmGetSemanticSourceLimit('pubmedBestMatch', 200),
];
$semanticRescueConfig = defined('QPM_SEMANTIC_RESCUE_CONFIG') && is_array(QPM_SEMANTIC_RESCUE_CONFIG)
    ? QPM_SEMANTIC_RESCUE_CONFIG
    : [];
$semanticLlmRerankConfig = defined('QPM_SEMANTIC_LLM_RERANK_CONFIG') && is_array(QPM_SEMANTIC_LLM_RERANK_CONFIG)
    ? QPM_SEMANTIC_LLM_RERANK_CONFIG
    : [];
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

// Global gate flag: true when QPM_ELICIT_UNLOCK is configured and the
// current caller is not unlocked. Used by the frontend to strip 'elicit'
// from availableTranslationSourceKeys regardless of domain config or the
// ?databases URL fallback list (legacy aliases: ?semanticsources / ?translationsources).
$elicitGated = qpmIsElicitUnlockConfigured() && !$elicitUnlocked;

$response = [
    'globalTheme' => $globalTheme,
    'themeByDomain' => $themeByDomain,
    'domain' => $domain,
    'domainTheme' => $domainTheme,
    'globalClassOverrides' => $globalClassOverrides,
    'domainClassOverrides' => $domainClassOverrides,
    'unpaywall' => $unpaywall,
    'translationSources' => $translationSources,
    'translationSourcesConfigured' => $translationSourcesConfigured,
    'elicitUnlocked' => $elicitUnlocked,
    'elicitGated' => $elicitGated,
    'semanticSourceLimits' => $semanticSourceLimits,
    'semanticRescueConfig' => $semanticRescueConfig,
    'semanticLlmRerankConfig' => $semanticLlmRerankConfig,
    'rerankConfig' => $rerankConfig,
];

// Opt-in diagnostic for the Elicit unlock feature. Visit:
//   <api>/ThemeConfig.php?domain=<domain>&elicitDiag=1
// to see which client IP and configured IPs the backend sees. This never
// exposes the configured unlock code, only IP/patterns + an elicitUnlocked flag.
if (!empty($_GET['elicitDiag'])) {
    $configuredIps = [];
    $hasCode = false;
    $trustForwardedFor = false;
    if (defined('QPM_ELICIT_UNLOCK') && is_array(QPM_ELICIT_UNLOCK)) {
        $cfg = QPM_ELICIT_UNLOCK;
        $configuredIps = isset($cfg['ips']) && is_array($cfg['ips']) ? array_values($cfg['ips']) : [];
        $hasCode = !empty(qpmGetElicitUnlockCodes());
        $trustForwardedFor = !empty($cfg['trust_forwarded_for']);
    }
    $response['elicitDiag'] = [
        'clientIp' => qpmGetClientIp(),
        'remoteAddr' => $_SERVER['REMOTE_ADDR'] ?? '',
        'xForwardedFor' => $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        'trustForwardedFor' => $trustForwardedFor,
        'configuredIps' => $configuredIps,
        'hasConfiguredCode' => $hasCode,
        'codeSent' => $elicitKey !== '',
        'elicitUnlocked' => $elicitUnlocked,
    ];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
