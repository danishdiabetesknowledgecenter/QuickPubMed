Vue.use(VTooltip);

// Version 2023-11-13T15:12

/**
 * An object handeling single source of truth for appSettings.
 * It follows the Store Pattern as described in the [Vue2 documentation](https://v2.vuejs.org/v2/guide/state-management).
 */
var appSettingsStore = {
  /**
   * **!!Meant for internal use only!!**
   * The internal represetation of the stores state.
   */
  _state: {
    appSettings: null,
  },

  /**
   * Get the appSettings state.
   *
   * @returns {Settings} A settings object merging production and local settings
   */
  getAppSettings() {
    if (this._state.appSettings == null) {
      this._initState();
    }

    return this._state.appSettings;
  },

  /**
   * **!!Meant for internal use only!!**
   *
   * initializes the state of this store.
   */
  _initState() {
    // Prevent undefined reference errors if settings do not exist
    if (typeof localSettings === "undefined") {
      localSettings = {};
    }
    // If settings do not exist the site will be severely
    // lacking in functionality but should be able to load
    if (typeof settings === "undefined") {
      settings = {};
    }
    const mergedSettings = this._mergeSettings(settings, localSettings);
    this._state.appSettings = mergedSettings;
  },

  /**
   * **!!Meant for internal use only!!**
   *
   * Deep merge objects, later arguments wil override earlier oes in cases of duplicate keys.
   *
   * Based on this [stack overflow answer](https://stackoverflow.com/a/48218209).
   * @param  {...any} objects The settings objects to merge
   * @returns A new deep merged object of the input objects
   */
  _mergeSettings(...objects) {
    const isObject = (val) => val !== null && typeof val === "object";

    return objects.reduce((acc, e) => {
      Object.keys(e).forEach((key) => {
        const accVal = acc[key];
        const eVal = e[key];

        if (Array.isArray(accVal) && Array.isArray(eVal)) {
          acc[key] = accVal.concat(...eVal);
        } else if (isObject(accVal) && isObject(eVal)) {
          acc[key] = this._mergeSettings(accVal, eVal);
        } else {
          acc[key] = eVal;
        }
      });
      return acc;
    }, {});
  },
};

const eventBus = new Vue();

const appSettings = {
  data: function () {
    return {
      appSettings: appSettingsStore.getAppSettings(),
    };
  },
};

/**
 * Mixin for utility functions that are reusable across components.
 *
 * @mixin
 */
const utilities = {
  methods: {
    getDomainSpecificPromptRules(domain, locale = "dk") {
      if (
        domainSpecificPromptingRules[domain] &&
        domainSpecificPromptingRules[domain][locale]
      ) {
        return domainSpecificPromptingRules[domain][locale];
      } else {
        return null;
      }
    },
    /**
     * Retrieves a localized string based on the current language.
     *
     * @param {string} string - The key for the message to retrieve.
     * @returns {string} - The localized string for the current language, or the default language ("dk") if not found.
     */
    getString(string) {
      const lg = this.language;
      const constant = messages[string][lg];
      return constant !== undefined ? constant : messages[string]["dk"];
    },
    /**
     * Performs a fetch request to the specified URL with the given body and method.
     *
     * @param {string} url - The URL to send the request to.
     * @param {Object} body - The body of the request, which will be JSON-stringified.
     * @param {string} [method="POST"] - The HTTP method to use for the request (default is "POST").
     * @param {string} [tag="default"] - A tag to identify the request in log messages (default is "default").
     * @returns {Promise<Response>} - A promise that resolves to the fetch response.
     * @throws {Error} - Throws an error if the fetch request fails.
     */
    async handleFetch(url, body, method = "POST", tag = "default") {
      try {
        const response = await fetch(url, {
          method: method,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw Error(JSON.stringify(data));
        }
        return response;
      } catch (error) {
        console.log("From: " + tag + " Error fetching:", error);
        throw error;
      }
    },
  },
};

Vue.component("MainWrapper", {
  mixins: [appSettings],
  props: {
    hideTopics: {
      type: Array,
      default: function () {
        return [];
      },
    },
    language: {
      type: String,
      default: "dk",
    },
    componentNo: {
      type: Number,
      default: 1,
    },
  },
  data: function () {
    return {
      advanced: false,
      advancedString: false,
      count: 0,
      details: true,
      filterData: {},
      filterOptions: [],
      filters: [],
      focusNextDropdownOnMount: false,
      isFirstFill: true,
      isCollapsed: false,
      isUrlParsed: false,
      loadedId: "",
      oldState: "",
      page: 0,
      pageSize: 25,
      preselectedEntries: [],
      preselectedPmidai: [],
      searchError: null,
      searchString: "",
      searchLoading: false,
      searchWithAI: true,
      searchresult: undefined,
      showFilter: false,
      simpleFilterOptions: [],
      sort: order[0],
      stateHistory: [],
      subjectDropdownWidth: 0,
      subjectOptions: [],
      subjects: [[]],
      translating: false,
      dropdownPlaceholders: [],
    };
  },
  mounted: function () {
    this.updatePlaceholders();

    //Spørg Adam
    this.advanced = !this.advanced;
    this.advancedClick(true);
    this.parseUrl();
    this.isUrlParsed = true;
    this.updateSubjectDropdownWidth();
    window.addEventListener("resize", this.updateSubjectDropdownWidth);
    this.advanced = !this.advanced;
    this.advancedClick();
    this.searchPreselectedPmidai();
    this.search();
  },
  created: function () {
    this.updatePlaceholder();
  },
  beforeDestroy: function () {
    window.removeEventListener("resize", this.updateSubjectDropdownWidth);
  },
  watch: {
    subjectDropdown: {
      handler(newVal) {
        this.updatePlaceholders();
      },
      deep: true,
      immediate: true,
    },
    advanced() {
      console.log("advanced changed");
      // Trigger an update for all the DropDownWrapper placeholders
      this.$refs.subjectDropdown.forEach((dropdown, index) => {
        dropdown.placeholder = this.getDropdownPlaceholder(index);
      });
    },
  },
  methods: {
    advancedClick: function (skip) {
      this.advanced = !this.advanced;
      this.subjectOptions = [];
      this.filterOptions = [];
      const self = this;
      if (!this.alwaysShowFilter) {
        this.filterData = {};
        this.filters = [];
      }

      filterCopy = JSON.parse(JSON.stringify(filtrer));
      for (i = 0; i < filterCopy.length; i++) {
        if (!this.advanced) {
          for (j = 0; j < filterCopy[i].choices.length; j++) {
            filterCopy[i].choices[j].buttons = false;
            if (
              (!this.isUrlParsed ||
                filterCopy[i].choices[j].simpleSearch ||
                filterCopy[i].choices[j].standardSimple) &&
              !this.filterOptions.includes(filterCopy[i])
            )
              this.filterOptions.push(filterCopy[i]);
          }
        } else {
          this.filterOptions.push(filterCopy[i]);
        }
      }

      subjectCopy = JSON.parse(JSON.stringify(topics));
      for (i = 0; i < subjectCopy.length; i++) {
        if (!this.advanced) {
          for (j = 0; j < subjectCopy[i].groups.length; j++) {
            subjectCopy[i].groups[j].buttons = false;
          }
        }

        this.subjectOptions.push(subjectCopy[i]);
      }

      //reset selected subjects's scope to normal
      if (!this.advanced) {
        for (i = 0; i < this.subjects.length; i++) {
          for (j = 0; j < this.subjects[i].length; j++) {
            this.subjects[i][j].scope = "normal";
          }
        }
      }

      filters = [];
      for (i = 0; i < self.filters.length; i++) {
        for (j = 0; j < self.filterOptions.length; j++) {
          if (self.filterOptions[j].name == self.filters[i].name) {
            if (self.isUrlParsed && !self.advanced) {
              for (k = 0; k < self.filters[i].choices.length; k++) {
                if (
                  (self.filters[i].choices[k].simpleSearch ||
                    self.filters[i].choices[k].standardSimple) &&
                  self.filterData[self.filters[i].id] &&
                  !filters.includes(self.filterOptions[j])
                ) {
                  filters.push(self.filterOptions[j]);
                }
              }
            } else {
              if (self.filterData[self.filters[i].id])
                filters.push(self.filterOptions[j]);
              break;
            }
          }
        }
      }
      this.filters = filters;
      filterDataCopy = JSON.parse(JSON.stringify(this.filterData));
      Object.keys(filterDataCopy).forEach(function (key) {
        value = filterDataCopy[key];
        for (i = 0; i < value.length; i++) {
          if (!self.advanced) value[i].scope = "normal";
          if (
            self.isUrlParsed &&
            !self.advanced &&
            !value[i].simpleSearch &&
            !value[i].standardSimple
          ) {
            value.splice(i, 1);
          }
        }
        if (value.length == 0) delete filterDataCopy[key];
      });
      this.filterData = filterDataCopy;
      if (this.advanced && this.filterData == {})
        this.filters = JSON.parse(JSON.stringify([]));
      if (!skip) this.setUrl();
      this.showFilter = this.advanced && this.filters;
    },
    parseUrl: function () {
      //?subject=alkohol1#normal,alkohol2#narrow,alkohol3#broad&subject=diabetes1#normal,astma#normal1&sprog=norsk#broad,svensk#normal
      this.subjects = [];
      url = window.location.href;
      parser = document.createElement("a");
      parser.href = url;
      query = parser.search.substring(1);
      vars = query.split("&");

      if (!query) {
        this.subjects = [[]];
        return;
      }
      //console.log('hashtag', query.lastIndexOf("#"), query.substring(query.lastIndexOf("#")), vars);
      for (i = 0; i < vars.length; i++) {
        pair = vars[i].split("=");
        key = decodeURIComponent(pair[0]);
        value = decodeURIComponent(pair[1]).split(";;");
        if (key == "subject") {
          selected = [];
          // All values from the URI in 1 subject field
          for (j = 0; j < value.length; j++) {
            hashtagIndex = value[j].indexOf("#");
            id = value[j].substring(0, hashtagIndex);
            scope = value[j].substring(hashtagIndex + 1, value[j].length);
            //find subject
            found = false;
            group = id[1];
            elem = id.slice(-2);
            isId = !(id.startsWith("{{") && id.endsWith("}}"));

            if (!isId) {
              var name = id.slice(2, -3);
              var translated = id.slice(-3, -2);
              if (Number(translated)) {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTermTranslated") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              } else {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTerm") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              }
            }

            for (k = 0; k < this.subjectOptions.length; k++) {
              for (l = 0; l < this.subjectOptions[k].groups.length; l++) {
                if (this.subjectOptions[k].groups[l].id == id) {
                  tmp = JSON.parse(
                    JSON.stringify(this.subjectOptions[k].groups[l])
                  );
                  tmp.scope = scopeIds[scope];
                  let lg = this.language;
                  if (tmp.translations[lg].startsWith("-")) {
                    tmp.translations[lg] = tmp.translations[lg].slice(1);
                  }
                  selected.push(tmp);
                  found = true;
                }
              }
            }
          }
          if (selected.length > 0) this.subjects.push(selected);
        } else if (key == "advanced") {
          this.advanced = value[0] == "true";
        } else if (key == "sort") {
          for (j = 0; j < order.length; j++) {
            if (order[j].method == value[0]) {
              this.sort = order[j];
            }
          }
        } else if (key == "collapsed") {
          this.isCollapsed = value[0] == "true";
          this.toggleCollapsedSearch();
        } else if (key == "scrollto") {
          // Added by Ole
          this.scrollToID = "#" + value[0]; // Added by Ole
        } else if (key == "pageSize") {
          this.pageSize = Number.parseInt(value[0]);
        } else if (key == "pmidai") {
          this.preselectedPmidai = value ?? [];
        } else {
          //add filters
          groupId = "";
          for (k = 0; k < this.filterOptions.length; k++) {
            if (this.filterOptions[k].id == key) {
              //set filter
              groupId = this.filterOptions[k].id;
              filter = JSON.parse(JSON.stringify(this.filterOptions[k]));
              this.filters.push(filter);
            }
          }
          if (this.filters.length > 0) this.showFilter = true;

          //Find entries in filters
          for (j = 0; j < value.length; j++) {
            hashtagIndex = value[j].indexOf("#");

            // Skip values when they fail to define a scope.
            // Most often this happens when a null or undefined value is encountered.
            if (hashtagIndex < 0) {
              console.warn(
                "parseUrl: Skipped value because no hashTagIndex was found for value[" +
                  j +
                  "]:\n",
                value[j]
              );
              continue;
            }

            id = value[j].substring(0, hashtagIndex);
            scope = value[j].substring(hashtagIndex + 1, value[j].length);
            //Find filter
            filterFound = false; //name=S101
            group = Number.parseInt(id[1]);
            if (group <= 0) group = 1;
            elem = Number.parseInt(id.slice(-2));
            isId = !(id.startsWith("{{") && id.endsWith("}}")); // Check if this is a filter id or if it is a

            if (!isId) {
              var name = id.slice(2, -3);
              var translated = id.slice(-3, -2);
              if (Number(translated)) {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTermTranslated") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              } else {
                const tag = {
                  name: name,
                  searchStrings: { normal: [name] },
                  preString: this.getString("manualInputTerm") + ": ",
                  scope: "normal",
                  isCustom: true,
                  tooltip: customInputTagTooltip,
                };
                selected.push(tag);
                continue;
              }
            }
            try {
              var groupIndex = parseInt(group) - 1;
              let choice = this.filterOptions[groupIndex].choices.find(
                function (e) {
                  return e.id && e.id === id;
                }
              );

              if (choice != null) {
                tmp = JSON.parse(JSON.stringify(choice));
              } else {
                temp = null;
              }
            } catch (error) {
              console.warn("parseUrl: Couldn't create tmp. Reason:\n", error);
              tmp = null;
            }

            for (k = 0; k < this.filterOptions.length; k++) {
              for (l = 0; l < this.filterOptions[k].choices.length; l++) {
                var choice = this.filterOptions[k].choices[l];
                if (JSON.stringify(choice.id) == JSON.stringify(id)) {
                  tmp = JSON.parse(JSON.stringify(choice));
                  if (this.isUrlParsed && !this.advanced && !tmp.simpleSearch)
                    continue;
                  tmp.scope = scopeIds[scope];
                  found = true;
                }
              }
            }
            if (tmp) {
              if (this.isUrlParsed && !this.advanced && !tmp.simpleSearch)
                continue;
              tmp.scope = scopeIds[scope];
              //not already added, is empty and should be initialized
              if (!this.filterData[groupId]) {
                this.filterData[groupId] = [];
              }
              this.filterData[groupId].push(tmp);
              filterFound = true;
            }
          }
        }
      }
      if (this.subjects.length == 0) {
        this.subjects = [[]];
      }
    },
    setUrl: function () {
      if (history.replaceState) {
        urlLink = this.getUrl();
        this.stateHistory.push(this.oldState);
        window.history.replaceState(this.stateHistory, urlLink, urlLink);
        this.oldState = urlLink;
      }
    },
    getUrl: function () {
      var origin = "";
      if (window.location.origin && window.location.origin != "null") {
        origin = window.location.origin;
      }

      baseUrl = origin + window.location.pathname;

      if (this.noSubjects) {
        return baseUrl;
      }
      subjectsStr = "";
      notEmptySubjects = 0;
      for (i = 0; i < this.subjects.length; i++) {
        if (this.subjects[i].length == 0) {
          continue;
        }
        if (notEmptySubjects > 0) {
          subjectsStr += "&";
        }
        subject = "subject=";
        for (j = 0; j < this.subjects[i].length; j++) {
          scope =
            Object.keys(scopeIds)[Object.values(scopeIds).indexOf("normal")];
          if (this.advanced) {
            scope =
              Object.keys(scopeIds)[
                Object.values(scopeIds).indexOf(this.subjects[i][j].scope)
              ];
          }
          tmp = this.subjects[i][j].id;
          if (tmp)
            subject += encodeURIComponent(this.subjects[i][j].id + "#" + scope);
          //Custom tag is surrounded by "{{ }}" to distinguish it
          // the 1 and 0 is used to distinguish between ai translated and non ai translated searches
          else if (
            this.subjects[i][j].isCustom &&
            this.subjects[i][j].isTranslated
          )
            subject += encodeURIComponent(
              "{{" + this.subjects[i][j].name + "1}}#" + scope
            );
          else
            subject += encodeURIComponent(
              "{{" + this.subjects[i][j].name + "0}}#" + scope
            );

          if (j < this.subjects[i].length - 1) {
            subject += ";;";
          }
        }
        subjectsStr += subject;
        notEmptySubjects++;
      }
      filterStr = "";
      if (this.advanced || Vue.prototype.$alwaysShowFilter) {
        const self = this;
        Object.keys(self.filterData).forEach(function (key) {
          value = self.filterData[key];
          if (value.length == 0) {
            return;
          }
          filterStr += "&" + encodeURIComponent(key) + "=";
          for (i = 0; i < value.length; i++) {
            var valueUrlId = value[i].isCustom
              ? "{{" + value[i].name + "}}"
              : value[i].id;
            filterStr += encodeURIComponent(
              valueUrlId +
                "#" +
                Object.keys(scopeIds)[
                  Object.values(scopeIds).indexOf(value[i].scope)
                ]
            );
            if (i < value.length - 1) {
              filterStr += ";;";
            }
          }
        });
      }
      advancedStr = "&advanced=" + this.advanced;
      sorter = "&sort=" + encodeURIComponent(this.sort.method);
      collapsedStr = "&collapsed=" + this.isCollapsed;
      scrolltoStr = ""; // Added by Ole
      if (this.scrollToID != undefined) {
        // Added by Ole
        scrolltoStr = this.scrollToID; // Added by Ole
      } // Added by Ole
      let pageSize = "&pageSize=" + this.pageSize;
      let pmidai = "&pmidai=" + (this.preselectedPmidai ?? []).join(";;");
      urlLink =
        baseUrl +
        "?" +
        subjectsStr +
        filterStr +
        advancedStr +
        pmidai +
        sorter +
        collapsedStr +
        pageSize +
        scrolltoStr; // Added by Ole
      //?subject=alkohol1#normal,alkohol2#narrow,alkohol3#broad&subject=diabetes1#normal,astma#normal1&sprog=norsk#broad,svensk#normal
      return urlLink;
    },
    copyUrl: function () {
      urlLink = this.getUrl(true);

      //Copy link to clipboard
      var dummy = document.createElement("textarea");
      document.body.appendChild(dummy);
      dummy.value = urlLink;
      dummy.select();
      dummy.setSelectionRange(0, 99999);
      document.execCommand("copy");
      document.body.removeChild(dummy);
    },
    toggle: function () {
      this.showFilter =
        !this.showFilter || this.filters.length > 0 || !this.advanced;
      //Open dropdown. Needs delay
      const self = this;
      setTimeout(function () {
        if (self.advanced)
          self.$refs.filterDropdown.$refs.multiselect.$refs.search.focus();
      }, 50);
    },
    /**
     * Adds a new subject to the subjects array and updates the UI accordingly.
     *
     * This function performs the following steps:
     * 1. Checks if there is any empty subject in the subjects array.
     *    - If an empty subject is found, it alerts the user to fill the empty dropdown first and exits the function.
     * 2. Updates the placeholders for the subjects.
     * 3. Adds a new empty subject to the subjects array.
     * 4. Sets a timeout to focus on the search input of the newly added subject dropdown.
     */
    addSubject: function () {
      const self = this;
      var hasEmptySubject = this.subjects.some(function (e) {
        return e.length === 0;
      });
      if (hasEmptySubject) {
        var message = this.getString("fillEmptyDropdownFirstAlert");
        alert(message);
        return;
      }

      this.updatePlaceholders();
      this.subjects = [...this.subjects, []];
      console.log("Subjects: ", this.subjects);

      this.$nextTick(function () {
        const subjectDropdown = self.$refs.subjectDropdown;
        subjectDropdown[
          subjectDropdown.length - 1
        ].$refs.multiselect.$refs.search.focus();

        // Update placeholders after DOM update
        self.updatePlaceholders();
      });
    },
    removeSubject: function (id) {
      var isEmptySubject = this.subjects[id] && this.subjects[id].length === 0;

      this.subjects.splice(id, 1);
      this.setUrl();

      if (!isEmptySubject) {
        this.editForm();
      }
    },
    updateSubjects: function (value, index) {
      for (i = 0; i < value.length; i++) {
        if (i > 0) this.isFirstFill = false;
        if (!value[i].scope) value[i].scope = "normal";
      }
      if (this.subjects.length > 1) this.isFirstFill = false;
      sel = JSON.parse(JSON.stringify(this.subjects));
      sel[index] = value;
      this.subjects = sel;

      //Fills out standard filters, if they are necessary
      if (!this.advanced && this.isFirstFill) this.selectStandardSimple();
      this.isFirstFill = false;

      //Check if empty, then clear and hide filters if so
      if (this.noSubjects) {
        this.filters = [];
        this.filterData = {};
        this.showFilter = false;
        this.subjects = [[]];
        this.isFirstFill = true;
      }

      this.setUrl();
      this.editForm();
    },
    updateScope: function (item, state, index) {
      console.log(
        "updateScope: { item: ",
        item,
        ", state: ",
        state,
        ", index: ",
        index,
        " }"
      );
      let sel = JSON.parse(JSON.stringify(this.subjects));
      for (i = 0; i < sel[index].length; i++) {
        if (sel[index][i].name == item.name) {
          sel[index][i].scope = state;
          break;
        }
      }
      this.subjects = sel;
      this.setUrl();
      this.editForm();
    },
    updateFilters: function (value, index) {
      console.log("updateFilters");
      this.filters = JSON.parse(JSON.stringify(value));
      //Update selected filters
      newOb = {};
      for (i = 0; i < this.filters.length; i++) {
        const item = this.filters[i].id;
        if (this.filterData[item]) {
          newOb[item] = this.filterData[item];
        } else {
          newOb[item] = [];
        }
      }
      this.filterData = newOb;
      this.setUrl();
      this.editForm();
    },
    updateFilterAdvanced: function (value, index) {
      for (i = 0; i < value.length; i++) {
        if (!value[i].scope) value[i].scope = "normal";
      }
      temp = JSON.parse(JSON.stringify(this.filterData));
      temp[index] = value;
      this.filterData = temp;
      this.setUrl();
      this.editForm();
    },
    updateFilterSimple: function (filterType, selectedValue) {
      selectedValue.scope = "normal";
      var test = document.getElementById(selectedValue.name);
      temp = JSON.parse(JSON.stringify(this.filterData));
      const self = this;
      filter = undefined;
      if (!temp[filterType]) {
        temp[filterType] = [];
        if (temp[filterType].includes(selectedValue)) return;
        temp[filterType].push(selectedValue);
        //Apply to this.filters
        for (i = 0; i < self.filterOptions.length; i++) {
          if (self.filterOptions[i].id === filterType)
            self.filters.push(self.filterOptions[i]);
        }
      } else {
        if (test.checked) {
          if (temp[filterType].includes(selectedValue)) return;
          temp[filterType].push(selectedValue);
          //Apply to this.filters
          for (i = 0; i < self.filters.length; i++) {
            if (self.filters[i].id == filterType) {
              filter = self.filters[i];
              break;
            }
          }
          if (!filter) {
            for (i = 0; i < self.filterOptions; i++) {
              if (self.filterOptions[i].id === filterType)
                self.filters.push(self.filterOptions[i]);
              break;
            }
          }
        } else {
          for (i = 0; i < temp[filterType].length; i++) {
            if (temp[filterType][i].name === selectedValue.name) {
              temp[filterType].splice(i, 1);
              if (temp[filterType].length === 0) {
                delete temp[filterType];

                //Remove from this.filters
                for (i = 0; i < self.filters.length; i++) {
                  if (
                    JSON.stringify(self.filters[i].id) ==
                    JSON.stringify(filterType)
                  ) {
                    self.filters.splice(i, 1);
                    break;
                  }
                }
              }
              break;
            }
          }
        }
      }
      this.filterData = temp;
      this.setUrl();
      this.editForm();
    },
    updateFilterSimpleOnEnter: function (selectedValue) {
      var checkboxId = selectedValue.name.replaceAll(" ", "\\ "); // Handle ids with whitespace
      var checkbox = this.$el.querySelector("#" + checkboxId);
      checkbox.click();
    },
    /**
     * This methods can only be called once.
     * It prefills some of the filter options in simple search.
     */
    selectStandardSimple: function () {
      const self = this;
      const filtersToSelect = [];
      for (i = 0; i < self.filterOptions.length; i++) {
        const option = self.filterOptions[i];
        for (j = 0; j < option.choices.length; j++) {
          const choice = option.choices[j];
          if (choice.standardSimple) {
            const filterValue = Object.assign({ scope: "normal" }, choice);
            filtersToSelect.push({
              option: option,
              value: filterValue,
            });
          }
        }
      }

      const tempFilters = JSON.parse(JSON.stringify(this.filterData));
      // Update selected filters here.
      for (i = 0; i < filtersToSelect.length; i++) {
        const filterToSelect = filtersToSelect[i];
        const filterType = filterToSelect.option.id;
        const filtervalue = filterToSelect.value;
        // If no array exists, create array with value.
        if (!tempFilters[filterType]) {
          tempFilters[filterType] = [filtervalue];
          this.filters.push(filterToSelect.option);
        } else if (!tempFilters[filterType].includes(filtervalue)) {
          // Else add value to existing array of filter values.
          tempFilters[filterType].push(filtervalue);
        }
      }
      this.filterData = tempFilters;
    },
    updateScopeFilter: function (item, state, index) {
      let sel = JSON.parse(JSON.stringify(this.filterData));
      for (i = 0; i < sel[index].length; i++) {
        if (sel[index][i].name == item.name) {
          sel[index][i].scope = state;
          break;
        }
      }
      this.filterData = sel;
      this.setUrl();
      this.editForm();
    },
    getFilters: function (name) {
      for (i = 0; i < this.filters.length; i++) {
        if (this.filters[i].id == name) {
          return this.filters[i];
        }
      }
      return {};
    },
    isFilterUsed: function (option, name) {
      if (!option) return false;
      for (i = 0; i < option.length; i++) {
        if (option[i].name === name) return true;
      }
      return false;
    },
    clear: function () {
      for (var i = 0; i < 2; i++) {
        this.reloadScripts();
        this.subjects = [[]];
        this.filters = [];
        this.filterData = {};
        this.searchresult = undefined;
        this.count = 0;
        this.page = 0;
        this.showFilter = false;
        this.details = true;
        //hack to force all elements back to normal
        this.advanced = true;
        this.advancedClick();
        this.advancedString = false;
        this.isFirstFill = true;
        this.sort = order[0];

        //Reset expanded groups in dropdown. Only need to do first as the other dropdowns are deleted
        this.$refs.subjectDropdown[0].clearShownItems();
        this.setUrl();
      }
    },
    editForm: function () {
      this.searchresult = undefined;
      this.count = 0;
      this.page = 0;
      return true;
    },
    scrollToTop: function () {
      document
        .getElementById(this.scrollToID)
        .scrollIntoView({ block: "start", behavior: "smooth" });
    },
    reloadScripts: function () {
      //Remove scripts from header
      var scripts = document.head.getElementsByTagName("script");
      var links = document.getElementsByTagName("link");
      var il = links.length;
      var is = scripts.length,
        ial = is;
      while (is--) {
        //console.log(scripts[is].parentNode)
        if (scripts[is].id === "dimension" || scripts[is].id === "altmetric") {
          scripts[is].parentNode.removeChild(scripts[is]);
        }
      }
      /* while (il--) {
		if (links[il].href === 'https://badge.dimensions.ai/badge.css') {
		  links[il].parentNode.removeChild(links[il])
		  
			}
			} */
      //Remove divs and scripts from body so they wont affect performance
      scripts = document.body.getElementsByTagName("script");
      var scriptArray = Array.from(scripts);
      scriptArray.splice(0, 1);
      (is = scriptArray.length), (ial = is);
      //console.log(is)
      while (is--) {
        //console.log(scriptArray[is])
        if (
          scriptArray[is].src.startsWith("https://api.altmetric.com/v1/pmid") ||
          scriptArray[is].src.startsWith("https://api.altmetric.com/v1/doi")
        ) {
          scriptArray[is].parentNode.removeChild(scriptArray[is]);
        }
      }
      var containers = document.body.getElementsByClassName(
        "altmetric-embed altmetric-popover altmetric-left"
      );
      var containerArray = Array.from(containers);
      //containerArray.splice(0, 1)
      (is = containerArray.length), (ial = is);
      console.log("reloadScripts: is: " + is);
      while (is--) {
        containerArray[is].parentNode.removeChild(containerArray[is]);
      }
    },
    searchsetLowStart: function () {
      this.count = 0;
      this.page = 0;
      this.search();
    },
    search: function () {
      const self = this;
      this.searchLoading = true;
      this.searchError = null;
      let str = this.getSearchString;
      let nlm = this.appSettings.nlm;
      let baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&tool=QuickPubMed" +
        "&email=" +
        nlm.email +
        "&api_key=" +
        nlm.key +
        "&retmode=json&retmax=" +
        this.pageSize +
        "&retstart=" +
        this.page * this.pageSize +
        "&sort=" +
        this.sort.method +
        "&term=";
      let query = decodeURIComponent(str);
      console.log(`Search query: ${query}`);

      if (query.trim() == "" || query.trim() == "()") {
        this.searchLoading = false;
        return;
      }

      this.reloadScripts();

      axios
        .get(baseUrl + query)
        .then(function (resp) {
          //Search after idlist
          let ids = resp.data.esearchresult.idlist;
          ids = ids.filter((id) => id != null && id.trim() != "");
          if (ids.length == 0) {
            self.count = 0;
            self.searchresult = [];
            self.searchLoading = false;
            return;
          }
          let baseUrl2 =
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&tool=QuickPubMed" +
            "&email=" +
            nlm.email +
            "&api_key=" +
            nlm.key +
            "&retmode=json&id=";

          axios
            .get(baseUrl2 + ids.join(","))
            .then(function (resp2) {
              //Create list of returned data
              let data = [];
              let obj = resp2.data.result;
              if (!obj) {
                console.log("Error: Search was no success", err, resp2);
                self.searchLoading = false;
                return;
              }
              for (i = 0; i < obj.uids.length; i++) {
                data.push(obj[obj.uids[i]]);
              }
              self.count = parseInt(resp.data.esearchresult.count);
              self.searchresult = data;
              self.searchPreselectedPmidai();
              self.searchLoading = false;
              document.getElementById("qpm_topofsearch").scrollIntoView({
                block: "start",
                behavior: "smooth",
              });

              // Make sure that the search button will have focus to produce expected behavior when pressing 'tab'.
              var searchButton = self.$el.querySelector(".qpm_search");
              self.$nextTick(function () {
                searchButton.focus();
              }); // Delayed to let button switch to enabled state again.
            })
            .catch(function (err) {
              self.showSearchError(err);
              self.searchLoading = false;
            });
        })
        .catch(function (err) {
          self.showSearchError(err);
          self.searchLoading = false;
          // ERROR HANDLING??
        });
      document
        .getElementById("qpm_topofsearch")
        .scrollIntoView({ block: "start", behavior: "smooth" });
      //  alert(baseUrl + query);
    },
    searchMore: function () {
      let targetResultLength = Math.min(
        (this.page + 1) * this.pageSize,
        this.count
      );
      if (this.searchresult && this.searchresult.length >= targetResultLength) {
        return;
      }

      const self = this;
      this.searchLoading = true;
      this.searchError = null;
      let str = this.getSearchString;

      let pageSize = Math.min(
        this.pageSize,
        targetResultLength - this.searchresult.length
      );
      let start = Math.max(this.searchresult.length, this.page * this.pageSize);

      let nlm = this.appSettings.nlm;
      let baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&tool=QuickPubMed" +
        "&email=" +
        nlm.email +
        "&api_key=" +
        nlm.key +
        "&retmode=json&retmax=" +
        pageSize +
        "&retstart=" +
        start +
        "&sort=" +
        this.sort.method +
        "&term=";
      let query = decodeURIComponent(str);
      if (query.trim() == "" || query.trim() == "()") {
        this.searchLoading = false;
        return;
      }

      this.reloadScripts();

      axios
        .get(baseUrl + query)
        .then(function (resp) {
          //Search after idlist
          let ids = resp.data.esearchresult.idlist;
          if (ids.length == 0) {
            self.searchLoading = false;
            return;
          }
          let baseUrl2 =
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&tool=QuickPubMed&email=" +
            nlm.email +
            "&api_key=" +
            nlm.key +
            "&retmode=json&id=";
          axios
            .get(baseUrl2 + ids.join(","))
            .then(function (resp2) {
              //Create list of returned data
              let data = [];
              let obj = resp2.data.result;
              if (!obj) {
                console.log("Error: Search was no success", err, resp2);
                self.searchLoading = false;
                return;
              }
              for (i = 0; i < obj.uids.length; i++) {
                data.push(obj[obj.uids[i]]);
              }
              self.count = parseInt(resp.data.esearchresult.count);
              self.searchresult = self.searchresult.concat(data);
              self.searchLoading = false;
            })
            .catch(function (err) {
              console.error(err);
              self.showSearchError(err);
              self.searchLoading = false;
            });
        })
        .catch(function (err) {
          console.error(err);
          self.showSearchError(err);
          self.searchLoading = false;
        });
    },
    searchByIds: async function (ids) {
      ids = ids.filter((id) => id && id.trim() != "");
      if (ids.length == 0) {
        return [];
      }
      let nlm = this.appSettings.nlm;
      let baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&tool=QuickPubMed&email=" +
        nlm.email +
        "&api_key=" +
        nlm.key +
        "&retmode=json&id=";

      return axios.get(baseUrl + ids.join(",")).then(function (resp) {
        //Create list of returned data
        let data = [];
        let obj = resp.data.result;
        if (!obj) {
          throw Error("Search failed", resp);
        }
        for (i = 0; i < obj.uids.length; i++) {
          data.push(obj[obj.uids[i]]);
        }

        return data;
      });
    },
    searchPreselectedPmidai: function () {
      let self = this;
      this.searchByIds(this.preselectedPmidai)
        .then(function (entries) {
          self.preselectedEntries = entries;
        })
        .catch(function (err) {
          console.error(err);
        });
    },
    showSearchError: function (err) {
      let message = this.getString("searchErrorGeneric");
      this.searchError = Error(message, (options = { cause: err }));
    },
    nextPage: function () {
      this.page++;
      this.setUrl();
      this.searchMore();
    },
    previousPage: function () {
      this.page--;
      this.setUrl();
      this.search();
    },
    toggleDetailsBox: function () {
      // added by Ole
      this.details = !this.details; // added by Ole
    }, // added by Ole
    toggleAdvancedString: function () {
      this.advancedString = !this.advancedString;
    },
    newSortMethod: function (newVal) {
      this.sort = newVal;
      this.page = 0;
      this.setUrl();
      this.count = 0;
      this.search();
    },
    toggleCollapsedSearch: function () {
      coll = document.getElementsByClassName(
        "qpm_toggleSearchFormBtn bx bx-hide"
      )[0];
      if (this.isCollapsed == true) {
        coll.classList.add("bx-show");
      } else {
        coll.classList.remove("bx-show");
      }
    },
    toggleCollapsedController: function () {
      this.isCollapsed = !this.isCollapsed;
      this.toggleCollapsedSearch();
      this.setUrl();
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    customNameLabel: function (option) {
      if (!option.name && !option.groupname) return;
      if (option.translations) {
        lg = this.language;
        constant =
          option.translations[lg] != undefined
            ? option.translations[lg]
            : option.translations["dk"];
      } else {
        constant = option.name;
      }

      return constant;
    },
    customGroupLabel: function (option) {
      if (!option.groupName) return;
      try {
        if (option.translations) {
          lg = this.language;
          constant = option.translations[lg];
        } else {
          constant = option.name;
        }
        return constant;
      } catch (e) {
        console.log(option, e);
        return option.translations["dk"];
      }
    },
    setPageSize: function (pageSize) {
      this.pageSize = pageSize;
      this.page = 0;
      this.setUrl();
      this.searchMore();
    },
    updateSubjectDropdownWidth: function () {
      dropdown = this.$refs.subjectDropdown[0].$refs.selectWrapper;
      if (!dropdown.innerHTML) return;
      this.subjectDropdownWidth = parseInt(dropdown.offsetWidth);
    },
    checkIfMobile: function () {
      let check = false;
      (function (a) {
        if (
          /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
            a
          ) ||
          /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            a.substr(0, 4)
          )
        )
          check = true;
      })(navigator.userAgent || navigator.vendor || window.opera);
      return check;
    },
    shouldFocusNextDropdownOnMount: function (source) {
      if (!this.focusNextDropdownOnMount) return;
      this.focusNextDropdownOnMount = false;
      source.$refs.multiselect.activate();
    },
    hasVisibleSimpleFilterOption: function (filters) {
      if (!filters) return false;

      var hasVisibleFilter = filters.some(function (e) {
        return e.simpleSearch;
      });
      return hasVisibleFilter;
    },
    getSimpleTooltip: function (choice) {
      if (!choice.tooltip_simple) return null;
      return choice.tooltip_simple[this.language];
    },
    updatePreselectedPmidai: function (newValue) {
      this.preselectedPmidai = (newValue ?? []).map(function (e) {
        return e.uid;
      });
      this.setUrl();
    },
    // passing along the index seemingly makes vue understand that
    // the dropdownwrappers can have seperate placeholders so keep it even though it is unused
    getDropdownPlaceholder: function (index, translating = false) {
      if (translating) {
        return this.getString("translatingPlaceholder");
      }
      if (this.advanced) {
        width = this.subjectDropdownWidth;
        if (this.checkIfMobile() || (width < 520 && width != 0)) {
          return this.getString("subjectadvancedplaceholder_mobile");
        } else {
          return this.getString("subjectadvancedplaceholder");
        }
      } else {
        return this.getString("subjectsimpleplaceholder");
      }
    },
    updatePlaceholder(isTranslating, index) {
      if (isTranslating) {
        this.$set(
          this.dropdownPlaceholders,
          index,
          this.getDropdownPlaceholder(index, true)
        );
      } else {
        this.$set(
          this.dropdownPlaceholders,
          index,
          this.getDropdownPlaceholder(index)
        );
      }
    },
    updatePlaceholders(index) {
      if (this.$refs.subjectDropdown && this.$refs.subjectDropdown.length > 0) {
        this.$refs.subjectDropdown.forEach((_, index) => {
          this.updatePlaceholder(false, index);
        });
      }
    },
  },
  computed: {
    showTitle: function () {
      if (this.filters.length < this.filterOptions.length) {
        return this.getString("choselimits");
      }
      return "";
    },
    noSubjects: function () {
      for (i = 0; i < this.subjects.length; i++) {
        if (this.subjects[i].length > 0) {
          return false;
        }
      }
      return true;
    },
    getSearchString: function () {
      str = "";
      for (i = 0; i < this.subjects.length; i++) {
        hasOperators = false;
        subjectsToIterate = this.subjects[i].length;
        for (j = 0; j < subjectsToIterate; j++) {
          scope = this.subjects[i][j].scope;
          tmp = this.subjects[i][j].searchStrings[scope][0];
          if (
            tmp.indexOf("AND") >= 0 ||
            tmp.indexOf("NOT") >= 0 ||
            tmp.indexOf("OR") >= 0
          ) {
            hasOperators = true;
            break;
          }
        }
        substring = "";
        if (i > 0 && str != "") substring += " AND ";
        if (
          (hasOperators &&
            (this.subjects.length > 1 || this.filters.length > 0)) ||
          subjectsToIterate > 1
        )
          substring += "(";
        for (j = 0; j < subjectsToIterate; j++) {
          scope = this.subjects[i][j].scope;
          if (j > 0) substring += " OR ";
          tmp = this.subjects[i][j].searchStrings[scope][0];
          if (
            (tmp.indexOf("AND") >= 0 ||
              tmp.indexOf("NOT") >= 0 ||
              tmp.indexOf("OR") >= 0) &&
            subjectsToIterate > 1
          )
            substring += "(";
          substring += this.subjects[i][j].searchStrings[scope].join(" OR ");
          if (
            (tmp.indexOf("AND") >= 0 ||
              tmp.indexOf("NOT") >= 0 ||
              tmp.indexOf("OR") >= 0) &&
            subjectsToIterate > 1
          )
            substring += ")";
        }
        if (
          (hasOperators &&
            (this.subjects.length > 1 || this.filters.length > 0)) ||
          subjectsToIterate > 1
        )
          substring += ")";
        //console.log("SUBSTRING: " + substring);
        if (
          substring != "()" &&
          substring != " AND ()" &&
          substring != " AND "
        ) {
          str += substring;
        }
      }

      const self = this;
      Object.keys(self.filterData).forEach(function (key) {
        substring = "";
        value = self.filterData[key];
        hasOperators = false;
        for (i = 0; i < value.length; i++) {
          scope = value[i].scope;
          //console.log(value[i].searchStrings[scope]);
          if (
            value[i].searchStrings[scope][0].indexOf("AND") >= 0 ||
            value[i].searchStrings[scope][0].indexOf("NOT") >= 0 ||
            value[i].searchStrings[scope][0].indexOf("OR") >= 0
          ) {
            hasOperators = true;
            break;
          }
        }
        substring += " AND ";
        if (hasOperators || value.length > 1) substring += "(";
        for (i = 0; i < value.length; i++) {
          const val = value[i];
          if (i > 0) substring += " OR ";
          scope = val.scope;
          if (
            (value[i].searchStrings[scope][0].indexOf("AND") >= 0 ||
              value[i].searchStrings[scope][0].indexOf("NOT") >= 0 ||
              value[i].searchStrings[scope][0].indexOf("OR") >= 0) &&
            value.length > 1
          )
            substring += "(";
          substring += val.searchStrings[scope].join(" OR ");
          if (
            (value[i].searchStrings[scope][0].indexOf("AND") >= 0 ||
              value[i].searchStrings[scope][0].indexOf("NOT") >= 0 ||
              value[i].searchStrings[scope][0].indexOf("OR") >= 0) &&
            value.length > 1
          )
            substring += ")";
        }
        if (hasOperators || value.length > 1) substring += ")";

        if (
          substring != "()" &&
          substring != " AND ()" &&
          substring != " AND "
        ) {
          str += substring;
        }
      });
      return str;
    },
    getPageSize: function () {
      return this.pageSize;
    },
    getLow: function () {
      return this.pageSize * this.page;
    },
    getHigh: function () {
      return Math.min(this.pageSize * this.page + this.pageSize, this.count);
    },
    alwaysShowFilter: function () {
      return Vue.prototype.$alwaysShowFilter;
    },
    //20210216: Ole kan ikke få dette til at virke - har i stedet tilføjet ekstra div i linje 1707 (good fucking luck finding that line lol)
    searchHeaderShown: function () {
      if (this.isCollapsed) return this.getString("searchHeaderHidden");
      return this.getString("searchHeaderShown");
    },
    calcOrOperator: function () {
      return this.getString("orOperator");
    },
    calcAndOperator: function () {
      return this.getString("andOperator");
    },
    getComponentId: function () {
      return "MainWrapper_" + this.componentNo.toString();
    },
  },
  template: /*html*/ `
  <div> 
    <div :id="getComponentId">
      <div class="qpm_searchform"> 
        <div v-if="!isCollapsed" class="qpm_tabs"> 
          <p tabindex="0" v-if="!advanced" class="qpm_tab" 
            @click="advancedClick()" 
            @keyup.enter="advancedClick()"
            v-tooltip="{content: getString(\'hoverAdvancedText\'), offset: 5, delay:$helpTextDelay}">{{getString(\'advancedSearch\')}}
            <span class="qpm_hideonmobile">
              {{getString(\'searchMode\')}}
            </span>
          </p> 

          <p v-if="advanced" class="qpm_tab qpm_tab_active">{{getString(\'advancedSearch\')}} 
            <span class="qpm_hideonmobile">
              {{getString(\'searchMode\')}}
            </span>
          </p> \

          <p tabindex="0" v-if="advanced" class="qpm_tab" 
            @click="advancedClick()" 
            @keyup.enter="advancedClick()"
            v-tooltip="{content: getString(\'hoverBasicText\'), offset: 5, delay:$helpTextDelay}">{{getString(\'simpleSearch\')}}  
            <span class="qpm_hideonmobile">
              {{getString(\'searchMode\')}}
            </span>
          </p> 

          <p v-if="!advanced" class="qpm_tab qpm_tab_active">{{getString(\'simpleSearch\')}} 
            <span class="qpm_hideonmobile">
              {{getString(\'searchMode\')}}
            </span>
          </p> 
        </div> 
        <div class="qpm_top"> 
          <div class="qpm_spaceEvenly qpm_headerText"> 
          <div v-show="!isCollapsed" role="heading" aria-level="2" class="h3" style="margin-top: 5px">{{getString(\'searchHeaderShown\')}}</div> \
          <div v-show="isCollapsed" role="heading" aria-level="2" class="h3" style="margin-top: 5px">{{getString(\'searchHeaderHidden\')}}</div> \
          
          <div v-show="subjects != \'\'" @click="toggleCollapsedController()" class="qpm_toggleSearchForm"> 
            <div v-show="!isCollapsed" class="qpm_toggleSearchFormBtn bx bx-hide"
              v-tooltip="{content: getString(\'hideForm\'), offset: 5, delay:$helpTextDelay}">
            </div> 
            <div v-show="isCollapsed" class="qpm_toggleSearchFormBtn bx bx-show"
              v-tooltip="{content: getString(\'showForm\'), offset: 5, delay:$helpTextDelay}">
            </div> 
          </div> 
        </div> 

        <div v-show="!isCollapsed && appSettings.openAi.useAi" class="qpm_switch_wrap qpm_ai_hide"> 
          <label class="qpm_switch"> 
            <input type="checkbox" title="titleSearchWithAI" v-model="searchWithAI"> 
            <span class="qpm_slider qpm_round"></span> 
          </label> 
          <span v-if="searchWithAI" class="qpm_simpleFiltersHeader">{{getString(\'searchToggleWithAI\')}} 
            <button class="bx bx-info-circle" 
              style="cursor: help" 
              v-tooltip="{content: getString(\'hoversearchToggleWithAI\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
            </button> 
          </span> 
          <span v-else class="qpm_simpleFiltersHeader">{{getString(\'searchToggleWithoutAI\')}} \
            <button class="bx bx-info-circle" style="cursor: help" 
              v-tooltip="{content: getString(\'hoversearchToggleWithoutAI\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
            </button> 
          </span> 
        </div> 

      <div class="qpm_searchFormula" v-show="!isCollapsed"> 
        <div class="qpm_subjects" v-for="(item, n) in subjects" v-bind:key="n"> 
          <div class="qpm_flex"> 
            <DropDownWrapper  
              :isMultiple="true"  
              :data="subjectOptions"  
              :hideTopics="hideTopics" 
              :isGroup="true"  
              :placeholder=dropdownPlaceholders[n] 
              :operator=calcOrOperator 
              :taggable=true 
              :selected=item 
              :closeOnInput=false 
              :language="language" 
              :searchWithAI=searchWithAI
              :showScopeLabel=advanced 
              :noResultString="getString(\'noTopicDropdownContent\')" 
              v-on:input="updateSubjects" 
              v-on:updateScope=updateScope 
              :index=n 
              @mounted="shouldFocusNextDropdownOnMount" 
              v-on:translating=updatePlaceholder 
              ref="subjectDropdown"> 
            </DropDownWrapper> 
            <i v-if="subjects.length > 1" 
              @click="removeSubject(n)" 
              class="qpm_removeSubject bx bx-x">
            </i>
          </div> 
          <p class="qpm_subjectOperator" v-if="n >= 0 && !noSubjects" 
            :style="n < subjects.length - 1 ? \'color: #000000\' : \'color: darkgrey\'">
            {{getString(\'andOperator\')}}
          </p> 
        </div> 
        <div v-if="!noSubjects" style="margin: 5px 0 20px 0" 
          @keydown.enter.capture.passive="focusNextDropdownOnMount = true"> 
          <button v-tooltip="{content: getString(\'hoverAddSubject\'), offset: 5, delay:$helpTextDelay}" 
            class="qpm_slim multiselect__input" style=" width: 120px; padding: 4px 12px 4px 11px !important; height: 38px" 
            @click="addSubject">{{getString(\'addsubjectlimit\')}} {{getString(\'addsubject\')}}
          </button> 
        </div> 
        <div style="margin-bottom: 15px" v-if="(advanced) && !showFilter && !noSubjects"> 
          <button v-tooltip="{content: getString(\'hoverLimitButton\'), offset: 5, delay:$helpTextDelay}" 
            class="qpm_slim multiselect__input" style="padding: 4px 12px 4px 11px !important; height: 38px"
            @click="toggle" 
            type="button" 
            :class="{qpm_shown : showFilter}" >{{getString(\'addsubjectlimit\')}} {{getString(\'addlimit\')}}
          </button> 
        </div> 

        <div style="margin-bottom:10px" v-if="(advanced) && showFilter && !noSubjects"> 
          <h4 role="heading" aria-level="3" class="h4">
            {{getString(\'AdvancedFiltersHeader\')}}
          </h4> 
          <div id="qpm_topofsearchbar" class="qpm_flex"> 
            <DropDownWrapper  
              :class="{qpm_shown : !showFilter}"
              :isMultiple="true" 
              :data="filterOptions" 
              :hideTopics="hideTopics" 
              :isGroup="false"  
              :placeholder="showTitle" 
              :operator=calcAndOperator 
              :closeOnInput="false" 
              :language="language" 
              :taggable=false 
              :selected=filters 
              :searchWithAI="searchWithAI" 
              :showScopeLabel=advanced 
              :noResultString="getString(\'noLimitDropdownContent\')" 
              :index=0 
              @input=updateFilters 
              qpm_buttonColor2="qpm_buttonColor7" 
              ref="filterDropdown"> 
            </DropDownWrapper> 
          </div> 
          <div class="qpm_flex"> 
            <div class="qpm_filters" :class="{qpm_shown : filters.length == 0}"> 
              <FilterEntry v-for="(selected,id,n) in filterData" 
                v-bind:key="id" :language="language" 
                :filterItem=getFilters(id) 
                :idx=id 
                :hideTopics="hideTopics" 
                :selected=selected 
                @input=updateFilterAdvanced 
                @updateScope=updateScopeFilter> 
              </FilterEntry>  
            </div> 
          </div> 
        </div> 

        <div v-else-if="(!advanced) && !noSubjects"> 
          <h4 role="heading" aria-level="3" class="h4">
            {{getString(\'SimpleFiltersHeader\')}}
          </h4> 
          <div id="qpm_topofsearchbar" class="qpm_simpleFiltersContainer"> 
          <template v-for="option in filterOptions" class="qpm_simpleFilters"> 
            <template v-if="hasVisibleSimpleFilterOption(option.choices)"> 
              <b class="qpm_simpleFiltersHeader">
                {{customNameLabel(option)}}:
              </b>
              <div v-for="(choice, index) in option.choices" v-if="choice.simpleSearch" 
                class="qpm_simpleFilters" :id="\'qpm_topic_\' + choice.name"> 
                <input type="checkbox" title="titleCheckBoxTranslate" 
                  :id="choice.name" 
                  :value="choice.name" 
                  :checked="isFilterUsed(filterData[option.id], choice.name)" 
                  @change="updateFilterSimple(option.id, choice)" 
                  @keyup.enter="updateFilterSimpleOnEnter(choice)" 
                  style="cursor:pointer;"> 
                <label :for="choice.name">
                  {{customNameLabel(choice)}}
                </label> 
                <button class="bx bx-info-circle" style="cursor: help" 
                  v-if="getSimpleTooltip(choice)" 
                  v-tooltip="{content: getSimpleTooltip(choice), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
                </button> 
              </div> 
              <div class="qpm_simpleFiltersSpacer">
              </div> 
            </template> 
          </template> 
        </div> 
      </div> 
    </div> 
    </div> 

    <div id="qpm_topofsearch" class="qpm_flex">
      <WordedSearchString 
        :subjects=subjects 
        :filters=filterData 
        :searchstring=getSearchString 
        :isCollapsed=isCollapsed 
        :details=details 
        :advancedString=advancedString 
        :advancedSearch=advanced 
        :showHeader=!isCollapsed 
        :language="language" 
        @toggleDetailsBox=toggleDetailsBox 
        @toggleAdvancedString=toggleAdvancedString > 
      </WordedSearchString> 
    </div>

    <div class="qpm_flex qpm_bottom" v-show="subjects != \'\' && !isCollapsed" style="justify-content: space-between"> 
      <div style="position: relative"> 
        <button v-tooltip="{content: getString(\'hoverResetButton\'), offset: 5, delay:$helpTextDelay}" 
          class="qpm_button" @click="clear"> 
          <i class="bx bx-reset" style="vertical-align: baseline"></i> 
          {{getString(\'reset\')}}
        </button> 

        <button v-tooltip="{content: getString(\'hoverShareButton\'), offset: 5, delay:$helpTextDelay}" 
          class="qpm_button" @click="copyUrl">
          <i class="bx bx-link" style="margin-right:5px; vertical-align: baseline"></i> 
          {{getString(\'getUrl\')}}
        </button> 
      </div>

      <button v-tooltip="{content: getString(\'hoverSearchButton\'), offset: 5, delay:$helpTextDelay}" 
        :disabled="searchLoading" :class="{qpm_disabled: searchLoading}" 
        class="qpm_button qpm_search" @click="searchsetLowStart">
        <i class="bx bx-search bx-flip-horizontal" style="position: relative; bottom: 1px"></i> 
          {{getString(\'search\')}}
      </button> 
    </div> 
    </div> 
    <SearchResult 
      :language="language" 
      :total=count 
      :sort=sort 
      :results=searchresult 
      :loading=searchLoading 
      :pagesize=getPageSize 
      :low=getLow 
      :high=getHigh 
      @newPageSize=setPageSize 
      @newSortMethod=newSortMethod 
      @high=nextPage 
      @low=previousPage 
      @change:selectedEntries=updatePreselectedPmidai 
      :preselectedEntries=preselectedEntries 
      :error=searchError > 
    </SearchResult> \
    </div> \
  </div> \
  `,
});

