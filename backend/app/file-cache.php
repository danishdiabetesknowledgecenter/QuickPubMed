<?php
/**
 * Shared filesystem cache housekeeping (no cron).
 * - Callers should unlink expired entries on read (lazy-delete).
 * - data/cache writes schedule a bounded sweep (TTL, file cap, optional byte cap).
 * - data/runtime is swept in bounded passes on search and rate-limit traffic.
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

if (!function_exists('muginFileCacheNameMatches')) {
    function muginFileCacheNameMatches(string $name, string $pattern): bool
    {
        if ($name === '' || $name === 'cache-sweep-state.json') {
            return false;
        }
        if ($pattern === '*.json') {
            return strlen($name) > 5 && substr($name, -5) === '.json';
        }
        $flags = defined('FNM_CASEFOLD') ? FNM_CASEFOLD : 0;
        return fnmatch($pattern, $name, $flags);
    }
}

if (!function_exists('muginSweepDataCacheDirectory')) {
    /**
     * Delete expired cache files, then trim the newest survivors to the file
     * and byte caps. A cursor continues a large directory on the next call.
     *
     * @param int|null $maxBytes Null skips the byte cap.
     */
    function muginSweepDataCacheDirectory(
        string $dir,
        int $maxFiles,
        int $maxAgeSeconds,
        string $globPattern = '*.json',
        ?int $maxBytes = null,
        float $maxSeconds = 1.5
    ): void {
        if ($dir === '' || !is_dir($dir)) {
            return;
        }
        $maxFiles = max(1, $maxFiles);
        $maxAgeSeconds = max(1, $maxAgeSeconds);
        if ($maxBytes !== null) {
            $maxBytes = max(1, $maxBytes);
        }
        $statePath = $dir . DIRECTORY_SEPARATOR . 'cache-sweep-state.json';
        $fp = @fopen($statePath, 'c+');
        if ($fp === false) {
            return;
        }
        try {
            if (!flock($fp, LOCK_EX | LOCK_NB)) {
                return;
            }
            $raw = stream_get_contents($fp);
            $state = is_string($raw) && trim($raw) !== '' ? json_decode($raw, true) : [];
            if (!is_array($state)) {
                $state = [];
            }
            $cursor = (string) ($state['cursor'] ?? '');
            $startedAtBeginning = ($cursor === '');
            $now = time();
            $deadline = microtime(true) + max(0.05, $maxSeconds);
            clearstatcache();
            $dh = @opendir($dir);
            if ($dh === false) {
                return;
            }

            $armed = $startedAtBeginning;
            $paused = false;
            $survivors = [];
            while (($name = readdir($dh)) !== false) {
                if ($name === '.' || $name === '..') {
                    continue;
                }
                if (!$armed) {
                    if ($name === $cursor) {
                        $armed = true;
                    } elseif (microtime(true) >= $deadline) {
                        $paused = true;
                        break;
                    }
                    continue;
                }
                if (!muginFileCacheNameMatches($name, $globPattern)) {
                    continue;
                }
                $path = $dir . DIRECTORY_SEPARATOR . $name;
                $mtime = @filemtime($path);
                if ($mtime === false || !is_file($path)) {
                    continue;
                }
                $mtime = (int) $mtime;
                if ($mtime > 0 && ($now - $mtime) > $maxAgeSeconds) {
                    @unlink($path);
                    continue;
                }
                if ($startedAtBeginning) {
                    $size = @filesize($path);
                    $survivors[] = [
                        'path' => $path,
                        'mtime' => $mtime,
                        'size' => $size === false ? 0 : (int) $size,
                    ];
                }
                if (microtime(true) >= $deadline) {
                    $state['cursor'] = $name;
                    $paused = true;
                    break;
                }
            }
            closedir($dh);

            if (!$paused && !$armed && $cursor !== '') {
                $state['cursor'] = '';
            } elseif (!$paused && $armed) {
                if ($startedAtBeginning) {
                    usort($survivors, static function (array $a, array $b): int {
                        return $a['mtime'] <=> $b['mtime'];
                    });
                    $totalBytes = 0;
                    foreach ($survivors as $entry) {
                        $totalBytes += (int) $entry['size'];
                    }
                    $remaining = count($survivors);
                    $index = 0;
                    while ($index < $remaining) {
                        $overFiles = ($remaining - $index) > $maxFiles;
                        $overBytes = $maxBytes !== null && $totalBytes > $maxBytes;
                        if (!$overFiles && !$overBytes) {
                            break;
                        }
                        $entry = $survivors[$index];
                        clearstatcache(true, (string) $entry['path']);
                        if (@unlink((string) $entry['path'])) {
                            $totalBytes -= (int) $entry['size'];
                            if ($totalBytes < 0) {
                                $totalBytes = 0;
                            }
                        }
                        $index++;
                    }
                }
                $state['cursor'] = '';
            }

            $encoded = json_encode($state);
            if (is_string($encoded)) {
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, $encoded);
                fflush($fp);
            }
        } finally {
            if (is_resource($fp)) {
                @flock($fp, LOCK_UN);
                @fclose($fp);
            }
        }
    }
}

