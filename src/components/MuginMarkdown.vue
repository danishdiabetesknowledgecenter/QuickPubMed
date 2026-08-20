<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div v-html="renderedHtml"></div>
</template>

<script>
  import MarkdownIt from "markdown-it";
  import taskLists from "markdown-it-task-lists";
  import { sanitizeHtml } from "@/utils/htmlSanitizer.js";

  const markdownRenderer = new MarkdownIt({
    html: false,
    breaks: true,
    linkify: false,
    typographer: true,
  }).use(taskLists, { enabled: false });

  const defaultLinkOpen =
    markdownRenderer.renderer.rules.link_open ||
    function renderToken(tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  markdownRenderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  export default {
    name: "MuginMarkdown",
    props: {
      markdown: {
        type: String,
        default: "",
      },
      smoothLivePreview: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        displayedMarkdown: "",
        smoothTarget: "",
        revealTimer: null,
      };
    },
    computed: {
      sourceMarkdown() {
        return this.smoothLivePreview
          ? this.displayedMarkdown
          : this.markdown || "";
      },
      renderedHtml() {
        const rendered = markdownRenderer.render(this.sourceMarkdown || "");
        return sanitizeHtml(rendered);
      },
    },
    watch: {
      markdown: {
        immediate: true,
        handler(next) {
          const target = String(next || "");
          if (!this.smoothLivePreview) {
            this.clearRevealTimer();
            this.displayedMarkdown = target;
            this.smoothTarget = target;
            return;
          }
          this.queueSmoothReveal(target);
        },
      },
      smoothLivePreview(enabled) {
        if (!enabled) {
          this.clearRevealTimer();
          this.displayedMarkdown = this.markdown || "";
          return;
        }
        this.queueSmoothReveal(this.markdown || "");
      },
    },
    beforeUnmount() {
      this.clearRevealTimer();
    },
    methods: {
      clearRevealTimer() {
        if (this.revealTimer != null) {
          clearTimeout(this.revealTimer);
          this.revealTimer = null;
        }
      },
      queueSmoothReveal(target) {
        const current = this.displayedMarkdown || "";
        // Replacement / non-continuation: snap instead of animating backwards.
        if (current && !target.startsWith(current)) {
          this.clearRevealTimer();
          this.displayedMarkdown = target;
          this.smoothTarget = target;
          return;
        }
        this.smoothTarget = target;
        if (current.length >= target.length) {
          this.displayedMarkdown = target;
          this.clearRevealTimer();
          return;
        }
        if (this.revealTimer == null) {
          this.tickSmoothReveal();
        }
      },
      tickSmoothReveal() {
        this.revealTimer = null;
        const target = this.smoothTarget || "";
        const current = this.displayedMarkdown || "";
        if (current.length >= target.length) {
          this.displayedMarkdown = target;
          return;
        }
        if (current && !target.startsWith(current)) {
          this.displayedMarkdown = target;
          return;
        }

        const lag = target.length - current.length;
        // Catch up when far behind (chunky upstream), ease when close.
        let step = 2;
        if (lag > 500) step = 28;
        else if (lag > 220) step = 14;
        else if (lag > 90) step = 7;
        else if (lag > 36) step = 4;

        let nextLen = Math.min(target.length, current.length + step);
        // Prefer breaking near whitespace so words don't pop mid-glyph awkwardly.
        if (nextLen < target.length && step > 2) {
          const windowEnd = Math.min(target.length, nextLen + 10);
          const windowText = target.slice(current.length, windowEnd);
          const breakAt = windowText.search(/[\s\n.,;:!?)]/);
          if (breakAt >= 0) {
            nextLen = current.length + breakAt + 1;
          }
        }

        this.displayedMarkdown = target.slice(0, nextLen);
        if (this.displayedMarkdown.length < target.length) {
          this.revealTimer = setTimeout(() => this.tickSmoothReveal(), 18);
        }
      },
    },
  };
</script>
