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

// Byg OpenAI request - using Responses API for gpt-5.5
// See: https://platform.openai.com/docs/api-reference/responses/create
$openaiRequest = [
    'model' => $prompt['model'] ?? 'gpt-5.5',
    'input' => $messages,  // Responses API uses 'input' instead of 'messages'
    'stream' => isset($prompt['stream']) ? (bool)$prompt['stream'] : true
];

// gpt-5.5 reasoning parameter
if (isset($prompt['reasoning']['effort'])) {
    $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
} else {
    $openaiRequest['reasoning'] = ['effort' => 'low']; // Default - faster
}

// gpt-5.5 text configuration (verbosity + optional structured output format)
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

// max_output_tokens for gpt-5.5
if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
} elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
    $openaiRequest['max_output_tokens'] = (int)$prompt['max_tokens'];
}

$domain = qpmResolveDomain();
$openAiApiKey = qpmGetOpenAIApiKey($domain);
$openAiOrgId = qpmGetOpenAIOrgId($domain);
$openAiApiUrl = qpmGetOpenAIApiUrl($domain);
$isLocalRequest = static function(): bool {
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $host !== '' && (
        strpos($host, 'localhost') !== false ||
        strpos($host, '127.0.0.1') !== false ||
        strpos($host, '[::1]') !== false ||
        $host === '::1'
    );
};

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
$respondOpenAiError = static function(string $message, int $status = 502, array $details = []): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(array_merge(['error' => $message], $details), JSON_UNESCAPED_UNICODE);
    exit;
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

if (!function_exists('curl_init')) {
    $fallbackRequest = $openaiRequest;
    $fallbackRequest['stream'] = false;

    $fallbackResponse = qpmHttpRequest($openAiApiUrl, [
        'method' => 'POST',
        'headers' => $headers,
        'body' => json_encode($fallbackRequest),
        'timeout' => 120,
    ]);

    $status = (int) ($fallbackResponse['status'] ?? 0);
    if (!$fallbackResponse['ok'] || $status < 200 || $status >= 300) {
        $respondOpenAiError('OpenAI request failed', 502, [
            'status' => $status,
            'details' => $fallbackResponse['error'] ?: substr((string) $fallbackResponse['body'], 0, 500),
        ]);
    }

    $decodedResponse = json_decode((string) $fallbackResponse['body'], true);
    if (!is_array($decodedResponse)) {
        $respondOpenAiError('Invalid OpenAI response', 502, [
            'status' => $status,
            'raw' => substr((string) $fallbackResponse['body'], 0, 500),
        ]);
    }

    $responseText = $extractResponseText($decodedResponse);
    if ($responseText === '') {
        $respondOpenAiError('OpenAI response did not contain text output', 502, [
            'status' => $status,
        ]);
    }

    echo $responseText;
    flush();
    exit;
}

$ch = curl_init($openAiApiUrl);
if ($ch === false) {
    $respondOpenAiError('Could not initialize OpenAI request');
}

$curlOptions = [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($openaiRequest),
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 120
];

if (!empty($openaiRequest['stream'])) {
    $curlOptions[CURLOPT_RETURNTRANSFER] = false;
    $curlOptions[CURLOPT_WRITEFUNCTION] = function($ch, $data) use (&$sseBuffer, $processSseLine) {
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
    };
} else {
    $curlOptions[CURLOPT_RETURNTRANSFER] = true;
}

if (defined('CURLSSLOPT_NATIVE_CA')) {
    $curlOptions[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
}

if ($isLocalRequest()) {
    $curlOptions[CURLOPT_PROXY] = '';
}

curl_setopt_array($ch, $curlOptions);

$curlResult = curl_exec($ch);
$curlError = curl_errno($ch) ? curl_error($ch) : '';
$curlStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (empty($openaiRequest['stream']) && $curlError === '' && $curlResult !== false) {
    if ($curlStatus < 200 || $curlStatus >= 300) {
        curl_close($ch);
        $respondOpenAiError('OpenAI request failed', 502, [
            'status' => $curlStatus,
            'details' => substr((string) $curlResult, 0, 500),
        ]);
    }

    $decodedResponse = json_decode((string) $curlResult, true);
    if (!is_array($decodedResponse)) {
        curl_close($ch);
        $respondOpenAiError('Invalid OpenAI response', 502, [
            'status' => $curlStatus,
            'raw' => substr((string) $curlResult, 0, 500),
        ]);
    }

    $responseText = $extractResponseText($decodedResponse);
    curl_close($ch);
    if ($responseText === '') {
        $respondOpenAiError('OpenAI response did not contain text output', 502, [
            'status' => $curlStatus,
        ]);
    }

    echo $responseText;
    flush();
    exit;
}

if (($curlResult === false || $curlError !== '') && !$hasStreamedText && trim($sseBuffer) === '') {
    curl_close($ch);
    $respondOpenAiError('OpenAI request failed', 502, [
        'status' => $curlStatus,
        'details' => $curlError !== '' ? $curlError : 'OpenAI request failed',
    ]);
}

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

if ($curlStatus > 0 && ($curlStatus < 200 || $curlStatus >= 300) && !$hasStreamedText) {
    $respondOpenAiError('OpenAI request failed', 502, [
        'status' => $curlStatus,
        'details' => trim($sseBuffer) !== '' ? substr(trim($sseBuffer), 0, 500) : 'OpenAI returned a non-success status',
    ]);
}

if ($curlError !== '') {
    echo "\n\nError: " . curl_error($ch);
}

curl_close($ch);
