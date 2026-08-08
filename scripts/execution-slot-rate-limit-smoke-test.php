<?php
/**
 * Smoke test for audit fase 1:
 * - execution slots acquire/release on happy path
 * - capacity-full returns 503 with the capacity message
 * - rate-limit increments and eventually limits
 * - Windows-safe cache overwrite works for the same key
 *
 * Run: php scripts/execution-slot-rate-limit-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';
require_once __DIR__ . '/../backend/app/semantic-quality-lib.php';
require_once __DIR__ . '/../backend/app/public-search-lib.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

// --- Cache overwrite (Windows rename path) ---
$namespace = 'audit-smoke';
$cacheKey = 'audit-smoke-key-' . uniqid('', true);
qpmPublicSearchWriteCacheValue($namespace, $cacheKey, ['v' => 1], 120);
$first = qpmPublicSearchReadCacheValue($namespace, $cacheKey);
assertTrue(($first['hit'] ?? false) === true && (($first['value']['v'] ?? null) === 1), 'Cache write/read hit for first value');
qpmPublicSearchWriteCacheValue($namespace, $cacheKey, ['v' => 2], 120);
$second = qpmPublicSearchReadCacheValue($namespace, $cacheKey);
assertTrue(($second['hit'] ?? false) === true && (($second['value']['v'] ?? null) === 2), 'Cache overwrite replaces existing file (Windows-safe rename)');

// --- Execution slot happy path ---
$slot = qpmPublicSearchAcquireExecutionSlot(10);
assertTrue(is_string($slot['token'] ?? null) && $slot['token'] !== '', 'AcquireExecutionSlot returns non-empty token');
assertTrue(is_string($slot['path'] ?? null) && is_file((string) $slot['path']), 'AcquireExecutionSlot creates lock file');
qpmPublicSearchReleaseExecutionSlot($slot);
assertTrue(!is_file((string) $slot['path']), 'ReleaseExecutionSlot removes lock file');

// --- Capacity full ---
$held = [];
try {
    for ($i = 0; $i < 2; $i++) {
        $held[] = qpmPublicSearchAcquireExecutionSlot(2);
    }
    $threwCapacity = false;
    $capacityMessage = '';
    try {
        qpmPublicSearchAcquireExecutionSlot(2);
    } catch (RuntimeException $exception) {
        $threwCapacity = $exception->getCode() === 503;
        $capacityMessage = $exception->getMessage();
    }
    assertTrue($threwCapacity, 'Capacity full throws 503');
    assertTrue(strpos($capacityMessage, 'temporarily full') !== false, 'Capacity full uses capacity message (not unavailable)');
} finally {
    foreach ($held as $heldSlot) {
        qpmPublicSearchReleaseExecutionSlot($heldSlot);
    }
}

// --- Rate limit happy path + limit ---
$client = [
    'client_id' => 'audit-smoke-' . preg_replace('/[^a-z0-9]+/i', '', uniqid('', true)),
    'rate_limit_per_minute' => 2,
    'get_rate_limit_per_minute' => 2,
];
$firstLimit = qpmPublicSearchConsumeRateLimit($client, 'POST');
assertTrue(($firstLimit['isLimited'] ?? true) === false, 'First rate-limit consume is not limited');
assertTrue((int) ($firstLimit['remaining'] ?? -1) === 1, 'First rate-limit consume leaves remaining=1');
$secondLimit = qpmPublicSearchConsumeRateLimit($client, 'POST');
assertTrue(($secondLimit['isLimited'] ?? true) === false, 'Second rate-limit consume is not limited');
assertTrue((int) ($secondLimit['remaining'] ?? -1) === 0, 'Second rate-limit consume leaves remaining=0');
$thirdLimit = qpmPublicSearchConsumeRateLimit($client, 'POST');
assertTrue(($thirdLimit['isLimited'] ?? false) === true, 'Third rate-limit consume is limited');
assertTrue((int) ($thirdLimit['status'] ?? 0) === 429, 'Third rate-limit consume returns status 429');

echo "\nAll execution-slot/rate-limit smoke tests passed.\n";
