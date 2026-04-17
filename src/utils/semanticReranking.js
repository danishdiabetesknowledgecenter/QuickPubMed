// Code-level defaults are kept as a safe fallback if backend/runtime config is missing,
// partially configured, or comes from an older install that does not expose every field yet.
//
// All hybrid quality signal defaults below are NEUTRAL so installations without updated
// config keep their existing ranking 1:1.
const DEFAULT_SEMANTIC_RERANK_CONFIG = Object.freeze({
  sourceWeights: {
    pubmed: 1.0,
    semanticScholar: 0.92,
    openAlex: 0.88,
    elicit: 0.9,
  },
  pmidBonus: 10,
  rankScale: 100,
  scoreScale: 20,
  fallbackSourceWeight: 0.8,
  overlapBonusPerExtraSource: 35,
  rrfK: 60,
  pubTypeWeights: {},
  recencyHalfLifeYears: null,
  recencyBonusMax: 0,
  oaBonus: 0,
  citationImpactClamp: [1.0, 1.0],
  retractionAction: "none",
  retractionPenalty: 1.0,
  clinicalBonus: 0,
  clinicalCitedByThreshold: 1000000,
  topicOverlapBonus: 0,
  authorityClamp: [1.0, 1.0],
});

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toFiniteInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function toBooleanOrNull(value) {
  if (value === true || value === false) return value;
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0") return false;
  }
  return null;
}

function normalizeClamp(value, fallback = [1.0, 1.0]) {
  if (!Array.isArray(value) || value.length !== 2) return fallback;
  const [minRaw, maxRaw] = value;
  const min = toFiniteNumber(minRaw);
  const max = toFiniteNumber(maxRaw);
  if (min === null || max === null) return fallback;
  return min <= max ? [min, max] : fallback;
}

function clampTo(value, clamp) {
  if (!Array.isArray(clamp) || clamp.length !== 2) return value;
  const [min, max] = clamp;
  if (!Number.isFinite(min) || !Number.isFinite(max)) return value;
  return Math.max(min, Math.min(max, value));
}

function normalizePmidValue(value) {
  const pmid = String(value || "").trim();
  return /^[0-9]+$/.test(pmid) ? pmid : "";
}

