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
    <multiselect
      ref="multiselect"
      v-model="getStateCopy"
      class="qpm_dropDownMenu"
      :class="{ 'qpm_hideDropdownArrow': shouldHideDropdownArrow }"
      :aria-expanded="isDropdownOpen"
      :aria-label="placeholder"
      open-direction="bottom"
      track-by="name"
      label="name"
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
      @input="input"
      @close="close"
      @open="open"
    >
      <template slot="tag" slot-scope="triple">
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

      <template slot="option" slot-scope="props">
        <span
          v-if="!props.option.$groupLabel"
          :data-name="getHeader(props.option.name)"
          :option-id="props.option.id"
          :option-depth="props.option.subtopiclevel || 0"
          :maintopic="props.option.maintopic"
          :parent-id="props.option.maintopicIdLevel1"
          :grand-parent-id="props.option.maintopicIdLevel2"
          :subtopiclevel="props.option.subtopiclevel"
        />

        <span
          v-if="
            props.option.maintopic ||
            (props.option.maintopic && props.option.subtopiclevel !== null)
          "
          :class="{
            qpm_maintopicDropdown: props.option.maintopic === true,
            qpm_subtopicDropdown: props.option.subtopiclevel === 1,
          }"
        >
          <i v-if="maintopicToggledMap[props.option.id]" class="bx bx-chevron-down" />
          <i v-else class="bx bx-chevron-right" />
        </span>

        <span
          v-if="!props.option.maintopic"
          :class="{
            qpm_hidden: !isContainedInList(props),
            qpm_shown: props.option.$groupLabel,
            qpm_maintopicDropdown: props.option.maintopic === true,
            qpm_subtopicDropdown: props.option.subtopiclevel === 1,
            qpm_subtopicDropdownLevel2: props.option.subtopiclevel === 2,
            [props.option.class]: props.option.class !== undefined,
          }"
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
          class="bx bx-info-circle qpm_groupLabel"
          style="cursor: help; font-weight: 200; margin-left: 10px"
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
            offset: 5,
            delay: $helpTextDelay,
            hideOnTargetClick: false,
          }"
          class="bx bx-info-circle qpm_entryName"
          style="cursor: help; font-weight: 200; margin-left: -5px"
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
              offset: 5,
              delay: $helpTextDelay,
              hideOnTargetClick: false,
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
              offset: 5,
              delay: $helpTextDelay,
              hideOnTargetClick: false,
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
              offset: 5,
              delay: $helpTextDelay,
              hideOnTargetClick: false,
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

      <span slot="noResult">
        {{ shouldHideDropdownArrow ? '' : getNoResultString }}
      </span>
    </multiselect>
    
    <!-- Custom LoadingSpinner to replace vue-multiselect's spinner -->
    <loading-spinner 
      v-if="isLoading" 
      :loading="isLoading" 
      class="qpm_multiselect_custom_spinner"
      :size="30"
      style="display: inline-block"
    />
  </div>
</template>

