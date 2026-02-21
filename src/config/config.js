import { reactive } from "vue";

export const config = reactive({
  domain: "", // Default domain
  language: "", // Default language NOT USED YET
  useAI: false, // AI feature flag for all ai feature
  useAISummarizer: false, // AI feature flag for the article summarizer
  useMeshValidation: true, // Validate AI-translated [mh] terms via NLM E-utilities MeSH database
  theme: {}, // Global CSS custom properties to override :root defaults
  themeByDomain: {}, // Domain-specific CSS variable overrides: { domainKey: { "--color-...": "..." } }
});

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
  } catch (error) {
    console.warn("[ThemeConfig] Could not load theme overrides from backend:", error);
  }
}
