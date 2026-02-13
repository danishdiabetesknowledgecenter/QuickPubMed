import { loadPromptRules } from "@/utils/contentLoader";
import { config } from "@/config/config";

export const promptRuleLoaderMixin = {
  // Inject domain from parent Vue instance (supports multiple instances on same page)
  inject: {
    instanceDomain: { default: null },
  },
  data() {
    return {
      domainSpecificPromptRules: {},
    };
  },
  computed: {
    // Use injected domain if available (including empty string), otherwise fall back to global config
    currentDomain() {
      return this.instanceDomain !== null ? this.instanceDomain : config.domain;
    },
  },
  watch: {
    currentDomain: {
      handler(newDomain) {
        if (!newDomain) {
          return;
        }
        const loadedPromptRules = loadPromptRules(newDomain);
        const promptRules = loadedPromptRules.reduce((acc, module) => {
          return { ...acc, ...module.promptRules };
        }, {});
        this.domainSpecificPromptRules = promptRules;
      },
      immediate: true,
    },
  },
};