function normalizeDoiValue(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

function dedupeStringValues(values, normalizer = (value) => String(value || "").trim()) {
  const seen = new Set();
  const deduped = [];
  for (const value of Array.isArray(values) ? values : []) {
    const normalized = normalizer(value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(normalized);
  }
  return deduped;
}

function getSourceSummary(sourceResults) {
  return (Array.isArray(sourceResults) ? sourceResults : []).map((sourceResult) => ({
    source: sourceResult?.source || "",
    query: sourceResult?.query || "",
    total: Number(sourceResult?.total || 0),
    candidateCount: Array.isArray(sourceResult?.candidates) ? sourceResult.candidates.length : 0,
    pmidCount: Array.isArray(sourceResult?.pmids) ? sourceResult.pmids.length : 0,
    doiCount: Array.isArray(sourceResult?.dois) ? sourceResult.dois.length : 0,
    hasError: !!sourceResult?.error,
  }));
}

function getSourceStats(sourceResults) {
  return (Array.isArray(sourceResults) ? sourceResults : []).reduce((stats, sourceResult) => {
    const sourceKey = String(sourceResult?.source || "").trim();
    if (!sourceKey) return stats;

    const candidates = Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : [];
    const numericScores = candidates
      .map((candidate) => Number(candidate?.score))
      .filter((score) => Number.isFinite(score));

    stats[sourceKey] = {
      candidateCount: candidates.length,
      minScore: numericScores.length > 0 ? Math.min(...numericScores) : null,
      maxScore: numericScores.length > 0 ? Math.max(...numericScores) : null,
    };

    return stats;
  }, {});
}

// Priority list used when a field is provided by multiple sources. Lower index wins
// as long as the higher-priority source supplies a non-null value.
const ENRICHED_SOURCE_PRIORITY = ["openAlex", "semanticScholar", "pubmed", "elicit"];

function createEnrichedRecord() {
  return {
    publicationYear: null,
    publicationYearSource: "",
    publicationDate: "",
    publicationDateSource: "",
    pubTypes: [],
    fwci: null,
    citedByCount: null,
    citedByCountBySource: {},
    influentialCitationCount: null,
    isRetracted: null,
    isOpenAccess: null,
    primaryTopicId: "",
    primaryTopicDisplayName: "",
    s2FieldsOfStudy: [],
    journalSourceId: "",
    authorIds: [],
    rcr: null,
    nihPercentile: null,
    isClinical: null,
    citedByClin: null,
    apt: null,
    fieldCitationRate: null,
    authorityAuthors: null,
    authorityJournal: null,
  };
}

function preferByPriority(currentValue, currentSource, incomingValue, incomingSource) {
  if (incomingValue === null || incomingValue === undefined || incomingValue === "") {
    return { value: currentValue, source: currentSource };
  }
  if (currentValue === null || currentValue === undefined || currentValue === "") {
    return { value: incomingValue, source: incomingSource };
  }
  const currentIndex = ENRICHED_SOURCE_PRIORITY.indexOf(currentSource);
  const incomingIndex = ENRICHED_SOURCE_PRIORITY.indexOf(incomingSource);
  const currentRank = currentIndex < 0 ? ENRICHED_SOURCE_PRIORITY.length : currentIndex;
  const incomingRank = incomingIndex < 0 ? ENRICHED_SOURCE_PRIORITY.length : incomingIndex;
  if (incomingRank < currentRank) {
    return { value: incomingValue, source: incomingSource };
  }
  return { value: currentValue, source: currentSource };
}

function mergeEnrichedFromCandidate(enriched, candidate) {
  const sourceKey = String(candidate?.source || "").trim();
  const metadata = candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};

  const yearFromMetadata = (() => {
    const raw = metadata.publicationYear ?? metadata.year;
    const number = toFiniteInt(raw);
    return number && number > 1000 ? number : null;
  })();
  if (yearFromMetadata !== null) {
    const result = preferByPriority(
      enriched.publicationYear,
      enriched.publicationYearSource,
      yearFromMetadata,
      sourceKey
    );
    enriched.publicationYear = result.value;
    enriched.publicationYearSource = result.source;
  }

  const dateFromMetadata = String(metadata.publicationDate || "").trim();
  if (dateFromMetadata) {
    const result = preferByPriority(
      enriched.publicationDate,
      enriched.publicationDateSource,
      dateFromMetadata,
      sourceKey
    );
    enriched.publicationDate = result.value;
    enriched.publicationDateSource = result.source;
  }

  const metadataPubTypes = Array.isArray(metadata.pubTypes)
    ? metadata.pubTypes
    : Array.isArray(metadata.publicationTypes)
    ? metadata.publicationTypes
    : [];
  if (metadataPubTypes.length > 0) {
    const existing = new Set(enriched.pubTypes);
    for (const rawType of metadataPubTypes) {
      const normalized = String(rawType || "").trim();
      if (normalized) existing.add(normalized);
    }
    if (metadata.workType) {
      const normalizedWorkType = String(metadata.workType).trim();
      if (normalizedWorkType) existing.add(normalizedWorkType);
    }
    enriched.pubTypes = Array.from(existing);
  } else if (metadata.workType) {
    const normalizedWorkType = String(metadata.workType).trim();
    if (normalizedWorkType) {
      const existing = new Set(enriched.pubTypes);
      existing.add(normalizedWorkType);
      enriched.pubTypes = Array.from(existing);
    }
  }

  const fwciValue = toFiniteNumber(metadata.fwci);
  if (fwciValue !== null && enriched.fwci === null) {
    enriched.fwci = fwciValue;
  }

  const citedByCountValue = toFiniteInt(metadata.citedByCount ?? metadata.citationCount);
  if (citedByCountValue !== null) {
    if (sourceKey) enriched.citedByCountBySource[sourceKey] = citedByCountValue;
    if (enriched.citedByCount === null || citedByCountValue > enriched.citedByCount) {
      enriched.citedByCount = citedByCountValue;
    }
  }

  const influentialValue = toFiniteInt(metadata.influentialCitationCount);
  if (influentialValue !== null && enriched.influentialCitationCount === null) {
    enriched.influentialCitationCount = influentialValue;
  }

  const retractedValue = toBooleanOrNull(metadata.isRetracted);
  if (retractedValue === true) {
    enriched.isRetracted = true;
  } else if (retractedValue === false && enriched.isRetracted !== true) {
    enriched.isRetracted = false;
  }

  const oaValue = toBooleanOrNull(metadata.isOpenAccess);
  if (oaValue === true) {
    enriched.isOpenAccess = true;
  } else if (oaValue === false && enriched.isOpenAccess !== true) {
    enriched.isOpenAccess = false;
  }

  const topicId = String(metadata.primaryTopicId || "").trim();
  if (topicId && !enriched.primaryTopicId) {
    enriched.primaryTopicId = topicId;
  }
  const topicName = String(metadata.primaryTopicDisplayName || "").trim();
  if (topicName && !enriched.primaryTopicDisplayName) {
    enriched.primaryTopicDisplayName = topicName;
  }

  const s2Fields = Array.isArray(metadata.s2FieldsOfStudy) ? metadata.s2FieldsOfStudy : [];
  if (s2Fields.length > 0) {
    const existing = new Set(enriched.s2FieldsOfStudy);
    for (const field of s2Fields) {
      const normalized = String(field || "").trim();
      if (normalized) existing.add(normalized);
    }
    enriched.s2FieldsOfStudy = Array.from(existing);
  }

  const journalId = String(metadata.journalSourceId || "").trim();
  if (journalId && !enriched.journalSourceId) {
    enriched.journalSourceId = journalId;
  }

  const authorIds = Array.isArray(metadata.authorIds) ? metadata.authorIds : [];
  if (authorIds.length > 0) {
    const existing = new Set(enriched.authorIds);
    for (const authorId of authorIds) {
      const normalized = String(authorId || "").trim();
      if (normalized) existing.add(normalized);
    }
    enriched.authorIds = Array.from(existing);
  }

  const icite = metadata.icite && typeof metadata.icite === "object" ? metadata.icite : null;
  if (icite) {
    const rcrValue = toFiniteNumber(icite.relativeCitationRatio ?? icite.rcr);
    if (rcrValue !== null) enriched.rcr = rcrValue;

    const nihPercentileValue = toFiniteNumber(icite.nihPercentile);
    if (nihPercentileValue !== null) enriched.nihPercentile = nihPercentileValue;

    const isClinicalValue = toBooleanOrNull(icite.isClinical);
    if (isClinicalValue === true) enriched.isClinical = true;
    else if (isClinicalValue === false && enriched.isClinical !== true) enriched.isClinical = false;

    const citedByClinValue = toFiniteInt(icite.citedByClin);
    if (citedByClinValue !== null) enriched.citedByClin = citedByClinValue;

    const aptValue = toFiniteNumber(icite.apt);
    if (aptValue !== null) enriched.apt = aptValue;

    const fieldRateValue = toFiniteNumber(icite.fieldCitationRate);
    if (fieldRateValue !== null) enriched.fieldCitationRate = fieldRateValue;
  }

  const authorityAuthorsIncoming = metadata.authorityAuthors && typeof metadata.authorityAuthors === "object"
    ? metadata.authorityAuthors
    : null;
  if (authorityAuthorsIncoming) {
    const maxHIndex = toFiniteInt(authorityAuthorsIncoming.maxHIndex);
    if (maxHIndex !== null) {
      if (!enriched.authorityAuthors) enriched.authorityAuthors = { maxHIndex };
      else if (enriched.authorityAuthors.maxHIndex === null || maxHIndex > enriched.authorityAuthors.maxHIndex) {
        enriched.authorityAuthors.maxHIndex = maxHIndex;
      }
    }
  }

  const authorityJournalIncoming = metadata.authorityJournal && typeof metadata.authorityJournal === "object"
    ? metadata.authorityJournal
    : null;
  if (authorityJournalIncoming) {
    if (!enriched.authorityJournal) enriched.authorityJournal = { meanCitedness: null, hIndex: null, isInDoaj: null };
    const meanCitedness = toFiniteNumber(authorityJournalIncoming.meanCitedness);
    if (meanCitedness !== null && enriched.authorityJournal.meanCitedness === null) {
      enriched.authorityJournal.meanCitedness = meanCitedness;
    }
    const journalHIndex = toFiniteInt(authorityJournalIncoming.hIndex);
    if (journalHIndex !== null && enriched.authorityJournal.hIndex === null) {
      enriched.authorityJournal.hIndex = journalHIndex;
    }
    const doajValue = toBooleanOrNull(authorityJournalIncoming.isInDoaj);
    if (doajValue !== null && enriched.authorityJournal.isInDoaj === null) {
      enriched.authorityJournal.isInDoaj = doajValue;
    }
  }
}

function mergeSourceCandidates(sourceResults) {
  const mergedCandidates = new Map();
  const mergeEvents = [];
  let rawCandidateCount = 0;

  (Array.isArray(sourceResults) ? sourceResults : []).forEach((sourceResult) => {
    (Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : []).forEach((candidate) => {
      rawCandidateCount += 1;
      const pmid = normalizePmidValue(candidate?.pmid);
      const doi = normalizeDoiValue(candidate?.doi);
      const key = pmid ? `pmid:${pmid}` : doi ? `doi:${doi.toLowerCase()}` : "";
      if (!key) return;

      const existingEntry = mergedCandidates.get(key);
      if (!mergedCandidates.has(key)) {
        mergedCandidates.set(key, {
          pmid,
          doi,
          title: String(candidate?.title || "").trim(),
          openAlexId: String(candidate?.openAlexId || "").trim(),
          sources: new Map(),
          enriched: createEnrichedRecord(),
        });
      } else {
        mergeEvents.push({
          key,
          mergedIntoKey: key,
          source: String(candidate?.source || "").trim(),
          pmid,
          doi,
          title: String(candidate?.title || "").trim(),
          existingSources: Array.from(existingEntry?.sources?.keys?.() || []),
        });
      }

      const entry = mergedCandidates.get(key);
      const sourceKey = String(candidate?.source || "").trim();
      const candidateRank = Number(candidate?.rank);
      const candidateScore = Number(candidate?.score);
      const previous = entry.sources.get(sourceKey);

      if (
        sourceKey &&
        (
          !previous ||
          (
            Number.isFinite(candidateRank) &&
            (!Number.isFinite(previous.rank) || candidateRank < previous.rank)
          )
        )
      ) {
        entry.sources.set(sourceKey, {
          rank: Number.isFinite(candidateRank) ? candidateRank : Number.POSITIVE_INFINITY,
          score: Number.isFinite(candidateScore) ? candidateScore : null,
        });
      }

      if (!entry.pmid && pmid) entry.pmid = pmid;
      if (!entry.doi && doi) entry.doi = doi;
      if (!entry.title && candidate?.title) entry.title = String(candidate.title).trim();
      if (!entry.openAlexId && candidate?.openAlexId) {
        entry.openAlexId = String(candidate.openAlexId).trim();
      }

      mergeEnrichedFromCandidate(entry.enriched, candidate);
    });
  });

  return {
    mergedCandidates,
    mergeEvents,
    rawCandidateCount,
  };
}

function getBestRank(entry) {
  const ranks = Array.from(entry?.sources?.values?.() || [])
    .map((sourceData) => Number(sourceData?.rank))
    .filter((rank) => Number.isFinite(rank));
  return ranks.length > 0 ? Math.min(...ranks) : Number.POSITIVE_INFINITY;
}

function buildRankContribution(sourceData, sourceKey, rerankConfig) {
  const sourceWeight = rerankConfig.sourceWeights[sourceKey] ?? rerankConfig.fallbackSourceWeight;
  const rank = Number.isFinite(Number(sourceData?.rank))
    ? Math.max(1, Number(sourceData.rank))
    : Number.POSITIVE_INFINITY;
  const weightedRrf =
    Number.isFinite(rank)
      ? (sourceWeight * rerankConfig.rankScale * rerankConfig.rrfK) / (rerankConfig.rrfK + rank)
      : 0;

  return {
    rank,
    sourceWeight,
    weightedRrf,
  };
}

function buildScoreTieBreaker(sourceData, sourceKey, sourceStats, rerankConfig) {
  const rawScore = Number(sourceData?.score);
  if (!Number.isFinite(rawScore)) {
    return null;
  }

  const sourceStat = sourceStats?.[sourceKey] || {};
  const minScore = Number(sourceStat.minScore);
  const maxScore = Number(sourceStat.maxScore);
  if (!Number.isFinite(minScore) || !Number.isFinite(maxScore)) {
    return null;
  }

  const normalizedScore = maxScore > minScore ? (rawScore - minScore) / (maxScore - minScore) : 1;
  const sourceWeight = rerankConfig.sourceWeights[sourceKey] ?? rerankConfig.fallbackSourceWeight;
  return {
    rawScore,
    normalizedScore,
    value: normalizedScore * sourceWeight * rerankConfig.scoreScale,
  };
}

function computeRecencyBonus(enriched, rerankConfig, currentYear) {
  const halfLife = toFiniteNumber(rerankConfig?.recencyHalfLifeYears);
  const maxBonus = toFiniteNumber(rerankConfig?.recencyBonusMax);
  if (!halfLife || halfLife <= 0 || !maxBonus || maxBonus <= 0) {
    return { value: 0, age: null, halfLife: halfLife || 0 };
  }
  const year = toFiniteInt(enriched?.publicationYear);
  if (year === null) {
    return { value: 0, age: null, halfLife };
  }
  const reference = toFiniteInt(currentYear) ?? new Date().getFullYear();
  const age = Math.max(0, reference - year);
  return {
    value: maxBonus * Math.exp(-age / halfLife),
    age,
    halfLife,
  };
}

function computePubTypeBonus(enriched, rerankConfig) {
  const weights =
    rerankConfig?.pubTypeWeights && typeof rerankConfig.pubTypeWeights === "object"
      ? rerankConfig.pubTypeWeights
      : {};
  const pubTypes = Array.isArray(enriched?.pubTypes) ? enriched.pubTypes : [];
  const weightKeys = Object.keys(weights);
  if (pubTypes.length === 0 || weightKeys.length === 0) {
    return { value: 0, matchedType: "" };
  }

  const normalizedWeightMap = new Map();
  for (const key of weightKeys) {
    const numericWeight = toFiniteNumber(weights[key]);
    if (numericWeight === null) continue;
    normalizedWeightMap.set(String(key).trim().toLowerCase(), numericWeight);
  }

  let best = 0;
  let matchedType = "";
  for (const type of pubTypes) {
    const normalized = String(type || "").trim().toLowerCase();
    if (!normalized) continue;
    const weight = normalizedWeightMap.get(normalized);
    if (weight !== undefined && weight > best) {
      best = weight;
      matchedType = normalized;
    }
  }
  return { value: best, matchedType };
}

function computeOpenAccessBonus(enriched, rerankConfig) {
  const bonus = toFiniteNumber(rerankConfig?.oaBonus);
  if (!bonus) return 0;
  return enriched?.isOpenAccess === true ? bonus : 0;
}

function computeClinicalBonus(enriched, rerankConfig) {
  const bonus = toFiniteNumber(rerankConfig?.clinicalBonus);
  if (!bonus) return { value: 0, reason: "" };
  if (enriched?.isClinical === true) {
    return { value: bonus, reason: "isClinical" };
  }
  const threshold = toFiniteNumber(rerankConfig?.clinicalCitedByThreshold);
  const citedByClin = toFiniteInt(enriched?.citedByClin);
  if (threshold !== null && citedByClin !== null && citedByClin >= threshold) {
    return { value: bonus, reason: "citedByClinThreshold" };
  }
  return { value: 0, reason: "" };
}

function computeCitationImpactMultiplier(enriched, rerankConfig) {
  const clamp = normalizeClamp(rerankConfig?.citationImpactClamp, [1.0, 1.0]);
  if (clamp[0] === 1.0 && clamp[1] === 1.0) {
    return { multiplier: 1.0, signal: "disabled", rawValue: null };
  }

  const rcr = toFiniteNumber(enriched?.rcr);
  if (rcr !== null) {
    const factor = Math.log1p(Math.max(0, rcr));
    return {
      multiplier: clampTo(1.0 + factor * 0.5, clamp),
      signal: "rcr",
      rawValue: rcr,
    };
  }

  const fwci = toFiniteNumber(enriched?.fwci);
  if (fwci !== null) {
    const factor = Math.log1p(Math.max(0, fwci));
    return {
      multiplier: clampTo(1.0 + factor * 0.5, clamp),
      signal: "fwci",
      rawValue: fwci,
    };
  }

  const influential = toFiniteInt(enriched?.influentialCitationCount);
  if (influential !== null) {
    const factor = Math.log1p(Math.max(0, influential)) / Math.log(10);
    return {
      multiplier: clampTo(1.0 + factor * 0.15, clamp),
      signal: "influentialCitationCount",
      rawValue: influential,
    };
  }

  const citedByCount = toFiniteInt(enriched?.citedByCount);
  if (citedByCount !== null) {
    const factor = Math.log1p(Math.max(0, citedByCount)) / Math.log(10);
    return {
      multiplier: clampTo(1.0 + factor * 0.08, clamp),
      signal: "citedByCount",
      rawValue: citedByCount,
    };
  }

  return { multiplier: 1.0, signal: "none", rawValue: null };
}

function computeAuthorityMultiplier(enriched, rerankConfig) {
  const clamp = normalizeClamp(rerankConfig?.authorityClamp, [1.0, 1.0]);
  if (clamp[0] === 1.0 && clamp[1] === 1.0) {
    return { multiplier: 1.0, components: {} };
  }
  const authorHIndex = toFiniteInt(enriched?.authorityAuthors?.maxHIndex);
  const journalMean = toFiniteNumber(enriched?.authorityJournal?.meanCitedness);
  if (authorHIndex === null && journalMean === null) {
    return { multiplier: 1.0, components: {} };
  }
  const authorFactor =
    authorHIndex !== null ? (Math.log1p(Math.max(0, authorHIndex)) / Math.log(10)) * 0.04 : 0;
  const journalFactor = journalMean !== null ? Math.log1p(Math.max(0, journalMean)) * 0.04 : 0;
  return {
    multiplier: clampTo(1.0 + authorFactor + journalFactor, clamp),
    components: { authorHIndex, journalMean },
  };
}

function tokenizeIntentPhrase(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function buildIntentTokenSet(queryIntent) {
  const tokenSet = new Set();
  if (!queryIntent || typeof queryIntent !== "object") return tokenSet;

  const sources = [
    queryIntent.topicsEnglish,
    queryIntent.topicIntents,
    queryIntent.softHints,
    queryIntent.rawPhrases,
  ];
  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const phrase of source) {
      for (const token of tokenizeIntentPhrase(phrase)) {
        tokenSet.add(token);
      }
    }
  }
  return tokenSet;
}

