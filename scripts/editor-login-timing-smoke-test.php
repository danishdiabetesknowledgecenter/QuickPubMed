<?php
/**
 * Unknown editor usernames and wrong passwords both fail closed and both run password_verify.
 *
 * Run: php scripts/editor-login-timing-smoke-test.php
 */

$configPath = __DIR__ . '/../backend/config/config.php';
$legacyConfigPath = __DIR__ . '/../backend/config.php';
if (!is_file($configPath) && !is_file($legacyConfigPath)) {
    echo "SKIP: editor config is not present\n";
    exit(0);
}

require_once __DIR__ . '/../backend/app/editor-auth.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

function elapsedSeconds(callable $callback): float
{
    $started = microtime(true);
    $callback();
    return microtime(true) - $started;
}

$unknownSeconds = elapsedSeconds(static function (): void {
    $result = editorAuthenticateCredentials('no-such-editor-user', 'not-the-password');
    assertTrue($result['ok'] === false && $result['user'] === null, 'Unknown username is rejected');
});
assertTrue($unknownSeconds >= 0.02, 'Unknown username runs a password hash check');

$users = editorConfiguredUsers();
$username = '';
foreach ($users as $name => $user) {
    if (is_string($name) && $name !== '' && is_array($user) && !empty($user['password_hash']) && empty($user['disabled'])) {
        $username = $name;
        break;
    }
}
if ($username !== '') {
    $wrongSeconds = elapsedSeconds(static function () use ($username): void {
        $result = editorAuthenticateCredentials($username, 'not-the-password');
        assertTrue($result['ok'] === false && $result['user'] === null, 'Wrong password is rejected');
    });
    assertTrue($wrongSeconds >= 0.02, 'Wrong password runs a password hash check');
}

echo "\nAll editor login timing smoke tests passed.\n";
