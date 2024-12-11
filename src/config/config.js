import Vue from "vue";

export const config = Vue.observable({
  domain: "", // Default domain
  language: "", // Default language NOT USED YET
  useAI: false, // AI feature flag for all ai feature
  useAISummarizer: false, // AI feature flag for the article summarizer
});
