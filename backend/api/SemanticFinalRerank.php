<?php
/**
 * Internal semantic final rerank endpoint.
 * Reorders a small, already-validated top-N candidate set with OpenAI Responses API.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

muginApplyNlmCorsHeaders('POST, OPTIONS', 'application/json');
muginEnforceFirstPartyIpRateLimit('openaiProxy');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

/**
 * @param int $status
 * @param array<string,mixed> $payload
 * @return never
 */
function muginSemanticRerankRespond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * @param mixed $value
 * @return string
 */
function muginSemanticRerankNormalizeString($value): string
{
    return trim((string) $value);
}

/**
 * @param array<string,mixed> $responsePayload
 * @return string
 */
function muginSemanticRerankExtractText(array $responsePayload): string
{
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
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    muginSemanticRerankRespond(400, ['error' => 'Invalid JSON input']);
}

$legacyQuery = muginSemanticRerankNormalizeString($input['query'] ?? '');
$userQuestion = muginSemanticRerankNormalizeString($input['userQuestion'] ?? '');
$retrievalQuery = muginSemanticRerankNormalizeString($input['retrievalQuery'] ?? '');
if ($retrievalQuery === '') {
    $retrievalQuery = $legacyQuery;
}
$finalRerankTask = function_exists('muginGetOpenAiTaskSettings')
    ? muginGetOpenAiTaskSettings('finalRerank')
    : ['model' => '', 'reasoningEffort' => 'none'];
$model = muginResolveAllowedOpenAiModel(
    muginSemanticRerankNormalizeString($input['model'] ?? ''),
    (string) ($finalRerankTask['model'] ?? '')
);
// reasoning.effort must match the model family (the API rejects mismatches).
// Source of truth: MUGIN_LLM_TASK_MODELS[provider]['finalRerank'], passed through from the widget.
$reasoningEffort = muginClampOpenAiReasoningEffort(
    $input['reasoningEffort'] ?? ($finalRerankTask['reasoningEffort'] ?? null),
    (string) ($finalRerankTask['reasoningEffort'] ?? 'none')
);
$configuredMax = (int) ($finalRerankTask['maxOutputTokens'] ?? 0);
$maxOutputTokens = $configuredMax > 0
    ? $configuredMax
    : (is_numeric($input['maxOutputTokens'] ?? null) ? (int) $input['maxOutputTokens'] : 0);
$rawCandidates = isset($input['candidates']) && is_array($input['candidates']) ? $input['candidates'] : [];

$candidates = [];
$seenIds = [];
foreach ($rawCandidates as $rawCandidate) {
    if (!is_array($rawCandidate)) {
        continue;
    }
    $id = muginSemanticRerankNormalizeString($rawCandidate['id'] ?? '');
    $title = muginSemanticRerankNormalizeString($rawCandidate['title'] ?? '');
    if ($id === '' || $title === '' || isset($seenIds[$id])) {
        continue;
    }
    $seenIds[$id] = true;

    $candidate = [
        'id' => $id,
        'title' => $title,
        'abstract' => muginSemanticRerankNormalizeString($rawCandidate['abstract'] ?? ''),
        'retracted' => ($rawCandidate['isRetracted'] ?? null) === true
            || (
                isset($rawCandidate['qualitySignals'])
                && is_array($rawCandidate['qualitySignals'])
                && ($rawCandidate['qualitySignals']['isRetracted'] ?? null) === true
            ),
    ];

    // Optional capped topics — additive topical evidence; missing topics is fine.
    if (isset($rawCandidate['topics']) && is_array($rawCandidate['topics'])) {
        $topics = [];
        $seenTopics = [];
        foreach ($rawCandidate['topics'] as $topicEntry) {
            if (!is_array($topicEntry) || count($topics) >= 16) {
                continue;
            }
            $label = muginSemanticRerankNormalizeString($topicEntry['label'] ?? '');
            $source = muginSemanticRerankNormalizeString($topicEntry['source'] ?? '');
            if ($label === '' || $source === '' || strcasecmp($source, 'openAlexConcept') === 0) {
                continue;
            }
            $key = strtolower($source) . "\0" . strtolower($label);
            if (isset($seenTopics[$key])) {
                continue;
            }
            $seenTopics[$key] = true;
            $topics[] = ['label' => $label, 'source' => $source];
        }
        if (!empty($topics)) {
            $candidate['topics'] = $topics;
        }
    }

    $candidates[] = $candidate;
}

if ($userQuestion === '' || count($candidates) < 2) {
    muginSemanticRerankRespond(200, [
        'orderedIds' => array_values(array_map(
            static function (array $candidate): string {
                return $candidate['id'];
            },
            $candidates
        )),
        'skipped' => true,
    ]);
}

$candidateCount = count($candidates);
$schema = muginFinalRerankScoreSchema($candidateCount);
$modelCandidates = [];
foreach ($candidates as $candidate) {
    $modelCandidate = [
        'id' => $candidate['id'],
        'title' => $candidate['title'],
        'abstract' => $candidate['abstract'],
    ];
    if (!empty($candidate['topics'])) {
        $modelCandidate['topics'] = $candidate['topics'];
    }
    $modelCandidates[] = $modelCandidate;
}

