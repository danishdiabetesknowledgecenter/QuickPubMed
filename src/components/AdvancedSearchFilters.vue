<template>
  <!-- The dropdown for selecting limits to be included in the advanced search -->
  <div style="margin: 30px 5px 10px">
    <div class="qpm_filtersHeaderContainer">
      <h4 role="heading" aria-level="3" class="h4">
        {{ getString("AdvancedFiltersHeader") }}
      </h4>
      <button
        v-tooltip="{
        content: getString('hoverFiltersHeader'),
        offset: 5,
        delay: helpTextDelay,
        hideOnTargetClick: false,
        }"
        class="bx bx-info-circle"
        style="cursor: help"
        aria-label="Info"
      />
    </div>
    <div id="qpm_topofsearchbar" class="qpm_flex">
      <dropdown-wrapper
        ref="filterDropdown"
        :is-multiple="true"
        :data="filterOptions"
        :hide-topics="hideTopics"
        :is-group="false"
        :placeholder="placeholderWithCount"
        :operator="getString('andOperator')"
        :close-on-input="false"
        :language="language"
        :taggable="false"
        :selected="filters"
        :search-with-a-i="searchWithAI"
        :show-scope-label="advanced"
        :no-result-string="getString('noLimitDropdownContent')"
        :index="0"
        qpm-button-color2="qpm_buttonColor7"
        :hide-tags-wrap="true"
        @input="handleFilterUpdate"
      />
    </div>
    <div class="qpm_flex">
      <div class="qpm_filters" :class="{ qpm_visibilityHidden: Object.keys(filters).length === 0 }">
        <filter-entry
          v-for="(id, index) in filterDataKeysReversed"
          :key="id"
          :language="language"
          :filter-item="getFilters(id)"
          :idx="id"
          :hide-topics="hideTopics"
          :selected="filterData[id]"
          :is-first="index === 0"
          @input="handleAdvancedFilterUpdate"
          @updateScope="handleScopeUpdate"
          @remove-filter-item="handleRemoveFilterItem"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";
  import FilterEntry from "@/components/FilterEntry.vue";

  export default {
    name: "AdvancedSearchFilters",
    components: {
      DropdownWrapper,
      FilterEntry,
    },
    props: {
      advanced: {
        type: Boolean,
        required: true,
      },
      showFilter: {
        type: Boolean,
        required: true,
      },
      filterOptions: {
        type: Array,
        required: true,
      },
      hideTopics: {
        type: Array,
        default: () => [],
        required: true,
      },
      showTitle: {
        type: String,
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
      filterData: {
        type: Object,
        required: true,
      },
      filters: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        showFilterCategory: false,
      };
    },
    computed: {
      filterDataKeysReversed() {
        return Object.keys(this.filterData).reverse();
      },
      selectedCount() {
        return Object.keys(this.filterData).length;
      },
      totalFilters() {
        return this.filterOptions.length;
      },
      placeholderWithCount() {
        // return `${this.showTitle} (${this.selectedCount}/${this.totalFilters})`;
        return `${this.showTitle}`;
      },
    },

    methods: {
      /**
       * Retrieves the filter with the given name.
       *
       * @param {string} name - The name of the filter to retrieve.
       * @returns {Object} The filter object, or an empty object if not found.
       */
      getFilters(name) {
        return this.filters.find((filter) => filter.id === name) || {};
      },

      handleRemoveFilterItem(filterItemId) {
        this.$emit("remove-filter-item", filterItemId);
      },

      /**
       * Handles filter updates from dropdown-wrapper.
       * Emits 'update-advanced-filter' event with updated filters.
       * @param {Array} updatedFilters - The updated filters array.
       */
      handleFilterUpdate(updatedFilters) {
        this.$emit("update-advanced-filter", updatedFilters);
      },

      /**
       * Handles updates from filter-entry components.
       * Emits 'update-advanced-filter-entry' with necessary data.
       * @param {String} filterType - The ID of the filter group being updated.
       * @param {Object} selectedValue - The filter option that was selected or deselected.
       */
      handleAdvancedFilterUpdate(filterType, selectedValue) {
        this.$emit("update-advanced-filter-entry", filterType, selectedValue);
      },

      /**
       * Handles scope updates from filter-entry components.
       * Emits 'update-advanced-filter-scope'.
       * @param {Object} item - The item to update.
       * @param {String} state - The new state to set.
       * @param {String} id - The identifier of the filter.
       */
      handleScopeUpdate(item, state, id) {
        this.$emit("update-advanced-filter-scope", item, state, id);
      },
    },
  };
</script>
