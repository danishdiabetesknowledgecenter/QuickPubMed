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
      open-direction="bottom"
      track-by="name"
      label="name"
      select-label=""
      deselect-label=""
      selected-label=""
      :options="getSortedSubjectOptions"
      :multiple="isMultiple"
      :group-select="true"
      :group-values="isGroup ? 'groups' : undefined"
      :group-label="isGroup ? 'id' : undefined"
      :placeholder="placeholder"
      :block-keys="[]"
      :close-on-select="false"
      :clear-on-select="false"
      :custom-label="customNameLabel"
      :select-group-label="getSelectGroupLabel"
      :deselect-group-label="getSelectGroupLabel"
      :tag-placeholder="getTagPlaceHolder"
      :taggable="taggable"
      :loading="isLoading"
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
        />

        <span v-if="props.option.isTag" class="qpm_entryManual"
          >{{ getString("manualadd") }}: {{ props.option.label }}
        </span>

        <div
          v-if="
            !props.option.$groupLabel &&
            props.option.buttons &&
            !props.option.isTag &&
            !props.option.maintopic
          "
          class="qpm_dropdownButtons qpm_forceRight"
        >
          <button
            v-tooltip="{
              content: getString('tooltipNarrow'),
              offset: 5,
              delay: $helpTextDelay,
              hideOnTargetClick: false,
            }"
            class="qpm_button"
            :class="getButtonColor(props, 'narrow', 0)"
            tabindex="-1"
            @click="handleScopeButtonClick(props.option, 'narrow', $event)"
          >
            {{ getString("narrow") }}
          </button>

          <button
            v-tooltip="{
              content: getString('tooltipNormal'),
              offset: 5,
              delay: $helpTextDelay,
              hideOnTargetClick: false,
            }"
            class="qpm_button"
            :class="getButtonColor(props, 'normal', 1)"
            tabindex="-1"
            @click="handleScopeButtonClick(props.option, 'normal', $event)"
          >
            {{ getString("normal") }}
          </button>

          <button
            v-tooltip="{
              content: getString('tooltipBroad'),
              offset: 5,
              delay: $helpTextDelay,
              hideOnTargetClick: false,
            }"
            class="qpm_button"
            :class="getButtonColor(props, 'broad', 2)"
            tabindex="-1"
            @click="handleScopeButtonClick(props.option, 'broad', $event)"
          >
            {{ getString("broad") }}
          </button>
        </div>
      </template>

      <span slot="noResult">
        {{ getNoResultString }}
      </span>
    </multiselect>
  </div>
</template>

