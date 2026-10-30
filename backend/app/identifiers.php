<?php
/**
 * Shared PMID/DOI normalizers (Fase 3).
 */

if (!function_exists('muginNormalizePmidValue')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginNormalizePmidValue($value): string
    {
        $pmid = trim((string) $value);
        return preg_match('/^[0-9]+$/', $pmid) === 1 ? $pmid : '';
    }
}

if (!function_exists('muginNormalizeOpenAlexPmidValue')) {
    /**
     * OpenAlex returns ids.pmid as a full URL (e.g. https://pubmed.ncbi.nlm.nih.gov/12345).
     * muginNormalizePmidValue() requires the whole string to be digits and would drop these.
     *
     * @param mixed $value
     * @return string
     */
    function muginNormalizeOpenAlexPmidValue($value): string
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return '';
        }
        return preg_match('/(\d+)/', $raw, $matches) === 1 ? $matches[1] : '';
    }
}

if (!function_exists('muginNormalizeDoiValue')) {
    /**
     * @param mixed $value
     * @return string
     */
    function muginNormalizeDoiValue($value): string
    {
        $normalized = trim((string) $value);
        if ($normalized === '') {
            return '';
        }
        $normalized = preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $normalized);
        $normalized = preg_replace('~^doi:\s*~i', '', (string) $normalized);
        return trim((string) $normalized);
    }
}

if (!function_exists('muginIsPlausibleDoiValue')) {
    function muginIsPlausibleDoiValue($value): bool
    {
        $doi = muginNormalizeDoiValue($value);
        return preg_match('~^10\.\d{4,9}/\S+$~', $doi) === 1;
    }
}

if (!function_exists('muginParseSelectedIdentifierToken')) {
    /**
     * Parses `pmid:12345678`, `doi:10.1234/abc`, or a bare numeric PMID.
     *
     * @param mixed $value
     * @return array{type:string,value:string}
     */
    function muginParseSelectedIdentifierToken($value): array
    {
        if (is_array($value)) {
            $type = strtolower(trim((string) ($value['type'] ?? '')));
            $raw = trim((string) ($value['value'] ?? ''));
            if ($type === 'pmid') {
                $pmid = muginNormalizePmidValue($raw);
                return $pmid !== '' ? ['type' => 'pmid', 'value' => $pmid] : [];
            }
            if ($type === 'doi') {
                $doi = muginNormalizeDoiValue($raw);
                return muginIsPlausibleDoiValue($doi) ? ['type' => 'doi', 'value' => $doi] : [];
            }
            return [];
        }

        $raw = trim((string) $value);
        if ($raw === '') {
            return [];
        }
        if (preg_match('/^pmid:\s*(.+)$/i', $raw, $match) === 1) {
            $pmid = muginNormalizePmidValue($match[1]);
            return $pmid !== '' ? ['type' => 'pmid', 'value' => $pmid] : [];
        }
        if (preg_match('/^doi:\s*(.+)$/i', $raw, $match) === 1) {
            $doi = muginNormalizeDoiValue($match[1]);
            return muginIsPlausibleDoiValue($doi) ? ['type' => 'doi', 'value' => $doi] : [];
        }
        $pmid = muginNormalizePmidValue($raw);
        if ($pmid !== '') {
            return ['type' => 'pmid', 'value' => $pmid];
        }
        $doi = muginNormalizeDoiValue($raw);
        return muginIsPlausibleDoiValue($doi) ? ['type' => 'doi', 'value' => $doi] : [];
    }
}

if (!function_exists('muginCollectSelectedIdentifiers')) {
    /**
     * @param array<int,mixed> $tokens
     * @return array<int,array{type:string,value:string}>
     */
    function muginCollectSelectedIdentifiers(array $tokens): array
    {
        $output = [];
        $seen = [];
        foreach ($tokens as $token) {
            $parsed = muginParseSelectedIdentifierToken($token);
            if ($parsed === []) {
                continue;
            }
            $key = $parsed['type'] . ':' . strtolower($parsed['value']);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $output[] = $parsed;
        }
        return $output;
    }
}

