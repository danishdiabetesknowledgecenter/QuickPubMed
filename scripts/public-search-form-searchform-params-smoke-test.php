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
$request = muginPublicSearchBuildRequestFromFlatParams([
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
$groupedQuery = muginPublicSearchBuildSelectedLimitPubMedQuery(
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
$request2 = muginPublicSearchBuildRequestFromFlatParams([
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
$request2b = muginPublicSearchBuildRequestFromFlatParams([
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
$resolved2b = muginPublicSearchBuildResolvedQueries($request2b);
assertTrue(
    strpos((string) ($resolved2b['pubmedQuery'] ?? ''), 'Carbohydrates') !== false
        && strpos((string) ($resolved2b['pubmedQuery'] ?? ''), 'Diabetes Mellitus, Type 2') !== false,
    'translated custom + catalog both appear in pubmedQuery'
);

// 2c. #s:raw fills query.text; legacy {{…1}}#s still marks translated.
$request2c = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => '{{virker test}}#s:raw',
    'databases' => 'pubmed',
]);
assertTrue($request2c['query']['text'] === 'virker test', 'topic #s:raw fills query.text');
assertTrue(
    ($request2c['intentContext']['selectedTopicGroups'][0][0]['translated'] ?? true) === false,
    'topic #s:raw marks translated=false'
);
$request2d = muginPublicSearchBuildRequestFromFlatParams([
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
$request3 = muginPublicSearchBuildRequestFromFlatParams([
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
$broadQuery = muginPublicSearchBuildSelectedLimitPubMedQuery([
    ['id' => 'L030010', 'scope' => 'broad'],
]);
$normalQuery = muginPublicSearchBuildSelectedLimitPubMedQuery([
    ['id' => 'L030010', 'scope' => 'normal'],
]);
assertTrue(is_string($broadQuery) && is_string($normalQuery), 'scope query builder returns strings');

assertTrue(
    muginParseSelectedIdentifierToken('pmid:12345678') === ['type' => 'pmid', 'value' => '12345678'],
    'parse pmid: prefix'
);
assertTrue(
    muginParseSelectedIdentifierToken('doi:10.38079/igusabder.1540428') === [
        'type' => 'doi',
        'value' => '10.38079/igusabder.1540428',
    ],
    'parse doi: prefix'
);
assertTrue(
    muginParseSelectedIdentifierToken('37956037') === ['type' => 'pmid', 'value' => '37956037'],
    'parse bare pmid'
);
assertTrue(muginParseSelectedIdentifierToken('doi:') === [], 'reject empty doi');
assertTrue(
    muginParseSelectedIdentifierToken('doi:https://doi.org/10.38079/igusabder.1540428') === [
        'type' => 'doi',
        'value' => '10.38079/igusabder.1540428',
    ],
    'parse doi: https://doi.org prefix'
);
assertTrue(
    muginParseSelectedIdentifierToken('https://doi.org/10.3390/PSYCHOLINT6030042') === [
        'type' => 'doi',
        'value' => '10.3390/PSYCHOLINT6030042',
    ],
    'parse bare doi.org URL'
);
assertTrue(
    muginParseSelectedIdentifierToken('10.31373/ejtcm/183021') === [
        'type' => 'doi',
        'value' => '10.31373/ejtcm/183021',
    ],
    'parse bare doi'
);
assertTrue(muginParseSelectedIdentifierToken('doi:not-a-doi') === [], 'reject implausible doi');
assertTrue(
    muginParseSelectedIdentifierToken('doi:10.1002/(sici)1099-0968(200005)8:3<198::aid-erv356>3.0.co;2-3') === [
        'type' => 'doi',
        'value' => '10.1002/(sici)1099-0968(200005)8:3<198::aid-erv356>3.0.co;2-3',
    ],
    'parse wiley-style doi with punctuation'
);
assertTrue(
    muginIsPlausibleDoiValue('10.1234/foo&bar#baz') === true,
    'doi with query-reserved characters is plausible'
);
$requestEncoded = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'selected' => 'doi:' . rawurldecode('10.1234/foo%26bar'),
]);
assertTrue(
    $requestEncoded['preselectedDois'] === ['10.1234/foo&bar'],
    'selected doi keeps decoded ampersand'
);

// 5. pmid tokens (legacy selected alias)
$request5 = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'pmid' => '37956037,39412605',
]);
assertTrue($request5['preselectedPmids'] === ['37956037', '39412605'], 'pmid comma list');
assertTrue(
    $request5['preselectedIdentifiers'] === [
        ['type' => 'pmid', 'value' => '37956037'],
        ['type' => 'pmid', 'value' => '39412605'],
    ],
    'legacy pmid tokens become identifiers'
);

// 5b. selected tokens with mixed pmid/doi
$request5b = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'selected' => 'pmid:12345678,doi:10.38079/igusabder.1540428',
]);
assertTrue($request5b['preselectedPmids'] === ['12345678'], 'selected pmid token');
assertTrue($request5b['preselectedDois'] === ['10.38079/igusabder.1540428'], 'selected doi token');
assertTrue(
    $request5b['preselectedIdentifiers'] === [
        ['type' => 'pmid', 'value' => '12345678'],
        ['type' => 'doi', 'value' => '10.38079/igusabder.1540428'],
    ],
    'selected mixed identifiers preserve order'
);

// 5c. selected wins over legacy pmid
$request5c = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'selected' => 'doi:10.3390/psycholint6030042',
    'pmid' => '37956037',
]);
assertTrue($request5c['preselectedPmids'] === [], 'selected wins over pmid for pmids');
assertTrue($request5c['preselectedDois'] === ['10.3390/psycholint6030042'], 'selected wins over pmid');

// 5d. legacy pmid=doi:… is parsed as DOI
$request5d = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'pmid' => 'doi:10.31373/ejtcm/183021,37956037',
]);
assertTrue($request5d['preselectedPmids'] === ['37956037'], 'legacy pmid keeps numeric ids');
assertTrue($request5d['preselectedDois'] === ['10.31373/ejtcm/183021'], 'legacy pmid doi prefix');

