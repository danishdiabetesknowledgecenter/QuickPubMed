<?php
/**
 * Smoke test for audit fase 2 helpers:
 * - OpenAI model allowlist maps unknown models
 * - IP rate-limit increments and eventually limits
 *
 * Run: php scripts/first-party-hardening-smoke-test.php
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

assertTrue(
    qpmResolveAllowedOpenAiModel('gpt-5.5', 'gpt-5.5') === 'gpt-5.5',
    'Allowlisted gpt-5.5 passes through'
);
assertTrue(
    qpmResolveAllowedOpenAiModel('gpt-5.4-nano', 'gpt-5.5') === 'gpt-5.4-nano',
    'Allowlisted gpt-5.4-nano passes through'
);
assertTrue(
    qpmResolveAllowedOpenAiModel('gpt-4', 'gpt-5.5') === 'gpt-5.5',
    'Unknown model maps to default (not rejected)'
);
assertTrue(
    qpmClampOpenAiMaxOutputTokens(999999, 2048, 4096) === 4096,
    'max_output_tokens is capped'
);
assertTrue(
    qpmClampOpenAiReasoningEffort('nope', 'none') === 'none',
    'Unknown reasoning effort maps to default'
);

$_SERVER['REMOTE_ADDR'] = '203.0.113.' . (string) random_int(1, 254);
$class = 'openaiProxy-smoke-' . preg_replace('/[^a-z0-9]+/i', '', uniqid('', true));
$first = qpmConsumeIpRateLimit($class, 2);
assertTrue(($first['isLimited'] ?? true) === false, 'First IP rate-limit consume is not limited');
$second = qpmConsumeIpRateLimit($class, 2);
assertTrue(($second['isLimited'] ?? true) === false, 'Second IP rate-limit consume is not limited');
$third = qpmConsumeIpRateLimit($class, 2);
assertTrue(($third['isLimited'] ?? false) === true, 'Third IP rate-limit consume is limited');

echo "\nAll first-party hardening smoke tests passed.\n";
