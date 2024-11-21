<template>
  <div class="qpm_spaceEvenly qpm_headerText">
    <div
      v-show="!isCollapsed"
      role="heading"
      aria-level="2"
      class="h3"
      style="margin-top: 5px"
    >
      {{ getString("searchHeaderShown") }}
    </div>
    <div
      v-show="isCollapsed"
      role="heading"
      aria-level="2"
      class="h3"
      style="margin-top: 5px"
    >
      {{ getString("searchHeaderHidden") }}
    </div>

    <div
      v-show="subjects.length"
      class="qpm_toggleSearchForm"
      @click="$emit('toggle-collapsed')"
    >
      <div
        v-show="!isCollapsed"
        v-tooltip="{
          content: getString('hideForm'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_toggleSearchFormBtn bx bx-hide"
      />
      <div
        v-show="isCollapsed"
        v-tooltip="{
          content: getString('showForm'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_toggleSearchFormBtn bx bx-show"
      />
    </div>
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
      subjects: {
        type: Array,
        default: () => [],
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
  };
</script>