<script>
  import Multiselect from "vue-multiselect";
  import DropdownTag from "@/components/DropdownTag.vue";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { topics } from "@/assets/content/qpm-content-diabetes";
  import { filtrer } from "@/assets/content/qpm-content-filters";
  import { customInputTagTooltip } from "@/assets/content/qpm-content-utils";
  import { getPromptForLocale, searchTranslationPrompt } from "@/assets/content/qpm-openAiPrompts";

  export default {
    name: "DropdownWrapper",
    components: {
      Multiselect,
      DropdownTag,
    },
    mixins: [appSettingsMixin],
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
        default: function () {
          return [];
        },
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
      };
    },
    computed: {
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
        if (this.hideTopics == null || this.hideTopics.length === 0) {
          return this.data;
        }
        let self = this;
        function isNotHidden(e) {
          return !self.isHiddenTopic(e.id);
        }

        let shown = this.data.filter(isNotHidden).map(function (e) {
          let copy = JSON.parse(JSON.stringify(e));
          if (copy.groups != undefined) {
            copy.groups = copy.groups.filter(isNotHidden);
          } else if (copy.choices != undefined) {
            copy.choices = copy.choices.filter(isNotHidden);
          }
          return copy;
        });

        return shown;
      },
      getSortedSubjectOptions: function () {
        let self = this;
        let lang = this.language;

        function sortByPriorityOrName(a, b) {
          let aSort, bSort;

          if (a.ordering[lang] != null && b.ordering[lang] == null) {
            return -1; // a is ordered and b is not -> a first
          }
          if (b.ordering[lang] != null && a.ordering[lang] == null) {
            return 1; // b is ordered and a is not -> b first
          }

          if (a.ordering[lang] != null) {
            // We know both are non null due to earlier check
            aSort = a.ordering[lang];
            bSort = b.ordering[lang];
          } else {
            // Both are unordered
            aSort = self.customGroupLabel(a);
            bSort = self.customGroupLabel(b);
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

        for (let i = 0; i < data.length; i++) {
          let groupName = null;
          if (data[i]["groups"] != null) {
            groupName = "groups";
          } else if (data[i]["choices"] != null) {
            groupName = "choices";
          } else {
            continue;
          }

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
    },
    watch: {
      maintopicToggledMap: {
        handler: "onMaintainTopicToggledMapChange",
        deep: true,
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
    },
    updated: function () {
      this.initialSetup();
    },
    methods: {
      initialSetup() {
        const element = this.$refs.selectWrapper;

        // Click on anywhere on dropdown opens (fix for IE)
        const dropdown = element.getElementsByClassName("qpm_dropDownMenu")[0];
        dropdown.removeEventListener("mousedown", this.handleOpenMenuOnClick);
        dropdown.addEventListener("mousedown", this.handleOpenMenuOnClick);

        // Set placeholder to correct length
        const input = element.getElementsByClassName("multiselect__input")[0];
        input.addEventListener("input", this.handleInputEvent.bind(this));

        // Hide last operator (Changed by Ole on 20231210)
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

        input.removeEventListener("keyup", self.handleSearchInput);
        input.addEventListener("keyup", self.handleSearchInput);
        if (!input.value) {
          // Hide what needs to be hidden only if groups and only if we are not currently doing a search
          this.showOrHideElements();
        }

        const labels = element.getElementsByClassName("multiselect__tag");
        Array.from(labels).forEach((label) => {
          label.removeEventListener("click", self.handleTagClick);
          label.addEventListener("click", self.handleTagClick);
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
        // Klone det sidste element for at undgå at ændre det direkte i datakilden
        let elem = { ...value[value.length - 1] };
        let lg = this.language; // Bruger this.language til at få den aktuelle sprogkode

        if (elem.maintopic) {
          //toggle the maintopic
          this.maintopicToggledMap = {
            ...this.maintopicToggledMap,
            [elem.id]: !this.maintopicToggledMap[elem.id],
          };
          value.pop();
        }

        // Tjek kun for '-' i det aktuelle sprog
        if (!elem.isCustom && elem.translations[lg] && elem.translations[lg].startsWith("-")) {
          // Ændre kun translations for det aktuelle sprog
          let updatedTranslations = { ...elem.translations };
          updatedTranslations[lg] = elem.translations[lg].slice(1);

          // Opdater elem med de nye translations, så ændringen kun påvirker det valgte sprog
          elem.translations = updatedTranslations;
          // Erstat det oprindelige element med den ændrede klon i værdi-arrayet
          value[value.length - 1] = elem;
        }
        this.$emit("input", value, this.index);
        if (!elem.maintopic) {
          this.$refs.multiselect.deactivate();
        }
      },
      close() {
        if (this.tempList.length > 0) return; //Check if any items have been clicked

        let input = this.$el.getElementsByClassName("multiselect__input")[0];

        this.setWidthToPlaceholderWidth(input);
      },
      open() {
        this.$refs.multiselect.pointer = -1; // Remove highlight of non hovered items
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
        if (!this.isGroup) {
          // Here we are dealing with filters so we omit the check on groupname
          const entries = element.querySelectorAll("[data-name]");
          entries.forEach((entry) => {
            const parent = entry.parentNode.parentNode;
            const parentId = entry.getAttribute("parent-id");
            const grandParentId = entry.getAttribute("grand-parent-id");

            const shouldShow =
              (parentId && !this.maintopicToggledMap[parentId]) ||
              (grandParentId && !this.maintopicToggledMap[grandParentId]);

            parent.classList.toggle("qpm_shown", shouldShow);
          });
          return;
        }

        const entries = element.querySelectorAll("[data-name]");
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
          const depthElements = document.querySelectorAll(`span[option-depth="${depth}"]`);
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
          topics.forEach((topic) => {
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
        topics.forEach((topic) => {
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
          _topics = topics.filter((filter) => filter.id === optionGroupId);
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
        console.log("Siblings | ", siblings);

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

          _filtrer.choices.forEach((group) => {
            if (group.maintopic) {
              maintopics.push(group);
            }
          });
          return maintopics;
        }
        const _topics = topics.find((topic) => topic.id === optionGroupId);

        _topics.groups.forEach((group) => {
          if (group.maintopic) {
            maintopics.push(group);
          }
        });

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
        console.log(`targetLabel | ${targetLabel}`);
        const optionGroupName = this.getOptionGroupName(this.data, targetLabel, this.language);

        const optionGroupId = this.getOptionGroupId(optionGroupName);
        const selectedOptions = this.getSelectedOptionsByOptionGroupId(optionGroupId);

        const selectedOptionIds = selectedOptions.map((o) => o.id);
        const optionsInOptionGroup = this.getOptionsFromOptionsGroupName(optionGroupName);

        if (!optionGroupName && !optionGroupId) {
          const filterCategoryId = this.selected[0].id.substring(0, 3);
          console.log("Filter category | ", filterCategoryId);

          const filterCategoryName = filtrer.find((filter) => filter.id === filterCategoryId).name;
          const optionsInOptionGroupFilters =
            this.getOptionsFromOptionsGroupName(filterCategoryName);

          const filterIds = this.selected.map((option) => option.id);
          console.log(
            "FilterIds | ",
            filterIds,
            "optionsInOptionGroupFilters | ",
            optionsInOptionGroupFilters
          );
          this.updateOptionGroupVisibility(filterIds, optionsInOptionGroupFilters);
        }

        if (selectedOptionIds.length <= 0) {
          this.showOrHideElements();
          this.updateExpandedGroupHighlighting();
        } else {
          // Only show the tags in the clicked group
          this.updateOptionGroupVisibility(selectedOptionIds, optionsInOptionGroup);
        }
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
        const newWidth = `${event.target.value.length + 1}ch`;
        event.target.style.setProperty("width", newWidth, "important");
      },
      handleStopEnterOnGroups(event) {
        if (this.$refs.multiselect.pointer < 0) {
          // If there is no hovered element then highlight the first on as with old behavior
          this.$refs.multiselect.pointer = 1;
        }
        if (event.charCode == 13) {
          if (event.target.classList.contains("multiselect__input")) {
            const element = this.$refs.selectWrapper;
            target = element.getElementsByClassName("multiselect__option--highlight")[0];
            if (target == null || target.classList.contains("multiselect__option--group")) {
              event.stopPropagation();

              if (target == null) return;

              var focusedGroup = target.querySelector(".qpm_groupLabel").textContent;

              if (focusedGroup == this.expandedOptionGroupName) {
                this.expandedOptionGroupName = "";
              } else {
                this.expandedOptionGroupName = focusedGroup;
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
              button.click();
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

        event.stopPropagation();
        this.$refs.multiselect.$refs.search.focus();
      },
      handleScopeButtonClick(item, state, event) {
        this.$emit("updateScope", item, state, this.index);
        item.scope = state;

        //close
        if (this.getShouldCloseOnInput) {
          this.$refs.multiselect.$refs.search.blur();
        }

        //Check if just added
        if (this.tempList.indexOf(item) >= 0) {
          event.stopPropagation();
          return;
        }
        //Check if added previously
        for (let i = 0; i < this.selected.length; i++) {
          if (this.selected[i].name == item.name) {
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
            //IsTranslated er true når det er en unedited oversættelse
            isTranslated: true,
            preTranslation: newTag,
            tooltip: {
              dk: customInputTagTooltip.dk + " - denne søgning er oversat fra: " + newTag,
              en: customInputTagTooltip.en + " - this search is translated from: " + newTag,
            },
          };
          this.isLoading = false;
        } else {
          tag = {
            name: newTag,
            searchStrings: { normal: [newTag] },
            preString: this.getString("manualInputTerm") + ":\u00A0",
            isCustom: true,
            tooltip: customInputTagTooltip,
          };
        }
        this.$emit("translating", false, this.index);
        this.selected.push(tag);
        this.input(this.selected, -1);
        this.clearShownItems();
      },
      handleUpdateCustomTag(oldTag, newTag) {
        var tagIndex = this.selected.findIndex(function (e) {
          return oldTag == e;
        });
        this.selected.splice(tagIndex, 1, newTag);
        this.clearShownItems();
        this.input(this.selected, -1);
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

        var currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];
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

            if (toggledMaintopic.length === 1) {
              dropdownRef.pointer = dropdownRef.pointer - 1;
              return;
            }

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
                dropdownRef.pointer = dropdownRef.pointer - 1;
                return;
              }
            }

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
        var listItems = this.$refs.multiselect.$refs.list;

        // Remove highlighting due to group being open from all groups
        let itemsToUnHighlight = listItems.querySelectorAll(".qpm_groupExpanded");

        for (let i = 0; i < itemsToUnHighlight.length; i++) {
          itemsToUnHighlight[i].classList.remove("qpm_groupExpanded");
        }

        if (this.expandedOptionGroupName == "") return;

        // Add highlighting due to group being open
        var expandedElement = listItems.querySelector(
          'li.multiselect__element span.multiselect__option--group span[group-name="' +
            this.expandedOptionGroupName +
            '"]'
        );
        expandedElement.parentElement.parentElement.classList.add("qpm_groupExpanded");
      },
      updateSortedSubjectOptions() {
        this.showOrHideElements();
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

        try {
          let answer = "";
          const response = await fetch(openAiServiceUrl, {
            method: "POST",
            body: JSON.stringify({
              prompt: localePrompt,
              title: wordsToTranslate,
              client: this.appSettings.client,
            }),
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
        for (const topic of topics) {
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
        // Create a temporary span element and set its text to the placeholder text
        let tempSpan = document.createElement("span");
        tempSpan.innerHTML = input.getAttribute("placeholder");

        // Apply the same styles to the span as the input
        let inputStyle = window.getComputedStyle(input);
        tempSpan.style.fontFamily = inputStyle.fontFamily;
        tempSpan.style.fontSize = inputStyle.fontSize;
        tempSpan.style.fontWeight = inputStyle.fontWeight;
        tempSpan.style.letterSpacing = inputStyle.letterSpacing;
        tempSpan.style.whiteSpace = "nowrap"; // Ensure text stays on one line

        // Add the span to the body (it won't be visible)
        document.body.appendChild(tempSpan);

        // Get the width of the area
        let placeholderWidth = tempSpan.getBoundingClientRect().width + 27;

        // Remove the span from the body
        document.body.removeChild(tempSpan);

        input.style.width = placeholderWidth + "px";
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
    },
  };
</script>
