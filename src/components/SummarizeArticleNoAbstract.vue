<template>
  <div style="margin-top: 20px">
    <div
      v-if="isLoadingQuestions"
      style="height: 250px"
    >
      <Spinner
        class="qpm_searchMore"
        :loading="true"
        :wait-text="getString('aiSummaryWaitText')"
        :size="35"
      />
    </div>

    <p v-if="questions.length > 1 && !isLoadingQuestions">
      <strong>{{ getString("summarizeArticleHeader") }}</strong>
    </p>

    <!-- Render the first 7 questions -->
    <Accordion
      v-for="(question, index) in questions.slice(0, 7)"
      :key="index"
      :title="questionShortenMapDanish[question] || question"
      :open-by-default="false"
    >
      <template #header="accordionProps">
        <div class="qpm_aiAccordionHeader">
          <i
            v-if="accordionProps.expanded"
            class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
          />
          <i
            v-else
            class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"
          />
          <i
            class="bx bx-credit-card-front"
            style="
              font-size: 22px;
              vertical-align: text-bottom;
              margin-left: 3px;
              margin-right: 5px;
            "
          />
          {{ questionShortenMapDanish[question] || question }}
        </div>
      </template>
      <template #default>
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
      :open-by-default="false"
    >
      <template #header="accordionProps">
        <div
          ref="headerText"
          class="qpm_aiAccordionHeader"
        >
          <i
            v-if="accordionProps.expanded"
            class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
          />
          <i
            v-else
            class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"
          />
          <i
            class="bx bx-help-circle"
            style="
              font-size: 22px;
              vertical-align: text-bottom;
              margin-left: 3px;
              margin-right: 5px;
            "
          />
          {{ questionShortenMapDanish[question] || question }}
        </div>
      </template>
      <template #default>
        <div
          :style="getAnswerStyle(index)"
          class="answer-text"
        >
          {{ answers[index + 7] }}
        </div>
      </template>
    </Accordion>

    <question-for-article
      v-if="isArticle && !isLoadingQuestions"
      :pdf-url="pdfUrl"
      :html-url="htmlUrl"
      :language="language"
      :prompt-language-type="promptLanguageType"
    />

    <p
      v-if="errorMessage"
      class="error-message"
    >
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
  components: {
    Accordion,
    Spinner,
    QuestionForArticle,
  },
  mixins: [
    appSettingsMixin,
    utilitiesMixin,
    questionsToTitleMapMixin,
    summarizeArticleMixin,
    questionHeaderHeightWatcherMixin,
  ],
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
  created() {
    console.log("Attaching event listener for SummarizeArticleNoAbstract");
    this.$on(
      "SummarizeArticleNoAbstract",
      this.handleOnSummarizeArticleNoAbstract
    );
  },
  methods: {
    handleOnSummarizeArticleNoAbstract(prompt) {
      console.log("HandleOnSummarizeArticleNoAbstract", prompt);
      this.promptLanguageType = prompt.name;
      this.handleSummarizeArticle();
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
