<template>
  <div :lang="language === 'en' ? 'en' : 'da'">
    <div :id="getComponentId" :class="{ mugin_formCollapsed: isCollapsed }">
      <form class="mugin_searchform" role="search" @submit.prevent>
        <!-- The tabs for toggling between advanced or simple search -->
        <advanced-search-toggle
          :advanced="advanced"
          :is-collapsed="isCollapsed"
          :get-string="getString"
          :simple-tab-id="getSearchModeSimpleTabId"
          :advanced-tab-id="getSearchModeAdvancedTabId"
          :simple-panel-id="getSearchModeSimplePanelId"
          :advanced-panel-id="getSearchModeAdvancedPanelId"
          @toggle-advanced="advancedClick"
        />

        <div class="mugin_top">
          <!-- Show or hide the search form -->
          <search-form-toggle
            :is-collapsed="isCollapsed"
            :topics="topics"
            :show-toggle-icon="hasVisibleSearchResults"
            :get-string="getString"
            :panel-id="getSearchPanelId"
            @toggle-collapsed="toggleCollapsedController"
          />

          <div v-show="!isCollapsed && isAiFeatureEnabled" class="mugin_translationSourcesPanel">
            <div class="mugin_translationSourcesPrimary">
              <ai-translation-toggle
                v-model="searchWithAI"
                :is-collapsed="false"
                :display-mode="'switch'"
                :show-off-state-label="false"
                :get-string="getString"
              />
            </div>

          </div>

          <div v-show="isCollapsed" class="mugin_collapsedSpacerPadding"></div>

          <div :id="getSearchPanelId" v-show="!isCollapsed" class="mugin_searchformoptions">
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
              :search-with-pub-med-query="searchWithPubMedQuery"
              :search-with-pub-med-best-match="searchWithPubMedBestMatch"
              :search-with-semantic-scholar="searchWithSemanticScholar"
              :search-with-open-alex="searchWithOpenAlex"
              :search-with-elicit="searchWithElicit"
              :selected-rerank-profile-id="resolvedSelectedRerankProfileId"
              :semantic-worded-intent-context="semanticWordedIntentContext"
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
            <div
              v-if="advanced && (hasTopics || hasLimitSelections || openLimits || openLimitsFromUrl)"
              :id="getSearchModeAdvancedPanelId"
              role="tabpanel"
              :aria-labelledby="getSearchModeAdvancedTabId"
            >
              <advanced-search-limits
                ref="advancedSearchLimits"
                :advanced="advanced"
                :limit-options="limitOptions"
                :limit-dropdowns="limitDropdowns"
                :get-limit-options-for-dropdown="getLimitOptionsForDropdown"
                :hide-topics="effectiveHideTopics"
                :language="language"
                :search-with-a-i="searchWithAI"
                :search-with-pub-med-query="searchWithPubMedQuery"
                :search-with-pub-med-best-match="searchWithPubMedBestMatch"
                :search-with-semantic-scholar="searchWithSemanticScholar"
                :search-with-open-alex="searchWithOpenAlex"
                :search-with-elicit="searchWithElicit"
                :rerank-profiles="availableRerankProfiles"
                :selected-rerank-profile-id="resolvedSelectedRerankProfileId"
                :semantic-worded-intent-context="semanticWordedIntentContext"
                :get-string="getString"
                :get-limit-placeholder="getLimitPlaceholder"
                @update-limit-dropdown="updateLimitDropdown"
                @update-limit-scope="updateLimitDropdownScope"
                @update-limit-placeholder="updateLimitPlaceholder"
                @add-limit-dropdown="addLimitDropdown"
                @remove-limit-dropdown="removeLimitDropdown"
                @update-rerank-profile="updateRerankProfileSelection"
              />
            </div>

            <!-- The radio buttons for limits to be included in the simple search -->
            <div
              v-if="!advanced && showSimpleFilters"
              :id="getSearchModeSimplePanelId"
              role="tabpanel"
              :aria-labelledby="getSearchModeSimpleTabId"
            >
              <simple-search-limits
                :advanced="advanced"
                :filtered-choices="filteredChoices"
                :limit-data="limitData"
                :show-semantic-search-section="showSemanticSearchSection"
                :search-with-pub-med-best-match="searchWithPubMedBestMatch"
                :search-with-semantic-scholar="searchWithSemanticScholar"
                :search-with-open-alex="searchWithOpenAlex"
                :search-with-elicit="searchWithElicit"
                :available-translation-sources="availableTranslationSourceKeys"
                :locked-translation-sources="lockedTranslationSourceKeys"
                :show-elicit-unlock-button="showElicitUnlockButton"
                :rerank-profiles="availableRerankProfiles"
                :selected-rerank-profile-id="resolvedSelectedRerankProfileId"
                :rerank-profile-input-name="getComponentId + '__rerank-profile'"
                :help-text-delay="300"
                :get-string="getString"
                :get-custom-name-label="getCustomNameLabel"
                :get-simple-tooltip="getSimpleTooltip"
                :get-semantic-option-tooltip-content="getSemanticOptionTooltipContent"
                :get-semantic-option-disabled-state="isSemanticOptionDisabled"
                @update-limit="updateLimitSimple"
                @update-limit-enter="updateLimitSimpleOnEnter"
                @update-semantic-source="updateTranslationSourceSelection"
                @update-rerank-profile="updateRerankProfileSelection"
              />
            </div>
          </div>
        </div>

        <div id="mugin_topofsearch" class="mugin_flex">
          <!-- The search query written out as human readable text-->
          <worded-search-string
            ref="wordedSearchString"
            :topics="topics"
            :limits="limitData"
            :available-limits="limitsContent"
            :limit-dropdowns="wordedSearchLimitDropdowns"
            :searchstring="displaySearchString"
            :source-queries="displayedSourceSearchStrings"
            :pending-source-keys="pendingSourceSearchStringDisplay"
            :translating-label="searchLoadingStatusText"
            :is-collapsed="isCollapsed"
            :details="details"
            :advanced-string="advancedString"
            :advanced-search="advanced"
            :show-header="!isCollapsed"
            :language="language"
            @toggle-details-box="toggleDetailsBox"
            @toggle-advanced-string="toggleAdvancedString"
            @update:query="onSourceSearchQueryUpdate"
            @query-edit-finished="onSourceSearchQueryEditFinished"
          />
        </div>

        <div v-show="hasTopics && !isCollapsed">
          <!-- Buttons for reset, copy url and search -->
          <action-buttons
            :search-loading="isSearchActionDisabled"
            :get-string="getString"
            :copy-url-status-message="copyUrlStatusMessage"
            @clear="clear"
            @copy-url="copyUrl"
            @searchset-low-start="searchsetLowStart"
          />
          <!-- Accessible status region for copy-URL feedback (WCAG 2.2 SC 4.1.3). -->
          <div class="mugin_srOnly" role="status" aria-live="polite" aria-atomic="true">{{ copyUrlStatusMessage }}</div>
        </div>
      </form>

      <!-- The list of results from searching -->
      <search-result
        ref="searchResultList"
        :language="language"
        :total="count"
        :sort="sort"
        :results="searchresult"
        :loading="searchLoading"
        :compact-loading-ui="compactLoadingUi"
        :hide-results-during-compact-loading="compactLoadingHideResults"
        :pagesize="getPageSize"
        :high="getHigh"
        :preselected-entries="preselectedEntries"
        :error="searchError"
        :loading-status-text="searchLoadingStatusText"
        :loading-process-steps="loadingProcessSteps"
        :selected-source-count="
          Array.isArray(selectedTranslationSources) ? selectedTranslationSources.length : 0
        "
        :search-process-elapsed-ms="searchProcessElapsedMs"
        :degraded-search-summary="degradedSearchSummary"
        :search-with-a-i="searchWithAI"
        :search-intent="searchIntent"
        :show-process-details-toggles="showProcessDetailsToggles"
        :source-query-details="searchProcessSourceQueryDetails"
        :process-step-details="searchProcessStepDetails"
        @new-page-size="setPageSize"
        @new-sort-method="newSortMethod"
        @high="nextPage"
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
  import SemanticSearchFilters from "@/components/SemanticSearchFilters.vue";
  import AdvancedSearchToggle from "@/components/AdvancedSearchToggle.vue";
  import AdvancedSearchFilters from "@/components/AdvancedSearchFilters.vue";
  import axios from "axios";

  import { order } from "@/assets/content/order.js";
  import { messages } from "@/assets/content/translations.js";
  import { topicLoaderMixin, flattenTopicGroups } from "@/mixins/topicLoaderMixin.js";
  import { normalizeLimitsList } from "@/utils/contentCanonicalizer";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import {
    applyThemeFromConfig,
    config as runtimeConfig,
    ELICIT_UNLOCK_CHANGED_EVENT,
    loadThemeOverridesFromBackend,
  } from "@/config/config.js";
  import { scopeIds, customInputTagTooltip } from "@/utils/contentHelpers.js";
  import { loadLimitsFromRuntime, loadStandardString, loadStandardStringAddToFreetext } from "@/utils/contentLoader";
  import { syncUrlDomainOverrideFromLocation } from "@/utils/domainKey.js";
  import {
    cloneDeep,
    debounce,
    getAbstractEntriesFromPubMedXml,
    getLocalizedTranslation,
    hasXmlParserError,
    isMobileViewport,
    parsePubMedXml,
  } from "@/utils/componentHelpers";
  import {
    appendCandidateTopicSignals,
    formatSelectedIdentifierFromResult,
    mapOpenAlexWorkToResultDto,
    mapPubMedSummaryToResultDto,
    mapUnifiedApiResultToResultDto,
    mergeResultTopicEntries,
    normalizeDoiValue,
    normalizeSelectedIdentifierList,
    isPlausibleDoiValue,
    parseSelectedIdentifierToken,
    unwrapOpenAlexWorkLookupEntry,
  } from "@/utils/resultAdapters";
  import {
    getSourceRateLimitStorageKey as utilGetSourceRateLimitStorageKey,
    getSourceRateLimitLabel as utilGetSourceRateLimitLabel,
    normalizeSourceRateLimitInfo as utilNormalizeSourceRateLimitInfo,
    getSourceRateLimitResetDate as utilGetSourceRateLimitResetDate,
    isSemanticSourceUnavailable as utilIsSemanticSourceUnavailable,
    formatSourceResetCountdown as utilFormatSourceResetCountdown,
    formatSourceResetClockTime as utilFormatSourceResetClockTime,
    formatSourceRateLimitTooltipSuffix as utilFormatSourceRateLimitTooltipSuffix,
  } from "@/utils/sourceRateLimit";
  import {
    buildOpenAlexPublicationYearFilter,
    buildSemanticWordedIntentContext,
    hasHardSemanticHandling,
    matchesSemanticPublicationDateYears,
  } from "@/utils/semanticWordedIntent";
  import {
    candidateMatchesActiveSemanticDoiOnlyRules,
    explainCandidateActiveSemanticDoiOnlyRules,
  } from "@/utils/semanticRuleEngine";
  import {
    buildSearchFlowRecordKey,
    buildSearchFlowDebugQueryParam,
    closeSearchFlowDebugConsoleGroup,
    getSearchFlowDebugFlagFromLocation,
    getSearchFlowDebugUrlParams,
    normalizeSearchFlowDebugValue,
    openSearchFlowDebugConsoleGroup,
    summarizeSearchFlowRecord,
  } from "@/utils/searchFlowDebug";
  import {
    claimSharedSearchFormUrl,
    getComponentUrlParamValue,
    getUrlParamCaseInsensitive,
    isSharedSearchFormUrlOwner,
    isUrlTargetedSearchFormComponent,
    readMountedSearchFormComponentNumbers,
  } from "@/utils/searchFormUrlTarget";
  import {
    buildActiveSemanticDoiOnlyRuleState,
  } from "@/utils/semanticRuleSchema";
  import {
    normalizeRerankProfileConfig,
    normalizeRerankProfileId,
    RERANK_PROFILE_STORAGE_KEY,
    RERANK_PROFILE_URL_PARAM,
  } from "@/utils/semanticRerankProfiles.js";
  import { buildLlmTopicsPayload, LLM_TOPIC_CAP } from "@/utils/semanticLlmTopics.js";
  import {
    adaptUnifiedProcessDetails,
    DEFAULT_STEP_LABELS,
  } from "@/utils/processDetailsAdapter.js";

  const OPENALEX_CACHE_TTL_MS = 30 * 60 * 1000;
  const OPENALEX_LOOKUP_CONCURRENCY = 3;
  const OPENALEX_BATCH_LOOKUP_CONCURRENCY = 2;
  // Safety net for the DOI-rule validation batch lookups: cap each OpenAlex batch
  // request so a slow backend/proxy can never stall the validation step for minutes.
  // On timeout the validation path degrades gracefully (candidate keeps its own
  // metadata / Semantic Scholar fallback) instead of triggering a per-candidate storm.
  const OPENALEX_VALIDATION_LOOKUP_TIMEOUT_MS = 30000;
  // Two-tier semantic DOI validation: validate the top-N non-trusted candidates
  // (relevance order) synchronously so the first pages render fast, then validate the
  // remaining candidates in the background. Nothing is dropped — the background pass
  // validates the rest and appends any keepers to the result list + total count.
  const SEMANTIC_VALIDATION_BLOCKING_LIMIT = 150;
  // Operational defaults only — model/reasoningEffort come from ThemeConfig
  // (MUGIN_LLM_TASK_MODELS.finalRerank via semanticLlmRerankConfig).
  const DEFAULT_SEMANTIC_LLM_RERANK_CONFIG = {
    enabled: true,
    topN: 10,
    maxOutputTokens: 400,
  };
  const SEMANTIC_LLM_RERANK_ALLOWED_EFFORTS = ["minimal", "none", "low", "medium", "high", "xhigh"];

  export default {
    name: "SearchForm",
    components: {
      ActionButtons,
      AiTranslationToggle,
      SearchFormToggle,
      AdvancedSearchToggle,
      SemanticSearchFilters,
      SimpleSearchLimits: SimpleSearchFilters,
      AdvancedSearchLimits: AdvancedSearchFilters,
      SubjectSelection,
      WordedSearchString,
      SearchResult,
    },
    mixins: [appSettingsMixin, topicLoaderMixin],
    provide() {
      return {
        muginSearchFlowDebugApi: {
          isEnabled: () => this.isSearchFlowDebugEnabled,
          isRunActive: () => !!this.searchFlowDebugRun,
          getConsolePrefix: () => this.getSearchFlowDebugConsolePrefix(),
          beginStep: (title) => this.beginSearchFlowDebugStep(title),
          endStep: (step, status = "ok", meta = {}) =>
            this.endSearchFlowDebugStep(step, status, meta),
          logEntry: (level, label, payload = undefined) =>
            this.recordSearchFlowDebugEntry(level, label, payload),
          recordSourceStatus: (status) => this.recordSemanticSourceStatus(status),
        },
      };
    },
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
      translationSources: {
        type: Array,
        default: undefined,
      },
      defaultTranslationSources: {
        type: Array,
        default: undefined,
      },
      showElicitUnlockButton: {
        type: Boolean,
        default: false,
      },
      showProcessDetailsToggles: {
        type: Boolean,
        default: true,
      },
      debugSearchFlow: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      const debugSearchFlowFromUrl =
        isUrlTargetedSearchFormComponent(
          this.componentNo,
          getSearchFlowDebugUrlParams(),
          readMountedSearchFormComponentNumbers()
        ) && getSearchFlowDebugFlagFromLocation();
      // Captured ONCE here (component creation, before the widget's own URL
      // rewriting logic runs) rather than re-read live inside search(), since
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
        translationSourcesExpanded: false,
        manualAiTranslationEnabled: true,
        isUrlParsed: false,
        allowSharedUrlWrite: false,
        oldState: "",
        page: 0,
        pageSize: 25,
        preselectedEntries: [],
        preselectedPmidai: [],
        matchedRerankedPmids: [],
        matchedRerankedResultRefs: [],
        semanticSortedResultCache: [],
        semanticSortedResultCacheKey: "",
        openAlexDoiCache: {},
        openAlexDoiPromiseCache: {},
        openAlexSourceCache: {},
        openAlexSourcePromiseCache: {},
        urlTranslationSources: [],
        selectedRerankProfileId: "",
        rerankProfileFromUrl: false,
        globalSemanticSearchInput: "",
        globalSemanticSearchSourceSignature: "",
        globalSemanticSearchState: null,
        // Early intent preview captured via DropdownWrapper's onIntentReady
        // callback — available as soon as the LLM has returned its parsed
        // intent, BEFORE the slow database fetches finish. Used for process
        // details while the search is still running.
        earlyIntentPreview: null,
        semanticMetadataByDoiCache: null,
        searchError: null,
        searchString: "",
        finalValidatedQuery: "",
        searchProcessPubMedRequest: null,
        pubMedSummaryCache: {},
        searchPaginationSignature: "",
        searchLoading: false,
        // Incremented whenever a running search is cancelled (e.g. the user
        // edits the form mid-flight) so async continuations can detect that
        // their run is stale and avoid mutating component state.
        searchGeneration: 0,
        selectedTranslationSources: [],
        previousNonPubmedTranslationSources: [],
        translationSourcesUserTouched: false,
        isApplyingTranslationSources: false,
        isPreparingSemanticTagRefresh: false,
        searchFlowDebugEnabledFromUrl: debugSearchFlowFromUrl,
        searchFlowDebugEnabled: this.debugSearchFlow === true || debugSearchFlowFromUrl,
        searchFlowDebugRunCounter: 0,
        searchFlowDebugRun: null,
        searchresult: undefined,
        searchLoadingStatusText: "",
        loadingProcessSteps: [],
        degradedSearchSummary: [],
        searchProcessStepDetailPayloads: {},
        searchProcessStepDetailLabels: {},
        unifiedProcessSourceQueryDetails: [],
        draftSourceQueries: {},
        lastSyncedSourceQueries: {},
        committedQueryOverrides: {},
        queryOverrideFreetextKey: "",
        pendingQueryOverrideSnapshot: null,
        sessionFreetextQueries: null,
        sourceSearchStringPending: {},
        searchProcessStartedAtMs: 0,
        searchProcessEndedAtMs: 0,
        searchProcessElapsedMs: 0,
        processTimingIntervalId: null,
        compactLoadingUi: false,
        compactLoadingHideResults: false,
        elicitRateLimitInfo: null,
        openAlexRateLimitInfo: null,
        semanticScholarRateLimitInfo: null,
        semanticDoiValidationActive: false,
        semanticBackgroundValidationPromise: null,
        pendingSemanticBackgroundValidation: null,
        loadingStatusDotIntervalId: null,
        loadingStatusDotBaseText: "",
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
        copyUrlStatusMessage: "",
        _copyUrlStatusTimer: null,
      };
    },
    computed: {
      searchProcessSourceQueryDetails() {
        if (
          this.isUnifiedEngineActive &&
          Array.isArray(this.unifiedProcessSourceQueryDetails) &&
          this.unifiedProcessSourceQueryDetails.length > 0
        ) {
          return this.unifiedProcessSourceQueryDetails;
        }
        const details = [];
        const detailKey = (source, query) =>
          `${String(source || "").trim()}|${String(query || "").trim().toLowerCase()}`;
        const hasRequestPayload = (request) =>
          request &&
          typeof request === "object" &&
          Object.keys(request).some((key) => {
            if (key === "query") return false;
            const value = request[key];
            if (Array.isArray(value)) return value.length > 0;
            if (value && typeof value === "object") return Object.keys(value).length > 0;
            return value !== "" && value !== null && value !== undefined;
          });
        const addDetail = (detail = {}) => {
          const source = String(detail.source || "").trim();
          const query = String(detail.query || detail.request?.query || "").trim();
          if (!source || !query) return;
          const request =
            detail.request && typeof detail.request === "object" ? { ...detail.request } : null;
          const requestMeta =
            detail.requestMeta && typeof detail.requestMeta === "object"
              ? { ...detail.requestMeta }
              : null;
          const response =
            detail.response && typeof detail.response === "object" ? { ...detail.response } : null;
          const key = detailKey(source, query);
          const existing = details.find((entry) => detailKey(entry.source, entry.query) === key);
          if (existing) {
            if (!hasRequestPayload(existing.request) && hasRequestPayload(request)) {
              existing.request = request;
            }
            if (!existing.requestMeta && requestMeta) {
              existing.requestMeta = requestMeta;
            }
            if (!existing.response && response) {
              existing.response = response;
            }
            if (!existing.context) {
              existing.context = String(detail.context || "").trim();
            }
            return;
          }
          details.push({
            source,
            query,
            request,
            requestMeta,
            response,
            context: String(detail.context || "").trim(),
          });
        };

        this.getSemanticSourceTags().forEach((tag) => {
          const context = String(tag?.preTranslation || tag?.name || "").trim();
          const sourceResults = Array.isArray(tag?.semanticSourceResults)
            ? tag.semanticSourceResults
            : [];
          sourceResults.forEach((sourceResult) => {
            addDetail({
              source: sourceResult?.source,
              query: sourceResult?.query,
              request: sourceResult?.request,
              requestMeta: sourceResult?.requestMeta,
              response: this.buildSemanticSourceResponseSummary(sourceResult),
              context,
            });
          });
        });

        const plan =
          this.globalSemanticSearchState?.semanticSourceQueryPlan ||
          this.earlyIntentPreview?.semanticSourceQueryPlan ||
          null;
        if (this.selectedTranslationSources.includes("pubmed")) {
          const pubmedQuery =
            this.getGlobalSemanticPubMedSourceQuery() ||
            String(this.finalValidatedQuery || this.getSearchString || "").trim();
          const hasRecordedPubMedRequest =
            this.searchProcessPubMedRequest && typeof this.searchProcessPubMedRequest === "object";
          const pubmedRequest =
            hasRecordedPubMedRequest
              ? { ...this.searchProcessPubMedRequest }
              : this.buildPubMedSearchRequest({
                  term: pubmedQuery,
                  retmax: this.pageSize,
                  retstart: this.page * this.pageSize,
                  sort: this.sort?.method || "",
                });
          addDetail({
            source: "pubmed",
            query: pubmedQuery,
            request: pubmedRequest,
            requestMeta: {
              role: hasRecordedPubMedRequest ? "pubmedFallbackSearch" : "pubmedBestMatchSource",
            },
            context: this.globalSemanticSearchInput,
          });
        }
        ["semanticScholar", "openAlex", "elicit"].forEach((source) => {
          if (!this.selectedTranslationSources.includes(source)) return;
          const entry = plan?.[source] && typeof plan[source] === "object" ? plan[source] : null;
          const query = String(entry?.query || "").trim();
          if (!query) return;
          if (details.some((detail) => detail.source === source)) return;
          addDetail({
            source,
            query,
            request: {
              query,
              filters: entry?.filters && typeof entry.filters === "object" ? entry.filters : {},
            },
            context: this.globalSemanticSearchInput,
          });
        });
        return details;
      },
      searchProcessStepDetails() {
        const details = [];
        const detailsByStepId = new Map();
        const addDetail = (stepId, label, payload = null, context = "") => {
          const normalizedStepId = String(stepId || "").trim();
          if (!normalizedStepId || !payload || typeof payload !== "object") return;
          const hasContent = Object.values(payload).some((value) => {
            if (Array.isArray(value)) return value.length > 0;
            if (value && typeof value === "object") return Object.keys(value).length > 0;
            return value !== "" && value !== null && value !== undefined;
          });
          if (!hasContent) return;
          const existing = detailsByStepId.get(normalizedStepId);
          if (existing) {
            existing.payload = {
              ...(existing.payload && typeof existing.payload === "object" ? existing.payload : {}),
              ...payload,
            };
            const normalizedLabel = String(label || "").trim();
            if (normalizedLabel) existing.label = normalizedLabel;
            const normalizedContext = String(context || "").trim();
            if (normalizedContext) existing.context = normalizedContext;
            return;
          }
          const entry = {
            stepId: normalizedStepId,
            label: String(label || "").trim(),
            payload,
            context: String(context || "").trim(),
          };
          detailsByStepId.set(normalizedStepId, entry);
          details.push(entry);
        };
        const selectedSources = Array.isArray(this.selectedTranslationSources)
          ? this.selectedTranslationSources.map((source) => String(source || "").trim()).filter(Boolean)
          : [];
        const searchBasis = {
          input: this.globalSemanticSearchInput || this.searchIntent || this.getSearchString || "",
          selectedSources,
          resultFocus: this.resolvedSelectedRerankProfileId || "",
          sort: this.sort?.method || "",
          pageSize: this.pageSize,
          searchWithAI: this.searchWithAI === true,
        };
        // Unified path: search-basis is folded into the first real prepare-lane
        // step by the backend. Do not invent a prepare-lane row here.
        if (!this.isUnifiedEngineActive) {
          const searchBasisStepId = this.shouldShowSemanticQueryProcessStep()
            ? "semanticIntent"
            : this.shouldShowPubMedRelatedSemanticProcessSteps()
              ? "searchString"
              : "mesh";
          addDetail(searchBasisStepId, "", {
            searchBasis,
            selectedSources: searchBasis.selectedSources,
            pageSize: searchBasis.pageSize,
          });
          const pubmedQuery = this.getGlobalSemanticPubMedSourceQuery();
        const pubmedIntent = this.globalSemanticSearchState?.llmSemanticIntent || null;
        const pubmedIntentMeta =
          pubmedIntent?.meta && typeof pubmedIntent.meta === "object" ? pubmedIntent.meta : {};
        const semanticIntentPayload =
          this.globalSemanticSearchState?.semanticIntentPayload ||
          this.earlyIntentPreview?.semanticIntentPayload ||
          null;
        const semanticIntentMeta =
          this.globalSemanticSearchState?.semanticIntentMeta ||
          this.earlyIntentPreview?.semanticIntentMeta ||
          null;
        const semanticCoverageCheck =
          semanticIntentMeta?.coverageCheck && typeof semanticIntentMeta.coverageCheck === "object"
            ? semanticIntentMeta.coverageCheck
            : null;
        const pubmedSourcePlan =
          this.globalSemanticSearchState?.semanticSourceQueryPlan &&
          typeof this.globalSemanticSearchState.semanticSourceQueryPlan === "object"
            ? this.globalSemanticSearchState.semanticSourceQueryPlan
            : {};
        addDetail("searchString", "Genereret PubMed-søgestreng", {
          input: this.globalSemanticSearchInput || this.searchIntent || "",
          rawUserInput: String(
            semanticIntentPayload?.rawUserInput ||
              semanticIntentPayload?.freeTextInput ||
              this.searchIntent ||
              ""
          ).trim(),
          contextualSearchInput: String(
            semanticIntentPayload?.contextualSearchInput ||
              semanticIntentPayload?.semanticCoreText ||
              ""
          ).trim(),
          structuredAiIntentUsed: !!pubmedIntent,
          aiCoreQuery: String(
            pubmedIntent?.coreQuery || pubmedSourcePlan.coreQuery || ""
          ).trim(),
          detectedConcepts: Array.isArray(pubmedIntentMeta.detectedConcepts)
            ? pubmedIntentMeta.detectedConcepts
            : [],
          conceptCoverage:
            pubmedIntentMeta.conceptCoverage && typeof pubmedIntentMeta.conceptCoverage === "object"
              ? pubmedIntentMeta.conceptCoverage
              : {},
          coverageCheck: semanticCoverageCheck,
          pubmedQuery,
          finalValidatedQuery: this.finalValidatedQuery || "",
        });
        const pubmedMeshSourceItems = [
          ...this.getAllSelectedSearchItems(),
          ...(this.globalSemanticSearchState ? [this.globalSemanticSearchState] : []),
        ];
        const pubmedMeshDetails = pubmedMeshSourceItems
          .map((item) => {
            const detail =
              item?.pubmedMeshDetail && typeof item.pubmedMeshDetail === "object"
                ? item.pubmedMeshDetail
                : null;
            if (!detail) return null;
            const report =
              detail.meshReport && typeof detail.meshReport === "object"
                ? detail.meshReport
                : {};
            return {
              input: String(detail.input || item?.preTranslation || item?.name || "").trim(),
              translatedBeforeMesh: String(detail.translatedBeforeMesh || "").trim(),
              translatedAfterMesh: String(detail.translatedAfterMesh || "").trim(),
              meshValidationEnabled: detail.meshValidationEnabled === true,
              totalMeshTerms: Number(report.totalMeshTerms || 0),
              validCount: Number(report.validCount || 0),
              invalidCount: Number(report.invalidCount || 0),
              invalidTerms: Array.isArray(report.invalidTerms) ? report.invalidTerms : [],
              renamedTerms: Array.isArray(report.renamedTerms) ? report.renamedTerms : [],
              addedConcepts: Array.isArray(report.addedConcepts) ? report.addedConcepts : [],
              removedConcepts: Array.isArray(report.removedConcepts) ? report.removedConcepts : [],
              addedMeshTerms: Array.isArray(report.addedMeshTerms) ? report.addedMeshTerms : [],
              removedMeshTerms: Array.isArray(report.removedMeshTerms) ? report.removedMeshTerms : [],
              finalMeshTermCount: Number(report.finalMeshTermCount || 0),
              hallucinationRate: Number(report.hallucinationRate || 0),
              meshSearchQuery: String(report.meshSearchQuery || "").trim(),
              changed: report.changed === true,
              observeOnly: report.observeOnly === true,
            };
          })
          .filter(Boolean);
        if (pubmedMeshDetails.length > 0) {
          addDetail("mesh", "MeSH-kontrol og forfinelse", {
            queries: pubmedMeshDetails.map((detail) => ({
              input: detail.input,
              meshSearchQuery: detail.meshSearchQuery,
              totalMeshTerms: detail.totalMeshTerms,
              validCount: detail.validCount,
              invalidCount: detail.invalidCount,
              invalidTerms: detail.invalidTerms,
              renamedTerms: detail.renamedTerms,
              hallucinationRate: detail.hallucinationRate,
              observeOnly: detail.observeOnly,
              beforeOptimization: detail.translatedBeforeMesh,
              afterOptimization: detail.translatedAfterMesh,
              changed: detail.changed,
              addedConcepts: detail.addedConcepts,
              removedConcepts: detail.removedConcepts,
              addedMeshTerms: detail.addedMeshTerms,
              removedMeshTerms: detail.removedMeshTerms,
              finalMeshTermCount: detail.finalMeshTermCount,
            })),
          });
        }
        const semanticQueryPlan =
          this.globalSemanticSearchState?.semanticSourceQueryPlan ||
          this.earlyIntentPreview?.semanticSourceQueryPlan ||
          null;
        const semanticIntent =
          this.globalSemanticSearchState?.llmSemanticIntent ||
          this.earlyIntentPreview?.llmSemanticIntent ||
          null;
        if (semanticQueryPlan && typeof semanticQueryPlan === "object") {
          const intentMeta =
            semanticIntent?.meta && typeof semanticIntent.meta === "object"
              ? semanticIntent.meta
              : {};
          addDetail("semanticQuery", "Tilpasset databasesøgning", {
            input: this.globalSemanticSearchInput || this.searchIntent || "",
            rawUserInput: String(
              semanticIntentPayload?.rawUserInput ||
                semanticIntentPayload?.freeTextInput ||
                this.searchIntent ||
                ""
            ).trim(),
            contextualSearchInput: String(
              semanticIntentPayload?.contextualSearchInput ||
                semanticIntentPayload?.semanticCoreText ||
                ""
            ).trim(),
            semanticIntent: String(semanticIntent?.semanticIntent || "").trim(),
            coreQuery: String(
              semanticIntent?.coreQuery ||
                semanticQueryPlan.coreQuery ||
                this.globalSemanticSearchState?.semanticScholarQuery ||
                ""
            ).trim(),
            selectedSources,
            promptVersion: String(semanticIntentMeta?.promptVersion || "").trim(),
            cacheHit: semanticIntentMeta?.cacheHit === true,
            fallbackUsed: semanticIntentMeta?.fallbackUsed === true,
            parseAttempts: Number(semanticIntentMeta?.parseAttempts || 0),
            coverageCheck: semanticCoverageCheck,
            detectedConcepts: Array.isArray(intentMeta.detectedConcepts)
              ? intentMeta.detectedConcepts
              : [],
            confidenceScore:
              typeof intentMeta.confidenceScore === "number" ? intentMeta.confidenceScore : null,
            conceptCoverage:
              intentMeta.conceptCoverage && typeof intentMeta.conceptCoverage === "object"
                ? intentMeta.conceptCoverage
                : {},
            potentialIssues: Array.isArray(intentMeta.potentialIssues)
              ? intentMeta.potentialIssues
              : [],
            refinementSuggestions: Array.isArray(intentMeta.refinementSuggestions)
              ? intentMeta.refinementSuggestions
              : [],
            hardFilters:
              semanticIntentPayload?.hardFilters && typeof semanticIntentPayload.hardFilters === "object"
                ? semanticIntentPayload.hardFilters
                : {},
            sourceQueries: ["semanticScholar", "openAlex", "elicit"]
              .filter((source) => selectedSources.includes(source))
              .map((source) => {
                const sourcePlan =
                  semanticQueryPlan[source] && typeof semanticQueryPlan[source] === "object"
                    ? semanticQueryPlan[source]
                    : {};
                return {
                  source,
                  query: String(sourcePlan.query || "").trim(),
                  filters:
                    sourcePlan.filters && typeof sourcePlan.filters === "object"
                      ? sourcePlan.filters
                      : {},
                };
              })
              .filter((entry) => entry.query),
            adaptations:
              semanticIntent?.adaptations && typeof semanticIntent.adaptations === "object"
                ? semanticIntent.adaptations
                : semanticQueryPlan.adaptations && typeof semanticQueryPlan.adaptations === "object"
                ? semanticQueryPlan.adaptations
                : {},
          });
        }
          const rerankDiagnostics = this.getSemanticSourceTags()
            .map((item) =>
              item?.semanticRerankDiagnostics && typeof item.semanticRerankDiagnostics === "object"
                ? item.semanticRerankDiagnostics
                : null
            )
            .filter(Boolean);
          const orderedCandidates = this.getOrderedRerankedCandidates();
          const latestRerankDiagnostics = rerankDiagnostics[rerankDiagnostics.length - 1] || null;
          addDetail("rerank", "Reranking", {
            rerankProfile:
              latestRerankDiagnostics?.rerankProfile ||
              this.getSemanticLlmRerankProfileContext() ||
              null,
            rerankMode: String(latestRerankDiagnostics?.rerankMode || "multi").trim(),
            candidateCount: orderedCandidates.length,
            sourceSummary: latestRerankDiagnostics?.sourceSummary || [],
            sourceStats: latestRerankDiagnostics?.sourceStats || {},
            overlapSummary: latestRerankDiagnostics?.overlapSummary || {},
            enrichmentSummary: latestRerankDiagnostics?.enrichmentSummary || {},
            mergeSummary: latestRerankDiagnostics?.mergeSummary || {},
            semanticRescueMeta: latestRerankDiagnostics?.semanticRescueMeta || null,
            rerankConfig: latestRerankDiagnostics?.rerankConfig || {},
            topCandidates: latestRerankDiagnostics?.topCandidates || [],
          });
          this.mergeSearchProcessStepDetail("rerank", {
            candidateCount: orderedCandidates.length,
            pmidCandidateCount: orderedCandidates.filter((candidate) => candidate?.pmid).length,
            doiCandidateCount: orderedCandidates.filter((candidate) => candidate?.doi).length,
            openAlexCandidateCount: orderedCandidates.filter((candidate) => candidate?.openAlexId).length,
            hardFilterQuery: this.getSemanticHardFilterValidationQuery(),
          });
        }
        Object.entries(this.searchProcessStepDetailPayloads || {}).forEach(([stepId, payload]) => {
          addDetail(
            stepId,
            String(
              this.searchProcessStepDetailLabels?.[stepId] ||
                DEFAULT_STEP_LABELS[stepId] ||
                "Detaljer"
            ),
            payload
          );
        });
        return details;
      },
      effectiveHideLimits() {
        return this.urlHideLimits.length > 0 ? this.urlHideLimits : this.hideLimits;
      },
      effectiveCheckLimits() {
        return this.urlCheckLimits.length > 0 ? this.urlCheckLimits : this.checkLimits;
      },
      effectiveOrderLimits() {
        return this.urlOrderLimits.length > 0 ? this.urlOrderLimits : this.orderLimits;
      },
      isAiFeatureEnabled() {
        return !!runtimeConfig.useAI;
      },
      rerankProfileConfig() {
        return normalizeRerankProfileConfig(runtimeConfig.rerankProfileConfig || {});
      },
      availableRerankProfiles() {
        return this.rerankProfileConfig.profiles;
      },
      hasRerankProfiles() {
        return this.rerankProfileConfig.enabled && this.availableRerankProfiles.length > 0;
      },
      resolvedSelectedRerankProfileId() {
        if (!this.hasRerankProfiles) return "";
        const selectedId = normalizeRerankProfileId(this.selectedRerankProfileId);
        if (this.availableRerankProfiles.some((profile) => profile.id === selectedId)) {
          return selectedId;
        }
        return this.rerankProfileConfig.defaultProfileId || this.availableRerankProfiles[0]?.id || "";
      },
      hasExplicitAvailableTranslationSources() {
        return Array.isArray(this.translationSources);
      },
      isSearchFlowDebugEnabled() {
        return this.searchFlowDebugEnabled === true;
      },
      isUnifiedEngineActive() {
        // SearchForm and public API must always use the same PHP orchestrator.
        // Runtime flags/URL parameters cannot select a local JS search engine.
        return true;
      },
      hasExplicitDefaultTranslationSources() {
        return Array.isArray(this.defaultTranslationSources);
      },
      domainTranslationSources() {
        const domainKey = String(this.currentDomain || "").trim().toLowerCase();
        if (!domainKey) return null;
        const configuredSources = runtimeConfig.translationSourcesByDomain?.[domainKey];
        return Array.isArray(configuredSources) ? configuredSources : null;
      },
      availableTranslationSourceKeys() {
        if (!this.isAiFeatureEnabled) return [];
        const configuredSources = this.hasExplicitAvailableTranslationSources
          ? this.translationSources
          : this.domainTranslationSources;
        const normalizedSources = this.normalizeTranslationSourcesList(
          Array.isArray(configuredSources) ? configuredSources : this.getSupportedTranslationSources()
        );
        const merged = this.normalizeTranslationSourcesList(["pubmed", ...normalizedSources]);
        // Global elicit gate: backend exposes runtimeConfig.elicitGated=true when
        // the caller is not unlocked via MUGIN_ELICIT_UNLOCK. Strip 'elicit' from the
        // list of query-available sources; the UI still renders it via
        // lockedTranslationSourceKeys so users can see and unlock it.
        if (runtimeConfig.elicitGated === true) {
          return merged.filter((sourceKey) => sourceKey !== "elicit");
        }
        return merged;
      },
      lockedTranslationSourceKeys() {
        // Sources that are visible in the UI but locked (disabled + lock icon).
        // Currently only Elicit can be gated. Only include it if it was part of
        // the widget's configured source list; otherwise the locked row would
        // appear in widgets that never intended to offer Elicit.
        if (!this.isAiFeatureEnabled) return [];
        if (runtimeConfig.elicitGated !== true) return [];
        const configuredSources = this.hasExplicitAvailableTranslationSources
          ? this.translationSources
          : this.domainTranslationSources;
        const sourceList = Array.isArray(configuredSources)
          ? configuredSources
          : this.getSupportedTranslationSources();
        const normalized = this.normalizeTranslationSourcesList(sourceList);
        return normalized.includes("elicit") ? ["elicit"] : [];
      },
      searchWithAI: {
        get() {
          return this.manualAiTranslationEnabled;
        },
        set(newValue) {
          const normalized = !!newValue;
          const changed = this.manualAiTranslationEnabled !== normalized;
          this.manualAiTranslationEnabled = normalized;
          // When the user actually toggles "Indtast med AI-oversættelse"
          // after the form has been initialised, treat it like any other
          // form change: reflect it in the URL, cancel any running search
          // and clear the process UI so it matches the behaviour of editing
          // topics / sources.
          if (changed && this.isUrlParsed) {
            this.setUrl();
            this.editForm();
          }
        },
      },
      searchWithPubMedBestMatch: {
        get() {
          return this.hasTranslationSource("pubmed");
        },
        set(newValue) {
          this.updateTranslationSourceSelection("pubmed", newValue);
        },
      },
      searchWithPubMedQuery: {
        get() {
          return this.searchWithAI && this.searchWithPubMedBestMatch;
        },
        set(newValue) {
          this.searchWithAI = !!newValue;
          if (newValue && !this.searchWithPubMedBestMatch) {
            this.updateTranslationSourceSelection("pubmed", true);
          }
        },
      },
      searchWithSemanticScholar: {
        get() {
          return this.hasTranslationSource("semanticScholar");
        },
        set(newValue) {
          this.updateTranslationSourceSelection("semanticScholar", newValue);
        },
      },
      searchWithOpenAlex: {
        get() {
          return this.hasTranslationSource("openAlex");
        },
        set(newValue) {
          this.updateTranslationSourceSelection("openAlex", newValue);
        },
      },
      searchWithElicit: {
        get() {
          return this.hasTranslationSource("elicit");
        },
        set(newValue) {
          this.updateTranslationSourceSelection("elicit", newValue);
        },
      },
      isElicitUnavailable() {
        return this.shouldDisableSemanticSourceOnRateLimit("elicit") &&
          this.isSemanticSourceUnavailable("elicit");
      },
      isOpenAlexUnavailable() {
        return this.shouldDisableSemanticSourceOnRateLimit("openAlex") &&
          this.isSemanticSourceUnavailable("openAlex");
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
      effectiveStandardStringAdd() {
        return loadStandardStringAddToFreetext(this.currentDomain) === true;
      },
      showSimpleFilters() {
        return this.hasTopics || this.openLimitsFromUrl || this.openLimits;
      },
      showSemanticSearchSection() {
        return this.isAiFeatureEnabled && this.availableTranslationSourceKeys.length > 0;
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
        return this.searchDisplayLimitDropdowns.length > 0;
      },
      searchDisplayLimitDropdowns() {
        return this.limitDropdowns
          .map((group) =>
            (Array.isArray(group) ? group : []).filter((item) => !this.isDatabaseLimitItem(item))
          )
          .filter((group) => group.length > 0);
      },
      wordedSearchLimitDropdowns() {
        const databaseDropdown = this.buildDatabaseLimitDropdownFromSelectedSources();
        if (databaseDropdown.length === 0) {
          return this.searchDisplayLimitDropdowns;
        }
        return [...this.searchDisplayLimitDropdowns, databaseDropdown];
      },
      hasTopics() {
        return this.topics.some((subjectArray) => subjectArray.length > 0);
      },
      hasVisibleSearchResults() {
        return Array.isArray(this.searchresult) && this.searchresult.length > 0;
      },
      activeTranslationSourcesCount() {
        return Array.isArray(this.selectedTranslationSources) ? this.selectedTranslationSources.length : 0;
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
        const filterGroups = this.searchDisplayLimitDropdowns
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
      semanticWordedIntentContext() {
        return buildSemanticWordedIntentContext({
          topicGroups: this.topics,
          limitDropdowns: this.searchDisplayLimitDropdowns,
          limitData: this.limitData,
        });
      },
      getSearchString() {
        const baseQuery = this.buildPubMedBaseQuery();
        const semanticClause = this.buildSemanticPmidClause();
        return baseQuery || semanticClause;
      },
      unifiedSearchFreetextQuery() {
        return this.getUnifiedSearchFreetextQuery();
      },
      sessionFreetextInputKey() {
        return this.getSessionFreetextInputKey();
      },
      displaySearchString() {
        return String(this.finalValidatedQuery || this.getSearchString || "").trim();
      },
      displayedSourceSearchStrings() {
        const sources = this.buildUnifiedSearchSources();
        const sourceSet = new Set(sources);
        const items = [];
        const partValue = (key, generated) => {
          if (Object.prototype.hasOwnProperty.call(this.draftSourceQueries || {}, key)) {
            return String(this.draftSourceQueries[key] ?? "");
          }
          return String(generated || "");
        };
        const pushSource = (key, labelKey) => {
          if (!sourceSet.has(key)) return;
          const sourceLabel = this.getString(labelKey);
          const limitsPart = (limitKey) => ({
            key: limitKey,
            labelKey: "searchStringPubmedLimits",
            value: "",
            readOnly: true,
            infoKey: "searchStringSourceLimitsHint",
            infoSourceLabel: sourceLabel,
            limitGroups: this.getSourceLimitGroupsForDisplay(key),
          });
          if (key === "pubmed") {
            const topicValue = partValue("pubmedTopics", this.getGeneratedPubmedTopicQuery());
            const limitValue = this.getGeneratedPubmedLimitQuery();
            const combined = this.combineResolvedPubmedDisplay(topicValue, limitValue);
            items.push({
              key,
              labelKey,
              value: combined,
              parts: [
                {
                  key: "pubmedTopics",
                  labelKey: "searchStringPubmedTopics",
                  value: topicValue,
                },
                limitsPart("pubmedLimits"),
              ],
            });
            return;
          }
          const generated = this.getGeneratedSemanticSourceQuery(key);
          const draft = this.draftSourceQueries?.[key];
          const topicValue = draft !== undefined && draft !== null ? String(draft) : generated;
          items.push({
            key,
            labelKey,
            value: topicValue,
            linkFilters: this.getSourceSearchLinkFilters(key),
            parts: [
              {
                key,
                labelKey: "searchStringPubmedTopics",
                value: topicValue,
              },
              limitsPart(`${key}Limits`),
            ],
          });
        };
        pushSource("pubmed", "searchStringSourcePubmed");
        pushSource("semanticScholar", "searchStringSourceSemanticScholar");
        pushSource("openAlex", "searchStringSourceOpenAlex");
        pushSource("elicit", "searchStringSourceElicit");
        return items;
      },
      pendingSourceSearchStringDisplay() {
        const pending = this.sourceSearchStringPending && typeof this.sourceSearchStringPending === "object"
          ? this.sourceSearchStringPending
          : {};
        const visible = {};
        Object.keys(pending).forEach((key) => {
          if (pending[key] === true && !this.isSourceQueryDirty(key)) {
            visible[key] = true;
          }
        });
        return visible;
      },
      getPageSize() {
        return this.pageSize;
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
      getSearchPanelId() {
        return this.getComponentId + "__panel";
      },
      getSearchModeSimpleTabId() {
        return this.getComponentId + "__tab-search-simple";
      },
      getSearchModeAdvancedTabId() {
        return this.getComponentId + "__tab-search-advanced";
      },
      getSearchModeSimplePanelId() {
        return this.getComponentId + "__panel-search-simple";
      },
      getSearchModeAdvancedPanelId() {
        return this.getComponentId + "__panel-search-advanced";
      },
    },
    watch: {
      translationSources() {
        this.translationSourcesUserTouched = false;
        this.applyConfiguredTranslationSources(true);
      },
      defaultTranslationSources() {
        this.translationSourcesUserTouched = false;
        this.applyConfiguredTranslationSources(true);
      },
      domainTranslationSources() {
        if (!this.hasExplicitAvailableTranslationSources && !this.translationSourcesUserTouched) {
          this.applyConfiguredTranslationSources(true);
        } else {
          this.setSelectedTranslationSources(this.selectedTranslationSources, false);
        }
      },
      availableRerankProfiles() {
        this.applyStoredOrDefaultRerankProfileSelection(false);
      },
      isAiFeatureEnabled(newValue) {
        if (!newValue) {
          this.setSelectedTranslationSources([], false);
          return;
        }
        if (!this.translationSourcesUserTouched) {
          this.applyConfiguredTranslationSources(true);
        }
      },
      sessionFreetextInputKey(newValue) {
        if (!this.isUrlParsed) return;
        const next = String(newValue || "").trim();
        const bound = String(this.queryOverrideFreetextKey || "").trim();
        const cachedInput = String(this.sessionFreetextQueries?.input || "").trim();
        const freetextChangedFromBound = Boolean(bound) && next !== bound;
        const freetextChangedFromCache = Boolean(cachedInput) && next !== cachedInput;
        if (!freetextChangedFromBound && !freetextChangedFromCache) return;
        const hadOverrides = Object.keys(this.getQueryOverridesForSearch()).length > 0;
        this.resetQueryOverrideState();
        if (hadOverrides) this.setUrl();
      },
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
      this.clearProcessTimingInterval();
      if (this._copyUrlStatusTimer) {
        clearTimeout(this._copyUrlStatusTimer);
        this._copyUrlStatusTimer = null;
      }
      if (this._semanticSourceRateLimitListener) {
        window.removeEventListener(
          "mugin:semantic-source-rate-limit-update",
          this._semanticSourceRateLimitListener
        );
      }
      if (this._elicitUnlockChangedListener) {
        window.removeEventListener(
          ELICIT_UNLOCK_CHANGED_EVENT,
          this._elicitUnlockChangedListener
        );
        this._elicitUnlockChangedListener = null;
      }
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
      await this.parseUrl();
      this.applyStoredOrDefaultRerankProfileSelection(false);
      this.isUrlParsed = true;

      this.updatePlaceholders();
      this.updateTopicDropdownWidth();
      if (typeof window !== "undefined") {
        this._semanticSourceRateLimitListener = (event) => {
          const sourceKey = String(event?.detail?.sourceKey || "").trim();
          if (!sourceKey) {
            return;
          }
          this.setSourceRateLimitInfo(sourceKey, event?.detail?.rateLimit);
        };
        window.addEventListener(
          "mugin:semantic-source-rate-limit-update",
          this._semanticSourceRateLimitListener
        );
      }
      this.restoreStoredSourceRateLimitInfo("elicit");
      this.restoreStoredSourceRateLimitInfo("openAlex");
      this.restoreStoredSourceRateLimitInfo("semanticScholar");
      this.fetchSharedSourceRateLimitSnapshot();
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
      if (typeof window !== "undefined") {
        this._elicitUnlockChangedListener = (event) => {
          this.handleElicitUnlockChanged(event);
        };
        window.addEventListener(
          ELICIT_UNLOCK_CHANGED_EVENT,
          this._elicitUnlockChangedListener
        );
      }
      if (this.hasTopics || this.hasExecutableQueryOverrides()) {
        if (this.shouldAutoSearchOnMount()) {
          await this.search();
        } else {
          console.info("[SearchFlow] Skipped auto-search on mount.", {
            urlTranslationSources: this.urlTranslationSources,
            selectedTranslationSources: this.selectedTranslationSources,
            searchWithAI: this.searchWithAI,
          });
        }
        await this.searchPreselectedPmidai();
      }

      // Ensure correct placeholder width after DOM is fully rendered
      this.$nextTick(() => {
        this.updateTopicDropdownWidth();
        this.updatePlaceholders();

        // Silent focus on the first input — only for the first SearchForm instance on the page
        const allWrappers = document.querySelectorAll(".mugin-searchform, .searchform");
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
      this.allowSharedUrlWrite = true;
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
      this.applyConfiguredTranslationSources(true);
    },
    methods: {
      normalizeTranslationSourcesList(value) {
        if (!Array.isArray(value)) return [];
        const aliasMap = {
          pubmed: "pubmed",
          pubmedBestMatch: "pubmed",
          pubmedbestmatch: "pubmed",
          "pubmed-best-match": "pubmed",
          pubmed_best_match: "pubmed",
          semanticScholar: "semanticScholar",
          semanticscholar: "semanticScholar",
          "semantic-scholar": "semanticScholar",
          semantic_scholar: "semanticScholar",
          openAlex: "openAlex",
          openalex: "openAlex",
          "open-alex": "openAlex",
          open_alex: "openAlex",
          elicit: "elicit",
        };
        const normalizedSources = Array.from(
          new Set(
            value
              .map((entry) => aliasMap[String(entry || "").trim()] || null)
              .filter(Boolean)
          )
        );
        return normalizedSources;
      },
      getSupportedTranslationSources() {
        return ["pubmed", "semanticScholar", "openAlex", "elicit"];
      },
      filterAvailableTranslationSources(value) {
        const allowedSources = new Set(this.availableTranslationSourceKeys);
        return this.normalizeTranslationSourcesList(value).filter((sourceKey) => allowedSources.has(sourceKey));
      },
      isTranslationSourceAvailable(sourceKey) {
        return this.availableTranslationSourceKeys.includes(String(sourceKey || "").trim());
      },
      shouldBlockAutoSearchFromUrlTranslationSources() {
        return this.urlTranslationSources.some((sourceKey) => String(sourceKey || "").trim() !== "pubmed");
      },
      /**
       * Auto-search on initial mount is only performed when the form is in a
       * minimal "PubMed-only + AI translation" state. Any other combination
       * (additional semantic sources, AI translation disabled, explicit
       * non-PubMed URL sources) skips the auto-run so the user can review the
       * pre-filled form before triggering a potentially costly search.
       */
      shouldAutoSearchOnMount() {
        if (this.shouldBlockAutoSearchFromUrlTranslationSources()) return false;
        const selected = Array.isArray(this.selectedTranslationSources)
          ? this.selectedTranslationSources
          : [];
        const onlyPubmed =
          selected.length === 1 &&
          String(selected[0] || "").trim() === "pubmed";
        if (!onlyPubmed) return false;
        if (this.hasExecutableQueryOverrides()) return true;
        return this.hasTopics && this.searchWithAI;
      },
      hasExecutableQueryOverrides() {
        const overrides = this.getQueryOverridesForSearch();
        return Object.keys(overrides).some((key) => String(overrides[key] || "").trim() !== "");
      },
      getTranslationSourceOrder(sourceKey) {
        const order = {
          pubmed: 0,
          semanticScholar: 1,
          openAlex: 2,
          elicit: 3,
        };
        return Number.isFinite(order[sourceKey]) ? order[sourceKey] : Number.MAX_SAFE_INTEGER;
      },
      sortTranslationSourcesList(value) {
        return this.normalizeTranslationSourcesList(value).sort(
          (a, b) => this.getTranslationSourceOrder(a) - this.getTranslationSourceOrder(b)
        );
      },
      translationSourcesListsEqual(a, b) {
        const left = this.sortTranslationSourcesList(a);
        const right = this.sortTranslationSourcesList(b);
        if (left.length !== right.length) return false;
        return left.every((entry, index) => entry === right[index]);
      },
      isValidRerankProfileId(profileId) {
        const normalizedId = normalizeRerankProfileId(profileId);
        return this.availableRerankProfiles.some((profile) => profile.id === normalizedId);
      },
      getStoredRerankProfileId() {
        try {
          if (typeof window === "undefined" || !window.localStorage) return "";
          return normalizeRerankProfileId(window.localStorage.getItem(RERANK_PROFILE_STORAGE_KEY));
        } catch (_error) {
          return "";
        }
      },
      setStoredRerankProfileId(profileId) {
        try {
          if (typeof window === "undefined" || !window.localStorage) return;
          const normalizedId = normalizeRerankProfileId(profileId);
          if (normalizedId) {
            window.localStorage.setItem(RERANK_PROFILE_STORAGE_KEY, normalizedId);
          } else {
            window.localStorage.removeItem(RERANK_PROFILE_STORAGE_KEY);
          }
        } catch (_error) {
          /* ignore storage errors */
        }
      },
      applyStoredOrDefaultRerankProfileSelection(markTouched = false) {
        if (!this.hasRerankProfiles) {
          this.selectedRerankProfileId = "";
          return;
        }
        if (this.isValidRerankProfileId(this.selectedRerankProfileId)) {
          return;
        }
        const storedId = this.getStoredRerankProfileId();
        const nextId = this.isValidRerankProfileId(storedId)
          ? storedId
          : this.rerankProfileConfig.defaultProfileId;
        this.updateRerankProfileSelection(nextId, markTouched);
      },
      updateRerankProfileSelection(profileId, markTouched = true) {
        if (!this.hasRerankProfiles) return;
        const normalizedId = normalizeRerankProfileId(profileId);
        const fallbackId = this.rerankProfileConfig.defaultProfileId || this.availableRerankProfiles[0]?.id || "";
        const nextId = this.isValidRerankProfileId(normalizedId) ? normalizedId : fallbackId;
        if (!nextId) return;
        const previousId = this.resolvedSelectedRerankProfileId;
        this.selectedRerankProfileId = nextId;
        if (markTouched) {
          this.setStoredRerankProfileId(nextId);
        }
        if (markTouched && this.isUrlParsed && previousId !== nextId) {
          this.setUrl();
          this.editForm();
        }
      },
      getRerankProfileUrlParamValue() {
        if (!this.hasRerankProfiles) return null;
        const profileId = this.resolvedSelectedRerankProfileId;
        return profileId || null;
      },
      hasTranslationSource(sourceKey) {
        if (!this.isAiFeatureEnabled) return false;
        return this.selectedTranslationSources.includes(sourceKey);
      },
      resolveSelectedTranslationSources(value) {
        const normalizedSources = this.filterAvailableTranslationSources(value).filter(
          (sourceKey) =>
            !(
              this.shouldDisableSemanticSourceOnRateLimit(sourceKey) &&
              this.isSemanticSourceUnavailable(sourceKey)
            )
        );
        return this.isAiFeatureEnabled && normalizedSources.length === 0
          ? this.filterAvailableTranslationSources(["pubmed"])
          : normalizedSources;
      },
      setSelectedTranslationSources(value, markTouched = false) {
        const previousSources = this.sortTranslationSourcesList(this.selectedTranslationSources);
        this.isApplyingTranslationSources = true;
        const nextSources = this.resolveSelectedTranslationSources(value);
        const nonPubmedSources = nextSources.filter((sourceKey) => sourceKey !== "pubmed");
        this.selectedTranslationSources = nextSources;
        this.previousNonPubmedTranslationSources = [...nonPubmedSources];
        this.isApplyingTranslationSources = false;
        if (this.advanced) {
          this.syncAdvancedDatabaseDropdownsFromTranslationSources();
        }
        this.syncDeferredSemanticTagsForMode(nonPubmedSources.length > 0 ? "semantic" : "pubmedQuery");
        this.clearGlobalSemanticSearchState();
        this.semanticMetadataByDoiCache = null;
        const sourcesChanged = !this.translationSourcesListsEqual(previousSources, nextSources);
        if (markTouched && this.isUrlParsed && sourcesChanged) {
          this.editForm();
        }
        if (markTouched) {
          this.translationSourcesUserTouched = true;
          if (this.isUrlParsed) {
            this.setUrl();
          }
        }
      },
      updateTranslationSourceSelection(sourceKey, enabled) {
        const normalizedSourceKey = this.normalizeTranslationSourcesList([sourceKey])[0] || "";
        if (!normalizedSourceKey) {
          return;
        }
        if (!this.isTranslationSourceAvailable(normalizedSourceKey)) {
          return;
        }
        if (
          enabled &&
          this.shouldDisableSemanticSourceOnRateLimit(normalizedSourceKey) &&
          this.isSemanticSourceUnavailable(normalizedSourceKey)
        ) {
          return;
        }
        let next = new Set(this.selectedTranslationSources);
        if (enabled) {
          next.add(normalizedSourceKey);
        } else {
          next.delete(normalizedSourceKey);
        }
        if (next.size === 0 && this.isAiFeatureEnabled) {
          next.add("pubmed");
        }
        this.setSelectedTranslationSources(Array.from(next), true);
      },
      getDefaultTranslationSources() {
        return this.isAiFeatureEnabled
          ? this.filterAvailableTranslationSources(["pubmed"])
          : [];
      },
      getConfiguredTranslationSources() {
        if (!this.isAiFeatureEnabled) {
          return [];
        }
        if (this.hasExplicitDefaultTranslationSources) {
          const explicitDefaults = this.filterAvailableTranslationSources(this.defaultTranslationSources);
          return explicitDefaults.length > 0 ? explicitDefaults : this.getDefaultTranslationSources();
        }
        return this.getDefaultTranslationSources();
      },
      applyConfiguredTranslationSources(force = false) {
        if (!force && this.translationSourcesUserTouched) {
          return;
        }
        this.setSelectedTranslationSources(this.getConfiguredTranslationSources(), false);
      },
      getTranslationSourcesUrlParamValue() {
        if (!this.isAiFeatureEnabled) return null;
        const selectedSources = this.normalizeTranslationSourcesList(this.selectedTranslationSources);
        if (selectedSources.length === 0) {
          return null;
        }
        return selectedSources.map((sourceKey) => String(sourceKey || "").toLowerCase()).join(",");
      },
      getSemanticDropdownWrappers() {
        const normalizeRefs = (value) =>
          (Array.isArray(value) ? value : value ? [value] : []).filter(
            (entry) => entry && typeof entry.preparePendingSemanticTags === "function"
          );
        const topicDropdowns = normalizeRefs(this.$refs?.subjectSelection?.$refs?.topicDropdown);
        const advancedLimitDropdowns = normalizeRefs(
          this.$refs?.advancedSearchLimits?.$refs?.limitSelection?.$refs?.limitDropdown
        );
        return [...topicDropdowns, ...advancedLimitDropdowns];
      },
      clearGlobalSemanticSearchState() {
        this.globalSemanticSearchInput = "";
        this.globalSemanticSearchSourceSignature = "";
        this.globalSemanticSearchState = null;
        this.searchProcessPubMedRequest = null;
        this.searchProcessStepDetailPayloads = {};
        this.searchProcessStepDetailLabels = {};
        this.unifiedProcessSourceQueryDetails = [];
        this.earlyIntentPreview = null;
      },
      hasSelectedSemanticSources() {
        return (
          this.searchWithSemanticScholar ||
          this.searchWithOpenAlex ||
          this.searchWithElicit
        );
      },
      hasActiveSemanticProcess() {
        return this.hasSelectedSemanticSources() || this.isUnifiedEngineActive;
      },
      shouldShowPubMedRelatedSemanticProcessSteps() {
        return this.selectedTranslationSources.includes("pubmed");
      },
      hasDeferredSemanticTags() {
        return this.getAllSelectedSearchItems().some(
          (item) => item?.semanticFlowType === "deferred" && item?.isPendingSemanticSearch === true
        );
      },
      getPubMedFreeTextTranslationInput(item = {}) {
        if (!item || item.isCustom !== true) return "";
        if (String(item?.pubmedGeneratedQuery || "").trim()) return "";
        if (item?.isTranslated === true) return "";
        return String(item?.preTranslation || item?.name || "").trim();
      },
      async ensurePubMedFreeTextQueriesBeforeSearch(dropdowns = []) {
        if (!(this.searchWithAI && this.shouldShowPubMedRelatedSemanticProcessSteps())) {
          return;
        }
        const semanticRunner = (Array.isArray(dropdowns) ? dropdowns : []).find(
          (dropdown) => dropdown && typeof dropdown.buildPubMedSearchStringFromFreeText === "function"
        );
        if (!semanticRunner) return;
        const itemsToTranslate = this.getAllSelectedSearchItems()
          .map((item) => ({
            item,
            input: this.getPubMedFreeTextTranslationInput(item),
          }))
          .filter((entry) => entry.input);
        if (itemsToTranslate.length === 0) return;

        this.activateSemanticLoadingProcessStep("searchString", "semanticSearchProgressSearchString");
        for (const { item, input } of itemsToTranslate) {
          let pubmedMeshDetail = null;
          const translated = String(
            await semanticRunner.buildPubMedSearchStringFromFreeText(input, {
              onDetail: (detail) => {
                pubmedMeshDetail = detail;
              },
            })
          ).trim();
          if (!translated) continue;
          item.pubmedGeneratedQuery = translated;
          item.pubmedMeshDetail = pubmedMeshDetail;
          item.includeTranslatedTextInQuery = true;
          item.isPendingSemanticSearch = false;
          item.preTranslation = item.preTranslation || input;
        }
      },
      markPendingSemanticTagsResolvedByGlobalState() {
        const includePubmedBaseQuery = this.selectedTranslationSources.includes("pubmed");
        this.getAllSelectedSearchItems().forEach((item) => {
          if (item?.semanticFlowType !== "deferred" || item?.isPendingSemanticSearch !== true) {
            return;
          }
          item.useSemanticScholar = false;
          item.semanticScholarQuery = "";
          item.semanticIntentPayload = null;
          item.llmSemanticIntent = null;
          item.semanticIntentMeta = null;
          item.semanticSourceQueryPlan = null;
          item.semanticScholarPmids = [];
          item.semanticScholarDois = [];
          item.semanticScholarCandidates = [];
          item.semanticSourceResults = [];
          item.semanticScholarError = "";
          item.includeTranslatedTextInQuery = includePubmedBaseQuery;
          item.isPendingSemanticSearch = false;
        });
      },
      getGlobalSemanticIntentInput() {
        if (!this.searchWithAI) {
          return String(this.searchIntent || "").trim();
        }
        const rawSearchIntent = String(this.searchIntent || "").trim();
        if (rawSearchIntent) {
          return rawSearchIntent;
        }
        const semanticContext =
          this.semanticWordedIntentContext && typeof this.semanticWordedIntentContext === "object"
            ? this.semanticWordedIntentContext
            : {};
        const semanticWordedIntent = String(semanticContext.semanticWordedIntent || "").trim();
        const semanticCoreText = String(semanticContext.semanticCoreText || "").trim();
        if (semanticCoreText) return semanticCoreText;
        if (semanticWordedIntent) return semanticWordedIntent;
        return String(this.searchIntent || "").trim();
      },
      isSemanticSourceItem(item) {
        return (
          item?.semanticFlowType === "deferred" ||
          !!item?.useSemanticScholar ||
          (Array.isArray(item?.semanticScholarPmids) && item.semanticScholarPmids.length > 0) ||
          (Array.isArray(item?.semanticScholarDois) && item.semanticScholarDois.length > 0) ||
          (Array.isArray(item?.semanticScholarCandidates) && item.semanticScholarCandidates.length > 0)
        );
      },
      collectSemanticPmidsFromItems(items) {
        return (Array.isArray(items) ? items : [])
          .filter((item) => this.isSemanticSourceItem(item))
          .flatMap((item) =>
            Array.isArray(item?.semanticScholarPmids) ? item.semanticScholarPmids : []
          )
          .map((pmid) => String(pmid || "").trim())
          .filter((pmid) => /^[0-9]+$/.test(pmid));
      },
      buildSemanticPmidClause() {
        const semanticScholarPmids = Array.from(
          new Set([
            ...this.topics.flatMap((group) => this.collectSemanticPmidsFromItems(group)),
            ...this.limitDropdowns.flatMap((group) => this.collectSemanticPmidsFromItems(group)),
            ...Object.values(this.limitData || {}).flatMap((group) =>
              this.collectSemanticPmidsFromItems(group)
            ),
            ...this.collectSemanticPmidsFromItems(
              this.globalSemanticSearchState ? [this.globalSemanticSearchState] : []
            ),
          ])
        );
        if (semanticScholarPmids.length > 0) {
          return `(${semanticScholarPmids.join(" ")})`;
        }
        const hasSemanticScholarTag =
          this.topics.some((group) =>
            Array.isArray(group) ? group.some((item) => this.isSemanticSourceItem(item)) : false
          ) ||
          this.limitDropdowns.some((group) =>
            Array.isArray(group) ? group.some((item) => this.isSemanticSourceItem(item)) : false
          ) ||
          Object.values(this.limitData || {}).some((group) =>
            Array.isArray(group) ? group.some((item) => this.isSemanticSourceItem(item)) : false
          );
        return hasSemanticScholarTag ? '("__qpm_semantic_scholar_no_match__"[ti])' : "";
      },
      buildPubMedQueryParts() {
        const hasLogicalOperators = (searchStrings) =>
          ["AND", "OR", "NOT"].some((op) => searchStrings.includes(op));
        const shouldExcludeFromBaseQuery = (item) =>
          item?.isPendingSemanticSearch === true ||
          (this.isSemanticSourceItem(item) && item?.includeTranslatedTextInQuery !== true);
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
        const resolvePubMedSearchValues = (item) => {
          const scope = item?.scope;
          const scopedSearchStrings =
            item?.searchStrings && scope && Array.isArray(item.searchStrings[scope])
              ? item.searchStrings[scope]
              : [];
          if (scopedSearchStrings.length === 0) {
            return [];
          }
          const pubmedGeneratedQuery = String(item?.pubmedGeneratedQuery || "").trim();
          if (item?.includeTranslatedTextInQuery === true && pubmedGeneratedQuery) {
            return [pubmedGeneratedQuery];
          }
          return scopedSearchStrings;
        };
        const buildSubstring = (items, connector = " OR ", allowStandardString = false) => {
          return items
            .filter(
              (item) =>
                item.searchStrings &&
                item.scope &&
                resolvePubMedSearchValues(item).length > 0
            )
            .map((item) => {
              const { scope } = item;
              const scopedSearchValues = resolvePubMedSearchValues(item);
              let combined = scopedSearchValues.join(connector);

              const scopeCombineValue =
                item.combineWithStandardStringScopes &&
                typeof item.combineWithStandardStringScopes === "object"
                  ? item.combineWithStandardStringScopes[scope]
                  : undefined;
              const shouldCombineWithStandard =
                allowStandardString &&
                (item.isCustom
                  ? this.effectiveStandardStringAdd
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
              return hasLogicalOperators(scopedSearchValues[0]) && items.length > 1
                ? `(${combined})`
                : combined;
            })
            .join(connector);
        };
        const topicSubstrings = [];
        const limitSubstrings = [];
        const pushLimitGroup = (dropdownItems) => {
          const nonSemanticItems = (Array.isArray(dropdownItems) ? dropdownItems : []).filter(
            (item) => !shouldExcludeFromBaseQuery(item)
          );
          if (nonSemanticItems.length === 0) return;
          const hasOperators = nonSemanticItems.some(
            (item) =>
              item.searchStrings &&
              item.scope &&
              resolvePubMedSearchValues(item)[0] &&
              hasLogicalOperators(resolvePubMedSearchValues(item)[0])
          );
          let substring = "";
          if (hasOperators || nonSemanticItems.length > 1) substring += "(";
          substring += buildSubstring(nonSemanticItems, " OR ", false);
          if (hasOperators || nonSemanticItems.length > 1) substring += ")";
          if (substring && substring !== "()") {
            limitSubstrings.push(substring);
          }
        };

        this.topics.forEach((subjectGroup, index) => {
          if (!Array.isArray(subjectGroup)) return;
          const nonSemanticItems = subjectGroup.filter((item) => !shouldExcludeFromBaseQuery(item));
          const topicsToIterate = nonSemanticItems.length;
          if (topicsToIterate === 0) return;
          const hasOperators = nonSemanticItems.some(
            (item) =>
              item.searchStrings &&
              item.scope &&
              resolvePubMedSearchValues(item)[0] &&
              hasLogicalOperators(resolvePubMedSearchValues(item)[0])
          );

          let substring = index > 0 ? " AND " : "";
          if (
            (hasOperators && (this.topics.length > 1 || this.limits.length > 0)) ||
            topicsToIterate > 1
          ) {
            substring += "(";
          }

          substring += buildSubstring(nonSemanticItems, " OR ", true);

          if (
            (hasOperators && (this.topics.length > 1 || this.limits.length > 0)) ||
            topicsToIterate > 1
          ) {
            substring += ")";
          }

          if (substring !== "()" && substring !== " AND ()" && substring !== " AND ") {
            topicSubstrings.push(substring);
          }
        });

        if (this.advanced) {
          this.limitDropdowns.forEach((dropdownItems) => pushLimitGroup(dropdownItems));
        } else {
          Object.keys(this.limitData).forEach((key) => pushLimitGroup(this.limitData[key]));
        }

        return {
          topics: topicSubstrings.join("").replace(/^\s*AND\s+/, "").trim(),
          limits: limitSubstrings.join(" AND ").trim(),
        };
      },
      buildPubMedBaseQuery() {
        const parts = this.buildPubMedQueryParts();
        return this.combineResolvedPubmedDisplay(parts.topics, parts.limits);
      },
      getGeneratedPubmedTopicQuery() {
        if (Object.prototype.hasOwnProperty.call(this.lastSyncedSourceQueries || {}, "pubmedTopics")) {
          return String(this.lastSyncedSourceQueries.pubmedTopics || "").trim();
        }
        return this.buildPubMedQueryParts().topics;
      },
      getGeneratedPubmedLimitQuery() {
        return this.buildPubMedQueryParts().limits;
      },
      hasSelectedPredefinedTopicForPubMedSource() {
        return (Array.isArray(this.topics) ? this.topics : []).some((group) =>
          (Array.isArray(group) ? group : []).some((item) => {
            const scope = String(item?.scope || "").trim();
            return (
              item &&
              item.isCustom !== true &&
              scope !== "" &&
              item.searchStrings &&
              Array.isArray(item.searchStrings[scope]) &&
              item.searchStrings[scope].length > 0
            );
          })
        );
      },
      getGlobalSemanticPubMedSourceQuery() {
        if (!this.shouldShowPubMedRelatedSemanticProcessSteps()) {
          return "";
        }
        const generatedGlobalQuery = String(
          this.globalSemanticSearchState?.pubmedGeneratedQuery || ""
        ).trim();
        if (generatedGlobalQuery && this.globalSemanticSearchInput === this.getGlobalSemanticIntentInput()) {
          return generatedGlobalQuery;
        }
        const baseQuery = this.buildPubMedBaseQuery();
        return baseQuery || this.getGlobalSemanticIntentInput();
      },
      getGlobalSemanticSearchSourceSignature(pubmedSourceQuery = "") {
        return JSON.stringify({
          sources: this.sortTranslationSourcesList(this.selectedTranslationSources),
          searchWithAI: this.searchWithAI === true,
          pubmedSourceQuery: String(pubmedSourceQuery || "").trim(),
        });
      },
      buildGlobalSemanticSearchState(inputText, resolvedState) {
        return {
          id: "__global_semantic_intent__",
          name: inputText,
          preTranslation: inputText,
          searchStrings: { normal: [inputText] },
          semanticFlowType: "global-intent",
          ...(resolvedState && typeof resolvedState === "object" ? resolvedState : {}),
        };
      },
      getSourceRateLimitStorageKey(sourceKey) {
        return utilGetSourceRateLimitStorageKey(sourceKey);
      },
      getSourceRateLimitStateProperty(sourceKey) {
        switch (String(sourceKey || "").trim()) {
          case "elicit":
            return "elicitRateLimitInfo";
          case "openAlex":
            return "openAlexRateLimitInfo";
          case "semanticScholar":
            return "semanticScholarRateLimitInfo";
          default:
            return "";
        }
      },
      getSourceRateLimitLabel(sourceKey) {
        return utilGetSourceRateLimitLabel(sourceKey);
      },
      getSourceRateLimitInfo(sourceKey) {
        const stateProperty = this.getSourceRateLimitStateProperty(sourceKey);
        return stateProperty ? this[stateProperty] : null;
      },
      shouldDisableSemanticSourceOnRateLimit(sourceKey) {
        const normalizedSourceKey = String(sourceKey || "").trim();
        return normalizedSourceKey === "elicit" || normalizedSourceKey === "openAlex";
      },
      normalizeSourceRateLimitInfo(value) {
        return utilNormalizeSourceRateLimitInfo(value);
      },
      getElicitRateLimitStorageKey() {
        return this.getSourceRateLimitStorageKey("elicit");
      },
      normalizeElicitRateLimitInfo(value) {
        return this.normalizeSourceRateLimitInfo(value);
      },
      setSourceRateLimitInfo(sourceKey, value) {
        const stateProperty = this.getSourceRateLimitStateProperty(sourceKey);
        if (!stateProperty) {
          return;
        }
        const normalized = this.normalizeSourceRateLimitInfo(value);
        if (!normalized) {
          return;
        }
        this[stateProperty] = normalized;
        if (
          this.shouldDisableSemanticSourceOnRateLimit(sourceKey) &&
          this.isSemanticSourceUnavailable(sourceKey) &&
          this.selectedTranslationSources.includes(sourceKey)
        ) {
          this.setSelectedTranslationSources(
            this.selectedTranslationSources.filter((entry) => entry !== sourceKey),
            false
          );
        }
      },
      setElicitRateLimitInfo(value) {
        this.setSourceRateLimitInfo("elicit", value);
      },
      restoreStoredSourceRateLimitInfo(sourceKey) {
        if (typeof window === "undefined") {
          return;
        }
        const storageKey = this.getSourceRateLimitStorageKey(sourceKey);
        if (!storageKey) {
          return;
        }
        try {
          const rawValue = window.localStorage.getItem(storageKey);
          if (!rawValue) {
            return;
          }
          this.setSourceRateLimitInfo(sourceKey, JSON.parse(rawValue));
        } catch {
          // Ignore malformed local cache values.
        }
      },
      restoreStoredElicitRateLimitInfo() {
        this.restoreStoredSourceRateLimitInfo("elicit");
      },
      async fetchSharedSourceRateLimitSnapshot() {
        if (typeof window === "undefined" || typeof fetch !== "function") {
          return;
        }
        const endpoint = this.getBackendApiUrl("RateLimitStatus.php");
        if (!endpoint) {
          return;
        }
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(endpoint, {
            method: "GET",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            return;
          }
          const payload = await response.json();
          const sources =
            payload && typeof payload.sources === "object" && payload.sources !== null
              ? payload.sources
              : {};
          ["elicit", "openAlex", "semanticScholar"].forEach((sourceKey) => {
            const snapshot = sources[sourceKey];
            if (!snapshot || typeof snapshot !== "object") {
              return;
            }
            // Prefer the user's own (more recent) data. Only apply the shared
            // server snapshot when nothing is set locally yet.
            const stateProperty = this.getSourceRateLimitStateProperty(sourceKey);
            if (stateProperty && this[stateProperty]) {
              return;
            }
            this.setSourceRateLimitInfo(sourceKey, snapshot);
          });
        } catch {
          // Ignore network or parsing errors – the shared snapshot is a
          // best-effort enhancement.
        }
      },
      getSourceResetDate(resetAt, resetInSeconds = null) {
        return utilGetSourceRateLimitResetDate(resetAt, resetInSeconds);
      },
      getElicitResetDate(resetAt, resetInSeconds = null) {
        return this.getSourceResetDate(resetAt, resetInSeconds);
      },
      formatSourceResetCountdown(resetAt, resetInSeconds = null) {
        return utilFormatSourceResetCountdown(resetAt, resetInSeconds, this.language);
      },
      formatElicitResetCountdown(resetAt, resetInSeconds = null) {
        return this.formatSourceResetCountdown(resetAt, resetInSeconds);
      },
      formatSourceResetClockTime(resetAt, resetInSeconds = null) {
        return utilFormatSourceResetClockTime(resetAt, resetInSeconds, this.language);
      },
      formatElicitResetClockTime(resetAt, resetInSeconds = null) {
        return this.formatSourceResetClockTime(resetAt, resetInSeconds);
      },
      isSemanticSourceUnavailable(sourceKey) {
        return utilIsSemanticSourceUnavailable(this.getSourceRateLimitInfo(sourceKey));
      },
      getSourceRateLimitTooltipSuffix(sourceKey) {
        const normalizedSourceKey = String(sourceKey || "").trim();
        if (
          !normalizedSourceKey ||
          !this.getSourceRateLimitStateProperty(normalizedSourceKey)
        ) {
          return "";
        }
        return utilFormatSourceRateLimitTooltipSuffix(
          normalizedSourceKey,
          this.language,
          this.getSourceRateLimitInfo(normalizedSourceKey)
        );
      },
      getElicitTooltipSuffix() {
        return this.getSourceRateLimitTooltipSuffix("elicit");
      },
      getOpenAlexTooltipSuffix() {
        return this.getSourceRateLimitTooltipSuffix("openAlex");
      },
      getSemanticScholarTooltipSuffix() {
        return this.getSourceRateLimitTooltipSuffix("semanticScholar");
      },
      isSemanticOptionDisabled(option) {
        const sourceKey = String(option?.id || "").trim();
        return this.shouldDisableSemanticSourceOnRateLimit(sourceKey) &&
          this.isSemanticSourceUnavailable(sourceKey);
      },
      getSemanticOptionTooltipContent(option) {
        const baseTooltip = this.getString(option?.hoverKey || "");
        return `${baseTooltip}${this.getSourceRateLimitTooltipSuffix(option?.id || "")}`;
      },
      getProcessTimingNow() {
        return Date.now();
      },
      isProcessTimingTerminalStatus(status = "") {
        return [
          "completed",
          "warning",
          "partial",
          "failed",
          "rateLimited",
          "recovered",
        ].includes(String(status || "").trim());
      },
      startSearchProcessTiming() {
        const now = this.getProcessTimingNow();
        this.searchProcessStartedAtMs = now;
        this.searchProcessEndedAtMs = 0;
        this.searchProcessElapsedMs = 0;
        this.clearProcessTimingInterval();
        this.processTimingIntervalId = setInterval(() => {
          this.refreshActiveProcessTimings();
        }, 250);
      },
      clearProcessTimingInterval() {
        if (this.processTimingIntervalId !== null && this.processTimingIntervalId !== undefined) {
          clearInterval(this.processTimingIntervalId);
          this.processTimingIntervalId = null;
        }
      },
      startProcessStepTiming(step, now = this.getProcessTimingNow()) {
        if (!step || typeof step !== "object") return step;
        if (!Number.isFinite(Number(step.startedAtMs)) || Number(step.startedAtMs) <= 0) {
          step.startedAtMs = now;
          step.endedAtMs = 0;
          step.elapsedMs = Math.max(0, Number(step.elapsedMs) || 0);
        }
        return step;
      },
      completeProcessStepTiming(step, now = this.getProcessTimingNow()) {
        if (!step || typeof step !== "object") return step;
        const previousElapsedMs = Math.max(0, Number(step.elapsedMs) || 0);
        if (!Number.isFinite(Number(step.startedAtMs)) || Number(step.startedAtMs) <= 0) {
          step.startedAtMs = now - previousElapsedMs;
        }
        if (!Number.isFinite(Number(step.endedAtMs)) || Number(step.endedAtMs) <= 0) {
          step.endedAtMs = now;
        }
        step.elapsedMs = Math.max(
          previousElapsedMs,
          0,
          Number(step.endedAtMs) - Number(step.startedAtMs)
        );
        step.endedAtMs = Math.max(
          Number(step.endedAtMs) || 0,
          Number(step.startedAtMs) + step.elapsedMs
        );
        return step;
      },
      refreshActiveProcessTimings(now = this.getProcessTimingNow()) {
        if (this.searchProcessStartedAtMs > 0 && this.searchProcessEndedAtMs <= 0) {
          this.searchProcessElapsedMs = Math.max(
            Number(this.searchProcessElapsedMs) || 0,
            0,
            now - this.searchProcessStartedAtMs
          );
        }
        if (!Array.isArray(this.loadingProcessSteps) || this.loadingProcessSteps.length === 0) {
          return;
        }
        let changed = false;
        const nextSteps = this.loadingProcessSteps.map((step) => {
          const nextStep = { ...step };
          const startedAt = Number(nextStep.startedAtMs);
          if (
            Number.isFinite(startedAt) &&
            startedAt > 0 &&
            (!Number.isFinite(Number(nextStep.endedAtMs)) || Number(nextStep.endedAtMs) <= 0)
          ) {
            nextStep.elapsedMs = Math.max(Number(nextStep.elapsedMs) || 0, 0, now - startedAt);
            changed = true;
          }
          return nextStep;
        });
        if (changed) {
          this.loadingProcessSteps = nextSteps;
        }
      },
      completeAllStartedProcessTimings(now = this.getProcessTimingNow()) {
        if (Array.isArray(this.loadingProcessSteps) && this.loadingProcessSteps.length > 0) {
          this.loadingProcessSteps = this.loadingProcessSteps.map((step) => {
            const nextStep = { ...step };
            if (
              Number.isFinite(Number(nextStep.startedAtMs)) &&
              Number(nextStep.startedAtMs) > 0 &&
              (!Number.isFinite(Number(nextStep.endedAtMs)) || Number(nextStep.endedAtMs) <= 0)
            ) {
              this.completeProcessStepTiming(nextStep, now);
            }
            return nextStep;
          });
        }
        if (this.searchProcessStartedAtMs > 0 && this.searchProcessEndedAtMs <= 0) {
          this.searchProcessEndedAtMs = now;
          this.searchProcessElapsedMs = Math.max(
            Number(this.searchProcessElapsedMs) || 0,
            0,
            now - this.searchProcessStartedAtMs
          );
        }
      },
      stopSearchProcessTiming() {
        const now = this.getProcessTimingNow();
        this.completeAllStartedProcessTimings(now);
        this.clearProcessTimingInterval();
      },
      getSemanticLoadingProcessStepOrder() {
        return [
          "cache",
          "semanticIntent",
          "searchString",
          "mesh",
          "semanticScholar",
          "openAlex",
          "elicit",
          "pubmed",
          "rerank",
          "finalizeValidatePmid",
          "finalizeValidateDoiFetch",
          "finalizeHydrate",
          "finalizeSort",
          "finalRerank",
        ];
      },
      getFinalizeCompositionStepId() {
        // Packaging / preselected pmid counts attach to the last real display step.
        if (this.hasSelectedSemanticSources()) return "finalRerank";
        if (this.sort?.method === "date_desc" || this.sort?.method === "date_asc") {
          return "finalizeSort";
        }
        return "finalizeHydrate";
      },
      getSearchBasisProcessStepId() {
        if (this.shouldShowSemanticQueryProcessStep()) return "semanticIntent";
        if (this.shouldShowPubMedRelatedSemanticProcessSteps()) return "searchString";
        return "mesh";
      },
      getVisibleSemanticLoadingProcessStep(stepId = "", translationKey = "") {
        const normalizedStepId = String(stepId || "").trim();
        const normalizedTranslationKey = String(translationKey || "").trim();
        // Fold retired micro-steps into their parent step ids (parity with API).
        const foldedStepIds = {
          prepare: this.getSearchBasisProcessStepId(),
          semanticQuery: "semanticIntent",
          optimize: "mesh",
          finalizeCollect: "rerank",
          finalizeValidateDoiSource: "finalizeValidateDoiFetch",
          finalizeValidateDoiRules: "finalizeValidateDoiFetch",
          finalizeSelected: this.getFinalizeCompositionStepId(),
          finalizeRender: this.getFinalizeCompositionStepId(),
        };
        const foldedStepId = foldedStepIds[normalizedStepId] || normalizedStepId;
        // Packaging / empty prepare are not visible process steps.
        if (
          normalizedStepId === "prepare" ||
          normalizedStepId === "finalizeRender" ||
          normalizedStepId === "finalizeSelected"
        ) {
          return {
            stepId: "",
            translationKey: "",
          };
        }
        return {
          stepId: foldedStepId,
          translationKey: normalizedTranslationKey,
        };
      },
      getSemanticIntentProgressMessageKey() {
        return Array.isArray(this.selectedTranslationSources) &&
          this.selectedTranslationSources.length <= 1
          ? "semanticSearchProgressSemanticIntentSingle"
          : "semanticSearchProgressSemanticIntent";
      },
      getSemanticRerankProgressMessageKey() {
        return Array.isArray(this.selectedTranslationSources) &&
          this.selectedTranslationSources.length <= 1
          ? "semanticSearchProgressRerankSingle"
          : "semanticSearchProgressRerank";
      },
      getSemanticLoadingProcessDefaultTranslationKey(stepId) {
        const keyMap = {
          cache: "semanticSearchProgressCacheHit",
          searchString: "semanticSearchProgressSearchString",
          mesh: "semanticSearchProgressMesh",
          semanticIntent: this.getSemanticIntentProgressMessageKey(),
          semanticQuery: this.getSemanticIntentProgressMessageKey(),
          pubmed: "semanticSearchProgressPubMedBestMatch",
          semanticScholar: "semanticSearchProgressSemanticScholar",
          openAlex: "semanticSearchProgressOpenAlex",
          elicit: "semanticSearchProgressElicit",
          rerank: this.getSemanticRerankProgressMessageKey(),
          finalizeValidatePmid: "semanticSearchProgressFinalizeValidatePmid",
          finalizeValidateDoiFetch: "semanticSearchProgressFinalizeValidateDoiFetch",
          finalizeHydrate: "semanticSearchProgressFinalizeHydrate",
          finalizeSort: "semanticSearchProgressFinalizeSort",
          finalRerank: "semanticSearchProgressFinalRerank",
        };
        return keyMap[String(stepId || "").trim()] || "";
      },
      getSemanticLoadingProcessStepId(stepKey = "") {
        const keyMap = {
          translatingStepSearchString: "searchString",
          translatingStepMesh: "mesh",
          translatingStepOptimize: "mesh",
          translatingStepSemanticIntent: "semanticIntent",
          translatingStepSemanticQuery: "semanticIntent",
          translatingStepPubMedBestMatch: "pubmed",
          translatingStepSemanticScholar: "semanticScholar",
          translatingStepOpenAlex: "openAlex",
          translatingStepElicit: "elicit",
          translatingStepRerank: "rerank",
        };
        return keyMap[String(stepKey || "").trim()] || "semanticIntent";
      },
      getPlannedSemanticLoadingProcessStepIds() {
        const stepIds = [];
        const sources = this.buildUnifiedSearchSources();
        const overrides = this.getQueryOverridesForSearch();
        const cached = this.getCachedFreetextQueriesForSearch() || {};
        const skipLlm =
          sources.length > 0 &&
          sources.every(
            (source) =>
              String(overrides[source] || "").trim() !== "" ||
              String(cached[source] || "").trim() !== ""
          );
        const hasFreetext = String(this.getUnifiedSearchFreetextQuery() || "").trim() !== "";
        const hasCatalogTopics = this.buildUnifiedSelectedTopicGroups()
          .flat()
          .some(
            (entry) => entry && entry.custom !== true && String(entry.id || "").trim() !== ""
          );
        const aiOn = this.searchWithAI === true;
        const hasPubmedOverride = String(overrides.pubmed || "").trim() !== "";

        // Known prepare work only. Mesh is decided after searchString.
        if (
          !skipLlm &&
          aiOn &&
          (hasFreetext || (hasCatalogTopics && this.hasSelectedSemanticSources()))
        ) {
          stepIds.push("semanticIntent");
        }
        if (
          !skipLlm &&
          aiOn &&
          hasFreetext &&
          !hasPubmedOverride &&
          this.shouldShowPubMedRelatedSemanticProcessSteps()
        ) {
          stepIds.push("searchString");
        }

        if (this.searchWithSemanticScholar) stepIds.push("semanticScholar");
        if (this.searchWithOpenAlex) stepIds.push("openAlex");
        if (this.searchWithElicit) stepIds.push("elicit");
        if (this.shouldShowPubMedRelatedSemanticProcessSteps()) {
          stepIds.push("pubmed");
        }

        // Hybrid match/display follow-ups. PMID/DOI validation and the LLM
        // final rerank wait until earlier steps have produced candidates.
        if (this.hasSelectedSemanticSources()) {
          stepIds.push("rerank");
          if (this.sort?.method === "date_desc" || this.sort?.method === "date_asc") {
            stepIds.push("finalizeSort");
          }
        }
        stepIds.push("finalizeHydrate");
        return stepIds;
      },
      shouldShowSemanticQueryProcessStep() {
        return this.searchWithAI === true && this.hasSelectedSemanticSources();
      },
      buildSemanticSourceResponseSummary(sourceResult = null) {
        if (!sourceResult || typeof sourceResult !== "object") return null;
        const candidateCount = Array.isArray(sourceResult.candidates)
          ? sourceResult.candidates.length
          : 0;
        const reportedTotal = Number(sourceResult.total ?? sourceResult.totalResults);
        const summary = { candidateCount };
        if (Number.isFinite(reportedTotal) && reportedTotal > 0) {
          summary.totalAvailable = reportedTotal;
        }
        if (sourceResult.partial === true) summary.partial = true;
        if (sourceResult.fallbackUsed === true) summary.fallbackUsed = true;
        const fallbackReason = String(sourceResult.fallbackReason || "").trim();
        if (fallbackReason) summary.fallbackReason = fallbackReason;
        const warning = String(sourceResult.warning || "").trim();
        if (warning) summary.warning = warning;
        const error = String(sourceResult.error || "").trim();
        if (error) summary.error = error;
        const rateLimit =
          sourceResult.rateLimit && typeof sourceResult.rateLimit === "object"
            ? sourceResult.rateLimit
            : null;
        if (rateLimit) {
          const rateLimitSummary = {};
          if (rateLimit.isLimited === true) rateLimitSummary.isLimited = true;
          const status = Number(rateLimit.status);
          if (Number.isFinite(status) && status > 0) rateLimitSummary.status = status;
          const remaining = Number(rateLimit.remaining);
          if (Number.isFinite(remaining)) rateLimitSummary.remaining = remaining;
          if (Object.keys(rateLimitSummary).length > 0) {
            summary.rateLimit = rateLimitSummary;
          }
        }
        return summary;
      },
      buildInitialSemanticLoadingProcessSteps() {
        const stepIds = this.getPlannedSemanticLoadingProcessStepIds();
        return stepIds.map((stepId) => ({
          id: stepId,
          label: this.getSemanticLoadingProcessStepLabel(stepId),
          status: "pending",
        }));
      },
      getSemanticLoadingProcessStepLabel(stepId, translationKey = "") {
        const normalizedStepId = String(stepId || "").trim();
        const labelKey =
          String(translationKey || "").trim() ||
          this.getSemanticLoadingProcessDefaultTranslationKey(normalizedStepId);
        return labelKey ? this.getString(labelKey) : "";
      },
      isSemanticLoadingTerminalStatus(status) {
        return [
          "completed",
          "warning",
          "partial",
          "failed",
          "rateLimited",
          "recovered",
        ].includes(String(status || "").trim());
      },
      processStepExpectsDetailPayload(stepId = "") {
        const normalized = String(stepId || "").trim();
        if (!normalized) return false;
        if (this.isConcurrentSemanticLoadingStep(normalized)) return true;
        return [
          "semanticIntent",
          "searchString",
          "mesh",
          "rerank",
          "finalizeValidatePmid",
          "finalizeValidateDoiFetch",
          "finalizeHydrate",
          "finalizeSort",
          "finalRerank",
        ].includes(normalized);
      },
      processStepHasDetailPayload(stepId = "") {
        const normalized = String(stepId || "").trim();
        if (!normalized) return false;
        if (this.isConcurrentSemanticLoadingStep(normalized)) {
          return (Array.isArray(this.unifiedProcessSourceQueryDetails)
            ? this.unifiedProcessSourceQueryDetails
            : Array.isArray(this.semanticSourceQueryDetails)
              ? this.semanticSourceQueryDetails
              : []
          ).some((entry) => String(entry?.source || "").trim() === normalized);
        }
        const payload = this.searchProcessStepDetailPayloads?.[normalized];
        return !!(payload && typeof payload === "object");
      },
      maybeCompleteProcessStepAfterDetail(stepId = "") {
        const normalized = String(stepId || "").trim();
        if (!normalized || !this.isUnifiedEngineActive) return;
        const steps = Array.isArray(this.loadingProcessSteps) ? this.loadingProcessSteps : [];
        const target = steps.find((step) => String(step?.id || "") === normalized);
        if (!target || this.isSemanticLoadingTerminalStatus(target.status)) return;
        const order = this.getSemanticLoadingProcessStepOrder();
        const targetIndex = order.indexOf(normalized);
        if (targetIndex === -1) return;
        const hasLaterProgress = steps.some((step) => {
          const stepIdValue = String(step?.id || "").trim();
          const stepIndex = order.indexOf(stepIdValue);
          if (stepIndex <= targetIndex) return false;
          return (
            step.status === "current" || this.isSemanticLoadingTerminalStatus(step.status)
          );
        });
        // Prepare-lane details (esp. mesh) must complete even when the start
        // event was skipped/out-of-order: detail arrival is itself terminal.
        const isPrepareStep = this.isPreparePhaseSemanticLoadingStep(normalized);
        if (!(hasLaterProgress || target.status === "current" || isPrepareStep)) {
          return;
        }
        // Out-of-order mesh completion after source prefetch often arrives while
        // the step is still pending — start timing if needed, then complete.
        if (
          !Number.isFinite(Number(target.startedAtMs)) ||
          Number(target.startedAtMs) <= 0
        ) {
          this.startProcessStepTiming(target);
        }
        this.setSemanticLoadingProcessStepStatus(normalized, "completed");
      },
      // Close prepare steps that already have details once later progress has
      // moved on. Do not invent mesh/searchString rows.
      reconcilePreparePhaseProcessStepsAfterLaterProgress() {
        if (!this.isUnifiedEngineActive || !this.searchLoading) return;
        const steps = Array.isArray(this.loadingProcessSteps) ? this.loadingProcessSteps : [];
        if (steps.length === 0) return;
        ["semanticIntent", "searchString", "mesh"].forEach((stepId) => {
          const step = steps.find((entry) => entry?.id === stepId);
          if (!step || this.isSemanticLoadingTerminalStatus(step.status)) return;
          if (this.processStepHasDetailPayload(stepId)) {
            this.maybeCompleteProcessStepAfterDetail(stepId);
          }
        });
      },
      getSemanticProcessSeverityRank(status) {
        const rankMap = {
          failed: 50,
          rateLimited: 45,
          partial: 35,
          recovered: 25,
          warning: 20,
          completed: 10,
          current: 5,
          pending: 0,
        };
        const normalizedStatus = String(status || "").trim();
        return Number(rankMap[normalizedStatus] || 0);
      },
      getSemanticSourceProcessStepId(source = "") {
        const sourceMap = {
          pubmed: "pubmed",
          semanticScholar: "semanticScholar",
          openAlex: "openAlex",
          elicit: "elicit",
          doiHydration: this.semanticDoiValidationActive ? "finalizeValidateDoiFetch" : "finalizeHydrate",
          finalRerank: "finalRerank",
        };
        return sourceMap[String(source || "").trim()] || "";
      },
      getSemanticSourceStatusTranslationKey(source = "", status = "") {
        const normalizedSource = String(source || "").trim();
        const normalizedStatus = String(status || "").trim();
        const keyMap = {
          "pubmed:failed": "semanticSearchProgressPubMedFailed",
          "pubmed:recovered": "semanticSearchProgressPubMedFallbackUsed",
          "semanticScholar:failed": "semanticSearchProgressSemanticScholarFailed",
          "semanticScholar:partial": "semanticSearchProgressSemanticScholarPartial",
          "semanticScholar:rateLimited": "semanticSearchProgressSemanticScholarRateLimited",
          "openAlex:failed": "semanticSearchProgressOpenAlexFailed",
          "openAlex:partial": "semanticSearchProgressOpenAlexPartial",
          "openAlex:rateLimited": "semanticSearchProgressOpenAlexRateLimited",
          "openAlex:recovered": "semanticSearchProgressOpenAlexRecovered",
          "elicit:failed": "semanticSearchProgressElicitFailed",
          "elicit:partial": "semanticSearchProgressElicitPartial",
          "elicit:rateLimited": "semanticSearchProgressElicitRateLimited",
          "elicit:recovered": "semanticSearchProgressElicitRecovered",
          "doiHydration:warning": "semanticSearchProgressDoiHydrationWarning",
          "finalRerank:warning": "semanticSearchProgressFinalRerankFallback",
        };
        return keyMap[`${normalizedSource}:${normalizedStatus}`] || "";
      },
      setSemanticLoadingProcessStepStatus(stepId, status, translationKey = "") {
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          return;
        }
        const visibleStep = this.getVisibleSemanticLoadingProcessStep(stepId, translationKey);
        const normalizedStepId = visibleStep.stepId;
        const normalizedStatus = String(status || "").trim();
        const normalizedTranslationKey = visibleStep.translationKey;
        if (!normalizedStepId || !normalizedStatus) return;
        this.ensureSemanticLoadingProcessStepPresence(normalizedStepId, normalizedTranslationKey);
        const nextSteps = Array.isArray(this.loadingProcessSteps)
          ? this.loadingProcessSteps.map((step) => ({ ...step }))
          : [];
        const targetStep = nextSteps.find((step) => step.id === normalizedStepId);
        if (!targetStep) return;
        if (
          this.isSemanticLoadingTerminalStatus(targetStep.status) &&
          this.getSemanticProcessSeverityRank(targetStep.status) >
            this.getSemanticProcessSeverityRank(normalizedStatus)
        ) {
          return;
        }
        const now = this.getProcessTimingNow();
        if (normalizedStatus === "current") {
          this.startProcessStepTiming(targetStep, now);
        } else if (this.isProcessTimingTerminalStatus(normalizedStatus)) {
          this.completeProcessStepTiming(targetStep, now);
        }
        targetStep.status = normalizedStatus;
        if (normalizedTranslationKey) {
          targetStep.label = this.getSemanticLoadingProcessStepLabel(
            normalizedStepId,
            normalizedTranslationKey
          );
        }
        this.loadingProcessSteps = nextSteps;
      },
      recordDegradedSearchStatus(statusInfo = {}) {
        const source = String(statusInfo?.source || "").trim();
        const status = String(statusInfo?.status || "warning").trim() || "warning";
        const messageKey = String(statusInfo?.messageKey || "").trim();
        if (!source || !messageKey) return;
        const entry = {
          source,
          status,
          messageKey,
          message: this.getString(messageKey),
        };
        const rank = this.getSemanticProcessSeverityRank(status);
        const currentSummary = Array.isArray(this.degradedSearchSummary)
          ? this.degradedSearchSummary
          : [];
        const hasHigherSourceStatus = currentSummary.some(
          (item) =>
            String(item?.source || "") === source &&
            this.getSemanticProcessSeverityRank(item?.status) > rank
        );
        if (hasHigherSourceStatus) return;
        const nextSummary = currentSummary.filter((item) => String(item?.source || "") !== source);
        nextSummary.push(entry);
        this.degradedSearchSummary = nextSummary.sort(
          (left, right) =>
            this.getSemanticProcessSeverityRank(right?.status) -
            this.getSemanticProcessSeverityRank(left?.status)
        );
      },
      recordSemanticSourceStatus(statusInfo = {}) {
        const source = String(statusInfo?.source || "").trim();
        const status = String(statusInfo?.status || "").trim();
        const stepId = String(statusInfo?.stepId || this.getSemanticSourceProcessStepId(source)).trim();
        const messageKey = String(
          statusInfo?.messageKey || this.getSemanticSourceStatusTranslationKey(source, status)
        ).trim();
        if (!source || !status || !messageKey) return;
        if (stepId) {
          this.setSemanticLoadingProcessStepStatus(stepId, status, messageKey);
        }
        this.recordDegradedSearchStatus({
          source,
          status,
          messageKey,
        });
      },
      ensureSemanticLoadingProcessSteps() {
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          this.loadingProcessSteps = [];
          return;
        }
        if (!Array.isArray(this.loadingProcessSteps) || this.loadingProcessSteps.length === 0) {
          this.loadingProcessSteps = this.buildInitialSemanticLoadingProcessSteps();
        }
      },
      ensureSemanticLoadingProcessStepPresence(stepId, translationKey = "") {
        this.ensureSemanticLoadingProcessSteps();
        const visibleStep = this.getVisibleSemanticLoadingProcessStep(stepId, translationKey);
        const normalizedStepId = visibleStep.stepId;
        const normalizedTranslationKey = visibleStep.translationKey;
        if (!normalizedStepId) return;
        const existingSteps = Array.isArray(this.loadingProcessSteps)
          ? this.loadingProcessSteps
          : [];
        if (existingSteps.some((step) => step.id === normalizedStepId)) {
          return;
        }
        const labelKey =
          normalizedTranslationKey ||
          this.getSemanticLoadingProcessDefaultTranslationKey(normalizedStepId);
        const stepOrder = this.getSemanticLoadingProcessStepOrder();
        const targetOrderIndex = stepOrder.indexOf(normalizedStepId);
        const nextStep = {
          id: normalizedStepId,
          label: this.getSemanticLoadingProcessStepLabel(normalizedStepId, labelKey),
          status: "pending",
        };
        const nextSteps = existingSteps.map((step) => ({ ...step }));
        const insertIndex = nextSteps.findIndex((step) => {
          const currentOrderIndex = stepOrder.indexOf(step.id);
          return currentOrderIndex > targetOrderIndex;
        });
        if (insertIndex === -1) {
          nextSteps.push(nextStep);
        } else {
          nextSteps.splice(insertIndex, 0, nextStep);
        }
        this.loadingProcessSteps = nextSteps;
      },
      activateSemanticLoadingProcessStep(stepId, translationKey = "") {
        if (!this.searchLoading || (!this.hasSelectedSemanticSources() && !this.isUnifiedEngineActive)) {
          return;
        }
        const visibleStep = this.getVisibleSemanticLoadingProcessStep(stepId, translationKey);
        const normalizedStepId = visibleStep.stepId;
        const normalizedTranslationKey = visibleStep.translationKey;
        if (!normalizedStepId) return;
        this.ensureSemanticLoadingProcessStepPresence(normalizedStepId, normalizedTranslationKey);
        const nextSteps = Array.isArray(this.loadingProcessSteps)
          ? this.loadingProcessSteps.map((step) => ({ ...step }))
          : [];
        let activeIndex = nextSteps.findIndex((step) => step.id === normalizedStepId);
        if (activeIndex === -1) return;
        const activeLabelKey =
          normalizedTranslationKey ||
          this.getSemanticLoadingProcessDefaultTranslationKey(normalizedStepId);
        const now = this.getProcessTimingNow();
        nextSteps.forEach((step, index) => {
          if (index < activeIndex) {
            if (!this.isSemanticLoadingTerminalStatus(step.status)) {
              // Unified engine: never mark a step completed before its detail
              // payload is available — keep it running until details arrive.
              if (
                this.isUnifiedEngineActive &&
                this.processStepExpectsDetailPayload(step.id) &&
                !this.processStepHasDetailPayload(step.id)
              ) {
                return;
              }
              step.status = "completed";
              this.completeProcessStepTiming(step, now);
            }
          } else if (index === activeIndex) {
            step.status = "current";
            this.startProcessStepTiming(step, now);
            step.label = this.getSemanticLoadingProcessStepLabel(
              normalizedStepId,
              activeLabelKey
            );
          } else if (
            step.status !== "completed" &&
            step.status !== "current" &&
            !this.isSemanticLoadingTerminalStatus(step.status) &&
            !this.isConcurrentSemanticLoadingStep(step.id)
          ) {
            // Never reset a concurrent source step (or a step already running) back to
            // pending: the preparation lane now overlaps the source fetches.
            step.status = "pending";
          }
        });
        this.loadingProcessSteps = nextSteps;
      },
      clearLoadingStatusDotInterval() {
        if (this.loadingStatusDotIntervalId !== null && this.loadingStatusDotIntervalId !== undefined) {
          clearInterval(this.loadingStatusDotIntervalId);
          this.loadingStatusDotIntervalId = null;
        }
        this.loadingStatusDotBaseText = "";
      },
      clearSearchLoadingStatus() {
        this.clearLoadingStatusDotInterval();
        this.clearProcessTimingInterval();
        this.searchLoadingStatusText = "";
        this.loadingProcessSteps = [];
        this.compactLoadingUi = false;
        this.compactLoadingHideResults = false;
        this.semanticDoiValidationActive = false;
        this.resetLoadingProcessPlaceholders();
        this.sourceSearchStringPending = {};
      },
      setSearchProcessStepDetail(stepId = "", payload = null, label = "") {
        const normalizedStepId = String(stepId || "").trim();
        if (!normalizedStepId || !payload || typeof payload !== "object") return;
        this.searchProcessStepDetailPayloads = {
          ...(this.searchProcessStepDetailPayloads || {}),
          [normalizedStepId]: payload,
        };
        const normalizedLabel = String(label || "").trim();
        if (normalizedLabel) {
          this.searchProcessStepDetailLabels = {
            ...(this.searchProcessStepDetailLabels || {}),
            [normalizedStepId]: normalizedLabel,
          };
        }
        if (normalizedStepId === "searchString" && payload.translationFallback === true) {
          this.recordDegradedSearchStatus({
            source: "pubmed",
            status: "warning",
            messageKey: "pubmedTranslationFallbackWarning",
          });
        }
        if (normalizedStepId === "searchString" && payload.rawFreetextSanitized === true) {
          this.recordDegradedSearchStatus({
            source: "pubmed",
            status: "warning",
            messageKey: "pubmedRawFreetextSanitizedWarning",
          });
        }
      },
      mergeSearchProcessStepDetail(stepId = "", payload = null) {
        const normalizedStepId = String(stepId || "").trim();
        if (!normalizedStepId || !payload || typeof payload !== "object") return;
        const current =
          this.searchProcessStepDetailPayloads?.[normalizedStepId] &&
          typeof this.searchProcessStepDetailPayloads[normalizedStepId] === "object"
            ? this.searchProcessStepDetailPayloads[normalizedStepId]
            : {};
        this.setSearchProcessStepDetail(normalizedStepId, {
          ...current,
          ...payload,
        });
      },
      startCompactLoading(textKey = "loadingText", hideResults = false) {
        this.searchLoading = true;
        this.searchError = null;
        this.compactLoadingUi = true;
        this.compactLoadingHideResults = hideResults;
        this.clearLoadingStatusDotInterval();
        this.clearProcessTimingInterval();
        this.loadingProcessSteps = [];
        this.searchLoadingStatusText = this.getString(textKey);
        return Date.now();
      },
      async finishCompactLoading(startedAt = 0) {
        const minimumSpinnerMs = 280;
        const elapsedMs = Math.max(0, Date.now() - Number(startedAt || 0));
        const remainingMs = Math.max(0, minimumSpinnerMs - elapsedMs);
        if (remainingMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingMs));
        }
        this.searchLoading = false;
        this.clearSearchLoadingStatus();
      },
      // Shared wrapper for local sort/pagination updates so spinner timing stays consistent in one place.
      async runWithCompactLoading(textKey = "loadingText", hideResults = false, callback = null) {
        const compactLoadingStartedAt = this.startCompactLoading(textKey, hideResults);
        try {
          await this.waitForCompactLoadingPaint();
          return await callback?.();
        } finally {
          await this.finishCompactLoading(compactLoadingStartedAt);
        }
      },
      async waitForCompactLoadingPaint() {
        await this.$nextTick();
        await new Promise((resolve) => {
          if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => resolve());
          } else {
            setTimeout(resolve, 0);
          }
        });
      },
      resetLoadingProcessPlaceholders() {
        this.clearPlaceholderDotInterval();
        this.clearFilterPlaceholderDotInterval();
        this.dropdownPlaceholders = this.dropdownPlaceholders.map((_, index) =>
          this.getDropdownPlaceholder(index, false)
        );
        this.limitDropdownPlaceholders = this.limitDropdownPlaceholders.map((_, index) =>
          this.getDefaultFilterPlaceholder(index)
        );
      },
      getSemanticSearchLoadingTranslationKey(stepKey) {
        const keyMap = {
          translatingStepSearchString: "semanticSearchProgressSearchString",
          translatingStepMesh: "semanticSearchProgressMesh",
          translatingStepOptimize: "semanticSearchProgressMesh",
          translatingStepSemanticIntent: this.getSemanticIntentProgressMessageKey(),
          translatingStepSemanticQuery: this.getSemanticIntentProgressMessageKey(),
          translatingStepPubMedBestMatch: "semanticSearchProgressPubMedBestMatch",
          translatingStepSemanticScholar: "semanticSearchProgressSemanticScholar",
          translatingStepOpenAlex: "semanticSearchProgressOpenAlex",
          translatingStepElicit: "semanticSearchProgressElicit",
          translatingStepRerank: this.getSemanticRerankProgressMessageKey(),
        };
        return keyMap[String(stepKey || "").trim()] || "semanticSearchProgressPreparing";
      },
      isConcurrentSemanticLoadingStep(stepId = "") {
        return ["semanticScholar", "openAlex", "elicit", "pubmed"].includes(
          String(stepId || "").trim()
        );
      },
      isPreparePhaseSemanticLoadingStep(stepId = "") {
        // The PubMed query/MeSH preparation steps run in their own lane that now
        // overlaps the concurrent source fetches, so they must not be completed or
        // reset as a side effect of a source step activating.
        return ["semanticIntent", "searchString", "mesh"].includes(
          String(stepId || "").trim()
        );
      },
      activateConcurrentSemanticLoadingStep(stepId, translationKey = "") {
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          return;
        }
        const visibleStep = this.getVisibleSemanticLoadingProcessStep(stepId, translationKey);
        const normalizedStepId = visibleStep.stepId;
        const normalizedTranslationKey = visibleStep.translationKey;
        if (!normalizedStepId) return;
        this.ensureSemanticLoadingProcessStepPresence(normalizedStepId, normalizedTranslationKey);
        const nextSteps = Array.isArray(this.loadingProcessSteps)
          ? this.loadingProcessSteps.map((step) => ({ ...step }))
          : [];
        const activeIndex = nextSteps.findIndex((step) => step.id === normalizedStepId);
        if (activeIndex === -1) return;
        const activeLabelKey =
          normalizedTranslationKey ||
          this.getSemanticLoadingProcessDefaultTranslationKey(normalizedStepId);
        const now = this.getProcessTimingNow();
        nextSteps.forEach((step, index) => {
          if (step.id === normalizedStepId) {
            step.status = "current";
            this.startProcessStepTiming(step, now);
            step.label = this.getSemanticLoadingProcessStepLabel(
              normalizedStepId,
              activeLabelKey
            );
            return;
          }
          if (this.isConcurrentSemanticLoadingStep(step.id)) {
            return;
          }
          if (this.isPreparePhaseSemanticLoadingStep(step.id)) {
            // Owned by the parallel preparation lane; leave its status/timing alone so
            // its live counter is not frozen before (or while) it actually runs.
            return;
          }
          if (index < activeIndex) {
            if (!this.isSemanticLoadingTerminalStatus(step.status)) {
              if (
                this.isUnifiedEngineActive &&
                this.processStepExpectsDetailPayload(step.id) &&
                !this.processStepHasDetailPayload(step.id)
              ) {
                return;
              }
              step.status = "completed";
              this.completeProcessStepTiming(step, now);
            }
          } else if (step.status !== "completed") {
            if (!this.isSemanticLoadingTerminalStatus(step.status)) {
              step.status = "pending";
            }
          }
        });
        this.loadingProcessSteps = nextSteps;
      },
      completeConcurrentSemanticLoadingStep(stepId, translationKey = "") {
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          return;
        }
        const visibleStep = this.getVisibleSemanticLoadingProcessStep(stepId, translationKey);
        const normalizedStepId = visibleStep.stepId;
        const normalizedTranslationKey = visibleStep.translationKey;
        if (!normalizedStepId) return;
        const nextSteps = Array.isArray(this.loadingProcessSteps)
          ? this.loadingProcessSteps.map((step) => ({ ...step }))
          : [];
        const targetStep = nextSteps.find((step) => step.id === normalizedStepId);
        if (!targetStep) return;
        if (
          targetStep.status !== "completed" &&
          !this.isSemanticLoadingTerminalStatus(targetStep.status)
        ) {
          targetStep.status = "completed";
          this.completeProcessStepTiming(targetStep);
        }
        if (normalizedTranslationKey) {
          targetStep.label = this.getSemanticLoadingProcessStepLabel(
            normalizedStepId,
            normalizedTranslationKey
          );
        }
        this.loadingProcessSteps = nextSteps;
      },
      completeCurrentPreparePhaseSemanticLoadingSteps() {
        if (!Array.isArray(this.loadingProcessSteps) || this.loadingProcessSteps.length === 0) {
          return;
        }
        const now = this.getProcessTimingNow();
        let changed = false;
        const nextSteps = this.loadingProcessSteps.map((step) => {
          const nextStep = { ...step };
          if (
            this.isPreparePhaseSemanticLoadingStep(nextStep.id) &&
            nextStep.status === "current"
          ) {
            nextStep.status = "completed";
            this.completeProcessStepTiming(nextStep, now);
            changed = true;
          }
          return nextStep;
        });
        if (changed) {
          this.loadingProcessSteps = nextSteps;
        }
      },
      updateSearchLoadingStatus(stepKey = "", isTranslating = true) {
        if (this.compactLoadingUi) {
          return;
        }
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          this.clearSearchLoadingStatus();
          return;
        }
        if (!String(stepKey || "").trim()) {
          this.ensureSemanticLoadingProcessSteps();
          return;
        }
        const stepId = this.getSemanticLoadingProcessStepId(stepKey);
        const translationKey = this.getSemanticSearchLoadingTranslationKey(stepKey);
        if (this.isConcurrentSemanticLoadingStep(stepId)) {
          if (isTranslating) {
            this.activateConcurrentSemanticLoadingStep(stepId, translationKey);
          } else {
            this.completeConcurrentSemanticLoadingStep(stepId, translationKey);
          }
        } else if (isTranslating) {
          this.activateSemanticLoadingProcessStep(stepId, translationKey);
        } else if (this.isPreparePhaseSemanticLoadingStep(stepId)) {
          // The preparation lane finished (its translating=false fires once the whole
          // PubMed query build incl. MeSH refine is done); complete the step that is
          // still "current" so its live counter stops instead of staying frozen.
          this.completeCurrentPreparePhaseSemanticLoadingSteps();
        }
        this.clearLoadingStatusDotInterval();
        if (isTranslating) {
          this.searchLoadingStatusText = this.getSemanticLoadingProcessStepLabel(
            stepId,
            translationKey
          );
        }
      },
      startAnimatedLoadingStatus(stepId, translationKey) {
        if (this.compactLoadingUi) {
          return;
        }
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          return;
        }
        this.activateSemanticLoadingProcessStep(stepId, translationKey);
        this.clearLoadingStatusDotInterval();
        this.loadingStatusDotBaseText = this.getSemanticLoadingProcessStepLabel(
          stepId,
          translationKey
        ).replace(/\s*[.!?]+\s*$/, "");
        let dotCount = 0;
        const updateText = () => {
          if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
            this.clearLoadingStatusDotInterval();
            return;
          }
          dotCount = (dotCount % 3) + 1;
          this.searchLoadingStatusText = `${this.loadingStatusDotBaseText}${".".repeat(dotCount)}`;
        };
        updateText();
        this.loadingStatusDotIntervalId = setInterval(updateText, 400);
      },
      setSemanticFinalizeLoadingStatus(stageKey = "", { hasPmids = false, hasDois = false } = {}) {
        if (this.compactLoadingUi) {
          return;
        }
        if (!this.searchLoading || !this.hasActiveSemanticProcess()) {
          return;
        }
        this.clearLoadingStatusDotInterval();
        const normalizedStageKey = String(stageKey || "").trim();
        let translationKey = "semanticSearchProgressFinalize";
        let processStepId = "rerank";
        if (normalizedStageKey === "collect") {
          translationKey = "semanticSearchProgressRerank";
          processStepId = "rerank";
        } else if (normalizedStageKey === "hydrate") {
          processStepId = "finalizeHydrate";
          if (!this.shouldShowPubMedRelatedSemanticProcessSteps()) {
            translationKey = hasDois ? "semanticSearchProgressFinalizeHydrateOpenAlex" : "semanticSearchProgressFinalizeHydrate";
          } else if (hasPmids && hasDois) {
            translationKey = "semanticSearchProgressFinalizeHydrateMixed";
          } else if (hasPmids) {
            translationKey = "semanticSearchProgressFinalizeHydratePubMed";
          } else if (hasDois) {
            translationKey = "semanticSearchProgressFinalizeHydrateOpenAlex";
          } else {
            translationKey = "semanticSearchProgressFinalizeHydrate";
          }
        } else if (normalizedStageKey === "sort") {
          translationKey = "semanticSearchProgressFinalizeSort";
          processStepId = "finalizeSort";
        } else if (normalizedStageKey === "selected" || normalizedStageKey === "render") {
          // Packaging / preselected pmid merge is not a visible process step.
          return;
        }
        this.activateSemanticLoadingProcessStep(processStepId, translationKey);
        this.searchLoadingStatusText = this.getString(translationKey);
      },
      syncDeferredSemanticTagsForMode(mode) {
        this.clearGlobalSemanticSearchState();
        const includePubmedBaseQuery = this.selectedTranslationSources.includes("pubmed");
        this.getAllSelectedSearchItems().forEach((item) => {
          if (item?.semanticFlowType !== "deferred") return;
          item.useSemanticScholar = false;
          item.semanticScholarQuery = "";
          item.semanticIntentPayload = null;
          item.llmSemanticIntent = null;
          item.semanticIntentMeta = null;
          item.semanticSourceQueryPlan = null;
          item.pubmedGeneratedQuery = "";
          item.pubmedMeshDetail = null;
          item.semanticScholarPmids = [];
          item.semanticScholarDois = [];
          item.semanticScholarCandidates = [];
          item.semanticSourceResults = [];
          item.semanticScholarError = "";
          item.includeTranslatedTextInQuery = includePubmedBaseQuery;
          item.isPendingSemanticSearch = mode === "semantic";
        });
      },
      toggleTranslationSourcesPanel() {
        this.translationSourcesExpanded = !this.translationSourcesExpanded;
      },
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
          this.limitsContent = await loadLimitsFromRuntime(this.currentDomain);
        } catch (error) {
          this.limitsContent = [];
          console.error("Failed to load limits from runtime content API.", error);
        }
      },
      isDatabaseLimitItem(item) {
        return String(item?.translationSourceKey || "").trim() !== "";
      },
      isDatabaseLimitGroup(group) {
        const choices = Array.isArray(group?.choices)
          ? group.choices
          : Array.isArray(group?.groups)
          ? group.groups
          : [];
        return choices.some((item) => this.isDatabaseLimitItem(item));
      },
      filterAvailableDatabaseChoices(items) {
        return (Array.isArray(items) ? items : []).filter((item) => {
          if (!this.isDatabaseLimitItem(item)) return true;
          return this.isTranslationSourceAvailable(item.translationSourceKey);
        });
      },
      handleElicitUnlockChanged(event) {
        // Fired by promptForElicitUnlockKey after the backend theme config has
        // been re-fetched with the new code. When the unlock actually took
        // effect we mirror the previous reload-based UX by auto-selecting
        // Elicit so the user doesn't have to click it separately.
        if (!event?.detail?.unlocked) return;
        if (!this.isAiFeatureEnabled) return;
        if (runtimeConfig.elicitGated === true) return;
        if (!this.isTranslationSourceAvailable("elicit")) return;
        if (this.searchWithElicit) return;
        this.searchWithElicit = true;
      },
      augmentDatabaseChoicesWithLocked(items) {
        // Mirrors the simple-search behaviour: when Elicit is gated by the
        // backend and the integration opted in via data-show-elicit-unlock-button,
        // keep the Elicit choice visible in the advanced-mode database dropdown
        // but flag it as `locked: true` so DropdownWrapper can render a lock
        // icon and open the unlock prompt instead of selecting it.
        //
        // Using getDatabaseLimitChoicesCatalog() (which derives from the
        // canonical limitsContent) rather than the passed-in `items` means the
        // list reacts to runtime-state changes (e.g. elicitGated flipping to
        // false after a successful in-place unlock) without needing to
        // re-run prepareLimitOptions / reload the page.
        const filtered = this.getDatabaseLimitChoicesCatalog();
        if (this.showElicitUnlockButton !== true) return filtered;
        if (!this.isAiFeatureEnabled) return filtered;
        if (runtimeConfig.elicitGated !== true) return filtered;
        if (
          filtered.some(
            (item) => String(item?.translationSourceKey || "").trim() === "elicit"
          )
        ) {
          return filtered.map((item) =>
            String(item?.translationSourceKey || "").trim() === "elicit"
              ? { ...item, locked: true }
              : item
          );
        }
        const databaseGroup = (Array.isArray(this.limitsContent) ? this.limitsContent : []).find(
          (group) => this.isDatabaseLimitGroup(group)
        );
        const rawChoices = Array.isArray(databaseGroup?.choices)
          ? databaseGroup.choices
          : Array.isArray(databaseGroup?.groups)
          ? databaseGroup.groups
          : [];
        const elicitChoice = rawChoices.find(
          (item) => String(item?.translationSourceKey || "").trim() === "elicit"
        );
        if (!elicitChoice) return filtered;
        return [...filtered, { ...cloneDeep(elicitChoice), locked: true }];
      },
      getDatabaseLimitChoicesCatalog() {
        const databaseGroup = (Array.isArray(this.limitsContent) ? this.limitsContent : []).find((group) =>
          this.isDatabaseLimitGroup(group)
        );
        if (!databaseGroup) return [];
        const choices = Array.isArray(databaseGroup?.choices)
          ? databaseGroup.choices
          : Array.isArray(databaseGroup?.groups)
          ? databaseGroup.groups
          : [];
        return this.filterAvailableDatabaseChoices(choices).map((item) => cloneDeep(item));
      },
      buildDatabaseLimitDropdownFromSelectedSources() {
        const choicesBySource = new Map(
          this.getDatabaseLimitChoicesCatalog()
            .map((item) => [String(item?.translationSourceKey || "").trim(), item])
            .filter(([key]) => key !== "")
        );
        return this.normalizeTranslationSourcesList(this.selectedTranslationSources)
          .map((sourceKey) => {
            const choice = choicesBySource.get(sourceKey);
            return choice ? { ...choice, scope: "normal" } : null;
          })
          .filter(Boolean);
      },
      stripDatabaseLimitItemsFromDropdowns(dropdowns) {
        return (Array.isArray(dropdowns) ? dropdowns : [])
          .map((group) =>
            (Array.isArray(group) ? group : []).filter((item) => !this.isDatabaseLimitItem(item))
          )
          .filter((group) => group.length > 0);
      },
      getTranslationSourcesFromLimitDropdowns(dropdowns = this.limitDropdowns) {
        const selectedSources = (Array.isArray(dropdowns) ? dropdowns : [])
          .flatMap((group) => (Array.isArray(group) ? group : []))
          .filter((item) => this.isDatabaseLimitItem(item))
          .map((item) => String(item?.translationSourceKey || "").trim())
          .filter(Boolean);
        return this.normalizeTranslationSourcesList(selectedSources);
      },
      isDatabaseLimitDropdown(index) {
        const dropdownItems = Array.isArray(this.limitDropdowns[index]) ? this.limitDropdowns[index] : [];
        return dropdownItems.some((item) => this.isDatabaseLimitItem(item));
      },
      hasAllAvailableDatabasesSelected(index) {
        if (!this.isDatabaseLimitDropdown(index)) return false;
        const dropdownItems = Array.isArray(this.limitDropdowns[index]) ? this.limitDropdowns[index] : [];
        const selectedDatabaseCount = dropdownItems.filter((item) => this.isDatabaseLimitItem(item)).length;
        const availableDatabaseCount = this.getDatabaseLimitChoicesCatalog().length;
        if (availableDatabaseCount <= 0) return false;
        if (selectedDatabaseCount < availableDatabaseCount) return false;
        // When Elicit is gated but shown as a locked option in the dropdown,
        // there is still a visible (non-selectable) entry left, so treat the
        // selection as not fully complete to keep the "Vælg database" placeholder.
        if (
          this.showElicitUnlockButton === true &&
          this.isAiFeatureEnabled &&
          runtimeConfig.elicitGated === true
        ) {
          return false;
        }
        return true;
      },
      limitDropdownsEqual(left, right) {
        const normalize = (dropdowns) =>
          (Array.isArray(dropdowns) ? dropdowns : [])
            .map((group) =>
              (Array.isArray(group) ? group : [])
                .map((item) => this.limitSelectionIdentity(item))
                .filter(Boolean)
            )
            .filter((group) => group.length > 0);
        const leftNormalized = normalize(left);
        const rightNormalized = normalize(right);
        if (leftNormalized.length !== rightNormalized.length) return false;
        return leftNormalized.every((group, index) => {
          const other = rightNormalized[index] || [];
          if (group.length !== other.length) return false;
          return group.every((key, keyIndex) => key === other[keyIndex]);
        });
      },
      syncAdvancedDatabaseDropdownsFromTranslationSources() {
        if (!this.advanced) return;
        const nonDatabaseDropdowns = this.stripDatabaseLimitItemsFromDropdowns(this.limitDropdowns);
        const databaseDropdown = this.buildDatabaseLimitDropdownFromSelectedSources();
        const nextDropdowns = this.normalizeLimitDropdowns(
          databaseDropdown.length > 0 ? [...nonDatabaseDropdowns, databaseDropdown] : nonDatabaseDropdowns
        );
        if (!this.limitDropdownsEqual(this.limitDropdowns, nextDropdowns)) {
          this.limitDropdowns = nextDropdowns;
        }
        this.syncLimitDataFromDropdowns();
      },
      syncTranslationSourcesFromLimitDropdowns(markTouched = false, dropdowns = this.limitDropdowns) {
        const nextSources = this.resolveSelectedTranslationSources(
          this.getTranslationSourcesFromLimitDropdowns(dropdowns)
        );
        if (this.translationSourcesListsEqual(this.selectedTranslationSources, nextSources)) {
          return false;
        }
        this.setSelectedTranslationSources(nextSources, markTouched);
        return true;
      },
      getLimitOptionsForDropdown(index) {
        const currentDropdown = Array.isArray(this.limitDropdowns[index]) ? this.limitDropdowns[index] : [];
        const hasDatabaseSelections = currentDropdown.some((item) => this.isDatabaseLimitItem(item));
        const hasRegularSelections = currentDropdown.some((item) => !this.isDatabaseLimitItem(item));
        const activeDatabaseDropdownIndex = this.limitDropdowns.findIndex(
          (group) => Array.isArray(group) && group.some((item) => this.isDatabaseLimitItem(item))
        );
        return (Array.isArray(this.limitOptions) ? this.limitOptions : [])
          .map((option) => {
            const optionGroups = option.groups || option.choices || [];
            if (!this.isDatabaseLimitGroup(option)) {
              if (option.groups === optionGroups) {
                return option;
              }
              return {
                ...option,
                groups: optionGroups,
              };
            }
            const databaseChoices = this.augmentDatabaseChoicesWithLocked(option.choices);
            return {
              ...option,
              choices: databaseChoices,
              groups: databaseChoices,
            };
          })
          .filter((option) => {
            const isDatabaseGroup = this.isDatabaseLimitGroup(option);
            if (isDatabaseGroup) {
              if (hasRegularSelections) {
                return false;
              }
              if (
                activeDatabaseDropdownIndex >= 0 &&
                activeDatabaseDropdownIndex !== index &&
                !hasDatabaseSelections
              ) {
                return false;
              }
              return Array.isArray(option.choices) && option.choices.length > 0;
            }
            return !hasDatabaseSelections;
          });
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
          .flatMap((items) => {
            const uniqueItems = this.dedupeLimitDropdownItems(
              (Array.isArray(items) ? items : []).filter((item) => {
                if (!this.isDatabaseLimitItem(item)) {
                  return true;
                }
                return this.isTranslationSourceAvailable(item.translationSourceKey);
              })
            );
            const regularItems = uniqueItems.filter((item) => !this.isDatabaseLimitItem(item));
            const databaseItems = uniqueItems
              .filter((item) => this.isDatabaseLimitItem(item))
              .map((item) => ({ ...item, scope: "normal" }));
            if (regularItems.length > 0 && databaseItems.length > 0) {
              return [regularItems, databaseItems];
            }
            if (regularItems.length > 0) {
              return [regularItems];
            }
            if (databaseItems.length > 0) {
              return [databaseItems];
            }
            return [];
          })
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
          document.getElementById("mugin-searchform") ||
          document.querySelector('[id^="mugin-searchform-"]') ||
          document.getElementById("searchform");

        if (!appElement) {
          appElement = document.body;
        }

        if (!appElement) {
          console.error("initializeFocusVisible: Could not find any suitable element!");
          return;
        }

        // Add mugin_vapp class to match CSS selectors
        appElement.classList.add("mugin_vapp");

        // Start in mouse mode - only show focus outlines when user uses keyboard
        appElement.classList.add("mugin_mouse-mode");
        appElement.classList.remove("mugin_keyboard-mode");

        // Switch only on keyboard navigation keys
        const handleKeyDown = (event) => {
          if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            appElement.classList.add("mugin_keyboard-mode");
            appElement.classList.remove("mugin_mouse-mode");
          }
        };

        // Switch to mouse mode on click interactions
        const handleMouseDown = () => {
          appElement.classList.add("mugin_mouse-mode");
          appElement.classList.remove("mugin_keyboard-mode");
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

        if (this.advanced) {
          this.syncAdvancedDatabaseDropdownsFromTranslationSources();
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

          if (this.isDatabaseLimitGroup(filterItem)) {
            filterItem.choices = this.filterAvailableDatabaseChoices(filterItem.choices);
            if (!Array.isArray(filterItem.choices) || filterItem.choices.length === 0) {
              return;
            }
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
      getSearchFlowDebugConsolePrefix() {
        return `[SearchFlowDebug][SearchForm_${this.componentNo}]`;
      },
      getActiveSearchFlowDebugRun() {
        return this.isSearchFlowDebugEnabled ? this.searchFlowDebugRun : null;
      },
      startSearchFlowDebugRun(mode = "search") {
        if (!this.isSearchFlowDebugEnabled) {
          return null;
        }
        const nextRunId = this.searchFlowDebugRunCounter + 1;
        this.searchFlowDebugRunCounter = nextRunId;
        const label = `${this.getSearchFlowDebugConsolePrefix()} ${mode} #${nextRunId}`;
        this.searchFlowDebugRun = {
          id: nextRunId,
          mode,
          startedAt: Date.now(),
          label,
          consolePrefix: this.getSearchFlowDebugConsolePrefix(),
          sourceSnapshots: [],
          ledger: new Map(),
          filterEvents: [],
          finalRecords: [],
          rootItems: [],
          sectionStack: [],
        };
        this.logSearchFlowDebugInfo("Run context", {
          mode,
          componentNo: this.componentNo,
          debugFromWidget: this.debugSearchFlow === true,
          debugFromUrl: this.searchFlowDebugEnabledFromUrl === true,
        });
        return this.searchFlowDebugRun;
      },
      finishSearchFlowDebugRun(status = "completed", details = {}) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return;
        }
        this.logSearchFlowDebugInfo("Run status", {
          status,
          elapsedMs: Math.max(0, Date.now() - Number(run.startedAt || Date.now())),
          ...details,
        });
        this.flushSearchFlowDebugRun(run);
        this.searchFlowDebugRun = null;
      },
      getActiveSearchFlowDebugSection() {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run || !Array.isArray(run.sectionStack) || run.sectionStack.length === 0) {
          return null;
        }
        return run.sectionStack[run.sectionStack.length - 1] || null;
      },
      getSearchFlowDebugNow() {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
          return performance.now();
        }
        return Date.now();
      },
      roundSearchFlowDebugElapsedMs(value) {
        return Math.max(0, Math.round(Number(value || 0)));
      },
      buildSearchFlowDebugPayloadObject(payload = undefined) {
        if (payload === undefined) {
          return undefined;
        }
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          return { ...payload };
        }
        return {
          value: payload,
        };
      },
      buildSearchFlowDebugNestedEntry(entry = {}) {
        const payloadObject = this.buildSearchFlowDebugPayloadObject(entry.payload);
        const nestedEntry = {
          label: String(entry.label || "").trim(),
        };
        if (entry.level && entry.level !== "info") {
          nestedEntry.level = entry.level;
        }
        if (payloadObject && typeof payloadObject === "object") {
          Object.assign(nestedEntry, payloadObject);
        }
        return nestedEntry;
      },
      buildSearchFlowDebugStepPayload(step = {}) {
        const stepPayload = {
          status: String(step.status || "ok").trim() || "ok",
          elapsedMs: this.roundSearchFlowDebugElapsedMs(step.elapsedMs),
        };
        if (step.level && step.level !== "info") {
          stepPayload.level = step.level;
        }
        const metaObject = this.buildSearchFlowDebugPayloadObject(step.meta);
        if (metaObject && typeof metaObject === "object") {
          Object.assign(stepPayload, metaObject);
        }
        const items = Array.isArray(step.items) ? step.items : [];
        if (items.length > 0) {
          stepPayload.details = items.map((item) => {
            if (item?.kind === "step") {
              return {
                step: String(item.step?.title || "").trim(),
                ...this.buildSearchFlowDebugStepPayload(item.step),
              };
            }
            return this.buildSearchFlowDebugNestedEntry(item?.entry || {});
          });
        }
        return stepPayload;
      },
      emitSearchFlowDebugConsoleEntry(run, entry = {}) {
        const label = String(entry.label || "").trim();
        if (!label) {
          return;
        }
        const method = entry.level === "warn" || entry.level === "error" ? "warn" : "info";
        const payloadObject = this.buildSearchFlowDebugPayloadObject(entry.payload);
        const prefix = String(run?.consolePrefix || this.getSearchFlowDebugConsolePrefix()).trim();
        if (payloadObject === undefined) {
          console[method](`${prefix} ${label}`);
          return;
        }
        console[method](`${prefix} ${label}`, payloadObject);
      },
      emitSearchFlowDebugConsoleStep(run, step = {}) {
        const title = String(step.title || "").trim();
        if (!title) {
          return;
        }
        const method = step.level === "warn" || step.level === "error" ? "warn" : "info";
        const prefix = String(run?.consolePrefix || this.getSearchFlowDebugConsolePrefix()).trim();
        console[method](`${prefix} ${title}`, this.buildSearchFlowDebugStepPayload(step));
      },
      flushSearchFlowDebugRun(run) {
        if (!run || !Array.isArray(run.rootItems)) {
          return;
        }
        const openedRootGroup = openSearchFlowDebugConsoleGroup(
          true,
          String(run.label || `${this.getSearchFlowDebugConsolePrefix()} ${run.mode || "run"}`).trim(),
          true
        );
        try {
          run.rootItems.forEach((item) => {
            if (item?.kind === "step") {
              this.emitSearchFlowDebugConsoleStep(run, item.step);
              return;
            }
            this.emitSearchFlowDebugConsoleEntry(run, item?.entry || {});
          });
        } finally {
          closeSearchFlowDebugConsoleGroup(openedRootGroup);
        }
      },
      recordSearchFlowDebugEntry(level = "info", label, payload = undefined) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return;
        }
        const entry = {
          level: level === "warn" || level === "error" ? level : "info",
          label: String(label || "").trim(),
          payload,
        };
        if (!entry.label) {
          return;
        }
        const section = this.getActiveSearchFlowDebugSection();
        if (section) {
          section.items.push({
            kind: "entry",
            entry,
          });
          return;
        }
        run.rootItems.push({
          kind: "entry",
          entry,
        });
      },
      beginSearchFlowDebugStep(title) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return null;
        }
        const step = {
          title: String(title || "").trim(),
          startedAt: this.getSearchFlowDebugNow(),
          elapsedMs: 0,
          status: "ok",
          level: "info",
          meta: {},
          items: [],
        };
        if (!step.title) {
          return null;
        }
        const parent = this.getActiveSearchFlowDebugSection();
        const targetItems = parent ? parent.items : run.rootItems;
        targetItems.push({
          kind: "step",
          step,
        });
        run.sectionStack.push(step);
        return step;
      },
      endSearchFlowDebugStep(step, status = "ok", meta = {}) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run || !step) {
          return;
        }
        const stackIndex = run.sectionStack.lastIndexOf(step);
        if (stackIndex >= 0) {
          run.sectionStack.splice(stackIndex, 1);
        }
        step.status = String(status || "ok").trim() || "ok";
        step.level = step.status === "error" ? "warn" : "info";
        step.elapsedMs = this.roundSearchFlowDebugElapsedMs(
          this.getSearchFlowDebugNow() - Number(step.startedAt || this.getSearchFlowDebugNow())
        );
        step.meta = meta && typeof meta === "object" ? { ...meta } : {};
      },
      async runSearchFlowDebugSection(title, task, collapsed = true) {
        void collapsed;
        if (!this.getActiveSearchFlowDebugRun()) {
          return await task();
        }
        const step = this.beginSearchFlowDebugStep(title);
        try {
          const result = await task();
          this.endSearchFlowDebugStep(step, "ok");
          return result;
        } catch (error) {
          this.endSearchFlowDebugStep(step, "error", {
            error: String(error || ""),
          });
          throw error;
        }
      },
      logSearchFlowDebugInfo(label, payload = undefined) {
        this.recordSearchFlowDebugEntry("info", label, payload);
      },
      logSearchFlowDebugWarn(label, payload = undefined) {
        this.recordSearchFlowDebugEntry("warn", label, payload);
      },
      logSearchFlowDebugTable(label, rows = []) {
        if (!this.getActiveSearchFlowDebugRun()) {
          return;
        }
        const safeRows = Array.isArray(rows) ? rows : [];
        this.recordSearchFlowDebugEntry("info", label, {
          count: safeRows.length,
          rows: safeRows,
        });
      },
      getSearchFlowDebugSemanticItems() {
        const selectedItems = [
          ...this.getAllSelectedSearchItems(),
          ...(this.globalSemanticSearchState ? [this.globalSemanticSearchState] : []),
        ];
        const seen = new Set();
        return selectedItems.filter((item) => {
          const key = String(item?.id || item?.preTranslation || item?.name || "")
            .trim()
            .toLowerCase();
          if (!key || seen.has(key)) {
            return false;
          }
          seen.add(key);
          return (
            item?.semanticFlowType === "deferred" ||
            item?.semanticFlowType === "global-intent" ||
            Array.isArray(item?.semanticSourceResults) ||
            Array.isArray(item?.semanticScholarCandidates)
          );
        });
      },
      ensureSearchFlowDebugLedgerEntry(record = {}) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return null;
        }
        const key = buildSearchFlowRecordKey(record);
        if (!key) {
          return null;
        }
        if (!run.ledger.has(key)) {
          run.ledger.set(key, {
            key,
            pmid: "",
            doi: "",
            openAlexId: "",
            title: "",
            sources: new Set(),
            stages: [],
            stageKeys: new Set(),
            final: false,
            finalPosition: null,
          });
        }
        const entry = run.ledger.get(key);
        if (!entry.pmid) {
          entry.pmid = String(record?.pmid ?? record?.uid ?? "").trim();
        }
        if (!entry.doi) {
          entry.doi = normalizeDoiValue(record?.doi || "");
        }
        if (!entry.openAlexId) {
          entry.openAlexId = String(record?.openAlexId || "").trim();
        }
        if (!entry.title) {
          entry.title = String(record?.title || "").trim();
        }
        return entry;
      },
      recordSearchFlowDebugLedgerStage(record = {}, stage = "", meta = {}) {
        const entry = this.ensureSearchFlowDebugLedgerEntry(record);
        if (!entry || !stage) {
          return;
        }
        const sources = [
          ...(Array.isArray(record?.sources) ? record.sources : []),
          ...(Array.isArray(meta?.sources) ? meta.sources : []),
          meta?.source,
          record?.source,
          record?.originSource,
        ]
          .map((value) => String(value || "").trim())
          .filter(Boolean);
        sources.forEach((source) => entry.sources.add(source));
        const reason = String(meta?.reason || record?.reason || "").trim();
        const detailValue = meta?.detail;
        const detail =
          detailValue && typeof detailValue === "object"
            ? JSON.stringify(detailValue)
            : String(detailValue || "").trim();
        const stageKey = JSON.stringify([stage, sources.join("|"), reason, detail]);
        if (entry.stageKeys.has(stageKey)) {
          return;
        }
        entry.stageKeys.add(stageKey);
        entry.stages.push({
          stage,
          sources,
          reason,
          detail,
        });
        if (meta?.final === true) {
          entry.final = true;
          if (Number.isFinite(Number(meta?.position))) {
            entry.finalPosition = Number(meta.position);
          }
        }
      },
      captureSearchFlowDebugSourceSnapshots() {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return [];
        }
        const snapshots = this.getSearchFlowDebugSemanticItems().map((item) => ({
          itemKey: String(item?.id || item?.preTranslation || item?.name || "")
            .trim()
            .toLowerCase(),
          itemLabel: String(item?.preTranslation || item?.name || "").trim(),
          semanticQuery: String(item?.semanticScholarQuery || "").trim(),
          pubmedGeneratedQuery: String(item?.pubmedGeneratedQuery || "").trim(),
          sourceResults: Array.isArray(item?.semanticSourceResults) ? item.semanticSourceResults : [],
          semanticScholarCandidates: Array.isArray(item?.semanticScholarCandidates)
            ? item.semanticScholarCandidates
            : [],
          semanticMergeDebug:
            item?.semanticMergeDebug && typeof item.semanticMergeDebug === "object"
              ? item.semanticMergeDebug
              : null,
        }));
        run.sourceSnapshots = snapshots;
        snapshots.forEach((snapshot) => {
          snapshot.sourceResults.forEach((sourceResult) => {
            const source = String(sourceResult?.source || "").trim();
            (Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : []).forEach((candidate) => {
              this.recordSearchFlowDebugLedgerStage(candidate, "fetchedFromSource", {
                source,
                detail: {
                  tag: snapshot.itemLabel,
                  query: snapshot.semanticQuery || sourceResult?.query || "",
                },
              });
            });
            (Array.isArray(sourceResult?.debug?.droppedRecords) ? sourceResult.debug.droppedRecords : []).forEach(
              (record) => {
                this.recordSearchFlowDebugLedgerStage(record, "droppedInBackendNormalization", {
                  source,
                  reason: String(record?.reason || "").trim(),
                  detail: {
                    tag: snapshot.itemLabel,
                    query: snapshot.semanticQuery || sourceResult?.query || "",
                  },
                });
              }
            );
          });
          (Array.isArray(snapshot?.semanticMergeDebug?.mergeEvents) ? snapshot.semanticMergeDebug.mergeEvents : []).forEach(
            (event) => {
              this.recordSearchFlowDebugLedgerStage(event, "mergedIntoExistingRecord", {
                source: String(event?.source || "").trim(),
                reason: "duplicate-key",
                detail: {
                  tag: snapshot.itemLabel,
                  mergedIntoKey: String(event?.mergedIntoKey || "").trim(),
                },
              });
            }
          );
          snapshot.semanticScholarCandidates.forEach((candidate) => {
            this.recordSearchFlowDebugLedgerStage(candidate, "keptAfterMerge", {
              sources: Array.isArray(candidate?.sources) ? candidate.sources : [],
              detail: {
                tag: snapshot.itemLabel,
              },
            });
          });
        });
        return snapshots;
      },
      recordSearchFlowDebugFilterDecisions(entries = []) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return;
        }
        const safeEntries = Array.isArray(entries) ? entries : [];
        run.filterEvents = safeEntries;
        safeEntries.forEach((entry) => {
          const stage = entry?.allowed
            ? "keptForHydration"
            : entry?.reason === "publication-date-mismatch"
            ? "rejectedByPublicationDate"
            : entry?.reason === "rule-mismatch"
            ? "rejectedByDoiRule"
            : "rejectedByMetadataValidation";
          this.recordSearchFlowDebugLedgerStage(entry?.candidate || entry, stage, {
            source: String(entry?.candidate?.source || "").trim(),
            sources: Array.isArray(entry?.candidate?.sources) ? entry.candidate.sources : [],
            reason: String(entry?.reason || "").trim(),
            detail:
              entry?.ruleExplanation && typeof entry.ruleExplanation === "object"
                ? entry.ruleExplanation
                : "",
          });
        });
      },
      recordSearchFlowDebugHydrationRefs(resultRefs = [], orderedCandidates = []) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return;
        }
        const refKeys = new Set(
          (Array.isArray(resultRefs) ? resultRefs : [])
            .map((entry) => String(entry?.key || "").trim().toLowerCase())
            .filter(Boolean)
        );
        (Array.isArray(orderedCandidates) ? orderedCandidates : []).forEach((candidate) => {
          const key = buildSearchFlowRecordKey(candidate).toLowerCase();
          if (!key || !refKeys.has(key)) {
            return;
          }
          this.recordSearchFlowDebugLedgerStage(candidate, "keptForHydration", {
            sources: Array.isArray(candidate?.sources) ? candidate.sources : [],
            source: String(candidate?.source || "").trim(),
          });
        });
      },
      recordSearchFlowDebugRenderedResults(data = []) {
        (Array.isArray(data) ? data : []).forEach((entry, index) => {
          this.recordSearchFlowDebugLedgerStage(entry, "renderedInFinalResults", {
            source: String(entry?.originSource || entry?.source || "").trim(),
            final: true,
            position: index + 1,
          });
        });
      },
      buildSearchFlowDebugLedgerRows() {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return [];
        }
        return Array.from(run.ledger.values())
          .map((entry) => ({
            key: entry.key,
            pmid: entry.pmid,
            doi: entry.doi,
            openAlexId: entry.openAlexId,
            sources: Array.from(entry.sources).join(", "),
            final: entry.final ? "yes" : "",
            finalPosition: entry.finalPosition ?? "",
            stages: entry.stages.map((stage) => stage.stage).join(" -> "),
            reasons: Array.from(new Set(entry.stages.map((stage) => stage.reason).filter(Boolean))).join(" | "),
            title: String(entry.title || "").slice(0, 160),
          }))
          .sort((left, right) => {
            if (left.final && !right.final) return -1;
            if (!left.final && right.final) return 1;
            return String(left.key).localeCompare(String(right.key));
          });
      },
      buildSearchFlowDebugFinalRows(data = []) {
        return (Array.isArray(data) ? data : []).map((entry, index) => ({
          position: index + 1,
          ...summarizeSearchFlowRecord(entry),
          source: String(entry?.originSource || entry?.source || "").trim(),
          canOpenInPubMed: entry?.canOpenInPubMed === true,
        }));
      },
      logSearchFlowDebugFinalSummary({ query = "", resultRefs = [], orderedCandidates = [], data = [] } = {}) {
        const run = this.getActiveSearchFlowDebugRun();
        if (!run) {
          return;
        }
        const snapshots = this.captureSearchFlowDebugSourceSnapshots();
        this.recordSearchFlowDebugHydrationRefs(resultRefs, orderedCandidates);
        this.recordSearchFlowDebugRenderedResults(data);
        const sourceRows = snapshots.flatMap((snapshot) =>
          snapshot.sourceResults.map((sourceResult) => ({
            tag: snapshot.itemLabel,
            source: String(sourceResult?.source || "").trim(),
            query: String(sourceResult?.query || snapshot.semanticQuery || "").trim(),
            pubmedQuery: snapshot.pubmedGeneratedQuery,
            total: Number(sourceResult?.total || 0),
            candidateCount: Array.isArray(sourceResult?.candidates) ? sourceResult.candidates.length : 0,
            pmidCount: Array.isArray(sourceResult?.pmids) ? sourceResult.pmids.length : 0,
            doiCount: Array.isArray(sourceResult?.dois) ? sourceResult.dois.length : 0,
            droppedBeforeReturn: Number(sourceResult?.debug?.droppedBeforeReturn || 0),
            warning: String(sourceResult?.warning || "").trim(),
            error: String(sourceResult?.error || "").trim(),
          }))
        );
        this.logSearchFlowDebugInfo("Final result summary", {
          query,
          renderedCount: Array.isArray(data) ? data.length : 0,
          resultRefCount: Array.isArray(resultRefs) ? resultRefs.length : 0,
          ledgerRecordCount: run.ledger.size,
          semanticTagCount: snapshots.length,
        });
        this.logSearchFlowDebugTable("Source summary", sourceRows);
        this.logSearchFlowDebugTable("Record ledger", this.buildSearchFlowDebugLedgerRows());
        this.logSearchFlowDebugTable("Rendered result composition", this.buildSearchFlowDebugFinalRows(data));
      },
      /**
       * Parses the current URL's query parameters and updates the component's state accordingly.
       * Handles domain, topics, limits, advanced mode, sorting, collapsed state, page size,
       * preselected articles, and scroll position. URL `domain=` wins over data-domain.
       */
      async parseUrl() {
        // Initialize topics
        this.topics = [];
        this.urlTranslationSources = [];
        this.rerankProfileFromUrl = false;
        this.searchFlowDebugEnabledFromUrl = false;
        this.searchFlowDebugEnabled = this.debugSearchFlow === true;

        // Parse the current URL (search + hash query fallback for CMS embeds)
        const urlParams = getSearchFlowDebugUrlParams();
        if (this.isUrlTargetedComponent(urlParams)) {
          claimSharedSearchFormUrl(this.componentNo);
        } else {
          this.topics = [[]];
          this.applyStoredOrDefaultRerankProfileSelection(false);
          return;
        }

        // domain= must apply before topic/limit resolution (URL wins over data-domain).
        const domainBefore = String(this.currentDomain || "");
        const domainFromUrl = syncUrlDomainOverrideFromLocation();
        if (domainFromUrl !== null) {
          const domainAfter = String(this.currentDomain || "");
          runtimeConfig.domain = domainAfter;
          if (domainAfter !== domainBefore) {
            await this.loadTopicsData();
            await this.loadLimitsData();
            try {
              await loadThemeOverridesFromBackend(domainAfter, this.appSettings?.nlm?.proxyUrl);
              applyThemeFromConfig(domainAfter);
            } catch (error) {
              // Theme overrides are best-effort; search should still parse.
            }
          }
        }

        // Check if there are query parameters
        if (![...urlParams.keys()].length) {
          this.topics = [[]];
          this.applyStoredOrDefaultRerankProfileSelection(false);
          return;
        }

        // The topic/limit parsers build custom free-text tags based on the
        // current AI and semantic-source selection (see buildUrlCustomFreeTextTag).
        // The URL serialization places topic/limit parameters before `ai` and
        // `databases`, so we need a first pass to apply those mode flags before
        // processing topics/limits in the second pass.
        const modePassKeys = new Set(["ai", "translationsources", "databases", "semanticsources"]);
        let selectedTokens = [];
        let pmidTokens = [];

        const processParameter = (key, value, values) => {
          const normalizedKey = key.replace(/^amp;/i, "");
          const keyLower = normalizedKey.toLowerCase();

          switch (keyLower) {
            case "domain":
              // Already applied above (must win before topic catalog lookup).
              break;

            case "topic":
              this.processTopics(values);
              break;

            case "advanced":
              this.advanced = value === "true";
              break;

            case "ai":
              // "Indtast med AI-oversættelse" is enabled by default; only an
              // explicit "false"/"0" disables it from the URL. Assign the
              // underlying data property directly so we don't accidentally
              // trigger the setter's editForm() side-effect during parsing.
              this.manualAiTranslationEnabled = !(
                value === "false" || value === "0"
              );
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

            case "mugindebug": {
              const debugEnabled = normalizeSearchFlowDebugValue(value);
              this.searchFlowDebugEnabledFromUrl = debugEnabled;
              this.searchFlowDebugEnabled = this.debugSearchFlow === true || debugEnabled;
              break;
            }

            case "translationsources":
            case "databases":
            case "semanticsources":
              this.urlTranslationSources = this.normalizeTranslationSourcesList(
                values.filter((entry) => entry.trim() !== "")
              );
              this.setSelectedTranslationSources(this.urlTranslationSources, true);
              break;

            case RERANK_PROFILE_URL_PARAM:
              this.rerankProfileFromUrl = true;
              this.updateRerankProfileSelection(value, false);
              break;

            case "selected":
              selectedTokens = values;
              break;

            case "pmid":
              pmidTokens = values;
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

            case "component":
              // Instance targeting is resolved before this pass.
              break;

            case "apibase":
            case "apikey":
            case "elicitkey":
            case "nocache":
            case "q":
            case "query":
            case "lang":
            case "stream":
              // Page-level or API-only keys; not SearchForm filter groups.
              break;

            case "qpubmed":
            case "qsemanticscholar":
            case "qopenalex":
            case "qelicit":
              // Applied after both passes from the raw URLSearchParams value
              // so commas inside executable queries are not list-split.
              break;

            default:
              this.processFilter(normalizedKey, values);
              break;
          }
        };

        // Pass 1: mode-affecting parameters so topic/limit parsers see the
        // correct AI and translation-source state.
        urlParams.forEach((value, key) => {
          const keyLower = key.replace(/^amp;/i, "").toLowerCase();
          if (!modePassKeys.has(keyLower)) return;
          processParameter(key, value, this.splitUrlListValue(value));
        });

        // Pass 2: all remaining parameters (topic/limit/etc.).
        urlParams.forEach((value, key) => {
          const keyLower = key.replace(/^amp;/i, "").toLowerCase();
          if (modePassKeys.has(keyLower)) return;
          processParameter(key, value, this.splitUrlListValue(value));
        });

        this.preselectedPmidai = normalizeSelectedIdentifierList(
          selectedTokens.length > 0 ? selectedTokens : pmidTokens
        );

        // Flat limit= populates limitDropdowns; in simple mode sync into limitData
        // so checkboxes and PubMed base-query see the same selections.
        if (!this.advanced && this.limitDropdowns.some((group) => Array.isArray(group) && group.length > 0)) {
          this.limitDropdowns = this.normalizeLimitDropdowns(this.limitDropdowns);
          this.syncLimitDataFromDropdowns();
          this.limitDropdowns = [[]];
          this.cleanLimitData();
        }

        // Ensure topics is not empty
        if (this.topics.length === 0) {
          this.topics = [[]];
        }
        this.searchFlowDebugEnabled =
          this.debugSearchFlow === true || this.searchFlowDebugEnabledFromUrl === true;
        if (!this.rerankProfileFromUrl) {
          this.applyStoredOrDefaultRerankProfileSelection(false);
        }
        this.applyQueryOverridesFromUrlParams(urlParams);
      },
      /**
       * Splits URL list values on ',' and legacy ';;', without breaking {{…}} tokens.
       *
       * @param {string} value
       * @returns {string[]}
       */
      splitUrlListValue(value) {
        const raw = String(value ?? "");
        if (!raw) return [];
        const tokens = [];
        let buffer = "";
        let index = 0;
        while (index < raw.length) {
          if (raw.startsWith("{{", index)) {
            const end = raw.indexOf("}}", index);
            if (end === -1) {
              buffer += raw.slice(index);
              break;
            }
            buffer += raw.slice(index, end + 2);
            index = end + 2;
            continue;
          }
          if (raw.startsWith(";;", index)) {
            if (buffer.trim() !== "") tokens.push(buffer.trim());
            buffer = "";
            index += 2;
            continue;
          }
          if (raw[index] === ",") {
            if (buffer.trim() !== "") tokens.push(buffer.trim());
            buffer = "";
            index += 1;
            continue;
          }
          buffer += raw[index];
          index += 1;
        }
        if (buffer.trim() !== "") tokens.push(buffer.trim());
        return tokens;
      },
      /**
       * Resolves a URL scope key (#n/#s/#b). Missing scope defaults to standard (#s).
       * Optional custom fretext mode: `#s:raw` / `#s:pubmed`.
       *
       * @param {string|undefined} scopeKey
       * @returns {string}
       */
      resolveUrlScope(scopeKey) {
        return this.parseUrlScopeToken(scopeKey).scope;
      },
      /**
       * @param {string|undefined} scopeKey
       * @returns {{ scope: string, textMode: ''|'raw'|'pubmed' }}
       */
      parseUrlScopeToken(scopeKey) {
        const raw = String(scopeKey || "s").trim().toLowerCase();
        const [scopePart, modePart = ""] = raw.split(":");
        const scope = scopeIds[scopePart] || scopeIds.s || "normal";
        const textMode = modePart === "raw" || modePart === "pubmed" ? modePart : "";
        return { scope, textMode };
      },
      isUrlTargetedComponent(urlParams = getSearchFlowDebugUrlParams()) {
        return isUrlTargetedSearchFormComponent(
          this.componentNo,
          urlParams,
          readMountedSearchFormComponentNumbers()
        );
      },
      readUrlFlag(name) {
        const raw = getUrlParamCaseInsensitive(getSearchFlowDebugUrlParams(), name);
        return ["1", "true", "yes", "on"].includes(String(raw).trim().toLowerCase());
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
      createUrlCustomTagId() {
        return `__custom__:url:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      },
      /**
       * Builds a custom free-text tag restored from the URL.
       * When AI translation is active together with semantic sources, the tag is
       * flagged as a deferred pending semantic tag so that the PubMed/semantic
       * translations are re-generated at search time (see preparePendingSemanticTags).
       * In all other modes the text is kept exactly as it was stored in the URL.
       */
      buildUrlCustomFreeTextTag(name, scope = "normal", options = {}) {
        const isTranslated = options.isTranslated === true;
        const baseTag = {
          id: this.createUrlCustomTagId(),
          name,
          searchStrings: { normal: [name] },
          preString: `${this.getString("manualInputTerm")}:\u00A0 `,
          scope,
          isCustom: true,
          tooltip: customInputTagTooltip,
        };
        if (this.searchWithAI && this.hasSelectedSemanticSources()) {
          return {
            ...baseTag,
            isTranslated: false,
            preTranslation: name,
            semanticFlowType: "deferred",
            isPendingSemanticSearch: true,
            semanticScholarQuery: "",
            semanticIntentPayload: null,
            llmSemanticIntent: null,
            semanticIntentMeta: null,
            semanticSourceQueryPlan: null,
            pubmedGeneratedQuery: "",
            semanticScholarPmids: [],
            semanticScholarDois: [],
            semanticScholarCandidates: [],
            semanticSourceResults: [],
            semanticRerankDiagnostics: null,
            semanticMergeDebug: null,
            semanticScholarError: "",
            useSemanticScholar: false,
            includeTranslatedTextInQuery: false,
          };
        }
        if (isTranslated) {
          return {
            ...baseTag,
            isTranslated: true,
            preTranslation: name,
            preString: `${this.getString("manualInputTermTranslated")}:\u00A0 `,
            pubmedGeneratedQuery: name,
          };
        }
        return baseTag;
      },
      /**
       * Processes the 'topic' parameters from the URL and populates the topics array.
       *
       * @param {string[]} values - An array of topic values extracted from the URL.
       */
      processTopics(values) {
        const selected = [];

        values.forEach((val) => {
          const hashIndex = String(val || "").lastIndexOf("#");
          const id = hashIndex >= 0 ? val.slice(0, hashIndex) : String(val || "");
          const scopeKey = hashIndex >= 0 ? val.slice(hashIndex + 1) : "s";
          const { scope, textMode } = this.parseUrlScopeToken(scopeKey);
          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");

          if (isCustomInput) {
            let name = id.slice(2, -2);
            let isTranslated = textMode === "pubmed";
            // Legacy: {{text0}} / {{text1}} when mode is absent from #scope.
            if (!textMode) {
              const translationFlag = name.slice(-1);
              if (translationFlag === "0" || translationFlag === "1") {
                isTranslated = translationFlag === "1";
                name = name.slice(0, -1);
              }
            }

            selected.push(this.buildUrlCustomFreeTextTag(name, scope || "normal", { isTranslated }));
            return;
          }

          const normalizedId = id.toUpperCase();

          // Find the topic in topicOptions
          this.topicOptions.forEach((topicOption) => {
            topicOption.groups.forEach((group) => {
              if (group.id === normalizedId) {
                const tmp = { ...group, scope };
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
          const hashIndex = val.lastIndexOf("#");
          const id = hashIndex >= 0 ? val.slice(0, hashIndex) : val;
          const scopeKey = hashIndex >= 0 ? val.slice(hashIndex + 1) : "s";
          const scope = this.resolveUrlScope(scopeKey);

          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");
          const groupId = filterGroup.id;

          if (isCustomInput) {
            const rawName = id.slice(2, -2);
            const translationFlag = rawName.slice(-1);
            const isTranslated = translationFlag === "1";
            const name = isTranslated || translationFlag === "0" ? rawName.slice(0, -1) : rawName;

            if (!this.limitData[groupId]) this.limitData[groupId] = [];
            this.limitData[groupId].push(
              this.buildUrlCustomFreeTextTag(name, "normal", { isTranslated })
            );
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

          const tmp = { ...choice, scope };

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
          const hashIndex = String(val || "").lastIndexOf("#");
          const id = hashIndex >= 0 ? val.slice(0, hashIndex) : String(val || "");
          const scopeKey = hashIndex >= 0 ? val.slice(hashIndex + 1) : "s";
          const scope = this.resolveUrlScope(scopeKey);
          if (!id) return;

          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");

          if (isCustomInput) {
            const rawName = id.slice(2, -2);
            selected.push(this.buildUrlCustomFreeTextTag(rawName, "normal"));
            return;
          }

          const normalizedId = id.toUpperCase();

          // Find the filter choice across all filter options
          for (const filterGroup of this.limitOptions) {
            const choice = filterGroup.choices
              ? filterGroup.choices.find((c) => c.id === normalizedId)
              : null;
            if (choice) {
              selected.push({ ...choice, scope });
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
          dropdownItems
            .filter((item) => !this.isDatabaseLimitItem(item))
            .forEach((item) => {
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
        const nonDatabaseValue = uniqueValue.filter((item) => !this.isDatabaseLimitItem(item));

        const previousValue = Array.isArray(this.limitDropdowns[index]) ? this.limitDropdowns[index] : [];
        const normalizedPreviousValue = previousValue.map((item) => ({
          ...item,
          scope: item?.scope || "normal",
        }));
        if (this.limitDropdownsEqual([normalizedPreviousValue], [uniqueValue])) {
          return;
        }
        const previousKeys = new Set(
          previousValue.map((item) => this.limitSelectionIdentity(item)).filter(Boolean)
        );
        const hasNewSelection = uniqueValue.some((item) => {
          const key = this.limitSelectionIdentity(item);
          return key && !previousKeys.has(key);
        });

        if (hasNewSelection && this.hasMixedLimitCategories(nonDatabaseValue)) {
          const shouldContinue = confirm(this.getString("mixedLimitCategoriesWarning"));
          if (!shouldContinue) return;
        }
        if (hasNewSelection && this.hasDuplicateLimitAcrossDropdowns(uniqueValue, index)) {
          const shouldContinue = confirm(this.getString("duplicateLimitAcrossDropdownsWarning"));
          if (!shouldContinue) return;
        }

        const previousDatabaseSources = this.sortTranslationSourcesList(this.selectedTranslationSources);
        const updated = cloneDeep(this.limitDropdowns);
        updated[index] = uniqueValue;
        const normalizedDropdowns = this.normalizeLimitDropdowns(updated);
        const nextDatabaseSources = this.resolveSelectedTranslationSources(
          this.getTranslationSourcesFromLimitDropdowns(normalizedDropdowns)
        );
        this.limitDropdowns = normalizedDropdowns;

        // Remove extra empty dropdowns — keep at most one empty
        this.removeExtraEmptyDropdowns("limitDropdowns");

        this.syncLimitDataFromDropdowns();
        if (!this.translationSourcesListsEqual(previousDatabaseSources, nextDatabaseSources)) {
          const didSyncSources = this.syncTranslationSourcesFromLimitDropdowns(true, normalizedDropdowns);
          if (!didSyncSources) {
            this.setUrl();
            if (!this.isPreparingSemanticTagRefresh) {
              this.editForm();
            }
          }
          return;
        }
        this.setUrl();
        if (!this.isPreparingSemanticTagRefresh) {
          this.editForm();
        }
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
        const previousDatabaseSources = this.sortTranslationSourcesList(this.selectedTranslationSources);
        const updated = [...this.limitDropdowns];
        updated.splice(index, 1);
        this.limitDropdowns = this.normalizeLimitDropdowns(updated);

        this.syncLimitDataFromDropdowns();
        const nextDatabaseSources = this.resolveSelectedTranslationSources(
          this.getTranslationSourcesFromLimitDropdowns(this.limitDropdowns)
        );
        if (!this.translationSourcesListsEqual(previousDatabaseSources, nextDatabaseSources)) {
          const didSyncSources = this.syncTranslationSourcesFromLimitDropdowns(true, this.limitDropdowns);
          if (!didSyncSources) {
            this.setUrl();
            if (!wasEmpty) this.editForm();
          }
          return;
        }
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
        if (!this.isPreparingSemanticTagRefresh) {
          this.editForm();
        }
      },
      setUrl() {
        if (this.allowSharedUrlWrite) {
          claimSharedSearchFormUrl(this.componentNo);
        }
        if (!isSharedSearchFormUrlOwner(this.componentNo)) {
          return;
        }
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
       * collapsed state, page size, preselected articles, and scroll position.
       *
       * @returns {string} The constructed URL reflecting the current state.
       */
      getUrl() {
        const origin =
          window.location.origin && window.location.origin !== "null" ? window.location.origin : "";

        const baseUrl = `${origin}${window.location.pathname}`;
        const currentParams = getSearchFlowDebugUrlParams();
        const apiBaseParam = (currentParams.get("apiBase") || "").trim();
        const apiBaseStr = apiBaseParam ? `apiBase=${encodeURIComponent(apiBaseParam)}` : "";
        const debugParamStr = this.searchFlowDebugEnabledFromUrl ? buildSearchFlowDebugQueryParam(true) : "";
        const activeDomain = String(this.currentDomain || "").trim().toLowerCase();
        const domainStr = activeDomain ? `domain=${encodeURIComponent(activeDomain)}` : "";
        const componentValue = getComponentUrlParamValue(
          this.componentNo,
          currentParams,
          readMountedSearchFormComponentNumbers()
        );
        const componentStr = componentValue ? `component=${encodeURIComponent(componentValue)}` : "";
        const initialParams = [domainStr, apiBaseStr, debugParamStr, componentStr]
          .filter(Boolean)
          .join("&");
        const translationSourcesParam = this.getTranslationSourcesUrlParamValue();
        const translationSourcesStr =
          translationSourcesParam !== null ? `&databases=${translationSourcesParam}` : "";
        const rerankProfileParam = this.getRerankProfileUrlParamValue();
        const rerankProfileStr = rerankProfileParam
          ? `&${RERANK_PROFILE_URL_PARAM}=${encodeURIComponent(rerankProfileParam)}`
          : "";
        const selectedTokens = normalizeSelectedIdentifierList(this.preselectedPmidai);
        const selectedStr =
          selectedTokens.length > 0
            ? `&selected=${selectedTokens.map((token) => encodeURIComponent(token)).join(",")}`
            : "";
        const queryOverrideStr = this.constructQueryOverrideQuery();

        // If there are no topics selected, return the base URL without parameters

        if (
          !this.hasTopics &&
          !this.openLimitsFromUrl &&
          !this.openLimits &&
          !translationSourcesStr &&
          !rerankProfileStr &&
          !selectedStr &&
          !queryOverrideStr
        ) {
          return initialParams ? `${baseUrl}?${initialParams}` : baseUrl;
        }

        // Build query parameters
        const topicsStr = this.constructTopicsQuery();
        const limitsStr = this.constructLimitsQuery();
        const advancedStr = `&advanced=${this.advanced}`;
        const aiStr = `&ai=${this.searchWithAI}`;
        const sorter = `&sort=${encodeURIComponent(this.sort.method)}`;
        const collapsedStr = `&collapsed=${this.isCollapsed}`;
        const pageSizeStr = `&pagesize=${this.pageSize}`;
        const scrolltoStr = this.scrollToID
          ? `&scrollto=${encodeURIComponent(this.scrollToID)}`
          : "";
        const openLimitsStr = this.openLimitsFromUrl ? `&openlimits=true` : "";
        const hideLimitsStr =
          this.urlHideLimits.length > 0 ? `&hidelimits=${this.urlHideLimits.join(",")}` : "";
        const checkLimitsStr =
          this.urlCheckLimits.length > 0 ? `&checklimits=${this.urlCheckLimits.join(",")}` : "";
        const orderLimitsStr =
          this.urlOrderLimits.length > 0 ? `&orderlimits=${this.urlOrderLimits.join(",")}` : "";

        // Assemble the full URL with all query parameters
        const urlLink = `${baseUrl}?${initialParams}${
          initialParams ? "&" : ""
        }${topicsStr}${limitsStr}${queryOverrideStr}${translationSourcesStr}${rerankProfileStr}${advancedStr}${aiStr}${selectedStr}${sorter}${collapsedStr}${pageSizeStr}${scrolltoStr}${openLimitsStr}${hideLimitsStr}${checkLimitsStr}${orderLimitsStr}`;

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
                // Prefer #s:pubmed / #s:raw over legacy trailing 0/1 inside {{…}}.
                const textMode = subject.isTranslated ? "pubmed" : "raw";
                const shortScope = ["n", "s", "b"].includes(scope) ? scope : "s";
                const customText = subject.isTranslated
                  ? String(subject.pubmedGeneratedQuery || subject.name || "").trim()
                  : String(subject.name || "").trim();
                subjectId = `{{${customText}}}#${shortScope}:${textMode}`;
              } else if (subject.id) {
                subjectId = `${subject.id}#${scope}`;
              }
              return encodeURIComponent(subjectId);
            });

            return `topic=${subjectValues.join(",")}`;
          });

        return subjectQueries.join("&");
      },
      /**
       * Constructs the query string for limits based on selected limits.
       * Canonical form: one or more limit= groups.
       * Within a group (comma-list) → OR; between limit= params → AND.
       * Simple mode: one limit= per category from limitData.
       * Advanced mode: one limit= per dropdown row.
       *
       * @returns {string} The encoded limits query string.
       */
      constructLimitsQuery() {
        const encodeLimitItem = (item, forceNormalScope = false) => {
          const scope = this.getScopeKey(forceNormalScope ? "normal" : item.scope || "normal");
          const valueId =
            item.isCustom || (typeof item.id === "string" && item.id.startsWith("__custom__:"))
              ? `{{${item.name}}}`
              : item.id;
          return encodeURIComponent(`${valueId}#${scope}`);
        };

        if (!this.advanced) {
          // Simple mode: one limit= per category (OR within category, AND between).
          const limitQueries = Object.values(this.limitData || {})
            .filter((values) => Array.isArray(values) && values.length > 0)
            .map((values) => `limit=${values.map((item) => encodeLimitItem(item, true)).join(",")}`);
          return limitQueries.length > 0 ? "&" + limitQueries.join("&") : "";
        }

        // Advanced mode: one limit= parameter per dropdown row (AND between rows).
        if (!this.searchDisplayLimitDropdowns || !this.searchDisplayLimitDropdowns.some((d) => d.length > 0)) {
          return "";
        }

        const limitQueries = this.searchDisplayLimitDropdowns
          .filter((group) => Array.isArray(group) && group.length > 0)
          .map((group) => `limit=${group.map((item) => encodeLimitItem(item, false)).join(",")}`);

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
            this.announceCopyUrlStatus(this.getString("copyUrlSuccess"));
          })
          .catch((err) => {
            console.error("Failed to copy URL: ", err);
            this.announceCopyUrlStatus(this.getString("copyUrlError"));
          });
      },
      // Clears and re-sets the live-region text so screen readers re-announce
      // it even when the same message is used for consecutive copy actions.
      // Also drives the temporary tooltip shown on the copy-URL button.
      announceCopyUrlStatus(message) {
        if (this._copyUrlStatusTimer) {
          clearTimeout(this._copyUrlStatusTimer);
          this._copyUrlStatusTimer = null;
        }
        this.copyUrlStatusMessage = "";
        this.$nextTick(() => {
          this.copyUrlStatusMessage = message;
          this._copyUrlStatusTimer = setTimeout(() => {
            this.copyUrlStatusMessage = "";
            this._copyUrlStatusTimer = null;
          }, 2500);
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
        if (!this.isPreparingSemanticTagRefresh) {
          this.editForm();
        }
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
        this.manualAiTranslationEnabled = true;
        this.translationSourcesUserTouched = false;
        this.applyConfiguredTranslationSources(true);
        this.topics = [[]];
        this.limits = [];
        this.limitData = {};
        this.limitDropdowns = [[]];
        this.matchedRerankedPmids = [];
        this.matchedRerankedResultRefs = [];
        this.semanticBackgroundValidationPromise = null;
        this.pendingSemanticBackgroundValidation = null;
        this.openAlexDoiCache = {};
        this.openAlexDoiPromiseCache = {};
        this.openAlexSourceCache = {};
        this.openAlexSourcePromiseCache = {};
        this.clearGlobalSemanticSearchState();
        this.clearSearchLoadingStatus();
        this.degradedSearchSummary = [];
        this.semanticMetadataByDoiCache = null;
        this.searchresult = undefined;
        this.finalValidatedQuery = "";
        this.resetQueryOverrideState();
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
        // If the user edits the form while a search is running, cancel it so
        // the process-step texts and loading UI disappear immediately and no
        // late-arriving result overwrites the reset state. Existing search
        // checkpoints already bail out when `searchLoading` flips to false;
        // the generation counter covers the few remaining continuations that
        // don't gate on that flag (they compare against the generation they
        // captured at the start of the run).
        if (this.searchLoading) {
          this.searchLoading = false;
          this.searchGeneration = (this.searchGeneration || 0) + 1;
        }
        this.matchedRerankedPmids = [];
        this.matchedRerankedResultRefs = [];
        this.semanticBackgroundValidationPromise = null;
        this.pendingSemanticBackgroundValidation = null;
        this.openAlexDoiPromiseCache = {};
        this.openAlexSourceCache = {};
        this.openAlexSourcePromiseCache = {};
        this.syncDeferredSemanticTagsForMode(this.hasSelectedSemanticSources() ? "semantic" : "pubmedQuery");
        this.clearGlobalSemanticSearchState();
        this.clearSearchLoadingStatus();
        this.degradedSearchSummary = [];
        this.semanticMetadataByDoiCache = null;
        this.searchresult = undefined;
        this.finalValidatedQuery = "";
        // Keep translated freetext + edited search strings for this session.
        // They are cleared on reset (clear()) or when the freetext itself changes.
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
      getBackendApiUrl(endpointFile) {
        const normalizeApiBase = (value) => {
          const base = String(value || "")
            .trim()
            .replace(/\/+$/, "");
          if (!base) return "";
          if (base.endsWith("/api")) return base;
          if (base.endsWith("/backend")) return `${base}/api`;
          return base;
        };
        const apiBaseFromUrl = normalizeApiBase(
          typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("apiBase") : ""
        );
        const baseUrl = apiBaseFromUrl || this.appSettings?.nlm?.proxyUrl || "";
        return `${baseUrl}/${endpointFile}`;
      },
      isOpenAlexSemanticRetrievalEnabled() {
        return this.searchWithOpenAlex === true;
      },
      isOpenAlexDoiResolverEnabled() {
        // Product rule: OpenAlex metadata resolver stays enabled for DOI-only hydration.
        return true;
      },
      readTimedCacheEntry(cacheObject, key) {
        if (!cacheObject || !Object.prototype.hasOwnProperty.call(cacheObject, key)) {
          return { hit: false, value: null };
        }
        const entry = cacheObject[key];
        if (entry && typeof entry === "object" && Object.prototype.hasOwnProperty.call(entry, "expiresAt")) {
          if (Number(entry.expiresAt || 0) <= Date.now()) {
            delete cacheObject[key];
            return { hit: false, value: null };
          }
          return { hit: true, value: entry.value ?? null };
        }
        return { hit: true, value: entry ?? null };
      },
      writeTimedCacheEntry(cacheObject, key, value, ttlMs = OPENALEX_CACHE_TTL_MS) {
        if (!cacheObject || !key) return;
        cacheObject[key] = {
          value,
          expiresAt: Date.now() + Math.max(1000, Number(ttlMs || 0)),
        };
      },
      async mapWithConcurrencyLimit(items, concurrency, mapper) {
        const safeItems = Array.isArray(items) ? items : [];
        if (safeItems.length === 0) return [];
        const safeConcurrency = Math.max(1, Math.floor(Number(concurrency || 1)));
        const output = new Array(safeItems.length);
        let cursor = 0;
        const runWorker = async () => {
          while (cursor < safeItems.length) {
            const currentIndex = cursor;
            cursor += 1;
            output[currentIndex] = await mapper(safeItems[currentIndex], currentIndex);
          }
        };
        const workers = Array.from(
          { length: Math.min(safeConcurrency, safeItems.length) },
          () => runWorker()
        );
        await Promise.all(workers);
        return output;
      },
      getOpenAlexBatchLookupConcurrency() {
        const configured = Number(runtimeConfig?.openAlexBatchLookupConcurrency);
        if (Number.isFinite(configured) && configured > 0) {
          return Math.max(1, Math.min(5, Math.floor(configured)));
        }
        return OPENALEX_BATCH_LOOKUP_CONCURRENCY;
      },
      getItemSemanticPostValidationRules(item) {
        const semanticConfig =
          item?.semanticConfig && typeof item.semanticConfig === "object" ? item.semanticConfig : {};
        const postValidation =
          semanticConfig?.postValidation && typeof semanticConfig.postValidation === "object"
            ? semanticConfig.postValidation
            : {};
        const rules = Array.isArray(postValidation.rules) ? postValidation.rules : [];
        if (rules.length > 0) {
          return rules;
        }
        return Array.isArray(semanticConfig?.doiOnlyRules) ? semanticConfig.doiOnlyRules : [];
      },
      getSelectedHardSemanticItemGroups() {
        const topicGroups = (Array.isArray(this.topics) ? this.topics : []).map((group) =>
          (Array.isArray(group) ? group : []).filter((item) => hasHardSemanticHandling(item))
        );
        const limitGroups = (
          this.advanced ? this.limitDropdowns : Object.values(this.limitData || {})
        ).map((group) =>
          (Array.isArray(group) ? group : []).filter((item) => hasHardSemanticHandling(item))
        );
        return [...topicGroups, ...limitGroups].filter((group) => group.length > 0);
      },
      buildSemanticHardFilterValidationQueryFromGroups(groupedItems) {
        const hasLogicalOperators = (searchStrings) =>
          ["AND", "OR", "NOT"].some((op) => searchStrings.includes(op));
        const buildSubstring = (items, connector = " OR ") =>
          (Array.isArray(items) ? items : [])
            .filter(
              (item) =>
                item?.searchStrings &&
                item?.scope &&
                item.searchStrings[item.scope] &&
                item.searchStrings[item.scope].length > 0 &&
                hasHardSemanticHandling(item)
            )
            .map((item, _, filteredItems) => {
              const { scope, searchStrings } = item;
              const combined = searchStrings[scope].join(connector);
              return hasLogicalOperators(searchStrings[scope][0]) && filteredItems.length > 1
                ? `(${combined})`
                : combined;
            })
            .join(connector);

        const substrings = [];
        (Array.isArray(groupedItems) ? groupedItems : []).forEach((group) => {
          const hardItems = (Array.isArray(group) ? group : []).filter((item) =>
            hasHardSemanticHandling(item)
          );
          if (hardItems.length === 0) return;
          const hasOperators = hardItems.some(
            (item) =>
              item?.searchStrings &&
              item?.scope &&
              item.searchStrings[item.scope] &&
              item.searchStrings[item.scope][0] &&
              hasLogicalOperators(item.searchStrings[item.scope][0])
          );

          let substring = " AND ";
          if (hasOperators || hardItems.length > 1) substring += "(";
          substring += buildSubstring(hardItems, " OR ");
          if (hasOperators || hardItems.length > 1) substring += ")";

          if (substring !== " AND ()" && substring !== " AND ") {
            substrings.push(substring);
          }
        });

        return substrings.join("").replace(/^\s*AND\s+/, "").trim();
      },
      buildSemanticMetadataByDoi() {
        if (this.semanticMetadataByDoiCache instanceof Map) {
          return this.semanticMetadataByDoiCache;
        }
        const metadataByDoi = new Map();
        const tags = this.getSemanticSourceTags();
        tags.forEach((tag) => {
          const sourceResults = Array.isArray(tag?.semanticSourceResults) ? tag.semanticSourceResults : [];
          sourceResults.forEach((sourceResult) => {
            const source = String(sourceResult?.source || "").trim();
            const candidates = Array.isArray(sourceResult?.candidates) ? sourceResult.candidates : [];
            candidates.forEach((candidate) => {
              const doi = normalizeDoiValue(candidate?.doi || "");
              if (!doi) return;
              const key = doi.toLowerCase();
              if (!metadataByDoi.has(key)) {
                metadataByDoi.set(key, {
                  doi,
                  bySource: {},
                });
              }
              const entry = metadataByDoi.get(key);
              if (!entry.bySource[source]) {
                entry.bySource[source] = [];
              }
              entry.bySource[source].push({
                rank: Number(candidate?.rank) || null,
                title: String(candidate?.title || "").trim(),
                abstract: String(candidate?.abstract || "").trim(),
                score: Number.isFinite(Number(candidate?.score)) ? Number(candidate?.score) : null,
                metadata:
                  candidate?.metadata && typeof candidate.metadata === "object"
                    ? { ...candidate.metadata }
                    : {},
              });
            });
          });
        });
        this.semanticMetadataByDoiCache = metadataByDoi;
        return metadataByDoi;
      },
      getCanonicalSemanticFilterState() {
        const selectedItems = this.getAllSelectedSearchItems();
        const unsupportedItems = selectedItems
          .filter((item) => {
            const filterProfiles = Array.isArray(item?.semanticConfig?.hardFilters?.filterProfile)
              ? item.semanticConfig.hardFilters.filterProfile
              : [];
            const postValidationRules = this.getItemSemanticPostValidationRules(item);
            return filterProfiles.length > 0 && postValidationRules.length === 0;
          })
          .map((item) => ({
            label:
              getLocalizedTranslation(item, this.language, "dk") ||
              String(item?.name || item?.id || "").trim(),
            filterProfiles: Array.isArray(item?.semanticConfig?.hardFilters?.filterProfile)
              ? item.semanticConfig.hardFilters.filterProfile
              : [],
          }));
        return {
          selectedItems,
          hardFilterQuery: this.buildSemanticHardFilterValidationQueryFromGroups(
            this.getSelectedHardSemanticItemGroups()
          ),
          publicationDateYears: this.getSemanticPublicationDateYears(),
          semanticMetadataByDoi: this.buildSemanticMetadataByDoi(),
          activeDoiOnlyRuleState: buildActiveSemanticDoiOnlyRuleState(selectedItems),
          unsupportedItems,
        };
      },
      flattenSemanticHintValues(value) {
        if (Array.isArray(value)) {
          return value
            .flatMap((entry) => this.flattenSemanticHintValues(entry))
            .filter((entry) => entry !== "");
        }
        if (value && typeof value === "object") {
          return Object.values(value)
            .flatMap((entry) => this.flattenSemanticHintValues(entry))
            .filter((entry) => entry !== "");
        }
        const normalized = String(value || "").trim();
        return normalized ? [normalized] : [];
      },
      getAllSelectedSearchItems() {
        const allItems = [
          ...this.topics.flatMap((group) => (Array.isArray(group) ? group : [])),
          ...this.limitDropdowns.flatMap((group) => (Array.isArray(group) ? group : [])),
          ...Object.values(this.limitData || {}).flatMap((group) => (Array.isArray(group) ? group : [])),
        ];
        const seen = new Set();
        return allItems.filter((item) => {
          const key = String(item?.id || item?.name || item?.preTranslation || "").trim().toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      },
      getCachedOpenAlexValueForCandidate(candidate) {
        const normalizedDoi = normalizeDoiValue(candidate?.doi || "");
        const openAlexId = String(candidate?.openAlexId || "").trim();
        const cacheKey = normalizedDoi
          ? `doi:${normalizedDoi.toLowerCase()}`
          : openAlexId
          ? `oa:${openAlexId}`
          : "";
        if (!cacheKey) return null;
        const cached = this.readTimedCacheEntry(this.openAlexDoiCache, cacheKey);
        return cached.hit ? cached.value : null;
      },
      getSemanticSourceTags() {
        const collectTags = (items) =>
          (Array.isArray(items) ? items : []).filter(
            (item) =>
              !!item?.useSemanticScholar ||
              (Array.isArray(item?.semanticScholarPmids) && item.semanticScholarPmids.length > 0) ||
              (Array.isArray(item?.semanticScholarDois) && item.semanticScholarDois.length > 0) ||
              (Array.isArray(item?.semanticScholarCandidates) &&
                item.semanticScholarCandidates.length > 0)
          );
        return [
          ...this.topics.flatMap((group) => collectTags(group)),
          ...this.limitDropdowns.flatMap((group) => collectTags(group)),
          ...Object.values(this.limitData || {}).flatMap((group) => collectTags(group)),
          ...collectTags(this.globalSemanticSearchState ? [this.globalSemanticSearchState] : []),
        ];
      },
      getSemanticLlmRerankConfig() {
        const rawConfig =
          runtimeConfig?.semanticLlmRerankConfig && typeof runtimeConfig.semanticLlmRerankConfig === "object"
            ? runtimeConfig.semanticLlmRerankConfig
            : {};
        const enabledValue = rawConfig.enabled;
        // Default ON: the LLM final rerank is always applied unless the backend
        // config explicitly disables it (false / 0 / "false").
        const enabled = !(
          enabledValue === false ||
          enabledValue === 0 ||
          String(enabledValue || "")
            .trim()
            .toLowerCase() === "false"
        );
        const topN = Number(rawConfig.topN);
        const maxOutputTokens = Number(rawConfig.maxOutputTokens);
        const taskRerank =
          runtimeConfig?.openAiTaskModels?.finalRerank &&
          typeof runtimeConfig.openAiTaskModels.finalRerank === "object"
            ? runtimeConfig.openAiTaskModels.finalRerank
            : {};
        const reasoningEffort = String(
          rawConfig.reasoningEffort || taskRerank.reasoningEffort || ""
        )
          .trim()
          .toLowerCase();
        return {
          enabled,
          model: String(rawConfig.model || taskRerank.model || "").trim(),
          reasoningEffort: SEMANTIC_LLM_RERANK_ALLOWED_EFFORTS.includes(reasoningEffort)
            ? reasoningEffort
            : "none",
          topN:
            Number.isFinite(topN) && topN > 1
              ? Math.min(25, Math.floor(topN))
              : DEFAULT_SEMANTIC_LLM_RERANK_CONFIG.topN,
          maxOutputTokens:
            Number.isFinite(maxOutputTokens) && maxOutputTokens > 0
              ? Math.floor(maxOutputTokens)
              : DEFAULT_SEMANTIC_LLM_RERANK_CONFIG.maxOutputTokens,
        };
      },
      shouldUseSemanticLlmFinalRerank(data) {
        const config = this.getSemanticLlmRerankConfig();
        return (
          config.enabled === true &&
          this.page === 0 &&
          this.hasSelectedSemanticSources() &&
          this.sort?.method !== "date_desc" &&
          this.sort?.method !== "date_asc" &&
          Array.isArray(data) &&
          data.length > 1
        );
      },
      getSemanticLlmRerankQueryText() {
        const tagQueries = this.getSemanticSourceTags()
          .map((item) =>
            String(
              item?.semanticScholarQuery || item?.pubmedGeneratedQuery || item?.preTranslation || item?.name || ""
            ).trim()
          )
          .filter(Boolean);
        return tagQueries.join(" | ") || String(this.finalValidatedQuery || "").trim();
      },
      getSemanticLlmRerankProfileContext() {
        const profileId = this.resolvedSelectedRerankProfileId;
        if (!profileId) return null;
        const profile =
          this.availableRerankProfiles.find((entry) => entry?.id === profileId) || null;
        return {
          id: profileId,
          label: profile?.labelKey ? this.getString(profile.labelKey) : profileId,
          description: profile?.descriptionKey ? this.getString(profile.descriptionKey) : "",
        };
      },
      getSemanticLlmCandidateId(entry) {
        const pmid = String(entry?.pmid || entry?.uid || "").trim();
        if (/^[0-9]+$/.test(pmid)) {
          return `pmid:${pmid}`;
        }
        const doi = normalizeDoiValue(entry?.doi || "");
        if (doi) {
          return `doi:${doi.toLowerCase()}`;
        }
        return String(entry?.id || entry?.uid || "").trim();
      },
      flattenSemanticLlmAbstractText(value) {
        if (!value) return "";
        if (typeof value === "string") return value.trim();
        if (typeof value !== "object") return "";
        return Object.values(value)
          .map((entry) => String(entry || "").trim())
          .filter(Boolean)
          .join(" ");
      },
      async fetchSemanticLlmPubMedAbstractMap(pmids) {
        const normalizedPmids = Array.from(
          new Set(
            (Array.isArray(pmids) ? pmids : [])
              .map((pmid) => String(pmid || "").trim())
              .filter((pmid) => /^[0-9]+$/.test(pmid))
          )
        );
        if (normalizedPmids.length === 0) {
          return {};
        }
        const response = await axios.get(this.getBackendApiUrl("NlmFetch.php"), {
          params: {
            db: "pubmed",
            retmode: "xml",
            rettype: "abstract",
            id: normalizedPmids.join(","),
          },
          timeout: 30000,
        });
        const xmlDoc = parsePubMedXml(response?.data || "");
        if (!xmlDoc || hasXmlParserError(xmlDoc)) {
          return {};
        }
        return Object.fromEntries(
          getAbstractEntriesFromPubMedXml(xmlDoc, { includeEmptySections: true }).map(
            ([pmid, abstractValue]) => [String(pmid || "").trim(), this.flattenSemanticLlmAbstractText(abstractValue)]
          )
        );
      },
      buildSemanticEnrichmentLookup() {
        const lookup = new Map();
        this.getSemanticSourceTags().forEach((item) => {
          const candidates = Array.isArray(item?.semanticScholarCandidates)
            ? item.semanticScholarCandidates
            : [];
          candidates.forEach((candidate) => {
            const enriched = candidate?.enriched;
            if (!enriched || typeof enriched !== "object") return;
            const pmid = String(candidate?.pmid || "").trim();
            if (/^[0-9]+$/.test(pmid)) {
              lookup.set(`pmid:${pmid}`, enriched);
            }
            const doi = normalizeDoiValue(candidate?.doi || "");
            if (doi) {
              lookup.set(`doi:${doi.toLowerCase()}`, enriched);
            }
          });
        });
        return lookup;
      },
      extractLlmRerankQualitySignals(enriched) {
        if (!enriched || typeof enriched !== "object") return {};
        const signals = {};
        if (enriched.fwci !== null && enriched.fwci !== undefined) signals.fwci = enriched.fwci;
        if (enriched.rcr !== null && enriched.rcr !== undefined) signals.rcr = enriched.rcr;
        if (enriched.nihPercentile !== null && enriched.nihPercentile !== undefined) {
          signals.nihPercentile = enriched.nihPercentile;
        }
        if (enriched.citedByCount !== null && enriched.citedByCount !== undefined) {
          signals.citationCount = enriched.citedByCount;
        }
        if (
          enriched.influentialCitationCount !== null &&
          enriched.influentialCitationCount !== undefined
        ) {
          signals.influentialCitationCount = enriched.influentialCitationCount;
        }
        if (enriched.citedByClin !== null && enriched.citedByClin !== undefined) {
          signals.citedByClin = enriched.citedByClin;
        }
        if (enriched.publicationYear !== null && enriched.publicationYear !== undefined) {
          signals.year = enriched.publicationYear;
        }
        if (enriched.isRetracted === true || enriched.isRetracted === false) {
          signals.isRetracted = enriched.isRetracted;
        }
        if (enriched.isClinical === true || enriched.isClinical === false) {
          signals.isClinical = enriched.isClinical;
        }
        if (enriched.isOpenAccess === true || enriched.isOpenAccess === false) {
          signals.isOpenAccess = enriched.isOpenAccess;
        }
        if (Array.isArray(enriched.pubTypes) && enriched.pubTypes.length > 0) {
          signals.pubTypes = enriched.pubTypes;
        }
        return signals;
      },
      async maybeApplySemanticLlmFinalRerank(data, prefetchedAbstractMap = null) {
        const safeData = Array.isArray(data) ? data : [];
        if (!this.shouldUseSemanticLlmFinalRerank(safeData)) {
          return safeData;
        }
        const config = this.getSemanticLlmRerankConfig();
        const topN = Math.min(config.topN, safeData.length);
        if (topN < 2) {
          return safeData;
        }

        try {
          const topEntries = safeData.slice(0, topN);
          const topEntryInputs = topEntries.map((entry) => ({
            entry,
            candidateId: this.getSemanticLlmCandidateId(entry),
            title: String(entry?.title || "").trim(),
          }));
          const pmidsToHydrate = topEntryInputs
            .filter(
              ({ entry, candidateId, title }) =>
                candidateId &&
                title &&
                !this.flattenSemanticLlmAbstractText(entry?.abstract)
            )
            .map(({ entry }) => String(entry?.pmid || entry?.uid || "").trim())
            .filter((pmid) => /^[0-9]+$/.test(pmid));
          // Reuse abstracts prefetched in parallel with page hydration when available;
          // only fetch the PMIDs that were not already covered by the prefetch.
          const prefetched =
            prefetchedAbstractMap && typeof prefetchedAbstractMap === "object"
              ? prefetchedAbstractMap
              : null;
          const missingPmids = prefetched
            ? pmidsToHydrate.filter((pmid) => !(pmid in prefetched))
            : pmidsToHydrate;
          const fetchedMap =
            missingPmids.length > 0
              ? await this.fetchSemanticLlmPubMedAbstractMap(missingPmids)
              : {};
          const abstractMap = prefetched ? { ...prefetched, ...fetchedMap } : fetchedMap;
          const enrichmentLookup = this.buildSemanticEnrichmentLookup();
          const requestCandidates = [];
          const deferredTopEntries = [];

          topEntryInputs.forEach(({ entry, candidateId, title }) => {
            if (!candidateId || !title) {
              deferredTopEntries.push(entry);
              return;
            }
            const pmid = String(entry?.pmid || entry?.uid || "").trim();
            const abstractText = this.flattenSemanticLlmAbstractText(
              entry?.abstract || abstractMap?.[pmid] || ""
            );
            const entryDoi = this.getResultDebugDoi(entry);
            const enrichedEntry =
              (pmid && enrichmentLookup.get(`pmid:${pmid}`)) ||
              (entryDoi && enrichmentLookup.get(`doi:${entryDoi.toLowerCase()}`)) ||
              null;
            const qualitySignals = this.extractLlmRerankQualitySignals(enrichedEntry);
            const venue = String(
              entry?.fulljournalname || entry?.source || enrichedEntry?.authorityJournal?.displayName || ""
            ).trim();
            if (venue && !qualitySignals.venue) qualitySignals.venue = venue;

            const entryTopics = Array.isArray(entry?.topics)
              ? entry.topics
              : (Array.isArray(entry?.value?.topics) ? entry.value.topics : []);
            const topics = buildLlmTopicsPayload(entryTopics, LLM_TOPIC_CAP);

            requestCandidates.push({
              // Use a short positional id for the model round-trip. Small models
              // (e.g. gpt-5.4-nano) often drop the "pmid:"/"doi:" prefix or mangle
              // long DOI ids, which breaks the strict permutation contract and
              // triggers a 422. candidateMap below maps this short id back to the
              // real entry, and candidateId is still used to gate usable entries.
              id: String(requestCandidates.length + 1),
              title,
              abstract: abstractText,
              publicationDate: String(entry?.publicationDate || entry?.pubDate || entry?.pubdate || "").trim(),
              source: String(entry?.originSource || entry?.source || "").trim(),
              sourceLabel: String(entry?.fulljournalname || entry?.source || "").trim(),
              ...qualitySignals,
              ...(topics.length > 0 ? { topics } : {}),
              entry,
            });
          });

          if (requestCandidates.length < 2) {
            return safeData;
          }

          this.activateSemanticLoadingProcessStep("finalRerank", "semanticSearchProgressFinalRerank");
          const rerankRequest = {
            query: this.getSemanticLlmRerankQueryText(),
            hardFilterQuery: this.getSemanticHardFilterValidationQuery(),
            resultFocus: this.getSemanticLlmRerankProfileContext(),
            model: config.model,
            reasoningEffort: config.reasoningEffort,
            maxOutputTokens: config.maxOutputTokens,
            candidates: requestCandidates.map(({ entry, ...candidate }) => candidate),
          };
          this.setSearchProcessStepDetail("finalRerank", {
            endpoint: "SemanticFinalRerank.php",
            request: {
              query: rerankRequest.query,
              hardFilterQuery: rerankRequest.hardFilterQuery,
              resultFocus: rerankRequest.resultFocus,
              model: rerankRequest.model,
              reasoningEffort: rerankRequest.reasoningEffort,
              maxOutputTokens: rerankRequest.maxOutputTokens,
              candidateCount: rerankRequest.candidates.length,
            },
          });
          const response = await axios.post(
            this.getBackendApiUrl("SemanticFinalRerank.php"),
            rerankRequest,
            { headers: { "Content-Type": "application/json" }, timeout: 60000 }
          );
          const orderedIds = Array.isArray(response?.data?.orderedIds)
            ? response.data.orderedIds.map((id) => String(id || "").trim()).filter(Boolean)
            : [];
          const expectedIds = requestCandidates.map((candidate) => candidate.id);
          if (
            orderedIds.length !== expectedIds.length ||
            orderedIds.some((id) => !expectedIds.includes(id)) ||
            new Set(orderedIds).size !== orderedIds.length
          ) {
            console.warn("[SemanticLlmRerank] Ignoring invalid permutation from backend.", {
              orderedIds,
              expectedIds,
            });
            this.recordSemanticSourceStatus({
              source: "finalRerank",
              status: "warning",
              stepId: "finalRerank",
              messageKey: "semanticSearchProgressFinalRerankFallback",
            });
            return safeData;
          }

          const candidateMap = new Map(requestCandidates.map((candidate) => [candidate.id, candidate.entry]));
          const reorderedTopEntries = orderedIds.map((id) => candidateMap.get(id)).filter(Boolean);
          const rerankedData = [...reorderedTopEntries, ...deferredTopEntries, ...safeData.slice(topN)];
          console.info("[SemanticLlmRerank] Applied final rerank to hydrated first-page results.", {
            topN,
            model: config.model,
            orderedIds,
          });
          this.mergeSearchProcessStepDetail("finalRerank", {
            response: {
              orderedIdCount: orderedIds.length,
              orderedIds: orderedIds.slice(0, 25),
              truncated: orderedIds.length > 25,
            },
          });
          this.setSemanticLoadingProcessStepStatus(
            "finalRerank",
            "completed",
            "semanticSearchProgressFinalRerank"
          );
          return rerankedData;
        } catch (error) {
          const backendError = error?.response?.data ?? null;
          let backendErrorJson = "";
          try {
            backendErrorJson = JSON.stringify(backendError);
          } catch (stringifyError) {
            backendErrorJson = String(backendError);
          }
          console.warn("[SemanticLlmRerank] Falling back to deterministic order.", error, {
            status: error?.response?.status ?? null,
            backendError,
            backendErrorJson,
          });
          this.recordSemanticSourceStatus({
            source: "finalRerank",
            status: "warning",
            stepId: "finalRerank",
            messageKey: "semanticSearchProgressFinalRerankFallback",
          });
          return safeData;
        }
      },
      getSemanticHardFilterValidationQuery() {
        return this.buildSemanticHardFilterValidationQueryFromGroups(
          this.getSelectedHardSemanticItemGroups()
        );
      },
      getResultDebugDoi(entry) {
        const directDoi = normalizeDoiValue(entry?.doi || "");
        if (directDoi) return directDoi;
        if (!Array.isArray(entry?.articleids)) return "";
        const doiItem = entry.articleids.find((item) => item?.idtype === "doi");
        return normalizeDoiValue(doiItem?.value || "");
      },
      logHybridRenderSummary(label, resultRefs, data) {
        if (!this.isSearchFlowDebugEnabled) return;
        const safeRefs = Array.isArray(resultRefs) ? resultRefs : [];
        const safeData = Array.isArray(data) ? data : [];
        const getEntryPmid = (entry) => {
          const pmid = String(entry?.pmid ?? entry?.uid ?? "").trim();
          return /^[0-9]+$/.test(pmid) ? pmid : "";
        };
        const getEntryKey = (entry) => {
          const pmid = getEntryPmid(entry);
          if (pmid) return `pmid:${pmid}`;
          const doi = this.getResultDebugDoi(entry);
          return doi ? `doi:${doi.toLowerCase()}` : String(entry?.uid || "").trim().toLowerCase();
        };
        const renderedKeys = new Set(
          safeData.map((entry) => getEntryKey(entry)).filter((value) => value !== "")
        );
        const missingRefKeys = safeRefs
          .map((entry) => String(entry?.key || "").trim().toLowerCase())
          .filter((key) => key !== "" && !renderedKeys.has(key));

        console.info(`[SearchFlow] ${label}`, {
          refSummary: {
            total: safeRefs.length,
            pmidRefs: safeRefs.filter((entry) => entry?.type === "pmid").length,
            doiRefs: safeRefs.filter((entry) => entry?.type === "doi").length,
            firstRefs: safeRefs.slice(0, 15).map((entry) => entry.key),
          },
          renderedSummary: {
            total: safeData.length,
            pmidRendered: safeData.filter((entry) => getEntryPmid(entry) !== "").length,
            doiOnlyRendered: safeData.filter(
              (entry) => getEntryPmid(entry) === "" && this.getResultDebugDoi(entry) !== ""
            ).length,
            firstResults: safeData.slice(0, 10).map((entry) => ({
              id: entry?.uid || entry?.id || "",
              pmid: getEntryPmid(entry),
              doi: this.getResultDebugDoi(entry),
              originSource: entry?.originSource || "",
              canOpenInPubMed: entry?.canOpenInPubMed === true,
              title: String(entry?.title || "").slice(0, 120),
            })),
          },
          missingRefKeys,
        });
      },
      getSemanticDoiOnlyFilterState() {
        const canonicalFilterState = this.getCanonicalSemanticFilterState();
        return {
          semanticMetadataByDoi: canonicalFilterState.semanticMetadataByDoi,
          activeDoiOnlyRuleState: canonicalFilterState.activeDoiOnlyRuleState,
          unsupportedItems: canonicalFilterState.unsupportedItems,
        };
      },
      getSemanticPublicationDateYears() {
        return Array.isArray(this.semanticWordedIntentContext?.hardFilters?.publicationDateYears)
          ? this.semanticWordedIntentContext.hardFilters.publicationDateYears
          : [];
      },
      candidateMatchesSemanticPublicationDateFilters(candidate, hydrated = null) {
        const publicationDateYears = this.getSemanticPublicationDateYears();
        if (publicationDateYears.length === 0) return true;

        const candidateMetadata =
          candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
        const hydratedMetadata =
          hydrated?.metadata && typeof hydrated.metadata === "object" ? hydrated.metadata : {};

        return matchesSemanticPublicationDateYears(
          {
            publicationDate:
              String(hydrated?.publicationDate || "").trim() ||
              String(candidate?.publicationDate || "").trim(),
            publicationYear:
              String(
                hydratedMetadata.publicationYear ||
                  candidateMetadata.publicationYear ||
                  hydrated?.year ||
                  candidate?.year ||
                  ""
              ).trim(),
          },
          publicationDateYears
        );
      },
      async buildAllowedSemanticRefKeys(orderedCandidates, nlm, options = {}) {
        const candidatesToValidate = (Array.isArray(orderedCandidates) ? orderedCandidates : []).filter(
          (candidate) =>
            String(candidate?.pmid || "").trim() ||
            normalizeDoiValue(candidate?.doi || "") ||
            String(candidate?.openAlexId || "").trim()
        );
        const trustedPmidSet = new Set(
          (Array.isArray(options?.trustedPmids) ? options.trustedPmids : [])
            .map((pmid) => String(pmid || "").trim())
            .filter((pmid) => /^[0-9]+$/.test(pmid))
        );
        // Two-tier validation controls. In the background pass we never touch the shared
        // validation flag or the user-facing process-step UI (the blocking step already
        // finished); we only validate the deferred candidates and return their keys.
        const isBackgroundValidation = options?.background === true;
        const useSharedValidationFlag = !isBackgroundValidation;
        const maxOpenAlexValidations = Number.isFinite(options?.maxOpenAlexValidations)
          ? Math.max(0, Math.floor(options.maxOpenAlexValidations))
          : Infinity;
        let deferredCount = 0;
        const canonicalFilterState = this.getCanonicalSemanticFilterState();
        const publicationDateYears = canonicalFilterState.publicationDateYears;
        const { semanticMetadataByDoi, activeDoiOnlyRuleState, unsupportedItems } =
          canonicalFilterState;
        if (unsupportedItems.length > 0) {
          console.info(
            "[SemanticFilterFlow] Some hard filters do not have exact semantic metadata mappings and are not enforced outside the PubMed hard-filter query.",
            {
              filters: unsupportedItems,
            }
          );
        }
        this.captureSearchFlowDebugSourceSnapshots();
        if (candidatesToValidate.length === 0) {
          return { allowedKeys: new Set(), deferredCount: 0 };
        }
        const hasDoiOnlyRules =
          Array.isArray(activeDoiOnlyRuleState.activeRules) && activeDoiOnlyRuleState.activeRules.length > 0;
        if (!hasDoiOnlyRules && publicationDateYears.length === 0) {
          const allowedEntries = candidatesToValidate
            .map((candidate) => {
              const pmid = String(candidate?.pmid || "").trim();
              const doi = normalizeDoiValue(candidate?.doi || "");
              const openAlexId = String(candidate?.openAlexId || "").trim();
              const key = pmid
                ? `pmid:${pmid}`
                : doi
                ? `doi:${doi.toLowerCase()}`
                : openAlexId
                ? `oa:${openAlexId}`
                : "";
              return key
                ? {
                    key,
                    candidate,
                    hydrated: null,
                    allowed: true,
                    reason: "",
                    ruleExplanation: null,
                  }
                : null;
            })
            .filter(Boolean);
          this.recordSearchFlowDebugFilterDecisions(allowedEntries);
          return {
            allowedKeys: new Set(allowedEntries.map((entry) => entry.key)),
            deferredCount: 0,
          };
        }

        if (!isBackgroundValidation) {
          this.ensureSemanticLoadingProcessStepPresence(
            "finalizeValidateDoiFetch",
            "semanticSearchProgressFinalizeValidateDoiFetch"
          );
        }
        if (useSharedValidationFlag) {
          this.semanticDoiValidationActive = true;
        }
        // Trusted PMIDs are accepted via the PMID shortcut below regardless of their
        // OpenAlex metadata, so fetching their DOI work would be discarded effort.
        // Exclude them from the OpenAlex batch and re-expand the fetched works to
        // keep index alignment with candidatesToValidate.
        const candidateNeedsOpenAlexValidation = (candidate) => {
          const pmid = String(candidate?.pmid || "").trim();
          return !(pmid && trustedPmidSet.has(pmid));
        };
        const fetchableCandidates = candidatesToValidate.filter(candidateNeedsOpenAlexValidation);
        // Blocking tier: fetch+validate only the top `maxOpenAlexValidations` non-trusted
        // candidates (already relevance-ordered). The rest are deferred and marked
        // "not allowed" below; a background pass validates them afterwards and appends
        // any keepers, so nothing relevant is ever dropped.
        const candidatesToFetch =
          maxOpenAlexValidations < fetchableCandidates.length
            ? fetchableCandidates.slice(0, maxOpenAlexValidations)
            : fetchableCandidates;
        const deferredCandidateSet =
          candidatesToFetch.length < fetchableCandidates.length
            ? new Set(fetchableCandidates.slice(candidatesToFetch.length))
            : null;
        deferredCount = deferredCandidateSet ? deferredCandidateSet.size : 0;
        let hydratedWorks = [];
        try {
          if (!isBackgroundValidation) {
            this.setSearchProcessStepDetail("finalizeValidateDoiFetch", {
              endpoint: "OpenAlexWorkLookup.php",
              candidateCount: candidatesToValidate.length,
              trustedPmidSkippedCount: candidatesToValidate.length - fetchableCandidates.length,
              doiCandidateCount: candidatesToValidate.filter((candidate) => normalizeDoiValue(candidate?.doi || "")).length,
              openAlexIdCandidateCount: candidatesToValidate.filter((candidate) =>
                String(candidate?.openAlexId || "").trim()
              ).length,
              blockingValidationCount: candidatesToFetch.length,
              deferredValidationCount: deferredCount,
              domain: this.currentDomain || "",
            });
            this.startAnimatedLoadingStatus(
              "finalizeValidateDoiFetch",
              "semanticSearchProgressFinalizeValidateDoiFetch"
            );
          }
          const fetchedWorks = await this.fetchOpenAlexWorksByCandidates(candidatesToFetch, nlm, {
            validationMode: true,
          });
          const fetchedWorkByCandidate = new Map();
          candidatesToFetch.forEach((candidate, fetchedIndex) => {
            fetchedWorkByCandidate.set(candidate, fetchedWorks[fetchedIndex] ?? null);
          });
          hydratedWorks = candidatesToValidate.map((candidate) =>
            fetchedWorkByCandidate.has(candidate) ? fetchedWorkByCandidate.get(candidate) : null
          );
        } finally {
          if (useSharedValidationFlag) {
            this.semanticDoiValidationActive = false;
          }
        }
        if (!isBackgroundValidation) {
          this.mergeSearchProcessStepDetail("finalizeValidateDoiFetch", {
            hydratedCount: hydratedWorks.filter(Boolean).length,
            semanticScholarFallbackCount: candidatesToValidate.filter(
              (candidate, index) => !hydratedWorks[index] && this.buildSemanticScholarFallbackRecordByRef(candidate)
            ).length,
          });
        }
        const hydratedResults = candidatesToValidate.map((candidate, index) => {
          if (deferredCandidateSet && deferredCandidateSet.has(candidate)) {
            const deferredPmid = String(candidate?.pmid || "").trim();
            const deferredDoi = normalizeDoiValue(candidate?.doi || "");
            const deferredOpenAlexId = String(candidate?.openAlexId || "").trim();
            const deferredKey = deferredPmid
              ? `pmid:${deferredPmid}`
              : deferredDoi
              ? `doi:${deferredDoi.toLowerCase()}`
              : deferredOpenAlexId
              ? `oa:${deferredOpenAlexId}`
              : "";
            return {
              key: deferredKey,
              candidate,
              hydrated: null,
              allowed: false,
              ruleExplanation: null,
              reason: "deferred-validation",
            };
          }
          const hydrated =
            hydratedWorks[index] || this.buildSemanticScholarFallbackRecordByRef(candidate) || null;
          const pmid = String(candidate?.pmid || "").trim();
          const normalizedDoi = normalizeDoiValue(candidate?.doi || hydrated?.doi || "");
          const openAlexId = String(candidate?.openAlexId || hydrated?.openAlexId || "").trim();
          const key = pmid
            ? `pmid:${pmid}`
            : normalizedDoi
            ? `doi:${normalizedDoi.toLowerCase()}`
            : openAlexId
            ? `oa:${openAlexId}`
            : "";
          if (!key) {
            return { key: "", candidate, hydrated, allowed: false, reason: "missing-ref-key" };
          }
          if (pmid && trustedPmidSet.has(pmid)) {
            return {
              key,
              candidate,
              hydrated,
              allowed: true,
              ruleExplanation: null,
              reason: "",
            };
          }
          const candidateMetadata =
            candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
          const hydratedCandidate = {
            ...candidate,
            doi: normalizedDoi,
            metadata: {
              ...candidateMetadata,
              publicationYear:
                candidateMetadata.publicationYear ||
                String(hydrated?.pubDate || "").slice(0, 4) ||
                String(candidate?.year || "").trim(),
              sourceType: candidateMetadata.sourceType || hydrated?.sourceType || "",
              sourceDisplayName: candidateMetadata.sourceDisplayName || hydrated?.sourceDisplayName || "",
              sourceAbbreviatedTitle:
                candidateMetadata.sourceAbbreviatedTitle || hydrated?.sourceAbbreviatedTitle || "",
              publicationDate:
                candidateMetadata.publicationDate ||
                String(hydrated?.publicationDate || hydrated?.pubDate || "").trim(),
              volume: candidateMetadata.volume || String(hydrated?.volume || "").trim(),
              issue: candidateMetadata.issue || String(hydrated?.issue || "").trim(),
              pages: candidateMetadata.pages || String(hydrated?.pages || "").trim(),
            },
          };
          const ruleExplanation =
            hasDoiOnlyRules && this.isSearchFlowDebugEnabled
              ? explainCandidateActiveSemanticDoiOnlyRules({
                  candidate: hydratedCandidate,
                  metadataByDoi: semanticMetadataByDoi,
                  ruleState: activeDoiOnlyRuleState,
                  openAlexCachedValue: hydrated,
                })
              : null;
          const matchesDoiOnlyRules = !hasDoiOnlyRules
            ? true
            : ruleExplanation
            ? ruleExplanation.matches
            : candidateMatchesActiveSemanticDoiOnlyRules({
                candidate: hydratedCandidate,
                metadataByDoi: semanticMetadataByDoi,
                ruleState: activeDoiOnlyRuleState,
                openAlexCachedValue: hydrated,
              });
          const matchesPublicationDate = this.candidateMatchesSemanticPublicationDateFilters(
            hydratedCandidate,
            hydrated
          );
          const allowed = matchesDoiOnlyRules && matchesPublicationDate;
          return {
            key,
            candidate: hydratedCandidate,
            hydrated,
            allowed,
            ruleExplanation,
            reason: allowed
              ? ""
              : !matchesPublicationDate
              ? "publication-date-mismatch"
              : "rule-mismatch",
          };
        });
        this.recordSearchFlowDebugFilterDecisions(hydratedResults);

        const allowedKeys = new Set();
        const excludedCandidates = [];
        hydratedResults.forEach((entry) => {
          if (!entry?.key) return;
          if (entry.allowed) {
            allowedKeys.add(entry.key);
            return;
          }
          excludedCandidates.push({
            pmid: String(entry?.candidate?.pmid || "").trim(),
            doi: normalizeDoiValue(entry?.candidate?.doi || ""),
            source: String(entry?.candidate?.source || "").trim(),
            title: String(entry?.candidate?.title || "").trim(),
            reason: String(entry?.reason || "").trim(),
            ruleExplanation: entry?.ruleExplanation || null,
          });
        });
        if (excludedCandidates.length > 0 && this.isSearchFlowDebugEnabled) {
          console.info("[SemanticFilterFlow] Excluded semantic candidates after metadata validation.", {
            activeRules: activeDoiOnlyRuleState.activeRules,
            ruleGroups: activeDoiOnlyRuleState.ruleGroups,
            excludedCount: excludedCandidates.length,
            examples: excludedCandidates.slice(0, 10),
          });
          this.logSearchFlowDebugTable(
            "06 Filter and validation rejections",
            excludedCandidates.slice(0, 50).map((entry) => ({
              ...summarizeSearchFlowRecord(entry),
              ruleFailures: Array.isArray(entry?.ruleExplanation?.ruleResults)
                ? entry.ruleExplanation.ruleResults
                    .filter((result) => result?.passed === false)
                    .flatMap((result) => result.failures || [])
                    .join(", ")
                : "",
            }))
          );
        }
        if (!isBackgroundValidation) {
          this.mergeSearchProcessStepDetail("finalizeValidateDoiFetch", {
            activeRules: activeDoiOnlyRuleState.activeRules,
            ruleGroups: activeDoiOnlyRuleState.ruleGroups,
            publicationDateYears: this.getSemanticPublicationDateYears(),
            validatedCount: hydratedResults.length,
            allowedCount: allowedKeys.size,
            excludedCount: excludedCandidates.length,
            excludedExamples: excludedCandidates.slice(0, 10),
          });
        }
        return { allowedKeys, deferredCount };
      },
      getOrderedRerankedCandidates() {
        const candidates = [];
        const seen = new Set();
        const allowOpenAlexSemantic = this.isOpenAlexSemanticRetrievalEnabled();
        this.getSemanticSourceTags().forEach((item) => {
          const ranked = Array.isArray(item?.semanticScholarCandidates)
            ? item.semanticScholarCandidates
            : [
                ...(Array.isArray(item?.semanticScholarPmids)
                  ? item.semanticScholarPmids.map((pmid) => ({ pmid }))
                  : []),
                ...(Array.isArray(item?.semanticScholarDois)
                  ? item.semanticScholarDois.map((doi) => ({ doi }))
                  : []),
              ];
          ranked.forEach((candidate) => {
            const pmid = String(candidate?.pmid || "").trim();
            const doi = normalizeDoiValue(candidate?.doi || "");
            const openAlexId = String(candidate?.openAlexId || "").trim();
            const source = String(candidate?.source || "").trim();
            if (!allowOpenAlexSemantic && source === "openAlex") {
              return;
            }
            const key = pmid
              ? `pmid:${pmid}`
              : doi
              ? `doi:${doi.toLowerCase()}`
              : openAlexId
              ? `oa:${openAlexId}`
              : "";
            if (!key || seen.has(key)) return;
            seen.add(key);
            candidates.push({
              pmid,
              doi,
              source,
              title: String(candidate?.title || "").trim(),
              rank: Number(candidate?.rank) || null,
              score: Number.isFinite(Number(candidate?.score)) ? Number(candidate?.score) : null,
              metadata:
                candidate?.metadata && typeof candidate.metadata === "object"
                  ? { ...candidate.metadata }
                  : {},
              openAlexId,
            });
          });
        });
        return candidates;
      },
      getOpenAlexWorkCacheKey(candidate) {
        const normalizedDoi = normalizeDoiValue(candidate?.doi || "");
        const openAlexId = String(candidate?.openAlexId || "").trim();
        return normalizedDoi
          ? `doi:${normalizedDoi.toLowerCase()}`
          : openAlexId
          ? `oa:${openAlexId}`
          : "";
      },
      getOpenAlexWorkCacheAliasKeys(candidate = {}, mapped = null, fallbackDoi = "") {
        const keys = [];
        const addDoiKey = (value) => {
          const normalizedDoi = normalizeDoiValue(value || "");
          if (normalizedDoi) {
            keys.push(`doi:${normalizedDoi.toLowerCase()}`);
          }
        };
        const addOpenAlexKey = (value) => {
          const openAlexId = String(value || "").trim();
          if (openAlexId) {
            keys.push(`oa:${openAlexId}`);
          }
        };

        addDoiKey(candidate?.doi);
        addDoiKey(mapped?.doi);
        addDoiKey(fallbackDoi);
        addOpenAlexKey(candidate?.openAlexId);
        addOpenAlexKey(mapped?.openAlexId);

        return Array.from(new Set(keys));
      },
      writeOpenAlexWorkCacheAliases(
        candidate = {},
        mapped = null,
        value = null,
        ttlMs = OPENALEX_CACHE_TTL_MS
      ) {
        this.getOpenAlexWorkCacheAliasKeys(candidate, mapped, mapped?.doi || "").forEach((cacheKey) => {
          this.writeTimedCacheEntry(this.openAlexDoiCache, cacheKey, value, ttlMs);
        });
      },
      getSortedSemanticScholarMetadataEntriesByDoi(doi) {
        const doiKey = normalizeDoiValue(doi || "").toLowerCase();
        if (!doiKey) return [];
        const semanticByDoi = this.buildSemanticMetadataByDoi();
        const semanticScholarEntries = Array.isArray(
          semanticByDoi.get(doiKey)?.bySource?.semanticScholar
        )
          ? semanticByDoi.get(doiKey).bySource.semanticScholar
          : [];
        return [...semanticScholarEntries].sort((left, right) => {
          const leftRank = Number(left?.rank);
          const rightRank = Number(right?.rank);
          const safeLeftRank =
            Number.isFinite(leftRank) && leftRank > 0 ? leftRank : Number.MAX_SAFE_INTEGER;
          const safeRightRank =
            Number.isFinite(rightRank) && rightRank > 0 ? rightRank : Number.MAX_SAFE_INTEGER;
          return safeLeftRank - safeRightRank;
        });
      },
      getPreferredSemanticScholarDisplayMetadataByDoi(doi) {
        const sortedEntries = this.getSortedSemanticScholarMetadataEntriesByDoi(doi);
        if (sortedEntries.length === 0) {
          return null;
        }
        const title = String(
          sortedEntries.find((entry) => String(entry?.title || "").trim())?.title || ""
        ).trim();
        const abstract = String(
          sortedEntries.find((entry) => String(entry?.abstract || "").trim())?.abstract || ""
        ).trim();
        if (!title && !abstract) {
          return null;
        }
        return {
          source: "semanticScholar",
          title,
          abstract,
        };
      },
      buildSemanticScholarFallbackRecordByRef(ref = {}) {
        const normalizedDoi = normalizeDoiValue(ref?.doi || ref?.semanticCandidate?.doi || "");
        if (!normalizedDoi) return null;
        const doiKey = normalizedDoi.toLowerCase();
        const semanticByDoi = this.buildSemanticMetadataByDoi();
        const semanticEntry = semanticByDoi.get(doiKey);
        const sortedEntries = this.getSortedSemanticScholarMetadataEntriesByDoi(normalizedDoi);
        if (sortedEntries.length === 0) return null;
        const title = String(
          sortedEntries.find((entry) => String(entry?.title || "").trim())?.title ||
            ref?.semanticCandidate?.title ||
            ""
        ).trim();
        if (!title) return null;

        const abstract = String(
          sortedEntries.find((entry) => String(entry?.abstract || "").trim())?.abstract || ""
        ).trim();
        const hasMetadataObject = (entry) =>
          entry?.metadata && typeof entry.metadata === "object";
        const metadataEntry = sortedEntries.find(hasMetadataObject) || {};
        const metadata =
          metadataEntry?.metadata && typeof metadataEntry.metadata === "object"
            ? metadataEntry.metadata
            : {};
        const publicationDate = String(metadata.publicationDate || "").trim();
        const publicationYear = String(
          metadata.publicationYear || metadata.year || publicationDate.slice(0, 4) || ""
        ).trim();
        const pubDate = publicationDate || publicationYear;
        const venue = String(metadata.venue || metadata.sourceDisplayName || "").trim();
        const publicationTypes = Array.isArray(metadata.publicationTypes)
          ? metadata.publicationTypes.map((entry) => String(entry || "").trim()).filter(Boolean)
          : Array.isArray(metadata.pubTypes)
          ? metadata.pubTypes.map((entry) => String(entry || "").trim()).filter(Boolean)
          : [];
        const uid = `doi:${doiKey}`;
        return {
          id: uid,
          uid,
          pmid: null,
          doi: normalizedDoi,
          title,
          authors: [],
          source: venue || "Semantic Scholar",
          fulljournalname: venue || "Semantic Scholar",
          publicationDate,
          year: publicationYear,
          metadata: {
            ...metadata,
            publicationDate,
            publicationYear,
            publicationTypes,
            venue,
          },
          pubDate,
          pubdate: pubDate,
          volume: "",
          issue: "",
          pages: "",
          abstract,
          hasAbstract: abstract !== "",
          pubType: publicationTypes[0] || "",
          pubtype: publicationTypes,
          docType: publicationTypes[0] || "",
          doctype: publicationTypes[0] || "",
          booktitle: "",
          vernaculartitle: "",
          history: [],
          articleids: [{ idtype: "doi", value: normalizedDoi }],
          attributes: abstract !== "" ? { "Has Abstract": "Has Abstract" } : {},
          originSource: "semanticScholar",
          isPubMedNative: false,
          canOpenInPubMed: false,
          canFetchPubMedAbstract: false,
          mergedDoiMetadata: {
            primarySource: "semanticScholar",
            primaryBibliography: {
              source: venue || "Semantic Scholar",
              fulljournalname: venue || "Semantic Scholar",
              pubDate,
              volume: "",
              issue: "",
              pages: "",
            },
            secondarySignals: semanticEntry?.bySource || {},
            candidateSignal: ref?.semanticCandidate || null,
            fallbackReason: "openAlexHydrationFailed",
          },
          openAlexId: "",
          pubTypeClassification:
            ref?.pubTypeClassification || metadata.pubTypeClassification || null,
        };
      },
      getDisplayAbstractCandidateScore(candidate = null) {
        const text = String(candidate?.abstract || "").trim();
        if (!text) return -1;
        return text.length;
      },
      chooseBestDisplayAbstract(candidates = []) {
        const validCandidates = (Array.isArray(candidates) ? candidates : [])
          .map((candidate) => ({
            ...candidate,
            abstract: String(candidate?.abstract || "").trim(),
          }))
          .filter((candidate) => candidate.abstract);
        if (validCandidates.length === 0) return null;
        return validCandidates.sort(
          (left, right) =>
            this.getDisplayAbstractCandidateScore(right) -
            this.getDisplayAbstractCandidateScore(left)
        )[0];
      },
      applyPreferredDisplayMetadataToHydratedRecord(mapped, normalizedDoi = "") {
        if (!mapped || typeof mapped !== "object") {
          return mapped;
        }
        const semanticScholarMetadata = this.getPreferredSemanticScholarDisplayMetadataByDoi(
          mapped?.doi || normalizedDoi
        );
        const openAlexAbstract = String(mapped?.abstract || "").trim();
        const selectedAbstract = this.chooseBestDisplayAbstract([
          semanticScholarMetadata,
          { source: "openAlex", abstract: openAlexAbstract },
        ]);
        if (!semanticScholarMetadata && !selectedAbstract) {
          return mapped;
        }
        const resolvedAbstract = String(selectedAbstract?.abstract || "").trim();
        const nextAttributes =
          resolvedAbstract !== ""
            ? {
                ...(mapped?.attributes && typeof mapped.attributes === "object" ? mapped.attributes : {}),
                "Has Abstract": "Has Abstract",
              }
            : mapped?.attributes && typeof mapped.attributes === "object"
            ? { ...mapped.attributes }
            : {};
        return {
          ...mapped,
          title: String(semanticScholarMetadata?.title || mapped.title || "").trim(),
          abstract: resolvedAbstract || String(mapped?.abstract || "").trim(),
          hasAbstract: resolvedAbstract !== "" || Boolean(mapped?.hasAbstract),
          attributes: nextAttributes,
          mergedDoiMetadata:
            mapped?.mergedDoiMetadata && typeof mapped.mergedDoiMetadata === "object"
              ? {
                  ...mapped.mergedDoiMetadata,
                  displayMetadataSource: semanticScholarMetadata?.source || "",
                  displayAbstractSource: selectedAbstract?.source || "",
                }
              : mapped?.mergedDoiMetadata || null,
        };
      },
      async finalizeOpenAlexMappedWork(mapped, candidate, normalizedDoi = "") {
        if (mapped) {
          const doiKey = normalizeDoiValue(mapped?.doi || normalizedDoi).toLowerCase();
          const semanticByDoi = this.buildSemanticMetadataByDoi();
          const semanticSignals = doiKey && semanticByDoi.has(doiKey) ? semanticByDoi.get(doiKey) : null;
          mapped.mergedDoiMetadata = {
            primarySource: "openAlex",
            primaryBibliography: {
              source: mapped.source || "",
              fulljournalname: mapped.fulljournalname || "",
              pubDate: mapped.pubDate || "",
              volume: mapped.volume || "",
              issue: mapped.issue || "",
              pages: mapped.pages || "",
            },
            secondarySignals: semanticSignals ? semanticSignals.bySource : {},
            candidateSignal: candidate?.semanticCandidate || null,
          };
          mapped = this.applyPreferredDisplayMetadataToHydratedRecord(mapped, normalizedDoi);
          mapped.topics = appendCandidateTopicSignals(mapped.topics, candidate);
        }

        return mapped;
      },
      buildPubMedPreferredRecord(pubMedRecord, fallbackRecord, normalizedDoi = "") {
        const safePubMedRecord =
          pubMedRecord && typeof pubMedRecord === "object" ? { ...pubMedRecord } : null;
        if (!safePubMedRecord) {
          return fallbackRecord;
        }
        const resolvedDoi = normalizeDoiValue(
          safePubMedRecord?.doi || normalizedDoi || fallbackRecord?.doi || ""
        );
        const pmid = String(safePubMedRecord?.uid || safePubMedRecord?.pmid || "").trim();
        const articleIds = Array.isArray(safePubMedRecord.articleids) ? [...safePubMedRecord.articleids] : [];
        if (
          pmid &&
          !articleIds.some(
            (item) => String(item?.idtype || "").trim().toLowerCase() === "pubmed" && String(item?.value || "").trim() === pmid
          )
        ) {
          articleIds.unshift({ idtype: "pubmed", value: pmid });
        }
        if (
          resolvedDoi &&
          !articleIds.some(
            (item) =>
              String(item?.idtype || "").trim().toLowerCase() === "doi" &&
              normalizeDoiValue(item?.value || "") === resolvedDoi
          )
        ) {
          articleIds.push({ idtype: "doi", value: resolvedDoi });
        }
        return {
          ...safePubMedRecord,
          doi: resolvedDoi || safePubMedRecord?.doi || "",
          articleids: articleIds,
          openAlexId: String(fallbackRecord?.openAlexId || "").trim(),
          source: String(fallbackRecord?.source || safePubMedRecord?.source || "").trim(),
          sourceType: String(fallbackRecord?.sourceType || "").trim(),
          sourceDisplayName: String(fallbackRecord?.sourceDisplayName || "").trim(),
          sourceAbbreviatedTitle: String(fallbackRecord?.sourceAbbreviatedTitle || "").trim(),
          pubDate: String(fallbackRecord?.pubDate || safePubMedRecord?.pubDate || "").trim(),
          mergedDoiMetadata:
            fallbackRecord?.mergedDoiMetadata && typeof fallbackRecord.mergedDoiMetadata === "object"
              ? { ...fallbackRecord.mergedDoiMetadata }
              : safePubMedRecord?.mergedDoiMetadata || null,
          pubTypeClassification:
            fallbackRecord?.pubTypeClassification || safePubMedRecord?.pubTypeClassification || null,
          publisher: String(fallbackRecord?.publisher || safePubMedRecord?.publisher || "").trim(),
          language: String(fallbackRecord?.language || safePubMedRecord?.language || "").trim(),
          topics: mergeResultTopicEntries(fallbackRecord?.topics, safePubMedRecord?.topics),
        };
      },
      async fetchOpenAlexWorksByCandidates(candidates, nlm, options = {}) {
        if (!this.isOpenAlexDoiResolverEnabled()) {
          return (Array.isArray(candidates) ? candidates : []).map(() => null);
        }
        const safeCandidates = Array.isArray(candidates) ? candidates : [];
        if (safeCandidates.length === 0) return [];

        const results = new Array(safeCandidates.length).fill(null);
        const pendingEntries = [];
        const batchEntriesByDoi = new Map();
        const batchEntriesByOpenAlexId = new Map();
        const singleFallbackEntries = [];
        // Validation mode is passed explicitly per call so the blocking and background
        // validation tiers can run concurrently without racing a shared instance flag.
        // Falls back to the legacy shared flag for callers that do not pass it.
        const isValidationLookup =
          typeof options.validationMode === "boolean"
            ? options.validationMode
            : this.semanticDoiValidationActive === true;
        const processStepId = isValidationLookup ? "finalizeValidateDoiFetch" : "finalizeHydrate";
        const lookupRequestSummaries = [];

        safeCandidates.forEach((candidate, index) => {
          const cacheKey = this.getOpenAlexWorkCacheKey(candidate);
          if (!cacheKey) return;

          const cachedWork = this.readTimedCacheEntry(this.openAlexDoiCache, cacheKey);
          if (cachedWork.hit) {
            results[index] = cachedWork.value;
            return;
          }

          if (Object.prototype.hasOwnProperty.call(this.openAlexDoiPromiseCache, cacheKey)) {
            pendingEntries.push({
              index,
              promise: this.openAlexDoiPromiseCache[cacheKey],
            });
            return;
          }

          const normalizedDoi = normalizeDoiValue(candidate?.doi || "");
          if (normalizedDoi) {
            const doiKey = normalizedDoi.toLowerCase();
            if (!batchEntriesByDoi.has(doiKey)) {
              batchEntriesByDoi.set(doiKey, {
                normalizedDoi,
                indices: [],
              });
            }
            batchEntriesByDoi.get(doiKey).indices.push(index);
            return;
          }

          const openAlexId = String(candidate?.openAlexId || "").trim();
          if (openAlexId) {
            if (!batchEntriesByOpenAlexId.has(openAlexId)) {
              batchEntriesByOpenAlexId.set(openAlexId, {
                openAlexId,
                indices: [],
              });
            }
            batchEntriesByOpenAlexId.get(openAlexId).indices.push(index);
            return;
          }

          singleFallbackEntries.push(index);
        });

        if (pendingEntries.length > 0) {
          const pendingResults = await Promise.all(pendingEntries.map((entry) => entry.promise));
          pendingEntries.forEach((entry, pendingIndex) => {
            results[entry.index] = pendingResults[pendingIndex];
          });
        }

        const batchEntries = Array.from(batchEntriesByDoi.values());
        const batchChunks = [];
        for (let index = 0; index < batchEntries.length; index += 100) {
          batchChunks.push(batchEntries.slice(index, index + 100));
        }

        await this.mapWithConcurrencyLimit(
          batchChunks,
          this.getOpenAlexBatchLookupConcurrency(),
          async (chunk) => {
            const dois = chunk.map((entry) => entry.normalizedDoi);
            lookupRequestSummaries.push({
              endpoint: "OpenAlexWorkLookup.php",
              parameter: "dois",
              count: dois.length,
              values: dois.slice(0, 25),
              truncated: dois.length > 25,
              domain: this.currentDomain || "",
            });
            this.mergeSearchProcessStepDetail(processStepId, {
              lookupRequests: lookupRequestSummaries,
            });
            try {
              const response = await axios.post(
                this.getBackendApiUrl("OpenAlexWorkLookup.php"),
                {
                  dois,
                  domain: this.currentDomain || "",
                  light: isValidationLookup ? 1 : 0,
                },
                isValidationLookup
                  ? {
                      headers: { "Content-Type": "application/json" },
                      timeout: OPENALEX_VALIDATION_LOOKUP_TIMEOUT_MS,
                    }
                  : { headers: { "Content-Type": "application/json" } }
              );
              const works = Array.isArray(response?.data?.works) ? response.data.works : [];
              const worksByDoi = new Map(
                works.flatMap((entry) => {
                  const unwrapped = unwrapOpenAlexWorkLookupEntry(entry);
                  if (!unwrapped?.work) return [];
                  const keys = new Set();
                  [
                    unwrapped.doi,
                    unwrapped.work?.doi,
                    unwrapped.work?.ids?.doi,
                  ].forEach((value) => {
                    const normalizedEntryDoi = normalizeDoiValue(value);
                    if (normalizedEntryDoi) {
                      keys.add(normalizedEntryDoi.toLowerCase());
                    }
                  });
                  return [...keys].map((key) => [key, unwrapped]);
                })
              );
              const mappedByDoi = new Map();
              const pmidsToHydrate = [];

              for (const entry of chunk) {
                const workEntry =
                  worksByDoi.get(entry.normalizedDoi.toLowerCase()) ||
                  (chunk.length === 1 && worksByDoi.size === 1
                    ? worksByDoi.values().next().value
                    : null);
                const sampleCandidate = safeCandidates[entry.indices[0]];
                if (!workEntry?.work) {
                  continue;
                }
                let mapped = mapOpenAlexWorkToResultDto(workEntry.work, {
                  doi: entry.normalizedDoi,
                  openAlexId: workEntry.openAlexId || sampleCandidate?.openAlexId || "",
                  pubTypeClassification: sampleCandidate?.pubTypeClassification || null,
                });
                mapped = await this.finalizeOpenAlexMappedWork(mapped, sampleCandidate, entry.normalizedDoi);
                mappedByDoi.set(entry.normalizedDoi.toLowerCase(), mapped);
                const mappedPmid = String(mapped?.pmid || "").trim();
                if (/^[0-9]+$/.test(mappedPmid)) {
                  pmidsToHydrate.push(mappedPmid);
                }
              }
              // During DOI-rule validation the active filters read OpenAlex/candidate
              // source fields only (buildPubMedPreferredRecord preserves them from the
              // mapped OpenAlex record), so the PubMed summary round-trip is pure overhead
              // here. Skipping it removes one serialized NLM request per batch on the
              // single-threaded dev server; buildPubMedPreferredRecord(null, mapped) then
              // returns the OpenAlex record unchanged. Full PubMed hydration still happens
              // for the displayed page in the separate hydrate phase.
              const pubMedByPmid = isValidationLookup
                ? new Map()
                : new Map(
                    (
                      await this.fetchSummaryRecordsByIds([...new Set(pmidsToHydrate)], nlm)
                    ).map((summaryEntry) => [
                      String(summaryEntry?.uid || summaryEntry?.pmid || "").trim(),
                      summaryEntry,
                    ])
                  );

              for (const entry of chunk) {
                const sampleCandidate = safeCandidates[entry.indices[0]];
                const mapped = mappedByDoi.get(entry.normalizedDoi.toLowerCase()) || null;
                let preferred = mapped;
                const mappedPmid = String(mapped?.pmid || "").trim();
                if (/^[0-9]+$/.test(mappedPmid)) {
                  preferred = this.buildPubMedPreferredRecord(
                    pubMedByPmid.get(mappedPmid) || null,
                    mapped,
                    entry.normalizedDoi
                  );
                }
                if (preferred) {
                  // Don't warm the shared frontend cache with the lightweight validation
                  // record (it omits abstract/authors); hydration must fetch the full
                  // record for display + LLM rerank, so it would be poisoned otherwise.
                  if (!isValidationLookup) {
                    this.writeOpenAlexWorkCacheAliases(sampleCandidate, preferred, preferred);
                  }
                } else {
                  this.writeOpenAlexWorkCacheAliases(sampleCandidate, null, null, 60 * 1000);
                }
                entry.indices.forEach((candidateIndex) => {
                  results[candidateIndex] = preferred;
                });
              }
            } catch (error) {
              // During DOI-rule validation, never fan out into a per-candidate fallback
              // storm (up to ~100 sequential single lookups) — that is what turned this
              // step into minutes. Degrade gracefully instead: leave results null so each
              // candidate keeps its own metadata / Semantic Scholar fallback.
              if (!isValidationLookup) {
                for (const entry of chunk) {
                  for (const candidateIndex of entry.indices) {
                    results[candidateIndex] = await this.fetchOpenAlexWorkByCandidate(
                      safeCandidates[candidateIndex],
                      nlm
                    );
                  }
                }
              }
            }
          }
        );

        const openAlexBatchEntries = Array.from(batchEntriesByOpenAlexId.values());
        const openAlexBatchChunks = [];
        for (let index = 0; index < openAlexBatchEntries.length; index += 100) {
          openAlexBatchChunks.push(openAlexBatchEntries.slice(index, index + 100));
        }

        await this.mapWithConcurrencyLimit(
          openAlexBatchChunks,
          this.getOpenAlexBatchLookupConcurrency(),
          async (chunk) => {
            const openAlexIds = chunk.map((entry) => entry.openAlexId);
            lookupRequestSummaries.push({
              endpoint: "OpenAlexWorkLookup.php",
              parameter: "openAlexIds",
              count: openAlexIds.length,
              values: openAlexIds.slice(0, 25),
              truncated: openAlexIds.length > 25,
              domain: this.currentDomain || "",
            });
            this.mergeSearchProcessStepDetail(processStepId, {
              lookupRequests: lookupRequestSummaries,
            });
            try {
              const response = await axios.post(
                this.getBackendApiUrl("OpenAlexWorkLookup.php"),
                {
                  openAlexIds,
                  domain: this.currentDomain || "",
                  light: isValidationLookup ? 1 : 0,
                },
                isValidationLookup
                  ? {
                      headers: { "Content-Type": "application/json" },
                      timeout: OPENALEX_VALIDATION_LOOKUP_TIMEOUT_MS,
                    }
                  : { headers: { "Content-Type": "application/json" } }
              );
              const works = Array.isArray(response?.data?.works) ? response.data.works : [];
              const worksByOpenAlexId = new Map(
                works
                  .map((entry) => {
                    const unwrapped = unwrapOpenAlexWorkLookupEntry(entry);
                    const entryOpenAlexId = String(unwrapped?.openAlexId || unwrapped?.work?.id || "")
                      .replace(/^https?:\/\/openalex\.org\//i, "")
                      .trim();
                    return unwrapped && entryOpenAlexId ? [entryOpenAlexId, unwrapped] : null;
                  })
                  .filter(Boolean)
              );
              const mappedByOpenAlexId = new Map();
              const pmidsToHydrate = [];

              for (const entry of chunk) {
                const normalizedEntryId = entry.openAlexId
                  .replace(/^https?:\/\/openalex\.org\//i, "")
                  .trim();
                const workEntry = worksByOpenAlexId.get(normalizedEntryId);
                const sampleCandidate = safeCandidates[entry.indices[0]];
                if (!workEntry?.work) {
                  continue;
                }
                let mapped = mapOpenAlexWorkToResultDto(workEntry.work, {
                  doi: normalizeDoiValue(workEntry.doi || sampleCandidate?.doi || ""),
                  openAlexId: entry.openAlexId,
                  pubTypeClassification: sampleCandidate?.pubTypeClassification || null,
                });
                mapped = await this.finalizeOpenAlexMappedWork(
                  mapped,
                  sampleCandidate,
                  normalizeDoiValue(workEntry.doi || "")
                );
                mappedByOpenAlexId.set(entry.openAlexId, mapped);
                const mappedPmid = String(mapped?.pmid || "").trim();
                if (/^[0-9]+$/.test(mappedPmid)) {
                  pmidsToHydrate.push(mappedPmid);
                }
              }
              // During DOI-rule validation the active filters read OpenAlex/candidate
              // source fields only (buildPubMedPreferredRecord preserves them from the
              // mapped OpenAlex record), so the PubMed summary round-trip is pure overhead
              // here. Skipping it removes one serialized NLM request per batch on the
              // single-threaded dev server; buildPubMedPreferredRecord(null, mapped) then
              // returns the OpenAlex record unchanged. Full PubMed hydration still happens
              // for the displayed page in the separate hydrate phase.
              const pubMedByPmid = isValidationLookup
                ? new Map()
                : new Map(
                    (
                      await this.fetchSummaryRecordsByIds([...new Set(pmidsToHydrate)], nlm)
                    ).map((summaryEntry) => [
                      String(summaryEntry?.uid || summaryEntry?.pmid || "").trim(),
                      summaryEntry,
                    ])
                  );

              for (const entry of chunk) {
                const sampleCandidate = safeCandidates[entry.indices[0]];
                const mapped = mappedByOpenAlexId.get(entry.openAlexId) || null;
                let preferred = mapped;
                const mappedPmid = String(mapped?.pmid || "").trim();
                if (/^[0-9]+$/.test(mappedPmid)) {
                  preferred = this.buildPubMedPreferredRecord(
                    pubMedByPmid.get(mappedPmid) || null,
                    mapped,
                    normalizeDoiValue(mapped?.doi || "")
                  );
                }
                if (preferred) {
                  // Don't warm the shared frontend cache with the lightweight validation
                  // record (it omits abstract/authors); hydration must fetch the full
                  // record for display + LLM rerank, so it would be poisoned otherwise.
                  if (!isValidationLookup) {
                    this.writeOpenAlexWorkCacheAliases(sampleCandidate, preferred, preferred);
                  }
                } else {
                  this.writeOpenAlexWorkCacheAliases(sampleCandidate, null, null, 60 * 1000);
                }
                entry.indices.forEach((candidateIndex) => {
                  results[candidateIndex] = preferred;
                });
              }
            } catch (error) {
              // During DOI-rule validation, never fan out into a per-candidate fallback
              // storm (up to ~100 sequential single lookups) — that is what turned this
              // step into minutes. Degrade gracefully instead: leave results null so each
              // candidate keeps its own metadata / Semantic Scholar fallback.
              if (!isValidationLookup) {
                for (const entry of chunk) {
                  for (const candidateIndex of entry.indices) {
                    results[candidateIndex] = await this.fetchOpenAlexWorkByCandidate(
                      safeCandidates[candidateIndex],
                      nlm
                    );
                  }
                }
              }
            }
          }
        );

        if (singleFallbackEntries.length > 0) {
          this.mergeSearchProcessStepDetail(processStepId, {
            lookupRequests: lookupRequestSummaries,
            singleFallbackCount: singleFallbackEntries.length,
          });
          const singleResults = await this.mapWithConcurrencyLimit(
            singleFallbackEntries,
            OPENALEX_LOOKUP_CONCURRENCY,
            (candidateIndex) => this.fetchOpenAlexWorkByCandidate(safeCandidates[candidateIndex], nlm)
          );
          singleFallbackEntries.forEach((candidateIndex, singleIndex) => {
            results[candidateIndex] = singleResults[singleIndex];
          });
        }

        this.recordOpenAlexHydrationOutcome(safeCandidates, results, isValidationLookup);
        return results;
      },
      recordOpenAlexHydrationOutcome(candidates = [], hydratedWorks = [], isValidationLookup = undefined) {
        const missingCount = (Array.isArray(candidates) ? candidates : []).reduce(
          (sum, candidate, index) => {
            const needsOpenAlex =
              normalizeDoiValue(candidate?.doi || "") || String(candidate?.openAlexId || "").trim();
            const hasSemanticScholarFallback = needsOpenAlex
              ? this.buildSemanticScholarFallbackRecordByRef(candidate) !== null
              : false;
            return needsOpenAlex && !hydratedWorks[index] && !hasSemanticScholarFallback
              ? sum + 1
              : sum;
          },
          0
        );
        const targetStepId = (
          typeof isValidationLookup === "boolean"
            ? isValidationLookup
            : this.semanticDoiValidationActive
        )
          ? "finalizeValidateDoiFetch"
          : "finalizeHydrate";
        this.mergeSearchProcessStepDetail(targetStepId, {
          openAlexMissingCount: missingCount,
        });
        if (missingCount <= 0) return;
        const messageKey = "semanticSearchProgressDoiHydrationWarning";
        this.mergeSearchProcessStepDetail(targetStepId, {
          openAlexMissingCount: missingCount,
          validationWarning: {
            status: "warning",
            missingCount,
            messageKey,
            message: this.getString(messageKey),
          },
        });
      },
      async fetchOpenAlexWorkByCandidate(candidate, nlm) {
        if (!this.isOpenAlexDoiResolverEnabled()) {
          return null;
        }
        const normalizedDoi = normalizeDoiValue(candidate?.doi || "");
        const openAlexId = String(candidate?.openAlexId || "").trim();
        const cacheKey = this.getOpenAlexWorkCacheKey(candidate);
        if (!cacheKey) return null;
        if (!this.isOpenAlexSemanticRetrievalEnabled()) {
          console.info("[OpenAlexRule] OpenAlex semantic retrieval is disabled; DOI metadata resolver remains active.", {
            cacheKey,
            candidateSource: String(candidate?.source || ""),
          });
        }
        const cachedWork = this.readTimedCacheEntry(this.openAlexDoiCache, cacheKey);
        if (cachedWork.hit) {
          return cachedWork.value;
        }
        if (Object.prototype.hasOwnProperty.call(this.openAlexDoiPromiseCache, cacheKey)) {
          return this.openAlexDoiPromiseCache[cacheKey];
        }
        const requestStartedAt = Date.now();
        const requestPromise = axios
          .post(
            this.getBackendApiUrl("OpenAlexWorkLookup.php"),
            {
              doi: normalizedDoi || undefined,
              openAlexId: openAlexId || undefined,
              domain: this.currentDomain || "",
            },
            { headers: { "Content-Type": "application/json" } }
          )
          .then(async (response) => {
            const unwrapped = unwrapOpenAlexWorkLookupEntry(response?.data);
            const work = unwrapped?.work;
            let mapped = work
              ? mapOpenAlexWorkToResultDto(work, {
                  doi: normalizedDoi,
                  openAlexId,
                  pubTypeClassification: candidate?.pubTypeClassification || null,
                })
              : null;
            mapped = await this.finalizeOpenAlexMappedWork(mapped, candidate, normalizedDoi);
            const mappedPmid = String(mapped?.pmid || "").trim();
            if (/^[0-9]+$/.test(mappedPmid)) {
              const [pubMedRecord] = await this.fetchSummaryRecordsByIds([mappedPmid], nlm);
              mapped = this.buildPubMedPreferredRecord(pubMedRecord || null, mapped, normalizedDoi);
            }

            this.writeOpenAlexWorkCacheAliases(candidate, mapped, mapped);
            delete this.openAlexDoiPromiseCache[cacheKey];
            return mapped;
          })
          .catch((error) => {
            console.warn("[OpenAlexWorkLookup] Failed to fetch DOI-only metadata.", {
              doi: normalizedDoi,
              openAlexId,
              error: String(error?.message || error),
              latencyMs: Date.now() - requestStartedAt,
            });
            this.writeOpenAlexWorkCacheAliases(candidate, null, null, 60 * 1000);
            delete this.openAlexDoiPromiseCache[cacheKey];
            return null;
          });

        this.openAlexDoiPromiseCache[cacheKey] = requestPromise;
        return requestPromise;
      },
      async fetchOpenAlexSourceMetaById(sourceId) {
        const normalizedSourceId = String(sourceId || "").trim();
        if (!normalizedSourceId) return null;

        const cached = this.readTimedCacheEntry(this.openAlexSourceCache, normalizedSourceId);
        if (cached.hit) {
          return cached.value;
        }
        if (
          Object.prototype.hasOwnProperty.call(this.openAlexSourcePromiseCache, normalizedSourceId)
        ) {
          return this.openAlexSourcePromiseCache[normalizedSourceId];
        }

        const requestPromise = axios
          .post(
            this.getBackendApiUrl("OpenAlexSourceLookup.php"),
            {
              sourceId: normalizedSourceId,
              domain: this.currentDomain || "",
            },
            { headers: { "Content-Type": "application/json" } }
          )
          .then((response) => {
            const source = response?.data?.source;
            const mapped = source
              ? {
                  id: String(source.id || "").trim(),
                  displayName: String(source.display_name || "").trim(),
                  abbreviatedTitle: String(source.abbreviated_title || "").trim(),
                }
              : null;
            this.writeTimedCacheEntry(this.openAlexSourceCache, normalizedSourceId, mapped);
            delete this.openAlexSourcePromiseCache[normalizedSourceId];
            return mapped;
          })
          .catch((error) => {
            console.warn("[OpenAlexSourceLookup] Failed to fetch source metadata.", {
              sourceId: normalizedSourceId,
              error: String(error?.message || error),
            });
            this.writeTimedCacheEntry(this.openAlexSourceCache, normalizedSourceId, null, 60 * 1000);
            delete this.openAlexSourcePromiseCache[normalizedSourceId];
            return null;
          });

        this.openAlexSourcePromiseCache[normalizedSourceId] = requestPromise;
        return requestPromise;
      },
      // Starts any deferred background semantic validation, if pending.
      // Called defensively before local re-sort so background work can finish first.
      flushPendingSemanticBackgroundValidation() {
        const pending = this.pendingSemanticBackgroundValidation;
        if (!pending) return;
        this.pendingSemanticBackgroundValidation = null;
        const { nlm } = this.appSettings;
        this.startSemanticBackgroundValidation(
          pending.orderedCandidates,
          nlm,
          pending.trustedPmids,
          pending.orderedSearch
        );
      },
      // Builds the ordered hydration refs from a set of allowed/validated ref keys.
      // Shared by the blocking first-page pass and the background full-validation pass.
      buildSemanticResultRefsFromAllowedKeys(orderedCandidates, allowedSemanticRefKeys, orderedSearch) {
        const matchedPmidSet = new Set(orderedSearch.orderedIds);
        const refs = [];
        const seenRefKeys = new Set();
        const usedPmids = new Set();

        (Array.isArray(orderedCandidates) ? orderedCandidates : []).forEach((candidate) => {
          const pmid = String(candidate?.pmid || "").trim();
          const doi = normalizeDoiValue(candidate?.doi || "");
          const openAlexId = String(candidate?.openAlexId || "").trim();
          if (pmid) {
            if (!matchedPmidSet.has(pmid)) return;
            const key = `pmid:${pmid}`;
            if (!allowedSemanticRefKeys.has(key)) return;
            if (seenRefKeys.has(key)) return;
            seenRefKeys.add(key);
            usedPmids.add(pmid);
            refs.push({
              type: "pmid",
              pmid,
              key,
              source: String(candidate?.source || "").trim(),
              pubTypeClassification: candidate?.pubTypeClassification || null,
            });
            return;
          }
          if (!pmid && doi) {
            const key = `doi:${doi.toLowerCase()}`;
            if (!allowedSemanticRefKeys.has(key)) return;
            if (seenRefKeys.has(key)) return;
            seenRefKeys.add(key);
            refs.push({
              type: "doi",
              doi,
              source: String(candidate?.source || "").trim(),
              semanticCandidate: {
                source: String(candidate?.source || "").trim(),
                rank: Number(candidate?.rank) || null,
                score: Number.isFinite(Number(candidate?.score)) ? Number(candidate?.score) : null,
                title: String(candidate?.title || "").trim(),
                metadata:
                  candidate?.metadata && typeof candidate.metadata === "object"
                    ? { ...candidate.metadata }
                    : {},
              },
              openAlexId,
              key,
              pubTypeClassification: candidate?.pubTypeClassification || null,
            });
            return;
          }
          if (!pmid && !doi && openAlexId) {
            const key = `oa:${openAlexId}`;
            if (!allowedSemanticRefKeys.has(key)) return;
            if (seenRefKeys.has(key)) return;
            seenRefKeys.add(key);
            refs.push({
              type: "openalex",
              openAlexId,
              source: String(candidate?.source || "").trim(),
              semanticCandidate: {
                source: String(candidate?.source || "").trim(),
                rank: Number(candidate?.rank) || null,
                score: Number.isFinite(Number(candidate?.score)) ? Number(candidate?.score) : null,
                title: String(candidate?.title || "").trim(),
                metadata:
                  candidate?.metadata && typeof candidate.metadata === "object"
                    ? { ...candidate.metadata }
                    : {},
              },
              key,
              pubTypeClassification: candidate?.pubTypeClassification || null,
            });
          }
        });

        orderedSearch.orderedIds.forEach((pmid) => {
          if (usedPmids.has(pmid)) return;
          const key = `pmid:${pmid}`;
          if (!allowedSemanticRefKeys.has(key)) return;
          if (seenRefKeys.has(key)) return;
          seenRefKeys.add(key);
          refs.push({ type: "pmid", pmid, key });
        });

        this.recordSearchFlowDebugHydrationRefs(refs, orderedCandidates);

        return {
          refs,
          pmids: orderedSearch.orderedIds,
          count: refs.length,
        };
      },
      // Background tier of the two-tier DOI validation: validates the candidates that
      // the blocking pass deferred (everything beyond the blocking limit) and, once
      // finished, replaces the result refs + total count so deeper pages and the total
      // reflect the complete validated set. Guarded by the search generation so a newer
      // search cancels this stale background work. The already-validated blocking
      // candidates are cache hits, so the background only pays for the remainder.
      startSemanticBackgroundValidation(orderedCandidates, nlm, trustedPmids, orderedSearch) {
        const backgroundGeneration = this.searchGeneration;
        this.semanticBackgroundValidationPromise = (async () => {
          try {
            const { allowedKeys } = await this.buildAllowedSemanticRefKeys(orderedCandidates, nlm, {
              trustedPmids,
              background: true,
            });
            if (this.searchGeneration !== backgroundGeneration) return;
            const fullResult = this.buildSemanticResultRefsFromAllowedKeys(
              orderedCandidates,
              allowedKeys,
              orderedSearch
            );
            if (this.searchGeneration !== backgroundGeneration) return;
            this.matchedRerankedResultRefs = fullResult.refs;
            this.matchedRerankedPmids = fullResult.pmids;
            this.count = fullResult.count;
            this.mergeSearchProcessStepDetail("finalizeValidateDoiFetch", {
              backgroundValidationCompleted: true,
              backgroundValidatedCount: fullResult.count,
            });
          } catch (error) {
            console.warn(
              "[SemanticValidation] Background validation pass failed; keeping blocking-tier results.",
              { error: String(error?.message || error) }
            );
          }
        })();
      },
      buildPubMedSearchRequest({
        term = "",
        retmax = this.pageSize,
        retstart = 0,
        sort = "",
      } = {}) {
        const normalizedRetmax = Math.max(0, Math.floor(Number(retmax) || 0));
        const normalizedRetstart = Math.max(0, Math.floor(Number(retstart) || 0));
        return {
          db: "pubmed",
          retmode: "json",
          retmax: String(normalizedRetmax),
          retstart: String(normalizedRetstart),
          sort: String(sort || this.sort?.method || "relevance").trim(),
          term: String(term || "").trim(),
        };
      },
      async fetchSummaryRecordsByIds(ids, nlm) {
        void nlm;
        const requestedIds = (Array.isArray(ids) ? ids : [])
          .map((id) => String(id || "").trim())
          .filter((id) => /^[0-9]+$/.test(id));
        if (requestedIds.length === 0) {
          return [];
        }
        if (!this.pubMedSummaryCache || typeof this.pubMedSummaryCache !== "object") {
          this.pubMedSummaryCache = {};
        }
        const uniqueIds = Array.from(new Set(requestedIds));
        const missingIds = uniqueIds.filter((id) => !this.pubMedSummaryCache[id]);
        const chunkSize = 200;
        for (let index = 0; index < missingIds.length; index += chunkSize) {
          const chunkIds = missingIds.slice(index, index + chunkSize);
          const esummaryParams = new URLSearchParams({
            db: "pubmed",
            retmode: "json",
            id: chunkIds.join(","),
          });
          const esummaryResponse = await axios.get(
            `${this.getBackendApiUrl("NlmSummary.php")}?${esummaryParams}`
          );
          const esummaryResult = esummaryResponse?.data?.result;

          if (!esummaryResult) {
            console.error("Error: Search was not successful", esummaryResponse);
            return [];
          }

          chunkIds.forEach((uid) => {
            const entry = esummaryResult[uid];
            if (entry) {
              this.pubMedSummaryCache[uid] = mapPubMedSummaryToResultDto(entry);
            }
          });
        }

        return requestedIds.map((uid) => this.pubMedSummaryCache[uid]).filter(Boolean);
      },
      shouldUseSemanticDateOrdering(resultRefs) {
        return (
          Array.isArray(resultRefs) &&
          resultRefs.length > 0 &&
          (this.sort?.method === "date_desc" || this.sort?.method === "date_asc")
        );
      },
      parseSemanticSortDateValue(value) {
        const normalizedValue = String(value || "").trim();
        if (!normalizedValue) return Number.NaN;
        const parsedTimestamp = Date.parse(normalizedValue);
        if (Number.isFinite(parsedTimestamp)) {
          return parsedTimestamp;
        }
        const yearMatch = normalizedValue.match(/^(\d{4})$/);
        if (yearMatch) {
          return Date.UTC(Number.parseInt(yearMatch[1], 10), 0, 1);
        }
        return Number.NaN;
      },
      getSemanticResultSortTimestamp(entry) {
        const history = Array.isArray(entry?.history) ? entry.history : [];
        const entrezDate = String(
          history.find((item) => item?.pubstatus === "entrez")?.date || ""
        ).trim();
        const candidateDates = [
          entrezDate,
          String(entry?.publicationDate || "").trim(),
          String(entry?.pubDate || entry?.pubdate || "").trim(),
        ];
        for (const candidateDate of candidateDates) {
          const timestamp = this.parseSemanticSortDateValue(candidateDate);
          if (Number.isFinite(timestamp)) {
            return timestamp;
          }
        }
        return Number.NaN;
      },
      sortSemanticHydratedResults(results) {
        const safeResults = Array.isArray(results) ? results : [];
        if (!this.shouldUseSemanticDateOrdering(safeResults)) {
          return safeResults;
        }
        const sortAscending = this.sort?.method === "date_asc";
        return safeResults
          .map((entry, index) => {
            const timestamp = this.getSemanticResultSortTimestamp(entry);
            return {
              entry,
              index,
              timestamp,
              hasTimestamp: Number.isFinite(timestamp),
            };
          })
          .sort((left, right) => {
            if (left.hasTimestamp !== right.hasTimestamp) {
              return left.hasTimestamp ? -1 : 1;
            }
            if (!left.hasTimestamp) {
              return left.index - right.index;
            }
            const timestampDiff = sortAscending
              ? left.timestamp - right.timestamp
              : right.timestamp - left.timestamp;
            if (timestampDiff !== 0) {
              return timestampDiff;
            }
            return left.index - right.index;
          })
          .map(({ entry }) => entry);
      },
      async getSemanticSortedHydratedResults(resultRefs, nlm) {
        const safeRefs = Array.isArray(resultRefs) ? resultRefs : [];
        if (safeRefs.length === 0) {
          return [];
        }
        const cacheKey = `${this.sort?.method || ""}|${safeRefs.map((entry) => entry?.key || "").join(",")}`;
        if (
          cacheKey !== "" &&
          this.semanticSortedResultCacheKey === cacheKey &&
          Array.isArray(this.semanticSortedResultCache)
        ) {
          return this.semanticSortedResultCache;
        }
        const pmidRefs = safeRefs.filter((entry) => entry.type === "pmid");
        const doiRefs = safeRefs.filter(
          (entry) => entry.type === "doi" || entry.type === "openalex"
        );
        this.setSemanticFinalizeLoadingStatus("hydrate", {
          hasPmids: pmidRefs.length > 0,
          hasDois: doiRefs.length > 0,
        });
        this.setSearchProcessStepDetail("finalizeHydrate", {
          role: "pubmedSummaryHydration",
          requestedCount: safeRefs.length,
          pmidCount: pmidRefs.length,
          externalReferenceCount: doiRefs.length,
          pubMedSummaryRequest: {
            role: "pubmedSummaryHydration",
            endpoint: "NlmSummary.php",
            db: "pubmed",
            idCount: pmidRefs.length,
            ids: pmidRefs.map((entry) => entry.pmid).filter(Boolean).slice(0, 25),
            truncated: pmidRefs.length > 25,
          },
          openAlexLookup: {
            endpoint: "OpenAlexWorkLookup.php",
            referenceCount: doiRefs.length,
            domain: this.currentDomain || "",
          },
        });
        const [pmidData, doiData] = await Promise.all([
          this.fetchSummaryRecordsByIds(
            pmidRefs.map((entry) => entry.pmid),
            nlm
          ),
          this.fetchOpenAlexWorksByCandidates(doiRefs, nlm),
        ]);
        const pmidMap = new Map(pmidData.map((entry) => [String(entry.uid), entry]));
        const doiMap = new Map();
        doiRefs.forEach((entry, index) => {
          const mapped = doiData[index] || this.buildSemanticScholarFallbackRecordByRef(entry);
          if (mapped) {
            doiMap.set(entry.key, mapped);
          }
        });
        const hydratedResults = safeRefs
          .map((entry) => {
            const record =
              entry.type === "pmid" ? pmidMap.get(String(entry.pmid)) : doiMap.get(entry.key);
            if (!record) return null;
            if (entry.pubTypeClassification && !record.pubTypeClassification) {
              record.pubTypeClassification = entry.pubTypeClassification;
            }
            return record;
          })
          .filter(Boolean);
        this.mergeSearchProcessStepDetail("finalizeHydrate", {
          hydratedCount: hydratedResults.length,
          missingCount: Math.max(0, safeRefs.length - hydratedResults.length),
        });
        this.setSemanticFinalizeLoadingStatus("sort");
        this.setSearchProcessStepDetail("finalizeSort", {
          sortMethod: this.sort?.method || "",
          inputCount: hydratedResults.length,
        });
        const sortedResults = this.sortSemanticHydratedResults(hydratedResults);
        this.mergeSearchProcessStepDetail("finalizeSort", {
          outputCount: sortedResults.length,
        });
        this.semanticSortedResultCache = sortedResults;
        this.semanticSortedResultCacheKey = cacheKey;
        return sortedResults;
      },
      // ---------------------------------------------------------------
      // Shared search engine: search()/searchMore() call
      // backend/api/UnifiedSearch.php, which uses the same
      // muginPublicSearchRunSearch() orchestrator as public /v1/search.
      // The local JS pipeline below is retained only as dormant compatibility
      // code and is not selectable at runtime.
      // ---------------------------------------------------------------
      buildUnifiedSearchSources() {
        const sources = [];
        if (this.searchWithPubMedBestMatch) sources.push("pubmed");
        if (this.searchWithSemanticScholar) sources.push("semanticScholar");
        if (this.searchWithOpenAlex) sources.push("openAlex");
        if (this.searchWithElicit) sources.push("elicit");
        // Safety net mirroring the local pipeline's own fallback behaviour:
        // when no semantic source is selected (or the AI translation toggle
        // is off), the local "06 Filter and validation" section always falls
        // back to a plain classic PubMed search rather than searching
        // nothing. The unified engine requires an explicit non-empty
        // `sources` list, so replicate that same "never search zero sources"
        // guarantee here instead of surfacing a 422 to the user.
        return sources.length > 0 ? sources : ["pubmed"];
      },
      /**
       * Untranslated custom fretext only — catalog labels and already-translated
       * `#s:pubmed` clauses must not become query.text (AI would rewrite them).
       */
      getUnifiedSearchFreetextQuery() {
        return this.collectCustomFreetextInputs({ includeTranslated: false }).join(" ").trim();
      },
      getSessionFreetextInputKey() {
        return this.collectCustomFreetextInputs({ includeTranslated: true }).join(" ").trim();
      },
      collectCustomFreetextInputs({ includeTranslated = false } = {}) {
        const texts = [];
        (Array.isArray(this.topics) ? this.topics : []).forEach((group) => {
          if (!Array.isArray(group)) return;
          group.forEach((item) => {
            if (item?.isCustom !== true) return;
            if (includeTranslated !== true && item.isTranslated === true) return;
            const text = String(item?.preTranslation || item?.name || "").trim();
            if (text) texts.push(text);
          });
        });
        return texts;
      },
      buildUnifiedSelectedTopicGroups() {
        return (Array.isArray(this.topics) ? this.topics : [])
          .map((group) => {
            if (!Array.isArray(group)) return [];
            return group
              .map((item) => {
                if (!item || typeof item !== "object") return null;
                const scopeRaw = String(item.scope || "normal").trim().toLowerCase();
                const scope = ["narrow", "normal", "broad"].includes(scopeRaw)
                  ? scopeRaw
                  : "normal";
                if (item.isCustom === true) {
                  const rawText = String(
                    item.pubmedGeneratedQuery || item.preTranslation || item.name || ""
                  ).trim();
                  if (!rawText) return null;
                  return {
                    custom: true,
                    rawText,
                    text: rawText,
                    scope,
                    label: rawText,
                    translated: item.isTranslated === true,
                  };
                }
                const id = String(item.id || "")
                  .trim()
                  .toUpperCase();
                if (!/^[A-Z][0-9A-Z]{2,}$/.test(id)) return null;
                return { id, custom: false, scope };
              })
              .filter(Boolean);
          })
          .filter((group) => group.length > 0);
      },
      buildUnifiedSelectedLimitGroups() {
        // Advanced mode: dropdown rows. Simple mode syncs into limitData and
        // clears limitDropdowns — fall back so Unified still gets limit searchStrings.
        const sourceGroups =
          Array.isArray(this.searchDisplayLimitDropdowns) &&
          this.searchDisplayLimitDropdowns.some((group) => Array.isArray(group) && group.length > 0)
            ? this.searchDisplayLimitDropdowns
            : Object.values(this.limitData || {});
        return sourceGroups
          .map((group) => {
            if (!Array.isArray(group)) return [];
            return group
              .map((item) => {
                const id = String(item?.id || "")
                  .trim()
                  .toUpperCase();
                if (!/^[A-Z][0-9A-Z]{2,}$/.test(id)) return null;
                const scopeRaw = String(item?.scope || "normal").trim().toLowerCase();
                const scope = ["narrow", "normal", "broad"].includes(scopeRaw)
                  ? scopeRaw
                  : "normal";
                return { id, scope };
              })
              .filter(Boolean);
          })
          .filter((group) => group.length > 0);
      },
      resetQueryOverrideState() {
        this.draftSourceQueries = {};
        this.lastSyncedSourceQueries = {};
        this.committedQueryOverrides = {};
        this.queryOverrideFreetextKey = "";
        this.pendingQueryOverrideSnapshot = null;
        this.sessionFreetextQueries = null;
        this.sourceSearchStringPending = {};
      },
      getQueryOverrideSourceKeys() {
        return ["pubmed", "semanticScholar", "openAlex", "elicit"];
      },
      getQueryOverrideUrlParamMap() {
        return {
          pubmed: "qpubmed",
          semanticScholar: "qsemanticscholar",
          openAlex: "qopenalex",
          elicit: "qelicit",
        };
      },
      bindQueryOverrideFreetextKey() {
        this.queryOverrideFreetextKey = String(this.sessionFreetextInputKey || "").trim();
      },
      constructQueryOverrideQuery() {
        try {
          const overrides = this.getQueryOverridesForSearch();
          const paramMap = this.getQueryOverrideUrlParamMap();
          const parts = [];
          this.getQueryOverrideSourceKeys().forEach((sourceKey) => {
            const value = String(overrides?.[sourceKey] || "").trim();
            if (!value) return;
            const param = paramMap[sourceKey];
            if (!param) return;
            parts.push(`${param}=${encodeURIComponent(value)}`);
          });
          return parts.length > 0 ? `&${parts.join("&")}` : "";
        } catch (_error) {
          return "";
        }
      },
      applyQueryOverridesFromUrlParams(urlParams) {
        const paramToSource = {
          qpubmed: "pubmed",
          qsemanticscholar: "semanticScholar",
          qopenalex: "openAlex",
          qelicit: "elicit",
        };
        const overrides = {};
        const maxLength = this.getQueryOverrideMaxLength();
        if (urlParams && typeof urlParams.forEach === "function") {
          urlParams.forEach((value, key) => {
            const keyLower = String(key || "")
              .replace(/^amp;/i, "")
              .toLowerCase();
            const sourceKey = paramToSource[keyLower];
            if (!sourceKey) return;
            const trimmed = String(value ?? "").trim();
            if (!trimmed || trimmed.length > maxLength) return;
            overrides[sourceKey] = trimmed;
          });
        }
        this.seedCommittedQueryOverridesFromUrl(overrides);
      },
      seedCommittedQueryOverridesFromUrl(overrides) {
        const seeded = {};
        this.getQueryOverrideSourceKeys().forEach((key) => {
          const value = String(overrides?.[key] || "").trim();
          if (!value || value.length > this.getQueryOverrideMaxLength()) return;
          seeded[key] = value;
        });
        this.committedQueryOverrides = seeded;
        if (Object.keys(seeded).length === 0) {
          return;
        }
        const nextDrafts = { ...this.draftSourceQueries };
        const nextSynced = { ...this.lastSyncedSourceQueries };
        Object.entries(seeded).forEach(([key, value]) => {
          nextDrafts[key] = value;
          nextSynced[key] = value;
          if (key === "pubmed") {
            nextDrafts.pubmedTopics = value;
            nextSynced.pubmedTopics = value;
          }
        });
        this.draftSourceQueries = nextDrafts;
        this.lastSyncedSourceQueries = nextSynced;
        this.bindQueryOverrideFreetextKey();
      },
      getQueryOverrideMaxLength() {
        return 20000;
      },
      combineResolvedPubmedDisplay(pubmedQuery, hardFilterQuery) {
        const pubmed = String(pubmedQuery || "").trim();
        const filter = String(hardFilterQuery || "").trim();
        if (!pubmed) return filter;
        if (!filter) return pubmed;
        if (pubmed === filter) return pubmed;
        if (pubmed.includes(filter)) return pubmed;
        return `(${pubmed}) AND (${filter})`;
      },
      markSourceSearchStringPending(sourceKey, isPending) {
        const key = String(sourceKey || "").trim();
        if (!key) return;
        this.sourceSearchStringPending = {
          ...this.sourceSearchStringPending,
          [key]: isPending === true,
        };
      },
      seedPendingSourceSearchStringDisplays(placeholderText) {
        const text = String(placeholderText || "").trim();
        const sources = this.buildUnifiedSearchSources();
        const snapshot =
          this.pendingQueryOverrideSnapshot && typeof this.pendingQueryOverrideSnapshot === "object"
            ? this.pendingQueryOverrideSnapshot
            : {};
        const nextDrafts = { ...this.draftSourceQueries };
        const nextSynced = { ...this.lastSyncedSourceQueries };
        const pending = {};
        sources.forEach((key) => {
          const override = String(snapshot[key] || "").trim();
          if (override || this.isSourceQueryDirty(key)) {
            pending[key] = false;
            return;
          }
          pending[key] = true;
          if (!text) return;
          if (key === "pubmed") {
            nextDrafts.pubmedTopics = text;
            nextSynced.pubmedTopics = text;
            nextDrafts.pubmed = this.combineResolvedPubmedDisplay(
              text,
              this.getGeneratedPubmedLimitQuery()
            );
            nextSynced.pubmed = nextDrafts.pubmed;
            return;
          }
          nextDrafts[key] = text;
          nextSynced[key] = text;
        });
        this.draftSourceQueries = nextDrafts;
        this.lastSyncedSourceQueries = nextSynced;
        this.sourceSearchStringPending = pending;
      },
      applyResolvedQueriesToSearchStringDisplay(resolvedQueries) {
        if (!resolvedQueries || typeof resolvedQueries !== "object") return;
        const pubmedQuery = String(resolvedQueries.pubmedQuery || "").trim();
        const hardFilterQuery = String(resolvedQueries.hardFilterQuery || "").trim();
        const combined = this.combineResolvedPubmedDisplay(pubmedQuery, hardFilterQuery);
        if (combined || pubmedQuery || hardFilterQuery) {
          this.finalValidatedQuery = combined;
          this.draftSourceQueries = {
            ...this.draftSourceQueries,
            pubmed: combined,
            pubmedTopics: pubmedQuery,
            pubmedLimits: hardFilterQuery,
          };
          this.lastSyncedSourceQueries = {
            ...this.lastSyncedSourceQueries,
            pubmed: combined,
            pubmedTopics: pubmedQuery,
            pubmedLimits: hardFilterQuery,
          };
          this.markSourceSearchStringPending("pubmed", false);
        }
        const plan =
          resolvedQueries.sourceQueryPlan && typeof resolvedQueries.sourceQueryPlan === "object"
            ? resolvedQueries.sourceQueryPlan
            : null;
        if (!plan) return;
        this.globalSemanticSearchState = {
          ...(this.globalSemanticSearchState && typeof this.globalSemanticSearchState === "object"
            ? this.globalSemanticSearchState
            : {}),
          semanticSourceQueryPlan: plan,
        };
        const nextDrafts = { ...this.draftSourceQueries };
        const nextSynced = { ...this.lastSyncedSourceQueries };
        let draftsChanged = false;
        ["semanticScholar", "openAlex", "elicit"].forEach((key) => {
          const query = String(plan?.[key]?.query || "").trim();
          if (!query) return;
          nextDrafts[key] = query;
          nextSynced[key] = query;
          draftsChanged = true;
          this.markSourceSearchStringPending(key, false);
        });
        if (draftsChanged) {
          this.draftSourceQueries = nextDrafts;
          this.lastSyncedSourceQueries = nextSynced;
        }
      },
      getSourceSearchLinkFilters(sourceKey) {
        const planRoot =
          (this.globalSemanticSearchState?.semanticSourceQueryPlan &&
          typeof this.globalSemanticSearchState.semanticSourceQueryPlan === "object"
            ? this.globalSemanticSearchState.semanticSourceQueryPlan
            : null) ||
          (this.earlyIntentPreview?.semanticSourceQueryPlan &&
          typeof this.earlyIntentPreview.semanticSourceQueryPlan === "object"
            ? this.earlyIntentPreview.semanticSourceQueryPlan
            : null) ||
          {};
        const planFilters =
          planRoot?.[sourceKey]?.filters && typeof planRoot[sourceKey].filters === "object"
            ? planRoot[sourceKey].filters
            : {};
        const contextFilters =
          this.semanticWordedIntentContext?.sourceFilters?.[sourceKey] &&
          typeof this.semanticWordedIntentContext.sourceFilters[sourceKey] === "object"
            ? this.semanticWordedIntentContext.sourceFilters[sourceKey]
            : {};
        const year =
          String(
            planFilters.year ||
              planFilters.publicationYear ||
              contextFilters.year ||
              contextFilters.publicationYear ||
              ""
          ).trim() ||
          buildOpenAlexPublicationYearFilter(
            this.semanticWordedIntentContext?.hardFilters?.publicationDateYears
          ) ||
          "";
        return {
          ...contextFilters,
          ...planFilters,
          year,
          publicationYear: String(
            planFilters.publicationYear || contextFilters.publicationYear || year
          ).trim(),
        };
      },
      getGeneratedSemanticSourceQuery(sourceKey) {
        const details = Array.isArray(this.unifiedProcessSourceQueryDetails)
          ? this.unifiedProcessSourceQueryDetails
          : [];
        const fromDetails = details.find(
          (entry) => String(entry?.source || "").trim() === sourceKey
        );
        const detailQuery = String(fromDetails?.query || "").trim();
        if (detailQuery) return detailQuery;
        const plan =
          this.globalSemanticSearchState?.semanticSourceQueryPlan &&
          typeof this.globalSemanticSearchState.semanticSourceQueryPlan === "object"
            ? this.globalSemanticSearchState.semanticSourceQueryPlan
            : {};
        return String(plan?.[sourceKey]?.query || "").trim();
      },
      getGeneratedSourceQuery(sourceKey) {
        if (sourceKey === "pubmed") return this.displaySearchString;
        if (sourceKey === "pubmedTopics") return this.getGeneratedPubmedTopicQuery();
        if (sourceKey === "pubmedLimits") return this.getGeneratedPubmedLimitQuery();
        return this.getGeneratedSemanticSourceQuery(sourceKey);
      },
      getDisplayLimitGroups() {
        const withoutDatabaseItems = (group) =>
          (Array.isArray(group) ? group : []).filter((item) => !this.isDatabaseLimitItem(item));
        const safeDropdowns = Array.isArray(this.searchDisplayLimitDropdowns)
          ? this.searchDisplayLimitDropdowns
          : [];
        const dropdownGroups = safeDropdowns
          .map(withoutDatabaseItems)
          .filter((group) => group.length > 0);
        const simpleGroups = Object.values(this.limitData || {})
          .map(withoutDatabaseItems)
          .filter((items) => items.length > 0);
        if (this.advanced) {
          return dropdownGroups.length > 0 ? dropdownGroups : simpleGroups;
        }
        return [...simpleGroups, ...dropdownGroups];
      },
      hasMeaningfulSourceFilterValues(filters) {
        if (!filters || typeof filters !== "object") return false;
        return Object.values(filters).some((value) => {
          if (Array.isArray(value)) return value.length > 0;
          if (typeof value === "boolean") return true;
          if (typeof value === "number") return Number.isFinite(value);
          return String(value || "").trim() !== "";
        });
      },
      limitAppliesToSemanticSource(item, sourceKey) {
        const sourceFilters = item?.semanticConfig?.sourceFilters?.[sourceKey];
        if (this.hasMeaningfulSourceFilterValues(sourceFilters)) return true;
        const years = item?.semanticConfig?.hardFilters?.publicationDateYears;
        return Array.isArray(years) && years.length > 0;
      },
      formatSourceFilterActualValue(filters) {
        if (!this.hasMeaningfulSourceFilterValues(filters)) return "";
        const parts = [];
        const pushList = (value) => {
          if (Array.isArray(value) && value.length > 0) {
            parts.push(value.map((item) => String(item || "").trim()).filter(Boolean).join(", "));
          }
        };
        if (filters.year) parts.push(String(filters.year).trim());
        if (filters.publicationYear) parts.push(String(filters.publicationYear).trim());
        if (filters.publicationDateOrYear) parts.push(String(filters.publicationDateOrYear).trim());
        pushList(filters.publicationTypes);
        pushList(filters.workType);
        pushList(filters.workTypes);
        pushList(filters.typeTags);
        pushList(filters.language);
        pushList(filters.sourceType);
        pushList(filters.includeKeywords);
        pushList(filters.excludeKeywords);
        const minYear = filters.minYear;
        const maxYear = filters.maxYear;
        if (minYear || maxYear) {
          parts.push(
            [minYear, maxYear]
              .filter((value) => value !== null && value !== undefined && value !== "")
              .join("-")
          );
        }
        if (filters.isOa === true || filters.is_oa === true) parts.push("is_oa");
        if (filters.hasPdf === true) parts.push("hasPdf");
        if (filters.pubmedOnly === true) parts.push("pubmedOnly");
        if (filters.retracted) parts.push(String(filters.retracted).trim());
        if (Number.isInteger(filters.maxQuartile)) parts.push(`Q${filters.maxQuartile}`);
        return parts.filter(Boolean).join(", ");
      },
      formatHardFilterFallbackValue(item) {
        const hard = item?.semanticConfig?.hardFilters;
        if (!hard || typeof hard !== "object") return "";
        const parts = [];
        const pushList = (value) => {
          (Array.isArray(value) ? value : []).forEach((entry) => {
            const text = String(entry || "").trim();
            if (text) parts.push(text);
          });
        };
        pushList(hard.sourceFormat);
        pushList(hard.publicationType);
        pushList(hard.studyDesign);
        pushList(hard.ageGroup);
        pushList(hard.language);
        pushList(hard.filterProfile);
        pushList(hard.publicationDateYears);
        return [...new Set(parts)].join(", ");
      },
      getSourceLimitActualValue(item, sourceKey) {
        if (sourceKey === "pubmed") {
          const scope = String(item?.scope || "normal").trim() || "normal";
          const pubmedGeneratedQuery = String(item?.pubmedGeneratedQuery || "").trim();
          if (item?.includeTranslatedTextInQuery === true && pubmedGeneratedQuery) {
            return pubmedGeneratedQuery;
          }
          const scoped = Array.isArray(item?.searchStrings?.[scope])
            ? item.searchStrings[scope]
            : [];
          const searchString = scoped
            .map((value) => String(value || "").trim())
            .filter(Boolean)
            .join(" OR ");
          if (searchString) return searchString;
          return this.formatHardFilterFallbackValue(item);
        }
        const formatted = this.formatSourceFilterActualValue(
          item?.semanticConfig?.sourceFilters?.[sourceKey]
        );
        if (formatted) return formatted;
        return (
          buildOpenAlexPublicationYearFilter(
            item?.semanticConfig?.hardFilters?.publicationDateYears
          ) || this.formatHardFilterFallbackValue(item)
        );
      },
      getSourceLimitGroupsForDisplay(sourceKey) {
        const groups = this.getDisplayLimitGroups();
        const filtered =
          sourceKey === "pubmed"
            ? groups
            : groups
                .map((group) =>
                  (Array.isArray(group) ? group : []).filter((item) =>
                    this.limitAppliesToSemanticSource(item, sourceKey)
                  )
                )
                .filter((group) => group.length > 0);
        const seenIds = new Set();
        return filtered
          .map((group) =>
            (Array.isArray(group) ? group : []).filter((item) => {
              const id = String(item?.id || item?.name || "").trim().toLowerCase();
              if (!id || seenIds.has(id)) return false;
              seenIds.add(id);
              return true;
            })
          )
          .filter((group) => group.length > 0)
          .map((group) =>
            group.map((item) => ({
              ...item,
              actualLimitValue: this.getSourceLimitActualValue(item, sourceKey),
            }))
          );
      },
      isSourceQueryDirty(sourceKey) {
        if (sourceKey === "pubmed") {
          return this.isSourceQueryPartDirty("pubmedTopics") || this.isSourceQueryPartDirty("pubmed");
        }
        return this.isSourceQueryPartDirty(sourceKey);
      },
      getPubmedOverrideDraftValue() {
        if (Object.prototype.hasOwnProperty.call(this.draftSourceQueries || {}, "pubmedTopics")) {
          return String(this.draftSourceQueries.pubmedTopics || "").trim();
        }
        return String(this.draftSourceQueries?.pubmed || "").trim();
      },
      isSourceQueryPartDirty(sourceKey) {
        if (!Object.prototype.hasOwnProperty.call(this.draftSourceQueries || {}, sourceKey)) {
          return false;
        }
        const draft = String(this.draftSourceQueries[sourceKey] || "").trim();
        const synced = Object.prototype.hasOwnProperty.call(this.lastSyncedSourceQueries || {}, sourceKey)
          ? String(this.lastSyncedSourceQueries[sourceKey] || "").trim()
          : this.getGeneratedSourceQuery(sourceKey);
        return draft !== synced;
      },
      filterQueryOverridesToCurrentSources(overrides) {
        const sourceSet = new Set(this.buildUnifiedSearchSources());
        const maxLength = this.getQueryOverrideMaxLength();
        const filtered = {};
        this.getQueryOverrideSourceKeys().forEach((key) => {
          if (!sourceSet.has(key)) return;
          const value = String(overrides?.[key] || "").trim();
          if (!value || value.length > maxLength) return;
          filtered[key] = value;
        });
        return filtered;
      },
      getCommittedQueryOverridesForCurrentSources() {
        return this.filterQueryOverridesToCurrentSources(this.committedQueryOverrides || {});
      },
      getDirtyQueryOverrides() {
        const sourceSet = new Set(this.buildUnifiedSearchSources());
        const maxLength = this.getQueryOverrideMaxLength();
        const overrides = {};
        this.getQueryOverrideSourceKeys().forEach((key) => {
          if (!sourceSet.has(key) || !this.isSourceQueryDirty(key)) return;
          const value = key === "pubmed"
            ? this.getPubmedOverrideDraftValue()
            : String(this.draftSourceQueries?.[key] || "").trim();
          if (!value || value.length > maxLength) return;
          overrides[key] = value;
        });
        return overrides;
      },
      getQueryOverridesForSearch() {
        const committed = this.getCommittedQueryOverridesForCurrentSources();
        const sourceSet = new Set(this.buildUnifiedSearchSources());
        const merged = { ...committed };
        this.getQueryOverrideSourceKeys().forEach((key) => {
          if (!sourceSet.has(key) || !this.isSourceQueryDirty(key)) return;
          const value = key === "pubmed"
            ? this.getPubmedOverrideDraftValue()
            : String(this.draftSourceQueries?.[key] || "").trim();
          if (!value) {
            delete merged[key];
            return;
          }
          if (value.length > this.getQueryOverrideMaxLength()) return;
          merged[key] = value;
        });
        return merged;
      },
      getCachedFreetextQueriesForSearch() {
        const cached =
          this.sessionFreetextQueries && typeof this.sessionFreetextQueries === "object"
            ? this.sessionFreetextQueries
            : null;
        const input = String(cached?.input || "").trim();
        const current = String(this.getUnifiedSearchFreetextQuery() || "").trim();
        if (!cached || !input || input !== current) return null;
        const overrides = this.getQueryOverridesForSearch();
        const maxLength = this.getQueryOverrideMaxLength();
        const payload = { input };
        ["pubmed", "semanticScholar", "openAlex", "elicit"].forEach((key) => {
          if (overrides[key]) return;
          const value = String(cached[key] || "").trim();
          if (!value || value.length > maxLength) return;
          payload[key] = value;
        });
        const semanticSeed = ["semanticScholar", "openAlex", "elicit"]
          .map((key) => String(payload[key] || "").trim())
          .find(Boolean);
        if (semanticSeed) {
          this.buildUnifiedSearchSources().forEach((key) => {
            if (key === "pubmed" || payload[key] || overrides[key]) return;
            if (!["semanticScholar", "openAlex", "elicit"].includes(key)) return;
            payload[key] = semanticSeed;
          });
        }
        return Object.keys(payload).length > 1 ? payload : null;
      },
      captureSessionFreetextQueries(resolvedQueries, freetextQuery) {
        const input = String(freetextQuery || "").trim();
        if (!input) return;
        const resolved =
          resolvedQueries && typeof resolvedQueries === "object" ? resolvedQueries : {};
        const plan =
          resolved.sourceQueryPlan && typeof resolved.sourceQueryPlan === "object"
            ? resolved.sourceQueryPlan
            : {};
        const prev =
          this.sessionFreetextQueries && typeof this.sessionFreetextQueries === "object"
            ? this.sessionFreetextQueries
            : {};
        const pubmed = String(resolved.freetextPubMedQuery || "").trim();
        const next = { input };
        const pubmedValue = pubmed || String(prev.pubmed || "").trim();
        if (pubmedValue) next.pubmed = pubmedValue;
        ["semanticScholar", "openAlex", "elicit"].forEach((key) => {
          const fromPlan = String(plan?.[key]?.query || "").trim();
          const fromPrev = String(prev[key] || "").trim();
          const fromSynced = String(this.lastSyncedSourceQueries?.[key] || "").trim();
          const fromDraft = String(this.draftSourceQueries?.[key] || "").trim();
          const value =
            fromPlan ||
            fromPrev ||
            (fromSynced && fromSynced !== input ? fromSynced : "") ||
            (fromDraft && fromDraft !== input ? fromDraft : "");
          if (value) next[key] = value;
        });
        const semanticSeed = ["semanticScholar", "openAlex", "elicit"]
          .map((key) => String(next[key] || "").trim())
          .find(Boolean);
        if (semanticSeed) {
          this.buildUnifiedSearchSources().forEach((key) => {
            if (!["semanticScholar", "openAlex", "elicit"].includes(key)) return;
            if (!next[key]) next[key] = semanticSeed;
          });
        }
        if (!next.pubmed && !next.semanticScholar && !next.openAlex && !next.elicit) return;
        this.sessionFreetextQueries = next;
      },
      flushSourceSearchStringDraftsFromDom() {
        const worded = this.$refs.wordedSearchString;
        if (worded && typeof worded.flushSourceQueryEdits === "function") {
          worded.flushSourceQueryEdits();
        }
      },
      onSourceSearchQueryUpdate({ key, value } = {}) {
        const sourceKey = String(key || "").trim();
        if (
          !this.getQueryOverrideSourceKeys().includes(sourceKey) &&
          sourceKey !== "pubmedTopics"
        ) {
          return;
        }
        const nextDrafts = {
          ...this.draftSourceQueries,
          [sourceKey]: String(value ?? ""),
        };
        if (sourceKey === "pubmedTopics") {
          const topic = String(
            nextDrafts.pubmedTopics ?? this.getGeneratedPubmedTopicQuery() ?? ""
          ).trim();
          nextDrafts.pubmed = this.combineResolvedPubmedDisplay(
            topic,
            this.getGeneratedPubmedLimitQuery()
          );
        }
        this.draftSourceQueries = nextDrafts;
      },
      onSourceSearchQueryEditFinished() {
        this.setUrl();
      },
      syncQueryOverrideDraftsAfterSearch() {
        const snapshot =
          this.pendingQueryOverrideSnapshot && typeof this.pendingQueryOverrideSnapshot === "object"
            ? this.pendingQueryOverrideSnapshot
            : {};
        const nextDrafts = { ...this.draftSourceQueries };
        const nextSynced = { ...this.lastSyncedSourceQueries };
        this.getQueryOverrideSourceKeys().forEach((key) => {
          const wasSent = Object.prototype.hasOwnProperty.call(snapshot, key);
          if (wasSent) {
            const used = String(snapshot[key] || nextDrafts[key] || this.getGeneratedSourceQuery(key) || "");
            nextDrafts[key] = used;
            nextSynced[key] = used;
            return;
          }
          if (this.isSourceQueryDirty(key)) return;
          const generated = this.getGeneratedSourceQuery(key);
          if (!generated) return;
          nextDrafts[key] = generated;
          nextSynced[key] = generated;
        });
        this.draftSourceQueries = nextDrafts;
        this.lastSyncedSourceQueries = nextSynced;
      },
      buildUnifiedSearchRequestPayload(pageNumber, queryOverridesMode = "auto") {
        // Catalog topics/limits are sent as structured ids; only custom fretext
        // goes in query.text so PubMed can use topics.json searchStrings directly.
        const freetextQuery = this.getUnifiedSearchFreetextQuery();
        const selectedTopicGroups = this.buildUnifiedSelectedTopicGroups();
        const selectedLimitGroups = this.buildUnifiedSelectedLimitGroups();
        const selectedTopicIds = selectedTopicGroups
          .flatMap((group) => group)
          .filter((entry) => entry?.custom !== true)
          .map((entry) => String(entry?.id || "").trim())
          .filter(Boolean);
        const selectedLimitIds = selectedLimitGroups
          .flatMap((group) => group)
          .map((entry) => String(entry?.id || "").trim())
          .filter(Boolean);
        const hardFiltersSource =
          this.semanticWordedIntentContext && typeof this.semanticWordedIntentContext.hardFilters === "object"
            ? this.semanticWordedIntentContext.hardFilters
            : {};
        const sourceFiltersSource =
          this.semanticWordedIntentContext && typeof this.semanticWordedIntentContext.sourceFilters === "object"
            ? this.semanticWordedIntentContext.sourceFilters
            : {};
        const intentContextSource =
          this.semanticWordedIntentContext && typeof this.semanticWordedIntentContext === "object"
            ? this.semanticWordedIntentContext
            : {};
        const languageCode = String(this.language || "").trim().toLowerCase();
        const ruleIds = Array.isArray(intentContextSource.postValidation?.ruleIds)
          ? intentContextSource.postValidation.ruleIds
          : Array.isArray(hardFiltersSource.postValidationRuleIds)
            ? hardFiltersSource.postValidationRuleIds
            : [];
        const wordedIntent = String(this.searchIntent || "").trim();
        let queryOverrides = {};
        if (queryOverridesMode === "committed") {
          queryOverrides = this.getCommittedQueryOverridesForCurrentSources();
        } else if (queryOverridesMode && typeof queryOverridesMode === "object") {
          queryOverrides = this.filterQueryOverridesToCurrentSources(queryOverridesMode);
        } else {
          queryOverrides = this.getQueryOverridesForSearch();
        }
        const payload = {
          apiVersion: "1",
          query: {
            text: freetextQuery,
            language: languageCode === "en" ? "en" : "da",
          },
          translation: {
            mode: this.searchWithAI === true ? "auto" : "none",
          },
          domain: String(this.currentDomain || "").trim(),
          sources: this.buildUnifiedSearchSources(),
          sort: { method: this.sort?.method || "relevance" },
          focus: normalizeRerankProfileId(this.selectedRerankProfileId) || "",
          page: {
            number: Math.max(1, Number(pageNumber) || 1),
            size: this.pageSize,
          },
          responseOptions: {
            includeAbstracts: true,
            language: languageCode === "en" ? "en" : "da",
            // Single flag that internally activates the canonical process-details
            // collector (and the resolvedQueries/diagnostics it depends on).
            includeProcessDetails: true,
            // Mirror public-api ?nocache=1 so SearchForm URL parity can force a
            // fresh search-response + LLM final-rerank pass.
            noCache: this.isUrlTargetedComponent() && this.readUrlFlag("nocache"),
          },
          hardFilters: {
            filterProfiles: Array.isArray(hardFiltersSource.filterProfiles)
              ? hardFiltersSource.filterProfiles
              : [],
            languages: Array.isArray(hardFiltersSource.languages) ? hardFiltersSource.languages : [],
            publicationYear: buildOpenAlexPublicationYearFilter(hardFiltersSource.publicationDateYears) || "",
            publicationDateYears: Array.isArray(hardFiltersSource.publicationDateYears)
              ? hardFiltersSource.publicationDateYears
              : [],
            publicationTypes: Array.isArray(hardFiltersSource.publicationTypes)
              ? hardFiltersSource.publicationTypes
              : [],
            studyDesigns: Array.isArray(hardFiltersSource.studyDesigns)
              ? hardFiltersSource.studyDesigns
              : [],
            ageGroups: Array.isArray(hardFiltersSource.ageGroups)
              ? hardFiltersSource.ageGroups
              : [],
            sourceFormats: Array.isArray(hardFiltersSource.sourceFormats) ? hardFiltersSource.sourceFormats : [],
            doiOnlyRuleIds: Array.isArray(hardFiltersSource.doiOnlyRuleIds)
              ? hardFiltersSource.doiOnlyRuleIds
              : [],
            postValidationRuleIds: Array.isArray(hardFiltersSource.postValidationRuleIds)
              ? hardFiltersSource.postValidationRuleIds
              : [],
          },
          sourceFilters: sourceFiltersSource,
          intentContext: {
            // Same as GET/API: only untranslated freetext. Catalog labels stay
            // in semanticBlocks / selectedTopicIds so LLM input matches public search.
            rawUserInput: freetextQuery,
            contextualSearchInput: String(
              intentContextSource.semanticCoreText ||
                intentContextSource.semanticWordedIntent ||
                wordedIntent ||
                freetextQuery ||
                ""
            ).trim(),
            selectedTopicIds,
            selectedTopicGroups,
            selectedLimitIds,
            selectedLimitGroups,
            selectedTopics: Array.isArray(intentContextSource.selectedTopicsEnglish)
              ? intentContextSource.selectedTopicsEnglish
              : [],
            selectedLimits: Array.isArray(intentContextSource.selectedLimitsEnglish)
              ? intentContextSource.selectedLimitsEnglish
              : [],
            semanticBlocks: Array.isArray(intentContextSource.semanticBlocks)
              ? intentContextSource.semanticBlocks
              : [],
            ruleIds: ruleIds.map((id) => String(id || "").trim()).filter(Boolean),
          },
        };
        if (queryOverrides && Object.keys(queryOverrides).length > 0) {
          payload.queryOverrides = queryOverrides;
        }
        const cachedFreetextQueries = this.getCachedFreetextQueriesForSearch();
        if (cachedFreetextQueries) {
          payload.cachedFreetextQueries = cachedFreetextQueries;
        }
        const standardStringPayload = {};
        const standardStringText = String(this.standardString || "").trim();
        if (standardStringText) {
          standardStringPayload.text = standardStringText;
        }
        const standardStringScope = String(this.standardStringScope || "normal")
          .trim()
          .toLowerCase();
        if (standardStringScope !== "normal" && ["narrow", "broad"].includes(standardStringScope)) {
          standardStringPayload.scope = standardStringScope;
        }
        if (Object.keys(standardStringPayload).length > 0) {
          payload.standardString = standardStringPayload;
        }
        return payload;
      },
      async callUnifiedSearchEndpoint(payload) {
        const url = this.getBackendApiUrl("UnifiedSearch.php");
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        let data = null;
        try {
          data = await response.json();
        } catch (_error) {
          data = null;
        }
        if (!response.ok) {
          const message =
            (data && typeof data === "object" && data.error) ||
            `Unified search request failed (${response.status})`;
          throw new Error(message);
        }
        return data && typeof data === "object" ? data : {};
      },
      // Parses one SSE "event:"/"data:" block (already split on the blank-line
      // event separator) as emitted by muginPublicSearchEmitSseEvent() in
      // public-search-lib.php. data: lines are rejoined with newlines before
      // JSON-parsing, since the backend pretty-prints (multi-line) payloads.
      parseUnifiedSearchSseEventBlock(rawBlock) {
        const lines = String(rawBlock || "").split("\n");
        let eventName = "message";
        const dataLines = [];
        lines.forEach((line) => {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).replace(/^ /, ""));
          }
        });
        if (dataLines.length === 0) return null;
        let data = null;
        try {
          data = JSON.parse(dataLines.join("\n"));
        } catch (_error) {
          data = null;
        }
        return { event: eventName, data };
      },
      // Streaming variant of callUnifiedSearchEndpoint(): requests SSE progress
      // events (same stage vocabulary as the local pipeline's own
      // activateSemanticLoadingProcessStep() step ids - 'pubmed',
      // 'semanticScholar', 'openAlex', 'elicit', 'finalizeCollect',
      // 'finalizeHydrate', 'finalRerank', ...) so the existing rich loading
      // UI can show real progress for a unified-engine search instead of
      // sitting frozen on "Oversætter og tilpasser søgningen" for the whole
      // (potentially 30-90s) duration of one opaque request. Falls back to the
      // plain JSON path automatically for early validation errors (the backend
      // only switches to SSE after successfully parsing the request) and for
      // browsers without stream support.
      async callUnifiedSearchEndpointStreaming(payload, onProgressStage) {
        const url = this.getBackendApiUrl("UnifiedSearch.php");
        const streamingPayload = {
          ...payload,
          responseOptions: { ...(payload.responseOptions || {}), stream: true },
        };
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(streamingPayload),
        });
        const contentType = String(response.headers?.get?.("content-type") || "");
        if (!response.body || typeof TextDecoderStream === "undefined" || !contentType.includes("text/event-stream")) {
          let data = null;
          try {
            data = await response.json();
          } catch (_error) {
            data = null;
          }
          if (!response.ok) {
            const message =
              (data && typeof data === "object" && data.error) ||
              `Unified search request failed (${response.status})`;
            throw new Error(message);
          }
          return data && typeof data === "object" ? data : {};
        }

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        let finalResult = null;
        let streamError = "";
        try {
          let done = false;
          while (!done) {
            const { done: readerDone, value } = await reader.read();
            done = readerDone;
            if (value) buffer += value;
            let boundaryIndex = buffer.indexOf("\n\n");
            while (boundaryIndex !== -1) {
              const rawEvent = buffer.slice(0, boundaryIndex);
              buffer = buffer.slice(boundaryIndex + 2);
              const parsedEvent = this.parseUnifiedSearchSseEventBlock(rawEvent);
              if (parsedEvent) {
                if (parsedEvent.event === "progress" && typeof onProgressStage === "function") {
                  const stage = String(parsedEvent.data?.stage || parsedEvent.data?.stepId || "").trim();
                  if (stage) onProgressStage(stage, parsedEvent.data || {});
                } else if (parsedEvent.event === "result") {
                  finalResult = parsedEvent.data;
                } else if (parsedEvent.event === "error") {
                  streamError = String(parsedEvent.data?.error || "Unified search failed");
                }
              }
              boundaryIndex = buffer.indexOf("\n\n");
            }
          }
        } finally {
          try {
            await reader.cancel();
          } catch (_error) {
            /* ignore cleanup errors from aborted/closed streams */
          }
          reader.releaseLock();
        }
        if (streamError) throw new Error(streamError);
        if (!finalResult || typeof finalResult !== "object") {
          throw new Error("Unified search stream ended without a result");
        }
        return finalResult;
      },
      mapUnifiedSearchResponseResults(results) {
        return (Array.isArray(results) ? results : []).map((result) =>
          mapUnifiedApiResultToResultDto(result)
        );
      },
      // Backend source first hops run concurrently; source-specific follow-up
      // parsing/requests are consumed afterward. Source steps must use
      // activateConcurrentSemanticLoadingStep() (which leaves sibling source
      // steps alone) rather than the generic
      // activateSemanticLoadingProcessStep() (which would otherwise reset an
      // in-flight sibling back to "pending" or complete it with a bogus
      // near-zero duration, since sources/prepare-sub-steps are interleaved
      // in the step order but not in arrival order here). Returns a handler
      // closure that also completes the previously-active source step (with
      // an accurate end time) as soon as the next stage arrives.
      createUnifiedSearchProgressHandler(isCancelled) {
        const sourceStepIds = ["pubmed", "semanticScholar", "openAlex", "elicit"];
        let activeSourceStepId = "";
        return (stage, context = {}) => {
          if (isCancelled()) return;
          if (context?.resolvedQueries && typeof context.resolvedQueries === "object") {
            this.applyResolvedQueriesToSearchStringDisplay(context.resolvedQueries);
            this.captureSessionFreetextQueries(
              context.resolvedQueries,
              this.getUnifiedSearchFreetextQuery()
            );
          }
          if (stage === "resolvedQueries") {
            return;
          }
          if (context?.processStepDetail && typeof context.processStepDetail === "object") {
            const adapted = adaptUnifiedProcessDetails({
              version: "1",
              sourceQueryDetails: [],
              processStepDetails: [context.processStepDetail],
            });
            const adaptedDetails = adapted.processStepDetails.filter(
              (detail) => detail.stepId && detail.stepId !== "prepare"
            );
            if (adaptedDetails.length > 0) {
              adaptedDetails.forEach((detail) => {
                this.setSearchProcessStepDetail(detail.stepId, detail.payload, detail.label);
                this.maybeCompleteProcessStepAfterDetail(detail.stepId);
              });
            } else {
              // Fallback when adapter rejects an otherwise usable SSE detail
              // (e.g. unusual nesting): still surface Detaljer for the step.
              const raw = context.processStepDetail;
              const stepId = String(raw.stepId || context.stepId || stage || "").trim();
              const payload =
                raw.payload && typeof raw.payload === "object"
                  ? raw.payload
                  : raw.queries || raw.searchBasis || raw.pubmedQuery
                    ? raw
                    : null;
              if (stepId && stepId !== "prepare" && payload && typeof payload === "object") {
                const foldedStepId = this.getVisibleSemanticLoadingProcessStep(stepId).stepId || stepId;
                this.setSearchProcessStepDetail(
                  foldedStepId,
                  payload,
                  this.getSemanticLoadingProcessStepLabel(foldedStepId)
                );
                this.maybeCompleteProcessStepAfterDetail(foldedStepId);
              }
            }
          }
          if (context?.sourceQueryDetail && typeof context.sourceQueryDetail === "object") {
            const adapted = adaptUnifiedProcessDetails({
              version: "1",
              sourceQueryDetails: [context.sourceQueryDetail],
              processStepDetails: [],
            });
            adapted.sourceQueryDetails.forEach((detail) => {
              const detailKey = `${detail.source}|${detail.query.toLowerCase()}`;
              const current = Array.isArray(this.unifiedProcessSourceQueryDetails)
                ? this.unifiedProcessSourceQueryDetails
                : [];
              const withoutCurrent = current.filter(
                (entry) =>
                  `${String(entry?.source || "").trim()}|${String(entry?.query || "")
                    .trim()
                    .toLowerCase()}` !== detailKey
              );
              this.unifiedProcessSourceQueryDetails = [...withoutCurrent, detail];
              this.maybeCompleteProcessStepAfterDetail(detail.source);
            });
          }
          // Supplemental detail events must not reactivate earlier loading
          // steps or alter their timing/order.
          if (context?.detailOnly === true) {
            this.reconcilePreparePhaseProcessStepsAfterLaterProgress();
            return;
          }
          const messageKey = String(context?.messageKey || "").trim();
          if (stage === "cache") {
            const cacheKey = messageKey || "semanticSearchProgressCacheHit";
            const now = this.getProcessTimingNow();
            this.loadingProcessSteps = [
              {
                id: "cache",
                label: this.getSemanticLoadingProcessStepLabel("cache", cacheKey),
                status: "completed",
                startedAtMs: now,
                endedAtMs: now,
                elapsedMs: 0,
              },
            ];
            this.searchLoadingStatusText = this.getSemanticLoadingProcessStepLabel("cache", cacheKey);
            return;
          }
          const isSourceStage = sourceStepIds.includes(stage);
          const explicitStatus = String(context?.status || "").trim();
          const explicitElapsedMs = Number(context?.elapsedMs);
          // Apply terminal status (incl. completed) only after details above.
          if (explicitStatus && this.isSemanticLoadingTerminalStatus(explicitStatus)) {
            if (isSourceStage) {
              this.activateConcurrentSemanticLoadingStep(stage, messageKey);
              this.setSemanticLoadingProcessStepStatus(stage, explicitStatus, messageKey);
              if (Number.isFinite(explicitElapsedMs) && explicitElapsedMs >= 0) {
                const step = (this.loadingProcessSteps || []).find(
                  (entry) => String(entry?.id || "") === stage
                );
                if (step) {
                  const monotonicElapsedMs = Math.max(
                    Number(step.elapsedMs) || 0,
                    explicitElapsedMs
                  );
                  step.elapsedMs = monotonicElapsedMs;
                  if (!Number.isFinite(Number(step.startedAtMs)) || Number(step.startedAtMs) <= 0) {
                    step.startedAtMs = this.getProcessTimingNow() - monotonicElapsedMs;
                  }
                  step.endedAtMs = Math.max(
                    Number(step.endedAtMs) || 0,
                    Number(step.startedAtMs) + monotonicElapsedMs
                  );
                }
              }
              if (activeSourceStepId === stage) {
                activeSourceStepId = "";
              }
            } else if (this.isPreparePhaseSemanticLoadingStep(stage)) {
              // Prepare-lane steps (esp. mesh) often complete while source prefetch
              // has already moved the UI forward. Full activate() is start-oriented
              // and can leave an out-of-order prepare step stuck on pending.
              this.ensureSemanticLoadingProcessStepPresence(stage, messageKey);
              const prepareStep = (this.loadingProcessSteps || []).find(
                (entry) => String(entry?.id || "") === this.getVisibleSemanticLoadingProcessStep(stage, messageKey).stepId
              );
              if (
                prepareStep &&
                (!Number.isFinite(Number(prepareStep.startedAtMs)) ||
                  Number(prepareStep.startedAtMs) <= 0)
              ) {
                this.startProcessStepTiming(prepareStep);
              }
              this.setSemanticLoadingProcessStepStatus(stage, explicitStatus, messageKey);
            } else {
              this.activateSemanticLoadingProcessStep(stage, messageKey);
              this.setSemanticLoadingProcessStepStatus(stage, explicitStatus, messageKey);
            }
            this.reconcilePreparePhaseProcessStepsAfterLaterProgress();
            return;
          }
          if (activeSourceStepId && (activeSourceStepId !== stage || !isSourceStage)) {
            // Only auto-complete the previous source when its detail is present.
            if (
              !this.processStepExpectsDetailPayload(activeSourceStepId) ||
              this.processStepHasDetailPayload(activeSourceStepId)
            ) {
              this.completeConcurrentSemanticLoadingStep(activeSourceStepId);
            }
            activeSourceStepId = "";
          }
          if (isSourceStage) {
            this.activateConcurrentSemanticLoadingStep(stage, messageKey);
            activeSourceStepId = stage;
          } else {
            this.activateSemanticLoadingProcessStep(stage, messageKey);
          }
          this.reconcilePreparePhaseProcessStepsAfterLaterProgress();
        };
      },
      // Thin adapter over backend processDetails (search-basis is folded into
      // the first prepare-lane step; no separate timed prepare stage).
      populateUnifiedSearchProcessStepDetails(response, rawQuery) {
        const resolvedQueries =
          response?.resolvedQueries && typeof response.resolvedQueries === "object"
            ? response.resolvedQueries
            : {};
        this.globalSemanticSearchInput = rawQuery;
        this.globalSemanticSearchState = this.buildGlobalSemanticSearchState(rawQuery, {
          pubmedGeneratedQuery: String(resolvedQueries.pubmedQuery || "").trim(),
          semanticSourceQueryPlan:
            resolvedQueries.sourceQueryPlan && typeof resolvedQueries.sourceQueryPlan === "object"
              ? resolvedQueries.sourceQueryPlan
              : {},
          semanticScholarQuery: String(resolvedQueries.semanticIntent || "").trim(),
        });

        this.applyResolvedQueriesToSearchStringDisplay(resolvedQueries);
        const adapted = adaptUnifiedProcessDetails(response?.processDetails, {
          frontendOwnedSteps: [],
        });
        this.unifiedProcessSourceQueryDetails = adapted.sourceQueryDetails;
        adapted.processStepDetails.forEach((detail) => {
          this.setSearchProcessStepDetail(detail.stepId, detail.payload, detail.label);
          this.maybeCompleteProcessStepAfterDetail(detail.stepId);
        });
        this.reconcilePreparePhaseProcessStepsAfterLaterProgress();
        this.syncQueryOverrideDraftsAfterSearch();
      },
      async runUnifiedEngineSearch(isCancelled) {
        const payload = this.buildUnifiedSearchRequestPayload(
          1,
          this.pendingQueryOverrideSnapshot && typeof this.pendingQueryOverrideSnapshot === "object"
            ? this.pendingQueryOverrideSnapshot
            : "auto"
        );
        const freetextQuery = String(payload?.query?.text || "").trim();
        const hasTopics =
          (Array.isArray(payload?.intentContext?.selectedTopicGroups) &&
            payload.intentContext.selectedTopicGroups.length > 0) ||
          (Array.isArray(payload?.intentContext?.selectedTopicIds) &&
            payload.intentContext.selectedTopicIds.length > 0);
        this.logSearchFlowDebugInfo("[Unified] Raw query", {
          freetextQuery,
          selectedTopicIds: payload?.intentContext?.selectedTopicIds || [],
          selectedLimitIds: payload?.intentContext?.selectedLimitIds || [],
        });
        const hasOverrides = this.hasExecutableQueryOverrides();
        if (!freetextQuery && !hasTopics && !hasOverrides) {
          console.info("[SearchFlow] Unified engine: query is empty. Search aborted.");
          this.stopSearchProcessTiming();
          this.searchLoading = false;
          return;
        }
        this.reloadScripts();
        // Placeholder until resolvedQueries arrive. Show the same freetext in
        // every selected database field, with a spinner like PubMed-only live translation.
        this.finalValidatedQuery =
          freetextQuery ||
          String(this.getQueryOverridesForSearch().pubmed || "").trim() ||
          String(this.searchIntent || "").trim();
        this.seedPendingSourceSearchStringDisplays(this.finalValidatedQuery);
        await this.runSearchFlowDebugSection("Unified engine search", async () => {
          const response = await this.callUnifiedSearchEndpointStreaming(
            payload,
            this.createUnifiedSearchProgressHandler(isCancelled)
          );
          if (isCancelled()) return;
          this.count = Number(response.total || 0);
          this.searchresult = this.mapUnifiedSearchResponseResults(response.results);
          const resolvedPubmed = String(response?.resolvedQueries?.pubmedQuery || "").trim();
          const resolvedHardFilter = String(response?.resolvedQueries?.hardFilterQuery || "").trim();
          this.finalValidatedQuery =
            this.combineResolvedPubmedDisplay(resolvedPubmed, resolvedHardFilter) ||
            this.finalValidatedQuery;
          this.populateUnifiedSearchProcessStepDetails(
            response,
            freetextQuery || resolvedPubmed || String(this.searchIntent || "").trim()
          );
          this.captureSessionFreetextQueries(response?.resolvedQueries, freetextQuery);
          // Parity with the local pipeline's per-source degraded-status badges
          // (recordDegradedSearchStatus()): the API response's free-text
          // warnings (e.g. one source failing while others still returned
          // results) don't map to a translation messageKey the way the local
          // pipeline's own per-source status codes do, but
          // visibleDegradedSearchSummary only ever renders entry.message
          // directly, so pre-resolved synthetic entries render correctly too.
          if (Array.isArray(response.warnings) && response.warnings.length > 0) {
            this.degradedSearchSummary = response.warnings
              .map((message) => String(message || "").trim())
              .filter(Boolean)
              .map((message) => ({
                source: "unified",
                status: response.partial === true ? "partial" : "warning",
                messageKey: "",
                message,
              }));
          }
          // Parity with the local pipeline's "08 Final result composition":
          // merge in any articles preselected via the widget's own '?selected=...'
          // URL/prop mechanism (searchByIds()). Counts attach to the last real
          // display step (not a separate "ready for display" step).
          const compositionStepId = this.getFinalizeCompositionStepId();
          const preSelectedEntries = await this.searchPreselectedPmidai();
          if (isCancelled()) return;
          this.mergeSearchProcessStepDetail(compositionStepId, {
            preselectedCount: Array.isArray(preSelectedEntries) ? preSelectedEntries.length : 0,
            selectedCount: Array.isArray(this.selectedEntries) ? this.selectedEntries.length : 0,
          });
          if (preSelectedEntries && preSelectedEntries.length > 0) {
            const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
            this.searchresult = [...this.searchresult, ...uniquePreselected];
          }
          this.setSemanticLoadingProcessStepStatus(compositionStepId, "completed");
        });
        if (isCancelled()) return;
        this.stopSearchProcessTiming();
        this.searchLoading = false;
        this.clearSearchLoadingStatus();
        this.$nextTick(() => {
          if (isCancelled()) return;
          const searchButton = this.$el?.querySelector(".mugin_search");
          if (searchButton) searchButton.focus();
          const topOfSearch = document.getElementById("mugin_topofsearch");
          if (topOfSearch) {
            topOfSearch.scrollIntoView({ block: "start", behavior: "smooth" });
          }
        });
      },
      async runUnifiedEngineSearchMore(isCancelled) {
        const haveCount = Array.isArray(this.searchresult) ? this.searchresult.length : 0;
        const totalCount = Number(this.count);
        const targetResultLength = Math.min(
          (this.page + 1) * this.pageSize,
          Number.isFinite(totalCount) && totalCount > 0 ? totalCount : (this.page + 1) * this.pageSize
        );
        if (haveCount >= targetResultLength) {
          return;
        }
        // Only fetch/hydrate the missing slice (e.g. 10→50 fetches offset 10,
        // size 40) so changing page size does not re-run the full search or
        // re-hydrate results already shown.
        const fetchCount = Math.max(1, targetResultLength - haveCount);
        const payload = this.buildUnifiedSearchRequestPayload(
          Math.floor(haveCount / Math.max(1, this.pageSize)) + 1,
          "committed"
        );
        payload.page = {
          number: Math.max(1, Number(payload?.page?.number) || 1),
          size: fetchCount,
          offset: haveCount,
        };
        const response = await this.callUnifiedSearchEndpoint(payload);
        if (isCancelled()) return;
        this.count = Number(response.total || this.count || 0);
        const newResults = this.mapUnifiedSearchResponseResults(response.results);
        const existingUids = new Set(
          (Array.isArray(this.searchresult) ? this.searchresult : []).map((item) => item?.uid)
        );
        const uniqueNewResults = newResults.filter((item) => item?.uid && !existingUids.has(item.uid));
        this.searchresult = [...(Array.isArray(this.searchresult) ? this.searchresult : []), ...uniqueNewResults];
        // Parity with the local pipeline's searchMore(), which re-checks
        // preselected '?selected=...' articles on every page too (mergeUniqueEntries
        // is a no-op once they're already present from page 1).
        const preSelectedEntries = await this.searchPreselectedPmidai();
        if (isCancelled()) return;
        if (preSelectedEntries && preSelectedEntries.length > 0) {
          const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
          this.searchresult = [...this.searchresult, ...uniquePreselected];
        }
        if (!this.compactLoadingUi) {
          this.stopSearchProcessTiming();
          this.searchLoading = false;
          this.clearSearchLoadingStatus();
        }
      },
      // Runtime config still controls source availability, API credentials and
      // presentation settings. Engine selection itself is intentionally fixed
      // to the shared PHP orchestrator (see isUnifiedEngineActive).
      async ensureRuntimeConfigLoadedBeforeSearch() {
        try {
          await loadThemeOverridesFromBackend(this.currentDomain, this.appSettings?.nlm?.proxyUrl);
        } catch (_error) {
          /* fail open: proceed with whatever runtimeConfig currently holds */
        }
      },
      /**
       * Initiates a search via the shared PHP unified orchestrator.
       */
      async search() {
        this.searchLoading = true;
        this.earlyIntentPreview = null;
        this.searchError = null;
        this.loadingProcessSteps = [];
        this.degradedSearchSummary = [];
        this.searchProcessPubMedRequest = null;
        this.searchProcessStepDetailPayloads = {};
        this.searchProcessStepDetailLabels = {};
        this.pubMedSummaryCache = {};
        this.searchPaginationSignature = "";
        this.semanticSortedResultCache = [];
        this.semanticSortedResultCacheKey = "";
        this.startSearchProcessTiming();
        this.updateSearchLoadingStatus();
        // Snapshot the current search generation so later continuations can
        // detect that the user cancelled this run (via editForm) and avoid
        // overwriting the reset state.
        const mySearchGeneration = this.searchGeneration;
        const isCancelled = () => this.searchGeneration !== mySearchGeneration;
        this.flushSourceSearchStringDraftsFromDom();
        this.pendingQueryOverrideSnapshot = this.getQueryOverridesForSearch();
        if (this.isSearchFlowDebugEnabled) {
          console.group("[SearchFlow] search()");
        }
        this.startSearchFlowDebugRun("search");

        try {
          await this.ensureRuntimeConfigLoadedBeforeSearch();
          if (isCancelled()) return;
          // Engine selection is fixed to the shared PHP orchestrator
          // (see isUnifiedEngineActive); there is no local JS fallback path.
          await this.runUnifiedEngineSearch(isCancelled);
          if (isCancelled()) return;
          if (!this.searchError) {
            this.committedQueryOverrides = { ...(this.pendingQueryOverrideSnapshot || {}) };
            this.bindQueryOverrideFreetextKey();
            if (Object.keys(this.committedQueryOverrides).length > 0) {
              this.setUrl();
            }
          }
        } catch (error) {
          if (isCancelled()) return;
          this.showSearchError(error);
          this.logSearchFlowDebugWarn("Search failed", {
            error: String(error || ""),
          });
          this.stopSearchProcessTiming();
          this.searchLoading = false;
          this.clearSearchLoadingStatus();
        } finally {
          this.pendingQueryOverrideSnapshot = null;
          this.finishSearchFlowDebugRun(this.searchError ? "error" : "completed", {
            resultCount: Array.isArray(this.searchresult) ? this.searchresult.length : 0,
            totalCount: Number(this.count || 0),
          });
          if (this.isSearchFlowDebugEnabled) {
            console.groupEnd();
          }
        }
      },
      /**
       * Fetches additional search results via the shared PHP unified orchestrator.
       */
      async searchMore() {
        // Calculate the target number of results based on the next page
        const targetResultLength = Math.min((this.page + 1) * this.pageSize, this.count);

        // If current results already meet or exceed the target, no need to fetch more
        if (this.searchresult && this.searchresult.length >= targetResultLength) {
          return;
        }

        // Set loading state and reset any existing errors
        if (!this.compactLoadingUi) {
          this.searchLoading = true;
          this.searchError = null;
          this.loadingProcessSteps = [];
          this.startSearchProcessTiming();
          this.updateSearchLoadingStatus();
        } else {
          this.searchError = null;
        }
        if (this.isSearchFlowDebugEnabled) {
          console.group("[SearchFlow] searchMore()");
        }
        this.startSearchFlowDebugRun("searchMore");

        try {
          await this.ensureRuntimeConfigLoadedBeforeSearch();
          const mySearchMoreGeneration = this.searchGeneration;
          const isCancelledForUnifiedMore = () => this.searchGeneration !== mySearchMoreGeneration;
          // Engine selection is fixed to the shared PHP orchestrator
          // (see isUnifiedEngineActive); there is no local JS fallback path.
          await this.runUnifiedEngineSearchMore(isCancelledForUnifiedMore);
        } catch (error) {
          // Handle and log any errors that occur during the API requests
          console.error(error);
          this.showSearchError(error);
          this.logSearchFlowDebugWarn("Pagination failed", {
            error: String(error || ""),
          });
          if (!this.compactLoadingUi) {
            this.stopSearchProcessTiming();
            this.searchLoading = false;
            this.clearSearchLoadingStatus();
          }
        } finally {
          this.finishSearchFlowDebugRun(this.searchError ? "error" : "completed", {
            resultCount: Array.isArray(this.searchresult) ? this.searchresult.length : 0,
            totalCount: Number(this.count || 0),
          });
          if (this.isSearchFlowDebugEnabled) {
            console.groupEnd();
          }
        }
      },
      /**
       * Loads preselected articles by PMID and/or DOI.
       *
       * @async
       * @param {string[]} ids - Typed tokens (`pmid:…`, `doi:…`) or bare PMIDs.
       * @returns {Promise<Object[]>}
       */
      async searchByIds(ids) {
        const parsed = [];
        const seen = new Set();
        (Array.isArray(ids) ? ids : []).forEach((id) => {
          const entry = parseSelectedIdentifierToken(id);
          if (!entry) return;
          const key = `${entry.type}:${entry.type === "doi" ? entry.value.toLowerCase() : entry.value}`;
          if (seen.has(key)) return;
          seen.add(key);
          parsed.push(entry);
        });
        if (parsed.length === 0) {
          return [];
        }

        const nlm = this.appSettings.nlm;
        const pmids = parsed.filter((entry) => entry.type === "pmid").map((entry) => entry.value);
        const dois = parsed.filter((entry) => entry.type === "doi").map((entry) => entry.value);
        const [pmidResults, openAlexResults] = await Promise.all([
          pmids.length > 0 ? this.fetchSummaryRecordsByIds(pmids, nlm) : Promise.resolve([]),
          dois.length > 0
            ? this.fetchOpenAlexWorksByCandidates(
                dois.map((doi) => ({ doi })),
                nlm
              )
            : Promise.resolve([]),
        ]);
        const doiResults = Array.isArray(openAlexResults) ? [...openAlexResults] : [];
        const missingDoiIndexes = dois
          .map((doi, index) => (doiResults[index] ? -1 : index))
          .filter((index) => index >= 0);
        if (missingDoiIndexes.length > 0) {
          const fallbackResults = await this.fetchPubMedRecordsByDois(
            missingDoiIndexes.map((index) => dois[index]),
            nlm
          );
          missingDoiIndexes.forEach((doiIndex, fallbackIndex) => {
            if (fallbackResults[fallbackIndex]) {
              doiResults[doiIndex] = fallbackResults[fallbackIndex];
            }
          });
        }

        const pmidMap = new Map(
          pmidResults.map((result) => [String(result?.uid || result?.pmid || "").trim(), result])
        );
        const doiMap = new Map();
        dois.forEach((doi, index) => {
          const mapped = doiResults[index];
          if (mapped) {
            doiMap.set(doi.toLowerCase(), mapped);
          }
        });

        return parsed
          .map((entry) =>
            entry.type === "pmid"
              ? pmidMap.get(entry.value)
              : doiMap.get(entry.value.toLowerCase())
          )
          .filter(Boolean);
      },
      async fetchPubMedRecordsByDois(dois, nlm) {
        const requested = (Array.isArray(dois) ? dois : []).map((doi) => normalizeDoiValue(doi));
        const results = new Array(requested.length).fill(null);
        await Promise.all(
          requested.map(async (doi, index) => {
            if (!isPlausibleDoiValue(doi)) return;
            try {
              const response = await axios.post(
                this.getBackendApiUrl("NlmSearch.php"),
                new URLSearchParams(
                  this.buildPubMedSearchRequest({
                    term: `"${doi.replace(/"/g, "")}"[doi]`,
                    retmax: 1,
                    retstart: 0,
                  })
                )
              );
              const pmid = String(response?.data?.esearchresult?.idlist?.[0] || "").trim();
              if (!/^[0-9]+$/.test(pmid)) return;
              const [record] = await this.fetchSummaryRecordsByIds([pmid], nlm);
              if (record) {
                results[index] = record;
              }
            } catch (error) {
              console.warn("[Selected] PubMed DOI fallback failed.", {
                doi,
                error: String(error?.message || error),
              });
            }
          })
        );
        return results;
      },
      /**
       * Searches for preselected articles from the `selected` (or legacy `pmid`) URL parameter.
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
      canApplyLocalSemanticSort() {
        return (
          this.hasSelectedSemanticSources() &&
          Array.isArray(this.matchedRerankedResultRefs) &&
          this.matchedRerankedResultRefs.length > 0
        );
      },
      async applyLocalSemanticSort() {
        if (!this.canApplyLocalSemanticSort()) {
          return false;
        }
        // Re-sorting operates on the full validated ref set, so make sure any deferred
        // background validation has been started and completed first (otherwise deferred
        // keepers/total count would be missing from the re-sorted view).
        this.flushPendingSemanticBackgroundValidation();
        if (this.semanticBackgroundValidationPromise) {
          await this.semanticBackgroundValidationPromise;
        }
        return this.runWithCompactLoading("sortResultsLoadingText", true, async () => {
          const { nlm } = this.appSettings;
          const resultRefs = this.matchedRerankedResultRefs;
          let data = [];
          if (this.shouldUseSemanticDateOrdering(resultRefs)) {
            const sortedData = await this.getSemanticSortedHydratedResults(resultRefs, nlm);
            this.count = sortedData.length;
            data = sortedData.slice(0, this.pageSize);
          } else {
            const visibleRefs = resultRefs.slice(0, this.pageSize);
            const pmidRefs = visibleRefs.filter((entry) => entry.type === "pmid");
            const doiRefs = visibleRefs.filter(
              (entry) => entry.type === "doi" || entry.type === "openalex"
            );
            const [pmidData, doiData] = await Promise.all([
              this.fetchSummaryRecordsByIds(
                pmidRefs.map((entry) => entry.pmid),
                nlm
              ),
              this.fetchOpenAlexWorksByCandidates(doiRefs, nlm),
            ]);
            const pmidMap = new Map(pmidData.map((entry) => [String(entry.uid), entry]));
            const doiMap = new Map();
            doiRefs.forEach((entry, index) => {
              const mapped = doiData[index] || this.buildSemanticScholarFallbackRecordByRef(entry);
              if (mapped) {
                doiMap.set(entry.key, mapped);
              }
            });
            data = visibleRefs
              .map((entry) =>
                entry.type === "pmid" ? pmidMap.get(String(entry.pmid)) : doiMap.get(entry.key)
              )
              .filter(Boolean);
            this.count = resultRefs.length;
            this.logHybridRenderSummary("Hybrid local sort hydration summary.", visibleRefs, data);
          }
          data = await this.maybeApplySemanticLlmFinalRerank(data);

          this.searchresult = data;
          const preSelectedEntries = await this.searchPreselectedPmidai();
          if (preSelectedEntries && preSelectedEntries.length > 0) {
            const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
            this.searchresult = [...this.searchresult, ...uniquePreselected];
          }

          console.info("[SearchFlow] Applied local semantic sort without rerunning semantic source search.", {
            sort: this.sort.method,
            page: this.page,
            pageSize: this.pageSize,
            semanticDateOrdering: this.shouldUseSemanticDateOrdering(resultRefs),
            visibleRefs: Array.isArray(data)
              ? data.map((entry) => {
                  const pmid = String(entry?.pmid || entry?.uid || "").trim();
                  if (/^[0-9]+$/.test(pmid)) return pmid;
                  const doi = normalizeDoiValue(entry?.doi || "");
                  if (doi) return doi;
                  return String(entry?.id || entry?.uid || "").trim();
                })
              : [],
          });
          return true;
        });
      },
      async setPageSize(pageSize) {
        const nextPageSize = Math.max(1, Number(pageSize) || this.pageSize || 25);
        this.pageSize = nextPageSize;
        this.page = 0;
        this.setUrl();
        // Changing page size must not restart the full search process UI.
        // Reuse already buffered hits when possible; otherwise fetch only the
        // missing slice via the same compact path as "Indlæs de næste".
        const neededCount = Math.min(
          nextPageSize,
          Number.isFinite(Number(this.count)) && Number(this.count) > 0
            ? Number(this.count)
            : nextPageSize
        );
        if (Array.isArray(this.searchresult) && this.searchresult.length >= neededCount) {
          return;
        }
        await this.runWithCompactLoading("loadMoreResultsLoadingText", false, async () => {
          await this.searchMore();
        });
      },
      async nextPage() {
        this.page++;
        this.setUrl();
        await this.runWithCompactLoading("loadMoreResultsLoadingText", false, async () => {
          await this.searchMore();
        });
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
        if (await this.applyLocalSemanticSort()) {
          return;
        }
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
        const name = typeof option.name === "string" ? option.name : "";
        if (name) return name;
        if (typeof option.id === "string" && option.id.startsWith("__custom__")) {
          return "";
        }
        return option.id;
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
        this.preselectedPmidai = normalizeSelectedIdentifierList(
          (newValue ?? []).map((entry) => formatSelectedIdentifierFromResult(entry))
        );

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
        return this.limitDropdownPlaceholders[index] ?? this.getDefaultFilterPlaceholder(index);
      },
      getDefaultFilterPlaceholder(index = -1) {
        if (index >= 0 && this.isDatabaseLimitDropdown(index)) {
          return this.hasAllAvailableDatabasesSelected(index) ? "" : this.getString("chooseDatabase");
        }
        const isMobileOrSmall = isMobileViewport() || window.innerWidth < 520;
        return this.getString(isMobileOrSmall ? "choselimits_mobile" : "choselimits");
      },
      shouldSuppressDropdownProgressPlaceholder() {
        return this.searchWithAI && this.activeTranslationSourcesCount > 1 && !this.searchLoading;
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
          if (this.searchLoading) {
            this.updateSearchLoadingStatus(stepKey, true);
            return;
          }
          if (this.shouldSuppressDropdownProgressPlaceholder()) {
            this.clearFilterPlaceholderDotInterval();
            this.limitDropdownPlaceholders[index] = this.getDefaultFilterPlaceholder(index);
            return;
          }
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
          if (this.searchLoading && stepKey) {
            this.updateSearchLoadingStatus(stepKey, false);
          }
          this.clearFilterPlaceholderDotInterval();
          this.limitDropdownPlaceholders[index] = this.getDefaultFilterPlaceholder(index);
        }
      },
      updatePlaceholder(isTranslating, index, stepKey) {
        if (isTranslating) {
          if (this.searchLoading) {
            this.updateSearchLoadingStatus(stepKey, true);
            return;
          }
          if (this.shouldSuppressDropdownProgressPlaceholder()) {
            this.clearPlaceholderDotInterval();
            this.dropdownPlaceholders[index] = this.getDropdownPlaceholder(index, false);
            return;
          }
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
          if (this.searchLoading && stepKey) {
            this.updateSearchLoadingStatus(stepKey, false);
          }
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
