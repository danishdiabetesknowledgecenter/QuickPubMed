<template>
  <div class="qpm_flex qpm_bottom qpm_actionButtonsRow">
    <div class="qpm_actionButtonsGroup">
      <!-- The reset button -->
      <button
        v-tooltip="{
          content: getString('hoverResetButton'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="clear"
      >
        <i class="bx bx-reset qpm_iconBaseline" />
        {{ getString("reset") }}
      </button>

      <!-- The copy link button -->
      <button
        v-tooltip="{
          content: getString('hoverShareButton'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="copyUrl"
      >
        <i class="bx bx-link qpm_iconBaseline" />
        {{ getString("getUrl") }}
      </button>
    </div>

    <!-- The search button -->
    <button
      v-tooltip="{
        content: getString('hoverSearchButton'),
        distance: 5,
        delay: $helpTextDelay,
      }"
      :disabled="searchLoading"
      :class="{ qpm_disabled: searchLoading }"
      class="qpm_button qpm_search"
      @click="searchsetLowStart"
    >
      <i class="bx bx-search bx-flip-horizontal qpm_searchIcon" />
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

