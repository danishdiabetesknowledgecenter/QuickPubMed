import { createApp, h } from "vue";
import VueShowdown from "vue-showdown";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";

const showdownConfig = {
  flavor: "github",
  options: {
    emoji: false,
    tables: true,
    strikethrough: true,
    simpleLineBreaks: true,
    tasklists: true,
    smartIndentationFix: true,
    smartypants: true,
    ghMentions: true,
    underline: true,
    completeHTMLDocument: false,
  },
};

export function createConfiguredApp(rootComponent, props) {
  return createConfiguredAppWithOptions(rootComponent, props);
}

export function createConfiguredAppWithOptions(rootComponent, props, options = {}) {
  const { provide, floatingVueOptions, afterFloatingVueInstalled } = options;
  const app = createApp({
    provide,
    render: () => h(rootComponent, props),
  });
  app.use(VueShowdown, showdownConfig);
  const floatingVueConfig = floatingVueOptions || {
    themes: {
      tooltip: {
        html: true,
        triggers: ["hover", "focus", "touch"],
        hideTriggers: (triggers) => [...triggers, "click"],
        delay: {
          show: 200,
          hide: 0,
        },
      },
      infoTooltip: {
        $extend: "tooltip",
        html: true,
        triggers: ["hover", "focus", "click", "touch"],
        hideTriggers: ["hover", "click", "touch"],
        autoHide: true,
      },
    },
  };
  app.use(FloatingVue, floatingVueConfig);
  if (typeof afterFloatingVueInstalled === "function") {
    afterFloatingVueInstalled(app);
  }
  app.config.globalProperties.$helpTextDelay = { show: 500, hide: 100 };
  app.config.globalProperties.$alwaysShowFilter = true;
  return app;
}
