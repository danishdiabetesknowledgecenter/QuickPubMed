<template>
  <div v-if="!isCollapsed" class="qpm_tabs">
    <!-- Advanced Search Tab -->
    <p
      v-if="!advanced"
      v-tooltip="{
        content: getString('hoverAdvancedText'),
        offset: 5,
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
    </p>

    <p v-if="advanced" class="qpm_tab qpm_tab_active">
      {{ getString("advancedSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </p>

    <!-- Simple Search Tab -->
    <p
      v-if="advanced"
      v-tooltip="{
        content: getString('hoverBasicText'),
        offset: 5,
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
    </p>

    <p v-if="!advanced" class="qpm_tab qpm_tab_active">
      {{ getString("simpleSearch") }}
      <span class="qpm_hideonmobile">
        {{ getString("searchMode") }}
      </span>
    </p>
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
        default: () => () => "",
      },
      $helpTextDelay: {
        type: Object,
        default: () => ({ show: 500, hide: 100 }),
      },
    },
    methods: {
      toggleAdvanced() {
        this.$emit("toggle-advanced");
      },
    },
  };
</script>