Vue.component("WordedSearchString", {
  mixins: [appSettings],
  props: {
    subjects: Array,
    filters: Object,
    searchstring: String,
    isCollapsed: Boolean,
    details: Boolean,
    advancedString: Boolean,
    advancedSearch: Boolean,
    showHeader: Boolean,
    language: {
      type: String,
      default: "dk",
    },
  },
  methods: {
    toggleAdvanced: function () {
      this.$emit("toggleAdvancedString");
    },
    toggleDetails: function () {
      //added by Ole
      this.$emit("toggleDetailsBox"); //added by Ole
    }, //added by Ole
    getScope: function (obj) {
      if (!this.advancedSearch || this.isSingleScoped(obj)) {
        return "";
      }

      if (obj.scope == "broad") {
        return "(" + this.getString("broad") + ")";
      } else if (obj.scope == "narrow") {
        return "(" + this.getString("narrow") + ")";
      } else {
        return "(" + this.getString("normal") + ")";
      }
    },
    getString: function (string) {
      //console.log(string);
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    getWordedSubjectString: function (string) {
      try {
        if (string.id) {
          lg = this.language;
          constant = string.translations[lg];
        }
        if (string.translations && string.translations[lg]) {
          constant = string.translations[lg];
        } else if (string.isTranslated && string.preTranslation) {
          constant =
            string.preTranslation +
            " (" +
            this.getString("manualInputTermTranslated") +
            ": " +
            string.name +
            ")";
        } else {
          constant = string.name;
        }
        return constant;
      } catch (e) {
        console.log(string, e);
        return string.translations["dk"];
      }
    },
    getWordedFilterString: function (filter) {
      try {
        if (filter.translations) {
          lg = this.language;
          constant = filter.translations[lg];
        } else if (filter.id) {
          constant = this.getWordedFilterStringById(filter.id);
        } else if (typeof filter === "string" || filter instanceof String) {
          constant = this.getWordedFilterStringById(filter);
        } else {
          constant = filter.name;
        }
        return constant;
      } catch (e) {
        console.error(filter, e);
        return filter;
      }
    },
    getWordedFilterStringById: function (id) {
      type = id.substr(0, 1).toLowerCase();
      groupId = id.substr(0, 3);
      lg = this.language;

      byId = function (e) {
        return e.id === id;
      };

      byGroupId = function (e) {
        return e.id === groupId;
      };

      if (type === "o") {
        return order.find(byId).translations[lg];
      } else if (type === "s") {
        group = topics.find(byGroupId);
        if (id.length === 3) {
          return group.translations[lg];
        } else {
          topic = group.groups.find(byId);
          return topic.translations[lg];
        }
      } else if (type === "l") {
        group = filtrer.find(byGroupId);
        if (id.length === 3) {
          return group.translations[lg];
        } else {
          topic = group.choices.find(byId);
          return topic.translations[lg];
        }
      } else {
        throw new Error("Id not handled by getWordedFilterStringById. id:", id);
      }
    },
    isSingleScoped: function (obj) {
      if (!obj.searchStrings) return;

      var count = 0;
      if (obj.searchStrings["broad"]) {
        count++;
      }
      if (obj.searchStrings["narrow"]) {
        count++;
      }
      if (obj.searchStrings["normal"]) {
        count++;
      }

      return count === 1;
    },
    copyTextfieldFunction: function () {
      var textarea = this.$refs.searchStringTextarea;
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      document.execCommand("copy");
    },
  },
  computed: {
    filterIsEmpty: function () {
      const self = this;
      if (this.filters) {
        count = 0;
        Object.keys(this.filters).forEach(function (key) {
          count += self.filters[key].length;
        });
        return count === 0;
      }
      return true;
    },
    getPubMedLink: function () {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        "&term=" +
        encodeURIComponent(this.searchstring)
      );
    },
    getPubMedLinkCreateAlert: function () {
      return (
        "https://account.ncbi.nlm.nih.gov/?back_url=" +
        encodeURIComponent(
          "https://pubmed.ncbi.nlm.nih.gov/?" +
            //					"myncbishare=" +
            //					this.appSettings.nlm.myncbishare +
            "&term="
        ) +
        encodeURIComponent(this.searchstring) +
        encodeURIComponent("#open-saved-search-panel")
      );
    },
    getSearchPreString: function () {
      count = 0;
      for (i = 0; i < this.subjects.length; i++) {
        count += this.subjects[i].length;
      }
      if (count > 1) {
        return this.getString("searchPreStringPlural");
      } else {
        return this.getString("searchPreStringSingular");
      }
    },
    checkFirstSubjectRender: function () {
      for (i = 0; i < this.subjects.length; i++) {
        try {
          if (this.subjects[i].length > 0) return i;
        } catch (error) {
          continue;
        }
      }
    },
    checkFirstFilterRender: function () {
      var filter = Object.keys(this.filters);
      for (i = 0; i < filter.length; i++) {
        try {
          if (this.filters[filter[i]][0].name) return i;
        } catch (error) {
          continue;
        }
      }
    },
  },
  template: /*html*/ `
    <div class="qpm_wordedSearchString" v-if="(!details || details)"> \
      <div v-if="!isCollapsed" class="qpm_toggleDetails"> \
        <p v-if="(subjects != \'\')" \
         tabindex="0" \
         v-tooltip="{content: details && getString(\'hoverDetailsText\'), offset: 5, delay:$helpTextDelay}" \
         data-html="true" \
         class="qpm_advancedSearch" \
         style="float: none" \
         @click="toggleDetails" \
         @keyup.enter="toggleDetails"> \
          <a v-if="details">{{getString(\'showDetails\')}}</a> \
          <a v-else>{{getString(\'hideDetails\')}}</a> \
        </p> \
      </div> \
    <div v-if="(subjects != \'\') && (!details || isCollapsed)" class="qpm_middle"> \
      <p v-if="!advancedString" tabindex="0" v-tooltip="{content: getString(\'hoverShowSearchStringText\'), offset: 5, delay:$helpTextDelay}" class="qpm_advancedSearch" style="margin: -5px 0 5px 30px" @click="toggleAdvanced" @keyup.enter="toggleAdvanced"><a>{{getString(\'showSearchString\')}}</a></p> \
      <p v-else tabindex="0" v-tooltip="{content: getString(\'hoverShowPrettyStringText\'), offset: 5, delay:$helpTextDelay}" class="qpm_advancedSearch" style="margin: -5px 0 5px 30px" @click="toggleAdvanced" @keyup.enter="toggleAdvanced"><a>{{getString(\'hideSearchString\')}}</a></p> \
      <div v-if="showHeader" role="heading" aria-level="2" class="h3" style="display: inline-block">{{getString(\'youAreSearchingFor\')}}</div> \
      <div v-if="!advancedString"> \
        <span>{{getSearchPreString}}</span>\
        <div class="qpm_searchStringSubjectGroup" v-if="group.length > 0" v-for="(group, idx) in subjects"> \
          <span v-if="idx > 0 && group.length != 0 && idx != checkFirstSubjectRender" class="qpm_searchStringGroupOperator">{{getString(\'youAreSearchingForAnd\')}}</span> \
          <div v-if="Object.keys(group).length != 0" class="qpm_searchStringWordGroup"> \
            <div v-for="(subjectObj, idx2) in group" class="qpm_searchStringWordGroupWrapper"> \
              <span class="qpm_wordedStringSubject">{{ getWordedSubjectString(subjectObj) }}</span> <span class="qpm_wordedStringOperator" v-if="!subjectObj.preString">{{getScope(subjectObj)}}</span> \
              <span v-if="idx2 < group.length-1" class="qpm_searchStringOperator">{{getString(\'orOperator\').toLowerCase()}}</span> \
            </div> \
            <div v-if="group.length > 0" class="qpm_halfBorder"></div> \
          </div> \
        </div> \
        <br/><span v-if="!filterIsEmpty"><div class="qpm_hideonmobile" style="padding-top:10px"></div>{{getString(\'where\')}}</span> \
        <div v-if="value.length > 0" v-for="(value, name, idx) in filters" class="qpm_searchStringFilterGroup"> \
          <span v-if="idx > 0" class="qpm_searchStringGroupOperator">{{getString(\'andOperator\').toLowerCase()}}</span> \
          <span class="qpm_searchStringGroupWhere">{{getWordedFilterString(name)}} {{getString(\'is\')}} </span> \
          <div v-if="value.length != 0" class="qpm_searchStringWordGroup"> \
            <div v-for="(filterObj, idx2) in value" class="qpm_searchStringWordGroupWrapper" > \
              <span class="qpm_wordedStringSubject">{{ getWordedFilterString(filterObj) }}</span> <span class="qpm_wordedStringOperator"> {{getScope(filterObj)}}</span> \
              <span v-if="idx2 < value.length-1" class="qpm_searchStringOperator">{{getString(\'orOperator\').toLowerCase()}} </span>\
            </div> \
            <div class="qpm_halfBorder"></div> \
          </div> \
        </div> \
      </div>\
      <div v-else>\
        <textarea ref="searchStringTextarea" style="width:100%; resize: vertical; line-height: 1.6em; border: solid 1px #e7e7e7; padding: 10px; margin-bottom: 4px" @keyup.enter="copyTextfieldFunction()" onclick="this.select();this.setSelectionRange(0,99999);document.execCommand(\'copy\')" v-tooltip.bottom="{ content: getString(\'hoverSearchString\'), offset: 5, delay:$helpTextDelay}" readonly  name="searchstring" v-model="searchstring" rows="6"> </textarea> \
      </div>\
      <div v-if="!isCollapsed || (isCollapsed && advancedString)"> \
      <div v-if="!advancedString" style="border-top: solid 1px #e7e7e7; margin: 15px 0"></div> \
          <p class="intext-arrow-link onHoverJS qpm_pubmedLink"><a target="_blank" :href="getPubMedLink" v-tooltip="{content: getString(\'hoverShowPubMedLinkText\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{getString(\'showPubMedLink\')}}</a></p> \
          <p class="intext-arrow-link onHoverJS qpm_pubmedLink"><a target="_blank" :href="getPubMedLinkCreateAlert" v-tooltip="{content: getString(\'hoverShowPubMedLinkCreateAlertText\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{getString(\'createPubMedAlert\')}}</a></p>\
      </div> \
      </div> \
    </div> \
  `,
});

