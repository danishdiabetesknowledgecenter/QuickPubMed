<!-- eslint-disable vue/no-v-html -->
<template>
  <div ref="searchResult" class="qpm_SearchResult">
    <!-- Screen-reader only live region. Announces loading status text
         (e.g. "Søger i PubMed…") so assistive tech users hear progress
         updates without needing to move focus. Visually hidden. -->
    <div class="qpm_srOnly" aria-live="polite" aria-atomic="true">{{ loading ? loadingStatusText : "" }}</div>
    <div v-if="results && results.length > 0" class="qpm_accordions">
      <!-- Accordion menu for using the AI summaries of abstracts from marked result entries -->
      <accordion-menu
        v-if="config.useAI"
        class="qpm_ai_hide"
        @expanded-changed="onAiSummariesAccordionStateChange"
      >
        <template #header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <div class="qpm_aiHeaderRow">
              <div class="qpm_aiHeaderLeft">
                <div>
                  <i
                  class="ri-sparkling-fill"
                  aria-hidden="true"
                  />
                </div>
                <div class="qpm_aiHeaderTitleWrap">
                  <strong>
                    <template v-if="getSelectedResultsAccordionHeaderParts().prefix">
                      {{ getSelectedResultsAccordionHeaderParts().prefix }}
                    </template>
                    <span class="qpm_keepWithIcon">
                      {{ getSelectedResultsAccordionHeaderParts().last }}
                      <button
                        type="button"
                        v-tooltip="{
                          content: getString('hoverselectedResultsAccordionHeader'),
                          distance: 5,
                          delay: $helpTextDelay,
                          theme: 'infoTooltip',
                        }"
                        class="bx bx-info-circle qpm_infoIcon"
                        :aria-label="getString('infoAiSummariesLabel')"
                      />
                    </span>
                  </strong>
                </div>
              </div>
              <div>
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
                  aria-hidden="true"
                />
                <i 
                  v-else 
                  class="bx bx-chevron-down qpm_aiAccordionHeaderArrows" 
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </template>
        <div>
          <div>
              <div
                v-if="!hasAcceptedAi"
                class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
              >
                <p>{{ getString("aiSearchSummaryConsentHeader") }}</p>
                <p v-if="hasNoSelectedArticles">
                  <span v-html="getString('aiSearchSummaryConsentHeaderTextBefore')"></span>
                  <select v-model="defaultSummaryCount" class="qpm_summaryCountSelect">
                    <option v-for="n in Math.min(maxSummaryArticles, 25)" :key="n" :value="n">{{ n }}</option>
                  </select>
                  {{ getString("aiSearchSummaryConsentHeaderTextAfter") }}
                </p>
                <p v-if="getHasSelectedArticles">
                  {{ getString("aiSearchSummarySelectedArticlesBefore") }}
                  <strong>{{ selectedEntriesCount }}{{ ' ' }}</strong>
                  <span v-if="selectedEntriesCount === 1">
                    <strong>{{ getString("aiSearchSummarySelectedArticlesAfterSingular") }}</strong>
                  </span>
                  <span v-if="selectedEntriesCount > 1">
                    <strong>{{ getString("aiSearchSummarySelectedArticlesAfterPlural") }}</strong>
                  </span>{{ getString("aiSearchSummarySelectedArticlesAfter") }}
                </p>
                <p>
                  <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                </p>
                <button
                  v-for="(prompt, index) in getSummarizeMultipleAbstractsPrompt()"
                  :key="`prompt-${prompt.name}-${index}`"
                  type="button"
                  v-tooltip="{
                    content: getString('hoverSummarizeSearchResultButton'),
                    distance: 5,
                    delay: $helpTextDelay,
                  }"
                  class="qpm_button qpm_summaryButton"
                  @click="clickAcceptAi(prompt)"
                >
                  <i
                    class="bx bx-detail"
                    aria-hidden="true"
                  />
                  {{ getTranslation(prompt) }}
                </button>
                <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
              </div>

              <!-- AI summaries of abstracts from inside multiple search results (summarize-article hidden with flag show-summarize-article=false)-->
              <summarize-abstract
                v-else
                :show-summarize-article="false"
                :language="language"
                :prompts="getSummarizeMultipleAbstractsPrompt()"
                :success-header="getSummarySuccessHeader()"
                :is-marked-articles="getHasSelectedArticles"
                :articles-references="getSelectedArticlesReferences"
                :summary-consent-header="getString('aiSearchSummaryConsentHeader')"
                :summary-search-summary-consent-text="getString('aiSearchSummaryConsentHeaderTextBefore')"
                :error-header="getString('aiSummarizeSearchErrorHeader')"
                :has-accepted-ai="hasAcceptedAi"
                :initial-tab-prompt="initialAiTab"
                :get-selected-articles="getSelectedArticles"
                :search-intent="searchIntent"
                @close="closeSummaries"
                @ai-summaries-click-retry="onAiSummariesClickRetry"
              />
          </div>
        </div>
      </accordion-menu>

      <!-- Accordion menu for showing the marked result entries -->
      <accordion-menu
        ref="articlesAccordion"
        :is-expanded="isSelectedArticleAccordionExpanded"
        :models="selectedEntries"
        :open-by-default="hasPreselectedEntries"
        :only-update-model-when-visible="true"
        @changed:items="loadSelectedArticleBadges"
        @open="onArticleAccordionStateChange(true)"
        @close="onArticleAccordionStateChange(false)"
        @after-open="handleArticlesAccordionAfterOpen"
      >
        <template #header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <div class="qpm_selectedHeaderOuter">
              <div
                class="qpm_selectedHeaderInner"
              >
                <div class="qpm_infoInline">
                  <i
                    class="bx bx-check-square"
                    aria-hidden="true"
                  />
                  <strong>
                    <template v-if="getSelectedResultTitleParts().prefix">
                      {{ getSelectedResultTitleParts().prefix }}
                    </template>
                    <span class="qpm_keepWithIcon">
                      {{ getSelectedResultTitleParts().last }}
                      <button
                        v-if="!config.useAI"
                        type="button"
                        v-tooltip="{
                          content: getString('hoverselectedResultTitle'),
                          distance: 5,
                          delay: $helpTextDelay,
                          theme: 'infoTooltip',
                        }"
                        class="bx bx-info-circle qpm_infoIcon"
                        :aria-label="getString('infoSelectedResultsLabel')"
                      />
                      <button
                        v-if="config.useAI"
                        type="button"
                        v-tooltip="{
                          content: getString('hoverselectedResultTitleAI'),
                          distance: 5,
                          delay: $helpTextDelay,
                          theme: 'infoTooltip',
                        }"
                        class="bx bx-info-circle qpm_infoIcon"
                        :aria-label="getString('infoSelectedResultsAiLabel')"
                      />
                    </span>
                  </strong>
                </div>
                <div>
                  <div
                    v-tooltip="{
                      content: getString('hovermarkedArticleCounter'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_markedArticleCounter"
                    :aria-label="getString('hovermarkedArticleCounter')"
                  >
                    <span>{{ selectedEntriesCount }}&nbsp;</span>
                    <span 
                      v-if="selectedEntriesCount === 1"
                      class="qpm_markedArticleCounterText qpm_hideonmobile"
                    >{{ getString("aiSearchSummarySelectedArticlesAfterSingular") }}</span>
                    <span 
                      v-if="selectedEntriesCount > 1 || selectedEntriesCount === 0"
                      class="qpm_markedArticleCounterText qpm_hideonmobile"
                    >{{ getString("aiSearchSummarySelectedArticlesAfterPlural") }}</span>
                  </div>
                </div>
              </div>
              <div>
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
                    aria-hidden="true"
                />
                <i 
                  v-else 
                  class="bx bx-chevron-down qpm_aiAccordionHeaderArrows" 
                    aria-hidden="true"
                />
              </div>  
            </div>
          </div>
        </template>
        <template #default>
          <div 
            class="list-fade-item qpm_selectedResultDeselectAllWrapper"
            name="transition-item-0"
          >
            <div>
              <i
                  class="bx bxs-minus-square"
                  aria-hidden="true"
              />
              <button
                id="qpm_selectedResultDeselectAll"
                type="button"
                class="qpm_button qpm_selectArticleCheckbox"
                :disabled="hasNoSelectedArticles"
                v-tooltip="getHasSelectedArticles ? {
                  content: getString('hoverselectedResultDeselectAllText'),
                  distance: 5,
                  delay: $helpTextDelay,
                } : null"
                @click="onDeselectAllArticles"
              >
                {{ getString("selectedResultDeselectAllText") }}
              </button>
            </div>
            <div
              class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
              v-if="hasNoSelectedArticles"
              v-html="getString('selectedResultEmptyText')"
            />
          </div>
        </template>
        <template #listItem="value">
          <!-- These result-entries are shown under the marked articles accordion -->
          <!-- Do not provide a ref to this intance as it will override and mess up with the existing resultEntries ref-->
          <result-entry
            :key="getResultId(value.model)"
            :id="getResultId(value.model)"
            :pmid="getResultPmid(value.model)"
            :pub-date="value.model.pubdate"
            :volume="value.model.volume"
            :issue="value.model.issue"
            :pages="value.model.pages"
            :doi="getResultDoi(value.model)"
            :title="value.model.title"
            :pub-type="value.model.pubtype"
            :doc-type="value.model.doctype"
            :booktitle="value.model.booktitle"
            :vernaculartitle="value.model.vernaculartitle"
            :date="getDate(value.model)"
            :source="getSource(value.model)"
            :has-abstract="getHasAbstract(value.model.attributes)"
            :author="getAuthor(value.model.authors)"
            :language="language"
            :parent-width="getComponentWidth()"
            :model-value="selectedEntries"
            :value="value.model"
            :selectable="isResultSelectable(value.model)"
            :abstract="getResultInlineAbstract(value.model) || getAbstract(getResultId(value.model))"
            :text="getText(getResultId(value.model))"
            :is-abstract-loaded="isAbstractLoaded"
            @change="(val, checked) => changeResultEntryModel(val, checked)"
            @change:abstractLoad="onAbstractLoad"
            @loadAbstract="addIdToLoadAbstract"
          />
        </template>
      </accordion-menu>
    </div>

    <div v-if="showLoadingProcessList" class="qpm_searchProcessWrapper">
      <p class="qpm_advancedSearch qpm_searchProcessToggleLink">
        <button
          type="button"
          class="qpm_linkButton qpm_linkButtonAsAnchor"
          :aria-expanded="isProcessBoxExpanded"
          :aria-controls="`${srLabelUid}-process`"
          :aria-label="getString('semanticSearchProcessToggleAria')"
          @click="toggleProcessBox"
        >
          {{ getString(isProcessBoxExpanded ? "semanticSearchProcessHide" : "semanticSearchProcessShow") }}
        </button>
      </p>
      <div
        v-if="isProcessBoxExpanded"
        :id="`${srLabelUid}-process`"
        class="qpm_searchProcessBox qpm_box"
      >
        <div class="qpm_searchProcessContent">
          <ul class="qpm_searchProcessList">
            <li
              v-for="group in groupedProcessSteps"
              :key="group.id"
              :class="['qpm_searchProcessGroup', `is-${group.status || 'pending'}`]"
            >
              <div class="qpm_searchProcessGroupLabel">{{ group.label }}</div>
              <ul v-if="group.showChildren" class="qpm_searchProcessSubList">
                <li
                  v-for="step in group.children"
                  :key="step.id"
                  :class="['qpm_searchProcessItem', `is-${step.status || 'pending'}`]"
                >
                  <div class="qpm_searchProcessRow">
                    <span class="qpm_searchProcessLabel">{{ getProcessStepLabel(step) }}</span>
                    <span class="qpm_searchProcessDots" aria-hidden="true">
                      {{ getProcessStepDots(step) }}
                    </span>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <h2
      v-if="results && results.length > 0 && total > 0"
      class="h3 qpm_searchResultHeading"
    >
      {{ getString("searchresult") }}
    </h2>
    <div
      v-if="results && results.length > 0 && total > 0"
      class="qpm_searchHeader qpm_spaceEvenly"
    >
      <p class="qpm_nomargin qpm_searchResultCount" aria-live="polite" aria-atomic="true">
        {{ getString("showing") }} {{ 1 }}-{{ results.length }}
        {{ getString("of") }}
        <span
          ><strong>{{ getPrettyTotal }}</strong> {{ getString("searchMatches") }}</span
        >
      </p>
      <div v-if="results && results.length !== 0" class="qpm_searchHeaderSort qpm_spaceEvenly">
        <div class="qpm_sortSelect qpm_sortSelectSpacing">
          <span :id="`${srLabelUid}-sort`" class="qpm_srOnly">{{ getString('sortBy') }}</span>
          <select :value="currentSortMethod" :aria-labelledby="`${srLabelUid}-sort`" @change="handleSortMethodChange">
            <option v-for="sorter in getOrderMethods" :key="sorter.id" :value="sorter.method">
              {{ getTranslation(sorter) }}
            </option>
          </select>
        </div>

        <div class="qpm_sortSelect qpm_spaceEvenly">
          <span :id="`${srLabelUid}-pagesize`" class="qpm_srOnly">{{ getString('pagesizePerPage') }}</span>
          <select :aria-labelledby="`${srLabelUid}-pagesize`" @change="changePageNumber($event)">
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
      <h3 class="h3"><br />{{ getString("noResult") }}</h3>
      <p>{{ getString("noResultTip") }}</p>
    </div>
    <div
      class="qpm_compactLoadingRegion"
    >
      <div
        v-if="results && results.length > 0 && shouldShowCompactLoadingOverlay"
        class="qpm_compactLoadingOverlay"
      >
        <loading-spinner
          :loading="true"
          :wait-text="compactOverlayLoadingText"
          class="qpm_compactLoadingSpinner"
          :size="32"
        />
      </div>
      <div
        ref="resultsBodyWrapper"
        :class="{ 'qpm_compactLoadingHidden': shouldHideResultsDuringCompactLoading }"
      >
        <div class="qpm_resultEntriesLayer">
          <span id="qpm_selectArticleCheckboxDescription" class="qpm_srOnly">
            {{ getString("selectArticleCheckboxDescription") }}
          </span>
          <ul class="qpm_resetList qpm_resultEntriesList">
            <li
              v-for="(value, index) in getShownSearchResults"
              :key="getResultId(value) || `result-${index}`"
              class="qpm_ResultEntryWrapper"
            >
              <result-entry
                :id="getResultId(value)"
                ref="resultEntries"
                :pmid="getResultPmid(value)"
                :volume="value.volume"
                :issue="value.issue"
                :pages="value.pages"
                :doi="getResultDoi(value)"
                :title="value.title"
                :pub-date="value.pubdate"
                :pub-type="value.pubtype"
                :doc-type="value.doctype"
                :booktitle="value.booktitle"
                :vernaculartitle="value.vernaculartitle"
                :date="getDate(value)"
                :source="getSource(value)"
                :has-abstract="getHasAbstract(value.attributes)"
                :author="getAuthor(value.authors)"
                :language="language"
                :parent-width="getComponentWidth()"
                :model-value="selectedEntries"
                :selectable="isResultSelectable(value)"
                :abstract="getResultInlineAbstract(value) || getAbstract(getResultId(value))"
                :text="getText(getResultId(value))"
                :value="value"
                :is-abstract-loaded="isAbstractLoaded"
                @change="changeResultEntryModel"
                @change:abstractLoad="onAbstractLoad"
                @articleUpdated="addArticle"
                @loadAbstract="addIdToLoadAbstract"
              />
            </li>
          </ul>
          <loading-spinner
            v-if="!compactLoadingUi"
            :loading="loading"
            :wait-text="showLoadingProcessList ? '' : loadingStatusText"
            class="qpm_searchMore"
            :size="44"
          />
          <div v-if="error !== null && error !== undefined" class="qpm_flex">
            <div class="qpm_errorBox" role="alert" aria-live="assertive">
              {{ error.message ?? error.toString() }}
            </div>
          </div>
        </div>
        <div
          v-if="total > 0"
          class="qpm_flex qpm_paginationContainer"
        >
          <button
            v-if="results && results.length < total"
            type="button"
            :disabled="highDisabled"
            :class="{ qpm_disabled: highDisabled }"
            class="qpm_button qpm_dark"
            @click="next"
          >
            <span>{{ getString("next") }}</span>
            {{ pagesize }}
          </button>
          <div
            v-if="compactLoadingUi && !hideResultsDuringCompactLoading && loading"
            class="qpm_paginationInlineSpinner"
          >
            <loading-spinner
              :loading="loading"
              :wait-text="loadingStatusText"
              class="qpm_searchMore"
              :size="32"
            />
          </div>
          <p v-if="!loading || (results && high && total)" class="qpm_nomargin qpm_shownumber">
            {{ getString("showing") }} 1-{{ results.length }} {{ getString("of") }}
            <span
              ><strong>{{ getPrettyTotal }}</strong> {{ getString("searchMatches") }}</span
            >
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from "axios";
  import { config } from "@/config/config.js";
  import ResultEntry from "@/components/ResultEntry.vue";
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeAbstract from "@/components/SummarizeAbstract.vue";
  import { order } from "@/assets/content/order.js";
  import { summarizeMultipleAbstractPrompt } from "@/assets/prompts/abstract";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { appSettingsMixin, eventBus } from "@/mixins/appSettings";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { dateOptions, languageFormat, pageSizes } from "@/utils/contentHelpers";
  import {
    areComparableIdsEqual,
    extractDoi,
    formatPublicationInfo,
    getAbstractEntriesFromPubMedXml,
    getArticleSource,
    getAuthorNames,
    getFormattedEntrezDate,
    hasDefinedValue,
    hasXmlParserError,
    getLocalizedTranslation,
    hasAbstractAttribute,
    parsePubMedXml,
  } from "@/utils/componentHelpers";

  export default {
    name: "SearchResult",
    components: {
      AccordionMenu,
      ResultEntry,
      LoadingSpinner,
      SummarizeAbstract,
    },
    emits: ["newSortMethod", "high", "newPageSize", "change:selectedEntries"],
    mixins: [appSettingsMixin, promptRuleLoaderMixin, utilitiesMixin],
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
      high: {
        type: Number,
        default: 0,
      },
      loading: Boolean,
      compactLoadingUi: {
        type: Boolean,
        default: false,
      },
      hideResultsDuringCompactLoading: {
        type: Boolean,
        default: false,
      },
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
      searchIntent: {
        type: String,
        default: "",
      },
      loadingStatusText: {
        type: String,
        default: "",
      },
      loadingProcessSteps: {
        type: Array,
        default: () => [],
      },
      entriesAlwaysSelectable: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        srLabelUid: `qpm-sr-${Math.random().toString(36).slice(2, 10)}`,
        hasAcceptedAi: false,
        initialAiTab: null,
        defaultSummaryCount: 5,
        localSortLoadingHideResults: false,
        selectedEntries: Array.isArray(this.preselectedEntries) ? [...this.preselectedEntries] : [],
        badgesAdded: false,
        altmetricsAdded: false,
        idswithAbstractsToLoad: [],
        abstractRecords: {}, // id, abstract
        isAbstractLoaded: false,
        articles: {},
        isSummarizeArticlesAcordionExpanded: false,
        isSelectedArticleAccordionExpanded: false,
        hadVisibleResultEntries: false,
        _pendingScrollTarget: null,
        _selectedBadgesRetryTimeouts: [],
        _abstractLoadTimerId: null,
        _abstractLoadInFlight: false,
        processDotCount: 3,
        _processDotsIntervalId: null,
        persistedLoadingProcessSteps: [],
        isProcessBoxExpanded: true,
      };
    },
    computed: {
      activeLoadingProcessSteps() {
        return Array.isArray(this.loadingProcessSteps) ? this.loadingProcessSteps : [];
      },
      visibleLoadingProcessSteps() {
        if (this.loading && this.activeLoadingProcessSteps.length > 0) {
          return this.activeLoadingProcessSteps;
        }
        return !this.loading && Array.isArray(this.persistedLoadingProcessSteps)
          ? this.persistedLoadingProcessSteps
          : [];
      },
      showLoadingProcessList() {
        return this.visibleLoadingProcessSteps.length > 0;
      },
      hasAnimatedProcessSteps() {
        return this.visibleLoadingProcessSteps.some((step) => String(step?.status || "").trim() === "current");
      },
      groupedProcessSteps() {
        const groupDefinitions = [
          {
            id: "prepare",
            label: this.getString("semanticSearchProcessGroupPrepare"),
            childIds: ["prepare", "searchString", "mesh", "optimize"],
          },
          {
            id: "sources",
            label: this.getString("semanticSearchProcessGroupSources"),
            childIds: ["pubmed", "semanticScholar", "openAlex", "elicit"],
          },
          {
            id: "finalizeCollect",
            label: this.getString("semanticSearchProcessGroupMatch"),
            childIds: [
              "finalizeCollect",
              "finalizeValidatePmid",
              "finalizeValidateDoiFetch",
              "finalizeValidateDoiRules",
            ],
          },
          {
            id: "finalizeHydrate",
            label: this.getString("semanticSearchProcessGroupDisplay"),
            childIds: ["finalizeHydrate", "finalizeSort", "finalizeRender", "finalizeSelected"],
          },
        ];
        return groupDefinitions
          .map((group) => {
            const children = this.visibleLoadingProcessSteps.filter((step) =>
              group.childIds.includes(step.id)
            );
            if (children.length === 0) {
              return null;
            }
            const visibleChildren = this.getVisibleProcessGroupChildren(children);
            return {
              id: group.id,
              label: group.label,
              status: this.getProcessGroupStatus(children),
              showChildren: this.shouldShowProcessGroupChildren(children),
              children: visibleChildren,
            };
          })
          .filter(Boolean);
      },
      shouldHideResultsDuringCompactLoading() {
        return (
          (this.compactLoadingUi && this.hideResultsDuringCompactLoading && this.loading) ||
          this.localSortLoadingHideResults
        );
      },
      shouldShowCompactLoadingOverlay() {
        return this.results && this.results.length > 0 && this.shouldHideResultsDuringCompactLoading;
      },
      compactOverlayLoadingText() {
        return this.loadingStatusText || this.getString("sortResultsLoadingText");
      },
      /**
       * Gets the text that composes the references. Consists of authors title and publicationInfo
       * If no entries are selected, it will use the first five results
       * @returns {Array} Array of objects with authors, publicationInfo and title
       */
      getSelectedArticlesReferences() {
        const selected = this.safeSelectedEntries;
        const sourceEntries =
          selected.length === 0 ? this.firstFiveArticlesWithAbstracts : selected;
        return sourceEntries.map((entry) => {
          return {
            authors: this.getAuthor(entry.authors),
            publicationInfo: this.getPublicationInfo(entry),
            title: entry.title,
          };
        });
      },
      config() {
        return config;
      },
      currentSortMethod() {
        return this.sort.method;
      },
      highDisabled() {
        return this.high >= this.total || this.loading;
      },
      getPrettyTotal() {
        const format = languageFormat[this.language];
        return this.total.toLocaleString(format);
      },
      getOrderMethods() {
        return order;
      },
      getPageSizeProps() {
        return pageSizes;
      },
      getShownSearchResults() {
        if (!Array.isArray(this.results)) return [];
        const preselectedCount = Array.isArray(this.preselectedEntries)
          ? this.preselectedEntries.length
          : 0;
        return this.results.slice(0, this.high + preselectedCount);
      },
      getHasSelectedArticles() {
        return this.safeSelectedEntries.length > 0;
      },
      selectedEntriesCount() {
        return this.safeSelectedEntries.length;
      },
      hasNoSelectedArticles() {
        return this.selectedEntriesCount === 0;
      },
      hasPreselectedEntries() {
        return Array.isArray(this.preselectedEntries) && this.preselectedEntries.length > 0;
      },
      safeSelectedEntries() {
        return Array.isArray(this.selectedEntries) ? this.selectedEntries : [];
      },
      resultsWithAbstracts() {
        if (!Array.isArray(this.results)) return [];
        return this.results.filter((result) => {
          const resultId = this.getResultId(result);
          const hasInlineAbstract = this.getResultInlineAbstract(result) !== "";
          const hasLoadedAbstractSections =
            hasDefinedValue(resultId) && Object.keys(this.getText(resultId)).length > 0;
          const canLoadPubMedAbstract =
            this.getHasAbstract(result.attributes) && this.canFetchPubMedAbstractForResult(result);
          return hasInlineAbstract || hasLoadedAbstractSections || canLoadPubMedAbstract;
        });
      },
      /**
       * Max number of articles available for summarization (those with abstracts).
       * Used to cap the dropdown options.
       */
      maxSummaryArticles() {
        return this.resultsWithAbstracts.length;
      },
      firstFiveArticlesWithAbstracts() {
        return this.resultsWithAbstracts.slice(0, this.defaultSummaryCount);
      },
      firstFiveArticlesWithAbstractIdsSignature() {
        return this.firstFiveArticlesWithAbstracts
          .map((result) => this.getResultId(result))
          .filter((id) => hasDefinedValue(id))
          .join("|");
      },
      shownFetchableAbstractIdsSignature() {
        return this.getShownSearchResults
          .filter((result) => {
            const resultId = this.getResultId(result);
            if (!hasDefinedValue(resultId)) return false;
            if (!this.canFetchPubMedAbstractForResult(result)) return false;
            if (this.getResultInlineAbstract(result)) return false;
            return !this.abstractRecords[resultId];
          })
          .map((result) => this.getResultId(result))
          .filter((id) => hasDefinedValue(id))
          .join("|");
      },
    },
    watch: {
      loading(newVal) {
        if (newVal) {
          if (!this.compactLoadingUi) {
            this.persistedLoadingProcessSteps = [];
            this.isProcessBoxExpanded = true;
          }
          this.isAbstractLoaded = false;
          this.defaultSummaryCount = 5;
          this.idswithAbstractsToLoad = [];
          this.clearScheduledAbstractLoad();
        } else {
          // If the search was cancelled mid-flight (e.g. the user edited the
          // form), the parent resets `results` to undefined/null. In that case
          // also drop the persisted process steps so the "Vis søgeprocessen"
          // toggle disappears together with the rest of the search UI.
          if (this.results === undefined || this.results === null) {
            this.persistedLoadingProcessSteps = [];
            this.isProcessBoxExpanded = false;
          } else {
            this.persistedLoadingProcessSteps = this.normalizePersistedLoadingProcessSteps(
              this.persistedLoadingProcessSteps
            );
            if (this.persistedLoadingProcessSteps.length > 0) {
              this.isProcessBoxExpanded = false;
            }
          }
          this.setLocalSortLoadingState(false);
          this.queueVisibleAbstractLoads();
        }
      },
      loadingProcessSteps: {
        handler(newVal) {
          if (!Array.isArray(newVal) || newVal.length === 0) {
            return;
          }
          this.persistedLoadingProcessSteps = this.cloneLoadingProcessSteps(newVal);
        },
        immediate: true,
      },
      results(newVal) {
        if (!this.loading && !Array.isArray(newVal)) {
          this.persistedLoadingProcessSteps = [];
          this.isProcessBoxExpanded = false;
        }
      },
      preselectedEntries(newVal) {
        if (this.safeSelectedEntries.length > 0) {
          return;
        }
        this.selectedEntries = Array.isArray(newVal) ? [...newVal] : [];
      },
      /**
       * When user increases the summary count, load abstracts for any
       * newly included articles that haven't been fetched yet.
       */
      defaultSummaryCount() {
        this.loadMissingAbstracts();
      },
      firstFiveArticlesWithAbstractIdsSignature() {
        if (!this.loading) {
          this.loadMissingAbstracts();
        }
      },
      shownFetchableAbstractIdsSignature() {
        if (!this.loading) {
          this.queueVisibleAbstractLoads();
        }
      },
      /**
       * Cap defaultSummaryCount to available articles when results change.
       */
      maxSummaryArticles(newMax) {
        if (newMax > 0 && this.defaultSummaryCount > newMax) {
          this.defaultSummaryCount = newMax;
        } else if (newMax > 0 && newMax < 5) {
          this.defaultSummaryCount = newMax;
        } else if (newMax >= 5 && this.defaultSummaryCount > newMax) {
          this.defaultSummaryCount = 5;
        }
      },
      hasAnimatedProcessSteps(newVal) {
        if (newVal) {
          this.startProcessDotsInterval();
        } else {
          this.clearProcessDotsInterval();
        }
      },
    },
    updated() {
      // Guards to avoid badges re-rendering on select/deselect
      const resultEntries = this.$refs.resultEntries;
      const hasVisibleResultEntries =
        Array.isArray(resultEntries) && resultEntries.length > 0;

      if (!hasVisibleResultEntries) {
        if (this.hadVisibleResultEntries) {
          this.hasAcceptedAi = false;
          this.badgesAdded = false;
          this.altmetricsAdded = false;
          this.isSummarizeArticlesAcordionExpanded = false;
          this.reloadScripts();
        }
        this.hadVisibleResultEntries = false;
        return;
      }
      this.hadVisibleResultEntries = true;
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
      eventBus.on("result-entry-show-abstract", this.openArticlesAccordion);
      if (this.hasAnimatedProcessSteps) {
        this.startProcessDotsInterval();
      }
    },
    beforeUnmount() {
      eventBus.off("result-entry-show-abstract", this.openArticlesAccordion);
      this.clearSelectedBadgeRetries();
      this.clearScheduledAbstractLoad();
      this.clearProcessDotsInterval();
    },
    methods: {
      // Sorting needs an immediate visual hide to avoid the staggered fade we saw with reactive-only updates.
      setResultsBodyVisibility(hidden) {
        const wrapper = this.$refs?.resultsBodyWrapper;
        if (!wrapper || !wrapper.style) return;
        wrapper.style.opacity = hidden ? "0" : "";
        wrapper.style.pointerEvents = hidden ? "none" : "";
      },
      setLocalSortLoadingState(hidden) {
        this.setResultsBodyVisibility(hidden);
        this.localSortLoadingHideResults = hidden;
      },
      // Wait for Vue + the browser to paint before emitting the sort change, so the compact spinner is visible first.
      async waitForNextPaint() {
        await this.$nextTick();
        await new Promise((resolve) => {
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
          } else {
            setTimeout(resolve, 0);
          }
        });
      },
      startProcessDotsInterval() {
        this.clearProcessDotsInterval();
        this.processDotCount = 3;
        this._processDotsIntervalId = setInterval(() => {
          this.processDotCount = (this.processDotCount % 5) + 1;
        }, 400);
      },
      clearProcessDotsInterval() {
        if (this._processDotsIntervalId !== null) {
          clearInterval(this._processDotsIntervalId);
          this._processDotsIntervalId = null;
        }
      },
      clearScheduledAbstractLoad() {
        if (this._abstractLoadTimerId !== null) {
          clearTimeout(this._abstractLoadTimerId);
          this._abstractLoadTimerId = null;
        }
      },
      cloneLoadingProcessSteps(steps = []) {
        return (Array.isArray(steps) ? steps : [])
          .filter((step) => step && step.id)
          .map((step) => ({
            id: String(step.id || "").trim(),
            label: String(step.label || "").trim(),
            status: String(step.status || "pending").trim() || "pending",
          }));
      },
      normalizePersistedLoadingProcessSteps(steps = []) {
        return this.cloneLoadingProcessSteps(steps).map((step) => ({
          ...step,
          status: step.status === "current" ? "completed" : step.status,
        }));
      },
      getProcessGroupStatus(children = []) {
        const normalizedChildren = Array.isArray(children) ? children : [];
        if (normalizedChildren.some((child) => child?.status === "current")) {
          return "current";
        }
        if (normalizedChildren.length > 0 && normalizedChildren.every((child) => child?.status === "completed")) {
          return "completed";
        }
        if (normalizedChildren.some((child) => child?.status === "completed")) {
          return "current";
        }
        return "pending";
      },
      shouldShowProcessGroupChildren(children = []) {
        const normalizedChildren = Array.isArray(children) ? children : [];
        if (!this.loading) {
          return this.getVisibleProcessGroupChildren(normalizedChildren).length > 0;
        }
        return normalizedChildren.some((child) => child?.status === "current" || child?.status === "completed");
      },
      getVisibleProcessGroupChildren(children = []) {
        const normalizedChildren = Array.isArray(children) ? children : [];
        if (this.loading) {
          return normalizedChildren;
        }
        return normalizedChildren.filter((child) => child?.status !== "pending");
      },
      toggleProcessBox() {
        this.isProcessBoxExpanded = !this.isProcessBoxExpanded;
      },
      getProcessStepLabel(step) {
        return String(step?.label || "")
          .replace(/\s*[.!?]+\s*$/, "")
          .trimEnd();
      },
      getProcessStepDots(step) {
        const status = String(step?.status || "").trim();
        if (status === "completed") {
          return ".";
        }
        if (status === "current") {
          return ".".repeat(Math.max(1, Math.min(5, this.processDotCount)));
        }
        return "...";
      },
      getResultId(result) {
        return result?.id ?? result?.uid ?? null;
      },
      getResultPmid(result) {
        const pmid = result?.pmid ?? result?.uid;
        const normalized = String(pmid ?? "").trim();
        return /^[0-9]+$/.test(normalized) ? normalized : undefined;
      },
      getResultDoi(result) {
        const directDoi = String(result?.doi || "").trim();
        if (directDoi) return directDoi;
        return extractDoi(result?.articleids);
      },
      getResultReferenceId(result) {
        const pmid = this.getResultPmid(result);
        if (pmid) return pmid;
        const doi = this.getResultDoi(result);
        if (doi) return doi;
        return this.getResultId(result);
      },
      getResultInlineAbstract(result) {
        const abstract = result?.abstract;
        return typeof abstract === "string" ? abstract : "";
      },
      getSelectionEntryId(entry) {
        if (!entry || typeof entry !== "object") {
          const fallback = String(entry ?? "").trim();
          return fallback || null;
        }
        return entry?.id ?? entry?.uid ?? entry?.pmid ?? null;
      },
      canFetchPubMedAbstractForResult(result) {
        if (!result || typeof result !== "object") return false;
        if (result.canFetchPubMedAbstract === false) return false;
        const pmid = this.getResultPmid(result);
        return hasDefinedValue(pmid);
      },
      isResultSelectable(result) {
        return this.entriesAlwaysSelectable || this.hasAcceptedAi;
      },
      next() {
        this.$emit("high");
        this.badgesAdded = false;
        this.altmetricsAdded = false;
      },
      reloadScripts() {
        //Remove divs and scripts from body so they wont affect performance
        const scripts = document.body.getElementsByTagName("script");
        const scriptArray = Array.from(scripts);
        scriptArray.splice(0, 1);
        const isAltmetricScript = (script) =>
          script?.src?.startsWith("https://api.altmetric.com/v1/pmid") ||
          script?.src?.startsWith("https://api.altmetric.com/v1/doi");

        for (const script of scriptArray.slice().reverse()) {
          if (isAltmetricScript(script)) {
            script.parentNode.removeChild(script);
          }
        }
        const containers = document.body.getElementsByClassName(
          "altmetric-embed altmetric-popover altmetric-left"
        );
        const containerArray = Array.from(containers);
        for (const container of containerArray.slice().reverse()) {
          container.parentNode.removeChild(container);
        }
      },
      getAbstract(id) {
        const record = this.getAbstractRecord(id);
        return typeof record === "string" ? record : "";
      },
      // Writes out all names of the authors array, split by comma
      getAuthor(authors) {
        return getAuthorNames(authors);
      },
      getHasAbstract(attributes) {
        return hasAbstractAttribute(attributes);
      },
      getDate(value) {
        const history = Array.isArray(value?.history) ? value.history : [];
        if (history.length > 0) {
          return getFormattedEntrezDate(history, this.language);
        }
        const publicationDate = String(value?.publicationDate || "").trim();
        if (publicationDate) {
          const parsedDate = new Date(publicationDate);
          if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toLocaleDateString(languageFormat[this.language], dateOptions);
          }
        }
        return "";
      },
      // Read DOI from the article identifiers list
      getDoi(articleids) {
        return extractDoi(articleids);
      },
      getText(id) {
        const record = this.getAbstractRecord(id);
        return record && typeof record === "object" ? record : {};
      },
      getAbstractRecord(id) {
        if (!hasDefinedValue(id)) return undefined;
        return this.abstractRecords[id];
      },
      getSource(value) {
        try {
          return getArticleSource(value);
        } catch (error) {
          return error;
        }
      },
      getPublicationInfo(entry) {
        return formatPublicationInfo(entry);
      },
      async handleSortMethodChange(event) {
        const nextMethod = String(event?.target?.value || "").trim();
        if (!nextMethod || nextMethod === this.sort.method) {
          return;
        }

        this.setLocalSortLoadingState(true);
        await this.waitForNextPaint();

        const obj = order.find((entry) => entry.method === nextMethod) || {};
        this.$emit("newSortMethod", obj);
      },
      isSelectedPageSize(model) {
        return model === this.pagesize;
      },
      getTranslation(value) {
        return getLocalizedTranslation(value, this.language);
      },
      splitLastWord(text) {
        const normalized = String(text || "").trim();
        const lastSpace = normalized.lastIndexOf(" ");
        if (lastSpace < 0) {
          return { prefix: "", last: normalized };
        }
        return {
          prefix: normalized.slice(0, lastSpace) + " ",
          last: normalized.slice(lastSpace + 1),
        };
      },
      getSelectedResultsAccordionHeaderParts() {
        return this.splitLastWord(this.getString("selectedResultsAccordionHeader"));
      },
      getSelectedResultTitleParts() {
        return this.splitLastWord(this.getString("selectedResultTitle"));
      },
      changePageNumber(event) {
        const selectedIndex = parseInt(event.target.options.selectedIndex, 10);
        const newPageSize = pageSizes[selectedIndex];
        if (newPageSize === undefined) return;
        this.$emit("newPageSize", newPageSize);
      },
      getComponentWidth() {
        const container = this.$refs.searchResult;
        if (!container) return;

        return container.offsetWidth;
      },
      addArticle(article) {
        const articleId = this.getSelectionEntryId(article);
        if (!articleId) return;
        if (Object.prototype.hasOwnProperty.call(this.articles, articleId)) {
          delete this.articles[articleId];
        }

        this.articles[articleId] = article;
      },
      getSelectedArticles() {
        const selectedArticles = [];
        const selectedEntries = this.safeSelectedEntries;
        const entriesForSummary =
          selectedEntries.length > 0
            ? selectedEntries
            : // Use all loaded results (not just rendered ones) to support counts > pagesize
              this.firstFiveArticlesWithAbstracts.map((r) => ({
                id: this.getResultId(r),
                uid: this.getResultId(r),
              }));

        for (const selected of entriesForSummary) {
          const selectedId = this.getSelectionEntryId(selected);
          if (selectedId && this.articles[selectedId]) {
            selectedArticles.push(this.articles[selectedId]);
          } else {
            // Build article object from results data for non-rendered articles
            const result = this.results?.find((r) =>
              areComparableIdsEqual(this.getResultId(r), this.getResultId(selected))
            );
            if (result) {
              const resultId = this.getResultId(result);
              const abstract = this.getResultInlineAbstract(result) || this.getAbstract(resultId);
              selectedArticles.push({
                id: resultId,
                referenceId: this.getResultReferenceId(result),
                pmid: this.getResultPmid(result),
                doi: this.getResultDoi(result),
                title: result.title || "",
                abstract: abstract || "",
                authors: result.authors || [],
                source: result.source || result.fulljournalname || "",
                pubdate: result.pubdate || "",
              });
            }
          }
        }
        return selectedArticles.filter((article) => String(article?.abstract || "").trim() !== "");
      },
      getArticleDtoProvider() {
        return this.getArticleDtos;
      },
      getSummarizeMultipleAbstractsPrompt() {
        return summarizeMultipleAbstractPrompt;
      },
      getSummarySuccessHeader() {
        return (selected, isMarkedArticlesSearch) => {
          const safeSelected = Array.isArray(selected) ? selected : [];
          if (!isMarkedArticlesSearch) {
            const selectedWithAbstracts = safeSelected.filter(
              (e) => e.abstract !== null && e.abstract.trim() !== ""
            );
            const before = this.getString("aiSummarizeFirstFewSearchResultHeaderBeforeCount");
            const after = this.getString("aiSummarizeFirstFewSearchResultHeaderAfterCount");
            return before + selectedWithAbstracts.length + after;
          }

          const before = this.getString("aiSummarizeSelectedSearchResultHeaderBeforeCount");
          const after = this.getString("aiSummarizeSelectedSearchResultHeaderAfterCount");
          return before + safeSelected.length + after;
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
        // Guard against accidental native DOM change events bubbling from child roots.
        // We only handle the component-emitted payload: (articleValue, booleanChecked).
        if (value && typeof value === "object" && value.type === "change" && value.target) {
          return;
        }
        if (typeof isChecked !== "boolean") {
          return;
        }
        const currentSelected = this.safeSelectedEntries;
        const newValue = [...currentSelected];
        const targetId = this.getSelectionEntryId(value);
        const valueIndex = newValue.findIndex(
          (entry) => entry === value || areComparableIdsEqual(this.getSelectionEntryId(entry), targetId)
        );

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
        if (!hasDefinedValue(id)) return;
        this.isAbstractLoaded = true;
        this.abstractRecords[id] = abstract;
      },
      onAiSummariesClickRetry() {
        const container = this.$el?.parentElement;
        const target = container?.querySelector("#qpm_topofsearchbar");
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
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
      openArticlesAccordion(payload) {
        const targetEl = payload?.$el;
        if (!targetEl) return;
        const articlesAccordion = this.$refs.articlesAccordion;
        const shouldOpenAccordion =
          !this.isSummarizeArticlesAcordionExpanded &&
          articlesAccordion &&
          !articlesAccordion.expanded;
        if (shouldOpenAccordion) {
          this._pendingScrollTarget = targetEl;
          this.onAiSummariesAccordionStateChange(true);
        }
      },
      handleArticlesAccordionAfterOpen() {
        if (this._pendingScrollTarget) {
          this._pendingScrollTarget.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
          this._pendingScrollTarget = null;
        }
      },
      onArticleAccordionStateChange(expanded) {
        this.isSelectedArticleAccordionExpanded = expanded;
        if (expanded) {
          this.loadSelectedArticleBadges();
        }
      },
      onDeselectAllArticles() {
        this.selectedEntries = [];
        this.$emit("change:selectedEntries", this.selectedEntries);
      },
      loadSelectedArticleBadges(article) {
        const articleBody = article ?? this.$refs?.articlesAccordion?.$refs?.body;
        this.clearSelectedBadgeRetries();
        this.refreshSelectedArticleBadges(articleBody);

        // Harden dynamic rendering: retry badge init a few times
        // because selected entries can be mounted asynchronously.
        const retryDelays = [200, 500, 900, 1400, 2000];
        this._selectedBadgesRetryTimeouts = retryDelays.map((delay) =>
          setTimeout(() => this.refreshSelectedArticleBadges(articleBody), delay)
        );
      },
      clearSelectedBadgeRetries() {
        if (!Array.isArray(this._selectedBadgesRetryTimeouts)) {
          this._selectedBadgesRetryTimeouts = [];
          return;
        }
        this._selectedBadgesRetryTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        this._selectedBadgesRetryTimeouts = [];
      },
      refreshSelectedArticleBadges(articleBody) {
        if (window.__dimensions_embed) {
          window.__dimensions_embed.addBadges();
        }

        if (articleBody && window._altmetric_embed_init) {
          window._altmetric_embed_init(articleBody);
        }
      },
      /**
       * Loads abstracts for articles in firstFiveArticlesWithAbstracts
       * that haven't been fetched yet (e.g., beyond the current page).
       */
      async loadMissingAbstracts() {
        const missingIds = this.firstFiveArticlesWithAbstracts
          .filter((r) => {
            const resultId = this.getResultId(r);
            if (!hasDefinedValue(resultId)) return false;
            if (!this.canFetchPubMedAbstractForResult(r)) return false;
            if (this.getResultInlineAbstract(r)) return false;
            return !this.abstractRecords[resultId];
          })
          .map((r) => this.getResultId(r))
          .filter((id) => hasDefinedValue(id));

        this.queueAbstractLoadIds(missingIds);
      },
      queueVisibleAbstractLoads() {
        const visibleIds = this.getShownSearchResults
          .filter((result) => {
            const resultId = this.getResultId(result);
            if (!hasDefinedValue(resultId)) return false;
            if (!this.canFetchPubMedAbstractForResult(result)) return false;
            if (this.getResultInlineAbstract(result)) return false;
            return !this.abstractRecords[resultId];
          })
          .map((result) => this.getResultId(result))
          .filter((id) => hasDefinedValue(id));
        this.queueAbstractLoadIds(visibleIds);
      },
      queueAbstractLoadIds(ids = []) {
        const normalizedIds = Array.from(
          new Set(
            (Array.isArray(ids) ? ids : [])
              .map((id) => String(id || "").trim())
              .filter((id) => /^[0-9]+$/.test(id) && !this.abstractRecords[id])
          )
        );
        if (normalizedIds.length === 0) {
          return;
        }
        const pendingIds = new Set(
          (Array.isArray(this.idswithAbstractsToLoad) ? this.idswithAbstractsToLoad : [])
            .map((id) => String(id || "").trim())
            .filter((id) => /^[0-9]+$/.test(id) && !this.abstractRecords[id])
        );
        normalizedIds.forEach((id) => pendingIds.add(id));
        this.idswithAbstractsToLoad = Array.from(pendingIds);
        this.scheduleAbstractLoad();
      },
      scheduleAbstractLoad() {
        if (this.loading || this._abstractLoadInFlight) {
          return;
        }
        if (!Array.isArray(this.idswithAbstractsToLoad) || this.idswithAbstractsToLoad.length === 0) {
          return;
        }
        if (this._abstractLoadTimerId !== null) {
          return;
        }
        this._abstractLoadTimerId = setTimeout(() => {
          this._abstractLoadTimerId = null;
          this.loadAbstracts();
        }, 0);
      },
      shouldResultArticlePreloadAbstract(article) {
        return this.firstFiveArticlesWithAbstracts.some((value) =>
          areComparableIdsEqual(this.getResultId(value), this.getResultId(article))
        );
      },
      async addIdToLoadAbstract(id) {
        this.queueAbstractLoadIds([id]);
      },
      async loadAbstracts() {
        if (this._abstractLoadInFlight) {
          return;
        }
        if (!Array.isArray(this.idswithAbstractsToLoad) || this.idswithAbstractsToLoad.length === 0) {
          return;
        }
        const pendingIds = Array.from(
          new Set(
            this.idswithAbstractsToLoad.filter((id) => /^[0-9]+$/.test(String(id || "").trim()))
          )
        );
        const batchIds = pendingIds.filter((id) => !this.abstractRecords[id]);
        this.idswithAbstractsToLoad = [];
        if (batchIds.length === 0) {
          return;
        }
        this._abstractLoadInFlight = true;
        const nlm = this.appSettings.nlm;
        // Credentials handled by PHP proxy
        const baseurl = `${nlm.proxyUrl}/NlmFetch.php?db=pubmed&retmode=xml&id=`;

        const url = baseurl + batchIds.join(",");
        const axiosInstance = axios.create({
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

        try {
          const resp = await axiosInstance.get(url, { retry: 10 });
          const data = resp.data;
          const xmlDoc = parsePubMedXml(data);

          if (hasXmlParserError(xmlDoc)) {
            console.warn("loadAbstracts: invalid XML response");
            return;
          }
          const abstractEntries = getAbstractEntriesFromPubMedXml(xmlDoc, { includeEmptySections: true });
          for (const [articleId, abstractValue] of abstractEntries) {
            this.onAbstractLoad(articleId, abstractValue);
          }
        } catch (err) {
          console.error("Error in fetch from pubMed:", err);
        } finally {
          this._abstractLoadInFlight = false;
          if (Array.isArray(this.idswithAbstractsToLoad) && this.idswithAbstractsToLoad.length > 0) {
            this.scheduleAbstractLoad();
          }
        }
      },
    },
  };
</script>

<style scoped>
.qpm_compactLoadingRegion {
  position: relative;
}

.qpm_compactLoadingOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 28px;
  z-index: 2;
}

.qpm_compactLoadingHidden {
  opacity: 0;
  pointer-events: none;
}

.qpm_paginationInlineSpinner {
  display: flex;
  align-items: center;
  min-height: 44px;
}

.qpm_paginationInlineSpinner :deep(.qpm_searchMore.qpm_loading) {
  position: static;
  top: auto;
  left: auto;
  transform: none;
  margin-top: 0;
}
</style>

