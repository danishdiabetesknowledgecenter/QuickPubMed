<?php
/**
 * Gate 0/1/6 offline locks: query construction, contract snapshots, quality shape.
 *
 * Run: php scripts/production-gates-offline-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/public-search-lib.php';

$failures = 0;
function assertTrue(bool $condition, string $message): void
{
    global $failures;
    if ($condition) {
        echo "PASS: $message\n";
        return;
    }
    $failures++;
    echo "FAIL: $message\n";
}

$form = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => 'S010030#s',
    'databases' => 'pubmed',
    'ai' => 'false',
    'limit' => ['L050010#s', 'L050020#s'],
]);
$sexQuery = muginPublicSearchBuildSelectedLimitPubMedQuery(
    (array) ($form['intentContext']['selectedLimitGroups'] ?? [])
);
assertTrue(
    strpos($sexQuery, '("Female"[mh] OR "Women"[mh]) AND ("Male"[mh] OR "Men"[mh])') !== false,
    'Golden: female+male AND-groups are parenthesized'
);

$lookback = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => 'S010030#s',
    'databases' => 'pubmed',
    'limit' => 'L070010#s',
]);
$lookbackQuery = muginPublicSearchBuildHardFilterQuery(
    (array) ($lookback['hardFilters'] ?? []),
    (array) ($lookback['intentContext']['selectedLimitGroups'] ?? [])
);
assertTrue(
    strpos((string) ($lookbackQuery['query'] ?? ''), 'y_1[Filter]') !== false
        && strpos((string) ($lookbackQuery['query'] ?? ''), '1:1[dp]') === false,
    'Golden: 1-year lookback is y_1[Filter] not 1:1[dp]'
);

$health = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => 'S010030#s',
    'databases' => 'pubmed',
    'limit' => 'L010030#s',
]);
$healthQuery = muginPublicSearchBuildHardFilterQuery(
    (array) ($health['hardFilters'] ?? []),
    (array) ($health['intentContext']['selectedLimitGroups'] ?? [])
);
assertTrue(
    strpos((string) ($healthQuery['query'] ?? ''), 'y_10[Filter]') !== false,
    'Golden: Health Evidence keeps y_10[Filter]'
);

$template = muginPublicSearchBuildSelectedLimitPubMedQuery([[['id' => 'L000010']]]);
assertTrue(stripos($template, 'xxx') === false, 'Golden: template xxx never reaches PubMed');

$formTwin = muginPublicSearchBuildRequestFromFlatParams([
    'domain' => 'template',
    'topic' => 'S010030#s',
    'databases' => 'pubmed',
    'ai' => 'false',
    'sort' => 'relevance',
    'pagesize' => '10',
    'limit' => 'L010010#s',
]);
$json = muginPublicSearchNormalizePostRequest([
    'query' => ['text' => '', 'language' => 'da'],
    'translation' => ['mode' => 'none'],
    'domain' => 'template',
    'sources' => ['pubmed'],
    'sort' => ['method' => 'relevance'],
    'page' => ['number' => 1, 'size' => 10],
    'intentContext' => [
        'selectedTopicIds' => ['S010030'],
        'selectedTopicGroups' => [[['id' => 'S010030', 'custom' => false, 'scope' => 'normal']]],
        'selectedLimitIds' => ['L010010'],
        'selectedLimitGroups' => [[['id' => 'L010010', 'scope' => 'normal']]],
    ],
]);
$resolvedJson = muginPublicSearchBuildResolvedQueries($json);
$resolvedForm = muginPublicSearchBuildResolvedQueries($formTwin);
assertTrue(
    (string) ($resolvedJson['hardFilterQuery'] ?? '') === (string) ($resolvedForm['hardFilterQuery'] ?? '')
        && (string) ($resolvedJson['hardFilterQuery'] ?? '') !== '',
    'Contract: widget-like JSON and flat form share hardFilterQuery'
);
assertTrue(
    stripos((string) ($resolvedJson['hardFilterQuery'] ?? ''), 'systematic[sb]') !== false,
    'Contract: SR limit hydrates into hardFilterQuery'
);

$aiOff = muginPublicSearchBuildRequestFromFlatParams([
    'q' => 'diabetes motion',
    'databases' => 'pubmed,semanticscholar,openalex',
    'ai' => 'false',
]);
$aiOffResolved = muginPublicSearchBuildResolvedQueries($aiOff);
$joinedWarnings = implode(' ', (array) ($aiOffResolved['warnings'] ?? []));
assertTrue(
    strpos($joinedWarnings, 'raw untranslated text') !== false,
    'Contract: AI-off + semantic sources warns in resolvedQueries'
);

$corsDenied = getAllowedOrigin('https://evil.example');
assertTrue($corsDenied === null, 'Security: unknown Origin is not allowlisted');
$corsLocal = getAllowedOrigin('http://127.0.0.1:5174');
assertTrue($corsLocal === 'http://127.0.0.1:5174', 'Security: local first-party Origin is allowed');

if ($failures > 0) {
    fwrite(STDERR, "\n{$failures} production-gate assertion(s) failed.\n");
    exit(1);
}
echo "\nAll production-gate offline smoke tests passed.\n";
