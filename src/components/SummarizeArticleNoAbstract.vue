<template>
  <div style="margin-top: 20px">
    <div v-if="isLoadingQuestions" style="height: 250px">
      <Spinner
        class="qpm_searchMore"
        :loading="true"
        :waitText="getString('aiSummaryWaitText')"
        :size="35"
      ></Spinner>
    </div>

    <p v-if="questions.length > 1 && !isLoadingQuestions">
      <strong>{{ getString("summarizeArticleHeader") }}</strong>
    </p>

    <!-- Render the first 7 questions -->
    <Accordion
      v-for="(question, index) in questions.slice(0, 7)"
      :key="index"
      :title="questionShortenMapDanish[question] || question"
      :openByDefault="false"
    >
      <template v-slot:header="accordionProps">
        <div class="qpm_aiAccordionHeader">
          <i
            v-if="accordionProps.expanded"
            class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
          ></i>
          <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
          <i
            class="bx bx-credit-card-front"
            style="
              font-size: 22px;
              vertical-align: text-bottom;
              margin-left: 3px;
              margin-right: 5px;
            "
          ></i>
          {{ questionShortenMapDanish[question] || question }}
        </div>
      </template>
      <template v-slot:default>
        <div class="answer-text">
          {{ answers[index] }}
        </div>
      </template>
    </Accordion>

    <!-- Render the title after the first 7 questions -->
    <p v-if="questions.length > 7">
      <strong>{{ getString("generateQuestionsHeader") }}</strong>
    </p>

    <!-- Render the remaining questions -->
    <Accordion
      v-for="(question, index) in questions.slice(7)"
      :key="index + 7"
      :title="questionShortenMapDanish[question] || question"
      :openByDefault="false"
    >
      <template v-slot:header="accordionProps">
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
          {{ questionShortenMapDanish[question] || question }}
        </div>
      </template>
      <template v-slot:default>
        <div :style="getAnswerStyle(index)" class="answer-text">
          {{ answers[index + 7] }}
        </div>
      </template>
    </Accordion>

    <question-for-article
      v-if="isArticle && !isLoadingQuestions"
      :pdfUrl="pdfUrl"
      :htmlUrl="htmlUrl"
      :language="language"
      :promptLanguageType="promptLanguageType"
    ></question-for-article>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
import Accordion from "@/components/Accordion.vue";
import Spinner from "@/components/Spinner.vue";
import QuestionForArticle from "@/components/QuestionForArticle.vue";

import { appSettingsMixin } from "@/mixins/appSettings";
import { utilitiesMixin } from "@/mixins/utilities";
import { questionsToTitleMapMixin } from "@/mixins/questionsToTitleMap";
import { summarizeArticleMixin } from "@/mixins/summarizeArticle";
import { questionHeaderHeightWatcherMixin } from "@/mixins/questionHeaderHeightWatcher";

export default {
  name: "SummarizeArticleNoAbstract",
  mixins: [
    appSettingsMixin,
    utilitiesMixin,
    questionsToTitleMapMixin,
    summarizeArticleMixin,
    questionHeaderHeightWatcherMixin,
  ],
  components: {
    Accordion,
    Spinner,
    QuestionForArticle,
  },
  data() {
    return {
      isArticle: false,
      questions: [],
      answers: [],
      isLoadingQuestions: false,
      isError: false,
      errorMessage: "",
      scrapingError: false,
      promptLanguageType: "",
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
    language: {
      type: String,
      default: "dk",
    },
  },
  methods: {
    handleOnSummarizeArticleNoAbstract(prompt) {
      console.log("HandleOnSummarizeArticleNoAbstract", prompt);
      this.promptLanguageType = prompt.name;
      this.handleSummarizeArticle();
    },
  },
  created() {
    console.log("Attaching event listener for SummarizeArticleNoAbstract");
    this.$on(
      "SummarizeArticleNoAbstract",
      this.handleOnSummarizeArticleNoAbstract
    );
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
