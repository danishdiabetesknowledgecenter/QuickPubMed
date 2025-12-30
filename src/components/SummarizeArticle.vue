<template>
  <div v-if="!isError" ref="container" style="margin-top: 20px">  
    <!-- Heading telling that summarize entire article is available -->
    <p v-if="loading && !isError" style="padding-top: 10px">
      <strong>{{ getString("summarizeArticleAvailable") }}</strong>
    </p>

    <loading-spinner
      v-if="!streamingText && streamingItems.length === 0"
      class="qpm_searchSummaryText"
      :wait-text="getString('aiSummaryWaitText')"
      :wait-duration-disclaimer="getString('aiLongWaitTimeDisclaimer')"
      :loading="loading"
      style="align-self: center; padding-top: 50px"
    />
    
    <!-- Show streaming items progressively while loading -->
    <div v-if="loading && validStreamingItems.length > 0">
      <!-- Opsummering af hele artiklen (first 7 items) -->
      <p style="padding-top: 10px">
        <strong>{{ getString("summarizeArticleHeader") }}</strong>
      </p>
      <div v-for="(qa, index) in validStreamingItems.slice(0, 7)" :key="'streaming-' + index">
        <accordion-menu
          :title="qa.shortTitle || '...'"
          :open-by-default="false"
        >
          <template #header="accordionProps">
            <div class="qpm_aiAccordionHeader">
              <i
                v-if="accordionProps.expanded"
                class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
              ></i>
              <i 
                v-else 
                class="bx bx-chevron-down qpm_aiAccordionHeaderArrows" 
              ></i>
              <i class="bx bx-detail"></i>
              {{ qa.shortTitle || '...' }}
              <span v-if="qa.isStreaming" style="display: inline-flex; align-items: center; margin-left: 8px;">
                <loading-spinner :loading="true" :size="16" style="display: inline-block;" />
              </span>
            </div>
          </template>
          <template #default>
            <div class="qpm_answer-text">
              {{ qa.answer || '' }}
            </div>
          </template>
        </accordion-menu>
      </div>
      
      <!-- Spørgsmål til denne artikel (items from index 7+) - only show header when first question starts streaming -->
      <template v-if="validStreamingItems.length > 7">
        <p style="padding-top: 10px">
          <strong>{{ getString("generateQuestionsHeader") }}</strong>
        </p>
        <div v-for="(qa, index) in validStreamingItems.slice(7)" :key="'streaming-extra-' + index">
          <accordion-menu
            :title="qa.question || qa.shortTitle || '...'"
            :open-by-default="false"
          >
            <template #header="accordionProps">
              <div class="qpm_aiAccordionHeader" style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center;">
                  <i
                    class="bx bx-help-circle"
                    style="font-size: 22px; vertical-align: text-bottom; margin-right: 5px;"
                  ></i>
                  <div style="display: flex; align-items: center;">
                    {{ qa.question || qa.shortTitle || '...' }}
                    <span v-if="qa.isStreaming" style="display: inline-flex; align-items: center; margin-left: 8px;">
                      <loading-spinner :loading="true" :size="16" style="display: inline-block;" />
                    </span>
                  </div>
                </div>
                <div>
                  <i
                    v-if="accordionProps.expanded"
                    class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
                  ></i>
                  <i 
                    v-else 
                    class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
                  ></i>
                </div>
              </div>
            </template>
            <template #default>
              <div class="qpm_answer-text">
                {{ qa.answer || '' }}
              </div>
            </template>
          </accordion-menu>
        </div>
      </template>
      
      <!-- Show waiting indicator at the bottom while streaming (not on last item) -->
      <div v-if="showWaitingIndicator" class="qpm_streaming-loading">
        <span>{{ getString("aiGeneratingText") }}<span class="qpm_animated-dots"></span></span>
      </div>
    </div>
    
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
                class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
              ></i>
              <i 
                v-else 
                class="bx bx-chevron-down qpm_aiAccordionHeaderArrows" 
              ></i>
              <i
                class="bx bx-detail"
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
            <div ref="headerText" class="qpm_aiAccordionHeader" style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex;">
                <i
                class="bx bx-help-circle"
                style="
                  font-size: 22px;
                  vertical-align: text-bottom;
                  margin-right: 5px;
                "
                ></i>
                <div>
                  {{ qa.question }}
                </div>
              </div>
              <div>
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
                ></i>
                <i 
                  v-else 
                  class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
                ></i>
              </div>
            </div>
          </template>

          <template #default>
