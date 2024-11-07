import Vue from "vue";
import App from "./App.vue";

// Import of existing global styles
import "./assets/styles/qpm-global.css";

// Import of static content modules
import * as qpmContent from "./qpm-content.js";
import * as qpmContentDiabetes from "./qpm-content-diabetes.js";
import * as qpmTranslations from "./qpm-translations.js";

// Attach to the window object to make them globally accessible
window.qpmContent = qpmContent;
window.qpmContentDiabetes = qpmContentDiabetes;
window.qpmTranslations = qpmTranslations;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
