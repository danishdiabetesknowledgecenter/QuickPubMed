const runtimeTopicPayloadCache = new Map();
let runtimeFiltersPayloadCache = null;
const runtimePromptRulesPayloadCache = new Map();
let runtimeContentEndpointAvailable = true;

function normalizeExplicitApiBase(value) {
  const base = String(value || "").trim().replace(/\/+$/, "");
  if (!base) return "";
  if (base.endsWith("/api")) return base;
  if (base.endsWith("/backend")) return `${base}/api`;
  return base;
}

function getContentApiBaseUrl() {
  const urlApiBase = new URLSearchParams(window.location.search).get("apiBase");
  const normalizedUrlApiBase = normalizeExplicitApiBase(urlApiBase);
  if (normalizedUrlApiBase) {
    return normalizedUrlApiBase;
  }

  const datasetApiBase = document
    .querySelector(
      ".qpm-searchform[data-content-api-base-url], .searchform[data-content-api-base-url], #qpm-searchstrings[data-content-api-base-url], #searchstrings[data-content-api-base-url]",
    )
    ?.getAttribute("data-content-api-base-url");
  const normalizedDatasetApiBase = normalizeExplicitApiBase(datasetApiBase);
  if (normalizedDatasetApiBase) {
    return normalizedDatasetApiBase;
  }

  if (import.meta.env.VITE_API_PROXY_URL) {
    return `${import.meta.env.VITE_API_PROXY_URL}/api`;
  }
  const scriptUrl = import.meta.url;
  const baseUrl = scriptUrl.replace(/\/assets\/[^/]+$/, "");
  return `${baseUrl}/backend/api`;
}

async function fetchRuntimeContent(type, domain = "") {
  if (!runtimeContentEndpointAvailable) {
    throw new Error("Runtime content endpoint unavailable");
  }

  const params = new URLSearchParams({ type });
  if (domain) {
    params.set("domain", domain);
  }
  params.set("_", String(Date.now()));

  const response = await fetch(
    `${getContentApiBaseUrl()}/PublicContent.php?${params.toString()}`,
    { credentials: "omit", cache: "no-store" }
  );
  if (!response.ok) {
    if (response.status === 404) {
      runtimeContentEndpointAvailable = false;
    }
    throw new Error(`Failed to load runtime ${type} content`);
  }
  const payload = await response.json();
  if (!payload || payload.ok !== true || typeof payload.data !== "object") {
    throw new Error(`Invalid runtime ${type} payload`);
  }
  return payload.data;
}

export async function loadTopicsFromRuntime(domain) {
  if (!domain) {
    return [];
  }

  const payload = await fetchRuntimeContent("topics", domain);
  runtimeTopicPayloadCache.set(domain, payload);
  return Array.isArray(payload.topics) ? payload.topics : [];
}

export async function loadFiltersFromRuntime() {
  const payload = await fetchRuntimeContent("filters");
  runtimeFiltersPayloadCache = payload;
  return Array.isArray(payload.filters) ? payload.filters : [];
}

export async function loadPromptRulesFromRuntime(domain) {
  if (!domain) {
    return {};
  }

  const payload = await fetchRuntimeContent("prompt-rules", domain);
  runtimePromptRulesPayloadCache.set(domain, payload);
  return payload && typeof payload.promptRules === "object" ? payload.promptRules : {};
}

/**
 * Loads topic modules for the specified domain.
 *
 * @param {string} domain - The domain name (e.g., 'diabetes', 'dementia').
 * @returns {Array<Object>} - Always empty (runtime API is required).
 */
export function loadTopics(domain) {
  void domain;
  return [];
}

/**
 * Loads standardString for the specified domain from runtime payload cache only.
 * Runtime API is required; no local fallback modules are used.
 *
 * @param {string} domain - The domain name (e.g., 'diabetes', 'dementia').
 * @returns {Object|null} - { narrow, normal, broad } or null if missing/empty.
 */
export function loadStandardString(domain) {
  if (domain && runtimeTopicPayloadCache.has(domain)) {
    const runtimePayload = runtimeTopicPayloadCache.get(domain);
    const runtimeStandardString = runtimePayload?.standardString;
    if (
      runtimeStandardString &&
      typeof runtimeStandardString === "object" &&
      Object.keys(runtimeStandardString).length > 0
    ) {
      return runtimeStandardString;
    }
  }

  return null;
}

