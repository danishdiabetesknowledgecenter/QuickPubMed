<?php
/**
 * SearchForm-compatible flat parameter parsing for public search
 * (application/x-www-form-urlencoded POST and GET query strings).
 */

if (!function_exists('qpmPublicSearchFlatParamsMaxLimitTokens')) {
    function qpmPublicSearchFlatParamsMaxLimitTokens(): int
    {
        return 200;
    }
}

if (!function_exists('qpmPublicSearchFlatParamsMaxPmidTokens')) {
    function qpmPublicSearchFlatParamsMaxPmidTokens(): int
    {
        return 50;
    }
}

if (!function_exists('qpmPublicSearchFlatParamsMaxTopicTokens')) {
    function qpmPublicSearchFlatParamsMaxTopicTokens(): int
    {
        return 200;
    }
}

if (!function_exists('qpmPublicSearchNormalizeFlatParamKeys')) {
    /**
     * Lowercases form parameter keys. On collision the first value wins,
     * except `limit` where all values are collected as an AND-group list.
     *
     * @param array<string,mixed> $params
     * @return array<string,mixed>
     */
    function qpmPublicSearchNormalizeFlatParamKeys(array $params): array
    {
        $normalized = [];
        $limitGroups = [];
        $topicGroups = [];
        foreach ($params as $key => $value) {
            $lower = strtolower(trim((string) $key));
            if ($lower === '') {
                continue;
            }
            if ($lower === 'limit') {
                if (is_array($value)) {
                    foreach ($value as $entry) {
                        $limitGroups[] = $entry;
                    }
                } else {
                    $limitGroups[] = $value;
                }
                continue;
            }
            if ($lower === 'topic') {
                if (is_array($value)) {
                    foreach ($value as $entry) {
                        $topicGroups[] = $entry;
                    }
                } else {
                    $topicGroups[] = $value;
                }
                continue;
            }
            if (array_key_exists($lower, $normalized)) {
                continue;
            }
            $normalized[$lower] = $value;
        }
        if (!empty($limitGroups)) {
            $normalized['limit'] = $limitGroups;
        }
        if (!empty($topicGroups)) {
            $normalized['topic'] = count($topicGroups) === 1 ? $topicGroups[0] : $topicGroups;
        }
        return $normalized;
    }
}

if (!function_exists('qpmPublicSearchParseRawUrlEncodedPreservingLimitGroups')) {
    /**
     * Parses application/x-www-form-urlencoded bodies/query strings while keeping
     * every repeated `limit=` / `topic=` value (PHP's $_GET/$_POST/parse_str
     * would otherwise keep only the last value).
     *
     * @return array<string,mixed>
     */
    function qpmPublicSearchParseRawUrlEncodedPreservingLimitGroups(string $raw): array
    {
        $params = [];
        $limitGroups = [];
        $topicGroups = [];
        if (trim($raw) === '') {
            return $params;
        }
        foreach (explode('&', $raw) as $pair) {
            if ($pair === '') {
                continue;
            }
            $parts = explode('=', $pair, 2);
            $key = urldecode(str_replace('+', ' ', (string) ($parts[0] ?? '')));
            $value = urldecode(str_replace('+', ' ', (string) ($parts[1] ?? '')));
            $lower = strtolower(trim($key));
            if ($lower === '') {
                continue;
            }
            if ($lower === 'limit') {
                $limitGroups[] = $value;
                continue;
            }
            if ($lower === 'topic') {
                $topicGroups[] = $value;
                continue;
            }
            if (!array_key_exists($lower, $params)) {
                $params[$lower] = $value;
            }
        }
        if (!empty($limitGroups)) {
            $params['limit'] = $limitGroups;
        }
        if (!empty($topicGroups)) {
            $params['topic'] = count($topicGroups) === 1 ? $topicGroups[0] : $topicGroups;
        }
        return $params;
    }
}

if (!function_exists('qpmPublicSearchParseLimitTokenToSelection')) {
    /**
     * @return array{id:string,scope:string}|null
     */
    function qpmPublicSearchParseLimitTokenToSelection(string $token): ?array
    {
        $parsed = qpmPublicSearchParseScopedIdToken($token);
        if (!$parsed['isCustom'] && $parsed['id'] !== '') {
            return ['id' => $parsed['id'], 'scope' => $parsed['scope']];
        }
        $bare = strtoupper(trim($token));
        if ($bare !== '' && preg_match('/^[A-Z][0-9A-Z]+$/', $bare) === 1) {
            return ['id' => $bare, 'scope' => 'normal'];
        }
        return null;
    }
}

