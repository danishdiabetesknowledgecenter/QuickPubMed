<?php
/**
 * Session reuse of an already-translated freetext clause.
 *
 * Run: php scripts/cached-freetext-queries-smoke-test.php
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

$normalized = muginPublicSearchNormalizeCachedFreetextQueries([
    'input' => 'findes julemanden?',
    'pubmed' => '"santa claus"[tiab]',
    'semanticScholar' => 'belief in Santa Claus',
    'openAlex' => 'Santa Claus existence belief',
]);
assertTrue(
    ($normalized['input'] ?? '') === 'findes julemanden?',
    'Normalize keeps the matching input'
);
assertTrue(
    ($normalized['pubmed'] ?? '') === '"santa claus"[tiab]',
    'Normalize keeps the PubMed freetext clause'
);
assertTrue(
    muginPublicSearchCachedFreetextQueriesMatchInput($normalized, 'findes julemanden?'),
    'Cache hits when query.text matches input'
);
assertTrue(
    !muginPublicSearchCachedFreetextQueriesMatchInput($normalized, 'anden fritekst'),
    'Cache misses when the freetext changed'
);

$coverRequest = muginPublicSearchBuildDefaultRequest();
$coverRequest['query']['text'] = 'findes julemanden?';
$coverRequest['sources'] = ['pubmed', 'semanticScholar'];
$coverRequest['cachedFreetextQueries'] = $normalized;
assertTrue(
    muginPublicSearchCachedFreetextQueriesCoverSelectedSources($coverRequest, $normalized),
    'Cache covers pubmed + Semantic Scholar when both strings are present'
);
$elicitOnly = $coverRequest;
$elicitOnly['sources'] = ['elicit'];
assertTrue(
    !muginPublicSearchCachedFreetextQueriesCoverSelectedSources($elicitOnly, $normalized),
    'Cache does not cover a selected source that was never translated'
);
$expanded = muginPublicSearchExpandCachedFreetextQueriesForSelectedSources($elicitOnly, $normalized);
assertTrue(
    ($expanded['elicit'] ?? '') === 'belief in Santa Claus',
    'Missing semantic sources reuse the first cached semantic string'
);
assertTrue(
    muginPublicSearchCachedFreetextQueriesCoverSelectedSources($elicitOnly, $expanded),
    'Expanded cache covers a newly selected semantic source without a new LLM translation'
);

$withPubmedOverride = $coverRequest;
$withPubmedOverride['sources'] = ['pubmed', 'semanticScholar'];
$withPubmedOverride['queryOverrides'] = ['pubmed' => '("santa claus"[tiab]) AND extra'];
$cacheWithoutPubmed = $normalized;
unset($cacheWithoutPubmed['pubmed']);
assertTrue(
    muginPublicSearchCachedFreetextQueriesCoverSelectedSources($withPubmedOverride, $cacheWithoutPubmed),
    'An edited PubMed string counts as covering pubmed so freetext is not translated again'
);

$changedLimits = $coverRequest;
$changedLimits['hardFilters'] = [
    'publicationTypes' => ['review'],
];
$changedLimits['intentContext']['selectedLimitIds'] = ['REV'];
$resolvedChangedLimits = muginPublicSearchBuildResolvedQueries($changedLimits);
assertTrue(
    ($resolvedChangedLimits['cachedFreetextQueriesUsed'] ?? false) === true,
    'Changing limits still reuses the cached freetext translation'
);
assertTrue(
    strpos((string) ($resolvedChangedLimits['pubmedQuery'] ?? ''), '"santa claus"[tiab]') !== false,
    'Changed limits keep the cached PubMed freetext clause'
);

$applied = muginPublicSearchApplyCachedFreetextQueriesToDraft(
    $coverRequest,
    'findes julemanden?',
    [],
    $normalized,
    null
);
assertTrue($applied['applied'] === true, 'Cached freetext draft is marked applied');
assertTrue(
    $applied['pubmedQuery'] === '"santa claus"[tiab]',
    'Cached PubMed clause replaces the raw freetext before topics/limits'
);
assertTrue(
    ($applied['sourceQueryPlan']['semanticScholar']['query'] ?? '') === 'belief in Santa Claus',
    'Cached Semantic Scholar query is applied to the source plan'
);

$resolved = muginPublicSearchBuildResolvedQueries($coverRequest);
assertTrue(
    ($resolved['freetextPubMedQuery'] ?? '') === '"santa claus"[tiab]',
    'BuildResolvedQueries returns the reused freetext PubMed clause'
);
assertTrue(
    strpos((string) ($resolved['pubmedQuery'] ?? ''), 'findes julemanden?') === false,
    'Resolved PubMed query does not fall back to the raw freetext'
);
assertTrue(
    strpos((string) ($resolved['pubmedQuery'] ?? ''), '"santa claus"[tiab]') !== false,
    'Resolved PubMed query keeps the cached translation'
);
assertTrue(
    ($resolved['sourceQueryPlan']['semanticScholar']['query'] ?? '') === 'belief in Santa Claus',
    'BuildResolvedQueries reuses the cached Semantic Scholar string'
);
assertTrue(
    ($resolved['cachedFreetextQueriesUsed'] ?? false) === true,
    'BuildResolvedQueries records that cached freetext queries were used'
);

$withOverride = $coverRequest;
$withOverride['queryOverrides'] = ['semanticScholar' => 'belief in Santa Claus edited'];
$resolvedOverride = muginPublicSearchBuildResolvedQueries($withOverride);
assertTrue(
    ($resolvedOverride['sourceQueryPlan']['semanticScholar']['query'] ?? '') === 'belief in Santa Claus edited',
    'An edited Semantic Scholar string still wins over the cached translation'
);
assertTrue(
    strpos((string) ($resolvedOverride['pubmedQuery'] ?? ''), '"santa claus"[tiab]') !== false,
    'PubMed still reuses the cached freetext translation when only Semantic Scholar was edited'
);

$payload = [
    'apiVersion' => '1',
    'query' => ['text' => 'findes julemanden?', 'language' => 'da'],
    'sources' => ['pubmed'],
    'cachedFreetextQueries' => [
        'input' => 'findes julemanden?',
        'pubmed' => '"santa claus"[tiab]',
    ],
];
$fromPost = muginPublicSearchNormalizePostRequest($payload);
assertTrue(
    ($fromPost['cachedFreetextQueries']['pubmed'] ?? '') === '"santa claus"[tiab]',
    'NormalizePostRequest keeps cachedFreetextQueries'
);

try {
    muginPublicSearchNormalizePostRequest([
        'apiVersion' => '1',
        'query' => ['text' => 'x', 'language' => 'da'],
        'sources' => ['pubmed'],
        'cachedFreetextQueries' => 'nope',
    ]);
    assertTrue(false, 'Non-object cachedFreetextQueries should be rejected');
} catch (InvalidArgumentException $exception) {
    assertTrue(
        strpos($exception->getMessage(), 'cachedFreetextQueries') !== false,
        'Non-object cachedFreetextQueries is rejected'
    );
}

$freetextStandardPayload = [
    'apiVersion' => '1',
    'query' => ['text' => 'findes julemanden?', 'language' => 'da'],
    'domain' => 'template',
    'sources' => ['pubmed'],
    'cachedFreetextQueries' => [
        'input' => 'findes julemanden?',
        'pubmed' => '"santa claus"[tiab]',
    ],
    'intentContext' => [
        'selectedTopicGroups' => [[
            ['custom' => true, 'rawText' => 'findes julemanden?', 'scope' => 'normal'],
        ]],
    ],
];
$addFalse = $freetextStandardPayload;
$addFalse['standardString'] = ['add' => false];
$fromPostAddIgnored = muginPublicSearchNormalizePostRequest($addFalse);
assertTrue(
    ($fromPostAddIgnored['_applyStandardStringToFreetext'] ?? true) === false,
    'standardString.add is ignored; catalog standardStringAddToFreetext is used'
);
$resolvedAddIgnored = muginPublicSearchBuildResolvedQueries($fromPostAddIgnored);
assertTrue(
    strpos((string) ($resolvedAddIgnored['pubmedQuery'] ?? ''), 'santa claus') !== false,
    'Freetext translation is still present when catalog add-to-freetext is off'
);

$fromPostAddDefault = muginPublicSearchNormalizePostRequest($freetextStandardPayload);
$resolvedAddDefault = muginPublicSearchBuildResolvedQueries($fromPostAddDefault);
assertTrue(
    ($fromPostAddDefault['_applyStandardStringToFreetext'] ?? true) === false
        && strpos((string) ($resolvedAddDefault['pubmedQuery'] ?? ''), 'santa claus') !== false,
    'Omitting standardString.add follows catalog standardStringAddToFreetext (template: false)'
);

$jsonLangDefault = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'test'],
    'sources' => ['pubmed'],
    'domain' => 'template',
]);
assertTrue(
    ($jsonLangDefault['query']['language'] ?? '') === 'da',
    'JSON without query.language uses response language (da)'
);
$jsonLangEn = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'test'],
    'sources' => ['pubmed'],
    'domain' => 'template',
    'responseOptions' => ['language' => 'en'],
]);
assertTrue(
    ($jsonLangEn['query']['language'] ?? '') === 'en',
    'JSON without query.language follows responseOptions.language'
);

$serverCacheRequest = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'server-cache-julemanden', 'language' => 'da'],
    'translation' => ['mode' => 'auto'],
    'domain' => 'template',
    'sources' => ['pubmed'],
    'responseOptions' => ['noCache' => false],
]);
muginPublicSearchWriteCachedFreetextQueriesToStore($serverCacheRequest, [
    'input' => 'server-cache-julemanden',
    'pubmed' => '"santa claus from server cache"[tiab]',
]);
$fromServerCache = muginPublicSearchBuildResolvedQueries($serverCacheRequest);
assertTrue(
    ($fromServerCache['cachedFreetextQueriesUsed'] ?? false) === true
        && strpos((string) ($fromServerCache['pubmedQuery'] ?? ''), 'santa claus from server cache') !== false,
    'GET/JSON without client cachedFreetextQueries reuse the server freetext cache'
);

echo "OK: cached-freetext-queries smoke test passed\n";
