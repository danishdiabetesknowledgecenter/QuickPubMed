<template>
  <div
    v-if="showingTranslation"
    class="mugin_searchSummaryText mugin_searchSummaryTextBackground mugin_searchTranslatedTitle"
  >
    <div lang="da">
      <p v-if="errorText" class="mugin_translatedTitleError">{{ errorText }}</p>
      <p v-else-if="!longStarted">{{ getString("aiTranslationWaitText") }}</p>
      <template v-else>
        <p class="mugin_translatedTitleLong">{{ longTitle }}</p>
        <p v-if="showShortTitle" class="mugin_translatedTitleShort">
          <span class="mugin_translatedTitleShortLabel">{{
            getString("translatedTitleShortLabel")
          }}</span>
          {{ shortTitle }}
        </p>
      </template>
    </div>
    <div v-if="loading" class="mugin_translationLoadingSpacer">
      <loading-spinner :loading="loading" />
    </div>
    <div class="mugin_translationActions">
      <button
        v-if="writing"
        type="button"
        v-tooltip="{
          content: getString('hoverretryText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="mugin_button"
        @click="clickStop"
      >
        <i class="bx bx-stop-circle" aria-hidden="true" /> {{ getString("stopText") }}
      </button>
      <button
        v-if="translationLoaded"
        type="button"
        v-tooltip="{
          content: getString('hoverretryText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="mugin_button"
        @click="clickRetry"
      >
        <i class="bx bx-refresh mugin_iconBaselineSize" aria-hidden="true" />
        {{ getString("retryText") }}
      </button>
      <button
        v-if="!loading"
        type="button"
        v-tooltip="{
          content: getString('hovercopyText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="mugin_button"
        @click="clickCopy"
      >
        <i class="bx bx-copy mugin_iconBaseline" aria-hidden="true" />
        {{ getString("copyText") }}
      </button>
    </div>
    <p
      v-if="!loading"
      class="mugin_translationDisclaimer"
      v-html="sanitizeHtml(getString('translationDisclaimer'))"
    />
  </div>
</template>

<script>
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { getPromptForLocale } from "@/utils/promptsHelpers.js";
  import { postJsonWithModelFallback } from "@/utils/openAiTaskSettings.js";
  import { titleTranslationPrompt } from "@/assets/prompts/translation.js";
  import { extractTitleTranslationFields } from "@/utils/titleTranslationStream.js";

  export default {
    name: "AiTranslation",
    components: {
      LoadingSpinner,
    },
    mixins: [appSettingsMixin, utilitiesMixin],
    props: {
      showingTranslation: {
        type: Boolean,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      language: {
        type: String,
        default: "dk",
      },
    },
    data() {
      return {
        translationLoaded: false,
        loading: false,
        writing: false,
        stopGeneration: false,
        rawTranslation: "",
        longTitle: "",
        shortTitle: "",
        longStarted: false,
        longComplete: false,
        errorText: "",
      };
    },
    computed: {
      showShortTitle() {
        return this.longComplete && this.shortTitle !== "";
      },
    },
    watch: {
      showingTranslation: {
        async handler(newValue) {
          if (newValue) {
            // Trigger when showingTranslation is true
            await this.showTranslation();
          }
        },
        immediate: false, // Usually, immediate: true triggers on component creation
      },
    },
    methods: {
      async showTranslation() {
        if (!this.translationLoaded && !this.loading) {
          this.loading = true; // Set loading state
          try {
            await this.translateTitle();
            this.translationLoaded = true;
          } catch (error) {
            console.error("Translation failed:", error);
          } finally {
            this.loading = false; // Reset loading state
          }
        }
      },
      applyTranslationBuffer(buffer) {
        const fields = extractTitleTranslationFields(buffer);
        this.longStarted = fields.long.started && fields.long.value !== "";
        this.longComplete = fields.long.complete;
        if (fields.long.started) {
          this.longTitle = fields.long.value;
        }
        if (fields.long.complete && fields.short.started) {
          this.shortTitle = fields.short.value;
        } else if (!fields.long.complete) {
          this.shortTitle = "";
        }
      },
      async translateTitle(showSpinner = true) {
        this.loading = showSpinner;
        this.stopGeneration = false;
        this.rawTranslation = "";
        this.longTitle = "";
        this.shortTitle = "";
        this.longStarted = false;
        this.longComplete = false;
        this.errorText = "";
        const openAiServiceUrl = `${this.appSettings.openAi.baseUrl}/api/TranslateTitle.php`;
        const localePrompt = getPromptForLocale(titleTranslationPrompt, "dk", "translate");

        const readData = async (url, body) => {
          let answer = "";
          try {
            const response = await postJsonWithModelFallback(url, body);
            if (!response.ok) {
              let errorBody;
              try {
                errorBody = await response.json();
              } catch {
                errorBody = await response.text();
              }
              throw new Error(typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody));
            }
            const responseBody = response.body;
            if (!responseBody || typeof responseBody.pipeThrough !== "function") {
              answer = await response.text();
              this.rawTranslation = answer;
              this.applyTranslationBuffer(answer);
              this.writing = false;
              return;
            }
            const reader = responseBody.pipeThrough(new TextDecoderStream()).getReader();

            this.loading = false;
            let done = false;

            while (!done && !this.stopGeneration) {
              const { done: readerDone, value } = await reader.read();
              done = readerDone;
              if (value) {
                answer += value;
                this.rawTranslation = answer;
                this.applyTranslationBuffer(answer);
              }
            }
            this.writing = false;
          } catch (error) {
            this.errorText = `An unknown error occurred: \n${error.toString()}`;
          } finally {
            if (
              !this.errorText &&
              !this.longStarted &&
              this.rawTranslation.trim() &&
              !this.rawTranslation.includes("{")
            ) {
              this.longTitle = this.rawTranslation.trim();
              this.longStarted = true;
              this.longComplete = true;
            }
            this.loading = false;
            this.writing = false;
            this.translationLoaded = true;
          }
        };

        const requestBody = {
          prompt: localePrompt,
          title: this.title,
          client: this.appSettings.client,
        };

        console.info(
          `|TranslateTitle Request|\n\n|Title|\n${this.title}\n\n|Prompt text|\n${localePrompt.prompt}\n`
        );

        await readData(openAiServiceUrl, requestBody);
      },
      clickCopy() {
        const parts = [];
        if (this.longTitle) parts.push(this.longTitle);
        if (this.showShortTitle) {
          parts.push(`${this.getString("translatedTitleShortLabel")} ${this.shortTitle}`);
        }
        const text = parts.join("\n");
        if (!text) return;
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(text);
        }
      },
      clickStop() {
        this.stopGeneration = true;
      },
      clickRetry() {
        if (!this.translationLoaded || this.loading) {
          console.debug("Attempted to retry translation, but refused due to loading state", this);
          return;
        }
        this.translationLoaded = false;
        this.showTranslation();
      },
    },
  };
</script>
