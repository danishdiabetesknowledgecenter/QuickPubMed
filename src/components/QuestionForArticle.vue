<template>
  <div v-if="!isLoadingCurrent" class="mugin_questionContainer">
    <p>
      <strong>{{ getString("userQuestionsHeader") }}</strong>
    </p>

    <accordion-menu
      v-for="(qa, idx) in persistedQuestionsAndAnswers"
      :key="`user-qa-${idx}`"
      :title="qa.question"
      :open-by-default="true"
    >
      <template #header="accordionProps">
        <div ref="headerText" class="mugin_aiAccordionHeader mugin_headerRow">
          <div class="mugin_headerRowStart">
            <span class="mugin_headerIconSlot">
              <loading-spinner
                v-if="streamingIndex === idx && isLoadingResponse"
                :loading="true"
                :size="16"
                class="mugin_streaming-icon mugin_headerLoadingSpinner"
              />
              <i
                v-else
                class="bx bx-help-circle mugin_questionIcon"
                aria-hidden="true"
              ></i>
            </span>
            <span class="mugin_headerTitleText">{{ qa.question }}</span>
          </div>
          <div class="mugin_headerRowEnd">
            <i
              v-if="accordionProps.expanded"
              class="bx bx-chevron-up mugin_aiAccordionHeaderArrows"
                aria-hidden="true"
            ></i>
            <i
              v-else
              class="bx bx-chevron-down mugin_aiAccordionHeaderArrows"
                aria-hidden="true"
            ></i>
          </div>
        </div>
      </template>
      <template #default>
        <div class="mugin_answer-text">
          <!-- Show streaming answer if this is the currently streaming question -->
          <template v-if="streamingIndex === idx && streamingAnswer">
            <mugin-markdown
              v-if="useMarkdown && canRenderMarkdown"
              :markdown="streamingAnswer"
              smooth-live-preview
            />
            <template v-else>
              {{ streamingAnswer }}
            </template>
          </template>
          <template v-else>
            <mugin-markdown
              v-if="useMarkdown && canRenderMarkdown"
              :markdown="qa.answer || ''"
              smooth-live-preview
            />
            <template v-else>
              {{ qa.answer }}
            </template>
          </template>
        </div>
      </template>
    </accordion-menu>

    <loading-spinner
      v-if="isLoadingCurrent"
      class="mugin_searchMore"
      :loading="isLoadingCurrent"
      :wait-text="getString('aiSummaryWaitText')"
      :wait-duration-disclaimer="getString('aiShortWaitTimeDisclaimer')"
      :size="35"
    />

    <div class="mugin_questionInputRow">
      <input
        v-model="userQuestionInput"
        v-tooltip="{
          content: getString('userQuestionInputHoverText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="mugin_question-input"
        :disabled="isLoadingResponse || isLoadingCurrent"
        :aria-label="getString('userQuestionInputHoverText')"
        :placeholder="getString('userQuestionInputPlaceholder')"
        :title="getString('userQuestionInputHoverText')"
        @keyup.enter="handleQuestionForArticle"
      />
      <button
        type="button"
        class="mugin_button mugin_questionSubmitSpacing"
        :disabled="isLoadingResponse || isLoadingCurrent"
        @click="handleQuestionForArticle"
      >
        {{ getString("askQuestionButtontext") }}
      </button>
    </div>

    <p v-if="errorMessage" class="mugin_error-message">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import MuginMarkdown from "@/components/MuginMarkdown.vue";
  import {
    summarizeArticlePrompt,
    promptText,
  } from "@/assets/prompts/article.js";
  import { sanitizePrompt } from "@/utils/promptsHelpers.js";
  import { applyOpenAiTaskSettings } from "@/utils/openAiTaskSettings.js";

  import { utilitiesMixin } from "@/mixins/utilities";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";

  export default {
    name: "QuestionForArticle",
    components: {
      AccordionMenu,
      LoadingSpinner,
      MuginMarkdown,
    },
    mixins: [
      utilitiesMixin,
      promptRuleLoaderMixin,
      appSettingsMixin,
    ],
    props: {
      promptLanguageType: {
        type: String,
        required: true,
      },
      isLoadingCurrent: {
        type: Boolean,
        default: false,
        required: true,
      },
      persistedQuestionsAndAnswers: {
        type: Array,
        default: () => [],
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
      language: {
        type: String,
        default: "dk",
        validator: function (value) {
          return ["dk", "en", "es"].includes(value);
        },
      },
      useMarkdown: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        isError: false,
        errorMessage: "",
        isLoadingResponse: false,
        userQuestionInput: "",
        streamingAnswer: "", // Current streaming answer text
        streamingIndex: -1, // Index of the question being streamed
      };
    },
    computed: {
      canRenderMarkdown() {
        return true;
      },
    },
    methods: {
      /**
       * Handles the submission of a new user question.
       */
      async handleQuestionForArticle() {
        const trimmedQuestion = this.userQuestionInput && this.userQuestionInput.trim();
        if (!trimmedQuestion) {
          return;
        }

        const updatedQAs = [
          ...this.persistedQuestionsAndAnswers,
          {
            question: trimmedQuestion,
            answer: this.getString("loadingText"),
          },
        ];

        // Emit the updated Q&A to the parent
        this.$emit("update-questions-and-answers", {
          promptLanguageType: this.promptLanguageType,
          questionsAndAnswers: updatedQAs,
        });

        this.$emit("set-loading", { promptLanguageType: this.promptLanguageType });

        // Process the new question
        await this.processNewQuestion(trimmedQuestion, updatedQAs.length - 1);
      },

      /**
       * Processes a newly added user question by calling the appropriate API.
       *
       * @param {string} question
       * @param {number} index
       */
      async processNewQuestion(question, index) {
        this.isLoadingResponse = true;
        this.streamingIndex = index;
        this.streamingAnswer = "";
        this.$emit("set-loading-user-question", { promptLanguageType: this.promptLanguageType });

        try {
          const composedPrompt = this.getComposablePrompt(this.language, this.promptLanguageType);
          // Call Azure Function directly for article summarization
          const openAiServiceUrl = this.pdfUrl
            ? `${this.appSettings.openAi.azureFunctionUrl}/api/SummarizePDFArticle.php`
            : `${this.appSettings.openAi.azureFunctionUrl}/api/SummarizeHTMLArticle.php`;

          const fetchPayload = this.pdfUrl
            ? { prompt: composedPrompt, pdfurl: this.pdfUrl, client: this.appSettings.client }
            : { prompt: composedPrompt, htmlurl: this.htmlUrl, client: this.appSettings.client };

          const response = await this.handleFetch(openAiServiceUrl, fetchPayload);
          
          // Use streaming to read response
          const rawText = await this.readStreamingUserQuestion(response);
          const sanitizedText = this.sanitizeResponse(rawText);
          
          let fetchedAnswer;
          try {
            const sanitizedResponse = JSON.parse(sanitizedText);
            fetchedAnswer =
              sanitizedResponse.answers && sanitizedResponse.answers.length > 0
                ? sanitizedResponse.answers[0]
                : this.getString("userQuestionsNoAnswer");
          } catch (parseError) {
            // If JSON parsing fails, use the streaming answer we collected
            console.warn("JSON.parse failed, using streaming answer:", parseError.message);
            fetchedAnswer = this.streamingAnswer || this.getString("userQuestionsNoAnswer");
          }

          const updatedQAs = [...this.persistedQuestionsAndAnswers];
          updatedQAs[index].answer = fetchedAnswer || this.getString("userQuestionsNoAnswer");

          // Emit the updated Q&A to the parent
          this.$emit("update-questions-and-answers", {
            promptLanguageType: this.promptLanguageType,
            questionsAndAnswers: updatedQAs,
          });
        } catch (error) {
          this.errorMessage = "Failed to process the new question.";
          const updatedQAs = [...this.persistedQuestionsAndAnswers];
          updatedQAs[index].answer = "Failed to fetch answer.";
          this.$emit("update-questions-and-answers", {
            promptLanguageType: this.promptLanguageType,
            questionsAndAnswers: updatedQAs,
          });
        } finally {
          this.userQuestionInput = "";
          this.isLoadingResponse = false;
          this.streamingIndex = -1;
          this.streamingAnswer = "";
          this.$emit("unset-loading-user-question", {
            promptLanguageType: this.promptLanguageType,
          });
        }
      },
      
      /**
       * Reads a streaming response and extracts the answer text progressively.
       * @param {Response} response - The fetch response object
       * @returns {Promise<string>} The complete response text
       */
      async readStreamingUserQuestion(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let isFirstChunk = true;
        let metadataHandled = false;
        const STREAM_SEPARATOR = "---STREAM_START---";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunk = decoder.decode(value, { stream: true });
          
          // Skip initial padding
          if (isFirstChunk) {
            chunk = chunk.trimStart();
            isFirstChunk = false;
            if (!chunk) continue;
          }
          
          fullText += chunk;
          
          // Handle metadata separator
          if (!metadataHandled && fullText.includes(STREAM_SEPARATOR)) {
            const separatorIndex = fullText.indexOf(STREAM_SEPARATOR);
            fullText = fullText.substring(separatorIndex + STREAM_SEPARATOR.length).trim();
            metadataHandled = true;
          }
          
          // Extract answer from JSON stream for display
          if (metadataHandled) {
            this.extractStreamingAnswer(fullText);
          }
          
          await this.$nextTick();
        }

        return fullText.trim();
      },
      
      /**
       * Extracts the answer text from the streaming JSON for progressive display.
       * @param {string} text - The current streaming text
       */
      extractStreamingAnswer(text) {
        // Try to extract the "answers" array content
        const answersMatch = text.match(/"answers"\s*:\s*\[\s*"([^]*)/);
        if (answersMatch) {
          let answer = answersMatch[1];
          // Remove trailing incomplete JSON
          const lastQuoteIndex = answer.lastIndexOf('"');
          if (lastQuoteIndex > 0) {
            answer = answer.substring(0, lastQuoteIndex);
          }
          // Unescape JSON string
          answer = answer.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          this.streamingAnswer = answer;
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
        // Note: promptLanguageType is always in Danish, so we match against the Danish name
        const prompTextLanguageType = promptText.find(
          (entry) => entry.name.dk === promptLanguageType
        );

        const domainSpecificRules = this.domainSpecificPromptRules[language];
        const promptStartTextuserQuestions = prompTextLanguageType.startTextuserQuestions[language];
        const promptRules = prompTextLanguageType.promptRules[language];
        const promptEndText = prompTextLanguageType.endText[language];

        const composedPromptText = `${domainSpecificRules} ${promptStartTextuserQuestions} ${this.userQuestionInput} ${promptRules} ${promptEndText}`;

        console.info(
          `|Language|\n${language}\n\n|Prompt language type|\n${promptLanguageType}\n\n|Domain specific rules|\n${domainSpecificRules}\n\n|Start text|\n${promptStartTextuserQuestions}\n` +
            `\n\n|User questions|\n${this.userQuestionInput}\n\n|Rules|\n${promptRules}\n` +
            `\n\n|End text|\n${promptEndText}\n`
        );

        // Sanitize the composed prompt text
        let sanitizedComposedPromptText = sanitizePrompt({
          [language]: composedPromptText,
        });

        // Get the basic prompt for the given language type
        // The promptLanguageType comes in as the Danish name (e.g., "Hverdagssprog" or "Fagsprog")
        // We need to find the matching entry in summarizeArticlePrompt
        const basePrompt = summarizeArticlePrompt.find((p) => {
          // Compare directly with promptLanguageType since both use Danish names
          return p.name === promptLanguageType;
        });
        let languageSpecificPrompt = applyOpenAiTaskSettings(
          { ...basePrompt },
          "summarizeArticle"
        );

        // Set the prompt field to the sanitized composed prompt text for the given language
        languageSpecificPrompt.prompt = sanitizedComposedPromptText[language];

        return languageSpecificPrompt;
      },
    },
  };
</script>
