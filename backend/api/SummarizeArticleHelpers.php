<?php

function qpmLoadApiConfigOrFail() {
    $configPath = dirname(__DIR__) . '/config/config.php';
    if (!file_exists($configPath)) {
        $configPath = dirname(__DIR__) . '/config.php';
    }
    if (!file_exists($configPath)) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Configuration file not found']);
        exit;
    }
    require_once $configPath;
}

function qpmApplyStrictCorsPostJson() {
    if (function_exists('qpmApplyNlmCorsHeaders')) {
        qpmApplyNlmCorsHeaders('POST, OPTIONS');
        return;
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (function_exists('getAllowedOrigin')) {
        $allowedOrigin = getAllowedOrigin($origin);
        if ($allowedOrigin) {
            header('Access-Control-Allow-Origin: ' . $allowedOrigin);
            header('Access-Control-Allow-Credentials: true');
        } elseif ($origin !== '') {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Origin is not allowed']);
            exit;
        }
    } elseif ($origin !== '') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Origin is not allowed']);
        exit;
    }
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

function qpmRequirePostMethod() {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        http_response_code(405);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }
}

function qpmReadJsonInputOrFail() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }
    return $input;
}

function qpmRequireInputField($input, $fieldName) {
    $value = $input[$fieldName] ?? null;
    if (!$value) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Missing ' . $fieldName]);
        exit;
    }
    return $value;
}

function qpmRequirePublicHttpsUrl($url, $fieldName) {
    $value = trim((string) $url);
    $parts = parse_url($value);
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    $host = strtolower(trim((string) ($parts['host'] ?? ''), '[]'));
    if ($scheme !== 'https' || $host === '') {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => $fieldName . ' must be an HTTPS URL']);
        exit;
    }

    if ($host === 'localhost' || $host === '127.0.0.1' || $host === '::1') {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => $fieldName . ' must not point to a local address']);
        exit;
    }

    if (filter_var($host, FILTER_VALIDATE_IP)) {
        $isPublic = filter_var(
            $host,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );
        if ($isPublic === false) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode(['error' => $fieldName . ' must not point to a private address']);
            exit;
        }
    }

    return $value;
}

