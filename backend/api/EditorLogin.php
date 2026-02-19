<?php
/**
 * Editor login endpoint (no database).
 */

require_once __DIR__ . '/../app/editor-auth.php';

editorApplyCorsHeaders();
editorHandlePreflight();
editorRequireMethod('POST');
editorRequireHttps();
editorStartSession();

$input = editorReadInput();
$username = trim((string) ($input['user'] ?? ''));
$password = (string) ($input['password'] ?? '');

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateKey = hash('sha256', strtolower($username) . '|' . $ip);
$rateLimit = editorIsRateLimited($rateKey);
if ($rateLimit['limited']) {
    header('Retry-After: ' . (string) $rateLimit['retry_after']);
    editorJsonResponse(429, ['error' => 'Too many login attempts']);
}

if (!defined('EDITOR_USER') || !defined('EDITOR_PASSWORD_HASH')) {
    editorJsonResponse(500, ['error' => 'Editor auth is not configured']);
}

$isValid = hash_equals((string) EDITOR_USER, $username)
    && password_verify($password, (string) EDITOR_PASSWORD_HASH);

if (!$isValid) {
    editorRegisterFailedAttempt($rateKey);
    editorJsonResponse(401, ['error' => 'Invalid credentials']);
}

editorResetFailedAttempts($rateKey);
session_regenerate_id(true);
$_SESSION['editor_authenticated'] = true;
$_SESSION['editor_user'] = (string) EDITOR_USER;
$_SESSION['editor_last_activity'] = time();
$csrfToken = editorEnsureCsrfToken();

editorJsonResponse(200, [
    'ok' => true,
    'csrfToken' => $csrfToken,
    'user' => $_SESSION['editor_user'],
]);
