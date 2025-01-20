<template>
  <div v-show="!isCollapsed && config.useAI" class="qpm_switch_wrap qpm_ai_hide">
    <label class="qpm_switch">
      <input
        v-model="localSearchWithAI"
        type="checkbox"
        :title="titleSearchWithAI"
        @keyup.enter="toggleAiSearch"
      />
      <span class="qpm_slider qpm_round" />
    </label>
    <span v-if="localSearchWithAI" class="qpm_simpleFiltersHeader">
      {{ getString("searchToggleWithAI") }}
      <button
        v-tooltip="{
          content: getString('hoversearchToggleWithAI'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="bx bx-info-circle"
        style="cursor: help"
      />
    </span>
    <span v-else class="qpm_simpleFiltersHeader">
      {{ getString("searchToggleWithoutAI") }}
      <button
        v-tooltip="{
          content: getString('hoversearchToggleWithoutAI'),
          offset: 5,
          delay: $helpTextDelay,
          hideOnTargetClick: false,
        }"
        class="bx bx-info-circle"
        style="cursor: help"
      />
    </span>
  </div>
</template>

<script>
  import { config } from "@/config/config.js";

  export default {
    name: "AiTranslationToggle",
    props: {
      isCollapsed: Boolean,
      value: {
        type: Boolean,
        default: false,
      },
      getString: {
        type: Function,
        default: () => "",
      },
    },
    data: function () {
      return {
        titleSearchWithAI: this.getString("searchToggleWithAI"),
      };
    },
    computed: {
      config() {
        return config;
      },
      localSearchWithAI: {
        get() {
          return this.value;
        },
        set(newValue) {
          this.$emit("input", newValue);
        },
      },
    },
    methods: {
      toggleAiSearch() {
        this.localSearchWithAI = !this.localSearchWithAI;
      },
    },
  };
</script>
