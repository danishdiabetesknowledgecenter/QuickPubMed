<template>
  <div>
    <div :id="getComponentId" :class="{ qpm_formCollapsed: isCollapsed }">
      <div class="qpm_searchform">
        <!-- The tabs for toggling between advanced or simple search -->
        <advanced-search-toggle
          :advanced="advanced"
          :is-collapsed="isCollapsed"
          :get-string="getString"
          @toggle-advanced="advancedClick"
        />

        <div class="qpm_top">
          <!-- Show or hide the search form -->
          <search-form-toggle
            :is-collapsed="isCollapsed"
            :topics="topics"
            :show-toggle-icon="hasVisibleSearchResults"
            :get-string="getString"
            @toggle-collapsed="toggleCollapsedController"
          />

          <!-- The toggle for AI translation -->
          <ai-translation-toggle
            v-model="searchWithAI"
            :is-collapsed="isCollapsed"
            :get-string="getString"
          />

          <div v-show="isCollapsed" class="qpm_collapsedSpacerPadding"></div>

          <div v-show="!isCollapsed" class="qpm_searchformoptions">
          <!-- The dropdown for selecting topics to be included in the search -->
            <subject-selection
              ref="subjectSelection"
              :topics="topics"
              :hide-topics="effectiveHideTopics"
              :topic-options="topicOptions"
              :dropdown-placeholders="dropdownPlaceholders"
              :language="language"
              :advanced="advanced"
              :show-filter="showFilter"
              :has-topics="hasTopics"
              :search-with-a-i="searchWithAI"
              :get-string="getString"
              @update-topics="updateTopics"
              @update-scope="updateTopicScope"
              @should-focus-next-dropdown="shouldFocusNextDropdownOnMount"
              @update-placeholder="updatePlaceholder"
              @add-topic="addTopic"
              @remove-topic="removeTopic"
              @toggle-filter="toggle"
            />

            <!-- The dropdown(s) for selecting limits to be included in the advanced search -->
            <advanced-search-limits
              v-if="advanced && (hasTopics || openLimits || openLimitsFromUrl)"
              ref="advancedSearchLimits"
              :advanced="advanced"
              :limit-options="limitOptions"
              :limit-dropdowns="limitDropdowns"
              :hide-topics="effectiveHideTopics"
              :language="language"
              :search-with-a-i="searchWithAI"
              :get-string="getString"
              :get-limit-placeholder="getLimitPlaceholder"
              @update-limit-dropdown="updateLimitDropdown"
              @update-limit-scope="updateLimitDropdownScope"
              @update-limit-placeholder="updateLimitPlaceholder"
              @add-limit-dropdown="addLimitDropdown"
              @remove-limit-dropdown="removeLimitDropdown"
            />

            <!-- The radio buttons for limits to be included in the simple search -->
            <simple-search-limits
              v-if="!advanced && showSimpleFilters"
              :advanced="advanced"
              :filtered-choices="filteredChoices"
              :limit-data="limitData"
              :help-text-delay="300"
              :get-string="getString"
              :get-custom-name-label="getCustomNameLabel"
              :get-simple-tooltip="getSimpleTooltip"
              @update-limit="updateLimitSimple"
              @update-limit-enter="updateLimitSimpleOnEnter"
            />
          </div>
        </div>

        <div id="qpm_topofsearch" class="qpm_flex">
          <!-- The search query written out as human readable text-->
          <worded-search-string
            :topics="topics"
            :limits="limitData"
            :available-limits="limitsContent"
            :limit-dropdowns="limitDropdowns"
            :searchstring="getSearchString"
            :is-collapsed="isCollapsed"
            :details="details"
            :advanced-string="advancedString"
            :advanced-search="advanced"
            :show-header="!isCollapsed"
            :language="language"
            @toggle-details-box="toggleDetailsBox"
            @toggle-advanced-string="toggleAdvancedString"
          />
        </div>

        <div v-show="hasTopics && !isCollapsed">
          <!-- Buttons for reset, copy url and search -->
          <action-buttons
            :search-loading="isSearchActionDisabled"
            :get-string="getString"
            @clear="clear"
            @copy-url="copyUrl"
            @searchset-low-start="searchsetLowStart"
          />
        </div>
      </div>

      <!-- The list of results from searching -->
      <search-result
        ref="searchResultList"
        :language="language"
        :total="count"
        :sort="sort"
        :results="searchresult"
        :loading="searchLoading"
        :pagesize="getPageSize"
        :low="getLow"
        :high="getHigh"
        :preselected-entries="preselectedEntries"
        :error="searchError"
        :search-intent="searchIntent"
        @new-page-size="setPageSize"
        @new-sort-method="newSortMethod"
        @high="nextPage"
        @low="previousPage"
        @change:selected-entries="updatePreselectedPmidai"
      />
    </div>
  </div>
</template>

