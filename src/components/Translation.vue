<template>
  <div
    v-if="showingTranslation"
    class="qpm_searchSummaryText qpm_searchSummaryTextBackground qpm_searchTranslatedTitle"
  >
    <Spinner :loading="loading" style="display: inline-block" />
    <div v-if="useMarkdown && canRenderMarkdown">
      <VueShowdown :options="{ smoothLivePreview: true }" :markdown="text" />
    </div>
    <p v-else>{{ text }}</p>
    <div style="margin-top: 20px; margin-left: 5px">
      <button
        v-if="writing"
        class="qpm_button"
        @click="clickStop"
        v-tooltip="{
          content: getString('hoverretryText'),
          offset: 5,
          delay: helpTextDelay,
          hideOnTargetClick: false,
        }"
      >
        <i class="bx bx-stop-circle"></i> {{ getString("stopText") }}
      </button>
      <button
        v-if="translationLoaded"
        class="qpm_button"
        @click="clickRetry"
        v-tooltip="{
          content: getString('hoverretryText'),
          offset: 5,
          delay: helpTextDelay,
          hideOnTargetClick: false,
        }"
      >
        <i
          class="bx bx-refresh"
          style="vertical-align: baseline; font-size: 1em"
        ></i>
        {{ getString("retryText") }}
      </button>
      <button
        class="qpm_button"
        :disabled="loading"
        @click="clickCopy"
        v-tooltip="{
          content: getString('hovercopyText'),
          offset: 5,
          delay: helpTextDelay,
          hideOnTargetClick: false,
        }"
      >
        <i class="bx bx-copy" style="vertical-align: baseline"></i>
        {{ getString("copyText") }}
      </button>
    </div>
    <p
      v-if="!loading"
      class="qpm_translationDisclaimer"
      v-html="getString('translationDisclaimer')"
    ></p>
  </div>
</template>

<script>
import Spinner from "@/components/Spinner.vue";
import VueShowdown from "vue-showdown";
import { appSettingsMixin } from "@/mixins/appSettings";

export default {
  name: "Translation",
  mixins: [appSettingsMixin],
  components: {
    Spinner,
    VueShowdown,
  },
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
      helpTextDelay: 300, // Define helpTextDelay or fetch from mixin
    };
  },
  watch: {
    showingTranslation: {
      handler: async function (newValue) {
        if (!newValue) {
          await this.showTranslation();
        }
      },
      immediate: true,
    },
  },
  methods: {
    async showTranslation() {
      if (this.showingTranslation) {
        if (!this.translationLoaded && !this.loading) {
          await this.translateTitle();
        }
      }
    },
    getString(string) {
      const lg = this.language;
      const constant = messages[string][lg];
      return constant !== undefined ? constant : messages[string]["dk"];
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
            const data = await response.json();
            throw new Error(JSON.stringify(data));
          }
          const reader = response.body
            .pipeThrough(new TextDecoderStream())
            .getReader();

          this.loading = false;
          this.writing = true;
          while (true) {
            const { done, value } = await reader.read();
            if (done || this.stopGeneration) {
              break;
            }
            answer += value;
            this.text = answer;
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

      await readData(openAiServiceUrl, {
        prompt: localePrompt,
        title: this.title,
        client: this.appSettings.client,
      });
    },
    clickCopy() {
      navigator.clipboard.writeText(this.text);
    },
    clickStop() {
      this.stopGeneration = true;
    },
    clickRetry() {
      if (!this.translationLoaded || this.loading) {
        console.debug(
          "Attempted to retry translation, but refused due to loading state",
          this
        );
        return;
      }
      this.translationLoaded = false;
      this.showTranslation();
    },
    canRenderMarkdown() {
      return (
        !!this.$options.components["VueShowdown"] ||
        !!this.$options.components["vue-showdown"]
      );
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
