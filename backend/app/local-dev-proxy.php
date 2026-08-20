<?php
/**
 * Shared Vite local-dev proxy helper (Fase 3).
 *
 * Proxies outbound upstream calls through the Vite dev server
 * (http://localhost|127.0.0.1:5173/...) when the backend itself is local.
 * Requires helpers.php (muginIsLocalBackendRequest, muginHttpRequest).
 */

if (!function_exists('muginLocalDevProxyRequest')) {
    /**
     * @param string $vitePath Path under the Vite proxy root (e.g. nlm-api/entrez/eutils/esearch.fcgi)
     * @param array<string,mixed> $options method, timeout, headers, body, user_agent
     * @return array{ok: bool, status: int, body: string, error: string, response_headers: array<int,string>}
     */
    function muginLocalDevProxyRequest(string $vitePath, array $options = []): array
    {
        $hosts = ['localhost', '127.0.0.1'];
        if (!function_exists('muginIsLocalBackendRequest') || !muginIsLocalBackendRequest()) {
            return [
                'ok' => false,
                'status' => 0,
                'body' => '',
                'error' => 'local dev proxy fallback disabled for non-local host',
                'response_headers' => [],
            ];
        }

        $method = strtoupper(trim((string) ($options['method'] ?? 'GET')));
        if ($method === '') {
            $method = 'GET';
        }
        $timeout = max(1, (int) ($options['timeout'] ?? 30));
        $headers = array_values((array) ($options['headers'] ?? []));
        $body = (string) ($options['body'] ?? '');
        $userAgent = trim((string) ($options['user_agent'] ?? 'MuginScholar/1.0'));
        if ($userAgent === '') {
            $userAgent = 'MuginScholar/1.0';
        }
        $path = ltrim(str_replace('\\', '/', $vitePath), '/');

        $errors = [];
        $lastStatus = 0;
        $lastResponseHeaders = [];
        foreach ($hosts as $host) {
            $url = 'http://' . $host . ':5173/' . $path;
            $requestOptions = [
                'method' => $method,
                'timeout' => $timeout,
                'user_agent' => $userAgent,
                'headers' => $headers,
            ];
            if ($body !== '' || in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
                $requestOptions['body'] = $body;
            }
            $result = muginHttpRequest($url, $requestOptions);
            $lastStatus = (int) ($result['status'] ?? 0);
            $lastResponseHeaders = is_array($result['response_headers'] ?? null)
                ? array_values($result['response_headers'])
                : [];
            if (!empty($result['ok']) && $lastStatus >= 200 && $lastStatus < 300) {
                return [
                    'ok' => true,
                    'status' => $lastStatus,
                    'body' => (string) ($result['body'] ?? ''),
                    'error' => '',
                    'response_headers' => $lastResponseHeaders,
                ];
            }
            $errors[] = $host . ': ' . (
                (string) ($result['error'] ?? '') !== ''
                    ? (string) $result['error']
                    : ('HTTP ' . (string) $lastStatus)
            );
        }

        return [
            'ok' => false,
            'status' => $lastStatus,
            'body' => '',
            'error' => implode(' | ', $errors),
            'response_headers' => $lastResponseHeaders,
        ];
    }
}
