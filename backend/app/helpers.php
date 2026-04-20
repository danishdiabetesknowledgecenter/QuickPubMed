<?php
/**
 * Helper functions for backend APIs.
 */

/**
 * Check if origin is allowed and return the appropriate CORS header value.
 *
 * @param string|null $origin The request origin.
 * @return string|null The allowed origin or null if not allowed.
 */
function getAllowedOrigin($origin) {
    if (empty($origin)) {
        return null;
    }

    // Parse the origin to get the host.
    $parsed = parse_url($origin);
    $host = $parsed['host'] ?? '';

    foreach (ALLOWED_DOMAINS as $pattern) {
        // Check for wildcard subdomain pattern.
        if (strpos($pattern, '*.') === 0) {
            $baseDomain = substr($pattern, 2); // Remove "*."
            // Match exact domain or any subdomain.
            if ($host === $baseDomain ||
                substr($host, -strlen('.' . $baseDomain)) === '.' . $baseDomain) {
                return $origin;
            }
        }
        // Check for exact match.
        elseif ($host === $pattern) {
            return $origin;
        }
    }

    return null;
}

/**
 * Resolve domain from request parameters.
 *
 * @return string|null
 */
function qpmResolveDomain(): ?string
{
    $candidates = [
        $_GET['domain'] ?? null,
        $_POST['domain'] ?? null,
    ];

    foreach ($candidates as $candidate) {
        if (!is_string($candidate)) {
            continue;
        }
        $normalized = strtolower(trim($candidate));
        if ($normalized !== '') {
            return $normalized;
        }
    }

    return null;
}

/**
 * Normalize a domain key used for runtime content/config lookup.
 *
 * @param string|null $domain
 * @return string
 */
function qpmNormalizeDomainKey(?string $domain): string
{
    if (!is_string($domain)) {
        return '';
    }
    $normalized = strtolower(trim($domain));
    if ($normalized === '') {
        return '';
    }
    return preg_match('/^[a-z0-9_-]+$/', $normalized) ? $normalized : '';
}

/**
 * Load optional domain-specific runtime config from:
 * data/content/<domain>/domain-config.json
 *
 * @param string|null $domain
 * @return array<string, mixed>
 */
function qpmGetDomainRuntimeConfig(?string $domain = null): array
{
    static $cache = [];

    $normalized = qpmNormalizeDomainKey($domain);
    if ($normalized === '') {
        return [];
    }
    if (array_key_exists($normalized, $cache)) {
        return $cache[$normalized];
    }

    $path = dirname(__DIR__, 2) . '/data/content/' . $normalized . '/domain-config.json';
    if (!is_file($path)) {
        $cache[$normalized] = [];
        return $cache[$normalized];
    }

    $raw = @file_get_contents($path);
    if (!is_string($raw) || trim($raw) === '') {
        $cache[$normalized] = [];
        return $cache[$normalized];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        $cache[$normalized] = [];
        return $cache[$normalized];
    }

    $cache[$normalized] = $decoded;
    return $cache[$normalized];
}