<script>
  import Multiselect from "vue-multiselect";
  import DropdownTag from "@/components/DropdownTag.vue";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { topicLoaderMixin } from "@/mixins/topicLoaderMixin.js";
  import { filtrer } from "@/assets/content/qpm-content-filters.js";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { searchTranslationPrompt } from "@/assets/content/qpm-open-ai-translation-prompts.js";
  import { getPromptForLocale } from "@/utils/qpm-open-ai-prompts-helpers.js";
  import { customInputTagTooltip } from "@/utils/qpm-content-helpers.js";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  export default {
    name: "DropdownWrapper",
    components: {
      Multiselect,
      DropdownTag,
      LoadingSpinner,
    },
    mixins: [appSettingsMixin, topicLoaderMixin],
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
          // Check parent ID match (for nested items)
          if (item.maintopicIdLevel1 && this.hideTopics.includes(item.maintopicIdLevel1)) {
            return true;
          }
          // Check grandparent ID match (for deeply nested items)
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

          const sectionCopy = JSON.parse(JSON.stringify(section));
          
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
        .filter(section => section !== null) // Remove hidden sections
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

          if (a.ordering && a.ordering[lang] != null && (!b.ordering || b.ordering[lang] == null)) {
            return -1; // a is ordered and b is not -> a first
          }
          if (b.ordering && b.ordering[lang] != null && (!a.ordering || a.ordering[lang] == null)) {
            return 1; // b is ordered and a is not -> b first
          }

          if (a.ordering && a.ordering[lang] != null) {
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

        let data = JSON.parse(JSON.stringify(this.shownSubjects));
        
        // Filter out null/undefined items
        data = data.filter(item => item != null);

        for (let i = 0; i < data.length; i++) {
          if (!data[i]) continue;
          
          let groupName = null;
          if (data[i]["groups"] != null) {
            groupName = "groups";
          } else if (data[i]["choices"] != null) {
            groupName = "choices";
          } else {
            continue;
          }

          // Filter out null/undefined items before sorting
          data[i][groupName] = data[i][groupName].filter(item => item != null);
          data[i][groupName].sort(sortByPriorityOrName); // Sort categories in groups
        }

        return data;
      },
      getIdToDataMap: function () {
        var dataMap = {};
        for (let i = 0; i < this.data.length; i++) {
          const group = this.data[i];
          dataMap[group.id] = group;

          var groupName = this.getGroupPropertyName(group);
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
        handler(newVal) {
          this.$nextTick(() => {
            // Update data without calling refresh
            this.updateSortedSubjectOptions();
          });
        }
      },
      placeholder: {
        immediate: true,
        handler(newVal) {
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
          if (newVal && this.$refs.multiselect && this.$refs.multiselect.isOpen && !this.isUserTyping) {
            // Force close dropdown when silent focus is activated (but not when user is typing)
            this.$refs.multiselect.deactivate();
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
        input.addEventListener('focus', this.addKeyboardFocus);
        input.addEventListener('blur', this.removeKeyboardFocus);
        input.addEventListener('focus', this.handleFocus);
        input.addEventListener('blur', this.handleBlur);
        input.addEventListener('click', this.handleClick, { capture: true });
        input.addEventListener('keydown', this.handleKeyDown.bind(this));
        
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
            this.$refs.multiselect.deactivate();
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
    beforeDestroy() {
      this.isUserTyping = false;
      document.removeEventListener("mousedown", this.setMouseUsed);
      document.removeEventListener("keydown", this.resetMouseUsed);

      const input = this.$el.querySelector('.multiselect__input');
      if (input) {
        input.removeEventListener('focus', this.addKeyboardFocus);
        input.removeEventListener('blur', this.removeKeyboardFocus);
        input.removeEventListener('focus', this.handleFocus);
        input.removeEventListener('blur', this.handleBlur);
        input.removeEventListener('click', this.handleClick);
        input.removeEventListener('keydown', this.handleKeyDown);
        
        // Cleanup for empty dropdowns
        if (this._isEmptyDropdown && input.getAttribute('data-multiselect-disabled') === 'true') {
          this.restoreMultiselectInput(input);
        }
      }
      
      // Clean up observer
      if (this.inputWidthObserver) {
        this.inputWidthObserver.disconnect();
        this.inputWidthObserver = null;
      }
    },
    methods: {
      /**
       * Tjekker om et searchString scope har valid indhold
       * @param {Object} option - Option objektet fra dropdown
       * @param {string} scope - Scope navnet ('narrow', 'normal' eller 'broad')
       * @returns {boolean} True hvis scope har indhold, false ellers
       */
      hasScopeContent(option, scope) {
        // Tjek om option har searchStrings
        if (!option || !option.searchStrings) {
          return false;
        }
        
        // Tjek om scope property eksisterer
        if (!option.searchStrings.hasOwnProperty(scope)) {
          return false;
        }
        
        const searchString = option.searchStrings[scope];
        
        // Tjek om searchString er et tomt array
        if (Array.isArray(searchString) && searchString.length === 0) {
          return false;
        }
        
        // Tjek om searchString array har indhold
        if (Array.isArray(searchString)) {
          const value = searchString[0];
          return value != null && value !== '';
        }
        
        // Hvis det ikke er et array, tjek om det har værdi
        return searchString != null && searchString !== '';
      },
      /**
       * Tæller antal scopes med valid indhold
       * @param {Object} option - Option objektet fra dropdown
       * @returns {number} Antal scopes med indhold
       */
      countValidScopes(option) {
        let count = 0;
        if (this.hasScopeContent(option, 'narrow')) count++;
        if (this.hasScopeContent(option, 'normal')) count++;
        if (this.hasScopeContent(option, 'broad')) count++;
        return count;
      },
      /**
       * Tjekker om knapperne skal vises (kun hvis der er 2 eller flere scopes)
       * @param {Object} option - Option objektet fra dropdown
       * @returns {boolean} True hvis knapper skal vises
       */
      shouldShowScopeButtons(option) {
        return this.countValidScopes(option) >= 2;
      },
      onSelectedChange(newValue, oldValue) {
        console.log('onSelectedChange called', {
          oldLength: oldValue.length,
          newLength: newValue.length
        });
        
        if (oldValue.length > newValue.length) {
          // Find the tag that was removed
          const removedTag = oldValue.find((tag) => !newValue.includes(tag));
          if (removedTag) {
            console.log('Tag removed:', removedTag.name);
            removedTag.scope = "normal";
            // Emit updateScope asynchronously to avoid blocking UI
            this.$nextTick(() => {
              this.$emit("updateScope", removedTag, "normal");
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
        
        console.log('onSelectedChange finished');
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
          input.addEventListener("input", this.handleInputEvent.bind(this));
          input.addEventListener("keydown", this.handleKeyDown.bind(this));
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
        element.removeEventListener("keypress", self.handleStopEnterOnGroups, true);
        element.addEventListener("keypress", self.handleStopEnterOnGroups, true);

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

        this.$refs.multiselect.pointer = 0; // Set highlight to first item to prevent exceptions.
        for (let key in this.maintopicToggledMap) {
          this.maintopicToggledMap[key] = false;
        }
      },
      input(value) {
        if (!value || value.length === 0) {
          this.clearShownItems();
          this.$emit("input", value, this.index);
          return;
        }
        // Clone the last element to avoid modifying it directly in the data source
        let elem = { ...value[value.length - 1] };
        let lg = this.language; // Use this.language to get the current language code

        if (elem.maintopic) {
          //toggle the maintopic
          this.maintopicToggledMap = {
            ...this.maintopicToggledMap,
            [elem.id]: !this.maintopicToggledMap[elem.id],
          };
          value.pop();
        }

        // Only check for '-' in the current language
        if (!elem.isCustom && elem.translations[lg] && elem.translations[lg].startsWith("-")) {
          // Only modify translations for the current language
          let updatedTranslations = { ...elem.translations };
          updatedTranslations[lg] = elem.translations[lg].slice(1);

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
            this.$refs.multiselect.deactivate();
          }
        }
      },
      close() {
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
        this.$refs.multiselect.pointer = -1;
        
        // Update dropdown state for aria-expanded
        this.isDropdownOpen = true;
        
        // Update aria-expanded directly on DOM
        this.$nextTick(() => {
          this.updateAriaExpanded();
        });
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
      showOrHideElements() {
        const element = this.$refs.selectWrapper;
        if (!element) return; // Safety check
        
        if (!this.isGroup) {
          // Here we are dealing with filters so we omit the check on groupname
          const entries = element.querySelectorAll("[data-name]");
          // Use requestAnimationFrame for better performance with many elements
          if (entries.length > 50) {
            requestAnimationFrame(() => {
              entries.forEach((entry) => {
                const parent = entry.parentNode.parentNode;
                const parentId = entry.getAttribute("parent-id");
                const grandParentId = entry.getAttribute("grand-parent-id");

                // Element should be hidden if its parent or grandparent is collapsed
                // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
                const shouldShow =
                  (!parentId || this.maintopicToggledMap[parentId]) &&
                  (!grandParentId || this.maintopicToggledMap[grandParentId]);

                parent.classList.toggle("qpm_shown", !shouldShow);
              });
            });
          } else {
            entries.forEach((entry) => {
              const parent = entry.parentNode.parentNode;
              const parentId = entry.getAttribute("parent-id");
              const grandParentId = entry.getAttribute("grand-parent-id");

              // Element should be hidden if its parent or grandparent is collapsed
              // Treat undefined as false (collapsed) since maintopics start collapsed until clicked
              const shouldShow =
                (!parentId || this.maintopicToggledMap[parentId]) &&
                (!grandParentId || this.maintopicToggledMap[grandParentId]);

              parent.classList.toggle("qpm_shown", !shouldShow);
            });
          }
          return;
        }

        const entries = element.querySelectorAll("[data-name]");
        // Use requestAnimationFrame for better performance with many elements
        if (entries.length > 50) {
          requestAnimationFrame(() => {
            entries.forEach((entry) => {
              const groupName = entry.getAttribute("data-name");
              const parent = entry.parentNode.parentNode;

              const parentId = entry.getAttribute("parent-id");
              const grandParentId = entry.getAttribute("grand-parent-id");

              const shouldShow =
                this.expandedOptionGroupName !== groupName ||
                (parentId && !this.maintopicToggledMap[parentId]) ||
                (grandParentId && !this.maintopicToggledMap[grandParentId]);

              parent.classList.toggle("qpm_shown", shouldShow);
            });
          });
        } else {
          entries.forEach((entry) => {
            const groupName = entry.getAttribute("data-name");
            const parent = entry.parentNode.parentNode;

            const parentId = entry.getAttribute("parent-id");
            const grandParentId = entry.getAttribute("grand-parent-id");

            const shouldShow =
              this.expandedOptionGroupName !== groupName ||
              (parentId && !this.maintopicToggledMap[parentId]) ||
              (grandParentId && !this.maintopicToggledMap[grandParentId]);

            parent.classList.toggle("qpm_shown", shouldShow);
          });
        }
      },
      /**
       * Updates visibility of options contained in an optiongroup.
       *
       * @param {Array} selectedOptionIds - The list of option IDs that are selected.
       * @param {Array} optionsInOptionGroup - The list of options in the group.
       */
      updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup) {
        this.showOrHideElements();
        this.updateExpandedGroupHighlighting();

        // Sets to keep track of depths and parent IDs
        const selectedDepths = new Set(); // Contains the depth levels that have a selected option
        const parentIdsToShow = new Set();
        const grandParentIdsToShow = new Set();

        const optionsInGroupIds = new Set(optionsInOptionGroup.map((option) => option.id));

        selectedOptionIds.forEach((id) => {
          // Check if the selected option is in the optiongroup
          const option = optionsInOptionGroup.find((option) => option.id === id);
          if (option) {
            selectedDepths.add(option.depth);
            if (option.parentId) {
              parentIdsToShow.add(option.parentId);
              // Expand the parent maintopic
              this.maintopicToggledMap[option.parentId] = true;
            }
            if (option.grandParentId) {
              // Expand the grandparent maintopic
              grandParentIdsToShow.add(option.grandParentId);
              this.maintopicToggledMap[option.grandParentId] = true;
            }
          }
        });

        this.showElementsByOptionIds(selectedOptionIds, optionsInGroupIds);
        this.showElementsByDepths(selectedDepths, optionsInGroupIds);
        this.showElementsByOptionIds(Array.from(parentIdsToShow), optionsInGroupIds);
        this.showElementsByOptionIds(Array.from(grandParentIdsToShow), optionsInGroupIds);
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
        if (this.isGroup) {
          this.topics.forEach((topic) => {
            if (topic.groupname === groupName) {
              topic.groups.forEach((group) => {
                result.push({
                  id: group.id,
                  name: group.name,
                  isBranch: group.maintopic || null,
                  depth: group.subtopiclevel || 0, // is a base topic if 0
                  parentId: group.maintopicIdLevel1 || null,
                  grandParentId: group.maintopicIdLevel2 || null,
                });
              });
            }
          });
        } else {
          // For the filters the naming is different so we need to handle it differently
          filtrer.forEach((filter) => {
            if (filter.name === groupName) {
              filter.choices.forEach((choice) => {
                result.push({
                  id: choice.id,
                  name: choice.name,
                  isBranch: choice.maintopic || null,
                  depth: choice.subtopiclevel || 0, // is a base topic if 0
                  parentId: choice.maintopicIdLevel1 || null,
                  grandParentId: choice.maintopicIdLevel2 || null,
                });
              });
            }
          });
        }
        return result;
      },
      /**
       * Utility method to get the children options for a maintopic
       * @param {String} maintopicId The maintopic ID
       * @param {Boolean} isFilter Whether the maintopic is a filter or not
       * @returns list of children options
       */
      getMaintopicChildren(maintopicId, isFilter = false) {
        const children = [];

        if (isFilter) {
          filtrer.forEach((filter) => {
            filter.choices.forEach((choice) => {
              if (
                choice.maintopicIdLevel1 === maintopicId ||
                choice.maintopicIdLevel2 === maintopicId
              ) {
                children.push(choice);
              }
            });
          });
          return children;
        }
        this.topics.forEach((topic) => {
          topic.groups.forEach((group) => {
            if (
              group.maintopicIdLevel1 === maintopicId ||
              group.maintopicIdLevel2 === maintopicId
            ) {
              children.push(group);
            }
          });
        });

        return children;
      },

      /**
       * @param optionGroupId {String} - The Id (eg. S00) of the optiongroup to get siblings for
       * @param baseTopic {Boolean} - Whether the topic is a base topic or not
       * @param depth {Number} - The depth level to retrieve options from
       * @param isFilter {Boolean} - Whether the options are filters or not
       */
      getSiblings(optionGroupId, baseTopic, depth, isFilter = false) {
        const siblings = [];

        if (isFilter) {
          let _filtrer;
          if (optionGroupId !== null) {
            _filtrer = filtrer.filter((filter) => filter.id === optionGroupId);
          }
          _filtrer.forEach((filter) => {
            filter.choices.forEach((choice) => {
              if (choice.subtopiclevel === depth) {
                siblings.push(choice);
              }
            });
          });

          // Case: the topic is baseTopic since it's at depth zero
          if (baseTopic && depth === 0) {
            _filtrer.forEach((filter) => {
              filter.choices.forEach((choice) => {
                if (!choice.maintopic) siblings.push(choice);
              });
            });
          }
          return siblings;
        }

        let _topics;
        if (optionGroupId !== null) {
          _topics = this.topics.filter((filter) => filter.id === optionGroupId);
        }

        // Case: the topic is not baseTopic since it's at a depth greater than zero
        _topics.forEach((topic) => {
          topic.groups.forEach((group) => {
            if (group.subtopiclevel === depth) {
              siblings.push(group);
            }
          });
        });

        // Case: the topic is baseTopic since it's at depth zero
        if (baseTopic && depth === 0) {
          _topics.forEach((topic) => {
            topic.groups.forEach((group) => {
              if (!group.maintopic) siblings.push(group);
            });
          });
        }

        return siblings;
      },

      /**
       * Retrieves options at a specific depth.
       * If optionGroupId is provided, filters the options accordingly.
       * If includeChildren is true, includes children of maintopic options.
       *
       * @param {number} depth - The depth level to retrieve options from.
       * @param {string} [optionGroupId=null] - (Optional) The group ID to filter options.
       * @param {boolean} [includeChildren=false] - (Optional) Whether to include maintopic children.
       * @param {boolean} [baseTopic=false] - (Optional) Whether to include siblings for base topics.
       * @param {boolean} [isFilter=false] - (Optional) Whether the options are filters or not.
       * @returns {Array} - The filtered and possibly expanded options.
       */
      getOptionsAtDepth(
        depth,
        optionGroupId = null,
        includeChildren = false,
        baseTopic = false,
        isFilter = false
      ) {
        let siblings = this.getSiblings(optionGroupId, baseTopic, depth, isFilter);

        // Case: Include children where a maintopic is toggled
        if (includeChildren) {
          const childrenOptions = [];

          siblings.forEach((option) => {
            if (option.maintopic) {
              const isMaintopicToggled = this.maintopicToggledMap[option.id];
              if (!isMaintopicToggled) {
                const children = this.getMaintopicChildren(option.id, isFilter);
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
       * @param filter {Boolean} - Whether the options are filters or not
       */
      getMaintopics(optionGroupId, filter = false) {
        let maintopics = [];
        if (filter) {
          const _filtrer = filtrer.find((filter) => filter.id === optionGroupId);

          if (_filtrer && _filtrer.choices) {
          _filtrer.choices.forEach((group) => {
            if (group.maintopic) {
              maintopics.push(group);
            }
          });
          }
          return maintopics;
        }
        const _topics = this.topics.find((topic) => topic.id === optionGroupId);

        if (_topics && _topics.groups) {
        _topics.groups.forEach((group) => {
          if (group.maintopic) {
            maintopics.push(group);
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
       * @param {Boolean} isFilter - Whether the options are filters or not
       */
      areMaintopicsToggled(optionGroupId, getToggled = true, isFilter = false) {
        // find the optiongroup
        const maintopics = this.getMaintopics(optionGroupId, isFilter);

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
          (option) => option.name === currentSubject.name
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
        let target = event.target;

        // Check if the click is on the optiongroup name or elsewhere within the multiselect__option__option--group element
        if (target.classList.contains("qpm_groupLabel")) {
          target = target.parentElement;
        }

        const optionGroupName = target.getElementsByClassName("qpm_groupLabel")[0].textContent;

        if (target.classList.contains("multiselect__option--group")) {
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
            const optionsInOptionGroup = this.getOptionsFromOptionsGroupName(optionGroupName);

            if (selectedOptionIds.length <= 0) {
              this.showOrHideElements();
              this.updateExpandedGroupHighlighting();
            } else {
              // Only show the tags in the clicked group
              this.updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup);
            }
          }
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
        const optionsInOptionGroup = this.getOptionsFromOptionsGroupName(optionGroupName);

        if (!optionGroupName && !optionGroupId) {
          const filterCategoryId = this.selected[0]?.id?.substring(0, 3);

          const filterCategoryName = filtrer.find((filter) => filter.id === filterCategoryId).name;
          const optionsInOptionGroupFilters =
            this.getOptionsFromOptionsGroupName(filterCategoryName);

          const filterIds = this.selected.map((option) => option.id);
          this.updateOptionGroupVisibility(filterIds, optionsInOptionGroupFilters);
        }

        if (selectedOptionIds.length <= 0) {
          this.showOrHideElements();
          this.updateExpandedGroupHighlighting();
        } else {
          // Only show the tags in the clicked group
          this.updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup);
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
          if (!this.$refs.multiselect || !this.$refs.multiselect.filteredOptions) {
            return;
          }

          const filteredOptions = this.$refs.multiselect.filteredOptions;
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
            this.$refs.multiselect.pointer = matchingIndex;
            
            // Scroll element into view
            this.$nextTick(() => {
              this.scrollToFocusedSubject();
            });
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
        if (this.$refs.multiselect.pointer < 0) {
          // If there is no hovered element then highlight the first on as with old behavior
          // setting it to zero enabels the first element to be highlighted on enter after pasting text
          this.$refs.multiselect.pointer = 0;
        }
        // If event is press by enter (charCode 13)
        if (event.charCode == 13) {
          if (event.target.classList.contains("multiselect__input")) {
            const element = this.$refs.selectWrapper;
            target = element.getElementsByClassName("multiselect__option--highlight")[0];
            if (target == null || target.classList.contains("multiselect__option--group")) {
              event.stopPropagation();
              if (target == null) return;

              var focusedGroup = target.querySelector(".qpm_groupLabel").textContent;

              if (focusedGroup === this.expandedOptionGroupName) {
                this.expandedOptionGroupName = "";
                this.updateExpandedGroupHighlighting();
              } else {
                this.expandedOptionGroupName = focusedGroup;
                this.updateExpandedGroupHighlighting();
              }
            } else if (!this.focusByHover && this.focusedButtonIndex >= 0) {
              var dropdownRef = this.$refs.multiselect;

              // Nothing currently in focus, and therefore nothing left to do.
              if (dropdownRef.pointer < 0) {
                event.stopPropagation();
                return;
              }

              // Find the button corresponding to the one in focus
              var target = dropdownRef.$refs.list.getElementsByClassName(
                "multiselect__option--highlight"
              )[0];
              var button = target.getElementsByClassName("qpm_ButtonColumnFocused")[0];

              // If no scope buttons exists or none are currently in focus
              // then let the default handeling occur via the input method.
              if (!button) return;

              event.stopPropagation();
              
              // Store current focus state before clicking
              var currentFocusedButtonIndex = this.focusedButtonIndex;
              var currentPointer = dropdownRef.pointer;
              var currentFocusByHover = this.focusByHover;
              
              button.click();
              
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
        var tagText = event.target.textContent;

        if (
          tagText.startsWith(this.getString("manualInputTerm")) ||
          tagText.startsWith(this.getString("manualInputTermTranslated"))
        ) {
          this.expandedOptionGroupName = "";
          this.updateExpandedGroupHighlighting();
        }
        this.setMouseUsed();
        event.stopPropagation();
        
        // Sikkerhedstjek for at search ref eksisterer
        if (this.$refs.multiselect && this.$refs.multiselect.$refs.search) {
          this.$refs.multiselect.$refs.search.focus();
        }
      },
      handleScopeButtonClick(item, state, event) {
        console.log('handleScopeButtonClick called', {
          itemName: item.name,
          state: state,
          currentScope: item.scope,
          focusedButtonIndex: this.focusedButtonIndex,
          focusByHover: this.focusByHover,
          selectedLength: this.selected.length
        });

        this.$emit("updateScope", item, state, this.index);
        item.scope = state;

        // Only close dropdown on actual mouse clicks, not on programmatic clicks from Enter key
        // Use multiple checks to ensure this is a real mouse click:
        // 1. event.isTrusted - true for real user events, false for programmatic events
        // 2. this.isMouseUsed - tracks if last interaction was via mouse
        // 3. event.detail > 0 - mouse clicks have detail > 0, programmatic clicks have detail = 0
        if (event.isTrusted && this.isMouseUsed && event.detail > 0) {
        this.$refs.multiselect.deactivate();
        }

        //Check if just added
        if (this.tempList.indexOf(item) >= 0) {
          console.log('Item was just added to tempList');
          event.stopPropagation();
          return;
        }
        //Check if added previously
        for (let i = 0; i < this.selected.length; i++) {
          if (this.selected[i].name == item.name) {
            console.log('Item was already in selected list');
            event.stopPropagation();
            return;
          }
        }
        
        console.log('Item not found in selected or tempList - will be added');
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
        var tag;
        if (this.searchWithAI) {
          this.isLoading = true;
          this.$emit("translating", true, this.index);

          // close the multiselect dropdown
          this.$refs.multiselect.deactivate();
          //setTimeout is to resolve the tag placeholder before starting to translate
          await new Promise((resolve) => setTimeout(resolve, 10));
          let translated = await this.translateSearch(newTag);
          tag = {
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

          this.$refs.multiselect.deactivate();
          // setTimeout is to resolve the tag placeholder before starting to translate
          // Without this the dropdown will hide category groups when adding a new tag
          await new Promise((resolve) => setTimeout(resolve, 20));
          tag = {
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
      },
      /**
       * This is the handler for the custom tag update event.
       * A Custom tag is a tag that is not part of the dropdown.
       * Can be AI translated or not
       * @param oldTag text of the tag to be updated
       * @param newTag text of the new tag
       */
      handleUpdateCustomTag(oldTag, newTag) {
        var tagIndex = this.selected.findIndex(function (e) {
          return oldTag == e;
        });
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
          event.target.parentNode.click();
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
        var subject = this.$refs.multiselect.$refs.list.querySelector(
          ".multiselect__option--highlight"
        );
        if (!subject) return;

        var isFocusVissible = this.isSubjectVissible(subject);
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
        var dropdownRef = this.$refs.multiselect;

        // Set focused column to normal if not set
        if (this.focusedButtonIndex < 0 || this.focusByHover) {
          this.focusedButtonIndex = 1; // index 1 is assumed to be the middle/default index
          this.focusByHover = false;
        }

        if (this.isUserTyping) {
          dropdownRef.pointer += 1;
          return;
        }

        // No element selected, just select first
        if (dropdownRef.pointer < 0) {
          dropdownRef.pointer = 0;
          return;
        }

        var currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];

        var isGroup = currentSubject["$groupLabel"] != null;
        var isMaintopic = currentSubject.maintopic;
        var isCurrentExpandedGroup = false;
        var navDistance;
        var subject;

        // Logic for navigating over the topic groups
        if (!isGroup && isMaintopic) {
          var currentSubjectOptionGroupId = currentSubject.id.substring(0, 3);
          const isFilter = currentSubjectOptionGroupId.startsWith("L");
          // Check if the ID of the currentSubject is a key in maintopicToggledMap
          const isMaintopicToggled = this.maintopicToggledMap[currentSubject.id];

          // If the option--group is not expanded we set navDistance to amount of non visible children
          if (!isMaintopicToggled) {
            var maintopicChildren = this.getMaintopicChildren(currentSubject.id, isFilter);
            dropdownRef.pointer += maintopicChildren.length + 1;
            return;
          }
        }

        // Logic for navigating over the topic (dark blue background)
        if (isGroup) {
          var label = this.customGroupLabelById(currentSubject.$groupLabel);
          subject = this.getSortedSubjectOptions.find(function (e) {
            return e.id === currentSubject.$groupLabel;
          });
          isCurrentExpandedGroup = label !== this.expandedOptionGroupName;
        } else {
          subject = currentSubject;
        }

        if (isGroup && isCurrentExpandedGroup) {
          var groupPropertyName = this.getGroupPropertyName(subject);
          navDistance = subject[groupPropertyName].length + 1;
        } else {
          navDistance = 1;
        }

        if (dropdownRef.pointer + navDistance >= dropdownRef.filteredOptions.length) {
          return;
        }

        dropdownRef.pointer += navDistance;

        // Scroll to see element if needed
        var self = this;
        this.$nextTick(function () {
          self.scrollToFocusedSubject();
        });
      },
      navUp() {
        var dropdownRef = this.$refs.multiselect;

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

        var currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];
        
        // Check if we're navigating up from a collapsed maintopic's children (works for both topics and filters)
        const itemAbove = dropdownRef.filteredOptions[dropdownRef.pointer - 1];
        if (itemAbove && !itemAbove["$groupLabel"] && itemAbove.maintopic) {
          var currentSubjectOptionGroupId = itemAbove.id.substring(0, 3);
          const isFilter = currentSubjectOptionGroupId.startsWith("L");
          const isMaintopicToggled = this.maintopicToggledMap[itemAbove.id];

          // If the maintopic above is not expanded, we need to jump over all its hidden children
          if (!isMaintopicToggled) {
            var maintopicChildren = this.getMaintopicChildren(itemAbove.id, isFilter);
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

        var isGroup = currentSubject["$groupLabel"] != null;
        var navDistance = 1;

        // Logic for navigating over the topic groups
        if (!isGroup) {
          var currentSubjectOptionGroupId = currentSubject.id.substring(0, 3);
          const isFilter = currentSubjectOptionGroupId.startsWith("L");

          var optionsAtDepth = this.getOptionsAtDepth(
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
              var maintopicChildren = this.getMaintopicChildren(itemAbove.id, isFilter);
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

            let siblings = this.getOptionsAtDepth(
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
                var parentChildren = this.getMaintopicChildren(
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
          var groupIndex = this.getSortedSubjectOptions.findIndex(function (e) {
            return e.id === currentSubject.$groupLabel;
          });

          if (groupIndex > 0) {
            var groupAbove = this.getSortedSubjectOptions[groupIndex - 1];
            var groupAboveLabel = this.customGroupLabel(groupAbove);

            if (groupAboveLabel !== this.expandedOptionGroupName) {
              var groupPropertyName = this.getGroupPropertyName(groupAbove);
              navDistance = groupAbove[groupPropertyName].length + 1;
            }
          }
        }

        dropdownRef.pointer -= navDistance;

        // Scroll to see element if needed
        var self = this;
        this.$nextTick(function () {
          self.scrollToFocusedSubject();
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
        if (props.option && props.option.name && this.selected) {
          for (let i = 0; i < this.selected.length; i++) {
            if (this.selected[i].name == props.option.name) {
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
        return this.hideTopics.indexOf(topicId) != -1;
      },
      isSubjectVissible(subject) {
        var subjectRect = subject.getBoundingClientRect();

        var viewHeight = window.innerHeight || document.documentElement.clientHeight;

        var isSubjectVissible = subjectRect.top >= 0 && subjectRect.bottom <= viewHeight;
        return isSubjectVissible;
      },
      updateExpandedGroupHighlighting() {
        // Safety check
        if (!this.$refs.multiselect || !this.$refs.multiselect.$refs.list) return;
        
        var listItems = this.$refs.multiselect.$refs.list;

        // Remove highlighting due to group being open from all groups
        let itemsToUnHighlight = listItems.querySelectorAll(".qpm_groupExpanded");

        // Use forEach for better performance than for loop
        itemsToUnHighlight.forEach(item => {
          item.classList.remove("qpm_groupExpanded");
        });

        if (this.expandedOptionGroupName == "") return;

        // Add highlighting due to group being open
        var expandedElement = listItems.querySelector(
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
        var localePrompt = getPromptForLocale(searchTranslationPrompt, "dk");

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
            const data = await response.json();
            throw Error(JSON.stringify(data));
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
        for (const topic of this.topics) {
          if (topic.groupname === groupname) {
            return topic.id;
          }
        }
        return null;
      },
      /**
       * Gets the group name for a given item.
       * Needed since we operate with two different sets of naming.
       * For filters we have 'choices' and for topics we have 'groups'.
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
            const currentLabel = this.cleanLabel(i.translations[language]);
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
            if (this.data[i].groups[j].name == name) {
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
        var dropdownRef = this.$refs.multiselect;
        var isWritingSearch = dropdownRef.search.length > 0;

        var hasFocusedSubject = isWritingSearch
          ? dropdownRef.pointer >= 1
          : dropdownRef.pointer >= 0;

        return hasFocusedSubject && !this.focusByHover;
      },
      getButtonColor(props, scope, index) {
        let classes = [];
        if (scope == "narrow") {
          classes.push(this.qpmButtonColor1);
        }
        if (!scope || scope == "normal") {
          classes.push(this.qpmButtonColor2);
        }
        if (scope == "broad") {
          classes.push(this.qpmButtonColor3);
        }

        // Set class to distinguish the collum currently in 'focus' for
        // selection via keyboard. This class together with the
        // multiselect__option--highlight class defines the highlighted button.
        if (!this.focusByHover && index === this.focusedButtonIndex) {
          classes.push("qpm_ButtonColumnFocused");
        }

        if (props.option && props.option.name && this.selected) {
          for (let i = 0; i < this.selected.length; i++) {
            if (this.selected[i].name == props.option.name) {
              if (this.selected[i].scope == scope) classes.push("selectedButton");
              break;
            }
          }
        }
        return classes;
      },
      getString(string) {
        const lg = this.language;
        if (!messages[string]) {
          console.warn(`Missing translation key: ${string}`);
          return string;
        }
        let constant = messages[string][lg];
        return constant != undefined ? constant : messages[string]["dk"];
      },
      getGroupPropertyName(group) {
        if (group.groups != undefined) {
          return "groups";
        } else if (group.choices != undefined) {
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
        if (!option.name && !option.groupname) return;
        let constant;
        if (option.translations) {
          const lg = this.language;
          constant =
            option.translations[lg] != undefined
              ? option.translations[lg]
              : option.translations["dk"];
        } else {
          constant = option.name;
        }
        return constant;
      },
      customGroupLabel(option) {
        if (!option.translations) return;
        const lg = this.language;
        let constant = option.translations[lg];
        return constant != undefined ? constant : option.translations["dk"];
      },
      customGroupLabelById(id) {
        var data = this.getIdToDataMap[id];
        return this.customGroupLabel(data);
      },
      customGroupTooltipById(id) {
        const data = this.getIdToDataMap[id];
        const content = data.tooltip && data.tooltip[this.language];
        const tooltip = {
          content: content,
          offset: 5,
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
        const originalActivate = this.$refs.multiselect.activate;
        this.$refs.multiselect.activate = () => {};
        
        // Focus the input
        input.setAttribute('tabindex', '0');
        input.focus({ preventScroll: true });
        
        // Restore multiselect activation after a short delay
        setTimeout(() => {
          this.$refs.multiselect.activate = originalActivate;
        }, 100);
        
        // Ensure dropdown is closed
        if (this.$refs.multiselect && this.$refs.multiselect.isOpen) {
          this.$refs.multiselect.deactivate();
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
              this.$refs.multiselect.deactivate();
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
            if (this.$refs.multiselect && !this.$refs.multiselect.isOpen) {
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
          
          // For printable characters, ensure dropdown opens (kun for dropdowns med topics)
          if (event.key.length === 1 && !this.shouldHideDropdownArrow) {
            this.$nextTick(() => {
              if (this.$refs.multiselect && !this.$refs.multiselect.isOpen) {
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
        input.addEventListener("input", this.handleEmptyDropdownInput.bind(this), { capture: true });
        input.addEventListener("keydown", this.handleEmptyDropdownKeydown.bind(this), { capture: true });
        input.addEventListener("focus", this.handleEmptyDropdownFocus.bind(this), { capture: true });
        input.addEventListener("click", this.handleEmptyDropdownClick.bind(this), { capture: true });
        
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
         input.removeEventListener("input", this.handleEmptyDropdownInput, { capture: true });
         input.removeEventListener("keydown", this.handleEmptyDropdownKeydown, { capture: true });
         input.removeEventListener("focus", this.handleEmptyDropdownFocus, { capture: true });
         input.removeEventListener("click", this.handleEmptyDropdownClick, { capture: true });
         
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
      // Ny method til keyboard handling
      handleTagKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.handleTagClick(event);
        }
      },
    },
  };
</script>
