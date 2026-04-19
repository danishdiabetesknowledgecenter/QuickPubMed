<template>
  <div class="qpm_flex">
    <div class="qpm_filterEntry qpm_filterEntryFullWidth">
      <p v-if="!isFirst" class="qpm_filterOperator">
        {{ getString("andOperator") }}
      </p>
      <p class="qpm_filterEntryLabel">{{ customNameLabelWithCount }}</p>
      <div class="qpm_flex">
        <dropdown-wrapper
          ref="dropdown"
          :is-multiple="true"
          :data="filterItem.choices"
          :hide-topics="hideTopics"
          :is-group="false"
          :placeholder="placeholderText"
          :operator="calcOrOperator"
          :taggable="filterItem.allowCustomInput"
          :no-result-string="getString('noLimitDropdownContent')"
          :selected="selected"
          :index="idx"
          :close-on-input="false"
          :language="language"
          qpm-button-color1="qpm_buttonColor4"
          qpm-button-color2="qpm_buttonColor5"
          qpm-button-color3="qpm_buttonColor6"
          v-bind="$attrs"
        />
        <button
          type="button"
          class="qpm_iconButton qpm_removeFilter bx bx-x"
          :aria-label="getString('removeFilterLabel')"
          @click="removeFilterItem(filterItem.id)"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { debounce, getLocalizedTranslation } from "@/utils/componentHelpers";

  export default {
    name: "FilterEntry",
    mixins: [utilitiesMixin],
    components: {
      DropdownWrapper,
    },
    props: {
      filterItem: {
        type: Object,
        required: true,
      },
      idx: {
        type: String,
        required: true,
      },
      selected: {
        type: Array,
        required: true,
      },
      language: {
        type: String,
        default: "dk",
      },
      hideTopics: {
        type: Array,
        default: () => [],
      },
      isFirst: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        dropdownWidth: 0,
      };
    },
    computed: {
      placeholderText() {
        if (this.filterItem.allowCustomInput) {
          const isMobileWidth = this.dropdownWidth < 520 && this.dropdownWidth !== 0;
          let manualInputText = "manualInput";

          if (isMobileWidth) {
            manualInputText += "_mobile";
          }

          return (
            this.getString("select") +
            " " +
            this.customNameLabel(this.filterItem).toLowerCase() +
            (isMobileWidth ? "" : " ") +
            this.getString(manualInputText)
          );
        } else {
          return (
            this.getString("select") + " " + this.customNameLabel(this.filterItem).toLowerCase()
          );
        }
      },
      calcOrOperator() {
        return this.getString("orOperator");
      },
      customNameLabelWithCount() {
        //return `${this.customNameLabel(this.filterItem)} (${this.selected.length}/${
        //  this.filterItem.choices.length
        //})`;
        return this.customNameLabel(this.filterItem);
      },
    },
    mounted() {
      this.updateDropdownWidth();
      this._updateDropdownWidthDebounced = debounce(this.updateDropdownWidth.bind(this), 120);
      window.addEventListener("resize", this._updateDropdownWidthDebounced);
    },
    beforeUnmount() {
      if (this._updateDropdownWidthDebounced) {
        window.removeEventListener("resize", this._updateDropdownWidthDebounced);
      }
    },
    methods: {
      removeFilterItem(filterItemId) {
        this.$emit("remove-filter-item", filterItemId);
      },
      customNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return;
        if (option.id) {
          return getLocalizedTranslation(option, this.language);
        }
        return option.name || option.id;
      },
      updateDropdownWidth() {
        const dropdown = this.$refs?.dropdown?.$refs?.selectWrapper;
        if (!dropdown || !dropdown.innerHTML) return;
        this.dropdownWidth = dropdown.offsetWidth;
      },
      /**
       * Emits the input event with updated limits.
       * @param {Array} updatedLimits
       */
      handleInput(updatedLimits) {
        this.$emit("input", updatedLimits);
      },
      /**
       * Emits the updateScope event with item, state, and id.
       * @param {Object} item
       * @param {String} state
       */
      handleUpdateScope(item, state) {
        this.$emit("updateScope", item, state, this.idx);
      },
    },
  };
</script>