/**
 * Resolve OpenAI API key for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetOpenAIApiKey(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['openai']) && is_array($runtimeConfig['openai'])) {
        $apiKey = $runtimeConfig['openai']['api_key'] ?? '';
        if (is_string($apiKey) && $apiKey !== '') {
            return $apiKey;
        }
    }

    if (!empty($domain) && defined('OPENAI_DOMAIN_CREDENTIALS') && is_array(OPENAI_DOMAIN_CREDENTIALS)) {
        $domainConfig = OPENAI_DOMAIN_CREDENTIALS[$domain] ?? null;
        if (is_array($domainConfig)) {
            $apiKey = $domainConfig['api_key'] ?? '';
            if (is_string($apiKey) && $apiKey !== '') {
                return $apiKey;
            }
        }
    }

    return OPENAI_API_KEY;
}

/**
 * Resolve OpenAI organization id for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetOpenAIOrgId(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['openai']) && is_array($runtimeConfig['openai'])) {
        $orgId = $runtimeConfig['openai']['org_id'] ?? '';
        if (is_string($orgId) && $orgId !== '') {
            return $orgId;
        }
    }

    if (!empty($domain) && defined('OPENAI_DOMAIN_CREDENTIALS') && is_array(OPENAI_DOMAIN_CREDENTIALS)) {
        $domainConfig = OPENAI_DOMAIN_CREDENTIALS[$domain] ?? null;
        if (is_array($domainConfig)) {
            $orgId = $domainConfig['org_id'] ?? '';
            if (is_string($orgId) && $orgId !== '') {
                return $orgId;
            }
        }
    }

    return defined('OPENAI_ORG_ID') ? OPENAI_ORG_ID : '';
}

/**
 * Resolve OpenAI API URL for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetOpenAIApiUrl(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['openai']) && is_array($runtimeConfig['openai'])) {
        $apiUrl = $runtimeConfig['openai']['api_url'] ?? '';
        if (is_string($apiUrl) && $apiUrl !== '') {
            return $apiUrl;
        }
    }

    return OPENAI_API_URL;
}

/**
 * Resolve OpenAlex API key for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetOpenAlexApiKey(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['openalex']) && is_array($runtimeConfig['openalex'])) {
        $apiKey = $runtimeConfig['openalex']['api_key'] ?? '';
        if (is_string($apiKey) && $apiKey !== '') {
            return $apiKey;
        }
    }

    return defined('OPENALEX_API_KEY') ? OPENALEX_API_KEY : '';
}

/**
 * Resolve OpenAlex contact email for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetOpenAlexEmail(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['openalex']) && is_array($runtimeConfig['openalex'])) {
        $email = $runtimeConfig['openalex']['email'] ?? '';
        if (is_string($email) && $email !== '') {
            return $email;
        }
    }

    return defined('OPENALEX_EMAIL') ? OPENALEX_EMAIL : '';
}

/**
 * Resolve NLM API key for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetNlmApiKey(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['nlm']) && is_array($runtimeConfig['nlm'])) {
        $apiKey = $runtimeConfig['nlm']['api_key'] ?? '';
        if (is_string($apiKey) && $apiKey !== '') {
            return $apiKey;
        }
    }

    if (!empty($domain) && defined('NLM_DOMAIN_CREDENTIALS') && is_array(NLM_DOMAIN_CREDENTIALS)) {
        $domainConfig = NLM_DOMAIN_CREDENTIALS[$domain] ?? null;
        if (is_array($domainConfig)) {
            $apiKey = $domainConfig['api_key'] ?? '';
            if (is_string($apiKey) && $apiKey !== '') {
                return $apiKey;
            }
        }
    }

    return NLM_API_KEY;
}

/**
 * Resolve NLM email for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetNlmEmail(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['nlm']) && is_array($runtimeConfig['nlm'])) {
        $email = $runtimeConfig['nlm']['email'] ?? '';
        if (is_string($email) && $email !== '') {
            return $email;
        }
    }

    if (!empty($domain) && defined('NLM_DOMAIN_CREDENTIALS') && is_array(NLM_DOMAIN_CREDENTIALS)) {
        $domainConfig = NLM_DOMAIN_CREDENTIALS[$domain] ?? null;
        if (is_array($domainConfig)) {
            $email = $domainConfig['email'] ?? '';
            if (is_string($email) && $email !== '') {
                return $email;
            }
        }
    }

    return NLM_EMAIL;
}

/**
 * Resolve NLM base URL for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetNlmBaseUrl(?string $domain = null): string
{
    return NLM_BASE_URL;
}

/**
 * Resolve Unpaywall email for domain with default fallback.
 *
 * @param string|null $domain
 * @return string
 */
function qpmGetUnpaywallEmail(?string $domain = null): string
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['unpaywall']) && is_array($runtimeConfig['unpaywall'])) {
        $email = $runtimeConfig['unpaywall']['email'] ?? '';
        if (is_string($email) && $email !== '') {
            return $email;
        }
    }

    if (!empty($domain) && defined('UNPAYWALL_DOMAIN_CREDENTIALS') && is_array(UNPAYWALL_DOMAIN_CREDENTIALS)) {
        $domainConfig = UNPAYWALL_DOMAIN_CREDENTIALS[$domain] ?? null;
        if (is_array($domainConfig)) {
            $email = $domainConfig['email'] ?? '';
            if (is_string($email) && $email !== '') {
                return $email;
            }
        }
    }

    return defined('UNPAYWALL_EMAIL') ? (string) UNPAYWALL_EMAIL : '';
}

/**
 * Normalize a configured translation/search source key.
 *
 * @param mixed $value
 * @return string|null
 */
