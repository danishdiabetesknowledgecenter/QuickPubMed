// Publication-type classifier. Assigns each merged candidate a canonical tier plus a
// confidence level and a list of the signals that contributed to the decision.
//
// The classifier is intentionally conservative:
// - High confidence requires an authoritative source (PubMed pt=Guideline, an entry in
//   the publisher allow-list, or an OpenAlex type for core research article kinds).
// - Medium confidence combines a weaker source signal with a title-pattern match
//   (e.g. OpenAlex type=report + title contains "guideline").
// - Low confidence is a best-effort guess used as a fallback so nothing is silently
//   mislabeled as research_article when the data is ambiguous.
//
// Tiers (stable vocabulary — consumers rely on these exact strings):
//   guideline_verified, guideline_candidate, systematic_review_or_meta, review,
//   randomized_controlled_trial, clinical_trial, research_article, book, book_chapter,
//   dissertation, report_verified, report_generic, editorial_or_letter, preprint, excluded

const EXCLUDED_SUBTYPES = {
  erratum: [/^erratum$/i, /^correction$/i, /^retraction notice/i, /correction to/i],
  paratext: [/^paratext$/i, /^table of contents$/i, /^front matter$/i, /^back matter$/i],
  peerReview: [/^peer-?review$/i],
  grant: [/^grant$/i, /^grants,? nih$/i],
  dataset: [/^dataset$/i, /^data paper$/i, /^data-set$/i, /^data set$/i],
};

const GUIDELINE_TITLE_PATTERNS = [
  /\bguideline(s)?\b/i,
  /\bclinical practice\b/i,
  /\brecommendation(s)?\b/i,
  /\bposition statement\b/i,
  /\bconsensus\b/i,
  /\bstandards of care\b/i,
];

const SYSTEMATIC_REVIEW_TITLE_PATTERNS = [
  /\bsystematic review\b/i,
  /\bmeta[-\s]?analysis\b/i,
  /\bnetwork meta[-\s]?analysis\b/i,
  /\bumbrella review\b/i,
];

const RCT_TITLE_PATTERNS = [
  /\brandomi[sz]ed\b/i,
  /\brandomi[sz]ed controlled trial\b/i,
  /\brct\b/i,
];

const CLINICAL_TRIAL_TITLE_PATTERNS = [
  /\bclinical trial\b/i,
  /\bphase\s*(i|ii|iii|iv|1|2|3|4)\b/i,
  /\btrial protocol\b/i,
];

const REVIEW_TITLE_PATTERNS = [/\bnarrative review\b/i, /\bscoping review\b/i, /\breview article\b/i];

function toFiniteInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeString(value).toLowerCase();
}

function toPubTypeList(enriched) {
  const list = Array.isArray(enriched?.pubTypes) ? enriched.pubTypes : [];
  return list.map((value) => normalizeLower(value)).filter(Boolean);
}

function anyMatches(patterns, text) {
  if (!text) return false;
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeAliasList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((alias) => normalizeLower(alias)).filter(Boolean);
}

function buildAllowListLookup(allowList) {
  const byAlias = new Map();
  const byInstitution = new Map();
  if (!Array.isArray(allowList)) return { byAlias, byInstitution };
  for (const entry of allowList) {
    if (!entry || typeof entry !== "object") continue;
    const canonical = normalizeString(entry.name);
    const aliasList = normalizeAliasList(entry.aliases);
    const canonicalLower = normalizeLower(canonical);
    if (canonicalLower) aliasList.push(canonicalLower);
    for (const alias of aliasList) {
      if (!byAlias.has(alias)) {
        byAlias.set(alias, canonical || alias);
      }
    }
    const institutionId = normalizeString(entry.openAlexInstitutionId);
    if (institutionId) {
      byInstitution.set(institutionId, canonical || institutionId);
    }
  }
  return { byAlias, byInstitution };
}

function matchAllowList(text, byAlias) {
  if (!text || byAlias.size === 0) return "";
  const lower = normalizeLower(text);
  if (!lower) return "";
  if (byAlias.has(lower)) return byAlias.get(lower);
  for (const [alias, canonical] of byAlias.entries()) {
    if (alias.length < 4) continue;
    if (lower.includes(alias)) return canonical;
  }
  return "";
}

function detectExcludedSubtype(pubTypesLower, titleLower, workTypeLower) {
  const haystack = [workTypeLower, ...pubTypesLower, titleLower].filter(Boolean);
  for (const [subtype, patterns] of Object.entries(EXCLUDED_SUBTYPES)) {
    for (const text of haystack) {
      if (anyMatches(patterns, text)) return subtype;
    }
  }
  return "";
}

