<template>
  <div class="qpm_searchStringCollection">
    <p
      v-if="isAllToggled"
      class="qpm_advancedSearch qpm_showHideAll"
      style="display: flex; justify-content: flex-end"
      @keyup.enter="toggleAll()"
      @click="toggleAll()"
    >
      <a tabindex="0">{{ getString("showAllSearchstrings") }}</a>
    </p>
    <p
      v-if="!isAllToggled"
      class="qpm_advancedSearch qpm_showHideAll"
      style="display: flex; justify-content: flex-end"
      @keyup.enter="toggleAll()"
      @click="toggleAll()"
    >
      <a tabindex="0">{{ getString("hideAllSearchstrings") }}</a>
    </p>
    <div class="qpm_searchStringStringsContainer rich-text">
      <div style="padding-top: 5px">
        <h2
          class="qpm_heading intext-arrow-link"
          @click="hideOrCollapse('qpm_subjectSearchStrings')"
        >
          {{ getString("subjects") }}
        </h2>
      </div>
      <div
        v-for="subject in getSortedSubjects"
        :key="`subject-${subject.id}`"
        class="qpm_subjectSearchStrings qpm_collapsedSection"
      >
        <h3
          class="qpm_heading intext-arrow-link"
          @click="hideOrCollapse(toClassName(subject.groupname))"
        >
          {{ customNameLabel(subject) }}
        </h3>
        <div
          v-for="(group, index) in subject.groups"
          :key="`group-${group.id}-${index}`"
          class="qpm_searchGroups qpm_collapsedSection"
          :class="[
            toClassName(subject.groupname),
            {
              qpm_maintopicDropdown: group.maintopic,
              qpm_subtopicDropdown: group.subtopiclevel,
              qpm_subtopicDropdownLevel2: group.subtopiclevel === 2,
            },
          ]"
        >
          <h4
            class="qpm_heading"
            :class="{ 'intext-arrow-link': !group.maintopic }"
            @click="hideOrCollapse(toClassName(group.name))"
          >
            {{ customNameLabel(group) }}
          </h4>
          <div
            v-if="!group.maintopic"
            class="qpm_searchGroups qpm_collapsedSection qpm_searchSubject"
            :class="toClassName(group.name)"
          >
            <table class="qpm_table">
              <tr>
                <th>{{ getString("scope") }}</th>
                <th>{{ getString("searchString") }}</th>
              </tr>
              <tr v-if="group.searchStrings.narrow">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNarrow'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_buttonColor1"
                  >
                    {{ getString("narrow") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      target="_blank"
                      :href="getPubMedLink(group.searchStrings.narrow)"
                    >
                      {{ trimSearchString(group.searchStrings.narrow) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="group.searchStrings.normal">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNormal'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_buttonColor2"
                  >
                    {{ getString("normal") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      target="_blank"
                      :href="getPubMedLink(group.searchStrings.normal)"
                    >
                      {{ trimSearchString(group.searchStrings.normal) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="group.searchStrings.broad">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipBroad'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_buttonColor3"
                  >
                    {{ getString("broad") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      target="_blank"
                      :href="getPubMedLink(group.searchStrings.broad)"
                    >
                      {{ trimSearchString(group.searchStrings.broad) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="blockHasComment(group)">
                <th colspan="2">
                  {{ getString("comment") }}
                </th>
              </tr>
              <tr v-if="blockHasComment(group)">
                <td colspan="2">
                  {{ group.searchStringComment[language] }}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      <div class="qpm_heading_limits">
        <h2
          class="qpm_heading intext-arrow-link"
          @click="hideOrCollapse('qpm_filterSearchStrings')"
        >
          {{ getString("filters") }}
        </h2>
      </div>
      <div
        v-for="filter in getSortedFilters"
        :key="filter.name"
        class="qpm_filterSearchStrings qpm_collapsedSection"
      >
        <h3 class="qpm_heading intext-arrow-link" @click="hideOrCollapse(toClassName(filter.name))">
          {{ customNameLabel(filter) }}
        </h3>
        <div
          v-for="choice in filter.choices"
          :key="choice.id"
          class="qpm_filterGroups qpm_collapsedSection"
          :class="[
            toClassName(filter.name),
            {
              qpm_maintopicDropdown: choice.maintopic,
              qpm_subtopicDropdown: choice.subtopiclevel,
              qpm_subtopicDropdownLevel2: choice.subtopiclevel === 2,
            },
          ]"
        >
          <h4
            class="qpm_heading"
            :class="{ 'intext-arrow-link': !choice.maintopic }"
            @click="hideOrCollapse(toClassName(choice.name))"
          >
            {{ customNameLabel(choice) }}
          </h4>
          <div
            v-if="!choice.maintopic"
            class="qpm_filterGroup qpm_collapsedSection qpm_searchFilter"
            :class="toClassName(choice.name)"
          >
            <table class="qpm_table">
              <tr>
                <th>{{ getString("scope") }}</th>
                <th>{{ getString("searchString") }}</th>
              </tr>
              <tr v-if="choice.searchStrings.narrow">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNarrow'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_buttonColor1"
                  >
                    {{ getString("narrow") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      target="_blank"
                      :href="getPubMedLink(choice.searchStrings.narrow)"
                    >
                      {{ trimSearchString(choice.searchStrings.narrow) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="choice.searchStrings.normal">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNormal'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_buttonColor2"
                  >
                    {{ getString("normal") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      target="_blank"
                      :href="getPubMedLink(choice.searchStrings.normal)"
                    >
                      {{ trimSearchString(choice.searchStrings.normal) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="choice.searchStrings.broad">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipBroad'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_buttonColor3"
                  >
                    {{ getString("broad") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      target="_blank"
                      :href="getPubMedLink(choice.searchStrings.broad)"
                    >
                      {{ trimSearchString(choice.searchStrings.broad) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="blockHasComment(choice)">
                <th colspan="2">
                  {{ getString("comment") }}
                </th>
              </tr>
              <tr v-if="blockHasComment(choice)">
                <td colspan="2">
                  {{ choice.searchStringComment[language] }}
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { order, filtrer } from "@/assets/content/qpm-content.js";
  import { topics } from "@/assets/content/qpm-content-diabetes";

  export default {
    name: "SearchGallery",
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
    },
    data() {
      return {
        filters: [],
        subjects: [],
        orders: [],
        isAllToggled: true,
      };
    },
    computed: {
      getSortedSubjects() {
        let shownSubjects = this.getShownData(this.subjects, "groups");
        return this.sortData(shownSubjects);
      },
      getSortedFilters() {
        let shownFilters = this.getShownData(this.filters, "choices");
        return this.sortData(shownFilters);
      },
    },
    created() {
      this.filters = filtrer;
      this.subjects = topics;
      this.orders = order;
    },
    methods: {
      blockHasComment(block) {
        if (block.searchStringComment[this.language]) return true;
        return false;
      },
      hideOrCollapse(className) {
        const elements = document.getElementsByClassName(className);
        for (let i = 0; i < elements.length; i++) {
          elements[i].classList.toggle("qpm_collapsedSection");
        }
      },
      toggleAll() {
        if (this.isAllToggled) {
          let subjectSections = document.getElementsByClassName("qpm_subjectSearchStrings");
          for (let i = 0; i < subjectSections.length; i++) {
            subjectSections[i].classList.remove("qpm_collapsedSection");
          }
          let searchGroups = document.getElementsByClassName("qpm_searchGroups");
          for (let j = 0; j < searchGroups.length; j++) {
            searchGroups[j].classList.remove("qpm_collapsedSection");
          }
          let searchSubjects = document.getElementsByClassName("qpm_searchSubject");
          for (let k = 0; k < searchSubjects.length; k++) {
            searchSubjects[k].classList.remove("qpm_collapsedSection");
          }

          let filterSections = document.getElementsByClassName("qpm_filterSearchStrings");
          for (let i = 0; i < filterSections.length; i++) {
            filterSections[i].classList.remove("qpm_collapsedSection");
          }
          let filterGroups = document.getElementsByClassName("qpm_filterGroups");
          for (let j = 0; j < filterGroups.length; j++) {
            filterGroups[j].classList.remove("qpm_collapsedSection");
          }
          let searchFilters = document.getElementsByClassName("qpm_searchFilter");
          for (let k = 0; k < searchFilters.length; k++) {
            searchFilters[k].classList.remove("qpm_collapsedSection");
          }
          this.isAllToggled = false;
        } else {
          let subjectSections = document.getElementsByClassName("qpm_subjectSearchStrings");
          for (let i = 0; i < subjectSections.length; i++) {
            subjectSections[i].classList.add("qpm_collapsedSection");
          }
          let searchGroups = document.getElementsByClassName("qpm_searchGroups");
          for (let j = 0; j < searchGroups.length; j++) {
            searchGroups[j].classList.add("qpm_collapsedSection");
          }
          let searchSubjects = document.getElementsByClassName("qpm_searchSubject");
          for (let k = 0; k < searchSubjects.length; k++) {
            searchSubjects[k].classList.add("qpm_collapsedSection");
          }

          let filterSections = document.getElementsByClassName("qpm_filterSearchStrings");
          for (let i = 0; i < filterSections.length; i++) {
            filterSections[i].classList.add("qpm_collapsedSection");
          }
          let filters = document.getElementsByClassName("qpm_filterGroups");
          for (let j = 0; j < filters.length; j++) {
            filters[j].classList.add("qpm_collapsedSection");
          }
          let searchFilters = document.getElementsByClassName("qpm_searchFilter");
          for (let k = 0; k < searchFilters.length; k++) {
            searchFilters[k].classList.add("qpm_collapsedSection");
          }
          this.isAllToggled = true;
        }
      },
      getPubMedLink(searchString) {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          "&term=" +
          encodeURIComponent(searchString)
        );
      },
      trimSearchString(searchString) {
        if (Array.isArray(searchString)) return searchString[0].toString();
        return searchString.toString();
      },
      getString(string) {
        let lg = this.language;
        let constant = messages[string][lg];
        return constant != undefined ? constant : messages[string]["dk"];
      },
      customNameLabel(option) {
        if (!option.name && !option.groupname) return;
        let constant;
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
      isHiddenTopic(topicId) {
        return this.hideTopics.indexOf(topicId) != -1;
      },
      toClassName(name) {
        return name.replaceAll(" ", "-");
      },
      sortData(data) {
        let self = this;
        let lang = this.language;
        function sortByPriorityOrName(a, b) {
          if (a.ordering[lang] != null && b.ordering[lang] == null) {
            return -1; // a is ordered and b is not -> a first
          }
          if (b.ordering[lang] != null && a.ordering[lang] == null) {
            return 1; // b is ordered and a is not -> b first
          }

          let aSort, bSort;
          if (a.ordering[lang] != null) {
            // Both are ordered
            aSort = a.ordering[lang];
            bSort = b.ordering[lang];
          } else {
            // Both are unordered
            aSort = self.customNameLabel(a);
            bSort = self.customNameLabel(b);
          }

          if (aSort === bSort) {
            return 0;
          }
          if (aSort > bSort) {
            return 1;
          } else {
            return -1;
          }
        }

        data.forEach((item) => {
          let groupName = null;
          if (item.groups != null) {
            groupName = "groups";
          } else if (item.choices != null) {
            groupName = "choices";
          } else {
            return;
          }

          item[groupName].sort(sortByPriorityOrName); // Sort categories in groups
        });
        data.sort(sortByPriorityOrName); // Sort groups
        return data;
      },
      getShownData(data, groupName) {
        let self = this;
        function isNotHidden(e) {
          return !self.isHiddenTopic(e.id);
        }

        let shown = data.filter(isNotHidden).map(function (e) {
          let copy = JSON.parse(JSON.stringify(e));
          copy[groupName] = copy[groupName].filter(isNotHidden);
          return copy;
        });

        return shown;
      },
      // Added by Ole
    },
  };
</script>
