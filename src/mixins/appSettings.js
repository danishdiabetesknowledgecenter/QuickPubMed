import mitt from "mitt";
import { settings } from "@/config/settings.js";

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
   * @returns {Settings} A settings object
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
    this._state.appSettings = settings;
  },
};

// Event Bus
export const eventBus = mitt();

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
