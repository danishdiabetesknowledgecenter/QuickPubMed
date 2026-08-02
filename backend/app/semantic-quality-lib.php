<?php
/**
 * PHP port of the hybrid quality-signal reranking engine, publication-type
 * classifier, and post-validation rule engine.
 *
 * This file exists so backend/app/public-search-lib.php (used by the public
 * search API) can produce the SAME candidate ordering as src/utils/semanticReranking.js
 * + src/utils/pubTypeClassifier.js + src/utils/semanticRuleEngine.js (used by the
 * website widget via DropdownWrapper.vue), instead of the simpler RRF-core-only
 * implementation that existed before this file.
 *
 * IMPORTANT: every function in this file is a pure function (array/scalar in,
 * array/scalar out). None of them read $_SERVER, $_GET, or any superglobal, and
 * none of them produce output. This is what makes the CLI parity harness
 * (scripts/rerank-parity-harness.php) possible. Preserve this property in any
 * future edit.
 *
 * Whenever you change this file, the corresponding JS files are the source of
 * truth to compare against:
 * - src/utils/pubTypeClassifier.js
 * - src/utils/semanticReranking.js
 * - src/utils/semanticRuleEngine.js
 */

// =====================================================================
// Section 1: Publication-type classifier (ported from pubTypeClassifier.js)
// =====================================================================

if (!function_exists('qpmSemanticQualityToFiniteInt')) {
    /**
     * @param mixed $value
     * @return ?int
     */
    function qpmSemanticQualityToFiniteInt($value): ?int
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return null;
        }
        return (int) round((float) $value);
    }
}

if (!function_exists('qpmSemanticQualityToFiniteNumber')) {
    /**
     * @param mixed $value
     * @return ?float
     */
    function qpmSemanticQualityToFiniteNumber($value): ?float
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return null;
        }
        return (float) $value;
    }
}

if (!function_exists('qpmSemanticQualityNormalizeString')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmSemanticQualityNormalizeString($value): string
    {
        return trim((string) ($value ?? ''));
    }
}

if (!function_exists('qpmSemanticQualityNormalizeLower')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmSemanticQualityNormalizeLower($value): string
    {
        return strtolower(qpmSemanticQualityNormalizeString($value));
    }
}

if (!function_exists('qpmSemanticQualityToPubTypeList')) {
    /**
     * @param array<string,mixed> $enriched
     * @return array<int,string>
     */
    function qpmSemanticQualityToPubTypeList(array $enriched): array
    {
        $list = isset($enriched['pubTypes']) && is_array($enriched['pubTypes']) ? $enriched['pubTypes'] : [];
        $normalized = [];
        foreach ($list as $value) {
            $lower = qpmSemanticQualityNormalizeLower($value);
            if ($lower !== '') {
                $normalized[] = $lower;
            }
        }
        return $normalized;
    }
}

if (!function_exists('qpmSemanticQualityAnyMatches')) {
    /**
     * @param array<int,string> $patterns PCRE patterns (PHP delimiter-wrapped)
     * @param string $text
     * @return bool
     */
    function qpmSemanticQualityAnyMatches(array $patterns, string $text): bool
    {
        if ($text === '') {
            return false;
        }
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text) === 1) {
                return true;
            }
        }
        return false;
    }
}

// Pattern groups, ported 1:1 from pubTypeClassifier.js (case-insensitive PCRE).
if (!defined('QPM_SEMANTIC_QUALITY_EXCLUDED_SUBTYPES')) {
    define('QPM_SEMANTIC_QUALITY_EXCLUDED_SUBTYPES', [
        'erratum' => ['/^erratum$/i', '/^correction$/i', '/^retraction notice/i', '/correction to/i'],
        'paratext' => ['/^paratext$/i', '/^table of contents$/i', '/^front matter$/i', '/^back matter$/i'],
        'peerReview' => ['/^peer-?review$/i'],
        'grant' => ['/^grant$/i', '/^grants,? nih$/i'],
        'dataset' => ['/^dataset$/i', '/^data paper$/i', '/^data-set$/i', '/^data set$/i'],
    ]);
}
if (!defined('QPM_SEMANTIC_QUALITY_GUIDELINE_TITLE_PATTERNS')) {
    define('QPM_SEMANTIC_QUALITY_GUIDELINE_TITLE_PATTERNS', [
        '/\bguideline(s)?\b/i',
        '/\bclinical practice\b/i',
        '/\brecommendation(s)?\b/i',
        '/\bposition statement\b/i',
        '/\bconsensus\b/i',
        '/\bstandards of care\b/i',
    ]);
}
if (!defined('QPM_SEMANTIC_QUALITY_SYSTEMATIC_REVIEW_TITLE_PATTERNS')) {
    define('QPM_SEMANTIC_QUALITY_SYSTEMATIC_REVIEW_TITLE_PATTERNS', [
        '/\bsystematic review\b/i',
        '/\bmeta[-\s]?analysis\b/i',
        '/\bnetwork meta[-\s]?analysis\b/i',
        '/\bumbrella review\b/i',
    ]);
}
if (!defined('QPM_SEMANTIC_QUALITY_RCT_TITLE_PATTERNS')) {
    define('QPM_SEMANTIC_QUALITY_RCT_TITLE_PATTERNS', [
        '/\brandomi[sz]ed\b/i',
        '/\brandomi[sz]ed controlled trial\b/i',
        '/\brct\b/i',
    ]);
}
if (!defined('QPM_SEMANTIC_QUALITY_CLINICAL_TRIAL_TITLE_PATTERNS')) {
    define('QPM_SEMANTIC_QUALITY_CLINICAL_TRIAL_TITLE_PATTERNS', [
        '/\bclinical trial\b/i',
        '/\bphase\s*(i|ii|iii|iv|1|2|3|4)\b/i',
        '/\btrial protocol\b/i',
    ]);
}
if (!defined('QPM_SEMANTIC_QUALITY_REVIEW_TITLE_PATTERNS')) {
    define('QPM_SEMANTIC_QUALITY_REVIEW_TITLE_PATTERNS', [
        '/\bnarrative review\b/i',
        '/\bscoping review\b/i',
        '/\breview article\b/i',
    ]);
}

if (!function_exists('qpmSemanticQualityNormalizeAliasList')) {
    /**
     * @param mixed $value
     * @return array<int,string>
     */
    function qpmSemanticQualityNormalizeAliasList($value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        foreach ($value as $alias) {
            $lower = qpmSemanticQualityNormalizeLower($alias);
            if ($lower !== '') {
                $out[] = $lower;
            }
        }
        return $out;
    }
}

if (!function_exists('qpmSemanticQualityBuildAllowListLookup')) {
    /**
     * @param array<int,array<string,mixed>> $allowList
     * @return array{byAlias: array<string,string>, byInstitution: array<string,string>}
     */
    function qpmSemanticQualityBuildAllowListLookup($allowList): array
    {
        $byAlias = [];
        $byInstitution = [];
        if (!is_array($allowList)) {
            return ['byAlias' => $byAlias, 'byInstitution' => $byInstitution];
        }
        foreach ($allowList as $entry) {
            if (!is_array($entry)) {
                continue;
            }
            $canonical = qpmSemanticQualityNormalizeString($entry['name'] ?? '');
            $aliasList = qpmSemanticQualityNormalizeAliasList($entry['aliases'] ?? []);
            $canonicalLower = qpmSemanticQualityNormalizeLower($canonical);
            if ($canonicalLower !== '') {
                $aliasList[] = $canonicalLower;
            }
            foreach ($aliasList as $alias) {
                if (!isset($byAlias[$alias])) {
                    $byAlias[$alias] = $canonical !== '' ? $canonical : $alias;
                }
            }
            $institutionId = qpmSemanticQualityNormalizeString($entry['openAlexInstitutionId'] ?? '');
            if ($institutionId !== '') {
                $byInstitution[$institutionId] = $canonical !== '' ? $canonical : $institutionId;
            }
        }
        return ['byAlias' => $byAlias, 'byInstitution' => $byInstitution];
    }
}

if (!function_exists('qpmSemanticQualityMatchAllowList')) {
    /**
     * @param string $text
     * @param array<string,string> $byAlias
     * @return string
     */
    function qpmSemanticQualityMatchAllowList(string $text, array $byAlias): string
    {
        if ($text === '' || empty($byAlias)) {
            return '';
        }
        $lower = qpmSemanticQualityNormalizeLower($text);
        if ($lower === '') {
            return '';
        }
        if (isset($byAlias[$lower])) {
            return $byAlias[$lower];
        }
        foreach ($byAlias as $alias => $canonical) {
            if (strlen($alias) < 4) {
                continue;
            }
            if (strpos($lower, $alias) !== false) {
                return $canonical;
            }
        }
        return '';
    }
}

if (!function_exists('qpmSemanticQualityDetectExcludedSubtype')) {
    /**
     * @param array<int,string> $pubTypesLower
     * @param string $titleLower
     * @param string $workTypeLower
     * @return string
     */
    function qpmSemanticQualityDetectExcludedSubtype(array $pubTypesLower, string $titleLower, string $workTypeLower): string
    {
        $haystack = array_filter(array_merge([$workTypeLower], $pubTypesLower, [$titleLower]));
        foreach (QPM_SEMANTIC_QUALITY_EXCLUDED_SUBTYPES as $subtype => $patterns) {
            foreach ($haystack as $text) {
                if (qpmSemanticQualityAnyMatches($patterns, (string) $text)) {
                    return (string) $subtype;
                }
            }
        }
        return '';
    }
}

if (!function_exists('qpmSemanticQualityDeriveWorkType')) {
    /**
     * @param array<string,mixed> $enriched
     * @return string
     */
    function qpmSemanticQualityDeriveWorkType(array $enriched): string
    {
        $types = qpmSemanticQualityToPubTypeList($enriched);
        $workType = qpmSemanticQualityNormalizeLower($enriched['workType'] ?? ($enriched['openAlexWorkType'] ?? ''));
        if ($workType !== '') {
            return $workType;
        }
        return count($types) > 0 ? $types[0] : '';
    }
}