function computeTopicOverlapBonus(enriched, rerankConfig, intentTokens) {
  const bonus = toFiniteNumber(rerankConfig?.topicOverlapBonus);
  if (!bonus || !intentTokens || intentTokens.size === 0) {
    return { value: 0, matchRatio: 0, matches: [] };
  }

  const candidateTokens = new Set();
  const topicLabel = String(enriched?.primaryTopicDisplayName || "").trim();
  if (topicLabel) {
    for (const token of tokenizeIntentPhrase(topicLabel)) {
      candidateTokens.add(token);
    }
  }
  const s2Fields = Array.isArray(enriched?.s2FieldsOfStudy) ? enriched.s2FieldsOfStudy : [];
  for (const field of s2Fields) {
    for (const token of tokenizeIntentPhrase(field)) {
      candidateTokens.add(token);
    }
  }

  if (candidateTokens.size === 0) {
    return { value: 0, matchRatio: 0, matches: [] };
  }

  const matches = [];
  for (const token of candidateTokens) {
    if (intentTokens.has(token)) {
      matches.push(token);
    }
  }
  if (matches.length === 0) {
    return { value: 0, matchRatio: 0, matches: [] };
  }

  const matchRatio = Math.min(1, matches.length / intentTokens.size);
  return {
    value: bonus * matchRatio,
    matchRatio,
    matches,
  };
}