if (!function_exists('muginSplitSelectedIdentifiers')) {
    /**
     * @param array<int,mixed> $tokens
     * @return array{identifiers: array<int,array{type:string,value:string}>, pmids: array<int,string>, dois: array<int,string>}
     */
    function muginSplitSelectedIdentifiers(array $tokens): array
    {
        $identifiers = muginCollectSelectedIdentifiers($tokens);
        $pmids = [];
        $dois = [];
        foreach ($identifiers as $entry) {
            if ($entry['type'] === 'pmid') {
                $pmids[] = $entry['value'];
            } elseif ($entry['type'] === 'doi') {
                $dois[] = $entry['value'];
            }
        }
        return [
            'identifiers' => $identifiers,
            'pmids' => $pmids,
            'dois' => $dois,
        ];
    }
}

if (!function_exists('muginSanitizeSemanticScholarSearchQuery')) {
    /**
     * /paper/search matches every term against the title and abstract and
     * returns nothing for a hyphenated term. A full sentence therefore often
     * matches nothing. Keep at most six content words, with punctuation and
     * function words removed.
     *
     * @param string $query
     * @return string
     */
    function muginSanitizeSemanticScholarSearchQuery(string $query): string
    {
        $spaced = preg_replace('/[\x{002D}\x{2010}-\x{2014}\x{2212}]+/u', ' ', $query);
        if (!is_string($spaced)) {
            $spaced = str_replace('-', ' ', $query);
        }
        $worded = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $spaced);
        if (!is_string($worded)) {
            $worded = $spaced;
        }
        $parts = preg_split('/\s+/u', trim($worded), -1, PREG_SPLIT_NO_EMPTY);
        if (!is_array($parts) || $parts === []) {
            return trim($worded);
        }
        $stopwords = array_flip([
            'a', 'an', 'the', 'of', 'on', 'and', 'or', 'in', 'to', 'for', 'with', 'by', 'from', 'as', 'at',
            'into', 'over', 'than', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'it', 'its', 'their', 'they', 'them', 'how', 'what', 'which', 'who', 'whom', 'whose',
            'why', 'when', 'where', 'does', 'do', 'did', 'can', 'could', 'should', 'would', 'may', 'might',
            'will', 'about', 'between', 'among', 'across', 'through', 'during', 'without', 'within', 'upon',
            'per', 'via', 'versus', 'vs', 'not', 'no', 'nor', 'but', 'if', 'then', 'so', 'such', 'also',
            'both', 'each', 'other', 'another', 'more', 'most', 'very', 'just', 'only', 'same', 'after',
            'before', 'above', 'below', 'under', 'out', 'up', 'down', 'off', 'all', 'any', 'some', 'own',
            'effect', 'effects', 'impact', 'impacts',
            'og', 'på', 'paa', 'af', 'til', 'med', 'en', 'et', 'den', 'det', 'der', 'som', 'at', 'er', 'end',
            'om', 'eller', 'fra', 'ved', 'ikke', 'samt', 'mellem', 'mod',
        ]);
        $kept = [];
        $seen = [];
        foreach ($parts as $part) {
            $key = function_exists('mb_strtolower') ? mb_strtolower($part, 'UTF-8') : strtolower($part);
            $length = function_exists('mb_strlen') ? mb_strlen($key, 'UTF-8') : strlen($key);
            if ($key === '' || isset($stopwords[$key]) || isset($seen[$key])) {
                continue;
            }
            if ($length < 2 && !ctype_digit($key)) {
                continue;
            }
            $seen[$key] = true;
            $kept[] = $part;
            if (count($kept) >= 6) {
                break;
            }
        }
        if ($kept === []) {
            $collapsed = preg_replace('/\s+/u', ' ', $worded);
            return trim(is_string($collapsed) ? $collapsed : $worded);
        }
        return implode(' ', $kept);
    }
}
