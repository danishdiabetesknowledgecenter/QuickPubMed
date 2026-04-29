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
// Use Responses API for gpt-5.5 and newer models with JSON mode support
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
        // '127.0.0.1',
    ],
    // 'code' may be either a single string (single shared code) or an array of
    // strings (multiple codes, any of which unlocks Elicit). Empty / whitespace
    // entries are ignored. Examples:
    //   'code' => 'some-long-random-secret',
    //   'code' => ['code-for-site-a', 'code-for-site-b'],
    'code' => '',
    'trust_forwarded_for' => false,
]);

// ============ Unpaywall Configuration ============
// Optional domain override file:
// data/content/<domain>/domain-config.json -> unpaywall.email
// Missing values automatically fall back to this backend config.
define('UNPAYWALL_BASE_URL', 'https://api.unpaywall.org/v2');
define('UNPAYWALL_EMAIL', 'your-unpaywall-email@example.com');

// ============ NLM Proxy Response Cache ============
// Short-lived cache for stable PubMed summary/fetch proxy responses.
// Set to 0 to disable, or use ['default' => 900, 'esummary' => 900, 'efetch' => 900].
define('QPM_NLM_RESPONSE_CACHE_TTL_SECONDS', [
    'esummary' => 900,
    'efetch' => 900,
]);

// ============ OpenAlex Work Lookup Cache ============
// Short-lived cache for DOI/OpenAlex ID metadata lookups.
define('QPM_OPENALEX_WORK_CACHE_TTL_SECONDS', [
    'positive' => 3600,
    'negative' => 600,
]);
define('QPM_OPENALEX_BATCH_LOOKUP_CONCURRENCY', 2);

