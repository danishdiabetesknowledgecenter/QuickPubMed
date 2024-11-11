import Vue from "vue";
import App from "./App.vue";
import VueShowdown from "vue-showdown";
import { VTooltip } from "v-tooltip";

// Import of existing global styles
import "@/assets/styles/qpm-global.css";
import "@/assets/styles/qpm-global-strings.css";

/**
 * Vue.prototype.$dateFormat = "da-DK";
 * en-US for American, en-GB for British, de-DR for German and so on.
 * Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
 */
Vue.prototype.$helpTextDelay = { show: 500, hide: 100 };
Vue.prototype.$alwaysShowFilter = true;

Vue.use(VueShowdown);
Vue.directive("tooltip", VTooltip);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
