<?php
/**
 * Shared public search API helpers.
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/file-cache.php';
require_once __DIR__ . '/public-search-http.php';
require_once __DIR__ . '/semantic-quality-lib.php';
require_once __DIR__ . '/public-search-process-details.php';
require_once __DIR__ . '/identifiers.php';
require_once __DIR__ . '/source-clients/openalex-helpers.php';

if (!function_exists('muginPublicSearchBoolValue')) {
    /**
     * @param mixed $value
     * @param bool $default
     * @return bool
     */
    function muginPublicSearchBoolValue($value, bool $default = false): bool
    {
        if ($value === null) {
            return $default;
        }
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (int) $value !== 0;
        }
        $normalized = strtolower(trim((string) $value));
        if ($normalized === '') {
            return $default;
        }
        if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
            return false;
        }
        return $default;
    }
}

if (!function_exists('muginPublicSearchNormalizeResponseLanguage')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeResponseLanguage($value): string
    {
        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, ['en', 'english'], true)) {
            return 'en';
        }
        if (in_array($normalized, ['da', 'dk', 'danish', 'dansk'], true)) {
            return 'da';
        }
        return 'da';
    }
}

if (!function_exists('muginPublicSearchSafeJsonEncode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchSafeJsonEncode($value): string
    {
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return is_string($encoded) ? $encoded : '{}';
    }
}

if (!function_exists('muginPublicSearchSafePrettyJsonEncode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchSafePrettyJsonEncode($value): string
    {
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        return is_string($encoded) ? $encoded : '{}';
    }
}

if (!function_exists('muginPublicSearchNormalizePmid')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizePmid($value): string
    {
        return muginNormalizePmidValue($value);
    }
}

if (!function_exists('muginPublicSearchNormalizeDoi')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeDoi($value): string
    {
        return muginNormalizeDoiValue($value);
    }
}

if (!function_exists('muginPublicSearchDedupeStrings')) {
    /**
     * @param array<int,mixed> $values
     * @param callable|null $normalizer
     * @return array<int,string>
     */
    function muginPublicSearchDedupeStrings(array $values, ?callable $normalizer = null): array
    {
        $seen = [];
        $output = [];
        foreach ($values as $value) {
            $normalized = $normalizer ? (string) $normalizer($value) : trim((string) $value);
            if ($normalized === '') {
                continue;
            }
            $key = strtolower($normalized);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $output[] = $normalized;
        }
        return $output;
    }
}

if (!function_exists('muginPublicSearchGetConfig')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchGetConfig(): array
    {
        $config = defined('MUGIN_PUBLIC_API') && is_array(MUGIN_PUBLIC_API)
            ? MUGIN_PUBLIC_API
            : [];

        return [
            'basePath' => defined('MUGIN_PUBLIC_API_BASE_PATH')
                ? trim((string) MUGIN_PUBLIC_API_BASE_PATH)
                : trim((string) ($config['basePath'] ?? '/v1')),
            'docroot' => defined('MUGIN_PUBLIC_API_DOCROOT')
                ? trim((string) MUGIN_PUBLIC_API_DOCROOT)
                : trim((string) ($config['docroot'] ?? 'public-api')),
            'defaultPageSize' => max(1, (int) ($config['defaultPageSize'] ?? 25)),
            'maxPageSize' => max(1, (int) ($config['maxPageSize'] ?? 100)),
            'includeAbstractsByDefault' => muginPublicSearchBoolValue($config['includeAbstractsByDefault'] ?? true, true),
            'includeResolvedQueriesByDefault' => muginPublicSearchBoolValue(
                $config['includeResolvedQueriesByDefault'] ?? true,
                true
            ),
            'includeDiagnosticsByDefault' => muginPublicSearchBoolValue(
                $config['includeDiagnosticsByDefault'] ?? false,
                false
            ),
            'getSearchEnabled' => defined('MUGIN_PUBLIC_API_GET_SEARCH_ENABLED')
                ? muginPublicSearchBoolValue(MUGIN_PUBLIC_API_GET_SEARCH_ENABLED, false)
                : muginPublicSearchBoolValue($config['getSearchEnabled'] ?? false, false),
            'urlApiKeyEnabled' => defined('MUGIN_PUBLIC_API_URL_API_KEY_ENABLED')
                ? muginPublicSearchBoolValue(MUGIN_PUBLIC_API_URL_API_KEY_ENABLED, false)
                : muginPublicSearchBoolValue($config['urlApiKeyEnabled'] ?? false, false),
            'urlApiKeyMode' => defined('MUGIN_PUBLIC_API_URL_API_KEY_MODE')
                ? trim((string) MUGIN_PUBLIC_API_URL_API_KEY_MODE)
                : trim((string) ($config['urlApiKeyMode'] ?? 'configurable')),
            'urlApiKeyDefaultDisabled' => defined('MUGIN_PUBLIC_API_URL_API_KEY_DEFAULT_DISABLED')
                ? muginPublicSearchBoolValue(MUGIN_PUBLIC_API_URL_API_KEY_DEFAULT_DISABLED, true)
                : muginPublicSearchBoolValue($config['urlApiKeyDefaultDisabled'] ?? true, true),
            'responseCachePolicy' => defined('MUGIN_PUBLIC_API_RESPONSE_CACHE_POLICY')
                ? trim((string) MUGIN_PUBLIC_API_RESPONSE_CACHE_POLICY)
                : trim((string) ($config['responseCachePolicy'] ?? 'no-store')),
            'searchResultCacheTtlSeconds' => max(0, (int) ($config['searchResultCacheTtlSeconds'] ?? 60)),
            'hydrationCacheTtlSeconds' => max(0, (int) ($config['hydrationCacheTtlSeconds'] ?? 1800)),
            'searchCacheMaxFilesPerNamespace' => max(50, (int) ($config['searchCacheMaxFilesPerNamespace'] ?? 500)),
            'searchCacheMinAgeSecondsBeforeEvict' => max(10, (int) ($config['searchCacheMinAgeSecondsBeforeEvict'] ?? 60)),
            'concurrentSearchLimit' => max(1, (int) ($config['concurrentSearchLimit'] ?? 10)),
            'busyRetryAfterSeconds' => max(1, (int) ($config['busyRetryAfterSeconds'] ?? 120)),
            'searchSlotTtlSeconds' => max(60, (int) ($config['searchSlotTtlSeconds'] ?? 900)),
            'getRateLimit' => defined('MUGIN_PUBLIC_API_GET_RATE_LIMIT')
                ? max(1, (int) MUGIN_PUBLIC_API_GET_RATE_LIMIT)
                : max(1, (int) ($config['getRateLimit'] ?? 15)),
            'postRateLimit' => max(1, (int) ($config['postRateLimit'] ?? 60)),
            'auditEnabled' => defined('MUGIN_AUDIT') && is_array(MUGIN_AUDIT)
                ? muginPublicSearchBoolValue(MUGIN_AUDIT['enabled'] ?? true, true)
                : muginPublicSearchBoolValue($config['auditEnabled'] ?? true, true),
            'auditRetentionDays' => defined('MUGIN_AUDIT') && is_array(MUGIN_AUDIT)
                ? max(1, (int) (MUGIN_AUDIT['retentionDays'] ?? 30))
                : max(1, (int) ($config['auditRetentionDays'] ?? 30)),
            'matchesWebOrderingByDefault' => muginPublicSearchBoolValue(
                $config['matchesWebOrderingByDefault'] ?? false,
                false
            ),
        ];
    }
}

if (!function_exists('muginPublicSearchGetClients')) {
    /**
     * @return array<string,array<string,mixed>>
     */
    function muginPublicSearchGetClients(): array
    {
        return defined('MUGIN_API_CLIENTS') && is_array(MUGIN_API_CLIENTS)
            ? MUGIN_API_CLIENTS
            : [];
    }
}

if (!function_exists('muginPublicSearchApplyNoStoreHeaders')) {
    /**
     * @return void
     */
    function muginPublicSearchApplyNoStoreHeaders(): void
    {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
}

if (!function_exists('muginPublicSearchRespondJson')) {
    /**
     * @param int $status
     * @param array<string,mixed> $payload
     * @return never
     */
    function muginPublicSearchRespondJson(int $status, array $payload): void
    {
        muginPublicSearchApplyNoStoreHeaders();
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($status);
        echo muginPublicSearchSafeJsonEncode($payload);
        exit;
    }
}

if (!function_exists('muginPublicSearchMaskApiKey')) {
    /**
     * @param string $apiKey
     * @return string
     */
    function muginPublicSearchMaskApiKey(string $apiKey): string
    {
        $normalized = trim($apiKey);
        if ($normalized === '') {
            return '';
        }
        $length = strlen($normalized);
        if ($length <= 8) {
            return str_repeat('*', $length);
        }
        return substr($normalized, 0, 4) . str_repeat('*', max(4, $length - 8)) . substr($normalized, -4);
    }
}

if (!function_exists('muginPublicSearchGetRuntimeDir')) {
    /**
     * @return string
     */
    function muginPublicSearchGetRuntimeDir(): string
    {
        return muginGetDataDir() . DIRECTORY_SEPARATOR . 'runtime';
    }
}

if (!function_exists('muginPublicSearchEnsureRuntimeDir')) {
    /**
     * @return string
     */
    function muginPublicSearchEnsureRuntimeDir(): string
    {
        $dir = muginPublicSearchGetRuntimeDir();
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        return $dir;
    }
}

if (!function_exists('muginPublicSearchApplyRetryAfterHeader')) {
    /**
     * @param int $seconds
     * @return void
     */
    function muginPublicSearchApplyRetryAfterHeader(int $seconds): void
    {
        header('Retry-After: ' . (string) max(1, $seconds));
    }
}

if (!function_exists('muginPublicSearchBuildCacheFilePath')) {
    /**
     * @param string $namespace
     * @param string $cacheKey
     * @return string
     */
    function muginPublicSearchBuildCacheFilePath(string $namespace, string $cacheKey): string
    {
        $normalizedNamespace = preg_replace('/[^a-z0-9_-]+/i', '-', trim($namespace));
        $normalizedNamespace = is_string($normalizedNamespace) && $normalizedNamespace !== ''
            ? $normalizedNamespace
            : 'default';
        return muginPublicSearchEnsureRuntimeDir()
            . DIRECTORY_SEPARATOR
            . 'public-search-cache-'
            . $normalizedNamespace
            . '-'
            . sha1($cacheKey)
            . '.bin';
    }
}

if (!function_exists('muginPublicSearchMaybeCleanupCacheNamespace')) {
    /**
     * @param string $namespace
     * @return void
     */
    function muginPublicSearchMaybeCleanupCacheNamespace(string $namespace): void
    {
        if (mt_rand(1, 200) !== 1) {
            return;
        }
        $normalizedNamespace = preg_replace('/[^a-z0-9_-]+/i', '-', trim($namespace));
        $normalizedNamespace = is_string($normalizedNamespace) && $normalizedNamespace !== ''
            ? $normalizedNamespace
            : 'default';
        $pattern = muginPublicSearchEnsureRuntimeDir()
            . DIRECTORY_SEPARATOR
            . 'public-search-cache-'
            . $normalizedNamespace
            . '-*.bin';
        $now = time();
        $config = muginPublicSearchGetConfig();
        $maxFiles = max(50, (int) ($config['searchCacheMaxFilesPerNamespace'] ?? 500));
        $minAgeSeconds = max(10, (int) ($config['searchCacheMinAgeSecondsBeforeEvict'] ?? 60));
        $survivors = [];
        foreach (glob($pattern) ?: [] as $path) {
            if (!is_file($path)) {
                continue;
            }
            $raw = @file_get_contents($path);
            $payload = is_string($raw) && $raw !== ''
                ? @unserialize($raw, ['allowed_classes' => [stdClass::class]])
                : false;
            if (!is_array($payload) || (int) ($payload['expiresAt'] ?? 0) < $now) {
                @unlink($path);
                continue;
            }
            $mtime = @filemtime($path);
            $survivors[] = [
                'path' => $path,
                'mtime' => $mtime === false ? 0 : (int) $mtime,
            ];
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
            if (($now - (int) $entry['mtime']) < $minAgeSeconds) {
                continue;
            }
            @unlink((string) $entry['path']);
            $toRemove--;
        }
    }
}

if (!function_exists('muginPublicSearchReadCacheValue')) {
    /**
     * @param string $namespace
     * @param string $cacheKey
     * @return array{hit: bool, value: mixed}
     */
    function muginPublicSearchReadCacheValue(string $namespace, string $cacheKey): array
    {
        $path = muginPublicSearchBuildCacheFilePath($namespace, $cacheKey);
        if (!is_file($path)) {
            return ['hit' => false, 'value' => null];
        }
        $raw = @file_get_contents($path);
        $payload = is_string($raw) && $raw !== ''
            ? @unserialize($raw, ['allowed_classes' => [stdClass::class]])
            : false;
        if (!is_array($payload)) {
            @unlink($path);
            return ['hit' => false, 'value' => null];
        }
        if ((int) ($payload['expiresAt'] ?? 0) < time()) {
            @unlink($path);
            return ['hit' => false, 'value' => null];
        }
        return [
            'hit' => true,
            'value' => $payload['value'] ?? null,
        ];
    }
}

if (!function_exists('muginPublicSearchBuildPipelineCacheKey')) {
    /**
     * Cache key for the expensive pre-hydration pipeline (intent/sources/rerank/
     * validation). Page number/size are excluded so "load next page" and
     * changing results-per-page can reuse the same ordered candidate set.
     *
     * @param array<string,mixed> $request
     */
    function muginPublicSearchBuildPipelineCacheKey(array $request): string
    {
        $forKey = $request;
        unset($forKey['_processDetails'], $forKey['page']);
        if (isset($forKey['responseOptions']) && is_array($forKey['responseOptions'])) {
            unset(
                $forKey['responseOptions']['noCache'],
                $forKey['responseOptions']['includeProcessDetails'],
                $forKey['responseOptions']['includeDiagnostics'],
                $forKey['responseOptions']['includeResolvedQueries']
            );
        }
        // Salt by LLM provider so OpenAI-era translations/reranks are not reused under Requesty.
        $forKey['_llmProvider'] = function_exists('muginGetLlmProvider') ? muginGetLlmProvider() : 'openai';
        $forKey['_pubmedTranslationGuard'] = 1;
        $forKey['_semanticQueryGuard'] = 1;
        return 'pipeline:' . sha1(muginPublicSearchSafeJsonEncode($forKey));
    }
}

if (!function_exists('muginPublicSearchStripResolvedQueriesForPipelineCache')) {
    /**
     * @param array<string,mixed> $resolvedQueries
     * @return array<string,mixed>
     */
    function muginPublicSearchStripResolvedQueriesForPipelineCache(array $resolvedQueries): array
    {
        unset(
            $resolvedQueries['_earlyPrefetchedSources'],
            $resolvedQueries['_earlySourceStartedAt'],
            $resolvedQueries['processReports']
        );
        return $resolvedQueries;
    }
}

if (!function_exists('muginPublicSearchWriteCacheValue')) {
    /**
     * @param string $namespace
     * @param string $cacheKey
     * @param mixed $value
     * @param int $ttlSeconds
     * @return void
     */
    function muginPublicSearchWriteCacheValue(string $namespace, string $cacheKey, $value, int $ttlSeconds): void
    {
        if ($ttlSeconds <= 0) {
            return;
        }
        $path = muginPublicSearchBuildCacheFilePath($namespace, $cacheKey);
        $payload = serialize([
            'expiresAt' => time() + $ttlSeconds,
            'value' => $value,
        ]);
        $tmpPath = $path . '.' . uniqid('', true) . '.tmp';
        if (@file_put_contents($tmpPath, $payload, LOCK_EX) === false) {
            @unlink($tmpPath);
            return;
        }
        if (!@rename($tmpPath, $path)) {
            // Windows cannot rename over an existing destination; unlink then retry.
            @unlink($path);
            if (!@rename($tmpPath, $path)) {
                @unlink($tmpPath);
                return;
            }
        }
        muginPublicSearchMaybeCleanupCacheNamespace($namespace);
    }
}

if (!function_exists('muginPublicSearchBuildExecutionSlotPath')) {
    /**
     * @param string $token
     * @return string
     */
    function muginPublicSearchBuildExecutionSlotPath(string $token): string
    {
        return muginPublicSearchEnsureRuntimeDir()
            . DIRECTORY_SEPARATOR
            . 'public-search-active-search-'
            . preg_replace('/[^a-z0-9_-]+/i', '-', trim($token))
            . '.lock';
    }
}

if (!function_exists('muginPublicSearchAcquireExecutionSlot')) {
    /**
     * @param int $limit
     * @return array<string,mixed>
     */
    function muginPublicSearchAcquireExecutionSlot(int $limit): array
    {
        $config = muginPublicSearchGetConfig();
        $ttlSeconds = max(60, (int) ($config['searchSlotTtlSeconds'] ?? 900));
        $lockPath = muginPublicSearchEnsureRuntimeDir() . DIRECTORY_SEPARATOR . 'public-search-active-search.lock';
        $fp = @fopen($lockPath, 'c+');
        if ($fp === false) {
            throw new RuntimeException('Search capacity unavailable. Please try again shortly.', 503);
        }
        try {
            if (!flock($fp, LOCK_EX)) {
                throw new RuntimeException('Search capacity unavailable. Please try again shortly.', 503);
            }
            $now = time();
            $pattern = muginPublicSearchEnsureRuntimeDir() . DIRECTORY_SEPARATOR . 'public-search-active-search-*.lock';
            $activeCount = 0;
            foreach (glob($pattern) ?: [] as $path) {
                if (!is_file($path)) {
                    continue;
                }
                $mtime = @filemtime($path);
                if ($mtime === false || ($now - (int) $mtime) > $ttlSeconds) {
                    @unlink($path);
                    continue;
                }
                $activeCount++;
            }
            if ($activeCount >= max(1, $limit)) {
                throw new RuntimeException('Search capacity is temporarily full. Please wait a couple of minutes and try again.', 503);
            }
            $token = uniqid('search_', true);
            $path = muginPublicSearchBuildExecutionSlotPath($token);
            @file_put_contents($path, (string) $now, LOCK_EX);
            return [
                'token' => $token,
                'path' => $path,
            ];
        } finally {
            if (is_resource($fp)) {
                @flock($fp, LOCK_UN);
                @fclose($fp);
            }
        }
    }
}

if (!function_exists('muginPublicSearchRefreshExecutionSlot')) {
    /**
     * @param array<string,mixed>|null $slot
     * @return void
     */
    function muginPublicSearchRefreshExecutionSlot(?array $slot): void
    {
        $path = is_array($slot) ? trim((string) ($slot['path'] ?? '')) : '';
        if ($path !== '' && is_file($path)) {
            @touch($path);
        }
    }
}

if (!function_exists('muginPublicSearchReleaseExecutionSlot')) {
    /**
     * @param array<string,mixed>|null $slot
     * @return void
     */
    function muginPublicSearchReleaseExecutionSlot(?array $slot): void
    {
        $path = is_array($slot) ? trim((string) ($slot['path'] ?? '')) : '';
        if ($path !== '' && is_file($path)) {
            @unlink($path);
        }
    }
}

if (!function_exists('muginPublicSearchStartEventStream')) {
    /**
     * @return void
     */
    function muginPublicSearchStartEventStream(): void
    {
        muginPublicSearchApplyNoStoreHeaders();
        header('Content-Type: text/event-stream; charset=utf-8');
        header('X-Accel-Buffering: no');
        header('Connection: keep-alive');
        @ini_set('output_buffering', 'off');
        @ini_set('zlib.output_compression', '0');
        while (ob_get_level() > 0) {
            @ob_end_flush();
        }
        @ob_implicit_flush(true);
        ignore_user_abort(true);
    }
}

if (!function_exists('muginPublicSearchEmitSseEvent')) {
    /**
     * @param string $event
     * @param array<string,mixed> $payload
     * @return void
     */
    function muginPublicSearchEmitSseEvent(string $event, array $payload): void
    {
        echo 'event: ' . trim($event) . "\n";
        // Pretty-print so each JSON line is a separate `data:` line (readable in
        // the browser; frontend rejoins data lines before JSON.parse).
        $encoded = muginPublicSearchSafePrettyJsonEncode($payload);
        foreach (preg_split("/\r\n|\r|\n/", $encoded) ?: [] as $line) {
            echo 'data: ' . $line . "\n";
        }
        echo "\n";
        @ob_flush();
        flush();
    }
}

if (!function_exists('muginPublicSearchEmitProgress')) {
    /**
     * @param callable|null $progressCallback
     * @param string $stage
     * @param string $message
     * @param array<string,mixed> $context
     * @return void
     */
    function muginPublicSearchEmitProgress(?callable $progressCallback, string $stage, string $message, array $context = []): void
    {
        if ($progressCallback === null) {
            return;
        }
        $progressCallback($stage, $message, $context);
    }
}

if (!function_exists('muginPublicSearchDecodeJsQuotedString')) {
    /**
     * @param string $value
     * @return string
     */
    function muginPublicSearchDecodeJsQuotedString(string $value): string
    {
        $decoded = json_decode('"' . $value . '"', true);
        return is_string($decoded) ? $decoded : stripcslashes($value);
    }
}

if (!function_exists('muginPublicSearchGetFrontendTranslationMap')) {
    /**
     * @return array<string,array<string,string>>
     */
    function muginPublicSearchGetFrontendTranslationMap(): array
    {
        static $map = null;
        if (is_array($map)) {
            return $map;
        }

        $map = [];
        $path = dirname(__DIR__, 2)
            . DIRECTORY_SEPARATOR . 'src'
            . DIRECTORY_SEPARATOR . 'assets'
            . DIRECTORY_SEPARATOR . 'content'
            . DIRECTORY_SEPARATOR . 'translations.js';
        if (!is_file($path)) {
            return $map;
        }

        $content = @file_get_contents($path);
        if (!is_string($content) || $content === '') {
            return $map;
        }

        $pattern = '/^\s*([A-Za-z0-9_]+)\s*:\s*\{\s*\R\s*dk:\s*"((?:\\\\.|[^"\\\\])*)",\s*\R\s*en:\s*"((?:\\\\.|[^"\\\\])*)"/m';
        preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $key = trim((string) ($match[1] ?? ''));
            if ($key === '') {
                continue;
            }
            $map[$key] = [
                'dk' => muginPublicSearchDecodeJsQuotedString((string) ($match[2] ?? '')),
                'en' => muginPublicSearchDecodeJsQuotedString((string) ($match[3] ?? '')),
            ];
        }

        return $map;
    }
}

if (!function_exists('muginPublicSearchGetFrontendTranslation')) {
    /**
     * @param string $key
     * @param string $language
     * @param string $fallback
     * @return string
     */
    function muginPublicSearchGetFrontendTranslation(string $key, string $language, string $fallback = ''): string
    {
        $map = muginPublicSearchGetFrontendTranslationMap();
        $normalizedLanguage = $language === 'en' ? 'en' : 'dk';
        if (isset($map[$key][$normalizedLanguage]) && trim((string) $map[$key][$normalizedLanguage]) !== '') {
            return trim((string) $map[$key][$normalizedLanguage]);
        }
        if (isset($map[$key]['dk']) && trim((string) $map[$key]['dk']) !== '') {
            return trim((string) $map[$key]['dk']);
        }
        return trim($fallback);
    }
}

if (!function_exists('muginPublicSearchResolveProgressLanguage')) {
    /**
     * @param array<string,mixed> $request
     * @return string
     */
    function muginPublicSearchResolveProgressLanguage(array $request): string
    {
        $candidate = $request['responseOptions']['language'] ?? ($request['query']['language'] ?? 'da');
        return muginPublicSearchNormalizeResponseLanguage($candidate);
    }
}

require_once __DIR__ . '/public-search-progress-texts.php';

if (!function_exists('muginPublicSearchGetPublicProgressMessageCopy')) {
    /**
     * Slaar en messageKey/groupKey op i MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS
     * (backend/app/public-search-progress-texts.php), som er den samlede,
     * selvstaendige kilde til alle brugervenlige progress-tekster i det
     * offentlige API. Se den fil for selve teksterne.
     *
     * @param string $key
     * @return array{dk:string,en:string}|null
     */
    function muginPublicSearchGetPublicProgressMessageCopy(string $key): ?array
    {
        $texts = defined('MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS') ? MUGIN_PUBLIC_SEARCH_PROGRESS_TEXTS : [];
        return $texts[$key] ?? null;
    }
}

if (!function_exists('muginPublicSearchBuildStreamProgressPayload')) {
    /**
     * @param array<string,mixed> $request
     * @param string $stage
     * @param string $fallbackMessage
     * @param array<string,mixed> $context
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildStreamProgressPayload(
        array $request,
        string $stage,
        string $fallbackMessage = '',
        array $context = []
    ): array {
        $language = muginPublicSearchResolveProgressLanguage($request);
        $frontendLanguage = $language === 'en' ? 'en' : 'dk';
        $messageKey = trim((string) ($context['messageKey'] ?? ''));
        $groupKey = trim((string) ($context['groupKey'] ?? ''));
        $stepId = trim((string) ($context['stepId'] ?? $stage));
        $groupId = trim((string) ($context['groupId'] ?? ''));
        $source = trim((string) ($context['source'] ?? ''));
        $publicMessageCopy = $messageKey !== '' ? muginPublicSearchGetPublicProgressMessageCopy($messageKey) : null;
        if ($publicMessageCopy !== null) {
            $message = $publicMessageCopy[$frontendLanguage] ?? $publicMessageCopy['dk'];
        } elseif ($messageKey !== '') {
            $message = muginPublicSearchGetFrontendTranslation($messageKey, $frontendLanguage, $fallbackMessage);
        } else {
            $message = trim($fallbackMessage);
        }
        $publicGroupCopy = $groupKey !== '' ? muginPublicSearchGetPublicProgressMessageCopy($groupKey) : null;
        if ($publicGroupCopy !== null) {
            $groupLabel = $publicGroupCopy[$frontendLanguage] ?? $publicGroupCopy['dk'];
        } elseif ($groupKey !== '') {
            $groupLabel = muginPublicSearchGetFrontendTranslation($groupKey, $frontendLanguage, '');
        } else {
            $groupLabel = '';
        }

        $payload = [
            'stage' => $stepId !== '' ? $stepId : trim($stage),
            'language' => $language,
            'messageKey' => $messageKey,
            'message' => $message,
        ];
        if ($stepId !== '') {
            $payload['stepId'] = $stepId;
        }
        if ($groupId !== '') {
            $payload['groupId'] = $groupId;
        }
        if ($groupKey !== '') {
            $payload['groupKey'] = $groupKey;
        }
        if ($groupLabel !== '') {
            $payload['groupLabel'] = $groupLabel;
            $payload['label'] = $groupLabel;
        }
        if ($source !== '') {
            $payload['source'] = $source;
        }
        if (isset($context['current']) && is_numeric($context['current'])) {
            $payload['current'] = (int) $context['current'];
        }
        if (isset($context['total']) && is_numeric($context['total'])) {
            $payload['total'] = (int) $context['total'];
        }
        $status = trim((string) ($context['status'] ?? ''));
        if ($status !== '' && in_array($status, muginPublicSearchProcessDetailStatuses(), true)) {
            $payload['status'] = $status;
        }
        if (isset($context['elapsedMs']) && is_numeric($context['elapsedMs'])) {
            $payload['elapsedMs'] = max(0, (int) $context['elapsedMs']);
        }
        if (($context['detailOnly'] ?? false) === true) {
            $payload['detailOnly'] = true;
        }
        if (isset($context['processStepDetail']) && is_array($context['processStepDetail'])) {
            $payload['processStepDetail'] = muginPublicSearchProcessDetailsSanitize(
                $context['processStepDetail']
            );
        }
        if (isset($context['sourceQueryDetail']) && is_array($context['sourceQueryDetail'])) {
            $payload['sourceQueryDetail'] = muginPublicSearchProcessDetailsSanitize(
                $context['sourceQueryDetail']
            );
        }
        if (isset($context['resolvedQueries']) && is_array($context['resolvedQueries'])) {
            $sourceQueryPlan = $context['resolvedQueries']['sourceQueryPlan'] ?? new stdClass();
            $payload['resolvedQueries'] = muginPublicSearchProcessDetailsSanitize([
                'pubmedQuery' => (string) ($context['resolvedQueries']['pubmedQuery'] ?? ''),
                'hardFilterQuery' => (string) ($context['resolvedQueries']['hardFilterQuery'] ?? ''),
                'sourceQueryPlan' => $sourceQueryPlan,
            ]);
        }

        return $payload;
    }
}

if (!function_exists('muginPublicSearchAudit')) {
    /**
     * @param array<string,mixed> $entry
     * @return void
     */
    function muginPublicSearchAudit(array $entry): void
    {
        $config = muginPublicSearchGetConfig();
        if ($config['auditEnabled'] !== true) {
            return;
        }

        $dir = muginPublicSearchEnsureRuntimeDir();
        $path = $dir . DIRECTORY_SEPARATOR . 'public-search-api-' . gmdate('Y-m-d') . '.log';
        $payload = [
            'ts' => gmdate('c'),
            'clientId' => trim((string) ($entry['clientId'] ?? '')),
            'method' => trim((string) ($entry['method'] ?? '')),
            'route' => trim((string) ($entry['route'] ?? '')),
            'status' => (int) ($entry['status'] ?? 0),
            'origin' => trim((string) ($entry['origin'] ?? '')),
            'query' => trim((string) ($entry['query'] ?? '')),
            'sources' => array_values(array_map('strval', (array) ($entry['sources'] ?? []))),
            'page' => (int) ($entry['page'] ?? 0),
            'pageSize' => (int) ($entry['pageSize'] ?? 0),
            'partial' => $entry['partial'] === true,
            'warnings' => array_values(array_map('strval', (array) ($entry['warnings'] ?? []))),
            'latencyMs' => (int) ($entry['latencyMs'] ?? 0),
            'authSource' => trim((string) ($entry['authSource'] ?? '')),
            'maskedApiKey' => muginPublicSearchMaskApiKey(trim((string) ($entry['apiKey'] ?? ''))),
            'error' => trim((string) ($entry['error'] ?? '')),
        ];

        @file_put_contents($path, muginPublicSearchSafeJsonEncode($payload) . PHP_EOL, FILE_APPEND | LOCK_EX);

        $retentionDays = max(1, (int) $config['auditRetentionDays']);
        $cutoff = time() - ($retentionDays * 86400);
        foreach (glob($dir . DIRECTORY_SEPARATOR . 'public-search-api-*.log') ?: [] as $candidate) {
            if (!is_file($candidate)) {
                continue;
            }
            $mtime = @filemtime($candidate);
            if ($mtime !== false && (int) $mtime < $cutoff) {
                @unlink($candidate);
            }
        }
    }
}

if (!function_exists('muginPublicSearchResolveOrigin')) {
    /**
     * @return string
     */
    function muginPublicSearchResolveOrigin(): string
    {
        return trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    }
}

if (!function_exists('muginPublicSearchOriginMatchesPattern')) {
    /**
     * @param string $origin
     * @param string $pattern
     * @return bool
     */
    function muginPublicSearchOriginMatchesPattern(string $origin, string $pattern): bool
    {
        $normalizedOrigin = trim($origin);
        $normalizedPattern = trim($pattern);
        if ($normalizedOrigin === '' || $normalizedPattern === '') {
            return false;
        }
        $originParts = parse_url($normalizedOrigin);
        $patternParts = parse_url($normalizedPattern);
        if (!is_array($originParts) || !is_array($patternParts)) {
            return false;
        }
        $originScheme = strtolower((string) ($originParts['scheme'] ?? ''));
        $originHost = strtolower((string) ($originParts['host'] ?? ''));
        $originPort = (string) ($originParts['port'] ?? '');
        $patternScheme = strtolower((string) ($patternParts['scheme'] ?? ''));
        $patternHost = strtolower((string) ($patternParts['host'] ?? ''));
        $patternPort = (string) ($patternParts['port'] ?? '');
        if ($originScheme === '' || $originHost === '' || $patternScheme === '' || $patternHost === '') {
            return false;
        }
        if ($originScheme !== $patternScheme) {
            return false;
        }
        if ($patternPort !== '' && $originPort !== $patternPort) {
            return false;
        }
        if (strpos($patternHost, '*.') === 0) {
            $baseHost = substr($patternHost, 2);
            return $originHost === $baseHost || substr($originHost, -strlen('.' . $baseHost)) === '.' . $baseHost;
        }
        return $originHost === $patternHost;
    }
}

if (!function_exists('muginPublicSearchClientAllowsAllOrigins')) {
    /**
     * @param array<string,mixed> $client
     * @return bool
     */
    function muginPublicSearchClientAllowsAllOrigins(array $client): bool
    {
        return muginPublicSearchBoolValue($client['allow_all_origins'] ?? false, false);
    }
}

if (!function_exists('muginPublicSearchResolveAllowedOriginForClient')) {
    /**
     * @param array<string,mixed> $client
     * @param string $origin
     * @return string
     */
    function muginPublicSearchResolveAllowedOriginForClient(array $client, string $origin): string
    {
        $normalizedOrigin = trim($origin);
        if ($normalizedOrigin === '') {
            return '';
        }
        if (muginPublicSearchClientAllowsAllOrigins($client)) {
            return $normalizedOrigin;
        }

        $allowedOrigins = isset($client['allowed_origins']) && is_array($client['allowed_origins'])
            ? $client['allowed_origins']
            : [];

        foreach ($allowedOrigins as $pattern) {
            if (muginPublicSearchOriginMatchesPattern($normalizedOrigin, trim((string) $pattern))) {
                return $normalizedOrigin;
            }
        }

        return '';
    }
}

if (!function_exists('muginPublicSearchResolveAllowedOriginForAnyClient')) {
    /**
     * @param string $origin
     * @return string
     */
    function muginPublicSearchResolveAllowedOriginForAnyClient(string $origin): string
    {
        $normalizedOrigin = trim($origin);
        if ($normalizedOrigin === '') {
            return '';
        }
        foreach (muginPublicSearchGetClients() as $client) {
            if (!is_array($client) || muginPublicSearchBoolValue($client['enabled'] ?? true, true) !== true) {
                continue;
            }
            $allowed = muginPublicSearchResolveAllowedOriginForClient($client, $normalizedOrigin);
            if ($allowed !== '') {
                return $allowed;
            }
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchApplyCorsHeaders')) {
    /**
     * @param string $allowedOrigin
     * @return void
     */
    function muginPublicSearchApplyCorsHeaders(string $allowedOrigin = ''): void
    {
        if ($allowedOrigin !== '') {
            header('Access-Control-Allow-Origin: ' . $allowedOrigin);
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    }
}

if (!function_exists('muginPublicSearchNormalizeLanguageCode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeLanguageCode($value): string
    {
        $normalized = strtolower(trim((string) $value));
        if ($normalized === '') {
            return '';
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $map = [
            'english' => 'en',
            'eng' => 'en',
            'danish' => 'da',
            'dansk' => 'da',
            'dk' => 'da',
            'german' => 'de',
            'deutsch' => 'de',
            'french' => 'fr',
            'spanish' => 'es',
            'italian' => 'it',
            'dutch' => 'nl',
            'norwegian' => 'no',
            'norwegianbokmal' => 'nb',
            'norwegiannynorsk' => 'nn',
            'swedish' => 'sv',
            'portuguese' => 'pt',
        ];
        if (isset($map[$compact])) {
            return $map[$compact];
        }
        if ($normalized === 'dk') {
            return 'da';
        }
        return preg_match('/^[a-z]{2}$/', $normalized) === 1 ? $normalized : '';
    }
}

if (!function_exists('muginPublicSearchNormalizeSimpleList')) {
    /**
     * @param mixed $value
     * @return array<int,string>
     */
    function muginPublicSearchNormalizeSimpleList($value): array
    {
        if (is_array($value)) {
            $values = $value;
        } elseif (is_string($value)) {
            $values = preg_split('/\s*,\s*/', trim($value)) ?: [];
        } elseif ($value !== null && $value !== '') {
            $values = [(string) $value];
        } else {
            $values = [];
        }

        return muginPublicSearchDedupeStrings(array_map('strval', $values));
    }
}

if (!function_exists('muginPublicSearchComputeInitialsFromGivenName')) {
    /**
     * @param string $givenName
     * @return string
     */
    function muginPublicSearchComputeInitialsFromGivenName(string $givenName): string
    {
        // Matcher samme \p{L}+ bogstavgruppe-logik som webappens
        // extractAuthorInitials() i src/utils/resultAdapters.js, saa initialer
        // udledes ens uanset om de beregnes i JS eller PHP.
        preg_match_all('/[\p{L}]+/u', trim($givenName), $matches);
        $parts = $matches[0] ?? [];
        $initials = '';
        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }
            $firstChar = function_exists('mb_substr') ? mb_substr($part, 0, 1) : substr($part, 0, 1);
            $initials .= function_exists('mb_strtoupper') ? mb_strtoupper($firstChar) : strtoupper($firstChar);
        }
        return $initials;
    }
}

if (!function_exists('muginPublicSearchBuildNormalizedAuthorEntry')) {
    /**
     * Bygger et ensartet author-objekt uanset kilde. `name` normaliseres til
     * "Efternavn Initialer" (fx "Setzler M"), naar et efternavn er kendt, saa
     * forfatternavne vises ens uafhaengigt af hydrerings-kilde. `familyName`,
     * `givenName` og `initials` leveres separat, saa klienten selv kan
     * sammensaette et andet format, hvis den foretraekker det.
     *
     * @param string $familyName
     * @param string $givenName
     * @param string $initials Eksplicit kendte initialer (fx fra PubMed XML). Udledes fra givenName, hvis tom.
     * @param string $rawFallbackName Bruges som `name`, hvis der ikke kunne udledes et efternavn.
     * @return array{name:string,familyName:string,givenName:string,initials:string}
     */
    function muginPublicSearchBuildNormalizedAuthorEntry(
        string $familyName,
        string $givenName,
        string $initials,
        string $rawFallbackName
    ): array {
        $familyName = trim($familyName);
        $givenName = trim($givenName);
        $initials = trim($initials);
        if ($initials === '' && $givenName !== '') {
            $initials = muginPublicSearchComputeInitialsFromGivenName($givenName);
        }
        $name = $familyName !== ''
            ? trim($familyName . ($initials !== '' ? ' ' . $initials : ''))
            : trim($rawFallbackName);
        return [
            'name' => $name,
            'familyName' => $familyName,
            'givenName' => $givenName,
            'initials' => $initials,
        ];
    }
}

if (!function_exists('muginPublicSearchSplitFamilyFirstAuthorName')) {
    /**
     * Splitter et NCBI-stil navn ("Setzler M", "O'Brien JK") i familyName/initials.
     * Bruges som fallback, naar PubMed-XML'ens strukturerede Author-noder ikke er
     * tilgaengelige (fx naar includeAbstracts=false), og esummary kun leverer en
     * flad `name`-streng i dette format.
     *
     * @param string $rawName
     * @return array{name:string,familyName:string,givenName:string,initials:string}
     */
    function muginPublicSearchSplitFamilyFirstAuthorName(string $rawName): array
    {
        $rawName = trim($rawName);
        if ($rawName === '') {
            return ['name' => '', 'familyName' => '', 'givenName' => '', 'initials' => ''];
        }
        if (preg_match('/^(.*\S)\s+([A-Za-z]{1,4})$/u', $rawName, $matches) === 1) {
            return muginPublicSearchBuildNormalizedAuthorEntry($matches[1], '', $matches[2], $rawName);
        }
        return muginPublicSearchBuildNormalizedAuthorEntry($rawName, '', '', $rawName);
    }
}

if (!function_exists('muginPublicSearchSplitGivenFirstAuthorName')) {
    /**
     * Splitter et OpenAlex-navn (raw_author_name/display_name) i
     * familyName/givenName/initials. Porteret 1:1 fra webappens
     * formatPersonNameAsFamilyInitials() i src/utils/resultAdapters.js, saa
     * det offentlige API og webappens soegeformular navngiver forfattere
     * ens. Understoetter baade "Efternavn, Fornavn"-format (komma) og
     * "Fornavn Efternavn"-format via en sidste-ord-er-efternavn-heuristik.
     * Fejler for sammensatte efternavne (fx "van der Berg"), men er den
     * bedste tilgaengelige tilnaerming, da OpenAlex ikke leverer strukturerede
     * navnedele (bekraeftet mod OpenAlex' live API, ikke kun ud fra spec).
     *
     * @param string $rawName
     * @return array{name:string,familyName:string,givenName:string,initials:string}
     */
    function muginPublicSearchSplitGivenFirstAuthorName(string $rawName): array
    {
        $normalized = preg_replace('/\s+/', ' ', trim($rawName));
        $normalized = trim((string) $normalized);
        if ($normalized === '') {
            return ['name' => '', 'familyName' => '', 'givenName' => '', 'initials' => ''];
        }

        $commaPos = strpos($normalized, ',');
        if ($commaPos !== false) {
            $familyName = trim(substr($normalized, 0, $commaPos));
            $givenName = trim(substr($normalized, $commaPos + 1));
            return muginPublicSearchBuildNormalizedAuthorEntry($familyName, $givenName, '', $normalized);
        }

        preg_match_all('/[\p{L}]+/u', $normalized, $matches);
        $parts = $matches[0] ?? [];
        if (count($parts) < 2) {
            return muginPublicSearchBuildNormalizedAuthorEntry('', '', '', $normalized);
        }
        $familyName = $parts[count($parts) - 1];
        $givenName = implode(' ', array_slice($parts, 0, -1));
        return muginPublicSearchBuildNormalizedAuthorEntry($familyName, $givenName, '', $normalized);
    }
}

if (!function_exists('muginPublicSearchNormalizeSources')) {
    /**
     * @param mixed $value
     * @return array<int,string>
     */
    function muginPublicSearchNormalizeSources($value): array
    {
        $allowed = ['pubmed', 'semanticScholar', 'openAlex', 'elicit'];
        $output = [];
        foreach (muginPublicSearchNormalizeSimpleList($value) as $entry) {
            $normalized = trim($entry);
            if ($normalized === 'semanticscholar') {
                $normalized = 'semanticScholar';
            } elseif ($normalized === 'openalex') {
                $normalized = 'openAlex';
            }
            if (in_array($normalized, $allowed, true) && !in_array($normalized, $output, true)) {
                $output[] = $normalized;
            }
        }
        return $output;
    }
}

if (!function_exists('muginPublicSearchNormalizeSortMethod')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeSortMethod($value): string
    {
        $normalized = trim((string) $value);
        if (in_array($normalized, ['relevance', 'date_desc', 'date_asc'], true)) {
            return $normalized;
        }
        return 'relevance';
    }
}

if (!function_exists('muginPublicSearchGetFocusProfileConfig')) {
    /**
     * @param string $profileId
     * @return array<string,mixed>|null
     */
    function muginPublicSearchGetFocusProfileConfig(string $profileId): ?array
    {
        if ($profileId === '') {
            return null;
        }
        $profileConfig = defined('MUGIN_RERANK_PROFILE_CONFIG') && is_array(MUGIN_RERANK_PROFILE_CONFIG)
            ? MUGIN_RERANK_PROFILE_CONFIG
            : [];
        $profiles = isset($profileConfig['profiles']) && is_array($profileConfig['profiles'])
            ? $profileConfig['profiles']
            : [];
        foreach ($profiles as $profile) {
            if (is_array($profile) && trim((string) ($profile['id'] ?? '')) === $profileId) {
                return $profile;
            }
        }
        return null;
    }
}

if (!function_exists('muginPublicSearchNormalizeFocusProfileId')) {
    /**
     * Normaliserer et "focus"-profil-id og bekraefter, at det findes i
     * MUGIN_RERANK_PROFILE_CONFIG. Ukendt/tom vaerdi giver '' (ingen override).
     *
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeFocusProfileId($value): string
    {
        // Match frontend normalizeRerankProfileId: non [a-z0-9-] → hyphen, then trim.
        $normalized = strtolower(trim((string) $value));
        $normalized = preg_replace('/[^a-z0-9-]+/', '-', $normalized) ?? '';
        $normalized = trim($normalized, '-');
        if ($normalized === '') {
            return '';
        }
        return muginPublicSearchGetFocusProfileConfig($normalized) !== null ? $normalized : '';
    }
}

if (!function_exists('muginPublicSearchNormalizeQueryLanguage')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeQueryLanguage($value): string
    {
        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['da', 'en', 'auto'], true) ? $normalized : 'auto';
    }
}

if (!function_exists('muginPublicSearchNormalizeTranslationMode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeTranslationMode($value): string
    {
        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['auto', 'none'], true) ? $normalized : 'auto';
    }
}

if (!function_exists('muginPublicSearchNormalizePublicationYearRange')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizePublicationYearRange($value): string
    {
        $normalized = trim((string) $value);
        return preg_match('/^\d{4}(?:-\d{4})?$/', $normalized) === 1 ? $normalized : '';
    }
}

if (!function_exists('muginPublicSearchNormalizeSemanticScholarPublicationDateOrYear')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeSemanticScholarPublicationDateOrYear($value): string
    {
        $normalized = trim((string) $value);
        if ($normalized === '') {
            return '';
        }
        return preg_match('/^(\d{4}(?:-\d{2}(?:-\d{2})?)?)?(?::(\d{4}(?:-\d{2}(?:-\d{2})?)?)?)?$/', $normalized) === 1
            ? $normalized
            : '';
    }
}

if (!function_exists('muginPublicSearchNormalizeSourceFormat')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeSourceFormat($value): string
    {
        $normalized = strtolower(trim((string) $value));
        if ($normalized === '') {
            return '';
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $map = [
            'journal' => 'journal',
            'conference' => 'conference',
            'preprint' => 'preprint',
            'repositorypreprint' => 'preprint',
        ];
        return $map[$compact] ?? '';
    }
}

if (!function_exists('muginPublicSearchNormalizeHardPublicationType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeHardPublicationType($value): string
    {
        $normalized = strtolower(trim((string) $value));
        if ($normalized === '') {
            return '';
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $map = [
            'review' => 'review',
            'systematicreview' => 'systematic review',
            'metaanalysis' => 'meta-analysis',
            'cochranereview' => 'cochrane review',
        ];
        return $map[$compact] ?? '';
    }
}

if (!function_exists('muginPublicSearchNormalizeOpenAlexSourceType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeOpenAlexSourceType($value): string
    {
        $normalized = muginPublicSearchNormalizeSourceFormat($value);
        $map = [
            'journal' => 'journal',
            'conference' => 'conference',
        ];
        $fallback = strtolower(trim((string) $value));
        $compact = preg_replace('/[\s_-]+/', '', $fallback);
        $extended = [
            'bookseries' => 'book series',
            'ebookplatform' => 'ebook platform',
            'other' => 'other',
            'repository' => 'repository',
        ];
        if (isset($map[$normalized])) {
            return $map[$normalized];
        }
        if (isset($extended[$compact])) {
            return $extended[$compact];
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchNormalizeOpenAlexWorkType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeOpenAlexWorkType($value): string
    {
        $normalized = strtolower(trim((string) $value));
        if ($normalized === '') {
            return '';
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $map = [
            'article' => 'article',
            'book' => 'book',
            'bookchapter' => 'book-chapter',
            'dataset' => 'dataset',
            'dissertation' => 'dissertation',
            'review' => 'review',
            'preprint' => 'preprint',
            'editorial' => 'editorial',
            'erratum' => 'erratum',
            'letter' => 'letter',
            'libguides' => 'libguides',
            'other' => 'other',
            'paratext' => 'paratext',
            'peerreview' => 'peer-review',
            'referenceentry' => 'reference-entry',
            'report' => 'report',
            'retraction' => 'retraction',
            'standard' => 'standard',
            'supplementarymaterials' => 'supplementary-materials',
        ];
        return $map[$compact] ?? '';
    }
}

if (!function_exists('muginPublicSearchNormalizeSemanticScholarPublicationType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeSemanticScholarPublicationType($value): string
    {
        $trimmed = trim((string) $value);
        if ($trimmed === '') {
            return '';
        }
        $compact = strtolower(preg_replace('/[\s_-]+/', '', $trimmed));
        $map = [
            'review' => 'Review',
            'metaanalysis' => 'Meta-Analysis',
            'journalarticle' => 'JournalArticle',
            'conference' => 'Conference',
            'conferenceabstract' => 'Conference',
            'conferencepaper' => 'Conference',
            'conferenceproceeding' => 'Conference',
            'preprint' => 'Preprint',
            'repositorypreprint' => 'Preprint',
            'casereport' => 'CaseReport',
            'clinicaltrial' => 'ClinicalTrial',
            'editorial' => 'Editorial',
            'letter' => 'Letter',
        ];
        return $map[$compact] ?? '';
    }
}

if (!function_exists('muginPublicSearchNormalizeElicitTypeTag')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeElicitTypeTag($value): string
    {
        $normalized = strtolower(trim((string) $value));
        if ($normalized === '') {
            return '';
        }
        $compact = preg_replace('/[\s_-]+/', '', $normalized);
        $map = [
            'review' => 'Review',
            'metaanalysis' => 'Meta-Analysis',
            'systematicreview' => 'Systematic Review',
            'rct' => 'RCT',
            'randomizedcontrolledtrial' => 'RCT',
            'randomisedcontrolledtrial' => 'RCT',
            'longitudinal' => 'Longitudinal',
            'longitudinalstudy' => 'Longitudinal',
            'cohortstudy' => 'Longitudinal',
            'cohortstudies' => 'Longitudinal',
        ];
        return $map[$compact] ?? '';
    }
}

if (!function_exists('muginPublicSearchBuildDefaultRequest')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildDefaultRequest(): array
    {
        $config = muginPublicSearchGetConfig();
        return [
            'apiVersion' => '1',
            'query' => [
                'text' => '',
                'language' => 'auto',
            ],
            'domain' => '',
            'sources' => [],
            'sort' => [
                'method' => 'relevance',
            ],
            'focus' => '',
            'page' => [
                'number' => 1,
                'size' => $config['defaultPageSize'],
            ],
            'translation' => [
                'mode' => 'auto',
            ],
            'responseOptions' => [
                'includeAbstracts' => $config['includeAbstractsByDefault'],
                'includeResolvedQueries' => $config['includeResolvedQueriesByDefault'],
                'includeDiagnostics' => $config['includeDiagnosticsByDefault'],
                'includeProcessDetails' => false,
                'stream' => false,
                'language' => 'da',
                'noCache' => false,
            ],
            'hardFilters' => [
                'filterProfiles' => [],
                'languages' => [],
                'publicationYear' => '',
                'publicationDateYears' => [],
                'publicationTypes' => [],
                'studyDesigns' => [],
                'ageGroups' => [],
                'sourceFormats' => [],
                'doiOnlyRuleIds' => [],
                'postValidationRuleIds' => [],
            ],
            'sourceFilters' => [
                'semanticScholar' => [
                    'publicationTypes' => [],
                    'publicationDateOrYear' => '',
                    'year' => '',
                ],
                'openAlex' => [
                    'language' => [],
                    'sourceType' => [],
                    'workType' => [],
                    'publicationYear' => '',
                ],
                'elicit' => [
                    'typeTags' => [],
                    'includeKeywords' => [],
                    'excludeKeywords' => [],
                ],
            ],
            // Optional SearchForm context that is not already representable as
            // hardFilters/sourceFilters. Binding filter values stay only in those
            // canonical fields; this object carries UI/intent metadata.
            'intentContext' => [
                'rawUserInput' => '',
                'contextualSearchInput' => '',
                'selectedTopicIds' => [],
                'selectedTopicSelections' => [],
                'selectedTopicGroups' => [],
                'selectedLimitIds' => [],
                'selectedLimitSelections' => [],
                'selectedLimitGroups' => [],
                'selectedTopics' => [],
                'selectedLimits' => [],
                'semanticBlocks' => [],
                'ruleIds' => [],
            ],
            'preselectedPmids' => [],
            'preselectedDois' => [],
            'preselectedIdentifiers' => [],
        ];
    }
}

if (!function_exists('muginPublicSearchGetLowercasedQueryParams')) {
    /**
     * Returns GET query params with lowercased keys (canonical URL form).
     * Prefers QUERY_STRING parsing so casing and repeated keys match flat-param rules.
     *
     * @return array<string,mixed>
     */
    function muginPublicSearchGetLowercasedQueryParams(): array
    {
        $raw = (string) ($_SERVER['QUERY_STRING'] ?? '');
        if (trim($raw) !== '' && function_exists('muginPublicSearchParseRawUrlEncodedPreservingLimitGroups')) {
            return muginPublicSearchParseRawUrlEncodedPreservingLimitGroups($raw);
        }
        $normalized = [];
        foreach (is_array($_GET) ? $_GET : [] as $key => $value) {
            $lower = strtolower(trim((string) $key));
            if ($lower === '' || array_key_exists($lower, $normalized)) {
                continue;
            }
            $normalized[$lower] = $value;
        }
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchGetQueryParam')) {
    /**
     * Case-insensitive query-string lookup. Canonical name is lowercase.
     *
     * @return mixed|null
     */
    function muginPublicSearchGetQueryParam(string $name)
    {
        $lower = strtolower(trim($name));
        if ($lower === '') {
            return null;
        }
        $params = muginPublicSearchGetLowercasedQueryParams();
        return array_key_exists($lower, $params) ? $params[$lower] : null;
    }
}

if (!function_exists('muginPublicSearchApplyQueryResponseOptionOverrides')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,mixed>
     */
    function muginPublicSearchApplyQueryResponseOptionOverrides(array $request): array
    {
        $stream = muginPublicSearchGetQueryParam('stream');
        if ($stream !== null) {
            $request['responseOptions']['stream'] = muginPublicSearchBoolValue(
                $stream,
                (bool) ($request['responseOptions']['stream'] ?? false)
            );
        }
        $lang = muginPublicSearchGetQueryParam('lang');
        if ($lang !== null) {
            $request['responseOptions']['language'] = muginPublicSearchNormalizeResponseLanguage($lang);
        }
        $noCache = muginPublicSearchGetQueryParam('nocache');
        if ($noCache !== null) {
            $request['responseOptions']['noCache'] = muginPublicSearchBoolValue(
                $noCache,
                (bool) ($request['responseOptions']['noCache'] ?? false)
            );
        }
        return $request;
    }
}

if (!function_exists('muginPublicSearchBuildGetRequestFromQuery')) {
    /**
     * @param array<string,mixed> $queryParams
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildGetRequestFromQuery(array $queryParams): array
    {
        // Same SearchForm-compatible flat contract as form-urlencoded POST.
        // Prefer ParseRequest() with QUERY_STRING so repeated limit=/topic= survive.
        return muginPublicSearchBuildRequestFromFlatParams($queryParams);
    }
}

if (!function_exists('muginPublicSearchNormalizePostRequest')) {
    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    function muginPublicSearchNormalizePostRequest(array $payload): array
    {
        $request = muginPublicSearchBuildDefaultRequest();
        $allowedTopLevel = [
            'apiVersion',
            'query',
            'domain',
            'sources',
            'sort',
            'focus',
            'page',
            'translation',
            'responseOptions',
            'hardFilters',
            'sourceFilters',
            'intentContext',
            'preselectedPmids',
            'selected',
            'queryOverrides',
            'cachedFreetextQueries',
            'standardString',
        ];
        $unexpected = array_diff(array_keys($payload), $allowedTopLevel);
        if (!empty($unexpected)) {
            throw new InvalidArgumentException('Unsupported request field(s): ' . implode(', ', $unexpected));
        }
        if (($payload['apiVersion'] ?? '1') !== '1') {
            throw new InvalidArgumentException('Unsupported apiVersion');
        }

        $query = isset($payload['query']) && is_array($payload['query']) ? $payload['query'] : [];
        $queryUnexpected = array_diff(array_keys($query), ['text', 'language']);
        if (!empty($queryUnexpected)) {
            throw new InvalidArgumentException('Unsupported query field(s): ' . implode(', ', $queryUnexpected));
        }
        $request['query']['text'] = trim((string) ($query['text'] ?? ''));
        $request['query']['language'] = muginPublicSearchNormalizeQueryLanguage($query['language'] ?? 'auto');
        $request['domain'] = function_exists('muginNormalizeDomainKey')
            ? muginNormalizeDomainKey((string) ($payload['domain'] ?? ''))
            : trim((string) ($payload['domain'] ?? ''));
        $request['sources'] = muginPublicSearchNormalizeSources($payload['sources'] ?? []);

        $sort = isset($payload['sort']) && is_array($payload['sort']) ? $payload['sort'] : [];
        $sortUnexpected = array_diff(array_keys($sort), ['method']);
        if (!empty($sortUnexpected)) {
            throw new InvalidArgumentException('Unsupported sort field(s): ' . implode(', ', $sortUnexpected));
        }
        $request['sort']['method'] = muginPublicSearchNormalizeSortMethod($sort['method'] ?? 'relevance');
        $request['focus'] = muginPublicSearchNormalizeFocusProfileId($payload['focus'] ?? '');

        $page = isset($payload['page']) && is_array($payload['page']) ? $payload['page'] : [];
        $pageUnexpected = array_diff(array_keys($page), ['number', 'size', 'offset']);
        if (!empty($pageUnexpected)) {
            throw new InvalidArgumentException('Unsupported page field(s): ' . implode(', ', $pageUnexpected));
        }
        $config = muginPublicSearchGetConfig();
        $request['page']['number'] = max(1, (int) ($page['number'] ?? 1));
        $pageSize = (int) ($page['size'] ?? $config['defaultPageSize']);
        $request['page']['size'] = max(1, min($config['maxPageSize'], $pageSize > 0 ? $pageSize : $config['defaultPageSize']));
        // Absolute offset into the ordered candidate list (used by SearchForm when
        // increasing page size / loading more without re-hydrating known hits).
        if (array_key_exists('offset', $page) && $page['offset'] !== null && $page['offset'] !== '') {
            $request['page']['offset'] = max(0, (int) $page['offset']);
        } else {
            unset($request['page']['offset']);
        }

        $translation = isset($payload['translation']) && is_array($payload['translation']) ? $payload['translation'] : [];
        $translationUnexpected = array_diff(array_keys($translation), ['mode']);
        if (!empty($translationUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported translation field(s): ' . implode(', ', $translationUnexpected)
            );
        }
        $request['translation']['mode'] = muginPublicSearchNormalizeTranslationMode($translation['mode'] ?? 'auto');

        $responseOptions = isset($payload['responseOptions']) && is_array($payload['responseOptions'])
            ? $payload['responseOptions']
            : [];
        $responseUnexpected = array_diff(array_keys($responseOptions), [
            'includeAbstracts',
            'includeResolvedQueries',
            'includeDiagnostics',
            'includeProcessDetails',
            'stream',
            'language',
            'noCache',
        ]);
        if (!empty($responseUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported responseOptions field(s): ' . implode(', ', $responseUnexpected)
            );
        }
        $request['responseOptions']['includeAbstracts'] = muginPublicSearchBoolValue(
            $responseOptions['includeAbstracts'] ?? $request['responseOptions']['includeAbstracts'],
            $request['responseOptions']['includeAbstracts']
        );
        $request['responseOptions']['includeResolvedQueries'] = muginPublicSearchBoolValue(
            $responseOptions['includeResolvedQueries'] ?? $request['responseOptions']['includeResolvedQueries'],
            $request['responseOptions']['includeResolvedQueries']
        );
        $request['responseOptions']['includeDiagnostics'] = muginPublicSearchBoolValue(
            $responseOptions['includeDiagnostics'] ?? $request['responseOptions']['includeDiagnostics'],
            $request['responseOptions']['includeDiagnostics']
        );
        $request['responseOptions']['includeProcessDetails'] = muginPublicSearchBoolValue(
            $responseOptions['includeProcessDetails'] ?? $request['responseOptions']['includeProcessDetails'],
            $request['responseOptions']['includeProcessDetails']
        );
        $request['responseOptions']['stream'] = muginPublicSearchBoolValue(
            $responseOptions['stream'] ?? $request['responseOptions']['stream'],
            $request['responseOptions']['stream']
        );
        $request['responseOptions']['language'] = muginPublicSearchNormalizeResponseLanguage(
            $responseOptions['language'] ?? $request['responseOptions']['language']
        );
        $request['responseOptions']['noCache'] = muginPublicSearchBoolValue(
            $responseOptions['noCache'] ?? $request['responseOptions']['noCache'],
            (bool) ($request['responseOptions']['noCache'] ?? false)
        );

        $hardFilters = isset($payload['hardFilters']) && is_array($payload['hardFilters']) ? $payload['hardFilters'] : [];
        $hardUnexpected = array_diff(array_keys($hardFilters), [
            'filterProfiles',
            'languages',
            'publicationYear',
            'publicationDateYears',
            'publicationTypes',
            'studyDesigns',
            'ageGroups',
            'sourceFormats',
            'doiOnlyRuleIds',
            'postValidationRuleIds',
        ]);
        if (!empty($hardUnexpected)) {
            throw new InvalidArgumentException('Unsupported hardFilters field(s): ' . implode(', ', $hardUnexpected));
        }
        $request['hardFilters']['filterProfiles'] = muginPublicSearchDedupeStrings(
            muginPublicSearchNormalizeSimpleList($hardFilters['filterProfiles'] ?? [])
        );
        $request['hardFilters']['languages'] = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeLanguageCode', muginPublicSearchNormalizeSimpleList($hardFilters['languages'] ?? []))
        );
        $request['hardFilters']['publicationYear'] = muginPublicSearchNormalizePublicationYearRange(
            $hardFilters['publicationYear'] ?? ''
        );
        $publicationDateYears = [];
        foreach (muginPublicSearchNormalizeSimpleList($hardFilters['publicationDateYears'] ?? []) as $year) {
            if (is_numeric($year) && (int) $year >= 1000 && (int) $year <= 9999) {
                $publicationDateYears[] = (int) $year;
            }
        }
        $request['hardFilters']['publicationDateYears'] = array_values(array_unique($publicationDateYears));
        $request['hardFilters']['publicationTypes'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeHardPublicationType',
                muginPublicSearchNormalizeSimpleList($hardFilters['publicationTypes'] ?? [])
            )
        );
        $request['hardFilters']['studyDesigns'] = muginPublicSearchDedupeStrings(
            muginPublicSearchNormalizeSimpleList($hardFilters['studyDesigns'] ?? [])
        );
        $request['hardFilters']['ageGroups'] = muginPublicSearchDedupeStrings(
            muginPublicSearchNormalizeSimpleList($hardFilters['ageGroups'] ?? [])
        );
        $request['hardFilters']['sourceFormats'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeSourceFormat',
                muginPublicSearchNormalizeSimpleList($hardFilters['sourceFormats'] ?? [])
            )
        );
        $request['hardFilters']['doiOnlyRuleIds'] = muginPublicSearchDedupeStrings(
            muginPublicSearchNormalizeSimpleList($hardFilters['doiOnlyRuleIds'] ?? [])
        );
        $request['hardFilters']['postValidationRuleIds'] = muginPublicSearchDedupeStrings(
            muginPublicSearchNormalizeSimpleList($hardFilters['postValidationRuleIds'] ?? [])
        );

        $sourceFilters = isset($payload['sourceFilters']) && is_array($payload['sourceFilters']) ? $payload['sourceFilters'] : [];
        $sourceUnexpected = array_diff(array_keys($sourceFilters), ['semanticScholar', 'openAlex', 'elicit']);
        if (!empty($sourceUnexpected)) {
            throw new InvalidArgumentException('Unsupported sourceFilters section(s): ' . implode(', ', $sourceUnexpected));
        }

        $semanticScholar = isset($sourceFilters['semanticScholar']) && is_array($sourceFilters['semanticScholar'])
            ? $sourceFilters['semanticScholar']
            : [];
        $semanticScholarUnexpected = array_diff(array_keys($semanticScholar), ['publicationTypes', 'publicationDateOrYear', 'year']);
        if (!empty($semanticScholarUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported sourceFilters.semanticScholar field(s): ' . implode(', ', $semanticScholarUnexpected)
            );
        }
        $request['sourceFilters']['semanticScholar']['publicationTypes'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeSemanticScholarPublicationType',
                muginPublicSearchNormalizeSimpleList($semanticScholar['publicationTypes'] ?? [])
            )
        );
        $request['sourceFilters']['semanticScholar']['publicationDateOrYear'] =
            muginPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
                $semanticScholar['publicationDateOrYear'] ?? ''
            );
        $request['sourceFilters']['semanticScholar']['year'] = muginPublicSearchNormalizePublicationYearRange(
            $semanticScholar['year'] ?? ''
        );

        $openAlex = isset($sourceFilters['openAlex']) && is_array($sourceFilters['openAlex'])
            ? $sourceFilters['openAlex']
            : [];
        $openAlexUnexpected = array_diff(array_keys($openAlex), ['language', 'sourceType', 'workType', 'publicationYear', 'isOa', 'is_oa']);
        if (!empty($openAlexUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported sourceFilters.openAlex field(s): ' . implode(', ', $openAlexUnexpected)
            );
        }
        $request['sourceFilters']['openAlex']['language'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeLanguageCode',
                muginPublicSearchNormalizeSimpleList($openAlex['language'] ?? [])
            )
        );
        $request['sourceFilters']['openAlex']['sourceType'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeOpenAlexSourceType',
                muginPublicSearchNormalizeSimpleList($openAlex['sourceType'] ?? [])
            )
        );
        $request['sourceFilters']['openAlex']['workType'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeOpenAlexWorkType',
                muginPublicSearchNormalizeSimpleList($openAlex['workType'] ?? [])
            )
        );
        $request['sourceFilters']['openAlex']['publicationYear'] = muginPublicSearchNormalizePublicationYearRange(
            $openAlex['publicationYear'] ?? ''
        );
        $openAlexIsOa = muginPublicSearchNormalizeElicitBooleanValue($openAlex['isOa'] ?? ($openAlex['is_oa'] ?? null));
        if ($openAlexIsOa !== null) {
            $request['sourceFilters']['openAlex']['isOa'] = $openAlexIsOa;
        }
        unset($request['sourceFilters']['openAlex']['is_oa']);

        $elicit = isset($sourceFilters['elicit']) && is_array($sourceFilters['elicit']) ? $sourceFilters['elicit'] : [];
        // Extended (additive, backward compatible) to accept the same Elicit
        // filter fields the website widget's buildSemanticSourceQueryPlan()
        // already sends (DropdownWrapper.vue ~5903-5919), which the public
        // API previously rejected outright as "unsupported field(s)".
        $elicitAllowedFields = [
            'typeTags', 'includeKeywords', 'excludeKeywords',
            'minYear', 'maxYear', 'minEpochS', 'maxEpochS', 'maxQuartile', 'hasPdf', 'pubmedOnly', 'retracted',
        ];
        $elicitUnexpected = array_diff(array_keys($elicit), $elicitAllowedFields);
        if (!empty($elicitUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported sourceFilters.elicit field(s): ' . implode(', ', $elicitUnexpected)
            );
        }
        $request['sourceFilters']['elicit']['typeTags'] = muginPublicSearchDedupeStrings(
            array_map(
                'muginPublicSearchNormalizeElicitTypeTag',
                muginPublicSearchNormalizeSimpleList($elicit['typeTags'] ?? [])
            )
        );
        $request['sourceFilters']['elicit']['includeKeywords'] = muginPublicSearchNormalizeSimpleList(
            $elicit['includeKeywords'] ?? []
        );
        $request['sourceFilters']['elicit']['excludeKeywords'] = muginPublicSearchNormalizeSimpleList(
            $elicit['excludeKeywords'] ?? []
        );
        if (array_key_exists('minYear', $elicit)) {
            $request['sourceFilters']['elicit']['minYear'] = muginPublicSearchNormalizeElicitYearValue($elicit['minYear']);
        }
        if (array_key_exists('maxYear', $elicit)) {
            $request['sourceFilters']['elicit']['maxYear'] = muginPublicSearchNormalizeElicitYearValue($elicit['maxYear']);
        }
        if (array_key_exists('minEpochS', $elicit)) {
            $request['sourceFilters']['elicit']['minEpochS'] = is_numeric($elicit['minEpochS']) ? (int) $elicit['minEpochS'] : null;
        }
        if (array_key_exists('maxEpochS', $elicit)) {
            $request['sourceFilters']['elicit']['maxEpochS'] = is_numeric($elicit['maxEpochS']) ? (int) $elicit['maxEpochS'] : null;
        }
        if (array_key_exists('maxQuartile', $elicit)) {
            $request['sourceFilters']['elicit']['maxQuartile'] = muginPublicSearchNormalizeElicitQuartileValue($elicit['maxQuartile']);
        }
        if (array_key_exists('hasPdf', $elicit)) {
            $request['sourceFilters']['elicit']['hasPdf'] = muginPublicSearchNormalizeElicitBooleanValue($elicit['hasPdf']);
        }
        if (array_key_exists('pubmedOnly', $elicit)) {
            $request['sourceFilters']['elicit']['pubmedOnly'] = muginPublicSearchNormalizeElicitBooleanValue($elicit['pubmedOnly']);
        }
        if (array_key_exists('retracted', $elicit)) {
            $request['sourceFilters']['elicit']['retracted'] = muginPublicSearchNormalizeElicitRetractedValue($elicit['retracted']);
        }

        $intentContext = isset($payload['intentContext']) && is_array($payload['intentContext'])
            ? $payload['intentContext']
            : [];
        $intentUnexpected = array_diff(array_keys($intentContext), [
            'rawUserInput',
            'contextualSearchInput',
            'selectedTopicIds',
            'selectedTopicSelections',
            'selectedTopicGroups',
            'selectedLimitIds',
            'selectedLimitSelections',
            'selectedLimitGroups',
            'selectedTopics',
            'selectedLimits',
            'semanticBlocks',
            'ruleIds',
        ]);
        if (!empty($intentUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported intentContext field(s): ' . implode(', ', $intentUnexpected)
            );
        }
        $isCatalogTopicId = static function (string $id): bool {
            return preg_match('/^[A-Z][0-9A-Z]{2,}$/', $id) === 1;
        };
        $selectedTopicIds = [];
        foreach (muginPublicSearchNormalizeSimpleList($intentContext['selectedTopicIds'] ?? []) as $rawTopicId) {
            $id = strtoupper(trim((string) $rawTopicId));
            // Ignore widget synthetic ids (e.g. __custom__:…) — only catalog ids.
            if ($isCatalogTopicId($id)) {
                $selectedTopicIds[] = $id;
            }
        }
        $selectedTopicIds = muginPublicSearchDedupeStrings($selectedTopicIds);
        $selectedTopicSelections = [];
        foreach ((array) ($intentContext['selectedTopicSelections'] ?? []) as $selection) {
            if (!is_array($selection)) {
                continue;
            }
            $normalizedTopic = muginPublicSearchNormalizeTopicSelectionEntry($selection);
            if ($normalizedTopic !== null) {
                $selectedTopicSelections[] = $normalizedTopic;
                if (!$normalizedTopic['custom'] && $normalizedTopic['id'] !== '') {
                    $selectedTopicIds[] = $normalizedTopic['id'];
                }
            }
        }
        $selectedTopicGroups = [];
        foreach ((array) ($intentContext['selectedTopicGroups'] ?? []) as $group) {
            if (!is_array($group)) {
                continue;
            }
            $normalizedGroup = [];
            foreach ($group as $selection) {
                if (!is_array($selection)) {
                    $id = strtoupper(trim((string) $selection));
                    if ($id === '' || !$isCatalogTopicId($id)) {
                        continue;
                    }
                    $normalizedTopic = muginPublicSearchNormalizeTopicSelectionEntry([
                        'id' => $id,
                        'scope' => 'normal',
                        'custom' => false,
                    ]);
                } else {
                    $normalizedTopic = muginPublicSearchNormalizeTopicSelectionEntry($selection);
                }
                if ($normalizedTopic === null) {
                    continue;
                }
                $normalizedGroup[] = $normalizedTopic;
                if (!$normalizedTopic['custom'] && $normalizedTopic['id'] !== '') {
                    $selectedTopicIds[] = $normalizedTopic['id'];
                }
            }
            if (!empty($normalizedGroup)) {
                $selectedTopicGroups[] = $normalizedGroup;
            }
        }
        $selectedTopicIds = muginPublicSearchDedupeStrings($selectedTopicIds);
        if (empty($selectedTopicSelections) && !empty($selectedTopicIds)) {
            foreach ($selectedTopicIds as $id) {
                if (!$isCatalogTopicId($id)) {
                    continue;
                }
                $selectedTopicSelections[] = [
                    'id' => $id,
                    'scope' => 'normal',
                    'custom' => false,
                    'rawText' => '',
                    'label' => '',
                ];
            }
        }
        if (empty($selectedTopicGroups) && !empty($selectedTopicSelections)) {
            $selectedTopicGroups = [$selectedTopicSelections];
        }
        $selectedLimitIds = muginPublicSearchDedupeStrings(
            array_map('strtoupper', muginPublicSearchNormalizeSimpleList($intentContext['selectedLimitIds'] ?? []))
        );
        $selectedLimitSelections = [];
        foreach ((array) ($intentContext['selectedLimitSelections'] ?? []) as $selection) {
            if (!is_array($selection)) {
                continue;
            }
            $id = strtoupper(trim((string) ($selection['id'] ?? '')));
            if ($id === '') {
                continue;
            }
            $scope = strtolower(trim((string) ($selection['scope'] ?? 'normal')));
            if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                $scope = 'normal';
            }
            $selectedLimitSelections[] = ['id' => $id, 'scope' => $scope];
            $selectedLimitIds[] = $id;
        }
        $selectedLimitGroups = [];
        foreach ((array) ($intentContext['selectedLimitGroups'] ?? []) as $group) {
            if (!is_array($group)) {
                continue;
            }
            $normalizedGroup = [];
            foreach ($group as $selection) {
                if (!is_array($selection)) {
                    $id = strtoupper(trim((string) $selection));
                    if ($id === '') {
                        continue;
                    }
                    $normalizedGroup[] = ['id' => $id, 'scope' => 'normal'];
                    $selectedLimitIds[] = $id;
                    continue;
                }
                $id = strtoupper(trim((string) ($selection['id'] ?? '')));
                if ($id === '') {
                    continue;
                }
                $scope = strtolower(trim((string) ($selection['scope'] ?? 'normal')));
                if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                    $scope = 'normal';
                }
                $normalizedGroup[] = ['id' => $id, 'scope' => $scope];
                $selectedLimitIds[] = $id;
            }
            if (!empty($normalizedGroup)) {
                $selectedLimitGroups[] = $normalizedGroup;
            }
        }
        $selectedLimitIds = muginPublicSearchDedupeStrings($selectedLimitIds);
        if (empty($selectedLimitSelections) && !empty($selectedLimitIds)) {
            foreach ($selectedLimitIds as $id) {
                $selectedLimitSelections[] = ['id' => $id, 'scope' => 'normal'];
            }
        }
        if (empty($selectedLimitGroups) && !empty($selectedLimitSelections)) {
            // Flat selections without explicit groups: one group (OR) — category AND
            // semantics are still applied by the PubMed builder fallback path.
            $selectedLimitGroups = [$selectedLimitSelections];
        }
        $request['intentContext'] = [
            'rawUserInput' => trim((string) ($intentContext['rawUserInput'] ?? '')),
            'contextualSearchInput' => trim((string) ($intentContext['contextualSearchInput'] ?? '')),
            'selectedTopicIds' => $selectedTopicIds,
            'selectedTopicSelections' => $selectedTopicSelections,
            'selectedTopicGroups' => $selectedTopicGroups,
            'selectedLimitIds' => $selectedLimitIds,
            'selectedLimitSelections' => $selectedLimitSelections,
            'selectedLimitGroups' => $selectedLimitGroups,
            'selectedTopics' => muginPublicSearchDedupeStrings(
                muginPublicSearchNormalizeSimpleList($intentContext['selectedTopics'] ?? [])
            ),
            'selectedLimits' => muginPublicSearchDedupeStrings(
                muginPublicSearchNormalizeSimpleList($intentContext['selectedLimits'] ?? [])
            ),
            'semanticBlocks' => muginPublicSearchDedupeStrings(
                muginPublicSearchNormalizeSimpleList($intentContext['semanticBlocks'] ?? [])
            ),
            'ruleIds' => muginPublicSearchDedupeStrings(
                muginPublicSearchNormalizeSimpleList($intentContext['ruleIds'] ?? [])
            ),
        ];
        $selectedTokens = muginPublicSearchNormalizeSimpleList($payload['selected'] ?? []);
        foreach (muginPublicSearchNormalizeSimpleList($payload['preselectedPmids'] ?? []) as $pmid) {
            $selectedTokens[] = $pmid;
        }
        if (count($selectedTokens) > muginPublicSearchFlatParamsMaxPmidTokens()) {
            throw new InvalidArgumentException(
                'Too many selected tokens (max ' . muginPublicSearchFlatParamsMaxPmidTokens() . ')'
            );
        }
        $selectedSplit = muginSplitSelectedIdentifiers($selectedTokens);
        $request['preselectedIdentifiers'] = $selectedSplit['identifiers'];
        $request['preselectedPmids'] = $selectedSplit['pmids'];
        $request['preselectedDois'] = $selectedSplit['dois'];

        if (array_key_exists('standardString', $payload)) {
            $normalizedStandard = muginPublicSearchNormalizeStandardStringOptions($payload['standardString']);
            if ($normalizedStandard !== []) {
                $request['standardString'] = $normalizedStandard;
            }
        }

        // Fill empty hardFilters/sourceFilters/labels from selected limit ids (JSON path).
        $request = muginPublicSearchHydrateRequestFromSelectedLimits($request, false);
        $request = muginPublicSearchHydrateRequestFromSelectedTopics($request);

        $authorizationContext = $request['intentContext'];
        $authorizationContext['ruleIds'] = muginPublicSearchDedupeStrings(array_merge(
            (array) ($authorizationContext['ruleIds'] ?? []),
            (array) ($request['hardFilters']['doiOnlyRuleIds'] ?? []),
            (array) ($request['hardFilters']['postValidationRuleIds'] ?? [])
        ));
        muginPublicSearchAssertIntentContextIdsAreAuthorized($authorizationContext);

        // Use post-hydrate intent: SearchForm sends #s:pubmed clauses only in
        // selectedTopicGroups (query.text stays empty so AI will not rewrite them).
        // Hydration flattens those groups into selectedTopicSelections.
        $hydratedTopicIds = (array) ($request['intentContext']['selectedTopicIds'] ?? []);
        $hydratedTopicSelections = (array) ($request['intentContext']['selectedTopicSelections'] ?? []);
        $hasTopics = !empty($hydratedTopicIds) || !empty(array_filter(
            $hydratedTopicSelections,
            static fn($entry) => is_array($entry) && !empty($entry['custom'])
        ));
        if (array_key_exists('queryOverrides', $payload)) {
            $normalizedOverrides = muginPublicSearchNormalizeQueryOverrides($payload['queryOverrides']);
            if ($normalizedOverrides !== []) {
                $request['queryOverrides'] = $normalizedOverrides;
            }
        }
        if (
            $request['query']['text'] === ''
            && !$hasTopics
            && !muginPublicSearchRequestHasExecutableQueryOverrides($request)
        ) {
            throw new InvalidArgumentException('query.text is required');
        }
        if (empty($request['sources'])) {
            throw new InvalidArgumentException('sources must contain at least one supported source');
        }
        if (array_key_exists('cachedFreetextQueries', $payload)) {
            $normalizedCached = muginPublicSearchNormalizeCachedFreetextQueries($payload['cachedFreetextQueries']);
            if ($normalizedCached !== []) {
                $request['cachedFreetextQueries'] = $normalizedCached;
            }
        }

        return muginPublicSearchApplyQueryResponseOptionOverrides($request);
    }
}

if (!function_exists('muginPublicSearchLoadLimitNodeCatalog')) {
    /**
     * Loads the canonical limits runtime configuration and indexes every node
     * by id. Client requests only carry ids; executable search strings and
     * post-validation rules are always resolved from this trusted catalog.
     *
     * @return array<string,array<string,mixed>>
     */
    function muginPublicSearchLoadLimitNodeCatalog(): array
    {
        static $catalog = null;
        if (is_array($catalog)) {
            return $catalog;
        }
        $catalog = [];
        $path = '';
        if (function_exists('editorResolveLimitsFilePath')) {
            try {
                $path = (string) editorResolveLimitsFilePath();
            } catch (Throwable $exception) {
                $path = '';
            }
        }
        if ($path === '') {
            $candidate = dirname(__DIR__, 2)
                . DIRECTORY_SEPARATOR . 'data'
                . DIRECTORY_SEPARATOR . 'content'
                . DIRECTORY_SEPARATOR . 'shared'
                . DIRECTORY_SEPARATOR . 'limits.json';
            if (is_file($candidate)) {
                $path = $candidate;
            }
        }
        if ($path === '' || !is_file($path)) {
            return $catalog;
        }
        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded)) {
            return $catalog;
        }
        $walk = static function ($node, string $categoryId = '') use (&$walk, &$catalog): void {
            if (!is_array($node)) {
                return;
            }
            $nextCategoryId = $categoryId;
            if (isset($node['id'])) {
                $id = trim((string) $node['id']);
                if ($id !== '') {
                    if (preg_match('/^L[A-Z0-9]{3}$/i', $id) === 1) {
                        $nextCategoryId = $id;
                    }
                    $indexedNode = $node;
                    $indexedNode['_categoryId'] = $nextCategoryId;
                    $catalog[$id] = $indexedNode;
                }
            }
            foreach ($node as $value) {
                if (is_array($value)) {
                    $walk($value, $nextCategoryId);
                }
            }
        };
        $walk($decoded);
        return $catalog;
    }
}

if (!function_exists('muginPublicSearchCollectKnownLimitAndTopicIds')) {
    /**
     * @return array<string,bool>
     */
    function muginPublicSearchCollectKnownLimitAndTopicIds(): array
    {
        return array_fill_keys(array_keys(muginPublicSearchLoadLimitNodeCatalog()), true);
    }
}

if (!function_exists('muginPublicSearchBuildSelectedLimitPubMedQuery')) {
    /**
     * Builds PubMed hard-filter clauses from selected limits.
     *
     * Two shapes are accepted:
     * 1) Explicit AND-groups (SearchForm limit= semantics):
     *    [[{id,scope},…], [{id,scope},…]] — OR within each group, AND between groups.
     * 2) Flat list of ids / {id,scope} — legacy category-based grouping
     *    (OR within limits.json category, AND between categories).
     *
     * @param array<int,mixed> $selectedLimits
     */
    function muginPublicSearchBuildSelectedLimitPubMedQuery(array $selectedLimits, string $defaultMode = 'normal'): string
    {
        $catalog = muginPublicSearchLoadLimitNodeCatalog();
        if (empty($catalog) || empty($selectedLimits)) {
            return '';
        }
        $normalizedDefault = in_array($defaultMode, ['narrow', 'normal', 'broad'], true)
            ? $defaultMode
            : 'normal';

        $first = $selectedLimits[0];
        $isExplicitGroups = is_array($first)
            && array_keys($first) === range(0, count($first) - 1)
            && (empty($first) || !array_key_exists('id', $first));

        if ($isExplicitGroups) {
            $parts = [];
            foreach ($selectedLimits as $group) {
                if (!is_array($group)) {
                    continue;
                }
                $orClauses = [];
                foreach ($group as $entry) {
                    $id = '';
                    $mode = $normalizedDefault;
                    if (is_array($entry)) {
                        $id = strtoupper(trim((string) ($entry['id'] ?? '')));
                        $scope = strtolower(trim((string) ($entry['scope'] ?? $normalizedDefault)));
                        if (in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                            $mode = $scope;
                        }
                    } else {
                        $id = strtoupper(trim((string) $entry));
                    }
                    if ($id === '' || !isset($catalog[$id]) || !is_array($catalog[$id])) {
                        continue;
                    }
                    $node = $catalog[$id];
                    $searchStrings = isset($node['searchStrings']) && is_array($node['searchStrings'])
                        ? $node['searchStrings']
                        : [];
                    $values = muginPublicSearchNormalizeSimpleList(
                        $searchStrings[$mode] ?? ($searchStrings['normal'] ?? [])
                    );
                    if (empty($values)) {
                        continue;
                    }
                    $orClauses[] = count($values) === 1 ? $values[0] : '(' . implode(' OR ', $values) . ')';
                }
                $orClauses = muginPublicSearchDedupeStrings($orClauses);
                if (empty($orClauses)) {
                    continue;
                }
                $parts[] = count($orClauses) === 1 ? $orClauses[0] : '(' . implode(' OR ', $orClauses) . ')';
            }
            return implode(' AND ', $parts);
        }

        // Flat list: reproduce category OR/AND from limits.json.
        $groups = [];
        foreach ($selectedLimits as $entry) {
            $id = '';
            $mode = $normalizedDefault;
            if (is_array($entry)) {
                $id = strtoupper(trim((string) ($entry['id'] ?? '')));
                $scope = strtolower(trim((string) ($entry['scope'] ?? $normalizedDefault)));
                if (in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                    $mode = $scope;
                }
            } else {
                $id = strtoupper(trim((string) $entry));
            }
            if ($id === '') {
                continue;
            }
            $node = isset($catalog[$id]) && is_array($catalog[$id]) ? $catalog[$id] : null;
            if ($node === null) {
                continue;
            }
            $searchStrings = isset($node['searchStrings']) && is_array($node['searchStrings'])
                ? $node['searchStrings']
                : [];
            $values = muginPublicSearchNormalizeSimpleList(
                $searchStrings[$mode] ?? ($searchStrings['normal'] ?? [])
            );
            if (empty($values)) {
                continue;
            }
            $categoryId = trim((string) ($node['_categoryId'] ?? ''));
            if ($categoryId === '') {
                $categoryId = 'ungrouped:' . $id;
            }
            $clause = count($values) === 1 ? $values[0] : '(' . implode(' OR ', $values) . ')';
            $groups[$categoryId][] = $clause;
        }

        $parts = [];
        foreach ($groups as $clauses) {
            $clauses = muginPublicSearchDedupeStrings($clauses);
            if (empty($clauses)) {
                continue;
            }
            $parts[] = count($clauses) === 1 ? $clauses[0] : '(' . implode(' OR ', $clauses) . ')';
        }
        return implode(' AND ', $parts);
    }
}

if (!function_exists('muginPublicSearchBuildCanonicalHardFilterPubMedQuery')) {
    /**
     * Resolves public-API hard-filter values back to canonical limits.json
     * nodes, so API clients without UI limit ids get the same PubMed clauses.
     *
     * @param array<string,mixed> $hardFilters
     */
    function muginPublicSearchBuildCanonicalHardFilterPubMedQuery(array $hardFilters): string
    {
        $fieldMap = [
            'filterProfile' => 'filterProfiles',
            'publicationType' => 'publicationTypes',
            'studyDesign' => 'studyDesigns',
            'ageGroup' => 'ageGroups',
            'language' => 'languages',
            'sourceFormat' => 'sourceFormats',
        ];
        $normalize = static function (string $canonicalField, $value): string {
            if ($canonicalField === 'languages') {
                return muginPublicSearchNormalizeLanguageCode($value);
            }
            if ($canonicalField === 'publicationTypes') {
                return muginPublicSearchNormalizeHardPublicationType($value);
            }
            if ($canonicalField === 'sourceFormats') {
                return muginPublicSearchNormalizeSourceFormat($value);
            }
            return strtolower(trim((string) $value));
        };
        $requested = [];
        foreach ($fieldMap as $configField => $canonicalField) {
            foreach ((array) ($hardFilters[$canonicalField] ?? []) as $value) {
                $normalized = $normalize($canonicalField, $value);
                if ($normalized !== '') {
                    $requested[$configField][$normalized] = true;
                }
            }
        }

        $groups = [];
        foreach (muginPublicSearchLoadLimitNodeCatalog() as $id => $node) {
            $semanticConfig = isset($node['semanticConfig']) && is_array($node['semanticConfig'])
                ? $node['semanticConfig']
                : [];
            $nodeHardFilters = isset($semanticConfig['hardFilters']) && is_array($semanticConfig['hardFilters'])
                ? $semanticConfig['hardFilters']
                : [];
            $matches = false;
            foreach ($fieldMap as $configField => $canonicalField) {
                foreach ((array) ($nodeHardFilters[$configField] ?? []) as $value) {
                    if (isset($requested[$configField][$normalize($canonicalField, $value)])) {
                        $matches = true;
                        break 2;
                    }
                }
            }
            if (!$matches) {
                continue;
            }
            $searchStrings = isset($node['searchStrings']) && is_array($node['searchStrings'])
                ? $node['searchStrings']
                : [];
            $values = muginPublicSearchNormalizeSimpleList($searchStrings['normal'] ?? []);
            if (empty($values)) {
                continue;
            }
            $categoryId = trim((string) ($node['_categoryId'] ?? ('ungrouped:' . $id)));
            $groups[$categoryId][] = count($values) === 1 ? $values[0] : '(' . implode(' OR ', $values) . ')';
        }
        $parts = [];
        foreach ($groups as $clauses) {
            $clauses = muginPublicSearchDedupeStrings($clauses);
            if (!empty($clauses)) {
                $parts[] = count($clauses) === 1 ? $clauses[0] : '(' . implode(' OR ', $clauses) . ')';
            }
        }
        return implode(' AND ', $parts);
    }
}

if (!function_exists('muginPublicSearchCollectKnownPostValidationRuleIds')) {
    /**
     * @return array<string,bool>
     */
    function muginPublicSearchCollectKnownPostValidationRuleIds(): array
    {
        $known = [];
        foreach (muginPublicSearchLoadLimitNodeCatalog() as $node) {
            $semanticConfig = isset($node['semanticConfig']) && is_array($node['semanticConfig'])
                ? $node['semanticConfig']
                : [];
            $postValidation = isset($semanticConfig['postValidation']) && is_array($semanticConfig['postValidation'])
                ? $semanticConfig['postValidation']
                : [];
            $rules = !empty($postValidation['rules'])
                ? (array) $postValidation['rules']
                : (array) ($semanticConfig['doiOnlyRules'] ?? []);
            foreach ($rules as $rule) {
                if (!is_array($rule)) {
                    continue;
                }
                $id = trim((string) ($rule['id'] ?? ''));
                if ($id !== '') {
                    $known[$id] = true;
                }
            }
        }
        return $known;
    }
}

if (!function_exists('muginPublicSearchNormalizePostValidationRule')) {
    /**
     * @param array<string,mixed> $rule
     * @return array<string,mixed>|null
     */
    function muginPublicSearchNormalizePostValidationRule(array $rule): ?array
    {
        $normalizeList = static function ($values): array {
            return muginSemanticQualityDedupeNormalizedValues((array) $values);
        };
        $conditions = [];
        foreach ((array) ($rule['metadataFieldConditions'] ?? []) as $condition) {
            if (!is_array($condition)) {
                continue;
            }
            $field = trim((string) ($condition['field'] ?? ''));
            if ($field === '') {
                continue;
            }
            $operator = strtolower(trim((string) ($condition['operator'] ?? 'equalsAny')));
            $conditions[] = [
                'field' => $field,
                'operator' => in_array($operator, ['exists', 'equalsany', 'includesany'], true)
                    ? ($operator === 'equalsany' ? 'equalsAny' : ($operator === 'includesany' ? 'includesAny' : 'exists'))
                    : 'equalsAny',
                'values' => $normalizeList($condition['values'] ?? ($condition['value'] ?? [])),
                'expectExists' => array_key_exists('expectExists', $condition)
                    ? (bool) $condition['expectExists']
                    : true,
                'negate' => !empty($condition['negate']),
            ];
        }
        $normalized = [
            'id' => trim((string) ($rule['id'] ?? '')),
            'exclusiveGroup' => strtolower(trim((string) ($rule['exclusiveGroup'] ?? ''))),
            'matchStrategy' => strtolower(trim((string) ($rule['matchStrategy'] ?? 'all'))) === 'any'
                ? 'any'
                : 'all',
            'metadataFieldConditionMode' => strtolower(trim((string) ($rule['metadataFieldConditionMode'] ?? 'all'))) === 'any'
                ? 'any'
                : 'all',
            'textScopes' => $normalizeList($rule['textScopes'] ?? ['candidateTitle', 'sourceCandidateTitles']),
            'requireAnyTextSignals' => $normalizeList($rule['requireAnyTextSignals'] ?? ($rule['requireAnyTitleSignals'] ?? [])),
            'requireAllTextSignals' => $normalizeList($rule['requireAllTextSignals'] ?? []),
            'excludeAnyTextSignals' => $normalizeList($rule['excludeAnyTextSignals'] ?? ($rule['excludeAnyTitleSignals'] ?? [])),
            'allowSourceProviders' => $normalizeList($rule['allowSourceProviders'] ?? []),
            'excludeSourceProviders' => $normalizeList($rule['excludeSourceProviders'] ?? []),
            'metadataFieldConditions' => $conditions,
        ];
        if (
            empty($normalized['requireAnyTextSignals'])
            && empty($normalized['requireAllTextSignals'])
            && empty($normalized['excludeAnyTextSignals'])
            && empty($normalized['allowSourceProviders'])
            && empty($normalized['excludeSourceProviders'])
            && empty($normalized['metadataFieldConditions'])
        ) {
            return null;
        }
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchBuildPostValidationRuleState')) {
    /**
     * Builds the same grouped DOI-only rule state as
     * buildActiveSemanticDoiOnlyRuleState(), exclusively from trusted
     * limits.json nodes selected by the client.
     *
     * @param array<string,mixed> $request
     * @return array{activeRules:array<int,array<string,mixed>>,ruleGroups:array<int,array<string,mixed>>}
     */
    function muginPublicSearchBuildPostValidationRuleState(array $request): array
    {
        $catalog = muginPublicSearchLoadLimitNodeCatalog();
        $selectedIds = (array) ($request['intentContext']['selectedLimitIds'] ?? []);
        $requestedRuleIds = muginPublicSearchDedupeStrings(array_merge(
            (array) ($request['hardFilters']['doiOnlyRuleIds'] ?? []),
            (array) ($request['hardFilters']['postValidationRuleIds'] ?? []),
            (array) ($request['intentContext']['ruleIds'] ?? [])
        ));
        $requestedLookup = array_fill_keys($requestedRuleIds, true);
        $rulesById = [];
        $candidateNodes = [];
        if (!empty($selectedIds)) {
            foreach ($selectedIds as $selectedId) {
                if (isset($catalog[$selectedId]) && is_array($catalog[$selectedId])) {
                    $candidateNodes[] = $catalog[$selectedId];
                }
            }
        } elseif (!empty($requestedLookup)) {
            $candidateNodes = array_values($catalog);
        }
        foreach ($candidateNodes as $node) {
            if ($node === null) {
                continue;
            }
            $semanticConfig = isset($node['semanticConfig']) && is_array($node['semanticConfig'])
                ? $node['semanticConfig']
                : [];
            $postValidation = isset($semanticConfig['postValidation']) && is_array($semanticConfig['postValidation'])
                ? $semanticConfig['postValidation']
                : [];
            $rawRules = !empty($postValidation['rules'])
                ? (array) $postValidation['rules']
                : (array) ($semanticConfig['doiOnlyRules'] ?? []);
            foreach ($rawRules as $rule) {
                if (!is_array($rule)) {
                    continue;
                }
                $ruleId = trim((string) ($rule['id'] ?? ''));
                if ($ruleId === '' || (!empty($requestedLookup) && !isset($requestedLookup[$ruleId]))) {
                    continue;
                }
                $normalizedRule = muginPublicSearchNormalizePostValidationRule($rule);
                if ($normalizedRule !== null) {
                    $rulesById[$ruleId] = $normalizedRule;
                }
            }
        }

        $activeRules = array_values($rulesById);
        $groups = [];
        foreach ($activeRules as $rule) {
            $exclusiveGroup = strtolower(trim((string) ($rule['exclusiveGroup'] ?? '')));
            $groupId = $exclusiveGroup !== ''
                ? 'exclusive:' . $exclusiveGroup
                : 'rule:' . (string) ($rule['id'] ?? '');
            if (!isset($groups[$groupId])) {
                $groups[$groupId] = [
                    'id' => $groupId,
                    'exclusiveGroup' => $exclusiveGroup,
                    'rules' => [],
                ];
            }
            $groups[$groupId]['rules'][] = $rule;
        }
        return ['activeRules' => $activeRules, 'ruleGroups' => array_values($groups)];
    }
}

if (!function_exists('muginPublicSearchAssertIntentContextIdsAreAuthorized')) {
    /**
     * Rejects unknown limit/topic/rule ids when a catalog is available.
     * Arbitrary rule definitions are never accepted from the client — only ids.
     *
     * @param array<string,mixed> $intentContext
     */
    function muginPublicSearchAssertIntentContextIdsAreAuthorized(array $intentContext): void
    {
        $catalog = muginPublicSearchCollectKnownLimitAndTopicIds();
        if (empty($catalog)) {
            return;
        }
        $check = static function (array $ids, string $field) use ($catalog): void {
            $unknown = [];
            foreach ($ids as $id) {
                $normalized = trim((string) $id);
                if ($normalized === '' || isset($catalog[$normalized])) {
                    continue;
                }
                $unknown[] = $normalized;
            }
            if (!empty($unknown)) {
                throw new InvalidArgumentException(
                    'Unauthorized intentContext.' . $field . ': ' . implode(', ', array_slice($unknown, 0, 10))
                );
            }
        };
        // Topic ids are authorized domain-aware in muginPublicSearchHydrateRequestFromSelectedTopics.
        $check((array) ($intentContext['selectedLimitIds'] ?? []), 'selectedLimitIds');
        $knownRuleIds = muginPublicSearchCollectKnownPostValidationRuleIds();
        $unknownRuleIds = [];
        foreach ((array) ($intentContext['ruleIds'] ?? []) as $ruleId) {
            $normalized = trim((string) $ruleId);
            if ($normalized !== '' && !isset($knownRuleIds[$normalized])) {
                $unknownRuleIds[] = $normalized;
            }
        }
        if (!empty($unknownRuleIds)) {
            throw new InvalidArgumentException(
                'Unauthorized intentContext.ruleIds: ' . implode(', ', array_slice($unknownRuleIds, 0, 10))
            );
        }
    }
}

if (!function_exists('muginPublicSearchNormalizeTopicSelectionEntry')) {
    /**
     * @param array<string,mixed> $selection
     * @return array{id:string,scope:string,custom:bool,rawText:string,label:string}|null
     */
    function muginPublicSearchNormalizeTopicSelectionEntry(array $selection): ?array
    {
        $custom = !empty($selection['custom']);
        $rawText = trim((string) ($selection['rawText'] ?? ($selection['text'] ?? '')));
        $id = strtoupper(trim((string) ($selection['id'] ?? '')));
        $scope = strtolower(trim((string) ($selection['scope'] ?? 'normal')));
        if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
            $scope = 'normal';
        }
        $label = trim((string) ($selection['label'] ?? ''));
        $translated = !empty($selection['translated']) || !empty($selection['isTranslated']);
        if ($custom) {
            if ($rawText === '') {
                return null;
            }
            return [
                'id' => '',
                'scope' => $scope,
                'custom' => true,
                'rawText' => $rawText,
                'label' => $label !== '' ? $label : $rawText,
                'translated' => $translated,
            ];
        }
        if ($id === '' || preg_match('/^[A-Z][0-9A-Z]{2,}$/', $id) !== 1) {
            return null;
        }
        return [
            'id' => $id,
            'scope' => $scope,
            'custom' => false,
            'rawText' => '',
            'label' => $label,
            'translated' => false,
        ];
    }
}

if (!function_exists('muginPublicSearchLoadTopicNodeCatalog')) {
    /**
     * Loads and indexes domain topics.json nodes by id.
     *
     * @return array{nodes: array<string,array<string,mixed>>, standardString: array<string,string>, loaded: bool}
     */
    function muginPublicSearchLoadTopicNodeCatalog(string $domain): array
    {
        static $cache = [];
        $normalizedDomain = function_exists('muginNormalizeDomainKey')
            ? muginNormalizeDomainKey($domain)
            : strtolower(trim($domain));
        if ($normalizedDomain === '') {
            return ['nodes' => [], 'standardString' => [], 'loaded' => false];
        }
        if (isset($cache[$normalizedDomain])) {
            return $cache[$normalizedDomain];
        }
        $path = '';
        if (function_exists('editorResolveContentFilePath')) {
            try {
                $path = (string) editorResolveContentFilePath('topics', $normalizedDomain);
            } catch (Throwable $exception) {
                $path = '';
            }
        }
        if ($path === '') {
            $candidate = dirname(__DIR__, 2)
                . DIRECTORY_SEPARATOR . 'data'
                . DIRECTORY_SEPARATOR . 'content'
                . DIRECTORY_SEPARATOR . $normalizedDomain
                . DIRECTORY_SEPARATOR . 'topics.json';
            if (is_file($candidate)) {
                $path = $candidate;
            }
        }
        if ($path === '' || !is_file($path)) {
            $cache[$normalizedDomain] = ['nodes' => [], 'standardString' => [], 'loaded' => false];
            return $cache[$normalizedDomain];
        }
        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded)) {
            $cache[$normalizedDomain] = ['nodes' => [], 'standardString' => [], 'loaded' => false];
            return $cache[$normalizedDomain];
        }
        $nodes = [];
        $walk = static function ($node) use (&$walk, &$nodes): void {
            if (!is_array($node)) {
                return;
            }
            if (isset($node['id'])) {
                $id = strtoupper(trim((string) $node['id']));
                if ($id !== '') {
                    $nodes[$id] = $node;
                }
            }
            foreach (['groups', 'children', 'choices', 'topics'] as $childKey) {
                if (!isset($node[$childKey]) || !is_array($node[$childKey])) {
                    continue;
                }
                foreach ($node[$childKey] as $child) {
                    $walk($child);
                }
            }
        };
        foreach ((array) ($decoded['topics'] ?? []) as $topicRoot) {
            $walk($topicRoot);
        }
        $standardString = [];
        if (isset($decoded['standardString']) && is_array($decoded['standardString'])) {
            foreach (['narrow', 'normal', 'broad'] as $scopeKey) {
                $value = trim((string) ($decoded['standardString'][$scopeKey] ?? ''));
                if ($value !== '') {
                    $standardString[$scopeKey] = $value;
                }
            }
        }
        $cache[$normalizedDomain] = [
            'nodes' => $nodes,
            'standardString' => $standardString,
            'loaded' => true,
        ];
        return $cache[$normalizedDomain];
    }
}

if (!function_exists('muginPublicSearchTopicNodeLabel')) {
    /**
     * @param array<string,mixed> $node
     */
    function muginPublicSearchTopicNodeLabel(array $node, string $fallbackId = ''): string
    {
        $translations = isset($node['translations']) && is_array($node['translations'])
            ? $node['translations']
            : [];
        $en = trim((string) ($translations['en'] ?? ''));
        if ($en !== '') {
            return $en;
        }
        $dk = trim((string) ($translations['dk'] ?? ''));
        if ($dk !== '') {
            return $dk;
        }
        return $fallbackId;
    }
}

if (!function_exists('muginPublicSearchHydrateRequestFromSelectedTopics')) {
    /**
     * Validates catalog topic ids against domain topics.json and fills labels.
     *
     * @param array<string,mixed> $request
     * @return array<string,mixed>
     */
    function muginPublicSearchHydrateRequestFromSelectedTopics(array $request): array
    {
        $intent = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];
        $groups = (array) ($intent['selectedTopicGroups'] ?? []);
        $catalogIds = [];
        foreach ($groups as $group) {
            if (!is_array($group)) {
                continue;
            }
            foreach ($group as $entry) {
                if (!is_array($entry) || !empty($entry['custom'])) {
                    continue;
                }
                $id = strtoupper(trim((string) ($entry['id'] ?? '')));
                if ($id !== '') {
                    $catalogIds[] = $id;
                }
            }
        }
        foreach ((array) ($intent['selectedTopicIds'] ?? []) as $id) {
            $normalized = strtoupper(trim((string) $id));
            if ($normalized !== '') {
                $catalogIds[] = $normalized;
            }
        }
        $catalogIds = muginPublicSearchDedupeStrings($catalogIds);
        $domain = trim((string) ($request['domain'] ?? ''));
        $warnings = (array) ($request['_topicHydrationWarnings'] ?? []);
        $standardString = [];

        if (!empty($catalogIds)) {
            if ($domain === '') {
                throw new InvalidArgumentException(
                    'domain is required when catalog topic ids are provided'
                );
            }
            $catalog = muginPublicSearchLoadTopicNodeCatalog($domain);
            if (($catalog['loaded'] ?? false) !== true || empty($catalog['nodes'])) {
                throw new InvalidArgumentException(
                    'No topics catalog found for domain: ' . $domain
                );
            }
            $nodes = (array) ($catalog['nodes'] ?? []);
            $unknown = [];
            foreach ($catalogIds as $id) {
                if (!isset($nodes[$id])) {
                    $unknown[] = $id;
                }
            }
            if (!empty($unknown)) {
                throw new InvalidArgumentException(
                    'Unauthorized intentContext.selectedTopicIds: '
                    . implode(', ', array_slice($unknown, 0, 10))
                );
            }
            $standardString = (array) ($catalog['standardString'] ?? []);
            $labels = [];
            $hydratedGroups = [];
            foreach ($groups as $group) {
                if (!is_array($group)) {
                    continue;
                }
                $hydratedGroup = [];
                foreach ($group as $entry) {
                    if (!is_array($entry)) {
                        continue;
                    }
                    $normalized = muginPublicSearchNormalizeTopicSelectionEntry($entry);
                    if ($normalized === null) {
                        continue;
                    }
                    if ($normalized['custom']) {
                        $hydratedGroup[] = $normalized;
                        continue;
                    }
                    $node = (array) ($nodes[$normalized['id']] ?? []);
                    $normalized['label'] = muginPublicSearchTopicNodeLabel($node, $normalized['id']);
                    $scope = $normalized['scope'];
                    $searchStrings = isset($node['searchStrings'][$scope]) && is_array($node['searchStrings'][$scope])
                        ? $node['searchStrings'][$scope]
                        : [];
                    if (empty($searchStrings)) {
                        $warnings[] = 'Topic ' . $normalized['id']
                            . ' has no searchStrings for scope ' . $scope;
                    }
                    $hydratedGroup[] = $normalized;
                    if ($normalized['label'] !== '') {
                        $labels[] = $normalized['label'];
                    }
                }
                if (!empty($hydratedGroup)) {
                    $hydratedGroups[] = $hydratedGroup;
                }
            }
            $intent['selectedTopicGroups'] = $hydratedGroups;
            $flatSelections = [];
            foreach ($hydratedGroups as $group) {
                foreach ($group as $entry) {
                    $flatSelections[] = $entry;
                }
            }
            $intent['selectedTopicSelections'] = $flatSelections;
            $intent['selectedTopics'] = muginPublicSearchDedupeStrings($labels);
        } elseif (!empty($groups)) {
            // Custom-only groups: normalize labels.
            $hydratedGroups = [];
            foreach ($groups as $group) {
                if (!is_array($group)) {
                    continue;
                }
                $hydratedGroup = [];
                foreach ($group as $entry) {
                    $normalized = is_array($entry)
                        ? muginPublicSearchNormalizeTopicSelectionEntry($entry)
                        : null;
                    if ($normalized !== null) {
                        $hydratedGroup[] = $normalized;
                    }
                }
                if (!empty($hydratedGroup)) {
                    $hydratedGroups[] = $hydratedGroup;
                }
            }
            $intent['selectedTopicGroups'] = $hydratedGroups;
            $flatSelections = [];
            foreach ($hydratedGroups as $group) {
                foreach ($group as $entry) {
                    $flatSelections[] = $entry;
                }
            }
            $intent['selectedTopicSelections'] = $flatSelections;
            if ($domain !== '') {
                $catalog = muginPublicSearchLoadTopicNodeCatalog($domain);
                if (($catalog['loaded'] ?? false) === true) {
                    $standardString = (array) ($catalog['standardString'] ?? []);
                }
            }
        }

        $options = isset($request['standardString']) && is_array($request['standardString'])
            ? $request['standardString']
            : [];
        $applyToFreetext = true;
        if (array_key_exists('add', $options)) {
            $applyToFreetext = $options['add'] === true;
        }
        $overrideText = trim((string) ($options['text'] ?? ''));
        if ($applyToFreetext && $overrideText !== '') {
            $standardString = [
                'narrow' => $overrideText,
                'normal' => $overrideText,
                'broad' => $overrideText,
            ];
        }
        $scope = strtolower(trim((string) ($options['scope'] ?? 'normal')));
        if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
            $scope = 'normal';
        }

        $request['intentContext'] = $intent;
        $request['_topicStandardString'] = $standardString;
        $request['_applyStandardStringToFreetext'] = $applyToFreetext;
        $request['_standardStringScope'] = $scope;
        $request['_topicHydrationWarnings'] = muginPublicSearchDedupeStrings($warnings);
        return $request;
    }
}

if (!function_exists('muginPublicSearchBuildSelectedTopicPubMedQuery')) {
    /**
     * Builds deterministic PubMed clauses from selected topic groups.
     * OR within group, AND between groups. Custom entries use rawText.
     *
     * @param array<int,mixed> $selectedTopicGroups
     * @param array<string,array<string,mixed>> $nodes
     * @param array<string,string> $standardString
     * @param bool $applyStandardStringToFreetext
     * @return array{query:string,warnings:array<int,string>}
     */
    function muginPublicSearchBuildSelectedTopicPubMedQuery(
        array $selectedTopicGroups,
        array $nodes = [],
        array $standardString = [],
        bool $applyStandardStringToFreetext = true
    ): array {
        $warnings = [];
        $hasLogicalOperators = static function (string $value): bool {
            return (bool) preg_match('/\b(AND|OR|NOT)\b/', $value);
        };
        $appendStandard = static function (
            string $combined,
            array $entry,
            array $node,
            array $standardString
        ) use ($hasLogicalOperators, $applyStandardStringToFreetext): string {
            $scope = (string) ($entry['scope'] ?? 'normal');
            $isCustom = !empty($entry['custom']);
            $shouldCombine = false;
            if ($isCustom) {
                $shouldCombine = $applyStandardStringToFreetext && !empty($standardString);
            } else {
                $flags = isset($node['combineWithStandardStringScopes'])
                    && is_array($node['combineWithStandardStringScopes'])
                    ? $node['combineWithStandardStringScopes']
                    : null;
                if (is_array($flags)) {
                    $shouldCombine = !empty($flags[$scope]);
                } else {
                    $shouldCombine = ($node['combineWithStandardString'] ?? true) !== false
                        && !empty($standardString);
                }
            }
            if (!$shouldCombine) {
                return $combined;
            }
            $standardValue = trim((string) ($standardString[$scope] ?? ($standardString['normal'] ?? '')));
            if ($standardValue === '') {
                return $combined;
            }
            $combinedNorm = strtolower(preg_replace('/\s+/', ' ', $combined) ?? $combined);
            $standardNorm = strtolower(preg_replace('/\s+/', ' ', $standardValue) ?? $standardValue);
            if ($standardNorm !== '' && strpos($combinedNorm, $standardNorm) === false) {
                return '(' . $combined . ') AND (' . $standardValue . ')';
            }
            return $combined;
        };

        $groupClauses = [];
        foreach ($selectedTopicGroups as $group) {
            if (!is_array($group)) {
                continue;
            }
            $orClauses = [];
            foreach ($group as $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $scope = (string) ($entry['scope'] ?? 'normal');
                if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                    $scope = 'normal';
                }
                // Untranslated custom fretext goes through AI/query.text.
                // `#s:pubmed` / translated=true is already a PubMed clause — use directly.
                if (!empty($entry['custom'])) {
                    if (empty($entry['translated'])) {
                        continue;
                    }
                    $combined = trim((string) ($entry['rawText'] ?? ''));
                    if ($combined === '') {
                        continue;
                    }
                    $combined = $appendStandard($combined, $entry, [], $standardString);
                    $orClauses[] = count($group) > 1 && $hasLogicalOperators($combined)
                        ? '(' . $combined . ')'
                        : $combined;
                    continue;
                }
                $id = strtoupper(trim((string) ($entry['id'] ?? '')));
                if ($id === '' || !isset($nodes[$id]) || !is_array($nodes[$id])) {
                    continue;
                }
                $node = $nodes[$id];
                $searchStrings = isset($node['searchStrings'][$scope]) && is_array($node['searchStrings'][$scope])
                    ? array_values(array_filter(array_map('strval', $node['searchStrings'][$scope])))
                    : [];
                if (empty($searchStrings)) {
                    $warnings[] = 'Topic ' . $id . ' has no searchStrings for scope ' . $scope;
                    continue;
                }
                $combined = implode(' OR ', $searchStrings);
                $combined = $appendStandard($combined, $entry, $node, $standardString);
                if (count($group) > 1 && $hasLogicalOperators($searchStrings[0] ?? '')) {
                    $orClauses[] = '(' . $combined . ')';
                } else {
                    $orClauses[] = $combined;
                }
            }
            if (empty($orClauses)) {
                continue;
            }
            $groupClause = count($orClauses) === 1
                ? $orClauses[0]
                : '(' . implode(') OR (', $orClauses) . ')';
            $groupClauses[] = $groupClause;
        }
        if (empty($groupClauses)) {
            return ['query' => '', 'warnings' => muginPublicSearchDedupeStrings($warnings)];
        }
        $query = count($groupClauses) === 1
            ? $groupClauses[0]
            : '(' . implode(') AND (', $groupClauses) . ')';
        return ['query' => $query, 'warnings' => muginPublicSearchDedupeStrings($warnings)];
    }
}

if (!function_exists('muginPublicSearchBuildSelectionFromRequest')) {
    /**
     * Public response projection of selected topics/limits.
     *
     * @param array<string,mixed> $request
     * @return array{domain:string,topics:array<int,mixed>,limits:array<int,mixed>}
     */
    function muginPublicSearchBuildSelectionFromRequest(array $request): array
    {
        $intent = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];
        $topicsOut = [];
        foreach ((array) ($intent['selectedTopicGroups'] ?? []) as $groupIndex => $group) {
            if (!is_array($group)) {
                continue;
            }
            $items = [];
            foreach ($group as $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $custom = !empty($entry['custom']);
                $items[] = [
                    'id' => $custom ? null : (string) ($entry['id'] ?? ''),
                    'custom' => $custom,
                    'text' => $custom ? (string) ($entry['rawText'] ?? '') : '',
                    'scope' => (string) ($entry['scope'] ?? 'normal'),
                    'label' => (string) ($entry['label'] ?? ($entry['rawText'] ?? ($entry['id'] ?? ''))),
                ];
            }
            if (!empty($items)) {
                $topicsOut[] = [
                    'groupIndex' => (int) $groupIndex,
                    'items' => $items,
                ];
            }
        }
        $limitCatalog = muginPublicSearchLoadLimitNodeCatalog();
        $limitsOut = [];
        foreach ((array) ($intent['selectedLimitGroups'] ?? []) as $groupIndex => $group) {
            if (!is_array($group)) {
                continue;
            }
            $items = [];
            foreach ($group as $entry) {
                $id = '';
                $scope = 'normal';
                if (is_array($entry)) {
                    $id = strtoupper(trim((string) ($entry['id'] ?? '')));
                    $scope = strtolower(trim((string) ($entry['scope'] ?? 'normal')));
                } else {
                    $id = strtoupper(trim((string) $entry));
                }
                if ($id === '') {
                    continue;
                }
                if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                    $scope = 'normal';
                }
                $node = isset($limitCatalog[$id]) && is_array($limitCatalog[$id]) ? $limitCatalog[$id] : [];
                $label = '';
                if (!empty($node)) {
                    $label = muginPublicSearchTopicNodeLabel($node, $id);
                }
                $items[] = [
                    'id' => $id,
                    'scope' => $scope,
                    'label' => $label !== '' ? $label : $id,
                ];
            }
            if (!empty($items)) {
                $limitsOut[] = [
                    'groupIndex' => (int) $groupIndex,
                    'items' => $items,
                ];
            }
        }
        return [
            'domain' => (string) ($request['domain'] ?? ''),
            'topics' => $topicsOut,
            'limits' => $limitsOut,
        ];
    }
}

require_once __DIR__ . '/public-search-flat-params.php';

if (!function_exists('muginPublicSearchParseRequest')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchParseRequest(): array
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        if ($method === 'GET') {
            // Parse QUERY_STRING directly so repeated limit=/topic= stay as AND-groups
            // (PHP's $_GET keeps only the last value for duplicate keys).
            $rawQuery = (string) ($_SERVER['QUERY_STRING'] ?? '');
            if (trim($rawQuery) !== '') {
                return muginPublicSearchBuildRequestFromFlatParams(
                    muginPublicSearchParseRawUrlEncodedPreservingLimitGroups($rawQuery)
                );
            }
            return muginPublicSearchBuildRequestFromFlatParams(is_array($_GET) ? $_GET : []);
        }
        if ($method !== 'POST') {
            throw new InvalidArgumentException('Method not allowed');
        }
        $contentType = strtolower(trim((string) ($_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? ''))));
        $contentType = trim(explode(';', $contentType)[0]);
        if ($contentType === 'application/x-www-form-urlencoded' || $contentType === 'multipart/form-data') {
            $raw = (string) file_get_contents('php://input');
            // Prefer raw urlencoded parsing so repeated limit= values become AND-groups.
            // multipart falls back to $_POST (array notation / last-wins).
            if ($contentType === 'application/x-www-form-urlencoded' && trim($raw) !== '') {
                $formParams = muginPublicSearchParseRawUrlEncodedPreservingLimitGroups($raw);
            } else {
                $formParams = is_array($_POST) ? $_POST : [];
            }
            if (!is_array($formParams)) {
                throw new InvalidArgumentException('Invalid form input');
            }
            return muginPublicSearchBuildRequestFromFlatParams($formParams);
        }
        if ($contentType !== '' && $contentType !== 'application/json') {
            throw new InvalidArgumentException(
                'Unsupported Content-Type: use application/json or application/x-www-form-urlencoded'
            );
        }
        $input = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($input)) {
            throw new InvalidArgumentException('Invalid JSON input');
        }
        return muginPublicSearchNormalizePostRequest($input);
    }
}

if (!function_exists('muginPublicSearchExtractApiKey')) {
    /**
     * @return array{key: string, source: string}
     */
    function muginPublicSearchExtractApiKey(): array
    {
        $config = muginPublicSearchGetConfig();
        $headerKey = trim((string) ($_SERVER['HTTP_X_API_KEY'] ?? ''));
        if ($headerKey !== '') {
            return ['key' => $headerKey, 'source' => 'header'];
        }
        $authorization = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
        if (stripos($authorization, 'Bearer ') === 0) {
            return ['key' => trim(substr($authorization, 7)), 'source' => 'authorization'];
        }
        if ($config['urlApiKeyEnabled'] === true) {
            // Canonical: apikey= (lowercase). apiKey=/ApiKey= etc. accepted via CI lookup.
            $queryKeyRaw = muginPublicSearchGetQueryParam('apikey');
            $queryKey = is_array($queryKeyRaw)
                ? trim((string) (reset($queryKeyRaw) ?: ''))
                : trim((string) ($queryKeyRaw ?? ''));
            if ($queryKey !== '') {
                return ['key' => $queryKey, 'source' => 'query'];
            }
        }
        return ['key' => '', 'source' => ''];
    }
}

if (!function_exists('muginPublicSearchClientMatchesApiKey')) {
    /**
     * @param array<string,mixed> $client
     * @param string $apiKey
     * @param string $source
     * @return bool
     */
    function muginPublicSearchClientMatchesApiKey(array $client, string $apiKey, string $source): bool
    {
        $mode = muginPublicSearchGetConfig()['urlApiKeyMode'];
        $primary = trim((string) ($client['api_key'] ?? ''));
        $secondary = trim((string) ($client['url_api_key'] ?? ($client['test_api_key'] ?? '')));

        if ($source === 'query') {
            if ($mode === 'same_api_keys') {
                return $primary !== '' && hash_equals($primary, $apiKey);
            }
            if ($mode === 'separate_test_keys') {
                return $secondary !== '' && hash_equals($secondary, $apiKey);
            }
            if ($secondary !== '' && hash_equals($secondary, $apiKey)) {
                return true;
            }
            if (muginPublicSearchBoolValue($client['allow_primary_api_key_in_url'] ?? false, false)) {
                return $primary !== '' && hash_equals($primary, $apiKey);
            }
            return false;
        }

        return $primary !== '' && hash_equals($primary, $apiKey);
    }
}

if (!function_exists('muginPublicSearchResolveClient')) {
    /**
     * @param string $apiKey
     * @param string $source
     * @return array<string,mixed>
     */
    function muginPublicSearchResolveClient(string $apiKey, string $source): array
    {
        if ($apiKey === '') {
            throw new RuntimeException('Missing API key', 401);
        }

        foreach (muginPublicSearchGetClients() as $clientId => $client) {
            if (!is_array($client)) {
                continue;
            }
            if (muginPublicSearchBoolValue($client['enabled'] ?? true, true) !== true) {
                continue;
            }
            if (!muginPublicSearchClientMatchesApiKey($client, $apiKey, $source)) {
                continue;
            }
            $client['client_id'] = (string) $clientId;
            return $client;
        }

        throw new RuntimeException('Invalid API key', 401);
    }
}

if (!function_exists('muginPublicSearchResolveAuthenticatedClient')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchResolveAuthenticatedClient(): array
    {
        $auth = muginPublicSearchExtractApiKey();
        $client = muginPublicSearchResolveClient($auth['key'], $auth['source']);
        $origin = muginPublicSearchResolveOrigin();
        if ($origin !== '') {
            $allowedOrigin = muginPublicSearchResolveAllowedOriginForClient($client, $origin);
            if ($allowedOrigin === '') {
                throw new RuntimeException('Origin is not allowed for this client', 403);
            }
            $client['resolved_origin'] = $allowedOrigin;
        } else {
            $client['resolved_origin'] = '';
        }
        $client['auth_source'] = $auth['source'];
        $client['masked_api_key'] = muginPublicSearchMaskApiKey($auth['key']);
        return $client;
    }
}

if (!function_exists('muginPublicSearchClientAllowedSources')) {
    /**
     * Resolves which of the four search sources (pubmed, semanticScholar,
     * openAlex, elicit) a client profile is allowed to query.
     *
     * Deny-all-by-default (deliberate, per the unified-search-engine plan):
     * a client config WITHOUT an 'allowed_sources' key — or with it set to an
     * empty array — is allowed ZERO sources. Every client must explicitly opt
     * in to the sources it needs. This closes a pre-existing gap where any
     * API client with a valid key could request 'elicit' even though Elicit
     * access on the website is gated behind MUGIN_ELICIT_UNLOCK. If you are
     * upgrading an install with existing MUGIN_API_CLIENTS entries, add
     * 'allowed_sources' to each of them before deploying this change, or
     * those clients will start receiving 403s.
     *
     * @param array<string,mixed> $client
     * @return array<int,string>
     */
    function muginPublicSearchClientAllowedSources(array $client): array
    {
        $allSources = ['pubmed', 'semanticScholar', 'openAlex', 'elicit'];
        $configured = muginPublicSearchNormalizeSources($client['allowed_sources'] ?? []);
        return array_values(array_intersect($allSources, $configured));
    }
}

if (!function_exists('muginPublicSearchEnforceClientSourceAccess')) {
    /**
     * Filters $request['sources'] down to the sources the authenticated client
     * is allowed to use (see muginPublicSearchClientAllowedSources() for the
     * deny-all-by-default rule). Two distinct outcomes, matching the plan's
     * gate exactly:
     * - Partial denial (client is allowed SOME of the requested sources):
     *   the search proceeds with only the permitted sources, and a warning
     *   naming the excluded source(s) is attached to $request['_sourceAccessWarnings']
     *   for muginPublicSearchRunSearch() to merge into the response's warnings array.
     * - Full denial (client is allowed NONE of the requested sources,
     *   including the "no allowed_sources configured at all" case): throws a
     *   403 rather than returning a confusing empty-success response.
     *
     * @param array<string,mixed> $request
     * @param array<string,mixed> $client
     * @return array<string,mixed>
     */
    function muginPublicSearchEnforceClientSourceAccess(array $request, array $client): array
    {
        $requestedSources = (array) ($request['sources'] ?? []);
        $allowedSources = muginPublicSearchClientAllowedSources($client);
        $permittedSources = array_values(array_intersect($requestedSources, $allowedSources));
        $deniedSources = array_values(array_diff($requestedSources, $allowedSources));

        if (empty($permittedSources)) {
            $reason = empty($allowedSources)
                ? 'This API key has no allowed_sources configured; contact your administrator to enable specific sources.'
                : 'This API key is not authorized for the requested source(s): ' . implode(', ', $deniedSources);
            throw new RuntimeException($reason, 403);
        }

        $request['sources'] = $permittedSources;
        if (!empty($deniedSources)) {
            $request['_sourceAccessWarnings'] = [
                'This API key is not authorized for source(s): ' . implode(', ', $deniedSources)
                . '. Results were limited to: ' . implode(', ', $permittedSources) . '.',
            ];
        }
        return $request;
    }
}

if (!function_exists('muginPublicSearchClientSourceApiKey')) {
    /**
     * Resolves a per-client API key override for one source (NLM, openAlex,
     * semanticScholar, elicit), configured via MUGIN_API_CLIENTS[clientId]['source_api_keys'][source].
     * Falls back to '' (meaning: use the installation-wide default key) when
     * the client has not configured an override for this source.
     *
     * @param array<string,mixed> $client
     * @param string $sourceKey
     * @return string
     */
    function muginPublicSearchClientSourceApiKey(array $client, string $sourceKey): string
    {
        $sourceApiKeys = isset($client['source_api_keys']) && is_array($client['source_api_keys']) ? $client['source_api_keys'] : [];
        $override = trim((string) ($sourceApiKeys[$sourceKey] ?? ''));
        return $override;
    }
}

if (!function_exists('muginPublicSearchConsumeRateLimit')) {
    /**
     * @param array<string,mixed> $client
     * @param string $method
     * @return array<string,mixed>
     */
    function muginPublicSearchConsumeRateLimit(array $client, string $method): array
    {
        $config = muginPublicSearchGetConfig();
        $methodKey = strtoupper($method) === 'GET' ? 'get' : 'post';
        $limit = $methodKey === 'GET'
            ? max(1, (int) ($client['get_rate_limit_per_minute'] ?? $config['getRateLimit']))
            : max(1, (int) ($client['rate_limit_per_minute'] ?? $config['postRateLimit']));

        $dir = muginPublicSearchEnsureRuntimeDir();
        $bucket = preg_replace('/[^a-z0-9_-]+/i', '_', trim((string) ($client['client_id'] ?? 'client'))) . '_' . $methodKey;
        $path = $dir . DIRECTORY_SEPARATOR . 'public-search-rate-limit-' . $bucket . '.json';
        $fp = @fopen($path, 'c+');
        if ($fp === false) {
            throw new RuntimeException('Rate limit store unavailable. Please try again shortly.', 503);
        }

        $now = time();
        $windowStart = $now;
        $count = 0;
        $limited = false;

        try {
            if (!flock($fp, LOCK_EX)) {
                throw new RuntimeException('Rate limit store unavailable. Please try again shortly.', 503);
            }
            rewind($fp);
            $raw = stream_get_contents($fp);
            $state = is_string($raw) && trim($raw) !== '' ? json_decode($raw, true) : [];
            if (is_array($state)) {
                $windowStart = (int) ($state['windowStart'] ?? $now);
                $count = (int) ($state['count'] ?? 0);
            }
            if ($windowStart <= 0 || ($now - $windowStart) >= 60) {
                $windowStart = $now;
                $count = 0;
            }
            if ($count >= $limit) {
                $limited = true;
            } else {
                $count++;
            }
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, muginPublicSearchSafeJsonEncode([
                'windowStart' => $windowStart,
                'count' => $count,
            ]));
            fflush($fp);
            flock($fp, LOCK_UN);
        } finally {
            if (is_resource($fp)) {
                fclose($fp);
            }
        }

        $resetAt = $windowStart + 60;
        return [
            'limit' => $limit,
            'remaining' => max(0, $limit - $count),
            'resetAt' => gmdate('c', $resetAt),
            'resetInSeconds' => max(0, $resetAt - $now),
            'status' => $limited ? 429 : 200,
            'isLimited' => $limited,
        ];
    }
}

if (!function_exists('muginPublicSearchBuildOpenAiRequestSpec')) {
    /**
     * @param array<string,mixed> $request
     * @param string $domain
     * @return array{url:string,options:array<string,mixed>}
     */
    function muginPublicSearchBuildOpenAiRequestSpec(array $request, string $domain = ''): array
    {
        if (function_exists('muginIsLlmConfigured')) {
            if (!muginIsLlmConfigured($domain)) {
                throw new RuntimeException('LLM provider is not configured', 500);
            }
        } else {
            $apiKey = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : '';
            $apiUrl = defined('OPENAI_API_URL') ? OPENAI_API_URL : '';
            if ($apiKey === '' || $apiUrl === '') {
                throw new RuntimeException('OpenAI configuration is missing', 500);
            }
        }

        $apiUrl = function_exists('muginGetOpenAIApiUrl')
            ? muginGetOpenAIApiUrl($domain)
            : (defined('OPENAI_API_URL') ? OPENAI_API_URL : '');
        $headers = function_exists('muginBuildLlmHttpHeaders')
            ? muginBuildLlmHttpHeaders($domain)
            : [
                'Content-Type: application/json',
                'Authorization: Bearer ' . (defined('OPENAI_API_KEY') ? OPENAI_API_KEY : ''),
            ];
        $normalizedRequest = function_exists('muginNormalizeLlmRequestPayload')
            ? muginNormalizeLlmRequestPayload($request)
            : $request;

        return [
            'url' => $apiUrl,
            'options' => [
                'method' => 'POST',
                'timeout' => 60,
                'headers' => $headers,
                'body' => muginPublicSearchSafeJsonEncode($normalizedRequest),
                'user_agent' => 'MuginScholar/1.0',
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchParseOpenAiHttpResult')) {
    /**
     * @param array<string,mixed> $result
     * @return array<string,mixed>
     */
    function muginPublicSearchParseOpenAiHttpResult(array $result): array
    {
        $provider = function_exists('muginGetLlmProvider') ? muginGetLlmProvider() : 'openai';
        $label = $provider === 'requesty' ? 'Requesty' : 'OpenAI';
        if (!$result['ok']) {
            throw new RuntimeException($label . ' request failed: ' . (string) $result['error'], 502);
        }
        $status = (int) ($result['status'] ?? 0);
        if ($status < 200 || $status >= 300) {
            $body = trim((string) ($result['body'] ?? ''));
            $detail = '';
            if ($body !== '') {
                $decodedError = json_decode($body, true);
                if (is_array($decodedError)) {
                    $message = $decodedError['error']['message']
                        ?? $decodedError['error']
                        ?? $decodedError['message']
                        ?? null;
                    if (is_array($message)) {
                        $message = $message['message'] ?? json_encode($message, JSON_UNESCAPED_UNICODE);
                    }
                    if (is_string($message) && trim($message) !== '') {
                        $detail = trim($message);
                    }
                }
                if ($detail === '') {
                    $detail = substr(preg_replace('/\s+/', ' ', $body) ?? $body, 0, 300);
                }
            }
            $suffix = $detail !== '' ? ': ' . $detail : '';
            throw new RuntimeException($label . ' returned HTTP ' . $status . $suffix, 502);
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Invalid ' . $label . ' response', 502);
        }
        return $decoded;
    }
}

if (!function_exists('muginPublicSearchOpenAiRequest')) {
    /**
     * @param array<string,mixed> $request
     * @param string $domain
     * @return array<string,mixed>
     */
    function muginPublicSearchOpenAiRequest(array $request, string $domain = ''): array
    {
        $spec = muginPublicSearchBuildOpenAiRequestSpec($request, $domain);
        return muginPublicSearchParseOpenAiHttpResult(
            muginHttpRequest($spec['url'], $spec['options'])
        );
    }
}

if (!function_exists('muginPublicSearchExtractOpenAiText')) {
    /**
     * @param array<string,mixed> $responsePayload
     * @return string
     */
    function muginPublicSearchExtractOpenAiText(array $responsePayload): string
    {
        if (isset($responsePayload['output_text']) && is_string($responsePayload['output_text'])) {
            $direct = trim($responsePayload['output_text']);
            if ($direct !== '') {
                return $direct;
            }
        }
        $parts = [];
        $outputs = isset($responsePayload['output']) && is_array($responsePayload['output'])
            ? $responsePayload['output']
            : [];
        foreach ($outputs as $output) {
            if (!is_array($output)) {
                continue;
            }
            // Prefer assistant message items; skip reasoning-only rows.
            $outputType = strtolower(trim((string) ($output['type'] ?? '')));
            if (in_array($outputType, ['reasoning', 'summary'], true)) {
                continue;
            }
            $contentItems = isset($output['content']) && is_array($output['content']) ? $output['content'] : [];
            foreach ($contentItems as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $itemType = strtolower(trim((string) ($item['type'] ?? '')));
                if (in_array($itemType, ['reasoning', 'summary_text'], true)) {
                    continue;
                }
                $text = $item['text'] ?? ($item['content'] ?? '');
                if (is_array($text)) {
                    $text = $text['value'] ?? ($text['text'] ?? '');
                }
                if (is_string($text) && trim($text) !== '') {
                    $parts[] = trim($text);
                }
            }
        }
        return trim(implode("\n", $parts));
    }
}

if (!function_exists('muginPublicSearchIsOpenAiResponseIncomplete')) {
    /**
     * @param array<string,mixed> $responsePayload
     */
    function muginPublicSearchIsOpenAiResponseIncomplete(array $responsePayload): bool
    {
        $status = strtolower(trim((string) ($responsePayload['status'] ?? '')));
        if ($status === 'incomplete') {
            return true;
        }
        $reason = strtolower(trim((string) (
            $responsePayload['incomplete_details']['reason']
            ?? ''
        )));
        return $reason === 'max_output_tokens';
    }
}

if (!function_exists('muginPublicSearchGetPubMedPromptText')) {
    /**
     * @param string $language
     * @return string
     */
    function muginPublicSearchGetPubMedPromptText(string $language): string
    {
        // Kept byte-identical to searchTranslationPrompt.prompt in
        // src/assets/prompts/translation.js (the prompt the website widget
        // actually sends to TranslateTitle.php), so both entry points produce
        // the same PubMed query for the same input. If you edit one, edit both.
        if ($language === 'da' || $language === 'auto') {
            return 'Du er en informationsspecialist, der så vidt muligt oversætter alle input til en korrekt PubMed-søgestreng. Ud fra det input, du modtager, skal du finde de mest relevante sundhedsvidenskabelige engelske termer, inkl. ofte anvendte synonymer og stavemåder, som kan bruges til at udforme en præcis PubMed-søgning, der giver de mest relevante resultater. Du gør dig umage med at finde termer, som passer til inputtet, også selvom inputtet ikke er helt korrekt eller præcist. Hvis inputtet er JSON med `originalQuery` og `structuredAiIntent`, skal `originalQuery` behandles som brugerens autoritative søgning, mens `structuredAiIntent` kun bruges som ekstra kontekst til at forstå centrale begreber, oversættelser, intent type og autoritative filtre. For JSON-input gælder reglen om allerede formaterede PubMed-søgninger kun for `originalQuery`; returnér aldrig den rå JSON. Du må ikke udvide søgningen med nye emner, der ikke er understøttet af `originalQuery` eller den strukturerede intent. '
                . 'Strenge regler (skal overholdes): '
                . '0. Hvis inputtet allerede er i PubMed-søgestrengsformat, dvs. at det allerede indeholder et søgetag (ethvert søgetag er tilladt, dvs. også andre end [ti], [tiab], [mh] og [au]), eller der er brugt AND, OR eller NOT, skal du kun ændre det, hvis det er nødvendigt, og så returnere det uændrede inputtet.'
                . '1. Brug kun følgende search field tags: [ti], [tiab], [mh], [sh], [sb], [la], [dp], [ad], [ta], [nm] og [au]. Ingen andre tags er tilladt. '
                . '2. MeSH-validering (ufravigelig): Du må KUN bruge en MeSH-term med [mh], hvis du entydigt kan bekræfte, at den eksisterer som officiel Descriptor Name i NLM’s Medical Subject Headings (MeSH)-thesaurus (https://meshb.nlm.nih.gov). '
                . '- Brug aldrig en opfundet eller ikke-eksisterende MeSH. '
                . '- Brug aldrig en Entry Term eller en Supplementary Concept Record (SCR) direkte med [mh]. Hvis input matcher en Entry Term, skal du først mappe den til den officielle Descriptor Name; kun denne må tagges med [mh]. Hvis der kun findes en SCR, må du ikke bruge [mh] for den — brug i stedet [tiab]. '
                . '- Hvis du er det mindste i tvivl, så undlad [mh], og brug kun [tiab]/[ti]. '
                . '3. Når en gyldig MeSH-term findes, skal du altid kombinere den med relevante fritekstsynonymer i [tiab] (og evt. centrale ord i [ti]) med OR inde i samme konceptblok. Husk, at MeSH-termer altid skrives med stort begyndelsesbogstav, men brug aldrig store bogstaver i  [ti], [tiab] og [sb]. '
                . '4. Brug kun de boolske operatorer OR og AND, aldrig NOT. '
                . '4b. Brug ALDRIG wildcards (*) inden i citationstegn — PubMed ignorerer wildcards i citerede fraser. Dvs. "carbohydrate count*"[tiab] er FORKERT, mens carbohydrate count*[tiab] er KORREKT. '
                . '5. Brug kun anførselstegn, når de er nødvendige for at fastholde en meningsbærende frase; ellers undlades anførselstegn for at udnytte PubMed’s automatic term mapping. '
                . '6. Brug gerne parenteser, og placer dem korrekt, så strengen altid er syntaktisk gyldig. '
                . '7. Hvis input er et DOI, returnér udelukkende "DOI"[aid], fx "10.1080/10408398.2018.1430019"[aid]. '
                . 'Hvis input er et PMID, returnér udelukkende XXXXXXXX[pmid], fx 25998293[pmid]. '
                . '8. Hvis inputtet er et sprog, så anfør det med [la]. '
                . '9. Hvis input er formuleret som et spørgsmål, identificér de centrale begreber og byg søgningen ud fra disse. '
                . '10. Hvis inputtet er en author name, skal du kun bruge [au] og returnere det i PubMed-søgestrengsformat. '
                . '12. Vær opmærksom på typiske danske stave-/lydfejl og map til korrekte engelske termer (inkl. britiske/amerikanske stavemåder). '
                . '13. Du skal kun svare med den endelige PubMed-søgestreng, som kan indsættes direkte i PubMed—intet andet. '
                . '14. Du skal altid returnere en PubMed-søgestreng. Hvis inputtet er usædvanligt, uvidenskabeligt eller vagt, så byg alligevel den bedst mulige streng ud fra de centrale ord med [tiab] (og [ti] hvis relevant). Returnér aldrig forklaringer, undskyldninger eller fejlbeskeder. '
                . 'Kvalitetskontrol før output: '
                . 'Inden du returnerer strengen, skal du meget grundigt tjekke, at den er korrekt formatteret, at alle parenteser/anførselstegn er balancerede, og at alle eventuelle [mh]-termer faktisk eksisterer i MeSH-databasen (ellers må de ikke medtages). '
                . 'Opgave: '
                . 'Her er inputtet, som du skal oversætte til en PubMed-søgestreng: ';
        }
        return 'You are a translator who translates a given input into a correct PubMed search string. Based on the input you receive, you must identify the most relevant health science English terms, including commonly used synonyms and spellings, which can be used to create a correct PubMed search that yields the most relevant results matching the input. The terms you choose to use in the PubMed search string must be terms frequently used in titles or abstracts in health science literature, making them suitable for use in a PubMed search. If the input is JSON with `originalQuery` and `structuredAiIntent`, treat `originalQuery` as the authoritative user search and use `structuredAiIntent` only as additional context for core concepts, translations, intent type, and authoritative filters. For JSON input, the already-formatted PubMed query rule applies only to `originalQuery`; never return the raw JSON. Do not broaden the search with topics that are not supported by `originalQuery` or the structured intent. If the input is phrased as a question, you must identify the most central terms in the question and then use these terms to construct the PubMed search string. You must never use search field tags such as [ti], [tiab], and [mh]. If you use MeSH terms, you must always first use your knowledge to check whether the particular MeSH term actually exists, i.e., whether it is published in NLM\'s The Medical Subject Headings (MeSH) thesaurus (https://meshb.nlm.nih.gov). It is forbidden for you to use MeSH terms that do not exist in NLM\'s The Medical Subject Headings (MeSH) thesaurus. If the input is a DOI, always return an output formatted like this: "DOI"[aid], e.g., "10.1080/10408398.2018.1430019"[aid]. Use only the Boolean operators OR and AND, but never NOT. Use quotation marks only when they are essential for the correct understanding of the concept by PubMed\'s automatic term mapping; otherwise, avoid using quotation marks. Feel free to use parentheses, but place them correctly to always create a correct and usable PubMed search string. You must respond with a PubMed search string that can be immediately inserted as a search in PubMed, and nothing else. Be aware of common spelling mistakes that a layperson might make when you need to understand what is meant - i.e. you must particularly be able to interpret when the input phonetically resembles a correct and relevant English word. If you do not know how to translate the input, or something goes wrong, you must still return a usable PubMed search string built from the central terms; never an error message or apology. '
            . 'You will be penalized severely if you do not follow the instructions you have received. '
            . 'Here is the input you must translate into a PubMed search string: ';
    }
}

if (!function_exists('muginPublicSearchGetSemanticPromptText')) {
    /**
     * @param string $language
     * @return string
     */
    function muginPublicSearchGetSemanticPromptText(string $language): string
    {
        // Kept byte-identical to semanticScholarSearchPrompt.prompt in
        // src/assets/prompts/translation.js (the website widget's own
        // plain-text semantic fallback prompt). Note the widget's PRIMARY
        // semantic path uses the richer, structured semanticIntentPrompt
        // instead (see muginPublicSearchExtractSemanticIntent()) - this text is
        // the fallback used when that structured extraction is unavailable.
        if ($language === 'da' || $language === 'auto') {
            return 'Du er en informationsspecialist. Oversæt brugerens input til en kort, præcis engelsk søgesætning, der er egnet som plain-text query i Semantic Scholar. '
                . 'Strenge regler (skal overholdes): '
                . '1. Returnér kun engelsk tekst. '
                . '2. Brug aldrig PubMed-tags som [ti], [tiab], [mh] eller lignende. '
                . '3. Brug aldrig boolske operatorer (AND, OR, NOT), parenteser eller citationstegn, medmindre det er absolut nødvendigt i almindeligt engelsk. '
                . '4. Hold output kort og fokuseret på de vigtigste fagtermer. '
                . '5. Hvis input allerede er på godt engelsk, kan du returnere det i let normaliseret form. '
                . '6. Hvis noget går galt, returnér inputtet så neutralt som muligt på engelsk. '
                . 'Her er inputtet, som du skal omskrive til en engelsk plain-text søgesætning: ';
        }
        return 'You are an information specialist. Rewrite the user input into a short, precise English plain-text search query suitable for Semantic Scholar. '
            . 'Strict rules: '
            . '1. Return only English text. '
            . '2. Never use PubMed field tags like [ti], [tiab], [mh], etc. '
            . '3. Do not use Boolean operators (AND, OR, NOT), parentheses, or query syntax unless absolutely necessary in normal English. '
            . '4. Keep output short and focused on the core scientific terms. '
            . '5. If the input is already good English, return a lightly normalized version. '
            . '6. If something fails, return a neutral English version of the input. '
            . 'Here is the input you must rewrite as an English plain-text search query: ';
    }
}

if (!function_exists('muginPublicSearchGetSemanticIntentResponseSchema')) {
    /**
     * Ported 1:1 from semanticIntentResponseSchema in
     * src/assets/prompts/translation.js. Kept as a literal structural mirror
     * (not simplified) so the OpenAI structured-output contract matches
     * exactly what the website widget already relies on.
     *
     * @return array<string,mixed>
     */
    function muginPublicSearchGetSemanticIntentResponseSchema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['semanticIntent', 'softFilterHints', 'sourceSpecificHints', 'sourceQueryPlan', 'meta'],
            'properties' => [
                'semanticIntent' => ['type' => 'string'],
                'meta' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => [
                        'detectedConcepts', 'intentType', 'userLanguageDetected', 'confidenceScore',
                        'conceptCoverage', 'potentialIssues', 'userFriendlyParaphrase', 'refinementSuggestions',
                    ],
                    'properties' => [
                        'detectedConcepts' => ['type' => 'array', 'items' => ['type' => 'string']],
                        'intentType' => [
                            'type' => 'string',
                            'enum' => ['guideline', 'treatment', 'diagnosis', 'prognosis', 'etiology', 'overview', 'other'],
                        ],
                        'userLanguageDetected' => ['type' => 'string', 'enum' => ['da', 'en', 'mixed', 'other']],
                        'confidenceScore' => ['type' => 'number'],
                        'conceptCoverage' => [
                            'type' => 'object',
                            'additionalProperties' => false,
                            'required' => ['originalConcepts', 'translatedConcepts', 'droppedConcepts', 'severityOfDrop'],
                            'properties' => [
                                'originalConcepts' => ['type' => 'array', 'items' => ['type' => 'string']],
                                'translatedConcepts' => ['type' => 'array', 'items' => ['type' => 'string']],
                                'droppedConcepts' => ['type' => 'array', 'items' => ['type' => 'string']],
                                'severityOfDrop' => ['type' => 'string', 'enum' => ['none', 'low', 'medium', 'high']],
                            ],
                        ],
                        'potentialIssues' => ['type' => 'array', 'items' => ['type' => 'string']],
                        'userFriendlyParaphrase' => ['type' => 'string'],
                        'refinementSuggestions' => ['type' => 'array', 'items' => ['type' => 'string'], 'maxItems' => 3],
                    ],
                ],
                'softFilterHints' => ['type' => 'array', 'items' => ['type' => 'string']],
                'sourceSpecificHints' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => ['semanticScholar', 'openAlex', 'elicit'],
                    'properties' => [
                        'semanticScholar' => ['type' => 'array', 'items' => ['type' => 'string']],
                        'openAlex' => ['type' => 'array', 'items' => ['type' => 'string']],
                        'elicit' => ['type' => 'array', 'items' => ['type' => 'string']],
                    ],
                ],
                'sourceQueryPlan' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => ['semanticScholar', 'openAlex', 'elicit', 'coreQuery', 'adaptations'],
                    'properties' => [
                        'coreQuery' => ['type' => 'string'],
                        'adaptations' => [
                            'type' => 'object',
                            'additionalProperties' => false,
                            'required' => ['semanticScholar', 'openAlex', 'elicit'],
                            'properties' => [
                                'semanticScholar' => ['type' => 'object', 'additionalProperties' => false, 'required' => ['queryOverride'], 'properties' => ['queryOverride' => ['type' => ['string', 'null']]]],
                                'openAlex' => ['type' => 'object', 'additionalProperties' => false, 'required' => ['queryOverride'], 'properties' => ['queryOverride' => ['type' => ['string', 'null']]]],
                                'elicit' => ['type' => 'object', 'additionalProperties' => false, 'required' => ['queryOverride'], 'properties' => ['queryOverride' => ['type' => ['string', 'null']]]],
                            ],
                        ],
                        'semanticScholar' => [
                            'type' => 'object', 'additionalProperties' => false, 'required' => ['query', 'filters'],
                            'properties' => [
                                'query' => ['type' => 'string'],
                                'filters' => [
                                    'type' => 'object', 'additionalProperties' => false,
                                    'required' => ['publicationTypes', 'publicationDateOrYear', 'year'],
                                    'properties' => [
                                        'publicationTypes' => ['type' => 'array', 'items' => ['type' => 'string']],
                                        'publicationDateOrYear' => ['type' => 'string'],
                                        'year' => ['type' => 'string'],
                                    ],
                                ],
                            ],
                        ],
                        'openAlex' => [
                            'type' => 'object', 'additionalProperties' => false, 'required' => ['query', 'filters'],
                            'properties' => [
                                'query' => ['type' => 'string'],
                                'filters' => [
                                    'type' => 'object', 'additionalProperties' => false,
                                    'required' => ['language', 'sourceType', 'workType'],
                                    'properties' => [
                                        'language' => ['type' => 'array', 'items' => ['type' => 'string']],
                                        'sourceType' => ['type' => 'array', 'items' => ['type' => 'string']],
                                        'workType' => ['type' => 'array', 'items' => ['type' => 'string']],
                                    ],
                                ],
                            ],
                        ],
                        'elicit' => [
                            'type' => 'object', 'additionalProperties' => false, 'required' => ['query', 'filters'],
                            'properties' => [
                                'query' => ['type' => 'string'],
                                'filters' => [
                                    'type' => 'object', 'additionalProperties' => false,
                                    'required' => ['typeTags', 'includeKeywords', 'excludeKeywords'],
                                    'properties' => [
                                        'typeTags' => ['type' => 'array', 'items' => ['type' => 'string']],
                                        'includeKeywords' => ['type' => 'array', 'items' => ['type' => 'string']],
                                        'excludeKeywords' => ['type' => 'array', 'items' => ['type' => 'string']],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchGetSemanticIntentPromptText')) {
    /**
     * Kept byte-identical to semanticIntentPrompt.prompt in
     * src/assets/prompts/translation.js.
     *
     * @param string $language
     * @return string
     */
    function muginPublicSearchGetSemanticIntentPromptText(string $language): string
    {
        if ($language === 'da' || $language === 'auto') {
            return 'Du er en informationsspecialist. Du modtager et JSON-input med brugerens fritekst, valgte emner, valgte afgrænsninger, strukturerede semantiske blokke og hårde filtre. Hvis felterne `semanticWordedIntent`, `semanticCoreText` eller `sourceSpecificContext` findes, skal de bruges som den foretrukne engelske opsummering af søgeintentionen. Returnér KUN gyldig JSON med præcis disse topfelter: "semanticIntent", "softFilterHints", "sourceSpecificHints", "sourceQueryPlan", "meta". Regler: 1) "semanticIntent" er en kort engelsk fallback-query uden PubMed-tags og uden boolske operatorer. 2) "softFilterHints" er korte arrays af synonymer eller tematiske signaler. 3) "sourceSpecificHints" er et objekt med nøglerne semanticScholar, openAlex og elicit, hvor hver værdi er et kort array af hints. 4) "sourceQueryPlan" er et objekt med nøglerne semanticScholar, openAlex, elicit, coreQuery og adaptations. De tre database-nøgler indeholder hver et objekt med "query" og "filters" (bagudkompatibelt). 5) De kanoniske hard filters i input er allerede autoritative og må ikke udvides, omskrives eller modsiges i dit svar. 6) "sourceQueryPlan.semanticScholar.query" skal være en kort begrebsnær engelsksproget query. 7) "sourceQueryPlan.semanticScholar.filters" må kun bruge Semantic Scholar API-felterne publicationTypes, publicationDateOrYear og year. 8) "sourceQueryPlan.openAlex.query" skal være en kort konceptuel engelsksproget query egnet til `search.semantic`. 9) "sourceQueryPlan.openAlex.filters" må kun bruge felterne language, sourceType og workType. 10) "sourceQueryPlan.elicit.query" skal være et kort engelsksproget forskningsspørgsmål i naturligt sprog. 11) "sourceQueryPlan.elicit.filters" må kun bruge felterne typeTags, includeKeywords og excludeKeywords. Tilladte typeTags er kun "Review", "Meta-Analysis", "Systematic Review", "RCT" og "Longitudinal". 12) Hvis input er uklart, usædvanligt eller ikke-videnskabeligt, sæt confidenceScore lavt og udfyld potentialIssues; query-felterne (semanticIntent, coreQuery og sourceQueryPlan.*.query) skal stadig indeholde brugerens faktiske kernebegreber oversat til kort engelsk. Skriv aldrig status-, afvisnings- eller meta-sætninger som query. 13) Svar med JSON alene uden markdown, forklaring eller ekstra tekst. 14) "sourceQueryPlan.coreQuery" er den fælles, korte engelske kerne-query som bruges på tværs af kilder når der ikke er en grund til at formulere kilde-specifikt. Hold den under 18 ord, men bevar alle centrale sygdoms-, population-, eksponerings-/interventions- og udfaldsbegreber; hvis noget bevidst udelades, skal det fremgå af meta.conceptCoverage.droppedConcepts. 15) "sourceQueryPlan.adaptations.{semanticScholar|openAlex|elicit}.queryOverride" skal sættes til null når coreQuery kan bruges direkte; angiv kun en alternativ streng hvis den specifikke database kræver en markant anden formulering. 16) "meta" skal altid udfyldes med følgende felter: "detectedConcepts" (array med 1-10 engelske nøglekoncepter udtrukket af inputtet), "intentType" (en af: guideline, treatment, diagnosis, prognosis, etiology, overview, other), "userLanguageDetected" (en af: da, en, mixed, other), "confidenceScore" (tal 0.0-1.0: 1.0 = meget specifikt input med klar intention, 0.5 = normalt, <0.5 = vagt eller tvetydigt), "conceptCoverage" (objekt med originalConcepts, translatedConcepts, droppedConcepts og severityOfDrop none|low|medium|high), "potentialIssues" (array — tom hvis ingen; ellers kort liste over risici som vaghed, manglende emne, konflikt mellem input og filtre), "userFriendlyParaphrase" (1 sætning på dansk hvis userLanguageDetected="da"; ellers på engelsk. Formuler som "Søgning efter ..." eller "Search for ..."). 17) Hvis inputtet er vagt eller for generelt, sæt confidenceScore lavt og udfyld potentialIssues. 18) "meta.refinementSuggestions" er et array med 0-3 korte, konkrete forslag til hvordan brugeren kan præcisere søgningen, når confidenceScore < 0.6. Skriv forslagene på samme sprog som userFriendlyParaphrase (dansk ved userLanguageDetected="da", ellers engelsk). Hvert forslag skal være handlingsorienteret og specifikt (fx "Tilføj en aldersgruppe (voksne eller børn)" frem for "Input er vagt"). Returnér tomt array hvis confidenceScore >= 0.6. Her er input-JSON:';
        }
        return 'You are an information specialist. You receive a JSON input with user free text, selected topics, selected limits, structured semantic blocks, and hard filters. If the fields `semanticWordedIntent`, `semanticCoreText`, or `sourceSpecificContext` are present, use them as the preferred English summary of the search intent. Return ONLY valid JSON with exactly these top-level fields: "semanticIntent", "softFilterHints", "sourceSpecificHints", "sourceQueryPlan", "meta". Rules: 1) "semanticIntent" is a short English fallback query without PubMed tags and without Boolean operators. 2) "softFilterHints" contains short arrays of synonyms or thematic signals. 3) "sourceSpecificHints" is an object with keys semanticScholar, openAlex, and elicit, where each value is a short hint array. 4) "sourceQueryPlan" is an object with keys semanticScholar, openAlex, elicit, coreQuery, and adaptations. The three database keys each contain an object with "query" and "filters" (backwards-compatible). 5) The canonical hard filters in the input are already authoritative and must not be expanded, rewritten, or contradicted in your response. 6) "sourceQueryPlan.semanticScholar.query" must be a short concept-focused English query. 7) "sourceQueryPlan.semanticScholar.filters" may only use the Semantic Scholar API fields publicationTypes, publicationDateOrYear, and year. 8) "sourceQueryPlan.openAlex.query" must be a short conceptual English query suitable for `search.semantic`. 9) "sourceQueryPlan.openAlex.filters" may only use the fields language, sourceType, and workType. 10) "sourceQueryPlan.elicit.query" must be a short English research question in natural language. 11) "sourceQueryPlan.elicit.filters" may only use the fields typeTags, includeKeywords, and excludeKeywords. Allowed typeTags are only "Review", "Meta-Analysis", "Systematic Review", "RCT", and "Longitudinal". 12) If the input is ambiguous, unusual, or non-scientific, set confidenceScore low and populate potentialIssues; query fields (semanticIntent, coreQuery, and sourceQueryPlan.*.query) must still contain the actual core concepts from the user as short English. Never write status, rejection, or meta-commentary sentences as a query. 13) Respond with JSON only, no markdown, no explanation, no extra text. 14) "sourceQueryPlan.coreQuery" is the shared, short English core query used across databases when there is no reason to phrase it differently. Keep it under 18 words, but preserve all central disease, population, exposure/intervention, and outcome concepts; if anything is deliberately omitted, list it in meta.conceptCoverage.droppedConcepts. 15) "sourceQueryPlan.adaptations.{semanticScholar|openAlex|elicit}.queryOverride" must be null when the coreQuery can be used directly; only provide an alternative string when the specific database requires a markedly different phrasing. 16) "meta" must always be populated with: "detectedConcepts" (array of 1-10 English key concepts extracted from the input), "intentType" (one of guideline, treatment, diagnosis, prognosis, etiology, overview, other), "userLanguageDetected" (one of da, en, mixed, other), "confidenceScore" (number 0.0-1.0 where 1.0 = very specific input with clear intention, 0.5 = normal, <0.5 = vague or ambiguous), "conceptCoverage" (object with originalConcepts, translatedConcepts, droppedConcepts and severityOfDrop none|low|medium|high), "potentialIssues" (array — empty if none; otherwise short list of risks like vagueness, missing topic, conflict between input and filters), "userFriendlyParaphrase" (one sentence in Danish if userLanguageDetected="da"; otherwise in English. Phrase as "Søgning efter ..." or "Search for ..."). 17) If the input is vague or overly broad, set confidenceScore low and populate potentialIssues. 18) "meta.refinementSuggestions" is an array of 0-3 short, concrete suggestions for how the user could refine the search when confidenceScore < 0.6. Write the suggestions in the same language as userFriendlyParaphrase (Danish if userLanguageDetected="da", otherwise English). Each suggestion must be actionable and specific (e.g., "Add an age group (adults or children)" rather than "Input is vague"). Return empty array if confidenceScore >= 0.6. Input JSON:';
    }
}

if (!function_exists('muginPublicSearchExtractIntentCoverageTerms')) {
    /**
     * @return array<int,string>
     */
    function muginPublicSearchExtractIntentCoverageTerms(string $rawInput): array
    {
        $normalized = strtolower(trim($rawInput));
        if ($normalized === '') {
            return [];
        }
        // Function words must not fail English intent coverage: Danish "eller"/"til"
        // never appear in coreQuery and previously forced a retry that often left
        // semantic intent null (fallback), breaking PubMed translation context.
        $stopwords = [
            'og', 'eller', 'til', 'med', 'den', 'det', 'de', 'en', 'et', 'er', 'på', 'af',
            'for', 'som', 'der', 'har', 'ikke', 'fra', 'om', 'ved', 'kan', 'vil', 'skal',
            'hvad', 'hvordan', 'hvor', 'når', 'hvilken', 'hvilket', 'hvilke', 'men', 'hvis',
            'kun', 'også', 'mere', 'mest', 'and', 'or', 'the', 'a', 'an', 'to', 'of', 'in',
            'on', 'for', 'with', 'from', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'what',
            'how', 'when', 'which', 'that', 'this', 'these', 'those', 'best',
        ];
        $stopwordMap = array_fill_keys($stopwords, true);
        preg_match_all('/[a-z0-9æøåäöü]+/u', $normalized, $matches);
        $terms = [];
        foreach ((array) ($matches[0] ?? []) as $term) {
            $term = trim((string) $term);
            if (strlen($term) < 3 || isset($stopwordMap[$term])) {
                continue;
            }
            $terms[$term] = true;
        }
        return array_keys($terms);
    }
}

if (!function_exists('muginPublicSearchBuildSemanticIntentCoverageText')) {
    /**
     * @param array<string,mixed> $intent
     */
    function muginPublicSearchBuildSemanticIntentCoverageText(array $intent): string
    {
        $chunks = [
            (string) ($intent['semanticIntent'] ?? ''),
            (string) ($intent['coreQuery'] ?? ''),
        ];
        $meta = isset($intent['meta']) && is_array($intent['meta']) ? $intent['meta'] : [];
        foreach ((array) ($meta['detectedConcepts'] ?? []) as $concept) {
            $chunks[] = (string) $concept;
        }
        $coverage = isset($meta['conceptCoverage']) && is_array($meta['conceptCoverage'])
            ? $meta['conceptCoverage']
            : [];
        foreach (['originalConcepts', 'translatedConcepts'] as $field) {
            foreach ((array) ($coverage[$field] ?? []) as $concept) {
                $chunks[] = (string) $concept;
            }
        }
        $plan = isset($intent['sourceQueryPlan']) && is_array($intent['sourceQueryPlan'])
            ? $intent['sourceQueryPlan']
            : [];
        $chunks[] = (string) ($plan['coreQuery'] ?? '');
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $source) {
            if (isset($plan[$source]) && is_array($plan[$source])) {
                $chunks[] = (string) ($plan[$source]['query'] ?? '');
            }
        }
        return strtolower(implode(' ', $chunks));
    }
}

if (!function_exists('muginPublicSearchAssessSemanticIntentCoverage')) {
    /**
     * @param ?array<string,mixed> $intent
     * @param array<string,mixed> $payload
     * @return array{ok:bool,missingTerms:array<int,string>}
     */
    function muginPublicSearchAssessSemanticIntentCoverage(?array $intent, array $payload): array
    {
        if ($intent === null) {
            return ['ok' => true, 'missingTerms' => []];
        }
        $rawInput = trim((string) ($payload['rawUserInput'] ?? ($payload['freeTextInput'] ?? ($payload['originalQuery'] ?? ''))));
        $inputTerms = muginPublicSearchExtractIntentCoverageTerms($rawInput);
        if (empty($inputTerms)) {
            return ['ok' => true, 'missingTerms' => []];
        }
        $coverageText = muginPublicSearchBuildSemanticIntentCoverageText($intent);
        $missing = [];
        foreach ($inputTerms as $term) {
            if (strpos($coverageText, $term) === false) {
                $missing[] = $term;
            }
        }
        return ['ok' => empty($missing), 'missingTerms' => $missing];
    }
}

if (!function_exists('muginPublicSearchLowerSemanticIntentConfidenceForCoverage')) {
    /**
     * @param array<string,mixed> $intent
     * @param array{ok?:bool,missingTerms?:array<int,string>} $coverageCheck
     * @return array<string,mixed>
     */
    function muginPublicSearchLowerSemanticIntentConfidenceForCoverage(array $intent, array $coverageCheck): array
    {
        if (($coverageCheck['ok'] ?? true) !== false) {
            return $intent;
        }
        $meta = isset($intent['meta']) && is_array($intent['meta']) ? $intent['meta'] : [];
        $coverage = isset($meta['conceptCoverage']) && is_array($meta['conceptCoverage'])
            ? $meta['conceptCoverage']
            : [];
        $missingTerms = muginPublicSearchNormalizeSimpleList($coverageCheck['missingTerms'] ?? []);
        $dropped = muginPublicSearchDedupeStrings(array_merge(
            muginPublicSearchNormalizeSimpleList($coverage['droppedConcepts'] ?? []),
            $missingTerms
        ));
        $confidence = isset($meta['confidenceScore']) && is_numeric($meta['confidenceScore'])
            ? min((float) $meta['confidenceScore'], 0.55)
            : 0.55;
        $severity = trim((string) ($coverage['severityOfDrop'] ?? ''));
        if ($severity === '' || $severity === 'none') {
            $severity = 'medium';
        }
        $issues = muginPublicSearchDedupeStrings(array_merge(
            muginPublicSearchNormalizeSimpleList($meta['potentialIssues'] ?? []),
            ['Possible missing coverage of central input terms: ' . implode(', ', $missingTerms)]
        ));
        $meta['confidenceScore'] = $confidence;
        $meta['conceptCoverage'] = array_merge($coverage, [
            'droppedConcepts' => $dropped,
            'severityOfDrop' => $severity,
        ]);
        $meta['potentialIssues'] = $issues;
        $intent['meta'] = $meta;
        return $intent;
    }
}

if (!function_exists('muginPublicSearchExtractSemanticIntent')) {
    /**
     * PHP port of the website widget's PRIMARY semantic-intent extraction
     * (semanticIntentPrompt in src/assets/prompts/translation.js), previously
     * missing entirely from the public API path (which only had the much
     * weaker plain-text fallback prompt, muginPublicSearchTranslateSemanticQuery).
     *
     * Only used by the unified engine (muginPublicSearchIsUnifiedSearchEngineEnabled()),
     * and only to recover queryIntent signals (detected concepts / soft filter
     * hints) for the rerank engine's topicOverlapBonus - it deliberately does
     * NOT (yet) feed sourceQueryPlan, to avoid overlapping with the separate,
     * already-tested deterministic muginPublicSearchBuildSourceQueryPlan() path.
     * Fails soft (intent=null) on any error, or when the returned intent does
     * not cover the raw input's key terms after one retry, so a flaky/slow/
     * lossy LLM call never breaks a search - queryIntent is an enrichment
     * signal, not a hard dependency.
     *
     * @param string $rawText
     * @param string $language
     * @param string $domain
     * @param array<string,mixed> $intentPayload Optional intentContext (rawUserInput/contextualSearchInput/semanticBlocks/selectedTopicIds/selectedLimitIds).
     * @return array{intent:?array<string,mixed>,meta:array<string,mixed>}
     */
    function muginPublicSearchExtractSemanticIntent(
        string $rawText,
        string $language,
        string $domain = '',
        array $intentPayload = []
    ): array {
        $normalizedText = trim($rawText);
        $promptVersion = 'phase2-v3';
        $emptyMeta = [
            'promptVersion' => $promptVersion,
            'cacheHit' => false,
            'fallbackUsed' => false,
            'parseAttempts' => 0,
            'coverageCheck' => ['ok' => true, 'missingTerms' => []],
        ];
        if ($normalizedText === '') {
            return ['intent' => null, 'meta' => $emptyMeta];
        }

        $payload = [
            'originalQuery' => $normalizedText,
            'rawUserInput' => trim((string) ($intentPayload['rawUserInput'] ?? $normalizedText)),
            'contextualSearchInput' => trim((string) ($intentPayload['contextualSearchInput'] ?? '')),
            'semanticBlocks' => muginPublicSearchNormalizeSimpleList($intentPayload['semanticBlocks'] ?? []),
            'selectedTopics' => muginPublicSearchNormalizeSimpleList(
                $intentPayload['selectedTopics'] ?? ($intentPayload['selectedTopicIds'] ?? [])
            ),
            'selectedLimits' => muginPublicSearchNormalizeSimpleList(
                $intentPayload['selectedLimits'] ?? ($intentPayload['selectedLimitIds'] ?? [])
            ),
        ];

        $parsedIntent = null;
        $coverageCheck = ['ok' => true, 'missingTerms' => []];
        $parseAttempts = 0;
        $maxParseAttempts = 2;
        while ($parseAttempts < $maxParseAttempts && $parsedIntent === null) {
            $parseAttempts++;
            $taskSettings = function_exists('muginGetOpenAiTaskSettings')
                ? muginGetOpenAiTaskSettings('semanticIntent')
                : ['model' => '', 'reasoningEffort' => 'none', 'verbosity' => 'low'];
            $requestPayload = [
                'model' => (string) ($taskSettings['model'] ?? ''),
                'input' => [
                    [
                        'role' => 'user',
                        'content' => muginPublicSearchGetSemanticIntentPromptText($language)
                            . muginPublicSearchSafeJsonEncode($payload),
                    ],
                ],
                'reasoning' => ['effort' => (string) ($taskSettings['reasoningEffort'] ?? 'none')],
                'text' => [
                    'verbosity' => (string) ($taskSettings['verbosity'] ?? 'low'),
                    'format' => [
                        'type' => 'json_schema',
                        'name' => 'semantic_intent_response',
                        'strict' => true,
                        'schema' => muginPublicSearchGetSemanticIntentResponseSchema(),
                    ],
                ],
                // Requesty/Azure gpt-5.6 often hits max_output_tokens at 1024 for
                // strict JSON schema intents; incomplete JSON then nulls the intent.
                'max_output_tokens' => 2048,
            ];
            try {
                $response = muginPublicSearchOpenAiRequest($requestPayload, $domain);
                $text = muginPublicSearchExtractOpenAiText($response);
                if (
                    $text === ''
                    || (
                        muginPublicSearchIsOpenAiResponseIncomplete($response)
                        && substr(ltrim($text), 0, 1) !== '{'
                    )
                ) {
                    continue;
                }
                $parsed = json_decode($text, true);
                if (!is_array($parsed)) {
                    continue;
                }
                $coverageCheck = muginPublicSearchAssessSemanticIntentCoverage($parsed, $payload);
                if (($coverageCheck['ok'] ?? true) !== true && $parseAttempts < $maxParseAttempts) {
                    $payload['coverageReview'] = [
                        'missingRawInputTerms' => $coverageCheck['missingTerms'],
                        'instruction' => 'Regenerate the intent and explicitly preserve or account for these raw input terms in meta.conceptCoverage, detectedConcepts, semanticIntent, or sourceQueryPlan.coreQuery.',
                    ];
                    continue;
                }
                $parsedIntent = muginPublicSearchLowerSemanticIntentConfidenceForCoverage($parsed, $coverageCheck);
            } catch (Throwable $exception) {
                $parsedIntent = null;
            }
        }

        return [
            'intent' => $parsedIntent,
            'meta' => [
                'promptVersion' => $promptVersion,
                'cacheHit' => false,
                'fallbackUsed' => $parsedIntent === null,
                'parseAttempts' => $parseAttempts,
                'coverageCheck' => $coverageCheck,
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchBuildQueryIntentFromSemanticIntent')) {
    /**
     * Projects the structured semantic-intent response onto the queryIntent
     * shape muginSemanticQualityBuildIntentTokenSet() (semantic-quality-lib.php)
     * reads: topicsEnglish, topicIntents, softHints, rawPhrases.
     *
     * @param ?array<string,mixed> $semanticIntent
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildQueryIntentFromSemanticIntent(?array $semanticIntent): array
    {
        if ($semanticIntent === null) {
            return [];
        }
        $meta = isset($semanticIntent['meta']) && is_array($semanticIntent['meta']) ? $semanticIntent['meta'] : [];
        return [
            'topicsEnglish' => muginPublicSearchNormalizeSimpleList($meta['detectedConcepts'] ?? []),
            'softHints' => muginPublicSearchNormalizeSimpleList($semanticIntent['softFilterHints'] ?? []),
        ];
    }
}

if (!function_exists('muginPublicSearchValidateMeshTerm')) {
    /**
     * Ported from validateMeshTerm() in src/utils/meshValidator.js. Validates
     * one term against NLM's MeSH database (db=mesh ESearch). Fails soft
     * (valid=true, uid=null) on any NLM error, exactly like the JS version,
     * so a flaky NLM call never blocks a search.
     *
     * @param string $term
     * @param string $domain
     * @return array{valid:bool,uid:?string}
     */
    function muginPublicSearchValidateMeshTerm(string $term, string $domain = ''): array
    {
        $normalizedTerm = trim($term);
        if ($normalizedTerm === '') {
            return ['valid' => true, 'uid' => null];
        }
        try {
            $payload = muginPublicSearchNlmGetJson('esearch.fcgi', [
                'db' => 'mesh',
                'term' => '"' . $normalizedTerm . '"[MeSH Terms]',
                'retmode' => 'json',
                'retmax' => '1',
            ], $domain);
            $esearch = isset($payload['esearchresult']) && is_array($payload['esearchresult']) ? $payload['esearchresult'] : [];
            $count = (int) ($esearch['count'] ?? 0);
            $uid = isset($esearch['idlist'][0]) ? (string) $esearch['idlist'][0] : null;
            return ['valid' => $count > 0, 'uid' => $uid];
        } catch (Throwable $exception) {
            return ['valid' => true, 'uid' => null];
        }
    }
}

if (!function_exists('muginPublicSearchFetchMeshDetails')) {
    /**
     * Ported from fetchMeshDetails() in meshValidator.js (ESummary db=mesh).
     * Only extracts the 'name' field (canonical descriptor), since that is
     * all muginPublicSearchCanonicalizeAllMeshTermsWithNlm() needs; the richer
     * scope-note/related-term context is part of the deliberately-deferred
     * AI-optimization loop (see this file's Section 2B header comment).
     *
     * @param array<int,string> $uids
     * @param string $domain
     * @return array<string,string> Map of uid -> canonical descriptor name.
     */
    function muginPublicSearchFetchMeshDetails(array $uids, string $domain = ''): array
    {
        $uids = array_values(array_filter(array_unique($uids)));
        if (empty($uids)) {
            return [];
        }
        try {
            $payload = muginPublicSearchNlmGetJson('esummary.fcgi', [
                'db' => 'mesh',
                'id' => implode(',', $uids),
                'retmode' => 'json',
            ], $domain);
            $result = isset($payload['result']) && is_array($payload['result']) ? $payload['result'] : [];
            $names = [];
            foreach ((array) ($result['uids'] ?? []) as $uid) {
                $record = isset($result[$uid]) && is_array($result[$uid]) ? $result[$uid] : null;
                if ($record === null) {
                    continue;
                }
                $meshTerms = isset($record['ds_meshterms']) && is_array($record['ds_meshterms']) ? $record['ds_meshterms'] : [];
                if (!empty($meshTerms) && is_string($meshTerms[0]) && trim($meshTerms[0]) !== '') {
                    $names[(string) $uid] = trim($meshTerms[0]);
                }
            }
            return $names;
        } catch (Throwable $exception) {
            return [];
        }
    }
}

if (!function_exists('muginPublicSearchExtractEnglishConcepts')) {
    /**
     * Extract English concept terms from PubMed fielded clauses ([mh]/[tiab]/[ti]),
     * matching src/utils/meshValidator.js extractEnglishConcepts().
     *
     * @return array<int,string>
     */
    function muginPublicSearchExtractEnglishConcepts(string $searchString): array
    {
        if ($searchString === '') {
            return [];
        }
        $concepts = [];
        if (
            !preg_match_all(
                '/(?:"([^"]+)"|([a-zA-Z][a-zA-Z0-9 \-]+?))\[(?:mh|tiab|ti)\]/iu',
                $searchString,
                $matches,
                PREG_SET_ORDER
            )
        ) {
            return [];
        }
        foreach ($matches as $match) {
            $term = trim((string) (($match[1] ?? '') !== '' ? $match[1] : ($match[2] ?? '')));
            if ($term === '') {
                continue;
            }
            $normalized = preg_replace('/\b(?:AND|OR|NOT)\b/i', ' ', $term) ?? $term;
            $normalized = preg_replace('/\s+/u', ' ', trim($normalized)) ?? trim($normalized);
            if ($normalized !== '' && strlen($normalized) > 2) {
                $concepts[strtolower($normalized)] = strtolower($normalized);
            }
        }
        return array_values($concepts);
    }
}

if (!function_exists('muginPublicSearchBuildMeshSearchQuery')) {
    /**
     * Legacy parity: prefer mh/tiab/ti concepts from the AI PubMed string;
     * fall back to raw user input, then a stripped PubMed string.
     */
    function muginPublicSearchBuildMeshSearchQuery(string $searchString, string $fallbackInput = ''): string
    {
        $concepts = muginPublicSearchExtractEnglishConcepts($searchString);
        if (!empty($concepts)) {
            return implode(' ', $concepts);
        }
        $fallback = trim($fallbackInput);
        if ($fallback !== '') {
            return $fallback;
        }
        $value = preg_replace('/\[[^\]]+\]/', ' ', $searchString) ?? $searchString;
        $value = preg_replace('/\b(?:AND|OR|NOT)\b/i', ' ', $value) ?? $value;
        $value = str_replace(['"', "'", '(', ')'], ' ', $value);
        $value = preg_replace('/[^\p{L}\p{N}\s-]+/u', ' ', $value) ?? $value;
        $value = preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
        return strtolower($value);
    }
}

if (!function_exists('muginPublicSearchBuildEmptyMeshReport')) {
    /**
     * Shared "nothing to do" mesh process-details report shape, used both by
     * muginPublicSearchCanonicalizeAllMeshTermsWithNlmDetailed() (no [mh] terms
     * found) and muginPublicSearchTranslatePubMedQuery() (validation skipped
     * entirely, e.g. MUGIN_MESH_VALIDATION_OBSERVE_ONLY).
     *
     * @param string $searchString
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildEmptyMeshReport(string $searchString, bool $observeOnly = false): array
    {
        return [
            'totalMeshTerms' => 0,
            'validCount' => 0,
            'invalidCount' => 0,
            'invalidTerms' => [],
            'renamedTerms' => [],
            'hallucinationRate' => 0.0,
            'meshSearchQuery' => muginPublicSearchBuildMeshSearchQuery($searchString),
            'observeOnly' => $observeOnly,
            'changed' => false,
            'addedConcepts' => [],
            'removedConcepts' => [],
            'addedMeshTerms' => [],
            'removedMeshTerms' => [],
            'finalMeshTermCount' => 0,
        ];
    }
}

if (!function_exists('muginPublicSearchCanonicalizeAllMeshTermsWithNlmDetailed')) {
    /**
     * Detailed variant of muginPublicSearchCanonicalizeAllMeshTermsWithNlm():
     * ported from canonicalizeAllMeshTermsWithNlm() in meshValidator.js
     * (Step 2b) - rewrites valid [mh] terms to NLM's canonical Descriptor
     * Name, and downgrades invalid/hallucinated [mh] terms to [tiab] so an
     * invalid MeSH tag never reaches PubMed - and additionally returns a
     * process-details report describing what changed, for the "mesh"
     * process-details step.
     *
     * @param string $searchString
     * @param string $domain
     * @return array{value:string,report:array<string,mixed>}
     */
    function muginPublicSearchCanonicalizeAllMeshTermsWithNlmDetailed(string $searchString, string $domain = ''): array
    {
        if (trim($searchString) === '') {
            return ['value' => $searchString, 'report' => muginPublicSearchBuildEmptyMeshReport($searchString)];
        }
        $meshTerms = muginSemanticQualityExtractMeshTerms($searchString);
        if (empty($meshTerms)) {
            return ['value' => $searchString, 'report' => muginPublicSearchBuildEmptyMeshReport($searchString)];
        }

        $validationByTermKey = [];
        $seenTermKeys = [];
        foreach ($meshTerms as $entry) {
            $key = strtolower($entry['term']);
            if (isset($seenTermKeys[$key])) {
                continue;
            }
            $seenTermKeys[$key] = true;
            $validationByTermKey[$key] = muginPublicSearchValidateMeshTerm($entry['term'], $domain);
        }

        $uids = [];
        foreach ($validationByTermKey as $validation) {
            if (!empty($validation['uid'])) {
                $uids[] = (string) $validation['uid'];
            }
        }
        $canonicalNames = !empty($uids) ? muginPublicSearchFetchMeshDetails($uids, $domain) : [];

        $result = $searchString;
        $invalidTerms = [];
        $renamedTerms = [];
        foreach ($meshTerms as $entry) {
            $key = strtolower($entry['term']);
            $validation = $validationByTermKey[$key] ?? ['valid' => true, 'uid' => null];
            if (($validation['valid'] ?? false) === true && !empty($validation['uid']) && isset($canonicalNames[(string) $validation['uid']])) {
                $canonical = $canonicalNames[(string) $validation['uid']];
                $replacement = '"' . $canonical . '"[mh]';
                if ($replacement !== $entry['fullMatch']) {
                    $result = str_replace($entry['fullMatch'], $replacement, $result);
                    if (strtolower($canonical) !== $key) {
                        $renamedTerms[] = ['from' => $entry['term'], 'to' => $canonical];
                    }
                }
                continue;
            }
            if (($validation['valid'] ?? true) === false) {
                $replacement = '"' . $entry['term'] . '"[tiab]';
                $result = str_replace($entry['fullMatch'], $replacement, $result);
                $invalidTerms[] = $entry['term'];
            }
        }
        $invalidTerms = array_values(array_unique($invalidTerms));

        // Concept-level and MeSH-tag-level views are identical for this
        // deterministic canonicalization step (it only renames or downgrades
        // existing [mh] terms, never introduces unrelated new concepts).
        $originalTermLabels = [];
        foreach ($meshTerms as $entry) {
            $originalTermLabels[strtolower($entry['term'])] = $entry['term'];
        }
        $finalMeshTerms = muginSemanticQualityExtractMeshTerms($result);
        $finalTermLabels = [];
        foreach ($finalMeshTerms as $entry) {
            $finalTermLabels[strtolower($entry['term'])] = $entry['term'];
        }
        $addedMeshTerms = array_values(array_diff_key($finalTermLabels, $originalTermLabels));
        $removedMeshTerms = array_values(array_diff_key($originalTermLabels, $finalTermLabels));

        $totalMeshTerms = count($seenTermKeys);
        $invalidCount = count($invalidTerms);

        $report = [
            'totalMeshTerms' => $totalMeshTerms,
            'validCount' => max(0, $totalMeshTerms - $invalidCount),
            'invalidCount' => $invalidCount,
            'invalidTerms' => $invalidTerms,
            'renamedTerms' => $renamedTerms,
            'hallucinationRate' => $totalMeshTerms > 0 ? round($invalidCount / $totalMeshTerms, 4) : 0.0,
            'meshSearchQuery' => muginPublicSearchBuildMeshSearchQuery($searchString),
            'observeOnly' => false,
            'changed' => $result !== $searchString,
            'addedConcepts' => $addedMeshTerms,
            'removedConcepts' => $removedMeshTerms,
            'addedMeshTerms' => $addedMeshTerms,
            'removedMeshTerms' => $removedMeshTerms,
            'finalMeshTermCount' => count($finalMeshTerms),
        ];

        return ['value' => $result, 'report' => $report];
    }
}

if (!function_exists('muginPublicSearchCanonicalizeAllMeshTermsWithNlm')) {
    /**
     * Thin string-only wrapper around
     * muginPublicSearchCanonicalizeAllMeshTermsWithNlmDetailed() for callers
     * that only need the rewritten search string.
     *
     * @param string $searchString
     * @param string $domain
     * @return string
     */
    function muginPublicSearchCanonicalizeAllMeshTermsWithNlm(string $searchString, string $domain = ''): string
    {
        return muginPublicSearchCanonicalizeAllMeshTermsWithNlmDetailed($searchString, $domain)['value'];
    }
}

if (!function_exists('muginPublicSearchBuildPubMedTranslationPromptInput')) {
    /**
     * Ported from buildPubMedTranslationPromptInput() in DropdownWrapper.vue
     * (~4702-4771). Feeds the already-extracted semantic intent (if any) into
     * the PubMed query translation call as JSON `structuredAiIntent` context,
     * exactly like the website widget does - the two LLM calls are NOT
     * independent in production; the PubMed translation call is enriched with
     * the semantic-intent call's output. Returns the plain query when there is
     * no structured context to add (matches the JS "hasStructuredContext"
     * short-circuit exactly), so the byte-for-byte-prompt gate from Phase 1
     * still holds for the common "no intent extracted" case.
     *
     * @param string $originalQuery
     * @param ?array<string,mixed> $llmSemanticIntent
     * @param array<string,mixed> $hardFilters
     * @param array<string,mixed> $intentContext Optional intentContext (see muginPublicSearchNormalizePostRequest()) - selectedTopicIds/selectedLimitIds feed structuredAiIntent.selectedTopics/selectedLimits.
     * @return string
     */
    function muginPublicSearchBuildPubMedTranslationPromptInput(string $originalQuery, ?array $llmSemanticIntent, array $hardFilters = [], array $intentContext = []): string
    {
        $originalQuery = trim($originalQuery);
        $llmIntent = is_array($llmSemanticIntent) ? $llmSemanticIntent : [];
        $meta = is_array($llmIntent['meta'] ?? null) ? $llmIntent['meta'] : [];
        $sourceQueryPlan = is_array($llmIntent['sourceQueryPlan'] ?? null) ? $llmIntent['sourceQueryPlan'] : [];

        $structuredAiIntent = [
            'semanticIntent' => trim((string) ($llmIntent['semanticIntent'] ?? '')),
            'coreQuery' => trim((string) ($llmIntent['coreQuery'] ?? ($sourceQueryPlan['coreQuery'] ?? ''))),
            'detectedConcepts' => muginPublicSearchNormalizeSimpleList($meta['detectedConcepts'] ?? []),
            'intentType' => trim((string) ($meta['intentType'] ?? '')),
            'conceptCoverage' => is_array($meta['conceptCoverage'] ?? null) ? $meta['conceptCoverage'] : new stdClass(),
            'hardFilterHints' => is_array($llmIntent['hardFilterHints'] ?? null) ? $llmIntent['hardFilterHints'] : new stdClass(),
            'softFilterHints' => muginPublicSearchNormalizeSimpleList($llmIntent['softFilterHints'] ?? []),
            'sourceSpecificHints' => is_array($llmIntent['sourceSpecificHints'] ?? null) ? $llmIntent['sourceSpecificHints'] : new stdClass(),
            // canonicalHardFilters/selectedTopics/selectedLimits mirror the
            // website widget's own limit-tree selection state, which has no
            // equivalent concept in the public API's simpler hardFilters
            // schema - passed through as the closest available equivalent
            // (the API's own already-validated hardFilters) / empty arrays.
            'canonicalHardFilters' => !empty($hardFilters) ? $hardFilters : new stdClass(),
            'selectedTopics' => muginPublicSearchNormalizeSimpleList(
                $intentContext['selectedTopics'] ?? ($intentContext['selectedTopicIds'] ?? [])
            ),
            'selectedLimits' => muginPublicSearchNormalizeSimpleList(
                $intentContext['selectedLimits'] ?? ($intentContext['selectedLimitIds'] ?? [])
            ),
        ];

        $hasStructuredContext = false;
        foreach ($structuredAiIntent as $value) {
            if (is_array($value) && !empty($value)) {
                $hasStructuredContext = true;
                break;
            }
            if (is_string($value) && trim($value) !== '') {
                $hasStructuredContext = true;
                break;
            }
        }
        if (!$hasStructuredContext) {
            return $originalQuery;
        }

        return muginPublicSearchSafeJsonEncode([
            'originalQuery' => $originalQuery,
            'structuredAiIntent' => $structuredAiIntent,
        ]);
    }
}

if (!function_exists('muginPublicSearchBuildPubMedTranslationOpenAiRequest')) {
    /**
     * @param array<string,mixed>|null $llmSemanticIntent
     * @param array<string,mixed> $hardFilters
     * @param array<string,mixed> $intentContext
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildPubMedTranslationOpenAiRequest(
        string $text,
        string $language,
        ?array $llmSemanticIntent = null,
        array $hardFilters = [],
        array $intentContext = []
    ): array {
        $promptInput = muginPublicSearchBuildPubMedTranslationPromptInput(
            trim($text),
            $llmSemanticIntent,
            $hardFilters,
            $intentContext
        );
        $taskSettings = function_exists('muginGetOpenAiTaskSettings')
            ? muginGetOpenAiTaskSettings('translate')
            : ['model' => '', 'reasoningEffort' => 'none', 'verbosity' => 'medium'];
        return [
            'model' => (string) ($taskSettings['model'] ?? ''),
            'input' => [
                [
                    'role' => 'user',
                    'content' => muginPublicSearchGetPubMedPromptText($language) . $promptInput,
                ],
            ],
            'reasoning' => ['effort' => (string) ($taskSettings['reasoningEffort'] ?? 'none')],
            'text' => ['verbosity' => (string) ($taskSettings['verbosity'] ?? 'medium')],
            // 500 consistently returned status=incomplete (max_output_tokens) on
            // Requesty Azure gpt-5.6-terra, truncating or emptying PubMed queries.
            'max_output_tokens' => 2048,
        ];
    }
}

if (!function_exists('muginPublicSearchPubMedTranslationFailureSentinels')) {
    /**
     * @return array<int,string>
     */
    function muginPublicSearchPubMedTranslationFailureSentinels(): array
    {
        return [
            'det indtastede kan ikke oversættes til en søgning. prøv igen.',
            'the input cannot be translated into a search. please try again.',
        ];
    }
}

if (!function_exists('muginPublicSearchNormalizePubMedTranslationFailureText')) {
    function muginPublicSearchNormalizePubMedTranslationFailureText(string $text): string
    {
        $normalized = trim($text);
        $changed = true;
        while ($changed && $normalized !== '') {
            $changed = false;
            $first = substr($normalized, 0, 1);
            $last = substr($normalized, -1);
            if (
                ($first === '(' && $last === ')')
                || ($first === '"' && $last === '"')
                || ($first === "'" && $last === "'")
            ) {
                $normalized = trim(substr($normalized, 1, -1));
                $changed = true;
            }
        }
        $collapsed = preg_replace('/\s+/u', ' ', $normalized);
        $collapsed = is_string($collapsed) ? trim($collapsed) : trim($normalized);
        return function_exists('mb_strtolower')
            ? mb_strtolower($collapsed, 'UTF-8')
            : strtolower($collapsed);
    }
}

if (!function_exists('muginPublicSearchIsPubMedTranslationFailureText')) {
    function muginPublicSearchIsPubMedTranslationFailureText(string $text): bool
    {
        $normalized = muginPublicSearchNormalizePubMedTranslationFailureText($text);
        if ($normalized === '') {
            return false;
        }
        $sentinels = muginPublicSearchPubMedTranslationFailureSentinels();
        foreach ($sentinels as $sentinel) {
            if ($normalized === $sentinel) {
                return true;
            }
        }
        if (preg_match('/\[[a-z]{2,}\]/i', $text) === 1) {
            return false;
        }
        foreach ($sentinels as $sentinel) {
            if (strpos($normalized, $sentinel) !== false) {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('muginPublicSearchPubmedQueryContainsTranslationFailureText')) {
    function muginPublicSearchPubmedQueryContainsTranslationFailureText(string $text): bool
    {
        $normalized = muginPublicSearchNormalizePubMedTranslationFailureText($text);
        if ($normalized === '') {
            return false;
        }
        foreach (muginPublicSearchPubMedTranslationFailureSentinels() as $sentinel) {
            if ($normalized === $sentinel || strpos($normalized, $sentinel) !== false) {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('muginPublicSearchUnusableGeneratedQuerySentinels')) {
    /**
     * LLM refusal / status phrases that must never be sent as executable queries.
     *
     * @return array<int,string>
     */
    function muginPublicSearchUnusableGeneratedQuerySentinels(): array
    {
        return array_merge(
            muginPublicSearchPubMedTranslationFailureSentinels(),
            [
                'unclear or non-scientific query',
            ]
        );
    }
}

if (!function_exists('muginPublicSearchIsUnusableGeneratedQueryText')) {
    function muginPublicSearchIsUnusableGeneratedQueryText(string $text): bool
    {
        $normalized = muginPublicSearchNormalizePubMedTranslationFailureText($text);
        if ($normalized === '') {
            return false;
        }
        foreach (muginPublicSearchUnusableGeneratedQuerySentinels() as $sentinel) {
            if ($normalized === $sentinel || strpos($normalized, $sentinel) !== false) {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('muginPublicSearchIsUsableGeneratedQueryText')) {
    function muginPublicSearchIsUsableGeneratedQueryText(string $text): bool
    {
        return trim($text) !== '' && !muginPublicSearchIsUnusableGeneratedQueryText($text);
    }
}

if (!function_exists('muginPublicSearchNormalizeRawFreetextForPubMed')) {
    /**
     * Makes raw (untranslated) freetext safer as a PubMed esearch term.
     * Strips prose punctuation that is PubMed syntax (?, &, #, unpaired ").
     * Does not rewrite words, AND/OR/NOT, * truncation, or parentheses.
     * Do not use on #s:pubmed clauses or qpubmed overrides.
     *
     * @return array{value:string,changed:bool}
     */
    function muginPublicSearchNormalizeRawFreetextForPubMed(string $text): array
    {
        $original = trim($text);
        if ($original === '') {
            return ['value' => '', 'changed' => false];
        }
        $result = str_replace(['?', '&', '#'], ' ', $original);
        if (substr_count($result, '"') % 2 === 1) {
            $lastQuote = strrpos($result, '"');
            if ($lastQuote !== false) {
                $result = substr($result, 0, $lastQuote) . substr($result, $lastQuote + 1);
            }
        }
        $result = trim((string) preg_replace('/\s+/u', ' ', $result));
        if ($result === '') {
            return ['value' => $original, 'changed' => false];
        }
        return [
            'value' => $result,
            'changed' => $result !== $original,
        ];
    }
}

if (!function_exists('muginPublicSearchBuildUntranslatedPubmedFallbackQuery')) {
    /**
     * @param ?array<string,mixed> $llmSemanticIntent
     */
    function muginPublicSearchBuildUntranslatedPubmedFallbackQuery(
        string $rawText,
        ?array $llmSemanticIntent = null
    ): string {
        $intent = is_array($llmSemanticIntent) ? $llmSemanticIntent : [];
        $plan = is_array($intent['sourceQueryPlan'] ?? null) ? $intent['sourceQueryPlan'] : [];
        $candidates = [
            trim((string) ($intent['coreQuery'] ?? '')),
            trim((string) ($plan['coreQuery'] ?? '')),
            trim((string) ($intent['semanticIntent'] ?? '')),
            trim($rawText),
        ];
        $source = '';
        foreach ($candidates as $candidate) {
            if (!muginPublicSearchIsUsableGeneratedQueryText($candidate)) {
                continue;
            }
            $source = $candidate;
            break;
        }
        $source = trim(str_replace('"', '', $source));
        if ($source === '') {
            return '';
        }
        $hasSpace = preg_match('/\s/u', $source) === 1;
        $hasWildcard = strpos($source, '*') !== false;
        if ($hasSpace && !$hasWildcard) {
            return '"' . $source . '"[tiab]';
        }
        return $source . '[tiab]';
    }
}

if (!function_exists('muginPublicSearchBuildUntranslatedSemanticFallbackQuery')) {
    /**
     * Plain-English (or raw freetext) fallback for SS/OA/Elicit when the LLM
     * filled query fields with a refusal or status phrase.
     *
     * @param ?array<string,mixed> $llmSemanticIntent
     */
    function muginPublicSearchBuildUntranslatedSemanticFallbackQuery(
        string $rawText,
        ?array $llmSemanticIntent = null
    ): string {
        $intent = is_array($llmSemanticIntent) ? $llmSemanticIntent : [];
        $plan = is_array($intent['sourceQueryPlan'] ?? null) ? $intent['sourceQueryPlan'] : [];
        $meta = is_array($intent['meta'] ?? null) ? $intent['meta'] : [];
        $detectedConcepts = muginPublicSearchNormalizeSimpleList($meta['detectedConcepts'] ?? []);
        $candidates = [
            trim((string) ($intent['coreQuery'] ?? '')),
            trim((string) ($plan['coreQuery'] ?? '')),
            trim((string) ($intent['semanticIntent'] ?? '')),
            trim(implode(' ', $detectedConcepts)),
            trim($rawText),
        ];
        foreach ($candidates as $candidate) {
            if (!muginPublicSearchIsUsableGeneratedQueryText($candidate)) {
                continue;
            }
            return trim(str_replace('"', '', $candidate));
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchTranslatePubMedQuery')) {
    /**
     * @param string $text
     * @param string $language
     * @param string $domain
     * @param ?array<string,mixed> $llmSemanticIntent Structured semantic-intent result (see muginPublicSearchExtractSemanticIntent()), fed in as extra context exactly like the website widget does.
     * @param array<string,mixed> $hardFilters
     * @param array<string,mixed> $intentContext
     * @param array<string,mixed> $semanticIntentMeta
     * @param bool $emitProcessDetails
     * @param bool $emitStartProgress
     * @param ?array<string,mixed> $processReport Out-parameter (process-details): filled with 'searchString'/'mesh'/'optimize' payloads describing the actual work performed.
     * @return string
     */
    function muginPublicSearchTranslatePubMedQuery(
        string $text,
        string $language,
        string $domain = '',
        ?array $llmSemanticIntent = null,
        array $hardFilters = [],
        ?callable $progressCallback = null,
        array $intentContext = [],
        array $semanticIntentMeta = [],
        bool $emitProcessDetails = false,
        bool $emitStartProgress = true,
        ?array &$processReport = null,
        array $progressRequest = []
    ): string {
        $processReport = ['searchString' => [], 'mesh' => []];
        // Always stream step details when a progress callback is present so the
        // live SearchForm process panel can render Detaljer even if collection
        // into the final processDetails export is disabled for the request.
        $emitCompletedDetail = static function (string $stepId, array $payload) use (
            $progressCallback
        ): void {
            if ($progressCallback !== null && $payload !== []) {
                muginPublicSearchProcessDetailsEmitCompletedPayload($stepId, $payload, $progressCallback);
            }
        };
        $normalizedText = trim($text);
        if ($normalizedText === '') {
            return '';
        }
        // Granular progress markers so a caller using SSE streaming (see
        // UnifiedSearch.php / muginPublicSearchRunSearch) can show accurate,
        // live timing for each sub-phase instead of attributing the whole
        // (potentially 10-40s, mostly MeSH-lookup-bound) translation+MeSH
        // step to a single generic "prepare" bucket. Mirrors the same
        // searchString/mesh/optimize step ids the website widget's own
        // meshValidator.js flow already reports.
        if ($emitStartProgress) {
            muginPublicSearchEmitProgress($progressCallback, 'searchString', '', [
                'stepId' => 'searchString',
                'groupId' => muginPublicSearchPrepareProgressGroupId($progressRequest),
                'groupKey' => muginPublicSearchPrepareProgressGroupKey($progressRequest),
                'messageKey' => 'semanticSearchProgressSearchString',
            ]);
        }
        $request = muginPublicSearchBuildPubMedTranslationOpenAiRequest(
            $normalizedText,
            $language,
            $llmSemanticIntent,
            $hardFilters,
            $intentContext
        );
        $translated = '';
        $translationAttempts = 0;
        $retryPlainQuery = false;
        $wasIncomplete = false;
        while ($translationAttempts < 2 && $translated === '') {
            $translationAttempts++;
            if ($translationAttempts > 1) {
                if ($retryPlainQuery) {
                    $request = muginPublicSearchBuildPubMedTranslationOpenAiRequest(
                        $normalizedText,
                        $language,
                        null,
                        [],
                        []
                    );
                } elseif ($wasIncomplete) {
                    $request['max_output_tokens'] = max(
                        (int) ($request['max_output_tokens'] ?? 2048),
                        3072
                    );
                }
            }
            $translationResponse = muginPublicSearchOpenAiRequest($request, $domain);
            $translated = trim(muginPublicSearchExtractOpenAiText($translationResponse));
            $wasIncomplete = false;
            $retryPlainQuery = false;
            if (
                $translated !== ''
                && muginPublicSearchIsOpenAiResponseIncomplete($translationResponse)
                && (
                    substr_count($translated, '(') !== substr_count($translated, ')')
                    || preg_match('/("|\(|OR|AND)\s*$/i', $translated) === 1
                )
            ) {
                $wasIncomplete = true;
                $translated = '';
                continue;
            }
            if ($translated === '' || muginPublicSearchIsPubMedTranslationFailureText($translated)) {
                $retryPlainQuery = true;
                $translated = '';
            }
        }
        // Hard filters are appended deterministically later. Remove a trailing
        // language-only clause if the LLM redundantly copied canonical
        // language filters into the topical PubMed query.
        $translated = trim((string) preg_replace(
            '/\s+AND\s+\((?:"?[\p{L}\s-]+"?\[la\](?:\s+OR\s+"?[\p{L}\s-]+"?\[la\])*)\)\s*$/iu',
            '',
            $translated
        ));
        $meta = is_array($llmSemanticIntent['meta'] ?? null) ? $llmSemanticIntent['meta'] : [];
        $rawUserInput = trim((string) ($intentContext['rawUserInput'] ?? $normalizedText));
        $contextualSearchInput = trim((string) ($intentContext['contextualSearchInput'] ?? ''));
        $translationFallback = false;
        $translationFallbackReason = '';
        if ($translated === '' || muginPublicSearchIsPubMedTranslationFailureText($translated)) {
            $translationFallbackReason = muginPublicSearchIsPubMedTranslationFailureText($translated)
                ? 'sentinel'
                : 'empty';
            $translated = muginPublicSearchBuildUntranslatedPubmedFallbackQuery(
                $rawUserInput !== '' ? $rawUserInput : $normalizedText,
                $llmSemanticIntent
            );
            $translationFallback = true;
        }
        $processReport['searchString'] = [
            'input' => $normalizedText,
            'rawUserInput' => $rawUserInput,
            'contextualSearchInput' => $contextualSearchInput,
            'structuredAiIntentUsed' => is_array($llmSemanticIntent) && !empty($llmSemanticIntent),
            'aiCoreQuery' => trim((string) ($llmSemanticIntent['coreQuery'] ?? ($llmSemanticIntent['semanticIntent'] ?? ''))),
            'detectedConcepts' => muginPublicSearchNormalizeSimpleList($meta['detectedConcepts'] ?? []),
            'conceptCoverage' => is_array($meta['conceptCoverage'] ?? null) ? $meta['conceptCoverage'] : new stdClass(),
            'coverageCheck' => is_array($semanticIntentMeta['coverageCheck'] ?? null)
                ? $semanticIntentMeta['coverageCheck']
                : new stdClass(),
            'pubmedQuery' => $translated,
            'finalValidatedQuery' => $translated,
        ];
        if ($translationFallback) {
            $processReport['searchString']['translationFallback'] = true;
            $processReport['searchString']['translationFallbackReason'] = $translationFallbackReason;
        }
        // Close the searchString step before MeSH so UI timing matches real work
        // (OpenAI translation only). MeSH is its own timed prepare-lane step.
        $emitCompletedDetail('searchString', $processReport['searchString']);
        $translatedBeforeMesh = $translated;

        // MeSH validation/canonicalization. Emit only when the translated
        // string actually contains [mh] terms and observe-only is off.
        $meshObserveOnly = defined('MUGIN_MESH_VALIDATION_OBSERVE_ONLY') && MUGIN_MESH_VALIDATION_OBSERVE_ONLY === true;
        $meshTerms = $translated !== '' ? muginSemanticQualityExtractMeshTerms($translated) : [];
        $runMeshStep = $translated !== ''
            && !$meshObserveOnly
            && !empty($meshTerms)
            && muginPublicSearchIsUnifiedSearchEngineEnabled();
        if ($runMeshStep) {
            muginPublicSearchEmitProgress($progressCallback, 'mesh', '', [
                'stepId' => 'mesh',
                'groupId' => muginPublicSearchPrepareProgressGroupId($progressRequest),
                'groupKey' => muginPublicSearchPrepareProgressGroupKey($progressRequest),
                'messageKey' => 'semanticSearchProgressMesh',
            ]);
            try {
                $meshResult = muginPublicSearchCanonicalizeAllMeshTermsWithNlmDetailed($translated, $domain);
                $canonicalized = $meshResult['value'];
                $meshReport = (array) ($meshResult['report'] ?? []);
                $meshReport['meshSearchQuery'] = muginPublicSearchBuildMeshSearchQuery(
                    $translatedBeforeMesh,
                    $rawUserInput
                );
                $sanitized = muginSemanticQualitySanitizeSearchStringDeterministic($canonicalized);
                $after = $sanitized['valid'] ? $sanitized['value'] : $canonicalized;
                if ($sanitized['valid']) {
                    $translated = muginSemanticQualityLowercaseNonMeshTerms($sanitized['value']);
                    $translated = muginSemanticQualityNormalizeBooleanOperatorsOutsideQuotes($translated);
                    $after = $translated;
                }
                $processReport['mesh'] = [
                    'queries' => [array_merge([
                        'input' => $rawUserInput,
                        'observeOnly' => false,
                        'beforeOptimization' => $translatedBeforeMesh,
                        'afterOptimization' => $after,
                        'changed' => $after !== $translatedBeforeMesh,
                        'addedConcepts' => muginPublicSearchNormalizeSimpleList($meshReport['addedConcepts'] ?? []),
                        'removedConcepts' => muginPublicSearchNormalizeSimpleList($meshReport['removedConcepts'] ?? []),
                        'addedMeshTerms' => muginPublicSearchNormalizeSimpleList($meshReport['addedMeshTerms'] ?? []),
                        'removedMeshTerms' => muginPublicSearchNormalizeSimpleList($meshReport['removedMeshTerms'] ?? []),
                        'finalMeshTermCount' => (int) ($meshReport['finalMeshTermCount'] ?? 0),
                    ], $meshReport)],
                ];
                $processReport['searchString']['finalValidatedQuery'] = $translated;
                $emitCompletedDetail('mesh', $processReport['mesh']);
            } catch (Throwable $exception) {
                $emptyMesh = muginPublicSearchBuildEmptyMeshReport($translatedBeforeMesh, false);
                $emptyMesh['meshSearchQuery'] = muginPublicSearchBuildMeshSearchQuery(
                    $translatedBeforeMesh,
                    $rawUserInput
                );
                $emptyMesh['validationFailed'] = true;
                $processReport['mesh'] = [
                    'queries' => [array_merge([
                        'input' => $rawUserInput,
                        'beforeOptimization' => $translatedBeforeMesh,
                        'afterOptimization' => $translatedBeforeMesh,
                        'changed' => false,
                        'addedConcepts' => [],
                        'removedConcepts' => [],
                        'addedMeshTerms' => [],
                        'removedMeshTerms' => [],
                        'finalMeshTermCount' => 0,
                    ], $emptyMesh)],
                ];
                $emitCompletedDetail('mesh', $processReport['mesh']);
            }
        }

        return $translated;
    }
}

if (!function_exists('muginPublicSearchBuildSemanticTranslationOpenAiRequest')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildSemanticTranslationOpenAiRequest(
        string $text,
        string $language
    ): array {
        $taskSettings = function_exists('muginGetOpenAiTaskSettings')
            ? muginGetOpenAiTaskSettings('translate')
            : ['model' => '', 'reasoningEffort' => 'none', 'verbosity' => 'medium'];
        return [
            'model' => (string) ($taskSettings['model'] ?? ''),
            'input' => [
                [
                    'role' => 'user',
                    'content' => muginPublicSearchGetSemanticPromptText($language) . trim($text),
                ],
            ],
            'reasoning' => ['effort' => (string) ($taskSettings['reasoningEffort'] ?? 'none')],
            'text' => ['verbosity' => (string) ($taskSettings['verbosity'] ?? 'medium')],
            'max_output_tokens' => 120,
        ];
    }
}

if (!function_exists('muginPublicSearchTranslateSemanticQuery')) {
    /**
     * @param string $text
     * @param string $language
     * @param string $domain
     * @return string
     */
    function muginPublicSearchTranslateSemanticQuery(string $text, string $language, string $domain = ''): string
    {
        $normalizedText = trim($text);
        if ($normalizedText === '') {
            return '';
        }
        $request = muginPublicSearchBuildSemanticTranslationOpenAiRequest(
            $normalizedText,
            $language
        );
        return muginPublicSearchExtractOpenAiText(muginPublicSearchOpenAiRequest($request, $domain));
    }
}

if (!function_exists('muginPublicSearchSemanticIntentHasUsableQueries')) {
    /**
     * True when ExtractSemanticIntent already produced a usable English core /
     * per-source query, so the weaker TranslateSemanticQuery LLM call can be skipped.
     *
     * @param array<string,mixed>|null $intent
     */
    function muginPublicSearchSemanticIntentHasUsableQueries(?array $intent): bool
    {
        if (!is_array($intent)) {
            return false;
        }
        $plan = is_array($intent['sourceQueryPlan'] ?? null) ? $intent['sourceQueryPlan'] : [];
        if (muginPublicSearchIsUsableGeneratedQueryText((string) ($plan['coreQuery'] ?? ''))) {
            return true;
        }
        if (muginPublicSearchIsUsableGeneratedQueryText((string) ($intent['semanticIntent'] ?? ''))) {
            return true;
        }
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            if (muginPublicSearchIsUsableGeneratedQueryText((string) ($plan[$sourceKey]['query'] ?? ''))) {
                return true;
            }
            $adaptations = is_array($plan['adaptations'] ?? null) ? $plan['adaptations'] : [];
            if (muginPublicSearchIsUsableGeneratedQueryText((string) ($adaptations[$sourceKey]['queryOverride'] ?? ''))) {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('muginPublicSearchResolveSemanticQueryFromIntent')) {
    /**
     * @param array<string,mixed>|null $intent
     */
    function muginPublicSearchResolveSemanticQueryFromIntent(?array $intent, string $fallback = ''): string
    {
        if (!is_array($intent)) {
            $fallback = trim($fallback);
            return muginPublicSearchIsUsableGeneratedQueryText($fallback) ? $fallback : '';
        }
        $plan = is_array($intent['sourceQueryPlan'] ?? null) ? $intent['sourceQueryPlan'] : [];
        $coreQuery = trim((string) ($plan['coreQuery'] ?? ''));
        if (muginPublicSearchIsUsableGeneratedQueryText($coreQuery)) {
            return $coreQuery;
        }
        $semanticIntent = trim((string) ($intent['semanticIntent'] ?? ''));
        if (muginPublicSearchIsUsableGeneratedQueryText($semanticIntent)) {
            return $semanticIntent;
        }
        $fallback = trim($fallback);
        if (muginPublicSearchIsUsableGeneratedQueryText($fallback)) {
            return $fallback;
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchPrefetchParallelTranslationRequests')) {
    /**
     * Starts the semantic-source and PubMed translation requests together once
     * their shared semantic-intent prerequisite is available. Existing
     * translation functions consume the prefetched responses unchanged.
     *
     * @param array<string,mixed>|null $semanticIntent
     * @param array<string,mixed> $hardFilters
     * @param array<string,mixed> $intentContext
     * @param array<int,string> $semanticSources
     * @param array<string,mixed> $sourceQueryPlan
     * @param array<string,mixed> $request
     * @param callable|null $sourceStartCallback
     * @return array<int,string> Sources whose initial request was prefetched.
     */
    function muginPublicSearchPrefetchParallelTranslationRequests(
        string $text,
        string $language,
        ?array $semanticIntent,
        array $hardFilters,
        array $intentContext,
        string $domain,
        array $semanticSources = [],
        array $sourceQueryPlan = [],
        array $request = [],
        ?callable $sourceStartCallback = null,
        bool $includeSemanticTranslation = true,
        bool $includePubMedTranslation = true
    ): array {
        $normalizedText = trim($text);
        if ($normalizedText === '') {
            return [];
        }
        $payloads = [];
        if ($includePubMedTranslation) {
            $payloads['searchString'] = muginPublicSearchBuildPubMedTranslationOpenAiRequest(
                $normalizedText,
                $language,
                $semanticIntent,
                $hardFilters,
                $intentContext
            );
        }
        if ($includeSemanticTranslation) {
            $payloads['semanticQuery'] = muginPublicSearchBuildSemanticTranslationOpenAiRequest(
                $normalizedText,
                $language
            );
        }
        $translationRequests = [];
        foreach ($payloads as $name => $payload) {
            $translationRequests['translation_' . $name] = muginPublicSearchBuildOpenAiRequestSpec(
                $payload,
                $domain
            );
        }
        $elapsedByRequest = muginPublicSearchPrefetchInitialSourceRequests(
            $semanticSources,
            ['sourceQueryPlan' => $sourceQueryPlan],
            $request,
            $domain,
            null,
            $translationRequests,
            $sourceStartCallback
        );
        return array_values(array_filter(
            $semanticSources,
            static fn($source) => array_key_exists($source, $elapsedByRequest)
        ));
    }
}

if (!function_exists('muginPublicSearchMapHardFiltersToSemanticScholarPublicationTypes')) {
    /**
     * @param array<int,string> $publicationTypes
     * @return array<int,string>
     */
    function muginPublicSearchMapHardFiltersToSemanticScholarPublicationTypes(array $publicationTypes): array
    {
        $output = [];
        foreach ($publicationTypes as $value) {
            $normalized = muginPublicSearchNormalizeHardPublicationType($value);
            $rawNormalized = strtolower(trim((string) $value));
            if (in_array($normalized, ['review', 'systematic review', 'cochrane review'], true)) {
                $output[] = 'Review';
            } elseif ($normalized === 'meta-analysis') {
                $output[] = 'Meta-Analysis';
            } elseif (in_array($rawNormalized, ['randomized controlled trial', 'randomised controlled trial', 'rct'], true)) {
                $output[] = 'ClinicalTrial';
            }
        }
        return muginPublicSearchDedupeStrings($output);
    }
}

if (!function_exists('muginPublicSearchMapPublicationTypesToOpenAlexWorkTypes')) {
    /**
     * @param array<int,string> $publicationTypes
     * @return array<int,string>
     */
    function muginPublicSearchMapPublicationTypesToOpenAlexWorkTypes(array $publicationTypes): array
    {
        $output = [];
        foreach ($publicationTypes as $value) {
            $normalized = muginPublicSearchNormalizeHardPublicationType($value);
            if (in_array($normalized, ['review', 'systematic review', 'meta-analysis', 'cochrane review'], true)) {
                $output[] = 'review';
            }
        }
        return muginPublicSearchDedupeStrings(array_map('muginPublicSearchNormalizeOpenAlexWorkType', $output));
    }
}

if (!function_exists('muginPublicSearchMapSourceFormatsToOpenAlexFilters')) {
    /**
     * @param array<int,string> $sourceFormats
     * @return array{sourceType: array<int,string>, workType: array<int,string>}
     */
    function muginPublicSearchMapSourceFormatsToOpenAlexFilters(array $sourceFormats): array
    {
        // journal -> workType:'article' (NOT sourceType:'journal') to match
        // mapSourceFormatsToOpenAlexFilters() in DropdownWrapper.vue exactly
        // (src/components/DropdownWrapper.vue ~5557-5574). The earlier PHP
        // version mapped journal to sourceType:'journal' instead, which is a
        // real behavioral divergence from the website widget - fixed here.
        $sourceTypes = [];
        $workTypes = [];
        foreach ($sourceFormats as $value) {
            $normalized = muginPublicSearchNormalizeSourceFormat($value);
            if ($normalized === 'journal') {
                $workTypes[] = 'article';
            } elseif ($normalized === 'conference') {
                $sourceTypes[] = 'conference';
            } elseif ($normalized === 'preprint') {
                $workTypes[] = 'preprint';
            }
        }
        return [
            'sourceType' => muginPublicSearchDedupeStrings($sourceTypes),
            'workType' => muginPublicSearchDedupeStrings(array_map('muginPublicSearchNormalizeOpenAlexWorkType', $workTypes)),
        ];
    }
}

if (!function_exists('muginPublicSearchMapSourceFormatsToSemanticScholarPublicationTypes')) {
    /**
     * Ported from mapSourceFormatsToSemanticScholarPublicationTypes() in
     * DropdownWrapper.vue (~5593-5609). Previously missing entirely from the
     * PHP query-plan builder.
     *
     * @param array<int,string> $sourceFormats
     * @return array<int,string>
     */
    function muginPublicSearchMapSourceFormatsToSemanticScholarPublicationTypes(array $sourceFormats): array
    {
        $output = [];
        foreach ($sourceFormats as $value) {
            $normalized = muginPublicSearchNormalizeSourceFormat($value);
            if ($normalized === 'journal') {
                $output[] = 'JournalArticle';
            } elseif ($normalized === 'conference') {
                $output[] = 'Conference';
            } elseif ($normalized === 'preprint') {
                $output[] = 'Preprint';
            }
        }
        return muginPublicSearchDedupeStrings(array_map('muginPublicSearchNormalizeSemanticScholarPublicationType', $output));
    }
}

if (!function_exists('muginPublicSearchMapHardFiltersToElicitTypeTags')) {
    /**
     * @param array<string,mixed> $hardFilters
     * @return array<int,string>
     */
    function muginPublicSearchMapHardFiltersToElicitTypeTags(array $hardFilters): array
    {
        $output = [];
        foreach ((array) ($hardFilters['publicationTypes'] ?? []) as $value) {
            $normalized = muginPublicSearchNormalizeHardPublicationType($value);
            if ($normalized === 'systematic review') {
                $output[] = 'Systematic Review';
            } elseif ($normalized === 'meta-analysis') {
                $output[] = 'Meta-Analysis';
            } elseif (in_array($normalized, ['review', 'cochrane review'], true)) {
                $output[] = 'Review';
            }
        }
        return muginPublicSearchDedupeStrings(array_map('muginPublicSearchNormalizeElicitTypeTag', $output));
    }
}

if (!function_exists('muginPublicSearchNormalizeElicitBooleanValue')) {
    /**
     * Ported from normalizeElicitBooleanValue() in DropdownWrapper.vue (~5686-5694).
     *
     * @param mixed $value
     * @return ?bool
     */
    function muginPublicSearchNormalizeElicitBooleanValue($value): ?bool
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return ((float) $value) !== 0.0;
        }
        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, ['true', 'yes', '1', 'on'], true)) {
            return true;
        }
        if (in_array($normalized, ['false', 'no', '0', 'off'], true)) {
            return false;
        }
        return null;
    }
}

if (!function_exists('muginPublicSearchNormalizeElicitYearValue')) {
    /**
     * Ported from normalizeElicitYearValue() in DropdownWrapper.vue (~5695-5700).
     *
     * @param mixed $value
     * @return ?int
     */
    function muginPublicSearchNormalizeElicitYearValue($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        $year = (int) $value;
        if ($year < 1800 || $year > 2100 || !is_numeric($value)) {
            return null;
        }
        return $year;
    }
}

if (!function_exists('muginPublicSearchNormalizeElicitQuartileValue')) {
    /**
     * Ported from normalizeElicitQuartileValue() in DropdownWrapper.vue (~5701-5706).
     *
     * @param mixed $value
     * @return ?int
     */
    function muginPublicSearchNormalizeElicitQuartileValue($value): ?int
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return null;
        }
        $quartile = (int) $value;
        if ($quartile < 1 || $quartile > 4) {
            return null;
        }
        return $quartile;
    }
}

if (!function_exists('muginPublicSearchNormalizeElicitRetractedValue')) {
    /**
     * Ported from normalizeElicitRetractedValue() in DropdownWrapper.vue (~5707-5714).
     *
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeElicitRetractedValue($value): string
    {
        $normalized = strtolower(trim((string) $value));
        $normalized = (string) preg_replace('/[\s_-]+/', '', $normalized);
        if ($normalized === '') {
            return '';
        }
        if (in_array($normalized, ['excluderetracted', 'exclude'], true)) {
            return 'exclude_retracted';
        }
        if (in_array($normalized, ['includeretracted', 'include'], true)) {
            return 'include_retracted';
        }
        if (in_array($normalized, ['onlyretracted', 'only'], true)) {
            return 'only_retracted';
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchBuildElicitFallbackQuery')) {
    /**
     * @param string $query
     * @return string
     */
    function muginPublicSearchBuildElicitFallbackQuery(string $query): string
    {
        $normalized = trim($query);
        if ($normalized === '') {
            return '';
        }
        if (
            preg_match('/\?$/', $normalized) === 1 ||
            preg_match('/^(what|how|which|when|why|does|do|is|are|can)\b/i', $normalized) === 1
        ) {
            return $normalized;
        }
        return 'What is known about ' . $normalized . '?';
    }
}

if (!function_exists('muginPublicSearchBuildHardFilterQuery')) {
    /**
     * @param array<string,mixed> $hardFilters
     * @param array<int,string|array{id?:string,scope?:string}> $selectedLimitIds
     * @return array{query: string, warnings: array<int,string>}
     */
    function muginPublicSearchBuildHardFilterQuery(array $hardFilters, array $selectedLimitIds = []): array
    {
        $warnings = [];
        $parts = [];
        $selectedLimitQuery = muginPublicSearchBuildSelectedLimitPubMedQuery($selectedLimitIds);
        $catalogQuery = $selectedLimitQuery !== ''
            ? $selectedLimitQuery
            : muginPublicSearchBuildCanonicalHardFilterPubMedQuery($hardFilters);
        if ($catalogQuery !== '') {
            $parts[] = $catalogQuery;
            $years = array_values(array_filter(array_map('intval', (array) ($hardFilters['publicationDateYears'] ?? []))));
            if (!empty($years)) {
                sort($years);
                $parts[] = min($years) . ':' . max($years) . '[dp]';
            } else {
                $publicationYear = muginPublicSearchNormalizePublicationYearRange($hardFilters['publicationYear'] ?? '');
                if ($publicationYear !== '') {
                    $parts[] = strpos($publicationYear, '-') !== false
                        ? str_replace('-', ':', $publicationYear) . '[dp]'
                        : $publicationYear . '[dp]';
                }
            }
            return ['query' => implode(' AND ', $parts), 'warnings' => []];
        }

        $languageNames = [
            'en' => 'english',
            'da' => 'danish',
            'de' => 'german',
            'fr' => 'french',
            'es' => 'spanish',
            'it' => 'italian',
            'nl' => 'dutch',
            'no' => 'norwegian',
            'nb' => 'norwegian',
            'nn' => 'norwegian',
            'sv' => 'swedish',
            'pt' => 'portuguese',
        ];
        $languageClauses = [];
        foreach ((array) ($hardFilters['languages'] ?? []) as $languageCode) {
            $normalized = muginPublicSearchNormalizeLanguageCode($languageCode);
            if ($normalized !== '' && isset($languageNames[$normalized])) {
                $languageClauses[] = $languageNames[$normalized] . '[la]';
            }
        }
        if (!empty($languageClauses)) {
            $parts[] = count($languageClauses) === 1 ? $languageClauses[0] : '(' . implode(' OR ', $languageClauses) . ')';
        }

        $publicationYear = muginPublicSearchNormalizePublicationYearRange($hardFilters['publicationYear'] ?? '');
        if ($publicationYear !== '') {
            if (strpos($publicationYear, '-') !== false) {
                [$fromYear, $toYear] = explode('-', $publicationYear, 2);
                $parts[] = $fromYear . ':' . $toYear . '[dp]';
            } else {
                $parts[] = $publicationYear . '[dp]';
            }
        }

        $publicationTypeClauses = [];
        foreach ((array) ($hardFilters['publicationTypes'] ?? []) as $publicationType) {
            $normalized = muginPublicSearchNormalizeHardPublicationType($publicationType);
            if ($normalized === 'review') {
                $publicationTypeClauses[] = 'review[pt]';
            } elseif ($normalized === 'systematic review') {
                $publicationTypeClauses[] = '"systematic review"[pt]';
            } elseif ($normalized === 'meta-analysis') {
                $publicationTypeClauses[] = '"meta-analysis"[pt]';
            } elseif ($normalized === 'cochrane review') {
                $publicationTypeClauses[] = '("Cochrane Database Syst Rev"[ta] OR cochrane review[tiab])';
            }
        }
        if (!empty($publicationTypeClauses)) {
            $parts[] = count($publicationTypeClauses) === 1
                ? $publicationTypeClauses[0]
                : '(' . implode(' OR ', $publicationTypeClauses) . ')';
        }

        if (!empty($hardFilters['sourceFormats'])) {
            $warnings[] = 'sourceFormats could not be enforced in the PubMed hard-filter query and are only applied where metadata is available.';
        }

        return [
            'query' => implode(' AND ', array_filter($parts)),
            'warnings' => $warnings,
        ];
    }
}

if (!function_exists('muginPublicSearchBuildSourceQueryPlan')) {
    /**
     * @param array<string,mixed> $request
     * @param string $semanticQuery
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildSourceQueryPlan(array $request, string $semanticQuery, ?array $llmSemanticIntent = null): array
    {
        $hardFilters = isset($request['hardFilters']) && is_array($request['hardFilters'])
            ? $request['hardFilters']
            : [];
        $sourceFilters = isset($request['sourceFilters']) && is_array($request['sourceFilters'])
            ? $request['sourceFilters']
            : [];

        // Per-source query resolution below mirrors buildSemanticSourceQueryPlan()
        // in DropdownWrapper.vue exactly: an LLM adaptation override wins, then
        // the LLM's own per-source query (sourceQueryPlan.<source>.query - this
        // field is REQUIRED by the JSON schema, so in production it is always
        // populated), then the shared commonQuery. Previously this PHP port
        // only ever used $semanticQuery for all three sources, which is a real
        // behavioral divergence from the website widget - see the
        // unified-search-engine-full-parity plan, Phase 6 finding: this was
        // the dominant cause of low candidate-set overlap between the two
        // engines, because OpenAlex/Semantic Scholar received a materially
        // different query than what the widget actually sends.
        $llmSourceQueryPlan = is_array($llmSemanticIntent['sourceQueryPlan'] ?? null) ? $llmSemanticIntent['sourceQueryPlan'] : [];
        $llmAdaptations = is_array($llmSourceQueryPlan['adaptations'] ?? null) ? $llmSourceQueryPlan['adaptations'] : [];
        $llmCoreQuery = trim((string) ($llmSourceQueryPlan['coreQuery'] ?? ''));
        if (!muginPublicSearchIsUsableGeneratedQueryText($llmCoreQuery)) {
            $llmCoreQuery = '';
        }
        $trimmedSemanticQuery = trim($semanticQuery);
        if (!muginPublicSearchIsUsableGeneratedQueryText($trimmedSemanticQuery)) {
            $trimmedSemanticQuery = '';
        }
        $requestFallbackText = trim((string) ($request['query']['text'] ?? ''));
        $plainFallback = muginPublicSearchBuildUntranslatedSemanticFallbackQuery(
            $requestFallbackText !== '' ? $requestFallbackText : $trimmedSemanticQuery,
            $llmSemanticIntent
        );
        $commonQuery = $trimmedSemanticQuery !== '' ? $trimmedSemanticQuery : $llmCoreQuery;
        if ($commonQuery === '') {
            $commonQuery = $plainFallback;
        }

        $resolveSourceQuery = static function (string $sourceKey) use (
            $llmAdaptations,
            $llmSourceQueryPlan,
            $commonQuery,
            $plainFallback
        ): string {
            $candidates = [
                trim((string) ($llmAdaptations[$sourceKey]['queryOverride'] ?? '')),
                trim((string) ($llmSourceQueryPlan[$sourceKey]['query'] ?? '')),
                $commonQuery,
                $plainFallback,
            ];
            foreach ($candidates as $candidate) {
                if (muginPublicSearchIsUsableGeneratedQueryText($candidate)) {
                    return trim($candidate);
                }
            }
            return $plainFallback;
        };
        $semanticScholarQuery = $resolveSourceQuery('semanticScholar');
        $openAlexQuery = $resolveSourceQuery('openAlex');
        $elicitBaseQuery = $resolveSourceQuery('elicit');

        // Merge strategy below intentionally differs by field, matching
        // buildSemanticSourceQueryPlan() in DropdownWrapper.vue exactly:
        // - OpenAlex workType/sourceType/language and Elicit typeTags PREFER
        //   an explicitly configured sourceFilters value over the hardFilter-
        //   derived fallback (configured wins outright; fallback is only used
        //   when nothing was configured).
        // - Semantic Scholar publicationTypes ALWAYS merges configured +
        //   fallback + the sourceFormat-proxy fallback together (JS does the
        //   same - see mapSourceFormatsToSemanticScholarPublicationTypes()).
        $openAlexSourceFormatFilters = muginPublicSearchMapSourceFormatsToOpenAlexFilters(
            (array) ($hardFilters['sourceFormats'] ?? [])
        );
        $fallbackOpenAlexWorkTypes = muginPublicSearchDedupeStrings(array_merge(
            $openAlexSourceFormatFilters['workType'],
            muginPublicSearchMapPublicationTypesToOpenAlexWorkTypes((array) ($hardFilters['publicationTypes'] ?? []))
        ));
        $configuredOpenAlexWorkTypes = muginPublicSearchDedupeStrings(array_map(
            'muginPublicSearchNormalizeOpenAlexWorkType',
            (array) ($sourceFilters['openAlex']['workType'] ?? [])
        ));
        $openAlexWorkTypes = !empty($configuredOpenAlexWorkTypes) ? $configuredOpenAlexWorkTypes : $fallbackOpenAlexWorkTypes;

        $fallbackOpenAlexSourceTypes = $openAlexSourceFormatFilters['sourceType'];
        $configuredOpenAlexSourceTypes = muginPublicSearchDedupeStrings((array) ($sourceFilters['openAlex']['sourceType'] ?? []));
        $openAlexSourceTypes = !empty($configuredOpenAlexSourceTypes) ? $configuredOpenAlexSourceTypes : $fallbackOpenAlexSourceTypes;

        $fallbackOpenAlexLanguages = muginPublicSearchDedupeStrings((array) ($hardFilters['languages'] ?? []), 'muginPublicSearchNormalizeLanguageCode');
        $configuredOpenAlexLanguages = muginPublicSearchDedupeStrings((array) ($sourceFilters['openAlex']['language'] ?? []), 'muginPublicSearchNormalizeLanguageCode');
        $openAlexLanguages = !empty($configuredOpenAlexLanguages) ? $configuredOpenAlexLanguages : $fallbackOpenAlexLanguages;

        $openAlexPublicationYear = muginPublicSearchNormalizePublicationYearRange(
            $sourceFilters['openAlex']['publicationYear'] ?? ($hardFilters['publicationYear'] ?? '')
        );
        $openAlexIsOa = muginPublicSearchNormalizeElicitBooleanValue(
            $sourceFilters['openAlex']['isOa'] ?? ($sourceFilters['openAlex']['is_oa'] ?? null)
        );

        $semanticScholarPublicationTypes = muginPublicSearchDedupeStrings(array_merge(
            (array) ($sourceFilters['semanticScholar']['publicationTypes'] ?? []),
            muginPublicSearchMapHardFiltersToSemanticScholarPublicationTypes(array_merge(
                (array) ($hardFilters['publicationTypes'] ?? []),
                (array) ($hardFilters['studyDesigns'] ?? [])
            )),
            muginPublicSearchMapSourceFormatsToSemanticScholarPublicationTypes((array) ($hardFilters['sourceFormats'] ?? []))
        ));
        $semanticScholarPublicationDateOrYear = muginPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
            $sourceFilters['semanticScholar']['publicationDateOrYear'] ?? ''
        );
        $semanticScholarYear = muginPublicSearchNormalizePublicationYearRange(
            $sourceFilters['semanticScholar']['year'] ?? ($hardFilters['publicationYear'] ?? '')
        );

        $fallbackElicitTypeTags = muginPublicSearchMapHardFiltersToElicitTypeTags($hardFilters);
        $configuredElicitTypeTags = muginPublicSearchDedupeStrings(array_map(
            'muginPublicSearchNormalizeElicitTypeTag',
            (array) ($sourceFilters['elicit']['typeTags'] ?? [])
        ));
        $elicitTypeTags = !empty($configuredElicitTypeTags) ? $configuredElicitTypeTags : $fallbackElicitTypeTags;

        $elicitFilters = $sourceFilters['elicit'] ?? [];
        $elicitFinalFilters = [
            'typeTags' => $elicitTypeTags,
            'includeKeywords' => muginPublicSearchNormalizeSimpleList($elicitFilters['includeKeywords'] ?? []),
            'excludeKeywords' => muginPublicSearchNormalizeSimpleList($elicitFilters['excludeKeywords'] ?? []),
        ];
        $elicitMinYear = muginPublicSearchNormalizeElicitYearValue($elicitFilters['minYear'] ?? null);
        if ($elicitMinYear !== null) {
            $elicitFinalFilters['minYear'] = $elicitMinYear;
        }
        $elicitMaxYear = muginPublicSearchNormalizeElicitYearValue($elicitFilters['maxYear'] ?? null);
        if ($elicitMaxYear !== null) {
            $elicitFinalFilters['maxYear'] = $elicitMaxYear;
        }
        $elicitMinEpochS = isset($elicitFilters['minEpochS']) && is_numeric($elicitFilters['minEpochS']) && (int) $elicitFilters['minEpochS'] > 0
            ? (int) $elicitFilters['minEpochS']
            : null;
        if ($elicitMinEpochS !== null) {
            $elicitFinalFilters['minEpochS'] = $elicitMinEpochS;
        }
        $elicitMaxEpochS = isset($elicitFilters['maxEpochS']) && is_numeric($elicitFilters['maxEpochS']) && (int) $elicitFilters['maxEpochS'] > 0
            ? (int) $elicitFilters['maxEpochS']
            : null;
        if ($elicitMaxEpochS !== null) {
            $elicitFinalFilters['maxEpochS'] = $elicitMaxEpochS;
        }
        $elicitMaxQuartile = muginPublicSearchNormalizeElicitQuartileValue($elicitFilters['maxQuartile'] ?? null);
        if ($elicitMaxQuartile !== null) {
            $elicitFinalFilters['maxQuartile'] = $elicitMaxQuartile;
        }
        $elicitHasPdf = muginPublicSearchNormalizeElicitBooleanValue($elicitFilters['hasPdf'] ?? null);
        if ($elicitHasPdf !== null) {
            $elicitFinalFilters['hasPdf'] = $elicitHasPdf;
        }
        $elicitPubmedOnly = muginPublicSearchNormalizeElicitBooleanValue($elicitFilters['pubmedOnly'] ?? null);
        if ($elicitPubmedOnly !== null) {
            $elicitFinalFilters['pubmedOnly'] = $elicitPubmedOnly;
        }
        // Defaults to 'exclude_retracted' when unset, matching
        // buildSemanticSourceQueryPlan() in DropdownWrapper.vue (~5918-5919).
        $elicitFinalFilters['retracted'] = muginPublicSearchNormalizeElicitRetractedValue($elicitFilters['retracted'] ?? '') ?: 'exclude_retracted';

        return [
            'semanticScholar' => [
                'query' => $semanticScholarQuery,
                'filters' => [
                    'publicationTypes' => $semanticScholarPublicationTypes,
                    'publicationDateOrYear' => $semanticScholarPublicationDateOrYear,
                    'year' => $semanticScholarYear,
                ],
            ],
            'openAlex' => [
                'query' => $openAlexQuery,
                'filters' => array_merge(
                    [
                        'language' => $openAlexLanguages,
                        'sourceType' => $openAlexSourceTypes,
                        'workType' => $openAlexWorkTypes,
                        'publicationYear' => $openAlexPublicationYear,
                    ],
                    $openAlexIsOa !== null ? ['isOa' => $openAlexIsOa] : []
                ),
            ],
            'elicit' => [
                'query' => muginPublicSearchBuildElicitFallbackQuery($elicitBaseQuery),
                'filters' => $elicitFinalFilters,
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchBuildSemanticIntentProcessReport')) {
    /**
     * Intent-only process details (before per-source query adaptation).
     *
     * @param array<string,mixed> $request
     * @param array<string,mixed>|null $llmIntent
     * @param array<string,mixed> $semanticIntentMeta
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildSemanticIntentProcessReport(
        array $request,
        ?array $llmIntent,
        array $semanticIntentMeta
    ): array {
        $intentContext = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];
        $intentMeta = is_array($llmIntent['meta'] ?? null) ? $llmIntent['meta'] : [];
        $plan = is_array($llmIntent['sourceQueryPlan'] ?? null) ? $llmIntent['sourceQueryPlan'] : [];
        $coreQuery = trim((string) ($plan['coreQuery'] ?? ''));
        if ($coreQuery === '') {
            $coreQuery = trim((string) ($llmIntent['semanticIntent'] ?? ''));
        }
        return [
            'input' => trim((string) ($intentContext['rawUserInput'] ?? ($request['query']['text'] ?? ''))),
            'rawUserInput' => trim((string) ($intentContext['rawUserInput'] ?? ($request['query']['text'] ?? ''))),
            'contextualSearchInput' => trim((string) ($intentContext['contextualSearchInput'] ?? '')),
            'semanticIntent' => trim((string) ($llmIntent['semanticIntent'] ?? '')),
            'coreQuery' => $coreQuery,
            'promptVersion' => (string) ($semanticIntentMeta['promptVersion'] ?? ''),
            'cacheHit' => ($semanticIntentMeta['cacheHit'] ?? false) === true,
            'fallbackUsed' => ($semanticIntentMeta['fallbackUsed'] ?? false) === true,
            'parseAttempts' => (int) ($semanticIntentMeta['parseAttempts'] ?? 0),
            'coverageCheck' => is_array($semanticIntentMeta['coverageCheck'] ?? null)
                ? $semanticIntentMeta['coverageCheck']
                : ['ok' => true, 'missingTerms' => []],
            'detectedConcepts' => muginPublicSearchNormalizeSimpleList($intentMeta['detectedConcepts'] ?? []),
            'confidenceScore' => isset($intentMeta['confidenceScore']) && is_numeric($intentMeta['confidenceScore'])
                ? (float) $intentMeta['confidenceScore']
                : null,
            'conceptCoverage' => is_array($intentMeta['conceptCoverage'] ?? null)
                ? $intentMeta['conceptCoverage']
                : new stdClass(),
            'potentialIssues' => muginPublicSearchNormalizeSimpleList($intentMeta['potentialIssues'] ?? []),
            'refinementSuggestions' => muginPublicSearchNormalizeSimpleList($intentMeta['refinementSuggestions'] ?? []),
        ];
    }
}

if (!function_exists('muginPublicSearchBuildSemanticQueryProcessReport')) {
    /**
     * @param array<string,mixed> $request
     * @param array<string,mixed>|null $llmIntent
     * @param array<string,mixed> $semanticIntentMeta
     * @param array<string,mixed> $sourceQueryPlan
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildSemanticQueryProcessReport(
        array $request,
        ?array $llmIntent,
        array $semanticIntentMeta,
        string $semanticQuery,
        array $sourceQueryPlan,
        bool $semanticTranslationSkipped = false
    ): array {
        $intentContext = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];
        $intentMeta = is_array($llmIntent['meta'] ?? null) ? $llmIntent['meta'] : [];
        $sourceQueries = [];
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            if (!in_array($sourceKey, (array) ($request['sources'] ?? []), true)) {
                continue;
            }
            $plan = isset($sourceQueryPlan[$sourceKey]) && is_array($sourceQueryPlan[$sourceKey])
                ? $sourceQueryPlan[$sourceKey]
                : [];
            $query = trim((string) ($plan['query'] ?? ''));
            if ($query === '') {
                continue;
            }
            $sourceQueries[] = [
                'source' => $sourceKey,
                'query' => $query,
                'filters' => isset($plan['filters']) && is_array($plan['filters'])
                    ? $plan['filters']
                    : new stdClass(),
            ];
        }
        return [
            'input' => trim((string) ($intentContext['rawUserInput'] ?? ($request['query']['text'] ?? ''))),
            'rawUserInput' => trim((string) ($intentContext['rawUserInput'] ?? ($request['query']['text'] ?? ''))),
            'contextualSearchInput' => trim((string) ($intentContext['contextualSearchInput'] ?? '')),
            'semanticIntent' => trim((string) ($llmIntent['semanticIntent'] ?? $semanticQuery)),
            'coreQuery' => muginPublicSearchResolveSemanticQueryFromIntent($llmIntent, $semanticQuery),
            'selectedSources' => array_values((array) ($request['sources'] ?? [])),
            'promptVersion' => (string) ($semanticIntentMeta['promptVersion'] ?? ''),
            'cacheHit' => ($semanticIntentMeta['cacheHit'] ?? false) === true,
            'fallbackUsed' => ($semanticIntentMeta['fallbackUsed'] ?? false) === true,
            'parseAttempts' => (int) ($semanticIntentMeta['parseAttempts'] ?? 0),
            'coverageCheck' => is_array($semanticIntentMeta['coverageCheck'] ?? null)
                ? $semanticIntentMeta['coverageCheck']
                : ['ok' => true, 'missingTerms' => []],
            'detectedConcepts' => muginPublicSearchNormalizeSimpleList($intentMeta['detectedConcepts'] ?? []),
            'confidenceScore' => isset($intentMeta['confidenceScore']) && is_numeric($intentMeta['confidenceScore'])
                ? (float) $intentMeta['confidenceScore']
                : null,
            'conceptCoverage' => is_array($intentMeta['conceptCoverage'] ?? null)
                ? $intentMeta['conceptCoverage']
                : new stdClass(),
            'potentialIssues' => muginPublicSearchNormalizeSimpleList($intentMeta['potentialIssues'] ?? []),
            'refinementSuggestions' => muginPublicSearchNormalizeSimpleList($intentMeta['refinementSuggestions'] ?? []),
            'hardFilters' => (array) ($request['hardFilters'] ?? []),
            'sourceQueries' => $sourceQueries,
            'adaptations' => is_array($llmIntent['adaptations'] ?? null)
                ? $llmIntent['adaptations']
                : (is_array($sourceQueryPlan['adaptations'] ?? null)
                    ? $sourceQueryPlan['adaptations']
                    : new stdClass()),
            'semanticTranslationSkipped' => $semanticTranslationSkipped === true,
        ];
    }
}

if (!function_exists('muginPublicSearchRequestHasSemanticSources')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchRequestHasSemanticSources(array $request): bool
    {
        return count(array_intersect(
            (array) ($request['sources'] ?? []),
            ['semanticScholar', 'openAlex', 'elicit']
        )) > 0;
    }
}

if (!function_exists('muginPublicSearchRerankProgressMessageKey')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchRerankProgressMessageKey(array $request): string
    {
        return count((array) ($request['sources'] ?? [])) <= 1
            ? 'semanticSearchProgressRerankSingle'
            : 'semanticSearchProgressRerank';
    }
}

if (!function_exists('muginPublicSearchHasSingleSelectedSource')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchHasSingleSelectedSource(array $request): bool
    {
        return count((array) ($request['sources'] ?? [])) === 1;
    }
}

if (!function_exists('muginPublicSearchSemanticIntentProgressMessageKey')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchSemanticIntentProgressMessageKey(array $request): string
    {
        return muginPublicSearchHasSingleSelectedSource($request)
            ? 'semanticSearchProgressSemanticIntentSingle'
            : 'semanticSearchProgressSemanticIntent';
    }
}

if (!function_exists('muginPublicSearchPrepareProgressGroupKey')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchPrepareProgressGroupKey(array $request): string
    {
        return muginPublicSearchHasSingleSelectedSource($request)
            ? 'semanticSearchProcessGroupPrepareAndSearchSingle'
            : 'semanticSearchProcessGroupPrepare';
    }
}

if (!function_exists('muginPublicSearchSourcesProgressGroupKey')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchSourcesProgressGroupKey(array $request): string
    {
        return muginPublicSearchHasSingleSelectedSource($request)
            ? 'semanticSearchProcessGroupPrepareAndSearchSingle'
            : 'semanticSearchProcessGroupSources';
    }
}

if (!function_exists('muginPublicSearchPrepareProgressGroupId')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchPrepareProgressGroupId(array $request): string
    {
        return muginPublicSearchHasSingleSelectedSource($request) ? 'prepareAndSources' : 'prepare';
    }
}

if (!function_exists('muginPublicSearchSourcesProgressGroupId')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchSourcesProgressGroupId(array $request): string
    {
        return muginPublicSearchHasSingleSelectedSource($request) ? 'prepareAndSources' : 'sources';
    }
}

if (!function_exists('muginPublicSearchBuildCombinedSemanticIntentProcessReport')) {
    /**
     * Intent + per-source adaptation in one process-details payload.
     *
     * @param array<string,mixed> $request
     * @param array<string,mixed>|null $llmIntent
     * @param array<string,mixed> $semanticIntentMeta
     * @param array<string,mixed> $sourceQueryPlan
     */
    function muginPublicSearchBuildCombinedSemanticIntentProcessReport(
        array $request,
        ?array $llmIntent,
        array $semanticIntentMeta,
        string $semanticQuery,
        array $sourceQueryPlan,
        bool $semanticTranslationSkipped = false
    ): array {
        $intentReport = muginPublicSearchBuildSemanticIntentProcessReport(
            $request,
            $llmIntent,
            $semanticIntentMeta
        );
        $adaptationReport = muginPublicSearchBuildSemanticQueryProcessReport(
            $request,
            $llmIntent,
            $semanticIntentMeta,
            $semanticQuery,
            $sourceQueryPlan,
            $semanticTranslationSkipped
        );
        return array_merge($intentReport, $adaptationReport);
    }
}

if (!function_exists('muginPublicSearchQueryOverrideAllowedKeys')) {
    /**
     * @return array<int,string>
     */
    function muginPublicSearchQueryOverrideAllowedKeys(): array
    {
        return ['pubmed', 'semanticScholar', 'openAlex', 'elicit'];
    }
}

if (!function_exists('muginPublicSearchQueryOverrideMaxLength')) {
    function muginPublicSearchQueryOverrideMaxLength(): int
    {
        return 20000;
    }
}

if (!function_exists('muginPublicSearchNormalizeQueryOverrides')) {
    /**
     * @param mixed $raw
     * @return array<string,string>
     */
    function muginPublicSearchNormalizeQueryOverrides($raw): array
    {
        if ($raw === null) {
            return [];
        }
        if (!is_array($raw)) {
            throw new InvalidArgumentException('queryOverrides must be an object');
        }
        $allowed = muginPublicSearchQueryOverrideAllowedKeys();
        $unexpected = array_diff(array_keys($raw), $allowed);
        if ($unexpected !== []) {
            throw new InvalidArgumentException(
                'Unsupported queryOverrides field(s): ' . implode(', ', $unexpected)
            );
        }
        $maxLength = muginPublicSearchQueryOverrideMaxLength();
        $normalized = [];
        foreach ($allowed as $key) {
            if (!array_key_exists($key, $raw)) {
                continue;
            }
            $value = $raw[$key];
            if (!is_string($value)) {
                throw new InvalidArgumentException('queryOverrides.' . $key . ' must be a string');
            }
            $trimmed = trim(str_replace("\0", '', $value));
            if ($trimmed === '') {
                continue;
            }
            if (strlen($trimmed) > $maxLength) {
                throw new InvalidArgumentException(
                    'queryOverrides.' . $key . ' exceeds maximum length of ' . $maxLength
                );
            }
            $normalized[$key] = $trimmed;
        }
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchGetRequestQueryOverrides')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,string>
     */
    function muginPublicSearchGetRequestQueryOverrides(array $request): array
    {
        return isset($request['queryOverrides']) && is_array($request['queryOverrides'])
            ? $request['queryOverrides']
            : [];
    }
}

if (!function_exists('muginPublicSearchRequestHasExecutableQueryOverrides')) {
    /**
     * True when at least one selected source has a non-empty query override.
     *
     * @param array<string,mixed> $request
     */
    function muginPublicSearchRequestHasExecutableQueryOverrides(array $request): bool
    {
        $overrides = muginPublicSearchGetRequestQueryOverrides($request);
        if ($overrides === []) {
            return false;
        }
        $sources = (array) ($request['sources'] ?? []);
        foreach ($overrides as $sourceKey => $value) {
            if (in_array($sourceKey, $sources, true) && trim((string) $value) !== '') {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('muginPublicSearchQueryOverridesCoverAllSelectedSources')) {
    /**
     * @param array<string,mixed> $request
     */
    function muginPublicSearchQueryOverridesCoverAllSelectedSources(array $request): bool
    {
        $overrides = muginPublicSearchGetRequestQueryOverrides($request);
        $sources = array_values((array) ($request['sources'] ?? []));
        if ($sources === [] || $overrides === []) {
            return false;
        }
        foreach ($sources as $source) {
            $sourceKey = trim((string) $source);
            if ($sourceKey === '' || !isset($overrides[$sourceKey]) || $overrides[$sourceKey] === '') {
                return false;
            }
        }
        return true;
    }
}

if (!function_exists('muginPublicSearchNormalizeCachedFreetextQueries')) {
    /**
     * Session reuse of an already-translated freetext clause. Unlike
     * queryOverrides.pubmed this is combined with current topics/limits.
     *
     * @param mixed $raw
     * @return array<string,string>
     */
    function muginPublicSearchNormalizeCachedFreetextQueries($raw): array
    {
        if ($raw === null) {
            return [];
        }
        if (!is_array($raw)) {
            throw new InvalidArgumentException('cachedFreetextQueries must be an object');
        }
        $allowed = array_merge(['input'], muginPublicSearchQueryOverrideAllowedKeys());
        $unexpected = array_diff(array_keys($raw), $allowed);
        if ($unexpected !== []) {
            throw new InvalidArgumentException(
                'Unsupported cachedFreetextQueries field(s): ' . implode(', ', $unexpected)
            );
        }
        $maxLength = muginPublicSearchQueryOverrideMaxLength();
        $normalized = [];
        foreach ($allowed as $key) {
            if (!array_key_exists($key, $raw)) {
                continue;
            }
            $value = $raw[$key];
            if (!is_string($value)) {
                throw new InvalidArgumentException('cachedFreetextQueries.' . $key . ' must be a string');
            }
            $trimmed = trim(str_replace("\0", '', $value));
            if ($trimmed === '') {
                continue;
            }
            if (strlen($trimmed) > $maxLength) {
                throw new InvalidArgumentException(
                    'cachedFreetextQueries.' . $key . ' exceeds maximum length of ' . $maxLength
                );
            }
            $normalized[$key] = $trimmed;
        }
        if (!isset($normalized['input'])) {
            return [];
        }
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchNormalizeStandardStringOptions')) {
    /**
     * Widget `data-standard-string-add` / `data-standard-string` for freetext.
     * Catalog topics still use their own combineWithStandardString flags.
     *
     * @param mixed $raw
     * @return array<string,mixed>
     */
    function muginPublicSearchNormalizeStandardStringOptions($raw): array
    {
        if ($raw === null) {
            return [];
        }
        if (!is_array($raw)) {
            throw new InvalidArgumentException('standardString must be an object');
        }
        $unexpected = array_diff(array_keys($raw), ['add', 'text', 'scope']);
        if ($unexpected !== []) {
            throw new InvalidArgumentException(
                'Unsupported standardString field(s): ' . implode(', ', $unexpected)
            );
        }
        $normalized = [];
        if (array_key_exists('add', $raw)) {
            $normalized['add'] = muginPublicSearchBoolValue($raw['add'], false);
        }
        if (array_key_exists('text', $raw)) {
            if (!is_string($raw['text'])) {
                throw new InvalidArgumentException('standardString.text must be a string');
            }
            $trimmed = trim(str_replace("\0", '', $raw['text']));
            if ($trimmed !== '') {
                $maxLength = muginPublicSearchQueryOverrideMaxLength();
                if (strlen($trimmed) > $maxLength) {
                    throw new InvalidArgumentException(
                        'standardString.text exceeds maximum length of ' . $maxLength
                    );
                }
                $normalized['text'] = $trimmed;
            }
        }
        if (array_key_exists('scope', $raw)) {
            $scope = strtolower(trim((string) $raw['scope']));
            if (!in_array($scope, ['narrow', 'normal', 'broad'], true)) {
                throw new InvalidArgumentException('standardString.scope must be narrow, normal, or broad');
            }
            $normalized['scope'] = $scope;
        }
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchGetRequestCachedFreetextQueries')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,string>
     */
    function muginPublicSearchGetRequestCachedFreetextQueries(array $request): array
    {
        return isset($request['cachedFreetextQueries']) && is_array($request['cachedFreetextQueries'])
            ? $request['cachedFreetextQueries']
            : [];
    }
}

if (!function_exists('muginPublicSearchCachedFreetextQueriesMatchInput')) {
    function muginPublicSearchCachedFreetextQueriesMatchInput(array $cached, string $rawText): bool
    {
        $input = trim((string) ($cached['input'] ?? ''));
        return $input !== '' && $input === trim($rawText);
    }
}

if (!function_exists('muginPublicSearchExpandCachedFreetextQueriesForSelectedSources')) {
    /**
     * Copy the first available semantic cache string onto selected semantic
     * sources that were never translated in this session, so a later search
     * can reuse freetext without calling the LLM again.
     *
     * @param array<string,mixed> $request
     * @param array<string,string> $cached
     * @return array<string,string>
     */
    function muginPublicSearchExpandCachedFreetextQueriesForSelectedSources(array $request, array $cached): array
    {
        if ($cached === [] || !muginPublicSearchCachedFreetextQueriesMatchInput(
            $cached,
            (string) ($request['query']['text'] ?? '')
        )) {
            return $cached;
        }
        $semanticSeed = '';
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            $value = trim((string) ($cached[$sourceKey] ?? ''));
            if ($value !== '') {
                $semanticSeed = $value;
                break;
            }
        }
        if ($semanticSeed === '') {
            return $cached;
        }
        $expanded = $cached;
        foreach ((array) ($request['sources'] ?? []) as $source) {
            $sourceKey = trim((string) $source);
            if (!in_array($sourceKey, ['semanticScholar', 'openAlex', 'elicit'], true)) {
                continue;
            }
            if (trim((string) ($expanded[$sourceKey] ?? '')) !== '') {
                continue;
            }
            $expanded[$sourceKey] = $semanticSeed;
        }
        return $expanded;
    }
}

if (!function_exists('muginPublicSearchCachedFreetextQueriesCoverSelectedSources')) {
    /**
     * @param array<string,mixed> $request
     * @param array<string,string> $cached
     */
    function muginPublicSearchCachedFreetextQueriesCoverSelectedSources(array $request, array $cached): bool
    {
        if ($cached === [] || !muginPublicSearchCachedFreetextQueriesMatchInput(
            $cached,
            (string) ($request['query']['text'] ?? '')
        )) {
            return false;
        }
        $overrides = muginPublicSearchGetRequestQueryOverrides($request);
        $sources = array_values((array) ($request['sources'] ?? []));
        if ($sources === []) {
            return false;
        }
        foreach ($sources as $source) {
            $sourceKey = trim((string) $source);
            if ($sourceKey === '') {
                return false;
            }
            if (trim((string) ($overrides[$sourceKey] ?? '')) !== '') {
                continue;
            }
            if (!isset($cached[$sourceKey]) || $cached[$sourceKey] === '') {
                return false;
            }
        }
        return true;
    }
}

if (!function_exists('muginPublicSearchBuildCachedFreetextSemanticIntent')) {
    /**
     * @param array<string,string> $cached
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildCachedFreetextSemanticIntent(array $cached): array
    {
        $plan = [
            'adaptations' => [
                'semanticScholar' => ['queryOverride' => null],
                'openAlex' => ['queryOverride' => null],
                'elicit' => ['queryOverride' => null],
            ],
        ];
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            $query = trim((string) ($cached[$sourceKey] ?? ''));
            $plan[$sourceKey] = ['query' => $query, 'filters' => []];
        }
        $core = trim((string) (
            $cached['semanticScholar']
            ?? $cached['openAlex']
            ?? $cached['elicit']
            ?? ''
        ));
        $plan['coreQuery'] = $core;
        return [
            'semanticIntent' => $core,
            'sourceQueryPlan' => $plan,
        ];
    }
}

if (!function_exists('muginPublicSearchApplyCachedFreetextQueriesToDraft')) {
    /**
     * Reuse a previous freetext translation before topics/limits are combined.
     *
     * @param array<string,mixed> $request
     * @param array<string,mixed> $sourceQueryPlan
     * @param array<string,string> $cached
     * @param array<string,mixed>|null $llmSemanticIntent
     * @return array{pubmedQuery:string,sourceQueryPlan:array<string,mixed>,applied:bool}
     */
    function muginPublicSearchApplyCachedFreetextQueriesToDraft(
        array $request,
        string $pubmedQuery,
        array $sourceQueryPlan,
        array $cached,
        ?array $llmSemanticIntent = null
    ): array {
        $applied = false;
        if (!muginPublicSearchCachedFreetextQueriesMatchInput($cached, (string) ($request['query']['text'] ?? ''))) {
            return [
                'pubmedQuery' => $pubmedQuery,
                'sourceQueryPlan' => $sourceQueryPlan,
                'applied' => false,
            ];
        }
        if (!empty($cached['pubmed'])) {
            $pubmedQuery = $cached['pubmed'];
            $applied = true;
        }
        $hasCachedSemantic = false;
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            if (!empty($cached[$sourceKey])) {
                $hasCachedSemantic = true;
                break;
            }
        }
        if ($hasCachedSemantic) {
            if ($sourceQueryPlan === []) {
                $semanticQuery = trim((string) (
                    $cached['semanticScholar']
                    ?? $cached['openAlex']
                    ?? $cached['elicit']
                    ?? ''
                ));
                $sourceQueryPlan = muginPublicSearchBuildSourceQueryPlan(
                    $request,
                    $semanticQuery,
                    $llmSemanticIntent ?? muginPublicSearchBuildCachedFreetextSemanticIntent($cached)
                );
            }
            foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
                if (empty($cached[$sourceKey])) {
                    continue;
                }
                if (!isset($sourceQueryPlan[$sourceKey]) || !is_array($sourceQueryPlan[$sourceKey])) {
                    $sourceQueryPlan[$sourceKey] = ['query' => '', 'filters' => []];
                }
                $sourceQueryPlan[$sourceKey]['query'] = $cached[$sourceKey];
                $applied = true;
            }
        }
        return [
            'pubmedQuery' => $pubmedQuery,
            'sourceQueryPlan' => $sourceQueryPlan,
            'applied' => $applied,
        ];
    }
}

if (!function_exists('muginPublicSearchApplyQueryOverrides')) {
    /**
     * Overlay client-provided executable queries onto resolvedQueries.
     * PubMed override replaces pubmedQuery only; hardFilterQuery (limits) is kept
     * and AND'ed later. Other sources replace sourceQueryPlan[source].query and keep filters.
     *
     * @param array<string,mixed> $resolvedQueries
     * @param array<string,string> $overrides
     * @param array<int,string> $sources
     * @return array<string,mixed>
     */
    function muginPublicSearchApplyQueryOverrides(array $resolvedQueries, array $overrides, array $sources): array
    {
        $sourceSet = [];
        foreach ($sources as $source) {
            $sourceKey = trim((string) $source);
            if ($sourceKey !== '') {
                $sourceSet[$sourceKey] = true;
            }
        }
        $applied = [];
        if (isset($overrides['pubmed']) && isset($sourceSet['pubmed'])) {
            $resolvedQueries['pubmedQuery'] = $overrides['pubmed'];
            $applied['pubmed'] = true;
        }
        $plan = isset($resolvedQueries['sourceQueryPlan']) && is_array($resolvedQueries['sourceQueryPlan'])
            ? $resolvedQueries['sourceQueryPlan']
            : [];
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            if (!isset($overrides[$sourceKey]) || !isset($sourceSet[$sourceKey])) {
                continue;
            }
            if (!isset($plan[$sourceKey]) || !is_array($plan[$sourceKey])) {
                $plan[$sourceKey] = ['query' => '', 'filters' => []];
            }
            $plan[$sourceKey]['query'] = $overrides[$sourceKey];
            $applied[$sourceKey] = true;
        }
        $resolvedQueries['sourceQueryPlan'] = $plan;
        $resolvedQueries['queryOverrideApplied'] = $applied;
        return $resolvedQueries;
    }
}

if (!function_exists('muginPublicSearchAttachExecutedSourceQueriesToProcessReport')) {
    /**
     * Replace process-report sourceQueries with the executable plan (after
     * queryOverrides), so Detaljer matches the strings that were actually searched.
     *
     * @param array<string,mixed> $processReport
     * @param array<string,mixed> $sourceQueryPlan
     * @param array<string,mixed> $request
     * @param array<string,bool> $queryOverrideApplied
     * @return array<string,mixed>
     */
    function muginPublicSearchAttachExecutedSourceQueriesToProcessReport(
        array $processReport,
        array $sourceQueryPlan,
        array $request,
        array $queryOverrideApplied = []
    ): array {
        $sourceQueries = [];
        foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
            if (!in_array($sourceKey, (array) ($request['sources'] ?? []), true)) {
                continue;
            }
            $plan = isset($sourceQueryPlan[$sourceKey]) && is_array($sourceQueryPlan[$sourceKey])
                ? $sourceQueryPlan[$sourceKey]
                : [];
            $query = trim((string) ($plan['query'] ?? ''));
            if ($query === '') {
                continue;
            }
            $sourceQueries[] = [
                'source' => $sourceKey,
                'query' => $query,
                'filters' => isset($plan['filters']) && is_array($plan['filters'])
                    ? $plan['filters']
                    : new stdClass(),
            ];
        }
        $processReport['sourceQueries'] = $sourceQueries;
        if ($queryOverrideApplied !== []) {
            $processReport['queryOverrideApplied'] = $queryOverrideApplied;
        }
        return $processReport;
    }
}

if (!function_exists('muginPublicSearchMergeQueryOverrideRequestMeta')) {
    /**
     * @param array<string,mixed> $resolvedQueries
     * @param array<string,mixed> $requestMeta
     * @return array<string,mixed>
     */
    function muginPublicSearchMergeQueryOverrideRequestMeta(
        array $resolvedQueries,
        string $source,
        array $requestMeta = []
    ): array {
        if (!empty($resolvedQueries['queryOverrideApplied'][$source])) {
            $requestMeta['queryOverrideApplied'] = true;
        }
        return $requestMeta;
    }
}

if (!function_exists('muginPublicSearchBuildResolvedQueries')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildResolvedQueries(array $request, ?callable $progressCallback = null): array
    {
        $domain = (string) ($request['domain'] ?? '');
        $language = (string) ($request['query']['language'] ?? 'auto');
        $rawText = trim((string) ($request['query']['text'] ?? ''));
        $translationMode = (string) ($request['translation']['mode'] ?? 'auto');

        $intentContext = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];

        $topicCatalogQuery = '';
        $topicQueryWarnings = (array) ($request['_topicHydrationWarnings'] ?? []);
        $standardString = isset($request['_topicStandardString']) && is_array($request['_topicStandardString'])
            ? $request['_topicStandardString']
            : [];
        $topicGroups = (array) ($intentContext['selectedTopicGroups'] ?? []);
        $hasCatalogTopicIds = false;
        $hasTranslatedCustomTopics = false;
        foreach ($topicGroups as $group) {
            if (!is_array($group)) {
                continue;
            }
            foreach ($group as $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                if (empty($entry['custom']) && trim((string) ($entry['id'] ?? '')) !== '') {
                    $hasCatalogTopicIds = true;
                }
                if (!empty($entry['custom']) && !empty($entry['translated'])) {
                    $hasTranslatedCustomTopics = true;
                }
            }
        }
        if ($hasCatalogTopicIds || $hasTranslatedCustomTopics) {
            $catalogPayload = $hasCatalogTopicIds
                ? muginPublicSearchLoadTopicNodeCatalog($domain)
                : ['nodes' => []];
            $topicBuilt = muginPublicSearchBuildSelectedTopicPubMedQuery(
                $topicGroups,
                (array) ($catalogPayload['nodes'] ?? []),
                $standardString,
                ($request['_applyStandardStringToFreetext'] ?? true) === true
            );
            $topicCatalogQuery = trim((string) ($topicBuilt['query'] ?? ''));
            $topicQueryWarnings = muginPublicSearchDedupeStrings(array_merge(
                $topicQueryWarnings,
                (array) ($topicBuilt['warnings'] ?? [])
            ));
        }

        // Catalog-only searches still need a semantic seed from hydrated labels.
        if ($rawText === '' && !empty($intentContext['selectedTopics'])) {
            $rawText = trim(implode(' ', muginPublicSearchNormalizeSimpleList($intentContext['selectedTopics'])));
        }

        $pubmedQuery = $rawText;
        $semanticQuery = $rawText;
        $queryIntent = [];
        $semanticIntentResult = null;
        $semanticIntentMeta = [];
        $translationProcessReport = null;
        $semanticProcessReport = [];
        $intentProcessReport = [];
        $sourceQueryPlan = [];
        $pubmedTranslationPrefetched = false;
        $earlyPrefetchedSources = [];
        $earlySourceStartedAt = [];
        $queryOverrides = muginPublicSearchGetRequestQueryOverrides($request);
        $hasQueryOverrides = $queryOverrides !== [];
        $skipLlmForCompleteOverrides = muginPublicSearchQueryOverridesCoverAllSelectedSources($request);
        $cachedFreetextQueries = muginPublicSearchExpandCachedFreetextQueriesForSelectedSources(
            $request,
            muginPublicSearchGetRequestCachedFreetextQueries($request)
        );
        $cachedFreetextHit = muginPublicSearchCachedFreetextQueriesMatchInput($cachedFreetextQueries, $rawText);
        $skipLlmForCachedFreetext = muginPublicSearchCachedFreetextQueriesCoverSelectedSources(
            $request,
            $cachedFreetextQueries
        );
        $hasFreetextInput = trim((string) ($request['query']['text'] ?? '')) !== '';
        if (
            $translationMode === 'auto'
            && $hasFreetextInput
            && !$skipLlmForCompleteOverrides
            && !$skipLlmForCachedFreetext
        ) {
            // Intent first (prerequisite for PubMed aiCoreQuery). After that,
            // source-query adaptation and PubMed translation run together.
            // When intent already has coreQuery / per-source queries, skip the
            // extra TranslateSemanticQuery LLM call.
            if (muginPublicSearchIsUnifiedSearchEngineEnabled()) {
                muginPublicSearchEmitProgress($progressCallback, 'semanticIntent', '', [
                    'stepId' => 'semanticIntent',
                    'groupId' => muginPublicSearchPrepareProgressGroupId($request),
                    'groupKey' => muginPublicSearchPrepareProgressGroupKey($request),
                    'messageKey' => muginPublicSearchSemanticIntentProgressMessageKey($request),
                ]);
                $extraction = muginPublicSearchExtractSemanticIntent($rawText, $language, $domain, $intentContext);
                $semanticIntentResult = $extraction['intent'];
                $semanticIntentMeta = $extraction['meta'];
                $queryIntent = muginPublicSearchBuildQueryIntentFromSemanticIntent($semanticIntentResult);

                $skipSemanticTranslation = muginPublicSearchSemanticIntentHasUsableQueries($semanticIntentResult)
                    && ($semanticIntentMeta['fallbackUsed'] ?? true) === false;
                if ($skipSemanticTranslation) {
                    $semanticQuery = muginPublicSearchResolveSemanticQueryFromIntent(
                        $semanticIntentResult,
                        $semanticQuery
                    );
                }

                $semanticSources = array_values(array_intersect(
                    (array) ($request['sources'] ?? []),
                    ['semanticScholar', 'openAlex', 'elicit']
                ));
                $provisionalSourceQueryPlan = muginPublicSearchBuildSourceQueryPlan(
                    $request,
                    $semanticQuery,
                    $semanticIntentResult
                );
                $semanticIntentCompletedEarly = false;
                if ($skipSemanticTranslation) {
                    $sourceQueryPlan = $provisionalSourceQueryPlan;
                    $intentProcessReport = muginPublicSearchBuildCombinedSemanticIntentProcessReport(
                        $request,
                        $semanticIntentResult,
                        $semanticIntentMeta,
                        $semanticQuery,
                        $sourceQueryPlan,
                        true
                    );
                    $semanticProcessReport = $intentProcessReport;
                    muginPublicSearchProcessDetailsEmitCompletedPayload(
                        'semanticIntent',
                        $intentProcessReport,
                        $progressCallback
                    );
                    $semanticIntentCompletedEarly = true;
                }
                $canStartSemanticSourcesEarly =
                    !$hasQueryOverrides
                    && !$cachedFreetextHit
                    && ($semanticIntentMeta['fallbackUsed'] ?? true) === false
                    && $skipSemanticTranslation;
                $onEarlySourceStart = static function (array $sourceKeys) use (
                    &$earlySourceStartedAt,
                    $progressCallback,
                    $request
                ): void {
                    $startedAt = microtime(true);
                    $messageKeys = [
                        'semanticScholar' => 'semanticSearchProgressSemanticScholar',
                        'openAlex' => 'semanticSearchProgressOpenAlex',
                        'elicit' => 'semanticSearchProgressElicit',
                    ];
                    foreach ($sourceKeys as $sourceKey) {
                        if (!isset($messageKeys[$sourceKey])) {
                            continue;
                        }
                        $earlySourceStartedAt[$sourceKey] = $startedAt;
                        muginPublicSearchEmitProgress($progressCallback, $sourceKey, '', [
                            'stepId' => $sourceKey,
                            'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                            'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                            'messageKey' => $messageKeys[$sourceKey],
                            'source' => $sourceKey,
                        ]);
                    }
                };
                $includePubMedTranslation = in_array('pubmed', (array) $request['sources'], true)
                    && empty($queryOverrides['pubmed'])
                    && empty($cachedFreetextQueries['pubmed']);
                if ($includePubMedTranslation) {
                    muginPublicSearchEmitProgress($progressCallback, 'searchString', '', [
                        'stepId' => 'searchString',
                        'groupId' => muginPublicSearchPrepareProgressGroupId($request),
                        'groupKey' => muginPublicSearchPrepareProgressGroupKey($request),
                        'messageKey' => 'semanticSearchProgressSearchString',
                    ]);
                }
                if ($includePubMedTranslation || ($canStartSemanticSourcesEarly && !empty($semanticSources))) {
                    $earlyPrefetchedSources = muginPublicSearchPrefetchParallelTranslationRequests(
                        $rawText,
                        $language,
                        $semanticIntentResult,
                        (array) ($request['hardFilters'] ?? []),
                        $intentContext,
                        $domain,
                        $canStartSemanticSourcesEarly ? $semanticSources : [],
                        $provisionalSourceQueryPlan,
                        $request,
                        $onEarlySourceStart,
                        !$skipSemanticTranslation,
                        $includePubMedTranslation
                    );
                    $pubmedTranslationPrefetched = $includePubMedTranslation;
                }

                if (!$skipSemanticTranslation) {
                    $translatedSemantic = muginPublicSearchTranslateSemanticQuery($rawText, $language, $domain);
                    if (trim($translatedSemantic) !== '') {
                        $semanticQuery = trim($translatedSemantic);
                    }
                }
                $sourceQueryPlan = muginPublicSearchBuildSourceQueryPlan(
                    $request,
                    $semanticQuery,
                    $semanticIntentResult
                );
                $intentProcessReport = muginPublicSearchBuildCombinedSemanticIntentProcessReport(
                    $request,
                    $semanticIntentResult,
                    $semanticIntentMeta,
                    $semanticQuery,
                    $sourceQueryPlan,
                    $skipSemanticTranslation
                );
                $semanticProcessReport = $intentProcessReport;
                if (!$semanticIntentCompletedEarly) {
                    muginPublicSearchProcessDetailsEmitCompletedPayload(
                        'semanticIntent',
                        $intentProcessReport,
                        $progressCallback
                    );
                }
            }

            if (
                in_array('pubmed', (array) $request['sources'], true)
                && empty($cachedFreetextQueries['pubmed'])
                && empty($queryOverrides['pubmed'])
            ) {
                $translatedPubMed = muginPublicSearchTranslatePubMedQuery(
                    $rawText,
                    $language,
                    $domain,
                    $semanticIntentResult,
                    (array) ($request['hardFilters'] ?? []),
                    $progressCallback,
                    $intentContext,
                    $semanticIntentMeta,
                    muginPublicSearchProcessDetailsWantsCollection($request),
                    !$pubmedTranslationPrefetched,
                    $translationProcessReport,
                    $request
                );
                if (trim($translatedPubMed) !== '') {
                    $pubmedQuery = trim($translatedPubMed);
                }
            }
            if (empty($sourceQueryPlan) && muginPublicSearchRequestHasSemanticSources($request)) {
                $translatedSemantic = muginPublicSearchTranslateSemanticQuery($rawText, $language, $domain);
                if (trim($translatedSemantic) !== '') {
                    $semanticQuery = trim($translatedSemantic);
                }
            }
        } elseif (
            !$skipLlmForCompleteOverrides
            && $translationMode === 'auto'
            && !$hasFreetextInput
            && $rawText !== ''
            && muginPublicSearchRequestHasSemanticSources($request)
        ) {
            // Catalog-only + semantic sources: translate labels into an English
            // core query. PubMed-only catalog searches skip this LLM call.
            muginPublicSearchEmitProgress($progressCallback, 'semanticIntent', '', [
                'stepId' => 'semanticIntent',
                'groupId' => muginPublicSearchPrepareProgressGroupId($request),
                'groupKey' => muginPublicSearchPrepareProgressGroupKey($request),
                'messageKey' => muginPublicSearchSemanticIntentProgressMessageKey($request),
            ]);
            $translatedSemantic = muginPublicSearchTranslateSemanticQuery($rawText, $language, $domain);
            if (trim($translatedSemantic) !== '') {
                $semanticQuery = trim($translatedSemantic);
            }
            $sourceQueryPlan = muginPublicSearchBuildSourceQueryPlan($request, $semanticQuery, $semanticIntentResult);
            $intentProcessReport = muginPublicSearchBuildCombinedSemanticIntentProcessReport(
                $request,
                $semanticIntentResult,
                $semanticIntentMeta,
                $semanticQuery,
                $sourceQueryPlan,
                false
            );
            $semanticProcessReport = $intentProcessReport;
            muginPublicSearchProcessDetailsEmitCompletedPayload(
                'semanticIntent',
                $intentProcessReport,
                $progressCallback
            );
        }

        $cachedFreetextApplied = false;
        if ($cachedFreetextHit) {
            $cachedDraft = muginPublicSearchApplyCachedFreetextQueriesToDraft(
                $request,
                $pubmedQuery,
                $sourceQueryPlan,
                $cachedFreetextQueries,
                $semanticIntentResult
            );
            $pubmedQuery = $cachedDraft['pubmedQuery'];
            $sourceQueryPlan = $cachedDraft['sourceQueryPlan'];
            $cachedFreetextApplied = $cachedDraft['applied'] === true;
            if ($cachedFreetextApplied && trim($semanticQuery) === trim($rawText)) {
                $semanticQuery = trim((string) (
                    $cachedFreetextQueries['semanticScholar']
                    ?? $cachedFreetextQueries['openAlex']
                    ?? $cachedFreetextQueries['elicit']
                    ?? $semanticQuery
                ));
            }
        }
        $translatedFreetextPubMedQuery = '';
        if ($hasFreetextInput) {
            $clause = trim((string) $pubmedQuery);
            if ($clause !== '') {
                $translatedFreetextPubMedQuery = $clause;
            }
        }
        if ($cachedFreetextApplied && empty($intentProcessReport) && $sourceQueryPlan !== []) {
            $intentProcessReport = muginPublicSearchBuildCombinedSemanticIntentProcessReport(
                $request,
                $semanticIntentResult ?? muginPublicSearchBuildCachedFreetextSemanticIntent($cachedFreetextQueries),
                array_merge($semanticIntentMeta, ['cacheHit' => true]),
                $semanticQuery,
                $sourceQueryPlan,
                true
            );
            $intentProcessReport['cachedFreetextQueriesUsed'] = true;
            $semanticProcessReport = $intentProcessReport;
            muginPublicSearchProcessDetailsEmitCompletedPayload(
                'semanticIntent',
                $intentProcessReport,
                $progressCallback
            );
        } elseif ($cachedFreetextApplied && !empty($intentProcessReport)) {
            $intentProcessReport['cachedFreetextQueriesUsed'] = true;
        }

        // Freetext PubMed clause (+ domain standardString); catalog topics stay deterministic.
        $freetextPubMedQuery = '';
        $rawFreetextSanitized = false;
        $rawFreetextBeforeSanitize = '';
        if ($hasFreetextInput) {
            $freetextPubMedQuery = trim((string) $pubmedQuery);
            if (
                $translationMode === 'none'
                && empty($queryOverrides['pubmed'])
            ) {
                $normalizedRaw = muginPublicSearchNormalizeRawFreetextForPubMed($freetextPubMedQuery);
                if ($normalizedRaw['changed']) {
                    $rawFreetextBeforeSanitize = $freetextPubMedQuery;
                    $freetextPubMedQuery = $normalizedRaw['value'];
                    $pubmedQuery = $freetextPubMedQuery;
                    $translatedFreetextPubMedQuery = $freetextPubMedQuery;
                    $rawFreetextSanitized = true;
                }
            }
            if (muginPublicSearchPubmedQueryContainsTranslationFailureText($freetextPubMedQuery)) {
                $freetextPubMedQuery = muginPublicSearchBuildUntranslatedPubmedFallbackQuery(
                    $rawText,
                    $semanticIntentResult
                );
                $pubmedQuery = $freetextPubMedQuery;
            }
            if (
                $freetextPubMedQuery !== ''
                && !empty($standardString)
                && ($request['_applyStandardStringToFreetext'] ?? true) === true
            ) {
                $scope = (string) ($request['_standardStringScope'] ?? 'normal');
                $standardValue = trim((string) ($standardString[$scope] ?? ($standardString['normal'] ?? '')));
                if ($standardValue !== '') {
                    $combinedNorm = strtolower(preg_replace('/\s+/', ' ', $freetextPubMedQuery) ?? $freetextPubMedQuery);
                    $standardNorm = strtolower(preg_replace('/\s+/', ' ', $standardValue) ?? $standardValue);
                    if ($standardNorm !== '' && strpos($combinedNorm, $standardNorm) === false) {
                        $freetextPubMedQuery = '(' . $freetextPubMedQuery . ') AND (' . $standardValue . ')';
                    }
                }
            }
        }
        if ($topicCatalogQuery !== '' && $freetextPubMedQuery !== '') {
            $pubmedQuery = '(' . $topicCatalogQuery . ') AND (' . $freetextPubMedQuery . ')';
        } elseif ($topicCatalogQuery !== '') {
            $pubmedQuery = $topicCatalogQuery;
        } elseif ($freetextPubMedQuery !== '') {
            $pubmedQuery = $freetextPubMedQuery;
        }

        $selectedLimitGroups = (array) ($request['intentContext']['selectedLimitGroups'] ?? []);
        if (!empty($selectedLimitGroups)) {
            $limitQueryInput = $selectedLimitGroups;
        } else {
            $limitQueryInput = (array) ($request['intentContext']['selectedLimitSelections'] ?? []);
            if (empty($limitQueryInput)) {
                $limitQueryInput = (array) ($request['intentContext']['selectedLimitIds'] ?? []);
            }
        }
        $hardFilterQuery = muginPublicSearchBuildHardFilterQuery(
            (array) ($request['hardFilters'] ?? []),
            $limitQueryInput
        );
        if (empty($sourceQueryPlan)) {
            $sourceQueryPlan = muginPublicSearchBuildSourceQueryPlan($request, $semanticQuery, $semanticIntentResult);
        }
        $appliedResolved = muginPublicSearchApplyQueryOverrides(
            [
                'pubmedQuery' => $pubmedQuery,
                'hardFilterQuery' => (string) ($hardFilterQuery['query'] ?? ''),
                'sourceQueryPlan' => $sourceQueryPlan,
            ],
            $queryOverrides,
            (array) ($request['sources'] ?? [])
        );
        $queryOverrideApplied = is_array($appliedResolved['queryOverrideApplied'] ?? null)
            ? $appliedResolved['queryOverrideApplied']
            : [];
        $pubmedQuery = (string) ($appliedResolved['pubmedQuery'] ?? $pubmedQuery);
        $hardFilterQuery['query'] = (string) ($appliedResolved['hardFilterQuery'] ?? ($hardFilterQuery['query'] ?? ''));
        $sourceQueryPlan = is_array($appliedResolved['sourceQueryPlan'] ?? null)
            ? $appliedResolved['sourceQueryPlan']
            : $sourceQueryPlan;
        if ($skipLlmForCompleteOverrides) {
            $semanticFromOverride = '';
            foreach (['semanticScholar', 'openAlex', 'elicit'] as $sourceKey) {
                if (!empty($queryOverrides[$sourceKey]) && in_array($sourceKey, (array) ($request['sources'] ?? []), true)) {
                    $semanticFromOverride = $queryOverrides[$sourceKey];
                    break;
                }
            }
            if ($semanticFromOverride === '' && !empty($queryOverrides['pubmed'])) {
                $semanticFromOverride = $queryOverrides['pubmed'];
            }
            if ($semanticFromOverride !== '') {
                $semanticQuery = $semanticFromOverride;
            }
        }
        if ($queryOverrideApplied !== []) {
            $semanticProcessReport = muginPublicSearchBuildSemanticQueryProcessReport(
                $request,
                $semanticIntentResult,
                $semanticIntentMeta,
                $semanticQuery,
                $sourceQueryPlan,
                $skipLlmForCompleteOverrides
            );
            $semanticProcessReport['queryOverrideApplied'] = $queryOverrideApplied;
            if (!empty($intentProcessReport)) {
                $intentProcessReport = muginPublicSearchAttachExecutedSourceQueriesToProcessReport(
                    $intentProcessReport,
                    $sourceQueryPlan,
                    $request,
                    $queryOverrideApplied
                );
            } else {
                $intentProcessReport = $semanticProcessReport;
            }
        }
        $postValidationRuleState = muginPublicSearchBuildPostValidationRuleState($request);
        $processReports = $translationProcessReport ?? [];
        if (!empty($intentProcessReport)) {
            $processReports['semanticIntent'] = $intentProcessReport;
        }
        if (!empty($semanticProcessReport)) {
            $processReports['semanticQuery'] = $semanticProcessReport;
        }
        // Process-details "searchString" is filled during AI translation (freetext only).
        // Surface the catalog clause on that payload when both are present.
        if ($topicCatalogQuery !== '' && is_array($processReports['searchString'] ?? null)) {
            $processReports['searchString']['topicCatalogQuery'] = $topicCatalogQuery;
            $processReports['searchString']['finalValidatedQuery'] = $pubmedQuery;
            $processReports['searchString']['pubmedQuery'] = $pubmedQuery;
        }
        if ($cachedFreetextApplied) {
            $searchStringPayload = is_array($processReports['searchString'] ?? null)
                ? $processReports['searchString']
                : [];
            if ($translatedFreetextPubMedQuery !== '' && empty($searchStringPayload['pubmedQuery'])) {
                $searchStringPayload['input'] = $rawText;
                $searchStringPayload['pubmedQuery'] = $translatedFreetextPubMedQuery;
                $searchStringPayload['finalValidatedQuery'] = $pubmedQuery;
            }
            $searchStringPayload['cachedFreetextQueriesUsed'] = true;
            $processReports['searchString'] = $searchStringPayload;
        }
        if (!empty($queryOverrideApplied['pubmed'])) {
            $searchStringPayload = is_array($processReports['searchString'] ?? null)
                ? $processReports['searchString']
                : [];
            $searchStringPayload['pubmedQuery'] = $pubmedQuery;
            $searchStringPayload['finalValidatedQuery'] = $pubmedQuery;
            $searchStringPayload['queryOverrideApplied'] = true;
            $processReports['searchString'] = $searchStringPayload;
        } elseif ($rawFreetextSanitized) {
            $searchStringPayload = is_array($processReports['searchString'] ?? null)
                ? $processReports['searchString']
                : [];
            $searchStringPayload['input'] = $rawFreetextBeforeSanitize !== ''
                ? $rawFreetextBeforeSanitize
                : $rawText;
            $searchStringPayload['pubmedQuery'] = $pubmedQuery;
            $searchStringPayload['finalValidatedQuery'] = $pubmedQuery;
            $searchStringPayload['rawFreetextSanitized'] = true;
            $processReports['searchString'] = $searchStringPayload;
        }

        return [
            'semanticIntent' => $semanticQuery,
            'pubmedQuery' => $pubmedQuery,
            'hardFilterQuery' => $hardFilterQuery['query'],
            'sourceQueryPlan' => $sourceQueryPlan,
            'queryIntent' => $queryIntent,
            'warnings' => muginPublicSearchDedupeStrings(array_merge(
                (array) ($hardFilterQuery['warnings'] ?? []),
                $topicQueryWarnings
            )),
            // Process-details/diagnostics-only fields (not part of the public
            // resolvedQueries response contract - see
            // muginPublicSearchBuildFinalResponse()'s allow-listed projection).
            'llmSemanticIntent' => $semanticIntentResult,
            'semanticIntentMeta' => $semanticIntentMeta,
            'processReports' => $processReports,
            'postValidationRuleState' => $postValidationRuleState,
            'queryOverrideApplied' => $queryOverrideApplied,
            'freetextPubMedQuery' => $translatedFreetextPubMedQuery,
            'cachedFreetextQueriesUsed' => $cachedFreetextApplied,
            '_earlyPrefetchedSources' => $earlyPrefetchedSources,
            '_earlySourceStartedAt' => $earlySourceStartedAt,
        ];
    }
}

if (!function_exists('muginPublicSearchGetSemanticSourceLimit')) {
    /**
     * @param string $sourceKey
     * @param int $default
     * @return int
     */
    function muginPublicSearchGetSemanticSourceLimit(string $sourceKey, int $default): int
    {
        return function_exists('muginGetSemanticSourceLimit')
            ? muginGetSemanticSourceLimit($sourceKey, $default)
            : $default;
    }
}

if (!function_exists('muginPublicSearchCreateEmptySourceResult')) {
    /**
     * @param string $source
     * @param string $query
     * @param string $error
     * @return array<string,mixed>
     */
    function muginPublicSearchCreateEmptySourceResult(string $source, string $query, string $error = ''): array
    {
        return [
            'source' => $source,
            'query' => $query,
            'total' => 0,
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
            'error' => trim($error),
            'warning' => '',
            'partial' => false,
            'retryHints' => [],
            'rateLimit' => null,
            'fallbackUsed' => false,
            'fallbackReason' => '',
            'disabledRequestFields' => [],
            'requestMeta' => [],
            'debug' => null,
        ];
    }
}

if (!function_exists('muginPublicSearchNormalizeSourceCandidate')) {
    /**
     * @param array<string,mixed> $candidate
     * @param string $source
     * @param int $fallbackRank
     * @return ?array<string,mixed>
     */
    function muginPublicSearchNormalizeSourceCandidate(array $candidate, string $source, int $fallbackRank): ?array
    {
        $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
        $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
        if ($pmid === '' && $doi === '') {
            return null;
        }

        $parsedRank = (int) ($candidate['rank'] ?? 0);
        $parsedScore = is_numeric($candidate['score'] ?? null) ? (float) $candidate['score'] : null;
        $metadata = isset($candidate['metadata']) && is_array($candidate['metadata']) ? $candidate['metadata'] : [];

        return [
            'source' => $source,
            'rank' => $parsedRank > 0 ? $parsedRank : $fallbackRank,
            'pmid' => $pmid,
            'doi' => $doi,
            'title' => trim((string) ($candidate['title'] ?? '')),
            'abstract' => trim((string) ($candidate['abstract'] ?? '')),
            'score' => $parsedScore,
            'openAlexId' => trim((string) ($candidate['openAlexId'] ?? '')),
            'metadata' => [
                'publicationYear' => trim((string) ($metadata['publicationYear'] ?? ($metadata['year'] ?? ''))),
                'venue' => trim((string) ($metadata['venue'] ?? ($metadata['sourceDisplayName'] ?? ($metadata['sourceAbbreviatedTitle'] ?? '')))),
                'workType' => trim((string) ($metadata['workType'] ?? '')),
                'sourceType' => trim((string) ($metadata['sourceType'] ?? '')),
                'sourceDisplayName' => trim((string) ($metadata['sourceDisplayName'] ?? '')),
                'sourceAbbreviatedTitle' => trim((string) ($metadata['sourceAbbreviatedTitle'] ?? '')),
                'publicationTypes' => muginPublicSearchNormalizeSimpleList($metadata['publicationTypes'] ?? []),
                'lexicalRescue' => ($metadata['lexicalRescue'] ?? false) === true,
                'lexicalRescueAbstractAvailable' => ($metadata['lexicalRescueAbstractAvailable'] ?? false) === true,
                'lexicalRescueTriggerReason' => trim((string) ($metadata['lexicalRescueTriggerReason'] ?? '')),
                'citedByCount' => isset($metadata['citedByCount']) && is_numeric($metadata['citedByCount'])
                    ? (int) $metadata['citedByCount']
                    : null,
                // Semantic Scholar's citation-count field is named 'citationCount', not
                // 'citedByCount'; the rerank engine reads metadata.citedByCount ??
                // metadata.citationCount, so both keys need to survive normalization.
                'citationCount' => isset($metadata['citationCount']) && is_numeric($metadata['citationCount'])
                    ? (int) $metadata['citationCount']
                    : null,
                'authors' => muginPublicSearchNormalizeSimpleList($metadata['authors'] ?? []),
                'authorNames' => muginPublicSearchNormalizeSimpleList($metadata['authorNames'] ?? []),
                'publicationDate' => trim((string) ($metadata['publicationDate'] ?? '')),
                'fwci' => isset($metadata['fwci']) && is_numeric($metadata['fwci']) ? (float) $metadata['fwci'] : null,
                'isRetracted' => is_bool($metadata['isRetracted'] ?? null) ? $metadata['isRetracted'] : null,
                'isOpenAccess' => is_bool($metadata['isOpenAccess'] ?? null) ? $metadata['isOpenAccess'] : null,
                'primaryTopicId' => trim((string) ($metadata['primaryTopicId'] ?? '')),
                'primaryTopicDisplayName' => trim((string) ($metadata['primaryTopicDisplayName'] ?? '')),
                'openAlexTopics' => muginPublicSearchNormalizeSimpleList($metadata['openAlexTopics'] ?? []),
                'openAlexKeywords' => muginPublicSearchNormalizeSimpleList($metadata['openAlexKeywords'] ?? []),
                'openAlexSubfields' => muginPublicSearchNormalizeSimpleList($metadata['openAlexSubfields'] ?? []),
                'language' => trim((string) ($metadata['language'] ?? '')),
                'publisher' => trim((string) ($metadata['publisher'] ?? '')),
                'journalSourceId' => trim((string) ($metadata['journalSourceId'] ?? '')),
                'abstract' => trim((string) ($metadata['abstract'] ?? '')),
                'hasAbstract' => ($metadata['hasAbstract'] ?? false) === true,
                'abstractLength' => isset($metadata['abstractLength']) && is_numeric($metadata['abstractLength'])
                    ? (int) $metadata['abstractLength']
                    : null,
                'influentialCitationCount' => isset($metadata['influentialCitationCount']) && is_numeric($metadata['influentialCitationCount'])
                    ? (int) $metadata['influentialCitationCount']
                    : null,
                's2FieldsOfStudy' => muginPublicSearchNormalizeSimpleList($metadata['s2FieldsOfStudy'] ?? []),
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchNormalizeSourceResult')) {
    /**
     * @param string $source
     * @param string $query
     * @param array<string,mixed> $payload
     * @param string $error
     * @return array<string,mixed>
     */
    function muginPublicSearchNormalizeSourceResult(string $source, string $query, array $payload, string $error = ''): array
    {
        $candidates = [];
        foreach ((array) ($payload['candidates'] ?? []) as $index => $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $normalized = muginPublicSearchNormalizeSourceCandidate($candidate, $source, $index + 1);
            if ($normalized !== null) {
                $candidates[] = $normalized;
            }
        }

        $pmids = muginPublicSearchDedupeStrings(
            !empty($payload['pmids']) ? (array) $payload['pmids'] : array_map(static function ($candidate) {
                return $candidate['pmid'] ?? '';
            }, $candidates),
            'muginPublicSearchNormalizePmid'
        );
        $dois = muginPublicSearchDedupeStrings(
            !empty($payload['dois']) ? (array) $payload['dois'] : array_map(static function ($candidate) {
                return $candidate['doi'] ?? '';
            }, $candidates),
            'muginPublicSearchNormalizeDoi'
        );

        return [
            'source' => $source,
            'query' => $query,
            'total' => is_numeric($payload['total'] ?? null) ? (int) $payload['total'] : count($candidates),
            'pmids' => $pmids,
            'dois' => $dois,
            'candidates' => $candidates,
            'error' => trim($error),
            'warning' => trim((string) ($payload['warning'] ?? '')),
            'partial' => ($payload['partial'] ?? false) === true,
            'retryHints' => isset($payload['retryHints']) && is_array($payload['retryHints']) ? $payload['retryHints'] : [],
            'rateLimit' => isset($payload['rateLimit']) && is_array($payload['rateLimit']) ? $payload['rateLimit'] : null,
            'fallbackUsed' => ($payload['fallbackUsed'] ?? false) === true,
            'fallbackReason' => trim((string) ($payload['fallbackReason'] ?? '')),
            'disabledRequestFields' => muginPublicSearchNormalizeSimpleList($payload['disabledRequestFields'] ?? []),
            'requestMeta' => isset($payload['requestMeta']) && is_array($payload['requestMeta'])
                ? $payload['requestMeta']
                : [],
            'debug' => isset($payload['debug']) && is_array($payload['debug']) ? $payload['debug'] : null,
        ];
    }
}

if (!function_exists('muginPublicSearchExtractRateLimitFromHttpResult')) {
    /**
     * @param array<string,mixed> $result
     * @return array<string,mixed>
     */
    function muginPublicSearchExtractRateLimitFromHttpResult(array $result): array
    {
        $rateLimit = ['status' => (int) ($result['status'] ?? 0)];
        $headerMap = [];
        foreach ((array) ($result['response_headers'] ?? []) as $headerLine) {
            $parts = explode(':', (string) $headerLine, 2);
            if (count($parts) !== 2) {
                continue;
            }
            $headerMap[strtolower(trim($parts[0]))] = trim($parts[1]);
        }
        foreach ([
            'limit' => ['x-ratelimit-limit', 'ratelimit-limit'],
            'remaining' => ['x-ratelimit-remaining', 'ratelimit-remaining'],
            'reset' => ['x-ratelimit-reset', 'ratelimit-reset'],
            'retryAfter' => ['retry-after'],
        ] as $field => $headerNames) {
            foreach ($headerNames as $headerName) {
                if (isset($headerMap[$headerName]) && is_numeric($headerMap[$headerName])) {
                    $rateLimit[$field] = (int) $headerMap[$headerName];
                    break;
                }
            }
        }
        return $rateLimit;
    }
}

if (!function_exists('muginPublicSearchRememberSourceRateLimitSnapshot')) {
    /**
     * Persist extracted upstream rate-limit headers so RateLimitStatus.php
     * stays fresh on the unified/public-search path (not only proxy endpoints).
     *
     * @param string $sourceKey openAlex|semanticScholar|elicit
     * @param array<string,mixed> $rateLimit
     * @return array<string,mixed>
     */
    function muginPublicSearchRememberSourceRateLimitSnapshot(string $sourceKey, array $rateLimit): array
    {
        if ($rateLimit === [] || !function_exists('muginStoreSourceRateLimitSnapshot')) {
            return $rateLimit;
        }
        $status = (int) ($rateLimit['status'] ?? 0);
        $remaining = array_key_exists('remaining', $rateLimit) ? $rateLimit['remaining'] : null;
        if ($remaining !== null && $remaining !== '') {
            $remaining = max(0, (int) $remaining);
        } elseif ($status === 429) {
            $remaining = 0;
        } else {
            $remaining = null;
        }
        $limit = array_key_exists('limit', $rateLimit) ? $rateLimit['limit'] : null;
        if ($limit !== null && $limit !== '') {
            $limit = (int) $limit;
            if ($limit <= 0) {
                $limit = null;
            }
        } else {
            $limit = null;
        }
        $resetWindow = function_exists('muginParseRateLimitResetWindow')
            ? muginParseRateLimitResetWindow($rateLimit['reset'] ?? '', $rateLimit['retryAfter'] ?? '')
            : ['resetAt' => '', 'resetInSeconds' => null];
        $snapshot = [
            'limit' => $limit,
            'remaining' => $remaining,
            'resetAt' => (string) ($resetWindow['resetAt'] ?? ''),
            'resetInSeconds' => $resetWindow['resetInSeconds'] ?? null,
            'status' => $status,
            'isLimited' => $status === 429 || ($remaining !== null && $remaining <= 0),
        ];
        muginStoreSourceRateLimitSnapshot($sourceKey, $snapshot);
        return array_merge($rateLimit, $snapshot);
    }
}

if (!function_exists('muginPublicSearchIsHttpResultOk')) {
    /**
     * muginHttpRequest()'s 'ok'-flag afspejler kun, om selve transporten (curl)
     * lykkedes - IKKE om upstream svarede med en 2xx-statuskode. Et svar som
     * "402 Payment Required" eller "429 Too Many Requests" er derfor 'ok'
     * ifoelge muginHttpRequest, selvom kaldet reelt blev afvist. Denne helper
     * tjekker begge dele, saa afviste upstream-kald ikke fejlagtigt bliver
     * tolket som "0 resultater fundet".
     *
     * @param array<string,mixed> $result
     * @return bool
     */
    function muginPublicSearchIsHttpResultOk(array $result): bool
    {
        if (($result['ok'] ?? false) !== true) {
            return false;
        }
        $status = (int) ($result['status'] ?? 0);
        return $status >= 200 && $status < 300;
    }
}

if (!function_exists('muginPublicSearchDescribeHttpFailure')) {
    /**
     * @param array<string,mixed> $result
     * @return string
     */
    function muginPublicSearchDescribeHttpFailure(array $result): string
    {
        $error = trim((string) ($result['error'] ?? ''));
        if ($error !== '') {
            return $error;
        }
        $status = (int) ($result['status'] ?? 0);
        if ($status > 0) {
            return 'HTTP ' . $status;
        }
        return 'unknown error';
    }
}

if (!function_exists('muginPublicSearchBuildNlmQueryParams')) {
    /**
     * @param array<string,mixed> $params
     * @param string $domain
     * @return string
     */
    function muginPublicSearchBuildNlmQueryParams(array $params, string $domain = ''): string
    {
        $normalized = $params;
        $apiKey = function_exists('muginGetNlmApiKey') ? muginGetNlmApiKey($domain) : (defined('NLM_API_KEY') ? NLM_API_KEY : '');
        $email = function_exists('muginGetNlmEmail') ? muginGetNlmEmail($domain) : (defined('NLM_EMAIL') ? NLM_EMAIL : '');
        if ($apiKey !== '') {
            $normalized['api_key'] = $apiKey;
        }
        if ($email !== '') {
            $normalized['email'] = $email;
        }
        return http_build_query($normalized);
    }
}

if (!function_exists('muginPublicSearchBuildNlmRequestOptions')) {
    /**
     * NCBI anbefaler HTTP POST i stedet for GET, naar foresp\u00f8rgslen bliver lang
     * (fx mange ID'er i 'id'-parameteren, eller en lang OR-klausul i 'term').
     * Lange GET-URL'er risikerer at blive afvist af proxyer/servere med
     * "414 URI Too Long" - se ogsaa erfaringen fra denne session, hvor en
     * kombineret 4-kilde-soegning gav netop denne fejl. Denne helper skifter
     * automatisk til POST, naar URL'en ville blive for lang, uden at
     * kaldestederne skal vide det.
     *
     * @param string $endpointUrl
     * @param string $queryString
     * @param array<int,string> $baseHeaders
     * @return array{url:string,options:array<string,mixed>}
     */
    function muginPublicSearchBuildNlmRequestOptions(string $endpointUrl, string $queryString, array $baseHeaders): array
    {
        $getUrl = $endpointUrl . '?' . $queryString;
        if (strlen($getUrl) <= 1800) {
            return [
                'url' => $getUrl,
                'options' => [
                    'method' => 'GET',
                    'timeout' => 30,
                    'headers' => $baseHeaders,
                    'user_agent' => 'MuginScholar/1.0',
                ],
            ];
        }
        return [
            'url' => $endpointUrl,
            'options' => [
                'method' => 'POST',
                'timeout' => 30,
                'headers' => array_merge($baseHeaders, ['Content-Type: application/x-www-form-urlencoded']),
                'body' => $queryString,
                'user_agent' => 'MuginScholar/1.0',
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchNlmGetJson')) {
    /**
     * @param string $endpoint
     * @param array<string,mixed> $params
     * @param string $domain
     * @return array<string,mixed>
     */
    function muginPublicSearchNlmGetJson(string $endpoint, array $params, string $domain = ''): array
    {
        $baseUrl = function_exists('muginGetNlmBaseUrl')
            ? muginGetNlmBaseUrl($domain)
            : (defined('NLM_BASE_URL') ? NLM_BASE_URL : 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');
        $endpointUrl = rtrim($baseUrl, '/') . '/' . ltrim($endpoint, '/');
        $queryString = muginPublicSearchBuildNlmQueryParams($params, $domain);
        $requestOptions = muginPublicSearchBuildNlmRequestOptions($endpointUrl, $queryString, ['Accept: application/json']);
        $nlmRate = (function_exists('muginGetNlmApiKey') && muginGetNlmApiKey($domain) !== '') ? 10 : 5;
        muginThrottleRequestRateUnlessPrefetched('nlm', $nlmRate, $requestOptions['url'], $requestOptions['options']);
        $result = muginHttpRequest($requestOptions['url'], $requestOptions['options']);
        if (!muginPublicSearchIsHttpResultOk($result)) {
            throw new RuntimeException('NLM request failed: ' . muginPublicSearchDescribeHttpFailure($result), 502);
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Invalid NLM JSON response', 502);
        }
        return $decoded;
    }
}

if (!function_exists('muginPublicSearchNlmGetXml')) {
    /**
     * @param string $endpoint
     * @param array<string,mixed> $params
     * @param string $domain
     * @return string
     */
    function muginPublicSearchNlmGetXml(string $endpoint, array $params, string $domain = ''): string
    {
        $baseUrl = function_exists('muginGetNlmBaseUrl')
            ? muginGetNlmBaseUrl($domain)
            : (defined('NLM_BASE_URL') ? NLM_BASE_URL : 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');
        $endpointUrl = rtrim($baseUrl, '/') . '/' . ltrim($endpoint, '/');
        $queryString = muginPublicSearchBuildNlmQueryParams($params, $domain);
        $requestOptions = muginPublicSearchBuildNlmRequestOptions(
            $endpointUrl,
            $queryString,
            ['Accept: application/xml,text/xml,*/*']
        );
        $nlmRate = (function_exists('muginGetNlmApiKey') && muginGetNlmApiKey($domain) !== '') ? 10 : 5;
        muginThrottleRequestRateUnlessPrefetched('nlm', $nlmRate, $requestOptions['url'], $requestOptions['options']);
        $result = muginHttpRequest($requestOptions['url'], $requestOptions['options']);
        if (!muginPublicSearchIsHttpResultOk($result)) {
            throw new RuntimeException('NLM XML request failed: ' . muginPublicSearchDescribeHttpFailure($result), 502);
        }
        return (string) $result['body'];
    }
}

if (!function_exists('muginPublicSearchFetchPubMedSearchIds')) {
    /**
     * @param string $query
     * @param int $limit
     * @param string $sort
     * @param string $domain
     * @return array{query: string, searchCount: int, pmids: array<int,string>}
     */
    function muginPublicSearchFetchPubMedSearchIds(string $query, int $limit, string $sort = 'relevance', string $domain = ''): array
    {
        $normalizedQuery = trim($query);
        if ($normalizedQuery === '') {
            return [
                'query' => '',
                'searchCount' => 0,
                'pmids' => [],
            ];
        }
        $payload = muginPublicSearchNlmGetJson('esearch.fcgi', [
            'db' => 'pubmed',
            'term' => $normalizedQuery,
            'retmode' => 'json',
            'retmax' => max(1, $limit),
            'retstart' => 0,
            'sort' => $sort,
        ], $domain);
        $esearch = isset($payload['esearchresult']) && is_array($payload['esearchresult']) ? $payload['esearchresult'] : [];
        return [
            'query' => $normalizedQuery,
            'searchCount' => (int) ($esearch['count'] ?? 0),
            'pmids' => muginPublicSearchDedupeStrings((array) ($esearch['idlist'] ?? []), 'muginPublicSearchNormalizePmid'),
        ];
    }
}

if (!function_exists('muginPublicSearchFetchPubMedSummaryRecords')) {
    /**
     * @param array<int,string> $pmids
     * @param string $domain
     * @return array<string,array<string,mixed>>
     */
    function muginPublicSearchFetchPubMedSummaryRecords(array $pmids, string $domain = ''): array
    {
        $normalizedPmids = muginPublicSearchDedupeStrings($pmids, 'muginPublicSearchNormalizePmid');
        if (empty($normalizedPmids)) {
            return [];
        }
        $cacheTtl = (int) (muginPublicSearchGetConfig()['hydrationCacheTtlSeconds'] ?? 0);
        $results = [];
        $missingPmids = [];
        foreach ($normalizedPmids as $pmid) {
            if ($cacheTtl > 0) {
                $cacheEntry = muginPublicSearchReadCacheValue('pubmed-summary', 'pmid:' . $pmid);
                if (($cacheEntry['hit'] ?? false) === true && is_array($cacheEntry['value'] ?? null)) {
                    $results[$pmid] = $cacheEntry['value'];
                    continue;
                }
            }
            $missingPmids[] = $pmid;
        }
        if (empty($missingPmids)) {
            return $results;
        }
        $chunkSize = 200;
        for ($index = 0; $index < count($missingPmids); $index += $chunkSize) {
            $chunk = array_slice($missingPmids, $index, $chunkSize);
            $payload = muginPublicSearchNlmGetJson('esummary.fcgi', [
                'db' => 'pubmed',
                'retmode' => 'json',
                'id' => implode(',', $chunk),
            ], $domain);
            $summaryResult = isset($payload['result']) && is_array($payload['result']) ? $payload['result'] : [];
            foreach ($chunk as $pmid) {
                if (isset($summaryResult[$pmid]) && is_array($summaryResult[$pmid])) {
                    $results[$pmid] = $summaryResult[$pmid];
                    if ($cacheTtl > 0) {
                        muginPublicSearchWriteCacheValue('pubmed-summary', 'pmid:' . $pmid, $summaryResult[$pmid], $cacheTtl);
                    }
                }
            }
        }
        return $results;
    }
}

if (!function_exists('muginPublicSearchExtractPubMedSummaryPublicationYear')) {
    /**
     * @param array<string,mixed> $summaryRecord
     * @return string
     */
    function muginPublicSearchExtractPubMedSummaryPublicationYear(array $summaryRecord): string
    {
        foreach (['pubdate', 'epubdate', 'sortpubdate'] as $field) {
            $value = trim((string) ($summaryRecord[$field] ?? ''));
            if ($value !== '' && preg_match('/(\d{4})/', $value, $matches) === 1) {
                return $matches[1];
            }
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchFlattenPubMedAbstractText')) {
    /**
     * @param array<int,string> $parts
     * @return string
     */
    function muginPublicSearchFlattenPubMedAbstractText(array $parts): string
    {
        return trim(implode(' ', array_values(array_filter(array_map(static function ($part) {
            return trim((string) $part);
        }, $parts)))));
    }
}

if (!function_exists('muginPublicSearchFetchPubMedAbstractMap')) {
    /**
     * Henter abstract, strukturerede abstract-sektioner, MeSH-termer,
     * KeywordList-emneord og strukturerede forfatternavne fra samme
     * efetch-XML-kald, saa der ikke skal ekstra upstream-kald til.
     *
     * @param array<int,string> $pmids
     * @param string $domain
     * @return array<string,array{abstract:string,mesh:array<int,string>,keywords:array<int,string>,abstractSections:array<int,array{label:string,text:string}>,authors:array<int,array{name:string,familyName:string,givenName:string,initials:string}>}>
     */
    function muginPublicSearchFetchPubMedAbstractMap(array $pmids, string $domain = ''): array
    {
        $normalizedPmids = muginPublicSearchDedupeStrings($pmids, 'muginPublicSearchNormalizePmid');
        if (empty($normalizedPmids)) {
            return [];
        }
        $cacheTtl = (int) (muginPublicSearchGetConfig()['hydrationCacheTtlSeconds'] ?? 0);
        $abstractMap = [];
        $missingPmids = [];
        foreach ($normalizedPmids as $pmid) {
            if ($cacheTtl > 0) {
                $cacheEntry = muginPublicSearchReadCacheValue('pubmed-abstract', 'pmid:' . $pmid);
                if (($cacheEntry['hit'] ?? false) === true && is_array($cacheEntry['value'] ?? null) && isset($cacheEntry['value']['abstract'])) {
                    $abstractMap[$pmid] = $cacheEntry['value'];
                    continue;
                }
            }
            $missingPmids[] = $pmid;
        }
        if (empty($missingPmids)) {
            return $abstractMap;
        }
        $chunkSize = 100;
        for ($index = 0; $index < count($missingPmids); $index += $chunkSize) {
            $chunk = array_slice($missingPmids, $index, $chunkSize);
            $xmlPayload = muginPublicSearchNlmGetXml('efetch.fcgi', [
                'db' => 'pubmed',
                'id' => implode(',', $chunk),
                'retmode' => 'xml',
                'rettype' => 'abstract',
            ], $domain);
            if (trim($xmlPayload) === '') {
                continue;
            }
            $dom = new DOMDocument();
            if (@$dom->loadXML($xmlPayload) !== true) {
                continue;
            }
            $articles = $dom->getElementsByTagName('PubmedArticle');
            foreach ($articles as $article) {
                if (!$article instanceof DOMElement) {
                    continue;
                }
                $pmidNodes = $article->getElementsByTagName('PMID');
                if ($pmidNodes->length === 0) {
                    continue;
                }
                $pmid = muginPublicSearchNormalizePmid($pmidNodes->item(0)?->textContent ?? '');
                if ($pmid === '') {
                    continue;
                }
                $abstractNodes = $article->getElementsByTagName('AbstractText');
                $parts = [];
                $sections = [];
                foreach ($abstractNodes as $abstractNode) {
                    if (!$abstractNode instanceof DOMElement) {
                        continue;
                    }
                    $label = trim((string) $abstractNode->getAttribute('Label'));
                    $text = trim((string) $abstractNode->textContent);
                    if ($text === '') {
                        continue;
                    }
                    $parts[] = $label !== '' ? ($label . ': ' . $text) : $text;
                    $sections[] = ['label' => $label, 'text' => $text];
                }
                $meshTerms = [];
                foreach ($article->getElementsByTagName('MeshHeading') as $meshHeadingNode) {
                    if (!$meshHeadingNode instanceof DOMElement) {
                        continue;
                    }
                    $descriptorNodes = $meshHeadingNode->getElementsByTagName('DescriptorName');
                    if ($descriptorNodes->length === 0) {
                        continue;
                    }
                    $meshTerm = trim((string) ($descriptorNodes->item(0)?->textContent ?? ''));
                    if ($meshTerm !== '') {
                        $meshTerms[$meshTerm] = true;
                    }
                }
                $keywordTerms = [];
                foreach ($article->getElementsByTagName('Keyword') as $keywordNode) {
                    if (!$keywordNode instanceof DOMElement) {
                        continue;
                    }
                    $keyword = trim((string) $keywordNode->textContent);
                    if ($keyword !== '') {
                        $keywordTerms[$keyword] = true;
                    }
                }
                $structuredAuthors = [];
                foreach ($article->getElementsByTagName('Author') as $authorNode) {
                    if (!$authorNode instanceof DOMElement) {
                        continue;
                    }
                    $lastNameNodes = $authorNode->getElementsByTagName('LastName');
                    $foreNameNodes = $authorNode->getElementsByTagName('ForeName');
                    $initialsNodes = $authorNode->getElementsByTagName('Initials');
                    $collectiveNameNodes = $authorNode->getElementsByTagName('CollectiveName');
                    $lastName = $lastNameNodes->length > 0 ? trim((string) $lastNameNodes->item(0)?->textContent) : '';
                    $foreName = $foreNameNodes->length > 0 ? trim((string) $foreNameNodes->item(0)?->textContent) : '';
                    $initials = $initialsNodes->length > 0 ? trim((string) $initialsNodes->item(0)?->textContent) : '';
                    $collectiveName = $collectiveNameNodes->length > 0 ? trim((string) $collectiveNameNodes->item(0)?->textContent) : '';
                    if ($lastName !== '') {
                        $structuredAuthors[] = muginPublicSearchBuildNormalizedAuthorEntry(
                            $lastName,
                            $foreName,
                            $initials,
                            trim($foreName . ' ' . $lastName)
                        );
                    } elseif ($collectiveName !== '') {
                        $structuredAuthors[] = muginPublicSearchBuildNormalizedAuthorEntry(
                            $collectiveName,
                            '',
                            '',
                            $collectiveName
                        );
                    }
                }
                $abstractMap[$pmid] = [
                    'abstract' => muginPublicSearchFlattenPubMedAbstractText($parts),
                    'mesh' => array_values(array_keys($meshTerms)),
                    'keywords' => array_values(array_keys($keywordTerms)),
                    'abstractSections' => $sections,
                    'authors' => $structuredAuthors,
                ];
                if ($cacheTtl > 0) {
                    muginPublicSearchWriteCacheValue('pubmed-abstract', 'pmid:' . $pmid, $abstractMap[$pmid], $cacheTtl);
                }
            }
        }
        return $abstractMap;
    }
}

if (!function_exists('muginPublicSearchFetchPubMedBestMatchSourceResult')) {
    /**
     * @param string $pubmedQuery
     * @param string $domain
     * @return array<string,mixed>
     */
    function muginPublicSearchFetchPubMedBestMatchSourceResult(string $pubmedQuery, string $domain = ''): array
    {
        $normalizedQuery = trim($pubmedQuery);
        $empty = muginPublicSearchCreateEmptySourceResult('pubmed', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }
        $searchLimit = muginPublicSearchGetSemanticSourceLimit('pubmedBestMatch', 200);
        $search = muginPublicSearchFetchPubMedSearchIds($normalizedQuery, $searchLimit, 'relevance', $domain);
        if (empty($search['pmids'])) {
            $empty['total'] = $search['searchCount'];
            return $empty;
        }
        $summaryRecords = muginPublicSearchFetchPubMedSummaryRecords($search['pmids'], $domain);
        $candidates = [];
        foreach ($search['pmids'] as $index => $pmid) {
            $record = isset($summaryRecords[$pmid]) ? $summaryRecords[$pmid] : [];
            $candidates[] = [
                'source' => 'pubmed',
                'rank' => $index + 1,
                'pmid' => $pmid,
                'title' => trim((string) ($record['title'] ?? '')),
                'metadata' => [
                    'publicationYear' => muginPublicSearchExtractPubMedSummaryPublicationYear($record),
                    'venue' => trim((string) ($record['fulljournalname'] ?? ($record['source'] ?? ''))),
                    'publicationTypes' => muginPublicSearchNormalizeSimpleList($record['pubtype'] ?? []),
                ],
            ];
        }
        return muginPublicSearchNormalizeSourceResult('pubmed', $normalizedQuery, [
            'total' => $search['searchCount'],
            'pmids' => $search['pmids'],
            'candidates' => $candidates,
        ]);
    }
}

if (!function_exists('muginPublicSearchBuildSemanticScholarBatchRequestSpec')) {
    /**
     * Builds the {url, options} spec for one Semantic Scholar /paper/search
     * batch. Extracted out of muginPublicSearchFetchSemanticScholarSourceResult()
     * so muginPublicSearchPrefetchInitialSourceRequests() can build the exact
     * same first-batch (offset 0) request for a muginHttpRequestMulti() prefetch,
     * without duplicating (and risking drift from) the param-building logic.
     *
     * @param array<int,string> $headers
     * @return array{url:string,options:array<string,mixed>}
     */
    function muginPublicSearchBuildSemanticScholarBatchRequestSpec(
        string $normalizedQuery,
        array $headers,
        string $publicationTypesParam,
        string $publicationDateOrYear,
        string $year,
        int $offset,
        int $limit
    ): array {
        $params = [
            'query' => $normalizedQuery,
            'limit' => $limit,
            'offset' => $offset,
            // Aligned with backend/api/SemanticScholarSearch.php's fields list so the
            // public multi-source API gets the same enrichment signals.
            'fields' => 'externalIds,title,abstract,venue,year,publicationTypes,publicationDate,citationCount,influentialCitationCount,isOpenAccess,s2FieldsOfStudy,tldr',
        ];
        if ($publicationTypesParam !== '') {
            $params['publicationTypes'] = $publicationTypesParam;
        }
        if ($publicationDateOrYear !== '') {
            $params['publicationDateOrYear'] = $publicationDateOrYear;
        }
        if ($year !== '') {
            $params['year'] = $year;
        }
        return [
            'url' => 'https://api.semanticscholar.org/graph/v1/paper/search?' . http_build_query($params),
            'options' => [
                'method' => 'GET',
                'timeout' => 20,
                'headers' => $headers,
                'user_agent' => 'MuginScholar/1.0',
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchBuildSemanticScholarHeaders')) {
    /**
     * @return array<int,string>
     */
    function muginPublicSearchBuildSemanticScholarHeaders(string $apiKeyOverride = ''): array
    {
        $envApiKey = getenv('SEMANTIC_SCHOLAR_API_KEY');
        $apiKey = trim($apiKeyOverride) !== '' ? trim($apiKeyOverride) : (
            is_string($envApiKey) && trim($envApiKey) !== ''
                ? trim($envApiKey)
                : (defined('SEMANTIC_SCHOLAR_API_KEY') ? trim((string) SEMANTIC_SCHOLAR_API_KEY) : '')
        );
        if (
            $apiKey === '' ||
            stripos($apiKey, 'INSERT-YOUR') !== false ||
            stripos($apiKey, 'REPLACE-WITH') !== false
        ) {
            $apiKey = '';
        }
        $headers = ['Accept: application/json'];
        if ($apiKey !== '') {
            $headers[] = 'x-api-key: ' . $apiKey;
        }
        return $headers;
    }
}

if (!function_exists('muginPublicSearchFetchSemanticScholarSourceResult')) {
    /**
     * @param string $query
     * @param array<string,mixed> $filters
     * @return array<string,mixed>
     */
    function muginPublicSearchFetchSemanticScholarSourceResult(string $query, array $filters, string $apiKeyOverride = ''): array
    {
        $normalizedQuery = trim($query);
        $empty = muginPublicSearchCreateEmptySourceResult('semanticScholar', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }

        $headers = muginPublicSearchBuildSemanticScholarHeaders($apiKeyOverride);

        $publicationTypesParam = '';
        $publicationTypes = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeSemanticScholarPublicationType', (array) ($filters['publicationTypes'] ?? []))
        );
        if (!empty($publicationTypes)) {
            $publicationTypesParam = implode(',', $publicationTypes);
        }
        $publicationDateOrYear = muginPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
            $filters['publicationDateOrYear'] ?? ''
        );
        $year = muginPublicSearchNormalizePublicationYearRange($filters['year'] ?? '');

        // Semantic Scholars /paper/search understoetter maksimalt limit=100
        // pr. kald (se https://api.semanticscholar.org/api-docs/). Et enkelt
        // kald med hele den konfigurerede graense (som ofte er stoerre end
        // 100) bliver afvist af upstream. Der hentes derfor i batches, ligesom
        // backend/api/SemanticScholarSearch.php allerede goer for webappen.
        $configuredLimit = max(1, muginPublicSearchGetSemanticSourceLimit('semanticScholar', 400));
        $batchSize = 100;

        $payload = [
            'total' => 0,
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
        ];
        $rawResultCount = 0;
        $rank = 0;
        $offset = 0;
        $failure = '';
        while ($offset < $configuredLimit) {
            $currentLimit = min($batchSize, $configuredLimit - $offset);
            $requestSpec = muginPublicSearchBuildSemanticScholarBatchRequestSpec(
                $normalizedQuery,
                $headers,
                $publicationTypesParam,
                $publicationDateOrYear,
                $year,
                $offset,
                $currentLimit
            );
            muginThrottleRequestRateUnlessPrefetched(
                'semantic_scholar',
                3,
                $requestSpec['url'],
                $requestSpec['options']
            );
            $result = muginHttpRequest($requestSpec['url'], $requestSpec['options']);
            if (!muginPublicSearchIsHttpResultOk($result)) {
                $failure = 'Semantic Scholar request failed: ' . muginPublicSearchDescribeHttpFailure($result);
                break;
            }
            $payload['rateLimit'] = muginPublicSearchRememberSourceRateLimitSnapshot(
                'semanticScholar',
                muginPublicSearchExtractRateLimitFromHttpResult($result)
            );
            $decoded = json_decode((string) $result['body'], true);
            if (!is_array($decoded)) {
                $failure = 'Invalid Semantic Scholar response';
                break;
            }
            if ($offset === 0) {
                $payload['total'] = (int) ($decoded['total'] ?? 0);
            }
            $batchData = (array) ($decoded['data'] ?? []);
            $rawResultCount += count($batchData);
            foreach ($batchData as $paper) {
                $rank++;
                if (!is_array($paper)) {
                    continue;
                }
                $externalIds = isset($paper['externalIds']) && is_array($paper['externalIds']) ? $paper['externalIds'] : [];
                $pmid = muginPublicSearchNormalizePmid($externalIds['PubMed'] ?? '');
                $doi = muginPublicSearchNormalizeDoi($externalIds['DOI'] ?? '');
                if ($pmid === '' && $doi === '') {
                    continue;
                }
                $citationCountRaw = $paper['citationCount'] ?? null;
                $influentialCitationCountRaw = $paper['influentialCitationCount'] ?? null;
                $isOpenAccessRaw = $paper['isOpenAccess'] ?? null;
                $tldrText = trim((string) ($paper['tldr']['text'] ?? ''));
                $s2Fields = [];
                if (isset($paper['s2FieldsOfStudy']) && is_array($paper['s2FieldsOfStudy'])) {
                    foreach ($paper['s2FieldsOfStudy'] as $fieldEntry) {
                        if (is_array($fieldEntry) && isset($fieldEntry['category'])) {
                            $categoryName = trim((string) $fieldEntry['category']);
                        } elseif (is_string($fieldEntry)) {
                            $categoryName = trim($fieldEntry);
                        } else {
                            $categoryName = '';
                        }
                        if ($categoryName !== '') {
                            $s2Fields[$categoryName] = true;
                        }
                    }
                }
                $payload['candidates'][] = [
                    'source' => 'semanticScholar',
                    'rank' => $rank,
                    'pmid' => $pmid,
                    'doi' => $doi,
                    'title' => trim((string) ($paper['title'] ?? '')),
                    'abstract' => trim((string) ($paper['abstract'] ?? '')),
                    'metadata' => [
                        'publicationYear' => trim((string) ($paper['year'] ?? '')),
                        'publicationDate' => trim((string) ($paper['publicationDate'] ?? '')),
                        'venue' => trim((string) ($paper['venue'] ?? '')),
                        'publicationTypes' => muginPublicSearchNormalizeSimpleList($paper['publicationTypes'] ?? []),
                        'citationCount' => is_numeric($citationCountRaw) ? (int) $citationCountRaw : null,
                        'influentialCitationCount' => is_numeric($influentialCitationCountRaw) ? (int) $influentialCitationCountRaw : null,
                        'isOpenAccess' => is_bool($isOpenAccessRaw) ? $isOpenAccessRaw : null,
                        's2FieldsOfStudy' => array_keys($s2Fields),
                        'tldr' => $tldrText,
                    ],
                ];
                if ($pmid !== '') {
                    $payload['pmids'][] = $pmid;
                }
                if ($doi !== '') {
                    $payload['dois'][] = $doi;
                }
            }
            if (count($batchData) < $currentLimit) {
                // Upstream har ikke flere resultater at hente.
                break;
            }
            $offset += $currentLimit;
        }

        if ($failure !== '' && empty($payload['candidates'])) {
            return muginPublicSearchCreateEmptySourceResult('semanticScholar', $normalizedQuery, $failure);
        }
        if (empty($payload['candidates'])) {
            $payload['warning'] = $rawResultCount > 0
                ? "Semantic Scholar matched {$rawResultCount} paper(s) for the resolved query, but none had a PubMed ID or DOI, so they were skipped."
                : 'Semantic Scholar matched 0 papers for the resolved query.';
        } elseif ($failure !== '') {
            $payload['warning'] = 'Semantic Scholar: ' . $failure . ' (partial results returned before the failure)';
        }
        return muginPublicSearchNormalizeSourceResult('semanticScholar', $normalizedQuery, $payload);
    }
}

if (!function_exists('muginPublicSearchNormalizeOpenAlexPmid')) {
    /**
     * OpenAlex returns ids.pmid as a full URL (e.g. https://pubmed.ncbi.nlm.nih.gov/12345),
     * unlike other sources which send a bare numeric string. The shared
     * muginPublicSearchNormalizePmid() requires an exact numeric match and would drop
     * these, so OpenAlex needs its own digit-extracting normalizer (mirrors
     * muginNormalizeOpenAlexPmid() in backend/api/OpenAlexSearch.php).
     *
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeOpenAlexPmid($value): string
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return '';
        }
        return preg_match('/(\d+)/', $raw, $matches) === 1 ? $matches[1] : '';
    }
}

if (!function_exists('muginPublicSearchBuildOpenAlexSourceRequestSpec')) {
    /**
     * Builds the {url, options} spec for the OpenAlex /works search request.
     * Extracted out of muginPublicSearchFetchOpenAlexSourceResult() so
     * muginPublicSearchPrefetchInitialSourceRequests() can build the exact same
     * request for a muginHttpRequestMulti() prefetch, without duplicating (and
     * risking drift from) the param-building logic.
     *
     * @param string $normalizedQuery
     * @param array<string,mixed> $filters
     * @return array{url:string,options:array<string,mixed>}
     */
    function muginPublicSearchBuildOpenAlexSourceRequestSpec(
        string $normalizedQuery,
        array $filters,
        string $domain,
        string $apiKeyOverride,
        string $searchMode = 'semantic'
    ): array {
        $limit = muginPublicSearchGetSemanticSourceLimit('openAlex', 50);
        $searchMode = strtolower(trim($searchMode)) === 'keyword' ? 'keyword' : 'semantic';
        $requestParams = [
            $searchMode === 'keyword' ? 'search' : 'search.semantic' => $normalizedQuery,
            'per_page' => $limit,
            // Aligned with backend/api/OpenAlexSearch.php's select list so the public
            // multi-source API gets the same enrichment signals (citation impact,
            // retraction, open access, topic, authorship, abstract) as the widget.
            'select' => 'id,display_name,doi,ids,publication_year,publication_date,biblio,relevance_score,type,type_crossref,primary_location,fwci,cited_by_count,counts_by_year,is_retracted,open_access,primary_topic,topics,keywords,authorships,abstract_inverted_index,language',
        ];
        $languageFilters = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeLanguageCode', (array) ($filters['language'] ?? []))
        );
        $sourceTypes = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeOpenAlexSourceType', (array) ($filters['sourceType'] ?? []))
        );
        $workTypes = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeOpenAlexWorkType', (array) ($filters['workType'] ?? []))
        );
        $publicationYear = muginPublicSearchNormalizePublicationYearRange($filters['publicationYear'] ?? '');
        $isOa = muginPublicSearchNormalizeElicitBooleanValue($filters['isOa'] ?? ($filters['is_oa'] ?? null));
        $filterParts = [];
        if (!empty($languageFilters)) {
            $filterParts[] = 'language:' . implode('|', $languageFilters);
        }
        if (!empty($sourceTypes)) {
            $filterParts[] = 'primary_location.source.type:' . implode('|', $sourceTypes);
        }
        if (!empty($workTypes)) {
            $filterParts[] = 'type:' . implode('|', $workTypes);
        }
        if ($publicationYear !== '') {
            $filterParts[] = 'publication_year:' . $publicationYear;
        }
        if ($isOa === true) {
            $filterParts[] = 'open_access.is_oa:true';
        }
        if (!empty($filterParts)) {
            $requestParams['filter'] = implode(',', $filterParts);
        }
        $apiKey = trim($apiKeyOverride) !== '' ? trim($apiKeyOverride) : (function_exists('muginGetOpenAlexApiKey') ? muginGetOpenAlexApiKey($domain) : '');
        if ($apiKey !== '') {
            $requestParams['api_key'] = $apiKey;
        }
        $mailto = function_exists('muginGetOpenAlexEmail') ? muginGetOpenAlexEmail($domain) : '';
        if ($mailto !== '') {
            $requestParams['mailto'] = $mailto;
        }
        return [
            'url' => 'https://api.openalex.org/works?' . http_build_query($requestParams),
            'options' => [
                'method' => 'GET',
                'timeout' => 30,
                'headers' => ['Accept: application/json'],
                'user_agent' => 'MuginScholar/1.0',
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchFetchOpenAlexSourceResultSingle')) {
    /**
     * @param string $query
     * @param array<string,mixed> $filters
     * @param string $domain
     * @return array<string,mixed>
     */
    function muginPublicSearchFetchOpenAlexSourceResultSingle(
        string $query,
        array $filters,
        string $domain = '',
        string $apiKeyOverride = '',
        string $searchMode = 'semantic'
    ): array
    {
        $normalizedQuery = trim($query);
        $empty = muginPublicSearchCreateEmptySourceResult('openAlex', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }

        $requestSpec = muginPublicSearchBuildOpenAlexSourceRequestSpec(
            $normalizedQuery,
            $filters,
            $domain,
            $apiKeyOverride,
            $searchMode
        );
        muginThrottleRequestRateUnlessPrefetched('openalex', 1, $requestSpec['url'], $requestSpec['options']);
        $result = muginHttpRequest($requestSpec['url'], $requestSpec['options']);
        if (!muginPublicSearchIsHttpResultOk($result)) {
            return muginPublicSearchCreateEmptySourceResult(
                'openAlex',
                $normalizedQuery,
                'OpenAlex request failed: ' . muginPublicSearchDescribeHttpFailure($result)
            );
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return muginPublicSearchCreateEmptySourceResult('openAlex', $normalizedQuery, 'Invalid OpenAlex response');
        }
        $payload = [
            'total' => isset($decoded['meta']['count']) ? (int) $decoded['meta']['count'] : 0,
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
            'rateLimit' => muginPublicSearchRememberSourceRateLimitSnapshot(
                'openAlex',
                muginPublicSearchExtractRateLimitFromHttpResult($result)
            ),
        ];
        foreach ((array) ($decoded['results'] ?? []) as $index => $work) {
            if (!is_array($work)) {
                continue;
            }
            $ids = isset($work['ids']) && is_array($work['ids']) ? $work['ids'] : [];
            $pmid = muginPublicSearchNormalizeOpenAlexPmid($work['pmid'] ?? ($ids['pmid'] ?? ''));
            $doi = muginPublicSearchNormalizeDoi($work['doi'] ?? ($ids['doi'] ?? ''));
            if ($pmid === '' && $doi === '') {
                continue;
            }
            $primaryLocation = isset($work['primary_location']) && is_array($work['primary_location'])
                ? $work['primary_location']
                : [];
            $source = isset($primaryLocation['source']) && is_array($primaryLocation['source'])
                ? $primaryLocation['source']
                : [];

            $pubTypesSet = [];
            $workType = trim((string) ($work['type'] ?? ''));
            if ($workType !== '') {
                $pubTypesSet[$workType] = true;
            }
            $crossrefType = trim((string) ($work['type_crossref'] ?? ''));
            if ($crossrefType !== '' && !isset($pubTypesSet[$crossrefType])) {
                $pubTypesSet[$crossrefType] = true;
            }

            $authorIds = [];
            $authorNames = [];
            $institutionIds = [];
            $institutionNames = [];
            if (isset($work['authorships']) && is_array($work['authorships'])) {
                foreach ($work['authorships'] as $authorship) {
                    if (!is_array($authorship)) {
                        continue;
                    }
                    $author = isset($authorship['author']) && is_array($authorship['author'])
                        ? $authorship['author']
                        : [];
                    $authorId = trim((string) ($author['id'] ?? ''));
                    if ($authorId !== '') {
                        $authorIds[$authorId] = true;
                    }
                    $authorName = trim((string) ($author['display_name'] ?? ''));
                    if ($authorName !== '') {
                        $authorNames[] = $authorName;
                    }
                    if (isset($authorship['institutions']) && is_array($authorship['institutions'])) {
                        foreach ($authorship['institutions'] as $institution) {
                            if (!is_array($institution)) {
                                continue;
                            }
                            $institutionId = trim((string) ($institution['id'] ?? ''));
                            if ($institutionId !== '') {
                                $institutionIds[$institutionId] = true;
                            }
                            $institutionName = trim((string) ($institution['display_name'] ?? ''));
                            if ($institutionName !== '') {
                                $institutionNames[$institutionName] = true;
                            }
                        }
                    }
                }
            }

            $openAccess = isset($work['open_access']) && is_array($work['open_access']) ? $work['open_access'] : [];
            $primaryTopic = isset($work['primary_topic']) && is_array($work['primary_topic']) ? $work['primary_topic'] : [];
            $biblio = isset($work['biblio']) && is_array($work['biblio']) ? $work['biblio'] : [];
            $abstractText = muginPublicSearchReconstructOpenAlexAbstract($work['abstract_inverted_index'] ?? null);
            $pages = trim((string) (
                ($biblio['first_page'] ?? '') !== '' && ($biblio['last_page'] ?? '') !== ''
                    ? ($biblio['first_page'] . '-' . $biblio['last_page'])
                    : ($biblio['first_page'] ?? ($biblio['last_page'] ?? ''))
            ));

            $payload['candidates'][] = [
                'source' => 'openAlex',
                'rank' => $index + 1,
                'pmid' => $pmid,
                'doi' => $doi,
                'openAlexId' => trim((string) ($work['id'] ?? '')),
                'title' => trim((string) ($work['display_name'] ?? ($work['title'] ?? ''))),
                'score' => is_numeric($work['relevance_score'] ?? null) ? (float) $work['relevance_score'] : null,
                'metadata' => [
                    'publicationYear' => trim((string) ($work['publication_year'] ?? '')),
                    'publicationDate' => trim((string) ($work['publication_date'] ?? '')),
                    'workType' => $workType,
                    'publicationTypes' => array_keys($pubTypesSet),
                    'sourceType' => trim((string) ($source['type'] ?? '')),
                    'sourceDisplayName' => trim((string) ($source['display_name'] ?? '')),
                    'sourceAbbreviatedTitle' => trim((string) ($source['abbreviated_title'] ?? '')),
                    'journalSourceId' => trim((string) ($source['id'] ?? '')),
                    'publisher' => trim((string) ($source['host_organization_name'] ?? ($source['publisher'] ?? ''))),
                    'language' => trim((string) ($work['language'] ?? '')),
                    'fwci' => is_numeric($work['fwci'] ?? null) ? (float) $work['fwci'] : null,
                    'citedByCount' => is_numeric($work['cited_by_count'] ?? null) ? (int) $work['cited_by_count'] : null,
                    'isRetracted' => is_bool($work['is_retracted'] ?? null) ? $work['is_retracted'] : null,
                    'isOpenAccess' => isset($openAccess['is_oa']) ? (bool) $openAccess['is_oa'] : null,
                    'primaryTopicId' => trim((string) ($primaryTopic['id'] ?? '')),
                    'primaryTopicDisplayName' => trim((string) ($primaryTopic['display_name'] ?? '')),
                    'openAlexTopics' => function_exists('muginExtractOpenAlexTopicDisplayNames')
                        ? muginExtractOpenAlexTopicDisplayNames($work['topics'] ?? [], 3)
                        : [],
                    'openAlexKeywords' => function_exists('muginExtractOpenAlexKeywordDisplayNames')
                        ? muginExtractOpenAlexKeywordDisplayNames($work['keywords'] ?? [], 5)
                        : [],
                    'openAlexSubfields' => function_exists('muginExtractOpenAlexSubfieldDisplayNames')
                        ? muginExtractOpenAlexSubfieldDisplayNames($primaryTopic, $work['topics'] ?? [])
                        : [],
                    'authorIds' => array_values(array_keys($authorIds)),
                    'authorNames' => $authorNames,
                    'institutionIds' => array_values(array_keys($institutionIds)),
                    'institutionNames' => array_values(array_keys($institutionNames)),
                    'volume' => trim((string) ($biblio['volume'] ?? '')),
                    'issue' => trim((string) ($biblio['issue'] ?? '')),
                    'pages' => $pages,
                    'abstract' => $abstractText,
                    'hasAbstract' => $abstractText !== '',
                    'abstractLength' => $abstractText !== ''
                        ? (function_exists('mb_strlen') ? mb_strlen($abstractText) : strlen($abstractText))
                        : 0,
                ],
            ];
            if ($pmid !== '') {
                $payload['pmids'][] = $pmid;
            }
            if ($doi !== '') {
                $payload['dois'][] = $doi;
            }
        }
        $rawResultCount = count((array) ($decoded['results'] ?? []));
        if (empty($payload['candidates'])) {
            $payload['warning'] = $rawResultCount > 0
                ? "OpenAlex matched {$rawResultCount} work(s) for the resolved query, but none had a PubMed ID or DOI, so they were skipped."
                : 'OpenAlex matched 0 works for the resolved query.';
        }
        return muginPublicSearchNormalizeSourceResult('openAlex', $normalizedQuery, $payload);
    }
}

if (!function_exists('muginPublicSearchFetchOpenAlexSourceResult')) {
    /**
     * Mirrors the legacy widget's OpenAlex strategy: an unfiltered semantic
     * primary request plus a keyword supplement that enforces source filters.
     * If semantic search fails, the keyword request becomes the fallback.
     *
     * @param array<string,mixed> $filters
     * @return array<string,mixed>
     */
    function muginPublicSearchFetchOpenAlexSourceResult(
        string $query,
        array $filters,
        string $domain = '',
        string $apiKeyOverride = ''
    ): array {
        $normalizedQuery = trim($query);
        $openAlexSemanticFilters = [];
        if (muginPublicSearchNormalizeElicitBooleanValue($filters['isOa'] ?? ($filters['is_oa'] ?? null)) === true) {
            $openAlexSemanticFilters['isOa'] = true;
        }
        $primary = muginPublicSearchFetchOpenAlexSourceResultSingle(
            $normalizedQuery,
            $openAlexSemanticFilters,
            $domain,
            $apiKeyOverride,
            'semantic'
        );
        $disabledRequestFields = [];
        foreach ([
            'language' => 'languages',
            'sourceType' => 'sourceTypes',
            'workType' => 'workTypes',
            'publicationYear' => 'publicationYear',
        ] as $filterField => $requestField) {
            $value = $filters[$filterField] ?? null;
            if ((is_array($value) && !empty($value)) || (!is_array($value) && trim((string) $value) !== '')) {
                $disabledRequestFields[] = $requestField;
            }
        }
        $primaryCandidates = isset($primary['candidates']) && is_array($primary['candidates'])
            ? $primary['candidates']
            : [];
        $primaryCandidateCount = count($primaryCandidates);
        $semanticCap = max(1, muginPublicSearchGetSemanticSourceLimit('openAlex', 50));
        $primaryWarning = trim((string) ($primary['warning'] ?? ($primary['error'] ?? '')));
        $semanticFiltersDeferred = !empty($disabledRequestFields);
        $semanticFailedCompletely = $primaryWarning !== '' && $primaryCandidateCount === 0;
        $semanticCapReached = $primaryWarning === '' && $primaryCandidateCount >= $semanticCap;
        if (!$semanticFiltersDeferred && !$semanticFailedCompletely && !$semanticCapReached) {
            $primary['requestMeta'] = ['searchMode' => 'semantic', 'fallbackUsed' => false];
            return $primary;
        }

        $supplement = muginPublicSearchFetchOpenAlexSourceResultSingle(
            $normalizedQuery,
            $filters,
            $domain,
            $apiKeyOverride,
            'keyword'
        );
        $supplementCandidates = isset($supplement['candidates']) && is_array($supplement['candidates'])
            ? $supplement['candidates']
            : [];
        $mergedCandidates = [];
        $seen = [];
        $mergeSource = $semanticFailedCompletely
            ? $supplementCandidates
            : array_merge($primaryCandidates, $supplementCandidates);
        foreach ($mergeSource as $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            $openAlexId = strtolower(trim((string) ($candidate['openAlexId'] ?? '')));
            $key = $pmid !== ''
                ? 'pmid:' . $pmid
                : ($doi !== '' ? 'doi:' . strtolower($doi) : ($openAlexId !== '' ? 'oa:' . $openAlexId : ''));
            if ($key === '' || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $candidate['rank'] = count($mergedCandidates) + 1;
            $mergedCandidates[] = $candidate;
        }

        $primarySucceeded = $primaryCandidateCount > 0 && !$semanticFailedCompletely;
        $supplementSucceeded = !empty($supplementCandidates);
        if ($semanticFiltersDeferred && !$semanticFailedCompletely) {
            $fallbackReason = 'semantic-filter-supplement';
        } elseif ($semanticFailedCompletely && $supplementSucceeded) {
            $fallbackReason = 'keyword';
        } elseif ($semanticFiltersDeferred) {
            $fallbackReason = $supplementSucceeded ? 'keyword' : 'filters';
        } else {
            // Cap-triggered supplement mirrors legacy: no fallbackReason unless
            // filters were also deferred / semantic failed.
            $fallbackReason = '';
        }
        $fallbackUsed = $semanticFiltersDeferred || ($semanticFailedCompletely && $supplementSucceeded);
        $requestMeta = [
            'searchMode' => 'semantic',
            'fallbackUsed' => $fallbackUsed,
            'fallbackReason' => $fallbackReason,
            'disabledRequestFields' => $disabledRequestFields,
            'semanticPrimaryUsed' => !$semanticFailedCompletely,
            'semanticFiltersDeferred' => $semanticFiltersDeferred,
            'keywordSupplementRole' => $semanticFiltersDeferred ? 'filterSupplement' : '',
            'keywordSupplementAttempted' => true,
            'keywordSupplementUsed' => $supplementSucceeded,
            'keywordSupplementRequest' => [
                'query' => $normalizedQuery,
                'limit' => $semanticCap,
                'domain' => $domain,
                'languages' => array_values((array) ($filters['language'] ?? [])),
                'sourceTypes' => array_values((array) ($filters['sourceType'] ?? [])),
                'workTypes' => array_values((array) ($filters['workType'] ?? [])),
                'publicationYear' => (string) ($filters['publicationYear'] ?? ''),
                'searchMode' => 'keyword',
            ],
        ];
        $warningParts = [];
        if (!$semanticFailedCompletely || !$supplementSucceeded) {
            foreach ([$primary, $supplement] as $sourceResult) {
                foreach (['warning', 'error'] as $field) {
                    $message = trim((string) ($sourceResult[$field] ?? ''));
                    if ($message !== '') {
                        $warningParts[] = $message;
                    }
                }
            }
        }
        $normalized = muginPublicSearchNormalizeSourceResult('openAlex', $normalizedQuery, [
            'total' => count($mergedCandidates),
            'candidates' => $mergedCandidates,
            'warning' => empty($mergedCandidates) ? implode(' | ', $warningParts) : '',
            'partial' => !$primarySucceeded || !$supplementSucceeded,
            'rateLimit' => $supplement['rateLimit'] ?? ($primary['rateLimit'] ?? null),
            'fallbackUsed' => $fallbackUsed,
            'fallbackReason' => $fallbackReason,
            'disabledRequestFields' => $disabledRequestFields,
            'requestMeta' => $requestMeta,
        ]);
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchBuildElicitSourceRequestSpec')) {
    /**
     * Builds the {url, options} spec for the Elicit /v2/search/papers request.
     * Extracted out of muginPublicSearchFetchElicitSourceResult() so
     * muginPublicSearchPrefetchInitialSourceRequests() can build the exact same
     * request for a muginHttpRequestMulti() prefetch, without duplicating (and
     * risking drift from) the param-building logic.
     *
     * @param array<string,mixed> $filters
     * @return array{url:string,options:array<string,mixed>}
     */
    function muginPublicSearchBuildElicitSourceRequestSpec(string $normalizedQuery, array $filters, string $apiKey): array
    {
        $limit = muginPublicSearchGetSemanticSourceLimit('elicit', 100);
        $requestFilters = [];
        $typeTags = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeElicitTypeTag', (array) ($filters['typeTags'] ?? []))
        );
        if (!empty($typeTags)) {
            $requestFilters['typeTags'] = $typeTags;
        }
        $includeKeywords = muginPublicSearchNormalizeSimpleList($filters['includeKeywords'] ?? []);
        if (!empty($includeKeywords)) {
            $requestFilters['includeKeywords'] = $includeKeywords;
        }
        $excludeKeywords = muginPublicSearchNormalizeSimpleList($filters['excludeKeywords'] ?? []);
        if (!empty($excludeKeywords)) {
            $requestFilters['excludeKeywords'] = $excludeKeywords;
        }
        // Extended fields (parity with DropdownWrapper.vue's Elicit filter
        // set); previously silently dropped even when present in $filters.
        foreach (['minYear', 'maxYear', 'minEpochS', 'maxEpochS', 'maxQuartile'] as $numericFilterKey) {
            if (isset($filters[$numericFilterKey]) && is_numeric($filters[$numericFilterKey])) {
                $requestFilters[$numericFilterKey] = (int) $filters[$numericFilterKey];
            }
        }
        if (isset($filters['hasPdf']) && is_bool($filters['hasPdf'])) {
            $requestFilters['hasPdf'] = $filters['hasPdf'];
        }
        if (isset($filters['pubmedOnly']) && is_bool($filters['pubmedOnly'])) {
            $requestFilters['pubmedOnly'] = $filters['pubmedOnly'];
        }
        // Defaults to 'exclude_retracted' to match the website widget's own
        // default (DropdownWrapper.vue ~5918-5919) when unset.
        $requestFilters['retracted'] = muginPublicSearchNormalizeElicitRetractedValue($filters['retracted'] ?? '') ?: 'exclude_retracted';
        $payload = [
            'query' => $normalizedQuery,
            'maxResults' => $limit,
            'corpus' => 'elicit',
            'searchMode' => 'semantic',
        ];
        if (!empty($requestFilters)) {
            $payload['filters'] = $requestFilters;
        }
        return [
            'url' => 'https://elicit.com/api/v2/search/papers',
            'options' => [
                'method' => 'POST',
                'timeout' => 45,
                'headers' => [
                    'Accept: application/json',
                    'Content-Type: application/json',
                    'Authorization: Bearer ' . $apiKey,
                ],
                'body' => muginPublicSearchSafeJsonEncode($payload),
                'user_agent' => 'MuginScholar/1.0',
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchFetchElicitSourceResult')) {
    /**
     * @param string $query
     * @param array<string,mixed> $filters
     * @return array<string,mixed>
     */
    function muginPublicSearchFetchElicitSourceResult(string $query, array $filters, string $apiKeyOverride = ''): array
    {
        $normalizedQuery = trim($query);
        $empty = muginPublicSearchCreateEmptySourceResult('elicit', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }
        $apiKey = trim($apiKeyOverride) !== '' ? trim($apiKeyOverride) : (defined('ELICIT_API_KEY') ? trim((string) ELICIT_API_KEY) : '');
        if ($apiKey === '') {
            return muginPublicSearchCreateEmptySourceResult('elicit', $normalizedQuery, 'ELICIT_API_KEY is not configured');
        }

        $requestSpec = muginPublicSearchBuildElicitSourceRequestSpec($normalizedQuery, $filters, $apiKey);
        muginThrottleRequestRateUnlessPrefetched('elicit', 2, $requestSpec['url'], $requestSpec['options']);
        $result = muginHttpRequest($requestSpec['url'], $requestSpec['options']);
        if (!muginPublicSearchIsHttpResultOk($result)) {
            return muginPublicSearchCreateEmptySourceResult(
                'elicit',
                $normalizedQuery,
                'Elicit request failed: ' . muginPublicSearchDescribeHttpFailure($result)
            );
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return muginPublicSearchCreateEmptySourceResult('elicit', $normalizedQuery, 'Invalid Elicit response');
        }
        $sourcePayload = [
            'total' => count((array) ($decoded['papers'] ?? $decoded['results'] ?? [])),
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
            'rateLimit' => muginPublicSearchRememberSourceRateLimitSnapshot(
                'elicit',
                muginPublicSearchExtractRateLimitFromHttpResult($result)
            ),
        ];
        foreach ((array) ($decoded['papers'] ?? $decoded['results'] ?? []) as $index => $paper) {
            if (!is_array($paper)) {
                continue;
            }
            $pmid = muginPublicSearchNormalizePmid($paper['pmid'] ?? ($paper['paper']['pmid'] ?? ''));
            $doi = muginPublicSearchNormalizeDoi(
                $paper['doi'] ?? ($paper['paper']['doi'] ?? ($paper['identifiers']['doi'] ?? ''))
            );
            if ($pmid === '' && $doi === '') {
                continue;
            }
            $sourcePayload['candidates'][] = [
                'source' => 'elicit',
                'rank' => $index + 1,
                'pmid' => $pmid,
                'doi' => $doi,
                'title' => trim((string) ($paper['title'] ?? ($paper['paper']['title'] ?? ''))),
                'abstract' => trim((string) ($paper['abstract'] ?? ($paper['paper']['abstract'] ?? ''))),
                'metadata' => [
                    'publicationYear' => trim((string) ($paper['year'] ?? ($paper['paper']['year'] ?? ''))),
                    'publicationTypes' => muginPublicSearchNormalizeSimpleList(
                        $paper['publication_types'] ?? ($paper['paper']['publication_types'] ?? [])
                    ),
                    'venue' => trim((string) ($paper['venue'] ?? ($paper['paper']['venue'] ?? ''))),
                    'citedByCount' => isset($paper['citedByCount']) && is_numeric($paper['citedByCount'])
                        ? (int) $paper['citedByCount']
                        : null,
                    'authors' => muginPublicSearchNormalizeSimpleList($paper['authors'] ?? []),
                ],
            ];
            if ($pmid !== '') {
                $sourcePayload['pmids'][] = $pmid;
            }
            if ($doi !== '') {
                $sourcePayload['dois'][] = $doi;
            }
        }
        $rawResultCount = count((array) ($decoded['papers'] ?? $decoded['results'] ?? []));
        if (empty($sourcePayload['candidates'])) {
            $sourcePayload['warning'] = $rawResultCount > 0
                ? "Elicit matched {$rawResultCount} paper(s) for the resolved query, but none had a PubMed ID or DOI, so they were skipped."
                : 'Elicit matched 0 papers for the resolved query.';
        }
        return muginPublicSearchNormalizeSourceResult('elicit', $normalizedQuery, $sourcePayload);
    }
}

if (!function_exists('muginPublicSearchGetOpenAlexWorkLookupUrl')) {
    /**
     * @param array<string,mixed> $candidate
     * @param string $domain
     * @return string
     */
    function muginPublicSearchGetOpenAlexWorkLookupUrl(array $candidate, string $domain = ''): string
    {
        $openAlexId = trim((string) ($candidate['openAlexId'] ?? ''));
        $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
        $queryParams = [];
        $apiKey = function_exists('muginGetOpenAlexApiKey') ? muginGetOpenAlexApiKey($domain) : '';
        $mailto = function_exists('muginGetOpenAlexEmail') ? muginGetOpenAlexEmail($domain) : '';
        if ($apiKey !== '') {
            $queryParams['api_key'] = $apiKey;
        }
        if ($mailto !== '') {
            $queryParams['mailto'] = $mailto;
        }
        if ($openAlexId !== '') {
            return 'https://api.openalex.org/works/' . rawurlencode($openAlexId)
                . (!empty($queryParams) ? '?' . http_build_query($queryParams) : '');
        }
        if ($doi !== '') {
            $queryParams['filter'] = 'doi:' . $doi;
            $queryParams['per_page'] = 1;
            return 'https://api.openalex.org/works?' . http_build_query($queryParams);
        }
        return '';
    }
}

if (!function_exists('muginPublicSearchReconstructOpenAlexAbstract')) {
    /**
     * @param mixed $invertedIndex
     * @return string
     */
    function muginPublicSearchReconstructOpenAlexAbstract($invertedIndex): string
    {
        return muginOpenAlexReconstructAbstract($invertedIndex);
    }
}

if (!function_exists('muginPublicSearchResolveOpenAlexWorkCacheRef')) {
    /**
     * Shared data/cache/openalex-work identity (same store as OpenAlexWorkLookup.php).
     *
     * @param array<string,mixed> $candidate
     * @return array{type:string,value:string}|null
     */
    function muginPublicSearchResolveOpenAlexWorkCacheRef(array $candidate): ?array
    {
        $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
        if ($doi !== '') {
            return ['type' => 'doi', 'value' => $doi];
        }
        $openAlexId = function_exists('muginNormalizeOpenAlexLookupId')
            ? muginNormalizeOpenAlexLookupId($candidate['openAlexId'] ?? '')
            : '';
        if ($openAlexId !== '') {
            return ['type' => 'openalex', 'value' => $openAlexId];
        }
        return null;
    }
}

if (!function_exists('muginPublicSearchStoreOpenAlexWorkCache')) {
    /**
     * @param array<string,mixed> $work
     */
    function muginPublicSearchStoreOpenAlexWorkCache(array $work, string $domain = ''): void
    {
        if (!function_exists('muginWriteOpenAlexWorkCache')) {
            return;
        }
        $doi = muginPublicSearchNormalizeDoi($work['doi'] ?? ($work['ids']['doi'] ?? ''));
        if ($doi !== '') {
            muginWriteOpenAlexWorkCache('doi', $doi, $domain, $work, false, 'full');
        }
        $openAlexId = function_exists('muginNormalizeOpenAlexLookupId')
            ? muginNormalizeOpenAlexLookupId($work['id'] ?? ($work['ids']['openalex'] ?? ''))
            : '';
        if ($openAlexId !== '') {
            muginWriteOpenAlexWorkCache('openalex', $openAlexId, $domain, $work, false, 'full');
        }
        // Legacy runtime namespace is no longer written; opportunistically prune leftovers.
        if (function_exists('muginPublicSearchMaybeCleanupCacheNamespace') && mt_rand(1, 50) === 1) {
            muginPublicSearchMaybeCleanupCacheNamespace('openalex-work');
        }
    }
}

if (!function_exists('muginPublicSearchFetchOpenAlexWorkByCandidate')) {
    /**
     * @param array<string,mixed> $candidate
     * @param string $domain
     * @return ?array<string,mixed>
     */
    function muginPublicSearchFetchOpenAlexWorkByCandidate(array $candidate, string $domain = ''): ?array
    {
        $url = muginPublicSearchGetOpenAlexWorkLookupUrl($candidate, $domain);
        if ($url === '') {
            return null;
        }
        $cacheRef = muginPublicSearchResolveOpenAlexWorkCacheRef($candidate);
        if (
            $cacheRef !== null
            && function_exists('muginReadOpenAlexWorkCache')
            && muginGetOpenAlexWorkCacheTtl(false) > 0
        ) {
            $cacheEntry = muginReadOpenAlexWorkCache(
                $cacheRef['type'],
                $cacheRef['value'],
                $domain,
                'full'
            );
            if (($cacheEntry['hit'] ?? false) === true) {
                $cachedWork = function_exists('muginNormalizeOpenAlexCachedWork')
                    ? muginNormalizeOpenAlexCachedWork($cacheEntry['value'] ?? null)
                    : (is_array($cacheEntry['value'] ?? null) ? $cacheEntry['value'] : null);
                if (is_array($cachedWork)) {
                    return $cachedWork;
                }
            }
        }
        muginThrottleRequestRate('openalex', 1);
        $result = muginHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 30,
            'headers' => ['Accept: application/json'],
            'user_agent' => 'MuginScholar/1.0',
        ]);
        if (!muginPublicSearchIsHttpResultOk($result)) {
            return null;
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return null;
        }
        if (isset($decoded['results'][0]) && is_array($decoded['results'][0])) {
            muginPublicSearchStoreOpenAlexWorkCache($decoded['results'][0], $domain);
            return $decoded['results'][0];
        }
        if (isset($decoded['id']) && is_string($decoded['id'])) {
            muginPublicSearchStoreOpenAlexWorkCache($decoded, $domain);
            return $decoded;
        }
        return null;
    }
}

if (!function_exists('muginPublicSearchParseOpenAlexWorkLookupResponse')) {
    /**
     * Parses one muginHttpRequest()/muginHttpRequestMulti() result the same way
     * muginPublicSearchFetchOpenAlexWorkByCandidate() does, so both the single
     * and the batched/parallel lookup paths interpret responses identically.
     *
     * @param array{ok:bool,status:int,body:string} $result
     * @return ?array<string,mixed>
     */
    function muginPublicSearchParseOpenAlexWorkLookupResponse(array $result): ?array
    {
        if (!muginPublicSearchIsHttpResultOk($result)) {
            return null;
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return null;
        }
        if (isset($decoded['results'][0]) && is_array($decoded['results'][0])) {
            return $decoded['results'][0];
        }
        if (isset($decoded['id']) && is_string($decoded['id'])) {
            return $decoded;
        }
        return null;
    }
}

if (!function_exists('muginPublicSearchFetchOpenAlexWorksByCandidatesParallel')) {
    /**
     * Batched/parallel counterpart to muginPublicSearchFetchOpenAlexWorkByCandidate(),
     * used when many DOI-only candidates need per-candidate OpenAlex hydration
     * (muginPublicSearchBuildAllowedCandidateKeys()). Each candidate still gets
     * its own OpenAlex request (same URLs, same cache keys, same response
     * parsing as the single-candidate function above — this only changes HOW
     * the requests are dispatched, not what is requested or how responses are
     * interpreted), but requests are fired concurrently via muginHttpRequestMulti()
     * in bounded waves instead of one blocking muginHttpRequest() call per
     * candidate. This is what makes hydrating e.g. 300 DOI-only candidates (a
     * realistic count for a semanticScholar/elicit-only search with no PubMed
     * results to supply PMIDs) take seconds instead of minutes.
     *
     * @param array<int,array{key:string,candidate:array<string,mixed>}> $entries
     * @param string $domain
     * @return array<string,?array<string,mixed>> Keyed by the same 'key' passed in.
     */
    function muginPublicSearchFetchOpenAlexWorksByCandidatesParallel(array $entries, string $domain = ''): array
    {
        $results = [];
        if (empty($entries)) {
            return $results;
        }

        $useSharedCache = function_exists('muginReadOpenAlexWorkCache')
            && muginGetOpenAlexWorkCacheTtl(false) > 0;
        $pending = [];
        foreach ($entries as $entry) {
            $key = (string) ($entry['key'] ?? '');
            $candidate = (array) ($entry['candidate'] ?? []);
            $url = muginPublicSearchGetOpenAlexWorkLookupUrl($candidate, $domain);
            if ($key === '' || $url === '') {
                if ($key !== '') {
                    $results[$key] = null;
                }
                continue;
            }
            $cacheRef = muginPublicSearchResolveOpenAlexWorkCacheRef($candidate);
            if ($useSharedCache && $cacheRef !== null) {
                $cacheEntry = muginReadOpenAlexWorkCache(
                    $cacheRef['type'],
                    $cacheRef['value'],
                    $domain,
                    'full'
                );
                if (($cacheEntry['hit'] ?? false) === true) {
                    $cachedWork = muginNormalizeOpenAlexCachedWork($cacheEntry['value'] ?? null);
                    if (is_array($cachedWork)) {
                        $results[$key] = $cachedWork;
                        continue;
                    }
                }
            }
            $pending[] = [
                'key' => $key,
                'url' => $url,
                'doi' => muginPublicSearchNormalizeDoi($candidate['doi'] ?? ''),
            ];
        }

        if (empty($pending)) {
            return $results;
        }

        // OpenAlex supports OR-filtering DOI values with `|`. Resolve DOI
        // candidates in bounded batches rather than one HTTP request per work;
        // this mirrors the deployed OpenAlexWorkLookup batching behavior and
        // avoids multi-minute validation for large semantic result pools.
        $doiPending = array_values(array_filter($pending, static fn($item) => ($item['doi'] ?? '') !== ''));
        $individualPending = array_values(array_filter($pending, static fn($item) => ($item['doi'] ?? '') === ''));
        $apiKey = function_exists('muginGetOpenAlexApiKey') ? muginGetOpenAlexApiKey($domain) : '';
        $mailto = function_exists('muginGetOpenAlexEmail') ? muginGetOpenAlexEmail($domain) : '';
        $batchRequests = [];
        $batchItems = [];
        foreach (array_chunk($doiPending, 50) as $index => $batch) {
            $dois = array_values(array_map(static fn($item) => (string) $item['doi'], $batch));
            $params = [
                'filter' => 'doi:' . implode('|', $dois),
                'per_page' => count($dois),
            ];
            if ($apiKey !== '') {
                $params['api_key'] = $apiKey;
            }
            if ($mailto !== '') {
                $params['mailto'] = $mailto;
            }
            $name = 'doi-batch-' . $index;
            $batchItems[$name] = $batch;
            $batchRequests[$name] = [
                'url' => 'https://api.openalex.org/works?' . http_build_query($params),
                'options' => [
                    'method' => 'GET',
                    'timeout' => 30,
                    'headers' => ['Accept: application/json'],
                    'user_agent' => 'MuginScholar/1.0',
                ],
            ];
        }
        if (!empty($batchRequests)) {
            muginThrottleRequestRate('openalex', 10);
            $batchResponses = muginHttpRequestMulti($batchRequests);
            foreach ($batchItems as $name => $items) {
                $response = $batchResponses[$name] ?? null;
                $decoded = is_array($response) && muginPublicSearchIsHttpResultOk($response)
                    ? json_decode((string) ($response['body'] ?? ''), true)
                    : null;
                $worksByDoi = [];
                foreach ((array) ($decoded['results'] ?? []) as $work) {
                    if (!is_array($work)) {
                        continue;
                    }
                    foreach ([$work['doi'] ?? '', $work['ids']['doi'] ?? ''] as $doiSource) {
                        $doi = muginPublicSearchNormalizeDoi($doiSource);
                        if ($doi !== '') {
                            $worksByDoi[strtolower($doi)] = $work;
                        }
                    }
                }
                foreach ($items as $item) {
                    $work = $worksByDoi[strtolower((string) $item['doi'])] ?? null;
                    if (!is_array($work) && count($items) === 1 && count($worksByDoi) === 1) {
                        $work = reset($worksByDoi) ?: null;
                    }
                    $results[$item['key']] = $work;
                    if (is_array($work)) {
                        muginPublicSearchStoreOpenAlexWorkCache($work, $domain);
                    }
                }
            }
        }

        // Rare candidates without DOI retain the existing bounded direct-id
        // fallback.
        $waveSize = 20;
        foreach (array_chunk($individualPending, $waveSize) as $wave) {
            muginThrottleRequestRate('openalex', 10);
            $namedRequests = [];
            foreach ($wave as $item) {
                $namedRequests[$item['key']] = [
                    'url' => $item['url'],
                    'options' => [
                        'method' => 'GET',
                        'timeout' => 30,
                        'headers' => ['Accept: application/json'],
                        'user_agent' => 'MuginScholar/1.0',
                    ],
                ];
            }
            $responses = muginHttpRequestMulti($namedRequests);
            foreach ($wave as $item) {
                $response = $responses[$item['key']] ?? null;
                $work = is_array($response) ? muginPublicSearchParseOpenAlexWorkLookupResponse($response) : null;
                $results[$item['key']] = $work;
                if (is_array($work)) {
                    muginPublicSearchStoreOpenAlexWorkCache($work, $domain);
                }
            }
        }

        return $results;
    }
}

if (!function_exists('muginPublicSearchFetchPubMedRecordsByDois')) {
    /**
     * Resolves DOIs that OpenAlex missed via PubMed `[doi]` search.
     *
     * @param array<int,string> $dois
     * @return array<string,array{pmid:string,record:array<string,mixed>}>
     */
    function muginPublicSearchFetchPubMedRecordsByDois(array $dois, string $domain = ''): array
    {
        $normalized = [];
        foreach ($dois as $doi) {
            $value = muginPublicSearchNormalizeDoi($doi);
            if ($value === '' || (function_exists('muginIsPlausibleDoiValue') && !muginIsPlausibleDoiValue($value))) {
                continue;
            }
            $normalized[strtolower($value)] = $value;
        }
        if ($normalized === []) {
            return [];
        }

        $pmidByDoi = [];
        foreach ($normalized as $key => $doi) {
            $term = '"' . str_replace('"', '', $doi) . '"[doi]';
            $search = muginPublicSearchFetchPubMedSearchIds($term, 1, 'relevance', $domain);
            $pmid = (string) ($search['pmids'][0] ?? '');
            if ($pmid !== '') {
                $pmidByDoi[$key] = $pmid;
            }
        }
        if ($pmidByDoi === []) {
            return [];
        }

        $summaries = muginPublicSearchFetchPubMedSummaryRecords(array_values($pmidByDoi), $domain);
        $results = [];
        foreach ($pmidByDoi as $doiKey => $pmid) {
            if (!isset($summaries[$pmid]) || !is_array($summaries[$pmid])) {
                continue;
            }
            $results[$doiKey] = [
                'pmid' => $pmid,
                'record' => $summaries[$pmid],
            ];
        }
        return $results;
    }
}

if (!function_exists('muginPublicSearchParsePublicationYear')) {
    /**
     * @param string $range
     * @return array{from: int|null, to: int|null}
     */
    function muginPublicSearchParsePublicationYear(string $range): array
    {
        $normalized = muginPublicSearchNormalizePublicationYearRange($range);
        if ($normalized === '') {
            return ['from' => null, 'to' => null];
        }
        if (strpos($normalized, '-') !== false) {
            [$from, $to] = explode('-', $normalized, 2);
            return ['from' => (int) $from, 'to' => (int) $to];
        }
        $year = (int) $normalized;
        return ['from' => $year, 'to' => $year];
    }
}

if (!function_exists('muginPublicSearchValueMatchesYearRange')) {
    /**
     * @param mixed $value
     * @param string $range
     * @return bool
     */
    function muginPublicSearchValueMatchesYearRange($value, string $range): bool
    {
        $parsed = muginPublicSearchParsePublicationYear($range);
        if ($parsed['from'] === null || $parsed['to'] === null) {
            return true;
        }
        $year = (int) trim((string) $value);
        if ($year <= 0) {
            return false;
        }
        return $year >= $parsed['from'] && $year <= $parsed['to'];
    }
}

if (!function_exists('muginPublicSearchCandidateMatchesHydratedFilters')) {
    /**
     * @param array<string,mixed> $candidate
     * @param array<string,mixed> $work
     * @param array<string,mixed> $hardFilters
     * @return bool
     */
    function muginPublicSearchCandidateMatchesHydratedFilters(array $candidate, array $work, array $hardFilters): bool
    {
        $publicationYear = muginPublicSearchNormalizePublicationYearRange($hardFilters['publicationYear'] ?? '');
        if ($publicationYear !== '') {
            $workYear = trim((string) ($work['publication_year'] ?? ''));
            if (!muginPublicSearchValueMatchesYearRange($workYear, $publicationYear)) {
                return false;
            }
        }

        $sourceFormats = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeSourceFormat', (array) ($hardFilters['sourceFormats'] ?? []))
        );
        if (!empty($sourceFormats)) {
            $workType = trim((string) ($work['type'] ?? ''));
            $sourceType = trim((string) (($work['primary_location']['source']['type'] ?? '')));
            $matchesFormat = false;
            foreach ($sourceFormats as $format) {
                if ($format === 'journal' && $sourceType === 'journal') {
                    $matchesFormat = true;
                } elseif ($format === 'conference' && $sourceType === 'conference') {
                    $matchesFormat = true;
                } elseif ($format === 'preprint' && $workType === 'preprint') {
                    $matchesFormat = true;
                }
            }
            if (!$matchesFormat) {
                return false;
            }
        }

        $publicationTypes = muginPublicSearchDedupeStrings(
            array_map('muginPublicSearchNormalizeHardPublicationType', (array) ($hardFilters['publicationTypes'] ?? []))
        );
        if (!empty($publicationTypes)) {
            $requiredWorkTypes = muginPublicSearchMapPublicationTypesToOpenAlexWorkTypes($publicationTypes);
            if (!empty($requiredWorkTypes)) {
                $workType = muginPublicSearchNormalizeOpenAlexWorkType($work['type'] ?? '');
                if ($workType === '' || !in_array($workType, $requiredWorkTypes, true)) {
                    return false;
                }
            }
        }

        // Language is intentionally not enforced here. Legacy applies language
        // via PubMed hardFilterQuery and OpenAlex retrieval filters only.

        return true;
    }
}

if (!function_exists('muginPublicSearchGetRerankConfig')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchGetRerankConfig(string $focusProfileId = ''): array
    {
        $config = defined('MUGIN_RERANK_CONFIG') && is_array(MUGIN_RERANK_CONFIG) ? MUGIN_RERANK_CONFIG : [];
        $default = [
            'sourceWeights' => [
                'pubmed' => 1.0,
                'semanticScholar' => 0.92,
                'openAlex' => 0.88,
                'elicit' => 0.9,
            ],
            'pmidBonus' => 10,
            'rankScale' => 100,
            'scoreScale' => 20,
            'fallbackSourceWeight' => 0.8,
            'overlapBonusPerExtraSource' => 35,
            'rrfK' => 60,
        ];
        $merged = [
            'sourceWeights' => array_merge(
                $default['sourceWeights'],
                is_array($config['sourceWeights'] ?? null) ? $config['sourceWeights'] : []
            ),
            'pmidBonus' => is_numeric($config['pmidBonus'] ?? null) ? (float) $config['pmidBonus'] : $default['pmidBonus'],
            'rankScale' => is_numeric($config['rankScale'] ?? null) ? (float) $config['rankScale'] : $default['rankScale'],
            'scoreScale' => is_numeric($config['scoreScale'] ?? null) ? (float) $config['scoreScale'] : $default['scoreScale'],
            'fallbackSourceWeight' => is_numeric($config['fallbackSourceWeight'] ?? null)
                ? (float) $config['fallbackSourceWeight']
                : $default['fallbackSourceWeight'],
            'overlapBonusPerExtraSource' => is_numeric($config['overlapBonusPerExtraSource'] ?? null)
                ? (float) $config['overlapBonusPerExtraSource']
                : $default['overlapBonusPerExtraSource'],
            'rrfK' => is_numeric($config['rrfK'] ?? null) ? (float) $config['rrfK'] : $default['rrfK'],
        ];

        // "focus" anvender kun de overrides, den deterministiske RRF-rerank
        // faktisk understoetter. De oevrige felter i profilens overrides
        // (pubTypeWeights, recencyBonusMax, clinicalBonus osv.) hoerer til
        // et kvalitetssignal-lag, der i dag kun findes i webappens JS, og
        // ignoreres derfor bevidst her.
        $focusProfile = muginPublicSearchGetFocusProfileConfig($focusProfileId);
        $overrides = is_array($focusProfile['overrides'] ?? null) ? $focusProfile['overrides'] : [];
        if (!empty($overrides)) {
            if (is_array($overrides['sourceWeights'] ?? null)) {
                $merged['sourceWeights'] = array_merge($merged['sourceWeights'], $overrides['sourceWeights']);
            }
            if (is_numeric($overrides['pmidBonus'] ?? null)) {
                $merged['pmidBonus'] = (float) $overrides['pmidBonus'];
            }
            if (is_numeric($overrides['overlapBonusPerExtraSource'] ?? null)) {
                $merged['overlapBonusPerExtraSource'] = (float) $overrides['overlapBonusPerExtraSource'];
            }
        }

        return $merged;
    }
}

if (!function_exists('muginPublicSearchGetSourceStats')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @return array<string,array<string,mixed>>
     */
    function muginPublicSearchGetSourceStats(array $sourceResults): array
    {
        $stats = [];
        foreach ($sourceResults as $sourceResult) {
            $sourceKey = trim((string) ($sourceResult['source'] ?? ''));
            if ($sourceKey === '') {
                continue;
            }
            $scores = [];
            foreach ((array) ($sourceResult['candidates'] ?? []) as $candidate) {
                if (is_numeric($candidate['score'] ?? null)) {
                    $scores[] = (float) $candidate['score'];
                }
            }
            $stats[$sourceKey] = [
                'candidateCount' => count((array) ($sourceResult['candidates'] ?? [])),
                'minScore' => !empty($scores) ? min($scores) : null,
                'maxScore' => !empty($scores) ? max($scores) : null,
            ];
        }
        return $stats;
    }
}

if (!function_exists('muginPublicSearchGetSourceSummary')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @return array<int,array<string,mixed>>
     */
    function muginPublicSearchGetSourceSummary(array $sourceResults): array
    {
        $summary = [];
        foreach ($sourceResults as $sourceResult) {
            $summary[] = [
                'source' => trim((string) ($sourceResult['source'] ?? '')),
                'query' => trim((string) ($sourceResult['query'] ?? '')),
                'total' => (int) ($sourceResult['total'] ?? 0),
                'candidateCount' => count((array) ($sourceResult['candidates'] ?? [])),
                'pmidCount' => count((array) ($sourceResult['pmids'] ?? [])),
                'doiCount' => count((array) ($sourceResult['dois'] ?? [])),
                'hasError' => trim((string) ($sourceResult['error'] ?? '')) !== '',
            ];
        }
        return $summary;
    }
}

// =====================================================================
// Enrichment lookups for the unified rerank engine (iCite + OpenAlex Authority)
// =====================================================================
//
// These mirror backend/api/ICiteLookup.php and backend/api/OpenAlexAuthorityLookup.php
// (used by the website widget) but are implemented as pure, requirable
// functions instead of standalone HTTP endpoints, since those endpoint files
// execute top-level request-handling/echo code on include and cannot safely
// be require()'d from inside another request's execution. Only used by the
// unified rerank path (MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED); the legacy
// RRF-only path does not call these and is unaffected.

if (!function_exists('muginPublicSearchNormalizeOpenAlexShortIdForEnrichment')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginPublicSearchNormalizeOpenAlexShortIdForEnrichment($value): string
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return '';
        }
        $raw = (string) preg_replace('~^https?://openalex\.org/~i', '', $raw);
        $raw = ltrim($raw, '/');
        $raw = strtoupper($raw);
        return preg_match('/^[A-Z][0-9]+$/', $raw) === 1 ? $raw : '';
    }
}

if (!function_exists('muginPublicSearchNormalizeICiteRecordForEnrichment')) {
    /**
     * Mirrors muginNormalizeICiteRecord() in backend/api/ICiteLookup.php.
     *
     * @param array<string,mixed> $record
     * @return array<string,mixed>
     */
    function muginPublicSearchNormalizeICiteRecordForEnrichment(array $record): array
    {
        $rcr = $record['relative_citation_ratio'] ?? null;
        $nihPercentile = $record['nih_percentile'] ?? null;
        $apt = $record['apt'] ?? null;
        $fieldCitationRate = $record['field_citation_rate'] ?? null;
        $citedByClin = $record['cited_by_clin'] ?? null;
        if (is_array($citedByClin)) {
            $citedByClin = count($citedByClin);
        }
        $isClinical = isset($record['is_clinical']) ? (bool) $record['is_clinical'] : null;

        return [
            'relativeCitationRatio' => is_numeric($rcr) ? (float) $rcr : null,
            'nihPercentile' => is_numeric($nihPercentile) ? (float) $nihPercentile : null,
            'isClinical' => $isClinical,
            'citedByClin' => is_numeric($citedByClin) ? (int) $citedByClin : null,
            'apt' => is_numeric($apt) ? (float) $apt : null,
            'fieldCitationRate' => is_numeric($fieldCitationRate) ? (float) $fieldCitationRate : null,
        ];
    }
}

if (!function_exists('muginPublicSearchFetchUnifiedEnrichmentSignals')) {
    /**
     * Fetches NIH iCite (citation-impact/clinical signals, PMID-keyed) and
     * OpenAlex Authority (author h-index, journal mean-citedness, DOAJ status)
     * data for every candidate across all source results, in ONE batch of
     * concurrent HTTP requests (curl_multi via muginHttpRequestMulti), so adding
     * these two enrichment lookups does not add sequential latency on top of
     * the existing source-fetch chain.
     *
     * @param array<int,array<string,mixed>> $sourceResults
     * @param string $domain
     * @return array{icite: array<string,array<string,mixed>>, authorityAuthors: array<string,array<string,mixed>>, authorityJournal: array<string,array<string,mixed>>}
     */
    function muginPublicSearchFetchUnifiedEnrichmentSignals(array $sourceResults, string $domain = ''): array
    {
        $pmids = [];
        $authorIds = [];
        $journalIds = [];
        foreach ($sourceResults as $sourceResult) {
            foreach ((array) ($sourceResult['candidates'] ?? []) as $candidate) {
                $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
                if ($pmid !== '') {
                    $pmids[$pmid] = true;
                }
                $metadata = isset($candidate['metadata']) && is_array($candidate['metadata']) ? $candidate['metadata'] : [];
                foreach ((array) ($metadata['authorIds'] ?? []) as $rawAuthorId) {
                    $shortId = muginPublicSearchNormalizeOpenAlexShortIdForEnrichment($rawAuthorId);
                    if ($shortId !== '') {
                        $authorIds[$shortId] = true;
                    }
                }
                $journalId = muginPublicSearchNormalizeOpenAlexShortIdForEnrichment($metadata['journalSourceId'] ?? '');
                if ($journalId !== '') {
                    $journalIds[$journalId] = true;
                }
            }
        }
        $pmids = array_keys($pmids);
        $authorIds = array_keys($authorIds);
        $journalIds = array_keys($journalIds);

        $result = ['icite' => [], 'authorityAuthors' => [], 'authorityJournal' => []];
        if (empty($pmids) && empty($authorIds) && empty($journalIds)) {
            return $result;
        }

        $namedRequests = [];

        // iCite: batches of 500 PMIDs (matches MUGIN_ICITE_BATCH_LIMIT in ICiteLookup.php).
        $iciteChunks = array_chunk($pmids, 500);
        foreach ($iciteChunks as $chunkIndex => $chunk) {
            muginThrottleRequestRate('icite', 5);
            $namedRequests['icite_' . $chunkIndex] = [
                'url' => 'https://icite.od.nih.gov/api/pubs?' . http_build_query(['pmids' => implode(',', $chunk)]),
                'options' => [
                    'method' => 'GET',
                    'timeout' => 20,
                    'user_agent' => 'MuginScholar/1.0',
                    'headers' => ['Accept: application/json'],
                ],
            ];
        }

        // OpenAlex Authority: batches of 50 ids (matches MUGIN_OPENALEX_AUTHORITY_BATCH_LIMIT
        // in OpenAlexAuthorityLookup.php; OpenAlex filter clauses get fragile above ~50 ids).
        $openAlexApiKey = function_exists('muginGetOpenAlexApiKey') ? muginGetOpenAlexApiKey($domain) : '';
        $openAlexEmail = function_exists('muginGetOpenAlexEmail') ? muginGetOpenAlexEmail($domain) : '';
        $buildAuthorityUrl = static function (string $entityPath, array $ids) use ($openAlexApiKey, $openAlexEmail): string {
            $params = [
                'filter' => 'openalex:' . implode('|', $ids),
                'per_page' => count($ids),
                'select' => $entityPath === 'authors'
                    ? 'id,display_name,summary_stats,works_count'
                    : 'id,display_name,summary_stats,is_in_doaj,works_count',
            ];
            if ($openAlexApiKey !== '') {
                $params['api_key'] = $openAlexApiKey;
            }
            if ($openAlexEmail !== '') {
                $params['mailto'] = $openAlexEmail;
            }
            return 'https://api.openalex.org/' . $entityPath . '?' . http_build_query($params);
        };
        foreach (array_chunk($authorIds, 50) as $chunkIndex => $chunk) {
            muginThrottleRequestRate('openalex', 10);
            $namedRequests['openalex_authors_' . $chunkIndex] = [
                'url' => $buildAuthorityUrl('authors', $chunk),
                'options' => ['method' => 'GET', 'timeout' => 30, 'user_agent' => 'MuginScholar/1.0', 'headers' => ['Accept: application/json']],
            ];
        }
        foreach (array_chunk($journalIds, 50) as $chunkIndex => $chunk) {
            muginThrottleRequestRate('openalex', 10);
            $namedRequests['openalex_sources_' . $chunkIndex] = [
                'url' => $buildAuthorityUrl('sources', $chunk),
                'options' => ['method' => 'GET', 'timeout' => 30, 'user_agent' => 'MuginScholar/1.0', 'headers' => ['Accept: application/json']],
            ];
        }

        if (empty($namedRequests)) {
            return $result;
        }

        $responses = muginHttpRequestMulti($namedRequests);

        foreach ($responses as $name => $response) {
            if (!muginPublicSearchIsHttpResultOk($response)) {
                continue;
            }
            $decoded = json_decode((string) $response['body'], true);
            if (!is_array($decoded)) {
                continue;
            }

            if (strpos($name, 'icite_') === 0) {
                foreach ((array) ($decoded['data'] ?? []) as $entry) {
                    if (!is_array($entry)) {
                        continue;
                    }
                    $pmid = isset($entry['pmid']) ? trim((string) $entry['pmid']) : '';
                    if ($pmid === '' || !preg_match('/^[0-9]+$/', $pmid)) {
                        continue;
                    }
                    $result['icite'][$pmid] = muginPublicSearchNormalizeICiteRecordForEnrichment($entry);
                }
                continue;
            }

            $isAuthorBatch = strpos($name, 'openalex_authors_') === 0;
            $isSourceBatch = strpos($name, 'openalex_sources_') === 0;
            if (!$isAuthorBatch && !$isSourceBatch) {
                continue;
            }
            foreach ((array) ($decoded['results'] ?? []) as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $shortId = muginPublicSearchNormalizeOpenAlexShortIdForEnrichment($row['id'] ?? '');
                if ($shortId === '') {
                    continue;
                }
                $summary = isset($row['summary_stats']) && is_array($row['summary_stats']) ? $row['summary_stats'] : [];
                if ($isAuthorBatch) {
                    $hIndex = $summary['h_index'] ?? null;
                    $result['authorityAuthors'][$shortId] = ['maxHIndex' => is_numeric($hIndex) ? (int) $hIndex : null];
                } else {
                    $hIndex = $summary['h_index'] ?? null;
                    $meanCitedness = $summary['2yr_mean_citedness'] ?? null;
                    $result['authorityJournal'][$shortId] = [
                        'meanCitedness' => is_numeric($meanCitedness) ? (float) $meanCitedness : null,
                        'hIndex' => is_numeric($hIndex) ? (int) $hIndex : null,
                        'isInDoaj' => isset($row['is_in_doaj']) ? (bool) $row['is_in_doaj'] : null,
                    ];
                }
            }
        }

        return $result;
    }
}

if (!function_exists('muginPublicSearchInjectEnrichmentIntoSourceResults')) {
    /**
     * Merges the enrichment maps from muginPublicSearchFetchUnifiedEnrichmentSignals()
     * into each candidate's metadata, using the exact key names
     * muginSemanticQualityMergeEnrichedFromCandidate() (semantic-quality-lib.php)
     * reads: metadata.icite, metadata.authorityAuthors, metadata.authorityJournal.
     *
     * @param array<int,array<string,mixed>> $sourceResults
     * @param array{icite: array<string,array<string,mixed>>, authorityAuthors: array<string,array<string,mixed>>, authorityJournal: array<string,array<string,mixed>>} $enrichment
     * @return array<int,array<string,mixed>>
     */
    function muginPublicSearchInjectEnrichmentIntoSourceResults(array $sourceResults, array $enrichment): array
    {
        if (empty($enrichment['icite']) && empty($enrichment['authorityAuthors']) && empty($enrichment['authorityJournal'])) {
            return $sourceResults;
        }

        foreach ($sourceResults as $sourceIndex => $sourceResult) {
            $candidates = (array) ($sourceResult['candidates'] ?? []);
            foreach ($candidates as $candidateIndex => $candidate) {
                $metadata = isset($candidate['metadata']) && is_array($candidate['metadata']) ? $candidate['metadata'] : [];

                $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
                if ($pmid !== '' && isset($enrichment['icite'][$pmid])) {
                    $metadata['icite'] = $enrichment['icite'][$pmid];
                }

                $authorIds = (array) ($metadata['authorIds'] ?? []);
                if (!empty($authorIds) && !empty($enrichment['authorityAuthors'])) {
                    $maxHIndex = null;
                    foreach ($authorIds as $rawAuthorId) {
                        $shortId = muginPublicSearchNormalizeOpenAlexShortIdForEnrichment($rawAuthorId);
                        $record = $shortId !== '' ? ($enrichment['authorityAuthors'][$shortId] ?? null) : null;
                        if (is_array($record) && is_int($record['maxHIndex'] ?? null)) {
                            if ($maxHIndex === null || $record['maxHIndex'] > $maxHIndex) {
                                $maxHIndex = $record['maxHIndex'];
                            }
                        }
                    }
                    if ($maxHIndex !== null) {
                        $metadata['authorityAuthors'] = ['maxHIndex' => $maxHIndex];
                    }
                }

                $journalId = muginPublicSearchNormalizeOpenAlexShortIdForEnrichment($metadata['journalSourceId'] ?? '');
                if ($journalId !== '' && isset($enrichment['authorityJournal'][$journalId])) {
                    $metadata['authorityJournal'] = $enrichment['authorityJournal'][$journalId];
                }

                $candidates[$candidateIndex]['metadata'] = $metadata;
            }
            $sourceResults[$sourceIndex]['candidates'] = $candidates;
        }

        return $sourceResults;
    }
}

if (!function_exists('muginPublicSearchGetSemanticRescueConfig')) {
    /**
     * Ported from getSemanticRescueConfig() in DropdownWrapper.vue (~7271-7290).
     * Reads MUGIN_SEMANTIC_RESCUE_CONFIG with the exact same defaults as the
     * website widget's DEFAULT_SEMANTIC_RESCUE_CONFIG.
     *
     * @return array{mode:string,minMergedCandidates:int,minSourceCandidates:int,searchLimit:int,maxCandidates:int,minLexicalScore:int}
     */
    function muginPublicSearchGetSemanticRescueConfig(): array
    {
        $defaults = [
            'mode' => 'configurable_default_sparse',
            'minMergedCandidates' => 25,
            'minSourceCandidates' => 12,
            'searchLimit' => 80,
            'maxCandidates' => 20,
            'minLexicalScore' => 3,
        ];
        $raw = defined('MUGIN_SEMANTIC_RESCUE_CONFIG') && is_array(MUGIN_SEMANTIC_RESCUE_CONFIG) ? MUGIN_SEMANTIC_RESCUE_CONFIG : [];
        $mode = trim((string) ($raw['mode'] ?? $defaults['mode']));
        $normalized = ['mode' => $mode !== '' ? $mode : $defaults['mode']];
        foreach (['minMergedCandidates', 'minSourceCandidates', 'searchLimit', 'maxCandidates', 'minLexicalScore'] as $key) {
            $parsed = $raw[$key] ?? null;
            $normalized[$key] = is_numeric($parsed) && (int) $parsed > 0 ? (int) $parsed : $defaults[$key];
        }
        return $normalized;
    }
}

if (!function_exists('muginPublicSearchBuildSemanticCandidateKey')) {
    /**
     * Ported from buildSemanticCandidateKey() in DropdownWrapper.vue (~7291-7300).
     *
     * @param array<string,mixed> $candidate
     * @return string
     */
    function muginPublicSearchBuildSemanticCandidateKey(array $candidate): string
    {
        $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
        if ($pmid !== '') {
            return 'pmid:' . $pmid;
        }
        $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
        if ($doi !== '') {
            return 'doi:' . strtolower($doi);
        }
        $openAlexId = trim((string) ($candidate['openAlexId'] ?? ($candidate['metadata']['workId'] ?? '')));
        if ($openAlexId !== '') {
            return 'oa:' . strtolower($openAlexId);
        }
        $title = trim((string) ($candidate['title'] ?? ''));
        return $title !== '' ? 'title:' . strtolower($title) : '';
    }
}

if (!function_exists('muginPublicSearchShouldRunPubMedLexicalRescue')) {
    /**
     * Ported from shouldRunPubMedLexicalRescue() in DropdownWrapper.vue
     * (~7388-7452). Unlike the website widget (which distinguishes a separate
     * "PubMed Best Match" fetch from the multi-source fetch), the public API
     * always fetches PubMed as one ordinary entry in $sourceResults when
     * selected - so "usePubMedBestMatch" here simply means "pubmed is one of
     * the requested sources", and activeSourceResults excludes that pubmed
     * entry itself (matching the JS filter exactly).
     *
     * @param array<int,array<string,mixed>> $sourceResults
     * @param string $pubmedQuery
     * @param bool $pubmedIsSelected
     * @return array{shouldRun:bool,reason:string}
     */
    function muginPublicSearchShouldRunPubMedLexicalRescue(array $sourceResults, string $pubmedQuery, bool $pubmedIsSelected): array
    {
        $rescueConfig = muginPublicSearchGetSemanticRescueConfig();
        $mode = strtolower($rescueConfig['mode']);
        $normalizedPubMedQuery = trim($pubmedQuery);

        $activeSourceResults = array_filter($sourceResults, static function ($result) {
            return is_array($result) && ($result['source'] ?? '') !== 'pubmed';
        });

        if (!$pubmedIsSelected) {
            return ['shouldRun' => false, 'reason' => 'pubmed-not-selected'];
        }
        if (empty($activeSourceResults) || $normalizedPubMedQuery === '') {
            return ['shouldRun' => false, 'reason' => 'inactive'];
        }
        if (in_array($mode, ['off', 'disabled', 'none'], true)) {
            return ['shouldRun' => false, 'reason' => 'disabled'];
        }
        if (in_array($mode, ['always', 'always_multi_source'], true)) {
            return ['shouldRun' => true, 'reason' => 'mode-always'];
        }

        $candidateKeys = [];
        $sourceCandidateCount = 0;
        foreach ($activeSourceResults as $result) {
            $candidates = (array) ($result['candidates'] ?? []);
            $sourceCandidateCount += count($candidates);
            foreach ($candidates as $candidate) {
                if (!is_array($candidate)) {
                    continue;
                }
                $key = muginPublicSearchBuildSemanticCandidateKey($candidate);
                if ($key !== '') {
                    $candidateKeys[$key] = true;
                }
            }
        }
        $mergedCandidateCount = count($candidateKeys);
        $isSparse = $mergedCandidateCount < $rescueConfig['minMergedCandidates']
            || $sourceCandidateCount < $rescueConfig['minSourceCandidates'];

        return ['shouldRun' => $isSparse, 'reason' => $isSparse ? 'sparse-first-harvest' : 'sufficient-first-harvest'];
    }
}

if (!function_exists('muginPublicSearchFetchPubMedLexicalRescueResult')) {
    /**
     * Ported from fetchPubMedLexicalRescueResult() in DropdownWrapper.vue
     * (~7633-7733): fetches additional PubMed candidates (excluding PMIDs
     * already present in $sourceResults), scores them lexically against the
     * query, and keeps only those meeting minLexicalScore - tagged with
     * metadata.lexicalRescue=true so the rerank/response layer can surface
     * provenance, exactly like the website widget.
     *
     * @param string $semanticQuery
     * @param string $pubmedQuery
     * @param array<int,array<string,mixed>> $sourceResults
     * @param string $triggerReason
     * @param string $domain
     * @return array<string,mixed> A source-result shaped like muginPublicSearchNormalizeSourceResult('pubmed', ...).
     */
    function muginPublicSearchFetchPubMedLexicalRescueResult(
        string $semanticQuery,
        string $pubmedQuery,
        array $sourceResults,
        string $triggerReason,
        string $domain = ''
    ): array {
        $rescueConfig = muginPublicSearchGetSemanticRescueConfig();
        $normalizedPubMedQuery = trim($pubmedQuery);
        $normalizedSemanticQuery = trim($semanticQuery);
        $resultQuery = $normalizedPubMedQuery !== '' ? $normalizedPubMedQuery : $normalizedSemanticQuery;
        $empty = muginPublicSearchCreateEmptySourceResult('pubmed', $resultQuery);

        $existingPmids = [];
        foreach ($sourceResults as $result) {
            foreach ((array) ($result['pmids'] ?? []) as $pmid) {
                $normalized = muginPublicSearchNormalizePmid($pmid);
                if ($normalized !== '') {
                    $existingPmids[$normalized] = true;
                }
            }
            foreach ((array) ($result['candidates'] ?? []) as $candidate) {
                $normalized = muginPublicSearchNormalizePmid(is_array($candidate) ? ($candidate['pmid'] ?? '') : '');
                if ($normalized !== '') {
                    $existingPmids[$normalized] = true;
                }
            }
        }

        $searchLimit = max(1, $rescueConfig['searchLimit']);
        $maxCandidates = max(1, $rescueConfig['maxCandidates']);
        $minLexicalScore = max(1, $rescueConfig['minLexicalScore']);

        $search = muginPublicSearchFetchPubMedSearchIds($normalizedPubMedQuery, $searchLimit, 'relevance', $domain);
        $rescuePmids = array_values(array_slice(array_filter(
            $search['pmids'],
            static fn($pmid) => !isset($existingPmids[$pmid])
        ), 0, $searchLimit));

        if (empty($rescuePmids)) {
            return array_merge($empty, ['total' => $search['searchCount']]);
        }

        $summaryRecords = muginPublicSearchFetchPubMedSummaryRecords($rescuePmids, $domain);
        $abstractMap = muginPublicSearchFetchPubMedAbstractMap($rescuePmids, $domain);
        $lexicalQueryText = muginSemanticQualityNormalizeLexicalSearchText($normalizedSemanticQuery !== '' ? $normalizedSemanticQuery : $normalizedPubMedQuery);
        $lexicalQueryTokens = muginSemanticQualityTokenizeLexicalSearchText($normalizedSemanticQuery !== '' ? $normalizedSemanticQuery : $normalizedPubMedQuery);

        $scoredCandidates = [];
        foreach ($rescuePmids as $index => $pmid) {
            $record = $summaryRecords[$pmid] ?? [];
            $title = trim((string) ($record['title'] ?? ''));
            $abstractText = trim((string) ($abstractMap[$pmid]['abstract'] ?? ''));
            $lexicalScore = muginSemanticQualityScoreLexicalTextWithQuery($lexicalQueryTokens, $lexicalQueryText, $title, $abstractText);
            if ($title === '' || $lexicalScore < $minLexicalScore) {
                continue;
            }
            $scoredCandidates[] = [
                'source' => 'pubmed',
                'rank' => $index + 1,
                'pmid' => $pmid,
                'title' => $title,
                'score' => $lexicalScore,
                'metadata' => [
                    'publicationYear' => muginPublicSearchExtractPubMedSummaryPublicationYear($record),
                    'venue' => trim((string) ($record['fulljournalname'] ?? ($record['source'] ?? ''))),
                    'publicationTypes' => muginPublicSearchNormalizeSimpleList($record['pubtype'] ?? []),
                    'lexicalRescue' => true,
                    'lexicalRescueAbstractAvailable' => $abstractText !== '',
                    'lexicalRescueTriggerReason' => trim($triggerReason),
                ],
            ];
        }

        usort($scoredCandidates, static function ($left, $right) {
            $scoreDiff = ((float) $right['score']) - ((float) $left['score']);
            if ($scoreDiff !== 0.0) {
                return $scoreDiff > 0 ? 1 : -1;
            }
            return ((int) $left['rank']) <=> ((int) $right['rank']);
        });

        $acceptedCandidates = array_slice($scoredCandidates, 0, $maxCandidates);
        foreach ($acceptedCandidates as $index => &$candidate) {
            $candidate['rank'] = $index + 1;
        }
        unset($candidate);

        return muginPublicSearchNormalizeSourceResult('pubmed', $resultQuery, [
            'total' => $search['searchCount'],
            'pmids' => array_column($acceptedCandidates, 'pmid'),
            'candidates' => $acceptedCandidates,
        ]);
    }
}

if (!function_exists('muginPublicSearchRerankSemanticCandidates')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @param string $focusProfileId
     * @return array<string,mixed>
     */
    function muginPublicSearchRerankSemanticCandidates(array $sourceResults, string $focusProfileId = ''): array
    {
        $activeSourceResults = array_values(array_filter($sourceResults, static function ($sourceResult) {
            return !empty($sourceResult['candidates']) && is_array($sourceResult['candidates']);
        }));
        if (function_exists('muginSemanticQualitySortSourceResultsDeterministically')) {
            $activeSourceResults = muginSemanticQualitySortSourceResultsDeterministically($activeSourceResults);
        }
        $rerankConfig = muginPublicSearchGetRerankConfig($focusProfileId);
        $sourceStats = muginPublicSearchGetSourceStats($activeSourceResults);
        $sourceSummary = muginPublicSearchGetSourceSummary($activeSourceResults);
        $rerankMode = count($activeSourceResults) <= 1 ? 'single' : 'multi';

        $merged = [];
        $mergeEvents = [];
        $rawCandidateCount = 0;

        foreach ($activeSourceResults as $sourceResult) {
            foreach ((array) ($sourceResult['candidates'] ?? []) as $candidate) {
                if (!is_array($candidate)) {
                    continue;
                }
                $rawCandidateCount++;
                $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
                $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
                $key = $pmid !== '' ? 'pmid:' . $pmid : ($doi !== '' ? 'doi:' . strtolower($doi) : '');
                if ($key === '') {
                    continue;
                }
                if (!isset($merged[$key])) {
                    $merged[$key] = [
                        'pmid' => $pmid,
                        'doi' => $doi,
                        'title' => trim((string) ($candidate['title'] ?? '')),
                        'abstract' => trim((string) ($candidate['abstract'] ?? '')),
                        'openAlexId' => trim((string) ($candidate['openAlexId'] ?? '')),
                        'source' => trim((string) ($candidate['source'] ?? '')),
                        'metadata' => isset($candidate['metadata']) && is_array($candidate['metadata']) ? $candidate['metadata'] : [],
                        'sources' => [],
                    ];
                } else {
                    $mergeEvents[] = [
                        'key' => $key,
                        'source' => trim((string) ($candidate['source'] ?? '')),
                    ];
                }

                $entry = &$merged[$key];
                $sourceKey = trim((string) ($candidate['source'] ?? ''));
                $candidateRank = is_numeric($candidate['rank'] ?? null) ? (int) $candidate['rank'] : PHP_INT_MAX;
                $candidateScore = is_numeric($candidate['score'] ?? null) ? (float) $candidate['score'] : null;
                if (
                    $sourceKey !== '' &&
                    (!isset($entry['sources'][$sourceKey]) || $candidateRank < (int) $entry['sources'][$sourceKey]['rank'])
                ) {
                    $entry['sources'][$sourceKey] = [
                        'rank' => $candidateRank,
                        'score' => $candidateScore,
                    ];
                }
                if ($entry['pmid'] === '' && $pmid !== '') {
                    $entry['pmid'] = $pmid;
                }
                if ($entry['doi'] === '' && $doi !== '') {
                    $entry['doi'] = $doi;
                }
                if ($entry['title'] === '' && trim((string) ($candidate['title'] ?? '')) !== '') {
                    $entry['title'] = trim((string) ($candidate['title'] ?? ''));
                }
                if ($entry['abstract'] === '' && trim((string) ($candidate['abstract'] ?? '')) !== '') {
                    $entry['abstract'] = trim((string) ($candidate['abstract'] ?? ''));
                }
                if ($entry['openAlexId'] === '' && trim((string) ($candidate['openAlexId'] ?? '')) !== '') {
                    $entry['openAlexId'] = trim((string) ($candidate['openAlexId'] ?? ''));
                }
                unset($entry);
            }
        }

        ksort($merged, SORT_STRING);
        $rankedCandidates = [];
        foreach ($merged as $entry) {
            $combinedScore = 0.0;
            $scoreTieBreaker = 0.0;
            $rrfScore = 0.0;
            $pmidBonus = $entry['pmid'] !== '' ? (float) $rerankConfig['pmidBonus'] : 0.0;
            $combinedScore += $pmidBonus;
            $bestRank = PHP_INT_MAX;

            foreach ($entry['sources'] as $sourceKey => $sourceData) {
                $rank = max(1, (int) ($sourceData['rank'] ?? PHP_INT_MAX));
                $bestRank = min($bestRank, $rank);
                $sourceWeight = isset($rerankConfig['sourceWeights'][$sourceKey])
                    ? (float) $rerankConfig['sourceWeights'][$sourceKey]
                    : (float) $rerankConfig['fallbackSourceWeight'];
                $weightedRrf = ($sourceWeight * (float) $rerankConfig['rankScale'] * (float) $rerankConfig['rrfK'])
                    / ((float) $rerankConfig['rrfK'] + $rank);
                $rrfScore += $weightedRrf;
                $combinedScore += $weightedRrf;

                $rawScore = $sourceData['score'];
                $sourceStat = $sourceStats[$sourceKey] ?? [];
                $minScore = $sourceStat['minScore'] ?? null;
                $maxScore = $sourceStat['maxScore'] ?? null;
                if ($rawScore !== null && is_numeric($rawScore) && $minScore !== null && $maxScore !== null) {
                    $normalizedScore = $maxScore > $minScore
                        ? (((float) $rawScore - (float) $minScore) / ((float) $maxScore - (float) $minScore))
                        : 1.0;
                    $scoreTieBreaker += $normalizedScore * $sourceWeight * (float) $rerankConfig['scoreScale'];
                }
            }

            $overlapBonus = 0.0;
            if ($rerankMode === 'multi' && count($entry['sources']) > 1) {
                $overlapBonus = (count($entry['sources']) - 1) * (float) $rerankConfig['overlapBonusPerExtraSource'];
                $combinedScore += $overlapBonus;
            }

            $rankedCandidates[] = [
                'pmid' => $entry['pmid'],
                'doi' => $entry['doi'],
                'title' => $entry['title'],
                'abstract' => $entry['abstract'],
                'openAlexId' => $entry['openAlexId'],
                'source' => $entry['source'],
                'metadata' => $entry['metadata'],
                'sources' => array_keys($entry['sources']),
                'sourceBreakdown' => $entry['sources'],
                'combinedScore' => round($combinedScore, 4),
                'scoreTieBreaker' => round($scoreTieBreaker, 4),
                'bestRank' => $bestRank === PHP_INT_MAX ? 0 : $bestRank,
                'sourceCount' => count($entry['sources']),
                'scoreBreakdown' => [
                    'rrfScore' => round($rrfScore, 4),
                    'overlapBonus' => round($overlapBonus, 4),
                    'pmidBonus' => round($pmidBonus, 4),
                    'scoreTieBreaker' => round($scoreTieBreaker, 4),
                ],
            ];
        }

        usort($rankedCandidates, static function ($left, $right) use ($rerankMode) {
            if ($rerankMode === 'single') {
                if ((int) $left['bestRank'] !== (int) $right['bestRank']) {
                    return (int) $left['bestRank'] <=> (int) $right['bestRank'];
                }
                if ((float) $left['scoreTieBreaker'] !== (float) $right['scoreTieBreaker']) {
                    return ((float) $left['scoreTieBreaker'] < (float) $right['scoreTieBreaker']) ? 1 : -1;
                }
            } else {
                if ((float) $left['combinedScore'] !== (float) $right['combinedScore']) {
                    return ((float) $left['combinedScore'] < (float) $right['combinedScore']) ? 1 : -1;
                }
                if ((float) $left['scoreTieBreaker'] !== (float) $right['scoreTieBreaker']) {
                    return ((float) $left['scoreTieBreaker'] < (float) $right['scoreTieBreaker']) ? 1 : -1;
                }
                if ((int) $left['bestRank'] !== (int) $right['bestRank']) {
                    return (int) $left['bestRank'] <=> (int) $right['bestRank'];
                }
            }
            if (function_exists('muginSemanticQualityCompareCandidateIdentity')) {
                return muginSemanticQualityCompareCandidateIdentity($left, $right);
            }
            $leftPmid = trim((string) ($left['pmid'] ?? ''));
            $rightPmid = trim((string) ($right['pmid'] ?? ''));
            if ($leftPmid !== $rightPmid) {
                return $leftPmid <=> $rightPmid;
            }
            return strtolower(trim((string) ($left['doi'] ?? '')))
                <=> strtolower(trim((string) ($right['doi'] ?? '')));
        });

        return [
            'candidates' => $rankedCandidates,
            'pmids' => muginPublicSearchDedupeStrings(array_map(static function ($candidate) {
                return $candidate['pmid'] ?? '';
            }, $rankedCandidates), 'muginPublicSearchNormalizePmid'),
            'dois' => muginPublicSearchDedupeStrings(array_map(static function ($candidate) {
                return $candidate['doi'] ?? '';
            }, $rankedCandidates), 'muginPublicSearchNormalizeDoi'),
            'rerankMode' => $rerankMode,
            'diagnostics' => [
                'rerankConfig' => $rerankConfig,
                'sourceStats' => $sourceStats,
                'sourceSummary' => $sourceSummary,
                'mergeSummary' => [
                    'rawCandidateCount' => $rawCandidateCount,
                    'mergedCandidateCount' => count($rankedCandidates),
                    'duplicateCount' => count($mergeEvents),
                ],
                'mergeEvents' => $mergeEvents,
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchResolveOrderedSearchPmids')) {
    /**
     * @param string $hardFilterQuery
     * @param array<int,string> $orderedPmids
     * @param string $sortMethod
     * @param string $domain
     * @return array{count: int, orderedIds: array<int,string>, validationQuery: string, diagnostics: array<string,mixed>}
     */
    function muginPublicSearchResolveOrderedSearchPmids(
        string $hardFilterQuery,
        array $orderedPmids,
        string $sortMethod,
        string $domain = ''
    ): array {
        $orderedPmids = muginPublicSearchDedupeStrings($orderedPmids, 'muginPublicSearchNormalizePmid');
        $requestedCount = count($orderedPmids);
        $pmidClause = !empty($orderedPmids) ? '(' . implode(' ', $orderedPmids) . ')' : '';
        $validationQuery = $hardFilterQuery !== ''
            ? ($pmidClause !== '' ? $pmidClause . ' AND (' . $hardFilterQuery . ')' : $hardFilterQuery)
            : $pmidClause;
        if ($validationQuery === '') {
            return [
                'count' => 0,
                'orderedIds' => [],
                'validationQuery' => '',
                'diagnostics' => [
                    'requestedCount' => $requestedCount,
                    'matchedCount' => 0,
                    'unmatchedCount' => 0,
                    'sortMethod' => $sortMethod,
                ],
            ];
        }
        $search = muginPublicSearchNlmGetJson('esearch.fcgi', [
            'db' => 'pubmed',
            'retmode' => 'json',
            'retmax' => count($orderedPmids),
            'retstart' => 0,
            'sort' => $sortMethod,
            'term' => $validationQuery,
        ], $domain);
        $matchedIds = muginPublicSearchDedupeStrings(
            (array) ($search['esearchresult']['idlist'] ?? []),
            'muginPublicSearchNormalizePmid'
        );
        $matchedSet = array_fill_keys($matchedIds, true);
        $orderedMatched = array_values(array_filter($orderedPmids, static function ($pmid) use ($matchedSet) {
            return isset($matchedSet[$pmid]);
        }));
        $remainingMatched = array_values(array_filter($matchedIds, static function ($pmid) use ($orderedMatched) {
            return !in_array($pmid, $orderedMatched, true);
        }));
        return [
            'count' => (int) (($search['esearchresult']['count'] ?? 0)),
            'orderedIds' => array_values(array_merge($orderedMatched, $remainingMatched)),
            'validationQuery' => $validationQuery,
            'diagnostics' => [
                'requestedCount' => $requestedCount,
                'matchedCount' => count($matchedIds),
                'unmatchedCount' => max(0, $requestedCount - count($orderedMatched)),
                'sortMethod' => $sortMethod,
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchBuildAllowedCandidateKeys')) {
    /**
     * @param array<int,array<string,mixed>> $orderedCandidates
     * @param array<int,string> $trustedPmids
     * @param array<string,mixed> $hardFilters
     * @param string $domain
     * @param callable|null $progressCallback
     * @param array<string,mixed> $postValidationRuleState
     * @param array<string,mixed>|null $processDetailsCollector
     * @param string $responseLanguage
     * @return array{allowedKeys: array<int,string>, hydratedByKey: array<string,array<string,mixed>>, warnings: array<int,string>, diagnostics: array<string,mixed>}
     */
    function muginPublicSearchBuildAllowedCandidateKeys(
        array $orderedCandidates,
        array $trustedPmids,
        array $hardFilters,
        string $domain = '',
        ?callable $progressCallback = null,
        array $postValidationRuleState = [],
        ?array &$processDetailsCollector = null,
        string $responseLanguage = 'da'
    ): array {
        $trustedSet = array_fill_keys(muginPublicSearchDedupeStrings($trustedPmids, 'muginPublicSearchNormalizePmid'), true);
        $allowedKeys = [];
        $hydratedByKey = [];
        $warnings = [];
        $pmidCandidateCount = 0;
        $pmidRejectedByTrustCount = 0;
        $doiCandidateCount = 0;
        $openAlexIdCandidateCount = 0;
        $doiHydratedCount = 0;
        $doiRejectedByFilterCount = 0;
        $semanticScholarFallbackCount = 0;
        $excludedExamples = [];
        $hydratedHardFilters = $hardFilters;
        // Language is applied via PubMed hardFilterQuery + OpenAlex retrieval
        // filters in the legacy flow — not on the DOI hydration pass.
        $hydratedHardFilters['languages'] = [];
        if (
            !empty($postValidationRuleState['activeRules'])
            || !empty($postValidationRuleState['ruleGroups'])
        ) {
            // Metadata rules own source-format validation so exclusions retain
            // the same rule explanation as the legacy flow.
            $hydratedHardFilters['sourceFormats'] = [];
        }

        // First pass: resolve PMID candidates immediately (no network I/O —
        // trust-set lookup only), and collect DOI-only candidates that need
        // OpenAlex hydration for a second, batched/parallel pass below.
        // DOI-only hydration used to happen one candidate at a time inside
        // this same loop (one blocking muginHttpRequest() call per candidate),
        // which made searches with many DOI-only candidates (e.g. a
        // semanticScholar/elicit-only query with no PubMed results to supply
        // PMIDs) take minutes instead of seconds. See
        // muginPublicSearchFetchOpenAlexWorksByCandidatesParallel().
        $doiEntries = [];
        foreach ($orderedCandidates as $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            $openAlexId = trim((string) ($candidate['openAlexId'] ?? ''));
            if ($doi !== '') {
                $doiCandidateCount++;
            }
            if ($openAlexId !== '') {
                $openAlexIdCandidateCount++;
            }
            $key = $pmid !== '' ? 'pmid:' . $pmid : ($doi !== '' ? 'doi:' . strtolower($doi) : '');
            if ($key === '') {
                continue;
            }
            if ($pmid !== '') {
                $pmidCandidateCount++;
                if (!empty($trustedSet) && !isset($trustedSet[$pmid])) {
                    $pmidRejectedByTrustCount++;
                    continue;
                }
                $allowedKeys[] = $key;
                continue;
            }

            $doiEntries[] = [
                'key' => $key,
                'candidate' => $candidate,
                'doi' => $doi,
                'openAlexId' => $openAlexId,
            ];
        }

        $blockingLimit = 150;
        $blockingEntries = array_slice($doiEntries, 0, $blockingLimit);
        $deferredEntries = array_slice($doiEntries, $blockingLimit);
        $doiLookupValues = array_values(array_filter(array_map(
            static fn($entry) => trim((string) ($entry['doi'] ?? '')),
            $doiEntries
        )));
        $openAlexLookupValues = array_values(array_filter(array_map(
            static fn($entry) => trim((string) ($entry['openAlexId'] ?? '')),
            $doiEntries
        )));
        $lookupRequests = [];
        foreach (['dois' => $doiLookupValues, 'openAlexIds' => $openAlexLookupValues] as $parameter => $values) {
            if (empty($values)) {
                continue;
            }
            $lookupRequests[] = [
                'endpoint' => 'OpenAlex work lookup',
                'parameter' => $parameter,
                'count' => count($values),
                'values' => array_slice($values, 0, 25),
                'truncated' => count($values) > 25,
                'domain' => $domain,
            ];
        }
        $worksByKey = [];
        if (!empty($doiEntries)) {
            muginPublicSearchEmitProgress($progressCallback, 'finalizeValidateDoiFetch', '', [
                'stepId' => 'finalizeValidateDoiFetch',
                'groupId' => 'match',
                'groupKey' => 'semanticSearchProcessGroupMatch',
                'messageKey' => 'semanticSearchProgressFinalizeValidateDoiFetch',
                'total' => count($doiEntries),
            ]);

            $worksByKey = muginPublicSearchFetchOpenAlexWorksByCandidatesParallel($blockingEntries, $domain);
            if (!empty($deferredEntries)) {
                $worksByKey = array_merge(
                    $worksByKey,
                    muginPublicSearchFetchOpenAlexWorksByCandidatesParallel($deferredEntries, $domain)
                );
            }
            $resolvedWorksByKey = [];
            foreach ($doiEntries as $entry) {
                $key = $entry['key'];
                $work = $worksByKey[$key] ?? null;
                if (!is_array($work)) {
                    $candidateMetadata = isset($entry['candidate']['metadata']) && is_array($entry['candidate']['metadata'])
                        ? $entry['candidate']['metadata']
                        : [];
                    $enriched = isset($entry['candidate']['enriched']) && is_array($entry['candidate']['enriched'])
                        ? $entry['candidate']['enriched']
                        : [];
                    if (
                        trim((string) ($entry['candidate']['title'] ?? '')) !== ''
                        && (!empty($candidateMetadata) || !empty($enriched))
                    ) {
                        $work = [
                            'id' => trim((string) ($entry['openAlexId'] ?? '')),
                            'doi' => trim((string) ($entry['doi'] ?? '')),
                            'display_name' => trim((string) ($entry['candidate']['title'] ?? '')),
                            'publication_year' => $enriched['publicationYear'] ?? ($candidateMetadata['publicationYear'] ?? null),
                            'publication_date' => $enriched['publicationDate'] ?? ($candidateMetadata['publicationDate'] ?? ''),
                            'type' => $enriched['workType'] ?? ($candidateMetadata['workType'] ?? ''),
                            'language' => $enriched['language'] ?? ($candidateMetadata['language'] ?? ''),
                            'primary_location' => [
                                'source' => [
                                    'type' => $enriched['sourceType'] ?? ($candidateMetadata['sourceType'] ?? ''),
                                    'display_name' => $enriched['venue'] ?? ($candidateMetadata['venue'] ?? ''),
                                ],
                            ],
                            '_semanticScholarFallback' => true,
                        ];
                        $semanticScholarFallbackCount++;
                    } else {
                        $warnings[] = 'OpenAlex hydration failed for DOI candidate ' . strtolower($entry['doi']);
                        continue;
                    }
                }
                $doiHydratedCount++;
                $resolvedWorksByKey[$key] = $work;
            }

            foreach ($doiEntries as $entry) {
                $key = $entry['key'];
                $work = $resolvedWorksByKey[$key] ?? null;
                if (!is_array($work)) {
                    continue;
                }
                if (!muginPublicSearchCandidateMatchesHydratedFilters($entry['candidate'], $work, $hydratedHardFilters)) {
                    $doiRejectedByFilterCount++;
                    if (count($excludedExamples) < 10) {
                        $excludedExamples[] = [
                            'pmid' => '',
                            'doi' => (string) $entry['doi'],
                            'source' => (string) ($entry['candidate']['source'] ?? ''),
                            'title' => (string) ($entry['candidate']['title'] ?? ''),
                            'reason' => 'hard-filter-mismatch',
                            'ruleExplanation' => null,
                        ];
                    }
                    continue;
                }
                $ruleCandidate = $entry['candidate'];
                $ruleEnriched = isset($ruleCandidate['enriched']) && is_array($ruleCandidate['enriched'])
                    ? $ruleCandidate['enriched']
                    : [];
                $workSource = isset($work['primary_location']['source']) && is_array($work['primary_location']['source'])
                    ? $work['primary_location']['source']
                    : [];
                $ruleCandidate['enriched'] = array_merge($ruleEnriched, [
                    'publicationYear' => $work['publication_year'] ?? ($ruleEnriched['publicationYear'] ?? null),
                    'publicationDate' => $work['publication_date'] ?? ($ruleEnriched['publicationDate'] ?? ''),
                    'workType' => $work['type'] ?? ($ruleEnriched['workType'] ?? ''),
                    'sourceType' => $workSource['type'] ?? ($ruleEnriched['sourceType'] ?? ''),
                    'venue' => $workSource['display_name'] ?? ($ruleEnriched['venue'] ?? ''),
                    'language' => $work['language'] ?? ($ruleEnriched['language'] ?? ''),
                ]);
                $ruleExplanation = muginSemanticQualityCandidateMatchesPostValidation(
                    $ruleCandidate,
                    $postValidationRuleState
                );
                if (($ruleExplanation['matches'] ?? true) !== true) {
                    $doiRejectedByFilterCount++;
                    if (count($excludedExamples) < 10) {
                        $excludedExamples[] = [
                            'pmid' => '',
                            'doi' => (string) $entry['doi'],
                            'source' => (string) ($entry['candidate']['source'] ?? ''),
                            'title' => (string) ($entry['candidate']['title'] ?? ''),
                            'reason' => 'rule-mismatch',
                            'ruleExplanation' => $ruleExplanation,
                        ];
                    }
                    continue;
                }
                $allowedKeys[] = $key;
                $hydratedByKey[$key] = $work;
            }
        }

        $allowedKeys = muginPublicSearchDedupeStrings($allowedKeys);
        $validatedCount = $pmidCandidateCount + count($doiEntries);
        $allowedCount = count($allowedKeys);
        // Fold the former near-instant DOI-rules step into DOI fetch so API and
        // SearchForm share one DOI-validation progress step.
        if (!empty($doiEntries) && $processDetailsCollector !== null) {
            muginPublicSearchProcessDetailsSetStep($processDetailsCollector, 'finalizeValidateDoiFetch', [
                'endpoint' => 'OpenAlex work lookup',
                'candidateCount' => $pmidCandidateCount + count($doiEntries),
                'trustedPmidSkippedCount' => $pmidCandidateCount - $pmidRejectedByTrustCount,
                'doiCandidateCount' => $doiCandidateCount,
                'openAlexIdCandidateCount' => $openAlexIdCandidateCount,
                'hydratedCount' => $doiHydratedCount,
                'openAlexMissingCount' => max(0, count($doiEntries) - $doiHydratedCount),
                'blockingValidationCount' => count($blockingEntries),
                'deferredValidationCount' => count($deferredEntries),
                'domain' => $domain,
                'lookupRequests' => $lookupRequests,
                'semanticScholarFallbackCount' => $semanticScholarFallbackCount,
                'backgroundValidationCompleted' => true,
                'backgroundValidatedCount' => count($deferredEntries),
                'validationWarning' => count($doiEntries) > $doiHydratedCount
                    ? [
                        'status' => 'warning',
                        'missingCount' => count($doiEntries) - $doiHydratedCount,
                        'messageKey' => 'semanticSearchProgressDoiHydrationWarning',
                        'message' => muginPublicSearchGetFrontendTranslation(
                            'semanticSearchProgressDoiHydrationWarning',
                            $responseLanguage === 'en' ? 'en' : 'dk',
                            'Some external results could not be validated via OpenAlex.'
                        ),
                    ]
                    : null,
                'activeRules' => array_values((array) ($postValidationRuleState['activeRules'] ?? [])),
                'ruleGroups' => array_values((array) ($postValidationRuleState['ruleGroups'] ?? [])),
                'publicationDateYears' => array_values((array) ($hardFilters['publicationDateYears'] ?? [])),
                'validatedCount' => $validatedCount,
                'allowedCount' => $allowedCount,
                'excludedCount' => max(0, $validatedCount - $allowedCount),
                'excludedExamples' => $excludedExamples,
            ]);
            muginPublicSearchProcessDetailsEmitStep(
                $processDetailsCollector,
                'finalizeValidateDoiFetch',
                $progressCallback,
                true
            );
        }
        return [
            'allowedKeys' => $allowedKeys,
            'hydratedByKey' => $hydratedByKey,
            'warnings' => muginPublicSearchDedupeStrings($warnings),
            'diagnostics' => [
                'endpoint' => 'OpenAlex work lookup',
                'candidateCount' => $validatedCount,
                'pmidCandidateCount' => $pmidCandidateCount,
                'trustedPmidSkippedCount' => $pmidCandidateCount - $pmidRejectedByTrustCount,
                'pmidRejectedByTrustCount' => $pmidRejectedByTrustCount,
                'doiCandidateCount' => $doiCandidateCount,
                'openAlexIdCandidateCount' => $openAlexIdCandidateCount,
                'blockingValidationCount' => count($blockingEntries),
                'deferredValidationCount' => count($deferredEntries),
                'domain' => $domain,
                'doiHydratedCount' => $doiHydratedCount,
                'hydratedCount' => $doiHydratedCount,
                'semanticScholarFallbackCount' => $semanticScholarFallbackCount,
                'doiRejectedByFilterCount' => $doiRejectedByFilterCount,
                'excludedCount' => max(0, $validatedCount - $allowedCount),
                'openAlexMissingCount' => max(0, count($doiEntries) - $doiHydratedCount),
                'doiHydrationFailedCount' => max(0, count($doiEntries) - $doiHydratedCount),
                'validatedCount' => $validatedCount,
                'allowedCount' => $allowedCount,
                'lookupRequests' => $lookupRequests,
                'excludedExamples' => $excludedExamples,
                'activeRules' => array_values((array) ($postValidationRuleState['activeRules'] ?? [])),
                'ruleGroups' => array_values((array) ($postValidationRuleState['ruleGroups'] ?? [])),
                'publicationDateYears' => array_values((array) ($hardFilters['publicationDateYears'] ?? [])),
                'backgroundValidationCompleted' => true,
                'backgroundValidatedCount' => count($deferredEntries),
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchBuildHybridOrderedResultRefs')) {
    /**
     * @param string $hardFilterQuery
     * @param array<int,array<string,mixed>> $orderedCandidates
     * @param string $sortMethod
     * @param array<string,mixed> $hardFilters
     * @param string $domain
     * @param callable|null $progressCallback
     * @param array<string,mixed> $postValidationRuleState
     * @param array<string,mixed>|null $processDetailsCollector
     * @param string $responseLanguage
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildHybridOrderedResultRefs(
        string $hardFilterQuery,
        array $orderedCandidates,
        string $sortMethod,
        array $hardFilters,
        string $domain = '',
        ?callable $progressCallback = null,
        array $postValidationRuleState = [],
        ?array &$processDetailsCollector = null,
        string $responseLanguage = 'da'
    ): array {
        $orderedPmids = [];
        foreach ($orderedCandidates as $candidate) {
            $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            if ($pmid !== '') {
                $orderedPmids[] = $pmid;
            }
        }
        if (!empty($orderedPmids)) {
            muginPublicSearchEmitProgress($progressCallback, 'finalizeValidatePmid', '', [
                'stepId' => 'finalizeValidatePmid',
                'groupId' => 'match',
                'groupKey' => 'semanticSearchProcessGroupMatch',
                'messageKey' => 'semanticSearchProgressFinalizeValidatePmid',
            ]);
        }
        $orderedSearch = !empty($orderedPmids)
            ? muginPublicSearchResolveOrderedSearchPmids($hardFilterQuery, $orderedPmids, $sortMethod, $domain)
            : ['count' => 0, 'orderedIds' => [], 'validationQuery' => '', 'diagnostics' => []];
        if (!empty($orderedPmids) && $processDetailsCollector !== null) {
            $pmidValidation = (array) ($orderedSearch['diagnostics'] ?? []);
            $validationQuery = (string) ($orderedSearch['validationQuery'] ?? '');
            muginPublicSearchProcessDetailsSetStep($processDetailsCollector, 'finalizeValidatePmid', [
                'role' => 'pubmedPmidValidation',
                'orderedPmidCount' => (int) ($pmidValidation['requestedCount'] ?? count($orderedPmids)),
                'hardFilterQuery' => $hardFilterQuery,
                'validationMode' => $hardFilterQuery !== ''
                    ? 'hard-filter-and-candidate-whitelist'
                    : 'candidate-whitelist-only',
                'matchedByPubMedCount' => (int) ($pmidValidation['matchedCount'] ?? 0),
                'orderedMatchedCount' => (int) ($pmidValidation['matchedCount'] ?? 0),
                'unmatchedCandidateCount' => (int) ($pmidValidation['unmatchedCount'] ?? 0),
                'request' => [
                    'db' => 'pubmed',
                    'retmode' => 'json',
                    'term' => $validationQuery,
                    'retmax' => (int) ($pmidValidation['requestedCount'] ?? count($orderedPmids)),
                    'retstart' => 0,
                    'sort' => (string) ($pmidValidation['sortMethod'] ?? $sortMethod),
                ],
            ]);
            muginPublicSearchProcessDetailsEmitStep(
                $processDetailsCollector,
                'finalizeValidatePmid',
                $progressCallback,
                true
            );
        }
        $trustedPmids = $hardFilterQuery !== '' ? $orderedSearch['orderedIds'] : [];
        $allowed = muginPublicSearchBuildAllowedCandidateKeys(
            $orderedCandidates,
            $trustedPmids,
            $hardFilters,
            $domain,
            $progressCallback,
            $postValidationRuleState,
            $processDetailsCollector,
            $responseLanguage
        );
        $allowedSet = array_fill_keys($allowed['allowedKeys'], true);
        $matchedPmidSet = array_fill_keys((array) $orderedSearch['orderedIds'], true);

        $refs = [];
        $seen = [];
        $usedPmids = [];
        foreach ($orderedCandidates as $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            if ($pmid !== '') {
                if (!isset($matchedPmidSet[$pmid])) {
                    continue;
                }
                $key = 'pmid:' . $pmid;
                if (!isset($allowedSet[$key]) || isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $usedPmids[$pmid] = true;
                $refs[] = [
                    'type' => 'pmid',
                    'pmid' => $pmid,
                    'key' => $key,
                ];
                continue;
            }
            if ($doi !== '') {
                $key = 'doi:' . strtolower($doi);
                if (!isset($allowedSet[$key]) || isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;
                $refs[] = [
                    'type' => 'doi',
                    'doi' => $doi,
                    'key' => $key,
                    'candidate' => $candidate,
                    'hydratedWork' => $allowed['hydratedByKey'][$key] ?? null,
                ];
            }
        }
        foreach ((array) $orderedSearch['orderedIds'] as $pmid) {
            if (isset($usedPmids[$pmid])) {
                continue;
            }
            $key = 'pmid:' . $pmid;
            if (!isset($allowedSet[$key]) || isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $refs[] = [
                'type' => 'pmid',
                'pmid' => $pmid,
                'key' => $key,
            ];
        }

        return [
            'refs' => $refs,
            'pmids' => (array) $orderedSearch['orderedIds'],
            'count' => count($refs),
            'validationQuery' => (string) $orderedSearch['validationQuery'],
            'warnings' => (array) $allowed['warnings'],
            'diagnostics' => [
                'pmidValidation' => (array) ($orderedSearch['diagnostics'] ?? []),
                'candidateKeys' => (array) ($allowed['diagnostics'] ?? []),
            ],
        ];
    }
}

if (!function_exists('muginPublicSearchShouldUseSemanticDateOrdering')) {
    /**
     * @param string $sortMethod
     * @return bool
     */
    function muginPublicSearchShouldUseSemanticDateOrdering(string $sortMethod): bool
    {
        return in_array($sortMethod, ['date_desc', 'date_asc'], true);
    }
}

if (!function_exists('muginPublicSearchParseSortDateValue')) {
    /**
     * @param string $value
     * @return ?int
     */
    function muginPublicSearchParseSortDateValue(string $value): ?int
    {
        $normalized = trim($value);
        if ($normalized === '') {
            return null;
        }
        $timestamp = strtotime($normalized);
        if ($timestamp !== false) {
            return $timestamp;
        }
        if (preg_match('/^(\d{4})$/', $normalized, $matches) === 1) {
            return gmmktime(0, 0, 0, 1, 1, (int) $matches[1]);
        }
        return null;
    }
}

if (!function_exists('muginPublicSearchSortResultsByDate')) {
    /**
     * @param array<int,array<string,mixed>> $results
     * @param string $sortMethod
     * @return array<int,array<string,mixed>>
     */
    function muginPublicSearchSortResultsByDate(array $results, string $sortMethod): array
    {
        if (!muginPublicSearchShouldUseSemanticDateOrdering($sortMethod)) {
            return $results;
        }
        $ascending = $sortMethod === 'date_asc';
        $decorated = [];
        foreach ($results as $index => $result) {
            $timestamp = muginPublicSearchParseSortDateValue((string) ($result['publicationDate'] ?? ($result['year'] ?? '')));
            $decorated[] = [
                'index' => $index,
                'timestamp' => $timestamp,
                'entry' => $result,
            ];
        }
        usort($decorated, static function ($left, $right) use ($ascending) {
            $leftHas = $left['timestamp'] !== null;
            $rightHas = $right['timestamp'] !== null;
            if ($leftHas !== $rightHas) {
                return $leftHas ? -1 : 1;
            }
            if (!$leftHas) {
                return $left['index'] <=> $right['index'];
            }
            if ($left['timestamp'] !== $right['timestamp']) {
                return $ascending
                    ? ($left['timestamp'] <=> $right['timestamp'])
                    : ($right['timestamp'] <=> $left['timestamp']);
            }
            return $left['index'] <=> $right['index'];
        });
        return array_values(array_map(static function ($item) {
            return $item['entry'];
        }, $decorated));
    }
}

if (!function_exists('muginPublicSearchIsUnifiedSearchEngineEnabled')) {
    /**
     * Feature flag for the unified rerank engine (Phase 5 of the
     * unified-search-engine plan). Defaults to false so installs that do not
     * define MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED keep the exact legacy RRF-only
     * behavior. Flip to true only after the parity checklist has been run
     * (see scripts/rerank-parity-harness.php + scripts/compare-rerank-parity.js).
     *
     * @return bool
     */
    function muginPublicSearchIsUnifiedSearchEngineEnabled(): bool
    {
        return defined('MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED') && MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED === true;
    }
}

if (!function_exists('muginPublicSearchGetUnifiedRerankConfig')) {
    /**
     * Unlike muginPublicSearchGetRerankConfig() (which deliberately only merges
     * the base RRF fields because the legacy engine cannot use the hybrid
     * quality-signal fields), this resolves the FULL MUGIN_RERANK_CONFIG +
     * focus-profile overrides — the same config surface the website widget's
     * resolveSemanticRerankConfig() (semanticReranking.js) reads — and hands
     * it to the PHP port for identical behavior.
     *
     * @param string $focusProfileId
     * @return array<string,mixed>
     */
    function muginPublicSearchGetUnifiedRerankConfig(string $focusProfileId = ''): array
    {
        $baseConfig = defined('MUGIN_RERANK_CONFIG') && is_array(MUGIN_RERANK_CONFIG) ? MUGIN_RERANK_CONFIG : [];
        $focusProfile = muginPublicSearchGetFocusProfileConfig($focusProfileId);
        $overrides = is_array($focusProfile['overrides'] ?? null) ? $focusProfile['overrides'] : [];
        $merged = array_merge($baseConfig, $overrides);
        foreach (['sourceWeights', 'pubTypeWeights', 'citationImpactSignalWeights', 'dataQualityPenalties', 'abstractMinLength', 'pubTypeTiers'] as $mapKey) {
            if (is_array($baseConfig[$mapKey] ?? null) || is_array($overrides[$mapKey] ?? null)) {
                $merged[$mapKey] = array_merge(
                    is_array($baseConfig[$mapKey] ?? null) ? $baseConfig[$mapKey] : [],
                    is_array($overrides[$mapKey] ?? null) ? $overrides[$mapKey] : []
                );
            }
        }
        return muginSemanticQualityResolveRerankConfig($merged);
    }
}

if (!function_exists('muginPublicSearchAdaptUnifiedCandidateToLegacyShape')) {
    /**
     * Projects a muginSemanticQualityRerankCandidates() candidate (rich 'enriched'
     * object) back onto the flatter shape muginPublicSearchBuildApiResultFromPubMed()
     * / ...FromOpenAlex() already know how to read ('metadata.isOpenAccess',
     * 'metadata.citationCount', 'source', 'sources'), so those two functions —
     * and every function downstream of them — work unmodified regardless of
     * which rerank engine produced the candidate list.
     *
     * @param array<string,mixed> $candidate
     * @return array<string,mixed>
     */
    function muginPublicSearchAdaptUnifiedCandidateToLegacyShape(array $candidate): array
    {
        $enriched = is_array($candidate['enriched'] ?? null) ? $candidate['enriched'] : [];
        $sources = is_array($candidate['sources'] ?? null) ? array_values($candidate['sources']) : [];
        $previousMetadata = isset($candidate['metadata']) && is_array($candidate['metadata'])
            ? $candidate['metadata']
            : [];
        $tldr = '';
        if (is_string($previousMetadata['tldr'] ?? null)) {
            $tldr = trim((string) $previousMetadata['tldr']);
        } elseif (is_array($previousMetadata['tldr'] ?? null)) {
            $tldr = trim((string) ($previousMetadata['tldr']['text'] ?? ''));
        }
        if ($tldr === '') {
            $tldr = trim((string) ($enriched['tldr'] ?? ''));
        }
        $candidate['source'] = $sources[0] ?? '';
        $candidate['sources'] = $sources;
        $candidate['metadata'] = [
            'isOpenAccess' => $enriched['isOpenAccess'] ?? null,
            'citationCount' => $enriched['citedByCount'] ?? null,
            'publicationYear' => $enriched['publicationYear'] ?? null,
            'venue' => $enriched['venue'] ?? '',
            'tldr' => $tldr,
            'primaryTopicId' => trim((string) (
                $enriched['primaryTopicId'] ?? ($previousMetadata['primaryTopicId'] ?? '')
            )),
            'primaryTopicDisplayName' => trim((string) (
                $enriched['primaryTopicDisplayName'] ?? ($previousMetadata['primaryTopicDisplayName'] ?? '')
            )),
            'openAlexTopics' => muginPublicSearchNormalizeSimpleList(
                $enriched['openAlexTopics'] ?? ($previousMetadata['openAlexTopics'] ?? [])
            ),
            'openAlexKeywords' => muginPublicSearchNormalizeSimpleList(
                $enriched['openAlexKeywords'] ?? ($previousMetadata['openAlexKeywords'] ?? [])
            ),
            'openAlexSubfields' => muginPublicSearchNormalizeSimpleList(
                $enriched['openAlexSubfields'] ?? ($previousMetadata['openAlexSubfields'] ?? [])
            ),
            's2FieldsOfStudy' => muginPublicSearchNormalizeSimpleList(
                $enriched['s2FieldsOfStudy'] ?? ($previousMetadata['s2FieldsOfStudy'] ?? [])
            ),
        ];
        return $candidate;
    }
}

if (!function_exists('muginPublicSearchApplyUnifiedPostValidation')) {
    /**
     * Ported hook for semanticRuleEngine.js's DOI-only post-validation rules
     * (Phase 4). Only applied to DOI-only candidates (no PMID), matching the
     * JS function's own name/scope (explainCandidateActiveSemanticDoiOnlyRules):
     * PMID-backed candidates already went through PubMed's own indexing/
     * MeSH-based hard filters, so they do not need this extra text-signal
     * safety net. Configure via MUGIN_SEMANTIC_POST_VALIDATION_RULES (defaults
     * to an empty rule set = no-op, fully backward compatible).
     *
     * @param array<int,array<string,mixed>> $candidates
     * @return array<int,array<string,mixed>>
     */
    function muginPublicSearchApplyUnifiedPostValidation(array $candidates): array
    {
        $ruleState = defined('MUGIN_SEMANTIC_POST_VALIDATION_RULES') && is_array(MUGIN_SEMANTIC_POST_VALIDATION_RULES)
            ? MUGIN_SEMANTIC_POST_VALIDATION_RULES
            : [];
        if (empty($ruleState['activeRules']) && empty($ruleState['ruleGroups'])) {
            return $candidates;
        }

        return array_values(array_filter($candidates, static function (array $candidate) use ($ruleState): bool {
            if (trim((string) ($candidate['pmid'] ?? '')) !== '') {
                return true;
            }
            return muginSemanticQualityCandidateMatchesPostValidation($candidate, $ruleState)['matches'];
        }));
    }
}

if (!function_exists('muginPublicSearchRerankSemanticCandidatesUnified')) {
    /**
     * Unified rerank entry point (Phase 5): merges candidates from all
     * sources, enriches with iCite + OpenAlex Authority (Phase 2), classifies
     * publication type (Phase 1), scores with the full hybrid quality-signal
     * formula (Phase 3), and applies DOI-only post-validation (Phase 4) —
     * the same pipeline the website widget runs in JS, now available to the
     * public API. Returns the same {candidates, diagnostics} shape
     * muginPublicSearchRerankSemanticCandidates() (legacy) returns, so the
     * caller in muginPublicSearchRunSearch() only needs a one-line feature-flag
     * branch.
     *
     * @param array<int,array<string,mixed>> $sourceResults
     * @param string $focusProfileId
     * @param string $domain
     * @param array<string,mixed> $options ['queryIntent' => ...]
     * @return array{candidates: array<int,array<string,mixed>>, diagnostics: array<string,mixed>}
     */
    function muginPublicSearchRerankSemanticCandidatesUnified(
        array $sourceResults,
        string $focusProfileId = '',
        string $domain = '',
        array $options = []
    ): array {
        // This pipeline (merge -> enrich -> classify -> score) builds a richer,
        // deeper per-candidate structure (enriched signals, score breakdowns,
        // source breakdowns) than the legacy RRF-only engine, across every
        // candidate from every source (e.g. ~400 for semanticScholar alone).
        // On installs with PHP's conservative 128M default memory_limit, this
        // can legitimately exhaust available memory for large multi-source
        // result sets. Same defensive pattern already used elsewhere in this
        // codebase (e.g. backend/api/ICiteLookup.php's max_execution_time
        // bump): raise the ceiling, fail silently (@) if the host has memory_limit
        // locked to a fixed value, rather than let a fixable case crash.
        @ini_set('memory_limit', '512M');
        @ini_set('max_execution_time', '120');
        @set_time_limit(120);

        $rerankConfig = muginPublicSearchGetUnifiedRerankConfig($focusProfileId);

        // Skip iCite/authority HTTP when no scoring path can use the signals.
        // clinicalBonus still needs iCite even when clamps are neutral.
        $citationClamp = is_array($rerankConfig['citationImpactClamp'] ?? null)
            ? $rerankConfig['citationImpactClamp']
            : [1.0, 1.0];
        $authorityClamp = is_array($rerankConfig['authorityClamp'] ?? null)
            ? $rerankConfig['authorityClamp']
            : [1.0, 1.0];
        $clinicalBonus = is_numeric($rerankConfig['clinicalBonus'] ?? null)
            ? (float) $rerankConfig['clinicalBonus']
            : 0.0;
        $citationNeutral = abs((float) ($citationClamp[0] ?? 1.0) - 1.0) < 1e-9
            && abs((float) ($citationClamp[1] ?? 1.0) - 1.0) < 1e-9;
        $authorityNeutral = abs((float) ($authorityClamp[0] ?? 1.0) - 1.0) < 1e-9
            && abs((float) ($authorityClamp[1] ?? 1.0) - 1.0) < 1e-9;
        $needsEnrichment = !($citationNeutral && $authorityNeutral && $clinicalBonus == 0.0);

        $enrichment = $needsEnrichment
            ? muginPublicSearchFetchUnifiedEnrichmentSignals($sourceResults, $domain)
            : ['icite' => [], 'authorityAuthors' => [], 'authorityJournal' => []];
        $enrichedSourceResults = muginPublicSearchInjectEnrichmentIntoSourceResults($sourceResults, $enrichment);

        $rerankResult = muginSemanticQualityRerankCandidates($enrichedSourceResults, $rerankConfig, $options);

        $candidates = array_map('muginPublicSearchAdaptUnifiedCandidateToLegacyShape', $rerankResult['candidates']);
        $candidates = muginPublicSearchApplyUnifiedPostValidation($candidates);
        $profile = muginPublicSearchGetFocusProfileConfig($focusProfileId);
        $profileSummary = $profile !== null
            ? [
                'id' => (string) ($profile['id'] ?? $focusProfileId),
                'labelKey' => (string) ($profile['labelKey'] ?? ''),
                'descriptionKey' => (string) ($profile['descriptionKey'] ?? ''),
            ]
            : ['id' => $focusProfileId, 'labelKey' => '', 'descriptionKey' => ''];

        return [
            'candidates' => $candidates,
            'diagnostics' => array_merge($rerankResult['diagnostics'], [
                'engine' => 'unified',
                'rerankProfile' => $profileSummary,
                'rerankConfig' => $rerankConfig,
                'semanticRescueMeta' => is_array($options['semanticRescueMeta'] ?? null)
                    ? $options['semanticRescueMeta']
                    : new stdClass(),
            ]),
        ];
    }
}

if (!function_exists('muginPublicSearchGetSemanticLlmConfig')) {
    /**
     * @return array<string,mixed>
     */
    function muginPublicSearchGetSemanticLlmConfig(): array
    {
        $raw = defined('MUGIN_SEMANTIC_LLM_RERANK_CONFIG') && is_array(MUGIN_SEMANTIC_LLM_RERANK_CONFIG)
            ? MUGIN_SEMANTIC_LLM_RERANK_CONFIG
            : [];
        $enabled = muginPublicSearchBoolValue($raw['enabled'] ?? true, true);
        $topN = is_numeric($raw['topN'] ?? null) ? (int) $raw['topN'] : 25;
        $maxOutputTokens = is_numeric($raw['maxOutputTokens'] ?? null) ? (int) $raw['maxOutputTokens'] : 400;
        $taskSettings = function_exists('muginGetOpenAiTaskSettings')
            ? muginGetOpenAiTaskSettings('finalRerank')
            : ['model' => '', 'reasoningEffort' => 'none'];
        // reasoning.effort must match the model family (the API rejects mismatches).
        $reasoningEffort = strtolower(trim((string) ($taskSettings['reasoningEffort'] ?? 'none')));
        if (!in_array($reasoningEffort, ['minimal', 'none', 'low', 'medium', 'high', 'xhigh'], true)) {
            $reasoningEffort = 'none';
        }
        $cacheTtlSeconds = is_numeric($raw['cacheTtlSeconds'] ?? null)
            ? (int) $raw['cacheTtlSeconds']
            : 1800;
        return [
            'enabled' => $enabled,
            'model' => trim((string) ($taskSettings['model'] ?? '')),
            'reasoningEffort' => $reasoningEffort,
            'topN' => max(2, min(50, $topN)),
            'maxOutputTokens' => max(64, $maxOutputTokens),
            // Shared across UnifiedSearch + public API so identical candidate
            // payloads reuse the same LLM permutation (parity + fewer OpenAI calls).
            'cacheTtlSeconds' => max(0, $cacheTtlSeconds),
        ];
    }
}

if (!function_exists('muginPublicSearchGetSemanticLlmCandidateId')) {
    /**
     * @param array<string,mixed> $entry
     * @return string
     */
    function muginPublicSearchGetSemanticLlmCandidateId(array $entry): string
    {
        $pmid = muginPublicSearchNormalizePmid($entry['pmid'] ?? ($entry['uid'] ?? ''));
        if ($pmid !== '') {
            return 'pmid:' . $pmid;
        }
        $doi = muginPublicSearchNormalizeDoi($entry['doi'] ?? '');
        if ($doi !== '') {
            return 'doi:' . strtolower($doi);
        }
        return trim((string) ($entry['id'] ?? ($entry['uid'] ?? '')));
    }
}

if (!function_exists('muginPublicSearchGetFocusProfileLlmCopy')) {
    /**
     * Kort, statisk engelsk label/beskrivelse pr. focus-profil-id, til brug i
     * LLM-prompten. MUGIN_RERANK_PROFILE_CONFIG har kun labelKey/descriptionKey,
     * som kraever frontend-oversaettelse og derfor ikke er tilgaengelige i PHP.
     *
     * @param string $profileId
     * @return array{id:string,label:string,description:string}
     */
    function muginPublicSearchGetFocusProfileLlmCopy(string $profileId): array
    {
        $copy = [
            'balanced' => [
                'label' => 'Balanced',
                'description' => 'Use a balanced mix of evidence level, recency, and relevance.',
            ],
            'highest-evidence' => [
                'label' => 'Highest evidence',
                'description' => 'Prioritize systematic reviews, meta-analyses, and guidelines with strong methodological evidence.',
            ],
            'clinical-practice' => [
                'label' => 'Clinical practice',
                'description' => 'Prioritize results directly relevant to clinical decision-making and practice guidelines.',
            ],
            'newest-research' => [
                'label' => 'Newest research',
                'description' => 'Prefer more recent studies over older ones, even if slightly less established.',
            ],
            'broad-mapping' => [
                'label' => 'Broad mapping',
                'description' => 'Favor broad topical coverage over strict evidence-level prioritization.',
            ],
        ];
        if ($profileId === '' || !isset($copy[$profileId])) {
            return ['id' => '', 'label' => '', 'description' => ''];
        }
        return array_merge(['id' => $profileId], $copy[$profileId]);
    }
}

if (!defined('MUGIN_TOPIC_SIGNAL_VERSION')) {
    define('MUGIN_TOPIC_SIGNAL_VERSION', '2026-08-14');
}
if (!defined('MUGIN_LLM_TOPIC_CAP')) {
    define('MUGIN_LLM_TOPIC_CAP', 16);
}

if (!function_exists('muginPublicSearchBuildLlmTopicsPayload')) {
    /**
     * Cap and prioritize article topics for LLM final rerank (fair: missing => []).
     *
     * @param mixed $entryTopics
     * @param array<int,string> $abstractMesh
     * @param array<int,string> $abstractKeywords
     * @param int $cap
     * @return array<int,array{label:string,source:string}>
     */
    function muginPublicSearchBuildLlmTopicsPayload(
        $entryTopics,
        array $abstractMesh = [],
        array $abstractKeywords = [],
        int $cap = 16
    ): array {
        $cap = max(0, $cap);
        if ($cap === 0) {
            return [];
        }
        $priority = [
            'mesh',
            'openAlex',
            'openAlexTopic',
            'openAlexSubfield',
            'openAlexKeyword',
            'pubmedKeyword',
            'semanticScholar',
        ];
        $droppedSources = [
            'openalexconcept' => true,
            'openalexfield' => true,
            'openalexdomain' => true,
        ];
        $buckets = [];
        foreach ($priority as $source) {
            $buckets[$source] = [];
        }
        $extras = [];
        $seen = [];

        $append = static function (string $label, string $source) use (&$buckets, &$extras, &$seen, $droppedSources): void {
            $label = trim($label);
            $source = trim($source);
            if ($label === '' || $source === '' || isset($droppedSources[strtolower($source)])) {
                return;
            }
            $key = strtolower($source) . "\0" . strtolower($label);
            if (isset($seen[$key])) {
                return;
            }
            $seen[$key] = true;
            $item = ['label' => $label, 'source' => $source];
            if (isset($buckets[$source])) {
                $buckets[$source][] = $item;
            } else {
                $extras[] = $item;
            }
        };

        if (is_array($entryTopics)) {
            foreach ($entryTopics as $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $append((string) ($entry['label'] ?? ''), (string) ($entry['source'] ?? ''));
            }
        }
        foreach ($abstractMesh as $meshTerm) {
            $append((string) $meshTerm, 'mesh');
        }
        foreach ($abstractKeywords as $keyword) {
            $append((string) $keyword, 'pubmedKeyword');
        }

        $out = [];
        foreach ($priority as $source) {
            foreach ($buckets[$source] as $item) {
                if (count($out) >= $cap) {
                    return $out;
                }
                $out[] = $item;
            }
        }
        foreach ($extras as $item) {
            if (count($out) >= $cap) {
                break;
            }
            $out[] = $item;
        }
        return $out;
    }
}

if (!function_exists('muginPublicSearchShouldApplySemanticLlmFinalRerank')) {
    /**
     * True when the LLM final-rerank will actually run (progress must only
     * be emitted in that case).
     *
     * @param array<string,mixed> $request
     * @param array<int,mixed> $results
     */
    function muginPublicSearchShouldApplySemanticLlmFinalRerank(array $request, array $results): bool
    {
        $config = muginPublicSearchGetSemanticLlmConfig();
        if ($config['enabled'] !== true) {
            return false;
        }
        if (((string) ($request['translation']['mode'] ?? 'auto')) !== 'auto') {
            return false;
        }
        if (((int) ($request['page']['number'] ?? 1)) !== 1) {
            return false;
        }
        if (muginPublicSearchShouldUseSemanticDateOrdering((string) ($request['sort']['method'] ?? 'relevance'))) {
            return false;
        }
        $sources = (array) ($request['sources'] ?? []);
        $hasPubmed = in_array('pubmed', $sources, true);
        $hasSemantic = muginPublicSearchRequestHasSemanticSources($request);
        if (!$hasPubmed && !$hasSemantic) {
            return false;
        }
        return count($results) >= 2;
    }
}

if (!function_exists('muginPublicSearchMaybeApplySemanticLlmFinalRerank')) {
    /**
     * @param array<int,array<string,mixed>> $results
     * @param array<string,mixed> $request
     * @param array<string,mixed> $resolvedQueries
     * @param string $domain
     * @return array{results: array<int,array<string,mixed>>, detail: array<string,mixed>}
     */
    function muginPublicSearchMaybeApplySemanticLlmFinalRerank(
        array $results,
        array $request,
        array $resolvedQueries,
        string $domain = ''
    ): array {
        $config = muginPublicSearchGetSemanticLlmConfig();
        $baseDetail = [
            'endpoint' => 'unified-final-rerank',
            'enabled' => $config['enabled'] === true,
            'applied' => false,
            'model' => $config['model'],
        ];
        if ($config['enabled'] !== true) {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'disabled'])];
        }
        if (((string) ($request['translation']['mode'] ?? 'auto')) !== 'auto') {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'translation_disabled'])];
        }
        if (((int) ($request['page']['number'] ?? 1)) !== 1) {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'not_first_page'])];
        }
        if (muginPublicSearchShouldUseSemanticDateOrdering((string) ($request['sort']['method'] ?? 'relevance'))) {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'date_sort'])];
        }
        $sources = (array) ($request['sources'] ?? []);
        $hasPubmed = in_array('pubmed', $sources, true);
        $hasSemantic = muginPublicSearchRequestHasSemanticSources($request);
        if (!$hasPubmed && !$hasSemantic) {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'no_sources'])];
        }
        if (count($results) < 2) {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'too_few_results'])];
        }

        $topN = min($config['topN'], count($results));
        $topResults = array_slice($results, 0, $topN);
        $pmidsToHydrate = [];
        foreach ($topResults as $entry) {
            if (trim((string) ($entry['abstract'] ?? '')) === '') {
                $pmid = muginPublicSearchNormalizePmid($entry['pmid'] ?? '');
                if ($pmid !== '') {
                    $pmidsToHydrate[] = $pmid;
                }
            }
        }
        $abstractMap = muginPublicSearchFetchPubMedAbstractMap($pmidsToHydrate, $domain);

        $requestCandidates = [];
        $deferredEntries = [];
        foreach ($topResults as $entry) {
            $candidateId = muginPublicSearchGetSemanticLlmCandidateId($entry);
            $title = trim((string) ($entry['title'] ?? ''));
            if ($candidateId === '' || $title === '') {
                $deferredEntries[] = $entry;
                continue;
            }
            $pmid = muginPublicSearchNormalizePmid($entry['pmid'] ?? '');

            // Best-effort quality signals from whatever the current result-building
            // path already resolved (see muginPublicSearchBuildApiResultFromPubMed/
            // ...FromOpenAlex). Mirrors the optional 'qualitySignals' object
            // backend/api/SemanticFinalRerank.php accepts from the widget, so the
            // LLM gets the same class of context in both flows. Fields the current
            // path does not populate (fwci, rcr, nihPercentile, citedByClin,
            // isClinical) are simply omitted, exactly like the widget does when a
            // candidate lacks that signal.
            $qualitySignals = [];
            if (is_numeric($entry['citationCount'] ?? null)) {
                $qualitySignals['citationCount'] = (int) $entry['citationCount'];
            }
            $entryYear = muginSemanticQualityToFiniteInt($entry['year'] ?? null);
            if ($entryYear !== null) {
                $qualitySignals['year'] = $entryYear;
            }
            if (is_bool($entry['isRetracted'] ?? null)) {
                $qualitySignals['isRetracted'] = $entry['isRetracted'];
            }
            if (is_bool($entry['isOpenAccess'] ?? null)) {
                $qualitySignals['isOpenAccess'] = $entry['isOpenAccess'];
            }
            $venue = trim((string) ($entry['sourceLabel'] ?? ($entry['journal']['name'] ?? '')));
            if ($venue !== '') {
                $qualitySignals['venue'] = $venue;
            }
            $pubTypes = is_array($entry['publicationTypes'] ?? null) ? array_values(array_filter(array_map('trim', $entry['publicationTypes']))) : [];
            if (!empty($pubTypes)) {
                $qualitySignals['pubTypes'] = $pubTypes;
            }

            $topicsForLlm = muginPublicSearchBuildLlmTopicsPayload(
                $entry['topics'] ?? [],
                is_array($abstractMap[$pmid]['mesh'] ?? null) ? $abstractMap[$pmid]['mesh'] : [],
                is_array($abstractMap[$pmid]['keywords'] ?? null) ? $abstractMap[$pmid]['keywords'] : [],
                defined('MUGIN_LLM_TOPIC_CAP') ? MUGIN_LLM_TOPIC_CAP : 16
            );

            $requestCandidates[] = [
                // Short, deterministic ordinal ids match SemanticFinalRerank.php
                // and prevent the model from mutating/duplicating long DOI ids.
                'id' => (string) (count($requestCandidates) + 1),
                'candidateId' => $candidateId,
                'title' => $title,
                'abstract' => trim((string) ($entry['abstract'] ?? ($abstractMap[$pmid]['abstract'] ?? ''))),
                'publicationDate' => trim((string) ($entry['publicationDate'] ?? '')),
                'source' => trim((string) ($entry['originSource'] ?? '')),
                'sourceLabel' => trim((string) ($entry['sourceLabel'] ?? '')),
                'qualitySignals' => $qualitySignals,
                'topics' => $topicsForLlm,
                'entry' => $entry,
            ];
        }
        if (count($requestCandidates) < 2) {
            return ['results' => $results, 'detail' => array_merge($baseDetail, ['skippedReason' => 'too_few_eligible_candidates', 'topN' => $topN])];
        }

        $schema = [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['orderedIds'],
            'properties' => [
                'orderedIds' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                    'minItems' => count($requestCandidates),
                    'maxItems' => count($requestCandidates),
                ],
            ],
        ];
        $focusProfileId = (string) ($request['focus'] ?? '');
        $focusCopy = muginPublicSearchGetFocusProfileLlmCopy($focusProfileId);
        $focusDetail = $focusCopy;
        $profileConfig = muginPublicSearchGetFocusProfileConfig($focusProfileId);
        if (is_array($profileConfig)) {
            $frontendLanguage = (($request['responseOptions']['language'] ?? 'da') === 'en') ? 'en' : 'dk';
            $labelKey = trim((string) ($profileConfig['labelKey'] ?? ''));
            $descriptionKey = trim((string) ($profileConfig['descriptionKey'] ?? ''));
            if ($labelKey !== '') {
                $focusDetail['label'] = muginPublicSearchGetFrontendTranslation(
                    $labelKey,
                    $frontendLanguage,
                    $focusCopy['label']
                );
            }
            if ($descriptionKey !== '') {
                $focusDetail['description'] = muginPublicSearchGetFrontendTranslation(
                    $descriptionKey,
                    $frontendLanguage,
                    $focusCopy['description']
                );
            }
        }
        // Kept in sync 1:1 with the system prompt lines in backend/api/SemanticFinalRerank.php
        // (the widget's own final-rerank endpoint), so the public API and the
        // website give the LLM the same reasoning instructions. If you edit one,
        // edit both.
        $systemPromptLines = [
            'You rerank already validated scholarly search candidates.',
            'Never exclude, add, or invent items. Return a permutation of the provided candidate ids only.',
            'Prefer candidates that best match the query intent using title, abstract, and provided topics together.',
            'When candidate topics are provided, use them as additive topical evidence together with title and abstract.',
            'Missing topics must not lower a candidate. Do not prefer a candidate merely because it has MeSH or a PMID.',
            'OpenAlex and Semantic Scholar topics are valid substitutes when MeSH is absent.',
            'Treat missing abstracts conservatively.',
            'Do not try to override publication-type, date, or other hard filters because they have already been applied.',
            'When signals such as FWCI, RCR, citation counts, retraction status, publication type or recency are provided on a candidate, you may use them to inform relevance, but never to override prior hard filters and never to exclude or add candidates. Prefer non-retracted records over retracted ones when all other evidence is comparable.',
        ];
        if ($focusCopy['id'] !== '') {
            $systemPromptLines[] = 'Respect the selected result focus when ordering otherwise comparable candidates: '
                . $focusCopy['label'] . '. ' . $focusCopy['description'];
            if ($focusCopy['id'] === 'newest-research') {
                $systemPromptLines[] = 'For this focus, prefer more recent studies when relevance is comparable, '
                    . 'and avoid promoting old studies solely because they have accumulated citations.';
            }
        }

        $requestPayload = [
            'model' => $config['model'],
            'input' => [
                [
                    'role' => 'system',
                    'content' => implode("\n", $systemPromptLines),
                ],
                [
                    'role' => 'user',
                    'content' => muginPublicSearchSafeJsonEncode([
                        'query' => trim((string) ($resolvedQueries['semanticIntent'] ?? ($resolvedQueries['pubmedQuery'] ?? ($request['query']['text'] ?? '')))),
                        'hardFilterQuery' => trim((string) ($resolvedQueries['hardFilterQuery'] ?? '')),
                        'resultFocus' => $focusCopy,
                        'task' => 'Return the candidate ids ordered from most to least relevant.',
                        'candidates' => array_map(static function ($candidate) {
                            $payload = [
                                'id' => $candidate['id'],
                                'title' => $candidate['title'],
                                'abstract' => $candidate['abstract'],
                                'publicationDate' => $candidate['publicationDate'],
                                'source' => $candidate['source'],
                                'sourceLabel' => $candidate['sourceLabel'],
                            ];
                            if (!empty($candidate['qualitySignals'])) {
                                $payload['qualitySignals'] = $candidate['qualitySignals'];
                            }
                            if (!empty($candidate['topics'])) {
                                $payload['topics'] = $candidate['topics'];
                            }
                            return $payload;
                        }, $requestCandidates),
                    ]),
                ],
            ],
            'reasoning' => ['effort' => $config['reasoningEffort']],
            'text' => [
                'verbosity' => 'low',
                'format' => [
                    'type' => 'json_schema',
                    'name' => 'semantic_final_rerank',
                    'strict' => true,
                    'schema' => $schema,
                ],
            ],
            'max_output_tokens' => $config['maxOutputTokens'],
        ];

        $queryText = trim((string) ($resolvedQueries['semanticIntent'] ?? ($resolvedQueries['pubmedQuery'] ?? ($request['query']['text'] ?? ''))));
        $hardFilterQuery = trim((string) ($resolvedQueries['hardFilterQuery'] ?? ''));
        $detail = [
            'endpoint' => 'unified-final-rerank',
            'enabled' => true,
            'applied' => false,
            'request' => [
                'query' => $queryText,
                'hardFilterQuery' => $hardFilterQuery,
                'resultFocus' => $focusDetail,
                'model' => $config['model'],
                'reasoningEffort' => $config['reasoningEffort'],
                'maxOutputTokens' => $config['maxOutputTokens'],
                'candidateCount' => count($requestCandidates),
            ],
        ];
        $expectedIds = array_map(static function ($candidate) {
            return $candidate['id'];
        }, $requestCandidates);
        $applyOrderedIds = static function (array $orderedIds) use (
            $requestCandidates,
            $deferredEntries,
            $results,
            $topN,
            $detail,
            $expectedIds
        ): array {
            $orderedIds = muginPublicSearchDedupeStrings($orderedIds);
            if (count($orderedIds) !== count($expectedIds)) {
                return ['ok' => false, 'reason' => 'orderedIds_count_mismatch'];
            }
            $expectedLookup = array_fill_keys($expectedIds, true);
            foreach ($orderedIds as $orderedId) {
                if (!isset($expectedLookup[$orderedId])) {
                    return ['ok' => false, 'reason' => 'orderedIds_unknown_id'];
                }
            }
            $candidateMap = [];
            foreach ($requestCandidates as $candidate) {
                $candidateMap[$candidate['id']] = $candidate['entry'];
            }
            $reorderedTop = [];
            foreach ($orderedIds as $orderedId) {
                if (isset($candidateMap[$orderedId])) {
                    $reorderedTop[] = $candidateMap[$orderedId];
                }
            }
            return [
                'ok' => true,
                'results' => array_values(array_merge($reorderedTop, $deferredEntries, array_slice($results, $topN))),
                'orderedIds' => array_values($orderedIds),
                'detail' => array_merge($detail, [
                    'applied' => true,
                    'response' => [
                        'orderedIdCount' => count($orderedIds),
                        'orderedIds' => array_slice(array_values($orderedIds), 0, 25),
                        'truncated' => count($orderedIds) > 25,
                    ],
                ]),
            ];
        };

        $cacheTtl = (int) ($config['cacheTtlSeconds'] ?? 0);
        $noCache = ($request['responseOptions']['noCache'] ?? false) === true;
        // Provider salt: payload is built before HTTP normalize (short model id).
        $llmProvider = function_exists('muginGetLlmProvider') ? muginGetLlmProvider() : 'openai';
        $cacheKey = 'payload:' . sha1(
            MUGIN_TOPIC_SIGNAL_VERSION . '|' . $llmProvider . '|' . muginPublicSearchSafeJsonEncode($requestPayload)
        );
        if ($cacheTtl > 0 && !$noCache) {
            $cacheEntry = muginPublicSearchReadCacheValue('final-rerank', $cacheKey);
            $cachedOrderedIds = (array) ($cacheEntry['value']['orderedIds'] ?? []);
            if (($cacheEntry['hit'] ?? false) === true && !empty($cachedOrderedIds)) {
                $applied = $applyOrderedIds($cachedOrderedIds);
                if (($applied['ok'] ?? false) === true) {
                    $appliedDetail = (array) $applied['detail'];
                    $appliedDetail['response']['cached'] = true;
                    return [
                        'results' => $applied['results'],
                        'detail' => $appliedDetail,
                    ];
                }
            }
        }

        try {
            $response = muginPublicSearchOpenAiRequest($requestPayload, $domain);
            $responseText = muginPublicSearchExtractOpenAiText($response);
            $parsed = json_decode($responseText, true);
            if (!is_array($parsed) || !isset($parsed['orderedIds']) || !is_array($parsed['orderedIds'])) {
                return ['results' => $results, 'detail' => array_merge($detail, ['skippedReason' => 'invalid_llm_response'])];
            }
            $applied = $applyOrderedIds((array) $parsed['orderedIds']);
            if (($applied['ok'] ?? false) !== true) {
                return [
                    'results' => $results,
                    'detail' => array_merge($detail, [
                        'skippedReason' => (string) ($applied['reason'] ?? 'orderedIds_invalid'),
                    ]),
                ];
            }
            if ($cacheTtl > 0) {
                muginPublicSearchWriteCacheValue(
                    'final-rerank',
                    $cacheKey,
                    ['orderedIds' => array_values((array) $applied['orderedIds'])],
                    $cacheTtl
                );
            }
            $appliedDetail = (array) $applied['detail'];
            $appliedDetail['response']['cached'] = false;
            return [
                'results' => $applied['results'],
                'detail' => $appliedDetail,
            ];
        } catch (Throwable $throwable) {
            return ['results' => $results, 'detail' => array_merge($detail, ['skippedReason' => 'llm_error'])];
        }
    }
}

if (!function_exists('muginPublicSearchCombinePubMedQuery')) {
    /**
     * @param string $baseQuery
     * @param string $hardFilterQuery
     * @return string
     */
    function muginPublicSearchCombinePubMedQuery(string $baseQuery, string $hardFilterQuery): string
    {
        $normalizedBase = trim($baseQuery);
        $normalizedFilter = trim($hardFilterQuery);
        if ($normalizedBase === '') {
            return $normalizedFilter;
        }
        if ($normalizedFilter === '') {
            return $normalizedBase;
        }
        if ($normalizedBase === $normalizedFilter || strpos($normalizedBase, $normalizedFilter) !== false) {
            return $normalizedBase;
        }
        return '(' . $normalizedBase . ') AND (' . $normalizedFilter . ')';
    }
}

if (!function_exists('muginPublicSearchAppendUniqueTopic')) {
    /**
     * @param array<int,array{label:string,source:string}> $topics
     */
    function muginPublicSearchAppendUniqueTopic(array &$topics, string $label, string $source): void
    {
        $normalizedLabel = trim($label);
        $normalizedSource = trim($source);
        if ($normalizedLabel === '' || $normalizedSource === '') {
            return;
        }
        foreach ($topics as $existing) {
            if (
                strcasecmp((string) ($existing['label'] ?? ''), $normalizedLabel) === 0
                && (string) ($existing['source'] ?? '') === $normalizedSource
            ) {
                return;
            }
        }
        $topics[] = [
            'label' => $normalizedLabel,
            'source' => $normalizedSource,
        ];
    }
}

if (!function_exists('muginPublicSearchAppendTopicsFromLabels')) {
    /**
     * @param array<int,array{label:string,source:string}> $topics
     * @param mixed $labels
     */
    function muginPublicSearchAppendTopicsFromLabels(array &$topics, $labels, string $source): void
    {
        foreach (muginPublicSearchNormalizeSimpleList($labels) as $label) {
            muginPublicSearchAppendUniqueTopic($topics, (string) $label, $source);
        }
    }
}

if (!function_exists('muginPublicSearchAppendTopicsFromNamedEntries')) {
    /**
     * @param array<int,array{label:string,source:string}> $topics
     * @param mixed $entries
     */
    function muginPublicSearchAppendTopicsFromNamedEntries(array &$topics, $entries, string $source): void
    {
        if (!is_array($entries)) {
            return;
        }
        foreach ($entries as $entry) {
            if (is_string($entry) || is_numeric($entry)) {
                muginPublicSearchAppendUniqueTopic($topics, (string) $entry, $source);
                continue;
            }
            if (!is_array($entry)) {
                continue;
            }
            $label = trim((string) (
                $entry['display_name']
                ?? ($entry['keyword'] ?? ($entry['name'] ?? ($entry['category'] ?? '')))
            ));
            muginPublicSearchAppendUniqueTopic($topics, $label, $source);
        }
    }
}

if (!function_exists('muginPublicSearchAppendSemanticScholarTopics')) {
    /**
     * @param array<int,array{label:string,source:string}> $topics
     * @param array<string,mixed> $candidateInfo
     */
    function muginPublicSearchAppendSemanticScholarTopics(array &$topics, array $candidateInfo): void
    {
        $metadata = isset($candidateInfo['metadata']) && is_array($candidateInfo['metadata'])
            ? $candidateInfo['metadata']
            : [];
        $labels = $metadata['s2FieldsOfStudy'] ?? ($candidateInfo['s2FieldsOfStudy'] ?? []);
        muginPublicSearchAppendTopicsFromLabels($topics, $labels, 'semanticScholar');
    }
}

if (!function_exists('muginPublicSearchAppendOpenAlexTopicsFromCandidate')) {
    /**
     * Additive OpenAlex aboutness from candidate metadata (search hit or merge).
     *
     * @param array<int,array{label:string,source:string}> $topics
     * @param array<string,mixed> $candidateInfo
     */
    function muginPublicSearchAppendOpenAlexTopicsFromCandidate(array &$topics, array $candidateInfo): void
    {
        $metadata = isset($candidateInfo['metadata']) && is_array($candidateInfo['metadata'])
            ? $candidateInfo['metadata']
            : [];
        $primary = trim((string) ($metadata['primaryTopicDisplayName'] ?? ''));
        if ($primary !== '') {
            muginPublicSearchAppendUniqueTopic($topics, $primary, 'openAlex');
        }
        foreach (muginPublicSearchNormalizeSimpleList($metadata['openAlexTopics'] ?? []) as $label) {
            if ($primary !== '' && strcasecmp($label, $primary) === 0) {
                continue;
            }
            muginPublicSearchAppendUniqueTopic($topics, $label, 'openAlexTopic');
        }
        muginPublicSearchAppendTopicsFromLabels($topics, $metadata['openAlexKeywords'] ?? [], 'openAlexKeyword');
        muginPublicSearchAppendTopicsFromLabels($topics, $metadata['openAlexSubfields'] ?? [], 'openAlexSubfield');
    }
}

if (!function_exists('muginPublicSearchExtractResultRanking')) {
    /**
     * Build an additive, UI-safe ranking payload from a rerank candidate.
     * Normalizes both unified list-form and legacy map-form sourceBreakdown.
     *
     * @param array<string,mixed> $candidateInfo
     * @return array<string,mixed>|null
     */
    function muginPublicSearchExtractResultRanking(array $candidateInfo): ?array
    {
        $hasCombined = array_key_exists('combinedScore', $candidateInfo)
            && is_numeric($candidateInfo['combinedScore']);
        $hasSourceBreakdown = isset($candidateInfo['sourceBreakdown'])
            && is_array($candidateInfo['sourceBreakdown'])
            && $candidateInfo['sourceBreakdown'] !== [];
        $hasScoreBreakdown = isset($candidateInfo['scoreBreakdown'])
            && is_array($candidateInfo['scoreBreakdown'])
            && $candidateInfo['scoreBreakdown'] !== [];
        if (!$hasCombined && !$hasSourceBreakdown && !$hasScoreBreakdown) {
            return null;
        }

        $sourceBreakdown = [];
        $rawBreakdown = isset($candidateInfo['sourceBreakdown']) && is_array($candidateInfo['sourceBreakdown'])
            ? $candidateInfo['sourceBreakdown']
            : [];
        $isListForm = $rawBreakdown !== [] && array_keys($rawBreakdown) === range(0, count($rawBreakdown) - 1);
        if ($isListForm) {
            foreach ($rawBreakdown as $entry) {
                if (!is_array($entry)) {
                    continue;
                }
                $source = trim((string) ($entry['source'] ?? ''));
                if ($source === '') {
                    continue;
                }
                $sourceBreakdown[] = [
                    'source' => $source,
                    'rank' => is_numeric($entry['rank'] ?? null) ? (int) $entry['rank'] : 0,
                    'score' => is_numeric($entry['rawScore'] ?? ($entry['score'] ?? null))
                        ? (float) ($entry['rawScore'] ?? $entry['score'])
                        : null,
                    'weight' => is_numeric($entry['weight'] ?? null) ? (float) $entry['weight'] : null,
                    'weightedRrf' => is_numeric($entry['weightedRrf'] ?? null)
                        ? (float) $entry['weightedRrf']
                        : null,
                ];
            }
        } else {
            foreach ($rawBreakdown as $sourceKey => $sourceData) {
                $source = trim((string) $sourceKey);
                if ($source === '' || !is_array($sourceData)) {
                    continue;
                }
                $sourceBreakdown[] = [
                    'source' => $source,
                    'rank' => is_numeric($sourceData['rank'] ?? null) ? (int) $sourceData['rank'] : 0,
                    'score' => is_numeric($sourceData['score'] ?? null) ? (float) $sourceData['score'] : null,
                    'weight' => is_numeric($sourceData['weight'] ?? null) ? (float) $sourceData['weight'] : null,
                    'weightedRrf' => is_numeric($sourceData['weightedRrf'] ?? null)
                        ? (float) $sourceData['weightedRrf']
                        : null,
                ];
            }
        }

        $scoreBreakdown = [];
        if ($hasScoreBreakdown) {
            foreach ($candidateInfo['scoreBreakdown'] as $key => $value) {
                $label = trim((string) $key);
                if ($label === '') {
                    continue;
                }
                if (is_numeric($value)) {
                    $scoreBreakdown[$label] = (float) $value;
                } elseif (is_string($value) || is_bool($value)) {
                    $scoreBreakdown[$label] = $value;
                }
            }
        }

        return [
            'combinedScore' => $hasCombined ? (float) $candidateInfo['combinedScore'] : 0.0,
            'bestRank' => is_numeric($candidateInfo['bestRank'] ?? null) ? (int) $candidateInfo['bestRank'] : 0,
            'sourceCount' => is_numeric($candidateInfo['sourceCount'] ?? null)
                ? (int) $candidateInfo['sourceCount']
                : count($sourceBreakdown),
            'scoreTieBreaker' => is_numeric($candidateInfo['scoreTieBreaker'] ?? null)
                ? (float) $candidateInfo['scoreTieBreaker']
                : null,
            'scoreBreakdown' => $scoreBreakdown,
            'sourceBreakdown' => $sourceBreakdown,
        ];
    }
}

if (!function_exists('muginPublicSearchBuildApiResultFromPubMed')) {
    /**
     * @param array<string,mixed> $summary
     * @param string $abstract
     * @param int $rank
     * @param array<string,mixed> $candidateInfo
     * @param bool $trusted
     * @param array<int,string> $meshTerms
     * @param array<int,array{label:string,text:string}> $abstractSections
     * @param array<int,array{name:string,familyName:string,givenName:string,initials:string}> $structuredAuthors
     * @param array<int,string> $pubmedKeywords
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildApiResultFromPubMed(
        array $summary,
        string $abstract,
        int $rank,
        array $candidateInfo,
        bool $trusted,
        array $meshTerms = [],
        array $abstractSections = [],
        array $structuredAuthors = [],
        array $pubmedKeywords = []
    ): array {
        $pmid = muginPublicSearchNormalizePmid($summary['uid'] ?? ($summary['pmid'] ?? ''));
        $doi = muginPublicSearchNormalizeDoi($candidateInfo['doi'] ?? '');
        $pmcId = '';
        if (is_array($summary['articleids'] ?? null)) {
            foreach ($summary['articleids'] as $articleId) {
                $idType = (string) ($articleId['idtype'] ?? '');
                if ($idType === 'doi' && $doi === '') {
                    $doi = muginPublicSearchNormalizeDoi($articleId['value'] ?? '');
                } elseif ($idType === 'pmc') {
                    $pmcId = trim((string) ($articleId['value'] ?? ''));
                }
            }
        }
        $mergedSources = isset($candidateInfo['sources']) && is_array($candidateInfo['sources'])
            ? array_values(array_map('strval', $candidateInfo['sources']))
            : ['pubmed'];
        $originSource = trim((string) ($candidateInfo['source'] ?? ($mergedSources[0] ?? 'pubmed')));
        $publicationDate = trim((string) ($summary['sortpubdate'] ?? ($summary['pubdate'] ?? '')));
        $year = muginPublicSearchExtractPubMedSummaryPublicationYear($summary);

        // Foretraekker strukturerede forfatternavne fra efetch-XML'en (LastName/
        // ForeName/Initials), da esummary kun leverer en flad 'name'-streng.
        // Falder tilbage til at splitte esummary-strengen, naar XML'en ikke er
        // hentet (fx naar includeAbstracts=false).
        $authors = $structuredAuthors;
        if (empty($authors) && is_array($summary['authors'] ?? null)) {
            foreach ($summary['authors'] as $author) {
                $authorName = trim((string) ($author['name'] ?? ''));
                if ($authorName !== '') {
                    $authors[] = muginPublicSearchSplitFamilyFirstAuthorName($authorName);
                }
            }
        }

        $topics = [];
        muginPublicSearchAppendTopicsFromLabels($topics, $meshTerms, 'mesh');
        muginPublicSearchAppendTopicsFromLabels($topics, $pubmedKeywords, 'pubmedKeyword');
        muginPublicSearchAppendOpenAlexTopicsFromCandidate($topics, $candidateInfo);
        muginPublicSearchAppendSemanticScholarTopics($topics, $candidateInfo);

        $normalizedAbstractSections = [];
        foreach ($abstractSections as $abstractSection) {
            $sectionText = trim((string) ($abstractSection['text'] ?? ''));
            if ($sectionText === '') {
                continue;
            }
            $normalizedAbstractSections[] = [
                'label' => trim((string) ($abstractSection['label'] ?? '')),
                'text' => $sectionText,
            ];
        }
        $abstractParagraphs = implode("\n\n", array_map(static function (array $section): string {
            return $section['label'] !== '' ? ($section['label'] . ': ' . $section['text']) : $section['text'];
        }, $normalizedAbstractSections));

        $ssMetadata = isset($candidateInfo['metadata']) && is_array($candidateInfo['metadata']) ? $candidateInfo['metadata'] : [];
        $citationCount = null;
        $citationCountSource = '';
        if (is_int($ssMetadata['citationCount'] ?? null)) {
            $citationCount = $ssMetadata['citationCount'];
            $citationCountSource = 'semanticScholar';
        }
        $isOpenAccess = is_bool($ssMetadata['isOpenAccess'] ?? null) ? $ssMetadata['isOpenAccess'] : null;
        $openAlexId = trim((string) ($candidateInfo['openAlexId'] ?? ''));
        $ranking = muginPublicSearchExtractResultRanking($candidateInfo);

        $result = [
            // Identifikation
            'rank' => $rank,
            'resultKey' => 'pmid:' . $pmid,
            'type' => 'pmid',
            'pmid' => $pmid,
            'doi' => $doi,
            'pmcId' => $pmcId,
            'openAlexId' => $openAlexId,
            // Bibliografiske kernedata
            'title' => trim((string) ($summary['title'] ?? '')),
            'authors' => $authors,
            'journal' => [
                'name' => trim((string) ($summary['fulljournalname'] ?? ($summary['source'] ?? ''))),
                'issn' => trim((string) ($summary['issn'] ?? '')),
                'volume' => trim((string) ($summary['volume'] ?? '')),
                'issue' => trim((string) ($summary['issue'] ?? '')),
                'pages' => trim((string) ($summary['pages'] ?? '')),
            ],
            'sourceLabel' => trim((string) ($summary['fulljournalname'] ?? ($summary['source'] ?? ''))),
            'publicationDate' => $publicationDate,
            'year' => $year,
            'language' => muginPublicSearchNormalizeSimpleList($summary['lang'] ?? [])[0] ?? '',
            'publicationTypes' => muginPublicSearchNormalizeSimpleList($summary['pubtype'] ?? []),
            'topics' => $topics,
            // Indhold
            'abstract' => trim($abstract),
            'hasAbstract' => trim($abstract) !== '',
            'abstractSource' => trim($abstract) !== '' ? 'pubmed' : '',
            'abstractSections' => $normalizedAbstractSections,
            'abstractParagraphs' => $abstractParagraphs,
            'aiSummary' => trim((string) ($ssMetadata['tldr'] ?? '')),
            // Metrikker
            'citationCount' => $citationCount,
            'citationCountSource' => $citationCountSource,
            'isOpenAccess' => $isOpenAccess,
            'openAccessUrl' => '',
            'isRetracted' => null,
            // Tillid/proveniens
            'trustedPmid' => $trusted,
            'canOpenInPubMed' => $pmid !== '',
            'originSource' => $originSource,
            'mergedSources' => $mergedSources,
        ];
        if ($ranking !== null) {
            $result['ranking'] = $ranking;
        }
        return $result;
    }
}

if (!function_exists('muginPublicSearchBuildApiResultFromOpenAlex')) {
    /**
     * @param array<string,mixed> $work
     * @param int $rank
     * @param array<string,mixed> $candidateInfo
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildApiResultFromOpenAlex(array $work, int $rank, array $candidateInfo): array
    {
        $doi = muginPublicSearchNormalizeDoi($work['doi'] ?? ($candidateInfo['doi'] ?? ''));
        $pmid = muginPublicSearchNormalizePmid($work['ids']['pmid'] ?? ($candidateInfo['pmid'] ?? ''));
        $primaryLocation = isset($work['primary_location']) && is_array($work['primary_location']) ? $work['primary_location'] : [];
        $source = isset($primaryLocation['source']) && is_array($primaryLocation['source']) ? $primaryLocation['source'] : [];
        $abstract = muginPublicSearchReconstructOpenAlexAbstract($work['abstract_inverted_index'] ?? []);
        $mergedSources = isset($candidateInfo['sources']) && is_array($candidateInfo['sources'])
            ? array_values(array_map('strval', $candidateInfo['sources']))
            : [trim((string) ($candidateInfo['source'] ?? 'openAlex'))];
        $originSource = trim((string) ($candidateInfo['source'] ?? ($mergedSources[0] ?? 'openAlex')));

        // OpenAlex leverer kun et samlet navn (typisk "Fornavn Efternavn"),
        // ikke separate navnedele, saa det splittes med samme heuristik som
        // webappens soegeformular bruger (formatOpenAlexAuthorName() i
        // src/utils/resultAdapters.js), for at give ens forfatternavne i
        // begge systemer. raw_author_name (navnet som det stod i den
        // oprindelige kilde) foretraekkes over author.display_name (den
        // disambiguerede, kanoniske navneform), ligesom i webappen.
        $authors = [];
        if (is_array($work['authorships'] ?? null)) {
            foreach ($work['authorships'] as $authorship) {
                $rawAuthorName = trim((string) ($authorship['raw_author_name'] ?? ''));
                $displayName = trim((string) ($authorship['author']['display_name'] ?? ''));
                $authorName = $rawAuthorName !== '' ? $rawAuthorName : $displayName;
                if ($authorName !== '') {
                    $authors[] = muginPublicSearchSplitGivenFirstAuthorName($authorName);
                }
            }
        }

        $publicationTypes = [];
        $workType = trim((string) ($work['type'] ?? ''));
        if ($workType !== '') {
            $publicationTypes[] = $workType;
        }
        $crossrefType = trim((string) ($work['type_crossref'] ?? ''));
        if ($crossrefType !== '' && $crossrefType !== $workType) {
            $publicationTypes[] = $crossrefType;
        }

        $biblio = isset($work['biblio']) && is_array($work['biblio']) ? $work['biblio'] : [];
        $firstPage = trim((string) ($biblio['first_page'] ?? ''));
        $lastPage = trim((string) ($biblio['last_page'] ?? ''));
        $pages = $firstPage !== '' && $lastPage !== ''
            ? ($firstPage . '-' . $lastPage)
            : trim($firstPage !== '' ? $firstPage : $lastPage);

        $primaryTopic = isset($work['primary_topic']) && is_array($work['primary_topic']) ? $work['primary_topic'] : [];
        $topics = [];
        $primaryTopicName = trim((string) ($primaryTopic['display_name'] ?? ''));
        if ($primaryTopicName !== '') {
            muginPublicSearchAppendUniqueTopic($topics, $primaryTopicName, 'openAlex');
        }
        if (is_array($work['topics'] ?? null)) {
            foreach ($work['topics'] as $topicEntry) {
                $topicLabel = '';
                if (is_string($topicEntry) || is_numeric($topicEntry)) {
                    $topicLabel = trim((string) $topicEntry);
                } elseif (is_array($topicEntry)) {
                    $topicLabel = trim((string) ($topicEntry['display_name'] ?? ($topicEntry['name'] ?? '')));
                }
                if (
                    $topicLabel === ''
                    || ($primaryTopicName !== '' && strcasecmp($topicLabel, $primaryTopicName) === 0)
                ) {
                    continue;
                }
                muginPublicSearchAppendUniqueTopic($topics, $topicLabel, 'openAlexTopic');
            }
        }
        muginPublicSearchAppendTopicsFromNamedEntries($topics, $work['keywords'] ?? [], 'openAlexKeyword');
        if (function_exists('muginExtractOpenAlexSubfieldDisplayNames')) {
            muginPublicSearchAppendTopicsFromLabels(
                $topics,
                muginExtractOpenAlexSubfieldDisplayNames($primaryTopic, $work['topics'] ?? []),
                'openAlexSubfield'
            );
        }
        muginPublicSearchAppendOpenAlexTopicsFromCandidate($topics, $candidateInfo);
        muginPublicSearchAppendSemanticScholarTopics($topics, $candidateInfo);

        $ssMetadata = isset($candidateInfo['metadata']) && is_array($candidateInfo['metadata']) ? $candidateInfo['metadata'] : [];

        $openAccess = isset($work['open_access']) && is_array($work['open_access']) ? $work['open_access'] : [];
        $isOpenAccess = isset($openAccess['is_oa']) ? (bool) $openAccess['is_oa'] : null;
        if ($isOpenAccess === null && is_bool($ssMetadata['isOpenAccess'] ?? null)) {
            $isOpenAccess = $ssMetadata['isOpenAccess'];
        }

        $citedByCountRaw = $work['cited_by_count'] ?? null;
        $citationCount = is_numeric($citedByCountRaw) ? (int) $citedByCountRaw : null;
        $citationCountSource = $citationCount !== null ? 'openAlex' : '';
        if ($citationCount === null && is_int($ssMetadata['citationCount'] ?? null)) {
            $citationCount = $ssMetadata['citationCount'];
            $citationCountSource = 'semanticScholar';
        }

        $isRetractedRaw = $work['is_retracted'] ?? null;
        $openAlexId = trim((string) ($candidateInfo['openAlexId'] ?? ''));
        if ($openAlexId === '' && function_exists('muginNormalizeOpenAlexLookupId')) {
            $openAlexId = muginNormalizeOpenAlexLookupId((string) ($work['id'] ?? ''));
        } elseif ($openAlexId === '') {
            $openAlexId = trim((string) ($work['id'] ?? ''));
        }
        $ranking = muginPublicSearchExtractResultRanking($candidateInfo);

        $result = [
            // Identifikation
            'rank' => $rank,
            'resultKey' => 'doi:' . strtolower($doi),
            'type' => 'doi',
            'pmid' => $pmid,
            'doi' => $doi,
            'pmcId' => trim((string) ($work['ids']['pmcid'] ?? '')),
            'openAlexId' => $openAlexId,
            // Bibliografiske kernedata
            'title' => trim((string) ($work['display_name'] ?? ($work['title'] ?? ''))),
            'authors' => $authors,
            'journal' => [
                'name' => trim((string) ($source['display_name'] ?? '')),
                'issn' => trim((string) ($source['issn_l'] ?? '')),
                'volume' => trim((string) ($biblio['volume'] ?? '')),
                'issue' => trim((string) ($biblio['issue'] ?? '')),
                'pages' => $pages,
            ],
            'sourceLabel' => trim((string) ($source['display_name'] ?? '')),
            'publicationDate' => trim((string) ($work['publication_date'] ?? '')),
            'year' => trim((string) ($work['publication_year'] ?? '')),
            'language' => trim((string) ($work['language'] ?? '')),
            'publicationTypes' => $publicationTypes,
            'topics' => $topics,
            // Indhold
            'abstract' => trim($abstract),
            'hasAbstract' => trim($abstract) !== '',
            'abstractSource' => trim($abstract) !== '' ? 'openAlex' : '',
            // OpenAlex' abstract_inverted_index indeholder ingen afsnitsstruktur,
            // saa abstractet gengives her som en enkelt, ulabeled sektion.
            'abstractSections' => trim($abstract) !== '' ? [['label' => '', 'text' => trim($abstract)]] : [],
            'abstractParagraphs' => trim($abstract),
            'aiSummary' => trim((string) ($ssMetadata['tldr'] ?? '')),
            // Metrikker
            'citationCount' => $citationCount,
            'citationCountSource' => $citationCountSource,
            'isOpenAccess' => $isOpenAccess,
            'openAccessUrl' => trim((string) ($openAccess['oa_url'] ?? '')),
            'isRetracted' => is_bool($isRetractedRaw) ? $isRetractedRaw : null,
            // Tillid/proveniens
            'trustedPmid' => false,
            'canOpenInPubMed' => $pmid !== '',
            'originSource' => $originSource,
            'mergedSources' => $mergedSources,
        ];
        if ($ranking !== null) {
            $result['ranking'] = $ranking;
        }
        return $result;
    }
}

if (!function_exists('muginPublicSearchBuildFinalResponse')) {
    /**
     * @param array<string,mixed> $request
     * @param array<string,mixed> $resolvedQueries
     * @param array<int,array<string,mixed>> $results
     * @param int $totalCount
     * @param bool $partial
     * @param array<int,string> $warnings
     * @param string $finalStage
     * @param bool $matchesWebOrdering
     * @param array<string,mixed> $diagnostics
     * @param array<string,mixed>|null $processDetailsCollector
     * @return array<string,mixed>
     */
    function muginPublicSearchBuildFinalResponse(
        array $request,
        array $resolvedQueries,
        array $results,
        int $totalCount,
        bool $partial,
        array $warnings,
        string $finalStage,
        bool $matchesWebOrdering,
        array $diagnostics = [],
        ?array $processDetailsCollector = null,
        ?array $preselectedResults = null
    ): array {
        $selectionWarnings = (array) ($request['_topicHydrationWarnings'] ?? []);
        $mergedWarnings = muginPublicSearchDedupeStrings(array_merge(
            array_map('strval', $warnings),
            array_map('strval', $selectionWarnings)
        ));
        $response = [
            'apiVersion' => '1',
            'query' => [
                'text' => (string) ($request['query']['text'] ?? ''),
                'language' => (string) ($request['query']['language'] ?? 'auto'),
            ],
            'sources' => array_values(array_map('strval', (array) ($request['sources'] ?? []))),
            'focus' => (string) ($request['focus'] ?? ''),
            'page' => [
                'number' => (int) ($request['page']['number'] ?? 1),
                'size' => (int) ($request['page']['size'] ?? 25),
            ],
            'total' => $totalCount,
            'partial' => $partial,
            'warnings' => array_values($mergedWarnings),
            'selection' => muginPublicSearchBuildSelectionFromRequest($request),
            'order' => [
                'requestedMethod' => (string) ($request['sort']['method'] ?? 'relevance'),
                'appliedMethod' => (string) ($request['sort']['method'] ?? 'relevance'),
                'finalStage' => $finalStage,
                'matchesWebOrdering' => $matchesWebOrdering,
            ],
            'results' => array_values($results),
        ];

        if ($preselectedResults === null) {
            $preselectedResults = muginPublicSearchFetchPreselectedResults(
                (array) ($request['preselectedIdentifiers'] ?? $request['preselectedPmids'] ?? []),
                (string) ($request['domain'] ?? '')
            );
        }
        $response['preselectedResults'] = array_values($preselectedResults);

        if (($request['responseOptions']['includeResolvedQueries'] ?? false) === true) {
            $response['resolvedQueries'] = [
                'pubmedQuery' => (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                'semanticIntent' => (string) ($resolvedQueries['semanticIntent'] ?? ''),
                'hardFilterQuery' => (string) ($resolvedQueries['hardFilterQuery'] ?? ''),
                'freetextPubMedQuery' => (string) ($resolvedQueries['freetextPubMedQuery'] ?? ''),
                'sourceQueryPlan' => $resolvedQueries['sourceQueryPlan'] ?? new stdClass(),
            ];
        }
        if (($request['responseOptions']['includeDiagnostics'] ?? false) === true) {
            $response['diagnostics'] = $diagnostics;
        }
        if (($request['responseOptions']['includeProcessDetails'] ?? false) === true && $processDetailsCollector !== null) {
            $response['processDetails'] = muginPublicSearchProcessDetailsExport($processDetailsCollector);
        }

        return $response;
    }
}

if (!function_exists('muginPublicSearchPrefetchInitialSourceRequests')) {
    /**
     * Fires the *first* HTTP request for each requested source
     * (pubmed/semanticScholar/openAlex/elicit) concurrently via
     * muginHttpRequestMulti(), and registers each response with
     * muginHttpRequestPrefetch() so the existing, unmodified
     * muginPublicSearchFetch*SourceResult() functions transparently pick them
     * up on their own first muginHttpRequest() call instead of blocking on a
     * real (sequential) network round-trip.
     *
     * Deliberately scoped to only the *first* request per source (this is
     * "Fase 5" from the unified-search-engine-full-parity plan, previously
     * deferred as "requires bigger refactor than assessed"): Semantic
     * Scholar's own pagination (2nd+ batch, only reached when there are 100+
     * raw matches and the configured limit exceeds 100) and PubMed's esummary
     * (which needs the PMIDs from its own esearch) still run sequentially
     * after this, exactly as before - but they no longer have to wait for
     * the OTHER three sources' full round-trip first, which is what caused
     * the "sources" phase to take roughly the *sum* of every source's
     * latency instead of the *max* of them. Uses the same request-building
     * helpers as the real fetch functions (muginPublicSearchBuild*RequestSpec())
     * so there is exactly one place that knows how to build each request -
     * no duplicated/drifting logic.
     *
     * @param array<int,string> $sources
     * @param array<string,mixed> $resolvedQueries
     * @param array<string,mixed> $request
     * @param callable|null $sourceTimingCallback Called as (string $source, int $elapsedMs)
     *        once every first-wave request for that source has completed.
     * @param array<string,array{url:string,options:array<string,mixed>}> $additionalNamedRequests
     * @param callable|null $sourceStartCallback Called with requested source keys
     *        immediately before the concurrent wave starts.
     * @return array<string,int> Per-source first-wave HTTP duration in milliseconds.
     */
    function muginPublicSearchPrefetchInitialSourceRequests(
        array $sources,
        array $resolvedQueries,
        array $request,
        string $domain,
        ?callable $sourceTimingCallback = null,
        array $additionalNamedRequests = [],
        ?callable $sourceStartCallback = null
    ): array {
        $namedRequests = $additionalNamedRequests;
        $sourceQueryPlan = isset($resolvedQueries['sourceQueryPlan']) && is_array($resolvedQueries['sourceQueryPlan'])
            ? $resolvedQueries['sourceQueryPlan']
            : [];
        $clientSourceApiKeys = isset($request['_clientSourceApiKeys']) && is_array($request['_clientSourceApiKeys'])
            ? $request['_clientSourceApiKeys']
            : [];

        if (in_array('pubmed', $sources, true)) {
            $pubmedQuery = muginPublicSearchCombinePubMedQuery(
                (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                (string) ($resolvedQueries['hardFilterQuery'] ?? '')
            );
            if ($pubmedQuery !== '') {
                muginThrottleNlmRequests(5);
                $searchLimit = muginPublicSearchGetSemanticSourceLimit('pubmedBestMatch', 200);
                $baseUrl = function_exists('muginGetNlmBaseUrl')
                    ? muginGetNlmBaseUrl($domain)
                    : (defined('NLM_BASE_URL') ? NLM_BASE_URL : 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');
                $endpointUrl = rtrim($baseUrl, '/') . '/esearch.fcgi';
                $queryString = muginPublicSearchBuildNlmQueryParams([
                    'db' => 'pubmed',
                    'term' => $pubmedQuery,
                    'retmode' => 'json',
                    'retmax' => max(1, $searchLimit),
                    'retstart' => 0,
                    'sort' => 'relevance',
                ], $domain);
                $namedRequests['pubmed'] = muginPublicSearchBuildNlmRequestOptions(
                    $endpointUrl,
                    $queryString,
                    ['Accept: application/json']
                );
            }
        }
        if (in_array('semanticScholar', $sources, true)) {
            $query = trim((string) ($sourceQueryPlan['semanticScholar']['query'] ?? ''));
            if ($query !== '') {
                $filters = (array) ($sourceQueryPlan['semanticScholar']['filters'] ?? []);
                $headers = muginPublicSearchBuildSemanticScholarHeaders(
                    (string) ($clientSourceApiKeys['semanticScholar'] ?? '')
                );
                $publicationTypesParam = '';
                $publicationTypes = muginPublicSearchDedupeStrings(
                    array_map(
                        'muginPublicSearchNormalizeSemanticScholarPublicationType',
                        (array) ($filters['publicationTypes'] ?? [])
                    )
                );
                if (!empty($publicationTypes)) {
                    $publicationTypesParam = implode(',', $publicationTypes);
                }
                $publicationDateOrYear = muginPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
                    $filters['publicationDateOrYear'] ?? ''
                );
                $year = muginPublicSearchNormalizePublicationYearRange($filters['year'] ?? '');
                $configuredLimit = max(1, muginPublicSearchGetSemanticSourceLimit('semanticScholar', 400));
                $currentLimit = min(100, $configuredLimit);
                muginThrottleRequestRate('semantic_scholar', 3);
                $namedRequests['semanticScholar'] = muginPublicSearchBuildSemanticScholarBatchRequestSpec(
                    $query,
                    $headers,
                    $publicationTypesParam,
                    $publicationDateOrYear,
                    $year,
                    0,
                    $currentLimit
                );
            }
        }
        if (in_array('openAlex', $sources, true)) {
            $query = trim((string) ($sourceQueryPlan['openAlex']['query'] ?? ''));
            if ($query !== '') {
                $filters = (array) ($sourceQueryPlan['openAlex']['filters'] ?? []);
                $apiKeyOverride = (string) ($clientSourceApiKeys['openAlex'] ?? '');
                // One OpenAlex throttle for the whole multi wave (semantic + optional keyword).
                muginThrottleRequestRate('openalex', 1);
                // Semantic primary defers language/source/work/year filters.
                // isOa is applied immediately because it is a simple boolean filter.
                $openAlexSemanticFilters = [];
                if (muginPublicSearchNormalizeElicitBooleanValue($filters['isOa'] ?? ($filters['is_oa'] ?? null)) === true) {
                    $openAlexSemanticFilters['isOa'] = true;
                }
                $namedRequests['openAlex'] = muginPublicSearchBuildOpenAlexSourceRequestSpec(
                    $query,
                    $openAlexSemanticFilters,
                    $domain,
                    $apiKeyOverride,
                    'semantic'
                );
                $hasDeferredFilters = false;
                foreach (['language', 'sourceType', 'workType', 'publicationYear'] as $filterField) {
                    $value = $filters[$filterField] ?? null;
                    if ((is_array($value) && !empty($value)) || (!is_array($value) && trim((string) $value) !== '')) {
                        $hasDeferredFilters = true;
                        break;
                    }
                }
                // Prefetch keyword supplement in the same multi wave when legacy
                // would start it in parallel with deferred semantic filters.
                if ($hasDeferredFilters) {
                    $namedRequests['openAlex_keyword'] = muginPublicSearchBuildOpenAlexSourceRequestSpec(
                        $query,
                        $filters,
                        $domain,
                        $apiKeyOverride,
                        'keyword'
                    );
                }
            }
        }
        if (in_array('elicit', $sources, true)) {
            $query = trim((string) ($sourceQueryPlan['elicit']['query'] ?? ''));
            if ($query !== '') {
                $filters = (array) ($sourceQueryPlan['elicit']['filters'] ?? []);
                $apiKeyOverride = trim((string) ($clientSourceApiKeys['elicit'] ?? ''));
                $apiKey = $apiKeyOverride !== ''
                    ? $apiKeyOverride
                    : (defined('ELICIT_API_KEY') ? trim((string) ELICIT_API_KEY) : '');
                if ($apiKey !== '') {
                    muginThrottleRequestRate('elicit', 2);
                    $namedRequests['elicit'] = muginPublicSearchBuildElicitSourceRequestSpec($query, $filters, $apiKey);
                }
            }
        }

        if (empty($namedRequests)) {
            return [];
        }
        if ($sourceStartCallback !== null) {
            $requestedSourceKeys = [];
            foreach (array_keys($namedRequests) as $name) {
                $sourceKey = $name === 'openAlex_keyword' ? 'openAlex' : $name;
                if (in_array($sourceKey, ['pubmed', 'semanticScholar', 'openAlex', 'elicit'], true)) {
                    $requestedSourceKeys[$sourceKey] = true;
                }
            }
            $sourceStartCallback(array_keys($requestedSourceKeys));
        }
        $expectedRequestsBySource = [];
        foreach (array_keys($namedRequests) as $name) {
            $sourceKey = $name === 'openAlex_keyword' ? 'openAlex' : $name;
            $expectedRequestsBySource[$sourceKey] = (int) ($expectedRequestsBySource[$sourceKey] ?? 0) + 1;
        }
        $completedRequestsBySource = [];
        $liveSourceElapsedMs = [];
        $responses = muginHttpRequestMulti(
            $namedRequests,
            static function (string $name, int $elapsedMs) use (
                &$completedRequestsBySource,
                &$liveSourceElapsedMs,
                $expectedRequestsBySource,
                $sourceTimingCallback
            ): void {
                $sourceKey = $name === 'openAlex_keyword' ? 'openAlex' : $name;
                $completedRequestsBySource[$sourceKey] = (int) ($completedRequestsBySource[$sourceKey] ?? 0) + 1;
                $liveSourceElapsedMs[$sourceKey] = max(
                    (int) ($liveSourceElapsedMs[$sourceKey] ?? 0),
                    max(0, $elapsedMs)
                );
                if (
                    $sourceTimingCallback !== null
                    && $completedRequestsBySource[$sourceKey] >= (int) ($expectedRequestsBySource[$sourceKey] ?? 1)
                ) {
                    $sourceTimingCallback($sourceKey, (int) $liveSourceElapsedMs[$sourceKey]);
                }
            }
        );
        $sourceElapsedMs = [];
        foreach ($namedRequests as $name => $spec) {
            if (isset($responses[$name])) {
                muginHttpRequestPrefetch($spec['url'], $spec['options'], $responses[$name]);
                $sourceKey = $name === 'openAlex_keyword' ? 'openAlex' : $name;
                $sourceElapsedMs[$sourceKey] = max(
                    (int) ($sourceElapsedMs[$sourceKey] ?? 0),
                    max(0, (int) ($responses[$name]['elapsed_ms'] ?? 0))
                );
            }
        }
        return $sourceElapsedMs;
    }
}

if (!function_exists('muginPublicSearchRunSearch')) {
    /**
     * @param array<string,mixed> $request
     * @param callable|null $progressCallback
     * @return array<string,mixed>
     */
    function muginPublicSearchRunSearch(array &$request, ?callable $progressCallback = null): array
    {
        $config = muginPublicSearchGetConfig();
        muginPublicSearchProcessDetailsEnsureCollector($request);
        $collector = isset($request['_processDetails']) && is_array($request['_processDetails'])
            ? $request['_processDetails']
            : null;
        $includeDiagnostics = ($request['responseOptions']['includeDiagnostics'] ?? false) === true;
        $noCache = ($request['responseOptions']['noCache'] ?? false) === true;
        $searchCacheTtl = (int) ($config['searchResultCacheTtlSeconds'] ?? 0);
        // Exclude the in-memory collector from the cache key — it is request-local
        // mutable state and must never create unique cache entries per run.
        // Also strip noCache so a bypass request writes/reads the same entry as
        // a normal request for the same search inputs.
        $requestForCacheKey = $request;
        unset($requestForCacheKey['_processDetails']);
        if (isset($requestForCacheKey['responseOptions']) && is_array($requestForCacheKey['responseOptions'])) {
            unset($requestForCacheKey['responseOptions']['noCache']);
        }
        // Salt by LLM provider so cached search responses stay provider-scoped.
        $requestForCacheKey['_llmProvider'] = function_exists('muginGetLlmProvider') ? muginGetLlmProvider() : 'openai';
        // Invalidate stale rankings when topic-signal scoring/payload changes.
        $requestForCacheKey['_topicSignalVersion'] = defined('MUGIN_TOPIC_SIGNAL_VERSION')
            ? MUGIN_TOPIC_SIGNAL_VERSION
            : '2026-08-11';
        $searchCacheKey = 'request:' . muginPublicSearchSafeJsonEncode($requestForCacheKey);
        if ($searchCacheTtl > 0 && !$noCache) {
            $cacheEntry = muginPublicSearchReadCacheValue('search-response', $searchCacheKey);
            if (($cacheEntry['hit'] ?? false) === true && is_array($cacheEntry['value'] ?? null)) {
                muginPublicSearchEmitProgress($progressCallback, 'cache', '', [
                    'stepId' => 'cache',
                    'messageKey' => 'semanticSearchProgressCacheHit',
                ]);
                $cachedResponse = $cacheEntry['value'];
                if ($includeDiagnostics) {
                    $cachedDiagnostics = isset($cachedResponse['diagnostics']) && is_array($cachedResponse['diagnostics'])
                        ? $cachedResponse['diagnostics']
                        : [];
                    $cachedDiagnostics['cache'] = ['hit' => true];
                    $cachedResponse['diagnostics'] = $cachedDiagnostics;
                }
                return $cachedResponse;
            }
        }
        $domain = (string) ($request['domain'] ?? '');
        $sortMethod = (string) ($request['sort']['method'] ?? 'relevance');
        $pageNumber = max(1, (int) ($request['page']['number'] ?? 1));
        $pageSize = max(1, (int) ($request['page']['size'] ?? 25));
        $pageOffset = ($pageNumber - 1) * $pageSize;
        if (array_key_exists('offset', (array) ($request['page'] ?? []))) {
            $pageOffset = max(0, (int) $request['page']['offset']);
        }
        $pipelineCacheKey = muginPublicSearchBuildPipelineCacheKey($request);
        // Keep pipeline entries longer than short search-response TTL so users can
        // read page 1 and still hit the fast path for "Indlæs de næste".
        $pipelineCacheTtl = $searchCacheTtl > 0 ? max($searchCacheTtl, 1800) : 0;
        // Continuation requests (page 2+ or explicit offset>0 for page-size changes)
        // must not re-run intent/sources/rerank — only hydrate the missing slice.
        if (($pageNumber > 1 || $pageOffset > 0) && $pipelineCacheTtl > 0 && !$noCache) {
            $pipelineCacheEntry = muginPublicSearchReadCacheValue('search-pipeline', $pipelineCacheKey);
            $cachedPipeline = (($pipelineCacheEntry['hit'] ?? false) === true
                && is_array($pipelineCacheEntry['value'] ?? null))
                ? $pipelineCacheEntry['value']
                : null;
            if (
                is_array($cachedPipeline)
                && isset($cachedPipeline['resultRefs'], $cachedPipeline['resolvedQueries'])
                && is_array($cachedPipeline['resultRefs'])
                && is_array($cachedPipeline['resolvedQueries'])
            ) {
                $resolvedQueries = (array) $cachedPipeline['resolvedQueries'];
                $resultRefs = array_values((array) $cachedPipeline['resultRefs']);
                $orderedCandidates = array_values((array) ($cachedPipeline['orderedCandidates'] ?? []));
                $hybridOrdering = isset($cachedPipeline['hybridOrdering']) && is_array($cachedPipeline['hybridOrdering'])
                    ? $cachedPipeline['hybridOrdering']
                    : ['refs' => $resultRefs, 'pmids' => []];
                $warnings = muginPublicSearchDedupeStrings(array_merge(
                    array_map('strval', (array) ($cachedPipeline['warnings'] ?? [])),
                    array_map('strval', (array) ($request['_sourceAccessWarnings'] ?? []))
                ));
                $diagnostics = isset($cachedPipeline['diagnostics']) && is_array($cachedPipeline['diagnostics'])
                    ? $cachedPipeline['diagnostics']
                    : [];
                if ($includeDiagnostics) {
                    $diagnostics['cache'] = ['hit' => false];
                    $diagnostics['pipelineCache'] = ['hit' => true];
                }
                $totalCount = (int) ($cachedPipeline['totalCount'] ?? count($resultRefs));
                goto mugin_public_search_hydrate_page;
            }
        }
        // Search-basis metadata is folded into the first real prepare-lane step
        // (no separate timed "prepare" progress stage).
        $intentContextForBasis = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];
        $searchBasisPayload = [
            'input' => trim((string) ($intentContextForBasis['rawUserInput'] ?? ($request['query']['text'] ?? ''))),
            'selectedSources' => array_values((array) ($request['sources'] ?? [])),
            'resultFocus' => (string) ($request['focus'] ?? ''),
            'sort' => $sortMethod,
            'pageSize' => $pageSize,
            'searchWithAI' => ((string) ($request['translation']['mode'] ?? 'auto')) === 'auto',
        ];
        $resolvedQueries = muginPublicSearchBuildResolvedQueries($request, $progressCallback);
        muginPublicSearchEmitProgress($progressCallback, 'resolvedQueries', '', [
            'stepId' => 'resolvedQueries',
            'detailOnly' => true,
            'resolvedQueries' => [
                'pubmedQuery' => (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                'hardFilterQuery' => (string) ($resolvedQueries['hardFilterQuery'] ?? ''),
                'freetextPubMedQuery' => (string) ($resolvedQueries['freetextPubMedQuery'] ?? ''),
                'sourceQueryPlan' => $resolvedQueries['sourceQueryPlan'] ?? new stdClass(),
            ],
        ]);
        $warnings = muginPublicSearchDedupeStrings(array_merge(
            (array) ($resolvedQueries['warnings'] ?? []),
            (array) ($request['_sourceAccessWarnings'] ?? [])
        ));
        $diagnostics = [];
        if ($includeDiagnostics) {
            $diagnostics['cache'] = ['hit' => false];
        }
        if ($collector !== null) {
            $processReports = (array) ($resolvedQueries['processReports'] ?? []);
            $semanticIntentMeta = (array) ($resolvedQueries['semanticIntentMeta'] ?? []);
            if (!empty($processReports['semanticIntent'])) {
                muginPublicSearchProcessDetailsSetStep(
                    $collector,
                    'semanticIntent',
                    (array) $processReports['semanticIntent']
                );
                muginPublicSearchProcessDetailsEmitStep($collector, 'semanticIntent', $progressCallback, true);
            } elseif (!empty($processReports['semanticQuery'])) {
                muginPublicSearchProcessDetailsMergeStep(
                    $collector,
                    'semanticIntent',
                    (array) $processReports['semanticQuery']
                );
                muginPublicSearchProcessDetailsEmitStep($collector, 'semanticIntent', $progressCallback, true);
            }
            if (!empty($processReports['searchString'])) {
                $searchStringPayload = (array) $processReports['searchString'];
                if (isset($semanticIntentMeta['coverageCheck']) && is_array($semanticIntentMeta['coverageCheck'])) {
                    $searchStringPayload['coverageCheck'] = $semanticIntentMeta['coverageCheck'];
                }
                muginPublicSearchProcessDetailsSetStep($collector, 'searchString', $searchStringPayload);
                muginPublicSearchProcessDetailsEmitStep($collector, 'searchString', $progressCallback, true);
            }
            if (!empty($processReports['mesh'])) {
                muginPublicSearchProcessDetailsSetStep($collector, 'mesh', (array) $processReports['mesh']);
                muginPublicSearchProcessDetailsEmitStep($collector, 'mesh', $progressCallback, true);
            }
            $searchBasisTarget = null;
            if (!empty($processReports['semanticIntent']) || !empty($processReports['semanticQuery'])) {
                $searchBasisTarget = 'semanticIntent';
            } elseif (!empty($processReports['searchString'])) {
                $searchBasisTarget = 'searchString';
            } elseif (!empty($processReports['mesh'])) {
                $searchBasisTarget = 'mesh';
            }
            if ($searchBasisTarget !== null) {
                muginPublicSearchProcessDetailsMergeStep($collector, $searchBasisTarget, [
                    'searchBasis' => $searchBasisPayload,
                ]);
            }
        }

        $sourceDetailContext = trim((string) (
            $request['intentContext']['rawUserInput']
            ?? $request['query']['text']
            ?? ''
        ));
        $isPurePubMed = $request['sources'] === ['pubmed'];
        if ($isPurePubMed) {
            $finalPubMedQuery = muginPublicSearchCombinePubMedQuery(
                (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                (string) ($resolvedQueries['hardFilterQuery'] ?? '')
            );
            muginPublicSearchEmitProgress($progressCallback, 'pubmed', '', [
                'stepId' => 'pubmed',
                'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                'messageKey' => 'semanticSearchProgressPubMedBestMatch',
                'source' => 'pubmed',
            ]);
            $pubmedFetchStartedAt = microtime(true);
            // NCBI esearch accepts relevance / pub_date (not app-level date_desc/date_asc).
            $nlmSort = $sortMethod === 'relevance' ? 'relevance' : 'pub_date';
            $searchPayload = muginPublicSearchNlmGetJson('esearch.fcgi', [
                'db' => 'pubmed',
                'term' => $finalPubMedQuery,
                'retmode' => 'json',
                'retmax' => $pageSize,
                'retstart' => $pageOffset,
                'sort' => $nlmSort,
            ], $domain);
            $esearch = isset($searchPayload['esearchresult']) && is_array($searchPayload['esearchresult'])
                ? $searchPayload['esearchresult']
                : [];
            $pmids = muginPublicSearchDedupeStrings((array) ($esearch['idlist'] ?? []), 'muginPublicSearchNormalizePmid');
            muginPublicSearchProcessDetailsRecordSourceCompletion(
                $collector,
                'pubmed',
                $finalPubMedQuery,
                ['candidates' => $pmids, 'total' => (int) ($esearch['count'] ?? 0)],
                $pubmedFetchStartedAt,
                $progressCallback,
                [
                    'stepId' => 'pubmed',
                    'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                    'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                    'messageKey' => 'semanticSearchProgressPubMedBestMatch',
                    'source' => 'pubmed',
                ],
                [
                    'db' => 'pubmed',
                    'term' => $finalPubMedQuery,
                    'retmax' => $pageSize,
                    'retstart' => $pageOffset,
                    'retmode' => 'json',
                    'sort' => $nlmSort,
                ],
                muginPublicSearchMergeQueryOverrideRequestMeta(
                    $resolvedQueries,
                    'pubmed',
                    ['role' => 'pubmedNativeSearch', 'limitStrategy' => 'pubmed-only']
                ),
                $sourceDetailContext
            );
            muginPublicSearchEmitProgress($progressCallback, 'finalizeHydrate', '', [
                'stepId' => 'finalizeHydrate',
                'groupId' => 'finalizeHydrate',
                'groupKey' => 'semanticSearchProcessGroupDisplay',
                'messageKey' => 'semanticSearchProgressFinalizeHydratePubMed',
            ]);
            $summaryMap = muginPublicSearchFetchPubMedSummaryRecords($pmids, $domain);
            $abstractMap = ($request['responseOptions']['includeAbstracts'] ?? true) === true
                ? muginPublicSearchFetchPubMedAbstractMap($pmids, $domain)
                : [];

            $results = [];
            foreach ($pmids as $index => $pmid) {
                if (!isset($summaryMap[$pmid])) {
                    continue;
                }
                $results[] = muginPublicSearchBuildApiResultFromPubMed(
                    $summaryMap[$pmid],
                    $abstractMap[$pmid]['abstract'] ?? '',
                    $pageOffset + $index + 1,
                    ['source' => 'pubmed', 'sources' => ['pubmed'], 'doi' => ''],
                    true,
                    $abstractMap[$pmid]['mesh'] ?? [],
                    $abstractMap[$pmid]['abstractSections'] ?? [],
                    $abstractMap[$pmid]['authors'] ?? [],
                    $abstractMap[$pmid]['keywords'] ?? []
                );
            }

            if ($collector !== null) {
                muginPublicSearchProcessDetailsSetStep($collector, 'finalizeHydrate', [
                    'role' => 'pubmedNativeHydration',
                    'requestedCount' => count($pmids),
                    'pmidCount' => count($pmids),
                    'externalReferenceCount' => 0,
                    'hydratedCount' => count($results),
                    'missingCount' => max(0, count($pmids) - count($results)),
                ]);
                muginPublicSearchProcessDetailsMergeStep($collector, 'finalizeHydrate', [
                    'renderedCount' => count($results),
                    'totalCount' => (int) ($esearch['count'] ?? 0),
                    'page' => $pageNumber,
                    'pageSize' => $pageSize,
                ]);
                muginPublicSearchProcessDetailsEmitStep($collector, 'finalizeHydrate', $progressCallback, true);
            }
            $pubmedTotalCount = (int) ($esearch['count'] ?? 0);
            if (muginPublicSearchShouldApplySemanticLlmFinalRerank($request, $results)) {
                muginPublicSearchEmitProgress($progressCallback, 'finalRerank', '', [
                    'stepId' => 'finalRerank',
                    'groupId' => 'finalizeHydrate',
                    'groupKey' => 'semanticSearchProcessGroupDisplay',
                    'messageKey' => 'semanticSearchProgressFinalRerank',
                ]);
                $finalRerankResult = muginPublicSearchMaybeApplySemanticLlmFinalRerank(
                    $results,
                    $request,
                    $resolvedQueries,
                    $domain
                );
                $results = $finalRerankResult['results'];
                $diagnostics['finalRerank'] = $finalRerankResult['detail'] ?? [];
                if ($collector !== null) {
                    muginPublicSearchProcessDetailsSetStep($collector, 'finalRerank', array_merge(
                        (array) $diagnostics['finalRerank'],
                        [
                            'renderedCount' => count($results),
                            'totalCount' => $pubmedTotalCount,
                            'page' => $pageNumber,
                            'pageSize' => $pageSize,
                        ]
                    ));
                    muginPublicSearchProcessDetailsEmitStep($collector, 'finalRerank', $progressCallback, true);
                }
                foreach ($results as $index => &$result) {
                    $result['rank'] = $pageOffset + $index + 1;
                }
                unset($result);
            }
            $responseResolvedQueries = !empty($resolvedQueries['queryOverrideApplied']['pubmed'])
                ? $resolvedQueries
                : array_merge($resolvedQueries, ['hardFilterQuery' => $finalPubMedQuery]);
            $response = muginPublicSearchBuildFinalResponse(
                $request,
                $responseResolvedQueries,
                $results,
                $pubmedTotalCount,
                false,
                $warnings,
                'pubmed_native',
                $config['matchesWebOrderingByDefault'],
                $diagnostics,
                $collector
            );
            if ($searchCacheTtl > 0) {
                muginPublicSearchWriteCacheValue('search-response', $searchCacheKey, $response, $searchCacheTtl);
            }
            return $response;
        }

        // Activate every selected source step first so the UI shows them as
        // concurrent (matching legacy browser-side parallelism), then prefetch
        // their first HTTP hops together, then consume via Fetch* (cache hits).
        $selectedSources = array_values(array_filter(
            ['pubmed', 'semanticScholar', 'openAlex', 'elicit'],
            static fn($source) => in_array($source, (array) $request['sources'], true)
        ));
        $sourceProgressContexts = [
            'pubmed' => [
                'stepId' => 'pubmed',
                'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                'messageKey' => 'semanticSearchProgressPubMedBestMatch',
                'source' => 'pubmed',
            ],
            'semanticScholar' => [
                'stepId' => 'semanticScholar',
                'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                'messageKey' => 'semanticSearchProgressSemanticScholar',
                'source' => 'semanticScholar',
            ],
            'openAlex' => [
                'stepId' => 'openAlex',
                'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                'messageKey' => 'semanticSearchProgressOpenAlex',
                'source' => 'openAlex',
            ],
            'elicit' => [
                'stepId' => 'elicit',
                'groupId' => muginPublicSearchSourcesProgressGroupId($request),
                'groupKey' => muginPublicSearchSourcesProgressGroupKey($request),
                'messageKey' => 'semanticSearchProgressElicit',
                'source' => 'elicit',
            ],
        ];
        $earlyPrefetchedSources = array_values((array) ($resolvedQueries['_earlyPrefetchedSources'] ?? []));
        $earlySourceStartedAt = (array) ($resolvedQueries['_earlySourceStartedAt'] ?? []);
        $sourceFetchStartedAt = [];
        foreach ($selectedSources as $sourceKey) {
            if (
                in_array($sourceKey, $earlyPrefetchedSources, true)
                && isset($earlySourceStartedAt[$sourceKey])
                && is_numeric($earlySourceStartedAt[$sourceKey])
            ) {
                $sourceFetchStartedAt[$sourceKey] = (float) $earlySourceStartedAt[$sourceKey];
                continue;
            }
            $sourceFetchStartedAt[$sourceKey] = microtime(true);
            muginPublicSearchEmitProgress(
                $progressCallback,
                $sourceKey,
                '',
                $sourceProgressContexts[$sourceKey]
            );
        }
        muginPublicSearchPrefetchInitialSourceRequests(
            array_values(array_diff($selectedSources, $earlyPrefetchedSources)),
            $resolvedQueries,
            $request,
            $domain
        );
        $sourceResults = [];
        if (in_array('pubmed', $selectedSources, true)) {
            $pubmedQueryText = muginPublicSearchCombinePubMedQuery(
                (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                (string) ($resolvedQueries['hardFilterQuery'] ?? '')
            );
            $pubmedSourceResult = muginPublicSearchFetchPubMedBestMatchSourceResult($pubmedQueryText, $domain);
            $sourceResults[] = $pubmedSourceResult;
            muginPublicSearchProcessDetailsRecordSourceCompletion(
                $collector,
                'pubmed',
                $pubmedQueryText,
                $pubmedSourceResult,
                (float) ($sourceFetchStartedAt['pubmed'] ?? microtime(true)),
                $progressCallback,
                $sourceProgressContexts['pubmed'],
                [
                    'db' => 'pubmed',
                    'term' => $pubmedQueryText,
                    'retmax' => muginPublicSearchGetSemanticSourceLimit('pubmedBestMatch', 200),
                    'retstart' => 0,
                    'retmode' => 'json',
                    'sort' => 'relevance',
                ],
                muginPublicSearchMergeQueryOverrideRequestMeta(
                    $resolvedQueries,
                    'pubmed',
                    ['role' => 'pubmedBestMatchSource', 'limitStrategy' => 'multi-source']
                ),
                $sourceDetailContext
            );
        }
        if (in_array('semanticScholar', $selectedSources, true)) {
            $semanticScholarQueryText = (string) ($resolvedQueries['sourceQueryPlan']['semanticScholar']['query'] ?? '');
            $semanticScholarSourceResult = muginPublicSearchFetchSemanticScholarSourceResult(
                $semanticScholarQueryText,
                (array) ($resolvedQueries['sourceQueryPlan']['semanticScholar']['filters'] ?? []),
                (string) ($request['_clientSourceApiKeys']['semanticScholar'] ?? '')
            );
            $sourceResults[] = $semanticScholarSourceResult;
            muginPublicSearchProcessDetailsRecordSourceCompletion(
                $collector,
                'semanticScholar',
                $semanticScholarQueryText,
                $semanticScholarSourceResult,
                (float) ($sourceFetchStartedAt['semanticScholar'] ?? microtime(true)),
                $progressCallback,
                $sourceProgressContexts['semanticScholar'],
                array_merge(
                    [
                        'limit' => muginPublicSearchGetSemanticSourceLimit('semanticScholar', 400),
                        'domain' => $domain,
                        'searchMode' => 'semantic',
                    ],
                    (array) ($resolvedQueries['sourceQueryPlan']['semanticScholar']['filters'] ?? [])
                ),
                muginPublicSearchMergeQueryOverrideRequestMeta(
                    $resolvedQueries,
                    'semanticScholar',
                    ['searchMode' => 'semantic']
                ),
                $sourceDetailContext
            );
        }
        if (in_array('openAlex', $selectedSources, true)) {
            $openAlexQueryText = (string) ($resolvedQueries['sourceQueryPlan']['openAlex']['query'] ?? '');
            $openAlexSourceResult = muginPublicSearchFetchOpenAlexSourceResult(
                $openAlexQueryText,
                (array) ($resolvedQueries['sourceQueryPlan']['openAlex']['filters'] ?? []),
                $domain,
                (string) ($request['_clientSourceApiKeys']['openAlex'] ?? '')
            );
            $sourceResults[] = $openAlexSourceResult;
            muginPublicSearchProcessDetailsRecordSourceCompletion(
                $collector,
                'openAlex',
                $openAlexQueryText,
                $openAlexSourceResult,
                (float) ($sourceFetchStartedAt['openAlex'] ?? microtime(true)),
                $progressCallback,
                $sourceProgressContexts['openAlex'],
                [
                    'limit' => muginPublicSearchGetSemanticSourceLimit('openAlex', 50),
                    'domain' => $domain,
                    'languages' => (array) ($resolvedQueries['sourceQueryPlan']['openAlex']['filters']['language'] ?? []),
                    'sourceTypes' => (array) ($resolvedQueries['sourceQueryPlan']['openAlex']['filters']['sourceType'] ?? []),
                    'workTypes' => (array) ($resolvedQueries['sourceQueryPlan']['openAlex']['filters']['workType'] ?? []),
                    'publicationYear' => (string) ($resolvedQueries['sourceQueryPlan']['openAlex']['filters']['publicationYear'] ?? ''),
                    'isOa' => !empty($resolvedQueries['sourceQueryPlan']['openAlex']['filters']['isOa']),
                    'searchMode' => 'semantic',
                ],
                muginPublicSearchMergeQueryOverrideRequestMeta(
                    $resolvedQueries,
                    'openAlex',
                    isset($openAlexSourceResult['requestMeta']) && is_array($openAlexSourceResult['requestMeta'])
                        ? $openAlexSourceResult['requestMeta']
                        : ['searchMode' => 'semantic']
                ),
                $sourceDetailContext
            );
        }
        if (in_array('elicit', $selectedSources, true)) {
            $elicitQueryText = (string) ($resolvedQueries['sourceQueryPlan']['elicit']['query'] ?? '');
            $elicitSourceResult = muginPublicSearchFetchElicitSourceResult(
                $elicitQueryText,
                (array) ($resolvedQueries['sourceQueryPlan']['elicit']['filters'] ?? []),
                (string) ($request['_clientSourceApiKeys']['elicit'] ?? '')
            );
            $sourceResults[] = $elicitSourceResult;
            muginPublicSearchProcessDetailsRecordSourceCompletion(
                $collector,
                'elicit',
                $elicitQueryText,
                $elicitSourceResult,
                (float) ($sourceFetchStartedAt['elicit'] ?? microtime(true)),
                $progressCallback,
                $sourceProgressContexts['elicit'],
                [
                    'limit' => muginPublicSearchGetSemanticSourceLimit('elicit', 100),
                    'domain' => $domain,
                    'filters' => (array) ($resolvedQueries['sourceQueryPlan']['elicit']['filters'] ?? []),
                    'corpus' => 'elicit',
                    'searchMode' => 'semantic',
                ],
                muginPublicSearchMergeQueryOverrideRequestMeta(
                    $resolvedQueries,
                    'elicit',
                    ['searchMode' => 'semantic']
                ),
                $sourceDetailContext
            );
        }

        $successfulSourceCount = 0;
        foreach ($sourceResults as $sourceResult) {
            if (!empty($sourceResult['candidates'])) {
                $successfulSourceCount++;
            }
            if (trim((string) ($sourceResult['warning'] ?? '')) !== '') {
                $warnings[] = trim((string) $sourceResult['warning']);
            }
            if (trim((string) ($sourceResult['error'] ?? '')) !== '') {
                $warnings[] = trim((string) $sourceResult['error']);
            }
        }
        if ($successfulSourceCount === 0) {
            // De praecise underliggende fejl/advarsler er allerede samlet i
            // $warnings herover. De inkluderes her i selve exception-beskeden,
            // saa den reelle aarsag (fx en upstream-fejl eller "0 kandidater
            // havde et PMID/DOI") ikke gaar tabt, naar exception'en fanges i
            // public-api/v1/search.php og bliver til det endelige 502-svar.
            $failureDetail = !empty($warnings) ? ' (' . implode(' | ', array_unique($warnings)) . ')' : '';
            throw new RuntimeException(
                'All selected search sources failed or returned no candidates' . $failureDetail,
                502
            );
        }

        // Rerank preparation includes the optional lexical rescue because its
        // candidates feed the same rerank pool. Start the timer before that
        // work so there is no unmeasured pause after source retrieval.
        muginPublicSearchEmitProgress($progressCallback, 'rerank', '', [
            'stepId' => 'rerank',
            'groupId' => 'match',
            'groupKey' => 'semanticSearchProcessGroupMatch',
            'messageKey' => muginPublicSearchRerankProgressMessageKey($request),
        ]);

        // Lexical rescue (ported from DropdownWrapper.vue's shouldRunPubMedLexicalRescue()
        // / fetchPubMedLexicalRescueResult()): when PubMed is selected but the
        // OTHER selected sources returned a sparse candidate set, run one
        // extra PubMed search (excluding PMIDs already found) and keep only
        // lexically-relevant hits. Only run for the unified engine - the
        // legacy engine never had this capability, so gating it here keeps
        // that path's behavior completely unchanged.
        $semanticRescueMeta = [
            'triggered' => false,
            'triggerReason' => 'not-evaluated',
            'pubmedQuery' => (string) ($resolvedQueries['pubmedQuery'] ?? ''),
        ];
        if (muginPublicSearchIsUnifiedSearchEngineEnabled()) {
            $pubmedIsSelected = in_array('pubmed', (array) $request['sources'], true);
            $rescueDecision = muginPublicSearchShouldRunPubMedLexicalRescue($sourceResults, (string) ($resolvedQueries['pubmedQuery'] ?? ''), $pubmedIsSelected);
            $semanticRescueMeta['triggerReason'] = (string) ($rescueDecision['reason'] ?? '');
            if ($rescueDecision['shouldRun']) {
                try {
                    $rescueResult = muginPublicSearchFetchPubMedLexicalRescueResult(
                        (string) ($resolvedQueries['semanticIntent'] ?? ''),
                        (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                        $sourceResults,
                        (string) $rescueDecision['reason'],
                        $domain
                    );
                    if (!empty($rescueResult['candidates'])) {
                        $sourceResults[] = $rescueResult;
                        $semanticRescueMeta['triggered'] = true;
                        $semanticRescueMeta['candidateCount'] = count($rescueResult['candidates']);
                    }
                } catch (Throwable $exception) {
                    // Fail soft: lexical rescue is a supplementary enrichment
                    // step, not a hard dependency of the search.
                    $warnings[] = 'PubMed lexical rescue failed: ' . $exception->getMessage();
                }
            }
        }

        $reranked = muginPublicSearchIsUnifiedSearchEngineEnabled()
            ? muginPublicSearchRerankSemanticCandidatesUnified($sourceResults, (string) ($request['focus'] ?? ''), $domain, [
                'queryIntent' => $resolvedQueries['queryIntent'] ?? [],
                'semanticRescueMeta' => $semanticRescueMeta,
            ])
            : muginPublicSearchRerankSemanticCandidates($sourceResults, (string) ($request['focus'] ?? ''));
        $orderedCandidates = (array) ($reranked['candidates'] ?? []);
        $diagnostics['rerank'] = $reranked['diagnostics'] ?? [];
        // Fold the former near-instant finalizeCollect step into rerank.
        $candidateBuckets = muginPublicSearchProcessDetailsCountCandidateIdentityBuckets($orderedCandidates);
        if ($collector !== null) {
            muginPublicSearchProcessDetailsSetStep($collector, 'rerank', array_merge(
                (array) $diagnostics['rerank'],
                $candidateBuckets,
                ['hardFilterQuery' => (string) ($resolvedQueries['hardFilterQuery'] ?? '')]
            ));
            muginPublicSearchProcessDetailsEmitStep($collector, 'rerank', $progressCallback, true);
        }
        $hybridOrdering = muginPublicSearchBuildHybridOrderedResultRefs(
            (string) ($resolvedQueries['hardFilterQuery'] ?? ''),
            $orderedCandidates,
            $sortMethod,
            (array) ($request['hardFilters'] ?? []),
            $domain,
            $progressCallback,
            (array) ($resolvedQueries['postValidationRuleState'] ?? []),
            $collector,
            (string) ($request['responseOptions']['language'] ?? 'da')
        );
        $warnings = muginPublicSearchDedupeStrings(array_merge($warnings, (array) ($hybridOrdering['warnings'] ?? [])));
        $resultRefs = (array) ($hybridOrdering['refs'] ?? []);
        $totalCount = count($resultRefs);
        if ($collector !== null) {
            $validationDiagnostics = (array) ($hybridOrdering['diagnostics'] ?? []);
            $pmidValidation = (array) ($validationDiagnostics['pmidValidation'] ?? []);
            $candidateKeyDiagnostics = (array) ($validationDiagnostics['candidateKeys'] ?? []);
            $hardFilterQuery = (string) ($resolvedQueries['hardFilterQuery'] ?? '');
            $validationQuery = (string) ($hybridOrdering['validationQuery'] ?? '');
            muginPublicSearchProcessDetailsSetStep($collector, 'finalizeValidatePmid', [
                'role' => 'pubmedPmidValidation',
                'orderedPmidCount' => (int) ($pmidValidation['requestedCount'] ?? 0),
                'hardFilterQuery' => $hardFilterQuery,
                'validationMode' => $hardFilterQuery !== ''
                    ? 'hard-filter-and-candidate-whitelist'
                    : 'candidate-whitelist-only',
                'matchedByPubMedCount' => (int) ($pmidValidation['matchedCount'] ?? 0),
                'orderedMatchedCount' => (int) ($pmidValidation['matchedCount'] ?? 0),
                'unmatchedCandidateCount' => (int) ($pmidValidation['unmatchedCount'] ?? 0),
                'request' => [
                    'db' => 'pubmed',
                    'retmode' => 'json',
                    'term' => $validationQuery,
                    'retmax' => (int) ($pmidValidation['requestedCount'] ?? 0),
                    'retstart' => 0,
                    'sort' => (string) ($pmidValidation['sortMethod'] ?? $sortMethod),
                ],
            ]);
            if ((int) ($pmidValidation['requestedCount'] ?? 0) <= 0) {
                // No PMID validation work started inside the hybrid builder.
                muginPublicSearchProcessDetailsEmitStep(
                    $collector,
                    'finalizeValidatePmid',
                    $progressCallback,
                    true
                );
            }
            if (!empty($candidateKeyDiagnostics)) {
                muginPublicSearchProcessDetailsSetStep($collector, 'finalizeValidateDoiFetch', [
                    'endpoint' => (string) ($candidateKeyDiagnostics['endpoint'] ?? 'OpenAlex work lookup'),
                    'candidateCount' => (int) ($candidateKeyDiagnostics['candidateCount'] ?? 0),
                    'trustedPmidSkippedCount' => (int) ($candidateKeyDiagnostics['trustedPmidSkippedCount']
                        ?? ($candidateKeyDiagnostics['pmidCandidateCount'] ?? 0)),
                    'doiCandidateCount' => (int) ($candidateKeyDiagnostics['doiCandidateCount'] ?? 0),
                    'openAlexIdCandidateCount' => (int) ($candidateKeyDiagnostics['openAlexIdCandidateCount']
                        ?? ($candidateKeyDiagnostics['doiCandidateCount'] ?? 0)),
                    'hydratedCount' => (int) ($candidateKeyDiagnostics['hydratedCount']
                        ?? ($candidateKeyDiagnostics['doiHydratedCount'] ?? 0)),
                    'openAlexMissingCount' => (int) ($candidateKeyDiagnostics['openAlexMissingCount'] ?? 0),
                    'blockingValidationCount' => (int) ($candidateKeyDiagnostics['blockingValidationCount'] ?? 0),
                    'deferredValidationCount' => (int) ($candidateKeyDiagnostics['deferredValidationCount'] ?? 0),
                    'domain' => (string) ($candidateKeyDiagnostics['domain'] ?? $domain),
                    'lookupRequests' => array_values((array) ($candidateKeyDiagnostics['lookupRequests'] ?? [])),
                    'semanticScholarFallbackCount' => (int) ($candidateKeyDiagnostics['semanticScholarFallbackCount'] ?? 0),
                    'backgroundValidationCompleted' => ($candidateKeyDiagnostics['backgroundValidationCompleted'] ?? false) === true,
                    'backgroundValidatedCount' => (int) ($candidateKeyDiagnostics['backgroundValidatedCount'] ?? 0),
                    'validationWarning' => (int) ($candidateKeyDiagnostics['openAlexMissingCount'] ?? 0) > 0
                        ? [
                            'status' => 'warning',
                            'missingCount' => (int) $candidateKeyDiagnostics['openAlexMissingCount'],
                            'messageKey' => 'semanticSearchProgressDoiHydrationWarning',
                            'message' => muginPublicSearchGetFrontendTranslation(
                                'semanticSearchProgressDoiHydrationWarning',
                                (($request['responseOptions']['language'] ?? 'da') === 'en') ? 'en' : 'dk',
                                'Some external results could not be validated via OpenAlex.'
                            ),
                        ]
                        : null,
                ]);
                muginPublicSearchProcessDetailsMergeStep($collector, 'finalizeValidateDoiFetch', [
                    'activeRules' => array_values((array) ($candidateKeyDiagnostics['activeRules'] ?? [])),
                    'ruleGroups' => array_values((array) ($candidateKeyDiagnostics['ruleGroups'] ?? [])),
                    'publicationDateYears' => array_values((array) ($candidateKeyDiagnostics['publicationDateYears'] ?? [])),
                    'validatedCount' => (int) ($candidateKeyDiagnostics['validatedCount']
                        ?? ($candidateKeyDiagnostics['doiCandidateCount'] ?? 0)),
                    'allowedCount' => (int) ($candidateKeyDiagnostics['allowedCount'] ?? 0),
                    'excludedCount' => (int) ($candidateKeyDiagnostics['excludedCount']
                        ?? ($candidateKeyDiagnostics['doiRejectedByFilterCount'] ?? 0)),
                    'excludedExamples' => array_values((array) ($candidateKeyDiagnostics['excludedExamples'] ?? [])),
                ]);
                if ((int) ($candidateKeyDiagnostics['doiCandidateCount'] ?? 0) <= 0) {
                    muginPublicSearchProcessDetailsEmitStep(
                        $collector,
                        'finalizeValidateDoiFetch',
                        $progressCallback,
                        true
                    );
                }
            }
        }

        if ($pipelineCacheTtl > 0) {
            muginPublicSearchWriteCacheValue(
                'search-pipeline',
                $pipelineCacheKey,
                [
                    'resolvedQueries' => muginPublicSearchStripResolvedQueriesForPipelineCache($resolvedQueries),
                    'resultRefs' => array_values($resultRefs),
                    'orderedCandidates' => array_values($orderedCandidates),
                    'hybridOrdering' => [
                        'pmids' => array_values((array) ($hybridOrdering['pmids'] ?? [])),
                        'refs' => array_values($resultRefs),
                    ],
                    'warnings' => array_values($warnings),
                    'diagnostics' => $diagnostics,
                    'totalCount' => $totalCount,
                ],
                $pipelineCacheTtl
            );
        }

        mugin_public_search_hydrate_page:
        $candidateByKey = [];
        foreach ($orderedCandidates as $candidate) {
            $pmid = muginPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = muginPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            $key = $pmid !== '' ? 'pmid:' . $pmid : ($doi !== '' ? 'doi:' . strtolower($doi) : '');
            if ($key !== '') {
                $candidateByKey[$key] = $candidate;
            }
        }

        $refsToHydrate = muginPublicSearchShouldUseSemanticDateOrdering($sortMethod)
            ? $resultRefs
            : array_slice($resultRefs, $pageOffset, $pageSize);

        $pmidsToHydrate = [];
        $doiRefs = [];
        foreach ($refsToHydrate as $ref) {
            if (($ref['type'] ?? '') === 'pmid') {
                $pmidsToHydrate[] = (string) ($ref['pmid'] ?? '');
            } elseif (($ref['type'] ?? '') === 'doi') {
                $doiRefs[] = $ref;
            }
        }

        $hydrateMessageKey = 'semanticSearchProgressFinalizeHydrate';
        if (!empty($pmidsToHydrate) && !empty($doiRefs)) {
            $hydrateMessageKey = 'semanticSearchProgressFinalizeHydrateMixed';
        } elseif (!empty($pmidsToHydrate)) {
            $hydrateMessageKey = 'semanticSearchProgressFinalizeHydratePubMed';
        } elseif (!empty($doiRefs)) {
            $hydrateMessageKey = 'semanticSearchProgressFinalizeHydrateOpenAlex';
        }
        muginPublicSearchEmitProgress($progressCallback, 'finalizeHydrate', '', [
            'stepId' => 'finalizeHydrate',
            'groupId' => 'finalizeHydrate',
            'groupKey' => 'semanticSearchProcessGroupDisplay',
            'messageKey' => $hydrateMessageKey,
        ]);
        if ($collector !== null) {
            $hydrateDois = array_values(array_filter(array_map(
                static fn($ref) => trim((string) ($ref['doi'] ?? ($ref['candidate']['doi'] ?? ''))),
                $doiRefs
            )));
            // Store the in-progress hydrate shape for the final export, but do not
            // stream it yet — streaming an incomplete payload would let the UI
            // mark the step completed before hydratedCount/missingCount exist.
            muginPublicSearchProcessDetailsSetStep($collector, 'finalizeHydrate', [
                'role' => 'unifiedEngineHydration',
                'requestedCount' => count($refsToHydrate),
                'pmidCount' => count($pmidsToHydrate),
                'externalReferenceCount' => count($doiRefs),
                'hydratedCount' => 0,
                'missingCount' => 0,
                'lookupRequests' => !empty($hydrateDois)
                    ? [[
                        'endpoint' => 'OpenAlex work lookup',
                        'parameter' => 'dois',
                        'count' => count($hydrateDois),
                        'values' => array_slice($hydrateDois, 0, 25),
                        'truncated' => count($hydrateDois) > 25,
                        'domain' => $domain,
                    ]]
                    : [],
                'openAlexMissingCount' => 0,
            ]);
        }
        $summaryMap = muginPublicSearchFetchPubMedSummaryRecords($pmidsToHydrate, $domain);
        $abstractMap = ($request['responseOptions']['includeAbstracts'] ?? true) === true
            ? muginPublicSearchFetchPubMedAbstractMap($pmidsToHydrate, $domain)
            : [];
        $doiWorkMap = [];
        $doiEntriesNeedingFetch = [];
        foreach ($doiRefs as $ref) {
            $key = (string) ($ref['key'] ?? '');
            $hydratedWork = isset($ref['hydratedWork']) && is_array($ref['hydratedWork']) ? $ref['hydratedWork'] : null;
            if (is_array($hydratedWork)) {
                $doiWorkMap[$key] = $hydratedWork;
                continue;
            }
            $candidate = isset($ref['candidate']) && is_array($ref['candidate']) ? $ref['candidate'] : [];
            $doiEntriesNeedingFetch[] = [
                'key' => $key,
                'candidate' => $candidate,
                'doi' => muginPublicSearchNormalizeDoi($candidate['doi'] ?? ($ref['doi'] ?? '')),
                'openAlexId' => trim((string) ($candidate['openAlexId'] ?? '')),
            ];
        }
        if (!empty($doiEntriesNeedingFetch)) {
            foreach (muginPublicSearchFetchOpenAlexWorksByCandidatesParallel($doiEntriesNeedingFetch, $domain) as $key => $work) {
                if (is_array($work)) {
                    $doiWorkMap[$key] = $work;
                }
            }
        }

        $results = [];
        foreach ($refsToHydrate as $localIndex => $ref) {
            $key = (string) ($ref['key'] ?? '');
            $rank = $pageOffset + $localIndex + 1;
            $candidateInfo = isset($candidateByKey[$key]) && is_array($candidateByKey[$key]) ? $candidateByKey[$key] : [];
            if (($ref['type'] ?? '') === 'pmid') {
                $pmid = (string) ($ref['pmid'] ?? '');
                if (!isset($summaryMap[$pmid])) {
                    continue;
                }
                $trusted = in_array($pmid, (array) ($hybridOrdering['pmids'] ?? []), true);
                $results[] = muginPublicSearchBuildApiResultFromPubMed(
                    $summaryMap[$pmid],
                    $abstractMap[$pmid]['abstract'] ?? '',
                    $rank,
                    $candidateInfo,
                    $trusted,
                    $abstractMap[$pmid]['mesh'] ?? [],
                    $abstractMap[$pmid]['abstractSections'] ?? [],
                    $abstractMap[$pmid]['authors'] ?? [],
                    $abstractMap[$pmid]['keywords'] ?? []
                );
            } elseif (isset($doiWorkMap[$key])) {
                $results[] = muginPublicSearchBuildApiResultFromOpenAlex($doiWorkMap[$key], $rank, $candidateInfo);
            }
        }

        if ($collector !== null) {
            $hydratedCount = count($results);
            $requestedCount = count($refsToHydrate);
            muginPublicSearchProcessDetailsMergeStep($collector, 'finalizeHydrate', [
                'hydratedCount' => $hydratedCount,
                'missingCount' => max(0, $requestedCount - $hydratedCount),
                'openAlexMissingCount' => max(0, count($doiRefs) - count($doiWorkMap)),
            ]);
            // Hydration is complete here; sorting and final reranking are
            // separate steps and must not inflate its wall-clock duration.
            muginPublicSearchProcessDetailsEmitStep($collector, 'finalizeHydrate', $progressCallback, true);
        }

        if (muginPublicSearchShouldUseSemanticDateOrdering($sortMethod)) {
            muginPublicSearchEmitProgress($progressCallback, 'finalizeSort', '', [
                'stepId' => 'finalizeSort',
                'groupId' => 'finalizeHydrate',
                'groupKey' => 'semanticSearchProcessGroupDisplay',
                'messageKey' => 'semanticSearchProgressFinalizeSort',
            ]);
            $results = muginPublicSearchSortResultsByDate($results, $sortMethod);
            $totalCount = count($results);
            $results = array_slice($results, $pageOffset, $pageSize);
            foreach ($results as $index => &$result) {
                $result['rank'] = $pageOffset + $index + 1;
            }
            unset($result);
            if ($collector !== null) {
                muginPublicSearchProcessDetailsSetStep($collector, 'finalizeSort', [
                    'sortMethod' => $sortMethod,
                    'inputCount' => $totalCount,
                    'outputCount' => count($results),
                ]);
                muginPublicSearchProcessDetailsEmitStep($collector, 'finalizeSort', $progressCallback, true);
            }
        }

        if (muginPublicSearchShouldApplySemanticLlmFinalRerank($request, $results)) {
            muginPublicSearchEmitProgress($progressCallback, 'finalRerank', '', [
                'stepId' => 'finalRerank',
                'groupId' => 'finalizeHydrate',
                'groupKey' => 'semanticSearchProcessGroupDisplay',
                'messageKey' => 'semanticSearchProgressFinalRerank',
            ]);
            $finalRerankResult = muginPublicSearchMaybeApplySemanticLlmFinalRerank($results, $request, $resolvedQueries, $domain);
            $results = $finalRerankResult['results'];
            $diagnostics['finalRerank'] = $finalRerankResult['detail'] ?? [];
            if ($collector !== null) {
                muginPublicSearchProcessDetailsSetStep($collector, 'finalRerank', array_merge(
                    (array) $diagnostics['finalRerank'],
                    [
                        'renderedCount' => count($results),
                        'totalCount' => $totalCount,
                        'page' => $pageNumber,
                        'pageSize' => $pageSize,
                    ]
                ));
                muginPublicSearchProcessDetailsEmitStep($collector, 'finalRerank', $progressCallback, true);
            }
        }
        foreach ($results as $index => &$result) {
            $result['rank'] = $pageOffset + $index + 1;
        }
        unset($result);

        $response = muginPublicSearchBuildFinalResponse(
            $request,
            $resolvedQueries,
            $results,
            $totalCount,
            count($warnings) > 0,
            $warnings,
            muginPublicSearchShouldUseSemanticDateOrdering($sortMethod) ? 'semantic_date_sort' : 'deterministic_hybrid',
            $config['matchesWebOrderingByDefault'],
            $diagnostics,
            $collector
        );
        if ($searchCacheTtl > 0) {
            muginPublicSearchWriteCacheValue('search-response', $searchCacheKey, $response, $searchCacheTtl);
        }
        return $response;
    }
}
