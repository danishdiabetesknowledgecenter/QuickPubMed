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

function qpmFetchExtractedTextFromAzure($cacheType, $sourceUrl, $azureUrl, $sourceFieldName, $fetchLabel, &$cacheHit) {
    $cacheHit = false;
    $extractedText = qpmReadTextFetchCache($cacheType, $sourceUrl);
    if (is_string($extractedText) && $extractedText !== '') {
        $cacheHit = true;
        return $extractedText;
    }

    $ch = curl_init($azureUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([$sourceFieldName => $sourceUrl]),
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
        echo json_encode(['error' => 'Failed to fetch ' . $fetchLabel . ': ' . $curlError]);
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

    $openaiRequest = [
        'model' => $prompt['model'] ?? 'gpt-4o',
        'input' => $messages,
        'stream' => true
    ];

    if (isset($prompt['reasoning']['effort'])) {
        $openaiRequest['reasoning'] = ['effort' => $prompt['reasoning']['effort']];
    } else {
        $openaiRequest['reasoning'] = ['effort' => 'none'];
    }

    $openaiRequest['text'] = ['format' => ['type' => 'json_object']];

    if (isset($prompt['max_output_tokens']) && $prompt['max_output_tokens'] !== null) {
        $openaiRequest['max_output_tokens'] = (int)$prompt['max_output_tokens'];
    } elseif (isset($prompt['max_tokens']) && $prompt['max_tokens'] !== null) {
        $openaiRequest['max_output_tokens'] = (int)$prompt['max_tokens'];
    }

    return $openaiRequest;
}

function qpmStartPlainStreamingResponse() {
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('X-Accel-Buffering: no');
    header('X-Content-Type-Options: nosniff');
    header('Transfer-Encoding: chunked');

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

function qpmStreamOpenAiPlainText($openaiRequest) {
    $domain = qpmResolveDomain();
    $openAiApiKey = qpmGetOpenAIApiKey($domain);
    $openAiApiUrl = qpmGetOpenAIApiUrl($domain);

    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $openAiApiKey
    ];

    $GLOBALS['lastDataTime'] = time();
    $GLOBALS['heartbeatInterval'] = 10;

    $ch = curl_init($openAiApiUrl);
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
                if (empty($line)) {
                    continue;
                }
                if (strpos($line, 'data: ') === 0) {
                    $jsonData = substr($line, 6);
                    if ($jsonData === '[DONE]') {
                        break;
                    }
                    $parsed = json_decode($jsonData, true);
                    if ($parsed) {
                        if (isset($parsed['type']) && $parsed['type'] === 'response.output_text.delta') {
                            $content = $parsed['delta'] ?? '';
                            echo $content;
                            @ob_flush();
                            @flush();
                        } elseif (isset($parsed['choices'][0]['delta']['content'])) {
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
        CURLOPT_NOPROGRESS => false,
        CURLOPT_PROGRESSFUNCTION => function($ch, $downloadTotal, $downloadNow, $uploadTotal, $uploadNow) {
            $timeSinceLastData = time() - $GLOBALS['lastDataTime'];
            if ($timeSinceLastData >= $GLOBALS['heartbeatInterval']) {
                echo ' ';
                @ob_flush();
                @flush();
                $GLOBALS['lastDataTime'] = time();
            }
            return 0;
        },
        CURLOPT_TIMEOUT => 300,
        CURLOPT_CONNECTTIMEOUT => 30,
        CURLOPT_LOW_SPEED_LIMIT => 1,
        CURLOPT_LOW_SPEED_TIME => 120
    ]);

    curl_exec($ch);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);

    if ($errno) {
        error_log("OpenAI curl error ($errno): $error");
    }
}
