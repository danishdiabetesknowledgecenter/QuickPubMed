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
  import axios from "axios";
  import LoadingSpinner from "@/components/LoadingSpinner.vue";
  import ResultEntry from "@/components/ResultEntry.vue";

  import { appSettingsMixin } from "@/mixins/appSettings";
  import { messages } from "@/assets/content/qpm-translations";
  import { abstractSummaryPrompts } from "@/assets/content/qpm-openAiPrompts.js";
  import { order, dateOptions, languageFormat } from "@/assets/content/qpm-content";

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
        idswithAbstractsToLoad: [],
        enteredIds: [],
        faltedIds: [],
        pageSize: 2,
        page: 0,
        sort: order[0],
        searchresult: undefined,
        loadingComponent: false,
        componentId: null,
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
      console.log(`Mounted with ids: ${this.ids}`);
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
        console.log(value);
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
      loadWithIds() {
        if (!this.enteredIds.length) {
          this.loadingComponent = false;
          return;
        }

        const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
        axios
          .get(baseUrl, {
            params: {
              db: "pubmed",
              tool: "QuickPubMed",
              email: "admin@videncenterfordiabetes.dk",
              api_key: "258a604944c9858b96739c730cd6a579c908",
              retmode: "json",
              id: this.enteredIds.join(","),
            },
          })
          .then((resp) => {
            const data = resp.data.result;
            this.searchresult = data.uids.map((uid) => data[uid]);
            this.loadAbstracts();
          })
          .catch((err) => {
            console.error("Error fetching summaries:", err);
          })
          .finally(() => {
            this.loadingComponent = false;
          });
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
        const baseurl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";

        let axiosInstance = axios.create({
          headers: { Accept: "application/json, text/plain, */*" },
        });
        axiosInstance.interceptors.response.use(undefined, (err) => {
          const { config, message } = err;

          if (!config || !config.retry) {
            console.log("request retried too many times", config.url);
            return Promise.reject(err);
          }

          if (!(message.includes("timeout") || message.includes("Network Error"))) {
            return Promise.reject(err);
          }

          config.retry -= 1;

          const retryDelay = 2000;

          const delayRetryRequest = new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, retryDelay);
          });

          return delayRetryRequest.then(() =>
            axiosInstance.get(config.url, { retry: config.retry })
          );
        });

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
            retry: 10,
          });

          let data = response.data;
          let xmlDoc;
          if (window.DOMParser) {
            let parser = new DOMParser();
            xmlDoc = parser.parseFromString(data, "text/xml");
          } else {
            // eslint-disable-next-line no-undef
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(data);
          }

          let articles = Array.from(xmlDoc.getElementsByTagName("PubmedArticle"));
          let articleData = articles.map((article) => {
            let pmid = article.getElementsByTagName("PMID")[0].textContent;
            let sections = article.getElementsByTagName("AbstractText");
            if (sections.length === 1) {
              let abstractText = sections[0].textContent;
              return [pmid, abstractText];
            } else {
              let text = {};
              for (let i = 0; i < sections.length; i++) {
                let sectionName = sections[i].getAttribute("Label");
                let sectionText = sections[i].textContent;
                text[sectionName] = sectionText;
              }
              return [pmid, text];
            }
          });

          for (let item of articleData) {
            this.onAbstractLoad(item[0], item[1]);
          }
        } catch (err) {
          console.log("Error in fetch from pubMed:", err);
        }
      },
      getAbstractSummaryPrompts() {
        return abstractSummaryPrompts;
      },
      addIdToLoadAbstract(id) {
        this.idswithAbstractsToLoad.push(id);
        if (this.enteredIds[this.enteredIds.length - 1] === id) {
          this.loadAbstracts();
        }
      },
      onAbstractLoad(id, abstract) {
        Vue.set(this.abstractRecords, id, abstract);
      },
    },
  };
</script>
