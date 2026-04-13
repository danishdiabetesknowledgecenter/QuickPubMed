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
$sseBuffer = '';
$hasStreamedText = false;
/**
 * @param array<string,mixed> $responsePayload
 * @return string
 */
$extractResponseText = static function(array $responsePayload): string {
    if (isset($responsePayload['output_text']) && is_string($responsePayload['output_text'])) {
        return trim($responsePayload['output_text']);
    }

    $parts = [];
    $outputs = isset($responsePayload['output']) && is_array($responsePayload['output'])
        ? $responsePayload['output']
        : [];
    foreach ($outputs as $output) {
        if (!is_array($output)) {
            continue;
        }
        $contentItems = isset($output['content']) && is_array($output['content']) ? $output['content'] : [];
        foreach ($contentItems as $item) {
            if (!is_array($item)) {
                continue;
            }
            $text = $item['text'] ?? ($item['content'] ?? '');
            if (is_string($text) && trim($text) !== '') {
                $parts[] = trim($text);
            }
        }
    }

    return trim(implode("\n", $parts));
};
$processSseLine = function($line) use (&$hasStreamedText, $extractResponseText) {
    $line = trim((string) $line);
    if ($line === '') return;
    if (strpos($line, 'data: ') !== 0) return;

    $jsonData = substr($line, 6);
    if ($jsonData === '[DONE]') return;

    $parsed = json_decode($jsonData, true);
    if (!$parsed) return;

    if (isset($parsed['type']) && $parsed['type'] === 'response.output_text.delta') {
        $content = $parsed['delta'] ?? '';
        if ($content !== '') {
            $hasStreamedText = true;
            echo $content;
            flush();
        }
        return;
    }

    if (isset($parsed['choices'][0]['delta']['content'])) {
        $content = $parsed['choices'][0]['delta']['content'];
        if ($content !== '') {
            $hasStreamedText = true;
            echo $content;
            flush();
        }
        return;
    }

    if (!$hasStreamedText) {
        $content = $extractResponseText($parsed);
        if ($content !== '') {
            $hasStreamedText = true;
            echo $content;
            flush();
        }
    }
};

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($openaiRequest),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_WRITEFUNCTION => function($ch, $data) use (&$sseBuffer, $processSseLine) {
        $sseBuffer .= $data;
        $lines = preg_split("/\r\n|\n|\r/", $sseBuffer);
        if ($lines === false) {
            return strlen($data);
        }

        $endsWithLineBreak = preg_match("/\r\n|\n|\r$/", $sseBuffer) === 1;
        if ($endsWithLineBreak) {
            $sseBuffer = '';
        } else {
            $sseBuffer = (string) array_pop($lines);
        }

        foreach ($lines as $line) {
            $processSseLine($line);
        }
        return strlen($data);
    },
    CURLOPT_TIMEOUT => 120
]);

curl_exec($ch);

if (trim($sseBuffer) !== '') {
    $processSseLine($sseBuffer);
    if (!$hasStreamedText) {
        $rawTail = trim($sseBuffer);
        $parsedTail = json_decode($rawTail, true);
        if (is_array($parsedTail)) {
            $tailText = $extractResponseText($parsedTail);
            if ($tailText !== '') {
                $hasStreamedText = true;
                echo $tailText;
                flush();
            }
        }
    }
}

if (curl_errno($ch)) {
    echo "\n\nError: " . curl_error($ch);
}

curl_close($ch);
