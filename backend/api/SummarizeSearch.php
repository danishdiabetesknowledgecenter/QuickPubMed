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
$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Configuration file not found: ' . $configPath]);
    exit;
}

require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

// Verify that the active LLM provider is configured (OpenAI or Requesty).
if (!muginIsLlmConfigured()) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'LLM provider is not configured']);
    exit;
}

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

// Udtræk data fra request
$prompt = $input['prompt'] ?? null;
$articles = $input['articles'] ?? [];
$debug = $input['debug'] ?? false;

if (!$prompt) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing prompt']);
    exit;
}

// Get prompt text - frontend now sends complete prompt with articles included
$promptText = $prompt['prompt'] ?? '';

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
    $messages[] = ['role' => 'user', 'content' => $promptText];
}

// Byg OpenAI/Requesty Responses request.
// Optional knobs: backend/docs/external-apis/requesty-openapi.json (ResponsesRequest).
$openaiRequest = [
    'model' => muginResolveAllowedOpenAiModel($prompt['model'] ?? null, ''),
    'input' => $messages,  // Responses API uses 'input' instead of 'messages'
    'stream' => true,
    'reasoning' => [
        'effort' => muginClampOpenAiReasoningEffort($prompt['reasoning']['effort'] ?? null, 'none'),
    ],
    'text' => [
        'verbosity' => isset($prompt['text']['verbosity'])
            ? $prompt['text']['verbosity']
            : 'medium',
    ],
];
$openaiRequest = muginEnrichResponsesRequestFromPrompt($openaiRequest, is_array($prompt) ? $prompt : []);
$openaiRequest = muginNormalizeLlmRequestPayload($openaiRequest);

// Debug mode - return full prompt without calling OpenAI
if ($debug) {
    header('Content-Type: application/json');
    echo json_encode([
        'debug' => true,
        'full_prompt_text' => $promptText,
        'openai_request' => $openaiRequest,
        'llm_provider' => muginGetLlmProvider(),
        'llm_api_url' => muginGetOpenAIApiUrl(muginResolveDomain()),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Streaming response. The frontend reads this as plain text chunks.
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('X-Accel-Buffering: no');
header('X-Content-Type-Options: nosniff');

@ini_set('output_buffering', 'Off');
@ini_set('zlib.output_compression', 0);
while (ob_get_level()) {
    ob_end_clean();
}
ob_implicit_flush(true);
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
set_time_limit(0);

$domain = muginResolveDomain();
$openAiApiUrl = muginGetOpenAIApiUrl($domain);
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

$sseBuffer = '';
$hasStreamedText = false;
$streamCompleteMarker = '[[MUGIN_STREAM_COMPLETE]]';
$streamHeartbeatMarker = '[[MUGIN_STREAM_HEARTBEAT]]';
$GLOBALS['muginSummaryLastDataTime'] = time();
$GLOBALS['muginSummaryHeartbeatInterval'] = 10;

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
        $contentItems = isset($output['content']) && is_array($output['content'])
            ? $output['content']
            : [];
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

$emitStreamText = static function(string $content) use (&$hasStreamedText): void {
    if ($content === '') {
        return;
    }
    $hasStreamedText = true;
    $GLOBALS['muginSummaryLastDataTime'] = time();
    muginEchoLlmStreamText($content);
};

$respondOpenAiError = static function(string $message, int $status = 502, array $details = []): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['error' => $message], $details), JSON_UNESCAPED_UNICODE);
    exit;
};

// Keep the connection open while Requesty streams reasoning-only events.
// No surrounding newlines — they would split visible text after marker strip.
echo $streamHeartbeatMarker;
@ob_flush();
@flush();

