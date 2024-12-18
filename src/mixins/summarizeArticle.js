import { sanitizePrompt } from "@/utils/qpm-open-ai-prompts-helpers.js";
import { summarizeArticlePrompt, promptText } from "@/assets/content/qpm-open-ai-prompts.js";

/**
 * Mixin for common methods used in both summarize-article and summarize-article-no-abstract components.
 * @mixin
 */
export const summarizeArticleMixin = {
  data() {
    return {
      isArticle: false,
      scrapingError: undefined,
      isError: false,
      errorMessage: undefined,
      questions: [],
      answers: [],
      aiArticleSummaries: {},
      loadingQuestions: {},
    };
  },
  methods: {
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
     * Generates a summary and saves it under the specified language type.
     *
     * @param {string} promptLanguageType - The language type ('plain language' or 'professional language').
     */
    async generateAndSaveSummary(promptLanguageType) {
      try {
        this.setLoadingState(promptLanguageType, true);
        const summaryData = await this.handleSummarizeArticle(promptLanguageType);
        this.saveAiSummaryOfArticle(promptLanguageType, summaryData);
      } catch (error) {
        this.isError = true;
        this.errorMessage = "Failed to generate summary.";
      } finally {
        this.setLoadingState(promptLanguageType, false);
      }
    },
    /**
     * Saves the summary for the specified language type.
     *
     * @param {string} promptLanguageType - The language type ('plain language' or 'professional language').
     * @param {Object} summaryData - The summary data containing questions and answers.
     */
    saveAiSummaryOfArticle(promptLanguageType, summaryData) {
      if (!this.aiArticleSummaries[promptLanguageType]) {
        this.$set(this.aiArticleSummaries, promptLanguageType, {
          questions: [],
          answers: [],
        });
      }
      this.aiArticleSummaries[promptLanguageType].questions = summaryData.questions;
      this.aiArticleSummaries[promptLanguageType].answers = summaryData.answers;
      console.log(`Summary saved for "${promptLanguageType}":`, summaryData);
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
        this.questions = [];
        this.answers = [];

        if (this.pdfUrl) {
          console.log("PDF article URL: ", this.pdfUrl);
          await this.getSummarizePDFArticle(promptLanguageType);
        }

        if (this.htmlUrl && !this.pdfUrl) {
          console.log("HTML article URL: ", this.htmlUrl);
          await this.getSummarizeHTMLArticle(promptLanguageType);
        }

        if (this.isArticle) {
          if (this.questions.length > this.answers.length) {
            this.questions.pop();
          }
          console.log({ questions: this.questions, answers: this.answers });
          this.isError = false;
          return {
            questions: this.questions,
            answers: this.answers,
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
     * Sets the loading state for a specific language type.
     *
     * @param {string} promptLanguageType - The language type.
     * @param {boolean} state - The loading state to set.
     */
    setLoadingState(promptLanguageType, state) {
      this.$set(this.loadingQuestions, promptLanguageType, state);
    },

    /**
     * Retrieves the loading state for a specific language type.
     *
     * @param {string} promptLanguageType - The language type.
     * @returns {boolean} - The loading state.
     */
    isLoading(promptLanguageType) {
      return this.loadingQuestions[promptLanguageType] || false;
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
        this.questions = data.questions;
        this.answers = data.answers;

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
        this.questions = data.questions;
        this.answers = data.answers;

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
