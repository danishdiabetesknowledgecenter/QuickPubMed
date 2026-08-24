<?php
/**
 * Catalog integrity for shared limits.json (and template topics.json).
 *
 * Run: php scripts/catalog-invariants-smoke-test.php
 */

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

$limitsPath = dirname(__DIR__) . '/data/content/shared/limits.json';
$limits = json_decode((string) file_get_contents($limitsPath), true);
assertTrue(is_array($limits), 'limits.json parses as JSON object/array');

$historicalIdAllowlist = ['L60080' => true, 'L60090' => true];
$ids = [];
$duplicates = [];
$badLeafIds = [];
$walk = static function ($node, string $categoryId = '') use (&$walk, &$ids, &$duplicates, &$badLeafIds, $historicalIdAllowlist): void {
    if (!is_array($node)) {
        return;
    }
    $nextCategoryId = $categoryId;
    if (isset($node['id'])) {
        $id = trim((string) $node['id']);
        if ($id !== '' && preg_match('/^L[A-Z0-9]/i', $id) === 1) {
            if (isset($ids[$id])) {
                $duplicates[] = $id;
            }
            $ids[$id] = true;
            $isCategory = preg_match('/^L[A-Z0-9]{3}$/i', $id) === 1;
            if ($isCategory) {
                $nextCategoryId = $id;
            } elseif (!isset($historicalIdAllowlist[strtoupper($id)])) {
                if (preg_match('/^L(?:XXX|[0-9]{3})[0-9]{3,}$/i', $id) !== 1) {
                    $badLeafIds[] = $id;
                }
            }
        }
    }
    foreach ($node as $value) {
        if (is_array($value)) {
            $walk($value, $nextCategoryId);
        }
    }
};
$walk($limits);

assertTrue($duplicates === [], 'limits.json ids are unique' . ($duplicates !== [] ? ' (dupes: ' . implode(', ', $duplicates) . ')' : ''));
assertTrue(count($ids) > 50, 'limits.json has a substantial id catalog');
assertTrue(
    $badLeafIds === [],
    'leaf limit ids match L0xx… / LXXXxxx (historical L60080/L60090 allowlisted)'
        . ($badLeafIds !== [] ? ' (bad: ' . implode(', ', $badLeafIds) . ')' : '')
);
assertTrue(isset($ids['L070010']) && isset($ids['L010030']), 'lookback and Health Evidence limits are present');

$topicsPath = dirname(__DIR__) . '/data/content/template/topics.json';
$topics = json_decode((string) file_get_contents($topicsPath), true);
assertTrue(is_array($topics), 'template topics.json parses');
assertTrue(
    array_key_exists('standardStringAddToFreetext', $topics),
    'template topics.json declares standardStringAddToFreetext'
);

if ($failures > 0) {
    fwrite(STDERR, "\n{$failures} catalog invariant(s) failed.\n");
    exit(1);
}
echo "\nAll catalog invariant smoke tests passed.\n";
