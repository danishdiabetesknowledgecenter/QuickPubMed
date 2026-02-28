<template>
  <div
    ref="selectWrapper"
    class="qpm_dropdown"
    :class="{ 'qpm_hide-tags-wrap': hideTagsWrap }"
    @keydown.up.capture.prevent.stop="navUp"
    @keydown.down.capture.prevent.stop="navDown"
    @keydown.left.stop="navLeft"
    @keydown.right.stop="navRight"
    @keyup.up.capture.prevent.stop
    @keyup.down.capture.prevent.stop
    @keyup.left.capture.prevent.stop
    @keyup.right.capture.prevent.stop
    @mouseenter.capture="handleOnButtonMouseover(-1, $event)"
    @mousemove.capture.passive="ignoreHover = false"
  >
    <!-- Mobile tap interceptor: prevents multiselect from opening, shows action sheet instead -->
    <div
      v-if="isTouchDevice && !shouldHideDropdownArrow && !mobileOverlayHidden"
      class="qpm_mobileTapOverlay"
      @touchstart.stop="onOverlayTouchStart"
      @touchmove.passive="onOverlayTouchMove"
      @touchend.stop="onOverlayTouchEnd"
      @mousedown.prevent.stop="handleMobileTap"
    />

    <multiselect
      ref="multiselect"
      v-model="getStateCopy"
      class="qpm_dropDownMenu"
      :class="{ 'qpm_hideDropdownArrow': shouldHideDropdownArrow }"
      :aria-expanded="isDropdownOpen"
      :aria-label="placeholder"
      open-direction="bottom"
      track-by="id"
      label="id"
      select-label=""
      deselect-label=""
      selected-label=""
      :options="shouldHideDropdownArrow ? [] : getSortedSubjectOptions"
      :multiple="isMultiple"
      :group-select="true"
      :group-values="isGroup ? 'groups' : undefined"
      :group-label="isGroup ? 'id' : undefined"
      :placeholder="placeholder"
      :block-keys="[]"
      :close-on-select="false"
      :clear-on-select="true"
      :custom-label="customNameLabel"
      :select-group-label="getSelectGroupLabel"
      :deselect-group-label="getSelectGroupLabel"
      :tag-placeholder="getTagPlaceHolder"
      :taggable="taggable"
      :loading="false"
      :searchable="true"
      @tag="handleAddTag"
      @update:modelValue="input"
      @close="close"
      @open="open"
    >
      <template #tag="triple">
        <dropdown-tag
          :triple="triple"
          :custom-name-label="customNameLabel"
          :update-tag="
            function (newTag) {
              return handleUpdateCustomTag(triple.option, newTag);
            }
          "
          :operator="operator"
          :qpm-button-color-1="qpmButtonColor1"
          :qpm-button-color-2="qpmButtonColor2"
          :qpm-button-color-3="qpmButtonColor3"
          :language="language"
          @edit="handleEditTag"
          @tag-click="handleTagClick"
        />
      </template>

      <template #option="props">
        <span
          v-if="!props.option.$groupLabel"
          :data-name="getHeader(props.option.id)"
          :option-id="props.option.id"
          :option-depth="props.option.subtopiclevel || 0"
          :maintopic="props.option.maintopic"
          :parent-id="props.option.maintopicIdLevel1"
          :grand-parent-id="props.option.maintopicIdLevel2"
          :parent-chain="props.option.parentChain ? props.option.parentChain.join(',') : ''"
          :subtopiclevel="props.option.subtopiclevel"
        />

        <span
          v-if="props.option.maintopic"
          class="qpm_maintopicDropdown"
          :style="{ marginLeft: ((props.option.subtopiclevel || 0) * 25) + 'px' }"
        >
          <i v-if="maintopicToggledMap[props.option.id]" class="bx bx-chevron-down" />
          <i v-else class="bx bx-chevron-right" />
        </span>

        <span
          v-if="!props.option.maintopic"
          :class="{
            qpm_hidden: !isContainedInList(props),
            qpm_shown: props.option.$groupLabel,
            [props.option.class]: props.option.class !== undefined,
          }"
          :style="{ marginLeft: ((props.option.subtopiclevel || 0) * 25) + 'px' }"
        >
          &#10003;
        </span>

        <span
          v-if="props.option.$groupLabel"
          class="qpm_groupLabel"
          :group-name="customGroupLabelById(props.option.$groupLabel)"
          >{{ customGroupLabelById(props.option.$groupLabel) }}</span
        >

        <i
          v-if="
            props.option.$groupLabel &&
            customGroupTooltipById(props.option.$groupLabel).content &&
            customGroupTooltipById(props.option.$groupLabel).content.trim() !== ''
          "
          v-tooltip.right="customGroupTooltipById(props.option.$groupLabel)"
          class="bx bx-info-circle qpm_groupLabel qpm_groupInfoIcon"
          aria-label="Info"
        />

        <span
          v-if="props.option.$groupLabel && showScopeLabel"
          class="qpm_scopeLabel qpm_forceRight"
          :class="{ qpm_shown: showScope(props.option.$groupLabel) }"
          >{{ getString("scope") }}</span
        >

        <span class="qpm_entryName">{{ customNameLabel(props.option) }} </span>

        <i
          v-if="props.option.tooltip && props.option.tooltip[language]"
          v-tooltip.right="{
            content: props.option.tooltip && props.option.tooltip[language],
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="bx bx-info-circle qpm_entryName qpm_entryInfoIcon"
          aria-label="Info"
        />

        <span v-if="props.option.isTag" class="qpm_entryManual"
          >{{ getString("manualadd") }}: {{ props.option.label }}
        </span>

        <div
          v-if="
            !props.option.$groupLabel &&
            props.option.buttons &&
            !props.option.isTag &&
            !props.option.maintopic &&
            shouldShowScopeButtons(props.option)
          "
          class="qpm_dropdownButtons qpm_forceRight"
        >
          <button
            v-if="hasScopeContent(props.option, 'narrow')"
            v-tooltip="{
              content: getString('tooltipNarrow'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            class="qpm_button qpm_scopeButton"
            :class="getButtonColor(props, 'narrow', 0)"
            tabindex="-1"
            @click="handleScopeButtonClick(props.option, 'narrow', $event)"
          >
            {{ getString("narrow") }}
          </button>

          <button
            v-if="hasScopeContent(props.option, 'normal')"
            v-tooltip="{
              content: getString('tooltipNormal'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            class="qpm_button qpm_scopeButton"
            :class="getButtonColor(props, 'normal', 1)"
            tabindex="-1"
            @click="handleScopeButtonClick(props.option, 'normal', $event)"
          >
            {{ getString("normal") }}
          </button>

          <button
            v-if="hasScopeContent(props.option, 'broad')"
            v-tooltip="{
              content: getString('tooltipBroad'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            class="qpm_button qpm_scopeButton"
            :class="getButtonColor(props, 'broad', 2)"
            tabindex="-1"
            @click="handleScopeButtonClick(props.option, 'broad', $event)"
          >
            {{ getString("broad") }}
          </button>
        </div>
      </template>

      <template #noResult>
        <span>{{ shouldHideDropdownArrow ? '' : getNoResultString }}</span>
      </template>
    </multiselect>
    
    <!-- Custom LoadingSpinner to replace vue-multiselect's spinner -->
    <loading-spinner 
      v-if="isLoading" 
      :loading="isLoading" 
      class="qpm_multiselect_custom_spinner qpm_inlineBlock"
      :size="30"
    />

    <!-- Mobile action sheet overlay -->
    <teleport to="body">
      <transition name="qpm_actionSheet">
        <div
          v-if="showMobileActionSheet"
          class="qpm_actionSheetBackdrop"
          @click.self="closeMobileActionSheet"
        >
          <div class="qpm_actionSheetPanel">
            <select
              v-if="getSortedSubjectOptions.length > 0"
              ref="nativeSelect"
              class="qpm_actionSheetBtn qpm_actionSheetSelect"
              @change="handleNativeSelect($event)"
            >
              <option value="" disabled selected>{{ isFilterDropdown ? getString("mobileActionPickLimit") : getString("mobileActionPickTopic") }}</option>
              <template v-for="group in getSortedSubjectOptions" :key="group.id">
                <optgroup :label="customGroupLabelById(group.id)">
                  <option
                    v-for="item in flattenGroupForNative(group)"
                    :key="item.id"
                    :value="item.id"
                    :disabled="item.isBranch"
                  >{{ item.displayLabel }}</option>
                </optgroup>
              </template>
            </select>
            <button
              v-if="taggable"
              class="qpm_actionSheetBtn"
              @click="handleActionFreeText"
            >{{ getString("mobileActionFreeText") }}</button>
            <button
              class="qpm_actionSheetBtn qpm_actionSheetCancel"
              @click="closeMobileActionSheet"
            >{{ getString("mobileActionCancel") }}</button>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script>
  import Multiselect from "vue-multiselect";
  import DropdownTag from "@/components/DropdownTag.vue";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { topicLoaderMixin } from "@/mixins/topicLoaderMixin.js";
  import { messages } from "@/assets/content/translations.js";
  import { searchTranslationPrompt } from "@/assets/prompts/translation.js";
  import { getPromptForLocale } from "@/utils/promptsHelpers.js";
  import { customInputTagTooltip } from "@/utils/contentHelpers.js";
  import {
    areComparableIdsEqual,
    cloneDeep,
    getLocalizedTranslation,
  } from "@/utils/componentHelpers";
  import { validateAndEnhanceMeshTerms } from "@/utils/meshValidator.js";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  export default {
    name: "DropdownWrapper",
    components: {
      Multiselect,
      DropdownTag,
      LoadingSpinner,
    },
    mixins: [appSettingsMixin, topicLoaderMixin, utilitiesMixin],
    inject: {
      instanceUseMeshValidation: { default: false },
    },
    emits: ["input", "updateScope", "mounted", "translating", "searchchange"],
    props: {
      isMultiple: Boolean,
      isGroup: Boolean,
      taggable: Boolean,
      closeOnInput: Boolean,
      searchWithAI: Boolean,
      showScopeLabel: Boolean,
      hideTagsWrap: {
        type: Boolean,
        default: false,
      },
      index: undefined, //sometimes a string, sometimes an integer. You gotta love javascript for this
      data: {
        type: Array,
        default: () => [],
        required: true,
      },
      placeholder: {
        type: String,
        default: "",
        required: true,
      },
      operator: {
        type: String,
        default: "",
        required: true,
      },
      selected: {
        type: Array,
        default: () => [],
        required: true,
      },
      hideTopics: {
        type: Array,
        default: () => []
      },
      isFilterDropdown: {
        type: Boolean,
        default: false,
      },
      noResultString: {
        type: String,
        default: "",
        required: true,
      },
      language: {
        type: String,
        default: "dk",
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
    },
    data: function () {
      return {
        maintopicToggledMap: {},
        expandedOptionGroupName: "",
        tempList: [],
        focusedButtonIndex: -1,
        focusByHover: true,
        ignoreHover: false,
        isLoading: false,
        isMouseUsed: false, // Flag to track interaction method
        isUserTyping: false,
        inputWidthObserver: null,
        isSilentFocus: false, // Track if focus is "silent" (no visual styling)
        _isEmptyDropdown: false, // Track if this is an empty dropdown with custom input handling
        isDropdownOpen: false, // Track dropdown state for aria-expanded
        _preventDeactivate: false,
        isTouchDevice: false,
        _touchMql: null,
        showMobileActionSheet: false,
        mobileOverlayHidden: false,
        _overlayTouchY: null,
        _overlayTouchMoved: false,
        _handleKeyDownBound: null,
        _handleInputEventBound: null,
        _handleEmptyDropdownInputBound: null,
        _handleEmptyDropdownKeydownBound: null,
        _handleEmptyDropdownFocusBound: null,
        _handleEmptyDropdownClickBound: null,
        _deactivateGuardTimer: null,
      };
    },
    created() {
      if (typeof window !== "undefined" && window.matchMedia) {
        this._touchMql = window.matchMedia("(pointer: coarse)");
        this.isTouchDevice = this._touchMql.matches;
        this._touchMqlHandler = (e) => { this.isTouchDevice = e.matches; };
        this._touchMql.addEventListener("change", this._touchMqlHandler);
      }
      this._handleKeyDownBound = this.handleKeyDown.bind(this);
      this._handleInputEventBound = this.handleInputEvent.bind(this);
      this._handleEmptyDropdownInputBound = this.handleEmptyDropdownInput.bind(this);
      this._handleEmptyDropdownKeydownBound = this.handleEmptyDropdownKeydown.bind(this);
      this._handleEmptyDropdownFocusBound = this.handleEmptyDropdownFocus.bind(this);
      this._handleEmptyDropdownClickBound = this.handleEmptyDropdownClick.bind(this);
      this._handleDropdownMousedownGuard = () => {
        if (this.$refs.multiselect?.isOpen) {
          this._preventDeactivate = true;
          clearTimeout(this._deactivateGuardTimer);
          this._deactivateGuardTimer = setTimeout(() => { this._preventDeactivate = false; }, 400);
        }
      };
      this._handleBlurGuard = (e) => {
        if (this._preventDeactivate && this.$refs.multiselect?.isOpen) {
          e.stopImmediatePropagation();
          setTimeout(() => {
            const s = this.$refs.multiselect?.$refs?.search;
            if (s && this.$refs.multiselect?.isOpen) {
              s.focus({ preventScroll: true });
            }
          }, 10);
        }
      };
    },
    computed: {
      dropdownListId: function () {
        // Generate a unique ID for the listbox based on the component's index or use fallback
        return `listbox-${this.index || 'default'}`;
      },
      getStateCopy: {
        get: function () {
          if (!this.selected) {
            return [];
          }
          return this.selected;
        },
        set: function (newValue) {
          //temp list because the this.selected is only updated after methods in this component is called
          this.tempList = newValue;
        },
      },
      getSelectGroupLabel: function () {
        return this.getString("selectGroupLabel");
      },
      getTagPlaceHolder: function () {
        return this.getString("tagplaceholder");
      },
      shownSubjects: function () {        
        if (!Array.isArray(this.hideTopics) || this.hideTopics.length === 0) {
          return this.data;
        }

        const shouldHideItem = (item) => {
          // Check direct ID match
          if (this.hideTopics.includes(item.id)) {
            return true;
          }
          // Check any ancestor ID match (supports unlimited nesting via parentChain)
          if (item.parentChain && item.parentChain.some((id) => this.hideTopics.includes(id))) {
            return true;
          }
          // Fallback for legacy flat format without parentChain
          if (item.maintopicIdLevel1 && this.hideTopics.includes(item.maintopicIdLevel1)) {
            return true;
          }
          if (item.maintopicIdLevel2 && this.hideTopics.includes(item.maintopicIdLevel2)) {
            return true;
          }
          return false;
        };

        return this.data.map(section => {
          // If section itself should be hidden, skip it
          if (shouldHideItem(section)) {
            return null;
          }

          const sectionCopy = cloneDeep(section);
          
          if (sectionCopy.choices) {
            sectionCopy.choices = sectionCopy.choices.filter(choice => {
              const shouldHide = shouldHideItem(choice);
              return !shouldHide;
            });
          }
          
          if (sectionCopy.groups) {
            sectionCopy.groups = sectionCopy.groups.filter(group => {
              const shouldHide = shouldHideItem(group);
              return !shouldHide;
            });
          }
          
          return sectionCopy;
        })
        .filter((section) => section !== null && section !== undefined) // Remove hidden sections
        .filter(section => {
          if (section.choices) {
            return section.choices.length > 0;
          }
          if (section.groups) {
            return section.groups.length > 0;
          }
          return true;
        });
      },
      getSortedSubjectOptions: function () {
        let self = this;
        let lang = this.language;

        function sortByPriorityOrName(a, b) {
          // Safety check for undefined/null items
          if (!a || !b) return 0;
          
          let aSort, bSort;

          if (
            a.ordering &&
            a.ordering[lang] !== null &&
            a.ordering[lang] !== undefined &&
            (!b.ordering || b.ordering[lang] === null || b.ordering[lang] === undefined)
          ) {
            return -1; // a is ordered and b is not -> a first
          }
          if (
            b.ordering &&
            b.ordering[lang] !== null &&
            b.ordering[lang] !== undefined &&
            (!a.ordering || a.ordering[lang] === null || a.ordering[lang] === undefined)
          ) {
            return 1; // b is ordered and a is not -> b first
          }

          if (a.ordering && a.ordering[lang] !== null && a.ordering[lang] !== undefined) {
            // We know both are non null due to earlier check
            aSort = a.ordering[lang];
            bSort = b.ordering[lang];
          } else {
            // Both are unordered
            aSort = self.customGroupLabel(a)?.toLowerCase() || '';
            bSort = self.customGroupLabel(b)?.toLowerCase() || '';
          }

          if (aSort === bSort) {
            return 0;
          }
          if (aSort > bSort) {
            return 1;
          } else {
            return -1;
          }
        }

        let data = cloneDeep(this.shownSubjects);
        
        // Filter out null/undefined items
        data = data.filter((item) => item !== null && item !== undefined);

        for (let i = 0; i < data.length; i++) {
          if (!data[i]) continue;
          
          let groupName = null;
          if (data[i]["groups"] !== null && data[i]["groups"] !== undefined) {
            groupName = "groups";
          } else if (data[i]["choices"] !== null && data[i]["choices"] !== undefined) {
            groupName = "choices";
          } else {
            continue;
          }

          // Filter out null/undefined items before sorting
          data[i][groupName] = data[i][groupName].filter(
            (item) => item !== null && item !== undefined
          );
          data[i][groupName].sort(sortByPriorityOrName); // Sort categories in groups
        }

        return data;
      },
      getIdToDataMap: function () {
        const dataMap = {};
        for (let i = 0; i < this.data.length; i++) {
          const group = this.data[i];
          dataMap[group.id] = group;

          const groupName = this.getGroupPropertyName(group);
          for (let j = 0; j < group[groupName].length; j++) {
            const element = group[groupName][j];
            dataMap[element.id] = element;
          }
        }
        return dataMap;
      },
      getNoResultString: function () {
        return this.noResultString ? this.noResultString : this.getString("noDropdownContent");
      },
      getShouldCloseOnInput: function () {
        return this.closeOnInput && this.focusByHover;
      },
      shouldHideDropdownArrow: function () {
        // Only hide the arrow for subject dropdowns (which use isGroup=true)
        if (!this.isGroup) {
          return false;
        }
        
        // Hide the arrow only if there are no original data (not based on hideTopics filtering)
        // A dropdown with hidden topics is still a dropdown with topics
        const result = !this.data || this.data.length === 0 || 
               this.data.every(section => 
                 !section.groups || section.groups.length === 0
               );
        
        return result;
      },
    },
    watch: {
      selected: {
        handler: "onSelectedChange",
        deep: true,
      },
      maintopicToggledMap: {
        handler: "onMaintainTopicToggledMapChange",
        deep: true,
      },
      hideTopics: {
        immediate: true,
        handler() {
          this.$nextTick(() => {
            // Update data without calling refresh
            this.updateSortedSubjectOptions();
          });
        }
      },
      placeholder: {
        immediate: true,
        handler() {
          this.$nextTick(() => {
            const input = this.$el?.getElementsByClassName("multiselect__input")[0];
            if (input) {
              this.setWidthToPlaceholderWidth(input);
            }
          });
        }
      },
      isSilentFocus: {
        handler(newVal) {
          const multiselect = this.$refs.multiselect;
          if (newVal && multiselect && multiselect.isOpen && !this.isUserTyping) {
            // Force close dropdown when silent focus is activated (but not when user is typing)
            if (typeof multiselect.deactivate === "function") {
              multiselect.deactivate();
            }
          }
        }
      },
      // Watch for changes in dropdown data/topics
      shouldHideDropdownArrow: {
        handler(newVal, oldVal) {
          if (newVal !== oldVal) {

            this.$nextTick(() => {
              const input = this.$el?.querySelector('.multiselect__input');
              if (input) {
                if (newVal && !this._isEmptyDropdown && this.index !== 0) {
                  // Dropdown became empty - activate empty dropdown mode (but not for first dropdown)
                  this.disableMultiselectInput(input);
                } else if (!newVal && this._isEmptyDropdown) {
                  // Dropdown got topics - disabling empty dropdown mode
                  this.restoreMultiselectInput(input);
                } else if (this.index === 0 && this._isEmptyDropdown) {
                  // First dropdown should always be in normal mode
                  this.restoreMultiselectInput(input);
                }
              }
            });
          }
        },
        immediate: false,
      },
    },
    mounted: function () {
      this.initialSetup();

      // Monkey-patch vue-multiselect's pointerAdjust to prevent $isLabel crash
      // when pointer is out of bounds after search filtering reduces filteredOptions
      if (this.$refs.multiselect) {
        const ms = this.$refs.multiselect;
        const originalPointerAdjust = ms.pointerAdjust.bind(ms);
        ms.pointerAdjust = () => {
          const opts = ms.filteredOptions;
          if (opts && ms.pointer >= opts.length) {
            ms.pointer = Math.max(0, opts.length - 1);
          }
          if (ms.pointer < 0 && opts && opts.length > 0) {
            ms.pointer = 0;
          }
          // Only call original if pointer is in bounds and element exists
          if (opts && opts.length > 0 && opts[ms.pointer]) {
            originalPointerAdjust();
          }
        };

        // Monkey-patch deactivate to prevent unintended close during
        // maintopic toggle and group header expand/collapse operations.
        // DOM changes from these operations can cause the search input to
        // briefly lose focus, which triggers blur → deactivate → dropdown closes.
        const self = this;
        const originalDeactivate = ms.deactivate.bind(ms);
        ms.deactivate = () => {
          if (self._preventDeactivate) return;
          originalDeactivate();
        };
      }

      this.$el.addEventListener("mousedown", this._handleDropdownMousedownGuard, true);
      this.$el.addEventListener("touchstart", this._handleDropdownMousedownGuard, true);

      if (Array.isArray(this.data)) {
        this.data.forEach((group) => {
          if (group.groups && Array.isArray(group.groups)) {
            group.groups.forEach((item) => {
              if (item.maintopic) {
                if (!Object.prototype.hasOwnProperty.call(this.maintopicToggledMap, item.id)) {
                  this.maintopicToggledMap[item.id] = false;
                }
              }
            });
          }
        });
      } else {
        console.warn("this.data is not an array or is undefined");
      }
      this.$emit("mounted", this);

      const input = this.$el.querySelector('.multiselect__input');
      if (input) {
        input.addEventListener('blur', this._handleBlurGuard, true);
        input.addEventListener('focus', this.addKeyboardFocus);
        input.addEventListener('blur', this.removeKeyboardFocus);
        input.addEventListener('focus', this.handleFocus);
        input.addEventListener('blur', this.handleBlur);
        input.addEventListener('click', this.handleClick, { capture: true });
        input.addEventListener('keydown', this._handleKeyDownBound);
        
        // For empty dropdown (no topics), completely disable multiselect's input handling
        // But only if it's not already set up as empty dropdown
        // EXCEPTION: The first dropdown (index 0) should always function normally
        if (this.shouldHideDropdownArrow && !this._isEmptyDropdown && this.index !== 0) {
          this.disableMultiselectInput(input);
        }
        // If dropdown HAS topics but is incorrectly set as empty dropdown, restore normal functionality
        else if (!this.shouldHideDropdownArrow && this._isEmptyDropdown) {
          this.restoreMultiselectInput(input);
        }
        // If this is the first dropdown, ensure it's always in normal mode
        else if (this.index === 0 && this._isEmptyDropdown) {
          this.restoreMultiselectInput(input);
        }
        // For dropdowns WITH topics - let multiselect handle everything normally (no custom handlers)
        
        // Set initial width based on placeholder
        this.setWidthToPlaceholderWidth(input);
        
        // Watch for changes in input field's style to prevent unwanted width changes
        this.setupInputWidthObserver(input);
      }
      
      // Watch for multiselect opening and prevent it during silent focus (unless user is typing)
      this.$watch(() => this.$refs.multiselect?.isOpen, (isOpen) => {
        if (isOpen && this.isSilentFocus && !this.isUserTyping) {
          this.$nextTick(() => {
            const multiselect = this.$refs.multiselect;
            if (multiselect && typeof multiselect.deactivate === "function") {
              multiselect.deactivate();
            }
          });
        }
      });

      // Fix aria-controls to match actual listbox ID
      this.$nextTick(() => {
        this.fixAriaControls();
        this.updateAriaExpanded();
      });
    },
    updated: function () {
      this.initialSetup();
      // Update width when component updates
      this.$nextTick(() => {
        const input = this.$el?.getElementsByClassName("multiselect__input")[0];
        if (input) {
          this.setWidthToPlaceholderWidth(input);
        }
      });
    },
    beforeUnmount() {
      this.isUserTyping = false;
      if (this._touchMql && this._touchMqlHandler) {
        this._touchMql.removeEventListener("change", this._touchMqlHandler);
      }
      this.$el.removeEventListener("mousedown", this._handleDropdownMousedownGuard, true);
      this.$el.removeEventListener("touchstart", this._handleDropdownMousedownGuard, true);
      clearTimeout(this._deactivateGuardTimer);
      document.removeEventListener("mousedown", this.setMouseUsed);
      document.removeEventListener("keydown", this.resetMouseUsed);

      const input = this.$el.querySelector('.multiselect__input');
      if (input) {
        input.removeEventListener('blur', this._handleBlurGuard, true);
        input.removeEventListener('focus', this.addKeyboardFocus);
        input.removeEventListener('blur', this.removeKeyboardFocus);
        input.removeEventListener('focus', this.handleFocus);
        input.removeEventListener('blur', this.handleBlur);
        input.removeEventListener('click', this.handleClick, { capture: true });
        input.removeEventListener('keydown', this._handleKeyDownBound);
        input.removeEventListener("input", this._handleInputEventBound);
        input.removeEventListener("keyup", this.handleSearchInput);
        
        // Cleanup for empty dropdowns
        if (this._isEmptyDropdown && input.getAttribute('data-multiselect-disabled') === 'true') {
          this.restoreMultiselectInput(input);
        }
      }

      const element = this.$refs.selectWrapper;
      if (element) {
        element.removeEventListener("keydown", this.handleStopEnterOnGroups, true);
        const dropdown = element.getElementsByClassName("qpm_dropDownMenu")[0];
        if (dropdown) {
          dropdown.removeEventListener("mousedown", this.handleOpenMenuOnClick);
        }
      }
      
      // Clean up observer
      if (this.inputWidthObserver) {
        this.inputWidthObserver.disconnect();
        this.inputWidthObserver = null;
      }
    },
    methods: {
      flattenGroupForNative(group) {
        const groupProp = group.groups ? "groups" : group.choices ? "choices" : null;
        if (!groupProp) return [];
        const items = group[groupProp];
        const result = [];
        const NBSP = "\u00A0";
        const CORNER = "\u2514\u2500 ";
        const selectedIds = new Set((this.selected || []).map(s => s?.id).filter(Boolean));
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          const depth = item.subtopiclevel || 0;
          const label = this.customNameLabel(item) || item.id;
          const isSelected = selectedIds.has(item.id);
          const check = isSelected ? "\u2713 " : "";
          let displayLabel;
          if (item.maintopic) {
            if (depth === 0) {
              displayLabel = label.toUpperCase();
            } else {
              const indent = NBSP.repeat(depth * 2);
              displayLabel = indent + label;
            }
          } else {
            const indent = NBSP.repeat(Math.max(0, depth - 1) * 2);
            displayLabel = indent + CORNER + check + label;
          }
          result.push({
            id: item.id,
            displayLabel,
            isBranch: !!item.maintopic,
            original: item,
          });
        }
        return result;
      },
      onOverlayTouchStart(e) {
        const t = e.touches[0];
        this._overlayTouchY = t ? t.clientY : null;
        this._overlayTouchMoved = false;
      },
      onOverlayTouchMove(e) {
        if (this._overlayTouchY === null) return;
        const t = e.touches[0];
        if (t && Math.abs(t.clientY - this._overlayTouchY) > 8) {
          this._overlayTouchMoved = true;
        }
      },
      onOverlayTouchEnd(e) {
        if (!this._overlayTouchMoved) {
          e.preventDefault();
          this.handleMobileTap();
        }
        this._overlayTouchY = null;
        this._overlayTouchMoved = false;
      },
      handleMobileTap() {
        const hasOptions = this.getSortedSubjectOptions.length > 0;
        const canFreeText = this.taggable;
        if (hasOptions) {
          this.showMobileActionSheet = true;
        } else if (canFreeText) {
          this.mobileOverlayHidden = true;
          this.$nextTick(() => {
            const input = this.$el.querySelector(".multiselect__input");
            if (input) input.focus();
          });
        }
      },
      closeMobileActionSheet() {
        this.showMobileActionSheet = false;
      },
      handleActionFreeText() {
        this.showMobileActionSheet = false;
        this.mobileOverlayHidden = true;
        this.$nextTick(() => {
          const input = this.$el.querySelector(".multiselect__input");
          if (input) input.focus();
        });
      },
      handleNativeSelect(event) {
        const selectedId = event.target.value;
        if (!selectedId) return;
        const optionObj = this.getIdToDataMap[selectedId];
        if (!optionObj || optionObj.maintopic) {
          event.target.value = "";
          return;
        }
        const alreadyIndex = this.selected.findIndex(
          s => s && s.id === selectedId
        );
        let newSelected;
        if (alreadyIndex >= 0) {
          newSelected = this.selected.filter((_, i) => i !== alreadyIndex);
        } else {
          newSelected = [...this.selected, optionObj];
        }
        this.$emit("input", newSelected, this.index);
        this.showMobileActionSheet = false;
        this.$nextTick(() => {
          if (this.$refs.nativeSelect) {
            this.$refs.nativeSelect.value = "";
          }
        });
      },
      /**
       * Checks whether a searchString scope has valid content.
       * @param {Object} option - Option object from the dropdown.
       * @param {string} scope - Scope name ('narrow', 'normal', or 'broad').
       * @returns {boolean} True when the scope has content.
       */
      hasScopeContent(option, scope) {
        // Check whether the option has searchStrings
        if (!option || !option.searchStrings) {
          return false;
        }
        
        // Check whether the scope property exists
        if (!Object.prototype.hasOwnProperty.call(option.searchStrings, scope)) {
          return false;
        }
        
        const searchString = option.searchStrings[scope];
        
        // Check whether searchString is an empty array
        if (Array.isArray(searchString) && searchString.length === 0) {
          return false;
        }
        
        // Check whether searchString array has content
        if (Array.isArray(searchString)) {
          const value = searchString[0];
          return value !== null && value !== undefined && value !== "";
        }
        
        // If it is not an array, check for a non-empty value
        return searchString !== null && searchString !== undefined && searchString !== "";
      },
      /**
       * Counts scopes with valid content.
       * @param {Object} option - Option object from the dropdown.
       * @returns {number} Number of scopes with content.
       */
      countValidScopes(option) {
        let count = 0;
        if (this.hasScopeContent(option, 'narrow')) count++;
        if (this.hasScopeContent(option, 'normal')) count++;
        if (this.hasScopeContent(option, 'broad')) count++;
        return count;
      },
      /**
       * Checks if scope buttons should be shown (only when at least 2 scopes exist).
       * @param {Object} option - Option object from the dropdown.
       * @returns {boolean} True when buttons should be shown.
       */
      shouldShowScopeButtons(option) {
        return this.countValidScopes(option) >= 2;
      },
      onSelectedChange(newValue, oldValue) {
        if (oldValue.length > newValue.length) {
          // Find the tag that was removed
          const removedTag = oldValue.find((tag) => !newValue.includes(tag));
          if (removedTag) {
            removedTag.scope = "normal";
            // Emit updateScope asynchronously to avoid blocking UI
            this.$nextTick(() => {
              this.$emit("updateScope", removedTag, "normal", this.index);
            });
          }
          // Ensure tempList is cleared when tags are removed
          this.tempList = [];
          
          // Defer heavy DOM operations to next tick for better performance
          this.$nextTick(() => {
            this.updateExpandedGroupHighlighting();
            this.showOrHideElements();
          });
        } else {
          // For additions, run immediately as expected
          this.updateExpandedGroupHighlighting();
          this.showOrHideElements();
        }
        
      },
      /**
       * Sets the flag indicating the last interaction was via mouse.
       */
      setMouseUsed() {
        this.isMouseUsed = true;
        this.removeKeyboardFocus();
      },
      /**
       * Resets the flag indicating the last interaction was via keyboard.
       */
      resetMouseUsed() {
        this.isMouseUsed = false;
      },
      addKeyboardFocus() {
        const input = this.$el.querySelector('.multiselect__input');
        if (input && !this.isMouseUsed) {
          input.classList.add('qpm_keyboard-focus');
        }
      },
      removeKeyboardFocus() {
        const input = this.$el.querySelector('.multiselect__input');
        if (input) {
          input.classList.remove('qpm_keyboard-focus');
          // When input loses focus, set width back to placeholder width if there is no text
          if (!input.value || input.value.length === 0) {
            this.setWidthToPlaceholderWidth(input);
            this.isUserTyping = false;
          }
        }
      },
      initialSetup() {
        const element = this.$refs.selectWrapper;
        if (!element) return;
        document.removeEventListener("mousedown", this.setMouseUsed);
        document.removeEventListener("keydown", this.resetMouseUsed);
        document.addEventListener("mousedown", this.setMouseUsed);
        document.addEventListener("keydown", this.resetMouseUsed);

        // Click on anywhere on dropdown opens (fix for IE)
        const dropdown = element.getElementsByClassName("qpm_dropDownMenu")[0];
        dropdown.removeEventListener("mousedown", this.handleOpenMenuOnClick);
        dropdown.addEventListener("mousedown", this.handleOpenMenuOnClick);

        // Set placeholder to correct length
        const input = element.getElementsByClassName("multiselect__input")[0];
        if (input) {
          // These event listeners are necessary for all normal multiselect functionality
          input.removeEventListener("input", this._handleInputEventBound);
          input.removeEventListener("keydown", this._handleKeyDownBound);
          input.addEventListener("input", this._handleInputEventBound);
          input.addEventListener("keydown", this._handleKeyDownBound);
        }

        // Hide last operator
        const operators = element.getElementsByClassName("qpm_operator");
        Array.from(operators).forEach((operator, index) => {
          if (index === operators.length - 1) {
            operator.style.color = "darkgrey";
          } else {
            operator.style.color = "";
            operator.style.display = "inline-block";
          }
        });

        const headers = Array.from(element.getElementsByClassName("multiselect__element"));
        const self = this;

        headers.forEach((header) => {
          // Stop existing mousedown events
          header.removeEventListener("mousedown", self.handleStopEvent, true);
          header.addEventListener("mousedown", self.handleStopEvent, true);

          // Add click handler for category groups
          header.removeEventListener("click", self.handleCategoryGroupClick);
          header.addEventListener("click", self.handleCategoryGroupClick);
        });

        // Stop selecting group when pressing enter during search
        element.removeEventListener("keydown", self.handleStopEnterOnGroups, true);
        element.addEventListener("keydown", self.handleStopEnterOnGroups, true);

        if (input) {
          input.removeEventListener("keyup", this.handleSearchInput);
          input.addEventListener("keyup", this.handleSearchInput);
          if (!input.value) {
            // Hide what needs to be hidden only if groups and only if we are not currently doing a search
            this.showOrHideElements();
          }
        }

        const labels = element.getElementsByClassName("multiselect__tag");
        Array.from(labels).forEach((label) => {
          label.removeEventListener("click", self.handleTagClick);
          label.addEventListener("click", self.handleTagClick);
          
          // Add keyboard event listener
          label.removeEventListener("keydown", self.handleTagKeyDown);
          label.addEventListener("keydown", self.handleTagKeyDown);
        });
      },
      clearShownItems() {
        this.expandedOptionGroupName = "";
        this.updateExpandedGroupHighlighting();

        const multiselect = this.$refs.multiselect;
        if (multiselect) {
          multiselect.pointer = 0; // Set highlight to first item to prevent exceptions.
        }
        for (let key in this.maintopicToggledMap) {
          this.maintopicToggledMap[key] = false;
        }
      },
      input(value) {
        // Ensure value is always an array (vue-multiselect may emit non-array during search)
        if (!Array.isArray(value)) {
          value = value ? [value] : [];
        }
        if (value.length === 0) {
          this.clearShownItems();
          this.$emit("input", value, this.index);
          return;
        }
        // Clone the last element to avoid modifying it directly in the data source
        let elem = { ...value[value.length - 1] };
        let lg = this.language; // Use this.language to get the current language code

        if (elem.maintopic) {
          this._preventDeactivate = true;
          this.maintopicToggledMap = {
            ...this.maintopicToggledMap,
            [elem.id]: !this.maintopicToggledMap[elem.id],
          };
          value.pop();
          setTimeout(() => { this._preventDeactivate = false; }, 300);
        }

        // Only check for '-' in the current language
        const translatedLabel = elem.translations?.[lg];
        if (!elem.isCustom && typeof translatedLabel === "string" && translatedLabel.startsWith("-")) {
          // Only modify translations for the current language
          const updatedTranslations = { ...elem.translations };
          updatedTranslations[lg] = translatedLabel.slice(1);

          // Update elem with the new translations, so the change only affects the selected language
          elem.translations = updatedTranslations;
          // Replace the original element with the modified clone in the value array
          value[value.length - 1] = elem;
        }
        this.$emit("input", value, this.index);
        // Check if the selection was made via mouse
        if (this.isMouseUsed) {
          // If not a maintopic, deactivate the multiselect dropdown
          if (!elem.maintopic) {
            this._preventDeactivate = false;
            clearTimeout(this._deactivateGuardTimer);
            const multiselect = this.$refs.multiselect;
            if (multiselect && typeof multiselect.deactivate === "function") {
              multiselect.deactivate();
            }
          }
        }
      },
      close() {
        this.mobileOverlayHidden = false;
        // Clear tempList if it contains items that are being removed (not being added)
        // This fixes the issue where tag removal requires double-click
        if (this.tempList.length > 0) {
          // Check if tempList contains items that are no longer in selected
          const hasRemovedItems = this.tempList.some(item => !this.selected.includes(item));
          if (hasRemovedItems) {
            this.tempList = [];
          } else {
            // Only return early if tempList contains items that are actually being added
            return;
          }
        }

        let input = this.$el.getElementsByClassName("multiselect__input")[0];

        this.setWidthToPlaceholderWidth(input);
        
        // Update dropdown state for aria-expanded
        this.isDropdownOpen = false;
        
        // Update aria-expanded directly on DOM
        this.$nextTick(() => {
          this.updateAriaExpanded();
        });
      },
      open() {
        // If this is an empty dropdown, don't allow opening
        if (this._isEmptyDropdown) {
          // Do nothing, handled by custom event handlers
          return;
        }
        
        // If we're in silent focus, remove it and allow dropdown to open
        if (this.isSilentFocus) {
          const input = this.$el?.querySelector('.multiselect__input');
          if (input) {
            this.removeSilentFocus(input);
          }
        }
        
        // For dropdowns with topics, reset pointer to ensure highlight logic works
        const multiselect = this.$refs.multiselect;
        if (multiselect) {
          multiselect.pointer = -1;
        }
        
        // Update dropdown state for aria-expanded
        this.isDropdownOpen = true;
        
        // Update aria-expanded directly on DOM
        this.$nextTick(() => {
          this.updateAriaExpanded();
        });
      },
      optionIdentity(option) {
        if (!option || typeof option !== "object") return "";
        if (option.id) return `id:${option.id}`;
        if (option.isCustom && option.name) return `custom:${option.name}`;
        if (option.name) return `name:${option.name}`;
        return "";
      },
      /**
       * Added for sanity, since we hide elements by adding qpm_shown
       */
      hideElement(element) {
        element.classList.add("qpm_shown");
      },
      /**
       * Added for sanity, since we show elements by removing qpm_shown
       */
      showElement(element) {
        element.classList.remove("qpm_shown");
      },
      /**
       * Resets the maintopicToggledMap.
       * Used to close all the options that are branches
       */
      resetMaintopicToggledMap() {
        for (let key in this.maintopicToggledMap) {
          this.maintopicToggledMap[key] = false;
        }
      },
      /**
       * Hides all items in the specified group.
       *
       * @param {string} groupName - The name of the group to hide.
       */
      hideItems(groupName) {
        if (!groupName) return;
        const itemsToRemove = document.querySelectorAll(`[data-name="${groupName}"]`);

        itemsToRemove.forEach((item) => {
          this.hideElement(item.parentNode.parentNode);
        });
      },
      /**
       * Adds or removes tag either by clicking on "x" or clicking already selected item in dropdown
       * Updated 04/11/2024 handles hidding or showing elements based on the maintopicToggledMap (handles state for the chevron that a maintopic has)
       */
      /**
       * Checks if ALL ancestors of an entry are expanded (toggled open).
       * Uses parentChain if available (unlimited depth), falls back to parent-id/grand-parent-id.
       */
      areAllAncestorsExpanded(entry) {
        const chain = entry.getAttribute("parent-chain");
        if (chain) {
          return chain.split(',').filter(Boolean).every((id) => this.maintopicToggledMap[id]);
        }
        // Fallback for legacy items without parentChain
        const parentId = entry.getAttribute("parent-id");
        const grandParentId = entry.getAttribute("grand-parent-id");
        return (!parentId || this.maintopicToggledMap[parentId]) &&
               (!grandParentId || this.maintopicToggledMap[grandParentId]);
      },
      /**
       * Return indices in filteredOptions for currently visible rows.
       */
      getVisibleIndices() {
        const element = this.$refs.selectWrapper;
        if (!element) return [];
        const listItems = element.querySelectorAll("li.multiselect__element");
        const visible = [];
        for (let i = 0; i < listItems.length; i++) {
          if (!listItems[i].classList.contains("qpm_shown")) {
            visible.push(i);
          }
        }
        return visible;
      },
      /**
       * Backward-compatible alias used by limit dropdown logic.
       */
      getFilterVisibleIndices() {
        return this.getVisibleIndices();
      },
      showOrHideElements() {
        const element = this.$refs.selectWrapper;
        if (!element) return; // Safety check
        
        if (!this.isGroup) {
          const entries = element.querySelectorAll("[data-name]");
          const process = () => {
            entries.forEach((entry) => {
              const parent = entry.parentNode.parentNode;
              const shouldShow = this.areAllAncestorsExpanded(entry);
              parent.classList.toggle("qpm_shown", !shouldShow);
            });
          };
          if (entries.length > 50) {
            requestAnimationFrame(process);
          } else {
            process();
          }
          return;
        }

        const entries = element.querySelectorAll("[data-name]");
        const processGroup = () => {
          entries.forEach((entry) => {
            const groupName = entry.getAttribute("data-name");
            const parent = entry.parentNode.parentNode;

            const shouldShow =
              this.expandedOptionGroupName !== groupName ||
              !this.areAllAncestorsExpanded(entry);

            parent.classList.toggle("qpm_shown", shouldShow);
          });
        };
        if (entries.length > 50) {
          requestAnimationFrame(processGroup);
        } else {
          processGroup();
        }
      },
      /**
       * Updates visibility of options contained in an optiongroup.
       *
       * @param {Array} selectedOptionIds - The list of option IDs that are selected.
       * @param {Array} optionsInOptionGroup - The list of options in the group.
       */
      updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup) {
        // Sets to keep track of depths and parent IDs
        const selectedDepths = new Set();
        const ancestorIdsToShow = new Set();

        const optionsInGroupIds = new Set(optionsInOptionGroup.map((option) => option.id));

        // First, expand all ancestors in maintopicToggledMap
        selectedOptionIds.forEach((id) => {
          const option = optionsInOptionGroup.find((option) => option.id === id);
          if (option) {
            selectedDepths.add(option.depth);
            // Expand ALL ancestors (supports unlimited nesting)
            if (option.parentChain && option.parentChain.length > 0) {
              option.parentChain.forEach((ancestorId) => {
                ancestorIdsToShow.add(ancestorId);
                this.maintopicToggledMap[ancestorId] = true;
              });
            } else {
              // Fallback for items without parentChain
              if (option.parentId) {
                ancestorIdsToShow.add(option.parentId);
                this.maintopicToggledMap[option.parentId] = true;
              }
              if (option.grandParentId) {
                ancestorIdsToShow.add(option.grandParentId);
                this.maintopicToggledMap[option.grandParentId] = true;
              }
            }
          }
        });

        // Then show/hide based on the UPDATED maintopicToggledMap
        this.showOrHideElements();
        this.updateExpandedGroupHighlighting();

        this.showElementsByOptionIds(selectedOptionIds, optionsInGroupIds);
        this.showElementsByDepths(selectedDepths, optionsInGroupIds);
        this.showElementsByOptionIds(Array.from(ancestorIdsToShow), optionsInGroupIds);
      },
      /**
       * Utility method to show elements by option IDs
       * @param {Array} optionIds - The list of option IDs to show.
       * @param {Set} optionsInGroupIds - The set of option IDs in the group.
       */
      showElementsByOptionIds(optionIds, optionsInGroupIds) {
        optionIds.forEach((id) => {
          if (optionsInGroupIds.has(id)) {
            const elements = document.querySelectorAll(`span[option-id="${id}"]`);
            elements.forEach((element) => {
              const liElement = element.closest("li.multiselect__element");
              if (liElement) {
                this.showElement(liElement);
              }
            });
          }
        });
      },
      /**
       * Utility method to show elements by option depth
       * @param {Array} depths - The list of depths to show.
       * @param {Set} optionsInGroupIds - The set of option IDs in the group.
       */
      showElementsByDepths(depths, optionsInGroupIds) {
        depths.forEach((depth) => {
          const depthElements = document.querySelectorAll(`span[option-id="${depth}"]`);
          depthElements.forEach((element) => {
            const optionId = element.getAttribute("option-id");
            if (optionsInGroupIds.has(optionId)) {
              const liElement = element.closest("li.multiselect__element");
              if (liElement) {
                this.showElement(liElement);
              }
            }
          });
        });
      },

      /**
       * Utility method to get the options for a specific optiongroup
       * @param {String} groupName Name of the option--group
       * @returns list of options in the group
       */
      getOptionsFromOptionsGroupName(groupName) {
        const result = [];
        const groupProp = this.isGroup ? "groups" : "choices";
        this.data.forEach((item) => {
          if (
            item.id === groupName ||
            this.customNameLabel(item) === groupName ||
            this.customGroupLabel(item) === groupName
          ) {
            const items = item[groupProp] || item.groups || item.choices || [];
            items.forEach((entry) => {
              result.push({
                id: entry.id,
                name: entry.name,
                isBranch: entry.maintopic || null,
                depth: entry.subtopiclevel || 0,
                parentId: entry.maintopicIdLevel1 || null,
                grandParentId: entry.maintopicIdLevel2 || null,
                parentChain: entry.parentChain || [],
              });
            });
          }
        });
        return result;
      },
      /**
       * Utility method to get the children options for a maintopic
       * @param {String} maintopicId The maintopic ID
       * @param {Boolean} isFilter Whether the maintopic is a filter or not
       * @returns list of children options
       */
      getMaintopicChildren(maintopicId) {
        const children = [];
        const isDescendant = (item) =>
          (item.parentChain && item.parentChain.includes(maintopicId)) ||
          item.maintopicIdLevel1 === maintopicId ||
          item.maintopicIdLevel2 === maintopicId;

        this.data.forEach((container) => {
          const items = container.groups || container.choices || [];
          items.forEach((entry) => {
            if (isDescendant(entry)) {
              children.push(entry);
            }
          });
        });

        return children;
      },

      /**
       * @param optionGroupId {String} - The Id (eg. S00) of the optiongroup to get siblings for
       * @param baseTopic {Boolean} - Whether the topic is a base topic or not
       * @param depth {Number} - The depth level to retrieve options from
       * @param isFilter {Boolean} - Whether the options are limits or not
       */
      getSiblings(optionGroupId, baseTopic, depth) {
        const siblings = [];

        let matched = [];
        if (optionGroupId !== null) {
          matched = this.data.filter((item) => item.id === optionGroupId);
        }

        matched.forEach((container) => {
          const items = container.groups || container.choices || [];
          items.forEach((entry) => {
            if (entry.subtopiclevel === depth) {
              siblings.push(entry);
            }
          });
        });

        // Case: the topic is baseTopic since it's at depth zero
        if (baseTopic && depth === 0) {
          matched.forEach((container) => {
            const items = container.groups || container.choices || [];
            items.forEach((entry) => {
              if (!entry.maintopic) siblings.push(entry);
            });
          });
        }

        return siblings;
      },

      /**
       * Retrieves options at a specific depth.
       * If optionGroupId is provided, narrows the options accordingly.
       * If includeChildren is true, includes children of maintopic options.
       *
       * @param {number} depth - The depth level to retrieve options from.
       * @param {string} [optionGroupId=null] - (Optional) The group ID to filter options.
       * @param {boolean} [includeChildren=false] - (Optional) Whether to include maintopic children.
       * @param {boolean} [baseTopic=false] - (Optional) Whether to include siblings for base topics.
       * @param {boolean} [isFilter=false] - (Optional) Whether the options are limits or not.
       * @returns {Array} - The filtered and possibly expanded options.
       */
      getOptionsAtDepth(
        depth,
        optionGroupId = null,
        includeChildren = false,
        baseTopic = false,
      ) {
        let siblings = this.getSiblings(optionGroupId, baseTopic, depth);

        // Case: Include children where a maintopic is toggled
        if (includeChildren) {
          const childrenOptions = [];

          siblings.forEach((option) => {
            if (option.maintopic) {
              const isMaintopicToggled = this.maintopicToggledMap[option.id];
              if (!isMaintopicToggled) {
                const children = this.getMaintopicChildren(option.id);
                childrenOptions.push(...children);
              }
            }
          });

          // Combine the siblings with the grand children
          siblings = siblings.concat(childrenOptions);
        }

        return siblings;
      },

      /**
       * Utility method to get the state of maintopics from the dropdown.
       * @param optionGroupId {String} - The Id (eg. S00) of the optiongroup to get maintopics for
       * @param filter {Boolean} - Whether the options are limits or not
       */
      getMaintopics(optionGroupId) {
        let maintopics = [];
        const container = this.data.find((item) => item.id === optionGroupId);
        if (container) {
          const items = container.groups || container.choices || [];
          items.forEach((entry) => {
            if (entry.maintopic) {
              maintopics.push(entry);
            }
          });
        }
        return maintopics;
      },

      /**
       * Utility method to check maintopic toggled state for a specific optiongroup ID
       * return true if all maintopics are toggled
       * @param {String} optionGroupId - The Id (eg. S00) of the optiongroup to check
       * @param {Boolean} getToggled - Whether to return the toggled or not toggled maintopics
       * @param {Boolean} isFilter - Whether the options are limits or not
       */
      areMaintopicsToggled(optionGroupId, getToggled = true) {
        // find the optiongroup
        const maintopics = this.getMaintopics(optionGroupId);

        let allToggled = true;
        // check if all maintopics are toggled
        maintopics.forEach((maintopic) => {
          if (!this.maintopicToggledMap[maintopic.id]) {
            allToggled = false;
          }
        });
        if (allToggled) return true;

        // if not all maintopics are toggled return the ones that are toggled or not toggled based on getToggled flag
        if (getToggled) {
          return maintopics.filter((maintopic) => this.maintopicToggledMap[maintopic.id]);
        }
        return maintopics.filter((maintopic) => !this.maintopicToggledMap[maintopic.id]);
      },
      findNextSibling(currentSubject, filteredSortedOptions) {
        const currentIndex = filteredSortedOptions.findIndex(
          (option) => this.optionIdentity(option) === this.optionIdentity(currentSubject)
        );

        if (currentIndex > 0) {
          return filteredSortedOptions[currentIndex - 1];
        }

        return null; // No next sibling found
      },
      /**
       * Handles the event when clicking the optiongroup/category
       * Updates the visibility of expanded optiongroup and selected options, using updateOptionGroupVisibility
       * @param {HTMLElement} target - The target element.
       */
      handleCategoryGroupClick(event) {
        const rawTarget = event.target;
        if (!rawTarget || typeof rawTarget.closest !== "function") {
          return;
        }

        // Only process true group header clicks.
        // Clicking regular option rows (including maintopic rows) should not run this path.
        const target = rawTarget.classList?.contains("multiselect__option--group")
          ? rawTarget
          : rawTarget.closest(".multiselect__option--group");
        if (!target) {
          return;
        }

        const groupLabelElement = target.getElementsByClassName("qpm_groupLabel")[0];
        if (!groupLabelElement) {
          return;
        }
        const optionGroupName = groupLabelElement.textContent;

        if (target.classList.contains("multiselect__option--group")) {
          this._preventDeactivate = true;
          if (this.expandedOptionGroupName === optionGroupName) {
            this.hideItems(this.expandedOptionGroupName);
            this.expandedOptionGroupName = "";
            this.updateExpandedGroupHighlighting();
            this.resetMaintopicToggledMap();
          } else {
            this.expandedOptionGroupName = optionGroupName;
            
            // Reset maintopicToggledMap when switching to a new category
            // This prevents navigation issues caused by state from previous categories
            this.resetMaintopicToggledMap();

            const optionGroupId = this.getOptionGroupId(optionGroupName);
            const selectedOptions = this.getSelectedOptionsByOptionGroupId(optionGroupId);

            const selectedOptionIds = selectedOptions.map((o) => o.id);
            // Use the ID-based lookup (groupname matches the raw ID, not the display name)
            const optionsInOptionGroup = this.getOptionsFromOptionsGroupName(optionGroupId || optionGroupName);

            if (selectedOptionIds.length <= 0) {
              this.showOrHideElements();
              this.updateExpandedGroupHighlighting();
            } else {
              // Only show the tags in the clicked group
              this.updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup);
              // Ensure visibility is refreshed after DOM update
              this.$nextTick(() => {
                this.showOrHideElements();
              });
            }
          }
          setTimeout(() => { this._preventDeactivate = false; }, 300);
        } else {
          // This is when we are adding a new tag
        }
      },
      /**
       * Handles the click event on a tag (an option that has been selected),
       * Updates the visibility of expanded optiongroup and selected options, using updateOptionGroupVisibility
       *
       * @param {Event} event - The click event.
       */
      handleTagClick(event) {
        const target = event.target;
        const targetLabel = target.textContent.trim();
        const optionGroupName = this.getOptionGroupName(this.data, targetLabel, this.language);

        const optionGroupId = this.getOptionGroupId(optionGroupName);
        const selectedOptions = this.getSelectedOptionsByOptionGroupId(optionGroupId);

        const selectedOptionIds = selectedOptions.map((o) => o.id);
        // Use the ID-based lookup (groupname matches the raw ID, not the display name)
        const optionsInOptionGroup = this.getOptionsFromOptionsGroupName(optionGroupId || optionGroupName);

        if (!optionGroupName && !optionGroupId) {
          const filterCategoryId = this.selected[0]?.id?.substring(0, 3);
          const optionsInOptionGroupFilters = this.getOptionsFromOptionsGroupName(filterCategoryId);

          const filterIds = this.selected.map((option) => option.id);
          this.updateOptionGroupVisibility(filterIds, optionsInOptionGroupFilters);
        }

        if (selectedOptionIds.length <= 0) {
          this.showOrHideElements();
          this.updateExpandedGroupHighlighting();
        } else {
          // Only show the tags in the clicked group
          this.updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup);
          // Ensure visibility is refreshed after DOM update
          this.$nextTick(() => {
            this.showOrHideElements();
          });
        }

        // New functionality: Highlight the clicked element in the dropdown
        this.highlightClickedTagInDropdown(targetLabel);
      },

      /**
       * Highlights the element in the dropdown that corresponds to the clicked tag
       * @param {string} targetLabel - Text from the clicked tag
       */
      highlightClickedTagInDropdown(targetLabel) {
        // Wait until next tick to ensure dropdown is open and updated
        this.$nextTick(() => {
          const multiselect = this.$refs.multiselect;
          if (!multiselect || !multiselect.filteredOptions) {
            return;
          }

          const filteredOptions = multiselect.filteredOptions;
          const cleanedTargetLabel = this.cleanLabel(targetLabel);
          
          // Find the element that matches the clicked tag
          const matchingIndex = filteredOptions.findIndex((option) => {
            if (option.$groupLabel) {
              return false; // Skip group labels
            }
            
            const optionLabel = this.cleanLabel(this.customNameLabel(option));
            return optionLabel === cleanedTargetLabel;
          });

          if (matchingIndex !== -1) {
            // Set pointer to the matching element to highlight it
            multiselect.pointer = matchingIndex;
          }
        });
      },
      handleSearchInput(event) {
        if (!this.isGroup) return;
        const target = event.target;
        const element = this.$refs.selectWrapper;

        if (target.value) {
          //search input, save current state of shown element, and show all elements
          const entries = element.querySelectorAll(".multiselect__element.qpm_shown");
          for (let i = 0; i < entries.length; i++) {
            this.showElement(entries[i]);
          }
        } else {
          //restore current state of shown elements
          this.showOrHideElements();
          this.initialSetup();
        }

        target.removeEventListener("blur", this.handleOnBlur);
        target.addEventListener("blur", this.handleOnBlur);
      },
      /**
       * Adjusts the input field's width based on its value length.
       *
       * @param {Event} event - The input event object.
       */
      handleInputEvent(event) {
        // Update typing state regardless of dropdown state
        this.isUserTyping = event.target.value.length > 0;

        // Silent focus should already be handled by handleKeyDown, but keep as fallback
        if (this.isSilentFocus && this.isUserTyping) {
          this.removeSilentFocus(event.target);
        }

        // If dropdown arrow is hidden (no topics), use 100% width but still allow text input
        if (this.shouldHideDropdownArrow) {
          // Don't change width - let CSS handle 100%, but ensure text is visible
          if (event.target.value.length > 0) {
            // For hidden dropdown arrow, ensure the input field stays at 100% width
            event.target.style.setProperty('width', '100%', 'important');
          }
          
          // Ensure multiselect's internal search value is updated
          if (this.$refs.multiselect) {
            this.$refs.multiselect.search = event.target.value;
          }
          
          // Emit search change event to parent component
          this.$emit("searchchange", event.target.value, this.index);
          
          // Don't do further width calculations, but allow input to work normally
          return;
        }

        if (event.target.value.length > 0) {
          // When there is text, calculate precise width based on actual text
          this.setWidthToTextWidth(event.target, event.target.value);
        } else {
          // When there is no text, use placeholder-based width
          this.setWidthToPlaceholderWidth(event.target);
        }
      },
      handleStopEnterOnGroups(event) {
        // Keep pointer in bounds when typing reduces filteredOptions
        // (vue-multiselect's pointerAdjust crashes if pointer is out of bounds)
        const ms = this.$refs.multiselect;
        if (ms && ms.isOpen) {
          const opts = ms.filteredOptions;
          if (opts && opts.length > 0) {
            if (ms.pointer >= opts.length) {
              ms.pointer = opts.length - 1;
            }
            if (ms.pointer < 0) {
              ms.pointer = 0;
            }
          }
        }

        // Only handle Enter key beyond this point
        if (event.key !== 'Enter') return;

        // Free-text field without topics: Enter should create a tag instead of opening dropdown
        if (
          event.target.classList.contains("multiselect__input") &&
          this.shouldHideDropdownArrow
        ) {
          event.stopPropagation();
          event.preventDefault();
          if (this.isSilentFocus) {
            this.removeSilentFocus(event.target);
          }
          const newTag = (event.target.value || "").trim();
          if (newTag.length > 0) {
            this.handleAddTag(newTag);
            event.target.value = "";
            if (this.$refs.multiselect) {
              this.$refs.multiselect.search = "";
            }
            this.isUserTyping = false;
          }
          return;
        }

        // When input has focus and dropdown is closed, Enter opens the dropdown
        if (event.target.classList.contains("multiselect__input") && this.$refs.multiselect && !this.$refs.multiselect.isOpen) {
          event.stopPropagation();
          event.preventDefault();
          if (this.isSilentFocus) {
            this.removeSilentFocus(event.target);
          }
          if (typeof this.$refs.multiselect.activate === "function") {
            this.$refs.multiselect.activate();
          }
          return;
        }

        if (ms && ms.pointer < 0) {
          // If there is no hovered element then highlight the first on as with old behavior
          // setting it to zero enabels the first element to be highlighted on enter after pasting text
          ms.pointer = 0;
        }
        // Handle Enter key
        {
          if (event.target.classList.contains("multiselect__input")) {
            const element = this.$refs.selectWrapper;
            const target = element.getElementsByClassName("multiselect__option--highlight")[0];

            // Check if highlighted element is a main topic and toggle open/close with Enter
            if (target && target.querySelector('.qpm_maintopicDropdown')) {
              event.stopImmediatePropagation();
              event.stopPropagation();
              event.preventDefault();
              const dropdownRef = this.$refs.multiselect;
              const option = dropdownRef.filteredOptions[dropdownRef.pointer];
              if (option && option.maintopic) {
                this._preventDeactivate = true;
                this.maintopicToggledMap = {
                  ...this.maintopicToggledMap,
                  [option.id]: !this.maintopicToggledMap[option.id],
                };
                this.showOrHideElements();
                setTimeout(() => { this._preventDeactivate = false; }, 300);
              }
              return;
            }

            if (target === null || target.classList.contains("multiselect__option--group")) {
              event.stopImmediatePropagation();
              event.stopPropagation();
              event.preventDefault();
              if (target === null) return;

              const focusedGroup = target.querySelector(".qpm_groupLabel").textContent;

              if (focusedGroup === this.expandedOptionGroupName) {
                this.hideItems(this.expandedOptionGroupName);
                this.expandedOptionGroupName = "";
                this.updateExpandedGroupHighlighting();
                this.resetMaintopicToggledMap();
                this.showOrHideElements();
              } else {
                this.expandedOptionGroupName = focusedGroup;
                this.resetMaintopicToggledMap();
                const optionGroupId = this.getOptionGroupId(focusedGroup);
                const selectedOptions = this.getSelectedOptionsByOptionGroupId(optionGroupId);
                const selectedOptionIds = selectedOptions.map((o) => o.id);
                const optionsInOptionGroup = this.getOptionsFromOptionsGroupName(optionGroupId || focusedGroup);
                if (selectedOptionIds.length <= 0) {
                  this.showOrHideElements();
                  this.updateExpandedGroupHighlighting();
                } else {
                  this.updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup);
                  this.$nextTick(() => this.showOrHideElements());
                }
              }
            } else if (!this.focusByHover && this.focusedButtonIndex >= 0) {
              const dropdownRef = this.$refs.multiselect;

              // Nothing currently in focus, and therefore nothing left to do.
              if (dropdownRef.pointer < 0) {
                event.stopPropagation();
                return;
              }

              // Find the button corresponding to the one in focus
              const target = dropdownRef.$refs.list.getElementsByClassName(
                "multiselect__option--highlight"
              )[0];
              const button = target.getElementsByClassName("qpm_ButtonColumnFocused")[0];

              // If no scope buttons exists or none are currently in focus
              // then let the default handeling occur via the input method.
              if (!button) return;

              event.stopPropagation();
              
              // Store current focus state before clicking
              const currentFocusedButtonIndex = this.focusedButtonIndex;
              const currentPointer = dropdownRef.pointer;
              const currentFocusByHover = this.focusByHover;
              
              if (typeof button.click === "function") {
                button.click();
              }
              
              // Immediately restore focus state to prevent it from being lost
              this.focusedButtonIndex = currentFocusedButtonIndex;
              this.focusByHover = currentFocusByHover;
              dropdownRef.pointer = currentPointer;
              
              // Also restore after DOM updates
              this.$nextTick(() => {
                this.focusedButtonIndex = currentFocusedButtonIndex;
                this.focusByHover = currentFocusByHover;
                if (dropdownRef.filteredOptions && dropdownRef.filteredOptions[currentPointer]) {
                  dropdownRef.pointer = currentPointer;
                }
              });
              
              return;
            }
          }
        }
      },
      handleOpenMenuOnClick(event) {
        //FIX FOR IE!
        const tagText = event.target.textContent;

        if (
          tagText.startsWith(this.getString("manualInputTerm")) ||
          tagText.startsWith(this.getString("manualInputTermTranslated"))
        ) {
          this.expandedOptionGroupName = "";
          this.updateExpandedGroupHighlighting();
        }
        this.setMouseUsed();
        event.stopPropagation();
        
        // Guard to ensure search ref exists
        const searchInput = this.$refs.multiselect?.$refs?.search;
        if (searchInput && typeof searchInput.focus === "function") {
          searchInput.focus();
        }
      },
      handleScopeButtonClick(item, state, event) {
        this.$emit("updateScope", item, state, this.index);
        item.scope = state;

        // Only close dropdown on actual mouse clicks, not on programmatic clicks from Enter key
        // Use multiple checks to ensure this is a real mouse click:
        // 1. event.isTrusted - true for real user events, false for programmatic events
        // 2. this.isMouseUsed - tracks if last interaction was via mouse
        // 3. event.detail > 0 - mouse clicks have detail > 0, programmatic clicks have detail = 0
        if (event.isTrusted && this.isMouseUsed && event.detail > 0) {
          const multiselect = this.$refs.multiselect;
          if (multiselect && typeof multiselect.deactivate === "function") {
            multiselect.deactivate();
          }
        }

        //Check if just added
        if (this.tempList.indexOf(item) >= 0) {
          event.stopPropagation();
          return;
        }
        //Check if added previously
        for (let i = 0; i < this.selected.length; i++) {
          if (this.optionIdentity(this.selected[i]) === this.optionIdentity(item)) {
            event.stopPropagation();
            return;
          }
        }
        
      },
      handleOnButtonMouseover(index, event) {
        // Prevent mouse from focusing new subject. Used for auto scroll.
        if (this.ignoreHover) {
          event.stopPropagation();
          event.preventDefault();
          return;
        }

        this.focusedButtonIndex = index;
        this.focusByHover = true;
      },
      async handleAddTag(newTag) {
        const input = this.$refs.multiselect?.$refs.search || this.$el?.querySelector(".multiselect__input");
        const appRoot = this.$el?.closest(".qpm_vapp");
        const hadVisibleKeyboardFocus =
          !!input &&
          !this.isMouseUsed &&
          document.activeElement === input &&
          !!appRoot &&
          appRoot.classList.contains("qpm_keyboard-mode") &&
          !this.isSilentFocus &&
          !input.classList.contains("qpm_silent-focus");
        let tag;
        if (this.searchWithAI) {
          this.isLoading = true;
          this.$emit("translating", true, this.index, "translatingStepSearchString");

          // close the multiselect dropdown
          const multiselect = this.$refs.multiselect;
          if (multiselect && typeof multiselect.deactivate === "function") {
            multiselect.deactivate();
          }
          if (hadVisibleKeyboardFocus && input) {
            this.$nextTick(() => {
              input.focus({ preventScroll: true });
              this.addKeyboardFocus();
            });
          }
          //setTimeout is to resolve the tag placeholder before starting to translate
          let translated;
          try {
            await new Promise((resolve) => setTimeout(resolve, 10));
            translated = await this.translateSearch(newTag);
            // Validate and enhance MeSH terms via NLM E-utilities if enabled
            if (this.instanceUseMeshValidation) {
              this.$emit("translating", true, this.index, "translatingStepMesh");
              translated = await validateAndEnhanceMeshTerms(
                translated,
                newTag,
                this.appSettings.nlm.proxyUrl,
                this.appSettings.openAi.baseUrl,
                this.appSettings.client,
                this.language,
                (stepKey) => this.$emit("translating", true, this.index, stepKey),
              );
            }
          } catch (error) {
            console.error("[MeSHFlow] Validation failed. Query not added to form.", error);
            this.$emit("translating", false, this.index);
            this.isLoading = false;
            return;
          }
          tag = {
            id: `__custom__:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            name: translated,
            searchStrings: { normal: [translated] },
            preString: this.getString("manualInputTermTranslated") + ":\u00A0",
            isCustom: true,
            //IsTranslated is true when it is an unedited translation
            isTranslated: true,
            preTranslation: newTag,
            tooltip: {
              dk: customInputTagTooltip.dk + " &ndash; denne søgning er oversat fra: <strong>" + newTag + "</strong>",
              en: customInputTagTooltip.en + " &ndash; this search is translated from: <strong>" + newTag + "</strong>",
            },
          };
          this.$emit("translating", false, this.index);
          this.isLoading = false;
        } else {
          this.$emit("translating", false, this.index);

          const multiselect = this.$refs.multiselect;
          if (multiselect && typeof multiselect.deactivate === "function") {
            multiselect.deactivate();
          }
          if (hadVisibleKeyboardFocus && input) {
            this.$nextTick(() => {
              input.focus({ preventScroll: true });
              this.addKeyboardFocus();
            });
          }
          // setTimeout is to resolve the tag placeholder before starting to translate
          // Without this the dropdown will hide category groups when adding a new tag
          await new Promise((resolve) => setTimeout(resolve, 20));
          tag = {
            id: `__custom__:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            name: newTag,
            searchStrings: { normal: [newTag] },
            preString: this.getString("manualInputTerm") + ":\u00A0",
            isCustom: true,
            isTranslated: false,
            tooltip: customInputTagTooltip,
          };
          this.$emit("translating", false, this.index);
        }
        this.selected.push(tag);
        this.input(this.selected, -1);
        this.loading = false;
        this.clearShownItems();
        if (hadVisibleKeyboardFocus) {
          this.$nextTick(() => this.focusNextFocusableElement(input));
        }
      },
      focusNextFocusableElement(currentElement) {
        if (!currentElement || this.isMouseUsed) return;

        const root = this.$el?.closest(".qpm_vapp") || document.body;
        const focusableSelector = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled]):not([type="hidden"])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(",");

        const focusables = Array.from(root.querySelectorAll(focusableSelector)).filter((el) => {
          if (!(el instanceof HTMLElement)) return false;
          if (el.getAttribute("aria-hidden") === "true") return false;
          return el.offsetParent !== null || el === document.activeElement;
        });

        const currentIndex = focusables.indexOf(currentElement);
        const next = currentIndex >= 0 ? focusables[currentIndex + 1] : null;
        if (next instanceof HTMLElement) {
          next.focus({ preventScroll: true });
        }
      },
      /**
       * This is the handler for the custom tag update event.
       * A Custom tag is a tag that is not part of the dropdown.
       * Can be AI translated or not
       * @param oldTag text of the tag to be updated
       * @param newTag text of the new tag
       */
      handleUpdateCustomTag(oldTag, newTag) {
        const tagIndex = this.selected.findIndex((entry) => oldTag === entry);
        this.selected.splice(tagIndex, 1, newTag);
        this.clearShownItems();
        this.input(this.selected);
      },
      handleEditTag() {
        console.info("handleEditTag");
      },
      /**
       * Stops the propagation and default action of an event under certain conditions.
       *
       * The function checks if the event target has specific CSS classes and performs actions accordingly:
       * 1. If the target has the class "multiselect__option--group", it stops the event's propagation and prevents its default action.
       * 2. If the target has either the class "qpm_groupLabel" or "qpm_scopeLabel", it stops the event's propagation, prevents its default action, and triggers a click event on the target's parent node.
       *
       * @param {Event} event - The event object to be stopped.
       * @returns {boolean} Always returns false to indicate the event has been handled.
       */
      handleStopEvent(event) {
        // Click event was on the parent multiselect group
        if (event.target.classList.contains("multiselect__option--group")) {
          event.stopPropagation();
          event.preventDefault();
          return false;
        }
        // Click event was on the category name (left aligned)
        if (event.target.classList.contains("qpm_groupLabel")) {
          event.stopPropagation();
          event.preventDefault();
          return false;
        }
        // click event was on either of the scope labels (right aligned in advanced search)
        if (event.target.classList.contains("qpm_scopeLabel")) {
          event.stopPropagation();
          event.preventDefault();
          const parent = event.target.parentNode;
          if (parent && typeof parent.click === "function") {
            parent.click();
          }
          return false;
        }
      },
      /**
       * Blur handler needed to force groups to close if search is aborted
       */
      handleOnBlur() {
        this.isUserTyping = false;
        this.initialSetup();
      },

      scrollToFocusedSubject() {
        const list = this.$refs.multiselect?.$refs?.list;
        if (!list) return;
        const subject = list.querySelector(
          ".multiselect__option--highlight"
        );
        if (!subject) return;

        const isFocusVissible = this.isSubjectVissible(subject);
        if (!isFocusVissible) {
          this.ignoreHover = true;
          subject.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      },
      navDown() {
        const dropdownRef = this.$refs.multiselect;

        // Set focused column to normal if not set
        if (this.focusedButtonIndex < 0 || this.focusByHover) {
          this.focusedButtonIndex = 1; // index 1 is assumed to be the middle/default index
          this.focusByHover = false;
        }

        if (this.isUserTyping) {
          dropdownRef.pointer += 1;
          return;
        }

        // Limit dropdown: move one visible item down (skip hidden rows)
        if (this.isFilterDropdown) {
          const visible = this.getFilterVisibleIndices();
          let idx = visible.indexOf(dropdownRef.pointer);
          if (idx === -1) {
            const nextDown = visible.filter((v) => v > dropdownRef.pointer);
            dropdownRef.pointer = nextDown.length ? nextDown[0] : dropdownRef.pointer;
          } else if (idx < visible.length - 1) {
            dropdownRef.pointer = visible[idx + 1];
          } else {
            return;
          }
          this.$nextTick(() => {
            this.scrollToFocusedSubject();
          });
          return;
        }

        // No element selected, just select first
        if (dropdownRef.pointer < 0) {
          dropdownRef.pointer = 0;
          return;
        }

        const currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];

        const isGroup =
          currentSubject["$groupLabel"] !== null && currentSubject["$groupLabel"] !== undefined;
        const isMaintopic = currentSubject.maintopic;
        let isCurrentExpandedGroup = false;
        let navDistance;
        let subject;

        // Logic for navigating over the topic groups
        if (!isGroup && isMaintopic) {
          const currentSubjectOptionGroupId = currentSubject.id.substring(0, 3);
          const isFilter = currentSubjectOptionGroupId.startsWith("L");
          // Check if the ID of the currentSubject is a key in maintopicToggledMap
          const isMaintopicToggled = this.maintopicToggledMap[currentSubject.id];

          // If the option--group is not expanded we set navDistance to amount of non visible children
          if (!isMaintopicToggled) {
            const maintopicChildren = this.getMaintopicChildren(currentSubject.id, isFilter);
            dropdownRef.pointer += maintopicChildren.length + 1;
            return;
          }
        }

        // Logic for navigating over the topic (dark blue background)
        if (isGroup) {
          const label = this.customGroupLabelById(currentSubject.$groupLabel);
          subject = this.getSortedSubjectOptions.find(
            (entry) => entry.id === currentSubject.$groupLabel
          );
          isCurrentExpandedGroup = label !== this.expandedOptionGroupName;
        } else {
          subject = currentSubject;
        }

        if (isGroup && isCurrentExpandedGroup) {
          const groupPropertyName = this.getGroupPropertyName(subject);
          navDistance = subject[groupPropertyName].length + 1;
        } else {
          navDistance = 1;
        }

        if (dropdownRef.pointer + navDistance >= dropdownRef.filteredOptions.length) {
          return;
        }

        dropdownRef.pointer += navDistance;

        // Scroll to see element if needed
        this.$nextTick(() => {
          this.scrollToFocusedSubject();
        });
      },
      navUp() {
        const dropdownRef = this.$refs.multiselect;

        // Set focused column to normal if not set
        if (this.focusedButtonIndex < 0 || this.focusByHover) {
          this.focusedButtonIndex = 1; // index 1 is assumed to be the middle/default index
          this.focusByHover = false;
        }

        // End of list reached, do nothing
        if (dropdownRef.pointer <= 0) {
          dropdownRef.pointer = -1;
          dropdownRef.$el.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
          return;
        }

        if (this.isUserTyping) {
          dropdownRef.pointer -= 1;
          return;
        }

        // Use the previous visible row for stable keyboard navigation across all dropdowns.
        if (!this.isFilterDropdown) {
          const visible = this.getVisibleIndices();
          let idx = visible.indexOf(dropdownRef.pointer);
          if (idx === -1) {
            const nextUp = visible.filter((v) => v < dropdownRef.pointer);
            dropdownRef.pointer = nextUp.length ? nextUp[nextUp.length - 1] : -1;
          } else if (idx === 0) {
            dropdownRef.pointer = -1;
          } else {
            dropdownRef.pointer = visible[idx - 1];
          }
          if (dropdownRef.pointer < 0) {
            dropdownRef.$el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          } else {
            this.scrollToFocusedSubject();
          }
          return;
        }

        // Limit dropdown: move one visible item up (skip hidden rows)
        if (this.isFilterDropdown) {
          const visible = this.getFilterVisibleIndices();
          let idx = visible.indexOf(dropdownRef.pointer);
          if (idx === -1) {
            const nextUp = visible.filter((v) => v < dropdownRef.pointer);
            dropdownRef.pointer = nextUp.length ? nextUp[nextUp.length - 1] : -1;
          } else if (idx === 0) {
            dropdownRef.pointer = -1;
          } else {
            dropdownRef.pointer = visible[idx - 1];
          }
          if (dropdownRef.pointer < 0) {
            dropdownRef.$el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
          } else {
            this.scrollToFocusedSubject();
          }
          return;
        }

        const currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];
        
        // Check if we're navigating up from a collapsed maintopic's children (works for both topics and limits)
        const itemAbove = dropdownRef.filteredOptions[dropdownRef.pointer - 1];
        const itemAboveId = String(itemAbove?.id ?? "");
        const currentParentChain = Array.isArray(currentSubject?.parentChain)
          ? currentSubject.parentChain.map((id) => String(id))
          : typeof currentSubject?.parentChain === "string"
            ? currentSubject.parentChain.split(",").map((id) => String(id).trim()).filter(Boolean)
            : [];
        const currentDepth = Number(currentSubject?.subtopiclevel ?? currentSubject?.depth ?? 0);
        // If the item above is the current item's own parent maintopic, stop there.
        // This prevents jumping past the parent to the previous maintopic when navigating up.
        if (
          currentSubject &&
          itemAbove &&
          !currentSubject["$groupLabel"] &&
          !itemAbove["$groupLabel"] &&
          itemAbove.maintopic &&
          (
            String(currentSubject.maintopicIdLevel1 ?? "") === itemAboveId ||
            String(currentSubject.maintopicIdLevel2 ?? "") === itemAboveId ||
            String(currentSubject.parentId ?? "") === itemAboveId ||
            String(currentSubject.grandParentId ?? "") === itemAboveId ||
            currentParentChain.includes(itemAboveId) ||
            // Top-level fallback: when moving from level-1 child to its visible maintopic above.
            currentDepth === 1
          )
        ) {
          dropdownRef.pointer -= 1;
          this.scrollToFocusedSubject();
          return;
        }
        if (itemAbove && !itemAbove["$groupLabel"] && itemAbove.maintopic) {
          const currentSubjectOptionGroupId = itemAbove.id.substring(0, 3);
          const isFilter = currentSubjectOptionGroupId.startsWith("L");
          const isMaintopicToggled = this.maintopicToggledMap[itemAbove.id];

          // If the maintopic above is not expanded, we need to jump over all its hidden children
          if (!isMaintopicToggled) {
            const maintopicChildren = this.getMaintopicChildren(itemAbove.id, isFilter);
            dropdownRef.pointer -= maintopicChildren.length + 1;
            this.scrollToFocusedSubject();
            return;
          }
        }

        // Check if the item above belongs to a collapsed parent (for 2nd/3rd level navigation)
        if (itemAbove && !itemAbove["$groupLabel"]) {
          const parentId = itemAbove.maintopicIdLevel1;
          const grandparentId = itemAbove.maintopicIdLevel2;
          
          // Check grandparent first (highest level)
          // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
          if (grandparentId && !this.maintopicToggledMap[grandparentId]) {
            const grandparentIndex = dropdownRef.filteredOptions.findIndex((opt) => opt.id === grandparentId);
            if (grandparentIndex !== -1) {
              dropdownRef.pointer = grandparentIndex;
              this.scrollToFocusedSubject();
              return;
            }
          }
          
          // Then check parent
          // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
          if (parentId && !this.maintopicToggledMap[parentId]) {
            const parentIndex = dropdownRef.filteredOptions.findIndex((opt) => opt.id === parentId);
            if (parentIndex !== -1) {
              dropdownRef.pointer = parentIndex;
              this.scrollToFocusedSubject();
              return;
            }
          }
        }

        // Only for topic dropdown: arrow up from first item under a category jumps to previous category header
        const itemDirectlyAbove = dropdownRef.filteredOptions[dropdownRef.pointer - 1];
        if (!this.isFilterDropdown && currentSubject && !currentSubject.$groupLabel && itemDirectlyAbove && itemDirectlyAbove.$groupLabel) {
          let i = dropdownRef.pointer - 2;
          while (i >= 0 && !dropdownRef.filteredOptions[i].$groupLabel) i--;
          if (i >= 0) {
            dropdownRef.pointer = i;
            this.scrollToFocusedSubject();
            return;
          }
        }

        const isGroup =
          currentSubject["$groupLabel"] !== null && currentSubject["$groupLabel"] !== undefined;
        let navDistance = 1;

        // Logic for navigating over the topic groups (emne-dropdown)
        if (!isGroup) {
          const currentSubjectOptionGroupId = currentSubject.id.substring(0, 3);
          const isFilter = currentSubjectOptionGroupId.startsWith("L");

          const optionsAtDepth = this.getOptionsAtDepth(
            currentSubject.subtopiclevel || 0,
            currentSubjectOptionGroupId,
            true,
            false,
            isFilter
          );

          // Case: default when all maintopics are toggled
          const allToggled = this.areMaintopicsToggled(currentSubjectOptionGroupId, true, isFilter);
          if (allToggled === true) {
            dropdownRef.pointer = dropdownRef.pointer - navDistance;
            return;
          }

          const itemAbove = dropdownRef.filteredOptions[dropdownRef.pointer - 1];
          if (itemAbove) {
            const parentId = itemAbove.maintopicIdLevel1;
            const grandparentId = itemAbove.maintopicIdLevel2;

            // Check if the grandparent is collapsed. If so, jump to it.
            // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
            if (grandparentId && !this.maintopicToggledMap[grandparentId]) {
              const parentIndex = dropdownRef.filteredOptions.findIndex(
                (opt) => opt.id === grandparentId
              );
              if (parentIndex !== -1) {
                dropdownRef.pointer = parentIndex;
                this.scrollToFocusedSubject();
                return; // We're done
              }
            }

            // If grandparent is NOT collapsed, check if the parent is collapsed.
            // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
            if (parentId && !this.maintopicToggledMap[parentId]) {
              const parentIndex = dropdownRef.filteredOptions.findIndex((opt) => opt.id === parentId);
              if (parentIndex !== -1) {
                dropdownRef.pointer = parentIndex;
                this.scrollToFocusedSubject();
                return; // We're done
              }
            }

            // Check if the item above is a collapsed maintopic
            // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
            if (itemAbove.maintopic && !this.maintopicToggledMap[itemAbove.id]) {
              const maintopicChildren = this.getMaintopicChildren(itemAbove.id, isFilter);
              dropdownRef.pointer -= maintopicChildren.length + 1;
              this.scrollToFocusedSubject();
              return;
            }
          }

          // Case: base topic
          if (optionsAtDepth.length === 0) {
            // Case: base topic and maintopic
            if (currentSubject.maintopic) {
              dropdownRef.pointer = dropdownRef.pointer - 1;
              return;
            }

            const siblings = this.getOptionsAtDepth(
              currentSubject.subtopiclevel || 0,
              currentSubjectOptionGroupId,
              false,
              true,
              isFilter
            );

            const toggledMaintopic = this.areMaintopicsToggled(
              currentSubjectOptionGroupId,
              true,
              isFilter
            );

            // Case: BaseTopic and 1 maintopic toggled at base level
            if (toggledMaintopic.length === 1 && toggledMaintopic[0]?.subtopiclevel === undefined) {
              dropdownRef.pointer = dropdownRef.pointer - 1;
              return;
            }

            // Case: BaseTopic and 1 maintopic toggled at depth greater than zero
            if (toggledMaintopic.length === 1 && toggledMaintopic[0]?.suptopiclevel > 0) {
              dropdownRef.pointer = dropdownRef.pointer - siblings.length;
              return;
            }

            // Case: BaseTopic and no maintopics toggled
            dropdownRef.pointer = dropdownRef.pointer - siblings.length;
            return;
          }

          // Case: not a base topic
          if (optionsAtDepth.length > 0) {
            if (currentSubject.maintopic) {
              dropdownRef.pointer = dropdownRef.pointer - 1;
              return;
            }

            // Case: not a base topic but grandparent maintopic is toggled
            if (currentSubject.maintopicIdLevel2) {
              const isParentToggled = this.maintopicToggledMap[currentSubject.maintopicIdLevel2];
              const isGrandParentToggled =
                this.maintopicToggledMap[currentSubject.maintopicIdLevel1];

              // Case: not a base topic but grandparent maintopic is toggled while parent maintopic is not toggled
              if (isGrandParentToggled && !isParentToggled) {
                const parentChildren = this.getMaintopicChildren(
                  currentSubject.maintopicIdLevel2,
                  isFilter
                );
                dropdownRef.pointer = dropdownRef.pointer - parentChildren.length;
                return;
              }
            }

            // Case: not a base topic but parent maintopic is toggled
            if (currentSubject.maintopicIdLevel1) {
              const isParentToggled = this.maintopicToggledMap[currentSubject.maintopicIdLevel1];
              if (isParentToggled) {
                // Sort the OptionsAtDepth by the ordering field
                const sortedOptions = optionsAtDepth.sort((a, b) => a.ordering.dk - b.ordering.dk);

                // filter the sortedOptions based on depth
                const filteredSortedOptions = sortedOptions.filter(
                  (option) => option.subtopiclevel === currentSubject.subtopiclevel
                );

                // Find the next sibling in the filteredSortedOptions based on the ordering.dk
                const nextSibling = this.findNextSibling(currentSubject, filteredSortedOptions);

                // Check if nextSibling is null, and navigate to the parent maintopic
                if (!nextSibling) {
                  dropdownRef.pointer = dropdownRef.pointer - 1;
                  return;
                }

                // Check if the previous sibling is a toggled maintopic
                const isToggled = this.maintopicToggledMap[nextSibling.id];
                if (nextSibling.maintopic && isToggled) {
                  const children = this.getMaintopicChildren(nextSibling.id, isFilter);
                  dropdownRef.pointer = dropdownRef.pointer - children.length - 1;
                } else {
                  // Previous sibling is not a toggled maintopic, just move up one step
                dropdownRef.pointer = dropdownRef.pointer - 1;
                }
                return;
              }
            }

            // Case: Not a base topic and no maintopic is toggled
            const pointerIndex = dropdownRef.pointer - optionsAtDepth.length;
            dropdownRef.pointer = pointerIndex;
            return;
          }
        }

        // Logic for navigating over the topics (dark blue background)
        if (isGroup) {
          const groupIndex = this.getSortedSubjectOptions.findIndex(
            (entry) => entry.id === currentSubject.$groupLabel
          );

          if (groupIndex > 0) {
            const groupAbove = this.getSortedSubjectOptions[groupIndex - 1];
            const groupAboveLabel = this.customGroupLabel(groupAbove);

            if (groupAboveLabel !== this.expandedOptionGroupName) {
              if (this.isFilterDropdown) {
                // For limits: use the actual list position so expanded subcategories are skipped correctly
                const opts = dropdownRef.filteredOptions;
                let prevGroupHeaderIndex = -1;
                for (let i = dropdownRef.pointer - 1; i >= 0; i--) {
                  if (opts[i] && opts[i].$groupLabel === groupAbove.id) {
                    prevGroupHeaderIndex = i;
                    break;
                  }
                }
                if (prevGroupHeaderIndex >= 0) {
                  navDistance = dropdownRef.pointer - prevGroupHeaderIndex;
                } else {
                  const groupPropertyName = this.getGroupPropertyName(groupAbove);
                  navDistance = groupAbove[groupPropertyName].length + 1;
                }
              } else {
                const groupPropertyName = this.getGroupPropertyName(groupAbove);
                navDistance = groupAbove[groupPropertyName].length + 1;
              }
            }
          }
        }

        dropdownRef.pointer -= navDistance;

        // Scroll to see element if needed
        this.$nextTick(() => {
          this.scrollToFocusedSubject();
        });
      },
      navLeft(event) {
        if (!this.getShouldPreventLeftRightDefault()) return;

        this.focusByHover = false;
        this.focusedButtonIndex = Math.max(0, this.focusedButtonIndex - 1); // Stop navLeft at left most element
        event.preventDefault();
      },
      navRight(event) {
        if (!this.getShouldPreventLeftRightDefault()) return;

        this.focusByHover = false;
        this.focusedButtonIndex = Math.min(2, this.focusedButtonIndex + 1); // Stop navRight at right most element (currently assumed to be index 2)
        event.preventDefault();
      },

      isContainedInList(props) {
        if (props.option && this.selected) {
          for (let i = 0; i < this.selected.length; i++) {
            if (this.optionIdentity(this.selected[i]) === this.optionIdentity(props.option)) {
              return true;
            }
          }
        }
        return false;
      },
      isSelected(option) {
        return this.selected.some((selectedOption) => selectedOption.id === option.id);
      },
      isHiddenTopic(topicId) {
        return this.hideTopics.indexOf(topicId) !== -1;
      },
      isSubjectVissible(subject) {
        const subjectRect = subject.getBoundingClientRect();

        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        return subjectRect.top >= 0 && subjectRect.bottom <= viewHeight;
      },
      updateExpandedGroupHighlighting() {
        // Safety check
        if (!this.$refs.multiselect || !this.$refs.multiselect.$refs.list) return;
        
        const listItems = this.$refs.multiselect.$refs.list;

        // Remove highlighting due to group being open from all groups
        let itemsToUnHighlight = listItems.querySelectorAll(".qpm_groupExpanded");

        // Use forEach for better performance than for loop
        itemsToUnHighlight.forEach(item => {
          item.classList.remove("qpm_groupExpanded");
        });

        if (this.expandedOptionGroupName === "") return;

        // Add highlighting due to group being open
        const expandedElement = listItems.querySelector(
          'li.multiselect__element span.multiselect__option--group span[group-name="' +
            this.expandedOptionGroupName +
            '"]'
        );
        
        // Safety check before accessing parentElement
        if (expandedElement && expandedElement.parentElement && expandedElement.parentElement.parentElement) {
          expandedElement.parentElement.parentElement.classList.add("qpm_groupExpanded");
        }
      },
      updateSortedSubjectOptions() {
        this.showOrHideElements();
        this.$nextTick(() => {
          if (this.$refs.multiselect && typeof this.$refs.multiselect.refresh === 'function') {
            this.$refs.multiselect.refresh();
          }
        });
      },
      /**
       * Handles changes to maintopicToggledMap by updating sorted subject options.
       */
      onMaintainTopicToggledMapChange() {
        this.updateSortedSubjectOptions();
      },
      /**
       * Determine if the buttons for the scopes (narrow, normal or broad) should be shown.
       *
       * @param {string} name - The name of the group.
       * @returns {boolean} True if the scope buttons should be shown, false otherwise.
       */
      showScope(name) {
        return !(this.expandedOptionGroupName === name);
      },
      /**
       * Translates the given words using the function endpoint for translation.
       *
       * @param {string} wordsToTranslate - The words that need to be translated.
       * @returns {Promise<string>} The translated text.
       */
      async translateSearch(wordsToTranslate) {
        const openAiServiceUrl = this.appSettings.openAi.baseUrl + "/api/TranslateTitle";
        const localePrompt = getPromptForLocale(searchTranslationPrompt, "dk");

        const requestBody = {
          prompt: localePrompt,
          title: wordsToTranslate,
          client: this.appSettings.client,
        };

        console.info(
          `|TranslateSearch Request|\n\n|Words to translate|\n${wordsToTranslate}\n\n|Prompt text|\n${localePrompt.prompt}\n`
        );

        try {
          let answer = "";
          const response = await fetch(openAiServiceUrl, {
            method: "POST",
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            let errorBody;
            try {
              errorBody = await response.json();
            } catch {
              errorBody = await response.text();
            }
            throw Error(typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody));
          }

          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

          let done = false;
          while (!done && !this.stopGeneration) {
            const { done: readerDone, value } = await reader.read();
            done = readerDone;
            if (value) {
              answer += value;
            }
          }
          return answer;
        } catch (error) {
          this.text = "An unknown error occurred: \n" + error.toString();
          return wordsToTranslate;
        }
      },
      /**
       * Get selected options for an optiongroup by optiongroup id.
       * @param {string} groupId - The ID of the option group.
       * @returns {Array} An array of options that belong to the specified option group.
       */
      getSelectedOptionsByOptionGroupId(groupId) {
        return this.selected.filter(
          (selectedOption) => selectedOption.id && selectedOption.id.startsWith(groupId)
        );
      },
      /**
       * Gets the ID of an option group by its option group name.
       * (OptionGroups are the topics from qpm-content-diabetes.js)
       * @param {string} groupname - The name of the group.
       * @returns {string|null} The ID of the group if found, otherwise null.
       */
      getOptionGroupId(groupname) {
        for (const item of this.data) {
          // Match by raw groupname, display name, or group label
          if (
            item.id === groupname ||
            this.customNameLabel(item) === groupname ||
            this.customGroupLabel(item) === groupname
          ) {
            return item.id;
          }
        }
        return null;
      },
      /**
       * Gets the group name for a given item.
       * Needed since we operate with two different sets of naming.
       * For limits we have 'choices' and for topics we have 'groups'.
       *
       * @param {Object} item - The item to get the group name for.
       * @returns {string|null} The group name or null if not found.
       */
      getGroupName(item) {
        if (item.groups !== undefined) return "groups";
        if (item.choices !== undefined) return "choices";
        return null;
      },
      /**
       * Finds the name of the group that contains the target label.
       *
       * @param {Array} data - The data array to search through.
       * @param {string} targetLabel - The target label to find.
       * @param {string} language - The current language.
       * @returns {string} The name of the group containing the target label.
       */
      getOptionGroupName(data, targetLabel, language) {
        let name = "";
        data.some((item) => {
          const groupName = this.getGroupName(item);
          if (!groupName) return false;
          return item[groupName].some((i) => {
            // Use customNameLabel for comparison to match the display label (including numbering)
            const currentLabel = this.cleanLabel(this.customNameLabel(i));
            if (currentLabel === targetLabel) {
              name = this.customNameLabel(item);
              this.expandedOptionGroupName = name;
              return true;
            }
            return false;
          });
        });
        return name;
      },
      getHeader(name) {
        for (let i = 0; i < this.data.length; i++) {
          if (!this.data[i].groups) {
            //Not group
            return "single";
          }
          for (let j = 0; j < this.data[i].groups.length; j++) {
            if (areComparableIdsEqual(this.data[i].groups[j].id, name)) {
              return this.customGroupLabel(this.data[i]);
            }
          }
        }
        return "unknown";
      },
      getOptionClassName(option) {
        // Return the 'cssClass' if it exists, otherwise return an empty string
        return option.cssClass ? `qpm_${option.cssClass}` : "";
      },
      getShouldPreventLeftRightDefault() {
        const dropdownRef = this.$refs.multiselect;
        const isWritingSearch = dropdownRef.search.length > 0;

        const hasFocusedSubject = isWritingSearch
          ? dropdownRef.pointer >= 1
          : dropdownRef.pointer >= 0;

        return hasFocusedSubject && !this.focusByHover;
      },
      getButtonColor(props, scope, index) {
        let classes = [];
        if (scope === "narrow") {
          classes.push(this.qpmButtonColor1);
        }
        if (!scope || scope === "normal") {
          classes.push(this.qpmButtonColor2);
        }
        if (scope === "broad") {
          classes.push(this.qpmButtonColor3);
        }

        // Set class to distinguish the column currently in 'focus' for
        // selection via keyboard. This class together with the
        // multiselect__option--highlight class defines the highlighted button.
        if (!this.focusByHover && index === this.focusedButtonIndex) {
          classes.push("qpm_ButtonColumnFocused");
        }

        if (props.option && this.selected) {
          for (let i = 0; i < this.selected.length; i++) {
            if (this.optionIdentity(this.selected[i]) === this.optionIdentity(props.option)) {
              if (this.selected[i].scope === scope) classes.push("selectedButton");
              break;
            }
          }
        }
        return classes;
      },
      getGroupPropertyName(group) {
        if (group.groups !== undefined) {
          return "groups";
        } else if (group.choices !== undefined) {
          return "choices";
        }

        return null;
      },
      setWidthToPlaceholderWidth(input) {
        if (!input || !input.getAttribute) return;
        
        const placeholder = input.getAttribute("placeholder");
        if (!placeholder) return;

        // If dropdown arrow is hidden (no topics), always use 100% width
        if (this.shouldHideDropdownArrow) {
          // Remove any inline width style to let CSS handle 100% width
          input.style.removeProperty('width');
          return;
        }

        // Create a temporary span element and set its text to the placeholder text
        let tempSpan = document.createElement("span");
        tempSpan.textContent = placeholder; // Use textContent instead of innerHTML for safety
        tempSpan.style.visibility = "hidden"; // Make it invisible but still take up space
        tempSpan.style.position = "absolute"; // Remove from document flow
        tempSpan.style.top = "-9999px"; // Move off-screen

        // Apply the same styles to the span as the input
        let inputStyle = window.getComputedStyle(input);
        tempSpan.style.fontFamily = inputStyle.fontFamily;
        tempSpan.style.fontSize = inputStyle.fontSize;
        tempSpan.style.fontWeight = inputStyle.fontWeight;
        tempSpan.style.letterSpacing = inputStyle.letterSpacing;
        tempSpan.style.whiteSpace = "nowrap"; // Ensure text stays on one line

        // Add the span to the body
        document.body.appendChild(tempSpan);

        // Get the width of the text and add space for borders and padding (20px for left+right padding, 5px for buffer)
        let placeholderWidth = tempSpan.getBoundingClientRect().width + 25;

        // Remove the span from the body
        document.body.removeChild(tempSpan);

        // Set the width with !important to override any CSS rules
        input.style.setProperty('width', placeholderWidth + 'px', 'important');
      },
      /**
       * Sets the input width based on the actual text content
       */
      setWidthToTextWidth(input, text) {
        if (!input || !text) return;

        // Create a temporary span to measure text width
        let tempSpan = document.createElement("span");
        tempSpan.textContent = text;
        tempSpan.style.visibility = "hidden";
        tempSpan.style.position = "absolute";
        tempSpan.style.top = "-9999px";

        // Apply the same styles to the span as the input
        let inputStyle = window.getComputedStyle(input);
        tempSpan.style.fontFamily = inputStyle.fontFamily;
        tempSpan.style.fontSize = inputStyle.fontSize;
        tempSpan.style.fontWeight = inputStyle.fontWeight;
        tempSpan.style.letterSpacing = inputStyle.letterSpacing;
        tempSpan.style.whiteSpace = "nowrap";

        // Add the span to the body
        document.body.appendChild(tempSpan);

        // Get the width of the text and add space for padding (20px) + borders (2px)
        let textWidth = tempSpan.getBoundingClientRect().width + 27;

        // Remove the span from the body
        document.body.removeChild(tempSpan);

        // Set minimum width to prevent text from being cut off
        let minWidth = Math.max(textWidth, 60); // Minimum 60px width

        // Set the width with !important to override any CSS rules
        input.style.setProperty('width', minWidth + 'px', 'important');
      },
      setupInputWidthObserver(input) {
        // Create a MutationObserver to monitor changes in the input field's style
        this.inputWidthObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
              // If input field is empty and not being typed in, restore placeholder width
              if ((!input.value || input.value.length === 0) && !this.isUserTyping) {
                this.$nextTick(() => {
                  this.setWidthToPlaceholderWidth(input);
                });
              }
            }
          });
        });

        // Start observing the input element
        this.inputWidthObserver.observe(input, {
          attributes: true,
          attributeFilter: ['style']
        });
      },
      customNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return;
        if (option.translations) {
          return getLocalizedTranslation(option, this.language);
        }
        return option.name || option.id;
      },
      customGroupLabel(option) {
        return getLocalizedTranslation(option, this.language);
      },
      customGroupLabelById(id) {
        const data = this.getIdToDataMap[id];
        return this.customGroupLabel(data);
      },
      customGroupTooltipById(id) {
        const data = this.getIdToDataMap[id];
        const content = data.tooltip && data.tooltip[this.language];
        const tooltip = {
          content: content,
          distance: 5,
          delay: this.$helpTextDelay,
        };
        return tooltip;
      },
      /**
       * Cleans the label by removing leading special characters.
       *
       * @param {string} label - The label to clean.
       * @returns {string} The cleaned label.
       */
      cleanLabel(label) {
        return label.startsWith("⤷") ? label.slice(1).trim() : label.trim();
      },
      /**
       * Sets silent focus on input - cursor is placed but no focus styling is shown
       */
      setSilentFocus(input) {
        if (!input) return;
        
        this.isSilentFocus = true;
        
        // Apply silent styling before focusing to prevent flash
        input.classList.add('qpm_silent-focus');
        input.style.outline = 'none !important';
        input.style.border = '1px solid lightgrey !important';
        input.style.boxShadow = 'none !important';
        
        // Temporarily disable multiselect activation to prevent dropdown opening
        const multiselect = this.$refs.multiselect;
        const originalActivate =
          multiselect && typeof multiselect.activate === "function" ? multiselect.activate : null;
        if (multiselect) {
          multiselect.activate = () => {};
        }
        
        // Focus the input
        input.setAttribute('tabindex', '0');
        input.focus({ preventScroll: true });
        
        // Restore multiselect activation after a short delay
        setTimeout(() => {
          if (multiselect && originalActivate) {
            multiselect.activate = originalActivate;
          }
        }, 100);
        
        // Ensure dropdown is closed
        if (this.$refs.multiselect && this.$refs.multiselect.isOpen) {
          if (typeof this.$refs.multiselect.deactivate === "function") {
            this.$refs.multiselect.deactivate();
          }
        }
      },
      /**
       * Removes silent focus and allows normal focus behavior
       */
      removeSilentFocus(input) {
        if (!input) return;
        
        this.isSilentFocus = false;
        input.classList.remove('qpm_silent-focus');
        
        // Remove inline styles to allow normal CSS to take over
        input.style.removeProperty('outline');
        input.style.removeProperty('border');
        input.style.removeProperty('box-shadow');
      },
      /**
       * Handles focus events - distinguishes between programmatic and user-initiated focus
       */
      handleFocus(event) {
        const input = event.target;
        
        // If this is a silent focus, don't show focus styling or open dropdown
        if (this.isSilentFocus) {
          // Prevent multiselect from opening dropdown during silent focus
          setTimeout(() => {
            if (this.$refs.multiselect && this.$refs.multiselect.isOpen) {
              if (typeof this.$refs.multiselect.deactivate === "function") {
                this.$refs.multiselect.deactivate();
              }
            }
          }, 0);
          return;
        }
        
        // Normal focus behavior - silent focus should already be removed by handleClick if user clicked
        // Only remove silent focus here if it's keyboard navigation (not handled by click)
        if (this.isSilentFocus && !this.isMouseUsed) {
          this.removeSilentFocus(input);
        }
      },
      /**
       * Handles blur events
       */
      handleBlur(event) {
        const input = event.target;
        
        // Always remove silent focus on blur
        this.removeSilentFocus(input);
        
        // If input is empty, restore placeholder width
        if (!input.value || input.value.length === 0) {
          this.$nextTick(() => {
            this.setWidthToPlaceholderWidth(input);
          });
        }
      },
      /**
       * Handles click events - removes silent focus to allow normal dropdown behavior
       */
      handleClick(event) {
        const input = event.target;
        
        // If this is a silent focus, remove it immediately to allow dropdown opening
        if (this.isSilentFocus) {
          // Stop propagation to prevent any conflicts
          event.stopPropagation();
          this.removeSilentFocus(input);
          
          // Force dropdown to open after silent focus is removed
          this.$nextTick(() => {
            if (
              this.$refs.multiselect &&
              !this.$refs.multiselect.isOpen &&
              typeof this.$refs.multiselect.activate === "function"
            ) {
              this.$refs.multiselect.activate();
            }
          });
        }
      },

      /**
       * Handles keydown events - removes silent focus before character is processed
       */
      handleKeyDown(event) {
        // Only handle printable characters and common input keys
        const isPrintableKey = event.key.length === 1 || 
                               ['Backspace', 'Delete', 'Enter', 'Tab'].includes(event.key);
        
        if (this.isSilentFocus && isPrintableKey && event.key !== 'Tab') {
          const input = event.target;
          // Remove silent focus immediately before the character is processed
          this.removeSilentFocus(input);
          
          // For printable characters, ensure dropdown opens (only for dropdowns with topics)
          if (event.key.length === 1 && !this.shouldHideDropdownArrow) {
            this.$nextTick(() => {
              if (
                this.$refs.multiselect &&
                !this.$refs.multiselect.isOpen &&
                typeof this.$refs.multiselect.activate === "function"
              ) {
                this.$refs.multiselect.activate();
              }
            });
          }
        }
      },
      /**
       * Public method to set silent focus from parent component
       */
      setSilentFocusFromParent() {
        const input = this.$el?.querySelector('.multiselect__input');
        if (input) {
          this.setSilentFocus(input);
        }
      },
      /**
       * Disables multiselect's input handling for empty dropdowns
       * and replaces it with our own implementation
       */
      disableMultiselectInput(input) {
        // Instead of overriding multiselect methods, just disable the input field
        // and add our own event listeners with higher priority
        
        // Mark input field as disabled for multiselect
        input.setAttribute('data-multiselect-disabled', 'true');
        
        // Add our own event listeners with capture: true for highest priority
        input.addEventListener("input", this._handleEmptyDropdownInputBound, { capture: true });
        input.addEventListener("keydown", this._handleEmptyDropdownKeydownBound, { capture: true });
        input.addEventListener("focus", this._handleEmptyDropdownFocusBound, { capture: true });
        input.addEventListener("click", this._handleEmptyDropdownClickBound, { capture: true });
        
        // Let CSS handle styling - remove all inline styles
        input.style.removeProperty('width');
        input.style.removeProperty('display');
        input.style.removeProperty('visibility');
        input.style.removeProperty('opacity');
        input.style.removeProperty('max-width');
        input.style.removeProperty('min-width');
        
        // Disable multiselect's dropdown functionality for this instance
        this._isEmptyDropdown = true;
      },
      /**
       * Handles input events for empty dropdowns
       */
      handleEmptyDropdownInput(event) {
        // Stop all multiselect events
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        const currentValue = event.target.value;
        
        // Remove silent focus if active
        if (this.isSilentFocus) {
          this.removeSilentFocus(event.target);
        }
        
        // Update typing state
        this.isUserTyping = currentValue.length > 0;
        
        // Update multiselect's internal search value (important for functionality)
        if (this.$refs.multiselect) {
          this.$refs.multiselect.search = currentValue;
        }
        
        // Emit to parent (same as normal handleInputEvent)
        this.$emit("searchchange", currentValue, this.index);
        
        // Let CSS handle width - remove inline styles
        event.target.style.removeProperty('width');
        event.target.style.removeProperty('max-width');
        event.target.style.removeProperty('min-width');
      },
      /**
       * Handles keydown events for empty dropdowns
       */
      handleEmptyDropdownKeydown(event) {
        // Handle Enter key - trigger custom tag creation
        if (event.key === 'Enter') {
          event.stopPropagation();
          event.preventDefault();
          
          const currentValue = event.target.value;
          if (currentValue && currentValue.trim().length > 0) {
            // Trigger custom tag creation (same as normal multiselect)
            this.handleAddTag(currentValue.trim());
            // Clear input field
            event.target.value = '';
            if (this.$refs.multiselect) {
              this.$refs.multiselect.search = '';
            }
            this.isUserTyping = false;
          }
          return;
        }
        
        // Stop multiselect events for normal keys
        if (event.key.length === 1 || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.stopPropagation();
        }
        
        // Remove silent focus on first keypress
        if (this.isSilentFocus && event.key.length === 1) {
          this.removeSilentFocus(event.target);
        }
      },
      /**
       * Handles focus events for empty dropdowns
       */
      handleEmptyDropdownFocus(event) {
        event.stopPropagation();
      },
      /**
       * Handles click events for empty dropdowns
       */
      handleEmptyDropdownClick(event) {
        event.stopPropagation();
        
        // Remove silent focus if active
        if (this.isSilentFocus) {
          this.removeSilentFocus(event.target);
        }
      },
       /**
        * Restores multiselect's original functionality
        */
       restoreMultiselectInput(input) {
         // Remove our custom event listeners
         input.removeEventListener("input", this._handleEmptyDropdownInputBound, { capture: true });
         input.removeEventListener("keydown", this._handleEmptyDropdownKeydownBound, { capture: true });
         input.removeEventListener("focus", this._handleEmptyDropdownFocusBound, { capture: true });
         input.removeEventListener("click", this._handleEmptyDropdownClickBound, { capture: true });
         
         // Remove marker
         input.removeAttribute('data-multiselect-disabled');
         this._isEmptyDropdown = false;
       },
       updateAriaExpanded() {
        // Find the combobox element and update aria-expanded
        const combobox = this.$el.querySelector('[role="combobox"]');
        if (combobox) {
          combobox.setAttribute('aria-expanded', this.isDropdownOpen ? 'true' : 'false');
        }
      },
      fixAriaControls() {
        // Find the actual listbox element
        const listbox = this.$el.querySelector('ul[role="listbox"]');
        if (listbox) {
          // Get the actual ID from the listbox
          const actualId = listbox.id;
          
          // Find the combobox element and update its aria-controls and aria-expanded
          const combobox = this.$el.querySelector('[role="combobox"]');
          if (combobox && actualId) {
            combobox.setAttribute('aria-controls', actualId);
            combobox.setAttribute('aria-expanded', this.isDropdownOpen ? 'true' : 'false');
          }
        }
      },
      // New method for keyboard handling
      handleTagKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.handleTagClick(event);
        }
      },
    },
  };
</script>

