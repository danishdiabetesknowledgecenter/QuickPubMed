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
 * Ensure value is recursively JSON-safe and enforce max text length.
 */
function editorSanitizePayloadValue($value, int $maxTextLength)
{
    if (is_array($value)) {
        $out = [];
        foreach ($value as $k => $v) {
            $out[$k] = editorSanitizePayloadValue($v, $maxTextLength);
        }
        return $out;
    }
    if (is_string($value)) {
        if (strlen($value) > $maxTextLength) {
            editorJsonResponse(413, ['error' => 'Text field exceeds allowed length']);
        }
        return $value;
    }
    if (is_bool($value) || is_int($value) || is_float($value) || $value === null) {
        return $value;
    }
    editorJsonResponse(400, ['error' => 'Payload contains unsupported value type']);
}

/**
 * Ensure tree depth and node count are within configured limits.
 *
 * @param array<int, mixed> $nodes
 */
function editorValidateTreeLimits(array $nodes, int $depth, int $maxDepth, int $maxNodes, int &$count): void
{
    if ($depth > $maxDepth) {
        editorJsonResponse(413, ['error' => 'Payload tree depth exceeded']);
    }
    foreach ($nodes as $node) {
        $count += 1;
        if ($count > $maxNodes) {
            editorJsonResponse(413, ['error' => 'Payload node count exceeded']);
        }
        if (!is_array($node)) {
            continue;
        }
        $children = $node['children'] ?? ($node['choices'] ?? []);
        if (is_array($children) && !empty($children)) {
            editorValidateTreeLimits($children, $depth + 1, $maxDepth, $maxNodes, $count);
        }
    }
}

/**
 * Validate lightweight topic node schema.
 */
function editorValidateTopicNodeShape(array $node): void
{
    if (isset($node['id']) && !is_string($node['id'])) {
        editorJsonResponse(400, ['error' => 'Node id must be string']);
    }
    if (isset($node['translations']) && !is_array($node['translations'])) {
        editorJsonResponse(400, ['error' => 'translations must be object']);
    }
    if (isset($node['tooltip']) && !is_array($node['tooltip'])) {
        editorJsonResponse(400, ['error' => 'tooltip must be object']);
    }
    if (isset($node['buttons']) && !is_bool($node['buttons'])) {
        editorJsonResponse(400, ['error' => 'buttons must be boolean']);
    }
    if (isset($node['ordering']) && !is_array($node['ordering'])) {
        editorJsonResponse(400, ['error' => 'ordering must be object']);
    }
    if (isset($node['groups']) && !is_array($node['groups'])) {
        editorJsonResponse(400, ['error' => 'groups must be array']);
    }
    if (isset($node['children']) && !is_array($node['children'])) {
        editorJsonResponse(400, ['error' => 'children must be array']);
    }
    if (isset($node['choices']) && !is_array($node['choices'])) {
        editorJsonResponse(400, ['error' => 'choices must be array']);
    }
}

/**
 * Build preferred revision storage directory for a content file.
 */
function editorRevisionDirForFile(string $filePath): string
{
    $baseName = pathinfo($filePath, PATHINFO_FILENAME);
    return dirname($filePath) . DIRECTORY_SEPARATOR . 'history' . DIRECTORY_SEPARATOR . $baseName;
}

/**
 * Build legacy revision storage directory (backward compatibility - _history).
 */
function editorLegacyRevisionDirForFile(string $filePath): string
{
    $baseName = pathinfo($filePath, PATHINFO_FILENAME);
    return dirname($filePath) . DIRECTORY_SEPARATOR . '.history' . DIRECTORY_SEPARATOR . $baseName;
}

/**
 * Build additional legacy revision storage directory (_history).
 */
function editorLegacyUnderscoreRevisionDirForFile(string $filePath): string
{
    $baseName = pathinfo($filePath, PATHINFO_FILENAME);
    return dirname($filePath) . DIRECTORY_SEPARATOR . '_history' . DIRECTORY_SEPARATOR . $baseName;
}

