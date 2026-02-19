<?php
/**
 * Flat-file content store for editor API.
 */

require_once __DIR__ . '/editor-auth.php';

/**
 * Base directory for editable JSON content.
 */
function editorContentBaseDir(): string
{
    $newBaseDir = dirname(__DIR__) . '/storage/content';
    $legacyBaseDir = dirname(__DIR__) . '/content';

    $newHasData = is_file($newBaseDir . '/filters.json') || !empty(glob($newBaseDir . '/*/topics.json'));
    $legacyHasData = is_file($legacyBaseDir . '/filters.json') || !empty(glob($legacyBaseDir . '/*/topics.json'));

    if ($newHasData || !$legacyHasData) {
        return $newBaseDir;
    }

    // Compatibility fallback while legacy content folder is still in use.
    return $legacyBaseDir;
}

/**
 * Ensure base content directory exists.
 */
function editorEnsureContentBaseDir(): void
{
    $baseDir = editorContentBaseDir();
    if (!is_dir($baseDir)) {
        @mkdir($baseDir, 0750, true);
    }
}

/**
 * Return configured allowlist domains if available.
 */
function editorConfiguredAllowedDomains(): array
{
    if (!defined('EDITOR_ALLOWED_CONTENT_DOMAINS') || !is_array(EDITOR_ALLOWED_CONTENT_DOMAINS)) {
        return [];
    }

    $domains = [];
    foreach (EDITOR_ALLOWED_CONTENT_DOMAINS as $domain) {
        if (is_string($domain)) {
            $normalized = editorNormalizeDomain($domain);
            if ($normalized !== '') {
                $domains[] = $normalized;
            }
        }
    }

    return array_values(array_unique($domains));
}

/**
 * Return all available content domains.
 */
function editorListContentDomains(): array
{
    $configured = editorConfiguredAllowedDomains();
    if (!empty($configured)) {
        return $configured;
    }

    editorEnsureContentBaseDir();
    $baseDir = editorContentBaseDir();
    $entries = @scandir($baseDir);
    if (!is_array($entries)) {
        return [];
    }

    $domains = [];
    foreach ($entries as $entry) {
        if ($entry === '.' || $entry === '..') {
            continue;
        }

        $candidate = $baseDir . DIRECTORY_SEPARATOR . $entry;
        if (!is_dir($candidate)) {
            continue;
        }

        $normalized = editorNormalizeDomain($entry);
        if ($normalized !== '' && is_file($candidate . DIRECTORY_SEPARATOR . 'topics.json')) {
            $domains[] = $normalized;
        }
    }

    sort($domains);
    return array_values(array_unique($domains));
}

/**
 * Normalize and validate domain name.
 */
function editorNormalizeDomain(string $domain): string
{
    $normalized = strtolower(trim($domain));
    if ($normalized === '') {
        return '';
    }

    return preg_match('/^[a-z0-9_-]+$/', $normalized) ? $normalized : '';
}

/**
 * Verify if a domain is allowed.
 */
function editorIsAllowedDomain(string $domain): bool
{
    $normalized = editorNormalizeDomain($domain);
    if ($normalized === '') {
        return false;
    }

    $configured = editorConfiguredAllowedDomains();
    if (empty($configured)) {
        // No explicit allowlist configured: accept any valid normalized domain name.
        return true;
    }

    $allowedDomains = $configured;
    if (empty($allowedDomains)) {
        return false;
    }

    return in_array($normalized, $allowedDomains, true);
}

/**
 * Ensure domain directory exists.
 */
function editorEnsureDomainDirectory(string $domain): string
{
    $normalized = editorNormalizeDomain($domain);
    if ($normalized === '') {
        editorJsonResponse(400, ['error' => 'Invalid domain']);
    }

    if (!editorIsAllowedDomain($normalized)) {
        editorJsonResponse(400, ['error' => 'Domain is not allowed']);
    }

    $path = editorContentBaseDir() . DIRECTORY_SEPARATOR . $normalized;
    if (!is_dir($path)) {
        @mkdir($path, 0750, true);
    }

    return $path;
}

/**
 * Read JSON file and decode to array.
 */
function editorReadJsonFile(string $filePath): array
{
    if (!is_file($filePath)) {
        return [];
    }

    $raw = file_get_contents($filePath);
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        editorJsonResponse(500, ['error' => 'Stored JSON is invalid']);
    }

    return $decoded;
}

/**
 * Write JSON payload atomically with lock.
 */
function editorWriteJsonAtomic(string $filePath, array $payload): void
{
    $directory = dirname($filePath);
    if (!is_dir($directory)) {
        @mkdir($directory, 0750, true);
    }

    $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        editorJsonResponse(500, ['error' => 'Failed to encode JSON']);
    }

    $tmpFile = $filePath . '.tmp';
    $fp = @fopen($tmpFile, 'wb');
    if ($fp === false) {
        editorJsonResponse(500, ['error' => 'Failed to write content file']);
    }

    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        editorJsonResponse(500, ['error' => 'Failed to lock content file']);
    }

    fwrite($fp, $json . PHP_EOL);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if (!@rename($tmpFile, $filePath)) {
        @unlink($tmpFile);
        editorJsonResponse(500, ['error' => 'Failed to finalize content file']);
    }
}

/**
 * Lightweight schema validation.
 */
function editorValidateContentPayload(string $type, array $data): void
{
    if (!in_array($type, ['topics', 'filters'], true)) {
        editorJsonResponse(400, ['error' => 'Invalid content type']);
    }

    $maxItems = 20000;
    if (count($data) > $maxItems) {
        editorJsonResponse(413, ['error' => 'Payload too large']);
    }

    if ($type === 'topics') {
        if (!isset($data['topics']) || !is_array($data['topics'])) {
            editorJsonResponse(400, ['error' => 'topics payload must include topics array']);
        }
        return;
    }

    // filters must be an array/object-like structure with at least one top-level item when provided.
    if (isset($data['filters']) && !is_array($data['filters'])) {
        editorJsonResponse(400, ['error' => 'filters must be an array']);
    }
}

/**
 * Build storage path by type/domain.
 */
function editorResolveContentFilePath(string $type, ?string $domain = null): string
{
    editorEnsureContentBaseDir();

    if ($type === 'filters') {
        return editorContentBaseDir() . DIRECTORY_SEPARATOR . 'filters.json';
    }

    $normalized = editorNormalizeDomain((string) $domain);
    if ($normalized === '') {
        editorJsonResponse(400, ['error' => 'Domain is required for topics']);
    }

    $domainDir = editorEnsureDomainDirectory($normalized);
    return $domainDir . DIRECTORY_SEPARATOR . 'topics.json';
}
