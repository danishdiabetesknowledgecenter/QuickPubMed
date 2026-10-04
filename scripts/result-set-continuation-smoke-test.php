<?php
/**
 * "Load next" must hydrate a stored candidate list and must not start a new search.
 *
 * Run: php scripts/result-set-continuation-smoke-test.php
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

$base = muginPublicSearchBuildDefaultRequest();
$base['query']['text'] = 'result set continuation';
$base['sources'] = ['pubmed'];
$withId = $base;
$withId['resultSetId'] = 'pipeline:' . sha1('ignored-by-pipeline-key');
assertTrue(
    muginPublicSearchBuildPipelineCacheKey($base) === muginPublicSearchBuildPipelineCacheKey($withId),
    'Pipeline cache key ignores resultSetId'
);
assertTrue(
    !muginPublicSearchIsValidResultSetId('pipeline:not-a-sha'),
    'Malformed resultSetId is rejected'
);
assertTrue(
    !muginPublicSearchIsValidResultSetId('../search-pipeline'),
    'Path-like resultSetId is rejected'
);

$validId = 'pipeline:' . sha1('result-set-continuation-smoke');
assertTrue(muginPublicSearchIsValidResultSetId($validId), 'pipeline sha1 id is accepted');

$normalized = muginPublicSearchNormalizePostRequest([
    'apiVersion' => '1',
    'query' => ['text' => 'result set continuation', 'language' => 'da'],
    'sources' => ['pubmed'],
    'resultSetId' => $validId,
]);
assertTrue(
    ($normalized['resultSetId'] ?? '') === $validId,
    'NormalizePostRequest keeps a valid resultSetId'
);
assertThrows(
    static fn() => muginPublicSearchNormalizePostRequest([
        'apiVersion' => '1',
        'query' => ['text' => 'result set continuation', 'language' => 'da'],
        'sources' => ['pubmed'],
        'resultSetId' => 'pipeline:nope',
    ]),
    'resultSetId is invalid',
    'NormalizePostRequest rejects an invalid resultSetId'
);

$stored = [
    'resolvedQueries' => ['pubmedQuery' => 'stored-query'],
    'resultRefs' => [],
    'orderedCandidates' => [],
    'warnings' => ['stored warning'],
    'diagnostics' => [],
    'totalCount' => 42,
];
muginPublicSearchWriteCacheValue('search-pipeline', $validId, $stored, 120);
$pipelinePath = muginPublicSearchBuildCacheFilePath('search-pipeline', $validId);

$continuation = muginPublicSearchBuildDefaultRequest();
$continuation['query']['text'] = 'result set continuation ' . $validId;
$continuation['sources'] = ['pubmed'];
$continuation['page'] = ['number' => 2, 'size' => 10, 'offset' => 25];
$continuation['responseOptions']['stream'] = true;
$continuation['responseOptions']['noCache'] = true;
$continuation['cachedFreetextQueries'] = [
    'input' => $continuation['query']['text'],
    'pubmed' => 'different translated query',
];
$continuation['resultSetId'] = $validId;
$requestForCacheKey = $continuation;
if (isset($requestForCacheKey['responseOptions']) && is_array($requestForCacheKey['responseOptions'])) {
    unset($requestForCacheKey['responseOptions']['noCache']);
}
$requestForCacheKey['_llmProvider'] = function_exists('muginGetLlmProvider') ? muginGetLlmProvider() : 'openai';
$requestForCacheKey['_topicSignalVersion'] = defined('MUGIN_TOPIC_SIGNAL_VERSION')
    ? MUGIN_TOPIC_SIGNAL_VERSION
    : '2026-08-11';
$searchCacheKey = 'request:' . muginPublicSearchSafeJsonEncode($requestForCacheKey);
$searchCachePath = muginPublicSearchBuildCacheFilePath('search-response', $searchCacheKey);
register_shutdown_function(static function () use ($pipelinePath, $searchCachePath): void {
    if (is_file($pipelinePath)) {
        @unlink($pipelinePath);
    }
    if (is_file($searchCachePath)) {
        @unlink($searchCachePath);
    }
});

$loaded = muginPublicSearchReadStoredPipeline($validId);
assertTrue(is_array($loaded) && (int) ($loaded['totalCount'] ?? 0) === 42, 'Stored pipeline can be read back by id');

$missing = $continuation;
$missing['resultSetId'] = 'pipeline:' . sha1('result-set-continuation-missing');
$missing['query']['text'] = 'missing result set ' . $missing['resultSetId'];

$continued = muginPublicSearchRunSearch($continuation);
assertTrue(($continued['resultSetExpired'] ?? false) !== true, 'Known resultSetId does not expire');
assertTrue((int) ($continued['total'] ?? 0) === 42, 'Continuation keeps the stored total');
assertTrue(($continued['results'] ?? null) === [], 'Continuation hydrates only the stored slice');
assertTrue(($continued['resultSetId'] ?? '') === $validId, 'Continuation echoes the same resultSetId');

$expired = muginPublicSearchRunSearch($missing);
assertTrue(($expired['resultSetExpired'] ?? false) === true, 'Unknown resultSetId does not start a new search');
assertTrue(($expired['results'] ?? null) === [], 'Expired continuation returns no results');
assertTrue((int) ($expired['total'] ?? -1) === 0, 'Expired continuation does not invent a total');

echo "OK\n";