/**
 * Return all revision dirs to read from (preferred first, then legacy).
 *
 * @return array<int, string>
 */
function editorAllRevisionDirsForFile(string $filePath): array
{
    $dirs = [
        editorRevisionDirForFile($filePath),
        editorLegacyUnderscoreRevisionDirForFile($filePath),
        editorLegacyRevisionDirForFile($filePath),
    ];
    return array_values(array_unique($dirs));
}

/**
 * Ensure revision dir exists.
 */
function editorEnsureRevisionDir(string $filePath): string
{
    $dir = editorRevisionDirForFile($filePath);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    return $dir;
}

/**
 * Generate server-side revision id.
 */
function editorGenerateRevisionId(): string
{
    return gmdate('Ymd\THis\Z') . '-' . bin2hex(random_bytes(6));
}

/**
 * Prune old revisions and keep latest N.
 */
function editorPruneRevisions(string $filePath): void
{
    $maxRevisions = defined('EDITOR_MAX_REVISIONS') ? max(1, (int) EDITOR_MAX_REVISIONS) : 25;
    $files = [];
    foreach (editorAllRevisionDirsForFile($filePath) as $dir) {
        $dirFiles = glob($dir . DIRECTORY_SEPARATOR . '*.json');
        if (is_array($dirFiles)) {
            $files = array_merge($files, $dirFiles);
        }
    }
    if (!is_array($files) || count($files) <= $maxRevisions) {
        return;
    }
    usort($files, static function ($a, $b) {
        $aTime = @filemtime($a) ?: 0;
        $bTime = @filemtime($b) ?: 0;
        if ($aTime === $bTime) {
            return strcmp((string) $b, (string) $a);
        }
        return $bTime <=> $aTime;
    });
    $delete = array_slice($files, $maxRevisions);
    foreach ($delete as $path) {
        @unlink($path);
    }
}

/**
 * Store pre-save snapshot.
 */
function editorSnapshotCurrentFile(string $filePath, string $type, ?string $domain): ?string
{
    if (!is_file($filePath)) {
        return null;
    }
    $raw = file_get_contents($filePath);
    if ($raw === false || trim($raw) === '') {
        return null;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return null;
    }

    $user = editorGetAuthenticatedUser();
    $revisionId = editorGenerateRevisionId();
    $meta = [
        'revisionId' => $revisionId,
        'createdAt' => gmdate('c'),
        'type' => $type,
        'domain' => $domain,
        'user' => $user['username'] ?? '',
        'checksum' => hash('sha256', $raw),
        'bytes' => strlen($raw),
    ];
    $snapshot = ['meta' => $meta, 'data' => $decoded];
    $json = json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return null;
    }

    $dir = editorEnsureRevisionDir($filePath);
    $target = $dir . DIRECTORY_SEPARATOR . $revisionId . '.json';
    $written = @file_put_contents($target, $json . PHP_EOL, LOCK_EX);
    if ($written === false) {
        return null;
    }
    editorPruneRevisions($filePath);
    return $revisionId;
}

/**
 * List revisions for content file.
 *
 * @return array<int, array<string, mixed>>
 */
function editorListRevisions(string $filePath): array
{
    $files = [];
    foreach (editorAllRevisionDirsForFile($filePath) as $dir) {
        $dirFiles = glob($dir . DIRECTORY_SEPARATOR . '*.json');
        if (is_array($dirFiles)) {
            $files = array_merge($files, $dirFiles);
        }
    }
    if (!is_array($files) || empty($files)) {
        return [];
    }
    usort($files, static function ($a, $b) {
        $aTime = @filemtime($a) ?: 0;
        $bTime = @filemtime($b) ?: 0;
        if ($aTime === $bTime) {
            return strcmp((string) $b, (string) $a);
        }
        return $bTime <=> $aTime;
    });

    $out = [];
    foreach ($files as $path) {
        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            continue;
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded) || !isset($decoded['meta']) || !is_array($decoded['meta'])) {
            continue;
        }
        $meta = $decoded['meta'];
        $out[] = [
            'revisionId' => (string) ($meta['revisionId'] ?? ''),
            'createdAt' => (string) ($meta['createdAt'] ?? ''),
            'type' => (string) ($meta['type'] ?? ''),
            'domain' => $meta['domain'] ?? null,
            'user' => (string) ($meta['user'] ?? ''),
            'checksum' => (string) ($meta['checksum'] ?? ''),
            'bytes' => (int) ($meta['bytes'] ?? 0),
        ];
    }

    return $out;
}

