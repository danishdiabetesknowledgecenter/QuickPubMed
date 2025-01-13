<template>
  <div v-if="!isError" ref="container" style="margin-top: 20px">
    <loading-spinner
      class="qpm_searchSummaryText"
      :wait-text="getString('aiSummaryWaitText')"
      :wait-duration-disclaimer="getString('aiLongWaitTimeDisclaimer')"
      :loading="loading"
      style="align-self: center; padding-top: 30px"
    />

    <!-- TITLE summarize entire article -->
    <p v-if="!loading && currentSummary.length > 0 && !isError" style="padding-top: 10px">
      <strong>{{ getString("summarizeArticleHeader") }}</strong>
    </p>

    <div v-if="!loading && currentSummary.length > 0 && !isError && getTotalSummaries() > 1">
      <button
        style="margin-top: -3px; border: 0px"
        class="qpm_summary_icon bx bx-chevron-left"
        :disabled="currentSummaryIndex[promptLanguageType] === 0"
        @click="navigateHistory('previous')"
      />
      <span style="padding: 0px 3px">
        {{ currentSummaryIndex[promptLanguageType] + 1 }} /
        {{ getTotalSummaries() }}
      </span>
      <button
        style="margin-top: -3px; border: 0px"
        class="qpm_summary_icon bx bx-chevron-right"
        :disabled="currentSummaryIndex[promptLanguageType] === getTotalSummaries() - 1"
        @click="navigateHistory('next')"
      />
    </div>

    <div v-if="!loading && currentSummary.length > 0 && !isError">
      <!-- Display all Q&A summaries -->
      <div v-for="(qa, index) in currentSummary.slice(0, 7)" :key="index">
        <accordion-menu
          :key="`${promptLanguageType}-${currentSummaryIndex[promptLanguageType]}-${index}`"
          :title="qa.shortTitle"
          :open-by-default="false"
        >
          <template #header="accordionProps">
            <div class="qpm_aiAccordionHeader">
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
              {{ qa.shortTitle }}
            </div>
          </template>

          <template #default>
            <div class="qpm_answer-text">
              {{ qa.answer }}
            </div>
          </template>
        </accordion-menu>
      </div>

      <!-- TITLE additional questions for the article -->
      <p v-if="!loading && currentSummary.length > 0 && !isError" style="padding-top: 10px">
        <strong>{{ getString("generateQuestionsHeader") }}</strong>
      </p>
      <div v-for="(qa, index) in currentSummary.slice(7)" :key="index + 7">
        <accordion-menu
          :key="`${promptLanguageType}-extra-${currentSummaryIndex[promptLanguageType]}-${index}`"
          :title="qa.shortTitle"
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
              {{ qa.question }}
            </div>
          </template>

          <template #default>
            <div :style="getAnswerStyle(index)" class="qpm_answer-text">
              {{ qa.answer }}
            </div>
          </template>
        </accordion-menu>
      </div>

      <button
        v-tooltip="{
          content: getString('hoverretryText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="qpm_button"
        style="margin-top: 25px"
        @keydown.enter="handleRetry"
        @click="handleRetry"
      >
        <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em"></i>
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
        :disabled="loading || currentSummary.length === 0"
        @click="clickCopy"
      >
        <i class="bx bx-copy" style="vertical-align: baseline" />
        {{ getString("copyText") }}
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
      authorsList: {
        type: String,
        required: false,
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
        isError: false,
        scrapingError: undefined,
        errorMessage: undefined,
      };
    },
    computed: {
      currentSummary() {
        const summariesArray = this.aiArticleSummaries[this.promptLanguageType];
        const index = this.currentSummaryIndex[this.promptLanguageType];
        if (Array.isArray(summariesArray) && summariesArray.length > index && index >= 0) {
          return summariesArray[index].articleSummaryData;
        }
        return [];
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
        this.$emit("error-state-changed", newVal);
      },
    },
    methods: {
      async clickCopy() {
        console.log("Current article summary copied to the clipboard.");
        if (this.currentSummary.length > 0) {
          const textToCopy =
            this.authorsList.trim() +
            ". " +
            this.searchResultTitle +
            this.publicationInfo +
            ". " +
            "\n\n\n" +
            this.currentSummary
              .map((qa, index) =>
                index < 7 ? `${qa.shortTitle}\n${qa.answer}` : `${qa.question}\n${qa.answer}`
              )
              .join("\n\n");
          await navigator.clipboard.writeText(textToCopy);
        }
      },
      /**
       * Returns the total number of summaries for the current promptLanguageType.
       */
      getTotalSummaries() {
        const summariesArray = this.aiArticleSummaries[this.promptLanguageType];
        if (
          Array.isArray(summariesArray) &&
          summariesArray.length > 0 &&
          summariesArray[0].articleSummaryData.length > 0
        ) {
          return summariesArray.length;
        }
        return 0;
      },

      /**
       * Navigate through the summaries.
       * @param {string} direction - 'previous' or 'next'
       */
      navigateHistory(direction) {
        const summariesArray = this.aiArticleSummaries[this.promptLanguageType];
        if (!Array.isArray(summariesArray) || summariesArray.length === 0) return;

        const maxIndex = summariesArray.length - 1;
        let current = this.currentSummaryIndex[this.promptLanguageType];

        if (direction === "previous") {
          current = current > 0 ? current - 1 : 0;
        } else if (direction === "next") {
          current = current < maxIndex ? current + 1 : maxIndex;
        }

        this.$emit("update-current-summary-index", {
          promptLanguageType: this.promptLanguageType,
          newIndex: current,
        });
      },

      /**
       * Emits the new summary to the parent component.
       *
       * @param {Object} summaryData - The summary object containing shortTitle, question, and answer.
       */
      saveAiSummaryOfArticle(promptLanguageType, summaryData) {
        this.$emit("update-ai-article-summaries", {
          promptLanguageType: promptLanguageType,
          summaryData: summaryData,
        });
      },

      async handleRetry() {
        this.$emit("set-loading", { promptLanguageType: this.promptLanguageType });
        // Passing true to force getting new answers for summarizing of the article
        await this.getAiSummaryOfArticle(this.promptLanguageType, true);
      },

      /**
       * Retrieves the short title for a given question.
       *
       * @param {Object} qa - The question and answer object.
       * @returns {string} The short title.
       */
      fetchShortTitle(qa) {
        return qa.shortTitle || "Untitled";
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
        } finally {
          this.$emit("unset-loading", { promptLanguageType });
        }
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

        const domainSpecificRules = this.domainSpecificPromptRules[language];
        const promptStartText = prompTextLanguageType.startText[language];
        //const promptQuestions = promptQuestionsOnly[language];
        const promptQuestionsWithShortTitle = prompTextLanguageType.questions[language];
        const questionsString = JSON.stringify(promptQuestionsWithShortTitle, null, 2);

        const promptQuestionsExtra = prompTextLanguageType.questionsExtra[language];
        const promptRules = prompTextLanguageType.promptRules[language];
        const promptEndText = prompTextLanguageType.endText[language];

        // Compose the prompt text with default prompt questions without the user input questions
        let composedPromptText = `${domainSpecificRules} ${promptStartText} ${questionsString} ${promptQuestionsExtra} ${promptRules} ${promptEndText}`;

        console.info(
          `|Language|\n${language}\n\n|Prompt language type|\n${promptLanguageType}\n\n|Domain specific rules|\n${domainSpecificRules}\n\n|Start text|\n${promptStartText}\n` +
            `\n|Questions|\n${questionsString}\n\n|QuestionsExtra|\n${promptQuestionsExtra}\n\n|Rules|\n${promptRules}\n` +
            `\n|End text|\n${promptEndText}\n`
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

          this.isError = false;
          return {
            articleSummaryData,
          };
        } catch (error) {
          this.isError = true;
          this.errorMessage = error.message || "An error occurred during summarization.";
          console.error("Error during summarization:", error);
          throw error;
        }
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

          // Handle empty responses
          if (data.questions.length < 1) {
            this.scrapingError = true;
          }

          return data;
        } catch (error) {
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
          return data;
        } catch (error) {
          this.isError = true;
          this.errorMessage = "Failed to summarize PDF article.";
          console.error("Error parsing summary:", error);
          throw error;
        }
      },
    },
  };
</script>
