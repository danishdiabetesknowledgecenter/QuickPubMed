<template>
  <div class="qpm_spaceEvenly qpm_headerText">
    <div v-show="!isCollapsed" role="heading" aria-level="2" class="h3" style="margin-top: 5px">
      {{ getString("searchHeaderShown") }}
    </div>
    <div v-show="isCollapsed" role="heading" aria-level="2" class="h3" style="margin-top: 5px">
      {{ getString("searchHeaderHidden") }}
    </div>

    <div 
      v-if="subjects != false" 
      class="qpm_toggleSearchForm" 
      @click="$emit('toggle-collapsed')"
      @keydown.enter="$emit('toggle-collapsed')"
      @keydown.space.prevent="$emit('toggle-collapsed')"
      role="button"
      tabindex="0"
      :aria-label="isCollapsed ? getString('showForm') : getString('hideForm')"
      :aria-expanded="!isCollapsed"
    >
      <div
        v-show="!isCollapsed"
        v-tooltip="{
          content: getString('hideForm'),
          distance: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_toggleSearchFormBtn bx bx-hide"
      />
      <div
        v-show="isCollapsed"
        v-tooltip="{
          content: getString('showForm'),
          distance: 5,
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
    },
  };
</script>