function qpmNormalizeTranslationSourceKey($value): ?string
{
    if (!is_string($value)) {
        return null;
    }
    $normalized = strtolower(trim($value));
    if ($normalized === '') {
        return null;
    }

    $aliasMap = [
        'pubmed' => 'pubmed',
        'pubmedbestmatch' => 'pubmedBestMatch',
        'pubmed-best-match' => 'pubmedBestMatch',
        'pubmed_best_match' => 'pubmedBestMatch',
        'semanticscholar' => 'semanticScholar',
        'semantic-scholar' => 'semanticScholar',
        'semantic_scholar' => 'semanticScholar',
        'openalex' => 'openAlex',
        'open-alex' => 'openAlex',
        'open_alex' => 'openAlex',
        'elicit' => 'elicit',
    ];

    return $aliasMap[$normalized] ?? null;
}

/**
 * Resolve a configured semantic source limit from backend config.
 *
 * @param mixed $sourceKey
 * @param int $default
 * @return int
 */
function qpmGetSemanticSourceLimit($sourceKey, int $default): int
{
    $normalizedSourceKey = qpmNormalizeTranslationSourceKey($sourceKey);
    $fallback = $default > 0 ? $default : 1;
    if (
        $normalizedSourceKey === null ||
        !defined('QPM_SEMANTIC_SOURCE_LIMITS') ||
        !is_array(QPM_SEMANTIC_SOURCE_LIMITS)
    ) {
        return $fallback;
    }

    $configured = QPM_SEMANTIC_SOURCE_LIMITS[$normalizedSourceKey] ?? null;
    $resolved = is_numeric($configured) ? (int) $configured : $fallback;
    return $resolved > 0 ? $resolved : $fallback;
}

/**
 * Resolve frontend-safe translation/search source defaults from runtime config.
 *
 * Supported runtime keys:
 * - search.translation_sources
 * - features.translation_sources
 *
 * @param string|null $domain
 * @return array<int, string>
 */
function qpmGetDomainTranslationSources(?string $domain = null): array
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    $candidates = [];

    if (isset($runtimeConfig['search']) && is_array($runtimeConfig['search'])) {
        $candidates[] = $runtimeConfig['search']['translation_sources'] ?? null;
    }
    if (isset($runtimeConfig['features']) && is_array($runtimeConfig['features'])) {
        $candidates[] = $runtimeConfig['features']['translation_sources'] ?? null;
    }

    foreach ($candidates as $candidate) {
        if (!is_array($candidate)) {
            continue;
        }
        $normalized = [];
        foreach ($candidate as $entry) {
            $sourceKey = qpmNormalizeTranslationSourceKey($entry);
            if ($sourceKey !== null) {
                $normalized[$sourceKey] = true;
            }
        }
        return array_values(array_keys($normalized));
    }

    return [];
}

/**
 * Check whether runtime config explicitly defines translation/search sources.
 *
 * @param string|null $domain
 * @return bool
 */
function qpmHasDomainTranslationSourcesConfig(?string $domain = null): bool
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    if (isset($runtimeConfig['search']) && is_array($runtimeConfig['search'])) {
        if (array_key_exists('translation_sources', $runtimeConfig['search'])) {
            return is_array($runtimeConfig['search']['translation_sources']);
        }
    }
    if (isset($runtimeConfig['features']) && is_array($runtimeConfig['features'])) {
        if (array_key_exists('translation_sources', $runtimeConfig['features'])) {
            return is_array($runtimeConfig['features']['translation_sources']);
        }
    }

    return false;
}

/**
 * Resolve the best-effort client IP for the current request.
 *
 * Uses REMOTE_ADDR by default. If QPM_ELICIT_UNLOCK['trust_forwarded_for'] is true
 * the first entry from X-Forwarded-For is honored (only enable behind a trusted proxy).
 *
 * @return string
 */
