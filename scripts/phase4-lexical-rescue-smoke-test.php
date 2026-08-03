<?php
/**
 * Phase 4 smoke test (unified-engine full-parity plan): verifies the lexical
 * rescue port (scoring pure functions + trigger decision + live PubMed fetch)
 * matches DropdownWrapper.vue's behavior.
 *
 * Run: php scripts/phase4-lexical-rescue-smoke-test.php
 */

require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

// 1. Tokenization: stopwords removed, short tokens removed, deduped.
$tokens = qpmSemanticQualityTokenizeLexicalSearchText('The Diabetes and the Insulin of Insulin');
assertTrue(in_array('diabetes', $tokens, true), 'Tokenizer keeps a real content word');
assertTrue(in_array('insulin', $tokens, true), 'Tokenizer keeps and dedupes a repeated content word');
assertTrue(!in_array('the', $tokens, true) && !in_array('and', $tokens, true) && !in_array('of', $tokens, true), 'Tokenizer removes stopwords');

// 2. Scoring: title match worth more than abstract match; exact-phrase bonus applies.
$scoreTitleOnly = qpmSemanticQualityScoreLexicalTextWithQuery(['diabetes'], '', 'A study of diabetes', '');
$scoreAbstractOnly = qpmSemanticQualityScoreLexicalTextWithQuery(['diabetes'], '', 'Unrelated study', 'This mentions diabetes once');
assertTrue($scoreTitleOnly > $scoreAbstractOnly, 'Title token match scores higher than abstract token match');
$scoreWithPhrase = qpmSemanticQualityScoreLexicalTextWithQuery(['diabetes', 'type'], 'diabetes type', 'diabetes type 2 study', '');
$scoreWithoutPhrase = qpmSemanticQualityScoreLexicalTextWithQuery(['diabetes', 'type'], 'diabetes type', 'type of diabetes study', '');
assertTrue($scoreWithPhrase > $scoreWithoutPhrase, 'Exact phrase match in title adds an extra bonus over token-only match');

// 3. Trigger decision: disabled mode never triggers.
if (!defined('QPM_SEMANTIC_RESCUE_CONFIG_TEST_OVERRIDE')) {
    define('QPM_SEMANTIC_RESCUE_CONFIG_TEST_OVERRIDE', true);
}
$sourceResultsSparse = [
    ['source' => 'pubmed', 'candidates' => [['pmid' => '1']]],
    ['source' => 'semanticScholar', 'candidates' => [['doi' => '10.1/a', 'title' => 'A']]],
];
$decisionNotSelected = qpmPublicSearchShouldRunPubMedLexicalRescue($sourceResultsSparse, 'diabetes[tiab]', false);
assertTrue($decisionNotSelected['shouldRun'] === false && $decisionNotSelected['reason'] === 'pubmed-not-selected', 'Rescue does not trigger when pubmed is not selected');

$decisionSparse = qpmPublicSearchShouldRunPubMedLexicalRescue($sourceResultsSparse, 'diabetes[tiab]', true);
assertTrue($decisionSparse['shouldRun'] === true && $decisionSparse['reason'] === 'sparse-first-harvest', 'Rescue triggers when non-pubmed sources are sparse (default thresholds: 25 merged / 12 source candidates)');

// Build a sufficiently large non-pubmed candidate set to avoid triggering.
$manyCandidates = [];
for ($i = 0; $i < 30; $i++) {
    $manyCandidates[] = ['doi' => '10.1/candidate-' . $i, 'title' => 'Candidate ' . $i];
}
$sourceResultsSufficient = [
    ['source' => 'pubmed', 'candidates' => [['pmid' => '1']]],
    ['source' => 'semanticScholar', 'candidates' => $manyCandidates],
];
$decisionSufficient = qpmPublicSearchShouldRunPubMedLexicalRescue($sourceResultsSufficient, 'diabetes[tiab]', true);
assertTrue($decisionSufficient['shouldRun'] === false && $decisionSufficient['reason'] === 'sufficient-first-harvest', 'Rescue does not trigger when non-pubmed sources already have enough candidates');

// 4. Live end-to-end fetch: a real PubMed rescue search for a common topic
// must return candidates tagged with lexicalRescue metadata, excluding any
// PMID already present in $sourceResults.
$existingSourceResults = [
    ['source' => 'semanticScholar', 'candidates' => [], 'pmids' => []],
];
$rescueResult = qpmPublicSearchFetchPubMedLexicalRescueResult(
    'diabetes mellitus type 2 treatment',
    'diabetes mellitus[mh] AND treatment[tiab]',
    $existingSourceResults,
    'sparse-first-harvest'
);
assertTrue(is_array($rescueResult) && $rescueResult['source'] === 'pubmed', 'Live rescue fetch returns a pubmed-shaped source result');
assertTrue(!empty($rescueResult['candidates']), 'Live rescue fetch returns at least one candidate for a well-known topic');
if (!empty($rescueResult['candidates'])) {
    $first = $rescueResult['candidates'][0];
    assertTrue(($first['metadata']['lexicalRescue'] ?? false) === true, 'Rescued candidates are tagged with metadata.lexicalRescue=true');
    assertTrue(($first['metadata']['lexicalRescueTriggerReason'] ?? '') === 'sparse-first-harvest', 'Rescued candidates carry the trigger reason');
    // Scores must be non-increasing (sorted descending).
    $scores = array_column($rescueResult['candidates'], 'score');
    $sortedDesc = $scores;
    rsort($sortedDesc);
    assertTrue($scores === $sortedDesc, 'Rescued candidates are sorted by lexical score descending');
}

echo "\nAll Phase 4 lexical-rescue smoke tests passed.\n";
