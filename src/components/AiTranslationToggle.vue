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
      <div class="qpm_infoInline">
        <template v-if="getSearchToggleWithAIParts().prefix">
          {{ getSearchToggleWithAIParts().prefix }}
        </template>
        <span class="qpm_keepWithIcon">
          {{ getSearchToggleWithAIParts().last }}
          <button
            v-tooltip="{
              content: getString('hoversearchToggleWithAI'),
              distance: 5,
              delay: $helpTextDelay,
            theme: 'infoTooltip',
            }"
            class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
            aria-label="Info"
          />
        </span>
      </div>
    </span>
    <span v-else class="qpm_aiToggle">
      <div>
        <i class="ri-sparkling-fill qpm_aiIconMuted" />
      </div>
      <div class="qpm_infoInline">
        <template v-if="getSearchToggleWithoutAIParts().prefix">
          {{ getSearchToggleWithoutAIParts().prefix }}
        </template>
        <span class="qpm_keepWithIcon">
          {{ getSearchToggleWithoutAIParts().last }}
          <button
            v-tooltip="{
              content: getString('hoversearchToggleWithoutAI'),
              distance: 5,
              delay: $helpTextDelay,
            theme: 'infoTooltip',
            }"
            class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
            aria-label="Info"
          />
        </span>
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
      getSearchToggleWithAIParts() {
        return this.splitLastWord(this.getString("searchToggleWithAI"));
      },
      getSearchToggleWithoutAIParts() {
        return this.splitLastWord(this.getString("searchToggleWithoutAI"));
      },
      toggleAiSearch() {
        this.localSearchWithAI = !this.localSearchWithAI;
      },
    },
  };
</script>

