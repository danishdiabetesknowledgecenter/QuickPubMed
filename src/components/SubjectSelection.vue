<template>
  <div>
    <div v-for="(item, n) in topics" :key="`item-${item.id}-${n}`" class="qpm_topics">
      <div class="qpm_flex">
        <dropdown-wrapper
          ref="topicDropdown"
          :is-multiple="true"
          :data="topicOptions"
          :hide-topics="hideTopics"
          :is-group="true"
          :placeholder="dropdownPlaceholders[n]"
          :operator="getString('orOperator')"
          :taggable="true"
          :selected="item"
          :close-on-input="false"
          :language="language"
          :search-with-a-i="searchWithAI"
          :search-with-pub-med-query="searchWithPubMedQuery"
          :search-with-pub-med-best-match="searchWithPubMedBestMatch"
          :search-with-semantic-scholar="searchWithSemanticScholar"
          :search-with-open-alex="searchWithOpenAlex"
          :search-with-elicit="searchWithElicit"
          :semantic-worded-intent-context="semanticWordedIntentContext"
          :show-scope-label="advanced"
          :no-result-string="getString('noTopicDropdownContent')"
          :index="n"
          @input="(...args) => $emit('update-topics', ...args)"
          @update-scope="(...args) => $emit('update-scope', ...args)"
          @mounted="(...args) => $emit('should-focus-next-dropdown', ...args)"
          @translating="(...args) => $emit('update-placeholder', ...args)"
        />

        <i
          v-if="topics.length > 1"
          class="qpm_removeSubject bx bx-x"
          role="button"
          tabindex="0"
          aria-label="Remove subject"
          @click="removeSubject(n)"
          @keydown.enter.prevent="removeSubject(n)"
        />
      </div>
      <p
        v-if="n >= 0 && hasTopics"
        class="qpm_subjectOperator"
        :style="{ color: n < topics.length - 1 ? '#000000' : 'darkgrey' }"
      >
        {{ getString("andOperator") }}
      </p>
    </div>
    <div
      v-if="hasTopics"
      class="qpm_subjectSelectionActions"
      @keydown.enter.capture.passive="focusNextDropdownOnMount = true"
    >
      <button
        v-tooltip="{
          content: getString('hoverAddSubject'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_slim qpm_button"
        @click="addSubject"
      >
        {{ getString("addsubjectlimit") }} {{ getString("addsubject") }}
      </button>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";

  export default {
    name: "SubjectSelection",
    components: {
      DropdownWrapper,
    },
    props: {
      topics: { type: Array, required: true, default: () => [] },
      hideTopics: {
        type: Array,
        default: () => [],
        validator: function (value) {
          return Array.isArray(value);
        },
      },
      topicOptions: { type: Array, required: true, default: () => [] },
      dropdownPlaceholders: { type: Array, required: true, default: () => [] },
      language: { type: String, default: "dk" },
      getString: {
        type: Function,
        default: () => "",
      },
      advanced: Boolean,
      showFilter: Boolean,
      hasTopics: Boolean,
      searchWithAI: Boolean,
      searchWithPubMedQuery: Boolean,
      searchWithPubMedBestMatch: Boolean,
      searchWithSemanticScholar: Boolean,
      searchWithOpenAlex: Boolean,
      searchWithElicit: Boolean,
      semanticWordedIntentContext: {
        type: Object,
        default: null,
      },
    },
    emits: [
      "update-topics",
      "update-scope",
      "should-focus-next-dropdown",
      "update-placeholder",
      "add-topic",
      "remove-topic",
      "toggle-filter",
    ],
    watch: {
      hideTopics: {
        immediate: true,
        handler() {
          this.$nextTick(() => {
            this.refreshTopicDropdownOptions();
          });
        },
      },
    },
    mounted() {
      // Ensures initial state
      this.$nextTick(() => {
        this.refreshTopicDropdownOptions();
      });
    },
    methods: {
      refreshTopicDropdownOptions() {
        const dropdownRefs = this.$refs?.topicDropdown;
        if (!dropdownRefs) return;
        const dropdowns = Array.isArray(dropdownRefs) ? dropdownRefs : [dropdownRefs];
        dropdowns.forEach((dropdown) => {
          if (dropdown && typeof dropdown.updateSortedSubjectOptions === "function") {
            dropdown.updateSortedSubjectOptions();
          }
        });
      },
      addSubject() {
        this.$emit("add-topic");
      },
      removeSubject(index) {
        this.$emit("remove-topic", index);
      },
      toggle() {
        this.$emit("toggle-filter");
      },
    },
  };
</script>
