<template>
  <div class="qpm_searchStringCollection">
    <p
      class="qpm_advancedSearch qpm_showHideAll"
      style="display: flex; justify-content: flex-end"
    >
      <a 
        tabindex="0"
        @keyup.enter="toggleAll()"
        @click="toggleAll()"
      >{{ isAllToggled ? getString("showAllSearchstrings") : getString("hideAllSearchstrings") }}</a>
    </p>
    <div class="qpm_searchStringStringsContainer rich-text">
      <div style="padding-top: 5px">
        <div class="qpm_headingContainerFocus_h2 qpm_gallery_toggle"
          @click="hideOrCollapse('qpm_subjectSearchStrings', $event)"
          @keyup.enter="hideOrCollapse('qpm_subjectSearchStrings', $event)"
          tabindex="0"
          data-target="qpm_subjectSearchStrings"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: !isLevelCollapsed(1) }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <h2 class="qpm_heading">
            {{ getString("subjects") }}
          </h2>
        </div>
      </div>
      <div
        v-for="subject in getSortedSubjects"
        :key="`subject-${subject.id}`"
        class="qpm_subjectSearchStrings"
      >
        <div class="qpm_headingContainerFocus_h3 qpm_gallery_toggle"
          @click="hideOrCollapse(toClassName(subject.id), $event)"
          @keyup.enter="hideOrCollapse(toClassName(subject.id), $event)"
          tabindex="0"
          :data-target="toClassName(subject.id)"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: !isLevelCollapsed(2) }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <h3 class="qpm_heading">
            {{ customNameLabel(subject) }} 
          </h3>
          <span class="qpm_groupid">(ID: {{ subject.id }})</span>
        </div>
        <div
          v-for="(group, index) in subject.groups"
          :key="`group-${group.id}-${index}`"
          :class="['qpm_searchGroup', toClassName(subject.id), ...getAncestorClasses(group)]"
          :data-level="getItemLevel(group)"
          :data-has-children="hasChildren(group) ? '1' : '0'"
          :style="group.subtopiclevel ? { paddingLeft: (group.subtopiclevel * 30) + 'px' } : {}"
        >
          <div
            :class="['qpm_headingContainerFocus', isClickable(group) ? 'qpm_gallery_toggle' : '']"
            @click="isClickable(group) && hideOrCollapse(getToggleTarget(group), $event)"
            @keyup.enter="isClickable(group) && hideOrCollapse(getToggleTarget(group), $event)"
            :tabindex="isClickable(group) ? 0 : -1"
            :data-target="getToggleTarget(group)"
          >
            <span
              :class="[
                'qpm_toggle_icon',
                { qpm_toggle_expanded: isGroupExpanded(group), qpm_toggle_placeholder: !hasChildren(group) },
              ]"
            >
              <span class="qpm_toggle_plus">+</span>
              <span class="qpm_toggle_minus">&minus;</span>
            </span>
            <component :is="getHeadingTag(group)" class="qpm_heading">
              {{ customNameLabel(group) }} 
            </component>
            <span class="qpm_groupid">(ID: {{ group.id }})</span>
          </div>
          <div
            v-if="!group.maintopic"
            class="qpm_searchGroup qpm_collapsedSection qpm_searchSubject"
            :class="toClassName(group.id)"
          >
            <table class="qpm_table">
              <tr>
                <th>{{ getString("scope") }}</th>
                <th>{{ getString("searchString") }}</th>
              </tr>
              <tr v-if="group.searchStrings && hasValidSearchString(group.searchStrings.narrow)">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNarrow'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor1"
                  >
                    {{ getString("narrow") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      target="_blank"
                      :href="getPubMedLink(group.searchStrings.narrow)"
                    >
                      {{ trimSearchString(group.searchStrings.narrow) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="group.searchStrings && hasValidSearchString(group.searchStrings.normal)">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNormal'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor2"
                  >
                    {{ getString("normal") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      target="_blank"
                      :href="getPubMedLink(group.searchStrings.normal)"
                    >
                      {{ trimSearchString(group.searchStrings.normal) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="group.searchStrings && hasValidSearchString(group.searchStrings.broad)">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipBroad'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor3"
                  >
                    {{ getString("broad") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      target="_blank"
                      :href="getPubMedLink(group.searchStrings.broad)"
                    >
                      {{ trimSearchString(group.searchStrings.broad) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="group && group.searchStringComment && blockHasComment(group)">
                <th colspan="2">
                  {{ getString("comment") }}
                </th>
              </tr>
              <tr v-if="group && group.searchStringComment && blockHasComment(group)">
                <td colspan="2" v-html="group.searchStringComment[language]">
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      <div class="qpm_heading_limits">
        <div class="qpm_headingContainerFocus_h2 qpm_gallery_toggle"
          @click="hideOrCollapse('qpm_filterSearchStrings', $event)"
          @keyup.enter="hideOrCollapse('qpm_filterSearchStrings', $event)"
          tabindex="0"
          data-target="qpm_filterSearchStrings"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: !isLevelCollapsed(1) }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <h2 class="qpm_heading">
            {{ getString("filters") }}
          </h2>
        </div>
      </div>
      <div
        v-for="filter in getSortedFilters"
        :key="filter.id"
        class="qpm_filterSearchStrings"
      >
        <div class="qpm_headingContainerFocus_h3 qpm_gallery_toggle"
          @click="hideOrCollapse(toClassName(filter.id), $event)"
          @keyup.enter="hideOrCollapse(toClassName(filter.id), $event)"
          tabindex="0"
          :data-target="toClassName(filter.id)"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: !isLevelCollapsed(2) }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <h3 class="qpm_heading">
            {{ customNameLabel(filter) }} 
          </h3>
          <span class="qpm_groupid">(ID: {{ filter.id }})</span>
        </div>
        <div
          v-for="choice in filter.choices"
          :key="choice.id"
          :class="['qpm_filterGroup', toClassName(filter.id), ...getAncestorClasses(choice)]"
          :data-level="getItemLevel(choice)"
          :data-has-children="hasChildren(choice) ? '1' : '0'"
          :style="choice.subtopiclevel ? { paddingLeft: (choice.subtopiclevel * 30) + 'px' } : {}"
        >
          <div
            :class="['qpm_headingContainerFocus', isClickable(choice) ? 'qpm_gallery_toggle' : '']"
            @click="isClickable(choice) && hideOrCollapse(getToggleTarget(choice), $event)"
            @keyup.enter="isClickable(choice) && hideOrCollapse(getToggleTarget(choice), $event)"
            :tabindex="isClickable(choice) ? 0 : -1"
            :data-target="getToggleTarget(choice)"
          >
            <span
              :class="[
                'qpm_toggle_icon',
                { qpm_toggle_expanded: isGroupExpanded(choice), qpm_toggle_placeholder: !hasChildren(choice) },
              ]"
            >
              <span class="qpm_toggle_plus">+</span>
              <span class="qpm_toggle_minus">&minus;</span>
            </span>
            <component :is="getHeadingTag(choice)" class="qpm_heading">
              {{ customNameLabel(choice) }} 
            </component>
            <span class="qpm_groupid">(ID: {{ choice.id }})</span>
          </div>
          <div
            v-if="!choice.maintopic"
            class="qpm_filterGroup qpm_collapsedSection qpm_searchFilter"
            :class="toClassName(choice.id)"
          >
            <table class="qpm_table">
              <tr>
                <th>{{ getString("scope") }}</th>
                <th>{{ getString("searchString") }}</th>
              </tr>
              <tr v-if="choice.searchStrings && hasValidSearchString(choice.searchStrings.narrow)">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNarrow'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor1"
                  >
                    {{ getString("narrow") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      target="_blank"
                      :href="getPubMedLink(choice.searchStrings.narrow)"
                    >
                      {{ trimSearchString(choice.searchStrings.narrow) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="choice.searchStrings && hasValidSearchString(choice.searchStrings.normal)">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipNormal'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor2"
                  >
                    {{ getString("normal") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      target="_blank"
                      :href="getPubMedLink(choice.searchStrings.normal)"
                    >
                      {{ trimSearchString(choice.searchStrings.normal) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="choice.searchStrings && hasValidSearchString(choice.searchStrings.broad)">
                <td>
                  <button
                    v-tooltip="{
                      content: getString('tooltipBroad'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor3"
                  >
                    {{ getString("broad") }}
                  </button>
                </td>
                <td lang="en">
                  <p class="qpm_table_p">
                    <a
                      v-tooltip="{
                        content: getString('showPubMedLink'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      target="_blank"
                      :href="getPubMedLink(choice.searchStrings.broad)"
                    >
                      {{ trimSearchString(choice.searchStrings.broad) }}
                    </a>
                  </p>
                </td>
              </tr>
              <tr v-if="choice && choice.searchStringComment && blockHasComment(choice)">
                <th colspan="2">
                  {{ getString("comment") }}
                </th>
              </tr>
              <tr v-if="choice && choice.searchStringComment && blockHasComment(choice)">
                <td colspan="2" v-html="choice.searchStringComment[language]">
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { messages } from "@/assets/content/qpm-translations.js";
  import { topicLoaderMixin, flattenTopicGroups } from "@/mixins/topicLoaderMixin.js";
  import { loadFiltersFromRuntime } from "@/utils/contentLoader";
  import { order } from "@/assets/content/qpm-content-order.js";

  export default {
    name: "SearchGallery",
    mixins: [appSettingsMixin, topicLoaderMixin],
    props: {
      hideTopics: {
        type: Array,
        default: function () {
          return [];
        },
      },
      language: {
        type: String,
        default: "en",
      },
      collapsedLevels: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        filters: [],
        subjects: [],
        orders: [],
        isAllToggled: true,
        resolvedCollapsedLevels: null,
        hasAppliedInitialCollapse: false,
      };
    },
    computed: {
      getSortedSubjects() {
        let shownSubjects = this.getShownData(this.subjects, "groups");
        return this.sortData(shownSubjects);
      },
      getSortedFilters() {
        let shownFilters = this.getShownData(this.filters, "choices");
        return this.sortData(shownFilters);
      },
    },
    watch: {
      topics: {
        handler(newTopics) {
          this.subjects = Array.isArray(newTopics) ? newTopics : [];
          if (!this.hasAppliedInitialCollapse && newTopics && newTopics.length > 0) {
            this.$nextTick(() => {
              this.applyInitialCollapsedLevels();
              this.hasAppliedInitialCollapse = true;
            });
          }
        },
        immediate: true,
      },
    },
    created() {
      this.orders = order;
      this.loadGalleryContent();

      const normalized = this.normalizeCollapsedLevels(this.collapsedLevels);
      if (normalized.length > 0) {
        this.resolvedCollapsedLevels = normalized;
      } else {
        const root = document.getElementById("search-gallery");
        this.resolvedCollapsedLevels = this.normalizeCollapsedLevels(
          root?.dataset?.collapsedLevels || []
        );
      }
    },
    mounted() {
      // Only apply here when data is already present (sync/local load).
      // For async/runtime load, the topics watcher applies collapse later.
      if (
        !this.hasAppliedInitialCollapse &&
        ((Array.isArray(this.topics) && this.topics.length > 0) ||
          (Array.isArray(this.filters) && this.filters.length > 0))
      ) {
        this.applyInitialCollapsedLevels();
        this.hasAppliedInitialCollapse = true;
      }
    },
    
    methods: {
      async loadGalleryContent() {
        this.subjects = Array.isArray(this.topics) ? this.topics : [];

        try {
          const runtimeFilters = await loadFiltersFromRuntime();
          this.filters = JSON.parse(JSON.stringify(runtimeFilters)).map((f) => ({
            ...f,
            choices: flattenTopicGroups(f.choices || []),
          }));
        } catch (error) {
          const fallback = await import("@/assets/content/qpm-content-filters.js");
          this.filters = JSON.parse(JSON.stringify(fallback.filtrer || [])).map((f) => ({
            ...f,
            choices: flattenTopicGroups(f.choices || []),
          }));
        }
      },
      blockHasComment(block) {
        let language = this.language || 'en';
        if (block.searchStringComment[this.language]) {
          return true;
        }
        return false;
      },
      normalizeCollapsedLevels(value) {
        if (!value) return [];
        if (Array.isArray(value)) {
          const normalized = value
            .map((item) => (typeof item === "string" ? parseInt(item, 10) : item))
            .filter((item) => !Number.isNaN(item));
          return normalized;
        }
        if (typeof value === "string") {
          const normalized = value
            .split(",")
            .map((item) => parseInt(item.trim(), 10))
            .filter((item) => !Number.isNaN(item));
          return normalized;
        }
        return [];
      },
      isLevelCollapsed(level) {
        // If no collapsedLevels specified, all levels are open by default
        const normalized = this.resolvedCollapsedLevels || this.normalizeCollapsedLevels(this.collapsedLevels);
        if (normalized.length === 0) return false;

        return normalized.includes(level);
      },
      getItemLevel(item) {
        const depth = item && item.subtopiclevel ? item.subtopiclevel : 0;
        return 3 + depth;
      },
      getAncestorClasses(item) {
        // Add CSS classes for each ancestor so maintopic clicks can target descendants
        const classes = [];
        if (item.parentChain && item.parentChain.length > 0) {
          item.parentChain.forEach((ancestorId) => {
            classes.push('qpm_child_of_' + this.toClassName(ancestorId));
          });
        } else if (item.maintopicIdLevel1) {
          classes.push('qpm_child_of_' + this.toClassName(item.maintopicIdLevel1));
          if (item.maintopicIdLevel2) {
            classes.push('qpm_child_of_' + this.toClassName(item.maintopicIdLevel2));
          }
        }
        return classes;
      },
      getToggleTarget(item) {
        // Maintopic items toggle their descendants; leaf items toggle their own content
        if (item.maintopic) {
          return 'qpm_child_of_' + this.toClassName(item.id);
        }
        return this.toClassName(item.id);
      },
      hasChildren(item) {
        // Only items with children (maintopic) get +/- icon
        return !!item.maintopic;
      },
      getHeadingTag(item) {
        // h2 = top sections (Emner/Afgrænsninger)
        // h3 = categories (Skabelonkategori, Diabetestype)
        // h4 = top-level items (subtopiclevel 0)
        // h5 = subtopiclevel 1
        // h6 = subtopiclevel 2+
        const depth = item && item.subtopiclevel ? item.subtopiclevel : 0;
        const level = Math.min(4 + depth, 6); // h4..h6, capped at h6
        return 'h' + level;
      },
      isClickable(item) {
        // Items with children OR search strings are clickable
        if (item.maintopic) return true;
        if (item.searchStrings) {
          return (
            this.hasValidSearchString(item.searchStrings.narrow) ||
            this.hasValidSearchString(item.searchStrings.normal) ||
            this.hasValidSearchString(item.searchStrings.broad)
          );
        }
        return false;
      },
      isGroupExpanded(item) {
        // Initial icon state for a parent: [-] if children visible, [+] if collapsed.
        // Children are hidden if ANY level from 1 up to own level is in collapsed list.
        if (!this.hasChildren(item)) return false;
        const levels = this.resolvedCollapsedLevels || [];
        if (levels.length === 0) return true;
        const itemLevel = this.getItemLevel(item);
        for (let l = 1; l <= itemLevel; l++) {
          if (levels.includes(l)) return false;
        }
        return true;
      },
      applyInitialCollapsedLevels() {
        const levels = this.resolvedCollapsedLevels || [];
        if (levels.length === 0) return;

        // Level 1: sections
        [
          ...document.getElementsByClassName("qpm_subjectSearchStrings"),
          ...document.getElementsByClassName("qpm_filterSearchStrings"),
        ].forEach((el) => {
          el.classList.toggle("qpm_collapsedSection", levels.includes(1));
        });

        // All items: start collapsed
        const allGroups = [
          ...document.getElementsByClassName("qpm_searchGroup"),
          ...document.getElementsByClassName("qpm_filterGroup"),
        ];
        allGroups.forEach((el) => el.classList.add("qpm_collapsedSection"));

        // If level 2 NOT in list: open all items, then enforce collapsed parents
        if (!levels.includes(2)) {
          allGroups.forEach((el) => el.classList.remove("qpm_collapsedSection"));
        }

        // Enforce collapsed parents at ALL levels (3, 4, 5, ...)
        // This works even when level 2 is collapsed: it sets correct state
        // so that when user opens categories, children are properly collapsed.
        this.enforceCollapsedParents();

        // Search string tables always start collapsed
        [
          ...document.getElementsByClassName("qpm_searchSubject"),
          ...document.getElementsByClassName("qpm_searchFilter"),
        ].forEach((el) => el.classList.add("qpm_collapsedSection"));

        this.syncToggleIconsFromDom();
      },
      enforceCollapsedParents(elements) {
        // For parents whose level is in collapsed list: collapse their children.
        // If `elements` is provided, only check those elements (after user click).
        // If not provided, check ALL groups (initial load).
        const levels = this.resolvedCollapsedLevels || [];
        if (levels.length === 0) return;

        const toCheck = elements || [
          ...document.getElementsByClassName("qpm_searchGroup"),
          ...document.getElementsByClassName("qpm_filterGroup"),
        ];

        for (const el of toCheck) {
          const hasChildren = el.getAttribute("data-has-children") === "1";
          if (!hasChildren) continue;

          const level = parseInt(el.getAttribute("data-level"), 10);
          if (Number.isNaN(level) || !levels.includes(level)) continue;

          const heading = el.querySelector("[data-target]");
          if (!heading) continue;
          const targetClass = heading.getAttribute("data-target");
          if (!targetClass) continue;

          const children = document.getElementsByClassName(targetClass);
          for (let i = 0; i < children.length; i++) {
            children[i].classList.add("qpm_collapsedSection");
          }
        }
      },
      syncToggleIconsFromDom() {
        const toggles = document.querySelectorAll("[data-target]");
        toggles.forEach((toggle) => {
          const targetClass = toggle.getAttribute("data-target");
          if (!targetClass) return;
          const targets = document.getElementsByClassName(targetClass);
          if (targets.length === 0) return;
          const isExpanded = Array.from(targets).some(
            (el) => !el.classList.contains("qpm_collapsedSection")
          );
          const icon = toggle.querySelector(".qpm_toggle_icon");
          if (icon) icon.classList.toggle("qpm_toggle_expanded", isExpanded);
        });
      },
      hideOrCollapse(className, event) {
        const elements = document.getElementsByClassName(className);
        if (elements.length === 0) return;

        // Determine action from first element: if collapsed → open all, else → close all
        const opening = elements[0].classList.contains("qpm_collapsedSection");

        // Snapshot the elements (live HTMLCollection changes during enforcement)
        const snapshot = Array.from(elements);

        for (let i = 0; i < snapshot.length; i++) {
          if (opening) {
            snapshot[i].classList.remove("qpm_collapsedSection");
          } else {
            snapshot[i].classList.add("qpm_collapsedSection");
          }
        }

        // After OPENING, enforce only on the just-opened elements.
        // This prevents re-collapsing siblings opened by earlier user clicks.
        if (opening) {
          this.enforceCollapsedParents(snapshot);
        }

        this.syncToggleIconsFromDom();
      },
      toggleAll() {
        const allSections = [
          ...document.getElementsByClassName("qpm_subjectSearchStrings"),
          ...document.getElementsByClassName("qpm_filterSearchStrings"),
        ];
        const allGroups = [
          ...document.getElementsByClassName("qpm_searchGroup"),
          ...document.getElementsByClassName("qpm_filterGroup"),
        ];
        const allTables = [
          ...document.getElementsByClassName("qpm_searchSubject"),
          ...document.getElementsByClassName("qpm_searchFilter"),
        ];

        if (this.isAllToggled) {
          // Open everything
          allSections.forEach((el) => el.classList.remove("qpm_collapsedSection"));
          allGroups.forEach((el) => el.classList.remove("qpm_collapsedSection"));
          allTables.forEach((el) => el.classList.remove("qpm_collapsedSection"));
          this.isAllToggled = false;
        } else {
          // Close everything
          allSections.forEach((el) => el.classList.add("qpm_collapsedSection"));
          allGroups.forEach((el) => el.classList.add("qpm_collapsedSection"));
          allTables.forEach((el) => el.classList.add("qpm_collapsedSection"));
          this.isAllToggled = true;
        }
        this.syncToggleIconsFromDom();
      },
      getPubMedLink(searchString) {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          "&term=" +
          encodeURIComponent(searchString)
        );
      },
      trimSearchString(searchString) {
        if (!searchString) return '';
        if (Array.isArray(searchString)) {
          if (searchString.length === 0) return '';
          const value = searchString[0];
          if (!value) return '';
          return value.toString();
        }
        return searchString.toString();
      },
      hasValidSearchString(searchString) {
        if (!searchString) return false;
        if (Array.isArray(searchString)) {
          if (searchString.length === 0) return false;
          return searchString[0] != null && searchString[0] !== '';
        }
        return searchString !== '';
      },
      getString(string) {
        let lg = this.language;
        if (!messages[string]) {
          console.warn(`Missing translation key: ${string}`);
          return string;
        }
        let constant = messages[string][lg];
        return constant != undefined ? constant : messages[string]["en"];
      },
      customNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return;
        let constant;
        if (option.translations) {
          let lg = this.language;
          constant =
            option.translations[lg] != undefined
              ? option.translations[lg]
              : option.translations["en"];
        } else {
          constant = option.name || option.id;
        }
        return constant;
      },
      isHiddenTopic(topicId) {
        return this.hideTopics.indexOf(topicId) != -1;
      },
      toClassName(name) {
        return String(name || "").replaceAll(" ", "-");
      },
      sortData(data) {
        let self = this;
        let lang = this.language;
        function sortByPriorityOrName(a, b) {
          if (a.ordering[lang] != null && b.ordering[lang] == null) {
            return -1; // a is ordered and b is not -> a first
          }
          if (b.ordering[lang] != null && a.ordering[lang] == null) {
            return 1; // b is ordered and a is not -> b first
          }

          let aSort, bSort;
          if (a.ordering[lang] != null) {
            // Both are ordered
            aSort = a.ordering[lang];
            bSort = b.ordering[lang];
          } else {
            // Both are unordered
            aSort = self.customNameLabel(a).toLowerCase();
            bSort = self.customNameLabel(b).toLowerCase();
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

        data.forEach((item) => {
          let groupName = null;
          if (item.groups != null) {
            groupName = "groups";
          } else if (item.choices != null) {
            groupName = "choices";
          } else {
            return;
          }

          item[groupName].sort(sortByPriorityOrName); // Sort categories in groups
        });
        data.sort(sortByPriorityOrName); // Sort groups
        return data;
      },
      getShownData(data, groupName) {
        let self = this;
        function isNotHidden(e) {
          return !self.isHiddenTopic(e.id);
        }

        let shown = data.filter(isNotHidden).map(function (e) {
          let copy = JSON.parse(JSON.stringify(e));
          copy[groupName] = copy[groupName].filter(isNotHidden);
          return copy;
        });

        return shown;
      },
      // Added by Ole
    },
  };
</script>
