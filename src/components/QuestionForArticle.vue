<template>
  <div style="margin-top: 20px">
    <p>
      <strong>{{ getString("userQuestionsHeader") }}</strong>
    </p>

    <accordion-menu
      v-for="(qa, idx) in currentUserQAs"
      :key="`user-qa-${idx}`"
      :title="qa.question"
      :open-by-default="true"
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
        <div :style="getAnswerStyle(idx)" class="qpm_answer-text">
          {{ qa.answer }}
        </div>
      </template>
    </accordion-menu>

    <loading-spinner
      v-if="isLoadingCurrent"
      class="qpm_searchMore"
      :loading="isLoadingCurrent"
      :wait-text="getString('aiSummaryWaitText')"
      :wait-duration-disclaimer="getString('aiShortWaitTimeDisclaimer')"
      :size="35"
    />

    <div style="display: flex">
      <input
        v-model="userQuestionInput"
        v-tooltip="{
          content: getString('userQuestionInputHoverText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="qpm_question-input"
        :disabled="isLoadingResponse"
        :placeholder="getString('userQuestionInputPlaceholder')"
        :title="getString('userQuestionInputHoverText')"
        @keyup.enter="handleQuestionForArticle"
      />
      <button
        class="qpm_button"
        style="margin: 10px"
        :disabled="isLoadingResponse"
        @click="handleQuestionForArticle"
      >
        {{ getString("askQuestionButtontext") }}
      </button>
    </div>

    <p v-if="errorMessage" class="qpm_error-message">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  import { utilitiesMixin } from "@/mixins/utilities";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { summarizeArticleMixin } from "@/mixins/summarizeArticle";
  import { questionHeaderHeightWatcherMixin } from "@/mixins/questionHeaderHeightWatcher";

  export default {
    name: "QuestionForArticle",
    components: {
      AccordionMenu,
      LoadingSpinner,
    },
    mixins: [
      utilitiesMixin, // Ensure utilitiesMixin is first if others depend on it
      promptRuleLoaderMixin,
      appSettingsMixin,
      summarizeArticleMixin,
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
      promptLanguageType: {
        type: String,
        default: "Hverdagssprog",
      },
      language: {
        type: String,
        default: "dk",
        validator: function (value) {
          // Add additional language validations if needed
          return ["dk", "en", "es"].includes(value); // Example supported languages
        },
      },
    },
    data() {
      return {
        userQAs: {}, // Object keyed by promptLanguageType, each holds an array of { question, answer }
        loading: {}, // Loading state keyed by promptLanguageType
        isError: false,
        errorMessage: "",
        isLoadingResponse: false,
        userQuestionInput: "", // Initialized as empty string for two-way binding
      };
    },
    computed: {
      /**
       * Retrieves the user-provided QAs for the current promptLanguageType.
       *
       * @returns {Array<{ question: string, answer: string }>}
       */
      currentUserQAs() {
        return this.userQAs[this.promptLanguageType] || [];
      },
      /**
       * Determines if the current promptLanguageType is loading.
       *
       * @returns {boolean} - Loading state.
       */
      isLoadingCurrent() {
        return this.loading[this.promptLanguageType] || false;
      },
    },
    watch: {
      /**
       * Watches for changes in promptLanguageType to load existing user QAs.
       */
      promptLanguageType: {
        handler(newType) {
          if (this.isLoadingCurrent) {
            console.log(
              `Loading in progress for ${this.promptLanguageType}, skipping load for ${newType}`
            );
            return;
          }
          this.loadExistingUserQuestions(newType);
        },
        immediate: true,
      },
    },
    methods: {
      /**
       * Handles the submission of a new user question.
       */
      async handleQuestionForArticle() {
        const trimmedQuestion = this.userQuestionInput && this.userQuestionInput.trim();
        if (!trimmedQuestion) {
          return; // Do not process empty questions
        }

        // Initialize QA array if it doesn't exist
        if (!this.userQAs[this.promptLanguageType]) {
          this.$set(this.userQAs, this.promptLanguageType, []);
        }

        // Add the new question with a placeholder for the answer
        this.userQAs[this.promptLanguageType].push({
          question: trimmedQuestion,
          answer: this.getString("loadingText"),
        });

        // Process the new question to fetch the answer
        await this.processNewQuestion(this.promptLanguageType);
      },

      /**
       * Processes a newly added user question by calling the appropriate API.
       *
       * @param {string} promptLanguageType
       */
      async processNewQuestion(promptLanguageType) {
        this.$set(this.loading, promptLanguageType, true);
        try {
          // Utilize the getComposablePrompt method from the mixin
          const composedPrompt = this.getComposablePrompt(
            this.language,
            promptLanguageType
            // Removed the third argument as per new flow
          );

          const openAiServiceUrl = this.pdfurl
            ? `${this.appSettings.openAi.baseUrl}/api/SummarizePDFArticle`
            : `${this.appSettings.openAi.baseUrl}/api/SummarizeHTMLArticle`;

          const fetchPayload = this.pdfurl
            ? { prompt: composedPrompt, pdfurl: this.pdfUrl, client: this.appSettings.client }
            : { prompt: composedPrompt, htmlurl: this.htmlUrl, client: this.appSettings.client };

          this.isLoadingResponse = true;
          let response = await this.handleFetch(openAiServiceUrl, fetchPayload);
          console.log("Response from OpenAI API:", response);

          const rawText = await response.text();
          const sanitizedText = this.sanitizeResponse(rawText);
          const sanitizedResponse = JSON.parse(sanitizedText);

          console.log("Sanitized response from OpenAI API:", sanitizedResponse);

          // Ensure response.answers is an array with at least one answer
          const fetchedAnswer =
            sanitizedResponse.answers && sanitizedResponse.answers.length > 0
              ? sanitizedResponse.answers[0]
              : this.getString("userQuestionsNoAnswer");

          // Update the latest question's answer
          const latestQA =
            this.userQAs[promptLanguageType][this.userQAs[promptLanguageType].length - 1];
          this.$set(latestQA, "answer", fetchedAnswer || this.getString("userQuestionsNoAnswer"));

          console.info(`Processed question (${promptLanguageType}):`, sanitizedResponse);
        } catch (error) {
          this.errorMessage = "Failed to process the new question.";
          console.error(`Error processing user question for ${promptLanguageType}:`, error);
          // Update the latest question's answer to indicate failure
          const latestQA =
            this.userQAs[promptLanguageType][this.userQAs[promptLanguageType].length - 1];
          this.$set(latestQA, "answer", "Failed to fetch answer.");
        } finally {
          // Clear the input field
          this.userQuestionInput = "";
          this.isLoadingResponse = false;
          this.$set(this.loading, promptLanguageType, false);
        }
      },

      /**
       * Loads existing user questions and answers for the specified promptLanguageType.
       *
       * @param {string} promptLanguageType
       */
      async loadExistingUserQuestions(promptLanguageType) {
        if (this.userQAs[promptLanguageType] && this.userQAs[promptLanguageType].length > 0) {
          // Existing user QAs are already loaded
          console.log(`Loaded existing user QAs for: ${promptLanguageType}`);
        } else {
          // No existing user QAs, initialize empty array
          this.$set(this.userQAs, promptLanguageType, []);
          console.log(`Initialized empty user QAs for: ${promptLanguageType}`);
        }
      },
    },
  };
</script>
