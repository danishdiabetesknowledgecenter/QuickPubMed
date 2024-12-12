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
      isLoadingQuestions: true,
    };
  },
  methods: {
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
      let composedPromptText = `${domainSpecificRules} ${promptStartText} ${promptQuestions} ${promptQuestionsExtra} ${promptRules} ${promptEndText}`;

      // Compose the prompt text with user questions if userQuestionInput is not empty
      if (this.userQuestionInput) {
        composedPromptText = `${domainSpecificRules} ${promptStartText} ${this.userQuestionInput} ${promptRules} ${promptEndText}`;
      }

      console.info(`
        |Domain specific rules|
        ${domainSpecificRules}
        
        |Start text|
        ${promptStartText}
        
        ${
          !this.userQuestionInput
            ? `|Questions|\n${promptQuestions}\n
        |QuestionsExtra|\n${promptQuestionsExtra}`
            : `|User questions|\n${this.userQuestionInput}\n`
        }
        
        |Rules|
        ${promptRules}
        
        |End text|
        ${promptEndText}
        `);

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
     * @returns {Promise<void>} A promise that resolves when the summarization is complete.
     * @throws {Error} Throws an error if the summarization process fails.
     */
    async handleSummarizeArticle() {
      try {
        this.isError = false;
        this.errorMessage = undefined;
        this.questions = [];
        this.answers = [];
        this.isLoadingQuestions = true; // Set loading state to true

        if (this.pdfUrl) {
          console.log("PDF article URL: ", this.pdfUrl);
          await this.getSummarizePDFArticle();
        }

        if (this.htmlUrl && !this.pdfUrl) {
          console.log("HTML article URL: ", this.htmlUrl);
          await this.getSummarizeHTMLArticle();
        }

        if (this.isArticle) {
          if (this.questions.length > this.answers.length) {
            // Remove the last question if there's a discrepancy
            console.log(
              `Response contained ${this.questions.length} Q's and ${this.answers.length} A's `
            );
            this.questions.pop();
          }
          console.log({ questions: this.questions, answers: this.answers });
          this.isError = false;
        }
      } catch (error) {
        this.isError = true;
      } finally {
        this.isLoadingQuestions = false;
      }
    },
    /**
     * Summarizes an HTML article by sending a request to the relevant backend function.
     *
     * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
     * @throws {Error} Throws an error if the fetch request fails.
     */
    async getSummarizeHTMLArticle() {
      const openAiServiceUrl = this.appSettings.openAi.baseUrl + "/api/SummarizeHTMLArticle";
      const localePrompt = this.getComposablePrompt(this.language, this.promptLanguageType);

      let response = await this.handleFetch(
        openAiServiceUrl,
        {
          prompt: localePrompt,
          htmlurl: this.htmlUrl,
          client: this.appSettings.client,
        },
        "POST",
        "getSummarizeHTMLArticle"
      ).catch(function (error) {
        this.isArticle = false;
        return error;
      });

      response = await response.json();
      this.scrapingError = false;
      this.isArticle = response.isArticle;
      this.questions = response.questions;
      this.answers = response.answers;

      // in case the resource didn't have time to load the javaScript and therefor returned "blank" html
      // Questions and answers will be empty and we set the scrapingError to true to indicate the user should try again
      if (response.questions.length < 1) {
        this.scrapingError = true;
      }

      return response;
    },
    /**
     * Summarizes a PDF article by sending a request to the relevant backend function.
     *
     * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
     * @throws {Error} Throws an error if the fetch request fails.
     */
    async getSummarizePDFArticle() {
      const openAiServiceUrl = this.appSettings.openAi.baseUrl + "/api/SummarizePDFArticle";
      const localePrompt = this.getComposablePrompt(this.language, this.promptLanguageType);

      let response = await this.handleFetch(
        openAiServiceUrl,
        {
          prompt: localePrompt,
          pdfurl: this.pdfUrl,
          client: this.appSettings.client,
        },
        "POST",
        "getSummarizePDFArticle"
      ).catch(function (error) {
        this.isArticle = false;
        return error;
      });

      response = await response.json();

      this.isArticle = response.isArticle;
      this.questions = response.questions;
      this.answers = response.answers;
      return response;
    },
  },
};
