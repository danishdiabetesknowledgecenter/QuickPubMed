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
          :volume="searchresult?.volume"
          :issue="searchresult?.issue"
          :pages="searchresult?.pages"
          :doi="getDoi(searchresult)"
          :pub-type="getPubType(searchresult)"
          :doc-type="getDocType(searchresult)"
          :title="getTitle()"
          :booktitle="getBookTitle()"
          :vernaculartitle="getVernacularTitle()"
          :date="getDate(searchresult?.history)"
          :source="getSource()"
          :has-abstract="getHasAbstract()"
          :custom-abstract="abstract"
          :sectioned-abstract="sectionedAbstract"
          :author="getAuthor(this.authors)"
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
        count: 0,
        maxIds: 100,
        isFetching: false,
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
        console.log("We are custom: ", !this.loadingComponent && this.enteredIds.length === 0);

        return !this.loadingComponent && this.enteredIds.length === 0;
      },
      getKey() {
        return this.doi ? this.doi : null;
      },
      getId() {
        console.log("Getting ID: ", this.ids ? this.ids : null);
        return this.ids ? this.ids : null;
      },
      getComponentId() {
        return `qpm_SpecificArticle_${this.componentId}`;
      },
    },
    created() {
      // Listen to 'loadAbstract' events from child components
      this.$on("loadAbstract", this.addIdToLoadAbstract);
      this.fetchInitialArticles();
    },
    beforeDestroy() {
      // Clean up event listeners to prevent memory leaks
      this.$off("loadAbstract", this.addIdToLoadAbstract);
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
      // Fetch initial articles based on ids or query
      async fetchInitialArticles() {
        this.loadingComponent = true;
        this.enteredIds = []; // Reset IDs
        this.isAbstractLoaded = false;
        this.faltedIds = []; // Reset failed IDs if necessary

        if (this.ids) {
          // Handle provided IDs
          const idArray = this.ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id !== "")
            .slice(0, this.queryResults); // Limit to queryResults
          this.enteredIds = idArray;
          console.log("Using provided IDs:", this.enteredIds);
          if (this.enteredIds.length > 0) {
            await this.loadWithIds();
          } else {
            console.log("No valid IDs provided.");
            this.loadingComponent = false;
          }
        } else if (this.interpretQuery) {
          // Handle query-based fetching
          const baseUrl =
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi" +
            "?db=pubmed" +
            "&retmode=json" +
            `&api_key=${this.appSettings.nlm.key}` +
            `&email=${this.appSettings.nlm.email}` +
            "&term=" +
            encodeURIComponent(this.query) +
            `&retmax=${this.queryResults}`;

          try {
            const response = await axiosInstance.get(baseUrl, {
              retry: 3, // Number of retries
            });

            const ids = response.data.esearchresult.idlist;
            if (ids && ids.length > 0) {
              this.enteredIds = ids.slice(0, this.queryResults); // Ensure limit
              console.log("Initial IDs added:", this.enteredIds);
              await this.loadWithIds();
            } else {
              console.log("No IDs found for the given query.");
            }
          } catch (error) {
            console.error("Error fetching IDs based on query:", error);
            // Optionally, handle errors or set faletedIds
          } finally {
            this.loadingComponent = false;
          }
        } else {
          console.log("No IDs or query provided.");
          this.loadingComponent = false;
        }
      },
      getAuthor(authors) {
        if (!authors) {
          return;
        }
        try {
          if (this.authors) return this.authors;
          let str = "";
          for (let i = 0; i < authors.length; i++) {
            if (i > 0) str += ",";
            str += " " + authors[i].name;
          }
          return str;
        } catch (error) {
          console.error("Error in getAuthor: ", error);
          return;
        }
      },
      getHasAbstract(attributes) {
        if (this.abstract || this.sectionedAbstract) {
          return true;
        }
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
          if (!history) return "";
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
          console.error("Error in getDate: ", error);
          return;
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
          if (!searchResult) return "";
          let articleids = searchResult.articleids;
          for (let i = 0; i < articleids.length; i++) {
            if (articleids[i].idtype === "doi") {
              let doi = articleids[i].value;
              return doi;
            }
          }
          return "";
        } catch (error) {
          console.error("Error in getDoi ", error);
          return undefined;
        }
      },
      getPubType(searchResult) {
        if (!searchResult) {
          return;
        }
        try {
          return searchResult.pubtype;
        } catch (error) {
          console.error("Error in getPubType: ", error);
          return;
        }
      },
      getDocType(searchResult) {
        if (!searchResult) {
          return;
        }
        try {
          return searchResult.doctype;
        } catch (error) {
          console.error("Error in getDocType: ", error);
          return;
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
            if (this.source !== "") {
              return this.source;
            }
          }
          if (value.booktitle) return value.booktitle;
          return value.source;
        } catch (error) {
          return;
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
      getAbstractSummaryPrompts() {
        return abstractSummaryPrompts;
      },
      // Fetch summaries based on enteredIds
      async loadWithIds() {
        if (this.enteredIds.length === 0 || this.isFetching) {
          this.loadingComponent = false;
          return;
        }

        this.isFetching = true; // Set fetching flag
        this.loadingComponent = true;

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
          console.log("Data:", data);

          if (data && data.uids) {
            this.searchresult = data.uids.map((uid) => data[uid]);
            console.log("Articles:", this.searchresult);
            await this.loadAbstracts();
          } else {
            console.log("No articles found in the response.");
          }
        } catch (err) {
          console.error("Error fetching summaries:", err);
          this.faltedIds.push(...this.enteredIds);
        } finally {
          this.isAbstractLoaded = true;
          this.loadingComponent = false;
          this.isFetching = false; // Reset fetching flag
        }
      },
      // Fetch abstracts based on enteredIds and idswithAbstractsToLoad
      async loadAbstracts() {
        if (this.enteredIds.length === 0 && this.idswithAbstractsToLoad.length === 0) {
          return;
        }

        const baseurl = "/efetch.fcgi"; // Relative path since baseURL is set in axiosInstance

        try {
          const combinedIds = [...this.enteredIds, ...this.idswithAbstractsToLoad];
          const uniqueIds = Array.from(new Set(combinedIds)).join(",");

          const response = await axiosInstance.get(baseurl, {
            params: {
              db: "pubmed",
              tool: "QuickPubMed",
              email: this.appSettings.nlm.email,
              api_key: this.appSettings.nlm.key,
              retmode: "xml",
              id: uniqueIds,
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
                const sectionName = sections[i].getAttribute("Label") || `Section ${i + 1}`;
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
      // Handle IDs emitted from child components
      addIdToLoadAbstract(id) {
        console.log(`Adding ID to load abstract: ${id}`);
        if (!this.idswithAbstractsToLoad.includes(id)) {
          this.idswithAbstractsToLoad.push(id);
        }

        if (this.idswithAbstractsToLoad.length >= 5) {
          const newIds = this.idswithAbstractsToLoad.filter((id) => !this.enteredIds.includes(id));
          if (newIds.length > 0) {
            this.enteredIds.push(...newIds);
            console.log(`New IDs added: ${newIds}`);
            console.log(`Total entered IDs: ${this.enteredIds.length}`);

            if (this.enteredIds.length <= this.maxIds) {
              this.loadWithIds();
            } else {
              console.warn(`Maximum ID limit of ${this.maxIds} reached.`);
            }
          }
          this.idswithAbstractsToLoad = []; // Reset after processing
        }
      },
      // Handle abstract load completion
      onAbstractLoad(id, abstract) {
        console.log(`Abstract loaded for ID: ${id}`);
        Vue.set(this.abstractRecords, id, abstract);
      },
      // Handle unsuccessful API calls
      UnsuccessfullCall(value) {
        this.faltedIds.push(value);
      },
      // Set sorting order based on input
      setOrder(input) {
        for (let i = 0; i < order.length; i++) {
          if (order[i].method === input) {
            this.sort = order[i];
            return;
          }
        }
      },
    },
  };
</script>
