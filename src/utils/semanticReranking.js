import {
  classifyPublicationType,
  computePubTypeTierBonus,
  isExcludedClassification,
} from "./pubTypeClassifier.js";

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
  // Trappet recency-kurve (global, piecewise linear).
  //   - Format: [[maxAge1, multiplier1], [maxAge2, multiplier2], ...]
  //   - Første trin definerer plateau (fuld multiplier op til maxAge1).
  //   - Mellem trin interpoleres lineært.
  //   - Efter sidste trin bruges sidste trin's multiplier som gulv.
  // Bruges kun når recencyCurveEnabled === true. Når disabled bruges
  // den klassiske eksponentielle halfLife-logik (uændret adfærd).
  recencyCurveEnabled: false,
  recencyCurve: [
    [5, 1.0],
    [10, 0.6],
    [25, 0.25],
  ],
  recencyMultiplierCurve: [],
  oaBonus: 0,
  citationImpactClamp: [1.0, 1.0],
  citationImpactSignalWeights: {
    rcr: 0.5,
    fwci: 0.5,
    nihPercentile: 0,
    fieldNormalizedCitationRatio: 0,
    influentialCitationCount: 0.15,
    citedByCount: 0.08,
  },
  translationPotentialBonusMax: 0,
  translationPotentialAptScale: 10,
  retractionAction: "none",
  retractionPenalty: 1.0,
  clinicalBonus: 0,
  clinicalCitedByThreshold: 1000000,
  topicOverlapBonus: 0,
  authorityClamp: [1.0, 1.0],
  dataQualityPenalties: {
    missingAbstract: 1.0,
    shortAbstract: 1.0,
    veryShortAbstract: 1.0,
    missingAuthor: 1.0,
    missingYear: 1.0,
  },
  abstractMinLength: {
    short: 100,
    veryShort: 250,
  },
  pubTypeTiers: {},
  guidelinePublisherAllowList: [],
});

function toFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPresentFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  return toFiniteNumber(value);
}

