<?php
/**
 * Public read-only content API for topics/filters.
 */

require_once __DIR__ . '/../app/editor-content-store.php';

header('Access-Control-Allow-Origin: *');
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
editorHandlePreflight();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') {
    editorJsonResponse(405, ['error' => 'Method not allowed']);
}

$type = strtolower(trim((string) ($_GET['type'] ?? '')));
$action = strtolower(trim((string) ($_GET['action'] ?? '')));

if ($action === 'domains' || $type === 'domains') {
    editorJsonResponse(200, [
        'ok' => true,
        'domains' => editorListContentDomains(),
    ]);
}

if (!in_array($type, ['topics', 'filters', 'prompt-rules'], true)) {
    editorJsonResponse(400, ['error' => 'Invalid or missing type']);
}

$domain = null;
if ($type === 'topics' || $type === 'prompt-rules') {
    $domain = (string) ($_GET['domain'] ?? '');
}

$path = '';
if ($type === 'prompt-rules') {
    $normalizedDomain = editorNormalizeDomain((string) $domain);
    if ($normalizedDomain === '') {
        editorJsonResponse(400, ['error' => 'Domain is required for prompt-rules']);
    }
    if (!editorIsAllowedDomain($normalizedDomain)) {
        editorJsonResponse(400, ['error' => 'Domain is not allowed']);
    }
    $path = editorContentBaseDir() . DIRECTORY_SEPARATOR . $normalizedDomain . DIRECTORY_SEPARATOR . 'prompt-rules.json';
} else {
    $path = editorResolveContentFilePath($type, $domain);
}
$data = editorReadJsonFile($path);

editorJsonResponse(200, [
    'ok' => true,
    'type' => $type,
    'domain' => $domain,
    'data' => $data,
]);