function computeRetractionImpact(enriched, rerankConfig) {
  const action = String(rerankConfig?.retractionAction || "none").toLowerCase();
  const isRetracted = enriched?.isRetracted === true;
  if (!isRetracted) {
    return { action: "none", multiplier: 1.0, retracted: false };
  }
  if (action === "filter") {
    return { action: "filter", multiplier: 1.0, retracted: true };
  }
  if (action === "penalty") {
    const penalty = toFiniteNumber(rerankConfig?.retractionPenalty);
    const multiplier = penalty !== null && penalty >= 0 ? penalty : 1.0;
    return { action: "penalty", multiplier, retracted: true };
  }
  return { action: "none", multiplier: 1.0, retracted: true };
}

function buildDebugEntry(entry, rerankConfig, sourceStats, mode = "multi", currentYear, intentTokens) {
  const contributions = [];
  let baseScore = 0;
  let scoreTieBreaker = 0;
  let pmidBonus = 0;
  let overlapBonus = 0;
  let rrfScore = 0;
  const sourceBreakdown = [];

  if (entry.pmid) {
    pmidBonus = rerankConfig.pmidBonus;
    baseScore += pmidBonus;
    contributions.push({
      type: "pmidBonus",
      value: pmidBonus,
    });
  }

  entry.sources.forEach((sourceData, sourceKey) => {
    const rankInfo = buildRankContribution(sourceData, sourceKey, rerankConfig);
    rrfScore += rankInfo.weightedRrf;
    baseScore += rankInfo.weightedRrf;
    const rankContribution = {
      type: mode === "single" ? "nativeSourceRank" : "weightedRrfRank",
      source: sourceKey,
      rank: rankInfo.rank,
      k: rerankConfig.rrfK,
      weight: rankInfo.sourceWeight,
      value: Number(rankInfo.weightedRrf.toFixed(4)),
    };
    contributions.push(rankContribution);

    const sourceEntry = {
      source: sourceKey,
      rank: rankInfo.rank,
      weight: rankInfo.sourceWeight,
      weightedRrf: Number(rankInfo.weightedRrf.toFixed(4)),
      rawScore: null,
      normalizedScore: null,
      scoreTieBreakerValue: 0,
    };

    const scoreInfo = buildScoreTieBreaker(sourceData, sourceKey, sourceStats, rerankConfig);
    if (scoreInfo) {
      scoreTieBreaker += scoreInfo.value;
      const scoreContribution = {
        type: "sourceScoreTieBreaker",
        source: sourceKey,
        rawScore: scoreInfo.rawScore,
        normalizedScore: Number(scoreInfo.normalizedScore.toFixed(4)),
        value: Number(scoreInfo.value.toFixed(4)),
      };
      contributions.push(scoreContribution);
      sourceEntry.rawScore = scoreInfo.rawScore;
      sourceEntry.normalizedScore = Number(scoreInfo.normalizedScore.toFixed(4));
      sourceEntry.scoreTieBreakerValue = Number(scoreInfo.value.toFixed(4));
    }

    sourceBreakdown.push(sourceEntry);
  });

  if (mode === "multi" && entry.sources.size > 1) {
    overlapBonus = (entry.sources.size - 1) * rerankConfig.overlapBonusPerExtraSource;
    baseScore += overlapBonus;
    contributions.push({
      type: "overlapBonus",
      sourceCount: entry.sources.size,
      value: overlapBonus,
    });
  }

  // --- Hybrid quality signals (additive + multiplicative) ---
  const enriched = entry.enriched || createEnrichedRecord();

  const recencyInfo = computeRecencyBonus(enriched, rerankConfig, currentYear);
  if (recencyInfo.value !== 0) {
    contributions.push({
      type: "recencyBonus",
      year: enriched.publicationYear,
      age: recencyInfo.age,
      halfLife: recencyInfo.halfLife,
      value: Number(recencyInfo.value.toFixed(4)),
    });
  }

  const pubTypeInfo = computePubTypeBonus(enriched, rerankConfig);
  if (pubTypeInfo.value !== 0) {
    contributions.push({
      type: "pubTypeBonus",
      matchedType: pubTypeInfo.matchedType,
      value: Number(pubTypeInfo.value.toFixed(4)),
    });
  }

  const oaBonus = computeOpenAccessBonus(enriched, rerankConfig);
  if (oaBonus !== 0) {
    contributions.push({
      type: "oaBonus",
      value: Number(oaBonus.toFixed(4)),
    });
  }

  const clinicalInfo = computeClinicalBonus(enriched, rerankConfig);
  if (clinicalInfo.value !== 0) {
    contributions.push({
      type: "clinicalBonus",
      reason: clinicalInfo.reason,
      value: Number(clinicalInfo.value.toFixed(4)),
    });
  }

  const topicOverlapInfo = computeTopicOverlapBonus(enriched, rerankConfig, intentTokens);
  const topicOverlapBonus = topicOverlapInfo.value;
  if (topicOverlapBonus !== 0) {
    contributions.push({
      type: "topicOverlapBonus",
      matchRatio: Number(topicOverlapInfo.matchRatio.toFixed(4)),
      matches: topicOverlapInfo.matches,
      value: Number(topicOverlapBonus.toFixed(4)),
    });
  }

  const additiveQualityBonus =
    recencyInfo.value + pubTypeInfo.value + oaBonus + clinicalInfo.value + topicOverlapBonus;

  const citationImpactInfo = computeCitationImpactMultiplier(enriched, rerankConfig);
  if (citationImpactInfo.multiplier !== 1.0) {
    contributions.push({
      type: "citationImpactMultiplier",
      signal: citationImpactInfo.signal,
      rawValue: citationImpactInfo.rawValue,
      multiplier: Number(citationImpactInfo.multiplier.toFixed(4)),
    });
  }

  const authorityInfo = computeAuthorityMultiplier(enriched, rerankConfig);
  if (authorityInfo.multiplier !== 1.0) {
    contributions.push({
      type: "authorityMultiplier",
      components: authorityInfo.components,
      multiplier: Number(authorityInfo.multiplier.toFixed(4)),
    });
  }

  const retractionInfo = computeRetractionImpact(enriched, rerankConfig);
  if (retractionInfo.retracted) {
    contributions.push({
      type: "retractionImpact",
      action: retractionInfo.action,
      multiplier: Number(retractionInfo.multiplier.toFixed(4)),
    });
  }

  const qualityMultiplier =
    citationImpactInfo.multiplier * authorityInfo.multiplier * retractionInfo.multiplier;
  const combinedScore = (baseScore + additiveQualityBonus) * qualityMultiplier;

  return {
    ...entry,
    sources: Array.from(entry.sources.keys()),
    combinedScore: Number(combinedScore.toFixed(4)),
    scoreTieBreaker: Number(scoreTieBreaker.toFixed(4)),
    bestRank: getBestRank(entry),
    sourceCount: entry.sources.size,
    filtered: retractionInfo.action === "filter",
    filteredReason: retractionInfo.action === "filter" ? "retraction" : "",
    scoreBreakdown: {
      rrfScore: Number(rrfScore.toFixed(4)),
      overlapBonus: Number(overlapBonus.toFixed(4)),
      pmidBonus: Number(pmidBonus.toFixed(4)),
      scoreTieBreaker: Number(scoreTieBreaker.toFixed(4)),
      baseScore: Number(baseScore.toFixed(4)),
      additiveQualityBonus: Number(additiveQualityBonus.toFixed(4)),
      recencyBonus: Number(recencyInfo.value.toFixed(4)),
      pubTypeBonus: Number(pubTypeInfo.value.toFixed(4)),
      oaBonus: Number(oaBonus.toFixed(4)),
      clinicalBonus: Number(clinicalInfo.value.toFixed(4)),
      topicOverlapBonus: Number(topicOverlapBonus.toFixed(4)),
      citationImpactMultiplier: Number(citationImpactInfo.multiplier.toFixed(4)),
      authorityMultiplier: Number(authorityInfo.multiplier.toFixed(4)),
      retractionMultiplier: Number(retractionInfo.multiplier.toFixed(4)),
      qualityMultiplier: Number(qualityMultiplier.toFixed(4)),
    },
    sourceBreakdown,
    contributions,
  };
}

