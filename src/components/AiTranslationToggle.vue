<template>
  <div v-show="!isCollapsed && config.useAI" :class="wrapperClass">
    <template v-if="displayMode === 'switch'">
      <label class="mugin_switch">
        <input
          v-model="localSearchWithAI"
          type="checkbox"
          :disabled="disabled"
          :title="titleSearchWithAI"
          :aria-label="titleSearchWithAI"
          @keyup.enter="toggleAiSearch"
        />
        <span class="mugin_slider mugin_round" />
      </label>
      <span class="mugin_aiToggle">
        <div v-if="iconClass">
          <i :class="localSearchWithAI ? iconClass : `${iconClass} mugin_aiIconMuted`" aria-hidden="true" />
        </div>
        <div class="mugin_infoInline">
          <template v-if="activeLabelParts.prefix">
            {{ activeLabelParts.prefix }}
          </template>
          <span class="mugin_keepWithIcon">
            {{ activeLabelParts.last }}
            <button
              type="button"
              v-tooltip="{
                content: localSearchWithAI ? activeTooltipContent : inactiveTooltipContent,
                distance: 5,
                delay: $helpTextDelay,
                theme: 'infoTooltip',
              }"
              class="bx bx-info-circle mugin_cursorHelp mugin_infoIcon"
              :aria-label="getString('infoAiTranslationLabel')"
            />
          </span>
        </div>
      </span>
    </template>
    <template v-else>
      <label class="mugin_sourceCheckboxLabel">
        <input
          v-model="localSearchWithAI"
          class="mugin_sourceCheckboxInput"
          type="checkbox"
          :disabled="disabled"
          :title="titleSearchWithAI"
          :aria-label="titleSearchWithAI"
          @keyup.enter="toggleAiSearch"
        />
        <span class="mugin_sourceCheckboxText mugin_aiToggle">
          <span v-if="iconClass" class="mugin_sourceCheckboxIcon">
            <i :class="localSearchWithAI ? iconClass : `${iconClass} mugin_aiIconMuted`" aria-hidden="true" />
          </span>
          <span class="mugin_infoInline">
            <template v-if="activeLabelParts.prefix">
              {{ activeLabelParts.prefix }}
            </template>
            <span class="mugin_keepWithIcon">
              {{ activeLabelParts.last }}
              <button
                type="button"
                v-tooltip="{
                  content: localSearchWithAI ? activeTooltipContent : inactiveTooltipContent,
                  distance: 5,
                  delay: $helpTextDelay,
                  theme: 'infoTooltip',
                }"
                class="bx bx-info-circle mugin_cursorHelp mugin_infoIcon"
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
          ? "mugin_switch_wrap mugin_ai_hide"
          : "mugin_sourceCheckboxWrap mugin_ai_hide";
      },
      activeLabel() {
        return this.getString(
          this.localSearchWithAI || !this.showOffStateLabel ? this.labelWithKey : this.labelWithoutKey
        );
      },
      activeLabelParts() {
        return this.splitLastWord(this.activeLabel);
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
      splitLastWord(text) {
        const normalized = String(text || "").trim();
        const lastSpace = normalized.lastIndexOf(" ");
        if (lastSpace < 0) {
          return { prefix: "", last: normalized };
        }
        return {
          prefix: normalized.slice(0, lastSpace) + " ",
          last: normalized.slice(lastSpace + 1),
        };
      },
      toggleAiSearch() {
        this.localSearchWithAI = !this.localSearchWithAI;
      },
    },
  };
</script>

