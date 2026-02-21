<?php
/**
 * Editor content API for flat-file topics/filters.
 */

require_once __DIR__ . '/../app/editor-content-store.php';

editorApplyCorsHeaders();
editorHandlePreflight();
editorRequireHttps();
editorRequireAuth();
$sessionUser = editorGetAuthenticatedUser();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $type = strtolower(trim((string) ($_GET['type'] ?? '')));
    $action = strtolower(trim((string) ($_GET['action'] ?? '')));

    if ($action === 'domains' || $type === 'domains') {
        $domains = editorListContentDomains();
        $allowed = editorAllowedDomainsForCurrentUser();
        if (!empty($allowed)) {
            $domains = array_values(array_intersect($domains, $allowed));
        }
        editorAudit('content_domains_listed', ['domains_count' => count($domains)]);
        editorJsonResponse(200, [
            'ok' => true,
            'domains' => $domains,
        ]);
    }

    if ($action === 'revisions') {
        if (!in_array($type, ['topics', 'filters'], true)) {
            editorJsonResponse(400, ['error' => 'Invalid or missing type']);
        }
        $domain = null;
        if ($type === 'topics') {
            $domain = (string) ($_GET['domain'] ?? '');
            if (!editorCanEditDomain($domain)) {
                editorAudit('revisions_forbidden', ['type' => $type, 'domain' => $domain]);
                editorJsonResponse(403, ['error' => 'Forbidden for this domain']);
            }
        } elseif (!editorCanEditFilters()) {
            editorAudit('revisions_forbidden', ['type' => $type, 'domain' => null]);
            editorJsonResponse(403, ['error' => 'Forbidden for filters']);
        }

        $path = editorResolveContentFilePath($type, $domain);
        $revisions = editorListRevisions($path);
        // Hide only the revision entry that represents the current live file.
        // Keep older/newer historical entries even if payload is identical.
        $currentPayload = editorReadJsonFile($path);
        $currentPayloadHash = editorPayloadHash($currentPayload);
        $currentModifiedAt = is_file($path) ? @filemtime($path) : false;
        $currentCreatedAt = $currentModifiedAt !== false ? gmdate('c', (int) $currentModifiedAt) : '';
        $filteredRevisions = [];
        $seenRevisionKeys = [];
        foreach ($revisions as $revision) {
            $revisionId = trim((string) ($revision['revisionId'] ?? ''));
            if ($revisionId === '') {
                continue;
            }
            $revisionPayload = editorLoadRevisionPayload($path, $revisionId);
            $revisionPayloadHash = editorPayloadHash($revisionPayload);
            $revisionCreatedAt = (string) ($revision['createdAt'] ?? '');
            if ($revisionPayloadHash === $currentPayloadHash && $revisionCreatedAt === $currentCreatedAt) {
                continue;
            }
            $revisionKey = $revisionCreatedAt . '|' . $revisionPayloadHash;
            if (isset($seenRevisionKeys[$revisionKey])) {
                $existingIndex = (int) $seenRevisionKeys[$revisionKey];
                $existingRestoredFrom = trim((string) ($filteredRevisions[$existingIndex]['restoredFromRevisionId'] ?? ''));
                $currentRestoredFrom = trim((string) ($revision['restoredFromRevisionId'] ?? ''));
                // Prefer the entry that carries explicit restore metadata.
                if ($existingRestoredFrom === '' && $currentRestoredFrom !== '') {
                    $filteredRevisions[$existingIndex] = $revision;
                }
                continue;
            }
            $seenRevisionKeys[$revisionKey] = count($filteredRevisions);
            $filteredRevisions[] = $revision;
        }
        $revisions = $filteredRevisions;
        editorAudit('revisions_listed', ['type' => $type, 'domain' => $domain, 'count' => count($revisions)]);
        editorJsonResponse(200, [
            'ok' => true,
            'type' => $type,
            'domain' => $domain,
            'revisions' => $revisions,
        ]);
    }
    if ($action === 'revision') {
        if (!in_array($type, ['topics', 'filters'], true)) {
            editorJsonResponse(400, ['error' => 'Invalid or missing type']);
        }
        $revisionId = trim((string) ($_GET['revisionId'] ?? ''));
        if ($revisionId === '') {
            editorJsonResponse(400, ['error' => 'revisionId is required']);
        }
        $domain = null;
        if ($type === 'topics') {
            $domain = (string) ($_GET['domain'] ?? '');
            if (!editorCanEditDomain($domain)) {
                editorAudit('revision_read_forbidden', ['type' => $type, 'domain' => $domain, 'revisionId' => $revisionId]);
                editorJsonResponse(403, ['error' => 'Forbidden for this domain']);
            }
        } elseif (!editorCanEditFilters()) {
            editorAudit('revision_read_forbidden', ['type' => $type, 'domain' => null, 'revisionId' => $revisionId]);
            editorJsonResponse(403, ['error' => 'Forbidden for filters']);
        }

        $path = editorResolveContentFilePath($type, $domain);
        $record = editorLoadRevisionRecord($path, $revisionId);
        editorAudit('revision_read', ['type' => $type, 'domain' => $domain, 'revisionId' => $revisionId]);
        editorJsonResponse(200, [
            'ok' => true,
            'type' => $type,
            'domain' => $domain,
            'revision' => [
                'meta' => $record['meta'],
                'data' => $record['data'],
            ],
        ]);
    }

    if (!in_array($type, ['topics', 'filters'], true)) {
        editorJsonResponse(400, ['error' => 'Invalid or missing type']);
    }

    $domain = null;
    if ($type === 'topics') {
        $domain = (string) ($_GET['domain'] ?? '');
        if (!editorCanEditDomain($domain)) {
            editorAudit('content_read_forbidden', ['type' => $type, 'domain' => $domain]);
            editorJsonResponse(403, ['error' => 'Forbidden for this domain']);
        }
    } else {
        if (!editorCanEditFilters()) {
            editorAudit('content_read_forbidden', ['type' => $type, 'domain' => null]);
            editorJsonResponse(403, ['error' => 'Forbidden for filters']);
        }
    }

    $path = editorResolveContentFilePath($type, $domain);
    $data = editorReadJsonFile($path);
    $currentModifiedAt = is_file($path) ? @filemtime($path) : false;
    $currentChecksum = '';
    if (is_file($path)) {
        $rawCurrent = @file_get_contents($path);
        if (is_string($rawCurrent) && $rawCurrent !== '') {
            $currentChecksum = hash('sha256', $rawCurrent);
        }
    }
    $currentCreatedAt = $currentModifiedAt !== false ? gmdate('c', (int) $currentModifiedAt) : '';
    $currentRestoredFromRevisionId = '';
    $currentRestoredFromCreatedAt = '';
    if ($currentChecksum !== '' && $currentCreatedAt !== '') {
        $revisionsForCurrent = editorListRevisions($path);
        foreach ($revisionsForCurrent as $revision) {
            $revisionChecksum = (string) ($revision['checksum'] ?? '');
            $revisionCreatedAt = (string) ($revision['createdAt'] ?? '');
            if ($revisionChecksum !== $currentChecksum || $revisionCreatedAt !== $currentCreatedAt) {
                continue;
            }
            $currentRestoredFromRevisionId = (string) ($revision['restoredFromRevisionId'] ?? '');
            $currentRestoredFromCreatedAt = (string) ($revision['restoredFromCreatedAt'] ?? '');
            break;
        }
    }
    editorAudit('content_read', ['type' => $type, 'domain' => $domain]);

    editorJsonResponse(200, [
        'ok' => true,
        'type' => $type,
        'domain' => $domain,
        'data' => $data,
        'currentModifiedAt' => $currentModifiedAt !== false ? gmdate('c', (int) $currentModifiedAt) : null,
        'currentChecksum' => $currentChecksum !== '' ? $currentChecksum : null,
        'currentRestoredFromRevisionId' => $currentRestoredFromRevisionId !== '' ? $currentRestoredFromRevisionId : null,
        'currentRestoredFromCreatedAt' => $currentRestoredFromCreatedAt !== '' ? $currentRestoredFromCreatedAt : null,
    ]);
}