if (!function_exists('qpmPublicSearchSplitFlatListValue')) {
    /**
     * Splits on ',' and legacy ';;' without breaking {{…}} tokens.
     *
     * @param mixed $value
     * @return array<int,string>
     */
    function qpmPublicSearchSplitFlatListValue($value): array
    {
        if (is_array($value)) {
            $parts = [];
            foreach ($value as $entry) {
                foreach (qpmPublicSearchSplitFlatListValue($entry) as $token) {
                    $parts[] = $token;
                }
            }
            return $parts;
        }
        $raw = trim((string) $value);
        if ($raw === '') {
            return [];
        }
        $tokens = [];
        $buffer = '';
        $length = strlen($raw);
        $index = 0;
        while ($index < $length) {
            if (substr($raw, $index, 2) === '{{') {
                $end = strpos($raw, '}}', $index);
                if ($end === false) {
                    $buffer .= substr($raw, $index);
                    break;
                }
                $buffer .= substr($raw, $index, ($end + 2) - $index);
                $index = $end + 2;
                continue;
            }
            if (substr($raw, $index, 2) === ';;') {
                $trimmed = trim($buffer);
                if ($trimmed !== '') {
                    $tokens[] = $trimmed;
                }
                $buffer = '';
                $index += 2;
                continue;
            }
            if ($raw[$index] === ',') {
                $trimmed = trim($buffer);
                if ($trimmed !== '') {
                    $tokens[] = $trimmed;
                }
                $buffer = '';
                $index += 1;
                continue;
            }
            $buffer .= $raw[$index];
            $index += 1;
        }
        $trimmed = trim($buffer);
        if ($trimmed !== '') {
            $tokens[] = $trimmed;
        }
        return $tokens;
    }
}

if (!function_exists('qpmPublicSearchParseScopedIdToken')) {
    /**
     * Parses `id#scope` / `{{text}}#scope[:mode]` tokens.
     *
     * Custom fretext mode (preferred):
     * - `#s:raw` — plain fretext (may go through AI)
     * - `#s:pubmed` — already a PubMed clause (use directly)
     * Legacy (still accepted): `{{text0}}#s` / `{{text1}}#s`
     *
     * @return array{id:string,scope:string,rawText:string,isCustom:bool,isTranslated:bool}
     */
    function qpmPublicSearchParseScopedIdToken(string $token): array
    {
        $raw = trim($token);
        $hashPos = strrpos($raw, '#');
        $idPart = $hashPos === false ? $raw : substr($raw, 0, $hashPos);
        $scopeRaw = $hashPos === false ? 's' : strtolower(trim(substr($raw, $hashPos + 1)));
        $scopeParts = explode(':', $scopeRaw, 2);
        $scopeKey = trim((string) ($scopeParts[0] ?? 's'));
        $textMode = trim((string) ($scopeParts[1] ?? ''));
        if ($scopeKey === '' || !in_array($scopeKey, ['n', 's', 'b'], true)) {
            $scopeKey = 's';
        }
        if ($textMode !== '' && !in_array($textMode, ['raw', 'pubmed'], true)) {
            $textMode = '';
        }
        $scopeMap = ['n' => 'narrow', 's' => 'normal', 'b' => 'broad'];
        $scope = $scopeMap[$scopeKey];
        $isCustom = strlen($idPart) >= 4 && substr($idPart, 0, 2) === '{{' && substr($idPart, -2) === '}}';
        $rawText = '';
        $id = '';
        $isTranslated = false;
        if ($isCustom) {
            $inner = substr($idPart, 2, -2);
            if ($textMode === 'pubmed') {
                $rawText = $inner;
                $isTranslated = true;
            } elseif ($textMode === 'raw') {
                $rawText = $inner;
                $isTranslated = false;
            } else {
                // Legacy: trailing 0/1 inside {{…}} marked translation state.
                $flag = substr($inner, -1);
                if ($flag === '0' || $flag === '1') {
                    $rawText = substr($inner, 0, -1);
                    $isTranslated = $flag === '1';
                } else {
                    $rawText = $inner;
                }
            }
        } else {
            $id = strtoupper(trim($idPart));
        }
        return [
            'id' => $id,
            'scope' => $scope,
            'rawText' => trim($rawText),
            'isCustom' => $isCustom,
            'isTranslated' => $isTranslated,
        ];
    }
}

if (!function_exists('qpmPublicSearchFlatParamUiIgnoreKeys')) {
    /**
     * @return array<int,string>
     */
    function qpmPublicSearchFlatParamUiIgnoreKeys(): array
    {
        return [
            'advanced',
            'collapsed',
            'scrollto',
            'openlimits',
            'hidelimits',
            'orderlimits',
            'qpmdebug',
            'apibase',
            'apikey', // auth is read separately; not part of search request body
        ];
    }
}

if (!function_exists('qpmPublicSearchIsFlatLimitCategoryKey')) {
    /**
     * Legacy simple-mode category keys like L025 / L030 / LXXX.
     * Must not match the parameter name "limit".
     */
    function qpmPublicSearchIsFlatLimitCategoryKey(string $key): bool
    {
        return (bool) preg_match('/^l(\d{2,}|xxx)[0-9a-z]*$/i', $key);
    }
}

