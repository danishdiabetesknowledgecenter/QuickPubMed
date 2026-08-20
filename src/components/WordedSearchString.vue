<template>
  <div class="mugin_wordedSearchString">
    <div v-if="!isCollapsed" class="mugin_toggleDetails">
      <p
        v-if="hasValidTopics"
        data-html="true"
        class="mugin_advancedSearch mugin_noFloat"
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
          class="mugin_linkButton mugin_linkButtonAsAnchor"
          @click="toggleDetails"
        >{{ details ? getString("showDetails") : getString("hideDetails") }}</button>
      </p>
    </div>
    <div v-if="hasValidTopics" v-show="!details || isCollapsed" :id="detailsPanelId" class="mugin_middle">
      <p
        v-if="!advancedString"
        class="mugin_advancedSearch mugin_toggleAdvancedSpacing"
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
          class="mugin_linkButton mugin_linkButtonAsAnchor"
          @click="toggleAdvanced"
        >{{
          displayedSourceQueries.length > 1 ? getString("showSearchStrings") : getString("showSearchString")
        }}</button>
      </p>
      <p
        v-else
        class="mugin_advancedSearch mugin_toggleAdvancedSpacing"
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
          class="mugin_linkButton mugin_linkButtonAsAnchor"
          @click="toggleAdvanced"
        >{{
          displayedSourceQueries.length > 1 ? getString("hideSearchStrings") : getString("hideSearchString")
        }}</button>
      </p>
      <h2 v-if="showHeader" class="h3 mugin_inlineHeading">
        {{ getString("youAreSearchingFor") }}
      </h2>
      <div :id="searchStringPanelId">
          <div v-if="!advancedString">
            <span class="mugin_searchStringPreText">{{ getSearchPreString }} {{ " " }}</span>
            <div v-for="(group, idx) in topics" :key="idx" class="mugin_searchStringSubjectGroup">
              <span
                v-if="idx > 0 && group.length !== 0 && idx !== checkFirstSubjectRender"
                class="mugin_searchStringGroupOperator_NotApplied"
                >{{ " " }} {{ getString("youAreSearchingForAnd") }} {{ " " }}</span
              >
              <div v-if="Object.keys(group).length !== 0" class="mugin_searchStringWordGroup">
                <div
                  v-for="(subjectObj, idx2) in group"
                  :key="idx2"
                  class="mugin_searchStringWordGroupWrapper"
                >
                  <span class="mugin_wordedStringSubject">{{ getWordedTopicString(subjectObj) }}</span>
                  <span v-if="!subjectObj.preString" class="mugin_wordedStringOperator">{{
                    getScope(subjectObj)
                  }}</span>
                  {{ " "
                  }}<span v-if="idx2 < group.length - 1" class="mugin_searchStringOperator"
                    >{{ getString("orOperator").toLowerCase() }}
                  </span>
                </div>
                <div v-if="group.length > 0" class="mugin_halfBorder" />
              </div>
            </div>
            <br />
            <span v-if="!limitsIsEmpty" class="mugin_searchStringPreText mugin_searchStringPreTextLimits">
              <div class="mugin_hideonmobile mugin_limitsTopPadding" />
              {{ getString("limitsPreString") }} {{ " " }}
            </span>
            <div
              v-for="(group, idx) in activeLimitDropdowns"
              :key="`filter-${idx}`"
              class="mugin_searchStringFilterGroup"
            >
              <span
                v-if="idx > 0 && group.length !== 0"
                class="mugin_searchStringGroupOperator_NotApplied"
                >{{ " " }} {{ getString("youAreSearchingForAnd") }} {{ " " }}</span
              >
              <div v-if="group.length !== 0" class="mugin_searchStringWordGroup">
                <div
                  v-for="(filterItem, idx2) in group"
                  :key="idx2"
                  class="mugin_searchStringWordGroupWrapper"
                >
                  <span class="mugin_wordedStringSubject"
                    ><span v-if="showLimitCategory(group, idx2)" class="mugin_filterCategoryPrefix"
                      >{{ getLimitCategoryName(filterItem) }} = </span
                    >{{ getWordedLimitString(filterItem) }}</span
                  >
                  <span class="mugin_wordedStringOperator">{{ getScope(filterItem) }}</span>
                  {{ " "
                  }}<span v-if="idx2 < group.length - 1" class="mugin_searchStringOperator"
                    >{{ getLimitItemsOperator(group) }}
                  </span>
                </div>
                <div v-if="group.length > 0" class="mugin_halfBorder" />
              </div>
            </div>
          </div>
          <div v-else class="mugin_sourceSearchStringList">
            <p class="mugin_searchStringEditHint">{{ getString("searchStringEditAndSearchHint") }}</p>
            <div
              v-for="(item, index) in displayedSourceQueries"
              :key="item.key"
              class="mugin_sourceSearchStringBlock"
            >
              <div v-if="index > 0" class="mugin_searchStringDivider" />
              <div class="mugin_sourceSearchStringHeader">
                <span class="mugin_sourceSearchStringLabel">{{
                  sourceQueryLabel(item)
                }}</span>
                <div class="mugin_sourceSearchStringHeaderActions">
                  <button
                    v-if="!sourceQueryFields(item).length"
                    type="button"
                    class="mugin_iconButton mugin_editSearchStringButton"
                    :class="isSourceQueryEditing(item.key) ? 'bx bx-check' : 'bx bx-pencil'"
                    :aria-label="isSourceQueryEditing(item.key) ? getString('doneEditingSearchString') : getString('editSearchString')"
                    :aria-pressed="String(isSourceQueryEditing(item.key))"
                    v-tooltip="{
                      content: isSourceQueryEditing(item.key) ? getString('doneEditingSearchString') : getString('editSearchString'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    @click="toggleSourceQueryEditing(item.key)"
                  />
                  <button
                    v-if="hasSourceQueryValue(item)"
                    type="button"
                    class="mugin_linkButton mugin_linkButtonAsAnchor mugin_copySearchStringButton"
                    @click="copySourceQuery(item)"
                  >
                    {{ getString("copySearchString") }}
                  </button>
                </div>
              </div>
              <div
                v-for="field in sourceQueryFields(item)"
                :key="field.key"
                class="mugin_sourceSearchStringField"
              >
                <div class="mugin_sourceSearchStringFieldHeader">
                  <span class="mugin_keepWithIcon">
                    <span class="mugin_sourceSearchStringPartLabel">{{ sourceQueryLabel(field) }}</span>
                    <button
                      v-if="sourceQueryFieldInfo(field)"
                      type="button"
                      v-tooltip="{
                        content: sourceQueryFieldInfo(field),
                        distance: 5,
                        delay: $helpTextDelay,
                        theme: 'infoTooltip',
                      }"
                      class="bx bx-info-circle mugin_cursorHelp mugin_infoIcon"
                      :aria-label="getString('infoSearchStringLimitsLabel')"
                    />
                  </span>
                  <button
                    v-if="isSourceQueryFieldEditable(field)"
                    type="button"
                    class="mugin_iconButton mugin_editSearchStringButton"
                    :class="isSourceQueryEditing(field.key) ? 'bx bx-check' : 'bx bx-pencil'"
                    :aria-label="isSourceQueryEditing(field.key) ? getString('doneEditingSearchString') : getString('editSearchString')"
                    :aria-pressed="String(isSourceQueryEditing(field.key))"
                    v-tooltip="{
                      content: isSourceQueryEditing(field.key) ? getString('doneEditingSearchString') : getString('editSearchString'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    @click="toggleSourceQueryEditing(field.key)"
                  />
                </div>
                <div
                  v-if="isSourceQueryLimitsField(field)"
                  class="mugin_sourceSearchStringLimits"
                >
                  <div
                    v-for="(group, idx) in sourceQueryLimitGroups(field)"
                    :key="`source-limit-${field.key}-${idx}`"
                    class="mugin_searchStringFilterGroup"
                  >
                    <span
                      v-if="idx > 0 && group.length !== 0"
                      class="mugin_searchStringGroupOperator_NotApplied"
                      >{{ " " }} {{ getString("youAreSearchingForAnd") }} {{ " " }}</span
                    >
                    <div
                      v-if="group.length !== 0"
                      class="mugin_searchStringWordGroup"
                      :class="{ 'mugin_sourceLimitPillHasTooltip': sourceLimitGroupActualValue(group) }"
                      v-tooltip="sourceLimitGroupTooltip(group)"
                    >
                      <div
                        v-for="(filterItem, idx2) in group"
                        :key="idx2"
                        class="mugin_searchStringWordGroupWrapper"
                      >
                        <span class="mugin_wordedStringSubject"
                          ><span
                            v-if="showLimitCategory(group, idx2)"
                            class="mugin_filterCategoryPrefix"
                            >{{ getLimitCategoryName(filterItem) }} = </span
                          >{{ getWordedLimitString(filterItem) }}</span
                        >
                        <span class="mugin_wordedStringOperator">{{
                          getSourceLimitScope(item, filterItem)
                        }}</span>
                        {{ " "
                        }}<span
                          v-if="idx2 < group.length - 1"
                          class="mugin_searchStringOperator"
                          >{{ getLimitItemsOperator(group) }}
                        </span>
                      </div>
                      <div v-if="group.length > 0" class="mugin_halfBorder" />
                    </div>
                  </div>
                </div>
                <div v-else class="mugin_sourceSearchStringInputWrap">
                  <textarea
                    v-if="isSourceQueryFieldEditable(field) && isSourceQueryEditing(field.key)"
                    :id="sourceQueryInputId(field.key)"
                    :ref="(el) => setSourceQueryTextareaRef(field.key, el)"
                    v-tooltip.bottom="{
                      content: getString('hoverSearchString'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    :value="field.value"
                    :aria-label="sourceQueryLabel(field)"
                    :aria-busy="isSourceQueryPending(item, field) ? 'true' : null"
                    :class="['mugin_searchStringTextarea', { 'is-translating': isSourceQueryPending(item, field) }]"
                    :name="'searchstring-' + field.key"
                    rows="1"
                    @input="onSourceQueryInput(field.key, $event)"
                  />
                  <p
                    v-else
                    class="mugin_searchStringText"
                    :class="{ 'is-translating': isSourceQueryPending(item, field) }"
                  >{{ field.value }}</p>
                  <div
                    v-if="isSourceQueryPending(item, field)"
                    class="mugin_searchStringTranslatingOverlay"
                  >
                    <span class="mugin_searchStringTranslatingLabel">{{ sourceQueryTranslatingText }}</span>
                    <loading-spinner
                      :loading="true"
                      class="mugin_searchStringTextareaSpinner mugin_inlineBlock"
                      :size="30"
                    />
                  </div>
                </div>
                <p v-if="sourceQueryFieldHint(field)" class="mugin_sourceSearchStringFilterHint">
                  {{ sourceQueryFieldHint(field) }}
                </p>
              </div>
              <div
                v-if="!sourceQueryFields(item).length"
                class="mugin_sourceSearchStringInputWrap"
              >
                <textarea
                  v-if="isSourceQueryEditing(item.key)"
                  :id="sourceQueryInputId(item.key)"
                  :ref="(el) => setSourceQueryTextareaRef(item.key, el)"
                  v-tooltip.bottom="{
                    content: getString('hoverSearchString'),
                    distance: 5,
                    delay: $helpTextDelay,
                  }"
                  :value="item.value"
                  :aria-label="sourceQueryLabel(item)"
                  :aria-busy="isSourceQueryPending(item) ? 'true' : null"
                  :class="['mugin_searchStringTextarea', { 'is-translating': isSourceQueryPending(item) }]"
                  :name="'searchstring-' + item.key"
                  rows="1"
                  @input="onSourceQueryInput(item.key, $event)"
                />
                <p
                  v-else
                  class="mugin_searchStringText"
                  :class="{ 'is-translating': isSourceQueryPending(item) }"
                >{{ item.value }}</p>
                <div
                  v-if="isSourceQueryPending(item)"
                  class="mugin_searchStringTranslatingOverlay"
                >
                  <span class="mugin_searchStringTranslatingLabel">{{ sourceQueryTranslatingText }}</span>
                  <loading-spinner
                    :loading="true"
                    class="mugin_searchStringTextareaSpinner mugin_inlineBlock"
                    :size="30"
                  />
                </div>
              </div>
              <p v-if="item.filterHint" class="mugin_sourceSearchStringFilterHint">
                {{ getString("searchStringFilterHintPrefix") }} {{ item.filterHint }}
              </p>
              <p v-if="hasSourceQueryValue(item)" class="mugin_pubmedLink mugin_pubmedLinkArrow">
                <span class="mugin_keepWithIcon">
                  <a
                    v-tooltip="{
                      content: getSourceSearchLinkHover(item),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="getSourceSearchLink(item)"
                  >
                    {{ getSourceSearchLinkLabel(item) }}
                  </a>
                  <button
                    v-if="sourceSearchLinkInfo(item)"
                    type="button"
                    v-tooltip="{
                      content: sourceSearchLinkInfo(item),
                      distance: 5,
                      delay: $helpTextDelay,
                      theme: 'infoTooltip',
                    }"
                    class="bx bx-info-circle mugin_cursorHelp mugin_infoIcon"
                    :aria-label="getString('infoSourceSearchLinkLimitsLabel')"
                  />
                </span>
              </p>
              <p
                v-if="item.key === 'pubmed' && hasSourceQueryValue(item)"
                class="mugin_pubmedLink mugin_pubmedLinkArrow"
              >
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
      <div v-if="!advancedString && !isCollapsed">
        <div v-if="!advancedString" class="mugin_searchStringDivider" />
        <p class="mugin_pubmedLink mugin_pubmedLinkArrow">
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
        <p class="mugin_pubmedLink mugin_pubmedLinkArrow">
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
  import LoadingSpinner from "@/components/LoadingSpinner.vue";

  let wordedSearchStringUid = 0;

  export default {
    name: "WordedSearchString",
    components: {
      LoadingSpinner,
    },
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
      sourceQueries: {
        type: Array,
        default: () => [],
      },
      pendingSourceKeys: {
        type: Object,
        default: () => ({}),
      },
      translatingLabel: {
        type: String,
        default: "",
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
    emits: ["toggleAdvancedString", "toggleDetailsBox", "update:query", "query-edit-finished"],
    data() {
      return {
        componentUid: ++wordedSearchStringUid,
        translatingDotCount: 0,
        translatingDotIntervalId: null,
        editingSourceQueryKeys: {},
      };
    },
    created() {
      this.sourceQueryTextareaRefs = {};
    },
    computed: {
      detailsPanelId() {
        return `mugin_wordedSearchDetails_${this.componentUid}`;
      },
      searchStringPanelId() {
        return `mugin_wordedSearchString_${this.componentUid}`;
      },
      displayedSourceQueries() {
        return Array.isArray(this.sourceQueries) ? this.sourceQueries : [];
      },
      hasPendingSourceQuery() {
        return Object.values(this.pendingSourceKeys || {}).some((value) => value === true);
      },
      sourceQueryTranslatingText() {
        const fromParent = String(this.translatingLabel || "").trim();
        if (fromParent) return fromParent;
        const base = this.getString("translatingStepSearchString");
        if (!this.hasPendingSourceQuery) return base;
        const dots = ".".repeat(Math.max(1, this.translatingDotCount));
        return `${base}${dots}`;
      },
      pubmedSearchString() {
        const pubmed = this.displayedSourceQueries.find((item) => item?.key === "pubmed");
        return String(pubmed?.value || this.searchstring || "");
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
          this.pubmedSearchString
        )}`;
      },
      getPubMedLinkCreateAlert() {
        return `https://account.ncbi.nlm.nih.gov/?back_url=${encodeURIComponent(
          "https://pubmed.ncbi.nlm.nih.gov/?&term="
        )}${encodeURIComponent(this.pubmedSearchString)}${encodeURIComponent(
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
    watch: {
      advancedString(isAdvanced) {
        if (isAdvanced) this.autosizeAllSourceQueryTextareas();
        else this.editingSourceQueryKeys = {};
      },
      displayedSourceQueries: {
        deep: true,
        handler() {
          this.autosizeAllSourceQueryTextareas();
        },
      },
      hasPendingSourceQuery: {
        immediate: true,
        handler(isPending) {
          this.syncTranslatingDotInterval(isPending);
        },
      },
      translatingLabel() {
        this.syncTranslatingDotInterval(this.hasPendingSourceQuery);
      },
    },
    beforeUnmount() {
      this.clearTranslatingDotInterval();
    },
    methods: {
      toggleAdvanced() {
        this.$emit("toggleAdvancedString");
      },
      toggleDetails() {
        this.$emit("toggleDetailsBox");
      },
      sourceQueryInputId(sourceKey) {
        return `${this.searchStringPanelId}_${String(sourceKey || "pubmed")}`;
      },
      sourceQueryLabel(item) {
        if (item?.label) return item.label;
        if (item?.labelKey) return this.getString(item.labelKey);
        return this.getString("searchString");
      },
      sourceQueryFields(item) {
        return Array.isArray(item?.parts) ? item.parts : [];
      },
      isSourceQueryFieldEditable(field) {
        if (field?.readOnly === true) return false;
        const key = String(field?.key || "");
        return key !== "pubmedLimits" && !key.endsWith("Limits");
      },
      sourceQueryFieldHint(field) {
        const hintKey = String(field?.hintKey || "").trim();
        return hintKey ? this.getString(hintKey) : "";
      },
      sourceQueryFieldInfo(field) {
        const infoKey = String(field?.infoKey || "").trim();
        if (!infoKey) return "";
        const text = this.getString(infoKey);
        const source = String(field?.infoSourceLabel || "").trim();
        return source ? this.replaceSourcePlaceholder(text, source) : text;
      },
      isSourceQueryLimitsField(field) {
        return field?.readOnly === true || String(field?.key || "").endsWith("Limits");
      },
      sourceQueryLimitGroups(field) {
        return Array.isArray(field?.limitGroups) ? field.limitGroups : [];
      },
      isPubmedLimitActualValue(value) {
        return /\[[a-z0-9]+\]/i.test(value) || /\b(?:OR|AND|NOT)\b/.test(value);
      },
      splitActualLimitValue(value) {
        const text = String(value || "").trim();
        if (!text) return [];
        if (this.isPubmedLimitActualValue(text)) return [text];
        return text
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean);
      },
      sourceLimitGroupActualValue(group) {
        const items = Array.isArray(group) ? group : [];
        const rawValues = items
          .map((item) => String(item?.actualLimitValue || "").trim())
          .filter(Boolean);
        const tokens = [];
        const seen = new Set();
        rawValues.forEach((value) => {
          this.splitActualLimitValue(value).forEach((part) => {
            const key = part.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            tokens.push(part);
          });
        });
        if (tokens.length === 0) return "";
        const separator = rawValues.some((value) => this.isPubmedLimitActualValue(value))
          ? " OR "
          : ", ";
        return tokens.join(separator);
      },
      sourceLimitGroupTooltip(group) {
        const content = this.sourceLimitGroupActualValue(group);
        if (!content) return null;
        return {
          content,
          distance: 5,
          delay: this.$helpTextDelay,
        };
      },
      getSourceLimitScope(sourceItem, filterItem) {
        if (String(sourceItem?.key || "") !== "pubmed") return "";
        return this.getScope(filterItem);
      },
      isSourceQueryEditing(sourceKey) {
        return this.editingSourceQueryKeys?.[sourceKey] === true;
      },
      toggleSourceQueryEditing(sourceKey) {
        const key = String(sourceKey || "").trim();
        if (!key) return;
        const next = { ...(this.editingSourceQueryKeys || {}) };
        const entering = next[key] !== true;
        next[key] = entering;
        this.editingSourceQueryKeys = next;
        if (entering) {
          this.$nextTick(() => {
            const el = this.sourceQueryTextareaRefs?.[key];
            this.autosizeSourceQueryTextarea(el);
            if (el && typeof el.focus === "function") el.focus();
          });
          return;
        }
        this.$emit("query-edit-finished", { key });
      },
      hasSourceQueryValue(item) {
        return String(item?.value || "").trim() !== "";
      },
      isSourceQueryPending(item, field = null) {
        const fieldKey = String(field?.key || "").trim();
        if (field?.readOnly === true || fieldKey.endsWith("Limits")) {
          return false;
        }
        if (fieldKey === "pubmedTopics") {
          return this.pendingSourceKeys?.pubmed === true;
        }
        return this.pendingSourceKeys?.[item?.key] === true;
      },
      clearTranslatingDotInterval() {
        if (this.translatingDotIntervalId !== null && this.translatingDotIntervalId !== undefined) {
          clearInterval(this.translatingDotIntervalId);
          this.translatingDotIntervalId = null;
        }
        this.translatingDotCount = 0;
      },
      syncTranslatingDotInterval(isPending) {
        const useLocalLabel = isPending === true && !String(this.translatingLabel || "").trim();
        if (!useLocalLabel) {
          this.clearTranslatingDotInterval();
          return;
        }
        if (this.translatingDotIntervalId !== null && this.translatingDotIntervalId !== undefined) {
          return;
        }
        this.translatingDotCount = 1;
        this.translatingDotIntervalId = setInterval(() => {
          this.translatingDotCount = (this.translatingDotCount % 5) + 1;
        }, 400);
      },
      setSourceQueryTextareaRef(sourceKey, el) {
        if (!this.sourceQueryTextareaRefs || typeof this.sourceQueryTextareaRefs !== "object") {
          this.sourceQueryTextareaRefs = {};
        }
        if (el) {
          this.sourceQueryTextareaRefs[sourceKey] = el;
          this.$nextTick(() => this.autosizeSourceQueryTextarea(el));
        } else {
          delete this.sourceQueryTextareaRefs[sourceKey];
        }
      },
      autosizeSourceQueryTextarea(el) {
        if (!el || el.nodeType !== 1) return;
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      },
      autosizeAllSourceQueryTextareas() {
        this.$nextTick(() => {
          const refs = this.sourceQueryTextareaRefs;
          if (!refs || typeof refs !== "object") return;
          Object.values(refs).forEach((el) => this.autosizeSourceQueryTextarea(el));
        });
      },
      flushSourceQueryEdits() {
        const refs = this.sourceQueryTextareaRefs || {};
        Object.keys(refs).forEach((key) => {
          const el = refs[key];
          if (!el || el.nodeType !== 1) return;
          this.$emit("update:query", {
            key,
            value: el.value ?? "",
          });
        });
      },
      onSourceQueryInput(sourceKey, event) {
        this.autosizeSourceQueryTextarea(event?.target);
        this.$emit("update:query", {
          key: sourceKey,
          value: event?.target?.value ?? "",
        });
      },
      getSourceSearchLinkFilters(item) {
        return item?.linkFilters && typeof item.linkFilters === "object" ? item.linkFilters : {};
      },
      sourceSearchLinkFilterList(value) {
        return (Array.isArray(value) ? value : [])
          .map((entry) => String(entry || "").trim())
          .filter(Boolean);
      },
      parseSourceSearchLinkYearRange(value) {
        const text = String(value || "").trim();
        const match = text.match(/^(\d{4})(?:-(\d{4}))?$/);
        if (!match) return null;
        return { from: match[1], to: match[2] || match[1] };
      },
      getSourceSearchLink(item) {
        const key = String(item?.key || "");
        const query = String(item?.value || "").trim();
        const filters = this.getSourceSearchLinkFilters(item);
        if (key === "pubmed") {
          const myncbiShare = this.appSettings?.nlm?.myncbishare || "";
          return `https://pubmed.ncbi.nlm.nih.gov/?myncbishare=${myncbiShare}&term=${encodeURIComponent(
            query || this.pubmedSearchString
          )}`;
        }
        if (key === "semanticScholar") {
          const params = new URLSearchParams();
          params.set("q", query);
          params.set("sort", "relevance");
          const yearRange = this.parseSourceSearchLinkYearRange(filters.year || filters.publicationYear);
          if (yearRange) {
            params.append("year[0]", yearRange.from);
            params.append("year[1]", yearRange.to);
          }
          return `https://www.semanticscholar.org/search?${params.toString()}`;
        }
        if (key === "openAlex") {
          const filterParts = [];
          if (query) filterParts.push(`default.search:${query}`);
          const languages = this.sourceSearchLinkFilterList(filters.language);
          if (languages.length) filterParts.push(`language:${languages.join("|")}`);
          const sourceTypes = this.sourceSearchLinkFilterList(filters.sourceType);
          if (sourceTypes.length) {
            filterParts.push(`primary_location.source.type:${sourceTypes.join("|")}`);
          }
          const workTypes = this.sourceSearchLinkFilterList(filters.workType);
          if (workTypes.length) filterParts.push(`type:${workTypes.join("|")}`);
          const publicationYear = String(filters.publicationYear || filters.year || "").trim();
          if (publicationYear) filterParts.push(`publication_year:${publicationYear}`);
          if (filters.isOa === true || filters.is_oa === true) {
            filterParts.push("open_access.is_oa:true");
          }
          return `https://openalex.org/works?filter=${encodeURIComponent(filterParts.join(","))}`;
        }
        if (key === "elicit") {
          return `https://elicit.com/find-papers?query=${encodeURIComponent(query)}`;
        }
        return "#";
      },
      replaceSourcePlaceholder(text, source) {
        return String(text || "").split("{source}").join(source);
      },
      getSourceSearchLinkLabel(item) {
        return this.replaceSourcePlaceholder(
          this.getString("showSourceSearchLink"),
          this.sourceQueryLabel(item)
        );
      },
      getSourceSearchLinkHover(item) {
        return this.replaceSourcePlaceholder(
          this.getString("hoverShowSourceSearchLinkText"),
          this.sourceQueryLabel(item)
        );
      },
      sourceSearchLinkInfo(item) {
        const key = String(item?.key || "");
        if (key === "pubmed" || !this.hasSourceQueryValue(item)) return "";
        return this.replaceSourcePlaceholder(
          this.getString("sourceSearchLinkLimitsHint"),
          this.sourceQueryLabel(item)
        );
      },
      copySourceQuery(item) {
        const text = String(item?.value || "").trim();
        if (!text) return;
        const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : null;
        if (clipboard && typeof clipboard.writeText === "function") {
          clipboard.writeText(text);
          return;
        }
        const textarea = this.sourceQueryTextareaRefs?.[item?.key];
        if (textarea) {
          textarea.focus();
          textarea.select();
          textarea.setSelectionRange(0, 99999);
          document.execCommand("copy");
          return;
        }
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.setAttribute("readonly", "readonly");
        helper.style.position = "absolute";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
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
