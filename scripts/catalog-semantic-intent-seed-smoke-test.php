<?php
/**
 * Catalog-only semantic intent uses dropdown explanations as the LLM seed.
 *
 * Run: php scripts/catalog-semantic-intent-seed-smoke-test.php
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

assertTrue(
    muginPublicSearchIntentContextHasDropdownSelections([
        'selectedTopics' => ['LADA'],
    ]) === true,
    'Selected topic labels count as dropdown selections'
);
assertTrue(
    muginPublicSearchIntentContextHasDropdownSelections([
        'selectedLimitIds' => ['L010010'],
    ]) === true,
    'Selected limit ids count as dropdown selections'
);
assertTrue(
    muginPublicSearchIntentContextHasDropdownSelections([
        'rawUserInput' => 'kun fritekst',
        'contextualSearchInput' => 'Filters handled outside semantic text: Systematic reviews.',
        'semanticBlocks' => ['stale leftover'],
        'selectedTopicGroups' => [[]],
    ]) === false,
    'Freetext, leftover blocks or empty groups are not dropdown selections'
);

$seedFromBlocks = muginPublicSearchResolveCatalogSemanticSeedText([
    'contextualSearchInput' => 'should not win over structured explanations',
    'semanticBlocks' => [
        'latent autoimmune diabetes in adults (LADA)',
        'Type 2 diabetes',
    ],
    'selectedTopics' => ['LADA', 'Type 2 diabetes'],
    'rawUserInput' => '(LADA ELLER Type 2-diabetes)',
]);
assertTrue(
    $seedFromBlocks === 'latent autoimmune diabetes in adults (LADA). Type 2 diabetes',
    'semanticBlocks win over contextualSearchInput and Danish labels'
);

$seedFromContextual = muginPublicSearchResolveCatalogSemanticSeedText([
    'contextualSearchInput' => 'latent autoimmune diabetes in adults (LADA). Type 2 diabetes',
    'selectedTopics' => ['LADA', 'Type 2 diabetes'],
]);
assertTrue(
    $seedFromContextual === 'latent autoimmune diabetes in adults (LADA). Type 2 diabetes',
    'contextualSearchInput is used when semanticBlocks are empty'
);

$seedFromTitles = muginPublicSearchResolveCatalogSemanticSeedText([
    'selectedTopics' => ['Type 2 diabetes'],
    'selectedLimits' => ['Systematic reviews'],
]);
assertTrue(
    $seedFromTitles === 'Type 2 diabetes Systematic reviews',
    'English titles are the fallback when no explanation exists'
);

$seedFromBoilerplate = muginPublicSearchResolveCatalogSemanticSeedText([
    'contextualSearchInput' => 'Filters handled outside semantic text: Systematic reviews.',
    'selectedLimits' => ['Systematic reviews'],
    'rawUserInput' => '(Systematiske reviews)',
]);
assertTrue(
    $seedFromBoilerplate === 'Systematic reviews',
    'Hard-filter boilerplate is not used as the semantic seed'
);

assertTrue(
    muginPublicSearchResolveCatalogSemanticSeedText([
        'selectedTopicIds' => ['S010060'],
        'rawUserInput' => '',
    ]) === '',
    'Catalog ids are not used as English seed text'
);

assertTrue(
    muginPublicSearchRequestHasSemanticSources(['sources' => ['pubmed']]) === false,
    'PubMed-only is not a semantic-source request'
);
assertTrue(
    muginPublicSearchRequestHasSemanticSources(['sources' => ['pubmed', 'openAlex']]) === true,
    'OpenAlex counts as a semantic source'
);

assertTrue(
    muginPublicSearchCachedFreetextQueriesMatchInput(
        [
            'input' => 'latent autoimmune diabetes in adults (LADA)',
            'openAlex' => 'LADA diabetes',
        ],
        ''
    ) === false,
    'Cached freetext queries do not match an empty catalog-only query.text'
);

assertTrue(
    muginPublicSearchTopicNodeSemanticIntentText([
        'translations' => ['en' => 'LADA'],
        'semanticConfig' => [
            'sourceContext' => ['en' => 'latent autoimmune diabetes in adults (LADA)'],
        ],
    ], 'LADA') === 'latent autoimmune diabetes in adults (LADA)',
    'Topic sourceContext.en is preferred over the English title'
);
assertTrue(
    muginPublicSearchTopicNodeSemanticIntentText([
        'translations' => ['en' => 'Type 2 diabetes'],
    ], 'Type 2 diabetes') === 'Type 2 diabetes',
    'Empty sourceContext falls back to the English title'
);

$hydratedLada = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => '', 'language' => 'auto'],
    'translation' => ['mode' => 'auto'],
    'domain' => 'template',
    'sources' => ['pubmed', 'openAlex'],
    'intentContext' => [
        'selectedTopicIds' => ['S010060'],
    ],
]);
$ladaBlocks = $hydratedLada['intentContext']['semanticBlocks'] ?? [];
$ladaSeed = muginPublicSearchResolveCatalogSemanticSeedText($hydratedLada['intentContext']);
assertTrue(
    in_array('latent autoimmune diabetes in adults (LADA)', $ladaBlocks, true)
        && $ladaSeed === 'latent autoimmune diabetes in adults (LADA)',
    'Catalog-only topic hydration fills sourceContext.en into semanticBlocks'
);

$limitCatalog = muginPublicSearchLoadLimitNodeCatalog();
assertTrue(
    muginPublicSearchCatalogNodeHasHardSemanticHandling($limitCatalog['L010010'] ?? []) === true,
    'Systematic reviews is a hard filter and stays out of semanticBlocks'
);
assertTrue(
    muginPublicSearchCatalogNodeHasHardSemanticHandling($limitCatalog['L020020'] ?? []) === false,
    'Incidence/prevalence is semantic text, not a hard filter'
);

$parityPayload = [
    'query' => ['text' => '', 'language' => 'auto'],
    'translation' => ['mode' => 'auto'],
    'domain' => 'template',
    'sources' => ['pubmed', 'openAlex'],
    'intentContext' => [
        'selectedTopicIds' => ['S010060'],
        'selectedLimitIds' => ['L010010', 'L020020'],
    ],
];
$jsonParity = muginPublicSearchNormalizePostRequest($parityPayload);
$getParity = muginPublicSearchBuildRequestFromFlatParams([
    'q' => '',
    'domain' => 'template',
    'databases' => 'pubmed,openAlex',
    'topic' => 'S010060#s',
    'limit' => ['L010010', 'L020020'],
    'ai' => 'true',
]);
$ladaExplanation = 'latent autoimmune diabetes in adults (LADA)';
$incidenceExplanation = 'cohort and other longitudinal observational studies that follow people over time';
$searchFormLike = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => '', 'language' => 'auto'],
    'translation' => ['mode' => 'auto'],
    'domain' => 'template',
    'sources' => ['pubmed', 'openAlex'],
    'intentContext' => [
        'selectedTopicIds' => ['S010060'],
        'selectedLimitIds' => ['L010010', 'L020020'],
        'selectedTopics' => ['LADA'],
        'selectedLimits' => ['Systematic reviews', 'Incidence and prevalence studies'],
        'semanticBlocks' => [$ladaExplanation, $incidenceExplanation],
        'contextualSearchInput' => $ladaExplanation . '. ' . $incidenceExplanation,
        'rawUserInput' => '(LADA) OG Systematiske reviews OG Incidens- og prævalensstudier',
    ],
]);

$paritySnapshot = static function (array $request): array {
    $intent = $request['intentContext'] ?? [];
    return [
        'blocks' => array_values((array) ($intent['semanticBlocks'] ?? [])),
        'contextual' => (string) ($intent['contextualSearchInput'] ?? ''),
        'topics' => array_values((array) ($intent['selectedTopics'] ?? [])),
        'limits' => array_values((array) ($intent['selectedLimits'] ?? [])),
        'seed' => muginPublicSearchResolveCatalogSemanticSeedText($intent),
    ];
};
$jsonSnap = $paritySnapshot($jsonParity);
$getSnap = $paritySnapshot($getParity);
$formSnap = $paritySnapshot($searchFormLike);

assertTrue(
    $jsonSnap['blocks'] === [$ladaExplanation, $incidenceExplanation]
        && !in_array('systematic reviews and meta-analyses that synthesize existing research', $jsonSnap['blocks'], true),
    'JSON API: topic + semantic limit explanations, hard-filter limit excluded'
);
assertTrue(
    $getSnap === $jsonSnap,
    'GET/form API matches JSON API for catalog semantic intent fields'
);
assertTrue(
    $formSnap['blocks'] === $jsonSnap['blocks']
        && $formSnap['contextual'] === $jsonSnap['contextual']
        && $formSnap['seed'] === $jsonSnap['seed']
        && $formSnap['topics'] === $jsonSnap['topics']
        && $formSnap['limits'] === $jsonSnap['limits'],
    'SearchForm-shaped JSON payload matches API hydration after normalize'
);
assertTrue(
    $jsonSnap['contextual'] === $ladaExplanation . '. ' . $incidenceExplanation
        && $jsonSnap['seed'] === $jsonSnap['contextual'],
    'contextualSearchInput and catalog seed are the SearchForm semanticCoreText'
);
assertTrue(
    in_array('Systematic reviews', $jsonSnap['limits'], true)
        && in_array('Incidence and prevalence studies', $jsonSnap['limits'], true)
        && in_array('LADA', $jsonSnap['topics'], true),
    'English dropdown titles are still present on selectedTopics/selectedLimits'
);

$hardFilterWithTopic = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed,openAlex',
    'topic' => 'S010060#s',
    'limit' => 'L010010',
    'ai' => 'true',
]);
assertTrue(
    ($hardFilterWithTopic['intentContext']['semanticBlocks'] ?? []) === [$ladaExplanation]
        && in_array('Systematic reviews', (array) ($hardFilterWithTopic['intentContext']['selectedLimits'] ?? []), true)
        && ($hardFilterWithTopic['intentContext']['contextualSearchInput'] ?? '') === $ladaExplanation,
    'GET topic+hard-filter keeps the topic explanation and omits the hard-filter gloss'
);

$freetextHardFilter = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'julemanden',
    'domain' => 'template',
    'databases' => 'openAlex',
    'limit' => 'L010010',
    'ai' => 'true',
]);
assertTrue(
    $freetextHardFilter['query']['text'] === 'julemanden'
        && ($freetextHardFilter['intentContext']['semanticBlocks'] ?? []) === []
        && ($freetextHardFilter['intentContext']['contextualSearchInput'] ?? '')
            === 'Filters handled outside semantic text: Systematic reviews.'
        && muginPublicSearchResolveCatalogSemanticSeedText($freetextHardFilter['intentContext'])
            === 'Systematic reviews',
    'GET freetext+hard-filter matches SearchForm boilerplate contextualSearchInput'
);

$freetextWithTopic = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'julemanden',
    'domain' => 'template',
    'databases' => 'pubmed,openAlex',
    'topic' => 'S010060#s',
    'ai' => 'true',
]);
assertTrue(
    $freetextWithTopic['query']['text'] === 'julemanden'
        && ($freetextWithTopic['intentContext']['semanticBlocks'][0] ?? '') === $ladaExplanation
        && ($freetextWithTopic['intentContext']['contextualSearchInput'] ?? '') === $ladaExplanation,
    'GET freetext+topic prefers catalog explanations as contextualSearchInput, like SearchForm'
);

echo PHP_EOL . 'All catalog semantic-intent seed smoke tests passed.' . PHP_EOL;
