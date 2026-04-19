<template>
  <div class="qpm_searchStringCollection">
    <p class="qpm_advancedSearch qpm_showHideAll qpm_showHideAllRow">
      <button
        type="button"
        class="qpm_linkButton qpm_linkButtonAsAnchor"
        :aria-expanded="!isAllToggled"
        @click="toggleAll()"
      >{{
        isAllToggled ? getString("showAllSearchstrings") : getString("hideAllSearchstrings")
      }}</button>
    </p>
    <div v-show="!initialCollapsePending" class="qpm_searchStringStringsContainer rich-text">
      <div class="qpm_searchStringsTopPadding">
        <div
          class="qpm_headingContainerFocus_h2 qpm_gallery_toggle"
          role="button"
          tabindex="0"
          :aria-expanded="isTargetExpanded('qpm_subjectSearchStrings')"
          data-target="qpm_subjectSearchStrings"
          @click="hideOrCollapse('qpm_subjectSearchStrings')"
          @keydown.enter.prevent="hideOrCollapse('qpm_subjectSearchStrings')"
          @keydown.space.prevent="hideOrCollapse('qpm_subjectSearchStrings')"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: isTargetExpanded('qpm_subjectSearchStrings') }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <h2 class="qpm_heading">
            {{ getString("topics") }}
          </h2>
        </div>
      </div>
      <div v-if="hasStandardSearchStrings" class="qpm_subjectSearchStrings">
        <div
          class="qpm_headingContainerFocus_h3 qpm_gallery_toggle"
          role="button"
          tabindex="0"
          :aria-expanded="isTargetExpanded('qpm_standardSearchStrings')"
          data-target="qpm_standardSearchStrings"
          @click="hideOrCollapse('qpm_standardSearchStrings')"
          @keydown.enter.prevent="hideOrCollapse('qpm_standardSearchStrings')"
          @keydown.space.prevent="hideOrCollapse('qpm_standardSearchStrings')"
        >
          <span
            :class="[
              'qpm_toggle_icon',
              'qpm_toggle_placeholder',
              { qpm_toggle_expanded: isTargetExpanded('qpm_standardSearchStrings') },
            ]"
          >
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <div class="qpm_headingWithId">
            <h3 class="qpm_heading">
              {{ getString("standardSearchStrings") }}
            </h3>
          </div>
        </div>
        <div class="qpm_standardSearchStrings qpm_searchGroup qpm_searchSubject">
          <table class="qpm_table">
            <tr>
              <th>{{ getString("scope") }}</th>
              <th>{{ getString("searchString") }}</th>
            </tr>
            <tr v-if="hasValidSearchString(getStandaloneStandardScopeString('narrow'))">
              <td>
                <span
                  v-tooltip="{
                    content: getString('tooltipNarrow'),
                    distance: 5,
                    delay: $helpTextDelay,
                  }"
                  class="qpm_button qpm_buttonColor1"
                >
                  {{ getString("narrow") }}
                </span>
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
                    rel="noopener noreferrer"
                    :href="getPubMedLink(getStandaloneStandardScopeString('narrow'))"
                  >
                    {{ getStandaloneStandardScopeString("narrow") }}
                  </a>
                </p>
              </td>
            </tr>
            <tr v-if="hasValidSearchString(getStandaloneStandardScopeString('normal'))">
              <td>
                <span
                  v-tooltip="{
                    content: getString('tooltipNormal'),
                    distance: 5,
                    delay: $helpTextDelay,
                  }"
                  class="qpm_button qpm_buttonColor2"
                >
                  {{ getString("normal") }}
                </span>
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
                    rel="noopener noreferrer"
                    :href="getPubMedLink(getStandaloneStandardScopeString('normal'))"
                  >
                    {{ getStandaloneStandardScopeString("normal") }}
                  </a>
                </p>
              </td>
            </tr>
            <tr v-if="hasValidSearchString(getStandaloneStandardScopeString('broad'))">
              <td>
                <span
                  v-tooltip="{
                    content: getString('tooltipBroad'),
                    distance: 5,
                    delay: $helpTextDelay,
                  }"
                  class="qpm_button qpm_buttonColor3"
                >
                  {{ getString("broad") }}
                </span>
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
                    rel="noopener noreferrer"
                    :href="getPubMedLink(getStandaloneStandardScopeString('broad'))"
                  >
                    {{ getStandaloneStandardScopeString("broad") }}
                  </a>
                </p>
              </td>
            </tr>
            <tr v-if="standardBlockHasComment()">
              <th colspan="2">
                {{ getString("comment") }}
              </th>
            </tr>
            <tr v-if="standardBlockHasComment()">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <td colspan="2" v-html="getStandardSearchStringCommentHtml()"></td>
            </tr>
          </table>
        </div>
      </div>
      <div
        v-for="subject in getSortedTopics"
        :key="`subject-${subject.id}`"
        class="qpm_subjectSearchStrings"
      >
        <div
          class="qpm_headingContainerFocus_h3 qpm_gallery_toggle"
          role="button"
          tabindex="0"
          :aria-expanded="isTargetExpanded(toClassName(subject.id))"
          :data-target="toClassName(subject.id)"
          @click="hideOrCollapse(toClassName(subject.id))"
          @keydown.enter.prevent="hideOrCollapse(toClassName(subject.id))"
          @keydown.space.prevent="hideOrCollapse(toClassName(subject.id))"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: isTargetExpanded(toClassName(subject.id)) }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <div class="qpm_headingWithId">
            <h3 class="qpm_heading">
              {{ customNameLabel(subject) }}
            </h3>
            <span class="qpm_groupid">(ID: {{ subject.id }})</span>
          </div>
        </div>
        <div
          v-for="(group, index) in subject.groups"
          :key="`group-${group.id}-${index}`"
          :class="['qpm_searchGroup', toClassName(subject.id), ...getAncestorClasses(group)]"
          :data-level="getItemLevel(group)"
          :data-has-children="hasChildren(group) ? '1' : '0'"
          :style="
            group.subtopiclevel
              ? {
                  '--qpm-group-indent': group.subtopiclevel * 34 + 'px',
                  paddingLeft: group.subtopiclevel * 34 + 'px',
                }
              : {}
          "
        >
          <div
            :class="['qpm_headingContainerFocus', isClickable(group) ? 'qpm_gallery_toggle' : '']"
            :role="isClickable(group) ? 'button' : undefined"
            :tabindex="isClickable(group) ? 0 : -1"
            :aria-expanded="isClickable(group) ? isTargetExpanded(getToggleTarget(group)) : undefined"
            :data-target="getToggleTarget(group)"
            @click="isClickable(group) && hideOrCollapse(getToggleTarget(group))"
            @keydown.enter.prevent="isClickable(group) && hideOrCollapse(getToggleTarget(group))"
            @keydown.space.prevent="isClickable(group) && hideOrCollapse(getToggleTarget(group))"
          >
            <span
              :class="[
                'qpm_toggle_icon',
                {
                  qpm_toggle_expanded: isTargetExpanded(getToggleTarget(group)),
                  qpm_toggle_placeholder: !hasChildren(group),
                },
              ]"
            >
              <span class="qpm_toggle_plus">+</span>
              <span class="qpm_toggle_minus">&minus;</span>
            </span>
            <div class="qpm_headingWithId">
              <component :is="getHeadingTag(group)" class="qpm_heading">
                {{ customNameLabel(group) }}
              </component>
              <span class="qpm_groupid">(ID: {{ group.id }})</span>
            </div>
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
                  <span
                    v-tooltip="{
                      content: getString('tooltipNarrow'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor1"
                  >
                    {{ getString("narrow") }}
                  </span>
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
                      rel="noopener noreferrer"
                      :href="getPubMedLink(group.searchStrings.narrow)"
                    >
                      {{ trimSearchString(group.searchStrings.narrow) }}
                    </a>
                    <span v-if="hasStandardSuffix(group, 'narrow')" class="qpm_standardSuffix">
                      AND
                      {{ getString("standardSearchStringLabel") }} ({{
                        getStandardScopeLabelLowercase(group, "narrow")
                      }})
                      <button
                        type="button"
                        v-tooltip="{
                          content: getToggleStandardTooltip(group, 'narrow'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_linkButton qpm_standardSuffixLink"
                        :aria-expanded="isStandardExpanded(group, 'narrow')"
                        @click="toggleStandardExpanded(group, 'narrow')"
                      >
                        [{{ getToggleStandardActionLabel(group, "narrow") }}]
                      </button>
                    </span>
                    <span
                      v-if="
                        hasStandardSuffix(group, 'narrow') && isStandardExpanded(group, 'narrow')
                      "
                      class="qpm_standardSuffixValue"
                    >
                      <a
                        v-tooltip="{
                          content: getString('tooltipOpenCombinedStandardSearch'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="getStandardCombinedPubMedLink(group, 'narrow')"
                      >
                        {{ getStandardScopeString(group, "narrow") }}
                      </a>
                    </span>
                  </p>
                </td>
              </tr>
              <tr v-if="group.searchStrings && hasValidSearchString(group.searchStrings.normal)">
                <td>
                  <span
                    v-tooltip="{
                      content: getString('tooltipNormal'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor2"
                  >
                    {{ getString("normal") }}
                  </span>
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
                      rel="noopener noreferrer"
                      :href="getPubMedLink(group.searchStrings.normal)"
                    >
                      {{ trimSearchString(group.searchStrings.normal) }}
                    </a>
                    <span v-if="hasStandardSuffix(group, 'normal')" class="qpm_standardSuffix">
                      AND
                      {{ getString("standardSearchStringLabel") }} ({{
                        getStandardScopeLabelLowercase(group, "normal")
                      }})
                      <button
                        type="button"
                        v-tooltip="{
                          content: getToggleStandardTooltip(group, 'normal'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_linkButton qpm_standardSuffixLink"
                        :aria-expanded="isStandardExpanded(group, 'normal')"
                        @click="toggleStandardExpanded(group, 'normal')"
                      >
                        [{{ getToggleStandardActionLabel(group, "normal") }}]
                      </button>
                    </span>
                    <span
                      v-if="
                        hasStandardSuffix(group, 'normal') && isStandardExpanded(group, 'normal')
                      "
                      class="qpm_standardSuffixValue"
                    >
                      <a
                        v-tooltip="{
                          content: getString('tooltipOpenCombinedStandardSearch'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="getStandardCombinedPubMedLink(group, 'normal')"
                      >
                        {{ getStandardScopeString(group, "normal") }}
                      </a>
                    </span>
                  </p>
                </td>
              </tr>
              <tr v-if="group.searchStrings && hasValidSearchString(group.searchStrings.broad)">
                <td>
                  <span
                    v-tooltip="{
                      content: getString('tooltipBroad'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor3"
                  >
                    {{ getString("broad") }}
                  </span>
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
                      rel="noopener noreferrer"
                      :href="getPubMedLink(group.searchStrings.broad)"
                    >
                      {{ trimSearchString(group.searchStrings.broad) }}
                    </a>
                    <span v-if="hasStandardSuffix(group, 'broad')" class="qpm_standardSuffix">
                      AND
                      {{ getString("standardSearchStringLabel") }} ({{
                        getStandardScopeLabelLowercase(group, "broad")
                      }})
                      <button
                        type="button"
                        v-tooltip="{
                          content: getToggleStandardTooltip(group, 'broad'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_linkButton qpm_standardSuffixLink"
                        :aria-expanded="isStandardExpanded(group, 'broad')"
                        @click="toggleStandardExpanded(group, 'broad')"
                      >
                        [{{ getToggleStandardActionLabel(group, "broad") }}]
                      </button>
                    </span>
                    <span
                      v-if="hasStandardSuffix(group, 'broad') && isStandardExpanded(group, 'broad')"
                      class="qpm_standardSuffixValue"
                    >
                      <a
                        v-tooltip="{
                          content: getString('tooltipOpenCombinedStandardSearch'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="getStandardCombinedPubMedLink(group, 'broad')"
                      >
                        {{ getStandardScopeString(group, "broad") }}
                      </a>
                    </span>
                  </p>
                </td>
              </tr>
              <tr v-if="group && group.searchStringComment && blockHasComment(group)">
                <th colspan="2">
                  {{ getString("comment") }}
                </th>
              </tr>
              <tr v-if="group && group.searchStringComment && blockHasComment(group)">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <td colspan="2" v-html="getSearchStringCommentHtml(group)"></td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      <div class="qpm_heading_limits">
        <div
          class="qpm_headingContainerFocus_h2 qpm_gallery_toggle"
          role="button"
          tabindex="0"
          :aria-expanded="isTargetExpanded('qpm_filterSearchStrings')"
          data-target="qpm_filterSearchStrings"
          @click="hideOrCollapse('qpm_filterSearchStrings')"
          @keydown.enter.prevent="hideOrCollapse('qpm_filterSearchStrings')"
          @keydown.space.prevent="hideOrCollapse('qpm_filterSearchStrings')"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: isTargetExpanded('qpm_filterSearchStrings') }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <h2 class="qpm_heading">
            {{ getString("limits") }}
          </h2>
        </div>
      </div>
      <div v-for="filter in getSortedLimits" :key="filter.id" class="qpm_filterSearchStrings">
        <div
          class="qpm_headingContainerFocus_h3 qpm_gallery_toggle"
          role="button"
          tabindex="0"
          :aria-expanded="isTargetExpanded(toClassName(filter.id))"
          :data-target="toClassName(filter.id)"
          @click="hideOrCollapse(toClassName(filter.id))"
          @keydown.enter.prevent="hideOrCollapse(toClassName(filter.id))"
          @keydown.space.prevent="hideOrCollapse(toClassName(filter.id))"
        >
          <span :class="['qpm_toggle_icon', { qpm_toggle_expanded: isTargetExpanded(toClassName(filter.id)) }]">
            <span class="qpm_toggle_plus">+</span>
            <span class="qpm_toggle_minus">&minus;</span>
          </span>
          <div class="qpm_headingWithId">
            <h3 class="qpm_heading">
              {{ customNameLabel(filter) }}
            </h3>
            <span class="qpm_groupid">(ID: {{ filter.id }})</span>
          </div>
        </div>
        <div
          v-for="choice in filter.choices"
          :key="choice.id"
          :class="['qpm_filterGroup', toClassName(filter.id), ...getAncestorClasses(choice)]"
          :data-level="getItemLevel(choice)"
          :data-has-children="hasChildren(choice) ? '1' : '0'"
          :style="
            choice.subtopiclevel
              ? {
                  '--qpm-group-indent': choice.subtopiclevel * 34 + 'px',
                  paddingLeft: choice.subtopiclevel * 34 + 'px',
                }
              : {}
          "
        >
          <div
            :class="['qpm_headingContainerFocus', isClickable(choice) ? 'qpm_gallery_toggle' : '']"
            :role="isClickable(choice) ? 'button' : undefined"
            :tabindex="isClickable(choice) ? 0 : -1"
            :aria-expanded="isClickable(choice) ? isTargetExpanded(getToggleTarget(choice)) : undefined"
            :data-target="getToggleTarget(choice)"
            @click="isClickable(choice) && hideOrCollapse(getToggleTarget(choice))"
            @keydown.enter.prevent="isClickable(choice) && hideOrCollapse(getToggleTarget(choice))"
            @keydown.space.prevent="isClickable(choice) && hideOrCollapse(getToggleTarget(choice))"
          >
            <span
              :class="[
                'qpm_toggle_icon',
                {
                  qpm_toggle_expanded: isTargetExpanded(getToggleTarget(choice)),
                  qpm_toggle_placeholder: !hasChildren(choice),
                },
              ]"
            >
              <span class="qpm_toggle_plus">+</span>
              <span class="qpm_toggle_minus">&minus;</span>
            </span>
            <div class="qpm_headingWithId">
              <component :is="getHeadingTag(choice)" class="qpm_heading">
                {{ customNameLabel(choice) }}
              </component>
              <span class="qpm_groupid">(ID: {{ choice.id }})</span>
            </div>
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
                  <span
                    v-tooltip="{
                      content: getString('tooltipNarrow'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor1"
                  >
                    {{ getString("narrow") }}
                  </span>
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
                      rel="noopener noreferrer"
                      :href="getPubMedLink(choice.searchStrings.narrow)"
                    >
                      {{ trimSearchString(choice.searchStrings.narrow) }}
                    </a>
                    <span v-if="hasStandardSuffix(choice, 'narrow')" class="qpm_standardSuffix">
                      AND
                      {{ getString("standardSearchStringLabel") }} ({{
                        getStandardScopeLabelLowercase(choice, "narrow")
                      }})
                      <button
                        type="button"
                        v-tooltip="{
                          content: getToggleStandardTooltip(choice, 'narrow'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_linkButton qpm_standardSuffixLink"
                        :aria-expanded="isStandardExpanded(choice, 'narrow')"
                        @click="toggleStandardExpanded(choice, 'narrow')"
                      >
                        [{{ getToggleStandardActionLabel(choice, "narrow") }}]
                      </button>
                    </span>
                    <span
                      v-if="
                        hasStandardSuffix(choice, 'narrow') && isStandardExpanded(choice, 'narrow')
                      "
                      class="qpm_standardSuffixValue"
                    >
                      <a
                        v-tooltip="{
                          content: getString('tooltipOpenCombinedStandardSearch'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="getStandardCombinedPubMedLink(choice, 'narrow')"
                      >
                        {{ getStandardScopeString(choice, "narrow") }}
                      </a>
                    </span>
                  </p>
                </td>
              </tr>
              <tr v-if="choice.searchStrings && hasValidSearchString(choice.searchStrings.normal)">
                <td>
                  <span
                    v-tooltip="{
                      content: getString('tooltipNormal'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor2"
                  >
                    {{ getString("normal") }}
                  </span>
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
                      rel="noopener noreferrer"
                      :href="getPubMedLink(choice.searchStrings.normal)"
                    >
                      {{ trimSearchString(choice.searchStrings.normal) }}
                    </a>
                    <span v-if="hasStandardSuffix(choice, 'normal')" class="qpm_standardSuffix">
                      AND
                      {{ getString("standardSearchStringLabel") }} ({{
                        getStandardScopeLabelLowercase(choice, "normal")
                      }})
                      <button
                        type="button"
                        v-tooltip="{
                          content: getToggleStandardTooltip(choice, 'normal'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_linkButton qpm_standardSuffixLink"
                        :aria-expanded="isStandardExpanded(choice, 'normal')"
                        @click="toggleStandardExpanded(choice, 'normal')"
                      >
                        [{{ getToggleStandardActionLabel(choice, "normal") }}]
                      </button>
                    </span>
                    <span
                      v-if="
                        hasStandardSuffix(choice, 'normal') && isStandardExpanded(choice, 'normal')
                      "
                      class="qpm_standardSuffixValue"
                    >
                      <a
                        v-tooltip="{
                          content: getString('tooltipOpenCombinedStandardSearch'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="getStandardCombinedPubMedLink(choice, 'normal')"
                      >
                        {{ getStandardScopeString(choice, "normal") }}
                      </a>
                    </span>
                  </p>
                </td>
              </tr>
              <tr v-if="choice.searchStrings && hasValidSearchString(choice.searchStrings.broad)">
                <td>
                  <span
                    v-tooltip="{
                      content: getString('tooltipBroad'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_buttonColor3"
                  >
                    {{ getString("broad") }}
                  </span>
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
                      rel="noopener noreferrer"
                      :href="getPubMedLink(choice.searchStrings.broad)"
                    >
                      {{ trimSearchString(choice.searchStrings.broad) }}
                    </a>
                    <span v-if="hasStandardSuffix(choice, 'broad')" class="qpm_standardSuffix">
                      AND
                      {{ getString("standardSearchStringLabel") }} ({{
                        getStandardScopeLabelLowercase(choice, "broad")
                      }})
                      <button
                        type="button"
                        v-tooltip="{
                          content: getToggleStandardTooltip(choice, 'broad'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        class="qpm_linkButton qpm_standardSuffixLink"
                        :aria-expanded="isStandardExpanded(choice, 'broad')"
                        @click="toggleStandardExpanded(choice, 'broad')"
                      >
                        [{{ getToggleStandardActionLabel(choice, "broad") }}]
                      </button>
                    </span>
                    <span
                      v-if="
                        hasStandardSuffix(choice, 'broad') && isStandardExpanded(choice, 'broad')
                      "
                      class="qpm_standardSuffixValue"
                    >
                      <a
                        v-tooltip="{
                          content: getString('tooltipOpenCombinedStandardSearch'),
                          distance: 5,
                          delay: $helpTextDelay,
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                        :href="getStandardCombinedPubMedLink(choice, 'broad')"
                      >
                        {{ getStandardScopeString(choice, "broad") }}
                      </a>
                    </span>
                  </p>
                </td>
              </tr>
              <tr v-if="choice && choice.searchStringComment && blockHasComment(choice)">
                <th colspan="2">
                  {{ getString("comment") }}
                </th>
              </tr>
              <tr v-if="choice && choice.searchStringComment && blockHasComment(choice)">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <td colspan="2" v-html="getSearchStringCommentHtml(choice)"></td>
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
  import { messages } from "@/assets/content/translations.js";
  import { topicLoaderMixin, flattenTopicGroups } from "@/mixins/topicLoaderMixin.js";
  import {
    loadLimitsFromRuntime,
    loadStandardString,
    loadStandardStringComment,
  } from "@/utils/contentLoader";
  import { order } from "@/assets/content/order.js";
  import { cloneDeep, getLocalizedTranslation } from "@/utils/componentHelpers";

  export default {
    name: "SearchStrings",
    mixins: [appSettingsMixin, topicLoaderMixin],
    props: {
      hideTopics: {
        type: Array,
        default: () => [],
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
        limits: [],
        topics: [],
        orders: [],
        isAllToggled: true,
        toggleStateVersion: 0,
        resolvedCollapsedLevels: null,
        hasAppliedInitialCollapse: false,
        initialCollapsePending: false,
        standardStringToggleState: {},
      };
    },
    computed: {
      standardStringConfig() {
        // Recompute after topic runtime payload has been loaded/cached.
        void this.topicCatalog;
        return this.getStandardStringConfig();
      },
      standardStringCommentConfig() {
        // Recompute after topic runtime payload has been loaded/cached.
        void this.topicCatalog;
        if (!this.currentDomain) return null;
        return loadStandardStringComment(this.currentDomain);
      },
      hasStandardSearchStrings() {
        const standardString = this.standardStringConfig;
        if (!standardString) return false;
        return (
          this.hasValidSearchString(standardString.narrow) ||
          this.hasValidSearchString(standardString.normal) ||
          this.hasValidSearchString(standardString.broad)
        );
      },
      getSortedTopics() {
        const shownTopics = this.getShownData(this.topics, "groups");
        return this.sortData(shownTopics);
      },
      getSortedLimits() {
        const shownLimits = this.getShownData(this.limits, "choices");
        return this.sortData(shownLimits);
      },
    },
    watch: {
      topicCatalog: {
        handler(newTopics) {
          this.topics = Array.isArray(newTopics) ? [...newTopics] : [];
          this.tryApplyInitialCollapse();
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
        const root =
          document.getElementById("qpm-searchstrings") || document.getElementById("searchstrings");
        this.resolvedCollapsedLevels = this.normalizeCollapsedLevels(
          root?.dataset?.collapsedLevels || []
        );
      }
      this.initialCollapsePending = this.resolvedCollapsedLevels.length > 0;
    },
    mounted() {
      this.tryApplyInitialCollapse();
    },

    methods: {
      sanitizeCommentHtml(rawValue) {
        const rawHtml = typeof rawValue === "string" ? rawValue : "";
        if (!rawHtml) return "";

        const container = document.createElement("div");
        container.innerHTML = rawHtml;
        const allowedTags = new Set([
          "A",
          "B",
          "BR",
          "EM",
          "I",
          "LI",
          "OL",
          "P",
          "STRONG",
          "U",
          "UL",
        ]);
        const allowedSchemes = new Set(["http:", "https:", "mailto:"]);

        const sanitizeNode = (node) => {
          if (node.nodeType === Node.TEXT_NODE) return;

          if (node.nodeType !== Node.ELEMENT_NODE) {
            node.parentNode?.removeChild(node);
            return;
          }

          const tagName = node.tagName.toUpperCase();
          if (!allowedTags.has(tagName)) {
            const parent = node.parentNode;
            if (!parent) return;
            while (node.firstChild) {
              parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
            return;
          }

          const attributes = Array.from(node.attributes || []);
          attributes.forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            if (tagName === "A") {
              if (name === "href") {
                const hrefValue = String(attribute.value || "").trim();
                try {
                  const parsed = new URL(hrefValue, window.location.origin);
                  if (!allowedSchemes.has(parsed.protocol)) {
                    node.removeAttribute(attribute.name);
                  }
                } catch (_) {
                  node.removeAttribute(attribute.name);
                }
                return;
              }
              if (name === "title") return;
              if (name === "target") {
                node.setAttribute("target", "_blank");
                return;
              }
              if (name === "rel") return;
            }
            node.removeAttribute(attribute.name);
          });

          if (tagName === "A") {
            if (node.hasAttribute("href")) {
              node.setAttribute("target", "_blank");
              node.setAttribute("rel", "noopener noreferrer");
            } else {
              node.removeAttribute("target");
              node.removeAttribute("rel");
            }
          }

          Array.from(node.childNodes).forEach(sanitizeNode);
        };

        Array.from(container.childNodes).forEach(sanitizeNode);
        return container.innerHTML;
      },
      getSearchStringCommentHtml(block) {
        if (!block || !block.searchStringComment) return "";
        return this.sanitizeCommentHtml(block.searchStringComment[this.language]);
      },
      getStandardSearchStringCommentHtml() {
        const comments = this.standardStringCommentConfig;
        if (!comments) return "";
        return this.sanitizeCommentHtml(comments[this.language]);
      },
      standardBlockHasComment() {
        const comments = this.standardStringCommentConfig;
        if (!comments) return false;
        return Boolean(comments[this.language]);
      },
      getStandardStringConfig() {
        if (!this.currentDomain) return null;
        const standardString = loadStandardString(this.currentDomain);
        return standardString && typeof standardString === "object" ? standardString : null;
      },
      normalizeSearchStringValue(value) {
        if (!this.hasValidSearchString(value)) return "";
        return this.trimSearchString(value).trim();
      },
      resolveStandardScope(scope, standardString) {
        if (!standardString || typeof standardString !== "object") return "";
        if (["narrow", "normal", "broad"].includes(scope)) {
          const directValue = this.normalizeSearchStringValue(standardString[scope]);
          if (directValue) return scope;
        }
        if (this.normalizeSearchStringValue(standardString.normal)) return "normal";
        if (this.normalizeSearchStringValue(standardString.narrow)) return "narrow";
        if (this.normalizeSearchStringValue(standardString.broad)) return "broad";
        return "";
      },
      isStandardScopeEnabled(item, scope) {
        if (!item || typeof item !== "object") return false;
        const scopeSettings = item.combineWithStandardStringScopes;
        if (
          scopeSettings &&
          typeof scopeSettings === "object" &&
          Object.prototype.hasOwnProperty.call(scopeSettings, scope) &&
          typeof scopeSettings[scope] === "boolean"
        ) {
          return scopeSettings[scope] === true;
        }
        // Show only when explicitly enabled (scope-specific or legacy flag).
        return item.combineWithStandardString === true;
      },
      getStandardSuffixInfo(item, scope) {
        if (!this.isStandardScopeEnabled(item, scope)) return null;
        const standardString = this.getStandardStringConfig();
        if (!standardString) return null;
        const resolvedScope = this.resolveStandardScope(scope, standardString);
        if (!resolvedScope) return null;
        const standardValue = this.normalizeSearchStringValue(standardString[resolvedScope]);
        if (!standardValue) return null;
        return { resolvedScope, standardValue };
      },
      hasStandardSuffix(item, scope) {
        return this.getStandardSuffixInfo(item, scope) !== null;
      },
      getStandardScopeLabel(item, scope) {
        const info = this.getStandardSuffixInfo(item, scope);
        if (!info) return "";
        return this.getString(info.resolvedScope);
      },
      getStandardScopeLabelLowercase(item, scope) {
        return String(this.getStandardScopeLabel(item, scope) || "").toLowerCase();
      },
      getStandardScopeString(item, scope) {
        const info = this.getStandardSuffixInfo(item, scope);
        return info ? info.standardValue : "";
      },
      getStandaloneStandardScopeString(scope) {
        if (!["narrow", "normal", "broad"].includes(scope)) return "";
        return this.normalizeSearchStringValue(this.standardStringConfig?.[scope]);
      },
      getCombinedSearchStringWithStandard(item, scope) {
        if (!item || typeof item !== "object") return "";
        const specificSearchString = this.normalizeSearchStringValue(item?.searchStrings?.[scope]);
        const standardSearchString = this.getStandardScopeString(item, scope);
        if (!specificSearchString || !standardSearchString) return "";

        const normalizeForContainsCheck = (value) =>
          String(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
        const specificNorm = normalizeForContainsCheck(specificSearchString);
        const standardNorm = normalizeForContainsCheck(standardSearchString);
        if (standardNorm && specificNorm.includes(standardNorm)) {
          return specificSearchString;
        }
        return `(${specificSearchString}) AND (${standardSearchString})`;
      },
      getStandardCombinedPubMedLink(item, scope) {
        const combinedSearchString = this.getCombinedSearchStringWithStandard(item, scope);
        if (!combinedSearchString) return "#";
        return this.getPubMedLink(combinedSearchString);
      },
      getToggleStandardTooltip(item, scope) {
        return this.isStandardExpanded(item, scope)
          ? this.getString("tooltipHideStandardString")
          : this.getString("tooltipShowStandardString");
      },
      getToggleStandardActionLabel(item, scope) {
        return this.isStandardExpanded(item, scope)
          ? this.getString("hideShort")
          : this.getString("showShort");
      },
      getStandardToggleKey(item, scope) {
        const itemId = item?.id ? String(item.id) : "";
        return `${itemId}::${scope}`;
      },
      isStandardExpanded(item, scope) {
        const key = this.getStandardToggleKey(item, scope);
        return this.standardStringToggleState[key] === true;
      },
      toggleStandardExpanded(item, scope) {
        const key = this.getStandardToggleKey(item, scope);
        this.standardStringToggleState[key] = !this.standardStringToggleState[key];
      },
      async loadGalleryContent() {
        this.topics = Array.isArray(this.topicCatalog) ? [...this.topicCatalog] : [];

        try {
          const runtimeLimits = await loadLimitsFromRuntime(this.currentDomain);
          const safeRuntimeFilters = Array.isArray(runtimeLimits) ? runtimeLimits : [];
          this.limits = cloneDeep(safeRuntimeFilters).map((f) => ({
            ...f,
            choices: flattenTopicGroups(f.choices || []),
          }));
        } catch (error) {
          this.limits = [];
          console.error("Failed to load limits from runtime content API.", error);
        }
        this.$nextTick(() => {
          this.tryApplyInitialCollapse();
        });
      },
      tryApplyInitialCollapse() {
        if (!this.initialCollapsePending) return;
        if (this.hasAppliedInitialCollapse) {
          this.initialCollapsePending = false;
          return;
        }

        const hasTopics = Array.isArray(this.topicCatalog) && this.topicCatalog.length > 0;
        const hasLimits = Array.isArray(this.limits) && this.limits.length > 0;
        // Run initial collapse only when both datasets are ready,
        // otherwise one branch can render later in an uncollapsed state.
        if (!hasTopics || !hasLimits) return;

        this.$nextTick(() => {
          this.applyInitialCollapsedLevels();
          this.hasAppliedInitialCollapse = true;
          this.initialCollapsePending = false;
        });
      },
      blockHasComment(block) {
        if (!block || !block.searchStringComment) return false;
        return Boolean(block.searchStringComment[this.language]);
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
        const normalized =
          this.resolvedCollapsedLevels || this.normalizeCollapsedLevels(this.collapsedLevels);
        if (normalized.length === 0) return false;

        return normalized.includes(level);
      },
      getItemLevel(item) {
        const depth = item && item.subtopiclevel ? item.subtopiclevel : 0;
        return 3 + depth;
      },
      getAncestorClasses(item) {
        if (!item || typeof item !== "object") return [];
        // Add CSS classes for each ancestor so maintopic clicks can target descendants
        const classes = [];
        if (item.parentChain && item.parentChain.length > 0) {
          item.parentChain.forEach((ancestorId) => {
            classes.push("qpm_child_of_" + this.toClassName(ancestorId));
          });
        } else if (item.maintopicIdLevel1) {
          classes.push("qpm_child_of_" + this.toClassName(item.maintopicIdLevel1));
          if (item.maintopicIdLevel2) {
            classes.push("qpm_child_of_" + this.toClassName(item.maintopicIdLevel2));
          }
        }
        return classes;
      },
      getToggleTarget(item) {
        // Maintopic items toggle their descendants; leaf items toggle their own content
        if (item.maintopic) {
          return "qpm_child_of_" + this.toClassName(item.id);
        }
        return this.toClassName(item.id);
      },
      hasChildren(item) {
        // Only items with children (maintopic) get +/- icon
        return Boolean(item && item.maintopic);
      },
      getHeadingTag(item) {
        // h2 = top sections (topics/limits)
        // h3 = categories
        // h4 = top-level items (subtopiclevel 0)
        // h5 = subtopiclevel 1
        // h6 = subtopiclevel 2+
        const depth = item && item.subtopiclevel ? item.subtopiclevel : 0;
        const level = Math.min(4 + depth, 6); // h4..h6, capped at h6
        return "h" + level;
      },
      isClickable(item) {
        // Items with children OR search strings are clickable
        if (!item || typeof item !== "object") return false;
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
          ...document.getElementsByClassName("qpm_standardSearchStrings"),
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

        const toCheck = elements
          ? Array.from(elements)
          : [
              ...document.getElementsByClassName("qpm_searchGroup"),
              ...document.getElementsByClassName("qpm_filterGroup"),
            ];

        for (const el of toCheck) {
          if (!el || typeof el.getAttribute !== "function") continue;
          const hasChildren = el.getAttribute("data-has-children") === "1";
          if (!hasChildren) continue;

          const level = parseInt(el.getAttribute("data-level"), 10);
          if (Number.isNaN(level) || !levels.includes(level)) continue;

          const heading = el.querySelector("[data-target]");
          if (!heading) continue;
          const targetClass = heading.getAttribute("data-target");
          if (!targetClass) continue;

          const children = Array.from(document.getElementsByClassName(targetClass));
          for (const child of children) {
            child.classList.add("qpm_collapsedSection");
          }
        }
      },
      syncToggleIconsFromDom() {
        const toggles = document.querySelectorAll("[data-target]");
        toggles.forEach((toggle) => {
          if (!toggle || typeof toggle.getAttribute !== "function") return;
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
      hideOrCollapse(className) {
        if (!className) return;
        const elements = document.getElementsByClassName(className);
        if (elements.length === 0) return;

        // Determine action from first element: if collapsed → open all, else → close all
        const opening = elements[0].classList.contains("qpm_collapsedSection");

        // Snapshot the elements (live HTMLCollection changes during enforcement)
        const snapshot = Array.from(elements);

        for (const item of snapshot) {
          if (opening) {
            item.classList.remove("qpm_collapsedSection");
          } else {
            item.classList.add("qpm_collapsedSection");
          }
        }

        // After OPENING, enforce only on the just-opened elements.
        // This prevents re-collapsing siblings opened by earlier user clicks.
        if (opening) {
          this.enforceCollapsedParents(snapshot);
        }

        this.syncToggleIconsFromDom();
        this.touchToggleState();
      },
      setCollapsedState(elements, collapsed) {
        if (!Array.isArray(elements)) return;
        elements.forEach((el) => {
          if (!el || !el.classList) return;
          el.classList.toggle("qpm_collapsedSection", collapsed);
        });
      },
      isTargetExpanded(className) {
        void this.toggleStateVersion;
        if (!className || typeof document === "undefined") return false;
        return Array.from(document.getElementsByClassName(className)).some(
          (el) => !el.classList.contains("qpm_collapsedSection")
        );
      },
      touchToggleState() {
        this.toggleStateVersion += 1;
      },
      toggleAll() {
        const allSections = [
          ...document.getElementsByClassName("qpm_standardSearchStrings"),
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
          this.setCollapsedState(allSections, false);
          this.setCollapsedState(allGroups, false);
          this.setCollapsedState(allTables, false);
          this.isAllToggled = false;
        } else {
          // Close everything
          this.setCollapsedState(allSections, true);
          this.setCollapsedState(allGroups, true);
          this.setCollapsedState(allTables, true);
          this.isAllToggled = true;
        }
        this.syncToggleIconsFromDom();
        this.touchToggleState();
      },
      getPubMedLink(searchString) {
        const myncbiShare = this.appSettings?.nlm?.myncbishare || "";
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          myncbiShare +
          "&term=" +
          encodeURIComponent(searchString)
        );
      },
      trimSearchString(searchString) {
        if (!searchString) return "";
        if (Array.isArray(searchString)) {
          if (searchString.length === 0) return "";
          const value = searchString[0];
          if (!value) return "";
          return value.toString();
        }
        return searchString.toString();
      },
      hasValidSearchString(searchString) {
        if (!searchString) return false;
        if (Array.isArray(searchString)) {
          if (searchString.length === 0) return false;
          return (
            searchString[0] !== null && searchString[0] !== undefined && searchString[0] !== ""
          );
        }
        return searchString !== "";
      },
      getString(string) {
        const lg = this.language;
        if (!messages[string]) {
          console.warn(`Missing translation key: ${string}`);
          return string;
        }
        const constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["en"];
      },
      customNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return;
        if (option.translations) {
          return getLocalizedTranslation(option, this.language, "en");
        }
        return option.name || option.id;
      },
      isHiddenTopic(topicId) {
        if (!Array.isArray(this.hideTopics)) return false;
        return this.hideTopics.includes(topicId);
      },
      toClassName(name) {
        return String(name || "").replaceAll(" ", "-");
      },
      sortData(data) {
        if (!Array.isArray(data)) return [];
        const lang = this.language;
        const getSortValue = (item) => {
          const ordering = item?.ordering?.[lang] ?? null;
          if (ordering !== null) return ordering;
          return String(this.customNameLabel(item) || "").toLowerCase();
        };
        const sortByPriorityOrName = (a, b) => {
          const aOrdering = a?.ordering?.[lang] ?? null;
          const bOrdering = b?.ordering?.[lang] ?? null;

          if (aOrdering !== null && bOrdering === null) {
            return -1; // a is ordered and b is not -> a first
          }
          if (bOrdering !== null && aOrdering === null) {
            return 1; // b is ordered and a is not -> b first
          }

          const aSort = getSortValue(a);
          const bSort = getSortValue(b);

          if (aSort === bSort) {
            return 0;
          }
          if (aSort > bSort) {
            return 1;
          } else {
            return -1;
          }
        };

        data.forEach((item) => {
          const groupName =
            item.groups !== null && item.groups !== undefined
              ? "groups"
              : item.choices !== null && item.choices !== undefined
              ? "choices"
              : null;
          if (!groupName) {
            return;
          }

          if (Array.isArray(item[groupName])) {
            item[groupName].sort(sortByPriorityOrName); // Sort categories in groups
          }
        });
        data.sort(sortByPriorityOrName); // Sort groups
        return data;
      },
      getShownData(data, groupName) {
        if (!Array.isArray(data)) return [];
        if (!groupName) return [];
        const isNotHidden = (entry) => !this.isHiddenTopic(entry.id);

        const shown = data.filter(isNotHidden).map((entry) => {
          const copy = cloneDeep(entry);
          const nestedItems = Array.isArray(copy[groupName]) ? copy[groupName] : [];
          copy[groupName] = nestedItems.filter(isNotHidden);
          return copy;
        });

        return shown;
      },
    },
  };
</script>
