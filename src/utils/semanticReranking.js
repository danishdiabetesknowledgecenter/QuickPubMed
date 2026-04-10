// Code-level defaults are kept as a safe fallback if backend/runtime config is missing,
// partially configured, or comes from an older install that does not expose every field yet.
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
});

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

function mergeSourceCandidates(sourceResults) {
  const mergedCandidates = new Map();

  (Array.isArray(sourceResults) ? sourceResults : []).forEach((sourceResult) => {
    (Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : []).forEach((candidate) => {
      const pmid = normalizePmidValue(candidate?.pmid);
      const doi = normalizeDoiValue(candidate?.doi);
      const key = pmid ? `pmid:${pmid}` : doi ? `doi:${doi.toLowerCase()}` : "";
      if (!key) return;

      if (!mergedCandidates.has(key)) {
        mergedCandidates.set(key, {
          pmid,
          doi,
          title: String(candidate?.title || "").trim(),
          openAlexId: String(candidate?.openAlexId || "").trim(),
          sources: new Map(),
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
    });
  });

  return mergedCandidates;
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

function buildDebugEntry(entry, rerankConfig, sourceStats, mode = "multi") {
  const contributions = [];
  let combinedScore = 0;
  let scoreTieBreaker = 0;
  let pmidBonus = 0;
  let overlapBonus = 0;
  let rrfScore = 0;
  const sourceBreakdown = [];

  if (entry.pmid) {
    pmidBonus = rerankConfig.pmidBonus;
    combinedScore += pmidBonus;
    contributions.push({
      type: "pmidBonus",
      value: pmidBonus,
    });
  }

  entry.sources.forEach((sourceData, sourceKey) => {
    const rankInfo = buildRankContribution(sourceData, sourceKey, rerankConfig);
    rrfScore += rankInfo.weightedRrf;
    combinedScore += rankInfo.weightedRrf;
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
    combinedScore += overlapBonus;
    contributions.push({
      type: "overlapBonus",
      sourceCount: entry.sources.size,
      value: overlapBonus,
    });
  }

  return {
    ...entry,
    sources: Array.from(entry.sources.keys()),
    combinedScore: Number(combinedScore.toFixed(4)),
    scoreTieBreaker: Number(scoreTieBreaker.toFixed(4)),
    bestRank: getBestRank(entry),
    sourceCount: entry.sources.size,
    scoreBreakdown: {
      rrfScore: Number(rrfScore.toFixed(4)),
      overlapBonus: Number(overlapBonus.toFixed(4)),
      pmidBonus: Number(pmidBonus.toFixed(4)),
      scoreTieBreaker: Number(scoreTieBreaker.toFixed(4)),
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
  };
}

export function rerankSemanticCandidates(sourceResults, runtimeRerankConfig = {}) {
  const activeSourceResults = (Array.isArray(sourceResults) ? sourceResults : []).filter(
    (sourceResult) => Array.isArray(sourceResult?.candidates) && sourceResult.candidates.length > 0
  );
  const rerankConfig = resolveSemanticRerankConfig(runtimeRerankConfig);
  const sourceStats = getSourceStats(activeSourceResults);
  const sourceSummary = getSourceSummary(activeSourceResults);
  const rerankMode = activeSourceResults.length <= 1 ? "single" : "multi";

  const mergedCandidates = mergeSourceCandidates(activeSourceResults);
  let rankedCandidates = Array.from(mergedCandidates.values()).map((entry) =>
    buildDebugEntry(entry, rerankConfig, sourceStats, rerankMode)
  );

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

  return {
    candidates: rankedCandidates,
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
    },
  };
}
