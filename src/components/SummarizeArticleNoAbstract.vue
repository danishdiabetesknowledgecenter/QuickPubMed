<template>
  <div style="margin-top: 20px">
    <div v-if="isLoadingCurrent">
      <loading-spinner
        class="qpm_searchMore"
        :loading="true"
        :wait-text="getString('aiArticleSummaryWaitText')"
        :wait-duration-disclaimer="getString('aiLongWaitTimeDisclaimer')"
        :size="35"
      />
    </div>

    <p v-if="questions.length > 1 && !isLoadingCurrent">
      <strong>{{ getString("summarizeArticleHeader") }}</strong>
      <i style="font-style: italic"> ({{ promptLanguageType }})</i>
    </p>
    <div v-if="!isLoadingCurrent">
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
            {{ question }}
          </div>
        </template>
        <template #default>
          <div :style="getAnswerStyle(index)" class="qpm_answer-text">
            {{ answers[index + 7] }}
          </div>
        </template>
      </accordion-menu>

      <button
        v-if="!isError && !scrapingError && !isLoadingCurrent && isArticle"
        v-tooltip="{
          content: getString('hoverretryText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="qpm_button"
        style="margin-top: 25px"
        :disabled="isLoadingCurrent || isError"
        @keydown.enter="handleRetry()"
        @click="handleRetry()"
      >
        <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em" />
        {{ getString("retryText") }}
      </button>

      <question-for-article
        v-if="isArticle && !isLoadingCurrent"
        :pdf-url="pdfUrl"
        :html-url="htmlUrl"
        :language="language"
        :prompt-language-type="promptLanguageType"
        :domain-specific-prompt-rules="domainSpecificPromptRules"
      />
    </div>
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
    },
    data() {
      return {
        isArticle: false,
        scrapingError: false,
        isError: false,
        errorMessage: "",
        questions: [],
        answers: [],
        aiArticleSummaries: {},
        loadingQuestions: {},
        promptLanguageType: "",
      };
    },
    asyncComputed: {
      async currentSummary() {
        // Retrieve the summary based on the current promptLanguageType prop
        return await this.getAiSummaryOfArticle(this.promptLanguageType);
      },
    },
    computed: {
      isLoadingCurrent() {
        // Access the loading state for current promptLanguageType
        return this.isLoading(this.promptLanguageType);
      },
    },
    watch: {
      isLoadingCurrent: {
        handler(newState) {
          console.log(`${this.promptLanguageType} is loading: `, newState);
        },
      },
    },
    created() {
      this.$on("SummarizeArticleNoAbstract", this.handleOnSummarizeArticleNoAbstract);
    },
    methods: {
      async handleRetry() {
        this.isSummaryVisible = true;
        // Passing true to force getting new answers for summarizing of the article
        await this.getAiSummaryOfArticle(this.promptLanguageType, true);
      },
      async handleOnSummarizeArticleNoAbstract(prompt) {
        this.promptLanguageType = prompt.name;
        await this.loadOrGenerateSummary(this.promptLanguageType);
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
      /**
       * Loads an existing summary or generates a new one based on promptLanguageType.
       *
       * @param {string} promptLanguageType - The language type ('plain language' or 'professional language').
       */
      async loadOrGenerateSummary(promptLanguageType) {
        const existingSummary = await this.getAiSummaryOfArticle(promptLanguageType);
        if (!existingSummary) {
          console.log("Did not find existing summary");
          await this.generateAndSaveSummary(promptLanguageType);
        } else if (existingSummary && !this.isLoadingCurrent) {
          console.log("Found existing summary |", existingSummary);
          // Populate questions and answers from existing summary
          this.questions = existingSummary.questions;
          this.answers = existingSummary.answers;
        }
      },
    },
  };
</script>
