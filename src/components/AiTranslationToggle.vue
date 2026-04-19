<template>
  <div v-show="!isCollapsed && config.useAI" :class="wrapperClass">
    <template v-if="displayMode === 'switch'">
      <label class="qpm_switch">
        <input
          v-model="localSearchWithAI"
          type="checkbox"
          :disabled="disabled"
          :title="titleSearchWithAI"
          :aria-label="titleSearchWithAI"
          @keyup.enter="toggleAiSearch"
        />
        <span class="qpm_slider qpm_round" />
      </label>
      <span class="qpm_aiToggle">
        <div v-if="iconClass">
          <i :class="localSearchWithAI ? iconClass : `${iconClass} qpm_aiIconMuted`" aria-hidden="true" />
        </div>
        <div class="qpm_infoInline">
          <span class="qpm_keepWithIcon">
            {{ activeLabel }}
            <button
              type="button"
              v-tooltip="{
                content: localSearchWithAI ? activeTooltipContent : inactiveTooltipContent,
                distance: 5,
                delay: $helpTextDelay,
                theme: 'infoTooltip',
              }"
              class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
              :aria-label="getString('infoAiTranslationLabel')"
            />
          </span>
        </div>
      </span>
    </template>
    <template v-else>
      <label class="qpm_sourceCheckboxLabel">
        <input
          v-model="localSearchWithAI"
          class="qpm_sourceCheckboxInput"
          type="checkbox"
          :disabled="disabled"
          :title="titleSearchWithAI"
          :aria-label="titleSearchWithAI"
          @keyup.enter="toggleAiSearch"
        />
        <span class="qpm_sourceCheckboxText qpm_aiToggle">
          <span v-if="iconClass" class="qpm_sourceCheckboxIcon">
            <i :class="localSearchWithAI ? iconClass : `${iconClass} qpm_aiIconMuted`" aria-hidden="true" />
          </span>
          <span class="qpm_infoInline">
            <span class="qpm_keepWithIcon">
              {{ activeLabel }}
              <button
                type="button"
                v-tooltip="{
                  content: localSearchWithAI ? activeTooltipContent : inactiveTooltipContent,
                  distance: 5,
                  delay: $helpTextDelay,
                  theme: 'infoTooltip',
                }"
                class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
                :aria-label="getString('infoAiTranslationLabel')"
              />
            </span>
          </span>
        </span>
      </label>
    </template>
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
      disabled: {
        type: Boolean,
        default: false,
      },
      displayMode: {
        type: String,
        default: "checkbox",
      },
      showOffStateLabel: {
        type: Boolean,
        default: true,
      },
      labelWithKey: {
        type: String,
        default: "searchToggleWithAI",
      },
      labelWithoutKey: {
        type: String,
        default: "searchToggleWithoutAI",
      },
      hoverWithKey: {
        type: String,
        default: "hoversearchToggleWithAI",
      },
      hoverWithoutKey: {
        type: String,
        default: "hoversearchToggleWithoutAI",
      },
      iconClass: {
        type: String,
        default: "ri-sparkling-fill",
      },
      getString: {
        type: Function,
        default: () => "",
      },
      tooltipSuffix: {
        type: String,
        default: "",
      },
    },
    computed: {
      config() {
        return config;
      },
      wrapperClass() {
        return this.displayMode === "switch"
          ? "qpm_switch_wrap qpm_ai_hide"
          : "qpm_sourceCheckboxWrap qpm_ai_hide";
      },
      activeLabel() {
        return this.getString(
          this.localSearchWithAI || !this.showOffStateLabel ? this.labelWithKey : this.labelWithoutKey
        );
      },
      activeTooltipContent() {
        return `${this.getString(this.hoverWithKey)}${this.tooltipSuffix || ""}`;
      },
      inactiveTooltipContent() {
        return `${this.getString(this.hoverWithoutKey)}${this.tooltipSuffix || ""}`;
      },
      titleSearchWithAI() {
        return this.activeLabel;
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

