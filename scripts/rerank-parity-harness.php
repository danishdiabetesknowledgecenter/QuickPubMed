<?php
/**
 * Phase 3 parity harness: runs every fixture scenario in
 * scripts/fixtures/rerank-parity-fixtures.json through the PHP port
 * (muginSemanticQualityRerankCandidates) and prints JSON to stdout in the same
 * shape as scripts/capture-js-baseline.js, so scripts/compare-rerank-parity.js
 * can diff them directly.
 *
 * Run: php scripts/rerank-parity-harness.php
 */

require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';

// Must be IDENTICAL to testRerankConfig in scripts/capture-js-baseline.js.
$testRerankConfig = [
    'sourceWeights' => ['pubmed' => 1.0, 'semanticScholar' => 0.92, 'openAlex' => 0.88, 'elicit' => 0.9],
    'pmidBonus' => 10,
    'rankScale' => 100,
    'scoreScale' => 20,
    'fallbackSourceWeight' => 0.8,
    'overlapBonusPerExtraSource' => 35,
    'rrfK' => 60,
    'pubTypeWeights' => [],
    'recencyHalfLifeYears' => 8,
    'recencyBonusMax' => 15,
    'oaBonus' => 5,
    'citationImpactClamp' => [0.8, 1.3],
    'citationImpactSignalWeights' => [
        'rcr' => 0.5,
        'fwci' => 0.5,
        'nihPercentile' => 0.3,
        'fieldNormalizedCitationRatio' => 0.3,
        'influentialCitationCount' => 0.15,
        'citedByCount' => 0.08,
    ],
    'retractionAction' => 'filter',
    'retractionPenalty' => 1.0,
    'clinicalBonus' => 10,
    'clinicalCitedByThreshold' => 1000,
    'topicOverlapBonus' => 20,
    'authorityClamp' => [0.95, 1.1],
    'dataQualityPenalties' => [
        'missingAbstract' => 0.9,
        'shortAbstract' => 0.95,
        'veryShortAbstract' => 0.98,
        'missingAuthor' => 0.95,
        'missingYear' => 0.95,
    ],
    'abstractMinLength' => ['short' => 100, 'veryShort' => 250],
    'pubTypeTiers' => [
        'guideline_verified' => 40,
        'guideline_candidate' => 30,
        'systematic_review_or_meta' => 35,
        'randomized_controlled_trial' => 25,
        'review' => 12,
        'clinical_trial' => 15,
        'research_article' => 0,
        'excluded' => 0,
    ],
    'guidelinePublisherAllowList' => [
        ['name' => 'World Health Organization', 'aliases' => ['who']],
    ],
];

$fixturesPath = __DIR__ . '/fixtures/rerank-parity-fixtures.json';
$fixtures = json_decode((string) file_get_contents($fixturesPath), true);
if (!is_array($fixtures) || !isset($fixtures['scenarios'])) {
    fwrite(STDERR, "Could not read fixtures from $fixturesPath\n");
    exit(1);
}

$results = [];
foreach ($fixtures['scenarios'] as $scenario) {
    $sourceResults = (array) ($scenario['sourceResults'] ?? []);
    $rerankResult = muginSemanticQualityRerankCandidates($sourceResults, $testRerankConfig, []);

    $order = [];
    foreach ($rerankResult['candidates'] as $candidate) {
        $order[] = [
            'pmid' => $candidate['pmid'] ?? '',
            'doi' => $candidate['doi'] ?? '',
            'title' => $candidate['title'] ?? '',
            'combinedScore' => $candidate['combinedScore'] ?? 0,
            'bestRank' => is_infinite($candidate['bestRank']) ? null : $candidate['bestRank'],
            'sourceCount' => $candidate['sourceCount'] ?? 0,
            'pubTypeTier' => $candidate['pubTypeClassification']['tier'] ?? '',
            'pubTypeConfidence' => $candidate['pubTypeClassification']['confidence'] ?? '',
        ];
    }

    $results[$scenario['id']] = [
        'description' => $scenario['description'] ?? '',
        'order' => $order,
        'filteredCount' => count($rerankResult['filteredCandidates']),
        'rerankMode' => $rerankResult['rerankMode'],
    ];
}

$output = json_encode(['generatedAt' => gmdate('c'), 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// Written directly with file_put_contents (not `php ... > file`) because
// PowerShell's `>` redirection encodes output as UTF-16LE, which breaks JSON
// parsers expecting UTF-8.
$outputPath = __DIR__ . '/fixtures/rerank-parity-baseline-php.json';
if (in_array('--stdout', $argv, true)) {
    echo $output;
} else {
    file_put_contents($outputPath, $output);
    fwrite(STDERR, "PHP baseline written to $outputPath\n");
}
