<?php
/**
 * Smoke tests for SearchForm-compatible form-urlencoded public search params.
 */

$configPath = dirname(__DIR__) . '/backend/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/backend/config.php';
}
require_once $configPath;
require_once dirname(__DIR__) . '/backend/app/public-search-lib.php';

$failures = 0;
function assertTrue($condition, string $message): void
{
    global $failures;
    if ($condition) {
        echo "OK  {$message}\n";
        return;
    }
    $failures++;
    echo "FAIL {$message}\n";
}

// 1. Case-insensitive keys + q ≡ query + comma limits + uppercase ids
$request = qpmPublicSearchBuildRequestFromFlatParams([
    'Q' => 'Findes julemanden?',
    'Databases' => 'pubmed,semanticscholar,openalex',
    'Focus' => 'newest-research',
    'AI' => 'true',
    'sort' => 'relevance',
    'page' => '1',
    'pagesize' => '25',
    // One limit= per AND-group (OR within group) — same as SearchForm simple/advanced.
    'limit' => [
        'l025010#s',
        'l030010#s,l030020#s',
        'l040010#s',
        'lxxx010#s',
    ],
]);
assertTrue($request['query']['text'] === 'Findes julemanden?', 'q/Q maps to query.text');
assertTrue(
    $request['sources'] === ['pubmed', 'semanticScholar', 'openAlex'],
    'databases normalizes sources'
);
assertTrue($request['focus'] === 'newest-research', 'focus preserved');
assertTrue($request['translation']['mode'] === 'auto', 'ai=true → translation auto');
assertTrue(
    $request['intentContext']['selectedLimitIds'] === ['L025010', 'L030010', 'L030020', 'L040010', 'LXXX010'],
    'limit ids uppercased and collected'
);
assertTrue(
    count($request['intentContext']['selectedLimitGroups'] ?? []) === 4
        && count($request['intentContext']['selectedLimitGroups'][1] ?? []) === 2,
    'multiple limit= groups preserved (AND between, OR within)'
);
$groupedQuery = qpmPublicSearchBuildSelectedLimitPubMedQuery(
    $request['intentContext']['selectedLimitGroups']
);
assertTrue(
    strpos($groupedQuery, '"English"[la] OR "Danish"[la]') !== false
        && strpos($groupedQuery, ' AND ') !== false,
    'grouped limit query ORs languages and ANDs across groups'
);
assertTrue(
    ($request['hardFilters']['sourceFormats'] ?? []) === ['journal']
        || in_array('journal', (array) ($request['hardFilters']['sourceFormats'] ?? []), true),
    'L025010 hydrates sourceFormats=journal'
);
assertTrue(
    in_array('western-countries', (array) ($request['hardFilters']['filterProfiles'] ?? []), true)
        && in_array('remove-animal-studies', (array) ($request['hardFilters']['filterProfiles'] ?? []), true),
    'L040/LXXX hydrate filterProfiles'
);
assertTrue(
    in_array('JournalArticle', (array) ($request['sourceFilters']['semanticScholar']['publicationTypes'] ?? []), true),
    'L025010 hydrates SS JournalArticle sourceFilter'
);
assertTrue(
    in_array('article', (array) ($request['sourceFilters']['openAlex']['workType'] ?? []), true),
    'L025010 hydrates OA workType=article'
);
assertTrue(
    in_array('source-format-journal', (array) ($request['hardFilters']['postValidationRuleIds'] ?? []), true),
    'L025010 hydrates postValidation rule'
);

// 2. query alias and topic custom free text
$request2 = qpmPublicSearchBuildRequestFromFlatParams([
    'query' => '',
    'topic' => '{{Findes julemanden?0}}#s',
    'databases' => 'pubmed',
    'limit' => 'L030010',
]);
assertTrue($request2['query']['text'] === 'Findes julemanden?', 'topic {{…0}} fills query.text');
assertTrue(
    ($request2['intentContext']['selectedLimitSelections'][0]['scope'] ?? '') === 'normal',
    'missing scope defaults to normal/#s'
);

