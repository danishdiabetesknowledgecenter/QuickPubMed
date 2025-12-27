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

// Byg OpenAI request
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-4',
    'messages' => $messages,
    'stream' => true
];

// Tilføj valgfri parametre
if (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
    $openaiRequest['max_completion_tokens'] = (int)$prompt['max_tokens'];
}
if (isset($prompt['temperature']) && $prompt['temperature'] !== null) {
    $openaiRequest['temperature'] = (float)$prompt['temperature'];
}

// Streaming response
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');

if (ob_get_level()) ob_end_clean();

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
    CURLOPT_TIMEOUT => 120
]);

curl_exec($ch);

if (curl_errno($ch)) {
    echo "\n\nError: " . curl_error($ch);
}

curl_close($ch);

