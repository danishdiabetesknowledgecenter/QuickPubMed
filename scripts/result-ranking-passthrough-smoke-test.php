<?php
/**
 * Smoke test for additive SearchResult ranking passthrough.
 *
 * Run: php scripts/result-ranking-passthrough-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

$legacyCandidate = [
    'combinedScore' => 1.25,
    'bestRank' => 2,
    'sourceCount' => 2,
    'scoreTieBreaker' => 0.01,
    'scoreBreakdown' => [
        'rrfScore' => 0.8,
        'overlapBonus' => 0.2,
    ],
    'sourceBreakdown' => [
        'pubmed' => ['rank' => 1, 'score' => 0.9],
        'openAlex' => ['rank' => 3, 'score' => 0.4],
    ],
    'sources' => ['pubmed', 'openAlex'],
    'source' => 'pubmed',
    'doi' => '10.1000/example',
];

$unifiedCandidate = [
    'combinedScore' => 2.5,
    'bestRank' => 1,
    'sourceCount' => 2,
    'scoreBreakdown' => [
        'rrfScore' => 1.1,
        'qualityMultiplier' => 1.2,
    ],
    'sourceBreakdown' => [
        [
            'source' => 'pubmed',
            'rank' => 1,
            'rawScore' => 0.95,
            'weight' => 1.0,
            'weightedRrf' => 0.5,
        ],
        [
            'source' => 'semanticScholar',
            'rank' => 4,
            'score' => 0.3,
            'weight' => 0.8,
            'weightedRrf' => 0.2,
        ],
    ],
    'sources' => ['pubmed', 'semanticScholar'],
    'source' => 'pubmed',
];

$legacyRanking = muginPublicSearchExtractResultRanking($legacyCandidate);
assertTrue(is_array($legacyRanking), 'Legacy candidate yields ranking payload');
assertTrue(($legacyRanking['combinedScore'] ?? null) === 1.25, 'Legacy combinedScore preserved');
assertTrue(count($legacyRanking['sourceBreakdown'] ?? []) === 2, 'Legacy map-form normalized to list');
assertTrue(($legacyRanking['sourceBreakdown'][0]['source'] ?? '') === 'pubmed', 'Legacy first source key mapped');
assertTrue(($legacyRanking['sourceBreakdown'][0]['rank'] ?? null) === 1, 'Legacy rank mapped');
assertTrue(($legacyRanking['sourceBreakdown'][1]['source'] ?? '') === 'openAlex', 'Legacy second source key mapped');

$unifiedRanking = muginPublicSearchExtractResultRanking($unifiedCandidate);
assertTrue(is_array($unifiedRanking), 'Unified candidate yields ranking payload');
assertTrue(count($unifiedRanking['sourceBreakdown'] ?? []) === 2, 'Unified list-form kept as list');
assertTrue(($unifiedRanking['sourceBreakdown'][0]['weightedRrf'] ?? null) === 0.5, 'Unified weightedRrf preserved');
assertTrue(($unifiedRanking['sourceBreakdown'][0]['score'] ?? null) === 0.95, 'Unified rawScore mapped to score');
assertTrue(($unifiedRanking['sourceBreakdown'][1]['weight'] ?? null) === 0.8, 'Unified weight preserved');

$emptyRanking = muginPublicSearchExtractResultRanking(['pmid' => '123']);
assertTrue($emptyRanking === null, 'Candidate without scores returns null');

$pubmedResult = muginPublicSearchBuildApiResultFromPubMed(
    [
        'uid' => '12345678',
        'title' => 'Example',
        'fulljournalname' => 'Example Journal',
        'pubdate' => '2024',
        'authors' => [],
        'lang' => ['eng'],
        'pubtype' => ['Journal Article'],
    ],
    'An abstract.',
    1,
    $legacyCandidate + [
        'metadata' => [
            's2FieldsOfStudy' => ['Medicine', 'Education'],
            'primaryTopicDisplayName' => 'Cardiology',
            'openAlexTopics' => ['Heart Failure'],
            'openAlexKeywords' => ['ejection fraction'],
            'openAlexSubfields' => ['Cardiology and Cardiovascular Medicine'],
        ],
    ],
    true,
    ['Diabetes Mellitus'],
    [],
    [],
    ['video lectures']
);
assertTrue(isset($pubmedResult['ranking']), 'BuildApiResultFromPubMed includes ranking when scores exist');
assertTrue(($pubmedResult['pmid'] ?? '') === '12345678', 'Required pmid still present');
assertTrue(($pubmedResult['title'] ?? '') === 'Example', 'Required title still present');
assertTrue(isset($pubmedResult['mergedSources']), 'mergedSources still present');
assertTrue(is_array($pubmedResult['ranking']['sourceBreakdown'] ?? null), 'Ranking sourceBreakdown is list');
$pubmedTopicSources = array_values(array_unique(array_map(
    static fn($topic) => (string) ($topic['source'] ?? ''),
    is_array($pubmedResult['topics'] ?? null) ? $pubmedResult['topics'] : []
)));
assertTrue(in_array('mesh', $pubmedTopicSources, true), 'PubMed topics include mesh');
assertTrue(in_array('pubmedKeyword', $pubmedTopicSources, true), 'PubMed topics include pubmedKeyword');
assertTrue(in_array('semanticScholar', $pubmedTopicSources, true), 'PubMed topics include semanticScholar fields');
assertTrue(in_array('openAlex', $pubmedTopicSources, true), 'PubMed topics include OpenAlex primary topic from candidate');
assertTrue(in_array('openAlexTopic', $pubmedTopicSources, true), 'PubMed topics include OpenAlex topics from candidate');
assertTrue(in_array('openAlexKeyword', $pubmedTopicSources, true), 'PubMed topics include OpenAlex keywords from candidate');
assertTrue(in_array('openAlexSubfield', $pubmedTopicSources, true), 'PubMed topics include OpenAlex subfield from candidate');

$pubmedWithoutScores = muginPublicSearchBuildApiResultFromPubMed(
    [
        'uid' => '87654321',
        'title' => 'No scores',
        'fulljournalname' => 'Example Journal',
        'pubdate' => '2023',
        'authors' => [],
        'lang' => ['eng'],
        'pubtype' => ['Journal Article'],
    ],
    '',
    2,
    ['sources' => ['pubmed'], 'source' => 'pubmed'],
    true
);
assertTrue(!array_key_exists('ranking', $pubmedWithoutScores), 'BuildApiResult omits ranking key without scores');

$openAlexResult = muginPublicSearchBuildApiResultFromOpenAlex(
    [
        'id' => 'https://openalex.org/W123',
        'doi' => 'https://doi.org/10.1000/example',
        'title' => 'OpenAlex example',
        'authorships' => [],
        'primary_location' => ['source' => ['display_name' => 'OA Journal']],
        'publication_year' => 2024,
        'abstract_inverted_index' => null,
        'primary_topic' => [
            'display_name' => 'Medical education',
            'subfield' => ['display_name' => 'Education'],
        ],
        'topics' => [
            ['display_name' => 'Medical education', 'subfield' => ['display_name' => 'Education']],
            ['display_name' => 'Online learning', 'subfield' => ['display_name' => 'Education']],
        ],
        'keywords' => [
            ['display_name' => 'lecture length'],
        ],
    ],
    3,
    $unifiedCandidate + [
        'openAlexId' => 'W123',
        'metadata' => [
            's2FieldsOfStudy' => ['Education'],
        ],
    ]
);
assertTrue(isset($openAlexResult['ranking']), 'BuildApiResultFromOpenAlex includes ranking when scores exist');
assertTrue(($openAlexResult['openAlexId'] ?? '') !== '', 'openAlexId exposed additively');
$openAlexTopicSources = array_values(array_unique(array_map(
    static fn($topic) => (string) ($topic['source'] ?? ''),
    is_array($openAlexResult['topics'] ?? null) ? $openAlexResult['topics'] : []
)));
assertTrue(in_array('openAlex', $openAlexTopicSources, true), 'OpenAlex topics include primary topic');
assertTrue(in_array('openAlexTopic', $openAlexTopicSources, true), 'OpenAlex topics include extra topics');
assertTrue(!in_array('openAlexConcept', $openAlexTopicSources, true), 'OpenAlex concepts are not ingested');
assertTrue(in_array('openAlexKeyword', $openAlexTopicSources, true), 'OpenAlex topics include keywords');
assertTrue(in_array('openAlexSubfield', $openAlexTopicSources, true), 'OpenAlex topics include distinct subfield');
assertTrue(in_array('semanticScholar', $openAlexTopicSources, true), 'OpenAlex topics include semanticScholar fields');
$openAlexTopicLabels = array_map(
    static fn($topic) => (string) ($topic['label'] ?? ''),
    is_array($openAlexResult['topics'] ?? null) ? $openAlexResult['topics'] : []
);
assertTrue(
    count(array_filter($openAlexTopicLabels, static fn($label) => strcasecmp($label, 'Medical education') === 0)) === 1,
    'Primary OpenAlex topic is not duplicated in openAlexTopic'
);

echo "OK: result ranking passthrough smoke test passed\n";