$systemPrompt = implode("\n", muginFinalRerankSystemPromptLines());

$userPayload = [
    'userQuestion' => $userQuestion,
    'retrievalQuery' => $retrievalQuery,
    'task' => muginFinalRerankTaskLine(),
    'candidates' => $modelCandidates,
];

$domain = muginResolveDomain();
if (!muginIsLlmConfigured($domain)) {
    muginSemanticRerankRespond(500, ['error' => 'LLM provider is not configured']);
}
$openAiApiUrl = muginGetOpenAIApiUrl($domain);

if ($model === '') {
    muginSemanticRerankRespond(500, ['error' => 'OpenAI model is not configured for finalRerank']);
}

$openAiRequest = muginNormalizeLlmRequestPayload([
    'model' => $model,
    'input' => [
        ['role' => 'system', 'content' => $systemPrompt],
        [
            'role' => 'user',
            'content' => json_encode($userPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ],
    ],
    'reasoning' => function_exists('muginResponsesReasoningFromSettings')
        ? muginResponsesReasoningFromSettings($reasoningEffort, $finalRerankTask['reasoningSummary'] ?? null)
        : ['effort' => $reasoningEffort],
    'text' => [
        'verbosity' => 'low',
        'format' => [
            'type' => 'json_schema',
            'name' => 'semantic_final_rerank',
            'strict' => true,
            'schema' => $schema,
        ],
    ],
    'max_output_tokens' => $maxOutputTokens > 0 ? $maxOutputTokens : 400,
]);

$headers = muginBuildLlmHttpHeaders($domain);

$modelsToTry = [$model];
$fallbackModel = trim((string) ($finalRerankTask['fallbackModel'] ?? ''));
if ($fallbackModel !== '' && $fallbackModel !== $model) {
    $modelsToTry[] = $fallbackModel;
}
$decodedResponse = null;
$lastFailure = ['error' => 'OpenAI request failed'];
foreach ($modelsToTry as $attemptModel) {
    $openAiRequest['model'] = function_exists('muginFormatLlmModelForProvider')
        ? muginFormatLlmModelForProvider($attemptModel)
        : $attemptModel;
    $ch = curl_init($openAiApiUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($openAiRequest),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 60,
    ]);
    $rawResponse = curl_exec($ch);
    $curlError = curl_errno($ch) ? curl_error($ch) : '';
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rawResponse === false || $curlError !== '') {
        $lastFailure = ['error' => $curlError !== '' ? $curlError : 'OpenAI request failed'];
        continue;
    }
    $decodedAttempt = json_decode($rawResponse, true);
    if (!is_array($decodedAttempt) || $status < 200 || $status >= 300) {
        $lastFailure = [
            'error' => 'OpenAI request failed',
            'status' => $status,
            'details' => is_array($decodedAttempt) ? $decodedAttempt : substr((string) $rawResponse, 0, 500),
        ];
        continue;
    }
    $decodedResponse = $decodedAttempt;
    break;
}
if (!is_array($decodedResponse)) {
    muginSemanticRerankRespond(502, $lastFailure);
}

$responseText = muginSemanticRerankExtractText($decodedResponse);
$parsedOutput = json_decode($responseText, true);
if (!is_array($parsedOutput)) {
    muginSemanticRerankRespond(502, [
        'error' => 'OpenAI did not return valid JSON output',
        'raw' => $responseText,
    ]);
}

$expectedIds = array_values(array_map(
    static function (array $candidate): string {
        return $candidate['id'];
    },
    $candidates
));
$validated = muginFinalRerankValidateRawScores($parsedOutput['scores'] ?? null, $expectedIds);
if (($validated['ok'] ?? false) !== true) {
    muginSemanticRerankRespond(422, [
        'error' => 'OpenAI returned invalid relevance scores',
        'reason' => (string) ($validated['reason'] ?? 'scores_invalid'),
        'scores' => $parsedOutput['scores'] ?? null,
        'expectedIds' => $expectedIds,
    ]);
}

$cappedById = [];
$retractedById = [];
foreach ($candidates as $candidate) {
    $capped = muginFinalRerankCapRelevance(
        (int) $validated['rawById'][$candidate['id']],
        trim((string) $candidate['abstract']) !== ''
    );
    $cappedById[$candidate['id']] = $capped['relevance'];
    if (($candidate['retracted'] ?? false) === true) {
        $retractedById[$candidate['id']] = true;
    }
}
$orderedIds = muginFinalRerankOrderByRelevanceMargin(
    $expectedIds,
    $cappedById,
    $retractedById,
    muginFinalRerankMinScoreGap()
);
$scores = [];
foreach ($orderedIds as $orderedId) {
    $scores[] = [
        'id' => $orderedId,
        'relevance' => $cappedById[$orderedId],
    ];
}

muginSemanticRerankRespond(200, [
    'orderedIds' => $orderedIds,
    'scores' => $scores,
    'model' => $openAiRequest['model'],
]);