if ($method === 'POST') {
    $input = editorReadInput();
    $csrfToken = $input['csrfToken'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);
    editorValidateCsrfToken(is_string($csrfToken) ? $csrfToken : null);

    $action = strtolower(trim((string) ($input['action'] ?? 'save')));
    $type = strtolower(trim((string) ($input['type'] ?? '')));
    if (!in_array($type, ['topics', 'filters'], true)) {
        editorJsonResponse(400, ['error' => 'Invalid or missing type']);
    }

    $domain = null;
    if ($type === 'topics') {
        $domain = (string) ($input['domain'] ?? '');
        if (!editorCanEditDomain($domain)) {
            editorAudit('content_write_forbidden', ['type' => $type, 'domain' => $domain, 'action' => $action]);
            editorJsonResponse(403, ['error' => 'Forbidden for this domain']);
        }
    } else {
        if (!editorCanEditFilters()) {
            editorAudit('content_write_forbidden', ['type' => $type, 'domain' => null, 'action' => $action]);
            editorJsonResponse(403, ['error' => 'Forbidden for filters']);
        }
    }

    $path = editorResolveContentFilePath($type, $domain);
    if ($action === 'revert') {
        $revisionId = trim((string) ($input['revisionId'] ?? ''));
        if ($revisionId === '') {
            editorJsonResponse(400, ['error' => 'revisionId is required']);
        }
        $payload = editorLoadRevisionPayload($path, $revisionId);
        editorValidateContentPayload($type, $payload);
        $currentData = editorReadJsonFile($path);
        if (editorPayloadHash($currentData) === editorPayloadHash($payload)) {
            editorAudit('content_revert_unchanged', [
                'type' => $type,
                'domain' => $domain,
                'revisionId' => $revisionId,
            ]);
            editorJsonResponse(200, [
                'ok' => true,
                'type' => $type,
                'domain' => $domain,
                'unchanged' => true,
                'savedAt' => gmdate('c'),
            ]);
        }
        $snapshotBeforeRevert = editorSnapshotCurrentFile($path, $type, $domain);
        if ($snapshotBeforeRevert === null) {
            editorAudit('content_revert_failed_no_history', [
                'type' => $type,
                'domain' => $domain,
                'revisionId' => $revisionId,
            ]);
            editorJsonResponse(500, ['error' => 'Failed to create pre-revert snapshot']);
        }
        editorWriteJsonAtomic($path, $payload);
        $restoredRevisionId = editorSnapshotCurrentFile($path, $type, $domain, [
            'restoredFromRevisionId' => $revisionId,
        ]);
        if ($restoredRevisionId === null) {
            editorAudit('content_revert_failed_history_write', [
                'type' => $type,
                'domain' => $domain,
                'revisionId' => $revisionId,
            ]);
            editorJsonResponse(500, ['error' => 'Failed to write revision history']);
        }
        editorAudit('content_reverted', [
            'type' => $type,
            'domain' => $domain,
            'revisionId' => $revisionId,
            'snapshotBeforeRevert' => $snapshotBeforeRevert,
            'restoredRevisionId' => $restoredRevisionId,
            'user' => $sessionUser['username'] ?? '',
        ]);
        editorJsonResponse(200, [
            'ok' => true,
            'type' => $type,
            'domain' => $domain,
            'revertedFromRevisionId' => $revisionId,
            'revisionId' => $restoredRevisionId,
            'savedAt' => gmdate('c'),
        ]);
    }

    if (!array_key_exists('data', $input) || !is_array($input['data'])) {
        editorJsonResponse(400, ['error' => 'data must be a JSON object']);
    }

    $payload = $input['data'];
    editorValidateContentPayload($type, $payload);
    $currentData = editorReadJsonFile($path);
    if (editorPayloadHash($currentData) === editorPayloadHash($payload)) {
        editorAudit('content_save_unchanged', ['type' => $type, 'domain' => $domain]);
        editorJsonResponse(200, [
            'ok' => true,
            'type' => $type,
            'domain' => $domain,
            'unchanged' => true,
            'savedAt' => gmdate('c'),
        ]);
    }
    $snapshotBeforeSave = editorSnapshotCurrentFile($path, $type, $domain);
    if ($snapshotBeforeSave === null && is_file($path)) {
        editorAudit('content_save_failed_no_history', ['type' => $type, 'domain' => $domain]);
        editorJsonResponse(500, ['error' => 'Failed to create pre-save snapshot']);
    }
    editorWriteJsonAtomic($path, $payload);
    // Keep exactly one history entry per save operation.
    // For existing files we use the pre-save snapshot as the revision entry.
    $revisionId = $snapshotBeforeSave;
    if ($revisionId === null) {
        // First save / missing file: snapshot the newly written content once.
        $revisionId = editorSnapshotCurrentFile($path, $type, $domain);
    }
    if ($revisionId === null) {
        editorAudit('content_save_failed_history_write', ['type' => $type, 'domain' => $domain]);
        editorJsonResponse(500, ['error' => 'Failed to write revision history']);
    }
    editorAudit('content_saved', [
        'type' => $type,
        'domain' => $domain,
        'revisionId' => $revisionId,
        'snapshotBeforeSave' => $snapshotBeforeSave,
        'user' => $sessionUser['username'] ?? '',
    ]);

    editorJsonResponse(200, [
        'ok' => true,
        'type' => $type,
        'domain' => $domain,
        'savedAt' => gmdate('c'),
        'revisionId' => $revisionId,
    ]);
}

editorJsonResponse(405, ['error' => 'Method not allowed']);
