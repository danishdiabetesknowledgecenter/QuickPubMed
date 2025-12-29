import { loadTopics } from "@/utils/contentLoader";
import { config } from "@/config/config";

export const topicLoaderMixin = {
  // Inject domain from parent Vue instance (supports multiple instances on same page)
  inject: {
    instanceDomain: { default: null },
  },
  data() {
    return {
      topics: [],
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
      handler: "loadTopicsData",
      immediate: true,
    },
  },
  methods: {
    loadTopicsData() {
      const domain = this.currentDomain;
      // Skip loading and error messages if no domain is specified
      if (!domain) {
        this.topics = [];
        return;
      }
      
      const loadedTopics = loadTopics(domain);
      if (loadedTopics.length > 0) {
        // Flatten the array if there are multiple modules
        this.topics = loadedTopics.flatMap((module) => module.topics);
        this.initializeDependencies();
      } else {
        console.error(`No topics found for domain: ${domain}`);
      }
    },
    initializeDependencies() {
      if (this.topics.length > 0) {
        // Initialize any dependencies that rely on 'topics' here
      } else {
        console.error(`No topics loaded for domain: ${this.currentDomain}`);
      }
    },
  },
};
