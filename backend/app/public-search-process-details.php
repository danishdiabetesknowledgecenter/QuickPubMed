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
            'prepare',
            'semanticQuery',
            'searchString',
            'mesh',
            'optimize',
            'semanticScholar',
            'openAlex',
            'elicit',
            'pubmed',
            'rerank',
            'finalizeCollect',
            'finalizeValidatePmid',
            'finalizeValidateDoiFetch',
            'finalizeValidateDoiSource',
            'finalizeValidateDoiRules',
            'finalizeHydrate',
            'finalizeSort',
            'finalRerank',
            'finalizeRender',
            'finalizeSelected',
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
