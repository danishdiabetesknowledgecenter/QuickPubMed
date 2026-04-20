<?php
/**
 * Returns the last known rate limit snapshots for the semantic search sources
 * (OpenAlex, Semantic Scholar, Elicit). The snapshots are written to disk by
 * the per-source search endpoints and shared across all visitors so that users
 * who have not yet performed a search can still see the remaining request
 * counts.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

qpmApplyNlmCorsHeaders('GET, OPTIONS', 'application/json');

$sources = [];
if (function_exists('qpmReadAllSourceRateLimitSnapshots')) {
    foreach (qpmReadAllSourceRateLimitSnapshots() as $sourceKey => $snapshot) {
        $sources[$sourceKey] = $snapshot ?? null;
    }
}

echo json_encode([
    'sources' => (object) $sources,
    'generatedAt' => gmdate('c'),
]);
