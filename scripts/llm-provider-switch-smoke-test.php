<?php
/**
 * Offline smoke test for OpenAI ↔ Requesty hard provider switch.
 *
 * Covers: URL/key resolution, headers, provider-scoped model maps,
 * reasoning omit, no OpenAI host in Requesty request specs,
 * and provider-salted cache keys.
 *
 * Run: php scripts/llm-provider-switch-smoke-test.php
 *
 * Live check (manual, requires REQUESTY_API_KEY + MUGIN_LLM_PROVIDER=requesty):
 * 1) TranslateTitle stream
 * 2) Article summarize stream (PDF/HTML)
 * 3) semanticIntent + finalRerank via UnifiedSearch / public API
 */

define('OPENAI_API_KEY', 'sk-openai-smoke-key');
define('OPENAI_ORG_ID', 'org-smoke');
define('OPENAI_API_URL', 'https://api.openai.com/v1/responses');
define('REQUESTY_API_KEY', 'req-smoke-key');
define('REQUESTY_API_URL', 'https://router.eu.requesty.ai/v1/responses');
define('REQUESTY_HTTP_REFERER', 'https://mugin.dk');
define('REQUESTY_APP_TITLE', 'Mugin Scholar');
define('MUGIN_LLM_PROVIDER', 'openai');
define('MUGIN_LLM_ALLOWED_MODELS', [
    'openai' => [
        'gpt-5.6-sol',
        'gpt-5.5',
    ],
    'requesty' => [
        'azure/openai-responses/gpt-5.6-sol@swedencentral',
        'azure/openai-responses/gpt-5.5@swedencentral',
    ],
]);
define('MUGIN_LLM_TASK_MODELS', [
    'openai' => [
        'translate' => [
            'model' => 'gpt-5.6-sol',
            'reasoningEffort' => 'none',
            'verbosity' => 'medium',
        ],
        'finalRerank' => [
            'model' => 'gpt-5.5',
            'reasoningEffort' => 'none',
        ],
    ],
    'requesty' => [
        'translate' => [
            'model' => 'azure/openai-responses/gpt-5.6-sol@swedencentral',
            'reasoningEffort' => 'none',
            'verbosity' => 'medium',
        ],
        'finalRerank' => [
            'model' => 'azure/openai-responses/gpt-5.5@swedencentral',
            'reasoningEffort' => 'minimal',
        ],
    ],
]);

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

function assertContains(string $needle, string $haystack, string $message): void
{
    assertTrue(strpos($haystack, $needle) !== false, $message);
}

function assertNotContains(string $needle, string $haystack, string $message): void
{
    assertTrue(strpos($haystack, $needle) === false, $message);
}

// --- openai mode ---
$GLOBALS['__muginLlmProviderOverride'] = 'openai';

assertTrue(muginGetLlmProvider() === 'openai', 'Provider override openai');
assertTrue(muginGetOpenAIApiKey() === 'sk-openai-smoke-key', 'OpenAI key used in openai mode');
assertTrue(muginGetOpenAIApiUrl() === 'https://api.openai.com/v1/responses', 'OpenAI URL in openai mode');
assertTrue(muginGetOpenAIOrgId() === 'org-smoke', 'OpenAI org in openai mode');
assertTrue(muginIsLlmConfigured() === true, 'LLM configured in openai mode');

$openaiHeaders = muginBuildLlmHttpHeaders();
$openaiHeadersJoined = implode("\n", $openaiHeaders);
assertContains('Authorization: Bearer sk-openai-smoke-key', $openaiHeadersJoined, 'OpenAI Authorization header');
assertContains('OpenAI-Organization: org-smoke', $openaiHeadersJoined, 'OpenAI Organization header');
assertNotContains('HTTP-Referer:', $openaiHeadersJoined, 'No Requesty Referer in openai mode');
assertNotContains('X-Title:', $openaiHeadersJoined, 'No Requesty X-Title in openai mode');

