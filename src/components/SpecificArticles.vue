<template>
  <div>
    <div
      :id="getComponentId"
      ref="singleComponent"
      class="qpm_SpecificArticle"
    >
      <Spinner :loading-component="loadingComponent" />
      <div v-if="isCustom">
        <ResultEntry
          :id="getKey"
          :key="getKey"
          :pmid="getId"
          :doi="getDoi(searchresult)"
          :title="getTitle()"
          :pub-type="getPubType()"
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
          :abstract="getAbstract(enteredIds)"
          :text="getText(enteredIds)"
          :abstract-summary-prompts="getAbstractSummaryPrompts()"
          @netFail="UnsuccessfullCall"
          @change:abstractLoad="onAbstractLoad"
          @loadAbstract="addIdToLoadAbstract"
        />
      </div>
      <div v-else-if="enteredIds.length > 0">
        <div v-if="!loadingComponent && !searchresult">
          <p>
            <strong>{{ getString("noArticleAvailable") }}</strong>
          </p>
          <p>
            <strong>{{ getString("tryAgainLater") }}</strong>
          </p>
        </div>
        <ResultEntry
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
          :abstract="getAbstract(enteredIds)"
          :text="getText(enteredIds)"
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
import Spinner from "@/components/Spinner.vue";
import ResultEntry from "@/components/ResultEntry.vue";
import { appSettingsMixin } from "@/mixins/appSettings";
import { messages } from "@/assets/content/qpm-translations";
import { abstractSummaryPrompts } from "@/assets/content/qpm-openAiPrompts.js";
import {
  order,
  dateOptions,
  languageFormat,
} from "@/assets/content/qpm-content";

export default {
  name: "SpecificArticles",
  components: {
    Spinner,
    ResultEntry,
  },
  mixins: [appSettingsMixin],
  props: {
    ids: {
      type: String,
      required: false,
    },
    query: {
      type: String,
      required: false,
    },
    queryResults: {
      type: Number,
      required: false,
    },
    sortMethod: {
      type: String,
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
      required: false,
    },
    title: {
      type: String,
      required: false,
    },
    booktitle: {
      type: String,
      required: false,
    },
    vernaculartitle: {
      type: String,
      required: false,
    },
    authors: {
      type: String,
      required: false,
    },
    source: {
      type: String,
      required: false,
    },
    abstract: {
      type: String,
      required: false,
    },
    doi: {
      type: String,
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
      required: false,
    },
    sectionedAbstract: {
      type: Object,
      required: false,
    },
    componentNo: {
      type: Number,
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
      customLink: "",
      searchLoading: false,
      count: 0,
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
  watch: {
    showingTranslation: {
      handler: async function (newValue) {
        if (!newValue) {
          await this.showTranslation();
        }
      },
      immediate: true,
    },
    models(newModelState, oldModelState) {
      const oldIds = oldModelState.map((model) => model.uid);
      const newModels = newModelState
        .map((model) => model.uid)
        .filter((uid) => oldIds.includes(uid));
      this.modelsChangesPending.splice(this.models.length, 0, ...newModels);

      if (this.onlyUpdateModelWhenVisible) {
        this.updateModelsIfOnScreen();
      } else {
        this.shownModels = newModelState;
      }
    },
  },
  async created() {
    this.loadingComponent = true;
    if (this.queryResults) this.pageSize = parseInt(this.queryResults);
    this.setOrder(this.sortMethod);
    const baseUrl =
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&tool=QuickPubMed&email=admin@videncenterfordiabetes.dk&api_key=258a604944c9858b96739c730cd6a579c908&retmode=json&retmax=" +
      this.pageSize +
      "&retstart=" +
      this.page * this.pageSize +
      "&sort=" +
      this.sort.method +
      "&term=";

    if (this.ids) {
      let idArray = this.ids.split(",");
      for (let i = 0; i < idArray.length; i++) {
        idArray[i] = idArray[i].trim();
        this.enteredIds.push(idArray[i]);
      }
    }

    if (this.interpretQuery === "") {
      this.loadWithIds();
      this.customLink = this.hyperLink;
      return;
    }

    axios.get(baseUrl + this.interpretQuery).then((resp) => {
      let ids = resp.data.esearchresult.idlist;
      if (ids && ids.length !== 0) {
        for (let i = 0; i < ids.length; i++) {
          if (!this.enteredIds.includes(ids[i])) this.enteredIds.push(ids[i]);
        }
      }

      this.count = parseInt(resp.data.esearchresult.count);
      this.loadWithIds();
    });

    this.customLink = this.hyperLink;
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
      if (!this.enteredIds || this.enteredIds.length === 0) {
        this.customLink = this.hyperLink;
        this.searchLoading = false;
        this.loadingComponent = false;
        return;
      }

      const baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&tool=QuickPubMed&email=admin@videncenterfordiabetes.dk&api_key=258a604944c9858b96739c730cd6a579c908&retmode=json&id=";
      axios
        .get(baseUrl + this.enteredIds.join(","))
        .then((resp2) => {
          const data = [];
          const obj = resp2.data.result;

          if (!obj) {
            console.log("Error: Search was no success", resp2);
            this.searchLoading = false;
            return;
          }
          for (let i = 0; i < obj.uids.length; i++) {
            data.push(obj[obj.uids[i]]);
          }
          this.searchresult = data;
        })
        .catch((err) => {
          console.error("There was an error with the network call\n", err);
        })
        .then(() => {
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
      const baseurl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&tool=QuickPubMed" +
        "&email=" +
        this.appSettings.nlm.email +
        "&api_key=" +
        this.appSettings.nlm.key +
        "&retmode=xml&id=" +
        this.enteredIds.join(",");

      let axiosInstance = axios.create({
        headers: { Accept: "application/json, text/plain, */*" },
      });
      axiosInstance.interceptors.response.use(undefined, (err) => {
        const { config, message } = err;

        if (!config || !config.retry) {
          console.log("request retried too many times", config.url);
          return Promise.reject(err);
        }

        if (
          !(message.includes("timeout") || message.includes("Network Error"))
        ) {
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

      let loadData = axiosInstance
        .get(baseurl, { retry: 10 })
        .then((resp) => {
          let data = resp.data;
          let xmlDoc;
          if (window.DOMParser) {
            let parser = new DOMParser();
            xmlDoc = parser.parseFromString(data, "text/xml");
          } else {
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(data);
          }

          let articles = Array.from(
            xmlDoc.getElementsByTagName("PubmedArticle")
          );
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

          return articleData;
        })
        .catch((err) => {
          console.log("Error in fetch from pubMed:", err);
        });

      loadData.then((v) => {
        for (let item of v) {
          this.onAbstractLoad(item[0], item[1]);
        }
      });
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

<style scoped>
/* Component-specific styles (optional) */
</style>
