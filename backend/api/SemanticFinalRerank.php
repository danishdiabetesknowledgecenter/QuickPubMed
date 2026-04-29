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

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigin = getAllowedOrigin($origin);
if ($allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
function qpmSemanticRerankRespond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * @param mixed $value
 * @return string
 */
function qpmSemanticRerankNormalizeString($value): string
{
    return trim((string) $value);
}

/**
 * @param array<string,mixed> $responsePayload
 * @return string
 */
function qpmSemanticRerankExtractText(array $responsePayload): string
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
    qpmSemanticRerankRespond(400, ['error' => 'Invalid JSON input']);
}

$query = qpmSemanticRerankNormalizeString($input['query'] ?? '');
$hardFilterQuery = qpmSemanticRerankNormalizeString($input['hardFilterQuery'] ?? '');
$rawResultFocus = isset($input['resultFocus']) && is_array($input['resultFocus']) ? $input['resultFocus'] : [];
$resultFocus = [
    'id' => qpmSemanticRerankNormalizeString($rawResultFocus['id'] ?? ''),
    'label' => qpmSemanticRerankNormalizeString($rawResultFocus['label'] ?? ''),
    'description' => qpmSemanticRerankNormalizeString($rawResultFocus['description'] ?? ''),
];
$model = qpmSemanticRerankNormalizeString($input['model'] ?? 'gpt-5.4-nano');
$maxOutputTokens = (int) ($input['maxOutputTokens'] ?? 400);
$rawCandidates = isset($input['candidates']) && is_array($input['candidates']) ? $input['candidates'] : [];

$candidates = [];
$seenIds = [];
foreach ($rawCandidates as $rawCandidate) {
    if (!is_array($rawCandidate)) {
        continue;
    }
    $id = qpmSemanticRerankNormalizeString($rawCandidate['id'] ?? '');
    $title = qpmSemanticRerankNormalizeString($rawCandidate['title'] ?? '');
    if ($id === '' || $title === '' || isset($seenIds[$id])) {
        continue;
    }
    $seenIds[$id] = true;

    $candidate = [
        'id' => $id,
        'title' => $title,
        'abstract' => qpmSemanticRerankNormalizeString($rawCandidate['abstract'] ?? ''),
        'publicationDate' => qpmSemanticRerankNormalizeString($rawCandidate['publicationDate'] ?? ''),
        'source' => qpmSemanticRerankNormalizeString($rawCandidate['source'] ?? ''),
        'sourceLabel' => qpmSemanticRerankNormalizeString($rawCandidate['sourceLabel'] ?? ''),
    ];

    // Optional quality signals — passed through when available so the LLM can use
    // them as additional context. The strict permutation contract still applies:
    // the LLM cannot exclude or add records.
    $qualitySignals = [];
    $signalFields = [
        'fwci' => 'float',
        'rcr' => 'float',
        'nihPercentile' => 'float',
        'citationCount' => 'int',
        'influentialCitationCount' => 'int',
        'citedByClin' => 'int',
        'year' => 'int',
        'isRetracted' => 'bool',
        'isClinical' => 'bool',
        'isOpenAccess' => 'bool',
        'venue' => 'string',
    ];
    foreach ($signalFields as $field => $type) {
        if (!array_key_exists($field, $rawCandidate)) {
            continue;
        }
        $value = $rawCandidate[$field];
        if ($value === null || $value === '') {
            continue;
        }
        switch ($type) {
            case 'float':
                if (is_numeric($value)) $qualitySignals[$field] = (float) $value;
                break;
            case 'int':
                if (is_numeric($value)) $qualitySignals[$field] = (int) $value;
                break;
            case 'bool':
                if (is_bool($value)) $qualitySignals[$field] = $value;
                break;
            case 'string':
                $normalized = qpmSemanticRerankNormalizeString($value);
                if ($normalized !== '') $qualitySignals[$field] = $normalized;
                break;
        }
    }
    if (isset($rawCandidate['pubTypes']) && is_array($rawCandidate['pubTypes'])) {
        $pubTypes = [];
        foreach ($rawCandidate['pubTypes'] as $pubType) {
            $normalized = qpmSemanticRerankNormalizeString($pubType);
            if ($normalized !== '') $pubTypes[$normalized] = true;
        }
        if (!empty($pubTypes)) {
            $qualitySignals['pubTypes'] = array_values(array_keys($pubTypes));
        }
    }

    if (!empty($qualitySignals)) {
        $candidate['qualitySignals'] = $qualitySignals;
    }

    $candidates[] = $candidate;
}

