<?php
/**
 * Live stress suite: 100 SearchForm + public API searches.
 *
 * Covers every major SearchForm/API function at least once, plus many
 * combinations. Writes a JSON report under data/runtime/.
 *
 * Run: php scripts/searchform-api-stress-100.php
 */

$configPath = dirname(__DIR__) . '/backend/config/config.php';
require_once $configPath;
require_once dirname(__DIR__) . '/backend/app/public-search-lib.php';

$base = getenv('MUGIN_STRESS_BASE') ?: 'http://127.0.0.1:8080';
$unifiedUrl = $base . '/backend/api/UnifiedSearch.php';
$publicSearchUrl = $base . '/public-api/v1/search';
$publicHealthUrl = $base . '/public-api/v1/health';
$publicOpenapiUrl = $base . '/public-api/v1/openapi.yaml';
$reportDir = dirname(__DIR__) . '/data/runtime';
if (!is_dir($reportDir) && !mkdir($reportDir, 0777, true) && !is_dir($reportDir)) {
    fwrite(STDERR, "Cannot create report dir\n");
    exit(1);
}

$apiKey = '';
if (defined('MUGIN_API_CLIENTS') && is_array(MUGIN_API_CLIENTS)) {
    foreach (MUGIN_API_CLIENTS as $clientCfg) {
        if (!empty($clientCfg['enabled']) && !empty($clientCfg['api_key'])) {
            $apiKey = (string) $clientCfg['api_key'];
            break;
        }
    }
}

function defaultForm(array $overrides = []): array
{
    return array_merge([
        'domain' => 'template',
        'topic' => 'S010030#s',
        'databases' => 'pubmed',
        'ai' => 'false',
        'sort' => 'relevance',
        'pagesize' => '10',
        'focus' => 'balanced',
        'page' => '1',
    ], $overrides);
}

function encodeForm(array $params): string
{
    $parts = [];
    foreach ($params as $key => $value) {
        if (is_array($value)) {
            foreach ($value as $item) {
                $parts[] = rawurlencode((string) $key) . '=' . rawurlencode((string) $item);
            }
        } elseif ($value !== null) {
            $parts[] = rawurlencode((string) $key) . '=' . rawurlencode((string) $value);
        }
    }
    return implode('&', $parts);
}

function allowedJsonPayload(array $request): array
{
    $keys = [
        'apiVersion', 'query', 'domain', 'sources', 'sort', 'focus', 'page',
        'translation', 'responseOptions', 'hardFilters', 'sourceFilters',
        'intentContext', 'preselectedPmids', 'selected', 'queryOverrides',
        'cachedFreetextQueries', 'standardString',
    ];
    $out = [];
    foreach ($keys as $key) {
        if (array_key_exists($key, $request)) {
            $out[$key] = $request[$key];
        }
    }
    if (!isset($out['apiVersion'])) {
        $out['apiVersion'] = '1';
    }
    if (!isset($out['responseOptions']) || !is_array($out['responseOptions'])) {
        $out['responseOptions'] = [];
    }
    $out['responseOptions']['includeAbstracts'] = true;
    $out['responseOptions']['includeResolvedQueries'] = true;
    $out['responseOptions']['includeProcessDetails'] = true;
    return $out;
}

function jsonFromForm(array $form): array
{
    return allowedJsonPayload(muginPublicSearchBuildRequestFromFlatParams($form));
}

function parseSseResult(string $raw): ?array
{
    $blocks = preg_split("/\r?\n\r?\n/", $raw) ?: [];
    $lastResult = null;
    foreach ($blocks as $block) {
        $event = 'message';
        $dataLines = [];
        foreach (preg_split("/\r?\n/", $block) ?: [] as $line) {
            if (stripos($line, 'event:') === 0) {
                $event = trim(substr($line, 6));
            } elseif (stripos($line, 'data:') === 0) {
                $dataLines[] = substr($line, 5);
            }
        }
        if ($dataLines === []) {
            continue;
        }
        $decoded = json_decode(trim(implode("\n", $dataLines)), true);
        if (!is_array($decoded)) {
            continue;
        }
        if ($event === 'result') {
            $lastResult = $decoded;
        }
        if ($event === 'error') {
            return $decoded;
        }
    }
    return $lastResult;
}

