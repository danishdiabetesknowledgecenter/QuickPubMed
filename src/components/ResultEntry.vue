<!-- eslint-disable vue/no-v-html -->
<template>
  <div ref="result" class="qpm_ResultEntry" :name="id">
    <loading-spinner :loading="loading" />
    <div v-if="getComponentWidth && (showDate || (selectable && hasAbstract))" class="qpm_resultTopMeta">
      <input
        v-if="selectable && hasAbstract"
        :id="'qpm_selectArticleCheckbox_' + id"
        type="checkbox"
        class="qpm_selectArticleCheckbox"
        :name="'qpm_selectArticleCheckbox_' + id"
        :checked="isChecked"
        :value="value"
        :aria-label="'Select: ' + getTitle"
        @change="updateInput"
        @keyup.enter="changeOnEnter"
      />
      <p v-if="showDate" class="qpm_resultentryDate qpm_resultentryDateMobile">
        {{ date }}
      </p>
    </div>
    <p v-else-if="showDate" class="qpm_resultentryDate">
      {{ date }}
    </p>
    <div lang="en">
      <div class="qpm_resultChangeOrder">
        <div class="d-flex">
          <input
            v-if="selectable && hasAbstract && !getComponentWidth"
            :id="'qpm_selectArticleCheckbox_' + id"
            type="checkbox"
            class="qpm_selectArticleCheckbox"
            style="margin-left: -40px"
            :name="'qpm_selectArticleCheckbox_' + id"
            :checked="isChecked"
            :value="value"
            :aria-label="'Select: ' + getTitle"
            @change="updateInput"
            @keyup.enter="changeOnEnter"
          />
          <div class="qpm_resultTitleWrap">
            <label :for="selectable && hasAbstract ? 'qpm_selectArticleCheckbox_' + id : null">
              <p
                v-if="showArticleButtons || !hasAbstract"
                class="qpm_resultTitle qpm_inlineDisplay"
              >
                {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
              </p>
              <p
                v-if="!showArticleButtons && hasAbstract"
                class="qpm_resultTitle qpm_resultTitleHover qpm_inlineDisplay"
                @click="showAbstract"
              >
                <span v-if="getVernacularTitle && getVernacularTitle !== getTitle">
                  {{ getVernacularTitle }}<br />
                </span>
                {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
              </p>
            </label>
            <p
              v-if="config.useAI && useTranslateTitle"
              class="qpm_translateTitleLink qpm_ai_hide qpm_inlineDisplay"
            >
              <a v-if="language !== 'en'" href="#" @click.prevent="toggleTranslation"
                >{{
                  translationShowing
                    ? getString("hideTranslatedTitle")
                    : getString("showTranslatedTitle")
                }}
              </a>
            </p>
          </div>
        </div>
        <ai-translation :showing-translation="translationShowing" :title="computedTitle" />
        <div class="qpm_resultTextLineHeight">
          <p class="qpm_resultAuthors">
            <span v-if="calculateAuthors">{{ calculateAuthors }}.</span>
            <span v-if="!calculateAuthors"
              ><i>{{ getString("noAuthorsListed") }}</i></span
            >
            <br />
          </p>
        </div>
      </div>
      <div class="qpm_resultTextLineHeight">
        <p class="qpm_resultSource">
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
    <div v-if="getComponentWidth" class="qpm_mobileResultLayout">
      <div v-if="showArticleButtons" class="qpm_resultButtons_mobile" :style="mobileResult">
        <button
          v-if="hasSectionedAbstract || hasValidAbstract || pmid || doi"
          v-tooltip="{
            content: getString('hoverShowAbstractButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="qpm_button qpm_slim"
          :class="[
            !isAbstractLoaded ? 'qpm_abstract' : '',
            showingAbstract ? 'qpm_active' : '',
            hasValidAbstract ? 'qpm_abstract' : 'qpm_noAbstract',
          ]"
          @click="showAbstract"
        >
          {{ getButtonText }}
        </button>
        <button
          v-if="pmid !== null"
          v-tooltip="{
            content: getString('hoverOpenInPubMedButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="qpm_button qpm_slim"
          @click="gotosite(getPubMedLink)"
        >
          {{ getString("openInPubMed") }}
        </button>
        <button
          v-if="getDoiLink"
          v-tooltip="{
            content: getString('hoverOpenDOIButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="qpm_button qpm_slim"
          @click="gotosite(getDoiLink)"
        >
          {{ getString("openDoi") }}
        </button>
      </div>
      <div v-if="id !== ''" class="qpm_badges_mobile rs_skip">
        <div v-if="usePubMed" class="qpm_badges_mobile_grid">
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed qpm_altmetrics"
            data-badge-type="1"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
            :data-pmid="pmid"
          />
          <span
            v-if="showDimensionsBadge"
            class="__dimensions_badge_embed__ qpm_dimensions"
            data-style="large_rectangle"
            data-hide-zero-citations="true"
            data-legend="never"
            :data-doi="doi"
            :data-pmid="pmid"
          />
        </div>
        <div v-else>
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed qpm_altmetrics"
            data-badge-type="1"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
          />
          <span
            v-if="showDimensionsBadge"
            class="__dimensions_badge_embed__ qpm_dimensions"
            data-style="large_rectangle"
            data-hide-zero-citations="true"
            data-legend="never"
            :data-doi="doi"
          />
        </div>
      </div>
    </div>
    <!-- Default case for normal screen sizes -->
    <div v-else>
      <div v-if="showArticleButtons" class="qpm_resultButtons">
        <button
          v-if="hasSectionedAbstract || hasValidAbstract || pmid || doi"
          v-tooltip="{
            content: getString('hoverShowAbstractButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="qpm_button qpm_slim"
          :class="[
            !isAbstractLoaded ? 'qpm_abstract' : '',
            showingAbstract ? 'qpm_active' : '',
            hasValidAbstract ? 'qpm_abstract' : 'qpm_noAbstract',
          ]"
          @click="showAbstract"
        >
          {{ getButtonText }}
        </button>
        <button
          v-if="pmid !== null"
          v-tooltip="{
            content: getString('hoverOpenInPubMedButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="qpm_button qpm_slim"
          @click="gotosite(getPubMedLink)"
        >
          {{ getString("openInPubMed") }}
        </button>
        <button
          v-if="getDoiLink"
          v-tooltip="{
            content: getString('hoverOpenDOIButton'),
            distance: 5,
            delay: $helpTextDelay,
          }"
          class="qpm_button qpm_slim"
          @click="gotosite(getDoiLink)"
        >
          {{ getString("openDoi") }}
        </button>
      </div>
      <div v-if="id !== null" class="qpm_badges rs_skip">
        <div v-if="usePubMed">
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed qpm_altmetrics"
            data-badge-type="donut"
            data-badge-popover="left"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
            :data-pmid="pmid"
          />
          <span
            v-if="showDimensionsBadge"
            class="__dimensions_badge_embed__ qpm_dimensions"
            data-style="small_circle"
            data-hide-zero-citations="true"
            data-legend="hover-top"
            :data-doi="doi"
            :data-pmid="pmid"
          />
        </div>
        <div v-else>
          <span
            v-if="showAltmetricBadge"
            class="altmetric-embed qpm_altmetrics"
            data-badge-type="donut"
            data-badge-popover="left"
            data-hide-no-mentions="true"
            data-link-target="_blank"
            :data-doi="doi"
          />
          <span
            v-if="showDimensionsBadge"
            class="__dimensions_badge_embed__ qpm_dimensions"
            data-style="small_circle"
            data-hide-zero-citations="true"
            data-legend="hover-top"
            :data-doi="doi"
          />
        </div>
      </div>
    </div>
    <p v-if="getHyperLink" class="intext-arrow-link onHoverJS qpm_pubmedLink">
      <a target="_blank" rel="noopener noreferrer" :href="getHyperLink">
        {{ hyperLinkText !== undefined ? hyperLinkText : hyperLink }}
      </a>
    </p>
    <div
      :id="getAbstractId"
      class="qpm_abstract qpm_abstractContainer"
      :name="getAbstractDivName"
      :class="{ qpm_toggleAbstract: showingAbstract }"
    >
      <div>
        <div v-show="showingAbstract" lang="en" class="qpm_abstractShownContainer">
          <accordion-menu
            v-if="config.useAI && hasValidAbstract"
            class="qpm_ai_hide qpm_accordions"
          >
            <template #header="accordionProps">
              <div class="qpm_aiAccordionHeader qpm_resultAiHeader">
                <div class="qpm_resultAiHeaderLeft">
                  <div>
                    <i
                      class="ri-sparkling-fill"
                    />
                  </div>
                  <div class="qpm_resultAiHeaderTitleWrap">
                    <strong>
                      <template v-if="getSelectedResultAccordionHeaderParts().prefix">
                        {{ getSelectedResultAccordionHeaderParts().prefix }}
                      </template>
                      <span class="qpm_keepWithIcon">
                        {{ getSelectedResultAccordionHeaderParts().last }}
                        <button
                          v-tooltip="{
                            content: getString('hoverselectedResultAccordionHeader'),
                            distance: 5,
                            delay: $helpTextDelay,
                            theme: 'infoTooltip',
                          }"
                          class="bx bx-info-circle qpm_infoIcon"
                          aria-label="Info"
                        />
                      </span>
                    </strong>
                  </div>
                </div>
                <div>
                  <i
                    v-if="accordionProps.expanded"
                    class="bx bx-chevron-up qpm_aiAccordionHeaderArrows"
                  />
                  <i 
                    v-else 
                    class="bx bx-chevron-down qpm_aiAccordionHeaderArrows" 
                  />
                </div>
              </div>
            </template>

            <div class="qpm_ai_hide">
                <div
                  v-if="!hasAcceptedAi && hasAbstract"
                  class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
                >
                  <p>{{ getString("aiSummarizeAbstractButton") }}</p>
                  <p>
                    <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                  </p>
                  <button
                    v-for="prompt in getsummarizeSingleAbstractPrompt()"
                    :key="prompt.name"
                    v-tooltip="{
                      content: getString('hoverSummarizeSearchResultButton'),
                      distance: 5,
                      delay: $helpTextDelay,
                    }"
                    class="qpm_button qpm_summaryButton"
                    @click="clickAcceptAi(prompt)"
                  >
                    <i
                      class="bx bx-detail"
                    />
                    {{ getTranslation(prompt) }}
                  </button>
                  <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
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
            class="qpm_resultLoadingText"
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
            class="qpm_ai_hide qpm_accordions"
          >
            <template #header="accordionProps">
              <div class="qpm_aiAccordionHeader qpm_resultAiNoAbstractHeader">
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
                />
                <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
                <i
                  class="ri-sparkling-fill"
                />
                <div class="qpm_infoInline">
                  <strong>
                    <template v-if="getSelectedResultNoAbstractHeaderParts().prefix">
                      {{ getSelectedResultNoAbstractHeaderParts().prefix }}
                    </template>
                    <span class="qpm_keepWithIcon">
                      {{ getSelectedResultNoAbstractHeaderParts().last }}
                      <button
                        v-tooltip="{
                          content: getString('hoverselectedResultAccordionHeaderNoAbstract'),
                          distance: 5,
                          delay: $helpTextDelay,
                          theme: 'infoTooltip',
                        }"
                        class="bx bx-info-circle qpm_infoIcon"
                        aria-label="Info"
                      />
                    </span>
                  </strong>
                </div>
              </div>
            </template>
            <div>
              <div class="qpm_ai_hide">
                  <div
                    v-if="!hasAcceptedAi && !hasAbstract"
                    class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
                  >
                    <p>{{ getString("aiSummarizeArticleButton") }}</p>
                    <p>
                      <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                    </p>
                    <button
                      v-for="prompt in getsummarizeSingleAbstractPrompt()"
                      :key="prompt.name"
                      v-tooltip="{
                        content: getString('hoverSummarizeSearchResultButton'),
                        distance: 5,
                        delay: $helpTextDelay,
                      }"
                      class="qpm_button qpm_summaryButton"
                      @click="clickAcceptAi(prompt)"
                    >
                      <i
                        class="bx bx-detail"
                      />
                      {{ getTranslation(prompt) }}
                    </button>
                    <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
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
                  <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
              </div>
            </div>
          </accordion-menu>

          <div class="qpm_unpaywall">
            <template v-if="doi">
              <p class="onHoverJS qpm_pubmedLink">
                <template v-if="!unpaywallResponseLoaded">
                  <loading-spinner
                    :loading="true"
                    :size="15"
                    class="qpm_unpaywallLoadingSpinner"
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
                  <i class="bx bxs-file-pdf qpm_pdf-icon qpm_pdfIconRed" />
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
                  <i class="bx bxs-file-html qpm_pdf-icon qpm_pdfIconMuted" />
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
                  <i class="bx bxs-file-pdf qpm_pdf-icon qpm_pdfIconMuted" />
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
              <p class="qpm_noPubmedLink">{{ getString("NoUnpaywall") }}</p>
            </template>
          </div>

          <!-- abstract is in text prop -->
          <div v-if="abstract === ''" class="qpm_abstractWrapper">
            <template v-if="hasSectionedAbstract">
              <div v-html="getSectionAbstract"></div>
            </template>

            <!-- abstract is provided manually through sectionedAbstract prop-->
            <template v-if="hasAbstract && !hasSectionedAbstract">
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
            <template v-if="!hasAbstract || (!isDocTypeAllowed && !hasSectionedAbstract)">
              <p class="qpm_noAbstractPadding">
                {{ getString("noAbstract") }}
              </p>
            </template>
          </div>

          <!-- abstract is in abstract prop -->
          <div v-else class="qpm_abstractWrapper">
            <div>
              <p><strong>Abstract</strong></p>
            </div>
            <p>{{ abstract }}</p>
          </div>
        </div>

        <!-- links for related content below abstract -->
        <div v-if="(pmid !== undefined || doi) && showingAbstract" class="qpm_relatedLinks">
          <!-- Find related articles -->
          <p v-if="pmid !== undefined" class="intext-arrow-link onHoverJS qpm_pubmedLink">
            <a
              v-if="pmid !== undefined"
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
          <p v-if="pmid !== undefined" class="intext-arrow-link onHoverJS qpm_pubmedLink">
            <a
              v-if="pmid !== undefined"
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
            class="intext-arrow-link onHoverJS qpm_pubmedLink"
            v-if="pmid !== undefined && pmid !== null"
          >
            <a
              v-if="pmid !== undefined && pmid !== null"
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
          <p v-if="(pmid || doi) !== undefined" class="intext-arrow-link onHoverJS qpm_pubmedLink">
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
        </div>
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
  import {
    areComparableIdsEqual,
    formatPublicationInfo,
    getLocalizedTranslation,
    hasDefinedValue,
    isMobileViewport,
  } from "@/utils/componentHelpers";

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
    },
    data() {
      const startElement = document.getElementById("qpm_start");
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
      getPubMedLink() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/" +
          this.pmid +
          "/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          ""
        );
      },
      getDoiLink() {
        return this.doi ? "https://doi.org/" + this.doi : "";
      },
      getPubmedRelated() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          "&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
          this.pmid
        );
      },
      getPubmedRelatedReviews() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          "&filter=pubt.systematicreview&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
          this.pmid
        );
      },
      getPubmedAlsoViewed() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.getMyncbiShare +
          "&linkname=pubmed_pubmed_alsoviewed&sort=relevance&from_uid=" +
          this.pmid
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
        return hasDefinedValue(this.pmid)
          ? "https://scholar.google.com/scholar_lookup?pmid=" + this.pmid
          : "https://scholar.google.com/scholar_lookup?doi=" + this.doi;
      },
      getTitle() {
        return this.stripHtmlToText(this.title);
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
          title: this.getTitle,
          authors: this.calculateAuthors,
          source: this.getSource,
          pmid: this.pmid,
          pubdate: this.pubDate,
          abstract: this.getAbstract,
        };
      },
      isChecked() {
        if (Array.isArray(this.modelValue)) {
          return this.modelValue.some((entry) => {
            if (entry === this.value) return true;
            if (entry?.uid !== undefined && entry?.uid !== null) {
              return areComparableIdsEqual(entry.uid, this.pmid);
            }
            return areComparableIdsEqual(entry, this.pmid);
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
      this.$emit("loadAbstract", this.id);

      eventBus.on("result-entry-show-abstract", this.onEventBusShowAbstractEvent);
    },
    beforeUpdate() {
      this.checkPreload();
    },
    beforeUnmount() {
      eventBus.off("result-entry-show-abstract", this.onEventBusShowAbstractEvent);
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

      /**
       * Ensures that the Dimension and Altmetric third-party scripts are loaded.
       * If the scripts are not present, they are dynamically injected into the document.
       */
      ensureThirdPartyScripts() {
        const scriptList = Array.from(document.getElementsByTagName("script"));

        const isDimensionLoaded = scriptList.some((script) => script.id === "dimension");
        const isAltmetricLoaded = scriptList.some((script) => script.id === "altmetric");

        // Inject Dimension script and stylesheet if not loaded
        if (!isDimensionLoaded) {
          this.injectScript({
            src: "https://badge.dimensions.ai/badge.js",
            id: "dimension",
            attributes: {
              "data-cookieconsent": "statistics",
              async: true,
            },
            onError: () => {
              console.error("Failed to load Dimension script.");
            },
          });

          this.injectStylesheet({
            href: "https://badge.dimensions.ai/badge.css",
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
        const endpoint = "/api/CheckIfResourceIsForbidden";
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
        const eventClass = this.abstractLoaded ? "qpm_shadow" : "qpm_abstractContainer";
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
        return summarizeSingleAbstractPrompt;
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

