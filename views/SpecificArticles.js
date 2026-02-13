// Import of existing global styles
import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

import { createApp, h } from "vue";
import VueShowdown from "vue-showdown";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";
import SpecificArticles from "@/components/SpecificArticles.vue";
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

function createConfiguredApp(rootComponent, props) {
  const app = createApp({
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

function parseJSON(value) {
  try {
    return value ? JSON.parse(value) : undefined;
  } catch (e) {
    console.error("JSON parse error:", e);
    return undefined;
  }
}

// Select all elements with the 'specific-articles' class
const specificArticleDivs = document.querySelectorAll(".specific-articles");

specificArticleDivs.forEach((specificArticleDiv) => {
  // Manually assign each prop with appropriate type conversions
  const domain = specificArticleDiv.dataset.domain || undefined;
  const useAI = specificArticleDiv.dataset.useAI === "true";
  const useAISummarizer = specificArticleDiv.dataset.useAISummarizer === "true";
  const ids = specificArticleDiv.dataset.ids || undefined;
  const query = specificArticleDiv.dataset.query || undefined;
  const queryResults = Number(specificArticleDiv.dataset.queryResults) || undefined;
  const sortMethod = specificArticleDiv.dataset.sortMethod || undefined;
  const hideButtons = specificArticleDiv.dataset.hideButtons === "true";
  const showDate = specificArticleDiv.dataset.showDate === "true";
  const date = specificArticleDiv.dataset.date || undefined;
  const title = specificArticleDiv.dataset.title || undefined;
  const booktitle = specificArticleDiv.dataset.booktitle || undefined;
  const vernaculartitle = specificArticleDiv.dataset.vernaculartitle || undefined;
  const authors = specificArticleDiv.dataset.authors || undefined;
  const source = specificArticleDiv.dataset.source || undefined;
  const abstract = specificArticleDiv.dataset.abstract || undefined;
  const doi = specificArticleDiv.dataset.doi || undefined;
  const isCustomDoi = specificArticleDiv.dataset.isCustomDoi === "true";
  const language = specificArticleDiv.dataset.language || "dk";
  const hyperLink = specificArticleDiv.dataset.hyperLink || undefined;
  const hyperLinkText = specificArticleDiv.dataset.hyperLinkText || undefined;
  const sectionedAbstract = parseJSON(specificArticleDiv.dataset.sectionedAbstract);
  const componentNo = Number(specificArticleDiv.dataset.componentNo) || undefined;
  const shownSixAuthors = specificArticleDiv.dataset.shownSixAuthors === "true";
  const showAltmetricBadge = specificArticleDiv.dataset.showAltmetricBadge === "true";
  const showDimensionsBadge = specificArticleDiv.dataset.showDimensionsBadge === "true";
  const useTranslateTitle = specificArticleDiv.dataset.useTranslateTitle === "true";

  config.domain = domain;
  config.language = language;
  config.useAI = useAI;
  config.useAISummarizer = useAISummarizer;

  // Initialize Vue instance for each element
  createConfiguredApp(SpecificArticles, {
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
  }).mount(specificArticleDiv);
});
