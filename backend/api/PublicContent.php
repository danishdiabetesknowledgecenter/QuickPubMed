<?php
/**
 * Public read-only content API for topics/limits.
 */

require_once __DIR__ . '/../app/editor-content-store.php';

/**
 * Merge shared limits with per-domain settings overrides.
 *
 * @param array<string, mixed> $sharedPayload
 * @param array<string, mixed> $domainSettingsPayload
 * @return array<string, mixed>
 */
function qpmMergeLimitsPayload(array $sharedPayload, array $domainSettingsPayload): array
{
    $sharedLimits = isset($sharedPayload['limits']) && is_array($sharedPayload['limits'])
        ? $sharedPayload['limits']
        : [];
    $domainLimits = isset($domainSettingsPayload['limits']) && is_array($domainSettingsPayload['limits'])
        ? $domainSettingsPayload['limits']
        : [];

    $result = $sharedPayload;
    $result['limits'] = qpmMergeLimitNodes($sharedLimits, $domainLimits);
    return $result;
}

/**
 * @param array<int, mixed> $sharedNodes
 * @param array<int, mixed> $overrideNodes
 * @return array<int, mixed>
 */
function qpmMergeLimitNodes(array $sharedNodes, array $overrideNodes): array
{
    $overrideById = [];
    foreach ($overrideNodes as $node) {
        if (!is_array($node)) {
            continue;
        }
        $id = isset($node['id']) ? (string) $node['id'] : '';
        if ($id === '') {
            continue;
        }
        $overrideById[$id] = $node;
    }

    $out = [];
    foreach ($sharedNodes as $sharedNode) {
        if (!is_array($sharedNode)) {
            $out[] = $sharedNode;
            continue;
        }
        $id = isset($sharedNode['id']) ? (string) $sharedNode['id'] : '';
        $overrideNode = $id !== '' && isset($overrideById[$id]) && is_array($overrideById[$id])
            ? $overrideById[$id]
            : [];
        $out[] = qpmMergeLimitNode($sharedNode, $overrideNode);
    }
    return $out;
}

/**
 * Resolve child key used by a limits node.
 *
 * @param array<string, mixed> $node
 */
function qpmDetectLimitChildrenKey(array $node): string
{
    if (array_key_exists('groups', $node)) {
        return 'groups';
    }
    if (array_key_exists('children', $node)) {
        return 'children';
    }
    if (array_key_exists('choices', $node)) {
        return 'choices';
    }
    return '';
}

/**
 * Read children from override node using preferred key with compatibility fallbacks.
 *
 * @param array<string, mixed> $overrideNode
 * @return array<int, mixed>
 */
function qpmResolveOverrideChildren(array $overrideNode, string $preferredKey): array
{
    if ($preferredKey !== '' && isset($overrideNode[$preferredKey]) && is_array($overrideNode[$preferredKey])) {
        return $overrideNode[$preferredKey];
    }
    if ($preferredKey === 'groups') {
        if (isset($overrideNode['choices']) && is_array($overrideNode['choices'])) {
            return $overrideNode['choices'];
        }
        if (isset($overrideNode['children']) && is_array($overrideNode['children'])) {
            return $overrideNode['children'];
        }
        return [];
    }
    if ($preferredKey === 'children') {
        if (isset($overrideNode['choices']) && is_array($overrideNode['choices'])) {
            return $overrideNode['choices'];
        }
        if (isset($overrideNode['groups']) && is_array($overrideNode['groups'])) {
            return $overrideNode['groups'];
        }
        return [];
    }
    if ($preferredKey === 'choices') {
        if (isset($overrideNode['children']) && is_array($overrideNode['children'])) {
            return $overrideNode['children'];
        }
        if (isset($overrideNode['groups']) && is_array($overrideNode['groups'])) {
            return $overrideNode['groups'];
        }
    }
    return [];
}

/**
 * @param array<string, mixed> $sharedNode
 * @param array<string, mixed> $overrideNode
 * @return array<string, mixed>
 */