Vue.component("FilterEntry", {
  data: function () {
    return {
      dropdownWidth: 0,
    };
  },
  props: {
    filterItem: Object,
    idx: String,
    selected: Array,
    language: {
      type: String,
      default: "dk",
    },
    hideTopics: {
      type: Array,
      default: function () {
        return [];
      },
    },
  },
  mounted: function () {
    this.updateDropdownWidth();
    window.addEventListener("resize", this.updateDropdownWidth);
  },
  beforeDestroy: function () {
    window.removeEventListener("resize", this.updateDropdownWidth);
  },
  methods: {
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    customNameLabel: function (option) {
      if (!option.name && !option.groupname) return;
      if (option.id) {
        lg = this.language;
        constant =
          option.translations[lg] != undefined
            ? option.translations[lg]
            : option.translations["dk"];
      } else {
        constant = option.name;
      }
      return constant;
    },
    updateDropdownWidth: function () {
      var dropdown = this.$refs.dropdown.$refs.selectWrapper;
      if (!dropdown.innerHTML) return;
      this.dropdownWidth = parseInt(dropdown.offsetWidth);
    },
  },
  computed: {
    placeholderText: function () {
      if (this.filterItem.allowCustomInput) {
        var isMobileWidth = this.dropdownWidth < 520 && this.dropdownWidth != 0;
        var manualInputText = "manualInput";

        if (isMobileWidth) {
          manualInputText = manualInputText + "_mobile";
        }

        return (
          this.getString("select") +
          " " +
          this.customNameLabel(this.filterItem).toLowerCase() +
          (isMobileWidth ? "" : " ") +
          this.getString(manualInputText)
        );
      } else {
        return (
          this.getString("select") +
          " " +
          this.customNameLabel(this.filterItem).toLowerCase()
        );
      }
    },
    calcOrOperator: function () {
      return this.getString("orOperator");
    },
  },
  template: /*html*/ `
    \
    <div class="qpm_filterEntry" style="width: 110.7%;"> \
      <p>{{customNameLabel(filterItem)}}</p> \
      <DropDownWrapper  
        :isMultiple="true"  
        :data="filterItem.choices"  
        :hideTopics="hideTopics" 
        :isGroup="false"  
        :placeholder="placeholderText" 
        :operator=calcOrOperator 
        :taggable=filterItem.allowCustomInput 
        :selected=selected 
        :index=idx 
        :closeOnInput="false" 
        :language="language" 
        qpm_buttonColor1="qpm_buttonColor4" 
        qpm_buttonColor2="qpm_buttonColor5" 
        qpm_buttonColor3="qpm_buttonColor6" 
        v-on="$listeners" 
        ref="dropdown"> 
      </DropDownWrapper> 
    </div> \
    `,
});

Vue.component("DropdownTag", {
  data: function () {
    return {
      isEditMode: false,
      tag: JSON.parse(JSON.stringify(this.triple.option)),
    };
  },
  props: {
    triple: Object,
    customNameLabel: Function,
    updateTag: Function,
    operator: String,
    qpm_buttonColor1: {
      type: String,
      default: "qpm_buttonColor1",
    },
    qpm_buttonColor2: {
      type: String,
      default: "qpm_buttonColor2",
    },
    qpm_buttonColor3: {
      type: String,
      default: "qpm_buttonColor3",
    },
    language: {
      type: String,
      default: "dk",
    },
  },
  methods: {
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    startEdit: function () {
      if (!this.triple.option.isCustom || this.isEditMode) return;
      this.isEditMode = true;
      this.tag.preString = this.getString("manualInputTerm") + ": ";
      this.tag.isTranslated = false;
      this.tag.tooltip = customInputTagTooltip;

      var editInput = this.$refs.editInput;
      console.log("StartEDIT");
      // Due to multiselect automatically grabbing focus after this event
      // the focus grab has to be delayed to the next tick to hold on to it.
      this.$nextTick(function () {
        editInput.focus();
      });
    },
    endEdit: function (triggerEvent) {
      if (!this.triple.option.isCustom || !this.isEditMode) return;
      if (
        triggerEvent &&
        triggerEvent.type === "blur" &&
        triggerEvent.relatedTarget &&
        triggerEvent.relatedTarget.classList.contains("multiselect__tag-icon")
      ) {
        return;
      }

      this.isEditMode = false;

      var editInput = this.$refs.editInput;
      editInput.blur();

      if (!this.tag.name.trim()) return;
      this.updateTag(this.tag);
    },
    getTagColor: function (scope) {
      if (scope == "narrow") {
        return this.qpm_buttonColor1;
      }
      if (!scope || scope == "normal") {
        return this.qpm_buttonColor2;
      }
      if (scope == "broad") {
        return this.qpm_buttonColor3;
      }
    },
  },
  computed: {
    getCustomNameLabel: {
      get: function () {
        var label = this.customNameLabel(this.tag);

        if (label) {
          return label;
        } else {
          return " ";
        }
      },
      set: function (newName) {
        this.tag.name = newName;
        this.tag.searchStrings.normal = [newName];
      },
    },
    getTooltip: function () {
      var tooltip = null;
      if (this.tag.tooltip) {
        tooltip = this.tag.tooltip[this.language];
      }

      return tooltip;
    },
  },
  watch: {
    triple: function (newTriple, oldTriple) {
      this.tag = newTriple.option;
    },
  },
  template: /*html*/ `
    <div class="multiselect__tags-wrap" @mousedown.stop @focusin.capture.stop @focusout.capture.stop @focus.capture.stop> 
      <span class="multiselect__tag" v-tooltip="{content: getTooltip, offset: 5, delay:$helpTextDelay}" 
        :class="getTagColor(triple.option.scope)" 
        @click.stop="startEdit"> 
        <span v-if="triple.option.isCustom"> \
            <p> 
              <span class="qpm_prestring">{{triple.option.preString}}</span> \
              <template v-if="!isEditMode">{{getCustomNameLabel}}</template> \
            </p>\
            <input v-show="isEditMode" \
                type="text" \
                min-length="1" \
                v-model="getCustomNameLabel" \
                @keydown.left.stop \
                @keydown.right.stop \
                @focus.stop="" \
                @blur.stop="endEdit" \
                @keyup.enter.stop="endEdit" \
                ref="editInput"> \
            </input> \
        </span> \
        <span v-else>{{triple.option.preString}}{{getCustomNameLabel}}</span> \
        <i aria-hidden="true" tabindex="-1" class="multiselect__tag-icon" @click.stop="triple.remove(triple.option)"></i> \
      </span> \
      <span class="qpm_operator" >{{operator}}</span> \
    </div> \
    `,
});

