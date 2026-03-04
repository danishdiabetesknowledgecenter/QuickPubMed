<?php
/**
 * SummarizePDFArticle API with Streaming Support
 * 1. Calls Azure Function to fetch PDF text (bypasses CORS/publisher restrictions)
 * 2. Calls OpenAI API with streaming for faster perceived response
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once __DIR__ . '/SummarizeArticleHelpers.php';
qpmLoadApiConfigOrFail();
require_once __DIR__ . '/TextFetchCache.php';

// Azure Function URL for fetching PDF text only
define('AZURE_FETCH_PDF_URL', 'https://qpm-openai-service.azurewebsites.net/api/FetchPDFText');

qpmApplyStrictCorsPostJson();
qpmRequirePostMethod();
$input = qpmReadJsonInputOrFail();

$pdfUrl = qpmRequireInputField($input, 'pdfurl');
$prompt = qpmRequireInputField($input, 'prompt');

// ============================================================
// Step 1: Fetch PDF text from Azure Function
// ============================================================
$cacheHit = false;
$extractedText = qpmFetchExtractedTextFromAzure(
    'pdf',
    $pdfUrl,
    AZURE_FETCH_PDF_URL,
    'pdfurl',
    'PDF',
    $cacheHit
);

if (empty($extractedText)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No text extracted from PDF']);
    exit;
}

// ============================================================
// Step 2: Call OpenAI API with streaming
// ============================================================
$openaiRequest = qpmBuildStreamingOpenAiRequest($prompt, $extractedText);
qpmStartPlainStreamingResponse();

// Check if JSON mode is enabled
$jsonModeEnabled = isset($openaiRequest['text']['format']['type']) && $openaiRequest['text']['format']['type'] === 'json_object';

// Send metadata with extracted text for frontend logging, then separator
$metadata = [
    'type' => 'metadata',
    'extractedTextLength' => strlen($extractedText),
    'extractedText' => $extractedText,
    'pdfUrl' => $pdfUrl,
    'jsonModeEnabled' => $jsonModeEnabled,
    'cacheHit' => $cacheHit
];
qpmEmitStreamMetadata($metadata);
qpmStreamOpenAiPlainText($openaiRequest);
