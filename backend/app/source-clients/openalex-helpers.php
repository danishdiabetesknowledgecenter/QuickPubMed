<?php
/**
 * Shared OpenAlex helpers used by both proxy endpoints and the unified public-search path.
 */

require_once dirname(__DIR__) . '/file-cache.php';

if (!function_exists('muginNormalizeOpenAlexLookupDoi')) {
    /**
     * @param mixed $value
     */
    function muginNormalizeOpenAlexLookupDoi($value): string
    {
        $doi = trim((string) $value);
        if ($doi === '') {
            return '';
        }
        $doi = preg_replace('~^https?://(dx\.)?doi\.org/~i', '', $doi);
        $doi = preg_replace('~^doi:\s*~i', '', (string) $doi);
        return trim((string) $doi);
    }
}

if (!function_exists('muginNormalizeOpenAlexLookupId')) {
    /**
     * Normalize an OpenAlex work ID to the short form (e.g. W2088009199).
     *
     * @param mixed $value
     */
    function muginNormalizeOpenAlexLookupId($value): string
    {
        $id = trim((string) $value);
        if ($id === '') {
            return '';
        }
        $id = preg_replace('~^https?://openalex\.org/~i', '', $id);
        $id = trim((string) $id);
        if (preg_match('/^W[0-9]+$/i', $id)) {
            return strtoupper($id);
        }
        return '';
    }
}

if (!function_exists('muginNormalizeOpenAlexCachedWork')) {
    /**
     * Shared openalex-work cache may store either a raw OpenAlex work or the
     * OpenAlexWorkLookup wrapper `{doi, openAlexId, work}`.
     *
     * @param mixed $value
     * @return ?array<string,mixed>
     */
    function muginNormalizeOpenAlexCachedWork($value): ?array
    {
        if (!is_array($value)) {
            return null;
        }
        if (isset($value['work']) && is_array($value['work'])) {
            return $value['work'];
        }
        if (isset($value['id']) || isset($value['doi']) || isset($value['display_name'])) {
            return $value;
        }
        return null;
    }
}

if (!function_exists('muginNormalizeOpenAlexWorkLookupEntry')) {
    /**
     * @param mixed $value
     * @return ?array{doi:string,openAlexId:string,work:array<string,mixed>}
     */
    function muginNormalizeOpenAlexWorkLookupEntry($value): ?array
    {
        $work = muginNormalizeOpenAlexCachedWork($value);
        if ($work === null) {
            return null;
        }
        $doiSource = is_array($value) ? ($value['doi'] ?? ($work['doi'] ?? ($work['ids']['doi'] ?? ''))) : '';
        $openAlexIdSource = is_array($value)
            ? ($value['openAlexId'] ?? ($work['id'] ?? ''))
            : '';
        return [
            'doi' => muginNormalizeOpenAlexLookupDoi($doiSource),
            'openAlexId' => trim((string) $openAlexIdSource),
            'work' => $work,
        ];
    }
}

if (!function_exists('muginGetOpenAlexWorkCacheTtl')) {
    function muginGetOpenAlexWorkCacheTtl(bool $isNegative = false): int
    {
        $fallback = $isNegative ? 600 : 3600;
        if (defined('MUGIN_OPENALEX_WORK_CACHE_TTL_SECONDS')) {
            $configured = MUGIN_OPENALEX_WORK_CACHE_TTL_SECONDS;
            if (is_array($configured)) {
                $key = $isNegative ? 'negative' : 'positive';
                return max(0, (int) ($configured[$key] ?? $configured['default'] ?? $fallback));
            }
            return max(0, (int) $configured);
        }
        return $fallback;
    }
}

if (!function_exists('muginGetOpenAlexWorkCacheDir')) {
    function muginGetOpenAlexWorkCacheDir(): string
    {
        return muginEnsureDataSubdir('cache', 'openalex-work');
    }
}

if (!function_exists('muginGetOpenAlexWorkCachePath')) {
    function muginGetOpenAlexWorkCachePath(
        string $type,
        string $value,
        string $domain,
        string $selectVariant = 'full'
    ): string {
        $payload = [
            'type' => strtolower(trim($type)),
            'value' => strtolower(trim($value)),
            'domain' => strtolower(trim($domain)),
            // Bumped when full-select fields change (topics/keywords; concepts are not requested).
            'selectVersion' => '2026-08-14',
        ];
        // Lightweight validation select omits heavy fields — separate namespace.
        if ($selectVariant !== 'full') {
            $payload['selectVariant'] = strtolower(trim($selectVariant));
        }
        $cacheKey = hash('sha256', json_encode($payload, JSON_UNESCAPED_SLASHES));
        return muginGetOpenAlexWorkCacheDir() . '/' . $cacheKey . '.json';
    }
}

if (!function_exists('muginExtractOpenAlexTopicDisplayNames')) {
    /**
     * @param mixed $topics
     * @param int $max
     * @return array<int,string>
     */
    function muginExtractOpenAlexTopicDisplayNames($topics, int $max = 3): array
    {
        if (!is_array($topics) || $max <= 0) {
            return [];
        }
        $out = [];
        foreach ($topics as $entry) {
            if (count($out) >= $max) {
                break;
            }
            $label = '';
            if (is_string($entry) || is_numeric($entry)) {
                $label = trim((string) $entry);
            } elseif (is_array($entry)) {
                $label = trim((string) ($entry['display_name'] ?? ($entry['name'] ?? '')));
            }
            if ($label === '') {
                continue;
            }
            $key = strtolower($label);
            if (isset($out[$key])) {
                continue;
            }
            $out[$key] = $label;
        }
        return array_values($out);
    }
}

