import { reactive } from "vue";
import { settings } from "@/config/settings.js";

export const config = reactive({
  domain: "", // Default domain
  language: "", // Default language NOT USED YET
  useAI: false, // AI feature flag for all ai feature
  useAISummarizer: false, // AI feature flag for the article summarizer
  useMeshValidation: true, // Validate AI-translated [mh] terms via NLM E-utilities MeSH database
  semanticSourceLimits: {}, // Frontend-safe semantic source limits from backend config
  semanticRescueConfig: {}, // Frontend-safe PubMed lexical rescue settings from backend config
  semanticLlmRerankConfig: {}, // Frontend-safe semantic final rerank settings from backend config
  rerankConfig: {}, // Frontend-safe rerank settings from backend config
  translationSourcesByDomain: {}, // Domain-specific source availability fallback: { domainKey: ["pubmed", ...] }
  elicitGated: false, // Global: backend says Elicit is gated and caller is not unlocked
  theme: {}, // Global CSS custom properties to override :root defaults
  themeByDomain: {}, // Domain-specific CSS variable overrides: { domainKey: { "--color-...": "..." } }
  classOverrides: {}, // Global class overrides: { baseClass: { mode, classes[] } }
  classOverridesByDomain: {}, // Domain class overrides: { domainKey: { baseClass: { mode, classes[] } } }
});

const THEME_CONFIG_CACHE_TTL_MS = (() => {
  const raw = Number(import.meta.env.VITE_THEME_CACHE_TTL_MS);
  if (Number.isFinite(raw) && raw >= 0) {
    return raw;
  }
  return 5 * 60 * 1000;
})();
const themeConfigCache = new Map();
const themeConfigInFlight = new Map();
let classOverrideObserver = null;
let activeClassOverrides = {};
let isApplyingClassOverrides = false;

function normalizeClassTokens(value) {
  const rawTokens = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(/\s+/)
    : [];
  return Array.from(
    new Set(
      rawTokens
        .map((token) => String(token || "").trim())
        .filter((token) => token && /^[A-Za-z0-9_-]+$/.test(token))
    )
  );
}

function normalizeClassOverrideRule(rawRule) {
  if (typeof rawRule === "string" || Array.isArray(rawRule)) {
    const classes = normalizeClassTokens(rawRule);
    if (classes.length === 0) return null;
    return { mode: "append", classes };
  }
  if (!rawRule || typeof rawRule !== "object" || Array.isArray(rawRule)) return null;
  const mode = String(rawRule.mode || "append").trim().toLowerCase() === "replace"
    ? "replace"
    : "append";
  const classes = normalizeClassTokens(rawRule.classes ?? rawRule.class_list ?? rawRule.class);
  if (mode === "append" && classes.length === 0) return null;
  return { mode, classes };
}

function normalizeClassOverridesMap(rawMap) {
  if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) return {};
  const out = {};
  Object.entries(rawMap).forEach(([baseClass, rawRule]) => {
    const normalizedBaseClass = String(baseClass || "").trim();
    if (!normalizedBaseClass || !/^[A-Za-z0-9_-]+$/.test(normalizedBaseClass)) return;
    const normalizedRule = normalizeClassOverrideRule(rawRule);
    if (!normalizedRule) return;
    out[normalizedBaseClass] = normalizedRule;
  });
  return out;
}

function escapeClassSelector(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return String(value).replace(/[^A-Za-z0-9_-]/g, "\\$&");
}

function resetManagedClassOverrides(root = document) {
  if (typeof document === "undefined") return;
  root
    .querySelectorAll("[data-qpm-class-override-original]")
    .forEach((el) => {
      const original = el.getAttribute("data-qpm-class-override-original");
      if (original !== null) {
        el.className = original;
      }
      el.removeAttribute("data-qpm-class-override-original");
    });
}

function applyClassRuleToElement(el, baseClass, rule) {
  if (!(el instanceof HTMLElement)) return;
  if (!el.hasAttribute("data-qpm-class-override-original")) {
    el.setAttribute("data-qpm-class-override-original", el.className || "");
  }
  const current = new Set(normalizeClassTokens(el.className || ""));
  if (rule.mode === "replace") {
    current.delete(baseClass);
  }
  (rule.classes || []).forEach((className) => current.add(className));
  const nextClassName = Array.from(current).join(" ");
  if (el.className !== nextClassName) {
    el.className = nextClassName;
  }
}