function qpmGetClientIp(): string
{
    $trustForwarded = false;
    if (defined('QPM_ELICIT_UNLOCK') && is_array(QPM_ELICIT_UNLOCK)) {
        $trustForwarded = !empty(QPM_ELICIT_UNLOCK['trust_forwarded_for']);
    }
    if ($trustForwarded && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
        $candidate = trim($parts[0] ?? '');
        if ($candidate !== '') {
            return $candidate;
        }
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    return is_string($ip) ? trim($ip) : '';
}

/**
 * Check whether an IP matches a pattern. Pattern may be a plain IP or a CIDR
 * range (IPv4 or IPv6).
 */
function qpmIpMatchesPattern(string $ip, string $pattern): bool
{
    $pattern = trim($pattern);
    if ($pattern === '' || $ip === '') {
        return false;
    }
    if (strpos($pattern, '/') === false) {
        return $ip === $pattern;
    }
    [$subnet, $bitsRaw] = explode('/', $pattern, 2);
    $bits = (int) $bitsRaw;
    $ipBin = @inet_pton($ip);
    $subnetBin = @inet_pton(trim($subnet));
    if ($ipBin === false || $subnetBin === false) {
        return false;
    }
    if (strlen($ipBin) !== strlen($subnetBin)) {
        return false;
    }
    $maxBits = strlen($ipBin) * 8;
    if ($bits < 0 || $bits > $maxBits) {
        return false;
    }
    $byteLen = intdiv($bits, 8);
    $bitLen = $bits % 8;
    if ($byteLen > 0 && substr($ipBin, 0, $byteLen) !== substr($subnetBin, 0, $byteLen)) {
        return false;
    }
    if ($bitLen === 0) {
        return true;
    }
    $mask = chr((0xFF << (8 - $bitLen)) & 0xFF);
    return (ord($ipBin[$byteLen]) & ord($mask)) === (ord($subnetBin[$byteLen]) & ord($mask));
}

/**
 * Returns true when QPM_ELICIT_UNLOCK contains at least one IP pattern or a
 * non-empty code. When this is true, Elicit is considered "gated": it is only
 * offered to clients whose IP or code matches the config. When it is false
 * (no gating configured), Elicit is offered based on the regular domain
 * translation_sources only.
 */
function qpmIsElicitUnlockConfigured(): bool
{
    if (!defined('QPM_ELICIT_UNLOCK') || !is_array(QPM_ELICIT_UNLOCK)) {
        return false;
    }
    $cfg = QPM_ELICIT_UNLOCK;
    $hasIps = !empty($cfg['ips']) && is_array($cfg['ips']);
    $hasCode = !empty(qpmGetElicitUnlockCodes());
    return $hasIps || $hasCode;
}

/**
 * Normalises the QPM_ELICIT_UNLOCK 'code' entry into a list of non-empty
 * codes. The config value may be a single string (legacy single-code form) or
 * an array of strings (multiple codes, any of which unlock Elicit).
 *
 * @return array<int, string>
 */
function qpmGetElicitUnlockCodes(): array
{
    if (!defined('QPM_ELICIT_UNLOCK') || !is_array(QPM_ELICIT_UNLOCK)) {
        return [];
    }
    $raw = QPM_ELICIT_UNLOCK['code'] ?? null;
    if ($raw === null) {
        return [];
    }
    $values = is_array($raw) ? $raw : [$raw];
    $codes = [];
    foreach ($values as $value) {
        if (!is_string($value)) {
            continue;
        }
        $trimmed = trim($value);
        if ($trimmed !== '') {
            $codes[] = $trimmed;
        }
    }
    return $codes;
}

/**
 * Decide whether Elicit should be force-unlocked for the current request.
 *
 * Returns true when QPM_ELICIT_UNLOCK is configured and either:
 *   - the client IP matches an entry in 'ips' (plain IPs or CIDR ranges), or
 *   - the provided code matches any entry in 'code' (constant-time compare).
 *     'code' may be a single string or an array of strings.
 */
function qpmIsElicitUnlocked(?string $providedCode = null): bool
{
    if (!defined('QPM_ELICIT_UNLOCK') || !is_array(QPM_ELICIT_UNLOCK)) {
        return false;
    }
    $config = QPM_ELICIT_UNLOCK;

    $code = is_string($providedCode) ? trim($providedCode) : '';
    if ($code !== '') {
        foreach (qpmGetElicitUnlockCodes() as $expectedCode) {
            if (hash_equals($expectedCode, $code)) {
                return true;
            }
        }
    }

    $ips = isset($config['ips']) && is_array($config['ips']) ? $config['ips'] : [];
    if (!empty($ips)) {
        $clientIp = qpmGetClientIp();
        if ($clientIp !== '') {
            foreach ($ips as $pattern) {
                if (is_string($pattern) && qpmIpMatchesPattern($clientIp, $pattern)) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Resolve domain theme overrides from runtime config.
 *
 * @param string|null $domain
 * @return array<string, string>
 */
function qpmGetDomainThemeOverrides(?string $domain = null): array
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    $overrides = $runtimeConfig['theme_overrides'] ?? null;
    if (!is_array($overrides)) {
        return [];
    }

    $result = [];
    foreach ($overrides as $key => $value) {
        if (!is_string($key) || !is_string($value)) {
            continue;
        }
        $trimmedKey = trim($key);
        $trimmedValue = trim($value);
        if ($trimmedKey === '' || $trimmedValue === '') {
            continue;
        }
        $result[$trimmedKey] = $trimmedValue;
    }

    return $result;
}

/**
 * Normalize class token list from string or array input.
 *
 * @param mixed $value
 * @return array<int, string>
 */
function qpmNormalizeClassTokenList($value): array
{
    $tokens = [];
    if (is_string($value)) {
        $tokens = preg_split('/\s+/', trim($value)) ?: [];
    } elseif (is_array($value)) {
        foreach ($value as $entry) {
            if (!is_string($entry)) {
                continue;
            }
            $parts = preg_split('/\s+/', trim($entry)) ?: [];
            foreach ($parts as $part) {
                $tokens[] = $part;
            }
        }
    } else {
        return [];
    }

    $normalized = [];
    foreach ($tokens as $token) {
        if (!is_string($token)) {
            continue;
        }
        $className = trim($token);
        if ($className === '') {
            continue;
        }
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $className)) {
            continue;
        }
        $normalized[] = $className;
    }

    return array_values(array_unique($normalized));
}

/**
 * Normalize class overrides map.
 *
 * Shape:
 * {
 *   "qpm_pubmedLink": { "mode": "append|replace", "classes": "class-a class-b" }
 * }
 *
 * @param mixed $overrides
 * @return array<string, array{mode: string, classes: array<int, string>}>
 */
function qpmNormalizeClassOverridesMap($overrides): array
{
    if (!is_array($overrides)) {
        return [];
    }

    $result = [];
    foreach ($overrides as $baseClass => $rawRule) {
        if (!is_string($baseClass)) {
            continue;
        }
        $normalizedBaseClass = trim($baseClass);
        if ($normalizedBaseClass === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $normalizedBaseClass)) {
            continue;
        }

        $mode = 'append';
        $classes = [];
        if (is_string($rawRule)) {
            $classes = qpmNormalizeClassTokenList($rawRule);
        } elseif (is_array($rawRule)) {
            $isList = function_exists('array_is_list')
                ? array_is_list($rawRule)
                : ($rawRule === [] || array_keys($rawRule) === range(0, count($rawRule) - 1));
            if ($isList) {
                $classes = qpmNormalizeClassTokenList($rawRule);
            } else {
                $rawMode = strtolower(trim((string) ($rawRule['mode'] ?? 'append')));
                if ($rawMode === 'replace') {
                    $mode = 'replace';
                }
                $classes = qpmNormalizeClassTokenList(
                    $rawRule['classes'] ?? ($rawRule['class_list'] ?? ($rawRule['class'] ?? ''))
                );
            }
        } else {
            continue;
        }

        if ($mode === 'append' && empty($classes)) {
            continue;
        }

        $result[$normalizedBaseClass] = [
            'mode' => $mode,
            'classes' => $classes,
        ];
    }

    return $result;
}

/**
 * Resolve domain class overrides from runtime config.
 *
 * @param string|null $domain
 * @return array<string, array{mode: string, classes: array<int, string>}>
 */
function qpmGetDomainClassOverrides(?string $domain = null): array
{
    $runtimeConfig = qpmGetDomainRuntimeConfig($domain);
    return qpmNormalizeClassOverridesMap($runtimeConfig['class_overrides'] ?? null);
}

/**
 * Global request throttle using file lock.
 * Limits outbound requests per namespace to approximately maxPerSecond.
 *
 * @param string $namespace
 * @param int $maxPerSecond
 * @return void
 */
function qpmThrottleRequestRate(string $namespace, int $maxPerSecond = 10): void
{
    if ($maxPerSecond < 1) {
        $maxPerSecond = 1;
    }

    $normalizedNamespace = preg_replace('/[^a-z0-9_-]+/i', '_', trim($namespace));
    if ($normalizedNamespace === '' || $normalizedNamespace === null) {
        $normalizedNamespace = 'default';
    }
    $lockPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'qpm_' . $normalizedNamespace . '_rate_limit.lock';
    $intervalUs = (int) floor(1000000 / $maxPerSecond);

    $fp = @fopen($lockPath, 'c+');
    if ($fp === false) {
        // Fail-open to avoid breaking requests if filesystem is unavailable.
        return;
    }

    try {
        if (!flock($fp, LOCK_EX)) {
            fclose($fp);
            return;
        }

        rewind($fp);
        $raw = stream_get_contents($fp);
        $lastTimeUs = is_string($raw) && trim($raw) !== '' ? (int) trim($raw) : 0;
        $nowUs = (int) floor(microtime(true) * 1000000);
        $nextAllowedUs = $lastTimeUs + $intervalUs;

        if ($nowUs < $nextAllowedUs) {
            usleep($nextAllowedUs - $nowUs);
            $nowUs = (int) floor(microtime(true) * 1000000);
        }

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string) $nowUs);
        fflush($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }
}

