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
          :class="{ qpm_tab_active: prompt.name === currentSummary }"
          @click="clickSummaryTab(prompt)"
        >
          {{ getTranslation(prompt) }}
        </button>
      </div>
    </div>
    <div class="qpm_searchSummaryTextBackground">
      <template v-if="hasAcceptedAi">
        <div class="qpm_summary_icon_row">
          <template
            v-if="
              getCurrentSummary !== null &&
              getCurrentSummary !== undefined &&
              getCurrentSummaryHistory.length > 1
            "
          >
            <button
              class="qpm_summary_icon bx bx-chevron-left qpm_historyNavLeft"
              :disabled="getCurrentIndex + 1 >= getCurrentSummaryHistory.length"
              @click="clickHistoryItem(getCurrentIndex + 1)"
            />
            {{ getCurrentSummaryHistory.length - getCurrentIndex
            }}<span class="qpm_historyNavDivider">/</span>{{ getCurrentSummaryHistory.length }}
            <button
              class="qpm_summary_icon bx bx-chevron-right qpm_historyNavRight"
              :disabled="getCurrentIndex <= 0"
              @click="clickHistoryItem(getCurrentIndex - 1)"
            />
          </template>

          <button
            class="qpm_summary_icon bx bx-x qpm_summaryCloseButton"
            aria-label="Close"
            @click="clickCloseSummary"
          />
        </div>
        <div v-if="!getCurrentSummary" class="qpm_searchSummaryText">
          <p>
            <strong>{{ summaryConsentHeader }}</strong>
          </p>
          <p
            v-if="
              summarySearchSummaryConsentText !== null &&
              summarySearchSummaryConsentText !== undefined
            "
            v-html="summarySearchSummaryConsentText"
          />
          <p v-html="getString('aiSummaryConsentText')" />
          <p v-html="getString('readAboutAiSummaryText')" />
        </div>
        <div v-else class="qpm_searchSummaryResponseBox">
          <div
            v-if="getDidCurrentSummaryError"
            class="qpm_searchSummaryText qpm_searchSummaryErrorText"
          >
            <div>
              <p class="qpm_summaryErrorText">
                <i class="bx bx-error qpm_summaryErrorIcon" />
                <strong>{{ errorHeader }}</strong>
              </p>
              <p>{{ getCurrentSummary?.body }}</p>

              <template v-if="getCurrentSummary?.error">
                <p>{{ getCurrentSummary?.error?.Message }}</p>
              </template>
              <div class="qpm_summaryRetryGroupError">
                <button
                  class="qpm_button"
                  @keydown.enter="clickRetry($event, true)"
                  @click="clickRetry($event, true)"
                >
                  {{ getString("retryText") }}
                </button>
              </div>
            </div>
          </div>
          <template v-else>
            <div class="qpm_searchSummaryText" v-show="!isCurrentSummaryWaitingForResponse">
              <div>
                <p>
                  <strong>{{ getSuccessHeader }}</strong>
                </p>
                <div
                  class="qpm_summaryWarningBox"
                >
                  <p v-html="getString('aiSummarizeFirstFewSearchResultHeaderAfterCountWarning')" />
                </div>
                <div v-if="useMarkdown && canRenderMarkdown" ref="summary">
                  <vue-showdown
                    :options="{ smoothLivePreview: true }"
                    :markdown="getCurrentSummary.body"
                    @click.capture="onMarkdownClick"
                  />
                </div>
                <p v-else ref="summary">
                  {{ getCurrentSummary?.body }}
                </p>
                <div class="qpm_summaryActionsGroup">
                  <button
                    v-if="getIsAbstractSummaryLoading"
                    v-tooltip="{
                      content: getString('hoverretryText'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button"
                    @keydown.enter="clickStop($event)"
                    @click="clickStop"
                  >
                    <i class="bx bx-stop-circle" />
                    {{ getString("stopText") }}
                  </button>

                  <button
                    v-if="!getIsAbstractSummaryLoading"
                    v-tooltip="{
                      content: getString('hoverretryText'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button"
                    @keydown.enter="clickRetry($event, true)"
                    :disabled="getAreSummariesLoading"
                    @click="clickRetry($event, true)"
                  >
                    <i class="bx bx-refresh qpm_iconBaselineSize" />
                    {{ getString("retryText") }}
                  </button>

                  <button
                    v-tooltip="{
                      content: getString('hovercopyText'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button"
                    :disabled="getIsAbstractSummaryLoading"
                    @click="clickCopy"
                  >
                    <i class="bx bx-copy qpm_iconBaseline" />
                    {{ getString("copyText") }}
                  </button>
                  <div
                    v-if="
                      showSummarizeArticle &&
                      config.useAISummarizer &&
                      isLicenseAllowed &&
                      isResourceAllowed &&
                      isPubTypeAllowed
                    "
                  >
                    <template v-for="prompt in prompts" :key="`article-flow-${prompt.name}`">
                      <div v-show="prompt.name === currentSummary">
                        <summarize-article
                          v-if="isInitialized && activeArticleTabs[prompt.name]"
                          :ref="`summarizeArticleWithAbstract-${prompt.name}`"
                          :key="`abstract-${prompt.name}`"
                          :pdf-url="pdfUrl"
                          :html-url="htmlUrl"
                          :language="language"
                          :search-result-title="searchResultTitle"
                          :authors-list="authorsList"
                          :publication-info="publicationInfo"
                          :use-markdown="useMarkdown"
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
                            !isForbiddenError &&
                            (!loadingArticleSummaries[prompt.name] || showUserQuestionsEarly)
                          "
                          :pdf-url="pdfUrl"
                          :html-url="htmlUrl"
                          :language="language"
                          :use-markdown="useMarkdown"
                          :prompt-language-type="prompt.name"
                          :domain-specific-prompt-rules="domainSpecificPromptRules"
                          :is-loading-current="loadingArticleSummaries[prompt.name] && !showUserQuestionsEarly"
                          :persisted-questions-and-answers="userQuestionsAndAnswers[prompt.name]"
                          @set-loading-user-question="handleSetLoadingUserQuestion"
                          @unset-loading-user-question="handleUnsetLoadingUserQuestion"
                          @update-questions-and-answers="updateUserQuestionsAndAnswers"
                        />

                        <button
                          v-if="
                            activeArticleTabs[prompt.name] &&
                            !isForbiddenError &&
                            (!loadingArticleSummaries[prompt.name] || prompt.name.length !== 0)
                          "
                          v-tooltip="{
                            content: getString('hoverretryText'),
                            distance: 5,
                            delay: $helpTextDelay,
                          }"
                          class="qpm_button qpm_articleRetryButtonSpacing"
                          :disabled="
                            loadingArticleSummaries[prompt.name] ||
                            prompt.name.length === 0 ||
                            loadingQuestionsAndAnswers[prompt.name]
                          "
                          @keydown.enter="handleRetryArticleSummary"
                          @click="handleRetryArticleSummary"
                        >
                          <i class="bx bx-refresh qpm_iconBaselineSize"></i>
                          {{ getString("retryText") }}
                        </button>
                        <button
                          v-if="
                            activeArticleTabs[prompt.name] &&
                            !isForbiddenError &&
                            (!loadingArticleSummaries[prompt.name] || prompt.name.length !== 0)
                          "
                          v-tooltip="{
                            content: getString('hovercopyText'),
                            distance: 5,
                            delay: $helpTextDelay,
                          }"
                          class="qpm_button"
                          :disabled="
                            loadingArticleSummaries[prompt.name] ||
                            prompt.name.length === 0 ||
                            loadingQuestionsAndAnswers[prompt.name]
                          "
                          @keydown.enter="clickCopyArticleSummary"
                          @click="clickCopyArticleSummary"
                        >
                          <i class="bx bx-copy qpm_iconBaseline" />
                          {{ getString("copyText") }}
                        </button>
                      </div>
                    </template>
                  </div>
                </div>
                <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryDisclaimer')" />
              </div>
            </div>
          </template>
          <loading-spinner
            :wait-text="getString('aiSummaryWaitText')"
            :wait-duration-disclaimer="getWaitTimeString"
            :loading="isCurrentSummaryWaitingForResponse"
            class="qpm_searchSummaryText qpm_summaryLoadingSpinner"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import { nextTick } from "vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeArticle from "@/components/SummarizeArticle.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";

  import { appSettingsMixin, eventBus } from "@/mixins/appSettings.js";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { messages } from "@/assets/content/translations.js";
  import { languageFormat, dateOptions } from "@/utils/contentHelpers.js";
  import {
    buildArticleSummaryClipboardText,
    getLocalizedErrorTranslation,
    getLocalizedTranslation,
  } from "@/utils/componentHelpers";

  import { config } from "@/config/config.js";
  import { promptText } from "@/assets/prompts/article.js";
  import {
    promptTextMultipleAbstracts,
    promptTextSingleAbstract,
  } from "@/assets/prompts/abstract";
  import { sanitizePrompt } from "@/utils/promptsHelpers.js";

  export default {
    name: "SummarizeAbstract",
    components: {
      LoadingSpinner,
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
      articles: {
        type: Array,
        default: () => [],
        required: false,
      },
      language: {
        type: String,
        default: "dk",
      },
      prompts: {
        type: Array,
        required: true,
      },
      summaryConsentHeader: {
        type: String,
        default: "",
        required: SVGComponentTransferFunctionElement,
      },
      summarySearchSummaryConsentText: {
        type: String,
        default: null,
        required: SVGComponentTransferFunctionElement,
      },
      successHeader: {
        type: [String, Function],
        required: true,
      },
      errorHeader: {
        type: String,
        required: true,
      },
      getSelectedArticles: {
        type: [Function],
        required: true,
      },
      isMarkedArticles: {
        type: Boolean,
        default: false,
      },
      hasAcceptedAi: {
        type: Boolean,
        required: true,
      },
      useMarkdown: {
        type: Boolean,
        default: true,
      },
      initialTabPrompt: {
        type: Object,
        default: null,
      },
      checkForPdf: {
        type: Boolean,
        default: false,
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
      // Contains the source references for the text used in copying the article/abstract summary
      articlesReferences: {
        type: Array,
        default: () => [],
      },
      searchIntent: {
        type: String,
        default: "",
      },
    },
    data() {
      return {
        currentSummary: "",
        /**
         * The tabstates is an object indexed by the name of each tab. The corresponding value is an object containing
         * information about the state of a tab to enable switching between them without resetting the view.
         *
         * @example
         * tabStates: {
         *   "fagsprog": {
         *     currentIndex: 2
         *   },
         *   "hverdagssprog": {
         *     currentIndex: 0
         *   }
         * }
         */
        tabStates: this.prompts.reduce((acc, prompt) => {
          acc[prompt.name] = { currentIndex: 0 };
          return acc;
        }, {}),
        loadingAbstractSummaries: [],
        aiAbstractSummaries: this.prompts.reduce((acc, prompt) => {
          acc[prompt.name] = [];
          return acc;
        }, {}),
        articleCount: 0,
        showHistory: false,
        stopGeneration: false,
        pdfFound: false,
        articleName: "",
        aiArticleSummaries: {}, // Keeps track of the article summaries for each promptLangaugeType
        currentSummaryIndex: {}, // Keeps track of the current index for each article summary
        isInitialized: false, // Flag for initialization of objects to hold data for article summary
        loadingArticleSummaries: {}, // Keeps track of loading state for each article summary
        loadingQuestionsAndAnswers: {}, // Keeps track of loading state for each user question
        userQuestionsAndAnswers: {}, // Keeps track of user questions and answers for each article summary
        showUserQuestionsEarly: false, // Show user questions section when last item starts streaming
        activeArticleTabs: this.prompts.reduce((acc, prompt) => {
          acc[prompt.name] = false;
          return acc;
        }, {}),
      };
    },
    computed: {
      /**
       * Check if both the abstract and article summaries are loading.
       * if either of them are loading it will return true.
       */
      getAreSummariesLoading() {
        return this.getIsAbstractSummaryLoading || this.getIsArticleSummaryLoading;
      },
      config() {
        return config;
      },
      getIsArticleSummaryLoading() {
        return this.loadingArticleSummaries[this.currentSummary];
      },
      getIsAbstractSummaryLoading() {
        return this.loadingAbstractSummaries.includes(this.currentSummary);
      },
      getCurrentSummaryHistory() {
        if (!this.currentSummary) return null;
        return this.aiAbstractSummaries[this.currentSummary];
      },
      getCurrentIndex() {
        const tabState = this.tabStates[this.currentSummary];
        return tabState?.currentIndex ?? 0;
      },
      getCurrentSummary() {
        let summaries = this.getCurrentSummaryHistory;
        if (!summaries || summaries.length === 0) return undefined;

        let index = this.getCurrentIndex;

        return summaries[index];
      },
      getDidCurrentSummaryError() {
        const summary = this.getCurrentSummary;
        return summary?.status === "error";
      },
      isCurrentSummaryWaitingForResponse() {
        const summary = this.getCurrentSummary;
        return summary?.status === "loading" && (!summary?.body || summary.body.length === 0);
      },
      getWaitTimeString() {
        const currentSummary = this.getCurrentSummary;
        if (currentSummary === undefined || currentSummary === null || !currentSummary.showWaitDisclaimer) return "";

        const longAbstractLengthLimit = this.appSettings.openAi.longAbstractLengthLimit ?? 5000;

        const totalAbstractLength =
          currentSummary?.articles?.reduce((acc, article) => {
            return acc + article.abstract.length;
          }, 0) ?? 0;

        if (totalAbstractLength > longAbstractLengthLimit) {
          return this.getString("aiLongWaitTimeDisclaimer");
        } else {
          return this.getString("aiShortWaitTimeDisclaimer");
        }
      },
      getSuccessHeader() {
        if (typeof this.successHeader === "function") {
          const currentSummary = this.getCurrentSummary;
          let articles = currentSummary?.articles;
          return articles && this.successHeader(articles, currentSummary.isMarkedArticlesSearch);
        }
        return this.successHeader;
      },
      canRenderMarkdown() {
        // In Vue 3, globally registered components (via app.use()) are not in $options.components.
        // VueShowdown is always registered as a plugin in all entry points.
        return true;
      },
      languageFormat() {
        // Define language formats as needed
        return {
          dk: {
            /* date options */
          },
          // other languages
        };
      },
      dateOptions() {
        // Define date options as needed
        return {
          year: "numeric",
          month: "long",
          day: "numeric",
        };
      },
    },
    created() {
      this.initializeAiArticleSummaries();
      this.initializeCurrentSummaryIndex();
      if (this.checkForPdf) {
        this.articleName = this.getSelectedArticles()[0].title;
      }
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
        this.loadingArticleSummaries[promptLanguageType] = true;
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
       * Set loading state for user question based on emitted event.
       */
      handleSetLoadingUserQuestion({ promptLanguageType }) {
        this.loadingQuestionsAndAnswers[promptLanguageType] = true;
      },
      /**
       * Unset loading state for user question based on emitted event.
       */
      handleUnsetLoadingUserQuestion({ promptLanguageType }) {
        this.loadingQuestionsAndAnswers[promptLanguageType] = false;
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
          this.loadingQuestionsAndAnswers[key] = false;
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
      getSummaryPromptByName(name) {
        return this.prompts.find((prompt) => prompt.name === name);
      },
      getErrorTranslation(error) {
        return getLocalizedErrorTranslation(messages, error, this.language);
      },
      /**
       * Constructs a composable abstract prompt with the necessary fields.
       *
       * @param {Object} prompt - The initial prompt object.
       * @param {String} language - The language code (e.g., 'en', 'dk').
       * @param {String} promptLanguageType - The prompt language type (e.g., 'plain langauge', 'proffesional language').
       * @returns {Object} - The composed prompt object ready for backend processing.
       */
      getComposableAbstractPrompt(basePrompt, language, promptLanguageType) {
        let tempPromptText = "";
        const isMultipleAbstract = this.articlesReferences.length > 0;

        if (isMultipleAbstract) {
          tempPromptText = promptTextMultipleAbstracts;
        } else {
          tempPromptText = promptTextSingleAbstract;
        }

        const prompTextLanguageType = tempPromptText.find(
          (entry) => entry.name === promptLanguageType
        );

        const domainSpecificRules = this.domainSpecificPromptRules[language];
        const promptStartText = prompTextLanguageType.startText[language];
        const promptEndText = prompTextLanguageType.endText[language];

        // Compose the prompt text with headers for better readability
        let composedPromptText = '';
        
        if (domainSpecificRules) {
          composedPromptText += `## DOMAIN-SPECIFIC RULES ##\n${domainSpecificRules}\n\n`;
        }
        
        composedPromptText += `## INSTRUCTIONS ##\n${promptStartText}\n\n`;
        
        if (this.searchIntent) {
          composedPromptText += `## BRUGERENS SØGEINTENTION ##\nBrugeren søgte efter: "${this.searchIntent}". Fokuser opsummeringen på aspekter der er relevante for denne søgeintention, og forsøg at besvare det underliggende spørgsmål, som brugeren formentlig ønsker svar på.\n\n`;
        }

        composedPromptText += `## END TEXT ##\n${promptEndText}\n`;


        // Sanitize the composed prompt text
        let sanitizedComposedPromptText = sanitizePrompt({
          [language]: composedPromptText,
        });

        // Set the prompt field to the sanitized composed prompt text for the given language
        basePrompt.prompt = sanitizedComposedPromptText[language];
        return basePrompt;
      },
      async generateAbstractSummary(prompt) {
        this.stopGeneration = false;
        const waitTimeDisclaimerDelay = this.appSettings.openAi.waitTimeDisclaimerDelay ?? 0;
        this.loadingAbstractSummaries.push(prompt.name);

        // Get the prompt text for the current language which includes the domain specific rules
        const localePrompt = this.getComposableAbstractPrompt(
          { ...prompt },
          this.language,
          prompt.name
        );

        const endpoint = "/api/SummarizeSearch";
        const openAiServiceUrl = `${this.appSettings.openAi.baseUrl}${endpoint}`;

        const readData = async (url, body) => {
          let answer = "";
          const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            throw { data: await response.json() };
          }

          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

          let done = false;

          while (!done && !this.stopGeneration) {
            const { done: doneReading, value } = await reader.read();
            done = doneReading;

            if (!done && !this.stopGeneration) {
              answer += value;
              this.updateAiSearchSummariesEntry(prompt.name, { body: answer });
            }
          }

          // If generation was stopped, you might want to handle partial data
          if (!this.stopGeneration) {
            this.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(),
              status: "success",
            });
          }
        };

        const articles = this.getSelectedArticles();
        if (!articles || articles.length === 0) {
          this.pushToAiSearchSummaries(prompt.name, {
            responseTime: new Date(),
            status: "error",
            articles: articles,
            isMarkedArticlesSearch: this.isMarkedArticles,
            body: this.getErrorTranslation("noAbstractsError"),
          });
          return;
        }

        this.pushToAiSearchSummaries(prompt.name, {
          requestTime: new Date(),
          status: "loading",
          articles: articles,
          body: "",
          isMarkedArticlesSearch: this.isMarkedArticles,
        });

        setTimeout(() => {
          this.updateAiSearchSummariesEntry(prompt.name, {
            showWaitDisclaimer: true,
          });
        }, waitTimeDisclaimerDelay);

        this.articleCount = articles.length;

        // Build complete prompt text with articles
        let articleText = `\n\n## ARTICLES TO SUMMARIZE (${articles.length}) ##\n`;
        articles.forEach((article, i) => {
          const num = i + 1;
          const abstract = article.Abstract || article.abstract || '';
          const title = article.Title || article.title || '';
          const pmid = article.PMID || article.pmid || article.uid || '';
          const doi = article.DOI || article.doi || '';
          const referenceId = article.ReferenceId || article.referenceId || article.id || pmid || doi || '';
          const source = article.Source || article.source || article.fulljournalname || '';
          const authorList = article.AuthorList || article.authorList || article.Authors || article.authors || [];
          const pubDate = article.PubDate || article.pubDate || article.pubdate || article.PublicationDate || article.publicationDate || '';
          
          // Get authors - can be string "Li W, Huang E, Gao S" or array [{name: "Li W"}]
          const authorsRaw = article.authors || article.Authors || authorList || '';
          
          // Format authors as string and parse for reference
          let authorsStr = '';
          let authorParts = [];
          
          if (Array.isArray(authorsRaw) && authorsRaw.length > 0) {
            // Array format: [{name: "Li W"}, ...]
            authorParts = authorsRaw.map(a => a.name || a);
            authorsStr = authorParts.join(', ');
          } else if (typeof authorsRaw === 'string' && authorsRaw) {
            // String format: "Li W, Huang E, Gao S"
            authorsStr = authorsRaw;
            authorParts = authorsRaw.split(',').map(a => a.trim()).filter(a => a);
          }
          
          // Build APA-style reference (LastName, Year) or (LastName et al., Year)
          let reference = '';
          
          // Get year from pubdate (NLM format: "2020 Mar 12" - year is first)
          let year = '';
          const rawPubDate = article.pubdate || article.PubDate || pubDate || '';
          
          if (rawPubDate) {
            const pubDateYearMatch = rawPubDate.match(/^\d{4}/);
            year = pubDateYearMatch ? pubDateYearMatch[0] : '';
          }
          
          // Get first author's last name
          let lastName = '';
          const authorCount = authorParts.length;
          
          if (authorCount > 0) {
            // NLM format: "Efternavn Initialer" - e.g. "de Visser H", "Li W", "van der Berg JK"
            // Remove initials at the end (1-3 uppercase letters, possibly with periods)
            lastName = authorParts[0].trim().replace(/\s+[A-Z]{1,3}\.?$/, '').trim();
          }
          
          // Build reference
          if (lastName && year) {
            reference = authorCount > 1 
              ? `${lastName} et al., ${year}` 
              : `${lastName}, ${year}`;
          }
          
          articleText += `\n--- Article ${num} ---\n`;
          articleText += `Title: ${title}\n`;
          articleText += `Authors: ${authorsStr}\n`;
          articleText += `Source: ${source}\n`;
          articleText += `Reference: ${reference}\n`;
          articleText += `Reference ID: ${referenceId}\n`;
          articleText += `PMID: ${pmid}\n`;
          articleText += `DOI: ${doi}\n`;
          articleText += `Abstract:\n${abstract}\n`;
        });

        // Create complete prompt with articles
        const completePromptText = localePrompt.prompt + articleText;

        const requestBody = {
          prompt: {
            ...localePrompt,
            prompt: completePromptText, // Full prompt with articles
          },
          articles: articles,
          client: this.appSettings.client,
        };

        // Log complete prompt as sent to OpenAI
        console.info(
          `|Complete prompt sent to OpenAI|\n\n${completePromptText}`
        );

        try {
          await readData(openAiServiceUrl, requestBody);
        } catch (error) {
          if (error.data) {
            this.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(),
              status: "error",
              body: this.getErrorTranslation("unknownError"),
              error: error.data,
            });
          } else {
            this.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(),
              status: "error",
              body: this.getErrorTranslation("unknownError"),
              error: error,
            });
          }
        } finally {
          const tabIndex = this.loadingAbstractSummaries.indexOf(prompt.name);
          if (tabIndex !== -1) {
            this.loadingAbstractSummaries.splice(tabIndex, 1);
          }
          this.tabStates[prompt.name]["currentIndex"] = 0;
        }
      },
      async clickSummaryTab(tab) {
        this.currentSummary = tab.name;
        this.activeArticleTabs[tab.name] = true;
        let currentSummaries = this.aiAbstractSummaries[tab.name];
        if (this.getIsAbstractSummaryLoading || (currentSummaries && currentSummaries.length > 0)) {
          return;
        }
        await this.generateAbstractSummary(tab);
      },
      clickStop() {
        this.stopGeneration = true;
      },
      handleRetryArticleSummary() {
        const refName = `summarizeArticleWithAbstract-${this.currentSummary}`;
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
      async clickRetry(event, moveFocus = false) {
        event.preventDefault();
        event.stopPropagation();

        this.$emit("ai-summaries-click-retry", this);

        const tab = this.getSummaryPromptByName(this.currentSummary);
        if (!tab) return;
        if (moveFocus) {
          const tabElement = this.$el?.querySelector(`#${tab.name}`);
          if (tabElement && typeof tabElement.focus === "function") {
            tabElement.focus();
          }
        }
        await this.generateAbstractSummary(tab);
      },
      async clickCopyArticleSummary() {
        console.info("Current article summary copied to the clipboard.");
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
            includeEmptyUserQuestionsSection: false,
          });
          if (!textToCopy) return;

          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(textToCopy);
          }
        } else {
          console.error("No current summary to copy.");
        }
      },
      clickCopy() {
        const summary = this.$refs.summary;
        if (!summary || typeof summary.innerText !== "string") return;
        let textToCopy = "";
        if (this.articlesReferences.length > 0) {
          const articlesReferencesString = this.articlesReferences
            .map((article) => {
              return `${article.authors}. ${article.title} ${article.publicationInfo}.\n\n`;
            })
            .join("");
          textToCopy = `${articlesReferencesString}${summary.innerText}\n`;
        } else {
          textToCopy = `${this.authorsList}. ${this.searchResultTitle} ${
            this.publicationInfo
          }.\n\n${summary.innerText.trim()}`;
        }
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(textToCopy);
        }
      },
      clickCloseSummary() {
        this.$emit("close");
      },
      pushToAiSearchSummaries(key, value) {
        const oldSummaries = this.aiAbstractSummaries[key] ?? [];
        let newSummaries = oldSummaries.toSpliced(0, 0, value);
        this.aiAbstractSummaries[key] = newSummaries;
      },
      updateAiSearchSummariesEntry(summaryName, newValues, index = 0) {
        for (const [key, value] of Object.entries(newValues)) {
          this.aiAbstractSummaries[summaryName][index][key] = value;
        }
      },
      toggleHistory() {
        this.showHistory = !this.showHistory;
      },
      clickHistoryItem(index) {
        this.tabStates[this.currentSummary]["currentIndex"] = index;
      },
      formatDate(date) {
        const formattedDate = date.toLocaleDateString(languageFormat[this.language], dateOptions);
        return formattedDate;
      },
      onMarkdownClick(event) {
        const target = event.target;

        if (target.tagName !== "A") return;

        const hrefValue = target.getAttribute("href");
        if (typeof hrefValue !== "string" || !hrefValue.startsWith("#")) return;
        let referenceTarget = hrefValue.slice(1).trim();
        if (!referenceTarget) return;
        try {
          referenceTarget = decodeURIComponent(referenceTarget);
        } catch {
          // Keep raw value if decoding fails.
        }

        const normalizedReferenceTarget = referenceTarget.toLowerCase();
        const candidateEntries = Array.from(
          document.querySelectorAll(".qpm_accordion .qpm_ResultEntry, .qpm_SearchResult .qpm_ResultEntry")
        );
        const resultEntry = candidateEntries.find((entry) => {
          const anchorValues = [
            entry.getAttribute("data-reference-anchor"),
            entry.getAttribute("data-reference-pmid"),
            entry.getAttribute("data-reference-doi"),
            entry.getAttribute("name"),
          ]
            .map((value) => String(value || "").trim().toLowerCase())
            .filter(Boolean);
          return anchorValues.includes(normalizedReferenceTarget);
        });
        if (resultEntry === null || resultEntry === undefined) {
          console.debug(
            `onMarkdownClick: no article with the reference id '${referenceTarget}' could be found. ref: '${hrefValue}'.`
          );
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        eventBus.emit("result-entry-show-abstract", { $el: resultEntry });
      },
      getTabTooltipContent(prompt) {
        const tooltip = prompt?.tooltip;
        if (!tooltip) return null;
        return tooltip[this.language] ?? tooltip.dk ?? null;
      },
    },
  };
</script>