if (!function_exists('qpmPublicSearchBuildRequestFromFlatParams')) {
    /**
     * Builds a normalized public-search request from SearchForm-style flat params.
     *
     * @param array<string,mixed> $params
     * @return array<string,mixed>
     */
    function qpmPublicSearchBuildRequestFromFlatParams(array $params): array
    {
        $params = qpmPublicSearchNormalizeFlatParamKeys($params);
        $ignore = array_fill_keys(qpmPublicSearchFlatParamUiIgnoreKeys(), true);
        $known = array_fill_keys([
            'q', 'query', 'topic', 'databases', 'sources', 'translationsources', 'semanticsources',
            'ai', 'translation', 'focus', 'sort', 'page', 'pagesize', 'pageSize',
            'limit', 'checklimits', 'pmid', 'domain', 'lang', 'stream',
            'includeabstracts', 'includeprocessdetails', 'nocache',
        ], true);

        foreach (array_keys($params) as $key) {
            if (isset($ignore[$key]) || isset($known[$key]) || qpmPublicSearchIsFlatLimitCategoryKey($key)) {
                continue;
            }
            throw new InvalidArgumentException('Unsupported parameter(s): ' . $key);
        }

        $request = qpmPublicSearchBuildDefaultRequest();
        $config = qpmPublicSearchGetConfig();

        $queryText = trim((string) ($params['q'] ?? ''));
        if ($queryText === '') {
            $queryText = trim((string) ($params['query'] ?? ''));
        }

        // Each topic= value is one AND-group; comma-list inside a group is OR.
        $topicGroupRawValues = [];
        if (array_key_exists('topic', $params)) {
            $topicValue = $params['topic'];
            if (is_array($topicValue)) {
                foreach ($topicValue as $groupValue) {
                    $topicGroupRawValues[] = $groupValue;
                }
            } else {
                $topicGroupRawValues[] = $topicValue;
            }
        }
        $selectedTopicGroups = [];
        $selectedTopicSelections = [];
        $selectedTopicIds = [];
        $customTextsForAi = [];
        $hasCustomOrCatalogTopics = false;
        $topicTokenCount = 0;
        foreach ($topicGroupRawValues as $groupRaw) {
            $groupSelections = [];
            foreach (qpmPublicSearchSplitFlatListValue($groupRaw) as $token) {
                $topicTokenCount++;
                if ($topicTokenCount > qpmPublicSearchFlatParamsMaxTopicTokens()) {
                    throw new InvalidArgumentException(
                        'Too many topic tokens (max ' . qpmPublicSearchFlatParamsMaxTopicTokens() . ')'
                    );
                }
                $parsed = qpmPublicSearchParseScopedIdToken((string) $token);
                if ($parsed['isCustom']) {
                    $rawText = trim((string) ($parsed['rawText'] ?? ''));
                    if ($rawText === '') {
                        continue;
                    }
                    $isTranslated = !empty($parsed['isTranslated']);
                    $entry = [
                        'id' => '',
                        'scope' => (string) ($parsed['scope'] ?? 'normal'),
                        'custom' => true,
                        'rawText' => $rawText,
                        'label' => $rawText,
                        'translated' => $isTranslated,
                    ];
                    $groupSelections[] = $entry;
                    $selectedTopicSelections[] = $entry;
                    $hasCustomOrCatalogTopics = true;
                    // {{…1}} is already a PubMed clause — do not send through AI.
                    if (!$isTranslated) {
                        $customTextsForAi[] = $rawText;
                    }
                    continue;
                }
                if ($parsed['id'] !== '' && preg_match('/^[A-Z][0-9A-Z]{2,}$/', $parsed['id']) === 1) {
                    $entry = [
                        'id' => $parsed['id'],
                        'scope' => (string) ($parsed['scope'] ?? 'normal'),
                        'custom' => false,
                        'rawText' => '',
                        'label' => '',
                        'translated' => false,
                    ];
                    $groupSelections[] = $entry;
                    $selectedTopicSelections[] = $entry;
                    $selectedTopicIds[] = $parsed['id'];
                    $hasCustomOrCatalogTopics = true;
                    continue;
                }
                $hashPos = strrpos((string) $token, '#');
                $textCandidate = trim($hashPos === false ? (string) $token : substr((string) $token, 0, $hashPos));
                if ($textCandidate === '') {
                    continue;
                }
                $entry = [
                    'id' => '',
                    'scope' => (string) ($parsed['scope'] ?? 'normal'),
                    'custom' => true,
                    'rawText' => $textCandidate,
                    'label' => $textCandidate,
                    'translated' => false,
                ];
                $groupSelections[] = $entry;
                $selectedTopicSelections[] = $entry;
                $customTextsForAi[] = $textCandidate;
                $hasCustomOrCatalogTopics = true;
            }
            if (!empty($groupSelections)) {
                $selectedTopicGroups[] = $groupSelections;
            }
        }
        $selectedTopicIds = qpmPublicSearchDedupeStrings($selectedTopicIds);
        if ($queryText === '' && !empty($customTextsForAi)) {
            $queryText = trim(implode(' ', $customTextsForAi));
        }

        $sourcesRaw = '';
        foreach (['databases', 'sources', 'translationsources', 'semanticsources'] as $sourceKey) {
            if (!array_key_exists($sourceKey, $params)) {
                continue;
            }
            $sourcesRaw = (string) $params[$sourceKey];
            break;
        }
        $request['sources'] = qpmPublicSearchNormalizeSources(
            str_replace(';;', ',', $sourcesRaw)
        );

        $request['sort']['method'] = qpmPublicSearchNormalizeSortMethod($params['sort'] ?? 'relevance');
        $request['focus'] = qpmPublicSearchNormalizeFocusProfileId($params['focus'] ?? '');
        $request['page']['number'] = max(1, (int) ($params['page'] ?? 1));
        $pageSize = (int) ($params['pagesize'] ?? ($params['pageSize'] ?? $request['page']['size']));
        $request['page']['size'] = max(1, min($config['maxPageSize'], $pageSize > 0 ? $pageSize : $config['defaultPageSize']));

        if (array_key_exists('translation', $params)) {
            $request['translation']['mode'] = qpmPublicSearchNormalizeTranslationMode($params['translation']);
        } elseif (array_key_exists('ai', $params)) {
            $request['translation']['mode'] = qpmPublicSearchBoolValue($params['ai'], true) ? 'auto' : 'none';
        } else {
            $request['translation']['mode'] = 'auto';
        }

        $request['domain'] = function_exists('qpmNormalizeDomainKey')
            ? qpmNormalizeDomainKey((string) ($params['domain'] ?? ''))
            : trim((string) ($params['domain'] ?? ''));

        $request['responseOptions']['stream'] = qpmPublicSearchBoolValue(
            $params['stream'] ?? $request['responseOptions']['stream'],
            (bool) $request['responseOptions']['stream']
        );
        $request['responseOptions']['language'] = qpmPublicSearchNormalizeResponseLanguage(
            $params['lang'] ?? $request['responseOptions']['language']
        );
        if (array_key_exists('includeabstracts', $params)) {
            $request['responseOptions']['includeAbstracts'] = qpmPublicSearchBoolValue(
                $params['includeabstracts'],
                true
            );
        }
        if (array_key_exists('includeprocessdetails', $params)) {
            $request['responseOptions']['includeProcessDetails'] = qpmPublicSearchBoolValue(
                $params['includeprocessdetails'],
                false
            );
        }
        if (array_key_exists('nocache', $params)) {
            // Request-scoped bypass of search-response + LLM final-rerank caches.
            // Does not delete runtime cache files; still writes fresh results back.
            $request['responseOptions']['noCache'] = qpmPublicSearchBoolValue($params['nocache'], false);
        }

        // Each limit= value is one AND-group; comma-separated ids inside a group are OR'ed.
        $limitGroupRawValues = [];
        if (array_key_exists('limit', $params)) {
            $limitValue = $params['limit'];
            if (is_array($limitValue)) {
                foreach ($limitValue as $groupValue) {
                    $limitGroupRawValues[] = $groupValue;
                }
            } else {
                $limitGroupRawValues[] = $limitValue;
            }
        }
        // Legacy simple-mode category keys (L025=…) each become their own AND-group.
        foreach ($params as $key => $value) {
            if (!qpmPublicSearchIsFlatLimitCategoryKey((string) $key)) {
                continue;
            }
            $limitGroupRawValues[] = $value;
        }
        if (array_key_exists('checklimits', $params)) {
            foreach (qpmPublicSearchSplitFlatListValue($params['checklimits']) as $token) {
                $limitGroupRawValues[] = strtoupper(trim(preg_replace('/#.*$/', '', $token) ?? $token));
            }
        }

        $selectedLimitGroups = [];
        $selectedLimitSelections = [];
        $selectedLimitIds = [];
        $tokenCount = 0;
        foreach ($limitGroupRawValues as $groupRaw) {
            $groupSelections = [];
            foreach (qpmPublicSearchSplitFlatListValue($groupRaw) as $token) {
                $tokenCount++;
                if ($tokenCount > qpmPublicSearchFlatParamsMaxLimitTokens()) {
                    throw new InvalidArgumentException(
                        'Too many limit tokens (max ' . qpmPublicSearchFlatParamsMaxLimitTokens() . ')'
                    );
                }
                $selection = qpmPublicSearchParseLimitTokenToSelection((string) $token);
                if ($selection === null) {
                    continue;
                }
                $groupSelections[] = $selection;
                $selectedLimitIds[] = $selection['id'];
                $selectedLimitSelections[] = $selection;
            }
            if (!empty($groupSelections)) {
                $selectedLimitGroups[] = $groupSelections;
            }
        }
        $selectedLimitIds = qpmPublicSearchDedupeStrings($selectedLimitIds);
        $dedupedSelections = [];
        $seenSelection = [];
        foreach ($selectedLimitSelections as $selection) {
            $id = (string) ($selection['id'] ?? '');
            if ($id === '' || isset($seenSelection[$id])) {
                continue;
            }
            $seenSelection[$id] = true;
            $dedupedSelections[] = [
                'id' => $id,
                'scope' => (string) ($selection['scope'] ?? 'normal'),
            ];
        }
        $selectedLimitSelections = $dedupedSelections;

        $pmidTokens = array_key_exists('pmid', $params)
            ? qpmPublicSearchSplitFlatListValue($params['pmid'])
            : [];
        if (count($pmidTokens) > qpmPublicSearchFlatParamsMaxPmidTokens()) {
            throw new InvalidArgumentException(
                'Too many pmid tokens (max ' . qpmPublicSearchFlatParamsMaxPmidTokens() . ')'
            );
        }
        $preselectedPmids = [];
        foreach ($pmidTokens as $pmidToken) {
            $pmid = qpmPublicSearchNormalizePmid($pmidToken);
            if ($pmid !== '') {
                $preselectedPmids[] = $pmid;
            }
        }
        $preselectedPmids = qpmPublicSearchDedupeStrings($preselectedPmids);

        $request['query']['text'] = $queryText;
        $request['query']['language'] = 'auto';
        $request['preselectedPmids'] = $preselectedPmids;
        $request['intentContext']['rawUserInput'] = $queryText;
        $request['intentContext']['contextualSearchInput'] = $queryText;
        $request['intentContext']['selectedTopicIds'] = $selectedTopicIds;
        $request['intentContext']['selectedTopicSelections'] = $selectedTopicSelections;
        $request['intentContext']['selectedTopicGroups'] = $selectedTopicGroups;
        $request['intentContext']['selectedLimitIds'] = $selectedLimitIds;
        $request['intentContext']['selectedLimitSelections'] = $selectedLimitSelections;
        $request['intentContext']['selectedLimitGroups'] = $selectedLimitGroups;
        $request['intentContext']['selectedTopics'] = [];
        $request['intentContext']['selectedLimits'] = [];
        $request['intentContext']['semanticBlocks'] = [];
        $request['intentContext']['ruleIds'] = [];

        $request = qpmPublicSearchHydrateRequestFromSelectedLimits($request, true);
        $request = qpmPublicSearchHydrateRequestFromSelectedTopics($request);

        $authorizationContext = $request['intentContext'];
        $authorizationContext['ruleIds'] = qpmPublicSearchDedupeStrings(array_merge(
            (array) ($authorizationContext['ruleIds'] ?? []),
            (array) ($request['hardFilters']['doiOnlyRuleIds'] ?? []),
            (array) ($request['hardFilters']['postValidationRuleIds'] ?? [])
        ));
        qpmPublicSearchAssertIntentContextIdsAreAuthorized($authorizationContext);

        if ($request['query']['text'] === '' && !$hasCustomOrCatalogTopics) {
            throw new InvalidArgumentException('q is required');
        }
        if (empty($request['sources'])) {
            throw new InvalidArgumentException('sources/databases must contain at least one supported source');
        }

        return qpmPublicSearchApplyQueryResponseOptionOverrides($request);
    }
}

