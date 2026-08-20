<?php

function muginResolveOriginWithRefererFallback() {
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

function muginApplyNlmCorsHeaders($allowedMethods, $contentType = null) {
    $origin = muginResolveOriginWithRefererFallback();
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

function muginNormalizeSearchFlowDebugFlag($value): bool {
    if ($value === true || $value === 1) {
        return true;
    }
    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'true', 'yes', 'on', 'searchflow', 'all'], true);
}

function muginIsSearchFlowDebugRequest(array $params): bool {
    if (array_key_exists('debugSearchFlow', $params)) {
        return muginNormalizeSearchFlowDebugFlag($params['debugSearchFlow']);
    }
    if (array_key_exists('debug_search_flow', $params)) {
        return muginNormalizeSearchFlowDebugFlag($params['debug_search_flow']);
    }
    if (isset($params['debug']) && is_array($params['debug']) && array_key_exists('searchFlow', $params['debug'])) {
        return muginNormalizeSearchFlowDebugFlag($params['debug']['searchFlow']);
    }
    return false;
}