function applyClassOverridesToNode(node, classOverrides) {
  if (!(node instanceof Element)) return;
  Object.entries(classOverrides).forEach(([baseClass, rule]) => {
    if (node.classList.contains(baseClass)) {
      applyClassRuleToElement(node, baseClass, rule);
    }
    const selector = `.${escapeClassSelector(baseClass)}`;
    node.querySelectorAll(selector).forEach((el) => applyClassRuleToElement(el, baseClass, rule));
  });
}

function ensureClassOverrideObserver() {
  if (typeof document === "undefined") return;
  if (classOverrideObserver) return;
  classOverrideObserver = new MutationObserver((mutations) => {
    if (isApplyingClassOverrides) return;
    if (!activeClassOverrides || Object.keys(activeClassOverrides).length === 0) return;
    isApplyingClassOverrides = true;
    try {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => applyClassOverridesToNode(node, activeClassOverrides));
        } else if (mutation.type === "attributes" && mutation.target instanceof Element) {
          applyClassOverridesToNode(mutation.target, activeClassOverrides);
        }
      });
    } finally {
      isApplyingClassOverrides = false;
    }
  });
  classOverrideObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
}

function applyClassOverridesFromConfig(domain = config.domain) {
  if (typeof document === "undefined") return;
  const normalizedDomain = String(domain || "").trim().toLowerCase();
  const domainClassOverrides =
    (normalizedDomain &&
      config.classOverridesByDomain &&
      config.classOverridesByDomain[normalizedDomain]) ||
    {};
  const resolvedClassOverrides = {
    ...(config.classOverrides || {}),
    ...domainClassOverrides,
  };

  isApplyingClassOverrides = true;
  try {
    resetManagedClassOverrides(document);
    activeClassOverrides = resolvedClassOverrides;
    if (Object.keys(resolvedClassOverrides).length > 0) {
      ensureClassOverrideObserver();
      applyClassOverridesToNode(document.documentElement, resolvedClassOverrides);
    }
  } finally {
    isApplyingClassOverrides = false;
  }
}

export function applyThemeFromConfig(domain = config.domain) {
  if (typeof document === "undefined") return;
  const rootStyle = document.documentElement.style;
  const normalizedDomain = String(domain || "").trim().toLowerCase();
  const domainTheme =
    (normalizedDomain && config.themeByDomain && config.themeByDomain[normalizedDomain]) || {};
  const resolvedTheme = {
    ...(config.theme || {}),
    ...domainTheme,
  };

  Object.entries(resolvedTheme).forEach(([cssVar, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      rootStyle.setProperty(cssVar, String(value));
    }
  });
  applyClassOverridesFromConfig(domain);
}

function normalizeApiBase(value) {
  const base = String(value || "").trim().replace(/\/+$/, "");
  if (!base) return "";
  if (base.endsWith("/api")) return base;
  if (base.endsWith("/backend")) return `${base}/api`;
  return base;
}

function resolveThemeApiBase(explicitApiBaseUrl) {
  if (typeof window !== "undefined") {
    const urlApiBase = new URLSearchParams(window.location.search).get("apiBase");
    const normalizedUrlApiBase = normalizeApiBase(urlApiBase);
    if (normalizedUrlApiBase) return normalizedUrlApiBase;
  }
  return normalizeApiBase(explicitApiBaseUrl);
}

const ELICIT_UNLOCK_STORAGE_KEY = "qpmElicitUnlockKey";
const ELICIT_AUTOSELECT_STORAGE_KEY = "qpmElicitAutoSelectAfterUnlock";

function safeGetSessionStorage(key) {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return null;
    return window.sessionStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function safeSetSessionStorage(key, value) {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    if (value === null || value === undefined || value === "") {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, String(value));
    }
  } catch (_error) {
    /* ignore quota/privacy errors */
  }
}

// Session-scoped flag used to signal that Elicit should be auto-selected
// after the next reload (set just before reloading from the unlock prompt).
export function markElicitAutoSelectAfterUnlock() {
  safeSetSessionStorage(ELICIT_AUTOSELECT_STORAGE_KEY, "1");
}