function httpRequest(
    string $method,
    string $url,
    array $headers,
    ?string $body,
    int $timeoutSeconds = 180
): array {
    $ch = curl_init($url);
    $headerLines = [];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $headerLines,
        CURLOPT_TIMEOUT => $timeoutSeconds,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $started = microtime(true);
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $elapsedMs = (int) round((microtime(true) - $started) * 1000);
    if ($raw === false) {
        return [
            'ok' => false,
            'status' => $status,
            'error' => $error !== '' ? $error : ('curl errno ' . $errno),
            'headers' => '',
            'body' => '',
            'json' => null,
            'contentType' => $contentType,
            'elapsedMs' => $elapsedMs,
        ];
    }
    $headerRaw = substr($raw, 0, $headerSize);
    $bodyRaw = substr($raw, $headerSize);
    $json = null;
    $trim = ltrim($bodyRaw);
    if (stripos($contentType, 'text/event-stream') !== false || str_starts_with($trim, 'event:')) {
        $json = parseSseResult($bodyRaw);
    } elseif ($trim !== '' && ($trim[0] === '{' || $trim[0] === '[')) {
        $decoded = json_decode($bodyRaw, true);
        $json = is_array($decoded) ? $decoded : null;
    }
    return [
        'ok' => $errno === 0,
        'status' => $status,
        'error' => $error,
        'headers' => $headerRaw,
        'body' => $bodyRaw,
        'json' => $json,
        'contentType' => $contentType,
        'elapsedMs' => $elapsedMs,
    ];
}

function pubmedQueryFrom(array $json): string
{
    $parts = [];
    $resolved = is_array($json['resolvedQueries'] ?? null) ? $json['resolvedQueries'] : [];
    foreach (['pubmedQuery', 'hardFilterQuery'] as $key) {
        $value = $resolved[$key] ?? '';
        if (is_string($value) && trim($value) !== '') {
            $parts[] = $value;
        }
    }
    if ($parts !== []) {
        return implode(' AND ', $parts);
    }
    $details = $json['processDetails']['pubmedQuery'] ?? '';
    return is_string($details) ? $details : '';
}

