<?php
/**
 * Local-only router for PHP's built-in development server.
 *
 * It keeps the existing /backend/api/* and /public-api/* URL contract while
 * preventing the dev server from serving arbitrary files from the repo root.
 */

$requestPath = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$requestPath = is_string($requestPath) ? rawurldecode($requestPath) : '/';
$requestPath = '/' . ltrim(str_replace('\\', '/', $requestPath), '/');

if (strpos($requestPath, "\0") !== false || strpos($requestPath, '..') !== false) {
    http_response_code(400);
    echo 'Bad request';
    return true;
}

$allowedPrefixes = [
    '/backend/api/',
    '/public-api/',
];

$isAllowed = false;
foreach ($allowedPrefixes as $prefix) {
    if (strpos($requestPath, $prefix) === 0) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
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

return false;