//Skud ud til vedligeholdese Top down data management
Vue.component("DropDownWrapper", {
  mixins: [appSettings],
  components: {
    Multiselect: window.VueMultiselect.default,
  },
  data: function () {
    return {
      maintopicToggledMap: {},
      expandedOptionGroupName: "",
      tempList: [],
      focusedButtonIndex: -1,
      focusByHover: true,
      ignoreHover: false,
      isLoading: false,
    };
  },
  props: {
    isMultiple: Boolean,
    data: Array,
    isGroup: Boolean,
    placeholder: String,
    operator: String,
    taggable: Boolean,
    closeOnInput: Boolean,
    selected: Array,
    searchWithAI: Boolean,
    hideTopics: {
      type: Array,
      default: function () {
        return [];
      },
    },
    noResultString: String,
    qpm_buttonColor1: {
      type: String,
      default: "qpm_buttonColor1",
    },
    qpm_buttonColor2: {
      type: String,
      default: "qpm_buttonColor2",
    },
    qpm_buttonColor3: {
      type: String,
      default: "qpm_buttonColor3",
    },
    index: undefined, //sometimes a string, sometimes an integer. You gotta love javascript for this
    showScopeLabel: Boolean,
    language: {
      type: String,
      default: "dk",
    },
  },
  methods: {
    initialSetup: function () {
      const element = this.$refs.selectWrapper;

      // Click on anywhere on dropdown opens (fix for IE)
      const dropdown = element.getElementsByClassName("qpm_dropDownMenu")[0];
      dropdown.removeEventListener("mousedown", this.handleOpenMenuOnClick);
      dropdown.addEventListener("mousedown", this.handleOpenMenuOnClick);

      // Set placeholder to correct length
      const input = element.getElementsByClassName("multiselect__input")[0];
      input.addEventListener("input", this.handleInputEvent.bind(this));

      // Hide last operator (Changed by Ole on 20231210)
      const operators = element.getElementsByClassName("qpm_operator");
      Array.from(operators).forEach((operator, index) => {
        if (index === operators.length - 1) {
          operator.style.color = "darkgrey";
        } else {
          operator.style.color = "";
          operator.style.display = "inline-block";
        }
      });

      const headers = Array.from(
        element.getElementsByClassName("multiselect__element")
      );
      const self = this;

      headers.forEach((header) => {
        // Stop existing mousedown events
        header.removeEventListener("mousedown", self.handleStopEvent, true);
        header.addEventListener("mousedown", self.handleStopEvent, true);

        // Add click handler for category groups
        header.removeEventListener("click", self.handleCategoryGroupClick);
        header.addEventListener("click", self.handleCategoryGroupClick);
      });

      // Stop selecting group when pressing enter during search
      element.removeEventListener(
        "keypress",
        self.handleStopEnterOnGroups,
        true
      );
      element.addEventListener("keypress", self.handleStopEnterOnGroups, true);

      input.removeEventListener("keyup", self.handleSearchInput);
      input.addEventListener("keyup", self.handleSearchInput);
      if (!input.value) {
        // Hide what needs to be hidden only if groups and only if we are not currently doing a search
        this.showOrHideElements();
      }

      const labels = element.getElementsByClassName("multiselect__tag");
      Array.from(labels).forEach((label) => {
        label.removeEventListener("click", self.handleTagClick);
        label.addEventListener("click", self.handleTagClick);
      });
    },
    clearShownItems: function () {
      this.expandedOptionGroupName = "";
      this.updateExpandedGroupHighlighting();

      this.$refs.multiselect.pointer = 0; // Set highlight to first item to prevent exceptions.
      for (let key in this.maintopicToggledMap) {
        this.maintopicToggledMap[key] = false;
      }
    },
    input: function (value) {
      if (!value || value.length === 0) {
        this.clearShownItems();
        this.$emit("input", value, this.index);
        return;
      }
      // Klone det sidste element for at undgå at ændre det direkte i datakilden
      let elem = { ...value[value.length - 1] };
      let lg = this.language; // Bruger this.language til at få den aktuelle sprogkode

      if (elem.maintopic) {
        //toggle the maintopic
        this.maintopicToggledMap = {
          ...this.maintopicToggledMap,
          [elem.id]: !this.maintopicToggledMap[elem.id],
        };
        console.log("we tooglin maintopic");
        value.pop();
      }

      // Tjek kun for '-' i det aktuelle sprog
      if (
        !elem.isCustom &&
        elem.translations[lg] &&
        elem.translations[lg].startsWith("-")
      ) {
        // Ændre kun translations for det aktuelle sprog
        let updatedTranslations = { ...elem.translations };
        updatedTranslations[lg] = elem.translations[lg].slice(1);

        // Opdater elem med de nye translations, så ændringen kun påvirker det valgte sprog
        elem.translations = updatedTranslations;
        // Erstat det oprindelige element med den ændrede klon i værdi-arrayet
        value[value.length - 1] = elem;
      }
      this.$emit("input", value, this.index);
      if (!elem.maintopic) {
        this.$refs.multiselect.deactivate();
      }
    },
    close: function (value, id) {
      if (this.tempList.length > 0) return; //Check if any items have been clicked

      let input = this.$el.getElementsByClassName("multiselect__input")[0];

      this.setWidthToPlaceholderWidth(input);
    },
    open: function (id) {
      this.$refs.multiselect.pointer = -1; // Remove highlight of non hovered items
    },
    /**
     * Added for sanity, since we hide elements by adding qpm_shown
     */
    hideElement(element) {
      element.classList.add("qpm_shown");
    },
    /**
     * Added for sanity, since we show elements by removing qpm_shown
     */
    showElement(element) {
      element.classList.remove("qpm_shown");
    },
    /**
     * Resets the maintopicToggledMap.
     * Used to close all the options that are branches
     */
    resetMaintopicToggledMap() {
      for (let key in this.maintopicToggledMap) {
        this.maintopicToggledMap[key] = false;
      }
    },
    /**
     * Hides all items in the specified group.
     *
     * @param {string} groupName - The name of the group to hide.
     */
    hideItems(groupName) {
      if (!groupName) return;
      const itemsToRemove = document.querySelectorAll(
        `[data-name="${groupName}"]`
      );

      itemsToRemove.forEach((item) => {
        this.hideElement(item.parentNode.parentNode);
      });
    },
    /**
     * Adds or removes tag either by clicking on "x" or clicking already selected item in dropdown
     */
    showOrHideElements: function () {
      const element = this.$refs.selectWrapper;
      if (!this.isGroup) return;

      const entries = element.querySelectorAll("[data-name]");
      entries.forEach((entry) => {
        const groupName = entry.getAttribute("data-name");
        const parent = entry.parentNode.parentNode;

        const parentId = entry.getAttribute("parent-id");
        const grandParentId = entry.getAttribute("grand-parent-id");

        const shouldShow =
          this.expandedOptionGroupName !== groupName ||
          (parentId && !this.maintopicToggledMap[parentId]) ||
          (grandParentId && !this.maintopicToggledMap[grandParentId]);

        parent.classList.toggle("qpm_shown", shouldShow);
      });
    },
    /**
     * Updates visibility of options contained in an optiongroup.
     *
     * @param {Array} selectedOptionIds - The list of option IDs that are selected.
     * @param {Array} optionsInOptionGroup - The list of options in the group.
     */
    updateOptionGroupVisibility: function (
      selectedOptionIds,
      optionsInOptionGroup
    ) {
      console.log(
        `${optionsInOptionGroup.length} options in this option group: `
      );
      this.showOrHideElements();
      this.updateExpandedGroupHighlighting();

      // Sets to keep track of depths and parent IDs
      const selectedDepths = new Set(); // Contains the depth levels that have a selected option
      const parentIdsToShow = new Set();
      const grandParentIdsToShow = new Set();

      const optionsInGroupIds = new Set(
        optionsInOptionGroup.map((option) => option.id)
      );

      selectedOptionIds.forEach((id) => {
        // Check if the selected option is in the optiongroup
        const option = optionsInOptionGroup.find((option) => option.id === id);
        if (option) {
          selectedDepths.add(option.depth);
          if (option.parentId) {
            parentIdsToShow.add(option.parentId);
            // Expand the parent maintopic
            this.maintopicToggledMap[option.parentId] = true;
          }
          if (option.grandParentId) {
            // Expand the grandparent maintopic
            grandParentIdsToShow.add(option.grandParentId);
            this.maintopicToggledMap[option.grandParentId] = true;
          }
        }
      });

      this.showElementsByOptionIds(selectedOptionIds, optionsInGroupIds);
      this.showElementsByDepths(selectedDepths, optionsInGroupIds);
      this.showElementsByOptionIds(
        Array.from(parentIdsToShow),
        optionsInGroupIds
      );
      this.showElementsByOptionIds(
        Array.from(grandParentIdsToShow),
        optionsInGroupIds
      );
    },
    /**
     * Utility method to show elements by option IDs
     * @param {Array} optionIds - The list of option IDs to show.
     * @param {Set} optionsInGroupIds - The set of option IDs in the group.
     */
    showElementsByOptionIds: function (optionIds, optionsInGroupIds) {
      optionIds.forEach((id) => {
        if (optionsInGroupIds.has(id)) {
          const elements = document.querySelectorAll(`span[option-id="${id}"]`);
          elements.forEach((element) => {
            const liElement = element.closest("li.multiselect__element");
            if (liElement) {
              this.showElement(liElement);
            }
          });
        }
      });
    },
    /**
     * Utility method to show elements by option depth
     * @param {Array} depths - The list of depths to show.
     * @param {Set} optionsInGroupIds - The set of option IDs in the group.
     */
    showElementsByDepths: function (depths, optionsInGroupIds) {
      depths.forEach((depth) => {
        const depthElements = document.querySelectorAll(
          `span[option-depth="${depth}"]`
        );
        depthElements.forEach((element) => {
          const optionId = element.getAttribute("option-id");
          if (optionsInGroupIds.has(optionId)) {
            const liElement = element.closest("li.multiselect__element");
            if (liElement) {
              this.showElement(liElement);
            }
          }
        });
      });
    },
    /**
     * Utility method to get the options for a specific optiongroup
     * @param {String} groupName Name of the option--group
     * @returns list of options in the group
     */
    getOptionsFromOptionsGroupName: function (groupName) {
      const result = [];
      topics.forEach((topic) => {
        if (topic.groupname === groupName) {
          topic.groups.forEach((group) => {
            result.push({
              id: group.id,
              name: group.name,
              isBranch: group.maintopic || null,
              depth: group.subtopiclevel || 0, // is a base topic if 0
              parentId: group.maintopicIdLevel1 || null,
              grandParentId: group.maintopicIdLevel2 || null,
            });
          });
        }
      });
      return result;
    },
    /**
     * Handles the event when clicking the optiongroup/category
     * Updates the visibility of expanded optiongroup and selected options, using updateOptionGroupVisibility
     * @param {HTMLElement} target - The target element.
     */
    handleCategoryGroupClick(event) {
      let target = event.target;

      // Check if the click is on the optiongroup name or elsewhere within the multiselect__option__option--group element
      if (target.classList.contains("qpm_groupLabel")) {
        target = target.parentElement;
      }

      const optionGroupName =
        target.getElementsByClassName("qpm_groupLabel")[0].textContent;

      if (target.classList.contains("multiselect__option--group")) {
        if (this.expandedOptionGroupName === optionGroupName) {
          console.log("Collapsing: ", this.expandedOptionGroupName);
          this.hideItems(this.expandedOptionGroupName);
          this.expandedOptionGroupName = "";
          this.updateExpandedGroupHighlighting();
          this.resetMaintopicToggledMap();
        } else {
          this.expandedOptionGroupName = optionGroupName;
          console.log("Expanding: ", this.expandedOptionGroupName);

          const optionGroupId = this.getOptionGroupId(optionGroupName);
          const selectedOptions =
            this.getSelectedOptionsByOptionGroupId(optionGroupId);

          const selectedOptionIds = selectedOptions.map((o) => o.id);
          const optionsInOptionGroup =
            this.getOptionsFromOptionsGroupName(optionGroupName);

          console.log(
            `${selectedOptions.length} options selected in ${optionGroupName}: `
          );

          if (selectedOptionIds.length <= 0) {
            this.showOrHideElements();
            this.updateExpandedGroupHighlighting();
          } else {
            // Only show the tags in the clicked group
            this.updateOptionGroupVisibility(
              selectedOptionIds,
              optionsInOptionGroup
            );
          }
        }
      } else {
        // This is when we are adding a new tag
        console.log("New tag added");
      }
    },
    /**
     * Handles the click event on a tag (an option that has been selected),
     * Updates the visibility of expanded optiongroup and selected options, using updateOptionGroupVisibility
     *
     * @param {Event} event - The click event.
     */
    handleTagClick: function (event) {
      const target = event.target;
      const targetLabel = target.textContent.trim();

      const optionGroupName = this.getOptionGroupName(
        this.data,
        targetLabel,
        this.language
      );

      const optionGroupId = this.getOptionGroupId(optionGroupName);
      const selectedOptions =
        this.getSelectedOptionsByOptionGroupId(optionGroupId);

      const selectedOptionIds = selectedOptions.map((o) => o.id);
      const optionsInOptionGroup =
        this.getOptionsFromOptionsGroupName(optionGroupName);

      console.log(
        `${selectedOptions.length} options selected in ${optionGroupName}: `
      );

      if (selectedOptionIds.length <= 0) {
        this.showOrHideElements();
        this.updateExpandedGroupHighlighting();
      } else {
        // Only show the tags in the clicked group
        this.updateOptionGroupVisibility(
          selectedOptionIds,
          optionsInOptionGroup
        );
      }
    },
    handleSearchInput: function (event) {
      if (!this.isGroup) return;
      const target = event.target;
      const element = this.$refs.selectWrapper;

      if (target.value) {
        //search input, save current state of shown element, and show all elements
        const entries = element.querySelectorAll(
          ".multiselect__element.qpm_shown"
        );
        for (i = 0; i < entries.length; i++) {
          this.showElement(entries[i]);
        }
      } else {
        //restore current state of shown elements
        this.showOrHideElements();
        this.initialSetup();
      }

      target.removeEventListener("blur", this.handleOnBlur);
      target.addEventListener("blur", this.handleOnBlur);
    },
    /**
     * Adjusts the input field's width based on its value length.
     *
     * @param {Event} event - The input event object.
     */
    handleInputEvent: function (event) {
      const newWidth = `${event.target.value.length + 1}ch`;
      event.target.style.setProperty("width", newWidth, "important");
    },
    handleStopEnterOnGroups: function (event) {
      if (this.$refs.multiselect.pointer < 0) {
        // If there is no hovered element then highlight the first on as with old behavior
        this.$refs.multiselect.pointer = 0;
      }
      if (event.charCode == 13) {
        if (event.target.classList.contains("multiselect__input")) {
          const element = this.$refs.selectWrapper;
          target = element.getElementsByClassName(
            "multiselect__option--highlight"
          )[0];
          if (
            target == null ||
            target.classList.contains("multiselect__option--group")
          ) {
            event.stopPropagation();

            if (target == null) return;

            var focusedGroup =
              target.querySelector(".qpm_groupLabel").textContent;

            if (focusedGroup == this.expandedOptionGroupName) {
              this.expandedOptionGroupName = "";
            } else {
              this.expandedOptionGroupName = focusedGroup;
            }
          } else if (!this.focusByHover && this.focusedButtonIndex >= 0) {
            var dropdownRef = this.$refs.multiselect;

            // Nothing currently in focus, and therefore nothing left to do.
            if (dropdownRef.pointer < 0) {
              event.stopPropagation();
              return;
            }

            // Find the button corresponding to the one in focus
            var target = dropdownRef.$refs.list.getElementsByClassName(
              "multiselect__option--highlight"
            )[0];
            var button = target.getElementsByClassName(
              "qpm_ButtonColumnFocused"
            )[0];

            // If no scope buttons exists or none are currently in focus
            // then let the default handeling occur via the input method.
            if (!button) return;

            event.stopPropagation();
            button.click();
          }
        }
      }
    },
    handleOpenMenuOnClick: function (event) {
      //FIX FOR IE!
      var tagText = event.target.textContent;

      if (
        tagText.startsWith(this.getString("manualInputTerm")) ||
        tagText.startsWith(this.getString("manualInputTermTranslated"))
      ) {
        this.expandedOptionGroupName = "";
        this.updateExpandedGroupHighlighting();
      }

      event.stopPropagation();
      this.$refs.multiselect.$refs.search.focus();
    },
    handleScopeButtonClick: function (item, state, event) {
      this.$emit("updateScope", item, state, this.index);
      item.scope = state;

      //close
      if (this.getShouldCloseOnInput) {
        this.$refs.multiselect.$refs.search.blur();
      }

      //Check if just added
      if (this.tempList.indexOf(item) >= 0) {
        event.stopPropagation();
        return;
      }
      //Check if added previously
      for (i = 0; i < this.selected.length; i++) {
        if (this.selected[i].name == item.name) {
          event.stopPropagation();
          return;
        }
      }
    },
    handleOnButtonMouseover: function (index, event) {
      // Prevent mouse from focusing new subject. Used for auto scroll.
      if (this.ignoreHover) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }

      this.focusedButtonIndex = index;
      this.focusByHover = true;
    },
    handleAddTag: async function (newTag) {
      var tag;
      if (this.searchWithAI) {
        this.isLoading = true;
        this.$emit("translating", true, this.index);

        // close the multiselect dropdown
        this.$refs.multiselect.deactivate();
        //setTimeout is to resolve the tag placeholder before starting to translate
        setTimeout(1);
        let translated = await this.translateSearch(newTag);
        tag = {
          name: translated,
          searchStrings: { normal: [translated] },
          preString: this.getString("manualInputTermTranslated") + ": ",
          isCustom: true,
          //IsTranslated er true når det er en unedited oversættelse
          isTranslated: true,
          preTranslation: newTag,
          tooltip: {
            dk:
              customInputTagTooltip.dk +
              " - denne søgning er oversat fra: " +
              newTag,
            en:
              customInputTagTooltip.en +
              " - this search is translated from: " +
              newTag,
          },
        };
        this.isLoading = false;
      } else {
        tag = {
          name: newTag,
          searchStrings: { normal: [newTag] },
          preString: this.getString("manualInputTerm") + ": ",
          isCustom: true,
          tooltip: customInputTagTooltip,
        };
      }
      this.$emit("translating", false, this.index);
      this.selected.push(tag);
      this.input(this.selected, -1);
      this.clearShownItems();
    },
    handleEditTag: function (tag) {
      console.log("editTag");
    },
    handleUpdateCustomTag: function (oldTag, newTag) {
      var tagIndex = this.selected.findIndex(function (e) {
        return oldTag == e;
      });
      this.selected.splice(tagIndex, 1, newTag);
      this.clearShownItems();
      this.input(this.selected, -1);
    },
    /**
     * Stops the propagation and default action of an event under certain conditions.
     *
     * The function checks if the event target has specific CSS classes and performs actions accordingly:
     * 1. If the target has the class "multiselect__option--group", it stops the event's propagation and prevents its default action.
     * 2. If the target has either the class "qpm_groupLabel" or "qpm_scopeLabel", it stops the event's propagation, prevents its default action, and triggers a click event on the target's parent node.
     *
     * @param {Event} event - The event object to be stopped.
     * @returns {boolean} Always returns false to indicate the event has been handled.
     */
    handleStopEvent: function (event) {
      // Click event was on the parent multiselect group
      if (event.target.classList.contains("multiselect__option--group")) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      // Click event was on the category name (left aligned)
      if (event.target.classList.contains("qpm_groupLabel")) {
        event.stopPropagation();
        event.preventDefault();
        return false;
      }
      // click event was on either of the scope labels (right aligned in advanced search)
      if (event.target.classList.contains("qpm_scopeLabel")) {
        event.stopPropagation();
        event.preventDefault();
        event.target.parentNode.click();
        return false;
      }
    },
    /**
     * Blur handler needed to force groups to close if search is aborted
     */
    handleOnBlur(event) {
      console.log("BLUR EVENT TRIGGERED");
      this.initialSetup();
    },
    scrollToFocusedSubject: function () {
      var subject = this.$refs.multiselect.$refs.list.querySelector(
        ".multiselect__option--highlight"
      );
      if (!subject) return;

      var isFocusVissible = this.isSubjectVissible(subject);
      if (!isFocusVissible) {
        this.ignoreHover = true;
        subject.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    },
    navDown: function () {
      var dropdownRef = this.$refs.multiselect;

      // Set focused column to normal if not set
      if (this.focusedButtonIndex < 0 || this.focusByHover) {
        this.focusedButtonIndex = 1; // index 1 is assumed to be the middle/default index
        this.focusByHover = false;
      }

      // No element selected, just select first
      if (dropdownRef.pointer < 0) {
        dropdownRef.pointer = 0;
        return;
      }

      var currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];

      var isGroup = currentSubject["$groupLabel"] != null;

      var isCurrentExpandedGroup = false;
      var subject;

      if (isGroup) {
        var label = this.customGroupLabelById(currentSubject.$groupLabel);
        subject = this.getSortedSubjectOptions.find(function (e) {
          return e.id === currentSubject.$groupLabel;
        });
        isCurrentExpandedGroup = label !== this.expandedOptionGroupName;
      } else {
        subject = currentSubject;
      }

      var navDistance;
      if (isGroup && isCurrentExpandedGroup) {
        var groupPropertyName = this.getGroupPropertyName(subject);
        navDistance = subject[groupPropertyName].length + 1;
      } else {
        navDistance = 1;
      }

      if (
        dropdownRef.pointer + navDistance >=
        dropdownRef.filteredOptions.length
      ) {
        return;
      }

      console.log(
        "currentPos: ",
        dropdownRef.pointer,
        ", navDistance: ",
        navDistance
      );
      dropdownRef.pointer += navDistance;

      // Scroll to see element if needed
      var self = this;
      this.$nextTick(function () {
        self.scrollToFocusedSubject();
      });
    },
    navUp: function () {
      console.log("navUp");
      var dropdownRef = this.$refs.multiselect;

      // Set focused column to normal if not set
      if (this.focusedButtonIndex < 0 || this.focusByHover) {
        this.focusedButtonIndex = 1; // index 1 is assumed to be the middle/default index
        this.focusByHover = false;
      }

      // End of list reached, do nothing
      if (dropdownRef.pointer <= 0) {
        dropdownRef.pointer = -1;
        dropdownRef.$el.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
        return;
      }

      var currentSubject = dropdownRef.filteredOptions[dropdownRef.pointer];

      var isGroup = currentSubject["$groupLabel"] != null;

      var navDistance = 1;

      if (isGroup) {
        var groupIndex = this.getSortedSubjectOptions.findIndex(function (e) {
          return e.id === currentSubject.$groupLabel;
        });

        if (groupIndex > 0) {
          var groupAbove = this.getSortedSubjectOptions[groupIndex - 1];
          var groupAboveLabel = this.customGroupLabel(groupAbove);

          if (groupAboveLabel !== this.expandedOptionGroupName) {
            var groupPropertyName = this.getGroupPropertyName(groupAbove);
            navDistance = groupAbove[groupPropertyName].length + 1;
          }
        }
      }

      console.log(
        "currentPos: ",
        dropdownRef.pointer,
        ", navDistance: ",
        -navDistance
      );
      dropdownRef.pointer -= navDistance;

      // Scroll to see element if needed
      var self = this;
      this.$nextTick(function () {
        self.scrollToFocusedSubject();
      });
    },
    navLeft: function (event) {
      if (!this.getShouldPreventLeftRightDefault()) return;

      this.focusByHover = false;
      this.focusedButtonIndex = Math.max(0, this.focusedButtonIndex - 1); // Stop navLeft at left most element
      event.preventDefault();
    },
    navRight: function (event) {
      if (!this.getShouldPreventLeftRightDefault()) return;

      this.focusByHover = false;
      this.focusedButtonIndex = Math.min(2, this.focusedButtonIndex + 1); // Stop navRight at right most element (currently assumed to be index 2)
      event.preventDefault();
    },
    isContainedInList: function (props) {
      if (props.option && props.option.name && this.selected) {
        for (i = 0; i < this.selected.length; i++) {
          if (this.selected[i].name == props.option.name) {
            return true;
          }
        }
      }
      return false;
    },
    isSelected: function (option) {
      return this.selected.some(
        (selectedOption) => selectedOption.id === option.id
      );
    },
    isHiddenTopic: function (topicId) {
      return this.hideTopics.indexOf(topicId) != -1;
    },
    isSubjectVissible: function (subject) {
      var subjectRect = subject.getBoundingClientRect();

      var viewHeight =
        window.innerHeight || document.documentElement.clientHeight;

      var isSubjectVissible =
        subjectRect.top >= 0 && subjectRect.bottom <= viewHeight;
      return isSubjectVissible;
    },
    updateExpandedGroupHighlighting: function () {
      var listItems = this.$refs.multiselect.$refs.list;

      // Remove highlighting due to group being open from all groups
      itemsToUnHighlight = listItems.querySelectorAll(".qpm_groupExpanded");

      for (var i = 0; i < itemsToUnHighlight.length; i++) {
        itemsToUnHighlight[i].classList.remove("qpm_groupExpanded");
      }

      if (this.expandedOptionGroupName == "") return;

      // Add highlighting due to group being open
      var expandedElement = listItems.querySelector(
        'li.multiselect__element span.multiselect__option--group span[group-name="' +
          this.expandedOptionGroupName +
          '"]'
      );
      expandedElement.parentElement.parentElement.classList.add(
        "qpm_groupExpanded"
      );
    },
    updateSortedSubjectOptions() {
      this.showOrHideElements();
    },
    /**
     * Handles changes to maintopicToggledMap by logging and updating sorted subject options.
     *
     * @param {Object} newVal - The new value of maintopicToggledMap.
     * @param {Object} oldVal - The previous value of maintopicToggledMap.
     */
    onMaintainTopicToggledMapChange(newVal, oldVal) {
      console.log("maintopicToggledMap changed:");

      Object.entries(newVal).forEach(([key, value]) => {
        if (key !== "__ob__") {
          // Exclude Vue's internal observer property
          console.log(`Key: ${key}, Value: ${value}`);
        }
      });

      this.updateSortedSubjectOptions();
    },
    /**
     * Determine if the buttons for the scopes (narrow, normal or broad) should be shown.
     *
     * @param {string} name - The name of the group.
     * @returns {boolean} True if the scope buttons should be shown, false otherwise.
     */
    showScope: function (name) {
      return !(this.expandedOptionGroupName === name);
    },
    /**
     * Translates the given words using the function endpoint for translation.
     *
     * @param {string} wordsToTranslate - The words that need to be translated.
     * @returns {Promise<string>} The translated text.
     */
    translateSearch: async function (wordsToTranslate) {
      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/TranslateTitle";
      var localePrompt = getPromptForLocale(searchTranslationPrompt, "dk");

      try {
        let answer = "";
        const response = await fetch(openAiServiceUrl, {
          method: "POST",
          body: JSON.stringify({
            prompt: localePrompt,
            title: wordsToTranslate,
            client: self.appSettings.client,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw Error(JSON.stringify(data));
        }

        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done || self.stopGeneration) {
            break;
          }
          answer += value;
        }

        return answer;
      } catch (error) {
        self.text = "An unknown error occurred: \n" + error.toString();
      }
    },
    /**
     * Get selected options for an optiongroup by optiongroup id.
     * @param {string} groupId - The ID of the option group.
     * @returns {Array} An array of options that belong to the specified option group.
     */
    getSelectedOptionsByOptionGroupId: function (groupId) {
      return this.selected.filter(
        (selectedOption) =>
          selectedOption.id && selectedOption.id.startsWith(groupId)
      );
    },
    /**
     * Gets the ID of an option group by its option group name.
     * (OptionGroups are the topics from qpm-content-diabetes.js)
     * @param {string} groupname - The name of the group.
     * @returns {string|null} The ID of the group if found, otherwise null.
     */
    getOptionGroupId: function (groupname) {
      for (const topic of topics) {
        if (topic.groupname === groupname) {
          return topic.id;
        }
      }
      return null;
    },
    /**
     * Gets the group name for a given item.
     *
     * @param {Object} item - The item to get the group name for.
     * @returns {string|null} The group name or null if not found.
     */
    getGroupName: function (item) {
      if (item.groups !== undefined) return "groups";
      if (item.choices !== undefined) return "choices";
      return null;
    },
    /**
     * Finds the name of the group that contains the target label.
     *
     * @param {Array} data - The data array to search through.
     * @param {string} targetLabel - The target label to find.
     * @param {string} language - The current language.
     * @returns {string} The name of the group containing the target label.
     */
    getOptionGroupName: function (data, targetLabel, language) {
      let name = "";
      data.some((category) => {
        const groupName = this.getGroupName(category);
        if (!groupName) return false;
        return category[groupName].some((tag) => {
          const currentLabel = this.cleanLabel(tag.translations[language]);
          if (currentLabel === targetLabel) {
            name = this.customNameLabel(category);
            this.expandedOptionGroupName = name;
            return true;
          }
          return false;
        });
      });
      return name;
    },
    getHeader: function (name) {
      for (i = 0; i < this.data.length; i++) {
        if (!this.data[i].groups) {
          //Not group
          return "single";
        }
        for (j = 0; j < this.data[i].groups.length; j++) {
          if (this.data[i].groups[j].name == name) {
            return this.customGroupLabel(this.data[i]);
          }
        }
      }
      return "unknown";
    },
    getOptionClassName: function (option) {
      // Return the 'cssClass' if it exists, otherwise return an empty string
      return option.cssClass ? `qpm_${option.cssClass}` : "";
    },
    getShouldPreventLeftRightDefault: function () {
      var dropdownRef = this.$refs.multiselect;
      var isWritingSearch = dropdownRef.search.length > 0;

      var hasFocusedSubject = isWritingSearch
        ? dropdownRef.pointer >= 1
        : dropdownRef.pointer >= 0;

      return hasFocusedSubject && !this.focusByHover;
    },
    getButtonColor: function (props, scope, index) {
      classes = [];
      if (scope == "narrow") {
        classes.push(this.qpm_buttonColor1);
      }
      if (!scope || scope == "normal") {
        classes.push(this.qpm_buttonColor2);
      }
      if (scope == "broad") {
        classes.push(this.qpm_buttonColor3);
      }

      // Set class to distinguish the collum currently in 'focus' for
      // selection via keyboard. This class together with the
      // multiselect__option--highlight class defines the highlighted button.
      if (!this.focusByHover && index === this.focusedButtonIndex) {
        classes.push("qpm_ButtonColumnFocused");
      }

      if (props.option && props.option.name && this.selected) {
        for (i = 0; i < this.selected.length; i++) {
          if (this.selected[i].name == props.option.name) {
            if (this.selected[i].scope == scope) classes.push("selectedButton");
            break;
          }
        }
      }
      return classes;
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    getGroupPropertyName: function (group) {
      if (group.groups != undefined) {
        return "groups";
      } else if (group.choices != undefined) {
        return "choices";
      }

      return null;
    },
    setWidthToPlaceholderWidth: function (input) {
      // Create a temporary span element and set its text to the placeholder text
      let tempSpan = document.createElement("span");
      tempSpan.innerHTML = input.getAttribute("placeholder");

      // Apply the same styles to the span as the input
      let inputStyle = window.getComputedStyle(input);
      tempSpan.style.fontFamily = inputStyle.fontFamily;
      tempSpan.style.fontSize = inputStyle.fontSize;
      tempSpan.style.fontWeight = inputStyle.fontWeight;
      tempSpan.style.letterSpacing = inputStyle.letterSpacing;
      tempSpan.style.whiteSpace = "nowrap"; // Ensure text stays on one line

      // Add the span to the body (it won't be visible)
      document.body.appendChild(tempSpan);

      // Get the width of the area
      let placeholderWidth = tempSpan.getBoundingClientRect().width + 27;

      // Remove the span from the body
      document.body.removeChild(tempSpan);

      input.style.width = placeholderWidth + "px";
    },
    customNameLabel: function (option) {
      if (!option.name && !option.groupname) return;
      if (option.translations) {
        lg = this.language;
        constant =
          option.translations[lg] != undefined
            ? option.translations[lg]
            : option.translations["dk"];
      } else {
        constant = option.name;
      }
      return constant;
    },
    customGroupLabel: function (option) {
      if (!option.translations) return;
      lg = this.language;
      constant = option.translations[lg];
      return constant != undefined ? constant : option.translations["dk"];
    },
    customGroupLabelById: function (id) {
      var data = this.getIdToDataMap[id];
      return this.customGroupLabel(data);
    },
    customGroupTooltipById: function (id) {
      const data = this.getIdToDataMap[id];
      const content = data.tooltip && data.tooltip[this.language];
      const tooltip = {
        content: content,
        offset: 5,
        delay: this.$helpTextDelay,
      };
      return tooltip;
    },
    /**
     * Cleans the label by removing leading special characters.
     *
     * @param {string} label - The label to clean.
     * @returns {string} The cleaned label.
     */
    cleanLabel: function (label) {
      return label.startsWith("⤷") ? label.slice(1).trim() : label.trim();
    },
  },
  computed: {
    getStateCopy: {
      get: function () {
        if (!this.selected) {
          return [];
        }
        return this.selected;
      },
      set: function (newValue) {
        //temp list because the this.selected is only updated after methods in this component is called
        this.tempList = newValue;
      },
    },
    getSelectGroupLabel: function () {
      return this.getString("selectGroupLabel");
    },
    getTagPlaceHolder: function () {
      return this.getString("tagplaceholder");
    },
    shownSubjects: function () {
      if (this.hideTopics == null || this.hideTopics.length === 0) {
        return this.data;
      }
      self = this;
      function isNotHidden(e) {
        return !self.isHiddenTopic(e.id);
      }

      shown = this.data.filter(isNotHidden).map(function (e) {
        copy = JSON.parse(JSON.stringify(e));
        if (copy.groups != undefined) {
          copy.groups = copy.groups.filter(isNotHidden);
        } else if (copy.choices != undefined) {
          copy.choices = copy.choices.filter(isNotHidden);
        }
        return copy;
      });

      return shown;
    },
    getSortedSubjectOptions: function () {
      self = this;
      lang = this.language;
      function sortByPriorityOrName(a, b) {
        if (a.ordering[lang] != null && b.ordering[lang] == null) {
          return -1; // a is ordered and b is not -> a first
        }
        if (b.ordering[lang] != null && a.ordering[lang] == null) {
          return 1; // b is ordered and a is not -> b first
        }

        if (a.ordering[lang] != null) {
          // We know both are non null due to earlier check
          aSort = a.ordering[lang];
          bSort = b.ordering[lang];
        } else {
          // Both are unordered
          aSort = self.customGroupLabel(a);
          bSort = self.customGroupLabel(b);
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

      data = JSON.parse(JSON.stringify(this.shownSubjects));

      for (i = 0; i < data.length; i++) {
        groupName = null;
        if (data[i]["groups"] != null) {
          groupName = "groups";
        } else if (data[i]["choices"] != null) {
          groupName = "choices";
        } else {
          continue;
        }

        data[i][groupName].sort(sortByPriorityOrName); // Sort categories in groups
      }

      return data;
    },
    getIdToDataMap: function () {
      var dataMap = {};
      for (let i = 0; i < this.data.length; i++) {
        const group = this.data[i];
        dataMap[group.id] = group;

        var groupName = this.getGroupPropertyName(group);
        for (let j = 0; j < group[groupName].length; j++) {
          const element = group[groupName][j];
          dataMap[element.id] = element;
        }
      }
      return dataMap;
    },
    getNoResultString: function () {
      return this.noResultString
        ? this.noResultString
        : this.getString("noDropdownContent");
    },
    getShouldCloseOnInput: function () {
      return this.closeOnInput && this.focusByHover;
    },
  },
  watch: {
    maintopicToggledMap: {
      handler: "onMaintainTopicToggledMapChange",
      deep: true,
    },
    expandedOptionGroupName(newVal, oldVal) {
      const fixedLength = 30; // Adjust this length as needed

      const formattedOldVal = (
        oldVal === "" ? "No option group expanded" : oldVal
      ).padEnd(fixedLength, " ");

      const formattedNewVal = (
        newVal === "" ? "No option group expanded" : newVal
      ).padEnd(fixedLength, "");

      console.log(`${formattedOldVal} ➡️ ${formattedNewVal}`);
    },
  },
  mounted: function () {
    this.initialSetup();

    if (Array.isArray(this.data)) {
      this.data.forEach((group) => {
        if (group.groups && Array.isArray(group.groups)) {
          group.groups.forEach((item) => {
            if (item.maintopic) {
              if (!this.maintopicToggledMap.hasOwnProperty(item.id)) {
                this.maintopicToggledMap[item.id] = false;
              }
            }
          });
        }
      });
    } else {
      console.warn("this.data is not an array or is undefined");
    }
    this.$emit("mounted", this);
  },
  updated: function (s) {
    this.initialSetup();
  },
  template: /*html*/ `
  <div class="qpm_dropdown" ref="selectWrapper" \
    keydown.up.capture.prevent.stop="navUp" \
    @keydown.down.capture.prevent.stop="navDown" \
    @keydown.left.stop="navLeft" \
    @keydown.right.stop="navRight" \
    @keyup.up.capture.prevent.stop \
    @keyup.down.capture.prevent.stop \
    @keyup.left.capture.prevent.stop \
    @keyup.right.capture.prevent.stop \
    @mouseenter.capture="handleOnButtonMouseover(-1, $event)" \
    @mousemove.capture.passive="ignoreHover = false" \ > 
    
    <multiselect class="qpm_dropDownMenu" ref="multiselect" v-model="getStateCopy"  \
      open-direction="bottom" \
      track-by="name" \
      label="name" \
      selectLabel="" \
      deselectLabel="" \
      selectedLabel="" \
      :options="getSortedSubjectOptions"  \
      :multiple="isMultiple"  \
      :group-select="true" \
      :group-values="isGroup ? \'groups\' : undefined"  \
      :group-label="isGroup ? \'id\' : undefined"  \
      :placeholder="placeholder"  \
      :block-keys="[]" \
      :close-on-select="false"  \
      :clear-on-select="false"  \
      :custom-label="customNameLabel" \
      :selectGroupLabel=getSelectGroupLabel \
      :deselectGroupLabel=getSelectGroupLabel \
      :tagPlaceholder=getTagPlaceHolder \
      :taggable=taggable \
	    :loading="isLoading" \
      :searchable="true" \
      @tag="handleAddTag" \
      @input="input" \
      @close="close" \
      @open="open"> \
      <template slot="tag" slot-scope="triple"> \
        <DropdownTag \
          :triple="triple" \
          :customNameLabel="customNameLabel" \
          :updateTag="function (newTag) { return handleUpdateCustomTag(triple.option, newTag); }" \
          :operator="operator" \
          :qpm_buttonColor1="qpm_buttonColor1" \
          :qpm_buttonColor2="qpm_buttonColor2" \
          :qpm_buttonColor3="qpm_buttonColor3" \
          :language="language" \
		      @edit="handleEditTag" > \
        </DropdownTag> 
      </template> 
      
      <template slot="option" slot-scope="props"> \
        <span v-if="!props.option.$groupLabel"
          :data-name="getHeader(props.option.name)" 
          :option-id="props.option.id"
          :option-depth="props.option.subtopiclevel || 0"
          :maintopic="props.option.maintopic"
          :parent-id="props.option.maintopicIdLevel1"
          :grand-parent-id="props.option.maintopicIdLevel2"
          :subtopiclevel="props.option.subtopiclevel" > 
        </span> 

        <span v-if="props.option.maintopic || (props.option.maintopic && (props.option.subtopiclevel !== null))" 
              v-bind:class="{ 
                qpm_maintopicDropdown: props.option.maintopic === true, 
                qpm_subtopicDropdown: props.option.subtopiclevel === 1 
              }">
          <i v-if="maintopicToggledMap[props.option.id]" class="bx bx-chevron-down"></i> \
          <i v-else class="bx bx-chevron-right"></i> \
	  	  </span> \

        <span v-if="!props.option.maintopic " \
              v-bind:class="{ 
                qpm_hidden: !isContainedInList(props), 
                qpm_shown: props.option.$groupLabel, 
                qpm_maintopicDropdown: props.option.maintopic === true, 
                qpm_subtopicDropdown: props.option.subtopiclevel === 1, 
                qpm_subtopicDropdownLevel2: props.option.subtopiclevel === 2, 
                [props.option.class]: props.option.class !== undefined 
              }"> \
          &#10003; \         
        </span> 

        <span class="qpm_groupLabel" :group-name="customGroupLabelById(props.option.$groupLabel)" v-if="props.option.$groupLabel">{{ customGroupLabelById(props.option.$groupLabel) }}</span> \
     
        <i class="bx bx-info-circle qpm_groupLabel" style="cursor: help; font-weight: 200; margin-left: 10px" v-if="props.option.$groupLabel && customGroupTooltipById(props.option.$groupLabel).content && customGroupTooltipById(props.option.$groupLabel).content.trim() !== \'\'" v-tooltip.right="customGroupTooltipById(props.option.$groupLabel)"/></i> \
      
        <span class="qpm_scopeLabel qpm_forceRight" v-if="props.option.$groupLabel && showScopeLabel" :class="{qpm_shown : showScope(props.option.$groupLabel)}">{{getString(\'scope\')}}</span> \
		   
        <span class="qpm_entryName">{{ customNameLabel(props.option) }} </span> \
		   
        <i class="bx bx-info-circle qpm_entryName" style="cursor: help; font-weight: 200; margin-left: -5px" v-if="props.option.tooltip && props.option.tooltip[language]" v-tooltip.right="{content: props.option.tooltip && props.option.tooltip[language], offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"/></i> \
       
        <span class="qpm_entryManual" v-if="props.option.isTag">{{getString(\'manualadd\')}}: {{ props.option.label }} </span> \
       
        <div class="qpm_dropdownButtons qpm_forceRight" v-if="!props.option.$groupLabel && props.option.buttons && !props.option.isTag && !props.option.maintopic"> \
          <button class="qpm_button" :class="getButtonColor(props, \'narrow\', 0)" tabindex="-1" 
            @click="handleScopeButtonClick(props.option, \'narrow\', $event)" 
            v-tooltip="{content: getString(\'tooltipNarrow\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
            {{getString(\'narrow\')}}
          </button>

          <button class="qpm_button" :class="getButtonColor(props, \'normal\', 1)" tabindex="-1" 
            @click="handleScopeButtonClick(props.option, \'normal\', $event)"
            v-tooltip="{content: getString(\'tooltipNormal\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
            {{getString(\'normal\')}}
          </button> 

          <button class="qpm_button" :class="getButtonColor(props, \'broad\', 2)" tabindex="-1" 
            @click="handleScopeButtonClick(props.option, \'broad\', $event)"
            v-tooltip="{content: getString(\'tooltipBroad\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
            {{getString(\'broad\')}}
          </button> 
        </div> 
      </template> 
 
      <span slot="noResult"> 
        {{getNoResultString}} 
      </span> 
      
    </multiselect> 
  </div> 
  `,
});

/**
 * Søge resultater
 */
Vue.component("SearchResult", {
  mixins: [appSettings],
  data: function () {
    return {
      hasAcceptedAi: false,
      initialAiTab: null,
      selectedEntries: this.preselectedEntries,
      badgesAdded: false,
      altmetricsAdded: false,
      idswithAbstractsToLoad: [],
      abstractRecords: {}, // id, abstract
      articles: {},
      articleAcordionExpanded: undefined,
    };
  },
  props: {
    results: Array,
    total: Number,
    pagesize: {
      type: Number,
      default: 25,
    },
    low: Number,
    high: Number,
    loading: Boolean,
    sort: Object,
    language: {
      type: String,
      default: "dk",
    },
    preselectedEntries: {
      type: Array,
      default: [],
    },
    error: {
      type: Error,
      default: null,
    },
    entriesAlwaysSelectable: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    next: function () {
      this.$emit("high");

      this.badgesAdded = false;
      this.altmetricsAdded = false;
    },
    previous: function () {
      this.$emit("low");
    },
    reloadScripts: function () {
      //Remove divs and scripts from body so they wont affect performance
      scripts = document.body.getElementsByTagName("script");
      var scriptArray = Array.from(scripts);
      scriptArray.splice(0, 1);
      (is = scriptArray.length), (ial = is);
      //console.log(is)
      while (is--) {
        //console.log(scriptArray[is])
        if (
          scriptArray[is].src.startsWith("https://api.altmetric.com/v1/pmid") ||
          scriptArray[is].src.startsWith("https://api.altmetric.com/v1/doi")
        ) {
          scriptArray[is].parentNode.removeChild(scriptArray[is]);
        }
      }
      var containers = document.body.getElementsByClassName(
        "altmetric-embed altmetric-popover altmetric-left"
      );
      var containerArray = Array.from(containers);
      //containerArray.splice(0, 1)
      (is = containerArray.length), (ial = is);
      //console.log(is)
      while (is--) {
        //console.log(containerArray[is])
        containerArray[is].parentNode.removeChild(containerArray[is]);
      }
    },
    getAbstract: function (id) {
      if (this.abstractRecords[id] != undefined) {
        if (typeof this.abstractRecords[id] !== "string") {
          return "";
        }
        return this.abstractRecords[id];
      }
      return "";
    },
    getAuthor: function (authors) {
      str = "";
      for (i = 0; i < authors.length; i++) {
        if (i > 0) str += ",";
        str += " " + authors[i].name;
      }
      return str;
    },
    getHasAbstract: function (attributes) {
      if (!attributes) {
        return false;
      }
      found = false;
      Object.keys(attributes).forEach(function (key) {
        value = attributes[key];
        if (key == "Has Abstract" || value == "Has Abstract") {
          found = true;
          return;
        }
      });
      return found;
    },
    getDate: function (history) {
      for (i = 0; i < history.length; i++) {
        if (history[i].pubstatus == "entrez") {
          date = new Date(history[i].date);
          formattedDate = date.toLocaleDateString(
            languageFormat[this.language],
            dateOptions
          );
          return formattedDate;
        }
      }
      return "";
    },
    // getDoi ændret af Ole
    getDoi: function (articleids) {
      for (i = 0; i < articleids.length; i++) {
        if (articleids[i].idtype == "doi") {
          doi = articleids[i].value;
          return doi;
        }
      }
      return "";
    },
    getText: function (id) {
      if (id != undefined) {
        if (
          this.abstractRecords[id] != undefined &&
          typeof this.abstractRecords[id] === "object"
        ) {
          return this.abstractRecords[id];
        }
      }
      return {};
    },
    getSource: function (value) {
      try {
        if (this.source != undefined) {
          if (value != undefined) {
            if (value.volume != undefined) value.volume = undefined;
            if (value.issue != undefined) value.issue = undefined;
            if (value.pages != undefined) value.pages = undefined;
            if (value.pubdate != undefined) value.pubdate = undefined;
          }
          return this.source;
        }
        if (value.booktitle) return value.booktitle;
        return value.source;
      } catch (error) {
        return "";
      }
    },
    newSortMethod: function (event) {
      obj = {};
      for (j = 0; j < order.length; j++) {
        if (order[j].method == event.target.value) {
          obj = order[j];
          break;
        }
      }
      this.$emit("newSortMethod", obj);
    },
    isSelected: function (model) {
      return model == this.sort;
    },
    isSelectedPageSize: function (model) {
      return model == this.pagesize;
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    getTranslation: function (value) {
      lg = this.language;
      constant = value.translations[lg];
      return constant != undefined ? constant : value.translations["dk"];
    },
    changePageNumber: function (event) {
      newPageSize = pageSizes[parseInt(event.target.options.selectedIndex)];
      // console.log(newPageSize);
      this.$emit("newPageSize", newPageSize);
    },
    getComponentWidth: function () {
      container = this.$refs.searchResult;
      if (!container.innerHTML) return;
      // console.log("thing", container, container.offsetWidth);
      return parseInt(container.offsetWidth);
    },
    addArticle: function (article) {
      if (this.articles.hasOwnProperty(article.pmid)) {
        delete this.articles[article.pmid];
      }

      this.$set(this.articles, article.pmid, article);
    },
    getSelectedArticles: function () {
      var resultEntries = this.$refs.resultEntries;
      var selectedArticles = [];
      var entriesForSummary =
        this.selectedEntries.length > 0
          ? this.selectedEntries
          : resultEntries
              .filter((e) => e.hasAbstract)
              .slice(0, 5)
              .map((e) => {
                return {
                  uid: e.id,
                };
              });
      for (let i = 0; i < entriesForSummary.length; i++) {
        let selected = entriesForSummary[i];
        selectedArticles[i] = this.articles[selected.uid];
      }
      return selectedArticles;
    },
    getArticleDtoProvider: function () {
      return this.getArticleDtos;
    },
    getSearchSummaryPrompts: function () {
      return searchSummaryPrompts;
    },
    getAbstractSummaryPrompts: function () {
      return abstractSummaryPrompts;
    },
    getAskQuestionsPrompts: function () {
      return summarizeArticlePrompt;
    },
    getSummarySuccessHeader: function () {
      const self = this;

      return function (selected, isMarkedArticlesSearch) {
        if (!isMarkedArticlesSearch) {
          let selectedWithAbstracts = selected.filter(
            (e) => e.abstract != null && e.abstract.trim() != ""
          );
          let before = self.getString(
            "aiSummarizeFirstFewSearchResultHeaderBeforeCount"
          );
          let after = self.getString(
            "aiSummarizeFirstFewSearchResultHeaderAfterCount"
          );
          return before + selectedWithAbstracts.length + after;
        }

        let before = self.getString(
          "aiSummarizeSelectedSearchResultHeaderBeforeCount"
        );
        let after = self.getString(
          "aiSummarizeSelectedSearchResultHeaderAfterCount"
        );
        return before + selected.length + after;
      };
    },
    clickAcceptAi: function (initialTab = null) {
      this.hasAcceptedAi = true;
      this.initialAiTab = initialTab;
    },
    closeSummaries: function () {
      this.hasAcceptedAi = false;
    },
    changeResultEntryModel: function (value, isChecked) {
      let newValue = [...this.selectedEntries];
      let valueIndex = newValue.findIndex(function (e) {
        return e === value || e.uid == value.uid;
      });

      if (isChecked && valueIndex === -1) {
        newValue.push(value);
      } else if (valueIndex > -1) {
        newValue.splice(valueIndex, 1);
      } else {
        console.warn(
          "changeResultEntryModel: change requested but could not be performed",
          isChecked,
          valueIndex,
          value,
          newValue
        );
        return;
      }
      this.selectedEntries = newValue;
      this.$emit("change:selectedEntries", newValue);
    },
    onAbstractLoad: function (id, abstract) {
      Vue.set(this.abstractRecords, id, abstract);
    },
    onAiSummariesClickRetry: function () {
      this.$el.parentElement
        .querySelector("#qpm_topofsearchbar")
        .scrollIntoView({ behavior: "smooth" });
    },
    onAiSummariesAccordionStateChange: function (expanded) {
      this.articleAcordionExpanded = expanded;
    },
    openArticlesAccordion: function ({ $el }) {
      const articlesAccordion = this.$refs.articlesAccordion;
      if (
        !this.articleAcordionExpanded &&
        articlesAccordion != null &&
        !articlesAccordion.expanded
      ) {
        articlesAccordion.$once("afterOpen", function () {
          $el.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        });
        this.onAiSummariesAccordionStateChange(true);
      }
    },
    onArticleAccordionStateChange: function (expanded) {
      this.articleAcordionExpanded = expanded;
    },
    onDeselectAllArticles: function () {
      this.selectedEntries = [];
      this.$emit("change:selectedEntries", this.selectedEntries);
    },
    loadSelectedArticleBadges: function (article) {
      if (window.__dimensions_embed) {
        window.__dimensions_embed.addBadges();
      }

      let articleBody = article
        ? article
        : this.$refs?.articlesAccordion?.$refs?.body;
      if (articleBody && window._altmetric_embed_init) {
        window._altmetric_embed_init(articleBody);
      }
    },
    shouldResultArticlePreloadAbstract: function (article) {
      const isInFirstFive = this.firstFiveArticlesWithAbstracts.some(function (
        value
      ) {
        return value.uid == article.uid;
      });
      return isInFirstFive;
    },
    addIdToLoadAbstract: function (id) {
      this.idswithAbstractsToLoad.push(id);
      if (this.results[this.results.length - 1].uid == id) {
        this.loadAbstracts();
      }
    },
    loadAbstracts: async function () {
      const self = this;
      let nlm = this.appSettings.nlm;
      baseurl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&tool=QuickPubMed" +
        "&email=" +
        nlm.email +
        "&api_key=" +
        nlm.key +
        "&retmode=xml&id=";

      url = baseurl + self.idswithAbstractsToLoad.join(",");
      let axiosInstance = axios.create({
        headers: { Accept: "application/json, text/plain, */*" },
      });
      axiosInstance.interceptors.response.use(undefined, (err) => {
        const { config, message } = err;

        if (!config || !config.retry) {
          console.log("request retried too many times", config.url);
          return Promise.reject(err);
        }

        // retry while Network timeout or Network Error
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
        .get(url, { retry: 10 })
        .then(function (resp) {
          data = resp.data;
          if (window.DOMParser) {
            parser = new DOMParser();
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
            sections = article.getElementsByTagName("AbstractText");
            if (sections.length == 1) {
              let abstractText = sections[0].textContent;
              return [pmid, abstractText];
            } else {
              let text = {};
              for (i = 0; i < sections.length; i++) {
                sectionName = sections[i].getAttribute("Label");
                sectionText = sections[i].textContent;
                text[sectionName] = sectionText;
              }
              return [pmid, text];
            }
          });

          return articleData;
        })
        .catch(function (err) {
          console.log("Error in fetch from pubMed:", err);
        });

      loadData.then((v) => {
        for (let item of v) {
          this.onAbstractLoad(item[0], item[1]);
        }
      });
    },
  },
  computed: {
    lowDisabled: function () {
      return this.low == 0 || this.loading;
    },
    highDisabled: function () {
      return this.high >= this.total || this.loading;
    },
    getPrettyTotal: function () {
      format = languageFormat[this.language];
      return this.total.toLocaleString(format);
    },
    getOrderMethods: function () {
      return order;
    },
    getPageSizeProps: function () {
      return pageSizes;
    },
    getShownSearchResults: function () {
      if (this.results == null) return null;
      return this.results.slice(0, this.high);
    },
    getHasSelectedArticles: function () {
      return this.selectedEntries.length > 0;
    },
    firstFiveArticlesWithAbstracts: function () {
      const self = this;
      const resultsWithAbstract = this.getShownSearchResults.filter(function (
        result
      ) {
        return self.getHasAbstract(result.attributes);
      });
      const first5ResultsWithAbstract = resultsWithAbstract.slice(0, 5);
      return first5ResultsWithAbstract;
    },
  },
  watch: {
    preselectedEntries: function (newVal) {
      if (this.selectedEntries != null && this.selectedEntries.length > 0)
        return;

      this.selectedEntries = newVal;
    },
  },
  updated: function () {
    // Guards to avoid badges re-rendering on select/deselect
    if (!this.$refs.resultEntries || this.$refs.resultEntries.length == 0) {
      this.hasAcceptedAi = false;
      this.badgesAdded = false;
      this.altmetricsAdded = false;
      this.articleAcordionExpanded = false;
      this.reloadScripts();
      return;
    }
    if (!this.badgesAdded && !this.loading) {
      if (window.__dimensions_embed) {
        window.__dimensions_embed.addBadges();
        this.badgesAdded = true;
      }
    }
    if (!this.altmetricsAdded && !this.loading) {
      const searchResult = this.$refs.searchResult;
      const articleAccordionBody = this.$refs?.articlesAccordion?.$refs?.body;
      if (window._altmetric_embed_init) {
        searchResult && window._altmetric_embed_init(searchResult);
        articleAccordionBody &&
          window._altmetric_embed_init(articleAccordionBody);
        this.altmetricsAdded = true;
      }
    }
  },
  mounted: function () {
    eventBus.$on("result-entry-show-abstract", this.openArticlesAccordion);
  },
  beforeDestroy: function () {
    eventBus.$off("result-entry-show-abstract", this.openArticlesAccordion);
  },
  template: /*html*/ `
    <div class="qpm_SearchResult" ref="searchResult"> \
        <div v-if="results && results.length > 0" class="qpm_accordions"> \
		<Accordion \
			v-if="results && results.length > 0 && appSettings.openAi.useAi" \
			class="qpm_ai_hide" \
			@expanded-changed="onAiSummariesAccordionStateChange">  \
			<template v-slot:header="accordionProps"> \
				<div class="qpm_aiAccordionHeader"> \
				    <div style="display: inline-flex;">\
					    <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i> \
					    <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i> \
					    <i class="bx bx-detail" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i> \
					    <div><strong>{{getString("selectedResultsAccordionHeader")}}</strong> \
					        <button class="bx bx-info-circle" style="cursor: help; margin-left: -5px" v-tooltip="{content: getString(\'hoverselectedResultsAccordionHeader\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"/></button> \
    				    </div>\
					</div>\
				</div> \
			</template> \
			<template> \
				<div> \
					<keep-alive>\
						<div v-if="!hasAcceptedAi" class="qpm_searchSummaryText qpm_searchSummaryTextBackground"> \
							<p>{{getString(\'aiSearchSummaryConsentHeader\')}}</p>\
						    <p \
					            v-if="selectedEntries == null || selectedEntries.length == 0" \
					            v-html="getString(\'aiSearchSummaryConsentHeaderText\')" \
					            > \
				            </p> \
						    <p \
					            v-if="selectedEntries.length > 0" \
					            > \
					            {{getString(\'aiSearchSummarySelectedArticlesBefore\')}} <strong>{{selectedEntries.length}}</strong> \
					            <span v-if="selectedEntries.length == 1"><strong>{{getString(\'aiSearchSummarySelectedArticlesAfterSingular\')}}</strong></span><span v-if="selectedEntries.length > 1"><strong>{{getString(\'aiSearchSummarySelectedArticlesAfterPlural\')}}</strong></span>{{getString(\'aiSearchSummarySelectedArticlesAfter\')}} \
				            </p> \
							<p><strong>{{getString(\'aiSummarizeSearchResultButton\')}}</strong></p> \
							<button v-for="prompt in getSearchSummaryPrompts()" \
								class="qpm_button qpm_summaryButton" \
								@click="clickAcceptAi(prompt)" \
								v-tooltip="{content: getString(\'hoverSummarizeSearchResultButton\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}" \
								><i class="bx bx-detail" style="font-size: 22px; line-height: 0; margin: -4px 2px 0 0"></i> {{getTranslation(prompt)}} \
							</button> \
							<p class="qpm_summaryDisclaimer" v-html="getString(\'aiSummaryConsentText\')"></p> \
						</div> \
            <!-- AI summaries of abstracts from multiple search results -->
						<ai-summaries v-else \
              :showSummarizeArticle="false"
							:language="language" \
							:prompts="getSearchSummaryPrompts()" \
							:successHeader="getSummarySuccessHeader()" \
							:isMarkedArticles="getHasSelectedArticles" \
							:summaryConsentHeader="getString(\'aiSearchSummaryConsentHeader\')" \
							:summarySearchSummaryConsentText="getString(\'aiSearchSummaryConsentHeaderText\')" \
							:errorHeader="getString(\'aiSummarizeSearchErrorHeader\')" \
							:hasAcceptedAi="hasAcceptedAi" \
							:initialTabPrompt="initialAiTab" \
							:getSelectedArticles="getSelectedArticles" \
							@close="closeSummaries" \
							@ai-summaries-click-retry="onAiSummariesClickRetry"\
						/> \
					</keep-alive> \
				</div> \
			</template> \
		</Accordion> \
		<!-- TODO: Remember to set "openByDefault" to false if Ole responds that it is no longer desired behavior  -->\
		<Accordion \
			v-if="results && results.length > 0" \
			ref="articlesAccordion" \
			:isExpanded="articleAcordionExpanded" \
			:models="selectedEntries" \
			:openByDefault="preselectedEntries != null && preselectedEntries.length > 0" \
			:onlyUpdateModelWhenVisible="true" \
			@changed:items="loadSelectedArticleBadges" \
			@open="onArticleAccordionStateChange(true)" \
			@close="onArticleAccordionStateChange(false)">  \
			<template v-slot:header="accordionProps"> \
				<div class="qpm_aiAccordionHeader" > \
				    <div style="display: inline-flex; width: 100%;">\
					    <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i> \
					    <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i> \
					    <i class="bx bx-check-square" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i> \
					    <div style="display: inline-flex; width: 100%; justify-content: space-between; flex-wrap: wrap;">\
					        <div style="margin-bottom: 5px"> \
					            <strong>{{getString("selectedResultTitle")}}</strong> \
    					        <button v-if="!appSettings.openAi.useAi" class="bx bx-info-circle" style="cursor: help; margin-left: -5px" v-tooltip="{content: getString(\'hoverselectedResultTitle\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"/></button> \
    					        <button v-if="appSettings.openAi.useAi" class="bx bx-info-circle" style="cursor: help; margin-left: -5px" v-tooltip="{content: getString(\'hoverselectedResultTitleAI\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"/></button> \
    					    </div>\
					        <div>\
					        <button class="qpm_button qpm_markedArticleCounter" onclick="event.stopPropagation();" \
					            v-tooltip="{content: getString(\'hovermarkedArticleCounter\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}" \
					        >\
					            {{selectedEntries.length}} \
								<span v-if="selectedEntries.length == 1">{{getString(\'aiSearchSummarySelectedArticlesAfterSingular\')}}</span><span v-if="selectedEntries.length > 1 || selectedEntries.length == 0">{{getString(\'aiSearchSummarySelectedArticlesAfterPlural\')}}</span> \
					        </button>\
					        </div>\
					    </div>\
					</div>\
				</div> \
			</template> \
			<template v-slot:default> \
				<div class="list-fade-item" name="transition-item-0" style="padding: 5px 0 5px 10px; background-color: var(--color-grey-light); border-bottom: solid 1px lightgrey; font-size: 0.96em"\
				    @click="onDeselectAllArticles" \
				> \
					<button id="qpm_selectedResultDeselectAll" \
						style="padding-left: 0" \
						:disabled="selectedEntries == null || selectedEntries.length <= 0" \
					> \
					<i \
						class="bx bxs-minus-square qpm_selectArticleCheckbox" \
						style="font-size: 22px; line-height: 0; margin: -4px 4px 0 0"></i> \
					<button \
						v-tooltip="{content: getString(\'hoverselectedResultDeselectAllText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}" \
						class="qpm_button qpm_selectArticleCheckbox list-fade-item" \
					> {{getString("selectedResultDeselectAllText")}}</button> \
					</button> \
				</div> \
			    <div class="qpm_searchSummaryText qpm_searchSummaryTextBackground"> \
				    <div \
					    v-if="selectedEntries == null || selectedEntries.length == 0" \
					    v-html="getString(\'selectedResultEmptyText\')" \
					    > \
				    </div> \
			    </div> \
			</template> \
			<template v-slot:listItem="value"> \
				<ResultEntry \
					:id = value.model.uid \
					:pmid = value.model.uid \
					:pubDate = value.model.pubdate \
					:volume = value.model.volume \
					:issue = value.model.issue \
					:pages = value.model.pages \
					:doi = "getDoi(value.model.articleids)" \
					:title = value.model.title \
          :pubType = value.pubtype \
					:booktitle = value.model.booktitle \
					:vernaculartitle = value.model.vernaculartitle \
					:date = getDate(value.model.history) \
					:source = getSource(value.model) \
					:hasAbstract = getHasAbstract(value.model.attributes) \
					:author = getAuthor(value.model.authors) \
					:language="language" \
					:parentWidth = getComponentWidth() \
					:abstractSummaryPrompts="getAbstractSummaryPrompts()" \
					:modelValue = "selectedEntries" \
					:selectable="entriesAlwaysSelectable || hasAcceptedAi" \
					:value="value.model" \
					:abstract="getAbstract(value.model.uid)" \
					:text="getText(value.model.uid)" \
					@change = changeResultEntryModel \
					@change:abstractLoad = onAbstractLoad \
					@loadAbstract = addIdToLoadAbstract \					
				> \
				</ResultEntry> \
			</template> \
		</Accordion> \
	    </div> \
	  <div role="heading" aria-level="2" class="h3" style="padding-top: 30px" v-if="(results && results.length > 0) && total > 0">{{getString(\'searchresult\')}}</div> \
      <div class="qpm_searchHeader qpm_spaceEvenly" v-if="(results && results.length > 0) && total > 0"> \
        <p class="qpm_nomargin">{{getString(\'showing\')}} {{low+1}}-{{high}} {{getString(\'of\')}} <span><strong>{{getPrettyTotal}}</strong> {{getString(\'searchMatches\')}}</span></p>\
        <div class="qpm_searchHeaderSort qpm_spaceEvenly" v-if="results && results.length != 0"> \
          <div class="qpm_sortSelect" style="padding-right: 7px">\
            <select @change="newSortMethod" :model="sort">\
              <option v-for="sorter in getOrderMethods" :value="sorter.method" :selected="isSelected(sorter)">{{getTranslation(sorter)}}</option> \
            </select>\
          </div>\
          <div style="border-left: 1px solid #e7e7e7"></div>\
          <div role="heading" aria-level="2" class="qpm_sortSelect qpm_spaceEvenly" > \
            <select @change="changePageNumber($event)"> \
              <option v-for="size in getPageSizeProps" :value="size" :selected="isSelectedPageSize(size)">{{size}} {{getString(\'pagesizePerPage\')}}</option> \
            </select>\
          </div>\
        </div>\
      </div> \
      <div v-if="results && results.length == 0">\
        <div class="h3"><br/>{{getString(\'noResult\')}}</div>\
		<p>{{getString(\'noResultTip\')}}</p>\
      </div>\
      <div style="z-index:0"> \
        <div v-if="results.length > 0 || !loading" v-for="(value, name) in getShownSearchResults" class="qpm_ResultEntryWrapper"> \
          <ResultEntry \
            :id = value.uid \
            :pmid = value.uid \
            :pubDate = value.pubdate \
            :volume = value.volume \
            :issue = value.issue \
            :pages = value.pages \
            :doi = getDoi(value.articleids) \
            :title = value.title \
            :pubType = value.pubtype \
            :booktitle = value.booktitle \
            :vernaculartitle = value.vernaculartitle \
            :date = getDate(value.history) \
            :source = getSource(value) \
            :hasAbstract = getHasAbstract(value.attributes) \
            :author = getAuthor(value.authors) \
            :language="language" \
            :parentWidth = getComponentWidth() \
            :abstractSummaryPrompts="getAbstractSummaryPrompts()" \
            :modelValue = "selectedEntries" \
            :selectable="entriesAlwaysSelectable || hasAcceptedAi" \
            :abstract="getAbstract(value.uid)" \
            :text="getText(value.uid)" \
            :value="value" \
            @change = changeResultEntryModel \
            @change:abstractLoad = onAbstractLoad \
            @articleUpdated = addArticle\
            @loadAbstract = addIdToLoadAbstract \
            ref="resultEntries" \
          > \
          </ResultEntry> \
        </div> \
		<Spinner :loading=loading class="qpm_searchMore"> </Spinner> \
		<div v-if="error != null" class="qpm_flex"> \
			<div class="qpm_errorBox">{{error.message ?? error.toString()}}</div> \
		</div> \
      </div> \
      <div v-if="total > 0" class="qpm_flex" style="justify-content: center; margin-top: 25px; flex-direction: column;"> \
	  	<button v-if="!loading && results && results.length < total" :disabled="highDisabled" :class="{qpm_disabled: highDisabled}" class="qpm_button qpm_dark" @click="next"><span class="qpm_hideonmobile"> {{getString(\'next\')}}</span> {{pagesize}}</button> \
	  	<p v-if="!loading || (results && high && total)" class="qpm_nomargin qpm_shownumber">{{getString(\'showing\')}} 1-{{high}} {{getString(\'of\')}} <span><strong>{{getPrettyTotal}}</strong> {{getString(\'searchMatches\')}}</span></p> \
      </div> \
    </div> \
	`,
});

Vue.component("ai-summaries", {
  mixins: [appSettings],
  data: function () {
    return {
      currentSummary: "", // The summary tab currently shown
      /**
       * The tabstates is an object indexed by the name of each tab. The corresponding value is an object containing
       * information about the state of a tab to enable switching between the without resetting the view.
       *
       * @example
       * tabStates: {
       *   "fagsprog": {
       *     currentIndex: 2
       *   },
       *   "hverdagssprog": {
       *     currentIndex: 0
       *   }
       * }
       */
      tabStates: this.prompts.reduce((acc, prompt) => {
        acc[prompt.name] = { currentIndex: 0 };
        return acc;
      }, {}),
      loadingSummaries: [], // A list of summaries that are currently being fetched
      /**
       * An object containing each summary that has been fetched so far.
       * Each entry is an array of objects which always contains at least the following properties:
       *  - `requestTime`		- Date
       * 	- `status` 			- "success" | "error" | "loading"
       *  - `articles`		- [{...}, {...}, {...}]
       * 	- `body`			- String
       * @example
       * aiSearchSummaries: {
       *   fagsprog: [
       * 	   {
       *       requestTime: "2017-06-03T03:57:00.000Z",
       *       responseTime: "2017-06-03T04:00:00.000Z",
       *       status: "succes",
       *       articles: [{...}, {...}],
       *     	 body: "Artiklerne beskriver..."
       *     }
       * 	 ],
       *   hverdagssprog: [
       *     {
       *       requestTime: "2017-06-03T04:10:00.000Z",
       *       responseTime: "2017-06-03T04:17:00.000Z",
       *       status: "error",
       *       articles: [{...}, {...}, {...}],
       *       body: "CORS error",
       *       error: {...}
       *     }
       *   ]
       * }
       */
      aiSearchSummaries: this.prompts.reduce((acc, prompt) => {
        acc[prompt.name] = [];
        return acc;
      }, {}),
      articleCount: 0,
      showHistory: false,
      stopGeneration: false,
      pdfFound: false,
      articleName: "",
    };
  },
  props: {
    pubType: {
      type: Array,
      required: false,
    },
    license: String,
    isLicenseAllowed: {
      type: Boolean,
      default: false,
    },
    isResourceAllowed: {
      type: Boolean,
      default: false,
    },
    isPubTypeAllowed: {
      type: Boolean,
      default: false,
    },
    htmlUrl: String,
    pdfUrl: String,
    showSummarizeArticle: {
      type: Boolean,
      default: false,
    },
    articles: Array,
    language: {
      type: String,
      default: "dk",
    },
    prompts: {
      type: Array,
      required: true,
    },
    summaryConsentHeader: {
      type: String,
      required: SVGComponentTransferFunctionElement,
    },
    summarySearchSummaryConsentText: {
      type: String,
      required: SVGComponentTransferFunctionElement,
    },
    successHeader: {
      type: [String, Function], // The function should take the selected articles as argument and return a string.
      required: true,
    },
    errorHeader: {
      type: String,
      required: true,
    },
    getSelectedArticles: {
      type: [Function],
      required: true,
    },
    isMarkedArticles: {
      type: Boolean,
      default: false,
    },
    hasAcceptedAi: Boolean,
    useMarkdown: {
      type: Boolean,
      default: true,
    },
    initialTabPrompt: {
      type: Object,
      default: null,
    },
    checkForPdf: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    getTranslation: function (value) {
      lg = this.language;
      constant = value.translations[lg];
      return constant != undefined ? constant : value.translations["dk"];
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    getSummaryPromptByName: function (name) {
      return this.prompts.find(function (prompt) {
        return prompt.name == name;
      });
    },
    getErrorTranslation: function (error) {
      lg = this.language;
      try {
        constant = messages[error][lg];
        return constant != undefined ? constant : messages[error]["dk"];
      } catch {
        return messages["unknownError"][lg];
      }
    },
    generateAiSummary: async function (prompt) {
      var self = this;
      self.stopGeneration = false;
      const waitTimeDisclaimerDelay =
        this.appSettings.openAi.waitTimeDisclaimerDelay ?? 0;
      this.loadingSummaries.push(prompt.name);
      var localePrompt = getPromptForLocale(prompt, this.language);
      var summarizePrompt = getPromptForLocale(
        summarizeSummaryPrompts.find(function (p) {
          return prompt.name == p.name;
        }),
        this.language
      );

      var shortenAbstractPrompt = getPromptForLocale(
        shortenAbstractPrompts.find(function (p) {
          return prompt.name == p.name;
        }),
        this.language
      );

      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/SummarizeSearch";

      const readData = async function (url, body) {
        let answer = "";
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw {
            data: await response.json(),
          };
        }
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done || self.stopGeneration) {
            break;
          }
          answer += value;

          self.updateAiSearchSummariesEntry(prompt.name, { body: answer });
        }
        self.updateAiSearchSummariesEntry(prompt.name, {
          responseTime: new Date(),
          status: "success",
        });
      };
      const articles = this.getSelectedArticles();
      if (!articles || articles.length == 0) {
        self.pushToAiSearchSummaries(prompt.name, {
          responseTime: new Date(), // Get current time
          status: "error",
          articles: articles,
          isMarkedArticlesSearch: self.isMarkedArticles,
          body: self.getErrorTranslation("noAbstractsError"),
        });
        return;
      }

      self.pushToAiSearchSummaries(prompt.name, {
        requestTime: new Date(), // Get current time
        status: "loading",
        articles: articles,
        body: "",
        isMarkedArticlesSearch: self.isMarkedArticles,
      });

      setTimeout(function () {
        self.updateAiSearchSummariesEntry(prompt.name, {
          showWaitDisclaimer: true,
        });
      }, waitTimeDisclaimerDelay);
      self.articleCount = articles.length;
      return readData(openAiServiceUrl, {
        prompt: localePrompt,
        articles: articles,
        summarizeAbstractPrompt: summarizePrompt,
        shortenAbstractPrompt: shortenAbstractPrompt,
        client: self.appSettings.client,
        //responseType: "stream",
      })
        .catch(function (error) {
          if (error.data) {
            self.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(), // Get current time
              status: "error",
              body: self.getErrorTranslation("unknownError"),
              error: error.data,
            });
          } else {
            self.updateAiSearchSummariesEntry(prompt.name, {
              responseTime: new Date(), // Get current time
              status: "error",
              body: self.getErrorTranslation("unknownError"),
              error: error,
            });
          }
        })
        .then(function () {
          var tabIndex = self.loadingSummaries.indexOf(prompt.name);
          self.loadingSummaries.splice(tabIndex, 1);
          Vue.set(self.tabStates[prompt.name], "currentIndex", 0);
        });
    },
    clickSummaryTab: function (tab) {
      this.currentSummary = tab.name;
      let currentSummaries = this.aiSearchSummaries[tab.name];
      if (
        this.getIsSummaryLoading ||
        (currentSummaries && currentSummaries.length > 0)
      ) {
        return;
      }
      this.generateAiSummary(tab);
    },
    clickStop: function (event, moveFocus = false) {
      this.stopGeneration = true;
    },
    clickRetry: function (event, moveFocus = false) {
      this.$emit("ai-summaries-click-retry", this);

      var tab = this.getSummaryPromptByName(this.currentSummary);
      if (moveFocus) {
        this.$el.querySelector("#" + tab.name).focus();
      }
      this.generateAiSummary(tab);
    },
    clickCopy: function () {
      var summary = this.$refs.summary;
      navigator.clipboard.writeText(summary.innerText);
    },
    clickCloseSummary: function () {
      this.$emit("close");
    },
    pushToAiSearchSummaries: function (key, value) {
      let oldSummaries = this.aiSearchSummaries[key] ?? [];
      let newSummaries = oldSummaries.toSpliced(0, 0, value);
      Vue.set(this.aiSearchSummaries, key, newSummaries);
    },
    /**
     * Update an existing entry with new fields and/or new values for existing fields.
     * @param {String} summaryName the name of the summary type to update an entry for
     * @param {*} newValues An object containing only the fields that needs updating, with their new values
     * @param {Number} index Index of the entry to update. Defaults to the newest entry (index = 0)
     */
    updateAiSearchSummariesEntry: function (summaryName, newValues, index = 0) {
      for (const [key, value] of Object.entries(newValues)) {
        this.$set(this.aiSearchSummaries[summaryName][index], key, value);
      }
    },
    toggleHistory: function () {
      this.showHistory = !this.showHistory;
    },
    clickHistoryItem: function (index) {
      Vue.set(this.tabStates[this.currentSummary], "currentIndex", index);
    },
    formatDate: function (date) {
      let formattedDate = date.toLocaleDateString(
        languageFormat[this.language],
        dateOptions
      );
      return formattedDate;
    },
    onMarkdownClick: function (event) {
      const target = event.target;

      // Test if it is an <a /> tag that was clicked
      if (target.tagName !== "A") return;

      const hrefValue = target.attributes.href.nodeValue;
      const hrefNumber = Number.parseInt(hrefValue.slice(1));

      // Test if ref is to a ResultEntry
      if (!hrefValue.startsWith("#") || !Number.isInteger(hrefNumber)) return;

      const selectedArticlesSelectorString = `.qpm_accordion *:where(#${hrefNumber}, [name="${hrefNumber}"])`;
      const searchResultSelectorString = `.qpm_SearchResult *:where(#${hrefNumber}, [name="${hrefNumber}"])`;
      let resultEntry =
        document.querySelector(selectedArticlesSelectorString) ??
        document.querySelector(searchResultSelectorString);
      if (resultEntry == null) {
        console.debug(
          `onMarkdownClick: no article with the name or id '${hrefNumber}' clould be found. ref: '${hrefValue}'.`
        );
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      eventBus.$emit("result-entry-show-abstract", { $el: resultEntry });
    },
    getTabTooltipContent: function (prompt) {
      const tooltip = prompt?.tooltip;
      if (!tooltip) return null;

      return tooltip[this.language];
    },
  },
  computed: {
    getUsePDFsummaryFlag: function () {
      return this.appSettings.openAi.usePDFsummary;
    },
    getIsSummaryLoading: function () {
      return this.loadingSummaries.includes(this.currentSummary);
    },
    getCurrentSummaryHistory: function () {
      if (!this.currentSummary) return null;

      let currentSummaries = this.aiSearchSummaries[this.currentSummary];
      return currentSummaries;
    },
    getCurrentIndex: function () {
      let tabState = this.tabStates[this.currentSummary];
      let index = tabState?.currentIndex ?? 0;
      return index;
    },
    getCurrentSummary: function () {
      let summaries = this.getCurrentSummaryHistory;

      if (!summaries || summaries.length == 0) return undefined;

      let index = this.getCurrentIndex;
      return summaries[index];
    },
    getDidCurrentSummaryError: function () {
      var summary = this.getCurrentSummary;
      return summary?.status == "error";
    },
    isCurrentSummaryWaitingForResponse: function () {
      var summary = this.getCurrentSummary;
      return (
        summary?.status == "loading" &&
        (!summary?.body || summary.body.length == 0)
      );
    },
    getWaitTimeString: function () {
      const currentSummary = this.getCurrentSummary;
      if (currentSummary == undefined || !currentSummary.showWaitDisclaimer)
        return "";

      const longAbstractLengthLimit =
        this.appSettings.openAi.longAbstractLengthLimit ?? 5000;

      const totalAbstractLength =
        currentSummary?.articles?.reduce(function (acc, article) {
          return acc + article.abstract.length;
        }, 0) ?? 0;

      if (totalAbstractLength > longAbstractLengthLimit) {
        return this.getString("aiLongWaitTimeDisclaimer");
      } else {
        return this.getString("aiShortWaitTimeDisclaimer");
      }
    },
    getTabNames: function () {
      return this.prompts.map((e) => e.name);
    },
    getSuccessHeader() {
      if (this.successHeader instanceof Function) {
        const currentSummary = this.getCurrentSummary;
        let articles = currentSummary?.articles;
        return (
          articles &&
          this.successHeader(articles, currentSummary.isMarkedArticlesSearch)
        );
      }
      return this.successHeader;
    },
    canRenderMarkdown: function () {
      let isVueShowdownRegistered =
        !!this.$options.components["VueShowdown"] ||
        !!this.$options.components["vue-showdown"];
      return isVueShowdownRegistered;
    },
  },
  created: function () {
    if (this.checkForPdf) {
      this.articleName = this.getSelectedArticles()[0].title;
    }
  },
  activated: function () {
    if (this.initialTabPrompt != null) {
      this.clickSummaryTab(this.initialTabPrompt);
    }
  },
  watch: {
    isLicenseAllowed(newVal) {
      console.log("isLicenseAllowed changed:", newVal);
    },
    isResourceAllowed(newVal) {
      console.log("isResourceAllowed changed:", newVal);
    },
    isPubTypeAllowed(newVal) {
      console.log("isPubTypeAllowed changed:", newVal);
    },
  },
  template: /*html*/ `
	<div class="qpm_searchSummaryBox"> 
		<div class="d-flex space-between"> 
			<div class="qpm_tabs">
				<button v-for="prompt in prompts"
					:id="prompt.name" 
					class="qpm_tab" 
					v-tooltip="{content: getTabTooltipContent(prompt), delay:$helpTextDelay}"
					@click="clickSummaryTab(prompt)" 
					:class="{qpm_tab_active: (prompt.name == currentSummary)}"> 
					{{getTranslation(prompt)}} 
				</button> 
			</div>
		</div> 
		<div class="qpm_searchSummaryTextBackground"> 
			<template v-if="hasAcceptedAi">  
			<div class="qpm_summary_icon_row">
			<template v-if="getCurrentSummary != null && getCurrentSummaryHistory.length > 1">
				<button 
					class="qpm_summary_icon bx bx-chevron-left" 
					style="margin-right: -12px; margin-top: -3px; border: 0;" 
					:disabled="getCurrentIndex + 1 >= getCurrentSummaryHistory.length" 
					@click="clickHistoryItem(getCurrentIndex + 1)"> 
				</button>
				{{getCurrentSummaryHistory.length - getCurrentIndex}}<span style="padding: 0 3px">/</span>{{getCurrentSummaryHistory.length}}
				<button 
					class="qpm_summary_icon bx bx-chevron-right" 
					style="margin-left: -12px; margin-top: -3px; border: 0;"
					:disabled="getCurrentIndex <= 0" 
					@click="clickHistoryItem(getCurrentIndex - 1)"> 
				</button>
			</template>

			<button 
				class="qpm_summary_icon bx bx-x" 
				@click="clickCloseSummary"
				style="margin-left: 20px; margin-top: -5px; border: 1px solid #e7e7e7">
			</button> 
		</div>
				<div v-if="!getCurrentSummary" class="qpm_searchSummaryText"> 
					<p><strong>{{summaryConsentHeader}}</strong></p> 
					<p v-if="summarySearchSummaryConsentText != null">{{summarySearchSummaryConsentText}}</p> 
					<!-- <button \style="margin-left:25px"  -->
					<p v-html="getString(\'aiSummaryConsentText\')"></p> 
					<p v-html="getString(\'readAboutAiSummaryText\')"></p> 
				</div>
				<div v-else class="qpm_searchSummaryResponseBox"> 
					<div v-if="getDidCurrentSummaryError" class="qpm_searchSummaryText qpm_searchSummaryErrorText">
						<div> 
							<p style="color: #932833">
								<i class="bx bx-error" style="font-size: 30px; line-height: 0; margin: -4px 4px 0 0"></i>
								<strong>{{errorHeader}}</strong>
							</p>
							<p>{{getCurrentSummary?.body}}</p>
							<template v-if="getCurrentSummary?.error">
								<p>{{getCurrentSummary?.error?.Message}}</p>
							</template>
							<div style="margin: 20px 5px 5px">
								<button
								class="qpm_button"
								@keydown.enter="clickRetry($event, true)"
								@click="clickRetry">{{getString("retryText")}}</button>
							</div>
						</div>
					</div>
					<template v-else-if="!isCurrentSummaryWaitingForResponse">
						<div class="qpm_searchSummaryText">
								<div> 
									<p><strong>{{getSuccessHeader}}</strong><p> 
									<div style="background-color: lightgrey; padding: 3px 10px 10px; margin: 5px; font-size: 0.9em;">
										<p v-html="getString(\'aiSummarizeFirstFewSearchResultHeaderAfterCountWarning\')"></p>
									</div>
									<div v-if="useMarkdown && canRenderMarkdown" ref="summary">
										<VueShowdown :options="{ smoothLivePreview: true }" @click.native.capture="onMarkdownClick" :markdown="getCurrentSummary.body" />
									</div>
									<p v-else ref="summary" >{{getCurrentSummary?.body}}</p>
									<div style="margin: 20px 5px"> 
										<button 
											v-if="getIsSummaryLoading" 
											class="qpm_button" 
											@click="clickStop" 
											v-tooltip="{content: getString(\'hoverretryText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"> <i class='bx bx-stop-circle'></i> 
                      {{getString("stopText")}}
                    </button> 
										
                    <button 
											v-if="!getIsSummaryLoading" 
											class="qpm_button" 
											@click="clickRetry" 
											v-tooltip="{content: getString(\'hoverretryText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"> <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em"></i> 
                      {{getString("retryText")}}
                    </button>  
                                        
                    <button 
											class="qpm_button" 
											:disabled="getIsSummaryLoading" 
											@click="clickCopy" 
											v-tooltip="{content: getString(\'hovercopyText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"> <i class="bx bx-copy" style="vertical-align: baseline;"></i> 
                      {{getString("copyText")}}
                    </button> 
                    
                    <summarize-article 
                      v-if="getUsePDFsummaryFlag && showSummarizeArticle && isLicenseAllowed && isResourceAllowed && isPubTypeAllowed"
                      :pdfUrl="pdfUrl"
                      :htmlUrl="htmlUrl"
                      :language="language"
                      :promptLanguageType="this.currentSummary"
                      :isSummaryLoading="getIsSummaryLoading">
                    </summarize-article> 
                    </div> 
									<p class="qpm_summaryDisclaimer" v-html="getString(\'aiSummaryDisclaimer\')"></p>	
								</div> 
							
						</div>  
					</template>
					<Spinner class="qpm_searchSummaryText" :waitText="getString(\'aiSummaryWaitText\')" :waitDurationDisclaimer="getWaitTimeString" :loading="isCurrentSummaryWaitingForResponse" style="align-self: center"/>
				</div> 
			</template>
		</div>
	</div>
  `,
});

Vue.component("ResultEntry", {
  mixins: [appSettings],
  data: function () {
    // Added by Ole
    if (document.getElementById("qpm_start") != null) {
      document
        .getElementById("qpm_start")
        .scrollIntoView({ behavior: "smooth" });
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
      initialAiTab: "",
      pdfQuestions: [],
      isLicenseAllowed: false,
      isResourceAllowed: undefined,
      isPubTypeAllowed: false,
      pdfUrl: "",
      htmlUrl: "",
      defaultUrl: "",
      license: "",
      showExtendedPrompts: false, // Show extended prompts for summarizing the article
    };
  },
  model: {
    prop: "modelValue",
    event: "change",
  },
  props: {
    abstract: String,
    text: Object,
    id: String,
    pmid: String,
    title: String,
    booktitle: String,
    vernaculartitle: String,
    date: String,
    source: String,
    author: String,
    pubDate: String,
    volume: String,
    issue: String,
    pages: String,
    hasAbstract: Boolean,
    doi: String,
    showButtons: {
      type: Boolean,
      default: true,
    },
    pubType: {
      type: Array,
      required: false,
    },
    showDate: {
      type: Boolean,
      default: true,
    },
    singleArticle: Boolean,
    customAbstract: String,
    language: {
      type: String,
      default: "dk",
    },
    hyperLink: String,
    hyperLinkText: String,
    sectionedAbstract: Object,
    parentWidth: Number,
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
    selectable: false,
    modelValue: { type: [Array, Boolean] },
    value: { type: [Array, Boolean, Object] },
    preLoadAbstract: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    toggleExtendedPrompts() {
      this.showExtendedPrompts = !this.showExtendedPrompts;
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
      console.log("pubtype: ", this.pubType);
      console.log("isPubTypeAllowed: ", this.isPubTypeAllowed);
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
      console.log("license: ", this.license);
      console.log("isLicenseAllowed: ", this.isLicenseAllowed);
      return this.isLicenseAllowed;
    },
    /**
     * Used to check if a pdf resource will allow the azure function to download the resource
     * Returns true if not forbidden, false if forbidden
     */
    async checkRessource() {
      const url =
        "https://qpm-openai-service.azurewebsites.net/api/CheckIfResourceIsForbidden";
      const options = {
        method: "POST",
        body: JSON.stringify({
          url: this.defaultUrl,
        }),
      };

      try {
        const pdfresponse = await fetch(url, options);
        const isAllowed = pdfresponse.status !== 403;
        this.isResourceAllowed = isAllowed;
        console.log("isResourceAllowed:", this.isResourceAllowed);
        return isAllowed;
      } catch (error) {
        console.error("Error checking resource:", error);
        // Default to false in case of error
        this.isResourceAllowed = false;
        return false;
      }
    },
    setAbstract() {
      console.log(`my id is: ${this.id}`);
    },
    //This is needed because AI-summaries expects a function to get the article and it gets stuck in a loop if you pass the articles directly
    getArticleAsArray: function () {
      return [this.getArticle];
    },
    showAbstract: async function (ignoreToggle = false) {
      this.showingAbstract = ignoreToggle === true || !this.showingAbstract;

      //scroll up to header if closing
      if (!this.showingAbstract && this.abstractLoaded && this.id) {
        // Get the div containing the abstract and then select
        // the <specific-article> containing it.
        document
          .getElementById(this.getAbstractId)
          .parentElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
      } else {
        if (this.getAbstractId) {
          // Get the div containing the abstract and then select
          // the <specific-article> containing it.
          document
            .getElementById(this.getAbstractId)
            .parentElement.scrollIntoView({
              block: "start",
              behavior: "smooth",
            });
        }
      }

      if (!this.unpaywallResponseLoaded) {
        await this.loadUnpaywallApiResponse();
      }
    },
    gotosite: function (url) {
      window.open(url, "_blank");
    },
    collapseSection: function (element) {
      // get the height of the element's inner content, regardless of its actual size
      //var sectionHeight = element.scrollHeight;

      // temporarily disable all css transitions
      element.style.height = 0 + "px";

      // on the next frame (as soon as the previous style change has taken effect),
      // explicitly set the element's height to its current pixel height, so we
      // aren't transitioning out of 'auto'
      element.addEventListener("transitionend", function (e) {
        // remove this event listener so it only gets triggered once
        element.removeEventListener("transitionend", arguments.callee);

        // remove "height" from the element's inline styles, so it can return to its initial value
        element.style.height = null;
      });

      // mark the section as "currently collapsed"
      element.setAttribute("data-collapsed", "true");
    },
    expandSection: function (element) {
      // get the height of the element's inner content, regardless of its actual size
      var sectionHeight = element.scrollHeight;

      // have the element transition to the height of its inner content
      element.style.height = sectionHeight + "px";

      // when the next css transition finishes (which should be the one we just triggered)
      element.addEventListener("transitionend", function (e) {
        // remove this event listener so it only gets triggered once
        element.removeEventListener("transitionend", arguments.callee);

        // remove "height" from the element's inline styles, so it can return to its initial value
        element.style.height = null;
      });

      // mark the section as "currently not collapsed"
      element.setAttribute("data-collapsed", "false");
    },
    handleClickEvent: function (event) {
      eventClass = this.abstractLoaded ? "qpm_shadow" : "qpm_abstractContainer";
      var section = document.querySelector(eventClass);
      var isCollapsed = section.getAttribute("data-collapsed") === "true";

      if (isCollapsed) {
        this.expandSection(section);
        section.setAttribute("data-collapsed", "false");
      } else {
        this.collapseSection(section);
      }
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    getTranslation: function (value) {
      lg = this.language;
      constant = value.translations[lg];
      return constant != undefined ? constant : value.translations["dk"];
    },
    customNameLabel: function (option) {
      if (!option.name && !option.groupname) return;
      if (option.id) {
        lg = this.language;
        constant =
          option.translations[lg] != undefined
            ? option.translations[lg]
            : option.translations["dk"];
      } else {
        constant = option.name;
      }
      return constant;
    },
    customGroupLabel: function (option) {
      if (!option) return;
      lg = this.language;
      constant = option.translations[lg];
      return constant != undefined ? constant : option.translations["dk"];
    },
    loadUnpaywallApiResponse: async function () {
      if (!this.doi) return undefined;

      self = this;
      url =
        "https://api.unpaywall.org/v2/" +
        this.doi +
        "?email=admin@videncenterfordiabetes.dk";
      timeout = 15 * 1000; //15 second timeout
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
    getAbstractSummaryPrompts: function () {
      return abstractSummaryPrompts;
    },
    getPdfQuestionPrompts: function () {
      let pdfPrompts = [];
      for (let i = 0; i < this.pdfQuestions.length; i++) {
        let prompt = JSON.parse(JSON.stringify(summarizeArticlePrompt));
        prompt.prompt.dk += this.pdfQuestions[i];
        prompt.name = "pdf" + i;
        pdfPrompts.push(prompt);
      }
      return pdfPrompts;
    },
    getSummarizeArticlePrompt: function () {
      return summarizeArticlePrompt;
    },
    getAllPrompts: function () {
      let temp = this.getAbstractSummaryPrompts().concat(
        this.getPdfQuestionPrompts()
      );
      console.log("getAllPrompts: ", temp);
      return temp;
    },
    updateInput: function (event) {
      let isChecked = event.target.checked;
      this.$emit("change", this.value, isChecked);
    },
    clickAcceptAi: function (initialTab = null) {
      this.hasAcceptedAi = true;
      this.getArticlesPromise; // Start loading article abstracts now if not already loaded
      this.initialAiTab = initialTab;
      console.log(this.initialAiTab.name);
    },
    clickAcceptAiNoAbstract: function (prompt) {
      this.hasAcceptedAi = true;
      this.$refs.SummarizeArticleNoAbstractComponent.$emit(
        "SummarizeArticleNoAbstract",
        prompt
      );
      console.log("emitting SummarizeArticleNoAbstract", prompt);
      console.log("Prompt name: ", prompt.name);
    },
    closeSummaries: function () {
      this.hasAcceptedAi = false;
    },
    checkPreload: function () {
      if (!this.abstractLoaded && this.preLoadAbstract && !this.loading) {
        this.loadAbstract((showSpinner = false));
      }
    },
    onEventBusShowAbstractEvent: function (args) {
      if (args.$el != this.$el) return;
      this.showAbstract(true);
    },
    onAiSummariesClickRetry: function () {
      this.$el.scrollIntoView({ behavior: "smooth" });
    },
    changeOnEnter: function (event) {
      event.target.click();
    },
  },
  computed: {
    getIsPubTypeAllowed: function () {
      return this.isPubTypeAllowed;
    },
    getPromptLanguageType: function () {
      return this.initialAiTab.name;
    },
    getIsLicenseAllowed() {
      return this.isLicenseAllowed;
    },
    getIsResourceAllowed() {
      return this.isResourceAllowed;
    },
    getUsePDFsummaryFlag: function () {
      return this.appSettings.openAi.usePDFsummary;
    },
    getButtonText: function () {
      if (this.hasAbstract) {
        if (this.showingAbstract) {
          return this.getString("hideAbstract");
        } else {
          return this.getString("showAbstract");
        }
      } else {
        if (this.showingAbstract) {
          return this.getString("hideInfo");
        } else {
          return this.getString("showInfo");
        }
      }
    },
    getComponentWidth: function () {
      return (
        this.checkIfMobile || (this.parentWidth < 520 && this.parentWidth != 0)
      );
    },
    getPubMedLink: function () {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/" +
        this.pmid +
        "/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        ""
      );
    },
    getDoiLink: function () {
      if (this.doi) {
        return "https://doi.org/" + this.doi;
      }
    },
    getPubmedRelated: function () {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        "&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
        this.pmid
      );
    },
    getPubmedRelatedReviews: function () {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        "&filter=pubt.systematicreview&linkname=pubmed_pubmed&sort=relevance&from_uid=" +
        this.pmid
      );
    },
    getPubmedAlsoViewed: function () {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        "&linkname=pubmed_pubmed_alsoviewed&sort=relevance&from_uid=" +
        this.pmid
      );
    },
    getUnpaywall: function () {
      if (this.doi) {
        return "https://unpaywall.org/" + this.doi;
      }
    },
    /**
     * Check api response for the url for the pdf version of the article
     */
    getHasOaPdf: function () {
      if (!this.unpaywallResponse) return false;
      if (!this.unpaywallResponse["best_oa_location"]) return false;

      const url_for_pdf =
        this.unpaywallResponse["best_oa_location"]["url_for_pdf"];

      if (!url_for_pdf) {
        this.pdfUrl = undefined;
        return false;
      }

      this.pdfUrl = url_for_pdf;
      console.log("url_for_pdf:", this.pdfUrl);

      return true;
    },
    /**
     * Check api response for the url for the html version of the article
     */
    getHasOaHtml: function () {
      if (!this.unpaywallResponse) return false;
      if (!this.unpaywallResponse["best_oa_location"]) return false;

      const url_for_landing_page =
        this.unpaywallResponse["best_oa_location"]["url_for_landing_page"];

      if (!url_for_landing_page) {
        this.htmlUrl = undefined;
        return false;
      }

      this.htmlUrl = url_for_landing_page;
      console.log("url_for_landing_page", this.htmlUrl);
      return true;
    },

    getOaHtml: function () {
      if (this.getHasOaHtml) {
        return this.unpaywallResponse.best_oa_location.url_for_landing_page;
      }
    },
    getOaPdf: function () {
      if (this.getHasOaPdf) {
        return this.unpaywallResponse.best_oa_location.url;
      }
    },
    getGoogleScholar: function () {
      if (this.pmid != null) {
        return "https://scholar.google.com/scholar_lookup?pmid=" + this.pmid;
      } else {
        return "https://scholar.google.com/scholar_lookup?doi=" + this.doi;
      }
    },
    getTitle: function () {
      var div = document.createElement("div");
      div.innerHTML = this.title;
      var text = div.textContent || div.innerText || "";

      return text.replace(/<\/?[^>]+(>|$)/g, "");
    },
    // Added by Ole (getBookTitle and getVernacularTitle also added in template)
    getBookTitle: function () {
      var div = document.createElement("div");
      div.innerHTML = this.booktitle;
      var text = div.textContent || div.innerText || "";
      return text.replace(/<\/?[^>]+(>|$)/g, "");
    },
    getVernacularTitle: function () {
      if (this.vernaculartitle) {
        var div = document.createElement("div");
        div.innerHTML = this.vernaculartitle;
        var text = div.textContent || div.innerText || "";
        return text.replace(/<\/?[^>]+(>|$)/g, "");
      }
    },
    //
    calculateAuthors: function () {
      authorArray = this.author.split(",");
      if (!this.shownSixAuthors || authorArray.length <= 6) return this.author;
      shownAuthors = "";
      for (i = 0; i < 6; i++) {
        if (i > 0) shownAuthors += ",";
        shownAuthors += " " + authorArray[i];
      }
      shownAuthors += ", et al";
      return shownAuthors;
    },
    getScreenWidth: function () {
      var width =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;

      var heigth =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;

      return width;
    },
    checkIfMobile: function () {
      let check = false;
      (function (a) {
        if (
          /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
            a
          ) ||
          /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
            a.substr(0, 4)
          )
        )
          check = true;
      })(navigator.userAgent || navigator.vendor || window.opera);
      return check;
    },
    mobileResult: function () {
      if (this.getDoiLink) return { "flex-direction": "row" };
    },
    showArticleButtons: function () {
      return this.showButtons;
    },
    usePubMed: function () {
      if (this.id == this.pmid) return true;
      return false;
    },
    getAbstractId: function () {
      divName = this.getAbstractDivName;
      return divName + "_" + this._uid;
    },
    getHyperLink: function () {
      return this.hyperLink;
    },
    getAbstractDivName: function () {
      return this.id != null ? "abstract_" + this.id : "custom";
    },
    getSource: function () {
      var source = this.source || "";
      var pubDate = this.pubDate || "";
      var sourceDateSeperator = source && pubDate ? ". " : "";
      var volume = ";" + this.volume || "";
      var issue = "(" + this.issue + ")" || "";
      var pages = ":" + this.pages || "";

      return source + sourceDateSeperator + pubDate + volume + issue + pages;
    },
    getAbstract: function () {
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
    getArticle: function () {
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
    getArticlesPromise: async function () {
      var articles = [this.getArticle];
      return Promise.resolve(articles);
    },
  },
  created: function () {
    this.$parent.$on("abstractLoaded", this.setAbstract);

    var list = document.getElementsByTagName("script");
    var j = list.length,
      i = j;
    var altmetric = false,
      dimension = false;
    while (i--) {
      if (list[i].id === "dimension") {
        dimension = true;
        break;
      }
    }
    while (j--) {
      if (list[j].id === "altmetric") {
        altmetric = true;
        break;
      }
    }
    var altmetricJsScript = list.namedItem("altmetric-embed-js");

    // if we didn't already find it on the page, add it
    if (!dimension) {
      let script = document.createElement("script");
      script.setAttribute("src", "https://badge.dimensions.ai/badge.js");
      script.setAttribute("id", "dimension");
      script.setAttribute("data-cookieconsent", "statistics");
      script.async = true;
      document.head.appendChild(script);
      let link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("href", "https://badge.dimensions.ai/badge.css");
      document.head.appendChild(link);
    } /**/
    if (!altmetric) {
      let script = document.createElement("script");
      script.setAttribute("type", "text/javascript");
      script.setAttribute(
        "src",
        "https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js"
      );
      script.setAttribute("id", "altmetric");
      script.setAttribute("data-cookieconsent", "statistics");
      document.head.appendChild(script);
    }
    if (altmetricJsScript) {
      altmetricJsScript.setAttribute("data-cookieconsent", "statistics");
    }
  },
  mounted: function () {
    // This is to ensure all badges to be loaded properly
    // given there are multiple occurrences of <specific-articles/>

    self = this;
    if (this.id != null) {
      this.abstractId = `abstract${this.id}`;
    } else {
      this.abstractId = "custom";
    }
    this.checkPreload();
    this.$emit("loadAbstract", this.id);

    eventBus.$on(
      "result-entry-show-abstract",
      this.onEventBusShowAbstractEvent
    );
  },

  beforeUpdate: function () {
    this.checkPreload();
  },
  beforeDestroy: function () {
    eventBus.$off(
      "result-entry-show-abstract",
      this.onEventBusShowAbstractEvent
    );
    this.$parent.$off("abstractLoadeds", this.setAbstract);
  },
  watch: {
    abstract: function () {
      this.$emit("articleUpdated", this.getArticle);
    },
    text: function () {
      this.$emit("articleUpdated", this.getArticle);
    },
    async unpaywallResponseLoaded(newVal) {
      if (newVal) {
        const isLicenseAllowed = this.checkLicense();
        if (isLicenseAllowed) {
          await this.checkRessource();
          this.checkPubType();
        }
      }
    },
  },
  template: /*html*/ `
	<div class="qpm_ResultEntry" :name="id" ref="result"> 
    <Spinner :loading="loading"></Spinner> 
      <p class="qpm_resultentryDate" v-if="showDate">{{date}}</p> 
      	<div lang="en"> 
        	<div class="qpm_resultChangeOrder"> 
				<div class="d-flex"> 
					<input 
						v-if="selectable && hasAbstract"
						type="checkbox" 
						class="qpm_selectArticleCheckbox" 
						style="margin-left: -30px"
						:id="\'qpm_selectArticleCheckbox_\' + id" 
						:name="\'qpm_selectArticleCheckbox_\' + id"  
						:checked="isChecked" 
						:value="value" 
						@change="updateInput" 
						@keyup.enter="changeOnEnter"
					/> 
					<div style="margin-bottom: 10px"> 
					    <label :for="selectable && hasAbstract ? \'qpm_selectArticleCheckbox_\' + id : null"> 
						<p style="display: inline" class="qpm_resultTitle" v-if="showArticleButtons || !hasAbstract">
						{{getTitle}}<span v-if="!getTitle">{{getBookTitle}}</span>
						</p>					    	
					<p style="display: inline" class="qpm_resultTitle qpm_resultTitleHover" v-if="!showArticleButtons && hasAbstract" @click="showAbstract"><span v-if="getVernacularTitle && (getVernacularTitle != getTitle)">{{getVernacularTitle}}<br /></span>{{getTitle}}<span v-if="!getTitle">{{getBookTitle}}</span></p> 
						</label> 
						<p v-if="appSettings.openAi.useAi" style="display: inline" class="qpm_translateTitleLink qpm_ai_hide"><a v-if="language != \'en\'" @click="() => translationShowing = !translationShowing">{{translationShowing ? getString(\'hideTranslatedTitle\') : getString(\'showTranslatedTitle\')}}</a></p> 
					</div> 
				</div> 
			    <Translation :showingTranslation="translationShowing" :title="getTitle ? getTitle : (getBookTitle ? getBookTitle : getVernacularTitle)""></Translation>
        	    <div style="line-height: 1.5em"> 
        	        <p class="qpm_resultAuthors"> 
        	            <span v-if="calculateAuthors">{{calculateAuthors}}.</span> 
        	            <span v-if="!calculateAuthors"><i>{{getString('noAuthorsListed')}}</i></span> 
        	            <br/> 
        	        </p> 
        	    </div> 
        	</div> 
        	<div style="line-height: 1.5em"> 
        	    <p class="qpm_resultSource"> 
        	        <span v-if="source">{{source}}</span><span v-if="source && pubDate">. </span><span v-if="pubDate">{{pubDate}}</span><span v-if="volume">;{{volume}}</span><span v-if="issue">({{issue}})</span><span v-if="pages">:{{pages}}</span>. 
        	    </p> 
        	</div> 
      	</div> 
      	<div v-if="getComponentWidth" style="display: flex; flex-direction: column-reverse"> 
        	<div v-if="showArticleButtons" class="qpm_resultButtons_mobile" :style="mobileResult"> 
        		<button v-if="hasAbstract || pmid || doi" v-tooltip="{content: getString(\'hoverShowAbstractButton\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}" class="qpm_button qpm_slim" :class="[showingAbstract ? \'qpm_active\' : \'\',  hasAbstract ? \'qpm_abstract\' : \'qpm_noAbstract\']" @click="showAbstract">{{getButtonText}}</button> 
        		<button v-if="pmid != null" v-tooltip="{content: getString(\'hoverOpenInPubMedButton\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}" class="qpm_button qpm_slim" @click="gotosite(getPubMedLink)">{{getString(\'openInPubMed\')}}</button> 
        		<button v-if="getDoiLink" v-tooltip="{content: getString(\'hoverOpenDOIButton\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}" class="qpm_button qpm_slim" @click="gotosite(getDoiLink)">{{getString(\'openDoi\')}}</button> 
        	</div> 
        	<div v-if="id != ''" class="qpm_badges_mobile rs_skip"> 
        	  <div v-if="usePubMed" class="qpm_badges_mobile_grid"> 
        		<span v-if="showAltmetricBadge" class="altmetric-embed qpm_altmetrics" data-badge-type="1" data-hide-no-mentions="true" data-link-target="_blank" :data-doi="doi" :data-pmid="pmid"></span> 
        	    <span v-if="showDimensionsBadge" class="__dimensions_badge_embed__ qpm_dimensions" data-style="large_rectangle" data-hide-zero-citations="true" data-legend="never" :data-doi="doi" :data-pmid="pmid"></span> 
        	  </div> 
        	  <div v-else> 
        	    <span v-if="showAltmetricBadge" class="altmetric-embed qpm_altmetrics" data-badge-type="1" data-hide-no-mentions="true" data-link-target="_blank" :data-doi="doi"></span> 
        	    <span v-if="showDimensionsBadge" class="__dimensions_badge_embed__ qpm_dimensions" data-style="large_rectangle" data-hide-zero-citations="true" data-legend="never" :data-doi="doi"></span> 
        	  </div> 
        	</div> 
        </div> 
        <div v-else> 
        	<div v-if="showArticleButtons" class="qpm_resultButtons"> 
            	<button v-if="hasAbstract || pmid || doi" v-tooltip="{content: getString(\'hoverShowAbstractButton\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}" class="qpm_button qpm_slim" :class="[showingAbstract ? \'qpm_active\' : \'\',  hasAbstract ? \'qpm_abstract\' : \'qpm_noAbstract\']" @click="showAbstract">{{getButtonText}}</button> 
            	<button v-if="pmid != undefined" v-tooltip="{content: getString(\'hoverOpenInPubMedButton\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}" class="qpm_button qpm_slim" @click="gotosite(getPubMedLink)">{{getString(\'openInPubMed\')}}</button> 
            	<button v-if="getDoiLink" v-tooltip="{content: getString(\'hoverOpenDOIButton\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}" class="qpm_button qpm_slim" @click="gotosite(getDoiLink)">{{getString(\'openDoi\')}}</button> 
          	</div> 
          	<div v-if="id != null" class="qpm_badges rs_skip"> 
            	<div v-if="usePubMed"> 
              		<span v-if="showAltmetricBadge" class="altmetric-embed qpm_altmetrics" data-badge-type="donut" data-badge-popover="left" data-hide-no-mentions="true" data-link-target="_blank" :data-doi="doi" :data-pmid="pmid"></span> 
              		<span v-if="showDimensionsBadge" class="__dimensions_badge_embed__ qpm_dimensions" data-style="small_circle" data-hide-zero-citations="true" data-legend="hover-top" :data-doi="doi" :data-pmid="pmid"></span> 
            	</div> 
            	<div v-else> 
              		<span v-if="showAltmetricBadge" class="altmetric-embed qpm_altmetrics" data-badge-type="donut" data-badge-popover="left" data-hide-no-mentions="true" data-link-target="_blank" :data-doi="doi"></span> 
              		<span v-if="showDimensionsBadge" class="__dimensions_badge_embed__ qpm_dimensions" data-style="small_circle" data-hide-zero-citations="true" data-legend="hover-top" :data-doi="doi"></span> 
            	</div> 
          	</div> 
        </div> 
        <p v-if="hyperLink != null && hyperLink.length > 0" class="intext-arrow-link onHoverJS qpm_pubmedLink"><a target="_blank" :href="getHyperLink">{{hyperLinkText != undefined ? hyperLinkText : hyperLink}}</a></p> 
        <div class="qpm_abstract qpm_abstractContainer" v-bind:name="getAbstractDivName" v-bind:id="getAbstractId" v-bind:class="{qpm_toggleAbstract : showingAbstract}"> 
			<div> 
			
        <div lang="en" v-show="showingAbstract" style="position: relative; margin-top: 0"> 
					<Accordion 
						v-if="appSettings.openAi.useAi && hasAbstract" 
						class="qpm_ai_hide qpm_accordions" 
					>  
						<template v-slot:header="accordionProps"> 
							<div class="qpm_aiAccordionHeader" style="padding-left: 15px; display: inline-flex;"> 
								<i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i> 
								<i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i> 
								<i class="bx bx-detail" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i> 
								<div>
								    <strong>{{getString("selectedResultAccordionHeader")}}</strong> 
								    <button class="bx bx-info-circle" style="cursor: help; margin-left: -5px; vertical-align: top;" v-tooltip="{content: getString(\'hoverselectedResultAccordionHeader\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"></button> \
								</div>
							</div> 
						</template> 
						<template> 
							<div class="qpm_ai_hide"> 
								<keep-alive>
									<div v-if="!hasAcceptedAi && hasAbstract" class="qpm_searchSummaryText qpm_searchSummaryTextBackground"> 
										<p>{{getString(\'aiSummarizeAbstractButton\')}}</p>
										<p><strong>{{getString(\'aiSummarizeSearchResultButton\')}}</strong></p> 
										<button v-for="prompt in getAbstractSummaryPrompts()" 
											class="qpm_button qpm_summaryButton" 
											@click="clickAcceptAi(prompt)" 
											v-tooltip="{content: getString(\'hoverSummarizeSearchResultButton\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}" 
											><i class="bx bx-detail" style="font-size: 22px; line-height: 0; margin: -4px 2px 0 0"></i> {{getTranslation(prompt)}} 
										</button>
										<p class="qpm_summaryDisclaimer" v-html="getString(\'aiSummaryConsentText\')"></p>
									</div> 

                  <!-- AI Summaries of abstract-->
									<ai-summaries v-else-if="hasAcceptedAi" 
                    :license="license" 
                    :isLicenseAllowed="getIsLicenseAllowed" 
                    :isResourceAllowed="getIsResourceAllowed"
                    :isPubTypeAllowed="getIsPubTypeAllowed"
                    :showSummarizeArticle="true"
                    :pubType="pubType"
                    :pdfUrl="pdfUrl"
                    :htmlUrl="htmlUrl"
										:language="language" 
										:prompts="getAllPrompts()" 
										:summarySearchSummaryConsentText="getString('aiSearchSummaryConsentHeader')" 
										:summaryConsentHeader="getString('aiAbstractSummaryConsentHeader')" 
										:successHeader="getString('aiSummarizeAbstractResultHeader')" 
										:errorHeader="getString('aiSummarizeAbstractErrorHeader')" 
										:hasAcceptedAi="hasAcceptedAi" 
										:initialTabPrompt="initialAiTab"
										:getSelectedArticles="getArticleAsArray" 
										:checkForPdf=true
										@close="closeSummaries" 
										@ai-summaries-click-retry="onAiSummariesClickRetry" 
									/> 
								</keep-alive>
							</div> 
						</template> 
					</Accordion>
          <p v-if="(isResourceAllowed === undefined) && !hasAbstract" style="margin-left: 20px; margin-top: 15px;">{{getString('loadingText')}}</p>
          <p v-else-if="!appSettings.openAi.useAi  && !hasAbstract" style="margin-left: 20px; margin-top: 15px;">{{getString('summarizeArticleNotAvailable')}}</p>
          <p v-else-if="!isPubTypeAllowed  && !hasAbstract" style="margin-left: 20px; margin-top: 15px;">{{getString('summarizeArticleNotAvailable')}}</p>
          <p v-else-if="!isLicenseAllowed && !hasAbstract" style="margin-left: 20px; margin-top: 15px;">{{getString('summarizeArticleNotAvailable')}}</p>
          <p v-else-if="!isResourceAllowed && !hasAbstract" style="margin-left: 20px; margin-top: 15px;">{{getString('summarizeArticleNotAvailable')}}</p>
          <p v-else-if="isLicenseAllowed === undefined && !hasAbstract" style="margin-left: 20px; margin-top: 15px;">{{getString('summarizeArticleNotAvailable')}}</p>
         
          <Accordion 
						v-else-if="appSettings.openAi.useAi && !hasAbstract && getIsPubTypeAllowed && isLicenseAllowed && isResourceAllowed" 
						class="qpm_ai_hide qpm_accordions" 
					>  
						<template v-slot:header="accordionProps"> 
							<div class="qpm_aiAccordionHeader" style="padding-left: 15px; display: inline-flex;"> 
								<i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i> 
								<i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i> 
								<i class="bx bx-detail" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i> 
								<div>
								    <strong>{{getString("selectedResultAccordionHeaderNoAbstract")}}</strong> 
								    <button class="bx bx-info-circle" style="cursor: help; margin-left: -5px; vertical-align: top;" v-tooltip="{content: getString(\'hoverselectedResultAccordionHeaderNoAbstract\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"/></button> \
								</div>
							</div> 
						</template> 
						<template> 
							<div class="qpm_ai_hide"> 
								<keep-alive>
									<div v-if="!hasAbstract" class="qpm_searchSummaryText qpm_searchSummaryTextBackground"> 
                    <p><strong>{{getString('summarizeArticleNotice')}}</strong></p>
										<p>{{getString(\'aiSummarizeArticleButton\')}}</p>
										<button v-for="prompt in getSummarizeArticlePrompt()" 
                      class="qpm_button qpm_summaryButton" 
                      @click="clickAcceptAiNoAbstract(prompt)" 
                      v-tooltip="{content: getString('hoverSummarizeSearchResultButton'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}" 
                      ><i class="bx bx-detail" style="font-size: 22px; line-height: 0; margin: -4px 2px 0 0"></i> {{getTranslation(prompt)}} 
                    </button>
                     <!-- AI Summary of an article when no abstract present-->
                    <summarize-article-no-abstract
                      ref="SummarizeArticleNoAbstractComponent"
                      :pdfUrl="pdfUrl"
                      :htmlUrl="htmlUrl" >                    
                    </summarize-article-no-abstract>
                    <p class="qpm_summaryDisclaimer" v-html="getString(\'aiSummaryConsentText\')"></p>
									</div> 
								</keep-alive>
							</div> 
						</template> 
					</Accordion> 
      
					<div class="qpm_unpaywall"> 
						<template v-if="doi"> 
							<p class="onHoverJS qpm_pubmedLink"> 
								<template v-if="!unpaywallResponseLoaded">
									<spinner :loading="true" :size="15" style="display: inline-block !important; margin-right: 5px;"></spinner><a target="_blank" :href="getUnpaywall" v-tooltip="{content: getString(\'hoverUnpaywall_loading\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString(\'UnpaywallLoading\')}}</a>
								</template> 

								<template v-else-if="getHasOaPdf">
									<i class="bx bxs-file-pdf qpm_pdf-icon" style="color: #D20A0A"></i><a target="_blank" :href="getOaPdf" download v-tooltip="{content: getString(\'hoverUnpaywall_pdf\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString(\'UnpaywallWithPdf\')}}</a>
								</template> 

                <template v-else-if="getHasOaHtml">
									<i class="bx bxs-file-html qpm_pdf-icon" style="color: #A8A8A8"></i><a target="_blank" :href="getOaHtml" download v-tooltip="{content: getString(\'hoverUnpaywall_html\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString(\'UnpaywallWithHtml\')}}</a>
								</template> 

                <template v-else>
									<i class="bx bxs-file-pdf qpm_pdf-icon" style="color: #A8A8A8"></i><a target="_blank" :href="getUnpaywall" v-tooltip="{content: getString(\'hoverUnpaywall_noPdf\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString(\'UnpaywallNoPdf\')}}</a>
								</template> 
							</p> 
						</template> 
					</div> 

					<div class="qpm_abstractWrapper" v-if="abstract === \'\'"> 
						<template v-if="hasAbstract"> 
							<div v-for="(value, name) in text"> 
								<p v-if="name !== \'UNLABELLED\' && name !== \'null\'"><strong>{{ name }}</strong></p> 
								<p v-else><strong>Abstract</strong></p> 
								<p>{{ value }}</p>
							</div>
						</template> 
            <template v-if="!hasAbstract">
              <p style="padding-bottom: 10px">{{ getString("noAbstract")}}</p>
              
            </template>
					</div>
          
					<div class="qpm_abstractWrapper" v-else> 
						<div><p><strong>Abstract</strong></p></div> 
						<p>{{ abstract }}</p> 
					</div>

				</div >
				<div class="qpm_relatedLinks" v-if="(pmid != undefined || doi) && showingAbstract"> 
					<p class="intext-arrow-link onHoverJS qpm_pubmedLink" v-if="pmid != undefined"><a v-if="pmid != undefined" target="_blank" :href="getPubmedRelated" v-tooltip="{content: getString(\'hoverrelatedPubmed\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString('relatedPubmed')}}</a></p> 
					<p class="intext-arrow-link onHoverJS qpm_pubmedLink" v-if="pmid != undefined"><a v-if="pmid != undefined" target="_blank" :href="getPubmedRelatedReviews" v-tooltip="{content: getString(\'hoverrelatedPubmedReviews\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString('relatedPubmedReviews')}}</a></p > 
					<p class="intext-arrow-link onHoverJS qpm_pubmedLink" v-if="pmid != undefined"><a v-if="pmid != undefined" target="_blank" :href="getPubmedAlsoViewed" v-tooltip="{content: getString(\'hoveralsoviewedPubmed\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString('alsoviewedPubmed')}}</a></p > 
					<p class="intext-arrow-link onHoverJS qpm_pubmedLink" v-if="(pmid || doi) != undefined"><a v-if="(pmid || doi) != undefined" target="_blank" :href="getGoogleScholar" v-tooltip="{content: getString(\'hoverGoogleScholar\'), offset: 5, delay:$helpTextDelay, trigger: \'hover\'}">{{ getString('GoogleScholar')}}</a></p > 
				</div>

      </div> 
		</div> 
	</div> 

`,
});

