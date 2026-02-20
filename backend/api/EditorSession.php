<?php
/**
 * Check editor session status.
 */

require_once __DIR__ . '/../app/editor-auth.php';

editorApplyCorsHeaders();
editorHandlePreflight();
editorRequireMethod('GET');
editorRequireHttps();
editorStartSession();

if (!empty($_SESSION['editor_authenticated']) && $_SESSION['editor_authenticated'] === true) {
    editorEnforceSessionTimeout();
    $csrfToken = editorEnsureCsrfToken();
    $user = editorGetAuthenticatedUser();
    editorJsonResponse(200, [
        'authenticated' => true,
        'user' => $_SESSION['editor_user'] ?? '',
        'csrfToken' => $csrfToken,
        'capabilities' => [
            'canEditFilters' => $user ? !empty($user['can_edit_filters']) : false,
            'allowedDomains' => $user ? editorNormalizeDomainsList($user['allowed_domains'] ?? []) : [],
        ],
    ]);
}

editorJsonResponse(200, ['authenticated' => false]);