if (!function_exists('qpmSemanticQualityClassifyPublicationType')) {
    /**
     * Ported 1:1 from classifyPublicationType() in src/utils/pubTypeClassifier.js.
     *
     * @param array<string,mixed> $entry Merged candidate entry: pmid, doi, openAlexId, title, enriched
     * @param array<string,mixed> $options guidelinePublisherAllowList, __allowListCache
     * @return array{tier:string,confidence:string,signals:array<int,string>,subtype?:string}
     */
    function qpmSemanticQualityClassifyPublicationType(array $entry, array $options = []): array
    {
        $enriched = isset($entry['enriched']) && is_array($entry['enriched']) ? $entry['enriched'] : [];
        $title = qpmSemanticQualityNormalizeString($entry['title'] ?? ($enriched['title'] ?? ''));
        $titleLower = strtolower($title);
        $pubTypesLower = qpmSemanticQualityToPubTypeList($enriched);
        $workTypeLower = qpmSemanticQualityDeriveWorkType($enriched);
        $publisher = qpmSemanticQualityNormalizeString($enriched['publisher'] ?? '');
        $venue = qpmSemanticQualityNormalizeString($enriched['venue'] ?? '');
        $hasDoi = qpmSemanticQualityNormalizeString($entry['doi'] ?? '') !== '';
        $hasOpenAlexId = qpmSemanticQualityNormalizeString($entry['openAlexId'] ?? '') !== '';
        $hasPmid = qpmSemanticQualityNormalizeString($entry['pmid'] ?? '') !== '';
        $institutionIds = isset($enriched['institutionIds']) && is_array($enriched['institutionIds']) ? $enriched['institutionIds'] : [];

        $allowListLookup = $options['__allowListCache'] ?? qpmSemanticQualityBuildAllowListLookup($options['guidelinePublisherAllowList'] ?? []);

        $signals = [];

        $excludedSubtype = qpmSemanticQualityDetectExcludedSubtype($pubTypesLower, $titleLower, $workTypeLower);
        if ($excludedSubtype !== '') {
            $signals[] = 'excluded:' . $excludedSubtype;
            return ['tier' => 'excluded', 'subtype' => $excludedSubtype, 'confidence' => 'high', 'signals' => $signals];
        }

        $matchesGuidelinePubType = false;
        foreach ($pubTypesLower as $type) {
            if ($type === 'guideline' || $type === 'practice guideline') {
                $matchesGuidelinePubType = true;
                break;
            }
        }
        if ($matchesGuidelinePubType) {
            $signals[] = 'pubmedPubTypeGuideline';
        }

        $publisherMatch = qpmSemanticQualityMatchAllowList($publisher, $allowListLookup['byAlias'])
            ?: qpmSemanticQualityMatchAllowList($venue, $allowListLookup['byAlias']);
        if ($publisherMatch !== '') {
            $signals[] = 'allowListPublisher:' . $publisherMatch;
        }

        $institutionMatch = '';
        foreach ($institutionIds as $id) {
            $normalizedId = qpmSemanticQualityNormalizeString($id);
            if (isset($allowListLookup['byInstitution'][$normalizedId])) {
                $institutionMatch = $allowListLookup['byInstitution'][$normalizedId];
                break;
            }
        }
        if ($institutionMatch !== '') {
            $signals[] = 'allowListInstitution:' . $institutionMatch;
        }

        $titleLooksLikeGuideline = qpmSemanticQualityAnyMatches(QPM_SEMANTIC_QUALITY_GUIDELINE_TITLE_PATTERNS, $titleLower);
        if ($titleLooksLikeGuideline) {
            $signals[] = 'guidelineTitlePattern';
        }

        $workTypeLooksLikeReport = $workTypeLower === 'report' || $workTypeLower === 'standard' || $workTypeLower === 'review';
        $hasAllowListMatch = $publisherMatch !== '' || $institutionMatch !== '';

        if ($matchesGuidelinePubType || $hasAllowListMatch) {
            return ['tier' => 'guideline_verified', 'confidence' => 'high', 'signals' => $signals];
        }
        if ($titleLooksLikeGuideline && $workTypeLooksLikeReport) {
            return ['tier' => 'guideline_candidate', 'confidence' => 'medium', 'signals' => $signals];
        }
        if ($titleLooksLikeGuideline && ($hasDoi || $hasOpenAlexId)) {
            return ['tier' => 'guideline_candidate', 'confidence' => 'low', 'signals' => $signals];
        }

        $hasSystematicReviewPubType = false;
        foreach ($pubTypesLower as $type) {
            if (strpos($type, 'systematic review') !== false || strpos($type, 'meta-analysis') !== false || strpos($type, 'meta analysis') !== false) {
                $hasSystematicReviewPubType = true;
                break;
            }
        }
        if ($hasSystematicReviewPubType) {
            $signals[] = 'pubTypeSystematicReview';
            return ['tier' => 'systematic_review_or_meta', 'confidence' => 'high', 'signals' => $signals];
        }
        if (qpmSemanticQualityAnyMatches(QPM_SEMANTIC_QUALITY_SYSTEMATIC_REVIEW_TITLE_PATTERNS, $titleLower)) {
            $signals[] = 'titlePatternSystematicReview';
            return ['tier' => 'systematic_review_or_meta', 'confidence' => 'medium', 'signals' => $signals];
        }

        $hasRctPubType = false;
        foreach ($pubTypesLower as $type) {
            if (strpos($type, 'randomized controlled trial') !== false || strpos($type, 'randomised controlled trial') !== false) {
                $hasRctPubType = true;
                break;
            }
        }
        if ($hasRctPubType) {
            $signals[] = 'pubTypeRCT';
            return ['tier' => 'randomized_controlled_trial', 'confidence' => 'high', 'signals' => $signals];
        }
        if (qpmSemanticQualityAnyMatches(QPM_SEMANTIC_QUALITY_RCT_TITLE_PATTERNS, $titleLower)) {
            $signals[] = 'titlePatternRCT';
            return ['tier' => 'randomized_controlled_trial', 'confidence' => 'medium', 'signals' => $signals];
        }

        $hasClinicalTrialPubType = false;
        foreach ($pubTypesLower as $type) {
            if (strpos($type, 'clinical trial') !== false) {
                $hasClinicalTrialPubType = true;
                break;
            }
        }
        if ($hasClinicalTrialPubType) {
            $signals[] = 'pubTypeClinicalTrial';
            return ['tier' => 'clinical_trial', 'confidence' => 'high', 'signals' => $signals];
        }
        if (qpmSemanticQualityAnyMatches(QPM_SEMANTIC_QUALITY_CLINICAL_TRIAL_TITLE_PATTERNS, $titleLower)) {
            $signals[] = 'titlePatternClinicalTrial';
            return ['tier' => 'clinical_trial', 'confidence' => 'medium', 'signals' => $signals];
        }

        if (in_array('review', $pubTypesLower, true) || in_array('review article', $pubTypesLower, true)) {
            $signals[] = 'pubTypeReview';
            return ['tier' => 'review', 'confidence' => 'high', 'signals' => $signals];
        }
        if (qpmSemanticQualityAnyMatches(QPM_SEMANTIC_QUALITY_REVIEW_TITLE_PATTERNS, $titleLower)) {
            $signals[] = 'titlePatternReview';
            return ['tier' => 'review', 'confidence' => 'medium', 'signals' => $signals];
        }

        if ($workTypeLower === 'dissertation' || $workTypeLower === 'thesis') {
            $signals[] = 'workTypeDissertation';
            return ['tier' => 'dissertation', 'confidence' => 'high', 'signals' => $signals];
        }
        if ($workTypeLower === 'book') {
            $signals[] = 'workTypeBook';
            return ['tier' => 'book', 'confidence' => 'high', 'signals' => $signals];
        }
        if ($workTypeLower === 'book-chapter' || $workTypeLower === 'book chapter') {
            $signals[] = 'workTypeBookChapter';
            return ['tier' => 'book_chapter', 'confidence' => 'high', 'signals' => $signals];
        }
        if ($workTypeLower === 'preprint') {
            $signals[] = 'workTypePreprint';
            return ['tier' => 'preprint', 'confidence' => 'high', 'signals' => $signals];
        }

        if ($workTypeLower === 'report' || $workTypeLower === 'standard') {
            if ($publisherMatch !== '' || $institutionMatch !== '') {
                $signals[] = 'workTypeReportWithAllowList';
                return ['tier' => 'report_verified', 'confidence' => 'high', 'signals' => $signals];
            }
            $signals[] = 'workTypeReportGeneric';
            return ['tier' => 'report_generic', 'confidence' => 'medium', 'signals' => $signals];
        }

        if (in_array('editorial', $pubTypesLower, true) || in_array('letter', $pubTypesLower, true)
            || in_array('comment', $pubTypesLower, true) || in_array('news', $pubTypesLower, true)
            || in_array('correspondence', $pubTypesLower, true)) {
            $signals[] = 'pubTypeEditorialOrLetter';
            return ['tier' => 'editorial_or_letter', 'confidence' => 'high', 'signals' => $signals];
        }

        $isJournalArticle = $workTypeLower === 'article' || $workTypeLower === 'journal-article' || $workTypeLower === 'journal article'
            || in_array('article', $pubTypesLower, true) || in_array('journal article', $pubTypesLower, true);
        if ($isJournalArticle) {
            $signals[] = 'workTypeJournalArticle';
            return ['tier' => 'research_article', 'confidence' => 'high', 'signals' => $signals];
        }

        $signals[] = 'fallbackResearchArticle';
        return ['tier' => 'research_article', 'confidence' => $hasPmid ? 'medium' : 'low', 'signals' => $signals];
    }
}

if (!defined('QPM_SEMANTIC_QUALITY_CONFIDENCE_COEFFICIENTS')) {
    define('QPM_SEMANTIC_QUALITY_CONFIDENCE_COEFFICIENTS', ['high' => 1.0, 'medium' => 0.7, 'low' => 0.4]);
}

if (!function_exists('qpmSemanticQualityResolveConfidenceCoefficient')) {
    /**
     * @param mixed $confidence
     * @return float
     */
    function qpmSemanticQualityResolveConfidenceCoefficient($confidence): float
    {
        $normalized = qpmSemanticQualityNormalizeLower($confidence);
        return QPM_SEMANTIC_QUALITY_CONFIDENCE_COEFFICIENTS[$normalized] ?? 0.0;
    }
}

if (!function_exists('qpmSemanticQualityComputePubTypeTierBonus')) {
    /**
     * @param array<string,mixed> $classification
     * @param array<string,mixed> $rerankConfig
     * @return array{value:float,tier:string,confidence:string,adjustedBonus:float,baseBonus?:float}
     */
    function qpmSemanticQualityComputePubTypeTierBonus(array $classification, array $rerankConfig): array
    {
        $tier = qpmSemanticQualityNormalizeString($classification['tier'] ?? '');
        if ($tier === '') {
            return ['value' => 0.0, 'tier' => '', 'confidence' => '', 'adjustedBonus' => 0.0];
        }
        $tiersConfig = isset($rerankConfig['pubTypeTiers']) && is_array($rerankConfig['pubTypeTiers']) ? $rerankConfig['pubTypeTiers'] : [];
        $tierEntry = $tiersConfig[$tier] ?? null;
        $baseBonusRaw = is_array($tierEntry) ? ($tierEntry['bonus'] ?? null) : $tierEntry;
        $baseBonus = qpmSemanticQualityToFiniteNumber($baseBonusRaw);
        if ($baseBonus === null || $baseBonus === 0.0) {
            return [
                'value' => 0.0,
                'tier' => $tier,
                'confidence' => (string) ($classification['confidence'] ?? ''),
                'adjustedBonus' => 0.0,
            ];
        }
        $coefficient = qpmSemanticQualityResolveConfidenceCoefficient($classification['confidence'] ?? '');
        $adjustedBonus = $baseBonus * $coefficient;
        return [
            'value' => $adjustedBonus,
            'tier' => $tier,
            'confidence' => (string) ($classification['confidence'] ?? ''),
            'adjustedBonus' => $adjustedBonus,
            'baseBonus' => $baseBonus,
        ];
    }
}

if (!function_exists('qpmSemanticQualityIsExcludedClassification')) {
    /**
     * @param array<string,mixed> $classification
     * @return bool
     */
    function qpmSemanticQualityIsExcludedClassification(array $classification): bool
    {
        return qpmSemanticQualityNormalizeString($classification['tier'] ?? '') === 'excluded';
    }
}

// =====================================================================
// Section 2: Post-validation rule engine (ported from semanticRuleEngine.js)
// =====================================================================
//
// Operates directly on the merged candidate's own metadata (candidate.metadata),
// which is sufficient for the public API's candidate shape. The JS version also
// supports resolving cross-source "metadataByDoi"/"metadataByOpenAlexId" caches
// built during DOI-only hydration; the backend orchestrator does not have that
// separate hydration cache; it instead relies on the merged "enriched" record
// already containing the union of all sources' signals (see Section 3), which
// covers the same underlying metadata that those hydration caches exist to
// provide. metadataFieldConditions therefore read from the same metadata
// snapshot the reranker built for the candidate.

if (!function_exists('qpmSemanticQualityDedupeNormalizedValues')) {
    /**
     * @param array<int,mixed> $values
     * @return array<int,string>
     */
    function qpmSemanticQualityDedupeNormalizedValues(array $values): array
    {
        $seen = [];
        $out = [];
        foreach ($values as $value) {
            $normalized = qpmSemanticQualityNormalizeLower($value);
            if ($normalized === '' || isset($seen[$normalized])) {
                continue;
            }
            $seen[$normalized] = true;
            $out[] = $normalized;
        }
        return $out;
    }
}

if (!function_exists('qpmSemanticQualityAppendMetadataSignalTexts')) {
    /**
     * @param array<int,string> $texts (by reference)
     * @param array<string,mixed> $metadata
     * @return void
     */
    function qpmSemanticQualityAppendMetadataSignalTexts(array &$texts, array $metadata): void
    {
        $values = [
            $metadata['venue'] ?? null,
            $metadata['source'] ?? null,
            $metadata['fulljournalname'] ?? null,
            $metadata['sourceDisplayName'] ?? null,
            $metadata['sourceAbbreviatedTitle'] ?? null,
            $metadata['sourceType'] ?? null,
            $metadata['workType'] ?? null,
            $metadata['publicationDate'] ?? null,
            $metadata['pubDate'] ?? null,
            $metadata['pubdate'] ?? null,
            $metadata['publicationYear'] ?? null,
            $metadata['year'] ?? null,
            $metadata['volume'] ?? null,
            $metadata['issue'] ?? null,
            $metadata['pages'] ?? null,
        ];
        $values = array_merge(
            $values,
            is_array($metadata['publicationTypes'] ?? null) ? $metadata['publicationTypes'] : [],
            is_array($metadata['pubTypes'] ?? null) ? $metadata['pubTypes'] : []
        );
        foreach ($values as $value) {
            $normalized = qpmSemanticQualityNormalizeString($value);
            if ($normalized !== '') {
                $texts[] = $normalized;
            }
        }

        $bibliographicParts = array_filter([
            qpmSemanticQualityNormalizeString($metadata['venue'] ?? ($metadata['sourceDisplayName'] ?? ($metadata['sourceAbbreviatedTitle'] ?? ($metadata['source'] ?? '')))),
            qpmSemanticQualityNormalizeString($metadata['publicationDate'] ?? ($metadata['pubDate'] ?? ($metadata['pubdate'] ?? ($metadata['publicationYear'] ?? ($metadata['year'] ?? ''))))),
            qpmSemanticQualityNormalizeString($metadata['volume'] ?? ''),
            isset($metadata['issue']) && $metadata['issue'] !== '' ? '(' . $metadata['issue'] . ')' : '',
            qpmSemanticQualityNormalizeString($metadata['pages'] ?? ''),
        ]);
        if (!empty($bibliographicParts)) {
            $texts[] = trim(implode(' ', $bibliographicParts));
        }
    }
}

if (!function_exists('qpmSemanticQualityGetCandidateSignalTexts')) {
    /**
     * @param array<string,mixed> $candidate
     * @param array<int,string> $scopes
     * @return array<int,string>
     */
    function qpmSemanticQualityGetCandidateSignalTexts(array $candidate, array $scopes = []): array
    {
        $normalizedScopes = !empty($scopes) ? $scopes : ['candidatetitle', 'sourcecandidatetitles'];
        $scopeSet = array_flip(array_map('qpmSemanticQualityNormalizeLower', $normalizedScopes));
        $useCandidateTitle = isset($scopeSet['candidatetitle']) || isset($scopeSet['alltext']);
        $useSourceMetadataTexts = isset($scopeSet['sourcemetadatexts']) || isset($scopeSet['alltext']);
        $texts = [];

        if ($useCandidateTitle) {
            $texts[] = qpmSemanticQualityNormalizeString($candidate['title'] ?? '');
        }

        if ($useSourceMetadataTexts) {
            $metadata = isset($candidate['metadata']) && is_array($candidate['metadata']) ? $candidate['metadata'] : [];
            qpmSemanticQualityAppendMetadataSignalTexts($texts, array_merge($metadata, [
                'source' => $candidate['source'] ?? '',
            ]));
        }

        // Note: "sourcecandidatetitles" scope (titles as seen by each individual
        // upstream source before merge) is not reconstructable from the backend's
        // merged candidate shape without keeping every raw per-source candidate
        // around. The merged candidate's own title/metadata already reflects the
        // union of all sources that contributed to it, which is the input this
        // scope is meant to widen the search over, so no separate branch is
        // needed here.

        return qpmSemanticQualityDedupeNormalizedValues($texts);
    }
}

