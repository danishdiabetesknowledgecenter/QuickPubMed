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
    $authors = $article['AuthorList'] ?? $article['authorList'] ?? $article['Authors'] ?? $article['authors'] ?? '';
    $pubDate = $article['PubDate'] ?? $article['pubDate'] ?? $article['PublicationDate'] ?? $article['publicationDate'] ?? '';
    
    // Handle authors array
    if (is_array($authors)) {
        $authors = implode(', ', $authors);
    }
    
    $articleText .= "\n{$num}. ```";
    $articleText .= "Title:\n{$title}\n";
    $articleText .= "Authors:\n{$authors}\n";
    $articleText .= "Publication Date:\n{$pubDate}\n";
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

// Byg OpenAI request - using Responses API for GPT-5.2
// See: https://platform.openai.com/docs/api-reference/responses/create
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-5.2-chat-latest',
    'input' => $messages,  // Responses API uses 'input' instead of 'messages'
    'stream' => true
];

// GPT-5.2 reasoning parameter
if (isset($prompt['reasoning']['effort'])) {
    $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
} else {
    $openaiRequest['reasoning'] = ['effort' => 'none']; // Default - faster
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

// Streaming response
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('X-Accel-Buffering: no');

if (ob_get_level()) ob_end_clean();

// HTTP headers for OpenAI API
$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . OPENAI_API_KEY
];

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
                // See: https://platform.openai.com/docs/api-reference/responses/streaming
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
    CURLOPT_TIMEOUT => 300
]);

curl_exec($ch);
curl_close($ch);

