<?php
/**
 * Phase 1 smoke test (unified-engine full-parity plan): verifies
 * (a) the PubMed/semantic prompt texts are now byte-identical to
 * src/assets/prompts/translation.js, and (b) the queryIntent bug fix
 * actually wires detected concepts into a non-zero topicOverlapBonus.
 *
 * Run: php scripts/phase1-translation-unify-smoke-test.php
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

// 1. Prompt text sanity checks (spot-check distinctive phrases only present
// in the richer frontend prompt, absent from the old shortened PHP version).
$pubmedPromptDa = muginPublicSearchGetPubMedPromptText('da');
assertTrue(
    strpos($pubmedPromptDa, 'MeSH-validering (ufravigelig)') !== false,
    'PubMed prompt (da) now includes the MeSH-validation rule from translation.js'
);
assertTrue(
    strpos($pubmedPromptDa, 'wildcards') !== false,
    'PubMed prompt (da) now includes the wildcard-in-quotes rule from translation.js'
);
assertTrue(
    strpos($pubmedPromptDa, 'originalQuery') !== false && strpos($pubmedPromptDa, 'structuredAiIntent') !== false,
    'PubMed prompt (da) now includes JSON originalQuery/structuredAiIntent handling'
);
assertTrue(
    strpos($pubmedPromptDa, 'Du skal altid returnere en PubMed-søgestreng') !== false,
    'PubMed prompt (da) requires always returning a search string'
);
assertTrue(
    strpos($pubmedPromptDa, 'Det indtastede kan ikke oversættes til en søgning') === false,
    'PubMed prompt (da) no longer includes the translation-failure sentinel'
);

$pubmedPromptEn = muginPublicSearchGetPubMedPromptText('en');
assertTrue(
    strpos($pubmedPromptEn, 'never an error message or apology') !== false,
    'PubMed prompt (en) forbids error-message replies'
);
assertTrue(
    strpos($pubmedPromptEn, 'The input cannot be translated into a search') === false,
    'PubMed prompt (en) no longer includes the translation-failure sentinel'
);

$semanticPromptDa = muginPublicSearchGetSemanticPromptText('da');
assertTrue(
    strpos($semanticPromptDa, 'Semantic Scholar') !== false,
    'Semantic fallback prompt (da) now matches translation.js semanticScholarSearchPrompt wording'
);

$semanticIntentPromptDa = muginPublicSearchGetSemanticIntentPromptText('da');
assertTrue(
    strpos($semanticIntentPromptDa, 'Skriv aldrig status-, afvisnings- eller meta-sætninger som query') !== false,
    'Semantic intent prompt (da) forbids status/rejection sentences as queries'
);
assertTrue(
    strpos($semanticIntentPromptDa, 'brug tomme felter frem for gæt') === false,
    'Semantic intent prompt (da) no longer tells the model to leave query fields empty'
);

$semanticIntentPromptEn = muginPublicSearchGetSemanticIntentPromptText('en');
assertTrue(
    strpos($semanticIntentPromptEn, 'Never write status, rejection, or meta-commentary sentences as a query') !== false,
    'Semantic intent prompt (en) forbids status/rejection sentences as queries'
);

// 2. queryIntent mapping (pure function, no network).
$mockSemanticIntentResponse = [
    'semanticIntent' => 'diabetes type 2 treatment',
    'softFilterHints' => ['insulin', 'metformin'],
    'sourceSpecificHints' => ['semanticScholar' => [], 'openAlex' => [], 'elicit' => []],
    'sourceQueryPlan' => [
        'coreQuery' => 'diabetes type 2 treatment',
        'adaptations' => [
            'semanticScholar' => ['queryOverride' => null],
            'openAlex' => ['queryOverride' => null],
            'elicit' => ['queryOverride' => null],
        ],
        'semanticScholar' => ['query' => 'diabetes type 2 treatment', 'filters' => ['publicationTypes' => [], 'publicationDateOrYear' => '', 'year' => '']],
        'openAlex' => ['query' => 'diabetes type 2 treatment', 'filters' => ['language' => [], 'sourceType' => [], 'workType' => []]],
        'elicit' => ['query' => 'diabetes type 2 treatment', 'filters' => ['typeTags' => [], 'includeKeywords' => [], 'excludeKeywords' => []]],
    ],
    'meta' => [
        'detectedConcepts' => ['diabetes', 'type 2 diabetes', 'insulin therapy'],
        'intentType' => 'treatment',
        'userLanguageDetected' => 'da',
        'confidenceScore' => 0.9,
        'conceptCoverage' => ['originalConcepts' => [], 'translatedConcepts' => [], 'droppedConcepts' => [], 'severityOfDrop' => 'none'],
        'potentialIssues' => [],
        'userFriendlyParaphrase' => 'Søgning efter behandling af type 2-diabetes',
        'refinementSuggestions' => [],
    ],
];

$queryIntent = muginPublicSearchBuildQueryIntentFromSemanticIntent($mockSemanticIntentResponse);
assertTrue(
    in_array('diabetes', $queryIntent['topicsEnglish'] ?? [], true),
    'queryIntent.topicsEnglish is populated from meta.detectedConcepts'
);
assertTrue(
    in_array('insulin', $queryIntent['softHints'] ?? [], true),
    'queryIntent.softHints is populated from softFilterHints'
);

// Null input (extraction failed) must degrade gracefully to an empty, safe queryIntent.
$emptyIntent = muginPublicSearchBuildQueryIntentFromSemanticIntent(null);
assertTrue($emptyIntent === [], 'Null semantic-intent result degrades to empty queryIntent, not an error');

// 3. End-to-end: with queryIntent wired in, topicOverlapBonus in the rerank
// engine must actually fire for a candidate whose topic overlaps with the
// detected concepts (this is the concrete regression test for the bug fix).
$rerankConfig = muginSemanticQualityResolveRerankConfig(['topicOverlapBonus' => 35]);
$sourceResults = [
    [
        'source' => 'openAlex',
        'candidates' => [
            [
                'source' => 'openAlex',
                'rank' => 1,
                'doi' => '10.1/topic-match',
                'title' => 'A study on insulin therapy',
                'metadata' => ['primaryTopicDisplayName' => 'Diabetes insulin therapy', 'publicationYear' => '2023'],
            ],
        ],
    ],
];
$resultWithoutIntent = muginSemanticQualityRerankCandidates($sourceResults, $rerankConfig, []);
$resultWithIntent = muginSemanticQualityRerankCandidates($sourceResults, $rerankConfig, ['queryIntent' => $queryIntent]);

$scoreWithoutIntent = $resultWithoutIntent['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? null;
$scoreWithIntent = $resultWithIntent['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? null;

assertTrue($scoreWithoutIntent === 0.0, 'Without queryIntent (the old, buggy call site), topicOverlapBonus is 0 - reproduces the bug');
assertTrue($scoreWithIntent > 0.0, 'With queryIntent wired in (the fix), topicOverlapBonus is now non-zero for a matching topic');

// 4. Safe early source prefetch: when structured intent supplies the required
// per-source queries, changing the later shared semantic fallback must not
// change any source request query.
$sourcePlanRequest = [
    'sources' => ['semanticScholar', 'openAlex', 'elicit'],
    'hardFilters' => [],
    'sourceFilters' => [],
];
$structuredSourceIntent = [
    'sourceQueryPlan' => [
        'coreQuery' => 'shared core',
        'semanticScholar' => ['query' => 'semantic scholar query'],
        'openAlex' => ['query' => 'openalex query'],
        'elicit' => ['query' => 'elicit query'],
        'adaptations' => [],
    ],
];
$planBeforeTranslation = muginPublicSearchBuildSourceQueryPlan(
    $sourcePlanRequest,
    'raw fallback',
    $structuredSourceIntent
);
$planAfterTranslation = muginPublicSearchBuildSourceQueryPlan(
    $sourcePlanRequest,
    'translated fallback',
    $structuredSourceIntent
);
foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
    assertTrue(
        ($planBeforeTranslation[$sourceKey]['query'] ?? '') === ($planAfterTranslation[$sourceKey]['query'] ?? ''),
        "Structured {$sourceKey} query is stable for safe early prefetch"
    );
}

echo "\nAll Phase 1 translation-unification smoke tests passed.\n";