if (!function_exists('qpmSemanticQualityGetCandidateSourceProviders')) {
    /**
     * @param array<string,mixed> $candidate
     * @return array<int,string>
     */
    function qpmSemanticQualityGetCandidateSourceProviders(array $candidate): array
    {
        $providers = [qpmSemanticQualityNormalizeLower($candidate['source'] ?? '')];
        // The merged candidate carries every contributing source under 'sources'
        // (see Section 3's mergeSourceCandidates equivalent), which is the exact
        // cross-source provider list the JS version derives from its DOI/OpenAlexId
        // hydration cache.
        if (isset($candidate['sources']) && is_array($candidate['sources'])) {
            foreach ($candidate['sources'] as $sourceKey) {
                $providers[] = qpmSemanticQualityNormalizeLower($sourceKey);
            }
        }
        return qpmSemanticQualityDedupeNormalizedValues($providers);
    }
}

if (!function_exists('qpmSemanticQualityBuildMetadataSnapshot')) {
    /**
     * @param array<string,mixed> $candidate Merged candidate (has 'enriched', 'pubTypeClassification', 'sources')
     * @return array<string,mixed>
     */
    function qpmSemanticQualityBuildMetadataSnapshot(array $candidate): array
    {
        $enriched = isset($candidate['enriched']) && is_array($candidate['enriched']) ? $candidate['enriched'] : [];
        $classification = isset($candidate['pubTypeClassification']) && is_array($candidate['pubTypeClassification']) ? $candidate['pubTypeClassification'] : [];
        $sourceProviders = qpmSemanticQualityGetCandidateSourceProviders($candidate);
        $pubTypeTier = qpmSemanticQualityNormalizeLower($classification['tier'] ?? '');
        $pubTypeConfidence = qpmSemanticQualityNormalizeLower($classification['confidence'] ?? '');

        $publicationTypes = [];
        foreach (($enriched['pubTypes'] ?? []) as $type) {
            $publicationTypes[] = qpmSemanticQualityNormalizeLower($type);
        }

        return [
            'candidateSource' => qpmSemanticQualityNormalizeLower($candidate['source'] ?? ''),
            'sourceProviders' => $sourceProviders,
            'hasOpenAlexId' => qpmSemanticQualityNormalizeString($candidate['openAlexId'] ?? '') !== '',
            'hasDoi' => qpmSemanticQualityNormalizeString($candidate['doi'] ?? '') !== '',
            'openAlexId' => qpmSemanticQualityNormalizeString($candidate['openAlexId'] ?? ''),
            'candidatePublicationYear' => qpmSemanticQualityNormalizeLower($enriched['publicationYear'] ?? ''),
            'candidateVenue' => qpmSemanticQualityNormalizeLower($enriched['venue'] ?? ''),
            'candidateSourceType' => qpmSemanticQualityNormalizeLower($enriched['sourceType'] ?? ''),
            'candidatePublicationTypes' => $publicationTypes,
            'candidatePubTypeTier' => $pubTypeTier,
            'candidatePubTypeConfidence' => $pubTypeConfidence,
            'candidateVolume' => qpmSemanticQualityNormalizeLower($enriched['volume'] ?? ($candidate['volume'] ?? '')),
            'candidateIssue' => qpmSemanticQualityNormalizeLower($enriched['issue'] ?? ($candidate['issue'] ?? '')),
        ];
    }
}

if (!function_exists('qpmSemanticQualitySnapshotValueExists')) {
    /**
     * @param mixed $value
     * @return bool
     */
    function qpmSemanticQualitySnapshotValueExists($value): bool
    {
        if (is_array($value)) {
            return count($value) > 0;
        }
        if (is_bool($value)) {
            return $value;
        }
        return qpmSemanticQualityNormalizeString($value) !== '';
    }
}

if (!function_exists('qpmSemanticQualitySnapshotValueEqualsAny')) {
    /**
     * @param mixed $value
     * @param array<int,mixed> $expectedValues
     * @return bool
     */
    function qpmSemanticQualitySnapshotValueEqualsAny($value, array $expectedValues): bool
    {
        $normalizedExpected = array_map('qpmSemanticQualityNormalizeLower', $expectedValues);
        if (empty($normalizedExpected)) {
            return true;
        }
        if (is_array($value)) {
            $normalizedValues = array_map('qpmSemanticQualityNormalizeLower', $value);
            return count(array_intersect($normalizedValues, $normalizedExpected)) > 0;
        }
        if (is_bool($value)) {
            return in_array(strtolower($value ? 'true' : 'false'), $normalizedExpected, true);
        }
        return in_array(qpmSemanticQualityNormalizeLower($value), $normalizedExpected, true);
    }
}

if (!function_exists('qpmSemanticQualitySnapshotValueIncludesAny')) {
    /**
     * @param mixed $value
     * @param array<int,mixed> $expectedValues
     * @return bool
     */
    function qpmSemanticQualitySnapshotValueIncludesAny($value, array $expectedValues): bool
    {
        $normalizedExpected = array_map('qpmSemanticQualityNormalizeLower', $expectedValues);
        if (empty($normalizedExpected)) {
            return true;
        }
        if (is_array($value)) {
            foreach ($value as $entry) {
                $normalizedEntry = qpmSemanticQualityNormalizeLower($entry);
                foreach ($normalizedExpected as $expected) {
                    if (strpos($normalizedEntry, $expected) !== false) {
                        return true;
                    }
                }
            }
            return false;
        }
        $normalizedValue = qpmSemanticQualityNormalizeLower($value);
        foreach ($normalizedExpected as $expected) {
            if (strpos($normalizedValue, $expected) !== false) {
                return true;
            }
        }
        return false;
    }
}

if (!function_exists('qpmSemanticQualityEvaluateMetadataFieldCondition')) {
    /**
     * @param array<string,mixed> $snapshot
     * @param array<string,mixed> $condition
     * @return bool
     */
    function qpmSemanticQualityEvaluateMetadataFieldCondition(array $snapshot, array $condition): bool
    {
        $field = (string) ($condition['field'] ?? '');
        $value = $snapshot[$field] ?? null;
        $operator = qpmSemanticQualityNormalizeLower($condition['operator'] ?? '');
        switch ($operator) {
            case 'exists':
                $expectExists = array_key_exists('expectExists', $condition) ? (bool) $condition['expectExists'] : true;
                $passed = qpmSemanticQualitySnapshotValueExists($value) === $expectExists;
                break;
            case 'includesany':
                $passed = qpmSemanticQualitySnapshotValueIncludesAny($value, (array) ($condition['values'] ?? []));
                break;
            case 'equalsany':
            default:
                $passed = qpmSemanticQualitySnapshotValueEqualsAny($value, (array) ($condition['values'] ?? []));
                break;
        }
        return !empty($condition['negate']) ? !$passed : $passed;
    }
}

if (!function_exists('qpmSemanticQualityEvaluateRule')) {
    /**
     * Ported from evaluateCandidateSemanticRule() in semanticRuleEngine.js.
     *
     * @param array<string,mixed> $candidate Merged candidate
     * @param array<string,mixed> $rule
     * @param array<int,string> $sourceProviders
     * @param array<string,mixed> $metadataSnapshot
     * @return array{passed:bool,ruleId:string,ruleLabel:string,failures:array<int,string>}
     */
    function qpmSemanticQualityEvaluateRule(array $candidate, array $rule, array $sourceProviders, array $metadataSnapshot): array
    {
        $signalTexts = qpmSemanticQualityGetCandidateSignalTexts($candidate, (array) ($rule['textScopes'] ?? []));

        $requireAny = (array) ($rule['requireAnyTextSignals'] ?? []);
        $hasRequiredAnySignal = empty($requireAny) || array_reduce($requireAny, function ($carry, $signal) use ($signalTexts) {
            if ($carry) {
                return true;
            }
            foreach ($signalTexts as $text) {
                if (strpos($text, qpmSemanticQualityNormalizeLower($signal)) !== false) {
                    return true;
                }
            }
            return false;
        }, false);

        $requireAll = (array) ($rule['requireAllTextSignals'] ?? []);
        $hasRequiredAllSignals = true;
        foreach ($requireAll as $signal) {
            $found = false;
            foreach ($signalTexts as $text) {
                if (strpos($text, qpmSemanticQualityNormalizeLower($signal)) !== false) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $hasRequiredAllSignals = false;
                break;
            }
        }

        $excludeAny = (array) ($rule['excludeAnyTextSignals'] ?? []);
        $hasExcludedSignal = false;
        foreach ($excludeAny as $signal) {
            foreach ($signalTexts as $text) {
                if (strpos($text, qpmSemanticQualityNormalizeLower($signal)) !== false) {
                    $hasExcludedSignal = true;
                    break 2;
                }
            }
        }

        $allowProviders = (array) ($rule['allowSourceProviders'] ?? []);
        $hasAllowedProvider = empty($allowProviders) || count(array_intersect(
            array_map('qpmSemanticQualityNormalizeLower', $allowProviders),
            $sourceProviders
        )) > 0;

        $excludeProviders = (array) ($rule['excludeSourceProviders'] ?? []);
        $hasExcludedProvider = !empty($excludeProviders) && count(array_intersect(
            array_map('qpmSemanticQualityNormalizeLower', $excludeProviders),
            $sourceProviders
        )) > 0;

        $metadataConditions = (array) ($rule['metadataFieldConditions'] ?? []);
        $metadataResults = [];
        foreach ($metadataConditions as $condition) {
            $metadataResults[] = qpmSemanticQualityEvaluateMetadataFieldCondition($metadataSnapshot, (array) $condition);
        }
        if (empty($metadataResults)) {
            $matchesMetadataConditions = true;
        } elseif (qpmSemanticQualityNormalizeLower($rule['metadataFieldConditionMode'] ?? '') === 'any') {
            $matchesMetadataConditions = in_array(true, $metadataResults, true);
        } else {
            $matchesMetadataConditions = !in_array(false, $metadataResults, true);
        }

        $positiveChecks = [];
        if (!empty($requireAny)) {
            $positiveChecks[] = $hasRequiredAnySignal;
        }
        if (!empty($requireAll)) {
            $positiveChecks[] = $hasRequiredAllSignals;
        }
        if (!empty($allowProviders)) {
            $positiveChecks[] = $hasAllowedProvider;
        }
        if (!empty($metadataConditions)) {
            $positiveChecks[] = $matchesMetadataConditions;
        }

        $negativeChecks = [];
        if (!empty($excludeAny)) {
            $negativeChecks[] = !$hasExcludedSignal;
        }
        if (!empty($excludeProviders)) {
            $negativeChecks[] = !$hasExcludedProvider;
        }

        if (empty($positiveChecks)) {
            $positivePassed = true;
        } elseif (qpmSemanticQualityNormalizeLower($rule['matchStrategy'] ?? '') === 'any') {
            $positivePassed = in_array(true, $positiveChecks, true);
        } else {
            $positivePassed = !in_array(false, $positiveChecks, true);
        }
        $negativePassed = !in_array(false, $negativeChecks, true);
        $passed = $positivePassed && $negativePassed;

        $failures = [];
        if (!$hasRequiredAnySignal) {
            $failures[] = 'missing_any_text_signal';
        }
        if (!$hasRequiredAllSignals) {
            $failures[] = 'missing_required_text_signals';
        }
        if ($hasExcludedSignal) {
            $failures[] = 'matched_excluded_text_signal';
        }
        if (!$hasAllowedProvider) {
            $failures[] = 'provider_not_allowed';
        }
        if ($hasExcludedProvider) {
            $failures[] = 'provider_excluded';
        }
        if (!$matchesMetadataConditions) {
            $failures[] = 'metadata_conditions_failed';
        }

        return [
            'passed' => $passed,
            'ruleId' => qpmSemanticQualityNormalizeString($rule['id'] ?? ($rule['key'] ?? ($rule['label'] ?? ''))),
            'ruleLabel' => qpmSemanticQualityNormalizeString($rule['label'] ?? ($rule['id'] ?? '')),
            'failures' => $failures,
        ];
    }
}

if (!function_exists('qpmSemanticQualityCandidateMatchesPostValidation')) {
    /**
     * Ported from explainCandidateActiveSemanticDoiOnlyRules() / candidateMatchesActiveSemanticDoiOnlyRules()
     * in semanticRuleEngine.js.
     *
     * @param array<string,mixed> $candidate Merged candidate
     * @param array<string,mixed> $ruleState { activeRules: [...] } or { ruleGroups: [{ id, rules: [...] }, ...] }
     * @return array{matches:bool,ruleResults:array<int,array<string,mixed>>}
     */
    function qpmSemanticQualityCandidateMatchesPostValidation(array $candidate, array $ruleState): array
    {
        $activeRules = (array) ($ruleState['activeRules'] ?? []);
        $ruleGroups = (array) ($ruleState['ruleGroups'] ?? []);
        if (empty($activeRules) && empty($ruleGroups)) {
            return ['matches' => true, 'ruleResults' => []];
        }

        $sourceProviders = qpmSemanticQualityGetCandidateSourceProviders($candidate);
        $metadataSnapshot = qpmSemanticQualityBuildMetadataSnapshot($candidate);

        if (!empty($ruleGroups)) {
            $groupResults = [];
            $allRuleResults = [];
            foreach ($ruleGroups as $group) {
                $rules = (array) ($group['rules'] ?? []);
                $ruleResults = [];
                foreach ($rules as $rule) {
                    $ruleResults[] = qpmSemanticQualityEvaluateRule($candidate, (array) $rule, $sourceProviders, $metadataSnapshot);
                }
                $groupPassed = false;
                foreach ($ruleResults as $result) {
                    if ($result['passed']) {
                        $groupPassed = true;
                        break;
                    }
                }
                $groupResults[] = ['groupId' => (string) ($group['id'] ?? ($group['label'] ?? '')), 'passed' => $groupPassed, 'ruleResults' => $ruleResults];
                $allRuleResults = array_merge($allRuleResults, $ruleResults);
            }
            $allGroupsPassed = true;
            foreach ($groupResults as $group) {
                if (!$group['passed']) {
                    $allGroupsPassed = false;
                    break;
                }
            }
            return ['matches' => $allGroupsPassed, 'ruleResults' => $allRuleResults];
        }

        $ruleResults = [];
        foreach ($activeRules as $rule) {
            $ruleResults[] = qpmSemanticQualityEvaluateRule($candidate, (array) $rule, $sourceProviders, $metadataSnapshot);
        }
        $allPassed = true;
        foreach ($ruleResults as $result) {
            if (!$result['passed']) {
                $allPassed = false;
                break;
            }
        }
        return ['matches' => $allPassed, 'ruleResults' => $ruleResults];
    }
}

