<?php
/**
 * Shared public search API helpers.
 */

if (!function_exists('qpmPublicSearchBoolValue')) {
    /**
     * @param mixed $value
     * @param bool $default
     * @return bool
     */
    function qpmPublicSearchBoolValue($value, bool $default = false): bool
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

if (!function_exists('qpmPublicSearchNormalizeString')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeString($value): string
    {
        return trim((string) $value);
    }
}

if (!function_exists('qpmPublicSearchNormalizeResponseLanguage')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeResponseLanguage($value): string
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

if (!function_exists('qpmPublicSearchSafeJsonEncode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchSafeJsonEncode($value): string
    {
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return is_string($encoded) ? $encoded : '{}';
    }
}

if (!function_exists('qpmPublicSearchSafePrettyJsonEncode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchSafePrettyJsonEncode($value): string
    {
        $encoded = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        return is_string($encoded) ? $encoded : '{}';
    }
}

if (!function_exists('qpmPublicSearchNormalizePmid')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizePmid($value): string
    {
        $pmid = trim((string) $value);
        return preg_match('/^[0-9]+$/', $pmid) === 1 ? $pmid : '';
    }
}

if (!function_exists('qpmPublicSearchNormalizeDoi')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeDoi($value): string
    {
        $normalized = trim((string) $value);
        if ($normalized === '') {
            return '';
        }
        $normalized = preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $normalized);
        $normalized = preg_replace('~^doi:\s*~i', '', (string) $normalized);
        return trim((string) $normalized);
    }
}

if (!function_exists('qpmPublicSearchDedupeStrings')) {
    /**
     * @param array<int,mixed> $values
     * @param callable|null $normalizer
     * @return array<int,string>
     */
    function qpmPublicSearchDedupeStrings(array $values, ?callable $normalizer = null): array
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

if (!function_exists('qpmPublicSearchGetConfig')) {
    /**
     * @return array<string,mixed>
     */
    function qpmPublicSearchGetConfig(): array
    {
        $config = defined('NEMPUBMED_PUBLIC_API') && is_array(NEMPUBMED_PUBLIC_API)
            ? NEMPUBMED_PUBLIC_API
            : [];

        return [
            'basePath' => defined('NEMPUBMED_PUBLIC_API_BASE_PATH')
                ? trim((string) NEMPUBMED_PUBLIC_API_BASE_PATH)
                : trim((string) ($config['basePath'] ?? '/v1')),
            'docroot' => defined('NEMPUBMED_PUBLIC_API_DOCROOT')
                ? trim((string) NEMPUBMED_PUBLIC_API_DOCROOT)
                : trim((string) ($config['docroot'] ?? 'public-api')),
            'defaultPageSize' => max(1, (int) ($config['defaultPageSize'] ?? 25)),
            'maxPageSize' => max(1, (int) ($config['maxPageSize'] ?? 100)),
            'includeAbstractsByDefault' => qpmPublicSearchBoolValue($config['includeAbstractsByDefault'] ?? true, true),
            'includeResolvedQueriesByDefault' => qpmPublicSearchBoolValue(
                $config['includeResolvedQueriesByDefault'] ?? true,
                true
            ),
            'includeDiagnosticsByDefault' => qpmPublicSearchBoolValue(
                $config['includeDiagnosticsByDefault'] ?? false,
                false
            ),
            'getSearchEnabled' => defined('NEMPUBMED_PUBLIC_API_GET_SEARCH_ENABLED')
                ? qpmPublicSearchBoolValue(NEMPUBMED_PUBLIC_API_GET_SEARCH_ENABLED, false)
                : qpmPublicSearchBoolValue($config['getSearchEnabled'] ?? false, false),
            'urlApiKeyEnabled' => defined('NEMPUBMED_PUBLIC_API_URL_API_KEY_ENABLED')
                ? qpmPublicSearchBoolValue(NEMPUBMED_PUBLIC_API_URL_API_KEY_ENABLED, false)
                : qpmPublicSearchBoolValue($config['urlApiKeyEnabled'] ?? false, false),
            'urlApiKeyMode' => defined('NEMPUBMED_PUBLIC_API_URL_API_KEY_MODE')
                ? trim((string) NEMPUBMED_PUBLIC_API_URL_API_KEY_MODE)
                : trim((string) ($config['urlApiKeyMode'] ?? 'configurable')),
            'urlApiKeyDefaultDisabled' => defined('NEMPUBMED_PUBLIC_API_URL_API_KEY_DEFAULT_DISABLED')
                ? qpmPublicSearchBoolValue(NEMPUBMED_PUBLIC_API_URL_API_KEY_DEFAULT_DISABLED, true)
                : qpmPublicSearchBoolValue($config['urlApiKeyDefaultDisabled'] ?? true, true),
            'responseCachePolicy' => defined('NEMPUBMED_PUBLIC_API_RESPONSE_CACHE_POLICY')
                ? trim((string) NEMPUBMED_PUBLIC_API_RESPONSE_CACHE_POLICY)
                : trim((string) ($config['responseCachePolicy'] ?? 'no-store')),
            'searchResultCacheTtlSeconds' => max(0, (int) ($config['searchResultCacheTtlSeconds'] ?? 60)),
            'hydrationCacheTtlSeconds' => max(0, (int) ($config['hydrationCacheTtlSeconds'] ?? 1800)),
            'concurrentSearchLimit' => max(1, (int) ($config['concurrentSearchLimit'] ?? 10)),
            'busyRetryAfterSeconds' => max(1, (int) ($config['busyRetryAfterSeconds'] ?? 120)),
            'searchSlotTtlSeconds' => max(60, (int) ($config['searchSlotTtlSeconds'] ?? 900)),
            'getRateLimit' => defined('NEMPUBMED_PUBLIC_API_GET_RATE_LIMIT')
                ? max(1, (int) NEMPUBMED_PUBLIC_API_GET_RATE_LIMIT)
                : max(1, (int) ($config['getRateLimit'] ?? 15)),
            'postRateLimit' => max(1, (int) ($config['postRateLimit'] ?? 60)),
            'auditEnabled' => defined('NEMPUBMED_AUDIT') && is_array(NEMPUBMED_AUDIT)
                ? qpmPublicSearchBoolValue(NEMPUBMED_AUDIT['enabled'] ?? true, true)
                : qpmPublicSearchBoolValue($config['auditEnabled'] ?? true, true),
            'auditRetentionDays' => defined('NEMPUBMED_AUDIT') && is_array(NEMPUBMED_AUDIT)
                ? max(1, (int) (NEMPUBMED_AUDIT['retentionDays'] ?? 30))
                : max(1, (int) ($config['auditRetentionDays'] ?? 30)),
            'matchesWebOrderingByDefault' => qpmPublicSearchBoolValue(
                $config['matchesWebOrderingByDefault'] ?? false,
                false
            ),
        ];
    }
}

if (!function_exists('qpmPublicSearchGetClients')) {
    /**
     * @return array<string,array<string,mixed>>
     */
    function qpmPublicSearchGetClients(): array
    {
        return defined('NEMPUBMED_API_CLIENTS') && is_array(NEMPUBMED_API_CLIENTS)
            ? NEMPUBMED_API_CLIENTS
            : [];
    }
}

if (!function_exists('qpmPublicSearchApplyNoStoreHeaders')) {
    /**
     * @return void
     */
    function qpmPublicSearchApplyNoStoreHeaders(): void
    {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
}

if (!function_exists('qpmPublicSearchRespondJson')) {
    /**
     * @param int $status
     * @param array<string,mixed> $payload
     * @return never
     */
    function qpmPublicSearchRespondJson(int $status, array $payload): void
    {
        qpmPublicSearchApplyNoStoreHeaders();
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($status);
        echo qpmPublicSearchSafeJsonEncode($payload);
        exit;
    }
}

if (!function_exists('qpmPublicSearchMaskApiKey')) {
    /**
     * @param string $apiKey
     * @return string
     */
    function qpmPublicSearchMaskApiKey(string $apiKey): string
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

if (!function_exists('qpmPublicSearchGetRuntimeDir')) {
    /**
     * @return string
     */
    function qpmPublicSearchGetRuntimeDir(): string
    {
        return dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'runtime';
    }
}

if (!function_exists('qpmPublicSearchEnsureRuntimeDir')) {
    /**
     * @return string
     */
    function qpmPublicSearchEnsureRuntimeDir(): string
    {
        $dir = qpmPublicSearchGetRuntimeDir();
        if (!is_dir($dir)) {
            @mkdir($dir, 0750, true);
        }
        return $dir;
    }
}

if (!function_exists('qpmPublicSearchApplyRetryAfterHeader')) {
    /**
     * @param int $seconds
     * @return void
     */
    function qpmPublicSearchApplyRetryAfterHeader(int $seconds): void
    {
        header('Retry-After: ' . (string) max(1, $seconds));
    }
}

if (!function_exists('qpmPublicSearchBuildCacheFilePath')) {
    /**
     * @param string $namespace
     * @param string $cacheKey
     * @return string
     */
    function qpmPublicSearchBuildCacheFilePath(string $namespace, string $cacheKey): string
    {
        $normalizedNamespace = preg_replace('/[^a-z0-9_-]+/i', '-', trim($namespace));
        $normalizedNamespace = is_string($normalizedNamespace) && $normalizedNamespace !== ''
            ? $normalizedNamespace
            : 'default';
        return qpmPublicSearchEnsureRuntimeDir()
            . DIRECTORY_SEPARATOR
            . 'public-search-cache-'
            . $normalizedNamespace
            . '-'
            . sha1($cacheKey)
            . '.bin';
    }
}

if (!function_exists('qpmPublicSearchMaybeCleanupCacheNamespace')) {
    /**
     * @param string $namespace
     * @return void
     */
    function qpmPublicSearchMaybeCleanupCacheNamespace(string $namespace): void
    {
        if (mt_rand(1, 200) !== 1) {
            return;
        }
        $normalizedNamespace = preg_replace('/[^a-z0-9_-]+/i', '-', trim($namespace));
        $normalizedNamespace = is_string($normalizedNamespace) && $normalizedNamespace !== ''
            ? $normalizedNamespace
            : 'default';
        $pattern = qpmPublicSearchEnsureRuntimeDir()
            . DIRECTORY_SEPARATOR
            . 'public-search-cache-'
            . $normalizedNamespace
            . '-*.bin';
        foreach (glob($pattern) ?: [] as $path) {
            if (!is_file($path)) {
                continue;
            }
            $raw = @file_get_contents($path);
            $payload = is_string($raw) && $raw !== ''
                ? @unserialize($raw, ['allowed_classes' => [stdClass::class]])
                : false;
            if (!is_array($payload) || (int) ($payload['expiresAt'] ?? 0) < time()) {
                @unlink($path);
            }
        }
    }
}

if (!function_exists('qpmPublicSearchReadCacheValue')) {
    /**
     * @param string $namespace
     * @param string $cacheKey
     * @return array{hit: bool, value: mixed}
     */
    function qpmPublicSearchReadCacheValue(string $namespace, string $cacheKey): array
    {
        $path = qpmPublicSearchBuildCacheFilePath($namespace, $cacheKey);
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

if (!function_exists('qpmPublicSearchWriteCacheValue')) {
    /**
     * @param string $namespace
     * @param string $cacheKey
     * @param mixed $value
     * @param int $ttlSeconds
     * @return void
     */
    function qpmPublicSearchWriteCacheValue(string $namespace, string $cacheKey, $value, int $ttlSeconds): void
    {
        if ($ttlSeconds <= 0) {
            return;
        }
        $path = qpmPublicSearchBuildCacheFilePath($namespace, $cacheKey);
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
            @unlink($tmpPath);
            return;
        }
        qpmPublicSearchMaybeCleanupCacheNamespace($namespace);
    }
}

if (!function_exists('qpmPublicSearchBuildExecutionSlotPath')) {
    /**
     * @param string $token
     * @return string
     */
    function qpmPublicSearchBuildExecutionSlotPath(string $token): string
    {
        return qpmPublicSearchEnsureRuntimeDir()
            . DIRECTORY_SEPARATOR
            . 'public-search-active-search-'
            . preg_replace('/[^a-z0-9_-]+/i', '-', trim($token))
            . '.lock';
    }
}

if (!function_exists('qpmPublicSearchAcquireExecutionSlot')) {
    /**
     * @param int $limit
     * @return array<string,mixed>
     */
    function qpmPublicSearchAcquireExecutionSlot(int $limit): array
    {
        $config = qpmPublicSearchGetConfig();
        $ttlSeconds = max(60, (int) ($config['searchSlotTtlSeconds'] ?? 900));
        $lockPath = qpmPublicSearchEnsureRuntimeDir() . DIRECTORY_SEPARATOR . 'public-search-active-search.lock';
        $fp = @fopen($lockPath, 'c+');
        if ($fp === false) {
            return [
                'token' => '',
                'path' => '',
            ];
        }
        try {
            if (!flock($fp, LOCK_EX)) {
                return [
                    'token' => '',
                    'path' => '',
                ];
            }
            $now = time();
            $pattern = qpmPublicSearchEnsureRuntimeDir() . DIRECTORY_SEPARATOR . 'public-search-active-search-*.lock';
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
            $path = qpmPublicSearchBuildExecutionSlotPath($token);
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

if (!function_exists('qpmPublicSearchRefreshExecutionSlot')) {
    /**
     * @param array<string,mixed>|null $slot
     * @return void
     */
    function qpmPublicSearchRefreshExecutionSlot(?array $slot): void
    {
        $path = is_array($slot) ? trim((string) ($slot['path'] ?? '')) : '';
        if ($path !== '' && is_file($path)) {
            @touch($path);
        }
    }
}

if (!function_exists('qpmPublicSearchReleaseExecutionSlot')) {
    /**
     * @param array<string,mixed>|null $slot
     * @return void
     */
    function qpmPublicSearchReleaseExecutionSlot(?array $slot): void
    {
        $path = is_array($slot) ? trim((string) ($slot['path'] ?? '')) : '';
        if ($path !== '' && is_file($path)) {
            @unlink($path);
        }
    }
}

if (!function_exists('qpmPublicSearchStartEventStream')) {
    /**
     * @return void
     */
    function qpmPublicSearchStartEventStream(): void
    {
        qpmPublicSearchApplyNoStoreHeaders();
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

if (!function_exists('qpmPublicSearchEmitSseEvent')) {
    /**
     * @param string $event
     * @param array<string,mixed> $payload
     * @return void
     */
    function qpmPublicSearchEmitSseEvent(string $event, array $payload): void
    {
        echo 'event: ' . trim($event) . "\n";
        $encoded = qpmPublicSearchSafePrettyJsonEncode($payload);
        foreach (preg_split("/\r\n|\r|\n/", $encoded) ?: [] as $line) {
            echo 'data: ' . $line . "\n";
        }
        echo "\n";
        @ob_flush();
        flush();
    }
}

if (!function_exists('qpmPublicSearchEmitProgress')) {
    /**
     * @param callable|null $progressCallback
     * @param string $stage
     * @param string $message
     * @param array<string,mixed> $context
     * @return void
     */
    function qpmPublicSearchEmitProgress(?callable $progressCallback, string $stage, string $message, array $context = []): void
    {
        if ($progressCallback === null) {
            return;
        }
        $progressCallback($stage, $message, $context);
    }
}

if (!function_exists('qpmPublicSearchDecodeJsQuotedString')) {
    /**
     * @param string $value
     * @return string
     */
    function qpmPublicSearchDecodeJsQuotedString(string $value): string
    {
        $decoded = json_decode('"' . $value . '"', true);
        return is_string($decoded) ? $decoded : stripcslashes($value);
    }
}

if (!function_exists('qpmPublicSearchGetFrontendTranslationMap')) {
    /**
     * @return array<string,array<string,string>>
     */
    function qpmPublicSearchGetFrontendTranslationMap(): array
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
                'dk' => qpmPublicSearchDecodeJsQuotedString((string) ($match[2] ?? '')),
                'en' => qpmPublicSearchDecodeJsQuotedString((string) ($match[3] ?? '')),
            ];
        }

        return $map;
    }
}

if (!function_exists('qpmPublicSearchGetFrontendTranslation')) {
    /**
     * @param string $key
     * @param string $language
     * @param string $fallback
     * @return string
     */
    function qpmPublicSearchGetFrontendTranslation(string $key, string $language, string $fallback = ''): string
    {
        $map = qpmPublicSearchGetFrontendTranslationMap();
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

if (!function_exists('qpmPublicSearchResolveProgressLanguage')) {
    /**
     * @param array<string,mixed> $request
     * @return string
     */
    function qpmPublicSearchResolveProgressLanguage(array $request): string
    {
        $candidate = $request['responseOptions']['language'] ?? ($request['query']['language'] ?? 'da');
        return qpmPublicSearchNormalizeResponseLanguage($candidate);
    }
}

require_once __DIR__ . '/public-search-progress-texts.php';

if (!function_exists('qpmPublicSearchGetPublicProgressMessageCopy')) {
    /**
     * Slaar en messageKey/groupKey op i QPM_PUBLIC_SEARCH_PROGRESS_TEXTS
     * (backend/app/public-search-progress-texts.php), som er den samlede,
     * selvstaendige kilde til alle brugervenlige progress-tekster i det
     * offentlige API. Se den fil for selve teksterne.
     *
     * @param string $key
     * @return array{dk:string,en:string}|null
     */
    function qpmPublicSearchGetPublicProgressMessageCopy(string $key): ?array
    {
        $texts = defined('QPM_PUBLIC_SEARCH_PROGRESS_TEXTS') ? QPM_PUBLIC_SEARCH_PROGRESS_TEXTS : [];
        return $texts[$key] ?? null;
    }
}

if (!function_exists('qpmPublicSearchBuildStreamProgressPayload')) {
    /**
     * @param array<string,mixed> $request
     * @param string $stage
     * @param string $fallbackMessage
     * @param array<string,mixed> $context
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildStreamProgressPayload(
        array $request,
        string $stage,
        string $fallbackMessage = '',
        array $context = []
    ): array {
        $language = qpmPublicSearchResolveProgressLanguage($request);
        $frontendLanguage = $language === 'en' ? 'en' : 'dk';
        $messageKey = trim((string) ($context['messageKey'] ?? ''));
        $groupKey = trim((string) ($context['groupKey'] ?? ''));
        $stepId = trim((string) ($context['stepId'] ?? $stage));
        $groupId = trim((string) ($context['groupId'] ?? ''));
        $source = trim((string) ($context['source'] ?? ''));
        $publicMessageCopy = $messageKey !== '' ? qpmPublicSearchGetPublicProgressMessageCopy($messageKey) : null;
        if ($publicMessageCopy !== null) {
            $message = $publicMessageCopy[$frontendLanguage] ?? $publicMessageCopy['dk'];
        } elseif ($messageKey !== '') {
            $message = qpmPublicSearchGetFrontendTranslation($messageKey, $frontendLanguage, $fallbackMessage);
        } else {
            $message = trim($fallbackMessage);
        }
        $publicGroupCopy = $groupKey !== '' ? qpmPublicSearchGetPublicProgressMessageCopy($groupKey) : null;
        if ($publicGroupCopy !== null) {
            $groupLabel = $publicGroupCopy[$frontendLanguage] ?? $publicGroupCopy['dk'];
        } elseif ($groupKey !== '') {
            $groupLabel = qpmPublicSearchGetFrontendTranslation($groupKey, $frontendLanguage, '');
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

        return $payload;
    }
}

if (!function_exists('qpmPublicSearchAudit')) {
    /**
     * @param array<string,mixed> $entry
     * @return void
     */
    function qpmPublicSearchAudit(array $entry): void
    {
        $config = qpmPublicSearchGetConfig();
        if ($config['auditEnabled'] !== true) {
            return;
        }

        $dir = qpmPublicSearchEnsureRuntimeDir();
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
            'maskedApiKey' => qpmPublicSearchMaskApiKey(trim((string) ($entry['apiKey'] ?? ''))),
            'error' => trim((string) ($entry['error'] ?? '')),
        ];

        @file_put_contents($path, qpmPublicSearchSafeJsonEncode($payload) . PHP_EOL, FILE_APPEND | LOCK_EX);

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

if (!function_exists('qpmPublicSearchResolveOrigin')) {
    /**
     * @return string
     */
    function qpmPublicSearchResolveOrigin(): string
    {
        return trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
    }
}

if (!function_exists('qpmPublicSearchOriginMatchesPattern')) {
    /**
     * @param string $origin
     * @param string $pattern
     * @return bool
     */
    function qpmPublicSearchOriginMatchesPattern(string $origin, string $pattern): bool
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

if (!function_exists('qpmPublicSearchClientAllowsAllOrigins')) {
    /**
     * @param array<string,mixed> $client
     * @return bool
     */
    function qpmPublicSearchClientAllowsAllOrigins(array $client): bool
    {
        return qpmPublicSearchBoolValue($client['allow_all_origins'] ?? false, false);
    }
}

if (!function_exists('qpmPublicSearchResolveAllowedOriginForClient')) {
    /**
     * @param array<string,mixed> $client
     * @param string $origin
     * @return string
     */
    function qpmPublicSearchResolveAllowedOriginForClient(array $client, string $origin): string
    {
        $normalizedOrigin = trim($origin);
        if ($normalizedOrigin === '') {
            return '';
        }
        if (qpmPublicSearchClientAllowsAllOrigins($client)) {
            return $normalizedOrigin;
        }

        $allowedOrigins = isset($client['allowed_origins']) && is_array($client['allowed_origins'])
            ? $client['allowed_origins']
            : [];

        foreach ($allowedOrigins as $pattern) {
            if (qpmPublicSearchOriginMatchesPattern($normalizedOrigin, trim((string) $pattern))) {
                return $normalizedOrigin;
            }
        }

        return '';
    }
}

if (!function_exists('qpmPublicSearchResolveAllowedOriginForAnyClient')) {
    /**
     * @param string $origin
     * @return string
     */
    function qpmPublicSearchResolveAllowedOriginForAnyClient(string $origin): string
    {
        $normalizedOrigin = trim($origin);
        if ($normalizedOrigin === '') {
            return '';
        }
        foreach (qpmPublicSearchGetClients() as $client) {
            if (!is_array($client) || qpmPublicSearchBoolValue($client['enabled'] ?? true, true) !== true) {
                continue;
            }
            $allowed = qpmPublicSearchResolveAllowedOriginForClient($client, $normalizedOrigin);
            if ($allowed !== '') {
                return $allowed;
            }
        }
        return '';
    }
}

if (!function_exists('qpmPublicSearchApplyCorsHeaders')) {
    /**
     * @param string $allowedOrigin
     * @return void
     */
    function qpmPublicSearchApplyCorsHeaders(string $allowedOrigin = ''): void
    {
        if ($allowedOrigin !== '') {
            header('Access-Control-Allow-Origin: ' . $allowedOrigin);
            header('Vary: Origin');
        }
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    }
}

if (!function_exists('qpmPublicSearchNormalizeLanguageCode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeLanguageCode($value): string
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
        return preg_match('/^[a-z]{2}$/', $normalized) === 1 ? $normalized : '';
    }
}

if (!function_exists('qpmPublicSearchNormalizeSimpleList')) {
    /**
     * @param mixed $value
     * @return array<int,string>
     */
    function qpmPublicSearchNormalizeSimpleList($value): array
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

        return qpmPublicSearchDedupeStrings(array_map('strval', $values));
    }
}

if (!function_exists('qpmPublicSearchComputeInitialsFromGivenName')) {
    /**
     * @param string $givenName
     * @return string
     */
    function qpmPublicSearchComputeInitialsFromGivenName(string $givenName): string
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

if (!function_exists('qpmPublicSearchBuildNormalizedAuthorEntry')) {
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
    function qpmPublicSearchBuildNormalizedAuthorEntry(
        string $familyName,
        string $givenName,
        string $initials,
        string $rawFallbackName
    ): array {
        $familyName = trim($familyName);
        $givenName = trim($givenName);
        $initials = trim($initials);
        if ($initials === '' && $givenName !== '') {
            $initials = qpmPublicSearchComputeInitialsFromGivenName($givenName);
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

if (!function_exists('qpmPublicSearchSplitFamilyFirstAuthorName')) {
    /**
     * Splitter et NCBI-stil navn ("Setzler M", "O'Brien JK") i familyName/initials.
     * Bruges som fallback, naar PubMed-XML'ens strukturerede Author-noder ikke er
     * tilgaengelige (fx naar includeAbstracts=false), og esummary kun leverer en
     * flad `name`-streng i dette format.
     *
     * @param string $rawName
     * @return array{name:string,familyName:string,givenName:string,initials:string}
     */
    function qpmPublicSearchSplitFamilyFirstAuthorName(string $rawName): array
    {
        $rawName = trim($rawName);
        if ($rawName === '') {
            return ['name' => '', 'familyName' => '', 'givenName' => '', 'initials' => ''];
        }
        if (preg_match('/^(.*\S)\s+([A-Za-z]{1,4})$/u', $rawName, $matches) === 1) {
            return qpmPublicSearchBuildNormalizedAuthorEntry($matches[1], '', $matches[2], $rawName);
        }
        return qpmPublicSearchBuildNormalizedAuthorEntry($rawName, '', '', $rawName);
    }
}

if (!function_exists('qpmPublicSearchSplitGivenFirstAuthorName')) {
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
    function qpmPublicSearchSplitGivenFirstAuthorName(string $rawName): array
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
            return qpmPublicSearchBuildNormalizedAuthorEntry($familyName, $givenName, '', $normalized);
        }

        preg_match_all('/[\p{L}]+/u', $normalized, $matches);
        $parts = $matches[0] ?? [];
        if (count($parts) < 2) {
            return qpmPublicSearchBuildNormalizedAuthorEntry('', '', '', $normalized);
        }
        $familyName = $parts[count($parts) - 1];
        $givenName = implode(' ', array_slice($parts, 0, -1));
        return qpmPublicSearchBuildNormalizedAuthorEntry($familyName, $givenName, '', $normalized);
    }
}

if (!function_exists('qpmPublicSearchNormalizeSources')) {
    /**
     * @param mixed $value
     * @return array<int,string>
     */
    function qpmPublicSearchNormalizeSources($value): array
    {
        $allowed = ['pubmed', 'semanticScholar', 'openAlex', 'elicit'];
        $output = [];
        foreach (qpmPublicSearchNormalizeSimpleList($value) as $entry) {
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

if (!function_exists('qpmPublicSearchNormalizeSortMethod')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeSortMethod($value): string
    {
        $normalized = trim((string) $value);
        if (in_array($normalized, ['relevance', 'date_desc', 'date_asc'], true)) {
            return $normalized;
        }
        return 'relevance';
    }
}

if (!function_exists('qpmPublicSearchGetFocusProfileConfig')) {
    /**
     * @param string $profileId
     * @return array<string,mixed>|null
     */
    function qpmPublicSearchGetFocusProfileConfig(string $profileId): ?array
    {
        if ($profileId === '') {
            return null;
        }
        $profileConfig = defined('QPM_RERANK_PROFILE_CONFIG') && is_array(QPM_RERANK_PROFILE_CONFIG)
            ? QPM_RERANK_PROFILE_CONFIG
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

if (!function_exists('qpmPublicSearchNormalizeFocusProfileId')) {
    /**
     * Normaliserer et "focus"-profil-id og bekraefter, at det findes i
     * QPM_RERANK_PROFILE_CONFIG. Ukendt/tom vaerdi giver '' (ingen override).
     *
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeFocusProfileId($value): string
    {
        $normalized = strtolower(trim((string) $value));
        $normalized = preg_replace('/[^a-z0-9-]/', '', $normalized) ?? '';
        if ($normalized === '') {
            return '';
        }
        return qpmPublicSearchGetFocusProfileConfig($normalized) !== null ? $normalized : '';
    }
}

if (!function_exists('qpmPublicSearchNormalizeQueryLanguage')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeQueryLanguage($value): string
    {
        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['da', 'en', 'auto'], true) ? $normalized : 'auto';
    }
}

if (!function_exists('qpmPublicSearchNormalizeTranslationMode')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeTranslationMode($value): string
    {
        $normalized = strtolower(trim((string) $value));
        return in_array($normalized, ['auto', 'none'], true) ? $normalized : 'auto';
    }
}

if (!function_exists('qpmPublicSearchNormalizePublicationYearRange')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizePublicationYearRange($value): string
    {
        $normalized = trim((string) $value);
        return preg_match('/^\d{4}(?:-\d{4})?$/', $normalized) === 1 ? $normalized : '';
    }
}

if (!function_exists('qpmPublicSearchNormalizeSemanticScholarPublicationDateOrYear')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeSemanticScholarPublicationDateOrYear($value): string
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

if (!function_exists('qpmPublicSearchNormalizeSourceFormat')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeSourceFormat($value): string
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

if (!function_exists('qpmPublicSearchNormalizeHardPublicationType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeHardPublicationType($value): string
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

if (!function_exists('qpmPublicSearchNormalizeOpenAlexSourceType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeOpenAlexSourceType($value): string
    {
        $normalized = qpmPublicSearchNormalizeSourceFormat($value);
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

if (!function_exists('qpmPublicSearchNormalizeOpenAlexWorkType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeOpenAlexWorkType($value): string
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

if (!function_exists('qpmPublicSearchNormalizeSemanticScholarPublicationType')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeSemanticScholarPublicationType($value): string
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

if (!function_exists('qpmPublicSearchNormalizeElicitTypeTag')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmPublicSearchNormalizeElicitTypeTag($value): string
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

if (!function_exists('qpmPublicSearchBuildDefaultRequest')) {
    /**
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildDefaultRequest(): array
    {
        $config = qpmPublicSearchGetConfig();
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
                'stream' => false,
                'language' => 'da',
            ],
            'hardFilters' => [
                'languages' => [],
                'publicationYear' => '',
                'publicationTypes' => [],
                'sourceFormats' => [],
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
        ];
    }
}

if (!function_exists('qpmPublicSearchApplyQueryResponseOptionOverrides')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,mixed>
     */
    function qpmPublicSearchApplyQueryResponseOptionOverrides(array $request): array
    {
        if (array_key_exists('stream', $_GET)) {
            $request['responseOptions']['stream'] = qpmPublicSearchBoolValue(
                $_GET['stream'],
                (bool) ($request['responseOptions']['stream'] ?? false)
            );
        }
        if (array_key_exists('lang', $_GET)) {
            $request['responseOptions']['language'] = qpmPublicSearchNormalizeResponseLanguage($_GET['lang']);
        }
        return $request;
    }
}

if (!function_exists('qpmPublicSearchBuildGetRequestFromQuery')) {
    /**
     * @param array<string,mixed> $queryParams
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildGetRequestFromQuery(array $queryParams): array
    {
        $request = qpmPublicSearchBuildDefaultRequest();
        $allowed = [
            'q', 'sources', 'sort', 'page', 'pageSize', 'translation', 'apiKey', 'stream', 'lang', 'focus',
            // Convenience-aliaser, der matcher soegeformularens URL-parametre:
            'pagesize', 'databases', 'ai',
        ];
        $unexpected = array_diff(array_keys($queryParams), $allowed);
        if (!empty($unexpected)) {
            throw new InvalidArgumentException('Unsupported GET query parameter(s): ' . implode(', ', $unexpected));
        }

        $request['query']['text'] = trim((string) ($queryParams['q'] ?? ''));
        $sources = qpmPublicSearchNormalizeSources($queryParams['sources'] ?? []);
        if (empty($sources) && array_key_exists('databases', $queryParams)) {
            $sources = qpmPublicSearchNormalizeSources(
                str_replace(';;', ',', (string) $queryParams['databases'])
            );
        }
        $request['sources'] = $sources;
        $request['sort']['method'] = qpmPublicSearchNormalizeSortMethod($queryParams['sort'] ?? 'relevance');
        $request['focus'] = qpmPublicSearchNormalizeFocusProfileId($queryParams['focus'] ?? '');
        $request['page']['number'] = max(1, (int) ($queryParams['page'] ?? 1));
        if (array_key_exists('translation', $queryParams)) {
            $request['translation']['mode'] = qpmPublicSearchNormalizeTranslationMode($queryParams['translation']);
        } elseif (array_key_exists('ai', $queryParams)) {
            $request['translation']['mode'] = qpmPublicSearchBoolValue($queryParams['ai'], true) ? 'auto' : 'none';
        } else {
            $request['translation']['mode'] = 'auto';
        }
        $request['responseOptions']['stream'] = qpmPublicSearchBoolValue(
            $queryParams['stream'] ?? $request['responseOptions']['stream'],
            (bool) $request['responseOptions']['stream']
        );
        $request['responseOptions']['language'] = qpmPublicSearchNormalizeResponseLanguage(
            $queryParams['lang'] ?? $request['responseOptions']['language']
        );

        $config = qpmPublicSearchGetConfig();
        $pageSize = (int) ($queryParams['pageSize'] ?? ($queryParams['pagesize'] ?? $request['page']['size']));
        $request['page']['size'] = max(1, min($config['maxPageSize'], $pageSize > 0 ? $pageSize : $config['defaultPageSize']));

        if ($request['query']['text'] === '') {
            throw new InvalidArgumentException('q is required');
        }
        if (empty($request['sources'])) {
            throw new InvalidArgumentException('sources must contain at least one supported source');
        }

        return qpmPublicSearchApplyQueryResponseOptionOverrides($request);
    }
}

if (!function_exists('qpmPublicSearchNormalizePostRequest')) {
    /**
     * @param array<string,mixed> $payload
     * @return array<string,mixed>
     */
    function qpmPublicSearchNormalizePostRequest(array $payload): array
    {
        $request = qpmPublicSearchBuildDefaultRequest();
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
        $request['query']['language'] = qpmPublicSearchNormalizeQueryLanguage($query['language'] ?? 'auto');
        $request['domain'] = function_exists('qpmNormalizeDomainKey')
            ? qpmNormalizeDomainKey((string) ($payload['domain'] ?? ''))
            : trim((string) ($payload['domain'] ?? ''));
        $request['sources'] = qpmPublicSearchNormalizeSources($payload['sources'] ?? []);

        $sort = isset($payload['sort']) && is_array($payload['sort']) ? $payload['sort'] : [];
        $sortUnexpected = array_diff(array_keys($sort), ['method']);
        if (!empty($sortUnexpected)) {
            throw new InvalidArgumentException('Unsupported sort field(s): ' . implode(', ', $sortUnexpected));
        }
        $request['sort']['method'] = qpmPublicSearchNormalizeSortMethod($sort['method'] ?? 'relevance');
        $request['focus'] = qpmPublicSearchNormalizeFocusProfileId($payload['focus'] ?? '');

        $page = isset($payload['page']) && is_array($payload['page']) ? $payload['page'] : [];
        $pageUnexpected = array_diff(array_keys($page), ['number', 'size']);
        if (!empty($pageUnexpected)) {
            throw new InvalidArgumentException('Unsupported page field(s): ' . implode(', ', $pageUnexpected));
        }
        $config = qpmPublicSearchGetConfig();
        $request['page']['number'] = max(1, (int) ($page['number'] ?? 1));
        $pageSize = (int) ($page['size'] ?? $config['defaultPageSize']);
        $request['page']['size'] = max(1, min($config['maxPageSize'], $pageSize > 0 ? $pageSize : $config['defaultPageSize']));

        $translation = isset($payload['translation']) && is_array($payload['translation']) ? $payload['translation'] : [];
        $translationUnexpected = array_diff(array_keys($translation), ['mode']);
        if (!empty($translationUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported translation field(s): ' . implode(', ', $translationUnexpected)
            );
        }
        $request['translation']['mode'] = qpmPublicSearchNormalizeTranslationMode($translation['mode'] ?? 'auto');

        $responseOptions = isset($payload['responseOptions']) && is_array($payload['responseOptions'])
            ? $payload['responseOptions']
            : [];
        $responseUnexpected = array_diff(array_keys($responseOptions), [
            'includeAbstracts',
            'includeResolvedQueries',
            'includeDiagnostics',
            'stream',
            'language',
        ]);
        if (!empty($responseUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported responseOptions field(s): ' . implode(', ', $responseUnexpected)
            );
        }
        $request['responseOptions']['includeAbstracts'] = qpmPublicSearchBoolValue(
            $responseOptions['includeAbstracts'] ?? $request['responseOptions']['includeAbstracts'],
            $request['responseOptions']['includeAbstracts']
        );
        $request['responseOptions']['includeResolvedQueries'] = qpmPublicSearchBoolValue(
            $responseOptions['includeResolvedQueries'] ?? $request['responseOptions']['includeResolvedQueries'],
            $request['responseOptions']['includeResolvedQueries']
        );
        $request['responseOptions']['includeDiagnostics'] = qpmPublicSearchBoolValue(
            $responseOptions['includeDiagnostics'] ?? $request['responseOptions']['includeDiagnostics'],
            $request['responseOptions']['includeDiagnostics']
        );
        $request['responseOptions']['stream'] = qpmPublicSearchBoolValue(
            $responseOptions['stream'] ?? $request['responseOptions']['stream'],
            $request['responseOptions']['stream']
        );
        $request['responseOptions']['language'] = qpmPublicSearchNormalizeResponseLanguage(
            $responseOptions['language'] ?? $request['responseOptions']['language']
        );

        $hardFilters = isset($payload['hardFilters']) && is_array($payload['hardFilters']) ? $payload['hardFilters'] : [];
        $hardUnexpected = array_diff(array_keys($hardFilters), [
            'languages',
            'publicationYear',
            'publicationTypes',
            'sourceFormats',
        ]);
        if (!empty($hardUnexpected)) {
            throw new InvalidArgumentException('Unsupported hardFilters field(s): ' . implode(', ', $hardUnexpected));
        }
        $request['hardFilters']['languages'] = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeLanguageCode', qpmPublicSearchNormalizeSimpleList($hardFilters['languages'] ?? []))
        );
        $request['hardFilters']['publicationYear'] = qpmPublicSearchNormalizePublicationYearRange(
            $hardFilters['publicationYear'] ?? ''
        );
        $request['hardFilters']['publicationTypes'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeHardPublicationType',
                qpmPublicSearchNormalizeSimpleList($hardFilters['publicationTypes'] ?? [])
            )
        );
        $request['hardFilters']['sourceFormats'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeSourceFormat',
                qpmPublicSearchNormalizeSimpleList($hardFilters['sourceFormats'] ?? [])
            )
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
        $request['sourceFilters']['semanticScholar']['publicationTypes'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeSemanticScholarPublicationType',
                qpmPublicSearchNormalizeSimpleList($semanticScholar['publicationTypes'] ?? [])
            )
        );
        $request['sourceFilters']['semanticScholar']['publicationDateOrYear'] =
            qpmPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
                $semanticScholar['publicationDateOrYear'] ?? ''
            );
        $request['sourceFilters']['semanticScholar']['year'] = qpmPublicSearchNormalizePublicationYearRange(
            $semanticScholar['year'] ?? ''
        );

        $openAlex = isset($sourceFilters['openAlex']) && is_array($sourceFilters['openAlex'])
            ? $sourceFilters['openAlex']
            : [];
        $openAlexUnexpected = array_diff(array_keys($openAlex), ['language', 'sourceType', 'workType', 'publicationYear']);
        if (!empty($openAlexUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported sourceFilters.openAlex field(s): ' . implode(', ', $openAlexUnexpected)
            );
        }
        $request['sourceFilters']['openAlex']['language'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeLanguageCode',
                qpmPublicSearchNormalizeSimpleList($openAlex['language'] ?? [])
            )
        );
        $request['sourceFilters']['openAlex']['sourceType'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeOpenAlexSourceType',
                qpmPublicSearchNormalizeSimpleList($openAlex['sourceType'] ?? [])
            )
        );
        $request['sourceFilters']['openAlex']['workType'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeOpenAlexWorkType',
                qpmPublicSearchNormalizeSimpleList($openAlex['workType'] ?? [])
            )
        );
        $request['sourceFilters']['openAlex']['publicationYear'] = qpmPublicSearchNormalizePublicationYearRange(
            $openAlex['publicationYear'] ?? ''
        );

        $elicit = isset($sourceFilters['elicit']) && is_array($sourceFilters['elicit']) ? $sourceFilters['elicit'] : [];
        $elicitUnexpected = array_diff(array_keys($elicit), ['typeTags', 'includeKeywords', 'excludeKeywords']);
        if (!empty($elicitUnexpected)) {
            throw new InvalidArgumentException(
                'Unsupported sourceFilters.elicit field(s): ' . implode(', ', $elicitUnexpected)
            );
        }
        $request['sourceFilters']['elicit']['typeTags'] = qpmPublicSearchDedupeStrings(
            array_map(
                'qpmPublicSearchNormalizeElicitTypeTag',
                qpmPublicSearchNormalizeSimpleList($elicit['typeTags'] ?? [])
            )
        );
        $request['sourceFilters']['elicit']['includeKeywords'] = qpmPublicSearchNormalizeSimpleList(
            $elicit['includeKeywords'] ?? []
        );
        $request['sourceFilters']['elicit']['excludeKeywords'] = qpmPublicSearchNormalizeSimpleList(
            $elicit['excludeKeywords'] ?? []
        );

        if ($request['query']['text'] === '') {
            throw new InvalidArgumentException('query.text is required');
        }
        if (empty($request['sources'])) {
            throw new InvalidArgumentException('sources must contain at least one supported source');
        }

        return qpmPublicSearchApplyQueryResponseOptionOverrides($request);
    }
}

if (!function_exists('qpmPublicSearchParseRequest')) {
    /**
     * @return array<string,mixed>
     */
    function qpmPublicSearchParseRequest(): array
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        if ($method === 'GET') {
            return qpmPublicSearchBuildGetRequestFromQuery($_GET);
        }
        if ($method !== 'POST') {
            throw new InvalidArgumentException('Method not allowed');
        }
        $input = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($input)) {
            throw new InvalidArgumentException('Invalid JSON input');
        }
        return qpmPublicSearchNormalizePostRequest($input);
    }
}

if (!function_exists('qpmPublicSearchExtractApiKey')) {
    /**
     * @return array{key: string, source: string}
     */
    function qpmPublicSearchExtractApiKey(): array
    {
        $config = qpmPublicSearchGetConfig();
        $headerKey = trim((string) ($_SERVER['HTTP_X_API_KEY'] ?? ''));
        if ($headerKey !== '') {
            return ['key' => $headerKey, 'source' => 'header'];
        }
        $authorization = trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
        if (stripos($authorization, 'Bearer ') === 0) {
            return ['key' => trim(substr($authorization, 7)), 'source' => 'authorization'];
        }
        if ($config['urlApiKeyEnabled'] === true && isset($_GET['apiKey'])) {
            $queryKey = trim((string) $_GET['apiKey']);
            if ($queryKey !== '') {
                return ['key' => $queryKey, 'source' => 'query'];
            }
        }
        return ['key' => '', 'source' => ''];
    }
}

if (!function_exists('qpmPublicSearchClientMatchesApiKey')) {
    /**
     * @param array<string,mixed> $client
     * @param string $apiKey
     * @param string $source
     * @return bool
     */
    function qpmPublicSearchClientMatchesApiKey(array $client, string $apiKey, string $source): bool
    {
        $mode = qpmPublicSearchGetConfig()['urlApiKeyMode'];
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
            if (qpmPublicSearchBoolValue($client['allow_primary_api_key_in_url'] ?? false, false)) {
                return $primary !== '' && hash_equals($primary, $apiKey);
            }
            return false;
        }

        return $primary !== '' && hash_equals($primary, $apiKey);
    }
}

if (!function_exists('qpmPublicSearchResolveClient')) {
    /**
     * @param string $apiKey
     * @param string $source
     * @return array<string,mixed>
     */
    function qpmPublicSearchResolveClient(string $apiKey, string $source): array
    {
        if ($apiKey === '') {
            throw new RuntimeException('Missing API key', 401);
        }

        foreach (qpmPublicSearchGetClients() as $clientId => $client) {
            if (!is_array($client)) {
                continue;
            }
            if (qpmPublicSearchBoolValue($client['enabled'] ?? true, true) !== true) {
                continue;
            }
            if (!qpmPublicSearchClientMatchesApiKey($client, $apiKey, $source)) {
                continue;
            }
            $client['client_id'] = (string) $clientId;
            return $client;
        }

        throw new RuntimeException('Invalid API key', 401);
    }
}

if (!function_exists('qpmPublicSearchResolveAuthenticatedClient')) {
    /**
     * @return array<string,mixed>
     */
    function qpmPublicSearchResolveAuthenticatedClient(): array
    {
        $auth = qpmPublicSearchExtractApiKey();
        $client = qpmPublicSearchResolveClient($auth['key'], $auth['source']);
        $origin = qpmPublicSearchResolveOrigin();
        if ($origin !== '') {
            $allowedOrigin = qpmPublicSearchResolveAllowedOriginForClient($client, $origin);
            if ($allowedOrigin === '') {
                throw new RuntimeException('Origin is not allowed for this client', 403);
            }
            $client['resolved_origin'] = $allowedOrigin;
        } else {
            $client['resolved_origin'] = '';
        }
        $client['auth_source'] = $auth['source'];
        $client['masked_api_key'] = qpmPublicSearchMaskApiKey($auth['key']);
        return $client;
    }
}

if (!function_exists('qpmPublicSearchConsumeRateLimit')) {
    /**
     * @param array<string,mixed> $client
     * @param string $method
     * @return array<string,mixed>
     */
    function qpmPublicSearchConsumeRateLimit(array $client, string $method): array
    {
        $config = qpmPublicSearchGetConfig();
        $methodKey = strtoupper($method) === 'GET' ? 'get' : 'post';
        $limit = $methodKey === 'GET'
            ? max(1, (int) ($client['get_rate_limit_per_minute'] ?? $config['getRateLimit']))
            : max(1, (int) ($client['rate_limit_per_minute'] ?? $config['postRateLimit']));

        $dir = qpmPublicSearchEnsureRuntimeDir();
        $bucket = preg_replace('/[^a-z0-9_-]+/i', '_', trim((string) ($client['client_id'] ?? 'client'))) . '_' . $methodKey;
        $path = $dir . DIRECTORY_SEPARATOR . 'public-search-rate-limit-' . $bucket . '.json';
        $fp = @fopen($path, 'c+');
        if ($fp === false) {
            return [
                'limit' => $limit,
                'remaining' => null,
                'resetAt' => '',
                'resetInSeconds' => null,
                'status' => 0,
                'isLimited' => false,
            ];
        }

        $now = time();
        $windowStart = $now;
        $count = 0;
        $limited = false;

        try {
            if (!flock($fp, LOCK_EX)) {
                fclose($fp);
                return [
                    'limit' => $limit,
                    'remaining' => null,
                    'resetAt' => '',
                    'resetInSeconds' => null,
                    'status' => 0,
                    'isLimited' => false,
                ];
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
            fwrite($fp, qpmPublicSearchSafeJsonEncode([
                'windowStart' => $windowStart,
                'count' => $count,
            ]));
            fflush($fp);
            flock($fp, LOCK_UN);
        } finally {
            fclose($fp);
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

if (!function_exists('qpmPublicSearchOpenAiRequest')) {
    /**
     * @param array<string,mixed> $request
     * @param string $domain
     * @return array<string,mixed>
     */
    function qpmPublicSearchOpenAiRequest(array $request, string $domain = ''): array
    {
        $apiKey = function_exists('qpmGetOpenAIApiKey')
            ? qpmGetOpenAIApiKey($domain)
            : (defined('OPENAI_API_KEY') ? OPENAI_API_KEY : '');
        $apiUrl = function_exists('qpmGetOpenAIApiUrl')
            ? qpmGetOpenAIApiUrl($domain)
            : (defined('OPENAI_API_URL') ? OPENAI_API_URL : '');
        $orgId = function_exists('qpmGetOpenAIOrgId')
            ? qpmGetOpenAIOrgId($domain)
            : (defined('OPENAI_ORG_ID') ? OPENAI_ORG_ID : '');

        if ($apiKey === '' || $apiUrl === '') {
            throw new RuntimeException('OpenAI configuration is missing', 500);
        }

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ];
        if ($orgId !== '') {
            $headers[] = 'OpenAI-Organization: ' . $orgId;
        }

        $result = qpmHttpRequest($apiUrl, [
            'method' => 'POST',
            'timeout' => 60,
            'headers' => $headers,
            'body' => qpmPublicSearchSafeJsonEncode($request),
            'user_agent' => 'QuickPubMed/1.0',
        ]);
        if (!$result['ok']) {
            throw new RuntimeException('OpenAI request failed: ' . (string) $result['error'], 502);
        }
        $status = (int) ($result['status'] ?? 0);
        if ($status < 200 || $status >= 300) {
            throw new RuntimeException('OpenAI returned HTTP ' . $status, 502);
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Invalid OpenAI response', 502);
        }
        return $decoded;
    }
}

if (!function_exists('qpmPublicSearchExtractOpenAiText')) {
    /**
     * @param array<string,mixed> $responsePayload
     * @return string
     */
    function qpmPublicSearchExtractOpenAiText(array $responsePayload): string
    {
        if (isset($responsePayload['output_text']) && is_string($responsePayload['output_text'])) {
            return trim($responsePayload['output_text']);
        }
        $parts = [];
        $outputs = isset($responsePayload['output']) && is_array($responsePayload['output'])
            ? $responsePayload['output']
            : [];
        foreach ($outputs as $output) {
            if (!is_array($output)) {
                continue;
            }
            $contentItems = isset($output['content']) && is_array($output['content']) ? $output['content'] : [];
            foreach ($contentItems as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $text = $item['text'] ?? ($item['content'] ?? '');
                if (is_string($text) && trim($text) !== '') {
                    $parts[] = trim($text);
                }
            }
        }
        return trim(implode("\n", $parts));
    }
}

if (!function_exists('qpmPublicSearchGetPubMedPromptText')) {
    /**
     * @param string $language
     * @return string
     */
    function qpmPublicSearchGetPubMedPromptText(string $language): string
    {
        if ($language === 'da' || $language === 'auto') {
            return 'Du er en informationsspecialist, der så vidt muligt oversætter alle input til en korrekt PubMed-søgestreng. '
                . 'Ud fra det input, du modtager, skal du finde de mest relevante sundhedsvidenskabelige engelske termer, inkl. synonymer og stavemåder, '
                . 'som kan bruges til at udforme en præcis PubMed-søgning. '
                . 'Hvis input allerede er en PubMed-søgestreng, skal du returnere den uændret. '
                . 'Brug kun følgende tags: [ti], [tiab], [mh], [sh], [sb], [la], [dp], [ad], [ta], [nm], [au], [aid], [pmid]. '
                . 'Brug kun OR og AND, aldrig NOT. '
                . 'Svar kun med den endelige PubMed-søgestreng. Input: ';
        }
        return 'You are an information specialist. Translate the input into a valid PubMed search string. '
            . 'If the input is already a PubMed search string, return it unchanged. '
            . 'Use only valid PubMed field tags and only the boolean operators OR and AND. '
            . 'Respond with the final PubMed search string only. Input: ';
    }
}

if (!function_exists('qpmPublicSearchGetSemanticPromptText')) {
    /**
     * @param string $language
     * @return string
     */
    function qpmPublicSearchGetSemanticPromptText(string $language): string
    {
        if ($language === 'da' || $language === 'auto') {
            return 'Du er en informationsspecialist. Oversæt input til en kort, præcis engelsk plain-text søgesætning '
                . 'egnet til videnskabelige semantiske søgesystemer. Returnér kun engelsk tekst, uden PubMed-tags og uden boolske operatorer. '
                . 'Hold output kort og fokuseret. Input: ';
        }
        return 'You are an information specialist. Rewrite the input into a short, precise English plain-text scientific search query. '
            . 'Return only English text, without PubMed tags and without boolean operators. Input: ';
    }
}

if (!function_exists('qpmPublicSearchTranslatePubMedQuery')) {
    /**
     * @param string $text
     * @param string $language
     * @param string $domain
     * @return string
     */
    function qpmPublicSearchTranslatePubMedQuery(string $text, string $language, string $domain = ''): string
    {
        $normalizedText = trim($text);
        if ($normalizedText === '') {
            return '';
        }
        $request = [
            'model' => 'gpt-5.5',
            'input' => [
                [
                    'role' => 'user',
                    'content' => qpmPublicSearchGetPubMedPromptText($language) . $normalizedText,
                ],
            ],
            'reasoning' => ['effort' => 'none'],
            'text' => ['verbosity' => 'medium'],
            'max_output_tokens' => 500,
        ];
        return qpmPublicSearchExtractOpenAiText(qpmPublicSearchOpenAiRequest($request, $domain));
    }
}

if (!function_exists('qpmPublicSearchTranslateSemanticQuery')) {
    /**
     * @param string $text
     * @param string $language
     * @param string $domain
     * @return string
     */
    function qpmPublicSearchTranslateSemanticQuery(string $text, string $language, string $domain = ''): string
    {
        $normalizedText = trim($text);
        if ($normalizedText === '') {
            return '';
        }
        $request = [
            'model' => 'gpt-5.5',
            'input' => [
                [
                    'role' => 'user',
                    'content' => qpmPublicSearchGetSemanticPromptText($language) . $normalizedText,
                ],
            ],
            'reasoning' => ['effort' => 'none'],
            'text' => ['verbosity' => 'medium'],
            'max_output_tokens' => 120,
        ];
        return qpmPublicSearchExtractOpenAiText(qpmPublicSearchOpenAiRequest($request, $domain));
    }
}

if (!function_exists('qpmPublicSearchMapHardFiltersToSemanticScholarPublicationTypes')) {
    /**
     * @param array<int,string> $publicationTypes
     * @return array<int,string>
     */
    function qpmPublicSearchMapHardFiltersToSemanticScholarPublicationTypes(array $publicationTypes): array
    {
        $output = [];
        foreach ($publicationTypes as $value) {
            $normalized = qpmPublicSearchNormalizeHardPublicationType($value);
            if (in_array($normalized, ['review', 'systematic review', 'cochrane review'], true)) {
                $output[] = 'Review';
            } elseif ($normalized === 'meta-analysis') {
                $output[] = 'Meta-Analysis';
            }
        }
        return qpmPublicSearchDedupeStrings($output);
    }
}

if (!function_exists('qpmPublicSearchMapPublicationTypesToOpenAlexWorkTypes')) {
    /**
     * @param array<int,string> $publicationTypes
     * @return array<int,string>
     */
    function qpmPublicSearchMapPublicationTypesToOpenAlexWorkTypes(array $publicationTypes): array
    {
        $output = [];
        foreach ($publicationTypes as $value) {
            $normalized = qpmPublicSearchNormalizeHardPublicationType($value);
            if (in_array($normalized, ['review', 'systematic review', 'meta-analysis', 'cochrane review'], true)) {
                $output[] = 'review';
            }
        }
        return qpmPublicSearchDedupeStrings(array_map('qpmPublicSearchNormalizeOpenAlexWorkType', $output));
    }
}

if (!function_exists('qpmPublicSearchMapSourceFormatsToOpenAlexFilters')) {
    /**
     * @param array<int,string> $sourceFormats
     * @return array{sourceType: array<int,string>, workType: array<int,string>}
     */
    function qpmPublicSearchMapSourceFormatsToOpenAlexFilters(array $sourceFormats): array
    {
        $sourceTypes = [];
        $workTypes = [];
        foreach ($sourceFormats as $value) {
            $normalized = qpmPublicSearchNormalizeSourceFormat($value);
            if ($normalized === 'journal') {
                $sourceTypes[] = 'journal';
            } elseif ($normalized === 'conference') {
                $sourceTypes[] = 'conference';
            } elseif ($normalized === 'preprint') {
                $workTypes[] = 'preprint';
            }
        }
        return [
            'sourceType' => qpmPublicSearchDedupeStrings($sourceTypes),
            'workType' => qpmPublicSearchDedupeStrings($workTypes),
        ];
    }
}

if (!function_exists('qpmPublicSearchMapHardFiltersToElicitTypeTags')) {
    /**
     * @param array<string,mixed> $hardFilters
     * @return array<int,string>
     */
    function qpmPublicSearchMapHardFiltersToElicitTypeTags(array $hardFilters): array
    {
        $output = [];
        foreach ((array) ($hardFilters['publicationTypes'] ?? []) as $value) {
            $normalized = qpmPublicSearchNormalizeHardPublicationType($value);
            if ($normalized === 'systematic review') {
                $output[] = 'Systematic Review';
            } elseif ($normalized === 'meta-analysis') {
                $output[] = 'Meta-Analysis';
            } elseif (in_array($normalized, ['review', 'cochrane review'], true)) {
                $output[] = 'Review';
            }
        }
        return qpmPublicSearchDedupeStrings(array_map('qpmPublicSearchNormalizeElicitTypeTag', $output));
    }
}

if (!function_exists('qpmPublicSearchBuildElicitFallbackQuery')) {
    /**
     * @param string $query
     * @return string
     */
    function qpmPublicSearchBuildElicitFallbackQuery(string $query): string
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

if (!function_exists('qpmPublicSearchBuildHardFilterQuery')) {
    /**
     * @param array<string,mixed> $hardFilters
     * @return array{query: string, warnings: array<int,string>}
     */
    function qpmPublicSearchBuildHardFilterQuery(array $hardFilters): array
    {
        $warnings = [];
        $parts = [];

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
            $normalized = qpmPublicSearchNormalizeLanguageCode($languageCode);
            if ($normalized !== '' && isset($languageNames[$normalized])) {
                $languageClauses[] = $languageNames[$normalized] . '[la]';
            }
        }
        if (!empty($languageClauses)) {
            $parts[] = count($languageClauses) === 1 ? $languageClauses[0] : '(' . implode(' OR ', $languageClauses) . ')';
        }

        $publicationYear = qpmPublicSearchNormalizePublicationYearRange($hardFilters['publicationYear'] ?? '');
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
            $normalized = qpmPublicSearchNormalizeHardPublicationType($publicationType);
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

if (!function_exists('qpmPublicSearchBuildSourceQueryPlan')) {
    /**
     * @param array<string,mixed> $request
     * @param string $semanticQuery
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildSourceQueryPlan(array $request, string $semanticQuery): array
    {
        $hardFilters = isset($request['hardFilters']) && is_array($request['hardFilters'])
            ? $request['hardFilters']
            : [];
        $sourceFilters = isset($request['sourceFilters']) && is_array($request['sourceFilters'])
            ? $request['sourceFilters']
            : [];

        $openAlexSourceFormatFilters = qpmPublicSearchMapSourceFormatsToOpenAlexFilters(
            (array) ($hardFilters['sourceFormats'] ?? [])
        );
        $openAlexWorkTypes = qpmPublicSearchDedupeStrings(array_merge(
            (array) ($sourceFilters['openAlex']['workType'] ?? []),
            $openAlexSourceFormatFilters['workType'],
            qpmPublicSearchMapPublicationTypesToOpenAlexWorkTypes((array) ($hardFilters['publicationTypes'] ?? []))
        ));
        $openAlexSourceTypes = qpmPublicSearchDedupeStrings(array_merge(
            (array) ($sourceFilters['openAlex']['sourceType'] ?? []),
            $openAlexSourceFormatFilters['sourceType']
        ));
        $openAlexLanguages = qpmPublicSearchDedupeStrings(array_merge(
            (array) ($sourceFilters['openAlex']['language'] ?? []),
            (array) ($hardFilters['languages'] ?? [])
        ), 'qpmPublicSearchNormalizeLanguageCode');
        $openAlexPublicationYear = qpmPublicSearchNormalizePublicationYearRange(
            $sourceFilters['openAlex']['publicationYear'] ?? ($hardFilters['publicationYear'] ?? '')
        );

        $semanticScholarPublicationTypes = qpmPublicSearchDedupeStrings(array_merge(
            (array) ($sourceFilters['semanticScholar']['publicationTypes'] ?? []),
            qpmPublicSearchMapHardFiltersToSemanticScholarPublicationTypes((array) ($hardFilters['publicationTypes'] ?? []))
        ));
        $semanticScholarPublicationDateOrYear = qpmPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
            $sourceFilters['semanticScholar']['publicationDateOrYear'] ?? ''
        );
        $semanticScholarYear = qpmPublicSearchNormalizePublicationYearRange(
            $sourceFilters['semanticScholar']['year'] ?? ($hardFilters['publicationYear'] ?? '')
        );

        $elicitTypeTags = qpmPublicSearchDedupeStrings(array_merge(
            (array) ($sourceFilters['elicit']['typeTags'] ?? []),
            qpmPublicSearchMapHardFiltersToElicitTypeTags($hardFilters)
        ));

        return [
            'semanticScholar' => [
                'query' => trim($semanticQuery),
                'filters' => [
                    'publicationTypes' => $semanticScholarPublicationTypes,
                    'publicationDateOrYear' => $semanticScholarPublicationDateOrYear,
                    'year' => $semanticScholarYear,
                ],
            ],
            'openAlex' => [
                'query' => trim($semanticQuery),
                'filters' => [
                    'language' => $openAlexLanguages,
                    'sourceType' => $openAlexSourceTypes,
                    'workType' => $openAlexWorkTypes,
                    'publicationYear' => $openAlexPublicationYear,
                ],
            ],
            'elicit' => [
                'query' => qpmPublicSearchBuildElicitFallbackQuery($semanticQuery),
                'filters' => [
                    'typeTags' => $elicitTypeTags,
                    'includeKeywords' => qpmPublicSearchNormalizeSimpleList(
                        $sourceFilters['elicit']['includeKeywords'] ?? []
                    ),
                    'excludeKeywords' => qpmPublicSearchNormalizeSimpleList(
                        $sourceFilters['elicit']['excludeKeywords'] ?? []
                    ),
                ],
            ],
        ];
    }
}

if (!function_exists('qpmPublicSearchBuildResolvedQueries')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildResolvedQueries(array $request): array
    {
        $domain = (string) ($request['domain'] ?? '');
        $language = (string) ($request['query']['language'] ?? 'auto');
        $rawText = trim((string) ($request['query']['text'] ?? ''));
        $translationMode = (string) ($request['translation']['mode'] ?? 'auto');

        $pubmedQuery = $rawText;
        $semanticQuery = $rawText;
        if ($translationMode === 'auto') {
            if (in_array('pubmed', (array) $request['sources'], true)) {
                $translatedPubMed = qpmPublicSearchTranslatePubMedQuery($rawText, $language, $domain);
                if (trim($translatedPubMed) !== '') {
                    $pubmedQuery = trim($translatedPubMed);
                }
            }
            $translatedSemantic = qpmPublicSearchTranslateSemanticQuery($rawText, $language, $domain);
            if (trim($translatedSemantic) !== '') {
                $semanticQuery = trim($translatedSemantic);
            }
        }

        $hardFilterQuery = qpmPublicSearchBuildHardFilterQuery((array) ($request['hardFilters'] ?? []));
        $sourceQueryPlan = qpmPublicSearchBuildSourceQueryPlan($request, $semanticQuery);

        return [
            'semanticIntent' => $semanticQuery,
            'pubmedQuery' => $pubmedQuery,
            'hardFilterQuery' => $hardFilterQuery['query'],
            'sourceQueryPlan' => $sourceQueryPlan,
            'warnings' => $hardFilterQuery['warnings'],
        ];
    }
}

if (!function_exists('qpmPublicSearchGetSemanticSourceLimit')) {
    /**
     * @param string $sourceKey
     * @param int $default
     * @return int
     */
    function qpmPublicSearchGetSemanticSourceLimit(string $sourceKey, int $default): int
    {
        return function_exists('qpmGetSemanticSourceLimit')
            ? qpmGetSemanticSourceLimit($sourceKey, $default)
            : $default;
    }
}

if (!function_exists('qpmPublicSearchCreateEmptySourceResult')) {
    /**
     * @param string $source
     * @param string $query
     * @param string $error
     * @return array<string,mixed>
     */
    function qpmPublicSearchCreateEmptySourceResult(string $source, string $query, string $error = ''): array
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
            'debug' => null,
        ];
    }
}

if (!function_exists('qpmPublicSearchNormalizeSourceCandidate')) {
    /**
     * @param array<string,mixed> $candidate
     * @param string $source
     * @param int $fallbackRank
     * @return ?array<string,mixed>
     */
    function qpmPublicSearchNormalizeSourceCandidate(array $candidate, string $source, int $fallbackRank): ?array
    {
        $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
        $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
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
                'publicationTypes' => qpmPublicSearchNormalizeSimpleList($metadata['publicationTypes'] ?? []),
                'lexicalRescue' => ($metadata['lexicalRescue'] ?? false) === true,
                'lexicalRescueAbstractAvailable' => ($metadata['lexicalRescueAbstractAvailable'] ?? false) === true,
                'lexicalRescueTriggerReason' => trim((string) ($metadata['lexicalRescueTriggerReason'] ?? '')),
            ],
        ];
    }
}

if (!function_exists('qpmPublicSearchNormalizeSourceResult')) {
    /**
     * @param string $source
     * @param string $query
     * @param array<string,mixed> $payload
     * @param string $error
     * @return array<string,mixed>
     */
    function qpmPublicSearchNormalizeSourceResult(string $source, string $query, array $payload, string $error = ''): array
    {
        $candidates = [];
        foreach ((array) ($payload['candidates'] ?? []) as $index => $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $normalized = qpmPublicSearchNormalizeSourceCandidate($candidate, $source, $index + 1);
            if ($normalized !== null) {
                $candidates[] = $normalized;
            }
        }

        $pmids = qpmPublicSearchDedupeStrings(
            !empty($payload['pmids']) ? (array) $payload['pmids'] : array_map(static function ($candidate) {
                return $candidate['pmid'] ?? '';
            }, $candidates),
            'qpmPublicSearchNormalizePmid'
        );
        $dois = qpmPublicSearchDedupeStrings(
            !empty($payload['dois']) ? (array) $payload['dois'] : array_map(static function ($candidate) {
                return $candidate['doi'] ?? '';
            }, $candidates),
            'qpmPublicSearchNormalizeDoi'
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
            'debug' => isset($payload['debug']) && is_array($payload['debug']) ? $payload['debug'] : null,
        ];
    }
}

if (!function_exists('qpmPublicSearchIsHttpResultOk')) {
    /**
     * qpmHttpRequest()'s 'ok'-flag afspejler kun, om selve transporten (curl)
     * lykkedes - IKKE om upstream svarede med en 2xx-statuskode. Et svar som
     * "402 Payment Required" eller "429 Too Many Requests" er derfor 'ok'
     * ifoelge qpmHttpRequest, selvom kaldet reelt blev afvist. Denne helper
     * tjekker begge dele, saa afviste upstream-kald ikke fejlagtigt bliver
     * tolket som "0 resultater fundet".
     *
     * @param array<string,mixed> $result
     * @return bool
     */
    function qpmPublicSearchIsHttpResultOk(array $result): bool
    {
        if (($result['ok'] ?? false) !== true) {
            return false;
        }
        $status = (int) ($result['status'] ?? 0);
        return $status >= 200 && $status < 300;
    }
}

if (!function_exists('qpmPublicSearchDescribeHttpFailure')) {
    /**
     * @param array<string,mixed> $result
     * @return string
     */
    function qpmPublicSearchDescribeHttpFailure(array $result): string
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

if (!function_exists('qpmPublicSearchBuildNlmQueryParams')) {
    /**
     * @param array<string,mixed> $params
     * @param string $domain
     * @return string
     */
    function qpmPublicSearchBuildNlmQueryParams(array $params, string $domain = ''): string
    {
        $normalized = $params;
        $apiKey = function_exists('qpmGetNlmApiKey') ? qpmGetNlmApiKey($domain) : (defined('NLM_API_KEY') ? NLM_API_KEY : '');
        $email = function_exists('qpmGetNlmEmail') ? qpmGetNlmEmail($domain) : (defined('NLM_EMAIL') ? NLM_EMAIL : '');
        if ($apiKey !== '') {
            $normalized['api_key'] = $apiKey;
        }
        if ($email !== '') {
            $normalized['email'] = $email;
        }
        return http_build_query($normalized);
    }
}

if (!function_exists('qpmPublicSearchBuildNlmRequestOptions')) {
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
    function qpmPublicSearchBuildNlmRequestOptions(string $endpointUrl, string $queryString, array $baseHeaders): array
    {
        $getUrl = $endpointUrl . '?' . $queryString;
        if (strlen($getUrl) <= 1800) {
            return [
                'url' => $getUrl,
                'options' => [
                    'method' => 'GET',
                    'timeout' => 30,
                    'headers' => $baseHeaders,
                    'user_agent' => 'QuickPubMed/1.0',
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
                'user_agent' => 'QuickPubMed/1.0',
            ],
        ];
    }
}

if (!function_exists('qpmPublicSearchNlmGetJson')) {
    /**
     * @param string $endpoint
     * @param array<string,mixed> $params
     * @param string $domain
     * @return array<string,mixed>
     */
    function qpmPublicSearchNlmGetJson(string $endpoint, array $params, string $domain = ''): array
    {
        qpmThrottleNlmRequests(5);
        $baseUrl = function_exists('qpmGetNlmBaseUrl')
            ? qpmGetNlmBaseUrl($domain)
            : (defined('NLM_BASE_URL') ? NLM_BASE_URL : 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');
        $endpointUrl = rtrim($baseUrl, '/') . '/' . ltrim($endpoint, '/');
        $queryString = qpmPublicSearchBuildNlmQueryParams($params, $domain);
        $requestOptions = qpmPublicSearchBuildNlmRequestOptions($endpointUrl, $queryString, ['Accept: application/json']);
        $result = qpmHttpRequest($requestOptions['url'], $requestOptions['options']);
        if (!qpmPublicSearchIsHttpResultOk($result)) {
            throw new RuntimeException('NLM request failed: ' . qpmPublicSearchDescribeHttpFailure($result), 502);
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Invalid NLM JSON response', 502);
        }
        return $decoded;
    }
}

if (!function_exists('qpmPublicSearchNlmGetXml')) {
    /**
     * @param string $endpoint
     * @param array<string,mixed> $params
     * @param string $domain
     * @return string
     */
    function qpmPublicSearchNlmGetXml(string $endpoint, array $params, string $domain = ''): string
    {
        qpmThrottleNlmRequests(5);
        $baseUrl = function_exists('qpmGetNlmBaseUrl')
            ? qpmGetNlmBaseUrl($domain)
            : (defined('NLM_BASE_URL') ? NLM_BASE_URL : 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');
        $endpointUrl = rtrim($baseUrl, '/') . '/' . ltrim($endpoint, '/');
        $queryString = qpmPublicSearchBuildNlmQueryParams($params, $domain);
        $requestOptions = qpmPublicSearchBuildNlmRequestOptions(
            $endpointUrl,
            $queryString,
            ['Accept: application/xml,text/xml,*/*']
        );
        $result = qpmHttpRequest($requestOptions['url'], $requestOptions['options']);
        if (!qpmPublicSearchIsHttpResultOk($result)) {
            throw new RuntimeException('NLM XML request failed: ' . qpmPublicSearchDescribeHttpFailure($result), 502);
        }
        return (string) $result['body'];
    }
}

if (!function_exists('qpmPublicSearchFetchPubMedSearchIds')) {
    /**
     * @param string $query
     * @param int $limit
     * @param string $sort
     * @param string $domain
     * @return array{query: string, searchCount: int, pmids: array<int,string>}
     */
    function qpmPublicSearchFetchPubMedSearchIds(string $query, int $limit, string $sort = 'relevance', string $domain = ''): array
    {
        $normalizedQuery = trim($query);
        if ($normalizedQuery === '') {
            return [
                'query' => '',
                'searchCount' => 0,
                'pmids' => [],
            ];
        }
        $payload = qpmPublicSearchNlmGetJson('esearch.fcgi', [
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
            'pmids' => qpmPublicSearchDedupeStrings((array) ($esearch['idlist'] ?? []), 'qpmPublicSearchNormalizePmid'),
        ];
    }
}

if (!function_exists('qpmPublicSearchFetchPubMedSummaryRecords')) {
    /**
     * @param array<int,string> $pmids
     * @param string $domain
     * @return array<string,array<string,mixed>>
     */
    function qpmPublicSearchFetchPubMedSummaryRecords(array $pmids, string $domain = ''): array
    {
        $normalizedPmids = qpmPublicSearchDedupeStrings($pmids, 'qpmPublicSearchNormalizePmid');
        if (empty($normalizedPmids)) {
            return [];
        }
        $cacheTtl = (int) (qpmPublicSearchGetConfig()['hydrationCacheTtlSeconds'] ?? 0);
        $results = [];
        $missingPmids = [];
        foreach ($normalizedPmids as $pmid) {
            if ($cacheTtl > 0) {
                $cacheEntry = qpmPublicSearchReadCacheValue('pubmed-summary', 'pmid:' . $pmid);
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
            $payload = qpmPublicSearchNlmGetJson('esummary.fcgi', [
                'db' => 'pubmed',
                'retmode' => 'json',
                'id' => implode(',', $chunk),
            ], $domain);
            $summaryResult = isset($payload['result']) && is_array($payload['result']) ? $payload['result'] : [];
            foreach ($chunk as $pmid) {
                if (isset($summaryResult[$pmid]) && is_array($summaryResult[$pmid])) {
                    $results[$pmid] = $summaryResult[$pmid];
                    if ($cacheTtl > 0) {
                        qpmPublicSearchWriteCacheValue('pubmed-summary', 'pmid:' . $pmid, $summaryResult[$pmid], $cacheTtl);
                    }
                }
            }
        }
        return $results;
    }
}

if (!function_exists('qpmPublicSearchExtractPubMedSummaryPublicationYear')) {
    /**
     * @param array<string,mixed> $summaryRecord
     * @return string
     */
    function qpmPublicSearchExtractPubMedSummaryPublicationYear(array $summaryRecord): string
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

if (!function_exists('qpmPublicSearchFlattenPubMedAbstractText')) {
    /**
     * @param array<int,string> $parts
     * @return string
     */
    function qpmPublicSearchFlattenPubMedAbstractText(array $parts): string
    {
        return trim(implode(' ', array_values(array_filter(array_map(static function ($part) {
            return trim((string) $part);
        }, $parts)))));
    }
}

if (!function_exists('qpmPublicSearchFetchPubMedAbstractMap')) {
    /**
     * Henter abstract, strukturerede abstract-sektioner, MeSH-termer og
     * strukturerede forfatternavne fra samme efetch-XML-kald, saa der ikke
     * skal ekstra upstream-kald til.
     *
     * @param array<int,string> $pmids
     * @param string $domain
     * @return array<string,array{abstract:string,mesh:array<int,string>,abstractSections:array<int,array{label:string,text:string}>,authors:array<int,array{name:string,familyName:string,givenName:string,initials:string}>}>
     */
    function qpmPublicSearchFetchPubMedAbstractMap(array $pmids, string $domain = ''): array
    {
        $normalizedPmids = qpmPublicSearchDedupeStrings($pmids, 'qpmPublicSearchNormalizePmid');
        if (empty($normalizedPmids)) {
            return [];
        }
        $cacheTtl = (int) (qpmPublicSearchGetConfig()['hydrationCacheTtlSeconds'] ?? 0);
        $abstractMap = [];
        $missingPmids = [];
        foreach ($normalizedPmids as $pmid) {
            if ($cacheTtl > 0) {
                $cacheEntry = qpmPublicSearchReadCacheValue('pubmed-abstract', 'pmid:' . $pmid);
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
            $xmlPayload = qpmPublicSearchNlmGetXml('efetch.fcgi', [
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
                $pmid = qpmPublicSearchNormalizePmid($pmidNodes->item(0)?->textContent ?? '');
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
                        $structuredAuthors[] = qpmPublicSearchBuildNormalizedAuthorEntry(
                            $lastName,
                            $foreName,
                            $initials,
                            trim($foreName . ' ' . $lastName)
                        );
                    } elseif ($collectiveName !== '') {
                        $structuredAuthors[] = qpmPublicSearchBuildNormalizedAuthorEntry(
                            $collectiveName,
                            '',
                            '',
                            $collectiveName
                        );
                    }
                }
                $abstractMap[$pmid] = [
                    'abstract' => qpmPublicSearchFlattenPubMedAbstractText($parts),
                    'mesh' => array_values(array_keys($meshTerms)),
                    'abstractSections' => $sections,
                    'authors' => $structuredAuthors,
                ];
                if ($cacheTtl > 0) {
                    qpmPublicSearchWriteCacheValue('pubmed-abstract', 'pmid:' . $pmid, $abstractMap[$pmid], $cacheTtl);
                }
            }
        }
        return $abstractMap;
    }
}

if (!function_exists('qpmPublicSearchFetchPubMedBestMatchSourceResult')) {
    /**
     * @param string $pubmedQuery
     * @param string $domain
     * @return array<string,mixed>
     */
    function qpmPublicSearchFetchPubMedBestMatchSourceResult(string $pubmedQuery, string $domain = ''): array
    {
        $normalizedQuery = trim($pubmedQuery);
        $empty = qpmPublicSearchCreateEmptySourceResult('pubmed', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }
        $searchLimit = qpmPublicSearchGetSemanticSourceLimit('pubmedBestMatch', 200);
        $search = qpmPublicSearchFetchPubMedSearchIds($normalizedQuery, $searchLimit, 'relevance', $domain);
        if (empty($search['pmids'])) {
            $empty['total'] = $search['searchCount'];
            return $empty;
        }
        $summaryRecords = qpmPublicSearchFetchPubMedSummaryRecords($search['pmids'], $domain);
        $candidates = [];
        foreach ($search['pmids'] as $index => $pmid) {
            $record = isset($summaryRecords[$pmid]) ? $summaryRecords[$pmid] : [];
            $candidates[] = [
                'source' => 'pubmed',
                'rank' => $index + 1,
                'pmid' => $pmid,
                'title' => trim((string) ($record['title'] ?? '')),
                'metadata' => [
                    'publicationYear' => qpmPublicSearchExtractPubMedSummaryPublicationYear($record),
                    'venue' => trim((string) ($record['fulljournalname'] ?? ($record['source'] ?? ''))),
                    'publicationTypes' => qpmPublicSearchNormalizeSimpleList($record['pubtype'] ?? []),
                ],
            ];
        }
        return qpmPublicSearchNormalizeSourceResult('pubmed', $normalizedQuery, [
            'total' => $search['searchCount'],
            'pmids' => $search['pmids'],
            'candidates' => $candidates,
        ]);
    }
}

if (!function_exists('qpmPublicSearchFetchSemanticScholarSourceResult')) {
    /**
     * @param string $query
     * @param array<string,mixed> $filters
     * @return array<string,mixed>
     */
    function qpmPublicSearchFetchSemanticScholarSourceResult(string $query, array $filters): array
    {
        $normalizedQuery = trim($query);
        $empty = qpmPublicSearchCreateEmptySourceResult('semanticScholar', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }

        $envApiKey = getenv('SEMANTIC_SCHOLAR_API_KEY');
        $apiKey = is_string($envApiKey) && trim($envApiKey) !== ''
            ? trim($envApiKey)
            : (defined('SEMANTIC_SCHOLAR_API_KEY') ? trim((string) SEMANTIC_SCHOLAR_API_KEY) : '');
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

        $publicationTypesParam = '';
        $publicationTypes = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeSemanticScholarPublicationType', (array) ($filters['publicationTypes'] ?? []))
        );
        if (!empty($publicationTypes)) {
            $publicationTypesParam = implode(',', $publicationTypes);
        }
        $publicationDateOrYear = qpmPublicSearchNormalizeSemanticScholarPublicationDateOrYear(
            $filters['publicationDateOrYear'] ?? ''
        );
        $year = qpmPublicSearchNormalizePublicationYearRange($filters['year'] ?? '');

        // Semantic Scholars /paper/search understoetter maksimalt limit=100
        // pr. kald (se https://api.semanticscholar.org/api-docs/). Et enkelt
        // kald med hele den konfigurerede graense (som ofte er stoerre end
        // 100) bliver afvist af upstream. Der hentes derfor i batches, ligesom
        // backend/api/SemanticScholarSearch.php allerede goer for webappen.
        $configuredLimit = max(1, qpmPublicSearchGetSemanticSourceLimit('semanticScholar', 400));
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
            qpmThrottleRequestRate('semantic_scholar', 3);
            $params = [
                'query' => $normalizedQuery,
                'limit' => $currentLimit,
                'offset' => $offset,
                'fields' => 'externalIds,title,abstract,venue,year,publicationTypes,citationCount,isOpenAccess,tldr',
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

            $url = 'https://api.semanticscholar.org/graph/v1/paper/search?' . http_build_query($params);
            $result = qpmHttpRequest($url, [
                'method' => 'GET',
                'timeout' => 20,
                'headers' => $headers,
                'user_agent' => 'QuickPubMed/1.0',
            ]);
            if (!qpmPublicSearchIsHttpResultOk($result)) {
                $failure = 'Semantic Scholar request failed: ' . qpmPublicSearchDescribeHttpFailure($result);
                break;
            }
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
                $pmid = qpmPublicSearchNormalizePmid($externalIds['PubMed'] ?? '');
                $doi = qpmPublicSearchNormalizeDoi($externalIds['DOI'] ?? '');
                if ($pmid === '' && $doi === '') {
                    continue;
                }
                $citationCountRaw = $paper['citationCount'] ?? null;
                $isOpenAccessRaw = $paper['isOpenAccess'] ?? null;
                $tldrText = trim((string) ($paper['tldr']['text'] ?? ''));
                $payload['candidates'][] = [
                    'source' => 'semanticScholar',
                    'rank' => $rank,
                    'pmid' => $pmid,
                    'doi' => $doi,
                    'title' => trim((string) ($paper['title'] ?? '')),
                    'abstract' => trim((string) ($paper['abstract'] ?? '')),
                    'metadata' => [
                        'publicationYear' => trim((string) ($paper['year'] ?? '')),
                        'venue' => trim((string) ($paper['venue'] ?? '')),
                        'publicationTypes' => qpmPublicSearchNormalizeSimpleList($paper['publicationTypes'] ?? []),
                        'citationCount' => is_numeric($citationCountRaw) ? (int) $citationCountRaw : null,
                        'isOpenAccess' => is_bool($isOpenAccessRaw) ? $isOpenAccessRaw : null,
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
            return qpmPublicSearchCreateEmptySourceResult('semanticScholar', $normalizedQuery, $failure);
        }
        if (empty($payload['candidates'])) {
            $payload['warning'] = $rawResultCount > 0
                ? "Semantic Scholar matched {$rawResultCount} paper(s) for the resolved query, but none had a PubMed ID or DOI, so they were skipped."
                : 'Semantic Scholar matched 0 papers for the resolved query.';
        } elseif ($failure !== '') {
            $payload['warning'] = 'Semantic Scholar: ' . $failure . ' (partial results returned before the failure)';
        }
        return qpmPublicSearchNormalizeSourceResult('semanticScholar', $normalizedQuery, $payload);
    }
}

if (!function_exists('qpmPublicSearchFetchOpenAlexSourceResult')) {
    /**
     * @param string $query
     * @param array<string,mixed> $filters
     * @param string $domain
     * @return array<string,mixed>
     */
    function qpmPublicSearchFetchOpenAlexSourceResult(string $query, array $filters, string $domain = ''): array
    {
        $normalizedQuery = trim($query);
        $empty = qpmPublicSearchCreateEmptySourceResult('openAlex', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }

        qpmThrottleRequestRate('openalex', 1);
        $limit = qpmPublicSearchGetSemanticSourceLimit('openAlex', 50);
        $requestParams = [
            'search.semantic' => $normalizedQuery,
            'per_page' => $limit,
            'select' => 'id,display_name,doi,ids,publication_year,relevance_score,type,primary_location',
        ];
        $languageFilters = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeLanguageCode', (array) ($filters['language'] ?? []))
        );
        $sourceTypes = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeOpenAlexSourceType', (array) ($filters['sourceType'] ?? []))
        );
        $workTypes = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeOpenAlexWorkType', (array) ($filters['workType'] ?? []))
        );
        $publicationYear = qpmPublicSearchNormalizePublicationYearRange($filters['publicationYear'] ?? '');
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
        if (!empty($filterParts)) {
            $requestParams['filter'] = implode(',', $filterParts);
        }
        $apiKey = function_exists('qpmGetOpenAlexApiKey') ? qpmGetOpenAlexApiKey($domain) : '';
        if ($apiKey !== '') {
            $requestParams['api_key'] = $apiKey;
        }
        $mailto = function_exists('qpmGetOpenAlexEmail') ? qpmGetOpenAlexEmail($domain) : '';
        if ($mailto !== '') {
            $requestParams['mailto'] = $mailto;
        }

        $url = 'https://api.openalex.org/works?' . http_build_query($requestParams);
        $result = qpmHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 30,
            'headers' => ['Accept: application/json'],
            'user_agent' => 'QuickPubMed/1.0',
        ]);
        if (!qpmPublicSearchIsHttpResultOk($result)) {
            return qpmPublicSearchCreateEmptySourceResult(
                'openAlex',
                $normalizedQuery,
                'OpenAlex request failed: ' . qpmPublicSearchDescribeHttpFailure($result)
            );
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return qpmPublicSearchCreateEmptySourceResult('openAlex', $normalizedQuery, 'Invalid OpenAlex response');
        }
        $payload = [
            'total' => isset($decoded['meta']['count']) ? (int) $decoded['meta']['count'] : 0,
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
        ];
        foreach ((array) ($decoded['results'] ?? []) as $index => $work) {
            if (!is_array($work)) {
                continue;
            }
            $ids = isset($work['ids']) && is_array($work['ids']) ? $work['ids'] : [];
            $pmid = qpmPublicSearchNormalizePmid($work['pmid'] ?? ($ids['pmid'] ?? ''));
            $doi = qpmPublicSearchNormalizeDoi($work['doi'] ?? ($ids['doi'] ?? ''));
            if ($pmid === '' && $doi === '') {
                continue;
            }
            $primaryLocation = isset($work['primary_location']) && is_array($work['primary_location'])
                ? $work['primary_location']
                : [];
            $source = isset($primaryLocation['source']) && is_array($primaryLocation['source'])
                ? $primaryLocation['source']
                : [];
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
                    'workType' => trim((string) ($work['type'] ?? '')),
                    'sourceType' => trim((string) ($source['type'] ?? '')),
                    'sourceDisplayName' => trim((string) ($source['display_name'] ?? '')),
                    'sourceAbbreviatedTitle' => trim((string) ($source['abbreviated_title'] ?? '')),
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
        return qpmPublicSearchNormalizeSourceResult('openAlex', $normalizedQuery, $payload);
    }
}

if (!function_exists('qpmPublicSearchFetchElicitSourceResult')) {
    /**
     * @param string $query
     * @param array<string,mixed> $filters
     * @return array<string,mixed>
     */
    function qpmPublicSearchFetchElicitSourceResult(string $query, array $filters): array
    {
        $normalizedQuery = trim($query);
        $empty = qpmPublicSearchCreateEmptySourceResult('elicit', $normalizedQuery);
        if ($normalizedQuery === '') {
            return $empty;
        }
        $apiKey = defined('ELICIT_API_KEY') ? trim((string) ELICIT_API_KEY) : '';
        if ($apiKey === '') {
            return qpmPublicSearchCreateEmptySourceResult('elicit', $normalizedQuery, 'ELICIT_API_KEY is not configured');
        }

        qpmThrottleRequestRate('elicit', 2);
        $limit = qpmPublicSearchGetSemanticSourceLimit('elicit', 100);
        $requestFilters = [];
        $typeTags = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeElicitTypeTag', (array) ($filters['typeTags'] ?? []))
        );
        if (!empty($typeTags)) {
            $requestFilters['typeTags'] = $typeTags;
        }
        $includeKeywords = qpmPublicSearchNormalizeSimpleList($filters['includeKeywords'] ?? []);
        if (!empty($includeKeywords)) {
            $requestFilters['includeKeywords'] = $includeKeywords;
        }
        $excludeKeywords = qpmPublicSearchNormalizeSimpleList($filters['excludeKeywords'] ?? []);
        if (!empty($excludeKeywords)) {
            $requestFilters['excludeKeywords'] = $excludeKeywords;
        }
        $payload = [
            'query' => $normalizedQuery,
            'maxResults' => $limit,
        ];
        if (!empty($requestFilters)) {
            $payload['filters'] = $requestFilters;
        }
        $result = qpmHttpRequest('https://elicit.com/api/v1/search', [
            'method' => 'POST',
            'timeout' => 45,
            'headers' => [
                'Accept: application/json',
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ],
            'body' => qpmPublicSearchSafeJsonEncode($payload),
            'user_agent' => 'QuickPubMed/1.0',
        ]);
        if (!qpmPublicSearchIsHttpResultOk($result)) {
            return qpmPublicSearchCreateEmptySourceResult(
                'elicit',
                $normalizedQuery,
                'Elicit request failed: ' . qpmPublicSearchDescribeHttpFailure($result)
            );
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return qpmPublicSearchCreateEmptySourceResult('elicit', $normalizedQuery, 'Invalid Elicit response');
        }
        $sourcePayload = [
            'total' => (int) ($decoded['total'] ?? 0),
            'pmids' => [],
            'dois' => [],
            'candidates' => [],
        ];
        foreach ((array) ($decoded['papers'] ?? $decoded['results'] ?? []) as $index => $paper) {
            if (!is_array($paper)) {
                continue;
            }
            $pmid = qpmPublicSearchNormalizePmid($paper['pmid'] ?? ($paper['paper']['pmid'] ?? ''));
            $doi = qpmPublicSearchNormalizeDoi(
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
                    'publicationTypes' => qpmPublicSearchNormalizeSimpleList(
                        $paper['publication_types'] ?? ($paper['paper']['publication_types'] ?? [])
                    ),
                    'venue' => trim((string) ($paper['venue'] ?? ($paper['paper']['venue'] ?? ''))),
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
        return qpmPublicSearchNormalizeSourceResult('elicit', $normalizedQuery, $sourcePayload);
    }
}

if (!function_exists('qpmPublicSearchGetOpenAlexWorkLookupUrl')) {
    /**
     * @param array<string,mixed> $candidate
     * @param string $domain
     * @return string
     */
    function qpmPublicSearchGetOpenAlexWorkLookupUrl(array $candidate, string $domain = ''): string
    {
        $openAlexId = trim((string) ($candidate['openAlexId'] ?? ''));
        $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
        $queryParams = [];
        $apiKey = function_exists('qpmGetOpenAlexApiKey') ? qpmGetOpenAlexApiKey($domain) : '';
        $mailto = function_exists('qpmGetOpenAlexEmail') ? qpmGetOpenAlexEmail($domain) : '';
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

if (!function_exists('qpmPublicSearchReconstructOpenAlexAbstract')) {
    /**
     * @param mixed $invertedIndex
     * @return string
     */
    function qpmPublicSearchReconstructOpenAlexAbstract($invertedIndex): string
    {
        if (!is_array($invertedIndex) || empty($invertedIndex)) {
            return '';
        }
        $positions = [];
        foreach ($invertedIndex as $word => $indexes) {
            if (!is_string($word) || !is_array($indexes)) {
                continue;
            }
            foreach ($indexes as $index) {
                if (!is_numeric($index)) {
                    continue;
                }
                $positions[(int) $index] = $word;
            }
        }
        if (empty($positions)) {
            return '';
        }
        ksort($positions);
        return trim(implode(' ', $positions));
    }
}

if (!function_exists('qpmPublicSearchFetchOpenAlexWorkByCandidate')) {
    /**
     * @param array<string,mixed> $candidate
     * @param string $domain
     * @return ?array<string,mixed>
     */
    function qpmPublicSearchFetchOpenAlexWorkByCandidate(array $candidate, string $domain = ''): ?array
    {
        $url = qpmPublicSearchGetOpenAlexWorkLookupUrl($candidate, $domain);
        if ($url === '') {
            return null;
        }
        $cacheTtl = (int) (qpmPublicSearchGetConfig()['hydrationCacheTtlSeconds'] ?? 0);
        $cacheKey = 'url:' . $url;
        if ($cacheTtl > 0) {
            $cacheEntry = qpmPublicSearchReadCacheValue('openalex-work', $cacheKey);
            if (($cacheEntry['hit'] ?? false) === true && is_array($cacheEntry['value'] ?? null)) {
                return $cacheEntry['value'];
            }
        }
        qpmThrottleRequestRate('openalex', 1);
        $result = qpmHttpRequest($url, [
            'method' => 'GET',
            'timeout' => 30,
            'headers' => ['Accept: application/json'],
            'user_agent' => 'QuickPubMed/1.0',
        ]);
        if (!qpmPublicSearchIsHttpResultOk($result)) {
            return null;
        }
        $decoded = json_decode((string) $result['body'], true);
        if (!is_array($decoded)) {
            return null;
        }
        if (isset($decoded['results'][0]) && is_array($decoded['results'][0])) {
            if ($cacheTtl > 0) {
                qpmPublicSearchWriteCacheValue('openalex-work', $cacheKey, $decoded['results'][0], $cacheTtl);
            }
            return $decoded['results'][0];
        }
        if (isset($decoded['id']) && is_string($decoded['id'])) {
            if ($cacheTtl > 0) {
                qpmPublicSearchWriteCacheValue('openalex-work', $cacheKey, $decoded, $cacheTtl);
            }
            return $decoded;
        }
        return null;
    }
}

if (!function_exists('qpmPublicSearchParsePublicationYear')) {
    /**
     * @param string $range
     * @return array{from: int|null, to: int|null}
     */
    function qpmPublicSearchParsePublicationYear(string $range): array
    {
        $normalized = qpmPublicSearchNormalizePublicationYearRange($range);
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

if (!function_exists('qpmPublicSearchValueMatchesYearRange')) {
    /**
     * @param mixed $value
     * @param string $range
     * @return bool
     */
    function qpmPublicSearchValueMatchesYearRange($value, string $range): bool
    {
        $parsed = qpmPublicSearchParsePublicationYear($range);
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

if (!function_exists('qpmPublicSearchCandidateMatchesHydratedFilters')) {
    /**
     * @param array<string,mixed> $candidate
     * @param array<string,mixed> $work
     * @param array<string,mixed> $hardFilters
     * @return bool
     */
    function qpmPublicSearchCandidateMatchesHydratedFilters(array $candidate, array $work, array $hardFilters): bool
    {
        $publicationYear = qpmPublicSearchNormalizePublicationYearRange($hardFilters['publicationYear'] ?? '');
        if ($publicationYear !== '') {
            $workYear = trim((string) ($work['publication_year'] ?? ''));
            if (!qpmPublicSearchValueMatchesYearRange($workYear, $publicationYear)) {
                return false;
            }
        }

        $sourceFormats = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeSourceFormat', (array) ($hardFilters['sourceFormats'] ?? []))
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

        $publicationTypes = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeHardPublicationType', (array) ($hardFilters['publicationTypes'] ?? []))
        );
        if (!empty($publicationTypes)) {
            $requiredWorkTypes = qpmPublicSearchMapPublicationTypesToOpenAlexWorkTypes($publicationTypes);
            if (!empty($requiredWorkTypes)) {
                $workType = qpmPublicSearchNormalizeOpenAlexWorkType($work['type'] ?? '');
                if ($workType === '' || !in_array($workType, $requiredWorkTypes, true)) {
                    return false;
                }
            }
        }

        $languages = qpmPublicSearchDedupeStrings(
            array_map('qpmPublicSearchNormalizeLanguageCode', (array) ($hardFilters['languages'] ?? []))
        );
        if (!empty($languages)) {
            $workLanguage = qpmPublicSearchNormalizeLanguageCode($work['language'] ?? '');
            if ($workLanguage !== '' && !in_array($workLanguage, $languages, true)) {
                return false;
            }
        }

        return true;
    }
}

if (!function_exists('qpmPublicSearchGetRerankConfig')) {
    /**
     * @return array<string,mixed>
     */
    function qpmPublicSearchGetRerankConfig(string $focusProfileId = ''): array
    {
        $config = defined('QPM_RERANK_CONFIG') && is_array(QPM_RERANK_CONFIG) ? QPM_RERANK_CONFIG : [];
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
        $focusProfile = qpmPublicSearchGetFocusProfileConfig($focusProfileId);
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

if (!function_exists('qpmPublicSearchGetSourceStats')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @return array<string,array<string,mixed>>
     */
    function qpmPublicSearchGetSourceStats(array $sourceResults): array
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

if (!function_exists('qpmPublicSearchGetSourceSummary')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @return array<int,array<string,mixed>>
     */
    function qpmPublicSearchGetSourceSummary(array $sourceResults): array
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

if (!function_exists('qpmPublicSearchRerankSemanticCandidates')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @param string $focusProfileId
     * @return array<string,mixed>
     */
    function qpmPublicSearchRerankSemanticCandidates(array $sourceResults, string $focusProfileId = ''): array
    {
        $activeSourceResults = array_values(array_filter($sourceResults, static function ($sourceResult) {
            return !empty($sourceResult['candidates']) && is_array($sourceResult['candidates']);
        }));
        $rerankConfig = qpmPublicSearchGetRerankConfig($focusProfileId);
        $sourceStats = qpmPublicSearchGetSourceStats($activeSourceResults);
        $sourceSummary = qpmPublicSearchGetSourceSummary($activeSourceResults);
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
                $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
                $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
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
                return 0;
            }
            if ((float) $left['combinedScore'] !== (float) $right['combinedScore']) {
                return ((float) $left['combinedScore'] < (float) $right['combinedScore']) ? 1 : -1;
            }
            if ((float) $left['scoreTieBreaker'] !== (float) $right['scoreTieBreaker']) {
                return ((float) $left['scoreTieBreaker'] < (float) $right['scoreTieBreaker']) ? 1 : -1;
            }
            if ((int) $left['bestRank'] !== (int) $right['bestRank']) {
                return (int) $left['bestRank'] <=> (int) $right['bestRank'];
            }
            return 0;
        });

        return [
            'candidates' => $rankedCandidates,
            'pmids' => qpmPublicSearchDedupeStrings(array_map(static function ($candidate) {
                return $candidate['pmid'] ?? '';
            }, $rankedCandidates), 'qpmPublicSearchNormalizePmid'),
            'dois' => qpmPublicSearchDedupeStrings(array_map(static function ($candidate) {
                return $candidate['doi'] ?? '';
            }, $rankedCandidates), 'qpmPublicSearchNormalizeDoi'),
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

if (!function_exists('qpmPublicSearchResolveOrderedSearchPmids')) {
    /**
     * @param string $hardFilterQuery
     * @param array<int,string> $orderedPmids
     * @param string $sortMethod
     * @param string $domain
     * @return array{count: int, orderedIds: array<int,string>, validationQuery: string}
     */
    function qpmPublicSearchResolveOrderedSearchPmids(
        string $hardFilterQuery,
        array $orderedPmids,
        string $sortMethod,
        string $domain = ''
    ): array {
        $orderedPmids = qpmPublicSearchDedupeStrings($orderedPmids, 'qpmPublicSearchNormalizePmid');
        $pmidClause = !empty($orderedPmids) ? '(' . implode(' ', $orderedPmids) . ')' : '';
        $validationQuery = $hardFilterQuery !== ''
            ? ($pmidClause !== '' ? $pmidClause . ' AND (' . $hardFilterQuery . ')' : $hardFilterQuery)
            : $pmidClause;
        if ($validationQuery === '') {
            return [
                'count' => 0,
                'orderedIds' => [],
                'validationQuery' => '',
            ];
        }
        $search = qpmPublicSearchNlmGetJson('esearch.fcgi', [
            'db' => 'pubmed',
            'retmode' => 'json',
            'retmax' => count($orderedPmids),
            'retstart' => 0,
            'sort' => $sortMethod,
            'term' => $validationQuery,
        ], $domain);
        $matchedIds = qpmPublicSearchDedupeStrings(
            (array) ($search['esearchresult']['idlist'] ?? []),
            'qpmPublicSearchNormalizePmid'
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
        ];
    }
}

if (!function_exists('qpmPublicSearchBuildAllowedCandidateKeys')) {
    /**
     * @param array<int,array<string,mixed>> $orderedCandidates
     * @param array<int,string> $trustedPmids
     * @param array<string,mixed> $hardFilters
     * @param string $domain
     * @param callable|null $progressCallback
     * @return array{allowedKeys: array<int,string>, hydratedByKey: array<string,array<string,mixed>>, warnings: array<int,string>}
     */
    function qpmPublicSearchBuildAllowedCandidateKeys(
        array $orderedCandidates,
        array $trustedPmids,
        array $hardFilters,
        string $domain = '',
        ?callable $progressCallback = null
    ): array {
        $trustedSet = array_fill_keys(qpmPublicSearchDedupeStrings($trustedPmids, 'qpmPublicSearchNormalizePmid'), true);
        $allowedKeys = [];
        $hydratedByKey = [];
        $warnings = [];

        // DOI-kandidater hydreres/valideres et-for-et mod OpenAlex, hvilket ved
        // mange DOI-only-kandidater kan tage laengere tid. Der emittes derfor
        // ét fremdrifts-event, foerste gang vi starter denne validering, saa
        // en streaming-klient faar besked om, at vi er i gang - uden at
        // spamme streamen med gentagne identiske events.
        $doiCandidateCount = 0;
        foreach ($orderedCandidates as $candidate) {
            if (is_array($candidate) && qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '') === '') {
                $doiCandidateCount++;
            }
        }
        $doiCandidateIndex = 0;
        $hasEmittedDoiValidationProgress = false;

        foreach ($orderedCandidates as $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            $key = $pmid !== '' ? 'pmid:' . $pmid : ($doi !== '' ? 'doi:' . strtolower($doi) : '');
            if ($key === '') {
                continue;
            }
            if ($pmid !== '') {
                if (!empty($trustedSet) && !isset($trustedSet[$pmid])) {
                    continue;
                }
                $allowedKeys[] = $key;
                continue;
            }

            $doiCandidateIndex++;
            if (!$hasEmittedDoiValidationProgress) {
                $hasEmittedDoiValidationProgress = true;
                qpmPublicSearchEmitProgress($progressCallback, 'finalizeValidateDoiFetch', '', [
                    'stepId' => 'finalizeValidateDoiFetch',
                    'groupId' => 'finalizeCollect',
                    'groupKey' => 'semanticSearchProcessGroupMatch',
                    'messageKey' => 'semanticSearchProgressFinalizeValidateDoiFetch',
                    'total' => $doiCandidateCount,
                ]);
            }

            $work = qpmPublicSearchFetchOpenAlexWorkByCandidate($candidate, $domain);
            if (!is_array($work)) {
                $warnings[] = 'OpenAlex hydration failed for DOI candidate ' . strtolower($doi);
                continue;
            }
            if (!qpmPublicSearchCandidateMatchesHydratedFilters($candidate, $work, $hardFilters)) {
                continue;
            }
            $allowedKeys[] = $key;
            $hydratedByKey[$key] = $work;
        }

        return [
            'allowedKeys' => qpmPublicSearchDedupeStrings($allowedKeys),
            'hydratedByKey' => $hydratedByKey,
            'warnings' => qpmPublicSearchDedupeStrings($warnings),
        ];
    }
}

if (!function_exists('qpmPublicSearchBuildHybridOrderedResultRefs')) {
    /**
     * @param string $hardFilterQuery
     * @param array<int,array<string,mixed>> $orderedCandidates
     * @param string $sortMethod
     * @param array<string,mixed> $hardFilters
     * @param string $domain
     * @param callable|null $progressCallback
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildHybridOrderedResultRefs(
        string $hardFilterQuery,
        array $orderedCandidates,
        string $sortMethod,
        array $hardFilters,
        string $domain = '',
        ?callable $progressCallback = null
    ): array {
        $orderedPmids = [];
        foreach ($orderedCandidates as $candidate) {
            $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            if ($pmid !== '') {
                $orderedPmids[] = $pmid;
            }
        }
        if (!empty($orderedPmids)) {
            qpmPublicSearchEmitProgress($progressCallback, 'finalizeValidatePmid', '', [
                'stepId' => 'finalizeValidatePmid',
                'groupId' => 'finalizeCollect',
                'groupKey' => 'semanticSearchProcessGroupMatch',
                'messageKey' => 'semanticSearchProgressFinalizeValidatePmid',
            ]);
        }
        $orderedSearch = !empty($orderedPmids)
            ? qpmPublicSearchResolveOrderedSearchPmids($hardFilterQuery, $orderedPmids, $sortMethod, $domain)
            : ['count' => 0, 'orderedIds' => [], 'validationQuery' => ''];
        $trustedPmids = $hardFilterQuery !== '' ? $orderedSearch['orderedIds'] : [];
        $allowed = qpmPublicSearchBuildAllowedCandidateKeys(
            $orderedCandidates,
            $trustedPmids,
            $hardFilters,
            $domain,
            $progressCallback
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
            $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
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
        ];
    }
}

if (!function_exists('qpmPublicSearchShouldUseSemanticDateOrdering')) {
    /**
     * @param string $sortMethod
     * @return bool
     */
    function qpmPublicSearchShouldUseSemanticDateOrdering(string $sortMethod): bool
    {
        return in_array($sortMethod, ['date_desc', 'date_asc'], true);
    }
}

if (!function_exists('qpmPublicSearchParseSortDateValue')) {
    /**
     * @param string $value
     * @return ?int
     */
    function qpmPublicSearchParseSortDateValue(string $value): ?int
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

if (!function_exists('qpmPublicSearchSortResultsByDate')) {
    /**
     * @param array<int,array<string,mixed>> $results
     * @param string $sortMethod
     * @return array<int,array<string,mixed>>
     */
    function qpmPublicSearchSortResultsByDate(array $results, string $sortMethod): array
    {
        if (!qpmPublicSearchShouldUseSemanticDateOrdering($sortMethod)) {
            return $results;
        }
        $ascending = $sortMethod === 'date_asc';
        $decorated = [];
        foreach ($results as $index => $result) {
            $timestamp = qpmPublicSearchParseSortDateValue((string) ($result['publicationDate'] ?? ($result['year'] ?? '')));
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

if (!function_exists('qpmPublicSearchGetSemanticLlmConfig')) {
    /**
     * @return array<string,mixed>
     */
    function qpmPublicSearchGetSemanticLlmConfig(): array
    {
        $raw = defined('QPM_SEMANTIC_LLM_RERANK_CONFIG') && is_array(QPM_SEMANTIC_LLM_RERANK_CONFIG)
            ? QPM_SEMANTIC_LLM_RERANK_CONFIG
            : [];
        $enabled = qpmPublicSearchBoolValue($raw['enabled'] ?? false, false);
        $topN = is_numeric($raw['topN'] ?? null) ? (int) $raw['topN'] : 10;
        $maxOutputTokens = is_numeric($raw['maxOutputTokens'] ?? null) ? (int) $raw['maxOutputTokens'] : 400;
        // reasoning.effort must match the model family (the API rejects mismatches).
        $reasoningEffort = strtolower(trim((string) ($raw['reasoningEffort'] ?? 'none')));
        if (!in_array($reasoningEffort, ['minimal', 'none', 'low', 'medium', 'high', 'xhigh'], true)) {
            $reasoningEffort = 'none';
        }
        return [
            'enabled' => $enabled,
            'model' => trim((string) ($raw['model'] ?? 'gpt-5.4-nano')),
            'reasoningEffort' => $reasoningEffort,
            'topN' => max(2, min(15, $topN)),
            'maxOutputTokens' => max(64, $maxOutputTokens),
        ];
    }
}

if (!function_exists('qpmPublicSearchGetSemanticLlmCandidateId')) {
    /**
     * @param array<string,mixed> $entry
     * @return string
     */
    function qpmPublicSearchGetSemanticLlmCandidateId(array $entry): string
    {
        $pmid = qpmPublicSearchNormalizePmid($entry['pmid'] ?? ($entry['uid'] ?? ''));
        if ($pmid !== '') {
            return 'pmid:' . $pmid;
        }
        $doi = qpmPublicSearchNormalizeDoi($entry['doi'] ?? '');
        if ($doi !== '') {
            return 'doi:' . strtolower($doi);
        }
        return trim((string) ($entry['id'] ?? ($entry['uid'] ?? '')));
    }
}

if (!function_exists('qpmPublicSearchGetFocusProfileLlmCopy')) {
    /**
     * Kort, statisk engelsk label/beskrivelse pr. focus-profil-id, til brug i
     * LLM-prompten. QPM_RERANK_PROFILE_CONFIG har kun labelKey/descriptionKey,
     * som kraever frontend-oversaettelse og derfor ikke er tilgaengelige i PHP.
     *
     * @param string $profileId
     * @return array{id:string,label:string,description:string}
     */
    function qpmPublicSearchGetFocusProfileLlmCopy(string $profileId): array
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

if (!function_exists('qpmPublicSearchMaybeApplySemanticLlmFinalRerank')) {
    /**
     * @param array<int,array<string,mixed>> $results
     * @param array<string,mixed> $request
     * @param array<string,mixed> $resolvedQueries
     * @param string $domain
     * @return array<int,array<string,mixed>>
     */
    function qpmPublicSearchMaybeApplySemanticLlmFinalRerank(
        array $results,
        array $request,
        array $resolvedQueries,
        string $domain = ''
    ): array {
        $config = qpmPublicSearchGetSemanticLlmConfig();
        if (
            $config['enabled'] !== true ||
            ((int) ($request['page']['number'] ?? 1)) !== 1 ||
            qpmPublicSearchShouldUseSemanticDateOrdering((string) ($request['sort']['method'] ?? 'relevance')) ||
            count(array_intersect((array) ($request['sources'] ?? []), ['semanticScholar', 'openAlex', 'elicit'])) === 0 ||
            count($results) < 2
        ) {
            return $results;
        }

        $topN = min($config['topN'], count($results));
        $topResults = array_slice($results, 0, $topN);
        $pmidsToHydrate = [];
        foreach ($topResults as $entry) {
            if (trim((string) ($entry['abstract'] ?? '')) === '') {
                $pmid = qpmPublicSearchNormalizePmid($entry['pmid'] ?? '');
                if ($pmid !== '') {
                    $pmidsToHydrate[] = $pmid;
                }
            }
        }
        $abstractMap = qpmPublicSearchFetchPubMedAbstractMap($pmidsToHydrate, $domain);

        $requestCandidates = [];
        $deferredEntries = [];
        foreach ($topResults as $entry) {
            $candidateId = qpmPublicSearchGetSemanticLlmCandidateId($entry);
            $title = trim((string) ($entry['title'] ?? ''));
            if ($candidateId === '' || $title === '') {
                $deferredEntries[] = $entry;
                continue;
            }
            $pmid = qpmPublicSearchNormalizePmid($entry['pmid'] ?? '');
            $requestCandidates[] = [
                'id' => $candidateId,
                'title' => $title,
                'abstract' => trim((string) ($entry['abstract'] ?? ($abstractMap[$pmid]['abstract'] ?? ''))),
                'publicationDate' => trim((string) ($entry['publicationDate'] ?? '')),
                'source' => trim((string) ($entry['originSource'] ?? '')),
                'sourceLabel' => trim((string) ($entry['sourceLabel'] ?? '')),
                'entry' => $entry,
            ];
        }
        if (count($requestCandidates) < 2) {
            return $results;
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
        $focusCopy = qpmPublicSearchGetFocusProfileLlmCopy($focusProfileId);
        $systemPromptLines = [
            'You rerank already validated scholarly search candidates.',
            'Never exclude, add, or invent items. Return a permutation of the provided candidate ids only.',
            'Prefer candidates that best match the query intent using title and abstract together.',
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
                    'content' => qpmPublicSearchSafeJsonEncode([
                        'query' => trim((string) ($resolvedQueries['semanticIntent'] ?? ($resolvedQueries['pubmedQuery'] ?? ($request['query']['text'] ?? '')))),
                        'hardFilterQuery' => trim((string) ($resolvedQueries['hardFilterQuery'] ?? '')),
                        'resultFocus' => $focusCopy,
                        'task' => 'Return the candidate ids ordered from most to least relevant.',
                        'candidates' => array_map(static function ($candidate) {
                            return [
                                'id' => $candidate['id'],
                                'title' => $candidate['title'],
                                'abstract' => $candidate['abstract'],
                                'publicationDate' => $candidate['publicationDate'],
                                'source' => $candidate['source'],
                                'sourceLabel' => $candidate['sourceLabel'],
                            ];
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

        try {
            $response = qpmPublicSearchOpenAiRequest($requestPayload, $domain);
            $responseText = qpmPublicSearchExtractOpenAiText($response);
            $parsed = json_decode($responseText, true);
            if (!is_array($parsed) || !isset($parsed['orderedIds']) || !is_array($parsed['orderedIds'])) {
                return $results;
            }
            $orderedIds = qpmPublicSearchDedupeStrings($parsed['orderedIds']);
            $expectedIds = array_map(static function ($candidate) {
                return $candidate['id'];
            }, $requestCandidates);
            if (count($orderedIds) !== count($expectedIds)) {
                return $results;
            }
            $expectedLookup = array_fill_keys($expectedIds, true);
            foreach ($orderedIds as $orderedId) {
                if (!isset($expectedLookup[$orderedId])) {
                    return $results;
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
            return array_values(array_merge($reorderedTop, $deferredEntries, array_slice($results, $topN)));
        } catch (Throwable $throwable) {
            return $results;
        }
    }
}

if (!function_exists('qpmPublicSearchCombinePubMedQuery')) {
    /**
     * @param string $baseQuery
     * @param string $hardFilterQuery
     * @return string
     */
    function qpmPublicSearchCombinePubMedQuery(string $baseQuery, string $hardFilterQuery): string
    {
        $normalizedBase = trim($baseQuery);
        $normalizedFilter = trim($hardFilterQuery);
        if ($normalizedBase === '') {
            return $normalizedFilter;
        }
        if ($normalizedFilter === '') {
            return $normalizedBase;
        }
        return '(' . $normalizedBase . ') AND (' . $normalizedFilter . ')';
    }
}

if (!function_exists('qpmPublicSearchBuildApiResultFromPubMed')) {
    /**
     * @param array<string,mixed> $summary
     * @param string $abstract
     * @param int $rank
     * @param array<string,mixed> $candidateInfo
     * @param bool $trusted
     * @param array<int,string> $meshTerms
     * @param array<int,array{label:string,text:string}> $abstractSections
     * @param array<int,array{name:string,familyName:string,givenName:string,initials:string}> $structuredAuthors
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildApiResultFromPubMed(
        array $summary,
        string $abstract,
        int $rank,
        array $candidateInfo,
        bool $trusted,
        array $meshTerms = [],
        array $abstractSections = [],
        array $structuredAuthors = []
    ): array {
        $pmid = qpmPublicSearchNormalizePmid($summary['uid'] ?? ($summary['pmid'] ?? ''));
        $doi = qpmPublicSearchNormalizeDoi($candidateInfo['doi'] ?? '');
        $pmcId = '';
        if (is_array($summary['articleids'] ?? null)) {
            foreach ($summary['articleids'] as $articleId) {
                $idType = (string) ($articleId['idtype'] ?? '');
                if ($idType === 'doi' && $doi === '') {
                    $doi = qpmPublicSearchNormalizeDoi($articleId['value'] ?? '');
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
        $year = qpmPublicSearchExtractPubMedSummaryPublicationYear($summary);

        // Foretraekker strukturerede forfatternavne fra efetch-XML'en (LastName/
        // ForeName/Initials), da esummary kun leverer en flad 'name'-streng.
        // Falder tilbage til at splitte esummary-strengen, naar XML'en ikke er
        // hentet (fx naar includeAbstracts=false).
        $authors = $structuredAuthors;
        if (empty($authors) && is_array($summary['authors'] ?? null)) {
            foreach ($summary['authors'] as $author) {
                $authorName = trim((string) ($author['name'] ?? ''));
                if ($authorName !== '') {
                    $authors[] = qpmPublicSearchSplitFamilyFirstAuthorName($authorName);
                }
            }
        }

        $topics = [];
        foreach ($meshTerms as $meshTerm) {
            $meshLabel = trim((string) $meshTerm);
            if ($meshLabel !== '') {
                $topics[] = ['label' => $meshLabel, 'source' => 'mesh'];
            }
        }

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

        return [
            // Identifikation
            'rank' => $rank,
            'resultKey' => 'pmid:' . $pmid,
            'type' => 'pmid',
            'pmid' => $pmid,
            'doi' => $doi,
            'pmcId' => $pmcId,
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
            'language' => qpmPublicSearchNormalizeSimpleList($summary['lang'] ?? [])[0] ?? '',
            'publicationTypes' => qpmPublicSearchNormalizeSimpleList($summary['pubtype'] ?? []),
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
    }
}

if (!function_exists('qpmPublicSearchBuildApiResultFromOpenAlex')) {
    /**
     * @param array<string,mixed> $work
     * @param int $rank
     * @param array<string,mixed> $candidateInfo
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildApiResultFromOpenAlex(array $work, int $rank, array $candidateInfo): array
    {
        $doi = qpmPublicSearchNormalizeDoi($work['doi'] ?? ($candidateInfo['doi'] ?? ''));
        $pmid = qpmPublicSearchNormalizePmid($work['ids']['pmid'] ?? ($candidateInfo['pmid'] ?? ''));
        $primaryLocation = isset($work['primary_location']) && is_array($work['primary_location']) ? $work['primary_location'] : [];
        $source = isset($primaryLocation['source']) && is_array($primaryLocation['source']) ? $primaryLocation['source'] : [];
        $abstract = qpmPublicSearchReconstructOpenAlexAbstract($work['abstract_inverted_index'] ?? []);
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
                    $authors[] = qpmPublicSearchSplitGivenFirstAuthorName($authorName);
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
            $topics[] = ['label' => $primaryTopicName, 'source' => 'openAlex'];
        }

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

        return [
            // Identifikation
            'rank' => $rank,
            'resultKey' => 'doi:' . strtolower($doi),
            'type' => 'doi',
            'pmid' => $pmid,
            'doi' => $doi,
            'pmcId' => trim((string) ($work['ids']['pmcid'] ?? '')),
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
    }
}

if (!function_exists('qpmPublicSearchBuildFinalResponse')) {
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
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildFinalResponse(
        array $request,
        array $resolvedQueries,
        array $results,
        int $totalCount,
        bool $partial,
        array $warnings,
        string $finalStage,
        bool $matchesWebOrdering,
        array $diagnostics = []
    ): array {
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
            'warnings' => array_values(array_map('strval', $warnings)),
            'order' => [
                'requestedMethod' => (string) ($request['sort']['method'] ?? 'relevance'),
                'appliedMethod' => (string) ($request['sort']['method'] ?? 'relevance'),
                'finalStage' => $finalStage,
                'matchesWebOrdering' => $matchesWebOrdering,
            ],
            'results' => array_values($results),
        ];

        if (($request['responseOptions']['includeResolvedQueries'] ?? false) === true) {
            $response['resolvedQueries'] = [
                'pubmedQuery' => (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                'semanticIntent' => (string) ($resolvedQueries['semanticIntent'] ?? ''),
                'hardFilterQuery' => (string) ($resolvedQueries['hardFilterQuery'] ?? ''),
                'sourceQueryPlan' => $resolvedQueries['sourceQueryPlan'] ?? new stdClass(),
            ];
        }
        if (($request['responseOptions']['includeDiagnostics'] ?? false) === true) {
            $response['diagnostics'] = $diagnostics;
        }

        return $response;
    }
}

if (!function_exists('qpmPublicSearchRunSearch')) {
    /**
     * @param array<string,mixed> $request
     * @param callable|null $progressCallback
     * @return array<string,mixed>
     */
    function qpmPublicSearchRunSearch(array $request, ?callable $progressCallback = null): array
    {
        $config = qpmPublicSearchGetConfig();
        $includeDiagnostics = ($request['responseOptions']['includeDiagnostics'] ?? false) === true;
        $searchCacheTtl = (int) ($config['searchResultCacheTtlSeconds'] ?? 0);
        $searchCacheKey = 'request:' . qpmPublicSearchSafeJsonEncode($request);
        if ($searchCacheTtl > 0) {
            $cacheEntry = qpmPublicSearchReadCacheValue('search-response', $searchCacheKey);
            if (($cacheEntry['hit'] ?? false) === true && is_array($cacheEntry['value'] ?? null)) {
                qpmPublicSearchEmitProgress($progressCallback, 'cache', '', [
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
        qpmPublicSearchEmitProgress($progressCallback, 'prepare', '', [
            'stepId' => 'prepare',
            'groupId' => 'prepare',
            'groupKey' => 'semanticSearchProcessGroupPrepare',
            'messageKey' => 'semanticSearchProgressPreparing',
        ]);
        $resolvedQueries = qpmPublicSearchBuildResolvedQueries($request);
        $warnings = qpmPublicSearchDedupeStrings((array) ($resolvedQueries['warnings'] ?? []));
        $diagnostics = [];
        if ($includeDiagnostics) {
            $diagnostics['cache'] = ['hit' => false];
        }

        $isPurePubMed = $request['sources'] === ['pubmed'];
        if ($isPurePubMed) {
            $finalPubMedQuery = qpmPublicSearchCombinePubMedQuery(
                (string) ($resolvedQueries['pubmedQuery'] ?? ''),
                (string) ($resolvedQueries['hardFilterQuery'] ?? '')
            );
            qpmPublicSearchEmitProgress($progressCallback, 'pubmed', '', [
                'stepId' => 'pubmed',
                'groupId' => 'sources',
                'groupKey' => 'semanticSearchProcessGroupSources',
                'messageKey' => 'semanticSearchProgressPubMedBestMatch',
                'source' => 'pubmed',
            ]);
            $searchPayload = qpmPublicSearchNlmGetJson('esearch.fcgi', [
                'db' => 'pubmed',
                'term' => $finalPubMedQuery,
                'retmode' => 'json',
                'retmax' => $pageSize,
                'retstart' => $pageOffset,
                'sort' => $sortMethod === 'relevance' ? 'relevance' : $sortMethod,
            ], $domain);
            $esearch = isset($searchPayload['esearchresult']) && is_array($searchPayload['esearchresult'])
                ? $searchPayload['esearchresult']
                : [];
            $pmids = qpmPublicSearchDedupeStrings((array) ($esearch['idlist'] ?? []), 'qpmPublicSearchNormalizePmid');
            qpmPublicSearchEmitProgress($progressCallback, 'finalizeHydratePubMed', '', [
                'stepId' => 'finalizeHydratePubMed',
                'groupId' => 'finalizeHydrate',
                'groupKey' => 'semanticSearchProcessGroupDisplay',
                'messageKey' => 'semanticSearchProgressFinalizeHydratePubMed',
            ]);
            $summaryMap = qpmPublicSearchFetchPubMedSummaryRecords($pmids, $domain);
            $abstractMap = ($request['responseOptions']['includeAbstracts'] ?? true) === true
                ? qpmPublicSearchFetchPubMedAbstractMap($pmids, $domain)
                : [];

            $results = [];
            foreach ($pmids as $index => $pmid) {
                if (!isset($summaryMap[$pmid])) {
                    continue;
                }
                $results[] = qpmPublicSearchBuildApiResultFromPubMed(
                    $summaryMap[$pmid],
                    $abstractMap[$pmid]['abstract'] ?? '',
                    $pageOffset + $index + 1,
                    ['source' => 'pubmed', 'sources' => ['pubmed'], 'doi' => ''],
                    true,
                    $abstractMap[$pmid]['mesh'] ?? [],
                    $abstractMap[$pmid]['abstractSections'] ?? [],
                    $abstractMap[$pmid]['authors'] ?? []
                );
            }

            qpmPublicSearchEmitProgress($progressCallback, 'finalizeRender', '', [
                'stepId' => 'finalizeRender',
                'groupId' => 'finalizeHydrate',
                'groupKey' => 'semanticSearchProcessGroupDisplay',
                'messageKey' => 'semanticSearchProgressFinalizeRender',
            ]);
            $response = qpmPublicSearchBuildFinalResponse(
                $request,
                array_merge($resolvedQueries, ['hardFilterQuery' => $finalPubMedQuery]),
                $results,
                (int) ($esearch['count'] ?? 0),
                false,
                $warnings,
                'pubmed_native',
                $config['matchesWebOrderingByDefault'],
                $diagnostics
            );
            if ($searchCacheTtl > 0) {
                qpmPublicSearchWriteCacheValue('search-response', $searchCacheKey, $response, $searchCacheTtl);
            }
            return $response;
        }

        $sourceResults = [];
        if (in_array('pubmed', (array) $request['sources'], true)) {
            qpmPublicSearchEmitProgress($progressCallback, 'pubmed', '', [
                'stepId' => 'pubmed',
                'groupId' => 'sources',
                'groupKey' => 'semanticSearchProcessGroupSources',
                'messageKey' => 'semanticSearchProgressPubMedBestMatch',
                'source' => 'pubmed',
            ]);
            $sourceResults[] = qpmPublicSearchFetchPubMedBestMatchSourceResult((string) ($resolvedQueries['pubmedQuery'] ?? ''), $domain);
        }
        if (in_array('semanticScholar', (array) $request['sources'], true)) {
            qpmPublicSearchEmitProgress($progressCallback, 'semanticScholar', '', [
                'stepId' => 'semanticScholar',
                'groupId' => 'sources',
                'groupKey' => 'semanticSearchProcessGroupSources',
                'messageKey' => 'semanticSearchProgressSemanticScholar',
                'source' => 'semanticScholar',
            ]);
            $sourceResults[] = qpmPublicSearchFetchSemanticScholarSourceResult(
                (string) ($resolvedQueries['sourceQueryPlan']['semanticScholar']['query'] ?? ''),
                (array) ($resolvedQueries['sourceQueryPlan']['semanticScholar']['filters'] ?? [])
            );
        }
        if (in_array('openAlex', (array) $request['sources'], true)) {
            qpmPublicSearchEmitProgress($progressCallback, 'openAlex', '', [
                'stepId' => 'openAlex',
                'groupId' => 'sources',
                'groupKey' => 'semanticSearchProcessGroupSources',
                'messageKey' => 'semanticSearchProgressOpenAlex',
                'source' => 'openAlex',
            ]);
            $sourceResults[] = qpmPublicSearchFetchOpenAlexSourceResult(
                (string) ($resolvedQueries['sourceQueryPlan']['openAlex']['query'] ?? ''),
                (array) ($resolvedQueries['sourceQueryPlan']['openAlex']['filters'] ?? []),
                $domain
            );
        }
        if (in_array('elicit', (array) $request['sources'], true)) {
            qpmPublicSearchEmitProgress($progressCallback, 'elicit', '', [
                'stepId' => 'elicit',
                'groupId' => 'sources',
                'groupKey' => 'semanticSearchProcessGroupSources',
                'messageKey' => 'semanticSearchProgressElicit',
                'source' => 'elicit',
            ]);
            $sourceResults[] = qpmPublicSearchFetchElicitSourceResult(
                (string) ($resolvedQueries['sourceQueryPlan']['elicit']['query'] ?? ''),
                (array) ($resolvedQueries['sourceQueryPlan']['elicit']['filters'] ?? [])
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

        qpmPublicSearchEmitProgress($progressCallback, 'finalizeCollect', '', [
            'stepId' => 'finalizeCollect',
            'groupId' => 'finalizeCollect',
            'groupKey' => 'semanticSearchProcessGroupMatch',
            'messageKey' => 'semanticSearchProgressFinalizeCollect',
        ]);
        $reranked = qpmPublicSearchRerankSemanticCandidates($sourceResults, (string) ($request['focus'] ?? ''));
        $orderedCandidates = (array) ($reranked['candidates'] ?? []);
        $diagnostics['rerank'] = $reranked['diagnostics'] ?? [];

        $hybridOrdering = qpmPublicSearchBuildHybridOrderedResultRefs(
            (string) ($resolvedQueries['hardFilterQuery'] ?? ''),
            $orderedCandidates,
            $sortMethod,
            (array) ($request['hardFilters'] ?? []),
            $domain,
            $progressCallback
        );
        $warnings = qpmPublicSearchDedupeStrings(array_merge($warnings, (array) ($hybridOrdering['warnings'] ?? [])));
        $resultRefs = (array) ($hybridOrdering['refs'] ?? []);
        $totalCount = count($resultRefs);

        $candidateByKey = [];
        foreach ($orderedCandidates as $candidate) {
            $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
            $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            $key = $pmid !== '' ? 'pmid:' . $pmid : ($doi !== '' ? 'doi:' . strtolower($doi) : '');
            if ($key !== '') {
                $candidateByKey[$key] = $candidate;
            }
        }

        $refsToHydrate = qpmPublicSearchShouldUseSemanticDateOrdering($sortMethod)
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
        qpmPublicSearchEmitProgress($progressCallback, 'finalizeHydrate', '', [
            'stepId' => 'finalizeHydrate',
            'groupId' => 'finalizeHydrate',
            'groupKey' => 'semanticSearchProcessGroupDisplay',
            'messageKey' => $hydrateMessageKey,
        ]);
        $summaryMap = qpmPublicSearchFetchPubMedSummaryRecords($pmidsToHydrate, $domain);
        $abstractMap = ($request['responseOptions']['includeAbstracts'] ?? true) === true
            ? qpmPublicSearchFetchPubMedAbstractMap($pmidsToHydrate, $domain)
            : [];
        $doiWorkMap = [];
        foreach ($doiRefs as $ref) {
            $key = (string) ($ref['key'] ?? '');
            $hydratedWork = isset($ref['hydratedWork']) && is_array($ref['hydratedWork']) ? $ref['hydratedWork'] : null;
            if (!is_array($hydratedWork)) {
                $candidate = isset($ref['candidate']) && is_array($ref['candidate']) ? $ref['candidate'] : [];
                $hydratedWork = qpmPublicSearchFetchOpenAlexWorkByCandidate($candidate, $domain);
            }
            if (is_array($hydratedWork)) {
                $doiWorkMap[$key] = $hydratedWork;
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
                $results[] = qpmPublicSearchBuildApiResultFromPubMed(
                    $summaryMap[$pmid],
                    $abstractMap[$pmid]['abstract'] ?? '',
                    $rank,
                    $candidateInfo,
                    $trusted,
                    $abstractMap[$pmid]['mesh'] ?? [],
                    $abstractMap[$pmid]['abstractSections'] ?? [],
                    $abstractMap[$pmid]['authors'] ?? []
                );
            } elseif (isset($doiWorkMap[$key])) {
                $results[] = qpmPublicSearchBuildApiResultFromOpenAlex($doiWorkMap[$key], $rank, $candidateInfo);
            }
        }

        if (qpmPublicSearchShouldUseSemanticDateOrdering($sortMethod)) {
            qpmPublicSearchEmitProgress($progressCallback, 'finalizeSort', '', [
                'stepId' => 'finalizeSort',
                'groupId' => 'finalizeHydrate',
                'groupKey' => 'semanticSearchProcessGroupDisplay',
                'messageKey' => 'semanticSearchProgressFinalizeSort',
            ]);
            $results = qpmPublicSearchSortResultsByDate($results, $sortMethod);
            $totalCount = count($results);
            $results = array_slice($results, $pageOffset, $pageSize);
            foreach ($results as $index => &$result) {
                $result['rank'] = $pageOffset + $index + 1;
            }
            unset($result);
        }

        $results = qpmPublicSearchMaybeApplySemanticLlmFinalRerank($results, $request, $resolvedQueries, $domain);
        foreach ($results as $index => &$result) {
            $result['rank'] = $pageOffset + $index + 1;
        }
        unset($result);

        qpmPublicSearchEmitProgress($progressCallback, 'finalizeRender', '', [
            'stepId' => 'finalizeRender',
            'groupId' => 'finalizeHydrate',
            'groupKey' => 'semanticSearchProcessGroupDisplay',
            'messageKey' => 'semanticSearchProgressFinalizeRender',
        ]);
        $response = qpmPublicSearchBuildFinalResponse(
            $request,
            $resolvedQueries,
            $results,
            $totalCount,
            count($warnings) > 0,
            $warnings,
            qpmPublicSearchShouldUseSemanticDateOrdering($sortMethod) ? 'semantic_date_sort' : 'deterministic_hybrid',
            $config['matchesWebOrderingByDefault'],
            $diagnostics
        );
        if ($searchCacheTtl > 0) {
            qpmPublicSearchWriteCacheValue('search-response', $searchCacheKey, $response, $searchCacheTtl);
        }
        return $response;
    }
}
