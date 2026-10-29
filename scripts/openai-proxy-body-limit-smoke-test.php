<?php
/**
 * First-party LLM proxy body ceiling.
 *
 * Run: php scripts/openai-proxy-body-limit-smoke-test.php
 */

require_once __DIR__ . '/../backend/app/helpers.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

$defaultMax = 32 * 1024 * 1024;
assertTrue(
    muginOpenAiProxyMaxBodyBytes() === $defaultMax,
    'Default LLM proxy body ceiling is 32 MiB'
);
assertTrue(
    muginRequestBodyExceedsLimit(0, $defaultMax) === false,
    'Missing Content-Length does not count as oversized'
);
assertTrue(
    muginRequestBodyExceedsLimit($defaultMax, $defaultMax) === false,
    'A body at the ceiling is accepted'
);
assertTrue(
    muginRequestBodyExceedsLimit($defaultMax + 1, $defaultMax) === true,
    'A body above the ceiling is rejected'
);

echo "\nAll OpenAI proxy body-limit smoke tests passed.\n";
