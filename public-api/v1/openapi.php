<?php
$path = dirname(__DIR__, 2) . '/backend/docs/public-search-openapi.yaml';
if (!is_file($path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'OpenAPI document not found.';
    exit;
}

header('Content-Type: application/yaml; charset=utf-8');
readfile($path);
