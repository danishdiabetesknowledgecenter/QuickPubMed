<?php
/**
 * Editor HTTPS detection must keep direct TLS and local proxies working,
 * and ignore X-Forwarded-Proto from a public client.
 *
 * Run: php scripts/editor-https-proxy-smoke-test.php
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

function withRequest(array $server, callable $check): bool
{
    $previous = [];
    foreach (['HTTPS', 'HTTP_X_FORWARDED_PROTO', 'REMOTE_ADDR'] as $key) {
        $previous[$key] = $_SERVER[$key] ?? null;
        unset($_SERVER[$key]);
    }
    foreach ($server as $key => $value) {
        $_SERVER[$key] = $value;
    }
    try {
        return $check();
    } finally {
        foreach ($previous as $key => $value) {
            if ($value === null) {
                unset($_SERVER[$key]);
            } else {
                $_SERVER[$key] = $value;
            }
        }
    }
}

assertTrue(
    withRequest([
        'HTTPS' => 'on',
        'REMOTE_ADDR' => '1.1.1.1',
        'HTTP_X_FORWARDED_PROTO' => 'http',
    ], static fn (): bool => editorIsHttpsRequest()),
    'Direct HTTPS stays HTTPS'
);
assertTrue(
    withRequest([
        'HTTPS' => 'off',
        'REMOTE_ADDR' => '1.1.1.1',
        'HTTP_X_FORWARDED_PROTO' => 'https',
    ], static fn (): bool => editorIsHttpsRequest() === false),
    'Public client cannot assert X-Forwarded-Proto'
);
assertTrue(
    withRequest([
        'HTTPS' => 'off',
        'REMOTE_ADDR' => '127.0.0.1',
        'HTTP_X_FORWARDED_PROTO' => 'https',
    ], static fn (): bool => editorIsHttpsRequest()),
    'Loopback proxy can assert X-Forwarded-Proto'
);
assertTrue(
    withRequest([
        'REMOTE_ADDR' => '10.1.2.3',
        'HTTP_X_FORWARDED_PROTO' => 'https',
    ], static fn (): bool => editorIsHttpsRequest()),
    'Private proxy can assert X-Forwarded-Proto'
);
assertTrue(
    withRequest([
        'REMOTE_ADDR' => '10.1.2.3',
        'HTTP_X_FORWARDED_PROTO' => 'http',
    ], static fn (): bool => editorIsHttpsRequest() === false),
    'Trusted proxy with http proto stays non-HTTPS'
);

echo "\nAll editor HTTPS proxy smoke tests passed.\n";
