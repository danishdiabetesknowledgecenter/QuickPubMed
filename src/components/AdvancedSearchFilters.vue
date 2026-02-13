<template>
  <!-- The dropdown(s) for selecting limits to be included in the advanced search -->
  <div style="margin: 30px 5px 10px">
    <div class="qpm_filtersHeaderContainer">
      <h4 role="heading" aria-level="3" class="h4">
        {{ getString("AdvancedFiltersHeader") }}
      </h4>
      <button
        v-tooltip="{
        content: getString('hoverFiltersHeader'),
        distance: 5,
        delay: helpTextDelay,
        }"
        class="bx bx-info-circle"
        style="cursor: help"
        aria-label="Info"
      />
    </div>
    <filter-selection
      ref="filterSelection"
      :filter-dropdowns="filterDropdowns"
      :filter-options="filterOptions"
      :hide-topics="hideTopics"
      :language="language"
      :advanced="advanced"
      :search-with-a-i="searchWithAI"
      :get-string="getString"
      :get-filter-placeholder="getFilterPlaceholder"
      @update-filter-dropdown="handleUpdateFilterDropdown"
      @update-filter-scope="handleUpdateFilterScope"
      @update-filter-placeholder="handleUpdateFilterPlaceholder"
      @add-filter-dropdown="handleAddFilterDropdown"
      @remove-filter-dropdown="handleRemoveFilterDropdown"
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
      filterOptions: {
        type: Array,
        required: true,
      },
      filterDropdowns: {
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
      getString: {
        type: Function,
        required: true,
      },
      getFilterPlaceholder: {
        type: Function,
        default: null,
      },
    },
    data() {
      return {
        helpTextDelay: 300,
      };
    },
    methods: {
      handleUpdateFilterDropdown(value, index) {
        this.$emit("update-filter-dropdown", value, index);
      },
      handleUpdateFilterScope(item, state, index) {
        this.$emit("update-filter-scope", item, state, index);
      },
      handleAddFilterDropdown() {
        this.$emit("add-filter-dropdown");
      },
      handleRemoveFilterDropdown(index) {
        this.$emit("remove-filter-dropdown", index);
      },
      handleUpdateFilterPlaceholder(isTranslating, index, stepKey) {
        this.$emit("update-filter-placeholder", isTranslating, index, stepKey);
      },
    },
  };
</script>
