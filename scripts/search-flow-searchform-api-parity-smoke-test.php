<?php
/**
 * End-to-end search-flow checks: SearchForm JSON and GET/API share the same
 * resolved PubMed / semantic queries for catalog, limits, freetext and AI-off.
 *
 * Run: php scripts/search-flow-searchform-api-parity-smoke-test.php
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

$ladaExplanation = 'latent autoimmune diabetes in adults (LADA)';
$incidenceExplanation = 'cohort and other longitudinal observational studies that follow people over time';

function searchFlowSnapshot(array $resolved): array
{
    $plan = is_array($resolved['sourceQueryPlan'] ?? null) ? $resolved['sourceQueryPlan'] : [];
    return [
        'pubmedQuery' => (string) ($resolved['pubmedQuery'] ?? ''),
        'hardFilterQuery' => (string) ($resolved['hardFilterQuery'] ?? ''),
        'freetextPubMedQuery' => (string) ($resolved['freetextPubMedQuery'] ?? ''),
        'semanticIntent' => (string) ($resolved['semanticIntent'] ?? ''),
        'openAlexQuery' => (string) ($plan['openAlex']['query'] ?? ''),
        'openAlexWorkType' => array_values((array) ($plan['openAlex']['filters']['workType'] ?? [])),
        'semanticScholarQuery' => (string) ($plan['semanticScholar']['query'] ?? ''),
    ];
}

function searchFlowSearchFormLikePayload(array $overrides = []): array
{
    $payload = [
        'query' => ['text' => '', 'language' => 'da'],
        'translation' => ['mode' => 'none'],
        'domain' => 'template',
        'sources' => ['pubmed'],
        'intentContext' => [
            'selectedTopicIds' => ['S010060'],
            'selectedTopicGroups' => [[
                ['id' => 'S010060', 'custom' => false, 'scope' => 'normal'],
            ]],
            'selectedLimitIds' => [],
            'selectedLimitGroups' => [],
            'selectedTopics' => ['LADA'],
            'selectedLimits' => [],
            'semanticBlocks' => ['latent autoimmune diabetes in adults (LADA)'],
            'contextualSearchInput' => 'latent autoimmune diabetes in adults (LADA)',
            'rawUserInput' => '',
        ],
    ];
    return array_replace_recursive($payload, $overrides);
}

// 1. Catalog-only PubMed, AI off: SearchForm JSON vs GET, catalog strings not explanations.
$searchFormPubmed = muginPublicSearchNormalizePostRequest(searchFlowSearchFormLikePayload());
$getPubmed = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed',
    'topic' => 'S010060#s',
    'ai' => 'false',
]);
$resolvedFormPubmed = muginPublicSearchBuildResolvedQueries($searchFormPubmed);
$resolvedGetPubmed = muginPublicSearchBuildResolvedQueries($getPubmed);
$formPubmedSnap = searchFlowSnapshot($resolvedFormPubmed);
$getPubmedSnap = searchFlowSnapshot($resolvedGetPubmed);

assertTrue(
    $formPubmedSnap['pubmedQuery'] === $getPubmedSnap['pubmedQuery']
        && $formPubmedSnap['pubmedQuery'] !== '',
    'SearchForm JSON and GET resolve the same catalog-only PubMed query'
);
assertTrue(
    strpos($formPubmedSnap['pubmedQuery'], 'Latent Autoimmune Diabetes in Adults') !== false
        && strpos($formPubmedSnap['pubmedQuery'], '[mh]') !== false,
    'Catalog-only PubMed uses topics.json searchStrings'
);
assertTrue(
    $formPubmedSnap['pubmedQuery'] !== $ladaExplanation
        && strpos($formPubmedSnap['pubmedQuery'], $ladaExplanation) === false,
    'AI explanation is not used as the PubMed search string'
);
assertTrue(
    $formPubmedSnap['freetextPubMedQuery'] === '',
    'Catalog-only PubMed does not invent a freetext PubMed clause'
);
assertTrue(
    ($searchFormPubmed['query']['language'] ?? '') === ($getPubmed['query']['language'] ?? '')
        && ($searchFormPubmed['query']['language'] ?? '') === 'da'
        && ($searchFormPubmed['intentContext']['rawUserInput'] ?? 'x') === ($getPubmed['intentContext']['rawUserInput'] ?? 'y')
        && ($searchFormPubmed['intentContext']['rawUserInput'] ?? 'x') === ''
        && ($searchFormPubmed['intentContext']['semanticBlocks'] ?? []) === ($getPubmed['intentContext']['semanticBlocks'] ?? [])
        && ($searchFormPubmed['intentContext']['contextualSearchInput'] ?? '') === ($getPubmed['intentContext']['contextualSearchInput'] ?? ''),
    'SearchForm JSON and GET share language, empty rawUserInput and catalog semantic seed'
);

// 2. PubMed-only + AI auto still stays on catalog strings (no freetext → no PubMed LLM).
$autoPubmed = muginPublicSearchNormalizePostRequest(searchFlowSearchFormLikePayload([
    'translation' => ['mode' => 'auto'],
]));
$resolvedAutoPubmed = muginPublicSearchBuildResolvedQueries($autoPubmed);
assertTrue(
    searchFlowSnapshot($resolvedAutoPubmed)['pubmedQuery'] === $formPubmedSnap['pubmedQuery'],
    'PubMed-only catalog + AI auto does not rewrite catalog searchStrings'
);

// 3. Catalog + OpenAlex, AI off: PubMed stays catalog; OpenAlex uses the explanation seed.
$searchFormMixed = muginPublicSearchNormalizePostRequest(searchFlowSearchFormLikePayload([
    'sources' => ['pubmed', 'openAlex'],
]));
$getMixed = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed,openAlex',
    'topic' => 'S010060#s',
    'ai' => 'false',
]);
$formMixedSnap = searchFlowSnapshot(muginPublicSearchBuildResolvedQueries($searchFormMixed));
$getMixedSnap = searchFlowSnapshot(muginPublicSearchBuildResolvedQueries($getMixed));
assertTrue(
    $formMixedSnap === $getMixedSnap,
    'SearchForm JSON and GET match for catalog + OpenAlex with AI off'
);
assertTrue(
    $formMixedSnap['pubmedQuery'] === $formPubmedSnap['pubmedQuery'],
    'Adding OpenAlex does not change the catalog PubMed string'
);
assertTrue(
    $formMixedSnap['openAlexQuery'] === $ladaExplanation
        && $formMixedSnap['semanticIntent'] === $ladaExplanation,
    'AI-off semantic query is the English explanation, not PubMed syntax'
);
assertTrue(
    strpos($formMixedSnap['openAlexQuery'], '[mh]') === false,
    'OpenAlex does not receive PubMed tags from the catalog string'
);

// 4. Topic + hard-filter + semantic limit: PubMed ANDs filters; OpenAlex keeps semantic text only.
$comboOverrides = [
    'sources' => ['pubmed', 'openAlex'],
    'intentContext' => [
        'selectedTopicIds' => ['S010060'],
        'selectedTopicGroups' => [[
            ['id' => 'S010060', 'custom' => false, 'scope' => 'normal'],
        ]],
        'selectedLimitIds' => ['L010010', 'L020020'],
        'selectedLimitGroups' => [
            [['id' => 'L010010', 'scope' => 'normal']],
            [['id' => 'L020020', 'scope' => 'normal']],
        ],
        'selectedTopics' => ['LADA'],
        'selectedLimits' => ['Systematic reviews', 'Incidence and prevalence studies'],
        'semanticBlocks' => [$ladaExplanation, $incidenceExplanation],
        'contextualSearchInput' => $ladaExplanation . '. ' . $incidenceExplanation,
        'rawUserInput' => '',
    ],
];
$searchFormCombo = muginPublicSearchNormalizePostRequest(searchFlowSearchFormLikePayload($comboOverrides));
$getCombo = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed,openAlex',
    'topic' => 'S010060#s',
    'limit' => ['L010010', 'L020020'],
    'ai' => 'false',
]);
$formComboSnap = searchFlowSnapshot(muginPublicSearchBuildResolvedQueries($searchFormCombo));
$getComboSnap = searchFlowSnapshot(muginPublicSearchBuildResolvedQueries($getCombo));
$combinedPubMed = muginPublicSearchCombinePubMedQuery(
    $formComboSnap['pubmedQuery'],
    $formComboSnap['hardFilterQuery']
);

assertTrue(
    $formComboSnap['pubmedQuery'] === $getComboSnap['pubmedQuery']
        && $formComboSnap['hardFilterQuery'] === $getComboSnap['hardFilterQuery']
        && $formComboSnap['openAlexQuery'] === $getComboSnap['openAlexQuery'],
    'SearchForm JSON and GET match for topic + hard-filter + semantic limit'
);
assertTrue(
    strpos($formComboSnap['pubmedQuery'], 'Latent Autoimmune Diabetes in Adults') !== false
        && strpos($formComboSnap['hardFilterQuery'], 'systematic') !== false,
    'PubMed keeps catalog topics and puts systematic reviews in hardFilterQuery'
);
assertTrue(
    $combinedPubMed !== $formComboSnap['pubmedQuery']
        && strpos($combinedPubMed, $formComboSnap['pubmedQuery']) !== false,
    'Executed PubMed term is catalog AND hard-filter limits'
);
assertTrue(
    $formComboSnap['openAlexQuery'] === $ladaExplanation . '. ' . $incidenceExplanation
        && strpos($formComboSnap['openAlexQuery'], 'systematic reviews and meta-analyses') === false,
    'OpenAlex seed is topic + semantic-limit explanations, not the hard-filter gloss'
);
assertTrue(
    in_array('review', $formComboSnap['openAlexWorkType'], true)
        && in_array('review', $getComboSnap['openAlexWorkType'], true),
    'Systematic reviews still apply as an OpenAlex workType filter on both paths'
);

// 5. Untranslated freetext + catalog, AI off: PubMed ANDs both.
// Public GET follows topics.json standardStringAddToFreetext (template: true).
$freetextPayload = searchFlowSearchFormLikePayload([
    'query' => ['text' => 'julemanden?', 'language' => 'da'],
    'intentContext' => [
        'rawUserInput' => 'julemanden?',
        'contextualSearchInput' => $ladaExplanation,
    ],
]);
$searchFormFreetext = muginPublicSearchNormalizePostRequest($freetextPayload);
$getFreetext = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'julemanden?',
    'domain' => 'template',
    'databases' => 'pubmed',
    'topic' => 'S010060#s',
    'ai' => 'false',
]);
$formFreetextSnap = searchFlowSnapshot(muginPublicSearchBuildResolvedQueries($searchFormFreetext));
$getFreetextSnap = searchFlowSnapshot(muginPublicSearchBuildResolvedQueries($getFreetext));
assertTrue(
    (muginPublicSearchLoadTopicNodeCatalog('template')['standardStringAddToFreetext'] ?? null) === true,
    'template catalog enables standardStringAddToFreetext'
);
assertTrue(
    ($searchFormFreetext['_applyStandardStringToFreetext'] ?? null) === true
        && ($getFreetext['_applyStandardStringToFreetext'] ?? null) === true,
    'SearchForm JSON without add and GET both follow catalog standardStringAddToFreetext'
);
assertTrue(
    $formFreetextSnap['pubmedQuery'] === $getFreetextSnap['pubmedQuery'],
    'JSON without standardString.add matches GET freetext + catalog'
);
assertTrue(
    strpos($formFreetextSnap['pubmedQuery'], 'Latent Autoimmune Diabetes in Adults') !== false
        && strpos($formFreetextSnap['pubmedQuery'], 'julemanden') !== false
        && strpos($formFreetextSnap['pubmedQuery'], '?') === false,
    'AI-off PubMed ANDs catalog strings with sanitized freetext'
);
assertTrue(
    $formFreetextSnap['freetextPubMedQuery'] !== ''
        && strpos($formFreetextSnap['freetextPubMedQuery'], 'julemanden') !== false,
    'Freetext PubMed clause is recorded separately from the catalog string'
);
assertTrue(
    ($searchFormFreetext['intentContext']['rawUserInput'] ?? '') === ($getFreetext['intentContext']['rawUserInput'] ?? '')
        && ($searchFormFreetext['intentContext']['rawUserInput'] ?? '') === 'julemanden?'
        && ($searchFormFreetext['query']['language'] ?? '') === ($getFreetext['query']['language'] ?? ''),
    'SearchForm JSON and GET share freetext rawUserInput and query.language'
);

$standardClause = '"Diabetes Mellitus"[mh] OR diabet*[ti]';
assertTrue(
    substr_count((string) ($formFreetextSnap['pubmedQuery'] ?? ''), $standardClause) >= 2
        && substr_count((string) ($getFreetextSnap['pubmedQuery'] ?? ''), $standardClause) >= 2,
    'SearchForm JSON and GET both AND catalog standardString onto freetext'
);

// 6. Already-translated custom #s:pubmed must not go through AI as query.text.
$translatedCustom = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => '', 'language' => 'auto'],
    'translation' => ['mode' => 'auto'],
    'domain' => 'template',
    'sources' => ['pubmed'],
    'standardString' => ['add' => false, 'scope' => 'normal'],
    'intentContext' => [
        'rawUserInput' => '',
        'contextualSearchInput' => 'insulin[tiab]',
        'selectedTopicGroups' => [[
            [
                'custom' => true,
                'rawText' => 'insulin[tiab]',
                'scope' => 'normal',
                'label' => 'insulin[tiab]',
                'translated' => true,
            ],
        ]],
        'semanticBlocks' => ['insulin[tiab]'],
    ],
]);
$resolvedTranslated = muginPublicSearchBuildResolvedQueries($translatedCustom);
assertTrue(
    ($translatedCustom['query']['text'] ?? null) === ''
        && strpos((string) ($resolvedTranslated['pubmedQuery'] ?? ''), 'insulin[tiab]') !== false,
    '#s:pubmed stays out of query.text and is used as the PubMed clause'
);

// 7. Empty query is rejected on both JSON and GET unless topics/overrides exist.
$threwJson = false;
try {
    muginPublicSearchNormalizePostRequest([
        'query' => ['text' => '', 'language' => 'auto'],
        'sources' => ['pubmed'],
        'domain' => 'template',
    ]);
} catch (InvalidArgumentException $exception) {
    $threwJson = strpos($exception->getMessage(), 'query.text') !== false;
}
$threwGet = false;
try {
    muginPublicSearchBuildRequestFromFlatParams([
        'domain' => 'template',
        'databases' => 'pubmed',
    ]);
} catch (InvalidArgumentException $exception) {
    $threwGet = strpos($exception->getMessage(), 'q is required') !== false;
}
assertTrue($threwJson && $threwGet, 'Empty search without topics is rejected in JSON and GET');

echo PHP_EOL . 'All search-flow SearchForm/API parity smoke tests passed.' . PHP_EOL;
