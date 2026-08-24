<?php
/**
 * Local-only router for PHP's built-in development server.
 *
 * It keeps the existing /backend/api/* and /public-api/* URL contract while
 * preventing the dev server from serving arbitrary files from the repo root.
 *
 * public-api host-swap (same reserved list as public-api/.htaccess):
 * /v1/health and /v1/openapi.yaml stay; every other public-api path is search.
 */

$requestPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$requestPath = is_string($requestPath) ? rawurldecode($requestPath) : '/';
$requestPath = '/' . ltrim(str_replace('\\', '/', $requestPath), '/');

if (strpos($requestPath, "\0") !== false || strpos($requestPath, '..') !== false) {
    http_response_code(400);
    echo 'Bad request';
    return true;
}

$isPublicApiRoot = ($requestPath === '/public-api');
$isPublicApiPath = $isPublicApiRoot || strpos($requestPath, '/public-api/') === 0;
$isBackendApiPath = strpos($requestPath, '/backend/api/') === 0;

if (!$isPublicApiPath && !$isBackendApiPath) {
    http_response_code(404);
    echo 'Not found';
    return true;
}

// Same clean public-api routes as public-api/.htaccess (php -S ignores htaccess).
$publicApiRewrites = [
    '/public-api/v1/openapi.yaml' => '/public-api/v1/openapi.php',
    '/public-api/v1/search' => '/public-api/v1/search.php',
    '/public-api/v1/health' => '/public-api/v1/health.php',
];
$rewriteKey = rtrim($requestPath, '/');
if (isset($publicApiRewrites[$rewriteKey])) {
    $requestPath = $publicApiRewrites[$rewriteKey];
} elseif ($isPublicApiPath) {
    $reservedPublicApiFiles = [
        '/public-api/v1/search.php' => true,
        '/public-api/v1/health.php' => true,
        '/public-api/v1/openapi.php' => true,
    ];
    if (!isset($reservedPublicApiFiles[$rewriteKey])) {
        $requestPath = '/public-api/v1/search.php';
    }
}

$fullPath = realpath(dirname(__DIR__) . $requestPath);
$repoRoot = realpath(dirname(__DIR__));

if (
    $fullPath === false ||
    $repoRoot === false ||
    strpos($fullPath, $repoRoot . DIRECTORY_SEPARATOR) !== 0 ||
    !is_file($fullPath)
) {
    http_response_code(404);
    echo 'Not found';
    return true;
}

// php -S serves the original REQUEST_URI when the router returns false, so
// rewritten routes like /public-api/v1/health would 404 even though the
// target .php file exists. Include the resolved file instead.
$_SERVER['SCRIPT_FILENAME'] = $fullPath;
$scriptName = str_replace('\\', '/', substr($fullPath, strlen($repoRoot)));
$_SERVER['SCRIPT_NAME'] = str_starts_with($scriptName, '/') ? $scriptName : '/' . $scriptName;
require $fullPath;
return true;