/**
 * Global NLM request throttle using file lock.
 * Limits outbound requests from this server to approximately maxPerSecond.
 *
 * @param int $maxPerSecond
 * @return void
 */
function qpmThrottleNlmRequests(int $maxPerSecond = 10): void
{
    qpmThrottleRequestRate('nlm', $maxPerSecond);
}

/**
 * HTTP request helper with cURL + stream fallback.
 *
 * @param string $url
 * @param array $options
 * @return array{ok: bool, status: int, body: string, content_type: string, error: string, response_headers: array<int,string>}
 */
function qpmHttpRequest(string $url, array $options = []): array
{
    $method = strtoupper((string) ($options['method'] ?? 'GET'));
    $headers = $options['headers'] ?? [];
    $timeout = (int) ($options['timeout'] ?? 30);
    $userAgent = (string) ($options['user_agent'] ?? 'QuickPubMed/1.0');
    $body = (string) ($options['body'] ?? '');

    if (function_exists('curl_init')) {
        $curlHeaders = [];
        foreach ($headers as $name => $value) {
            if (is_int($name)) {
                $curlHeaders[] = (string) $value;
            } else {
                $curlHeaders[] = $name . ': ' . $value;
            }
        }
        if (!empty($userAgent)) {
            $curlHeaders[] = 'User-Agent: ' . $userAgent;
        }

        $responseHeaders = [];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $curlHeaders,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HEADERFUNCTION => static function ($curl, $line) use (&$responseHeaders) {
                $trimmed = trim((string) $line);
                if ($trimmed !== '') {
                    $responseHeaders[] = $trimmed;
                }
                return strlen((string) $line);
            },
        ]);

        $responseBody = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = (string) (curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?? '');
        $error = curl_errno($ch) ? (string) curl_error($ch) : '';
        curl_close($ch);

        if ($responseBody === false) {
            $responseBody = '';
        }

        return [
            'ok' => $error === '',
            'status' => $status,
            'body' => (string) $responseBody,
            'content_type' => $contentType,
            'error' => $error,
            'response_headers' => $responseHeaders,
        ];
    }

    $headerLines = [];
    foreach ($headers as $name => $value) {
        if (is_int($name)) {
            $headerLines[] = (string) $value;
        } else {
            $headerLines[] = $name . ': ' . $value;
        }
    }
    if (!empty($userAgent)) {
        $headerLines[] = 'User-Agent: ' . $userAgent;
    }

    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headerLines),
            'content' => $body,
            'timeout' => $timeout,
            'ignore_errors' => true,
        ],
    ]);

    $responseBody = @file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $status = 0;
    $contentType = '';

    if (is_array($responseHeaders)) {
        foreach ($responseHeaders as $index => $line) {
            if ($index === 0 && preg_match('/\s(\d{3})\s/', $line, $m)) {
                $status = (int) $m[1];
                continue;
            }
            if (stripos($line, 'Content-Type:') === 0) {
                $contentType = trim(substr($line, strlen('Content-Type:')));
            }
        }
    }

    $error = '';
    if ($responseBody === false) {
        $responseBody = '';
        $error = 'HTTP request failed (stream fallback)';
    }

    return [
        'ok' => $error === '',
        'status' => $status,
        'body' => (string) $responseBody,
        'content_type' => $contentType,
        'error' => $error,
        'response_headers' => is_array($responseHeaders) ? array_values($responseHeaders) : [],
    ];
}

