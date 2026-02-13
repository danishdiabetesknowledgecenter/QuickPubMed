<template>
  <div
    v-if="showingTranslation"
    class="qpm_searchSummaryText qpm_searchSummaryTextBackground qpm_searchTranslatedTitle"
  >
    <div v-if="useMarkdown && canRenderMarkdown">
      <vue-showdown :options="{ smoothLivePreview: true }" :markdown="text" />
    </div>
    <div v-else>
      <p>{{ text }}</p>
    </div>
    <div v-if="loading" style="margin: 30px 0; min-height: 1px;">
      <loading-spinner :loading="loading"/>
    </div>
    <div style="margin-top: 20px; margin-left: 5px">
      <button
        v-if="writing"
        v-tooltip="{
          content: getString('hoverretryText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="clickStop"
      >
        <i class="bx bx-stop-circle" /> {{ getString("stopText") }}
      </button>
      <button
        v-if="translationLoaded"
        v-tooltip="{
          content: getString('hoverretryText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="clickRetry"
      >
        <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em" />
        {{ getString("retryText") }}
      </button>
      <button
        v-if="!loading"
        v-tooltip="{
          content: getString('hovercopyText'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="clickCopy"
      >
        <i class="bx bx-copy" style="vertical-align: baseline" />
        {{ getString("copyText") }}
      </button>
    </div>
    <p
      v-if="!loading"
      class="qpm_translationDisclaimer"
      v-html="getString('translationDisclaimer')"
    />
  </div>
</template>

<script>
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { getPromptForLocale } from "@/utils/qpm-prompts-helpers.js";
  import { titleTranslationPrompt } from "@/assets/content/qpm-prompts-translation.js";

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
      useMarkdown: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        translationLoaded: false,
        loading: false,
        writing: false,
        stopGeneration: false,
        text: this.getString("aiTranslationWaitText"),
      };
    },
    watch: {
      showingTranslation: {
        handler: async function (newValue) {
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
      async translateTitle(showSpinner = true) {
        this.loading = showSpinner;
        this.stopGeneration = false;
        const openAiServiceUrl = `${this.appSettings.openAi.baseUrl}/api/TranslateTitle`;
        const localePrompt = getPromptForLocale(titleTranslationPrompt, "dk");

        const readData = async (url, body) => {
          let answer = "";
          try {
            const response = await fetch(url, {
              method: "POST",
              body: JSON.stringify(body),
            });
            if (!response.ok) {
              let errorBody;
              try {
                errorBody = await response.json();
              } catch {
                errorBody = await response.text();
              }
              throw new Error(typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody));
            }
            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

            this.loading = false;
            let done = false;

            while (!done && !this.stopGeneration) {
              const { done: readerDone, value } = await reader.read();
              done = readerDone;
              if (value) {
                answer += value;
                this.text = answer;
              }
            }
            this.writing = false;
          } catch (error) {
            this.text = `An unknown error occurred: \n${error.toString()}`;
          } finally {
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
        navigator.clipboard.writeText(this.text);
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
      canRenderMarkdown() {
        // In Vue 3, globally registered components (via app.use()) are not in $options.components.
        // VueShowdown is always registered as a plugin in all entry points.
        return true;
      },
    },
  };
</script>
