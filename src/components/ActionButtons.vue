<template>
  <div class="mugin_flex mugin_bottom mugin_actionButtonsRow">
    <div class="mugin_actionButtonsGroup">
      <!-- The reset button -->
      <button
        type="button"
        v-tooltip="{
          content: getString('hoverResetButton'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="mugin_button"
        @click="clear"
      >
        <i class="bx bx-reset mugin_iconBaseline" aria-hidden="true" />
        {{ getString("reset") }}
      </button>

      <!-- The copy link button -->
      <button
        type="button"
        v-tooltip="copyUrlTooltipBinding"
        class="mugin_button"
        @click="copyUrl"
      >
        <i class="bx bx-link mugin_iconBaseline" aria-hidden="true" />
        {{ getString("getUrl") }}
      </button>
    </div>

    <!-- The search button -->
    <button
      type="button"
      v-tooltip="{
        content: getString('hoverSearchButton'),
        distance: 5,
        delay: $helpTextDelay,
      }"
      :disabled="searchLoading"
      :aria-busy="searchLoading"
      :class="{ mugin_disabled: searchLoading }"
      class="mugin_button mugin_search"
      @click="searchsetLowStart"
    >
      <i class="bx bx-search bx-flip-horizontal mugin_searchIcon" aria-hidden="true" />
      {{ getString("search") }}
    </button>
  </div>
</template>

<script>
  export default {
    name: "ActionButtons",
    props: {
      searchLoading: {
        type: Boolean,
        default: false,
      },
      getString: {
        type: Function,
        default: () => "",
      },
      copyUrlStatusMessage: {
        type: String,
        default: "",
      },
    },
    computed: {
      // When a copy-URL status message is set, force the tooltip open with that
      // message (programmatic control). Otherwise use the normal hover tooltip.
      copyUrlTooltipBinding() {
        if (this.copyUrlStatusMessage) {
          return {
            content: this.copyUrlStatusMessage,
            shown: true,
            triggers: [],
            distance: 5,
          };
        }
        return {
          content: this.getString("hoverShareButton"),
          distance: 5,
          delay: this.$helpTextDelay,
        };
      },
    },
    methods: {
      clear() {
        this.$emit("clear");
      },
      copyUrl() {
        this.$emit("copyUrl");
      },
      searchsetLowStart() {
        this.$emit("searchsetLowStart");
      },
    },
  };
</script>

