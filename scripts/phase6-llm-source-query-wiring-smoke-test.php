<?php
/**
 * Phase 6 fix verification: confirms qpmPublicSearchBuildSourceQueryPlan()
 * now uses the LLM semantic-intent's per-source queries (sourceQueryPlan.*.query
 * and adaptations.*.queryOverride), matching buildSemanticSourceQueryPlan()
 * in DropdownWrapper.vue, instead of sending the same plain semantic query to
 * all three non-PubMed sources.
 *
 * Run: php scripts/phase6-llm-source-query-wiring-smoke-test.php
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

// 1. No LLM intent (null) -> falls back to the plain semantic query for all sources (unchanged legacy behavior).
$plan1 = qpmPublicSearchBuildSourceQueryPlan(['hardFilters' => [], 'sourceFilters' => []], 'plain semantic query', null);
assertTrue($plan1['semanticScholar']['query'] === 'plain semantic query', 'Without LLM intent, semanticScholar falls back to the plain semantic query');
assertTrue($plan1['openAlex']['query'] === 'plain semantic query', 'Without LLM intent, openAlex falls back to the plain semantic query');

// 2. LLM intent present with per-source queries -> those win over the plain semantic query.
$llmIntent = [
    'sourceQueryPlan' => [
        'coreQuery' => 'core query text',
        'adaptations' => [
            'semanticScholar' => ['queryOverride' => null],
            'openAlex' => ['queryOverride' => null],
            'elicit' => ['queryOverride' => null],
        ],
        'semanticScholar' => ['query' => 'insulin resistance treatment', 'filters' => ['publicationTypes' => [], 'publicationDateOrYear' => '', 'year' => '']],
        'openAlex' => ['query' => 'type 2 diabetes mellitus therapeutics', 'filters' => ['language' => [], 'sourceType' => [], 'workType' => []]],
        'elicit' => ['query' => 'What are effective treatments for type 2 diabetes?', 'filters' => ['typeTags' => [], 'includeKeywords' => [], 'excludeKeywords' => []]],
    ],
];
$plan2 = qpmPublicSearchBuildSourceQueryPlan(['hardFilters' => [], 'sourceFilters' => []], 'plain semantic query', $llmIntent);
assertTrue(
    $plan2['semanticScholar']['query'] === 'insulin resistance treatment',
    'With LLM intent, semanticScholar uses the LLM per-source query, not the plain semantic query'
);
assertTrue(
    $plan2['openAlex']['query'] === 'type 2 diabetes mellitus therapeutics',
    'With LLM intent, openAlex uses the LLM per-source query, not the plain semantic query'
);
assertTrue(
    strpos($plan2['elicit']['query'], 'effective treatments') !== false,
    'With LLM intent, elicit uses the LLM per-source query (already question-shaped, so the fallback-query wrapper leaves it unchanged)'
);

// 3. Adaptation override wins over even the LLM per-source query.
$llmIntentWithOverride = $llmIntent;
$llmIntentWithOverride['sourceQueryPlan']['adaptations']['openAlex']['queryOverride'] = 'overridden openalex query';
$plan3 = qpmPublicSearchBuildSourceQueryPlan(['hardFilters' => [], 'sourceFilters' => []], 'plain semantic query', $llmIntentWithOverride);
assertTrue(
    $plan3['openAlex']['query'] === 'overridden openalex query',
    'An explicit adaptation queryOverride wins over both the LLM per-source query and the plain semantic query'
);
assertTrue(
    $plan3['semanticScholar']['query'] === 'insulin resistance treatment',
    'Other sources without an override still use their own LLM per-source query'
);

// 4. Empty semantic query but LLM coreQuery present -> coreQuery is used as the common fallback.
$llmIntentCoreOnly = [
    'sourceQueryPlan' => [
        'coreQuery' => 'core fallback query',
        'adaptations' => ['semanticScholar' => ['queryOverride' => null], 'openAlex' => ['queryOverride' => null], 'elicit' => ['queryOverride' => null]],
        'semanticScholar' => ['query' => '', 'filters' => ['publicationTypes' => [], 'publicationDateOrYear' => '', 'year' => '']],
        'openAlex' => ['query' => '', 'filters' => ['language' => [], 'sourceType' => [], 'workType' => []]],
        'elicit' => ['query' => '', 'filters' => ['typeTags' => [], 'includeKeywords' => [], 'excludeKeywords' => []]],
    ],
];
$plan4 = qpmPublicSearchBuildSourceQueryPlan(['hardFilters' => [], 'sourceFilters' => []], '', $llmIntentCoreOnly);
assertTrue(
    $plan4['semanticScholar']['query'] === 'core fallback query',
    'When both the plain semantic query and the LLM per-source query are empty, coreQuery is used as the shared fallback'
);

echo "\nAll Phase 6 LLM-source-query-wiring smoke tests passed.\n";
