<template>
  <div v-if="!details || details" class="qpm_wordedSearchString">
    <div v-if="!isCollapsed" class="qpm_toggleDetails">
      <p
        v-if="hasValidSubjects"
        v-tooltip="{
          content: details && getString('hoverDetailsText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        tabindex="0"
        data-html="true"
        class="qpm_advancedSearch"
        style="float: none"
        @click="toggleDetails"
        @keyup.enter="toggleDetails"
      >
        <a v-if="details">{{ getString("showDetails") }}</a>
        <a v-else>{{ getString("hideDetails") }}</a>
      </p>
    </div>
    <div v-if="hasValidSubjects && (!details || isCollapsed)" class="qpm_middle">
      <p
        v-if="!advancedString"
        v-tooltip="{
          content: getString('hoverShowSearchStringText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        tabindex="0"
        class="qpm_advancedSearch"
        style="margin: -5px 0 5px 30px"
        @click="toggleAdvanced"
        @keyup.enter="toggleAdvanced"
      >
        <a>{{ getString("showSearchString") }}</a>
      </p>
      <p
        v-else
        v-tooltip="{
          content: getString('hoverShowPrettyStringText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        tabindex="0"
        class="qpm_advancedSearch"
        style="margin: -5px 0 5px 30px"
        @click="toggleAdvanced"
        @keyup.enter="toggleAdvanced"
      >
        <a>{{ getString("hideSearchString") }}</a>
      </p>
      <div v-if="showHeader" role="heading" aria-level="2" class="h3" style="display: inline-block">
        {{ getString("youAreSearchingFor") }} 
      </div>
      <div v-if="!advancedString">
        <span class="qpm_searchStringPreText">{{ getSearchPreString }} {{ ' ' }}</span>
        <div v-for="(group, idx) in subjects" :key="idx" class="qpm_searchStringSubjectGroup">
          <span
            v-if="idx > 0 && group.length !== 0 && idx !== checkFirstSubjectRender"
            class="qpm_searchStringGroupOperator_NotApplied"
          >{{ ' ' }} {{ getString("youAreSearchingForAnd") }} {{ ' ' }}</span>
          <div v-if="Object.keys(group).length !== 0" class="qpm_searchStringWordGroup">
            <div
              v-for="(subjectObj, idx2) in group"
              :key="idx2"
              class="qpm_searchStringWordGroupWrapper"
            >
              <span class="qpm_wordedStringSubject">{{ getWordedSubjectString(subjectObj) }}</span>
              <span v-if="!subjectObj.preString" class="qpm_wordedStringOperator">{{ getScope(subjectObj) }}</span>
              {{ ' ' }}<span v-if="idx2 < group.length - 1" class="qpm_searchStringOperator">{{ getString("orOperator").toLowerCase() }} </span>
            </div>
            <div v-if="group.length > 0" class="qpm_halfBorder" />
          </div>
        </div>
        <br />
        <span v-if="!filterIsEmpty" class="qpm_searchStringPreText">
          <div class="qpm_hideonmobile" style="padding-top: 10px" />
          {{ getString("limitsPreString") }} {{ ' ' }}
        </span>
        <div v-for="(group, idx) in activeFilterDropdowns" :key="`filter-${idx}`" class="qpm_searchStringFilterGroup">
          <span
            v-if="idx > 0 && group.length !== 0"
            class="qpm_searchStringGroupOperator_NotApplied"
          >{{ ' ' }} {{ getString("youAreSearchingForAnd") }} {{ ' ' }}</span>
          <div v-if="group.length !== 0" class="qpm_searchStringWordGroup">
            <div
              v-for="(filterItem, idx2) in group"
              :key="idx2"
              class="qpm_searchStringWordGroupWrapper"
            >
              <span class="qpm_wordedStringSubject"><span v-if="showFilterCategory(group, idx2)" class="qpm_filterCategoryPrefix">{{ getFilterCategoryName(filterItem) }} = </span>{{ getWordedFilterString(filterItem) }}</span>
              <span class="qpm_wordedStringOperator">{{ getScope(filterItem) }}</span>
              {{ ' ' }}<span v-if="idx2 < group.length - 1" class="qpm_searchStringOperator">{{ getString("orOperator").toLowerCase() }} </span>
            </div>
            <div v-if="group.length > 0" class="qpm_halfBorder" />
          </div>
        </div>
      </div>
      <div v-else>
        <textarea
          ref="searchStringTextarea"
          v-tooltip.bottom="{
            content: getString('hoverSearchString'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          :value="searchstring"
          style="
            width: 100%;
            resize: vertical;
            line-height: 1.6em;
            border: solid 1px #e7e7e7;
            padding: 10px;
            margin-bottom: 4px;
          "
          readonly
          name="searchstring"
          rows="6"
          @keyup.enter="copyTextfieldFunction()"
          @click="selectAndCopy"
        />
      </div>
      <div v-if="!isCollapsed || (isCollapsed && advancedString)">
        <div v-if="!advancedString" style="border-top: solid 1px #e7e7e7; margin: 15px 0" />
        <p class="intext-arrow-link onHoverJS qpm_pubmedLink">
          <a
            v-tooltip="{
              content: getString('hoverShowPubMedLinkText'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            target="_blank"
            :href="getPubMedLink"
          >
            {{ getString("showPubMedLink") }}
          </a>
        </p>
        <p class="intext-arrow-link onHoverJS qpm_pubmedLink">
          <a
            v-tooltip="{
              content: getString('hoverShowPubMedLinkCreateAlertText'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            target="_blank"
            :href="getPubMedLinkCreateAlert"
          >
            {{ getString("createPubMedAlert") }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { filtrer } from "@/assets/content/qpm-content-filters.js";
  import { topics } from "@/assets/content/diabetes/qpm-content-topics-diabetes.js";
  import { order } from "@/assets/content/qpm-content-order.js";

  export default {
    name: "WordedSearchString",
    mixins: [appSettingsMixin, utilitiesMixin],
    props: {
      subjects: {
        type: Array,
        required: true,
      },
      filters: {
        type: Object,
        required: true,
      },
      filterDropdowns: {
        type: Array,
        default: () => [[]],
      },
      searchstring: {
        type: String,
        required: true,
      },
      isCollapsed: {
        type: Boolean,
        default: false,
      },
      details: {
        type: Boolean,
        default: false,
      },
      advancedString: {
        type: Boolean,
        default: false,
      },
      advancedSearch: {
        type: Boolean,
        default: false,
      },
      showHeader: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: "dk",
      },
    },
    computed: {
      /**
       * Determines if the subjects prop contains at least one non-empty entry.
       *
       * @returns {boolean} True if subjects contain meaningful data, else false.
       */
      hasValidSubjects() {
        return (
          Array.isArray(this.subjects) &&
          this.subjects.length > 0 &&
          Array.isArray(this.subjects[0]) &&
          this.subjects[0].length > 0
        );
      },

      /**
       * Returns an array of [key, value] pairs from the filters object
       * where the value array is not empty.
       */
      activeFilters() {
        return Object.entries(this.filters).filter(
          ([, value]) => Array.isArray(value) && value.length > 0
        );
      },
      /**
       * Returns filter groups for display.
       * In advanced mode: uses filterDropdowns (each dropdown = one group).
       * In simple mode: falls back to filters (filterData), each category = one group.
       */
      activeFilterDropdowns() {
        const fromDropdowns = this.filterDropdowns.filter((group) => group.length > 0);
        if (fromDropdowns.length > 0) return fromDropdowns;

        // Fallback for simple mode: convert filterData categories to groups
        return this.activeFilters.map(([, items]) => items);
      },
      filterIsEmpty() {
        if (this.filters) {
          let count = 0;
          Object.keys(this.filters).forEach((key) => {
            count += this.filters[key].length;
          });
          return count === 0;
        }
        return true;
      },
      getPubMedLink() {
        return `https://pubmed.ncbi.nlm.nih.gov/?myncbishare=${
          this.appSettings.nlm.myncbishare
        }&term=${encodeURIComponent(this.searchstring)}`;
      },
      getPubMedLinkCreateAlert() {
        return `https://account.ncbi.nlm.nih.gov/?back_url=${encodeURIComponent(
          "https://pubmed.ncbi.nlm.nih.gov/?&term="
        )}${encodeURIComponent(this.searchstring)}${encodeURIComponent(
          "#open-saved-search-panel"
        )}`;
      },
      getSearchPreString() {
        let count = 0;
        for (let i = 0; i < this.subjects.length; i++) {
          count += this.subjects[i].length;
        }
        if (count > 1) {
          return this.getString("searchPreStringPlural");
        } else {
          return this.getString("searchPreStringSingular");
        }
      },
      checkFirstSubjectRender() {
        for (let i = 0; i < this.subjects.length; i++) {
          try {
            if (this.subjects[i].length > 0) return i;
          } catch (error) {
            console.error(error);
            continue;
          }
        }
        return -1;
      },
      checkFirstFilterRender() {
        const filter = Object.keys(this.filters);
        for (let i = 0; i < filter.length; i++) {
          try {
            if (this.filters[filter[i]][0].name) return i;
          } catch (error) {
            console.error(error);
            continue;
          }
        }
        return -1;
      },
    },
    methods: {
      toggleAdvanced() {
        this.$emit("toggleAdvancedString");
      },
      toggleDetails() {
        this.$emit("toggleDetailsBox");
      },
      getScope(obj) {
        if (!this.advancedSearch || this.isSingleScoped(obj)) {
          return "";
        }

        if (obj.scope === "broad") {
          return ` (${this.getString("broad")})`;
        } else if (obj.scope === "narrow") {
          return ` (${this.getString("narrow")})`;
        } else {
          return ` (${this.getString("normal")})`;
        }
      },
      getWordedSubjectString(string) {
        try {
          let constant;
          if (string.id) {
            constant = string.translations[this.language];
          }
          if (string.translations && string.translations[this.language]) {
            constant = string.translations[this.language];
          } else if (string.isTranslated && string.preTranslation) {
            constant =
              string.preTranslation +
              " (" +
              this.getString("manualInputTermTranslated") +
              ": " +
              string.name +
              ")";
          } else {
            constant = string.name;
          }
          return constant;
        } catch (e) {
          return string.translations["dk"];
        }
      },
      getWordedFilterString(filter) {
        try {
          let constant;
          if (filter.translations) {
            constant = filter.translations[this.language];
          } else if (filter.id) {
            constant = this.getWordedFilterStringById(filter.id);
          } else if (typeof filter === "string" || filter instanceof String) {
            constant = this.getWordedFilterStringById(filter);
          } else {
            constant = filter.name;
          }
          return constant;
        } catch (e) {
          console.error(filter, e);
          return filter;
        }
      },
      getWordedFilterStringById(id) {
        if (id === "__custom__") return this.getString("manualInputTerm") || "Søgeord";
        const type = id.substr(0, 1).toLowerCase();
        const groupId = id.substr(0, 3);
        const lg = this.language;

        const byId = (e) => e.id === id;
        const byGroupId = (e) => e.id === groupId;

        if (type === "o") {
          return order.find(byId).translations[lg];
        } else if (type === "s") {
          const group = topics.find(byGroupId);
          if (id.length === 3) {
            return group.translations[lg];
          } else {
            const topic = group.groups.find(byId);
            return topic.translations[lg];
          }
        } else if (type === "l") {
          const group = filtrer.find(byGroupId);
          if (id.length === 3) {
            return group.translations[lg];
          } else {
            const choice = group.choices.find(byId);
            return choice.translations[lg];
          }
        } else {
          throw new Error("Id not handled by getWordedFilterStringById. id: " + id);
        }
      },
      isSingleScoped(obj) {
        if (!obj.searchStrings) return false;

        let count = 0;
        if (obj.searchStrings["broad"]) count++;
        if (obj.searchStrings["narrow"]) count++;
        if (obj.searchStrings["normal"]) count++;

        return count === 1;
      },
      copyTextfieldFunction() {
        const textarea = this.$refs.searchStringTextarea;
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        document.execCommand("copy");
      },
      selectAndCopy() {
        this.copyTextfieldFunction();
      },
      /**
       * Returns true if the category prefix should be shown for this filter item.
       * If all items in the group share the same category, only the first item shows it.
       * If categories are mixed, every item shows its category.
       */
      showFilterCategory(group, idx) {
        if (idx === 0) return true;
        // Check if all items in the group have the same category
        const firstCategory = this.getFilterCategoryName(group[0]);
        const allSame = group.every((item) => this.getFilterCategoryName(item) === firstCategory);
        return !allSame;
      },
      getFilterCategoryName(item) {
        if (!item.id || item.id === "__custom__") return this.getString("manualInputTerm") || "Søgeord";
        // Find the category by checking which filter group contains this item's id
        const groupId = item.id.substring(0, 4);
        const group = filtrer.find((f) => f.id === groupId || (f.choices && f.choices.some((c) => c.id === item.id)));
        if (group && group.translations) {
          const lg = this.language;
          const name = group.translations[lg] || group.translations["dk"] || "";
          return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return "";
      },
      getWordedFilterStringFromId(id) {
        // Handle custom filter entries (manually entered search terms)
        if (id === "__custom__") {
          return this.getString("manualInputTerm") || "Søgeord";
        }
        const filterGroup = filtrer.find(group => group.id === id);
        if (filterGroup && filterGroup.translations) {
          const lg = this.language;
          return filterGroup.translations[lg] || filterGroup.translations["dk"];
        }
        return this.getWordedFilterStringById(id);
      },
    },
  };
</script>