// =====================================================================
// Section 3: Hybrid quality-signal rerank formula (ported from semanticReranking.js)
// =====================================================================

if (!function_exists('qpmSemanticQualityLog1p')) {
    /**
     * PHP has no native log1p(); this is numerically adequate for the value
     * ranges used here (citation counts, RCR, percentiles), none of which are
     * small enough to require log1p's extra precision near zero.
     *
     * @param float $value
     * @return float
     */
    function qpmSemanticQualityLog1p(float $value): float
    {
        return log(1 + $value);
    }
}

if (!function_exists('qpmSemanticQualityToBooleanOrNull')) {
    /**
     * @param mixed $value
     * @return ?bool
     */
    function qpmSemanticQualityToBooleanOrNull($value): ?bool
    {
        if ($value === true || $value === false) {
            return $value;
        }
        if ($value === null) {
            return null;
        }
        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if ($normalized === 'true' || $normalized === '1') {
                return true;
            }
            if ($normalized === 'false' || $normalized === '0') {
                return false;
            }
        }
        return null;
    }
}

if (!function_exists('qpmSemanticQualityNormalizeClamp')) {
    /**
     * @param mixed $value
     * @param array{0:float,1:float} $fallback
     * @return array{0:float,1:float}
     */
    function qpmSemanticQualityNormalizeClamp($value, array $fallback = [1.0, 1.0]): array
    {
        if (!is_array($value) || count($value) !== 2) {
            return $fallback;
        }
        $min = qpmSemanticQualityToFiniteNumber($value[0] ?? null);
        $max = qpmSemanticQualityToFiniteNumber($value[1] ?? null);
        if ($min === null || $max === null) {
            return $fallback;
        }
        return $min <= $max ? [$min, $max] : $fallback;
    }
}

if (!function_exists('qpmSemanticQualityClampTo')) {
    /**
     * @param float $value
     * @param array{0:float,1:float} $clamp
     * @return float
     */
    function qpmSemanticQualityClampTo(float $value, array $clamp): float
    {
        if (count($clamp) !== 2) {
            return $value;
        }
        return max($clamp[0], min($clamp[1], $value));
    }
}

if (!function_exists('qpmSemanticQualityNormalizePmidValue')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmSemanticQualityNormalizePmidValue($value): string
    {
        $pmid = trim((string) ($value ?? ''));
        return preg_match('/^[0-9]+$/', $pmid) === 1 ? $pmid : '';
    }
}

if (!function_exists('qpmSemanticQualityNormalizeDoiValue')) {
    /**
     * @param mixed $value
     * @return string
     */
    function qpmSemanticQualityNormalizeDoiValue($value): string
    {
        $doi = trim((string) ($value ?? ''));
        $doi = (string) preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $doi);
        $doi = (string) preg_replace('~^doi:\s*~i', '', $doi);
        return trim($doi);
    }
}

if (!function_exists('qpmSemanticQualityDefaultRerankConfig')) {
    /**
     * Mirrors DEFAULT_SEMANTIC_RERANK_CONFIG in semanticReranking.js. All hybrid
     * quality-signal defaults are NEUTRAL, so an unconfigured install keeps the
     * bare-RRF behavior identical to before this port existed.
     *
     * @return array<string,mixed>
     */
    function qpmSemanticQualityDefaultRerankConfig(): array
    {
        return [
            'sourceWeights' => ['pubmed' => 1.0, 'semanticScholar' => 0.92, 'openAlex' => 0.88, 'elicit' => 0.9],
            'pmidBonus' => 10,
            'rankScale' => 100,
            'scoreScale' => 20,
            'fallbackSourceWeight' => 0.8,
            'overlapBonusPerExtraSource' => 35,
            'rrfK' => 60,
            'pubTypeWeights' => [],
            'recencyHalfLifeYears' => null,
            'recencyBonusMax' => 0,
            'recencyCurveEnabled' => false,
            'recencyCurve' => [[5, 1.0], [10, 0.6], [25, 0.25]],
            'recencyMultiplierCurve' => [],
            'oaBonus' => 0,
            'citationImpactClamp' => [1.0, 1.0],
            'citationImpactSignalWeights' => [
                'rcr' => 0.5,
                'fwci' => 0.5,
                'nihPercentile' => 0,
                'fieldNormalizedCitationRatio' => 0,
                'influentialCitationCount' => 0.15,
                'citedByCount' => 0.08,
            ],
            'translationPotentialBonusMax' => 0,
            'translationPotentialAptScale' => 10,
            'retractionAction' => 'none',
            'retractionPenalty' => 1.0,
            'clinicalBonus' => 0,
            'clinicalCitedByThreshold' => 1000000,
            'topicOverlapBonus' => 0,
            'authorityClamp' => [1.0, 1.0],
            'dataQualityPenalties' => [
                'missingAbstract' => 1.0,
                'shortAbstract' => 1.0,
                'veryShortAbstract' => 1.0,
                'missingAuthor' => 1.0,
                'missingYear' => 1.0,
            ],
            'abstractMinLength' => ['short' => 100, 'veryShort' => 250],
            'pubTypeTiers' => [],
            'guidelinePublisherAllowList' => [],
        ];
    }
}

if (!function_exists('qpmSemanticQualityResolveRerankConfig')) {
    /**
     * Mirrors resolveSemanticRerankConfig() in semanticReranking.js.
     *
     * @param array<string,mixed> $runtimeRerankConfig
     * @return array<string,mixed>
     */
    function qpmSemanticQualityResolveRerankConfig(array $runtimeRerankConfig = []): array
    {
        $default = qpmSemanticQualityDefaultRerankConfig();
        $merged = array_merge($default, $runtimeRerankConfig);

        $merged['sourceWeights'] = array_merge($default['sourceWeights'], is_array($runtimeRerankConfig['sourceWeights'] ?? null) ? $runtimeRerankConfig['sourceWeights'] : []);
        $merged['pubTypeWeights'] = array_merge($default['pubTypeWeights'], is_array($runtimeRerankConfig['pubTypeWeights'] ?? null) ? $runtimeRerankConfig['pubTypeWeights'] : []);
        $merged['citationImpactSignalWeights'] = array_merge($default['citationImpactSignalWeights'], is_array($runtimeRerankConfig['citationImpactSignalWeights'] ?? null) ? $runtimeRerankConfig['citationImpactSignalWeights'] : []);
        $merged['citationImpactClamp'] = qpmSemanticQualityNormalizeClamp($runtimeRerankConfig['citationImpactClamp'] ?? null, $default['citationImpactClamp']);
        $merged['authorityClamp'] = qpmSemanticQualityNormalizeClamp($runtimeRerankConfig['authorityClamp'] ?? null, $default['authorityClamp']);
        $merged['dataQualityPenalties'] = array_merge($default['dataQualityPenalties'], is_array($runtimeRerankConfig['dataQualityPenalties'] ?? null) ? $runtimeRerankConfig['dataQualityPenalties'] : []);
        $merged['abstractMinLength'] = array_merge($default['abstractMinLength'], is_array($runtimeRerankConfig['abstractMinLength'] ?? null) ? $runtimeRerankConfig['abstractMinLength'] : []);
        $merged['pubTypeTiers'] = array_merge($default['pubTypeTiers'], is_array($runtimeRerankConfig['pubTypeTiers'] ?? null) ? $runtimeRerankConfig['pubTypeTiers'] : []);
        $merged['guidelinePublisherAllowList'] = is_array($runtimeRerankConfig['guidelinePublisherAllowList'] ?? null) ? $runtimeRerankConfig['guidelinePublisherAllowList'] : $default['guidelinePublisherAllowList'];
        $merged['recencyCurveEnabled'] = ($runtimeRerankConfig['recencyCurveEnabled'] ?? false) === true;
        $merged['recencyCurve'] = (is_array($runtimeRerankConfig['recencyCurve'] ?? null) && count($runtimeRerankConfig['recencyCurve']) > 0) ? $runtimeRerankConfig['recencyCurve'] : $default['recencyCurve'];
        $merged['recencyMultiplierCurve'] = is_array($runtimeRerankConfig['recencyMultiplierCurve'] ?? null) ? $runtimeRerankConfig['recencyMultiplierCurve'] : $default['recencyMultiplierCurve'];

        return $merged;
    }
}

if (!function_exists('qpmSemanticQualityCreateEnrichedRecord')) {
    /**
     * @return array<string,mixed>
     */
    function qpmSemanticQualityCreateEnrichedRecord(): array
    {
        return [
            'publicationYear' => null,
            'publicationYearSource' => '',
            'publicationDate' => '',
            'publicationDateSource' => '',
            'pubTypes' => [],
            'fwci' => null,
            'citedByCount' => null,
            'citedByCountBySource' => [],
            'influentialCitationCount' => null,
            'isRetracted' => null,
            'isOpenAccess' => null,
            'primaryTopicId' => '',
            'primaryTopicDisplayName' => '',
            's2FieldsOfStudy' => [],
            'journalSourceId' => '',
            'authorIds' => [],
            'rcr' => null,
            'nihPercentile' => null,
            'isClinical' => null,
            'citedByClin' => null,
            'apt' => null,
            'fieldCitationRate' => null,
            'authorityAuthors' => null,
            'authorityJournal' => null,
            'abstractLength' => null,
            'hasAuthor' => false,
            'language' => '',
            'publisher' => '',
            'venue' => '',
            'sourceType' => '',
            'workType' => '',
        ];
    }
}

if (!defined('QPM_SEMANTIC_QUALITY_ENRICHED_SOURCE_PRIORITY')) {
    define('QPM_SEMANTIC_QUALITY_ENRICHED_SOURCE_PRIORITY', ['openAlex', 'semanticScholar', 'pubmed', 'elicit']);
}

if (!function_exists('qpmSemanticQualityPreferByPriority')) {
    /**
     * @param mixed $currentValue
     * @param string $currentSource
     * @param mixed $incomingValue
     * @param string $incomingSource
     * @return array{value: mixed, source: string}
     */
    function qpmSemanticQualityPreferByPriority($currentValue, string $currentSource, $incomingValue, string $incomingSource): array
    {
        if ($incomingValue === null || $incomingValue === '') {
            return ['value' => $currentValue, 'source' => $currentSource];
        }
        if ($currentValue === null || $currentValue === '') {
            return ['value' => $incomingValue, 'source' => $incomingSource];
        }
        $priority = QPM_SEMANTIC_QUALITY_ENRICHED_SOURCE_PRIORITY;
        $currentIndex = array_search($currentSource, $priority, true);
        $incomingIndex = array_search($incomingSource, $priority, true);
        $currentRank = $currentIndex === false ? count($priority) : $currentIndex;
        $incomingRank = $incomingIndex === false ? count($priority) : $incomingIndex;
        if ($incomingRank < $currentRank) {
            return ['value' => $incomingValue, 'source' => $incomingSource];
        }
        return ['value' => $currentValue, 'source' => $currentSource];
    }
}

