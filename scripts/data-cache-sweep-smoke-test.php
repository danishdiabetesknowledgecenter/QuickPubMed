<?php
/**
 * Smoke test for data/cache sweep: expired files are removed, and fresh files
 * are trimmed to the file count and byte caps, oldest first.
 *
 * Run: php scripts/data-cache-sweep-smoke-test.php
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

function placeFile(string $dir, string $name, int $mtime, int $bytes): string
{
    $path = $dir . DIRECTORY_SEPARATOR . $name;
    file_put_contents($path, str_repeat('x', $bytes));
    touch($path, $mtime);
    clearstatcache(true, $path);
    return $path;
}

function makeTempDir(string $label): string
{
    $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'mugin-data-cache-sweep-' . $label . '-' . uniqid('', true);
    if (!mkdir($dir, 0700, true) && !is_dir($dir)) {
        fwrite(STDERR, "FAIL: could not create temp dir\n");
        exit(1);
    }
    return $dir;
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

function cacheBytes(string $dir): int
{
    $total = 0;
    foreach (scandir($dir) ?: [] as $name) {
        if ($name === '.' || $name === '..' || $name === 'cache-sweep-state.json') {
            continue;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $name;
        if (!is_file($path)) {
            continue;
        }
        $size = filesize($path);
        if ($size !== false) {
            $total += (int) $size;
        }
    }
    return $total;
}

$now = time();
$dir = makeTempDir('mixed');
try {
    $expired = placeFile($dir, 'expired.json', $now - 5000, 100);
    $fresh = placeFile($dir, 'fresh.json', $now - 30, 100);
    $notes = placeFile($dir, 'notes.txt', $now - 9000, 100);
    placeFile($dir, 'old-a.json', $now - 400, 4000);
    placeFile($dir, 'old-b.json', $now - 300, 4000);
    placeFile($dir, 'mid.json', $now - 200, 4000);
    placeFile($dir, 'new.json', $now - 100, 4000);

    muginSweepDataCacheDirectory($dir, 2, 1000, '*.json', 9000, 5.0);

    assertTrue(!is_file($expired), 'File older than max age is deleted');
    assertTrue(is_file($fresh), 'Fresh file within the cap is kept');
    assertTrue(is_file($notes), 'Non-json file is kept');
    assertTrue(!is_file($dir . DIRECTORY_SEPARATOR . 'old-a.json'), 'Oldest file over the cap is deleted');
    assertTrue(!is_file($dir . DIRECTORY_SEPARATOR . 'old-b.json'), 'Second-oldest file over the cap is deleted');
    assertTrue(!is_file($dir . DIRECTORY_SEPARATOR . 'mid.json'), 'File beyond the count cap is deleted');
    assertTrue(is_file($dir . DIRECTORY_SEPARATOR . 'new.json'), 'Newest file is kept');
    assertTrue(cacheBytes($dir) <= 9000, 'Remaining cache stays within the byte cap');
    assertTrue(is_file($dir . DIRECTORY_SEPARATOR . 'cache-sweep-state.json'), 'Sweep state file is kept');
} finally {
    removeTree($dir);
}

echo "\nAll data cache sweep smoke tests passed.\n";
