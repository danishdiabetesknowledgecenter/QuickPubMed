<?php
/**
 * TranslateTitle API Proxy med Streaming Support
 * Erstatter Azure Function: /api/TranslateTitle
 *
 * Streaming/prompt-proxy for the widget. Non-streaming semantic/PubMed translation
 * without a full search is also available via SemanticTagTranslate.php, which wraps
 * muginPublicSearchTranslateSemanticQuery / muginPublicSearchTranslatePubMedQuery.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

muginApplyNlmCorsHeaders('POST, OPTIONS');
muginEnforceFirstPartyIpRateLimit('openaiProxy');

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

// Byg OpenAI/Requesty Responses request.
// Optional knobs: backend/docs/external-apis/requesty-openapi.json (ResponsesRequest).
$openaiRequest = [
    'model' => muginResolveAllowedOpenAiModel($prompt['model'] ?? null, ''),
    'input' => $messages,  // Responses API uses 'input' instead of 'messages'
    'stream' => isset($prompt['stream']) ? (bool)$prompt['stream'] : true,
    'reasoning' => [
        'effort' => muginClampOpenAiReasoningEffort($prompt['reasoning']['effort'] ?? null, 'low'),
    ],
    'text' => [
        'verbosity' => 'medium',
    ],
];
if (isset($prompt['response_format']) && is_array($prompt['response_format']) && !isset($prompt['text']['format'])) {
    $prompt['text'] = isset($prompt['text']) && is_array($prompt['text']) ? $prompt['text'] : [];
    $prompt['text']['format'] = $prompt['response_format'];
}
$openaiRequest = muginEnrichResponsesRequestFromPrompt($openaiRequest, is_array($prompt) ? $prompt : []);

$domain = muginResolveDomain();
$openAiApiUrl = muginGetOpenAIApiUrl($domain);
$openaiRequest = muginNormalizeLlmRequestPayload($openaiRequest);
$headers = muginBuildLlmHttpHeaders($domain);
$isLocalRequest = static function(): bool {
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $host !== '' && (
        strpos($host, 'localhost') !== false ||
        strpos($host, '127.0.0.1') !== false ||
        strpos($host, '[::1]') !== false ||
        $host === '::1'
    );
};

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

    $fallbackResponse = muginHttpRequest($openAiApiUrl, [
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