function qpmMergeLimitNode(array $sharedNode, array $overrideNode): array
{
    $merged = $sharedNode;
    $allowedOverrideFields = [
        'translations',
        'tooltip',
        'tooltip_simple',
        'searchStringComment',
        'semanticConfig',
        'semanticQueryHints',
        'ordering',
        'simpleOrdering',
        'simpleSearch',
        'standardSimple',
        'buttons',
        'hiddenByDefault',
        'lockIdOnSort',
    ];

    foreach ($allowedOverrideFields as $field) {
        if (array_key_exists($field, $overrideNode)) {
            $merged[$field] = $overrideNode[$field];
        }
    }

    $sharedChildrenKey = qpmDetectLimitChildrenKey($sharedNode);
    if ($sharedChildrenKey !== '' && isset($sharedNode[$sharedChildrenKey]) && is_array($sharedNode[$sharedChildrenKey])) {
        $overrideChildren = qpmResolveOverrideChildren($overrideNode, $sharedChildrenKey);
        $merged[$sharedChildrenKey] = qpmMergeLimitNodes($sharedNode[$sharedChildrenKey], $overrideChildren);
    }

    return $merged;
}

// CORS headers - check both Origin and Referer for compatibility
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
    $parsed = parse_url($_SERVER['HTTP_REFERER']);
    $origin = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');
}
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

header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
editorHandlePreflight();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET') {
    editorJsonResponse(405, ['error' => 'Method not allowed']);
}

$type = strtolower(trim((string) ($_GET['type'] ?? '')));
$action = strtolower(trim((string) ($_GET['action'] ?? '')));

if ($action === 'domains' || $type === 'domains') {
    $domains = editorListContentDomains();
    editorJsonResponse(200, [
        'ok' => true,
        'domains' => $domains,
        'domainLabels' => editorGetDomainDisplayLabels($domains),
    ]);
}

if (!in_array($type, ['topics', 'limits', 'prompt-rules'], true)) {
    editorJsonResponse(400, ['error' => 'Invalid or missing type']);
}

$domain = null;
if ($type === 'topics' || $type === 'prompt-rules' || $type === 'limits') {
    $domain = (string) ($_GET['domain'] ?? '');
}

$path = '';
if ($type === 'prompt-rules') {
    $normalizedDomain = editorNormalizeDomain((string) $domain);
    if ($normalizedDomain === '') {
        editorJsonResponse(400, ['error' => 'Domain is required for prompt-rules']);
    }
    if (!editorIsAllowedDomain($normalizedDomain)) {
        editorJsonResponse(400, ['error' => 'Domain is not allowed']);
    }
    $path = editorContentBaseDir() . DIRECTORY_SEPARATOR . $normalizedDomain . DIRECTORY_SEPARATOR . 'prompt-rules.json';
} else {
    $path = editorResolveContentFilePath($type, $domain);
}

if ($type === 'limits') {
    if (!is_file($path)) {
        editorJsonResponse(500, [
            'error' => 'Limits file not found',
            'details' => [
                'path' => $path,
            ],
        ]);
    }
    if (!is_readable($path)) {
        editorJsonResponse(500, [
            'error' => 'Limits file is not readable',
            'details' => [
                'path' => $path,
            ],
        ]);
    }
}

$data = editorReadJsonFile($path);
if ($type === 'limits') {
    if (!isset($data['limits']) || !is_array($data['limits'])) {
        editorJsonResponse(500, [
            'error' => 'Invalid limits payload',
            'details' => [
                'path' => $path,
                'bytes' => is_file($path) ? (int) (@filesize($path) ?: 0) : 0,
                'hasLimitsKey' => array_key_exists('limits', $data),
            ],
        ]);
    }
    $rawDomain = trim((string) $domain);
    $normalizedDomain = editorNormalizeDomain((string) $domain);
    if ($rawDomain !== '' && $normalizedDomain === '') {
        editorJsonResponse(400, ['error' => 'Invalid domain']);
    }
    if ($normalizedDomain !== '') {
        if (!editorIsAllowedDomain($normalizedDomain)) {
            editorJsonResponse(400, ['error' => 'Domain is not allowed']);
        }
        $settingsPath = editorContentBaseDir() . DIRECTORY_SEPARATOR . $normalizedDomain . DIRECTORY_SEPARATOR . 'limits-settings.json';
        $domainSettingsData = editorReadJsonFile($settingsPath);
        $data = qpmMergeLimitsPayload($data, $domainSettingsData);
    }
}

editorJsonResponse(200, [
    'ok' => true,
    'type' => $type,
    'domain' => $domain,
    'data' => $data,
]);
