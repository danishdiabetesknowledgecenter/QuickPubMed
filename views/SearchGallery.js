// Import of existing global styles
import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

import Vue from "vue";
import VueShowdown from "vue-showdown";
import { VTooltip } from "v-tooltip";
import SearchGallery from "@/components/SearchGallery.vue";
import { config } from "@/config/config";

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

const searchGalleryDiv = document.getElementById("search-gallery");

const domain = searchGalleryDiv.dataset.domain || undefined;

// Parse hideTopics på samme måde som i MainWrapper.js
let parsedHideTopics = [];
if (searchGalleryDiv.dataset.hideTopics) {
  try {
    console.log('Attempting to parse:', searchGalleryDiv.dataset.hideTopics.replace(/'/g, '"'));
    parsedHideTopics = JSON.parse(searchGalleryDiv.dataset.hideTopics.replace(/'/g, '"'));
    console.log('Parsed result:', parsedHideTopics);
    console.log('Parsed type:', typeof parsedHideTopics);
  } catch (e) {
    console.warn('Kunne ikke parse hideTopics dataset:', e);
  }
}

const language = searchGalleryDiv.dataset.language || undefined;

config.domain = domain;

new Vue({
  render: (h) =>
    h(SearchGallery, {
      props: {
        hideTopics: parsedHideTopics,  // Send det parsede array
        domain: domain,
        language: language,
      },
    }),
}).$mount("#search-gallery");
