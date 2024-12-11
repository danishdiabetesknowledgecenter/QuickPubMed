import Vue from "vue";

export const config = Vue.observable({
  domain: "diabetes", // Default domain
  language: "da", // Default language NOT USED YET
  useAI: true, // AI feature flag for all ai feature
  useAISummarizer: true, // AI feature flag for the article summarizer
});