if (!function_exists('muginExtractOpenAlexKeywordDisplayNames')) {
    /**
     * OpenAlex returns at most 5 keywords per work.
     *
     * @param mixed $keywords
     * @param int $max
     * @return array<int,string>
     */
    function muginExtractOpenAlexKeywordDisplayNames($keywords, int $max = 5): array
    {
        return muginExtractOpenAlexTopicDisplayNames($keywords, $max);
    }
}

if (!function_exists('muginExtractOpenAlexSubfieldDisplayNames')) {
    /**
     * Distinct topic subfields, skipping labels that duplicate a topic name.
     * Domain/field are omitted (too generic).
     *
     * @param mixed $primaryTopic
     * @param mixed $topics
     * @return array<int,string>
     */
    function muginExtractOpenAlexSubfieldDisplayNames($primaryTopic, $topics): array
    {
        $entries = [];
        if (is_array($primaryTopic) && $primaryTopic !== []) {
            $entries[] = $primaryTopic;
        }
        if (is_array($topics)) {
            foreach ($topics as $topicEntry) {
                if (is_array($topicEntry)) {
                    $entries[] = $topicEntry;
                }
            }
        }
        $skip = [];
        foreach ($entries as $entry) {
            $topicLabel = trim((string) ($entry['display_name'] ?? ($entry['name'] ?? '')));
            if ($topicLabel !== '') {
                $skip[strtolower($topicLabel)] = true;
            }
        }
        $out = [];
        foreach ($entries as $entry) {
            $subfield = isset($entry['subfield']) && is_array($entry['subfield']) ? $entry['subfield'] : [];
            $label = trim((string) ($subfield['display_name'] ?? ''));
            if ($label === '') {
                continue;
            }
            $key = strtolower($label);
            if (isset($skip[$key]) || isset($out[$key])) {
                continue;
            }
            $out[$key] = $label;
        }
        return array_values($out);
    }
}

if (!function_exists('muginReadOpenAlexWorkCache')) {
    /**
     * @return array{hit:bool,value:mixed}
     */
    function muginReadOpenAlexWorkCache(
        string $type,
        string $value,
        string $domain,
        string $selectVariant = 'full'
    ): array {
        if ($value === '') {
            return ['hit' => false, 'value' => null];
        }
        $path = muginGetOpenAlexWorkCachePath($type, $value, $domain, $selectVariant);
        if (!is_file($path)) {
            return ['hit' => false, 'value' => null];
        }
        $raw = @file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            @unlink($path);
            return ['hit' => false, 'value' => null];
        }
        $payload = json_decode($raw, true);
        if (!is_array($payload)) {
            @unlink($path);
            return ['hit' => false, 'value' => null];
        }
        $isNegative = !empty($payload['negative']);
        $storedAt = (int) ($payload['storedAt'] ?? 0);
        if ($storedAt <= 0 || time() - $storedAt > muginGetOpenAlexWorkCacheTtl($isNegative)) {
            @unlink($path);
            return ['hit' => false, 'value' => null];
        }
        return ['hit' => true, 'value' => $payload['value'] ?? null];
    }
}

if (!function_exists('muginWriteOpenAlexWorkCache')) {
    /**
     * @param mixed $cacheValue
     */
    function muginWriteOpenAlexWorkCache(
        string $type,
        string $value,
        string $domain,
        $cacheValue,
        bool $isNegative = false,
        string $selectVariant = 'full'
    ): void {
        if ($value === '' || muginGetOpenAlexWorkCacheTtl($isNegative) <= 0) {
            return;
        }
        $payload = json_encode([
            'storedAt' => time(),
            'negative' => $isNegative,
            'value' => $cacheValue,
        ], JSON_UNESCAPED_SLASHES);
        if ($payload === false) {
            return;
        }
        @file_put_contents(
            muginGetOpenAlexWorkCachePath($type, $value, $domain, $selectVariant),
            $payload,
            LOCK_EX
        );
        muginFileCacheMaybeSweepDirectory(muginGetOpenAlexWorkCacheDir());
    }
}

if (!function_exists('muginOpenAlexReconstructAbstract')) {
    /**
     * Reconstruct OpenAlex abstract text from an inverted index map.
     *
     * @param mixed $invertedIndex
     * @return string
     */
    function muginOpenAlexReconstructAbstract($invertedIndex): string
    {
        if (!is_array($invertedIndex) || empty($invertedIndex)) {
            return '';
        }
        $positions = [];
        foreach ($invertedIndex as $word => $indexes) {
            if (!is_string($word) || !is_array($indexes)) {
                continue;
            }
            foreach ($indexes as $index) {
                if (!is_numeric($index)) {
                    continue;
                }
                $positions[(int) $index] = $word;
            }
        }
        if (empty($positions)) {
            return '';
        }
        ksort($positions);
        return trim(implode(' ', $positions));
    }
}
