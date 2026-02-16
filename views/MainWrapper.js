// Import of existing global styles
import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

import { createApp, h } from "vue";
import VueShowdown from "vue-showdown";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";
import MainWrapper from "@/components/MainWrapper.vue";
import { config } from "@/config/config";

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
  app.use(FloatingVue, {
    themes: {
      tooltip: {
        html: true,
      },
    },
  });
  app.config.globalProperties.$helpTextDelay = { show: 500, hide: 100 };
  app.config.globalProperties.$alwaysShowFilter = true;
  return app;
}

// Find alle elementer med klassen "main-wrapper" for at understøtte flere instanser på samme side
const mainWrapperDivs = document.querySelectorAll(".main-wrapper");

mainWrapperDivs.forEach((mainWrapperDiv, index) => {
  // Generer et unikt ID for hver instans hvis det ikke allerede har et
  if (!mainWrapperDiv.id) {
    mainWrapperDiv.id = `main-wrapper-${index}`;
  }

  // Keep empty string as-is (don't convert to undefined)
  const domain = mainWrapperDiv.dataset.domain !== undefined ? mainWrapperDiv.dataset.domain : null;
  const useAI = mainWrapperDiv.dataset.useAI === "true";
  const useAISummarizer = mainWrapperDiv.dataset.useAISummarizer === "true";
  const useMeshValidation = mainWrapperDiv.dataset.useMeshValidation === "true";
  const openFilters = mainWrapperDiv.dataset.openFilters === "true";

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

  const parsedHideTopics = parseDatasetList(mainWrapperDiv.dataset.hideTopics, "hideTopics");
  const parsedHideLimits = parseDatasetList(mainWrapperDiv.dataset.hideLimits, "hideLimits");
  const parsedCheckLimits = parseDatasetList(mainWrapperDiv.dataset.checkLimits, "checkLimits");
  const parsedOrderLimits = parseDatasetList(mainWrapperDiv.dataset.orderLimits, "orderLimits");
  const language = mainWrapperDiv.dataset.language || undefined;
  const componentNo = mainWrapperDiv.dataset.componentNo || undefined;
  const standardStringAdd = mainWrapperDiv.dataset.standardStringAdd === "true";
  const standardStringScopeRaw = mainWrapperDiv.dataset.standardStringScope;
  const standardStringScope =
    standardStringScopeRaw && ["narrow", "normal", "broad"].includes(standardStringScopeRaw)
      ? standardStringScopeRaw
      : "normal";

  // Set global config (for backward compatibility with single-instance usage)
  if (domain) {
    config.domain = domain;
  }
  if (language) {
    config.language = language;
  }
  config.useAI = useAI;
  config.useAISummarizer = useAISummarizer;
  config.useMeshValidation = useMeshValidation;

  createConfiguredApp(
    MainWrapper,
    {
      hideTopics: parsedHideTopics,
      hideLimits: parsedHideLimits,
      checkLimits: parsedCheckLimits,
      orderLimits: parsedOrderLimits,
      openFilters: openFilters,
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
    },
  ).mount(`#${mainWrapperDiv.id}`);
});
