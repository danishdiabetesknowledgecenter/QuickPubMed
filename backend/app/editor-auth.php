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
 * Send a JSON response and exit.
 */
function editorJsonResponse(int $statusCode, array $payload): void
{
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

    $allowedByDomainRule = getAllowedOrigin($origin);
    if (!empty($allowedByDomainRule)) {
        return $allowedByDomainRule;
    }

    if (defined('EDITOR_ALLOWED_ORIGINS') && is_array(EDITOR_ALLOWED_ORIGINS)) {
        foreach (EDITOR_ALLOWED_ORIGINS as $allowed) {
            if (!is_string($allowed)) {
                continue;
            }
            if (rtrim($allowed, '/') === rtrim($origin, '/')) {
                return $origin;
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
 * Check whether request uses HTTPS (directly or via reverse proxy header).
 */
function editorIsHttpsRequest(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
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
    session_name('QPM_EDITOR_SESSION');
    session_start();
}

/**
 * Read request payload from JSON or form body.
 */
function editorReadInput(): array
{
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
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
    $runtimeDir = dirname(__DIR__) . '/storage/runtime';
    if (!is_dir($runtimeDir)) {
        @mkdir($runtimeDir, 0750, true);
    }
    return $runtimeDir . '/editor-login-rate-limit.json';
}

/**
 * Load rate limit data.
 */
function editorLoadRateLimitData(): array
{
    $path = editorRateLimitFilePath();
    if (!is_file($path)) {
        return [];
    }

    $raw = file_get_contents($path);
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Persist rate limit data atomically.
 */
function editorSaveRateLimitData(array $data): void
{
    $path = editorRateLimitFilePath();
    $tmp = $path . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return;
    }

    file_put_contents($tmp, $json, LOCK_EX);
    @rename($tmp, $path);
}

/**
 * Check current rate limit state.
 */
function editorIsRateLimited(string $key, int $maxAttempts = 8, int $windowSeconds = 900): array
{
    $now = time();
    $data = editorLoadRateLimitData();
    $entry = $data[$key] ?? ['count' => 0, 'first_attempt' => $now];
    $firstAttempt = (int) ($entry['first_attempt'] ?? $now);
    $count = (int) ($entry['count'] ?? 0);

    if (($now - $firstAttempt) > $windowSeconds) {
        return ['limited' => false, 'retry_after' => 0];
    }

    if ($count >= $maxAttempts) {
        return ['limited' => true, 'retry_after' => max(1, $windowSeconds - ($now - $firstAttempt))];
    }

    return ['limited' => false, 'retry_after' => 0];
}

/**
 * Register failed login attempt.
 */
function editorRegisterFailedAttempt(string $key): void
{
    $now = time();
    $data = editorLoadRateLimitData();
    $entry = $data[$key] ?? ['count' => 0, 'first_attempt' => $now];
    $firstAttempt = (int) ($entry['first_attempt'] ?? $now);

    if (($now - $firstAttempt) > 900) {
        $entry = ['count' => 1, 'first_attempt' => $now];
    } else {
        $entry['count'] = (int) ($entry['count'] ?? 0) + 1;
    }

    $data[$key] = $entry;
    editorSaveRateLimitData($data);
}

/**
 * Reset failed attempts after successful login.
 */
function editorResetFailedAttempts(string $key): void
{
    $data = editorLoadRateLimitData();
    if (isset($data[$key])) {
        unset($data[$key]);
        editorSaveRateLimitData($data);
    }
}
