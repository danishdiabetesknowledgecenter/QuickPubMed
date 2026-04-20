<template>
  <div>
    <ul class="qpm_resetList">
      <li v-for="(item, n) in limitDropdowns" :key="`limit-${n}`" class="qpm_topics">
        <div class="qpm_flex">
          <dropdown-wrapper
            ref="limitDropdown"
            :is-multiple="true"
            :data="groupedLimitOptionsFor(n)"
            :hide-topics="hideTopics"
            :is-group="true"
            :placeholder="filterPlaceholderFor(n)"
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
            :no-result-string="getString('noLimitDropdownContent')"
            :is-filter-dropdown="true"
            :index="n"
            @input="(...args) => $emit('update-limit-dropdown', ...args)"
            @update-scope="(...args) => $emit('update-limit-scope', ...args)"
            @translating="(...args) => $emit('update-limit-placeholder', ...args)"
          />

          <button
            v-if="limitDropdowns.length > 1"
            type="button"
            class="qpm_iconButton qpm_removeSubject bx bx-x"
            :aria-label="getRemoveLimitDropdownAriaLabel(item, n)"
            @click="removeLimitDropdown(n)"
          />
        </div>
        <p
          v-if="n >= 0 && hasLimitSelections"
          class="qpm_subjectOperator"
          :class="{ 'qpm_subjectOperator--trailing': n >= limitDropdowns.length - 1 }"
        >
          {{ getString("andOperator") }}
        </p>
      </li>
    </ul>
    <div v-if="hasLimitSelections" class="qpm_filterSelectionActions">
      <button
        type="button"
        v-tooltip="{
          content: getString('hoverAddTopic'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_slim qpm_button"
        @click="addLimitDropdown"
      >
        {{ getString("addtopiclimit") }} {{ getString("addlimit") }}
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
      limitDropdowns: { type: Array, required: true, default: () => [[]] },
      limitOptions: { type: Array, required: true, default: () => [] },
      getLimitOptionsForDropdown: {
        type: Function,
        default: null,
      },
      hideTopics: {
        type: Array,
        default: () => [],
      },
      language: { type: String, default: "dk" },
      getString: {
        type: Function,
        default: () => "",
      },
      advanced: Boolean,
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
    computed: {
      hasLimitSelections() {
        if (!Array.isArray(this.limitDropdowns)) return false;
        return this.limitDropdowns.some(
          (dropdown) => Array.isArray(dropdown) && dropdown.length > 0
        );
      },
    },
    watch: {
      hideTopics: {
        immediate: true,
        handler() {
          this.$nextTick(() => {
            this.refreshLimitDropdownOptions();
          });
        },
      },
    },
    mounted() {
      this.$nextTick(() => {
        this.refreshLimitDropdownOptions();
      });
    },
    methods: {
      groupedLimitOptionsFor(index) {
        const options = this.getLimitOptionsForDropdown
          ? this.getLimitOptionsForDropdown(index)
          : this.limitOptions;
        return Array.isArray(options) ? options : [];
      },
      refreshLimitDropdownOptions() {
        const dropdownRefs = this.$refs?.limitDropdown;
        if (!dropdownRefs) return;
        const dropdowns = Array.isArray(dropdownRefs) ? dropdownRefs : [dropdownRefs];
        dropdowns.forEach((dropdown) => {
          if (dropdown && typeof dropdown.updateSortedSubjectOptions === "function") {
            dropdown.updateSortedSubjectOptions();
          }
        });
      },
      filterPlaceholderFor(index) {
        return this.getLimitPlaceholder
          ? this.getLimitPlaceholder(index)
          : this.getString("choselimits");
      },
      addLimitDropdown() {
        this.$emit("add-limit-dropdown");
      },
      getSelectedItemLabel(item) {
        if (!item) return "";
        return item?.translations?.[this.language] || item?.label || item?.name || item?.id || "";
      },
      getRemoveLimitDropdownAriaLabel(selectedItems, index) {
        const baseLabel = this.getString("removeFilterLabel");
        if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
          return `${baseLabel} ${index + 1}`;
        }

        const firstLabel = this.getSelectedItemLabel(selectedItems[0]);
        return firstLabel ? `${baseLabel}: ${firstLabel}` : `${baseLabel} ${index + 1}`;
      },
      removeLimitDropdown(index) {
        this.$emit("remove-limit-dropdown", index);
      },
    },
  };
</script>
