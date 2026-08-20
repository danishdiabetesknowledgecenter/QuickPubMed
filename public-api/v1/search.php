<?php
$configPath = dirname(__DIR__, 2) . '/backend/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__, 2) . '/backend/config.php';
}
require_once $configPath;
require_once dirname(__DIR__, 2) . '/backend/app/public-search-lib.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$origin = muginPublicSearchResolveOrigin();
muginPublicSearchApplyCorsHeaders(muginPublicSearchResolveAllowedOriginForAnyClient($origin));
muginPublicSearchApplyNoStoreHeaders();

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$config = muginPublicSearchGetConfig();
if ($method === 'GET' && $config['getSearchEnabled'] !== true) {
    muginPublicSearchRespondJson(405, [
        'error' => 'GET /v1/search is disabled',
    ]);
}
if (!in_array($method, ['GET', 'POST'], true)) {
    muginPublicSearchRespondJson(405, [
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
    muginPublicSearchReleaseExecutionSlot($executionSlot);
});

try {
    $client = muginPublicSearchResolveAuthenticatedClient();
    $clientForAudit = $client;
    if (($client['resolved_origin'] ?? '') !== '') {
        muginPublicSearchApplyCorsHeaders((string) $client['resolved_origin']);
    }

    $rateLimit = muginPublicSearchConsumeRateLimit($client, $method);
    if (($rateLimit['isLimited'] ?? false) === true) {
        muginPublicSearchApplyRetryAfterHeader((int) ($rateLimit['resetInSeconds'] ?? 60));
        muginPublicSearchAudit([
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
        muginPublicSearchRespondJson(429, [
            'error' => 'Rate limit exceeded',
            'rateLimit' => $rateLimit,
        ]);
    }

    $request = muginPublicSearchParseRequest();
    $request = muginPublicSearchEnforceClientSourceAccess($request, $client);
    $request['_clientSourceApiKeys'] = [
        'openAlex' => muginPublicSearchClientSourceApiKey($client, 'openAlex'),
        'semanticScholar' => muginPublicSearchClientSourceApiKey($client, 'semanticScholar'),
        'elicit' => muginPublicSearchClientSourceApiKey($client, 'elicit'),
    ];
    // Keep a live reference so partial processDetails collected inside
    // muginPublicSearchRunSearch() remain available on error/SSE failure paths.
    $requestForAudit = &$request;
    $streamEnabled = (($request['responseOptions']['stream'] ?? false) === true);
    $executionSlot = muginPublicSearchAcquireExecutionSlot((int) ($config['concurrentSearchLimit'] ?? 10));

    $progressCallback = null;
    if ($streamEnabled) {
        muginPublicSearchStartEventStream();
        $streamStarted = true;
        muginPublicSearchEmitSseEvent('connected', [
            'stage' => 'connected',
            'language' => muginPublicSearchResolveProgressLanguage($request),
            'timestamp' => gmdate('c'),
        ]);
        $progressCallback = static function (string $stage, string $message, array $context = []) use (&$executionSlot, $request): void {
            muginPublicSearchRefreshExecutionSlot($executionSlot);
            muginPublicSearchEmitSseEvent('progress', array_merge(
                muginPublicSearchBuildStreamProgressPayload($request, $stage, $message, $context),
                [
                'timestamp' => gmdate('c'),
                ]
            ));
        };
    }

    muginPublicSearchRefreshExecutionSlot($executionSlot);
    $response = muginPublicSearchRunSearch($request, $progressCallback);
    $response['rateLimit'] = $rateLimit;
    $completedAt = microtime(true);
    $durationSeconds = (int) floor($completedAt - $startedAt);
    $response['timing'] = [
        'startedAt' => gmdate('c', (int) $startedAt),
        'completedAt' => gmdate('c', (int) $completedAt),
        'durationMs' => (int) round(($completedAt - $startedAt) * 1000),
        'durationFormatted' => sprintf(
            '%02d:%02d:%02d',
            intdiv($durationSeconds, 3600),
            intdiv($durationSeconds % 3600, 60),
            $durationSeconds % 60
        ),
    ];

    muginPublicSearchAudit([
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
        muginPublicSearchEmitSseEvent('result', $response);
        muginPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }

    muginPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    muginPublicSearchRespondJson(200, $response);
} catch (InvalidArgumentException $exception) {
    $status = stripos($exception->getMessage(), 'Method not allowed') !== false ? 405 : 422;
    muginPublicSearchAudit([
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
    $validationErrorPayload = ['error' => $exception->getMessage()];
    if (
        is_array($requestForAudit)
        && (($requestForAudit['responseOptions']['includeProcessDetails'] ?? false) === true)
        && isset($requestForAudit['_processDetails'])
        && is_array($requestForAudit['_processDetails'])
    ) {
        $validationErrorPayload['processDetails'] = muginPublicSearchProcessDetailsExport($requestForAudit['_processDetails']);
    }
    if ($streamStarted) {
        muginPublicSearchEmitSseEvent('error', array_merge($validationErrorPayload, [
            'status' => $status,
            'timestamp' => gmdate('c'),
        ]));
        muginPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }
    muginPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    muginPublicSearchRespondJson($status, $validationErrorPayload);
} catch (RuntimeException $exception) {
    $status = $exception->getCode();
    if (!in_array($status, [401, 403, 429, 502, 503], true)) {
        $status = 500;
    }
    $errorPayload = [
        'error' => $exception->getMessage(),
    ];
    if ($status === 429) {
        muginPublicSearchApplyRetryAfterHeader((int) ($rateLimit['resetInSeconds'] ?? 60));
        $errorPayload['rateLimit'] = $rateLimit;
    } elseif ($status === 503) {
        $retryAfterSeconds = (int) ($config['busyRetryAfterSeconds'] ?? 120);
        muginPublicSearchApplyRetryAfterHeader($retryAfterSeconds);
        $errorPayload['retryAfterSeconds'] = $retryAfterSeconds;
        $errorPayload['concurrentSearchLimit'] = (int) ($config['concurrentSearchLimit'] ?? 10);
    }
    muginPublicSearchAudit([
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
    if (
        is_array($requestForAudit)
        && (($requestForAudit['responseOptions']['includeProcessDetails'] ?? false) === true)
        && isset($requestForAudit['_processDetails'])
        && is_array($requestForAudit['_processDetails'])
    ) {
        $errorPayload['processDetails'] = muginPublicSearchProcessDetailsExport($requestForAudit['_processDetails']);
    }
    if ($streamStarted) {
        muginPublicSearchEmitSseEvent('error', array_merge($errorPayload, [
            'status' => $status,
            'timestamp' => gmdate('c'),
        ]));
        muginPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }
    muginPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    muginPublicSearchRespondJson($status, $errorPayload);
} catch (Throwable $throwable) {
    muginPublicSearchAudit([
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
        muginPublicSearchEmitSseEvent('error', [
            'status' => 500,
            'error' => 'Internal server error',
            'timestamp' => gmdate('c'),
        ]);
        muginPublicSearchReleaseExecutionSlot($executionSlot);
        $executionSlot = null;
        exit;
    }
    muginPublicSearchReleaseExecutionSlot($executionSlot);
    $executionSlot = null;
    muginPublicSearchRespondJson(500, [
        'error' => 'Internal server error',
    ]);
}