function buildCases(): array
{
    $cases = [];
    $add = static function (array $case) use (&$cases): void {
        $cases[] = $case;
    };

    $add(['id' => 1, 'name' => 'GET /v1/health', 'surface' => 'health', 'expectStatus' => 200]);
    $add(['id' => 2, 'name' => 'GET /v1/openapi.yaml', 'surface' => 'openapi', 'expectStatus' => 200]);
    $add(['id' => 3, 'name' => 'POST public JSON uden auth', 'surface' => 'public-json-noauth', 'form' => defaultForm(), 'expectStatus' => 401]);
    $add(['id' => 4, 'name' => 'POST public JSON katalog+pubmed', 'surface' => 'public-json', 'form' => defaultForm(), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 5, 'name' => 'POST public form SearchForm-parametre', 'surface' => 'public-form', 'form' => defaultForm(), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 6, 'name' => 'GET public SearchForm-parametre', 'surface' => 'public-get', 'form' => defaultForm(), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 7, 'name' => 'POST UnifiedSearch form (SearchForm-kontrakt)', 'surface' => 'unified-form', 'form' => defaultForm(), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 8, 'name' => 'POST UnifiedSearch JSON (widget-payload)', 'surface' => 'unified-json', 'form' => defaultForm(), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 9, 'name' => 'JSON ukendt felt afvises', 'surface' => 'public-json-raw', 'json' => ['apiVersion' => '1', 'query' => ['text' => 'diabetes'], 'sources' => ['pubmed'], 'nope' => true], 'expectStatus' => 422]);
    $add(['id' => 10, 'name' => 'GET case-insensitive nøgler', 'surface' => 'public-get', 'form' => ['Domain' => 'template', 'TOPIC' => 'S010030#s', 'Databases' => 'pubmed', 'AI' => 'false', 'Sort' => 'relevance', 'PageSize' => '10'], 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 11, 'name' => 'UI-only parametre ignoreres', 'surface' => 'public-form', 'form' => defaultForm(['advanced' => 'true', 'collapsed' => 'false', 'openlimits' => 'true', 'scrollto' => 'x', 'mugindebug' => 'searchflow', 'component' => '1']), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 12, 'name' => 'Tom query uden topic/q* -> 422', 'surface' => 'public-form', 'form' => ['databases' => 'pubmed', 'ai' => 'false'], 'expectStatus' => 422]);
    $add(['id' => 13, 'name' => 'Katalog-topic uden domain -> 422', 'surface' => 'public-form', 'form' => ['topic' => 'S010030#s', 'databases' => 'pubmed', 'ai' => 'false'], 'expectStatus' => 422]);
    $add(['id' => 14, 'name' => 'Ugyldig kilde afvises', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'not-a-source']), 'expectStatus' => 422]);

    $add(['id' => 15, 'name' => 'Fritekst AI da (widget)', 'surface' => 'unified-json', 'form' => defaultForm(['topic' => '{{Hvilken effekt har motion ved type 2-diabetes?}}#s:raw', 'ai' => 'true', 'lang' => 'da']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 16, 'name' => 'Fritekst AI en', 'surface' => 'public-form', 'form' => defaultForm(['topic' => '{{effect of exercise in type 2 diabetes}}#s:raw', 'ai' => 'true', 'lang' => 'en']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 17, 'name' => 'Fritekst AI slået fra pubmed', 'surface' => 'unified-form', 'form' => defaultForm(['topic' => '{{diabetes education}}#s:raw', 'ai' => 'false']), 'expectStatus' => 200, 'expectPubmedContains' => ['diabetes education']]);
    $add(['id' => 18, 'name' => 'Katalog Alle typer diabetes S010010', 'surface' => 'unified-form', 'form' => defaultForm(['topic' => 'S010010#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['Diabetes Mellitus'], 'minResults' => 1]);
    $add(['id' => 19, 'name' => 'Custom topic #s:raw', 'surface' => 'public-form', 'form' => defaultForm(['topic' => '{{kulhydrattælling ved diabetes}}#s:raw', 'ai' => 'true']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 20, 'name' => 'Custom topic #s:pubmed', 'surface' => 'unified-form', 'form' => defaultForm(['topic' => '{{("Carbohydrates"[mh] OR carb counting[tiab])}}#s:pubmed', 'ai' => 'false']), 'expectStatus' => 200, 'expectPubmedContains' => ['Carbohydrates']]);
    $add(['id' => 21, 'name' => 'Katalog + custom AND', 'surface' => 'public-form', 'form' => defaultForm(['topic' => ['S010030#s', '{{exercise[tiab]}}#s:pubmed']]), 'expectStatus' => 200, 'expectPubmedContains' => ['Diabetes Mellitus, Type 2', 'exercise']]);
    $add(['id' => 22, 'name' => 'To katalog-emner AND', 'surface' => 'unified-form', 'form' => defaultForm(['topic' => ['S010030#s', 'S010020#s']]), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 23, 'name' => 'To katalog-emner OR i samme topic=', 'surface' => 'public-form', 'form' => defaultForm(['topic' => 'S010030#s,S010020#s']), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 24, 'name' => 'Scope narrow #n', 'surface' => 'unified-form', 'form' => defaultForm(['topic' => 'S010030#n']), 'expectStatus' => 200, 'minResults' => 1]);

    $add(['id' => 25, 'name' => 'Kun pubmed', 'surface' => 'unified-form', 'form' => defaultForm(['databases' => 'pubmed']), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 26, 'name' => 'Kun Semantic Scholar + qsemanticscholar', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'semanticscholar', 'ai' => 'true', 'qsemanticscholar' => 'type 2 diabetes exercise', 'topic' => '{{type 2 diabetes exercise}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 27, 'name' => 'Kun OpenAlex + qopenalex', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'openalex', 'ai' => 'true', 'qopenalex' => 'type 2 diabetes', 'topic' => '{{type 2 diabetes}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 28, 'name' => 'Kun Elicit + qelicit', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'elicit', 'ai' => 'true', 'qelicit' => 'type 2 diabetes treatment', 'topic' => '{{type 2 diabetes treatment}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 29, 'name' => 'pubmed+semanticscholar overrides', 'surface' => 'unified-json', 'form' => defaultForm(['databases' => 'pubmed,semanticscholar', 'ai' => 'true', 'qpubmed' => '"Diabetes Mellitus, Type 2"[mh]', 'qsemanticscholar' => 'type 2 diabetes']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 30, 'name' => 'pubmed+openalex', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'pubmed,openalex', 'ai' => 'true', 'qpubmed' => '"Diabetes Mellitus, Type 2"[mh]', 'qopenalex' => 'type 2 diabetes']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 31, 'name' => 'Default widget-kilder pubmed+ss+oa', 'surface' => 'unified-json', 'form' => defaultForm(['databases' => 'pubmed,semanticscholar,openalex', 'ai' => 'true', 'qpubmed' => '"Diabetes Mellitus, Type 2"[mh]', 'qsemanticscholar' => 'type 2 diabetes', 'qopenalex' => 'type 2 diabetes']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 32, 'name' => 'Alle fire kilder', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'pubmed,semanticscholar,openalex,elicit', 'ai' => 'true', 'qpubmed' => '"Diabetes Mellitus, Type 2"[mh]', 'qsemanticscholar' => 'type 2 diabetes', 'qopenalex' => 'type 2 diabetes', 'qelicit' => 'type 2 diabetes']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 33, 'name' => 'ss+oa uden pubmed', 'surface' => 'unified-form', 'form' => defaultForm(['databases' => 'semanticscholar,openalex', 'ai' => 'true', 'qsemanticscholar' => 'type 2 diabetes', 'qopenalex' => 'type 2 diabetes', 'topic' => '{{type 2 diabetes}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 34, 'name' => 'Semantiske kilder med AI slået fra', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'pubmed,semanticscholar,openalex', 'ai' => 'false', 'topic' => '{{diabetes motion}}#s:raw']), 'expectStatus' => 200, 'allowEmpty' => true, 'notes' => 'AI off + semantic sources']);

    foreach ([
        35 => 'balanced',
        36 => 'highest-evidence',
        37 => 'clinical-practice',
        38 => 'newest-research',
        39 => 'broad-mapping',
    ] as $id => $focus) {
        $add(['id' => $id, 'name' => 'Focus ' . $focus, 'surface' => 'unified-form', 'form' => defaultForm(['focus' => $focus]), 'expectStatus' => 200, 'minResults' => 1, 'expectFocus' => $focus]);
    }
    $formNoFocus = defaultForm();
    unset($formNoFocus['focus']);
    $add(['id' => 40, 'name' => 'Focus udeladt', 'surface' => 'public-form', 'form' => $formNoFocus, 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 41, 'name' => 'Sort date_desc', 'surface' => 'unified-form', 'form' => defaultForm(['sort' => 'date_desc']), 'expectStatus' => 200, 'minResults' => 1, 'expectSort' => 'date_desc']);
    $add(['id' => 42, 'name' => 'Sort date_asc', 'surface' => 'public-form', 'form' => defaultForm(['sort' => 'date_asc']), 'expectStatus' => 200, 'minResults' => 1, 'expectSort' => 'date_asc']);
    $add(['id' => 43, 'name' => 'Side 2', 'surface' => 'unified-form', 'form' => defaultForm(['page' => '2', 'pagesize' => '10']), 'expectStatus' => 200]);
    $add(['id' => 44, 'name' => 'pagesize 10 (SearchForm)', 'surface' => 'public-form', 'form' => defaultForm(['pagesize' => '10']), 'expectStatus' => 200, 'minResults' => 1, 'expectPageSize' => 10]);
    $add(['id' => 45, 'name' => 'pagesize 25 (SearchForm default)', 'surface' => 'unified-form', 'form' => defaultForm(['pagesize' => '25']), 'expectStatus' => 200, 'minResults' => 1, 'expectPageSize' => 25]);
    $add(['id' => 46, 'name' => 'pagesize 50 (SearchForm max UI)', 'surface' => 'public-form', 'form' => defaultForm(['pagesize' => '50']), 'expectStatus' => 200, 'minResults' => 1, 'expectPageSize' => 50]);
    $add(['id' => 47, 'name' => 'pagesize 100 (API max)', 'surface' => 'public-json', 'form' => defaultForm(['pagesize' => '100']), 'expectStatus' => 200, 'expectPageSize' => 100]);

    $add(['id' => 48, 'name' => 'qpubmed override', 'surface' => 'unified-form', 'form' => defaultForm(['qpubmed' => 'exercise[tiab] AND diabetes[tiab]', 'topic' => '{{ignored freetext}}#s:raw', 'ai' => 'false']), 'expectStatus' => 200, 'expectPubmedContains' => ['exercise[tiab]']]);
    $add(['id' => 49, 'name' => 'qsemanticscholar override', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'semanticscholar', 'ai' => 'true', 'qsemanticscholar' => 'metformin type 2 diabetes', 'topic' => '{{metformin}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 50, 'name' => 'qopenalex override', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'openalex', 'ai' => 'true', 'qopenalex' => 'SGLT2 inhibitors diabetes', 'topic' => '{{SGLT2}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 51, 'name' => 'qelicit override', 'surface' => 'public-form', 'form' => defaultForm(['databases' => 'elicit', 'ai' => 'true', 'qelicit' => 'GLP-1 receptor agonists diabetes', 'topic' => '{{GLP-1}}#s:raw']), 'expectStatus' => 200, 'slow' => true]);
    $add(['id' => 52, 'name' => 'qpubmed vinder over fritekst for pubmed', 'surface' => 'unified-json', 'form' => defaultForm(['qpubmed' => '"Metformin"[mh]', 'topic' => '{{julemanden}}#s:raw', 'ai' => 'true']), 'expectStatus' => 200, 'expectPubmedContains' => ['Metformin'], 'slow' => true]);
    $add(['id' => 53, 'name' => 'qpubmed + limit AND', 'surface' => 'public-form', 'form' => defaultForm(['qpubmed' => '"Diabetes Mellitus, Type 2"[mh]', 'limit' => 'L030010#s', 'ai' => 'false']), 'expectStatus' => 200, 'expectPubmedContains' => ['Diabetes Mellitus, Type 2', 'English']]);

    $limitSolos = [
        54 => ['L010010#s', 'systematic[sb]'],
        55 => ['L010020#s', 'Cochrane Database'],
        56 => ['L010030#s', null],
        57 => ['L010040#s', 'Guideline'],
        58 => ['L010050#s', 'Review'],
        59 => ['L020050#s', 'Randomized Controlled Trial'],
        60 => ['L020040#s', 'Qualitative Research'],
        61 => ['L020010#s', 'Case-Control'],
        62 => ['L020020#s', 'Incidence'],
        63 => ['L020030#s', 'Cohort Studies'],
        64 => ['L020060#s', 'Costs and Cost Analysis'],
        65 => ['L025010#s', null],
        66 => ['L025020#s', null],
        67 => ['L025030#s', null],
        68 => ['L030010#s', 'English'],
        69 => ['L030020#s', 'Danish'],
        70 => ['L030030#s', 'Norwegian'],
        71 => ['L040010#s', null],
        72 => ['L050010#s', 'Female'],
        73 => ['L060010#s', null],
        74 => ['L070010#s', 'y_1'],
        75 => ['L080010#s', 'denmark'],
        76 => ['L090010#s', 'fha'],
    ];
    foreach ($limitSolos as $id => [$limit, $needle]) {
        $case = [
            'id' => $id,
            'name' => 'Limit ' . $limit,
            'surface' => ($id % 2 === 0) ? 'unified-form' : 'public-form',
            'form' => defaultForm(['limit' => $limit]),
            'expectStatus' => 200,
            'allowEmpty' => in_array($id, [56, 66, 67, 69, 70], true),
        ];
        if (is_string($needle) && $needle !== '') {
            $case['expectPubmedContains'] = [$needle];
        }
        if ($id === 74) {
            $case['expectPubmedNotContains'] = ['1:1[dp]'];
        }
        $add($case);
    }

    $add(['id' => 77, 'name' => 'Limit OA L090020', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => 'L090020#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['ffrft']]);
    $add(['id' => 78, 'name' => 'Fjern dyrestudier LXXX010', 'surface' => 'public-form', 'form' => defaultForm(['limit' => 'LXXX010#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['Humans']]);
    $add(['id' => 79, 'name' => 'Kun dyrestudier LXXX020', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => 'LXXX020#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['Animals']]);
    $add(['id' => 80, 'name' => 'Ældre L60080 (historisk ID)', 'surface' => 'public-form', 'form' => defaultForm(['limit' => 'L60080#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['Aged']]);
    $add(['id' => 81, 'name' => 'Gamle L60090 (historisk ID)', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => 'L60090#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['Aged, 80 and over']]);
    $add(['id' => 82, 'name' => 'Danmark L040050', 'surface' => 'public-form', 'form' => defaultForm(['limit' => 'L040050#s']), 'expectStatus' => 200]);
    $add(['id' => 83, 'name' => 'Steno Diabetes Center L080020020', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => 'L080020020#s']), 'expectStatus' => 200, 'allowEmpty' => true, 'expectPubmedContains' => ['steno']]);
    $add(['id' => 84, 'name' => 'Sprog OR engelsk,dansk', 'surface' => 'public-form', 'form' => defaultForm(['limit' => 'L030010#s,L030020#s']), 'expectStatus' => 200, 'expectPubmedContains' => ['English', 'Danish', 'OR']]);
    $add(['id' => 85, 'name' => 'Sprog AND konflikt engelsk+dansk', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => ['L030010#s', 'L030020#s']]), 'expectStatus' => 200, 'allowEmpty' => true, 'expectPubmedContains' => ['AND']]);
    $add(['id' => 86, 'name' => 'Køn AND konflikt kvinde+mand', 'surface' => 'public-form', 'form' => defaultForm(['limit' => ['L050010#s', 'L050020#s']]), 'expectStatus' => 200, 'allowEmpty' => true, 'expectPubmedContains' => [') AND (']]);
    $add(['id' => 87, 'name' => 'SR AND RCT', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => ['L010010#s', 'L020050#s']]), 'expectStatus' => 200, 'allowEmpty' => true]);
    $add(['id' => 88, 'name' => 'Journal AND preprint (pubmed-only, L025 uden PubMed-streng)', 'surface' => 'public-form', 'form' => defaultForm(['limit' => ['L025010#s', 'L025030#s']]), 'expectStatus' => 200, 'notes' => 'source-format does not change PubMed query']);
    $add(['id' => 89, 'name' => 'Simple-mode standardkombination', 'surface' => 'unified-json', 'form' => defaultForm(['limit' => ['L010010#s', 'L025010#s', 'L030010#s', 'L040010#s', 'LXXX010#s']]), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 90, 'name' => 'Mænd + voksne', 'surface' => 'public-form', 'form' => defaultForm(['limit' => ['L050020#s', 'L060050#s']]), 'expectStatus' => 200]);
    $add(['id' => 91, 'name' => '5 år + newest-research', 'surface' => 'unified-form', 'form' => defaultForm(['limit' => 'L070020#s', 'focus' => 'newest-research']), 'expectStatus' => 200, 'expectPubmedContains' => ['y_5'], 'expectPubmedNotContains' => ['5:5[dp]']]);
    $add(['id' => 92, 'name' => 'Skabelon-limit L000010 (xxx må ikke lække)', 'surface' => 'public-form', 'form' => defaultForm(['limit' => 'L000010#s']), 'expectStatus' => 200, 'allowEmpty' => true, 'expectPubmedNotContains' => ['xxx']]);

    $add(['id' => 93, 'name' => 'selected pmid pin', 'surface' => 'unified-form', 'form' => defaultForm(['selected' => 'pmid:37956037']), 'expectStatus' => 200]);
    $add(['id' => 94, 'name' => 'selected doi pin', 'surface' => 'public-form', 'form' => defaultForm(['selected' => 'doi:10.2337/dc23-0676']), 'expectStatus' => 200]);
    $add(['id' => 95, 'name' => 'SSE stream=1', 'surface' => 'public-form', 'form' => defaultForm(['stream' => '1', 'lang' => 'da']), 'expectStatus' => 200, 'stream' => true, 'minResults' => 1]);
    $add(['id' => 96, 'name' => 'nocache=1', 'surface' => 'unified-form', 'form' => defaultForm(['nocache' => '1']), 'expectStatus' => 200, 'minResults' => 1]);
    $add(['id' => 97, 'name' => 'checklimits union', 'surface' => 'public-form', 'form' => defaultForm(['checklimits' => 'L070030#s', 'limit' => 'L030010#s']), 'expectStatus' => 200]);
    $add(['id' => 98, 'name' => 'includeProcessDetails widget JSON', 'surface' => 'unified-json', 'form' => defaultForm(), 'expectStatus' => 200, 'minResults' => 1, 'expectProcessDetails' => true]);
    $add(['id' => 99, 'name' => 'standardString JSON (katalog styrer AND på fritekst)', 'surface' => 'public-json-raw', 'json' => array_merge(jsonFromForm(defaultForm(['topic' => '{{exercise}}#s:raw', 'ai' => 'false'])), ['standardString' => ['text' => 'diabet*[tiab]', 'scope' => 'normal']]), 'expectStatus' => 200, 'allowEmpty' => true]);
    $add(['id' => 100, 'name' => 'Paritet UnifiedSearch vs public form', 'surface' => 'parity', 'form' => defaultForm(['limit' => ['L010010#s', 'L030010#s'], 'pagesize' => '10']), 'expectStatus' => 200]);

    return $cases;
}

function analyzeCase(array $case, array $http): array
{
    $issues = [];
    $json = is_array($http['json'] ?? null) ? $http['json'] : [];
    $status = (int) ($http['status'] ?? 0);
    $expect = (int) ($case['expectStatus'] ?? 200);
    $results = is_array($json['results'] ?? null) ? $json['results'] : [];
    $total = $json['total'] ?? null;
    $warnings = is_array($json['warnings'] ?? null) ? $json['warnings'] : [];
    $partial = ($json['partial'] ?? false) === true;
    $pubmedQuery = pubmedQueryFrom($json);
    $errorText = (string) ($json['error'] ?? ($http['error'] ?? ''));

    if ($status !== $expect) {
        $issues[] = [
            'code' => 'HTTP_STATUS',
            'detail' => "Forventet {$expect}, fik {$status}" . ($errorText !== '' ? " ({$errorText})" : ''),
        ];
    }
    if ($expect === 200 && $status === 200) {
        $minResults = (int) ($case['minResults'] ?? 0);
        $allowEmpty = !empty($case['allowEmpty']);
        if ($minResults > 0 && count($results) < $minResults && !$allowEmpty) {
            $issues[] = ['code' => 'UNEXPECTED_EMPTY', 'detail' => 'Færre resultater end forventet (' . count($results) . ')'];
        }
        foreach ($results as $index => $row) {
            $title = trim((string) ($row['title'] ?? ''));
            if ($title === '') {
                $issues[] = ['code' => 'MISSING_TITLE', 'detail' => 'Resultat #' . ($index + 1) . ' mangler title'];
                break;
            }
        }
        if (!empty($case['expectPubmedContains']) && $pubmedQuery !== '') {
            foreach ((array) $case['expectPubmedContains'] as $needle) {
                if (stripos($pubmedQuery, (string) $needle) === false) {
                    $issues[] = ['code' => 'QUERY_FRAGMENT_MISSING', 'detail' => 'PubMed-query mangler "' . $needle . '"'];
                }
            }
        } elseif (!empty($case['expectPubmedContains']) && $pubmedQuery === '') {
            $issues[] = ['code' => 'QUERY_MISSING', 'detail' => 'Ingen pubmedQuery/hardFilterQuery i svaret'];
        }
        if (!empty($case['expectPubmedNotContains']) && $pubmedQuery !== '') {
            foreach ((array) $case['expectPubmedNotContains'] as $needle) {
                if (stripos($pubmedQuery, (string) $needle) !== false) {
                    $issues[] = ['code' => 'QUERY_FRAGMENT_FORBIDDEN', 'detail' => 'PubMed-query indeholder "' . $needle . '"'];
                }
            }
        }
        if (!empty($case['expectFocus'])) {
            $gotFocus = (string) ($json['focus'] ?? '');
            if ($gotFocus !== '' && $gotFocus !== $case['expectFocus']) {
                $issues[] = ['code' => 'FOCUS_MISMATCH', 'detail' => 'focus=' . $gotFocus];
            }
        }
        if (!empty($case['expectSort'])) {
            $gotSort = (string) ($json['order']['requestedMethod'] ?? ($json['sort']['method'] ?? ''));
            if ($gotSort !== '' && $gotSort !== $case['expectSort']) {
                $issues[] = ['code' => 'SORT_MISMATCH', 'detail' => 'sort=' . $gotSort];
            }
        }
        if (!empty($case['expectPageSize'])) {
            $gotSize = (int) ($json['page']['size'] ?? 0);
            if ($gotSize > 0 && $gotSize !== (int) $case['expectPageSize']) {
                $issues[] = ['code' => 'PAGESIZE_MISMATCH', 'detail' => 'page.size=' . $gotSize];
            }
        }
        if (!empty($case['expectProcessDetails'])) {
            $hasDetails = isset($json['processDetails']) || isset($json['resolvedQueries']);
            if (!$hasDetails) {
                $issues[] = ['code' => 'PROCESS_DETAILS_MISSING', 'detail' => 'Ingen processDetails/resolvedQueries'];
            }
        }
        if ($partial) {
            $issues[] = ['code' => 'PARTIAL', 'detail' => 'partial=true'];
        }
        if ($warnings !== []) {
            $issues[] = ['code' => 'WARNINGS', 'detail' => implode(' | ', array_map('strval', $warnings))];
        }
        if (!empty($case['weaknessIfOk'])) {
            $issues[] = ['code' => 'WEAKNESS', 'detail' => $case['weaknessIfOk']];
        }
        $elapsed = (int) ($http['elapsedMs'] ?? 0);
        if ($elapsed > 120000) {
            $issues[] = ['code' => 'SLOW', 'detail' => $elapsed . ' ms'];
        }
        if ($status === 429) {
            $issues[] = ['code' => 'RATE_LIMIT', 'detail' => '429'];
        }
    }
    if ($status === 429) {
        $issues[] = ['code' => 'RATE_LIMIT', 'detail' => '429 Rate limit exceeded'];
    }

    return [
        'id' => $case['id'],
        'name' => $case['name'],
        'surface' => $case['surface'],
        'status' => $status,
        'expectStatus' => $expect,
        'elapsedMs' => (int) ($http['elapsedMs'] ?? 0),
        'resultCount' => count($results),
        'total' => $total,
        'partial' => $partial,
        'warnings' => $warnings,
        'error' => $errorText,
        'pubmedQuery' => substr($pubmedQuery, 0, 400),
        'focus' => $json['focus'] ?? null,
        'sort' => $json['order']['requestedMethod'] ?? null,
        'pageSize' => $json['page']['size'] ?? null,
        'issues' => $issues,
        'ok' => $issues === [] || (
            count(array_filter($issues, static fn($i) => ($i['code'] ?? '') !== 'WEAKNESS' && ($i['code'] ?? '') !== 'WARNINGS' && ($i['code'] ?? '') !== 'PARTIAL')) === 0
            && $status === $expect
        ),
        'hardFail' => count(array_filter($issues, static fn($i) => !in_array($i['code'] ?? '', ['WEAKNESS', 'WARNINGS', 'PARTIAL', 'SLOW'], true))) > 0,
    ];
}

function executeCase(array $case, string $unifiedUrl, string $publicSearchUrl, string $publicHealthUrl, string $publicOpenapiUrl, string $apiKey): array
{
    $surface = $case['surface'];
    $form = $case['form'] ?? [];
    $headersJson = ['Content-Type' => 'application/json', 'Accept' => 'application/json'];
    $headersForm = ['Content-Type' => 'application/x-www-form-urlencoded', 'Accept' => 'application/json'];
    $auth = ['X-API-Key' => $apiKey];

    if ($surface === 'health') {
        return httpRequest('GET', $publicHealthUrl, ['Accept' => 'application/json'], null, 15);
    }
    if ($surface === 'openapi') {
        return httpRequest('GET', $publicOpenapiUrl, ['Accept' => 'text/yaml, application/yaml, text/plain'], null, 15);
    }
    if ($surface === 'public-json-noauth') {
        return httpRequest('POST', $publicSearchUrl, $headersJson, json_encode(jsonFromForm($form), JSON_UNESCAPED_UNICODE));
    }
    if ($surface === 'public-json') {
        return httpRequest('POST', $publicSearchUrl, $headersJson + $auth, json_encode(jsonFromForm($form), JSON_UNESCAPED_UNICODE));
    }
    if ($surface === 'public-json-raw') {
        return httpRequest('POST', $publicSearchUrl, $headersJson + $auth, json_encode($case['json'], JSON_UNESCAPED_UNICODE));
    }
    if ($surface === 'public-form') {
        $qs = encodeForm($form);
        return httpRequest('POST', $publicSearchUrl, $headersForm + $auth, $qs);
    }
    if ($surface === 'public-get') {
        $qs = encodeForm($form);
        $headers = ['Accept' => 'application/json'] + $auth;
        return httpRequest('GET', $publicSearchUrl . '?' . $qs, $headers, null);
    }
    if ($surface === 'unified-form') {
        return httpRequest('POST', $unifiedUrl, $headersForm, encodeForm($form));
    }
    if ($surface === 'unified-json') {
        return httpRequest('POST', $unifiedUrl, $headersJson, json_encode(jsonFromForm($form), JSON_UNESCAPED_UNICODE));
    }
    if ($surface === 'parity') {
        $unified = httpRequest('POST', $unifiedUrl, $headersForm, encodeForm($form));
        $public = httpRequest('POST', $publicSearchUrl, $headersForm + $auth, encodeForm($form));
        $merged = $unified;
        $merged['_parity'] = [
            'unifiedStatus' => $unified['status'],
            'publicStatus' => $public['status'],
            'unifiedTotal' => is_array($unified['json']) ? ($unified['json']['total'] ?? null) : null,
            'publicTotal' => is_array($public['json']) ? ($public['json']['total'] ?? null) : null,
            'unifiedCount' => is_array($unified['json']['results'] ?? null) ? count($unified['json']['results']) : 0,
            'publicCount' => is_array($public['json']['results'] ?? null) ? count($public['json']['results']) : 0,
        ];
        if (($merged['_parity']['unifiedTotal'] ?? null) !== ($merged['_parity']['publicTotal'] ?? null)) {
            $json = is_array($merged['json']) ? $merged['json'] : [];
            $json['warnings'] = array_merge(
                (array) ($json['warnings'] ?? []),
                ['PARITY_TOTAL_MISMATCH unified=' . json_encode($merged['_parity']['unifiedTotal']) . ' public=' . json_encode($merged['_parity']['publicTotal'])]
            );
            $merged['json'] = $json;
        }
        $merged['elapsedMs'] = (int) ($unified['elapsedMs'] ?? 0) + (int) ($public['elapsedMs'] ?? 0);
        return $merged;
    }
    throw new RuntimeException('Unknown surface ' . $surface);
}

$cases = buildCases();
if (count($cases) !== 100) {
    fwrite(STDERR, 'Expected 100 cases, got ' . count($cases) . "\n");
    exit(1);
}

$health = ['status' => 0, 'error' => ''];
for ($attempt = 1; $attempt <= 3; $attempt++) {
    $health = httpRequest('GET', $publicHealthUrl, ['Accept' => 'application/json'], null, 45);
    if (($health['status'] ?? 0) === 200) {
        break;
    }
    usleep(400000);
}
if (($health['status'] ?? 0) !== 200) {
    fwrite(
        STDERR,
        "Backend health failed HTTP " . ($health['status'] ?? 0)
        . ' ' . (string) ($health['error'] ?? '')
        . " — start php -S 127.0.0.1:8080\n"
    );
    exit(1);
}
if ($apiKey === '') {
    fwrite(STDERR, "No enabled public API client key in config.php\n");
    exit(1);
}

$results = [];
$startedAll = microtime(true);
foreach ($cases as $index => $case) {
    $label = sprintf('[%03d/100] %s', $case['id'], $case['name']);
    echo $label . " ... ";
    $http = executeCase($case, $unifiedUrl, $publicSearchUrl, $publicHealthUrl, $publicOpenapiUrl, $apiKey);
    $row = analyzeCase($case, $http);
    if (!empty($http['_parity'])) {
        $row['parity'] = $http['_parity'];
    }
    $results[] = $row;
    $flag = $row['hardFail'] ? 'FAIL' : (!empty($row['issues']) ? 'WEAK' : 'OK');
    echo $flag . ' HTTP ' . $row['status'] . ' ' . $row['elapsedMs'] . 'ms results=' . $row['resultCount'] . PHP_EOL;
    if ($row['hardFail']) {
        foreach ($row['issues'] as $issue) {
            echo '    - ' . $issue['code'] . ': ' . $issue['detail'] . PHP_EOL;
        }
        if ($row['error'] !== '') {
            echo '    error: ' . substr($row['error'], 0, 240) . PHP_EOL;
        }
    }
    // Stay under unifiedSearch 30/min even if searches are fast cache hits.
    if ($index < 99) {
        usleep(250000);
    }
}

$elapsedAll = (int) round((microtime(true) - $startedAll) * 1000);
$hardFails = array_values(array_filter($results, static fn($r) => !empty($r['hardFail'])));
$weak = array_values(array_filter($results, static fn($r) => empty($r['hardFail']) && !empty($r['issues'])));
$ok = array_values(array_filter($results, static fn($r) => empty($r['issues'])));

$report = [
    'generatedAt' => gmdate('c'),
    'elapsedMs' => $elapsedAll,
    'counts' => [
        'total' => 100,
        'ok' => count($ok),
        'weaknesses' => count($weak),
        'hardFails' => count($hardFails),
    ],
    'hardFails' => $hardFails,
    'weaknesses' => $weak,
    'results' => $results,
];
$reportPath = $reportDir . '/searchform-api-stress-100-report.json';
file_put_contents($reportPath, json_encode($report, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

echo PHP_EOL . 'Done. OK=' . count($ok) . ' WEAK=' . count($weak) . ' FAIL=' . count($hardFails) . PHP_EOL;
echo 'Report: ' . $reportPath . PHP_EOL;
exit(count($hardFails) > 0 ? 2 : 0);
