import { reactive } from "vue";

export const config = reactive({
  domain: "", // Default domain
  language: "", // Default language NOT USED YET
  useAI: false, // AI feature flag for all ai feature
  useAISummarizer: false, // AI feature flag for the article summarizer
  useMeshValidation: true, // Validate AI-translated [mh] terms via NLM E-utilities MeSH database
});
