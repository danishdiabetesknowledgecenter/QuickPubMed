<template>
  <div class="qpm_wordedSearchString">
    <div v-if="!isCollapsed" class="qpm_toggleDetails">
      <p
        v-if="hasValidTopics"
        data-html="true"
        class="qpm_advancedSearch qpm_noFloat"
      >
        <button
          type="button"
          v-tooltip="{
            content: details && getString('hoverDetailsText'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          :aria-expanded="String(!details)"
          :aria-controls="detailsPanelId"
          class="qpm_linkButton qpm_linkButtonAsAnchor"
          @click="toggleDetails"
        >{{ details ? getString("showDetails") : getString("hideDetails") }}</button>
      </p>
    </div>
    <div v-if="hasValidTopics" v-show="!details || isCollapsed" :id="detailsPanelId" class="qpm_middle">
      <p
        v-if="!advancedString"
        class="qpm_advancedSearch qpm_toggleAdvancedSpacing"
      >
        <button
          type="button"
          v-tooltip="{
            content: getString('hoverShowSearchStringText'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          :aria-expanded="String(advancedString)"
          :aria-controls="searchStringPanelId"
          class="qpm_linkButton qpm_linkButtonAsAnchor"
          @click="toggleAdvanced"
        >{{ getString("showSearchString") }}</button>
      </p>
      <p
        v-else
        class="qpm_advancedSearch qpm_toggleAdvancedSpacing"
      >
        <button
          type="button"
          v-tooltip="{
            content: getString('hoverShowPrettyStringText'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          :aria-expanded="String(advancedString)"
          :aria-controls="searchStringPanelId"
          class="qpm_linkButton qpm_linkButtonAsAnchor"
          @click="toggleAdvanced"
        >{{ getString("hideSearchString") }}</button>
      </p>
      <h2 v-if="showHeader" class="h3 qpm_inlineHeading">
        {{ getString("youAreSearchingFor") }}
      </h2>
      <div :id="searchStringPanelId">
          <div v-if="!advancedString">
            <span class="qpm_searchStringPreText">{{ getSearchPreString }} {{ " " }}</span>
            <div v-for="(group, idx) in topics" :key="idx" class="qpm_searchStringSubjectGroup">
              <span
                v-if="idx > 0 && group.length !== 0 && idx !== checkFirstSubjectRender"
                class="qpm_searchStringGroupOperator_NotApplied"
                >{{ " " }} {{ getString("youAreSearchingForAnd") }} {{ " " }}</span
              >
              <div v-if="Object.keys(group).length !== 0" class="qpm_searchStringWordGroup">
                <div
                  v-for="(subjectObj, idx2) in group"
                  :key="idx2"
                  class="qpm_searchStringWordGroupWrapper"
                >
                  <span class="qpm_wordedStringSubject">{{ getWordedTopicString(subjectObj) }}</span>
                  <span v-if="!subjectObj.preString" class="qpm_wordedStringOperator">{{
                    getScope(subjectObj)
                  }}</span>
                  {{ " "
                  }}<span v-if="idx2 < group.length - 1" class="qpm_searchStringOperator"
                    >{{ getString("orOperator").toLowerCase() }}
                  </span>
                </div>
                <div v-if="group.length > 0" class="qpm_halfBorder" />
              </div>
            </div>
            <br />
            <span v-if="!limitsIsEmpty" class="qpm_searchStringPreText qpm_searchStringPreTextLimits">
              <div class="qpm_hideonmobile qpm_limitsTopPadding" />
              {{ getString("limitsPreString") }} {{ " " }}
            </span>
            <div
              v-for="(group, idx) in activeLimitDropdowns"
              :key="`filter-${idx}`"
              class="qpm_searchStringFilterGroup"
            >
              <span
                v-if="idx > 0 && group.length !== 0"
                class="qpm_searchStringGroupOperator_NotApplied"
                >{{ " " }} {{ getString("youAreSearchingForAnd") }} {{ " " }}</span
              >
              <div v-if="group.length !== 0" class="qpm_searchStringWordGroup">
                <div
                  v-for="(filterItem, idx2) in group"
                  :key="idx2"
                  class="qpm_searchStringWordGroupWrapper"
                >
                  <span class="qpm_wordedStringSubject"
                    ><span v-if="showLimitCategory(group, idx2)" class="qpm_filterCategoryPrefix"
                      >{{ getLimitCategoryName(filterItem) }} = </span
                    >{{ getWordedLimitString(filterItem) }}</span
                  >
                  <span class="qpm_wordedStringOperator">{{ getScope(filterItem) }}</span>
                  {{ " "
                  }}<span v-if="idx2 < group.length - 1" class="qpm_searchStringOperator"
                    >{{ getLimitItemsOperator(group) }}
                  </span>
                </div>
                <div v-if="group.length > 0" class="qpm_halfBorder" />
              </div>
            </div>
          </div>
          <div v-else>
            <textarea
              ref="searchStringTextarea"
              v-tooltip.bottom="{
                content: getString('hoverSearchString'),
                distance: 5,
                delay: $helpTextDelay,
              }"
              :value="searchstring"
              :aria-label="getString('searchStringTextareaLabel')"
              class="qpm_searchStringTextarea"
              readonly
              name="searchstring"
              rows="6"
              @keyup.enter="copyTextfieldFunction()"
              @click="selectAndCopy"
            />
          </div>
        </div>
      <div v-if="!isCollapsed || (isCollapsed && advancedString)">
        <div v-if="!advancedString" class="qpm_searchStringDivider" />
        <p class="qpm_pubmedLink qpm_pubmedLinkArrow">
          <a
            v-tooltip="{
              content: getString('hoverShowPubMedLinkText'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            target="_blank"
            rel="noopener noreferrer"
            :href="getPubMedLink"
          >
            {{ getString("showPubMedLink") }}
          </a>
        </p>
        <p class="qpm_pubmedLink qpm_pubmedLinkArrow">
          <a
            v-tooltip="{
              content: getString('hoverShowPubMedLinkCreateAlertText'),
              distance: 5,
              delay: $helpTextDelay,
            }"
            target="_blank"
            rel="noopener noreferrer"
            :href="getPubMedLinkCreateAlert"
          >
            {{ getString("createPubMedAlert") }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { order } from "@/assets/content/order.js";
  import { getLocalizedTranslation } from "@/utils/componentHelpers";

  export default {
    name: "WordedSearchString",
    mixins: [appSettingsMixin, utilitiesMixin],
    props: {
      topics: {
        type: Array,
        required: true,
      },
      limits: {
        type: Object,
        required: true,
      },
      availableLimits: {
        type: Array,
        default: () => [],
      },
      limitDropdowns: {
        type: Array,
        default: () => [[]],
      },
      searchstring: {
        type: String,
        required: true,
      },
      isCollapsed: {
        type: Boolean,
        default: false,
      },
      details: {
        type: Boolean,
        default: false,
      },
      advancedString: {
        type: Boolean,
        default: false,
      },
      advancedSearch: {
        type: Boolean,
        default: false,
      },
      showHeader: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: "dk",
      },
    },
    emits: ["toggleAdvancedString", "toggleDetailsBox"],
    computed: {
      detailsPanelId() {
        return `qpm_wordedSearchDetails_${this._uid}`;
      },
      searchStringPanelId() {
        return `qpm_wordedSearchString_${this._uid}`;
      },
      /**
       * Determines if the topics prop contains at least one non-empty entry.
       *
       * @returns {boolean} True if topics contain meaningful data, else false.
       */
      hasValidTopics() {
        return (
          Array.isArray(this.topics) &&
          this.topics.length > 0 &&
          Array.isArray(this.topics[0]) &&
          this.topics[0].length > 0
        );
      },

      /**
       * Returns an array of [key, value] pairs from the limits object
       * where the value array is not empty.
       */
      activeLimits() {
        return Object.entries(this.limits).filter(
          ([, value]) => Array.isArray(value) && value.length > 0
        );
      },
      /**
       * Returns limit groups for display.
       * In advanced mode: uses limitDropdowns (each dropdown = one group).
       * In simple mode: falls back to limits (limitData), each category = one group.
       */
      activeLimitDropdowns() {
        const safeDropdowns = Array.isArray(this.limitDropdowns) ? this.limitDropdowns : [];
        const dropdownGroups = safeDropdowns.filter(
          (group) => Array.isArray(group) && group.length > 0
        );
        const simpleGroups = this.activeLimits.map(([, items]) => items);
        if (this.advancedSearch) {
          if (dropdownGroups.length > 0) return dropdownGroups;
          return simpleGroups;
        }
        return [...simpleGroups, ...dropdownGroups];
      },
      limitsIsEmpty() {
        return this.activeLimitDropdowns.length === 0;
      },
      getPubMedLink() {
        const myncbiShare = this.appSettings?.nlm?.myncbishare || "";
        return `https://pubmed.ncbi.nlm.nih.gov/?myncbishare=${myncbiShare}&term=${encodeURIComponent(
          this.searchstring
        )}`;
      },
      getPubMedLinkCreateAlert() {
        return `https://account.ncbi.nlm.nih.gov/?back_url=${encodeURIComponent(
          "https://pubmed.ncbi.nlm.nih.gov/?&term="
        )}${encodeURIComponent(this.searchstring)}${encodeURIComponent(
          "#open-saved-search-panel"
        )}`;
      },
      getSearchPreString() {
        const count = this.topics.reduce((sum, group) => {
          return sum + (Array.isArray(group) ? group.length : 0);
        }, 0);
        if (count > 1) {
          return this.getString("searchPreStringPlural");
        } else {
          return this.getString("searchPreStringSingular");
        }
      },
      checkFirstSubjectRender() {
        for (let i = 0; i < this.topics.length; i++) {
          try {
            if (this.topics[i].length > 0) return i;
          } catch (error) {
            console.error(error);
            continue;
          }
        }
        return -1;
      },
      checkFirstFilterRender() {
        const filter = Object.keys(this.limits);
        for (let i = 0; i < filter.length; i++) {
          try {
            const first = this.limits[filter[i]]?.[0];
            if (first?.id || first?.name || first?.translations) return i;
          } catch (error) {
            console.error(error);
            continue;
          }
        }
        return -1;
      },
    },
    methods: {
      toggleAdvanced() {
        this.$emit("toggleAdvancedString");
      },
      toggleDetails() {
        this.$emit("toggleDetailsBox");
      },
      getScope(obj) {
        if (!this.advancedSearch || this.isSingleScoped(obj)) {
          return "";
        }

        const scopeToLabelKey = {
          broad: "broad",
          narrow: "narrow",
        };
        const labelKey = scopeToLabelKey[obj.scope] || "normal";
        return ` (${this.getString(labelKey)})`;
      },
      getWordedTopicString(string) {
        if (!string || typeof string !== "object") return "";

        if (string.translations) {
          const translated = getLocalizedTranslation(string, this.language);
          if (translated) return translated;
        }

        if (string.isTranslated && string.preTranslation) {
          return (
            string.preTranslation +
            " (" +
            this.getString("manualInputTermTranslated") +
            ": " +
            (string.name || "") +
            ")"
          );
        }

        return string.name || string.id || "";
      },
      getWordedLimitString(filter) {
        try {
          if (filter?.isCustom) {
            if (filter.isTranslated && filter.preTranslation) {
              return (
                filter.preTranslation +
                " (" +
                this.getString("manualInputTermTranslated") +
                ": " +
                (filter.name || "") +
                ")"
              );
            }
            return filter.name || this.getManualInputTermLabel();
          }
          if (filter?.translations) {
            return getLocalizedTranslation(filter, this.language) || filter.id;
          }
          if (filter?.id) {
            return this.getWordedLimitStringById(filter.id);
          }
          if (typeof filter === "string" || filter instanceof String) {
            return this.getWordedLimitStringById(filter);
          }
          return filter?.name;
        } catch (e) {
          console.error(filter, e);
          return filter;
        }
      },
      getWordedLimitStringById(id) {
        if (this.isCustomFilterId(id)) {
          return this.getManualInputTermLabel();
        }
        const type = id.substr(0, 1).toLowerCase();
        const groupId = id.substr(0, 3);
        const lg = this.language;

        const byId = (e) => e.id === id;
        const byGroupId = (e) => e.id === groupId;

        if (type === "o") {
          const orderEntry = order.find(byId);
          if (!orderEntry || !orderEntry.translations) return id;
          const translated = getLocalizedTranslation(orderEntry, lg);
          return translated || id;
        } else if (type === "s") {
          return id;
        } else if (type === "l") {
          const group = this.availableLimits.find(byGroupId);
          if (!group) return id;
          if (id.length === 3) {
            return getLocalizedTranslation(group, lg) || id;
          } else {
            const choice = group.choices.find(byId);
            if (!choice) return id;
            return getLocalizedTranslation(choice, lg) || id;
          }
        } else {
          throw new Error("Id not handled by getWordedLimitStringById. id: " + id);
        }
      },
      isSingleScoped(obj) {
        if (obj?.translationSourceKey) return true;
        if (!obj.searchStrings) return false;

        const count = ["broad", "narrow", "normal"].reduce((sum, scope) => {
          return sum + (obj.searchStrings[scope] ? 1 : 0);
        }, 0);

        return count === 1;
      },
      copyTextfieldFunction() {
        const textarea = this.$refs.searchStringTextarea;
        if (!textarea) return;
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        document.execCommand("copy");
      },
      selectAndCopy() {
        this.copyTextfieldFunction();
      },
      /**
       * Returns true if the category prefix should be shown for this filter item.
       * If all items in the group share the same category, only the first item shows it.
       * If categories are mixed, every item shows its category.
       */
      showLimitCategory(group, idx) {
        if (idx === 0) return true;
        // Check if all items in the group have the same category
        const firstCategory = this.getLimitCategoryName(group[0]);
        const allSame = group.every((item) => this.getLimitCategoryName(item) === firstCategory);
        return !allSame;
      },
      getLimitItemsOperator(group) {
        const safeGroup = Array.isArray(group) ? group : [];
        const isDatabaseGroup =
          safeGroup.length > 0 && safeGroup.every((item) => !!item?.translationSourceKey);
        return this.getString(isDatabaseGroup ? "andOperator" : "orOperator").toLowerCase();
      },
      getLimitCategoryName(item) {
        if (!item.id || this.isCustomFilterId(item.id)) {
          return this.getManualInputTermLabel();
        }
        // Find the category by checking which filter group contains this item's id
        const groupId = item.id.substring(0, 4);
        const group = this.availableLimits.find(
          (f) => f.id === groupId || (f.choices && f.choices.some((c) => c.id === item.id))
        );
        if (group && group.translations) {
          const lg = this.language;
          const name = getLocalizedTranslation(group, lg);
          return name.charAt(0).toUpperCase() + name.slice(1);
        }
        return "";
      },
      getWordedLimitStringFromId(id) {
        // Handle custom filter entries (manually entered search terms)
        if (this.isCustomFilterId(id)) {
          return this.getManualInputTermLabel();
        }
        const filterGroup = this.availableLimits.find((group) => group.id === id);
        if (filterGroup && filterGroup.translations) {
          return getLocalizedTranslation(filterGroup, this.language);
        }
        return this.getWordedLimitStringById(id);
      },
      isCustomFilterId(id) {
        return typeof id === "string" && id.startsWith("__custom__");
      },
      getManualInputTermLabel() {
        return this.getString("manualInputTerm") || "Søgeord";
      },
    },
  };
</script>
