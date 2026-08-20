<?php
/**
 * Security-focused smoke test for the process-details collector: verifies
 * collection is opt-in only, sensitive fields are redacted end-to-end (not
 * just at the top level), and BuildSafeSourceDetail() never leaks raw
 * upstream response bodies beyond its explicit allow-list.
 *
 * Run: php scripts/process-details-security-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-process-details.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

assertTrue(
    (muginPublicSearchGetPublicProgressMessageCopy('semanticSearchProgressSemanticIntent')['dk'] ?? '')
        === 'Fortolker og tilpasser søgningen til de valgte databaser.',
    'Backend SSE uses the combined intent+adaptation progress text'
);
assertTrue(
    (muginPublicSearchGetPublicProgressMessageCopy('semanticSearchProgressSemanticQuery')['dk'] ?? '')
        === 'Fortolker og tilpasser søgningen til de valgte databaser.',
    'Legacy semanticQuery key aliases the combined intent progress text'
);
assertTrue(
    (muginPublicSearchGetPublicProgressMessageCopy('semanticSearchProgressRerankSingle')['dk'] ?? '')
        === 'Rangerer kandidaterne.',
    'Backend SSE has a single-source rerank progress text'
);

// 1. Collection is opt-in: no includeProcessDetails flag -> no collector, no
// forced side effects on unrelated responseOptions.
$request1 = ['responseOptions' => []];
assertTrue(
    muginPublicSearchProcessDetailsWantsCollection($request1) === false,
    'WantsCollection is false when includeProcessDetails is unset'
);
$collector1 = muginPublicSearchProcessDetailsEnsureCollector($request1);
assertTrue($collector1 === null, 'EnsureCollector returns null when includeProcessDetails is unset');
assertTrue(!isset($request1['_processDetails']), 'EnsureCollector does not create a collector when opted out');
assertTrue(
    !isset($request1['responseOptions']['includeResolvedQueries']),
    'EnsureCollector does not force includeResolvedQueries when opted out'
);

// 2. Opting in creates exactly one collector and forces the two internal
// flags the export path needs, without leaking them as a public promise
// beyond this request-local array.
$request2 = ['responseOptions' => ['includeProcessDetails' => true]];
$collector2 = muginPublicSearchProcessDetailsEnsureCollector($request2);
assertTrue(is_array($collector2), 'EnsureCollector returns a collector when includeProcessDetails is true');
assertTrue(
    $request2['responseOptions']['includeResolvedQueries'] === true
        && $request2['responseOptions']['includeDiagnostics'] === true,
    'EnsureCollector forces includeResolvedQueries/includeDiagnostics on when collecting'
);
$collectorAgain = muginPublicSearchProcessDetailsEnsureCollector($request2);
assertTrue(
    $request2['_processDetails'] === $collectorAgain,
    'EnsureCollector reuses the same collector on repeated calls (no duplicate collectors)'
);

// 3. Sanitize redacts sensitive keys at every nesting depth, not only the
// top level, since upstream payloads can nest credentials arbitrarily deep.
$dirty = [
    'apiKey' => 'must-not-leak',
    'nested' => [
        'Authorization' => 'must-not-leak',
        'deeper' => [
            'access_token' => 'must-not-leak',
            'client-secret' => 'must-not-leak',
            'safeField' => 'keep-me',
        ],
    ],
    'headers' => ['X-Api-Key' => 'must-not-leak'],
    'safeTopLevel' => 'keep-me',
];
$clean = muginPublicSearchProcessDetailsSanitize($dirty);
assertTrue($clean['apiKey'] === '[redacted]', 'Top-level apiKey is redacted');
assertTrue($clean['nested']['Authorization'] === '[redacted]', 'Nested Authorization is redacted regardless of case');
assertTrue($clean['nested']['deeper']['access_token'] === '[redacted]', 'Deeply nested access_token is redacted');
assertTrue($clean['nested']['deeper']['client-secret'] === '[redacted]', 'Deeply nested client-secret is redacted');
assertTrue($clean['nested']['deeper']['safeField'] === 'keep-me', 'Non-sensitive nested fields survive sanitization');
assertTrue($clean['headers'] === '[redacted]', 'Whole headers blocks are redacted, not merged field-by-field');
assertTrue($clean['safeTopLevel'] === 'keep-me', 'Non-sensitive top-level fields survive sanitization');

// 4. SetStep/SetSource route every payload through the same sanitizer, so a
// caller can never bypass redaction by writing directly into the collector.
$collector3 = muginPublicSearchProcessDetailsCreate();
muginPublicSearchProcessDetailsSetStep($collector3, 'semanticIntent', ['apiKey' => 'must-not-leak', 'ok' => true]);
$exported3 = muginPublicSearchProcessDetailsExport($collector3);
assertTrue(
    ($exported3['processStepDetails'][0]['payload']['apiKey'] ?? null) === '[redacted]',
    'SetStep sanitizes payloads before storing them'
);
muginPublicSearchProcessDetailsSetSource($collector3, [
    'source' => 'pubmed',
    'query' => 'diabetes',
    'request' => ['authorization' => 'must-not-leak', 'query' => 'diabetes'],
]);
$exported3b = muginPublicSearchProcessDetailsExport($collector3);
assertTrue(
    ($exported3b['sourceQueryDetails'][0]['request']['authorization'] ?? null) === '[redacted]',
    'SetSource sanitizes request payloads before storing them'
);

// 5. BuildSafeSourceDetail only forwards an explicit allow-list from the raw
// source-fetch result, so unexpected upstream response fields (e.g. raw
// bodies, cookies, internal debug data) can never leak into process details.
$rawSourceResult = [
    'candidates' => [['pmid' => '1'], ['pmid' => '2']],
    'total' => 2,
    'partial' => true,
    'warning' => str_repeat('w', 500),
    'error' => '',
    'rateLimit' => ['limit' => 10, 'remaining' => 3, 'reset' => 60, 'retryAfter' => 5, 'secretDebugToken' => 'must-not-leak'],
    'rawUpstreamBody' => 'must-not-leak',
    'debugTrace' => ['must-not-leak'],
];
$safeDetail = muginPublicSearchProcessDetailsBuildSafeSourceDetail(
    'pubmed',
    'diabetes',
    ['query' => 'diabetes'],
    [],
    $rawSourceResult
);
assertTrue($safeDetail['response']['candidateCount'] === 2, 'BuildSafeSourceDetail exposes candidateCount');
assertTrue($safeDetail['response']['totalAvailable'] === 2, 'BuildSafeSourceDetail exposes totalAvailable');
assertTrue($safeDetail['response']['partial'] === true, 'BuildSafeSourceDetail exposes partial flag');
assertTrue(
    strlen($safeDetail['response']['warning']) <= 240,
    'BuildSafeSourceDetail truncates long warning strings'
);
assertTrue(
    !array_key_exists('rawUpstreamBody', $safeDetail['response'])
        && !array_key_exists('debugTrace', $safeDetail['response']),
    'BuildSafeSourceDetail never forwards unlisted raw response fields'
);
assertTrue(
    !array_key_exists('secretDebugToken', $safeDetail['response']['rateLimit'] ?? []),
    'BuildSafeSourceDetail only forwards the allow-listed rateLimit sub-fields'
);

// 6. TruncateIds caps disclosed ids to the given limit and reports the true
// count/truncation flag rather than silently hiding how much was cut.
$manyIds = array_map(static fn($i) => "id-$i", range(1, 25));
$truncated = muginPublicSearchProcessDetailsTruncateIds($manyIds, 10);
assertTrue(count($truncated['ids']) === 10, 'TruncateIds caps the exposed id list to the limit');
assertTrue($truncated['truncated'] === true, 'TruncateIds flags truncation when the input exceeds the limit');
assertTrue($truncated['count'] === 25, 'TruncateIds reports the true total count even when truncated');

// 7. RecordSourceCompletion no-ops the collector write when no collector is
// active, but still safely computes elapsed time / status (used unconditionally by callers).
$nullCollector = null;
$progressCalls = [];
muginPublicSearchProcessDetailsRecordSourceCompletion(
    $nullCollector,
    'pubmed',
    'diabetes',
    ['candidates' => []],
    microtime(true) - 0.05,
    static function ($stepId, $message, $context) use (&$progressCalls): void {
        $progressCalls[] = [$stepId, $context];
    },
    ['stepId' => 'pubmed']
);
assertTrue($nullCollector === null, 'RecordSourceCompletion does not create a collector when none is active');
assertTrue(count($progressCalls) === 1, 'RecordSourceCompletion still emits a progress event with no active collector');
assertTrue(
    isset($progressCalls[0][1]['elapsedMs']) && $progressCalls[0][1]['elapsedMs'] >= 0,
    'RecordSourceCompletion attaches a non-negative elapsedMs to the progress context'
);

// 8. Active collectors stream bounded, sanitized source and step payloads as
// soon as they are recorded, without waiting for the final response.
$streamCollector = muginPublicSearchProcessDetailsCreate();
$streamCalls = [];
$streamCallback = static function ($stepId, $message, $context) use (&$streamCalls): void {
    $streamCalls[] = [$stepId, $context];
};
muginPublicSearchProcessDetailsSetStep($streamCollector, 'rerank', [
    'candidateCount' => 418,
    'apiKey' => 'must-not-leak',
]);
muginPublicSearchProcessDetailsEmitStep($streamCollector, 'rerank', $streamCallback);
assertTrue(
    ($streamCalls[0][1]['detailOnly'] ?? false) === true,
    'Step detail event is marked detailOnly so timing/order is not changed'
);
$streamCalls = [];
muginPublicSearchProcessDetailsEmitStep($streamCollector, 'rerank', $streamCallback, true);
assertTrue(
    ($streamCalls[0][1]['status'] ?? '') === 'completed'
        && ($streamCalls[0][1]['detailOnly'] ?? false) !== true
        && isset($streamCalls[0][1]['processStepDetail']),
    'markCompleted emits terminal status together with the detail payload'
);
assertTrue(
    ($streamCalls[0][1]['processStepDetail']['payload']['candidateCount'] ?? null) === 418,
    'Step detail payload is emitted immediately'
);
assertTrue(
    ($streamCalls[0][1]['processStepDetail']['payload']['apiKey'] ?? null) === '[redacted]',
    'Streamed step detail remains redacted'
);
$streamCalls = [];
muginPublicSearchProcessDetailsEmitCompletedPayload(
    'mesh',
    ['queries' => [['input' => 'diabetes']], 'authorization' => 'must-not-leak'],
    $streamCallback
);
assertTrue(
    ($streamCalls[0][1]['status'] ?? '') === 'completed'
        && ($streamCalls[0][1]['processStepDetail']['stepId'] ?? '') === 'mesh',
    'Direct work-boundary detail completes the matching process step'
);
assertTrue(
    ($streamCalls[0][1]['processStepDetail']['payload']['authorization'] ?? null) === '[redacted]',
    'Direct work-boundary details remain redacted'
);

$streamCalls = [];
muginPublicSearchProcessDetailsRecordSourceCompletion(
    $streamCollector,
    'openAlex',
    'diabetes',
    ['candidates' => [['doi' => '10.1/x']], 'total' => 10],
    microtime(true) - 0.01,
    $streamCallback,
    ['stepId' => 'openAlex'],
    ['limit' => 50, 'filters' => ['language' => ['en']], 'apiKey' => 'must-not-leak'],
    ['searchMode' => 'semantic']
);
assertTrue(
    isset($streamCalls[0][1]['sourceQueryDetail']),
    'Completed source emits sourceQueryDetail immediately'
);
assertTrue(
    ($streamCalls[0][1]['sourceQueryDetail']['request']['limit'] ?? null) === 50,
    'Streamed source detail includes safe request parameters'
);
assertTrue(
    ($streamCalls[0][1]['sourceQueryDetail']['request']['apiKey'] ?? null) === '[redacted]',
    'Streamed source request parameters remain redacted'
);
$ssePayload = muginPublicSearchBuildStreamProgressPayload(
    ['responseOptions' => ['language' => 'da']],
    (string) $streamCalls[0][0],
    '',
    (array) $streamCalls[0][1]
);
assertTrue(
    isset($ssePayload['sourceQueryDetail'])
        && ($ssePayload['status'] ?? '') === 'completed'
        && isset($ssePayload['elapsedMs']),
    'SSE progress payload preserves live source detail, status and timing'
);
assertTrue(
    ($ssePayload['sourceQueryDetail']['request']['apiKey'] ?? null) === '[redacted]',
    'SSE serialization preserves source-detail redaction'
);

echo "\nAll process-details security smoke tests passed.\n";
