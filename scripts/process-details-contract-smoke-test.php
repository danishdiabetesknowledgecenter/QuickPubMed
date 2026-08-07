<?php
/**
 * Contract smoke test for the canonical SearchForm/API process-details shape.
 */

require_once __DIR__ . '/../backend/app/public-search-process-details.php';

function qpmProcessDetailsAssert(bool $condition, string $label): void
{
    echo ($condition ? 'PASS' : 'FAIL') . ': ' . $label . PHP_EOL;
    if (!$condition) {
        exit(1);
    }
}

$schemaPath = __DIR__ . '/../backend/docs/public-search-process-details.schema.json';
$fixturePath = __DIR__ . '/fixtures/process-details-legacy-contract.json';
$schema = json_decode((string) file_get_contents($schemaPath), true);
$fixture = json_decode((string) file_get_contents($fixturePath), true);

qpmProcessDetailsAssert(is_array($schema), 'Process-details JSON Schema parses');
qpmProcessDetailsAssert(is_array($fixture), 'Legacy contract fixture parses');
qpmProcessDetailsAssert(($fixture['version'] ?? '') === '1', 'Fixture uses contract version 1');

$expectedSteps = qpmPublicSearchProcessDetailStepIds();
$schemaSteps = (array) ($schema['$defs']['stepId']['enum'] ?? []);
qpmProcessDetailsAssert(
    $schemaSteps === $expectedSteps,
    'PHP step order and JSON Schema step enum are identical'
);
qpmProcessDetailsAssert(count($expectedSteps) === 20, 'All 20 known process step ids are registered');

$sourceDetails = (array) ($fixture['sourceQueryDetails'] ?? []);
$fixtureSources = array_map(static fn($entry) => (string) ($entry['source'] ?? ''), $sourceDetails);
sort($fixtureSources);
$expectedSources = qpmPublicSearchProcessDetailSourceIds();
sort($expectedSources);
qpmProcessDetailsAssert(
    $fixtureSources === $expectedSources,
    'Golden fixture covers all four source detail channels'
);
foreach ($sourceDetails as $detail) {
    qpmProcessDetailsAssert(
        isset($detail['source'], $detail['query'], $detail['request'], $detail['requestMeta'], $detail['response'], $detail['context']),
        'Each source detail contains the complete renderer contract'
    );
}

$processDetails = (array) ($fixture['processStepDetails'] ?? []);
$fixtureStepIds = array_map(static fn($entry) => (string) ($entry['stepId'] ?? ''), $processDetails);
qpmProcessDetailsAssert(
    count($fixtureStepIds) === count(array_unique($fixtureStepIds)),
    'Golden fixture has at most one payload per process step'
);
qpmProcessDetailsAssert(
    count(array_intersect($fixtureStepIds, qpmPublicSearchProcessDetailSourceIds())) === 0,
    'Source steps remain in sourceQueryDetails rather than processStepDetails'
);
foreach ($processDetails as $detail) {
    qpmProcessDetailsAssert(
        isset($detail['stepId'], $detail['payload'], $detail['context'])
            && is_array($detail['payload']),
        'Each process detail contains stepId, payload and context'
    );
}

$coveredStepIds = array_values(array_unique(array_merge($fixtureStepIds, $fixtureSources)));
sort($coveredStepIds);
$sortedExpectedSteps = $expectedSteps;
sort($sortedExpectedSteps);
qpmProcessDetailsAssert(
    $coveredStepIds === $sortedExpectedSteps,
    'Golden fixture covers every known step across both detail channels'
);

$collector = qpmPublicSearchProcessDetailsCreate();
qpmPublicSearchProcessDetailsSetStep($collector, 'finalizeCollect', [
    'candidateCount' => 10,
    'apiKey' => 'must-not-leak',
]);
qpmPublicSearchProcessDetailsMergeStep($collector, 'finalizeCollect', [
    'pmidCandidateCount' => 6,
]);
qpmPublicSearchProcessDetailsSetSource($collector, [
    'source' => 'pubmed',
    'query' => 'test query',
    'request' => [
        'query' => 'test query',
        'authorization' => 'must-not-leak',
    ],
    'response' => ['candidateCount' => 6],
]);
qpmPublicSearchProcessDetailsSetSource($collector, [
    'source' => 'pubmed',
    'query' => 'test query',
    'requestMeta' => ['role' => 'pubmedBestMatchSource'],
]);
$exported = qpmPublicSearchProcessDetailsExport($collector);

qpmProcessDetailsAssert(
    count($exported['processStepDetails']) === 1,
    'Collector merges duplicate step payloads instead of emitting duplicate blocks'
);
qpmProcessDetailsAssert(
    ($exported['processStepDetails'][0]['payload']['candidateCount'] ?? null) === 10
        && ($exported['processStepDetails'][0]['payload']['pmidCandidateCount'] ?? null) === 6,
    'Collector preserves existing fields during top-level merge'
);
qpmProcessDetailsAssert(
    ($exported['processStepDetails'][0]['payload']['apiKey'] ?? null) === '[redacted]',
    'Collector redacts API keys'
);
qpmProcessDetailsAssert(
    count($exported['sourceQueryDetails']) === 1,
    'Collector merges duplicate source/query entries'
);
qpmProcessDetailsAssert(
    ($exported['sourceQueryDetails'][0]['request']['authorization'] ?? null) === '[redacted]',
    'Collector redacts authorization values'
);
qpmProcessDetailsAssert(
    ($exported['sourceQueryDetails'][0]['requestMeta']['role'] ?? '') === 'pubmedBestMatchSource',
    'Collector retains safe source request metadata'
);

echo PHP_EOL . 'All process-details contract smoke tests passed.' . PHP_EOL;
