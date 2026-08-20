<?php

/**
 * Small file cache for stable NLM proxy responses.
 * Keeps cache local to server-side proxy calls and never changes response shape.
 */

require_once dirname(__DIR__) . '/app/file-cache.php';

function muginGetNlmResponseCacheTtl(string $endpoint): int
{
    $fallback = 900;
    if (defined('MUGIN_NLM_RESPONSE_CACHE_TTL_SECONDS')) {
        $configured = MUGIN_NLM_RESPONSE_CACHE_TTL_SECONDS;
        if (is_array($configured)) {
            $value = $configured[$endpoint] ?? $configured['default'] ?? $fallback;
            return max(0, (int) $value);
        }
        return max(0, (int) $configured);
    }
    return $fallback;
}

function muginGetNlmResponseCacheDir(): string
{
    return muginEnsureDataSubdir('cache', 'nlm-response');
}

function muginNormalizeNlmResponseCacheParams(array $params): array
{
    $normalized = [];
    foreach ($params as $key => $value) {
        $normalizedKey = strtolower(trim((string) $key));
        if ($normalizedKey === '' || in_array($normalizedKey, ['api_key', 'email', 'tool'], true)) {
            continue;
        }
        if (is_array($value)) {
            $value = implode(',', array_map(static fn($entry) => trim((string) $entry), $value));
        }
        $normalized[$normalizedKey] = trim((string) $value);
    }
    ksort($normalized);
    return $normalized;
}

function muginIsNlmResponseCacheable(string $endpoint, array $params): bool
{
    if (muginGetNlmResponseCacheTtl($endpoint) <= 0) {
        return false;
    }
    $db = strtolower(trim((string) ($params['db'] ?? 'pubmed')));
    if ($db !== 'pubmed') {
        return false;
    }
    $id = trim((string) ($params['id'] ?? ''));
    if ($id === '') {
        return false;
    }
    return in_array($endpoint, ['esummary', 'efetch'], true);
}

function muginGetNlmResponseCachePath(string $endpoint, string $domain, array $params): string
{
    $payload = [
        'endpoint' => $endpoint,
        'domain' => strtolower(trim($domain)),
        'params' => muginNormalizeNlmResponseCacheParams($params),
    ];
    $cacheKey = hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES));
    return muginGetNlmResponseCacheDir() . '/' . $cacheKey . '.json';
}

function muginReadNlmResponseCache(string $endpoint, string $domain, array $params): ?array
{
    if (!muginIsNlmResponseCacheable($endpoint, $params)) {
        return null;
    }
    $cachePath = muginGetNlmResponseCachePath($endpoint, $domain, $params);
    if (!is_file($cachePath)) {
        return null;
    }
    $raw = @file_get_contents($cachePath);
    if (!is_string($raw) || $raw === '') {
        @unlink($cachePath);
        return null;
    }
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        @unlink($cachePath);
        return null;
    }
    $storedAt = (int) ($payload['storedAt'] ?? 0);
    if ($storedAt <= 0 || time() - $storedAt > muginGetNlmResponseCacheTtl($endpoint)) {
        @unlink($cachePath);
        return null;
    }
    $body = $payload['body'] ?? null;
    if (!is_string($body) || $body === '') {
        @unlink($cachePath);
        return null;
    }
    return [
        'ok' => true,
        'status' => (int) ($payload['status'] ?? 200),
        'body' => $body,
        'content_type' => (string) ($payload['content_type'] ?? ''),
        'error' => '',
    ];
}

function muginWriteNlmResponseCache(string $endpoint, string $domain, array $params, array $result): void
{
    if (!muginIsNlmResponseCacheable($endpoint, $params)) {
        return;
    }
    $status = (int) ($result['status'] ?? 0);
    $body = (string) ($result['body'] ?? '');
    if (empty($result['ok']) || $status < 200 || $status >= 300 || $body === '') {
        return;
    }
    $payload = json_encode([
        'storedAt' => time(),
        'status' => $status,
        'content_type' => (string) ($result['content_type'] ?? ''),
        'body' => $body,
    ]);
    if ($payload === false) {
        return;
    }
    @file_put_contents(muginGetNlmResponseCachePath($endpoint, $domain, $params), $payload, LOCK_EX);
    muginFileCacheMaybeSweepDirectory(muginGetNlmResponseCacheDir());
}
