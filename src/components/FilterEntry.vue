<template>
  <div class="qpm_filterEntry" style="width: 110.7%">
    <p>{{ customNameLabel(filterItem) }}</p>
    <DropDownWrapper
      :isMultiple="true"
      :data="filterItem.choices"
      :hideTopics="hideTopics"
      :isGroup="false"
      :placeholder="placeholderText"
      :operator="calcOrOperator"
      :taggable="filterItem.allowCustomInput"
      :selected="selected"
      :index="idx"
      :closeOnInput="false"
      :language="language"
      qpm_buttonColor1="qpm_buttonColor4"
      qpm_buttonColor2="qpm_buttonColor5"
      qpm_buttonColor3="qpm_buttonColor6"
      v-on="$listeners"
      ref="dropdown"
    />
  </div>
</template>

<script>
import DropDownWrapper from "@/components/DropDownWrapper.vue";

export default {
  name: "FilterEntry",
  components: {
    DropDownWrapper,
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
  },
  data() {
    return {
      dropdownWidth: 0,
    };
  },
  mounted() {
    this.updateDropdownWidth();
    window.addEventListener("resize", this.updateDropdownWidth);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateDropdownWidth);
  },
  methods: {
    getString(string) {
      const lg = this.language;
      const constant = messages[string][lg];
      return constant !== undefined ? constant : messages[string]["dk"];
    },
    customNameLabel(option) {
      if (!option.name && !option.groupname) return;
      let constant;
      if (option.id) {
        const lg = this.language;
        constant =
          option.translations[lg] !== undefined
            ? option.translations[lg]
            : option.translations["dk"];
      } else {
        constant = option.name;
      }
      return constant;
    },
    updateDropdownWidth() {
      const dropdown = this.$refs.dropdown.$refs.selectWrapper;
      if (!dropdown.innerHTML) return;
      this.dropdownWidth = parseInt(dropdown.offsetWidth);
    },
  },
  computed: {
    placeholderText() {
      if (this.filterItem.allowCustomInput) {
        const isMobileWidth =
          this.dropdownWidth < 520 && this.dropdownWidth !== 0;
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
          this.getString("select") +
          " " +
          this.customNameLabel(this.filterItem).toLowerCase()
        );
      }
    },
    calcOrOperator() {
      return this.getString("orOperator");
    },
  },
};
</script>

<style scoped>
/* Component-specific styles (optional) */
</style>
