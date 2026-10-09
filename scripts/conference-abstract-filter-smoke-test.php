<?php
/**
 * Port parity for isConferenceAbstract() and the source-format-journal veto.
 * Run: php scripts/conference-abstract-filter-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    echo ($condition ? 'PASS' : 'FAIL') . ': ' . $message . PHP_EOL;
    if (!$condition) {
        exit(1);
    }
}

$scenarios = [
    ['OpenAlex type conference-abstract', ['title' => 'Treatment patterns in newly diagnosed patients', 'types' => ['conference-abstract'], 'issue' => '12', 'pages' => 'S641-S641'], true],
    ['DOI path meeting-abstracts', ['title' => 'Outcomes after diagnosis', 'doi' => '10.1000/meeting-abstracts.2024.1', 'types' => ['article']], true],
    ['Abstract source name and one S page', ['title' => 'Glucose targets in adults', 'sourceName' => 'Abstracts of the Annual Meeting', 'pages' => 'S3', 'types' => ['article']], true],
    ['Meeting issue and a two-page S span', ['title' => 'Caregiver burden after diagnosis', 'issue' => 'Annual Meeting', 'pages' => 'S10-S11', 'types' => ['article']], true],
    ['Congress issue and one S page', ['title' => 'Education needs in the first year', 'issue' => 'Congress', 'pages' => 'S4', 'types' => ['article']], true],
    ['Supplement issue and one S page without a title code', ['title' => 'Family experiences after diagnosis', 'issue' => 'Supplement_1', 'pages' => 'S12', 'types' => ['article']], true],
    ['Supplement issue and a digit-letter title code without pages', ['title' => '674-P: Information needs after diagnosis', 'issue' => 'Supplement_1', 'types' => ['article']], true],
    ['Letter-digit title code and a two-page S span', ['title' => 'PS-045 Costs after a new diagnosis', 'pages' => 'S91-S92', 'issue' => '6', 'types' => ['review']], true],
    ['Hyphenated session code and one S page', ['title' => 'OR1-1: Insulin dosing in the first month', 'pages' => 'S4', 'types' => ['article']], true],
    ['Late-breaking code and a poster issue', ['title' => 'LB001 Technology choices at diagnosis', 'issue' => 'Poster session', 'types' => ['article']], true],
    ['Digit-letter code and a supplement issue', ['title' => '500-P: Gaps in education at diagnosis', 'issue' => 'Supplement_1', 'types' => ['article']], true],
    ['Review without a code in a numbered issue', ['title' => 'Humanistic burden of informal caregivers: a systematic literature review', 'issue' => '1', 'types' => ['review']], false],
    ['Multi-page supplement article', ['title' => 'Standards of care', 'issue' => 'Supplement_1', 'pages' => 'S5-S40', 'types' => ['article']], false],
    ['Multi-page article in a meeting issue', ['title' => 'Long term outcomes', 'issue' => 'Annual Meeting', 'pages' => '10-40', 'types' => ['article']], false],
    ['One-page introduction in a supplement', ['title' => 'Introduction', 'issue' => 'Supplement_1', 'pages' => '1', 'types' => ['editorial']], false],
    ['Abstract-named source with a long page span', ['title' => 'Cohort follow-up after diagnosis', 'sourceName' => 'Abstracts of the Annual Meeting', 'pages' => '10-40', 'types' => ['article']], false],
    ['IL17 title with ordinary pages', ['title' => 'IL17 blockade in autoimmune disease', 'pages' => '100-110', 'issue' => '4', 'types' => ['article']], false],
    ['B12 title with ordinary pages', ['title' => 'B12 deficiency and neuropathy', 'pages' => '20-28', 'issue' => '2', 'types' => ['article']], false],
    ['COVID-19 title in a multi-page supplement', ['title' => 'COVID-19 outcomes', 'issue' => 'Supplement_1', 'pages' => 'S5-S20', 'types' => ['article']], false],
    ['Supplementation in the title is not an issue signal', ['title' => 'Vitamin D supplementation', 'issue' => '4', 'pages' => '10-20', 'types' => ['article']], false],
    ['Title code without an abstract issue or a short page', ['title' => 'EE181 Productivity after diagnosis', 'pages' => '88-96', 'issue' => '6', 'types' => ['article']], false],
    ['Conference paper type stays', ['title' => 'A complete proceedings paper', 'types' => ['conference-paper'], 'issue' => '3', 'pages' => '88-96'], false],
    ['Crossref journal-article type alone stays', ['title' => 'A research article', 'types' => ['journal-article'], 'issue' => '5', 'pages' => '100-110'], false],
    ['Single ordinary page without a title code', ['title' => 'A short research note', 'issue' => '6', 'pages' => '441', 'types' => ['article']], false],
];

foreach ($scenarios as $scenario) {
    [$label, $record, $expect] = $scenario;
    $actual = muginSemanticQualityIsConferenceAbstract($record);
    assertTrue($actual === $expect, $label);
}

$rule = [
    'id' => 'source-format-journal',
    'matchStrategy' => 'any',
    'metadataFieldConditionMode' => 'any',
    'excludeConferenceAbstracts' => true,
    'metadataFieldConditions' => [
        ['field' => 'candidateSourceType', 'operator' => 'equalsAny', 'values' => ['journal']],
    ],
];
$snapshot = ['candidateSourceType' => 'journal'];
$abstractCandidate = [
    'title' => '674-P: Information needs after diagnosis',
    'doi' => '10.1000/example',
    'metadata' => ['issue' => 'Supplement_1', 'workType' => 'article', 'sourceType' => 'journal'],
];
$abstractResult = muginSemanticQualityEvaluateRule($abstractCandidate, $rule, [], $snapshot);
assertTrue($abstractResult['passed'] === false, 'Journal rule rejects a supplement title-code abstract');
assertTrue(in_array('conference_abstract', $abstractResult['failures'], true), 'Rejection is tagged conference_abstract');

$articleCandidate = [
    'title' => 'Standards of care',
    'doi' => '10.1000/article',
    'metadata' => [
        'issue' => 'Supplement_1',
        'pages' => 'S5-S40',
        'workType' => 'article',
        'sourceDisplayName' => 'Medical Journal',
        'sourceType' => 'journal',
    ],
];
$articleResult = muginSemanticQualityEvaluateRule($articleCandidate, $rule, [], $snapshot);
assertTrue($articleResult['passed'] === true, 'Journal rule keeps a multi-page supplement article');

$normalized = muginPublicSearchNormalizePostValidationRule($rule);
assertTrue(
    is_array($normalized) && ($normalized['excludeConferenceAbstracts'] ?? false) === true,
    'Post-validation normalizer keeps excludeConferenceAbstracts'
);

$loaded = muginPublicSearchBuildPostValidationRuleState(muginPublicSearchNormalizePostRequest([
    'query' => ['text' => 'diabetes education', 'language' => 'en'],
    'sources' => ['openAlex'],
    'hardFilters' => [
        'sourceFormats' => ['journal'],
        'postValidationRuleIds' => ['source-format-journal'],
    ],
    'intentContext' => [
        'selectedLimitIds' => ['L025010'],
        'ruleIds' => ['source-format-journal'],
    ],
]));
assertTrue(
    ($loaded['activeRules'][0]['excludeConferenceAbstracts'] ?? false) === true
        && ($loaded['activeRules'][0]['excludeAnyTextSignals'] ?? []) === [],
    'L025010 loads the conference-abstract veto without the broad text signals'
);

echo PHP_EOL . 'All conference-abstract filter smoke tests passed.' . PHP_EOL;