/**
 * Loading spinner with icon
 */
Vue.component("Spinner", {
  props: {
    loading: Boolean,
    loadingComponent: Boolean,
    loadingAbstract: Boolean,
    waitText: String,
    waitDurationDisclaimer: String,
    size: {
      type: Number,
      default: 50,
    },
  },
  computed: {
    condition: function () {
      return this.loadingAbstract || this.loadingComponent;
    },
  },
  template:
    ' \
    <div v-if="loading || condition" class="qpm_loading d-flex flex-column align-items-center justify-items-center">\
	  <p v-if="waitText" style="margin-bottom: 15px">{{waitText}}</p> \
      <svg xmlns="http://www.w3.org/2000/svg" class="qpm_gear" v-bind:width="size" v-bind:height="size" viewBox="0 0 126 126" alt="" role="presentation" aria-labelledby="titlelogo"> \
        <circle cx="63" cy="63" r="63" class="circle5" fill="transparent"></circle> \
        <path class="path11" d="M70.7 62.2c-.4-4.2-4.2-7.3-8.4-6.9-4.7.5-8 5.1-6.6 9.9.9 2.9 3.5 5.1 6.6 5.4 4.9.5 8.9-3.7 8.4-8.4z" fill="#009ce8"></path> \
      <path class="path13" d="M30.6 50.2c-5.8-2.6-11.9-3.6-17.9-3.1-1.2 3.6-1.9 7.5-2.3 11.4 5.1-1 10.5-.6 15.6 1.7 12.9 5.8 18.6 21 12.8 33.9-1.9 4.3-4.9 7.8-8.5 10.3 3 2.4 6.3 4.5 9.9 6.1 3.6-3.3 6.5-7.3 8.6-11.9 8.5-18.4.3-40.1-18.2-48.4z" fill="#009ce8"></path> \
      <path class="path15" d="M50.9 99.5c-2.1 4.6-5 8.7-8.5 12 2.9 1.2 6 2.2 9.1 2.9 2.7-4 4.7-8.5 5.7-13.6 1.7-8.7.2-17.4-3.7-24.6 1.6 7.6.8 15.7-2.6 23.3z" fill="#009ce8"></path> \
      <path class="path17" d="M25.3 62.1c-4.9-2.2-10.1-2.6-14.9-1.5v.5c-.1 3.1.1 6.2.5 9.1 4.7-2.2 10.1-2.9 15.6-1.8 3.8.8 7.2 2.3 10.1 4.5-2.3-4.5-6.2-8.4-11.3-10.8z" fill="#009ce8"></path> \
      <path class="path19" d="M90.3 41.3c5.2-3.7 9.1-8.6 11.6-13.9-2.6-2.9-5.5-5.4-8.7-7.6-1.6 4.9-4.8 9.4-9.3 12.7-11.5 8.3-27.5 5.6-35.8-5.8-2.7-3.8-4.3-8.1-4.7-12.5-3.6 1.5-7.1 3.3-10.2 5.5 1 4.7 3 9.2 6 13.4 11.8 16.3 34.7 20 51.1 8.2z" fill="#009ce8"></path> \
      <path class="path21" d="M33.1 39.1C39.8 45 48 48 56.3 48.2c-7.3-2.5-13.9-7.2-18.8-14-2.9-4.1-5-8.6-6.2-13.3-2.6 1.9-4.9 4.1-7.1 6.5 2.1 4.3 5 8.3 8.9 11.7z" fill="#009ce8"></path> \
      <path class="path23" d="M82.6 30.7c4.3-3.1 7.3-7.4 8.7-12.2-2.7-1.7-5.6-3.2-8.6-4.5-.5 5.2-2.5 10.2-6.2 14.4-2.6 2.9-5.6 5.1-8.9 6.5 5.1.4 10.5-1 15-4.2z" fill="#009ce8"></path> \
      <path class="path25" d="M100.9 57.3c-20.1 2-34.8 20-32.8 40.1.6 6.3 2.9 12.1 6.3 17 3.8-.9 7.5-2.1 11-3.8-3.4-3.9-5.7-8.8-6.3-14.4C77.7 82.1 88 69.5 102 68.1c4.7-.5 9.2.4 13.2 2.2.3-1.9.4-3.8.5-5.7.1-2 0-3.9-.1-5.9-4.6-1.3-9.6-1.9-14.7-1.4z" fill="#009ce8"></path> \
      <path class="path27" d="M79.2 64.5c5.8-5.1 13.2-8.5 21.5-9.3 5-.5 10 0 14.6 1.3-.4-3.2-1.1-6.4-2-9.4-4.8-.4-9.8.2-14.6 1.8-8.4 2.9-15.2 8.5-19.5 15.6z" fill="#009ce8"></path> \
      <path class="path29" d="M86.2 91.8c-1.2-3.7-1.6-7.4-1.2-11-2.9 4.4-4.3 9.7-3.8 15.3.5 5.3 2.8 10 6.2 13.6 2.9-1.5 5.6-3.3 8.1-5.3-4.2-3-7.6-7.3-9.3-12.6z" fill="#009ce8"></path> \
      </svg>\
	  <p v-if="waitDurationDisclaimer">{{waitDurationDisclaimer}}</p> \
    </div>\
  ',
});

