<?php
/**
 * Refusal phrases in semantic-intent query fields must not become the
 * executable SS/OA/Elicit search strings.
 *
 * Run: php scripts/semantic-query-fallback-smoke-test.php
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

$refusal = 'unclear or non-scientific query';
$elicitWrapped = 'What is known about unclear or non-scientific query?';

assertTrue(
    muginPublicSearchIsUnusableGeneratedQueryText($refusal),
    'Semantic refusal phrase is detected as unusable'
);
assertTrue(
    muginPublicSearchIsUnusableGeneratedQueryText($elicitWrapped),
    'Elicit wrapper around the refusal phrase is detected as unusable'
);
assertTrue(
    !muginPublicSearchIsUnusableGeneratedQueryText('santa claus'),
    'A real semantic query is not treated as unusable'
);
assertTrue(
    !muginPublicSearchIsUnusableGeneratedQueryText('findes julemanden?'),
    'Raw freetext is not treated as unusable'
);

$refusalIntent = [
    'semanticIntent' => $refusal,
    'sourceQueryPlan' => [
        'coreQuery' => $refusal,
        'adaptations' => [
            'semanticScholar' => ['queryOverride' => $refusal],
            'openAlex' => ['queryOverride' => null],
            'elicit' => ['queryOverride' => null],
        ],
        'semanticScholar' => ['query' => $refusal, 'filters' => []],
        'openAlex' => ['query' => $refusal, 'filters' => []],
        'elicit' => ['query' => $refusal, 'filters' => []],
    ],
    'meta' => [
        'detectedConcepts' => ['Santa Claus'],
    ],
];

assertTrue(
    !muginPublicSearchSemanticIntentHasUsableQueries($refusalIntent),
    'All-refusal intent is not treated as having usable queries'
);
assertTrue(
    muginPublicSearchResolveSemanticQueryFromIntent($refusalIntent, 'findes julemanden?') === 'findes julemanden?',
    'ResolveSemanticQueryFromIntent skips refusal text and uses the fallback'
);
assertTrue(
    muginPublicSearchBuildUntranslatedSemanticFallbackQuery('findes julemanden?', $refusalIntent) === 'Santa Claus',
    'Semantic fallback prefers detectedConcepts over raw freetext when query fields are refusals'
);

$request = [
    'query' => ['text' => 'findes julemanden?'],
    'hardFilters' => [],
    'sourceFilters' => [],
];
$planFromRefusal = muginPublicSearchBuildSourceQueryPlan($request, $refusal, $refusalIntent);
assertTrue(
    $planFromRefusal['semanticScholar']['query'] === 'Santa Claus',
    'BuildSourceQueryPlan replaces Semantic Scholar refusal with detectedConcepts'
);
assertTrue(
    $planFromRefusal['openAlex']['query'] === 'Santa Claus',
    'BuildSourceQueryPlan replaces OpenAlex refusal with detectedConcepts'
);
assertTrue(
    strpos($planFromRefusal['elicit']['query'], 'unclear or non-scientific') === false,
    'BuildSourceQueryPlan does not wrap the refusal into the Elicit question'
);
assertTrue(
    strpos($planFromRefusal['elicit']['query'], 'Santa Claus') !== false,
    'Elicit query is built from the usable fallback, not the refusal phrase'
);

$planFromTranslated = muginPublicSearchBuildSourceQueryPlan(
    $request,
    'santa claus',
    $refusalIntent
);
assertTrue(
    $planFromTranslated['semanticScholar']['query'] === 'santa claus',
    'A later English semantic translation wins over refusal per-source queries'
);

$usableIntent = [
    'semanticIntent' => 'diabetes type 2 treatment',
    'sourceQueryPlan' => [
        'coreQuery' => 'diabetes type 2 treatment',
        'adaptations' => [
            'semanticScholar' => ['queryOverride' => null],
            'openAlex' => ['queryOverride' => null],
            'elicit' => ['queryOverride' => null],
        ],
        'semanticScholar' => ['query' => 'insulin resistance treatment', 'filters' => []],
        'openAlex' => ['query' => 'type 2 diabetes mellitus therapeutics', 'filters' => []],
        'elicit' => ['query' => 'What are effective treatments for type 2 diabetes?', 'filters' => []],
    ],
];
assertTrue(
    muginPublicSearchSemanticIntentHasUsableQueries($usableIntent),
    'A normal intent is still treated as having usable queries'
);
$planUsable = muginPublicSearchBuildSourceQueryPlan(
    ['hardFilters' => [], 'sourceFilters' => []],
    'plain semantic query',
    $usableIntent
);
assertTrue(
    $planUsable['semanticScholar']['query'] === 'insulin resistance treatment',
    'Usable LLM per-source queries are still preferred over the plain semantic query'
);

$lib = (string) file_get_contents(__DIR__ . '/../backend/app/public-search-lib.php');
assertTrue(
    strpos($lib, "'_semanticQueryGuard' => 1") !== false
        || strpos($lib, '$_semanticQueryGuard') !== false
        || strpos($lib, "_semanticQueryGuard") !== false,
    'Pipeline cache key source includes _semanticQueryGuard'
);

$jsPrompt = (string) file_get_contents(__DIR__ . '/../src/assets/prompts/translation.js');
assertTrue(
    strpos($jsPrompt, 'Skriv aldrig status-, afvisnings- eller meta-sætninger som query') !== false
    && strpos($jsPrompt, 'Never write status, rejection, or meta-commentary sentences as a query') !== false,
    'translation.js semantic-intent prompts match the PHP rule-12 wording'
);

echo "OK: semantic-query-fallback smoke test passed\n";
