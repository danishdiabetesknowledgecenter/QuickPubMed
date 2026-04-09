<?php
/**
 * TranslateTitle API Proxy med Streaming Support
 * Erstatter Azure Function: /api/TranslateTitle
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;

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

// Byg OpenAI request - using Responses API for gpt-5.4
// See: https://platform.openai.com/docs/api-reference/responses/create
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-5.4',
    'input' => $messages,  // Responses API uses 'input' instead of 'messages'
    'stream' => isset($prompt['stream']) ? (bool)$prompt['stream'] : true
];

// gpt-5.4 reasoning parameter
if (isset($prompt['reasoning']['effort'])) {
    $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
} else {
    $openaiRequest['reasoning'] = ['effort' => 'low']; // Default - faster
}

// gpt-5.4 text configuration (verbosity + optional structured output format)
$textConfig = [];
if (isset($prompt['text']) && is_array($prompt['text'])) {
    if (isset($prompt['text']['verbosity'])) {
        $textConfig['verbosity'] = $prompt['text']['verbosity'];
    }
    if (isset($prompt['text']['format']) && is_array($prompt['text']['format'])) {
        $textConfig['format'] = $prompt['text']['format'];
    }
}
if (!isset($textConfig['format']) && isset($prompt['response_format']) && is_array($prompt['response_format'])) {
    $textConfig['format'] = $prompt['response_format'];
}
if (!isset($textConfig['verbosity'])) {
    $textConfig['verbosity'] = 'medium'; // Default
}
$openaiRequest['text'] = $textConfig;

// max_output_tokens for gpt-5.4
if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
} elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_tokens'];
}

$domain = qpmResolveDomain();
$openAiApiKey = qpmGetOpenAIApiKey($domain);
$openAiOrgId = qpmGetOpenAIOrgId($domain);
$openAiApiUrl = qpmGetOpenAIApiUrl($domain);

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $openAiApiKey
];

if ($openAiOrgId) {
    $headers[] = 'OpenAI-Organization: ' . $openAiOrgId;
}

// Streaming response
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');

if (ob_get_level()) ob_end_clean();

$ch = curl_init($openAiApiUrl);

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