function deriveWorkType(enriched) {
  const types = toPubTypeList(enriched);
  const workType = normalizeLower(enriched?.workType || enriched?.openAlexWorkType);
  if (workType) return workType;
  return types.length > 0 ? types[0] : "";
}

export function classifyPublicationType(entry, options = {}) {
  const enriched = entry?.enriched && typeof entry.enriched === "object" ? entry.enriched : {};
  const title = normalizeString(entry?.title || enriched?.title);
  const titleLower = title.toLowerCase();
  const pubTypesLower = toPubTypeList(enriched);
  const workTypeLower = deriveWorkType(enriched);
  const publisher = normalizeString(enriched?.publisher);
  const venue = normalizeString(enriched?.venue);
  const hasPmid = !!normalizeString(entry?.pmid);
  const hasDoi = !!normalizeString(entry?.doi);
  const hasOpenAlexId = !!normalizeString(entry?.openAlexId);
  const institutionIds = Array.isArray(enriched?.institutionIds) ? enriched.institutionIds : [];

  const allowListLookup =
    options.__allowListCache || buildAllowListLookup(options.guidelinePublisherAllowList || []);

  const signals = [];

  const excludedSubtype = detectExcludedSubtype(pubTypesLower, titleLower, workTypeLower);
  if (excludedSubtype) {
    signals.push(`excluded:${excludedSubtype}`);
    return {
      tier: "excluded",
      subtype: excludedSubtype,
      confidence: "high",
      signals,
    };
  }

  const matchesGuidelinePubType = pubTypesLower.some(
    (type) => type === "guideline" || type === "practice guideline"
  );
  if (matchesGuidelinePubType) signals.push("pubmedPubTypeGuideline");

  const publisherMatch =
    matchAllowList(publisher, allowListLookup.byAlias) || matchAllowList(venue, allowListLookup.byAlias);
  if (publisherMatch) signals.push(`allowListPublisher:${publisherMatch}`);

  const institutionMatch = institutionIds
    .map((id) => allowListLookup.byInstitution.get(normalizeString(id)))
    .find(Boolean);
  if (institutionMatch) signals.push(`allowListInstitution:${institutionMatch}`);

  const titleLooksLikeGuideline = anyMatches(GUIDELINE_TITLE_PATTERNS, titleLower);
  if (titleLooksLikeGuideline) signals.push("guidelineTitlePattern");

  const workTypeLooksLikeReport =
    workTypeLower === "report" || workTypeLower === "standard" || workTypeLower === "review";

  const hasAllowListMatch = !!(publisherMatch || institutionMatch);
  if (matchesGuidelinePubType || hasAllowListMatch) {
    return { tier: "guideline_verified", confidence: "high", signals };
  }
  if (titleLooksLikeGuideline && workTypeLooksLikeReport) {
    return { tier: "guideline_candidate", confidence: "medium", signals };
  }
  if (titleLooksLikeGuideline && (hasDoi || hasOpenAlexId)) {
    return { tier: "guideline_candidate", confidence: "low", signals };
  }

  if (
    pubTypesLower.some((type) => type.includes("systematic review") || type.includes("meta-analysis") || type.includes("meta analysis"))
  ) {
    signals.push("pubTypeSystematicReview");
    return { tier: "systematic_review_or_meta", confidence: "high", signals };
  }
  if (anyMatches(SYSTEMATIC_REVIEW_TITLE_PATTERNS, titleLower)) {
    signals.push("titlePatternSystematicReview");
    return { tier: "systematic_review_or_meta", confidence: "medium", signals };
  }

  if (pubTypesLower.some((type) => type.includes("randomized controlled trial") || type.includes("randomised controlled trial"))) {
    signals.push("pubTypeRCT");
    return { tier: "randomized_controlled_trial", confidence: "high", signals };
  }
  if (anyMatches(RCT_TITLE_PATTERNS, titleLower)) {
    signals.push("titlePatternRCT");
    return { tier: "randomized_controlled_trial", confidence: "medium", signals };
  }

  if (pubTypesLower.some((type) => type.includes("clinical trial"))) {
    signals.push("pubTypeClinicalTrial");
    return { tier: "clinical_trial", confidence: "high", signals };
  }
  if (anyMatches(CLINICAL_TRIAL_TITLE_PATTERNS, titleLower)) {
    signals.push("titlePatternClinicalTrial");
    return { tier: "clinical_trial", confidence: "medium", signals };
  }

  if (pubTypesLower.some((type) => type === "review" || type === "review article")) {
    signals.push("pubTypeReview");
    return { tier: "review", confidence: "high", signals };
  }
  if (anyMatches(REVIEW_TITLE_PATTERNS, titleLower)) {
    signals.push("titlePatternReview");
    return { tier: "review", confidence: "medium", signals };
  }

  if (workTypeLower === "dissertation" || workTypeLower === "thesis") {
    signals.push("workTypeDissertation");
    return { tier: "dissertation", confidence: "high", signals };
  }
  if (workTypeLower === "book") {
    signals.push("workTypeBook");
    return { tier: "book", confidence: "high", signals };
  }
  if (workTypeLower === "book-chapter" || workTypeLower === "book chapter") {
    signals.push("workTypeBookChapter");
    return { tier: "book_chapter", confidence: "high", signals };
  }
  if (workTypeLower === "preprint") {
    signals.push("workTypePreprint");
    return { tier: "preprint", confidence: "high", signals };
  }

  if (workTypeLower === "report" || workTypeLower === "standard") {
    if (publisherMatch || institutionMatch) {
      signals.push("workTypeReportWithAllowList");
      return { tier: "report_verified", confidence: "high", signals };
    }
    signals.push("workTypeReportGeneric");
    return { tier: "report_generic", confidence: "medium", signals };
  }

  if (
    pubTypesLower.some(
      (type) =>
        type === "editorial" ||
        type === "letter" ||
        type === "comment" ||
        type === "news" ||
        type === "correspondence"
    )
  ) {
    signals.push("pubTypeEditorialOrLetter");
    return { tier: "editorial_or_letter", confidence: "high", signals };
  }

  const isJournalArticle =
    workTypeLower === "article" ||
    workTypeLower === "journal-article" ||
    workTypeLower === "journal article" ||
    pubTypesLower.some((type) => type === "article" || type === "journal article");
  if (isJournalArticle) {
    signals.push("workTypeJournalArticle");
    return { tier: "research_article", confidence: "high", signals };
  }

  signals.push("fallbackResearchArticle");
  return {
    tier: "research_article",
    confidence: hasPmid ? "medium" : "low",
    signals,
  };
}