// 2b. Preferred: {{…}}#s:pubmed must NOT become AI fretext; used as PubMed clause.
$request2b = qpmPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => [
        'S010030#s',
        '{{("Carbohydrates"[mh] OR carb counting[tiab])}}#s:pubmed',
    ],
    'databases' => 'pubmed',
    'ai' => 'false',
]);
assertTrue($request2b['query']['text'] === '', 'topic #s:pubmed does not fill query.text');
assertTrue(
    ($request2b['intentContext']['selectedTopicGroups'][1][0]['translated'] ?? false) === true,
    'topic #s:pubmed marks translated=true'
);
$resolved2b = qpmPublicSearchBuildResolvedQueries($request2b);
assertTrue(
    strpos((string) ($resolved2b['pubmedQuery'] ?? ''), 'Carbohydrates') !== false
        && strpos((string) ($resolved2b['pubmedQuery'] ?? ''), 'Diabetes Mellitus, Type 2') !== false,
    'translated custom + catalog both appear in pubmedQuery'
);

// 2c. #s:raw fills query.text; legacy {{…1}}#s still marks translated.
$request2c = qpmPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => '{{virker test}}#s:raw',
    'databases' => 'pubmed',
]);
assertTrue($request2c['query']['text'] === 'virker test', 'topic #s:raw fills query.text');
assertTrue(
    ($request2c['intentContext']['selectedTopicGroups'][0][0]['translated'] ?? true) === false,
    'topic #s:raw marks translated=false'
);
$request2d = qpmPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => '{{("Carbohydrates"[mh])1}}#s',
    'databases' => 'pubmed',
]);
assertTrue($request2d['query']['text'] === '', 'legacy {{…1}}#s does not fill query.text');
assertTrue(
    ($request2d['intentContext']['selectedTopicGroups'][0][0]['translated'] ?? false) === true,
    'legacy {{…1}}#s marks translated=true'
);

// 3. legacy ;; separators
$request3 = qpmPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed;;openalex',
    'limit' => 'L030010#s;;L030020#b',
]);
assertTrue($request3['sources'] === ['pubmed', 'openAlex'], 'databases accepts ;;');
assertTrue(
    ($request3['intentContext']['selectedLimitSelections'][0]['scope'] ?? '') === 'normal'
        && ($request3['intentContext']['selectedLimitSelections'][1]['scope'] ?? '') === 'broad',
    'per-id scopes from ;; list'
);

// 4. per-id scope affects PubMed clauses when narrow/broad differ
$broadQuery = qpmPublicSearchBuildSelectedLimitPubMedQuery([
    ['id' => 'L030010', 'scope' => 'broad'],
]);
$normalQuery = qpmPublicSearchBuildSelectedLimitPubMedQuery([
    ['id' => 'L030010', 'scope' => 'normal'],
]);
assertTrue(is_string($broadQuery) && is_string($normalQuery), 'scope query builder returns strings');

// 5. pmid tokens
$request5 = qpmPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'pmid' => '37956037,39412605',
]);
assertTrue($request5['preselectedPmids'] === ['37956037', '39412605'], 'pmid comma list');

// 6. unknown limit rejected
$threw = false;
try {
    qpmPublicSearchBuildRequestFromFlatParams([
        'q' => 'test',
        'databases' => 'pubmed',
        'limit' => 'LNOTEXIST999',
    ]);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
assertTrue($threw, 'unknown limit id rejected');

// 7. UI-only params ignored
$request7 = qpmPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'advanced' => 'false',
    'collapsed' => 'true',
    'apikey' => 'should-be-ignored',
]);
assertTrue($request7['query']['text'] === 'test', 'UI-only params do not break parse');

// 8. GET helper uses flat SearchForm contract (apikey ignored for request build)
$getRequest = qpmPublicSearchBuildGetRequestFromQuery([
    'q' => 'test',
    'databases' => 'pubmed',
    'apiKey' => 'dummy',
    'pagesize' => '10',
    'ai' => 'true',
    'advanced' => 'true',
    'collapsed' => 'false',
]);
assertTrue($getRequest['query']['text'] === 'test', 'GET simple path still works with apiKey');
assertTrue($getRequest['page']['size'] === 10, 'GET pagesize maps via flat parser');

