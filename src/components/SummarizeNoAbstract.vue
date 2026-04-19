<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="qpm_searchSummaryBox">
    <div class="d-flex space-between">
      <div class="qpm_tabs">
        <button
          v-for="prompt in prompts"
          :id="prompt.name"
          :key="prompt.name"
          type="button"
          v-tooltip="{
            content: getTabTooltipContent(prompt),
            delay: $helpTextDelay,
          }"
          class="qpm_tab"
          :class="{ qpm_tab_active: prompt.name === currentSummary }"
          @click="clickSummaryTab(prompt)"
        >
          {{ getTranslation(prompt) }}
        </button>
      </div>
    </div>
    <div class="qpm_searchSummaryTextBackground">
      <template v-if="hasAcceptedAi">
        <div class="qpm_summary_icon_row"></div>

        <div class="qpm_searchSummaryResponseBox">
          <div class="qpm_searchSummaryText">
            <div>
              <div class="qpm_noAbstractContentSpacing">
                <div
                  v-if="
                    showSummarizeArticle &&
                    config.useAISummarizer &&
                    isLicenseAllowed &&
                    isResourceAllowed &&
                    isPubTypeAllowed
                  "
                >
                  <template v-for="prompt in prompts" :key="`no-abstract-flow-${prompt.name}`">
                    <div v-show="prompt.name === currentSummary">
                      <summarize-article
                        v-if="isInitialized && activeArticleTabs[prompt.name]"
                        :ref="`summarizeArticleNoAbstract-${prompt.name}`"
                        :key="`no-abstract-${prompt.name}`"
                        :pdf-url="pdfUrl"
                        :html-url="htmlUrl"
                        :language="language"
                        :search-result-title="searchResultTitle"
                        :authors-list="authorsList"
                        :publication-info="publicationInfo"
                        :prompt-language-type="prompt.name"
                        :domain-specific-prompt-rules="domainSpecificPromptRules"
                        :ai-article-summaries="aiArticleSummaries"
                        :current-summary-index="currentSummaryIndex"
                        :loading="loadingArticleSummaries[prompt.name]"
                        @set-loading="handleSetLoading"
                        @unset-loading="handleUnsetLoading"
                        @update-ai-article-summaries="updateAiArticleSummaries"
                        @update-current-summary-index="updateCurrentSummaryIndex"
                        @error-state-changed="handleSummarizeArticleErrorState"
                        @last-item-streaming-started="handleLastItemStreamingStarted"
                      />
                      <question-for-article
                        v-if="
                          activeArticleTabs[prompt.name] &&
                          !localIsForbiddenError &&
                          (!loadingArticleSummaries[prompt.name] || showUserQuestionsEarly)
                        "
                        :pdf-url="pdfUrl"
                        :html-url="htmlUrl"
                        :language="language"
                        :prompt-language-type="prompt.name"
                        :domain-specific-prompt-rules="domainSpecificPromptRules"
                        :is-loading-current="
                          loadingArticleSummaries[prompt.name] && !showUserQuestionsEarly
                        "
                        :persisted-questions-and-answers="userQuestionsAndAnswers[prompt.name]"
                        @update-questions-and-answers="updateUserQuestionsAndAnswers"
                      />
                      <button
                        type="button"
                        v-if="
                          activeArticleTabs[prompt.name] &&
                          (!loadingArticleSummaries[prompt.name] || prompt.name.length !== 0)
                        "
                        v-tooltip="{
                          content: getString('hoverretryText'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_button qpm_retryButtonSpacing"
                        :disabled="
                          loadingArticleSummaries[prompt.name] || prompt.name.length === 0
                        "
                        @keydown.enter="handleRetryArticleSummary"
                        @click="handleRetryArticleSummary"
                      >
                        <i class="bx bx-refresh qpm_iconBaselineSize" aria-hidden="true"></i>
                        {{ getString("retryText") }}
                      </button>
                      <button
                        type="button"
                        v-if="
                          activeArticleTabs[prompt.name] &&
                          (!loadingArticleSummaries[prompt.name] || prompt.name.length !== 0)
                        "
                        v-tooltip="{
                          content: getString('hovercopyText'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_button"
                        :disabled="
                          loadingArticleSummaries[prompt.name] || prompt.name.length === 0
                        "
                        @keydown.enter="clickCopyArticleSummary"
                        @click="clickCopyArticleSummary"
                      >
                        <i class="bx bx-copy qpm_iconBaseline" aria-hidden="true" />
                        {{ getString("copyText") }}
                      </button>
                    </div>
                  </template>
                </div>
              </div>
              <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryDisclaimer')" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import SummarizeArticle from "@/components/SummarizeArticle.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { messages } from "@/assets/content/translations.js";
  import { config } from "@/config/config.js";
  import { promptText } from "@/assets/prompts/article.js";
  import {
    buildArticleSummaryClipboardText,
    getLocalizedErrorTranslation,
    getLocalizedTranslation,
  } from "@/utils/componentHelpers";

  export default {
    name: "SummarizeNoAbstract",
    components: {
      SummarizeArticle,
      QuestionForArticle,
    },
    mixins: [appSettingsMixin, promptRuleLoaderMixin, utilitiesMixin],
    props: {
      pubType: {
        type: Array,
        default: () => [],
        required: false,
      },
      license: {
        type: String,
        default: "",
        required: false,
      },
      isLicenseAllowed: {
        type: Boolean,
        default: false,
      },
      isResourceAllowed: {
        type: Boolean,
        default: false,
      },
      isPubTypeAllowed: {
        type: Boolean,
        default: false,
      },
      isDocTypeAllowed: {
        type: Boolean,
        default: false,
      },
      htmlUrl: {
        type: String,
        default: "",
        required: false,
      },
      pdfUrl: {
        type: String,
        default: "",
        required: false,
      },
      showSummarizeArticle: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: "dk",
      },
      prompts: {
        type: Array,
        required: true,
      },
      hasAcceptedAi: {
        type: Boolean,
        required: true,
      },
      initialTabPrompt: {
        type: Object,
        default: null,
      },
      isForbiddenError: {
        type: Boolean,
        default: false,
      },
      authorsList: {
        type: String,
        default: "",
      },
      publicationInfo: {
        type: String,
        default: "",
      },
      searchResultTitle: {
        type: String,
        default: "",
      },
    },
    data() {
      return {
        currentSummary: "",
        aiArticleSummaries: {},
        currentSummaryIndex: {},
        isInitialized: false,
        localIsForbiddenError: this.isForbiddenError,
        loadingArticleSummaries: {},
        userQuestionsAndAnswers: {},
        showUserQuestionsEarly: false, // Show user questions section when last item starts streaming
        activeArticleTabs: this.prompts.reduce((acc, prompt) => {
          acc[prompt.name] = false;
          return acc;
        }, {}),
      };
    },
    computed: {
      config() {
        return config;
      },
    },
    watch: {
      isForbiddenError(newValue) {
        this.localIsForbiddenError = newValue;
      },
    },
    created() {
      this.initializeAiArticleSummaries();
      this.initializeCurrentSummaryIndex();
    },
    mounted() {
      // Set the flag to true after initialization
      this.$nextTick(() => {
        this.prompts.forEach((prompt) => {
          if (!this.userQuestionsAndAnswers[prompt.name]) {
            this.userQuestionsAndAnswers[prompt.name] = [];
          }
        });
        this.isInitialized = true;
      });
      // Trigger initial tab (moved from activated() since <keep-alive> is no longer used)
      if (this.initialTabPrompt !== null && this.initialTabPrompt !== undefined) {
        this.clickSummaryTab(this.initialTabPrompt);
      }
    },
    methods: {
      handleRetryArticleSummary() {
        const refName = `summarizeArticleNoAbstract-${this.currentSummary}`;
        const refEntry = this.$refs[refName];
        const summarizeArticleComponent = Array.isArray(refEntry) ? refEntry[0] : refEntry;

        if (
          summarizeArticleComponent &&
          typeof summarizeArticleComponent.handleRetry === "function"
        ) {
          summarizeArticleComponent.handleRetry();
        } else {
          console.error(`Ref '${refName}' not found or 'handleRetry' method does not exist.`);
        }
      },
      async clickCopyArticleSummary() {
        if (this.currentSummary !== "") {
          const userQuestionsAndAnswers = this.userQuestionsAndAnswers[this.currentSummary] || [];
          const idx = this.currentSummaryIndex[this.currentSummary];
          const summaryEntry = this.aiArticleSummaries?.[this.currentSummary]?.[idx];
          const summaryData = Array.isArray(summaryEntry?.articleSummaryData)
            ? summaryEntry.articleSummaryData
            : [];
          const textToCopy = buildArticleSummaryClipboardText({
            authorsList: this.authorsList,
            searchResultTitle: this.searchResultTitle,
            publicationInfo: this.publicationInfo,
            summaryData,
            userQuestionsAndAnswers,
            getString: this.getString,
            includeEmptyUserQuestionsSection: true,
          });
          if (!textToCopy) return;

          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(textToCopy);
          }
        } else {
          console.error("No current summary to copy.");
        }
      },
      /**
       * Handles the error state change emitted from SummarizeArticle.
       *
       * @param {boolean} isError - The current error state.
       */
      handleSummarizeArticleErrorState(isError) {
        this.localIsForbiddenError = !!isError;
      },

      /**
       * Set loading state based on emitted event.
       */
      handleSetLoading({ promptLanguageType }) {
        this.setLoading(promptLanguageType);
        this.showUserQuestionsEarly = false; // Reset when new loading starts
      },

      /**
       * Unset loading state based on emitted event.
       */
      handleUnsetLoading({ promptLanguageType }) {
        this.loadingArticleSummaries[promptLanguageType] = false;
        this.showUserQuestionsEarly = false; // Reset when loading completes
      },

      /**
       * Handle event when last item streaming starts - show user questions section early
       */
      handleLastItemStreamingStarted() {
        this.showUserQuestionsEarly = true;
      },

      /**
       * Initializes aiArticleSummaries based on the current language and promptText names.
       * Note: We use the Danish names as keys since promptLanguageType is always in Danish
       */
      initializeAiArticleSummaries() {
        promptText.forEach((prompt) => {
          const key = prompt.name.dk; // Always use Danish names for consistency
          this.aiArticleSummaries[key] = [];
          this.loadingArticleSummaries[key] = false;
        });
      },

      /**
       * Initializes the currentSummaryIndex object based on the promptText names.
       * Note: We use the Danish names as keys since promptLanguageType is always in Danish
       */
      initializeCurrentSummaryIndex() {
        promptText.forEach((prompt) => {
          const key = prompt.name.dk; // Always use Danish names for consistency
          this.currentSummaryIndex[key] = 0;
        });
      },

      /**
       * Handler to update aiArticleSummaries from child component.
       */
      updateAiArticleSummaries({ promptLanguageType, summaryData }) {
        this.loadingArticleSummaries[promptLanguageType] = false; // Set loading to false
        if (!this.aiArticleSummaries[promptLanguageType]) {
          this.aiArticleSummaries[promptLanguageType] = [];
        }
        this.aiArticleSummaries[promptLanguageType].push(summaryData);
        this.currentSummaryIndex[promptLanguageType] =
          this.aiArticleSummaries[promptLanguageType].length - 1;
      },

      /**
       * Handler to update currentSummaryIndex from child component.
       */
      updateCurrentSummaryIndex({ promptLanguageType, newIndex }) {
        this.currentSummaryIndex[promptLanguageType] = newIndex;
      },

      /**
       * Set loading state to true when a article summary fetch starts.
       */
      setLoading(promptLanguageType) {
        this.loadingArticleSummaries[promptLanguageType] = true;
      },

      /**
       * Updates the userQuestionsAndAnswers state.
       *
       * @param {Object} payload - Contains promptLanguageType and updated Q&A array.
       */
      updateUserQuestionsAndAnswers(payload) {
        const { promptLanguageType, questionsAndAnswers } = payload;
        this.userQuestionsAndAnswers[promptLanguageType] = questionsAndAnswers;
      },

      getTranslation(value) {
        return getLocalizedTranslation(value, this.language);
      },
      getErrorTranslation(error) {
        return getLocalizedErrorTranslation(messages, error, this.language);
      },
      async clickSummaryTab(prompt) {
        this.currentSummary = prompt.name;
        this.activeArticleTabs[prompt.name] = true;
      },
      getTabTooltipContent(prompt) {
        const tooltip = prompt?.tooltip;
        if (!tooltip) return null;

        return tooltip[this.language] ?? tooltip.dk ?? null;
      },
    },
  };
</script>

