// Load the general environment variables
const ABOUT_AI_URL = import.meta.env.VITE_ABOUT_AI_URL;
const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME;

// Load the NLM environment variables (only myncbishare needed client-side)
const MY_NCBI_SHARE = import.meta.env.VITE_MY_NCBI_SHARE;

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

// API proxy URL - automatically detects base path from script location
// This works even when JS is loaded from a different domain than the page
function getProxyUrl() {
  if (import.meta.env.VITE_API_PROXY_URL) {
    return normalizeBaseUrl(import.meta.env.VITE_API_PROXY_URL);
  }
  // Get base URL from the JS file location (import.meta.url)
  // Remove /assets/filename.js to get the base directory
  const scriptUrl = import.meta.url;
  const baseUrl = scriptUrl.replace(/\/assets\/[^/]+$/, "");
  return `${normalizeBaseUrl(baseUrl)}/backend`;
}
const API_PROXY_URL = getProxyUrl();

// PHP proxy URL for article summarization
// PHP calls Azure (for text extraction) then OpenAI (for summarization)
const AZURE_FUNCTION_URL = API_PROXY_URL;
const LONG_ABSTRACT_LENGTH_LIMIT = import.meta.env.VITE_LONG_ABSTRACT_LENGTH_LIMIT;
const WAIT_TIME_DISCLAIMER_DELAY = import.meta.env.VITE_WAIT_TIME_DISCLAIMER_DELAY;

// Load the Unpaywall environment variables
const UNPAYWALL_EMAIL = import.meta.env.VITE_UNPAYWALL_EMAIL;
const UNPAYWALL_URL = import.meta.env.VITE_UNPAYWALL_URL;

function resolveUrlAgainstCurrentPage(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const baseHref = typeof window !== "undefined" ? window.location.href : "http://localhost/";
    return new URL(trimmed, baseHref).toString();
  } catch (_) {
    return "";
  }
}

// Export the settings
export function resolveAiURL(value) {
  return resolveUrlAgainstCurrentPage(value);
}

export const aiURL = resolveAiURL(ABOUT_AI_URL);

export function getAiURL(overrideValue = "") {
  const resolvedOverride = resolveAiURL(overrideValue);
  if (resolvedOverride) {
    return resolvedOverride;
  }
  return aiURL;
}

function parseNumberWithFallback(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * @typedef {settings} Settings
 */
export const settings = {
  client: CLIENT_NAME,
  nlm: {
    // API credentials are now handled server-side via PHP proxy
    myncbishare: MY_NCBI_SHARE,
    // Use direct PHP endpoints as fallback when rewrite rules are unavailable.
    proxyUrl: API_PROXY_URL + '/api',
  },
  openAi: {
    baseUrl: API_PROXY_URL,
    // PHP proxy URL for article summarization (calls Azure for text, then OpenAI)
    azureFunctionUrl: AZURE_FUNCTION_URL,
    // The combined abstract length of the selected articles in characters
    longAbstractLengthLimit: parseNumberWithFallback(LONG_ABSTRACT_LENGTH_LIMIT, 5000),
    // The amount of milliseconds before the wait time disclaimer is shown
    waitTimeDisclaimerDelay: parseNumberWithFallback(WAIT_TIME_DISCLAIMER_DELAY, 5000),
  },
  unpaywall: {
    email: UNPAYWALL_EMAIL,
    baseUrl: UNPAYWALL_URL,
  },
};
