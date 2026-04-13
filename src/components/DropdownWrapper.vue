<template>
  <div
    ref="selectWrapper"
    class="qpm_dropdown"
    :class="{ 'qpm_hide-tags-wrap': hideTagsWrap, qpm_mobileUiDropdown: (isMobileUi || isTouchDevice) }"
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
      v-if="isMobileUi && !shouldHideDropdownArrow && !mobileOverlayHidden && getStateCopy.length === 0"
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
          v-tooltip.right="{ ...customGroupTooltipById(props.option.$groupLabel), theme: 'infoTooltip', triggers: ['hover', 'focus'], hideTriggers: ['hover'] }"
          class="bx bx-info-circle qpm_infoIcon qpm_groupInfoIcon"
          aria-label="Info"
          @mousedown.stop
          @click.stop.prevent="forwardGroupHeaderClick($event)"
          @touchstart.stop.prevent
        />

        <span
          v-if="props.option.$groupLabel && showScopeLabel"
          class="qpm_scopeLabel qpm_forceRight"
          :class="{ qpm_shown: showScope(props.option.$groupLabel) }"
          >{{ getString("scope") }}</span
        >

        <span class="qpm_entryName">{{ customNameLabel(props.option) }} </span>

        <button
          v-if="props.option.tooltip && props.option.tooltip[language]"
          type="button"
          v-tooltip.right="{
            content: props.option.tooltip && props.option.tooltip[language],
            distance: 5,
            delay: 0,
            theme: 'infoTooltip',
          }"
          class="bx bx-info-circle qpm_infoIcon qpm_entryInfoIcon"
          aria-label="Info"
          @mousedown.stop
          @click.stop.prevent="forwardOptionRowClick($event)"
          @touchstart.stop
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
          @touchmove="handleActionSheetTouchMove"
        >
          <div class="qpm_actionSheetPanel">
            <div class="qpm_actionSheetPrimaryGroup">
              <div class="qpm_actionSheetStepHeader">
                <button
                  v-if="mobileListStep === 'children'"
                  class="qpm_actionSheetBack"
                  :aria-label="getString('mobileActionBack')"
                  @click="backToMobileRoot"
                ><i class="bx bx-chevron-left qpm_actionSheetBackIcon" aria-hidden="true" /></button>
                <div class="qpm_actionSheetStepTitle">
                  {{
                    mobileListStep === "root"
                      ? getMobileRootTitle()
                      : getMobileActiveGroupLabel()
                  }}
                </div>
                <div
                  v-if="mobileListStep === 'children' && getMobileBreadcrumb()"
                  class="qpm_actionSheetBreadcrumb"
                >{{ getMobileBreadcrumb() }}</div>
              </div>
              <div
                v-if="mobileListStep === 'root'"
                ref="mobileActionSheetList"
                class="qpm_actionSheetList qpm_actionSheetList--scrollable"
                @scroll.passive="handleMobileListScroll"
              >
                <button
                  v-for="group in getMobileRootGroups()"
                  :key="group.id"
                  class="qpm_actionSheetBtn qpm_actionSheetListItem"
                  @click="openMobileChildren(group.id)"
                >
                  <span>{{ group.label }}</span>
                  <i
                    class="bx bx-chevron-right qpm_actionSheetListChevron"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div
                v-else
                ref="mobileActionSheetList"
                class="qpm_actionSheetList qpm_actionSheetList--scrollable"
                @scroll.passive="handleMobileListScroll"
              >
                <button
                  v-for="item in getMobileChildrenForGroup(mobileActiveGroupId)"
                  :key="item.id"
                  class="qpm_actionSheetBtn qpm_actionSheetListItem"
                  @click="handleMobileListItemClick(item)"
                >
                  <span>{{ item.displayLabel }}</span>
                  <i
                    v-if="item.isBranch"
                    class="bx bx-chevron-right qpm_actionSheetListChevron"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div
                class="qpm_actionSheetScrollHint"
                :class="{ 'qpm_actionSheetScrollHint--hidden': !showMobileScrollHint }"
              >{{ getString("mobileActionScrollHint") }}</div>
            </div>
            <div v-if="taggable" class="qpm_actionSheetSecondaryGroup">
              <button
                class="qpm_actionSheetBtn qpm_actionSheetSecondaryBtn"
                @click="handleActionFreeText"
              >{{ getString("mobileActionFreeText") }}</button>
            </div>
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
  import { config as runtimeConfig } from "@/config/config.js";
  import { appSettingsMixin } from "@/mixins/appSettings.js";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { topicLoaderMixin } from "@/mixins/topicLoaderMixin.js";
  import {
    searchTranslationPrompt,
    semanticScholarSearchPrompt,
    semanticIntentPrompt,
  } from "@/assets/prompts/translation.js";
  import { getPromptForLocale } from "@/utils/promptsHelpers.js";
  import { customInputTagTooltip } from "@/utils/contentHelpers.js";
  import {
    areComparableIdsEqual,
    cloneDeep,
    getAbstractEntriesFromPubMedXml,
    getLocalizedTranslation,
    hasXmlParserError,
    isMobileViewport,
    parsePubMedXml,
  } from "@/utils/componentHelpers";
  import { validateAndEnhanceMeshTerms } from "@/utils/meshValidator.js";
  import { summarizeSearchFlowRecord } from "@/utils/searchFlowDebug";
  import { buildOpenAlexPublicationYearFilter } from "@/utils/semanticWordedIntent.js";
  import { rerankSemanticCandidates } from "@/utils/semanticReranking.js";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  const TRANSLATION_REQUEST_TIMEOUT_MS = 60000;
  const BACKEND_REQUEST_TIMEOUT_MS = 45000;
  const SEMANTIC_INTENT_CACHE_TTL_MS = 5 * 60 * 1000;
  const SEMANTIC_SOURCE_RESPONSE_CACHE_TTL_MS = 5 * 60 * 1000;
  const DEFAULT_SEMANTIC_SCHOLAR_LIMIT = 400;
  const DEFAULT_OPENALEX_LIMIT = 100;
  const OPENALEX_SEMANTIC_RESULT_CAP = 50;
  const DEFAULT_ELICIT_LIMIT = 100;
  const DEFAULT_SEMANTIC_RESCUE_CONFIG = {
    mode: "configurable_default_sparse",
    minMergedCandidates: 25,
    minSourceCandidates: 12,
    searchLimit: 80,
    maxCandidates: 20,
    minLexicalScore: 3,
  };

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
      qpmSearchFlowDebugApi: { default: null },
    },
    emits: ["input", "updateScope", "mounted", "translating", "searchchange"],
    props: {
      isMultiple: Boolean,
      isGroup: Boolean,
      taggable: Boolean,
      closeOnInput: Boolean,
      searchWithAI: Boolean,
      searchWithPubMedQuery: Boolean,
      searchWithPubMedBestMatch: Boolean,
      searchWithSemanticScholar: Boolean,
      searchWithOpenAlex: Boolean,
      searchWithElicit: Boolean,
      semanticWordedIntentContext: {
        type: Object,
        default: null,
      },
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
        isMobileUi: false,
        _touchMql: null,
        _hoverMql: null,
        _widthMql: null,
        _mobileUiMqlHandler: null,
        showMobileActionSheet: false,
        mobileListStep: "root",
        mobileActiveGroupId: "",
        mobileParentStack: [],
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
        _bodyScrollY: 0,
        _bodyScrollLocked: false,
        _lastElicitRateLimitLogSignature: "",
        _bodyOriginalStyles: null,
        _htmlOriginalOverscrollBehavior: "",
        mobileCanScroll: false,
        mobileAtBottom: false,
        semanticIntentCache: {},
        semanticSourceResponseCache: {},
      };
    },
    created() {
      const hasTouchPoints =
        typeof navigator !== "undefined" && Number(navigator.maxTouchPoints || 0) > 0;
      if (typeof window !== "undefined" && window.matchMedia) {
        this._touchMql = window.matchMedia("(pointer: coarse)");
        this._hoverMql = window.matchMedia("(hover: none)");
        this._widthMql = window.matchMedia("(max-width: 768px)");
        this._mobileUiMqlHandler = () => this.updateMobileUiState();
        this._touchMql.addEventListener("change", this._mobileUiMqlHandler);
        this._hoverMql.addEventListener("change", this._mobileUiMqlHandler);
        this._widthMql.addEventListener("change", this._mobileUiMqlHandler);
        this.updateMobileUiState();
      } else {
        this.isTouchDevice = hasTouchPoints;
        this.isMobileUi = hasTouchPoints;
      }
      this._handleKeyDownBound = this.handleKeyDown.bind(this);
      this._handleInputEventBound = this.handleInputEvent.bind(this);
      this._handleEmptyDropdownInputBound = this.handleEmptyDropdownInput.bind(this);
      this._handleEmptyDropdownKeydownBound = this.handleEmptyDropdownKeydown.bind(this);
      this._handleEmptyDropdownFocusBound = this.handleEmptyDropdownFocus.bind(this);
      this._handleEmptyDropdownClickBound = this.handleEmptyDropdownClick.bind(this);
      this._handleDropdownMousedownGuard = (event) => {
        const isArrowClick =
          !!event &&
          !!event.target &&
          typeof event.target.closest === "function" &&
          !!event.target.closest(".multiselect__select");

        if (isArrowClick) {
          if (this.isMobileInputMode()) {
            if (event && typeof event.preventDefault === "function" && event.cancelable) {
              event.preventDefault();
            }
            if (event && typeof event.stopPropagation === "function") {
              event.stopPropagation();
            }
            this.mobileOverlayHidden = false;
            this.handleMobileTap();
            return;
          }
          this._preventDeactivate = false;
          clearTimeout(this._deactivateGuardTimer);
          return;
        }

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
      showMobileScrollHint() {
        return this.showMobileActionSheet && this.mobileCanScroll && !this.mobileAtBottom;
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
      showMobileActionSheet(newVal) {
        if (newVal) {
          this.lockBodyScrollForActionSheet();
          this.$nextTick(() => this.updateMobileListIndicators());
        } else {
          this.unlockBodyScrollForActionSheet();
          this.mobileCanScroll = false;
          this.mobileAtBottom = false;
        }
      },
      mobileListStep() {
        if (this.showMobileActionSheet) {
          this.$nextTick(() => this.updateMobileListIndicators());
        }
      },
      mobileActiveGroupId() {
        if (this.showMobileActionSheet) {
          this.$nextTick(() => this.updateMobileListIndicators());
        }
      },
      mobileParentStack: {
        deep: true,
        handler() {
          if (this.showMobileActionSheet) {
            this.$nextTick(() => this.updateMobileListIndicators());
          }
        },
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
      this.unlockBodyScrollForActionSheet();
      this.isUserTyping = false;
      if (this._touchMql && this._mobileUiMqlHandler) {
        this._touchMql.removeEventListener("change", this._mobileUiMqlHandler);
      }
      if (this._hoverMql && this._mobileUiMqlHandler) {
        this._hoverMql.removeEventListener("change", this._mobileUiMqlHandler);
      }
      if (this._widthMql && this._mobileUiMqlHandler) {
        this._widthMql.removeEventListener("change", this._mobileUiMqlHandler);
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
      shouldUseDesktopInputWidthInMobileUi() {
        return this.isMobileUi && typeof window !== "undefined" && window.innerWidth >= 600;
      },
      updateMobileUiState() {
        const hasTouchPoints =
          typeof navigator !== "undefined" && Number(navigator.maxTouchPoints || 0) > 0;
        const coarsePointer = !!this._touchMql?.matches;
        const noHover = !!this._hoverMql?.matches;
        const smallViewport = !!this._widthMql?.matches;
        const hasTouchEvent =
          typeof window !== "undefined" &&
          ("ontouchstart" in window || ("DocumentTouch" in window && document instanceof window.DocumentTouch));
        const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
        const isAndroid = /Android/i.test(userAgent);
        const isMobileAgent = /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(userAgent) || isMobileViewport();
        this.isTouchDevice = hasTouchPoints || coarsePointer || hasTouchEvent;
        this.isMobileUi =
          (this.isTouchDevice && (noHover || smallViewport || isAndroid || isMobileAgent)) ||
          (isAndroid && (hasTouchPoints || coarsePointer || hasTouchEvent));

        if (this.isMobileUi) {
          this.$nextTick(() => {
            const input = this.$el?.querySelector(".multiselect__input");
            if (input) {
              if (!this.shouldHideDropdownArrow && this.shouldUseDesktopInputWidthInMobileUi()) {
                // Keep mobile action sheet behavior, but use desktop-like compact input width on tablet.
                input.style.setProperty("display", "inline-block", "important");
                input.style.setProperty("position", "relative", "important");
                input.style.removeProperty("max-width");
                this.setWidthToPlaceholderWidth(input);
                return;
              }
              const mobileInputWidth = this.shouldHideDropdownArrow ? "100%" : "calc(100% - 34px)";
              input.style.setProperty("width", mobileInputWidth, "important");
              input.style.setProperty("max-width", mobileInputWidth, "important");
              input.style.setProperty("display", "block", "important");
              input.style.setProperty("position", "static", "important");
            }
          });
        }
      },
      isMobileInputMode() {
        return this.isMobileUi;
      },
      getMobileGroupItems(groupId) {
        if (!groupId) return [];
        const group = this.getSortedSubjectOptions.find((item) => item.id === groupId);
        if (!group) return [];
        const groupProp = group.groups ? "groups" : group.choices ? "choices" : null;
        if (!groupProp || !Array.isArray(group[groupProp])) return [];
        return group[groupProp].filter(Boolean);
      },
      getMobileParentId(item) {
        if (!item) return null;
        if (item.maintopicIdLevel1) return item.maintopicIdLevel1;
        if (Array.isArray(item.parentChain) && item.parentChain.length > 0) {
          // parentChain is stored nearest -> farthest for normalized content.
          // Use the nearest ancestor as direct parent in mobile drilldown.
          return item.parentChain[0];
        }
        if (item.maintopicIdLevel2) return item.maintopicIdLevel2;
        return null;
      },
      getMobileCurrentParentId() {
        if (!Array.isArray(this.mobileParentStack) || this.mobileParentStack.length === 0) {
          return null;
        }
        return this.mobileParentStack[this.mobileParentStack.length - 1];
      },
      hasMobileChildren(groupId, id) {
        if (!id) return false;
        const items = this.getMobileGroupItems(groupId);
        return items.some((entry) => this.getMobileParentId(entry) === id);
      },
      buildMobileDisplayLabel(item) {
        if (!item) return "";
        const selectedIds = new Set((this.selected || []).map((s) => s?.id).filter(Boolean));
        const label = this.customNameLabel(item) || item.id;
        const isSelected = selectedIds.has(item.id);
        return (!item.maintopic && isSelected ? "\u2713 " : "") + label;
      },
      getMobileChildrenForGroup(groupId) {
        if (!groupId) return [];
        const items = this.getMobileGroupItems(groupId);
        const parentId = this.getMobileCurrentParentId();
        return items
          .filter((entry) => this.getMobileParentId(entry) === parentId)
          .map((entry) => ({
            id: entry.id,
            displayLabel: this.buildMobileDisplayLabel(entry),
            isBranch: this.hasMobileChildren(groupId, entry.id) || !!entry.maintopic,
            original: entry,
          }));
      },
      handleMobileListItemClick(item) {
        if (!item || !item.id) return;
        if (item.isBranch) {
          this.mobileParentStack = [...this.mobileParentStack, item.id];
          return;
        }
        this.handleNativeSelect({ target: { value: item.id } });
      },
      getMobileLabelById(groupId, id) {
        if (!groupId || !id) return "";
        const items = this.getMobileGroupItems(groupId);
        const match = items.find((entry) => entry.id === id);
        return match ? this.customNameLabel(match) || match.id : "";
      },
      getMobileRootGroups() {
        return this.getSortedSubjectOptions.map((group) => ({
          id: group.id,
          label: this.customGroupLabelById(group.id),
        }));
      },
      openMobileChildren(groupId) {
        if (!groupId) return;
        this.mobileActiveGroupId = groupId;
        this.mobileParentStack = [];
        this.mobileListStep = "children";
      },
      backToMobileRoot() {
        if (this.mobileListStep !== "children") {
          this.mobileListStep = "root";
          this.mobileActiveGroupId = "";
          this.mobileParentStack = [];
          return;
        }
        if (this.mobileParentStack.length > 0) {
          this.mobileParentStack = this.mobileParentStack.slice(0, -1);
          return;
        }
        this.mobileListStep = "root";
        this.mobileActiveGroupId = "";
        this.mobileParentStack = [];
      },
      getMobileActiveGroupLabel() {
        if (!this.mobileActiveGroupId) return "";
        const currentParentId = this.getMobileCurrentParentId();
        if (currentParentId) {
          return this.getMobileLabelById(this.mobileActiveGroupId, currentParentId);
        }
        const group = this.getMobileRootGroups().find((item) => item.id === this.mobileActiveGroupId);
        return group ? group.label : "";
      },
      getMobileRootTitle() {
        return this.isFilterDropdown
          ? this.getString("mobileActionSelectLimitCategory")
          : this.getString("mobileActionSelectTopicCategory");
      },
      getMobileBreadcrumb() {
        if (!this.mobileActiveGroupId) return "";
        const crumbs = [];
        const rootTitle = this.getMobileRootTitle();
        if (rootTitle) {
          crumbs.push(rootTitle);
        }
        const group = this.getMobileRootGroups().find((item) => item.id === this.mobileActiveGroupId);
        if (group?.label) {
          crumbs.push(group.label);
        }
        if (Array.isArray(this.mobileParentStack) && this.mobileParentStack.length > 0) {
          this.mobileParentStack.forEach((id) => {
            const label = this.getMobileLabelById(this.mobileActiveGroupId, id);
            if (label) crumbs.push(label);
          });
        }
        return crumbs.join(" > ");
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
      handleActionSheetTouchMove(event) {
        const target = event.target;
        const isInsideScrollableList =
          !!target &&
          typeof target.closest === "function" &&
          !!target.closest(".qpm_actionSheetList");
        if (!isInsideScrollableList) {
          event.preventDefault();
        }
      },
      getMobileActionSheetListEl() {
        const ref = this.$refs.mobileActionSheetList;
        if (Array.isArray(ref)) return ref[0] || null;
        return ref || null;
      },
      updateMobileListIndicators() {
        const listEl = this.getMobileActionSheetListEl();
        if (!listEl) {
          this.mobileCanScroll = false;
          this.mobileAtBottom = false;
          return;
        }
        const canScroll = listEl.scrollHeight - listEl.clientHeight > 1;
        this.mobileCanScroll = canScroll;
        this.mobileAtBottom = !canScroll || (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 1);
      },
      handleMobileListScroll(event) {
        const listEl = event?.target;
        if (!listEl) {
          this.updateMobileListIndicators();
          return;
        }
        const canScroll = listEl.scrollHeight - listEl.clientHeight > 1;
        this.mobileCanScroll = canScroll;
        this.mobileAtBottom = !canScroll || (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 1);
      },
      lockBodyScrollForActionSheet() {
        if (typeof window === "undefined" || typeof document === "undefined" || this._bodyScrollLocked) {
          return;
        }
        const body = document.body;
        const html = document.documentElement;
        if (!body || !html) return;

        this._bodyScrollY = window.scrollY || window.pageYOffset || 0;
        this._bodyOriginalStyles = {
          position: body.style.position,
          top: body.style.top,
          left: body.style.left,
          right: body.style.right,
          width: body.style.width,
          overflow: body.style.overflow,
        };
        this._htmlOriginalOverscrollBehavior = html.style.overscrollBehavior;

        body.style.position = "fixed";
        body.style.top = `-${this._bodyScrollY}px`;
        body.style.left = "0";
        body.style.right = "0";
        body.style.width = "100%";
        body.style.overflow = "hidden";
        html.style.overscrollBehavior = "none";
        this._bodyScrollLocked = true;
      },
      unlockBodyScrollForActionSheet() {
        if (typeof window === "undefined" || typeof document === "undefined" || !this._bodyScrollLocked) {
          return;
        }
        const body = document.body;
        const html = document.documentElement;
        if (!body || !html) return;

        const original = this._bodyOriginalStyles || {};
        body.style.position = original.position || "";
        body.style.top = original.top || "";
        body.style.left = original.left || "";
        body.style.right = original.right || "";
        body.style.width = original.width || "";
        body.style.overflow = original.overflow || "";
        html.style.overscrollBehavior = this._htmlOriginalOverscrollBehavior || "";
        window.scrollTo(0, this._bodyScrollY || 0);
        this._bodyScrollLocked = false;
      },
      handleMobileTap() {
        const hasOptions = this.getSortedSubjectOptions.length > 0;
        const canFreeText = this.taggable;
        if (hasOptions) {
          this.mobileListStep = "root";
          this.mobileActiveGroupId = "";
          this.mobileParentStack = [];
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
        this.mobileListStep = "root";
        this.mobileActiveGroupId = "";
        this.mobileParentStack = [];
        this.mobileOverlayHidden = false;
      },
      handleActionFreeText() {
        this.showMobileActionSheet = false;
        this.mobileListStep = "root";
        this.mobileActiveGroupId = "";
        this.mobileParentStack = [];
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
        this.mobileListStep = "root";
        this.mobileActiveGroupId = "";
        this.mobileParentStack = [];
        this.mobileOverlayHidden = false;
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
              const parent =
                entry.closest?.(".multiselect__element") ||
                entry.parentElement?.parentElement ||
                null;
              if (!parent || !parent.classList) return;
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
            const parent =
              entry.closest?.(".multiselect__element") ||
              entry.parentElement?.parentElement ||
              null;
            if (!parent || !parent.classList) return;

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
      forwardGroupHeaderClick(event) {
        const target = event?.target;
        if (!target || typeof target.closest !== "function") return;
        const groupHeader = target.closest(".multiselect__option--group");
        if (!groupHeader) return;
        this.handleCategoryGroupClick({ target: groupHeader });
      },
      forwardOptionRowClick(event) {
        const target = event?.target;
        if (!target || typeof target.closest !== "function") return;
        const row = target.closest("li.multiselect__element");
        if (!row) return;
        const optionElement = row.querySelector(".multiselect__option:not(.multiselect__option--group)");
        if (!optionElement) return;
        optionElement.dispatchEvent(
          new MouseEvent("mousedown", { bubbles: true, cancelable: true })
        );
        optionElement.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true })
        );
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
        const target = event?.target;
        if (target && typeof target.closest === "function" && target.closest(".multiselect__tag-icon")) {
          event.stopPropagation();
          return;
        }

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

        // On mobile/touch, avoid forcing focus into multiselect input.
        // This prevents Android from opening keyboard together with dropdown menu.
        const hasTouchEvent =
          typeof window !== "undefined" &&
          ("ontouchstart" in window || ("DocumentTouch" in window && document instanceof window.DocumentTouch));
        const isTouchLike = this.isTouchDevice || hasTouchEvent;
        if (this.isMobileInputMode() && !this.mobileOverlayHidden) {
          event.preventDefault();
          this.handleMobileTap();
          return;
        }
        if (isTouchLike && !this.mobileOverlayHidden) {
          event.preventDefault();
          return;
        }
        
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
      buildPendingSemanticTag(newTag) {
        return {
          id: `__custom__:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          name: newTag,
          searchStrings: { normal: [newTag] },
          preString: this.getString("manualInputTerm") + ":\u00A0",
          isCustom: true,
          isTranslated: false,
          preTranslation: newTag,
          semanticFlowType: "deferred",
          isPendingSemanticSearch: true,
          semanticScholarQuery: "",
          semanticIntentPayload: null,
          llmSemanticIntent: null,
          semanticIntentMeta: null,
          semanticSourceQueryPlan: null,
          pubmedGeneratedQuery: "",
          semanticScholarPmids: [],
          semanticScholarDois: [],
          semanticScholarCandidates: [],
          semanticSourceResults: [],
          semanticRerankDiagnostics: null,
          semanticMergeDebug: null,
          semanticScholarError: "",
          useSemanticScholar: false,
          includeTranslatedTextInQuery: false,
          tooltip: customInputTagTooltip,
        };
      },
      buildTranslatedPendingSemanticTag(translatedTag, originalInput, options = {}) {
        const showOriginalInput = options?.showOriginalInput === true;
        const visibleName = showOriginalInput ? originalInput : translatedTag;
        const visiblePreString = showOriginalInput
          ? this.getString("manualInputTerm") + ":\u00A0"
          : this.getString("manualInputTermTranslated") + ":\u00A0";
        return {
          id: `__custom__:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          name: visibleName,
          searchStrings: { normal: [visibleName] },
          preString: visiblePreString,
          isCustom: true,
          isTranslated: true,
          preTranslation: originalInput,
          semanticFlowType: "deferred",
          isPendingSemanticSearch: true,
          semanticScholarQuery: "",
          semanticIntentPayload: null,
          llmSemanticIntent: null,
          semanticIntentMeta: null,
          semanticSourceQueryPlan: null,
          pubmedGeneratedQuery: translatedTag,
          semanticScholarPmids: [],
          semanticScholarDois: [],
          semanticScholarCandidates: [],
          semanticSourceResults: [],
          semanticRerankDiagnostics: null,
          semanticMergeDebug: null,
          semanticScholarError: "",
          useSemanticScholar: false,
          includeTranslatedTextInQuery: true,
          tooltip: showOriginalInput
            ? customInputTagTooltip
            : {
                dk:
                  customInputTagTooltip.dk +
                  " &ndash; denne søgning er oversat fra: <strong>" +
                  originalInput +
                  "</strong>",
                en:
                  customInputTagTooltip.en +
                  " &ndash; this search is translated from: <strong>" +
                  originalInput +
                  "</strong>",
              },
        };
      },
      async buildResolvedSemanticTagState(newTag, existingTag = null, options = {}) {
        const useSemanticScholarSource = this.searchWithSemanticScholar;
        const useOpenAlexSource = this.isOpenAlexSemanticSearchEnabled();
        const useElicitSource = this.searchWithElicit;
        const hasSemanticSource =
          useSemanticScholarSource ||
          useOpenAlexSource ||
          useElicitSource;
        const isPubMedSourceSelected = this.searchWithPubMedBestMatch === true;
        const allowPubmedQueryGeneration = options?.allowPubmedQueryGeneration !== false;
        const pubmedSourceQuery = String(options?.pubmedSourceQuery || "").trim();
        const shouldFetchPubmedSource =
          pubmedSourceQuery !== "" && isPubMedSourceSelected;
        const shouldUseAiSemanticFlow = this.searchWithAI === true && hasSemanticSource;
        const shouldGeneratePubmedQuery =
          allowPubmedQueryGeneration &&
          this.searchWithAI === true &&
          isPubMedSourceSelected;
        let semanticQuery = "";
        let semanticIntentPayload = null;
        let llmSemanticIntent = null;
        let semanticIntentMeta = null;
        let semanticSourceQueryPlan = null;
        let pubmedGeneratedQuery = String(existingTag?.pubmedGeneratedQuery || "").trim();
        let semanticRescueMeta = null;
        const sourceResults = [];
        const sourceErrors = [];

        console.info("[MultiSourceFlow] Starting deferred semantic source flow.", {
          input: newTag,
          sources: {
            semanticScholar: useSemanticScholarSource,
            openAlex: useOpenAlexSource,
            elicit: useElicitSource,
          },
          useAiSemanticFlow: shouldUseAiSemanticFlow,
          allowPubmedQueryGeneration,
          shouldGeneratePubmedQuery,
          pubmedSourceQuery,
          isPubMedSourceSelected,
          shouldFetchPubmedSource,
        });

        if (shouldGeneratePubmedQuery && !pubmedGeneratedQuery) {
          this.$emit("translating", true, this.index, "translatingStepSearchString");
          try {
            pubmedGeneratedQuery = await this.buildPubMedSearchStringFromFreeText(newTag);
          } finally {
            this.$emit("translating", false, this.index, "translatingStepSearchString");
          }
        }

        const [semanticQueryOutcome] = await Promise.allSettled([
          shouldUseAiSemanticFlow
            ? this.measureAsync(
                "Semantic intent/query translation",
                () => this.deriveSemanticQueryForSources(newTag),
                { input: newTag, flow: "intent-first" }
              )
            : Promise.resolve(null),
        ]);

        if (hasSemanticSource) {
          if (shouldUseAiSemanticFlow && semanticQueryOutcome.status === "fulfilled") {
            const semanticOutcomeValue = semanticQueryOutcome.value || {};
            semanticQuery = String(semanticOutcomeValue.semanticQuery || "").trim();
            semanticIntentPayload = semanticOutcomeValue.semanticIntentPayload || null;
            llmSemanticIntent = semanticOutcomeValue.llmSemanticIntent || null;
            semanticIntentMeta = semanticOutcomeValue.semanticIntentMeta || null;
            semanticSourceQueryPlan = semanticOutcomeValue.semanticSourceQueryPlan || null;
          } else if (shouldUseAiSemanticFlow) {
            throw semanticQueryOutcome.reason;
          } else {
            semanticQuery = String(newTag || "").trim();
          }

          this.logSearchFlowDebugInfo("03 Semantic intent", {
            input: newTag,
            semanticQuery,
            pubmedGeneratedQuery,
            pubmedSourceQuery,
            useAiSemanticFlow: shouldUseAiSemanticFlow,
            semanticIntentMeta,
            semanticSourceQueryPlan,
          });

          if (semanticQuery) {
            await this.runSearchFlowDebugSection(
              `04 Source retrieval • ${String(newTag || "").trim()}`,
              async () => {
                const semanticSourceRequests = [];
                if (useSemanticScholarSource) {
                  semanticSourceRequests.push({
                    source: "semanticScholar",
                    run: async () => {
                      this.$emit("translating", true, this.index, "translatingStepSemanticScholar");
                      try {
                        return await this.fetchSemanticScholarResults(semanticQuery, {
                          semanticIntentPayload,
                          llmSemanticIntent,
                          semanticSourceQueryPlan,
                        });
                      } finally {
                        this.$emit("translating", false, this.index, "translatingStepSemanticScholar");
                      }
                    },
                  });
                }
                if (useOpenAlexSource) {
                  semanticSourceRequests.push({
                    source: "openAlex",
                    run: async () => {
                      this.$emit("translating", true, this.index, "translatingStepOpenAlex");
                      try {
                        return await this.fetchOpenAlexResults(semanticQuery, {
                          semanticIntentPayload,
                          llmSemanticIntent,
                          semanticSourceQueryPlan,
                        });
                      } finally {
                        this.$emit("translating", false, this.index, "translatingStepOpenAlex");
                      }
                    },
                  });
                }
                if (useElicitSource) {
                  semanticSourceRequests.push({
                    source: "elicit",
                    run: async () => {
                      this.$emit("translating", true, this.index, "translatingStepElicit");
                      try {
                        return await this.fetchElicitResults(semanticQuery, {
                          semanticIntentPayload,
                          llmSemanticIntent,
                          semanticSourceQueryPlan,
                        });
                      } finally {
                        this.$emit("translating", false, this.index, "translatingStepElicit");
                      }
                    },
                  });
                }
                const semanticApiOutcomes = await Promise.allSettled(
                  semanticSourceRequests.map((request) => request.run())
                );

                semanticApiOutcomes.forEach((outcome, index) => {
                  const request = semanticSourceRequests[index];
                  if (!request) return;
                  if (outcome.status === "fulfilled") {
                    sourceResults.push(outcome.value);
                  } else {
                    sourceErrors.push(String(outcome.reason || ""));
                    sourceResults.push(
                      this.buildSourceErrorResult(request.source, semanticQuery, outcome.reason)
                    );
                  }
                });

                const lexicalRescuePubmedQuery = isPubMedSourceSelected && allowPubmedQueryGeneration
                  ? pubmedGeneratedQuery || String(newTag || "").trim()
                  : "";
                if (!isPubMedSourceSelected) {
                  semanticRescueMeta = {
                    triggered: false,
                    triggerReason: "skipped-pubmed-not-selected",
                    pubmedQuery: "",
                  };
                  this.logSearchFlowDebugInfo("PubMed lexical rescue skipped", semanticRescueMeta);
                } else if (shouldFetchPubmedSource) {
                  const requestPayload = {
                    query: pubmedSourceQuery,
                    limit: this.getConfiguredSemanticSourceLimit("pubmedBestMatch", 200),
                  };
                  this.$emit("translating", true, this.index, "translatingStepPubMedBestMatch");
                  try {
                    const pubmedSourceResult = await this.measureAsync(
                      "PubMed best match request",
                      () =>
                        this.fetchPubMedBestMatchSourceResult({
                          pubmedQuery: pubmedSourceQuery,
                        }),
                      requestPayload
                    );
                    sourceResults.push(pubmedSourceResult);
                    await this.logSearchFlowDebugSourceResultGroup(
                      "PubMed",
                      requestPayload,
                      pubmedSourceResult,
                      pubmedSourceResult,
                      {
                        mode: "rerank-source",
                      }
                    );
                  } catch (error) {
                    sourceErrors.push(String(error || ""));
                    sourceResults.push(
                      this.buildSourceErrorResult("pubmed", pubmedSourceQuery, error)
                    );
                    this.logSearchFlowDebugWarn("PubMed source retrieval failed", {
                      query: pubmedSourceQuery,
                      error: String(error || ""),
                    });
                  } finally {
                    this.$emit("translating", false, this.index, "translatingStepPubMedBestMatch");
                  }
                }
                if (shouldFetchPubmedSource) {
                  semanticRescueMeta = {
                    triggered: false,
                    triggerReason: "skipped-standard-pubmed-retrieval",
                    pubmedQuery: pubmedSourceQuery,
                  };
                  this.logSearchFlowDebugInfo("PubMed lexical rescue skipped", semanticRescueMeta);
                } else if (isPubMedSourceSelected) {
                  const rescueDecision = this.shouldRunPubMedLexicalRescue({
                    sourceResults,
                    semanticQuery: semanticQuery || newTag,
                    pubmedQuery: lexicalRescuePubmedQuery,
                    usePubMedBestMatch: isPubMedSourceSelected,
                  });
                  semanticRescueMeta = {
                    ...(rescueDecision?.diagnostics || {}),
                    activeSourceFilters: {
                      openAlex:
                        semanticSourceQueryPlan?.openAlex?.filters &&
                        typeof semanticSourceQueryPlan.openAlex.filters === "object"
                          ? semanticSourceQueryPlan.openAlex.filters
                          : {},
                      elicit:
                        semanticSourceQueryPlan?.elicit?.filters &&
                        typeof semanticSourceQueryPlan.elicit.filters === "object"
                          ? semanticSourceQueryPlan.elicit.filters
                          : {},
                    },
                    triggered: rescueDecision?.shouldRun === true,
                    triggerReason: String(rescueDecision?.reason || "").trim(),
                  };
                  console.info("[PubMedLexicalRescue] Trigger evaluation.", semanticRescueMeta);
                  this.logSearchFlowDebugInfo("PubMed lexical rescue trigger", semanticRescueMeta);
                  if (rescueDecision?.shouldRun === true) {
                    try {
                      const rescueResult = await this.measureAsync(
                        "PubMed lexical rescue",
                        () =>
                          this.fetchPubMedLexicalRescueResult({
                            semanticQuery: semanticQuery || newTag,
                            pubmedQuery: lexicalRescuePubmedQuery,
                            sourceResults,
                            triggerReason: rescueDecision.reason,
                          }),
                        rescueDecision?.diagnostics || {}
                      );
                      semanticRescueMeta = {
                        ...semanticRescueMeta,
                        ...(rescueResult?.rescueMeta || {}),
                      };
                      sourceResults.push(rescueResult);
                      console.info("[PubMedLexicalRescue] Rescue result accepted.", semanticRescueMeta);
                      this.logSearchFlowDebugInfo("PubMed lexical rescue accepted", semanticRescueMeta);
                    } catch (error) {
                      semanticRescueMeta = {
                        ...semanticRescueMeta,
                        error: String(error || ""),
                      };
                      console.warn("[PubMedLexicalRescue] Rescue request failed.", {
                        ...semanticRescueMeta,
                      });
                      this.logSearchFlowDebugWarn("PubMed lexical rescue failed", semanticRescueMeta);
                    }
                  }
                }
              }
            );
          }
        }

        const { reranked, rerankDiagnostics } = await this.runSearchFlowDebugSection(
          `05 Merge and rerank • ${String(newTag || "").trim()}`,
          async () => {
            const rerankedValue = rerankSemanticCandidates(sourceResults, runtimeConfig?.rerankConfig || {});
            const rerankDiagnosticsValue =
              rerankedValue?.diagnostics && typeof rerankedValue.diagnostics === "object"
                ? rerankedValue.diagnostics
                : {};
            console.info("[RerankFlow] Source result summary before merge.", {
              sources: rerankDiagnosticsValue.sourceSummary || [],
              sourceStats: rerankDiagnosticsValue.sourceStats || {},
              rerankMode: rerankedValue?.rerankMode || "multi",
              rerankConfig: rerankDiagnosticsValue.rerankConfig || {},
            });
            console.info("[RerankFlow] Merge summary.", {
              rawCandidateCount: sourceResults.reduce(
                (sum, sourceResult) =>
                  sum + (Array.isArray(sourceResult?.candidates) ? sourceResult.candidates.length : 0),
                0
              ),
              mergedCandidateCount: Array.isArray(rerankedValue?.candidates) ? rerankedValue.candidates.length : 0,
              overlapSummary: rerankDiagnosticsValue.overlapSummary || {},
              rerankMode: rerankedValue?.rerankMode || "multi",
              semanticRescueMeta,
            });
            this.logSearchFlowDebugInfo("Rerank summary", {
              sources: rerankDiagnosticsValue.sourceSummary || [],
              sourceStats: rerankDiagnosticsValue.sourceStats || {},
              overlapSummary: rerankDiagnosticsValue.overlapSummary || {},
              rerankMode: rerankedValue?.rerankMode || "multi",
              semanticRescueMeta,
            });
            this.logSearchFlowDebugTable(
              "Top ranked candidates",
              (Array.isArray(rerankedValue?.candidates) ? rerankedValue.candidates : [])
                .slice(0, 10)
                .map((candidate) => ({
                  ...summarizeSearchFlowRecord(candidate),
                  sources: Array.isArray(candidate?.sources) ? candidate.sources.join(", ") : "",
                  combinedScore: Number(candidate?.combinedScore || 0),
                  bestRank: Number(candidate?.bestRank || 0),
                  sourceCount: Number(candidate?.sourceCount || 0),
                }))
            );
            return {
              reranked: rerankedValue,
              rerankDiagnostics: rerankDiagnosticsValue,
            };
          }
        );
        const semanticScholarPmids = reranked.pmids;
        const semanticScholarDois = reranked.dois;
        const semanticScholarCandidates = Array.isArray(reranked.candidates)
          ? reranked.candidates
          : [];
        const semanticScholarError = sourceErrors.filter(Boolean).join("\n");
        const useSemanticScholar =
          semanticScholarPmids.length > 0 ||
          semanticScholarDois.length > 0 ||
          semanticScholarCandidates.length > 0;

        return {
          semanticFlowType: "deferred",
          isPendingSemanticSearch: false,
          useSemanticScholar,
          includeTranslatedTextInQuery:
            allowPubmedQueryGeneration && this.searchWithPubMedBestMatch === true,
          semanticScholarQuery: semanticQuery || newTag,
          semanticIntentPayload,
          llmSemanticIntent,
          semanticIntentMeta,
          semanticSourceQueryPlan,
          semanticRescueMeta,
          semanticRerankDiagnostics: this.isSearchFlowDebugEnabled() ? rerankDiagnostics : null,
          semanticMergeDebug: this.isSearchFlowDebugEnabled()
            ? {
                ...(rerankDiagnostics?.mergeSummary || {}),
                mergeEvents: Array.isArray(rerankDiagnostics?.mergeEvents)
                  ? rerankDiagnostics.mergeEvents
                  : [],
              }
            : null,
          pubmedGeneratedQuery,
          semanticScholarPmids,
          semanticScholarDois,
          semanticScholarCandidates,
          semanticSourceResults: sourceResults,
          semanticScholarError,
        };
      },
      async preparePendingSemanticTags() {
        const pendingTags = (Array.isArray(this.selected) ? this.selected : []).filter(
          (item) => item?.isPendingSemanticSearch === true
        );
        if (pendingTags.length === 0) {
          return;
        }

        this.isLoading = true;
        try {
          const resolvedTags = await Promise.all(
            pendingTags.map(async (tag) => {
              const inputText = String(tag?.preTranslation || tag?.name || "").trim();
              if (!inputText) {
                return { tag, resolvedState: { isPendingSemanticSearch: false } };
              }
              const resolvedState = await this.buildResolvedSemanticTagState(inputText, tag);
              return { tag, resolvedState };
            })
          );
          resolvedTags.forEach(({ tag, resolvedState }) => {
            Object.assign(tag, resolvedState);
            if (tag?.isTranslated === true) {
              tag.includeTranslatedTextInQuery = true;
            }
          });
          this.input(this.selected, -1);
        } finally {
          this.$emit("translating", false, this.index);
          this.isLoading = false;
        }
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
        const useAiTranslationOptions = this.searchWithAI;
        const usePubmedQuerySource = this.searchWithPubMedQuery;
        const useSemanticScholarSource = this.searchWithSemanticScholar;
        const useOpenAlexSource = this.isOpenAlexSemanticSearchEnabled();
        const useElicitSource = this.searchWithElicit;
        const useAnyIdSource =
          useSemanticScholarSource ||
          useOpenAlexSource ||
          useElicitSource;
        const overallFlowStartedAt = this.getTimingNow();

        if (useAiTranslationOptions && usePubmedQuerySource && !useAnyIdSource) {
          this.isLoading = true;
          this.$emit("translating", true, this.index, "translatingStepSearchString");

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

          let translated;
          try {
            await new Promise((resolve) => setTimeout(resolve, 10));
            translated = await this.buildPubMedSearchStringFromFreeText(newTag);
          } catch (error) {
            console.error("[PubMedTranslateFlow] Search string generation failed.", error);
            this.$emit("translating", false, this.index);
            this.isLoading = false;
            return;
          }

          tag = useAnyIdSource
            ? this.buildTranslatedPendingSemanticTag(translated, newTag, {
                showOriginalInput: true,
              })
            : {
                id: `__custom__:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
                name: translated,
                searchStrings: { normal: [translated] },
                preString: this.getString("manualInputTermTranslated") + ":\u00A0",
                isCustom: true,
                isTranslated: true,
                preTranslation: newTag,
                pubmedGeneratedQuery: translated,
                tooltip: {
                  dk:
                    customInputTagTooltip.dk +
                    " &ndash; denne søgning er oversat fra: <strong>" +
                    newTag +
                    "</strong>",
                  en:
                    customInputTagTooltip.en +
                    " &ndash; this search is translated from: <strong>" +
                    newTag +
                    "</strong>",
                },
              };
          console.info("[Timing] PubMed query source total flow", {
            input: newTag,
            elapsedMs: this.roundTimingMs(this.getTimingNow() - overallFlowStartedAt),
          });
          this.$emit("translating", false, this.index);
          this.isLoading = false;
        } else if (useAnyIdSource) {
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
          await new Promise((resolve) => setTimeout(resolve, 20));
          tag = this.buildPendingSemanticTag(newTag);
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
        const isDeferredSemanticTag = oldTag?.semanticFlowType === "deferred";
        const normalizedPreTranslation =
          typeof newTag?.name === "string" && newTag.name.trim()
            ? newTag.name
            : oldTag?.preTranslation || "";
        const shouldRestartDeferredSemanticFlow =
          this.searchWithSemanticScholar ||
          this.isOpenAlexSemanticSearchEnabled() ||
          this.searchWithElicit;

        const updatedTag = isDeferredSemanticTag
          ? {
              ...newTag,
              preTranslation: normalizedPreTranslation,
              semanticFlowType: "deferred",
              isPendingSemanticSearch: shouldRestartDeferredSemanticFlow,
              useSemanticScholar: false,
              semanticScholarQuery: "",
              semanticIntentPayload: null,
              llmSemanticIntent: null,
              semanticIntentMeta: null,
              semanticSourceQueryPlan: null,
              pubmedGeneratedQuery: "",
              semanticScholarPmids: [],
              semanticScholarDois: [],
              semanticScholarCandidates: [],
              semanticSourceResults: [],
              semanticRerankDiagnostics: null,
              semanticMergeDebug: null,
              semanticScholarError: "",
              includeTranslatedTextInQuery: this.searchWithPubMedBestMatch === true,
            }
          : {
              ...newTag,
              preTranslation: normalizedPreTranslation,
            };

        this.selected.splice(tagIndex, 1, updatedTag);
        this.clearShownItems();
        this.input(this.selected);
      },
      isOpenAlexSemanticSearchEnabled() {
        return this.searchWithOpenAlex === true;
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
        return this.translateByPrompt(wordsToTranslate, searchTranslationPrompt);
      },
      async translateSemanticScholarSearch(wordsToTranslate) {
        return this.translateByPrompt(wordsToTranslate, semanticScholarSearchPrompt);
      },
      getSemanticHintValues(input) {
        if (!input) return [];
        if (Array.isArray(input)) {
          return input
            .map((value) => String(value || "").trim())
            .filter((value) => value !== "");
        }
        if (typeof input === "object") {
          return Object.values(input).flatMap((value) => this.getSemanticHintValues(value));
        }
        const value = String(input || "").trim();
        return value ? [value] : [];
      },
      getItemSemanticHints(item) {
        if (!item || typeof item !== "object") return [];
        const directHints = this.getSemanticHintValues(item?.semanticConfig?.softHints);
        const providerHints = this.getSemanticHintValues(item.semanticQueryHints);
        const combined = [...directHints, ...providerHints];
        const seen = new Set();
        return combined.filter((value) => {
          const key = value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      },
      buildSemanticIntentPayload(freeTextInput) {
        const selectedItems = Array.isArray(this.selected) ? this.selected : [];
        const labels = selectedItems
          .map((item) => {
            const localized = item?.translations?.[this.language];
            const fallback = item?.preTranslation || item?.name || "";
            return String(localized || fallback || "").trim();
          })
          .filter((value) => value !== "");
        const semanticHints = selectedItems.flatMap((item) => this.getItemSemanticHints(item));
        const globalSemanticContext =
          this.semanticWordedIntentContext && typeof this.semanticWordedIntentContext === "object"
            ? this.semanticWordedIntentContext
            : {};
        return {
          freeTextInput: String(freeTextInput || "").trim(),
          language: String(this.language || "dk").trim(),
          domain: String(this.currentDomain || "").trim(),
          selectedTopics: Array.isArray(globalSemanticContext.selectedTopicsEnglish)
            ? globalSemanticContext.selectedTopicsEnglish
            : this.isFilterDropdown
            ? []
            : labels,
          selectedLimits: Array.isArray(globalSemanticContext.selectedLimitsEnglish)
            ? globalSemanticContext.selectedLimitsEnglish
            : this.isFilterDropdown
            ? labels
            : [],
          selectedTopicIntent: Array.isArray(globalSemanticContext.selectedTopicIntentEnglish)
            ? globalSemanticContext.selectedTopicIntentEnglish
            : [],
          selectedSemanticLimitIntent: Array.isArray(globalSemanticContext.selectedSemanticLimitIntentEnglish)
            ? globalSemanticContext.selectedSemanticLimitIntentEnglish
            : [],
          semanticWordedIntent: String(globalSemanticContext.semanticWordedIntent || "").trim(),
          semanticCoreText: String(globalSemanticContext.semanticCoreText || "").trim(),
          semanticBlocks: Array.isArray(globalSemanticContext.semanticBlocks)
            ? globalSemanticContext.semanticBlocks
            : [],
          sourceSpecificContext:
            globalSemanticContext.sourceSpecificBlocks &&
            typeof globalSemanticContext.sourceSpecificBlocks === "object"
              ? globalSemanticContext.sourceSpecificBlocks
              : {},
          hardFilters:
            globalSemanticContext.hardFilters && typeof globalSemanticContext.hardFilters === "object"
              ? globalSemanticContext.hardFilters
              : {},
          sourceFilters:
            globalSemanticContext.sourceFilters && typeof globalSemanticContext.sourceFilters === "object"
              ? globalSemanticContext.sourceFilters
              : {},
          postValidation:
            globalSemanticContext.postValidation &&
            typeof globalSemanticContext.postValidation === "object"
              ? globalSemanticContext.postValidation
              : {},
          softHints: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(globalSemanticContext.softHintsEnglish)
                ? globalSemanticContext.softHintsEnglish
                : []),
              ...semanticHints,
            ],
            (value) => String(value || "").trim()
          ),
          excludedFromSemanticText: Array.isArray(globalSemanticContext.excludedFromSemanticText)
            ? globalSemanticContext.excludedFromSemanticText
            : [],
          untranslatedSelections: Array.isArray(globalSemanticContext.untranslatedSelections)
            ? globalSemanticContext.untranslatedSelections
            : [],
          semanticHints: {
            fromSelectedItems: semanticHints,
          },
          sourceSelection: {
            semanticScholar: this.searchWithSemanticScholar === true,
            openAlex: this.searchWithOpenAlex === true,
            elicit: this.searchWithElicit === true,
          },
        };
      },
      hashIntentKey(value) {
        const input = String(value || "");
        let hash = 0;
        for (let index = 0; index < input.length; index += 1) {
          hash = (hash << 5) - hash + input.charCodeAt(index);
          hash |= 0;
        }
        return `intent-${Math.abs(hash)}`;
      },
      getCachedSemanticIntent(cacheKey) {
        const entry = this.semanticIntentCache?.[cacheKey];
        if (!entry || typeof entry !== "object") return null;
        if (Number(entry.expiresAt || 0) <= Date.now()) {
          delete this.semanticIntentCache[cacheKey];
          return null;
        }
        return entry.value || null;
      },
      setCachedSemanticIntent(cacheKey, value) {
        if (!cacheKey) return;
        this.semanticIntentCache[cacheKey] = {
          value,
          expiresAt: Date.now() + SEMANTIC_INTENT_CACHE_TTL_MS,
        };
      },
      normalizeStringArray(value) {
        return (Array.isArray(value) ? value : [])
          .map((entry) => String(entry || "").trim())
          .filter((entry) => entry !== "");
      },
      normalizeSemanticQueryText(value) {
        return String(value || "")
          .replace(/\s+/g, " ")
          .trim();
      },
      normalizeSemanticSourceFormatValue(value) {
        const normalized = String(value || "").trim().toLowerCase();
        if (!normalized) return "";
        const compact = normalized.replace(/[\s_-]+/g, "");
        const aliasMap = {
          journal: "journal",
          journalarticle: "journal",
          scientificarticle: "journal",
          peerreviewedjournalarticle: "journal",
          videnskabeligartikel: "journal",
          conference: "conference",
          conferenceabstract: "conference",
          conferencepaper: "conference",
          conferenceproceeding: "conference",
          konferenceabstract: "conference",
          konferencepublikation: "conference",
          preprint: "preprint",
          repositorypreprint: "preprint",
        };
        return aliasMap[compact] || normalized;
      },
      normalizeOpenAlexSourceTypeValue(value) {
        const normalized = this.normalizeSemanticSourceFormatValue(value);
        const aliasMap = {
          bookseries: "book series",
          journal: "journal",
          conference: "conference",
          ebookplatform: "ebook platform",
          other: "other",
          repository: "repository",
        };
        return (
          aliasMap[normalized] ||
          ([
            "book series",
            "journal",
            "conference",
            "ebook platform",
            "other",
            "repository",
          ].includes(normalized)
            ? normalized
            : "")
        );
      },
      normalizeOpenAlexWorkTypeValue(value) {
        const normalized = String(value || "").trim().toLowerCase();
        if (!normalized) return "";
        const compact = normalized.replace(/[\s_-]+/g, "");
        const aliasMap = {
          article: "article",
          book: "book",
          bookchapter: "book-chapter",
          dataset: "dataset",
          dissertation: "dissertation",
          review: "review",
          preprint: "preprint",
          editorial: "editorial",
          erratum: "erratum",
          letter: "letter",
          libguides: "libguides",
          other: "other",
          paratext: "paratext",
          peerreview: "peer-review",
          referenceentry: "reference-entry",
          report: "report",
          retraction: "retraction",
          standard: "standard",
          supplementarymaterials: "supplementary-materials",
        };
        return aliasMap[compact] || "";
      },
      normalizeOpenAlexPublicationYearFilterValue(value) {
        const normalized = String(value || "").trim();
        return /^\d{4}(?:-\d{4})?$/.test(normalized) ? normalized : "";
      },
      normalizeSemanticScholarPublicationTypeValue(value) {
        const trimmed = String(value || "").trim();
        if (!trimmed) return "";
        const compact = trimmed.toLowerCase().replace(/[\s_-]+/g, "");
        const canonicalMap = {
          review: "Review",
          metaanalysis: "Meta-Analysis",
          journalarticle: "JournalArticle",
          conference: "Conference",
          conferenceabstract: "Conference",
          conferencepaper: "Conference",
          conferenceproceeding: "Conference",
          preprint: "Preprint",
          repositorypreprint: "Preprint",
          casereport: "CaseReport",
          clinicaltrial: "ClinicalTrial",
          editorial: "Editorial",
          letter: "Letter",
        };
        return canonicalMap[compact] || trimmed;
      },
      normalizeSemanticScholarYearFilterValue(value) {
        const normalized = String(value || "").trim();
        return /^\d{4}(?:-\d{4})?$/.test(normalized) ? normalized : "";
      },
      normalizeSemanticScholarPublicationDateOrYearFilterValue(value) {
        const normalized = String(value || "").trim();
        if (!normalized) return "";
        return /^(\d{4}(?:-\d{2}(?:-\d{2})?)?)?(?::(\d{4}(?:-\d{2}(?:-\d{2})?)?)?)?$/.test(
          normalized
        )
          ? normalized
          : "";
      },
      normalizeElicitTypeTagValue(value) {
        const normalized = String(value || "").trim().toLowerCase();
        if (!normalized) return "";
        const compact = normalized.replace(/[\s_-]+/g, "");
        const aliasMap = {
          review: "Review",
          metaanalysis: "Meta-Analysis",
          systematicreview: "Systematic Review",
          rct: "RCT",
          randomizedcontrolledtrial: "RCT",
          randomisedcontrolledtrial: "RCT",
          longitudinal: "Longitudinal",
          longitudinalstudy: "Longitudinal",
          cohortstudy: "Longitudinal",
          cohortstudies: "Longitudinal",
        };
        return aliasMap[compact] || "";
      },
      dedupeNormalizedValues(values, normalizer = (entry) => String(entry || "").trim()) {
        const seen = new Set();
        return (Array.isArray(values) ? values : []).filter((entry) => {
          const normalized = normalizer(entry);
          if (!normalized) return false;
          const key = String(normalized).toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      },
      getCachedSemanticSourceResponse(cacheKey) {
        const entry = this.semanticSourceResponseCache?.[cacheKey];
        if (!entry || typeof entry !== "object") return null;
        if (Number(entry.expiresAt || 0) <= Date.now()) {
          delete this.semanticSourceResponseCache[cacheKey];
          return null;
        }
        return cloneDeep(entry.value || null);
      },
      setCachedSemanticSourceResponse(cacheKey, value) {
        if (!cacheKey) return;
        this.semanticSourceResponseCache[cacheKey] = {
          value: cloneDeep(value),
          expiresAt: Date.now() + SEMANTIC_SOURCE_RESPONSE_CACHE_TTL_MS,
        };
      },
      buildSemanticSourceCacheKey(source, params = {}) {
        return this.hashIntentKey(`source:${source}:${JSON.stringify(params)}`);
      },
      logSemanticSourceRequest(source, details = {}) {
        console.info(`[SemanticSourceRequest] ${String(source || "").trim()}`, {
          source: String(source || "").trim(),
          ...details,
        });
      },
      extractSourceSpecificHintList(value) {
        if (Array.isArray(value)) {
          return this.normalizeStringArray(value);
        }
        if (!value || typeof value !== "object") {
          return [];
        }
        return this.normalizeStringArray(value.hints || value.values || []);
      },
      normalizeSourceQueryPlanEntry(rawEntry, sourceKey, fallbackHints = []) {
        const entry = rawEntry && typeof rawEntry === "object" ? rawEntry : {};
        const fallbackHintList = this.normalizeStringArray(fallbackHints);
        const hints = this.dedupeNormalizedValues(
          [
            ...fallbackHintList,
            ...this.extractSourceSpecificHintList(entry.hints || entry.values || []),
          ],
          (value) => String(value || "").trim()
        );
        if (sourceKey === "semanticScholar") {
          const rawFilters = entry.filters && typeof entry.filters === "object" ? entry.filters : {};
          return {
            query: this.normalizeSemanticQueryText(entry.query || entry.searchQuery || ""),
            hints,
            filters: {
              publicationTypes: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.publicationTypes).map((value) =>
                  this.normalizeSemanticScholarPublicationTypeValue(value)
                ),
                (value) => String(value || "").trim().toLowerCase()
              ),
              publicationDateOrYear: this.normalizeSemanticScholarPublicationDateOrYearFilterValue(
                rawFilters.publicationDateOrYear
              ),
              year: this.normalizeSemanticScholarYearFilterValue(rawFilters.year),
            },
          };
        }
        if (sourceKey === "openAlex") {
          const rawFilters = entry.filters && typeof entry.filters === "object" ? entry.filters : {};
          return {
            query: this.normalizeSemanticQueryText(entry.query || entry.searchQuery || ""),
            hints,
            filters: {
              language: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.language).map((value) =>
                  this.normalizeOpenAlexLanguageFilterValue(value)
                ),
                (value) => value
              ),
              sourceType: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.sourceType).map((value) =>
                  this.normalizeOpenAlexSourceTypeValue(value)
                ),
                (value) => value
              ),
              workType: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.workType).map((value) =>
                  this.normalizeOpenAlexWorkTypeValue(value)
                ),
                (value) => value
              ),
            },
          };
        }
        if (sourceKey === "elicit") {
          const rawFilters = entry.filters && typeof entry.filters === "object" ? entry.filters : {};
          return {
            query: this.normalizeSemanticQueryText(entry.query || entry.searchQuery || ""),
            hints,
            filters: {
              typeTags: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.typeTags).map((value) =>
                  this.normalizeElicitTypeTagValue(value)
                ),
                (value) => value
              ),
              includeKeywords: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.includeKeywords),
                (value) => String(value || "").trim()
              ),
              excludeKeywords: this.dedupeNormalizedValues(
                this.normalizeStringArray(rawFilters.excludeKeywords),
                (value) => String(value || "").trim()
              ),
            },
          };
        }
        return {
          query: this.normalizeSemanticQueryText(entry.query || entry.searchQuery || ""),
          hints,
          filters: {},
        };
      },
      normalizeSemanticIntentOutput(raw) {
        const source = raw && typeof raw === "object" ? raw : {};
        const explicitSemanticIntent = String(source.semanticIntent || "").trim();
        const hardFilterHintsInput =
          source.hardFilterHints && typeof source.hardFilterHints === "object"
            ? source.hardFilterHints
            : {};
        const hardFilterHints = {
          publicationType: this.normalizeStringArray(hardFilterHintsInput.publicationType),
          studyDesign: this.normalizeStringArray(hardFilterHintsInput.studyDesign),
          ageGroup: this.normalizeStringArray(hardFilterHintsInput.ageGroup),
          language: this.normalizeStringArray(hardFilterHintsInput.language),
          sourceFormat: this.dedupeNormalizedValues(
            this.normalizeStringArray(hardFilterHintsInput.sourceFormat).map((value) =>
              this.normalizeSemanticSourceFormatValue(value)
            ),
            (value) => value
          ),
        };
        const openAlexLanguageCodes = new Set(
          hardFilterHints.language
            .map((entry) => this.normalizeOpenAlexLanguageFilterValue(entry))
            .filter(Boolean)
        );
        const softFilterHints = this.normalizeStringArray(source.softFilterHints);
        const sourceSpecificInput =
          source.sourceSpecificHints && typeof source.sourceSpecificHints === "object"
            ? source.sourceSpecificHints
            : {};
        const sourceQueryPlanInput =
          source.sourceQueryPlan && typeof source.sourceQueryPlan === "object"
            ? source.sourceQueryPlan
            : {};
        const sourceSpecificHints = {
          semanticScholar: this.extractSourceSpecificHintList(sourceSpecificInput.semanticScholar),
          openAlex: this.extractSourceSpecificHintList(sourceSpecificInput.openAlex).filter((entry) => {
            const normalizedLanguageCode = this.normalizeOpenAlexLanguageFilterValue(entry);
            if (!normalizedLanguageCode) return true;
            if (openAlexLanguageCodes.size === 0) return false;
            return !openAlexLanguageCodes.has(normalizedLanguageCode);
          }),
          elicit: this.extractSourceSpecificHintList(sourceSpecificInput.elicit),
        };
        const sourceQueryPlan = {
          semanticScholar: this.normalizeSourceQueryPlanEntry(
            sourceQueryPlanInput.semanticScholar || sourceSpecificInput.semanticScholar,
            "semanticScholar",
            sourceSpecificHints.semanticScholar
          ),
          openAlex: this.normalizeSourceQueryPlanEntry(
            sourceQueryPlanInput.openAlex || sourceSpecificInput.openAlex,
            "openAlex",
            sourceSpecificHints.openAlex
          ),
          elicit: this.normalizeSourceQueryPlanEntry(
            sourceQueryPlanInput.elicit || sourceSpecificInput.elicit,
            "elicit",
            sourceSpecificHints.elicit
          ),
        };
        const recoveredSemanticIntent =
          this.normalizeSemanticQueryText(sourceQueryPlan?.semanticScholar?.query) ||
          this.normalizeSemanticQueryText(sourceQueryPlan?.openAlex?.query) ||
          this.normalizeSemanticQueryText(sourceQueryPlan?.elicit?.query);
        const semanticIntent = explicitSemanticIntent || recoveredSemanticIntent;
        const semanticIntentSource = explicitSemanticIntent ? "semanticIntent" : recoveredSemanticIntent ? "sourceQueryPlan" : "";
        return {
          semanticIntent,
          semanticIntentSource,
          hardFilterHints,
          softFilterHints,
          sourceSpecificHints,
          sourceQueryPlan,
        };
      },
      parseSemanticIntentResponse(rawResponse) {
        const rawText = String(rawResponse || "").trim();
        if (!rawText) return null;
        const withoutCodeFence = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const startIndex = withoutCodeFence.indexOf("{");
        const endIndex = withoutCodeFence.lastIndexOf("}");
        if (startIndex < 0 || endIndex <= startIndex) {
          return null;
        }
        const candidateJson = withoutCodeFence.slice(startIndex, endIndex + 1);
        let parsed;
        try {
          parsed = JSON.parse(candidateJson);
        } catch {
          return null;
        }
        const normalized = this.normalizeSemanticIntentOutput(parsed);
        if (!normalized.semanticIntent) return null;
        return normalized;
      },
      collectSemanticHardFilters(semanticIntentPayload = {}) {
        const payloadHardFilters =
          semanticIntentPayload?.hardFilters && typeof semanticIntentPayload.hardFilters === "object"
            ? semanticIntentPayload.hardFilters
            : {};
        return {
          filterProfiles: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(payloadHardFilters.filterProfiles) ? payloadHardFilters.filterProfiles : []),
            ],
            (value) => String(value || "").trim()
          ),
          publicationTypes: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(payloadHardFilters.publicationTypes)
                ? payloadHardFilters.publicationTypes
                : []),
            ],
            (value) => String(value || "").trim()
          ),
          studyDesigns: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(payloadHardFilters.studyDesigns) ? payloadHardFilters.studyDesigns : []),
            ],
            (value) => String(value || "").trim()
          ),
          ageGroups: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(payloadHardFilters.ageGroups) ? payloadHardFilters.ageGroups : []),
            ],
            (value) => String(value || "").trim()
          ),
          languages: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(payloadHardFilters.languages) ? payloadHardFilters.languages : []),
            ].map((value) => this.normalizeOpenAlexLanguageFilterValue(value) || String(value || "").trim()),
            (value) => String(value || "").trim()
          ),
          sourceFormats: this.dedupeNormalizedValues(
            [
              ...(Array.isArray(payloadHardFilters.sourceFormats) ? payloadHardFilters.sourceFormats : []),
            ].map((value) => this.normalizeSemanticSourceFormatValue(value)),
            (value) => value
          ),
          publicationDateYears: Array.from(
            new Set(
              (Array.isArray(payloadHardFilters.publicationDateYears)
                ? payloadHardFilters.publicationDateYears
                : []
              )
                .map((value) => Number.parseInt(value, 10))
                .filter((value) => Number.isInteger(value) && value > 0)
            )
          ).sort((a, b) => a - b),
        };
      },
      mapSourceFormatsToOpenAlexFilters(sourceFormats = []) {
        const sourceTypeValues = [];
        const workTypeValues = [];
        (Array.isArray(sourceFormats) ? sourceFormats : []).forEach((value) => {
          const normalized = this.normalizeSemanticSourceFormatValue(value);
          if (normalized === "journal") {
            sourceTypeValues.push("journal");
          } else if (normalized === "conference") {
            sourceTypeValues.push("conference");
          } else if (normalized === "preprint") {
            workTypeValues.push("preprint");
          }
        });
        return {
          sourceType: this.dedupeNormalizedValues(sourceTypeValues, (value) => value),
          workType: this.dedupeNormalizedValues(workTypeValues, (value) => value),
        };
      },
      mapPublicationTypesToOpenAlexWorkTypes(publicationTypes = []) {
        const workTypes = [];
        (Array.isArray(publicationTypes) ? publicationTypes : []).forEach((value) => {
          const normalized = String(value || "").trim().toLowerCase();
          if (
            normalized === "systematic review" ||
            normalized === "meta-analysis" ||
            normalized === "review" ||
            normalized === "cochrane review"
          ) {
            workTypes.push("review");
          }
        });
        return this.dedupeNormalizedValues(
          workTypes.map((value) => this.normalizeOpenAlexWorkTypeValue(value)),
          (value) => value
        );
      },
      mapSourceFormatsToSemanticScholarPublicationTypes(sourceFormats = []) {
        const output = [];
        (Array.isArray(sourceFormats) ? sourceFormats : []).forEach((value) => {
          const normalized = this.normalizeSemanticSourceFormatValue(value);
          if (normalized === "journal") {
            output.push("JournalArticle");
          } else if (normalized === "conference") {
            output.push("Conference");
          } else if (normalized === "preprint") {
            output.push("Preprint");
          }
        });
        return this.dedupeNormalizedValues(
          output.map((value) => this.normalizeSemanticScholarPublicationTypeValue(value)),
          (value) => String(value || "").trim().toLowerCase()
        );
      },
      mapHardFiltersToSemanticScholarPublicationTypes(publicationTypes = []) {
        const output = [];
        (Array.isArray(publicationTypes) ? publicationTypes : []).forEach((value) => {
          const normalized = String(value || "").trim().toLowerCase();
          if (
            normalized === "review" ||
            normalized === "systematic review" ||
            normalized === "cochrane review"
          ) {
            output.push("Review");
          } else if (normalized === "meta-analysis") {
            output.push("Meta-Analysis");
          }
        });
        return this.dedupeNormalizedValues(
          output.map((value) => this.normalizeSemanticScholarPublicationTypeValue(value)),
          (value) => String(value || "").trim().toLowerCase()
        );
      },
      mapHardFiltersToElicitTypeTags(hardFilters = {}) {
        const output = [];
        const filterProfiles = Array.isArray(hardFilters?.filterProfiles) ? hardFilters.filterProfiles : [];
        const publicationTypes = Array.isArray(hardFilters?.publicationTypes)
          ? hardFilters.publicationTypes
          : [];
        const studyDesigns = Array.isArray(hardFilters?.studyDesigns) ? hardFilters.studyDesigns : [];
        if (filterProfiles.includes("systematic-review-only")) {
          output.push("Systematic Review");
        }
        publicationTypes.forEach((value) => {
          const normalized = String(value || "").trim().toLowerCase();
          if (normalized === "systematic review") {
            output.push("Systematic Review");
          } else if (normalized === "meta-analysis") {
            output.push("Meta-Analysis");
          } else if (normalized === "review" || normalized === "cochrane review") {
            output.push("Review");
          }
        });
        studyDesigns.forEach((value) => {
          const normalized = String(value || "").trim().toLowerCase();
          if (
            normalized === "randomized controlled trial" ||
            normalized === "randomised controlled trial" ||
            normalized === "rct"
          ) {
            output.push("RCT");
          } else if (
            normalized === "cohort study" ||
            normalized === "cohort studies" ||
            normalized === "longitudinal study" ||
            normalized === "longitudinal"
          ) {
            output.push("Longitudinal");
          }
        });
        return this.dedupeNormalizedValues(
          output.map((value) => this.normalizeElicitTypeTagValue(value)),
          (value) => value
        );
      },
      buildElicitFallbackQuery(value) {
        const normalized = this.normalizeSemanticQueryText(value);
        if (!normalized) return "";
        if (/\?$/.test(normalized) || /^(what|how|which|when|why|does|do|is|are|can)\b/i.test(normalized)) {
          return normalized;
        }
        return `What is known about ${normalized}?`;
      },
      buildSemanticSourceQueryPlan({
        semanticQuery = "",
        semanticIntentPayload = null,
        llmSemanticIntent = null,
        fallbackQuery = "",
      } = {}) {
        const payload =
          semanticIntentPayload && typeof semanticIntentPayload === "object" ? semanticIntentPayload : {};
        const llmIntent =
          llmSemanticIntent && typeof llmSemanticIntent === "object" ? llmSemanticIntent : {};
        const hardFilters = this.collectSemanticHardFilters(payload);
        const payloadSourceFilters =
          payload?.sourceFilters && typeof payload.sourceFilters === "object" ? payload.sourceFilters : {};
        const payloadOpenAlexFilters =
          payloadSourceFilters?.openAlex && typeof payloadSourceFilters.openAlex === "object"
            ? payloadSourceFilters.openAlex
            : {};
        const payloadSemanticScholarFilters =
          payloadSourceFilters?.semanticScholar &&
          typeof payloadSourceFilters.semanticScholar === "object"
            ? payloadSourceFilters.semanticScholar
            : {};
        const payloadElicitFilters =
          payloadSourceFilters?.elicit && typeof payloadSourceFilters.elicit === "object"
            ? payloadSourceFilters.elicit
            : {};
        const sourceSpecificContext =
          payload?.sourceSpecificContext && typeof payload.sourceSpecificContext === "object"
            ? payload.sourceSpecificContext
            : {};
        const llmPlan =
          llmIntent?.sourceQueryPlan && typeof llmIntent.sourceQueryPlan === "object"
            ? llmIntent.sourceQueryPlan
            : {};
        const commonQuery =
          this.normalizeSemanticQueryText(semanticQuery) ||
          this.normalizeSemanticQueryText(payload.semanticCoreText) ||
          this.normalizeSemanticQueryText(fallbackQuery);
        const openAlexSourceFormatFilters = this.mapSourceFormatsToOpenAlexFilters(
          hardFilters.sourceFormats
        );
        const fallbackOpenAlexWorkTypes = this.dedupeNormalizedValues(
          [
            ...openAlexSourceFormatFilters.workType,
            ...this.mapPublicationTypesToOpenAlexWorkTypes(hardFilters.publicationTypes),
          ],
          (value) => value
        );
        const configuredOpenAlexWorkTypes = this.dedupeNormalizedValues(
          (Array.isArray(payloadOpenAlexFilters.workType) ? payloadOpenAlexFilters.workType : []).map((value) =>
            this.normalizeOpenAlexWorkTypeValue(value)
          ),
          (value) => value
        );
        const openAlexWorkTypes = this.dedupeNormalizedValues(
          [
            ...(configuredOpenAlexWorkTypes.length > 0
              ? configuredOpenAlexWorkTypes
              : fallbackOpenAlexWorkTypes),
          ],
          (value) => value
        );
        const fallbackOpenAlexSourceTypes = this.dedupeNormalizedValues(
          [...openAlexSourceFormatFilters.sourceType],
          (value) => value
        );
        const configuredOpenAlexSourceTypes = this.dedupeNormalizedValues(
          (Array.isArray(payloadOpenAlexFilters.sourceType) ? payloadOpenAlexFilters.sourceType : []).map((value) =>
            this.normalizeOpenAlexSourceTypeValue(value)
          ),
          (value) => value
        );
        const openAlexSourceTypes = this.dedupeNormalizedValues(
          [
            ...(configuredOpenAlexSourceTypes.length > 0
              ? configuredOpenAlexSourceTypes
              : fallbackOpenAlexSourceTypes),
          ],
          (value) => value
        );
        const fallbackOpenAlexLanguages = hardFilters.languages.map((value) =>
          this.normalizeOpenAlexLanguageFilterValue(value)
        );
        const configuredOpenAlexLanguages = this.dedupeNormalizedValues(
          (Array.isArray(payloadOpenAlexFilters.language) ? payloadOpenAlexFilters.language : []).map((value) =>
            this.normalizeOpenAlexLanguageFilterValue(value)
          ),
          (value) => value
        );
        const openAlexLanguages = this.dedupeNormalizedValues(
          [
            ...(configuredOpenAlexLanguages.length > 0
              ? configuredOpenAlexLanguages
              : fallbackOpenAlexLanguages),
          ],
          (value) => value
        );
        const openAlexPublicationYear =
          this.normalizeOpenAlexPublicationYearFilterValue(payloadOpenAlexFilters.publicationYear) ||
          buildOpenAlexPublicationYearFilter(hardFilters.publicationDateYears);
        const semanticScholarContextQuery = this.normalizeSemanticQueryText(
          (Array.isArray(sourceSpecificContext.semanticScholar)
            ? sourceSpecificContext.semanticScholar
            : []
          ).join(". ")
        );
        const openAlexContextQuery = this.normalizeSemanticQueryText(
          (Array.isArray(sourceSpecificContext.openAlex) ? sourceSpecificContext.openAlex : []).join(". ")
        );
        const elicitContextQuery = this.normalizeSemanticQueryText(
          (Array.isArray(sourceSpecificContext.elicit) ? sourceSpecificContext.elicit : []).join(". ")
        );
        const semanticScholarQuery =
          this.normalizeSemanticQueryText(llmPlan?.semanticScholar?.query) ||
          commonQuery ||
          semanticScholarContextQuery;
        const fallbackSemanticScholarPublicationTypes =
          this.mapHardFiltersToSemanticScholarPublicationTypes(hardFilters.publicationTypes);
        const fallbackSemanticScholarFormatProxyPublicationTypes =
          this.mapSourceFormatsToSemanticScholarPublicationTypes(hardFilters.sourceFormats);
        const configuredSemanticScholarPublicationTypes = this.dedupeNormalizedValues(
          (
            Array.isArray(payloadSemanticScholarFilters.publicationTypes)
              ? payloadSemanticScholarFilters.publicationTypes
              : []
          ).map((value) => this.normalizeSemanticScholarPublicationTypeValue(value)),
          (value) => String(value || "").trim().toLowerCase()
        );
        const semanticScholarPublicationTypes = this.dedupeNormalizedValues(
          [
            ...configuredSemanticScholarPublicationTypes,
            ...fallbackSemanticScholarPublicationTypes,
            ...fallbackSemanticScholarFormatProxyPublicationTypes,
          ],
          (value) => String(value || "").trim().toLowerCase()
        );
        const semanticScholarPublicationDateOrYear =
          this.normalizeSemanticScholarPublicationDateOrYearFilterValue(
            payloadSemanticScholarFilters.publicationDateOrYear
          );
        const semanticScholarYear =
          this.normalizeSemanticScholarYearFilterValue(payloadSemanticScholarFilters.year) ||
          buildOpenAlexPublicationYearFilter(hardFilters.publicationDateYears);
        const openAlexQuery =
          this.normalizeSemanticQueryText(llmPlan?.openAlex?.query) ||
          commonQuery ||
          openAlexContextQuery;
        const elicitBaseQuery =
          this.normalizeSemanticQueryText(llmPlan?.elicit?.query) ||
          commonQuery ||
          this.normalizeSemanticQueryText(payload.semanticWordedIntent) ||
          elicitContextQuery;
        const fallbackElicitTypeTags = this.mapHardFiltersToElicitTypeTags(hardFilters);
        const configuredElicitTypeTags = this.dedupeNormalizedValues(
          (Array.isArray(payloadElicitFilters.typeTags) ? payloadElicitFilters.typeTags : []).map((value) =>
            this.normalizeElicitTypeTagValue(value)
          ),
          (value) => value
        );
        return {
          semanticScholar: {
            query: semanticScholarQuery,
            hints: Array.isArray(llmPlan?.semanticScholar?.hints) ? llmPlan.semanticScholar.hints : [],
            filters: {
              publicationTypes: semanticScholarPublicationTypes,
              publicationDateOrYear: semanticScholarPublicationDateOrYear,
              year: semanticScholarYear,
            },
          },
          openAlex: {
            query: openAlexQuery,
            hints: Array.isArray(llmPlan?.openAlex?.hints) ? llmPlan.openAlex.hints : [],
            filters: {
              language: openAlexLanguages,
              sourceType: openAlexSourceTypes,
              workType: openAlexWorkTypes,
              publicationYear: openAlexPublicationYear,
            },
          },
          elicit: {
            query: this.buildElicitFallbackQuery(elicitBaseQuery),
            hints: Array.isArray(llmPlan?.elicit?.hints) ? llmPlan.elicit.hints : [],
            filters: {
              typeTags: this.dedupeNormalizedValues(
                [
                  ...(configuredElicitTypeTags.length > 0 ? configuredElicitTypeTags : fallbackElicitTypeTags),
                ],
                (value) => value
              ),
              includeKeywords: this.dedupeNormalizedValues(
                [
                  ...(Array.isArray(payloadElicitFilters.includeKeywords)
                    ? payloadElicitFilters.includeKeywords
                    : []),
                ],
                (value) => String(value || "").trim()
              ),
              excludeKeywords: this.dedupeNormalizedValues(
                [
                  ...(Array.isArray(payloadElicitFilters.excludeKeywords)
                    ? payloadElicitFilters.excludeKeywords
                    : []),
                ],
                (value) => String(value || "").trim()
              ),
            },
          },
        };
      },
      async deriveSemanticQueryForSources(freeTextInput) {
        const semanticIntentPayload = this.buildSemanticIntentPayload(freeTextInput);
        const promptVersion = "phase2-v2";
        const cacheKey = this.hashIntentKey(
          `${promptVersion}:${JSON.stringify(semanticIntentPayload)}`
        );
        const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const cached = this.getCachedSemanticIntent(cacheKey);
        if (cached) {
          console.info("[SemanticIntentFlow] Using cached semantic intent.", {
            requestId,
            cacheKey,
            fallbackUsed: false,
          });
          return {
            semanticQuery: cached.semanticIntent,
            semanticIntentPayload,
            llmSemanticIntent: cached,
            semanticSourceQueryPlan: this.buildSemanticSourceQueryPlan({
              semanticQuery: cached.semanticIntent,
              semanticIntentPayload,
              llmSemanticIntent: cached,
              fallbackQuery: freeTextInput,
            }),
            semanticIntentMeta: {
              requestId,
              cacheHit: true,
              fallbackUsed: false,
              promptVersion,
            },
          };
        }

        let parsedIntent = null;
        let parseAttempts = 0;
        const maxParseAttempts = 2;
        while (parseAttempts < maxParseAttempts && !parsedIntent) {
          parseAttempts += 1;
          const responseText = await this.translateByPrompt(
            JSON.stringify(semanticIntentPayload),
            semanticIntentPrompt
          );
          parsedIntent = this.parseSemanticIntentResponse(responseText);
        }

        if (!parsedIntent) {
          const fallbackQuery = await this.translateSemanticScholarSearch(freeTextInput);
          const normalizedFallback = String(fallbackQuery || freeTextInput || "").trim();
          console.info("[SemanticIntentFlow] Falling back to semantic query translation.", {
            requestId,
            parseAttempts,
          });
          return {
            semanticQuery: normalizedFallback,
            semanticIntentPayload,
            llmSemanticIntent: null,
            semanticSourceQueryPlan: this.buildSemanticSourceQueryPlan({
              semanticQuery: normalizedFallback,
              semanticIntentPayload,
              llmSemanticIntent: null,
              fallbackQuery: freeTextInput,
            }),
            semanticIntentMeta: {
              requestId,
              cacheHit: false,
              fallbackUsed: true,
              parseAttempts,
              promptVersion,
            },
          };
        }

        this.setCachedSemanticIntent(cacheKey, parsedIntent);
        if (parsedIntent.semanticIntentSource === "sourceQueryPlan") {
          console.info("[SemanticIntentFlow] Recovered semantic intent from sourceQueryPlan.", {
            requestId,
            parseAttempts,
            semanticIntent: parsedIntent.semanticIntent,
          });
        }
        console.info("[SemanticIntentFlow] Intent generated.", {
          requestId,
          cacheKey,
          fallbackUsed: false,
          parseAttempts,
          semanticIntent: parsedIntent.semanticIntent,
        });
        return {
          semanticQuery: parsedIntent.semanticIntent,
          semanticIntentPayload,
          llmSemanticIntent: parsedIntent,
          semanticSourceQueryPlan: this.buildSemanticSourceQueryPlan({
            semanticQuery: parsedIntent.semanticIntent,
            semanticIntentPayload,
            llmSemanticIntent: parsedIntent,
            fallbackQuery: freeTextInput,
          }),
          semanticIntentMeta: {
            requestId,
            cacheHit: false,
            fallbackUsed: false,
            parseAttempts,
            promptVersion,
          },
        };
      },
      async translateByPrompt(wordsToTranslate, promptConfig) {
        const openAiServiceUrl = this.appSettings.openAi.baseUrl + "/api/TranslateTitle";
        const localePrompt = getPromptForLocale(promptConfig, "dk");
        const logLabel =
          promptConfig?.text?.format?.type === "json_schema"
            ? "SemanticIntent Request"
            : "TranslateSearch Request";

        const requestBody = {
          prompt: localePrompt,
          title: wordsToTranslate,
          client: this.appSettings.client,
        };

        console.info(
          `|${logLabel}|\n\n|Words to translate|\n${wordsToTranslate}\n\n|Prompt text|\n${localePrompt.prompt}\n`
        );

        try {
          let answer = "";
          const translationController = new AbortController();
          let timeoutId = null;
          let response = null;
          try {
            timeoutId = setTimeout(
              () => translationController.abort(),
              TRANSLATION_REQUEST_TIMEOUT_MS
            );
            response = await fetch(openAiServiceUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
              signal: translationController.signal,
            });
          } finally {
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
            }
          }

          if (!response || !response.ok) {
            let errorBody;
            try {
              errorBody = response ? await response.json() : "no response";
            } catch {
              errorBody = response ? await response.text() : "no response";
            }
            throw Error(typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody));
          }

          if (!response.body || typeof TextDecoderStream === "undefined") {
            const fallbackText = await response.text();
            return String(fallbackText || "").trim() || wordsToTranslate;
          }

          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

          let done = false;
          try {
            while (!done && !this.stopGeneration) {
              const { done: readerDone, value } = await reader.read();
              done = readerDone;
              if (value) {
                answer += value;
              }
            }
          } finally {
            try {
              await reader.cancel();
            } catch {
              // Ignore cleanup errors from aborted/closed streams.
            }
            reader.releaseLock();
          }
          return answer;
        } catch (error) {
          this.text = "An unknown error occurred: \n" + error.toString();
          return wordsToTranslate;
        }
      },
      getConfiguredSemanticSourceLimit(sourceKey, fallback) {
        const configuredLimit = Number(runtimeConfig?.semanticSourceLimits?.[sourceKey]);
        if (Number.isFinite(configuredLimit) && configuredLimit > 0) {
          return Math.floor(configuredLimit);
        }
        return fallback;
      },
      normalizePmidValue(value) {
        const pmid = String(value || "").trim();
        return /^[0-9]+$/.test(pmid) ? pmid : "";
      },
      normalizeDoiValue(value) {
        const normalized = String(value || "")
          .trim()
          .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
          .replace(/^doi:\s*/i, "");
        return normalized.trim();
      },
      dedupeStringValues(values, normalizer = (value) => String(value || "").trim()) {
        const seen = new Set();
        const deduped = [];
        for (const value of Array.isArray(values) ? values : []) {
          const normalized = normalizer(value);
          if (!normalized) continue;
          const key = normalized.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(normalized);
        }
        return deduped;
      },
      normalizeSourceCandidate(candidate, source, fallbackRank) {
        if (!candidate || typeof candidate !== "object") return null;
        const pmid = this.normalizePmidValue(candidate.pmid);
        const doi = this.normalizeDoiValue(candidate.doi);
        if (!pmid && !doi) return null;
        const parsedRank = Number(candidate.rank);
        const parsedScore = Number(candidate.score);
        const metadata =
          candidate.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
        return {
          source,
          rank: Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank : fallbackRank,
          pmid,
          doi,
          title: String(candidate.title || "").trim(),
          abstract: String(candidate.abstract || "").trim(),
          score: Number.isFinite(parsedScore) ? parsedScore : null,
          openAlexId: String(candidate.openAlexId || "").trim(),
          metadata: {
            publicationYear: String(metadata.publicationYear || metadata.year || "").trim(),
            venue: String(
              metadata.venue || metadata.sourceDisplayName || metadata.sourceAbbreviatedTitle || ""
            ).trim(),
            workType: String(metadata.workType || "").trim(),
            sourceType: String(metadata.sourceType || "").trim(),
            sourceDisplayName: String(metadata.sourceDisplayName || "").trim(),
            sourceAbbreviatedTitle: String(metadata.sourceAbbreviatedTitle || "").trim(),
            publicationTypes: Array.isArray(metadata.publicationTypes)
              ? metadata.publicationTypes.map((value) => String(value || "").trim()).filter(Boolean)
              : [],
            lexicalRescue: metadata.lexicalRescue === true,
            lexicalRescueAbstractAvailable: metadata.lexicalRescueAbstractAvailable === true,
            lexicalRescueTriggerReason: String(metadata.lexicalRescueTriggerReason || "").trim(),
          },
        };
      },
      createEmptySourceResult(source, query, error = "") {
        return {
          source,
          query,
          total: 0,
          pmids: [],
          dois: [],
          candidates: [],
          error: error ? String(error) : "",
          warning: "",
          partial: false,
          retryHints: {},
          rateLimit: null,
          debug: null,
        };
      },
      publishElicitRateLimitInfo(rateLimit) {
        if (!rateLimit || typeof window === "undefined") {
          return;
        }
        const normalized = {
          limit:
            rateLimit?.limit === null || rateLimit?.limit === undefined
              ? null
              : Number(rateLimit.limit),
          remaining:
            rateLimit?.remaining === null || rateLimit?.remaining === undefined
              ? null
              : Number(rateLimit.remaining),
          resetAt: String(rateLimit?.resetAt || "").trim(),
          resetInSeconds:
            rateLimit?.resetInSeconds === null || rateLimit?.resetInSeconds === undefined
              ? null
              : Number(rateLimit.resetInSeconds),
          status: Number(rateLimit?.status) || 0,
          isLimited: rateLimit?.isLimited === true,
        };
        this.logElicitRateLimitInfo(normalized);
        try {
          window.localStorage.setItem("qpmElicitRateLimitInfo", JSON.stringify(normalized));
        } catch {
          // Ignore localStorage write errors.
        }
        window.dispatchEvent(
          new CustomEvent("qpm:elicit-rate-limit-update", {
            detail: normalized,
          })
        );
      },
      getElicitRateLimitResetDate(rateLimit) {
        const resetAt = String(rateLimit?.resetAt || "").trim();
        const resetTimestamp = Date.parse(resetAt);
        if (Number.isFinite(resetTimestamp)) {
          return new Date(resetTimestamp);
        }
        const resetInSeconds = Number(rateLimit?.resetInSeconds);
        if (Number.isFinite(resetInSeconds)) {
          return new Date(Date.now() + Math.max(0, Math.floor(resetInSeconds)) * 1000);
        }
        return null;
      },
      logElicitRateLimitInfo(rateLimit) {
        const signature = JSON.stringify([
          rateLimit?.limit ?? null,
          rateLimit?.remaining ?? null,
          rateLimit?.resetAt ?? "",
          rateLimit?.resetInSeconds ?? null,
          rateLimit?.status ?? 0,
          rateLimit?.isLimited === true,
        ]);
        if (signature === this._lastElicitRateLimitLogSignature) {
          return;
        }
        this._lastElicitRateLimitLogSignature = signature;

        const resetDate = this.getElicitRateLimitResetDate(rateLimit);
        const resetAtLocal = resetDate
          ? resetDate.toLocaleString(this.language === "en" ? "en-US" : "da-DK")
          : null;
        const nextSearchAvailableAt = rateLimit?.isLimited === true && resetDate
          ? resetDate.toLocaleString(this.language === "en" ? "en-US" : "da-DK")
          : null;

        console.info("[ElicitRateLimit] Opdateret rate limit-info.", {
          limit: Number.isFinite(rateLimit?.limit) ? Number(rateLimit.limit) : null,
          remaining: Number.isFinite(rateLimit?.remaining) ? Number(rateLimit.remaining) : null,
          status: Number.isFinite(rateLimit?.status) ? Number(rateLimit.status) : 0,
          isLimited: rateLimit?.isLimited === true,
          resetAtIso: String(rateLimit?.resetAt || "").trim() || null,
          resetAtLocal,
          resetInSeconds: Number.isFinite(rateLimit?.resetInSeconds)
            ? Number(rateLimit.resetInSeconds)
            : null,
          nextSearchAvailableAt,
          windowType: "rolling 24-hour window",
          resetMeaning: "X-RateLimit-Reset angiver, hvornår den ældste request falder ud af vinduet, så én ny plads bliver ledig.",
        });
      },
      normalizeSourceResult(source, query, payload, error = "") {
        if (!payload || typeof payload !== "object") {
          return this.createEmptySourceResult(source, query, error);
        }

        const candidates = (Array.isArray(payload.candidates) ? payload.candidates : [])
          .map((candidate, index) => this.normalizeSourceCandidate(candidate, source, index + 1))
          .filter(Boolean);
        const pmids = this.dedupeStringValues(
          Array.isArray(payload.pmids) ? payload.pmids : candidates.map((candidate) => candidate.pmid),
          (value) => this.normalizePmidValue(value)
        );
        const dois = this.dedupeStringValues(
          Array.isArray(payload.dois) ? payload.dois : candidates.map((candidate) => candidate.doi),
          (value) => this.normalizeDoiValue(value)
        );
        const total = Number(payload.total);

        return {
          source,
          query,
          total: Number.isFinite(total) ? total : candidates.length,
          pmids,
          dois,
          candidates,
          error: error ? String(error) : "",
          warning: String(payload.warning || "").trim(),
          partial: payload.partial === true,
          retryHints:
            payload.retryHints && typeof payload.retryHints === "object" ? payload.retryHints : {},
          rateLimit:
            payload.rateLimit && typeof payload.rateLimit === "object" ? payload.rateLimit : null,
          debug: payload.debug && typeof payload.debug === "object" ? payload.debug : null,
        };
      },
      getBackendEndpointUrls(endpointFile) {
        const normalizeApiBase = (value) => {
          const base = String(value || "")
            .trim()
            .replace(/\/+$/, "");
          if (!base) return "";
          if (base.endsWith("/api")) return base;
          if (base.endsWith("/backend")) return `${base}/api`;
          return base;
        };
        const apiBaseFromUrl = normalizeApiBase(
          typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("apiBase") : ""
        );
        const endpointUrls = [];
        if (apiBaseFromUrl) {
          endpointUrls.push(`${apiBaseFromUrl}/${endpointFile}`);
        }
        if (!apiBaseFromUrl) {
          const appProxy = `${this.appSettings.nlm.proxyUrl}/${endpointFile}`;
          if (!endpointUrls.includes(appProxy)) {
            endpointUrls.push(appProxy);
          }
        }
        return endpointUrls;
      },
      isSearchFlowDebugEnabled() {
        return this.qpmSearchFlowDebugApi?.isEnabled?.() === true;
      },
      isSearchFlowDebugRunActive() {
        return this.qpmSearchFlowDebugApi?.isRunActive?.() === true;
      },
      getSearchFlowDebugConsolePrefix() {
        return this.qpmSearchFlowDebugApi?.getConsolePrefix?.() || "[SearchFlowDebug][DropdownWrapper]";
      },
      beginSearchFlowDebugStep(title) {
        return this.qpmSearchFlowDebugApi?.beginStep?.(title) || null;
      },
      endSearchFlowDebugStep(step, status = "ok", meta = {}) {
        this.qpmSearchFlowDebugApi?.endStep?.(step, status, meta);
      },
      recordSearchFlowDebugEntry(level = "info", label, payload = undefined) {
        this.qpmSearchFlowDebugApi?.logEntry?.(level, label, payload);
      },
      async runSearchFlowDebugSection(title, task, collapsed = true) {
        void collapsed;
        if (!(this.isSearchFlowDebugEnabled() && this.isSearchFlowDebugRunActive())) {
          return await task();
        }
        const step = this.beginSearchFlowDebugStep(title);
        try {
          const result = await task();
          this.endSearchFlowDebugStep(step, "ok");
          return result;
        } catch (error) {
          this.endSearchFlowDebugStep(step, "error", {
            error: String(error || ""),
          });
          throw error;
        }
      },
      logSearchFlowDebugInfo(label, payload = undefined) {
        if (!(this.isSearchFlowDebugEnabled() && this.isSearchFlowDebugRunActive())) {
          return;
        }
        this.recordSearchFlowDebugEntry("info", label, payload);
      },
      logSearchFlowDebugWarn(label, payload = undefined) {
        if (!(this.isSearchFlowDebugEnabled() && this.isSearchFlowDebugRunActive())) {
          return;
        }
        this.recordSearchFlowDebugEntry("warn", label, payload);
      },
      logSearchFlowDebugTable(label, rows = []) {
        if (!(this.isSearchFlowDebugEnabled() && this.isSearchFlowDebugRunActive())) {
          return;
        }
        const safeRows = Array.isArray(rows) ? rows : [];
        this.logSearchFlowDebugInfo(label, {
          count: safeRows.length,
          rows: safeRows,
        });
      },
      async logSearchFlowDebugSourceResultGroup(sourceLabel, requestPayload, payload, normalized, extra = {}) {
        if (!(this.isSearchFlowDebugEnabled() && this.isSearchFlowDebugRunActive())) {
          return;
        }
        await this.runSearchFlowDebugSection(`04 Source retrieval • ${sourceLabel}`, async () => {
          const sourceDebug = payload?.debug && typeof payload.debug === "object" ? payload.debug : {};
          const fetchedRows = (Array.isArray(normalized?.candidates) ? normalized.candidates : []).map((candidate) =>
            summarizeSearchFlowRecord({
              ...candidate,
              stage: "fetchedFromSource",
            })
          );
          const droppedRows = (Array.isArray(sourceDebug?.droppedRecords) ? sourceDebug.droppedRecords : []).map(
            (record) =>
              summarizeSearchFlowRecord({
                ...record,
                stage: "droppedInBackendNormalization",
              })
          );
          this.logSearchFlowDebugInfo(`${sourceLabel} request`, {
            request: requestPayload,
            ...extra,
          });
          this.logSearchFlowDebugInfo(`${sourceLabel} response summary`, {
            query: normalized?.query || requestPayload?.query || "",
            total: Number(normalized?.total || 0),
            candidateCount: Array.isArray(normalized?.candidates) ? normalized.candidates.length : 0,
            pmidCount: Array.isArray(normalized?.pmids) ? normalized.pmids.length : 0,
            doiCount: Array.isArray(normalized?.dois) ? normalized.dois.length : 0,
            partial: payload?.partial === true,
            warning: String(payload?.warning || "").trim(),
            error: String(normalized?.error || payload?.error || "").trim(),
            retryHints:
              payload?.retryHints && typeof payload.retryHints === "object" ? payload.retryHints : null,
            upstreamTotal:
              Number(sourceDebug?.upstreamTotal ?? sourceDebug?.rawTotal ?? normalized?.total ?? 0) || 0,
            normalizedTotal:
              Number(sourceDebug?.normalizedTotal ?? (Array.isArray(normalized?.candidates) ? normalized.candidates.length : 0)) || 0,
            droppedBeforeReturn:
              Number(sourceDebug?.droppedBeforeReturn ?? droppedRows.length) || 0,
          });
          this.logSearchFlowDebugTable(`${sourceLabel} fetched records`, fetchedRows);
          if (droppedRows.length > 0) {
            this.logSearchFlowDebugTable(`${sourceLabel} dropped records`, droppedRows);
          }
        });
      },
      async requestBackendJson(endpointFile, body) {
        const requestBody =
          this.isSearchFlowDebugEnabled() &&
          body &&
          typeof body === "object" &&
          !Array.isArray(body)
            ? {
                ...body,
                debugSearchFlow: true,
              }
            : body;
        let payload = null;
        const errors = [];
        for (const endpointUrl of this.getBackendEndpointUrls(endpointFile)) {
          let timeoutId = null;
          try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);
            const response = await fetch(endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal,
            });
            if (!response.ok) {
              const rawError = await response.text();
              errors.push(
                `${endpointUrl} -> ${response.status}: ${
                  rawError || response.statusText || "unknown error"
                }`
              );
              continue;
            }

            const rawPayload = await response.text();
            try {
              payload = JSON.parse(rawPayload);
            } catch {
              errors.push(`${endpointUrl} -> invalid JSON response: ${rawPayload.slice(0, 300)}`);
              continue;
            }
            break;
          } catch (error) {
            const isTimeout = error && error.name === "AbortError";
            errors.push(
              `${endpointUrl} -> ${
                isTimeout ? `request timeout after ${BACKEND_REQUEST_TIMEOUT_MS}ms` : String(error)
              }`
            );
          } finally {
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
            }
          }
        }

        if (!payload) {
          throw Error(errors.join("\n") || `${endpointFile} request failed`);
        }

        return payload;
      },
      async requestBackendForm(endpointFile, formData) {
        let payload = null;
        const errors = [];
        const body = new URLSearchParams(formData).toString();
        for (const endpointUrl of this.getBackendEndpointUrls(endpointFile)) {
          let timeoutId = null;
          try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);
            const response = await fetch(endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
              },
              body,
              signal: controller.signal,
            });
            if (!response.ok) {
              const rawError = await response.text();
              errors.push(
                `${endpointUrl} -> ${response.status}: ${
                  rawError || response.statusText || "unknown error"
                }`
              );
              continue;
            }

            const rawPayload = await response.text();
            try {
              payload = JSON.parse(rawPayload);
            } catch {
              errors.push(`${endpointUrl} -> invalid JSON response: ${rawPayload.slice(0, 300)}`);
              continue;
            }
            break;
          } catch (error) {
            const isTimeout = error && error.name === "AbortError";
            errors.push(
              `${endpointUrl} -> ${
                isTimeout ? `request timeout after ${BACKEND_REQUEST_TIMEOUT_MS}ms` : String(error)
              }`
            );
          } finally {
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
            }
          }
        }

        if (!payload) {
          throw Error(errors.join("\n") || `${endpointFile} request failed`);
        }

        return payload;
      },
      async requestBackendGet(endpointFile, queryParams = {}, responseType = "json") {
        let payload = null;
        let hasPayload = false;
        const errors = [];
        const params = new URLSearchParams();
        Object.entries(queryParams || {}).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          const normalizedValue = String(value).trim();
          if (!normalizedValue) return;
          params.set(key, normalizedValue);
        });
        for (const endpointUrl of this.getBackendEndpointUrls(endpointFile)) {
          let timeoutId = null;
          try {
            const controller = new AbortController();
            const url = params.size > 0 ? `${endpointUrl}?${params.toString()}` : endpointUrl;
            timeoutId = setTimeout(() => controller.abort(), BACKEND_REQUEST_TIMEOUT_MS);
            const response = await fetch(url, {
              method: "GET",
              signal: controller.signal,
            });
            if (!response.ok) {
              const rawError = await response.text();
              errors.push(`${url} -> ${response.status}: ${rawError || response.statusText || "unknown error"}`);
              continue;
            }

            const rawPayload = await response.text();
            if (responseType === "json") {
              try {
                payload = JSON.parse(rawPayload);
              } catch {
                errors.push(`${url} -> invalid JSON response: ${rawPayload.slice(0, 300)}`);
                continue;
              }
            } else {
              payload = rawPayload;
            }
            hasPayload = true;
            break;
          } catch (error) {
            const isTimeout = error && error.name === "AbortError";
            errors.push(
              `${endpointUrl} -> ${
                isTimeout ? `request timeout after ${BACKEND_REQUEST_TIMEOUT_MS}ms` : String(error)
              }`
            );
          } finally {
            if (timeoutId !== null) {
              clearTimeout(timeoutId);
            }
          }
        }

        if (!hasPayload) {
          throw Error(errors.join("\n") || `${endpointFile} request failed`);
        }

        return payload;
      },
      async requestBackendGetJson(endpointFile, queryParams = {}) {
        return this.requestBackendGet(endpointFile, queryParams, "json");
      },
      async requestBackendText(endpointFile, queryParams = {}) {
        return this.requestBackendGet(endpointFile, queryParams, "text");
      },
      getSemanticRescueConfig() {
        const rawConfig =
          runtimeConfig?.semanticRescueConfig && typeof runtimeConfig.semanticRescueConfig === "object"
            ? runtimeConfig.semanticRescueConfig
            : {};
        const mode = String(rawConfig.mode || DEFAULT_SEMANTIC_RESCUE_CONFIG.mode).trim();
        const normalized = {
          mode: mode || DEFAULT_SEMANTIC_RESCUE_CONFIG.mode,
        };
        ["minMergedCandidates", "minSourceCandidates", "searchLimit", "maxCandidates", "minLexicalScore"].forEach(
          (key) => {
            const parsed = Number(rawConfig[key]);
            normalized[key] =
              Number.isFinite(parsed) && parsed > 0
                ? Math.floor(parsed)
                : DEFAULT_SEMANTIC_RESCUE_CONFIG[key];
          }
        );
        return normalized;
      },
      buildSemanticCandidateKey(candidate) {
        const pmid = this.normalizePmidValue(candidate?.pmid || "");
        if (pmid) return `pmid:${pmid}`;
        const doi = this.normalizeDoiValue(candidate?.doi || "");
        if (doi) return `doi:${doi.toLowerCase()}`;
        const openAlexId = String(candidate?.openAlexId || candidate?.metadata?.workId || "").trim();
        if (openAlexId) return `oa:${openAlexId.toLowerCase()}`;
        const title = String(candidate?.title || "").trim().toLowerCase();
        return title ? `title:${title}` : "";
      },
      normalizeLexicalSearchText(value) {
        return String(value || "")
          .toLowerCase()
          .replace(/[\u0000-\u001f]+/g, " ")
          .replace(/[^\p{L}\p{N}]+/gu, " ")
          .trim();
      },
      tokenizeLexicalSearchText(value) {
        const stopWords = new Set([
          "a",
          "an",
          "and",
          "as",
          "at",
          "by",
          "for",
          "from",
          "in",
          "into",
          "is",
          "of",
          "on",
          "or",
          "the",
          "to",
          "with",
        ]);
        return this.dedupeNormalizedValues(
          this.normalizeLexicalSearchText(value)
            .split(/\s+/)
            .filter((token) => token.length >= 2 && !stopWords.has(token)),
          (token) => token
        );
      },
      scoreLexicalTextWithQuery({ queryTokens = [], queryText = "", title = "", abstractText = "" } = {}) {
        if (!Array.isArray(queryTokens) || queryTokens.length === 0) {
          return 0;
        }
        const normalizedTitle = this.normalizeLexicalSearchText(title);
        const normalizedAbstract = this.normalizeLexicalSearchText(abstractText);
        const titleTokenSet = new Set(normalizedTitle ? normalizedTitle.split(/\s+/) : []);
        const abstractTokenSet = new Set(normalizedAbstract ? normalizedAbstract.split(/\s+/) : []);
        let score = 0;
        queryTokens.forEach((token) => {
          if (titleTokenSet.has(token)) {
            score += 3;
          }
          if (abstractTokenSet.has(token)) {
            score += 1;
          }
        });
        if (queryText && normalizedTitle.includes(queryText)) {
          score += 4;
        }
        if (queryText && normalizedAbstract.includes(queryText)) {
          score += 2;
        }
        return score;
      },
      flattenPubMedAbstractText(value) {
        if (!value) return "";
        if (typeof value === "string") {
          return value.trim();
        }
        if (typeof value !== "object") {
          return "";
        }
        return Object.values(value)
          .map((entry) => String(entry || "").trim())
          .filter(Boolean)
          .join(" ");
      },
      extractPubMedSummaryPublicationYear(summaryRecord) {
        const candidates = [
          summaryRecord?.sortpubdate,
          summaryRecord?.pubdate,
          summaryRecord?.epubdate,
          summaryRecord?.history?.pubmed,
        ];
        for (const value of candidates) {
          const match = String(value || "").match(/\b(\d{4})\b/);
          if (match) {
            return match[1];
          }
        }
        return "";
      },
      shouldRunPubMedLexicalRescue({
        sourceResults = [],
        semanticQuery = "",
        pubmedQuery = "",
        usePubMedBestMatch = false,
      } = {}) {
        const rescueConfig = this.getSemanticRescueConfig();
        const mode = String(rescueConfig.mode || "").toLowerCase();
        const normalizedPubMedQuery = String(pubmedQuery || "").trim();
        const normalizedSemanticQuery = String(semanticQuery || "").trim();
        const activeSourceResults = (Array.isArray(sourceResults) ? sourceResults : []).filter(
          (result) => result && typeof result === "object" && result.source !== "pubmed"
        );
        if (!usePubMedBestMatch) {
          return { shouldRun: false, reason: "pubmed-not-selected" };
        }
        if (activeSourceResults.length === 0 || !normalizedPubMedQuery) {
          return { shouldRun: false, reason: "inactive" };
        }
        if (mode === "off" || mode === "disabled" || mode === "none") {
          return { shouldRun: false, reason: "disabled" };
        }
        if (mode === "always" || mode === "always_multi_source") {
          return {
            shouldRun: true,
            reason: "mode-always",
            diagnostics: {
              semanticQuery: normalizedSemanticQuery,
              pubmedQuery: normalizedPubMedQuery,
            },
          };
        }

        const candidateKeys = new Set();
        let sourceCandidateCount = 0;
        activeSourceResults.forEach((result) => {
          const candidates = Array.isArray(result?.candidates) ? result.candidates : [];
          sourceCandidateCount += candidates.length;
          candidates.forEach((candidate) => {
            const key = this.buildSemanticCandidateKey(candidate);
            if (key) {
              candidateKeys.add(key);
            }
          });
        });
        const mergedCandidateCount = candidateKeys.size;
        const isSparse =
          mergedCandidateCount < rescueConfig.minMergedCandidates ||
          sourceCandidateCount < rescueConfig.minSourceCandidates;

        return {
          shouldRun: isSparse,
          reason: isSparse ? "sparse-first-harvest" : "sufficient-first-harvest",
          diagnostics: {
            semanticQuery: normalizedSemanticQuery,
            pubmedQuery: normalizedPubMedQuery,
            mergedCandidateCount,
            sourceCandidateCount,
            thresholds: {
              minMergedCandidates: rescueConfig.minMergedCandidates,
              minSourceCandidates: rescueConfig.minSourceCandidates,
            },
          },
        };
      },
      async fetchPubMedAbstractMap(pmids = []) {
        const normalizedPmids = this.dedupeStringValues(pmids, (value) => this.normalizePmidValue(value));
        if (normalizedPmids.length === 0) {
          return {};
        }
        const chunkSize = 20;
        const abstractMap = {};
        for (let index = 0; index < normalizedPmids.length; index += chunkSize) {
          const chunk = normalizedPmids.slice(index, index + chunkSize);
          const xmlPayload = await this.requestBackendText("NlmFetch.php", {
            db: "pubmed",
            id: chunk.join(","),
            retmode: "xml",
            rettype: "abstract",
          });
          const xmlDoc = parsePubMedXml(xmlPayload);
          if (!xmlDoc || hasXmlParserError(xmlDoc)) {
            continue;
          }
          getAbstractEntriesFromPubMedXml(xmlDoc, { includeEmptySections: true }).forEach(
            ([pmid, abstractValue]) => {
              const normalizedPmid = this.normalizePmidValue(pmid);
              if (!normalizedPmid) return;
              abstractMap[normalizedPmid] = this.flattenPubMedAbstractText(abstractValue);
            }
          );
        }
        return abstractMap;
      },
      async fetchPubMedSearchIds({ query = "", limit = 20 } = {}) {
        const normalizedQuery = String(query || "").trim();
        const searchLimit = Math.max(1, Math.floor(Number(limit) || 1));
        if (!normalizedQuery) {
          return {
            query: normalizedQuery,
            searchCount: 0,
            pmids: [],
          };
        }
        const searchPayload = await this.requestBackendForm("NlmSearch.php", {
          db: "pubmed",
          term: normalizedQuery,
          retmax: searchLimit,
          retmode: "json",
          sort: "relevance",
        });
        const esearchResult =
          searchPayload?.esearchresult && typeof searchPayload.esearchresult === "object"
            ? searchPayload.esearchresult
            : {};
        const searchCount = Number.parseInt(esearchResult.count, 10) || 0;
        const pmids = this.dedupeStringValues(esearchResult.idlist || [], (value) =>
          this.normalizePmidValue(value)
        ).slice(0, searchLimit);
        return {
          query: normalizedQuery,
          searchCount,
          pmids,
        };
      },
      async fetchPubMedSummaryRecords(pmids = []) {
        const normalizedPmids = this.dedupeStringValues(pmids, (value) => this.normalizePmidValue(value));
        if (normalizedPmids.length === 0) {
          return {};
        }
        const summaryPayload = await this.requestBackendGetJson("NlmSummary.php", {
          db: "pubmed",
          id: normalizedPmids.join(","),
          retmode: "json",
        });
        return summaryPayload?.result && typeof summaryPayload.result === "object"
          ? summaryPayload.result
          : {};
      },
      async fetchPubMedBestMatchSourceResult({ pubmedQuery = "" } = {}) {
        const normalizedPubMedQuery = String(pubmedQuery || "").trim();
        const emptyResult = this.createEmptySourceResult("pubmed", normalizedPubMedQuery);
        if (!normalizedPubMedQuery) {
          return emptyResult;
        }
        const searchLimit = this.getConfiguredSemanticSourceLimit("pubmedBestMatch", 200);
        const { searchCount, pmids } = await this.fetchPubMedSearchIds({
          query: normalizedPubMedQuery,
          limit: searchLimit,
        });
        if (pmids.length === 0) {
          return {
            ...emptyResult,
            total: searchCount,
          };
        }
        const summaryResult = await this.fetchPubMedSummaryRecords(pmids);
        const candidates = pmids.map((pmid, index) => {
          const summaryRecord =
            summaryResult?.[pmid] && typeof summaryResult[pmid] === "object"
              ? summaryResult[pmid]
              : {};
          return {
            source: "pubmed",
            rank: index + 1,
            pmid,
            title: String(summaryRecord?.title || "").trim(),
            metadata: {
              publicationYear: this.extractPubMedSummaryPublicationYear(summaryRecord),
              venue: String(summaryRecord?.fulljournalname || summaryRecord?.source || "").trim(),
              publicationTypes: Array.isArray(summaryRecord?.pubtype)
                ? summaryRecord.pubtype.map((value) => String(value || "").trim()).filter(Boolean)
                : [],
            },
          };
        });
        return this.normalizeSourceResult("pubmed", normalizedPubMedQuery, {
          total: searchCount,
          pmids,
          candidates,
        });
      },
      async fetchPubMedLexicalRescueResult({
        semanticQuery = "",
        pubmedQuery = "",
        sourceResults = [],
        triggerReason = "",
      } = {}) {
        const rescueConfig = this.getSemanticRescueConfig();
        const normalizedPubMedQuery = String(pubmedQuery || "").trim();
        const normalizedSemanticQuery = String(semanticQuery || "").trim();
        const resultQuery = normalizedPubMedQuery || normalizedSemanticQuery;
        const emptyResult = this.createEmptySourceResult("pubmed", resultQuery);
        const existingPmids = this.dedupeStringValues(
          (Array.isArray(sourceResults) ? sourceResults : []).flatMap((result) => [
            ...(Array.isArray(result?.pmids) ? result.pmids : []),
            ...(Array.isArray(result?.candidates) ? result.candidates.map((candidate) => candidate?.pmid) : []),
          ]),
          (value) => this.normalizePmidValue(value)
        );
        const existingPmidSet = new Set(existingPmids);
        const searchLimit = Math.max(1, rescueConfig.searchLimit);
        const maxCandidates = Math.max(1, rescueConfig.maxCandidates);
        const minLexicalScore = Math.max(1, rescueConfig.minLexicalScore);
        const { searchCount, pmids: retrievedPmids } = await this.fetchPubMedSearchIds({
          query: normalizedPubMedQuery,
          limit: searchLimit,
        });
        const rescuePmids = retrievedPmids
          .filter((pmid) => !existingPmidSet.has(pmid))
          .slice(0, searchLimit);
        if (rescuePmids.length === 0) {
          return {
            ...emptyResult,
            rescueMeta: {
              triggered: true,
              triggerReason,
              consideredPmids: 0,
              acceptedCandidates: 0,
              totalPubMedHits: searchCount,
            },
          };
        }

        const summaryResult = await this.fetchPubMedSummaryRecords(rescuePmids);
        const abstractMap = await this.fetchPubMedAbstractMap(rescuePmids);
        const lexicalQueryText = this.normalizeLexicalSearchText(normalizedSemanticQuery || normalizedPubMedQuery);
        const lexicalQueryTokens = this.tokenizeLexicalSearchText(normalizedSemanticQuery || normalizedPubMedQuery);
        const acceptedCandidates = rescuePmids
          .map((pmid, index) => {
            const summaryRecord =
              summaryResult?.[pmid] && typeof summaryResult[pmid] === "object" ? summaryResult[pmid] : {};
            const title = String(summaryRecord?.title || "").trim();
            const abstractText = String(abstractMap?.[pmid] || "").trim();
            const lexicalScore = this.scoreLexicalTextWithQuery({
              queryTokens: lexicalQueryTokens,
              queryText: lexicalQueryText,
              title,
              abstractText,
            });
            if (!title || lexicalScore < minLexicalScore) {
              return null;
            }
            return {
              source: "pubmed",
              rank: index + 1,
              pmid,
              title,
              score: lexicalScore,
              metadata: {
                publicationYear: this.extractPubMedSummaryPublicationYear(summaryRecord),
                venue: String(summaryRecord?.fulljournalname || summaryRecord?.source || "").trim(),
                publicationTypes: Array.isArray(summaryRecord?.pubtype)
                  ? summaryRecord.pubtype.map((value) => String(value || "").trim()).filter(Boolean)
                  : [],
                lexicalRescue: true,
                lexicalRescueAbstractAvailable: abstractText !== "",
                lexicalRescueTriggerReason: String(triggerReason || "").trim(),
              },
            };
          })
          .filter(Boolean)
          .sort((left, right) => {
            const scoreDiff = Number(right?.score || 0) - Number(left?.score || 0);
            if (scoreDiff !== 0) return scoreDiff;
            return Number(left?.rank || 0) - Number(right?.rank || 0);
          })
          .slice(0, maxCandidates)
          .map((candidate, index) => ({
            ...candidate,
            rank: index + 1,
          }));

        const result = this.normalizeSourceResult("pubmed", resultQuery, {
          total: searchCount,
          pmids: acceptedCandidates.map((candidate) => candidate.pmid),
          candidates: acceptedCandidates,
        });
        result.rescueMeta = {
          triggered: true,
          triggerReason,
          consideredPmids: rescuePmids.length,
          acceptedCandidates: acceptedCandidates.length,
          totalPubMedHits: searchCount,
          minLexicalScore,
        };
        return result;
      },
      getTimingNow() {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
          return performance.now();
        }
        return Date.now();
      },
      roundTimingMs(value) {
        return Math.round(Number(value || 0));
      },
      async measureAsync(label, task, meta = {}) {
        const startedAt = this.getTimingNow();
        try {
          const result = await task();
          console.info(`[Timing] ${label}`, {
            ...meta,
            status: "ok",
            elapsedMs: this.roundTimingMs(this.getTimingNow() - startedAt),
          });
          return result;
        } catch (error) {
          console.warn(`[Timing] ${label}`, {
            ...meta,
            status: "error",
            elapsedMs: this.roundTimingMs(this.getTimingNow() - startedAt),
            error: String(error || ""),
          });
          throw error;
        }
      },
      getResolvedSemanticSourceQueryPlan(query, options = {}) {
        const semanticIntentPayload =
          options?.semanticIntentPayload && typeof options.semanticIntentPayload === "object"
            ? options.semanticIntentPayload
            : {};
        const llmSemanticIntent =
          options?.llmSemanticIntent && typeof options.llmSemanticIntent === "object"
            ? options.llmSemanticIntent
            : {};
        const providedPlan =
          options?.semanticSourceQueryPlan && typeof options.semanticSourceQueryPlan === "object"
            ? options.semanticSourceQueryPlan
            : null;
        if (providedPlan) {
          return providedPlan;
        }
        return this.buildSemanticSourceQueryPlan({
          semanticQuery: query,
          semanticIntentPayload,
          llmSemanticIntent,
          fallbackQuery: query,
        });
      },
      async fetchSemanticScholarResults(query, options = {}) {
        const sourceQueryPlan = this.getResolvedSemanticSourceQueryPlan(query, options);
        const requestQuery =
          this.normalizeSemanticQueryText(sourceQueryPlan?.semanticScholar?.query) ||
          this.normalizeSemanticQueryText(query);
        const publicationTypes = Array.isArray(sourceQueryPlan?.semanticScholar?.filters?.publicationTypes)
          ? sourceQueryPlan.semanticScholar.filters.publicationTypes
          : [];
        const publicationDateOrYear =
          sourceQueryPlan?.semanticScholar?.filters?.publicationDateOrYear || "";
        const year = sourceQueryPlan?.semanticScholar?.filters?.year || "";
        const requestLimit = this.getConfiguredSemanticSourceLimit(
          "semanticScholar",
          DEFAULT_SEMANTIC_SCHOLAR_LIMIT
        );
        const cacheKey = this.buildSemanticSourceCacheKey("semanticScholar", {
          query: requestQuery,
          limit: requestLimit,
          publicationTypes,
          publicationDateOrYear,
          year,
        });
        const cached = this.getCachedSemanticSourceResponse(cacheKey);
        const requestPayload = {
          query: requestQuery,
          limit: requestLimit,
          publicationTypes,
          publicationDateOrYear,
          year,
          domain: this.currentDomain || "",
        };
        this.logSemanticSourceRequest("semanticScholar", {
          transport: cached ? "cache" : "network",
          endpoint: "SemanticScholarSearch.php",
          request: requestPayload,
        });
        if (cached) {
          await this.logSearchFlowDebugSourceResultGroup(
            "Semantic Scholar",
            requestPayload,
            cached,
            cached,
            { transport: "cache" }
          );
          return cached;
        }
        const payload = await this.measureAsync(
          "SemanticScholar request",
          () =>
            this.requestBackendJson("SemanticScholarSearch.php", requestPayload),
          {
            query: requestQuery,
            limit: requestLimit,
            publicationTypes,
            publicationDateOrYear,
            year,
          }
        );
        if (payload?.warning) {
          console.warn("[SemanticScholarFlow] Using degraded Semantic Scholar result.", {
            query: requestQuery,
            warning: payload.warning,
            partial: payload.partial === true,
            total: payload.total,
            pmids: Array.isArray(payload.pmids) ? payload.pmids.length : 0,
            dois: Array.isArray(payload.dois) ? payload.dois.length : 0,
          });
        }
        const normalized = this.normalizeSourceResult("semanticScholar", requestQuery, payload);
        await this.logSearchFlowDebugSourceResultGroup(
          "Semantic Scholar",
          requestPayload,
          payload,
          normalized,
          { transport: "network" }
        );
        this.setCachedSemanticSourceResponse(cacheKey, normalized);
        return normalized;
      },
      normalizeOpenAlexLanguageFilterValue(value) {
        const normalized = String(value || "").trim().toLowerCase();
        if (!normalized) return "";
        const aliasMap = {
          english: "en",
          eng: "en",
          danish: "da",
          dansk: "da",
          german: "de",
          deutsch: "de",
          french: "fr",
          spanish: "es",
          italian: "it",
          dutch: "nl",
          norwegian: "no",
          norwegianbokmal: "nb",
          norwegiannynorsk: "nn",
          swedish: "sv",
          portuguese: "pt",
        };
        const compact = normalized.replace(/[\s_-]+/g, "");
        if (aliasMap[compact]) return aliasMap[compact];
        return /^[a-z]{2}$/.test(normalized) ? normalized : "";
      },
      getOpenAlexLanguageFilters(options = {}) {
        const sourceQueryPlan = this.getResolvedSemanticSourceQueryPlan(
          options?.query || "",
          options
        );
        const languageFilters = Array.isArray(sourceQueryPlan?.openAlex?.filters?.language)
          ? sourceQueryPlan.openAlex.filters.language
          : [];
        return this.dedupeNormalizedValues(
          languageFilters.map((value) => this.normalizeOpenAlexLanguageFilterValue(value)),
          (value) => value
        );
      },
      canUseLocalOpenAlexBrowserProxy() {
        if (typeof window === "undefined" || !window.location) return false;
        const { hostname = "", port = "" } = window.location;
        return port === "5173" && (hostname === "localhost" || hostname === "127.0.0.1");
      },
      getOpenAlexSearchMode(options = {}) {
        return options?.searchMode === "keyword" ? "keyword" : "semantic";
      },
      getOpenAlexSearchParamKey(searchMode = "semantic") {
        return searchMode === "keyword" ? "search" : "search.semantic";
      },
      buildOpenAlexBrowserProxyParams(query, options = {}) {
        const searchMode = this.getOpenAlexSearchMode(options);
        const params = new URLSearchParams();
        params.set(this.getOpenAlexSearchParamKey(searchMode), String(query || "").trim());
        params.set(
          "per_page",
          String(options?.limit || this.getConfiguredSemanticSourceLimit("openAlex", DEFAULT_OPENALEX_LIMIT))
        );
        params.set(
          "select",
          "id,display_name,doi,ids,publication_year,relevance_score,type,primary_location"
        );
        const filterParts = [];
        const languageFilters = Array.isArray(options?.languageFilters) ? options.languageFilters : [];
        const sourceTypes = Array.isArray(options?.sourceTypes) ? options.sourceTypes : [];
        const workTypes = Array.isArray(options?.workTypes) ? options.workTypes : [];
        const publicationYearFilter = String(options?.publicationYearFilter || "").trim();
        if (languageFilters.length) {
          filterParts.push(`language:${languageFilters.join("|")}`);
        }
        if (sourceTypes.length) {
          filterParts.push(`primary_location.source.type:${sourceTypes.join("|")}`);
        }
        if (workTypes.length) {
          filterParts.push(`type:${workTypes.join("|")}`);
        }
        if (publicationYearFilter) {
          filterParts.push(`publication_year:${publicationYearFilter}`);
        }
        if (filterParts.length) {
          params.set("filter", filterParts.join(","));
        }
        return params;
      },
      getRequestRetryHintFields(payload, allowedFields = [], availability = {}) {
        const retryHints = payload?.retryHints && typeof payload.retryHints === "object" ? payload.retryHints : {};
        return this.dedupeNormalizedValues(
          Array.isArray(retryHints.requestFields) ? retryHints.requestFields : [],
          (value) => String(value || "").trim()
        ).filter((field) => allowedFields.includes(field) && availability?.[field]);
      },
      buildOpenAlexRequestRetryAttempt(requestPayload, context = {}, requestField = "") {
        const normalizedField = String(requestField || "").trim();
        if (!normalizedField) return null;
        const nextPayload = { ...requestPayload };
        const nextContext = {
          ...context,
          languageFilters: Array.isArray(context?.languageFilters) ? [...context.languageFilters] : [],
          sourceTypes: Array.isArray(context?.sourceTypes) ? [...context.sourceTypes] : [],
          workTypes: Array.isArray(context?.workTypes) ? [...context.workTypes] : [],
          publicationYearFilter: String(context?.publicationYearFilter || "").trim(),
        };
        if (normalizedField === "languages") {
          nextPayload.languages = [];
          nextContext.languageFilters = [];
        } else if (normalizedField === "sourceTypes") {
          nextPayload.sourceTypes = [];
          nextContext.sourceTypes = [];
        } else if (normalizedField === "workTypes") {
          nextPayload.workTypes = [];
          nextContext.workTypes = [];
        } else if (normalizedField === "publicationYear") {
          nextPayload.publicationYear = "";
          nextContext.publicationYearFilter = "";
        } else {
          return null;
        }
        return {
          requestPayload: nextPayload,
          context: nextContext,
        };
      },
      buildOpenAlexDeferredRetryFilters(context = {}, disabledRequestFields = []) {
        const deferredFilters = {};
        const normalizedDisabledFields = Array.isArray(disabledRequestFields) ? disabledRequestFields : [];
        if (
          normalizedDisabledFields.includes("languages") &&
          Array.isArray(context?.languageFilters) &&
          context.languageFilters.length > 0
        ) {
          deferredFilters.languages = context.languageFilters;
        }
        if (
          normalizedDisabledFields.includes("sourceTypes") &&
          Array.isArray(context?.sourceTypes) &&
          context.sourceTypes.length > 0
        ) {
          deferredFilters.sourceTypes = context.sourceTypes;
        }
        if (
          normalizedDisabledFields.includes("workTypes") &&
          Array.isArray(context?.workTypes) &&
          context.workTypes.length > 0
        ) {
          deferredFilters.workTypes = context.workTypes;
        }
        if (
          normalizedDisabledFields.includes("publicationYear") &&
          String(context?.publicationYearFilter || "").trim()
        ) {
          deferredFilters.publicationYear = String(context.publicationYearFilter || "").trim();
        }
        return deferredFilters;
      },
      buildElicitRequestRetryAttempt(requestPayload, requestField = "") {
        const normalizedField = String(requestField || "").trim();
        if (!normalizedField) return null;
        const nextFilters =
          requestPayload?.filters && typeof requestPayload.filters === "object"
            ? { ...requestPayload.filters }
            : {};
        if (normalizedField === "typeTags") {
          nextFilters.typeTags = [];
        } else if (normalizedField === "includeKeywords") {
          nextFilters.includeKeywords = [];
        } else if (normalizedField === "excludeKeywords") {
          nextFilters.excludeKeywords = [];
        } else {
          return null;
        }
        const nextPayload = {
          ...requestPayload,
          filters: Object.fromEntries(
            Object.entries(nextFilters).filter(
              ([, value]) => Array.isArray(value) ? value.length > 0 : !!String(value || "").trim()
            )
          ),
        };
        if (Object.keys(nextPayload.filters).length === 0) {
          delete nextPayload.filters;
        }
        return nextPayload;
      },
      mapOpenAlexApiPayloadToSearchPayload(query, rawPayload, options = {}) {
        const searchMode = this.getOpenAlexSearchMode(options);
        const results = Array.isArray(rawPayload?.results) ? rawPayload.results : [];
        const pmids = [];
        const dois = [];
        const candidates = [];
        results.forEach((work, index) => {
          if (!work || typeof work !== "object") return;
          const ids = work?.ids && typeof work.ids === "object" ? work.ids : {};
          const pmidValue = this.normalizePmidValue(work?.pmid || ids?.pmid || ids?.PubMed);
          const doiValue = this.normalizeDoiValue(work?.doi || ids?.doi || ids?.DOI);
          const primaryLocation =
            work?.primary_location && typeof work.primary_location === "object" ? work.primary_location : {};
          const source =
            primaryLocation?.source && typeof primaryLocation.source === "object"
              ? primaryLocation.source
              : {};
          if (pmidValue) {
            pmids.push(pmidValue);
          } else if (doiValue) {
            dois.push(doiValue);
          }
          candidates.push({
            source: "openAlex",
            rank: index + 1,
            score: searchMode === "semantic" ? Number(work?.relevance_score) || 0 : null,
            pmid: pmidValue,
            doi: doiValue,
            title: work?.display_name || "",
            year: work?.publication_year || null,
            metadata: {
              workId: work?.id || "",
              workType: work?.type || "",
              sourceType: source?.type || "",
              sourceDisplayName: source?.display_name || "",
              sourceAbbreviatedTitle: source?.abbreviated_title || "",
              searchMode,
            },
          });
        });
        return {
          query,
          searchMode,
          pmids: [...new Set(pmids)],
          dois: [...new Set(dois)],
          candidates,
          total: Number(rawPayload?.meta?.count) || candidates.length,
        };
      },
      async fetchOpenAlexBrowserProxyPayload(query, options = {}) {
        if (!this.canUseLocalOpenAlexBrowserProxy()) {
          return null;
        }
        const params = this.buildOpenAlexBrowserProxyParams(query, options);
        const response = await fetch(`/openalex-api/works?${params.toString()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`OpenAlex browser proxy failed with HTTP ${response.status}`);
        }
        const rawPayload = await response.json();
        return this.mapOpenAlexApiPayloadToSearchPayload(query, rawPayload, options);
      },
      buildOpenAlexCandidateKey(candidate) {
        const pmid = this.normalizePmidValue(candidate?.pmid || "");
        if (pmid) return `pmid:${pmid}`;
        const doi = this.normalizeDoiValue(candidate?.doi || "");
        if (doi) return `doi:${doi.toLowerCase()}`;
        const openAlexId = String(candidate?.openAlexId || candidate?.metadata?.workId || "").trim();
        return openAlexId ? `oa:${openAlexId.toLowerCase()}` : "";
      },
      shouldSupplementOpenAlexSemanticResults(payload, requestLimit) {
        const limit = Number(requestLimit || 0);
        if (!Number.isFinite(limit) || limit < OPENALEX_SEMANTIC_RESULT_CAP) {
          return false;
        }
        const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
        return candidates.length >= OPENALEX_SEMANTIC_RESULT_CAP;
      },
      mergeOpenAlexSearchPayloads(primaryPayload, supplementPayload) {
        const primary = primaryPayload && typeof primaryPayload === "object" ? primaryPayload : {};
        const supplement = supplementPayload && typeof supplementPayload === "object" ? supplementPayload : {};
        const mergedCandidates = [];
        const seen = new Set();
        const appendCandidates = (candidates, rankOffset = 0, preserveScores = true) => {
          (Array.isArray(candidates) ? candidates : []).forEach((candidate, index) => {
            if (!candidate || typeof candidate !== "object") {
              return;
            }
            const key = this.buildOpenAlexCandidateKey(candidate);
            if (!key || seen.has(key)) {
              return;
            }
            seen.add(key);
            const parsedRank = Number(candidate.rank);
            mergedCandidates.push({
              ...candidate,
              rank: Number.isFinite(parsedRank) && parsedRank > 0 ? parsedRank + rankOffset : index + 1 + rankOffset,
              score: preserveScores ? candidate.score : null,
              metadata:
                candidate?.metadata && typeof candidate.metadata === "object"
                  ? { ...candidate.metadata }
                  : {},
            });
          });
        };
        const primaryCandidates = Array.isArray(primary.candidates) ? primary.candidates : [];
        appendCandidates(primaryCandidates, 0, true);
        appendCandidates(supplement.candidates, primaryCandidates.length, false);
        return {
          ...primary,
          query: String(primary.query || supplement.query || "").trim(),
          searchMode: "semantic+keyword",
          candidates: mergedCandidates,
          pmids: this.dedupeNormalizedValues(
            mergedCandidates.map((candidate) => candidate?.pmid),
            (value) => this.normalizePmidValue(value)
          ),
          dois: this.dedupeNormalizedValues(
            mergedCandidates.map((candidate) => candidate?.doi),
            (value) => this.normalizeDoiValue(value)
          ),
          total: mergedCandidates.length,
        };
      },
      async requestOpenAlexSearchPayload(query, requestPayload, context = {}) {
        const searchMode = this.getOpenAlexSearchMode(context);
        const languageFilters = Array.isArray(context?.languageFilters) ? context.languageFilters : [];
        const sourceTypes = Array.isArray(context?.sourceTypes) ? context.sourceTypes : [];
        const workTypes = Array.isArray(context?.workTypes) ? context.workTypes : [];
        const publicationYearFilter = String(context?.publicationYearFilter || "").trim();
        const timingLabel =
          searchMode === "keyword" ? "OpenAlex keyword supplement request" : "OpenAlex request";
        const timingMeta = {
          query,
          searchMode,
          languageFilters,
          sourceTypes,
          workTypes,
          publicationYearFilter,
        };
        let browserFallbackTried = false;
        let browserFallbackSucceeded = false;
        let browserFallbackError = "";
        let disabledRequestFields = [];
        let activeRequestPayload = { ...requestPayload };
        let activeContext = {
          ...context,
          languageFilters: [...languageFilters],
          sourceTypes: [...sourceTypes],
          workTypes: [...workTypes],
          publicationYearFilter,
        };
        let payload = await this.measureAsync(
          timingLabel,
          () => this.requestBackendJson("OpenAlexSearch.php", requestPayload),
          timingMeta
        );
        const hintedRetryFields = this.getRequestRetryHintFields(
          payload,
          ["languages", "sourceTypes", "workTypes", "publicationYear"],
          {
            languages: languageFilters.length > 0,
            sourceTypes: sourceTypes.length > 0,
            workTypes: workTypes.length > 0,
            publicationYear: publicationYearFilter !== "",
          }
        );
        if (payload?.warning && hintedRetryFields.length > 0) {
          for (const requestField of hintedRetryFields) {
            const retryAttempt = this.buildOpenAlexRequestRetryAttempt(requestPayload, activeContext, requestField);
            if (!retryAttempt) continue;
            const retryPayload = await this.measureAsync(
              `${timingLabel} without ${requestField}`,
              () => this.requestBackendJson("OpenAlexSearch.php", retryAttempt.requestPayload),
              {
                ...timingMeta,
                languageFilters: retryAttempt.context.languageFilters,
                sourceTypes: retryAttempt.context.sourceTypes,
                workTypes: retryAttempt.context.workTypes,
                publicationYearFilter: retryAttempt.context.publicationYearFilter,
                disabledRequestFields: [requestField],
              }
            );
            if (!retryPayload?.warning) {
              payload = retryPayload;
              activeRequestPayload = retryAttempt.requestPayload;
              activeContext = retryAttempt.context;
              disabledRequestFields = [requestField];
              break;
            }
          }
        }
        if (payload?.warning && this.canUseLocalOpenAlexBrowserProxy()) {
          browserFallbackTried = true;
          try {
            const browserProxyParams = this.buildOpenAlexBrowserProxyParams(query, {
              limit: activeRequestPayload.limit,
              languageFilters: activeContext.languageFilters,
              sourceTypes: activeContext.sourceTypes,
              workTypes: activeContext.workTypes,
              publicationYearFilter: activeContext.publicationYearFilter,
              searchMode,
            });
            this.logSemanticSourceRequest("openAlex", {
              transport: "browser-proxy",
              endpoint: "/openalex-api/works",
              request: Object.fromEntries(browserProxyParams.entries()),
              searchMode,
              disabledRequestFields,
              deferredFilters: this.buildOpenAlexDeferredRetryFilters(context, disabledRequestFields),
            });
            const browserProxyPayload = await this.measureAsync(
              `${timingLabel} browser proxy fallback`,
              () =>
                this.fetchOpenAlexBrowserProxyPayload(query, {
                  limit: activeRequestPayload.limit,
                  languageFilters: activeContext.languageFilters,
                  sourceTypes: activeContext.sourceTypes,
                  workTypes: activeContext.workTypes,
                  publicationYearFilter: activeContext.publicationYearFilter,
                  searchMode,
                }),
              {
                ...timingMeta,
                languageFilters: activeContext.languageFilters,
                sourceTypes: activeContext.sourceTypes,
                workTypes: activeContext.workTypes,
                publicationYearFilter: activeContext.publicationYearFilter,
                disabledRequestFields,
              }
            );
            if (browserProxyPayload) {
              payload = browserProxyPayload;
              browserFallbackSucceeded = true;
            }
          } catch (error) {
            browserFallbackError = String(error || "");
            console.warn("[OpenAlexFlow] Browser proxy fallback failed.", {
              query,
              searchMode,
              error: browserFallbackError,
            });
          }
        }
        return {
          payload,
          browserFallbackTried,
          browserFallbackSucceeded,
          browserFallbackError,
          sourceTypeFallbackUsed: disabledRequestFields.includes("sourceTypes"),
          disabledRequestFields,
        };
      },
      logOpenAlexRequestSummary({
        query = "",
        searchMode = "semantic",
        languageFilters = [],
        sourceTypes = [],
        workTypes = [],
        publicationYearFilter = "",
        payload = null,
        browserFallbackTried = false,
        browserFallbackSucceeded = false,
        browserFallbackError = "",
        sourceTypeFallbackUsed = false,
        disabledRequestFields = [],
        semanticCapReached = false,
        semanticCandidateCount = 0,
        keywordSupplementAttempted = false,
        keywordSupplementUsed = false,
        keywordSupplementCandidates = 0,
      } = {}) {
        const normalizedPayload = payload && typeof payload === "object" ? payload : {};
        console.info("[OpenAlexFlow] Request summary.", {
          query,
          searchMode,
          languageFilters,
          sourceTypes,
          workTypes,
          publicationYearFilter,
          browserFallbackTried,
          browserFallbackSucceeded,
          browserFallbackError: browserFallbackError ? String(browserFallbackError) : "",
          sourceTypeFallbackUsed,
          disabledRequestFields,
          semanticCapReached,
          semanticCandidateCount,
          keywordSupplementAttempted,
          keywordSupplementUsed,
          keywordSupplementCandidates,
          degraded: normalizedPayload.partial === true || !!normalizedPayload.warning,
          total: Number(normalizedPayload.total || 0),
          pmids: Array.isArray(normalizedPayload.pmids) ? normalizedPayload.pmids.length : 0,
          dois: Array.isArray(normalizedPayload.dois) ? normalizedPayload.dois.length : 0,
          warning: String(normalizedPayload.warning || ""),
        });
      },
      async fetchOpenAlexResults(query, options = {}) {
        const sourceQueryPlan = this.getResolvedSemanticSourceQueryPlan(query, options);
        const requestQuery =
          this.normalizeSemanticQueryText(sourceQueryPlan?.openAlex?.query) ||
          this.normalizeSemanticQueryText(query);
        const requestLimit = this.getConfiguredSemanticSourceLimit("openAlex", DEFAULT_OPENALEX_LIMIT);
        const languageFilters = this.getOpenAlexLanguageFilters(options);
        const sourceTypes = this.dedupeNormalizedValues(
          Array.isArray(sourceQueryPlan?.openAlex?.filters?.sourceType)
            ? sourceQueryPlan.openAlex.filters.sourceType.map((value) =>
                this.normalizeOpenAlexSourceTypeValue(value)
              )
            : [],
          (value) => value
        );
        const workTypes = this.dedupeNormalizedValues(
          Array.isArray(sourceQueryPlan?.openAlex?.filters?.workType)
            ? sourceQueryPlan.openAlex.filters.workType.map((value) =>
                this.normalizeOpenAlexWorkTypeValue(value)
              )
            : [],
          (value) => value
        );
        const publicationYearFilter = String(
          sourceQueryPlan?.openAlex?.filters?.publicationYear || ""
        ).trim();
        const cacheKey = this.buildSemanticSourceCacheKey("openAlex", {
          query: requestQuery,
          limit: requestLimit,
          languageFilters,
          sourceTypes,
          workTypes,
          publicationYearFilter,
        });
        const cached = this.getCachedSemanticSourceResponse(cacheKey);
        const requestPayload = {
          query: requestQuery,
          limit: requestLimit,
          domain: this.currentDomain || "",
          languages: languageFilters,
          sourceTypes,
          workTypes,
          publicationYear: publicationYearFilter,
          searchMode: "semantic",
        };
        this.logSemanticSourceRequest("openAlex", {
          transport: cached ? "cache" : "network",
          endpoint: "OpenAlexSearch.php",
          request: requestPayload,
          searchMode: "semantic",
        });
        if (cached) {
          await this.logSearchFlowDebugSourceResultGroup("OpenAlex", requestPayload, cached, cached, {
            transport: "cache",
            searchMode: "semantic",
          });
          return cached;
        }
        const semanticResult = await this.requestOpenAlexSearchPayload(requestQuery, requestPayload, {
          searchMode: "semantic",
          languageFilters,
          sourceTypes,
          workTypes,
          publicationYearFilter,
        });
        let payload = semanticResult.payload;
        const semanticCandidateCount = Array.isArray(payload?.candidates) ? payload.candidates.length : 0;
        const semanticCapReached =
          !payload?.warning && this.shouldSupplementOpenAlexSemanticResults(payload, requestLimit);
        let keywordSupplementAttempted = false;
        let keywordSupplementUsed = false;
        let keywordSupplementCandidates = 0;
        console.info("[OpenAlexFlow] Semantic cap check.", {
          query: requestQuery,
          requestLimit,
          semanticCapReached,
          semanticCandidateCount,
          semanticWarning: String(payload?.warning || ""),
        });
        if (semanticCapReached) {
          keywordSupplementAttempted = true;
          const keywordRequestPayload = {
            ...requestPayload,
            searchMode: "keyword",
          };
          this.logSemanticSourceRequest("openAlex", {
            transport: "network",
            endpoint: "OpenAlexSearch.php",
            request: keywordRequestPayload,
            searchMode: "keyword",
            reason: "semantic-cap-reached",
          });
          console.info(
            "[OpenAlexFlow] Triggering keyword supplement because semantic search reached OpenAlex's cap.",
            {
              query: requestQuery,
              semanticCap: OPENALEX_SEMANTIC_RESULT_CAP,
              semanticCandidateCount,
            }
          );
          const keywordResult = await this.requestOpenAlexSearchPayload(
            requestQuery,
            keywordRequestPayload,
            {
              searchMode: "keyword",
              languageFilters,
              sourceTypes,
              workTypes,
              publicationYearFilter,
            }
          );
          if (!keywordResult.payload?.warning) {
            payload = this.mergeOpenAlexSearchPayloads(payload, keywordResult.payload);
            keywordSupplementCandidates = Math.max(
              0,
              (Array.isArray(payload?.candidates) ? payload.candidates.length : 0) - semanticCandidateCount
            );
            keywordSupplementUsed = keywordSupplementCandidates > 0;
            console.info("[OpenAlexFlow] Added keyword supplement after semantic result cap was reached.", {
              query: requestQuery,
              semanticCandidates: semanticCandidateCount,
              keywordSupplementCandidates,
              mergedCandidates: Array.isArray(payload?.candidates) ? payload.candidates.length : 0,
            });
          }
        }
        this.logOpenAlexRequestSummary({
          query: requestQuery,
          searchMode: "semantic",
          languageFilters,
          sourceTypes,
          workTypes,
          publicationYearFilter,
          payload,
          browserFallbackTried: semanticResult.browserFallbackTried,
          browserFallbackSucceeded: semanticResult.browserFallbackSucceeded,
          browserFallbackError: semanticResult.browserFallbackError,
          sourceTypeFallbackUsed: semanticResult.sourceTypeFallbackUsed,
          disabledRequestFields: semanticResult.disabledRequestFields,
          semanticCapReached,
          semanticCandidateCount,
          keywordSupplementAttempted,
          keywordSupplementUsed,
          keywordSupplementCandidates,
        });
        const normalized = this.normalizeSourceResult("openAlex", requestQuery, payload);
        await this.logSearchFlowDebugSourceResultGroup("OpenAlex", requestPayload, payload, normalized, {
          transport: "network",
          searchMode: "semantic",
          browserFallbackTried: semanticResult.browserFallbackTried,
          browserFallbackSucceeded: semanticResult.browserFallbackSucceeded,
          disabledRequestFields: semanticResult.disabledRequestFields,
          semanticCapReached,
          keywordSupplementAttempted,
          keywordSupplementUsed,
          keywordSupplementCandidates,
        });
        this.setCachedSemanticSourceResponse(cacheKey, normalized);
        return normalized;
      },
      async fetchElicitResults(query, options = {}) {
        const sourceQueryPlan = this.getResolvedSemanticSourceQueryPlan(query, options);
        const requestQuery =
          this.normalizeSemanticQueryText(sourceQueryPlan?.elicit?.query) ||
          this.buildElicitFallbackQuery(query);
        const requestLimit = this.getConfiguredSemanticSourceLimit("elicit", DEFAULT_ELICIT_LIMIT);
        const filters =
          sourceQueryPlan?.elicit?.filters && typeof sourceQueryPlan.elicit.filters === "object"
            ? sourceQueryPlan.elicit.filters
            : {};
        const normalizedFilters = {
          typeTags: this.dedupeNormalizedValues(
            (Array.isArray(filters.typeTags) ? filters.typeTags : []).map((value) =>
              this.normalizeElicitTypeTagValue(value)
            ),
            (value) => value
          ),
          includeKeywords: this.dedupeNormalizedValues(
            Array.isArray(filters.includeKeywords) ? filters.includeKeywords : [],
            (value) => String(value || "").trim()
          ),
          excludeKeywords: this.dedupeNormalizedValues(
            Array.isArray(filters.excludeKeywords) ? filters.excludeKeywords : [],
            (value) => String(value || "").trim()
          ),
        };
        const cacheKey = this.buildSemanticSourceCacheKey("elicit", {
          query: requestQuery,
          limit: requestLimit,
          filters: normalizedFilters,
        });
        const cached = this.getCachedSemanticSourceResponse(cacheKey);
        const requestPayload = {
          query: requestQuery,
          limit: requestLimit,
          domain: this.currentDomain || "",
          filters: normalizedFilters,
        };
        this.logSemanticSourceRequest("elicit", {
          transport: cached ? "cache" : "network",
          endpoint: "ElicitSearch.php",
          request: requestPayload,
        });
        if (cached) {
          await this.logSearchFlowDebugSourceResultGroup("Elicit", requestPayload, cached, cached, {
            transport: "cache",
          });
          return cached;
        }
        let payload = await this.measureAsync(
          "Elicit request",
          () =>
            this.requestBackendJson("ElicitSearch.php", requestPayload),
          { query: requestQuery, filters: normalizedFilters }
        );
        this.publishElicitRateLimitInfo(payload?.rateLimit || null);
        const hintedRetryFields = this.getRequestRetryHintFields(
          payload,
          ["typeTags", "includeKeywords", "excludeKeywords"],
          {
            typeTags: normalizedFilters.typeTags.length > 0,
            includeKeywords: normalizedFilters.includeKeywords.length > 0,
            excludeKeywords: normalizedFilters.excludeKeywords.length > 0,
          }
        );
        let disabledRequestFields = [];
        if (String(payload?.error || "").trim() && hintedRetryFields.length > 0) {
          for (const requestField of hintedRetryFields) {
            const retryPayloadRequest = this.buildElicitRequestRetryAttempt(requestPayload, requestField);
            if (!retryPayloadRequest) continue;
            this.logSemanticSourceRequest("elicit", {
              transport: "network",
              endpoint: "ElicitSearch.php",
              request: retryPayloadRequest,
              reason: "retry-disable-filter",
              disabledRequestFields: [requestField],
            });
            const retryPayload = await this.measureAsync(
              `Elicit request without ${requestField}`,
              () => this.requestBackendJson("ElicitSearch.php", retryPayloadRequest),
              { query: requestQuery, disabledRequestFields: [requestField] }
            );
            this.publishElicitRateLimitInfo(retryPayload?.rateLimit || null);
            if (!String(retryPayload?.error || "").trim()) {
              payload = retryPayload;
              disabledRequestFields = [requestField];
              break;
            }
          }
        }
        if (String(payload?.error || "").trim()) {
          return this.createEmptySourceResult("elicit", requestQuery, String(payload.error || "").trim());
        }
        if (disabledRequestFields.length > 0) {
          console.info("[ElicitFlow] Recovered request by disabling hinted filter.", {
            query: requestQuery,
            disabledRequestFields,
          });
        }
        const normalized = this.normalizeSourceResult("elicit", requestQuery, payload);
        await this.logSearchFlowDebugSourceResultGroup("Elicit", requestPayload, payload, normalized, {
          transport: "network",
          disabledRequestFields,
        });
        this.setCachedSemanticSourceResponse(cacheKey, normalized);
        return normalized;
      },
      async buildPubMedSearchStringFromFreeText(freeTextInput) {
        return this.runSearchFlowDebugSection(`02 PubMed query build • ${freeTextInput}`, async () => {
          let translated = await this.measureAsync(
            "PubMed query translation",
            () => this.translateSearch(freeTextInput),
            { input: freeTextInput }
          );
          this.logSearchFlowDebugInfo("PubMed query translation", {
            input: freeTextInput,
            translated,
          });
          if (this.instanceUseMeshValidation) {
            this.$emit("translating", true, this.index, "translatingStepMesh");
            translated = await this.measureAsync(
              "MeSH validation",
              () =>
                validateAndEnhanceMeshTerms(
                  translated,
                  freeTextInput,
                  this.appSettings.nlm.proxyUrl,
                  this.appSettings.openAi.baseUrl,
                  this.appSettings.client,
                  this.language,
                  (stepKey) => this.$emit("translating", true, this.index, stepKey)
                ),
              { input: freeTextInput }
            );
            this.logSearchFlowDebugInfo("PubMed query after MeSH validation", {
              input: freeTextInput,
              translated,
            });
          }
          return translated;
        });
      },
      buildSourceErrorResult(source, query, error) {
        const message = String(error || "");
        const prefixMap = {
          pubmed: "PubMedBestMatchFlow",
          semanticScholar: "SemanticScholarFlow",
          openAlex: "OpenAlexFlow",
          elicit: "ElicitFlow",
        };
        console.warn(`[${prefixMap[source] || "MultiSourceFlow"}] Source request failed.`, error);
        this.logSearchFlowDebugWarn(`04 Source retrieval • ${source} failed`, {
          query,
          error: message,
        });
        return this.createEmptySourceResult(source, query, message);
      },
      async fetchSemanticScholarPmids(query) {
        const result = await this.fetchSemanticScholarResults(query);
        return result.pmids;
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

        const keepDesktopLikeWidth = !this.shouldHideDropdownArrow && this.shouldUseDesktopInputWidthInMobileUi();

        // On touch/mobile use 100% width unless we explicitly keep desktop-like width for tablet.
        if (this.shouldHideDropdownArrow || (!keepDesktopLikeWidth && (this.isMobileInputMode() || this.isTouchDevice))) {
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
        if (this.isMobileInputMode() && !this.shouldUseDesktopInputWidthInMobileUi()) return;

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
        if (this.isMobileInputMode() && !this.shouldUseDesktopInputWidthInMobileUi()) return;
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
          delay: 0,
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

        // On mobile, do not keep focus on input unless user explicitly chose free text.
        // Prevents first tap from triggering both menu and keyboard.
        // Do not open action sheet from focus events (can happen on initial load).
        if (this.isMobileInputMode() && !this.mobileOverlayHidden) {
          this.$nextTick(() => {
            if (typeof input.blur === "function") input.blur();
          });
          return;
        }
        
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

        if (this.isMobileInputMode() && !this.mobileOverlayHidden) {
          event.preventDefault();
          event.stopPropagation();
          this.handleMobileTap();
          return;
        }
        
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

