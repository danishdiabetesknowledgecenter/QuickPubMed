<?php
/**
 * SummarizeHTMLArticle API with Streaming Support
 * 1. Calls Azure Function to fetch HTML text (bypasses CORS/publisher restrictions)
 * 2. Calls OpenAI API with streaming for faster perceived response
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
// Step 2: Call OpenAI API with streaming
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
    $messages[] = ['role' => 'user', 'content' => $extractedText];
} else {
    $messages[] = ['role' => 'user', 'content' => $promptText];
}

// Build OpenAI request with streaming
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-4o',
    'input' => $messages,
    'stream' => true
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

// Streaming response headers - disable ALL buffering
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('X-Accel-Buffering: no');  // Nginx
header('X-Content-Type-Options: nosniff');
header('Transfer-Encoding: chunked');

// Disable all output buffering
@ini_set('output_buffering', 'Off');
@ini_set('zlib.output_compression', 0);
while (ob_get_level()) ob_end_clean();
ob_implicit_flush(true);

// Disable Apache buffering
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}

// Set unlimited execution time for long streams
set_time_limit(0);

// Send metadata with extracted text for frontend logging, then separator
$metadata = json_encode([
    'type' => 'metadata',
    'extractedTextLength' => strlen($extractedText),
    'extractedText' => $extractedText,
    'htmlUrl' => $htmlUrl
]);
echo $metadata . "\n---STREAM_START---\n";
@ob_flush();
@flush();

// Call OpenAI API with streaming
$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY
];

// Track last data time for heartbeat mechanism
$GLOBALS['lastDataTime'] = time();
$GLOBALS['heartbeatInterval'] = 10; // Send heartbeat every 10 seconds of inactivity

$ch = curl_init(OPENAI_API_URL);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($openaiRequest),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_WRITEFUNCTION => function($ch, $data) {
        $GLOBALS['lastDataTime'] = time();
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
                
                if ($parsed) {
                    // Responses API streaming format
                    if (isset($parsed['type']) && $parsed['type'] === 'response.output_text.delta') {
                        $content = $parsed['delta'] ?? '';
                        echo $content;
                        @ob_flush();
                        @flush();
                    }
                    // Fallback to Chat Completions format
                    elseif (isset($parsed['choices'][0]['delta']['content'])) {
                        $content = $parsed['choices'][0]['delta']['content'];
                        echo $content;
                        @ob_flush();
                        @flush();
                    }
                }
            }
        }
        return strlen($data);
    },
    // Progress function sends heartbeat to keep mobile connections alive
    CURLOPT_NOPROGRESS => false,
    CURLOPT_PROGRESSFUNCTION => function($ch, $downloadTotal, $downloadNow, $uploadTotal, $uploadNow) {
        // Send a space character as heartbeat if no data received recently
        $timeSinceLastData = time() - $GLOBALS['lastDataTime'];
        if ($timeSinceLastData >= $GLOBALS['heartbeatInterval']) {
            echo ' ';
            @ob_flush();
            @flush();
            $GLOBALS['lastDataTime'] = time();
        }
        return 0; // Return 0 to continue, non-zero to abort
    },
    CURLOPT_TIMEOUT => 300,
    CURLOPT_CONNECTTIMEOUT => 30,
    CURLOPT_LOW_SPEED_LIMIT => 1,
    CURLOPT_LOW_SPEED_TIME => 120  // Allow up to 2 minutes of slow transfer
]);

$result = curl_exec($ch);
$error = curl_error($ch);
$errno = curl_errno($ch);
curl_close($ch);

// Log any curl errors for debugging
if ($errno) {
    error_log("OpenAI curl error ($errno): $error");
}
