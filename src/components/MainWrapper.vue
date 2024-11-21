<template>
  <div>
    <div :id="getComponentId">
      <div class="qpm_searchform">
        <advanced-search-toggle
          :advanced="advanced"
          :is-collapsed="isCollapsed"
          :get-string="getString"
          :$help-text-delay="$helpTextDelay"
          @toggle-advanced="advancedClick"
        />

        <div class="qpm_top">
          <search-form-toggle
            :is-collapsed="isCollapsed"
            :subjects="subjects"
            :get-string="getString"
            :$help-text-delay="$helpTextDelay"
            @toggle-collapsed="toggleCollapsedController"
          />

          <ai-translation-toggle
            v-model="searchWithAI"
            :is-collapsed="isCollapsed"
            :app-settings="appSettings"
            :get-string="getString"
            :$help-text-delay="$helpTextDelay"
          />

          <div v-show="!isCollapsed" class="qpm_searchFormula">
            <!-- The dropdown for selecting subjects to be included in the search -->
            <div
              v-for="(item, n) in subjects"
              :key="`item-${item.id}-${n}`"
              class="qpm_subjects"
            >
              <div class="qpm_flex">
                <dropdown-wrapper
                  ref="subjectDropdown"
                  :is-multiple="true"
                  :data="subjectOptions"
                  :hide-topics="hideTopics"
                  :is-group="true"
                  :placeholder="dropdownPlaceholders[n]"
                  :operator="calcOrOperator"
                  :taggable="true"
                  :selected="item"
                  :close-on-input="false"
                  :language="language"
                  :search-with-a-i="searchWithAI"
                  :show-scope-label="advanced"
                  :no-result-string="getString('noTopicDropdownContent')"
                  :index="n"
                  @input="updateSubjects"
                  @updateScope="updateScope"
                  @mounted="shouldFocusNextDropdownOnMount"
                  @translating="updatePlaceholder"
                />
                <i
                  v-if="subjects.length > 1"
                  class="qpm_removeSubject bx bx-x"
                  @click="removeSubject(n)"
                />
              </div>
              <p
                v-if="n >= 0 && hasSubjects"
                class="qpm_subjectOperator"
                :style="{
                  color: n < subjects.length - 1 ? '#000000' : 'darkgrey',
                }"
              >
                {{ getString("andOperator") }}
              </p>
            </div>
            <div
              v-if="hasSubjects"
              style="margin: 5px 0 20px 0"
              @keydown.enter.capture.passive="focusNextDropdownOnMount = true"
            >
              <!-- Button for adding subject -->
              <button
                v-tooltip="{
                  content: getString('hoverAddSubject'),
                  offset: 5,
                  delay: $helpTextDelay,
                }"
                class="qpm_slim multiselect__input"
                style="
                  width: 120px;
                  padding: 4px 12px 4px 11px !important;
                  height: 38px;
                "
                @click="addSubject"
              >
                {{ getString("addsubjectlimit") }} {{ getString("addsubject") }}
              </button>
            </div>
            <div
              v-if="advanced && !showFilter && hasSubjects"
              style="margin-bottom: 15px"
            >
              <!-- Button for adding limit -->
              <button
                v-tooltip="{
                  content: getString('hoverLimitButton'),
                  offset: 5,
                  delay: $helpTextDelay,
                }"
                class="qpm_slim multiselect__input"
                style="padding: 4px 12px 4px 11px !important; height: 38px"
                type="button"
                :class="{ qpm_shown: showFilter }"
                @click="toggle"
              >
                {{ getString("addsubjectlimit") }} {{ getString("addlimit") }}
              </button>
            </div>

            <!-- The dropdown for selecting limits to be included in the advanced search -->
            <div
              v-if="advanced && showFilter && hasSubjects"
              style="margin-bottom: 10px"
            >
              <h4 role="heading" aria-level="3" class="h4">
                {{ getString("AdvancedFiltersHeader") }}
              </h4>
              <div id="qpm_topofsearchbar" class="qpm_flex">
                <dropdown-wrapper
                  ref="filterDropdown"
                  :class="{ qpm_shown: !showFilter }"
                  :is-multiple="true"
                  :data="filterOptions"
                  :hide-topics="hideTopics"
                  :is-group="false"
                  :placeholder="showTitle"
                  :operator="calcAndOperator"
                  :close-on-input="false"
                  :language="language"
                  :taggable="false"
                  :selected="filters"
                  :search-with-a-i="searchWithAI"
                  :show-scope-label="advanced"
                  :no-result-string="getString('noLimitDropdownContent')"
                  :index="0"
                  qpm-button-color2="qpm_buttonColor7"
                  @input="updateFilters"
                />
              </div>
              <div class="qpm_flex">
                <div
                  class="qpm_filters"
                  :class="{ qpm_shown: filters.length === 0 }"
                >
                  <filter-entry
                    v-for="(selected, id) in filterData"
                    :key="id"
                    :language="language"
                    :filter-item="getFilters(id)"
                    :idx="id"
                    :hide-topics="hideTopics"
                    :selected="selected"
                    @input="updateFilterAdvanced"
                    @updateScope="updateScopeFilter"
                  />
                </div>
              </div>
            </div>

            <!-- The radio buttons for limits to be included in the simple search -->
            <div v-else-if="!advanced && hasSubjects">
              <h4 role="heading" aria-level="3" class="h4">
                {{ getString("SimpleFiltersHeader") }}
              </h4>
              <div id="qpm_topofsearchbar" class="qpm_simpleFiltersContainer">
                <template v-for="option in filteredChoices">
                  <template v-if="hasVisibleSimpleFilterOption(option.choices)">
                    <b :key="option.choice" class="qpm_simpleFiltersHeader">
                      {{ customNameLabel(option) }}:
                    </b>
                    <div
                      v-for="(choice, index) in option.choices"
                      :id="'qpm_topic_' + choice.name"
                      :key="`choice-${choice.id}-${index}`"
                      class="qpm_simpleFilters"
                    >
                      <input
                        :id="choice.name"
                        type="checkbox"
                        title="titleCheckBoxTranslate"
                        :value="choice.name"
                        :checked="
                          isFilterUsed(filterData[option.id], choice.name)
                        "
                        style="cursor: pointer"
                        @change="updateFilterSimple(option.id, choice)"
                        @keyup.enter="updateFilterSimpleOnEnter(choice)"
                      />
                      <label :for="choice.name">
                        {{ customNameLabel(choice) }}
                      </label>
                      <button
                        v-if="getSimpleTooltip(choice)"
                        v-tooltip="{
                          content: getSimpleTooltip(choice),
                          offset: 5,
                          delay: $helpTextDelay,
                          hideOnTargetClick: false,
                        }"
                        class="bx bx-info-circle"
                        style="cursor: help"
                      />
                    </div>
                    <div :key="option.choice" class="qpm_simpleFiltersSpacer" />
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div id="qpm_topofsearch" class="qpm_flex">
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
          <action-buttons
            :search-loading="searchLoading"
            :get-string="getString"
            :$help-text-delay="$helpTextDelay"
            @clear="clear"
            @copyUrl="copyUrl"
            @searchsetLowStart="searchsetLowStart"
          />
        </div>
      </div>
      <search-result
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
  import DropdownWrapper from "@/components/DropdownWrapper.vue";
  import ActionButtons from "@/components/ActionButtons.vue";
  import AiTranslationToggle from "@/components/AiTranslationToggle.vue";
  import SearchFormToggle from "@/components/SearchFormToggle.vue";
  import AdvancedSearchToggle from "@/components/AdvancedSearchToggle.vue";
  import FilterEntry from "@/components/FilterEntry.vue";
  import WordedSearchString from "@/components/WordedSearchString.vue";
  import SearchResult from "@/components/SearchResult.vue";
  import axios from "axios";
  import {
    order,
    filtrer,
    scopeIds,
    customInputTagTooltip,
  } from "@/assets/content/qpm-content.js";
  import { topics } from "@/assets/content/qpm-content-diabetes";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { appSettingsMixin } from "@/mixins/appSettings";

  export default {
    name: "MainWrapper",
    components: {
      DropdownWrapper,
      ActionButtons,
      AiTranslationToggle,
      SearchFormToggle,
      AdvancedSearchToggle,
      FilterEntry,
      WordedSearchString,
      SearchResult,
    },
    mixins: [appSettingsMixin],
    props: {
      hideTopics: {
        type: Array,
        default: function () {
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
    data: function () {
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
        loadedId: "",
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
        simpleFilterOptions: [],
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
      showTitle: function () {
        if (this.filters.length < this.filterOptions.length) {
          return this.getString("choselimits");
        }
        return "";
      },
      hasSubjects() {
        return this.subjects.some((subjectArray) => subjectArray.length > 0);
      },
      getSearchString: function () {
        let str = "";
        for (let i = 0; i < this.subjects.length; i++) {
          let hasOperators = false;
          let subjectsToIterate = this.subjects[i].length;
          for (let j = 0; j < subjectsToIterate; j++) {
            let scope = this.subjects[i][j].scope;
            let tmp = this.subjects[i][j].searchStrings[scope][0];
            if (
              tmp.indexOf("AND") >= 0 ||
              tmp.indexOf("NOT") >= 0 ||
              tmp.indexOf("OR") >= 0
            ) {
              hasOperators = true;
              break;
            }
          }
          let substring = "";
          if (i > 0 && str != "") substring += " AND ";
          if (
            (hasOperators &&
              (this.subjects.length > 1 || this.filters.length > 0)) ||
            subjectsToIterate > 1
          )
            substring += "(";
          for (let j = 0; j < subjectsToIterate; j++) {
            let scope = this.subjects[i][j].scope;
            if (j > 0) substring += " OR ";
            let tmp = this.subjects[i][j].searchStrings[scope][0];
            if (
              (tmp.indexOf("AND") >= 0 ||
                tmp.indexOf("NOT") >= 0 ||
                tmp.indexOf("OR") >= 0) &&
              subjectsToIterate > 1
            )
              substring += "(";
            substring += this.subjects[i][j].searchStrings[scope].join(" OR ");
            if (
              (tmp.indexOf("AND") >= 0 ||
                tmp.indexOf("NOT") >= 0 ||
                tmp.indexOf("OR") >= 0) &&
              subjectsToIterate > 1
            )
              substring += ")";
          }
          if (
            (hasOperators &&
              (this.subjects.length > 1 || this.filters.length > 0)) ||
            subjectsToIterate > 1
          )
            substring += ")";

          if (
            substring != "()" &&
            substring != " AND ()" &&
            substring != " AND "
          ) {
            str += substring;
          }
        }

        const self = this;
        Object.keys(self.filterData).forEach(function (key) {
          let substring = "";
          let value = self.filterData[key];
          let hasOperators = false;
          for (let i = 0; i < value.length; i++) {
            let scope = value[i].scope;

            if (
              value[i].searchStrings[scope][0].indexOf("AND") >= 0 ||
              value[i].searchStrings[scope][0].indexOf("NOT") >= 0 ||
              value[i].searchStrings[scope][0].indexOf("OR") >= 0
            ) {
              hasOperators = true;
              break;
            }
          }
          substring += " AND ";
          if (hasOperators || value.length > 1) substring += "(";
          for (let i = 0; i < value.length; i++) {
            const val = value[i];
            if (i > 0) substring += " OR ";
            let scope = val.scope;
            if (
              (value[i].searchStrings[scope][0].indexOf("AND") >= 0 ||
                value[i].searchStrings[scope][0].indexOf("NOT") >= 0 ||
                value[i].searchStrings[scope][0].indexOf("OR") >= 0) &&
              value.length > 1
            )
              substring += "(";
            substring += val.searchStrings[scope].join(" OR ");
            if (
              (value[i].searchStrings[scope][0].indexOf("AND") >= 0 ||
                value[i].searchStrings[scope][0].indexOf("NOT") >= 0 ||
                value[i].searchStrings[scope][0].indexOf("OR") >= 0) &&
              value.length > 1
            )
              substring += ")";
          }
          if (hasOperators || value.length > 1) substring += ")";

          if (
            substring != "()" &&
            substring != " AND ()" &&
            substring != " AND "
          ) {
            str += substring;
          }
        });
        return str;
      },
      getPageSize: function () {
        return this.pageSize;
      },
      getLow: function () {
        return this.pageSize * this.page;
      },
      getHigh: function () {
        return Math.min(this.pageSize * this.page + this.pageSize, this.count);
      },
      alwaysShowFilter: function () {
        return this.$alwaysShowFilter;
      },
      //20210216: Ole kan ikke få dette til at virke - har i stedet tilføjet ekstra div i linje 1707 (good fucking luck finding that line lol)
      searchHeaderShown: function () {
        if (this.isCollapsed) return this.getString("searchHeaderHidden");
        return this.getString("searchHeaderShown");
      },
      calcOrOperator: function () {
        return this.getString("orOperator");
      },
      calcAndOperator: function () {
        return this.getString("andOperator");
      },
      getComponentId: function () {
        return "MainWrapper_" + this.componentNo.toString();
      },
    },
    watch: {
      subjectDropdown: {
        handler() {
          this.updatePlaceholders();
        },
        deep: true,
        immediate: true,
      },
      advanced(newVal) {
        console.log(`advanced search | ${newVal}`);
        // Trigger an update for all the DropdownWrapper placeholders
        this.$refs.subjectDropdown.forEach((dropdown, index) => {
          dropdown.placeholder = this.getDropdownPlaceholder(index);
        });
      },
    },
    beforeMount: function () {
      window.removeEventListener("resize", this.updateSubjectDropdownWidth);
    },
    mounted: async function () {
      this.updatePlaceholders();
      //Spørg Adam
      this.advanced = !this.advanced;
      this.advancedClick(true);
      this.parseUrl();
      this.isUrlParsed = true;
      this.updateSubjectDropdownWidth();
      window.addEventListener("resize", this.updateSubjectDropdownWidth);
      this.advanced = !this.advanced;
      this.advancedClick();
      this.searchPreselectedPmidai();
      await this.search();
    },
    created: function () {
      this.updatePlaceholder();
    },
    methods: {
      advancedClick(skip = false) {
        // Toggle the 'advanced' mode
        this.advanced = !this.advanced;

        // Reset options
        this.subjectOptions = [];
        this.filterOptions = [];

        // Reset filters if necessary
        if (!this.alwaysShowFilter) {
          this.filterData = {};
          this.filters = [];
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
      },
      prepareFilterOptions() {
        const filterCopy = JSON.parse(JSON.stringify(filtrer));
        filterCopy.forEach((filterItem) => {
          if (!this.advanced) {
            filterItem.choices.forEach((choice) => {
              choice.buttons = false;
              if (
                (!this.isUrlParsed ||
                  choice.simpleSearch ||
                  choice.standardSimple) &&
                !this.filterOptions.includes(filterItem)
              ) {
                this.filterOptions.push(filterItem);
              }
            });
          } else {
            this.filterOptions.push(filterItem);
          }
        });
      },
      prepareSubjectOptions() {
        const subjectCopy = JSON.parse(JSON.stringify(topics));
        subjectCopy.forEach((subjectItem) => {
          if (!this.advanced) {
            subjectItem.groups.forEach((group) => {
              group.buttons = false;
            });
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
            (option) => option.name === filter.name
          );
          if (matchingFilter) {
            const shouldIncludeFilter =
              this.isUrlParsed && !this.advanced
                ? filter.choices.some(
                    (choice) =>
                      (choice.simpleSearch || choice.standardSimple) &&
                      this.filterData[filter.id]
                  )
                : this.filterData[filter.id];
            if (
              shouldIncludeFilter &&
              !updatedFilters.includes(matchingFilter)
            ) {
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
            const name = id.slice(2, -2);
            const isTranslated = !isNaN(parseInt(name.slice(-1), 10));
            const tag = {
              name: name,
              searchStrings: { normal: [name] },
              preString: isTranslated
                ? `${this.getString("manualInputTermTranslated")}: `
                : `${this.getString("manualInputTerm")}: `,
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
        const filterGroup = this.filterOptions.find(
          (filter) => filter.id === key
        );
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
            const name = id.slice(2, -2);
            const isTranslated = !isNaN(parseInt(name.slice(-1), 10));
            const tag = {
              name: name,
              searchStrings: { normal: [name] },
              preString: isTranslated
                ? `${this.getString("manualInputTermTranslated")}: `
                : `${this.getString("manualInputTerm")}: `,
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

          if (this.isUrlParsed && !this.advanced && !choice.simpleSearch)
            return;

          const tmp = { ...choice, scope: scopeIds[scope] };

          if (!this.filterData[groupId]) this.filterData[groupId] = [];
          this.filterData[groupId].push(tmp);
        });
      },
      setUrl: function () {
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
          window.location.origin && window.location.origin !== "null"
            ? window.location.origin
            : "";

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
        const pmidaiStr = `&pmidai=${(this.preselectedPmidai ?? []).join(
          ";;"
        )}`;
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
              const scope = this.getScopeKey(
                this.advanced ? subject.scope : "normal"
              );
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
       * @param {string} scopeValue - The scope value (e.g., 'normal', 'broad').
       * @returns {string} The scope key used in the URL.
       */
      getScopeKey(scopeValue) {
        return (
          Object.keys(scopeIds).find((key) => scopeIds[key] === scopeValue) ||
          "normal"
        );
      },
      copyUrl: function () {
        let urlLink = this.getUrl(true);

        //Copy link to clipboard
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = urlLink;
        dummy.select();
        dummy.setSelectionRange(0, 99999);
        document.execCommand("copy");
        document.body.removeChild(dummy);
      },
      toggle: function () {
        this.showFilter =
          !this.showFilter || this.filters.length > 0 || !this.advanced;
        //Open dropdown. Needs delay
        const self = this;
        setTimeout(function () {
          if (self.advanced)
            self.$refs.filterDropdown.$refs.multiselect.$refs.search.focus();
        }, 50);
      },
      /**
       * Adds a new subject to the subjects array and updates the UI accordingly.
       *
       * This function performs the following steps:
       * 1. Checks if there is any empty subject in the subjects array.
       *    - If an empty subject is found, it alerts the user to fill the empty dropdown first and exits the function.
       * 2. Updates the placeholders for the subjects.
       * 3. Adds a new empty subject to the subjects array.
       * 4. Sets a timeout to focus on the search input of the newly added subject dropdown.
       */
      addSubject: function () {
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
          const subjectDropdown = this.$refs.subjectDropdown;
          subjectDropdown[
            subjectDropdown.length - 1
          ].$refs.multiselect.$refs.search.focus();

          // Update placeholders after DOM update
          this.updatePlaceholders();
        });
      },
      removeSubject: function (id) {
        var isEmptySubject =
          this.subjects[id] && this.subjects[id].length === 0;

        this.subjects.splice(id, 1);
        this.setUrl();

        if (!isEmptySubject) {
          this.editForm();
        }
      },
      updateSubjects: function (value, index) {
        for (let i = 0; i < value.length; i++) {
          if (i > 0) this.isFirstFill = false;
          if (!value[i].scope) value[i].scope = "normal";
        }
        if (this.subjects.length > 1) this.isFirstFill = false;
        let sel = JSON.parse(JSON.stringify(this.subjects));
        sel[index] = value;
        this.subjects = sel;

        //Fills out standard filters, if they are necessary
        if (!this.advanced && this.isFirstFill) this.selectStandardSimple();
        this.isFirstFill = false;

        //Check if empty, then clear and hide filters if so
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
      updateScope: function (item, state, index) {
        let sel = JSON.parse(JSON.stringify(this.subjects));
        for (let i = 0; i < sel[index].length; i++) {
          if (sel[index][i].name == item.name) {
            sel[index][i].scope = state;
            break;
          }
        }
        this.subjects = sel;
        this.setUrl();
        this.editForm();
      },
      updateFilters: function (value) {
        this.filters = JSON.parse(JSON.stringify(value));
        //Update selected filters
        let newOb = {};
        for (let i = 0; i < this.filters.length; i++) {
          const item = this.filters[i].id;
          if (this.filterData[item]) {
            newOb[item] = this.filterData[item];
          } else {
            newOb[item] = [];
          }
        }
        this.filterData = newOb;
        this.setUrl();
        this.editForm();
      },
      updateFilterAdvanced: function (value, index) {
        for (let i = 0; i < value.length; i++) {
          if (!value[i].scope) value[i].scope = "normal";
        }
        let temp = JSON.parse(JSON.stringify(this.filterData));
        temp[index] = value;
        this.filterData = temp;
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
          console.warn(
            "updateFilterSimple: Missing filterType or selectedValue"
          );
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
          (item) => item.name === selectedValue.name
        );

        // Determine if the option is checked or not
        const isChecked = selectedValue.checked; // Ensure 'checked' is a property

        if (isChecked) {
          if (exists) return; // Already added
          tempFilterData[filterType].push(selectedValue);

          // Add the filter to this.filters if not already present
          const filterExists = this.filters.some(
            (filter) => filter.id === filterType
          );
          if (!filterExists) {
            const filterOption = this.filterOptions.find(
              (option) => option.id === filterType
            );
            if (filterOption) {
              this.filters.push({ ...filterOption });
            } else {
              console.warn(
                `updateFilterSimple: Filter option with id "${filterType}" not found.`
              );
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
            this.filters = this.filters.filter(
              (filter) => filter.id !== filterType
            );
          }
        }

        // Update the filter data
        this.filterData = tempFilterData;

        // Update the URL and the form
        this.setUrl();
        this.editForm();
      },
      updateFilterSimpleOnEnter: function (selectedValue) {
        var checkboxId = selectedValue.name.replaceAll(" ", "\\ "); // Handle ids with whitespace
        var checkbox = this.$el.querySelector("#" + checkboxId);
        checkbox.click();
      },
      /**
       * This methods can only be called once.
       * It prefills some of the filter options in simple search.
       */
      selectStandardSimple: function () {
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
      updateScopeFilter: function (item, state, index) {
        let sel = JSON.parse(JSON.stringify(this.filterData));
        for (let i = 0; i < sel[index].length; i++) {
          if (sel[index][i].name == item.name) {
            sel[index][i].scope = state;
            break;
          }
        }
        this.filterData = sel;
        this.setUrl();
        this.editForm();
      },
      getFilters: function (name) {
        for (let i = 0; i < this.filters.length; i++) {
          if (this.filters[i].id == name) {
            return this.filters[i];
          }
        }
        return {};
      },
      isFilterUsed: function (option, name) {
        if (!option) return false;
        for (let i = 0; i < option.length; i++) {
          if (option[i].name === name) return true;
        }
        return false;
      },
      clear: function () {
        for (var i = 0; i < 2; i++) {
          this.reloadScripts();
          this.subjects = [[]];
          this.filters = [];
          this.filterData = {};
          this.searchresult = undefined;
          this.count = 0;
          this.page = 0;
          this.showFilter = false;
          this.details = true;
          //hack to force all elements back to normal
          this.advanced = true;
          this.advancedClick();
          this.advancedString = false;
          this.isFirstFill = true;
          this.sort = order[0];

          //Reset expanded groups in dropdown. Only need to do first as the other dropdowns are deleted
          this.$refs.subjectDropdown[0].clearShownItems();
          this.setUrl();
        }
      },
      editForm: function () {
        this.searchresult = undefined;
        this.count = 0;
        this.page = 0;
        return true;
      },
      scrollToTop: function () {
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
      searchsetLowStart: function () {
        this.count = 0;
        this.page = 0;
        this.search();
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

          const idList =
            esearchResponse.data.esearchresult.idlist.filter(Boolean);

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
          this.searchPreselectedPmidai();
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
      searchMore: async function () {
        // Calculate the target number of results based on the next page
        const targetResultLength = Math.min(
          (this.page + 1) * this.pageSize,
          this.count
        );

        // If current results already meet or exceed the target, no need to fetch more
        if (
          this.searchresult &&
          this.searchresult.length >= targetResultLength
        ) {
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
            retmax: Math.min(
              this.pageSize,
              targetResultLength - (this.searchresult.length || 0)
            ),
            retstart: Math.max(
              this.searchresult.length || 0,
              this.page * this.pageSize
            ),
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
          this.searchresult = [...(this.searchresult || []), ...data];

          // Handle any preselected PMIDs (if applicable)
          this.searchPreselectedPmidai();

          // Reset the loading state
          this.searchLoading = false;

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
      searchByIds: async function (ids) {
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
      searchPreselectedPmidai: function () {
        let self = this;
        this.searchByIds(this.preselectedPmidai)
          .then(function (entries) {
            self.preselectedEntries = entries;
          })
          .catch(function (err) {
            console.error(err);
          });
      },
      /**
       * Displays a generic search error message to the user.
       *
       * @function
       * @param {Error} err - The error object representing the cause of the search failure.
       */
      showSearchError: function (err) {
        let message = this.getString("searchErrorGeneric");
        let option = { cause: err };
        this.searchError = Error(message, option);
      },
      nextPage: function () {
        this.page++;
        this.setUrl();
        this.searchMore();
      },
      previousPage: function () {
        this.page--;
        this.setUrl();
        this.search();
      },
      toggleDetailsBox: function () {
        // added by Ole
        this.details = !this.details; // added by Ole
      }, // added by Ole
      toggleAdvancedString: function () {
        this.advancedString = !this.advancedString;
      },
      newSortMethod: function (newVal) {
        this.sort = newVal;
        this.page = 0;
        this.setUrl();
        this.count = 0;
        this.search();
      },
      toggleCollapsedSearch: function () {
        let coll = document.getElementsByClassName(
          "qpm_toggleSearchFormBtn bx bx-hide"
        )[0];
        if (this.isCollapsed == true) {
          coll.classList.add("bx-show");
        } else {
          coll.classList.remove("bx-show");
        }
      },
      toggleCollapsedController: function () {
        this.isCollapsed = !this.isCollapsed;
        this.toggleCollapsedSearch();
        this.setUrl();
      },
      getString: function (string) {
        let constant = messages[string][this.language];
        return constant != undefined ? constant : messages[string]["dk"];
      },
      customNameLabel: function (option) {
        let constant = "";
        if (!option.name && !option.groupname) return;
        if (option.translations) {
          let lg = this.language;
          constant =
            option.translations[lg] != undefined
              ? option.translations[lg]
              : option.translations["dk"];
        } else {
          constant = option.name;
        }

        return constant;
      },
      customGroupLabel: function (option) {
        let constant = "";
        if (!option.groupName) return;
        try {
          if (option.translations) {
            constant = option.translations[this.language];
          } else {
            constant = option.name;
          }
          return constant;
        } catch (e) {
          console.log(option, e);
          return option.translations["dk"];
        }
      },
      setPageSize: function (pageSize) {
        this.pageSize = pageSize;
        this.page = 0;
        this.setUrl();
        this.searchMore();
      },
      updateSubjectDropdownWidth: function () {
        let dropdown = this.$refs.subjectDropdown[0].$refs.selectWrapper;
        if (!dropdown.innerHTML) return;
        this.subjectDropdownWidth = parseInt(dropdown.offsetWidth);
      },
      checkIfMobile: function () {
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
      shouldFocusNextDropdownOnMount: function (source) {
        if (!this.focusNextDropdownOnMount) return;
        this.focusNextDropdownOnMount = false;
        source.$refs.multiselect.activate();
      },
      hasVisibleSimpleFilterOption: function (filters) {
        if (!filters) return false;

        var hasVisibleFilter = filters.some(function (e) {
          return e.simpleSearch;
        });
        return hasVisibleFilter;
      },
      getSimpleTooltip: function (choice) {
        if (!choice.tooltip_simple) return null;
        return choice.tooltip_simple[this.language];
      },
      updatePreselectedPmidai: function (newValue) {
        this.preselectedPmidai = (newValue ?? []).map(function (e) {
          return e.uid;
        });
        this.setUrl();
      },
      // passing along the index seemingly makes vue understand that
      // the dropdownwrappers can have seperate placeholders so keep it even though it is unused
      getDropdownPlaceholder: function (index, translating = false) {
        if (translating) {
          return this.getString("translatingPlaceholder");
        }
        if (this.advanced) {
          let width = this.subjectDropdownWidth;
          if (this.checkIfMobile() || (width < 520 && width != 0)) {
            return this.getString("subjectadvancedplaceholder_mobile");
          } else {
            return this.getString("subjectadvancedplaceholder");
          }
        } else {
          return this.getString("subjectsimpleplaceholder");
        }
      },
      updatePlaceholder(isTranslating, index) {
        if (isTranslating) {
          this.$set(
            this.dropdownPlaceholders,
            index,
            this.getDropdownPlaceholder(index, true)
          );
        } else {
          this.$set(
            this.dropdownPlaceholders,
            index,
            this.getDropdownPlaceholder(index)
          );
        }
      },
      updatePlaceholders() {
        if (
          this.$refs.subjectDropdown &&
          this.$refs.subjectDropdown.length > 0
        ) {
          this.$refs.subjectDropdown.forEach((_, index) => {
            this.updatePlaceholder(false, index);
          });
        }
      },
    },
  };
</script>
