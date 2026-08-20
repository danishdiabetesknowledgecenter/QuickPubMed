<?php
/**
 * Regression check for Phase 2: every real semanticConfig.sourceFilters block
 * in data/content/shared/limits.json must still pass the (now-extended)
 * public API request validation without throwing, and produce a sane
 * query-plan output. Guards against the schema extension accidentally being
 * too strict for real, already-deployed filter configurations.
 *
 * Run: php scripts/phase2-real-limits-sourcefilters-check.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function findAllSourceFilters(array $node, array &$found): void
{
    if (isset($node['semanticConfig']['sourceFilters']) && is_array($node['semanticConfig']['sourceFilters'])) {
        $found[] = [
            'id' => $node['id'] ?? '(unknown)',
            'sourceFilters' => $node['semanticConfig']['sourceFilters'],
        ];
    }
    foreach ($node as $value) {
        if (is_array($value)) {
            findAllSourceFilters($value, $found);
        }
    }
}

$limitsPath = __DIR__ . '/../data/content/shared/limits.json';
$limits = json_decode((string) file_get_contents($limitsPath), true);
if (!is_array($limits)) {
    fwrite(STDERR, "FAIL: could not parse limits.json\n");
    exit(1);
}

$found = [];
findAllSourceFilters($limits, $found);
echo 'Found ' . count($found) . " nodes with semanticConfig.sourceFilters.\n\n";

$failures = 0;
foreach ($found as $entry) {
    $payload = [
        'query' => ['text' => 'test query', 'language' => 'auto'],
        'sources' => ['pubmed', 'semanticScholar', 'openAlex', 'elicit'],
        'sourceFilters' => $entry['sourceFilters'],
    ];
    try {
        $normalized = muginPublicSearchNormalizePostRequest($payload);
        $plan = muginPublicSearchBuildSourceQueryPlan($normalized, 'test semantic query');
        echo "OK: {$entry['id']}\n";
    } catch (Throwable $exception) {
        echo "FAIL: {$entry['id']} -> " . get_class($exception) . ': ' . $exception->getMessage() . "\n";
        $failures++;
    }
}

echo "\n" . count($found) . ' nodes checked, ' . $failures . " failures.\n";
if ($failures > 0) {
    exit(1);
}
echo "All real limits.json sourceFilters configurations pass validation and query-plan building.\n";
