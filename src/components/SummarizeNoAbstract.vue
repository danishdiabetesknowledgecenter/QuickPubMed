<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="qpm_searchSummaryBox">
    <div class="d-flex space-between">
      <div class="qpm_tabs">
        <button
          v-for="prompt in prompts"
          :id="prompt.name"
          :key="prompt.name"
          v-tooltip="{
            content: getTabTooltipContent(prompt),
            delay: $helpTextDelay,
          }"
          class="qpm_tab"
          :class="{ qpm_tab_active: prompt.name == currentSummary }"
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
          <template>
            <div class="qpm_searchSummaryText">
              <div>
                <div style="margin: 20px 5px">
                  <div
                    v-if="
                      showSummarizeArticle &&
                      config.useAISummarizer &&
                      isLicenseAllowed &&
                      isResourceAllowed &&
                      isPubTypeAllowed
                    "
                  >
                    <keep-alive>
                      <summarize-article
                        v-if="isInitialized"
                        :ref="`summarizeArticleNoAbstract-${currentSummary}`"
                        :key="`no-abstract-${currentSummary}`"
                        :pdf-url="pdfUrl"
                        :html-url="htmlUrl"
                        :language="language"
                        :search-result-title="searchResultTitle"
                        :authors-list="authorsList"
                        :publication-info="publicationInfo"
                        :prompt-language-type="currentSummary"
                        :domain-specific-prompt-rules="domainSpecificPromptRules"
                        :ai-article-summaries="aiArticleSummaries"
                        :current-summary-index="currentSummaryIndex"
                        :loading="loadingArticleSummaries[currentSummary]"
                        @set-loading="handleSetLoading"
                        @unset-loading="handleUnsetLoading"
                        @update-ai-article-summaries="updateAiArticleSummaries"
                        @update-current-summary-index="updateCurrentSummaryIndex"
                        @error-state-changed="handleSummarizeArticleErrorState"
                        @last-item-streaming-started="handleLastItemStreamingStarted"
                      />
                    </keep-alive>
                    <keep-alive>
                      <question-for-article
                        v-if="!isForbiddenError && (!loadingArticleSummaries[currentSummary] || showUserQuestionsEarly)"
                        :pdf-url="pdfUrl"
                        :html-url="htmlUrl"
                        :language="language"
                        :prompt-language-type="currentSummary"
                        :domain-specific-prompt-rules="domainSpecificPromptRules"
                        :is-loading-current="loadingArticleSummaries[currentSummary] && !showUserQuestionsEarly"
                        :persisted-questions-and-answers="userQuestionsAndAnswers[currentSummary]"
                        @update-questions-and-answers="updateUserQuestionsAndAnswers"
                      />
                    </keep-alive>
                    <button
                      v-if="
                        !loadingArticleSummaries[currentSummary] || !currentSummary.length === 0
                      "
                      v-tooltip="{
                        content: getString('hoverretryText'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      class="qpm_button"
                      style="margin-top: 25px"
                      :disabled="
                        loadingArticleSummaries[currentSummary] || currentSummary.length === 0
                      "
                      @keydown.enter="handleRetryArticleSummary"
                      @click="handleRetryArticleSummary"
                    >
                      <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em"></i>
                      {{ getString("retryText") }}
                    </button>
                    <button
                      v-if="
                        !loadingArticleSummaries[currentSummary] || !currentSummary.length === 0
                      "
                      v-tooltip="{
                        content: getString('hovercopyText'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      class="qpm_button"
                      :disabled="
                        loadingArticleSummaries[currentSummary] || currentSummary.length === 0
                      "
                      @keydown.enter="clickCopyArticleSummary"
                      @click="clickCopyArticleSummary"
                    >
                      <i class="bx bx-copy" style="vertical-align: baseline" />
                      {{ getString("copyText") }}
                    </button>
                  </div>
                </div>
                <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryDisclaimer')" />
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeArticle from "@/components/SummarizeArticle.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { config } from "@/config/config.js";
  import { promptText } from "@/assets/content/qpm-open-ai-article-prompts.js";

  export default {
    name: "SummarizeNoAbstract",
    components: {
      LoadingSpinner,
      SummarizeArticle,
      QuestionForArticle,
    },
    mixins: [appSettingsMixin, promptRuleLoaderMixin],
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
        loadingArticleSummaries: {},
        userQuestionsAndAnswers: {},
        showUserQuestionsEarly: false, // Show user questions section when last item starts streaming
      };
    },
    watch: {
      currentSummary(newVal, oldVal) {
        if (newVal !== oldVal) {
          console.log("currentSummary changed", newVal);
        }
      },
      loadingArticleSummaries(newVal, oldVal) {
        console.log("loadingArticleSummaries changed", newVal), oldVal;
      },
    },
    computed: {
      config() {
        return config;
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
            this.$set(this.userQuestionsAndAnswers, prompt.name, []);
          }
        });
        this.isInitialized = true;
        console.log("isInitialized", this.isInitialized);
      });
    },
    activated() {
      if (this.initialTabPrompt != null) {
        this.clickSummaryTab(this.initialTabPrompt);
      }
    },
    methods: {
      handleRetryArticleSummary() {
        const refName = `summarizeArticleNoAbstract-${this.currentSummary}`;
        const summarizeArticleComponent = this.$refs[refName];

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
        console.log("Current article summary copied to the clipboard.");
        if (this.currentSummary !== "") {
          // Get the user questions and answers for the current summary
          const userQuestionsAndAnswers = this.userQuestionsAndAnswers[this.currentSummary];
          const questionsSection = userQuestionsAndAnswers
            .map((qa) => `${qa.question}\n${qa.answer}`)
            .join("\n\n");

          // Get the current summary index
          const idx = this.currentSummaryIndex[this.currentSummary];
          // Get the summary data for the current summary
          const summaryData = this.aiArticleSummaries[this.currentSummary][idx].articleSummaryData;

          const firstSeven = summaryData
            .slice(0, 7)
            .map((qa) => `${qa.shortTitle}\n${qa.answer}`)
            .join("\n\n");

          const remaining = summaryData
            .slice(7)
            .map((qa) => `${qa.question}\n${qa.answer}`)
            .join("\n\n");

          // Construct the text to copy
          const textToCopy =
            this.authorsList.trim() +
            ". " +
            this.searchResultTitle +
            " " +
            this.publicationInfo +
            ". " +
            "\n\n" +
            this.getString("summarizeArticleHeader") +
            ": " +
            "\n\n" +
            firstSeven +
            "\n\n" +
            this.getString("generateQuestionsHeader") +
            ": " +
            "\n\n" +
            remaining +
            "\n\n" +
            this.getString("userQuestionsHeader") +
            ": " +
            "\n\n" +
            questionsSection +
            "\n\n";
          // Write to clipboard
          await navigator.clipboard.writeText(textToCopy);
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
        if (isError) {
          this.isForbiddenError = true;
        } else {
          this.isForbiddenError = false;
        }
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
        this.$set(this.loadingArticleSummaries, promptLanguageType, false);
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
          this.$set(this.aiArticleSummaries, key, []);
          this.$set(this.loadingArticleSummaries, key, false);
        });
      },

      /**
       * Initializes the currentSummaryIndex object based on the promptText names.
       * Note: We use the Danish names as keys since promptLanguageType is always in Danish
       */
      initializeCurrentSummaryIndex() {
        promptText.forEach((prompt) => {
          const key = prompt.name.dk; // Always use Danish names for consistency
          this.$set(this.currentSummaryIndex, key, 0);
        });
      },

      /**
       * Handler to update aiArticleSummaries from child component.
       */
      updateAiArticleSummaries({ promptLanguageType, summaryData }) {
        console.log("updateAiArticleSummaries", promptLanguageType, summaryData);
        this.$set(this.loadingArticleSummaries, promptLanguageType, false); // Set loading to false
        if (!this.aiArticleSummaries[promptLanguageType]) {
          this.$set(this.aiArticleSummaries, promptLanguageType, []);
        }
        this.aiArticleSummaries[promptLanguageType].push(summaryData);
        console.log("this.aiArticleSummaries", this.aiArticleSummaries);
        this.currentSummaryIndex[promptLanguageType] =
          this.aiArticleSummaries[promptLanguageType].length - 1;
      },

      /**
       * Handler to update currentSummaryIndex from child component.
       */
      updateCurrentSummaryIndex({ promptLanguageType, newIndex }) {
        this.$set(this.currentSummaryIndex, promptLanguageType, newIndex);
      },

      /**
       * Set loading state to true when a article summary fetch starts.
       */
      setLoading(promptLanguageType) {
        this.$set(this.loadingArticleSummaries, promptLanguageType, true);
      },

      /**
       * Updates the userQuestionsAndAnswers state.
       *
       * @param {Object} payload - Contains promptLanguageType and updated Q&A array.
       */
      updateUserQuestionsAndAnswers(payload) {
        const { promptLanguageType, questionsAndAnswers } = payload;
        this.$set(this.userQuestionsAndAnswers, promptLanguageType, questionsAndAnswers);
      },

      getTranslation(value) {
        const lg = this.language;
        const constant = value.translations[lg];
        return constant !== undefined ? constant : value.translations["dk"];
      },
      getString(string) {
        const lg = this.language;
        if (!messages[string]) {
          console.warn(`Missing translation key: ${string}`);
          return string;
        }
        const constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["dk"];
      },
      getErrorTranslation(error) {
        const lg = this.language;
        try {
          const constant = messages[error][lg];
          return constant !== undefined ? constant : messages["unknownError"][lg];
        } catch {
          return messages["unknownError"][lg];
        }
      },
      async clickSummaryTab(prompt) {
        this.currentSummary = prompt.name;
      },
      getTabTooltipContent(prompt) {
        const tooltip = prompt?.tooltip;
        if (!tooltip) return null;

        return tooltip[this.language];
      },
    },
  };
</script>
