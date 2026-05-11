<?php
/**
 * NLM esearch API Proxy
 * Proxies requests to NCBI E-utilities esearch endpoint
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

qpmApplyNlmCorsHeaders('GET, POST, OPTIONS', 'application/json');

function qpmIsLocalNlmRequest(): bool
{
    $requestHost = strtolower((string)($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? ''));
    return $requestHost !== '' && (
        strpos($requestHost, 'localhost') !== false ||
        strpos($requestHost, '127.0.0.1') !== false
    );
}

function qpmNlmLocalDevProxyRequest(string $body, int $timeout = 30): array
{
    $hosts = ['localhost', '127.0.0.1'];
    if (!qpmIsLocalNlmRequest()) {
        return [
            'ok' => false,
            'status' => 0,
            'body' => '',
            'error' => 'local dev proxy fallback disabled for non-local host',
        ];
    }

    $errors = [];
    foreach ($hosts as $host) {
        $url = 'http://' . $host . ':5173/nlm-api/entrez/eutils/esearch.fcgi';
        $result = qpmHttpRequest($url, [
            'method' => 'POST',
            'timeout' => $timeout,
            'user_agent' => 'QuickPubMed/1.0',
            'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
            'body' => $body,
        ]);
        if ($result['ok'] && (int)$result['status'] >= 200 && (int)$result['status'] < 300) {
            return [
                'ok' => true,
                'status' => (int)$result['status'],
                'body' => (string)$result['body'],
                'error' => '',
            ];
        }
        $errors[] = $host . ': ' . ($result['error'] !== '' ? $result['error'] : ('HTTP ' . (string)$result['status']));
    }

    return [
        'ok' => false,
        'status' => 0,
        'body' => '',
        'error' => implode(' | ', $errors),
    ];
}

// Build NLM API URL with server-side credentials
$params = $_SERVER['REQUEST_METHOD'] === 'POST' ? $_POST : $_GET;
if (empty($params)) {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        parse_str($rawInput, $params);
    }
}
if (empty($params)) {
    $params = $_GET;
}
$domain = qpmResolveDomain();
$nlmApiKey = qpmGetNlmApiKey($domain);
if ($nlmApiKey !== '') {
    $params['api_key'] = $nlmApiKey;
} else {
    unset($params['api_key']);
}
$params['email'] = qpmGetNlmEmail($domain);
$params['tool'] = 'QuickPubMed';
$params['db'] = $params['db'] ?? 'pubmed';
$params['retmode'] = $params['retmode'] ?? 'json';
$nlmBaseUrl = qpmGetNlmBaseUrl($domain);

$url = $nlmBaseUrl . '/esearch.fcgi';

// Make request to NLM (use POST to avoid long URL issues)
qpmThrottleNlmRequests(10);
$requestBody = http_build_query($params);
$requestHeaders = ['Content-Type' => 'application/x-www-form-urlencoded'];

$result = qpmNlmLocalDevProxyRequest($requestBody, 30);
if (!$result['ok']) {
    $result = qpmHttpRequest($url, [
        'method' => 'POST',
        'timeout' => 30,
        'user_agent' => 'QuickPubMed/1.0',
        'headers' => $requestHeaders,
        'body' => $requestBody,
    ]);
}

if (!$result['ok']) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

http_response_code($result['status'] > 0 ? $result['status'] : 200);
echo $result['body'];