assertTrue(
    muginResolveAllowedOpenAiModel('gpt-5.6-sol', '') === 'gpt-5.6-sol',
    'OpenAI allowlist returns short id'
);
assertTrue(
    muginGetOpenAiTaskSettings('translate')['model'] === 'gpt-5.6-sol',
    'OpenAI task model from openai section'
);
assertTrue(
    muginFormatLlmModelForProvider('gpt-5.6-sol') === 'gpt-5.6-sol',
    'OpenAI keeps short model id'
);
$openaiNormalized = muginNormalizeLlmRequestPayload([
    'model' => 'gpt-5.6-sol',
    'reasoning' => ['effort' => 'none'],
]);
assertTrue(
    isset($openaiNormalized['reasoning']['effort']) && $openaiNormalized['reasoning']['effort'] === 'none',
    'OpenAI keeps reasoning.effort=none'
);

$openaiSpec = muginPublicSearchBuildOpenAiRequestSpec([
    'model' => 'gpt-5.6-sol',
    'input' => [['role' => 'user', 'content' => 'hi']],
    'reasoning' => ['effort' => 'none'],
]);
assertContains('api.openai.com', (string) $openaiSpec['url'], 'OpenAI spec URL targets api.openai.com');
assertNotContains('requesty.ai', (string) $openaiSpec['url'], 'OpenAI spec URL is not Requesty');

$pipelineKeyOpenAi = muginPublicSearchBuildPipelineCacheKey(['q' => 'diabetes', 'page' => 1]);
$requestForCacheOpenAi = ['_llmProvider' => 'openai', 'q' => 'diabetes'];
$searchKeyOpenAi = 'request:' . muginPublicSearchSafeJsonEncode($requestForCacheOpenAi);
$rerankKeyOpenAi = 'payload:' . sha1('openai|' . muginPublicSearchSafeJsonEncode(['model' => 'gpt-5.6-sol']));

// --- requesty mode ---
$GLOBALS['__muginLlmProviderOverride'] = 'requesty';

assertTrue(muginGetLlmProvider() === 'requesty', 'Provider override requesty');
assertTrue(muginGetOpenAIApiKey() === 'req-smoke-key', 'Requesty key used (OPENAI_* ignored)');
assertTrue(
    muginGetOpenAIApiUrl() === 'https://router.eu.requesty.ai/v1/responses',
    'Requesty EU URL in requesty mode'
);
assertTrue(muginGetOpenAIOrgId() === '', 'Org id empty for requesty');
assertTrue(muginIsLlmConfigured() === true, 'LLM configured in requesty mode with REQUESTY_*');

$requestyHeaders = muginBuildLlmHttpHeaders();
$requestyHeadersJoined = implode("\n", $requestyHeaders);
assertContains('Authorization: Bearer req-smoke-key', $requestyHeadersJoined, 'Requesty Authorization header');
assertContains('HTTP-Referer: https://mugin.dk', $requestyHeadersJoined, 'Requesty HTTP-Referer');
assertContains('X-Title: Mugin Scholar', $requestyHeadersJoined, 'Requesty X-Title');
assertNotContains('OpenAI-Organization', $requestyHeadersJoined, 'No OpenAI-Organization for requesty');

assertTrue(
    muginResolveAllowedOpenAiModel('gpt-5.6-sol', '') === 'azure/openai-responses/gpt-5.6-sol@swedencentral',
    'Requesty allowlist maps short id to exact Azure Requesty model'
);
assertTrue(
    muginGetOpenAiTaskSettings('translate')['model'] === 'azure/openai-responses/gpt-5.6-sol@swedencentral',
    'Requesty task model from requesty section'
);
assertTrue(
    muginFormatLlmModelForProvider('azure/openai-responses/gpt-5.6-sol@swedencentral')
        === 'azure/openai-responses/gpt-5.6-sol@swedencentral',
    'Requesty keeps exact configured model id'
);