if (!function_exists('qpmSemanticQualityMergeEnrichedFromCandidate')) {
    /**
     * Ported from mergeEnrichedFromCandidate() in semanticReranking.js.
     *
     * @param array<string,mixed> $enriched (by reference)
     * @param array<string,mixed> $candidate
     * @return void
     */
    function qpmSemanticQualityMergeEnrichedFromCandidate(array &$enriched, array $candidate): void
    {
        $sourceKey = qpmSemanticQualityNormalizeString($candidate['source'] ?? '');
        $metadata = isset($candidate['metadata']) && is_array($candidate['metadata']) ? $candidate['metadata'] : [];

        $yearRaw = $metadata['publicationYear'] ?? ($metadata['year'] ?? null);
        $yearFromMetadata = qpmSemanticQualityToFiniteInt($yearRaw);
        if ($yearFromMetadata !== null && $yearFromMetadata <= 1000) {
            $yearFromMetadata = null;
        }
        if ($yearFromMetadata !== null) {
            $result = qpmSemanticQualityPreferByPriority($enriched['publicationYear'], $enriched['publicationYearSource'], $yearFromMetadata, $sourceKey);
            $enriched['publicationYear'] = $result['value'];
            $enriched['publicationYearSource'] = $result['source'];
        }

        $dateFromMetadata = qpmSemanticQualityNormalizeString($metadata['publicationDate'] ?? '');
        if ($dateFromMetadata !== '') {
            $result = qpmSemanticQualityPreferByPriority($enriched['publicationDate'], $enriched['publicationDateSource'], $dateFromMetadata, $sourceKey);
            $enriched['publicationDate'] = $result['value'];
            $enriched['publicationDateSource'] = $result['source'];
        }

        $metadataPubTypes = is_array($metadata['pubTypes'] ?? null) ? $metadata['pubTypes'] : (is_array($metadata['publicationTypes'] ?? null) ? $metadata['publicationTypes'] : []);
        if (!empty($metadataPubTypes)) {
            $existing = array_flip($enriched['pubTypes']);
            foreach ($metadataPubTypes as $rawType) {
                $normalized = qpmSemanticQualityNormalizeString($rawType);
                if ($normalized !== '') {
                    $existing[$normalized] = true;
                }
            }
            if (!empty($metadata['workType'])) {
                $normalizedWorkType = qpmSemanticQualityNormalizeString($metadata['workType']);
                if ($normalizedWorkType !== '') {
                    $existing[$normalizedWorkType] = true;
                }
            }
            $enriched['pubTypes'] = array_keys($existing);
        } elseif (!empty($metadata['workType'])) {
            $normalizedWorkType = qpmSemanticQualityNormalizeString($metadata['workType']);
            if ($normalizedWorkType !== '') {
                $existing = array_flip($enriched['pubTypes']);
                $existing[$normalizedWorkType] = true;
                $enriched['pubTypes'] = array_keys($existing);
            }
        }

        $fwciValue = qpmSemanticQualityToFiniteNumber($metadata['fwci'] ?? null);
        if ($fwciValue !== null && $enriched['fwci'] === null) {
            $enriched['fwci'] = $fwciValue;
        }

        $citedByCountValue = qpmSemanticQualityToFiniteInt($metadata['citedByCount'] ?? ($metadata['citationCount'] ?? null));
        if ($citedByCountValue !== null) {
            if ($sourceKey !== '') {
                $enriched['citedByCountBySource'][$sourceKey] = $citedByCountValue;
            }
            if ($enriched['citedByCount'] === null || $citedByCountValue > $enriched['citedByCount']) {
                $enriched['citedByCount'] = $citedByCountValue;
            }
        }

        $influentialValue = qpmSemanticQualityToFiniteInt($metadata['influentialCitationCount'] ?? null);
        if ($influentialValue !== null && $enriched['influentialCitationCount'] === null) {
            $enriched['influentialCitationCount'] = $influentialValue;
        }

        $retractedValue = qpmSemanticQualityToBooleanOrNull($metadata['isRetracted'] ?? null);
        if ($retractedValue === true) {
            $enriched['isRetracted'] = true;
        } elseif ($retractedValue === false && $enriched['isRetracted'] !== true) {
            $enriched['isRetracted'] = false;
        }

        $oaValue = qpmSemanticQualityToBooleanOrNull($metadata['isOpenAccess'] ?? null);
        if ($oaValue === true) {
            $enriched['isOpenAccess'] = true;
        } elseif ($oaValue === false && $enriched['isOpenAccess'] !== true) {
            $enriched['isOpenAccess'] = false;
        }

        $topicId = qpmSemanticQualityNormalizeString($metadata['primaryTopicId'] ?? '');
        if ($topicId !== '' && $enriched['primaryTopicId'] === '') {
            $enriched['primaryTopicId'] = $topicId;
        }
        $topicName = qpmSemanticQualityNormalizeString($metadata['primaryTopicDisplayName'] ?? '');
        if ($topicName !== '' && $enriched['primaryTopicDisplayName'] === '') {
            $enriched['primaryTopicDisplayName'] = $topicName;
        }

        $s2Fields = is_array($metadata['s2FieldsOfStudy'] ?? null) ? $metadata['s2FieldsOfStudy'] : [];
        if (!empty($s2Fields)) {
            $existing = array_flip($enriched['s2FieldsOfStudy']);
            foreach ($s2Fields as $field) {
                $normalized = qpmSemanticQualityNormalizeString($field);
                if ($normalized !== '') {
                    $existing[$normalized] = true;
                }
            }
            $enriched['s2FieldsOfStudy'] = array_keys($existing);
        }

        $journalId = qpmSemanticQualityNormalizeString($metadata['journalSourceId'] ?? '');
        if ($journalId !== '' && $enriched['journalSourceId'] === '') {
            $enriched['journalSourceId'] = $journalId;
        }

        $authorIds = is_array($metadata['authorIds'] ?? null) ? $metadata['authorIds'] : [];
        if (!empty($authorIds)) {
            $existing = array_flip($enriched['authorIds']);
            foreach ($authorIds as $authorId) {
                $normalized = qpmSemanticQualityNormalizeString($authorId);
                if ($normalized !== '') {
                    $existing[$normalized] = true;
                }
            }
            $enriched['authorIds'] = array_keys($existing);
        }

        $icite = isset($metadata['icite']) && is_array($metadata['icite']) ? $metadata['icite'] : null;
        if ($icite !== null) {
            $rcrValue = qpmSemanticQualityToFiniteNumber($icite['relativeCitationRatio'] ?? ($icite['rcr'] ?? null));
            if ($rcrValue !== null) {
                $enriched['rcr'] = $rcrValue;
            }
            $nihPercentileValue = qpmSemanticQualityToFiniteNumber($icite['nihPercentile'] ?? null);
            if ($nihPercentileValue !== null) {
                $enriched['nihPercentile'] = $nihPercentileValue;
            }
            $isClinicalValue = qpmSemanticQualityToBooleanOrNull($icite['isClinical'] ?? null);
            if ($isClinicalValue === true) {
                $enriched['isClinical'] = true;
            } elseif ($isClinicalValue === false && $enriched['isClinical'] !== true) {
                $enriched['isClinical'] = false;
            }
            $citedByClinValue = qpmSemanticQualityToFiniteInt($icite['citedByClin'] ?? null);
            if ($citedByClinValue !== null) {
                $enriched['citedByClin'] = $citedByClinValue;
            }
            $aptValue = qpmSemanticQualityToFiniteNumber($icite['apt'] ?? null);
            if ($aptValue !== null) {
                $enriched['apt'] = $aptValue;
            }
            $fieldRateValue = qpmSemanticQualityToFiniteNumber($icite['fieldCitationRate'] ?? null);
            if ($fieldRateValue !== null) {
                $enriched['fieldCitationRate'] = $fieldRateValue;
            }
        }

        $authorityAuthorsIncoming = isset($metadata['authorityAuthors']) && is_array($metadata['authorityAuthors']) ? $metadata['authorityAuthors'] : null;
        if ($authorityAuthorsIncoming !== null) {
            $maxHIndex = qpmSemanticQualityToFiniteInt($authorityAuthorsIncoming['maxHIndex'] ?? null);
            if ($maxHIndex !== null) {
                if (!is_array($enriched['authorityAuthors'])) {
                    $enriched['authorityAuthors'] = ['maxHIndex' => $maxHIndex];
                } elseif ($enriched['authorityAuthors']['maxHIndex'] === null || $maxHIndex > $enriched['authorityAuthors']['maxHIndex']) {
                    $enriched['authorityAuthors']['maxHIndex'] = $maxHIndex;
                }
            }
        }

        $abstractCandidates = [
            $metadata['abstract'] ?? null,
            $metadata['abstractText'] ?? null,
            isset($metadata['tldr']) && is_array($metadata['tldr']) ? ($metadata['tldr']['text'] ?? null) : null,
        ];
        foreach ($abstractCandidates as $raw) {
            $text = qpmSemanticQualityNormalizeString($raw);
            if ($text === '') {
                continue;
            }
            $length = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
            if ($enriched['abstractLength'] === null || $length > $enriched['abstractLength']) {
                $enriched['abstractLength'] = $length;
            }
        }

        $authorCandidateLists = [
            is_array($metadata['authors'] ?? null) ? $metadata['authors'] : null,
            is_array($metadata['authorships'] ?? null) ? $metadata['authorships'] : null,
            is_array($metadata['authorNames'] ?? null) ? $metadata['authorNames'] : null,
        ];
        foreach ($authorCandidateLists as $list) {
            if ($list === null) {
                continue;
            }
            foreach ($list as $author) {
                if ($author === null || $author === '') {
                    continue;
                }
                if (is_string($author) && trim($author) !== '') {
                    $enriched['hasAuthor'] = true;
                    break;
                }
                if (is_array($author)) {
                    $name = qpmSemanticQualityNormalizeString(
                        $author['name'] ?? ($author['displayName'] ?? ($author['display_name'] ?? ($author['author']['display_name'] ?? '')))
                    );
                    if ($name !== '') {
                        $enriched['hasAuthor'] = true;
                        break;
                    }
                }
            }
            if ($enriched['hasAuthor']) {
                break;
            }
        }
        if (!$enriched['hasAuthor'] && !empty($enriched['authorIds'])) {
            $enriched['hasAuthor'] = true;
        }

        $languageValue = qpmSemanticQualityNormalizeString($metadata['language'] ?? '');
        if ($languageValue !== '' && $enriched['language'] === '') {
            $enriched['language'] = $languageValue;
        }
        $publisherValue = qpmSemanticQualityNormalizeString($metadata['publisher'] ?? ($metadata['hostPublisher'] ?? ''));
        if ($publisherValue !== '' && $enriched['publisher'] === '') {
            $enriched['publisher'] = $publisherValue;
        }
        $venueValue = qpmSemanticQualityNormalizeString($metadata['venue'] ?? ($metadata['fulljournalname'] ?? ($metadata['sourceDisplayName'] ?? '')));
        if ($venueValue !== '' && $enriched['venue'] === '') {
            $enriched['venue'] = $venueValue;
        }
        $sourceTypeValue = qpmSemanticQualityNormalizeString($metadata['sourceType'] ?? '');
        if ($sourceTypeValue !== '' && $enriched['sourceType'] === '') {
            $enriched['sourceType'] = $sourceTypeValue;
        }
        $workTypeValue = qpmSemanticQualityNormalizeString($metadata['workType'] ?? '');
        if ($workTypeValue !== '' && $enriched['workType'] === '') {
            $enriched['workType'] = $workTypeValue;
        }

        $authorityJournalIncoming = isset($metadata['authorityJournal']) && is_array($metadata['authorityJournal']) ? $metadata['authorityJournal'] : null;
        if ($authorityJournalIncoming !== null) {
            if (!is_array($enriched['authorityJournal'])) {
                $enriched['authorityJournal'] = ['meanCitedness' => null, 'hIndex' => null, 'isInDoaj' => null];
            }
            $meanCitedness = qpmSemanticQualityToFiniteNumber($authorityJournalIncoming['meanCitedness'] ?? null);
            if ($meanCitedness !== null && $enriched['authorityJournal']['meanCitedness'] === null) {
                $enriched['authorityJournal']['meanCitedness'] = $meanCitedness;
            }
            $journalHIndex = qpmSemanticQualityToFiniteInt($authorityJournalIncoming['hIndex'] ?? null);
            if ($journalHIndex !== null && $enriched['authorityJournal']['hIndex'] === null) {
                $enriched['authorityJournal']['hIndex'] = $journalHIndex;
            }
            $doajValue = qpmSemanticQualityToBooleanOrNull($authorityJournalIncoming['isInDoaj'] ?? null);
            if ($doajValue !== null && $enriched['authorityJournal']['isInDoaj'] === null) {
                $enriched['authorityJournal']['isInDoaj'] = $doajValue;
            }
        }
    }
}

if (!function_exists('qpmSemanticQualityMergeSourceCandidates')) {
    /**
     * Ported from mergeSourceCandidates() in semanticReranking.js.
     *
     * @param array<int,array<string,mixed>> $sourceResults
     * @param array<string,mixed> $options guidelinePublisherAllowList
     * @return array{mergedCandidates: array<string,array<string,mixed>>, mergeEventCount: int, rawCandidateCount: int}
     */
    function qpmSemanticQualityMergeSourceCandidates(array $sourceResults, array $options = []): array
    {
        $merged = [];
        $mergeEventCount = 0;
        $rawCandidateCount = 0;

        foreach ($sourceResults as $sourceResult) {
            $candidates = isset($sourceResult['candidates']) && is_array($sourceResult['candidates']) ? $sourceResult['candidates'] : [];
            foreach ($candidates as $candidate) {
                if (!is_array($candidate)) {
                    continue;
                }
                $rawCandidateCount++;
                $pmid = qpmSemanticQualityNormalizePmidValue($candidate['pmid'] ?? '');
                $doi = qpmSemanticQualityNormalizeDoiValue($candidate['doi'] ?? '');
                $openAlexIdRaw = qpmSemanticQualityNormalizeString($candidate['openAlexId'] ?? ($candidate['metadata']['workId'] ?? ''));
                $openAlexIdNormalized = strtolower($openAlexIdRaw);
                $key = $pmid !== '' ? ('pmid:' . $pmid) : ($doi !== '' ? ('doi:' . strtolower($doi)) : ($openAlexIdNormalized !== '' ? ('oa:' . $openAlexIdNormalized) : ''));
                if ($key === '') {
                    continue;
                }

                if (!isset($merged[$key])) {
                    $merged[$key] = [
                        'pmid' => $pmid,
                        'doi' => $doi,
                        'title' => qpmSemanticQualityNormalizeString($candidate['title'] ?? ''),
                        'openAlexId' => $openAlexIdRaw,
                        'sources' => [],
                        'enriched' => qpmSemanticQualityCreateEnrichedRecord(),
                    ];
                } else {
                    $mergeEventCount++;
                }

                $sourceKey = qpmSemanticQualityNormalizeString($candidate['source'] ?? '');
                $candidateRank = qpmSemanticQualityToFiniteNumber($candidate['rank'] ?? null);
                $candidateScore = qpmSemanticQualityToFiniteNumber($candidate['score'] ?? null);
                $previous = $merged[$key]['sources'][$sourceKey] ?? null;

                if ($sourceKey !== '' && (
                    $previous === null
                    || ($candidateRank !== null && ($previous['rank'] === null || $candidateRank < $previous['rank']))
                )) {
                    $merged[$key]['sources'][$sourceKey] = [
                        'rank' => $candidateRank,
                        'score' => $candidateScore,
                    ];
                }

                if ($merged[$key]['pmid'] === '' && $pmid !== '') {
                    $merged[$key]['pmid'] = $pmid;
                }
                if ($merged[$key]['doi'] === '' && $doi !== '') {
                    $merged[$key]['doi'] = $doi;
                }
                if ($merged[$key]['title'] === '' && !empty($candidate['title'])) {
                    $merged[$key]['title'] = qpmSemanticQualityNormalizeString($candidate['title']);
                }
                if ($merged[$key]['openAlexId'] === '' && $openAlexIdRaw !== '') {
                    $merged[$key]['openAlexId'] = $openAlexIdRaw;
                }

                qpmSemanticQualityMergeEnrichedFromCandidate($merged[$key]['enriched'], $candidate);
            }
        }

        $guidelinePublisherAllowList = is_array($options['guidelinePublisherAllowList'] ?? null) ? $options['guidelinePublisherAllowList'] : [];
        $allowListCache = qpmSemanticQualityBuildAllowListLookup($guidelinePublisherAllowList);
        foreach ($merged as $key => $entry) {
            $merged[$key]['pubTypeClassification'] = qpmSemanticQualityClassifyPublicationType($entry, [
                'guidelinePublisherAllowList' => $guidelinePublisherAllowList,
                '__allowListCache' => $allowListCache,
            ]);
        }

        return ['mergedCandidates' => $merged, 'mergeEventCount' => $mergeEventCount, 'rawCandidateCount' => $rawCandidateCount];
    }
}

