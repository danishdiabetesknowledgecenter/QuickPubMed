import { normalizeDoiValue } from "@/utils/resultAdapters";

function normalizeLowerString(value) {
  return String(value || "").trim().toLowerCase();
}

function dedupeNormalizedValues(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .map((value) => normalizeLowerString(value))
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function getCandidateSemanticSignalTexts(candidate, metadataByDoi, scopes = []) {
  const normalizedScopes =
    Array.isArray(scopes) && scopes.length > 0
      ? scopes
      : ["candidatetitle", "sourcecandidatetitles"];
  const scopeSet = new Set(
    normalizedScopes.map((scope) => normalizeLowerString(scope))
  );
  const useCandidateTitle = scopeSet.has("candidatetitle") || scopeSet.has("alltext");
  const useSourceCandidateTitles =
    scopeSet.has("sourcecandidatetitles") || scopeSet.has("alltext");
  const texts = [];

  if (useCandidateTitle) {
    texts.push(String(candidate?.title || "").trim());
  }

  const candidateDoi = normalizeDoiValue(candidate?.doi || "").toLowerCase();
  if (
    useSourceCandidateTitles &&
    candidateDoi &&
    metadataByDoi instanceof Map &&
    metadataByDoi.has(candidateDoi)
  ) {
    const doiMetadata = metadataByDoi.get(candidateDoi);
    const bySource =
      doiMetadata?.bySource && typeof doiMetadata.bySource === "object"
        ? doiMetadata.bySource
        : {};
    Object.values(bySource).forEach((entries) => {
      (Array.isArray(entries) ? entries : []).forEach((entry) => {
        texts.push(String(entry?.title || "").trim());
      });
    });
  }

  return dedupeNormalizedValues(texts);
}

export function getCandidateSemanticSourceProviders(candidate, metadataByDoi) {
  const providers = [String(candidate?.source || "").trim().toLowerCase()];
  const candidateDoi = normalizeDoiValue(candidate?.doi || "").toLowerCase();
  if (candidateDoi && metadataByDoi instanceof Map && metadataByDoi.has(candidateDoi)) {
    const doiMetadata = metadataByDoi.get(candidateDoi);
    const bySource =
      doiMetadata?.bySource && typeof doiMetadata.bySource === "object"
        ? doiMetadata.bySource
        : {};
    providers.push(
      ...Object.keys(bySource).map((key) => String(key || "").trim().toLowerCase())
    );
  }
  return dedupeNormalizedValues(providers);
}

export function buildCandidateSemanticMetadataSnapshot(
  candidate,
  metadataByDoi,
  openAlexCachedValue = null
) {
  const candidateMetadata =
    candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
  const sourceProviders = getCandidateSemanticSourceProviders(candidate, metadataByDoi);
  const snapshot = {
    candidateSource: normalizeLowerString(candidate?.source || ""),
    sourceProviders,
    hasOpenAlexId: String(candidate?.openAlexId || "").trim() !== "",
    hasDoi: normalizeDoiValue(candidate?.doi || "") !== "",
    openAlexId: String(candidate?.openAlexId || "").trim(),
    candidatePublicationYear: normalizeLowerString(
      candidateMetadata.publicationYear || candidateMetadata.year || ""
    ),
    candidateVenue: normalizeLowerString(
      candidateMetadata.venue ||
        candidateMetadata.sourceDisplayName ||
        candidateMetadata.sourceAbbreviatedTitle ||
        ""
    ),
    candidateSourceType: normalizeLowerString(candidateMetadata.sourceType || ""),
    candidatePublicationTypes: Array.isArray(candidateMetadata.publicationTypes)
      ? candidateMetadata.publicationTypes.map((value) => normalizeLowerString(value))
      : [],
  };

  const doiKey = normalizeDoiValue(candidate?.doi || "").toLowerCase();
  if (doiKey && metadataByDoi instanceof Map && metadataByDoi.has(doiKey)) {
    const doiMetadata = metadataByDoi.get(doiKey);
    const bySource =
      doiMetadata?.bySource && typeof doiMetadata.bySource === "object"
        ? doiMetadata.bySource
        : {};
    const flattenedMetadata = Object.values(bySource).flatMap((entries) =>
      (Array.isArray(entries) ? entries : []).map((entry) =>
        entry?.metadata && typeof entry.metadata === "object" ? entry.metadata : null
      )
    );
    snapshot.semanticSourcePublicationTypes = dedupeNormalizedValues(
      flattenedMetadata.flatMap((metadata) =>
        Array.isArray(metadata?.publicationTypes) ? metadata.publicationTypes : []
      )
    );
    snapshot.semanticSourceVenues = dedupeNormalizedValues(
      flattenedMetadata.map((metadata) =>
        metadata?.venue || metadata?.sourceDisplayName || metadata?.sourceAbbreviatedTitle || ""
      )
    );
    snapshot.semanticSourceTypes = dedupeNormalizedValues(
      flattenedMetadata.map((metadata) => metadata?.sourceType || "")
    );
  }

  if (openAlexCachedValue && typeof openAlexCachedValue === "object") {
    snapshot.openAlexSourceType = normalizeLowerString(openAlexCachedValue.sourceType || "");
    snapshot.openAlexSourceDisplayName = normalizeLowerString(
      openAlexCachedValue.sourceDisplayName || ""
    );
    snapshot.openAlexSourceAbbreviatedTitle = normalizeLowerString(
      openAlexCachedValue.sourceAbbreviatedTitle || ""
    );
    snapshot.openAlexPrimarySource = normalizeLowerString(openAlexCachedValue.source || "");
    snapshot.openAlexPubDate = normalizeLowerString(openAlexCachedValue.pubDate || "");
  }

  return snapshot;
}

function metadataSnapshotValueExists(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return String(value || "").trim() !== "";
}

function metadataSnapshotValueEqualsAny(value, expectedValues) {
  const normalizedExpected = (Array.isArray(expectedValues) ? expectedValues : []).map((entry) =>
    normalizeLowerString(entry)
  );
  if (normalizedExpected.length === 0) return true;
  if (Array.isArray(value)) {
    const normalizedValues = value.map((entry) => normalizeLowerString(entry));
    return normalizedValues.some((entry) => normalizedExpected.includes(entry));
  }
  if (typeof value === "boolean") {
    return normalizedExpected.includes(String(value).toLowerCase());
  }
  return normalizedExpected.includes(normalizeLowerString(value));
}

function metadataSnapshotValueIncludesAny(value, expectedValues) {
  const normalizedExpected = (Array.isArray(expectedValues) ? expectedValues : []).map((entry) =>
    normalizeLowerString(entry)
  );
  if (normalizedExpected.length === 0) return true;
  if (Array.isArray(value)) {
    const normalizedValues = value.map((entry) => normalizeLowerString(entry));
    return normalizedValues.some((entry) =>
      normalizedExpected.some((expected) => entry.includes(expected))
    );
  }
  const normalizedValue = normalizeLowerString(value);
  return normalizedExpected.some((expected) => normalizedValue.includes(expected));
}

export function evaluateSemanticMetadataFieldCondition(snapshot, condition) {
  if (!condition || typeof condition !== "object") return true;
  const value = snapshot?.[condition.field];
  let passed = true;
  switch (condition.operator) {
    case "exists":
      passed =
        metadataSnapshotValueExists(value) ===
        Boolean(condition.expectExists === undefined ? true : condition.expectExists);
      break;
    case "includesany":
      passed = metadataSnapshotValueIncludesAny(value, condition.values);
      break;
    case "equalsany":
    default:
      passed = metadataSnapshotValueEqualsAny(value, condition.values);
      break;
  }
  return condition.negate ? !passed : passed;
}

export function candidateMatchesActiveSemanticDoiOnlyRules({
  candidate,
  metadataByDoi,
  ruleState,
  openAlexCachedValue = null,
}) {
  if (!candidate || String(candidate?.pmid || "").trim() !== "") {
    return true;
  }
  const activeRules = Array.isArray(ruleState?.activeRules) ? ruleState.activeRules : [];
  const ruleGroups = Array.isArray(ruleState?.ruleGroups) ? ruleState.ruleGroups : [];
  if (activeRules.length === 0) {
    return true;
  }

  const sourceProviders = getCandidateSemanticSourceProviders(candidate, metadataByDoi);
  const metadataSnapshot = buildCandidateSemanticMetadataSnapshot(
    candidate,
    metadataByDoi,
    openAlexCachedValue
  );

  const evaluateRule = (rule) => {
    const signalTexts = getCandidateSemanticSignalTexts(
      candidate,
      metadataByDoi,
      rule.textScopes
    );
    const hasRequiredAnySignal =
      !Array.isArray(rule.requireAnyTextSignals) ||
      rule.requireAnyTextSignals.length === 0 ||
      rule.requireAnyTextSignals.some((signal) =>
        signalTexts.some((text) => text.includes(signal))
      );
    const hasRequiredAllSignals =
      !Array.isArray(rule.requireAllTextSignals) ||
      rule.requireAllTextSignals.length === 0 ||
      rule.requireAllTextSignals.every((signal) =>
        signalTexts.some((text) => text.includes(signal))
      );
    const hasExcludedSignal =
      Array.isArray(rule.excludeAnyTextSignals) &&
      rule.excludeAnyTextSignals.some((signal) =>
        signalTexts.some((text) => text.includes(signal))
      );
    const hasAllowedProvider =
      !Array.isArray(rule.allowSourceProviders) ||
      rule.allowSourceProviders.length === 0 ||
      rule.allowSourceProviders.some((provider) => sourceProviders.includes(provider));
    const hasExcludedProvider =
      Array.isArray(rule.excludeSourceProviders) &&
      rule.excludeSourceProviders.some((provider) => sourceProviders.includes(provider));
    const metadataConditions = Array.isArray(rule.metadataFieldConditions)
      ? rule.metadataFieldConditions
      : [];
    const metadataFieldResults = metadataConditions.map((condition) =>
      evaluateSemanticMetadataFieldCondition(metadataSnapshot, condition)
    );
    const matchesMetadataFieldConditions =
      metadataFieldResults.length === 0
        ? true
        : rule.metadataFieldConditionMode === "any"
        ? metadataFieldResults.some(Boolean)
        : metadataFieldResults.every(Boolean);

    const positiveChecks = [];
    if (Array.isArray(rule.requireAnyTextSignals) && rule.requireAnyTextSignals.length > 0) {
      positiveChecks.push(hasRequiredAnySignal);
    }
    if (Array.isArray(rule.requireAllTextSignals) && rule.requireAllTextSignals.length > 0) {
      positiveChecks.push(hasRequiredAllSignals);
    }
    if (Array.isArray(rule.allowSourceProviders) && rule.allowSourceProviders.length > 0) {
      positiveChecks.push(hasAllowedProvider);
    }
    if (metadataConditions.length > 0) {
      positiveChecks.push(matchesMetadataFieldConditions);
    }

    const negativeChecks = [];
    if (Array.isArray(rule.excludeAnyTextSignals) && rule.excludeAnyTextSignals.length > 0) {
      negativeChecks.push(!hasExcludedSignal);
    }
    if (Array.isArray(rule.excludeSourceProviders) && rule.excludeSourceProviders.length > 0) {
      negativeChecks.push(!hasExcludedProvider);
    }

    const positivePassed =
      positiveChecks.length === 0
        ? true
        : rule.matchStrategy === "any"
        ? positiveChecks.some(Boolean)
        : positiveChecks.every(Boolean);
    const negativePassed = negativeChecks.every(Boolean);

    return positivePassed && negativePassed;
  };

  if (ruleGroups.length > 0) {
    return ruleGroups.every((group) =>
      (Array.isArray(group?.rules) ? group.rules : []).some((rule) => evaluateRule(rule))
    );
  }

  return activeRules.every((rule) => evaluateRule(rule));
}
