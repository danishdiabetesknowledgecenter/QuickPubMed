<?php
/**
 * Contract smoke test for the canonical SearchForm/API process-details shape.
 */

require_once __DIR__ . '/../backend/app/public-search-process-details.php';

function muginProcessDetailsAssert(bool $condition, string $label): void
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

muginProcessDetailsAssert(is_array($schema), 'Process-details JSON Schema parses');
muginProcessDetailsAssert(is_array($fixture), 'Legacy contract fixture parses');
muginProcessDetailsAssert(($fixture['version'] ?? '') === '1', 'Fixture uses contract version 1');

$expectedSteps = muginPublicSearchProcessDetailStepIds();
$schemaSteps = (array) ($schema['$defs']['stepId']['enum'] ?? []);
muginProcessDetailsAssert(count($expectedSteps) === 13, 'All 13 known process step ids are registered');
muginProcessDetailsAssert(
    !in_array('semanticQuery', $expectedSteps, true),
    'Canonical PHP step ids fold semanticQuery into semanticIntent'
);
muginProcessDetailsAssert(
    in_array('semanticQuery', $schemaSteps, true),
    'JSON Schema keeps semanticQuery as a legacy step id'
);
foreach ($expectedSteps as $stepId) {
    muginProcessDetailsAssert(
        in_array($stepId, $schemaSteps, true),
        'Schema enum includes canonical step id ' . $stepId
    );
}

$sourceDetails = (array) ($fixture['sourceQueryDetails'] ?? []);
$fixtureSources = array_map(static fn($entry) => (string) ($entry['source'] ?? ''), $sourceDetails);
sort($fixtureSources);
$expectedSources = muginPublicSearchProcessDetailSourceIds();
sort($expectedSources);
muginProcessDetailsAssert(
    $fixtureSources === $expectedSources,
    'Golden fixture covers all four source detail channels'
);
foreach ($sourceDetails as $detail) {
    muginProcessDetailsAssert(
        isset($detail['source'], $detail['query'], $detail['request'], $detail['requestMeta'], $detail['response'], $detail['context']),
        'Each source detail contains the complete renderer contract'
    );
}

$processDetails = (array) ($fixture['processStepDetails'] ?? []);
$fixtureStepIds = array_map(static fn($entry) => (string) ($entry['stepId'] ?? ''), $processDetails);
muginProcessDetailsAssert(
    count($fixtureStepIds) === count(array_unique($fixtureStepIds)),
    'Golden fixture has at most one payload per process step'
);
muginProcessDetailsAssert(
    count(array_intersect($fixtureStepIds, muginPublicSearchProcessDetailSourceIds())) === 0,
    'Source steps remain in sourceQueryDetails rather than processStepDetails'
);
foreach ($processDetails as $detail) {
    muginProcessDetailsAssert(
        isset($detail['stepId'], $detail['payload'], $detail['context'])
            && is_array($detail['payload']),
        'Each process detail contains stepId, payload and context'
    );
}

$coveredStepIds = array_values(array_unique(array_merge(
    array_map(
        static fn($stepId) => muginPublicSearchProcessDetailsFoldStepId((string) $stepId),
        $fixtureStepIds
    ),
    $fixtureSources
)));
sort($coveredStepIds);
$sortedExpectedSteps = $expectedSteps;
sort($sortedExpectedSteps);
muginProcessDetailsAssert(
    $coveredStepIds === $sortedExpectedSteps,
    'Golden fixture covers every known step across both detail channels'
);

$foldCollector = muginPublicSearchProcessDetailsCreate();
muginPublicSearchProcessDetailsSetStep($foldCollector, 'semanticQuery', [
    'coreQuery' => 'diabetes',
    'sourceQueries' => ['pubmed' => 'diabetes[tiab]'],
]);
$foldExported = muginPublicSearchProcessDetailsExport($foldCollector);
muginProcessDetailsAssert(
    count($foldExported['processStepDetails']) === 1
        && ($foldExported['processStepDetails'][0]['stepId'] ?? '') === 'semanticIntent',
    'Collector folds legacy semanticQuery into semanticIntent'
);
muginProcessDetailsAssert(
    ($foldExported['processStepDetails'][0]['payload']['coreQuery'] ?? '') === 'diabetes',
    'Folded semanticQuery payload is preserved on semanticIntent'
);

$collector = muginPublicSearchProcessDetailsCreate();
muginPublicSearchProcessDetailsSetStep($collector, 'rerank', [
    'candidateCount' => 10,
    'apiKey' => 'must-not-leak',
]);
muginPublicSearchProcessDetailsMergeStep($collector, 'rerank', [
    'pmidCandidateCount' => 6,
]);
muginPublicSearchProcessDetailsSetSource($collector, [
    'source' => 'pubmed',
    'query' => 'test query',
    'request' => [
        'query' => 'test query',
        'authorization' => 'must-not-leak',
    ],
    'response' => ['candidateCount' => 6],
]);
muginPublicSearchProcessDetailsSetSource($collector, [
    'source' => 'pubmed',
    'query' => 'test query',
    'requestMeta' => ['role' => 'pubmedBestMatchSource'],
]);
$exported = muginPublicSearchProcessDetailsExport($collector);

muginProcessDetailsAssert(
    count($exported['processStepDetails']) === 1,
    'Collector merges duplicate step payloads instead of emitting duplicate blocks'
);
muginProcessDetailsAssert(
    ($exported['processStepDetails'][0]['payload']['candidateCount'] ?? null) === 10
        && ($exported['processStepDetails'][0]['payload']['pmidCandidateCount'] ?? null) === 6,
    'Collector preserves existing fields during top-level merge'
);
muginProcessDetailsAssert(
    ($exported['processStepDetails'][0]['payload']['apiKey'] ?? null) === '[redacted]',
    'Collector redacts API keys'
);
muginProcessDetailsAssert(
    count($exported['sourceQueryDetails']) === 1,
    'Collector merges duplicate source/query entries'
);
muginProcessDetailsAssert(
    ($exported['sourceQueryDetails'][0]['request']['authorization'] ?? null) === '[redacted]',
    'Collector redacts authorization values'
);
muginProcessDetailsAssert(
    ($exported['sourceQueryDetails'][0]['requestMeta']['role'] ?? '') === 'pubmedBestMatchSource',
    'Collector retains safe source request metadata'
);

echo PHP_EOL . 'All process-details contract smoke tests passed.' . PHP_EOL;
