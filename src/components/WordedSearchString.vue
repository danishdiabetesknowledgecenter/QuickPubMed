<template>
  <div v-if="!details || details" class="qpm_wordedSearchString">
    <div v-if="!isCollapsed" class="qpm_toggleDetails" style="box-shadow: inset 0 -1px 0 0 #e0e0e0">
      <p
        v-if="subjects !== ''"
        v-tooltip="{
          content: details && getString('hoverDetailsText'),
          offset: 5,
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
    <div v-if="subjects !== '' && (!details || isCollapsed)" class="qpm_middle">
      <p
        v-if="!advancedString"
        v-tooltip="{
          content: getString('hoverShowSearchStringText'),
          offset: 5,
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
          offset: 5,
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
        <span>{{ getSearchPreString }} </span>
        <div v-for="(group, idx) in subjects" :key="idx" class="qpm_searchStringSubjectGroup">
          <span
            v-if="idx > 0 && group.length !== 0 && idx !== checkFirstSubjectRender"
            class="qpm_searchStringGroupOperator_NotApplied"
          >
            {{ getString("youAreSearchingForAnd") }}
          </span>
          <div v-if="Object.keys(group).length !== 0" class="qpm_searchStringWordGroup">
            <div
              v-for="(subjectObj, idx2) in group"
              :key="idx2"
              class="qpm_searchStringWordGroupWrapper"
            >
              <span class="qpm_wordedStringSubject">
                {{ getWordedSubjectString(subjectObj) }}
              </span>
              <span v-if="!subjectObj.preString" class="qpm_wordedStringOperator">
                {{ getScope(subjectObj) }}
              </span>
              <span v-if="idx2 < group.length - 1" class="qpm_searchStringOperator">
                {{ getString("orOperator").toLowerCase() }}
              </span>
            </div>
            <div v-if="group.length > 0" class="qpm_halfBorder" />
          </div>
        </div>
        <br />
        <span v-if="!filterIsEmpty">
          <div class="qpm_hideonmobile" style="padding-top: 10px" />
          {{ getString("where") }}
        </span>
        <template v-if="activeFilters.length > 0">
          <div
            v-for="([name, value], idx) in activeFilters"
            :key="name"
            class="qpm_searchStringFilterGroup"
          >
            <span v-if="idx > 0" class="qpm_searchStringGroupOperator_NotApplied">
              {{ getString("andOperator").toLowerCase() }}
            </span>
            <span class="qpm_searchStringGroupWhere">
              {{ getWordedFilterString(name) }} {{ getString("is") }}
            </span>
            <div v-if="value.length !== 0" class="qpm_searchStringWordGroup">
              <div
                v-for="(filterObj, idx2) in value"
                :key="idx2"
                class="qpm_searchStringWordGroupWrapper"
              >
                <span class="qpm_wordedStringSubject">
                  {{ getWordedFilterString(filterObj) }}
                </span>
                <span class="qpm_wordedStringOperator">
                  {{ getScope(filterObj) }}
                </span>
                <span v-if="idx2 < value.length - 1" class="qpm_searchStringOperator">
                  {{ getString("orOperator").toLowerCase() }}
                </span>
              </div>
              <div class="qpm_halfBorder" />
            </div>
          </div>
        </template>
      </div>
      <div v-else>
        <textarea
          ref="searchStringTextarea"
          v-tooltip.bottom="{
            content: getString('hoverSearchString'),
            offset: 5,
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
              offset: 5,
              delay: $helpTextDelay,
              trigger: 'hover',
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
              offset: 5,
              delay: $helpTextDelay,
              trigger: 'hover',
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
  import { messages } from "@/assets/content/qpm-translations.js";
  import { filtrer } from "@/assets/content/qpm-content-filters.js";
  import { topics } from "@/assets/content/qpm-content-diabetes.js";
  import { order } from "@/assets/content/qpm-content-order.js";

  export default {
    name: "WordedSearchString",
    mixins: [appSettingsMixin],
    props: {
      subjects: {
        type: Array,
        required: true,
      },
      filters: {
        type: Object,
        required: true,
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
       * Returns an array of [key, value] pairs from the filters object
       * where the value array is not empty.
       */
      activeFilters() {
        return Object.entries(this.filters).filter(
          ([, value]) => Array.isArray(value) && value.length > 0
        );
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
          return `(${this.getString("broad")})`;
        } else if (obj.scope === "narrow") {
          return `(${this.getString("narrow")})`;
        } else {
          return `(${this.getString("normal")})`;
        }
      },
      getString(string) {
        const lg = this.language;
        const constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["dk"];
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
          console.log(string, e);
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
    },
  };
</script>
