<?php
/**
 * SummarizeHTMLArticle API with Streaming Support
 * 1. Calls Azure Function to fetch HTML text (bypasses CORS/publisher restrictions)
 * 2. Calls OpenAI API with streaming for faster perceived response
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once __DIR__ . '/SummarizeArticleHelpers.php';
muginLoadApiConfigOrFail();
require_once __DIR__ . '/NlmApiHelpers.php';
require_once __DIR__ . '/TextFetchCache.php';

// Azure Function URL for fetching HTML text only
define('AZURE_FETCH_HTML_URL', 'https://qpm-openai-service.azurewebsites.net/api/FetchHTMLText');

muginApplyStrictCorsPostJson();
muginEnforceFirstPartyIpRateLimit('openaiProxy');
muginRequirePostMethod();
$input = muginReadJsonInputOrFail();

$htmlUrl = muginRequirePublicHttpsUrl(muginRequireInputField($input, 'htmlurl'), 'htmlurl');
$prompt = muginRequireInputField($input, 'prompt');

// ============================================================
// Step 1: Fetch HTML text from Azure Function
// ============================================================
$cacheHit = false;
$extractedText = muginFetchExtractedTextFromAzure(
    'html',
    $htmlUrl,
    AZURE_FETCH_HTML_URL,
    'htmlurl',
    'HTML',
    $cacheHit
);

if (empty($extractedText)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No text extracted from HTML']);
    exit;
}

// ============================================================
// Step 2: Call OpenAI API with streaming
// ============================================================
$openaiRequest = muginBuildStreamingOpenAiRequest($prompt, $extractedText);
muginStartPlainStreamingResponse();

// Send metadata only; full extracted article text must not be echoed back.
$metadata = [
    'type' => 'metadata',
    'extractedTextLength' => strlen($extractedText),
    'htmlUrl' => $htmlUrl,
    'cacheHit' => $cacheHit
];
muginEmitStreamMetadata($metadata);
muginStreamOpenAiPlainText($openaiRequest);
