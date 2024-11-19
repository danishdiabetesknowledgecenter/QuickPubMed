<template>
  <div
    v-if="showingTranslation"
    class="qpm_searchSummaryText qpm_searchSummaryTextBackground qpm_searchTranslatedTitle"
  >
    <loading-spinner :loading="loading" style="display: inline-block" />
    <div v-if="useMarkdown && canRenderMarkdown">
      <vue-showdown :options="{ smoothLivePreview: true }" :markdown="text" />
    </div>
    <p v-else>
      {{ text }}
    </p>
    <div style="margin-top: 20px; margin-left: 5px">
      <button
        v-if="writing"
        v-tooltip="{
          content: getString('hoverretryText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="qpm_button"
        @click="clickStop"
      >
        <i class="bx bx-stop-circle" /> {{ getString('stopText') }}
      </button>
      <button
        v-if="translationLoaded"
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
        {{ getString('retryText') }}
      </button>
      <button
        v-tooltip="{
          content: getString('hovercopyText'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="qpm_button"
        :disabled="loading"
        @click="clickCopy"
      >
        <i class="bx bx-copy" style="vertical-align: baseline" />
        {{ getString('copyText') }}
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
  import LoadingSpinner from '@/components/LoadingSpinner.vue'
  import { appSettingsMixin } from '@/mixins/appSettings.js'
  import { messages } from '@/assets/content/qpm-translations.js'
  import {
    getPromptForLocale,
    titleTranslationPrompt,
  } from '@/assets/content/qpm-openAiPrompts.js'

  export default {
    name: 'AiTranslation',
    components: {
      LoadingSpinner,
    },
    mixins: [appSettingsMixin],
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
        text: this.getString('aiTranslationWaitText'),
      }
    },
    watch: {
      showingTranslation: {
        handler: async function (newValue) {
          if (newValue) {
            // Trigger when showingTranslation is true
            await this.showTranslation()
          }
        },
        immediate: false, // Usually, immediate: true triggers on component creation
      },
    },
    methods: {
      async showTranslation() {
        console.log(
          `Translation Loaded: ${this.translationLoaded}, Loading: ${this.loading}`
        )

        if (!this.translationLoaded && !this.loading) {
          this.loading = true // Set loading state
          try {
            await this.translateTitle()
            this.translationLoaded = true
          } catch (error) {
            console.error('Translation failed:', error)
          } finally {
            this.loading = false // Reset loading state
          }
        }
      },
      getString(string) {
        const lg = this.language
        const constant = messages[string][lg]
        return constant !== undefined ? constant : messages[string]['dk']
      },
      async translateTitle(showSpinner = true) {
        console.log('Translating title', this.title)
        this.loading = showSpinner
        this.stopGeneration = false
        const openAiServiceUrl = `${this.appSettings.openAi.baseUrl}/api/TranslateTitle`
        const localePrompt = getPromptForLocale(titleTranslationPrompt, 'dk')

        const readData = async (url, body) => {
          let answer = ''
          try {
            const response = await fetch(url, {
              method: 'POST',
              body: JSON.stringify(body),
            })
            if (!response.ok) {
              const data = await response.json()
              throw new Error(JSON.stringify(data))
            }
            const reader = response.body
              .pipeThrough(new TextDecoderStream())
              .getReader()

            this.loading = false
            this.writing = true
            while (true) {
              const { done, value } = await reader.read()
              if (done || this.stopGeneration) {
                break
              }
              answer += value
              this.text = answer
            }
            this.writing = false
          } catch (error) {
            this.text = `An unknown error occurred: \n${error.toString()}`
          } finally {
            this.loading = false
            this.writing = false
            this.translationLoaded = true
          }
        }

        await readData(openAiServiceUrl, {
          prompt: localePrompt,
          title: this.title,
          client: this.appSettings.client,
        })
      },
      clickCopy() {
        navigator.clipboard.writeText(this.text)
      },
      clickStop() {
        this.stopGeneration = true
      },
      clickRetry() {
        if (!this.translationLoaded || this.loading) {
          console.debug(
            'Attempted to retry translation, but refused due to loading state',
            this
          )
          return
        }
        this.translationLoaded = false
        this.showTranslation()
      },
      canRenderMarkdown() {
        return (
          !!this.$options.components['VueShowdown'] ||
          !!this.$options.components['vue-showdown']
        )
      },
    },
  }
</script>
