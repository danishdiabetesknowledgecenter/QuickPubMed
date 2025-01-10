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
                        :pdf-url="pdfUrl"
                        :html-url="htmlUrl"
                        :language="language"
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
                        @update-questions-and-answers="updateUserQuestionsAndAnswers"
                      />
                    </keep-alive>
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
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeArticle from "@/components/SummarizeArticle.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";

  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { messages } from "@/assets/content/qpm-translations.js";

  import { config } from "@/config/config.js";
  import { promptText } from "@/assets/content/qpm-open-ai-prompts.js";

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

      hasAcceptedAi: Boolean,

      initialTabPrompt: {
        type: Object,
        default: null,
      },

      isForbiddenError: {
        type: Boolean,
        default: false,
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
        aiArticleSummaries: {},
        currentSummaryIndex: {},
        isInitialized: false,
        loadingArticleSummaries: {},
        userQuestionsAndAnswers: {},
      };
    },
    watch: {
      currentSummary(newVal, oldVal) {
        if (newVal !== oldVal) {
          console.log("currentSummary changed", newVal);
        }
      },
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
        this.setLoading(promptLanguageType);
      },

      /**
       * Unset loading state based on emitted event.
       */
      handleUnsetLoading({ promptLanguageType }) {
        this.$set(this.loadingArticleSummaries, promptLanguageType, false);
      },

      /**
       * Initializes aiArticleSummaries based on the current language and promptText names.
       */
      initializeAiArticleSummaries() {
        promptText.forEach((prompt) => {
          const key = prompt.name[this.language];
          this.$set(this.aiArticleSummaries, key, []);
          this.$set(this.loadingArticleSummaries, key, false);
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

      async clickSummaryTab(tab) {
        this.currentSummary = tab.name;
        let currentSummaries = this.aiSearchSummaries[tab.name];
        if (this.getIsSummaryLoading || (currentSummaries && currentSummaries.length > 0)) {
          return;
        }
      },
      getTabTooltipContent(prompt) {
        const tooltip = prompt?.tooltip;
        if (!tooltip) return null;

        return tooltip[this.language];
      },
    },
  };
</script>
