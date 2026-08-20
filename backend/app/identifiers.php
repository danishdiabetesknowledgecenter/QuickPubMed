<?php
/**
 * Shared PMID/DOI normalizers (Fase 3).
 *
 * Call-sites may keep public-search-prefixed wrappers; those should delegate here.
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

if (!function_exists('muginFormatSelectedIdentifierToken')) {
    function muginFormatSelectedIdentifierToken(string $type, string $value): string
    {
        if ($type === 'pmid' && $value !== '') {
            return 'pmid:' . $value;
        }
        if ($type === 'doi' && $value !== '') {
            return 'doi:' . $value;
        }
        return '';
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