/**
 * Tree structrue of all searchable terms.
 * Could be a candidate for refactoring using vue-treeselect // 25-10-2024
 */
Vue.component("search-gallery", {
  mixins: [appSettings],
  data: function () {
    return {
      filters: [],
      subjects: [],
      orders: [],
      isAllToggled: true,
    };
  },
  props: {
    hideTopics: {
      type: Array,
      default: function () {
        return [];
      },
    },
    language: {
      type: String,
      default: "dk",
    },
  },
  created: function () {
    this.filters = filtrer;
    this.subjects = topics;
    this.orders = order;
  },
  methods: {
    blockHasComment: function (block) {
      if (block.searchStringComment[this.language]) return true;
      return false;
    },
    hideOrCollapse: function (className) {
      const elements = document.getElementsByClassName(className);
      for (i = 0; i < elements.length; i++) {
        elements[i].classList.toggle("qpm_collapsedSection");
      }
    },
    toggleAll: function () {
      if (this.isAllToggled) {
        var subjectSections = document.getElementsByClassName(
          "qpm_subjectSearchStrings"
        );
        for (i = 0; i < subjectSections.length; i++) {
          subjectSections[i].classList.remove("qpm_collapsedSection");
        }
        var searchGroups = document.getElementsByClassName("qpm_searchGroups");
        for (j = 0; j < searchGroups.length; j++) {
          searchGroups[j].classList.remove("qpm_collapsedSection");
        }
        var searchSubjects =
          document.getElementsByClassName("qpm_searchSubject");
        for (k = 0; k < searchSubjects.length; k++) {
          searchSubjects[k].classList.remove("qpm_collapsedSection");
        }

        var filterSections = document.getElementsByClassName(
          "qpm_filterSearchStrings"
        );
        for (i = 0; i < filterSections.length; i++) {
          filterSections[i].classList.remove("qpm_collapsedSection");
        }
        var filterGroups = document.getElementsByClassName("qpm_filterGroups");
        for (j = 0; j < filterGroups.length; j++) {
          filterGroups[j].classList.remove("qpm_collapsedSection");
        }
        var searchFilters = document.getElementsByClassName("qpm_searchFilter");
        for (k = 0; k < searchFilters.length; k++) {
          searchFilters[k].classList.remove("qpm_collapsedSection");
        }
        this.isAllToggled = false;
      } else {
        var subjectSections = document.getElementsByClassName(
          "qpm_subjectSearchStrings"
        );
        for (i = 0; i < subjectSections.length; i++) {
          subjectSections[i].classList.add("qpm_collapsedSection");
        }
        var searchGroups = document.getElementsByClassName("qpm_searchGroups");
        for (j = 0; j < searchGroups.length; j++) {
          searchGroups[j].classList.add("qpm_collapsedSection");
        }
        var searchSubjects =
          document.getElementsByClassName("qpm_searchSubject");
        for (k = 0; k < searchSubjects.length; k++) {
          searchSubjects[k].classList.add("qpm_collapsedSection");
        }

        var filterSections = document.getElementsByClassName(
          "qpm_filterSearchStrings"
        );
        for (i = 0; i < filterSections.length; i++) {
          filterSections[i].classList.add("qpm_collapsedSection");
        }
        var filters = document.getElementsByClassName("qpm_filterGroups");
        for (j = 0; j < filters.length; j++) {
          filters[j].classList.add("qpm_collapsedSection");
        }
        var searchFilters = document.getElementsByClassName("qpm_searchFilter");
        for (k = 0; k < searchFilters.length; k++) {
          searchFilters[k].classList.add("qpm_collapsedSection");
        }
        this.isAllToggled = true;
      }
    },
    getPubMedLink: function (searchString) {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        "&term=" +
        encodeURIComponent(searchString)
      );
    },
    trimSearchString: function (searchString) {
      if (Array.isArray(searchString)) return searchString[0].toString();
      return searchString.toString();
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    // Added by Ole
    customNameLabel: function (option) {
      if (!option.name && !option.groupname) return;
      if (option.translations) {
        lg = this.language;
        constant =
          option.translations[lg] != undefined
            ? option.translations[lg]
            : option.translations["dk"];
      } else {
        constant = option.name;
      }
      return constant;
    },
    isHiddenTopic: function (topicId) {
      return this.hideTopics.indexOf(topicId) != -1;
    },
    toClassName: function (name) {
      return name.replaceAll(" ", "-");
    },
    sortData: function (data) {
      self = this;
      lang = this.language;
      function sortByPriorityOrName(a, b) {
        if (a.ordering[lang] != null && b.ordering[lang] == null) {
          return -1; // a is ordered and b is not -> a first
        }
        if (b.ordering[lang] != null && a.ordering[lang] == null) {
          return 1; // b is ordered and a is not -> b first
        }

        if (a.ordering[lang] != null) {
          // We know both are non null due to earlier check
          aSort = a.ordering[lang];
          bSort = b.ordering[lang];
        } else {
          // Both are unordered
          aSort = self.customNameLabel(a);
          bSort = self.customNameLabel(b);
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

      for (i = 0; i < data.length; i++) {
        groupName = null;
        if (data[i]["groups"] != null) {
          groupName = "groups";
        } else if (data[i]["choices"] != null) {
          groupName = "choices";
        } else {
          continue;
        }

        data[i][groupName].sort(sortByPriorityOrName); // Sort categories in groups
      }
      data.sort(sortByPriorityOrName); // Sort groups
      return data;
    },
    getShownData: function (data, groupName) {
      self = this;
      function isNotHidden(e) {
        return !self.isHiddenTopic(e.id);
      }

      shown = data.filter(isNotHidden).map(function (e) {
        copy = JSON.parse(JSON.stringify(e));
        copy[groupName] = copy[groupName].filter(isNotHidden);
        return copy;
      });

      return shown;
    },
  },
  computed: {
    getSortedSubjects: function () {
      var shownSubjects = this.getShownData(this.subjects, "groups");
      return this.sortData(shownSubjects);
    },
    getSortedFilters: function () {
      var shownFilters = this.getShownData(this.filters, "choices");
      return this.sortData(shownFilters);
    },
  },
  template: /*html*/ ` 
    <div class="qpm_searchStringCollection"> \
      <p v-if="isAllToggled" class="qpm_advancedSearch qpm_showHideAll" @keyup.enter="toggleAll()" @click="toggleAll()" style="display: flex; justify-content: flex-end"><a tabindex="0">{{getString(\'showAllSearchstrings\')}}</a></p> \
      <p v-if="!isAllToggled" class="qpm_advancedSearch qpm_showHideAll" @keyup.enter="toggleAll()"  @click="toggleAll()" style="display: flex; justify-content: flex-end"><a tabindex="0">{{getString(\'hideAllSearchstrings\')}}</a></p> \
     <div class="qpm_searchStringStringsContainer rich-text"> \
      <div style="padding-top: 5px"> \
         <h2 @click="hideOrCollapse(\'qpm_subjectSearchStrings\')" class="qpm_heading intext-arrow-link">{{getString(\'subjects\')}}</h2> \
      </div> \
      <div v-for="subject in getSortedSubjects" class="qpm_subjectSearchStrings qpm_collapsedSection"> \
        <h3 @click="hideOrCollapse(toClassName(subject.groupname))" class="qpm_heading intext-arrow-link">{{customNameLabel(subject)}}</h3> \
        <div v-for="(group, index) in subject.groups" class="qpm_searchGroups qpm_collapsedSection" :class="[toClassName(subject.groupname), { qpm_maintopicDropdown: group.maintopic, qpm_subtopicDropdown: group.subtopiclevel, qpm_subtopicDropdownLevel2: group.subtopiclevel === 2}]"> \
          <h4 @click="hideOrCollapse(toClassName(group.name))" class="qpm_heading" :class="[{\'intext-arrow-link\': !group.maintopic}]">{{customNameLabel(group)}}</h4> \
          <div class="qpm_searchGroups qpm_collapsedSection qpm_searchSubject" v-bind:class="toClassName(group.name)" v-if="!group.maintopic"> \
            <table class="qpm_table"> \
            <tr> \
                <th>{{getString(\'scope\')}}</th> \
                <th>{{getString(\'searchString\')}}</th> \
            </tr> \
            <tr v-if="group.searchStrings.narrow"> \
                <td><button class="qpm_button qpm_buttonColor1" v-tooltip="{content: getString(\'tooltipNarrow\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{getString(\'narrow\')}}</button></td> \
                <td lang="en"> \
                    <p class="qpm_table_p"> \
                        <a target="_blank" :href="getPubMedLink(group.searchStrings.narrow)" v-tooltip="{content: getString(\'showPubMedLink\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{trimSearchString(group.searchStrings.narrow)}}</a> \
                    </p> \
                </td> \
            </tr> \
            <tr v-if="group.searchStrings.normal"> \
                <td><button class="qpm_button qpm_buttonColor2" v-tooltip="{content: getString(\'tooltipNormal\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{getString(\'normal\')}}</button></td> \
                <td  lang="en"> \
                    <p class="qpm_table_p"> \
                        <a target="_blank" :href="getPubMedLink(group.searchStrings.normal)" v-tooltip="{content: getString(\'showPubMedLink\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{trimSearchString(group.searchStrings.normal)}}</a> \
                    </p> \
                </td> \
            </tr> \
            <tr v-if="group.searchStrings.broad"> \
                <td><button class="qpm_button qpm_buttonColor3" v-tooltip="{content: getString(\'tooltipBroad\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{getString(\'broad\')}}</button></td> \
                <td lang="en"> \
                    <p class="qpm_table_p"> \
                        <a target="_blank" :href="getPubMedLink(group.searchStrings.broad)" v-tooltip="{content: getString(\'showPubMedLink\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{trimSearchString(group.searchStrings.broad)}}</a> \
                    </p> \
                </td> \
            </tr> \
            <tr v-if="blockHasComment(group)"> \
                <th colspan="2">{{getString(\'comment\')}}</th> \
            </tr> \
            <tr v-if="blockHasComment(group)"> \
                <td colspan="2">{{group.searchStringComment[language]}}</td> \
            </tr> \
            </table> \
          </div> \
        </div> \
      </div> \
      <div class="qpm_heading_limits"> \
         <h2 @click="hideOrCollapse(\'qpm_filterSearchStrings\')" class="qpm_heading intext-arrow-link">{{getString(\'filters\')}}</h2> \
      </div> \
      <div v-for="filter in getSortedFilters" class="qpm_filterSearchStrings qpm_collapsedSection "> \
        <h3 @click="hideOrCollapse(toClassName(filter.name))" class="qpm_heading intext-arrow-link">{{customNameLabel(filter)}}</h3> \
		<div v-for="(choice, index) in filter.choices" class="qpm_filterGroups qpm_collapsedSection" :class="[toClassName(filter.name), { qpm_maintopicDropdown: choice.maintopic, qpm_subtopicDropdown: choice.subtopiclevel, qpm_subtopicDropdownLevel2: choice.subtopiclevel === 2}]"> \
		  <h4 @click="hideOrCollapse(toClassName(choice.name))" class="qpm_heading" :class="[{\'intext-arrow-link\': !choice.maintopic}]">{{customNameLabel(choice)}}</h4> \
          <div class="qpm_filterGroup qpm_collapsedSection qpm_searchFilter" :class="toClassName(choice.name)" v-if="!choice.maintopic"> \
            <table class="qpm_table"> \
            <tr> \
                <th>{{getString(\'scope\')}}</th> \
                <th>{{getString(\'searchString\')}}</th> \
            </tr> \
            <tr v-if="choice.searchStrings.narrow"> \
                <td><button class="qpm_button qpm_buttonColor1" v-tooltip="{content: getString(\'tooltipNarrow\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{getString(\'narrow\')}}</button></td> \
                <td lang="en"> \
                    <p class="qpm_table_p"> \
                        <a target="_blank" :href="getPubMedLink(choice.searchStrings.narrow)" v-tooltip="{content: getString(\'showPubMedLink\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{trimSearchString(choice.searchStrings.narrow)}}</a> \
                    </p> \
                </td> \
            </tr> \
            <tr v-if="choice.searchStrings.normal"> \
                <td><button class="qpm_button qpm_buttonColor2" v-tooltip="{content: getString(\'tooltipNormal\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{getString(\'normal\')}}</button></td> \
                <td lang="en"> \
                    <p class="qpm_table_p"> \
                        <a target="_blank" :href="getPubMedLink(choice.searchStrings.normal)" v-tooltip="{content: getString(\'showPubMedLink\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{trimSearchString(choice.searchStrings.normal)}}</a> \
                    </p> \
                </td> \
            </tr> \
            <tr v-if="choice.searchStrings.broad"> \
                <td><button class="qpm_button qpm_buttonColor3" v-tooltip="{content: getString(\'tooltipBroad\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{getString(\'broad\')}}</button></td> \
                <td lang="en"> \
                    <p class="qpm_table_p"> \
                        <a target="_blank" :href="getPubMedLink(choice.searchStrings.broad)" v-tooltip="{content: getString(\'showPubMedLink\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">{{trimSearchString(choice.searchStrings.broad)}}</a> \
                    </p> \
                </td> \
            </tr> \
            <tr v-if="blockHasComment(choice)"> \
                <th colspan="2">{{getString(\'comment\')}}</th> \
            </tr> \
            <tr v-if="blockHasComment(choice)"> \
                <td colspan="2">{{choice.searchStringComment[language]}}</td> \
            </tr> \
            </table> \
          </div> \
        </div> \
      </div> \
     </div> \
    </div> \
  `,
});

/**
 * Enkeltstående artikler
 */
Vue.component("specific-articles", {
  mixins: [appSettings],
  data: function () {
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
  props: {
    ids: String,
    query: String,
    queryResults: Number,
    sortMethod: String,
    hideButtons: {
      type: Boolean,
      default: false,
    },
    showDate: {
      type: Boolean,
      default: false,
    },
    date: String,
    title: String,
    // Added by Ole
    booktitle: String,
    vernaculartitle: String,
    //
    authors: String,
    source: String,
    abstract: String,
    doi: String,
    isCustomDoi: Boolean,
    language: {
      type: String,
      default: "dk",
    },
    hyperLink: {
      type: String,
      default: "",
    },
    hyperLinkText: String,
    sectionedAbstract: Object,
    componentNo: Number,
    shownSixAuthors: Boolean,
    showAltmetricBadge: {
      type: Boolean,
      default: true,
    },
    showDimensionsBadge: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    UnsuccessfullCall: function (value) {
      console.log(value);
      this.faltedIds.push(value);
    },
    setOrder: function (input) {
      const self = this;
      for (i = 0; i < order.length; i++) {
        if (order[i].method === input) {
          self.sort = order[i];
          return;
        }
      }
    },
    getAuthor: function (authors) {
      try {
        if (this.authors) return this.authors;
        str = "";
        for (i = 0; i < authors.length; i++) {
          if (i > 0) str += ",";
          //if (authors[i].authortype != "Author") continue
          str += " " + authors[i].name;
        }
        return str;
      } catch (error) {
        return "";
      }
    },
    getHasAbstract: function (attributes) {
      if (this.abstract || this.sectionedAbstract) return true;
      if (!attributes) {
        return false;
      }
      found = false;
      Object.keys(attributes).forEach(function (key) {
        value = attributes[key];
        if (key == "Has Abstract" || value == "Has Abstract") {
          found = true;
          return;
        }
      });
      return found;
    },
    getDate: function (history) {
      try {
        if (this.date) return this.date;
        for (i = 0; i < history.length; i++) {
          if (history[i].pubstatus == "entrez") {
            date = new Date(history[i].date);
            formattedDate = date.toLocaleDateString(
              languageFormat[this.language],
              dateOptions
            );
            return formattedDate;
          }
        }
        return "";
      } catch (error) {
        return "";
      }
    },
    getTitle: function (std) {
      if (this.title) return this.title;
      return std;
    },
    // Added by Ole (getBookTitle and getVernacularTitle also added in template)
    getBookTitle: function (std) {
      if (this.booktitle) return this.booktitle;
      return std;
    },
    getVernacularTitle: function (std) {
      if (this.vernaculartitle) return this.vernaculartitle;
      return std;
    },
    //
    getDoi: function (searchResult) {
      try {
        if (this.doi || this.isCustomDoi) return this.doi;
        articleids = searchResult.articleids;
        for (i = 0; i < articleids.length; i++) {
          if (articleids[i].idtype == "doi") {
            doi = articleids[i].value;
            return doi;
          }
        }
        return "";
      } catch (err) {
        return undefined;
      }
    },
    // Disabled by Ole
    // getSource: function(value) {
    //   if (value.booktitle) return value.booktitle;
    //   return value.source
    // },
    //
    // Added by Ole (copied from searchresults)
    getSource: function (value) {
      try {
        if (this.source != undefined) {
          if (value != undefined) {
            if (value.volume != undefined) value.volume = undefined;
            if (value.issue != undefined) value.issue = undefined;
            if (value.pages != undefined) value.pages = undefined;
            if (value.pubdate != undefined) value.pubdate = undefined;
          }
          return this.source;
        }
        if (value.booktitle) return value.booktitle;
        return value.source;
      } catch (error) {
        return "";
      }
    },
    //
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    getHyperLink: function () {
      return this.hyperLink;
    },
    getHyperLinkText: function () {
      return this.hyperLinkText;
    },
    getComponentWidth: function () {
      container = this.$refs.singleComponent;
      if (!container?.innerHTML) return;
      // console.log("thing", container, container.offsetWidth);
      return parseInt(container.offsetWidth);
    },
    loadWithIds: function () {
      var self = this;

      if (!self.enteredIds || self.enteredIds.length == 0) {
        this.customLink = this.hyperLink;
        self.searchLoading = false;
        self.loadingComponent = false;
        return;
      }

      var baseUrl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&tool=QuickPubMed&email=admin@videncenterfordiabetes.dk&api_key=258a604944c9858b96739c730cd6a579c908&retmode=json&id=";
      axios
        .get(baseUrl + self.enteredIds.join(","))
        .then(function (resp2) {
          //Create list of returned data
          data = [];
          obj = resp2.data.result;

          if (!obj) {
            console.log("Error: Search was no success", err, resp2);
            self.searchLoading = false;
            return;
          }
          for (i = 0; i < obj.uids.length; i++) {
            data.push(obj[obj.uids[i]]);
          }
          self.searchresult = data;
        })
        .catch(function (err) {
          console.error("There was an error with the network call\n", err);
        })
        .then(function () {
          self.loadingComponent = false;
        });
    },
    getAbstract: function (id) {
      if (this.abstractRecords[id] != undefined) {
        if (typeof this.abstractRecords[id] !== "string") {
          return "";
        }
        return this.abstractRecords[id];
      }
      return "";
    },
    getText: function (id) {
      if (id != undefined) {
        if (
          this.abstractRecords[id] != undefined &&
          typeof this.abstractRecords[id] === "object"
        ) {
          return this.abstractRecords[id];
        }
      }
      return {};
    },

    loadAbstracts: async function () {
      const self = this;
      let nlm = this.appSettings.nlm;
      baseurl =
        "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&tool=QuickPubMed" +
        "&email=" +
        nlm.email +
        "&api_key=" +
        nlm.key +
        "&retmode=xml&id=";

      url = baseurl + self.enteredIds.join(",");
      let axiosInstance = axios.create({
        headers: { Accept: "application/json, text/plain, */*" },
      });
      axiosInstance.interceptors.response.use(undefined, (err) => {
        const { config, message } = err;

        if (!config || !config.retry) {
          console.log("request retried too many times", config.url);
          return Promise.reject(err);
        }

        // retry while Network timeout or Network Error
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
        .get(url, { retry: 10 })
        .then(function (resp) {
          data = resp.data;
          if (window.DOMParser) {
            parser = new DOMParser();
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
            sections = article.getElementsByTagName("AbstractText");
            if (sections.length == 1) {
              let abstractText = sections[0].textContent;
              return [pmid, abstractText];
            } else {
              let text = {};
              for (i = 0; i < sections.length; i++) {
                sectionName = sections[i].getAttribute("Label");
                sectionText = sections[i].textContent;
                text[sectionName] = sectionText;
              }
              return [pmid, text];
            }
          });

          return articleData;
        })
        .catch(function (err) {
          console.log("Error in fetch from pubMed:", err);
        });

      loadData.then((v) => {
        for (let item of v) {
          this.onAbstractLoad(item[0], item[1]);
        }
      });
    },
    getAbstractSummaryPrompts: function () {
      return abstractSummaryPrompts;
    },
    addIdToLoadAbstract: function (id) {
      this.idswithAbstractsToLoad.push(id);
      if (this.enteredIds[this.enteredIds.length - 1] == id) {
        this.loadAbstracts();
      }
    },
    onAbstractLoad: function (id, abstract) {
      Vue.set(this.abstractRecords, id, abstract);
    },
  },
  created: function () {
    this.loadingComponent = true;
    if (this.queryResults) this.pageSize = parseInt(this.queryResults);
    this.setOrder(this.sortMethod);
    var baseUrl =
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&tool=QuickPubMed&email=admin@videncenterfordiabetes.dk&api_key=258a604944c9858b96739c730cd6a579c908&retmode=json&retmax=" +
      this.pageSize +
      "&retstart=" +
      this.page * this.pageSize +
      "&sort=" +
      this.sort.method +
      "&term=";

    const self = this;
    if (self.ids) {
      idArray = self.ids.split(",");
      for (i = 0; i < idArray.length; i++) {
        idArray[i].trim();
        self.enteredIds.push(idArray[i]);
      }
    }

    if (this.interpretQuery === "") {
      this.loadWithIds();
      this.customLink = this.hyperLink;
      return;
    }

    axios.get(baseUrl + self.interpretQuery).then(function (resp) {
      //Search after idlist
      ids = resp.data.esearchresult.idlist;
      if (ids && ids.length != 0) {
        for (i = 0; i < ids.length; i++) {
          if (!self.enteredIds.includes(ids[i])) self.enteredIds.push(ids[i]);
        }
      }

      self.count = parseInt(resp.data.esearchresult.count);
      self.loadWithIds();
    });

    this.customLink = this.hyperLink;
  },
  computed: {
    getPubMedLink: function () {
      return (
        "https://pubmed.ncbi.nlm.nih.gov/?" +
        "myncbishare=" +
        this.appSettings.nlm.myncbishare +
        "&term=" +
        encodeURIComponent(this.interpretQuery)
      );
    },
    interpretQuery: function () {
      if (!this.query) return "";
      return this.query;
    },
    showArticleButtons: function () {
      return !this.hideButtons;
    },
    isCustom: function () {
      return !this.loadingComponent && this.enteredIds.length == 0;
    },
    getKey: function () {
      return this.doi ? this.doi : null;
    },
    getId: function () {
      return this.ids ? this.ids : null;
    },
    getComponentId: function () {
      return `qpm_SpecificArticle_${this.componentId}`;
    },
  },
  mounted: function () {
    if (this.componentNo == null) {
      this.componentId = this._uid;
    } else {
      this.componentId = this.componentNo;
    }
  },
  updated: function () {
    if (this.loadingComponent) return;

    if (window.__dimensions_embed) {
      window.__dimensions_embed.addBadges();
    }

    var component = this.$refs.singleComponent;
    if (component && window._altmetric_embed_init) {
      window._altmetric_embed_init(component);
    }
  },
  template: /*html*/ `
  <div> \
  <div :id="getComponentId" ref="singleComponent" class="qpm_SpecificArticle"> \
  <Spinner v-bind:loadingComponent=loadingComponent> </Spinner> \
      <div v-if="isCustom"> \
        <ResultEntry \
          :id=getKey \
          :pmid=getId \
          :doi=getDoi(searchresult) \
          :title=getTitle() \
          :pubType = getPubType() \
          :booktitle=getBookTitle() \
          :vernaculartitle=getVernacularTitle() \
          :date=getDate() \
          :source=getSource() \
          :hasAbstract=getHasAbstract() \
          :customAbstract="abstract" \
          :sectionedAbstract=sectionedAbstract \
          :author=getAuthor() \
          :key="getKey" \
          @netFail="UnsuccessfullCall" \
          :showButtons="showArticleButtons"  \
          :showDate=showDate \
          :singleArticle=true \
          :language="language" \
          :hyperLink=getHyperLink() \
          :hyperLinkText=getHyperLinkText() \
          :parentWidth = getComponentWidth() \
          :shownSixAuthors = shownSixAuthors \
          :showAltmetricBadge = showAltmetricBadge \
          :showDimensionsBadge = showDimensionsBadge \
          :abstract="getAbstract(enteredIds)" \
          :text="getText(enteredIds)" \
          :abstractSummaryPrompts="getAbstractSummaryPrompts()" \
          @change:abstractLoad = onAbstractLoad \
          @loadAbstract = addIdToLoadAbstract \
          >\
        </ResultEntry> \
      </div> \
      <div v-else-if="enteredIds.length > 0"> \
          <div v-if="!loadingComponent && !searchresult"> \
              <p><strong>{{getString(\'noArticleAvailable\')}}</strong></p> \
              <p><strong>{{getString(\'tryAgainLater\')}}</strong></p> \
          </div> \
          <ResultEntry v-else v-for="(value, index) in searchresult" \
              :id=value.uid \
              :pmid = value.uid \
              :pubDate = value.pubdate \
              :customAbstract="abstract" \
              :sectionedAbstract="sectionedAbstract" \
              :volume = value.volume \
              :issue = value.issue \
              :pages = value.pages \
              :doi=getDoi(value) \
              :title=getTitle(value.title) \
              :pubType = value.pubtype \
              :booktitle=getBookTitle(value.booktitle) \
              :vernaculartitle=getVernacularTitle(value.vernaculartitle) \
              :date=getDate(value.history) \
              :source=getSource(value) \
              :hasAbstract=getHasAbstract(value.attributes) \
              :author=getAuthor(value.authors) \
              :key=value.uid \
              @netFail="UnsuccessfullCall" \
              :showButtons="showArticleButtons"  \
              :showDate=showDate \
              :singleArticle=true \
              :language="language" \
              :hyperLink="customLink" \
              :hyperLinkText="hyperLinkText" \
              :parentWidth = getComponentWidth() \
              :shownSixAuthors = shownSixAuthors \
              :showAltmetricBadge = showAltmetricBadge \
              :showDimensionsBadge = showDimensionsBadge \
              :abstractSummaryPrompts="getAbstractSummaryPrompts()" \
			        :abstract="getAbstract(enteredIds)" \
		  	      :text="getText(enteredIds)" \
              @change:abstractLoad = onAbstractLoad \
              @loadAbstract = addIdToLoadAbstract  >\
           </ResultEntry> \
      </div> \
    </div> \
    </div> \
    `,
});

Vue.component("Translation", {
  mixins: [appSettings],
  data: function () {
    return {
      translationLoaded: false,
      loading: false,
      writing: false,
      stopGeneration: false,
      text: this.getString("aiTranslationWaitText"),
    };
  },
  watch: {
    async showingTranslation(oldValue, newValue) {
      if (!newValue) {
        await this.showTranslation();
      }
    },
  },
  props: {
    showingTranslation: Boolean,
    title: String,
    useMarkdown: {
      type: Boolean,
      default: true,
    },
  },
  methods: {
    showTranslation: async function () {
      if (this.showingTranslation) {
        if (!this.translationLoaded && !this.loading) {
          await this.translateTitle();
        }
      }
    },
    getString: function (string) {
      lg = this.language;
      constant = messages[string][lg];
      return constant != undefined ? constant : messages[string]["dk"];
    },
    translateTitle: async function (showSpinner = true) {
      this.loading = showSpinner;
      this.stopGeneration = false;
      const self = this;

      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/TranslateTitle";
      var localePrompt = getPromptForLocale(titleTranslationPrompt, "dk");

      const readData = async function (url, body) {
        let answer = "";
        const response = await fetch(url, {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const data = await response.json();
          throw Error(JSON.stringify(data));
        }
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();

        // Stop the spinner now that we are recieving data
        self.loading = false;
        self.writing = true;
        while (true) {
          const { done, value } = await reader.read();
          if (done || self.stopGeneration) {
            break;
          }
          answer += value;

          self.text = answer;
        }
        writing = false;
      };

      await readData(openAiServiceUrl, {
        prompt: localePrompt,
        title: this.title,
        client: self.appSettings.client,
      }).catch(function (error) {
        //TODO handle error properly when it can be known which errors are returned
        self.text = "An unknown error occured: \n" + error.toString();
      });
      this.loading = false;
      this.writing = false;
      this.translationLoaded = true;
    },
    clickCopy: function () {
      var text = this.text;
      navigator.clipboard.writeText(text);
    },
    clickStop: function () {
      this.stopGeneration = true;
    },
    clickRetry: function () {
      if (!this.translationLoaded || this.loading) {
        console.debug(
          "Attempted to retry translation, but refused due to loading state",
          this
        );
        return;
      }
      this.translationLoaded = false;
      this.showTranslation();
    },
    canRenderMarkdown: function () {
      let isVueShowdownRegistered =
        !!this.$options.components["VueShowdown"] ||
        !!this.$options.components["vue-showdown"];
      return isVueShowdownRegistered;
    },
  },
  template: /*html*/ `
	<div v-if="showingTranslation" class="qpm_searchSummaryText qpm_searchSummaryTextBackground qpm_searchTranslatedTitle" style=""> 
		<Spinner :loading=loading style="display: inline-block;"> </Spinner> 
		<div v-if="useMarkdown && canRenderMarkdown">
			<VueShowdown :options="{ smoothLivePreview: true }" :markdown="text" />
		</div>
		<p v-else>{{text}}</p>
		<div style="margin-top: 20px; margin-left: 5px;">
			<button 
				v-if="writing" 
				class="qpm_button" 
				@click="clickStop" 
				v-tooltip="{content: getString(\'hoverretryText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"> <i class='bx bx-stop-circle'></i> {{getString("stopText")}}</button> 
			<button 
		    <button 
				v-if="translationLoaded"
			    class="qpm_button" 
			    @click="clickRetry" 
			    v-tooltip="{content: getString(\'hoverretryText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"> 
			    <i class="bx bx-refresh" style="vertical-align: baseline; font-size: 1em"></i> {{getString("retryText")}}
		    </button> 
		    <button 
			    class="qpm_button" 
			    :disabled="loading" 
			    @click="clickCopy" 
			    v-tooltip="{content: getString(\'hovercopyText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}">
			    <i class="bx bx-copy" style="vertical-align: baseline;"></i> {{getString("copyText")}}
		    </button>
		</div>
		<p v-if="!loading" class="qpm_translationDisclaimer" v-html="getString(\'translationDisclaimer\')"></p> 
	</div> 
	`,
});

const Accordion = Vue.component("Accordion", {
  props: {
    title: {
      type: String,
      required: false,
    },
    models: {
      type: Array,
      required: false,
    },
    openByDefault: {
      type: Boolean,
      default: false,
    },
    onlyUpdateModelWhenVisible: {
      type: Boolean,
      default: false,
    },
    isExpanded: {
      type: Boolean | undefined,
      default: undefined,
      required: false,
    },
  },
  data() {
    return {
      expanded: this.openByDefault,
      shownModels: [],
      modelsChangesPending: [],
    };
  },
  methods: {
    toggleAccordionState: function () {
      if (this.getIsExpanded) {
        this.close();
      } else {
        this.open();
      }
    },
    close: function () {
      this.expanded = false;

      this.$emit("close");
    },
    open: function () {
      this.expanded = true;
      this.$emit("open");

      if (this.onlyUpdateModelWhenVisible) {
        this.updateModelsIfOnScreen();
      }
    },
    calcHeight: function () {
      let content = this.$refs.body.firstElementChild;
      let height = content.scrollHeight;
      return height;
    },
    setFixedHeight: function () {
      let body = this.$refs.body;
      body.style.height = this.calcHeight() + "px";
    },
    removeFixedHeight: function () {
      let body = this.$refs.body;
      body.style.height = null;
    },
    subtractElementHeight: function (el) {
      let body = this.$refs.body;
      let newHeight = body.scrollHeight - el.scrollHeight;
      body.style.height = newHeight + "px";
    },
    beforeLeaveListItem: function (el) {
      if (!this.expanded) return;

      this.setFixedHeight();
    },
    leaveListItem: function (el, done) {
      if (!this.expanded) return;

      this.setFixedHeight();
      el.addEventListener("transitionend", done, { once: true });
    },
    afterLeaveListItem: function (el) {
      if (!this.expanded) return;

      this.removeFixedHeight();
    },
    beforeEnterListItem: function (el) {
      if (!this.expanded) return;

      this.setFixedHeight();
    },
    enterListItem: function (el, done) {
      if (!this.expanded) return;

      this.setFixedHeight();
      el.addEventListener("transitionend", done, { once: true });
    },
    afterEnterListItem: function (el) {
      const elUid = el.attributes.name;
      this.removePendingModelChange(elUid);
      this.$emit("changed:items", el);

      if (!this.expanded) return;

      this.removeFixedHeight();
    },
    beforeLeaveContent: function (el) {
      this.setFixedHeight();
    },
    leaveContent: function (el, done) {
      this.subtractElementHeight(el);
      el.addEventListener("transitionend", done, { once: true });
    },
    enterContent: function (el, done) {
      this.setFixedHeight();
      el.addEventListener("transitionend", done, { once: true });
    },
    afterEnterContent: function (el) {
      this.removeFixedHeight();
      this.$emit("afterOpen", this);
    },
    afterLeaveContent: function (el) {
      this.$emit("afterClose", this);
    },
    isAccordionOnScreen: function () {
      const subject = this.$el;
      const subjectRect = subject?.getBoundingClientRect();
      const viewHeight =
        window.innerHeight || document.documentElement.clientHeight;

      const isSubjectVissible =
        subjectRect?.top <= viewHeight && subjectRect?.bottom >= 0;

      return isSubjectVissible;
    },
    updateModelsIfOnScreen: function () {
      if (this.models != this.shownModels && this.isAccordionOnScreen()) {
        this.$set(this, "shownModels", this.models);
      }
    },
    removePendingModelChange: function (uid) {
      const index = this.modelsChangesPending.indexOf(uid);
      this.modelsChangesPending.splice(index, 1);
    },
  },
  computed: {
    getTitle: function () {
      if (this.title) return this.title;
      return this.expanded ? "close" : "open";
    },
    getIsExpanded: function () {
      const newState = this.isExpanded ?? this.expanded;
      this.$emit("expanded-changed", newState);
      return newState;
    },
  },
  watch: {
    models: function (newModelState, oldModelState) {
      const oldIds = oldModelState.map(function (model) {
        return model.uid;
      });
      const newModels = newModelState
        .map(function (model) {
          return model.uid;
        })
        .filter(function (uid) {
          return oldIds.includes(uid);
        });
      this.modelsChangesPending.splice(this.models.length, 0, ...newModels);

      if (this.onlyUpdateModelWhenVisible) {
        this.updateModelsIfOnScreen();
      } else {
        this.shownModels = newModelState;
      }
    },
  },
  mounted: function () {
    if (this.onlyUpdateModelWhenVisible) {
      window.addEventListener("scroll", this.updateModelsIfOnScreen, {
        passive: true,
      });
      if (this.openByDefault) {
        this.updateModelsIfOnScreen();
      }
    }
  },
  beforeDestroy: function () {
    if (this.onlyUpdateModelWhenVisible) {
      window.removeEventListener("scroll", this.updateModelsIfOnScreen, {
        passive: true,
      });
    }
  },
  template: /*html*/ `
	  <div class="column is-half">
		<div class="qpm_accordion" :class="{ 'not-expanded': !this.getIsExpanded }">
			<div @click="toggleAccordionState" @keypress.enter="toggleAccordionState" tabindex="0">
				<slot 
					name="header" 
					:expanded="getIsExpanded" 
					:toggleAccordionState="toggleAccordionState"
					:close="close"
				>
					<header class="qpm_accordion-header">
						<p class="qpm_accordion-header-title">
						{{getTitle}}
						</p>
						<a class="qpm_accordion-header-icon">
						<span class="icon">
							<i class="fa fa-angle-up"></i>
						</span>
						</a>
					</header>
				</slot>
			</div>
			<transition 
				name="collapse"
				:css="true" 
				@enter="enterContent"
				@before-leave="beforeLeaveContent"
				@after-enter="afterEnterContent"
				@leave="leaveContent"
			>
				<div v-show="getIsExpanded" class="qpm_accordion-content" ref="body">
					<div class="content">
						<slot></slot>
						<transition-group 
							appear
							v-if="shownModels != null && shownModels.length != 0" 
							name="list-fade" 
							tag="div" 
							class="qpm_box"
							:css="true"
							@before-leave="beforeLeaveListItem"
							@leave="leaveListItem"
							@after-leave="afterLeaveListItem"
							@before-enter="beforeEnterListItem"
							@enter="enterListItem"
							@after-enter="afterEnterListItem"
						>
							<div v-if="shownModels.length > 0" v-for="item in shownModels" class="list-fade-item" :key="item.uid" :name="'transition-item-'+item.uid" ref="listItems">
								<slot name="listItem" :model="item"></slot>
							</div>
						</transition-group>
					</div>
				</div>
			</transition>
		</div>
	  </div>
	`,
});

/**
 * Mixin for the default question-to-title mappings in Danish and English.
 *
 * @mixin
 */
const questionsToTitleMap = {
  data() {
    return {
      /**
       * Map of Danish questions to their shortened titles.
       * @type {Object.<string, string>}
       */
      questionShortenMapDanish: {
        "Lav en kort opsummering baseret på artiklens samlede tekst.": "Resumé",
        "Hvad er formålet med denne artikel?": "Formål",
        "Hvilke metoder blev anvendt?": "Metoder",
        "Hvad er resultaterne?": "Resultater",
        "Hvilke konklusioner drages i artiklen?": "Konklusioner",
        "Hvilke styrker og svagheder er der i studiet?": "Styrker og svagheder",
        "Hvilke mulige interessekonflikter har forfatterne til studiet?":
          "Interessekonflikter",
      },
      /**
       * Map of English questions to their shortened titles.
       * @type {Object.<string, string>}
       */
      questionShortenMapEnglish: {
        "Make a short summary based on the article's overall text.": "Summary",
        "What is the purpose of this article?": "Purpose",
        "What methods were used?": "Methods",
        "What are the results?": "Results",
        "What conclusions are drawn in the article?": "Conclusions",
        "What are the strengths and weaknesses of the study?":
          "Strengths and weaknesses",
        "What possible conflicts of interest do the authors of the study have?":
          "Conflicts of interest",
      },
    };
  },
};

/**
 * Mixin for common methods used in both summarize-article and summarize-article-no-abstract components.
 * @mixin
 */
const summarizeArticleService = {
  methods: {
    /**
     * Retrieves a prompt based on the specified language and prompt language type.
     * Can be used in question-for-article for prompting with the questions given by the user,
     * or be used in summarize-article and summarize-article-no-abstract for prompting with the default questions aswell as the genere
     * @param {string} [language="dk"] - The language code for the prompt (default is "dk").
     * @param {string} [promptLanguageType="Hverdagssprog"] - The type of prompt language (default is "Hverdagssprog").
     * @returns {string} - The localized prompt.
     */
    getComposablePrompt(language = "dk", promptLanguageType = "Hverdagssprog") {
      // Find the prompt that matches the languagetype
      let languageSpecificPrompt = summarizeArticlePrompt.find((p) => {
        return promptLanguageType == p.name;
      });

      // Determine the ending text based on the promptName
      let promptEndText;
      if (promptLanguageType == "Hverdagssprog") {
        promptEndText = promptEndTextPlainLanguage[language];
      } else if (promptLanguageType == "Fagsprog") {
        promptEndText = promptEndTextProfessionelLanguage[language];
      }
      console.log(
        "Using prompt rules for domain: ",
        this.appSettings.openAi.domain
      );

      // Load the domain specific rules for the language
      let domainSpecificRules = this.getDomainSpecificPromptRules(
        this.appSettings.openAi.domain,
        language
      );

      // Compose the prompt text with default prompt questions without the user input questions
      let promptText = `${domainSpecificRules} ${promptStartText[language]} ${promptQuestions[language]} ${promptArticleSpecificAnswersOnly[language]} ${promptEndText}`;

      // Compose the prompt text with user questions if userQuestionInput is not empty
      if (this.userQuestionInput) {
        promptText = `${domainSpecificRules} ${promptStartText[language]} ${this.userQuestionInput} ${promptArticleSpecificAnswersOnly[language]} ${promptEndText}`;
      }

      // Sanitize the composed prompt text
      let sanitizedPromptText = sanitizePrompt({
        [language]: promptText,
      });

      languageSpecificPrompt.prompt = sanitizedPromptText[language];

      return languageSpecificPrompt;
    },
    /**
     * Handles the summarization of an article, either in PDF or HTML format.
     *
     * @returns {Promise<void>} A promise that resolves when the summarization is complete.
     * @throws {Error} Throws an error if the summarization process fails.
     */
    async handleSummarizeArticle() {
      try {
        this.isError = false;
        this.errorMessage = undefined;
        this.questions = [];
        this.answers = [];
        this.isLoadingQuestions = true; // Set loading state to true

        if (this.pdfUrl) {
          console.log("PDF article URL: ", this.pdfUrl);
          await this.getSummarizePDFArticle();
        }

        if (this.htmlUrl && !this.pdfUrl) {
          console.log("HTML article URL: ", this.htmlUrl);
          await this.getSummarizeHTMLArticle();
        }

        if (this.isArticle) {
          if (this.questions.length > this.answers.length) {
            // Remove the last question if there's a discrepancy
            console.log(
              `Response contained ${this.questions.length} Q's and ${this.answers.length} A's `
            );
            this.questions.pop();
          }
          console.log({ questions: this.questions, answers: this.answers });
          this.isError = false;
        }
      } catch (error) {
        console.error("Error fetching:", error);
        this.errorMessage = "Netværksfejl prøv igen";
        this.isError = true;
        console.error(this.errorMessage);
      } finally {
        this.isLoadingQuestions = false;
      }
    },
    /**
     * Summarizes an HTML article by sending a request to the relevant backend function.
     *
     * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
     * @throws {Error} Throws an error if the fetch request fails.
     */
    async getSummarizeHTMLArticle() {
      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/SummarizeHTMLArticle";

      const localePrompt = this.getComposablePrompt(
        this.language,
        this.promptLanguageType
      );

      let response = await this.handleFetch(openAiServiceUrl, {
        prompt: localePrompt,
        htmlurl: this.htmlUrl,
        client: self.appSettings.client,
      }).catch(function (error) {
        this.isArticle = false;
        return error;
      });

      response = await response.json();

      this.scrapingError = false;
      this.isArticle = response.isArticle;
      this.questions = response.questions;
      this.answers = response.answers;

      // in case the resource didn't have time to load the javaScript and therefor returned "blank" html
      // Questions and answers will be empty and we set the scrapingError to true to indicate the user should try again
      if (response.questions.length < 1) {
        this.scrapingError = true;
      }

      return response;
    },
    /**
     * Summarizes a PDF article by sending a request to the relevant backend function.
     *
     * @returns {Promise<Object>} A promise that resolves to the response from the OpenAI service.
     * @throws {Error} Throws an error if the fetch request fails.
     */
    async getSummarizePDFArticle() {
      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/SummarizePDFArticle";

      const localePrompt = this.getComposablePrompt(
        this.language,
        this.promptLanguageType
      );

      let response = await this.handleFetch(openAiServiceUrl, {
        prompt: localePrompt,
        pdfurl: this.pdfUrl,
        client: self.appSettings.client,
      }).catch(function (error) {
        this.isArticle = false;
        return error;
      });

      response = await response.json();

      this.isArticle = response.isArticle;
      this.questions = response.questions;
      this.answers = response.answers;
      return response;
    },
    /**
     * For now if the pubType array contains "Editorial" then we don't want to summarize the article
     *
     * @returns {Boolean} Wheter or not the pubtype allows for summarization
     */
    checkPubType: function (pubType) {
      if (pubType && pubType.includes("Editorial")) {
        return false;
      }
      return true;
    },
  },
};

/**
 * Mixin that watches the height of header elements to conditionally apply a left margin to corresponding answer elements.
 *
 * **Usage Requirements:**
 *
 * - **Header Elements**: The elements whose height you want to watch (e.g., question headers) must have a `ref` attribute set to `"headerText"`.
 *   - Example:
 *     ```html
 *     <div ref="headerText" class="header-class">
 *       <!-- Header content -->
 *     </div>
 *     ```
 *
 * - **Answer Elements**: The elements that need the conditional margin applied must use the `getAnswerStyle(index)` method in their `:style` binding.
 *   - Example:
 *     ```html
 *     <div :style="getAnswerStyle(index)" class="answer-class">
 *       <!-- Answer content -->
 *     </div>
 *     ```
 *
 * **Parameters:**
 * - `index` (Number): The index of the current item, typically from a `v-for` loop.
 *
 * **Methods:**
 * - `getAnswerStyle(index)`: Returns the style string to be applied to the answer element based on the height of the corresponding header element.
 *
 * **Description:**
 * This mixin tracks the heights of specified header elements and applies a left margin to the corresponding answer elements if the header's height exceeds a certain threshold (default is 45 pixels). This is useful when you want to adjust the layout dynamically based on content size, such as when headers wrap onto multiple lines.
 */
const questionHeaderHeightWatcherMixin = {
  data() {
    return {
      headerHeights: [],
    };
  },
  mounted() {
    this.updateHeaderHeights();
    window.addEventListener("resize", this.updateHeaderHeights);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateHeaderHeights);
  },
  methods: {
    updateHeaderHeights() {
      // Ensure that $refs.headerText is an array
      const headerRefs = Array.isArray(this.$refs.headerText)
        ? this.$refs.headerText
        : [this.$refs.headerText];
      this.headerHeights = headerRefs.map((element) => {
        return element ? element.clientHeight : 0;
      });
    },
    getAnswerStyle(index) {
      const height = this.headerHeights[index];
      if (height > 45) {
        return "margin-left: 40px;";
      }
      return "";
    },
  },
  watch: {
    questions() {
      this.$nextTick(this.updateHeaderHeights);
    },
  },
};

/**
 * Component for summarizing an article and generating questions based on its content.
 * Used for search results WITH an abstract
 * @component
 */
Vue.component("summarize-article", {
  mixins: [
    appSettings,
    utilities,
    questionsToTitleMap,
    summarizeArticleService,
    questionHeaderHeightWatcherMixin,
  ],
  data: function () {
    return {
      isArticle: false,
      questions: [],
      answers: [],
      isLoadingQuestions: false,
      isError: false,
      errorMessage: "",
      scrapingError: false,
    };
  },
  props: {
    htmlUrl: {
      type: String,
      required: false,
    },
    pdfUrl: {
      type: String,
      required: false,
    },
    language: {
      type: String,
      default: "dk",
    },
    isSummaryLoading: {
      type: Boolean,
      required: false,
    },
    promptLanguageType: {
      type: String,
      default: "Hverdagssprog",
      required: false,
    },
  },
  template: /*html*/ `
  <div ref="container" style="margin-top: 20px">

    <!-- TITLE Notice the entire article can be summarized -->
    <p style="margin-bottom: 20px"> 
      <strong>{{getString('summarizeArticleNotice')}}</strong>
    </p>

    <button 
        class="qpm_button"  
        :disabled="isSummaryLoading || isLoadingQuestions || isError"
        @click="handleSummarizeArticle()"
        v-tooltip="{content: getString(\'hoverAskQuestionText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"> 
        <i class="bx bx-file" style="vertical-align: baseline; font-size: 1em"></i> 
        {{getString("generatePdfQuestionsButtonText")}}
    </button>  
   
    <Spinner 
      class="qpm_searchMore"  
      v-if="isLoadingQuestions" 
      :loading="true" 
      :waitText="getString(\'aiSummaryWaitText\')" 
      :size="35">
    </Spinner>
    
    <div v-if="isArticle">

        <!-- TITLE summarize entire article -->
        <p v-if="(questions.length > 1) && !isLoadingQuestions ">
          <strong>{{getString('summarizeArticleHeader')}}</strong>
        </p>

        <!-- Default questions to summarize an article section -->
        <Accordion
        v-for="(question, index) in questions.slice(0, 7)"
        :key="index"
        :title="questionShortenMapDanish[question] || question"
        :openByDefault="false"
      >
        <template v-slot:header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i>
            <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
            <i class="bx bx-credit-card-front" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i>
             {{ questionShortenMapDanish[question] || question }}
          </div>
        </template>
        <template v-slot:default>
          <div class="answer-text">
            {{ answers[index] }}
          </div>
        </template>
      </Accordion>

      <!-- TITLE for generated article specific questions -->
      <p v-if="questions.length > 7"><strong>{{getString('generateQuestionsHeader')}}</strong></p>

      <!-- Generated article specific questions section -->
      <Accordion
        v-for="(question, index) in questions.slice(7)"
        :key="index + 7"
        :title="questionShortenMapDanish[question] || question"
        :openByDefault="false">

        <template v-slot:header="accordionProps">
          <div ref="headerText" class="qpm_aiAccordionHeader">
            <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i>
            <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
            <i class="bx bx-help-circle" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i>
             {{ question }}
          </div>
        </template>

        <template v-slot:default>
          <div :style="getAnswerStyle(index)" class="answer-text">
            {{ answers[index + 7] }}
          </div>
        </template>
      </Accordion>  

      <!-- User input for asking questions for an article -->
      <question-for-article v-if="!isLoadingQuestions" 
        :pdfUrl="pdfUrl" 
        :htmlUrl="htmlUrl" 
        :language="language"
        :promptLanguageType="promptLanguageType"> 
      </question-for-article>
    </div>    
   
    <p v-if="scrapingError">
      {{getString('scrapingError')}} 
    </p>
    <p 
      v-if="errorMessage" 
      class="error-message">
      {{ errorMessage }}
    </p>
  </div>  
`,
});

/**
 * Component for summarizing an article and generating questions based on its content.
 * Used for search results WITHOUT an abstract
 * @component
 */
Vue.component("summarize-article-no-abstract", {
  mixins: [
    appSettings,
    utilities,
    questionsToTitleMap,
    summarizeArticleService,
    questionHeaderHeightWatcherMixin,
  ],
  data: function () {
    return {
      isArticle: false,
      questions: [],
      answers: [],
      isLoadingQuestions: false,
      isError: false,
      errorMessage: "",
      scrapingError: false,
      promptLanguageType: "",
    };
  },
  props: {
    htmlUrl: {
      type: String,
      required: false,
    },
    pdfUrl: {
      type: String,
      required: false,
    },
    language: {
      type: String,
      default: "dk",
    },
  },
  methods: {
    handleOnSummarizeArticleNoAbstract(prompt) {
      console.log("HandleOnSummarizeArticleNoAbstract", prompt);
      this.promptLanguageType = prompt.name;
      this.handleSummarizeArticle();
    },
  },
  created() {
    console.log("Attaching event listener for SummarizeArticleNoAbstract");
    this.$on(
      "SummarizeArticleNoAbstract",
      this.handleOnSummarizeArticleNoAbstract
    );
  },
  template: /*html*/ `
  <div style="margin-top: 20px">        
      <div v-if="isLoadingQuestions" style="height: 250px">
        <Spinner 
          class="qpm_searchMore"  
          v-if="isLoadingQuestions" 
          :loading="true" 
          :waitText="getString(\'aiSummaryWaitText\')" 
          :size="35">
        </Spinner>
      </div>

      <p v-if="(questions.length > 1) && !isLoadingQuestions ">
        <strong>{{getString('summarizeArticleHeader')}}</strong>
      </p>

      <!-- Render the first 7 questions -->
      <Accordion
        v-for="(question, index) in questions.slice(0, 7)"
        :key="index"
        :title="questionShortenMapDanish[question] || question"
        :openByDefault="false"
      >
        <template v-slot:header="accordionProps">
          <div class="qpm_aiAccordionHeader">
            <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i>
            <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
            <i class="bx bx-credit-card-front" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i>
             {{ questionShortenMapDanish[question] || question }}
          </div>
        </template>
        <template v-slot:default>
          <div class="answer-text">
            {{ answers[index] }}
          </div>
        </template>
      </Accordion>

      <!-- Render the title after the first 7 questions -->
      <p v-if="questions.length > 7"><strong>{{getString('generateQuestionsHeader')}}</strong></p>

      <!-- Render the remaining questions -->
      <Accordion
        v-for="(question, index) in questions.slice(7)"
        :key="index + 7"
        :title="questionShortenMapDanish[question] || question"
        :openByDefault="false"
      >
        <template v-slot:header="accordionProps">
          <div ref="headerText" class="qpm_aiAccordionHeader">
            <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i>
            <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
            <i class="bx bx-help-circle" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i>
             {{ questionShortenMapDanish[question] || question }}
          </div>
        </template>
        <template v-slot:default>
          <div :style="getAnswerStyle(index)" class="answer-text">
            {{ answers[index + 7] }}
          </div>
        </template>
      </Accordion>

      <question-for-article v-if="isArticle && !isLoadingQuestions" 
        :pdfUrl="pdfUrl" 
        :htmlUrl="htmlUrl" 
        :language="language"
        :promptLanguageType="promptLanguageType"> 
      </question-for-article>
          
    <p 
      v-if="errorMessage" 
      class="error-message">
      {{ errorMessage }}
    </p>
  </div>  
`,
});

/**
 * Component for enabling users to question an article and generating questions based on its content.
 * Used for search results with and wihtout an abstract.
 * @component
 */
Vue.component("question-for-article", {
  mixins: [
    appSettings,
    utilities,
    summarizeArticleService,
    questionHeaderHeightWatcherMixin,
  ],
  data: function () {
    return {
      questions: [],
      answers: [],
      errorMessage: "",
      isError: false,
      isLoadingResponse: false,
      userQuestionInput: null,
    };
  },
  props: {
    htmlUrl: {
      type: String,
      required: false,
    },
    pdfUrl: {
      type: String,
      required: false,
    },
    promptLanguageType: {
      type: String,
      default: "Hverdagssprog",
    },
    language: {
      type: String,
      default: "dk",
    },
  },
  methods: {
    /**
     * Handles the process of fetching questions and answers for an article, either in PDF or HTML format.
     *
     * @async
     * @function handleQuestionForArticle
     * @returns {Promise<void>} - A promise that resolves when the process is complete.
     * @throws {Error} - Throws an error if the fetching process fails.
     */
    async handleQuestionForArticle() {
      try {
        if (!this.userQuestionInput) {
          this.errorMessage = "Indtast venligst et spørgsmål";
          this.isError = true;
          return;
        }
        this.isError = false;
        this.errorMessage = undefined;
        this.isLoadingResponse = true;
        if (this.pdfUrl) {
          console.log("PDF article URL: ", this.pdfUrl);
          await this.getQuestionPDFArticle();
        }

        if (this.htmlUrl && !this.pdfUrl) {
          console.log("HTML article URL: ", this.htmlUrl);
          await this.getQuestionHTMLArticle();
        }
      } catch (error) {
        console.error("Error fetching:", error);
        this.errorMessage = "Netværksfejl";
        this.isError = true;
        console.error(this.errorMessage);
      } finally {
        this.isLoadingResponse = false;
        this.userQuestionInput = null;
      }
    },
    /**
     * Fetches questions and answers for an HTML article by sending a request to the backend function.
     *
     * @async
     * @function getQuestionHTMLArticle
     * @returns {Promise<Object>} - A promise that resolves to the response from the backend function.
     * @throws {Error} - Throws an error if the fetch request fails.
     */
    async getQuestionHTMLArticle() {
      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/SummarizeHTMLArticle";

      const localePrompt = this.getComposablePrompt(
        this.language,
        this.promptLanguageType
      );

      let response = await this.handleFetch(openAiServiceUrl, {
        prompt: localePrompt,
        htmlurl: this.htmlUrl,
        client: self.appSettings.client,
      }).catch(function (error) {
        return error;
      });

      response = await response.json();

      // Append new questions and answers to the existing arrays using the spread operator
      this.questions = [...this.questions, ...response.questions];
      this.answers = [...this.answers, ...response.answers];
      return response;
    },
    /**
     * Fetches questions and answers for a PDF article by sending a request to the backend function.
     *
     * @async
     * @function getQuestionPDFArticle
     * @returns {Promise<Object>} - A promise that resolves to the response from the backend function.
     * @throws {Error} - Throws an error if the fetch request fails.
     */
    async getQuestionPDFArticle() {
      const openAiServiceUrl =
        this.appSettings.openAi.baseUrl + "/api/SummarizePDFArticle";

      const userQuestionPrompt = this.getComposablePrompt(
        this.language,
        this.promptLanguageType
      );

      let response = await this.handleFetch(openAiServiceUrl, {
        prompt: userQuestionPrompt,
        pdfurl: this.pdfUrl,
        client: self.appSettings.client,
      }).catch(function (error) {
        this.isArticle = false;
        return error;
      });

      response = await response.json();

      // Append new questions and answers to the existing arrays using the spread operator
      this.questions = [...this.questions, ...response.questions];
      this.answers = [...this.answers, ...response.answers];
      return response;
    },
  },
  template: /*html*/ `
  <div style="margin-top: 20px">         
    <p>
      <strong>{{getString('userQuestionsHeader')}}</strong>
    </p>
  
    <Accordion
      v-for="(question, index) in questions"
      :key="index"
      :title="question"
      :openByDefault="true" >
      <template v-slot:header="accordionProps">
        <div ref="headerText" class="qpm_aiAccordionHeader">
          <i v-if="accordionProps.expanded" class="bx bx-chevron-down qpm_aiAccordionHeaderArrows"></i>
          <i v-else class="bx bx-chevron-right qpm_aiAccordionHeaderArrows"></i>
          <i class="bx bx-help-circle" style="font-size: 22px; vertical-align: text-bottom; margin-left: 3px; margin-right: 5px;"></i>
            {{ question }}
        </div>
      </template>
      <template v-slot:default>
        <div :style="getAnswerStyle(index)" class="answer-text">
          {{ answers[index] }}
        </div>
      </template>
    </Accordion>

    <Spinner 
      class="qpm_searchMore"  
      v-if="isLoadingResponse" 
      :loading="true" 
      :waitText="getString(\'aiSummaryWaitText\')" 
      :size="35">
    </Spinner>
    
    <div style="display: flex">
      <input 
        class="question-input" 
        v-model="userQuestionInput" 
        :disabled="isLoadingResponse"
        :placeholder="getString('userQuestionInputPlaceholder')" 
        :title="getString('userQuestionInputHoverText')" 
        v-tooltip="{content: getString(\'userQuestionInputHoverText\'), offset: 5, delay:$helpTextDelay, hideOnTargetClick: false}"
        @keyup.enter="handleQuestionForArticle" />
      <button 
        class="qpm_button"
        style="margin: 10px"
        :disabled="isLoadingResponse"
        @click="handleQuestionForArticle">
        {{getString('askQuestionButtontext')}}
      </button>
    </div>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>
  </div>  
`,
});
