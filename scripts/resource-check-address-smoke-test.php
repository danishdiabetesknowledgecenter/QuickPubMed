<?php
/**
 * Public-address check used before CheckIfResourceIsForbidden forwards a URL.
 *
 * Run: php scripts/resource-check-address-smoke-test.php
 */

require_once __DIR__ . '/../backend/api/SummarizeArticleHelpers.php';

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: $message\n");
        exit(1);
    }
    echo "PASS: $message\n";
}

foreach (['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '::1'] as $ip) {
    assertTrue(muginIsPublicIpAddress($ip) === false, $ip . ' is not a public address');
    assertTrue(muginHostResolvesToPublicAddresses($ip) === false, $ip . ' is not forwarded');
}
foreach (['8.8.8.8', '1.1.1.1'] as $ip) {
    assertTrue(muginIsPublicIpAddress($ip) === true, $ip . ' is a public address');
    assertTrue(muginHostResolvesToPublicAddresses($ip) === true, $ip . ' stays on the existing fetch path');
}

assertTrue(
    muginHostResolvesToPublicAddresses('unresolved.invalid') === false,
    'An unresolved name is not forwarded'
);

$local = @gethostbynamel('localtest.me');
if (is_array($local) && $local !== []) {
    assertTrue(
        muginHostResolvesToPublicAddresses('localtest.me') === false,
        'localtest.me is not forwarded when it resolves locally'
    );
}

echo "\nAll resource-check address smoke tests passed.\n";
