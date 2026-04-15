<?php
$configPath = dirname(__DIR__, 2) . '/backend/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__, 2) . '/backend/config.php';
}
require_once $configPath;
require_once dirname(__DIR__, 2) . '/backend/app/public-search-request.php';
require_once dirname(__DIR__, 2) . '/backend/app/public-search-auth.php';
require_once dirname(__DIR__, 2) . '/backend/app/public-search-rate-limit.php';
require_once dirname(__DIR__, 2) . '/backend/app/public-search-audit.php';
require_once dirname(__DIR__, 2) . '/backend/app/public-search-orchestrator.php';
require_once dirname(__DIR__, 2) . '/backend/app/public-search-response.php';
require_once dirname(__DIR__, 2) . '/backend/app/public-search-get-adapter.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$origin = qpmPublicSearchResolveOrigin();
qpmPublicSearchApplyCorsHeaders(qpmPublicSearchResolveAllowedOriginForAnyClient($origin));
qpmPublicSearchApplyNoStoreHeaders();

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$config = qpmPublicSearchGetConfig();
if ($method === 'GET' && $config['getSearchEnabled'] !== true) {
    qpmPublicSearchRespondJson(405, [
        'error' => 'GET /v1/search is disabled',
    ]);
}
if (!in_array($method, ['GET', 'POST'], true)) {
    qpmPublicSearchRespondJson(405, [
        'error' => 'Method not allowed',
    ]);
}

$startedAt = microtime(true);
$requestForAudit = null;
$clientForAudit = [
    'client_id' => '',
    'auth_source' => '',
    'masked_api_key' => '',
];

try {
    $client = qpmPublicSearchResolveAuthenticatedClient();
    $clientForAudit = $client;
    if (($client['resolved_origin'] ?? '') !== '') {
        qpmPublicSearchApplyCorsHeaders((string) $client['resolved_origin']);
    }

    $rateLimit = qpmPublicSearchConsumeRateLimit($client, $method);
    if (($rateLimit['isLimited'] ?? false) === true) {
        qpmPublicSearchAudit([
            'clientId' => $client['client_id'] ?? '',
            'method' => $method,
            'route' => '/v1/search',
            'status' => 429,
            'origin' => $origin,
            'authSource' => $client['auth_source'] ?? '',
            'apiKey' => $client['masked_api_key'] ?? '',
            'latencyMs' => (int) round((microtime(true) - $startedAt) * 1000),
            'warnings' => ['Rate limit exceeded'],
        ]);
        qpmPublicSearchRespondJson(429, [
            'error' => 'Rate limit exceeded',
            'rateLimit' => $rateLimit,
        ]);
    }

    $request = qpmPublicSearchParseRequest();
    $requestForAudit = $request;
    $response = qpmPublicSearchRunSearch($request);
    $response['rateLimit'] = $rateLimit;

    qpmPublicSearchAudit([
        'clientId' => $client['client_id'] ?? '',
        'method' => $method,
        'route' => '/v1/search',
        'status' => 200,
        'origin' => $origin,
        'query' => (string) ($request['query']['text'] ?? ''),
        'sources' => (array) ($request['sources'] ?? []),
        'page' => (int) ($request['page']['number'] ?? 1),
        'pageSize' => (int) ($request['page']['size'] ?? 25),
        'partial' => ($response['partial'] ?? false) === true,
        'warnings' => (array) ($response['warnings'] ?? []),
        'authSource' => $client['auth_source'] ?? '',
        'apiKey' => $client['masked_api_key'] ?? '',
        'latencyMs' => (int) round((microtime(true) - $startedAt) * 1000),
    ]);

    qpmPublicSearchRespondJson(200, $response);
} catch (InvalidArgumentException $exception) {
    $status = stripos($exception->getMessage(), 'Method not allowed') !== false ? 405 : 422;
    qpmPublicSearchAudit([
        'clientId' => $clientForAudit['client_id'] ?? '',
        'method' => $method,
        'route' => '/v1/search',
        'status' => $status,
        'origin' => $origin,
        'query' => (string) (($requestForAudit['query']['text'] ?? '')),
        'sources' => (array) (($requestForAudit['sources'] ?? [])),
        'page' => (int) (($requestForAudit['page']['number'] ?? 0)),
        'pageSize' => (int) (($requestForAudit['page']['size'] ?? 0)),
        'partial' => false,
        'warnings' => [$exception->getMessage()],
        'authSource' => $clientForAudit['auth_source'] ?? '',
        'apiKey' => $clientForAudit['masked_api_key'] ?? '',
        'latencyMs' => (int) round((microtime(true) - $startedAt) * 1000),
        'error' => $exception->getMessage(),
    ]);
    qpmPublicSearchRespondJson($status, [
        'error' => $exception->getMessage(),
    ]);
} catch (RuntimeException $exception) {
    $status = $exception->getCode();
    if (!in_array($status, [401, 403, 429, 502], true)) {
        $status = 500;
    }
    qpmPublicSearchAudit([
        'clientId' => $clientForAudit['client_id'] ?? '',
        'method' => $method,
        'route' => '/v1/search',
        'status' => $status,
        'origin' => $origin,
        'query' => (string) (($requestForAudit['query']['text'] ?? '')),
        'sources' => (array) (($requestForAudit['sources'] ?? [])),
        'page' => (int) (($requestForAudit['page']['number'] ?? 0)),
        'pageSize' => (int) (($requestForAudit['page']['size'] ?? 0)),
        'partial' => false,
        'warnings' => [$exception->getMessage()],
        'authSource' => $clientForAudit['auth_source'] ?? '',
        'apiKey' => $clientForAudit['masked_api_key'] ?? '',
        'latencyMs' => (int) round((microtime(true) - $startedAt) * 1000),
        'error' => $exception->getMessage(),
    ]);
    qpmPublicSearchRespondJson($status, [
        'error' => $exception->getMessage(),
    ]);
} catch (Throwable $throwable) {
    qpmPublicSearchAudit([
        'clientId' => $clientForAudit['client_id'] ?? '',
        'method' => $method,
        'route' => '/v1/search',
        'status' => 500,
        'origin' => $origin,
        'query' => (string) (($requestForAudit['query']['text'] ?? '')),
        'sources' => (array) (($requestForAudit['sources'] ?? [])),
        'page' => (int) (($requestForAudit['page']['number'] ?? 0)),
        'pageSize' => (int) (($requestForAudit['page']['size'] ?? 0)),
        'partial' => false,
        'warnings' => ['Internal server error'],
        'authSource' => $clientForAudit['auth_source'] ?? '',
        'apiKey' => $clientForAudit['masked_api_key'] ?? '',
        'latencyMs' => (int) round((microtime(true) - $startedAt) * 1000),
        'error' => $throwable->getMessage(),
    ]);
    qpmPublicSearchRespondJson(500, [
        'error' => 'Internal server error',
    ]);
}
