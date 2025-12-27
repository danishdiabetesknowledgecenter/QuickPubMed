<?php
/**
 * SummarizeSearch API Proxy with Streaming Support
 * Replaces Azure Function: /api/SummarizeSearch
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display, but log
ini_set('log_errors', 1);

// Check if config file exists
$configPath = __DIR__ . '/../config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Configuration file not found: ' . $configPath]);
    exit;
}

require_once $configPath;

// Verify that constants are defined
if (!defined('OPENAI_API_KEY') || empty(OPENAI_API_KEY)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'OPENAI_API_KEY is not configured']);
    exit;
}

// CORS headers - dynamically check origin
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = getAllowedOrigin($origin);

if ($allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Kun POST tilladt
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Læs request body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Udtræk data fra request
$prompt = $input['prompt'] ?? null;
$articles = $input['articles'] ?? [];

if (!$prompt) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing prompt']);
    exit;
}

// Byg artikel-tekst til prompt
$articleText = '';
foreach ($articles as $i => $article) {
    $num = $i + 1;
    $abstract = $article['Abstract'] ?? $article['abstract'] ?? '';
    $title = $article['Title'] ?? $article['title'] ?? '';
    $pmid = $article['PMID'] ?? $article['pmid'] ?? '';
    $source = $article['Source'] ?? $article['source'] ?? '';
    
    $articleText .= "\n{$num}. ```";
    $articleText .= "Title:\n{$title}\n";
    $articleText .= "PMID:\n{$pmid}\n";
    $articleText .= "Source:\n{$source}\n";
    $articleText .= "Abstract:\n{$abstract}";
    $articleText .= "```";
}

// Byg messages array
$messages = [];
if (isset($prompt['messages']) && is_array($prompt['messages'])) {
    foreach ($prompt['messages'] as $msg) {
        $messages[] = [
            'role' => $msg['role'] ?? 'user',
            'content' => $msg['content'] ?? ''
        ];
    }
    // Tilføj artikler til sidste user message
    if (!empty($messages)) {
        $lastIndex = count($messages) - 1;
        $messages[$lastIndex]['content'] .= $articleText;
    }
} else {
    $promptText = ($prompt['prompt'] ?? '') . $articleText;
    $messages[] = ['role' => 'user', 'content' => $promptText];
}

// Byg OpenAI request
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-4',
    'messages' => $messages,
    'stream' => true
];

// GPT-5.2 parameters
if (isset($prompt['reasoning']) && is_array($prompt['reasoning'])) {
    $openaiRequest['reasoning'] = $prompt['reasoning'];
}
if (isset($prompt['text']) && is_array($prompt['text'])) {
    $openaiRequest['text'] = $prompt['text'];
}
if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
}

// Legacy parameters (for older models or reasoning.effort = "none")
if (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null && !isset($prompt['max_output_tokens'])) {
    $openaiRequest['max_completion_tokens'] = (int)$prompt['max_tokens'];
}
if (isset($prompt['temperature']) && $prompt['temperature'] !== null) {
    $openaiRequest['temperature'] = (float)$prompt['temperature'];
}
if (isset($prompt['presence_penalty']) && $prompt['presence_penalty'] !== null) {
    $openaiRequest['presence_penalty'] = (float)$prompt['presence_penalty'];
}
if (isset($prompt['frequency_penalty']) && $prompt['frequency_penalty'] !== null) {
    $openaiRequest['frequency_penalty'] = (float)$prompt['frequency_penalty'];
}

// Streaming response
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');

// Disable output buffering
if (ob_get_level()) ob_end_clean();

// Initialize cURL for streaming
$ch = curl_init(OPENAI_API_URL);

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY
];

if (OPENAI_ORG_ID) {
    $headers[] = 'OpenAI-Organization: ' . OPENAI_ORG_ID;
}

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($openaiRequest),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_WRITEFUNCTION => function($ch, $data) {
        // Parse SSE data
        $lines = explode("\n", $data);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            if (strpos($line, 'data: ') === 0) {
                $jsonData = substr($line, 6);
                
                if ($jsonData === '[DONE]') {
                    break;
                }
                
                $parsed = json_decode($jsonData, true);
                if ($parsed && isset($parsed['choices'][0]['delta']['content'])) {
                    $content = $parsed['choices'][0]['delta']['content'];
                    echo $content;
                    flush();
                }
            }
        }
        return strlen($data);
    },
    CURLOPT_TIMEOUT => 300
]);

$result = curl_exec($ch);

$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
$curlErrno = curl_errno($ch);

curl_close($ch);

if ($curlErrno) {
    echo "\n\nCURL Error ({$curlErrno}): {$curlError}";
}

if ($httpCode >= 400) {
    echo "\n\nHTTP Error: {$httpCode}";
}

