<?php
/**
 * Progress/group texts in PHP and translations.js must be byte-identical
 * for every semanticSearchProgress* and semanticSearchProcessGroup* key
 * defined in the backend catalog.
 *
 * Run: php scripts/progress-text-parity-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/public-search-progress-texts.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

function extractJsTranslationPair(string $js, string $key): ?array
{
    $quotedKey = preg_quote($key, '/');
    if (!preg_match(
        '/' . $quotedKey . '\s*:\s*\{\s*dk:\s*"((?:\\\\.|[^"\\\\])*)"\s*,\s*en:\s*"((?:\\\\.|[^"\\\\])*)"/s',
        $js,
        $match
    )) {
        return null;
    }
    return [
        'dk' => stripcslashes($match[1]),
        'en' => stripcslashes($match[2]),
    ];
}

$phpTexts = defined('MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS')
    ? MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS
    : [];
assertTrue(is_array($phpTexts) && $phpTexts !== [], 'PHP progress text catalog is defined');

$jsPath = __DIR__ . '/../src/assets/content/translations.js';
$js = (string) file_get_contents($jsPath);
assertTrue($js !== '', 'translations.js is readable');

$compared = 0;
foreach ($phpTexts as $key => $pair) {
    if (
        strpos($key, 'semanticSearchProgress') !== 0
        && strpos($key, 'semanticSearchProcessGroup') !== 0
    ) {
        continue;
    }
    $jsPair = extractJsTranslationPair($js, $key);
    assertTrue($jsPair !== null, "translations.js contains $key");
    assertTrue(
        ($pair['dk'] ?? '') === ($jsPair['dk'] ?? ''),
        "$key dk is identical in PHP and translations.js"
    );
    assertTrue(
        ($pair['en'] ?? '') === ($jsPair['en'] ?? ''),
        "$key en is identical in PHP and translations.js"
    );
    $compared++;
}

assertTrue($compared >= 20, 'Compared the full progress/group catalog');
echo PHP_EOL . "Compared $compared progress/group keys." . PHP_EOL;
echo 'All progress-text parity smoke tests passed.' . PHP_EOL;
