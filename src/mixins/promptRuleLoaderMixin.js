import { loadPromptRules } from "@/utils/contentLoader";
import { config } from "@/config/config";

export const promptRuleLoaderMixin = {
  data() {
    return {
      domainSpecificPromptRules: {},
    };
  },
  created() {
    this.loadPromptRulesData();
  },
  watch: {
    "config.domain": "loadPromptRulesData",
  },
  methods: {
    loadPromptRulesData() {
      const loadedPromptRules = loadPromptRules(config.domain);
      const promptRules = loadedPromptRules.reduce((acc, module) => {
        return { ...acc, ...module.promptRules };
      }, {});
      console.log("MIXIN | Prompt rules:", promptRules);
      this.domainSpecificPromptRules = promptRules;
    },
  },
};
