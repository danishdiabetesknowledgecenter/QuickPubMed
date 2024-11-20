<template>
  <div class="qpm_searchSummaryBox">
    <div class="d-flex space-between">
      <div class="qpm_tabs">
        <button
          v-for="prompt in prompts"
          :id="prompt.name"
          :key="prompt.name"
          v-tooltip="{
            content: getTabTooltipContent(prompt),
            delay: $helpTextDelay,
          }"
          class="qpm_tab"
          :class="{ qpm_tab_active: prompt.name == currentSummary }"
          @click="clickSummaryTab(prompt)"
        >
          {{ getTranslation(prompt) }}
        </button>
      </div>
    </div>
    <div class="qpm_searchSummaryTextBackground">
      <template v-if="hasAcceptedAi">
        <div class="qpm_summary_icon_row">
          <template
            v-if="
              getCurrentSummary != null && getCurrentSummaryHistory.length > 1
            "
          >
            <button
              class="qpm_summary_icon bx bx-chevron-left"
              style="margin-right: -12px; margin-top: -3px; border: 0"
              :disabled="getCurrentIndex + 1 >= getCurrentSummaryHistory.length"
              @click="clickHistoryItem(getCurrentIndex + 1)"
            />
            {{ getCurrentSummaryHistory.length - getCurrentIndex
            }}<span style="padding: 0 3px">/</span
            >{{ getCurrentSummaryHistory.length }}
            <button
              class="qpm_summary_icon bx bx-chevron-right"
              style="margin-left: -12px; margin-top: -3px; border: 0"
              :disabled="getCurrentIndex <= 0"
              @click="clickHistoryItem(getCurrentIndex - 1)"
            />
          </template>

          <button
            class="qpm_summary_icon bx bx-x"
            style="
              margin-left: 20px;
              margin-top: -5px;
              border: 1px solid #e7e7e7;
            "
            @click="clickCloseSummary"
          />
        </div>
        <div v-if="!getCurrentSummary" class="qpm_searchSummaryText">
          <p>
            <strong>{{ summaryConsentHeader }}</strong>
          </p>
          <p v-if="summarySearchSummaryConsentText != null">
            {{ summarySearchSummaryConsentText }}
          </p>
          <p v-html="getString('aiSummaryConsentText')" />
          <p v-html="getString('readAboutAiSummaryText')" />
        </div>
        <div v-else class="qpm_searchSummaryResponseBox">
          <div
            v-if="getDidCurrentSummaryError"
            class="qpm_searchSummaryText qpm_searchSummaryErrorText"
          >
            <div>
              <p style="color: #932833">
                <i
                  class="bx bx-error"
                  style="font-size: 30px; line-height: 0; margin: -4px 4px 0 0"
                />
                <strong>{{ errorHeader }}</strong>
              </p>
              <p>{{ getCurrentSummary?.body }}</p>
              <template v-if="getCurrentSummary?.error">
                <p>{{ getCurrentSummary?.error?.Message }}</p>
              </template>
              <div style="margin: 20px 5px 5px">
                <button
                  class="qpm_button"
                  @keydown.enter="clickRetry($event, true)"
                  @click="clickRetry"
                >
                  {{ getString("retryText") }}
                </button>
              </div>
            </div>
          </div>
          <template v-else-if="!isCurrentSummaryWaitingForResponse">
            <div class="qpm_searchSummaryText">
              <div>
                <p>
                  <strong>{{ getSuccessHeader }}</strong>
                </p>
                <div
                  style="
                    background-color: lightgrey;
                    padding: 3px 10px 10px;
                    margin: 5px;
                    font-size: 0.9em;
                  "
                >
                  <p
                    v-html="
                      getString(
                        'aiSummarizeFirstFewSearchResultHeaderAfterCountWarning'
                      )
                    "
                  />
                </div>
                <div v-if="useMarkdown && canRenderMarkdown" ref="summary">
                  <vue-showdown
                    :options="{ smoothLivePreview: true }"
                    :markdown="getCurrentSummary.body"
                    @click.native.capture="onMarkdownClick"
                  />
                </div>
                <p v-else ref="summary">
                  {{ getCurrentSummary?.body }}
                </p>
                <div style="margin: 20px 5px">
                  <button
                    v-if="getIsSummaryLoading"
                    v-tooltip="{
                      content: getString('hoverretryText'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button"
                    @click="clickStop"
                  >
                    <i class="bx bx-stop-circle" />
                    {{ getString("stopText") }}
                  </button>

                  <button
                    v-if="!getIsSummaryLoading"
                    v-tooltip="{
                      content: getString('hoverretryText'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button"
                    @click="clickRetry"
                  >
                    <i
                      class="bx bx-refresh"
                      style="vertical-align: baseline; font-size: 1em"
                    />
                    {{ getString("retryText") }}
                  </button>

                  <button
                    v-tooltip="{
                      content: getString('hovercopyText'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button"
                    :disabled="getIsSummaryLoading"
                    @click="clickCopy"
                  >
                    <i class="bx bx-copy" style="vertical-align: baseline" />
                    {{ getString("copyText") }}
                  </button>

                  <summarize-article
                    v-if="
                      getUsePDFsummaryFlag &&
                      showSummarizeArticle &&
                      isLicenseAllowed &&
                      isResourceAllowed &&
                      isPubTypeAllowed
                    "
                    :pdf-url="pdfUrl"
                    :html-url="htmlUrl"
                    :language="language"
                    :prompt-language-type="currentSummary"
                    :is-summary-loading="getIsSummaryLoading"
                  />
                </div>
                <p
                  class="qpm_summaryDisclaimer"
                  v-html="getString('aiSummaryDisclaimer')"
                />
              </div>
            </div>
          </template>
          <loading-spinner
            class="qpm_searchSummaryText"
            :wait-text="getString('aiSummaryWaitText')"
            :wait-duration-disclaimer="getWaitTimeString"
            :loading="isCurrentSummaryWaitingForResponse"
            style="align-self: center"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import Vue from "vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeArticle from "@/components/SummarizeArticle.vue";

  import { appSettingsMixin, eventBus } from "@/mixins/appSettings.js";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { languageFormat, dateOptions } from "@/assets/content/qpm-content.js";
  import {
    summarizeSummaryPrompts,
    shortenAbstractPrompts,
    getPromptForLocale,
  } from "@/assets/content/qpm-openAiPrompts";

  export default {
    name: "AiSummaries",
    components: {
      LoadingSpinner,
      SummarizeArticle,
    },
    mixins: [appSettingsMixin],
    props: {
      pubType: {
        type: Array,
        default: () => [],
        required: false,
      },
      license: {
        type: String,
        default: "",
        required: false,
      },
      isLicenseAllowed: {
        type: Boolean,
        default: false,
      },
      isResourceAllowed: {
        type: Boolean,
        default: false,
      },
      isPubTypeAllowed: {
        type: Boolean,
        default: false,
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
      showSummarizeArticle: {
        type: Boolean,
        default: false,
      },
      articles: {
        type: Array,
        default: () => [],
        required: false,
      },
      language: {
        type: String,
        default: "dk",
      },
      prompts: {
        type: Array,
        required: true,
      },
      summaryConsentHeader: {
        type: String,
        default: "",
        required: SVGComponentTransferFunctionElement,
      },
      summarySearchSummaryConsentText: {
        type: String,
        default: null,
        required: SVGComponentTransferFunctionElement,
      },
      successHeader: {
        type: [String, Function],
        required: true,
      },
      errorHeader: {
        type: String,
        required: true,
      },
      getSelectedArticles: {
        type: [Function],
        required: true,
      },
      isMarkedArticles: {
        type: Boolean,
        default: false,
      },
      hasAcceptedAi: Boolean,
      useMarkdown: {
        type: Boolean,
        default: true,
      },
      initialTabPrompt: {
        type: Object,
        default: null,
      },
      checkForPdf: {
        type: Boolean,
        default: false,
      },
    },

    data() {
      return {
        currentSummary: "",
        tabStates: this.prompts.reduce((acc, prompt) => {
          acc[prompt.name] = { currentIndex: 0 };
          return acc;
        }, {}),
        loadingSummaries: [],
        aiSearchSummaries: this.prompts.reduce((acc, prompt) => {
          acc[prompt.name] = [];
          return acc;
        }, {}),
        articleCount: 0,
        showHistory: false,
        stopGeneration: false,
        pdfFound: false,
        articleName: "",
        $helpTextDelay: 300, // Assuming a default value
      };
    },
    computed: {
      getUsePDFsummaryFlag() {
        return this.appSettings.openAi.usePDFsummary;
      },
      getIsSummaryLoading() {
        return this.loadingSummaries.includes(this.currentSummary);
      },
      getCurrentSummaryHistory() {
        if (!this.currentSummary) return null;

        let currentSummaries = this.aiSearchSummaries[this.currentSummary];
        return currentSummaries;
      },
      getCurrentIndex() {
        let tabState = this.tabStates[this.currentSummary];
        let index = tabState?.currentIndex ?? 0;
        return index;
      },
      getCurrentSummary() {
        let summaries = this.getCurrentSummaryHistory;

        if (!summaries || summaries.length == 0) return undefined;

        let index = this.getCurrentIndex;
        return summaries[index];
      },
      getDidCurrentSummaryError() {
        const summary = this.getCurrentSummary;
        return summary?.status == "error";
      },
      isCurrentSummaryWaitingForResponse() {
        const summary = this.getCurrentSummary;
        return (
          summary?.status == "loading" &&
          (!summary?.body || summary.body.length == 0)
        );
      },
      getWaitTimeString() {
        const currentSummary = this.getCurrentSummary;
        if (currentSummary == undefined || !currentSummary.showWaitDisclaimer)
          return "";

        const longAbstractLengthLimit =
          this.appSettings.openAi.longAbstractLengthLimit ?? 5000;

        const totalAbstractLength =
          currentSummary?.articles?.reduce((acc, article) => {
            return acc + article.abstract.length;
          }, 0) ?? 0;

        if (totalAbstractLength > longAbstractLengthLimit) {
          return this.getString("aiLongWaitTimeDisclaimer");
        } else {
          return this.getString("aiShortWaitTimeDisclaimer");
        }
      },
      getTabNames() {
        return this.prompts.map((e) => e.name);
      },
      getSuccessHeader() {
        if (typeof this.successHeader === "function") {
          const currentSummary = this.getCurrentSummary;
          let articles = currentSummary?.articles;
          return (
            articles &&
            this.successHeader(articles, currentSummary.isMarkedArticlesSearch)
          );
        }
        return this.successHeader;
      },
      canRenderMarkdown() {
        const isVueShowdownRegistered =
          !!this.$options.components["VueShowdown"] ||
          !!this.$options.components["vue-showdown"];
        return isVueShowdownRegistered;
      },
      languageFormat() {
        // Define language formats as needed
        return {
          dk: {
            /* date options */
          },
          // other languages
        };
      },
      dateOptions() {
        // Define date options as needed
        return {
          year: "numeric",
          month: "long",
          day: "numeric",
        };
      },
    },
    watch: {
      isLicenseAllowed(newVal) {
        console.log("isLicenseAllowed changed:", newVal);
      },
      isResourceAllowed(newVal) {
        console.log("isResourceAllowed changed:", newVal);
      },
      isPubTypeAllowed(newVal) {
        console.log("isPubTypeAllowed changed:", newVal);
      },
    },
    created() {
      if (this.checkForPdf) {
        this.articleName = this.getSelectedArticles()[0].title;
      }
    },
    activated() {
      if (this.initialTabPrompt != null) {
        this.clickSummaryTab(this.initialTabPrompt);
      }
    },
    methods: {
      getTranslation(value) {
        const lg = this.language;
        const constant = value.translations[lg];
        return constant !== undefined ? constant : value.translations["dk"];
      },
      getString(string) {
        const lg = this.language;
        const constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["dk"];
      },
      getSummaryPromptByName(name) {
        return this.prompts.find(function (prompt) {
          return prompt.name == name;
        });
      },
      getErrorTranslation(error) {
        const lg = this.language;
        try {
          const constant = messages[error][lg];
          return constant !== undefined
            ? constant
            : messages["unknownError"][lg];
        } catch {
          return messages["unknownError"][lg];
        }
      },
      async generateAiSummary(prompt) {
        this.stopGeneration = false;
        const waitTimeDisclaimerDelay =
          this.appSettings.openAi.waitTimeDisclaimerDelay ?? 0;
        this.loadingSummaries.push(prompt.name);
        const localePrompt = getPromptForLocale(prompt, this.language);
        const summarizePrompt = getPromptForLocale(
          summarizeSummaryPrompts.find((p) => prompt.name == p.name),
          this.language
        );
        const shortenAbstractPrompt = getPromptForLocale(
          shortenAbstractPrompts.find((p) => prompt.name == p.name),
          this.language
        );

        const endpoint = "/api/SummarizeSearch";
        const openAiServiceUrl = `${this.appSettings.openAi.baseUrl}${endpoint}`;

        const readData = async (url, body) => {
          let answer = "";
          const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
          });
          if (!response.ok) {
            throw { data: await response.json() };
          }
          const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done || this.stopGeneration) {
              break;
            }
            answer += value;
            this.updateAiSearchSummariesEntry(prompt.name, { body: answer });
          }
          this.updateAiSearchSummariesEntry(prompt.name, {
            responseTime: new Date(),
            status: "success",
          });
        };

        const articles = this.getSelectedArticles();
        if (!articles || articles.length == 0) {
          this.pushToAiSearchSummaries(prompt.name, {
            responseTime: new Date(),
            status: "error",
            articles: articles,
            isMarkedArticlesSearch: this.isMarkedArticles,
            body: this.getErrorTranslation("noAbstractsError"),
          });
          return;
        }

        this.pushToAiSearchSummaries(prompt.name, {
          requestTime: new Date(),
          status: "loading",
          articles: articles,
          body: "",
          isMarkedArticlesSearch: this.isMarkedArticles,
        });

        setTimeout(() => {
          this.updateAiSearchSummariesEntry(prompt.name, {
            showWaitDisclaimer: true,
          });
        }, waitTimeDisclaimerDelay);
        this.articleCount = articles.length;

        try {
          await readData(openAiServiceUrl, {
            prompt: localePrompt,
            articles: articles,
            summarizeAbstractPrompt: summarizePrompt,
            shortenAbstractPrompt: shortenAbstractPrompt,
            client: this.appSettings.client,
          });
        } catch (error) {
          if (error.data) {
            this.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(),
              status: "error",
              body: this.getErrorTranslation("unknownError"),
              error: error.data,
            });
          } else {
            this.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(),
              status: "error",
              body: this.getErrorTranslation("unknownError"),
              error: error,
            });
          }
        } finally {
          const tabIndex = this.loadingSummaries.indexOf(prompt.name);
          this.loadingSummaries.splice(tabIndex, 1);
          Vue.set(this.tabStates[prompt.name], "currentIndex", 0);
        }
      },
      clickSummaryTab(tab) {
        this.currentSummary = tab.name;
        let currentSummaries = this.aiSearchSummaries[tab.name];
        if (
          this.getIsSummaryLoading ||
          (currentSummaries && currentSummaries.length > 0)
        ) {
          return;
        }
        this.generateAiSummary(tab);
      },
      clickStop() {
        this.stopGeneration = true;
      },
      clickRetry(event, moveFocus = false) {
        this.$emit("ai-summaries-click-retry", this);

        const tab = this.getSummaryPromptByName(this.currentSummary);
        if (moveFocus) {
          this.$el.querySelector(`#${tab.name}`).focus();
        }
        this.generateAiSummary(tab);
      },
      clickCopy() {
        const summary = this.$refs.summary;
        navigator.clipboard.writeText(summary.innerText);
      },
      clickCloseSummary() {
        this.$emit("close");
      },
      pushToAiSearchSummaries(key, value) {
        const oldSummaries = this.aiSearchSummaries[key] ?? [];
        const newSummaries = [...oldSummaries, value];
        Vue.set(this.aiSearchSummaries, key, newSummaries);
      },
      updateAiSearchSummariesEntry(summaryName, newValues, index = 0) {
        for (const [key, value] of Object.entries(newValues)) {
          this.$set(this.aiSearchSummaries[summaryName][index], key, value);
        }
      },
      toggleHistory() {
        this.showHistory = !this.showHistory;
      },
      clickHistoryItem(index) {
        Vue.set(this.tabStates[this.currentSummary], "currentIndex", index);
      },
      formatDate(date) {
        const formattedDate = date.toLocaleDateString(
          languageFormat[this.language],
          dateOptions
        );
        return formattedDate;
      },
      onMarkdownClick(event) {
        const target = event.target;

        if (target.tagName !== "A") return;

        const hrefValue = target.getAttribute("href");
        const hrefNumber = Number.parseInt(hrefValue.slice(1));

        if (!hrefValue.startsWith("#") || !Number.isInteger(hrefNumber)) return;

        const selectedArticlesSelectorString = `.qpm_accordion *:where(#${hrefNumber}, [name="${hrefNumber}"])`;
        const searchResultSelectorString = `.qpm_SearchResult *:where(#${hrefNumber}, [name="${hrefNumber}"])`;
        let resultEntry =
          document.querySelector(selectedArticlesSelectorString) ??
          document.querySelector(searchResultSelectorString);
        if (resultEntry == null) {
          console.debug(
            `onMarkdownClick: no article with the name or id '${hrefNumber}' could be found. ref: '${hrefValue}'.`
          );
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        eventBus.$emit("result-entry-show-abstract", { $el: resultEntry });
      },
      getTabTooltipContent(prompt) {
        const tooltip = prompt?.tooltip;
        if (!tooltip) return null;

        return tooltip[this.language];
      },
    },
  };
</script>