function buildOverlapSummary(candidates) {
  return (Array.isArray(candidates) ? candidates : []).reduce(
    (acc, candidate) => {
      const sourceCount = Number(candidate?.sourceCount || 0);
      if (sourceCount > 1) {
        acc.multiSource += 1;
      } else {
        acc.singleSource += 1;
      }
      if (candidate?.pmid) {
        acc.withPmid += 1;
      } else {
        acc.doiOnly += 1;
      }
      return acc;
    },
    {
      multiSource: 0,
      singleSource: 0,
      withPmid: 0,
      doiOnly: 0,
    }
  );
}

export function resolveSemanticRerankConfig(runtimeRerankConfig = {}) {
  const safeRuntimeConfig =
    runtimeRerankConfig && typeof runtimeRerankConfig === "object" ? runtimeRerankConfig : {};

  return {
    ...DEFAULT_SEMANTIC_RERANK_CONFIG,
    ...safeRuntimeConfig,
    sourceWeights: {
      ...DEFAULT_SEMANTIC_RERANK_CONFIG.sourceWeights,
      ...(safeRuntimeConfig.sourceWeights || {}),
    },
    pubTypeWeights: {
      ...DEFAULT_SEMANTIC_RERANK_CONFIG.pubTypeWeights,
      ...(safeRuntimeConfig.pubTypeWeights && typeof safeRuntimeConfig.pubTypeWeights === "object"
        ? safeRuntimeConfig.pubTypeWeights
        : {}),
    },
    citationImpactClamp: normalizeClamp(
      safeRuntimeConfig.citationImpactClamp,
      DEFAULT_SEMANTIC_RERANK_CONFIG.citationImpactClamp
    ),
    authorityClamp: normalizeClamp(
      safeRuntimeConfig.authorityClamp,
      DEFAULT_SEMANTIC_RERANK_CONFIG.authorityClamp
    ),
  };
}