if (!function_exists('qpmSemanticQualityGetBestRank')) {
    /**
     * @param array<string,mixed> $entry
     * @return float
     */
    function qpmSemanticQualityGetBestRank(array $entry): float
    {
        $best = INF;
        foreach (($entry['sources'] ?? []) as $sourceData) {
            $rank = $sourceData['rank'] ?? null;
            if ($rank !== null && $rank < $best) {
                $best = $rank;
            }
        }
        return $best;
    }
}

if (!function_exists('qpmSemanticQualityGetSourceStats')) {
    /**
     * @param array<int,array<string,mixed>> $sourceResults
     * @return array<string,array{candidateCount:int,minScore:?float,maxScore:?float}>
     */
    function qpmSemanticQualityGetSourceStats(array $sourceResults): array
    {
        $stats = [];
        foreach ($sourceResults as $sourceResult) {
            $sourceKey = qpmSemanticQualityNormalizeString($sourceResult['source'] ?? '');
            if ($sourceKey === '') {
                continue;
            }
            $candidates = isset($sourceResult['candidates']) && is_array($sourceResult['candidates']) ? $sourceResult['candidates'] : [];
            $scores = [];
            foreach ($candidates as $candidate) {
                $score = qpmSemanticQualityToFiniteNumber($candidate['score'] ?? null);
                if ($score !== null) {
                    $scores[] = $score;
                }
            }
            $stats[$sourceKey] = [
                'candidateCount' => count($candidates),
                'minScore' => !empty($scores) ? min($scores) : null,
                'maxScore' => !empty($scores) ? max($scores) : null,
            ];
        }
        return $stats;
    }
}

if (!function_exists('qpmSemanticQualityBuildRankContribution')) {
    /**
     * @param array<string,mixed> $sourceData
     * @param string $sourceKey
     * @param array<string,mixed> $rerankConfig
     * @return array{rank:float,sourceWeight:float,weightedRrf:float}
     */
    function qpmSemanticQualityBuildRankContribution(array $sourceData, string $sourceKey, array $rerankConfig): array
    {
        $sourceWeight = $rerankConfig['sourceWeights'][$sourceKey] ?? $rerankConfig['fallbackSourceWeight'];
        $rankRaw = $sourceData['rank'] ?? null;
        $rank = $rankRaw !== null ? max(1, (float) $rankRaw) : INF;
        $weightedRrf = is_finite($rank)
            ? ($sourceWeight * $rerankConfig['rankScale'] * $rerankConfig['rrfK']) / ($rerankConfig['rrfK'] + $rank)
            : 0.0;
        return ['rank' => $rank, 'sourceWeight' => $sourceWeight, 'weightedRrf' => $weightedRrf];
    }
}

if (!function_exists('qpmSemanticQualityBuildScoreTieBreaker')) {
    /**
     * @param array<string,mixed> $sourceData
     * @param string $sourceKey
     * @param array<string,array<string,mixed>> $sourceStats
     * @param array<string,mixed> $rerankConfig
     * @return ?array{rawScore:float,normalizedScore:float,value:float}
     */
    function qpmSemanticQualityBuildScoreTieBreaker(array $sourceData, string $sourceKey, array $sourceStats, array $rerankConfig): ?array
    {
        $rawScore = qpmSemanticQualityToFiniteNumber($sourceData['score'] ?? null);
        if ($rawScore === null) {
            return null;
        }
        $sourceStat = $sourceStats[$sourceKey] ?? [];
        $minScore = $sourceStat['minScore'] ?? null;
        $maxScore = $sourceStat['maxScore'] ?? null;
        if ($minScore === null || $maxScore === null) {
            return null;
        }
        $normalizedScore = $maxScore > $minScore ? (($rawScore - $minScore) / ($maxScore - $minScore)) : 1.0;
        $sourceWeight = $rerankConfig['sourceWeights'][$sourceKey] ?? $rerankConfig['fallbackSourceWeight'];
        return [
            'rawScore' => $rawScore,
            'normalizedScore' => $normalizedScore,
            'value' => $normalizedScore * $sourceWeight * $rerankConfig['scoreScale'],
        ];
    }
}

if (!function_exists('qpmSemanticQualityNormalizeRecencyCurve')) {
    /**
     * @param mixed $curve
     * @return ?array<int,array{0:float,1:float}>
     */
    function qpmSemanticQualityNormalizeRecencyCurve($curve): ?array
    {
        if (!is_array($curve) || empty($curve)) {
            return null;
        }
        $points = [];
        foreach ($curve as $entry) {
            if (!is_array($entry) || count($entry) < 2) {
                continue;
            }
            $age = qpmSemanticQualityToFiniteNumber($entry[0] ?? null);
            $multiplier = qpmSemanticQualityToFiniteNumber($entry[1] ?? null);
            if ($age === null || $multiplier === null || $age < 0 || $multiplier < 0) {
                continue;
            }
            $points[] = [$age, $multiplier];
        }
        if (empty($points)) {
            return null;
        }
        usort($points, static fn($a, $b) => $a[0] <=> $b[0]);
        return $points;
    }
}

if (!function_exists('qpmSemanticQualityComputeRecencyCurveMultiplier')) {
    /**
     * @param float $age
     * @param array<int,array{0:float,1:float}> $normalizedCurve
     * @return float
     */
    function qpmSemanticQualityComputeRecencyCurveMultiplier(float $age, array $normalizedCurve): float
    {
        if (empty($normalizedCurve)) {
            return 1.0;
        }
        if ($age <= $normalizedCurve[0][0]) {
            return $normalizedCurve[0][1];
        }
        $last = $normalizedCurve[count($normalizedCurve) - 1];
        if ($age >= $last[0]) {
            return $last[1];
        }
        for ($i = 0; $i < count($normalizedCurve) - 1; $i++) {
            [$ageA, $multA] = $normalizedCurve[$i];
            [$ageB, $multB] = $normalizedCurve[$i + 1];
            if ($age >= $ageA && $age <= $ageB) {
                $span = $ageB - $ageA;
                if ($span <= 0) {
                    return $multB;
                }
                $t = ($age - $ageA) / $span;
                return $multA + $t * ($multB - $multA);
            }
        }
        return $last[1];
    }
}

if (!function_exists('qpmSemanticQualityComputeRecencyBonus')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @param int $currentYear
     * @return array{value:float,age:?float,halfLife:?float,curveMultiplier?:?float}
     */
    function qpmSemanticQualityComputeRecencyBonus(array $enriched, array $rerankConfig, int $currentYear): array
    {
        $maxBonus = qpmSemanticQualityToFiniteNumber($rerankConfig['recencyBonusMax'] ?? null);
        $curveEnabled = ($rerankConfig['recencyCurveEnabled'] ?? false) === true;
        $normalizedCurve = $curveEnabled ? qpmSemanticQualityNormalizeRecencyCurve($rerankConfig['recencyCurve'] ?? null) : null;

        if ($curveEnabled && $normalizedCurve !== null) {
            if (!$maxBonus || $maxBonus <= 0) {
                return ['value' => 0.0, 'age' => null, 'halfLife' => null, 'curveMultiplier' => null];
            }
            $year = qpmSemanticQualityToFiniteInt($enriched['publicationYear'] ?? null);
            if ($year === null) {
                return ['value' => 0.0, 'age' => null, 'halfLife' => null, 'curveMultiplier' => null];
            }
            $age = max(0, $currentYear - $year);
            $multiplier = qpmSemanticQualityComputeRecencyCurveMultiplier((float) $age, $normalizedCurve);
            return ['value' => $maxBonus * $multiplier, 'age' => $age, 'halfLife' => null, 'curveMultiplier' => $multiplier];
        }

        $halfLife = qpmSemanticQualityToFiniteNumber($rerankConfig['recencyHalfLifeYears'] ?? null);
        if (!$halfLife || $halfLife <= 0 || !$maxBonus || $maxBonus <= 0) {
            return ['value' => 0.0, 'age' => null, 'halfLife' => $halfLife ?? 0.0];
        }
        $year = qpmSemanticQualityToFiniteInt($enriched['publicationYear'] ?? null);
        if ($year === null) {
            return ['value' => 0.0, 'age' => null, 'halfLife' => $halfLife];
        }
        $age = max(0, $currentYear - $year);
        return ['value' => $maxBonus * exp(-$age / $halfLife), 'age' => $age, 'halfLife' => $halfLife];
    }
}

if (!function_exists('qpmSemanticQualityComputeRecencyMultiplier')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @param int $currentYear
     * @return array{multiplier:float,age:?float,curveMultiplier:?float}
     */
    function qpmSemanticQualityComputeRecencyMultiplier(array $enriched, array $rerankConfig, int $currentYear): array
    {
        $normalizedCurve = qpmSemanticQualityNormalizeRecencyCurve($rerankConfig['recencyMultiplierCurve'] ?? null);
        if ($normalizedCurve === null) {
            return ['multiplier' => 1.0, 'age' => null, 'curveMultiplier' => null];
        }
        $year = qpmSemanticQualityToFiniteInt($enriched['publicationYear'] ?? null);
        if ($year === null) {
            return ['multiplier' => 1.0, 'age' => null, 'curveMultiplier' => null];
        }
        $age = max(0, $currentYear - $year);
        $multiplier = qpmSemanticQualityComputeRecencyCurveMultiplier((float) $age, $normalizedCurve);
        return ['multiplier' => $multiplier, 'age' => $age, 'curveMultiplier' => $multiplier];
    }
}

if (!function_exists('qpmSemanticQualityComputePubTypeBonus')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @return array{value:float,matchedType:string}
     */
    function qpmSemanticQualityComputePubTypeBonus(array $enriched, array $rerankConfig): array
    {
        $weights = is_array($rerankConfig['pubTypeWeights'] ?? null) ? $rerankConfig['pubTypeWeights'] : [];
        $pubTypes = is_array($enriched['pubTypes'] ?? null) ? $enriched['pubTypes'] : [];
        if (empty($pubTypes) || empty($weights)) {
            return ['value' => 0.0, 'matchedType' => ''];
        }
        $normalizedWeightMap = [];
        foreach ($weights as $key => $weight) {
            $numericWeight = qpmSemanticQualityToFiniteNumber($weight);
            if ($numericWeight === null) {
                continue;
            }
            $normalizedWeightMap[qpmSemanticQualityNormalizeLower($key)] = $numericWeight;
        }
        $best = null;
        $matchedType = '';
        foreach ($pubTypes as $type) {
            $normalized = qpmSemanticQualityNormalizeLower($type);
            if ($normalized === '' || !array_key_exists($normalized, $normalizedWeightMap)) {
                continue;
            }
            $weight = $normalizedWeightMap[$normalized];
            if ($best === null || $weight > $best) {
                $best = $weight;
                $matchedType = $normalized;
            }
        }
        return ['value' => $best ?? 0.0, 'matchedType' => $matchedType];
    }
}

if (!function_exists('qpmSemanticQualityComputeOpenAccessBonus')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @return float
     */
    function qpmSemanticQualityComputeOpenAccessBonus(array $enriched, array $rerankConfig): float
    {
        $bonus = qpmSemanticQualityToFiniteNumber($rerankConfig['oaBonus'] ?? null);
        if (!$bonus) {
            return 0.0;
        }
        return ($enriched['isOpenAccess'] ?? null) === true ? $bonus : 0.0;
    }
}

if (!function_exists('qpmSemanticQualityGetCitationImpactWeight')) {
    /**
     * @param array<string,mixed> $rerankConfig
     * @param string $signal
     * @return float
     */
    function qpmSemanticQualityGetCitationImpactWeight(array $rerankConfig, string $signal): float
    {
        $weights = is_array($rerankConfig['citationImpactSignalWeights'] ?? null)
            ? $rerankConfig['citationImpactSignalWeights']
            : qpmSemanticQualityDefaultRerankConfig()['citationImpactSignalWeights'];
        $weight = qpmSemanticQualityToFiniteNumber($weights[$signal] ?? null);
        return $weight !== null && $weight > 0 ? $weight : 0.0;
    }
}

if (!function_exists('qpmSemanticQualityComputeClinicalBonus')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @return array{value:float,reason:string}
     */
    function qpmSemanticQualityComputeClinicalBonus(array $enriched, array $rerankConfig): array
    {
        $bonus = qpmSemanticQualityToFiniteNumber($rerankConfig['clinicalBonus'] ?? null);
        if (!$bonus) {
            return ['value' => 0.0, 'reason' => ''];
        }
        if (($enriched['isClinical'] ?? null) === true) {
            return ['value' => $bonus, 'reason' => 'isClinical'];
        }
        $threshold = qpmSemanticQualityToFiniteNumber($rerankConfig['clinicalCitedByThreshold'] ?? null);
        $citedByClin = qpmSemanticQualityToFiniteInt($enriched['citedByClin'] ?? null);
        if ($threshold !== null && $citedByClin !== null && $citedByClin >= $threshold) {
            return ['value' => $bonus, 'reason' => 'citedByClinThreshold'];
        }
        return ['value' => 0.0, 'reason' => ''];
    }
}

