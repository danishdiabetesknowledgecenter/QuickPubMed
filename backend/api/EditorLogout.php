<?php
/**
 * Editor logout endpoint.
 */

require_once __DIR__ . '/../app/editor-auth.php';

editorApplyCorsHeaders();
editorHandlePreflight();
editorRequireMethod('POST');
editorRequireHttps();
editorRequireAuth();

$input = editorReadInput();
$csrfToken = $input['csrfToken'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);
editorValidateCsrfToken(is_string($csrfToken) ? $csrfToken : null);
editorAudit('logout', ['user' => (string) ($_SESSION['editor_user'] ?? '')]);
editorRotateCsrfToken();

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
}
session_destroy();

editorJsonResponse(200, ['ok' => true]);
