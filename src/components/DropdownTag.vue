<template>
  <div
    class="multiselect__tags-wrap"
    @mousedown.stop
    @focusin.capture.stop
    @focusout.capture.stop
    @focus.capture.stop
  >
    <span
      v-tooltip="{ content: getTooltip, offset: 5, delay: helpTextDelay }"
      class="multiselect__tag"
      :class="getTagColor(triple.option.scope)"
      @click.stop="startEdit"
    >
      <span v-if="triple.option.isCustom">
        <p>
          <span class="qpm_prestring">{{ triple.option.preString }}</span>
          <template v-if="!isEditMode">{{ getCustomNameLabel }}</template>
        </p>
        <input
          v-show="isEditMode"
          ref="editInput"
          v-model="getCustomNameLabel"
          type="text"
          minlength="1"
          @keydown.left.stop
          @keydown.right.stop
          @focus.stop
          @blur.stop="endEdit"
          @keyup.enter.stop="endEdit"
        />
      </span>
      <span v-else> {{ triple.option.preString }}{{ getCustomNameLabel }} </span>
      <i
        aria-hidden="true"
        tabindex="-1"
        class="multiselect__tag-icon"
        @click.stop="triple.remove(triple.option)"
      />
    </span>
    <span class="qpm_operator">{{ operator }}</span>
  </div>
</template>

<script>
  import { messages } from "@/assets/content/qpm-translations";
  import { customInputTagTooltip } from "@/utils/qpm-content-helpers.js";

  export default {
    name: "DropdownTag",
    props: {
      triple: {
        type: Object,
        required: true,
      },
      customNameLabel: {
        type: Function,
        required: true,
      },
      updateTag: {
        type: Function,
        required: true,
      },
      operator: {
        type: String,
        required: true,
      },
      qpmButtonColor1: {
        type: String,
        default: "qpm_buttonColor1",
      },
      qpmButtonColor2: {
        type: String,
        default: "qpm_buttonColor2",
      },
      qpmButtonColor3: {
        type: String,
        default: "qpm_buttonColor3",
      },
      language: {
        type: String,
        default: "dk",
      },
    },
    data() {
      return {
        isEditMode: false,
        tag: JSON.parse(JSON.stringify(this.triple.option)),
        helpTextDelay: 300,
      };
    },
    computed: {
      getCustomNameLabel: {
        get() {
          const label = this.customNameLabel(this.tag);
          return label ? label : " ";
        },
        set(newName) {
          this.tag.name = newName;
          this.tag.searchStrings.normal = [newName];
        },
      },
      getTooltip() {
        let tooltip = null;
        if (this.tag.tooltip) {
          tooltip = this.tag.tooltip[this.language];
        }
        return tooltip;
      },
    },
    watch: {
      triple(newTriple) {
        this.tag = newTriple.option;
      },
    },
    methods: {
      getString(string) {
        const lg = this.language;
        const constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["dk"];
      },
      startEdit() {
        if (!this.triple.option.isCustom || this.isEditMode) return;
        this.isEditMode = true;
        this.tag.preString = this.getString("manualInputTerm") + ":\u00A0 ";
        this.tag.isTranslated = false;
        this.tag.tooltip = customInputTagTooltip;

        const editInput = this.$refs.editInput;
        this.$nextTick(() => {
          editInput.focus();
        });
      },
      endEdit(triggerEvent) {
        if (!this.triple.option.isCustom || !this.isEditMode) return;
        if (
          triggerEvent &&
          triggerEvent.type === "blur" &&
          triggerEvent.relatedTarget &&
          triggerEvent.relatedTarget.classList.contains("multiselect__tag-icon")
        ) {
          return;
        }

        this.isEditMode = false;

        const editInput = this.$refs.editInput;
        editInput.blur();

        if (!this.tag.name.trim()) return;
        this.updateTag(this.tag);
      },
      getTagColor(scope) {
        if (scope === "narrow") {
          return this.qpmButtonColor1;
        }
        if (!scope || scope === "normal") {
          return this.qpmButtonColor2;
        }
        if (scope === "broad") {
          return this.qpmButtonColor3;
        }
        return "";
      },
    },
  };
</script>
