<?php
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

$meshQuery = qpmPublicSearchBuildMeshSearchQuery(
    '("Diabetes Mellitus, Type 2"[mh] OR type 2 diabetes[tiab]) AND english[la]',
    'findes julemanden?'
);
assertTrue(
    $meshQuery === 'diabetes mellitus, type 2 type 2 diabetes',
    'meshSearchQuery uses mh/tiab concepts, not hard-filter clauses'
);

$counts = qpmPublicSearchProcessDetailsCountCandidateIdentityBuckets([
    ['pmid' => '1', 'doi' => '10.1/a', 'openAlexId' => ''],
    ['pmid' => '', 'doi' => '10.1/b', 'openAlexId' => 'W123'],
    ['pmid' => '', 'doi' => '10.1/c', 'id' => 'W999', 'source' => 'openAlex'],
]);
assertTrue(
    (int) $counts['openAlexCandidateCount'] === 1,
    'openAlexCandidateCount counts truthy openAlexId only'
);

$languagePass = qpmPublicSearchCandidateMatchesHydratedFilters(
    ['doi' => '10.1/x'],
    [
        'language' => 'fr',
        'publication_year' => 2020,
        'type' => 'article',
        'primary_location' => ['source' => ['type' => 'journal']],
    ],
    [
        'languages' => ['en'],
        'publicationYear' => '',
        'sourceFormats' => [],
        'publicationTypes' => [],
    ]
);
assertTrue($languagePass === true, 'Hydrated DOI path does not language-filter like legacy');

echo PHP_EOL . 'All process-details parity quick checks passed.' . PHP_EOL;
