<template>
  <div>
    <div v-for="(item, n) in filterDropdowns" :key="`filter-${n}`" class="qpm_subjects">
      <div class="qpm_flex">
          <dropdown-wrapper
          ref="filterDropdown"
          :is-multiple="true"
          :data="groupedFilterOptions"
          :hide-topics="hideTopics"
          :is-group="true"
          :placeholder="filterPlaceholderFor(n)"
          :operator="getString('orOperator')"
          :taggable="true"
          :selected="item"
          :close-on-input="false"
          :language="language"
          :search-with-a-i="searchWithAI"
          :show-scope-label="advanced"
          :no-result-string="getString('noLimitDropdownContent')"
          :is-filter-dropdown="true"
          :index="n"
          @input="handleUpdateFilters"
          @updateScope="handleUpdateScope"
          @translating="handleTranslating"
        />

        <i
          v-if="filterDropdowns.length > 1"
          class="qpm_removeSubject bx bx-x"
          role="button"
          tabindex="0"
          aria-label="Remove filter"
          @click="removeFilterDropdown(n)"
          @keydown.enter.prevent="removeFilterDropdown(n)"
        />
      </div>
      <p
        v-if="n >= 0 && hasFilterSelections"
        class="qpm_subjectOperator"
        :style="{ color: n < filterDropdowns.length - 1 ? '#000000' : 'darkgrey' }"
      >
        {{ getString("andOperator") }}
      </p>
    </div>
    <div
      v-if="hasFilterSelections"
      style="margin: 5px 0 20px 0"
    >
      <button
        v-tooltip="{
          content: getString('hoverAddSubject'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_slim qpm_button"
        @click="addFilterDropdown"
      >
        {{ getString("addsubjectlimit") }} {{ getString("addlimit") }}
      </button>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";

  export default {
    name: "FilterSelection",
    components: {
      DropdownWrapper,
    },
    props: {
      filterDropdowns: { type: Array, required: true, default: () => [[]] },
      filterOptions: { type: Array, required: true, default: () => [] },
      hideTopics: {
        type: Array,
        default: () => [],
      },
      language: { type: String, default: "dk" },
      getString: {
        type: Function,
        required: true,
        default: () => "",
      },
      advanced: Boolean,
      searchWithAI: Boolean,
      getFilterPlaceholder: {
        type: Function,
        default: null,
      },
    },
    computed: {
      groupedFilterOptions() {
        return this.filterOptions.map((f) => ({
          ...f,
          groups: f.choices || f.groups || [],
        }));
      },
      hasFilterSelections() {
        return this.filterDropdowns.some((dropdown) => dropdown.length > 0);
      },
    },
    watch: {
      hideTopics: {
        immediate: true,
        handler() {
          this.$nextTick(() => {
            if (this.$refs.filterDropdown) {
              const dropdowns = Array.isArray(this.$refs.filterDropdown)
                ? this.$refs.filterDropdown
                : [this.$refs.filterDropdown];
              dropdowns.forEach((dropdown) => {
                if (dropdown) {
                  dropdown.updateSortedSubjectOptions();
                  dropdown.$forceUpdate();
                }
              });
            }
          });
        },
      },
    },
    mounted() {
      this.$nextTick(() => {
        if (this.$refs.filterDropdown) {
          const dropdowns = Array.isArray(this.$refs.filterDropdown)
            ? this.$refs.filterDropdown
            : [this.$refs.filterDropdown];
          dropdowns.forEach((dropdown) => {
            if (dropdown) {
              dropdown.updateSortedSubjectOptions();
            }
          });
        }
      });
    },
    methods: {
      filterPlaceholderFor(index) {
        return this.getFilterPlaceholder ? this.getFilterPlaceholder(index) : this.getString("choselimits");
      },
      handleTranslating(isTranslating, index, stepKey) {
        this.$emit("update-filter-placeholder", isTranslating, index, stepKey);
      },
      handleUpdateFilters(value, index) {
        this.$emit("update-filter-dropdown", value, index);
      },
      handleUpdateScope(item, state, index) {
        this.$emit("update-filter-scope", item, state, index);
      },
      addFilterDropdown() {
        this.$emit("add-filter-dropdown");
      },
      removeFilterDropdown(index) {
        this.$emit("remove-filter-dropdown", index);
      },
    },
  };
</script>