// 6. unknown limit rejected
$threw = false;
try {
    muginPublicSearchBuildRequestFromFlatParams([
        'q' => 'test',
        'databases' => 'pubmed',
        'limit' => 'LNOTEXIST999',
    ]);
} catch (InvalidArgumentException $e) {
    $threw = true;
}
assertTrue($threw, 'unknown limit id rejected');

// 7. UI-only params ignored
$request7 = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'test',
    'databases' => 'pubmed',
    'advanced' => 'false',
    'collapsed' => 'true',
    'apikey' => 'should-be-ignored',
]);
assertTrue($request7['query']['text'] === 'test', 'UI-only params do not break parse');

// 8. GET helper uses flat SearchForm contract (apikey ignored for request build)
$getRequest = muginPublicSearchBuildGetRequestFromQuery([
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
assertTrue(muginPublicSearchGetQueryParam('apikey') === 'secret-from-url', 'apikey= lookup is case-insensitive');
assertTrue(muginPublicSearchGetQueryParam('apiKey') === 'secret-from-url', 'apiKey alias resolves via lowercase');
assertTrue(muginPublicSearchGetQueryParam('pagesize') === '12', 'pagesize lookup is case-insensitive');
$mixedCaseGet = muginPublicSearchBuildRequestFromFlatParams(
    muginPublicSearchParseRawUrlEncodedPreservingLimitGroups($_SERVER['QUERY_STRING'])
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
$parts = muginPublicSearchSplitFlatListValue('{{a,b0}}#s,L030010#s');
assertTrue(
    $parts === ['{{a,b0}}#s', 'L030010#s'],
    'split keeps commas inside {{}}'
);

// 10. Raw urlencoded keeps repeated limit= values
$rawParsed = muginPublicSearchParseRawUrlEncodedPreservingLimitGroups(
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
    . '&mugindebug=1'
    . '&pmid=37956037';
$rawGet = muginPublicSearchParseRawUrlEncodedPreservingLimitGroups($searchFormQuery);
$getFromSearchForm = muginPublicSearchBuildRequestFromFlatParams($rawGet);
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
$rawTopics = muginPublicSearchParseRawUrlEncodedPreservingLimitGroups(
    'topic=T001%23s&topic=T002%23n&databases=pubmed&q=fallback'
);
assertTrue(
    is_array($rawTopics['topic'] ?? null) && count($rawTopics['topic']) === 2,
    'raw parser preserves repeated topic='
);

// 13. Topic groups + scope + template catalog hydration
$topicParity = muginPublicSearchBuildRequestFromFlatParams([
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
$catalogOnly = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'databases' => 'pubmed',
    'topic' => 'S010030#s',
    'ai' => 'false',
]);
assertTrue(
    ($catalogOnly['intentContext']['selectedTopicIds'][0] ?? '') === 'S010030',
    'catalog-only topic request accepted without q'
);

$topicBuilt = muginPublicSearchBuildSelectedTopicPubMedQuery(
    $catalogOnly['intentContext']['selectedTopicGroups'],
    muginPublicSearchLoadTopicNodeCatalog('template')['nodes'] ?? [],
    muginPublicSearchLoadTopicNodeCatalog('template')['standardString'] ?? []
);
assertTrue(
    strpos((string) ($topicBuilt['query'] ?? ''), 'Diabetes Mellitus, Type 2') !== false,
    'S010030 normal searchStrings used in topic PubMed clause'
);

// 15. domain required for catalog topic ids
$threwDomain = false;
try {
    muginPublicSearchBuildRequestFromFlatParams([
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
    muginPublicSearchBuildRequestFromFlatParams([
        'domain' => 'template',
        'databases' => 'pubmed',
        'topic' => 'SNOTEXIST999#s',
    ]);
} catch (InvalidArgumentException $e) {
    $threwTopic = true;
}
assertTrue($threwTopic, 'unknown topic id rejected');

// 17. selection projection always available
$selection = muginPublicSearchBuildSelectionFromRequest($topicParity);
assertTrue(
    ($selection['domain'] ?? '') === 'template'
        && count($selection['topics'] ?? []) === 3
        && ($selection['topics'][0]['items'][0]['custom'] ?? false) === true
        && ($selection['topics'][1]['items'][0]['id'] ?? '') === 'S010030',
    'selection projects custom + catalog topics'
);
$final = muginPublicSearchBuildFinalResponse(
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
$noCacheReq = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'q' => 'test',
    'nocache' => '1',
]);
assertTrue(($noCacheReq['responseOptions']['noCache'] ?? false) === true, 'nocache=1 enables noCache');
$cacheOnReq = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'q' => 'test',
    'nocache' => '0',
]);
assertTrue(($cacheOnReq['responseOptions']['noCache'] ?? true) === false, 'nocache=0 keeps cache on');

// 19. JSON selected tokens
$jsonSelected = muginPublicSearchNormalizePostRequest([
    'apiVersion' => '1',
    'query' => ['text' => 'test', 'language' => 'auto'],
    'sources' => ['pubmed'],
    'selected' => ['pmid:12345678', 'doi:10.38079/igusabder.1540428'],
]);
assertTrue($jsonSelected['preselectedPmids'] === ['12345678'], 'JSON selected pmid');
assertTrue($jsonSelected['preselectedDois'] === ['10.38079/igusabder.1540428'], 'JSON selected doi');

// 20. Freetext-only GET has no queryOverrides (LLM path)
$freetextOnly = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed,semanticscholar',
    'q' => 'Findes julemanden?',
    'ai' => 'true',
]);
assertTrue(
    !array_key_exists('queryOverrides', $freetextOnly),
    'Freetext-only GET does not set queryOverrides'
);
assertTrue(
    ($freetextOnly['query']['text'] ?? '') === 'Findes julemanden?',
    'Freetext-only GET keeps query.text'
);

// 21. topic= + qpubmed= keeps freetext and sets override
$topicWithOverride = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed,semanticscholar',
    'topic' => '{{Findes julemanden?}}#s:raw',
    'qpubmed' => '("santa claus"[tiab]) AND extra',
]);
assertTrue(
    ($topicWithOverride['query']['text'] ?? '') === 'Findes julemanden?',
    'topic= + qpubmed= keeps query.text'
);
assertTrue(
    ($topicWithOverride['queryOverrides']['pubmed'] ?? '') === '("santa claus"[tiab]) AND extra',
    'topic= + qpubmed= sets queryOverrides.pubmed'
);
assertTrue(
    !isset($topicWithOverride['queryOverrides']['semanticScholar']),
    'Partial qpubmed does not invent semanticScholar override'
);