$normalizedNone = muginNormalizeLlmRequestPayload([
    'model' => 'azure/openai-responses/gpt-5.6-sol@swedencentral',
    'reasoning' => ['effort' => 'none'],
]);
assertTrue(
    ($normalizedNone['model'] ?? '') === 'azure/openai-responses/gpt-5.6-sol@swedencentral',
    'Normalize keeps exact Requesty model'
);
assertTrue(
    ($normalizedNone['reasoning']['effort'] ?? '') === 'none',
    'Requesty keeps reasoning.effort=none (needed for Kimi/Azure GPT)'
);

$normalizedMinimal = muginNormalizeLlmRequestPayload([
    'model' => 'azure/openai-responses/gpt-5.5@swedencentral',
    'reasoning' => ['effort' => 'minimal'],
]);
assertTrue(
    ($normalizedMinimal['reasoning']['effort'] ?? '') === 'minimal',
    'Requesty keeps reasoning.effort=minimal'
);

$kept = muginNormalizeLlmRequestPayload([
    'model' => 'azure/openai-responses/gpt-5.5@swedencentral',
    'reasoning' => ['effort' => 'low'],
]);
assertTrue(($kept['reasoning']['effort'] ?? '') === 'low', 'Requesty keeps reasoning.effort=low');

$requestySpec = muginPublicSearchBuildOpenAiRequestSpec([
    'model' => 'azure/openai-responses/gpt-5.6-sol@swedencentral',
    'input' => [['role' => 'user', 'content' => 'hi']],
    'reasoning' => ['effort' => 'none'],
]);
assertContains('router.eu.requesty.ai', (string) $requestySpec['url'], 'Requesty spec URL targets Requesty');
assertNotContains('api.openai.com', (string) $requestySpec['url'], 'Requesty spec never targets api.openai.com');
$body = (string) ($requestySpec['options']['body'] ?? '');
assertContains(
    'azure/openai-responses/gpt-5.6-sol@swedencentral',
    $body,
    'Requesty body uses exact configured Azure model'
);
assertContains('"effort":"none"', $body, 'Requesty body keeps reasoning.effort=none');
$specHeaders = implode("\n", (array) ($requestySpec['options']['headers'] ?? []));
assertContains('Bearer req-smoke-key', $specHeaders, 'Requesty spec uses Requesty bearer key');
assertNotContains('sk-openai-smoke-key', $specHeaders, 'Requesty spec does not use OPENAI_API_KEY');

assertTrue(
    muginGetOpenAIApiKey() !== 'sk-openai-smoke-key',
    'With requesty provider, OPENAI_API_KEY is not returned'
);

$pipelineKeyRequesty = muginPublicSearchBuildPipelineCacheKey(['q' => 'diabetes', 'page' => 1]);
assertTrue(
    $pipelineKeyOpenAi !== $pipelineKeyRequesty,
    'Pipeline cache key differs by LLM provider'
);

$requestForCacheRequesty = ['_llmProvider' => 'requesty', 'q' => 'diabetes'];
$searchKeyRequesty = 'request:' . muginPublicSearchSafeJsonEncode($requestForCacheRequesty);
assertTrue($searchKeyOpenAi !== $searchKeyRequesty, 'Search-response cache key material differs by provider');

$rerankKeyRequesty = 'payload:' . sha1('requesty|' . muginPublicSearchSafeJsonEncode(['model' => 'gpt-5.6-sol']));
assertTrue($rerankKeyOpenAi !== $rerankKeyRequesty, 'Final-rerank cache key differs by provider');

assertTrue(
    strpos(muginGetOpenAIApiUrl(), 'api.openai.com') === false,
    'Requesty mode URL never falls back to api.openai.com'
);

unset($GLOBALS['__muginLlmProviderOverride']);

echo "\nAll LLM provider-switch smoke tests passed.\n";
echo "Manual live check (when REQUESTY_API_KEY is set and MUGIN_LLM_PROVIDER=requesty):\n";
echo "  1) TranslateTitle stream\n";
echo "  2) Article summarize stream\n";
echo "  3) semanticIntent + finalRerank (UnifiedSearch/public API)\n";