if ($query === '' || count($candidates) < 2) {
    qpmSemanticRerankRespond(200, [
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
$schema = [
    'type' => 'object',
    'additionalProperties' => false,
    'required' => ['orderedIds'],
    'properties' => [
        'orderedIds' => [
            'type' => 'array',
            'items' => ['type' => 'string'],
            'minItems' => $candidateCount,
            'maxItems' => $candidateCount,
        ],
    ],
];

$systemPrompt = implode("\n", [
    'You rerank already validated scholarly search candidates.',
    'Never exclude, add, or invent items. Return a permutation of the provided candidate ids only.',
    'Prefer candidates that best match the query intent using title and abstract together.',
    'Treat missing abstracts conservatively.',
    'Do not try to override publication-type, date, or other hard filters because they have already been applied.',
    'When signals such as FWCI, RCR, citation counts, retraction status, publication type or recency are provided on a candidate, you may use them to inform relevance, but never to override prior hard filters and never to exclude or add candidates. Prefer non-retracted records over retracted ones when all other evidence is comparable.',
]);
if ($resultFocus['id'] !== '') {
    $systemPrompt .= "\n" . 'Respect the selected result focus when ordering otherwise comparable candidates: '
        . $resultFocus['label'] . '. ' . $resultFocus['description'];
    if ($resultFocus['id'] === 'newest-research') {
        $systemPrompt .= ' For this focus, prefer more recent studies when relevance is comparable, and avoid promoting old studies solely because they have accumulated citations.';
    }
}

$userPayload = [
    'query' => $query,
    'hardFilterQuery' => $hardFilterQuery,
    'resultFocus' => $resultFocus,
    'task' => 'Return the candidate ids ordered from most to least relevant.',
    'candidates' => $candidates,
];

$openAiApiKey = qpmGetOpenAIApiKey(qpmResolveDomain());
$openAiApiUrl = qpmGetOpenAIApiUrl(qpmResolveDomain());
$openAiOrgId = function_exists('qpmGetOpenAIOrgId') ? qpmGetOpenAIOrgId(qpmResolveDomain()) : '';
if ($openAiApiKey === '' || $openAiApiUrl === '') {
    qpmSemanticRerankRespond(500, ['error' => 'OpenAI configuration is missing']);
}

$openAiRequest = [
    'model' => $model !== '' ? $model : 'gpt-5.4-nano',
    'input' => [
        ['role' => 'system', 'content' => $systemPrompt],
        [
            'role' => 'user',
            'content' => json_encode($userPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ],
    ],
    'reasoning' => ['effort' => 'minimal'],
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
];

$headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $openAiApiKey,
];
if ($openAiOrgId !== '') {
    $headers[] = 'OpenAI-Organization: ' . $openAiOrgId;
}

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
    qpmSemanticRerankRespond(502, ['error' => $curlError !== '' ? $curlError : 'OpenAI request failed']);
}

$decodedResponse = json_decode($rawResponse, true);
if (!is_array($decodedResponse)) {
    qpmSemanticRerankRespond(502, [
        'error' => 'Invalid OpenAI response',
        'status' => $status,
        'raw' => substr((string) $rawResponse, 0, 500),
    ]);
}

if ($status < 200 || $status >= 300) {
    qpmSemanticRerankRespond(502, [
        'error' => 'OpenAI request failed',
        'status' => $status,
        'details' => $decodedResponse,
    ]);
}

$responseText = qpmSemanticRerankExtractText($decodedResponse);
$parsedOutput = json_decode($responseText, true);
if (!is_array($parsedOutput)) {
    qpmSemanticRerankRespond(502, [
        'error' => 'OpenAI did not return valid JSON output',
        'raw' => $responseText,
    ]);
}

$orderedIds = isset($parsedOutput['orderedIds']) && is_array($parsedOutput['orderedIds'])
    ? array_values(array_map('qpmSemanticRerankNormalizeString', $parsedOutput['orderedIds']))
    : [];
$expectedIds = array_values(array_map(
    static function (array $candidate): string {
        return $candidate['id'];
    },
    $candidates
));
$expectedLookup = array_fill_keys($expectedIds, true);

if (count($orderedIds) !== count($expectedIds)) {
    qpmSemanticRerankRespond(422, [
        'error' => 'OpenAI returned the wrong number of ids',
        'orderedIds' => $orderedIds,
        'expectedIds' => $expectedIds,
    ]);
}

$seenOrdered = [];
foreach ($orderedIds as $orderedId) {
    if ($orderedId === '' || !isset($expectedLookup[$orderedId]) || isset($seenOrdered[$orderedId])) {
        qpmSemanticRerankRespond(422, [
            'error' => 'OpenAI returned an invalid permutation',
            'orderedIds' => $orderedIds,
            'expectedIds' => $expectedIds,
        ]);
    }
    $seenOrdered[$orderedId] = true;
}

qpmSemanticRerankRespond(200, [
    'orderedIds' => $orderedIds,
    'model' => $openAiRequest['model'],
]);
