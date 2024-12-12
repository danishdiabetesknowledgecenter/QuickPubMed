import { loadTopics } from "@/utils/contentLoader";
import { config } from "@/config/config";

export const topicLoaderMixin = {
  data() {
    return {
      topics: [],
    };
  },
  created() {
    this.loadTopicsData();
  },
  watch: {
    "config.domain": "loadTopicsData",
  },
  methods: {
    loadTopicsData() {
      const loadedTopics = loadTopics(config.domain);
      if (loadedTopics.length > 0) {
        // Flatten the array if there are multiple modules
        this.topics = loadedTopics.flatMap((module) => module.topics);
        this.initializeDependencies();
      } else {
        console.error(`No topics found for domain: ${config.domain}`);
      }
    },
    initializeDependencies() {
      if (this.topics.length > 0) {
        // Initialize any dependencies that rely on 'topics' here
      } else {
        console.error(`No topics loaded for domain: ${config.domain}`);
      }
    },
  },
};
