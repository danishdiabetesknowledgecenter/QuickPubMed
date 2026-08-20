<?php
/**
 * Fairness smoke for deterministic topicOverlapBonus (PHP port).
 * Mirrors cases in scripts/verify-rerank-parity.js topic-signal fairness block.
 *
 * Run: php scripts/topic-signal-fairness-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
}

$rerankConfig = muginSemanticQualityResolveRerankConfig(['topicOverlapBonus' => 50]);
$fairnessIntent = [
    'topicsEnglish' => ['heart failure'],
    'topicIntents' => [],
    'softHints' => [],
    'rawPhrases' => ['heart failure'],
];

$doiOnly = muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'openAlex',
            'candidates' => [
                [
                    'source' => 'openAlex',
                    'rank' => 1,
                    'pmid' => '',
                    'doi' => '10.1/doi-topic-match',
                    'openAlexId' => 'W_DOI_TOPIC',
                    'title' => 'DOI-only with OpenAlex topic',
                    'metadata' => [
                        'openAlexTopics' => ['Heart Failure'],
                        'primaryTopicDisplayName' => 'Cardiology',
                    ],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $fairnessIntent]
);
$doiOnlyBonus = (float) ($doiOnly['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? 0);
assertTrue($doiOnlyBonus > 0.0, "DOI-only + OA topic must earn bonus > 0 (got $doiOnlyBonus)");

$pmidNoTopics = muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'pubmed',
            'candidates' => [
                [
                    'source' => 'pubmed',
                    'rank' => 1,
                    'pmid' => '5100001',
                    'title' => 'PMID without topic labels',
                    'metadata' => [],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $fairnessIntent]
);
$pmidNoTopicsBonus = (float) ($pmidNoTopics['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? -1);
assertTrue($pmidNoTopicsBonus === 0.0, "PMID without topics must get bonus === 0 (got $pmidNoTopicsBonus)");

$meshLike = muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'openAlex',
            'candidates' => [
                [
                    'source' => 'openAlex',
                    'rank' => 1,
                    'pmid' => '5100002',
                    'title' => 'MeSH-like primary topic',
                    'metadata' => ['primaryTopicDisplayName' => 'Heart Failure'],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $fairnessIntent]
);
$meshLikeBonus = (float) ($meshLike['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? 0);
assertTrue($meshLikeBonus > 0.0, 'MeSH-like label must be able to earn bonus (no PMID gate)');

$phraseCompareIntent = [
    'topicsEnglish' => ['heart failure', 'cardiovascular disease', 'outcomes research'],
    'topicIntents' => [],
    'softHints' => [],
    'rawPhrases' => ['heart failure'],
];
$tokenOnlyLabelBonus = (float) (muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'openAlex',
            'candidates' => [
                [
                    'source' => 'openAlex',
                    'rank' => 1,
                    'doi' => '10.1/token-only-label',
                    'openAlexId' => 'W_TOKEN_ONLY',
                    'title' => 'Token-only topic paper',
                    'metadata' => ['openAlexTopics' => ['Heart']],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $phraseCompareIntent]
)['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? 0);
$phraseHitBonus = (float) (muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'openAlex',
            'candidates' => [
                [
                    'source' => 'openAlex',
                    'rank' => 1,
                    'doi' => '10.1/phrase-hit',
                    'openAlexId' => 'W_PHRASE',
                    'title' => 'Phrase topic paper',
                    'metadata' => ['openAlexTopics' => ['Heart Failure Outcomes']],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $phraseCompareIntent]
)['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? 0);
assertTrue(
    $phraseHitBonus > $tokenOnlyLabelBonus,
    "phrase-hit must increase bonus vs token-only label (phrase=$phraseHitBonus, token=$tokenOnlyLabelBonus)"
);

$truncateNoise = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta'];
$truncatedMissBonus = (float) (muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'openAlex',
            'candidates' => [
                [
                    'source' => 'openAlex',
                    'rank' => 1,
                    'doi' => '10.1/truncate-miss',
                    'openAlexId' => 'W_TRUNC_MISS',
                    'title' => 'Ninth label truncated',
                    'metadata' => [
                        'primaryTopicDisplayName' => 'Primary Noise',
                        'openAlexTopics' => array_merge($truncateNoise, ['Heart Failure']),
                    ],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $fairnessIntent]
)['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? -1);
assertTrue($truncatedMissBonus === 0.0, "9th matching label must be truncated (got $truncatedMissBonus)");

$truncatedHitBonus = (float) (muginSemanticQualityRerankCandidates(
    [
        [
            'source' => 'openAlex',
            'candidates' => [
                [
                    'source' => 'openAlex',
                    'rank' => 1,
                    'doi' => '10.1/truncate-hit',
                    'openAlexId' => 'W_TRUNC_HIT',
                    'title' => 'Matching label within cap',
                    'metadata' => [
                        'primaryTopicDisplayName' => 'Heart Failure',
                        'openAlexTopics' => $truncateNoise,
                    ],
                ],
            ],
        ],
    ],
    $rerankConfig,
    ['queryIntent' => $fairnessIntent]
)['candidates'][0]['scoreBreakdown']['topicOverlapBonus'] ?? 0);
assertTrue($truncatedHitBonus > 0.0, "in-cap match must earn bonus > 0 (got $truncatedHitBonus)");

// LLM topics helper: cap 16 + source priority (mesh first; OA keywords before S2).
if (!function_exists('muginPublicSearchBuildLlmTopicsPayload')) {
    require_once __DIR__ . '/../backend/app/public-search-lib.php';
}
$llmTopics = muginPublicSearchBuildLlmTopicsPayload(
    [
        ['label' => 'OA Topic', 'source' => 'openAlex'],
        ['label' => 'MeSH Term', 'source' => 'mesh'],
        ['label' => 'S2 Field', 'source' => 'semanticScholar'],
        ['label' => 'Extra 1', 'source' => 'openAlexConcept'],
        ['label' => 'Extra 2', 'source' => 'pubmedKeyword'],
        ['label' => 'Extra 3', 'source' => 'openAlexKeyword'],
        ['label' => 'Extra 4', 'source' => 'openAlexTopic'],
        ['label' => 'Extra 5', 'source' => 'openAlex'],
        ['label' => 'Subfield', 'source' => 'openAlexSubfield'],
        ['label' => 'Dropped', 'source' => 'openAlex'],
        ['label' => 'Medicine', 'source' => 'openAlexField'],
        ['label' => 'Health Sciences', 'source' => 'openAlexDomain'],
    ],
    [],
    [],
    16
);
$llmSources = array_map(static fn($topic) => (string) ($topic['source'] ?? ''), $llmTopics);
assertTrue(count($llmTopics) === 9, 'LLM topics payload keeps all maintained terms under cap 16');
assertTrue(($llmTopics[0]['source'] ?? '') === 'mesh', 'LLM topics must prioritize mesh first');
$keywordIndex = array_search('openAlexKeyword', $llmSources, true);
$s2Index = array_search('semanticScholar', $llmSources, true);
assertTrue($keywordIndex !== false && $s2Index !== false && $keywordIndex < $s2Index, 'LLM topics must rank OpenAlex keywords before Semantic Scholar');
assertTrue(in_array('openAlexSubfield', $llmSources, true), 'LLM topics include distinct OpenAlex subfield');
foreach ($llmTopics as $llmTopic) {
    assertTrue(
        !in_array($llmTopic['source'] ?? '', ['openAlexConcept', 'openAlexField', 'openAlexDomain'], true),
        'LLM topics must drop deprecated or generic OpenAlex hierarchy'
    );
}

fwrite(STDOUT, "topic-signal-fairness-smoke-test: OK\n");
exit(0);