// 8b. Query param names are case-insensitive; canonical is lowercase
$prevQuery = $_SERVER['QUERY_STRING'] ?? null;
$prevGet = $_GET;
$_SERVER['QUERY_STRING'] = 'Q=hello&DataBases=pubmed&PageSize=12&APIKEY=secret-from-url&STREAM=true&LANG=en';
$_GET = [
    'Q' => 'hello',
    'DataBases' => 'pubmed',
    'PageSize' => '12',
    'APIKEY' => 'secret-from-url',
    'STREAM' => 'true',
    'LANG' => 'en',
];
assertTrue(qpmPublicSearchGetQueryParam('apikey') === 'secret-from-url', 'apikey= lookup is case-insensitive');
assertTrue(qpmPublicSearchGetQueryParam('apiKey') === 'secret-from-url', 'apiKey alias resolves via lowercase');
assertTrue(qpmPublicSearchGetQueryParam('pagesize') === '12', 'pagesize lookup is case-insensitive');
$mixedCaseGet = qpmPublicSearchBuildRequestFromFlatParams(
    qpmPublicSearchParseRawUrlEncodedPreservingLimitGroups($_SERVER['QUERY_STRING'])
);
assertTrue($mixedCaseGet['query']['text'] === 'hello', 'mixed-case Q= maps to query.text');
assertTrue($mixedCaseGet['page']['size'] === 12, 'mixed-case PageSize maps');
assertTrue($mixedCaseGet['responseOptions']['stream'] === true, 'mixed-case STREAM maps');
assertTrue($mixedCaseGet['responseOptions']['language'] === 'en', 'mixed-case LANG maps');
if ($prevQuery === null) {
    unset($_SERVER['QUERY_STRING']);
} else {
    $_SERVER['QUERY_STRING'] = $prevQuery;
}
$_GET = $prevGet;

// 9. split helper protects {{}}
$parts = qpmPublicSearchSplitFlatListValue('{{a,b0}}#s,L030010#s');
assertTrue(
    $parts === ['{{a,b0}}#s', 'L030010#s'],
    'split keeps commas inside {{}}'
);

// 10. Raw urlencoded keeps repeated limit= values
$rawParsed = qpmPublicSearchParseRawUrlEncodedPreservingLimitGroups(
    'q=test&databases=pubmed&limit=L030010%23s,L030020%23s&limit=L040010%23s'
);
assertTrue(
    is_array($rawParsed['limit'] ?? null) && count($rawParsed['limit']) === 2,
    'raw form parser preserves repeated limit= as AND-groups'
);

// 11. Domain-swap style GET query-string (SearchForm advanced + UI noise)
$searchFormQuery =
    'topic=%7B%7BFindes%20julemanden%3F0%7D%7D%23s'
    . '&databases=pubmed,semanticscholar,openalex'
    . '&focus=newest-research'
    . '&ai=true'
    . '&sort=relevance'
    . '&pagesize=25'
    . '&limit=L025010%23s'
    . '&limit=L030010%23s,L030020%23s'
    . '&limit=L040010%23s'
    . '&advanced=true'
    . '&collapsed=false'
    . '&scrollto=result-1'
    . '&openlimits=true'
    . '&hidelimits=L999'
    . '&orderlimits=L025,L030'
    . '&apibase=https%3A%2F%2Fexample.test'
    . '&qpmdebug=1'
    . '&pmid=37956037';
$rawGet = qpmPublicSearchParseRawUrlEncodedPreservingLimitGroups($searchFormQuery);
$getFromSearchForm = qpmPublicSearchBuildRequestFromFlatParams($rawGet);
assertTrue(
    $getFromSearchForm['query']['text'] === 'Findes julemanden?',
    'GET SearchForm topic custom text → query.text'
);
assertTrue(
    count($getFromSearchForm['intentContext']['selectedLimitGroups'] ?? []) === 3,
    'GET SearchForm repeated limit= preserved as AND-groups'
);
assertTrue(
    $getFromSearchForm['preselectedPmids'] === ['37956037'],
    'GET SearchForm pmid preserved'
);
assertTrue(
    $getFromSearchForm['focus'] === 'newest-research',
    'GET SearchForm focus preserved'
);

// 12. Repeated topic= preserved in raw query parse
$rawTopics = qpmPublicSearchParseRawUrlEncodedPreservingLimitGroups(
    'topic=T001%23s&topic=T002%23n&databases=pubmed&q=fallback'
);
assertTrue(
    is_array($rawTopics['topic'] ?? null) && count($rawTopics['topic']) === 2,
    'raw parser preserves repeated topic='
);