// 22. Comma in qpubmed is kept (raw value, including encoded %2C)
$commaRaw = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'q' => 'test',
    'qpubmed' => '("foo, bar"[tiab]) OR baz',
]);
assertTrue(
    ($commaRaw['queryOverrides']['pubmed'] ?? '') === '("foo, bar"[tiab]) OR baz',
    'Raw comma in qpubmed is preserved'
);
$commaEncoded = muginPublicSearchBuildRequestFromFlatParams(
    muginPublicSearchParseRawUrlEncodedPreservingLimitGroups(
        'databases=pubmed&q=test&qpubmed=%28%22foo%2C%20bar%22%5Btiab%5D%29%20OR%20baz'
    )
);
assertTrue(
    ($commaEncoded['queryOverrides']['pubmed'] ?? '') === '("foo, bar"[tiab]) OR baz',
    'Percent-encoded comma in qpubmed is preserved'
);

// 23. Comma inside topic={{…}} is preserved
$topicComma = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'topic' => '{{findes julemanden, og hvad så?}}#s:raw',
]);
assertTrue(
    ($topicComma['query']['text'] ?? '') === 'findes julemanden, og hvad så?',
    'Comma inside topic={{…}} is preserved'
);
assertTrue(
    !array_key_exists('queryOverrides', $topicComma),
    'topic={{…}} without q* does not set queryOverrides'
);

