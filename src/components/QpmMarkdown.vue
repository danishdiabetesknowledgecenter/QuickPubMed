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
    name: "QpmMarkdown",
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
    computed: {
      renderedHtml() {
        const rendered = markdownRenderer.render(this.markdown || "");
        return sanitizeHtml(rendered);
      },
    },
  };
</script>