<!--        <div :style="getAnswerStyle(index)" class="qpm_answer-text"> -->
            <div class="qpm_answer-text">
              {{ qa.answer }}
            </div>
          </template>
        </accordion-menu>
      </div>
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
  import {
    summarizeArticlePrompt,
    promptText,
  } from "@/assets/content/qpm-open-ai-article-prompts.js";

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
        streamingText: "",
        streamingItems: [], // Parsed Q&A items shown progressively
        streamingComplete: false, // True when JSON array is fully received
        expectedTotalItems: null, // Total items expected from LLM (parsed from totalItems field)
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
      /**
       * Returns only valid streaming items (with shortTitle defined)
       */
      validStreamingItems() {
        return this.streamingItems.filter(item => item && item.shortTitle);
      },
      
      /**
       * Returns true if any streaming item is still being streamed
       */
      hasStreamingItem() {
        return this.streamingItems.some(item => item && item.isStreaming);
      },
      
      /**
       * Returns true if we're currently streaming the last item
       */
      isStreamingLastItem() {
        if (!this.loading) return false;
        if (this.expectedTotalItems !== null && this.validStreamingItems.length >= this.expectedTotalItems) {
          return true;
        }
        if (this.streamingComplete) {
          return true;
        }
        return false;
      },
      
      /**
       * Returns true if we should show the "more items coming" indicator
       * Shows while loading and there's content, but not when the last item is streaming
       */
      showWaitingIndicator() {
        if (!this.loading || this.validStreamingItems.length === 0) {
          return false;
        }
        // Hide when streaming the last item
        if (this.isStreamingLastItem) {
          return false;
        }
        return true;
      },
      
      /**
       * Formats streaming text to look nice for the user.
       * Extracts answers from JSON and displays them cleanly.
       */
      formattedStreamingText() {
        if (!this.streamingText) return "";
        
        // Try to extract readable content from the JSON stream
        let text = this.streamingText;
        
        // Extract answer contents - look for "answer": "..." patterns
        const answerMatches = text.match(/"answer"\s*:\s*"([^"]*)/g);
        if (answerMatches && answerMatches.length > 0) {
          // Format extracted answers nicely
          const answers = answerMatches.map((match, index) => {
            const content = match.replace(/"answer"\s*:\s*"/, "");
            return content;
          });
          
          // Join answers with line breaks and format
          let formattedText = answers.join("\n\n");
          
          // Clean up escape characters
          formattedText = formattedText
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\t/g, "  ");
          
          // Convert newlines to <br> for HTML display
          return formattedText.replace(/\n/g, "<br>");
        }
        
        // If no answers found yet, show a clean message
        if (text.length < 50) {
          return "";
        }
        
        // Fallback: clean up raw JSON to be more readable
        let cleanText = text
          .replace(/^\s*\[\s*/, "")
          .replace(/\{"shortTitle":/g, "\n<strong>")
          .replace(/"question"\s*:\s*"/g, "</strong><br><em>")
          .replace(/"answer"\s*:\s*"/g, "</em><br>")
          .replace(/",\s*$/g, "")
          .replace(/\\n/g, "<br>")
          .replace(/\\"/g, '"')
          .replace(/"\s*}/g, "")
          .replace(/,\s*{/g, "<br><br>");
        
        return cleanText;
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
      /**
       * Emit event when last item streaming starts so parent can show user questions section
       */
      isStreamingLastItem(newVal) {
        if (newVal) {
          this.$emit("last-item-streaming-started");
        }
      },
    },
    methods: {
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
       * @param {string} [language="dk"] - The language code for the prompt (default is "dk").
       * @param {string} [promptLanguageType="Hverdagssprog"] - The type of prompt language (default is "Hverdagssprog").
       * @returns {string} - The localized prompt.
       */
      getComposablePrompt(language = "dk", promptLanguageType = "Hverdagssprog") {
        // Find the prompt text for either of the language types "Hverdagssprog" or "Fagligt sprog"
        // Note: promptLanguageType is always in Danish, so we match against the Danish name
        const prompTextLanguageType = promptText.find(
          (entry) => entry.name.dk === promptLanguageType
        );

        const domainSpecificRules = this.domainSpecificPromptRules[language];
        const promptLanguageTypeText = prompTextLanguageType.languageType[language];
        const promptStartText = prompTextLanguageType.startText[language];
        //const promptQuestions = promptQuestionsOnly[language];
        const promptQuestionsWithShortTitle = prompTextLanguageType.questions[language];
        const questionsString = JSON.stringify(promptQuestionsWithShortTitle, null, 2);

        const promptQuestionsExtra = prompTextLanguageType.questionsExtra[language];
        const promptRules = prompTextLanguageType.promptRules[language];
        const promptEndText = prompTextLanguageType.endText[language];

        // Compose the prompt text with default prompt questions without the user input questions
        let composedPromptText = `${domainSpecificRules} ${promptLanguageTypeText} ${promptStartText} ${questionsString} ${promptQuestionsExtra} ${promptEndText}`;

        console.info(
          `|Language|\n${language}\n\n|Prompt language type|\n${promptLanguageType}\n\n|Domain specific rules|\n${domainSpecificRules}\n\n|Start text|\n${promptLanguageTypeText}\n\n|Start text|\n${promptStartText}\n` +
            `\n|Questions|\n${questionsString}\n\n|QuestionsExtra|\n${promptQuestionsExtra}\n` +
            `\n|End text|\n${promptEndText}\n`
        );

        // Sanitize the composed prompt text
        let sanitizedComposedPromptText = sanitizePrompt({
          [language]: composedPromptText,
        });

        // Get the basic prompt for the given language type
        // The promptLanguageType comes in as the Danish name (e.g., "Hverdagssprog" or "Fagsprog")
        // We need to find the matching entry in summarizeArticlePrompt
        let languageSpecificPrompt = summarizeArticlePrompt.find((p) => {
          // Compare directly with promptLanguageType since both use Danish names
          return p.name === promptLanguageType;
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
       * Uses streaming to show text as it arrives.
       *
       * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
       * @throws {Error} Throws an error if the fetch request fails.
       */
      async getSummarizeHTMLArticle(promptLanguageType) {
        const openAiServiceUrl = this.appSettings.openAi.azureFunctionUrl + "/api/SummarizeHTMLArticle";
        const localePrompt = this.getComposablePrompt(this.language, promptLanguageType);

        // Build the request body (URL sent via header to bypass WAF body scanning)
        const requestBody = {
          prompt: localePrompt,
          client: this.appSettings.client,
        };

        // Log everything being sent to the API
        console.info(
          `=== OpenAI API Request (HTML Article) ===`,
          '\n\n|URL|\n', openAiServiceUrl,
          '\n\n|HTML URL (via header)|\n', this.htmlUrl,
          '\n\n|Client|\n', this.appSettings.client,
          '\n\n|Model|\n', localePrompt.model,
          '\n\n|Max Output Tokens|\n', localePrompt.max_output_tokens,
          '\n\n|Reasoning Effort|\n', localePrompt.reasoning?.effort,
          '\n\n|Stream|\n', localePrompt.stream,
          '\n\n|Prompt (full text)|\n', localePrompt.prompt,
          '\n\n|Complete Request Body|\n', JSON.stringify(requestBody, null, 2)
        );

        try {
          // Reset streaming state
          this.streamingText = "";
          this.streamingItems = [];
          this.streamingComplete = false;
          this.expectedTotalItems = null;

          // Send HTML URL via header to bypass WAF body scanning
          const response = await this.handleFetch(
            openAiServiceUrl,
            requestBody,
            "POST",
            "getSummarizeHTMLArticle",
            { "X-Html-Url": this.htmlUrl }
          );

          // Use streaming to read response
          const rawText = await this.readStreamingResponse(response);
          const sanitizedText = this.sanitizeResponse(rawText);

          // Clear streaming state before showing parsed result
          this.streamingText = "";
          this.streamingItems = [];

          // Parse the sanitized JSON
          const parsed = JSON.parse(sanitizedText);
          
          // Handle both old format (array) and new format (object with items)
          const data = Array.isArray(parsed) ? parsed : (parsed.items || []);

          this.scrapingError = false;

          // Handle empty responses
          if (data.length < 1) {
            console.error("Data array is empty");
            this.scrapingError = true;
          }

          return data;
        } catch (error) {
          this.streamingText = "";
          this.streamingItems = [];
          this.isError = true;
          this.errorMessage = "Failed to summarize HTML article.";
          console.error("Error parsing summary:", error);
          throw error;
        }
      },

      /**
       * Summarizes a PDF article by sending a request to the relevant backend function.
       * Uses streaming to show text as it arrives.
       *
       * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
       * @throws {Error} Throws an error if the fetch request fails.
       */
      async getSummarizePDFArticle(promptLanguageType) {
        const openAiServiceUrl = this.appSettings.openAi.azureFunctionUrl + "/api/SummarizePDFArticle";
        const localePrompt = this.getComposablePrompt(this.language, promptLanguageType);

        // Build the request body for logging
        const requestBody = {
          prompt: localePrompt,
          pdfurl: this.pdfUrl,
          client: this.appSettings.client,
        };

        // Log everything being sent to the API
        console.info(
          `=== OpenAI API Request (PDF Article) ===`,
          '\n\n|URL|\n', openAiServiceUrl,
          '\n\n|PDF URL|\n', this.pdfUrl,
          '\n\n|Client|\n', this.appSettings.client,
          '\n\n|Model|\n', localePrompt.model,
          '\n\n|Max Output Tokens|\n', localePrompt.max_output_tokens,
          '\n\n|Reasoning Effort|\n', localePrompt.reasoning?.effort,
          '\n\n|Stream|\n', localePrompt.stream,
          '\n\n|Prompt (full text)|\n', localePrompt.prompt,
          '\n\n|Complete Request Body|\n', JSON.stringify(requestBody, null, 2)
        );

        try {
          // Reset streaming state
          this.streamingText = "";
          this.streamingItems = [];
          this.streamingComplete = false;
          this.expectedTotalItems = null;

          const response = await this.handleFetch(
            openAiServiceUrl,
            requestBody,
            "POST",
            "getSummarizePDFArticle"
          );

          // Use streaming to read response
          const rawText = await this.readStreamingResponse(response);
          const sanitizedText = this.sanitizeResponse(rawText);

          // Clear streaming state before showing parsed result
          this.streamingText = "";
          this.streamingItems = [];

          // Parse the sanitized JSON
          const parsed = JSON.parse(sanitizedText);
          
          // Handle both old format (array) and new format (object with items)
          const data = Array.isArray(parsed) ? parsed : (parsed.items || []);
          return data;
        } catch (error) {
          this.streamingText = "";
          this.streamingItems = [];
          this.isError = true;
          this.errorMessage = "Failed to summarize PDF article.";
          console.error("Error parsing summary:", error);
          throw error;
        }
      },

      /**
       * Reads a streaming response and updates streamingText as chunks arrive.
       * @param {Response} response - The fetch response object
       * @returns {Promise<string>} The complete response text
       */
      async readStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let isFirstChunk = true;
        let metadataLogged = false;
        const STREAM_SEPARATOR = "---STREAM_START---";
        
        // Reset streaming items
        this.streamingItems = [];
        let currentItemIndex = -1;
        let lastParsedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunk = decoder.decode(value, { stream: true });
          
          // Skip initial padding (first chunk may be whitespace)
          if (isFirstChunk) {
            chunk = chunk.trimStart();
            isFirstChunk = false;
            if (!chunk) continue;
          }
          
          fullText += chunk;
          
          // Check for metadata and stream separator
          if (!metadataLogged && fullText.includes(STREAM_SEPARATOR)) {
            const separatorIndex = fullText.indexOf(STREAM_SEPARATOR);
            const metadataStr = fullText.substring(0, separatorIndex).trim();
            
            try {
              const metadata = JSON.parse(metadataStr);
              if (metadata.type === 'metadata') {
                // Log the extracted article text
                console.info(
                  `=== Extracted Article Text ===`,
                  '\n\n|Source URL|\n', metadata.pdfUrl || metadata.htmlUrl,
                  '\n\n|Text Length|\n', metadata.extractedTextLength, 'characters',
                  '\n\n|Extracted Text|\n', metadata.extractedText
                );
              }
            } catch (e) {
              // Metadata parsing failed, continue anyway
            }
            
            metadataLogged = true;
            // Remove metadata and separator from fullText
            fullText = fullText.substring(separatorIndex + STREAM_SEPARATOR.length).trim();
          }
          
          // Only process streaming content after metadata has been handled
          if (metadataLogged) {
            this.streamingText = fullText.trim();
            
            // Try to parse complete items from the stream
            this.parseStreamingItems(fullText);
          }
          
          await this.$nextTick();
        }

        // Clear streaming state
        this.streamingItems = [];
        return fullText.trim();
      },
      
      /**
       * Parses JSON stream and extracts complete Q&A items progressively
       * Supports both old format (array) and new format (object with totalItems and items)
       */
      parseStreamingItems(text) {
        try {
          const items = [];
          
          // Try to extract totalItems from the beginning of the JSON
          if (this.expectedTotalItems === null) {
            const totalItemsMatch = text.match(/"totalItems"\s*:\s*(\d+)/);
            if (totalItemsMatch) {
              this.expectedTotalItems = parseInt(totalItemsMatch[1], 10);
            }
          }
          
          // Find all complete JSON objects by matching balanced braces
          let depth = 0;
          let objectStart = -1;
          let inString = false;
          let escape = false;
          let arrayDepth = 0;
          let foundClosingBracket = false;
          let inItemsArray = false;
          
          for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (escape) {
              escape = false;
              continue;
            }
            
            if (char === '\\' && inString) {
              escape = true;
              continue;
            }
            
            if (char === '"' && !escape) {
              inString = !inString;
              continue;
            }
            
            if (inString) continue;
            
            // Track array brackets - we're looking for the "items" array
            if (char === '[') {
              arrayDepth++;
              // Check if this is the items array
              const beforeBracket = text.substring(Math.max(0, i - 20), i);
              if (beforeBracket.includes('"items"')) {
                inItemsArray = true;
              }
            } else if (char === ']') {
              arrayDepth--;
              if (arrayDepth === 0 && inItemsArray) {
                foundClosingBracket = true;
              }
            }
            
            if (char === '{') {
              if (depth === 0 || (depth === 1 && inItemsArray)) {
                // Only track objects inside the items array (depth 1) or root object
                if (inItemsArray && depth === 1) {
                  objectStart = i;
                } else if (!inItemsArray && depth === 0) {
                  // This is either root object (new format) or item object (old format)
                  objectStart = i;
                }
              }
              depth++;
            } else if (char === '}') {
              depth--;
              if (objectStart !== -1) {
                // For new format: items are at depth 1 inside the items array
                // For old format: items are at depth 0
                const isItemObject = (inItemsArray && depth === 1) || (!inItemsArray && depth === 0 && !text.includes('"totalItems"'));
                
                if (isItemObject) {
                  const objectStr = text.substring(objectStart, i + 1);
                  try {
                    const obj = JSON.parse(objectStr);
                    if (obj.shortTitle && obj.answer !== undefined) {
                      items.push({
                        shortTitle: obj.shortTitle,
                        question: obj.question || "",
                        answer: obj.answer,
                        isStreaming: false
                      });
                    }
                  } catch (e) {
                    // Not valid JSON yet
                  }
                  objectStart = -1;
                }
              }
            }
          }
          
          // Update streamingComplete when we find the closing bracket of the items array
          this.streamingComplete = foundClosingBracket;
          
          // Check for partial object at the end (only if array is not complete)
          if (depth > 1 && objectStart !== -1 && !foundClosingBracket) {
            const partialStr = text.substring(objectStart);
            const partialItem = this.parsePartialItem(partialStr);
            if (partialItem) {
              items.push(partialItem);
            }
          }
          
          if (items.length > 0) {
            this.streamingItems = items;
          }
        } catch (e) {
          console.log("Parsing error:", e);
        }
      },
      
      /**
       * Parse a partial JSON object that's still being streamed
       */
      parsePartialItem(text) {
        const item = { shortTitle: "", question: "", answer: "", isStreaming: true };
        
        // Extract shortTitle using simple string search
        const titleMatch = text.match(/"shortTitle"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (titleMatch) {
          item.shortTitle = JSON.parse('"' + titleMatch[1] + '"');
        } else {
          return null;
        }
        
        // Extract question
        const questionMatch = text.match(/"question"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (questionMatch) {
          try {
            item.question = JSON.parse('"' + questionMatch[1] + '"');
          } catch (e) {
            item.question = questionMatch[1];
          }
        }
        
        // Extract partial answer - find the last "answer": and get content after it
        const answerMatch = text.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)/);
        if (answerMatch) {
          try {
            // Try to parse what we have, adding closing quote
            item.answer = JSON.parse('"' + answerMatch[1] + '"');
          } catch (e) {
            // If parse fails, just unescape manually
            item.answer = answerMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }
        }
        
        return item;
      },
    },
  };
</script>

<style scoped>
.qpm_streaming-container {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin: 15px 0;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid var(--qpm-primary-color, #007bff);
}

.qpm_streaming-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  color: var(--qpm-primary-color, #007bff);
  font-weight: 600;
  font-size: 0.95em;
}

.qpm_streaming-header i {
  font-size: 1.2em;
}

.qpm_streaming-content {
  background: white;
  border-radius: 8px;
  padding: 15px;
  max-height: 350px;
  overflow-y: auto;
  line-height: 1.7;
  font-size: 0.95em;
  color: #333;
}

.qpm_streaming-content strong {
  color: var(--qpm-primary-color, #007bff);
  display: block;
  margin-top: 10px;
  margin-bottom: 5px;
}

.qpm_streaming-content em {
  color: #555;
  font-style: italic;
}

.qpm_streaming-cursor {
  animation: blink 0.8s infinite;
  color: var(--qpm-primary-color, #007bff);
  font-weight: bold;
}

@keyframes blink {
  0%, 40% { opacity: 1; }
  41%, 100% { opacity: 0; }
}

.qpm_streaming-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px;
  font-size: 0.9em;
}

.qpm_animated-dots::after {
  content: '';
  animation: dots 2.5s steps(5, end) infinite;
}

@keyframes dots {
  0% { content: '.'; }
  20% { content: '..'; }
  40% { content: '...'; }
  60% { content: '....'; }
  80%, 100% { content: '.....'; }
}

/* Scrollbar styling */
.qpm_streaming-content::-webkit-scrollbar {
  width: 6px;
}

.qpm_streaming-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.qpm_streaming-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.qpm_streaming-content::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>
