<?php
/**
 * Smoke test for intentContext request normalization/authorization
 * (muginPublicSearchNormalizePostRequest() / muginPublicSearchAssertIntentContextIdsAreAuthorized()).
 *
 * Run: php scripts/intent-context-normalize-smoke-test.php
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

function assertThrows(callable $fn, string $message): void
{
    try {
        $fn();
    } catch (InvalidArgumentException $exception) {
        echo "PASS: $message\n";
        return;
    }
    fwrite(STDERR, "FAIL: $message (no exception thrown)\n");
    exit(1);
}

// 1. Well-formed intentContext normalizes: trims whitespace, dedupes lists.
$request1 = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'domain' => 'template',
    'intentContext' => [
        'rawUserInput' => '  diabetes treatment  ',
        'contextualSearchInput' => ' type 2 diabetes ',
        'selectedTopicIds' => ['S010030', 'S010030', ' S010040 '],
        'selectedLimitIds' => ['L000010'],
    ],
]);
assertTrue(
    $request1['intentContext']['rawUserInput'] === 'diabetes treatment',
    'rawUserInput is trimmed'
);
$trimContextOnly = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'intentContext' => [
        'contextualSearchInput' => ' type 2 diabetes ',
    ],
]);
assertTrue(
    $trimContextOnly['intentContext']['contextualSearchInput'] === 'type 2 diabetes',
    'contextualSearchInput is trimmed'
);
assertTrue(
    $request1['intentContext']['selectedTopicIds'] === ['S010030', 'S010040'],
    'selectedTopicIds is deduped and trimmed'
);
assertTrue(
    $request1['intentContext']['selectedLimitIds'] === ['L000010'],
    'selectedLimitIds passes through when authorized'
);

// 2. Omitted intentContext defaults to the empty-but-well-formed shape.
$request2 = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
]);
assertTrue(
    $request2['intentContext'] === [
        'rawUserInput' => '',
        'contextualSearchInput' => '',
        'selectedTopicIds' => [],
        'selectedTopicSelections' => [],
        'selectedTopicGroups' => [],
        'selectedLimitIds' => [],
        'selectedLimitSelections' => [],
        'selectedLimitGroups' => [],
        'selectedTopics' => [],
        'selectedLimits' => [],
        'semanticBlocks' => [],
        'ruleIds' => [],
    ],
    'Missing intentContext defaults to the well-formed empty shape'
);

// 3. Unsupported intentContext field is rejected (no arbitrary payload passthrough).
assertThrows(static function (): void {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => 'diabetes', 'language' => 'auto'],
        'sources' => ['pubmed'],
        'intentContext' => ['unexpectedField' => 'x'],
    ]);
}, 'Unsupported intentContext field is rejected');

// 4. Unknown selectedLimitIds are rejected against the limits.json catalog
// (when the catalog is non-empty). Topic ids are authorized against domain topics.json.
$catalog = muginPublicSearchCollectKnownLimitAndTopicIds();
if (!empty($catalog)) {
    assertThrows(static function (): void {
        muginPublicSearchNormalizePostRequest([
            'query' => ['text' => 'diabetes', 'language' => 'auto'],
            'sources' => ['pubmed'],
            'intentContext' => ['selectedLimitIds' => ['definitely-not-a-real-id']],
        ]);
    }, 'Unknown selectedLimitIds are rejected against the known-id catalog');
} else {
    echo "SKIP: limits.json catalog is empty in this environment; authorization check is a no-op by design\n";
}
assertThrows(static function (): void {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => 'diabetes', 'language' => 'auto'],
        'sources' => ['pubmed'],
        'intentContext' => ['selectedTopicIds' => ['S010030']],
    ]);
}, 'Catalog topic ids without domain are rejected');
assertThrows(static function (): void {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => 'diabetes', 'language' => 'auto'],
        'sources' => ['pubmed'],
        'domain' => 'template',
        'intentContext' => ['selectedTopicIds' => ['SNOTEXIST999']],
    ]);
}, 'Unknown selectedTopicIds are rejected against domain topics.json');
$topicOk = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'domain' => 'template',
    'intentContext' => ['selectedTopicIds' => ['S010030']],
]);
assertTrue(
    ($topicOk['intentContext']['selectedTopicIds'][0] ?? '') === 'S010030'
        && ($topicOk['intentContext']['selectedTopicGroups'][0][0]['label'] ?? '') !== '',
    'Valid domain topic ids hydrate with labels'
);

// 5. Arbitrary rule ids are rejected; executable rule definitions must resolve
// from the trusted runtime catalog.
assertThrows(static function (): void {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => 'diabetes', 'language' => 'auto'],
        'sources' => ['pubmed'],
        'intentContext' => ['ruleIds' => ['some-free-form-rule-id']],
    ]);
}, 'Unknown post-validation rule ids are rejected');

// 6. Full SearchForm hard-filter context survives normalization and executable
// clauses/rules are resolved from trusted limits.json ids.
$request6 = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'santa claus', 'language' => 'da'],
    'sources' => ['pubmed', 'openAlex'],
    'hardFilters' => [
        'filterProfiles' => ['western-countries', 'remove-animal-studies'],
        'languages' => ['english', 'danish'],
        'publicationYear' => '',
        'publicationDateYears' => [],
        'publicationTypes' => [],
        'studyDesigns' => [],
        'ageGroups' => [],
        'sourceFormats' => ['journal'],
        'doiOnlyRuleIds' => ['source-format-journal'],
        'postValidationRuleIds' => ['source-format-journal'],
    ],
    'intentContext' => [
        'selectedLimitIds' => ['L030010', 'L030020', 'L040010', 'L025010', 'LXXX010'],
        'ruleIds' => ['source-format-journal'],
    ],
]);
assertTrue(
    $request6['hardFilters']['filterProfiles'] === ['western-countries', 'remove-animal-studies'],
    'Full filterProfiles context survives normalization'
);
assertTrue(
    $request6['hardFilters']['postValidationRuleIds'] === ['source-format-journal'],
    'Post-validation rule ids survive normalization'
);
$selectedLimitQuery = muginPublicSearchBuildSelectedLimitPubMedQuery(
    $request6['intentContext']['selectedLimitIds']
);
assertTrue(
    strpos($selectedLimitQuery, '"English"[la] OR "Danish"[la]') !== false
        && strpos($selectedLimitQuery, '"Developing Countries"[mh]') !== false
        && strpos($selectedLimitQuery, '"Animals"[mh] NOT "Humans"[mh]') !== false,
    'Trusted selected limits reproduce language, geography and animal PubMed clauses'
);
$ruleState = muginPublicSearchBuildPostValidationRuleState($request6);
assertTrue(
    count($ruleState['activeRules']) === 1
        && ($ruleState['activeRules'][0]['id'] ?? '') === 'source-format-journal'
        && count($ruleState['ruleGroups']) === 1,
    'Trusted limits resolve the selected post-validation rule and exclusive group'
);

// 7. SearchForm #s:pubmed: empty query.text + custom translated topic groups.
$request7 = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => '', 'language' => 'auto'],
    'translation' => ['mode' => 'auto'],
    'domain' => 'template',
    'sources' => ['pubmed'],
    'standardString' => ['add' => false, 'scope' => 'normal'],
    'intentContext' => [
        'rawUserInput' => 'insulin[tiab]',
        'contextualSearchInput' => 'insulin[tiab]',
        'selectedTopicIds' => [],
        'selectedTopicGroups' => [[
            [
                'custom' => true,
                'rawText' => 'insulin[tiab]',
                'text' => 'insulin[tiab]',
                'scope' => 'normal',
                'label' => 'insulin[tiab]',
                'translated' => true,
            ],
        ]],
        'selectedLimitIds' => [],
        'selectedLimitGroups' => [],
        'selectedTopics' => [],
        'selectedLimits' => [],
        'semanticBlocks' => ['insulin[tiab]'],
        'ruleIds' => [],
    ],
]);
assertTrue($request7['query']['text'] === '', '#s:pubmed keeps query.text empty');
assertTrue(
    ($request7['intentContext']['selectedTopicSelections'][0]['translated'] ?? false) === true
        && ($request7['intentContext']['selectedTopicSelections'][0]['rawText'] ?? '') === 'insulin[tiab]',
    '#s:pubmed custom topic hydrates into selectedTopicSelections'
);
$resolved7 = muginPublicSearchBuildResolvedQueries($request7);
assertTrue(
    strpos((string) ($resolved7['pubmedQuery'] ?? ''), 'insulin[tiab]') !== false
        && ($request7['query']['text'] ?? null) === '',
    '#s:pubmed groups become pubmedQuery without filling query.text'
);
assertThrows(static function (): void {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => '', 'language' => 'auto'],
        'sources' => ['pubmed'],
    ]);
}, 'Empty query.text without topics is still rejected');
$overrideOnly = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => '', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'queryOverrides' => ['pubmed' => 'ibuprofen[tiab]'],
]);
assertTrue(
    ($overrideOnly['query']['text'] ?? null) === ''
        && ($overrideOnly['queryOverrides']['pubmed'] ?? '') === 'ibuprofen[tiab]',
    'Empty query.text is accepted when a selected-source queryOverride is set'
);
assertThrows(static function (): void {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => '', 'language' => 'auto'],
        'sources' => ['pubmed'],
        'queryOverrides' => ['openAlex' => 'only other source'],
    ]);
}, 'Override for a non-selected source does not satisfy query.text');

echo "\nAll intent-context normalization smoke tests passed.\n";
