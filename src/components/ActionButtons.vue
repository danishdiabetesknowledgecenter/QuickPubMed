<template>
  <div class="qpm_flex qpm_bottom" style="justify-content: space-between">
    <div style="position: relative">
      <!-- The reset button -->
      <button
        v-tooltip="{
          content: getString('hoverResetButton'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="clear"
      >
        <i class="bx bx-reset" style="vertical-align: baseline" />
        {{ getString("reset") }}
      </button>

      <!-- The copy link button -->
      <button
        v-tooltip="{
          content: getString('hoverShareButton'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_button"
        @click="copyUrl"
      >
        <i class="bx bx-link" style="margin-right: 5px; vertical-align: baseline" />
        {{ getString("getUrl") }}
      </button>
    </div>

    <!-- The search button -->
    <button
      v-tooltip="{
        content: getString('hoverSearchButton'),
        offset: 5,
        delay: $helpTextDelay,
      }"
      :disabled="searchLoading"
      :class="{ qpm_disabled: searchLoading }"
      class="qpm_button qpm_search"
      @click="searchsetLowStart"
    >
      <i class="bx bx-search bx-flip-horizontal" style="position: relative; bottom: 1px" />
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
        default: () => () => "",
      },
      $helpTextDelay: {
        type: Object,
        default: () => ({ show: 500, hide: 100 }),
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
