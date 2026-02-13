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
    <span v-if="localSearchWithAI" class="qpm_aiToggle">
      <div>
        <i
          class="ri-sparkling-fill"
        />
      </div>
      <div>
        {{ getString("searchToggleWithAI") }}
        <button
          v-tooltip="{
            content: getString('hoversearchToggleWithAI'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="bx bx-info-circle"
          style="cursor: help"
          aria-label="Info"
        />
      </div>
    </span>
    <span v-else class="qpm_aiToggle">
      <div>
        <i
          style="color: darkgray"
          class="ri-sparkling-fill"
        />
      </div>
      <div>
        {{ getString("searchToggleWithoutAI") }}
        <button
          v-tooltip="{
            content: getString('hoversearchToggleWithoutAI'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="bx bx-info-circle"
          style="cursor: help"
          aria-label="Info"
        />
      </div>
    </span>
  </div>
</template>

<script>
  import { config } from "@/config/config.js";

  export default {
    name: "AiTranslationToggle",
    props: {
      isCollapsed: Boolean,
      modelValue: {
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
          return this.modelValue;
        },
        set(newValue) {
          this.$emit("update:modelValue", newValue);
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
