<template>
  <div v-if="!isCollapsed" class="qpm_tabs">
    <!-- Advanced Search Tab -->
    <button
      v-if="!advanced"
      v-tooltip="{
        content: getString('hoverAdvancedText'),
        distance: 5,
        delay: $helpTextDelay,
      }"
      tabindex="0"
      class="qpm_tab"
      @click="toggleAdvanced()"
      @keyup.enter="toggleAdvanced()"
    >
      {{ getString("advancedSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </button>

    <button v-if="advanced" class="qpm_tab qpm_tab_active">
      {{ getString("advancedSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </button>

    <!-- Simple Search Tab -->
    <button
      v-if="advanced"
      v-tooltip="{
        content: getString('hoverBasicText'),
        distance: 5,
        delay: $helpTextDelay,
      }"
      tabindex="0"
      class="qpm_tab"
      @click="toggleAdvanced()"
      @keyup.enter="toggleAdvanced()"
    >
      {{ getString("simpleSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </button>

    <button v-if="!advanced" class="qpm_tab qpm_tab_active">
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
        required: true,
        default: () => "",
      },
    },
    methods: {
      toggleAdvanced() {
        this.$emit("toggle-advanced");
      },
    },
  };
</script>
