<template>
  <div
    v-if="!isCollapsed"
    class="qpm_tabs"
    role="tablist"
    :aria-label="getString('searchModeTablistLabel')"
  >
    <button
      :id="advancedTabId"
      ref="advancedTab"
      type="button"
      role="tab"
      :aria-selected="advanced"
      :aria-controls="advancedPanelId"
      :tabindex="advanced ? 0 : -1"
      v-tooltip="
        !advanced
          ? {
              content: getString('hoverAdvancedText'),
              distance: 5,
              delay: $helpTextDelay,
            }
          : null
      "
      :class="['qpm_tab', { qpm_tab_active: advanced }]"
      @click="activateAdvanced"
      @keydown="onAdvancedTabKeydown"
    >
      {{ getString("advancedSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </button>

    <button
      :id="simpleTabId"
      ref="simpleTab"
      type="button"
      role="tab"
      :aria-selected="!advanced"
      :aria-controls="simplePanelId"
      :tabindex="!advanced ? 0 : -1"
      v-tooltip="
        advanced
          ? {
              content: getString('hoverBasicText'),
              distance: 5,
              delay: $helpTextDelay,
            }
          : null
      "
      :class="['qpm_tab', { qpm_tab_active: !advanced }]"
      @click="activateSimple"
      @keydown="onSimpleTabKeydown"
    >
      {{ getString("simpleSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </button>
  </div>
</template>

<script>
  export default {
    name: "AdvancedSearchToggle",
    props: {
      advanced: {
        type: Boolean,
        default: false,
      },
      isCollapsed: {
        type: Boolean,
        default: false,
      },
      getString: {
        type: Function,
        default: () => "",
      },
      simpleTabId: {
        type: String,
        required: true,
      },
      advancedTabId: {
        type: String,
        required: true,
      },
      simplePanelId: {
        type: String,
        required: true,
      },
      advancedPanelId: {
        type: String,
        required: true,
      },
    },
    methods: {
      activateAdvanced() {
        if (!this.advanced) {
          this.$emit("toggle-advanced");
        }
      },
      activateSimple() {
        if (this.advanced) {
          this.$emit("toggle-advanced");
        }
      },
      onAdvancedTabKeydown(e) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          this.activateSimple();
          this.$nextTick(() => this.$refs.simpleTab?.focus());
        } else if (e.key === "End") {
          e.preventDefault();
          this.activateSimple();
          this.$nextTick(() => this.$refs.simpleTab?.focus());
        }
      },
      onSimpleTabKeydown(e) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          this.activateAdvanced();
          this.$nextTick(() => this.$refs.advancedTab?.focus());
        } else if (e.key === "Home") {
          e.preventDefault();
          this.activateAdvanced();
          this.$nextTick(() => this.$refs.advancedTab?.focus());
        }
      },
    },
  };
</script>
