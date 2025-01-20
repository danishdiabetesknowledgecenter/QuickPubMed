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
        <div class="qpm_summary_icon_row">
          <template v-if="getCurrentSummary != null && getCurrentSummaryHistory.length > 1">
            <button
              class="qpm_summary_icon bx bx-chevron-left"
              style="margin-right: -12px; margin-top: -3px; border: 0"
              :disabled="getCurrentIndex + 1 >= getCurrentSummaryHistory.length"
              @click="clickHistoryItem(getCurrentIndex + 1)"
            />
            {{ getCurrentSummaryHistory.length - getCurrentIndex
            }}<span style="padding: 0 3px">/</span>{{ getCurrentSummaryHistory.length }}
            <button
              class="qpm_summary_icon bx bx-chevron-right"
              style="margin-left: -12px; margin-top: -3px; border: 0"
              :disabled="getCurrentIndex <= 0"
              @click="clickHistoryItem(getCurrentIndex - 1)"
            />
          </template>

          <button
            class="qpm_summary_icon bx bx-x"
            style="margin-left: 20px; margin-top: -5px; border: 1px solid #e7e7e7"
            @click="clickCloseSummary"
          />
        </div>
        <div v-if="!getCurrentSummary" class="qpm_searchSummaryText">
          <p>
            <strong>{{ summaryConsentHeader }}</strong>
          </p>
          <p v-if="summarySearchSummaryConsentText != null">
            {{ summarySearchSummaryConsentText }}
          </p>
          <p v-html="getString('aiSummaryConsentText')" />
          <p v-html="getString('readAboutAiSummaryText')" />
        </div>
        <div v-else class="qpm_searchSummaryResponseBox">
          <div
            v-if="getDidCurrentSummaryError"
            class="qpm_searchSummaryText qpm_searchSummaryErrorText"
          >
            <div>
              <p style="color: #932833">
                <i
                  class="bx bx-error"
                  style="font-size: 30px; line-height: 0; margin: -4px 4px 0 0"
                />
                <strong>{{ errorHeader }}</strong>
              </p>
              <p>{{ getCurrentSummary?.body }}</p>

              <template v-if="getCurrentSummary?.error">
                <p>{{ getCurrentSummary?.error?.Message }}</p>
              </template>
              <div style="margin: 20px 5px 5px">
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
          <template v-else-if="!isCurrentSummaryWaitingForResponse">
            <div class="qpm_searchSummaryText">
              <div>
                <p>
                  <strong>{{ getSuccessHeader }}</strong>
                </p>
                <div
                  style="
                    background-color: lightgrey;
                    padding: 3px 10px 10px;
                    margin: 5px;
                    font-size: 0.9em;
                  "
                >
                  <p v-html="getString('aiSummarizeFirstFewSearchResultHeaderAfterCountWarning')" />
                </div>
                <div v-if="useMarkdown && canRenderMarkdown" ref="summary">
                  <vue-showdown
                    :options="{ smoothLivePreview: true }"
                    :markdown="getCurrentSummary.body"
                    @click.native.capture="onMarkdownClick"
                  />
                </div>
                <p v-else ref="summary">
                  {{ getCurrentSummary?.body }}
                </p>
                <div style="margin: 20px 5px">
                  <button
                    v-if="getIsSummaryLoading"
                    v-tooltip="{
                      content: getString('hoverretryText'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button"
                    @keydown.enter="clickStop($event)"
                    @click="clickStop"
                  >
                    <i class="bx bx-stop-circle" />
                    {{ getString("stopText") }}
                  </button>

                  <button
                    v-if="!getIsSummaryLoading"
                    v-tooltip="{
                      content: getString('hoverretryText'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button"
                    @keydown.enter="clickRetry($event, true)"
                    @click="clickRetry($event, true)"
                  >
                    <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em" />
                    {{ getString("retryText") }}
                  </button>

                  <button
                    v-tooltip="{
                      content: getString('hovercopyText'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button"
                    :disabled="getIsSummaryLoading"
                    @click="clickCopy"
                  >
                    <i class="bx bx-copy" style="vertical-align: baseline" />
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
                    <keep-alive>
                      <summarize-article
                        v-if="isInitialized"
                        :ref="`summarizeArticleWithAbstract-${currentSummary}`"
                        :key="`abstract-${currentSummary}`"
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
                      />
                    </keep-alive>
                    <keep-alive>
                      <question-for-article
                        v-if="!isForbiddenError"
                        :pdf-url="pdfUrl"
                        :html-url="htmlUrl"
                        :language="language"
                        :prompt-language-type="currentSummary"
                        :domain-specific-prompt-rules="domainSpecificPromptRules"
                        :is-loading-current="loadingArticleSummaries[currentSummary]"
                        :persisted-questions-and-answers="userQuestionsAndAnswers[currentSummary]"
                        @set-loading-user-question="handleSetLoadingUserQuestion"
                        @unset-loading-user-question="handleUnsetLoadingUserQuestion"
                        @update-questions-and-answers="updateUserQuestionsAndAnswers"
                      />
                    </keep-alive>

                    <button
                      v-if="
                        !isForbiddenError &&
                        (!loadingArticleSummaries[currentSummary] || !currentSummary.length === 0)
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
                        loadingArticleSummaries[currentSummary] ||
                        currentSummary.length === 0 ||
                        loadingQuestionsAndAnswers[currentSummary]
                      "
                      @keydown.enter="handleRetryArticleSummary"
                      @click="handleRetryArticleSummary"
                    >
                      <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em"></i>
                      {{ getString("retryText") }}
                    </button>
                    <button
                      v-if="
                        !isForbiddenError &&
                        (!loadingArticleSummaries[currentSummary] || !currentSummary.length === 0)
                      "
                      v-tooltip="{
                        content: getString('hovercopyText'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      class="qpm_button"
                      :disabled="
                        loadingArticleSummaries[currentSummary] ||
                        currentSummary.length === 0 ||
                        loadingQuestionsAndAnswers[currentSummary]
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
          <loading-spinner
            class="qpm_searchSummaryText"
            :wait-text="getString('aiSummaryWaitText')"
            :wait-duration-disclaimer="getWaitTimeString"
            :loading="isCurrentSummaryWaitingForResponse"
            style="align-self: center"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import Vue from "vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeArticle from "@/components/SummarizeArticle.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";

  import { appSettingsMixin, eventBus } from "@/mixins/appSettings.js";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { languageFormat, dateOptions } from "@/utils/qpm-content-helpers.js";

  import { getPromptForLocale } from "@/utils/qpm-open-ai-prompts-helpers.js";
  import { config } from "@/config/config.js";
  import { promptText } from "@/assets/content/qpm-open-ai-article-prompts.js";
  import {
    promptTextMultipleAbstracts,
    promptTextSingleAbstract,
  } from "@/assets/content/qpm-open-ai-abstract-prompts";
  import { sanitizePrompt } from "@/utils/qpm-open-ai-prompts-helpers.js";

  export default {
    name: "SummarizeAbstract",
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
      articlesReferences: {
        type: Array,
        default: () => [],
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
        /**
         * An object containing each summary that has been fetched so far.
         * Each entry is an array of objects which always contains at least the following properties:
         *  - `requestTime`		- Date
         * 	- `status` 			- "success" | "error" | "loading"
         *  - `articles`		- [{...}, {...}, {...}]
         * 	- `body`			- String
         * @example
         * aiSearchSummaries: {
         *   fagsprog: [
         * 	   {
         *       requestTime: "2017-06-03T03:57:00.000Z",
         *       responseTime: "2017-06-03T04:00:00.000Z",
         *       status: "succes",
         *       articles: [{...}, {...}],
         *     	 body: "Artiklerne beskriver..."
         *     }
         * 	 ],
         *   hverdagssprog: [
         *     {
         *       requestTime: "2017-06-03T04:10:00.000Z",
         *       responseTime: "2017-06-03T04:17:00.000Z",
         *       status: "error",
         *       articles: [{...}, {...}, {...}],
         *       body: "CORS error",
         *       error: {...}
         *     }
         *   ]
         * }
         */
        aiSearchSummaries: this.prompts.reduce((acc, prompt) => {
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
      };
    },
    computed: {
      config() {
        return config;
      },
      getIsSummaryLoading() {
        return this.loadingAbstractSummaries.includes(this.currentSummary);
      },
      getCurrentSummaryHistory() {
        if (!this.currentSummary) return null;

        let currentSummaries = this.aiSearchSummaries[this.currentSummary];
        return currentSummaries;
      },
      getCurrentIndex() {
        let tabState = this.tabStates[this.currentSummary];
        let index = tabState?.currentIndex ?? 0;
        return index;
      },
      getCurrentSummary() {
        let summaries = this.getCurrentSummaryHistory;
        if (!summaries || summaries.length == 0) return undefined;

        let index = this.getCurrentIndex;

        return summaries[index];
      },
      getDidCurrentSummaryError() {
        const summary = this.getCurrentSummary;
        return summary?.status == "error";
      },
      isCurrentSummaryWaitingForResponse() {
        const summary = this.getCurrentSummary;
        return summary?.status == "loading" && (!summary?.body || summary.body.length == 0);
      },
      getWaitTimeString() {
        const currentSummary = this.getCurrentSummary;
        if (currentSummary == undefined || !currentSummary.showWaitDisclaimer) return "";

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
        const isVueShowdownRegistered =
          !!this.$options.components["VueShowdown"] || !!this.$options.components["vue-showdown"];
        return isVueShowdownRegistered;
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
            this.$set(this.userQuestionsAndAnswers, prompt.name, []);
          }
        });
        this.isInitialized = true;
      });
    },
    activated() {
      if (this.initialTabPrompt != null) {
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
        this.$set(this.loadingArticleSummaries, promptLanguageType, true);
      },

      /**
       * Unset loading state based on emitted event.
       */
      handleUnsetLoading({ promptLanguageType }) {
        this.$set(this.loadingArticleSummaries, promptLanguageType, false);
      },
      /**
       * Set loading state for user question based on emitted event.
       */
      handleSetLoadingUserQuestion({ promptLanguageType }) {
        this.$set(this.loadingQuestionsAndAnswers, promptLanguageType, true);
      },

      /**
       * Unset loading state for user question based on emitted event.
       */
      handleUnsetLoadingUserQuestion({ promptLanguageType }) {
        this.$set(this.loadingQuestionsAndAnswers, promptLanguageType, false);
      },
      /**
       * Initializes aiArticleSummaries based on the current language and promptText names.
       */
      initializeAiArticleSummaries() {
        promptText.forEach((prompt) => {
          const key = prompt.name[this.language];
          this.$set(this.aiArticleSummaries, key, []);
          this.$set(this.loadingArticleSummaries, key, false);
          this.$set(this.loadingQuestionsAndAnswers, key, false);
        });
      },

      /**
       * Initializes the currentSummaryIndex object based on the promptText names.
       */
      initializeCurrentSummaryIndex() {
        promptText.forEach((prompt) => {
          const key = prompt.name[this.language];
          this.$set(this.currentSummaryIndex, key, 0);
        });
      },

      /**
       * Handler to update aiArticleSummaries from child component.
       */
      updateAiArticleSummaries({ promptLanguageType, summaryData }) {
        this.$set(this.loadingArticleSummaries, promptLanguageType, false); // Set loading to false
        if (!this.aiArticleSummaries[promptLanguageType]) {
          this.$set(this.aiArticleSummaries, promptLanguageType, []);
        }
        this.aiArticleSummaries[promptLanguageType].push(summaryData);
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
        const constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["dk"];
      },
      getSummaryPromptByName(name) {
        return this.prompts.find(function (prompt) {
          return prompt.name == name;
        });
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
      getComposableAbstractPrompt(basePrompt, language, promptLanguageType) {
        let tempPromptText = "";
        const isMultipleAbstract = this.articlesReferences.length > 0;

        console.log("isMultipleAbstract:", isMultipleAbstract);
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

        // Compose the prompt text with default prompt questions without the user input questions
        let composedPromptText = `${domainSpecificRules} ${promptStartText} ${promptEndText}`;

        console.info(
          `|Language|\n${language}\n\n|Prompt language type|\n${promptLanguageType}\n\n|Domain specific rules|\n${domainSpecificRules}\n\n|Start text|\n${promptStartText}\n` +
            `\n|End text|\n${promptEndText}\n`
        );

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

        try {
          await readData(openAiServiceUrl, {
            prompt: localePrompt,
            articles: articles,
            client: this.appSettings.client,
          });
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
          this.$set(this.tabStates[prompt.name], "currentIndex", 0);
        }
      },
      async clickSummaryTab(tab) {
        this.currentSummary = tab.name;
        let currentSummaries = this.aiSearchSummaries[tab.name];
        if (this.getIsSummaryLoading || (currentSummaries && currentSummaries.length > 0)) {
          return;
        }
        await this.generateAbstractSummary(tab);
      },
      clickStop() {
        this.stopGeneration = true;
      },
      handleRetryArticleSummary() {
        const refName = `summarizeArticleWithAbstract-${this.currentSummary}`;
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
      async clickRetry(event, moveFocus = false) {
        event.preventDefault();
        event.stopPropagation();

        this.$emit("ai-summaries-click-retry", this);

        const tab = this.getSummaryPromptByName(this.currentSummary);
        if (moveFocus) {
          this.$el.querySelector(`#${tab.name}`).focus();
        }
        await this.generateAbstractSummary(tab);
      },
      async clickCopyArticleSummary() {
        console.info("Current article summary copied to the clipboard.");
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
          let userQuestionsSection = "";
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
            "\n\n";

          // If there are user questions, add them to the text to copy
          if (this.userQuestionsAndAnswers[this.currentSummary].length > 0) {
            userQuestionsSection =
              this.getString("userQuestionsHeader") + ": " + "\n\n" + questionsSection + "\n\n";
          }

          // Write to clipboard
          await navigator.clipboard.writeText(textToCopy + userQuestionsSection);
        } else {
          console.error("No current summary to copy.");
        }
      },
      clickCopy() {
        const summary = this.$refs.summary;
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
        navigator.clipboard.writeText(textToCopy);
      },
      clickCloseSummary() {
        this.$emit("close");
      },
      pushToAiSearchSummaries(key, value) {
        const oldSummaries = this.aiSearchSummaries[key] ?? [];
        let newSummaries = oldSummaries.toSpliced(0, 0, value);
        Vue.set(this.aiSearchSummaries, key, newSummaries);
      },
      updateAiSearchSummariesEntry(summaryName, newValues, index = 0) {
        for (const [key, value] of Object.entries(newValues)) {
          this.$set(this.aiSearchSummaries[summaryName][index], key, value);
        }
      },
      toggleHistory() {
        this.showHistory = !this.showHistory;
      },
      clickHistoryItem(index) {
        this.$set(this.tabStates[this.currentSummary], "currentIndex", index);
      },
      formatDate(date) {
        const formattedDate = date.toLocaleDateString(languageFormat[this.language], dateOptions);
        return formattedDate;
      },
      onMarkdownClick(event) {
        const target = event.target;

        if (target.tagName !== "A") return;

        const hrefValue = target.getAttribute("href");
        const hrefNumber = Number.parseInt(hrefValue.slice(1));

        if (!hrefValue.startsWith("#") || !Number.isInteger(hrefNumber)) return;

        const selectedArticlesSelectorString = `.qpm_accordion *:where(#${hrefNumber}, [name="${hrefNumber}"])`;
        const searchResultSelectorString = `.qpm_SearchResult *:where(#${hrefNumber}, [name="${hrefNumber}"])`;
        let resultEntry =
          document.querySelector(selectedArticlesSelectorString) ??
          document.querySelector(searchResultSelectorString);
        if (resultEntry == null) {
          console.debug(
            `onMarkdownClick: no article with the name or id '${hrefNumber}' could be found. ref: '${hrefValue}'.`
          );
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        eventBus.$emit("result-entry-show-abstract", { $el: resultEntry });
      },
      getTabTooltipContent(prompt) {
        const tooltip = prompt?.tooltip;
        if (!tooltip) return null;

        return tooltip[this.language];
      },
    },
  };
</script>
