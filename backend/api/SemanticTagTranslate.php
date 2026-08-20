<?php
/**
 * Thin first-party endpoint for semantic/PubMed query translation (Fase 2 helper).
 *
 * Wraps muginPublicSearchTranslateSemanticQuery / muginPublicSearchTranslatePubMedQuery
 * without running a full search. Frontend DropdownWrapper still uses TranslateTitle.php
 * as the live path until a full migrate wires this endpoint in.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';
require_once dirname(__DIR__) . '/app/public-search-lib.php';

muginApplyNlmCorsHeaders('POST, OPTIONS', 'application/json');
muginEnforceFirstPartyIpRateLimit('openaiProxy');

if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$text = trim((string) ($input['text'] ?? ($input['title'] ?? ($input['query'] ?? ''))));
if ($text === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing text']);
    exit;
}

$mode = strtolower(trim((string) ($input['mode'] ?? 'semantic')));
if (!in_array($mode, ['semantic', 'pubmed'], true)) {
    $mode = 'semantic';
}

$language = function_exists('muginPublicSearchNormalizeResponseLanguage')
    ? muginPublicSearchNormalizeResponseLanguage($input['language'] ?? ($input['lang'] ?? 'da'))
    : 'da';
$domain = trim((string) ($input['domain'] ?? ($input['client'] ?? '')));

@ini_set('max_execution_time', '120');
@set_time_limit(120);

try {
    if ($mode === 'pubmed') {
        $translated = muginPublicSearchTranslatePubMedQuery($text, $language, $domain);
    } else {
        $translated = muginPublicSearchTranslateSemanticQuery($text, $language, $domain);
    }
} catch (Throwable $error) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Translation failed',
        'detail' => $error->getMessage(),
    ]);
    exit;
}

echo json_encode([
    'mode' => $mode,
    'language' => $language,
    'text' => $translated,
    'translated' => $translated,
]);
