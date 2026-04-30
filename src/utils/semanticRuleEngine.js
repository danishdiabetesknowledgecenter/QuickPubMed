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

function resolveMetadataEntry(candidate, metadataByDoi, metadataByOpenAlexId) {
  const candidateDoi = normalizeDoiValue(candidate?.doi || "").toLowerCase();
  if (candidateDoi && metadataByDoi instanceof Map && metadataByDoi.has(candidateDoi)) {
    return metadataByDoi.get(candidateDoi);
  }
  const candidateOpenAlexId = String(candidate?.openAlexId || "").trim();
  if (
    candidateOpenAlexId &&
    metadataByOpenAlexId instanceof Map &&
    metadataByOpenAlexId.has(candidateOpenAlexId)
  ) {
    return metadataByOpenAlexId.get(candidateOpenAlexId);
  }
  return null;
}

function appendMetadataSignalTexts(texts, metadata) {
  if (!metadata || typeof metadata !== "object") return;
  const values = [
    metadata.venue,
    metadata.source,
    metadata.fulljournalname,
    metadata.sourceDisplayName,
    metadata.sourceAbbreviatedTitle,
    metadata.sourceType,
    metadata.workType,
    metadata.publicationDate,
    metadata.pubDate,
    metadata.pubdate,
    metadata.publicationYear,
    metadata.year,
    metadata.volume,
    metadata.issue,
    metadata.pages,
    ...(Array.isArray(metadata.publicationTypes) ? metadata.publicationTypes : []),
    ...(Array.isArray(metadata.pubTypes) ? metadata.pubTypes : []),
  ];
  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (normalized) texts.push(normalized);
  });

  const bibliographicText = [
    metadata.venue || metadata.sourceDisplayName || metadata.sourceAbbreviatedTitle || metadata.source || "",
    metadata.publicationDate || metadata.pubDate || metadata.pubdate || metadata.publicationYear || metadata.year || "",
    metadata.volume || "",
    metadata.issue ? `(${metadata.issue})` : "",
    metadata.pages || "",
  ]
    .filter(Boolean)
    .join(" ");
  if (bibliographicText.trim()) {
    texts.push(bibliographicText.trim());
  }
}

export function getCandidateSemanticSignalTexts(
  candidate,
  metadataByDoi,
  scopes = [],
  metadataByOpenAlexId = null
) {
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
  const useSourceMetadataTexts =
    scopeSet.has("sourcemetadatexts") || scopeSet.has("alltext");
  const texts = [];

  if (useCandidateTitle) {
    texts.push(String(candidate?.title || "").trim());
  }

  const metadataEntry = resolveMetadataEntry(candidate, metadataByDoi, metadataByOpenAlexId);
  if (useSourceMetadataTexts) {
    const candidateMetadata =
      candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
    appendMetadataSignalTexts(texts, {
      ...candidateMetadata,
      source: candidate?.source,
      fulljournalname: candidate?.fulljournalname,
      pubDate: candidate?.pubDate,
      pubdate: candidate?.pubdate,
      volume: candidate?.volume,
      issue: candidate?.issue,
      pages: candidate?.pages,
    });
  }
  if (useSourceCandidateTitles && metadataEntry) {
    const bySource =
      metadataEntry?.bySource && typeof metadataEntry.bySource === "object"
        ? metadataEntry.bySource
        : {};
    Object.values(bySource).forEach((entries) => {
      (Array.isArray(entries) ? entries : []).forEach((entry) => {
        texts.push(String(entry?.title || "").trim());
      });
    });
  }
  if (useSourceMetadataTexts && metadataEntry) {
    const bySource =
      metadataEntry?.bySource && typeof metadataEntry.bySource === "object"
        ? metadataEntry.bySource
        : {};
    Object.values(bySource).forEach((entries) => {
      (Array.isArray(entries) ? entries : []).forEach((entry) => {
        appendMetadataSignalTexts(
          texts,
          entry?.metadata && typeof entry.metadata === "object" ? entry.metadata : {}
        );
      });
    });
  }

  return dedupeNormalizedValues(texts);
}

