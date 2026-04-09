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
      <template v-if="showSemanticSearchSection">
        <div class="qpm_simpleFiltersHeader">
          <span class="qpm_keepWithIcon">
            {{ getString("semanticSearchSectionHeader") }}:
            <button
              v-if="getString('hoverSemanticSearchSectionHeader')"
              type="button"
              v-tooltip="{
                content: getString('hoverSemanticSearchSectionHeader'),
                distance: 5,
                delay: helpTextDelay,
                theme: 'infoTooltip',
              }"
              class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
              aria-label="Info"
              @click.stop
            />
          </span>
        </div>
        <div
          v-for="option in semanticOptions"
          :id="'qpm_topic_' + option.id"
          :key="`semantic-${option.id}`"
          class="qpm_simpleFilters"
        >
          <input
            :id="option.id"
            type="checkbox"
            :disabled="getSemanticOptionDisabled(option)"
            :title="getString('checkboxTitle')"
            :value="option.id"
            :checked="isSemanticOptionChecked(option)"
            class="qpm_cursorPointer"
            @change="onSemanticOptionChange(option, $event)"
            @keyup.enter="onSemanticOptionEnter(option)"
          />
          <div class="qpm_infoInline">
            <label :for="option.id">
              <template v-if="getSemanticOptionLabelParts(option).prefix">
                {{ getSemanticOptionLabelParts(option).prefix }}
              </template>
              <span class="qpm_keepWithIcon">
                {{ getSemanticOptionLabelParts(option).last }}
                <button
                  v-if="getSemanticOptionTooltip(option)"
                  type="button"
                  v-tooltip="{
                    content: getSemanticOptionTooltip(option),
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
        <div class="qpm_simpleFiltersSpacer" />
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
      getSemanticOptionTooltipContent: {
        type: Function,
        default: null,
      },
      getSemanticOptionDisabledState: {
        type: Function,
        default: null,
      },
      showSemanticSearchSection: {
        type: Boolean,
        default: false,
      },
      searchWithPubMedBestMatch: {
        type: Boolean,
        default: false,
      },
      searchWithSemanticScholar: {
        type: Boolean,
        default: false,
      },
      searchWithOpenAlex: {
        type: Boolean,
        default: false,
      },
      searchWithElicit: {
        type: Boolean,
        default: false,
      },
      searchWithScite: {
        type: Boolean,
        default: false,
      },
      searchWithCore: {
        type: Boolean,
        default: false,
      },
    },
    emits: ["update-limit", "update-limit-enter", "update-semantic-source"],
    data() {
      return {
        titleCheckBoxTranslate: this.getString("checkboxTitle") || "",
      };
    },
    computed: {
      semanticOptions() {
        return [
          {
            id: "pubmedBestMatch",
            labelKey: "searchToggleWithPubMedBestMatch",
            hoverKey: "hoversearchToggleWithPubMedBestMatch",
          },
          {
            id: "semanticScholar",
            labelKey: "searchToggleWithSemanticScholar",
            hoverKey: "hoversearchToggleWithSemanticScholar",
          },
          {
            id: "openAlex",
            labelKey: "searchToggleWithOpenAlex",
            hoverKey: "hoversearchToggleWithOpenAlex",
          },
          {
            id: "elicit",
            labelKey: "searchToggleWithElicit",
            hoverKey: "hoversearchToggleWithElicit",
          },
          {
            id: "scite",
            labelKey: "searchToggleWithScite",
            hoverKey: "hoversearchToggleWithScite",
          },
          {
            id: "core",
            labelKey: "searchToggleWithCore",
            hoverKey: "hoversearchToggleWithCore",
          },
        ];
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
      getSemanticOptionLabel(option) {
        return this.getString(option?.labelKey || "");
      },
      getSemanticOptionLabelParts(option) {
        return this.splitLastWord(this.getSemanticOptionLabel(option));
      },
      getSemanticOptionTooltip(option) {
        if (typeof this.getSemanticOptionTooltipContent === "function") {
          return this.getSemanticOptionTooltipContent(option);
        }
        return this.getString(option?.hoverKey || "");
      },
      isSemanticOptionChecked(option) {
        if (!option?.id) return false;
        const key = option.id;
        const propName =
          key === "pubmedBestMatch"
            ? "searchWithPubMedBestMatch"
            : `searchWith${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        return Boolean(this[propName]);
      },
      getSemanticOptionDisabled(option) {
        if (typeof this.getSemanticOptionDisabledState === "function") {
          return this.getSemanticOptionDisabledState(option);
        }
        return false;
      },
      onSemanticOptionChange(option, event) {
        if (this.getSemanticOptionDisabled(option)) {
          return;
        }
        const isChecked = event.target.checked;
        this.updateSemanticSource(option.id, isChecked);
      },
      onSemanticOptionEnter(option) {
        if (this.getSemanticOptionDisabled(option)) {
          return;
        }
        const nextValue = !this.isSemanticOptionChecked(option);
        this.updateSemanticSource(option.id, nextValue);
      },
      updateSemanticSource(sourceKey, value) {
        this.$emit("update-semantic-source", sourceKey, value);
      },
    },
  };
</script>
