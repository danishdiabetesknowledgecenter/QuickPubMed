<?php
/**
 * Phase 6 fix verification #2: confirms muginPublicSearchBuildPubMedTranslationPromptInput()
 * matches buildPubMedTranslationPromptInput() in DropdownWrapper.vue - plain
 * text when no semantic-intent context exists, JSON-wrapped with
 * structuredAiIntent when it does.
 *
 * Run: php scripts/phase6-pubmed-context-wiring-smoke-test.php
 */

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

// 1. No semantic intent at all -> plain text passthrough (matches JS's hasStructuredContext=false short-circuit).
$plain = muginPublicSearchBuildPubMedTranslationPromptInput('diabetes treatment', null, []);
assertTrue($plain === 'diabetes treatment', 'No semantic intent -> plain text passthrough, no JSON wrapper');

// 2. Semantic intent present -> JSON-wrapped with originalQuery + structuredAiIntent.
$semanticIntent = [
    'semanticIntent' => 'diabetes mellitus type 2 treatment',
    'softFilterHints' => ['insulin', 'metformin'],
    'meta' => [
        'detectedConcepts' => ['diabetes', 'type 2 diabetes'],
        'intentType' => 'treatment',
        'conceptCoverage' => ['originalConcepts' => ['diabetes'], 'translatedConcepts' => [], 'droppedConcepts' => [], 'severityOfDrop' => 'none'],
        'potentialIssues' => [],
    ],
    'sourceQueryPlan' => ['coreQuery' => 'diabetes type 2 treatment'],
];
$withIntent = muginPublicSearchBuildPubMedTranslationPromptInput('diabetes behandling', $semanticIntent, []);
$decoded = json_decode($withIntent, true);
assertTrue(is_array($decoded), 'With semantic intent -> valid JSON is produced');
assertTrue($decoded['originalQuery'] === 'diabetes behandling', 'JSON payload preserves the original (untranslated) query verbatim');
assertTrue($decoded['structuredAiIntent']['semanticIntent'] === 'diabetes mellitus type 2 treatment', 'structuredAiIntent.semanticIntent is populated from the semantic-intent result');
assertTrue(in_array('diabetes', $decoded['structuredAiIntent']['detectedConcepts'], true), 'structuredAiIntent.detectedConcepts is populated from meta.detectedConcepts');
assertTrue(in_array('insulin', $decoded['structuredAiIntent']['softFilterHints'], true), 'structuredAiIntent.softFilterHints is populated');
assertTrue($decoded['structuredAiIntent']['coreQuery'] === 'diabetes type 2 treatment', 'structuredAiIntent.coreQuery falls back to sourceQueryPlan.coreQuery');
assertTrue(
    !array_key_exists('potentialIssues', $decoded['structuredAiIntent']),
    'structuredAiIntent does not forward potentialIssues to the PubMed translator'
);

$withIssues = $semanticIntent;
$withIssues['meta']['potentialIssues'] = ['Input is not a scientific query'];
$decodedIssues = json_decode(
    muginPublicSearchBuildPubMedTranslationPromptInput('findes julemanden?', $withIssues, []),
    true
);
assertTrue(
    is_array($decodedIssues) && !array_key_exists('potentialIssues', $decodedIssues['structuredAiIntent'] ?? []),
    'potentialIssues in semantic-intent meta stay out of the PubMed JSON input'
);

// 3. hardFilters passed through as canonicalHardFilters when present.
$withHardFilters = muginPublicSearchBuildPubMedTranslationPromptInput('diabetes', null, ['publicationYear' => '2020-2024']);
$decodedHf = json_decode($withHardFilters, true);
assertTrue(is_array($decodedHf), 'hardFilters alone (no semantic intent) still triggers structured JSON context');
assertTrue($decodedHf['structuredAiIntent']['canonicalHardFilters']['publicationYear'] === '2020-2024', 'canonicalHardFilters carries through the resolved hardFilters');

echo "\nAll Phase 6 PubMed-context-wiring smoke tests passed.\n";
