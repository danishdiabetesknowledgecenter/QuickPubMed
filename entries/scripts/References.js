// Import of existing global styles
import "@/assets/styles/styles.css";
import "@/assets/styles/references.css";

import References from "@/components/References.vue";
import { applyThemeFromConfig, config, loadThemeOverridesFromBackend } from "@/config/config";
import { settings } from "@/config/settings";
import { createConfiguredApp } from "./createConfiguredApp";

/**
 * Vue.prototype.$dateFormat = "da-DK";
 * en-US for American, en-GB for British, de-DR for German and so on.
 * Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
 */

function parseJSON(value) {
  try {
    return value ? JSON.parse(value) : undefined;
  } catch (e) {
    console.error("JSON parse error:", e);
    return undefined;
  }
}

// Select all elements with the 'qpm-references' class (fallback to legacy class)
const referencesDivs = document.querySelectorAll(".qpm-references, .references");

referencesDivs.forEach((referencesDiv, index) => {
  if (!referencesDiv.id) {
    referencesDiv.id = `qpm-references-${index + 1}`;
  }

  // Manually assign each prop with appropriate type conversions
  const domain = referencesDiv.dataset.domain || undefined;
  const useAI = referencesDiv.dataset.useAI === "true";
  const useAISummarizer = referencesDiv.dataset.useAISummarizer === "true";
  const ids = referencesDiv.dataset.ids || undefined;
  const query = referencesDiv.dataset.query || undefined;
  const queryResults = Number(referencesDiv.dataset.queryResults) || undefined;
  const sortMethod = referencesDiv.dataset.sortMethod || undefined;
  const hideButtons = referencesDiv.dataset.hideButtons === "true";
  const showDate = referencesDiv.dataset.showDate === "true";
  const date = referencesDiv.dataset.date || undefined;
  const title = referencesDiv.dataset.title || undefined;
  const booktitle = referencesDiv.dataset.booktitle || undefined;
  const vernaculartitle = referencesDiv.dataset.vernaculartitle || undefined;
  const authors = referencesDiv.dataset.authors || undefined;
  const source = referencesDiv.dataset.source || undefined;
  const abstract = referencesDiv.dataset.abstract || undefined;
  const doi = referencesDiv.dataset.doi || undefined;
  const isCustomDoi = referencesDiv.dataset.isCustomDoi === "true";
  const language = referencesDiv.dataset.language || "dk";
  const hyperLink = referencesDiv.dataset.hyperLink || undefined;
  const hyperLinkText = referencesDiv.dataset.hyperLinkText || undefined;
  const sectionedAbstract = parseJSON(referencesDiv.dataset.sectionedAbstract);
  const componentNo = Number(referencesDiv.dataset.componentNo) || undefined;
  const shownSixAuthors = referencesDiv.dataset.shownSixAuthors === "true";
  const showAltmetricBadge = referencesDiv.dataset.showAltmetricBadge === "true";
  const showDimensionsBadge = referencesDiv.dataset.showDimensionsBadge === "true";
  const useTranslateTitle = referencesDiv.dataset.useTranslateTitle === "true";

  config.domain = domain;
  loadThemeOverridesFromBackend(domain, settings.nlm.proxyUrl).finally(() => {
    applyThemeFromConfig(domain);
  });
  config.language = language;
  config.useAI = useAI;
  config.useAISummarizer = useAISummarizer;

  // Initialize Vue instance for each element
  createConfiguredApp(References, {
    ids,
    query,
    queryResults,
    sortMethod,
    hideButtons,
    showDate,
    date,
    title,
    booktitle,
    vernaculartitle,
    authors,
    source,
    abstract,
    doi,
    isCustomDoi,
    language,
    hyperLink,
    hyperLinkText,
    sectionedAbstract,
    componentNo,
    shownSixAuthors,
    showAltmetricBadge,
    showDimensionsBadge,
    useTranslateTitle,
  }).mount(referencesDiv);
});
