<template>
  <div
    class="multiselect__tags-wrap"
    @mousedown="handleMouseDown"
  >
    <span
      v-tooltip="{ content: getTooltip, distance: 5, delay: helpTextDelay }"
      class="multiselect__tag"
      :class="getTagColor(triple.option.scope)"
      :style="isEditMode ? (isMultiLine ? 'width: 100%; display: flex; flex-direction: column;' : 'width: 100%;') : ''"
      @click="handleTagClick"
      @keydown.enter.prevent="handleKeydown"
      tabindex="0"
    >
      <span v-if="triple.option.isCustom" :style="isEditMode ? 'width: 100%;' : ''">
        <p v-if="!isEditMode">
          <span class="qpm_prestring">{{ triple.option.preString }}</span>
          {{ getCustomNameLabel }}
        </p>
        <div v-if="isEditMode" :style="getEditContainerStyle" @click.stop @mousedown.stop>
          <div v-if="isMultiLine" style="margin-bottom: 4px;">
            <span class="qpm_prestring">{{ triple.option.preString }}</span>
          </div>
          <span v-if="!isMultiLine" class="qpm_prestring">{{ triple.option.preString }}</span>
          <textarea
            ref="editInput"
            v-model="getCustomNameLabel"
            minlength="1"
            rows="1"
            :style="getTextareaStyle"
            @keydown.left.stop
            @keydown.right.stop
            @keydown.space.stop
            @keyup.space.stop
            @keydown="handleTextareaKeydown"
            @focus.stop
            @blur.stop="endEdit"
            @keydown.enter.stop="endEdit"
            @input="handleInput"
            @keyup="autoResize"
            @paste="handlePaste"
            @click.stop
            @mousedown.stop
          />
        </div>
      </span>
      <span v-else> {{ triple.option.preString }}{{ getCustomNameLabel }} </span>
      <i
        tabindex="0"
        class="multiselect__tag-icon"
        @click.stop="triple.remove(triple.option)"
        @keydown.enter.prevent="handleCrossKeydown"
      />
    </span>
    <span class="qpm_operator">{{ operator }}</span>
  </div>
</template>

<script>
  import { utilitiesMixin } from "@/mixins/utilities";
  import { customInputTagTooltip } from "@/utils/qpm-content-helpers.js";

  export default {
    name: "DropdownTag",
    mixins: [utilitiesMixin],
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
         isMultiLine: false,
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
       getTextareaStyle() {
         const baseStyle = "resize: none; overflow: hidden; min-height: 1.2em; line-height: 1.2em; padding: 2px 4px; border: 1px solid #ccc; font-family: inherit; font-size: inherit; box-sizing: border-box; margin: 0;";
         
         if (this.isMultiLine) {
           // Multiple lines: full width and block display
           return baseStyle + " width: 100%; display: block;";
         } else {
           // Single line: fill remaining space inline
           return baseStyle + " flex: 1; display: inline-block;";
         }
       },
       getEditContainerStyle() {
         if (this.isMultiLine) {
           // Multiple lines: full width
           return "width: 100%;";
         } else {
           // Single line: flex layout so textarea fills remaining space
           return "display: flex; align-items: center; width: 100%;";
         }
       },
    },
    watch: {
      triple(newTriple, oldTriple) {
        // Only reset edit mode if it's actually a new tag (not just an update of the same tag)
        if (!oldTriple || newTriple.option.id !== oldTriple.option.id) {
          this.tag = newTriple.option;
          this.isEditMode = false;
          this.isMultiLine = false;
        } else {
          // Same tag, only update tag data without resetting edit mode
          this.tag = newTriple.option;
        }
      },
    },
    methods: {
      startEdit() {
        if (!this.triple.option.isCustom || this.isEditMode) return;
        this.isEditMode = true;
        this.tag.preString = this.getString("manualInputTerm") + ":\u00A0 ";
        this.tag.isTranslated = false;
        this.tag.tooltip = customInputTagTooltip;

        this.$nextTick(() => {
          const editInput = this.$refs.editInput;
          if (editInput) {
            editInput.focus();
            // Multiple attempts to get autoResize working
            setTimeout(() => {
              this.autoResize();
            }, 10);
            setTimeout(() => {
              this.autoResize();
            }, 50);
          }
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
        this.isMultiLine = false;

        const editInput = this.$refs.editInput;
        if (editInput) {
          editInput.blur();
        }

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
      handleTagClick(event) {
        // If it's a custom tag and we're not already in edit mode, start edit mode
        if (this.triple.option.isCustom && !this.isEditMode) {
          this.startEdit();
          return;
        }
        
        // If we're already in edit mode, ignore click
        if (this.isEditMode) {
          event.stopPropagation();
          return;
        }
        
        // For normale tags: find parent DropdownWrapper
        let parent = this.$parent;
        while (parent && parent.$options.name !== 'DropdownWrapper') {
          parent = parent.$parent;
        }
        
        if (parent) {
          // First open the dropdown
          if (parent.handleOpenMenuOnClick) {
            parent.handleOpenMenuOnClick(event);
          }
          
          // Then call handleTagClick to expand the right category
          if (parent.handleTagClick) {
            parent.handleTagClick(event);
          }
        }
      },
      handleKeydown(event) {
        // If custom tag, start edit
        if (this.triple.option.isCustom && !this.isEditMode) {
          // Add a small delay to avoid conflict with keyup.enter on input
          this.$nextTick(() => {
            this.startEdit();
          });
          return; // Stop here - don't call handleTagClick
        }

        // For normal tags: call handleTagClick to open dropdown
        if (!this.triple.option.isCustom) {
          this.handleTagClick(event);
        }
      },
      /*  Allow mousedown to bubble for normal tags (so DropdownWrapper can open
          the dropdown), but block for custom-tags when they are in edit-mode. */
      handleMouseDown(event) {
        // If we're in edit mode, stop event propagation
        if (this.isEditMode) {
          event.stopPropagation();
          return;
        }
        // Let mousedown bubble up to parent for normal tags
      },
      handleCrossKeydown(event) {
        // Simulate click on the cross when Enter is pressed
        event.target.click();
      },
             autoResize() {
         const textarea = this.$refs.editInput;
         if (!textarea) return;
         
         // Ensure textarea has full width first
         textarea.style.width = '100%';
         textarea.style.display = 'block';
         textarea.style.boxSizing = 'border-box';
         
         // Reset height to 1 line first
         textarea.style.height = '1.2em';
         
         // Force a repaint to ensure correct measurements
         textarea.offsetHeight;
         
         // Now calculate the correct height based on content
         const scrollHeight = textarea.scrollHeight;
         const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 16;
         const isMultipleLines = scrollHeight > lineHeight * 1.5;
         
         // Update isMultiLine state
         this.isMultiLine = isMultipleLines;
         
         // Set height to scrollHeight to adapt to content
         textarea.style.height = scrollHeight + 'px';
       },
       handleInput() {
         // Call autoResize with a small delay
         this.$nextTick(() => {
           this.autoResize();
         });
       },
       handlePaste() {
         // Call autoResize after paste with slightly longer delay
         setTimeout(() => {
           this.autoResize();
         }, 10);
       },
       handleTextareaKeydown(event) {
         // Stop all keydown events from bubbling up, except Enter which should end edit
         if (event.key !== 'Enter') {
           event.stopPropagation();
         }
         
       },
    },
  };
</script>
