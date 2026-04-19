<template>
  <div class="qpm_spaceEvenly qpm_headerText">
    <h2 v-show="!isCollapsed" class="h3 qpm_searchFormToggleHeading">
      {{ getString("searchHeaderShown") }}
    </h2>
    <h2 v-show="isCollapsed" class="h3 qpm_searchFormToggleHeading">
      {{ getString("searchHeaderHidden") }}
    </h2>

    <button
      v-if="showToggleIcon && topics !== false"
      type="button"
      class="qpm_toggleSearchForm qpm_iconButton"
      :aria-label="isCollapsed ? getString('showForm') : getString('hideForm')"
      :aria-expanded="!isCollapsed"
      :aria-controls="panelId || null"
      @click="$emit('toggle-collapsed')"
    >
      <span
        v-show="!isCollapsed"
        v-tooltip="{
          content: getString('hideForm'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_toggleSearchFormBtn bx bx-hide"
      />
      <span
        v-show="isCollapsed"
        v-tooltip="{
          content: getString('showForm'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_toggleSearchFormBtn bx bx-show"
      />
    </button>
  </div>
</template>

<script>
  export default {
    name: "SearchFormToggle",
    props: {
      isCollapsed: {
        type: Boolean,
        default: false,
      },
      topics: {
        type: Array,
        default: () => [],
      },
      showToggleIcon: {
        type: Boolean,
        default: true,
      },
      getString: {
        type: Function,
        default: () => "",
      },
      panelId: {
        type: String,
        default: "",
      },
    },
    emits: ["toggle-collapsed"],
  };
</script>
