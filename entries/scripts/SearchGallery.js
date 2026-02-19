// Import of existing global styles
import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

import { createApp, h } from "vue";
import VueShowdown from "vue-showdown";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";
import SearchGallery from "@/components/SearchGallery.vue";
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

const searchGalleryDiv = document.getElementById("search-gallery");

const domain = searchGalleryDiv.dataset.domain || undefined;

// Parse hideTopics på samme måde som i MainWrapper.js
let parsedHideTopics = [];
if (searchGalleryDiv.dataset.hideTopics) {
  try {
    parsedHideTopics = JSON.parse(searchGalleryDiv.dataset.hideTopics.replace(/'/g, '"'));
  } catch (e) {
    console.warn("Kunne ikke parse hideTopics dataset:", e);
  }
}

const language = searchGalleryDiv.dataset.language || undefined;

// Parse collapsedLevels: comma-separated list of level numbers that should start collapsed
const collapsedLevels = searchGalleryDiv.dataset.collapsedLevels
  ? searchGalleryDiv.dataset.collapsedLevels
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n))
  : [];

config.domain = domain;

createConfiguredApp(SearchGallery, {
  hideTopics: parsedHideTopics,
  domain: domain,
  language: language,
  collapsedLevels: collapsedLevels,
}).mount("#search-gallery");