if (!function_exists('muginDataCacheSweepPending')) {
    /**
     * @return array<string,array<string,mixed>>
     */
    function &muginDataCacheSweepPending(): array
    {
        static $pending = [];
        return $pending;
    }
}

if (!function_exists('muginScheduleDataCacheSweep')) {
    function muginScheduleDataCacheSweep(
        string $dir,
        int $maxFiles,
        int $maxAgeSeconds,
        string $globPattern,
        ?int $maxBytes
    ): void {
        $pending = &muginDataCacheSweepPending();
        $pending[$dir] = [
            'maxFiles' => $maxFiles,
            'maxAgeSeconds' => $maxAgeSeconds,
            'pattern' => $globPattern,
            'maxBytes' => $maxBytes,
        ];
        static $scheduled = false;
        if ($scheduled) {
            return;
        }
        $scheduled = true;
        register_shutdown_function(static function (): void {
            @ignore_user_abort(true);
            if (function_exists('fastcgi_finish_request')) {
                @fastcgi_finish_request();
            }
            $queue = &muginDataCacheSweepPending();
            foreach ($queue as $pendingDir => $options) {
                muginSweepDataCacheDirectory(
                    (string) $pendingDir,
                    (int) $options['maxFiles'],
                    (int) $options['maxAgeSeconds'],
                    (string) $options['pattern'],
                    isset($options['maxBytes']) && $options['maxBytes'] !== null ? (int) $options['maxBytes'] : null
                );
            }
            $queue = [];
        });
    }
}

if (!function_exists('muginFileCacheMaybeSweepDirectory')) {
    /**
     * Schedule a bounded sweep: drop files older than maxAge, then trim to maxFiles
     * and, when set, maxBytes. Runs once per request after the response is sent.
     *
     * @param int|null $maxBytes Null skips the byte cap.
     */
    function muginFileCacheMaybeSweepDirectory(
        string $dir,
        ?int $maxFiles = null,
        ?int $maxAgeSeconds = null,
        string $globPattern = '*.json',
        ?int $maxBytes = null
    ): void {
        if ($dir === '' || !is_dir($dir)) {
            return;
        }
        $maxFiles = $maxFiles !== null ? max(50, $maxFiles) : muginFileCacheMaxFiles();
        $maxAgeSeconds = $maxAgeSeconds !== null ? max(60, $maxAgeSeconds) : muginFileCacheMaxAgeSeconds();
        if ($maxBytes !== null) {
            $maxBytes = max(1048576, $maxBytes);
        }
        muginScheduleDataCacheSweep($dir, $maxFiles, $maxAgeSeconds, $globPattern, $maxBytes);
    }
}

if (!function_exists('muginMaybeSweepIpRateLimitFiles')) {
    /**
     * Schedule cleanup of stale per-IP rate-limit files and the rest of data/runtime.
     */
    function muginMaybeSweepIpRateLimitFiles(string $runtimeDir): void
    {
        if ($runtimeDir === '' || !is_dir($runtimeDir)) {
            return;
        }
        muginScheduleRuntimeSweep();
    }
}

