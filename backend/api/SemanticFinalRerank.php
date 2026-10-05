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
require_once dirname(__DIR__) . '/app/public-search-lib.php';

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
$domain = muginResolveDomain();
if (!muginIsLlmConfigured($domain)) {
    muginSemanticRerankRespond(500, ['error' => 'LLM provider is not configured']);
}
if ($model === '') {
    muginSemanticRerankRespond(500, ['error' => 'OpenAI model is not configured for finalRerank']);
}
$candidatesById = [];
foreach ($modelCandidates as $modelCandidate) {
    $candidatesById[(string) $modelCandidate['id']] = $modelCandidate;
}
$expectedIds = array_values(array_map(
    static function (array $candidate): string {
        return $candidate['id'];
    },
    $candidates
));

$attemptModels = [$model];
$fallbackModel = trim((string) ($finalRerankTask['fallbackModel'] ?? ''));
if ($fallbackModel !== '' && $fallbackModel !== $model) {
    $attemptModels[] = $fallbackModel;
}
$rawById = [];
$confidenceById = [];
$pendingIds = $expectedIds;
foreach ($attemptModels as $attemptModel) {
    if ($pendingIds === []) {
        break;
    }
    $scored = muginPublicSearchScoreFinalRerankWithModel(
        $candidatesById,
        $pendingIds,
        $attemptModel,
        $userQuestion,
        $retrievalQuery,
        $maxOutputTokens > 0 ? $maxOutputTokens : 400,
        $domain,
        $reasoningEffort,
        $finalRerankTask['reasoningSummary'] ?? null
    );
    foreach ($scored['rawById'] as $scoredId => $scoredValue) {
        $rawById[(string) $scoredId] = (int) $scoredValue;
    }
    foreach ((array) ($scored['confidenceById'] ?? []) as $scoredId => $confidenceValue) {
        if (is_numeric($confidenceValue) && !is_bool($confidenceValue)) {
            $confidenceById[(string) $scoredId] = (float) $confidenceValue;
        }
    }
    $pendingIds = array_values($scored['failedIds']);
}
if ($rawById === []) {
    muginSemanticRerankRespond(502, ['error' => 'OpenAI request failed']);
}

$cappedById = [];
$retractedById = [];
$pinnedById = [];
foreach ($candidates as $candidate) {
    if (!array_key_exists($candidate['id'], $rawById)) {
        $pinnedById[$candidate['id']] = true;
        continue;
    }
    $capped = muginFinalRerankCapRelevance(
        (int) $rawById[$candidate['id']],
        trim((string) $candidate['abstract']) !== ''
    );
    $cappedById[$candidate['id']] = $capped['relevance'];
    if (($candidate['retracted'] ?? false) === true) {
        $retractedById[$candidate['id']] = true;
    }
}
$llmConfig = muginPublicSearchGetSemanticLlmConfig();
$promotedById = muginFinalRerankPromotedIdMap(
    $cappedById,
    $confidenceById,
    (float) ($llmConfig['promoteMinConfidence'] ?? 0.75),
    (int) ($llmConfig['promoteCutoffScore'] ?? 7),
    $retractedById
);
$orderedIds = muginFinalRerankOrderByRelevanceMargin(
    $expectedIds,
    $cappedById,
    $retractedById,
    muginFinalRerankMinScoreGap(),
    $pinnedById,
    $promotedById
);
$scores = [];
foreach ($orderedIds as $orderedId) {
    if (!array_key_exists($orderedId, $cappedById)) {
        continue;
    }
    $scores[] = [
        'id' => $orderedId,
        'relevance' => $cappedById[$orderedId],
    ];
}

muginSemanticRerankRespond(200, [
    'orderedIds' => $orderedIds,
    'scores' => $scores,
    'model' => function_exists('muginFormatLlmModelForProvider')
        ? muginFormatLlmModelForProvider((string) ($attemptModels[0] ?? $model))
        : $model,
]);