function buildEnrichmentSummary(candidates, rerankConfig, filteredCount) {
  const summary = {
    withFwci: 0,
    withRcr: 0,
    withInfluentialCitations: 0,
    withCitedByCount: 0,
    withRetractionFlag: 0,
    filteredByRetraction: filteredCount,
    withClinicalFlag: 0,
    withCitedByClin: 0,
    withPubTypeMatch: 0,
    withOpenAccess: 0,
    withTopicOverlap: 0,
    withAuthorityData: 0,
    withRecencySignal: 0,
  };

  const pubTypeWeights =
    rerankConfig?.pubTypeWeights && typeof rerankConfig.pubTypeWeights === "object"
      ? rerankConfig.pubTypeWeights
      : {};
  const normalizedPubTypeKeys = new Set(
    Object.keys(pubTypeWeights).map((key) => String(key).trim().toLowerCase())
  );

  (Array.isArray(candidates) ? candidates : []).forEach((candidate) => {
    const enriched = candidate?.enriched || {};
    if (enriched.fwci !== null && enriched.fwci !== undefined) summary.withFwci += 1;
    if (enriched.rcr !== null && enriched.rcr !== undefined) summary.withRcr += 1;
    if (enriched.influentialCitationCount !== null && enriched.influentialCitationCount !== undefined)
      summary.withInfluentialCitations += 1;
    if (enriched.citedByCount !== null && enriched.citedByCount !== undefined)
      summary.withCitedByCount += 1;
    if (enriched.isRetracted === true) summary.withRetractionFlag += 1;
    if (enriched.isClinical === true) summary.withClinicalFlag += 1;
    if (enriched.citedByClin !== null && enriched.citedByClin !== undefined)
      summary.withCitedByClin += 1;
    if (enriched.isOpenAccess === true) summary.withOpenAccess += 1;
    if (enriched.publicationYear) summary.withRecencySignal += 1;
    if (
      (enriched.authorityAuthors && enriched.authorityAuthors.maxHIndex !== null) ||
      (enriched.authorityJournal &&
        (enriched.authorityJournal.meanCitedness !== null ||
          enriched.authorityJournal.hIndex !== null))
    ) {
      summary.withAuthorityData += 1;
    }
    if (Array.isArray(enriched.pubTypes) && normalizedPubTypeKeys.size > 0) {
      const hasMatch = enriched.pubTypes.some((type) =>
        normalizedPubTypeKeys.has(String(type || "").trim().toLowerCase())
      );
      if (hasMatch) summary.withPubTypeMatch += 1;
    }
    if (Number(candidate?.scoreBreakdown?.topicOverlapBonus) > 0) summary.withTopicOverlap += 1;
  });

  return summary;
}

