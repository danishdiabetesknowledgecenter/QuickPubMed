import { reactive } from "vue";
import { settings } from "@/config/settings.js";

export const config = reactive({
  domain: "", // Default domain
  language: "", // Default language NOT USED YET
  useAI: false, // AI feature flag for all ai feature
  useAISummarizer: false, // AI feature flag for the article summarizer
  useMeshValidation: true, // Validate AI-translated [mh] terms via NLM E-utilities MeSH database
  semanticSourceLimits: {}, // Frontend-safe semantic source limits from backend config
  rerankConfig: {}, // Frontend-safe rerank settings from backend config
  translationSourcesByDomain: {}, // Domain-specific default source selection: { domainKey: ["pubmed", ...] }
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

export async function loadThemeOverridesFromBackend(domain, apiBaseUrl) {
  const normalizedDomain = String(domain || "").trim().toLowerCase();
  const resolvedApiBase = resolveThemeApiBase(apiBaseUrl);
  if (!normalizedDomain || !resolvedApiBase) return;

  const cacheKey = `${resolvedApiBase}::${normalizedDomain}`;
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
      const url = `${resolvedApiBase}/ThemeConfig.php${separator}domain=${encodeURIComponent(normalizedDomain)}`;
      const response = await fetch(url, { method: "GET", credentials: "omit" });
      if (!response.ok) return;

      const payload = await response.json();
      if (!payload || typeof payload !== "object") return;

      if (payload.globalTheme && typeof payload.globalTheme === "object") {
        config.theme = { ...config.theme, ...payload.globalTheme };
      }

      if (payload.themeByDomain && typeof payload.themeByDomain === "object") {
        config.themeByDomain = { ...config.themeByDomain, ...payload.themeByDomain };
      }

      if (payload.domainTheme && typeof payload.domainTheme === "object") {
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

      if (payload.domainClassOverrides && typeof payload.domainClassOverrides === "object") {
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

      if (payload.translationSourcesConfigured === true && Array.isArray(payload.translationSources)) {
        const allowed = new Set([
          "pubmed",
          "pubmedBestMatch",
          "semanticScholar",
          "openAlex",
          "elicit",
          "scite",
          "core",
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
