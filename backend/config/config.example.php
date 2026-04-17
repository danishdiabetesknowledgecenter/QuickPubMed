<?php
/**
 * Configuration file for QuickPubMed backend
 *
 * INSTRUCTIONS:
 * 1. Copy this file and rename to 'config.php'
 * 2. Insert your API keys below
 * 3. Upload config.php to your web server
 *
 * IMPORTANT: config.php should NEVER be committed to git!
 */

// ============ OpenAI Configuration ============
// Optional domain override file:
// data/content/<domain>/domain-config.json -> openai.api_key / openai.org_id / openai.api_url
// Missing values automatically fall back to this backend config.
define('OPENAI_API_KEY', 'sk-INSERT-YOUR-API-KEY-HERE');
define('OPENAI_ORG_ID', '');
// Use Responses API for gpt-5.4 and newer models with JSON mode support
define('OPENAI_API_URL', 'https://api.openai.com/v1/responses');

// ============ NLM/PubMed Configuration ============
// Optional domain override file:
// data/content/<domain>/domain-config.json -> nlm.api_key / nlm.email
// Missing values automatically fall back to this backend config.
define('NLM_API_KEY', 'INSERT-YOUR-NLM-API-KEY-HERE');
define('NLM_EMAIL', 'your-email@example.com');
define('NLM_BASE_URL', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils');

// ============ Semantic Scholar Configuration ============
// Optional but recommended to avoid strict public rate limits.
// Apply for key: https://www.semanticscholar.org/product/api#api-key-form
define('SEMANTIC_SCHOLAR_API_KEY', '');

// ============ OpenAlex Configuration ============
// Optional domain override file:
// data/content/<domain>/domain-config.json -> openalex.api_key / openalex.email
// Missing values automatically fall back to this backend config.
// API key is recommended to reduce public rate limiting:
// https://developers.openalex.org/api-reference/introduction
define('OPENALEX_API_KEY', '');
define('OPENALEX_EMAIL', '');

// ============ Elicit Configuration ============
// Requires an API key from https://docs.elicit.com/
define('ELICIT_API_KEY', '');

// ============ Elicit Unlock (optional) ============
// If configured, the Elicit source is added to the available semantic sources
// returned by ThemeConfig.php when EITHER of the following is true:
//   - the request's client IP matches one of the listed IPs/CIDR ranges
//   - the frontend sends a matching "elicitKey" query parameter
// When not configured (constant not defined, or both lists empty), Elicit
// availability is controlled solely by the normal domain translation_sources.
// Frontend can deliver the code via:
//   - URL parameter: ?elicitKey=YOUR-SECRET (stored in localStorage afterwards)
//   - A small "Unlock" button in the search UI that prompts for the code
// Set 'trust_forwarded_for' => true only when running behind a trusted proxy
// that correctly sets the X-Forwarded-For header.
define('QPM_ELICIT_UNLOCK', [
    'ips' => [
        // '192.168.1.0/24',
        // '10.0.0.5',
    ],
    'code' => '', // e.g. 'some-long-random-secret'
    'trust_forwarded_for' => false,
]);

// ============ Unpaywall Configuration ============
// Optional domain override file:
// data/content/<domain>/domain-config.json -> unpaywall.email
// Missing values automatically fall back to this backend config.
define('UNPAYWALL_BASE_URL', 'https://api.unpaywall.org/v2');
define('UNPAYWALL_EMAIL', 'your-unpaywall-email@example.com');

// ============ Semantic Source Limits ============
// Frontend-safe values exposed to the widget via ThemeConfig.php
define('QPM_SEMANTIC_SOURCE_LIMITS', [
    'semanticScholar' => 400,
    'openAlex' => 50,
    'elicit' => 100,
    'pubmedBestMatch' => 200,
]);

// ============ Rerank Configuration ============
// Frontend-safe values exposed to the widget via ThemeConfig.php
// Current model:
// - RRF is the main ranking signal
// - overlap across multiple sources gets an explicit bonus
// - PMID records get an explicit bonus
// - native source scores are only used as tie-breakers
// rrfK controls how quickly the RRF rank contribution falls as rank gets lower.
// Lower values make top ranks matter more. Higher values flatten the rank effect.
// 60 is a common, safe default and is usually a sensible value to keep unless you
// deliberately want a more aggressive or flatter fusion curve.
// Practical guidance:
// - sourceWeights, pmidBonus and overlapBonusPerExtraSource are the most natural values to tune
// - rrfK can be tuned, but should usually be changed with care
// - rankScale and scoreScale are more technical calibration values and should usually be left alone
// - fallbackSourceWeight is mostly a safety fallback and should rarely need changing
define('QPM_RERANK_CONFIG', [
    'sourceWeights' => [
        // Per-source weight applied to the RRF contribution, and also to the score tie-breaker.
        // This is a normal place to tune source preferences.
        'pubmed' => 1.0,
        'semanticScholar' => 0.92,
        'openAlex' => 0.88,
        'elicit' => 0.9,
    ],
    // Extra score added when a candidate has a PMID.
    // This is a normal value to tune.
    'pmidBonus' => 10,
    // RRF damping parameter. Lower = stronger emphasis on very high ranks. Higher = flatter fusion.
    // Advanced parameter: change with care.
    'rrfK' => 60,
    // Global scale for the RRF part of the score.
    // Technical calibration value: usually best left unchanged.
    'rankScale' => 100,
    // Scale for source-native score normalization; used only as tie-breaker.
    // Technical calibration value: usually best left unchanged.
    'scoreScale' => 20,
    // Fallback weight if a source appears without an explicit weight above.
    // Safety fallback: rarely needs changing.
    'fallbackSourceWeight' => 0.8,
    // Extra score added for each additional source that contains the same record.
    // This is a normal value to tune.
    'overlapBonusPerExtraSource' => 35,
    // ---------- Hybrid quality signals (Phase 1+) ----------
    // All defaults below are NEUTRAL so an unchanged installation behaves 1:1 like before.
    // Tuning these values opts in to the new signals. For reference, a top-ranked
    // multi-source candidate typically scores ~200-300, so additive bonuses of 5-15 are
    // a soft nudge, 20-40 a clear lift, and >50 risks dominating the RRF fusion.
    //
    // Hybrid formula:
    //   combinedScore = (baseScore + additiveQualityBonus) * qualityMultiplier
    //   additiveQualityBonus = pubTypeBonus + recencyBonus + oaBonus + clinicalBonus + topicOverlapBonus
    //   qualityMultiplier  = citationImpactMultiplier * authorityMultiplier * retractionMultiplier

    // Additive bonus per publication type. Keys match OpenAlex `type`/`type_crossref`
    // and Semantic Scholar `publicationTypes` (normalized to lowercase). Max value
    // across matched types is used (not sum) so overlapping labels don't double-count.
    //
    //   []                                           no effect (default, recommended baseline)
    //   conservative evidence-based profile:
    //     ['review' => 5, 'systematic-review' => 12, 'meta-analysis' => 12,
    //      'randomized-controlled-trial' => 10, 'guideline' => 10]
    //   moderate evidence-based profile:
    //     ['review' => 10, 'systematic-review' => 25, 'meta-analysis' => 25,
    //      'randomized-controlled-trial' => 18, 'guideline' => 20, 'clinical-trial' => 12]
    //   aggressive evidence hierarchy:
    //     ['systematic-review' => 40, 'meta-analysis' => 40, 'guideline' => 35,
    //      'randomized-controlled-trial' => 25, 'review' => 15,
    //      'editorial' => -10, 'letter' => -15]
    'pubTypeWeights' => [],
    // Exponential recency decay. halfLife in years is how fast the bonus decays.
    // null or 0 disables recency. Typical ranges:
    //   3     strong recency bias (fast-moving fields: AI, genomics)
    //   5-7   typical for clinical biomedicine
    //   10-15 slow-moving fields (pharmacology, physiology)
    //   null  disabled (default)
    'recencyHalfLifeYears' => null,
    // Max additive recency bonus for current-year papers (decays towards 0 with age).
    // Suggested sizing: 50-75% of your largest pubTypeWeight so pubType dominates.
    //   0       disabled (default)
    //   5-10    conservative nudge
    //   15-20   moderate
    //   25-35   aggressive (matches overlapBonus scale)
    'recencyBonusMax' => 0,
    // Additive bonus applied when `isOpenAccess=true`. This is a readability nudge,
    // not a quality signal — keep small.
    //   0    disabled (default; use if you have institutional full-text access)
    //   2-3  soft nudge
    //   4-6  moderate
    //   >10  not recommended (risks dominating relevance)
    'oaBonus' => 0,
    // Multiplier clamp for citation impact (cascade: RCR -> FWCI -> influentialCitationCount -> citedByCount).
    // The multiplier is log-dampened so common values land near 1.0; the clamp caps extreme scores.
    //   [1.0, 1.0]   disabled (default). Reference examples at RCR=3.0 or FWCI=3.0:
    //   [0.95, 1.10] very conservative; top record gets ~1.10x
    //   [0.9, 1.20]  moderate; typical production setting
    //   [0.85, 1.30] aggressive; can noticeably reorder — validate with regression checklist
    'citationImpactClamp' => [1.0, 1.0],
    // How retracted papers are handled.
    //   'none'    no effect (default; NOT recommended for clinical tools)
    //   'penalty' multiplies combinedScore by retractionPenalty; paper still visible
    //   'filter'  drops retracted candidates before sorting; never shown to users
    //             (recommended for clinician-facing apps like QuickPubMed)
    'retractionAction' => 'none',
    // Multiplier applied when retractionAction='penalty'. Only used in 'penalty' mode.
    //   1.0  neutral (default)
    //   0.5  halves the score; visible but clearly demoted
    //   0.2  strong demotion; typically bottom of results
    //   0.1  practically hidden (used in tests)
    'retractionPenalty' => 1.0,
    // Additive bonus for clinically relevant records (requires NIH iCite enrichment).
    // Only PMIDs get iCite data; DOI-only candidates ignore this bonus.
    //   0      disabled (default)
    //   5-8    conservative clinical nudge
    //   10-15  moderate (recommended for clinical apps)
    //   20+    aggressive; clinical papers visibly dominate
    'clinicalBonus' => 0,
    // Secondary trigger for clinicalBonus when `isClinical=false` but the paper has
    // clinical citations. Value = minimum `cited_by_clin` count to qualify.
    //   1000000 effectively disabled (default)
    //   2-5     captures "rank-adjacent" clinical studies (typical tuning)
    //   10+     strict: only papers cited by many clinical works
    'clinicalCitedByThreshold' => 1000000,
    // Additive bonus multiplied by query-topic overlap ratio (0..1). Signal strength
    // depends on how specific the query is. Vague queries produce many weak matches;
    // specific queries produce few strong matches.
    //   0       disabled (default)
    //   10      conservative (vague queries dominate)
    //   20-25   moderate (balanced)
    //   35-40   aggressive (topical relevance strongly rewarded)
    'topicOverlapBonus' => 0,
    // Clamp for authority multiplier (author h-index and journal mean citedness).
    // WARNING: h-index favors senior researchers and large fields, can cement
    // Matthew effects in ranking. Keep disabled unless you have a specific reason.
    //   [1.0, 1.0]   disabled (default; recommended)
    //   [0.98, 1.05] very conservative; max 5% lift to high-authority records
    //   [0.95, 1.10] standard "if you must"; max 10% lift
    //   >[0.9, 1.15] not recommended; risks overriding actual relevance
    'authorityClamp' => [1.0, 1.0],
]);

// ============ PubMed Lexical Rescue Configuration ============
// Frontend-safe values exposed to the widget via ThemeConfig.php
define('QPM_SEMANTIC_RESCUE_CONFIG', [
    'mode' => 'configurable_default_sparse',
    'minMergedCandidates' => 25,
    'minSourceCandidates' => 12,
    'searchLimit' => 80,
    'maxCandidates' => 20,
    'minLexicalScore' => 3,
]);

// ============ Semantic LLM Final Rerank Configuration ============
// Frontend-safe values exposed to the widget via ThemeConfig.php
define('QPM_SEMANTIC_LLM_RERANK_CONFIG', [
    'enabled' => false,
    'model' => 'gpt-5.4-nano',
    'topN' => 25,
    'maxOutputTokens' => 400,
]);

// ============ Public Search API Configuration ============
// External API clients. Keep real keys only in config.php, never in git.
define('NEMPUBMED_API_CLIENTS', [
    'example-client' => [
        'api_key' => 'replace-with-production-api-key',
        'url_api_key' => 'replace-with-separate-low-privilege-test-key',
        'enabled' => false,
        // Model B: allow browser calls from arbitrary origins for this client.
        'allow_all_origins' => false,
        'allowed_origins' => [
            'https://app.example.com',
        ],
        'rate_limit_per_minute' => 60,
        'get_rate_limit_per_minute' => 15,
        'allow_primary_api_key_in_url' => false,
    ],
]);

define('NEMPUBMED_PUBLIC_API', [
    'basePath' => '/v1',
    'docroot' => 'public-api',
    'defaultPageSize' => 25,
    'maxPageSize' => 100,
    'includeAbstractsByDefault' => true,
    'includeResolvedQueriesByDefault' => true,
    'includeDiagnosticsByDefault' => false,
    'getSearchEnabled' => true,
    'urlApiKeyEnabled' => false,
    'urlApiKeyMode' => 'configurable',
    'urlApiKeyDefaultDisabled' => true,
    'responseCachePolicy' => 'no-store',
    'searchResultCacheTtlSeconds' => 60,
    'hydrationCacheTtlSeconds' => 1800,
    'concurrentSearchLimit' => 10,
    'busyRetryAfterSeconds' => 120,
    'searchSlotTtlSeconds' => 900,
    'postRateLimit' => 60,
    'getRateLimit' => 15,
    'matchesWebOrderingByDefault' => false,
]);

define('NEMPUBMED_PUBLIC_API_BASE_PATH', '/v1');
define('NEMPUBMED_PUBLIC_API_DOCROOT', 'public-api');
define('NEMPUBMED_PUBLIC_API_GET_SEARCH_ENABLED', true);
define('NEMPUBMED_PUBLIC_API_URL_API_KEY_ENABLED', false);
define('NEMPUBMED_PUBLIC_API_URL_API_KEY_MODE', 'configurable');
define('NEMPUBMED_PUBLIC_API_URL_API_KEY_DEFAULT_DISABLED', true);
define('NEMPUBMED_PUBLIC_API_RESPONSE_CACHE_POLICY', 'no-store');
define('NEMPUBMED_PUBLIC_API_GET_RATE_LIMIT', 15);

define('NEMPUBMED_AUDIT', [
    'enabled' => true,
    'retentionDays' => 30,
]);

// ============ Frontend Class Overrides (Optional) ============
// Optional global fallback (applies to all domains):
// - mode "append": keep existing element classes and add these
// - mode "replace": remove base class and add these
// Domain-specific overrides can be set in:
// data/content/<domain>/domain-config.json -> class_overrides
define('QPM_CLASS_OVERRIDES_GLOBAL', [
    // 'qpm_pubmedLink' => [
    //     'mode' => 'append',
    //     'classes' => 'onHoverJS',
    // ],
    // 'qpm_pubmedLinkArrow' => [
    //     'mode' => 'append',
    //     'classes' => 'intext-arrow-link',
    // ],
]);

// ============ Theme Overrides (Frontend CSS variables) ============
// Optional domain override file:
// data/content/<domain>/domain-config.json -> theme_overrides
// Missing values automatically fall back to this backend config.
// Global overrides applied to all domains
define('QPM_THEME_GLOBAL_OVERRIDES', [
    // '--color-link' => '#004fa4',
]);

// Domain specific theme overrides are now expected in:
// data/content/<domain>/domain-config.json -> theme_overrides

// Allowed domains for CORS
// Supports wildcards: *.example.com matches sub.example.com and example.com
define('ALLOWED_DOMAINS', [
    '*.example.com',
    'example.com',
    'localhost',
]);

// ============ Editor Authentication (No Database) ============
// Multi-user structure
// Generate hash with:
// php -r "echo password_hash('CHANGE-ME', PASSWORD_BCRYPT) . PHP_EOL;"
define('EDITOR_USERS', [
    'editor' => [
        'password_hash' => '$2y$10$REPLACE_WITH_BCRYPT_HASH',
        'allowed_domains' => ['diabetes', 'dementia'],
        'can_edit_limits' => true,
        'disabled' => false,
    ],
    'topics_only' => [
        'password_hash' => '$2y$10$REPLACE_WITH_BCRYPT_HASH',
        'allowed_domains' => ['diabetes'],
        'can_edit_limits' => false,
        'disabled' => false,
    ],
]);
// Session timeout in seconds (default: 30 minutes)
define('EDITOR_SESSION_TIMEOUT', 1800);
// Set to true in production (HTTPS required for editor endpoints)
define('EDITOR_REQUIRE_HTTPS', true);
// Cookie SameSite policy for editor session: 'Lax', 'Strict', or 'None'
// Use 'None' only when editor UI runs on a different origin than the API.
define('EDITOR_COOKIE_SAMESITE', 'None');
// Optional exact-origin allowlist for editor CORS (useful for localhost dev)
define('EDITOR_ALLOWED_ORIGINS', [
    'http://localhost:5173',
]);
// Optional allowlist for editable content domains
// If empty, domains are discovered from data/content/<domain>/topics.json
define('EDITOR_ALLOWED_CONTENT_DOMAINS', [
    'diabetes',
    'dementia',
    'concussion',
    'neurorehabilitation',
    'overweight',
    'sdnu',
    'skincancer',
]);
// Max accepted request body for editor endpoints (bytes)
define('EDITOR_MAX_REQUEST_BYTES', 2 * 1024 * 1024);
// Validation limits for nested topic/filter trees
define('EDITOR_MAX_TREE_DEPTH', 12);
define('EDITOR_MAX_TOTAL_NODES', 50000);
define('EDITOR_MAX_TEXT_LENGTH', 20000);
// Revision history and audit
define('EDITOR_MAX_REVISIONS', 25);
define('EDITOR_AUDIT_ENABLED', true);
define('EDITOR_AUDIT_RETENTION_DAYS', 30);

// Load helper functions
require_once dirname(__DIR__) . '/app/helpers.php';
