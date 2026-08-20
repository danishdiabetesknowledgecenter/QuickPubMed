<?php
/**
 * Simple smoke test for the includeProcessDetails=false/true response
 * schema: muginPublicSearchBuildFinalResponse() must never attach a
 * processDetails field when the flag is off, and must attach the exported
 * collector shape (matching the process-details contract) when it is on.
 *
 * Run: php scripts/include-process-details-response-smoke-test.php
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

$baseRequest = [
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'focus' => '',
    'page' => ['number' => 1, 'size' => 25],
    'sort' => ['method' => 'relevance'],
];

// 1. includeProcessDetails=false -> no processDetails key at all, regardless
// of whether a collector happens to be passed in.
$requestOff = $baseRequest;
$requestOff['responseOptions'] = ['includeProcessDetails' => false];
$collectorButUnused = muginPublicSearchProcessDetailsCreate();
muginPublicSearchProcessDetailsSetStep($collectorButUnused, 'semanticIntent', ['ok' => true]);
$responseOff = muginPublicSearchBuildFinalResponse(
    $requestOff,
    [],
    [],
    0,
    false,
    [],
    'deterministic_hybrid',
    true,
    [],
    $collectorButUnused
);
assertTrue(
    !array_key_exists('processDetails', $responseOff),
    'includeProcessDetails=false never attaches a processDetails field, even with a populated collector'
);

// 2. includeProcessDetails=true with no collector -> still no processDetails
// key (defensive: never emit an empty/malformed block).
$requestOnNoCollector = $baseRequest;
$requestOnNoCollector['responseOptions'] = ['includeProcessDetails' => true];
$responseOnNoCollector = muginPublicSearchBuildFinalResponse(
    $requestOnNoCollector,
    [],
    [],
    0,
    false,
    [],
    'deterministic_hybrid',
    true,
    [],
    null
);
assertTrue(
    !array_key_exists('processDetails', $responseOnNoCollector),
    'includeProcessDetails=true with no active collector still omits processDetails (defensive)'
);

// 3. includeProcessDetails=true with a populated collector -> processDetails
// is attached and matches the exported contract shape (version/sourceQueryDetails/processStepDetails).
$requestOn = $baseRequest;
$requestOn['responseOptions'] = ['includeProcessDetails' => true];
$collector = muginPublicSearchProcessDetailsCreate();
muginPublicSearchProcessDetailsSetStep($collector, 'semanticIntent', ['sources' => ['pubmed']]);
muginPublicSearchProcessDetailsSetSource($collector, ['source' => 'pubmed', 'query' => 'diabetes']);
$responseOn = muginPublicSearchBuildFinalResponse(
    $requestOn,
    [],
    [],
    0,
    false,
    [],
    'deterministic_hybrid',
    true,
    [],
    $collector
);
assertTrue(array_key_exists('processDetails', $responseOn), 'includeProcessDetails=true with a collector attaches processDetails');
assertTrue(
    isset($responseOn['processDetails']['version'], $responseOn['processDetails']['sourceQueryDetails'], $responseOn['processDetails']['processStepDetails']),
    'Attached processDetails matches the exported collector contract shape'
);
assertTrue(
    $responseOn['processDetails']['processStepDetails'][0]['stepId'] === 'semanticIntent',
    'Attached processDetails carries through the recorded step payloads'
);
assertTrue(
    $responseOn['processDetails']['sourceQueryDetails'][0]['source'] === 'pubmed',
    'Attached processDetails carries through the recorded source query details'
);

echo "\nAll includeProcessDetails response-schema smoke tests passed.\n";