if (!function_exists('qpmSemanticQualityComputeCitationImpactMultiplier')) {
    /**
     * Ported from computeCitationImpactMultiplier() in semanticReranking.js. The
     * fallback cascade order (rcr -> nihPercentile -> fwci -> fieldNormalizedCitationRatio
     * -> influentialCitationCount -> citedByCount -> none) must be preserved exactly.
     *
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @return array{multiplier:float,signal:string,rawValue:mixed}
     */
    function qpmSemanticQualityComputeCitationImpactMultiplier(array $enriched, array $rerankConfig): array
    {
        $clamp = qpmSemanticQualityNormalizeClamp($rerankConfig['citationImpactClamp'] ?? null, [1.0, 1.0]);
        if ($clamp[0] === 1.0 && $clamp[1] === 1.0) {
            return ['multiplier' => 1.0, 'signal' => 'disabled', 'rawValue' => null];
        }

        $rcr = qpmSemanticQualityToFiniteNumber($enriched['rcr'] ?? null);
        $rcrWeight = qpmSemanticQualityGetCitationImpactWeight($rerankConfig, 'rcr');
        if ($rcr !== null && $rcrWeight > 0) {
            $factor = qpmSemanticQualityLog1p(max(0, $rcr));
            return ['multiplier' => qpmSemanticQualityClampTo(1.0 + $factor * $rcrWeight, $clamp), 'signal' => 'rcr', 'rawValue' => $rcr];
        }

        $nihPercentile = qpmSemanticQualityToFiniteNumber($enriched['nihPercentile'] ?? null);
        $nihWeight = qpmSemanticQualityGetCitationImpactWeight($rerankConfig, 'nihPercentile');
        if ($nihPercentile !== null && $nihWeight > 0) {
            $percentileFactor = qpmSemanticQualityClampTo($nihPercentile / 100, [0.0, 1.0]);
            return ['multiplier' => qpmSemanticQualityClampTo(1.0 + $percentileFactor * $nihWeight, $clamp), 'signal' => 'nihPercentile', 'rawValue' => $nihPercentile];
        }

        $fwci = qpmSemanticQualityToFiniteNumber($enriched['fwci'] ?? null);
        $fwciWeight = qpmSemanticQualityGetCitationImpactWeight($rerankConfig, 'fwci');
        if ($fwci !== null && $fwciWeight > 0) {
            $factor = qpmSemanticQualityLog1p(max(0, $fwci));
            return ['multiplier' => qpmSemanticQualityClampTo(1.0 + $factor * $fwciWeight, $clamp), 'signal' => 'fwci', 'rawValue' => $fwci];
        }

        $citedByCount = qpmSemanticQualityToFiniteInt($enriched['citedByCount'] ?? null);
        $fieldCitationRate = qpmSemanticQualityToFiniteNumber($enriched['fieldCitationRate'] ?? null);
        $fieldNormalizedWeight = qpmSemanticQualityGetCitationImpactWeight($rerankConfig, 'fieldNormalizedCitationRatio');
        if ($citedByCount !== null && $fieldCitationRate !== null && $fieldCitationRate > 0 && $fieldNormalizedWeight > 0) {
            $ratio = $citedByCount / $fieldCitationRate;
            $factor = qpmSemanticQualityLog1p(max(0, $ratio));
            return ['multiplier' => qpmSemanticQualityClampTo(1.0 + $factor * $fieldNormalizedWeight, $clamp), 'signal' => 'fieldNormalizedCitationRatio', 'rawValue' => round($ratio, 4)];
        }

        $influential = qpmSemanticQualityToFiniteInt($enriched['influentialCitationCount'] ?? null);
        $influentialWeight = qpmSemanticQualityGetCitationImpactWeight($rerankConfig, 'influentialCitationCount');
        if ($influential !== null && $influentialWeight > 0) {
            $factor = qpmSemanticQualityLog1p(max(0, $influential)) / log(10);
            return ['multiplier' => qpmSemanticQualityClampTo(1.0 + $factor * $influentialWeight, $clamp), 'signal' => 'influentialCitationCount', 'rawValue' => $influential];
        }

        $citedByWeight = qpmSemanticQualityGetCitationImpactWeight($rerankConfig, 'citedByCount');
        if ($citedByCount !== null && $citedByWeight > 0) {
            $factor = qpmSemanticQualityLog1p(max(0, $citedByCount)) / log(10);
            return ['multiplier' => qpmSemanticQualityClampTo(1.0 + $factor * $citedByWeight, $clamp), 'signal' => 'citedByCount', 'rawValue' => $citedByCount];
        }

        return ['multiplier' => 1.0, 'signal' => 'none', 'rawValue' => null];
    }
}

if (!function_exists('qpmSemanticQualityComputeAuthorityMultiplier')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @return array{multiplier:float,components:array<string,mixed>}
     */
    function qpmSemanticQualityComputeAuthorityMultiplier(array $enriched, array $rerankConfig): array
    {
        $clamp = qpmSemanticQualityNormalizeClamp($rerankConfig['authorityClamp'] ?? null, [1.0, 1.0]);
        if ($clamp[0] === 1.0 && $clamp[1] === 1.0) {
            return ['multiplier' => 1.0, 'components' => []];
        }
        $authorHIndex = qpmSemanticQualityToFiniteInt($enriched['authorityAuthors']['maxHIndex'] ?? null);
        $journalMean = qpmSemanticQualityToFiniteNumber($enriched['authorityJournal']['meanCitedness'] ?? null);
        if ($authorHIndex === null && $journalMean === null) {
            return ['multiplier' => 1.0, 'components' => []];
        }
        $authorFactor = $authorHIndex !== null ? (qpmSemanticQualityLog1p(max(0, $authorHIndex)) / log(10)) * 0.04 : 0.0;
        $journalFactor = $journalMean !== null ? qpmSemanticQualityLog1p(max(0, $journalMean)) * 0.04 : 0.0;
        return [
            'multiplier' => qpmSemanticQualityClampTo(1.0 + $authorFactor + $journalFactor, $clamp),
            'components' => ['authorHIndex' => $authorHIndex, 'journalMean' => $journalMean],
        ];
    }
}

if (!function_exists('qpmSemanticQualityTokenizeIntentPhrase')) {
    /**
     * @param mixed $text
     * @return array<int,string>
     */
    function qpmSemanticQualityTokenizeIntentPhrase($text): array
    {
        $normalized = strtolower((string) ($text ?? ''));
        $normalized = (string) preg_replace('/[^a-z0-9\s-]/', ' ', $normalized);
        $parts = preg_split('/\s+/', $normalized) ?: [];
        $tokens = [];
        foreach ($parts as $part) {
            $trimmed = trim($part);
            if (strlen($trimmed) >= 3) {
                $tokens[] = $trimmed;
            }
        }
        return $tokens;
    }
}

if (!function_exists('qpmSemanticQualityBuildIntentTokenSet')) {
    /**
     * @param mixed $queryIntent
     * @return array<string,bool> Set emulation (keys are tokens)
     */
    function qpmSemanticQualityBuildIntentTokenSet($queryIntent): array
    {
        $tokenSet = [];
        if (!is_array($queryIntent)) {
            return $tokenSet;
        }
        $sources = [
            $queryIntent['topicsEnglish'] ?? null,
            $queryIntent['topicIntents'] ?? null,
            $queryIntent['softHints'] ?? null,
            $queryIntent['rawPhrases'] ?? null,
        ];
        foreach ($sources as $source) {
            if (!is_array($source)) {
                continue;
            }
            foreach ($source as $phrase) {
                foreach (qpmSemanticQualityTokenizeIntentPhrase($phrase) as $token) {
                    $tokenSet[$token] = true;
                }
            }
        }
        return $tokenSet;
    }
}

if (!function_exists('qpmSemanticQualityComputeTopicOverlapBonus')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @param array<string,bool> $intentTokens
     * @return array{value:float,matchRatio:float,matches:array<int,string>}
     */
    function qpmSemanticQualityComputeTopicOverlapBonus(array $enriched, array $rerankConfig, array $intentTokens): array
    {
        $bonus = qpmSemanticQualityToFiniteNumber($rerankConfig['topicOverlapBonus'] ?? null);
        if (!$bonus || empty($intentTokens)) {
            return ['value' => 0.0, 'matchRatio' => 0.0, 'matches' => []];
        }

        $candidateTokens = [];
        $topicLabel = qpmSemanticQualityNormalizeString($enriched['primaryTopicDisplayName'] ?? '');
        if ($topicLabel !== '') {
            foreach (qpmSemanticQualityTokenizeIntentPhrase($topicLabel) as $token) {
                $candidateTokens[$token] = true;
            }
        }
        $s2Fields = is_array($enriched['s2FieldsOfStudy'] ?? null) ? $enriched['s2FieldsOfStudy'] : [];
        foreach ($s2Fields as $field) {
            foreach (qpmSemanticQualityTokenizeIntentPhrase($field) as $token) {
                $candidateTokens[$token] = true;
            }
        }

        if (empty($candidateTokens)) {
            return ['value' => 0.0, 'matchRatio' => 0.0, 'matches' => []];
        }

        $matches = [];
        foreach (array_keys($candidateTokens) as $token) {
            if (isset($intentTokens[$token])) {
                $matches[] = $token;
            }
        }
        if (empty($matches)) {
            return ['value' => 0.0, 'matchRatio' => 0.0, 'matches' => []];
        }

        $matchRatio = min(1.0, count($matches) / count($intentTokens));
        return ['value' => $bonus * $matchRatio, 'matchRatio' => $matchRatio, 'matches' => $matches];
    }
}

if (!function_exists('qpmSemanticQualityComputeRetractionImpact')) {
    /**
     * @param array<string,mixed> $enriched
     * @param array<string,mixed> $rerankConfig
     * @return array{action:string,multiplier:float,retracted:bool}
     */
    function qpmSemanticQualityComputeRetractionImpact(array $enriched, array $rerankConfig): array
    {
        $action = strtolower((string) ($rerankConfig['retractionAction'] ?? 'none'));
        $isRetracted = ($enriched['isRetracted'] ?? null) === true;
        if (!$isRetracted) {
            return ['action' => 'none', 'multiplier' => 1.0, 'retracted' => false];
        }
        if ($action === 'filter') {
            return ['action' => 'filter', 'multiplier' => 1.0, 'retracted' => true];
        }
        if ($action === 'penalty') {
            $penalty = qpmSemanticQualityToFiniteNumber($rerankConfig['retractionPenalty'] ?? null);
            $multiplier = ($penalty !== null && $penalty >= 0) ? $penalty : 1.0;
            return ['action' => 'penalty', 'multiplier' => $multiplier, 'retracted' => true];
        }
        return ['action' => 'none', 'multiplier' => 1.0, 'retracted' => true];
    }
}

if (!function_exists('qpmSemanticQualityComputeDataQualityMultiplier')) {
    /**
     * @param array<string,mixed> $entry
     * @param array<string,mixed> $rerankConfig
     * @return array{multiplier:float,applied:array<string,float>,abstractLength:?int}
     */
    function qpmSemanticQualityComputeDataQualityMultiplier(array $entry, array $rerankConfig): array
    {
        $penalties = is_array($rerankConfig['dataQualityPenalties'] ?? null) ? $rerankConfig['dataQualityPenalties'] : [];
        $thresholds = is_array($rerankConfig['abstractMinLength'] ?? null) ? $rerankConfig['abstractMinLength'] : ['short' => 100, 'veryShort' => 250];

        $missingAbstractPenalty = qpmSemanticQualityToFiniteNumber($penalties['missingAbstract'] ?? null);
        $shortAbstractPenalty = qpmSemanticQualityToFiniteNumber($penalties['shortAbstract'] ?? null);
        $veryShortAbstractPenalty = qpmSemanticQualityToFiniteNumber($penalties['veryShortAbstract'] ?? null);
        $missingAuthorPenalty = qpmSemanticQualityToFiniteNumber($penalties['missingAuthor'] ?? null);
        $missingYearPenalty = qpmSemanticQualityToFiniteNumber($penalties['missingYear'] ?? null);

        $applied = [];
        $multiplier = 1.0;

        $enriched = is_array($entry['enriched'] ?? null) ? $entry['enriched'] : [];
        $abstractLength = qpmSemanticQualityToFiniteInt($enriched['abstractLength'] ?? null);
        $shortThreshold = qpmSemanticQualityToFiniteInt($thresholds['short'] ?? null) ?? 100;
        $veryShortThreshold = qpmSemanticQualityToFiniteInt($thresholds['veryShort'] ?? null) ?? 250;

        if ($abstractLength === null || $abstractLength === 0) {
            if ($missingAbstractPenalty !== null && $missingAbstractPenalty !== 1.0) {
                $multiplier *= $missingAbstractPenalty;
                $applied['missingAbstract'] = $missingAbstractPenalty;
            }
        } elseif ($abstractLength < $shortThreshold) {
            if ($shortAbstractPenalty !== null && $shortAbstractPenalty !== 1.0) {
                $multiplier *= $shortAbstractPenalty;
                $applied['shortAbstract'] = $shortAbstractPenalty;
            }
        } elseif ($abstractLength < $veryShortThreshold) {
            if ($veryShortAbstractPenalty !== null && $veryShortAbstractPenalty !== 1.0) {
                $multiplier *= $veryShortAbstractPenalty;
                $applied['veryShortAbstract'] = $veryShortAbstractPenalty;
            }
        }

        if (empty($enriched['hasAuthor'])) {
            if ($missingAuthorPenalty !== null && $missingAuthorPenalty !== 1.0) {
                $multiplier *= $missingAuthorPenalty;
                $applied['missingAuthor'] = $missingAuthorPenalty;
            }
        }

        if (empty($enriched['publicationYear'])) {
            if ($missingYearPenalty !== null && $missingYearPenalty !== 1.0) {
                $multiplier *= $missingYearPenalty;
                $applied['missingYear'] = $missingYearPenalty;
            }
        }

        return ['multiplier' => $multiplier, 'applied' => $applied, 'abstractLength' => $abstractLength];
    }
}