// ============ Semantic Source Limits ============
// Frontend-safe values exposed to the widget via ThemeConfig.php
define('QPM_SEMANTIC_SOURCE_LIMITS', [
    'semanticScholar' => 400,
    'openAlex' => 50,
    'elicit' => 100,
    'pubmedBestMatch' => 200,
    // Optional PubMed-specific limits. Defaults should stay conservative
    // because deterministic reranking uses the full retrieved candidate pool.
    'pubmedBestMatchPubmedOnly' => 200,
    'pubmedBestMatchMultiSource' => 200,
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
    //   additiveQualityBonus = pubTypeBonus + recencyBonus + oaBonus + clinicalBonus
    //                        + translationPotentialBonus + topicOverlapBonus
    //   qualityMultiplier  = citationImpactMultiplier * authorityMultiplier
    //                      * recencyMultiplier * retractionMultiplier * dataQualityMultiplier

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
    // Optional tiered recency curve (piecewise linear, global).
    // Use this when you want a plateau for recent papers, smooth decay in the middle,
    // and a non-zero floor so older seminal research is not treated as irrelevant.
    // Format: ordered pairs [maxAge, multiplier]. The first point defines the plateau
    // (full multiplier up to that age); between points the multiplier is linearly
    // interpolated; after the last point the multiplier is constant (floor).
    // The final bonus = recencyBonusMax * multiplier(age).
    //   recencyCurveEnabled = false   disabled (default). Falls back to exponential halfLife model.
    //   recencyCurveEnabled = true    uses recencyCurve below.
    // Recommended global default (0-5 full, 5-10 decays to 60%, 10-25 decays to 25%, >25 floors at 25%):
    //   [[5, 1.0], [10, 0.6], [25, 0.25]]
    // Tuning hints:
    //   - For fast-moving fields tighten to e.g. [[3, 1.0], [7, 0.5], [15, 0.15]]
    //   - For slow-moving fields relax to e.g. [[7, 1.0], [15, 0.7], [40, 0.35]]
    'recencyCurveEnabled' => false,
    'recencyCurve' => [
        [5, 1.0],
        [10, 0.6],
        [25, 0.25],
    ],
    // Additive bonus applied when `isOpenAccess=true`. This is a readability nudge,
    // not a quality signal — keep small.
    //   0    disabled (default; use if you have institutional full-text access)
    //   2-3  soft nudge
    //   4-6  moderate
    //   >10  not recommended (risks dominating relevance)
    'oaBonus' => 0,
    // Multiplier clamp for citation impact (cascade: RCR -> NIH percentile -> FWCI
    // -> field-normalized citation ratio -> influentialCitationCount -> citedByCount).
    // The multiplier is log-dampened so common values land near 1.0; the clamp caps extreme scores.
    //   [1.0, 1.0]   disabled (default). Reference examples at RCR=3.0 or FWCI=3.0:
    //   [0.95, 1.10] very conservative; top record gets ~1.10x
    //   [0.9, 1.20]  moderate; typical production setting
    //   [0.85, 1.30] aggressive; can noticeably reorder — validate with regression checklist
    'citationImpactClamp' => [1.0, 1.0],
    // Per-signal weights inside the citation impact cascade above. RCR/FWCI are
    // field-normalized and should usually be strongest. Raw citedByCount should
    // stay weak because older papers naturally accumulate more citations.
    'citationImpactSignalWeights' => [
        'rcr' => 0.5,
        'fwci' => 0.5,
        'nihPercentile' => 0,
        'fieldNormalizedCitationRatio' => 0,
        'influentialCitationCount' => 0.15,
        'citedByCount' => 0.08,
    ],
    // Small additive bonus from iCite APT (approximate potential to translate).
    // Kept separate from clinicalBonus because it is a translational-potential
    // signal, not direct proof of clinical applicability.
    'translationPotentialBonusMax' => 0,
    'translationPotentialAptScale' => 10,
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
    // ---------- Data quality (downgrade, not filter) ----------
    // Per-field multipliers applied to combinedScore when a record has incomplete
    // metadata. Records without a title are always dropped (cannot be rendered);
    // all other missing fields downgrade instead of exclude.
    //
    //   missingAbstract      0.80 strong downgrade (abstract entirely missing)
    //   shortAbstract        0.90 abstract shorter than abstractMinLength.short
    //   veryShortAbstract    0.95 abstract between short and veryShort thresholds
    //   missingAuthor        0.95 no author name from any source
    //   missingYear          0.90 no publication year resolved
    //
    // All values must be in (0.0, 1.0]. Value 1.0 = disabled (default).
    // Combined multiplicatively: missing abstract + missing author = 0.80 * 0.95 = 0.76.
    // Recommended profiles:
    //   conservative: ['missingAbstract' => 0.90, 'shortAbstract' => 0.95, 'missingAuthor' => 0.98, 'missingYear' => 0.95]
    //   moderate:     ['missingAbstract' => 0.80, 'shortAbstract' => 0.90, 'veryShortAbstract' => 0.95, 'missingAuthor' => 0.95, 'missingYear' => 0.90]
    //   aggressive:   ['missingAbstract' => 0.70, 'shortAbstract' => 0.85, 'veryShortAbstract' => 0.92, 'missingAuthor' => 0.90, 'missingYear' => 0.85]
    'dataQualityPenalties' => [
        'missingAbstract' => 1.0,
        'shortAbstract' => 1.0,
        'veryShortAbstract' => 1.0,
        'missingAuthor' => 1.0,
        'missingYear' => 1.0,
    ],
    // Abstract length thresholds (in characters). Used only when dataQualityPenalties
    // has non-neutral values.
    'abstractMinLength' => [
        'short' => 100,
        'veryShort' => 250,
    ],
    // ---------- Publication-type tier scoring (M1B: classifier-based) ----------
    // Per-tier additive bonus applied after the classifier assigns a canonical tier.
    // Tier names come from src/utils/pubTypeClassifier.js. The `excluded` tier
    // causes records to be dropped entirely before sorting (similar to retraction filter).
    // An empty map ([]) means classifier runs but no tier bonus is applied — safe default.
    //
    // Conservative:
    //   ['guideline_verified' => 30, 'guideline_candidate' => 15,
    //    'systematic_review_or_meta' => 20, 'randomized_controlled_trial' => 12,
    //    'editorial_or_letter' => -5]
    // Moderate:
    //   ['guideline_verified' => 40, 'guideline_candidate' => 20,
    //    'systematic_review_or_meta' => 30, 'randomized_controlled_trial' => 18,
    //    'clinical_trial' => 10, 'review' => 8,
    //    'book_chapter' => -5, 'dissertation' => -10, 'editorial_or_letter' => -10]
    // Aggressive:
    //   ['guideline_verified' => 60, 'guideline_candidate' => 30,
    //    'systematic_review_or_meta' => 45, 'randomized_controlled_trial' => 25,
    //    'clinical_trial' => 15, 'review' => 10,
    //    'book_chapter' => -15, 'dissertation' => -15, 'editorial_or_letter' => -20]
    'pubTypeTiers' => [],
    // Curated list of trusted publishers/organisations whose non-PubMed guidelines
    // and reports should be promoted to the `guideline_verified` or `report_verified` tier.
    // Actual data lives in data/content/shared/limits.json under `guidelinePublisherAllowList`
    // and can be overridden per-domain under `rerank.guidelinePublisherAllowList`.
    // Leave this array empty when the allow-list is managed entirely via limits.json.
    'guidelinePublisherAllowList' => [],
]);