export function rerankSemanticCandidates(sourceResults, runtimeRerankConfig = {}, options = {}) {
  const activeSourceResults = (Array.isArray(sourceResults) ? sourceResults : []).filter(
    (sourceResult) => Array.isArray(sourceResult?.candidates) && sourceResult.candidates.length > 0
  );
  const rerankConfig = resolveSemanticRerankConfig(runtimeRerankConfig);
  const sourceStats = getSourceStats(activeSourceResults);
  const sourceSummary = getSourceSummary(activeSourceResults);
  const rerankMode = activeSourceResults.length <= 1 ? "single" : "multi";
  const currentYear = new Date().getFullYear();
  const intentTokens = buildIntentTokenSet(options?.queryIntent);

  const mergeResult = mergeSourceCandidates(activeSourceResults);
  const builtCandidates = Array.from(mergeResult.mergedCandidates.values()).map((entry) =>
    buildDebugEntry(entry, rerankConfig, sourceStats, rerankMode, currentYear, intentTokens)
  );

  const filteredCandidates = builtCandidates.filter((candidate) => candidate.filtered === true);
  let rankedCandidates = builtCandidates.filter((candidate) => candidate.filtered !== true);

  if (rerankMode === "single") {
    rankedCandidates = rankedCandidates.sort((a, b) => {
      if (a.bestRank !== b.bestRank) {
        return a.bestRank - b.bestRank;
      }
      if (b.scoreTieBreaker !== a.scoreTieBreaker) {
        return b.scoreTieBreaker - a.scoreTieBreaker;
      }
      return 0;
    });
  } else {
    rankedCandidates = rankedCandidates.sort((a, b) => {
      if (b.combinedScore !== a.combinedScore) {
        return b.combinedScore - a.combinedScore;
      }
      if (b.scoreTieBreaker !== a.scoreTieBreaker) {
        return b.scoreTieBreaker - a.scoreTieBreaker;
      }
      if (a.bestRank !== b.bestRank) {
        return a.bestRank - b.bestRank;
      }
      return 0;
    });
  }

  const enrichmentSummary = buildEnrichmentSummary(
    rankedCandidates,
    rerankConfig,
    filteredCandidates.length
  );

  return {
    candidates: rankedCandidates,
    filteredCandidates,
    pmids: dedupeStringValues(
      rankedCandidates.map((candidate) => candidate.pmid),
      (value) => normalizePmidValue(value)
    ),
    dois: dedupeStringValues(
      rankedCandidates.map((candidate) => candidate.doi),
      (value) => normalizeDoiValue(value)
    ),
    rerankMode,
    diagnostics: {
      rerankConfig,
      sourceStats,
      sourceSummary,
      overlapSummary: buildOverlapSummary(rankedCandidates),
      enrichmentSummary,
      mergeSummary: {
        rawCandidateCount: mergeResult.rawCandidateCount,
        mergedCandidateCount: rankedCandidates.length,
        duplicateCount: mergeResult.mergeEvents.length,
        filteredCount: filteredCandidates.length,
      },
      mergeEvents: mergeResult.mergeEvents,
    },
  };
}
