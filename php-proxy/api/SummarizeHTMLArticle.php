<?php
/**
 * SummarizeHTMLArticle API
 * 1. Calls Azure Function to fetch HTML text (bypasses CORS/publisher restrictions)
 * 2. Calls OpenAI API directly for summarization
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

// Azure Function URL for fetching HTML text only
define('AZURE_FETCH_HTML_URL', 'https://qpm-openai-service.azurewebsites.net/api/FetchHTMLText');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (function_exists('getAllowedOrigin')) {
    $allowedOrigin = getAllowedOrigin($origin);
    if ($allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
    }
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
$input = json_decode(file_get_contents('php://input'), true);
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
// Step 1: Fetch HTML text from Azure Function
// ============================================================
$ch = curl_init(AZURE_FETCH_HTML_URL);
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

// ============================================================
// Step 2: Call OpenAI API directly
// ============================================================
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

// Build OpenAI request - using Responses API
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-4o',
    'input' => $messages,
    'stream' => false
];

// Reasoning parameter
if (isset($prompt['reasoning']['effort'])) {
    $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
} else {
    $openaiRequest['reasoning'] = ['effort' => 'none'];
}

// max_output_tokens
if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
} elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_tokens'];
}

// Call OpenAI API
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
