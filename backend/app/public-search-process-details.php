<?php
/**
 * Canonical, language-neutral process-details collector shared by the
 * unified SearchForm endpoint and the public API.
 *
 * The UI keeps ownership of labels/translations. This module only transports
 * the two data channels SearchResult.vue already renders:
 *   - sourceQueryDetails: source query/request/response summaries
 *   - processStepDetails: non-source step payloads keyed by stepId
 *
 * Collection is request-local and performs no network calls or scoring.
 */

if (!function_exists('qpmPublicSearchProcessDetailStepIds')) {
    /**
     * @return array<int,string>
     */
    function qpmPublicSearchProcessDetailStepIds(): array
    {
        return [
            'semanticIntent',
            'semanticQuery',
            'searchString',
            'mesh',
            'semanticScholar',
            'openAlex',
            'elicit',
            'pubmed',
            'rerank',
            'finalizeValidatePmid',
            'finalizeValidateDoiFetch',
            'finalizeHydrate',
            'finalizeSort',
            'finalRerank',
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailSourceIds')) {
    /**
     * @return array<int,string>
     */
    function qpmPublicSearchProcessDetailSourceIds(): array
    {
        return ['pubmed', 'semanticScholar', 'openAlex', 'elicit'];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailStatuses')) {
    /**
     * @return array<int,string>
     */
    function qpmPublicSearchProcessDetailStatuses(): array
    {
        return [
            'pending',
            'current',
            'completed',
            'warning',
            'partial',
            'failed',
            'rateLimited',
            'recovered',
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsCreate')) {
    /**
     * Internal maps guarantee one canonical payload per step and merge
     * duplicate source/query entries without making the renderer dedupe them.
     *
     * @return array<string,mixed>
     */
    function qpmPublicSearchProcessDetailsCreate(): array
    {
        return [
            'version' => '1',
            '_steps' => [],
            '_sources' => [],
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsSanitize')) {
    /**
     * Defense-in-depth redaction. Callers should still build allow-listed
     * request summaries rather than passing raw headers or upstream bodies.
     *
     * @param mixed $value
     * @return mixed
     */
    function qpmPublicSearchProcessDetailsSanitize($value, int $depth = 0)
    {
        if ($depth > 12) {
            return '[truncated-depth]';
        }
        if (!is_array($value)) {
            return $value;
        }

        $output = [];
        foreach ($value as $key => $entry) {
            $normalizedKey = strtolower(preg_replace('/[^a-z0-9]+/i', '', (string) $key) ?? '');
            if (
                in_array($normalizedKey, [
                    'apikey',
                    'authorization',
                    'accesstoken',
                    'refreshtoken',
                    'password',
                    'secret',
                    'clientsecret',
                ], true)
            ) {
                $output[$key] = '[redacted]';
                continue;
            }
            if ($normalizedKey === 'headers' || $normalizedKey === 'responseheaders') {
                // Raw headers can contain credentials, cookies and internal
                // infrastructure. Process details expose explicit safe fields.
                $output[$key] = '[redacted]';
                continue;
            }
            $output[$key] = qpmPublicSearchProcessDetailsSanitize($entry, $depth + 1);
        }
        return $output;
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsSetStep')) {
    /**
     * @param array<string,mixed> $collector
     * @param array<string,mixed> $payload
     */
    function qpmPublicSearchProcessDetailsSetStep(
        array &$collector,
        string $stepId,
        array $payload,
        string $context = ''
    ): void {
        $stepId = trim($stepId);
        if (!in_array($stepId, qpmPublicSearchProcessDetailStepIds(), true)) {
            return;
        }
        $collector['_steps'][$stepId] = [
            'stepId' => $stepId,
            'payload' => qpmPublicSearchProcessDetailsSanitize($payload),
            'context' => trim($context),
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsMergeStep')) {
    /**
     * Top-level merge matches SearchForm.mergeSearchProcessStepDetail().
     *
     * @param array<string,mixed> $collector
     * @param array<string,mixed> $payload
     */
    function qpmPublicSearchProcessDetailsMergeStep(
        array &$collector,
        string $stepId,
        array $payload,
        string $context = ''
    ): void {
        $current = isset($collector['_steps'][$stepId]['payload'])
            && is_array($collector['_steps'][$stepId]['payload'])
            ? $collector['_steps'][$stepId]['payload']
            : [];
        qpmPublicSearchProcessDetailsSetStep(
            $collector,
            $stepId,
            array_merge($current, $payload),
            $context !== '' ? $context : (string) ($collector['_steps'][$stepId]['context'] ?? '')
        );
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsSetSource')) {
    /**
     * @param array<string,mixed> $collector
     * @param array<string,mixed> $detail
     */
    function qpmPublicSearchProcessDetailsSetSource(array &$collector, array $detail): void
    {
        $source = trim((string) ($detail['source'] ?? ''));
        $query = trim((string) ($detail['query'] ?? ($detail['request']['query'] ?? '')));
        if (!in_array($source, qpmPublicSearchProcessDetailSourceIds(), true) || $query === '') {
            return;
        }

        $key = $source . '|' . strtolower($query);
        $current = isset($collector['_sources'][$key]) && is_array($collector['_sources'][$key])
            ? $collector['_sources'][$key]
            : [
                'source' => $source,
                'query' => $query,
                'request' => new stdClass(),
                'requestMeta' => new stdClass(),
                'response' => new stdClass(),
                'context' => '',
            ];

        $next = [
            'source' => $source,
            'query' => $query,
            'request' => $current['request'] ?? new stdClass(),
            'requestMeta' => $current['requestMeta'] ?? new stdClass(),
            'response' => $current['response'] ?? new stdClass(),
            'context' => (string) ($current['context'] ?? ''),
        ];
        foreach (['request', 'requestMeta', 'response'] as $field) {
            if (isset($detail[$field]) && is_array($detail[$field])) {
                $next[$field] = $detail[$field];
            }
        }
        if (array_key_exists('context', $detail)) {
            $next['context'] = trim((string) $detail['context']);
        }
        $collector['_sources'][$key] = qpmPublicSearchProcessDetailsSanitize($next);
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsExport')) {
    /**
     * @param array<string,mixed> $collector
     * @return array{version:string,sourceQueryDetails:array<int,array<string,mixed>>,processStepDetails:array<int,array<string,mixed>>}
     */
    function qpmPublicSearchProcessDetailsExport(array $collector): array
    {
        $orderedSteps = [];
        foreach (qpmPublicSearchProcessDetailStepIds() as $stepId) {
            if (isset($collector['_steps'][$stepId]) && is_array($collector['_steps'][$stepId])) {
                $orderedSteps[] = $collector['_steps'][$stepId];
            }
        }

        return [
            'version' => (string) ($collector['version'] ?? '1'),
            'sourceQueryDetails' => array_values(array_filter(
                (array) ($collector['_sources'] ?? []),
                'is_array'
            )),
            'processStepDetails' => $orderedSteps,
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsWantsCollection')) {
    /**
     * @param array<string,mixed> $request
     */
    function qpmPublicSearchProcessDetailsWantsCollection(array $request): bool
    {
        return ($request['responseOptions']['includeProcessDetails'] ?? false) === true;
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsEnsureCollector')) {
    /**
     * @param array<string,mixed> $request
     * @return array<string,mixed>|null
     */
    function qpmPublicSearchProcessDetailsEnsureCollector(array &$request): ?array
    {
        if (!qpmPublicSearchProcessDetailsWantsCollection($request)) {
            return null;
        }
        if (!isset($request['_processDetails']) || !is_array($request['_processDetails'])) {
            $request['_processDetails'] = qpmPublicSearchProcessDetailsCreate();
        }
        // Collection needs resolvedQueries/diagnostics internals without forcing
        // the public output contract to require three interdependent client flags.
        $request['responseOptions']['includeResolvedQueries'] = true;
        $request['responseOptions']['includeDiagnostics'] = true;
        return $request['_processDetails'];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsCountCandidateIdentityBuckets')) {
    /**
     * Overlapping identity counts: a candidate with both PMID and DOI increments
     * both buckets (legacy SearchForm semantics).
     *
     * @param array<int,array<string,mixed>> $candidates
     * @return array{candidateCount:int,pmidCandidateCount:int,doiCandidateCount:int,openAlexCandidateCount:int}
     */
    function qpmPublicSearchProcessDetailsCountCandidateIdentityBuckets(array $candidates): array
    {
        $pmidCount = 0;
        $doiCount = 0;
        $openAlexCount = 0;
        $total = 0;
        foreach ($candidates as $candidate) {
            if (!is_array($candidate)) {
                continue;
            }
            $total++;
            $pmid = '';
            $doi = '';
            if (function_exists('qpmPublicSearchNormalizePmid')) {
                $pmid = qpmPublicSearchNormalizePmid($candidate['pmid'] ?? '');
                $doi = qpmPublicSearchNormalizeDoi($candidate['doi'] ?? '');
            } else {
                $pmid = trim((string) ($candidate['pmid'] ?? ''));
                $doi = trim((string) ($candidate['doi'] ?? ''));
            }
            if ($pmid !== '') {
                $pmidCount++;
            }
            if ($doi !== '') {
                $doiCount++;
            }
            // Legacy SearchForm counts truthy openAlexId only (overlapping buckets).
            if (trim((string) ($candidate['openAlexId'] ?? '')) !== '') {
                $openAlexCount++;
            }
        }
        return [
            'candidateCount' => $total,
            'pmidCandidateCount' => $pmidCount,
            'doiCandidateCount' => $doiCount,
            'openAlexCandidateCount' => $openAlexCount,
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsBuildSafeSourceDetail')) {
    /**
     * @param string $source
     * @param string $query
     * @param array<string,mixed> $requestSummary Allow-listed request fields only
     * @param array<string,mixed> $requestMeta
     * @param array<string,mixed> $sourceResult
     * @param string $context
     * @return array<string,mixed>
     */
    function qpmPublicSearchProcessDetailsBuildSafeSourceDetail(
        string $source,
        string $query,
        array $requestSummary,
        array $requestMeta,
        array $sourceResult,
        string $context = ''
    ): array {
        $candidates = isset($sourceResult['candidates']) && is_array($sourceResult['candidates'])
            ? $sourceResult['candidates']
            : [];
        $response = [
            'candidateCount' => count($candidates),
            'totalAvailable' => (int) ($sourceResult['total'] ?? count($candidates)),
        ];
        if (($sourceResult['partial'] ?? false) === true) {
            $response['partial'] = true;
        }
        if (($sourceResult['fallbackUsed'] ?? false) === true) {
            $response['fallbackUsed'] = true;
            $response['fallbackReason'] = trim((string) ($sourceResult['fallbackReason'] ?? ''));
        }
        $warning = trim((string) ($sourceResult['warning'] ?? ''));
        $error = trim((string) ($sourceResult['error'] ?? ''));
        if ($warning !== '') {
            $response['warning'] = function_exists('mb_substr') ? mb_substr($warning, 0, 240) : substr($warning, 0, 240);
        }
        if ($error !== '') {
            $response['error'] = function_exists('mb_substr') ? mb_substr($error, 0, 240) : substr($error, 0, 240);
        }
        if (isset($sourceResult['rateLimit']) && is_array($sourceResult['rateLimit'])) {
            $rateLimit = $sourceResult['rateLimit'];
            $safeRate = [];
            foreach (['status', 'limit', 'remaining', 'reset', 'retryAfter', 'isLimited'] as $field) {
                if (array_key_exists($field, $rateLimit)) {
                    $safeRate[$field] = $rateLimit[$field];
                }
            }
            if (!empty($safeRate)) {
                $response['rateLimit'] = $safeRate;
            }
        }

        return [
            'source' => $source,
            'query' => $query,
            'request' => $requestSummary,
            'requestMeta' => $requestMeta,
            'response' => $response,
            'context' => $context,
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsResolveSourceTerminalStatus')) {
    /**
     * @param array<string,mixed> $sourceResult
     */
    function qpmPublicSearchProcessDetailsResolveSourceTerminalStatus(array $sourceResult): string
    {
        $error = trim((string) ($sourceResult['error'] ?? ''));
        $warning = trim((string) ($sourceResult['warning'] ?? ''));
        $candidates = isset($sourceResult['candidates']) && is_array($sourceResult['candidates'])
            ? $sourceResult['candidates']
            : [];
        $rateLimited = false;
        if (isset($sourceResult['rateLimit']) && is_array($sourceResult['rateLimit'])) {
            $rateLimited = ($sourceResult['rateLimit']['isLimited'] ?? false) === true
                || (int) ($sourceResult['rateLimit']['status'] ?? 0) === 429;
        }
        if ($rateLimited || stripos($error, 'rate') !== false) {
            return 'rateLimited';
        }
        if (
            !empty($candidates)
            && (($sourceResult['fallbackUsed'] ?? false) === true
            || !empty($sourceResult['disabledRequestFields'])
            )
        ) {
            return 'recovered';
        }
        if ($error !== '' && empty($candidates)) {
            return 'failed';
        }
        if (($sourceResult['partial'] ?? false) === true) {
            return 'partial';
        }
        if ($warning !== '' || $error !== '') {
            return 'warning';
        }
        return 'completed';
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsTruncateIds')) {
    /**
     * @param array<int,string> $ids
     * @return array{ids:array<int,string>,truncated:bool,count:int}
     */
    function qpmPublicSearchProcessDetailsTruncateIds(array $ids, int $limit = 10): array
    {
        $normalized = array_values(array_filter(array_map(static function ($id) {
            return trim((string) $id);
        }, $ids)));
        $count = count($normalized);
        return [
            'ids' => array_slice($normalized, 0, max(0, $limit)),
            'truncated' => $count > $limit,
            'count' => $count,
        ];
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsEmitStep')) {
    /**
     * Streams one already-sanitized, bounded step payload as soon as it is
     * available.
     *
     * - Default (`$markCompleted = false`): `detailOnly` supplemental update —
     *   frontend must not alter step timing/order.
     * - `$markCompleted = true`: terminal event with `status=completed` and the
     *   detail payload, so the UI can finish the step only once information is
     *   present (never before).
     *
     * @param array<string,mixed>|null $collector
     */
    function qpmPublicSearchProcessDetailsEmitStep(
        ?array $collector,
        string $stepId,
        ?callable $progressCallback,
        bool $markCompleted = false
    ): void {
        $stepId = trim($stepId);
        if (
            $collector === null
            || $progressCallback === null
            || !isset($collector['_steps'][$stepId])
            || !is_array($collector['_steps'][$stepId])
        ) {
            return;
        }
        $context = [
            'stepId' => $stepId,
            'processStepDetail' => $collector['_steps'][$stepId],
        ];
        if ($markCompleted) {
            $context['status'] = 'completed';
        } else {
            $context['detailOnly'] = true;
        }
        qpmPublicSearchEmitProgress($progressCallback, $stepId, '', $context);
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsEmitCompletedPayload')) {
    /**
     * Emits a completed step directly when its real work boundary occurs before
     * the main collector is available to that helper. The collector can store
     * the same payload later without changing the already-finished timing.
     *
     * @param array<string,mixed> $payload
     */
    function qpmPublicSearchProcessDetailsEmitCompletedPayload(
        string $stepId,
        array $payload,
        ?callable $progressCallback,
        string $context = ''
    ): void {
        $stepId = trim($stepId);
        if ($stepId === '' || $progressCallback === null) {
            return;
        }
        $detail = qpmPublicSearchProcessDetailsSanitize([
            'stepId' => $stepId,
            'payload' => $payload,
            'context' => $context,
        ]);
        qpmPublicSearchEmitProgress($progressCallback, $stepId, '', [
            'stepId' => $stepId,
            'status' => 'completed',
            'processStepDetail' => $detail,
        ]);
    }
}

if (!function_exists('qpmPublicSearchProcessDetailsRecordSourceCompletion')) {
    /**
     * Records a finished source fetch (qpmPublicSearchFetch*SourceResult()
     * call) into the process-details collector (when active) and re-emits a
     * progress event for the same step carrying the terminal status/timing -
     * a superset of the "starting" progress event callers already emit
     * before the fetch. No-ops the collector write when $collector is null,
     * but still emits progress, so callers can call this unconditionally.
     *
     * @param array<string,mixed>|null $collector
     * @param string $source
     * @param string $query
     * @param array<string,mixed> $sourceResult
     * @param float $startedAt microtime(true) captured before the fetch call
     * @param callable|null $progressCallback
     * @param array<string,mixed> $progressContext Same context passed to the "starting" qpmPublicSearchEmitProgress() call for this step.
     * @param array<string,mixed> $requestSummary Allow-listed request parameters
     * @param array<string,mixed> $requestMeta
     */
    function qpmPublicSearchProcessDetailsRecordSourceCompletion(
        ?array &$collector,
        string $source,
        string $query,
        array $sourceResult,
        float $startedAt,
        ?callable $progressCallback,
        array $progressContext,
        array $requestSummary = [],
        array $requestMeta = [],
        string $detailContext = ''
    ): void {
        $elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
        $status = qpmPublicSearchProcessDetailsResolveSourceTerminalStatus($sourceResult);
        $detail = qpmPublicSearchProcessDetailsSanitize(
            qpmPublicSearchProcessDetailsBuildSafeSourceDetail(
                $source,
                $query,
                array_merge(['query' => $query], $requestSummary),
                $requestMeta,
                $sourceResult,
                $detailContext
            )
        );
        if ($collector !== null) {
            qpmPublicSearchProcessDetailsSetSource($collector, $detail);
            $progressContext['sourceQueryDetail'] = $detail;
        }
        $progressContext['status'] = $status;
        $progressContext['elapsedMs'] = $elapsedMs;
        qpmPublicSearchEmitProgress($progressCallback, $source, '', $progressContext);
    }
}