/**
 * Convert raw response headers to a lower-cased map.
 *
 * @param array<int,string> $headers
 * @return array<string,string>
 */
function qpmBuildResponseHeaderMap(array $headers): array
{
    $headerMap = [];
    foreach ($headers as $line) {
        $separatorPos = strpos((string) $line, ':');
        if ($separatorPos === false) {
            continue;
        }
        $name = strtolower(trim(substr((string) $line, 0, $separatorPos)));
        $value = trim(substr((string) $line, $separatorPos + 1));
        if ($name === '') {
            continue;
        }
        if (isset($headerMap[$name]) && $headerMap[$name] !== '' && $value === '') {
            continue;
        }
        $headerMap[$name] = $value;
    }
    return $headerMap;
}

/**
 * Extract the first integer value from a response header.
 *
 * @param mixed $value
 * @return ?int
 */
function qpmParseIntegerHeaderValue($value): ?int
{
    $normalizedValue = trim((string) $value);
    if ($normalizedValue === '') {
        return null;
    }

    if (preg_match('/-?\d+/', $normalizedValue, $matches)) {
        return (int) $matches[0];
    }

    return null;
}

/**
 * Parse rate-limit reset information into ISO datetime and seconds remaining.
 *
 * @param mixed $resetValue
 * @param mixed $retryAfterValue
 * @return array{resetAt: string, resetInSeconds: ?int}
 */
