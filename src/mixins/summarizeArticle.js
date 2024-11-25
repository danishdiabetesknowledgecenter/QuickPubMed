import {
  summarizeArticlePrompt,
  promptEndTextPlainLanguage,
  promptEndTextProfessionelLanguage,
  promptStartText,
  promptQuestions,
  promptArticleSpecificAnswersOnly,
  sanitizePrompt,
} from "@/assets/content/qpm-openAiPrompts";

/**
 * Mixin for common methods used in both summarize-article and summarize-article-no-abstract components.
 * @mixin
 */
export const summarizeArticleMixin = {
  methods: {
    /**
     * Retrieves a prompt based on the specified language and prompt language type.
     * Can be used in question-for-article for prompting with the questions given by the user,
     * or be used in summarize-article and summarize-article-no-abstract for prompting with the default questions aswell as the genere
     * @param {string} [language="dk"] - The language code for the prompt (default is "dk").
     * @param {string} [promptLanguageType="Hverdagssprog"] - The type of prompt language (default is "Hverdagssprog").
     * @returns {string} - The localized prompt.
     */
    getComposablePrompt(language = "dk", promptLanguageType = "Hverdagssprog") {
      // Find the prompt that matches the languagetype
      let languageSpecificPrompt = summarizeArticlePrompt.find((p) => {
        return promptLanguageType == p.name;
      });

      // Determine the ending text based on the promptName
      let promptEndText;
      if (promptLanguageType == "Hverdagssprog") {
        promptEndText = promptEndTextPlainLanguage[language];
      } else if (promptLanguageType == "Fagsprog") {
        promptEndText = promptEndTextProfessionelLanguage[language];
      }
      console.log("Using prompt rules for domain: ", this.appSettings.openAi.domain);

      // Load the domain specific rules for the language
      let domainSpecificRules = this.getDomainSpecificPromptRules(
        this.appSettings.openAi.domain,
        language
      );

      // Compose the prompt text with default prompt questions without the user input questions
      let promptText = `${domainSpecificRules} ${promptStartText[language]} ${promptQuestions[language]} ${promptArticleSpecificAnswersOnly[language]} ${promptEndText}`;

      // Compose the prompt text with user questions if userQuestionInput is not empty
      if (this.userQuestionInput) {
        promptText = `${domainSpecificRules} ${promptStartText[language]} ${this.userQuestionInput} ${promptArticleSpecificAnswersOnly[language]} ${promptEndText}`;
      }

      // Sanitize the composed prompt text
      let sanitizedPromptText = sanitizePrompt({
        [language]: promptText,
      });

      languageSpecificPrompt.prompt = sanitizedPromptText[language];

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
        console.error("Error fetching:", error);
        this.errorMessage = "Netværksfejl prøv igen";
        this.isError = true;
        console.error(this.errorMessage);
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

      let response = await this.handleFetch(openAiServiceUrl, {
        prompt: localePrompt,
        htmlurl: this.htmlUrl,
        client: this.appSettings.client,
      }).catch(function (error) {
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

      let response = await this.handleFetch(openAiServiceUrl, {
        prompt: localePrompt,
        pdfurl: this.pdfUrl,
        client: this.appSettings.client,
      }).catch(function (error) {
        this.isArticle = false;
        return error;
      });

      response = await response.json();

      this.isArticle = response.isArticle;
      this.questions = response.questions;
      this.answers = response.answers;
      return response;
    },
    /**
     * For now if the pubType array contains "Editorial" then we don't want to summarize the article
     *
     * @returns {Boolean} Wheter or not the pubtype allows for summarization
     */
    checkPubType: function (pubType) {
      if (pubType && pubType.includes("Editorial")) {
        return false;
      }
      return true;
    },
  },
};
