<?php
/**
 * TelemetryLog.php
 *
 * Append-only JSONL logging endpoint for QuickPubMed's observability flow.
 * Receives anonymized events from src/utils/qpmTelemetry.js and appends one JSON
 * line per event to data/runtime/qpm-telemetry-YYYY-MM-DD.jsonl.
 *
 * Properties:
 *   - POST only, CORS-guarded by qpmApplyNlmCorsHeaders.
 *   - No IP, no User-Agent, no Referer is logged.
 *   - Uses flock(LOCK_EX) to avoid interleaved writes from concurrent users.
 *   - Silently drops events whose serialized size exceeds QPM_TELEMETRY_CONFIG.maxPayloadBytes.
 *   - Retention enforcement: a lightweight probabilistic sweep (~1 % of requests)
 *     removes files older than retentionDays so no cron is required.
 *   - Returns {ok: true, written: N} on success. The client never relies on this
 *     value except for circuit-breaker failure detection.
 */

$configPath = dirname(__DIR__) . '/config/config.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__) . '/config.php';
}
require_once $configPath;
require_once __DIR__ . '/NlmApiHelpers.php';

qpmApplyNlmCorsHeaders('POST, OPTIONS', 'application/json');

$config = defined('QPM_TELEMETRY_CONFIG') ? QPM_TELEMETRY_CONFIG : [];
$enabled = isset($config['enabled']) ? (bool) $config['enabled'] : false;
$maxPayloadBytes = isset($config['maxPayloadBytes']) && is_numeric($config['maxPayloadBytes'])
    ? (int) $config['maxPayloadBytes']
    : 4096;
$retentionDays = isset($config['retentionDays']) && is_numeric($config['retentionDays'])
    ? (int) $config['retentionDays']
    : 30;

if (!$enabled) {
    echo json_encode(['ok' => true, 'written' => 0, 'disabled' => true]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$allowedEventTypes = [
    'semantic_intent_parsed',
    'source_hit_count',
    'source_hit_filter_drop',
    'filter_drop_ratio',
    'preflight_intent',
    'source_probe_counts',
    'overlap_summary',
    'mesh_validation',
    'paraphrase_edited',
    'query_plan_built',
];

$raw = file_get_contents('php://input');
if (!is_string($raw) || $raw === '') {
    echo json_encode(['ok' => true, 'written' => 0]);
    exit;
}
if (strlen($raw) > 200000) {
    // Hard ceiling on body size; ignore massive payloads entirely.
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Payload too large']);
    exit;
}

$decoded = json_decode($raw, true);
if (!is_array($decoded)) {
    echo json_encode(['ok' => true, 'written' => 0]);
    exit;
}

$events = [];
if (isset($decoded['events']) && is_array($decoded['events'])) {
    $events = $decoded['events'];
} elseif (isset($decoded['eventType'])) {
    $events = [$decoded];
}

if (count($events) === 0) {
    echo json_encode(['ok' => true, 'written' => 0]);
    exit;
}

$runtimeDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'runtime';
if (!is_dir($runtimeDir)) {
    @mkdir($runtimeDir, 0775, true);
}
if (!is_dir($runtimeDir)) {
    // Directory genuinely missing — bail out.
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Runtime directory unavailable']);
    exit;
}
// Note: we intentionally do not call is_writable() here. On Windows (incl. OneDrive)
// is_writable() can return false even when fopen() in append mode succeeds, which would
// otherwise make the endpoint falsely report 500. We rely on fopen/fwrite below to
// surface any real write problem.

$day = gmdate('Y-m-d');
$logPath = $runtimeDir . DIRECTORY_SEPARATOR . 'qpm-telemetry-' . $day . '.jsonl';

$lines = [];
$accepted = 0;
$rejected = 0;
foreach ($events as $event) {
    if (!is_array($event)) {
        $rejected++;
        continue;
    }
    $eventType = isset($event['eventType']) ? (string) $event['eventType'] : '';
    if ($eventType === '' || !in_array($eventType, $allowedEventTypes, true)) {
        $rejected++;
        continue;
    }
    $timestamp = isset($event['timestamp']) && is_string($event['timestamp'])
        ? $event['timestamp']
        : gmdate('c');
    $sessionHash = isset($event['sessionHash']) ? substr((string) $event['sessionHash'], 0, 24) : '';
    $promptVersion = isset($event['promptVersion']) ? substr((string) $event['promptVersion'], 0, 16) : '';
    $payload = isset($event['payload']) && is_array($event['payload']) ? $event['payload'] : [];

    $record = [
        'timestamp' => $timestamp,
        'eventType' => $eventType,
        'sessionHash' => $sessionHash,
        'promptVersion' => $promptVersion,
        'payload' => $payload,
    ];
    $encoded = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($encoded)) {
        $rejected++;
        continue;
    }
    if ($maxPayloadBytes > 0 && strlen($encoded) > $maxPayloadBytes) {
        // Silently drop oversized events. The client-side sanitizer aims to keep
        // payloads small; if something slips through it simply isn't persisted.
        $rejected++;
        continue;
    }
    $lines[] = $encoded;
    $accepted++;
}

if ($accepted > 0) {
    $fp = @fopen($logPath, 'ab');
    if ($fp === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Unable to open log file']);
        exit;
    }
    $wroteAll = true;
    try {
        if (@flock($fp, LOCK_EX)) {
            foreach ($lines as $line) {
                if (@fwrite($fp, $line . "\n") === false) {
                    $wroteAll = false;
                    break;
                }
            }
            @fflush($fp);
            @flock($fp, LOCK_UN);
        } else {
            $wroteAll = false;
        }
    } finally {
        @fclose($fp);
    }
    if (!$wroteAll) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Write failure', 'written' => 0]);
        exit;
    }
}

// Probabilistic retention sweep: ~1 % of requests attempt to prune old files.
if ($retentionDays > 0 && mt_rand(1, 100) === 1) {
    qpmTelemetrySweepOldLogs($runtimeDir, $retentionDays);
}

echo json_encode([
    'ok' => true,
    'written' => $accepted,
    'rejected' => $rejected,
]);

/**
 * Remove telemetry JSONL files older than $retentionDays.
 * Only touches files matching qpm-telemetry-*.jsonl.
 */
function qpmTelemetrySweepOldLogs(string $runtimeDir, int $retentionDays): void
{
    $cutoff = time() - $retentionDays * 86400;
    $pattern = $runtimeDir . DIRECTORY_SEPARATOR . 'qpm-telemetry-*.jsonl';
    $files = @glob($pattern);
    if (!is_array($files)) return;
    foreach ($files as $file) {
        $mtime = @filemtime($file);
        if ($mtime !== false && $mtime < $cutoff) {
            @unlink($file);
        }
    }
}
