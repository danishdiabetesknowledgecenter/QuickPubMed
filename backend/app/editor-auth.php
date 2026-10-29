<?php
/**
 * Shared auth/session helpers for editor endpoints.
 */

$newConfigPath = dirname(__DIR__) . '/config/config.php';
$legacyConfigPath = dirname(__DIR__) . '/config.php';
if (is_file($newConfigPath)) {
    require_once $newConfigPath;
} else {
    require_once $legacyConfigPath;
}

/**
 * Apply baseline security headers for editor responses.
 */
function editorApplySecurityHeaders(): void
{
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Frame-Options: DENY');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
}

/**
 * Send a JSON response and exit.
 */
function editorJsonResponse(int $statusCode, array $payload): void
{
    editorApplySecurityHeaders();
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Resolve allowed origin for editor endpoints.
 */
function editorResolveAllowedOrigin(string $origin): ?string
{
    if ($origin === '') {
        return null;
    }

    $origin = rtrim($origin, '/');
    $parsedOrigin = parse_url($origin);
    $originScheme = strtolower((string) ($parsedOrigin['scheme'] ?? ''));
    $originHost = strtolower((string) ($parsedOrigin['host'] ?? ''));

    // Primary path: existing shared CORS helper (if available).
    if (function_exists('getAllowedOrigin')) {
        $allowedByDomainRule = getAllowedOrigin($origin);
        if (!empty($allowedByDomainRule)) {
            return rtrim((string) $allowedByDomainRule, '/');
        }
    }

    // Fallback path: direct ALLOWED_DOMAINS host matching.
    if ($originHost !== '' && defined('ALLOWED_DOMAINS') && is_array(ALLOWED_DOMAINS)) {
        foreach (ALLOWED_DOMAINS as $pattern) {
            if (!is_string($pattern)) {
                continue;
            }
            $pattern = strtolower(trim($pattern));
            if ($pattern === '') {
                continue;
            }
            if (strpos($pattern, '*.') === 0) {
                $baseDomain = substr($pattern, 2);
                if ($originHost === $baseDomain || substr($originHost, -strlen('.' . $baseDomain)) === '.' . $baseDomain) {
                    return $origin;
                }
                continue;
            }
            if ($originHost === $pattern) {
                return $origin;
            }
        }
    }

    if (defined('EDITOR_ALLOWED_ORIGINS') && is_array(EDITOR_ALLOWED_ORIGINS)) {
        foreach (EDITOR_ALLOWED_ORIGINS as $allowed) {
            if (!is_string($allowed)) {
                continue;
            }
            $allowed = rtrim(trim($allowed), '/');
            if ($allowed === '') {
                continue;
            }
            if ($allowed === $origin) {
                return $origin;
            }
            // Support explicit wildcard origin patterns, e.g. https://*.example.com
            if (preg_match('#^(https?)://\*\.([a-z0-9.-]+)$#i', $allowed, $m)) {
                $allowedScheme = strtolower($m[1]);
                $allowedBaseHost = strtolower($m[2]);
                if (
                    $originScheme === $allowedScheme &&
                    ($originHost === $allowedBaseHost || substr($originHost, -strlen('.' . $allowedBaseHost)) === '.' . $allowedBaseHost)
                ) {
                    return $origin;
                }
            }
        }
    }

    return null;
}

/**
 * Apply CORS headers with credentials support for allowed origins.
 */
function editorApplyCorsHeaders(bool $enforceAllowedOrigin = true): void
{
    editorApplySecurityHeaders();

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
        $parsed = parse_url($_SERVER['HTTP_REFERER']);
        $origin = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
    }

    $allowedOrigin = editorResolveAllowedOrigin($origin);
    if ($origin !== '' && empty($allowedOrigin) && $enforceAllowedOrigin) {
        editorJsonResponse(403, ['error' => 'Origin is not allowed']);
    }

    if (!empty($allowedOrigin)) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Max-Age: 86400');
}

/**
 * Handle OPTIONS preflight.
 */
function editorHandlePreflight(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        editorApplySecurityHeaders();
        http_response_code(200);
        exit;
    }
}

/**
 * Require a specific HTTP method.
 */
function editorRequireMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        editorJsonResponse(405, ['error' => 'Method not allowed']);
    }
}

/**
 * Connection address that is allowed to assert X-Forwarded-Proto.
 * Loopback and private addresses cover an on-host or internal proxy.
 * Public proxy addresses must be listed in EDITOR_TRUSTED_PROXIES.
 */
