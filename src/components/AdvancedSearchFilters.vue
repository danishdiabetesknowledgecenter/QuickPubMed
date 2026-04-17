<template>
  <!-- The dropdown(s) for selecting limits to be included in the advanced search -->
  <div class="qpm_advancedFiltersRoot">
    <div class="qpm_limitsHeaderContainer">
      <h4 role="heading" aria-level="3" class="h4">
        {{ getString("AdvancedLimitsHeader") }}
      </h4>
      <button
        v-tooltip="{
          content: getString('hoverFiltersHeader'),
          distance: 5,
          delay: helpTextDelay,
          theme: 'infoTooltip',
        }"
        class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
        aria-label="Info"
      />
    </div>
    <filter-selection
      ref="limitSelection"
      :limit-dropdowns="limitDropdowns"
      :limit-options="limitOptions"
      :get-limit-options-for-dropdown="getLimitOptionsForDropdown"
      :hide-topics="hideTopics"
      :language="language"
      :advanced="advanced"
      :search-with-a-i="searchWithAI"
      :search-with-pub-med-query="searchWithPubMedQuery"
      :search-with-pub-med-best-match="searchWithPubMedBestMatch"
      :search-with-semantic-scholar="searchWithSemanticScholar"
      :search-with-open-alex="searchWithOpenAlex"
      :search-with-elicit="searchWithElicit"
      :semantic-worded-intent-context="semanticWordedIntentContext"
      :get-string="getString"
      :get-limit-placeholder="getLimitPlaceholder"
      @update-limit-dropdown="handleUpdateLimitDropdown"
      @update-limit-scope="handleUpdateLimitScope"
      @update-limit-placeholder="handleUpdateLimitPlaceholder"
      @add-limit-dropdown="handleAddLimitDropdown"
      @remove-limit-dropdown="handleRemoveLimitDropdown"
    />
  </div>
</template>

<script>
  import FilterSelection from "@/components/FilterSelection.vue";

  export default {
    name: "AdvancedSearchFilters",
    components: {
      FilterSelection,
    },
    props: {
      advanced: {
        type: Boolean,
        required: true,
      },
      limitOptions: {
        type: Array,
        required: true,
      },
      getLimitOptionsForDropdown: {
        type: Function,
        default: null,
      },
      limitDropdowns: {
        type: Array,
        required: true,
      },
      hideTopics: {
        type: Array,
        default: () => [],
        required: true,
      },
      language: {
        type: String,
        required: true,
      },
      searchWithAI: {
        type: Boolean,
        required: true,
      },
      searchWithPubMedQuery: {
        type: Boolean,
        required: true,
      },
      searchWithPubMedBestMatch: {
        type: Boolean,
        required: true,
      },
      searchWithSemanticScholar: {
        type: Boolean,
        required: true,
      },
      searchWithOpenAlex: {
        type: Boolean,
        required: true,
      },
      searchWithElicit: {
        type: Boolean,
        required: true,
      },
      semanticWordedIntentContext: {
        type: Object,
        default: null,
      },
      getString: {
        type: Function,
        required: true,
      },
      getLimitPlaceholder: {
        type: Function,
        default: null,
      },
    },
    emits: [
      "update-limit-dropdown",
      "update-limit-scope",
      "update-limit-placeholder",
      "add-limit-dropdown",
      "remove-limit-dropdown",
    ],
    data() {
      return {
        helpTextDelay: 300,
      };
    },
    methods: {
      handleUpdateLimitDropdown(value, index) {
        this.$emit("update-limit-dropdown", value, index);
      },
      handleUpdateLimitScope(item, state, index) {
        this.$emit("update-limit-scope", item, state, index);
      },
      handleAddLimitDropdown() {
        this.$emit("add-limit-dropdown");
      },
      handleRemoveLimitDropdown(index) {
        this.$emit("remove-limit-dropdown", index);
      },
      handleUpdateLimitPlaceholder(isTranslating, index, stepKey) {
        this.$emit("update-limit-placeholder", isTranslating, index, stepKey);
      },
    },
  };
</script>
