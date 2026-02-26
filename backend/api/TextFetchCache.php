<?php

/**
 * Shared cache helpers for extracted full-text fetched from remote sources.
 * The cache is keyed by source type (pdf/html) + URL and stored as JSON files.
 */

define('QPM_TEXT_FETCH_CACHE_TTL_SECONDS', 900); // 15 minutes

/**
 * Returns the absolute cache directory path and creates it if needed.
 *
 * @return string
 */
function qpmGetTextFetchCacheDir()
{
    $cacheDir = dirname(__DIR__, 2) . '/data/cache/text-fetch';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0775, true);
    }
    return $cacheDir;
}

/**
 * Builds cache file path for a given URL/type pair.
 *
 * @param string $sourceType
 * @param string $sourceUrl
 * @return string
 */
function qpmGetTextFetchCachePath($sourceType, $sourceUrl)
{
    $cacheKey = hash('sha256', $sourceType . '|' . $sourceUrl);
    return qpmGetTextFetchCacheDir() . '/' . $cacheKey . '.json';
}

/**
 * Reads cached extracted text if available and still fresh.
 *
 * @param string $sourceType
 * @param string $sourceUrl
 * @param int $ttlSeconds
 * @return string|null
 */
function qpmReadTextFetchCache($sourceType, $sourceUrl, $ttlSeconds = QPM_TEXT_FETCH_CACHE_TTL_SECONDS)
{
    $cachePath = qpmGetTextFetchCachePath($sourceType, $sourceUrl);
    if (!is_file($cachePath)) {
        return null;
    }

    $raw = @file_get_contents($cachePath);
    if ($raw === false || $raw === '') {
        return null;
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        return null;
    }

    $storedAt = isset($payload['storedAt']) ? (int)$payload['storedAt'] : 0;
    $text = isset($payload['text']) ? (string)$payload['text'] : '';
    if ($storedAt <= 0 || $text === '') {
        return null;
    }

    if ((time() - $storedAt) > $ttlSeconds) {
        return null;
    }

    return $text;
}

/**
 * Writes extracted text to cache.
 *
 * @param string $sourceType
 * @param string $sourceUrl
 * @param string $text
 * @return void
 */
function qpmWriteTextFetchCache($sourceType, $sourceUrl, $text)
{
    if (!is_string($text) || $text === '') {
        return;
    }

    $cachePath = qpmGetTextFetchCachePath($sourceType, $sourceUrl);
    $payload = json_encode([
        'storedAt' => time(),
        'text' => $text,
    ]);

    if ($payload === false) {
        return;
    }

    @file_put_contents($cachePath, $payload, LOCK_EX);
}
