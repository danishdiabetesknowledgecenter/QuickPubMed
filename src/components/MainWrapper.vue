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
            style="padding-bottom: 10px;"
            >
          </div>

          <div v-show="!isCollapsed" class="qpm_searchFormula">
            <!-- The dropdown for selecting subjects to be included in the search -->
            <subject-selection
              ref="subjectSelection"
              :subjects="subjects"
              :hide-topics="hideTopics"
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

            <!-- The dropdown for selecting filters to be included in the advanced search -->
            <advanced-search-filters
              v-if="advanced && hasSubjects"
              ref="advancedSearchFilters"
              :advanced="advanced"
              :show-filter="showFilter"
              :filter-options="filterOptions"
              :hide-topics="hideTopics"
              :show-title="showTitle"
              :language="language"
              :search-with-a-i="searchWithAI"
              :get-string="getString"
              :filter-data="filterData"
              :filters="filters"
              @update-advanced-filter="updateFilters"
              @update-advanced-filter-entry="updateFilterAdvanced"
              @update-advanced-filter-scope="updateAdvancedFilterScope"
              @remove-filter-item="removeFilterItem"
            />

            <!-- The radio buttons for filters to be included in the simple search -->
            <simple-search-filters
              v-if="!advanced && hasSubjects"
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

  import { order } from "@/assets/content/qpm-content-order.js";
  import { filtrer } from "@/assets/content/qpm-content-filters.js";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { topicLoaderMixin } from "@/mixins/topicLoaderMixin.js";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { scopeIds, customInputTagTooltip } from "@/utils/qpm-content-helpers.js";

  export default {
    name: "MainWrapper",
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
      };
    },
    computed: {
      filteredChoices() {
        return this.filterOptions.map((option) => ({
          ...option,
          choices: option.choices.filter((choice) => choice.simpleSearch),
        }));
      },
      hasAvailableTopics() {
        if (!this.subjectOptions || this.subjectOptions.length === 0) {
          return false;
        }
        
        // Simuler samme logik som DropdownWrapper's shownSubjects
        const shouldHideItem = (item) => {
          if (this.hideTopics.includes(item.id)) {
            return true;
          }
          if (item.maintopicIdLevel1 && this.hideTopics.includes(item.maintopicIdLevel1)) {
            return true;
          }
          if (item.maintopicIdLevel2 && this.hideTopics.includes(item.maintopicIdLevel2)) {
            return true;
          }
          return false;
        };

        const availableTopics = this.subjectOptions
          .map(section => {
            if (shouldHideItem(section)) {
              return null;
            }

            const sectionCopy = JSON.parse(JSON.stringify(section));
            
            if (sectionCopy.groups) {
              sectionCopy.groups = sectionCopy.groups.filter(group => {
                return !shouldHideItem(group);
              });
            }
            
            return sectionCopy;
          })
          .filter(section => section !== null)
          .filter(section => {
            if (section.groups) {
              return section.groups.length > 0;
            }
            return true;
          });

        return availableTopics.length > 0 && availableTopics.some(section => 
          section.groups && section.groups.length > 0
        );
      },
      showTitle() {
        if (this.filters.length < this.filterOptions.length) {
          return this.getString("choselimits");
        }
        return "";
      },
      hasSubjects() {
        return this.subjects.some((subjectArray) => subjectArray.length > 0);
      },
      getSearchString() {
        const hasLogicalOperators = (searchStrings) =>
          ["AND", "OR", "NOT"].some((op) => searchStrings.includes(op));

        const buildSubstring = (items, connector = " OR ") => {
          return items
            .filter((item) => 
              item.searchStrings && 
              item.scope && 
              item.searchStrings[item.scope] && 
              item.searchStrings[item.scope].length > 0
            )
            .map((item) => {
              const { scope, searchStrings } = item;
              const combined = searchStrings[scope].join(connector);
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

          substring += buildSubstring(subjectGroup);

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

          substring += buildSubstring(filterGroup);

          if (hasOperators || filterGroup.length > 1) substring += ")";

          if (substring !== " AND ()" && substring !== " AND ") {
            substrings.push(substring);
          }
        });

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
        return "MainWrapper_" + this.componentNo.toString();
      },
    },
    watch: {
      // Fjernet fejlagtig watch handler for subjectSelection
    },
    beforeDestroy() {
      // Cleanup focus-visible event listeners
      if (this._focusVisibleCleanup) {
        this._focusVisibleCleanup();
      }
      // Tilføj proper cleanup for resize listener
      window.removeEventListener("resize", this.updateSubjectDropdownWidth);
    },
    async mounted() {
      this.advanced = !this.advanced;
      this.advancedClick(true);
      this.parseUrl();
      this.isUrlParsed = true;

      this.updatePlaceholders();
      this.updateSubjectDropdownWidth();
      window.addEventListener("resize", this.updateSubjectDropdownWidth);

      this.prepareFilterOptions();
      this.prepareSubjectOptions();
      
      this.advanced = !this.advanced;
      this.advancedClick();
      await this.search();
      await this.searchPreselectedPmidai();
      
      // Silent focus på det første input-felt når formularen er indlæst
      this.$nextTick(() => {
        this.$nextTick(() => {
          const firstSubjectDropdown = this.$refs.subjectSelection?.$refs.subjectDropdown?.[0];
          if (firstSubjectDropdown && firstSubjectDropdown.setSilentFocusFromParent) {
            firstSubjectDropdown.setSilentFocusFromParent();
          }
        });
      });
      
      // Initialize focus-visible behavior
      this.$nextTick(() => {
        this.initializeFocusVisible();
      });
    },
    created() {
      // If hideTopics comes as string, convert it to array
      if (typeof this.hideTopics === 'string') {
        try {
          this.hideTopics = JSON.parse(this.hideTopics.replace(/'/g, '"'));
        } catch (e) {
          this.hideTopics = [];
        }
      }
    },
    methods: {
      /**
       * Initialize focus-visible behavior to only show focus outline for keyboard navigation
       */
      initializeFocusVisible() {
        // Find the main wrapper element (where Vue is mounted)
        let appElement = document.getElementById('main-wrapper');
        console.log('initializeFocusVisible: Looking for main-wrapper element:', appElement);
        
        if (!appElement) {
          // Fallback: try to find the Vue app root element
          appElement = this.$el?.parentElement || document.body;
          console.log('initializeFocusVisible: Using fallback element:', appElement);
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
        
        console.log('initializeFocusVisible: Added classes. Element classes:', appElement.className);
        
        // Switch to keyboard mode on any key press (especially Tab)
        const handleKeyDown = (event) => {
          // Include Tab key specifically for navigation
          if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'].includes(event.key)) {
            appElement.classList.add('qpm_keyboard-mode');
            appElement.classList.remove('qpm_mouse-mode');
            console.log('Switched to keyboard mode:', event.key, 'Classes:', appElement.className);
          }
        };
        
        // Switch to mouse mode on any mouse click or mouse movement with buttons
        const handleMouseDown = () => {
          appElement.classList.add('qpm_mouse-mode');
          appElement.classList.remove('qpm_keyboard-mode');
          console.log('Switched to mouse mode. Classes:', appElement.className);
        };
        
        // Also switch to mouse mode on mouse movement (when user moves mouse after using keyboard)
        const handleMouseMove = (event) => {
          // Only switch on actual mouse movement, not programmatic events
          if (event.isTrusted && (event.movementX !== 0 || event.movementY !== 0)) {
            appElement.classList.add('qpm_mouse-mode');
            appElement.classList.remove('qpm_keyboard-mode');
          }
        };
        
        // Add event listeners
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        
        // Store cleanup function for potential future use
        this._focusVisibleCleanup = () => {
          document.removeEventListener('keydown', handleKeyDown, true);
          document.removeEventListener('mousedown', handleMouseDown, true);
          document.removeEventListener('mousemove', handleMouseMove);
        };
      },
      advancedClick(skip = false) {
        // Toggle the 'advanced' mode
        this.advanced = !this.advanced;

        // Reset options with proper cleanup
        this.subjectOptions.splice(0);
        this.filterOptions.splice(0);

        // Reset filters if necessary
        if (!this.alwaysShowFilter) {
          this.filterData = {};
          this.filters.splice(0);
        }

        // Prepare options
        this.prepareFilterOptions();
        this.prepareSubjectOptions();

        // Reset subject scopes in non-advanced mode
        if (!this.advanced) {
          this.resetSubjectScopes();
        }

        // Update filters
        this.updateFiltersBasedOnSelection();

        // Clean filter data
        this.cleanFilterData();

        // Reset filters if 'filterData' is empty in advanced mode
        if (this.advanced && Object.keys(this.filterData).length === 0) {
          this.filters = [];
        }

        // Update URL
        if (!skip) this.setUrl();

        // Set 'showFilter' flag
        this.showFilter = this.advanced && this.filters.length > 0;
        
        this.$nextTick(() => {
          this.updateSubjectDropdownWidth();
          this.updatePlaceholders();
        });
      },
      prepareFilterOptions() {
        const filterCopy = JSON.parse(JSON.stringify(filtrer));
        filterCopy.forEach((filterItem) => {
          // Skip if filterItem is null or undefined
          if (!filterItem) return;
          
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
            this.filterOptions.push(filterItem);
          }
        });
      },
      prepareSubjectOptions() {
        const subjectCopy = JSON.parse(JSON.stringify(this.topics));
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
          const matchingFilter = this.filterOptions.find((option) => option.name === filter.name);
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

        // Parse the current URL
        const urlParams = new URLSearchParams(window.location.search);

        // Check if there are query parameters
        if (![...urlParams.keys()].length) {
          this.subjects = [[]];
          return;
        }

        // Process each parameter
        urlParams.forEach((value, key) => {
          // Split multiple values separated by ';;'
          const values = value.split(";;");

          switch (key) {
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
              this.toggleCollapsedSearch();
              break;

            case "scrollto":
              this.scrollToID = `#${value}`;
              break;

            case "pageSize":
              this.pageSize = parseInt(value, 10);
              break;

            case "pmidai":
              this.preselectedPmidai = values;
              break;

            default:
              this.processFilter(key, values);
              break;
          }
        });

        // Ensure subjects is not empty
        if (this.subjects.length === 0) {
          this.subjects = [[]];
        }
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

          // Find the subject in subjectOptions
          this.subjectOptions.forEach((subjectOption) => {
            subjectOption.groups.forEach((group) => {
              if (group.id === id) {
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
        // Find the filter group
        const filterGroup = this.filterOptions.find((filter) => filter.id === key);
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
          const choice = filterGroup.choices.find((item) => item.id === id);
          if (!choice) {
            console.warn(`parseUrl: Choice with id "${id}" not found.`);
            return;
          }

          if (this.isUrlParsed && !this.advanced && !choice.simpleSearch) return;

          const tmp = { ...choice, scope: scopeIds[scope] };

          if (!this.filterData[groupId]) this.filterData[groupId] = [];
          this.filterData[groupId].push(tmp);
        });
      },
      setUrl() {
        if (history.replaceState) {
          let urlLink = this.getUrl();
          this.stateHistory.push(this.oldState);
          window.history.replaceState(this.stateHistory, urlLink, urlLink);
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

        // If there are no subjects selected, return the base URL without parameters

        if (!this.hasSubjects) {
          return baseUrl;
        }

        // Build query parameters
        const subjectsStr = this.constructSubjectsQuery();
        const filterStr = this.constructFiltersQuery();
        const advancedStr = `&advanced=${this.advanced}`;
        const sorter = `&sort=${encodeURIComponent(this.sort.method)}`;
        const collapsedStr = `&collapsed=${this.isCollapsed}`;
        const pageSizeStr = `&pageSize=${this.pageSize}`;
        const pmidaiStr = `&pmidai=${(this.preselectedPmidai ?? []).join(";;")}`;
        const scrolltoStr = this.scrollToID
          ? `&scrollto=${encodeURIComponent(this.scrollToID)}`
          : "";

        // Assemble the full URL with all query parameters
        const urlLink = `${baseUrl}?${subjectsStr}${filterStr}${advancedStr}${pmidaiStr}${sorter}${collapsedStr}${pageSizeStr}${scrolltoStr}`;

        return urlLink;
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

              if (subject.id) {
                subjectId = `${subject.id}#${scope}`;
              } else if (subject.isCustom) {
                const translationFlag = subject.isTranslated ? "1" : "0";
                subjectId = `{{${subject.name}${translationFlag}}}#${scope}`;
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
        if (!this.advanced && !this.$alwaysShowFilter) {
          return "";
        }

        if (!this.filterData || Object.keys(this.filterData).length === 0) {
          return "";
        }

        const filterQueries = Object.entries(this.filterData)
          .filter(([, values]) => values.length > 0)
          .map(([key, values]) => {
            const filterValues = values.map((value) => {
              const scope = this.getScopeKey(value.scope);
              const valueId = value.isCustom ? `{{${value.name}}}` : value.id;
              const filterId = `${valueId}#${scope}`;
              return encodeURIComponent(filterId);
            });

            return `&${encodeURIComponent(key)}=${filterValues.join(";;")}`;
          });

        return filterQueries.join("");
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
          if (this.advanced) {
            this.$refs.advancedSearchFilters.$refs.filterDropdown.$refs.multiselect.$refs.search.focus();
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
        var hasEmptySubject = this.subjects.some(function (e) {
          return e.length === 0;
        });
        if (hasEmptySubject) {
          var message = this.getString("fillEmptyDropdownFirstAlert");
          alert(message);
          return;
        }

        this.updatePlaceholders();
        this.subjects = [...this.subjects, []];

        this.$nextTick(function () {
          const subjectDropdown = this.$refs.subjectSelection.$refs.subjectDropdown;
          const lastDropdown = subjectDropdown[subjectDropdown.length - 1];
          
          if (lastDropdown && lastDropdown.$refs && lastDropdown.$refs.multiselect) {
            // Focus on the input and open the dropdown
            const input = lastDropdown.$refs.multiselect.$refs.search;
            if (input) {
              input.focus();
              // Open the dropdown if it has topics
              if (!lastDropdown.shouldHideDropdownArrow) {
                lastDropdown.$refs.multiselect.activate();
              }
            }
          }

          // Update placeholders after DOM update
          this.updatePlaceholders();
          
          // Try again with a small delay if first attempt failed
          setTimeout(() => {
            const subjectDropdown = this.$refs.subjectSelection.$refs.subjectDropdown;
            const lastDropdown = subjectDropdown[subjectDropdown.length - 1];
            
            if (lastDropdown && lastDropdown.$refs && lastDropdown.$refs.multiselect) {
              const input = lastDropdown.$refs.multiselect.$refs.search;
              if (input && !lastDropdown.shouldHideDropdownArrow && !lastDropdown.$refs.multiselect.isOpen) {
                lastDropdown.$refs.multiselect.activate();
              }
            }
          }, 100);
        });
      },
      /**
       * Removes a subject from the subjects array and updates the UI accordingly.
       *
       * @param {number} id - The index of the subject to remove.
       */
      removeSubject(id) {
        var isEmptySubject = this.subjects[id] && this.subjects[id].length === 0;

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

        const updatedSubjects = JSON.parse(JSON.stringify(this.subjects));
        updatedSubjects[index] = value;
        this.subjects = updatedSubjects;

        if (!this.advanced && this.isFirstFill) {
          this.selectStandardSimple();
          this.isFirstFill = false;
        }

        if (!this.hasSubjects) {
          this.filters = [];
          this.filterData = {};
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
        const updatedSubjects = JSON.parse(JSON.stringify(this.subjects));

        if (Array.isArray(updatedSubjects) && updatedSubjects[index]) {
          const subject = updatedSubjects[index].find((sub) => sub.name === item.name);
          if (subject) {
            if (subject.scope === state) {
              // Find the subject in the subjects array and remove it
              const subjectIndex = updatedSubjects[index].findIndex(
                (sub) => sub.name === item.name
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
        this.filters = JSON.parse(JSON.stringify(value));

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

        const updatedFilterData = JSON.parse(JSON.stringify(this.filterData));
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
       * @param {string} selectedValue.name - The name of the selected filter option.
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
        const exists = tempFilterData[filterType].some((item) => item.name === selectedValue.name);

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
            (item) => item.name !== selectedValue.name
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
        var checkboxId = selectedValue.name.replaceAll(" ", "\\ "); // Handle ids with whitespace
        var checkbox = this.$el.querySelector("#" + checkboxId);
        checkbox.click();
      },
      /**
       * This methods can only be called once.
       * It prefills some of the filter options in simple search.
       */
      selectStandardSimple() {
        const self = this;
        const filtersToSelect = [];
        for (let i = 0; i < self.filterOptions.length; i++) {
          const option = self.filterOptions[i];
          for (let j = 0; j < option.choices.length; j++) {
            const choice = option.choices[j];
            if (choice.standardSimple) {
              const filterValue = Object.assign({ scope: "normal" }, choice);
              filtersToSelect.push({
                option: option,
                value: filterValue,
              });
            }
          }
        }

        const tempFilters = JSON.parse(JSON.stringify(this.filterData));
        // Update selected filters here.
        for (let i = 0; i < filtersToSelect.length; i++) {
          const filterToSelect = filtersToSelect[i];
          const filterType = filterToSelect.option.id;
          const filtervalue = filterToSelect.value;
          // If no array exists, create array with value.
          if (!tempFilters[filterType]) {
            tempFilters[filterType] = [filtervalue];
            this.filters.push(filterToSelect.option);
          } else if (!tempFilters[filterType].includes(filtervalue)) {
            // Else add value to existing array of filter values.
            tempFilters[filterType].push(filtervalue);
          }
        }
        this.filterData = tempFilters;
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
        const sel = JSON.parse(JSON.stringify(this.filterData));

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
              const filterIndex = sel[index].findIndex((sub) => sub.name === item.name);
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
        this.searchresult = undefined;
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

        // Reset expanded groups in dropdown. Only need to do first as the other dropdowns are deleted
        const subjectDropdown = this.$refs.subjectSelection.$refs.subjectDropdown;
        if (subjectDropdown && subjectDropdown[0]) {
          subjectDropdown[0].clearShownItems();
        }
        this.setUrl();
        
        // Focus on the first input field after reset
        this.$nextTick(() => {
          const subjectDropdown = this.$refs.subjectSelection.$refs.subjectDropdown;
          if (subjectDropdown && subjectDropdown[0] && subjectDropdown[0].setSilentFocusFromParent) {
            subjectDropdown[0].setSilentFocusFromParent();
          }
        });
      },
      editForm() {
        this.searchresult = undefined;
        this.count = 0;
        this.page = 0;
        return true;
      },
      scrollToTop() {
        document
          .getElementById(this.scrollToID)
          .scrollIntoView({ block: "start", behavior: "smooth" });
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

        if (!query || query === "()") {
          this.searchLoading = false;
          return;
        }

        this.reloadScripts();

        try {
          // ESearch request to get list of IDs
          const esearchParams = new URLSearchParams({
            db: "pubmed",
            tool: "QuickPubMed",
            email: nlm.email,
            api_key: nlm.key,
            retmode: "json",
            retmax: this.pageSize,
            retstart: this.page * this.pageSize,
            sort: this.sort.method,
            term: query,
          });

          const esearchResponse = await axios.post(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            esearchParams
          );

          const idList = esearchResponse.data.esearchresult.idlist.filter(Boolean);

          if (idList.length === 0) {
            this.count = 0;
            this.searchresult = [];
            this.searchLoading = false;
            return;
          }

          // ESummary request to get details for each ID
          const esummaryParams = new URLSearchParams({
            db: "pubmed",
            tool: "QuickPubMed",
            email: nlm.email,
            api_key: nlm.key,
            retmode: "json",
            id: idList.join(","),
          });

          const esummaryResponse = await axios.post(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
            esummaryParams
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
            const searchButton = this.$el.querySelector(".qpm_search");
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

        // Validate the query string
        if (!query || query === "()") {
          this.searchLoading = false;
          return;
        }

        // Reload necessary scripts to ensure a clean environment
        this.reloadScripts();

        try {
          // Prepare parameters for the ESearch API request
          const esearchParams = new URLSearchParams({
            db: "pubmed",
            tool: "QuickPubMed",
            email: nlm.email,
            api_key: nlm.key,
            retmode: "json",
            retmax: Math.min(this.pageSize, targetResultLength - (this.searchresult.length || 0)),
            retstart: Math.max(this.searchresult.length || 0, this.page * this.pageSize),
            sort: this.sort.method,
            term: query,
          });

          // Perform the ESearch API request to retrieve PubMed IDs
          const esearchResponse = await axios.post(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            esearchParams
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

          // Prepare parameters for the ESummary API request
          const esummaryParams = new URLSearchParams({
            db: "pubmed",
            tool: "QuickPubMed",
            email: nlm.email,
            api_key: nlm.key,
            retmode: "json",
            id: idList.join(","),
          });

          // Perform the ESummary API request to retrieve detailed information
          const esummaryResponse = await axios.post(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
            esummaryParams
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
          const currentResultEntries = this.$refs.searchResultList.$refs.resultEntries;

          const resultEntryIndexToFocus = targetResultLength - this.pageSize;

          const firstNewResultEntry = currentResultEntries[resultEntryIndexToFocus];
          firstNewResultEntry?.$el?.focus();

          // Note: Removed scrolling and focus updates to maintain current scroll position
        } catch (error) {
          // Handle and log any errors that occur during the API requests
          console.error(error);
          this.showSearchError(error);
          this.searchLoading = false;
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
        ids = ids.filter((id) => id && id.trim() != "");
        if (ids.length == 0) {
          return [];
        }
        let nlm = this.appSettings.nlm;
        let baseUrl =
          "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&tool=QuickPubMed&email=" +
          nlm.email +
          "&api_key=" +
          nlm.key +
          "&retmode=json&id=";

        return axios.get(baseUrl + ids.join(",")).then(function (resp) {
          //Create list of returned data
          let data = [];
          let obj = resp.data.result;
          if (!obj) {
            throw Error("Search failed", resp);
          }
          for (let i = 0; i < obj.uids.length; i++) {
            data.push(obj[obj.uids[i]]);
          }
          return data;
        });
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
        let message = this.getString("searchErrorGeneric");
        let option = { cause: err };
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
        this.sort = newVal;
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
      toggleCollapsedSearch() {
        const coll = document.getElementsByClassName("qpm_toggleSearchFormBtn bx bx-hide")[0];

        if (!coll) {
          console.warn("Element with class 'qpm_toggleSearchFormBtn bx bx-hide' not found.");
          return;
        }

        if (this.isCollapsed) {
          coll.classList.add("bx-show");
        } else {
          coll.classList.remove("bx-show");
        }
      },
      toggleCollapsedController() {
        this.isCollapsed = !this.isCollapsed;
        this.toggleCollapsedSearch();
        this.setUrl();
      },
      getString(string) {
        let constant = messages[string][this.language];
        return constant != undefined ? constant : messages[string]["dk"];
      },
      /**
       * Returns the custom name label for the given option.
       *
       * @param {Object} option - The option object containing name and translations.
       * @returns {string} The custom name label.
       */
      getCustomNameLabel(option) {
        if (!option.name && !option.groupname) return "";

        const constant =
          option.translations?.[this.language] ?? option.translations?.["dk"] ?? option.name;

        return constant;
      },
      updateSubjectDropdownWidth() {
        const dropdown = this.$refs?.subjectSelection?.$refs?.subjectDropdown[0]?.$refs?.selectWrapper;
        
        if (!dropdown) return;
        this.subjectDropdownWidth = parseInt(dropdown.offsetWidth);

        // Opdater placeholders automatisk ved resize
        this.updatePlaceholders();
      },
      checkIfMobile() {
        let check = false;
        (function (a) {
          if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
              a
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
              a.substr(0, 4)
            )
          )
            check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
      },
      shouldFocusNextDropdownOnMount(source) {
        if (!this.focusNextDropdownOnMount) return;
        this.focusNextDropdownOnMount = false;
        source.$refs.multiselect.activate();
      },
      getSimpleTooltip(choice) {
        if (!choice.tooltip_simple) return null;
        return choice.tooltip_simple[this.language];
      },
      async updatePreselectedPmidai(newValue) {
        this.preselectedPmidai = (newValue ?? []).map(function (e) {
          return e.uid;
        });

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
        const isMobileOrSmall = this.checkIfMobile() || (width < 520 && width >= 0);
        
        // Brug samme mobile logic for både simple og advanced
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
      updatePlaceholder(isTranslating, index) {
        if (isTranslating) {
          this.$set(this.dropdownPlaceholders, index, this.getDropdownPlaceholder(index, true));
        } else {
          this.$set(this.dropdownPlaceholders, index, this.getDropdownPlaceholder(index, false));
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
