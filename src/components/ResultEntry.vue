<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    ref="result"
    class="mugin_ResultEntry"
    :name="id"
    :data-reference-anchor="referenceAnchorId"
    :data-reference-pmid="hasValidPmid ? normalizedPmid : null"
    :data-reference-doi="normalizedDoi || null"
  >
    <loading-spinner :loading="loading" />
    <div v-if="getComponentWidth && (showDate || canShowSelectionCheckbox)" class="mugin_resultTopMeta">
      <input
        v-if="canShowSelectionCheckbox"
        :id="'mugin_selectArticleCheckbox_' + id"
        type="checkbox"
        class="mugin_selectArticleCheckbox"
        :name="'mugin_selectArticleCheckbox_' + id"
        :checked="isChecked"
        :value="value"
        :aria-label="selectArticleCheckboxAriaLabel"
        aria-describedby="mugin_selectArticleCheckboxDescription"
        @change="updateInput"
        @keyup.enter="changeOnEnter"
      />
      <p v-if="showDate" class="mugin_resultentryDate mugin_resultentryDateMobile">
        {{ date }}
      </p>
    </div>
    <p v-else-if="showDate" class="mugin_resultentryDate">
      {{ date }}
    </p>
    <div lang="en">
      <div class="mugin_resultChangeOrder">
        <div class="d-flex">
          <input
            v-if="canShowSelectionCheckbox && !getComponentWidth"
            :id="'mugin_selectArticleCheckbox_' + id"
            type="checkbox"
            class="mugin_selectArticleCheckbox"
            style="margin-left: -40px"
            :name="'mugin_selectArticleCheckbox_' + id"
            :checked="isChecked"
            :value="value"
            :aria-label="selectArticleCheckboxAriaLabel"
            aria-describedby="mugin_selectArticleCheckboxDescription"
            @change="updateInput"
            @keyup.enter="changeOnEnter"
          />
          <div class="mugin_resultTitleWrap">
            <h3
              class="mugin_resultTitle mugin_inlineDisplay"
              :class="{ mugin_resultTitleHover: !showArticleButtons && hasValidAbstract }"
              @click="handleResultTitleClick"
            >
              <template v-if="canShowSelectionCheckbox">
                <label :for="'mugin_selectArticleCheckbox_' + id" class="mugin_resultTitleLabel">
                  <template v-if="!showArticleButtons && hasValidAbstract">
                    <span v-if="getVernacularTitle && getVernacularTitle !== getTitle">
                      {{ getVernacularTitle }}<br />
                    </span>
                    {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
                  </template>
                  <template v-else>
                    {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
                  </template>
                </label>
              </template>
              <template v-else>
                <template v-if="!showArticleButtons && hasValidAbstract">
                  <span v-if="getVernacularTitle && getVernacularTitle !== getTitle">
                    {{ getVernacularTitle }}<br />
                  </span>
                  {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
                </template>
                <template v-else>
                  {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
                </template>
              </template>
            </h3>
            <p
              v-if="config.useAI && useTranslateTitle"
              class="mugin_translateTitleLink mugin_ai_hide mugin_inlineDisplay"
            >
              <button
                v-if="language !== 'en'"
                type="button"
                class="mugin_linkButton mugin_linkButtonAsAnchor"
                :aria-label="translateTitleToggleAriaLabel"
                @click="toggleTranslation"
              >
                {{
                  translationShowing
                    ? getString("hideTranslatedTitle")
                    : getString("showTranslatedTitle")
                }}
              </button>
            </p>
            <span
              v-if="showTypeBadge && typeBadgeLabel"
              class="mugin_pubTypeBadge"
              :class="`mugin_pubTypeBadge_${normalizedPubTypeTier}`"
            >
              {{ typeBadgeLabel }}
            </span>
          </div>
        </div>
        <ai-translation
          :showing-translation="translationShowing"
          :title="computedTitle"
          :language="language"
        />
        <div class="mugin_resultTextLineHeight">
          <p class="mugin_resultAuthors">
            <span v-if="calculateAuthors">{{ calculateAuthors }}.</span>
            <span v-if="!calculateAuthors"
              ><i>{{ getString("noAuthorsListed") }}</i></span
            >
            <br />
          </p>
        </div>
      </div>
      <div class="mugin_resultTextLineHeight">
        <p class="mugin_resultSource">
          <span v-if="source">{{ source }}</span>
          <span v-if="source && pubDate">. </span>
          <span v-if="pubDate">{{ pubDate }}</span>
          <span v-if="volume">;{{ volume }}</span>
          <span v-if="issue">({{ issue }})</span>
          <span v-if="pages">:{{ pages }}</span>
        </p>
      </div>
    </div>
    <!-- Case for small screen sizes -->
    <div v-if="getComponentWidth" class="mugin_mobileResultLayout">
      <div v-if="showArticleButtons" class="mugin_resultButtons_mobile" :style="mobileResult">
        <button
          v-if="hasSectionedAbstract || hasValidAbstract || pmid || doi"
          type="button"
          v-tooltip="{
            content: getString('hoverShowAbstractButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          :aria-expanded="String(showingAbstract)"
          :aria-controls="getAbstractId"
          class="mugin_button mugin_slim"
          :class="[
            !isAbstractLoaded ? 'mugin_abstract' : '',
            showingAbstract ? 'mugin_active' : '',
            hasValidAbstract ? 'mugin_abstract' : 'mugin_noAbstract',
          ]"
          @click="showAbstract"
        >
          {{ getButtonText }}
        </button>
        <button
          v-if="hasValidPmid"
          type="button"
          v-tooltip="{
            content: getString('hoverOpenInPubMedButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="mugin_button mugin_slim"
          @click="gotosite(getPubMedLink)"
        >
          {{ getString("openInPubMed") }}
        </button>
        <button
          v-if="getDoiLink"
          type="button"
          v-tooltip="{
            content: getString('hoverOpenDOIButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="mugin_button mugin_slim"
          @click="gotosite(getDoiLink)"
        >
          {{ getString("openDoi") }}
        </button>
      </div>
      <div v-if="id !== ''" class="mugin_badges_mobile rs_skip">
        <div v-if="usePubMed" class="mugin_badges_mobile_grid">
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed mugin_altmetrics"
            data-badge-type="1"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
            :data-pmid="pmid"
          />
          <span
            v-if="canShowDimensionsBadge"
            class="__dimensions_badge_embed__ mugin_dimensions"
            data-style="large_rectangle"
            data-hide-zero-citations="true"
            data-legend="never"
            :data-doi="dimensionsBadgeDoi"
            :data-pmid="dimensionsBadgePmid"
          />
        </div>
        <div v-else>
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed mugin_altmetrics"
            data-badge-type="1"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
          />
          <span
            v-if="canShowDimensionsBadge"
            class="__dimensions_badge_embed__ mugin_dimensions"
            data-style="large_rectangle"
            data-hide-zero-citations="true"
            data-legend="never"
            :data-doi="dimensionsBadgeDoi"
            :data-pmid="dimensionsBadgePmid"
          />
        </div>
      </div>
    </div>
    <!-- Default case for normal screen sizes -->
    <div v-else>
      <div v-if="showArticleButtons" class="mugin_resultButtons">
        <button
          v-if="hasSectionedAbstract || hasValidAbstract || pmid || doi"
          type="button"
          v-tooltip="{
            content: getString('hoverShowAbstractButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          :aria-expanded="String(showingAbstract)"
          :aria-controls="getAbstractId"
          class="mugin_button mugin_slim"
          :class="[
            !isAbstractLoaded ? 'mugin_abstract' : '',
            showingAbstract ? 'mugin_active' : '',
            hasValidAbstract ? 'mugin_abstract' : 'mugin_noAbstract',
          ]"
          @click="showAbstract"
        >
          {{ getButtonText }}
        </button>
        <button
          v-if="hasValidPmid"
          type="button"
          v-tooltip="{
            content: getString('hoverOpenInPubMedButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="mugin_button mugin_slim"
          @click="gotosite(getPubMedLink)"
        >
          {{ getString("openInPubMed") }}
        </button>
        <button
          v-if="getDoiLink"
          type="button"
          v-tooltip="{
            content: getString('hoverOpenDOIButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="mugin_button mugin_slim"
          @click="gotosite(getDoiLink)"
        >
          {{ getString("openDoi") }}
        </button>
      </div>
      <div v-if="id !== null" class="mugin_badges rs_skip">
        <div v-if="usePubMed">
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed mugin_altmetrics"
            data-badge-type="donut"
            data-badge-popover="left"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
            :data-pmid="pmid"
          />
          <span
            v-if="canShowDimensionsBadge"
            class="__dimensions_badge_embed__ mugin_dimensions"
            data-style="small_circle"
            data-hide-zero-citations="true"
            data-legend="hover-top"
            :data-doi="dimensionsBadgeDoi"
            :data-pmid="dimensionsBadgePmid"
          />
        </div>
        <div v-else>
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed mugin_altmetrics"
            data-badge-type="donut"
            data-badge-popover="left"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
          />
          <span
            v-if="canShowDimensionsBadge"
            class="__dimensions_badge_embed__ mugin_dimensions"
            data-style="small_circle"
            data-hide-zero-citations="true"
            data-legend="hover-top"
            :data-doi="dimensionsBadgeDoi"
            :data-pmid="dimensionsBadgePmid"
          />
        </div>
      </div>
    </div>
    <p v-if="getHyperLink" class="mugin_pubmedLink mugin_pubmedLinkArrow">
      <a target="_blank" rel="noopener noreferrer" :href="getHyperLink">
        {{ hyperLinkText !== undefined ? hyperLinkText : hyperLink }}
      </a>
    </p>
    <div
      :id="getAbstractId"
      class="mugin_abstract mugin_abstractContainer"
      :name="getAbstractDivName"
      :class="{ mugin_toggleAbstract: showingAbstract }"
    >
      <div>
        <div v-show="showingAbstract" lang="en" class="mugin_abstractShownContainer">
          <accordion-menu
            v-if="config.useAI && hasValidAbstract"
            class="mugin_ai_hide mugin_accordions"
          >
            <template #header="accordionProps">
              <div class="mugin_aiAccordionHeader mugin_resultAiHeader">
                <div class="mugin_resultAiHeaderLeft">
                  <div>
                    <i
                      class="ri-sparkling-fill"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="mugin_resultAiHeaderTitleWrap">
                    <strong>
                      <template v-if="getSelectedResultAccordionHeaderParts().prefix">
                        {{ getSelectedResultAccordionHeaderParts().prefix }}
                      </template>
                      <span class="mugin_keepWithIcon">
                        {{ getSelectedResultAccordionHeaderParts().last }}
                        <button
                          type="button"
                          v-tooltip="{
                            content: getString('hoverselectedResultAccordionHeader'),
                            distance: 5,
                            delay: $helpTextDelay,
                            theme: 'infoTooltip',
                          }"
                          class="bx bx-info-circle mugin_infoIcon"
                          :aria-label="getString('infoResultAccordionLabel')"
                        />
                      </span>
                    </strong>
                  </div>
                </div>
                <div>
                  <i
                    v-if="accordionProps.expanded"
                    class="bx bx-chevron-up mugin_aiAccordionHeaderArrows"
                    aria-hidden="true"
                  />
                  <i 
                    v-else 
                    class="bx bx-chevron-down mugin_aiAccordionHeaderArrows" 
                    aria-hidden="true"
                  />
                </div>
              </div>
            </template>

            <div class="mugin_ai_hide">
                <div
                  v-if="!hasAcceptedAi && hasValidAbstract"
                  class="mugin_searchSummaryText mugin_searchSummaryTextBackground"
                >
                  <p>{{ getString("aiSummarizeAbstractButton") }}</p>
                  <p>
                    <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                  </p>
                  <button
                    v-for="prompt in getsummarizeSingleAbstractPrompt()"
                    :key="prompt.name"
                    type="button"
                    v-tooltip="{
                      content: getString('hoverSummarizeSearchResultButton'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="mugin_button mugin_summaryButton"
                    @click="clickAcceptAi(prompt)"
                  >
                    <i
                      class="bx bx-detail"
                      aria-hidden="true"
                    />
                    {{ getTranslation(prompt) }}
                  </button>
                  <p class="mugin_summaryDisclaimer" v-html="sanitizeHtml(getString('aiSummaryConsentText'))" />
                </div>
                <summarize-abstract
                  v-else-if="hasAcceptedAi"
                  :license="license"
                  :is-license-allowed="getIsLicenseAllowed"
                  :is-resource-allowed="getIsResourceAllowed"
                  :is-pub-type-allowed="getIsPubTypeAllowed"
                  :is-doc-type-allowed="getIsDocTypeAllowed"
                  :show-summarize-article="true"
                  :pub-type="pubType"
                  :pdf-url="pdfUrl"
                  :html-url="htmlUrl"
                  :language="language"
                  :search-result-title="computedTitle"
                  :authors-list="author.trim()"
                  :publication-info="getFormattedPublication()"
                  :prompts="getsummarizeSingleAbstractPrompt()"
                  :summary-search-summary-consent-text="getString('aiSearchSummaryConsentHeader')"
                  :summary-consent-header="getString('aiAbstractSummaryConsentHeader')"
                  :success-header="getString('aiSummarizeAbstractResultHeader')"
                  :error-header="getString('aiSummarizeAbstractErrorHeader')"
                  :has-accepted-ai="hasAcceptedAi"
                  :initial-tab-prompt="initialAiTab"
                  :get-selected-articles="getArticleAsArray"
                  @close="closeSummaries"
                  @ai-summaries-click-retry="onAiSummariesClickRetry"
                />
            </div>
          </accordion-menu>
          <p
            v-if="
              !hasValidAbstract &&
              (isResourceAllowed === undefined ||
                isPubTypeAllowed === undefined ||
                isLicenseAllowed === undefined)
            "
            class="mugin_resultLoadingText"
          >
            {{ getString("loadingText") }}
          </p>

          <accordion-menu
            v-else-if="
              config.useAI &&
              !hasValidAbstract &&
              getIsPubTypeAllowed &&
              isLicenseAllowed &&
              isResourceAllowed
            "
            class="mugin_ai_hide mugin_accordions"
          >
            <template #header="accordionProps">
              <div class="mugin_aiAccordionHeader mugin_resultAiNoAbstractHeader">
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-down mugin_aiAccordionHeaderArrows"
                  aria-hidden="true"
                />
                <i v-else class="bx bx-chevron-right mugin_aiAccordionHeaderArrows" aria-hidden="true" />
                <i
                  class="ri-sparkling-fill"
                  aria-hidden="true"
                />
                <div class="mugin_infoInline">
                  <strong>
                    <template v-if="getSelectedResultNoAbstractHeaderParts().prefix">
                      {{ getSelectedResultNoAbstractHeaderParts().prefix }}
                    </template>
                    <span class="mugin_keepWithIcon">
                      {{ getSelectedResultNoAbstractHeaderParts().last }}
                      <button
                        type="button"
                        v-tooltip="{
                          content: getString('hoverselectedResultAccordionHeaderNoAbstract'),
                          distance: 5,
                          delay: $helpTextDelay,
                          theme: 'infoTooltip',
                        }"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultAccordionNoAbstractLabel')"
                      />
                    </span>
                  </strong>
                </div>
              </div>
            </template>
            <div>
              <div class="mugin_ai_hide">
                  <div
                    v-if="!hasAcceptedAi && !hasValidAbstract"
                    class="mugin_searchSummaryText mugin_searchSummaryTextBackground"
                  >
                    <p>{{ getString("aiSummarizeArticleButton") }}</p>
                    <p>
                      <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                    </p>
                    <button
                      v-for="prompt in getsummarizeSingleAbstractPrompt()"
                      :key="prompt.name"
                      type="button"
                      v-tooltip="{
                        content: getString('hoverSummarizeSearchResultButton'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      class="mugin_button mugin_summaryButton"
                      @click="clickAcceptAi(prompt)"
                    >
                      <i
                        class="bx bx-detail"
                        aria-hidden="true"
                      />
                      {{ getTranslation(prompt) }}
                    </button>
                    <p class="mugin_summaryDisclaimer" v-html="sanitizeHtml(getString('aiSummaryConsentText'))" />
                  </div>
                  <summarize-no-abstract
                    v-else-if="hasAcceptedAi"
                    :license="license"
                    :is-license-allowed="getIsLicenseAllowed"
                    :is-resource-allowed="getIsResourceAllowed"
                    :is-pub-type-allowed="getIsPubTypeAllowed"
                    :is-doc-type-allowed="getIsDocTypeAllowed"
                    :show-summarize-article="true"
                    :pub-type="pubType"
                    :pdf-url="pdfUrl"
                    :html-url="htmlUrl"
                    :language="language"
                    :search-result-title="computedTitle"
                    :authors-list="author"
                    :publication-info="getFormattedPublication()"
                    :prompts="getsummarizeSingleAbstractPrompt()"
                    :has-accepted-ai="hasAcceptedAi"
                    :initial-tab-prompt="initialAiTab"
                  />
                  <p class="mugin_summaryDisclaimer" v-html="sanitizeHtml(getString('aiSummaryConsentText'))" />
              </div>
            </div>
          </accordion-menu>

          <div class="mugin_unpaywall">
            <template v-if="doi">
              <p class="mugin_pubmedLink">
                <template v-if="!unpaywallResponseLoaded">
                  <loading-spinner
                    :loading="true"
                    :size="15"
                    class="mugin_unpaywallLoadingSpinner"
                  />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_loading'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="getUnpaywall"
                    >{{ getString("UnpaywallLoading") }}
                  </a>
                </template>

                <template v-else-if="getHasOaPdf">
                  <i class="bx bxs-file-pdf mugin_pdf-icon mugin_pdfIconRed" aria-hidden="true" />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_pdf'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="getOaPdf"
                    download
                    >{{ getString("UnpaywallWithPdf") }}
                  </a>
                </template>

                <template v-else-if="getHasOaHtml">
                  <i class="bx bxs-file-html mugin_pdf-icon mugin_pdfIconMuted" aria-hidden="true" />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_html'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="getOaHtml"
                    download
                    >{{ getString("UnpaywallWithHtml") }}
                  </a>
                </template>

                <template v-else>
                  <i class="bx bxs-file-pdf mugin_pdf-icon mugin_pdfIconMuted" aria-hidden="true" />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_noPdf'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="getUnpaywall"
                    >{{ getString("UnpaywallNoPdf") }}
                  </a>
                </template>
              </p>
            </template>
            <template v-if="!doi">
              <p class="mugin_noPubmedLink">{{ getString("NoUnpaywall") }}</p>
            </template>
          </div>

          <!-- abstract is in text prop -->
          <div v-if="abstract === ''" class="mugin_abstractWrapper">
            <template v-if="hasSectionedAbstract">
              <div v-html="sanitizeHtml(getSectionAbstract)"></div>
            </template>

            <!-- abstract is provided manually through sectionedAbstract prop-->
            <template v-if="hasValidAbstract && !hasSectionedAbstract">
              <div v-for="(abstractValue, name) in text" :key="name">
                <p v-if="name !== 'UNLABELLED' && name !== 'null'">
                  <strong>{{ name }}</strong>
                </p>
                <p v-else>
                  <strong>Abstract</strong>
                </p>
                <p>
                  {{ abstractValue }}
                </p>
              </div>
            </template>

            <!-- there is no abstract-->
            <template v-if="!hasValidAbstract || (!isDocTypeAllowed && !hasSectionedAbstract)">
              <p class="mugin_noAbstractPadding">
                {{ getString("noAbstract") }}
              </p>
            </template>
          </div>

          <!-- abstract is in abstract prop -->
          <div v-else class="mugin_abstractWrapper">
            <div>
              <p><strong>Abstract</strong></p>
            </div>
            <p>{{ abstract }}</p>
          </div>

        </div>

        <!-- links for related content below abstract -->
        <div
          v-if="(hasValidPmid || doi || hasValidOpenAlexId) && showingAbstract"
          class="mugin_relatedLinks"
        >
          <!-- Find related articles -->
          <p v-if="hasValidPmid" class="mugin_pubmedLink mugin_pubmedLinkArrow">
            <a
              v-if="hasValidPmid"
              v-tooltip="{
                content: getString('hoverrelatedPubmed'),
                distance: 5,
                delay: $helpTextDelay,
              }"
              target="_blank"
              rel="noopener noreferrer"
              :href="getPubmedRelated"
            >
              {{ getString("relatedPubmed") }}
            </a>
          </p>

          <!-- Find related systematic reviews -->
          <p v-if="hasValidPmid" class="mugin_pubmedLink mugin_pubmedLinkArrow">
            <a
              v-if="hasValidPmid"
              v-tooltip="{
                content: getString('hoverrelatedPubmedReviews'),
                distance: 5,
                delay: $helpTextDelay,
              }"
              target="_blank"
              rel="noopener noreferrer"
              :href="getPubmedRelatedReviews"
            >
              {{ getString("relatedPubmedReviews") }}
            </a>
          </p>

          <!-- Other people also viewed -->
          <p
            class="mugin_pubmedLink mugin_pubmedLinkArrow"
            v-if="hasValidPmid"
          >
            <a
              v-if="hasValidPmid"
              target="_blank"
              rel="noopener noreferrer"
              :href="getPubmedAlsoViewed"
              v-tooltip="{
                content: getString('hoveralsoviewedPubmed'),
                distance: 5,
                delay: $helpTextDelay,
              }"
              >{{ getString("alsoviewedPubmed") }}</a
            >
          </p>

          <!-- Search on Google Scholar -->
          <p v-if="(pmid || doi) !== undefined" class="mugin_pubmedLink mugin_pubmedLinkArrow">
            <a
              v-if="(pmid || doi) !== undefined"
              v-tooltip="{
                content: getString('hoverGoogleScholar'),
                distance: 5,
                delay: $helpTextDelay,
              }"
              target="_blank"
              rel="noopener noreferrer"
              :href="getGoogleScholar"
            >
              {{ getString("GoogleScholar") }}
            </a>
          </p>

          <!-- Open the OpenAlex work page (for openAlexId-only records) -->
          <p
            v-if="hasValidOpenAlexId && !hasValidPmid && !doi"
            class="mugin_pubmedLink mugin_pubmedLinkArrow"
          >
            <a
              v-tooltip="{
                content: getString('hoverOpenAlexWorkLink'),
                distance: 5,
                delay: $helpTextDelay,
              }"
              target="_blank"
              rel="noopener noreferrer"
              :href="getOpenAlexLink"
            >
              {{ getString("openAlexWorkLink") }}
            </a>
          </p>
        </div>

          <accordion-menu
            v-if="showResultDetailsAccordion && showingAbstract"
            class="mugin_accordions mugin_resultDetailsAccordion"
          >
            <template #header="accordionProps">
              <div class="mugin_aiAccordionHeader mugin_resultAiHeader">
                <div class="mugin_resultAiHeaderLeft">
                  <div>
                    <i class="bx bx-list-ul" aria-hidden="true" />
                  </div>
                  <div class="mugin_resultAiHeaderTitleWrap">
                    <strong>
                      <span class="mugin_keepWithIcon">
                        {{ getString("resultDetailsAccordionHeader") }}
                        <button
                          type="button"
                          v-tooltip="{
                            content: getString('hoverResultDetailsAccordionHeader'),
                            distance: 5,
                            delay: $helpTextDelay,
                            theme: 'infoTooltip',
                          }"
                          class="bx bx-info-circle mugin_infoIcon"
                          :aria-label="getString('infoResultDetailsAccordionLabel')"
                        />
                      </span>
                    </strong>
                  </div>
                </div>
                <div>
                  <i
                    v-if="accordionProps.expanded"
                    class="bx bx-chevron-up mugin_aiAccordionHeaderArrows"
                    aria-hidden="true"
                  />
                  <i
                    v-else
                    class="bx bx-chevron-down mugin_aiAccordionHeaderArrows"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </template>

            <div class="mugin_resultDetailsShell">
            <div class="mugin_resultDetailsPanel">
              <section
                v-if="resultDetailsMergedSources.length > 0 || resultDetailsOriginSource"
                class="mugin_resultDetailsSection"
              >
                <div class="mugin_resultDetailsTopicGroup">
                  <h4>
                    <span>{{ getString("resultDetailsSourcesHeading") }}</span>
                    <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpSourcesHeading'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                  </h4>
                  <ul
                    v-if="resultDetailsMergedSources.length > 0"
                    class="mugin_resultDetailsSourceList mugin_resetList"
                  >
                    <li
                      v-for="sourceKey in resultDetailsMergedSources"
                      :key="sourceKey"
                      class="mugin_resultDetailsSourceChip"
                      :class="{
                        mugin_resultDetailsSourceChipOrigin:
                          resultDetailsMergedSources.length > 1 &&
                          sourceKey === resultDetailsOriginSource,
                      }"
                    >
                      {{ formatResultDetailsSourceLabel(sourceKey) }}
                      <span
                        v-if="
                          resultDetailsMergedSources.length > 1 &&
                          sourceKey === resultDetailsOriginSource
                        "
                        class="mugin_resultDetailsOriginMark"
                      >
                        ({{ getString("resultDetailsOriginLabel") }})
                      </span>
                    </li>
                  </ul>
                  <p
                    v-else-if="resultDetailsOriginSource"
                    class="mugin_resultDetailsRow"
                  >
                    <span>{{ getString("resultDetailsOriginLabel") }}</span>
                    <strong>{{
                      formatResultDetailsSourceLabel(resultDetailsOriginSource)
                    }}</strong>
                  </p>
                </div>
              </section>

              <section class="mugin_resultDetailsSection">
                <h4>
                  <span>{{ getString("resultDetailsIdentityHeading") }}</span>
                  <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpIdentityHeading'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                </h4>
                <dl class="mugin_resultDetailsDl">
                  <template v-if="resultDetailsPageRank != null">
                    <dt>
                      <span>{{ getString("resultDetailsPageRank") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpPageRank'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ resultDetailsPageRank }}</dd>
                  </template>
                  <template v-if="hasValidPmid">
                    <dt>
                      <span>PMID</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpPmid'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      <span class="mugin_advancedSearch mugin_noFloat">
                        <a
                          class="mugin_linkButton mugin_linkButtonAsAnchor"
                          :href="getPubMedLink"
                          target="_blank"
                          rel="noopener noreferrer"
                          v-tooltip="{
                            content: getString('resultDetailsHoverOpenPubmed'),
                            distance: 5,
                            delay: $helpTextDelay,
                          }"
                          @click.stop
                        >{{ normalizedPmid }}</a>
                      </span>
                    </dd>
                  </template>
                  <template v-if="normalizedDoi">
                    <dt>
                      <span>DOI</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpDoi'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      <span class="mugin_advancedSearch mugin_noFloat">
                        <a
                          class="mugin_linkButton mugin_linkButtonAsAnchor"
                          :href="getDoiLink"
                          target="_blank"
                          rel="noopener noreferrer"
                          v-tooltip="{
                            content: getString('resultDetailsHoverOpenDoi'),
                            distance: 5,
                            delay: $helpTextDelay,
                          }"
                          @click.stop
                        >{{ normalizedDoi }}</a>
                      </span>
                    </dd>
                  </template>
                  <template v-if="resultDetailsResultKey">
                    <dt>
                      <span>{{ getString("resultDetailsResultKey") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpResultKey'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ resultDetailsResultKey }}</dd>
                  </template>
                  <template v-if="resultDetailsOpenAlexId">
                    <dt>
                      <span>OpenAlex</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpOpenAlex'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      <span class="mugin_advancedSearch mugin_noFloat">
                        <a
                          class="mugin_linkButton mugin_linkButtonAsAnchor"
                          :href="getOpenAlexLink"
                          target="_blank"
                          rel="noopener noreferrer"
                          v-tooltip="{
                            content: getString('resultDetailsHoverOpenOpenAlex'),
                            distance: 5,
                            delay: $helpTextDelay,
                          }"
                          @click.stop
                        >{{ resultDetailsOpenAlexId }}</a>
                      </span>
                    </dd>
                  </template>
                  <template v-if="resultDetailsTrustedPmid != null">
                    <dt>
                      <span>{{ getString("resultDetailsTrustedPmid") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpTrustedPmid'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      {{
                        resultDetailsTrustedPmid
                          ? getString("resultDetailsYes")
                          : getString("resultDetailsNo")
                      }}
                    </dd>
                  </template>
                  <template v-if="resultDetailsCanOpenInPubMed != null">
                    <dt>
                      <span>{{ getString("resultDetailsCanOpenInPubMed") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpCanOpenInPubMed'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      {{
                        resultDetailsCanOpenInPubMed
                          ? getString("resultDetailsYes")
                          : getString("resultDetailsNo")
                      }}
                    </dd>
                  </template>
                </dl>
              </section>

              <section class="mugin_resultDetailsSection">
                <h4>
                  <span>{{ getString("resultDetailsBiblioHeading") }}</span>
                  <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpBiblioHeading'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                </h4>
                <dl class="mugin_resultDetailsDl">
                  <template v-if="source || fulljournalnameFromValue">
                    <dt>
                      <span>{{ getString("resultDetailsJournal") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpJournal'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ fulljournalnameFromValue || source }}</dd>
                  </template>
                  <template v-if="pubDate || date">
                    <dt>
                      <span>{{ getString("resultDetailsDate") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpDate'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ pubDate || date }}</dd>
                  </template>
                  <template v-if="resultDetailsPublicationTypes.length > 0">
                    <dt>
                      <span>{{ getString("resultDetailsPubTypes") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpPubTypes'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ resultDetailsPublicationTypes.join(", ") }}</dd>
                  </template>
                  <template v-if="resultDetailsLanguage">
                    <dt>
                      <span>{{ getString("resultDetailsLanguage") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpLanguage'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ resultDetailsLanguage }}</dd>
                  </template>
                </dl>
              </section>

              <section
                v-if="resultDetailsTopicGroups.length > 0"
                class="mugin_resultDetailsSection"
              >
                <h4>
                  <span>{{ getString("resultDetailsTopicsHeading") }}</span>
                  <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpTopicsHeading'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                </h4>
                <div
                  v-for="group in resultDetailsTopicGroups"
                  :key="group.source"
                  class="mugin_resultDetailsTopicGroup"
                >
                  <h5>
                    <span>{{ group.label }}</span>
                    <span class="mugin_resultDetailsIcon">
                    <button
                      v-if="formatResultDetailsTopicSourceHelp(group.source)"
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(formatResultDetailsTopicSourceHelp(group.source))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                  </h5>
                  <ul class="mugin_resultDetailsSourceList mugin_resetList">
                    <li
                      v-for="topic in group.topics"
                      :key="`${group.source}:${topic}`"
                      class="mugin_resultDetailsSourceChip"
                    >
                      {{ topic }}
                    </li>
                  </ul>
                </div>
              </section>

              <section class="mugin_resultDetailsSection">
                <h4>
                  <span>{{ getString("resultDetailsSignalsHeading") }}</span>
                  <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpSignalsHeading'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                </h4>
                <dl class="mugin_resultDetailsDl">
                  <dt>
                      <span>{{ getString("resultDetailsHasAbstract") }}</span>
                      <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpHasAbstract'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                    </dt>
                  <dd>
                    {{
                      hasValidAbstract
                        ? getString("resultDetailsYes")
                        : getString("resultDetailsNo")
                    }}
                  </dd>
                  <template v-if="resultDetailsAbstractSource">
                    <dt>
                      <span>{{ getString("resultDetailsAbstractSource") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpAbstractSource'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      {{
                        formatResultDetailsSourceLabel(resultDetailsAbstractSource)
                      }}
                    </dd>
                  </template>
                  <template v-if="resultDetailsCitationCount != null">
                    <dt>
                      <span>{{ getString("resultDetailsCitationCount") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpCitationCount'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      {{ resultDetailsCitationCount
                      }}<template v-if="resultDetailsCitationCountSource">
                        ({{
                          formatResultDetailsSourceLabel(
                            resultDetailsCitationCountSource
                          )
                        }})</template
                      >
                    </dd>
                  </template>
                  <template v-if="resultDetailsIsOpenAccess != null">
                    <dt>
                      <span>{{ getString("resultDetailsOpenAccess") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpOpenAccess'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      {{
                        resultDetailsIsOpenAccess
                          ? getString("resultDetailsYes")
                          : getString("resultDetailsNo")
                      }}
                    </dd>
                  </template>
                  <template v-if="resultDetailsIsRetracted != null">
                    <dt>
                      <span>{{ getString("resultDetailsRetracted") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpRetracted'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      {{
                        resultDetailsIsRetracted
                          ? getString("resultDetailsYes")
                          : getString("resultDetailsNo")
                      }}
                    </dd>
                  </template>
                </dl>
              </section>

              <section
                v-if="resultDetailsRanking"
                class="mugin_resultDetailsSection"
              >
                <h4>
                  <span>{{ getString("resultDetailsRankingHeading") }}</span>
                  <span class="mugin_resultDetailsIcon">
                    <button
                      type="button"
                      v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpRankingHeading'))"
                      class="bx bx-info-circle mugin_infoIcon"
                      :aria-label="getString('infoResultDetailsFieldLabel')"
                    />
                  </span>
                </h4>
                <dl class="mugin_resultDetailsDl">
                  <template v-if="resultDetailsRanking.combinedScore != null">
                    <dt>
                      <span>{{ getString("resultDetailsCombinedScore") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpCombinedScore'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ formatResultDetailsNumber(resultDetailsRanking.combinedScore) }}</dd>
                  </template>
                  <template v-if="resultDetailsRanking.bestRank">
                    <dt>
                      <span>{{ getString("resultDetailsBestRank") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpBestRank'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ resultDetailsRanking.bestRank }}</dd>
                  </template>
                  <template v-if="resultDetailsRanking.sourceCount">
                    <dt>
                      <span>{{ getString("resultDetailsSourceCount") }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpSourceCount'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ resultDetailsRanking.sourceCount }}</dd>
                  </template>
                  <template
                    v-for="row in resultDetailsScoreBreakdownRows"
                    :key="row.key"
                  >
                    <dt>
                      <span>{{ row.label }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        v-if="row.help"
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(row.help)"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>{{ row.value }}</dd>
                  </template>
                  <template
                    v-for="row in resultDetailsSourceBreakdown"
                    :key="row.source"
                  >
                    <dt>
                      <span>{{ formatResultDetailsSourceLabel(row.source) }}</span>
                      <span class="mugin_resultDetailsIcon">
                      <button
                        type="button"
                        v-tooltip="resultDetailsInfoTooltip(getString('resultDetailsHelpSourceContribution'))"
                        class="bx bx-info-circle mugin_infoIcon"
                        :aria-label="getString('infoResultDetailsFieldLabel')"
                      />
                    </span>
                    </dt>
                    <dd>
                      <template v-if="row.rank">rank {{ row.rank }}</template>
                      <template v-if="row.weight != null">
                        <template v-if="row.rank"> · </template>w
                        {{ formatResultDetailsNumber(row.weight) }}
                      </template>
                      <template v-if="row.weightedRrf != null">
                        <template v-if="row.rank || row.weight != null">
                          ·
                        </template>
                        RRF {{ formatResultDetailsNumber(row.weightedRrf) }}
                      </template>
                      <template v-if="row.score != null">
                        <template
                          v-if="
                            row.rank ||
                            row.weight != null ||
                            row.weightedRrf != null
                          "
                        >
                          ·
                        </template>
                        {{ formatResultDetailsNumber(row.score) }}
                      </template>
                    </dd>
                  </template>
                </dl>
              </section>
            </div>
            </div>
          </accordion-menu>
      </div>
    </div>
  </div>
</template>

<script>
  import SummarizeAbstract from "@/components/SummarizeAbstract.vue";
  import SummarizeNoAbstract from "@/components/SummarizeNoAbstract.vue";
  import AiTranslation from "@/components/AiTranslation.vue";
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import axios from "axios";
  import { config } from "@/config/config.js";
  import { settings } from "@/config/settings.js";
  import { eventBus } from "@/mixins/appSettings";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { utilitiesMixin } from "@/mixins/utilities";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";
  import { summarizeSingleAbstractPrompt } from "@/assets/prompts/abstract";
  import { applyOpenAiTaskSettingsToList } from "@/utils/openAiTaskSettings.js";
  import {
    areComparableIdsEqual,
    formatPublicationInfo,
    getLocalizedTranslation,
    hasDefinedValue,
    isMobileViewport,
  } from "@/utils/componentHelpers";
  import { normalizeDoiValue, normalizeOpenAlexIdValue, normalizePmidValue } from "@/utils/resultAdapters";
  import { languageFormat } from "@/utils/contentHelpers";

  let _resultEntryUid = 0;

  export default {
    name: "ResultEntry",
    components: {
      LoadingSpinner,
      AccordionMenu,
      AiTranslation,
      SummarizeAbstract,
      SummarizeNoAbstract,
    },
    mixins: [appSettingsMixin, promptRuleLoaderMixin, utilitiesMixin],
    emits: ["change", "articleUpdated", "loadAbstract"],
    props: {
      abstract: {
        type: String,
        default: "",
      },
      text: {
        type: Object,
        default: () => {},
      },
      id: {
        type: String,
        default: "",
      },
      pmid: {
        type: String,
        default: "",
      },
      title: {
        type: String,
        default: "",
      },
      booktitle: {
        type: String,
        default: "",
      },
      vernaculartitle: {
        type: String,
        default: "",
      },
      date: {
        type: String,
        default: "",
      },
      source: {
        type: String,
        default: "",
      },
      author: {
        type: String,
        default: "",
      },
      pubDate: {
        type: String,
        default: "",
      },
      volume: {
        type: String,
        default: "",
      },
      issue: {
        type: String,
        default: "",
      },
      pages: {
        type: String,
        default: "",
      },
      hasAbstract: {
        type: Boolean,
        default: false,
      },
      doi: {
        type: String,
        default: "",
      },
      showButtons: {
        type: Boolean,
        default: true,
      },
      pubType: {
        default: () => [],
        type: Array,
        required: false,
      },
      docType: {
        type: String,
        default: "",
      },
      showDate: {
        type: Boolean,
        default: true,
      },
      singleArticle: Boolean,
      customAbstract: {
        type: String,
        default: "",
      },
      language: {
        type: String,
        default: "dk",
      },
      hyperLink: {
        type: String,
        default: "",
      },
      hyperLinkText: {
        type: String,
        default: "",
      },
      sectionedAbstract: {
        type: Object,
        default: () => {},
      },
      parentWidth: {
        type: Number,
        default: 0,
      },
      shownSixAuthors: Boolean,
      showAltmetricBadge: {
        type: Boolean,
        default: true,
      },
      showDimensionsBadge: {
        type: Boolean,
        default: true,
      },
      selectable: {
        type: Boolean,
        default: false,
      },
      modelValue: {
        type: [Array, Boolean],
        default: false,
      },
      value: {
        type: [Array, Boolean, Object],
        default: false,
      },
      preLoadAbstract: {
        type: Boolean,
        default: false,
      },
      isAbstractLoaded: {
        type: Boolean,
        default: false,
      },
      useTranslateTitle: {
        type: Boolean,
        default: true,
      },
      openAlexId: {
        type: String,
        default: "",
      },
      pubTypeClassification: {
        type: Object,
        default: () => null,
      },
    },
    data() {
      const startElement = document.getElementById("mugin_start");
      if (startElement !== null) {
        startElement.scrollIntoView({ behavior: "smooth" });
      }
      return {
        showingAbstract: false,
        abstractLoaded: false,
        loading: false,
        translationShowing: false,
        abstractId: "",
        mostOuterWidth: 0,
        shouldNotUpdate: false,
        unpaywallResponse: undefined,
        unpaywallResponseLoaded: this.doi === null || this.doi === undefined,
        hasAcceptedAi: false,
        initialAiTab: {},
        pdfQuestions: [],
        isLicenseAllowed: undefined,
        isResourceAllowed: undefined,
        isPubTypeAllowed: undefined,
        isDocTypeAllowed: undefined,
        pdfUrl: "",
        htmlUrl: "",
        defaultUrl: "",
        license: "",
        showExtendedPrompts: false, // Show extended prompts for summarizing the article
        altmetricBadgeObserver: null,
      };
    },
    computed: {
      config() {
        return config;
      },
      hasSectionedAbstract() {
        return this.sectionedAbstract && Object.keys(this.sectionedAbstract).length > 0;
      },
      hasValidAbstract() {
        return (
          this.hasAbstract && (this.abstract.trim() !== "" || Object.keys(this.text).length > 0)
        );
      },
      computedTitle() {
        return this.getTitle || this.getBookTitle || this.getVernacularTitle || "";
      },
      getIsDocTypeAllowed() {
        return this.isDocTypeAllowed;
      },
      getIsPubTypeAllowed() {
        return this.isPubTypeAllowed;
      },
      getPromptLanguageType() {
        return this.initialAiTab.name;
      },
      getIsLicenseAllowed() {
        return this.isLicenseAllowed;
      },
      getIsResourceAllowed() {
        return this.isResourceAllowed;
      },
      getButtonText() {
        if (!this.isAbstractLoaded) {
          return this.getString("showAbstract");
        }

        if (this.hasSectionedAbstract || this.hasValidAbstract) {
          return this.showingAbstract
            ? this.getString("hideAbstract")
            : this.getString("showAbstract");
        }

        return this.showingAbstract ? this.getString("hideInfo") : this.getString("showInfo");
      },
      getComponentWidth() {
        return isMobileViewport() || (this.parentWidth < 520 && this.parentWidth !== 0);
      },
      getMyncbiShare() {
        return this.appSettings?.nlm?.myncbishare || "";
      },
      normalizedPmid() {
        return (
          normalizePmidValue(this.pmid) ||
          normalizePmidValue(this.resultDetailsValue?.pmid)
        );
      },
      normalizedDoi() {
        return normalizeDoiValue(this.doi || "");
      },
      hasValidPmid() {
        return this.normalizedPmid !== "";
      },
      canShowDimensionsBadge() {
        return this.showDimensionsBadge && (this.normalizedDoi !== "" || this.hasValidPmid);
      },
      dimensionsBadgeDoi() {
        return this.normalizedDoi || null;
      },
      dimensionsBadgePmid() {
        return this.hasValidPmid ? this.normalizedPmid : null;
      },
      normalizedOpenAlexId() {
        return normalizeOpenAlexIdValue(this.openAlexId);
      },
      hasValidOpenAlexId() {
        return this.normalizedOpenAlexId !== "";
      },
      resultDetailsValue() {
        return this.value && typeof this.value === "object" ? this.value : null;
      },
      resultDetailsMergedSources() {
        const sources = this.resultDetailsValue?.mergedSources;
        return Array.isArray(sources)
          ? sources.map((value) => String(value || "").trim()).filter(Boolean)
          : [];
      },
      resultDetailsOriginSource() {
        return String(this.resultDetailsValue?.originSource || "").trim();
      },
      resultDetailsRanking() {
        const ranking = this.resultDetailsValue?.ranking;
        return ranking && typeof ranking === "object" ? ranking : null;
      },
      resultDetailsAbstractSource() {
        return String(this.resultDetailsValue?.abstractSource || "").trim();
      },
      resultDetailsCitationCount() {
        const count = this.resultDetailsValue?.citationCount;
        return Number.isFinite(count) ? count : null;
      },
      resultDetailsCitationCountSource() {
        return String(this.resultDetailsValue?.citationCountSource || "").trim();
      },
      resultDetailsIsOpenAccess() {
        const value = this.resultDetailsValue?.isOpenAccess;
        return typeof value === "boolean" ? value : null;
      },
      resultDetailsIsRetracted() {
        const value = this.resultDetailsValue?.isRetracted;
        return typeof value === "boolean" ? value : null;
      },
      resultDetailsPageRank() {
        const rank = this.resultDetailsValue?.rank;
        return Number.isFinite(rank) ? rank : null;
      },
      resultDetailsResultKey() {
        return String(this.resultDetailsValue?.resultKey || "").trim();
      },
      resultDetailsOpenAlexId() {
        return (
          normalizeOpenAlexIdValue(this.resultDetailsValue?.openAlexId) ||
          this.normalizedOpenAlexId
        );
      },
      resultDetailsTrustedPmid() {
        if (typeof this.resultDetailsValue?.trustedPmid === "boolean") {
          return this.resultDetailsValue.trustedPmid;
        }
        return null;
      },
      resultDetailsCanOpenInPubMed() {
        if (typeof this.resultDetailsValue?.canOpenInPubMed === "boolean") {
          return this.resultDetailsValue.canOpenInPubMed;
        }
        return this.hasValidPmid ? true : null;
      },
      fulljournalnameFromValue() {
        return String(this.resultDetailsValue?.fulljournalname || "").trim();
      },
      resultDetailsPublicationTypes() {
        const fromValue = this.resultDetailsValue?.pubtype || this.resultDetailsValue?.publicationTypes;
        if (Array.isArray(fromValue)) {
          return fromValue.map((value) => String(value || "").trim()).filter(Boolean);
        }
        if (Array.isArray(this.pubType)) {
          return this.pubType.map((value) => String(value || "").trim()).filter(Boolean);
        }
        const single = String(this.pubType || this.docType || "").trim();
        return single ? [single] : [];
      },
      resultDetailsLanguage() {
        return String(
          this.resultDetailsValue?.language || this.language || ""
        ).trim();
      },
      resultDetailsSourceBreakdown() {
        const rows = this.resultDetailsRanking?.sourceBreakdown;
        return Array.isArray(rows) ? rows.filter((row) => row && row.source) : [];
      },
      resultDetailsTopics() {
        const topics = this.resultDetailsValue?.topics;
        if (!Array.isArray(topics)) {
          return [];
        }
        return topics
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => ({
            label: String(entry.label || "").trim(),
            source: String(entry.source || "").trim(),
          }))
          .filter((entry) => entry.label && entry.source !== "openAlexConcept");
      },
      resultDetailsTopicGroups() {
        const order = [
          "mesh",
          "pubmedKeyword",
          "openAlex",
          "openAlexTopic",
          "openAlexSubfield",
          "openAlexKeyword",
          "semanticScholar",
        ];
        const openAlexSources = new Set([
          "openAlex",
          "openAlexTopic",
          "openAlexSubfield",
          "openAlexKeyword",
        ]);
        const groups = new Map();
        for (const topic of this.resultDetailsTopics) {
          const source = topic.source || "other";
          if (!groups.has(source)) {
            groups.set(source, []);
          }
          const labels = groups.get(source);
          if (!labels.includes(topic.label)) {
            labels.push(topic.label);
          }
        }
        const seenOpenAlex = new Set();
        const toGroup = (source, topics) => {
          let filtered = topics;
          if (openAlexSources.has(source)) {
            filtered = topics.filter((label) => {
              const key = String(label || "").trim().toLowerCase();
              if (!key || seenOpenAlex.has(key)) {
                return false;
              }
              seenOpenAlex.add(key);
              return true;
            });
            if (filtered.length === 0) {
              return null;
            }
          }
          return {
            source,
            label: this.formatResultDetailsTopicSourceLabel(source),
            topics: filtered,
          };
        };
        const known = order
          .filter((source) => groups.has(source))
          .map((source) => toGroup(source, groups.get(source)))
          .filter(Boolean);
        const extras = [...groups.keys()]
          .filter((source) => !order.includes(source))
          .map((source) => toGroup(source, groups.get(source)))
          .filter(Boolean);
        return [...known, ...extras];
      },
      resultDetailsScoreBreakdownRows() {
        const breakdown = this.resultDetailsRanking?.scoreBreakdown;
        if (!breakdown || typeof breakdown !== "object") {
          return [];
        }
        const labelKeys = {
          rrfScore: "resultDetailsScoreRrf",
          overlapBonus: "resultDetailsScoreOverlap",
          pmidBonus: "resultDetailsScorePmidBonus",
          scoreTieBreaker: "resultDetailsScoreTieBreaker",
          baseScore: "resultDetailsScoreBase",
          additiveQualityBonus: "resultDetailsScoreQualityBonus",
          recencyBonus: "resultDetailsScoreRecencyBonus",
          pubTypeBonus: "resultDetailsScorePubTypeBonus",
          pubTypeTierBonus: "resultDetailsScorePubTypeTierBonus",
          pubTypeTier: "resultDetailsScorePubTypeTier",
          pubTypeConfidence: "resultDetailsScorePubTypeConfidence",
          oaBonus: "resultDetailsScoreOaBonus",
          clinicalBonus: "resultDetailsScoreClinicalBonus",
          translationPotentialBonus: "resultDetailsScoreTranslationBonus",
          topicOverlapBonus: "resultDetailsScoreTopicOverlapBonus",
          citationImpactMultiplier: "resultDetailsScoreCitationImpactMultiplier",
          authorityMultiplier: "resultDetailsScoreAuthorityMultiplier",
          recencyMultiplier: "resultDetailsScoreRecencyMultiplier",
          retractionMultiplier: "resultDetailsScoreRetractionMultiplier",
          dataQualityMultiplier: "resultDetailsScoreDataQualityMultiplier",
          qualityMultiplier: "resultDetailsScoreQualityMultiplier",
        };
        return Object.keys(breakdown)
          .filter((key) => breakdown[key] != null && breakdown[key] !== "")
          .map((key) => {
            const raw = breakdown[key];
            const labelKey = labelKeys[key];
            const helpKey = labelKey
              ? labelKey.replace(/^resultDetails/, "resultDetailsHelp")
              : "";
            return {
              key,
              label: labelKey
                ? this.getString(labelKey)
                : this.formatResultDetailsCamelLabel(key),
              value:
                typeof raw === "number"
                  ? this.formatResultDetailsNumber(raw)
                  : String(raw),
              help: helpKey ? this.getString(helpKey) : "",
            };
          });
      },
      showResultDetailsAccordion() {
        if (!this.resultDetailsValue) {
          return false;
        }
        return (
          this.resultDetailsMergedSources.length > 0 ||
          this.resultDetailsRanking != null ||
          this.resultDetailsTopics.length > 0 ||
          !!this.resultDetailsOriginSource ||
          !!this.resultDetailsAbstractSource ||
          this.resultDetailsCitationCount != null
        );
      },
      getOpenAlexLink() {
        const id = this.resultDetailsOpenAlexId || this.normalizedOpenAlexId;
        return id ? `https://openalex.org/${id}` : "";
      },
      normalizedPubTypeTier() {
        const tier = this.pubTypeClassification && this.pubTypeClassification.tier;
        return typeof tier === "string" ? tier.trim() : "";
      },
      showTypeBadge() {
        const tier = this.normalizedPubTypeTier;
        if (!tier) return false;
        const hiddenTiers = new Set(["research_article", "other", "excluded"]);
        return !hiddenTiers.has(tier);
      },
      typeBadgeLabel() {
        const tier = this.normalizedPubTypeTier;
        const tierToKey = {
          guideline_verified: "typeBadgeGuideline",
          guideline_candidate: "typeBadgeGuidelineCandidate",
          systematic_review_or_meta: "typeBadgeSystematicReview",
          clinical_trial: "typeBadgeClinicalTrial",
          report_verified: "typeBadgeReport",
          book_chapter: "typeBadgeBookChapter",
          dissertation: "typeBadgeDissertation",
          preprint: "typeBadgePreprint",
          review: "typeBadgeReview",
        };
        const key = tierToKey[tier];
        return key ? this.getString(key) : "";
      },
      referenceAnchorId() {
        return this.hasValidPmid ? this.normalizedPmid : this.normalizedDoi || this.id;
      },
      canShowSelectionCheckbox() {
        return (
          this.selectable &&
          (this.hasValidAbstract || this.hasSectionedAbstract || this.hasValidPmid || this.doi !== "")
        );
      },
      getPubMedLink() {
        if (!this.hasValidPmid) return "";
        return (
          "https://pubmed.ncbi.nlm.nih.gov/" +
          this.normalizedPmid +
          "/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          ""
        );
      },
      getDoiLink() {
        return this.normalizedDoi ? "https://doi.org/" + this.normalizedDoi : "";
      },
      getPubmedRelated() {
        if (!this.hasValidPmid) return "";
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          "&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
          this.normalizedPmid
        );
      },
      getPubmedRelatedReviews() {
        if (!this.hasValidPmid) return "";
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          "&filter=pubt.systematicreview&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
          this.normalizedPmid
        );
      },
      getPubmedAlsoViewed() {
        if (!this.hasValidPmid) return "";
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          "&linkname=pubmed_pubmed_alsoviewed&sort=relevance&from_uid=" +
          this.normalizedPmid
        );
      },
      getUnpaywall() {
        return this.doi ? "https://unpaywall.org/" + this.doi : "";
      },
      /**
       * Check api response for the url for the pdf version of the article
       */
      getHasOaPdf() {
        if (!this.unpaywallResponse) return false;
        if (!this.unpaywallResponse["best_oa_location"]) return false;

        const url_for_pdf = this.unpaywallResponse["best_oa_location"]["url_for_pdf"];

        if (!url_for_pdf) {
          this.setPdfUrl(undefined);
          return false;
        }

        this.setPdfUrl(url_for_pdf);
        console.info("url_for_pdf:", this.pdfUrl);

        return true;
      },
      /**
       * Check api response for the url for the html version of the article
       */
      getHasOaHtml() {
        if (!this.unpaywallResponse) return false;
        if (!this.unpaywallResponse["best_oa_location"]) return false;

        const url_for_landing_page =
          this.unpaywallResponse["best_oa_location"]["url_for_landing_page"];

        if (!url_for_landing_page) {
          this.setHtmlUrl(undefined);
          return false;
        }

        this.setHtmlUrl(url_for_landing_page);
        console.info("url_for_landing_page", this.htmlUrl);
        return true;
      },

      getOaHtml() {
        return this.getHasOaHtml
          ? this.unpaywallResponse.best_oa_location.url_for_landing_page
          : "";
      },
      getOaPdf() {
        return this.getHasOaPdf ? this.unpaywallResponse.best_oa_location.url_for_pdf : "";
      },
      getGoogleScholar() {
        return this.hasValidPmid
          ? "https://scholar.google.com/scholar_lookup?pmid=" + this.normalizedPmid
          : "https://scholar.google.com/scholar_lookup?doi=" + this.doi;
      },
      getTitle() {
        return this.stripHtmlToText(this.title);
      },
      selectArticleCheckboxAriaLabel() {
        const prefix = this.getString("selectArticleCheckboxPrefix") || "Select:";
        return `${prefix} ${this.getTitle || this.getBookTitle}`;
      },
      translateTitleToggleAriaLabel() {
        const key = this.translationShowing ? "hideTranslatedTitle" : "showTranslatedTitle";
        return `${this.getString(key)}: ${this.getTitle || this.getBookTitle}`;
      },
      getBookTitle() {
        return this.stripHtmlToText(this.booktitle);
      },
      getVernacularTitle() {
        return this.vernaculartitle ? this.stripHtmlToText(this.vernaculartitle) : "";
      },
      calculateAuthors() {
        const authorArray = this.author.split(",");

        if (!this.shownSixAuthors || authorArray.length <= 6) return this.author;
        const firstSixAuthors = authorArray.slice(0, 6).map((author) => ` ${author}`).join(",");
        return `${firstSixAuthors}, et al`;
      },
      getScreenWidth() {
        const width =
          window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return width;
      },
      mobileResult() {
        return this.getDoiLink ? { "flex-direction": "row" } : "";
      },
      showArticleButtons() {
        return this.showButtons;
      },
      usePubMed() {
        return areComparableIdsEqual(this.id, this.pmid);
      },
      getAbstractId() {
        return this.getAbstractDivName + "_" + this._uid;
      },
      getHyperLink() {
        return this.getSafeExternalUrl(this.hyperLink);
      },
      getAbstractDivName() {
        return hasDefinedValue(this.id) ? `abstract_${this.id}` : "custom";
      },
      getSource() {
        const source = this.source || "";
        const pubDate = this.pubDate || "";
        const sourceDateSeperator = source && pubDate ? ". " : "";
        const volume = ";" + this.volume || "";
        const issue = "(" + this.issue + ")" || "";
        const pages = ":" + this.pages || "";
        return source + sourceDateSeperator + pubDate + volume + issue + pages;
      },
      getSectionAbstract() {
        if (!this.sectionedAbstract) return "";

        return Object.keys(this.sectionedAbstract)
          .map((key) => {
            const safeKey = this.escapeHtml(key);
            const safeValue = this.escapeHtml(this.sectionedAbstract[key]);
            return `<p><strong>${safeKey}</strong></p><p>${safeValue}</p>`;
          })
          .join("");
      },
      getAbstract() {
        if (this.abstract) {
          return this.abstract.trim();
        }

        const sections = [];
        for (const section in this.text) {
          const header =
            section !== "UNLABELLED" && section !== "null"
              ? section[0].toUpperCase() + section.slice(1).toLowerCase()
              : "Abstract";
          const body = this.text[section];
          sections.push(`${header}\n${body}`);
        }
        return sections.join("\n\n").trim();
      },
      getArticle() {
        return {
          id: this.id,
          referenceId: this.referenceAnchorId,
          title: this.getTitle,
          authors: this.calculateAuthors,
          source: this.getSource,
          pmid: this.pmid,
          doi: this.doi,
          pubdate: this.pubDate,
          abstract: this.getAbstract,
        };
      },
      isChecked() {
        if (Array.isArray(this.modelValue)) {
          return this.modelValue.some((entry) => {
            if (entry === this.value) return true;
            if (entry?.uid !== undefined && entry?.uid !== null) {
              return areComparableIdsEqual(entry.uid, this.id);
            }
            if (entry?.id !== undefined && entry?.id !== null) {
              return areComparableIdsEqual(entry.id, this.id);
            }
            return areComparableIdsEqual(entry, this.id);
          });
        }
        return this.modelValue;
      },
    },
    watch: {
      abstract() {
        this.$emit("articleUpdated", this.getArticle);
      },
      text() {
        this.$emit("articleUpdated", this.getArticle);
      },
      async unpaywallResponseLoaded(newVal) {
        if (newVal) {
          const isLicenseAllowed = this.checkLicense();
          if (isLicenseAllowed) {
            await this.checkRessource();
            this.checkPubType();
            return;
          }
          /* For cases where theres no abstract and unpaywall response is not loaded
           * We have to manually set the flags to false so the loading text is not shown infinitly
           * Loading.. is based on the flags being undefiend
           */
          this.isPubTypeAllowed = false;
          this.isResourceAllowed = false;
        }
      },
    },
    /**
     * Lifecycle hook that is called after the instance has been created.
     * Sets up event listeners and ensures that necessary third-party scripts
     * (Dimension and Altmetric) are loaded into the document.
     */
    created() {
      this._uid = ++_resultEntryUid;
      // Inject Dimension and Altmetric scripts if they are not already present
      this.ensureThirdPartyScripts();
    },
    mounted() {
      // This is to ensure all badges to be loaded properly
      // given there are multiple occurrences of <references/>

      if (hasDefinedValue(this.id)) {
        this.abstractId = `abstract${this.id}`;
      } else {
        this.abstractId = "custom";
      }
      this.checkPreload();
      // Skip NlmFetch when unified search already provided a plain-text abstract
      // for DOI-only rows. Keep fetch for valid PMIDs (structured sections/MeSH).
      const hasInlineAbstract =
        typeof this.abstract === "string" && this.abstract.trim() !== "";
      if (!(hasInlineAbstract && !this.hasValidPmid)) {
        this.$emit("loadAbstract", this.id);
      }

      eventBus.on("result-entry-show-abstract", this.onEventBusShowAbstractEvent);
      this.syncAltmetricBadgeAccessibility();
    },
    beforeUpdate() {
      this.checkPreload();
    },
    updated() {
      this.syncAltmetricBadgeAccessibility();
    },
    beforeUnmount() {
      eventBus.off("result-entry-show-abstract", this.onEventBusShowAbstractEvent);
      this.disconnectAltmetricBadgeObserver();
    },
    methods: {
      splitLastWord(text) {
        const normalized = String(text || "").trim();
        const lastSpace = normalized.lastIndexOf(" ");
        if (lastSpace < 0) {
          return { prefix: "", last: normalized };
        }
        return {
          prefix: normalized.slice(0, lastSpace) + " ",
          last: normalized.slice(lastSpace + 1),
        };
      },
      resultDetailsInfoTooltip(content) {
        return {
          content: String(content || "").trim(),
          distance: 5,
          delay: this.$helpTextDelay,
          theme: "infoTooltip",
        };
      },
      getSelectedResultAccordionHeaderParts() {
        return this.splitLastWord(this.getString("selectedResultAccordionHeader"));
      },
      getSelectedResultNoAbstractHeaderParts() {
        return this.splitLastWord(this.getString("selectedResultAccordionHeaderNoAbstract"));
      },
      stripHtmlToText(value) {
        const div = document.createElement("div");
        div.innerHTML = value || "";
        const text = div.textContent || div.innerText || "";
        return text.replace(/<\/?[^>]+(>|$)/g, "");
      },
      escapeHtml(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      },
      getSafeExternalUrl(value) {
        const candidate = String(value ?? "").trim();
        if (!candidate) return "";
        try {
          const parsed = new URL(candidate, window.location.origin);
          const protocol = String(parsed.protocol || "").toLowerCase();
          if (protocol !== "http:" && protocol !== "https:") {
            return "";
          }
          return parsed.toString();
        } catch (_) {
          return "";
        }
      },
      getFormattedPublication() {
        return formatPublicationInfo(this);
      },
      formatResultDetailsSourceLabel(source) {
        const key = String(source || "").trim().toLowerCase();
        const labels = {
          pubmed: "PubMed",
          openalex: "OpenAlex",
          semanticscholar: "Semantic Scholar",
          elicit: "Elicit",
        };
        return labels[key] || String(source || "").trim();
      },
      formatResultDetailsTopicSourceLabel(source) {
        const key = String(source || "").trim();
        const labelKeys = {
          mesh: "resultDetailsTopicSourceMesh",
          pubmedKeyword: "resultDetailsTopicSourcePubmedKeyword",
          openAlex: "resultDetailsTopicSourceOpenAlex",
          openAlexTopic: "resultDetailsTopicSourceOpenAlexTopic",
          openAlexSubfield: "resultDetailsTopicSourceOpenAlexSubfield",
          openAlexKeyword: "resultDetailsTopicSourceOpenAlexKeyword",
          semanticScholar: "resultDetailsTopicSourceSemanticScholar",
        };
        const labelKey = labelKeys[key];
        return labelKey ? this.getString(labelKey) : this.formatResultDetailsCamelLabel(key);
      },
      formatResultDetailsTopicSourceHelp(source) {
        const key = String(source || "").trim();
        const helpKeys = {
          mesh: "resultDetailsHelpTopicSourceMesh",
          pubmedKeyword: "resultDetailsHelpTopicSourcePubmedKeyword",
          openAlex: "resultDetailsHelpTopicSourceOpenAlex",
          openAlexTopic: "resultDetailsHelpTopicSourceOpenAlexTopic",
          openAlexSubfield: "resultDetailsHelpTopicSourceOpenAlexSubfield",
          openAlexKeyword: "resultDetailsHelpTopicSourceOpenAlexKeyword",
          semanticScholar: "resultDetailsHelpTopicSourceSemanticScholar",
        };
        const helpKey = helpKeys[key];
        return helpKey ? this.getString(helpKey) : "";
      },
      formatResultDetailsNumber(value) {
        if (!Number.isFinite(value)) {
          return String(value ?? "");
        }
        if (Number.isInteger(value)) {
          return String(value);
        }
        const locale = languageFormat[this.language] || languageFormat.dk;
        return Number(value).toLocaleString(locale, {
          useGrouping: false,
          maximumFractionDigits: 4,
          minimumFractionDigits: 0,
        });
      },
      formatResultDetailsCamelLabel(key) {
        const text = String(key || "").trim();
        if (!text) return "";
        return text
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replace(/^./, (char) => char.toUpperCase());
      },
      getAltmetricBadgeAccessibleLabel() {
        const base =
          this.getString("altmetricBadgeLinkLabel") || "View Altmetric attention for this record";
        const title = String(this.computedTitle || "").trim();
        return title ? `${base}: ${title}` : base;
      },
      applyAltmetricBadgeAccessibility() {
        if (!this.showAltmetricBadge || !this.$el) return;
        const ariaLabel = this.getAltmetricBadgeAccessibleLabel();
        this.$el.querySelectorAll(".mugin_altmetrics a").forEach((link) => {
          link.setAttribute("aria-label", ariaLabel);
          if (!link.getAttribute("title")) {
            link.setAttribute("title", ariaLabel);
          }
        });
      },
      disconnectAltmetricBadgeObserver() {
        if (this.altmetricBadgeObserver) {
          this.altmetricBadgeObserver.disconnect();
          this.altmetricBadgeObserver = null;
        }
      },
      syncAltmetricBadgeAccessibility() {
        this.applyAltmetricBadgeAccessibility();
        this.disconnectAltmetricBadgeObserver();
        if (!this.showAltmetricBadge || !this.$el || typeof MutationObserver === "undefined") {
          return;
        }

        const badgeNodes = this.$el.querySelectorAll(".mugin_altmetrics");
        if (badgeNodes.length === 0) return;

        this.altmetricBadgeObserver = new MutationObserver(() => {
          this.applyAltmetricBadgeAccessibility();
        });

        badgeNodes.forEach((badgeNode) => {
          this.altmetricBadgeObserver.observe(badgeNode, {
            childList: true,
            subtree: true,
          });
        });
      },

      /**
       * Ensures that the Dimension and Altmetric third-party scripts are loaded.
       * If the scripts are not present, they are dynamically injected into the document.
       */
      ensureThirdPartyScripts() {
        const scriptList = Array.from(document.getElementsByTagName("script"));

        const isDimensionLoaded = scriptList.some((script) => script.id === "dimension");
        const isAltmetricLoaded = scriptList.some((script) => script.id === "altmetric");

        // Inject Dimension script if not loaded
        if (!isDimensionLoaded) {
          this.injectScript({
            src: "https://badge.dimensions.ai/static/ai/badge.js",
            id: "dimension",
            attributes: {
              "data-cookieconsent": "statistics",
              async: true,
            },
            onError: () => {
              console.error("Failed to load Dimension script.");
            },
          });
        }

        // Inject Altmetric script if not loaded
        if (!isAltmetricLoaded) {
          this.injectScript({
            src: "https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js",
            id: "altmetric",
            type: "text/javascript",
            attributes: {
              "data-cookieconsent": "statistics",
            },
            onError: () => {
              console.error("Failed to load Altmetric script.");
            },
          });
        }

        // Update the 'data-cookieconsent' attribute if 'altmetric-embed-js' script exists
        const altmetricJsScript = document.getElementById("altmetric-embed-js");
        if (altmetricJsScript) {
          altmetricJsScript.setAttribute("data-cookieconsent", "statistics");
        }
      },

      /**
       * Dynamically injects a script into the document head.
       *
       * @param {Object} options - Configuration options for the script.
       * @param {string} options.src - The source URL of the script.
       * @param {string} [options.id] - The ID to assign to the script element.
       * @param {string} [options.type] - The type attribute of the script.
       * @param {Object} [options.attributes] - Additional attributes to set on the script.
       * @param {Function} [options.onError] - Callback function to handle load errors.
       */
      injectScript({ src, id, type = "text/javascript", attributes = {}, onError }) {
        const script = document.createElement("script");
        script.src = src;
        script.type = type;

        if (id) {
          script.id = id;
        }

        // Set additional attributes
        Object.entries(attributes).forEach(([key, value]) => {
          script.setAttribute(key, value);
        });

        // Attach error handler if provided
        if (onError && typeof onError === "function") {
          script.addEventListener("error", onError);
        }

        document.head.appendChild(script);
      },

      /**
       * Dynamically injects a stylesheet into the document head.
       *
       * @param {Object} options - Configuration options for the stylesheet.
       * @param {string} options.href - The href URL of the stylesheet.
       */
      injectStylesheet({ href }) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      },
      toggleTranslation() {
        this.translationShowing = !this.translationShowing;
      },
      toggleExtendedPrompts() {
        this.showExtendedPrompts = !this.showExtendedPrompts;
      },
      /**
       * Check if docType contains chapter and therefore it doesn't have an abstract
       */
      checkDocType() {
        if (this.docType === undefined) {
          console.error("DocType undefined, NLM call might have failed");
          return false;
        }
        // doctype is allowed if it contains citation
        this.isDocTypeAllowed = this.docType.includes("citation");
        console.info("docType: ", this.docType);
        console.info("isDocTypeAllowed: ", this.isDocTypeAllowed);
        return this.isDocTypeAllowed;
      },
      /**
       * Check if pubType contains editorial and therefore is not a full article
       */
      checkPubType() {
        if (this.pubType === undefined) {
          console.error("Pubtype undefined, NLM call might have failed");
          return false;
        }
        this.isPubTypeAllowed = !this.pubType.includes("Editorial");
        console.info("pubtype: ", this.pubType);
        console.info("isPubTypeAllowed: ", this.isPubTypeAllowed);
        return this.isPubTypeAllowed;
      },
      /**
       * Check if license from unpaywall is allowed for summarization
       * The array contains the licenses that are allowed - add or remove licenses if needed
       */
      checkLicense() {
        const license = this.unpaywallResponse?.best_oa_location?.license;
        this.isLicenseAllowed = [
          "cc-by",
          "cc-by-sa",
          "cc-by-nc",
          "cc-by-nc-sa",
          "cc0",
          "public-domain",
        ].includes(license);
        console.info("license: ", this.license);
        console.info("isLicenseAllowed: ", this.isLicenseAllowed);
        return this.isLicenseAllowed;
      },
      /**
       * Used to check if a pdf resource will allow the azure function to download the resource
       * Returns true if not forbidden, false if forbidden
       */
      async checkRessource() {
        const endpoint = "/api/CheckIfResourceIsForbidden.php";
        // Call Azure Function directly for resource check
        const openAiServiceUrl = `${this.appSettings.openAi.azureFunctionUrl}${endpoint}`;
        const options = {
          method: "POST",
          body: JSON.stringify({
            url: this.defaultUrl,
          }),
        };

        try {
          const pdfresponse = await fetch(openAiServiceUrl, options);
          const isAllowed = pdfresponse.status !== 403;
          this.isResourceAllowed = isAllowed;
          console.info("isResourceAllowed:", this.isResourceAllowed);
          return isAllowed;
        } catch (error) {
          console.error("Error checking resource:", error);
          // Default to false in case of error
          this.isResourceAllowed = false;
          return false;
        }
      },
      setPdfUrl(url) {
        this.pdfUrl = url;
      },
      setHtmlUrl(url) {
        this.htmlUrl = url;
      },
      setAbstract(id) {
        console.info(`my id is: ${id}`);
      },
      //This is needed because AI-summaries expects a function to get the article and it gets stuck in a loop if you pass the articles directly
      getArticleAsArray() {
        return [this.getArticle];
      },
      handleResultTitleClick() {
        if (!this.showArticleButtons && this.hasValidAbstract) {
          this.showAbstract();
        }
      },
      async showAbstract(ignoreToggle = false) {
        this.showingAbstract = ignoreToggle === true || !this.showingAbstract;
        this.checkDocType();
        if (!this.unpaywallResponseLoaded) {
          this.isLicenseAllowed = false;
          this.isResourceAllowed = false;
          this.isPubTypeAllowed = false;
        }
        //scroll up to header if closing
        if (!this.showingAbstract && this.abstractLoaded && this.id) {
          // Get the div containing the abstract and then select
          // the <specific-article> containing it.
          const abstractContainer = document.getElementById(this.getAbstractId);
          const parentElement = abstractContainer?.parentElement;
          if (parentElement) {
            parentElement.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
        } else {
          if (this.getAbstractId) {
            // Get the div containing the abstract and then select
            // the <specific-article> containing it.
            const abstractContainer = document.getElementById(this.getAbstractId);
            const parentElement = abstractContainer?.parentElement;
            if (parentElement) {
              parentElement.scrollIntoView({
                block: "start",
                behavior: "smooth",
              });
            }
          }
        }

        if (!this.unpaywallResponseLoaded) {
          await this.loadUnpaywallApiResponse();
        }
      },
      gotosite(url) {
        const safeUrl = this.getSafeExternalUrl(url);
        if (!safeUrl) return;
        const openedWindow = window.open(safeUrl, "_blank", "noopener,noreferrer");
        if (openedWindow) {
          openedWindow.opener = null;
        }
      },
      collapseSection(element) {
        // temporarily disable all css transitions
        element.style.height = "0px";

        // on the next frame (as soon as the previous style change has taken effect),
        // explicitly set the element's height to its current pixel height, so we
        // aren't transitioning out of 'auto'
        const onTransitionEnd = () => {
          // remove this event listener so it only gets triggered once
          element.removeEventListener("transitionend", onTransitionEnd);

          // remove "height" from the element's inline styles, so it can return to its initial value
          element.style.height = null;
        };
        element.addEventListener("transitionend", onTransitionEnd);

        // mark the section as "currently collapsed"
        element.setAttribute("data-collapsed", "true");
      },
      expandSection(element) {
        // get the height of the element's inner content, regardless of its actual size
        const sectionHeight = element.scrollHeight;

        // have the element transition to the height of its inner content
        element.style.height = sectionHeight + "px";

        // when the next css transition finishes (which should be the one we just triggered)
        const onTransitionEnd = () => {
          // remove this event listener so it only gets triggered once
          element.removeEventListener("transitionend", onTransitionEnd);

          // remove "height" from the element's inline styles, so it can return to its initial value
          element.style.height = null;
        };
        element.addEventListener("transitionend", onTransitionEnd);

        // mark the section as "currently not collapsed"
        element.setAttribute("data-collapsed", "false");
      },
      handleClickEvent() {
        const eventClass = this.abstractLoaded ? "mugin_shadow" : "mugin_abstractContainer";
        const section = document.querySelector(eventClass);
        if (!section) return;
        const isCollapsed = section.getAttribute("data-collapsed") === "true";

        if (isCollapsed) {
          this.expandSection(section);
          section.setAttribute("data-collapsed", "false");
        } else {
          this.collapseSection(section);
        }
      },
      getTranslation(value) {
        return getLocalizedTranslation(value, this.language);
      },
      customNameLabel(option) {
        if (!option?.translations && !option?.name && !option?.id) return;
        if (option.id) {
          return getLocalizedTranslation(option, this.language);
        }
        return option.name || option.id;
      },
      customGroupLabel(option) {
        return getLocalizedTranslation(option, this.language);
      },
      async loadUnpaywallApiResponse() {
        if (!this.doi) return undefined;

        const baseUrl = String(settings?.unpaywall?.baseUrl || "").replace(/\/+$/, "");
        const email = String(settings?.unpaywall?.email || "");
        if (!baseUrl || !email) {
          this.unpaywallResponseLoaded = true;
          return undefined;
        }
        const url = `${baseUrl}/${this.doi}?email=${encodeURIComponent(email)}`;
        const timeout = 15 * 1000; //15 second timeout
        await axios
          .get(url, { timeout })
          .then((resp) => {
            this.unpaywallResponse = resp.data;
            this.unpaywallResponseLoaded = true;
            if (resp.data?.best_oa_location?.url) {
              this.defaultUrl = resp.data.best_oa_location.url;
              this.pdfUrl = resp.data.best_oa_location.url_for_pdf;
              this.htmlUrl = resp.data.best_oa_location.url_for_landing_page;
              this.license = resp.data.best_oa_location.license;
            }
          })
          .catch((err) => {
            this.unpaywallResponseLoaded = true;
            console.debug(err);
          });
      },
      getsummarizeSingleAbstractPrompt() {
        return applyOpenAiTaskSettingsToList(
          summarizeSingleAbstractPrompt,
          "summarizeAbstract"
        );
      },
      updateInput(event) {
        const isChecked = event.target.checked;
        this.$emit("change", this.value, isChecked);
      },
      clickAcceptAi(prompt) {
        this.hasAcceptedAi = true;
        this.initialAiTab = prompt;
      },
      closeSummaries() {
        this.hasAcceptedAi = false;
      },
      checkPreload() {
        if (!this.abstractLoaded && this.preLoadAbstract && !this.loading) {
          this.loadAbstract(false);
        }
      },
      onEventBusShowAbstractEvent(args) {
        if (!args || args.$el !== this.$el) return;
        this.showAbstract(true);
      },
      onAiSummariesClickRetry() {
        if (this.$el && typeof this.$el.scrollIntoView === "function") {
          this.$el.scrollIntoView({ behavior: "smooth" });
        }
      },
      changeOnEnter(event) {
        const target = event?.target;
        if (target && typeof target.click === "function") {
          target.click();
        }
      },
    },
  };
</script>
