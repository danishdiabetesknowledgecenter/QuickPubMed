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
$streamStarted = false;
$streamEnabled = false;
$executionSlot = null;
$rateLimit = [
    'limit' => null,
    'remaining' => null,
    'resetAt' => '',
    'resetInSeconds' => null,
    'status' => 0,
    'isLimited' => false,
];
register_shutdown_function(static function () use (&$executionSlot): void {
    qpmPublicSearchReleaseExecutionSlot($executionSlot);
});

try {
    $client = qpmPublicSearchResolveAuthenticatedClient();
    $clientForAudit = $client;
    if (($client['resolved_origin'] ?? '') !== '') {
        qpmPublicSearchApplyCorsHeaders((string) $client['resolved_origin']);
    }

    $rateLimit = qpmPublicSearchConsumeRateLimit($client, $method);
    if (($rateLimit['isLimited'] ?? false) === true) {
        qpmPublicSearchApplyRetryAfterHeader((int) ($rateLimit['resetInSeconds'] ?? 60));
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
    $streamEnabled = (($request['responseOptions']['stream'] ?? false) === true);
    $executionSlot = qpmPublicSearchAcquireExecutionSlot((int) ($config['concurrentSearchLimit'] ?? 10));

    $progressCallback = null;
    if ($streamEnabled) {
        qpmPublicSearchStartEventStream();
        $streamStarted = true;
        qpmPublicSearchEmitSseEvent('progress', [
            'stage' => 'connected',
            'message' => 'Search stream connected',
            'timestamp' => gmdate('c'),
        ]);
        $progressCallback = static function (string $stage, string $message, array $context = []) use (&$executionSlot): void {
            qpmPublicSearchRefreshExecutionSlot($executionSlot);
            qpmPublicSearchEmitSseEvent('progress', array_merge([
                'stage' => $stage,
                'message' => $message,
                'timestamp' => gmdate('c'),
            ], $context));
        };
    }

    qpmPublicSearchRefreshExecutionSlot($executionSlot);
    $response = qpmPublicSearchRunSearch($request, $progressCallback);
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

    if ($streamStarted) {
        qpmPublicSearchEmitSseEvent('result', $response);
        qpmPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }

    qpmPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
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
    if ($streamStarted) {
        qpmPublicSearchEmitSseEvent('error', [
            'status' => $status,
            'error' => $exception->getMessage(),
            'timestamp' => gmdate('c'),
        ]);
        qpmPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }
    qpmPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    qpmPublicSearchRespondJson($status, [
        'error' => $exception->getMessage(),
    ]);
} catch (RuntimeException $exception) {
    $status = $exception->getCode();
    if (!in_array($status, [401, 403, 429, 502, 503], true)) {
        $status = 500;
    }
    $errorPayload = [
        'error' => $exception->getMessage(),
    ];
    if ($status === 429) {
        qpmPublicSearchApplyRetryAfterHeader((int) ($rateLimit['resetInSeconds'] ?? 60));
        $errorPayload['rateLimit'] = $rateLimit;
    } elseif ($status === 503) {
        $retryAfterSeconds = (int) ($config['busyRetryAfterSeconds'] ?? 120);
        qpmPublicSearchApplyRetryAfterHeader($retryAfterSeconds);
        $errorPayload['retryAfterSeconds'] = $retryAfterSeconds;
        $errorPayload['concurrentSearchLimit'] = (int) ($config['concurrentSearchLimit'] ?? 10);
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
    if ($streamStarted) {
        qpmPublicSearchEmitSseEvent('error', array_merge($errorPayload, [
            'status' => $status,
            'timestamp' => gmdate('c'),
        ]));
        qpmPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }
    qpmPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    qpmPublicSearchRespondJson($status, $errorPayload);
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
    if ($streamStarted) {
        qpmPublicSearchEmitSseEvent('error', [
            'status' => 500,
            'error' => 'Internal server error',
            'timestamp' => gmdate('c'),
        ]);
        qpmPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }
    qpmPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    qpmPublicSearchRespondJson(500, [
        'error' => 'Internal server error',
    ]);
}
