<template>
  <div class="qpm_flex qpm_bottom qpm_actionButtonsRow">
    <div class="qpm_actionButtonsGroup">
      <!-- The reset button -->
      <button
        type="button"
        v-tooltip="{
          content: getString('hoverResetButton'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="clear"
      >
        <i class="bx bx-reset qpm_iconBaseline" aria-hidden="true" />
        {{ getString("reset") }}
      </button>

      <!-- The copy link button -->
      <button
        type="button"
        v-tooltip="copyUrlTooltipBinding"
        class="qpm_button"
        @click="copyUrl"
      >
        <i class="bx bx-link qpm_iconBaseline" aria-hidden="true" />
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
      :class="{ qpm_disabled: searchLoading }"
      class="qpm_button qpm_search"
      @click="searchsetLowStart"
    >
      <i class="bx bx-search bx-flip-horizontal qpm_searchIcon" aria-hidden="true" />
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