if (!function_exists('qpmPublicSearchHydrateRequestFromSelectedLimits')) {
    /**
     * Fills hardFilters/sourceFilters/ruleIds/labels from limits.json for selected limit ids.
     * When $forceFill is true (form path), always merge from catalog.
     * When false (JSON path), only fill empty target fields.
     *
     * @param array<string,mixed> $request
     * @return array<string,mixed>
     */
    function qpmPublicSearchHydrateRequestFromSelectedLimits(array $request, bool $forceFill = false): array
    {
        $selectedIds = qpmPublicSearchDedupeStrings(
            (array) ($request['intentContext']['selectedLimitIds'] ?? [])
        );
        if (empty($selectedIds)) {
            return $request;
        }
        $catalog = qpmPublicSearchLoadLimitNodeCatalog();
        if (empty($catalog)) {
            return $request;
        }

        $filterProfiles = [];
        $languages = [];
        $publicationTypes = [];
        $studyDesigns = [];
        $ageGroups = [];
        $sourceFormats = [];
        $publicationDateYears = [];
        $ruleIds = [];
        $labels = [];
        $semanticBlocks = [];
        $ssPublicationTypes = [];
        $ssYears = [];
        $ssPublicationDateOrYears = [];
        $oaLanguage = [];
        $oaSourceType = [];
        $oaWorkType = [];
        $oaPublicationYears = [];
        $elicitTypeTags = [];
        $elicitIncludeKeywords = [];
        $elicitExcludeKeywords = [];
        $elicitMinYears = [];
        $elicitMaxYears = [];
        $elicitMinEpochS = [];
        $elicitMaxEpochS = [];
        $elicitMaxQuartiles = [];
        $elicitHasPdfValues = [];
        $elicitPubmedOnlyValues = [];
        $elicitRetractedValues = [];

        foreach ($selectedIds as $id) {
            $node = isset($catalog[$id]) && is_array($catalog[$id]) ? $catalog[$id] : null;
            if ($node === null) {
                continue;
            }
            $semanticConfig = isset($node['semanticConfig']) && is_array($node['semanticConfig'])
                ? $node['semanticConfig']
                : [];
            $nodeHard = isset($semanticConfig['hardFilters']) && is_array($semanticConfig['hardFilters'])
                ? $semanticConfig['hardFilters']
                : [];
            foreach ((array) ($nodeHard['filterProfile'] ?? []) as $value) {
                $filterProfiles[] = strtolower(trim((string) $value));
            }
            foreach ((array) ($nodeHard['language'] ?? []) as $value) {
                $languages[] = qpmPublicSearchNormalizeLanguageCode($value);
            }
            foreach ((array) ($nodeHard['publicationType'] ?? []) as $value) {
                $publicationTypes[] = qpmPublicSearchNormalizeHardPublicationType($value);
            }
            foreach ((array) ($nodeHard['studyDesign'] ?? []) as $value) {
                $studyDesigns[] = strtolower(trim((string) $value));
            }
            foreach ((array) ($nodeHard['ageGroup'] ?? []) as $value) {
                $ageGroups[] = strtolower(trim((string) $value));
            }
            foreach ((array) ($nodeHard['sourceFormat'] ?? []) as $value) {
                $sourceFormats[] = qpmPublicSearchNormalizeSourceFormat($value);
            }
            foreach ((array) ($nodeHard['publicationDateYears'] ?? []) as $year) {
                $yearInt = (int) $year;
                if ($yearInt > 0) {
                    $publicationDateYears[] = $yearInt;
                }
            }

            $postValidation = isset($semanticConfig['postValidation']) && is_array($semanticConfig['postValidation'])
                ? $semanticConfig['postValidation']
                : [];
            $rawRules = !empty($postValidation['rules'])
                ? (array) $postValidation['rules']
                : (array) ($semanticConfig['doiOnlyRules'] ?? []);
            foreach ($rawRules as $rule) {
                if (!is_array($rule)) {
                    continue;
                }
                $ruleId = trim((string) ($rule['id'] ?? ''));
                if ($ruleId !== '') {
                    $ruleIds[] = $ruleId;
                }
            }

            $enLabel = trim((string) (($node['translations']['en'] ?? '') ?: ($node['translations']['dk'] ?? '')));
            if ($enLabel !== '') {
                $labels[] = $enLabel;
            }
            $sourceContext = isset($semanticConfig['sourceContext']) && is_array($semanticConfig['sourceContext'])
                ? $semanticConfig['sourceContext']
                : [];
            $contextEn = trim((string) ($sourceContext['en'] ?? ''));
            if ($contextEn !== '') {
                $semanticBlocks[] = $contextEn;
            } elseif ($enLabel !== '') {
                $semanticBlocks[] = $enLabel;
            }

            $nodeSourceFilters = isset($semanticConfig['sourceFilters']) && is_array($semanticConfig['sourceFilters'])
                ? $semanticConfig['sourceFilters']
                : [];
            $ss = isset($nodeSourceFilters['semanticScholar']) && is_array($nodeSourceFilters['semanticScholar'])
                ? $nodeSourceFilters['semanticScholar']
                : [];
            foreach ((array) ($ss['publicationTypes'] ?? []) as $value) {
                $ssPublicationTypes[] = trim((string) $value);
            }
            if (trim((string) ($ss['year'] ?? '')) !== '') {
                $ssYears[] = trim((string) $ss['year']);
            }
            if (trim((string) ($ss['publicationDateOrYear'] ?? '')) !== '') {
                $ssPublicationDateOrYears[] = trim((string) $ss['publicationDateOrYear']);
            }
            $oa = isset($nodeSourceFilters['openAlex']) && is_array($nodeSourceFilters['openAlex'])
                ? $nodeSourceFilters['openAlex']
                : [];
            foreach ((array) ($oa['language'] ?? []) as $value) {
                $oaLanguage[] = qpmPublicSearchNormalizeLanguageCode($value);
            }
            foreach ((array) ($oa['sourceType'] ?? []) as $value) {
                $oaSourceType[] = trim((string) $value);
            }
            foreach ((array) ($oa['workType'] ?? []) as $value) {
                $oaWorkType[] = trim((string) $value);
            }
            if (trim((string) ($oa['publicationYear'] ?? '')) !== '') {
                $oaPublicationYears[] = trim((string) $oa['publicationYear']);
            }
            $elicit = isset($nodeSourceFilters['elicit']) && is_array($nodeSourceFilters['elicit'])
                ? $nodeSourceFilters['elicit']
                : [];
            foreach ((array) ($elicit['typeTags'] ?? []) as $value) {
                $elicitTypeTags[] = trim((string) $value);
            }
            foreach ((array) ($elicit['includeKeywords'] ?? []) as $value) {
                $elicitIncludeKeywords[] = trim((string) $value);
            }
            foreach ((array) ($elicit['excludeKeywords'] ?? []) as $value) {
                $elicitExcludeKeywords[] = trim((string) $value);
            }
            if (isset($elicit['minYear']) && is_numeric($elicit['minYear'])) {
                $elicitMinYears[] = (int) $elicit['minYear'];
            }
            if (isset($elicit['maxYear']) && is_numeric($elicit['maxYear'])) {
                $elicitMaxYears[] = (int) $elicit['maxYear'];
            }
            if (isset($elicit['minEpochS']) && is_numeric($elicit['minEpochS'])) {
                $elicitMinEpochS[] = (int) $elicit['minEpochS'];
            }
            if (isset($elicit['maxEpochS']) && is_numeric($elicit['maxEpochS'])) {
                $elicitMaxEpochS[] = (int) $elicit['maxEpochS'];
            }
            if (isset($elicit['maxQuartile']) && is_numeric($elicit['maxQuartile'])) {
                $elicitMaxQuartiles[] = (int) $elicit['maxQuartile'];
            }
            if (array_key_exists('hasPdf', $elicit)) {
                $elicitHasPdfValues[] = qpmPublicSearchBoolValue($elicit['hasPdf'], false);
            }
            if (array_key_exists('pubmedOnly', $elicit)) {
                $elicitPubmedOnlyValues[] = qpmPublicSearchBoolValue($elicit['pubmedOnly'], false);
            }
            if (trim((string) ($elicit['retracted'] ?? '')) !== '') {
                $elicitRetractedValues[] = trim((string) $elicit['retracted']);
            }
        }

        $mergeList = static function (array $existing, array $incoming, bool $force) {
            $existing = array_values(array_filter(array_map('strval', $existing), static fn($v) => trim($v) !== ''));
            $incoming = array_values(array_filter(array_map('strval', $incoming), static fn($v) => trim($v) !== ''));
            if ($force || empty($existing)) {
                return qpmPublicSearchDedupeStrings(array_merge($existing, $incoming));
            }
            return qpmPublicSearchDedupeStrings($existing);
        };

        $hard = isset($request['hardFilters']) && is_array($request['hardFilters'])
            ? $request['hardFilters']
            : [];
        $hard['filterProfiles'] = $mergeList((array) ($hard['filterProfiles'] ?? []), $filterProfiles, $forceFill);
        $hard['languages'] = $mergeList((array) ($hard['languages'] ?? []), $languages, $forceFill);
        $hard['publicationTypes'] = $mergeList((array) ($hard['publicationTypes'] ?? []), $publicationTypes, $forceFill);
        $hard['studyDesigns'] = $mergeList((array) ($hard['studyDesigns'] ?? []), $studyDesigns, $forceFill);
        $hard['ageGroups'] = $mergeList((array) ($hard['ageGroups'] ?? []), $ageGroups, $forceFill);
        $hard['sourceFormats'] = $mergeList((array) ($hard['sourceFormats'] ?? []), $sourceFormats, $forceFill);
        $hard['doiOnlyRuleIds'] = $mergeList((array) ($hard['doiOnlyRuleIds'] ?? []), $ruleIds, $forceFill);
        $hard['postValidationRuleIds'] = $mergeList((array) ($hard['postValidationRuleIds'] ?? []), $ruleIds, $forceFill);
        $existingYears = array_values(array_filter(array_map('intval', (array) ($hard['publicationDateYears'] ?? []))));
        $incomingYears = array_values(array_unique(array_filter($publicationDateYears)));
        if ($forceFill || empty($existingYears)) {
            $hard['publicationDateYears'] = array_values(array_unique(array_merge($existingYears, $incomingYears)));
        }
        $request['hardFilters'] = $hard;

        $sourceFilters = isset($request['sourceFilters']) && is_array($request['sourceFilters'])
            ? $request['sourceFilters']
            : [];
        $ssExisting = (array) ($sourceFilters['semanticScholar']['publicationTypes'] ?? []);
        $sourceFilters['semanticScholar']['publicationTypes'] = $mergeList($ssExisting, $ssPublicationTypes, $forceFill);
        if (($forceFill || trim((string) ($sourceFilters['semanticScholar']['year'] ?? '')) === '') && count(array_unique($ssYears)) === 1) {
            $sourceFilters['semanticScholar']['year'] = $ssYears[0];
        }
        if (($forceFill || trim((string) ($sourceFilters['semanticScholar']['publicationDateOrYear'] ?? '')) === '')
            && count(array_unique($ssPublicationDateOrYears)) === 1
        ) {
            $sourceFilters['semanticScholar']['publicationDateOrYear'] = $ssPublicationDateOrYears[0];
        }
        $sourceFilters['openAlex']['language'] = $mergeList(
            (array) ($sourceFilters['openAlex']['language'] ?? []),
            $oaLanguage,
            $forceFill
        );
        $sourceFilters['openAlex']['sourceType'] = $mergeList(
            (array) ($sourceFilters['openAlex']['sourceType'] ?? []),
            $oaSourceType,
            $forceFill
        );
        $sourceFilters['openAlex']['workType'] = $mergeList(
            (array) ($sourceFilters['openAlex']['workType'] ?? []),
            $oaWorkType,
            $forceFill
        );
        if (($forceFill || trim((string) ($sourceFilters['openAlex']['publicationYear'] ?? '')) === '')
            && count(array_unique($oaPublicationYears)) === 1
        ) {
            $sourceFilters['openAlex']['publicationYear'] = $oaPublicationYears[0];
        }
        $sourceFilters['elicit']['typeTags'] = $mergeList(
            (array) ($sourceFilters['elicit']['typeTags'] ?? []),
            $elicitTypeTags,
            $forceFill
        );
        $sourceFilters['elicit']['includeKeywords'] = $mergeList(
            (array) ($sourceFilters['elicit']['includeKeywords'] ?? []),
            $elicitIncludeKeywords,
            $forceFill
        );
        $sourceFilters['elicit']['excludeKeywords'] = $mergeList(
            (array) ($sourceFilters['elicit']['excludeKeywords'] ?? []),
            $elicitExcludeKeywords,
            $forceFill
        );
        if (($forceFill || !isset($sourceFilters['elicit']['minYear'])) && !empty($elicitMinYears)) {
            $sourceFilters['elicit']['minYear'] = max($elicitMinYears);
        }
        if (($forceFill || !isset($sourceFilters['elicit']['maxYear'])) && !empty($elicitMaxYears)) {
            $sourceFilters['elicit']['maxYear'] = min($elicitMaxYears);
        }
        if (($forceFill || !isset($sourceFilters['elicit']['minEpochS'])) && !empty($elicitMinEpochS)) {
            $sourceFilters['elicit']['minEpochS'] = max($elicitMinEpochS);
        }
        if (($forceFill || !isset($sourceFilters['elicit']['maxEpochS'])) && !empty($elicitMaxEpochS)) {
            $sourceFilters['elicit']['maxEpochS'] = min($elicitMaxEpochS);
        }
        if (($forceFill || !isset($sourceFilters['elicit']['maxQuartile'])) && !empty($elicitMaxQuartiles)) {
            $sourceFilters['elicit']['maxQuartile'] = min($elicitMaxQuartiles);
        }
        if (($forceFill || !array_key_exists('hasPdf', $sourceFilters['elicit'] ?? [])) && !empty($elicitHasPdfValues)) {
            $sourceFilters['elicit']['hasPdf'] = !in_array(false, $elicitHasPdfValues, true);
        }
        if (($forceFill || !array_key_exists('pubmedOnly', $sourceFilters['elicit'] ?? [])) && !empty($elicitPubmedOnlyValues)) {
            $sourceFilters['elicit']['pubmedOnly'] = !in_array(false, $elicitPubmedOnlyValues, true);
        }
        if (($forceFill || trim((string) ($sourceFilters['elicit']['retracted'] ?? '')) === '') && !empty($elicitRetractedValues)) {
            $priority = ['only_retracted' => 3, 'include_retracted' => 2, 'exclude_retracted' => 1];
            $best = $elicitRetractedValues[0];
            foreach ($elicitRetractedValues as $candidate) {
                if (($priority[$candidate] ?? 0) > ($priority[$best] ?? 0)) {
                    $best = $candidate;
                }
            }
            $sourceFilters['elicit']['retracted'] = $best;
        }
        $request['sourceFilters'] = $sourceFilters;

        $intent = isset($request['intentContext']) && is_array($request['intentContext'])
            ? $request['intentContext']
            : [];
        $intent['ruleIds'] = $mergeList((array) ($intent['ruleIds'] ?? []), $ruleIds, $forceFill);
        if ($forceFill || empty($intent['selectedLimits'])) {
            $intent['selectedLimits'] = $mergeList((array) ($intent['selectedLimits'] ?? []), $labels, true);
        }
        if ($forceFill || empty($intent['semanticBlocks'])) {
            $intent['semanticBlocks'] = $mergeList((array) ($intent['semanticBlocks'] ?? []), $semanticBlocks, true);
        }
        if (($forceFill || trim((string) ($intent['contextualSearchInput'] ?? '')) === '')
            && !empty($intent['semanticBlocks'])
        ) {
            $intent['contextualSearchInput'] = implode('. ', (array) $intent['semanticBlocks']);
        }
        $request['intentContext'] = $intent;

        return $request;
    }
}

