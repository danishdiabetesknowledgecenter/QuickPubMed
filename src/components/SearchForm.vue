<template>
  <div :lang="language === 'en' ? 'en' : 'da'">
    <div :id="getComponentId" :class="{ qpm_formCollapsed: isCollapsed }">
      <form class="qpm_searchform" role="search" @submit.prevent>
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

        <div class="qpm_top">
          <!-- Show or hide the search form -->
          <search-form-toggle
            :is-collapsed="isCollapsed"
            :topics="topics"
            :show-toggle-icon="hasVisibleSearchResults"
            :get-string="getString"
            :panel-id="getSearchPanelId"
            @toggle-collapsed="toggleCollapsedController"
          />

          <div v-show="!isCollapsed && isAiFeatureEnabled" class="qpm_translationSourcesPanel">
            <div class="qpm_translationSourcesPrimary">
              <ai-translation-toggle
                v-model="searchWithAI"
                :is-collapsed="false"
                :display-mode="'switch'"
                :show-off-state-label="false"
                :get-string="getString"
              />
            </div>

          </div>

          <div v-show="isCollapsed" class="qpm_collapsedSpacerPadding"></div>

          <div :id="getSearchPanelId" v-show="!isCollapsed" class="qpm_searchformoptions">
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
                :semantic-worded-intent-context="semanticWordedIntentContext"
                :get-string="getString"
                :get-limit-placeholder="getLimitPlaceholder"
                @update-limit-dropdown="updateLimitDropdown"
                @update-limit-scope="updateLimitDropdownScope"
                @update-limit-placeholder="updateLimitPlaceholder"
                @add-limit-dropdown="addLimitDropdown"
                @remove-limit-dropdown="removeLimitDropdown"
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
                :help-text-delay="300"
                :get-string="getString"
                :get-custom-name-label="getCustomNameLabel"
                :get-simple-tooltip="getSimpleTooltip"
                :get-semantic-option-tooltip-content="getSemanticOptionTooltipContent"
                :get-semantic-option-disabled-state="isSemanticOptionDisabled"
                @update-limit="updateLimitSimple"
                @update-limit-enter="updateLimitSimpleOnEnter"
                @update-semantic-source="updateTranslationSourceSelection"
              />
            </div>
          </div>
        </div>

        <div id="qpm_topofsearch" class="qpm_flex">
          <!-- The search query written out as human readable text-->
          <worded-search-string
            :topics="topics"
            :limits="limitData"
            :available-limits="limitsContent"
            :limit-dropdowns="wordedSearchLimitDropdowns"
            :searchstring="displaySearchString"
            :is-collapsed="isCollapsed"
            :details="details"
            :advanced-string="advancedString"
            :advanced-search="advanced"
            :show-header="!isCollapsed"
            :language="language"
            @toggle-details-box="toggleDetailsBox"
            @toggle-advanced-string="toggleAdvancedString"
          />
        </div>

        <div v-show="hasTopics && !isCollapsed">
          <!-- Buttons for reset, copy url and search -->
          <action-buttons
            :search-loading="isSearchActionDisabled"
            :get-string="getString"
            @clear="clear"
            @copy-url="copyUrl"
            @searchset-low-start="searchsetLowStart"
          />
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
        :search-intent="searchIntent"
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
    config as runtimeConfig,
    ELICIT_UNLOCK_CHANGED_EVENT,
  } from "@/config/config.js";
  import { scopeIds, customInputTagTooltip } from "@/utils/contentHelpers.js";
  import { loadLimitsFromRuntime, loadStandardString } from "@/utils/contentLoader";
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
    mapOpenAlexWorkToResultDto,
    mapPubMedSummaryToResultDto,
    normalizeDoiValue,
  } from "@/utils/resultAdapters";
  import {
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
    buildActiveSemanticDoiOnlyRuleState,
  } from "@/utils/semanticRuleSchema";

  const OPENALEX_CACHE_TTL_MS = 30 * 60 * 1000;
  const OPENALEX_LOOKUP_CONCURRENCY = 3;
  const DEFAULT_SEMANTIC_LLM_RERANK_CONFIG = {
    enabled: false,
    model: "gpt-5.4-nano",
    topN: 10,
    maxOutputTokens: 400,
  };

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
        qpmSearchFlowDebugApi: {
          isEnabled: () => this.isSearchFlowDebugEnabled,
          isRunActive: () => !!this.searchFlowDebugRun,
          getConsolePrefix: () => this.getSearchFlowDebugConsolePrefix(),
          beginStep: (title) => this.beginSearchFlowDebugStep(title),
          endStep: (step, status = "ok", meta = {}) =>
            this.endSearchFlowDebugStep(step, status, meta),
          logEntry: (level, label, payload = undefined) =>
            this.recordSearchFlowDebugEntry(level, label, payload),
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
      standardStringAdd: {
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
      debugSearchFlow: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      const debugSearchFlowFromUrl = getSearchFlowDebugFlagFromLocation();
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
        globalSemanticSearchInput: "",
        globalSemanticSearchState: null,
        semanticMetadataByDoiCache: null,
        searchError: null,
        searchString: "",
        finalValidatedQuery: "",
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
        compactLoadingUi: false,
        compactLoadingHideResults: false,
        elicitRateLimitInfo: null,
        openAlexRateLimitInfo: null,
        semanticScholarRateLimitInfo: null,
        semanticDoiValidationActive: false,
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
      isAiFeatureEnabled() {
        return !!runtimeConfig.useAI;
      },
      hasExplicitAvailableTranslationSources() {
        return Array.isArray(this.translationSources);
      },
      isSearchFlowDebugEnabled() {
        return this.searchFlowDebugEnabled === true;
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
        // the caller is not unlocked via QPM_ELICIT_UNLOCK. Strip 'elicit' from the
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
        return this.limitDropdowns.some((dropdown) => dropdown.length > 0);
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
      displaySearchString() {
        return String(this.finalValidatedQuery || this.getSearchString || "").trim();
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
      isAiFeatureEnabled(newValue) {
        if (!newValue) {
          this.setSelectedTranslationSources([], false);
          return;
        }
        if (!this.translationSourcesUserTouched) {
          this.applyConfiguredTranslationSources(true);
        }
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
      if (this._semanticSourceRateLimitListener) {
        window.removeEventListener(
          "qpm:semantic-source-rate-limit-update",
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
      this.parseUrl();
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
          "qpm:semantic-source-rate-limit-update",
          this._semanticSourceRateLimitListener
        );
      }
      this.restoreStoredSourceRateLimitInfo("elicit");
      this.restoreStoredSourceRateLimitInfo("openAlex");
      this.restoreStoredSourceRateLimitInfo("semanticScholar");
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
      if (this.hasTopics) {
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
        const allWrappers = document.querySelectorAll(".qpm-searchform, .searchform");
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
        if (!this.hasTopics) return false;
        if (!this.searchWithAI) return false;
        if (this.shouldBlockAutoSearchFromUrlTranslationSources()) return false;
        const selected = Array.isArray(this.selectedTranslationSources)
          ? this.selectedTranslationSources
          : [];
        const onlyPubmed =
          selected.length === 1 &&
          String(selected[0] || "").trim() === "pubmed";
        return onlyPubmed;
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
        const configuredSources = this.sortTranslationSourcesList(this.getConfiguredTranslationSources());
        if (this.translationSourcesListsEqual(selectedSources, configuredSources)) {
          return null;
        }
        return selectedSources.map((sourceKey) => String(sourceKey || "").toLowerCase()).join(";;");
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
        this.globalSemanticSearchState = null;
      },
      hasSelectedSemanticSources() {
        return (
          this.searchWithSemanticScholar ||
          this.searchWithOpenAlex ||
          this.searchWithElicit
        );
      },
      shouldShowPubMedRelatedSemanticProcessSteps() {
        return this.selectedTranslationSources.includes("pubmed");
      },
      hasDeferredSemanticTags() {
        return this.getAllSelectedSearchItems().some(
          (item) => item?.semanticFlowType === "deferred" && item?.isPendingSemanticSearch === true
        );
      },
      getGlobalSemanticIntentInput() {
        if (!this.searchWithAI) {
          return String(this.searchIntent || "").trim();
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
      buildPubMedBaseQuery() {
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
              return hasLogicalOperators(scopedSearchValues[0]) && items.length > 1
                ? `(${combined})`
                : combined;
            })
            .join(connector);
        };
        const substrings = [];

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
            substrings.push(substring);
          }
        });

        if (this.advanced) {
          this.limitDropdowns.forEach((dropdownItems) => {
            const nonSemanticItems = dropdownItems.filter((item) => !shouldExcludeFromBaseQuery(item));
            if (nonSemanticItems.length === 0) return;

            const hasOperators = nonSemanticItems.some(
              (item) =>
                item.searchStrings &&
                item.scope &&
                resolvePubMedSearchValues(item)[0] &&
                hasLogicalOperators(resolvePubMedSearchValues(item)[0])
            );

            let substring = " AND ";
            if (hasOperators || nonSemanticItems.length > 1) substring += "(";
            substring += buildSubstring(nonSemanticItems, " OR ", false);
            if (hasOperators || nonSemanticItems.length > 1) substring += ")";

            if (substring !== " AND ()" && substring !== " AND ") {
              substrings.push(substring);
            }
          });
        } else {
          Object.keys(this.limitData).forEach((key) => {
            const filterGroup = this.limitData[key];
            const nonSemanticItems = filterGroup.filter((item) => !shouldExcludeFromBaseQuery(item));
            if (nonSemanticItems.length === 0) return;
            const hasOperators = nonSemanticItems.some(
              (item) =>
                item.searchStrings &&
                item.scope &&
                resolvePubMedSearchValues(item)[0] &&
                hasLogicalOperators(resolvePubMedSearchValues(item)[0])
            );

            let substring = " AND ";
            if (hasOperators || nonSemanticItems.length > 1) substring += "(";
            substring += buildSubstring(nonSemanticItems, " OR ", false);
            if (hasOperators || nonSemanticItems.length > 1) substring += ")";

            if (substring !== " AND ()" && substring !== " AND ") {
              substrings.push(substring);
            }
          });
        }

        return substrings.join("").replace(/^\s*AND\s+/, "").trim();
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
        if (!this.hasSelectedPredefinedTopicForPubMedSource()) {
          return "";
        }
        return this.buildPubMedBaseQuery();
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
        switch (String(sourceKey || "").trim()) {
          case "elicit":
            return "qpmElicitRateLimitInfo";
          case "openAlex":
            return "qpmOpenAlexRateLimitInfo";
          case "semanticScholar":
            return "qpmSemanticScholarRateLimitInfo";
          default:
            return "";
        }
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
        switch (String(sourceKey || "").trim()) {
          case "elicit":
            return "Elicit";
          case "openAlex":
            return "OpenAlex";
          case "semanticScholar":
            return "Semantic Scholar";
          default:
            return "API";
        }
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
        if (!value || typeof value !== "object") {
          return null;
        }
        const limitValue = value.limit;
        const limit = limitValue === null || limitValue === undefined ? null : Number(limitValue);
        const remainingValue = value.remaining;
        const remaining = remainingValue === null || remainingValue === undefined
          ? null
          : Number(remainingValue);
        const resetAt = String(value.resetAt || "").trim();
        const resetInSecondsValue = value.resetInSeconds;
        const resetInSeconds = resetInSecondsValue === null || resetInSecondsValue === undefined
          ? null
          : Number(resetInSecondsValue);
        const status = Number(value.status);
        const normalizedLimit = Number.isFinite(limit) && limit > 0
          ? Math.max(1, Math.floor(limit))
          : null;
        const normalizedRemaining = Number.isFinite(remaining)
          ? Math.max(0, Math.floor(remaining))
          : null;
        const normalizedResetInSeconds = Number.isFinite(resetInSeconds)
          ? Math.max(0, Math.floor(resetInSeconds))
          : null;
        const normalizedStatus = Number.isFinite(status) ? Math.floor(status) : 0;
        if (
          normalizedLimit === null &&
          normalizedRemaining === null &&
          resetAt === "" &&
          normalizedResetInSeconds === null &&
          normalizedStatus <= 0
        ) {
          return null;
        }
        return {
          limit: normalizedLimit,
          remaining: normalizedRemaining,
          resetAt,
          resetInSeconds: normalizedResetInSeconds,
          status: normalizedStatus,
          isLimited: value.isLimited === true || (Number.isFinite(remaining) && remaining <= 0),
        };
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
      getSourceResetDate(resetAt, resetInSeconds = null) {
        const resetTimestamp = Date.parse(String(resetAt || "").trim());
        if (Number.isFinite(resetTimestamp)) {
          return new Date(resetTimestamp);
        }
        const fallbackSeconds = Number(resetInSeconds);
        if (Number.isFinite(fallbackSeconds)) {
          return new Date(Date.now() + Math.max(0, Math.floor(fallbackSeconds)) * 1000);
        }
        return null;
      },
      getElicitResetDate(resetAt, resetInSeconds = null) {
        return this.getSourceResetDate(resetAt, resetInSeconds);
      },
      formatSourceResetCountdown(resetAt, resetInSeconds = null) {
        const resetDate = this.getSourceResetDate(resetAt, resetInSeconds);
        const diffSeconds = resetDate
          ? Math.max(0, Math.round((resetDate.getTime() - Date.now()) / 1000))
          : null;
        if (diffSeconds === null) {
          return "";
        }
        if (diffSeconds <= 0) {
          return this.language === "en" ? "less than 1 minute" : "mindre end 1 minut";
        }
        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const parts = [];
        if (days > 0) {
          parts.push(this.language === "en" ? `${days} day${days === 1 ? "" : "s"}` : `${days} dag${days === 1 ? "" : "e"}`);
        }
        if (hours > 0) {
          parts.push(this.language === "en" ? `${hours} hour${hours === 1 ? "" : "s"}` : `${hours} time${hours === 1 ? "" : "r"}`);
        }
        if (minutes > 0) {
          parts.push(this.language === "en" ? `${minutes} minute${minutes === 1 ? "" : "s"}` : `${minutes} minut${minutes === 1 ? "" : "ter"}`);
        }
        return parts.slice(0, 2).join(", ");
      },
      formatElicitResetCountdown(resetAt, resetInSeconds = null) {
        return this.formatSourceResetCountdown(resetAt, resetInSeconds);
      },
      formatSourceResetClockTime(resetAt, resetInSeconds = null) {
        const resetDate = this.getSourceResetDate(resetAt, resetInSeconds);
        if (!resetDate) {
          return "";
        }
        const locale = this.language === "en" ? "en-US" : "da-DK";
        return new Intl.DateTimeFormat(locale, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(resetDate);
      },
      formatElicitResetClockTime(resetAt, resetInSeconds = null) {
        return this.formatSourceResetClockTime(resetAt, resetInSeconds);
      },
      isSemanticSourceUnavailable(sourceKey) {
        const info = this.getSourceRateLimitInfo(sourceKey);
        if (!info) {
          return false;
        }
        const resetDate = this.getSourceResetDate(info.resetAt, info.resetInSeconds);
        if (resetDate && resetDate.getTime() <= Date.now()) {
          return false;
        }
        if (Number.isFinite(info.remaining)) {
          return info.remaining <= 0;
        }
        return info.isLimited === true;
      },
      getSourceRateLimitTooltipSuffix(sourceKey) {
        const normalizedSourceKey = String(sourceKey || "").trim();
        if (
          !normalizedSourceKey ||
          !this.getSourceRateLimitStateProperty(normalizedSourceKey)
        ) {
          return "";
        }
        const sourceLabel = this.getSourceRateLimitLabel(normalizedSourceKey);
        const info = this.getSourceRateLimitInfo(normalizedSourceKey);
        if (!info) {
          if (normalizedSourceKey === "semanticScholar") {
            return this.language === "en"
              ? `<br><br><strong>${sourceLabel} API usage:</strong> Remaining requests are not exposed by the API. If ${sourceLabel} rate limits this widget, that status will be shown here.`
              : `<br><br><strong>${sourceLabel} API-forbrug:</strong> API'et eksponerer ikke det resterende antal kald. Hvis ${sourceLabel} rate limiter widgeten, vises den status her.`;
          }
          return this.language === "en"
            ? `<br><br><strong>${sourceLabel} API usage:</strong> Remaining requests are shown after ${sourceLabel} returns rate limit information.`
            : `<br><br><strong>${sourceLabel} API-forbrug:</strong> Resterende kald vises, når ${sourceLabel} har returneret rate limit-oplysninger.`;
        }
        const remainingText = Number.isFinite(info.remaining)
          ? this.language === "en"
            ? Number.isFinite(info.limit)
              ? `${info.remaining} of ${info.limit} requests remaining`
              : `${info.remaining} requests remaining`
            : Number.isFinite(info.limit)
              ? `${info.remaining} ud af ${info.limit} kald tilbage`
              : `${info.remaining} kald tilbage`
          : this.language === "en"
            ? Number.isFinite(info.limit)
              ? `remaining requests are currently unknown out of ${info.limit}`
              : "remaining requests are currently unknown"
            : Number.isFinite(info.limit)
              ? `det resterende antal kald er i øjeblikket ukendt ud af ${info.limit}`
              : "det resterende antal kald er i øjeblikket ukendt";
        const unknownUsageText = this.language === "en"
          ? `${sourceLabel} does not expose remaining request counts`
          : `${sourceLabel} eksponerer ikke det resterende antal kald`;
        const shouldShowNextSearchTime = this.isSemanticSourceUnavailable(normalizedSourceKey);
        const resetCountdown = shouldShowNextSearchTime
          ? this.formatSourceResetCountdown(info.resetAt, info.resetInSeconds)
          : "";
        const resetClockTime = shouldShowNextSearchTime
          ? this.formatSourceResetClockTime(info.resetAt, info.resetInSeconds)
          : "";
        const resetText = shouldShowNextSearchTime
          ? resetCountdown
            ? this.language === "en"
              ? `Next ${sourceLabel} search can be completed in ${resetCountdown}${resetClockTime ? ` (${resetClockTime})` : ""}.`
              : `Næste søgning i ${sourceLabel} kan gennemføres om ${resetCountdown}${resetClockTime ? ` (${resetClockTime})` : ""}.`
            : this.language === "en"
              ? `${sourceLabel} is temporarily unavailable.`
              : `${sourceLabel} er midlertidigt utilgængelig.`
          : "";
        const usageText =
          Number.isFinite(info.remaining) || Number.isFinite(info.limit)
            ? remainingText
            : unknownUsageText;
        return this.language === "en"
          ? `<br><br><strong>${sourceLabel} API usage:</strong> ${usageText}.${resetText ? `<br>${resetText}` : ""}`
          : `<br><br><strong>${sourceLabel} API-forbrug:</strong> ${usageText}.${resetText ? `<br>${resetText}` : ""}`;
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
      getSemanticLoadingProcessStepOrder() {
        return [
          "prepare",
          "searchString",
          "mesh",
          "optimize",
          "pubmed",
          "semanticScholar",
          "openAlex",
          "elicit",
          "finalizeCollect",
          "finalizeValidatePmid",
          "finalizeValidateDoiFetch",
          "finalizeValidateDoiSource",
          "finalizeValidateDoiRules",
          "finalizeHydrate",
          "finalizeSort",
          "finalizeRender",
          "finalizeSelected",
        ];
      },
      getVisibleSemanticLoadingProcessStep(stepId = "", translationKey = "") {
        const normalizedStepId = String(stepId || "").trim();
        const normalizedTranslationKey = String(translationKey || "").trim();
        if (
          !this.shouldShowPubMedRelatedSemanticProcessSteps() &&
          ["searchString", "mesh", "optimize", "finalizeValidatePmid"].includes(normalizedStepId)
        ) {
          return {
            stepId: "",
            translationKey: "",
          };
        }
        return {
          stepId: normalizedStepId,
          translationKey: normalizedTranslationKey,
        };
      },
      getSemanticLoadingProcessDefaultTranslationKey(stepId) {
        const keyMap = {
          prepare: "semanticSearchProgressPreparing",
          searchString: "semanticSearchProgressSearchString",
          mesh: "semanticSearchProgressMesh",
          optimize: "semanticSearchProgressOptimize",
          pubmed: "semanticSearchProgressPubMedBestMatch",
          semanticScholar: "semanticSearchProgressSemanticScholar",
          openAlex: "semanticSearchProgressOpenAlex",
          elicit: "semanticSearchProgressElicit",
          finalizeCollect: "semanticSearchProgressFinalizeCollect",
          finalizeValidatePmid: "semanticSearchProgressFinalizeValidatePmid",
          finalizeValidateDoiFetch: "semanticSearchProgressFinalizeValidateDoiFetch",
          finalizeValidateDoiSource: "semanticSearchProgressFinalizeValidateDoiSource",
          finalizeValidateDoiRules: "semanticSearchProgressFinalizeValidateDoiRules",
          finalizeHydrate: "semanticSearchProgressFinalizeHydrate",
          finalizeSort: "semanticSearchProgressFinalizeSort",
          finalizeSelected: "semanticSearchProgressFinalizeSelected",
          finalizeRender: "semanticSearchProgressFinalizeRender",
        };
        return keyMap[String(stepId || "").trim()] || "semanticSearchProgressFinalize";
      },
      getSemanticLoadingProcessStepId(stepKey = "") {
        const keyMap = {
          translatingStepSearchString: "searchString",
          translatingStepMesh: "mesh",
          translatingStepOptimize: "optimize",
          translatingStepPubMedBestMatch: "pubmed",
          translatingStepSemanticScholar: "semanticScholar",
          translatingStepOpenAlex: "openAlex",
          translatingStepElicit: "elicit",
        };
        return keyMap[String(stepKey || "").trim()] || "prepare";
      },
      getPlannedSemanticLoadingProcessStepIds() {
        const stepIds = ["prepare"];
        if (this.shouldShowPubMedRelatedSemanticProcessSteps()) {
          stepIds.push("searchString", "mesh", "optimize", "pubmed");
        }
        if (this.searchWithSemanticScholar) stepIds.push("semanticScholar");
        if (this.searchWithOpenAlex) stepIds.push("openAlex");
        if (this.searchWithElicit) stepIds.push("elicit");

        stepIds.push("finalizeCollect");

        if (this.shouldShowPubMedRelatedSemanticProcessSteps()) {
          stepIds.push("finalizeValidatePmid");
        }

        const hasPostValidationRules = this.getAllSelectedSearchItems().some((item) => {
          const rules = this.getItemSemanticPostValidationRules(item);
          return Array.isArray(rules) && rules.length > 0;
        });
        const hasPublicationDateFilters = this.getSemanticPublicationDateYears().length > 0;
        if (hasPostValidationRules || hasPublicationDateFilters) {
          stepIds.push("finalizeValidateDoiFetch", "finalizeValidateDoiRules");
        }

        stepIds.push("finalizeHydrate");

        if (this.sort?.method === "date_desc" || this.sort?.method === "date_asc") {
          stepIds.push("finalizeSort");
        }

        stepIds.push("finalizeRender", "finalizeSelected");
        return stepIds;
      },
      buildInitialSemanticLoadingProcessSteps() {
        const stepIds = this.getPlannedSemanticLoadingProcessStepIds();
        return stepIds.map((stepId, index) => ({
          id: stepId,
          label: this.getString(this.getSemanticLoadingProcessDefaultTranslationKey(stepId)),
          status: index === 0 ? "current" : "pending",
        }));
      },
      ensureSemanticLoadingProcessSteps() {
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
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
        const existingSteps = Array.isArray(this.loadingProcessSteps) ? this.loadingProcessSteps : [];
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
          label: this.getString(labelKey),
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
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
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
        nextSteps.forEach((step, index) => {
          if (index < activeIndex) {
            step.status = "completed";
          } else if (index === activeIndex) {
            step.status = "current";
            step.label = this.getString(activeLabelKey);
          } else if (step.status !== "completed") {
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
        this.searchLoadingStatusText = "";
        this.loadingProcessSteps = [];
        this.compactLoadingUi = false;
        this.compactLoadingHideResults = false;
        this.semanticDoiValidationActive = false;
        this.resetLoadingProcessPlaceholders();
      },
      startCompactLoading(textKey = "loadingText", hideResults = false) {
        this.searchLoading = true;
        this.searchError = null;
        this.compactLoadingUi = true;
        this.compactLoadingHideResults = hideResults;
        this.clearLoadingStatusDotInterval();
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
          translatingStepOptimize: "semanticSearchProgressOptimize",
          translatingStepSemanticScholar: "semanticSearchProgressSemanticScholar",
          translatingStepOpenAlex: "semanticSearchProgressOpenAlex",
          translatingStepElicit: "semanticSearchProgressElicit",
        };
        return keyMap[String(stepKey || "").trim()] || "semanticSearchProgressPreparing";
      },
      isConcurrentSemanticLoadingStep(stepId = "") {
        return ["semanticScholar", "openAlex", "elicit"].includes(String(stepId || "").trim());
      },
      activateConcurrentSemanticLoadingStep(stepId, translationKey = "") {
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
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
        nextSteps.forEach((step, index) => {
          if (step.id === normalizedStepId) {
            step.status = "current";
            step.label = this.getString(activeLabelKey);
            return;
          }
          if (this.isConcurrentSemanticLoadingStep(step.id)) {
            return;
          }
          if (index < activeIndex) {
            step.status = "completed";
          } else if (step.status !== "completed") {
            step.status = "pending";
          }
        });
        this.loadingProcessSteps = nextSteps;
      },
      completeConcurrentSemanticLoadingStep(stepId, translationKey = "") {
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
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
        targetStep.status = "completed";
        if (normalizedTranslationKey) {
          targetStep.label = this.getString(normalizedTranslationKey);
        }
        this.loadingProcessSteps = nextSteps;
      },
      updateSearchLoadingStatus(stepKey = "", isTranslating = true) {
        if (this.compactLoadingUi) {
          return;
        }
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
          this.clearSearchLoadingStatus();
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
        }
        this.clearLoadingStatusDotInterval();
        if (isTranslating) {
          this.searchLoadingStatusText = this.getString(translationKey);
        }
      },
      startAnimatedLoadingStatus(stepId, translationKey) {
        if (this.compactLoadingUi) {
          return;
        }
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
          return;
        }
        this.activateSemanticLoadingProcessStep(stepId, translationKey);
        this.clearLoadingStatusDotInterval();
        this.loadingStatusDotBaseText = this.getString(translationKey).replace(/\s*[.!?]+\s*$/, "");
        let dotCount = 0;
        const updateText = () => {
          if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
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
        if (!this.searchLoading || !this.hasSelectedSemanticSources()) {
          return;
        }
        this.clearLoadingStatusDotInterval();
        const normalizedStageKey = String(stageKey || "").trim();
        let translationKey = "semanticSearchProgressFinalize";
        let processStepId = "finalizeCollect";
        if (normalizedStageKey === "collect") {
          translationKey = "semanticSearchProgressFinalizeCollect";
          processStepId = "finalizeCollect";
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
        } else if (normalizedStageKey === "selected") {
          translationKey = "semanticSearchProgressFinalizeSelected";
          processStepId = "finalizeSelected";
        } else if (normalizedStageKey === "render") {
          translationKey = "semanticSearchProgressFinalizeRender";
          processStepId = "finalizeRender";
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
          item.semanticScholarPmids = [];
          item.semanticScholarDois = [];
          item.semanticScholarCandidates = [];
          item.semanticSourceResults = [];
          item.semanticScholarError = "";
          item.includeTranslatedTextInQuery = includePubmedBaseQuery;
          item.isPendingSemanticSearch = mode === "semantic";
        });
      },
      async prepareSemanticSearchStateBeforeSearch() {
        if (!this.hasSelectedSemanticSources()) {
          this.clearGlobalSemanticSearchState();
          return;
        }
        const dropdowns = this.getSemanticDropdownWrappers();
        if (dropdowns.length === 0) {
          this.clearGlobalSemanticSearchState();
          return;
        }
        this.isPreparingSemanticTagRefresh = true;
        try {
          await Promise.all(
            dropdowns.map((dropdown) => dropdown.preparePendingSemanticTags())
          );
        } finally {
          this.isPreparingSemanticTagRefresh = false;
        }
        if (this.hasDeferredSemanticTags()) {
          this.clearGlobalSemanticSearchState();
          this.semanticMetadataByDoiCache = null;
          return;
        }
        const intentInput = this.getGlobalSemanticIntentInput();
        if (!intentInput) {
          this.clearGlobalSemanticSearchState();
          this.semanticMetadataByDoiCache = null;
          return;
        }
        if (
          this.globalSemanticSearchState &&
          this.globalSemanticSearchInput === intentInput
        ) {
          console.info("[SemanticIntentFlow] Reusing global semantic state from dropdown selections.", {
            input: intentInput,
          });
          this.semanticMetadataByDoiCache = null;
          return;
        }
        const semanticRunner = dropdowns[0];
        const pubmedSourceQuery = this.getGlobalSemanticPubMedSourceQuery();
        if (
          semanticRunner &&
          typeof semanticRunner.buildResolvedSemanticTagState === "function"
        ) {
          const resolvedState = await semanticRunner.buildResolvedSemanticTagState(
            intentInput,
            null,
            {
              allowPubmedQueryGeneration: false,
              pubmedSourceQuery,
            }
          );
          this.globalSemanticSearchInput = intentInput;
          this.globalSemanticSearchState = this.buildGlobalSemanticSearchState(
            intentInput,
            resolvedState
          );
          console.info("[SemanticIntentFlow] Built global semantic state from dropdown selections.", {
            input: intentInput,
          });
        } else {
          this.clearGlobalSemanticSearchState();
        }
        this.semanticMetadataByDoiCache = null;
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
          return filtered;
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
            if (!this.isDatabaseLimitGroup(option)) {
              return option;
            }
            return {
              ...option,
              choices: this.augmentDatabaseChoicesWithLocked(option.choices),
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
          document.getElementById("qpm-searchform") ||
          document.querySelector('[id^="qpm-searchform-"]') ||
          document.getElementById("searchform");

        if (!appElement) {
          appElement = document.body;
        }

        if (!appElement) {
          console.error("initializeFocusVisible: Could not find any suitable element!");
          return;
        }

        // Add qpm_vapp class to match CSS selectors
        appElement.classList.add("qpm_vapp");

        // Start in mouse mode - only show focus outlines when user uses keyboard
        appElement.classList.add("qpm_mouse-mode");
        appElement.classList.remove("qpm_keyboard-mode");

        // Switch only on keyboard navigation keys
        const handleKeyDown = (event) => {
          if (["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
            appElement.classList.add("qpm_keyboard-mode");
            appElement.classList.remove("qpm_mouse-mode");
          }
        };

        // Switch to mouse mode on click interactions
        const handleMouseDown = () => {
          appElement.classList.add("qpm_mouse-mode");
          appElement.classList.remove("qpm_keyboard-mode");
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
       * Handles topics, limits, advanced mode, sorting, collapsed state, page size,
       * preselected PMIDs, and scroll position.
       */
      parseUrl() {
        // Initialize topics
        this.topics = [];
        this.urlTranslationSources = [];
        this.searchFlowDebugEnabledFromUrl = false;
        this.searchFlowDebugEnabled = this.debugSearchFlow === true;

        // Parse the current URL (search + hash query fallback for CMS embeds)
        const urlParams = getSearchFlowDebugUrlParams();

        // Check if there are query parameters
        if (![...urlParams.keys()].length) {
          this.topics = [[]];
          return;
        }

        // Process each parameter
        urlParams.forEach((value, key) => {
          // Split multiple values separated by ';;'
          const values = value.split(";;");
          const normalizedKey = key.replace(/^amp;/i, "");
          const keyLower = normalizedKey.toLowerCase();

          switch (keyLower) {
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

            case "qpmdebug": {
              const debugEnabled = normalizeSearchFlowDebugValue(value);
              this.searchFlowDebugEnabledFromUrl = debugEnabled;
              this.searchFlowDebugEnabled = this.debugSearchFlow === true || debugEnabled;
              break;
            }

            case "translationsources":
            case "semanticsources":
              this.urlTranslationSources = this.normalizeTranslationSourcesList(
                values.filter((entry) => entry.trim() !== "")
              );
              this.setSelectedTranslationSources(this.urlTranslationSources, true);
              break;

            case "pmid":
              this.preselectedPmidai = values;
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

            default:
              this.processFilter(normalizedKey, values);
              break;
          }
        });

        // Ensure topics is not empty
        if (this.topics.length === 0) {
          this.topics = [[]];
        }
        this.searchFlowDebugEnabled =
          this.debugSearchFlow === true || this.searchFlowDebugEnabledFromUrl === true;
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
       * Processes the 'topic' parameters from the URL and populates the topics array.
       *
       * @param {string[]} values - An array of topic values extracted from the URL.
       */
      processTopics(values) {
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
              id: this.createUrlCustomTagId(),
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

          // Find the topic in topicOptions
          this.topicOptions.forEach((topicOption) => {
            topicOption.groups.forEach((group) => {
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
              id: this.createUrlCustomTagId(),
              name: name,
              searchStrings: { normal: [name] },
              preString: `${this.getString("manualInputTerm")}:\u00A0 `,
              scope: "normal",
              isCustom: true,
              tooltip: customInputTagTooltip,
            };
            if (!this.limitData[groupId]) this.limitData[groupId] = [];
            this.limitData[groupId].push(tag);
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
          const [id, scope] = val.split("#");
          if (!scope) return;

          const isCustomInput = id.startsWith("{{") && id.endsWith("}}");

          if (isCustomInput) {
            const rawName = id.slice(2, -2);
            const tag = {
              id: this.createUrlCustomTagId(),
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
          for (const filterGroup of this.limitOptions) {
            const choice = filterGroup.choices
              ? filterGroup.choices.find((c) => c.id === normalizedId)
              : null;
            if (choice) {
              selected.push({ ...choice, scope: scopeIds[scope] || "normal" });
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
       * collapsed state, page size, preselected PMIDs, and scroll position.
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
        const initialParams = [apiBaseStr, debugParamStr].filter(Boolean).join("&");
        const translationSourcesParam = this.getTranslationSourcesUrlParamValue();
        const translationSourcesStr =
          translationSourcesParam !== null ? `&semanticsources=${translationSourcesParam}` : "";

        // If there are no topics selected, return the base URL without parameters

        if (!this.hasTopics && !this.openLimitsFromUrl && !this.openLimits && !translationSourcesStr) {
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
        const pmidStr = `&pmid=${(this.preselectedPmidai ?? []).join(";;")}`;
        const scrolltoStr = this.scrollToID
          ? `&scrollto=${encodeURIComponent(this.scrollToID)}`
          : "";
        const openLimitsStr = this.openLimitsFromUrl ? `&openlimits=true` : "";
        const hideLimitsStr =
          this.urlHideLimits.length > 0 ? `&hidelimits=${this.urlHideLimits.join(";;")}` : "";
        const checkLimitsStr =
          this.urlCheckLimits.length > 0 ? `&checklimits=${this.urlCheckLimits.join(";;")}` : "";
        const orderLimitsStr =
          this.urlOrderLimits.length > 0 ? `&orderlimits=${this.urlOrderLimits.join(";;")}` : "";

        // Assemble the full URL with all query parameters
        const urlLink = `${baseUrl}?${initialParams}${
          initialParams ? "&" : ""
        }${topicsStr}${limitsStr}${translationSourcesStr}${advancedStr}${aiStr}${pmidStr}${sorter}${collapsedStr}${pageSizeStr}${scrolltoStr}${openLimitsStr}${hideLimitsStr}${checkLimitsStr}${orderLimitsStr}`;

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
                const translationFlag = subject.isTranslated ? "1" : "0";
                subjectId = `{{${subject.name}${translationFlag}}}#${scope}`;
              } else if (subject.id) {
                subjectId = `${subject.id}#${scope}`;
              }
              return encodeURIComponent(subjectId);
            });

            return `topic=${subjectValues.join(";;")}`;
          });

        return subjectQueries.join("&");
      },
      /**
       * Constructs the query string for limits based on selected limits.
       *
       * @returns {string} The encoded limits query string.
       */
      constructLimitsQuery() {
        if (!this.advanced) {
          // Simple mode: encode from limitData (category-grouped)
          if (!this.limitData || Object.keys(this.limitData).length === 0) {
            return "";
          }
          const filterQueries = Object.entries(this.limitData)
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

        // Advanced mode: encode from limitDropdowns (array of arrays)
        if (!this.searchDisplayLimitDropdowns || !this.searchDisplayLimitDropdowns.some((d) => d.length > 0)) {
          return "";
        }

        const limitQueries = this.searchDisplayLimitDropdowns
          .map((group) => {
            const filterValues = group.map((item) => {
              const scope = this.getScopeKey(this.advanced ? item.scope : "normal");
              const valueId =
                item.isCustom || (typeof item.id === "string" && item.id.startsWith("__custom__:"))
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
        this.openAlexDoiCache = {};
        this.openAlexDoiPromiseCache = {};
        this.openAlexSourceCache = {};
        this.openAlexSourcePromiseCache = {};
        this.clearGlobalSemanticSearchState();
        this.clearSearchLoadingStatus();
        this.semanticMetadataByDoiCache = null;
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
        this.openAlexDoiPromiseCache = {};
        this.openAlexSourceCache = {};
        this.openAlexSourcePromiseCache = {};
        this.syncDeferredSemanticTagsForMode(this.hasSelectedSemanticSources() ? "semantic" : "pubmedQuery");
        this.clearGlobalSemanticSearchState();
        this.clearSearchLoadingStatus();
        this.semanticMetadataByDoiCache = null;
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
        const enabled =
          enabledValue === true ||
          enabledValue === 1 ||
          String(enabledValue || "")
            .trim()
            .toLowerCase() === "true";
        const topN = Number(rawConfig.topN);
        const maxOutputTokens = Number(rawConfig.maxOutputTokens);
        return {
          enabled,
          model: String(rawConfig.model || DEFAULT_SEMANTIC_LLM_RERANK_CONFIG.model).trim(),
          topN:
            Number.isFinite(topN) && topN > 1
              ? Math.min(15, Math.floor(topN))
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
      async maybeApplySemanticLlmFinalRerank(data) {
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
          const pmidsToHydrate = topEntries
            .filter((entry) => !this.flattenSemanticLlmAbstractText(entry?.abstract))
            .map((entry) => String(entry?.pmid || entry?.uid || "").trim())
            .filter((pmid) => /^[0-9]+$/.test(pmid));
          const abstractMap = await this.fetchSemanticLlmPubMedAbstractMap(pmidsToHydrate);
          const enrichmentLookup = this.buildSemanticEnrichmentLookup();
          const requestCandidates = [];
          const deferredTopEntries = [];

          topEntries.forEach((entry) => {
            const candidateId = this.getSemanticLlmCandidateId(entry);
            const title = String(entry?.title || "").trim();
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

            requestCandidates.push({
              id: candidateId,
              title,
              abstract: abstractText,
              publicationDate: String(entry?.publicationDate || entry?.pubDate || entry?.pubdate || "").trim(),
              source: String(entry?.originSource || entry?.source || "").trim(),
              sourceLabel: String(entry?.fulljournalname || entry?.source || "").trim(),
              ...qualitySignals,
              entry,
            });
          });

          if (requestCandidates.length < 2) {
            return safeData;
          }

          const response = await axios.post(
            this.getBackendApiUrl("SemanticFinalRerank.php"),
            {
              query: this.getSemanticLlmRerankQueryText(),
              hardFilterQuery: this.getSemanticHardFilterValidationQuery(),
              model: config.model,
              maxOutputTokens: config.maxOutputTokens,
              candidates: requestCandidates.map(({ entry, ...candidate }) => candidate),
            },
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
          return rerankedData;
        } catch (error) {
          console.warn("[SemanticLlmRerank] Falling back to deterministic order.", error);
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
            String(candidate?.pmid || "").trim() || normalizeDoiValue(candidate?.doi || "")
        );
        const trustedPmidSet = new Set(
          (Array.isArray(options?.trustedPmids) ? options.trustedPmids : [])
            .map((pmid) => String(pmid || "").trim())
            .filter((pmid) => /^[0-9]+$/.test(pmid))
        );
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
          return new Set();
        }
        const hasDoiOnlyRules =
          Array.isArray(activeDoiOnlyRuleState.activeRules) && activeDoiOnlyRuleState.activeRules.length > 0;
        if (!hasDoiOnlyRules && publicationDateYears.length === 0) {
          const allowedEntries = candidatesToValidate
            .map((candidate) => {
              const pmid = String(candidate?.pmid || "").trim();
              const doi = normalizeDoiValue(candidate?.doi || "");
              const key = pmid ? `pmid:${pmid}` : doi ? `doi:${doi.toLowerCase()}` : "";
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
          return new Set(allowedEntries.map((entry) => entry.key));
        }

        this.ensureSemanticLoadingProcessStepPresence(
          "finalizeValidateDoiFetch",
          "semanticSearchProgressFinalizeValidateDoiFetch"
        );
        this.ensureSemanticLoadingProcessStepPresence(
          "finalizeValidateDoiRules",
          "semanticSearchProgressFinalizeValidateDoiRules"
        );
        this.semanticDoiValidationActive = true;
        let hydratedWorks = [];
        try {
          this.startAnimatedLoadingStatus(
            "finalizeValidateDoiFetch",
            "semanticSearchProgressFinalizeValidateDoiFetch"
          );
          hydratedWorks = await this.fetchOpenAlexWorksByCandidates(candidatesToValidate, nlm);
        } finally {
          this.semanticDoiValidationActive = false;
        }
        this.activateSemanticLoadingProcessStep(
          "finalizeValidateDoiRules",
          "semanticSearchProgressFinalizeValidateDoiRules"
        );
        const hydratedResults = candidatesToValidate.map((candidate, index) => {
          const hydrated = hydratedWorks[index] || null;
          const pmid = String(candidate?.pmid || "").trim();
          const normalizedDoi = normalizeDoiValue(candidate?.doi || hydrated?.doi || "");
          const key = pmid ? `pmid:${pmid}` : normalizedDoi ? `doi:${normalizedDoi.toLowerCase()}` : "";
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
        if (excludedCandidates.length > 0) {
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
        return allowedKeys;
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
            const source = String(candidate?.source || "").trim();
            if (!allowOpenAlexSemantic && source === "openAlex") {
              return;
            }
            const key = pmid ? `pmid:${pmid}` : doi ? `doi:${doi.toLowerCase()}` : "";
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
              openAlexId: String(candidate?.openAlexId || "").trim(),
            });
          });
        });
        return candidates;
      },
      getOrderedRerankedPmids() {
        return this.getOrderedRerankedCandidates()
          .map((candidate) => candidate.pmid)
          .filter((pmid) => /^[0-9]+$/.test(pmid));
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
      getPreferredSemanticScholarDisplayMetadataByDoi(doi) {
        const doiKey = normalizeDoiValue(doi || "").toLowerCase();
        if (!doiKey) return null;
        const semanticByDoi = this.buildSemanticMetadataByDoi();
        const semanticScholarEntries = Array.isArray(semanticByDoi.get(doiKey)?.bySource?.semanticScholar)
          ? semanticByDoi.get(doiKey).bySource.semanticScholar
          : [];
        if (semanticScholarEntries.length === 0) {
          return null;
        }
        const sortedEntries = [...semanticScholarEntries].sort((left, right) => {
          const leftRank = Number(left?.rank);
          const rightRank = Number(right?.rank);
          const safeLeftRank = Number.isFinite(leftRank) && leftRank > 0 ? leftRank : Number.MAX_SAFE_INTEGER;
          const safeRightRank =
            Number.isFinite(rightRank) && rightRank > 0 ? rightRank : Number.MAX_SAFE_INTEGER;
          return safeLeftRank - safeRightRank;
        });
        const title =
          String(sortedEntries.find((entry) => String(entry?.title || "").trim())?.title || "").trim();
        const abstract =
          String(
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
      applyPreferredDisplayMetadataToHydratedRecord(mapped, normalizedDoi = "") {
        if (!mapped || typeof mapped !== "object") {
          return mapped;
        }
        if (String(mapped?.pmid || "").trim() !== "") {
          return mapped;
        }
        const displayMetadata = this.getPreferredSemanticScholarDisplayMetadataByDoi(
          mapped?.doi || normalizedDoi
        );
        if (!displayMetadata) {
          return mapped;
        }
        const resolvedAbstract = String(displayMetadata.abstract || "").trim();
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
          title: String(displayMetadata.title || mapped.title || "").trim(),
          abstract: resolvedAbstract || String(mapped?.abstract || "").trim(),
          hasAbstract: resolvedAbstract !== "" || Boolean(mapped?.hasAbstract),
          attributes: nextAttributes,
          mergedDoiMetadata:
            mapped?.mergedDoiMetadata && typeof mapped.mergedDoiMetadata === "object"
              ? {
                  ...mapped.mergedDoiMetadata,
                  displayMetadataSource: displayMetadata.source,
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
        };
      },
      async fetchOpenAlexWorksByCandidates(candidates, nlm) {
        if (!this.isOpenAlexDoiResolverEnabled()) {
          return (Array.isArray(candidates) ? candidates : []).map(() => null);
        }
        const safeCandidates = Array.isArray(candidates) ? candidates : [];
        if (safeCandidates.length === 0) return [];

        const results = new Array(safeCandidates.length).fill(null);
        const pendingEntries = [];
        const batchEntriesByDoi = new Map();
        const singleFallbackEntries = [];

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

        for (const chunk of batchChunks) {
          const dois = chunk.map((entry) => entry.normalizedDoi);
          try {
            const response = await axios.post(
              this.getBackendApiUrl("OpenAlexWorkLookup.php"),
              {
                dois,
                domain: this.currentDomain || "",
              },
              { headers: { "Content-Type": "application/json" } }
            );
            const works = Array.isArray(response?.data?.works) ? response.data.works : [];
            const worksByDoi = new Map(
              works
                .map((entry) => {
                  const normalizedEntryDoi = normalizeDoiValue(entry?.doi || entry?.work?.doi || "");
                  return normalizedEntryDoi
                    ? [normalizedEntryDoi.toLowerCase(), entry]
                    : null;
                })
                .filter(Boolean)
            );
            const mappedByDoi = new Map();
            const pmidsToHydrate = [];

            for (const entry of chunk) {
              const workEntry = worksByDoi.get(entry.normalizedDoi.toLowerCase());
              const sampleCandidate = safeCandidates[entry.indices[0]];
              if (!workEntry?.work) {
                continue;
              }
              let mapped = mapOpenAlexWorkToResultDto(workEntry.work, {
                doi: entry.normalizedDoi,
                openAlexId: workEntry.openAlexId || sampleCandidate?.openAlexId || "",
              });
              mapped = await this.finalizeOpenAlexMappedWork(mapped, sampleCandidate, entry.normalizedDoi);
              mappedByDoi.set(entry.normalizedDoi.toLowerCase(), mapped);
              const mappedPmid = String(mapped?.pmid || "").trim();
              if (/^[0-9]+$/.test(mappedPmid)) {
                pmidsToHydrate.push(mappedPmid);
              }
            }
            const pubMedByPmid = new Map(
              (
                await this.fetchSummaryRecordsByIds(
                  [...new Set(pmidsToHydrate)],
                  nlm
                )
              ).map((summaryEntry) => [String(summaryEntry?.uid || summaryEntry?.pmid || "").trim(), summaryEntry])
            );

            for (const entry of chunk) {
              const sampleCandidate = safeCandidates[entry.indices[0]];
              const cacheKey = this.getOpenAlexWorkCacheKey(sampleCandidate);
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
                this.writeTimedCacheEntry(this.openAlexDoiCache, cacheKey, preferred);
              } else {
                this.writeTimedCacheEntry(this.openAlexDoiCache, cacheKey, null, 60 * 1000);
              }
              entry.indices.forEach((candidateIndex) => {
                results[candidateIndex] = preferred;
              });
            }
          } catch (error) {
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

        if (singleFallbackEntries.length > 0) {
          const singleResults = await this.mapWithConcurrencyLimit(
            singleFallbackEntries,
            OPENALEX_LOOKUP_CONCURRENCY,
            (candidateIndex) => this.fetchOpenAlexWorkByCandidate(safeCandidates[candidateIndex], nlm)
          );
          singleFallbackEntries.forEach((candidateIndex, singleIndex) => {
            results[candidateIndex] = singleResults[singleIndex];
          });
        }

        return results;
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
            const work = response?.data?.work;
            let mapped = work
              ? mapOpenAlexWorkToResultDto(work, {
                  doi: normalizedDoi,
                  openAlexId,
                })
              : null;
            mapped = await this.finalizeOpenAlexMappedWork(mapped, candidate, normalizedDoi);
            const mappedPmid = String(mapped?.pmid || "").trim();
            if (/^[0-9]+$/.test(mappedPmid)) {
              const [pubMedRecord] = await this.fetchSummaryRecordsByIds([mappedPmid], nlm);
              mapped = this.buildPubMedPreferredRecord(pubMedRecord || null, mapped, normalizedDoi);
            }

            this.writeTimedCacheEntry(this.openAlexDoiCache, cacheKey, mapped);
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
            this.writeTimedCacheEntry(this.openAlexDoiCache, cacheKey, null, 60 * 1000);
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
      async buildHybridOrderedResultRefs(hardFilterQuery, nlm, orderedCandidates) {
        const orderedPmids = orderedCandidates
          .map((candidate) => String(candidate?.pmid || "").trim())
          .filter((value) => /^[0-9]+$/.test(value));
        const orderedSearch =
          orderedPmids.length > 0
            ? await this.resolveOrderedSearchPmids(hardFilterQuery, nlm, orderedPmids)
            : { count: 0, orderedIds: [] };
        const allowedSemanticRefKeys = await this.buildAllowedSemanticRefKeys(orderedCandidates, nlm, {
          trustedPmids: hardFilterQuery ? orderedSearch.orderedIds : [],
        });
        const matchedPmidSet = new Set(orderedSearch.orderedIds);
        const refs = [];
        const seenRefKeys = new Set();
        const usedPmids = new Set();

        orderedCandidates.forEach((candidate) => {
          const pmid = String(candidate?.pmid || "").trim();
          const doi = normalizeDoiValue(candidate?.doi || "");
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
              openAlexId: String(candidate?.openAlexId || "").trim(),
              key,
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
      async resolveOrderedSearchPmids(hardFilterQuery, nlm, orderedPmids) {
        const pmidClause = Array.isArray(orderedPmids) && orderedPmids.length > 0
          ? `(${orderedPmids.join(" ")})`
          : "";
        const validationQuery = hardFilterQuery
          ? pmidClause
            ? `${pmidClause} AND (${hardFilterQuery})`
            : hardFilterQuery
          : pmidClause;
        if (!validationQuery) {
          return {
            count: 0,
            orderedIds: [],
          };
        }
        this.finalValidatedQuery = validationQuery;
        if (this.shouldShowPubMedRelatedSemanticProcessSteps()) {
          this.activateSemanticLoadingProcessStep("pubmed", "semanticSearchProgressPubMedBestMatch");
        }
        this.startAnimatedLoadingStatus(
          "finalizeValidatePmid",
          "semanticSearchProgressFinalizeValidatePmid"
        );
        console.info("[SearchFlow] PMID validation query sent to NLM:", validationQuery);
        this.logSearchFlowDebugInfo("PMID validation query", {
          validationQuery,
          orderedPmidCount: orderedPmids.length,
          hardFilterQuery,
        });
        const esearchParams = new URLSearchParams({
          db: "pubmed",
          retmode: "json",
          retmax: String(orderedPmids.length),
          retstart: "0",
          sort: this.sort.method,
          term: validationQuery,
        });
        const esearchResponse = await axios.post(
          this.getBackendApiUrl("NlmSearch.php"),
          esearchParams.toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        const matchedIds = Array.isArray(esearchResponse?.data?.esearchresult?.idlist)
          ? esearchResponse.data.esearchresult.idlist.filter(Boolean)
          : [];
        const matchedSet = new Set(matchedIds);
        const orderedMatchedIds = orderedPmids.filter((pmid) => matchedSet.has(pmid));
        const remainingMatchedIds = matchedIds.filter((pmid) => !orderedMatchedIds.includes(pmid));

        console.info("[SearchFlow] Reranked PMID ordering applied.", {
          rerankedCandidateCount: orderedPmids.length,
          matchedByPubMedCount: matchedIds.length,
          orderedMatchedCount: orderedMatchedIds.length,
          unmatchedCandidateCount: orderedPmids.length - orderedMatchedIds.length,
          validationMode: hardFilterQuery ? "hard-filter-only" : "candidate-whitelist-only",
          topOrderedPmids: orderedMatchedIds.slice(0, 10),
        });
        orderedPmids
          .filter((pmid) => !matchedSet.has(pmid))
          .forEach((pmid) => {
            this.recordSearchFlowDebugLedgerStage({ pmid }, "rejectedByPubMedHardFilter", {
              source: "pubmed",
              reason: hardFilterQuery ? "pubmed-hard-filter-no-match" : "candidate-whitelist-no-match",
              detail: {
                validationQuery,
              },
            });
          });

        return {
          count: Number.parseInt(esearchResponse?.data?.esearchresult?.count, 10) || orderedMatchedIds.length,
          orderedIds: [...orderedMatchedIds, ...remainingMatchedIds],
        };
      },
      async fetchSummaryRecordsByIds(ids, nlm) {
        const filteredIds = (Array.isArray(ids) ? ids : []).filter((id) => id && id.trim() !== "");
        if (filteredIds.length === 0) {
          return [];
        }
        const chunkSize = 200;
        const mappedEntries = [];
        for (let index = 0; index < filteredIds.length; index += chunkSize) {
          const chunkIds = filteredIds.slice(index, index + chunkSize);
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

          mappedEntries.push(
            ...chunkIds
              .map((uid) => esummaryResult[uid])
              .filter(Boolean)
              .map((entry) => mapPubMedSummaryToResultDto(entry))
          );
        }

        return mappedEntries;
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
        const doiRefs = safeRefs.filter((entry) => entry.type === "doi");
        this.setSemanticFinalizeLoadingStatus("hydrate", {
          hasPmids: pmidRefs.length > 0,
          hasDois: doiRefs.length > 0,
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
          const mapped = doiData[index];
          if (mapped) {
            doiMap.set(entry.key, mapped);
          }
        });
        const hydratedResults = safeRefs
          .map((entry) =>
            entry.type === "pmid" ? pmidMap.get(String(entry.pmid)) : doiMap.get(entry.key)
          )
          .filter(Boolean);
        this.setSemanticFinalizeLoadingStatus("sort");
        const sortedResults = this.sortSemanticHydratedResults(hydratedResults);
        this.semanticSortedResultCache = sortedResults;
        this.semanticSortedResultCacheKey = cacheKey;
        return sortedResults;
      },
      /**
       * Initiates a PubMed search using NCBI's Entrez API.
       * Performs an esearch followed by an esummary to retrieve search results.
       * Updates component state with the results and handles UI updates.
       */
      async search() {
        this.searchLoading = true;
        this.searchError = null;
        this.loadingProcessSteps = [];
        this.semanticSortedResultCache = [];
        this.semanticSortedResultCacheKey = "";
        this.updateSearchLoadingStatus();
        // Snapshot the current search generation so later continuations can
        // detect that the user cancelled this run (via editForm) and avoid
        // overwriting the reset state.
        const mySearchGeneration = this.searchGeneration;
        const isCancelled = () => this.searchGeneration !== mySearchGeneration;
        const { nlm } = this.appSettings;
        console.group("[SearchFlow] search()");
        this.startSearchFlowDebugRun("search");

        try {
          await this.runSearchFlowDebugSection("01 Prepare", async () => {
            await this.prepareSemanticSearchStateBeforeSearch();
          });
          const query = decodeURIComponent(this.getSearchString).trim();
          console.info("[SearchFlow] Raw query from getSearchString:", query);
          this.logSearchFlowDebugInfo("Raw query from getSearchString", { query });

          if (!query || query === "()") {
            console.info("[SearchFlow] Query is empty. Search aborted.");
            this.searchLoading = false;
            return;
          }

          this.reloadScripts();
          // No additional validation flow on search button click.
          // Validation is performed when free-text queries are generated.
          const finalQuery = query;
          this.finalValidatedQuery = finalQuery;
          console.info("[SearchFlow] Final query (no extra flow on search):", finalQuery);
          let hardFilterQuery = "";
          let rerankedPmids = [];
          let orderedCandidates = [];
          let idList = [];
          let resultRefs = [];
          await this.runSearchFlowDebugSection("06 Filter and validation", async () => {
            if (this.hasSelectedSemanticSources()) {
              this.setSemanticFinalizeLoadingStatus("collect");
            }
            hardFilterQuery = this.getSemanticHardFilterValidationQuery();
            rerankedPmids = this.getOrderedRerankedPmids();
            console.info("[SearchFlow] Hard-filter validation query:", hardFilterQuery || "(none)");

            orderedCandidates = this.getOrderedRerankedCandidates();
            if (orderedCandidates.length > 0) {
              this.setSemanticFinalizeLoadingStatus("collect");
              const hybridOrdering = await this.buildHybridOrderedResultRefs(
                hardFilterQuery,
                nlm,
                orderedCandidates
              );
              this.matchedRerankedPmids = hybridOrdering.pmids;
              this.matchedRerankedResultRefs = hybridOrdering.refs;
              this.count = hybridOrdering.count;
              resultRefs = this.shouldUseSemanticDateOrdering(hybridOrdering.refs)
                ? hybridOrdering.refs
                : hybridOrdering.refs.slice(
                    this.page * this.pageSize,
                    this.page * this.pageSize + this.pageSize
                  );
              console.info("[SearchFlow] Display mode: hybrid reranked semantic order.", {
                page: this.page,
                pageSize: this.pageSize,
                sort: this.sort.method,
                visibleRefs: this.shouldUseSemanticDateOrdering(hybridOrdering.refs)
                  ? []
                  : resultRefs.map((entry) => entry.key),
                semanticDateOrdering: this.shouldUseSemanticDateOrdering(hybridOrdering.refs),
              });
            } else if (rerankedPmids.length > 0) {
              this.matchedRerankedResultRefs = [];
              this.setSemanticFinalizeLoadingStatus("collect");
              const orderedSearch = await this.resolveOrderedSearchPmids(
                hardFilterQuery,
                nlm,
                rerankedPmids
              );
              this.matchedRerankedPmids = orderedSearch.orderedIds;
              this.count = orderedSearch.orderedIds.length;
              idList = orderedSearch.orderedIds.slice(
                this.page * this.pageSize,
                this.page * this.pageSize + this.pageSize
              );
              console.info("[SearchFlow] Display mode: custom reranked PMID order.", {
                page: this.page,
                pageSize: this.pageSize,
                visiblePmids: idList,
              });
            } else {
              this.matchedRerankedResultRefs = [];
              this.matchedRerankedPmids = [];
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
                this.getBackendApiUrl("NlmSearch.php"),
                esearchParams.toString(),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
              );

              idList = esearchResponse.data.esearchresult.idlist.filter(Boolean);
              this.count = parseInt(esearchResponse.data.esearchresult.count, 10);
              console.info("[SearchFlow] Display mode: PubMed API sort order.", {
                sort: this.sort.method,
                page: this.page,
                pageSize: this.pageSize,
                visiblePmids: idList,
              });
            }
          });

          if (isCancelled()) return;
          if (idList.length === 0 && resultRefs.length === 0) {
            if (rerankedPmids.length === 0 || orderedCandidates.length > 0) {
              this.count = 0;
            }
            this.searchresult = [];
            this.logSearchFlowDebugFinalSummary({
              query: finalQuery,
              resultRefs: [],
              orderedCandidates,
              data: [],
            });
            this.searchLoading = false;
            this.clearSearchLoadingStatus();
            return;
          }

          let data = [];
          await this.runSearchFlowDebugSection("07 Hydration", async () => {
            if (resultRefs.length > 0) {
              if (this.shouldUseSemanticDateOrdering(resultRefs)) {
                const sortedData = await this.getSemanticSortedHydratedResults(resultRefs, nlm);
                this.count = sortedData.length;
                data = sortedData.slice(
                  this.page * this.pageSize,
                  this.page * this.pageSize + this.pageSize
                );
              } else {
                const pmidRefs = resultRefs.filter((entry) => entry.type === "pmid");
                const doiRefs = resultRefs.filter((entry) => entry.type === "doi");
                this.setSemanticFinalizeLoadingStatus("hydrate", {
                  hasPmids: pmidRefs.length > 0,
                  hasDois: doiRefs.length > 0,
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
                  const mapped = doiData[index];
                  if (mapped) {
                    doiMap.set(entry.key, mapped);
                  }
                });
                data = resultRefs
                  .map((entry) =>
                    entry.type === "pmid" ? pmidMap.get(String(entry.pmid)) : doiMap.get(entry.key)
                  )
                  .filter(Boolean);
              }
            } else {
              this.setSemanticFinalizeLoadingStatus("hydrate", {
                hasPmids: idList.length > 0,
                hasDois: false,
              });
              data = await this.fetchSummaryRecordsByIds(idList, nlm);
            }
            data = await this.maybeApplySemanticLlmFinalRerank(data);
          });
          if (isCancelled()) return;
          await this.runSearchFlowDebugSection("08 Final result composition", async () => {
            if (isCancelled()) return;
            this.setSemanticFinalizeLoadingStatus("render");
            this.searchresult = data;
            if (resultRefs.length > 0 && !this.shouldUseSemanticDateOrdering(resultRefs)) {
              this.logHybridRenderSummary("Hybrid page hydration summary.", resultRefs, data);
            }
            // Handle any preselected PMIDs
            this.setSemanticFinalizeLoadingStatus("selected");
            const preSelectedEntries = await this.searchPreselectedPmidai();
            if (preSelectedEntries && preSelectedEntries.length > 0) {
              const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
              this.searchresult = [...this.searchresult, ...uniquePreselected];
            }
            this.logSearchFlowDebugFinalSummary({
              query: finalQuery,
              resultRefs,
              orderedCandidates,
              data: this.searchresult,
            });
          });
          if (isCancelled()) return;
          this.searchLoading = false;
          this.clearSearchLoadingStatus();

          // Update UI and focus
          this.$nextTick(() => {
            if (isCancelled()) return;
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
          if (isCancelled()) return;
          this.showSearchError(error);
          this.logSearchFlowDebugWarn("Search failed", {
            error: String(error || ""),
          });
          this.searchLoading = false;
          this.clearSearchLoadingStatus();
        } finally {
          this.finishSearchFlowDebugRun(this.searchError ? "error" : "completed", {
            resultCount: Array.isArray(this.searchresult) ? this.searchresult.length : 0,
            totalCount: Number(this.count || 0),
          });
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
        if (!this.compactLoadingUi) {
          this.searchLoading = true;
          this.searchError = null;
          this.loadingProcessSteps = [];
          this.updateSearchLoadingStatus();
        } else {
          this.searchError = null;
        }
        const { nlm } = this.appSettings;
        console.group("[SearchFlow] searchMore()");
        this.startSearchFlowDebugRun("searchMore");

        try {
          await this.runSearchFlowDebugSection("01 Prepare", async () => {
            await this.prepareSemanticSearchStateBeforeSearch();
          });
          // Decode and trim the search query string
          const query = decodeURIComponent(this.getSearchString).trim();
          console.info("[SearchFlow] Raw query from getSearchString:", query);
          this.logSearchFlowDebugInfo("Raw query from getSearchString", { query });

          // Validate the query string
          if (!query || query === "()") {
            console.info("[SearchFlow] Query is empty. Pagination aborted.");
            if (!this.compactLoadingUi) {
              this.searchLoading = false;
            }
            return;
          }

          // Reload necessary scripts to ensure a clean environment
          this.reloadScripts();
          const validatedQuery = this.finalValidatedQuery || query;
          console.info(
            "[SearchFlow] Reusing final validated query (no revalidation in searchMore):",
            validatedQuery
          );

          let hardFilterQuery = "";
          let rerankedPmids = [];
          let orderedCandidates = [];
          let idList = [];
          let resultRefs = [];
          await this.runSearchFlowDebugSection("06 Filter and validation", async () => {
            if (this.hasSelectedSemanticSources()) {
              this.setSemanticFinalizeLoadingStatus("collect");
            }
            hardFilterQuery = this.getSemanticHardFilterValidationQuery();
            rerankedPmids =
              Array.isArray(this.matchedRerankedPmids) && this.matchedRerankedPmids.length > 0
                ? this.matchedRerankedPmids
                : this.getOrderedRerankedPmids();
            orderedCandidates = this.getOrderedRerankedCandidates();
            if (orderedCandidates.length > 0) {
              if (
                !Array.isArray(this.matchedRerankedResultRefs) ||
                this.matchedRerankedResultRefs.length === 0
              ) {
                this.setSemanticFinalizeLoadingStatus("collect");
                const hybridOrdering = await this.buildHybridOrderedResultRefs(
                  hardFilterQuery,
                  nlm,
                  orderedCandidates
                );
                this.matchedRerankedPmids = hybridOrdering.pmids;
                this.matchedRerankedResultRefs = hybridOrdering.refs;
                this.count = hybridOrdering.count;
              }
              const currentLength = Array.isArray(this.searchresult) ? this.searchresult.length : 0;
              resultRefs = this.shouldUseSemanticDateOrdering(this.matchedRerankedResultRefs)
                ? this.matchedRerankedResultRefs
                : this.matchedRerankedResultRefs.slice(currentLength, targetResultLength);
              console.info("[SearchFlow] Display mode: hybrid reranked semantic order (pagination).", {
                page: this.page,
                pageSize: this.pageSize,
                sort: this.sort.method,
                appendedRefs: this.shouldUseSemanticDateOrdering(this.matchedRerankedResultRefs)
                  ? []
                  : resultRefs.map((entry) => entry.key),
                semanticDateOrdering: this.shouldUseSemanticDateOrdering(this.matchedRerankedResultRefs),
              });
            } else if (rerankedPmids.length > 0) {
              this.matchedRerankedResultRefs = [];
              if (this.matchedRerankedPmids.length === 0) {
                this.setSemanticFinalizeLoadingStatus("collect");
                const orderedSearch = await this.resolveOrderedSearchPmids(
                  hardFilterQuery,
                  nlm,
                  rerankedPmids
                );
                this.matchedRerankedPmids = orderedSearch.orderedIds;
                this.count = orderedSearch.orderedIds.length;
              }
              idList = this.matchedRerankedPmids.slice(this.searchresult.length || 0, targetResultLength);
              console.info("[SearchFlow] Display mode: custom reranked PMID order (pagination).", {
                page: this.page,
                pageSize: this.pageSize,
                appendedPmids: idList,
              });
            } else {
              this.matchedRerankedResultRefs = [];
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
                this.getBackendApiUrl("NlmSearch.php"),
                esearchParams.toString(),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
              );

              // Extract and filter the list of PubMed IDs
              idList = esearchResponse.data.esearchresult.idlist.filter(
                (id) => id && id.trim() !== ""
              );
              this.count = parseInt(esearchResponse.data.esearchresult.count, 10);
              console.info("[SearchFlow] Display mode: PubMed API sort order (pagination).", {
                sort: this.sort.method,
                page: this.page,
                pageSize: this.pageSize,
                appendedPmids: idList,
              });
            }
          });

          // If no IDs are returned, update the state and exit
          if (idList.length === 0 && resultRefs.length === 0) {
            if (rerankedPmids.length === 0 || orderedCandidates.length > 0) {
              this.count = 0;
              this.searchresult = [];
            }
            this.logSearchFlowDebugFinalSummary({
              query: validatedQuery,
              resultRefs: [],
              orderedCandidates,
              data: Array.isArray(this.searchresult) ? this.searchresult : [],
            });
            if (!this.compactLoadingUi) {
              this.searchLoading = false;
              this.clearSearchLoadingStatus();
            }
            return;
          }

          let data = [];
          await this.runSearchFlowDebugSection("07 Hydration", async () => {
            if (resultRefs.length > 0) {
              if (this.shouldUseSemanticDateOrdering(resultRefs)) {
                const sortedData = await this.getSemanticSortedHydratedResults(resultRefs, nlm);
                const currentLength = Math.min(this.page * this.pageSize, sortedData.length);
                this.count = sortedData.length;
                data = sortedData.slice(currentLength, targetResultLength);
              } else {
                const pmidRefs = resultRefs.filter((entry) => entry.type === "pmid");
                const doiRefs = resultRefs.filter((entry) => entry.type === "doi");
                this.setSemanticFinalizeLoadingStatus("hydrate", {
                  hasPmids: pmidRefs.length > 0,
                  hasDois: doiRefs.length > 0,
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
                  const mapped = doiData[index];
                  if (mapped) {
                    doiMap.set(entry.key, mapped);
                  }
                });
                data = resultRefs
                  .map((entry) =>
                    entry.type === "pmid" ? pmidMap.get(String(entry.pmid)) : doiMap.get(entry.key)
                  )
                  .filter(Boolean);
              }
            } else {
              this.setSemanticFinalizeLoadingStatus("hydrate", {
                hasPmids: idList.length > 0,
                hasDois: false,
              });
              data = await this.fetchSummaryRecordsByIds(idList, nlm);
            }
            data = await this.maybeApplySemanticLlmFinalRerank(data);
          });

          await this.runSearchFlowDebugSection("08 Final result composition", async () => {
            // Merge unique entries to prevent duplicates
            if (resultRefs.length > 0 && !this.shouldUseSemanticDateOrdering(resultRefs)) {
              this.logHybridRenderSummary("Hybrid pagination hydration summary.", resultRefs, data);
            }
            this.setSemanticFinalizeLoadingStatus("render");
            const uniqueData = this.mergeUniqueEntries(data);
            this.searchresult = [...this.searchresult, ...uniqueData];

            // Handle any preselected PMIDs
            this.setSemanticFinalizeLoadingStatus("selected");
            const preSelectedEntries = await this.searchPreselectedPmidai();
            if (preSelectedEntries && preSelectedEntries.length > 0) {
              const uniquePreselected = this.mergeUniqueEntries(preSelectedEntries);
              this.searchresult = [...this.searchresult, ...uniquePreselected];
            }
            this.logSearchFlowDebugFinalSummary({
              query: validatedQuery,
              resultRefs,
              orderedCandidates,
              data: this.searchresult,
            });
          });

          // Reset the loading state
          if (!this.compactLoadingUi) {
            this.searchLoading = false;
            this.clearSearchLoadingStatus();
          }

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
          this.logSearchFlowDebugWarn("Pagination failed", {
            error: String(error || ""),
          });
          if (!this.compactLoadingUi) {
            this.searchLoading = false;
            this.clearSearchLoadingStatus();
          }
        } finally {
          this.finishSearchFlowDebugRun(this.searchError ? "error" : "completed", {
            resultCount: Array.isArray(this.searchresult) ? this.searchresult.length : 0,
            totalCount: Number(this.count || 0),
          });
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
        const baseUrl = `${this.getBackendApiUrl("NlmSummary.php")}?db=pubmed&retmode=json&id=`;

        const resp = await axios.get(baseUrl + ids.join(","));
        //Create list of returned data
        const data = [];
        const obj = resp.data.result;
        if (!obj) {
          throw Error("Search failed", resp);
        }
        for (let i = 0; i < obj.uids.length; i++) {
          data.push(mapPubMedSummaryToResultDto(obj[obj.uids[i]]));
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
            const doiRefs = visibleRefs.filter((entry) => entry.type === "doi");
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
              const mapped = doiData[index];
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
        this.pageSize = pageSize;
        this.page = 0;
        this.setUrl();
        await this.searchMore();
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
        return option.name || option.id;
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