if (!function_exists('muginRuntimeSweepLimits')) {
    /**
     * @return array<string,int>
     */
    function muginRuntimeSweepLimits(): array
    {
        $public = (defined('MUGIN_PUBLIC_API') && is_array(MUGIN_PUBLIC_API)) ? MUGIN_PUBLIC_API : [];
        $searchTtl = max(0, (int) ($public['searchResultCacheTtlSeconds'] ?? 60));
        $hydrationTtl = max(0, (int) ($public['hydrationCacheTtlSeconds'] ?? 1800));
        $pipelineTtl = $searchTtl > 0 ? max($searchTtl, 1800) : 1800;
        $rerankRaw = (defined('MUGIN_SEMANTIC_LLM_RERANK_CONFIG') && is_array(MUGIN_SEMANTIC_LLM_RERANK_CONFIG))
            ? MUGIN_SEMANTIC_LLM_RERANK_CONFIG
            : [];
        $rerankTtl = max(0, (int) ($rerankRaw['cacheTtlSeconds'] ?? 1800));
        $freetextTtl = max(1800, $searchTtl);
        $grace = 120;
        $auditDays = 30;
        if (defined('MUGIN_AUDIT') && is_array(MUGIN_AUDIT)) {
            $auditDays = max(1, (int) (MUGIN_AUDIT['retentionDays'] ?? 30));
        }
        $editorDays = defined('EDITOR_AUDIT_RETENTION_DAYS')
            ? max(1, (int) EDITOR_AUDIT_RETENTION_DAYS)
            : $auditDays;
        $telemetryDays = 30;
        if (defined('MUGIN_TELEMETRY_CONFIG') && is_array(MUGIN_TELEMETRY_CONFIG)) {
            $telemetryDays = max(1, (int) (MUGIN_TELEMETRY_CONFIG['retentionDays'] ?? 30));
        }

        return [
            'searchMaxAge' => $searchTtl + $grace,
            'rerankMaxAge' => $rerankTtl + $grace,
            'cacheMaxAge' => max($searchTtl, $hydrationTtl, $pipelineTtl, $rerankTtl, $freetextTtl, 60) + $grace,
            'minAge' => max(10, (int) ($public['searchCacheMinAgeSecondsBeforeEvict'] ?? 60)),
            'maxFiles' => max(50, (int) ($public['searchCacheMaxFilesPerNamespace'] ?? 500)),
            'slotTtl' => max(60, (int) ($public['searchSlotTtlSeconds'] ?? 900)),
            'ipMaxAge' => muginIpRateLimitFileMaxAgeSeconds(),
            'auditMaxAge' => $auditDays * 86400,
            'editorAuditMaxAge' => $editorDays * 86400,
            'telemetryMaxAge' => $telemetryDays * 86400,
            'tmpMaxAge' => 900,
            'staleJsonMaxAge' => 604800,
        ];
    }
}

if (!function_exists('muginRuntimeCacheNamespace')) {
    function muginRuntimeCacheNamespace(string $name): string
    {
        if (preg_match('/^public-search-cache-(.+)-[a-f0-9]{40}\.bin$/i', $name, $matches) !== 1) {
            return '';
        }
        return strtolower((string) $matches[1]);
    }
}

if (!function_exists('muginRuntimeCacheFileMaxAge')) {
    /**
     * @param array<string,int> $limits
     */
    function muginRuntimeCacheFileMaxAge(string $namespace, array $limits): int
    {
        if ($namespace === 'openalex-work') {
            return 0;
        }
        if ($namespace === 'search-response') {
            return (int) $limits['searchMaxAge'];
        }
        if ($namespace === 'final-rerank') {
            return (int) $limits['rerankMaxAge'];
        }
        return (int) $limits['cacheMaxAge'];
    }
}

