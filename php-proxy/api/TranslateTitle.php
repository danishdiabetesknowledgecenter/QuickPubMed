<?php
/**
 * TranslateTitle API Proxy med Streaming Support
 * Erstatter Azure Function: /api/TranslateTitle
 */

require_once __DIR__ . '/../config.php';

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

$prompt = $input['prompt'] ?? null;
$title = $input['title'] ?? '';

if (!$prompt) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing prompt']);
    exit;
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
} else {
    $promptText = ($prompt['prompt'] ?? '') . $title;
    $messages[] = ['role' => 'user', 'content' => $promptText];
}

// Byg OpenAI request - using Responses API for GPT-5.2
// See: https://platform.openai.com/docs/api-reference/responses/create
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-5.2',
    'input' => $messages,  // Responses API uses 'input' instead of 'messages'
    'stream' => true
];

// GPT-5.2 reasoning parameter
if (isset($prompt['reasoning']['effort'])) {
    $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
} else {
    $openaiRequest['reasoning'] = ['effort' => 'low']; // Default - faster
}

// GPT-5.2 text/verbosity parameter
if (isset($prompt['text']['verbosity'])) {
    $openaiRequest['text'] = ['verbosity' => $prompt['text']['verbosity']];
} else {
    $openaiRequest['text'] = ['verbosity' => 'medium']; // Default
}

// max_output_tokens for GPT-5.2
if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
} elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_tokens'];
}

// ============ DEBUG MODE ============
// Add ?debug=full to URL to see full request/response without calling OpenAI
// Add ?debug=request to URL to see what would be sent
// Add ?debug=test to URL to make a non-streaming test call and see full response
$debugMode = $_GET['debug'] ?? null;

if ($debugMode === 'request' || $debugMode === 'full') {
    header('Content-Type: application/json');
    echo json_encode([
        'debug_mode' => $debugMode,
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoint' => 'TranslateTitle',
        'openai_api_url' => OPENAI_API_URL,
        'request_to_send' => $openaiRequest,
        'title_received' => $title,
        'prompt_received' => $prompt
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY
];

if (OPENAI_ORG_ID) {
    $headers[] = 'OpenAI-Organization: ' . OPENAI_ORG_ID;
}

// Debug test mode - make non-streaming call to see full response
if ($debugMode === 'test') {
    $ch = curl_init(OPENAI_API_URL);
    $testRequest = $openaiRequest;
    $testRequest['stream'] = false;
    
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($testRequest),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60
    ]);
    
    $testResponse = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    header('Content-Type: application/json');
    echo json_encode([
        'debug_mode' => 'test',
        'timestamp' => date('Y-m-d H:i:s'),
        'http_code' => $httpCode,
        'curl_error' => $curlError ?: null,
        'request_sent' => $testRequest,
        'response_received' => json_decode($testResponse, true) ?? $testResponse
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Streaming response
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');

if (ob_get_level()) ob_end_clean();

$ch = curl_init(OPENAI_API_URL);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($openaiRequest),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_WRITEFUNCTION => function($ch, $data) {
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
                
                // Responses API streaming format
                if ($parsed) {
                    // Check for text delta in Responses API format
                    if (isset($parsed['type']) && $parsed['type'] === 'response.output_text.delta') {
                        $content = $parsed['delta'] ?? '';
                        echo $content;
                        flush();
                    }
                    // Fallback to Chat Completions format (for compatibility)
                    elseif (isset($parsed['choices'][0]['delta']['content'])) {
                        $content = $parsed['choices'][0]['delta']['content'];
                        echo $content;
                        flush();
                    }
                }
            }
        }
        return strlen($data);
    },
    CURLOPT_TIMEOUT => 120
]);

curl_exec($ch);

if (curl_errno($ch)) {
    echo "\n\nError: " . curl_error($ch);
}

curl_close($ch);

