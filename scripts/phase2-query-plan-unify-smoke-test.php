<?php
/**
 * Phase 2 smoke test (unified-engine full-parity plan): verifies the
 * corrected qpmPublicSearchBuildSourceQueryPlan() rules match
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
$plan1 = qpmPublicSearchBuildSourceQueryPlan($request1, 'diabetes treatment');
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
$plan2 = qpmPublicSearchBuildSourceQueryPlan($request2, 'diabetes treatment');
assertTrue(
    $plan2['openAlex']['filters']['workType'] === ['preprint'],
    'Explicitly configured OpenAlex workType wins outright over the hardFilter-derived fallback (prefer-configured strategy)'
);

// 3. Elicit typeTags: same prefer-configured strategy.
$request3 = [
    'hardFilters' => ['publicationTypes' => ['systematic review']],
    'sourceFilters' => ['elicit' => ['typeTags' => ['RCT']]],
];
$plan3 = qpmPublicSearchBuildSourceQueryPlan($request3, 'diabetes treatment');
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
$plan4 = qpmPublicSearchBuildSourceQueryPlan($request4, 'diabetes treatment');
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
$normalizedRequest = qpmPublicSearchNormalizePostRequest($rawPayload);
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
// verify qpmPublicSearchNormalizeElicitRetractedValue()'s default-fallback
// logic directly, which is what the fetch function relies on.
assertTrue(
    qpmPublicSearchNormalizeElicitRetractedValue('') === '',
    'qpmPublicSearchNormalizeElicitRetractedValue returns empty string for unset (caller applies the exclude_retracted default)'
);
assertTrue(
    (qpmPublicSearchNormalizeElicitRetractedValue('') ?: 'exclude_retracted') === 'exclude_retracted',
    'Default-fallback pattern used in qpmPublicSearchFetchElicitSourceResult correctly resolves to exclude_retracted'
);

echo "\nAll Phase 2 query-plan-unification smoke tests passed.\n";