// Reads the auto-select flag and clears it in the same call, so SearchForm
// only reacts to it once per successful unlock.
export function consumeElicitAutoSelectAfterUnlockFlag() {
  const value = safeGetSessionStorage(ELICIT_AUTOSELECT_STORAGE_KEY) === "1";
  if (value) safeSetSessionStorage(ELICIT_AUTOSELECT_STORAGE_KEY, null);
  return value;
}

function safeGetLocalStorage(key) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function safeSetLocalStorage(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (value === null || value === undefined || value === "") {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(value));
    }
  } catch (_error) {
    /* ignore quota/privacy errors */
  }
}

export function getStoredElicitUnlockKey() {
  const stored = safeGetLocalStorage(ELICIT_UNLOCK_STORAGE_KEY);
  return typeof stored === "string" ? stored.trim() : "";
}

export function setStoredElicitUnlockKey(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  safeSetLocalStorage(ELICIT_UNLOCK_STORAGE_KEY, normalized || null);
}

// Shared prompt helper used wherever a locked Elicit option is surfaced in the
// UI. Shows a prompt for the unlock code, persists it, and reloads the page so
// ThemeConfig.php is re-fetched and the semantic source list refreshes.
export function promptForElicitUnlockKey(getString) {
  if (typeof window === "undefined" || typeof window.prompt !== "function") {
    return;
  }
  const fallback =
    "Indtast kode for at låse op for ekstra AI-kilde (Elicit). Lad feltet være tomt for at fjerne en gemt kode.";
  const promptText =
    (typeof getString === "function" && getString("elicitUnlockPromptMessage")) || fallback;
  const existing = getStoredElicitUnlockKey();
  const input = window.prompt(promptText, existing || "");
  if (input === null) return;
  const trimmed = String(input).trim();
  setStoredElicitUnlockKey(trimmed);
  // When a non-empty code is submitted, flag that Elicit should be auto-
  // selected after the page reloads. If the backend rejects the code the
  // stored key is cleared (in loadThemeOverridesFromBackend) and the flag is
  // still consumed on the next load but the auto-select is a no-op because
  // runtimeConfig.elicitGated stays true.
  if (trimmed) {
    markElicitAutoSelectAfterUnlock();
  }
  if (window.location && typeof window.location.reload === "function") {
    window.location.reload();
  }
}

// Capture ?elicitKey=... from the URL once on load, persist it and strip it
// from the visible URL so it isn't shared accidentally.
function captureElicitKeyFromUrl() {
  if (typeof window === "undefined" || !window.location) return;
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("elicitKey")) return;
    const value = (params.get("elicitKey") || "").trim();
    // Always call the setter, so passing an empty ?elicitKey= explicitly clears
    // any previously stored key (useful as a reset/escape-hatch from the URL).
    setStoredElicitUnlockKey(value);
    params.delete("elicitKey");
    const query = params.toString();
    const newUrl =
      window.location.pathname + (query ? `?${query}` : "") + (window.location.hash || "");
    if (window.history && typeof window.history.replaceState === "function") {
      window.history.replaceState(window.history.state, "", newUrl);
    }
  } catch (_error) {
    /* ignore URL parsing failures */
  }
}
captureElicitKeyFromUrl();