if (!function_exists('qpmPublicSearchFetchPreselectedResults')) {
    /**
     * @param array<int,string> $pmids
     * @return array<int,array<string,mixed>>
     */
    function qpmPublicSearchFetchPreselectedResults(array $pmids, string $domain = ''): array
    {
        $normalized = [];
        foreach ($pmids as $pmid) {
            $value = qpmPublicSearchNormalizePmid($pmid);
            if ($value !== '') {
                $normalized[] = $value;
            }
        }
        $normalized = qpmPublicSearchDedupeStrings($normalized);
        if (empty($normalized)) {
            return [];
        }
        $summaryRecords = qpmPublicSearchFetchPubMedSummaryRecords($normalized, $domain);
        $results = [];
        foreach ($normalized as $index => $pmid) {
            $record = isset($summaryRecords[$pmid]) && is_array($summaryRecords[$pmid])
                ? $summaryRecords[$pmid]
                : [];
            $results[] = [
                'pmid' => $pmid,
                'uid' => $pmid,
                'title' => trim((string) ($record['title'] ?? '')),
                'source' => 'pubmed',
                'preselected' => true,
                'rank' => $index + 1,
                'publicationYear' => qpmPublicSearchExtractPubMedSummaryPublicationYear($record),
                'venue' => trim((string) ($record['fulljournalname'] ?? ($record['source'] ?? ''))),
                'publicationTypes' => qpmPublicSearchNormalizeSimpleList($record['pubtype'] ?? []),
            ];
        }
        return $results;
    }
}
