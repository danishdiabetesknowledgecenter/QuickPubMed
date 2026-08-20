<?php
/**
 * Sentinel detection, tiab fallback, AND-guard, and pipeline cache salt
 * for untranslatable PubMed freetext.
 *
 * Run: php scripts/pubmed-translation-fallback-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-process-details.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

$daSentinel = 'Det indtastede kan ikke oversættes til en søgning. Prøv igen.';
$enSentinel = 'The input cannot be translated into a search. Please try again.';

assertTrue(
    muginPublicSearchIsPubMedTranslationFailureText($daSentinel),
    'Danish sentinel is detected'
);
assertTrue(
    muginPublicSearchIsPubMedTranslationFailureText($enSentinel),
    'English sentinel is detected'
);
assertTrue(
    muginPublicSearchIsPubMedTranslationFailureText('((' . $daSentinel . '))'),
    'Wrapped Danish sentinel is detected after unwrap'
);
assertTrue(
    muginPublicSearchIsPubMedTranslationFailureText('"' . $enSentinel . '"'),
    'Quoted English sentinel is detected after unwrap'
);
assertTrue(
    !muginPublicSearchIsPubMedTranslationFailureText('santa claus[tiab]'),
    'A real PubMed query is not treated as a sentinel'
);
assertTrue(
    !muginPublicSearchIsPubMedTranslationFailureText('findes julemanden?'),
    'Raw freetext is not treated as a sentinel'
);

assertTrue(
    muginPublicSearchPubmedQueryContainsTranslationFailureText(
        '(' . $daSentinel . ') AND ("Diabetes Mellitus"[mh] OR diabet*[ti])'
    ),
    'Sentinel AND diabetes[mh] is detected by the combine guard'
);

$fromCore = muginPublicSearchBuildUntranslatedPubmedFallbackQuery('findes julemanden?', [
    'coreQuery' => 'Santa Claus existence',
    'semanticIntent' => 'santa claus',
]);
assertTrue(
    $fromCore === '"Santa Claus existence"[tiab]',
    'Fallback prefers coreQuery and quotes phrases with spaces'
);

$fromRaw = muginPublicSearchBuildUntranslatedPubmedFallbackQuery('findes julemanden?', null);
assertTrue(
    $fromRaw === '"findes julemanden?"[tiab]',
    'Fallback uses raw freetext when no intent coreQuery exists'
);

$wildcard = muginPublicSearchBuildUntranslatedPubmedFallbackQuery('julemand*', [
    'semanticIntent' => $daSentinel,
]);
assertTrue(
    $wildcard === 'julemand*[tiab]',
    'Fallback does not quote wildcard terms and skips sentinel intent text'
);

$guarded = $daSentinel . ' AND ("Diabetes Mellitus"[mh])';
assertTrue(
    muginPublicSearchPubmedQueryContainsTranslationFailureText($guarded),
    'Combined sentinel+MeSH string is caught before it can stay as pubmedQuery'
);
$replaced = muginPublicSearchBuildUntranslatedPubmedFallbackQuery('findes julemanden?', [
    'semanticIntent' => 'Santa Claus',
]);
assertTrue(
    strpos($replaced, $daSentinel) === false && strpos($replaced, '[tiab]') !== false,
    'Replacement fallback does not contain the sentinel'
);

$baseRequest = muginPublicSearchBuildDefaultRequest();
$baseRequest['query']['text'] = 'cache salt';
$baseRequest['sources'] = ['pubmed'];
$key = muginPublicSearchBuildPipelineCacheKey($baseRequest);
$lib = (string) file_get_contents(__DIR__ . '/../backend/app/public-search-lib.php');
assertTrue(
    strpos($lib, "'_pubmedTranslationGuard' => 1") !== false
        || strpos($lib, '$_pubmedTranslationGuard') !== false
        || strpos($lib, "_pubmedTranslationGuard") !== false,
    'Pipeline cache key source includes _pubmedTranslationGuard'
);
assertTrue($key !== '', 'Pipeline cache key is non-empty with the translation guard salt');

echo "OK: pubmed-translation-fallback smoke test passed\n";