export async function loadThemeOverridesFromBackend(domain, apiBaseUrl) {
  const normalizedDomain = String(domain || "").trim().toLowerCase();
  const resolvedApiBase = resolveThemeApiBase(apiBaseUrl);
  // We still fetch when no domain is set, so the global elicit gate flag is
  // retrieved even on domain-less pages.
  if (!resolvedApiBase) return;

  const elicitKey = getStoredElicitUnlockKey();
  const cacheKey = `${resolvedApiBase}::${normalizedDomain}::${elicitKey ? "k" : ""}`;
  const cached = themeConfigCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return;
  }

  if (themeConfigInFlight.has(cacheKey)) {
    await themeConfigInFlight.get(cacheKey);
    return;
  }

  const requestPromise = (async () => {
    try {
      const separator = resolvedApiBase.includes("?") ? "&" : "?";
      let url = `${resolvedApiBase}/ThemeConfig.php${separator}domain=${encodeURIComponent(normalizedDomain)}`;
      if (elicitKey) {
        url += `&elicitKey=${encodeURIComponent(elicitKey)}`;
      }
      const response = await fetch(url, { method: "GET", credentials: "omit" });
      if (!response.ok) return;

      const payload = await response.json();
      if (!payload || typeof payload !== "object") return;

      // If the user sent an elicit unlock code but the backend rejected it,
      // clear the stored key so the user isn't stuck sending an invalid value.
      if (elicitKey && payload.elicitUnlocked === false) {
        setStoredElicitUnlockKey("");
      }
      config.elicitGated = payload.elicitGated === true;

      if (payload.globalTheme && typeof payload.globalTheme === "object") {
        config.theme = { ...config.theme, ...payload.globalTheme };
      }

      if (payload.themeByDomain && typeof payload.themeByDomain === "object") {
        config.themeByDomain = { ...config.themeByDomain, ...payload.themeByDomain };
      }

      if (normalizedDomain && payload.domainTheme && typeof payload.domainTheme === "object") {
        config.themeByDomain = {
          ...config.themeByDomain,
          [normalizedDomain]: {
            ...(config.themeByDomain[normalizedDomain] || {}),
            ...payload.domainTheme,
          },
        };
      }

      if (payload.globalClassOverrides && typeof payload.globalClassOverrides === "object") {
        config.classOverrides = {
          ...config.classOverrides,
          ...normalizeClassOverridesMap(payload.globalClassOverrides),
        };
      }

      if (
        normalizedDomain &&
        payload.domainClassOverrides &&
        typeof payload.domainClassOverrides === "object"
      ) {
        config.classOverridesByDomain = {
          ...config.classOverridesByDomain,
          [normalizedDomain]: normalizeClassOverridesMap(payload.domainClassOverrides),
        };
      }

      if (payload.unpaywall && typeof payload.unpaywall === "object") {
        const backendUnpaywallBaseUrl = String(payload.unpaywall.baseUrl || "").trim();
        const backendUnpaywallEmail = String(payload.unpaywall.email || "").trim();
        if (backendUnpaywallBaseUrl) {
          settings.unpaywall.baseUrl = backendUnpaywallBaseUrl;
        }
        if (backendUnpaywallEmail) {
          settings.unpaywall.email = backendUnpaywallEmail;
        }
      }

      if (
        normalizedDomain &&
        payload.translationSourcesConfigured === true &&
        Array.isArray(payload.translationSources)
      ) {
        const allowed = new Set([
          "pubmed",
          "pubmedBestMatch",
          "semanticScholar",
          "openAlex",
          "elicit",
        ]);
        const normalizedSources = Array.from(
          new Set(
            payload.translationSources
              .map((source) => String(source || "").trim())
              .filter((source) => allowed.has(source))
          )
        );
        config.translationSourcesByDomain = {
          ...config.translationSourcesByDomain,
          [normalizedDomain]: normalizedSources,
        };
      }

      if (payload.semanticSourceLimits && typeof payload.semanticSourceLimits === "object") {
        const parsedLimits = Object.fromEntries(
          Object.entries(payload.semanticSourceLimits)
            .map(([sourceKey, rawLimit]) => [sourceKey, Number.parseInt(rawLimit, 10)])
            .filter(([, limit]) => Number.isFinite(limit) && limit > 0)
        );
        config.semanticSourceLimits = {
          ...config.semanticSourceLimits,
          ...parsedLimits,
        };
      }

      if (payload.semanticRescueConfig && typeof payload.semanticRescueConfig === "object") {
        config.semanticRescueConfig = {
          ...config.semanticRescueConfig,
          ...payload.semanticRescueConfig,
        };
      }

      if (payload.semanticLlmRerankConfig && typeof payload.semanticLlmRerankConfig === "object") {
        config.semanticLlmRerankConfig = {
          ...config.semanticLlmRerankConfig,
          ...payload.semanticLlmRerankConfig,
        };
      }

      if (payload.rerankConfig && typeof payload.rerankConfig === "object") {
        config.rerankConfig = {
          ...config.rerankConfig,
          ...payload.rerankConfig,
          sourceWeights: {
            ...(config.rerankConfig?.sourceWeights || {}),
            ...(payload.rerankConfig?.sourceWeights || {}),
          },
        };
      }

      themeConfigCache.set(cacheKey, { expiresAt: Date.now() + THEME_CONFIG_CACHE_TTL_MS });
    } catch (error) {
      console.warn("[ThemeConfig] Could not load theme overrides from backend:", error);
    }
  })();

  themeConfigInFlight.set(cacheKey, requestPromise);
  try {
    await requestPromise;
  } finally {
    themeConfigInFlight.delete(cacheKey);
  }
}
