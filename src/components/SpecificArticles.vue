<template>
  <div>
    <div :id="getComponentId" ref="singleComponent" class="qpm_SpecificArticle">
      <loading-spinner :loading-component="loadingComponent" />

      <!-- Custom Case: Single Article or Custom Data -->
      <div v-if="isCustom">
        <result-entry
          :id="getKey"
          :key="getKey"
          :pmid="getId"
          :doi="getDoi(searchresult)"
          :pub-type="getPubType(searchresult)"
          :doc-type="getDocType(searchresult)"
          :title="getTitle()"
          :booktitle="getBookTitle()"
          :vernaculartitle="getVernacularTitle()"
          :date="getDate()"
          :source="getSource()"
          :has-abstract="getHasAbstract()"
          :custom-abstract="abstract"
          :sectioned-abstract="sectionedAbstract"
          :author="getAuthor()"
          :show-buttons="showArticleButtons"
          :show-date="showDate"
          :single-article="true"
          :language="language"
          :hyper-link="getHyperLink()"
          :hyper-link-text="getHyperLinkText()"
          :parent-width="getComponentWidth()"
          :shown-six-authors="shownSixAuthors"
          :show-altmetric-badge="showAltmetricBadge"
          :show-dimensions-badge="showDimensionsBadge"
          :abstract-summary-prompts="getAbstractSummaryPrompts()"
          :abstract="getAbstract(getId)"
          :text="getText(getId)"
          :is-abstract-loaded="isAbstractLoaded"
          @netFail="UnsuccessfullCall"
          @change:abstractLoad="onAbstractLoad"
          @loadAbstract="addIdToLoadAbstract"
        />
      </div>

      <!-- Default Case: Multiple Articles -->
      <div v-else-if="enteredIds.length > 0">
        <div v-if="!loadingComponent && !searchresult">
          <p>
            <strong>{{ getString("noArticleAvailable") }}</strong>
          </p>
          <p>
            <strong>{{ getString("tryAgainLater") }}</strong>
          </p>
        </div>
        <result-entry
          v-for="value in searchresult"
          :id="value.uid"
          :key="value.uid"
          :pmid="value.uid"
          :pub-date="value.pubdate"
          :custom-abstract="abstract"
          :sectioned-abstract="sectionedAbstract"
          :volume="value.volume"
          :issue="value.issue"
          :pages="value.pages"
          :doi="getDoi(value)"
          :title="getTitle(value.title)"
          :pub-type="value.pubtype"
          :doc-type="value.doctype"
          :booktitle="getBookTitle(value.booktitle)"
          :vernaculartitle="getVernacularTitle(value.vernaculartitle)"
          :date="getDate(value.history)"
          :source="getSource(value)"
          :has-abstract="getHasAbstract(value.attributes)"
          :author="getAuthor(value.authors)"
          :show-buttons="showArticleButtons"
          :show-date="showDate"
          :single-article="true"
          :language="language"
          :hyper-link="customLink"
          :hyper-link-text="hyperLinkText"
          :parent-width="getComponentWidth()"
          :shown-six-authors="shownSixAuthors"
          :show-altmetric-badge="showAltmetricBadge"
          :show-dimensions-badge="showDimensionsBadge"
          :abstract-summary-prompts="getAbstractSummaryPrompts()"
          :abstract="getAbstract(value.uid)"
          :text="getText(value.uid)"
          :is-abstract-loaded="isAbstractLoaded"
          @netFail="UnsuccessfullCall"
          @change:abstractLoad="onAbstractLoad"
          @loadAbstract="addIdToLoadAbstract"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import Vue from "vue";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import ResultEntry from "@/components/ResultEntry.vue";
  import axiosInstance from "@/utils/axiosInstance";

  import { appSettingsMixin } from "@/mixins/appSettings";
  import { messages } from "@/assets/content/qpm-translations";
  import { abstractSummaryPrompts } from "@/assets/content/qpm-open-ai-prompts.js";
  import { dateOptions, languageFormat } from "@/utils/qpm-content-helpers";
  import { order } from "@/assets/content/qpm-content-order";

  export default {
    name: "SpecificArticles",
    components: {
      LoadingSpinner,
      ResultEntry,
    },
    mixins: [appSettingsMixin],
    props: {
      ids: {
        type: String,
        default: "",
        required: false,
      },
      query: {
        type: String,
        default: "",
        required: false,
      },
      queryResults: {
        type: Number,
        default: 2,
        required: false,
      },
      sortMethod: {
        type: String,
        default: "",
        required: false,
      },
      hideButtons: {
        type: Boolean,
        default: false,
      },
      showDate: {
        type: Boolean,
        default: false,
      },
      date: {
        type: String,
        default: "",
        required: false,
      },
      title: {
        type: String,
        default: "",
        required: false,
      },
      booktitle: {
        type: String,
        default: "",
        required: false,
      },
      vernaculartitle: {
        type: String,
        default: "",
        required: false,
      },
      authors: {
        type: String,
        default: "",
        required: false,
      },
      source: {
        type: String,
        default: "",
        required: false,
      },
      abstract: {
        type: String,
        default: "",
        required: false,
      },
      doi: {
        type: String,
        default: "",
        required: false,
      },
      isCustomDoi: {
        type: Boolean,
        required: false,
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
        required: false,
      },
      sectionedAbstract: {
        type: Object,
        default: () => {},
        required: false,
      },
      componentNo: {
        type: Number,
        default: null,
        required: false,
      },
      shownSixAuthors: {
        type: Boolean,
        required: false,
      },
      showAltmetricBadge: {
        type: Boolean,
        default: true,
      },
      showDimensionsBadge: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        abstractRecords: {},
        isAbstractLoaded: false,
        idswithAbstractsToLoad: [],
        enteredIds: [],
        faltedIds: [],
        pageSize: 2,
        page: 0,
        sort: order[0],
        searchresult: undefined,
        loadingComponent: false,
        componentId: null,
        customLink: "",
      };
    },
    computed: {
      getPubMedLink() {
        return (
          "https://pubmed.ncbi.nlm.nih.gov/?" +
          "myncbishare=" +
          this.appSettings.nlm.myncbishare +
          "&term=" +
          encodeURIComponent(this.interpretQuery)
        );
      },
      interpretQuery() {
        if (!this.query) return "";
        return this.query;
      },
      showArticleButtons() {
        return !this.hideButtons;
      },
      isCustom() {
        return !this.loadingComponent && this.enteredIds.length === 0;
      },
      getKey() {
        return this.doi ? this.doi : null;
      },
      getId() {
        return this.ids ? this.ids : null;
      },
      getComponentId() {
        return `qpm_SpecificArticle_${this.componentId}`;
      },
    },
    created() {
      this.loadingComponent = true;
      this.parseIds();
      if (this.enteredIds.length > 0) {
        this.loadWithIds();
      } else {
        this.loadingComponent = false;
      }
    },
    mounted() {
      if (this.componentNo == null) {
        this.componentId = this._uid;
      } else {
        this.componentId = this.componentNo;
      }
    },
    updated() {
      if (this.loadingComponent) return;

      if (window.__dimensions_embed) {
        window.__dimensions_embed.addBadges();
      }

      const component = this.$refs.singleComponent;
      if (component && window._altmetric_embed_init) {
        window._altmetric_embed_init(component);
      }
    },
    methods: {
      parseIds() {
        if (this.ids) {
          // Split the comma-separated IDs and trim any whitespace
          this.enteredIds = this.ids.split(",").map((id) => id.trim());
        }
      },
      UnsuccessfullCall(value) {
        this.faltedIds.push(value);
      },
      setOrder(input) {
        for (let i = 0; i < order.length; i++) {
          if (order[i].method === input) {
            this.sort = order[i];
            return;
          }
        }
      },
      getAuthor(authors) {
        try {
          if (this.authors) return this.authors;
          let str = "";
          for (let i = 0; i < authors.length; i++) {
            if (i > 0) str += ",";
            str += " " + authors[i].name;
          }
          return str;
        } catch (error) {
          return error;
        }
      },
      getHasAbstract(attributes) {
        if (this.abstract || this.sectionedAbstract) return true;
        if (!attributes) {
          return false;
        }
        let found = false;
        Object.keys(attributes).forEach((key) => {
          let value = attributes[key];
          if (key === "Has Abstract" || value === "Has Abstract") {
            found = true;
          }
        });
        return found;
      },
      getDate(history) {
        try {
          if (this.date) return this.date;
          for (let i = 0; i < history.length; i++) {
            if (history[i].pubstatus === "entrez") {
              let date = new Date(history[i].date);
              let formattedDate = date.toLocaleDateString(
                languageFormat[this.language],
                dateOptions
              );
              return formattedDate;
            }
          }
          return "";
        } catch (error) {
          return error;
        }
      },
      getTitle(std) {
        if (this.title) return this.title;
        return std;
      },
      getBookTitle(std) {
        if (this.booktitle) return this.booktitle;
        return std;
      },
      getVernacularTitle(std) {
        if (this.vernaculartitle) return this.vernaculartitle;
        return std;
      },
      getDoi(searchResult) {
        try {
          if (this.doi || this.isCustomDoi) return this.doi;
          let articleids = searchResult.articleids;
          for (let i = 0; i < articleids.length; i++) {
            if (articleids[i].idtype === "doi") {
              let doi = articleids[i].value;
              return doi;
            }
          }
          return "";
        } catch (err) {
          console.error(err);
          return undefined;
        }
      },
      getPubType(searchResult) {
        try {
          return searchResult.pubtype;
        } catch (error) {
          return error;
        }
      },
      getDocType(searchResult) {
        try {
          return searchResult.doctype;
        } catch (error) {
          return error;
        }
      },
      getSource(value) {
        try {
          if (this.source !== undefined) {
            if (value !== undefined) {
              if (value.volume !== undefined) value.volume = undefined;
              if (value.issue !== undefined) value.issue = undefined;
              if (value.pages !== undefined) value.pages = undefined;
              if (value.pubdate !== undefined) value.pubdate = undefined;
            }
            return this.source;
          }
          if (value.booktitle) return value.booktitle;
          return value.source;
        } catch (error) {
          return error;
        }
      },
      getString(string) {
        let lg = this.language;
        let constant = messages[string][lg];
        return constant !== undefined ? constant : messages[string]["dk"];
      },
      getHyperLink() {
        return this.hyperLink;
      },
      getHyperLinkText() {
        return this.hyperLinkText;
      },
      getComponentWidth() {
        let container = this.$refs.singleComponent;
        if (!container?.innerHTML) return;
        return parseInt(container.offsetWidth);
      },
      async loadWithIds() {
        if (!this.enteredIds.length) {
          this.loadingComponent = false;
          return;
        }

        const baseUrl = "/esummary.fcgi"; // Relative path since baseURL is set in axiosInstance

        try {
          const response = await axiosInstance.get(baseUrl, {
            params: {
              db: "pubmed",
              tool: "QuickPubMed",
              email: this.appSettings.nlm.email,
              api_key: this.appSettings.nlm.key,
              retmode: "json",
              id: this.enteredIds.join(","),
            },
            retry: 3, // Number of retries
          });

          const data = response.data.result;
          this.searchresult = data.uids.map((uid) => data[uid]);
          await this.loadAbstracts();
        } catch (err) {
          console.error("Error fetching summaries:", err);
          this.faltedIds.push(...this.enteredIds); // Optionally track failed IDs
        } finally {
          this.loadingComponent = false;
        }
      },
      getAbstract(id) {
        if (this.abstractRecords[id] !== undefined) {
          if (typeof this.abstractRecords[id] !== "string") {
            return "";
          }
          return this.abstractRecords[id];
        }
        return "";
      },
      getText(id) {
        if (id !== undefined) {
          if (
            this.abstractRecords[id] !== undefined &&
            typeof this.abstractRecords[id] === "object"
          ) {
            return this.abstractRecords[id];
          }
        }
        return {};
      },
      async loadAbstracts() {
        const baseurl = "/efetch.fcgi"; // Relative path since baseURL is set in axiosInstance

        try {
          const response = await axiosInstance.get(baseurl, {
            params: {
              db: "pubmed",
              tool: "QuickPubMed",
              email: this.appSettings.nlm.email,
              api_key: this.appSettings.nlm.key,
              retmode: "xml",
              id: this.enteredIds.join(","),
            },
            retry: 3, // Number of retries
          });

          const data = response.data;
          let xmlDoc;

          if (window.DOMParser) {
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(data, "text/xml");
          } else {
            // For older IE versions
            // eslint-disable-next-line no-undef
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(data);
          }

          const articles = Array.from(xmlDoc.getElementsByTagName("PubmedArticle"));
          const articleData = articles.map((article) => {
            const pmid = article.getElementsByTagName("PMID")[0].textContent;
            const sections = article.getElementsByTagName("AbstractText");
            if (sections.length === 1) {
              const abstractText = sections[0].textContent;
              return [pmid, abstractText];
            } else {
              const text = {};
              for (let i = 0; i < sections.length; i++) {
                const sectionName = sections[i].getAttribute("Label");
                const sectionText = sections[i].textContent;
                text[sectionName] = sectionText;
              }
              return [pmid, text];
            }
          });

          for (const item of articleData) {
            this.onAbstractLoad(item[0], item[1]);
          }
        } catch (err) {
          console.error("Error in fetch from PubMed:", err);
        }
      },
      getAbstractSummaryPrompts() {
        return abstractSummaryPrompts;
      },
      addIdToLoadAbstract(id) {
        this.idswithAbstractsToLoad.push(id);
        // Trigger loadAbstracts only after a certain number of IDs are collected
        if (this.idswithAbstractsToLoad.length >= 5) {
          this.enteredIds.push(...this.idswithAbstractsToLoad);
          this.idswithAbstractsToLoad = [];
          this.loadWithIds();
        }
      },
      onAbstractLoad(id, abstract) {
        this.isAbstractLoaded = true;
        Vue.set(this.abstractRecords, id, abstract);
      },
    },
  };
</script>
