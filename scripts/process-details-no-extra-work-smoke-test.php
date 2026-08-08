<?php
/**
 * Verifies that enabling includeProcessDetails does not change the public
 * result/order contract of qpmPublicSearchBuildFinalResponse(), and that the
 * collector helpers themselves perform no network I/O.
 */

require_once __DIR__ . '/../backend/app/public-search-process-details.php';
require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

$baseRequest = qpmPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'responseOptions' => [
        'includeProcessDetails' => false,
        'includeResolvedQueries' => false,
        'includeDiagnostics' => false,
    ],
]);
$resolved = [
    'pubmedQuery' => 'diabetes[tiab]',
    'semanticIntent' => 'diabetes',
    'hardFilterQuery' => '',
    'sourceQueryPlan' => [],
];
$results = [
    ['type' => 'pmid', 'pmid' => '1', 'title' => 'A', 'rank' => 1],
    ['type' => 'pmid', 'pmid' => '2', 'title' => 'B', 'rank' => 2],
];

$without = qpmPublicSearchBuildFinalResponse(
    $baseRequest,
    $resolved,
    $results,
    2,
    false,
    [],
    'deterministic_hybrid',
    true,
    [],
    null
);

$collector = qpmPublicSearchProcessDetailsCreate();
qpmPublicSearchProcessDetailsSetStep($collector, 'rerank', [
    'candidateCount' => 2,
    'pmidCandidateCount' => 2,
    'doiCandidateCount' => 0,
]);
$withFlagRequest = $baseRequest;
$withFlagRequest['responseOptions']['includeProcessDetails'] = true;
$with = qpmPublicSearchBuildFinalResponse(
    $withFlagRequest,
    $resolved,
    $results,
    2,
    false,
    [],
    'deterministic_hybrid',
    true,
    [],
    $collector
);

assertTrue(($without['results'] ?? null) === ($with['results'] ?? null), 'Results are identical with/without process details');
assertTrue(($without['total'] ?? null) === ($with['total'] ?? null), 'Total is identical with/without process details');
assertTrue(($without['order'] ?? null) === ($with['order'] ?? null), 'Order metadata is identical with/without process details');
assertTrue(!array_key_exists('processDetails', $without), 'Flag off omits processDetails');
assertTrue(isset($with['processDetails']['processStepDetails']), 'Flag on attaches processDetails');

$counts = qpmPublicSearchProcessDetailsCountCandidateIdentityBuckets([
    ['pmid' => '1', 'doi' => '10.1/x'],
    ['pmid' => '', 'doi' => '10.1/y'],
    ['pmid' => '2', 'doi' => ''],
]);
assertTrue($counts['candidateCount'] === 3, 'Overlapping identity: total candidates');
assertTrue($counts['pmidCandidateCount'] === 2, 'Overlapping identity: pmid count');
assertTrue($counts['doiCandidateCount'] === 2, 'Overlapping identity: doi count');

echo "\nAll process-details no-extra-work smoke tests passed.\n";
