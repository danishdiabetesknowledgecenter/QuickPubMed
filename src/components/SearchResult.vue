<!-- eslint-disable vue/no-v-html -->
<template>
  <div ref="searchResult" class="qpm_SearchResult">
    <div v-if="results && results.length > 0" class="qpm_accordions">
      <!-- Accordion menu for the AI summaries of abstracts from multiple search results -->
      <accordion-menu
        v-if="config.useAI"
        class="qpm_ai_hide"
        @expanded-changed="onAiSummariesAccordionStateChange"
      >
        <template #header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <div style="display: inline-flex">
              <i
                v-if="accordionProps.expanded"
                class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
              />
              <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
              <i
                class="bx bx-detail"
                style="
                  font-size: 22px;
                  vertical-align: text-bottom;
                  margin-left: 3px;
                  margin-right: 5px;
                "
              />
              <div>
                <strong>{{ getString("selectedResultsAccordionHeader") }}</strong>
                <button
                  v-tooltip="{
                    content: getString('hoverselectedResultsAccordionHeader'),
                    offset: 5,
                    delay: $helpTextDelay,
                    hideOnTargetClick: false,
                  }"
                  class="bx bx-info-circle"
                />
              </div>
            </div>
          </div>
        </template>
        <div>
          <div>
            <keep-alive>
              <div
                v-if="!hasAcceptedAi"
                class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
              >
                <p>{{ getString("aiSearchSummaryConsentHeader") }}</p>
                <p
                  v-if="selectedEntries == null || selectedEntries.length == 0"
                  v-html="getString('aiSearchSummaryConsentHeaderText')"
                />
                <p v-if="selectedEntries.length > 0">
                  {{ getString("aiSearchSummarySelectedArticlesBefore") }}
                  <strong>{{ selectedEntries.length }} </strong>
                  <span v-if="selectedEntries.length == 1">
                    <strong>{{ getString("aiSearchSummarySelectedArticlesAfterSingular") }}</strong>
                  </span>
                  <span v-if="selectedEntries.length > 1">
                    <strong>{{ getString("aiSearchSummarySelectedArticlesAfterPlural") }}</strong>
                  </span>
                  {{ getString("aiSearchSummarySelectedArticlesAfter") }}
                </p>
                <p>
                  <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                </p>
                <button
                  v-for="(prompt, index) in getSearchSummaryPrompts()"
                  :key="`prompt-${prompt.name}-${index}`"
                  v-tooltip="{
                    content: getString('hoverSummarizeSearchResultButton'),
                    offset: 5,
                    delay: $helpTextDelay,
                    hideOnTargetClick: false,
                  }"
                  class="qpm_button qpm_summaryButton"
                  @click="clickAcceptAi(prompt)"
                >
                  <i
                    class="bx bx-detail"
                    style="font-size: 22px; line-height: 0; margin: -4px 2px 0 0"
                  />
                  {{ getTranslation(prompt) }}
                </button>
                <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
              </div>

              <!-- AI summaries of abstracts from inside multiple search results -->
              <ai-summaries
                v-else
                :show-summarize-article="false"
                :language="language"
                :prompts="getSearchSummaryPrompts()"
                :success-header="getSummarySuccessHeader()"
                :is-marked-articles="getHasSelectedArticles"
                :summary-consent-header="getString('aiSearchSummaryConsentHeader')"
                :summary-search-summary-consent-text="getString('aiSearchSummaryConsentHeaderText')"
                :error-header="getString('aiSummarizeSearchErrorHeader')"
                :has-accepted-ai="hasAcceptedAi"
                :initial-tab-prompt="initialAiTab"
                :get-selected-articles="getSelectedArticles"
                @close="closeSummaries"
                @ai-summaries-click-retry="onAiSummariesClickRetry"
              />
            </keep-alive>
          </div>
        </div>
      </accordion-menu>

      <!-- Accordion menu for the marked articles marked on result entry component -->
      <accordion-menu
        ref="articlesAccordion"
        :is-expanded="isSelectedArticleAccordionExpanded"
        :models="selectedEntries"
        :open-by-default="preselectedEntries != null && preselectedEntries.length > 0"
        :only-update-model-when-visible="true"
        @changed:items="loadSelectedArticleBadges"
        @open="onArticleAccordionStateChange(true)"
        @close="onArticleAccordionStateChange(false)"
      >
        <template #header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <div style="display: inline-flex; width: 100%">
              <i
                v-if="accordionProps.expanded"
                class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
              />
              <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
              <i
                class="bx bx-check-square"
                style="
                  font-size: 22px;
                  vertical-align: text-bottom;
                  margin-left: 3px;
                  margin-right: 5px;
                "
              />
              <div
                style="
                  display: inline-flex;
                  width: 100%;
                  justify-content: space-between;
                  flex-wrap: wrap;
                "
              >
                <div style="margin-bottom: 5px">
                  <strong>{{ getString("selectedResultTitle") }}</strong>
                  <button
                    v-if="!config.useAI"
                    v-tooltip="{
                      content: getString('hoverselectedResultTitle'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="bx bx-info-circle"
                  />
                  <button
                    v-if="config.useAI"
                    v-tooltip="{
                      content: getString('hoverselectedResultTitleAI'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="bx bx-info-circle"
                  />
                </div>
                <div>
                  <button
                    v-tooltip="{
                      content: getString('hovermarkedArticleCounter'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_markedArticleCounter"
                    @click.stop
                  >
                    {{ selectedEntries.length }}
                    <span v-if="selectedEntries.length == 1">
                      {{ getString("aiSearchSummarySelectedArticlesAfterSingular") }}
                    </span>
                    <span v-if="selectedEntries.length > 1 || selectedEntries.length == 0">
                      {{ getString("aiSearchSummarySelectedArticlesAfterPlural") }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #default>
          <div
            class="list-fade-item"
            name="transition-item-0"
            style="
              padding: 5px 0 5px 10px;
              background-color: var(--color-grey-light);
              border-bottom: solid 1px lightgrey;
              font-size: 0.96em;
            "
            @click="onDeselectAllArticles"
          >
            <button
              id="qpm_selectedResultDeselectAll"
              style="padding-left: 0"
              :disabled="selectedEntries == null || selectedEntries.length <= 0"
            >
              <i
                class="bx bxs-minus-square qpm_selectArticleCheckbox"
                style="font-size: 22px; line-height: 0; margin: -4px 4px 0 0"
              />
              <button
                v-tooltip="{
                  content: getString('hoverselectedResultDeselectAllText'),
                  offset: 5,
                  delay: $helpTextDelay,
                  hideOnTargetClick: false,
                }"
                class="qpm_button qpm_selectArticleCheckbox list-fade-item"
              >
                {{ getString("selectedResultDeselectAllText") }}
              </button>
            </button>
          </div>
          <div class="qpm_searchSummaryText qpm_searchSummaryTextBackground">
            <div
              v-if="selectedEntries == null || selectedEntries.length == 0"
              v-html="getString('selectedResultEmptyText')"
            />
          </div>
        </template>
        <template #listItem="value">
          <!-- These result-entries are shown under the marked articles accordion -->
          <!-- Do not provide a ref to this intance as it will override and mess up with the existing resultEntries ref-->
          <result-entry
            :id="value.model.uid"
            :pmid="value.model.uid"
            :pub-date="value.model.pubdate"
            :volume="value.model.volume"
            :issue="value.model.issue"
            :pages="value.model.pages"
            :doi="getDoi(value.model.articleids)"
            :title="value.model.title"
            :pub-type="value.model.pubtype"
            :doc-type="value.model.doctype"
            :booktitle="value.model.booktitle"
            :vernaculartitle="value.model.vernaculartitle"
            :date="getDate(value.model.history)"
            :source="getSource(value.model)"
            :has-abstract="getHasAbstract(value.model.attributes)"
            :author="getAuthor(value.model.authors)"
            :language="language"
            :parent-width="getComponentWidth()"
            :abstract-summary-prompts="getAbstractSummaryPrompts()"
            :model-value="selectedEntries"
            :value="value.model"
            :selectable="entriesAlwaysSelectable || hasAcceptedAi"
            :abstract="getAbstract(value.model.uid)"
            :text="getText(value.model.uid)"
            :is-abstract-loaded="isAbstractLoaded"
            @change="changeResultEntryModel(value.model)"
            @change:abstractLoad="onAbstractLoad"
            @loadAbstract="addIdToLoadAbstract"
          />
        </template>
      </accordion-menu>
    </div>
    <div
      v-if="results && results.length > 0 && total > 0"
      role="heading"
      aria-level="2"
      class="h3"
      style="padding-top: 30px"
    >
      {{ getString("searchresult") }}
    </div>
    <div v-if="results && results.length > 0 && total > 0" class="qpm_searchHeader qpm_spaceEvenly">
      <p class="qpm_nomargin">
        {{ getString("showing") }} {{ low + 1 }}-{{ high }}
        {{ getString("of") }}
        <span
          ><strong>{{ getPrettyTotal }}</strong> {{ getString("searchMatches") }}</span
        >
      </p>
      <div v-if="results && results.length != 0" class="qpm_searchHeaderSort qpm_spaceEvenly">
        <div class="qpm_sortSelect" style="padding-right: 7px">
          <select v-model="currentSortMethod" @change="newSortMethod">
            <option v-for="sorter in getOrderMethods" :key="sorter.id" :value="sorter.method">
              {{ getTranslation(sorter) }}
            </option>
          </select>
        </div>

        <div
          role="heading"
          aria-level="2"
          class="qpm_sortSelect qpm_spaceEvenly"
          style="border-left: 1px solid #e7e7e7"
        >
          <select @change="changePageNumber($event)">
            <option
              v-for="size in getPageSizeProps"
              :key="size"
              :value="size"
              :selected="isSelectedPageSize(size)"
            >
              {{ size }} {{ getString("pagesizePerPage") }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="results && results.length === 0">
      <div class="h3"><br />{{ getString("noResult") }}</div>
      <p>{{ getString("noResultTip") }}</p>
    </div>
    <div style="z-index: 0">
      <div
        v-for="(value, index) in getShownSearchResults"
        :key="value.uid || `result-${index}`"
        class="qpm_ResultEntryWrapper"
      >
        <result-entry
          :id="value.uid"
          ref="resultEntries"
          :pmid="value.uid"
          :volume="value.volume"
          :issue="value.issue"
          :pages="value.pages"
          :doi="getDoi(value.articleids)"
          :title="value.title"
          :pub-date="value.pubdate"
          :pub-type="value.pubtype"
          :doc-type="value.doctype"
          :booktitle="value.booktitle"
          :vernaculartitle="value.vernaculartitle"
          :date="getDate(value.history)"
          :source="getSource(value)"
          :has-abstract="getHasAbstract(value.attributes)"
          :author="getAuthor(value.authors)"
          :language="language"
          :parent-width="getComponentWidth()"
          :abstract-summary-prompts="getAbstractSummaryPrompts()"
          :model-value="selectedEntries"
          :selectable="entriesAlwaysSelectable || hasAcceptedAi"
          :abstract="getAbstract(value.uid)"
          :text="getText(value.uid)"
          :value="value"
          :is-abstract-loaded="isAbstractLoaded"
          @change="changeResultEntryModel"
          @change:abstractLoad="onAbstractLoad"
          @articleUpdated="addArticle"
          @loadAbstract="addIdToLoadAbstract"
        />
      </div>
      <loading-spinner :loading="loading" class="qpm_searchMore" />
      <div v-if="error != null" class="qpm_flex">
        <div class="qpm_errorBox">
          {{ error.message ?? error.toString() }}
        </div>
      </div>
    </div>
    <div
      v-if="total > 0"
      class="qpm_flex"
      style="justify-content: center; margin-top: 25px; flex-direction: column"
    >
      <button
        v-if="!loading && results && results.length < total"
        :disabled="highDisabled"
        :class="{ qpm_disabled: highDisabled }"
        class="qpm_button qpm_dark"
        @click="next"
      >
        <span class="qpm_hideonmobile">{{ getString("next") }}</span>
        {{ pagesize }}
      </button>
      <p v-if="!loading || (results && high && total)" class="qpm_nomargin qpm_shownumber">
        {{ getString("showing") }} 1-{{ high }} {{ getString("of") }}
        <span
          ><strong>{{ getPrettyTotal }}</strong> {{ getString("searchMatches") }}</span
        >
      </p>
    </div>
  </div>
</template>

<script>
  import Vue from "vue";
  import axios from "axios";
  import AiSummaries from "@/components/AiSummaries.vue";
  import ResultEntry from "@/components/ResultEntry.vue";
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import { config } from "@/config/config.js";
  import { order } from "@/assets/content/qpm-content-order.js";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { appSettingsMixin, eventBus } from "@/mixins/appSettings";
  import {
    searchSummaryPrompts,
    abstractSummaryPrompts,
    summarizeArticlePrompt,
  } from "@/assets/content/qpm-open-ai-prompts";
  import { languageFormat, dateOptions, pageSizes } from "@/utils/qpm-content-helpers";

  export default {
    name: "SearchResult",
    components: {
      AccordionMenu,
      ResultEntry,
      LoadingSpinner,
      AiSummaries,
    },
    mixins: [appSettingsMixin],
    props: {
      results: {
        type: Array,
      },
      total: {
        type: Number,
        default: 0,
      },
      pagesize: {
        type: Number,
        default: 25,
      },
      low: {
        type: Number,
        default: 0,
      },
      high: {
        type: Number,
        default: 0,
      },
      loading: Boolean,
      sort: {
        type: Object,
        default: () => {},
      },
      language: {
        type: String,
        default: "dk",
      },
      preselectedEntries: {
        type: Array,
        default: () => [],
      },
      error: {
        type: Error,
        default: null,
      },
      entriesAlwaysSelectable: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        hasAcceptedAi: false,
        initialAiTab: null,
        selectedEntries: this.preselectedEntries,
        badgesAdded: false,
        altmetricsAdded: false,
        idswithAbstractsToLoad: [],
        abstractRecords: {}, // id, abstract
        isAbstractLoaded: false,
        articles: {},
        isSummarizeArticlesAcordionExpanded: false,
        isSelectedArticleAccordionExpanded: false,
      };
    },
    computed: {
      config() {
        return config;
      },
      currentSortMethod: {
        get() {
          return this.sort.method;
        },
        set(value) {
          const selectedSorter = this.getOrderMethods.find((sorter) => sorter.method === value);
          if (selectedSorter) {
            this.$emit("newSortMethod", selectedSorter);
          }
        },
      },
      lowDisabled() {
        return this.low == 0 || this.loading;
      },
      highDisabled() {
        return this.high >= this.total || this.loading;
      },
      getPrettyTotal() {
        let format = languageFormat[this.language];
        return this.total.toLocaleString(format);
      },
      getOrderMethods() {
        return order;
      },
      getPageSizeProps() {
        return pageSizes;
      },
      getShownSearchResults() {
        if (this.results == null) return null;
        return this.results.slice(0, this.high);
      },
      getHasSelectedArticles() {
        return this.selectedEntries.length > 0;
      },
      firstFiveArticlesWithAbstracts() {
        const self = this;
        const resultsWithAbstract = this.getShownSearchResults.filter(function (result) {
          return self.getHasAbstract(result.attributes);
        });
        const first5ResultsWithAbstract = resultsWithAbstract.slice(0, 5);
        return first5ResultsWithAbstract;
      },
    },
    watch: {
      loading(newVal) {
        if (newVal) {
          this.isAbstractLoaded = false;
        }
      },
      preselectedEntries(newVal) {
        if (this.selectedEntries != null && this.selectedEntries.length > 0) {
          return;
        }
        this.selectedEntries = newVal;
      },
    },
    updated() {
      // Guards to avoid badges re-rendering on select/deselect
      if (!this.$refs.resultEntries || this.$refs.resultEntries.length == 0) {
        this.hasAcceptedAi = false;
        this.badgesAdded = false;
        this.altmetricsAdded = false;
        this.isSummarizeArticlesAcordionExpanded = false;
        this.reloadScripts();
        return;
      }
      if (!this.badgesAdded && !this.loading) {
        if (window.__dimensions_embed) {
          window.__dimensions_embed.addBadges();
          this.badgesAdded = true;
        }
      }
      if (!this.altmetricsAdded && !this.loading) {
        const searchResult = this.$refs.searchResult;
        const articleAccordionBody = this.$refs?.articlesAccordion?.$refs?.body;
        if (window._altmetric_embed_init) {
          searchResult && window._altmetric_embed_init(searchResult);
          articleAccordionBody && window._altmetric_embed_init(articleAccordionBody);
          this.altmetricsAdded = true;
        }
      }
    },
    mounted() {
      eventBus.$on("result-entry-show-abstract", this.openArticlesAccordion);
    },
    beforeUnmount() {
      eventBus.$off("result-entry-show-abstract", this.openArticlesAccordion);
    },
    methods: {
      next() {
        this.$emit("high");
        this.badgesAdded = false;
        this.altmetricsAdded = false;
      },
      previous() {
        this.$emit("low");
      },
      reloadScripts() {
        //Remove divs and scripts from body so they wont affect performance
        let scripts = document.body.getElementsByTagName("script");
        var scriptArray = Array.from(scripts);
        scriptArray.splice(0, 1);
        let is = scriptArray.length;
        //ial = is; Unused variable
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
        //(ial = is); Unused variable

        while (is--) {
          containerArray[is].parentNode.removeChild(containerArray[is]);
        }
      },
      getAbstract(id) {
        if (this.abstractRecords[id] != undefined) {
          if (typeof this.abstractRecords[id] !== "string") {
            return "";
          }
          return this.abstractRecords[id];
        }
        return "";
      },
      getAuthor(authors) {
        let str = "";
        for (let i = 0; i < authors.length; i++) {
          if (i > 0) str += ",";
          str += " " + authors[i].name;
        }
        return str;
      },
      getHasAbstract(attributes) {
        if (!attributes) {
          return false;
        }
        let found = false;
        Object.keys(attributes).forEach(function (key) {
          let value = attributes[key];
          if (key == "Has Abstract" || value == "Has Abstract") {
            found = true;
            return;
          }
        });
        return found;
      },
      getDate(history) {
        for (let i = 0; i < history.length; i++) {
          if (history[i].pubstatus == "entrez") {
            let date = new Date(history[i].date);
            let formattedDate = date.toLocaleDateString(languageFormat[this.language], dateOptions);
            return formattedDate;
          }
        }
        return "";
      },
      // getDoi ændret af Ole
      getDoi(articleids) {
        for (let i = 0; i < articleids.length; i++) {
          if (articleids[i].idtype == "doi") {
            let doi = articleids[i].value;
            return doi;
          }
        }
        return "";
      },
      getText(id) {
        if (id != undefined) {
          if (
            this.abstractRecords[id] != undefined &&
            typeof this.abstractRecords[id] === "object"
          ) {
            return this.abstractRecords[id];
          }
        }
        return {};
      },
      getSource(value) {
        try {
          if (this.source != undefined) {
            if (value != undefined) {
              if (value.volume != undefined) value.volume = undefined;
              if (value.issue != undefined) value.issue = undefined;
              if (value.pages != undefined) value.pages = undefined;
              if (value.pubdate != undefined) value.pubdate = undefined;
            }
            return this.source;
          }
          if (value.booktitle) return value.booktitle;
          return value.source;
        } catch (error) {
          return error;
        }
      },
      newSortMethod(event) {
        let obj = {};
        for (let j = 0; j < order.length; j++) {
          if (order[j].method == event.target.value) {
            obj = order[j];
            break;
          }
        }
        this.$emit("newSortMethod", obj);
      },
      isSelected(model) {
        return model == this.sort;
      },
      isSelectedPageSize(model) {
        return model == this.pagesize;
      },
      getString(string) {
        const lg = this.language;
        let constant = messages[string][lg];
        return constant != undefined ? constant : messages[string]["dk"];
      },
      getTranslation(value) {
        const lg = this.language;
        let constant = value.translations[lg];
        return constant != undefined ? constant : value.translations["dk"];
      },
      changePageNumber(event) {
        const newPageSize = pageSizes[parseInt(event.target.options.selectedIndex)];
        this.$emit("newPageSize", newPageSize);
      },
      getComponentWidth() {
        let container = this.$refs.searchResult;
        if (!container) return;

        return parseInt(container.offsetWidth);
      },
      addArticle(article) {
        if (Object.prototype.hasOwnProperty.call(this.articles, article.pmid)) {
          delete this.articles[article.pmid];
        }

        this.$set(this.articles, article.pmid, article);
      },
      getSelectedArticles() {
        var resultEntries = this.$refs.resultEntries;
        var selectedArticles = [];
        var entriesForSummary =
          this.selectedEntries.length > 0
            ? this.selectedEntries
            : resultEntries
                .filter((e) => e.hasAbstract)
                .slice(0, 5)
                .map((e) => {
                  return {
                    uid: e.id,
                  };
                });
        for (let i = 0; i < entriesForSummary.length; i++) {
          let selected = entriesForSummary[i];
          selectedArticles[i] = this.articles[selected.uid];
        }
        return selectedArticles;
      },
      getArticleDtoProvider() {
        return this.getArticleDtos;
      },
      getSearchSummaryPrompts() {
        return searchSummaryPrompts;
      },
      getAbstractSummaryPrompts() {
        return abstractSummaryPrompts;
      },
      getAskQuestionsPrompts() {
        return summarizeArticlePrompt;
      },
      getSummarySuccessHeader() {
        const self = this;

        return (selected, isMarkedArticlesSearch) => {
          if (!isMarkedArticlesSearch) {
            let selectedWithAbstracts = selected.filter(
              (e) => e.abstract != null && e.abstract.trim() != ""
            );
            let before = self.getString("aiSummarizeFirstFewSearchResultHeaderBeforeCount");
            let after = self.getString("aiSummarizeFirstFewSearchResultHeaderAfterCount");
            return before + selectedWithAbstracts.length + after;
          }

          let before = self.getString("aiSummarizeSelectedSearchResultHeaderBeforeCount");
          let after = self.getString("aiSummarizeSelectedSearchResultHeaderAfterCount");
          return before + selected.length + after;
        };
      },
      clickAcceptAi(initialTab = null) {
        this.hasAcceptedAi = true;
        this.initialAiTab = initialTab;
      },
      closeSummaries() {
        this.hasAcceptedAi = false;
      },
      changeResultEntryModel(value, isChecked) {
        let newValue = [...this.selectedEntries];
        let valueIndex = newValue.findIndex(function (e) {
          return e === value || e.uid === value.uid;
        });

        console.log("ValueIndex", valueIndex);

        if (isChecked && valueIndex === -1) {
          newValue.push(value);
        } else if (valueIndex > -1) {
          newValue.splice(valueIndex, 1);
        } else {
          console.warn(
            "changeResultEntryModel: change requested but could not be performed",
            isChecked,
            valueIndex,
            value,
            newValue
          );
          return;
        }
        this.selectedEntries = newValue;
        this.$emit("change:selectedEntries", newValue);
      },
      onAbstractLoad(id, abstract) {
        this.isAbstractLoaded = true;
        Vue.set(this.abstractRecords, id, abstract);
      },
      onAiSummariesClickRetry() {
        this.$el.parentElement
          .querySelector("#qpm_topofsearchbar")
          .scrollIntoView({ behavior: "smooth" });
      },
      /**
       * @param {boolean} expanded
       * @returns {void}
       * @description Callback for when the AI summaries accordion state changes.
       */
      onAiSummariesAccordionStateChange(expanded) {
        this.isSummarizeArticlesAcordionExpanded = expanded;
        this.isSelectedArticleAccordionExpanded = expanded;
      },
      openArticlesAccordion({ $el }) {
        const articlesAccordion = this.$refs.articlesAccordion;
        if (
          !this.isSummarizeArticlesAcordionExpanded &&
          articlesAccordion != null &&
          !articlesAccordion.expanded
        ) {
          articlesAccordion.$once("afterOpen", function () {
            $el.scrollIntoView({
              block: "start",
              behavior: "smooth",
            });
          });
          this.onAiSummariesAccordionStateChange(true);
        }
      },
      onArticleAccordionStateChange(expanded) {
        this.isSelectedArticleAccordionExpanded = expanded;
      },
      onDeselectAllArticles() {
        this.selectedEntries = [];
        this.$emit("change:selectedEntries", this.selectedEntries);
      },
      loadSelectedArticleBadges(article) {
        if (window.__dimensions_embed) {
          window.__dimensions_embed.addBadges();
        }

        let articleBody = article ? article : this.$refs?.articlesAccordion?.$refs?.body;
        if (articleBody && window._altmetric_embed_init) {
          window._altmetric_embed_init(articleBody);
        }
      },
      shouldResultArticlePreloadAbstract(article) {
        const isInFirstFive = this.firstFiveArticlesWithAbstracts.some(function (value) {
          return value.uid == article.uid;
        });
        return isInFirstFive;
      },
      async addIdToLoadAbstract(id) {
        this.idswithAbstractsToLoad.push(id);
        if (this.results[this.results.length - 1].uid == id) {
          await this.loadAbstracts();
        }
      },
      async loadAbstracts() {
        const self = this;
        let nlm = this.appSettings.nlm;
        let baseurl =
          "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&tool=QuickPubMed" +
          "&email=" +
          nlm.email +
          "&api_key=" +
          nlm.key +
          "&retmode=xml&id=";

        let url = baseurl + self.idswithAbstractsToLoad.join(",");
        let axiosInstance = axios.create({
          headers: { Accept: "application/json, text/plain, */*" },
        });
        axiosInstance.interceptors.response.use(undefined, (err) => {
          const { config, message } = err;

          if (!config || !config.retry) {
            console.warn("request retried too many times", config.url);
            return Promise.reject(err);
          }

          // retry while Network timeout or Network Error
          if (!(message.includes("timeout") || message.includes("Network Error"))) {
            return Promise.reject(err);
          }

          config.retry -= 1;

          const retryDelay = 2000;

          const delayRetryRequest = new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, retryDelay);
          });

          return delayRetryRequest.then(() =>
            axiosInstance.get(config.url, { retry: config.retry })
          );
        });

        let loadData = axiosInstance
          .get(url, { retry: 10 })
          .then(function (resp) {
            let data = resp.data;
            let xmlDoc;
            if (window.DOMParser) {
              let parser = new DOMParser();
              xmlDoc = parser.parseFromString(data, "text/xml");
            } else {
              // https://www.npmjs.com/package/winax?activeTab=readme 13 yo package for ActiveXObject
              // eslint-disable-next-line no-undef
              xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
              xmlDoc.async = false;
              xmlDoc.loadXML(data);
            }

            let articles = Array.from(xmlDoc.getElementsByTagName("PubmedArticle"));
            let articleData = articles.map((article) => {
              let pmid = article.getElementsByTagName("PMID")[0].textContent;
              let sections = article.getElementsByTagName("AbstractText");
              if (sections.length == 1) {
                let abstractText = sections[0].textContent;
                return [pmid, abstractText];
              } else {
                let text = {};
                for (let i = 0; i < sections.length; i++) {
                  let sectionName = sections[i].getAttribute("Label");
                  let sectionText = sections[i].textContent;
                  text[sectionName] = sectionText;
                }
                return [pmid, text];
              }
            });

            return articleData;
          })
          .catch(function (err) {
            console.error("Error in fetch from pubMed:", err);
          });

        loadData.then((v) => {
          for (let item of v) {
            this.onAbstractLoad(item[0], item[1]);
          }
        });
      },
    },
  };
</script>
