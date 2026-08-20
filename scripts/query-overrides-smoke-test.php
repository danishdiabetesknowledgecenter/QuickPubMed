<?php
/**
 * Smoke test for client queryOverrides: normalize, apply, LLM-skip,
 * early-prefetch guard, and cache-key isolation.
 *
 * Run: php scripts/query-overrides-smoke-test.php
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

function assertThrows(callable $fn, string $needle, string $message): void
{
    try {
        $fn();
    } catch (InvalidArgumentException $exception) {
        $text = $exception->getMessage();
        if ($needle !== '' && strpos($text, $needle) === false) {
            fwrite(STDERR, "FAIL: $message (unexpected message: $text)\n");
            exit(1);
        }
        echo "PASS: $message\n";
        return;
    }
    fwrite(STDERR, "FAIL: $message (no exception thrown)\n");
    exit(1);
}

assertTrue(
    !array_key_exists('queryOverrides', muginPublicSearchBuildDefaultRequest()),
    'Default request does not include queryOverrides key'
);

assertThrows(
    static fn() => muginPublicSearchNormalizeQueryOverrides(['pubmed' => 1]),
    'must be a string',
    'Non-string override value is rejected'
);
assertThrows(
    static fn() => muginPublicSearchNormalizeQueryOverrides(['unknownDb' => 'x']),
    'Unsupported queryOverrides',
    'Unknown override key is rejected'
);
assertThrows(
    static fn() => muginPublicSearchNormalizeQueryOverrides('pubmed'),
    'must be an object',
    'Non-object queryOverrides is rejected'
);
assertThrows(
    static fn() => muginPublicSearchNormalizeQueryOverrides([
        'pubmed' => str_repeat('a', muginPublicSearchQueryOverrideMaxLength() + 1),
    ]),
    'maximum length',
    'Over-long override is rejected'
);

$emptyNormalized = muginPublicSearchNormalizeQueryOverrides([
    'pubmed' => "  \n\t  ",
    'openAlex' => '',
]);
assertTrue($emptyNormalized === [], 'Whitespace-only overrides are dropped');

$normalized = muginPublicSearchNormalizeQueryOverrides([
    'pubmed' => "  custom pubmed[tiab]  ",
    'openAlex' => "custom openalex",
]);
assertTrue(($normalized['pubmed'] ?? '') === 'custom pubmed[tiab]', 'PubMed override is trimmed');
assertTrue(($normalized['openAlex'] ?? '') === 'custom openalex', 'OpenAlex override is trimmed');

$normalizedRequest = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'queryOverrides' => ['pubmed' => 'overridden[tiab]'],
]);
assertTrue(
    ($normalizedRequest['queryOverrides']['pubmed'] ?? '') === 'overridden[tiab]',
    'NormalizePostRequest keeps non-empty queryOverrides'
);

$withoutOverrides = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
]);
assertTrue(
    !array_key_exists('queryOverrides', $withoutOverrides),
    'NormalizePostRequest omits queryOverrides when the client did not send the field'
);

$emptyObjectRequest = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'queryOverrides' => [],
]);
assertTrue(
    !array_key_exists('queryOverrides', $emptyObjectRequest),
    'NormalizePostRequest omits queryOverrides when the object is empty after normalize'
);

$applied = muginPublicSearchApplyQueryOverrides(
    [
        'pubmedQuery' => 'original[tiab]',
        'hardFilterQuery' => 'english[la]',
        'sourceQueryPlan' => [
            'openAlex' => [
                'query' => 'original openalex',
                'filters' => ['publicationYear' => '2020-2026', 'workType' => ['article']],
            ],
            'elicit' => [
                'query' => 'original elicit',
                'filters' => ['typeTags' => ['Review']],
            ],
        ],
    ],
    [
        'pubmed' => 'overridden pubmed[tiab]',
        'openAlex' => 'overridden openalex',
        'elicit' => 'overridden elicit',
        'semanticScholar' => 'should be ignored',
    ],
    ['pubmed', 'openAlex', 'elicit']
);
assertTrue(($applied['pubmedQuery'] ?? '') === 'overridden pubmed[tiab]', 'PubMed override replaces pubmedQuery');
assertTrue(($applied['hardFilterQuery'] ?? '') === 'english[la]', 'PubMed override keeps hardFilterQuery');
assertTrue(
    muginPublicSearchCombinePubMedQuery($applied['pubmedQuery'], $applied['hardFilterQuery']) === '(overridden pubmed[tiab]) AND (english[la])',
    'CombinePubMedQuery ANDs limits after PubMed override'
);
assertTrue(
    muginPublicSearchCombinePubMedQuery('diabetes[tiab] AND english[la]', 'english[la]') === 'diabetes[tiab] AND english[la]',
    'CombinePubMedQuery does not double-AND when the base already contains the filter'
);
assertTrue(
    ($applied['sourceQueryPlan']['openAlex']['query'] ?? '') === 'overridden openalex',
    'OpenAlex override replaces query'
);
assertTrue(
    ($applied['sourceQueryPlan']['openAlex']['filters']['publicationYear'] ?? '') === '2020-2026',
    'OpenAlex filters are preserved'
);
assertTrue(
    ($applied['sourceQueryPlan']['elicit']['query'] ?? '') === 'overridden elicit',
    'Elicit override wins over the pre-override plan query'
);
assertTrue(empty($applied['queryOverrideApplied']['semanticScholar']), 'Override for a non-selected source is ignored');
assertTrue(!empty($applied['queryOverrideApplied']['pubmed']), 'PubMed override is marked applied');

$planBeforeElicit = muginPublicSearchBuildSourceQueryPlan(
    ['hardFilters' => [], 'sourceFilters' => [], 'sources' => ['elicit']],
    'raw elicit seed'
);
$elicitAfterFallback = (string) ($planBeforeElicit['elicit']['query'] ?? '');
$elicitApplied = muginPublicSearchApplyQueryOverrides(
    ['sourceQueryPlan' => $planBeforeElicit, 'pubmedQuery' => '', 'hardFilterQuery' => ''],
    ['elicit' => 'user elicit override'],
    ['elicit']
);
assertTrue(
    ($elicitApplied['sourceQueryPlan']['elicit']['query'] ?? '') === 'user elicit override',
    'Elicit override is applied after plan-build fallback transform'
);
assertTrue(
    $elicitAfterFallback !== 'user elicit override',
    'Pre-override Elicit plan query differs from the user override (fallback actually ran)'
);

$completeRequest = muginPublicSearchBuildDefaultRequest();
$completeRequest['query']['text'] = 'exercise diabetes';
$completeRequest['sources'] = ['pubmed', 'openAlex'];
$completeRequest['translation']['mode'] = 'auto';
$completeRequest['queryOverrides'] = [
    'pubmed' => 'complete pubmed[tiab]',
    'openAlex' => 'complete openalex query',
];
assertTrue(
    muginPublicSearchQueryOverridesCoverAllSelectedSources($completeRequest) === true,
    'Complete overrides cover every selected source'
);
$resolvedComplete = muginPublicSearchBuildResolvedQueries($completeRequest);
assertTrue(($resolvedComplete['pubmedQuery'] ?? '') === 'complete pubmed[tiab]', 'Complete skip uses PubMed override');
assertTrue(($resolvedComplete['hardFilterQuery'] ?? 'x') === '', 'Complete skip keeps empty hardFilterQuery when no limits');
assertTrue(
    ($resolvedComplete['sourceQueryPlan']['openAlex']['query'] ?? '') === 'complete openalex query',
    'Complete skip uses OpenAlex override'
);
assertTrue(
    ($resolvedComplete['_earlyPrefetchedSources'] ?? ['x']) === [],
    'Complete override skip leaves early prefetch empty'
);
assertTrue(
    trim((string) ($resolvedComplete['semanticIntentMeta']['promptVersion'] ?? '')) === '',
    'Complete override skip does not run semantic-intent LLM metadata'
);
assertTrue(
    ($resolvedComplete['semanticIntent'] ?? '') === 'complete openalex query',
    'Complete skip sets semanticIntent from the first semantic override'
);

$overrideWithLimits = muginPublicSearchBuildDefaultRequest();
$overrideWithLimits['query']['text'] = 'diabetes';
$overrideWithLimits['sources'] = ['pubmed'];
$overrideWithLimits['translation']['mode'] = 'none';
$overrideWithLimits['hardFilters'] = ['languages' => ['en']];
$overrideWithLimits['queryOverrides'] = ['pubmed' => 'overridden[tiab]'];
$resolvedOverrideWithLimits = muginPublicSearchBuildResolvedQueries($overrideWithLimits);
assertTrue(
    ($resolvedOverrideWithLimits['pubmedQuery'] ?? '') === 'overridden[tiab]',
    'PubMed override replaces only the topic/freetext query when limits are present'
);
assertTrue(
    ($resolvedOverrideWithLimits['hardFilterQuery'] ?? '') === '"English"[la]',
    'PubMed override keeps language limits in hardFilterQuery'
);
assertTrue(
    muginPublicSearchCombinePubMedQuery(
        (string) ($resolvedOverrideWithLimits['pubmedQuery'] ?? ''),
        (string) ($resolvedOverrideWithLimits['hardFilterQuery'] ?? '')
    ) === '(overridden[tiab]) AND ("English"[la])',
    'Limits are AND-ed onto the PubMed override'
);

$partialRequest = muginPublicSearchBuildDefaultRequest();
$partialRequest['query']['text'] = 'exercise diabetes';
$partialRequest['sources'] = ['pubmed', 'openAlex'];
$partialRequest['translation']['mode'] = 'none';
$partialRequest['queryOverrides'] = [
    'openAlex' => 'only openalex override',
];
$resolvedPartial = muginPublicSearchBuildResolvedQueries($partialRequest);
assertTrue(
    ($resolvedPartial['sourceQueryPlan']['openAlex']['query'] ?? '') === 'only openalex override',
    'Partial OpenAlex override is applied with translation.mode none'
);
assertTrue(
    ($resolvedPartial['pubmedQuery'] ?? '') !== 'only openalex override',
    'Partial override does not replace the PubMed query'
);
assertTrue(
    ($resolvedPartial['hardFilterQuery'] ?? null) !== null,
    'Partial override keeps hardFilterQuery for non-overridden PubMed'
);
assertTrue(
    ($resolvedPartial['_earlyPrefetchedSources'] ?? ['x']) === [],
    'translation.mode none plus overrides does not early-prefetch sources'
);

$baseCacheRequest = muginPublicSearchBuildDefaultRequest();
$baseCacheRequest['query']['text'] = 'cache isolation';
$baseCacheRequest['sources'] = ['pubmed'];
$keyWithout = muginPublicSearchBuildPipelineCacheKey($baseCacheRequest);
$withA = $baseCacheRequest;
$withA['queryOverrides'] = ['pubmed' => 'override-a'];
$withB = $baseCacheRequest;
$withB['queryOverrides'] = ['pubmed' => 'override-b'];
$keyA = muginPublicSearchBuildPipelineCacheKey($withA);
$keyB = muginPublicSearchBuildPipelineCacheKey($withB);
assertTrue($keyWithout !== $keyA, 'Pipeline cache key changes when queryOverrides are present');
assertTrue($keyA !== $keyB, 'Different queryOverrides produce different pipeline cache keys');

$searchKeyWithout = 'request:' . muginPublicSearchSafeJsonEncode($baseCacheRequest);
$searchKeyWith = 'request:' . muginPublicSearchSafeJsonEncode($withA);
assertTrue($searchKeyWithout !== $searchKeyWith, 'Search-response cache key includes queryOverrides');

$staleIntentReport = [
    'sourceQueries' => [
        [
            'source' => 'semanticScholar',
            'query' => 'Santa Claus existence belief',
            'filters' => ['publicationTypes' => ['Review']],
        ],
        [
            'source' => 'openAlex',
            'query' => 'Santa Claus existence belief',
            'filters' => [],
        ],
    ],
];
$executedPlan = [
    'semanticScholar' => [
        'query' => 'belief in Santa Claus',
        'filters' => ['publicationTypes' => ['Review', 'Meta-Analysis', 'JournalArticle']],
    ],
    'openAlex' => [
        'query' => 'Santa Claus existence belief',
        'filters' => ['workType' => ['review']],
    ],
];
$syncedReport = muginPublicSearchAttachExecutedSourceQueriesToProcessReport(
    $staleIntentReport,
    $executedPlan,
    ['sources' => ['semanticScholar', 'openAlex']],
    ['semanticScholar' => true]
);
assertTrue(
    ($syncedReport['sourceQueries'][0]['query'] ?? '') === 'belief in Santa Claus',
    'Process-report sourceQueries pick up the Semantic Scholar override'
);
assertTrue(
    ($syncedReport['sourceQueries'][1]['query'] ?? '') === 'Santa Claus existence belief',
    'Process-report sourceQueries keep the un-overridden OpenAlex query'
);
assertTrue(
    !empty($syncedReport['queryOverrideApplied']['semanticScholar']),
    'Process-report records that the Semantic Scholar override was applied'
);

echo "OK: query-overrides smoke test passed\n";
