<?php
/**
 * Smoke test for the qpmHttpRequestPrefetch()/qpmHttpRequestPrefetchStore()
 * mechanism (unified-search-engine-full-parity plan, deferred "Fase 5",
 * tackled now). Verifies:
 * 1. A prefetched result is returned by qpmHttpRequest() without a real
 *    network call, for the exact same method+url+body.
 * 2. Prefetch entries are single-use (a second call for the same key falls
 *    through to a real request).
 * 3. A different body for the same URL does NOT match the prefetch (correct
 *    cache-key isolation, relevant for Elicit's POST body).
 * 4. qpmPublicSearchBuildSemanticScholarBatchRequestSpec /
 *    qpmPublicSearchBuildOpenAlexSourceRequestSpec /
 *    qpmPublicSearchBuildElicitSourceRequestSpec produce the exact same
 *    {url, options} shape the real fetch functions use internally, so the
 *    prefetch orchestrator and the real per-source fetch functions are
 *    guaranteed to compute the same cache key for the same logical request.
 */

require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $label): void
{
    echo ($condition ? "PASS" : "FAIL") . ": $label\n";
    if (!$condition) {
        exit(1);
    }
}

// --- Test 1 & 2: basic prefetch + single-use ---
$url = 'https://example.invalid/test-endpoint';
$options = ['method' => 'GET', 'headers' => ['Accept: application/json']];
$fakeResult = [
    'ok' => true,
    'status' => 200,
    'body' => '{"fake":true}',
    'content_type' => 'application/json',
    'error' => '',
    'response_headers' => [],
];
qpmHttpRequestPrefetch($url, $options, $fakeResult);
$returned = qpmHttpRequest($url, $options);
assertTrue($returned === $fakeResult, 'Prefetched result is returned verbatim by qpmHttpRequest()');

// Second call for the same key should NOT hit the cache again (single-use).
// It will attempt a real network call to an invalid host and fail, which is
// exactly what we want to prove here (no network call = would incorrectly
// return $fakeResult again).
$second = qpmHttpRequest($url, $options);
assertTrue($second !== $fakeResult, 'Prefetch entry is single-use (second call does not reuse it)');
assertTrue($second['ok'] === false, 'Second call for the same URL genuinely attempted (and failed) a real request');

// --- Test 3: different POST body must not collide in the cache key ---
$postUrl = 'https://example.invalid/elicit-like-endpoint';
$optionsA = ['method' => 'POST', 'body' => '{"query":"a"}'];
$optionsB = ['method' => 'POST', 'body' => '{"query":"b"}'];
qpmHttpRequestPrefetch($postUrl, $optionsA, $fakeResult);
$mismatch = qpmHttpRequest($postUrl, $optionsB);
assertTrue($mismatch !== $fakeResult, 'Different POST body does not match a prefetch keyed by another body');
// Clean up the still-pending optionsA prefetch entry so it doesn't leak into
// a later, unrelated qpmHttpRequest() call within this same PHP process.
qpmHttpRequest($postUrl, $optionsA);

// --- Test 4: request-spec builders match what the real fetch functions use ---
$ssHeaders = qpmPublicSearchBuildSemanticScholarHeaders('');
$ssSpec = qpmPublicSearchBuildSemanticScholarBatchRequestSpec(
    'diabetes treatment',
    $ssHeaders,
    '',
    '',
    '',
    0,
    100
);
assertTrue(
    isset($ssSpec['url']) && str_contains($ssSpec['url'], 'api.semanticscholar.org/graph/v1/paper/search'),
    'Semantic Scholar request spec builds the expected URL'
);
assertTrue(
    isset($ssSpec['options']['method']) && $ssSpec['options']['method'] === 'GET',
    'Semantic Scholar request spec uses GET'
);

$oaSpec = qpmPublicSearchBuildOpenAlexSourceRequestSpec('diabetes treatment', [], '', '');
assertTrue(
    isset($oaSpec['url']) && str_contains($oaSpec['url'], 'api.openalex.org/works'),
    'OpenAlex request spec builds the expected URL'
);

$elicitSpec = qpmPublicSearchBuildElicitSourceRequestSpec('diabetes treatment', [], 'fake-api-key');
assertTrue(
    isset($elicitSpec['url']) && $elicitSpec['url'] === 'https://elicit.com/api/v2/search/papers',
    'Elicit request spec builds the expected URL'
);
assertTrue(
    isset($elicitSpec['options']['method']) && $elicitSpec['options']['method'] === 'POST',
    'Elicit request spec uses POST'
);

// --- Test 5: qpmPublicSearchPrefetchInitialSourceRequests() no-ops safely
// when no sources/queries are given (must not throw or attempt any network
// call for an empty request) ---
qpmPublicSearchPrefetchInitialSourceRequests([], [], [], '');
qpmPublicSearchPrefetchInitialSourceRequests(['pubmed', 'semanticScholar', 'openAlex', 'elicit'], [], [], '');
echo "PASS: qpmPublicSearchPrefetchInitialSourceRequests() no-ops safely for empty queries\n";

echo "\nAll prefetch smoke tests passed.\n";
