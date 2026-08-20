<?php
/**
 * Emit-contract smoke tests: finalRerank only when the LLM call will run,
 * mesh only with [mh], no semanticQuery SSE, catalog-only PubMed skips
 * TranslateSemanticQuery.
 *
 * Run: php scripts/process-pipeline-emit-contract-smoke-test.php
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

$twoResults = [
    ['pmid' => '1', 'title' => 'A'],
    ['pmid' => '2', 'title' => 'B'],
];
$pubmedAuto = [
    'translation' => ['mode' => 'auto'],
    'page' => ['number' => 1],
    'sort' => ['method' => 'relevance'],
    'sources' => ['pubmed'],
];

assertTrue(
    muginPublicSearchShouldApplySemanticLlmFinalRerank($pubmedAuto, $twoResults) === true,
    'PubMed-only + auto applies LLM final rerank when there are enough results'
);
assertTrue(
    muginPublicSearchShouldApplySemanticLlmFinalRerank(
        array_merge($pubmedAuto, ['translation' => ['mode' => 'none']]),
        $twoResults
    ) === false,
    'finalRerank is skipped when translation.mode is none'
);
assertTrue(
    muginPublicSearchShouldApplySemanticLlmFinalRerank(
        array_merge($pubmedAuto, ['page' => ['number' => 2]]),
        $twoResults
    ) === false,
    'finalRerank is skipped on page > 1'
);
assertTrue(
    muginPublicSearchShouldApplySemanticLlmFinalRerank(
        array_merge($pubmedAuto, ['sort' => ['method' => 'date_desc']]),
        $twoResults
    ) === false,
    'finalRerank is skipped for date sort'
);
assertTrue(
    muginPublicSearchShouldApplySemanticLlmFinalRerank($pubmedAuto, [['pmid' => '1']]) === false,
    'finalRerank is skipped when there are fewer than two results'
);
assertTrue(
    muginPublicSearchSemanticIntentProgressMessageKey(['sources' => ['pubmed']])
        === 'semanticSearchProgressSemanticIntentSingle',
    'Single-source intent uses the singular progress text key'
);
assertTrue(
    muginPublicSearchPrepareProgressGroupKey(['sources' => ['pubmed']])
        === 'semanticSearchProcessGroupPrepareAndSearchSingle'
        && muginPublicSearchPrepareProgressGroupId(['sources' => ['pubmed']]) === 'prepareAndSources'
        && muginPublicSearchSourcesProgressGroupKey(['sources' => ['pubmed']])
            === 'semanticSearchProcessGroupPrepareAndSearchSingle',
    'Single-source prepare/source SSE uses the merged group key and id'
);
assertTrue(
    muginPublicSearchPrepareProgressGroupKey(['sources' => ['pubmed', 'openAlex']])
        === 'semanticSearchProcessGroupPrepare'
        && muginPublicSearchSourcesProgressGroupKey(['sources' => ['pubmed', 'openAlex']])
            === 'semanticSearchProcessGroupSources',
    'Multi-source SSE keeps separate prepare and sources groups'
);

assertTrue(
    muginSemanticQualityExtractMeshTerms('diabetes[tiab] AND insulin[tiab]') === [],
    'A PubMed string without [mh] yields no MeSH terms'
);
assertTrue(
    muginSemanticQualityExtractMeshTerms('diabetes[mh] AND insulin[tiab]') !== [],
    'A PubMed string with [mh] yields MeSH terms'
);

$lib = (string) file_get_contents(__DIR__ . '/../backend/app/public-search-lib.php');
assertTrue($lib !== '', 'public-search-lib.php is readable');
assertTrue(
    strpos($lib, "muginPublicSearchEmitProgress(\$progressCallback, 'semanticQuery'") === false,
    'Backend does not emit a semanticQuery progress stage'
);
assertTrue(
    strpos($lib, '$runMeshStep = $translated !== \'\'') !== false
        && strpos($lib, '!empty($meshTerms)') !== false,
    'Mesh progress is gated on extracted [mh] terms'
);
assertTrue(
    strpos($lib, 'if ($hasFreetextInput)') !== false
        && strpos($lib, 'muginPublicSearchTranslatePubMedQuery') !== false,
    'PubMed searchString translation is gated on freetext input'
);
assertTrue(
    strpos($lib, 'Catalog-only + semantic sources') !== false
        && strpos($lib, 'PubMed-only catalog searches skip this LLM call') !== false,
    'Catalog PubMed-only skips TranslateSemanticQuery'
);
assertTrue(
    strpos($lib, 'muginPublicSearchShouldApplySemanticLlmFinalRerank($request, $results)') !== false,
    'finalRerank progress is gated on ShouldApply'
);
assertTrue(
    preg_match(
        '/\$onEarlySourceStart = static function \(array \$sourceKeys\) use \(\s*&\$earlySourceStartedAt,\s*\$progressCallback,\s*\$request\s*\)/',
        $lib
    ) === 1,
    'Early source-start SSE closure captures $request for groupId/groupKey'
);
assertTrue(
    strpos($lib, "muginPublicSearchEmitProgress(\$progressCallback, 'resolvedQueries'") !== false
        && strpos($lib, "'detailOnly' => true") !== false
        && strpos($lib, "\$payload['resolvedQueries']") !== false,
    'Resolved PubMed/source queries are streamed as a detail-only SSE event after BuildResolvedQueries'
);

echo PHP_EOL . 'All process-pipeline emit-contract smoke tests passed.' . PHP_EOL;
