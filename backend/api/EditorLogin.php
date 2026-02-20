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

$rateKey = editorBuildRateLimitKey($username);
$rateLimit = editorIsRateLimited($rateKey);
if ($rateLimit['limited']) {
    header('Retry-After: ' . (string) $rateLimit['retry_after']);
    editorAudit('login_rate_limited', ['username' => $username]);
    editorJsonResponse(429, ['error' => 'Too many login attempts']);
}

if (empty(editorConfiguredUsers())) {
    editorJsonResponse(500, ['error' => 'Editor auth is not configured']);
}

$authResult = editorAuthenticateCredentials($username, $password);
$isValid = !empty($authResult['ok']) && is_array($authResult['user']);

if (!$isValid) {
    editorRegisterFailedAttempt($rateKey);
    editorAudit('login_failed', ['username' => $username]);
    editorJsonResponse(401, ['error' => 'Invalid credentials']);
}

$user = $authResult['user'];
editorResetFailedAttempts($rateKey);
session_regenerate_id(true);
editorSetSessionUser($user);
$csrfToken = editorRotateCsrfToken();
editorAudit('login_success', [
    'username' => (string) ($user['username'] ?? $username),
    'can_edit_filters' => !empty($user['can_edit_filters']),
    'allowed_domains' => $user['allowed_domains'] ?? [],
]);

editorJsonResponse(200, [
    'ok' => true,
    'csrfToken' => $csrfToken,
    'user' => $_SESSION['editor_user'],
    'capabilities' => [
        'canEditFilters' => !empty($_SESSION['editor_can_edit_filters']),
        'allowedDomains' => editorNormalizeDomainsList($_SESSION['editor_allowed_domains'] ?? []),
    ],
]);
