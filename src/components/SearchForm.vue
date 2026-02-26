<template>
  <div>
    <div :id="getComponentId">
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
            :subjects="subjects"
            :get-string="getString"
            @toggle-collapsed="toggleCollapsedController"
          />

          <!-- The toggle for AI translation -->
          <ai-translation-toggle
            v-model="searchWithAI"
            :is-collapsed="isCollapsed"
            :get-string="getString"
          />

          <div
            v-show="isCollapsed"
            class="qpm_collapsedSpacerPadding"
          >
          </div>

          <div v-show="!isCollapsed" class="qpm_searchformoptions">
            <!-- The dropdown for selecting subjects to be included in the search -->
            <subject-selection
              ref="subjectSelection"
              :subjects="subjects"
              :hide-topics="effectiveHideTopics"
              :subject-options="subjectOptions"
              :dropdown-placeholders="dropdownPlaceholders"
              :language="language"
              :advanced="advanced"
              :show-filter="showFilter"
              :has-subjects="hasSubjects"
              :search-with-a-i="searchWithAI"
              :get-string="getString"
              @update-subjects="updateSubjects"
              @update-scope="updateSubjectScope"
              @should-focus-next-dropdown="shouldFocusNextDropdownOnMount"
              @update-placeholder="updatePlaceholder"
              @add-subject="addSubject"
              @remove-subject="removeSubject"
              @toggle-filter="toggle"
            />

            <!-- The dropdown(s) for selecting filters to be included in the advanced search -->
            <advanced-search-filters
              v-if="advanced && hasSubjects"
              ref="advancedSearchFilters"
              :advanced="advanced"
              :filter-options="filterOptions"
              :filter-dropdowns="filterDropdowns"
              :hide-topics="effectiveHideTopics"
              :language="language"
              :search-with-a-i="searchWithAI"
              :get-string="getString"
              :get-filter-placeholder="getFilterPlaceholder"
              @update-filter-dropdown="updateFilterDropdown"
              @update-filter-scope="updateFilterDropdownScope"
              @update-filter-placeholder="updateFilterPlaceholder"
              @add-filter-dropdown="addFilterDropdown"
              @remove-filter-dropdown="removeFilterDropdown"
            />

            <!-- The radio buttons for filters to be included in the simple search -->
            <simple-search-filters
              v-if="!advanced && showSimpleFilters"
              :advanced="advanced"
              :filtered-choices="filteredChoices"
              :filter-data="filterData"
              :help-text-delay="300"
              :get-string="getString"
              :get-custom-name-label="getCustomNameLabel"
              :get-simple-tooltip="getSimpleTooltip"
              @update-filter="updateFilterSimple"
              @update-filter-enter="updateFilterSimpleOnEnter"
            />
          </div>
        </div>

        <div id="qpm_topofsearch" class="qpm_flex">
          <!-- The search query written out as human readable text-->
          <worded-search-string
            :subjects="subjects"
            :filters="filterData"
            :available-filters="filtersContent"
            :filter-dropdowns="filterDropdowns"
            :searchstring="getSearchString"
            :is-collapsed="isCollapsed"
            :details="details"
            :advanced-string="advancedString"
            :advanced-search="advanced"
            :show-header="!isCollapsed"
            :language="language"
            @toggleDetailsBox="toggleDetailsBox"
            @toggleAdvancedString="toggleAdvancedString"
          />
        </div>

        <div v-show="hasSubjects && !isCollapsed">
          <!-- Buttons for reset, copy url and search -->
          <action-buttons
            :search-loading="searchLoading"
            :get-string="getString"
            @clear="clear"
            @copyUrl="copyUrl"
            @searchsetLowStart="searchsetLowStart"
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
        @newPageSize="setPageSize"
        @newSortMethod="newSortMethod"
        @high="nextPage"
        @low="previousPage"
        @change:selectedEntries="updatePreselectedPmidai"
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
  import { normalizeFiltersList } from "@/utils/contentCanonicalizer";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { scopeIds, customInputTagTooltip } from "@/utils/contentHelpers.js";
  import { loadFiltersFromRuntime, loadStandardString } from "@/utils/contentLoader";
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
      SimpleSearchFilters,
      AdvancedSearchFilters,
      SubjectSelection,
      WordedSearchString,
      SearchResult,
    },
    mixins: [appSettingsMixin, topicLoaderMixin],
    props: {
      hideTopics: {
        type: Array,
        default: () => []
      },
      hideLimits: {
        type: Array,
        default: () => []
      },
      checkLimits: {
        type: Array,
        default: () => []
      },
      orderLimits: {
        type: Array,
        default: () => []
      },
      openFilters: {
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
        filterData: {},
        filterDropdowns: [[]],
        filterOptions: [],
        filters: [],
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
        subjectDropdownWidth: 0,
        subjectOptions: [],
        subjects: [[]],
        translating: false,
        dropdownPlaceholders: [],
        placeholderDotIntervalId: null,
        placeholderDotIndex: null,
        placeholderDotBaseText: "",
        filterDropdownPlaceholders: [],
        filterPlaceholderDotIntervalId: null,
        filterPlaceholderDotIndex: null,
        filterPlaceholderDotBaseText: "",
        openFiltersFromUrl: false,
        urlHideLimits: [],
        urlCheckLimits: [],
        urlOrderLimits: [],
        filtersContent: [],
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
        const std = loadStandardString(this.currentDomain);
        return std && typeof std === "object" && Object.keys(std).length > 0 ? std : null;
      },
      showSimpleFilters() {
        return this.hasSubjects || this.openFiltersFromUrl || this.openFilters;
      },
      filteredChoices() {
        const hiddenGroupIds = new Set(this.effectiveHideLimits);
        const orderMap = new Map(
          (this.effectiveOrderLimits || []).map((id, index) => [id, index])
        );
        return this.filterOptions.map((option) => {
          if (hiddenGroupIds.has(option.id)) {
            return { ...option, choices: [] };
          }
          const choices = option.choices.filter(
            (choice) => choice.simpleSearch && !this.effectiveHideLimits.includes(choice.id)
          );
          if (orderMap.size === 0) {
            return { ...option, choices };
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
          if (node.hiddenByDefault === true && typeof node.id === "string" && node.id.trim() !== "") {
            out.push(node.id);
          }
          if (Array.isArray(node.groups)) {
            node.groups.forEach(visit);
          }
          if (Array.isArray(node.children)) {
            node.children.forEach(visit);
          }
        };
        this.subjectOptions.forEach(visit);
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
      hasFilterSelections() {
        return this.filterDropdowns.some((dropdown) => dropdown.length > 0);
      },
      hasSubjects() {
        return this.subjects.some((subjectArray) => subjectArray.length > 0);
      },
      /**
       * Derives the user's search intention from subjects and filters.
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
        const subjectGroups = this.subjects
          .filter((group) => group.length > 0)
          .map((group) => {
            const labels = group.map(getItemLabel).filter(Boolean);
            if (labels.length === 0) return "";
            if (labels.length === 1) return labels[0];
            return "(" + labels.join(" ELLER ") + ")";
          })
          .filter(Boolean);

        // Build filter intent with logical operators
        const filterGroups = this.filterDropdowns
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
            .filter((item) =>
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

        this.subjects.forEach((subjectGroup, index) => {
          const subjectsToIterate = subjectGroup.length;
          const hasOperators = subjectGroup.some((item) =>
            item.searchStrings && 
            item.scope && 
            item.searchStrings[item.scope] && 
            item.searchStrings[item.scope][0] &&
            hasLogicalOperators(item.searchStrings[item.scope][0])
          );

          let substring = index > 0 ? " AND " : "";
          if (
            (hasOperators && (this.subjects.length > 1 || this.filters.length > 0)) ||
            subjectsToIterate > 1
          ) {
            substring += "(";
          }

          substring += buildSubstring(subjectGroup, " OR ", true);

          if (
            (hasOperators && (this.subjects.length > 1 || this.filters.length > 0)) ||
            subjectsToIterate > 1
          ) {
            substring += ")";
          }

          if (substring !== "()" && substring !== " AND ()" && substring !== " AND ") {
            substrings.push(substring);
          }
        });

        if (this.advanced) {
          // Advanced mode: process filterDropdowns per-dropdown
          // All items in same dropdown = OR, between dropdowns = AND
          this.filterDropdowns.forEach((dropdownItems) => {
            if (dropdownItems.length === 0) return;

            const hasOperators = dropdownItems.some((item) =>
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
          // Simple mode: use filterData (category-grouped object)
          Object.keys(this.filterData).forEach((key) => {
            const filterGroup = this.filterData[key];
            const hasOperators = filterGroup.some((item) =>
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
      subjectOptions: {
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
      if (this._updateSubjectDropdownWidthDebounced) {
        window.removeEventListener("resize", this._updateSubjectDropdownWidthDebounced);
      }
    },
    async mounted() {
      await this.loadFiltersData();

      this.advanced = !this.advanced;
      this.advancedClick(true);
      this.parseUrl();
      this.isUrlParsed = true;

      this.updatePlaceholders();
      this.updateSubjectDropdownWidth();
      this._updateSubjectDropdownWidthDebounced = debounce(
        this.updateSubjectDropdownWidth.bind(this),
        120
      );
      window.addEventListener("resize", this._updateSubjectDropdownWidthDebounced);

      this.prepareFilterOptions();
      this.prepareSubjectOptions();

        if (
          !this.advanced &&
          (this.openFiltersFromUrl || this.openFilters || this.urlCheckLimits.length > 0) &&
          Object.keys(this.filterData).length === 0
        ) {
        this.selectStandardSimple();
        this.isFirstFill = false;
      }
      
      this.advanced = !this.advanced;
      this.advancedClick();
      this.ensureCheckLimitsSelected();
      if (this.hasSubjects) {
        await this.search();
        await this.searchPreselectedPmidai();
      }
      
      // Ensure correct placeholder width after DOM is fully rendered
      this.$nextTick(() => {
        this.updateSubjectDropdownWidth();
        this.updatePlaceholders();

        // Silent focus on the first input — only for the first SearchForm instance on the page
        const allWrappers = document.querySelectorAll(".qpm-searchform, .searchform");
        const isFirstInstance =
          allWrappers.length === 0 ||
          allWrappers[0] === this.$el ||
          allWrappers[0] === this.$el?.parentElement;
        if (!isFirstInstance) return;

        const firstSubjectDropdown = this.$refs.subjectSelection?.$refs.subjectDropdown?.[0];
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
        if (!this.subjectOptions || this.subjectOptions.length === 0) {
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

        const availableTopics = this.subjectOptions
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

        this.hasAvailableTopicsCached = availableTopics.length > 0 && availableTopics.some((section) => {
          return section.groups && section.groups.length > 0;
        });
      },
      async loadFiltersData() {
        try {
          this.filtersContent = await loadFiltersFromRuntime();
        } catch (error) {
          this.filtersContent = [];
          console.error("Failed to load filters from runtime content API.", error);
        }
      },
      optionIdentity(option) {
        if (!option || typeof option !== "object") return "";
        if (option.id) return `id:${option.id}`;
        if (option.isCustom && option.name) return `custom:${option.name}`;
        if (option.name) return `name:${option.name}`;
        return "";
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
          console.error('initializeFocusVisible: Could not find any suitable element!');
          return;
        }
        
        // Add qpm_vapp class to match CSS selectors
        appElement.classList.add('qpm_vapp');
        
        // Start in mouse mode - only show focus outlines when user uses keyboard
        appElement.classList.add('qpm_mouse-mode');
        appElement.classList.remove('qpm_keyboard-mode');
        
        // Switch only on keyboard navigation keys
        const handleKeyDown = (event) => {
          if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            appElement.classList.add('qpm_keyboard-mode');
            appElement.classList.remove('qpm_mouse-mode');
          }
        };
        
        // Switch to mouse mode on click interactions
        const handleMouseDown = () => {
          appElement.classList.add('qpm_mouse-mode');
          appElement.classList.remove('qpm_keyboard-mode');
        };
        
        // Add event listeners
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('mousedown', handleMouseDown, true);
        
        // Store cleanup function for potential future use
        this._focusVisibleCleanup = () => {
          document.removeEventListener('keydown', handleKeyDown, true);
          document.removeEventListener('mousedown', handleMouseDown, true);
        };
      },
      advancedClick(skip = false) {
        // Toggle the 'advanced' mode
        this.advanced = !this.advanced;

        // Reset options with proper cleanup
        this.subjectOptions.splice(0);
        this.filterOptions.splice(0);

        // Save pre-reset filterData for migration (before it gets cleared)
        const preResetFilterData = (!this.alwaysShowFilter && Object.keys(this.filterData).length > 0)
          ? cloneDeep(this.filterData)
          : null;

        // Reset filters if necessary
        if (!this.alwaysShowFilter) {
          this.filterData = {};
          this.filters.splice(0);
          // Don't reset filterDropdowns here - like subjects, they may contain URL data
        }

        // Prepare options FIRST (needed for getFilterCategoryId in sync)
        this.prepareFilterOptions();
        this.prepareSubjectOptions();

        // Sync between filterData and filterDropdowns on mode switch
        // (must happen AFTER prepareFilterOptions so getFilterCategoryId works)
        if (this.advanced && this.filterDropdowns.some((d) => d.length > 0)) {
          // Entering advanced: filterDropdowns has data → sync to filterData
          this.syncFilterDataFromDropdowns();
        } else if (this.advanced && preResetFilterData) {
          // Entering advanced: filterData had data from simple mode → migrate to filterDropdowns
          // Each category becomes its own dropdown (AND between categories, OR within)
          const dropdowns = Object.values(preResetFilterData).filter((arr) => arr.length > 0);
          this.filterDropdowns = dropdowns.length > 0 ? dropdowns : [[]];
          this.syncFilterDataFromDropdowns();
        } else if (this.advanced && Object.keys(this.filterData).length > 0) {
          // Entering advanced: filterData has data (alwaysShowFilter) → migrate to filterDropdowns
          const dropdowns = Object.values(this.filterData).filter((arr) => arr.length > 0);
          this.filterDropdowns = dropdowns.length > 0 ? dropdowns : [[]];
          this.syncFilterDataFromDropdowns();
        } else if (!this.advanced && this.filterDropdowns.some((d) => d.length > 0)) {
          // Entering simple: sync filterData from filterDropdowns, then reset dropdowns
          this.syncFilterDataFromDropdowns();
          this.filterDropdowns = [[]];
        }

        // Reset subject scopes in non-advanced mode
        if (!this.advanced) {
          this.resetSubjectScopes();
        }

        // Update filters
        this.updateFiltersBasedOnSelection();

        // Clean filter data
        this.cleanFilterData();

        // Reset filters if empty in advanced mode
        if (this.advanced && Object.keys(this.filterData).length === 0 && !this.hasFilterSelections) {
          this.filters = [];
        }

        // Update URL
        if (!skip) this.setUrl();

        // Set 'showFilter' flag
        this.showFilter = this.advanced && (this.filters.length > 0 || this.hasFilterSelections);
        
        this.$nextTick(() => {
          this.updateSubjectDropdownWidth();
          this.updatePlaceholders();
        });
      },
      prepareFilterOptions() {
        const filterCopy = normalizeFiltersList(cloneDeep(this.filtersContent));
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
                !this.filterOptions.includes(filterItem)
              ) {
                this.filterOptions.push(filterItem);
                  }
              }
            });
            }
          } else {
            // Add groups property for grouped DropdownWrapper (isGroup=true)
            filterItem.groups = filterItem.choices;
            this.filterOptions.push(filterItem);
          }
        });
      },
      prepareSubjectOptions() {
        const subjectCopy = cloneDeep(this.topics);
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
          this.subjectOptions.push(subjectItem);
        });
      },
      resetSubjectScopes() {
        this.subjects.forEach((subjectGroup) => {
          subjectGroup.forEach((subject) => {
            subject.scope = "normal";
          });
        });
      },
      updateFiltersBasedOnSelection() {
        const updatedFilters = [];
        this.filters.forEach((filter) => {
          const matchingFilter = this.filterOptions.find(
            (option) => this.optionIdentity(option) === this.optionIdentity(filter)
          );
          if (matchingFilter) {
            const shouldIncludeFilter =
              this.isUrlParsed && !this.advanced
                ? filter.choices.some(
                    (choice) =>
                      (choice.simpleSearch || choice.standardSimple) && this.filterData[filter.id]
                  )
                : this.filterData[filter.id];
            if (shouldIncludeFilter && !updatedFilters.includes(matchingFilter)) {
              updatedFilters.push(matchingFilter);
            }
          }
        });
        this.filters = updatedFilters;
      },
      cleanFilterData() {
        const filterDataCopy = { ...this.filterData };
        Object.keys(filterDataCopy).forEach((key) => {
          let values = filterDataCopy[key];
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
            filterDataCopy[key] = values;
          } else {
            delete filterDataCopy[key];
          }
        });
        this.filterData = filterDataCopy;
      },
      /**
       * Parses the current URL's query parameters and updates the component's state accordingly.
       * Handles subjects, filters, advanced mode, sorting, collapsed state, page size,
       * preselected PMIDs, and scroll position.
       */
      parseUrl() {
        // Initialize subjects
        this.subjects = [];

        // Parse the current URL (search + hash query fallback for CMS embeds)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = this.getHashUrlParams();
        hashParams.forEach((value, key) => {
          urlParams.append(key, value);
        });

        // Check if there are query parameters
        if (![...urlParams.keys()].length) {
          this.subjects = [[]];
          return;
        }

        // Process each parameter
        urlParams.forEach((value, key) => {
          // Split multiple values separated by ';;'
          const values = value.split(";;");
          const normalizedKey = key.replace(/^amp;/i, "");
          const keyLower = normalizedKey.toLowerCase();

          switch (keyLower) {
            case "subject":
              this.processSubjects(values);
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

            case "pmidai":
              this.preselectedPmidai = values;
              break;

            case "openfilters": {
              const normalized = value.trim().toLowerCase();
              this.openFiltersFromUrl = normalized === "true" || normalized === "1";
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

        // Ensure subjects is not empty
        if (this.subjects.length === 0) {
          this.subjects = [[]];
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
       * Processes the 'subject' parameters from the URL and populates the subjects array.
       *
       * @param {string[]} values - An array of subject values extracted from the URL.
       */
      processSubjects(values) {
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

          // Find the subject in subjectOptions
          this.subjectOptions.forEach((subjectOption) => {
            subjectOption.groups.forEach((group) => {
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
          this.subjects.push(selected);
        }
      },
      /**
       * Processes filter parameters from the URL and updates the filterData object.
       *
       * @param {string} key - The filter group ID extracted from the URL parameter key.
       * @param {string[]} values - An array of filter values extracted from the URL.
       */
      processFilter(key, values) {
        const normalizedKey = key.toUpperCase();
        // Find the filter group
        const filterGroup = this.filterOptions.find((filter) => filter.id === normalizedKey);
        if (!filterGroup) return;

        if (!this.filters.includes(filterGroup)) {
          this.filters.push({ ...filterGroup });
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
            if (!this.filterData[groupId]) this.filterData[groupId] = [];
            this.filterData[groupId].push(tag);
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

          if (!this.filterData[groupId]) this.filterData[groupId] = [];
          this.filterData[groupId].push(tmp);
        });
      },
      /**
       * Processes 'limit' URL parameters (new format) and populates filterDropdowns.
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
          for (const filterGroup of this.filterOptions) {
            const choice = filterGroup.choices
              ? filterGroup.choices.find((c) => c.id === normalizedId)
              : null;
            if (choice) {
              selected.push({ ...choice, scope: scopeIds[scope] || "normal" });
              break;
            }
          }
        });

        if (selected.length > 0) {
          // Ensure filterDropdowns has at least one empty array
          if (this.filterDropdowns.length === 1 && this.filterDropdowns[0].length === 0) {
            this.filterDropdowns[0] = selected;
          } else {
            this.filterDropdowns.push(selected);
          }
        }
      },
      /**
       * Returns the filter category ID for a given filter item.
       *
       * @param {Object} item - The filter item.
       * @returns {string} The category ID (e.g., "L010").
       */
      getFilterCategoryId(item) {
        if (!item.id) return "__custom__";
        for (const option of this.filterOptions) {
          if (option.choices && option.choices.some((c) => c.id === item.id)) {
            return option.id;
          }
        }
        // Fallback: first 4 characters of the ID
        return item.id.substring(0, 4);
      },
      /**
       * Syncs filterData (category-grouped object) from filterDropdowns (array of arrays).
       * Merges all items from all dropdowns by their filter category.
       * Also updates the 'filters' array to match.
       */
      syncFilterDataFromDropdowns() {
        const newFilterData = {};
        const filterSet = new Set();

        this.filterDropdowns.forEach((dropdownItems) => {
          dropdownItems.forEach((item) => {
            const categoryId = this.getFilterCategoryId(item);
            if (!newFilterData[categoryId]) newFilterData[categoryId] = [];
            newFilterData[categoryId].push(item);
            filterSet.add(categoryId);
          });
        });

        this.filterData = newFilterData;

        // Update filters array to match active categories
        this.filters = [...filterSet]
          .map((id) => this.filterOptions.find((f) => f.id === id))
          .filter(Boolean);
      },
      /**
       * Handles selection changes in a filter dropdown.
       *
       * @param {Array} value - The updated selections array.
       * @param {number} index - The index of the filter dropdown.
       */
      updateFilterDropdown(value, index) {
        value.forEach((item) => {
          if (!item.scope) item.scope = "normal";
        });

        const updated = cloneDeep(this.filterDropdowns);
        updated[index] = value;
        this.filterDropdowns = updated;

        // Remove extra empty dropdowns — keep at most one empty
        this.removeExtraEmptyDropdowns("filterDropdowns");

        this.syncFilterDataFromDropdowns();
        this.setUrl();
        this.editForm();
      },
      /**
       * Removes extra empty dropdowns, keeping at most one empty.
       * Works for both subjects and filterDropdowns.
       *
       * @param {string} prop - "subjects" or "filterDropdowns"
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
      addFilterDropdown() {
        const hasEmpty = this.filterDropdowns.some((d) => d.length === 0);
        if (hasEmpty) {
          alert(this.getString("fillEmptyDropdownFirstAlert"));
          return;
        }
        this.filterDropdowns = [...this.filterDropdowns, []];

        this.$nextTick(() => {
          const filterSelection = this.$refs.advancedSearchFilters?.$refs.filterSelection;
          if (!filterSelection) return;
          const lastDropdown = this.getLastDropdownRef(filterSelection.$refs.filterDropdown);
          this.tryActivateDropdown(lastDropdown, { focusInput: true });

          // Retry with small delay if first attempt failed
          setTimeout(() => {
            const lastDropdown = this.getLastDropdownRef(filterSelection.$refs.filterDropdown);
            this.tryActivateDropdown(lastDropdown, { onlyWhenClosed: true });
          }, 100);
        });
      },
      /**
       * Removes a filter dropdown at the given index.
       *
       * @param {number} index - The index of the dropdown to remove.
       */
      removeFilterDropdown(index) {
        const wasEmpty = this.filterDropdowns[index] && this.filterDropdowns[index].length === 0;
        const updated = [...this.filterDropdowns];
        updated.splice(index, 1);
        if (updated.length === 0) updated.push([]);
        this.filterDropdowns = updated;

        this.syncFilterDataFromDropdowns();
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
      updateFilterDropdownScope(item, state, index) {
        const updated = cloneDeep(this.filterDropdowns);

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

        this.filterDropdowns = updated;
        this.syncFilterDataFromDropdowns();
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
       * Includes parameters for subjects, filters, advanced mode, sorting,
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

        // If there are no subjects selected, return the base URL without parameters

        if (!this.hasSubjects && !this.openFiltersFromUrl && !this.openFilters) {
          return apiBaseStr ? `${baseUrl}?${apiBaseStr}` : baseUrl;
        }

        // Build query parameters
        const subjectsStr = this.constructSubjectsQuery();
        const filterStr = this.constructFiltersQuery();
        const advancedStr = `&advanced=${this.advanced}`;
        const sorter = `&sort=${encodeURIComponent(this.sort.method)}`;
        const collapsedStr = `&collapsed=${this.isCollapsed}`;
        const pageSizeStr = `&pagesize=${this.pageSize}`;
        const pmidaiStr = `&pmidai=${(this.preselectedPmidai ?? []).join(";;")}`;
        const scrolltoStr = this.scrollToID
          ? `&scrollto=${encodeURIComponent(this.scrollToID)}`
          : "";
        const openFiltersStr = this.openFiltersFromUrl ? `&openfilters=true` : "";
        const hideLimitsStr =
          this.urlHideLimits.length > 0 ? `&hidelimits=${this.urlHideLimits.join(";;")}` : "";
        const checkLimitsStr =
          this.urlCheckLimits.length > 0 ? `&checklimits=${this.urlCheckLimits.join(";;")}` : "";
        const orderLimitsStr =
          this.urlOrderLimits.length > 0 ? `&orderlimits=${this.urlOrderLimits.join(";;")}` : "";

        // Assemble the full URL with all query parameters
        const urlLink = `${baseUrl}?${apiBaseStr}${apiBaseStr ? "&" : ""}${subjectsStr}${filterStr}${advancedStr}${pmidaiStr}${sorter}${collapsedStr}${pageSizeStr}${scrolltoStr}${openFiltersStr}${hideLimitsStr}${checkLimitsStr}${orderLimitsStr}`;

        return urlLink.replace("?&", "?").replace(/&&+/g, "&");
      },
      /**
       * Constructs the query string for subjects based on selected subjects.
       *
       * @returns {string} The encoded subjects query string.
       */
      constructSubjectsQuery() {
        if (!this.subjects || this.subjects.length === 0) {
          return "";
        }

        const subjectQueries = this.subjects
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

            return `subject=${subjectValues.join(";;")}`;
          });

        return subjectQueries.join("&");
      },
      /**
       * Constructs the query string for filters based on selected filters.
       *
       * @returns {string} The encoded filters query string.
       */
      constructFiltersQuery() {
        if (!this.advanced) {
          // Simple mode: encode from filterData (category-grouped)
          if (!this.filterData || Object.keys(this.filterData).length === 0) {
            return "";
          }
          const filterQueries = Object.entries(this.filterData)
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

        // Advanced mode: encode from filterDropdowns (array of arrays)
        if (!this.filterDropdowns || !this.filterDropdowns.some((d) => d.length > 0)) {
          return "";
        }

        const limitQueries = this.filterDropdowns
          .filter((group) => group.length > 0)
          .map((group) => {
            const filterValues = group.map((item) => {
              const scope = this.getScopeKey(this.advanced ? item.scope : "normal");
              const valueId =
                item.isCustom ||
                (typeof item.id === "string" && item.id.startsWith("__custom__:"))
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
        this.showFilter = !this.showFilter || this.filters.length > 0 || !this.advanced;

        // Open dropdown with a delay
        setTimeout(() => {
          if (this.advanced && this.$refs.advancedSearchFilters) {
            const filterSelection = this.$refs.advancedSearchFilters?.$refs?.filterSelection;
            if (filterSelection) {
              const dropdowns = filterSelection.$refs.filterDropdown;
              const firstDropdown = Array.isArray(dropdowns) ? dropdowns[0] : dropdowns;
              this.tryActivateDropdown(firstDropdown, { focusInput: true, shouldActivate: false });
            }
          }
        }, 50);
      },
      /**
       * Adds a new subject to the subjects array and updates the UI accordingly by rendering another dropdown wrapper.
       *
       * This function performs the following steps:
       * 1. Checks if there is any empty subject in the subjects array.
       *    - If an empty subject is found, it alerts the user to fill the empty dropdown first and exits the function.
       * 2. Updates the placeholders for the subjects.
       * 3. Adds a new empty subject to the subjects array.
       * 4. Sets a timeout to focus on the search input of the newly added subject dropdown.
       */
      addSubject() {
        const hasEmptySubject = this.subjects.some((entry) => entry.length === 0);
        if (hasEmptySubject) {
          const message = this.getString("fillEmptyDropdownFirstAlert");
          alert(message);
          return;
        }

        this.updatePlaceholders();
        this.subjects = [...this.subjects, []];

        this.$nextTick(() => {
          const subjectDropdownRef = this.$refs?.subjectSelection?.$refs?.subjectDropdown;
          const lastDropdown = this.getLastDropdownRef(subjectDropdownRef);
          this.tryActivateDropdown(lastDropdown, { focusInput: true });

          // Update placeholders after DOM update
          this.updatePlaceholders();
          
          // Try again with a small delay if first attempt failed
          setTimeout(() => {
            const subjectDropdownRef = this.$refs?.subjectSelection?.$refs?.subjectDropdown;
            const lastDropdown = this.getLastDropdownRef(subjectDropdownRef);
            this.tryActivateDropdown(lastDropdown, { onlyWhenClosed: true });
          }, 100);
        });
      },
      /**
       * Removes a subject from the subjects array and updates the UI accordingly.
       *
       * @param {number} id - The index of the subject to remove.
       */
      removeSubject(id) {
        const isEmptySubject = this.subjects[id] && this.subjects[id].length === 0;

        this.subjects.splice(id, 1);
        this.setUrl();

        if (!isEmptySubject) {
          this.editForm();
        }
      },
      /**
       * Updates the subjects array and manages related state.
       *
       * @param {Array<Object>} value - The list of subject items to update.
       * @param {number} index - The index of the subjects array to update.
       */
      updateSubjects(value, index) {
        value.forEach((item, i) => {
          if (i > 0) this.isFirstFill = false;
          if (!item.scope) item.scope = "normal";
        });

        if (this.subjects.length > 1) this.isFirstFill = false;

        const updatedSubjects = cloneDeep(this.subjects);
        updatedSubjects[index] = value;
        this.subjects = updatedSubjects;

        // Remove extra empty dropdowns — keep at most one empty
        this.removeExtraEmptyDropdowns("subjects");

        if (!this.advanced && this.isFirstFill) {
          this.selectStandardSimple();
          this.isFirstFill = false;
        }

        if (!this.hasSubjects) {
          this.filters = [];
          this.filterData = {};
          this.filterDropdowns = [[]];
          this.showFilter = false;
          this.subjects = [[]];
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
       * @param {number} index - The index of the subjects array where the item resides.
       */
      updateSubjectScope(item, state, index) {
        const updatedSubjects = cloneDeep(this.subjects);

        if (Array.isArray(updatedSubjects) && updatedSubjects[index]) {
          const subject = updatedSubjects[index].find(
            (sub) => this.optionIdentity(sub) === this.optionIdentity(item)
          );
          if (subject) {
            if (subject.scope === state) {
              // Find the subject in the subjects array and remove it
              const subjectIndex = updatedSubjects[index].findIndex(
                (sub) => this.optionIdentity(sub) === this.optionIdentity(item)
              );
              updatedSubjects[index].splice(subjectIndex, 1);
            }
            subject.scope = state;
          }
          this.subjects = updatedSubjects;
          this.setUrl();
          this.editForm();
        } else {
          console.warn();
          `updateSubjectScope: subjects[${index}] is undefined or not an array. No subjects are chosen.`;
        }
      },
      /**
       * Updates the filters array and initializes filter data.
       *
       * @param {Array<Object>} value - The list of filter items to update.
       */
      updateFilters(value) {
        this.filters = cloneDeep(value);

        this.filterData = this.filters.reduce((acc, filter) => {
          acc[filter.id] = this.filterData[filter.id] || [];
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

        const updatedFilterData = cloneDeep(this.filterData);
        updatedFilterData[index] = value;
        this.filterData = updatedFilterData;

        this.setUrl();
        this.editForm();
      },
      /**
       * Updates the filter data when a user selects or deselects a simple filter option.
       * Manages the filterData and filters arrays based on the user's interaction.
       * Also updates the URL and form accordingly.
       *
       * @param {string} filterType - The ID of the filter group being updated.
       * @param {Object} selectedValue - The filter option that was selected or deselected.
       * @param {string} selectedValue.name - Valgfrit custom navn for filtervalg.
       * @param {boolean} selectedValue.checked - The current checked state of the filter option.
       */
      updateFilterSimple(filterType, selectedValue) {
        if (!filterType || !selectedValue) {
          console.warn("updateFilterSimple: Missing filterType or selectedValue");
          return;
        }

        // Set the scope of the selected value
        selectedValue.scope = "normal";

        // Clone the current filter data
        const tempFilterData = { ...this.filterData };

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

          // Add the filter to this.filters if not already present
          const filterExists = this.filters.some((filter) => filter.id === filterType);
          if (!filterExists) {
            const filterOption = this.filterOptions.find((option) => option.id === filterType);
            if (filterOption) {
              this.filters.push({ ...filterOption });
            } else {
              console.warn(`updateFilterSimple: Filter option with id "${filterType}" not found.`);
            }
          }
        } else {
          if (!exists) return; // Nothing to remove
          // Remove the selected value from the filter data
          tempFilterData[filterType] = tempFilterData[filterType].filter(
            (item) => this.optionIdentity(item) !== this.optionIdentity(selectedValue)
          );
          // If the filter type array is empty, remove it and the filter from this.filters
          if (tempFilterData[filterType].length === 0) {
            delete tempFilterData[filterType];
            this.filters = this.filters.filter((filter) => filter.id !== filterType);
          }
        }

        // Update the filter data
        this.filterData = tempFilterData;

        // Update the URL and the form
        this.setUrl();
        this.editForm();
      },
      updateFilterSimpleOnEnter(selectedValue) {
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
        const filtersToSelect = [];
        const useCheckLimits =
          Array.isArray(this.effectiveCheckLimits) && this.effectiveCheckLimits.length > 0;
        const hiddenGroupIds = new Set(this.effectiveHideLimits);
        for (let i = 0; i < this.filterOptions.length; i++) {
          const option = this.filterOptions[i];
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
              filtersToSelect.push({
                option: option,
                value: filterValue,
              });
            }
          }
        }

        const tempFilters = cloneDeep(this.filterData);
        // Update selected filters here.
        for (let i = 0; i < filtersToSelect.length; i++) {
          const filterToSelect = filtersToSelect[i];
          const filterType = filterToSelect.option.id;
          const filtervalue = filterToSelect.value;
          // If no array exists, create array with value.
          if (!tempFilters[filterType]) {
            tempFilters[filterType] = [filtervalue];
            this.filters.push(filterToSelect.option);
          } else if (!tempFilters[filterType].some((item) => item.id === filtervalue.id)) {
            // Else add value to existing array of filter values.
            tempFilters[filterType].push(filtervalue);
          }
        }
        this.filterData = tempFilters;
      },
      ensureCheckLimitsSelected() {
        if (this.advanced) return;
        if (!this.effectiveCheckLimits || this.effectiveCheckLimits.length === 0) return;

        const selectedIds = new Set();
        Object.values(this.filterData).forEach((values) => {
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
        const sel = cloneDeep(this.filterData);

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
              // Find the filter in the filterData array and remove it
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
        this.filterData = sel;
        this.setUrl();
        this.editForm();
      },

      /**
       * Removes a filter item from filterData based on the provided filterItemId.
       *
       * @param {String} filterItemId - The ID of the filter item to remove.
       */
      removeFilterItem(filterItemId) {
        // Create a shallow copy of filterData to avoid direct mutations
        const updatedFilterData = { ...this.filterData };

        // Iterate through each key in filterData
        Object.keys(updatedFilterData).forEach((key) => {
          // Filter out the item with the matching filterItemId
          if (key === filterItemId)
            // remove the key-value pair
            delete updatedFilterData[key];
        });

        // Update the filterData with the filtered results
        this.filterData = updatedFilterData;

        // Create a shallow copy of filters to avoid direct mutations
        const updatedFilters = [...this.filters];

        // Iterate through each index of updatedFilters
        updatedFilters.forEach((filter, index) => {
          // Filter out the item with the matching filterItemId
          if (filter.id === filterItemId)
            // remove the item at the index
            updatedFilters.splice(index, 1);
        });

        // Update the filters with the filtered results
        this.filters = updatedFilters;

        // Update the URL and form based on the new filterData
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
        this.subjects = [[]];
        this.filters = [];
        this.filterData = {};
        this.filterDropdowns = [[]];
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
          (this.openFiltersFromUrl || this.openFilters || this.effectiveCheckLimits.length > 0)
        ) {
          this.selectStandardSimple();
          this.isFirstFill = false;
        }

        // Reset expanded groups in dropdown. Only need to do first as the other dropdowns are deleted
        const subjectDropdown = this.$refs?.subjectSelection?.$refs?.subjectDropdown;
        if (subjectDropdown && subjectDropdown[0]) {
          subjectDropdown[0].clearShownItems();
        }
        this.setUrl();
        
        // Focus on the first input field after reset
        this.$nextTick(() => {
          const subjectDropdown = this.$refs?.subjectSelection?.$refs?.subjectDropdown;
          if (subjectDropdown && subjectDropdown[0] && subjectDropdown[0].setSilentFocusFromParent) {
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
        this.sort =
          newVal && typeof newVal === "object" ? { ...newVal } : newVal;
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
      updateSubjectDropdownWidth() {
        const dropdown = this.$refs?.subjectSelection?.$refs?.subjectDropdown[0]?.$refs?.selectWrapper;
        
        if (!dropdown) return;
        this.subjectDropdownWidth = dropdown.offsetWidth;

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
        const width = this.subjectDropdownWidth;
        const isMobileOrSmall = isMobileViewport() || (width < 520 && width >= 0);
        
        // Use the same mobile logic for both simple and advanced modes
        if (isMobileOrSmall) {
          return this.getString(hasTopics ? "subjectadvancedplaceholder_mobile" : "subjectadvancedplaceholder_mobile_notopics");
        } else {
          if (this.advanced) {
            return this.getString(hasTopics ? "subjectadvancedplaceholder" : "subjectadvancedplaceholder_notopics");
          } else {
            return this.getString(hasTopics ? "subjectsimpleplaceholder" : "subjectsimpleplaceholder_notopics");
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
      getFilterPlaceholder(index) {
        return this.filterDropdownPlaceholders[index] || this.getDefaultFilterPlaceholder();
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
      updateFilterPlaceholder(isTranslating, index, stepKey) {
        if (isTranslating) {
          this.clearFilterPlaceholderDotInterval();
          const baseText =
            stepKey && messages[stepKey]
              ? this.getString(stepKey)
              : this.getString("translatingPlaceholder");
          this.filterDropdownPlaceholders[index] = baseText;
          this.filterPlaceholderDotIndex = index;
          this.filterPlaceholderDotBaseText = baseText;
          let dotCount = 0;
          this.filterPlaceholderDotIntervalId = setInterval(() => {
            if (this.filterPlaceholderDotIndex === null) return;
            dotCount = (dotCount % 5) + 1;
            this.filterDropdownPlaceholders[this.filterPlaceholderDotIndex] =
              this.filterPlaceholderDotBaseText + ".".repeat(dotCount);
          }, 400);
        } else {
          this.clearFilterPlaceholderDotInterval();
          this.filterDropdownPlaceholders[index] = this.getDefaultFilterPlaceholder();
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
          if (subjectSelectionRef && subjectSelectionRef.$refs.subjectDropdown) {
            const subjectDropdowns = subjectSelectionRef.$refs.subjectDropdown;
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