function editorForwardedProtoIsTrusted(): bool
{
    $remoteAddr = trim((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    if ($remoteAddr === '') {
        return false;
    }

    if (defined('EDITOR_TRUSTED_PROXIES') && is_array(EDITOR_TRUSTED_PROXIES)) {
        foreach (EDITOR_TRUSTED_PROXIES as $proxy) {
            if (is_string($proxy) && trim($proxy) === $remoteAddr) {
                return true;
            }
        }
    }

    if (filter_var($remoteAddr, FILTER_VALIDATE_IP) === false) {
        return false;
    }

    return filter_var(
        $remoteAddr,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ) === false;
}

/**
 * Check whether request uses HTTPS (directly or via a trusted reverse proxy).
 */
function editorIsHttpsRequest(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    if (!editorForwardedProtoIsTrusted()) {
        return false;
    }

    $forwardedProto = strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
    return $forwardedProto === 'https';
}

/**
 * Enforce HTTPS for editor endpoints when enabled.
 */
function editorRequireHttps(): void
{
    if (defined('EDITOR_REQUIRE_HTTPS') && EDITOR_REQUIRE_HTTPS && !editorIsHttpsRequest()) {
        editorJsonResponse(400, ['error' => 'HTTPS is required']);
    }
}

/**
 * Start session with secure defaults.
 */
function editorStartSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isSecure = editorIsHttpsRequest();
    $sameSite = 'Lax';
    if (defined('EDITOR_COOKIE_SAMESITE') && is_string(EDITOR_COOKIE_SAMESITE)) {
        $candidate = ucfirst(strtolower(trim(EDITOR_COOKIE_SAMESITE)));
        if (in_array($candidate, ['Lax', 'Strict', 'None'], true)) {
            $sameSite = $candidate;
        }
    }
    if ($sameSite === 'None') {
        // Browsers require Secure when SameSite=None.
        $isSecure = true;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => $sameSite,
    ]);
    session_name('MUGIN_EDITOR_SESSION');
    session_start();
}

/**
 * Read request payload from JSON or form body.
 */
function editorReadInput(): array
{
    $maxRequestBytes = defined('EDITOR_MAX_REQUEST_BYTES') ? (int) EDITOR_MAX_REQUEST_BYTES : (2 * 1024 * 1024);
    $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (int) $_SERVER['CONTENT_LENGTH'] : 0;
    if ($contentLength > 0 && $contentLength > $maxRequestBytes) {
        editorJsonResponse(413, ['error' => 'Request body too large']);
    }

    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        if (strlen($raw) > $maxRequestBytes) {
            editorJsonResponse(413, ['error' => 'Request body too large']);
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    if (!empty($_POST)) {
        return $_POST;
    }

    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        parse_str($raw, $parsed);
        return is_array($parsed) ? $parsed : [];
    }

    return [];
}

/**
 * Session timeout enforcement.
 */
function editorEnforceSessionTimeout(): void
{
    $timeout = defined('EDITOR_SESSION_TIMEOUT') ? (int) EDITOR_SESSION_TIMEOUT : 1800;
    if (!isset($_SESSION['editor_last_activity'])) {
        $_SESSION['editor_last_activity'] = time();
        return;
    }

    if ((time() - (int) $_SESSION['editor_last_activity']) > $timeout) {
        $_SESSION = [];
        session_destroy();
        editorJsonResponse(401, ['error' => 'Session expired']);
    }

    $_SESSION['editor_last_activity'] = time();
}

/**
 * Ensure CSRF token exists and return it.
 */
