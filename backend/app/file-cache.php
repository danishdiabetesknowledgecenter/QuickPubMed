<?php
/**
 * Shared filesystem cache housekeeping (no cron).
 * - Callers should unlink expired entries on read (lazy-delete).
 * - Writes may trigger a probabilistic directory sweep.
 */

if (!function_exists('muginGetDataDir')) {
    /**
     * Repo-root data/ directory (sibling of backend/), independent of caller depth.
     * Defined here in backend/app/ so dirname(__DIR__, 2) always resolves correctly.
     */
    function muginGetDataDir(): string
    {
        return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'data';
    }
}

if (!function_exists('muginEnsureDataSubdir')) {
    /**
     * @param string ...$parts Path segments under data/, e.g. ('cache', 'openalex-work')
     */
    function muginEnsureDataSubdir(string ...$parts): string
    {
        $dir = muginGetDataDir();
        foreach ($parts as $part) {
            $normalized = str_replace(['\\', '/'], '', $part);
            if ($normalized === '' || $normalized === '.' || $normalized === '..') {
                continue;
            }
            $dir .= DIRECTORY_SEPARATOR . $normalized;
        }
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        return $dir;
    }
}

if (!function_exists('muginFileCacheMaxFiles')) {
    function muginFileCacheMaxFiles(): int
    {
        if (defined('MUGIN_FILE_CACHE_MAX_FILES')) {
            return max(50, (int) MUGIN_FILE_CACHE_MAX_FILES);
        }
        return 2000;
    }
}

if (!function_exists('muginFileCacheMaxAgeSeconds')) {
    function muginFileCacheMaxAgeSeconds(): int
    {
        if (defined('MUGIN_FILE_CACHE_MAX_AGE_SECONDS')) {
            return max(300, (int) MUGIN_FILE_CACHE_MAX_AGE_SECONDS);
        }
        // Default 2 days — covers longest OpenAlex positive TTL with headroom.
        return 172800;
    }
}

if (!function_exists('muginIpRateLimitFileMaxAgeSeconds')) {
    function muginIpRateLimitFileMaxAgeSeconds(): int
    {
        if (defined('MUGIN_IP_RATE_LIMIT_FILE_MAX_AGE_SECONDS')) {
            return max(300, (int) MUGIN_IP_RATE_LIMIT_FILE_MAX_AGE_SECONDS);
        }
        return 604800; // 7 days
    }
}

if (!function_exists('muginFileCacheMaybeSweepDirectory')) {
    /**
     * Probabilistic cleanup (~1/200): drop files older than maxAge, then trim to maxFiles.
     */
    function muginFileCacheMaybeSweepDirectory(
        string $dir,
        ?int $maxFiles = null,
        ?int $maxAgeSeconds = null,
        string $globPattern = '*.json'
    ): void {
        if ($dir === '' || !is_dir($dir)) {
            return;
        }
        if (mt_rand(1, 200) !== 1) {
            return;
        }
        $maxFiles = $maxFiles !== null ? max(50, $maxFiles) : muginFileCacheMaxFiles();
        $maxAgeSeconds = $maxAgeSeconds !== null ? max(60, $maxAgeSeconds) : muginFileCacheMaxAgeSeconds();
        $pattern = rtrim($dir, "\\/") . DIRECTORY_SEPARATOR . $globPattern;
        $now = time();
        $survivors = [];
        foreach (glob($pattern) ?: [] as $path) {
            if (!is_file($path)) {
                continue;
            }
            $mtime = @filemtime($path);
            $mtime = $mtime === false ? 0 : (int) $mtime;
            if ($mtime > 0 && ($now - $mtime) > $maxAgeSeconds) {
                @unlink($path);
                continue;
            }
            $survivors[] = ['path' => $path, 'mtime' => $mtime];
        }
        $survivorCount = count($survivors);
        if ($survivorCount <= $maxFiles) {
            return;
        }
        usort($survivors, static function (array $a, array $b): int {
            return $a['mtime'] <=> $b['mtime'];
        });
        $toRemove = $survivorCount - $maxFiles;
        foreach ($survivors as $entry) {
            if ($toRemove <= 0) {
                break;
            }
            @unlink((string) $entry['path']);
            $toRemove--;
        }
    }
}

if (!function_exists('muginMaybeSweepIpRateLimitFiles')) {
    /**
     * Probabilistic cleanup of stale per-IP rate-limit JSON files under data/runtime.
     */
    function muginMaybeSweepIpRateLimitFiles(string $runtimeDir): void
    {
        if ($runtimeDir === '' || !is_dir($runtimeDir)) {
            return;
        }
        muginFileCacheMaybeSweepDirectory(
            $runtimeDir,
            5000,
            muginIpRateLimitFileMaxAgeSeconds(),
            'mugin-ip-rate-limit-*.json'
        );
    }
}
