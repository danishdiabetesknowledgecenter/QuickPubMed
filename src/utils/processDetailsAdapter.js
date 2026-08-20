/**
 * Thin adapter from the backend processDetails contract to the props
 * SearchResult.vue already renders (sourceQueryDetails + processStepDetails).
 *
 * Ownership rules:
 * - Backend owns language-neutral {stepId,payload,context} and source entries
 * - This adapter only validates, dedupes by stepId, maps labels, and converts
 *   API page.number (1-based) to the UI's 0-based page index
 * - prepare remains frontend-owned and is merged here
 */

const SOURCE_STEP_IDS = new Set(["pubmed", "semanticScholar", "openAlex", "elicit"]);

/** Retired micro-steps folded into a parent step id (SearchForm/API parity). */
const FOLDED_STEP_IDS = {
  // Empty prepare folds into intent; payload is nested as searchBasis by backend.
  prepare: "semanticIntent",
  semanticQuery: "semanticIntent",
  optimize: "mesh",
  finalizeCollect: "rerank",
  finalizeValidateDoiSource: "finalizeValidateDoiFetch",
  finalizeValidateDoiRules: "finalizeValidateDoiFetch",
  // Packaging / preselect counts attach to the last real display step.
  finalizeSelected: "finalRerank",
  finalizeRender: "finalRerank",
};

export const DEFAULT_STEP_LABELS = {
  semanticIntent: "Fortolket søgeintention",
  semanticQuery: "Tilpasset databasesøgning",
  searchString: "Genereret PubMed-søgestreng",
  mesh: "MeSH-kontrol og forfinelse",
  rerank: "Reranking",
  finalizeValidatePmid: "PMID-validering",
  finalizeValidateDoiFetch: "DOI-validering",
  finalizeHydrate: "Hydrering",
  finalizeSort: "Sortering",
  finalRerank: "Slut-rerank",
};

function hasPayloadContent(payload) {
  if (!payload || typeof payload !== "object") return false;
  return Object.values(payload).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return value !== "" && value !== null && value !== undefined;
  });
}

function normalizeSourceDetail(entry) {
  if (!entry || typeof entry !== "object") return null;
  const source = String(entry.source || "").trim();
  const query = String(entry.query || entry.request?.query || "").trim();
  if (!SOURCE_STEP_IDS.has(source) || !query) return null;
  return {
    source,
    query,
    request: entry.request && typeof entry.request === "object" ? entry.request : {},
    requestMeta: entry.requestMeta && typeof entry.requestMeta === "object" ? entry.requestMeta : {},
    response: entry.response && typeof entry.response === "object" ? entry.response : {},
    context: String(entry.context || "").trim(),
  };
}

function convertApiPageToUiPage(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (!Number.isFinite(Number(payload.page))) return payload;
  const apiPage = Math.max(1, Number(payload.page) || 1);
  return {
    ...payload,
    page: Math.max(0, apiPage - 1),
  };
}

function normalizeProcessStepDetail(entry, labelLookup = {}) {
  if (!entry || typeof entry !== "object") return null;
  const rawStepId = String(entry.stepId || "").trim();
  const stepId = FOLDED_STEP_IDS[rawStepId] || rawStepId;
  if (!stepId || SOURCE_STEP_IDS.has(stepId)) return null;
  let payload =
    entry.payload && typeof entry.payload === "object" ? { ...entry.payload } : null;
  if (!hasPayloadContent(payload)) return null;

  // Legacy prepare payloads become searchBasis on the first prepare-lane step.
  if (rawStepId === "prepare" && !payload.searchBasis) {
    payload = { searchBasis: { ...payload } };
  }

  // API page.number is 1-based; the UI's process metrics use 0-based page.
  if (Number.isFinite(Number(payload.page))) {
    payload = convertApiPageToUiPage(payload);
  }

  return {
    stepId,
    label: String(
      labelLookup[stepId] || entry.label || DEFAULT_STEP_LABELS[stepId] || stepId
    ).trim(),
    payload,
    context: String(entry.context || "").trim(),
  };
}

/**
 * @param {object|null|undefined} processDetails Backend export
 * @param {object} [options]
 * @param {Array<{stepId:string,label?:string,payload:object,context?:string}>} [options.frontendOwnedSteps]
 * @param {Record<string,string>} [options.labels]
 * @returns {{sourceQueryDetails: object[], processStepDetails: object[]}}
 */
export function adaptUnifiedProcessDetails(processDetails, options = {}) {
  const source = processDetails && typeof processDetails === "object" ? processDetails : {};
  const labelLookup =
    options.labels && typeof options.labels === "object" ? options.labels : {};

  const sourceQueryDetails = [];
  const seenSourceKeys = new Set();
  (Array.isArray(source.sourceQueryDetails) ? source.sourceQueryDetails : []).forEach((entry) => {
    const normalized = normalizeSourceDetail(entry);
    if (!normalized) return;
    const key = `${normalized.source}|${normalized.query.toLowerCase()}`;
    if (seenSourceKeys.has(key)) return;
    seenSourceKeys.add(key);
    sourceQueryDetails.push(normalized);
  });

  const processByStepId = new Map();
  const mergeNormalized = (normalized) => {
    if (!normalized) return;
    const existing = processByStepId.get(normalized.stepId);
    if (!existing) {
      processByStepId.set(normalized.stepId, normalized);
      return;
    }
    processByStepId.set(normalized.stepId, {
      ...existing,
      payload: {
        ...(existing.payload && typeof existing.payload === "object" ? existing.payload : {}),
        ...(normalized.payload && typeof normalized.payload === "object" ? normalized.payload : {}),
      },
      context: normalized.context || existing.context || "",
      label: existing.label || normalized.label,
    });
  };

  (Array.isArray(source.processStepDetails) ? source.processStepDetails : []).forEach((entry) => {
    mergeNormalized(normalizeProcessStepDetail(entry, labelLookup));
  });

  // Frontend-owned steps (prepare) win on conflict for top-level fields,
  // but still merge payloads so folded render/preselect counts are kept.
  (Array.isArray(options.frontendOwnedSteps) ? options.frontendOwnedSteps : []).forEach((entry) => {
    const normalized = normalizeProcessStepDetail(entry, labelLookup);
    if (!normalized) return;
    const existing = processByStepId.get(normalized.stepId);
    if (!existing) {
      processByStepId.set(normalized.stepId, normalized);
      return;
    }
    processByStepId.set(normalized.stepId, {
      ...existing,
      ...normalized,
      payload: {
        ...(existing.payload && typeof existing.payload === "object" ? existing.payload : {}),
        ...(normalized.payload && typeof normalized.payload === "object" ? normalized.payload : {}),
      },
    });
  });

  return {
    sourceQueryDetails,
    processStepDetails: Array.from(processByStepId.values()),
  };
}

/**
 * Applies adapted process details into SearchForm reactive state helpers.
 */
export function applyAdaptedProcessDetailsToSearchForm(form, adapted) {
  if (!form || !adapted) return;
  if (Array.isArray(adapted.sourceQueryDetails)) {
    form.semanticSourceQueryDetails = adapted.sourceQueryDetails;
  }
  if (Array.isArray(adapted.processStepDetails)) {
    adapted.processStepDetails.forEach((detail) => {
      if (typeof form.setSearchProcessStepDetail === "function") {
        form.setSearchProcessStepDetail(detail.stepId, detail.payload, detail.label || "");
      }
    });
  }
}