function editorEnsureCsrfToken(): string
{
    if (empty($_SESSION['editor_csrf_token'])) {
        $_SESSION['editor_csrf_token'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['editor_csrf_token'];
}

/**
 * Rotate CSRF token and return the new token.
 */
function editorRotateCsrfToken(): string
{
    $_SESSION['editor_csrf_token'] = bin2hex(random_bytes(32));
    return (string) $_SESSION['editor_csrf_token'];
}

/**
 * Validate CSRF token for state-changing requests.
 */
function editorValidateCsrfToken(?string $token): void
{
    $sessionToken = $_SESSION['editor_csrf_token'] ?? '';
    if (!$token || !$sessionToken || !hash_equals($sessionToken, $token)) {
        editorJsonResponse(403, ['error' => 'Invalid CSRF token']);
    }
}

/**
 * Return file path for login throttling data.
 */
function editorRateLimitFilePath(): string
{
    return editorRuntimeDir() . '/editor-login-rate-limit.json';
}

/**
 * Read and optionally write the login counter while holding an exclusive lock.
 * A missing or unlockable store is treated as empty, matching the previous fail-open path.
 *
 * @param callable(array): array{data: array, write: bool, value: mixed} $mutator
 * @return mixed
 */
function editorUpdateRateLimitData(callable $mutator, bool $createIfMissing)
{
    $path = editorRateLimitFilePath();
    if (!$createIfMissing && !is_file($path)) {
        $update = $mutator([]);
        return $update['value'];
    }

    $fp = @fopen($path, $createIfMissing ? 'c+' : 'r+');
    if ($fp === false) {
        $update = $mutator([]);
        return $update['value'];
    }

    $locked = false;
    try {
        if (!flock($fp, LOCK_EX)) {
            $update = $mutator([]);
            return $update['value'];
        }
        $locked = true;
        rewind($fp);
        $raw = stream_get_contents($fp);
        $data = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $update = $mutator($data);
        if (!empty($update['write']) && is_array($update['data'])) {
            $json = json_encode($update['data'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json !== false) {
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, $json);
                fflush($fp);
            }
        }
        return $update['value'];
    } finally {
        if ($locked) {
            flock($fp, LOCK_UN);
        }
        fclose($fp);
    }
}

/**
 * Check current rate limit state.
 */
function editorIsRateLimited(string $key, int $maxAttempts = 8, int $windowSeconds = 900): array
{
    return editorUpdateRateLimitData(static function (array $data) use ($key, $maxAttempts, $windowSeconds): array {
        $now = time();
        $entry = $data[$key] ?? ['count' => 0, 'first_attempt' => $now];
        $firstAttempt = (int) ($entry['first_attempt'] ?? $now);
        $count = (int) ($entry['count'] ?? 0);

        if (($now - $firstAttempt) > $windowSeconds) {
            $value = ['limited' => false, 'retry_after' => 0];
        } elseif ($count >= $maxAttempts) {
            $value = ['limited' => true, 'retry_after' => max(1, $windowSeconds - ($now - $firstAttempt))];
        } else {
            $value = ['limited' => false, 'retry_after' => 0];
        }

        return ['data' => $data, 'write' => false, 'value' => $value];
    }, false);
}

/**
 * Register failed login attempt.
 */
function editorRegisterFailedAttempt(string $key): void
{
    editorUpdateRateLimitData(static function (array $data) use ($key): array {
        $now = time();
        $entry = $data[$key] ?? ['count' => 0, 'first_attempt' => $now];
        $firstAttempt = (int) ($entry['first_attempt'] ?? $now);

        if (($now - $firstAttempt) > 900) {
            $entry = ['count' => 1, 'first_attempt' => $now];
        } else {
            $entry['count'] = (int) ($entry['count'] ?? 0) + 1;
        }

        $data[$key] = $entry;
        return ['data' => $data, 'write' => true, 'value' => null];
    }, true);
}

/**
 * Reset failed attempts after successful login.
 */
function editorResetFailedAttempts(string $key): void
{
    editorUpdateRateLimitData(static function (array $data) use ($key): array {
        if (!isset($data[$key])) {
            return ['data' => $data, 'write' => false, 'value' => null];
        }
        unset($data[$key]);
        return ['data' => $data, 'write' => true, 'value' => null];
    }, false);
}

/**
 * Resolve client IP and forwarding chain.
 *
 * @return array{ip: string, chain: string}
 */
function editorResolveClientAddress(): array
{
    $remoteAddr = trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $forwardedFor = trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
    $chain = $forwardedFor !== '' ? $forwardedFor : $remoteAddr;
    $ip = $remoteAddr;

    if ($forwardedFor !== '') {
        $parts = array_map('trim', explode(',', $forwardedFor));
        if (!empty($parts[0])) {
            $ip = $parts[0];
        }
    }

    return ['ip' => $ip, 'chain' => $chain];
}

/**
 * Build throttling fingerprint from the connection address only.
 * X-Forwarded-For stays in the audit log via editorResolveClientAddress(),
 * but it must not mint a fresh login counter.
 */
function editorBuildRateLimitKey(string $username): string
{
    $remoteAddr = trim((string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    return hash('sha256', strtolower(trim($username)) . '|' . $remoteAddr);
}

/**
 * Normalize domain list.
 */
function editorNormalizeDomainsList($value): array
{
    if (!is_array($value)) {
        return [];
    }
    $domains = [];
    foreach ($value as $domain) {
        if (!is_string($domain)) {
            continue;
        }
        $normalized = strtolower(trim($domain));
        if ($normalized !== '' && preg_match('/^[a-z0-9_-]+$/', $normalized)) {
            $domains[] = $normalized;
        }
    }
    return array_values(array_unique($domains));
}

/**
 * Resolve configured editor users with legacy fallback.
 *
 * @return array<string, array{username: string, password_hash: string, allowed_domains: array<int, string>, can_edit_limits: bool, disabled: bool}>
 */
function editorConfiguredUsers(): array
{
    $users = [];
    if (defined('EDITOR_USERS') && is_array(EDITOR_USERS)) {
        foreach (EDITOR_USERS as $username => $userConfig) {
            if (!is_array($userConfig)) {
                continue;
            }
            $name = is_string($username) ? trim($username) : '';
            if ($name === '' && isset($userConfig['username']) && is_string($userConfig['username'])) {
                $name = trim($userConfig['username']);
            }
            if ($name === '') {
                continue;
            }
            $passwordHash = (string) ($userConfig['password_hash'] ?? '');
            if ($passwordHash === '') {
                continue;
            }
            $users[$name] = [
                'username' => $name,
                'password_hash' => $passwordHash,
                'allowed_domains' => editorNormalizeDomainsList($userConfig['allowed_domains'] ?? []),
                'can_edit_limits' => !empty($userConfig['can_edit_limits']),
                'disabled' => !empty($userConfig['disabled']),
            ];
        }
    }

    if (!empty($users)) {
        return $users;
    }

    if (defined('EDITOR_USER') && defined('EDITOR_PASSWORD_HASH')) {
        $legacyUser = trim((string) EDITOR_USER);
        $legacyHash = (string) EDITOR_PASSWORD_HASH;
        if ($legacyUser !== '' && $legacyHash !== '') {
            $allowedDomains = [];
            if (defined('EDITOR_ALLOWED_CONTENT_DOMAINS') && is_array(EDITOR_ALLOWED_CONTENT_DOMAINS)) {
                $allowedDomains = editorNormalizeDomainsList(EDITOR_ALLOWED_CONTENT_DOMAINS);
            }
            $users[$legacyUser] = [
                'username' => $legacyUser,
                'password_hash' => $legacyHash,
                'allowed_domains' => $allowedDomains,
                'can_edit_limits' => true,
                'disabled' => false,
            ];
        }
    }

    return $users;
}

/**
 * Hash used only so a missing user takes the same password_verify cost as a real one.
 * A configured editor hash is preferred, because its cost matches this installation.
 */
function editorTimingPasswordHash(array $users): string
{
    foreach ($users as $user) {
        if (!is_array($user)) {
            continue;
        }
        $hash = (string) ($user['password_hash'] ?? '');
        if ($hash !== '') {
            return $hash;
        }
    }

    return '$2y$12$VsHuvhAHUfmEsKiS5bqlQOz27WxPBmDliEzhK.tgM1MId3puIdwhK';
}

/**
 * Verify user credentials.
 *
 * @return array{ok: bool, user: ?array<string, mixed>}
 */
function editorAuthenticateCredentials(string $username, string $password): array
{
    $users = editorConfiguredUsers();
    $knownUser = (isset($users[$username]) && is_array($users[$username])) ? $users[$username] : null;
    $ownHash = is_array($knownUser) ? (string) ($knownUser['password_hash'] ?? '') : '';
    $verifyHash = $ownHash !== '' ? $ownHash : editorTimingPasswordHash($users);
    $passwordMatches = $verifyHash !== '' && password_verify($password, $verifyHash);
    $disabled = is_array($knownUser) && !empty($knownUser['disabled']);

    if (!is_array($knownUser) || $disabled || $ownHash === '' || !$passwordMatches) {
        return ['ok' => false, 'user' => null];
    }

    return ['ok' => true, 'user' => $knownUser];
}

/**
 * Store authenticated user context in session.
 */
function editorSetSessionUser(array $user): void
{
    $_SESSION['editor_authenticated'] = true;
    $_SESSION['editor_user'] = (string) ($user['username'] ?? '');
    $_SESSION['editor_allowed_domains'] = editorNormalizeDomainsList($user['allowed_domains'] ?? []);
    $_SESSION['editor_can_edit_limits'] = !empty($user['can_edit_limits']);
    $_SESSION['editor_last_activity'] = time();
}

/**
 * Return authenticated user context from session.
 *
 * @return array{username: string, allowed_domains: array<int, string>, can_edit_limits: bool}|null
 */
function editorGetAuthenticatedUser(): ?array
{
    if (empty($_SESSION['editor_authenticated']) || $_SESSION['editor_authenticated'] !== true) {
        return null;
    }
    return [
        'username' => (string) ($_SESSION['editor_user'] ?? ''),
        'allowed_domains' => editorNormalizeDomainsList($_SESSION['editor_allowed_domains'] ?? []),
        'can_edit_limits' => !empty($_SESSION['editor_can_edit_limits']),
    ];
}

/**
 * Return allowed domains for current authenticated user.
 *
 * @return array<int, string>
 */
function editorAllowedDomainsForCurrentUser(): array
{
    $user = editorGetAuthenticatedUser();
    if (!$user) {
        return [];
    }
    return $user['allowed_domains'];
}

/**
 * Check if current user can edit limits.
 */
function editorCanEditLimits(): bool
{
    $user = editorGetAuthenticatedUser();
    return $user ? (bool) $user['can_edit_limits'] : false;
}

/**
 * Check if current user can edit/read a specific topics domain.
 */
function editorCanEditDomain(string $domain): bool
{
    $normalized = strtolower(trim($domain));
    if ($normalized === '' || !preg_match('/^[a-z0-9_-]+$/', $normalized)) {
        return false;
    }
    $allowed = editorAllowedDomainsForCurrentUser();
    if (empty($allowed)) {
        return true;
    }
    return in_array($normalized, $allowed, true);
}

/**
 * Require authenticated editor session.
 */
function editorRequireAuth(): void
{
    editorStartSession();
    editorEnforceSessionTimeout();

    if (empty($_SESSION['editor_authenticated']) || $_SESSION['editor_authenticated'] !== true) {
        editorJsonResponse(401, ['error' => 'Unauthorized']);
    }
}

/**
 * Get runtime directory used for editor internal files.
 */
function editorRuntimeDir(): string
{
    require_once __DIR__ . '/file-cache.php';
    return muginEnsureDataSubdir('runtime');
}

/**
 * Return audit log file path for current day.
 */
function editorAuditLogPath(): string
{
    return editorRuntimeDir() . '/editor-audit-' . gmdate('Y-m-d') . '.log';
}

/**
 * Rotate audit files by retention policy.
 */
function editorRotateAuditLogs(): void
{
    $retentionDays = defined('EDITOR_AUDIT_RETENTION_DAYS') ? max(1, (int) EDITOR_AUDIT_RETENTION_DAYS) : 30;
    $pattern = editorRuntimeDir() . '/editor-audit-*.log';
    $files = glob($pattern);
    if (!is_array($files)) {
        return;
    }
    $cutoffTs = time() - ($retentionDays * 86400);
    foreach ($files as $file) {
        if (!is_file($file)) {
            continue;
        }
        $mtime = @filemtime($file);
        if ($mtime !== false && $mtime < $cutoffTs) {
            @unlink($file);
        }
    }
}

/**
 * Write audit event as JSON line.
 */
function editorAudit(string $event, array $context = []): void
{
    if (defined('EDITOR_AUDIT_ENABLED') && !EDITOR_AUDIT_ENABLED) {
        return;
    }

    $client = editorResolveClientAddress();
    $sessionUser = editorGetAuthenticatedUser();
    $entry = [
        'ts' => gmdate('c'),
        'event' => $event,
        'user' => $sessionUser['username'] ?? '',
        'ip' => $client['ip'],
        'ip_chain' => $client['chain'],
        'origin' => (string) ($_SERVER['HTTP_ORIGIN'] ?? ''),
        'method' => (string) ($_SERVER['REQUEST_METHOD'] ?? ''),
        'path' => (string) ($_SERVER['REQUEST_URI'] ?? ''),
        'context' => $context,
    ];
    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($line === false) {
        return;
    }

    @file_put_contents(editorAuditLogPath(), $line . PHP_EOL, FILE_APPEND | LOCK_EX);
    editorRotateAuditLogs();
}