function qpmParseRateLimitResetWindow($resetValue, $retryAfterValue = ''): array
{
    $nowTs = time();
    $targetTs = 0;
    $normalizedResetValue = trim((string) $resetValue);
    $normalizedRetryAfterValue = trim((string) $retryAfterValue);

    if ($normalizedResetValue !== '') {
        $numericReset = qpmParseIntegerHeaderValue($normalizedResetValue);
        if ($numericReset !== null) {
            if ($numericReset > 1000000000000) {
                $targetTs = (int) floor($numericReset / 1000);
            } elseif ($numericReset > 1000000000) {
                $targetTs = $numericReset;
            } elseif ($numericReset > 0) {
                $targetTs = $nowTs + $numericReset;
            }
        } else {
            $parsedTs = strtotime($normalizedResetValue);
            if ($parsedTs !== false) {
                $targetTs = (int) $parsedTs;
            }
        }
    }

    if ($targetTs <= 0 && $normalizedRetryAfterValue !== '') {
        if (preg_match('/^\d+$/', $normalizedRetryAfterValue)) {
            $targetTs = $nowTs + (int) $normalizedRetryAfterValue;
        } else {
            $parsedTs = strtotime($normalizedRetryAfterValue);
            if ($parsedTs !== false) {
                $targetTs = (int) $parsedTs;
            }
        }
    }

    if ($targetTs <= 0) {
        return [
            'resetAt' => '',
            'resetInSeconds' => null,
        ];
    }

    return [
        'resetAt' => gmdate('c', $targetTs),
        'resetInSeconds' => max(0, $targetTs - $nowTs),
    ];
}

/**
 * Return a normalised list of supported semantic source keys for rate limit caching.
 *
 * @return array<int,string>
 */
function qpmGetSourceRateLimitCacheKeys(): array
{
    return ['openAlex', 'semanticScholar', 'elicit'];
}

/**
 * Resolve the filesystem path used for a source's shared rate limit snapshot.
 *
 * @param string $sourceKey
 * @return string
 */
function qpmGetSourceRateLimitCachePath(string $sourceKey): string
{
    $normalized = preg_replace('/[^A-Za-z0-9_-]/', '', trim($sourceKey));
    if (!is_string($normalized) || $normalized === '') {
        $normalized = 'default';
    }
    $runtimeDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'runtime';
    if (!is_dir($runtimeDir)) {
        @mkdir($runtimeDir, 0775, true);
    }
    return $runtimeDir . DIRECTORY_SEPARATOR . 'source-rate-limit-' . $normalized . '.json';
}

/**
 * Persist the latest rate limit snapshot for a source so that visitors who have
 * not yet performed a search can still see the remaining request counts.
 *
 * @param string $sourceKey
 * @param array<string,mixed> $rateLimit
 * @return void
 */
