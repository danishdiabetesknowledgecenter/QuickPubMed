<?php
/**
 * Deterministic full-pool DOI rule/hydration diagnostics parity test.
 */

function qpmPublicSearchFetchOpenAlexWorksByCandidatesParallel(array $entries, string $domain = ''): array
{
    $works = [];
    foreach ($entries as $entry) {
        $doi = (string) ($entry['doi'] ?? '');
        $isJournal = $doi === '10.1/journal';
        $works[(string) $entry['key']] = [
            'id' => 'https://openalex.org/W' . ($isJournal ? '1' : '2'),
            'doi' => $doi,
            'display_name' => $isJournal ? 'Journal article' : 'Conference supplement',
            'publication_year' => 2025,
            'type' => 'article',
            'primary_location' => [
                'source' => [
                    'type' => $isJournal ? 'journal' : 'conference',
                    'display_name' => $isJournal ? 'Medical Journal' : 'Conference Proceedings',
                ],
            ],
        ];
    }
    return $works;
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

$request = qpmPublicSearchNormalizePostRequest([
    'query' => ['text' => 'test', 'language' => 'en'],
    'sources' => ['openAlex'],
    'hardFilters' => [
        'sourceFormats' => ['journal'],
        'doiOnlyRuleIds' => ['source-format-journal'],
        'postValidationRuleIds' => ['source-format-journal'],
    ],
    'intentContext' => [
        'selectedLimitIds' => ['L025010'],
        'ruleIds' => ['source-format-journal'],
    ],
]);
$ruleState = qpmPublicSearchBuildPostValidationRuleState($request);
$candidates = [
    [
        'source' => 'openAlex',
        'sources' => ['openAlex'],
        'pmid' => '',
        'doi' => '10.1/journal',
        'openAlexId' => 'https://openalex.org/W1',
        'title' => 'Journal article',
        'enriched' => ['sourceType' => 'journal', 'venue' => 'Medical Journal'],
    ],
    [
        'source' => 'openAlex',
        'sources' => ['openAlex'],
        'pmid' => '',
        'doi' => '10.1/conference',
        'openAlexId' => 'https://openalex.org/W2',
        'title' => 'Conference supplement',
        'enriched' => ['sourceType' => 'conference', 'venue' => 'Conference Proceedings'],
    ],
];

$result = qpmPublicSearchBuildAllowedCandidateKeys(
    $candidates,
    [],
    $request['hardFilters'],
    'template',
    null,
    $ruleState
);
$diagnostics = $result['diagnostics'];

assertTrue($diagnostics['candidateCount'] === 2, 'Validation candidateCount covers the full pool');
assertTrue($diagnostics['doiCandidateCount'] === 2, 'DOI count uses overlapping full-pool semantics');
assertTrue($diagnostics['openAlexIdCandidateCount'] === 2, 'OpenAlex id count is measured independently');
assertTrue($diagnostics['validatedCount'] === 2, 'Rule diagnostics report all checked candidates');
assertTrue($diagnostics['allowedCount'] === 1, 'Only the journal candidate is allowed');
assertTrue($diagnostics['excludedCount'] === 1, 'The conference candidate is excluded');
assertTrue(count($diagnostics['activeRules']) === 1, 'Actual active rule is returned');
assertTrue(count($diagnostics['ruleGroups']) === 1, 'Actual exclusive rule group is returned');
assertTrue(count($diagnostics['excludedExamples']) === 1, 'A bounded real exclusion example is returned');
assertTrue(
    ($diagnostics['excludedExamples'][0]['reason'] ?? '') === 'rule-mismatch'
        && is_array($diagnostics['excludedExamples'][0]['ruleExplanation'] ?? null),
    'Rule exclusions retain their real rule explanation'
);

echo PHP_EOL . 'All validation diagnostics parity smoke tests passed.' . PHP_EOL;