if (!function_exists('muginRuntimeSweepVisitFile')) {
    /**
     * @param array<string,int> $limits
     * @param array<string,mixed> $state
     */
    function muginRuntimeSweepVisitFile(string $dir, string $name, int $now, array $limits, array &$state): void
    {
        if ($name === 'runtime-sweep-state.json') {
            return;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $name;
        $mtime = @filemtime($path);
        if ($mtime === false || !is_file($path)) {
            return;
        }
        $mtime = (int) $mtime;
        $age = $now - $mtime;
        $namespace = muginRuntimeCacheNamespace($name);
        if ($namespace !== '') {
            $maxAge = muginRuntimeCacheFileMaxAge($namespace, $limits);
            if ($age > $maxAge) {
                @unlink($path);
                return;
            }
            $phase = (string) ($state['phase'] ?? 'scan');
            if (
                $phase === 'evict'
                && (int) ($state['evict'][$namespace] ?? 0) > 0
                && $age >= (int) $limits['minAge']
            ) {
                if (@unlink($path)) {
                    $state['evict'][$namespace] = (int) $state['evict'][$namespace] - 1;
                }
                return;
            }
            if ($phase === 'scan') {
                if (!isset($state['counts']) || !is_array($state['counts'])) {
                    $state['counts'] = [];
                }
                $state['counts'][$namespace] = (int) ($state['counts'][$namespace] ?? 0) + 1;
            }
            return;
        }

        $delete = false;
        if (strlen($name) >= 4 && substr($name, -4) === '.tmp') {
            $delete = $age > (int) $limits['tmpMaxAge'];
        } elseif (
            $name !== 'public-search-active-search.lock'
            && preg_match('/^public-search-active-search-.+\.lock$/', $name) === 1
        ) {
            $delete = $age > (int) $limits['slotTtl'];
        } elseif (strpos($name, 'mugin-ip-rate-limit-') === 0 && substr($name, -5) === '.json') {
            $delete = $age > (int) $limits['ipMaxAge'];
        } elseif (preg_match('/^public-search-api-\d{4}-\d{2}-\d{2}\.log$/', $name) === 1) {
            $delete = $age > (int) $limits['auditMaxAge'];
        } elseif (preg_match('/^editor-audit-\d{4}-\d{2}-\d{2}\.log$/', $name) === 1) {
            $delete = $age > (int) $limits['editorAuditMaxAge'];
        } elseif (preg_match('/^mugin-telemetry-\d{4}-\d{2}-\d{2}\.jsonl$/', $name) === 1) {
            $delete = $age > (int) $limits['telemetryMaxAge'];
        } elseif (
            (
                strpos($name, 'public-search-rate-limit-') === 0
                || strpos($name, 'source-rate-limit-') === 0
                || $name === 'editor-login-rate-limit.json'
            )
            && substr($name, -5) === '.json'
        ) {
            $delete = $age > (int) $limits['staleJsonMaxAge'];
        }
        if ($delete) {
            @unlink($path);
        }
    }
}

if (!function_exists('muginRuntimeSweepWriteState')) {
    /**
     * @param resource $fp
     * @param array<string,mixed> $state
     */
    function muginRuntimeSweepWriteState($fp, array $state): void
    {
        $encoded = json_encode($state);
        if (!is_string($encoded)) {
            return;
        }
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, $encoded);
        fflush($fp);
    }
}

