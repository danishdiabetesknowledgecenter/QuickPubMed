// mixins/appSettingsMixin.js
import Vue from "vue";

// App Settings Store
export const appSettingsStore = {
  /**
   * **!!Meant for internal use only!!**
   * The internal representation of the store's state.
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
   * Initializes the state of this store.
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
   * Deep merge objects, later arguments will override earlier ones in cases of duplicate keys.
   *
   * Based on this [Stack Overflow answer](https://stackoverflow.com/a/48218209).
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

// Event Bus
export const eventBus = new Vue();

// Mixin Definition
export const appSettingsMixin = {
  data() {
    return {
      appSettings: appSettingsStore.getAppSettings(),
    };
  },
  methods: {
    // You can add shared methods here if needed
  },
};
