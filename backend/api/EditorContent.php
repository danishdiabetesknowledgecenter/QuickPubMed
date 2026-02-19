<?php
/**
 * Editor content API for flat-file topics/filters.
 */

require_once __DIR__ . '/../app/editor-content-store.php';

editorApplyCorsHeaders();
editorHandlePreflight();
editorRequireHttps();
editorRequireAuth();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $type = strtolower(trim((string) ($_GET['type'] ?? '')));
    $action = strtolower(trim((string) ($_GET['action'] ?? '')));

    if ($action === 'domains' || $type === 'domains') {
        editorJsonResponse(200, [
            'ok' => true,
            'domains' => editorListContentDomains(),
        ]);
    }

    if (!in_array($type, ['topics', 'filters'], true)) {
        editorJsonResponse(400, ['error' => 'Invalid or missing type']);
    }

    $domain = null;
    if ($type === 'topics') {
        $domain = (string) ($_GET['domain'] ?? '');
    }

    $path = editorResolveContentFilePath($type, $domain);
    $data = editorReadJsonFile($path);

    editorJsonResponse(200, [
        'ok' => true,
        'type' => $type,
        'domain' => $domain,
        'data' => $data,
    ]);
}

if ($method === 'POST') {
    $input = editorReadInput();
    $csrfToken = $input['csrfToken'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);
    editorValidateCsrfToken(is_string($csrfToken) ? $csrfToken : null);

    $type = strtolower(trim((string) ($input['type'] ?? '')));
    if (!in_array($type, ['topics', 'filters'], true)) {
        editorJsonResponse(400, ['error' => 'Invalid or missing type']);
    }

    $domain = null;
    if ($type === 'topics') {
        $domain = (string) ($input['domain'] ?? '');
    }

    if (!array_key_exists('data', $input) || !is_array($input['data'])) {
        editorJsonResponse(400, ['error' => 'data must be a JSON object']);
    }

    $payload = $input['data'];
    editorValidateContentPayload($type, $payload);

    $path = editorResolveContentFilePath($type, $domain);
    editorWriteJsonAtomic($path, $payload);

    editorJsonResponse(200, [
        'ok' => true,
        'type' => $type,
        'domain' => $domain,
        'savedAt' => gmdate('c'),
    ]);
}

editorJsonResponse(405, ['error' => 'Method not allowed']);
