<?php
/**
 * Editor login counter: 8 failures inside 15 minutes, then the next check is limited.
 * An expired window starts again at 1. Other stored keys are left in place.
 *
 * Run: php scripts/editor-login-rate-limit-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/editor-auth.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

$key = 'smoke-' . bin2hex(random_bytes(8));
$path = editorRateLimitFilePath();
$before = [];
if (is_file($path)) {
    $decoded = json_decode((string) file_get_contents($path), true);
    $before = is_array($decoded) ? array_keys($decoded) : [];
}

try {
    editorResetFailedAttempts($key);
    assertTrue(editorIsRateLimited($key)['limited'] === false, 'A new login key is not limited');

    for ($attempt = 1; $attempt <= 7; $attempt++) {
        editorRegisterFailedAttempt($key);
    }
    assertTrue(editorIsRateLimited($key)['limited'] === false, 'Seven failures stay under the limit');

    editorRegisterFailedAttempt($key);
    $limited = editorIsRateLimited($key);
    assertTrue($limited['limited'] === true, 'Eight failures trip the limit');
    assertTrue((int) $limited['retry_after'] > 0, 'Limited login includes a retry delay');

    $stored = json_decode((string) file_get_contents($path), true);
    assertTrue(is_array($stored) && isset($stored[$key]), 'Smoke key is stored with the existing counter file');
    $stored[$key]['first_attempt'] = time() - 901;
    file_put_contents(
        $path,
        json_encode($stored, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
    assertTrue(editorIsRateLimited($key)['limited'] === false, 'A window older than 15 minutes is not limited');

    editorRegisterFailedAttempt($key);
    assertTrue(editorIsRateLimited($key)['limited'] === false, 'An expired window starts again at one failure');

    $after = json_decode((string) file_get_contents($path), true);
    $after = is_array($after) ? $after : [];
    foreach ($before as $existingKey) {
        if ($existingKey === $key) {
            continue;
        }
        assertTrue(array_key_exists($existingKey, $after), 'Existing login counter ' . $existingKey . ' is kept');
    }
} finally {
    editorResetFailedAttempts($key);
}

echo "\nAll editor login rate-limit smoke tests passed.\n";
