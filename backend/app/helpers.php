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
 * HTTP request helper with cURL + stream fallback.
 *
 * @param string $url
 * @param array $options
 * @return array{ok: bool, status: int, body: string, content_type: string, error: string}
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

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $curlHeaders,
            CURLOPT_POSTFIELDS => $body,
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
    ];
}
