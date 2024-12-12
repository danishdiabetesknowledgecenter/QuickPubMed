<template>
  <div style="margin-top: 20px">
    <div v-if="isLoadingQuestions">
      <loading-spinner
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
    <accordion-menu
      v-for="(question, index) in questions.slice(0, 7)"
      :key="index"
      :title="fetchShortTitle(question)"
      :open-by-default="false"
    >
      <template #header="accordionProps">
        <div class="qpm_aiAccordionHeader">
          <i
            v-if="accordionProps.expanded"
            class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
          />
          <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
          <i
            class="bx bx-credit-card-front"
            style="
              font-size: 22px;
              vertical-align: text-bottom;
              margin-left: 3px;
              margin-right: 5px;
            "
          />
          {{ fetchShortTitle(question) }}
        </div>
      </template>
      <template #default>
        <div class="qpm_answer-text">
          {{ answers[index] }}
        </div>
      </template>
    </accordion-menu>

    <!-- Render the title after the first 7 questions -->
    <p v-if="questions.length > 7">
      <strong>{{ getString("generateQuestionsHeader") }}</strong>
    </p>

    <!-- Render the remaining questions -->
    <accordion-menu
      v-for="(question, index) in questions.slice(7)"
      :key="index + 7"
      :title="question"
      :open-by-default="false"
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
          {{ fetchShortTitle(question) }}
        </div>
      </template>
      <template #default>
        <div :style="getAnswerStyle(index)" class="qpm_answer-text">
          {{ answers[index + 7] }}
        </div>
      </template>
    </accordion-menu>

    <question-for-article
      v-if="isArticle && !isLoadingQuestions"
      :pdf-url="pdfUrl"
      :html-url="htmlUrl"
      :language="language"
      :prompt-language-type="promptLanguageType"
      :domain-specific-prompt-rules="domainSpecificPromptRules"
    />

    <p v-if="errorMessage" class="qpm_error-message">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";

  import { utilitiesMixin } from "@/mixins/utilities.js";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { summarizeArticleMixin } from "@/mixins/summarizeArticle.js";
  import { getShortTitle } from "@/utils/qpm-open-ai-prompts-helpers.js";
  import { questionHeaderHeightWatcherMixin } from "@/mixins/questionHeaderHeightWatcher.js";

  export default {
    name: "SummarizeArticleNoAbstract",
    components: {
      AccordionMenu,
      LoadingSpinner,
      QuestionForArticle,
    },
    mixins: [
      promptRuleLoaderMixin,
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
      language: {
        type: String,
        default: "dk",
      },
      domainSpecificPromptRules: {
        type: Object,
        default: () => ({}),
        required: true,
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
      this.$on("SummarizeArticleNoAbstract", this.handleOnSummarizeArticleNoAbstract);
    },
    methods: {
      handleOnSummarizeArticleNoAbstract(prompt) {
        this.promptLanguageType = prompt.name;
        this.handleSummarizeArticle();
      },
      /**
       * Retrieves the short title for a given question.
       *
       * @param {string} question - The question text.
       * @returns {string} The short title or the original question if not found.
       */
      fetchShortTitle(question) {
        const shortTitle = getShortTitle(question, this.language);
        return shortTitle || question;
      },
    },
  };
</script>
