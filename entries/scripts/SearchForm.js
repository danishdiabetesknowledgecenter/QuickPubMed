// Import of existing global styles
import "@/assets/styles/styles.css";
import "@/assets/styles/searchform.css";
import "@/assets/styles/searchstrings.css";

import { createApp, h } from "vue";
import VueShowdown from "vue-showdown";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";
import SearchForm from "@/components/SearchForm.vue";
import { applyThemeFromConfig, config, loadThemeOverridesFromBackend } from "@/config/config";
import { getAiURL, settings } from "@/config/settings";

/**
 * Vue.prototype.$dateFormat = "da-DK";
 * en-US for American, en-GB for British, de-DR for German and so on.
 * Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
 */

const showdownConfig = {
  flavor: "github", // Set default flavor of showdown
  options: {
    emoji: false, // Disable emoji support
    tables: true, // Enable table support
    strikethrough: true, // Enable strikethrough
    simpleLineBreaks: true, // Enable simple line breaks
    tasklists: true, // Enable task lists
    smartIndentationFix: true, // Fix indentation issues
    smartypants: true, // Enable smart punctuation
    ghMentions: true, // Enable GitHub mentions
    underline: true, // Enable underline
    completeHTMLDocument: false, // Render only HTML fragments
  },
};

function createConfiguredApp(rootComponent, props, provideData) {
  const app = createApp({
    provide: provideData,
    render: () => h(rootComponent, props),
  });
  app.use(VueShowdown, showdownConfig);
  const isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  app.use(FloatingVue, {
    themes: {
      tooltip: {
        html: true,
        triggers: isTouch ? ["click"] : ["hover", "focus"],
        hideTriggers: isTouch ? ["click"] : ["hover"],
        autoHide: true,
      },
    },
  });
  if (isTouch) {
    document.addEventListener("scroll", () => {
      document.querySelectorAll(".v-popper--shown").forEach((el) => {
        if (el.__vue__?.[0]?.$refs?.popper) el.__vue__[0].$refs.popper.hide();
      });
      document.body.click();
    }, { passive: true, capture: true });
  }
  app.config.globalProperties.$helpTextDelay = { show: 500, hide: 100 };
  app.config.globalProperties.$alwaysShowFilter = true;
  return app;
}

// Find alle elementer med klassen "qpm-searchform" (med fallback til legacy class)
const searchFormDivs = document.querySelectorAll(".qpm-searchform, .searchform");

searchFormDivs.forEach((searchFormDiv, index) => {
  // Generer et unikt ID for hver instans hvis det ikke allerede har et
  if (!searchFormDiv.id) {
    searchFormDiv.id = `qpm-searchform-${index + 1}`;
  }

  // Keep empty string as-is (don't convert to undefined)
  const domain = searchFormDiv.dataset.domain !== undefined ? searchFormDiv.dataset.domain : null;
  const useAI = searchFormDiv.dataset.useAI === "true";
  const useAISummarizer = searchFormDiv.dataset.useAISummarizer === "true";
  const useMeshValidation = searchFormDiv.dataset.useMeshValidation === "true";
  const openLimits = searchFormDiv.dataset.openLimits === "true";

  const parseDatasetList = (value, label) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value.replace(/'/g, '"'));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => typeof item === "string" && item.trim() !== "");
    } catch (e) {
      console.warn(`Could not parse ${label} dataset:`, e);
      return [];
    }
  };

  const parsedHideTopics = parseDatasetList(searchFormDiv.dataset.hideTopics, "hideTopics");
  const parsedHideLimits = parseDatasetList(searchFormDiv.dataset.hideLimits, "hideLimits");
  const parsedCheckLimits = parseDatasetList(searchFormDiv.dataset.checkLimits, "checkLimits");
  const parsedOrderLimits = parseDatasetList(searchFormDiv.dataset.orderLimits, "orderLimits");
  const language = searchFormDiv.dataset.language || undefined;
  const componentNoRaw = searchFormDiv.dataset.componentNo;
  const componentNo =
    componentNoRaw && componentNoRaw.trim() !== "" && Number.isFinite(Number(componentNoRaw))
      ? Number(componentNoRaw)
      : undefined;
  const instanceAiURL = getAiURL(searchFormDiv.dataset.aiUrl || "");
  const standardStringAdd = searchFormDiv.dataset.standardStringAdd === "true";
  const standardStringScopeRaw = searchFormDiv.dataset.standardStringScope;
  const standardStringScope =
    standardStringScopeRaw && ["narrow", "normal", "broad"].includes(standardStringScopeRaw)
      ? standardStringScopeRaw
      : "normal";

  // Set global config (for backward compatibility with single-instance usage)
  if (domain) {
    config.domain = domain;
  }
  loadThemeOverridesFromBackend(domain || config.domain, settings.nlm.proxyUrl).finally(() => {
    applyThemeFromConfig(domain || config.domain);
  });
  if (language) {
    config.language = language;
  }
  config.useAI = useAI;
  config.useAISummarizer = useAISummarizer;
  config.useMeshValidation = useMeshValidation;

  createConfiguredApp(
    SearchForm,
    {
      hideTopics: parsedHideTopics,
      hideLimits: parsedHideLimits,
      checkLimits: parsedCheckLimits,
      orderLimits: parsedOrderLimits,
      openLimits: openLimits,
      language: language,
      componentNo: componentNo,
      domain: domain,
      standardStringAdd: standardStringAdd,
      standardStringScope: standardStringScope,
    },
    {
      instanceDomain: domain,
      instanceLanguage: language,
      instanceUseAI: useAI,
      instanceUseAISummarizer: useAISummarizer,
      instanceUseMeshValidation: useMeshValidation,
      instanceAiURL: instanceAiURL,
    }
  ).mount(`#${searchFormDiv.id}`);
});
