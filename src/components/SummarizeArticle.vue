<template>
  <div v-if="!isError" ref="container" style="margin-top: 20px">
    <loading-spinner
      class="qpm_searchSummaryText"
      :wait-text="getString('aiSummaryWaitText')"
      :wait-duration-disclaimer="getString('aiLongWaitTimeDisclaimer')"
      :loading="loading"
      style="align-self: center"
    />

    <!-- TITLE summarize entire article -->
    <p v-if="!loading && currentSummary.questions.length > 1 && !isError">
      <strong>{{ getString("summarizeArticleHeader") }}</strong>
    </p>

    <div v-if="!loading && !isError">
      <button
        style="margin-top: -3px; border: 0px"
        class="qpm_summary_icon bx bx-chevron-left"
        @click="navigateHistory('previous')"
      />
      <span style="padding: 0px 3px">
        {{ currentSummaryIndex[promptLanguageType] + 1 }} /
        {{ aiArticleSummaries[promptLanguageType].length }}
      </span>
      <button
        style="margin-top: -3px; border: 0px"
        class="qpm_summary_icon bx bx-chevron-right"
        @click="navigateHistory('next')"
      />
    </div>

    <div v-if="!loading && !isError">
      <!-- Default questions to summarize an article section -->
      <accordion-menu
        v-for="(question, index) in currentSummary.questions.slice(0, 7)"
        :key="`${promptLanguageType}-${currentSummaryIndex}-${index}`"
        :title="fetchShortTitle(question)"
        :open-by-default="false"
      >
        <template #header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <i
              v-if="accordionProps.expanded"
              class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
            />
            <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
            <i
              class="bx bx-credit-card-front"
              style="
                font-size: 22px;
                vertical-align: text-bottom;
                margin-left: 3px;
                margin-right: 5px;
              "
            ></i>
            {{ fetchShortTitle(question) }}
          </div>
        </template>
        <template #default>
          <div class="qpm_answer-text">
            {{ currentSummary.answers[index] }}
          </div>
        </template>
      </accordion-menu>

      <!-- TITLE for generated article specific questions -->
      <p v-if="currentSummary.questions.length > 7">
        <strong>{{ getString("generateQuestionsHeader") }}</strong>
      </p>

      <!-- Generated article specific questions section -->
      <accordion-menu
        v-for="(question, index) in currentSummary.questions.slice(7)"
        :key="`${promptLanguageType}-${currentSummaryIndex}-${index + 7}`"
        :title="question"
        :open-by-default="false"
      >
        <template #header="accordionProps">
          <div ref="headerText" class="qpm_aiAccordionHeader">
            <i
              v-if="accordionProps.expanded"
              class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
            ></i>
            <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
            <i
              class="bx bx-help-circle"
              style="
                font-size: 22px;
                vertical-align: text-bottom;
                margin-left: 3px;
                margin-right: 5px;
              "
            ></i>
            {{ question }}
          </div>
        </template>

        <template #default>
          <div :style="getAnswerStyle(index)" class="qpm_answer-text">
            {{ currentSummary.answers[index + 7] }}
          </div>
        </template>
      </accordion-menu>

      <button
        v-tooltip="{
          content: getString('hoverretryText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="qpm_button"
        style="margin-top: 25px"
        @keydown.enter="handleRetry()"
        @click="handleRetry()"
      >
        <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em"></i>
        {{ getString("retryText") }}
      </button>
    </div>
  </div>
</template>

<script>
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  import { utilitiesMixin } from "@/mixins/utilities.js";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { questionHeaderHeightWatcherMixin } from "@/mixins/questionHeaderHeightWatcher.js";
  import { getShortTitle } from "@/utils/qpm-open-ai-prompts-helpers.js";
  import { sanitizePrompt } from "@/utils/qpm-open-ai-prompts-helpers.js";
  import { summarizeArticlePrompt, promptText } from "@/assets/content/qpm-open-ai-prompts.js";

  export default {
    name: "SummarizeArticle",
    components: {
      AccordionMenu,
      LoadingSpinner,
    },
    mixins: [
      utilitiesMixin,
      appSettingsMixin,
      promptRuleLoaderMixin,
      questionHeaderHeightWatcherMixin,
    ],
    props: {
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
      language: {
        type: String,
        default: "dk",
      },
      promptLanguageType: {
        type: String,
        default: "Hverdagssprog",
        required: false,
      },
      aiArticleSummaries: {
        type: Object,
        required: true,
      },
      currentSummaryIndex: {
        type: Object,
        required: true,
      },
      loading: {
        type: Boolean,
        required: true,
      },
    },
    data() {
      return {
        isArticle: false,
        isError: false,
        scrapingError: undefined,
        errorMessage: undefined,
      };
    },
    computed: {
      currentSummary() {
        const summaries = this.aiArticleSummaries[this.promptLanguageType];
        const index = this.currentSummaryIndex[this.promptLanguageType];
        return summaries && summaries[index] ? summaries[index] : { questions: [], answers: [] };
      },

      formattedAnswers() {
        if (!this.currentSummary) return "";
        return this.currentSummary.answers.join("\n\n");
      },
    },
    async mounted() {
      if (this.loading) {
        return;
      }
      await this.loadOrGenerateSummary(this.promptLanguageType);
    },
    watch: {
      /**
       * Watcher to monitor changes in aiArticleSummaries for the current promptLanguageType.
       * If the summaries array is empty, trigger summary generation.
       */
      aiArticleSummaries: {
        handler(newVal) {
          const summaries = newVal[this.promptLanguageType];
          if (summaries && summaries.length === 0 && !this.loading) {
            this.loadOrGenerateSummary(this.promptLanguageType);
          }
        },
        deep: true,
      },
      isError(newVal) {
        if (newVal) {
          this.$emit("error-state-changed", true);
        } else {
          this.$emit("error-state-changed", false);
        }
      },
    },
    methods: {
      /**
       * Navigates through the summary history.
       *
       * @param {string} direction - 'previous' or 'next'.
       */
      navigateHistory(direction) {
        const type = this.promptLanguageType;
        const maxIndex = this.aiArticleSummaries[type].length - 1;
        let newIndex = this.currentSummaryIndex[type];

        if (direction === "previous" && newIndex > 0) {
          newIndex -= 1;
        } else if (direction === "next" && newIndex < maxIndex) {
          newIndex += 1;
        }

        // Emit the new index to the parent
        this.$emit("update-current-summary-index", { promptLanguageType: type, newIndex });
      },

      /**
       * Saves the summary by emitting an event to the parent component.
       *
       * @param {string} promptLanguageType - The language type.
       * @param {Object} summaryData - The summary data containing questions and answers.
       */
      saveAiSummaryOfArticle(promptLanguageType, summaryData) {
        const summary = {
          questions: summaryData.questions,
          answers: summaryData.answers,
        };
        this.$emit("update-ai-article-summaries", { promptLanguageType, summaryData: summary });
      },

      async handleRetry() {
        this.$emit("set-loading", { promptLanguageType: this.promptLanguageType });
        // Passing true to force getting new answers for summarizing of the article
        await this.getAiSummaryOfArticle(this.promptLanguageType, true);
      },

      /**
       * Retrieves the short title for a given question.
       *
       * @param {string} question - The question text.
       * @returns {string} The short title or the original question if not found.
       */
      fetchShortTitle(question) {
        const shortTitle = getShortTitle(question, this.language);
        return shortTitle || question;
      },

      /**
       * Load or generate summary based on the current language type.
       */
      async loadOrGenerateSummary(promptLanguageType) {
        // Emit loading start
        this.$emit("set-loading", { promptLanguageType });

        const existingSummary = this.aiArticleSummaries[promptLanguageType];

        if (!existingSummary || existingSummary.length === 0) {
          await this.generateAndSaveSummary(promptLanguageType);
        } else {
          // Set loading to false if summaries exist
          this.$emit("unset-loading", { promptLanguageType });
        }
      },

      /**
       * Retrieves the summary for the specified language type.
       *
       * @param {string} promptLanguageType - The language type ('plain language' or 'professional language').
       * @param {boolean} [isRetry=false] - Whether to regenerating the summary for a new result.
       * @returns {Object|null} - The summary data or null if not found.
       */
      async getAiSummaryOfArticle(promptLanguageType, isRetry = false) {
        if (isRetry) {
          await this.generateAndSaveSummary(promptLanguageType);
        }
        const summary = this.aiArticleSummaries[promptLanguageType] || null;
        return summary;
      },

      /**
       * Generates and saves the summary.
       */
      async generateAndSaveSummary(promptLanguageType) {
        try {
          const summaryData = await this.handleSummarizeArticle(promptLanguageType);
          this.saveAiSummaryOfArticle(promptLanguageType, summaryData);
          // Emit loading end
          this.$emit("unset-loading", { promptLanguageType });
        } catch (error) {
          this.isError = true;
          this.errorMessage = "Failed to generate summary.";
          // Emit loading end on error
          this.$emit("unset-loading", { promptLanguageType });
        }
      },

      /**
       * Saves the summary by adding it to the array for the specific language type.
       *
       * @param {string} promptLanguageType - The language type.
       * @param {Object} summaryData - The summary data containing questions and answers.
       */
      saveAiSummaryOfArticle(promptLanguageType, summaryData) {
        if (!this.aiArticleSummaries[promptLanguageType]) {
          this.$set(this.aiArticleSummaries, promptLanguageType, []);
        }
        this.aiArticleSummaries[promptLanguageType].push({
          questions: summaryData.questions,
          answers: summaryData.answers,
        });
        this.currentSummaryIndex[promptLanguageType] =
          this.aiArticleSummaries[promptLanguageType].length - 1;
        this.$emit("article-summary-updated", { promptLanguageType, summaryData });
      },

      /**
       * Handles the summarization of an article, either in PDF or HTML format.
       *
       * @param {string} promptLanguageType - The current language type.
       * @returns {Promise<Object>} - The summary data.
       * @throws {Error} - Throws an error if the summarization process fails.
       */
      async handleSummarizeArticle(promptLanguageType) {
        try {
          this.isError = false;
          this.errorMessage = undefined;
          let articleSummaryData;

          if (this.pdfUrl) {
            console.log("PDF article URL: ", this.pdfUrl);
            articleSummaryData = await this.getSummarizePDFArticle(promptLanguageType);
          }

          if (this.htmlUrl && !this.pdfUrl) {
            console.log("HTML article URL: ", this.htmlUrl);
            articleSummaryData = await this.getSummarizeHTMLArticle(promptLanguageType);
          }

          if (articleSummaryData.isArticle) {
            if (articleSummaryData.questions.length > articleSummaryData.answers.length) {
              articleSummaryData.questions.pop();
            }

            this.isError = false;
            return {
              questions: articleSummaryData.questions,
              answers: articleSummaryData.answers,
            };
          } else {
            throw new Error("The content is not recognized as an article.");
          }
        } catch (error) {
          this.isError = true;
          this.errorMessage = error.message || "An error occurred during summarization.";
          console.error("Error during summarization:", error);
          throw error;
        }
      },

      /**
       * Retrieve the questions from the prompt text
       *
       * @param {Object.<string, {question: string, shortTitle: string}[]>} promptQuestionsMap
       * @returns {Object.<string, string>} Transformed promptQuestions with concatenated questions.
       */
      extractQuestionsFromPromptTextQuestions(promptQuestionsMap) {
        const transformed = {};

        for (const [lang, questions] of Object.entries(promptQuestionsMap)) {
          transformed[lang] = questions.map((q) => q.question.trim()).join("\n");
        }
        return transformed;
      },

      /**
       * Retrieves a prompt based on the specified language and prompt language type.
       * Can be used in question-for-article for prompting with the questions given by the user,
       * or be used in summarize-article and summarize-article-no-abstract for prompting with the default questions aswell as the genere
       * @param {string} [language="dk"] - The language code for the prompt (default is "dk").
       * @param {string} [promptLanguageType="Hverdagssprog"] - The type of prompt language (default is "Hverdagssprog").
       * @returns {string} - The localized prompt.
       */
      getComposablePrompt(language = "dk", promptLanguageType = "Hverdagssprog") {
        // Find the prompt text for either of the language types "Hverdagssprog" or "Fagligt sprog"
        const prompTextLanguageType = promptText.find(
          (entry) => entry.name[language] === promptLanguageType
        );

        const promptQuestionsOnly = this.extractQuestionsFromPromptTextQuestions(
          prompTextLanguageType.questions
        );

        const domainSpecificRules = this.domainSpecificPromptRules[language];
        const promptStartText = prompTextLanguageType.startText[language];
        const promptQuestions = promptQuestionsOnly[language];
        const promptQuestionsExtra = prompTextLanguageType.questionsExtra[language];
        const promptRules = prompTextLanguageType.promptRules[language];
        const promptEndText = prompTextLanguageType.endText[language];

        // Compose the prompt text with default prompt questions without the user input questions
        let composedPromptText = `${domainSpecificRules} ${promptStartText} ${promptQuestions} ${promptQuestionsExtra} ${promptEndText}`;

        // Compose the prompt text with user questions if userQuestionInput is not empty
        if (this.userQuestionInput) {
          composedPromptText = `${domainSpecificRules} ${promptStartText} ${this.userQuestionInput} ${promptRules} ${promptEndText}`;
        }

        console.info(
          `|Language|\n${language}\n\n|Prompt language type|\n${promptLanguageType}\n\n|Domain specific rules|\n${domainSpecificRules}\n\n|Start text|\n${promptStartText}\n` +
            `${
              this.userQuestionInput
                ? `\n\n|User questions|\n${this.userQuestionInput}\n\n|Rules|\n${promptRules}\n`
                : `\n|Questions|\n${promptQuestions}\n\n|QuestionsExtra|\n${promptQuestionsExtra}\n`
            }` +
            `\n\n|End text|\n${promptEndText}\n`
        );

        // Sanitize the composed prompt text
        let sanitizedComposedPromptText = sanitizePrompt({
          [language]: composedPromptText,
        });

        // Get the basic prompt for the given language type
        let languageSpecificPrompt = summarizeArticlePrompt.find((p) => {
          return promptLanguageType == p.name;
        });

        // Set the prompt field to the sanitized composed prompt text for the given language
        languageSpecificPrompt.prompt = sanitizedComposedPromptText[language];

        return languageSpecificPrompt;
      },

      /**
       * Summarizes an HTML article by sending a request to the relevant backend function.
       *
       * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
       * @throws {Error} Throws an error if the fetch request fails.
       */
      async getSummarizeHTMLArticle(promptLanguageType) {
        const openAiServiceUrl = this.appSettings.openAi.baseUrl + "/api/SummarizeHTMLArticle";
        const localePrompt = this.getComposablePrompt(this.language, promptLanguageType);

        try {
          const response = await this.handleFetch(
            openAiServiceUrl,
            {
              prompt: localePrompt,
              htmlurl: this.htmlUrl,
              client: this.appSettings.client,
            },
            "POST",
            "getSummarizeHTMLArticle"
          );

          // Instead of response.json(), get the text and sanitize it
          const rawText = await response.text();
          const sanitizedText = this.sanitizeResponse(rawText);

          // Parse the sanitized JSON
          const data = JSON.parse(sanitizedText);

          this.scrapingError = false;
          this.isArticle = data.isArticle;

          // Handle empty responses
          if (data.questions.length < 1) {
            this.scrapingError = true;
          }

          return data;
        } catch (error) {
          this.isArticle = false;
          this.isError = true;
          this.errorMessage = "Failed to summarize HTML article.";
          console.error("Error parsing summary:", error);
          throw error;
        }
      },

      /**
       * Summarizes a PDF article by sending a request to the relevant backend function.
       *
       * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
       * @throws {Error} Throws an error if the fetch request fails.
       */
      async getSummarizePDFArticle(promptLanguageType) {
        const openAiServiceUrl = this.appSettings.openAi.baseUrl + "/api/SummarizePDFArticle";
        const localePrompt = this.getComposablePrompt(this.language, promptLanguageType);

        try {
          const response = await this.handleFetch(
            openAiServiceUrl,
            {
              prompt: localePrompt,
              pdfurl: this.pdfUrl,
              client: this.appSettings.client,
            },
            "POST",
            "getSummarizePDFArticle"
          );

          // Instead of response.json(), get the text and sanitize it
          const rawText = await response.text();
          const sanitizedText = this.sanitizeResponse(rawText);

          // Parse the sanitized JSON
          const data = JSON.parse(sanitizedText);

          this.isArticle = data.isArticle;

          return data;
        } catch (error) {
          this.isArticle = false;
          this.isError = true;
          this.errorMessage = "Failed to summarize PDF article.";
          console.error("Error parsing summary:", error);
          throw error;
        }
      },
    },
  };
</script>
