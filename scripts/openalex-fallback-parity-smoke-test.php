<?php
/**
 * Deterministic OpenAlex semantic-primary + keyword-supplement parity test.
 */

function muginPublicSearchFetchOpenAlexSourceResultSingle(
    string $query,
    array $filters,
    string $domain = '',
    string $apiKeyOverride = '',
    string $searchMode = 'semantic'
): array {
    if ($searchMode === 'keyword') {
        return [
            'source' => 'openAlex',
            'query' => $query,
            'total' => 2,
            'pmids' => ['2'],
            'dois' => ['10.1/shared', '10.1/keyword'],
            'candidates' => [
                ['source' => 'openAlex', 'rank' => 1, 'pmid' => '', 'doi' => '10.1/shared', 'title' => 'Shared'],
                ['source' => 'openAlex', 'rank' => 2, 'pmid' => '2', 'doi' => '10.1/keyword', 'title' => 'Keyword'],
            ],
            'error' => '',
            'warning' => '',
            'partial' => false,
            'rateLimit' => ['status' => 200, 'remaining' => 99],
        ];
    }
    if (($GLOBALS['__qpm_openalex_semantic_mode'] ?? '') === 'fail') {
        return [
            'source' => 'openAlex',
            'query' => $query,
            'total' => 0,
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
            'error' => '',
            'warning' => 'semantic backend unavailable',
            'partial' => true,
            'rateLimit' => ['status' => 503, 'remaining' => 0],
        ];
    }
    if (($GLOBALS['__qpm_openalex_semantic_mode'] ?? '') === 'cap') {
        $candidates = [];
        for ($i = 1; $i <= 50; $i++) {
            $candidates[] = [
                'source' => 'openAlex',
                'rank' => $i,
                'pmid' => (string) $i,
                'doi' => '10.1/cap-' . $i,
                'title' => 'Cap ' . $i,
            ];
        }
        return [
            'source' => 'openAlex',
            'query' => $query,
            'total' => 50,
            'pmids' => array_map('strval', range(1, 50)),
            'dois' => array_map(static fn($i) => '10.1/cap-' . $i, range(1, 50)),
            'candidates' => $candidates,
            'error' => '',
            'warning' => '',
            'partial' => false,
            'rateLimit' => ['status' => 200, 'remaining' => 100],
        ];
    }
    return [
        'source' => 'openAlex',
        'query' => $query,
        'total' => 2,
        'pmids' => ['1'],
        'dois' => ['10.1/shared', '10.1/semantic'],
        'candidates' => [
            ['source' => 'openAlex', 'rank' => 1, 'pmid' => '1', 'doi' => '10.1/semantic', 'title' => 'Semantic'],
            ['source' => 'openAlex', 'rank' => 2, 'pmid' => '', 'doi' => '10.1/shared', 'title' => 'Shared'],
        ],
        'error' => '',
        'warning' => '',
        'partial' => false,
        'rateLimit' => ['status' => 200, 'remaining' => 100],
    ];
}

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-process-details.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    echo ($condition ? 'PASS' : 'FAIL') . ': ' . $message . PHP_EOL;
    if (!$condition) {
        exit(1);
    }
}

$GLOBALS['__qpm_openalex_semantic_mode'] = 'filter';
$result = muginPublicSearchFetchOpenAlexSourceResult('santa claus', [
    'language' => ['en', 'da'],
    'sourceType' => [],
    'workType' => ['article'],
    'publicationYear' => '',
], 'template');

assertTrue(count($result['candidates']) === 2, 'Filtered semantic search keeps semantic candidates');
assertTrue(($result['fallbackUsed'] ?? false) === false, 'Filters no longer trigger keyword');
assertTrue(($result['requestMeta']['keywordSupplementAttempted'] ?? false) === false, 'Keyword is not attempted when semantic returns candidates');
assertTrue(
    ($result['requestMeta']['disabledRequestFields'] ?? []) === [],
    'Semantic search no longer defers filter fields'
);

$GLOBALS['__qpm_openalex_semantic_mode'] = 'cap';
$capResult = muginPublicSearchFetchOpenAlexSourceResult('santa claus', [], 'template');
assertTrue(count($capResult['candidates']) >= 50, 'Semantic cap is returned without a keyword merge');
assertTrue(($capResult['requestMeta']['keywordSupplementAttempted'] ?? false) === false, 'Cap path does not attempt keyword');
assertTrue(($capResult['fallbackReason'] ?? '') === '', 'Cap path keeps an empty fallback reason');

