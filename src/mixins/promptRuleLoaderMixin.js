import { loadPromptRulesFromRuntime } from "@/utils/contentLoader";
import { config } from "@/config/config";
import { syncUrlDomainOverrideFromLocation, urlDomainOverride } from "@/utils/domainKey.js";
import { getSearchFlowDebugUrlParams } from "@/utils/searchFlowDebug.js";
import {
  readMountedSearchFormComponentNumbers,
  resolveInstanceCurrentDomain,
} from "@/utils/searchFormUrlTarget.js";

export const promptRuleLoaderMixin = {
  // Inject domain from parent Vue instance (supports multiple instances on same page)
  inject: {
    instanceDomain: { default: null },
    instanceComponentNo: { default: undefined },
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
    currentDomain() {
      return resolveInstanceCurrentDomain({
        instanceDomain: this.instanceDomain,
        componentNo: this.instanceComponentNo ?? this.componentNo ?? 1,
        urlDomainOverride: urlDomainOverride.value,
        urlParams: getSearchFlowDebugUrlParams(),
        mountedComponentNos: readMountedSearchFormComponentNumbers(),
        fallbackDomain: config.domain,
      });
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
