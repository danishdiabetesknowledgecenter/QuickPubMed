// Import of existing global styles
import "@/assets/styles/qpm-style.css";
import "@/assets/styles/qpm-style-strings.css";

import Vue from "vue";
import VueShowdown from "vue-showdown";
import { VTooltip } from "v-tooltip";
import MainWrapper from "@/components/MainWrapper.vue";
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

const mainWrapperDiv = document.getElementById("main-wrapper");

const domain = mainWrapperDiv.dataset.domain || undefined;
const useAI = mainWrapperDiv.dataset.useAI === "true";
const useAISummarizer = mainWrapperDiv.dataset.useAISummarizer === "true";
const hideTopics = mainWrapperDiv.dataset.hideTopics || undefined;
const language = mainWrapperDiv.dataset.language || undefined;
const componentNo = mainWrapperDiv.dataset.componentNo || undefined;

config.domain = domain;
config.language = language;
config.useAI = useAI;
config.useAISummarizer = useAISummarizer;

new Vue({
  render: (h) =>
    h(MainWrapper, {
      props: {
        hideTopics: hideTopics,
        language: language,
        componentNo: componentNo,
      },
    }),
}).$mount("#main-wrapper");