// 24. Empty qpubmed is ignored; unknown param still rejected
$emptyOverride = muginPublicSearchBuildRequestFromFlatParams([
    'databases' => 'pubmed',
    'q' => 'test',
    'qpubmed' => '   ',
]);
assertTrue(
    !array_key_exists('queryOverrides', $emptyOverride),
    'Whitespace-only qpubmed is omitted'
);
$unknownRejected = false;
try {
    muginPublicSearchBuildRequestFromFlatParams([
        'databases' => 'pubmed',
        'q' => 'test',
        'qunknown' => 'x',
    ]);
} catch (InvalidArgumentException $exception) {
    $unknownRejected = strpos($exception->getMessage(), 'Unsupported parameter') !== false;
}
assertTrue($unknownRejected, 'Unknown parameter is still rejected');
$componentIgnored = muginPublicSearchBuildRequestFromFlatParams([
    'qpubmed' => 'ibuprofen[tiab]',
    'databases' => 'pubmed',
    'component' => '2',
]);
assertTrue(
    ($componentIgnored['queryOverrides']['pubmed'] ?? '') === 'ibuprofen[tiab]',
    'component is UI-only and ignored'
);

$qpubmedOnly = muginPublicSearchBuildRequestFromFlatParams([
    'qpubmed' => 'ibuprofen[tiab]',
    'databases' => 'pubmed',
]);
assertTrue(
    ($qpubmedOnly['query']['text'] ?? null) === ''
        && ($qpubmedOnly['queryOverrides']['pubmed'] ?? '') === 'ibuprofen[tiab]',
    'qpubmed alone is accepted without q/topic'
);
$resolvedQpubmedOnly = muginPublicSearchBuildResolvedQueries($qpubmedOnly);
assertTrue(
    ($resolvedQpubmedOnly['pubmedQuery'] ?? '') === 'ibuprofen[tiab]',
    'qpubmed-only request resolves pubmedQuery from the override'
);
$emptyTopicWithOverride = muginPublicSearchBuildRequestFromFlatParams([
    'topic' => '{{}}#s:raw',
    'qpubmed' => 'ibuprofen[tiab]',
    'databases' => 'pubmed',
]);
assertTrue(
    ($emptyTopicWithOverride['queryOverrides']['pubmed'] ?? '') === 'ibuprofen[tiab]',
    'Empty {{}} topic plus qpubmed is accepted'
);
$otherSourceOverrideRejected = false;
try {
    muginPublicSearchBuildRequestFromFlatParams([
        'qopenalex' => 'only openalex',
        'databases' => 'pubmed',
    ]);
} catch (InvalidArgumentException $exception) {
    $otherSourceOverrideRejected = strpos($exception->getMessage(), 'q is required') !== false;
}
assertTrue($otherSourceOverrideRejected, 'qopenalex alone does not satisfy pubmed-only search');