if (!function_exists('muginSweepRuntimeDirectory')) {
    /**
     * Delete stale runtime files in one bounded pass.
     * A cursor continues the walk on later requests, so a large directory is
     * drained without reading cache contents or holding a request for long.
     *
     * @param string|null $directory Override for tests. Production uses data/runtime.
     */
    function muginSweepRuntimeDirectory(?string $directory = null, int $maxInspect = 2000, float $maxSeconds = 1.5): void
    {
        $dir = ($directory !== null && $directory !== '') ? $directory : muginEnsureDataSubdir('runtime');
        if (!is_dir($dir)) {
            return;
        }
        $statePath = $dir . DIRECTORY_SEPARATOR . 'runtime-sweep-state.json';
        $fp = @fopen($statePath, 'c+');
        if ($fp === false) {
            return;
        }
        try {
            if (!flock($fp, LOCK_EX | LOCK_NB)) {
                return;
            }
            $raw = stream_get_contents($fp);
            $state = is_string($raw) && trim($raw) !== '' ? json_decode($raw, true) : [];
            if (!is_array($state)) {
                $state = [];
            }
            $cursor = (string) ($state['cursor'] ?? '');
            $phase = (string) ($state['phase'] ?? 'scan');
            if ($phase !== 'evict') {
                $phase = 'scan';
                $state['phase'] = 'scan';
            }
            $inProgress = $cursor !== '' || $phase === 'evict';
            $completedAt = (int) ($state['completedAt'] ?? 0);
            if (!$inProgress && $completedAt > 0 && (time() - $completedAt) < 30) {
                return;
            }

            $limits = muginRuntimeSweepLimits();
            $now = time();
            $deadline = microtime(true) + max(0.05, $maxSeconds);
            $maxInspect = max(1, $maxInspect);
            clearstatcache();
            $seekTimedOut = false;
            $loops = 0;
            do {
                $loops++;
                if ($loops > 100000) {
                    break;
                }
                $cursor = (string) ($state['cursor'] ?? '');
                $phase = (string) ($state['phase'] ?? 'scan');
                if ($phase !== 'evict') {
                    $phase = 'scan';
                    $state['phase'] = 'scan';
                }
                $dh = @opendir($dir);
                if ($dh === false) {
                    break;
                }

                $armed = ($cursor === '');
                $processed = 0;
                $paused = false;
                $resumeName = $cursor;
                while (($name = readdir($dh)) !== false) {
                    if ($name === '.' || $name === '..') {
                        continue;
                    }
                    if (!$armed) {
                        if ($name === $cursor) {
                            $armed = true;
                        } elseif (microtime(true) >= $deadline) {
                            $paused = true;
                            $seekTimedOut = true;
                            break;
                        }
                        continue;
                    }
                    if ($name !== 'runtime-sweep-state.json') {
                        muginRuntimeSweepVisitFile($dir, $name, $now, $limits, $state);
                        $processed++;
                        $visitedPath = $dir . DIRECTORY_SEPARATOR . $name;
                        clearstatcache(true, $visitedPath);
                        if (is_file($visitedPath)) {
                            $resumeName = $name;
                        }
                    }
                    if ($processed >= $maxInspect || microtime(true) >= $deadline) {
                        if ($resumeName !== '') {
                            $state['cursor'] = $resumeName;
                        } else {
                            $state['cursor'] = '';
                            $state['counts'] = [];
                        }
                        $paused = true;
                        break;
                    }
                }
                closedir($dh);

                if ($seekTimedOut) {
                    $state['seekMisses'] = (int) ($state['seekMisses'] ?? 0) + 1;
                    if ((int) $state['seekMisses'] >= 2) {
                        $state['cursor'] = '';
                        $state['seekMisses'] = 0;
                        $state['counts'] = [];
                        $state['phase'] = 'scan';
                        $state['evict'] = [];
                    }
                    break;
                }
                if (!$paused && !$armed && $cursor !== '') {
                    // Cursor file is gone. Start over so nothing is left unvisited.
                    $state['cursor'] = '';
                    $state['seekMisses'] = 0;
                    $state['counts'] = [];
                    $state['phase'] = 'scan';
                    $state['evict'] = [];
                    continue;
                }
                if ($paused) {
                    continue;
                }

                $state['cursor'] = '';
                $state['seekMisses'] = 0;
                if ($phase === 'scan') {
                    $evict = [];
                    $maxFiles = (int) $limits['maxFiles'];
                    $counts = (isset($state['counts']) && is_array($state['counts'])) ? $state['counts'] : [];
                    foreach ($counts as $namespace => $count) {
                        $count = (int) $count;
                        if ($count > $maxFiles) {
                            $evict[(string) $namespace] = $count - $maxFiles;
                        }
                    }
                    $state['counts'] = [];
                    if ($evict !== []) {
                        $state['phase'] = 'evict';
                        $state['evict'] = $evict;
                    } else {
                        $state['phase'] = 'scan';
                        $state['evict'] = [];
                        $state['completedAt'] = $now;
                    }
                } else {
                    $state['phase'] = 'scan';
                    $state['evict'] = [];
                    $state['counts'] = [];
                    $state['completedAt'] = $now;
                }
            } while (
                !$seekTimedOut
                && microtime(true) < $deadline
                && (
                    (string) ($state['cursor'] ?? '') !== ''
                    || (string) ($state['phase'] ?? 'scan') === 'evict'
                    || (int) ($state['completedAt'] ?? 0) !== $now
                )
            );

            muginRuntimeSweepWriteState($fp, $state);
        } finally {
            if (is_resource($fp)) {
                @flock($fp, LOCK_UN);
                @fclose($fp);
            }
        }
    }
}

if (!function_exists('muginScheduleRuntimeSweep')) {
    /**
     * Run one runtime sweep after the response is finished. Once per request.
     */
    function muginScheduleRuntimeSweep(): void
    {
        static $scheduled = false;
        if ($scheduled) {
            return;
        }
        $scheduled = true;
        register_shutdown_function(static function (): void {
            @ignore_user_abort(true);
            if (function_exists('fastcgi_finish_request')) {
                @fastcgi_finish_request();
            }
            muginSweepRuntimeDirectory();
        });
    }
}
