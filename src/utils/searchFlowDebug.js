export const SEARCH_FLOW_DEBUG_QUERY_PARAM = "qpmDebug";
export const SEARCH_FLOW_DEBUG_QUERY_VALUE = "searchflow";

export function normalizeSearchFlowDebugValue(value) {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes", "on", SEARCH_FLOW_DEBUG_QUERY_VALUE, "all"].includes(normalized);
}

export function getSearchFlowDebugUrlParams(locationLike = typeof window !== "undefined" ? window.location : null) {
  const params = new URLSearchParams(locationLike?.search || "");
  const hash = String(locationLike?.hash || "");
  if (!hash) {
    return params;
  }
  const hashContent = hash.startsWith("#") ? hash.slice(1) : hash;
  const queryStart = hashContent.indexOf("?");
  const hashQuery = queryStart >= 0 ? hashContent.slice(queryStart + 1) : hashContent;
  if (!hashQuery || !hashQuery.includes("=")) {
    return params;
  }
  const hashParams = new URLSearchParams(hashQuery);
  hashParams.forEach((value, key) => {
    params.append(key, value);
  });
  return params;
}

export function getSearchFlowDebugFlagFromLocation(
  locationLike = typeof window !== "undefined" ? window.location : null
) {
  const params = getSearchFlowDebugUrlParams(locationLike);
  const value = params.get(SEARCH_FLOW_DEBUG_QUERY_PARAM);
  return normalizeSearchFlowDebugValue(value);
}

export function buildSearchFlowDebugQueryParam(enabled = false) {
  return enabled ? `${SEARCH_FLOW_DEBUG_QUERY_PARAM}=${SEARCH_FLOW_DEBUG_QUERY_VALUE}` : "";
}

export function openSearchFlowDebugConsoleGroup(enabled, label, collapsed = true) {
  if (!enabled) return false;
  const groupFn =
    collapsed && typeof console.groupCollapsed === "function" ? console.groupCollapsed : console.group;
  groupFn(label);
  return true;
}

export function closeSearchFlowDebugConsoleGroup(opened) {
  if (opened) {
    console.groupEnd();
  }
}

export async function runWithSearchFlowDebugConsoleGroup(
  enabled,
  label,
  task,
  collapsed = true
) {
  const opened = openSearchFlowDebugConsoleGroup(enabled, label, collapsed);
  try {
    return await task();
  } finally {
    closeSearchFlowDebugConsoleGroup(opened);
  }
}

export function getSearchFlowDebugPmid(record = {}) {
  const pmid = String(record?.pmid ?? record?.uid ?? "").trim();
  return /^[0-9]+$/.test(pmid) ? pmid : "";
}

export function getSearchFlowDebugDoi(record = {}) {
  return String(record?.doi || "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

export function buildSearchFlowRecordKey(record = {}) {
  const pmid = getSearchFlowDebugPmid(record);
  if (pmid) return `pmid:${pmid}`;
  const doi = getSearchFlowDebugDoi(record);
  if (doi) return `doi:${doi.toLowerCase()}`;
  const openAlexId = String(record?.openAlexId || "").trim();
  if (openAlexId) return `oa:${openAlexId.toLowerCase()}`;
  const fallbackId = String(record?.id || record?.uid || record?.key || "").trim();
  return fallbackId ? `id:${fallbackId.toLowerCase()}` : "";
}

export function summarizeSearchFlowRecord(record = {}) {
  const sources = Array.isArray(record?.sources)
    ? record.sources.join(", ")
    : String(record?.source || record?.originSource || "").trim();
  return {
    key: buildSearchFlowRecordKey(record),
    pmid: getSearchFlowDebugPmid(record),
    doi: getSearchFlowDebugDoi(record),
    openAlexId: String(record?.openAlexId || "").trim(),
    source: sources,
    title: String(record?.title || "").trim().slice(0, 160),
    reason: String(record?.reason || "").trim(),
    stage: String(record?.stage || "").trim(),
  };
}
