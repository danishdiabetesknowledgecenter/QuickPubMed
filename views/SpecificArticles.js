// Import of existing global styles
import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

import Vue from "vue";
import VueShowdown from "vue-showdown";
import { VTooltip } from "v-tooltip";
import SpecificArticles from "@/components/SpecificArticles.vue";
import { config } from "@/config/config";
import { loadPromptRules } from "@/utils/contentLoader";

// There are issues with timing if loading this in summarizeArticle so we have to load it here
const loadedPromptRules = loadPromptRules(config.domain);
const promptRules = loadedPromptRules.reduce((acc, module) => {
  return { ...acc, ...module.promptRules };
}, {});

Vue.prototype.$promptRules = promptRules;
/**
 * Vue.prototype.$dateFormat = "da-DK";
 * en-US for American, en-GB for British, de-DR for German and so on.
 * Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
 */
Vue.prototype.$helpTextDelay = { show: 500, hide: 100 };
Vue.prototype.$alwaysShowFilter = true;

Vue.use(VueShowdown, {
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
});

Vue.directive("tooltip", VTooltip);

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
  const queryResults = specificArticleDiv.dataset.queryResults || undefined;
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

  config.domain = domain;
  config.language = language;
  config.useAI = useAI;
  config.useAISummarizer = useAISummarizer;

  // Initialize Vue instance for each element
  new Vue({
    render: (h) =>
      h(SpecificArticles, {
        props: {
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
        },
      }),
  }).$mount(specificArticleDiv);
});