function qpmStoreSourceRateLimitSnapshot(string $sourceKey, array $rateLimit): void
{
    if (empty($rateLimit) || !in_array($sourceKey, qpmGetSourceRateLimitCacheKeys(), true)) {
        return;
    }
    $limitVal = $rateLimit['limit'] ?? null;
    $remainingVal = $rateLimit['remaining'] ?? null;
    $resetAtVal = trim((string) ($rateLimit['resetAt'] ?? ''));
    $resetSecondsVal = $rateLimit['resetInSeconds'] ?? null;
    $statusVal = (int) ($rateLimit['status'] ?? 0);
    $isLimitedVal = !empty($rateLimit['isLimited']);
    if (
        ($limitVal === null || $limitVal === '') &&
        ($remainingVal === null || $remainingVal === '') &&
        $resetAtVal === '' &&
        ($resetSecondsVal === null || $resetSecondsVal === '') &&
        $statusVal <= 0 &&
        !$isLimitedVal
    ) {
        return;
    }
    $payload = [
        'limit' => array_key_exists('limit', $rateLimit) ? $rateLimit['limit'] : null,
        'remaining' => array_key_exists('remaining', $rateLimit) ? $rateLimit['remaining'] : null,
        'resetAt' => isset($rateLimit['resetAt']) ? (string) $rateLimit['resetAt'] : '',
        'resetInSeconds' => array_key_exists('resetInSeconds', $rateLimit) ? $rateLimit['resetInSeconds'] : null,
        'status' => isset($rateLimit['status']) ? (int) $rateLimit['status'] : 0,
        'isLimited' => !empty($rateLimit['isLimited']),
        'updatedAt' => gmdate('c'),
    ];
    $encoded = json_encode($payload);
    if (!is_string($encoded)) {
        return;
    }
    $path = qpmGetSourceRateLimitCachePath($sourceKey);
    $tmpPath = $path . '.tmp';
    if (@file_put_contents($tmpPath, $encoded, LOCK_EX) === false) {
        return;
    }
    @rename($tmpPath, $path);
}

/**
 * Read the cached rate limit snapshot for a source. Returns null when no usable
 * snapshot is stored. The returned `resetInSeconds` is recalculated from
 * `resetAt` so consumers see a live countdown rather than the value captured at
 * write time.
 *
 * @param string $sourceKey
 * @return array<string,mixed>|null
 */
function qpmReadSourceRateLimitSnapshot(string $sourceKey): ?array
{
    if (!in_array($sourceKey, qpmGetSourceRateLimitCacheKeys(), true)) {
        return null;
    }
    $path = qpmGetSourceRateLimitCachePath($sourceKey);
    if (!is_file($path)) {
        return null;
    }
    $raw = @file_get_contents($path);
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return null;
    }

    $resetAt = isset($decoded['resetAt']) ? (string) $decoded['resetAt'] : '';
    $resetInSeconds = null;
    if ($resetAt !== '') {
        $resetTs = strtotime($resetAt);
        if ($resetTs !== false) {
            $resetInSeconds = max(0, $resetTs - time());
        }
    }
    if ($resetInSeconds === null && isset($decoded['resetInSeconds']) && is_numeric($decoded['resetInSeconds'])) {
        $resetInSeconds = max(0, (int) $decoded['resetInSeconds']);
    }

    return [
        'limit' => array_key_exists('limit', $decoded) ? $decoded['limit'] : null,
        'remaining' => array_key_exists('remaining', $decoded) ? $decoded['remaining'] : null,
        'resetAt' => $resetAt,
        'resetInSeconds' => $resetInSeconds,
        'status' => isset($decoded['status']) ? (int) $decoded['status'] : 0,
        'isLimited' => !empty($decoded['isLimited']),
        'updatedAt' => isset($decoded['updatedAt']) ? (string) $decoded['updatedAt'] : '',
    ];
}

/**
 * Read cached rate limit snapshots for all known sources.
 *
 * @return array<string,array<string,mixed>|null>
 */
function qpmReadAllSourceRateLimitSnapshots(): array
{
    $snapshots = [];
    foreach (qpmGetSourceRateLimitCacheKeys() as $sourceKey) {
        $snapshots[$sourceKey] = qpmReadSourceRateLimitSnapshot($sourceKey);
    }
    return $snapshots;
}