// 25. Raw freetext PubMed sanitizer (translation=none only)
$sanitized = muginPublicSearchNormalizeRawFreetextForPubMed('hvad virker? insulin & metformin');
assertTrue(
    ($sanitized['value'] ?? '') === 'hvad virker insulin metformin' && ($sanitized['changed'] ?? false) === true,
    'Raw freetext strips ? and &'
);
$unchanged = muginPublicSearchNormalizeRawFreetextForPubMed('insulin[tiab] AND metformin[tiab]');
assertTrue(
    ($unchanged['value'] ?? '') === 'insulin[tiab] AND metformin[tiab]' && ($unchanged['changed'] ?? true) === false,
    'Existing PubMed operators and tags are kept'
);
$onlyMarks = muginPublicSearchNormalizeRawFreetextForPubMed('???');
assertTrue(
    ($onlyMarks['value'] ?? '') === '???' && ($onlyMarks['changed'] ?? true) === false,
    'All-punctuation input is left unchanged rather than emptied'
);
$unpaired = muginPublicSearchNormalizeRawFreetextForPubMed('insulin "metformin');
assertTrue(
    ($unpaired['value'] ?? '') === 'insulin metformin' && ($unpaired['changed'] ?? false) === true,
    'Unpaired quote is dropped'
);

$rawNone = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'hvad virker? insulin & metformin',
    'translation' => 'none',
    'databases' => 'pubmed',
    'domain' => 'template',
]);
$rawNone['standardString'] = ['add' => false, 'scope' => 'normal'];
$resolvedRawNone = muginPublicSearchBuildResolvedQueries($rawNone);
assertTrue(
    ($resolvedRawNone['pubmedQuery'] ?? '') === 'hvad virker insulin metformin',
    'translation=none sanitizes raw freetext into pubmedQuery'
);
assertTrue(
    ($resolvedRawNone['processReports']['searchString']['rawFreetextSanitized'] ?? false) === true,
    'translation=none records rawFreetextSanitized on searchString'
);

$rawOverride = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'hvad virker? insulin & metformin',
    'qpubmed' => 'insulin[tiab] AND metformin[tiab]?',
    'translation' => 'none',
    'databases' => 'pubmed',
    'domain' => 'template',
]);
$resolvedRawOverride = muginPublicSearchBuildResolvedQueries($rawOverride);
assertTrue(
    ($resolvedRawOverride['pubmedQuery'] ?? '') === 'insulin[tiab] AND metformin[tiab]?',
    'qpubmed override is not sanitized'
);
assertTrue(
    empty($resolvedRawOverride['processReports']['searchString']['rawFreetextSanitized']),
    'qpubmed override does not set rawFreetextSanitized'
);

$pubmedClause = muginPublicSearchBuildRequestFromFlatParams([
    'topic' => '{{insulin[tiab]?}}#s:pubmed',
    'databases' => 'pubmed',
    'domain' => 'template',
]);
$resolvedPubmedClause = muginPublicSearchBuildResolvedQueries($pubmedClause);
assertTrue(
    strpos((string) ($resolvedPubmedClause['pubmedQuery'] ?? ''), 'insulin[tiab]?') !== false
        && empty($resolvedPubmedClause['processReports']['searchString']['rawFreetextSanitized']),
    '#s:pubmed clause is not sanitized'
);

if ($failures > 0) {
    fwrite(STDERR, "\n{$failures} smoke assertion(s) failed.\n");
    exit(1);
}
echo "\nAll public-search form SearchForm-params smoke tests passed.\n";
