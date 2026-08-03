<?php
/**
 * Phase 6 (unified-engine full-parity plan): runs the same 6 representative
 * queries used for the legacy-JS browser baseline capture
 * (scripts/fixtures/real-query-baseline-legacy-js.json) through the PHP
 * unified engine, and records the first-10 PMID/DOI order for comparison.
 *
 * Run: php scripts/phase6-capture-php-unified-baseline.php
 */

require_once __DIR__ . '/../backend/config/config.php';
require_once __DIR__ . '/../backend/app/public-search-request.php';
require_once __DIR__ . '/../backend/app/public-search-auth.php';
require_once __DIR__ . '/../backend/app/public-search-orchestrator.php';

if (!qpmPublicSearchIsUnifiedSearchEngineEnabled()) {
    fwrite(STDERR, "QPM_UNIFIED_SEARCH_ENGINE_ENABLED must be true to capture this baseline.\n");
    exit(1);
}

$queries = [
    'diabetes type 2 behandling',
    'systematic review statin therapy',
    'randomized controlled trial hypertension',
    'covid-19 vaccine effectiveness elderly',
    'cognitive behavioral therapy depression',
    'concussion management guidelines',
];

$results = [];
foreach ($queries as $queryText) {
    $request = qpmPublicSearchBuildDefaultRequest();
    $request['query']['text'] = $queryText;
    $request['query']['language'] = 'da';
    // Matches sourcesUsed in real-query-baseline-legacy-js.json: the local
    // dev browser session had Elicit locked (QPM_ELICIT_UNLOCK), so the JS
    // baseline only used these 3 sources. Match exactly for a fair diff.
    $request['sources'] = ['pubmed', 'semanticScholar', 'openAlex'];
    $request['sort']['method'] = 'relevance';
    $request['page']['number'] = 1;
    $request['page']['size'] = 10;

    $startedAt = microtime(true);
    echo "Running: \"$queryText\" ...\n";
    try {
        $response = qpmPublicSearchRunSearch($request, null);
        $elapsed = round(microtime(true) - $startedAt, 2);
        $order = [];
        foreach ((array) ($response['results'] ?? []) as $result) {
            $order[] = $result['pmid'] !== '' ? $result['pmid'] : ($result['doi'] ?? '');
        }
        $results[] = [
            'query' => $queryText,
            'resultOrder' => $order,
            'elapsedSeconds' => $elapsed,
            'notes' => '',
        ];
        echo "  -> " . count($order) . " results in {$elapsed}s\n";
    } catch (Throwable $exception) {
        $elapsed = round(microtime(true) - $startedAt, 2);
        $results[] = [
            'query' => $queryText,
            'resultOrder' => [],
            'elapsedSeconds' => $elapsed,
            'notes' => 'ERROR: ' . get_class($exception) . ': ' . $exception->getMessage(),
        ];
        echo "  -> ERROR after {$elapsed}s: " . $exception->getMessage() . "\n";
    }
}

$output = [
    'capturedAt' => gmdate('c'),
    'engine' => 'php-unified',
    'queries' => $results,
];
$outputPath = __DIR__ . '/fixtures/real-query-baseline-php-unified-3source.json';
file_put_contents($outputPath, json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
echo "\nWritten to $outputPath\n";