// Optional frontend-selectable rerank profiles.
// These profiles change only the deterministic rerank weights. They do not change
// retrieval sources, hard filters, post-validation, fallback policy, or LLM final rerank.
define('QPM_RERANK_PROFILE_CONFIG', [
    'enabled' => true,
    'defaultProfileId' => 'balanced',
    'profiles' => [
        [
            'id' => 'balanced',
            'labelKey' => 'rerankProfileBalanced',
            'descriptionKey' => 'rerankProfileBalancedDescription',
            'overrides' => [
                'sourceWeights' => [
                    'pubmed' => 1.0,
                    'semanticScholar' => 0.92,
                    'openAlex' => 0.88,
                    'elicit' => 0.9,
                ],
                'pmidBonus' => 8,
                'overlapBonusPerExtraSource' => 35,
                'pubTypeWeights' => [
                    'systematic-review' => 18,
                    'meta-analysis' => 18,
                    'guideline' => 18,
                    'randomized-controlled-trial' => 14,
                    'review' => 8,
                    'clinical-trial' => 8,
                    'editorial' => 0,
                    'letter' => 0,
                ],
                'recencyHalfLifeYears' => null,
                'recencyBonusMax' => 10,
                'recencyCurveEnabled' => true,
                'recencyCurve' => [[5, 1.0], [10, 0.6], [25, 0.25]],
                'oaBonus' => 3,
                'citationImpactClamp' => [0.95, 1.10],
                'citationImpactSignalWeights' => [
                    'rcr' => 0.45,
                    'fwci' => 0.45,
                    'nihPercentile' => 0.08,
                    'fieldNormalizedCitationRatio' => 0.08,
                    'influentialCitationCount' => 0.12,
                    'citedByCount' => 0.04,
                ],
                'translationPotentialBonusMax' => 3,
                'retractionAction' => 'filter',
                'retractionPenalty' => 1.0,
                'clinicalBonus' => 8,
                'clinicalCitedByThreshold' => 5,
                'topicOverlapBonus' => 20,
                'authorityClamp' => [1.0, 1.0],
                'dataQualityPenalties' => [
                    'missingAbstract' => 0.90,
                    'shortAbstract' => 0.95,
                    'veryShortAbstract' => 0.98,
                    'missingAuthor' => 0.98,
                    'missingYear' => 0.95,
                ],
                'abstractMinLength' => [
                    'short' => 100,
                    'veryShort' => 250,
                ],
            ],
        ],
        [
            'id' => 'highest-evidence',
            'labelKey' => 'rerankProfileHighestEvidence',
            'descriptionKey' => 'rerankProfileHighestEvidenceDescription',
            'overrides' => [
                'sourceWeights' => [
                    'pubmed' => 1.0,
                    'semanticScholar' => 0.92,
                    'openAlex' => 0.88,
                    'elicit' => 1.05,
                ],
                'pmidBonus' => 5,
                'overlapBonusPerExtraSource' => 35,
                'pubTypeWeights' => [
                    'systematic-review' => 55,
                    'meta-analysis' => 55,
                    'guideline' => 40,
                    'randomized-controlled-trial' => 32,
                    'review' => 15,
                    'clinical-trial' => 12,
                    'editorial' => 0,
                    'letter' => 0,
                ],
                'recencyHalfLifeYears' => null,
                'recencyBonusMax' => 12,
                'recencyCurveEnabled' => true,
                'recencyCurve' => [[5, 1.0], [10, 0.6], [25, 0.25]],
                'oaBonus' => 3,
                'citationImpactClamp' => [0.9, 1.20],
                'citationImpactSignalWeights' => [
                    'rcr' => 0.55,
                    'fwci' => 0.55,
                    'nihPercentile' => 0.12,
                    'fieldNormalizedCitationRatio' => 0.10,
                    'influentialCitationCount' => 0.12,
                    'citedByCount' => 0.03,
                ],
                'translationPotentialBonusMax' => 4,
                'retractionAction' => 'filter',
                'retractionPenalty' => 1.0,
                'clinicalBonus' => 12,
                'clinicalCitedByThreshold' => 5,
                'topicOverlapBonus' => 30,
                'authorityClamp' => [0.98, 1.05],
                'dataQualityPenalties' => [
                    'missingAbstract' => 0.85,
                    'shortAbstract' => 0.92,
                    'veryShortAbstract' => 0.96,
                    'missingAuthor' => 0.97,
                    'missingYear' => 0.92,
                ],
                'abstractMinLength' => [
                    'short' => 100,
                    'veryShort' => 250,
                ],
            ],
        ],
        [
            'id' => 'clinical-practice',
            'labelKey' => 'rerankProfileClinicalPractice',
            'descriptionKey' => 'rerankProfileClinicalPracticeDescription',
            'overrides' => [
                'sourceWeights' => [
                    'pubmed' => 1.08,
                    'semanticScholar' => 0.92,
                    'openAlex' => 0.88,
                    'elicit' => 1.0,
                ],
                'pmidBonus' => 12,
                'overlapBonusPerExtraSource' => 35,
                'pubTypeWeights' => [
                    'systematic-review' => 35,
                    'meta-analysis' => 35,
                    'guideline' => 45,
                    'randomized-controlled-trial' => 28,
                    'review' => 12,
                    'clinical-trial' => 18,
                    'editorial' => 0,
                    'letter' => 0,
                ],
                'recencyHalfLifeYears' => null,
                'recencyBonusMax' => 10,
                'recencyCurveEnabled' => true,
                'recencyCurve' => [[5, 1.0], [10, 0.6], [25, 0.25]],
                'oaBonus' => 2,
                'citationImpactClamp' => [0.9, 1.15],
                'citationImpactSignalWeights' => [
                    'rcr' => 0.45,
                    'fwci' => 0.35,
                    'nihPercentile' => 0.08,
                    'fieldNormalizedCitationRatio' => 0.08,
                    'influentialCitationCount' => 0.10,
                    'citedByCount' => 0.03,
                ],
                'translationPotentialBonusMax' => 8,
                'retractionAction' => 'filter',
                'retractionPenalty' => 1.0,
                'clinicalBonus' => 20,
                'clinicalCitedByThreshold' => 2,
                'topicOverlapBonus' => 25,
                'authorityClamp' => [1.0, 1.0],
                'dataQualityPenalties' => [
                    'missingAbstract' => 0.85,
                    'shortAbstract' => 0.92,
                    'veryShortAbstract' => 0.96,
                    'missingAuthor' => 0.97,
                    'missingYear' => 0.92,
                ],
                'abstractMinLength' => [
                    'short' => 100,
                    'veryShort' => 250,
                ],
            ],
        ],
        [
            'id' => 'newest-research',
            'labelKey' => 'rerankProfileNewestResearch',
            'descriptionKey' => 'rerankProfileNewestResearchDescription',
            'overrides' => [
                'sourceWeights' => [
                    'pubmed' => 0.95,
                    'semanticScholar' => 0.95,
                    'openAlex' => 0.95,
                    'elicit' => 1.05,
                ],
                'pmidBonus' => 3,
                'overlapBonusPerExtraSource' => 30,
                'pubTypeWeights' => [
                    'systematic-review' => 10,
                    'meta-analysis' => 10,
                    'guideline' => 6,
                    'randomized-controlled-trial' => 12,
                    'review' => 4,
                    'clinical-trial' => 6,
                    'editorial' => 0,
                    'letter' => 0,
                ],
                'recencyHalfLifeYears' => null,
                'recencyBonusMax' => 45,
                'recencyCurveEnabled' => true,
                'recencyCurve' => [[2, 1.0], [5, 0.4], [10, 0.08], [15, 0.0]],
                'recencyMultiplierCurve' => [[5, 1.0], [10, 0.82], [15, 0.65], [25, 0.50]],
                'oaBonus' => 3,
                'citationImpactClamp' => [0.95, 1.05],
                'citationImpactSignalWeights' => [
                    'rcr' => 0.20,
                    'fwci' => 0.20,
                    'nihPercentile' => 0.04,
                    'fieldNormalizedCitationRatio' => 0.04,
                    'influentialCitationCount' => 0.06,
                    'citedByCount' => 0.01,
                ],
                'translationPotentialBonusMax' => 2,
                'retractionAction' => 'filter',
                'retractionPenalty' => 1.0,
                'clinicalBonus' => 4,
                'clinicalCitedByThreshold' => 20,
                'topicOverlapBonus' => 25,
                'authorityClamp' => [1.0, 1.0],
                'dataQualityPenalties' => [
                    'missingAbstract' => 0.90,
                    'shortAbstract' => 0.95,
                    'veryShortAbstract' => 0.98,
                    'missingAuthor' => 0.98,
                    'missingYear' => 0.95,
                ],
                'abstractMinLength' => [
                    'short' => 100,
                    'veryShort' => 250,
                ],
            ],
        ],
        [
            'id' => 'broad-mapping',
            'labelKey' => 'rerankProfileBroadMapping',
            'descriptionKey' => 'rerankProfileBroadMappingDescription',
            'overrides' => [
                'sourceWeights' => [
                    'pubmed' => 1.0,
                    'semanticScholar' => 0.92,
                    'openAlex' => 0.9,
                    'elicit' => 0.9,
                ],
                'pmidBonus' => 5,
                'overlapBonusPerExtraSource' => 25,
                'pubTypeWeights' => [
                    'systematic-review' => 5,
                    'meta-analysis' => 5,
                    'guideline' => 5,
                    'randomized-controlled-trial' => 5,
                    'review' => 3,
                    'clinical-trial' => 3,
                    'editorial' => 0,
                    'letter' => 0,
                ],
                'recencyHalfLifeYears' => null,
                'recencyBonusMax' => 3,
                'recencyCurveEnabled' => true,
                'recencyCurve' => [[5, 1.0], [10, 0.6], [25, 0.25]],
                'oaBonus' => 0,
                'citationImpactClamp' => [1.0, 1.0],
                'retractionAction' => 'filter',
                'retractionPenalty' => 1.0,
                'clinicalBonus' => 0,
                'clinicalCitedByThreshold' => 1000000,
                'topicOverlapBonus' => 12,
                'authorityClamp' => [1.0, 1.0],
                'dataQualityPenalties' => [
                    'missingAbstract' => 0.95,
                    'shortAbstract' => 0.98,
                    'veryShortAbstract' => 0.99,
                    'missingAuthor' => 0.99,
                    'missingYear' => 0.97,
                ],
                'abstractMinLength' => [
                    'short' => 100,
                    'veryShort' => 250,
                ],
            ],
        ],
    ],
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

// ============ Telemetry Configuration ============
// Additive observability for LLM-backed query translation.
// Writes anonymized JSON Lines to data/runtime/qpm-telemetry-YYYY-MM-DD.jsonl
// via backend/api/TelemetryLog.php. No IP, no User-Agent, no raw free text.
// Toggle `enabled` to false to disable all telemetry (console + backend).
//
// Fields:
//  - retentionDays: JSONL files older than this are pruned on a probabilistic sweep.
//  - maxPayloadBytes: events larger than this are silently dropped server-side.
//  - logOverHitThreshold: source_hit_count is flagged when count >= this value.
//  - logLowOverlapThreshold: overlap_summary is flagged when overlapRatio < this.
//  - logLowConfidenceThreshold: semantic_intent_parsed is flagged below this.
//  - sourceProbeRanges: per-source sanity ranges used by source_probe_counts.
define('QPM_TELEMETRY_CONFIG', [
    'enabled' => false,
    'retentionDays' => 30,
    'maxPayloadBytes' => 4096,
    'logOverHitThreshold' => 100000,
    'logLowOverlapThreshold' => 0.10,
    'logLowConfidenceThreshold' => 0.6,
    'sourceProbeRanges' => [
        'pubmed' => ['min' => 20, 'max' => 100000],
        'openAlex' => ['min' => 50, 'max' => 1000000],
        'semanticScholar' => ['min' => 10, 'max' => 100000],
    ],
]);

// ============ Paraphrase Chip Configuration ============
// Opt-in UI chip displayed above search results that mirrors the LLM's
// understanding of the user's query ("Vi har forstået din søgning som:"),
// with a "Rediger" button. Leave disabled by default; flip to true to enable.
define('QPM_PARAPHRASE_CHIP_CONFIG', [
    'enabled' => false,
    // showSuggestions: when true, the chip displays the LLM's
    // meta.refinementSuggestions list below the low-confidence warning. Only
    // rendered when confidence is low and the LLM returned non-empty
    // suggestions. Harmless to leave on.
    'showSuggestions' => true,
    // showEarly: when true, the chip appears as soon as the semantic intent is
    // parsed (before database searches finish). Pulsing loader dot indicates
    // the search is still running. Recommended: leave false until confident
    // about chip timing; flip to true when ready.
    'showEarly' => false,
    // showPendingLoader: when true AND showEarly is true, show a pulsing dot
    // on the chip while background search is pending.
    'showPendingLoader' => true,
    // preflightEnabled: experimental. When true, a lightweight LLM call is
    // issued as the user pauses typing (~1s) to surface low-confidence hints
    // BEFORE the user clicks Search. Cached for the actual search click. Keep
    // disabled in most deployments unless operating with an LLM budget.
    'preflightEnabled' => false,
    'preflightDebounceMs' => 1000,
    'preflightMinInputLength' => 12,
]);

// ============ MeSH Validation Observe-Only Flag ============
// When true, validateAndEnhanceMeshTerms performs all its NLM/AI calls but
// returns the ORIGINAL query unchanged. Safety brake for the existing active
// MeSH flow. Keep false unless telemetry reports show degradation.
define('QPM_MESH_VALIDATION_OBSERVE_ONLY', false);

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
