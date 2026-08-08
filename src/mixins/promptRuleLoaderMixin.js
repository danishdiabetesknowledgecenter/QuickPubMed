import { loadPromptRulesFromRuntime } from "@/utils/contentLoader";
import { config } from "@/config/config";
import { syncUrlDomainOverrideFromLocation, urlDomainOverride } from "@/utils/domainKey.js";

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
  created() {
    syncUrlDomainOverrideFromLocation();
  },
  computed: {
    // Priority: URL domain= → injected data-domain → global config.domain
    currentDomain() {
      if (urlDomainOverride.value !== null) {
        return urlDomainOverride.value;
      }
      return this.instanceDomain !== null ? this.instanceDomain : config.domain;
    },
  },
  watch: {
    currentDomain: {
      async handler(newDomain) {
        if (!newDomain) {
          this.domainSpecificPromptRules = {};
          return;
        }
        try {
          this.domainSpecificPromptRules = await loadPromptRulesFromRuntime(newDomain);
        } catch (error) {
          this.domainSpecificPromptRules = {};
        }
      },
      immediate: true,
    },
  },
};
