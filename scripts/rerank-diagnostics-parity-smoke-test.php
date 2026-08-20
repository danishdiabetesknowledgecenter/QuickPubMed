<?php
/**
 * Verifies the public PHP rerank diagnostics shape against legacy JS fields.
 */

require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';

function assertTrue(bool $condition, string $message): void
{
    echo ($condition ? 'PASS' : 'FAIL') . ': ' . $message . PHP_EOL;
    if (!$condition) {
        exit(1);
    }
}

$sourceResults = [
    [
        'source' => 'pubmed',
        'query' => 'diabetes',
        'total' => 2,
        'pmids' => ['1', '2'],
        'dois' => [],
        'candidates' => [
            ['source' => 'pubmed', 'rank' => 1, 'pmid' => '1', 'title' => 'Shared paper'],
            ['source' => 'pubmed', 'rank' => 2, 'pmid' => '2', 'title' => 'PubMed paper'],
        ],
    ],
    [
        'source' => 'openAlex',
        'query' => 'diabetes',
        'total' => 2,
        'pmids' => ['1'],
        'dois' => ['10.1/shared', '10.1/oa'],
        'candidates' => [
            [
                'source' => 'openAlex',
                'rank' => 1,
                'pmid' => '1',
                'doi' => '10.1/shared',
                'openAlexId' => 'https://openalex.org/W1',
                'title' => 'Shared paper',
                'metadata' => ['publicationYear' => '2025', 'sourceType' => 'journal'],
            ],
            [
                'source' => 'openAlex',
                'rank' => 2,
                'doi' => '10.1/oa',
                'openAlexId' => 'https://openalex.org/W2',
                'title' => 'OpenAlex paper',
                'metadata' => ['publicationYear' => '2024', 'sourceType' => 'journal'],
            ],
        ],
    ],
];

$result = muginSemanticQualityRerankCandidates($sourceResults);
$diagnostics = $result['diagnostics'];

assertTrue(
    array_keys($diagnostics['sourceSummary'][0]) === [
        'source', 'query', 'total', 'candidateCount', 'pmidCount', 'doiCount', 'hasError', 'usedInRerank',
    ],
    'sourceSummary matches the legacy public field order'
);
assertTrue(($diagnostics['overlapSummary']['multiSource'] ?? 0) === 1, 'Overlap counts shared candidates');
assertTrue(isset($diagnostics['overlapSummary']['pairwiseOverlap']['openAlex-pubmed']), 'Pairwise overlap is exported');
assertTrue(isset($diagnostics['enrichmentSummary']['withRecencySignal']), 'Full enrichment counters are exported');
assertTrue(isset($diagnostics['enrichmentSummary']['byPubTypeTier']), 'Publication tier summary is exported');
assertTrue(count($diagnostics['topCandidates']) <= 10, 'Top candidates remain bounded to 10');
assertTrue(
    isset($diagnostics['topCandidates'][0]['key'], $diagnostics['topCandidates'][0]['sourceCount']),
    'Top candidate summary matches legacy identity/source fields'
);

echo PHP_EOL . 'All rerank diagnostics parity smoke tests passed.' . PHP_EOL;
