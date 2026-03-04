<?php

function qpmResolveOriginWithRefererFallback() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        return $origin;
    }
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    if ($referer === '') {
        return '';
    }
    $parsed = parse_url($referer);
    $scheme = $parsed['scheme'] ?? 'https';
    $host = $parsed['host'] ?? '';
    if ($host === '') {
        return '';
    }
    return $scheme . '://' . $host;
}

function qpmApplyNlmCorsHeaders($allowedMethods, $contentType = null) {
    $origin = qpmResolveOriginWithRefererFallback();
    $allowedOrigin = getAllowedOrigin($origin);

    if ($allowedOrigin) {
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Credentials: true');
    } elseif ($origin !== '') {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Origin is not allowed']);
        exit;
    }

    header('Access-Control-Allow-Methods: ' . $allowedMethods);
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');
    if ($contentType !== null) {
        header('Content-Type: ' . $contentType);
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}
