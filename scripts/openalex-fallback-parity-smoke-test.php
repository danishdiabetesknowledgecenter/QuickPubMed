<?php
/**
 * Deterministic OpenAlex semantic-primary + keyword-supplement parity test.
 */

function qpmPublicSearchFetchOpenAlexSourceResultSingle(
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
$result = qpmPublicSearchFetchOpenAlexSourceResult('santa claus', [
    'language' => ['en', 'da'],
    'sourceType' => [],
    'workType' => ['article'],
    'publicationYear' => '',
], 'template');

assertTrue(count($result['candidates']) === 3, 'Semantic and keyword candidates merge with deduplication');
assertTrue(($result['fallbackUsed'] ?? false) === true, 'Filtered semantic search records supplement usage');
assertTrue(($result['fallbackReason'] ?? '') === 'semantic-filter-supplement', 'Supplement reason matches legacy');
assertTrue(
    ($result['requestMeta']['keywordSupplementUsed'] ?? false) === true,
    'Keyword supplement metadata is retained'
);
assertTrue(
    ($result['requestMeta']['disabledRequestFields'] ?? []) === ['languages', 'workTypes'],
    'Deferred semantic filter fields match the request'
);

$GLOBALS['__qpm_openalex_semantic_mode'] = 'cap';
$capResult = qpmPublicSearchFetchOpenAlexSourceResult('santa claus', [], 'template');
assertTrue(count($capResult['candidates']) >= 50, 'Semantic-cap triggers keyword merge');
assertTrue(($capResult['requestMeta']['keywordSupplementAttempted'] ?? false) === true, 'Cap path attempts keyword');
assertTrue(($capResult['fallbackReason'] ?? '') === '', 'Cap-only path keeps empty fallbackReason like legacy');

$GLOBALS['__qpm_openalex_semantic_mode'] = 'fail';
$failResult = qpmPublicSearchFetchOpenAlexSourceResult('santa claus', [], 'template');
assertTrue(count($failResult['candidates']) === 2, 'Semantic-fail replaces with keyword candidates');
assertTrue(($failResult['fallbackUsed'] ?? false) === true, 'Semantic-fail records fallback usage');
assertTrue(($failResult['fallbackReason'] ?? '') === 'keyword', 'Semantic-fail reason is keyword');

$GLOBALS['__qpm_openalex_semantic_mode'] = 'filter';
$clean = qpmPublicSearchFetchOpenAlexSourceResult('santa claus', [], 'template');
assertTrue(($clean['requestMeta']['fallbackUsed'] ?? false) === false, 'Unfiltered below-cap semantic skips keyword');
assertTrue(count($clean['candidates']) === 2, 'Unfiltered semantic returns primary candidates only');

echo PHP_EOL . 'All OpenAlex fallback parity smoke tests passed.' . PHP_EOL;
