<!-- eslint-disable vue/no-v-html -->
<template>
  <div ref="result" tabindex="0" class="qpm_ResultEntry" :name="id">
    <loading-spinner :loading="loading" />
    <p v-if="showDate" class="qpm_resultentryDate">
      {{ date }}
    </p>
    <div lang="en">
      <div class="qpm_resultChangeOrder">
        <div class="d-flex">
          <input
            v-if="selectable && hasAbstract"
            :id="'qpm_selectArticleCheckbox_' + id"
            type="checkbox"
            class="qpm_selectArticleCheckbox"
            style="margin-left: -30px"
            :name="'qpm_selectArticleCheckbox_' + id"
            :checked="isChecked"
            :value="value"
            @change="updateInput"
            @keyup.enter="changeOnEnter"
          />
          <div style="margin-bottom: 10px">
            <label :for="selectable && hasAbstract ? 'qpm_selectArticleCheckbox_' + id : null">
              <p
                v-if="showArticleButtons || !hasAbstract"
                style="display: inline"
                class="qpm_resultTitle"
              >
                {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
              </p>
              <p
                v-if="!showArticleButtons && hasAbstract"
                style="display: inline"
                class="qpm_resultTitle qpm_resultTitleHover"
                @click="showAbstract"
              >
                <span v-if="getVernacularTitle && getVernacularTitle != getTitle">
                  {{ getVernacularTitle }}<br />
                </span>
                {{ getTitle }}<span v-if="!getTitle">{{ getBookTitle }}</span>
              </p>
            </label>
            <p
              v-if="config.useAI"
              style="display: inline"
              class="qpm_translateTitleLink qpm_ai_hide"
            >
              <a v-if="language != 'en'" href="#" @click.prevent="toggleTranslation">
                {{
                  translationShowing
                    ? getString("hideTranslatedTitle")
                    : getString("showTranslatedTitle")
                }}
              </a>
            </p>
          </div>
        </div>
        <ai-translation :showing-translation="translationShowing" :title="computedTitle" />
        <div style="line-height: 1.5em">
          <p class="qpm_resultAuthors">
            <span v-if="calculateAuthors">{{ calculateAuthors }}.</span>
            <span v-if="!calculateAuthors"
              ><i>{{ getString("noAuthorsListed") }}</i></span
            >
            <br />
          </p>
        </div>
      </div>
      <div style="line-height: 1.5em">
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
    <div v-if="getComponentWidth" style="display: flex; flex-direction: column-reverse">
      <div v-if="showArticleButtons" class="qpm_resultButtons_mobile" :style="mobileResult">
        <button
          v-if="hasValidAbstract"
          v-tooltip="{
            content: getString('hoverShowAbstractButton'),
            offset: 5,
            delay: $helpTextDelay,
            trigger: 'hover',
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
          v-if="pmid != null"
          v-tooltip="{
            content: getString('hoverOpenInPubMedButton'),
            offset: 5,
            delay: $helpTextDelay,
            trigger: 'hover',
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
            offset: 5,
            delay: $helpTextDelay,
            trigger: 'hover',
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
          v-if="hasValidAbstract || pmid || doi"
          v-tooltip="{
            content: getString('hoverShowAbstractButton'),
            offset: 5,
            delay: $helpTextDelay,
            trigger: 'hover',
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
          v-if="pmid !== undefined"
          v-tooltip="{
            content: getString('hoverOpenInPubMedButton'),
            offset: 5,
            delay: $helpTextDelay,
            trigger: 'hover',
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
            offset: 5,
            delay: $helpTextDelay,
            trigger: 'hover',
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
    <p
      v-if="hyperLink != null && hyperLink.length > 0"
      class="intext-arrow-link onHoverJS qpm_pubmedLink"
    >
      <a target="_blank" :href="getHyperLink">
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
        <div v-show="showingAbstract" lang="en" style="position: relative; margin-top: 0">
          <accordion-menu
            v-if="config.useAI && hasValidAbstract"
            class="qpm_ai_hide qpm_accordions"
          >
            <template #header="accordionProps">
              <div class="qpm_aiAccordionHeader" style="padding-left: 15px; display: inline-flex">
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
                />
                <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
                <i
                  class="bx bx-detail"
                  style="
                    font-size: 22px;
                    vertical-align: text-bottom;
                    margin-left: 3px;
                    margin-right: 5px;
                  "
                />
                <div>
                  <strong>{{ getString("selectedResultAccordionHeader") }}</strong>
                  <button
                    v-tooltip="{
                      content: getString('hoverselectedResultAccordionHeader'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="bx bx-info-circle"
                    style="cursor: help; margin-left: -5px; vertical-align: top"
                  />
                </div>
              </div>
            </template>

            <div class="qpm_ai_hide">
              <keep-alive>
                <div
                  v-if="!hasAcceptedAi && hasAbstract"
                  class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
                >
                  <p>{{ getString("aiSummarizeAbstractButton") }}</p>
                  <p>
                    <strong>{{ getString("aiSummarizeSearchResultButton") }}</strong>
                  </p>
                  <button
                    v-for="prompt in getAbstractSummaryPrompts()"
                    :key="prompt.name"
                    v-tooltip="{
                      content: getString('hoverSummarizeSearchResultButton'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="qpm_button qpm_summaryButton"
                    @click="clickAcceptAi(prompt)"
                  >
                    <i
                      class="bx bx-detail"
                      style="font-size: 22px; line-height: 0; margin: -4px 2px 0 0"
                    />
                    {{ getTranslation(prompt) }}
                  </button>
                  <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
                </div>

                <!-- AI Summaries of abstract -->
                <ai-summaries
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
                  :prompts="getAllPrompts()"
                  :summary-search-summary-consent-text="getString('aiSearchSummaryConsentHeader')"
                  :summary-consent-header="getString('aiAbstractSummaryConsentHeader')"
                  :success-header="getString('aiSummarizeAbstractResultHeader')"
                  :error-header="getString('aiSummarizeAbstractErrorHeader')"
                  :has-accepted-ai="hasAcceptedAi"
                  :initial-tab-prompt="initialAiTab"
                  :get-selected-articles="getArticleAsArray"
                  :check-for-pdf="true"
                  @close="closeSummaries"
                  @ai-summaries-click-retry="onAiSummariesClickRetry"
                />
              </keep-alive>
            </div>
          </accordion-menu>
          <p
            v-if="
              !hasValidAbstract &&
              (isResourceAllowed === undefined ||
                isPubTypeAllowed === undefined ||
                isLicenseAllowed === undefined)
            "
            style="margin-left: 20px; margin-top: 15px"
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
              <div class="qpm_aiAccordionHeader" style="padding-left: 15px; display: inline-flex">
                <i
                  v-if="accordionProps.expanded"
                  class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"
                />
                <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows" />
                <i
                  class="bx bx-detail"
                  style="
                    font-size: 22px;
                    vertical-align: text-bottom;
                    margin-left: 3px;
                    margin-right: 5px;
                  "
                />
                <div>
                  <strong>{{ getString("selectedResultAccordionHeaderNoAbstract") }}</strong>
                  <button
                    v-tooltip="{
                      content: getString('hoverselectedResultAccordionHeaderNoAbstract'),
                      offset: 5,
                      delay: $helpTextDelay,
                      hideOnTargetClick: false,
                    }"
                    class="bx bx-info-circle"
                    style="cursor: help; margin-left: -5px; vertical-align: top"
                  />
                </div>
              </div>
            </template>
            <div>
              <div class="qpm_ai_hide">
                <keep-alive>
                  <div
                    v-if="!hasAbstract"
                    class="qpm_searchSummaryText qpm_searchSummaryTextBackground"
                  >
                    <p>
                      <strong>{{ getString("summarizeArticleNoAbstractNotice") }}</strong>
                    </p>
                    <p>{{ getString("aiSummarizeArticleButton") }}</p>
                    <button
                      v-for="prompt in getSummarizeArticlePrompt()"
                      :key="prompt.name"
                      v-tooltip="{
                        content: getString('hoverSummarizeSearchResultButton'),
                        offset: 5,
                        delay: $helpTextDelay,
                        hideOnTargetClick: false,
                      }"
                      class="qpm_button qpm_summaryButton"
                      @click="clickAcceptAiNoAbstract(prompt)"
                    >
                      <i
                        class="bx bx-detail"
                        style="font-size: 22px; line-height: 0; margin: -4px 2px 0 0"
                      />
                      {{ getTranslation(prompt) }}
                    </button>
                    <!-- AI Summary of an article when no abstract present -->
                    <summarize-article-no-abstract
                      ref="SummarizeArticleNoAbstractComponent"
                      :pdf-url="pdfUrl"
                      :html-url="htmlUrl"
                    />
                    <p class="qpm_summaryDisclaimer" v-html="getString('aiSummaryConsentText')" />
                  </div>
                </keep-alive>
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
                    style="display: inline-block !important; margin-right: 5px"
                  />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_loading'),
                      offset: 5,
                      delay: $helpTextDelay,
                      trigger: 'hover',
                    }"
                    target="_blank"
                    :href="getUnpaywall"
                  >
                    {{ getString("UnpaywallLoading") }}
                  </a>
                </template>

                <template v-else-if="getHasOaPdf">
                  <i class="bx bxs-file-pdf qpm_pdf-icon" style="color: #d20a0a" />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_pdf'),
                      offset: 5,
                      delay: $helpTextDelay,
                      trigger: 'hover',
                    }"
                    target="_blank"
                    :href="getOaPdf"
                    download
                  >
                    {{ getString("UnpaywallWithPdf") }}
                  </a>
                </template>

                <template v-else-if="getHasOaHtml">
                  <i class="bx bxs-file-html qpm_pdf-icon" style="color: #a8a8a8" />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_html'),
                      offset: 5,
                      delay: $helpTextDelay,
                      trigger: 'hover',
                    }"
                    target="_blank"
                    :href="getOaHtml"
                    download
                  >
                    {{ getString("UnpaywallWithHtml") }}
                  </a>
                </template>

                <template v-else>
                  <i class="bx bxs-file-pdf qpm_pdf-icon" style="color: #a8a8a8" />
                  <a
                    v-tooltip="{
                      content: getString('hoverUnpaywall_noPdf'),
                      offset: 5,
                      delay: $helpTextDelay,
                      trigger: 'hover',
                    }"
                    target="_blank"
                    :href="getUnpaywall"
                  >
                    {{ getString("UnpaywallNoPdf") }}
                  </a>
                </template>
              </p>
            </template>
            <template v-if="!doi">
              <p class="qpm_noPubmedLink">
                {{ getString("NoUnpaywall") }}
              </p>
            </template>
          </div>

          <div v-if="abstract === ''" class="qpm_abstractWrapper">
            <template v-if="hasAbstract">
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
            <template v-if="!hasAbstract || !isDocTypeAllowed">
              <p style="padding-bottom: 10px">
                {{ getString("noAbstract") }}
              </p>
            </template>
          </div>

          <div v-else class="qpm_abstractWrapper">
            <div>
              <p><strong>Abstract</strong></p>
            </div>
            <p>{{ abstract }}</p>
          </div>
        </div>
        <div v-if="(pmid !== undefined || doi) && showingAbstract" class="qpm_relatedLinks">
          <p v-if="pmid !== undefined" class="intext-arrow-link onHoverJS qpm_pubmedLink">
            <a
              v-if="pmid !== undefined"
              v-tooltip="{
                content: getString('hoverrelatedPubmed'),
                offset: 5,
                delay: $helpTextDelay,
                trigger: 'hover',
              }"
              target="_blank"
              :href="getPubmedRelated"
            >
              {{ getString("relatedPubmed") }}
            </a>
          </p>
          <p v-if="pmid !== undefined" class="intext-arrow-link onHoverJS qpm_pubmedLink">
            <a
              v-if="pmid !== undefined"
              v-tooltip="{
                content: getString('hoverrelatedPubmedReviews'),
                offset: 5,
                delay: $helpTextDelay,
                trigger: 'hover',
              }"
              target="_blank"
              :href="getPubmedRelatedReviews"
            >
              {{ getString("relatedPubmedReviews") }}
            </a>
          </p>
          <p v-if="(pmid || doi) !== undefined" class="intext-arrow-link onHoverJS qpm_pubmedLink">
            <a
              v-if="(pmid || doi) !== undefined"
              v-tooltip="{
                content: getString('hoverGoogleScholar'),
                offset: 5,
                delay: $helpTextDelay,
                trigger: 'hover',
              }"
              target="_blank"
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
  import AiSummaries from "@/components/AiSummaries.vue";
  import AiTranslation from "@/components/AiTranslation.vue";
  import AccordionMenu from "@/components/AccordionMenu.vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import SummarizeArticleNoAbstract from "@/components/SummarizeArticleNoAbstract.vue";
  import axios from "axios";
  import { config } from "@/config/config.js";
  import { messages } from "@/assets/content/qpm-translations";
  import { eventBus } from "@/mixins/appSettings";
  import { appSettingsMixin } from "@/mixins/appSettings";
  import { promptRuleLoaderMixin } from "@/mixins/promptRuleLoaderMixin.js";

  import {
    abstractSummaryPrompts,
    summarizeArticlePrompt,
  } from "@/assets/content/qpm-open-ai-prompts";

  export default {
    name: "ResultEntry",
    components: {
      LoadingSpinner,
      AccordionMenu,
      AiSummaries,
      AiTranslation,
      SummarizeArticleNoAbstract,
    },
    mixins: [appSettingsMixin, promptRuleLoaderMixin],
    model: {
      prop: "modelValue",
      event: "change",
    },
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
      abstractSummaryPrompts: {
        type: Array,
        required: true,
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
    },
    data() {
      // Added by Ole
      if (document.getElementById("qpm_start") != null) {
        document.getElementById("qpm_start").scrollIntoView({ behavior: "smooth" });
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
        unpaywallResponseLoaded: this.doi == null,
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
      getUsePDFsummaryFlag() {
        return this.appSettings.openAi.usePDFsummary;
      },
      getButtonText() {
        if (!this.isAbstractLoaded) {
          return this.getString("loadingText");
        }
        if (this.hasValidAbstract) {
          return this.showingAbstract
            ? this.getString("hideAbstract")
            : this.getString("showAbstract");
        } else {
          return this.showingAbstract ? this.getString("hideInfo") : this.getString("showInfo");
        }
      },
      getComponentWidth() {
        return this.checkIfMobile || (this.parentWidth < 520 && this.parentWidth != 0);
      },
      getPubMedLink() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/" +
          this.pmid +
          "/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          ""
        );
      },
      getDoiLink() {
        if (this.doi) {
          return "https://doi.org/" + this.doi;
        } else return "";
      },
      getPubmedRelated() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          "&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
          this.pmid
        );
      },
      getPubmedRelatedReviews() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          "&filter=pubt.systematicreview&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
          this.pmid
        );
      },
      getPubmedAlsoViewed() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          "&linkname=pubmed_pubmed_alsoviewed&sort=relevance&from_uid=" +
          this.pmid
        );
      },
      getUnpaywall() {
        if (this.doi) {
          return "https://unpaywall.org/" + this.doi;
        } else return "";
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
        if (this.getHasOaHtml) {
          return this.unpaywallResponse.best_oa_location.url_for_landing_page;
        } else return "";
      },
      getOaPdf() {
        if (this.getHasOaPdf) {
          return this.unpaywallResponse.best_oa_location.url;
        } else return "";
      },
      getGoogleScholar() {
        if (this.pmid != null) {
          return "https://scholar.google.com/scholar_lookup?pmid=" + this.pmid;
        } else {
          return "https://scholar.google.com/scholar_lookup?doi=" + this.doi;
        }
      },
      getTitle() {
        var div = document.createElement("div");
        div.innerHTML = this.title;
        var text = div.textContent || div.innerText || "";

        return text.replace(/<\/?[^>]+(>|$)/g, "");
      },
      // Added by Ole (getBookTitle and getVernacularTitle also added in template)
      getBookTitle() {
        var div = document.createElement("div");
        div.innerHTML = this.booktitle;
        var text = div.textContent || div.innerText || "";
        return text.replace(/<\/?[^>]+(>|$)/g, "");
      },
      getVernacularTitle() {
        if (this.vernaculartitle) {
          var div = document.createElement("div");
          div.innerHTML = this.vernaculartitle;
          var text = div.textContent || div.innerText || "";
          return text.replace(/<\/?[^>]+(>|$)/g, "");
        } else return "";
      },
      calculateAuthors() {
        let authorArray = this.author.split(",");
        if (!this.shownSixAuthors || authorArray.length <= 6) return this.author;
        let shownAuthors = "";
        for (let i = 0; i < 6; i++) {
          if (i > 0) shownAuthors += ",";
          shownAuthors += " " + authorArray[i];
        }
        shownAuthors += ", et al";
        return shownAuthors;
      },
      getScreenWidth() {
        var width =
          window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return width;
      },
      checkIfMobile() {
        let check = false;
        (function (a) {
          if (
            /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
              a
            ) ||
            /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
              a.substr(0, 4)
            )
          )
            check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
      },
      mobileResult() {
        if (this.getDoiLink) return { "flex-direction": "row" };
        else return "";
      },
      showArticleButtons() {
        return this.showButtons;
      },
      usePubMed() {
        if (this.id == this.pmid) return true;
        return false;
      },
      getAbstractId() {
        let divName = this.getAbstractDivName;
        return divName + "_" + this._uid;
      },
      getHyperLink() {
        return this.hyperLink;
      },
      getAbstractDivName() {
        return this.id != null ? "abstract_" + this.id : "custom";
      },
      getSource() {
        var source = this.source || "";
        var pubDate = this.pubDate || "";
        var sourceDateSeperator = source && pubDate ? ". " : "";
        var volume = ";" + this.volume || "";
        var issue = "(" + this.issue + ")" || "";
        var pages = ":" + this.pages || "";
        return source + sourceDateSeperator + pubDate + volume + issue + pages;
      },
      getAbstract() {
        var abstract = "";

        if (this.abstract) {
          abstract = this.abstract;
        } else {
          for (var section in this.text) {
            var header =
              section !== "UNLABELLED" && section !== "null"
                ? section[0].toUpperCase() + section.slice(1).toLowerCase()
                : "Abstract";
            var body = this.text[section];

            abstract = abstract + "\n\n" + header + "\n" + body;
          }
        }

        return abstract.trim();
      },
      getArticle() {
        var article = JSON.parse(
          JSON.stringify({
            title: this.getTitle,
            authors: this.calculateAuthors,
            source: this.getSource,
            pmid: this.pmid,
            abstract: this.getAbstract,
          })
        );
        return article;
      },
      isChecked() {
        if (this.modelValue instanceof Array) {
          let self = this;
          return this.modelValue.some(function (e) {
            return e == self.value || e.uid == self.pmid;
          });
        }
        return this.modelValue;
      },
      // eslint-disable-next-line vue/no-async-in-computed-properties
      getArticles() {
        var articles = [this.getArticle];
        // eslint-disable-next-line vue/no-async-in-computed-properties
        return articles;
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
      // Listen for the 'abstractLoaded' event from the parent component
      this.$parent.$on("abstractLoaded", this.setAbstract);

      // Inject Dimension and Altmetric scripts if they are not already present
      this.ensureThirdPartyScripts();
    },
    mounted() {
      // This is to ensure all badges to be loaded properly
      // given there are multiple occurrences of <specific-articles/>

      this.self = this;
      if (this.id != null) {
        this.abstractId = `abstract${this.id}`;
      } else {
        this.abstractId = "custom";
      }
      this.checkPreload();
      this.$emit("loadAbstract", this.id);

      eventBus.$on("result-entry-show-abstract", this.onEventBusShowAbstractEvent);
    },
    beforeUpdate() {
      this.checkPreload();
    },
    beforeUnmount() {
      eventBus.$off("result-entry-show-abstract", this.onEventBusShowAbstractEvent);
      this.$parent.$off("abstractLoadeds", this.setAbstract);
    },
    methods: {
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
        const openAiServiceUrl = `${this.appSettings.openAi.baseUrl}${endpoint}`;
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
      setAbstract() {
        console.info(`my id is: ${this.id}`);
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
          document.getElementById(this.getAbstractId).parentElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        } else {
          if (this.getAbstractId) {
            // Get the div containing the abstract and then select
            // the <specific-article> containing it.
            document.getElementById(this.getAbstractId).parentElement.scrollIntoView({
              block: "start",
              behavior: "smooth",
            });
          }
        }

        if (!this.unpaywallResponseLoaded) {
          await this.loadUnpaywallApiResponse();
        }
      },
      gotosite(url) {
        window.open(url, "_blank");
      },
      collapseSection(element) {
        // get the height of the element's inner content, regardless of its actual size
        //var sectionHeight = element.scrollHeight;

        // temporarily disable all css transitions
        element.style.height = 0 + "px";

        // on the next frame (as soon as the previous style change has taken effect),
        // explicitly set the element's height to its current pixel height, so we
        // aren't transitioning out of 'auto'
        element.addEventListener("transitionend", function () {
          // remove this event listener so it only gets triggered once
          element.removeEventListener("transitionend", arguments.callee);

          // remove "height" from the element's inline styles, so it can return to its initial value
          element.style.height = null;
        });

        // mark the section as "currently collapsed"
        element.setAttribute("data-collapsed", "true");
      },
      expandSection(element) {
        // get the height of the element's inner content, regardless of its actual size
        var sectionHeight = element.scrollHeight;

        // have the element transition to the height of its inner content
        element.style.height = sectionHeight + "px";

        // when the next css transition finishes (which should be the one we just triggered)
        element.addEventListener("transitionend", function () {
          // remove this event listener so it only gets triggered once
          element.removeEventListener("transitionend", arguments.callee);

          // remove "height" from the element's inline styles, so it can return to its initial value
          element.style.height = null;
        });

        // mark the section as "currently not collapsed"
        element.setAttribute("data-collapsed", "false");
      },
      handleClickEvent() {
        let eventClass = this.abstractLoaded ? "qpm_shadow" : "qpm_abstractContainer";
        var section = document.querySelector(eventClass);
        var isCollapsed = section.getAttribute("data-collapsed") === "true";

        if (isCollapsed) {
          this.expandSection(section);
          section.setAttribute("data-collapsed", "false");
        } else {
          this.collapseSection(section);
        }
      },
      getString(string) {
        const lg = this.language;
        let constant = messages[string][lg];
        return constant != undefined ? constant : messages[string]["dk"];
      },
      getTranslation(value) {
        const lg = this.language;
        let constant = value.translations[lg];
        return constant != undefined ? constant : value.translations["dk"];
      },
      customNameLabel(option) {
        if (!option.name && !option.groupname) return;
        let constant;
        if (option.id) {
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
        if (!option) return;
        const lg = this.language;
        let constant = option.translations[lg];
        return constant != undefined ? constant : option.translations["dk"];
      },
      async loadUnpaywallApiResponse() {
        if (!this.doi) return undefined;

        let self = this;
        let url =
          "https://api.unpaywall.org/v2/" + this.doi + "?email=admin@videncenterfordiabetes.dk";
        let timeout = 15 * 1000; //15 second timeout
        await axios
          .get(url, { timeout: timeout })
          .then(function (resp) {
            self.unpaywallResponse = resp.data;
            self.unpaywallResponseLoaded = true;
            if (resp.data?.best_oa_location?.url) {
              self.defaultUrl = resp.data.best_oa_location.url;
              self.pdfUrl = resp.data.best_oa_location.url_for_pdf;
              self.htmlUrl = resp.data.best_oa_location.url_for_landing_page;
              self.license = resp.data.best_oa_location.license;
            }
          })
          .catch(function (err) {
            self.unpaywallResponseLoaded = true;
            console.debug(err);
          });
      },
      getAbstractSummaryPrompts() {
        return abstractSummaryPrompts;
      },
      getPdfQuestionPrompts() {
        let pdfPrompts = [];
        for (let i = 0; i < this.pdfQuestions.length; i++) {
          let prompt = JSON.parse(JSON.stringify(summarizeArticlePrompt));
          prompt.prompt.dk += this.pdfQuestions[i];
          prompt.name = "pdf" + i;
          pdfPrompts.push(prompt);
        }
        return pdfPrompts;
      },
      getSummarizeArticlePrompt() {
        return summarizeArticlePrompt;
      },
      getAllPrompts() {
        let temp = this.getAbstractSummaryPrompts().concat(this.getPdfQuestionPrompts());
        return temp;
      },
      updateInput(event) {
        let isChecked = event.target.checked;
        this.$emit("change", this.value, isChecked);
      },
      clickAcceptAi(prompt) {
        this.hasAcceptedAi = true;
        this.getArticles;
        this.initialAiTab = prompt;
      },
      clickAcceptAiNoAbstract(prompt) {
        this.hasAcceptedAi = true;
        this.$refs.SummarizeArticleNoAbstractComponent.$emit("SummarizeArticleNoAbstract", prompt);
      },
      closeSummaries() {
        this.hasAcceptedAi = false;
      },
      checkPreload() {
        if (!this.abstractLoaded && this.preLoadAbstract && !this.loading) {
          let showSpinner = false;
          this.loadAbstract(showSpinner);
        }
      },
      onEventBusShowAbstractEvent(args) {
        if (args.$el != this.$el) return;
        this.showAbstract(true);
      },
      onAiSummariesClickRetry(value) {
        console.log("ResultEntry |", value);
        this.$el.scrollIntoView({ behavior: "smooth" });
      },
      changeOnEnter(event) {
        event.target.click();
      },
    },
  };
</script>
