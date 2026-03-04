// Import of existing global styles
import "@/assets/styles/styles.css";
import "@/assets/styles/searchstrings.css";

import SearchStrings from "@/components/SearchStrings.vue";
import { applyThemeFromConfig, config, loadThemeOverridesFromBackend } from "@/config/config";
import { settings } from "@/config/settings";
import { createConfiguredApp } from "./createConfiguredApp";

/**
 * Vue.prototype.$dateFormat = "da-DK";
 * en-US for American, en-GB for British, de-DR for German and so on.
 * Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
 */

const searchStringsDiv =
  document.getElementById("qpm-searchstrings") || document.getElementById("searchstrings");

const domain = searchStringsDiv.dataset.domain || undefined;

// Parse hideTopics på samme måde som i SearchForm.js
let parsedHideTopics = [];
if (searchStringsDiv.dataset.hideTopics) {
  try {
    parsedHideTopics = JSON.parse(searchStringsDiv.dataset.hideTopics.replace(/'/g, '"'));
  } catch (e) {
    console.warn("Kunne ikke parse hideTopics dataset:", e);
  }
}

const language = searchStringsDiv.dataset.language || undefined;

// Parse collapsedLevels: comma-separated list of level numbers that should start collapsed
const collapsedLevels = searchStringsDiv.dataset.collapsedLevels
  ? searchStringsDiv.dataset.collapsedLevels
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
  : [];

config.domain = domain;
loadThemeOverridesFromBackend(domain, settings.nlm.proxyUrl).finally(() => {
  applyThemeFromConfig(domain);
});

createConfiguredApp(SearchStrings, {
  hideTopics: parsedHideTopics,
  domain: domain,
  language: language,
  collapsedLevels: collapsedLevels,
}).mount(searchStringsDiv);
