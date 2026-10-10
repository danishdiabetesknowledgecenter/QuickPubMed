<?php
/**
 * Best-match sort is shared by the JSON search body and the flat API parameter.
 * Run: php scripts/best-match-sort-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/public-search-lib.php';
require_once __DIR__ . '/../backend/app/public-search-flat-params.php';

function assertTrue(bool $condition, string $message): void
{
    echo ($condition ? 'PASS' : 'FAIL') . ': ' . $message . PHP_EOL;
    if (!$condition) {
        exit(1);
    }
}

assertTrue(muginPublicSearchNormalizeSortMethod('best_match') === 'best_match', 'JSON sort.method best_match is accepted');
assertTrue(muginPublicSearchNormalizeSortMethod('relevance') === 'relevance', 'relevance sort is unchanged');
assertTrue(muginPublicSearchNormalizeSortMethod('date_desc') === 'date_desc', 'date sort is unchanged');
assertTrue(muginPublicSearchNormalizeSortMethod('nope') === 'relevance', 'unknown sort still falls back to relevance');

$flat = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'diabetes education',
    'databases' => 'pubmed',
    'sort' => 'best_match',
    'pagesize' => '25',
    'page' => '2',
]);
$json = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes education', 'language' => 'en'],
    'sources' => ['pubmed'],
    'sort' => ['method' => 'best_match'],
    'page' => ['number' => 2, 'size' => 25],
]);
assertTrue(
    ($flat['sort']['method'] ?? '') === 'best_match' && ($json['sort']['method'] ?? '') === 'best_match',
    'flat sort=best_match and JSON sort.method normalize to the same method'
);

$windowRequest = [
    'sort' => ['method' => 'best_match'],
    'page' => ['number' => 2],
    'translation' => ['mode' => 'auto'],
    'sources' => ['pubmed'],
    '_bestMatchScoreWindow' => true,
];
if (muginPublicSearchShouldApplySemanticLlmFinalRerank($windowRequest, [[], []])) {
    assertTrue(
        muginPublicSearchFinalRerankCandidateWindow($windowRequest, 25, 0) === 100,
        'best match scores a window of 100'
    );
}
$relevanceRequest = [
    'sort' => ['method' => 'relevance'],
    'page' => ['number' => 1],
    'translation' => ['mode' => 'auto'],
    'sources' => ['pubmed'],
];
$relevanceWindow = muginPublicSearchFinalRerankCandidateWindow($relevanceRequest, 25, 0);
assertTrue($relevanceWindow !== 100, 'relevance does not use the best-match window of 100');

$window = [];
$scores = [];
for ($index = 0; $index < 100; $index++) {
    $id = 'id' . $index;
    $window[] = $id;
    $scores[$id] = $index;
}
$sorted = muginFinalRerankOrderByDecisionScore($window, $scores, []);
$page2 = array_slice($sorted, 25, 25);
assertTrue($sorted[0] === 'id99', 'the highest score is first');
assertTrue(count($page2) === 25 && $page2[0] === 'id74', 'page 2 is the next slice of the score order');
assertTrue($page2 !== array_slice($window, 25, 25), 'page 2 is not the relevance slice');

echo PHP_EOL . 'All best-match sort smoke tests passed.' . PHP_EOL;
