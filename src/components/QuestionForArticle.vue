<template>
  <div style="margin-top: 20px">
    <p>
      <strong>{{ getString("userQuestionsHeader") }}</strong>
    </p>

    <Accordion
      v-for="(question, index) in questions"
      :key="index"
      :title="question"
      :openByDefault="true"
    >
      <template v-slot:header="accordionProps">
        <div ref="headerText" class="qpm_aiAccordionHeader">
          <i
            v-if="accordionProps.expanded"
            class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
          >
          </i>
          <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows">
          </i>
          <i
            class="bx bx-help-circle"
            style="
              font-size: 22px;
              vertical-align: text-bottom;
              margin-left: 3px;
              margin-right: 5px;
            "
          >
          </i>
          {{ question }}
        </div>
      </template>
      <template v-slot:default>
        <div :style="getAnswerStyle(index)" class="answer-text">
          {{ answers[index] }}
        </div>
      </template>
    </Accordion>

    <Spinner
      class="qpm_searchMore"
      v-if="isLoadingResponse"
      :loading="true"
      :waitText="getString('aiSummaryWaitText')"
      :size="35"
    >
    </Spinner>

    <div style="display: flex">
      <input
        class="question-input"
        v-model="userQuestionInput"
        :disabled="isLoadingResponse"
        :placeholder="getString('userQuestionInputPlaceholder')"
        :title="getString('userQuestionInputHoverText')"
        v-tooltip="{
          content: getString('userQuestionInputHoverText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
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

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
import { appSettingsMixin } from "@/mixins/appSettings";
import utilities from "@/mixins/utilities";
import summarizeArticleService from "@/mixins/summarizeArticleService";
import questionHeaderHeightWatcherMixin from "@/mixins/questionHeaderHeightWatcherMixin";
import Accordion from "@/components/Accordion.vue";
import Spinner from "@/components/Spinner.vue";

export default {
  name: "QuestionForArticle",
  mixins: [
    appSettingsMixin,
    utilities,
    summarizeArticleService,
    questionHeaderHeightWatcherMixin,
  ],
  components: {
    Accordion,
    Spinner,
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
  props: {
    htmlUrl: {
      type: String,
      required: false,
    },
    pdfUrl: {
      type: String,
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
    getString(key) {
      // Implement your localization logic here
      return key;
    },
    getAnswerStyle(index) {
      // Implement your dynamic styling logic here
      return {};
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