function qpmFetchExtractedTextFromAzure($cacheType, $sourceUrl, $azureUrl, $sourceFieldName, $fetchLabel, &$cacheHit) {
    $cacheHit = false;
    $extractedText = qpmReadTextFetchCache($cacheType, $sourceUrl);
    if (is_string($extractedText) && $extractedText !== '') {
        $cacheHit = true;
        return $extractedText;
    }

    $isLocalRequest = static function(): bool {
        $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
        return $host !== '' && (
            strpos($host, 'localhost') !== false ||
            strpos($host, '127.0.0.1') !== false ||
            strpos($host, '[::1]') !== false ||
            $host === '::1'
        );
    };

    $ch = curl_init($azureUrl);
    $curlOptions = [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([$sourceFieldName => $sourceUrl]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_FOLLOWLOCATION => true
    ];

    if (defined('CURLSSLOPT_NATIVE_CA')) {
        $curlOptions[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
    }

    if ($isLocalRequest()) {
        $curlOptions[CURLOPT_PROXY] = '';
    }

    curl_setopt_array($ch, $curlOptions);

    $azureResponse = curl_exec($ch);
    $azureHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Failed to fetch ' . $fetchLabel . ': ' . $curlError]);
        exit;
    }

    if ($azureHttpCode !== 200) {
        http_response_code($azureHttpCode > 0 ? $azureHttpCode : 502);
        header('Content-Type: application/json');
        $decodedAzureError = is_string($azureResponse) && $azureResponse !== ''
            ? json_decode($azureResponse, true)
            : null;
        echo json_encode([
            'error' => 'Failed to fetch ' . $fetchLabel . ' text from upstream service',
            'upstreamStatus' => $azureHttpCode,
            'upstreamResponse' => is_array($decodedAzureError)
                ? $decodedAzureError
                : trim((string) $azureResponse),
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $azureData = json_decode($azureResponse, true);
    $extractedText = $azureData['text'] ?? '';
    if (is_string($extractedText) && $extractedText !== '') {
        qpmWriteTextFetchCache($cacheType, $sourceUrl, $extractedText);
    }
    return $extractedText;
}

function qpmBuildStreamingOpenAiRequest($prompt, $extractedText) {
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

    $defaultModel = function_exists('qpmResolveAllowedOpenAiModel')
        ? qpmResolveAllowedOpenAiModel($prompt['model'] ?? null, 'gpt-5.5')
        : (string) ($prompt['model'] ?? 'gpt-5.5');
    $openaiRequest = [
        'model' => $defaultModel,
        'input' => $messages,
        'stream' => true
    ];

    $effort = function_exists('qpmClampOpenAiReasoningEffort')
        ? qpmClampOpenAiReasoningEffort($prompt['reasoning']['effort'] ?? null, 'none')
        : (string) ($prompt['reasoning']['effort'] ?? 'none');
    $openaiRequest['reasoning'] = ['effort' => $effort];

    $openaiRequest['text'] = ['format' => ['type' => 'json_object']];

    if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
        $openaiRequest['max_output_tokens'] = function_exists('qpmClampOpenAiMaxOutputTokens')
            ? qpmClampOpenAiMaxOutputTokens($prompt['max_output_tokens'])
            : (int) $prompt['max_output_tokens'];
    } elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
        $openaiRequest['max_output_tokens'] = function_exists('qpmClampOpenAiMaxOutputTokens')
            ? qpmClampOpenAiMaxOutputTokens($prompt['max_tokens'])
            : (int) $prompt['max_tokens'];
    }

    return $openaiRequest;
}

function qpmStartPlainStreamingResponse() {
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
}

function qpmEmitStreamMetadata($metadata) {
    echo json_encode($metadata) . "\n---STREAM_START---\n";
    @ob_flush();
    @flush();
}

function qpmArticleStreamCompleteMarker() {
    return '[[QPM_ARTICLE_STREAM_COMPLETE]]';
}

function qpmArticleStreamHeartbeatMarker() {
    return '[[QPM_ARTICLE_STREAM_HEARTBEAT]]';
}

function qpmStreamOpenAiPlainText($openaiRequest) {
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

    $sseBuffer = '';
    $hasStreamedText = false;
    $streamFinishedCleanly = false;
    $streamHadTerminalError = false;
    $completeMarker = qpmArticleStreamCompleteMarker();
    $heartbeatMarker = qpmArticleStreamHeartbeatMarker();

    $GLOBALS['qpmArticleLastDataTime'] = time();
    $GLOBALS['qpmArticleHeartbeatInterval'] = 10;

    $processSseLine = static function ($line) use (&$hasStreamedText, &$streamFinishedCleanly, &$streamHadTerminalError): void {
        $line = trim((string) $line);
        if ($line === '' || strpos($line, 'data: ') !== 0) {
            return;
        }

        $jsonData = substr($line, 6);
        if ($jsonData === '[DONE]') {
            $streamFinishedCleanly = true;
            return;
        }

        $parsed = json_decode($jsonData, true);
        if (!is_array($parsed)) {
            return;
        }

        $eventType = isset($parsed['type']) ? (string) $parsed['type'] : '';
        if ($eventType === 'response.completed') {
            $streamFinishedCleanly = true;
            return;
        }
        if (
            $eventType === 'response.incomplete' ||
            $eventType === 'response.failed' ||
            $eventType === 'error' ||
            isset($parsed['error'])
        ) {
            $streamHadTerminalError = true;
            return;
        }

        $content = '';
        if ($eventType === 'response.output_text.delta') {
            $content = $parsed['delta'] ?? '';
        } elseif (isset($parsed['choices'][0]['delta']['content'])) {
            $content = $parsed['choices'][0]['delta']['content'];
        }

        if (is_string($content) && $content !== '') {
            $GLOBALS['qpmArticleLastDataTime'] = time();
            $hasStreamedText = true;
            echo $content;
            @ob_flush();
            @flush();
        }
    };

    $ch = curl_init($openAiApiUrl);
    if ($ch === false) {
        http_response_code(502);
        echo json_encode(['error' => 'Could not initialize OpenAI request']);
        return;
    }

    $curlOptions = [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($openaiRequest),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_WRITEFUNCTION => function($ch, $data) use (&$sseBuffer, $processSseLine) {
            $GLOBALS['qpmArticleLastDataTime'] = time();
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
        CURLOPT_PROGRESSFUNCTION => function($ch, $downloadTotal, $downloadNow, $uploadTotal, $uploadNow) use ($heartbeatMarker) {
            $timeSinceLastData = time() - (int) ($GLOBALS['qpmArticleLastDataTime'] ?? time());
            $heartbeatInterval = (int) ($GLOBALS['qpmArticleHeartbeatInterval'] ?? 10);
            if ($timeSinceLastData >= $heartbeatInterval) {
                echo "\n" . $heartbeatMarker . "\n";
                @ob_flush();
                @flush();
                $GLOBALS['qpmArticleLastDataTime'] = time();
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

    curl_exec($ch);
    $error = curl_error($ch);
    $errno = curl_errno($ch);

    if (trim($sseBuffer) !== '') {
        $processSseLine($sseBuffer);
    }

    curl_close($ch);

    if ($errno) {
        error_log("OpenAI curl error ($errno): $error");
        return;
    }

    if ($hasStreamedText && $streamFinishedCleanly && !$streamHadTerminalError) {
        echo "\n" . $completeMarker;
        @ob_flush();
        @flush();
    } elseif ($streamHadTerminalError) {
        error_log("OpenAI article stream ended with terminal error/incomplete event.");
    }
}