export function getCandidateSemanticSourceProviders(
  candidate,
  metadataByDoi,
  metadataByOpenAlexId = null
) {
  const providers = [String(candidate?.source || "").trim().toLowerCase()];
  const metadataEntry = resolveMetadataEntry(candidate, metadataByDoi, metadataByOpenAlexId);
  if (metadataEntry) {
    const bySource =
      metadataEntry?.bySource && typeof metadataEntry.bySource === "object"
        ? metadataEntry.bySource
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
  openAlexCachedValue = null,
  metadataByOpenAlexId = null
) {
  const candidateMetadata =
    candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
  const sourceProviders = getCandidateSemanticSourceProviders(
    candidate,
    metadataByDoi,
    metadataByOpenAlexId
  );
  const pubTypeClassification =
    candidateMetadata?.pubTypeClassification &&
    typeof candidateMetadata.pubTypeClassification === "object"
      ? candidateMetadata.pubTypeClassification
      : candidate?.pubTypeClassification && typeof candidate.pubTypeClassification === "object"
      ? candidate.pubTypeClassification
      : null;
  const pubTypeTier = normalizeLowerString(pubTypeClassification?.tier || "");
  const pubTypeConfidence = normalizeLowerString(pubTypeClassification?.confidence || "");
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
    candidatePubTypeTier: pubTypeTier,
    candidatePubTypeConfidence: pubTypeConfidence,
    candidateVolume: normalizeLowerString(candidateMetadata.volume || candidate?.volume || ""),
    candidateIssue: normalizeLowerString(candidateMetadata.issue || candidate?.issue || ""),
  };

  const metadataEntry = resolveMetadataEntry(candidate, metadataByDoi, metadataByOpenAlexId);
  if (metadataEntry) {
    const bySource =
      metadataEntry?.bySource && typeof metadataEntry.bySource === "object"
        ? metadataEntry.bySource
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

function evaluateCandidateSemanticRule({
  candidate,
  metadataByDoi,
  metadataByOpenAlexId,
  rule,
  sourceProviders,
  metadataSnapshot,
}) {
  const signalTexts = getCandidateSemanticSignalTexts(
    candidate,
    metadataByDoi,
    rule?.textScopes,
    metadataByOpenAlexId
  );
  const hasRequiredAnySignal =
    !Array.isArray(rule?.requireAnyTextSignals) ||
    rule.requireAnyTextSignals.length === 0 ||
    rule.requireAnyTextSignals.some((signal) => signalTexts.some((text) => text.includes(signal)));
  const hasRequiredAllSignals =
    !Array.isArray(rule?.requireAllTextSignals) ||
    rule.requireAllTextSignals.length === 0 ||
    rule.requireAllTextSignals.every((signal) => signalTexts.some((text) => text.includes(signal)));
  const hasExcludedSignal =
    Array.isArray(rule?.excludeAnyTextSignals) &&
    rule.excludeAnyTextSignals.some((signal) => signalTexts.some((text) => text.includes(signal)));
  const hasAllowedProvider =
    !Array.isArray(rule?.allowSourceProviders) ||
    rule.allowSourceProviders.length === 0 ||
    rule.allowSourceProviders.some((provider) => sourceProviders.includes(provider));
  const hasExcludedProvider =
    Array.isArray(rule?.excludeSourceProviders) &&
    rule.excludeSourceProviders.some((provider) => sourceProviders.includes(provider));
  const metadataConditions = Array.isArray(rule?.metadataFieldConditions)
    ? rule.metadataFieldConditions
    : [];
  const metadataFieldResults = metadataConditions.map((condition) => ({
    condition,
    passed: evaluateSemanticMetadataFieldCondition(metadataSnapshot, condition),
  }));
  const matchesMetadataFieldConditions =
    metadataFieldResults.length === 0
      ? true
      : rule?.metadataFieldConditionMode === "any"
      ? metadataFieldResults.some((result) => result.passed)
      : metadataFieldResults.every((result) => result.passed);

  const positiveChecks = [];
  if (Array.isArray(rule?.requireAnyTextSignals) && rule.requireAnyTextSignals.length > 0) {
    positiveChecks.push(hasRequiredAnySignal);
  }
  if (Array.isArray(rule?.requireAllTextSignals) && rule.requireAllTextSignals.length > 0) {
    positiveChecks.push(hasRequiredAllSignals);
  }
  if (Array.isArray(rule?.allowSourceProviders) && rule.allowSourceProviders.length > 0) {
    positiveChecks.push(hasAllowedProvider);
  }
  if (metadataConditions.length > 0) {
    positiveChecks.push(matchesMetadataFieldConditions);
  }

  const negativeChecks = [];
  if (Array.isArray(rule?.excludeAnyTextSignals) && rule.excludeAnyTextSignals.length > 0) {
    negativeChecks.push(!hasExcludedSignal);
  }
  if (Array.isArray(rule?.excludeSourceProviders) && rule.excludeSourceProviders.length > 0) {
    negativeChecks.push(!hasExcludedProvider);
  }

  const positivePassed =
    positiveChecks.length === 0
      ? true
      : rule?.matchStrategy === "any"
      ? positiveChecks.some(Boolean)
      : positiveChecks.every(Boolean);
  const negativePassed = negativeChecks.every(Boolean);
  const passed = positivePassed && negativePassed;
  const failures = [];

  if (!hasRequiredAnySignal) {
    failures.push("missing_any_text_signal");
  }
  if (!hasRequiredAllSignals) {
    failures.push("missing_required_text_signals");
  }
  if (hasExcludedSignal) {
    failures.push("matched_excluded_text_signal");
  }
  if (!hasAllowedProvider) {
    failures.push("provider_not_allowed");
  }
  if (hasExcludedProvider) {
    failures.push("provider_excluded");
  }
  if (!matchesMetadataFieldConditions) {
    failures.push("metadata_conditions_failed");
  }

  return {
    passed,
    ruleId: String(rule?.id || rule?.key || rule?.label || "").trim(),
    ruleLabel: String(rule?.label || rule?.id || "").trim(),
    failures,
    signalTexts,
    sourceProviders,
    metadataFieldResults,
  };
}

export function explainCandidateActiveSemanticDoiOnlyRules({
  candidate,
  metadataByDoi,
  metadataByOpenAlexId = null,
  ruleState,
  openAlexCachedValue = null,
}) {
  if (!candidate) {
    return {
      matches: true,
      ruleResults: [],
      groupResults: [],
      sourceProviders: [],
      metadataSnapshot: {},
    };
  }
  const activeRules = Array.isArray(ruleState?.activeRules) ? ruleState.activeRules : [];
  const ruleGroups = Array.isArray(ruleState?.ruleGroups) ? ruleState.ruleGroups : [];
  if (activeRules.length === 0) {
    return {
      matches: true,
      ruleResults: [],
      groupResults: [],
      sourceProviders: [],
      metadataSnapshot: {},
    };
  }

  const sourceProviders = getCandidateSemanticSourceProviders(
    candidate,
    metadataByDoi,
    metadataByOpenAlexId
  );
  const metadataSnapshot = buildCandidateSemanticMetadataSnapshot(
    candidate,
    metadataByDoi,
    openAlexCachedValue,
    metadataByOpenAlexId
  );
  const evaluateRule = (rule) =>
    evaluateCandidateSemanticRule({
      candidate,
      metadataByDoi,
      metadataByOpenAlexId,
      rule,
      sourceProviders,
      metadataSnapshot,
    });

  if (ruleGroups.length > 0) {
    const groupResults = ruleGroups.map((group) => {
      const ruleResults = (Array.isArray(group?.rules) ? group.rules : []).map((rule) => evaluateRule(rule));
      return {
        groupId: String(group?.id || group?.label || "").trim(),
        groupLabel: String(group?.label || group?.id || "").trim(),
        passed: ruleResults.some((result) => result.passed),
        ruleResults,
      };
    });
    return {
      matches: groupResults.every((group) => group.passed),
      ruleResults: groupResults.flatMap((group) => group.ruleResults),
      groupResults,
      sourceProviders,
      metadataSnapshot,
    };
  }

  const ruleResults = activeRules.map((rule) => evaluateRule(rule));
  return {
    matches: ruleResults.every((result) => result.passed),
    ruleResults,
    groupResults: [],
    sourceProviders,
    metadataSnapshot,
  };
}

export function candidateMatchesActiveSemanticDoiOnlyRules(args) {
  return explainCandidateActiveSemanticDoiOnlyRules(args).matches;
}
