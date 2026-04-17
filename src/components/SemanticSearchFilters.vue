<template>
  <div class="qpm_simpleFiltersHeader">
    <span class="qpm_keepWithIcon">
      {{ getString("semanticSearchSectionHeader") }}:
      <button
        v-if="getString('hoverSemanticSearchSectionHeader')"
        type="button"
        v-tooltip="{
          content: getString('hoverSemanticSearchSectionHeader'),
          distance: 5,
          delay: helpTextDelay,
          theme: 'infoTooltip',
        }"
        class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
        aria-label="Info"
        @click.stop
      />
    </span>
  </div>
  <div
    v-for="option in semanticOptions"
    :id="'qpm_topic_' + option.id"
    :key="`semantic-${option.id}`"
    class="qpm_simpleFilters"
  >
    <input
      :id="option.id"
      type="checkbox"
      :disabled="getSemanticOptionDisabled(option)"
      :title="getString('checkboxTitle')"
      :value="option.id"
      :checked="isSemanticOptionChecked(option)"
      class="qpm_cursorPointer"
      @change="onSemanticOptionChange(option, $event)"
      @keyup.enter="onSemanticOptionEnter(option)"
    />
    <div class="qpm_infoInline">
      <label :for="option.id">
        <template v-if="getSemanticOptionLabelParts(option).prefix">
          {{ getSemanticOptionLabelParts(option).prefix }}
        </template>
        <span class="qpm_keepWithIcon">
          {{ getSemanticOptionLabelParts(option).last }}
          <button
            v-if="getSemanticOptionTooltip(option)"
            type="button"
            v-tooltip="{
              content: getSemanticOptionTooltip(option),
              distance: 5,
              delay: helpTextDelay,
              theme: 'infoTooltip',
            }"
            class="bx bx-info-circle qpm_cursorHelp qpm_infoIcon"
            aria-label="Info"
            @click.stop
          />
        </span>
      </label>
    </div>
  </div>
  <div class="qpm_simpleFiltersSpacer" />
</template>

<script>
  export default {
    name: "SemanticSearchFilters",
    props: {
      helpTextDelay: {
        type: Number,
        default: 300,
      },
      getString: {
        type: Function,
        default: () => "",
      },
      getSemanticOptionTooltipContent: {
        type: Function,
        default: null,
      },
      getSemanticOptionDisabledState: {
        type: Function,
        default: null,
      },
      searchWithPubMedBestMatch: {
        type: Boolean,
        default: false,
      },
      searchWithSemanticScholar: {
        type: Boolean,
        default: false,
      },
      searchWithOpenAlex: {
        type: Boolean,
        default: false,
      },
      searchWithElicit: {
        type: Boolean,
        default: false,
      },
      availableTranslationSources: {
        type: Array,
        default: () => [],
      },
    },
    emits: ["update-semantic-source"],
    computed: {
      semanticOptions() {
        const options = [
          {
            id: "pubmed",
            labelKey: "searchToggleWithPubMedBestMatch",
            hoverKey: "hoversearchToggleWithPubMedBestMatch",
          },
          {
            id: "semanticScholar",
            labelKey: "searchToggleWithSemanticScholar",
            hoverKey: "hoversearchToggleWithSemanticScholar",
          },
          {
            id: "openAlex",
            labelKey: "searchToggleWithOpenAlex",
            hoverKey: "hoversearchToggleWithOpenAlex",
          },
          {
            id: "elicit",
            labelKey: "searchToggleWithElicit",
            hoverKey: "hoversearchToggleWithElicit",
          },
        ];
        const allowedSources = new Set(
          (Array.isArray(this.availableTranslationSources) ? this.availableTranslationSources : []).map(
            (value) => String(value || "").trim()
          )
        );
        return allowedSources.size > 0
          ? options.filter((option) => allowedSources.has(option.id))
          : options;
      },
    },
    methods: {
      splitLastWord(text) {
        const normalized = String(text || "").trim();
        const lastSpace = normalized.lastIndexOf(" ");
        if (lastSpace < 0) {
          return { prefix: "", last: normalized };
        }
        return {
          prefix: normalized.slice(0, lastSpace) + " ",
          last: normalized.slice(lastSpace + 1),
        };
      },
      getSemanticOptionLabel(option) {
        return this.getString(option?.labelKey || "");
      },
      getSemanticOptionLabelParts(option) {
        return this.splitLastWord(this.getSemanticOptionLabel(option));
      },
      getSemanticOptionTooltip(option) {
        if (typeof this.getSemanticOptionTooltipContent === "function") {
          return this.getSemanticOptionTooltipContent(option);
        }
        return this.getString(option?.hoverKey || "");
      },
      isSemanticOptionChecked(option) {
        if (!option?.id) return false;
        const key = option.id;
        const propName =
          key === "pubmed"
            ? "searchWithPubMedBestMatch"
            : `searchWith${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        return Boolean(this[propName]);
      },
      getSemanticOptionDisabled(option) {
        if (typeof this.getSemanticOptionDisabledState === "function") {
          return this.getSemanticOptionDisabledState(option);
        }
        return false;
      },
      onSemanticOptionChange(option, event) {
        if (this.getSemanticOptionDisabled(option)) {
          return;
        }
        const isChecked = event.target.checked;
        this.updateSemanticSource(option.id, isChecked);
      },
      onSemanticOptionEnter(option) {
        if (this.getSemanticOptionDisabled(option)) {
          return;
        }
        const nextValue = !this.isSemanticOptionChecked(option);
        this.updateSemanticSource(option.id, nextValue);
      },
      updateSemanticSource(sourceKey, value) {
        this.$emit("update-semantic-source", sourceKey, value);
      },
    },
  };
</script>