function toFiniteInt(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

function toPresentFiniteInt(value) {
  if (value === null || value === undefined || value === "") return null;
  return toFiniteInt(value);
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
  return (Array.isArray(sourceResults) ? sourceResults : []).map((sourceResult) => {
    const candidates = Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : [];
    return {
      source: sourceResult?.source || "",
      query: sourceResult?.query || "",
      total: Number(sourceResult?.total || 0),
      candidateCount: candidates.length,
      pmidCount: Array.isArray(sourceResult?.pmids) ? sourceResult.pmids.length : 0,
      doiCount: Array.isArray(sourceResult?.dois) ? sourceResult.dois.length : 0,
      hasError: !!sourceResult?.error,
      usedInRerank: candidates.length > 0,
    };
  });
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
    abstractLength: null,
    hasAuthor: false,
    language: "",
    publisher: "",
    venue: "",
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

  const abstractCandidates = [
    metadata.abstract,
    metadata.abstractText,
    metadata.tldr && typeof metadata.tldr === "object" ? metadata.tldr.text : null,
  ];
  for (const raw of abstractCandidates) {
    const text = String(raw || "").trim();
    if (!text) continue;
    const length = text.length;
    if (enriched.abstractLength === null || length > enriched.abstractLength) {
      enriched.abstractLength = length;
    }
  }

  const authorCandidates = [
    Array.isArray(metadata.authors) ? metadata.authors : null,
    Array.isArray(metadata.authorships) ? metadata.authorships : null,
    Array.isArray(metadata.authorNames) ? metadata.authorNames : null,
  ];
  for (const list of authorCandidates) {
    if (!list) continue;
    for (const author of list) {
      if (!author) continue;
      if (typeof author === "string" && author.trim()) {
        enriched.hasAuthor = true;
        break;
      }
      if (typeof author === "object") {
        const name = String(
          author?.name || author?.displayName || author?.display_name || author?.author?.display_name || ""
        ).trim();
        if (name) {
          enriched.hasAuthor = true;
          break;
        }
      }
    }
    if (enriched.hasAuthor) break;
  }
  if (!enriched.hasAuthor && Array.isArray(enriched.authorIds) && enriched.authorIds.length > 0) {
    enriched.hasAuthor = true;
  }

  const languageValue = String(metadata.language || "").trim();
  if (languageValue && !enriched.language) {
    enriched.language = languageValue;
  }
  const publisherValue = String(metadata.publisher || metadata.hostPublisher || "").trim();
  if (publisherValue && !enriched.publisher) {
    enriched.publisher = publisherValue;
  }
  const venueValue = String(
    metadata.venue || metadata.fulljournalname || metadata.sourceDisplayName || ""
  ).trim();
  if (venueValue && !enriched.venue) {
    enriched.venue = venueValue;
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

function mergeSourceCandidates(sourceResults, options = {}) {
  const mergedCandidates = new Map();
  const mergeEvents = [];
  let rawCandidateCount = 0;

  (Array.isArray(sourceResults) ? sourceResults : []).forEach((sourceResult) => {
    (Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : []).forEach((candidate) => {
      rawCandidateCount += 1;
      const pmid = normalizePmidValue(candidate?.pmid);
      const doi = normalizeDoiValue(candidate?.doi);
      const openAlexIdRaw = String(
        candidate?.openAlexId || candidate?.metadata?.workId || ""
      ).trim();
      const openAlexIdNormalized = openAlexIdRaw.toLowerCase();
      const key = pmid
        ? `pmid:${pmid}`
        : doi
        ? `doi:${doi.toLowerCase()}`
        : openAlexIdNormalized
        ? `oa:${openAlexIdNormalized}`
        : "";
      if (!key) return;

      const existingEntry = mergedCandidates.get(key);
      if (!mergedCandidates.has(key)) {
        mergedCandidates.set(key, {
          pmid,
          doi,
          title: String(candidate?.title || "").trim(),
          openAlexId: openAlexIdRaw,
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
      if (!entry.openAlexId && openAlexIdRaw) {
        entry.openAlexId = openAlexIdRaw;
      }

      mergeEnrichedFromCandidate(entry.enriched, candidate);
    });
  });

  const guidelinePublisherAllowList = Array.isArray(options.guidelinePublisherAllowList)
    ? options.guidelinePublisherAllowList
    : [];
  for (const entry of mergedCandidates.values()) {
    entry.pubTypeClassification = classifyPublicationType(entry, {
      guidelinePublisherAllowList,
    });
  }

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

function normalizeRecencyCurve(curve) {
  if (!Array.isArray(curve) || curve.length === 0) return null;
  const points = [];
  for (const entry of curve) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const age = toFiniteNumber(entry[0]);
    const multiplier = toFiniteNumber(entry[1]);
    if (age === null || multiplier === null || age < 0 || multiplier < 0) continue;
    points.push([age, multiplier]);
  }
  if (points.length === 0) return null;
  points.sort((a, b) => a[0] - b[0]);
  return points;
}

function computeRecencyCurveMultiplier(age, normalizedCurve) {
  if (!Array.isArray(normalizedCurve) || normalizedCurve.length === 0) return 1;
  if (age <= normalizedCurve[0][0]) return normalizedCurve[0][1];
  const last = normalizedCurve[normalizedCurve.length - 1];
  if (age >= last[0]) return last[1];
  for (let i = 0; i < normalizedCurve.length - 1; i += 1) {
    const [ageA, multA] = normalizedCurve[i];
    const [ageB, multB] = normalizedCurve[i + 1];
    if (age >= ageA && age <= ageB) {
      const span = ageB - ageA;
      if (span <= 0) return multB;
      const t = (age - ageA) / span;
      return multA + t * (multB - multA);
    }
  }
  return last[1];
}

function computeRecencyBonus(enriched, rerankConfig, currentYear) {
  const maxBonus = toFiniteNumber(rerankConfig?.recencyBonusMax);
  const curveEnabled = rerankConfig?.recencyCurveEnabled === true;
  const normalizedCurve = curveEnabled ? normalizeRecencyCurve(rerankConfig?.recencyCurve) : null;

  if (curveEnabled && normalizedCurve) {
    if (!maxBonus || maxBonus <= 0) {
      return { value: 0, age: null, halfLife: null, curveMultiplier: null };
    }
    const year = toFiniteInt(enriched?.publicationYear);
    if (year === null) {
      return { value: 0, age: null, halfLife: null, curveMultiplier: null };
    }
    const reference = toFiniteInt(currentYear) ?? new Date().getFullYear();
    const age = Math.max(0, reference - year);
    const multiplier = computeRecencyCurveMultiplier(age, normalizedCurve);
    return {
      value: maxBonus * multiplier,
      age,
      halfLife: null,
      curveMultiplier: multiplier,
    };
  }

  const halfLife = toFiniteNumber(rerankConfig?.recencyHalfLifeYears);
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

function computeRecencyMultiplier(enriched, rerankConfig, currentYear) {
  const normalizedCurve = normalizeRecencyCurve(rerankConfig?.recencyMultiplierCurve);
  if (!normalizedCurve) {
    return { multiplier: 1.0, age: null, curveMultiplier: null };
  }
  const year = toFiniteInt(enriched?.publicationYear);
  if (year === null) {
    return { multiplier: 1.0, age: null, curveMultiplier: null };
  }
  const reference = toFiniteInt(currentYear) ?? new Date().getFullYear();
  const age = Math.max(0, reference - year);
  const multiplier = computeRecencyCurveMultiplier(age, normalizedCurve);
  return {
    multiplier,
    age,
    curveMultiplier: multiplier,
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

  let best = null;
  let matchedType = "";
  for (const type of pubTypes) {
    const normalized = String(type || "").trim().toLowerCase();
    if (!normalized) continue;
    const weight = normalizedWeightMap.get(normalized);
    if (weight !== undefined && (best === null || weight > best)) {
      best = weight;
      matchedType = normalized;
    }
  }
  return { value: best ?? 0, matchedType };
}

function computeOpenAccessBonus(enriched, rerankConfig) {
  const bonus = toFiniteNumber(rerankConfig?.oaBonus);
  if (!bonus) return 0;
  return enriched?.isOpenAccess === true ? bonus : 0;
}

function getCitationImpactWeight(rerankConfig, signal) {
  const weights =
    rerankConfig?.citationImpactSignalWeights &&
    typeof rerankConfig.citationImpactSignalWeights === "object"
      ? rerankConfig.citationImpactSignalWeights
      : DEFAULT_SEMANTIC_RERANK_CONFIG.citationImpactSignalWeights;
  const weight = toFiniteNumber(weights?.[signal]);
  return weight !== null && weight > 0 ? weight : 0;
}

function computeTranslationPotentialBonus(enriched, rerankConfig) {
  const maxBonus = toFiniteNumber(rerankConfig?.translationPotentialBonusMax);
  if (!maxBonus || maxBonus <= 0) {
    return { value: 0, apt: null, factor: null };
  }
  const apt = toPresentFiniteNumber(enriched?.apt);
  if (apt === null || apt <= 0) {
    return { value: 0, apt: apt ?? null, factor: null };
  }
  const scale = toFiniteNumber(rerankConfig?.translationPotentialAptScale) || 10;
  const factor = clampTo(Math.log1p(apt) / Math.log1p(Math.max(1, scale)), [0, 1]);
  return {
    value: maxBonus * factor,
    apt,
    factor,
  };
}

function computeClinicalBonus(enriched, rerankConfig) {
  const bonus = toFiniteNumber(rerankConfig?.clinicalBonus);
  if (!bonus) return { value: 0, reason: "" };
  if (enriched?.isClinical === true) {
    return { value: bonus, reason: "isClinical" };
  }
  const threshold = toFiniteNumber(rerankConfig?.clinicalCitedByThreshold);
  const citedByClin = toPresentFiniteInt(enriched?.citedByClin);
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

  const rcr = toPresentFiniteNumber(enriched?.rcr);
  const rcrWeight = getCitationImpactWeight(rerankConfig, "rcr");
  if (rcr !== null && rcrWeight > 0) {
    const factor = Math.log1p(Math.max(0, rcr));
    return {
      multiplier: clampTo(1.0 + factor * rcrWeight, clamp),
      signal: "rcr",
      rawValue: rcr,
    };
  }

  const nihPercentile = toPresentFiniteNumber(enriched?.nihPercentile);
  const nihWeight = getCitationImpactWeight(rerankConfig, "nihPercentile");
  if (nihPercentile !== null && nihWeight > 0) {
    const percentileFactor = clampTo(nihPercentile / 100, [0, 1]);
    return {
      multiplier: clampTo(1.0 + percentileFactor * nihWeight, clamp),
      signal: "nihPercentile",
      rawValue: nihPercentile,
    };
  }

  const fwci = toPresentFiniteNumber(enriched?.fwci);
  const fwciWeight = getCitationImpactWeight(rerankConfig, "fwci");
  if (fwci !== null && fwciWeight > 0) {
    const factor = Math.log1p(Math.max(0, fwci));
    return {
      multiplier: clampTo(1.0 + factor * fwciWeight, clamp),
      signal: "fwci",
      rawValue: fwci,
    };
  }

  const citedByCount = toPresentFiniteInt(enriched?.citedByCount);
  const fieldCitationRate = toPresentFiniteNumber(enriched?.fieldCitationRate);
  const fieldNormalizedWeight = getCitationImpactWeight(
    rerankConfig,
    "fieldNormalizedCitationRatio"
  );
  if (
    citedByCount !== null &&
    fieldCitationRate !== null &&
    fieldCitationRate > 0 &&
    fieldNormalizedWeight > 0
  ) {
    const ratio = citedByCount / fieldCitationRate;
    const factor = Math.log1p(Math.max(0, ratio));
    return {
      multiplier: clampTo(1.0 + factor * fieldNormalizedWeight, clamp),
      signal: "fieldNormalizedCitationRatio",
      rawValue: Number(ratio.toFixed(4)),
    };
  }

  const influential = toPresentFiniteInt(enriched?.influentialCitationCount);
  const influentialWeight = getCitationImpactWeight(rerankConfig, "influentialCitationCount");
  if (influential !== null && influentialWeight > 0) {
    const factor = Math.log1p(Math.max(0, influential)) / Math.log(10);
    return {
      multiplier: clampTo(1.0 + factor * influentialWeight, clamp),
      signal: "influentialCitationCount",
      rawValue: influential,
    };
  }

  const citedByWeight = getCitationImpactWeight(rerankConfig, "citedByCount");
  if (citedByCount !== null && citedByWeight > 0) {
    const factor = Math.log1p(Math.max(0, citedByCount)) / Math.log(10);
    return {
      multiplier: clampTo(1.0 + factor * citedByWeight, clamp),
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

function computeDataQualityMultiplier(entry, rerankConfig) {
  const penalties =
    rerankConfig?.dataQualityPenalties && typeof rerankConfig.dataQualityPenalties === "object"
      ? rerankConfig.dataQualityPenalties
      : {};
  const thresholds =
    rerankConfig?.abstractMinLength && typeof rerankConfig.abstractMinLength === "object"
      ? rerankConfig.abstractMinLength
      : { short: 100, veryShort: 250 };

  const missingAbstractPenalty = toFiniteNumber(penalties.missingAbstract);
  const shortAbstractPenalty = toFiniteNumber(penalties.shortAbstract);
  const veryShortAbstractPenalty = toFiniteNumber(penalties.veryShortAbstract);
  const missingAuthorPenalty = toFiniteNumber(penalties.missingAuthor);
  const missingYearPenalty = toFiniteNumber(penalties.missingYear);

  const applied = {};
  let multiplier = 1.0;

  const enriched = entry?.enriched || {};
  const abstractLength = toFiniteInt(enriched.abstractLength);
  const shortThreshold = toFiniteInt(thresholds.short) ?? 100;
  const veryShortThreshold = toFiniteInt(thresholds.veryShort) ?? 250;

  if (abstractLength === null || abstractLength === 0) {
    if (missingAbstractPenalty !== null && missingAbstractPenalty !== 1.0) {
      multiplier *= missingAbstractPenalty;
      applied.missingAbstract = missingAbstractPenalty;
    }
  } else if (abstractLength < shortThreshold) {
    if (shortAbstractPenalty !== null && shortAbstractPenalty !== 1.0) {
      multiplier *= shortAbstractPenalty;
      applied.shortAbstract = shortAbstractPenalty;
    }
  } else if (abstractLength < veryShortThreshold) {
    if (veryShortAbstractPenalty !== null && veryShortAbstractPenalty !== 1.0) {
      multiplier *= veryShortAbstractPenalty;
      applied.veryShortAbstract = veryShortAbstractPenalty;
    }
  }

  if (!enriched.hasAuthor) {
    if (missingAuthorPenalty !== null && missingAuthorPenalty !== 1.0) {
      multiplier *= missingAuthorPenalty;
      applied.missingAuthor = missingAuthorPenalty;
    }
  }

  if (!enriched.publicationYear) {
    if (missingYearPenalty !== null && missingYearPenalty !== 1.0) {
      multiplier *= missingYearPenalty;
      applied.missingYear = missingYearPenalty;
    }
  }

  return {
    multiplier,
    applied,
    abstractLength,
  };
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
    const recencyContribution = {
      type: "recencyBonus",
      year: enriched.publicationYear,
      age: recencyInfo.age,
      halfLife: recencyInfo.halfLife,
      value: Number(recencyInfo.value.toFixed(4)),
    };
    if (typeof recencyInfo.curveMultiplier === "number") {
      recencyContribution.curveMultiplier = Number(recencyInfo.curveMultiplier.toFixed(4));
    }
    contributions.push(recencyContribution);
  }

  const pubTypeInfo = computePubTypeBonus(enriched, rerankConfig);
  if (pubTypeInfo.value !== 0) {
    contributions.push({
      type: "pubTypeBonus",
      matchedType: pubTypeInfo.matchedType,
      value: Number(pubTypeInfo.value.toFixed(4)),
    });
  }

  const tierBonusInfo = computePubTypeTierBonus(entry.pubTypeClassification, rerankConfig);
  if (tierBonusInfo.value !== 0) {
    contributions.push({
      type: "pubTypeTier",
      tier: tierBonusInfo.tier,
      confidence: tierBonusInfo.confidence,
      baseBonus: Number((tierBonusInfo.baseBonus || 0).toFixed(4)),
      adjustedBonus: Number(tierBonusInfo.adjustedBonus.toFixed(4)),
      value: Number(tierBonusInfo.value.toFixed(4)),
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

  const translationPotentialInfo = computeTranslationPotentialBonus(enriched, rerankConfig);
  if (translationPotentialInfo.value !== 0) {
    contributions.push({
      type: "translationPotentialBonus",
      apt: translationPotentialInfo.apt,
      factor: Number(translationPotentialInfo.factor.toFixed(4)),
      value: Number(translationPotentialInfo.value.toFixed(4)),
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
    recencyInfo.value +
    pubTypeInfo.value +
    tierBonusInfo.value +
    oaBonus +
    clinicalInfo.value +
    translationPotentialInfo.value +
    topicOverlapBonus;

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

  const recencyMultiplierInfo = computeRecencyMultiplier(enriched, rerankConfig, currentYear);
  if (recencyMultiplierInfo.multiplier !== 1.0) {
    contributions.push({
      type: "recencyMultiplier",
      age: recencyMultiplierInfo.age,
      multiplier: Number(recencyMultiplierInfo.multiplier.toFixed(4)),
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

  const dataQualityInfo = computeDataQualityMultiplier(entry, rerankConfig);
  if (dataQualityInfo.multiplier !== 1.0) {
    contributions.push({
      type: "dataQualityMultiplier",
      applied: dataQualityInfo.applied,
      abstractLength: dataQualityInfo.abstractLength,
      multiplier: Number(dataQualityInfo.multiplier.toFixed(4)),
    });
  }

  const qualityMultiplier =
    citationImpactInfo.multiplier *
    authorityInfo.multiplier *
    recencyMultiplierInfo.multiplier *
    retractionInfo.multiplier *
    dataQualityInfo.multiplier;
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
      pubTypeTierBonus: Number(tierBonusInfo.value.toFixed(4)),
      pubTypeTier: tierBonusInfo.tier || entry?.pubTypeClassification?.tier || "",
      pubTypeConfidence: tierBonusInfo.confidence || entry?.pubTypeClassification?.confidence || "",
      oaBonus: Number(oaBonus.toFixed(4)),
      clinicalBonus: Number(clinicalInfo.value.toFixed(4)),
      translationPotentialBonus: Number(translationPotentialInfo.value.toFixed(4)),
      topicOverlapBonus: Number(topicOverlapBonus.toFixed(4)),
      citationImpactMultiplier: Number(citationImpactInfo.multiplier.toFixed(4)),
      authorityMultiplier: Number(authorityInfo.multiplier.toFixed(4)),
      recencyMultiplier: Number(recencyMultiplierInfo.multiplier.toFixed(4)),
      retractionMultiplier: Number(retractionInfo.multiplier.toFixed(4)),
      dataQualityMultiplier: Number(dataQualityInfo.multiplier.toFixed(4)),
      qualityMultiplier: Number(qualityMultiplier.toFixed(4)),
    },
    sourceBreakdown,
    contributions,
  };
}

function buildOverlapSummary(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  const summary = list.reduce(
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
      const sources = Array.isArray(candidate?.sources) ? candidate.sources : [];
      sources.forEach((src) => {
        const key = String(src || "").trim();
        if (!key) return;
        acc.perSourceCount[key] = (acc.perSourceCount[key] || 0) + 1;
      });
      return acc;
    },
    {
      multiSource: 0,
      singleSource: 0,
      withPmid: 0,
      doiOnly: 0,
      perSourceCount: {},
    }
  );

  const total = summary.multiSource + summary.singleSource;
  const overlapRatio = total > 0 ? summary.multiSource / total : 0;

  // Pairwise overlap: for every (A, B) source pair that appears in the candidate
  // set, count how many candidates have both sources attached. ratio is
  // computed against the total candidates that reference A OR B.
  const distinctSourcesUsed = Object.keys(summary.perSourceCount).sort();
  const pairwiseOverlap = {};
  for (let i = 0; i < distinctSourcesUsed.length; i += 1) {
    for (let j = i + 1; j < distinctSourcesUsed.length; j += 1) {
      const a = distinctSourcesUsed[i];
      const b = distinctSourcesUsed[j];
      let shared = 0;
      let eitherSource = 0;
      list.forEach((candidate) => {
        const sources = Array.isArray(candidate?.sources) ? candidate.sources : [];
        const hasA = sources.includes(a);
        const hasB = sources.includes(b);
        if (hasA && hasB) shared += 1;
        if (hasA || hasB) eitherSource += 1;
      });
      pairwiseOverlap[`${a}-${b}`] = {
        shared,
        total: eitherSource,
        ratio: eitherSource > 0 ? Number((shared / eitherSource).toFixed(4)) : 0,
      };
    }
  }

  return {
    multiSource: summary.multiSource,
    singleSource: summary.singleSource,
    withPmid: summary.withPmid,
    doiOnly: summary.doiOnly,
    overlapRatio: Number(overlapRatio.toFixed(4)),
    distinctSourcesUsed,
    pairwiseOverlap,
  };
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
    citationImpactSignalWeights: {
      ...DEFAULT_SEMANTIC_RERANK_CONFIG.citationImpactSignalWeights,
      ...(safeRuntimeConfig.citationImpactSignalWeights &&
      typeof safeRuntimeConfig.citationImpactSignalWeights === "object"
        ? safeRuntimeConfig.citationImpactSignalWeights
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
    dataQualityPenalties: {
      ...DEFAULT_SEMANTIC_RERANK_CONFIG.dataQualityPenalties,
      ...(safeRuntimeConfig.dataQualityPenalties &&
      typeof safeRuntimeConfig.dataQualityPenalties === "object"
        ? safeRuntimeConfig.dataQualityPenalties
        : {}),
    },
    abstractMinLength: {
      ...DEFAULT_SEMANTIC_RERANK_CONFIG.abstractMinLength,
      ...(safeRuntimeConfig.abstractMinLength &&
      typeof safeRuntimeConfig.abstractMinLength === "object"
        ? safeRuntimeConfig.abstractMinLength
        : {}),
    },
    pubTypeTiers: {
      ...DEFAULT_SEMANTIC_RERANK_CONFIG.pubTypeTiers,
      ...(safeRuntimeConfig.pubTypeTiers &&
      typeof safeRuntimeConfig.pubTypeTiers === "object"
        ? safeRuntimeConfig.pubTypeTiers
        : {}),
    },
    guidelinePublisherAllowList: Array.isArray(safeRuntimeConfig.guidelinePublisherAllowList)
      ? safeRuntimeConfig.guidelinePublisherAllowList
      : DEFAULT_SEMANTIC_RERANK_CONFIG.guidelinePublisherAllowList,
    recencyCurveEnabled: safeRuntimeConfig.recencyCurveEnabled === true,
    recencyCurve:
      Array.isArray(safeRuntimeConfig.recencyCurve) && safeRuntimeConfig.recencyCurve.length > 0
        ? safeRuntimeConfig.recencyCurve
        : DEFAULT_SEMANTIC_RERANK_CONFIG.recencyCurve,
    recencyMultiplierCurve: Array.isArray(safeRuntimeConfig.recencyMultiplierCurve)
      ? safeRuntimeConfig.recencyMultiplierCurve
      : DEFAULT_SEMANTIC_RERANK_CONFIG.recencyMultiplierCurve,
  };
}

function buildEnrichmentSummary(candidates, rerankConfig, filteredCount, extraCounters = {}) {
  const summary = {
    withFwci: 0,
    withRcr: 0,
    withNihPercentile: 0,
    withApt: 0,
    withFieldCitationRate: 0,
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
    withoutAbstract: 0,
    withShortAbstract: 0,
    withoutAuthor: 0,
    withoutYear: 0,
    totalDowngradedByQuality: 0,
    withoutTitleDropped: toFiniteInt(extraCounters.withoutTitleDropped) || 0,
    excludedByTier: extraCounters.excludedByTier && typeof extraCounters.excludedByTier === "object"
      ? { ...extraCounters.excludedByTier }
      : {},
    byPubTypeTier: {},
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
    if (enriched.nihPercentile !== null && enriched.nihPercentile !== undefined)
      summary.withNihPercentile += 1;
    if (enriched.apt !== null && enriched.apt !== undefined) summary.withApt += 1;
    if (enriched.fieldCitationRate !== null && enriched.fieldCitationRate !== undefined)
      summary.withFieldCitationRate += 1;
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

    const abstractLength = toFiniteInt(enriched.abstractLength);
    const shortThreshold = toFiniteInt(rerankConfig?.abstractMinLength?.short) ?? 100;
    if (abstractLength === null || abstractLength === 0) {
      summary.withoutAbstract += 1;
    } else if (abstractLength < shortThreshold) {
      summary.withShortAbstract += 1;
    }
    if (!enriched.hasAuthor) summary.withoutAuthor += 1;
    if (!enriched.publicationYear) summary.withoutYear += 1;
    const dataQualityMult = Number(candidate?.scoreBreakdown?.dataQualityMultiplier);
    if (Number.isFinite(dataQualityMult) && dataQualityMult < 1.0) {
      summary.totalDowngradedByQuality += 1;
    }

    const tier = String(candidate?.pubTypeClassification?.tier || "").trim();
    if (tier) {
      summary.byPubTypeTier[tier] = (summary.byPubTypeTier[tier] || 0) + 1;
    }
  });

  return summary;
}

export function rerankSemanticCandidates(sourceResults, runtimeRerankConfig = {}, options = {}) {
  const activeSourceResults = (Array.isArray(sourceResults) ? sourceResults : []).filter(
    (sourceResult) => Array.isArray(sourceResult?.candidates) && sourceResult.candidates.length > 0
  );
  const rerankConfig = resolveSemanticRerankConfig(runtimeRerankConfig);
  const attemptedSourceStats = getSourceStats(sourceResults);
  const attemptedSourceSummary = getSourceSummary(sourceResults);
  const sourceStats = getSourceStats(activeSourceResults);
  const sourceSummary = getSourceSummary(activeSourceResults);
  const rerankMode = activeSourceResults.length <= 1 ? "single" : "multi";
  const currentYear = new Date().getFullYear();
  const intentTokens = buildIntentTokenSet(options?.queryIntent);

  const mergeResult = mergeSourceCandidates(activeSourceResults, {
    guidelinePublisherAllowList: rerankConfig.guidelinePublisherAllowList,
  });

  const entries = Array.from(mergeResult.mergedCandidates.values());
  const titlelessEntries = entries.filter((entry) => !String(entry?.title || "").trim());
  const entriesWithTitle = entries.filter((entry) => String(entry?.title || "").trim() !== "");

  const pubTypeTiersConfig =
    rerankConfig?.pubTypeTiers && typeof rerankConfig.pubTypeTiers === "object"
      ? rerankConfig.pubTypeTiers
      : {};
  const pubTypeTiersActive = Object.keys(pubTypeTiersConfig).length > 0;
  const excludedByTier = {};
  const excludedEntries = [];
  const retainedEntries = [];
  for (const entry of entriesWithTitle) {
    if (pubTypeTiersActive && isExcludedClassification(entry.pubTypeClassification)) {
      const subtype = String(entry.pubTypeClassification?.subtype || "unknown");
      excludedByTier[subtype] = (excludedByTier[subtype] || 0) + 1;
      excludedEntries.push(entry);
      continue;
    }
    retainedEntries.push(entry);
  }

  const builtCandidates = retainedEntries.map((entry) =>
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
    filteredCandidates.length,
    { withoutTitleDropped: titlelessEntries.length, excludedByTier }
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
      sourceStats: attemptedSourceStats,
      sourceSummary: attemptedSourceSummary,
      activeSourceStats: sourceStats,
      activeSourceSummary: sourceSummary,
      overlapSummary: buildOverlapSummary(rankedCandidates),
      enrichmentSummary,
      mergeSummary: {
        rawCandidateCount: mergeResult.rawCandidateCount,
        mergedCandidateCount: rankedCandidates.length,
        duplicateCount: mergeResult.mergeEvents.length,
        filteredCount: filteredCandidates.length,
        excludedByTierCount: excludedEntries.length,
        titlelessDroppedCount: titlelessEntries.length,
      },
      mergeEvents: mergeResult.mergeEvents,
    },
  };
}
