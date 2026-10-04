<?php
/**
 * Smoke test for data/runtime sweep: expired files are removed, live cache
 * entries are kept, and a namespace over the file cap is trimmed.
 *
 * Run: php scripts/runtime-sweep-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/file-cache.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

function cacheFileName(string $namespace, string $id): string
{
    return 'public-search-cache-' . $namespace . '-' . sha1($id) . '.bin';
}

function placeFile(string $dir, string $name, int $mtime): string
{
    $path = $dir . DIRECTORY_SEPARATOR . $name;
    file_put_contents($path, 'x');
    touch($path, $mtime);
    clearstatcache(true, $path);
    return $path;
}

function countNamed(string $dir, string $prefix): int
{
    $count = 0;
    foreach (scandir($dir) ?: [] as $name) {
        if ($name === '.' || $name === '..') {
            continue;
        }
        if (strpos($name, $prefix) === 0) {
            $count++;
        }
    }
    return $count;
}

function removeTree(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (scandir($dir) ?: [] as $name) {
        if ($name === '.' || $name === '..') {
            continue;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $name;
        if (is_dir($path)) {
            removeTree($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}

function makeTempDir(string $label): string
{
    $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'mugin-runtime-sweep-' . $label . '-' . uniqid('', true);
    if (!mkdir($dir, 0700, true) && !is_dir($dir)) {
        fwrite(STDERR, "FAIL: could not create temp dir\n");
        exit(1);
    }
    return $dir;
}

$now = time();
$mixed = makeTempDir('mixed');
try {
    $oldPipeline = placeFile($mixed, cacheFileName('search-pipeline', 'old'), $now - 3 * 86400);
    $livePipeline = placeFile($mixed, cacheFileName('search-pipeline', 'live'), $now);
    $oldResponse = placeFile($mixed, cacheFileName('search-response', 'old'), $now - 400);
    $liveResponse = placeFile($mixed, cacheFileName('search-response', 'live'), $now - 100);
    $legacyOpenAlex = placeFile($mixed, cacheFileName('openalex-work', 'legacy'), $now - 30);
    $oldTmp = placeFile($mixed, cacheFileName('pubmed-summary', 'tmp-old') . '.abc.tmp', $now - 1200);
    $liveTmp = placeFile($mixed, cacheFileName('pubmed-summary', 'tmp-live') . '.abc.tmp', $now);
    $oldIp = placeFile($mixed, 'mugin-ip-rate-limit-unifiedSearch-1.2.3.4.json', $now - 8 * 86400);
    $liveIp = placeFile($mixed, 'mugin-ip-rate-limit-unifiedSearch-5.6.7.8.json', $now);
    $oldLog = placeFile($mixed, 'public-search-api-2020-01-01.log', $now - 40 * 86400);
    $liveLog = placeFile($mixed, 'public-search-api-' . gmdate('Y-m-d') . '.log', $now);
    $oldTelemetry = placeFile($mixed, 'mugin-telemetry-2020-01-01.jsonl', $now - 40 * 86400);
    $oldEditorAudit = placeFile($mixed, 'editor-audit-2020-01-01.log', $now - 40 * 86400);
    $oldSlot = placeFile($mixed, 'public-search-active-search-search-old.lock', $now - 7200);
    $liveSlot = placeFile($mixed, 'public-search-active-search-search-live.lock', $now);
    $coordinator = placeFile($mixed, 'public-search-active-search.lock', $now - 2 * 86400);
    $notes = placeFile($mixed, 'notes.txt', $now - 10 * 86400);
    $oldSourceLimit = placeFile($mixed, 'source-rate-limit-openAlex.json', $now - 8 * 86400);
    $liveSourceLimit = placeFile($mixed, 'source-rate-limit-semanticScholar.json', $now);

    for ($i = 0; $i < 20; $i++) {
        muginSweepRuntimeDirectory($mixed, 3, 5.0);
    }

    assertTrue(!is_file($oldPipeline), 'Expired pipeline cache is deleted');
    assertTrue(is_file($livePipeline), 'Fresh pipeline cache is kept');
    assertTrue(!is_file($oldResponse), 'Search-response cache older than its TTL is deleted');
    assertTrue(is_file($liveResponse), 'Search-response cache inside its TTL is kept');
    assertTrue(!is_file($legacyOpenAlex), 'Legacy openalex-work runtime cache is deleted');
    assertTrue(!is_file($oldTmp), 'Orphan temp file is deleted');
    assertTrue(is_file($liveTmp), 'In-flight temp file is kept');
    assertTrue(!is_file($oldIp), 'IP rate-limit file older than 7 days is deleted');
    assertTrue(is_file($liveIp), 'Fresh IP rate-limit file is kept');
    assertTrue(!is_file($oldLog), 'Audit log past retention is deleted');
    assertTrue(is_file($liveLog), 'Today\'s audit log is kept');
    assertTrue(!is_file($oldTelemetry), 'Telemetry file past retention is deleted');
    assertTrue(!is_file($oldEditorAudit), 'Editor audit log past retention is deleted');
    assertTrue(!is_file($oldSlot), 'Stale search slot lock is deleted');
    assertTrue(is_file($liveSlot), 'Fresh search slot lock is kept');
    assertTrue(is_file($coordinator), 'Coordinator lock is kept');
    assertTrue(is_file($notes), 'Unrelated file is kept');
    assertTrue(!is_file($oldSourceLimit), 'Stale source rate-limit file is deleted');
    assertTrue(is_file($liveSourceLimit), 'Fresh source rate-limit file is kept');
    assertTrue(is_file($mixed . DIRECTORY_SEPARATOR . 'runtime-sweep-state.json'), 'Sweep state file is kept');
} finally {
    removeTree($mixed);
}

$capped = makeTempDir('cap');
try {
    for ($i = 0; $i < 501; $i++) {
        placeFile($capped, cacheFileName('warm-ns', 'warm-' . $i), $now - 120);
        placeFile($capped, cacheFileName('hot-ns', 'hot-' . $i), $now);
    }
    for ($i = 0; $i < 10; $i++) {
        muginSweepRuntimeDirectory($capped, 5000, 8.0);
    }
    assertTrue(countNamed($capped, 'public-search-cache-warm-ns-') === 500, 'Namespace over the file cap is trimmed to 500');
    assertTrue(countNamed($capped, 'public-search-cache-hot-ns-') === 501, 'Files younger than the eviction minimum are kept');
} finally {
    removeTree($capped);
}

echo "\nAll runtime sweep smoke tests passed.\n";