$processSseLine = function($line) use (&$hasStreamedText, $extractResponseText, $emitStreamText) {
    $line = trim((string) $line);
    if ($line === '' || strpos($line, 'data: ') !== 0) {
        return;
    }

    $jsonData = substr($line, 6);
    if ($jsonData === '[DONE]') {
        return;
    }

    $parsed = json_decode($jsonData, true);
    if (!is_array($parsed)) {
        return;
    }

    if (isset($parsed['type']) && $parsed['type'] === 'response.output_text.delta') {
        $content = $parsed['delta'] ?? '';
        if (is_string($content) && $content !== '') {
            $emitStreamText($content);
        }
        return;
    }

    if (isset($parsed['choices'][0]['delta']['content'])) {
        $content = $parsed['choices'][0]['delta']['content'];
        if (is_string($content) && $content !== '') {
            $emitStreamText($content);
        }
        return;
    }

    // Fallback: final Responses events may carry full output without prior deltas
    // (or after reasoning-only chunks). Prefer nested response payload.
    $eventType = strtolower(trim((string) ($parsed['type'] ?? '')));
    if (in_array($eventType, ['response.completed', 'response.incomplete'], true)) {
        $responseObj = isset($parsed['response']) && is_array($parsed['response'])
            ? $parsed['response']
            : $parsed;
        if (!$hasStreamedText) {
            $content = $extractResponseText($responseObj);
            if ($content !== '') {
                $emitStreamText($content);
            }
        }
        if (
            !$hasStreamedText
            && $eventType === 'response.incomplete'
        ) {
            $reason = trim((string) ($responseObj['incomplete_details']['reason'] ?? 'incomplete'));
            $GLOBALS['muginSummaryIncompleteReason'] = $reason !== '' ? $reason : 'incomplete';
        }
        return;
    }

    if (!$hasStreamedText) {
        $content = $extractResponseText($parsed);
        if ($content !== '') {
            $emitStreamText($content);
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

    echo $responseText . "\n" . $streamCompleteMarker;
    @ob_flush();
    @flush();
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
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_WRITEFUNCTION => function($ch, $data) use (&$sseBuffer, $processSseLine) {
        // Do not refresh lastDataTime here: Requesty/Kimi may stream reasoning for
        // a long time with no visible output_text; heartbeats must still fire.
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
    CURLOPT_NOPROGRESS => false,
    CURLOPT_PROGRESSFUNCTION => function($ch, $downloadTotal, $downloadNow, $uploadTotal, $uploadNow) use ($streamHeartbeatMarker) {
        $timeSinceLastData = time() - (int) ($GLOBALS['muginSummaryLastDataTime'] ?? time());
        $heartbeatInterval = (int) ($GLOBALS['muginSummaryHeartbeatInterval'] ?? 10);
        if ($timeSinceLastData >= $heartbeatInterval) {
            echo $streamHeartbeatMarker;
            @ob_flush();
            @flush();
            $GLOBALS['muginSummaryLastDataTime'] = time();
        }
        return 0;
    },
    CURLOPT_TIMEOUT => 0,
    CURLOPT_CONNECTTIMEOUT => 30,
    CURLOPT_LOW_SPEED_LIMIT => 1,
    CURLOPT_LOW_SPEED_TIME => 240
];

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

if (trim($sseBuffer) !== '') {
    $processSseLine($sseBuffer);
}

if (($curlResult === false || $curlError !== '') && !$hasStreamedText) {
    curl_close($ch);
    $respondOpenAiError('OpenAI request failed', 502, [
        'status' => $curlStatus,
        'details' => $curlError !== '' ? $curlError : 'OpenAI request failed',
    ]);
}

if ($curlError !== '') {
    error_log('OpenAI summarize stream curl error: ' . $curlError);
    curl_close($ch);
    exit;
}

if ($curlStatus > 0 && ($curlStatus < 200 || $curlStatus >= 300) && !$hasStreamedText) {
    curl_close($ch);
    $respondOpenAiError('OpenAI request failed', 502, [
        'status' => $curlStatus,
        'details' => trim($sseBuffer) !== ''
            ? substr(trim($sseBuffer), 0, 500)
            : 'OpenAI returned a non-success status',
    ]);
}

if (!$hasStreamedText) {
    curl_close($ch);
    $incompleteReason = trim((string) ($GLOBALS['muginSummaryIncompleteReason'] ?? ''));
    $respondOpenAiError(
        $incompleteReason !== ''
            ? 'OpenAI response incomplete before text output (' . $incompleteReason . ')'
            : 'OpenAI response did not contain text output',
        502,
        [
            'status' => $curlStatus,
        ]
    );
}

echo "\n" . $streamCompleteMarker;
@ob_flush();
@flush();

curl_close($ch);