$GLOBALS['__qpm_openalex_semantic_mode'] = 'fail';
$failResult = muginPublicSearchFetchOpenAlexSourceResult('santa claus', [], 'template');
assertTrue(count($failResult['candidates']) === 2, 'Semantic-fail replaces with keyword candidates');
assertTrue(($failResult['fallbackUsed'] ?? false) === true, 'Semantic-fail records fallback usage');
assertTrue(($failResult['fallbackReason'] ?? '') === 'keyword', 'Semantic-fail reason is keyword');

$GLOBALS['__qpm_openalex_semantic_mode'] = 'filter';
$clean = muginPublicSearchFetchOpenAlexSourceResult('santa claus', [], 'template');
assertTrue(($clean['requestMeta']['fallbackUsed'] ?? false) === false, 'Unfiltered below-cap semantic skips keyword');
assertTrue(count($clean['candidates']) === 2, 'Unfiltered semantic returns primary candidates only');

$designs = muginPublicSearchMapHardFiltersToOpenAlexStudyDesigns(
    ['systematic review', 'meta-analysis', 'review', 'cochrane review'],
    ['randomized controlled trial', 'cohort study']
);
assertTrue($designs === ['systematic-review', 'randomized-controlled-trial'], 'Only RCT and systematic review map to OpenAlex study designs');

$andSpec = muginPublicSearchBuildOpenAlexSourceRequestSpec('diabetes', [
    'studyDesigns' => ['systematic-review', 'randomized-controlled-trial'],
    'language' => ['en'],
], 'template', '', 'semantic');
$andUrl = (string) ($andSpec['url'] ?? '');
assertTrue(strpos($andUrl, 'study_designs.id%3Asystematic-review') !== false || strpos($andUrl, 'study_designs.id:systematic-review') !== false, 'Systematic review design is sent');
assertTrue(strpos($andUrl, 'study_designs.id%3Arandomized-controlled-trial') !== false || strpos($andUrl, 'study_designs.id:randomized-controlled-trial') !== false, 'RCT design is sent');
assertTrue(strpos($andUrl, 'rerank') === false, 'Semantic request does not send rerank');
assertTrue(substr_count($andUrl, 'study_designs.id') === 2, 'Two study designs are separate AND clauses');

$journalWork = [
    'language' => 'en',
    'type' => 'article',
    'primary_location' => ['source' => ['type' => 'conference']],
    'study_designs' => [],
    'open_access' => ['is_oa' => false],
    'authorships' => [],
];
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($journalWork, ['sourceFormats' => ['journal']]) === false,
    'Journal-only selection drops a conference source'
);
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($journalWork, ['sourceFormats' => ['journal', 'conference']]) === true,
    'Journal plus conference keeps a conference source'
);
$untagged = $journalWork;
$untagged['primary_location']['source']['type'] = 'journal';
unset($untagged['study_designs']);
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, ['studyDesigns' => ['randomized controlled trial']]) === true,
    'A missing study_designs key is not treated as untagged'
);
$untagged['study_designs'] = [];
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, ['studyDesigns' => ['randomized controlled trial']]) === false,
    'An empty study_designs list is dropped when RCT is required'
);
$untagged['study_designs'] = [['id' => 'https://openalex.org/study-designs/randomized-controlled-trial']];
$untagged['language'] = '';
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, [
        'studyDesigns' => ['randomized controlled trial'],
        'languages' => ['en'],
    ]) === false,
    'A work with no language is dropped when a language is required'
);
$untagged['language'] = 'en';
$untagged['authorships'] = [[
    'institutions' => [['country_code' => 'DE', 'continent' => 'europe']],
]];
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, ['filterProfiles' => ['western-countries']]) === true,
    'A European institution counts as western'
);
$untagged['authorships'] = [[
    'institutions' => [['country_code' => 'BR', 'continent' => 'south-america']],
]];
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, ['filterProfiles' => ['western-countries']]) === false,
    'A non-western institution country is dropped'
);
$untagged['authorships'] = [];
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, ['filterProfiles' => ['western-countries']]) === true,
    'A work with no institution country is kept'
);
$untagged['open_access'] = ['is_oa' => false];
assertTrue(
    muginPublicSearchCandidateMatchesOpenAlexDoiFilters($untagged, [], ['isOa' => true]) === false,
    'Open access requires is_oa true'
);

echo PHP_EOL . 'All OpenAlex fallback parity smoke tests passed.' . PHP_EOL;
