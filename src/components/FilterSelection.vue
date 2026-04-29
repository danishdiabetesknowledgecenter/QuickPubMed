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
            :taggable="!isDatabaseLimitDropdownItems(item)"
            :searchable="true"
            :selected="item"
            :close-on-input="false"
            :language="language"
            :search-with-a-i="searchWithAI"
            :search-with-pub-med-query="searchWithPubMedQuery"
            :search-with-pub-med-best-match="searchWithPubMedBestMatch"
            :search-with-semantic-scholar="searchWithSemanticScholar"
            :search-with-open-alex="searchWithOpenAlex"
            :search-with-elicit="searchWithElicit"
            :selected-rerank-profile-id="selectedRerankProfileId"
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
            v-if="shouldReserveRemoveLimitButton(item)"
            type="button"
            class="qpm_iconButton qpm_removeSubject bx bx-x"
            :aria-label="
              canRemoveLimitDropdown(item) ? getRemoveLimitDropdownAriaLabel(item, n) : ''
            "
            :aria-hidden="!canRemoveLimitDropdown(item)"
            :tabindex="canRemoveLimitDropdown(item) ? 0 : -1"
            :disabled="!canRemoveLimitDropdown(item)"
            :style="canRemoveLimitDropdown(item) ? null : 'visibility: hidden'"
            @click="removeLimitDropdownIfAllowed(item, n)"
          />
        </div>
        <p
          v-if="n >= 0 && hasLimitSelections"
          class="qpm_subjectOperator"
          :class="{ 'qpm_subjectOperator--trailing': !isOperatorActiveAfterLimitDropdown(item, n) }"
        >
          {{ getString("andOperator") }}
        </p>
      </li>
      <li v-if="hasRerankProfiles" class="qpm_topics">
        <div class="qpm_flex">
          <dropdown-wrapper
            ref="rerankProfileDropdown"
            :is-multiple="true"
            :data="rerankProfileDropdownGroups"
            :hide-topics="[]"
            :is-group="true"
            :placeholder="
              selectedRerankProfileOption.length > 0 ? '' : getString('rerankProfileHeader')
            "
            :operator="''"
            :taggable="false"
            :searchable="false"
            :selected="selectedRerankProfileOption"
            :close-on-input="true"
            :language="language"
            :search-with-a-i="searchWithAI"
            :search-with-pub-med-query="searchWithPubMedQuery"
            :search-with-pub-med-best-match="searchWithPubMedBestMatch"
            :search-with-semantic-scholar="searchWithSemanticScholar"
            :search-with-open-alex="searchWithOpenAlex"
            :search-with-elicit="searchWithElicit"
            :selected-rerank-profile-id="selectedRerankProfileId"
            :semantic-worded-intent-context="semanticWordedIntentContext"
            :no-result-string="getString('noRerankProfileOptions')"
            :auto-expand-single-group="true"
            :index="'rerankProfile'"
            @input="handleUpdateRerankProfile"
          />
          <button
            v-if="hasRemovableLimitDropdowns"
            type="button"
            class="qpm_iconButton qpm_removeSubject bx bx-x"
            aria-hidden="true"
            tabindex="-1"
            disabled
            style="visibility: hidden"
          />
        </div>
        <p v-if="hasLimitSelections" class="qpm_subjectOperator qpm_subjectOperator--trailing">
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
      selectedRerankProfileId: {
        type: String,
        default: "",
      },
      rerankProfiles: {
        type: Array,
        default: () => [],
      },
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
      "update-rerank-profile",
    ],
    computed: {
      hasLimitSelections() {
        if (!Array.isArray(this.limitDropdowns)) return false;
        return this.limitDropdowns.some(
          (dropdown) => Array.isArray(dropdown) && dropdown.length > 0
        );
      },
      hasRerankProfiles() {
        return Array.isArray(this.rerankProfiles) && this.rerankProfiles.length > 0;
      },
      hasRemovableLimitDropdowns() {
        return (Array.isArray(this.limitDropdowns) ? this.limitDropdowns : []).some((dropdown) =>
          this.canRemoveLimitDropdown(dropdown)
        );
      },
      rerankProfileDropdownOptions() {
        return (Array.isArray(this.rerankProfiles) ? this.rerankProfiles : []).map((profile) => {
          const label = this.getProfileLabel(profile);
          const tooltip = this.getProfileDescription(profile);
          return {
            id: profile.id,
            name: label,
            translations: {
              dk: label,
              en: label,
            },
            tooltip: tooltip ? { [this.language]: tooltip } : {},
          };
        });
      },
      rerankProfileDropdownGroups() {
        return [
          {
            id: "rerank-profile-group",
            translations: {
              dk: this.language === "dk" ? this.getString("rerankProfileHeader") : "Resultatfokus",
              en: this.language === "en" ? this.getString("rerankProfileHeader") : "Result focus",
            },
            tooltip: {
              dk:
                this.language === "dk"
                  ? this.getString("hoverRerankProfileHeader")
                  : "Vælg hvordan QuickPubMed skal prioritere den semantisk/merge-rerankede resultatliste. Filtre, databaser, kvalitetsvalidering og ren PubMed-sortering ændres ikke.",
              en:
                this.language === "en"
                  ? this.getString("hoverRerankProfileHeader")
                  : "Choose how QuickPubMed should prioritize the semantically/merge-reranked result list. Filters, databases, quality validation, and pure PubMed sorting are not changed.",
            },
            groups: this.rerankProfileDropdownOptions,
          },
        ];
      },
      selectedRerankProfileOption() {
        const selected = this.rerankProfileDropdownOptions.find(
          (profile) => profile.id === this.selectedRerankProfileId
        );
        return selected ? [selected] : [];
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
      getProfileLabel(profile) {
        return this.getString(profile?.labelKey) || profile?.id || "";
      },
      getProfileDescription(profile) {
        return this.getString(profile?.descriptionKey) || "";
      },
      isDatabaseLimitDropdownItems(items) {
        return (Array.isArray(items) ? items : []).some(
          (item) => String(item?.translationSourceKey || "").trim() !== ""
        );
      },
      canRemoveLimitDropdown(items) {
        return (
          Array.isArray(this.limitDropdowns) &&
          this.limitDropdowns.length > 1 &&
          !this.isDatabaseLimitDropdownItems(items)
        );
      },
      shouldReserveRemoveLimitButton(items) {
        return this.canRemoveLimitDropdown(items) || this.hasRemovableLimitDropdowns;
      },
      isOperatorActiveAfterLimitDropdown(items, index) {
        if (!Array.isArray(items) || items.length === 0) return false;
        const nextDropdown = Array.isArray(this.limitDropdowns)
          ? this.limitDropdowns[index + 1]
          : null;
        if (Array.isArray(nextDropdown) && nextDropdown.length > 0) return true;
        return (
          index >= this.limitDropdowns.length - 1 && this.selectedRerankProfileOption.length > 0
        );
      },
      removeLimitDropdownIfAllowed(items, index) {
        if (!this.canRemoveLimitDropdown(items)) return;
        this.removeLimitDropdown(index);
      },
      handleUpdateRerankProfile(value) {
        const selected = Array.isArray(value) ? value[value.length - 1] : value;
        if (!selected?.id) return;
        this.$emit("update-rerank-profile", selected.id);
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
