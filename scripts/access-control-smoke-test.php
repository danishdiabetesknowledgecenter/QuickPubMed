<?php
/**
 * Smoke test for Phase 2A's deny-all-by-default per-client source access
 * control, matching the plan's gate exactly:
 *  - allowed_sources: ['pubmed'] requesting ['pubmed','elicit'] -> proceeds
 *    with pubmed only, plus a warning naming elicit.
 *  - no allowed_sources key at all -> 403, zero sources ever attempted.
 *  - allowed_sources: [] -> 403 (explicit empty list is also deny-all).
 *
 * Run: php scripts/access-control-smoke-test.php
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

// Case 1: partial allow -> proceeds with permitted subset + warning.
$request = ['sources' => ['pubmed', 'elicit']];
$client = ['client_id' => 'partial-client', 'allowed_sources' => ['pubmed']];
$result = qpmPublicSearchEnforceClientSourceAccess($request, $client);
assertTrue($result['sources'] === ['pubmed'], 'Partial allow: sources filtered down to permitted subset');
assertTrue(
    isset($result['_sourceAccessWarnings'][0]) && strpos($result['_sourceAccessWarnings'][0], 'elicit') !== false,
    'Partial allow: warning mentions the denied source (elicit)'
);

// Case 2: no allowed_sources key at all -> 403.
$request2 = ['sources' => ['pubmed']];
$client2 = ['client_id' => 'no-config-client'];
$threw403 = false;
try {
    qpmPublicSearchEnforceClientSourceAccess($request2, $client2);
} catch (RuntimeException $exception) {
    $threw403 = $exception->getCode() === 403;
}
assertTrue($threw403, 'No allowed_sources key at all -> throws 403 (deny-all-by-default)');

// Case 3: explicit empty allowed_sources -> 403.
$request3 = ['sources' => ['openAlex']];
$client3 = ['client_id' => 'empty-list-client', 'allowed_sources' => []];
$threw403Empty = false;
try {
    qpmPublicSearchEnforceClientSourceAccess($request3, $client3);
} catch (RuntimeException $exception) {
    $threw403Empty = $exception->getCode() === 403;
}
assertTrue($threw403Empty, 'Explicit empty allowed_sources -> throws 403');

// Case 4: full access client (all 4 sources) -> passes through unchanged, no warning.
$request4 = ['sources' => ['pubmed', 'openAlex']];
$client4 = ['client_id' => 'full-client', 'allowed_sources' => ['pubmed', 'semanticScholar', 'openAlex', 'elicit']];
$result4 = qpmPublicSearchEnforceClientSourceAccess($request4, $client4);
assertTrue($result4['sources'] === ['pubmed', 'openAlex'], 'Full access client: all requested sources pass through');
assertTrue(!isset($result4['_sourceAccessWarnings']), 'Full access client: no access warning attached');

// Case 5: per-client source API key override resolution.
$clientWithKeys = ['source_api_keys' => ['openAlex' => 'client-own-openalex-key', 'elicit' => '']];
assertTrue(
    qpmPublicSearchClientSourceApiKey($clientWithKeys, 'openAlex') === 'client-own-openalex-key',
    'Per-client source API key override resolves when set'
);
assertTrue(
    qpmPublicSearchClientSourceApiKey($clientWithKeys, 'elicit') === '',
    'Per-client source API key override falls back to empty (global default) when blank'
);
assertTrue(
    qpmPublicSearchClientSourceApiKey($clientWithKeys, 'semanticScholar') === '',
    'Per-client source API key override falls back to empty (global default) when source key absent entirely'
);

echo "\nAll access-control smoke tests passed.\n";
