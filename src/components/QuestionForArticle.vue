<template>
  <div style="margin-top: 20px">
    <p>
      <strong>{{ getString("userQuestionsHeader") }}</strong>
    </p>

    <accordion-menu
      v-for="(question, index) in questions"
      :key="index"
      :title="question"
      :open-by-default="true"
    >
      <template #header="accordionProps">
        <div ref="headerText" class="qpm_aiAccordionHeader">
          <i
            v-if="accordionProps.expanded"
            class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
          />
          <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
          <i
            class="bx bx-help-circle"
            style="
              font-size: 22px;
              vertical-align: text-bottom;
              margin-left: 3px;
              margin-right: 5px;
            "
          />
          {{ question }}
        </div>
      </template>
      <template #default>
        <div :style="getAnswerStyle(index)" class="qpm_answer-text">
          {{ answers[index] }}
        </div>
      </template>
    </accordion-menu>

    <loading-spinner
      v-if="isLoadingResponse"
      class="qpm_searchMore"
      :loading="true"
      :wait-text="getString('aiSummaryWaitText')"
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
  import AccordionMenu from "@/components/Accordion.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  import { appSettingsMixin } from "@/mixins/appSettings";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { summarizeArticleMixin } from "@/mixins/summarizeArticle";
  import { questionHeaderHeightWatcherMixin } from "@/mixins/questionHeaderHeightWatcher";

  export default {
    name: "QuestionForArticle",
    components: {
      AccordionMenu,
      LoadingSpinner,
    },
    mixins: [
      appSettingsMixin,
      utilitiesMixin,
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
      },
    },
    data() {
      return {
        questions: [],
        answers: [],
        errorMessage: "",
        isError: false,
        isLoadingResponse: false,
        userQuestionInput: null,
      };
    },
    methods: {
      async handleQuestionForArticle() {
        try {
          if (!this.userQuestionInput) {
            this.errorMessage = "Indtast venligst et spørgsmål";
            this.isError = true;
            return;
          }
          this.isError = false;
          this.errorMessage = undefined;
          this.isLoadingResponse = true;
          if (this.pdfUrl) {
            console.log("PDF article URL: ", this.pdfUrl);
            await this.getQuestionPDFArticle();
          }

          if (this.htmlUrl && !this.pdfUrl) {
            console.log("HTML article URL: ", this.htmlUrl);
            await this.getQuestionHTMLArticle();
          }
        } catch (error) {
          console.error("Error fetching:", error);
          this.errorMessage = "Netværksfejl";
          this.isError = true;
          console.error(this.errorMessage);
        } finally {
          this.isLoadingResponse = false;
          this.userQuestionInput = null;
        }
      },
      async getQuestionHTMLArticle() {
        const openAiServiceUrl =
          this.appSettings.openAi.baseUrl + "/api/SummarizeHTMLArticle";

        const localePrompt = this.getComposablePrompt(
          this.language,
          this.promptLanguageType
        );

        let response = await this.handleFetch(openAiServiceUrl, {
          prompt: localePrompt,
          htmlurl: this.htmlUrl,
          client: this.appSettings.client,
        }).catch(function (error) {
          return error;
        });

        response = await response.json();

        this.questions = [...this.questions, ...response.questions];
        this.answers = [...this.answers, ...response.answers];
        return response;
      },
      async getQuestionPDFArticle() {
        const openAiServiceUrl =
          this.appSettings.openAi.baseUrl + "/api/SummarizePDFArticle";

        const userQuestionPrompt = this.getComposablePrompt(
          this.language,
          this.promptLanguageType
        );

        let response = await this.handleFetch(openAiServiceUrl, {
          prompt: userQuestionPrompt,
          pdfurl: this.pdfUrl,
          client: this.appSettings.client,
        }).catch((error) => {
          this.isArticle = false;
          return error;
        });

        response = await response.json();

        this.questions = [...this.questions, ...response.questions];
        this.answers = [...this.answers, ...response.answers];
        return response;
      },
    },
  };
</script>