/**
 * Load full revision record by id.
 *
 * @return array{meta: array<string, mixed>, data: array<string, mixed>}
 */
function editorLoadRevisionRecord(string $filePath, string $revisionId): array
{
    if (!preg_match('/^[0-9A-Za-z_-]+$/', $revisionId)) {
        editorJsonResponse(400, ['error' => 'Invalid revision id']);
    }
    $candidatePaths = [];
    foreach (editorAllRevisionDirsForFile($filePath) as $dir) {
        $candidatePaths[] = $dir . DIRECTORY_SEPARATOR . $revisionId . '.json';
    }
    $path = null;
    foreach ($candidatePaths as $candidate) {
        if (is_file($candidate)) {
            $path = $candidate;
            break;
        }
    }
    if ($path === null) {
        editorJsonResponse(404, ['error' => 'Revision not found']);
    }

    $raw = file_get_contents($path);
    $decoded = json_decode((string) $raw, true);
    if (
        !is_array($decoded) ||
        !isset($decoded['meta']) || !is_array($decoded['meta']) ||
        !isset($decoded['data']) || !is_array($decoded['data'])
    ) {
        editorJsonResponse(500, ['error' => 'Stored revision is invalid']);
    }
    return ['meta' => $decoded['meta'], 'data' => $decoded['data']];
}

/**
 * Restore payload from revision id.
 */
function editorLoadRevisionPayload(string $filePath, string $revisionId): array
{
    $record = editorLoadRevisionRecord($filePath, $revisionId);
    return $record['data'];
}

/**
 * Create deterministic payload hash for equality checks.
 */
function editorPayloadHash(array $payload): string
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        editorJsonResponse(500, ['error' => 'Failed to encode payload for comparison']);
    }
    return hash('sha256', (string) $json);
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

    $maxItems = defined('EDITOR_MAX_TOTAL_NODES') ? max(1000, (int) EDITOR_MAX_TOTAL_NODES) : 50000;
    $maxDepth = defined('EDITOR_MAX_TREE_DEPTH') ? max(3, (int) EDITOR_MAX_TREE_DEPTH) : 12;
    $maxTextLength = defined('EDITOR_MAX_TEXT_LENGTH') ? max(128, (int) EDITOR_MAX_TEXT_LENGTH) : 20000;

    if (count($data) > $maxItems) {
        editorJsonResponse(413, ['error' => 'Payload too large']);
    }

    if ($type === 'topics') {
        if (!isset($data['topics']) || !is_array($data['topics'])) {
            editorJsonResponse(400, ['error' => 'topics payload must include topics array']);
        }
        $nodeCount = 0;
        editorValidateTreeLimits($data['topics'], 1, $maxDepth, $maxItems, $nodeCount);
        foreach ($data['topics'] as $topic) {
            if (is_array($topic)) {
                editorValidateTopicNodeShape($topic);
            }
        }
        editorSanitizePayloadValue($data, $maxTextLength);
        return;
    }

    if (!isset($data['filters']) || !is_array($data['filters'])) {
        editorJsonResponse(400, ['error' => 'filters payload must include filters array']);
    }
    $nodeCount = 0;
    editorValidateTreeLimits($data['filters'], 1, $maxDepth, $maxItems, $nodeCount);
    foreach ($data['filters'] as $filter) {
        if (is_array($filter)) {
            editorValidateTopicNodeShape($filter);
        }
    }
    editorSanitizePayloadValue($data, $maxTextLength);
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
