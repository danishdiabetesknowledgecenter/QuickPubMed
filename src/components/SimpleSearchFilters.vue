<template>
  <div class="qpm_simpleFiltersRoot">
    <div class="qpm_limitsHeaderContainer">
      <h4 role="heading" aria-level="3" class="h4">
        {{ getString("SimpleLimitsHeader") }}
      </h4>
      <button
        v-tooltip="{
          content: getString('hoverFiltersHeader'),
          distance: 5,
          delay: helpTextDelay,
          theme: 'infoTooltip',
        }"
        class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
        aria-label="Info"
      />
    </div>
    <div id="qpm_topofsearchbar" class="qpm_simpleFiltersContainer">
      <!-- Spacer between main header and first filter group -->
      <div class="qpm_simpleFiltersSpacer" />
      <template v-for="option in filteredChoices">
        <template v-if="hasVisibleSimpleFilterOption(option.choices)">
          <b :key="`label-${option.id}`" class="qpm_simpleFiltersHeader">
            {{ getCustomNameLabel(option) }}:
          </b>
          <div
            v-for="(choice, index) in option.choices"
            :id="'qpm_topic_' + (choice.id || choice.name)"
            :key="`choice-${choice.id}-${index}`"
            class="qpm_simpleFilters"
          >
            <input
              :id="choice.id || choice.name"
              type="checkbox"
              :title="getString('checkboxTitle')"
              :value="choice.id || choice.name"
              :checked="isFilterUsed(limitData[option.id], choice)"
              class="qpm_cursorPointer"
              @change="onFilterChange(option.id, choice, $event)"
              @keyup.enter="onFilterEnter(choice)"
            />
            <div class="qpm_infoInline">
              <label :for="choice.id || choice.name">
                <template v-if="getChoiceLabelParts(choice).prefix">
                  {{ getChoiceLabelParts(choice).prefix }}
                </template>
                <span class="qpm_keepWithIcon">
                  {{ getChoiceLabelParts(choice).last }}
                  <button
                    v-if="getSimpleTooltip(choice)"
                    type="button"
                    v-tooltip="{
                      content: getSimpleTooltip(choice),
                      distance: 5,
                      delay: helpTextDelay,
                      theme: 'infoTooltip',
                    }"
                    class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
                    aria-label="Info"
                    @click.stop
                  />
                </span>
              </label>
            </div>
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
      limitData: {
        type: Object,
        required: true,
      },
      helpTextDelay: {
        type: Number,
        default: 300,
      },
      getString: {
        type: Function,
        default: () => "",
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
    emits: ["update-limit", "update-limit-enter"],
    data() {
      return {
        titleCheckBoxTranslate: this.getString("checkboxTitle") || "",
      };
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
      getChoiceLabelParts(choice) {
        return this.splitLastWord(this.getCustomNameLabel(choice));
      },
      /**
       * Handles the change event for a filter checkbox.
       * Emits the 'update-limit' event with filterType and selectedValue.
       * @param {String} filterType - The type/category of the filter (e.g., optionId).
       * @param {Object} selectedValue - The selected filter object.
       * @param {Event} event - The change event.
       */
      onFilterChange(filterType, selectedValue, event) {
        const isChecked = event.target.checked;
        this.$emit("update-limit", filterType, { ...selectedValue, checked: isChecked });
      },
      /**
       * Handles the Enter key event on a filter checkbox.
       * Emits the 'update-limit-enter' event with the selectedValue (choice).
       * @param {String} selectedValue - The selected choice from the filter.
       */
      onFilterEnter(selectedValue) {
        this.$emit("update-limit-enter", selectedValue);
      },
      hasVisibleSimpleFilterOption(limits) {
        if (!limits) return false;
        return limits.some((entry) => entry.simpleSearch);
      },
      /**
       * Checks if a filter with the given name is used in the provided options.
       *
       * @param {Array} option - The array of filter options.
       * @param {string} name - The name of the filter to check.
       * @returns {boolean} True if the filter is used, false otherwise.
       */
      isFilterUsed(option, choice) {
        if (!option || !choice) return false;
        const choiceId = choice.id || "";
        if (choiceId) return option.some((opt) => opt.id === choiceId);
        return option.some((opt) => opt.name === choice.name);
      },
    },
  };
</script>