if (!function_exists('qpmSemanticQualityBuildScoredEntry')) {
    /**
     * Ported from buildDebugEntry() in semanticReranking.js (name kept close to
     * source for cross-reference, though this port is used in production, not
     * just debug output).
     *
     * @param array<string,mixed> $entry
     * @param array<string,mixed> $rerankConfig
     * @param array<string,array<string,mixed>> $sourceStats
     * @param string $mode 'single' or 'multi'
     * @param int $currentYear
     * @param array<string,bool> $intentTokens
     * @return array<string,mixed>
     */
    function qpmSemanticQualityBuildScoredEntry(array $entry, array $rerankConfig, array $sourceStats, string $mode, int $currentYear, array $intentTokens): array
    {
        $baseScore = 0.0;
        $scoreTieBreaker = 0.0;
        $pmidBonus = 0.0;
        $overlapBonus = 0.0;
        $rrfScore = 0.0;
        $sourceBreakdown = [];

        if (!empty($entry['pmid'])) {
            $pmidBonus = (float) $rerankConfig['pmidBonus'];
            $baseScore += $pmidBonus;
        }

        foreach (($entry['sources'] ?? []) as $sourceKey => $sourceData) {
            $rankInfo = qpmSemanticQualityBuildRankContribution($sourceData, (string) $sourceKey, $rerankConfig);
            $rrfScore += $rankInfo['weightedRrf'];
            $baseScore += $rankInfo['weightedRrf'];

            $sourceEntry = [
                'source' => $sourceKey,
                'rank' => $rankInfo['rank'],
                'weight' => $rankInfo['sourceWeight'],
                'weightedRrf' => round($rankInfo['weightedRrf'], 4),
                'rawScore' => null,
                'normalizedScore' => null,
                'scoreTieBreakerValue' => 0.0,
            ];

            $scoreInfo = qpmSemanticQualityBuildScoreTieBreaker($sourceData, (string) $sourceKey, $sourceStats, $rerankConfig);
            if ($scoreInfo !== null) {
                $scoreTieBreaker += $scoreInfo['value'];
                $sourceEntry['rawScore'] = $scoreInfo['rawScore'];
                $sourceEntry['normalizedScore'] = round($scoreInfo['normalizedScore'], 4);
                $sourceEntry['scoreTieBreakerValue'] = round($scoreInfo['value'], 4);
            }

            $sourceBreakdown[] = $sourceEntry;
        }

        if ($mode === 'multi' && count($entry['sources'] ?? []) > 1) {
            $overlapBonus = (count($entry['sources']) - 1) * (float) $rerankConfig['overlapBonusPerExtraSource'];
            $baseScore += $overlapBonus;
        }

        $enriched = is_array($entry['enriched'] ?? null) ? $entry['enriched'] : qpmSemanticQualityCreateEnrichedRecord();

        $recencyInfo = qpmSemanticQualityComputeRecencyBonus($enriched, $rerankConfig, $currentYear);
        $pubTypeInfo = qpmSemanticQualityComputePubTypeBonus($enriched, $rerankConfig);
        $tierBonusInfo = qpmSemanticQualityComputePubTypeTierBonus(is_array($entry['pubTypeClassification'] ?? null) ? $entry['pubTypeClassification'] : [], $rerankConfig);
        $oaBonus = qpmSemanticQualityComputeOpenAccessBonus($enriched, $rerankConfig);
        $clinicalInfo = qpmSemanticQualityComputeClinicalBonus($enriched, $rerankConfig);
        $topicOverlapInfo = qpmSemanticQualityComputeTopicOverlapBonus($enriched, $rerankConfig, $intentTokens);
        $topicOverlapBonusValue = $topicOverlapInfo['value'];

        // translationPotentialBonus intentionally omitted: it is not consumed by
        // any currently-configured rerank profile (translationPotentialBonusMax
        // defaults to 0 everywhere), so its absence does not change output for
        // any real configuration. If it is ever activated in QPM_RERANK_CONFIG,
        // this port must be extended to match before parity can be re-certified.
        $additiveQualityBonus = $recencyInfo['value'] + $pubTypeInfo['value'] + $tierBonusInfo['value']
            + $oaBonus + $clinicalInfo['value'] + $topicOverlapBonusValue;

        $citationImpactInfo = qpmSemanticQualityComputeCitationImpactMultiplier($enriched, $rerankConfig);
        $authorityInfo = qpmSemanticQualityComputeAuthorityMultiplier($enriched, $rerankConfig);
        $recencyMultiplierInfo = qpmSemanticQualityComputeRecencyMultiplier($enriched, $rerankConfig, $currentYear);
        $retractionInfo = qpmSemanticQualityComputeRetractionImpact($enriched, $rerankConfig);
        $dataQualityInfo = qpmSemanticQualityComputeDataQualityMultiplier($entry, $rerankConfig);

        $qualityMultiplier = $citationImpactInfo['multiplier'] * $authorityInfo['multiplier']
            * $recencyMultiplierInfo['multiplier'] * $retractionInfo['multiplier'] * $dataQualityInfo['multiplier'];
        $combinedScore = ($baseScore + $additiveQualityBonus) * $qualityMultiplier;

        $result = $entry;
        $result['sources'] = array_keys($entry['sources'] ?? []);
        $result['combinedScore'] = round($combinedScore, 4);
        $result['scoreTieBreaker'] = round($scoreTieBreaker, 4);
        $result['bestRank'] = is_finite(qpmSemanticQualityGetBestRank($entry)) ? qpmSemanticQualityGetBestRank($entry) : 0;
        $result['sourceCount'] = count($entry['sources'] ?? []);
        $result['filtered'] = $retractionInfo['action'] === 'filter';
        $result['filteredReason'] = $retractionInfo['action'] === 'filter' ? 'retraction' : '';
        $result['scoreBreakdown'] = [
            'rrfScore' => round($rrfScore, 4),
            'overlapBonus' => round($overlapBonus, 4),
            'pmidBonus' => round($pmidBonus, 4),
            'scoreTieBreaker' => round($scoreTieBreaker, 4),
            'baseScore' => round($baseScore, 4),
            'additiveQualityBonus' => round($additiveQualityBonus, 4),
            'recencyBonus' => round($recencyInfo['value'], 4),
            'pubTypeBonus' => round($pubTypeInfo['value'], 4),
            'pubTypeTierBonus' => round($tierBonusInfo['value'], 4),
            'pubTypeTier' => $tierBonusInfo['tier'] ?: (($entry['pubTypeClassification']['tier'] ?? '') ?: ''),
            'pubTypeConfidence' => $tierBonusInfo['confidence'] ?: (($entry['pubTypeClassification']['confidence'] ?? '') ?: ''),
            'oaBonus' => round($oaBonus, 4),
            'clinicalBonus' => round($clinicalInfo['value'], 4),
            'topicOverlapBonus' => round($topicOverlapBonusValue, 4),
            'citationImpactMultiplier' => round($citationImpactInfo['multiplier'], 4),
            'authorityMultiplier' => round($authorityInfo['multiplier'], 4),
            'recencyMultiplier' => round($recencyMultiplierInfo['multiplier'], 4),
            'retractionMultiplier' => round($retractionInfo['multiplier'], 4),
            'dataQualityMultiplier' => round($dataQualityInfo['multiplier'], 4),
            'qualityMultiplier' => round($qualityMultiplier, 4),
        ];
        $result['sourceBreakdown'] = $sourceBreakdown;

        return $result;
    }
}

if (!function_exists('qpmSemanticQualityDedupeStringValues')) {
    /**
     * @param array<int,string> $values
     * @param callable $normalizer
     * @return array<int,string>
     */
    function qpmSemanticQualityDedupeStringValues(array $values, callable $normalizer): array
    {
        $seen = [];
        $out = [];
        foreach ($values as $value) {
            $normalized = $normalizer($value);
            if ($normalized === '' || isset($seen[strtolower($normalized)])) {
                continue;
            }
            $seen[strtolower($normalized)] = true;
            $out[] = $normalized;
        }
        return $out;
    }
}

if (!function_exists('qpmSemanticQualityRerankCandidates')) {
    /**
     * Ported from rerankSemanticCandidates() in semanticReranking.js. This is the
     * main entry point: merges candidates from all sources, classifies, scores
     * with the full hybrid quality-signal formula, filters (titleless / excluded
     * tier / retraction-filter), and sorts.
     *
     * @param array<int,array<string,mixed>> $sourceResults
     * @param array<string,mixed> $runtimeRerankConfig
     * @param array<string,mixed> $options ['queryIntent' => ...]
     * @return array{candidates: array<int,array<string,mixed>>, filteredCandidates: array<int,array<string,mixed>>, pmids: array<int,string>, dois: array<int,string>, rerankMode: string, diagnostics: array<string,mixed>}
     */
    function qpmSemanticQualityRerankCandidates(array $sourceResults, array $runtimeRerankConfig = [], array $options = []): array
    {
        $activeSourceResults = array_values(array_filter($sourceResults, static function ($sourceResult) {
            return isset($sourceResult['candidates']) && is_array($sourceResult['candidates']) && count($sourceResult['candidates']) > 0;
        }));
        $rerankConfig = qpmSemanticQualityResolveRerankConfig($runtimeRerankConfig);
        $sourceStats = qpmSemanticQualityGetSourceStats($activeSourceResults);
        $rerankMode = count($activeSourceResults) <= 1 ? 'single' : 'multi';
        $currentYear = (int) date('Y');
        $intentTokens = qpmSemanticQualityBuildIntentTokenSet($options['queryIntent'] ?? null);

        $mergeResult = qpmSemanticQualityMergeSourceCandidates($activeSourceResults, [
            'guidelinePublisherAllowList' => $rerankConfig['guidelinePublisherAllowList'],
        ]);

        $entries = array_values($mergeResult['mergedCandidates']);
        $titlelessCount = 0;
        $entriesWithTitle = [];
        foreach ($entries as $entry) {
            if (qpmSemanticQualityNormalizeString($entry['title'] ?? '') === '') {
                $titlelessCount++;
            } else {
                $entriesWithTitle[] = $entry;
            }
        }

        $pubTypeTiersConfig = is_array($rerankConfig['pubTypeTiers'] ?? null) ? $rerankConfig['pubTypeTiers'] : [];
        $pubTypeTiersActive = count($pubTypeTiersConfig) > 0;
        $excludedByTier = [];
        $excludedCount = 0;
        $retainedEntries = [];
        foreach ($entriesWithTitle as $entry) {
            if ($pubTypeTiersActive && qpmSemanticQualityIsExcludedClassification($entry['pubTypeClassification'] ?? [])) {
                $subtype = (string) ($entry['pubTypeClassification']['subtype'] ?? 'unknown');
                $excludedByTier[$subtype] = ($excludedByTier[$subtype] ?? 0) + 1;
                $excludedCount++;
                continue;
            }
            $retainedEntries[] = $entry;
        }

        $builtCandidates = [];
        foreach ($retainedEntries as $entry) {
            $builtCandidates[] = qpmSemanticQualityBuildScoredEntry($entry, $rerankConfig, $sourceStats, $rerankMode, $currentYear, $intentTokens);
        }

        $filteredCandidates = array_values(array_filter($builtCandidates, static fn($c) => $c['filtered'] === true));
        $rankedCandidates = array_values(array_filter($builtCandidates, static fn($c) => $c['filtered'] !== true));

        if ($rerankMode === 'single') {
            usort($rankedCandidates, static function ($a, $b) {
                if ($a['bestRank'] !== $b['bestRank']) {
                    return $a['bestRank'] <=> $b['bestRank'];
                }
                if ($b['scoreTieBreaker'] !== $a['scoreTieBreaker']) {
                    return $b['scoreTieBreaker'] <=> $a['scoreTieBreaker'];
                }
                return 0;
            });
        } else {
            usort($rankedCandidates, static function ($a, $b) {
                if ($b['combinedScore'] !== $a['combinedScore']) {
                    return $b['combinedScore'] <=> $a['combinedScore'];
                }
                if ($b['scoreTieBreaker'] !== $a['scoreTieBreaker']) {
                    return $b['scoreTieBreaker'] <=> $a['scoreTieBreaker'];
                }
                if ($a['bestRank'] !== $b['bestRank']) {
                    return $a['bestRank'] <=> $b['bestRank'];
                }
                return 0;
            });
        }

        return [
            'candidates' => $rankedCandidates,
            'filteredCandidates' => $filteredCandidates,
            'pmids' => qpmSemanticQualityDedupeStringValues(array_column($rankedCandidates, 'pmid'), 'qpmSemanticQualityNormalizePmidValue'),
            'dois' => qpmSemanticQualityDedupeStringValues(array_column($rankedCandidates, 'doi'), 'qpmSemanticQualityNormalizeDoiValue'),
            'rerankMode' => $rerankMode,
            'diagnostics' => [
                'mergeSummary' => [
                    'rawCandidateCount' => $mergeResult['rawCandidateCount'],
                    'mergedCandidateCount' => count($rankedCandidates),
                    'duplicateCount' => $mergeResult['mergeEventCount'],
                    'filteredCount' => count($filteredCandidates),
                    'excludedByTierCount' => $excludedCount,
                    'titlelessDroppedCount' => $titlelessCount,
                ],
            ],
        ];
    }
}
