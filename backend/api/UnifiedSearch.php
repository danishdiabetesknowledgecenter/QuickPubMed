<?php
/**
 * First-party unified search endpoint for the website widget (SearchForm.vue).
 *
 * Unified-search-engine-full-parity plan, Phase 7: lets the widget call the
 * exact same orchestrator (muginPublicSearchRunSearch()) that backs the public
 * /v1/search API, so the website and external API consumers get identical
 * results from a single engine.
 *
 * Deliberately NOT the same as public-api/v1/search.php: this endpoint has
 * no per-client API key, rate limit bucket, or source-access restriction,
 * because it is only ever called from the site's own first-party widget
 * (same trust boundary as the other unauthenticated backend/api/*.php
 * scripts, e.g. ElicitSearch.php, OpenAlexSearch.php - all gated purely by
 * the shared CORS allowlist below, not by API keys). It intentionally reuses
 * the site's own default source API keys (no per-client override) and grants
 * access to all sources, matching what the widget's own local JS pipeline
 * can already do today.
 *
 * The global muginPublicSearchAcquireExecutionSlot() concurrency guard is still
 * applied, since it protects shared server/upstream-API capacity regardless
 * of caller.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';
require_once dirname(__DIR__) . '/app/public-search-lib.php';

muginApplyNlmCorsHeaders('POST, OPTIONS', 'application/json');
muginEnforceFirstPartyIpRateLimit('unifiedSearch');
// A full unified-engine run (LLM translation + MeSH validation + multi-source
// retrieval + rerank) can legitimately take longer than PHP's default 30s,
// same reasoning as the other backend/api/*.php scripts' time limit bumps
// (e.g. SemanticScholarSearch.php uses 180s for its single heaviest call).
@ini_set('max_execution_time', '180');
@set_time_limit(180);

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method !== 'POST') {
    muginPublicSearchRespondJson(405, ['error' => 'Method not allowed']);
}

$startedAt = microtime(true);
$requestForAudit = null;
$streamStarted = false;
$streamEnabled = false;
$executionSlot = null;
register_shutdown_function(static function () use (&$executionSlot): void {
    muginPublicSearchReleaseExecutionSlot($executionSlot);
});

try {
    $config = muginPublicSearchGetConfig();
    $request = muginPublicSearchParseRequest();
    // First-party widget: full source access, site default API keys (no
    // per-client override), matching muginPublicSearchParseRequest()'s own
    // request['sources'] as-is (the widget's UI already governs which
    // sources a given visitor/domain may toggle on, e.g. the Elicit gate).
    $request['_clientSourceApiKeys'] = [
        'openAlex' => '',
        'semanticScholar' => '',
        'elicit' => '',
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
                ['timestamp' => gmdate('c')]
            ));
        };
    }

    muginPublicSearchRefreshExecutionSlot($executionSlot);
    $response = muginPublicSearchRunSearch($request, $progressCallback);
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
        'clientId' => 'website-widget',
        'method' => $method,
        'route' => '/backend/api/UnifiedSearch.php',
        'status' => 200,
        'origin' => muginPublicSearchResolveOrigin(),
        'query' => (string) ($request['query']['text'] ?? ''),
        'sources' => (array) ($request['sources'] ?? []),
        'page' => (int) ($request['page']['number'] ?? 1),
        'pageSize' => (int) ($request['page']['size'] ?? 25),
        'partial' => ($response['partial'] ?? false) === true,
        'warnings' => (array) ($response['warnings'] ?? []),
        'authSource' => 'first-party-widget',
        'apiKey' => '',
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
        'clientId' => 'website-widget',
        'method' => $method,
        'route' => '/backend/api/UnifiedSearch.php',
        'status' => $status,
        'origin' => muginPublicSearchResolveOrigin(),
        'query' => (string) (($requestForAudit['query']['text'] ?? '')),
        'sources' => (array) (($requestForAudit['sources'] ?? [])),
        'page' => (int) (($requestForAudit['page']['number'] ?? 0)),
        'pageSize' => (int) (($requestForAudit['page']['size'] ?? 0)),
        'partial' => false,
        'warnings' => [$exception->getMessage()],
        'authSource' => 'first-party-widget',
        'apiKey' => '',
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
    if (!in_array($status, [502, 503], true)) {
        $status = 500;
    }
    $errorPayload = ['error' => $exception->getMessage()];
    if ($status === 503) {
        $retryAfterSeconds = (int) ($config['busyRetryAfterSeconds'] ?? 120);
        muginPublicSearchApplyRetryAfterHeader($retryAfterSeconds);
        $errorPayload['retryAfterSeconds'] = $retryAfterSeconds;
        $errorPayload['concurrentSearchLimit'] = (int) ($config['concurrentSearchLimit'] ?? 10);
    }
    muginPublicSearchAudit([
        'clientId' => 'website-widget',
        'method' => $method,
        'route' => '/backend/api/UnifiedSearch.php',
        'status' => $status,
        'origin' => muginPublicSearchResolveOrigin(),
        'query' => (string) (($requestForAudit['query']['text'] ?? '')),
        'sources' => (array) (($requestForAudit['sources'] ?? [])),
        'page' => (int) (($requestForAudit['page']['number'] ?? 0)),
        'pageSize' => (int) (($requestForAudit['page']['size'] ?? 0)),
        'partial' => false,
        'warnings' => [$exception->getMessage()],
        'authSource' => 'first-party-widget',
        'apiKey' => '',
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
        'clientId' => 'website-widget',
        'method' => $method,
        'route' => '/backend/api/UnifiedSearch.php',
        'status' => 500,
        'origin' => muginPublicSearchResolveOrigin(),
        'query' => (string) (($requestForAudit['query']['text'] ?? '')),
        'sources' => (array) (($requestForAudit['sources'] ?? [])),
        'page' => (int) (($requestForAudit['page']['number'] ?? 0)),
        'pageSize' => (int) (($requestForAudit['page']['size'] ?? 0)),
        'partial' => false,
        'warnings' => ['Internal server error'],
        'authSource' => 'first-party-widget',
        'apiKey' => '',
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
    muginPublicSearchRespondJson(500, ['error' => 'Internal server error']);
}
