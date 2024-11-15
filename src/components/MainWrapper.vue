<template>
  <div>
    <div :id="getComponentId">
      <div class="qpm_searchform">
        <div
          v-if="!isCollapsed"
          class="qpm_tabs"
        >
          <p
            v-if="!advanced"
            v-tooltip="{
              content: getString('hoverAdvancedText'),
              offset: 5,
              delay: $helpTextDelay,
            }"
            tabindex="0"
            class="qpm_tab"
            @click="advancedClick()"
            @keyup.enter="advancedClick()"
          >
            {{ getString("advancedSearch") }}
            <span class="qpm_hideonmobile">
              {{ getString("searchMode") }}
            </span>
          </p>

          <p
            v-if="advanced"
            class="qpm_tab qpm_tab_active"
          >
            {{ getString("advancedSearch") }}
            <span class="qpm_hideonmobile">
              {{ getString("searchMode") }}
            </span>
          </p>

          <p
            v-if="advanced"
            v-tooltip="{
              content: getString('hoverBasicText'),
              offset: 5,
              delay: $helpTextDelay,
            }"
            tabindex="0"
            class="qpm_tab"
            @click="advancedClick()"
            @keyup.enter="advancedClick()"
          >
            {{ getString("simpleSearch") }}
            <span class="qpm_hideonmobile">
              {{ getString("searchMode") }}
            </span>
          </p>

          <p
            v-if="!advanced"
            class="qpm_tab qpm_tab_active"
          >
            {{ getString("simpleSearch") }}
            <span class="qpm_hideonmobile">
              {{ getString("searchMode") }}
            </span>
          </p>
        </div>

        <div class="qpm_top">
          <div class="qpm_spaceEvenly qpm_headerText">
            <div
              v-show="!isCollapsed"
              role="heading"
              aria-level="2"
              class="h3"
              style="margin-top: 5px"
            >
              {{ getString("searchHeaderShown") }}
            </div>
            <div
              v-show="isCollapsed"
              role="heading"
              aria-level="2"
              class="h3"
              style="margin-top: 5px"
            >
              {{ getString("searchHeaderHidden") }}
            </div>

            <div
              v-show="subjects !== ''"
              class="qpm_toggleSearchForm"
              @click="toggleCollapsedController()"
            >
              <div
                v-show="!isCollapsed"
                v-tooltip="{
                  content: getString('hideForm'),
                  offset: 5,
                  delay: $helpTextDelay,
                }"
                class="qpm_toggleSearchFormBtn bx bx-hide"
              />
              <div
                v-show="isCollapsed"
                v-tooltip="{
                  content: getString('showForm'),
                  offset: 5,
                  delay: $helpTextDelay,
                }"
                class="qpm_toggleSearchFormBtn bx bx-show"
              />
            </div>
          </div>

          <div
            v-show="!isCollapsed && appSettings.openAi.useAi"
            class="qpm_switch_wrap qpm_ai_hide"
          >
            <label class="qpm_switch">
              <input
                v-model="searchWithAI"
                type="checkbox"
                title="titleSearchWithAI"
              >
              <span class="qpm_slider qpm_round" />
            </label>
            <span
              v-if="searchWithAI"
              class="qpm_simpleFiltersHeader"
            >
              {{ getString("searchToggleWithAI") }}
              <button
                v-tooltip="{
                  content: getString('hoversearchToggleWithAI'),
                  offset: 5,
                  delay: $helpTextDelay,
                  hideOnTargetClick: false,
                }"
                class="bx bx-info-circle"
                style="cursor: help"
              />
            </span>
            <span
              v-else
              class="qpm_simpleFiltersHeader"
            >
              {{ getString("searchToggleWithoutAI") }}
              <button
                v-tooltip="{
                  content: getString('hoversearchToggleWithoutAI'),
                  offset: 5,
                  delay: $helpTextDelay,
                  hideOnTargetClick: false,
                }"
                class="bx bx-info-circle"
                style="cursor: help"
              />
            </span>
          </div>

          <!-- The dropdown for selecting subjects to be included in the search -->
          <div
            v-show="!isCollapsed"
            class="qpm_searchFormula"
          >
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
                v-if="n >= 0 && !noSubjects"
                class="qpm_subjectOperator"
                :style="{
                  color: n < subjects.length - 1 ? '#000000' : 'darkgrey',
                }"
              >
                {{ getString("andOperator") }}
              </p>
            </div>
            <div
              v-if="!noSubjects"
              style="margin: 5px 0 20px 0"
              @keydown.enter.capture.passive="focusNextDropdownOnMount = true"
            >
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
              v-if="advanced && !showFilter && !noSubjects"
              style="margin-bottom: 15px"
            >
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
              v-if="advanced && showFilter && !noSubjects"
              style="margin-bottom: 10px"
            >
              <h4
                role="heading"
                aria-level="3"
                class="h4"
              >
                {{ getString("AdvancedFiltersHeader") }}
              </h4>
              <div
                id="qpm_topofsearchbar"
                class="qpm_flex"
              >
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
                  qpm_buttonColor2="qpm_buttonColor7"
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
            <div v-else-if="!advanced && !noSubjects">
              <h4
                role="heading"
                aria-level="3"
                class="h4"
              >
                {{ getString("SimpleFiltersHeader") }}
              </h4>
              <div
                id="qpm_topofsearchbar"
                class="qpm_simpleFiltersContainer"
              >
                <template v-for="option in filteredChoices">
                  <template v-if="hasVisibleSimpleFilterOption(option.choices)">
                    <b
                      :key="option.choice"
                      class="qpm_simpleFiltersHeader"
                    >
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
                      >
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
                    <div
                      :key="option.choice"
                      class="qpm_simpleFiltersSpacer"
                    />
                  </template>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div
          id="qpm_topofsearch"
          class="qpm_flex"
        >
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

        <div
          v-show="!noSubjects && !isCollapsed"
          class="qpm_flex qpm_bottom"
          style="justify-content: space-between"
        >
          <div style="position: relative">
            <button
              v-tooltip="{
                content: getString('hoverResetButton'),
                offset: 5,
                delay: $helpTextDelay,
              }"
              class="qpm_button"
              @click="clear"
            >
              <i
                class="bx bx-reset"
                style="vertical-align: baseline"
              />
              {{ getString("reset") }}
            </button>

            <button
              v-tooltip="{
                content: getString('hoverShareButton'),
                offset: 5,
                delay: $helpTextDelay,
              }"
              class="qpm_button"
              @click="copyUrl"
            >
              <i
                class="bx bx-link"
                style="margin-right: 5px; vertical-align: baseline"
              />
              {{ getString("getUrl") }}
            </button>
          </div>

          <button
            v-tooltip="{
              content: getString('hoverSearchButton'),
              offset: 5,
              delay: $helpTextDelay,
            }"
            :disabled="searchLoading"
            :class="{ qpm_disabled: searchLoading }"
            class="qpm_button qpm_search"
            @click="searchsetLowStart"
          >
            <i
              class="bx bx-search bx-flip-horizontal"
              style="position: relative; bottom: 1px"
            />
            {{ getString("search") }}
          </button>
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
import FilterEntry from "@/components/FilterEntry.vue";
import WordedSearchString from "@/components/WordedSearchString.vue";
import SearchResult from "@/components/SearchResult.vue";

