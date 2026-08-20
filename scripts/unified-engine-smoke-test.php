<?php
/**
 * End-to-end smoke test for muginPublicSearchRerankSemanticCandidatesUnified()
 * (Phase 5 wiring): exercises the full merge -> enrich -> classify -> score ->
 * post-validate pipeline through the actual public-search-lib.php entry point,
 * not just the isolated semantic-quality-lib.php functions already covered by
 * scripts/rerank-parity-harness.php.
 *
 * Run: php scripts/unified-engine-smoke-test.php
 */

// Minimal stand-in for config.php so public-search-lib.php's defined()-guarded
// config reads resolve to safe defaults without requiring a real install.
if (!defined('MUGIN_RERANK_CONFIG')) {
    define('MUGIN_RERANK_CONFIG', [
        'sourceWeights' => ['pubmed' => 1.0, 'semanticScholar' => 0.92, 'openAlex' => 0.88, 'elicit' => 0.9],
        'pmidBonus' => 10,
        'rrfK' => 60,
        'rankScale' => 100,
        'scoreScale' => 20,
        'fallbackSourceWeight' => 0.8,
        'overlapBonusPerExtraSource' => 35,
        'retractionAction' => 'filter',
        'pubTypeTiers' => ['excluded' => 0],
    ]);
}
if (!defined('MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED')) {
    define('MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED', true);
}
require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';

// Load only the specific functions under test by extracting them from
// public-search-lib.php would require the whole file (which itself is safe to
// require in isolation: every top-level statement in it is inside an
// if (!function_exists()) guard or a require_once, see file header).
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

// Case 1: no PMIDs/authorIds/journalIds at all -> muginPublicSearchFetchUnifiedEnrichmentSignals
// must short-circuit with zero HTTP calls (network-independent branch).
$sourceResultsNoEnrichmentTargets = [
    [
        'source' => 'elicit',
        'candidates' => [
            ['source' => 'elicit', 'rank' => 1, 'doi' => '10.1/smoke-a', 'title' => 'Smoke test candidate A'],
            ['source' => 'elicit', 'rank' => 2, 'doi' => '10.1/smoke-b', 'title' => 'Smoke test candidate B'],
        ],
    ],
];
$result1 = muginPublicSearchRerankSemanticCandidatesUnified($sourceResultsNoEnrichmentTargets, '', '');
assertTrue(is_array($result1['candidates']), 'Unified engine returns a candidates array (no-enrichment-target case)');
assertTrue(count($result1['candidates']) === 2, 'Unified engine returns both candidates (no-enrichment-target case)');
assertTrue(($result1['diagnostics']['engine'] ?? '') === 'unified', 'Diagnostics correctly tag engine=unified');
assertTrue(
    array_key_exists('source', $result1['candidates'][0]) && array_key_exists('metadata', $result1['candidates'][0]),
    'Legacy-shape adapter added source/metadata keys for downstream compatibility'
);

// Case 2: titleless + excluded-tier candidates must still be filtered exactly
// like the isolated harness proved, end-to-end through the real entry point.
$sourceResultsWithExclusions = [
    [
        'source' => 'pubmed',
        'candidates' => [
            ['source' => 'pubmed', 'rank' => 1, 'pmid' => '9000001', 'title' => ''],
            ['source' => 'pubmed', 'rank' => 2, 'pmid' => '9000002', 'title' => 'Erratum: correction notice', 'metadata' => ['publicationTypes' => ['Erratum']]],
            ['source' => 'pubmed', 'rank' => 3, 'pmid' => '9000003', 'title' => 'A valid research article'],
        ],
    ],
];
$result2 = muginPublicSearchRerankSemanticCandidatesUnified($sourceResultsWithExclusions, '', '');
assertTrue(count($result2['candidates']) === 1, 'Titleless + excluded-tier candidates dropped end-to-end, only 1 of 3 survives');
assertTrue($result2['candidates'][0]['pmid'] === '9000003', 'The surviving candidate is the valid research article');

// Case 3: DOI-only post-validation rule filtering (Phase 4 hook), PMID candidates exempt.
if (!defined('MUGIN_SEMANTIC_POST_VALIDATION_RULES')) {
    define('MUGIN_SEMANTIC_POST_VALIDATION_RULES', [
        'activeRules' => [
            ['id' => 'must-mention-guideline', 'requireAnyTextSignals' => ['guideline']],
        ],
    ]);
}
$sourceResultsForPostValidation = [
    [
        'source' => 'openAlex',
        'candidates' => [
            ['source' => 'openAlex', 'rank' => 1, 'doi' => '10.1/matches-rule', 'title' => 'A clinical guideline for X'],
            ['source' => 'openAlex', 'rank' => 2, 'doi' => '10.1/fails-rule', 'title' => 'Unrelated topic entirely'],
            ['source' => 'pubmed', 'rank' => 1, 'pmid' => '9100001', 'title' => 'PMID candidate exempt from DOI-only rules'],
        ],
    ],
];
$result3 = muginPublicSearchRerankSemanticCandidatesUnified($sourceResultsForPostValidation, '', '');
$survivingDois = array_column($result3['candidates'], 'doi');
$survivingPmids = array_column($result3['candidates'], 'pmid');
assertTrue(in_array('10.1/matches-rule', $survivingDois, true), 'DOI-only candidate matching post-validation rule survives');
assertTrue(!in_array('10.1/fails-rule', $survivingDois, true), 'DOI-only candidate failing post-validation rule is dropped');
assertTrue(in_array('9100001', $survivingPmids, true), 'PMID-backed candidate is exempt from DOI-only post-validation and survives regardless');

echo "\nAll unified-engine smoke tests passed.\n";