export function classifyMergedCandidates(entries, options = {}) {
  const allowListCache = buildAllowListLookup(options.guidelinePublisherAllowList || []);
  const enrichedOptions = { ...options, __allowListCache: allowListCache };
  return (Array.isArray(entries) ? entries : []).map((entry) =>
    classifyPublicationType(entry, enrichedOptions)
  );
}

export const CONFIDENCE_COEFFICIENTS = Object.freeze({
  high: 1.0,
  medium: 0.7,
  low: 0.4,
});

export function resolveConfidenceCoefficient(confidence) {
  const normalized = normalizeLower(confidence);
  if (normalized === "high") return CONFIDENCE_COEFFICIENTS.high;
  if (normalized === "medium") return CONFIDENCE_COEFFICIENTS.medium;
  if (normalized === "low") return CONFIDENCE_COEFFICIENTS.low;
  return 0;
}

export function computePubTypeTierBonus(classification, rerankConfig) {
  const tier = normalizeString(classification?.tier);
  if (!tier) return { value: 0, tier: "", confidence: "", adjustedBonus: 0 };
  const tiersConfig =
    rerankConfig?.pubTypeTiers && typeof rerankConfig.pubTypeTiers === "object"
      ? rerankConfig.pubTypeTiers
      : {};
  const tierEntry = tiersConfig[tier];
  const baseBonus = Number(
    tierEntry !== null && tierEntry !== undefined && typeof tierEntry === "object"
      ? tierEntry.bonus
      : tierEntry
  );
  if (!Number.isFinite(baseBonus) || baseBonus === 0) {
    return { value: 0, tier, confidence: classification?.confidence || "", adjustedBonus: 0 };
  }
  const coefficient = resolveConfidenceCoefficient(classification?.confidence);
  const adjustedBonus = baseBonus * coefficient;
  return {
    value: adjustedBonus,
    tier,
    confidence: classification?.confidence || "",
    adjustedBonus,
    baseBonus,
  };
}

export function isExcludedClassification(classification) {
  return normalizeString(classification?.tier) === "excluded";
}

// Exposed for tests only
export const __internals = {
  buildAllowListLookup,
  matchAllowList,
  detectExcludedSubtype,
  GUIDELINE_TITLE_PATTERNS,
  SYSTEMATIC_REVIEW_TITLE_PATTERNS,
  RCT_TITLE_PATTERNS,
  CLINICAL_TRIAL_TITLE_PATTERNS,
  toFiniteInt,
};
