<?php

/**
 * Shared cache helpers for extracted full-text fetched from remote sources.
 * The cache is keyed by source type (pdf/html) + URL and stored as JSON files.
 */

require_once dirname(__DIR__) . '/app/file-cache.php';

if (!defined('MUGIN_TEXT_FETCH_CACHE_TTL_SECONDS')) {
    define('MUGIN_TEXT_FETCH_CACHE_TTL_SECONDS', 900); // 15 minutes
}

/**
 * Returns the absolute cache directory path and creates it if needed.
 *
 * @return string
 */
function muginGetTextFetchCacheDir()
{
    return muginEnsureDataSubdir('cache', 'text-fetch');
}

/**
 * Builds cache file path for a given URL/type pair.
 *
 * @param string $sourceType
 * @param string $sourceUrl
 * @return string
 */
function muginGetTextFetchCachePath($sourceType, $sourceUrl)
{
    $cacheKey = hash('sha256', $sourceType . '|' . $sourceUrl);
    return muginGetTextFetchCacheDir() . '/' . $cacheKey . '.json';
}

/**
 * Reads cached extracted text if available and still fresh.
 *
 * @param string $sourceType
 * @param string $sourceUrl
 * @param int $ttlSeconds
 * @return string|null
 */
function muginReadTextFetchCache($sourceType, $sourceUrl, $ttlSeconds = MUGIN_TEXT_FETCH_CACHE_TTL_SECONDS)
{
    $cachePath = muginGetTextFetchCachePath($sourceType, $sourceUrl);
    if (!is_file($cachePath)) {
        return null;
    }

    $raw = @file_get_contents($cachePath);
    if ($raw === false || $raw === '') {
        @unlink($cachePath);
        return null;
    }

    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        @unlink($cachePath);
        return null;
    }

    $storedAt = isset($payload['storedAt']) ? (int) $payload['storedAt'] : 0;
    $text = isset($payload['text']) ? (string) $payload['text'] : '';
    if ($storedAt <= 0 || $text === '') {
        @unlink($cachePath);
        return null;
    }

    if ((time() - $storedAt) > $ttlSeconds) {
        @unlink($cachePath);
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
function muginWriteTextFetchCache($sourceType, $sourceUrl, $text)
{
    if (!is_string($text) || $text === '') {
        return;
    }

    $cachePath = muginGetTextFetchCachePath($sourceType, $sourceUrl);
    $payload = json_encode([
        'storedAt' => time(),
        'text' => $text,
    ]);

    if ($payload === false) {
        return;
    }

    @file_put_contents($cachePath, $payload, LOCK_EX);
    muginFileCacheMaybeSweepDirectory(muginGetTextFetchCacheDir());
}
