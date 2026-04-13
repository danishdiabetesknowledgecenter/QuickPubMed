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
