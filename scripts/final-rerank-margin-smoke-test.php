<?php
/**
 * Final-rerank relevance margin, abstract cap, and score validation.
 * No network calls.
 *
 * Run: php scripts/final-rerank-margin-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

function assertSameIds(array $actual, array $expected, string $message): void
{
    if ($actual !== $expected) {
        assertTrue(false, $message . ' (got ' . implode(',', $actual) . ')');
    }
    assertTrue(true, $message);
}

function orderScores(array $ids, array $rawById, array $hasAbstractById, array $retractedIds = []): array
{
    $cappedById = [];
    $retractedById = [];
    foreach ($ids as $id) {
        $capped = muginFinalRerankCapRelevance((int) $rawById[$id], !empty($hasAbstractById[$id]));
        $cappedById[$id] = $capped['relevance'];
        if (in_array($id, $retractedIds, true)) {
            $retractedById[$id] = true;
        }
    }
    return muginFinalRerankOrderByRelevanceMargin(
        $ids,
        $cappedById,
        $retractedById,
        muginFinalRerankMinScoreGap()
    );
}

assertSameIds(
    orderScores(['a', 'b', 'c'], ['a' => 8, 'b' => 7, 'c' => 9], ['a' => true, 'b' => true, 'c' => true]),
    ['a', 'c', 'b'],
    '8, 7, 9 becomes 8, 9, 7'
);
assertSameIds(
    orderScores(['a', 'b', 'c'], ['a' => 9, 'b' => 4, 'c' => 6], ['a' => true, 'b' => true, 'c' => true]),
    ['a', 'c', 'b'],
    '9, 4, 6 becomes 9, 6, 4'
);
assertSameIds(
    orderScores(['a', 'b'], ['a' => 8, 'b' => 7], ['a' => true, 'b' => true]),
    ['a', 'b'],
    '8, 7 stays in place'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'b', 'c'],
        ['a' => 2, 'c' => 9],
        [],
        2,
        ['b' => true]
    ),
    ['a', 'b', 'c'],
    'a missing score stays in place and cannot be passed'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'c', 'b'],
        ['a' => 2, 'c' => 9],
        [],
        2,
        ['b' => true]
    ),
    ['c', 'a', 'b'],
    'scored articles still reorder inside a gap before a pinned article'
);
assertSameIds(
    orderScores(['a', 'b'], ['a' => 0, 'b' => 9], ['a' => true, 'b' => true], ['b']),
    ['a', 'b'],
    'a retracted candidate does not bubble up'
);
assertSameIds(
    orderScores(['a', 'b'], ['a' => 8, 'b' => 9], ['a' => true, 'b' => false]),
    ['a', 'b'],
    'an empty abstract caps 9 to 6 so it does not pass an 8'
);

$capped = muginFinalRerankCapRelevance(9, false);
assertTrue($capped['relevance'] === 6 && $capped['relevanceRaw'] === 9, 'empty abstract lowers 9 to 6 and keeps the raw score');
$kept = muginFinalRerankCapRelevance(0, false);
assertTrue($kept['relevance'] === 0 && $kept['relevanceRaw'] === null, 'score 0 is kept on an empty abstract');

$rejected = muginFinalRerankValidateRawScores(
    [
        ['id' => 'a', 'relevance' => 11],
        ['id' => 'b', 'relevance' => 4],
    ],
    ['a', 'b']
);
assertTrue($rejected['ok'] === false && $rejected['rawById'] === [], 'a score outside 0-9 rejects the whole set');
assertTrue(muginFinalRerankParseRelevance(10) === null, 'a score of 10 is above the 0-9 scale');
assertTrue(muginFinalRerankParseRelevance(9) === 9, '9 is the highest valid score');

$zero = muginFinalRerankValidateRawScores(
    [
        ['id' => 1, 'relevance' => 0],
        ['id' => '2', 'relevance' => '8.0'],
    ],
    ['1', '2']
);
assertTrue(
    $zero['ok'] === true && $zero['rawById'] === ['1' => 0, '2' => 8],
    'score 0 is valid, integer ids normalize to strings, and 8.0 is a whole number'
);

$duplicate = muginFinalRerankValidateRawScores(
    [
        ['id' => 'a', 'relevance' => 4],
        ['id' => 'a', 'relevance' => 5],
    ],
    ['a']
);
assertTrue($duplicate['ok'] === false, 'a duplicate id rejects the whole set');

$cacheMiss = muginFinalRerankNormalizeRawScoreMap(['1' => 8], ['1', '2']);
assertTrue($cacheMiss === null, 'a cached score map that misses an id is not applied');

$lines = muginFinalRerankSystemPromptLines();
assertTrue(
    $lines[0] === 'You score already validated scholarly search candidates.',
    'the system prompt starts in English'
);
assertTrue(
    muginFinalRerankTaskLine() === 'Score how directly each candidate answers userQuestion. Return every id once with an integer relevance from 0 to 9.',
    'the task line is the English score instruction'
);
assertTrue(muginFinalRerankModelUsesDecisions('policy/mugin-gpt-decisions-latency') === true, 'a decisions model id selects the decisions payload');
assertTrue(muginFinalRerankModelUsesDecisions('policy/mugin-gpt-small-latency') === false, 'a chat model id keeps the chat payload');
assertTrue(count(muginFinalRerankDecisionCriteria()) === 10, 'the decision scale has ten English steps');
assertTrue(
    muginFinalRerankParseDecisionScoreText('{"relevance":{"score":6.94}}') === 7,
    'a decimal decision score rounds to the nearest step'
);
$decisionAnswer = muginFinalRerankParseDecisionAnswer('{"relevance":{"score":3.08,"confidence":0.1}}');
assertTrue(
    $decisionAnswer === ['score' => 3, 'scoreExact' => 3.08, 'confidence' => 0.1],
    'a decision answer keeps the rounded score and the confidence'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'b', 'c'],
        ['a' => 8, 'b' => 8, 'c' => 9],
        [],
        2,
        [],
        muginFinalRerankPromotedIdMap(
            ['a' => 8, 'b' => 8, 'c' => 9],
            ['c' => 0.9],
            0.75,
            8
        )
    ),
    ['c', 'a', 'b'],
    'a high-confidence score at the cutoff moves ahead of the earlier articles'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'b', 'c'],
        ['a' => 8, 'b' => 8, 'c' => 9],
        [],
        2,
        [],
        muginFinalRerankPromotedIdMap(
            ['a' => 8, 'b' => 8, 'c' => 9],
            ['c' => 0.1],
            0.75,
            8
        )
    ),
    ['a', 'b', 'c'],
    'a low-confidence high score stays where the margin rule leaves it'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'c', 'b'],
        ['a' => 8, 'c' => 9, 'b' => 4],
        [],
        2,
        [],
        ['a' => true, 'c' => true]
    ),
    ['c', 'a', 'b'],
    'promoted articles sort by score'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'c', 'b'],
        ['a' => 8, 'c' => 8, 'b' => 4],
        [],
        2,
        [],
        ['a' => true, 'c' => true]
    ),
    ['a', 'c', 'b'],
    'promoted articles with the same score keep their previous order'
);
assertSameIds(
    muginFinalRerankOrderByRelevanceMargin(
        ['a', 'b', 'c'],
        ['b' => 4, 'c' => 9],
        [],
        2,
        ['a' => true],
        ['c' => true]
    ),
    ['a', 'c', 'b'],
    'a promoted article does not pass a pinned article'
);
$decisionInstructions = muginFinalRerankDecisionInstructions('hvad virker mod svær astma', 'severe asthma');
assertTrue(strpos($decisionInstructions, 'How directly does this article answer the user question?') === 0, 'decision instructions start in English');
assertTrue(strpos($decisionInstructions, 'hvad virker mod svær astma') !== false, 'the user question is inserted without translation');
assertTrue(strpos($decisionInstructions, 'search constraints') === false, 'decision instructions omit constraints when none are selected');
$constrainedInstructions = muginFinalRerankDecisionInstructions(
    'hvad virker mod svær astma',
    'severe asthma',
    ['systematic review', ' systematic review ', '']
);
assertTrue(strpos($constrainedInstructions, 'systematic review') !== false, 'a selected filter is inserted in the decision instructions');
assertTrue(substr_count($constrainedInstructions, 'systematic review') === 1, 'a repeated filter label is included once');
assertTrue(
    strpos($constrainedInstructions, 'same subject, but a different question') !== false,
    'a filter violation cannot score above a different question about the same subject'
);
$criteria = muginFinalRerankDecisionCriteria();
assertTrue(strpos(implode("\n", $criteria), 'population') === false, 'the decision scale does not mention population');
assertTrue(strpos(implode("\n", $criteria), 'intervention') === false, 'the decision scale does not mention intervention');
assertTrue($criteria[3] === 'same subject, but a different question', 'step 3 is a different question about the same subject');
assertTrue($criteria[6] === 'same question, answered only in part', 'step 6 is a partial answer');
assertTrue($criteria[7] === 'answers the question', 'step 7 is the first full answer');
$evidenceInstructions = muginFinalRerankDecisionInstructions(
    'hvad virker mod svær astma',
    'severe asthma',
    [],
    'highest-evidence',
    'Prioritize systematic reviews, meta-analyses, and guidelines with strong methodological evidence.'
);
assertTrue(strpos($evidenceInstructions, 'Prioritize systematic reviews') !== false, 'highest evidence is included in English');
assertTrue(strpos($evidenceInstructions, 'same subject, but a different question') !== false, 'a focus mismatch cannot score as a direct answer');
$newestInstructions = muginFinalRerankDecisionInstructions(
    'hvad virker mod svær astma',
    'severe asthma',
    [],
    'newest-research',
    'Prefer more recent studies over older ones, even if slightly less established.'
);
assertTrue(strpos($newestInstructions, 'Prefer more recent studies') === false, 'newest research is not sent as a score constraint');
assertTrue(strpos(muginFinalRerankArticleInputText('A title', '', []), 'highest-evidence') === false, 'the article text does not contain the result focus');
assertTrue(strpos(muginFinalRerankArticleInputText('A title', '', []), 'hvad virker') === false, 'the article text does not contain the user question');
assertTrue(strpos(muginFinalRerankArticleInputText('A title', '', []), 'systematic review') === false, 'the article text does not contain the selected filter');
$systemLines = implode("\n", muginFinalRerankSystemPromptLines());
assertTrue(strpos($systemLines, 'When selectedLimits are present') !== false, 'the chat prompt explains selected limits');
assertTrue(strpos($systemLines, 'from 0 to 9') !== false, 'the chat prompt asks for a score from 0 to 9');
assertTrue(strpos($systemLines, 'must not score above 3') !== false, 'the chat prompt caps a filter mismatch at 3');
assertTrue(strpos($systemLines, 'same question, answered only in part') !== false, 'the chat prompt uses the partial-answer anchor');
foreach (muginFinalRerankDecisionCriteria() as $criterion) {
    assertTrue(strpos($systemLines, $criterion) !== false, 'the chat prompt cites every decision criterion');
}

$direct = muginFinalRerankDecisionBoostFactor(9, 1, 0.7);
$none = muginFinalRerankDecisionBoostFactor(0, 1, 0.7);
$middle = muginFinalRerankDecisionBoostFactor(4.5, 1, 0.7);
$unknown = muginFinalRerankDecisionBoostFactor(9, 0, 0.7);
$chat = muginFinalRerankDecisionBoostFactor(9, null, 0.7);
assertTrue(abs($direct - 1.7) < 0.00001, 'score 9 and confidence 1 multiply by 1.7');
assertTrue(abs($none - 0.3) < 0.00001, 'score 0 and confidence 1 multiply by 0.3');
assertTrue(abs($middle - 1.0) < 0.00001, 'the midpoint leaves the score unchanged');
assertTrue(abs($unknown - 1.0) < 0.00001, 'a measured confidence of 0 does not move the score');
assertTrue(abs($chat - 1.7) < 0.00001, 'a missing confidence still lets the score boost');
assertTrue(muginFinalRerankDecisionBoostFactor(0, 1, 2) > 0, 'the weight cannot make the factor negative');
$parsedExact = muginFinalRerankParseDecisionAnswer('{"relevance":{"score":8.25,"confidence":0.72}}');
assertTrue($parsedExact !== null && abs($parsedExact['scoreExact'] - 8.25) < 0.00001, 'the unrounded decisions score is kept');
assertTrue($parsedExact['score'] === 8, 'the displayed decisions score stays rounded');

echo "All final-rerank margin checks passed\n";
