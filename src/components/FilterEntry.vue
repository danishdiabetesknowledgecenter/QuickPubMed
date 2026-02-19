<template>
  <div class="qpm_flex">
    <div class="qpm_filterEntry" style="width: 100%">
      <p v-if="!isFirst" class="qpm_filterOperator">
        {{ getString("andOperator") }}
      </p>
      <p style="font-size: 0.9em">{{ customNameLabelWithCount }}</p>
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
        <i
          class="qpm_removeFilter bx bx-x"
          role="button"
          tabindex="0"
          aria-label="Remove filter"
          @click="removeFilterItem(filterItem.id)"
          @keydown.enter.prevent="removeFilterItem(filterItem.id)"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import DropdownWrapper from "@/components/DropdownWrapper.vue";
  import { utilitiesMixin } from "@/mixins/utilities";

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
        default: function () {
          return [];
        },
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
      window.addEventListener("resize", this.updateDropdownWidth);
    },
    beforeUnmount() {
      window.removeEventListener("resize", this.updateDropdownWidth);
    },
    methods: {
      removeFilterItem(filterItemId) {
        this.$emit("remove-filter-item", filterItemId);
      },
      customNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return;
        let constant;
        if (option.id) {
          const lg = this.language;
          constant =
            option.translations[lg] !== undefined
              ? option.translations[lg]
              : option.translations["dk"];
        } else {
          constant = option.name || option.id;
        }
        return constant;
      },
      updateDropdownWidth() {
        const dropdown = this.$refs.dropdown.$refs.selectWrapper;
        if (!dropdown.innerHTML) return;
        this.dropdownWidth = parseInt(dropdown.offsetWidth);
      },
      /**
       * Emits the input event with updated filters.
       * @param {Array} updatedFilters
       */
      handleInput(updatedFilters) {
        this.$emit("input", updatedFilters);
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
