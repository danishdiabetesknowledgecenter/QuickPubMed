<template>
  <div>
    <div v-for="(item, n) in filters" :key="`item-${item.id}-${n}`" class="qpm_filters_new">
      <div class="qpm_flex">
        <dropdown-wrapper
          ref="filterDropdown"
          :is-multiple="true"
          :data="filterOptions"
          :hide-topics="hideFilters"
          :is-group="true"
          :placeholder="showTitle"
          :operator="getString('orOperator')"
          :taggable="true"
          :selected="item"
          :close-on-input="false"
          :language="language"
          :show-scope-label="advanced"
          :no-result-string="getString('noTopicDropdownContent')"
          :index="n"
          @input="handleUpdateFilters"
          @updateScope="handleUpdateScope"
        />

        <i v-if="filters.length > 1" class="qpm_removeFilter bx bx-x" @click="removeFilter(n)" />
      </div>
      <p
        v-if="n >= 0 && hasFilters"
        class="qpm_subjectOperator"
        :style="{ color: n < filters.length - 1 ? '#000000' : 'darkgrey' }"
      >
        {{ getString("andOperator") }}
      </p>
    </div>
    <div
      v-if="hasFilters"
      style="margin: 5px 0 20px 0"
      @keydown.enter.capture.passive="focusNextDropdownOnMount = true"
    >
      <button
        v-tooltip="{
          content: getString('hoverAddFilter'),
          offset: 5,
          delay: $helpTextDelay,
        }"
        class="qpm_slim qpm_button multiselect__input"
        @click="addFilter"
      >
        {{ getString("addsubjectlimit") }} {{ getString("addsubject") }}
      </button>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";

  export default {
    name: "FilterSelection",
    components: {
      DropdownWrapper,
    },
    props: {
      filters: { type: Array, required: true, default: () => [] },
      hideFilters: { type: Array, required: false, default: () => [] },
      filterOptions: { type: Array, required: true, default: () => [] },
      language: { type: String, default: "dk" },
      showTitle: { type: String, required: true, default: "" },
      getString: {
        type: Function,
        required: true,
        default: () => "",
      },
      advanced: Boolean,
      hasFilters: Boolean,
    },
    methods: {
      handleUpdateFilters(value, index) {
        this.$emit("update-filters", value, index);
      },
      handleUpdateScope(item, state, index) {
        this.$emit("update-filter-scope", item, state, index);
      },
      addFilter() {
        this.$emit("add-filter");
      },
      removeFilter(index) {
        this.$emit("remove-filter", index);
      },
      toggle() {
        this.$emit("toggle-filter");
      },
    },
  };
</script>
