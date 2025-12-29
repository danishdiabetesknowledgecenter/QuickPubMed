<?php
/**
 * SummarizeHTMLArticle API
 * 
 * TEMPORARY: Uses old Azure endpoint until new FetchHTMLText is deployed
 * After deployment, this will call Azure only for text extraction, then OpenAI directly
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load config
$configPath = __DIR__ . '/../config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Configuration file not found']);
    exit;
}
require_once $configPath;

// TEMPORARY: Use old Azure endpoint that handles both text extraction AND OpenAI
// Change to 'https://qpm-openai-service.azurewebsites.net/api/FetchHTMLText' after deployment
define('AZURE_HTML_URL', 'https://qpm-openai-service.azurewebsites.net/api/SummarizeHTMLArticle');
define('USE_NEW_FLOW', false);  // Set to true after deploying new Azure Functions

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = getAllowedOrigin($origin);
if ($allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
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
$inputBody = file_get_contents('php://input');
$input = json_decode($inputBody, true);

if (!$input) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$htmlUrl = $input['htmlurl'] ?? null;
$prompt = $input['prompt'] ?? null;

if (!$htmlUrl) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing htmlurl']);
    exit;
}

if (!$prompt) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing prompt']);
    exit;
}

// ============================================================
// TEMPORARY: Forward to old Azure endpoint (handles everything)
// ============================================================
if (!USE_NEW_FLOW) {
    // Forward the entire request to the old Azure Function
    $ch = curl_init(AZURE_HTML_URL);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $inputBody,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: */*'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 300,
        CURLOPT_FOLLOWLOCATION => true
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Proxy error: ' . $curlError]);
        exit;
    }

    // Forward response from Azure
    if ($contentType) {
        header('Content-Type: ' . $contentType);
    }
    http_response_code($httpCode);
    echo $response;
    exit;
}

// ============================================================
// NEW FLOW: Call Azure for text only, then OpenAI directly
// (Activate by setting USE_NEW_FLOW = true after deployment)
// ============================================================

// Step 1: Fetch HTML text from Azure Function
$ch = curl_init(AZURE_HTML_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['htmlurl' => $htmlUrl]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 120,
    CURLOPT_FOLLOWLOCATION => true
]);

$azureResponse = curl_exec($ch);
$azureHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to fetch HTML: ' . $curlError]);
    exit;
}

if ($azureHttpCode !== 200) {
    http_response_code($azureHttpCode);
    header('Content-Type: application/json');
    echo $azureResponse;
    exit;
}

$azureData = json_decode($azureResponse, true);
$extractedText = $azureData['text'] ?? '';

if (empty($extractedText)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No text extracted from HTML']);
    exit;
}

// Step 2: Build OpenAI request with extracted text
$promptText = ($prompt['prompt'] ?? '') . $extractedText;

$messages = [];
if (isset($prompt['messages']) && is_array($prompt['messages'])) {
    foreach ($prompt['messages'] as $msg) {
        $messages[] = [
            'role' => $msg['role'] ?? 'user',
            'content' => $msg['content'] ?? ''
        ];
    }
    // Add extracted text as user message
    $messages[] = ['role' => 'user', 'content' => $extractedText];
} else {
    $messages[] = ['role' => 'user', 'content' => $promptText];
}

// Build OpenAI request - using Responses API for GPT-5.2
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-5.2-chat-latest',
    'input' => $messages,
    'stream' => false
];

// GPT-5.2 reasoning parameter
if (isset($prompt['reasoning']['effort'])) {
    $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
} else {
    $openaiRequest['reasoning'] = ['effort' => 'none'];
}

// max_output_tokens for GPT-5.2
if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
} elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_tokens'];
}

// Step 3: Call OpenAI API (non-streaming)
$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY
];

$ch = curl_init(OPENAI_API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($openaiRequest),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 300
]);

$openaiResponse = curl_exec($ch);
$openaiHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'OpenAI API error: ' . $curlError]);
    exit;
}

if ($openaiHttpCode !== 200) {
    http_response_code($openaiHttpCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'OpenAI API returned HTTP ' . $openaiHttpCode, 'details' => $openaiResponse]);
    exit;
}

$result = json_decode($openaiResponse, true);

// Extract text from Responses API output
$textContent = '';
if (isset($result['output']) && is_array($result['output'])) {
    foreach ($result['output'] as $outputItem) {
        if (($outputItem['type'] ?? '') === 'message' && isset($outputItem['content'])) {
            foreach ($outputItem['content'] as $contentItem) {
                if (($contentItem['type'] ?? '') === 'output_text') {
                    $textContent = $contentItem['text'] ?? '';
                    break 2;
                }
            }
        }
    }
}

// Fallback to Chat Completions format
if (empty($textContent) && isset($result['choices'][0]['message']['content'])) {
    $textContent = $result['choices'][0]['message']['content'];
}

// Return the text content directly (frontend expects to parse this as JSON)
header('Content-Type: application/json');
echo $textContent;
