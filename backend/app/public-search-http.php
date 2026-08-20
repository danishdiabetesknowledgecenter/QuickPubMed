<?php
/**
 * HTTP/SSE helpers for the public search orchestrator.
 * Split from public-search-lib.php without behavior change (Fase 4).
 */

require_once __DIR__ . '/helpers.php';

if (!function_exists('muginPublicSearchSafePrettyJsonEncode')) {
    /**
     * @param mixed $value
     */
    function muginPublicSearchSafePrettyJsonEncode($value): string
    {
        $encoded = json_encode(
            $value,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
        );
        return is_string($encoded) ? $encoded : '{}';
    }
}

if (!function_exists('muginPublicSearchEmitSseEvent')) {
    function muginPublicSearchEmitSseEvent(string $event, array $payload): void
    {
        echo 'event: ' . trim($event) . "\n";
        // Pretty-print so each JSON line is a separate `data:` line (readable in
        // the browser; frontend rejoins data lines before JSON.parse).
        $encoded = muginPublicSearchSafePrettyJsonEncode($payload);
        foreach (preg_split("/\r\n|\r|\n/", $encoded) ?: [] as $line) {
            echo 'data: ' . $line . "\n";
        }
        echo "\n";
        @ob_flush();
        flush();
    }
}