// 13. Topic groups + scope + template catalog hydration
$topicParity = qpmPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed',
    'topic' => [
        '{{virker kulhydrattælling?0}}#s',
        'S010030#s',
        'S010030#b',
    ],
    'ai' => 'false',
]);
assertTrue(
    count($topicParity['intentContext']['selectedTopicGroups'] ?? []) === 3,
    'repeated topic= becomes three AND-groups'
);
assertTrue(
    ($topicParity['intentContext']['selectedTopicGroups'][0][0]['custom'] ?? false) === true
        && ($topicParity['intentContext']['selectedTopicGroups'][0][0]['rawText'] ?? '') === 'virker kulhydrattælling?',
    'custom topic group preserved'
);
assertTrue(
    ($topicParity['intentContext']['selectedTopicGroups'][1][0]['id'] ?? '') === 'S010030'
        && ($topicParity['intentContext']['selectedTopicGroups'][1][0]['scope'] ?? '') === 'normal'
        && ($topicParity['intentContext']['selectedTopicGroups'][1][0]['label'] ?? '') !== '',
    'catalog topic hydrated with label and normal scope'
);
assertTrue(
    ($topicParity['intentContext']['selectedTopicGroups'][2][0]['scope'] ?? '') === 'broad',
    'catalog topic broad scope preserved'
);
assertTrue(
    $topicParity['query']['text'] === 'virker kulhydrattælling?',
    'custom topics fill query.text when q absent'
);
assertTrue(
    in_array('Type 2 diabetes', (array) ($topicParity['intentContext']['selectedTopics'] ?? []), true)
        || ($topicParity['intentContext']['selectedTopicGroups'][1][0]['label'] ?? '') === 'Type 2 diabetes',
    'S010030 English label hydrated'
);

// 14. Catalog-only (no q) accepted with domain
$catalogOnly = qpmPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed',
    'topic' => 'S010030#s',
    'ai' => 'false',
]);
assertTrue(
    ($catalogOnly['intentContext']['selectedTopicIds'][0] ?? '') === 'S010030',
    'catalog-only topic request accepted without q'
);

$topicBuilt = qpmPublicSearchBuildSelectedTopicPubMedQuery(
    $catalogOnly['intentContext']['selectedTopicGroups'],
    qpmPublicSearchLoadTopicNodeCatalog('template')['nodes'] ?? [],
    qpmPublicSearchLoadTopicNodeCatalog('template')['standardString'] ?? []
);
assertTrue(
    strpos((string) ($topicBuilt['query'] ?? ''), 'Diabetes Mellitus, Type 2') !== false,
    'S010030 normal searchStrings used in topic PubMed clause'
);

// 15. domain required for catalog topic ids
$threwDomain = false;
try {
    qpmPublicSearchBuildRequestFromFlatParams([
        'databases' => 'pubmed',
        'topic' => 'S010030#s',
    ]);
} catch (InvalidArgumentException $e) {
    $threwDomain = strpos($e->getMessage(), 'domain') !== false;
}
assertTrue($threwDomain, 'catalog topic without domain rejected');

// 16. unknown topic id rejected
$threwTopic = false;
try {
    qpmPublicSearchBuildRequestFromFlatParams([
        'domain' => 'template',
        'databases' => 'pubmed',
        'topic' => 'SNOTEXIST999#s',
    ]);
} catch (InvalidArgumentException $e) {
    $threwTopic = true;
}
assertTrue($threwTopic, 'unknown topic id rejected');

// 17. selection projection always available
$selection = qpmPublicSearchBuildSelectionFromRequest($topicParity);
assertTrue(
    ($selection['domain'] ?? '') === 'template'
        && count($selection['topics'] ?? []) === 3
        && ($selection['topics'][0]['items'][0]['custom'] ?? false) === true
        && ($selection['topics'][1]['items'][0]['id'] ?? '') === 'S010030',
    'selection projects custom + catalog topics'
);
$final = qpmPublicSearchBuildFinalResponse(
    $topicParity,
    ['pubmedQuery' => 'x', 'semanticIntent' => '', 'hardFilterQuery' => '', 'sourceQueryPlan' => []],
    [],
    0,
    false,
    [],
    'test',
    true
);
assertTrue(isset($final['selection']['topics']), 'BuildFinalResponse includes selection');

// 18. nocache=1 maps to responseOptions.noCache
$noCacheReq = qpmPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'q' => 'test',
    'nocache' => '1',
]);
assertTrue(($noCacheReq['responseOptions']['noCache'] ?? false) === true, 'nocache=1 enables noCache');
$cacheOnReq = qpmPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'q' => 'test',
    'nocache' => '0',
]);
assertTrue(($cacheOnReq['responseOptions']['noCache'] ?? true) === false, 'nocache=0 keeps cache on');

if ($failures > 0) {
    fwrite(STDERR, "\n{$failures} smoke assertion(s) failed.\n");
    exit(1);
}
echo "\nAll public-search form SearchForm-params smoke tests passed.\n";
