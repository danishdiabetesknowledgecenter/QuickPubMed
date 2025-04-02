<template>
  <div>
    <h4 role="heading" aria-level="3" class="h4">
      {{ getString("SimpleFiltersHeader") }}
    </h4>
    <div id="qpm_topofsearchbar" class="qpm_simpleFiltersContainer">
      <template v-for="option in filteredChoices">
        <template v-if="hasVisibleSimpleFilterOption(option.choices)">
          <b :key="`label-${option.id}`" class="qpm_simpleFiltersHeader">
            {{ getCustomNameLabel(option) }}:
          </b>
          <div
            v-for="(choice, index) in option.choices"
            :id="'qpm_topic_' + choice.name"
            :key="`choice-${choice.id}-${index}`"
            class="qpm_simpleFilters"
          >
            <input
              :id="choice.name"
              type="checkbox"
              :title="getString('checkboxTitle')"
              :value="choice.name"
              :checked="isFilterUsed(filterData[option.id], choice.name)"
              style="cursor: pointer"
              @change="onFilterChange(option.id, choice, $event)"
              @keyup.enter="onFilterEnter(choice)"
            />
            <label :for="choice.name">
              {{ getCustomNameLabel(choice) }}
            </label>
            <button
              v-if="getSimpleTooltip(choice)"
              v-tooltip="{
                content: getSimpleTooltip(choice),
                offset: 5,
                delay: helpTextDelay,
                hideOnTargetClick: false,
              }"
              class="bx bx-info-circle"
              style="cursor: help"
            />
          </div>
          <div :key="`spacer-${option.id}`" class="qpm_simpleFiltersSpacer" />
        </template>
      </template>
    </div>
  </div>
</template>

<script>
  export default {
    name: "SimpleSearchFilters",
    props: {
      advanced: {
        type: Boolean,
        required: true,
      },
      filteredChoices: {
        type: Array,
        required: true,
      },
      filterData: {
        type: Object,
        required: true,
      },
      helpTextDelay: {
        type: Number,
        default: 300,
      },
      getString: {
        type: Function,
        default: () => () => "",
      },
      getCustomNameLabel: {
        type: Function,
        required: true,
      },
      getSimpleTooltip: {
        type: Function,
        required: true,
      },
    },
    data() {
      return {
        titleCheckBoxTranslate: this.getString("checkboxTitle") || "",
      };
    },
    methods: {
      /**
       * Handles the change event for a filter checkbox.
       * Emits the 'update-filter' event with filterType and selectedValue.
       * @param {String} filterType - The type/category of the filter (e.g., optionId).
       * @param {Object} selectedValue - The selected filter object.
       * @param {Event} event - The change event.
       */
      onFilterChange(filterType, selectedValue, event) {
        const isChecked = event.target.checked;
        this.$emit("update-filter", filterType, { ...selectedValue, checked: isChecked });
      },
      /**
       * Handles the Enter key event on a filter checkbox.
       * Emits the 'update-filter-enter' event with the selectedValue (choice).
       * @param {String} selectedValue - The selected choice from the filter.
       */
      onFilterEnter(selectedValue) {
        this.$emit("update-filter-enter", selectedValue);
      },
      hasVisibleSimpleFilterOption(filters) {
        if (!filters) return false;

        var hasVisibleFilter = filters.some(function (e) {
          return e.simpleSearch;
        });
        return hasVisibleFilter;
      },
      /**
       * Checks if a filter with the given name is used in the provided options.
       *
       * @param {Array} option - The array of filter options.
       * @param {string} name - The name of the filter to check.
       * @returns {boolean} True if the filter is used, false otherwise.
       */
      isFilterUsed(option, name) {
        return option ? option.some((opt) => opt.name === name) : false;
      },
    },
  };
</script>
