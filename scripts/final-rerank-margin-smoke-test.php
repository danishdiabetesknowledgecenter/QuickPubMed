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
    orderScores(['a', 'b', 'c'], ['a' => 10, 'b' => 4, 'c' => 6], ['a' => true, 'b' => true, 'c' => true]),
    ['a', 'c', 'b'],
    '10, 4, 6 becomes 10, 6, 4'
);
assertSameIds(
    orderScores(['a', 'b'], ['a' => 8, 'b' => 7], ['a' => true, 'b' => true]),
    ['a', 'b'],
    '8, 7 stays in place'
);
assertSameIds(
    orderScores(['a', 'b'], ['a' => 0, 'b' => 10], ['a' => true, 'b' => true], ['b']),
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
assertTrue($rejected['ok'] === false && $rejected['rawById'] === [], 'a score outside 0-10 rejects the whole set');

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
    muginFinalRerankTaskLine() === 'Score how directly each candidate answers userQuestion. Return every id once with an integer relevance from 0 to 10.',
    'the task line is the English score instruction'
);

echo "All final-rerank margin checks passed\n";
