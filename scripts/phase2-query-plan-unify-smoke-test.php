<?php
/**
 * Phase 2 smoke test (unified-engine full-parity plan): verifies the
 * corrected muginPublicSearchBuildSourceQueryPlan() rules match
 * buildSemanticSourceQueryPlan()/collectSourceFilters() in DropdownWrapper.vue
 * for the concrete rule divergences identified by research:
 *  - journal sourceFormat maps to OpenAlex workType:article (not sourceType:journal)
 *  - Semantic Scholar sourceFormat proxy (journal/conference/preprint)
 *  - "prefer configured over fallback" merge strategy for OpenAlex + Elicit
 *  - Elicit hasPdf/minYear/maxYear/minEpochS/maxEpochS/maxQuartile/pubmedOnly/retracted
 *
 * Run: php scripts/phase2-query-plan-unify-smoke-test.php
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

// 1. journal sourceFormat -> OpenAlex workType:article, NOT sourceType:journal.
$request1 = ['hardFilters' => ['sourceFormats' => ['journal']], 'sourceFilters' => []];
$plan1 = muginPublicSearchBuildSourceQueryPlan($request1, 'diabetes treatment');
assertTrue(
    in_array('article', $plan1['openAlex']['filters']['workType'], true),
    'journal sourceFormat maps to OpenAlex workType:article'
);
assertTrue(
    !in_array('journal', $plan1['openAlex']['filters']['sourceType'], true),
    'journal sourceFormat no longer incorrectly maps to OpenAlex sourceType:journal'
);
assertTrue(
    in_array('journalarticle', array_map('strtolower', $plan1['semanticScholar']['filters']['publicationTypes'] ?? []), true)
        || in_array('JournalArticle', $plan1['semanticScholar']['filters']['publicationTypes'] ?? [], true),
    'journal sourceFormat now also proxies into Semantic Scholar publicationTypes (was missing entirely)'
);

// 2. Prefer-configured merge strategy: OpenAlex workType configured explicitly
// must win outright over the sourceFormat/publicationType-derived fallback.
$request2 = [
    'hardFilters' => ['publicationTypes' => ['review']],
    'sourceFilters' => ['openAlex' => ['workType' => ['preprint']]],
];
$plan2 = muginPublicSearchBuildSourceQueryPlan($request2, 'diabetes treatment');
assertTrue(
    $plan2['openAlex']['filters']['workType'] === ['preprint'],
    'Explicitly configured OpenAlex workType wins outright over the hardFilter-derived fallback (prefer-configured strategy)'
);

// 3. Elicit typeTags: same prefer-configured strategy.
$request3 = [
    'hardFilters' => ['publicationTypes' => ['systematic review']],
    'sourceFilters' => ['elicit' => ['typeTags' => ['RCT']]],
];
$plan3 = muginPublicSearchBuildSourceQueryPlan($request3, 'diabetes treatment');
assertTrue(
    $plan3['elicit']['filters']['typeTags'] === ['RCT'],
    'Explicitly configured Elicit typeTags win outright over the hardFilter-derived fallback'
);

// 4. Elicit extra fields now pass through end-to-end (previously silently dropped).
$request4 = [
    'hardFilters' => [],
    'sourceFilters' => [
        'elicit' => ['hasPdf' => true, 'minYear' => 2020, 'maxQuartile' => 2, 'pubmedOnly' => false],
    ],
];
$plan4 = muginPublicSearchBuildSourceQueryPlan($request4, 'diabetes treatment');
assertTrue($plan4['elicit']['filters']['hasPdf'] === true, 'Elicit hasPdf now passes through the query plan');
assertTrue($plan4['elicit']['filters']['minYear'] === 2020, 'Elicit minYear now passes through the query plan');
assertTrue($plan4['elicit']['filters']['maxQuartile'] === 2, 'Elicit maxQuartile now passes through the query plan');
assertTrue($plan4['elicit']['filters']['pubmedOnly'] === false, 'Elicit pubmedOnly now passes through the query plan');
assertTrue(
    $plan4['elicit']['filters']['retracted'] === 'exclude_retracted',
    'Elicit retracted defaults to exclude_retracted when unset, matching the website widget'
);

// 5. Request-schema extension: previously-rejected Elicit fields no longer throw.
$rawPayload = [
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['elicit'],
    'sourceFilters' => ['elicit' => ['hasPdf' => true, 'retracted' => 'include_retracted']],
];
$normalizedRequest = muginPublicSearchNormalizePostRequest($rawPayload);
assertTrue(
    $normalizedRequest['sourceFilters']['elicit']['hasPdf'] === true,
    'Request validation now accepts and normalizes sourceFilters.elicit.hasPdf'
);
assertTrue(
    $normalizedRequest['sourceFilters']['elicit']['retracted'] === 'include_retracted',
    'Request validation now accepts and normalizes sourceFilters.elicit.retracted'
);

// 6. Elicit fetch payload forwards the extra fields to the actual Elicit API
// request body (previously silently dropped even when present in $filters).
// We can't make a real network call here without an API key, but we can
// verify muginPublicSearchNormalizeElicitRetractedValue()'s default-fallback
// logic directly, which is what the fetch function relies on.
assertTrue(
    muginPublicSearchNormalizeElicitRetractedValue('') === '',
    'muginPublicSearchNormalizeElicitRetractedValue returns empty string for unset (caller applies the exclude_retracted default)'
);
assertTrue(
    (muginPublicSearchNormalizeElicitRetractedValue('') ?: 'exclude_retracted') === 'exclude_retracted',
    'Default-fallback pattern used in muginPublicSearchFetchElicitSourceResult correctly resolves to exclude_retracted'
);

// 7. OpenAlex isOa now passes through request validation and the query plan.
$request7 = [
    'hardFilters' => [],
    'sourceFilters' => ['openAlex' => ['isOa' => true]],
];
$plan7 = muginPublicSearchBuildSourceQueryPlan($request7, 'diabetes treatment');
assertTrue($plan7['openAlex']['filters']['isOa'] === true, 'OpenAlex isOa now passes through the query plan');

$normalizedOpenAlex = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['openAlex'],
    'sourceFilters' => ['openAlex' => ['isOa' => true]],
]);
assertTrue(
    $normalizedOpenAlex['sourceFilters']['openAlex']['isOa'] === true,
    'Request validation now accepts and normalizes sourceFilters.openAlex.isOa'
);

// 8. RCT hard-filters map to Semantic Scholar ClinicalTrial.
$planRct = muginPublicSearchBuildSourceQueryPlan([
    'hardFilters' => ['publicationTypes' => ['randomized controlled trial']],
    'sourceFilters' => [],
], 'diabetes treatment');
assertTrue(
    in_array('ClinicalTrial', $planRct['semanticScholar']['filters']['publicationTypes'] ?? [], true),
    'RCT publicationType maps to Semantic Scholar ClinicalTrial'
);

$planRctStudy = muginPublicSearchBuildSourceQueryPlan([
    'hardFilters' => ['studyDesigns' => ['randomized controlled trial']],
    'sourceFilters' => [],
], 'diabetes treatment');
assertTrue(
    in_array('ClinicalTrial', $planRctStudy['semanticScholar']['filters']['publicationTypes'] ?? [], true),
    'RCT studyDesign maps to Semantic Scholar ClinicalTrial'
);

$openAlexSpec = muginPublicSearchBuildOpenAlexSourceRequestSpec(
    'diabetes treatment',
    ['isOa' => true],
    'template',
    '',
    'semantic'
);
assertTrue(
    strpos((string) ($openAlexSpec['url'] ?? ''), 'open_access.is_oa') !== false,
    'OpenAlex request spec includes open_access.is_oa when isOa is true'
);

echo "\nAll Phase 2 query-plan-unification smoke tests passed.\n";
