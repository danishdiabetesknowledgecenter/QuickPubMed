<template>
  <div ref="container" style="margin-top: 20px">
    <!-- TITLE Notice the entire article can be summarized -->
    <p v-if="!isError && !scrapingError && !isLoadingQuestions" style="margin-bottom: 20px">
      <strong>{{ getString("summarizeArticleNotice") }}</strong>
    </p>
    <button
      v-if="!isError && !scrapingError && !isLoadingQuestions"
      v-tooltip="{
        content: getString('hoverretryText'),
        offset: 5,
        delay: $helpTextDelay,
        hideOnTargetClick: false,
      }"
      class="qpm_button"
      :disabled="isSummaryLoading || isLoadingQuestions || isError"
      @keydown.enter="handleRetry()"
      @click="handleRetry()"
    >
      <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em" />
      {{ getString("retryText") }}
    </button>
    <button
      v-if="!isError && !scrapingError && !isLoadingQuestions"
      v-tooltip="{
        content: getString('hoverAskQuestionText'),
        offset: 5,
        delay: $helpTextDelay,
        hideOnTargetClick: false,
      }"
      class="qpm_button"
      :disabled="isSummaryLoading || isLoadingQuestions || isError"
      @click="toggleShowArticleSummary"
    >
      <i
        v-if="isSummaryVisible"
        class="bx bx-chevron-down"
        style="vertical-align: baseline; font-size: 1em"
      />
      <i
        v-if="!isSummaryVisible"
        class="bx bx-chevron-right"
        style="vertical-align: baseline; font-size: 1em"
      />

      {{ getButtonText }}
    </button>

    <loading-spinner
      v-if="isLoadingQuestions"
      class="qpm_searchMore"
      :loading="true"
      :wait-text="getString('aiSummaryWaitText')"
      :size="35"
    />

    <div v-if="isArticle && isSummaryVisible">
      <!-- TITLE summarize entire article -->
      <p v-if="questions.length > 1 && !isLoadingQuestions">
        <strong>{{ getString("summarizeArticleHeader") }}</strong>
      </p>

      <!-- Default questions to summarize an article section -->
      <accordion-menu
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
            {{ questionShortenMapDanish[question] || question }}
          </div>
        </template>
        <template #default>
          <div class="qpm_answer-text">
            {{ answers[index] }}
          </div>
        </template>
      </accordion-menu>

      <!-- TITLE for generated article specific questions -->
      <p v-if="questions.length > 7">
        <strong>{{ getString("generateQuestionsHeader") }}</strong>
      </p>

      <!-- Generated article specific questions section -->
      <accordion-menu
        v-for="(question, index) in questions.slice(7)"
        :key="index + 7"
        :title="questionShortenMapDanish[question] || question"
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

      <!-- User input for asking questions for an article -->
      <question-for-article
        v-if="!isLoadingQuestions"
        :pdf-url="pdfUrl"
        :html-url="htmlUrl"
        :language="language"
        :prompt-language-type="promptLanguageType"
      />
    </div>

    <p v-if="errorMessage" class="qpm_error-message">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import QuestionForArticle from "@/components/QuestionForArticle.vue";

  import { utilitiesMixin } from "@/mixins/utilities";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { summarizeArticleMixin } from "@/mixins/summarizeArticle";
  import { questionsToTitleMapMixin } from "@/mixins/questionsToTitleMap";
  import { questionHeaderHeightWatcherMixin } from "@/mixins/questionHeaderHeightWatcher";

  export default {
    name: "SummarizeArticle",
    components: {
      AccordionMenu,
      LoadingSpinner,
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
      isSummaryLoading: {
        type: Boolean,
        required: false,
        default: false,
      },
      promptLanguageType: {
        type: String,
        default: "Hverdagssprog",
        required: false,
      },
      generateArticleSummary: {
        type: Boolean,
        default: false,
        required: true,
      },
    },
    data() {
      return {
        isSummaryVisible: false,
      };
    },
    computed: {
      getButtonText() {
        return !this.isSummaryVisible
          ? this.getString("generatePdfQuestionsButtonText")
          : this.getString("hideGeneratePdfQuestionsButtonText");
      },
    },
    watch: {
      generateArticleSummary: {
        handler: function (val) {
          if (val) {
            this.handleSummarizeArticle();
          }
        },
        immediate: true,
      },
    },
    methods: {
      toggleShowArticleSummary() {
        this.isSummaryVisible = !this.isSummaryVisible;
      },
      handleRetry() {
        this.isSummaryVisible = true;
        this.handleSummarizeArticle();
      },
    },
  };
</script>