<script>
  import SearchResult from "@/components/SearchResult.vue";
  import ActionButtons from "@/components/ActionButtons.vue";
  import SubjectSelection from "@/components/SubjectSelection.vue";
  import SearchFormToggle from "@/components/SearchFormToggle.vue";
  import WordedSearchString from "@/components/WordedSearchString.vue";
  import AiTranslationToggle from "@/components/AiTranslationToggle.vue";
  import SimpleSearchFilters from "@/components/SimpleSearchFilters.vue";
  import AdvancedSearchToggle from "@/components/AdvancedSearchToggle.vue";
  import AdvancedSearchFilters from "@/components/AdvancedSearchFilters.vue";
  import axios from "axios";

  import { order } from "@/assets/content/order.js";
  import { messages } from "@/assets/content/translations.js";
  import { topicLoaderMixin, flattenTopicGroups } from "@/mixins/topicLoaderMixin.js";
  import { normalizeLimitsList } from "@/utils/contentCanonicalizer";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { scopeIds, customInputTagTooltip } from "@/utils/contentHelpers.js";
  import { loadLimitsFromRuntime, loadStandardString } from "@/utils/contentLoader";
  import {
    cloneDeep,
    debounce,
    getLocalizedTranslation,
    isMobileViewport,
  } from "@/utils/componentHelpers";

  export default {
    name: "SearchForm",
    components: {
      ActionButtons,
      AiTranslationToggle,
      SearchFormToggle,
      AdvancedSearchToggle,
      SimpleSearchLimits: SimpleSearchFilters,
      AdvancedSearchLimits: AdvancedSearchFilters,
      SubjectSelection,
      WordedSearchString,
      SearchResult,
    },
    mixins: [appSettingsMixin, topicLoaderMixin],
    props: {
      hideTopics: {
        type: Array,
        default: () => [],
      },
      hideLimits: {
        type: Array,
        default: () => [],
      },
      checkLimits: {
        type: Array,
        default: () => [],
      },
      orderLimits: {
        type: Array,
        default: () => [],
      },
      openLimits: {
        type: Boolean,
        default: false,
      },
      standardStringAdd: {
        type: Boolean,
        default: false,
      },
      standardStringScope: {
        type: String,
        default: "normal",
      },
      standardString: {
        type: String,
        default: "",
      },
      hideFilters: {
        type: Array,
        default() {
          return [];
        },
      },
      language: {
        type: String,
        default: "dk",
      },
      componentNo: {
        type: Number,
        default: 1,
      },
    },
    data() {
      return {
        advanced: false,
        advancedString: false,
        count: 0,
        details: true,
        limitData: {},
        limitDropdowns: [[]],
        limitOptions: [],
        limits: [],
        focusNextDropdownOnMount: false,
        isFirstFill: true,
        isCollapsed: false,
        isUrlParsed: false,
        oldState: "",
        page: 0,
        pageSize: 25,
        preselectedEntries: [],
        preselectedPmidai: [],
        searchError: null,
        searchString: "",
        finalValidatedQuery: "",
        searchLoading: false,
        searchWithAI: true,
        searchresult: undefined,
        showFilter: false,
        sort: order[0],
        stateHistory: [],
        topicDropdownWidth: 0,
        topicOptions: [],
        topics: [[]],
        translating: false,
        dropdownPlaceholders: [],
        placeholderDotIntervalId: null,
        placeholderDotIndex: null,
        placeholderDotBaseText: "",
        limitDropdownPlaceholders: [],
        filterPlaceholderDotIntervalId: null,
        filterPlaceholderDotIndex: null,
        filterPlaceholderDotBaseText: "",
        openLimitsFromUrl: false,
        urlHideLimits: [],
        urlCheckLimits: [],
        urlOrderLimits: [],
        limitsContent: [],
        normalizedHideTopicsFromProp: null,
        hasAvailableTopicsCached: false,
      };
    },
    computed: {
      effectiveHideLimits() {
        return this.urlHideLimits.length > 0 ? this.urlHideLimits : this.hideLimits;
      },
      effectiveCheckLimits() {
        return this.urlCheckLimits.length > 0 ? this.urlCheckLimits : this.checkLimits;
      },
      effectiveOrderLimits() {
        return this.urlOrderLimits.length > 0 ? this.urlOrderLimits : this.orderLimits;
      },
      standardStringForFreetext() {
        const overrideStandardString = String(this.standardString || "").trim();
        if (overrideStandardString) {
          return {
            narrow: overrideStandardString,
            normal: overrideStandardString,
            broad: overrideStandardString,
          };
        }
        const domain = this.currentDomain;
        const hasLoadedTopics = Array.isArray(this.topicCatalog) && this.topicCatalog.length > 0;
        if (!domain || !hasLoadedTopics) return null;
        const std = loadStandardString(domain);
        return std && typeof std === "object" && Object.keys(std).length > 0 ? std : null;
      },
      showSimpleFilters() {
        return this.hasTopics || this.openLimitsFromUrl || this.openLimits;
      },
      filteredChoices() {
        const hiddenGroupIds = new Set(this.effectiveHideLimits);
        const orderMap = new Map((this.effectiveOrderLimits || []).map((id, index) => [id, index]));
        return this.limitOptions.map((option) => {
          if (hiddenGroupIds.has(option.id)) {
            return { ...option, choices: [] };
          }
          const choices = option.choices.filter(
            (choice) => choice.simpleSearch && !this.effectiveHideLimits.includes(choice.id)
          );
          if (orderMap.size === 0) {
            const localizedOrder = (choice) => {
              const pref = this.language === "en" ? "en" : "dk";
              const alt = pref === "en" ? "dk" : "en";
              const prefValue = Number(choice?.simpleOrdering?.[pref]);
              if (Number.isFinite(prefValue) && prefValue > 0) return prefValue;
              const altValue = Number(choice?.simpleOrdering?.[alt]);
              if (Number.isFinite(altValue) && altValue > 0) return altValue;
              const prefDefaultValue = Number(choice?.ordering?.[pref]);
              if (Number.isFinite(prefDefaultValue) && prefDefaultValue > 0) return prefDefaultValue;
              const altDefaultValue = Number(choice?.ordering?.[alt]);
              if (Number.isFinite(altDefaultValue) && altDefaultValue > 0) return altDefaultValue;
              return Number.POSITIVE_INFINITY;
            };
            const orderedByContent = [...choices].sort((a, b) => {
              const aOrder = localizedOrder(a);
              const bOrder = localizedOrder(b);
              if (aOrder === bOrder) return 0;
              return aOrder - bOrder;
            });
            return { ...option, choices: orderedByContent };
          }
          const ordered = [...choices].sort((a, b) => {
            const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Number.POSITIVE_INFINITY;
            const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Number.POSITIVE_INFINITY;
            if (aIndex === bIndex) return 0;
            return aIndex - bIndex;
          });
          return { ...option, choices: ordered };
        });
      },
      hasAvailableTopics() {
        return this.hasAvailableTopicsCached;
      },
      defaultHiddenTopicIds() {
        const out = [];
        const visit = (node) => {
          if (!node || typeof node !== "object") return;
          if (
            node.hiddenByDefault === true &&
            typeof node.id === "string" &&
            node.id.trim() !== ""
          ) {
            out.push(node.id);
          }
          if (Array.isArray(node.groups)) {
            node.groups.forEach(visit);
          }
          if (Array.isArray(node.children)) {
            node.children.forEach(visit);
          }
        };
        this.topicOptions.forEach(visit);
        return out;
      },
      effectiveHideTopics() {
        const configured = Array.isArray(this.normalizedHideTopicsFromProp)
          ? this.normalizedHideTopicsFromProp
          : Array.isArray(this.hideTopics)
          ? this.hideTopics
          : [];
        return Array.from(new Set([...configured, ...this.defaultHiddenTopicIds]));
      },
      hasLimitSelections() {
        return this.limitDropdowns.some((dropdown) => dropdown.length > 0);
      },
      hasTopics() {
        return this.topics.some((subjectArray) => subjectArray.length > 0);
      },
      hasVisibleSearchResults() {
        return Array.isArray(this.searchresult) && this.searchresult.length > 0;
      },
      isSearchActionDisabled() {
        const topicSearchStringGenerating = this.placeholderDotIntervalId !== null;
        const limitSearchStringGenerating = this.filterPlaceholderDotIntervalId !== null;
        return this.searchLoading || topicSearchStringGenerating || limitSearchStringGenerating;
      },
      /**
       * Derives the user's search intention from topics and limits.
       * Uses original user input (preTranslation) for AI-translated terms,
       * or display names (translations) for predefined topics.
       * Preserves logical structure: ELLER within groups, OG between groups.
       */
      searchIntent() {
        const getItemLabel = (item) => {
          if (item.preTranslation) return item.preTranslation;
          const translated = item.translations?.[this.language];
          if (translated) return translated;
          if (item.name) return item.name;
          return "";
        };

        // Build subject intent with logical operators
        const subjectGroups = this.topics
          .filter((group) => group.length > 0)
          .map((group) => {
            const labels = group.map(getItemLabel).filter(Boolean);
            if (labels.length === 0) return "";
            if (labels.length === 1) return labels[0];
            return "(" + labels.join(" ELLER ") + ")";
          })
          .filter(Boolean);

        // Build filter intent with logical operators
        const filterGroups = this.limitDropdowns
          .filter((group) => group.length > 0)
          .map((group) => {
            const labels = group.map(getItemLabel).filter(Boolean);
            if (labels.length === 0) return "";
            if (labels.length === 1) return labels[0];
            return "(" + labels.join(" ELLER ") + ")";
          })
          .filter(Boolean);

        const allGroups = [...subjectGroups, ...filterGroups];
        if (allGroups.length === 0) return "";
        if (allGroups.length === 1) return allGroups[0];
        return allGroups.join(" OG ");
      },
      getSearchString() {
        const hasLogicalOperators = (searchStrings) =>
          ["AND", "OR", "NOT"].some((op) => searchStrings.includes(op));

        const resolveStandardScope = (itemScope) => {
          const standard = this.standardStringForFreetext;
          if (!standard) return null;
          if (["narrow", "normal", "broad"].includes(itemScope) && standard[itemScope]) {
            return itemScope;
          }
          if (standard.normal) return "normal";
          if (standard.narrow) return "narrow";
          if (standard.broad) return "broad";
          return null;
        };
        const normalizeForContainsCheck = (value) =>
          String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

        const buildSubstring = (items, connector = " OR ", allowStandardString = false) => {
          return items
            .filter(
              (item) =>
                item.searchStrings &&
                item.scope &&
                item.searchStrings[item.scope] &&
                item.searchStrings[item.scope].length > 0
            )
            .map((item) => {
              const { scope, searchStrings } = item;
              let combined = searchStrings[scope].join(connector);

              const scopeCombineValue =
                item.combineWithStandardStringScopes &&
                typeof item.combineWithStandardStringScopes === "object"
                  ? item.combineWithStandardStringScopes[scope]
                  : undefined;
              const shouldCombineWithStandard =
                allowStandardString &&
                (item.isCustom
                  ? this.standardStringAdd
                  : typeof scopeCombineValue === "boolean"
                  ? scopeCombineValue
                  : item.combineWithStandardString !== false);
              const scopeToUse = item.isCustom
                ? resolveStandardScope(this.standardStringScope)
                : resolveStandardScope(scope);
              const standardStringValue =
                scopeToUse && this.standardStringForFreetext
                  ? this.standardStringForFreetext[scopeToUse]
                  : "";
              if (shouldCombineWithStandard && standardStringValue) {
                const combinedNorm = normalizeForContainsCheck(combined);
                const standardNorm = normalizeForContainsCheck(standardStringValue);
                if (standardNorm && !combinedNorm.includes(standardNorm)) {
                  combined = `(${combined}) AND (${standardStringValue})`;
                }
              }
              return hasLogicalOperators(searchStrings[scope][0]) && items.length > 1
                ? `(${combined})`
                : combined;
            })
            .join(connector);
        };
        let substrings = [];

        this.topics.forEach((subjectGroup, index) => {
          if (!Array.isArray(subjectGroup)) return;
          const topicsToIterate = subjectGroup.length;
          const hasOperators = subjectGroup.some(
            (item) =>
              item.searchStrings &&
              item.scope &&
              item.searchStrings[item.scope] &&
              item.searchStrings[item.scope][0] &&
              hasLogicalOperators(item.searchStrings[item.scope][0])
          );

          let substring = index > 0 ? " AND " : "";
          if (
            (hasOperators && (this.topics.length > 1 || this.limits.length > 0)) ||
            topicsToIterate > 1
          ) {
            substring += "(";
          }

          substring += buildSubstring(subjectGroup, " OR ", true);

          if (
            (hasOperators && (this.topics.length > 1 || this.limits.length > 0)) ||
            topicsToIterate > 1
          ) {
            substring += ")";
          }

          if (substring !== "()" && substring !== " AND ()" && substring !== " AND ") {
            substrings.push(substring);
          }
        });

        if (this.advanced) {
          // Advanced mode: process limitDropdowns per-dropdown
          // All items in same dropdown = OR, between dropdowns = AND
          this.limitDropdowns.forEach((dropdownItems) => {
            if (dropdownItems.length === 0) return;

            const hasOperators = dropdownItems.some(
              (item) =>
                item.searchStrings &&
                item.scope &&
                item.searchStrings[item.scope] &&
                item.searchStrings[item.scope][0] &&
                hasLogicalOperators(item.searchStrings[item.scope][0])
            );

            let substring = " AND ";
            if (hasOperators || dropdownItems.length > 1) substring += "(";
            substring += buildSubstring(dropdownItems, " OR ", false);
            if (hasOperators || dropdownItems.length > 1) substring += ")";

            if (substring !== " AND ()" && substring !== " AND ") {
              substrings.push(substring);
            }
          });
        } else {
          // Simple mode: use limitData (category-grouped object)
          Object.keys(this.limitData).forEach((key) => {
            const filterGroup = this.limitData[key];
            const hasOperators = filterGroup.some(
              (item) =>
                item.searchStrings &&
                item.scope &&
                item.searchStrings[item.scope] &&
                item.searchStrings[item.scope][0] &&
                hasLogicalOperators(item.searchStrings[item.scope][0])
            );

            let substring = " AND ";
            if (hasOperators || filterGroup.length > 1) substring += "(";
            substring += buildSubstring(filterGroup, " OR ", false);
            if (hasOperators || filterGroup.length > 1) substring += ")";

            if (substring !== " AND ()" && substring !== " AND ") {
              substrings.push(substring);
            }
          });
        }

        return substrings.join("");
      },
      getPageSize() {
        return this.pageSize;
      },
      getLow() {
        return this.pageSize * this.page;
      },
      getHigh() {
        return Math.min(this.pageSize * this.page + this.pageSize, this.count);
      },
      alwaysShowFilter() {
        return this.$alwaysShowFilter;
      },
      getComponentId() {
        return "SearchForm_" + this.componentNo.toString();
      },
    },
    watch: {
      topicCatalog: {
        deep: true,
        handler() {
          this.topicOptions = [];
          this.prepareTopicOptions();
          this.$nextTick(() => {
            this.updateTopicDropdownWidth();
            this.updatePlaceholders();
          });
        },
      },
      topicOptions: {
        deep: true,
        immediate: true,
        handler() {
          this.recomputeHasAvailableTopics();
        },
      },
      effectiveHideTopics() {
        this.recomputeHasAvailableTopics();
      },
    },
    beforeUnmount() {
      this.clearPlaceholderDotInterval();
      this.clearFilterPlaceholderDotInterval();
      // Cleanup focus-visible event listeners
      if (this._focusVisibleCleanup) {
        this._focusVisibleCleanup();
      }
      // Add proper cleanup for resize listener
      if (this._updateTopicDropdownWidthDebounced) {
        window.removeEventListener("resize", this._updateTopicDropdownWidthDebounced);
      }
    },
    async mounted() {
      await this.loadLimitsData();

      this.advanced = !this.advanced;
      this.advancedClick(true);
      this.parseUrl();
      this.isUrlParsed = true;

      this.updatePlaceholders();
      this.updateTopicDropdownWidth();
      this._updateTopicDropdownWidthDebounced = debounce(
        this.updateTopicDropdownWidth.bind(this),
        120
      );
      window.addEventListener("resize", this._updateTopicDropdownWidthDebounced);

      this.prepareLimitOptions();
      this.prepareTopicOptions();

      if (
        !this.advanced &&
        (this.openLimitsFromUrl || this.openLimits || this.urlCheckLimits.length > 0) &&
        Object.keys(this.limitData).length === 0
      ) {
        this.selectStandardSimple();
        this.isFirstFill = false;
      }

      this.advanced = !this.advanced;
      this.advancedClick();
      this.ensureCheckLimitsSelected();
      if (this.hasTopics) {
        await this.search();
        await this.searchPreselectedPmidai();
      }

      // Ensure correct placeholder width after DOM is fully rendered
      this.$nextTick(() => {
        this.updateTopicDropdownWidth();
        this.updatePlaceholders();

        // Silent focus on the first input — only for the first SearchForm instance on the page
        const allWrappers = document.querySelectorAll(".qpm-searchform, .searchform");
        const isFirstInstance =
          allWrappers.length === 0 ||
          allWrappers[0] === this.$el ||
          allWrappers[0] === this.$el?.parentElement;
        if (!isFirstInstance) return;

        const firstSubjectDropdown = this.$refs.subjectSelection?.$refs.topicDropdown?.[0];
        if (firstSubjectDropdown && firstSubjectDropdown.setSilentFocusFromParent) {
          firstSubjectDropdown.setSilentFocusFromParent();
        }
      });

      // Initialize focus-visible behavior
      this.$nextTick(() => {
        this.initializeFocusVisible();
      });
    },
    created() {
      // If hideTopics comes as string, convert it to array
      if (typeof this.hideTopics === "string") {
        try {
          this.normalizedHideTopicsFromProp = JSON.parse(this.hideTopics.replace(/'/g, '"'));
        } catch (e) {
          this.normalizedHideTopicsFromProp = [];
        }
      }
    },
    methods: {
      recomputeHasAvailableTopics() {
        if (!this.topicOptions || this.topicOptions.length === 0) {
          this.hasAvailableTopicsCached = false;
          return;
        }
        const effectiveHideTopics = this.effectiveHideTopics;

        // Simulate the same logic as DropdownWrapper's shownSubjects
        const shouldHideItem = (item) => {
          if (effectiveHideTopics.includes(item.id)) {
            return true;
          }
          if (item.maintopicIdLevel1 && effectiveHideTopics.includes(item.maintopicIdLevel1)) {
            return true;
          }
          if (item.maintopicIdLevel2 && effectiveHideTopics.includes(item.maintopicIdLevel2)) {
            return true;
          }
          return false;
        };

        const availableTopics = this.topicOptions
          .map((section) => {
            if (shouldHideItem(section)) {
              return null;
            }

            const sectionCopy = cloneDeep(section);

            if (sectionCopy.groups) {
              sectionCopy.groups = sectionCopy.groups.filter((group) => {
                return !shouldHideItem(group);
              });
            }

            return sectionCopy;
          })
          .filter((section) => section !== null && section !== undefined)
          .filter((section) => {
            if (section.groups) {
              return section.groups.length > 0;
            }
            return true;
          });

        this.hasAvailableTopicsCached =
          availableTopics.length > 0 &&
          availableTopics.some((section) => {
            return section.groups && section.groups.length > 0;
          });
      },
      async loadLimitsData() {
        try {
          this.limitsContent = await loadLimitsFromRuntime();
        } catch (error) {
          this.limitsContent = [];
          console.error("Failed to load limits from runtime content API.", error);
        }
      },
      optionIdentity(option) {
        if (!option || typeof option !== "object") return "";
        if (option.id) return `id:${option.id}`;
        if (option.isCustom && option.name) return `custom:${option.name}`;
        if (option.name) return `name:${option.name}`;
        return "";
      },
      dedupeLimitDropdownItems(items) {
        if (!Array.isArray(items) || items.length === 0) return [];
        const seen = new Set();
        const unique = [];
        items.forEach((item) => {
          const key = this.optionIdentity(item);
          if (!key || seen.has(key)) return;
          seen.add(key);
          unique.push(item);
        });
        return unique;
      },
      normalizeLimitDropdowns(dropdowns) {
        if (!Array.isArray(dropdowns) || dropdowns.length === 0) return [[]];
        const normalized = dropdowns
          .map((items) => this.dedupeLimitDropdownItems(items))
          .filter((items) => items.length > 0);
        return normalized.length > 0 ? normalized : [[]];
      },
      /**
       * Initialize focus-visible behavior to only show focus outline for keyboard navigation
       */
      initializeFocusVisible() {
        // Find the mounted search form element (prefer current instance root)
        let appElement =
          this.$el?.parentElement ||
          document.getElementById("qpm-searchform") ||
          document.querySelector('[id^="qpm-searchform-"]') ||
          document.getElementById("searchform");

        if (!appElement) {
          appElement = document.body;
        }

        if (!appElement) {
          console.error("initializeFocusVisible: Could not find any suitable element!");
          return;
        }

        // Add qpm_vapp class to match CSS selectors
        appElement.classList.add("qpm_vapp");

        // Start in mouse mode - only show focus outlines when user uses keyboard
        appElement.classList.add("qpm_mouse-mode");
        appElement.classList.remove("qpm_keyboard-mode");

        // Switch only on keyboard navigation keys
        const handleKeyDown = (event) => {
          if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            appElement.classList.add("qpm_keyboard-mode");
            appElement.classList.remove("qpm_mouse-mode");
          }
        };

        // Switch to mouse mode on click interactions
        const handleMouseDown = () => {
          appElement.classList.add("qpm_mouse-mode");
          appElement.classList.remove("qpm_keyboard-mode");
        };

        // Add event listeners
        document.addEventListener("keydown", handleKeyDown, true);
        document.addEventListener("mousedown", handleMouseDown, true);

        // Store cleanup function for potential future use
        this._focusVisibleCleanup = () => {
          document.removeEventListener("keydown", handleKeyDown, true);
          document.removeEventListener("mousedown", handleMouseDown, true);
        };
      },
      advancedClick(skip = false) {
        // Toggle the 'advanced' mode
        this.advanced = !this.advanced;

        // Reset options with proper cleanup
        this.topicOptions.splice(0);
        this.limitOptions.splice(0);

        // Save pre-reset limitData for migration (before it gets cleared)
        const preResetFilterData =
          !this.alwaysShowFilter && Object.keys(this.limitData).length > 0
            ? cloneDeep(this.limitData)
            : null;

        // Reset limits if necessary
        if (!this.alwaysShowFilter) {
          this.limitData = {};
          this.limits.splice(0);
          // Don't reset limitDropdowns here - like topics, they may contain URL data
        }

        // Prepare options FIRST (needed for getLimitCategoryId in sync)
        this.prepareLimitOptions();
        this.prepareTopicOptions();

        // Sync between limitData and limitDropdowns on mode switch
        // (must happen AFTER prepareLimitOptions so getLimitCategoryId works)
        if (this.advanced && this.limitDropdowns.some((d) => d.length > 0)) {
          // Entering advanced: limitDropdowns has data → sync to limitData
          this.limitDropdowns = this.normalizeLimitDropdowns(this.limitDropdowns);
          this.syncLimitDataFromDropdowns();
        } else if (this.advanced && preResetFilterData) {
          // Entering advanced: limitData had data from simple mode → migrate to limitDropdowns
          // Each category becomes its own dropdown (AND between categories, OR within)
          const dropdowns = Object.values(preResetFilterData).filter((arr) => arr.length > 0);
          this.limitDropdowns = this.normalizeLimitDropdowns(dropdowns);
          this.syncLimitDataFromDropdowns();
        } else if (this.advanced && Object.keys(this.limitData).length > 0) {
          // Entering advanced: limitData has data (alwaysShowFilter) → migrate to limitDropdowns
          const dropdowns = Object.values(this.limitData).filter((arr) => arr.length > 0);
          this.limitDropdowns = this.normalizeLimitDropdowns(dropdowns);
          this.syncLimitDataFromDropdowns();
        } else if (!this.advanced && this.limitDropdowns.some((d) => d.length > 0)) {
          // Entering simple: sync limitData from limitDropdowns, then reset dropdowns
          this.limitDropdowns = this.normalizeLimitDropdowns(this.limitDropdowns);
          this.syncLimitDataFromDropdowns();
          this.limitDropdowns = [[]];
        }

        // Reset subject scopes in non-advanced mode
        if (!this.advanced) {
          this.resetTopicScopes();
        }

        // Update limits
        this.updateLimitsBasedOnSelection();

        // Clean filter data
        this.cleanLimitData();

        // Reset limits if empty in advanced mode
        if (this.advanced && Object.keys(this.limitData).length === 0 && !this.hasLimitSelections) {
          this.limits = [];
        }

        // Update URL
        if (!skip) this.setUrl();

        // Set 'showFilter' flag (vises som default i avanceret mode når data-open-limits="true")
        this.showFilter =
          this.advanced &&
          (this.limits.length > 0 ||
            this.hasLimitSelections ||
            this.openLimits ||
            this.openLimitsFromUrl);

        this.$nextTick(() => {
          this.updateTopicDropdownWidth();
          this.updatePlaceholders();
        });
      },
      prepareLimitOptions() {
        const filterCopy = normalizeLimitsList(cloneDeep(this.limitsContent));
        filterCopy.forEach((filterItem) => {
          // Skip if filterItem is null or undefined
          if (!filterItem) return;

          // Flatten nested children structure (same as for topics)
          if (filterItem.choices && Array.isArray(filterItem.choices)) {
            filterItem.choices = flattenTopicGroups(filterItem.choices);
          }

          if (!this.advanced) {
            if (filterItem.choices && Array.isArray(filterItem.choices)) {
              filterItem.choices.forEach((choice) => {
                if (choice) {
                  choice.buttons = false;
                  if (
                    (!this.isUrlParsed || choice.simpleSearch || choice.standardSimple) &&
                    !this.limitOptions.includes(filterItem)
                  ) {
                    this.limitOptions.push(filterItem);
                  }
                }
              });
            }
          } else {
            // Add groups property for grouped DropdownWrapper (isGroup=true)
            filterItem.groups = filterItem.choices;
            this.limitOptions.push(filterItem);
          }
        });
      },
      prepareTopicOptions() {
        const subjectCopy = cloneDeep(this.topicCatalog);
        subjectCopy.forEach((subjectItem) => {
          // Skip if subjectItem is null or undefined
          if (!subjectItem) return;

          if (!this.advanced) {
            if (subjectItem.groups && Array.isArray(subjectItem.groups)) {
              subjectItem.groups.forEach((group) => {
                if (group) {
                  group.buttons = false;
                }
              });
            }
          }
          this.topicOptions.push(subjectItem);
        });
      },
      resetTopicScopes() {
        this.topics.forEach((subjectGroup) => {
          subjectGroup.forEach((subject) => {
            subject.scope = "normal";
          });
        });
      },
      updateLimitsBasedOnSelection() {
        const updatedFilters = [];
        this.limits.forEach((filter) => {
          const matchingFilter = this.limitOptions.find(
            (option) => this.optionIdentity(option) === this.optionIdentity(filter)
          );
          if (matchingFilter) {
            const shouldIncludeFilter =
              this.isUrlParsed && !this.advanced
                ? filter.choices.some(
                    (choice) =>
                      (choice.simpleSearch || choice.standardSimple) && this.limitData[filter.id]
                  )
                : this.limitData[filter.id];
            if (shouldIncludeFilter && !updatedFilters.includes(matchingFilter)) {
              updatedFilters.push(matchingFilter);
            }
          }
        });
        this.limits = updatedFilters;
      },
      cleanLimitData() {
        const limitDataCopy = { ...this.limitData };
        Object.keys(limitDataCopy).forEach((key) => {
          let values = limitDataCopy[key];
          values = values.filter((value) => {
            if (!this.advanced) value.scope = "normal";
            return !(
              this.isUrlParsed &&
              !this.advanced &&
              !value.simpleSearch &&
              !value.standardSimple
            );
          });
          if (values.length > 0) {
            limitDataCopy[key] = values;
          } else {
            delete limitDataCopy[key];
          }
        });
        this.limitData = limitDataCopy;
      },
      /**
       * Parses the current URL's query parameters and updates the component's state accordingly.
       * Handles topics, limits, advanced mode, sorting, collapsed state, page size,
       * preselected PMIDs, and scroll position.
       */
      parseUrl() {
        // Initialize topics
        this.topics = [];

        // Parse the current URL (search + hash query fallback for CMS embeds)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = this.getHashUrlParams();
        hashParams.forEach((value, key) => {
          urlParams.append(key, value);
        });

        // Check if there are query parameters
        if (![...urlParams.keys()].length) {
          this.topics = [[]];
          return;
        }

        // Process each parameter
        urlParams.forEach((value, key) => {
          // Split multiple values separated by ';;'
          const values = value.split(";;");
          const normalizedKey = key.replace(/^amp;/i, "");
          const keyLower = normalizedKey.toLowerCase();

          switch (keyLower) {
            case "topic":
              this.processTopics(values);
              break;

            case "advanced":
              this.advanced = value === "true";
              break;

            case "sort":
              this.sort = order.find((o) => o.method === value) || this.sort;
              break;

            case "collapsed":
              this.isCollapsed = value === "true";
              break;

            case "scrollto":
              this.scrollToID = `#${value}`;
              break;

            case "pagesize":
              this.pageSize = parseInt(value, 10);
              break;

            case "pmid":
              this.preselectedPmidai = values;
              break;

            case "openlimits": {
              const normalized = value.trim().toLowerCase();
              this.openLimitsFromUrl = normalized === "true" || normalized === "1";
              break;
            }

            case "hidelimits":
              this.urlHideLimits = this.parseIdList(values);
              break;

            case "checklimits":
              this.urlCheckLimits = this.parseIdList(values);
              break;

            case "orderlimits":
              this.urlOrderLimits = this.parseIdList(values);
              break;

            case "limit":
              this.processFilterDropdownUrl(values);
              break;

            default:
              this.processFilter(normalizedKey, values);
              break;
          }
        });

        // Ensure topics is not empty
        if (this.topics.length === 0) {
          this.topics = [[]];
        }
      },
      getHashUrlParams() {
        const hash = window.location.hash || "";
        if (!hash) return new URLSearchParams();

        const hashContent = hash.startsWith("#") ? hash.slice(1) : hash;
        const queryStart = hashContent.indexOf("?");
        const hashQuery = queryStart >= 0 ? hashContent.slice(queryStart + 1) : hashContent;
        if (!hashQuery || !hashQuery.includes("=")) {
          return new URLSearchParams();
        }
        return new URLSearchParams(hashQuery);
      },
      parseIdList(values) {
        if (!Array.isArray(values)) return [];
        return values
          .map((value) => value.trim())
          .filter((value) => value !== "")
          .map((value) => value.toUpperCase());
      },
      /**
       * Processes the 'topic' parameters from the URL and populates the topics array.
       *
       * @param {string[]} values - An array of topic values extracted from the URL.
       */
      processTopics(values) {
        const selected = [];

        values.forEach((val) => {
          const [id, scope] = val.split("#");
          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");

          if (isCustomInput) {
            const rawName = id.slice(2, -2);
            const translationFlag = rawName.slice(-1);
            const isTranslated = translationFlag === "1";
            const name = isTranslated || translationFlag === "0" ? rawName.slice(0, -1) : rawName;

            const tag = {
              name: name,
              searchStrings: { normal: [name] },
              preString: `${this.getString("manualInputTerm")}:\u00A0 `,
              scope: "normal",
              isCustom: true,
              tooltip: customInputTagTooltip,
            };
            selected.push(tag);
            return;
          }

          const normalizedId = id.toUpperCase();

          // Find the topic in topicOptions
          this.topicOptions.forEach((topicOption) => {
            topicOption.groups.forEach((group) => {
              if (group.id === normalizedId) {
                const tmp = { ...group, scope: scopeIds[scope] };
                const lg = this.language;
                if (tmp.translations[lg]?.startsWith("-")) {
                  tmp.translations[lg] = tmp.translations[lg].slice(1);
                }
                selected.push(tmp);
              }
            });
          });
        });

        if (selected.length > 0) {
          this.topics.push(selected);
        }
      },
      /**
       * Processes filter parameters from the URL and updates the limitData object.
       *
       * @param {string} key - The filter group ID extracted from the URL parameter key.
       * @param {string[]} values - An array of filter values extracted from the URL.
       */
      processFilter(key, values) {
        const normalizedKey = key.toUpperCase();
        // Find the filter group
        const filterGroup = this.limitOptions.find((filter) => filter.id === normalizedKey);
        if (!filterGroup) return;

        if (!this.limits.includes(filterGroup)) {
          this.limits.push({ ...filterGroup });
          this.showFilter = true;
        }

        values.forEach((val) => {
          const [id, scope] = val.split("#");
          if (!scope) {
            console.warn(`parseUrl: Missing scope in value "${val}"`);
            return;
          }

          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");
          const groupId = filterGroup.id;

          if (isCustomInput) {
            const rawName = id.slice(2, -2);
            const translationFlag = rawName.slice(-1);
            const isTranslated = translationFlag === "1";
            const name = isTranslated || translationFlag === "0" ? rawName.slice(0, -1) : rawName;

            const tag = {
              name: name,
              searchStrings: { normal: [name] },
              preString: `${this.getString("manualInputTerm")}:\u00A0 `,
              scope: "normal",
              isCustom: true,
              tooltip: customInputTagTooltip,
            };
            if (!this.limitData[groupId]) this.limitData[groupId] = [];
            this.limitData[groupId].push(tag);
            return;
          }

          // Find the filter choice
          const normalizedId = id.toUpperCase();
          const choice = filterGroup.choices.find((item) => item.id === normalizedId);
          if (!choice) {
            console.warn(`parseUrl: Choice with id "${id}" not found.`);
            return;
          }

          if (
            !this.advanced &&
            (this.effectiveHideLimits.includes(filterGroup.id) ||
              this.effectiveHideLimits.includes(choice.id))
          ) {
            return;
          }
          if (this.isUrlParsed && !this.advanced && !choice.simpleSearch) return;

          const tmp = { ...choice, scope: scopeIds[scope] };

          if (!this.limitData[groupId]) this.limitData[groupId] = [];
          this.limitData[groupId].push(tmp);
        });
      },
      /**
       * Processes 'limit' URL parameters (new format) and populates limitDropdowns.
       * Each 'limit' parameter represents one filter dropdown's selections.
       *
       * @param {string[]} values - An array of filter values (itemId#scope) from one 'limit' parameter.
       */
      processFilterDropdownUrl(values) {
        const selected = [];

        values.forEach((val) => {
          const [id, scope] = val.split("#");
          if (!scope) return;

          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");

          if (isCustomInput) {
            const rawName = id.slice(2, -2);
            const tag = {
              name: rawName,
              searchStrings: { normal: [rawName] },
              preString: `${this.getString("manualInputTerm")}:\u00A0 `,
              scope: "normal",
              isCustom: true,
            };
            selected.push(tag);
            return;
          }

          const normalizedId = id.toUpperCase();

          // Find the filter choice across all filter options
          for (const filterGroup of this.limitOptions) {
            const choice = filterGroup.choices
              ? filterGroup.choices.find((c) => c.id === normalizedId)
              : null;
            if (choice) {
              selected.push({ ...choice, scope: scopeIds[scope] || "normal" });
              break;
            }
          }
        });

        const uniqueSelected = this.dedupeLimitDropdownItems(selected);
        if (uniqueSelected.length > 0) {
          // Ensure limitDropdowns has at least one empty array
          if (this.limitDropdowns.length === 1 && this.limitDropdowns[0].length === 0) {
            this.limitDropdowns[0] = uniqueSelected;
          } else {
            this.limitDropdowns.push(uniqueSelected);
          }
        }
      },
      /**
       * Returns the filter category ID for a given filter item.
       *
       * @param {Object} item - The filter item.
       * @returns {string} The category ID (e.g., "L010").
       */
      getLimitCategoryId(item) {
        if (!item.id) return "__custom__";
        for (const option of this.limitOptions) {
          if (option.choices && option.choices.some((c) => c.id === item.id)) {
            return option.id;
          }
        }
        // Fallback: first 4 characters of the ID
        return item.id.substring(0, 4);
      },
      hasMixedLimitCategories(items) {
        if (!Array.isArray(items) || items.length < 2) return false;
        const categoryIds = new Set();
        items.forEach((item) => {
          const categoryId = this.getLimitCategoryId(item);
          if (!categoryId || categoryId === "__custom__") return;
          categoryIds.add(categoryId);
        });
        return categoryIds.size > 1;
      },
      limitSelectionIdentity(item) {
        const baseKey = this.optionIdentity(item);
        if (!baseKey) return "";
        const scopeKey = item?.scope || "normal";
        return `${baseKey}::scope:${scopeKey}`;
      },
      hasDuplicateLimitAcrossDropdowns(items, currentDropdownIndex) {
        if (!Array.isArray(items) || items.length === 0) return false;
        const currentBeforeChange = new Set(
          (this.limitDropdowns[currentDropdownIndex] || [])
            .map((item) => this.limitSelectionIdentity(item))
            .filter(Boolean)
        );
        const selectedInOtherDropdowns = new Set();
        this.limitDropdowns.forEach((dropdownItems, index) => {
          if (index === currentDropdownIndex || !Array.isArray(dropdownItems)) return;
          dropdownItems.forEach((item) => {
            const key = this.limitSelectionIdentity(item);
            if (key) selectedInOtherDropdowns.add(key);
          });
        });
        return items.some((item) => {
          const key = this.limitSelectionIdentity(item);
          if (!key) return false;
          if (currentBeforeChange.has(key)) return false;
          return selectedInOtherDropdowns.has(key);
        });
      },
      /**
       * Syncs limitData (category-grouped object) from limitDropdowns (array of arrays).
       * Merges all items from all dropdowns by their filter category.
       * Also updates the 'limits' array to match.
       */
      syncLimitDataFromDropdowns() {
        const newFilterData = {};
        const filterSet = new Set();

        this.limitDropdowns.forEach((dropdownItems) => {
          dropdownItems.forEach((item) => {
            const categoryId = this.getLimitCategoryId(item);
            if (!newFilterData[categoryId]) newFilterData[categoryId] = [];
            newFilterData[categoryId].push(item);
            filterSet.add(categoryId);
          });
        });

        this.limitData = newFilterData;

        // Update limits array to match active categories
        this.limits = [...filterSet]
          .map((id) => this.limitOptions.find((f) => f.id === id))
          .filter(Boolean);
      },
      /**
       * Handles selection changes in a filter dropdown.
       *
       * @param {Array} value - The updated selections array.
       * @param {number} index - The index of the filter dropdown.
       */
      updateLimitDropdown(value, index) {
        const uniqueValue = this.dedupeLimitDropdownItems(value);
        uniqueValue.forEach((item) => {
          if (!item.scope) item.scope = "normal";
        });

        const previousValue = Array.isArray(this.limitDropdowns[index]) ? this.limitDropdowns[index] : [];
        const previousKeys = new Set(
          previousValue.map((item) => this.limitSelectionIdentity(item)).filter(Boolean)
        );
        const hasNewSelection = uniqueValue.some((item) => {
          const key = this.limitSelectionIdentity(item);
          return key && !previousKeys.has(key);
        });

        if (hasNewSelection && this.hasMixedLimitCategories(uniqueValue)) {
          const shouldContinue = confirm(this.getString("mixedLimitCategoriesWarning"));
          if (!shouldContinue) return;
        }
        if (hasNewSelection && this.hasDuplicateLimitAcrossDropdowns(uniqueValue, index)) {
          const shouldContinue = confirm(this.getString("duplicateLimitAcrossDropdownsWarning"));
          if (!shouldContinue) return;
        }

        const updated = cloneDeep(this.limitDropdowns);
        updated[index] = uniqueValue;
        this.limitDropdowns = updated;

        // Remove extra empty dropdowns — keep at most one empty
        this.removeExtraEmptyDropdowns("limitDropdowns");

        this.syncLimitDataFromDropdowns();
        this.setUrl();
        this.editForm();
      },
      /**
       * Removes extra empty dropdowns, keeping at most one empty.
       * Works for both topics and limitDropdowns.
       *
       * @param {string} prop - "topics" or "limitDropdowns"
       */
      removeExtraEmptyDropdowns(prop) {
        const arr = this[prop];
        const emptyIndices = [];
        arr.forEach((d, i) => {
          if (d.length === 0) emptyIndices.push(i);
        });
        // Keep one empty, remove the rest (from end to preserve indices)
        if (emptyIndices.length > 1) {
          const toRemove = emptyIndices.slice(1);
          for (let i = toRemove.length - 1; i >= 0; i--) {
            arr.splice(toRemove[i], 1);
          }
          this[prop] = [...arr];
        }
      },
      /**
       * Adds a new empty filter dropdown.
       */
      addLimitDropdown() {
        const isMobile = isMobileViewport();
        const hasEmpty = this.limitDropdowns.some((d) => d.length === 0);
        if (hasEmpty) {
          alert(this.getString("fillEmptyDropdownFirstAlert"));
          return;
        }
        this.limitDropdowns = [...this.limitDropdowns, []];

        this.$nextTick(() => {
          const limitSelection = this.$refs.advancedSearchLimits?.$refs.limitSelection;
          if (!limitSelection) return;
          const lastDropdown = this.getLastDropdownRef(limitSelection.$refs.limitDropdown);
          this.tryActivateDropdown(lastDropdown, {
            focusInput: !isMobile,
            shouldActivate: !isMobile,
          });

          // Retry with small delay if first attempt failed
          setTimeout(() => {
            const lastDropdown = this.getLastDropdownRef(limitSelection.$refs.limitDropdown);
            this.tryActivateDropdown(lastDropdown, {
              onlyWhenClosed: true,
              shouldActivate: !isMobile,
            });
          }, 100);
        });
      },
      /**
       * Removes a filter dropdown at the given index.
       *
       * @param {number} index - The index of the dropdown to remove.
       */
      removeLimitDropdown(index) {
        const wasEmpty = this.limitDropdowns[index] && this.limitDropdowns[index].length === 0;
        const updated = [...this.limitDropdowns];
        updated.splice(index, 1);
        if (updated.length === 0) updated.push([]);
        this.limitDropdowns = updated;

        this.syncLimitDataFromDropdowns();
        this.setUrl();
        if (!wasEmpty) this.editForm();
      },
      /**
       * Updates the scope of a filter item within a filter dropdown.
       *
       * @param {Object} item - The filter item to update.
       * @param {string} state - The new scope state.
       * @param {number} index - The index of the filter dropdown.
       */
      updateLimitDropdownScope(item, state, index) {
        const updated = cloneDeep(this.limitDropdowns);

        if (updated[index] && Array.isArray(updated[index])) {
          const targetItem = updated[index].find((i) => i.id === item.id);
          if (targetItem) {
            if (targetItem.scope === state) {
              // Remove the item if clicking the same scope (toggle off)
              const idx = updated[index].findIndex(
                (i) => this.optionIdentity(i) === this.optionIdentity(item)
              );
              updated[index].splice(idx, 1);
            }
            targetItem.scope = state;
          }
        }

        this.limitDropdowns = updated;
        this.syncLimitDataFromDropdowns();
        this.setUrl();
        this.editForm();
      },
      setUrl() {
        if (history.replaceState) {
          let urlLink = this.getUrl();
          this.stateHistory.push(this.oldState);
          window.history.replaceState([...this.stateHistory], urlLink, urlLink);
          this.oldState = urlLink;
        }
      },
      /**
       * Constructs the full URL based on the current application state.
       * Includes parameters for topics, limits, advanced mode, sorting,
       * collapsed state, page size, preselected PMIDs, and scroll position.
       *
       * @returns {string} The constructed URL reflecting the current state.
       */
      getUrl() {
        const origin =
          window.location.origin && window.location.origin !== "null" ? window.location.origin : "";

        const baseUrl = `${origin}${window.location.pathname}`;
        const currentParams = new URLSearchParams(window.location.search);
        const apiBaseParam = (currentParams.get("apiBase") || "").trim();
        const apiBaseStr = apiBaseParam ? `apiBase=${encodeURIComponent(apiBaseParam)}` : "";

        // If there are no topics selected, return the base URL without parameters

        if (!this.hasTopics && !this.openLimitsFromUrl && !this.openLimits) {
          return apiBaseStr ? `${baseUrl}?${apiBaseStr}` : baseUrl;
        }

        // Build query parameters
        const topicsStr = this.constructTopicsQuery();
        const limitsStr = this.constructLimitsQuery();
        const advancedStr = `&advanced=${this.advanced}`;
        const sorter = `&sort=${encodeURIComponent(this.sort.method)}`;
        const collapsedStr = `&collapsed=${this.isCollapsed}`;
        const pageSizeStr = `&pagesize=${this.pageSize}`;
        const pmidStr = `&pmid=${(this.preselectedPmidai ?? []).join(";;")}`;
        const scrolltoStr = this.scrollToID
          ? `&scrollto=${encodeURIComponent(this.scrollToID)}`
          : "";
        const openLimitsStr = this.openLimitsFromUrl ? `&openlimits=true` : "";
        const hideLimitsStr =
          this.urlHideLimits.length > 0 ? `&hidelimits=${this.urlHideLimits.join(";;")}` : "";
        const checkLimitsStr =
          this.urlCheckLimits.length > 0 ? `&checklimits=${this.urlCheckLimits.join(";;")}` : "";
        const orderLimitsStr =
          this.urlOrderLimits.length > 0 ? `&orderlimits=${this.urlOrderLimits.join(";;")}` : "";

        // Assemble the full URL with all query parameters
        const urlLink = `${baseUrl}?${apiBaseStr}${
          apiBaseStr ? "&" : ""
        }${topicsStr}${limitsStr}${advancedStr}${pmidStr}${sorter}${collapsedStr}${pageSizeStr}${scrolltoStr}${openLimitsStr}${hideLimitsStr}${checkLimitsStr}${orderLimitsStr}`;

        return urlLink.replace("?&", "?").replace(/&&+/g, "&");
      },
      /**
       * Constructs the query string for topics based on selected topics.
       *
       * @returns {string} The encoded topics query string.
       */
      constructTopicsQuery() {
        if (!this.topics || this.topics.length === 0) {
          return "";
        }

        const subjectQueries = this.topics
          .filter((group) => group.length > 0)
          .map((group) => {
            const subjectValues = group.map((subject) => {
              const scope = this.getScopeKey(this.advanced ? subject.scope : "normal");
              let subjectId = "";

              if (
                subject.isCustom ||
                (typeof subject.id === "string" && subject.id.startsWith("__custom__:"))
              ) {
                const translationFlag = subject.isTranslated ? "1" : "0";
                subjectId = `{{${subject.name}${translationFlag}}}#${scope}`;
              } else if (subject.id) {
                subjectId = `${subject.id}#${scope}`;
              }
              return encodeURIComponent(subjectId);
            });

            return `topic=${subjectValues.join(";;")}`;
          });

        return subjectQueries.join("&");
      },
      /**
       * Constructs the query string for limits based on selected limits.
       *
       * @returns {string} The encoded limits query string.
       */
      constructLimitsQuery() {
        if (!this.advanced) {
          // Simple mode: encode from limitData (category-grouped)
          if (!this.limitData || Object.keys(this.limitData).length === 0) {
            return "";
          }
          const filterQueries = Object.entries(this.limitData)
            .filter(([, values]) => values.length > 0)
            .map(([key, values]) => {
              const filterValues = values.map((value) => {
                const scope = this.getScopeKey(value.scope);
                const valueId =
                  value.isCustom ||
                  (typeof value.id === "string" && value.id.startsWith("__custom__:"))
                    ? `{{${value.name}}}`
                    : value.id;
                return encodeURIComponent(`${valueId}#${scope}`);
              });
              return `&${encodeURIComponent(key)}=${filterValues.join(";;")}`;
            });
          return filterQueries.join("");
        }

        // Advanced mode: encode from limitDropdowns (array of arrays)
        if (!this.limitDropdowns || !this.limitDropdowns.some((d) => d.length > 0)) {
          return "";
        }

        const limitQueries = this.limitDropdowns
          .filter((group) => group.length > 0)
          .map((group) => {
            const filterValues = group.map((item) => {
              const scope = this.getScopeKey(this.advanced ? item.scope : "normal");
              const valueId =
                item.isCustom || (typeof item.id === "string" && item.id.startsWith("__custom__:"))
                  ? `{{${item.name}}}`
                  : item.id;
              return encodeURIComponent(`${valueId}#${scope}`);
            });
            return `limit=${filterValues.join(";;")}`;
          });

        return limitQueries.length > 0 ? "&" + limitQueries.join("&") : "";
      },
      /**
       * Retrieves the scope key corresponding to the given scope value.
       * @param {string} scopeValue - The scope value (e.g., 'narrow', 'normal' or 'broad').
       * @returns {string} The scope key used in the URL.
       */
      getScopeKey(scopeValue) {
        return Object.keys(scopeIds).find((key) => scopeIds[key] === scopeValue) || "normal";
      },
      /**
       * Copies the current URL to the clipboard.
       *
       * @returns {void}
       */
      copyUrl() {
        const urlLink = this.getUrl(true);
        navigator.clipboard
          .writeText(urlLink)
          .then(() => {
            console.info("URL copied to clipboard");
          })
          .catch((err) => {
            console.error("Failed to copy URL: ", err);
          });
      },
      /**
       * Toggles the visibility of the filter dropdown.
       *
       * @returns {void}
       */
      toggle() {
        this.showFilter = !this.showFilter || this.limits.length > 0 || !this.advanced;

        // Open dropdown with a delay
        setTimeout(() => {
          if (this.advanced && this.$refs.advancedSearchLimits) {
            const limitSelection = this.$refs.advancedSearchLimits?.$refs.limitSelection;
            if (limitSelection) {
              const dropdowns = limitSelection.$refs.limitDropdown;
              const firstDropdown = Array.isArray(dropdowns) ? dropdowns[0] : dropdowns;
              this.tryActivateDropdown(firstDropdown, { focusInput: true, shouldActivate: false });
            }
          }
        }, 50);
      },
      /**
       * Adds a new topic to the topics array and updates the UI accordingly by rendering another dropdown wrapper.
       *
       * This function performs the following steps:
       * 1. Checks if there is any empty topic in the topics array.
       *    - If an empty subject is found, it alerts the user to fill the empty dropdown first and exits the function.
       * 2. Updates the placeholders for the topics.
       * 3. Adds a new empty topic to the topics array.
       * 4. Sets a timeout to focus on the search input of the newly added topic dropdown.
       */
      addTopic() {
        const isMobile = isMobileViewport();
        const hasEmptySubject = this.topics.some((entry) => entry.length === 0);
        if (hasEmptySubject) {
          const message = this.getString("fillEmptyDropdownFirstAlert");
          alert(message);
          return;
        }

        this.updatePlaceholders();
        this.topics = [...this.topics, []];

        this.$nextTick(() => {
          const subjectDropdownRef = this.$refs?.subjectSelection?.$refs?.topicDropdown;
          const lastDropdown = this.getLastDropdownRef(subjectDropdownRef);
          this.tryActivateDropdown(lastDropdown, {
            focusInput: !isMobile,
            shouldActivate: !isMobile,
          });

          // Update placeholders after DOM update
          this.updatePlaceholders();

          // Try again with a small delay if first attempt failed
          setTimeout(() => {
            const subjectDropdownRef = this.$refs?.subjectSelection?.$refs?.topicDropdown;
            const lastDropdown = this.getLastDropdownRef(subjectDropdownRef);
            this.tryActivateDropdown(lastDropdown, {
              onlyWhenClosed: true,
              shouldActivate: !isMobile,
            });
          }, 100);
        });
      },
      /**
       * Removes a topic from the topics array and updates the UI accordingly.
       *
       * @param {number} id - The index of the subject to remove.
       */
      removeTopic(id) {
        const isEmptySubject = this.topics[id] && this.topics[id].length === 0;

        this.topics.splice(id, 1);
        this.setUrl();

        if (!isEmptySubject) {
          this.editForm();
        }
      },
      /**
       * Updates the topics array and manages related state.
       *
       * @param {Array<Object>} value - The list of subject items to update.
       * @param {number} index - The index of the topics array to update.
       */
      updateTopics(value, index) {
        value.forEach((item, i) => {
          if (i > 0) this.isFirstFill = false;
          if (!item.scope) item.scope = "normal";
        });

        if (this.topics.length > 1) this.isFirstFill = false;

        const updatedSubjects = cloneDeep(this.topics);
        updatedSubjects[index] = value;
        this.topics = updatedSubjects;

        // Remove extra empty dropdowns — keep at most one empty
        this.removeExtraEmptyDropdowns("topics");

        if (
          !this.advanced &&
          this.isFirstFill &&
          Object.keys(this.limitData).length === 0
        ) {
          this.selectStandardSimple();
          this.isFirstFill = false;
        }

        if (!this.hasTopics) {
          const keepOpenLimits =
            this.openLimitsFromUrl || this.openLimits || this.effectiveCheckLimits.length > 0;
          if (!keepOpenLimits) {
            this.limits = [];
            this.limitData = {};
            this.limitDropdowns = [[]];
          }
          // Når keepOpenLimits: behold nuværende limitData/limits uændret (brugerens fravalg bevares)
          this.showFilter = false;
          this.topics = [[]];
          this.isFirstFill = true;
        }

        this.setUrl();
        this.editForm();
      },
      /**
       * Updates the scope of a specific subject item.
       *
       * @param {Object} item - The subject item to update.
       * @param {string} state - The new scope state.
       * @param {number} index - The index of the topics array where the item resides.
       */
      updateTopicScope(item, state, index) {
        const updatedSubjects = cloneDeep(this.topics);

        if (Array.isArray(updatedSubjects) && updatedSubjects[index]) {
          const subject = updatedSubjects[index].find(
            (sub) => this.optionIdentity(sub) === this.optionIdentity(item)
          );
          if (subject) {
            if (subject.scope === state) {
              // Find the topic in the topics array and remove it
              const subjectIndex = updatedSubjects[index].findIndex(
                (sub) => this.optionIdentity(sub) === this.optionIdentity(item)
              );
              updatedSubjects[index].splice(subjectIndex, 1);
            }
            subject.scope = state;
          }
          this.topics = updatedSubjects;
          this.setUrl();
          this.editForm();
        } else {
          console.warn();
          `updateTopicScope: topics[${index}] is undefined or not an array. No topics are chosen.`;
        }
      },
      /**
       * Updates the limits array and initializes limit data.
       *
       * @param {Array<Object>} value - The list of filter items to update.
       */
      updateFilters(value) {
        this.limits = cloneDeep(value);

        this.limitData = this.limits.reduce((acc, filter) => {
          acc[filter.id] = this.limitData[filter.id] || [];
          return acc;
        }, {});

        this.setUrl();
        this.editForm();
      },
      /**
       * Updates advanced filter data for a specific filter group.
       *
       * @param {Array<Object>} value - The list of advanced filter items to update.
       * @param {number} index - The index of the filter group to update.
       */
      updateFilterAdvanced(value, index) {
        value.forEach((item) => {
          if (!item.scope) item.scope = "normal";
        });

        const updatedFilterData = cloneDeep(this.limitData);
        updatedFilterData[index] = value;
        this.limitData = updatedFilterData;

        this.setUrl();
        this.editForm();
      },
      /**
       * Updates the filter data when a user selects or deselects a simple filter option.
       * Manages the limitData and limits arrays based on the user's interaction.
       * Also updates the URL and form accordingly.
       *
       * @param {string} filterType - The ID of the filter group being updated.
       * @param {Object} selectedValue - The filter option that was selected or deselected.
       * @param {string} selectedValue.name - Valgfrit custom navn for filtervalg.
       * @param {boolean} selectedValue.checked - The current checked state of the filter option.
       */
      updateLimitSimple(filterType, selectedValue) {
        if (!filterType || !selectedValue) {
          console.warn("updateLimitSimple: Missing filterType or selectedValue");
          return;
        }

        // Set the scope of the selected value
        selectedValue.scope = "normal";

        // Clone the current filter data
        const tempFilterData = { ...this.limitData };

        // Initialize the filter type array if it doesn't exist
        if (!tempFilterData[filterType]) {
          tempFilterData[filterType] = [];
        }

        // Check if the selected value is already in the filter data
        const exists = tempFilterData[filterType].some(
          (item) => this.optionIdentity(item) === this.optionIdentity(selectedValue)
        );

        // Determine if the option is checked or not
        const isChecked = selectedValue.checked; // Ensure 'checked' is a property

        if (isChecked) {
          if (exists) return; // Already added
          tempFilterData[filterType].push(selectedValue);

          // Add the filter to this.limits if not already present
          const filterExists = this.limits.some((filter) => filter.id === filterType);
          if (!filterExists) {
            const filterOption = this.limitOptions.find((option) => option.id === filterType);
            if (filterOption) {
              this.limits.push({ ...filterOption });
            } else {
              console.warn(`updateLimitSimple: Filter option with id "${filterType}" not found.`);
            }
          }
        } else {
          if (!exists) return; // Nothing to remove
          // Remove the selected value from the filter data
          tempFilterData[filterType] = tempFilterData[filterType].filter(
            (item) => this.optionIdentity(item) !== this.optionIdentity(selectedValue)
          );
          // If the filter type array is empty, remove it and the filter from this.limits
          if (tempFilterData[filterType].length === 0) {
            delete tempFilterData[filterType];
            this.limits = this.limits.filter((filter) => filter.id !== filterType);
          }
        }

        // Update the filter data
        this.limitData = tempFilterData;

        // Update the URL and the form
        this.setUrl();
        this.editForm();
      },
      updateLimitSimpleOnEnter(selectedValue) {
        const baseId = selectedValue?.id || selectedValue?.name || "";
        if (!baseId) return;
        const checkboxId = String(baseId).replaceAll(" ", "\\ "); // Handle ids with whitespace
        const checkbox = this.$el?.querySelector("#" + checkboxId);
        if (checkbox && typeof checkbox.click === "function") {
          checkbox.click();
        }
      },
      /**
       * This methods can only be called once.
       * It prefills some of the filter options in simple search.
       */
      selectStandardSimple() {
        const limitsToSelect = [];
        const useCheckLimits =
          Array.isArray(this.effectiveCheckLimits) && this.effectiveCheckLimits.length > 0;
        const hiddenGroupIds = new Set(this.effectiveHideLimits);
        for (let i = 0; i < this.limitOptions.length; i++) {
          const option = this.limitOptions[i];
          if (hiddenGroupIds.has(option.id)) {
            continue;
          }
          for (let j = 0; j < option.choices.length; j++) {
            const choice = option.choices[j];
            if (this.effectiveHideLimits.includes(choice.id)) {
              continue;
            }
            const shouldSelect = useCheckLimits
              ? this.effectiveCheckLimits.includes(choice.id) || choice.standardSimple
              : choice.standardSimple;
            if (shouldSelect) {
              const filterValue = Object.assign({ scope: "normal" }, choice);
              limitsToSelect.push({
                option: option,
                value: filterValue,
              });
            }
          }
        }

        const tempFilters = cloneDeep(this.limitData);
        // Update selected limits here.
        for (let i = 0; i < limitsToSelect.length; i++) {
          const filterToSelect = limitsToSelect[i];
          const filterType = filterToSelect.option.id;
          const filtervalue = filterToSelect.value;
          // If no array exists, create array with value.
          if (!tempFilters[filterType]) {
            tempFilters[filterType] = [filtervalue];
            this.limits.push(filterToSelect.option);
          } else if (!tempFilters[filterType].some((item) => item.id === filtervalue.id)) {
            // Else add value to existing array of filter values.
            tempFilters[filterType].push(filtervalue);
          }
        }
        this.limitData = tempFilters;
      },
      ensureCheckLimitsSelected() {
        if (this.advanced) return;
        if (!this.effectiveCheckLimits || this.effectiveCheckLimits.length === 0) return;

        const selectedIds = new Set();
        Object.values(this.limitData).forEach((values) => {
          if (!Array.isArray(values)) return;
          values.forEach((item) => {
            if (item && item.id) selectedIds.add(item.id);
          });
        });

        const hasAll = this.effectiveCheckLimits.every((id) => selectedIds.has(id));
        if (!hasAll) {
          this.selectStandardSimple();
        }
      },
      /**
       * Updates the scope filter for a given item.
       *
       * @param {Object} item - The item to update.
       * @param {string} state - The new state to set.
       * @param {number} index - The index of the item in the filter data.
       * @returns {void}
       */
      updateAdvancedFilterScope(item, state, index) {
        // Create a deep copy of the filter data
        const sel = cloneDeep(this.limitData);

        // Check if sel[index] exists and is an array
        if (sel[index] && Array.isArray(sel[index])) {
          if (!item.id) {
            console.error("Item does not have a 'id' property:", item);
            return;
          }
          // Find the item in the filter data and update its scope
          const targetItem = sel[index].find((filterItem) => filterItem.id === item.id);

          if (targetItem) {
            if (targetItem.scope === state) {
              // Find the filter in the limitData array and remove it
              const filterIndex = sel[index].findIndex(
                (sub) => this.optionIdentity(sub) === this.optionIdentity(item)
              );
              sel[index].splice(filterIndex, 1);
            }
            targetItem.scope = state;
          } else {
            console.warn(`Item with id ${item.id} not found in sel[${index}]`);
          }
        } else {
          console.error(`sel[${index}] is undefined or not an array`, sel[index]);
          return;
        }

        // Update the filter data and other states
        this.limitData = sel;
        this.setUrl();
        this.editForm();
      },

      /**
       * Removes a filter item from limitData based on the provided filterItemId.
       *
       * @param {String} filterItemId - The ID of the filter item to remove.
       */
      removeFilterItem(filterItemId) {
        // Create a shallow copy of limitData to avoid direct mutations
        const updatedFilterData = { ...this.limitData };

        // Iterate through each key in limitData
        Object.keys(updatedFilterData).forEach((key) => {
          // Filter out the item with the matching filterItemId
          if (key === filterItemId)
            // remove the key-value pair
            delete updatedFilterData[key];
        });

        // Update the limitData with the filtered results
        this.limitData = updatedFilterData;

        // Create a shallow copy of limits to avoid direct mutations
        const updatedFilters = [...this.limits];

        // Iterate through each index of updatedFilters
        updatedFilters.forEach((filter, index) => {
          // Filter out the item with the matching filterItemId
          if (filter.id === filterItemId)
            // remove the item at the index
            updatedFilters.splice(index, 1);
        });

        // Update the limits with the filtered results
        this.limits = updatedFilters;

        // Update the URL and form based on the new limitData
        this.setUrl();
        this.editForm();
      },

      /**
       * Clears the current search state and resets all relevant data.
       *
       * @returns {void}
       */
      clear() {
        this.reloadScripts();
        this.topics = [[]];
        this.limits = [];
        this.limitData = {};
        this.limitDropdowns = [[]];
        this.searchresult = undefined;
        this.finalValidatedQuery = "";
        this.count = 0;
        this.page = 0;
        this.showFilter = false;
        this.details = true;
        // Hack to force all elements back to normal
        this.advanced = true;
        this.advancedClick();
        this.advancedString = false;
        this.isFirstFill = true;
        this.sort = order[0];

        if (
          !this.advanced &&
          (this.openLimitsFromUrl || this.openLimits || this.effectiveCheckLimits.length > 0)
        ) {
          this.$nextTick(() => {
            this.selectStandardSimple();
            this.isFirstFill = false;
          });
        }

        // Reset expanded groups in dropdown. Only need to do first as the other dropdowns are deleted
        const subjectDropdown = this.$refs?.subjectSelection?.$refs?.topicDropdown;
        if (subjectDropdown && subjectDropdown[0]) {
          subjectDropdown[0].clearShownItems();
        }
        this.setUrl();

        // Focus on the first input field after reset
        this.$nextTick(() => {
          const subjectDropdown = this.$refs?.subjectSelection?.$refs?.topicDropdown;
          if (
            subjectDropdown &&
            subjectDropdown[0] &&
            subjectDropdown[0].setSilentFocusFromParent
          ) {
            subjectDropdown[0].setSilentFocusFromParent();
          }
        });
      },
      editForm() {
        this.searchresult = undefined;
        this.finalValidatedQuery = "";
        this.count = 0;
        this.page = 0;
        return true;
      },
      scrollToTop() {
        const target = document.getElementById(this.scrollToID);
        if (target) {
          target.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      },
      /**
       * Reloads certain scripts and removes specific script and div elements from the DOM.
       * This method cleans up third-party scripts and their associated elements to prevent
       * performance issues or conflicts, especially with Altmetric and Dimension scripts.
       */
      reloadScripts() {
        /**
         * Remove specific scripts from the <head> element.
         * Scripts with IDs 'dimension' or 'altmetric' are removed.
         */
        const headScripts = document.head.getElementsByTagName("script");
        const headScriptsArray = Array.from(headScripts);

        headScriptsArray.forEach((script) => {
          if (script.id === "dimension" || script.id === "altmetric") {
            script.parentNode.removeChild(script);
          }
        });

        /**
         * Remove specific scripts from the <body> element.
         * Scripts whose 'src' attribute starts with Altmetric API URLs are removed.
         */
        const bodyScripts = document.body.getElementsByTagName("script");
        const bodyScriptsArray = Array.from(bodyScripts);

        bodyScriptsArray.forEach((script) => {
          const src = script.src || "";
          if (
            src.startsWith("https://api.altmetric.com/v1/pmid") ||
            src.startsWith("https://api.altmetric.com/v1/doi")
          ) {
            script.parentNode.removeChild(script);
          }
        });

        /**
         * Remove Altmetric embed containers from the <body> element.
         * Div elements with class 'altmetric-embed altmetric-popover altmetric-left' are removed.
         */
        const altmetricContainers = document.body.getElementsByClassName(
          "altmetric-embed altmetric-popover altmetric-left"
        );
        const containerArray = Array.from(altmetricContainers);

        containerArray.forEach((container) => {
          container.parentNode.removeChild(container);
        });
      },
      async searchsetLowStart() {
        this.count = 0;
        this.page = 0;
        await this.search();
      },
      /**
       * Merges new entries into the existing searchresult without duplicates.
       * @param {Array} newEntries - Array of new result entries to add.
       * @returns {Array} - Array of unique entries.
       */
      mergeUniqueEntries(newEntries) {
        const existingUids = new Set(this.searchresult.map((item) => item.uid));
        const uniqueEntries = newEntries.filter((item) => !existingUids.has(item.uid));
        return uniqueEntries;
      },
      /**
       * Initiates a PubMed search using NCBI's Entrez API.
       * Performs an esearch followed by an esummary to retrieve search results.
       * Updates component state with the results and handles UI updates.
       */
      async search() {
        this.searchLoading = true;
        this.searchError = null;

        const query = decodeURIComponent(this.getSearchString).trim();
        const { nlm } = this.appSettings;
        console.group("[SearchFlow] search()");
        console.info("[SearchFlow] Raw query from getSearchString:", query);

        if (!query || query === "()") {
          console.info("[SearchFlow] Query is empty. Search aborted.");
          this.searchLoading = false;
          console.groupEnd();
          return;
        }

        this.reloadScripts();

        try {
          // No additional validation flow on search button click.
          // Validation is performed when free-text queries are generated.
          const finalQuery = query;
          this.finalValidatedQuery = finalQuery;
          console.info("[SearchFlow] Final query (no extra flow on search):", finalQuery);

          // ESearch request to get list of IDs (credentials handled by PHP proxy)
          const esearchParams = new URLSearchParams({
            db: "pubmed",
            retmode: "json",
            retmax: this.pageSize,
            retstart: this.page * this.pageSize,
            sort: this.sort.method,
            term: finalQuery,
          });
          console.info("[SearchFlow] ESearch term sent to NLM:", finalQuery);

          const esearchResponse = await axios.post(
            `${nlm.proxyUrl}/NlmSearch.php`,
            esearchParams.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );

          const idList = esearchResponse.data.esearchresult.idlist.filter(Boolean);

          if (idList.length === 0) {
            this.count = 0;
            this.searchresult = [];
            this.searchLoading = false;
            return;
          }

          // ESummary request to get details for each ID (credentials handled by PHP proxy)
          const esummaryParams = new URLSearchParams({
            db: "pubmed",
            retmode: "json",
            id: idList.join(","),
          });

          const esummaryResponse = await axios.get(
            `${nlm.proxyUrl}/NlmSummary.php?${esummaryParams}`
          );

          const esummaryResult = esummaryResponse.data.result;

          if (!esummaryResult) {
            console.error("Error: Search was not successful", esummaryResponse);
            this.searchLoading = false;
            return;
          }

          const data = esummaryResult.uids.map((uid) => esummaryResult[uid]);

          this.count = parseInt(esearchResponse.data.esearchresult.count, 10);
          this.searchresult = data;
          // Handle any preselected PMIDs
          const preSelectedEntries = await this.searchPreselectedPmidai();
          if (preSelectedEntries && preSelectedEntries.length > 0) {
            const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
            this.searchresult = [...this.searchresult, ...uniquePreselected];
          }
          this.searchLoading = false;

          // Update UI and focus
          this.$nextTick(() => {
            const searchButton = this.$el?.querySelector(".qpm_search");
            if (searchButton) searchButton.focus();

            const topOfSearch = document.getElementById("qpm_topofsearch");
            if (topOfSearch) {
              topOfSearch.scrollIntoView({
                block: "start",
                behavior: "smooth",
              });
            }
          });
        } catch (error) {
          this.showSearchError(error);
          this.searchLoading = false;
        } finally {
          console.groupEnd();
        }
      },
      /**
       * Fetches additional PubMed search results based on the current search query and pagination.
       * Utilizes NCBI's Entrez API to perform an ESearch followed by an ESummary to retrieve
       * detailed information for each PubMed ID. Updates the component's state with the new results
       * and handles UI updates accordingly without altering the current scroll position.
       *
       * @async
       * @function searchMore
       * @returns {Promise<void>} A promise that resolves when the additional search results are fetched and processed.
       *
       * @throws Will throw an error if the API requests fail.
       */
      async searchMore() {
        // Calculate the target number of results based on the next page
        const targetResultLength = Math.min((this.page + 1) * this.pageSize, this.count);

        // If current results already meet or exceed the target, no need to fetch more
        if (this.searchresult && this.searchresult.length >= targetResultLength) {
          return;
        }

        // Set loading state and reset any existing errors
        this.searchLoading = true;
        this.searchError = null;

        // Decode and trim the search query string
        const query = decodeURIComponent(this.getSearchString).trim();
        const { nlm } = this.appSettings;
        console.group("[SearchFlow] searchMore()");
        console.info("[SearchFlow] Raw query from getSearchString:", query);

        // Validate the query string
        if (!query || query === "()") {
          console.info("[SearchFlow] Query is empty. Pagination aborted.");
          this.searchLoading = false;
          console.groupEnd();
          return;
        }

        // Reload necessary scripts to ensure a clean environment
        this.reloadScripts();

        try {
          const validatedQuery = this.finalValidatedQuery || query;
          console.info(
            "[SearchFlow] Reusing final validated query (no revalidation in searchMore):",
            validatedQuery
          );

          // Prepare parameters for the ESearch API request (credentials handled by PHP proxy)
          const esearchParams = new URLSearchParams({
            db: "pubmed",
            retmode: "json",
            retmax: Math.min(this.pageSize, targetResultLength - (this.searchresult.length || 0)),
            retstart: Math.max(this.searchresult.length || 0, this.page * this.pageSize),
            sort: this.sort.method,
            term: validatedQuery,
          });
          console.info("[SearchFlow] ESearch term sent to NLM:", validatedQuery);

          // Perform the ESearch API request to retrieve PubMed IDs
          const esearchResponse = await axios.post(
            `${nlm.proxyUrl}/NlmSearch.php`,
            esearchParams.toString(),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );

          // Extract and filter the list of PubMed IDs
          const idList = esearchResponse.data.esearchresult.idlist.filter(
            (id) => id && id.trim() !== ""
          );

          // If no IDs are returned, update the state and exit
          if (idList.length === 0) {
            this.count = 0;
            this.searchresult = [];
            this.searchLoading = false;
            return;
          }

          // Prepare parameters for the ESummary API request (credentials handled by PHP proxy)
          const esummaryParams = new URLSearchParams({
            db: "pubmed",
            retmode: "json",
            id: idList.join(","),
          });

          // Perform the ESummary API request to retrieve detailed information
          const esummaryResponse = await axios.get(
            `${nlm.proxyUrl}/NlmSummary.php?${esummaryParams}`
          );

          const esummaryResult = esummaryResponse.data.result;

          // Validate the ESummary response
          if (!esummaryResult) {
            console.error("Error: Search was not successful", esummaryResponse);
            this.searchLoading = false;
            return;
          }

          // Extract the detailed data for each PubMed ID
          const data = esummaryResult.uids.map((uid) => esummaryResult[uid]);

          // Update the total count and append the new data to existing search results
          this.count = parseInt(esearchResponse.data.esearchresult.count, 10);

          // Merge unique entries to prevent duplicates
          const uniqueData = this.mergeUniqueEntries(data);
          this.searchresult = [...this.searchresult, ...uniqueData];

          // Handle any preselected PMIDs
          const preSelectedEntries = await this.searchPreselectedPmidai();
          if (preSelectedEntries && preSelectedEntries.length > 0) {
            const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
            this.searchresult = [...this.searchresult, ...uniquePreselected];
          }

          // Reset the loading state
          this.searchLoading = false;

          // Find the first result entry from the new data and focus on it
          const currentResultEntries = this.$refs?.searchResultList?.$refs?.resultEntries || [];

          const resultEntryIndexToFocus = targetResultLength - this.pageSize;

          const firstNewResultEntry = currentResultEntries[resultEntryIndexToFocus];
          firstNewResultEntry?.$el?.focus();

          // Note: Removed scrolling and focus updates to maintain current scroll position
        } catch (error) {
          // Handle and log any errors that occur during the API requests
          console.error(error);
          this.showSearchError(error);
          this.searchLoading = false;
        } finally {
          console.groupEnd();
        }
      },
      /**
       * Searches for articles by their PubMed IDs (PMIDs).
       *
       * @async
       * @function
       * @param {string[]} ids - An array of PubMed IDs to search for.
       * @returns {Promise<Object[]>} A promise that resolves to an array of article data objects.
       */
      async searchByIds(ids) {
        ids = ids.filter((id) => id && id.trim() !== "");
        if (ids.length === 0) {
          return [];
        }
        const nlm = this.appSettings.nlm;
        // Credentials handled by PHP proxy
        const baseUrl = `${nlm.proxyUrl}/NlmSummary.php?db=pubmed&retmode=json&id=`;

        const resp = await axios.get(baseUrl + ids.join(","));
        //Create list of returned data
        const data = [];
        const obj = resp.data.result;
        if (!obj) {
          throw Error("Search failed", resp);
        }
        for (let i = 0; i < obj.uids.length; i++) {
          data.push(obj[obj.uids[i]]);
        }
        return data;
      },
      /**
       * Searches for preselected articles using PMIDs with AI assistance.
       *
       * @function
       */
      async searchPreselectedPmidai() {
        try {
          this.preselectedEntries = await this.searchByIds(this.preselectedPmidai);
          return this.preselectedEntries;
        } catch (err) {
          console.error(err);
        }
      },
      /**
       * Displays a generic search error message to the user.
       *
       * @function
       * @param {Error} err - The error object representing the cause of the search failure.
       */
      showSearchError(err) {
        const message = this.getString("searchErrorGeneric");
        const option = { cause: err };
        this.searchError = Error(message, option);
      },
      async setPageSize(pageSize) {
        this.pageSize = pageSize;
        this.page = 0;
        this.setUrl();
        await this.searchMore();
      },
      async nextPage() {
        this.page++;
        this.setUrl();
        await this.searchMore();
      },
      async previousPage() {
        this.page--;
        this.setUrl();
        await this.search();
      },
      toggleDetailsBox() {
        this.details = !this.details;
      },
      toggleAdvancedString() {
        this.advancedString = !this.advancedString;
      },
      async newSortMethod(newVal) {
        this.sort = newVal && typeof newVal === "object" ? { ...newVal } : newVal;
        this.page = 0;
        this.setUrl();
        this.count = 0;
        await this.search();
      },
      /**
       * Toggles the collapsed state of the search form.
       *
       * @returns {void}
       */
      toggleCollapsedController() {
        this.isCollapsed = !this.isCollapsed;
        this.setUrl();
      },
      getString(string) {
        if (!messages[string]) {
          console.warn(`Missing translation key: ${string}`);
          return string;
        }
        const constant = messages[string][this.language];
        return constant !== undefined ? constant : messages[string]["dk"];
      },
      /**
       * Returns the custom name label for the given option.
       *
       * @param {Object} option - The option object containing name and translations.
       * @returns {string} The custom name label.
       */
      getCustomNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return "";

        if (option.translations) {
          return getLocalizedTranslation(option, this.language, "dk") || option.name || option.id;
        }
        return option.name || option.id;
      },
      updateTopicDropdownWidth() {
        const dropdown =
          this.$refs?.subjectSelection?.$refs?.topicDropdown?.[0]?.$refs?.selectWrapper;

        if (!dropdown) return;
        this.topicDropdownWidth = dropdown.offsetWidth;

        // Update placeholders automatically on resize
        this.updatePlaceholders();
      },
      getLastDropdownRef(refEntry) {
        const refs = Array.isArray(refEntry) ? refEntry : refEntry ? [refEntry] : [];
        return refs[refs.length - 1];
      },
      tryActivateDropdown(
        dropdown,
        { focusInput = false, onlyWhenClosed = false, shouldActivate = true } = {}
      ) {
        const multiselect = dropdown?.$refs?.multiselect;
        const input = multiselect?.$refs?.search;
        if (!input) return;
        if (focusInput && typeof input.focus === "function") {
          input.focus();
        }
        if (
          shouldActivate &&
          !dropdown?.shouldHideDropdownArrow &&
          (!onlyWhenClosed || !multiselect.isOpen) &&
          typeof multiselect.activate === "function"
        ) {
          multiselect.activate();
        }
      },
      shouldFocusNextDropdownOnMount(source) {
        if (!this.focusNextDropdownOnMount) return;
        this.focusNextDropdownOnMount = false;
        const multiselect = source?.$refs?.multiselect;
        if (multiselect && typeof multiselect.activate === "function") {
          multiselect.activate();
        }
      },
      getSimpleTooltip(choice) {
        if (!choice.tooltip_simple) return null;
        return choice.tooltip_simple[this.language];
      },
      async updatePreselectedPmidai(newValue) {
        this.preselectedPmidai = (newValue ?? []).map((entry) => entry.uid);

        this.setUrl();
      },
      // passing along the index seemingly makes vue understand that
      // the dropdownwrappers can have seperate placeholders so keep it even though it is unused
      getDropdownPlaceholder(index, translating = false) {
        if (translating) {
          return this.getString("translatingPlaceholder");
        }

        const hasTopics = this.hasAvailableTopics;
        const width = this.topicDropdownWidth;
        const isMobileOrSmall = isMobileViewport() || (width < 520 && width >= 0);

        // Use the same mobile logic for both simple and advanced modes
        if (isMobileOrSmall) {
          return this.getString(
            hasTopics
              ? "topicadvancedplaceholder_mobile"
              : "topicadvancedplaceholder_mobile_notopics"
          );
        } else {
          if (this.advanced) {
            return this.getString(
              hasTopics ? "topicadvancedplaceholder" : "topicadvancedplaceholder_notopics"
            );
          } else {
            return this.getString(
              hasTopics ? "topicsimpleplaceholder" : "topicsimpleplaceholder_notopics"
            );
          }
        }
      },
      clearPlaceholderDotInterval() {
        if (this.placeholderDotIntervalId !== null && this.placeholderDotIntervalId !== undefined) {
          clearInterval(this.placeholderDotIntervalId);
          this.placeholderDotIntervalId = null;
        }
        this.placeholderDotIndex = null;
        this.placeholderDotBaseText = "";
      },
      getLimitPlaceholder(index) {
        return this.limitDropdownPlaceholders[index] || this.getDefaultFilterPlaceholder();
      },
      getDefaultFilterPlaceholder() {
        const isMobileOrSmall = isMobileViewport() || window.innerWidth < 520;
        return this.getString(isMobileOrSmall ? "choselimits_mobile" : "choselimits");
      },
      clearFilterPlaceholderDotInterval() {
        if (
          this.filterPlaceholderDotIntervalId !== null &&
          this.filterPlaceholderDotIntervalId !== undefined
        ) {
          clearInterval(this.filterPlaceholderDotIntervalId);
          this.filterPlaceholderDotIntervalId = null;
        }
        this.filterPlaceholderDotIndex = null;
        this.filterPlaceholderDotBaseText = "";
      },
      updateLimitPlaceholder(isTranslating, index, stepKey) {
        if (isTranslating) {
          this.clearFilterPlaceholderDotInterval();
          const baseText =
            stepKey && messages[stepKey]
              ? this.getString(stepKey)
              : this.getString("translatingPlaceholder");
          this.limitDropdownPlaceholders[index] = baseText;
          this.filterPlaceholderDotIndex = index;
          this.filterPlaceholderDotBaseText = baseText;
          let dotCount = 0;
          this.filterPlaceholderDotIntervalId = setInterval(() => {
            if (this.filterPlaceholderDotIndex === null) return;
            dotCount = (dotCount % 5) + 1;
            this.limitDropdownPlaceholders[this.filterPlaceholderDotIndex] =
              this.filterPlaceholderDotBaseText + ".".repeat(dotCount);
          }, 400);
        } else {
          this.clearFilterPlaceholderDotInterval();
          this.limitDropdownPlaceholders[index] = this.getDefaultFilterPlaceholder();
        }
      },
      updatePlaceholder(isTranslating, index, stepKey) {
        if (isTranslating) {
          this.clearPlaceholderDotInterval();
          const baseText =
            stepKey && messages[stepKey]
              ? this.getString(stepKey)
              : this.getDropdownPlaceholder(index, true);
          this.dropdownPlaceholders[index] = baseText;
          this.placeholderDotIndex = index;
          this.placeholderDotBaseText = baseText;
          let dotCount = 0;
          this.placeholderDotIntervalId = setInterval(() => {
            if (this.placeholderDotIndex === null) return;
            dotCount = (dotCount % 5) + 1;
            this.dropdownPlaceholders[this.placeholderDotIndex] =
              this.placeholderDotBaseText + ".".repeat(dotCount);
          }, 400);
        } else {
          this.clearPlaceholderDotInterval();
          this.dropdownPlaceholders[index] = this.getDropdownPlaceholder(index, false);
        }
      },
      updatePlaceholders() {
        this.$nextTick(() => {
          const subjectSelectionRef = this.$refs.subjectSelection;
          if (subjectSelectionRef && subjectSelectionRef.$refs.topicDropdown) {
            const subjectDropdowns = subjectSelectionRef.$refs.topicDropdown;
            if (Array.isArray(subjectDropdowns)) {
              subjectDropdowns.forEach((_, index) => {
                this.updatePlaceholder(false, index);
              });
            } else {
              // If it's a single ref
              this.updatePlaceholder(true, 0);
            }
          }
        });
      },
    },
  };
</script>
