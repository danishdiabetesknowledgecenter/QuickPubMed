import { loadTopicsFromRuntime } from "@/utils/contentLoader";
import { config } from "@/config/config";
import { normalizeTopicsList } from "@/utils/contentCanonicalizer";

/**
 * Flattens nested topic groups into a flat array.
 * Converts a hierarchical structure with `children` arrays into the flat format
 * expected by Vue components, auto-generating hierarchy metadata.
 *
 * Supports unlimited nesting depth. Each flattened item gets:
 * - `maintopic` (true if has children)
 * - `subtopiclevel` (0 = top, 1, 2, ... for any depth)
 * - `maintopicIdLevel1` (direct parent ID)
 * - `maintopicIdLevel2` (grandparent ID, for backward compat)
 * - `parentChain` (array of ALL ancestor IDs, from nearest to farthest)
 *
 * Supports both nested (new) and flat (legacy) formats — if no `children`
 * property is found, the groups array is returned unchanged.
 *
 * @param {Array} groups - The groups array (nested or flat)
 * @returns {Array} - A flat array of groups with hierarchy metadata
 */
export function flattenTopicGroups(groups) {
  // Quick check: if no item has children, return as-is (legacy flat format)
  if (!groups.some((g) => g.children)) return groups;

  const result = [];
  let orderCounter = 0;

  function processLevel(items, level, ancestors, parentPath) {
    let siblingIndex = 0;
    for (const item of items) {
      const { children, ...flatItem } = item;

      // Auto-generate sequential ordering to preserve DFS traversal order
      siblingIndex++;
      orderCounter++;
      const path = parentPath ? `${parentPath}.${siblingIndex}` : `${siblingIndex}`;
      flatItem.ordering = { dk: orderCounter, en: orderCounter, label: path };

      // Auto-generate hierarchy metadata
      if (children && children.length > 0) {
        flatItem.maintopic = true;
      }
      if (level >= 1) {
        flatItem.subtopiclevel = level;
        flatItem.maintopicIdLevel1 = ancestors[0] || null;
        flatItem.maintopicIdLevel2 = ancestors[1] || null;
        flatItem.parentChain = [...ancestors];
      }

      result.push(flatItem);

      // Recurse into children (DFS order)
      if (children && children.length > 0) {
        processLevel(children, level + 1, [flatItem.id, ...ancestors], path);
      }
    }
  }

  processLevel(groups, 0, [], "");
  return result;
}

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
    async loadTopicsData() {
      const domain = this.currentDomain;
      // Skip loading and error messages if no domain is specified
      if (!domain) {
        this.topics = [];
        return;
      }

      let topicsSource = [];
      try {
        topicsSource = await loadTopicsFromRuntime(domain);
      } catch (error) {
        topicsSource = [];
        console.error("Failed to load topics from runtime content API.", error);
      }

      if (topicsSource.length === 0) {
        console.error(`No topics found for domain: ${domain}`);
        this.topics = [];
        return;
      }

      const normalizedTopics = normalizeTopicsList(topicsSource);
      this.topics = normalizedTopics.map((topic) => ({
        ...topic,
        groups: flattenTopicGroups(topic.groups || []),
      }));
    },
  },
};