import {
  order,
  filtrer,
  scopeIds,
  customInputTagTooltip,
} from "@/assets/content/qpm-content.js";
import { topics } from "@/assets/content/qpm-content-diabetes";
import { messages } from "@/assets/content/qpm-translations.js";
import { appSettingsMixin } from "@/mixins/appSettings";
import axios from "axios";

export default {
  name: "MainWrapper",
  components: {
    DropdownWrapper,
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
      return this.filterOptions.map(option => ({
        ...option,
        choices: option.choices.filter(choice => choice.simpleSearch),
      }));
    },
    showTitle: function () {
      if (this.filters.length < this.filterOptions.length) {
        return this.getString("choselimits");
      }
      return "";
    },
    noSubjects() {
      const result = this.subjects.every(subjectArray => subjectArray.length === 0);
      return result;
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
  mounted: function () {
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
    this.search();
  },
  created: function () {
    this.updatePlaceholder();
  },
  beforeMount: function () {
    window.removeEventListener("resize", this.updateSubjectDropdownWidth);
  },
  methods: {
    advancedClick: function (skip) {
      this.advanced = !this.advanced;
      this.subjectOptions = [];
      this.filterOptions = [];
      const self = this;
      if (!this.alwaysShowFilter) {
        this.filterData = {};
        this.filters = [];
      }

      let filterCopy = JSON.parse(JSON.stringify(filtrer));
      for (let i = 0; i < filterCopy.length; i++) {
        if (!this.advanced) {
          for (let j = 0; j < filterCopy[i].choices.length; j++) {
            filterCopy[i].choices[j].buttons = false;
            if (
              (!this.isUrlParsed ||
                filterCopy[i].choices[j].simpleSearch ||
                filterCopy[i].choices[j].standardSimple) &&
              !this.filterOptions.includes(filterCopy[i])
            )
              this.filterOptions.push(filterCopy[i]);
          }
        } else {
          this.filterOptions.push(filterCopy[i]);
        }
      }

      let subjectCopy = JSON.parse(JSON.stringify(topics));
      for (let i = 0; i < subjectCopy.length; i++) {
        if (!this.advanced) {
          for (let j = 0; j < subjectCopy[i].groups.length; j++) {
            subjectCopy[i].groups[j].buttons = false;
          }
        }

        this.subjectOptions.push(subjectCopy[i]);
      }

      //reset selected subjects's scope to normal
      if (!this.advanced) {
        for (let i = 0; i < this.subjects.length; i++) {
          for (let j = 0; j < this.subjects[i].length; j++) {
            this.subjects[i][j].scope = "normal";
          }
        }
      }

      let filters = [];
      for (let i = 0; i < self.filters.length; i++) {
        for (let j = 0; j < self.filterOptions.length; j++) {
          if (self.filterOptions[j].name == self.filters[i].name) {
            if (self.isUrlParsed && !self.advanced) {
              for (let k = 0; k < self.filters[i].choices.length; k++) {
                if (
                  (self.filters[i].choices[k].simpleSearch ||
                    self.filters[i].choices[k].standardSimple) &&
                  self.filterData[self.filters[i].id] &&
                  !filters.includes(self.filterOptions[j])
                ) {
                  filters.push(self.filterOptions[j]);
                }
              }
            } else {
              if (self.filterData[self.filters[i].id])
                filters.push(self.filterOptions[j]);
              break;
            }
          }
        }
      }
      this.filters = filters;
      let filterDataCopy = JSON.parse(JSON.stringify(this.filterData));
      Object.keys(filterDataCopy).forEach(function (key) {
        let value = filterDataCopy[key];
        for (let i = 0; i < value.length; i++) {
          if (!self.advanced) value[i].scope = "normal";
          if (
            self.isUrlParsed &&
            !self.advanced &&
            !value[i].simpleSearch &&
            !value[i].standardSimple
          ) {
            value.splice(i, 1);
          }
        }
        if (value.length == 0) delete filterDataCopy[key];
      });
      this.filterData = filterDataCopy;
      if (this.advanced && this.filterData == {})
        this.filters = JSON.parse(JSON.stringify([]));
      if (!skip) this.setUrl();
      this.showFilter = this.advanced && this.filters;
    },
    parseUrl: function () {
      this.subjects = [];
      let url = window.location.href;
      let parser = document.createElement("a");
      parser.href = url;
      let query = parser.search.substring(1);
      let vars = query.split("&");

      if (!query) {
        this.subjects = [[]];
        return;
      }
      
      for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        let key = decodeURIComponent(pair[0]);
        let value = decodeURIComponent(pair[1]).split(";;");
        if (key == "subject") {
          let selected = [];
          // All values from the URI in 1 subject field
          for (let j = 0; j < value.length; j++) {
            let hashtagIndex = value[j].indexOf("#");
            let id = value[j].substring(0, hashtagIndex);
            let scope = value[j].substring(hashtagIndex + 1, value[j].length);
            let isId = !(id.startsWith("{{") && id.endsWith("}}"));

            if (!isId) {
              var name = id.slice(2, -3);
              var translated = id.slice(-3, -2);
              if (Number(translated)) {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTermTranslated") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              } else {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTerm") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              }
            }

            for (let k = 0; k < this.subjectOptions.length; k++) {
              for (let l = 0; l < this.subjectOptions[k].groups.length; l++) {
                if (this.subjectOptions[k].groups[l].id == id) {
                  let tmp = JSON.parse(
                    JSON.stringify(this.subjectOptions[k].groups[l])
                  );
                  tmp.scope = scopeIds[scope];
                  let lg = this.language;
                  if (tmp.translations[lg].startsWith("-")) {
                    tmp.translations[lg] = tmp.translations[lg].slice(1);
                  }
                  selected.push(tmp);
                  // found = true; Unused variable
                }
              }
            }
          }
          if (selected.length > 0) this.subjects.push(selected);
        } else if (key == "advanced") {
          this.advanced = value[0] == "true";
        } else if (key == "sort") {
          for (let j = 0; j < order.length; j++) {
            if (order[j].method == value[0]) {
              this.sort = order[j];
            }
          }
        } else if (key == "collapsed") {
          this.isCollapsed = value[0] == "true";
          this.toggleCollapsedSearch();
        } else if (key == "scrollto") {
          // Added by Ole
          this.scrollToID = "#" + value[0]; // Added by Ole
        } else if (key == "pageSize") {
          this.pageSize = Number.parseInt(value[0]);
        } else if (key == "pmidai") {
          this.preselectedPmidai = value ?? [];
        } else {
          //add filters
          let groupId = "";
          for (let k = 0; k < this.filterOptions.length; k++) {
            if (this.filterOptions[k].id == key) {
              //set filter
              groupId = this.filterOptions[k].id;
              let filter = JSON.parse(JSON.stringify(this.filterOptions[k]));
              this.filters.push(filter);
            }
          }
          if (this.filters.length > 0) this.showFilter = true;

          //Find entries in filters
          for (let j = 0; j < value.length; j++) {
            let hashtagIndex = value[j].indexOf("#");
            let selected = [];
            // Skip values when they fail to define a scope.
            // Most often this happens when a null or undefined value is encountered.
            if (hashtagIndex < 0) {
              console.warn(
                "parseUrl: Skipped value because no hashTagIndex was found for value[" +
                  j +
                  "]:\n",
                value[j]
              );
              continue;
            }

            let id = value[j].substring(0, hashtagIndex);
            let scope = value[j].substring(hashtagIndex + 1, value[j].length);
            //Find filter
            //let filterFound = false; //name=S101 Unused variable
            let group = Number.parseInt(id[1]);
            if (group <= 0) group = 1;
            //let elem = Number.parseInt(id.slice(-2)); Unused variable
            let isId = !(id.startsWith("{{") && id.endsWith("}}")); // Check if this is a filter id or if it is a

            if (!isId) {
              name = id.slice(2, -3);
              translated = id.slice(-3, -2);
              if (Number(translated)) {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTermTranslated") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              } else {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTerm") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              }
            }
            let tmp;
            try {
              var groupIndex = parseInt(group) - 1;
              let choice = this.filterOptions[groupIndex].choices.find(
                function (e) {
                  return e.id && e.id === id;
                }
              );

              if (choice != null) {
                tmp = JSON.parse(JSON.stringify(choice));
              } else {
                tmp = null;
              }
            } catch (error) {
              console.warn("parseUrl: Couldn't create tmp. Reason:\n", error);
              tmp = null;
            }

            for (let k = 0; k < this.filterOptions.length; k++) {
              for (let l = 0; l < this.filterOptions[k].choices.length; l++) {
                var choice = this.filterOptions[k].choices[l];
                if (JSON.stringify(choice.id) == JSON.stringify(id)) {
                  let tmp = JSON.parse(JSON.stringify(choice));
                  if (this.isUrlParsed && !this.advanced && !tmp.simpleSearch)
                    continue;
                  tmp.scope = scopeIds[scope];
                  //let found = true; Unused variable
                }
              }
            }
            if (tmp) {
              if (this.isUrlParsed && !this.advanced && !tmp.simpleSearch)
                continue;
              tmp.scope = scopeIds[scope];
              //not already added, is empty and should be initialized
              if (!this.filterData[groupId]) {
                this.filterData[groupId] = [];
              }
              this.filterData[groupId].push(tmp);
              //let filterFound = true; Unused variable
            }
          }
        }
      }
      if (this.subjects.length == 0) {
        this.subjects = [[]];
      }
    },
    setUrl: function () {
      if (history.replaceState) {
        let urlLink = this.getUrl();
        this.stateHistory.push(this.oldState);
        window.history.replaceState(this.stateHistory, urlLink, urlLink);
        this.oldState = urlLink;
      }
    },
    getUrl: function () {
      var origin = "";
      if (window.location.origin && window.location.origin != "null") {
        origin = window.location.origin;
      }

      let baseUrl = origin + window.location.pathname;

      if (this.noSubjects) {
        return baseUrl;
      }
      let subjectsStr = "";
      let notEmptySubjects = 0;
      for (let i = 0; i < this.subjects.length; i++) {
        if (this.subjects[i].length == 0) {
          continue;
        }
        if (notEmptySubjects > 0) {
          subjectsStr += "&";
        }
        let subject = "subject=";
        for (let j = 0; j < this.subjects[i].length; j++) {
          let scope =
            Object.keys(scopeIds)[Object.values(scopeIds).indexOf("normal")];
          if (this.advanced) {
            scope =
              Object.keys(scopeIds)[
                Object.values(scopeIds).indexOf(this.subjects[i][j].scope)
              ];
          }
          let tmp = this.subjects[i][j].id;
          if (tmp)
            subject += encodeURIComponent(this.subjects[i][j].id + "#" + scope);
          //Custom tag is surrounded by "{{ }}" to distinguish it
          // the 1 and 0 is used to distinguish between ai translated and non ai translated searches
          else if (
            this.subjects[i][j].isCustom &&
            this.subjects[i][j].isTranslated
          )
            subject += encodeURIComponent(
              "{{" + this.subjects[i][j].name + "1}}#" + scope
            );
          else
            subject += encodeURIComponent(
              "{{" + this.subjects[i][j].name + "0}}#" + scope
            );

          if (j < this.subjects[i].length - 1) {
            subject += ";;";
          }
        }
        subjectsStr += subject;
        notEmptySubjects++;
      }
      let filterStr = "";
      if (this.advanced || this.$alwaysShowFilter) {
        const self = this;
        Object.keys(self.filterData).forEach(function (key) {
          let value = self.filterData[key];
          if (value.length == 0) {
            return;
          }
          filterStr += "&" + encodeURIComponent(key) + "=";
          for (let i = 0; i < value.length; i++) {
            var valueUrlId = value[i].isCustom
              ? "{{" + value[i].name + "}}"
              : value[i].id;
            filterStr += encodeURIComponent(
              valueUrlId +
                "#" +
                Object.keys(scopeIds)[
                  Object.values(scopeIds).indexOf(value[i].scope)
                ]
            );
            if (i < value.length - 1) {
              filterStr += ";;";
            }
          }
        });
      }
      let advancedStr = "&advanced=" + this.advanced;
      let sorter = "&sort=" + encodeURIComponent(this.sort.method);
      let collapsedStr = "&collapsed=" + this.isCollapsed;
      let scrolltoStr = ""; // Added by Ole
      if (this.scrollToID != undefined) {
        // Added by Ole
        scrolltoStr = this.scrollToID; // Added by Ole
      } // Added by Ole
      let pageSize = "&pageSize=" + this.pageSize;
      let pmidai = "&pmidai=" + (this.preselectedPmidai ?? []).join(";;");
      let urlLink =
        baseUrl +
        "?" +
        subjectsStr +
        filterStr +
        advancedStr +
        pmidai +
        sorter +
        collapsedStr +
        pageSize +
        scrolltoStr; // Added by Ole
      //?subject=alkohol1#normal,alkohol2#narrow,alkohol3#broad&subject=diabetes1#normal,astma#normal1&sprog=norsk#broad,svensk#normal
      return urlLink;
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
      const self = this;
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
      console.log("Subjects: ", this.subjects);

      this.$nextTick(function () {
        const subjectDropdown = self.$refs.subjectDropdown;
        subjectDropdown[
          subjectDropdown.length - 1
        ].$refs.multiselect.$refs.search.focus();

        // Update placeholders after DOM update
        self.updatePlaceholders();
      });
    },
    removeSubject: function (id) {
      var isEmptySubject = this.subjects[id] && this.subjects[id].length === 0;

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
      if (this.noSubjects) {
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
      console.log(
        "updateScope: { item: ",
        item,
        ", state: ",
        state,
        ", index: ",
        index,
        " }"
      );
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
    updateFilterSimple: function (filterType, selectedValue) {
      selectedValue.scope = "normal";
      var test = document.getElementById(selectedValue.name);
      let temp = JSON.parse(JSON.stringify(this.filterData));
      const self = this;
      let filter = undefined;
      if (!temp[filterType]) {
        temp[filterType] = [];
        if (temp[filterType].includes(selectedValue)) return;
        temp[filterType].push(selectedValue);
        //Apply to this.filters
        for (let i = 0; i < self.filterOptions.length; i++) {
          if (self.filterOptions[i].id === filterType)
            self.filters.push(self.filterOptions[i]);
        }
      } else {
        if (test.checked) {
          if (temp[filterType].includes(selectedValue)) return;
          temp[filterType].push(selectedValue);
          //Apply to this.filters
          for (let i = 0; i < self.filters.length; i++) {
            if (self.filters[i].id == filterType) {
              filter = self.filters[i];
              break;
            }
          }
          if (!filter) {
            for (let i = 0; i < self.filterOptions; i++) {
              if (self.filterOptions[i].id === filterType)
                self.filters.push(self.filterOptions[i]);
              break;
            }
          }
        } else {
          for (let i = 0; i < temp[filterType].length; i++) {
            if (temp[filterType][i].name === selectedValue.name) {
              temp[filterType].splice(i, 1);
              if (temp[filterType].length === 0) {
                delete temp[filterType];

                //Remove from this.filters
                for (let i = 0; i < self.filters.length; i++) {
                  if (
                    JSON.stringify(self.filters[i].id) ==
                    JSON.stringify(filterType)
                  ) {
                    self.filters.splice(i, 1);
                    break;
                  }
                }
              }
              break;
            }
          }
        }
      }
      this.filterData = temp;
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
    reloadScripts: function () {
      //Remove scripts from header
      var scripts = document.head.getElementsByTagName("script");
      //var links = document.getElementsByTagName("link"); Unused variable
      //var il = links.length; Unused variable
      var is = scripts.length;
      //ial = is; Unused variable
      while (is--) {
        //console.log(scripts[is].parentNode)
        if (scripts[is].id === "dimension" || scripts[is].id === "altmetric") {
          scripts[is].parentNode.removeChild(scripts[is]);
        }
      }

      //Remove divs and scripts from body so they wont affect performance
      scripts = document.body.getElementsByTagName("script");
      var scriptArray = Array.from(scripts);
      scriptArray.splice(0, 1);
      is = scriptArray.length;
      // ial = is; Unused variable

      while (is--) {
        if (
          scriptArray[is].src.startsWith("https://api.altmetric.com/v1/pmid") ||
          scriptArray[is].src.startsWith("https://api.altmetric.com/v1/doi")
        ) {
          scriptArray[is].parentNode.removeChild(scriptArray[is]);
        }
      }
      var containers = document.body.getElementsByClassName(
        "altmetric-embed altmetric-popover altmetric-left"
      );
      var containerArray = Array.from(containers);

      is = containerArray.length;
      //ial = is; Unused variable
      while (is--) {
        containerArray[is].parentNode.removeChild(containerArray[is]);
      }
    },
    searchsetLowStart: function () {
      this.count = 0;
      this.page = 0;
      this.search();
    },
    search: function () {
      const self = this;
      this.searchLoading = true;
      this.searchError = null;
      let str = this.getSearchString;
      let nlm = this.appSettings.nlm;
      let baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
      let query = decodeURIComponent(str);

      if (query.trim() == "" || query.trim() == "()") {
        this.searchLoading = false;
        return;
      }

      this.reloadScripts();

      const params = new URLSearchParams();
      params.append("db", "pubmed");
      params.append("tool", "QuickPubMed");
      params.append("email", nlm.email);
      params.append("api_key", nlm.key);
      params.append("retmode", "json");
      params.append("retmax", this.pageSize);
      params.append("retstart", this.page * this.pageSize);
      params.append("sort", this.sort.method);
      params.append("term", query);

      axios
        .post(baseUrl, params)
        .then(function (resp) {
          // Search after idlist
          let ids = resp.data.esearchresult.idlist;
          ids = ids.filter((id) => id != null && id.trim() != "");
          if (ids.length == 0) {
            self.count = 0;
            self.searchresult = [];
            self.searchLoading = false;
            return;
          }
          let baseUrl2 =
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
          
          const params2 = new URLSearchParams();
          params2.append("db", "pubmed");
          params2.append("tool", "QuickPubMed");
          params2.append("email", nlm.email);
          params2.append("api_key", nlm.key);
          params2.append("retmode", "json");
          params2.append("id", ids.join(","));

          axios
            .post(baseUrl2, params2)
            .then(function (resp2) {
              // Create list of returned data
              let data = [];
              let obj = resp2.data.result;
              if (!obj) {
                console.log("Error: Search was not successful", resp2);
                self.searchLoading = false;
                return;
              }
              for (let i = 0; i < obj.uids.length; i++) {
                data.push(obj[obj.uids[i]]);
              }
              self.count = parseInt(resp.data.esearchresult.count);
              self.searchresult = data;
              self.searchPreselectedPmidai();
              self.searchLoading = false;
              document.getElementById("qpm_topofsearch").scrollIntoView({
                block: "start",
                behavior: "smooth",
              });

              // Make sure that the search button will have focus to produce expected behavior when pressing 'tab'.
              var searchButton = self.$el.querySelector(".qpm_search");
              self.$nextTick(function () {
                searchButton.focus();
              }); // Delayed to let button switch to enabled state again.
            })
            .catch(function (err) {
              self.showSearchError(err);
              self.searchLoading = false;
            });
        })
        .catch(function (err) {
          self.showSearchError(err);
          self.searchLoading = false;
          // ERROR HANDLING??
        });
      document
        .getElementById("qpm_topofsearch")
        .scrollIntoView({ block: "start", behavior: "smooth" });
    },
    searchMore: function () {
      let targetResultLength = Math.min(
        (this.page + 1) * this.pageSize,
        this.count
      );
      if (this.searchresult && this.searchresult.length >= targetResultLength) {
        return;
      }

      const self = this;
      this.searchLoading = true;
      this.searchError = null;
      let str = this.getSearchString;

      let pageSize = Math.min(
        this.pageSize,
        targetResultLength - this.searchresult.length
      );
      let start = Math.max(this.searchresult.length, this.page * this.pageSize);

      let nlm = this.appSettings.nlm;
      let baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";

      let query = decodeURIComponent(str);
      if (query.trim() == "" || query.trim() == "()") {
        this.searchLoading = false;
        return;
      }

      this.reloadScripts();

      const params = new URLSearchParams();
      params.append("db", "pubmed");
      params.append("tool", "QuickPubMed");
      params.append("email", nlm.email);
      params.append("api_key", nlm.key);
      params.append("retmode", "json");
      params.append("retmax", pageSize);
      params.append("retstart", start);
      params.append("sort", this.sort.method);
      params.append("term", query);

      axios
        .post(baseUrl, params)
        .then(function (resp) {
          // Search after idlist
          let ids = resp.data.esearchresult.idlist;
          ids = ids.filter((id) => id != null && id.trim() != "");
          if (ids.length == 0) {
            self.searchLoading = false;
            return;
          }
          let baseUrl2 =
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";

          const params2 = new URLSearchParams();
          params2.append("db", "pubmed");
          params2.append("tool", "QuickPubMed");
          params2.append("email", nlm.email);
          params2.append("api_key", nlm.key);
          params2.append("retmode", "json");
          params2.append("id", ids.join(","));

          axios
            .post(baseUrl2, params2)
            .then(function (resp2) {
              // Create list of returned data
              let data = [];
              let obj = resp2.data.result;
              if (!obj) {
                console.log("Error: Search was not successful", resp2);
                self.searchLoading = false;
                return;
              }
              for (let i = 0; i < obj.uids.length; i++) {
                data.push(obj[obj.uids[i]]);
              }
              self.count = parseInt(resp.data.esearchresult.count);
              self.searchresult = self.searchresult.concat(data);
              self.searchLoading = false;
            })
            .catch(function (err) {
              console.error(err);
              self.showSearchError(err);
              self.searchLoading = false;
            });
        })
        .catch(function (err) {
          console.error(err);
          self.showSearchError(err);
          self.searchLoading = false;
        });
    },
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
      if (this.$refs.subjectDropdown && this.$refs.subjectDropdown.length > 0) {
        this.$refs.subjectDropdown.forEach((_, index) => {
          this.updatePlaceholder(false, index);
        });
      }
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
