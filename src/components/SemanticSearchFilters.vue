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
    :class="{ qpm_semanticFilterLocked: option.locked }"
    @click="onSemanticOptionRowClick(option, $event)"
  >
    <input
      :id="option.id"
      type="checkbox"
      :disabled="!option.locked && getSemanticOptionDisabled(option)"
      :aria-disabled="option.locked ? 'true' : null"
      :title="option.locked ? null : getString('checkboxTitle')"
      :value="option.id"
      :checked="!option.locked && isSemanticOptionChecked(option)"
      class="qpm_cursorPointer qpm_semanticFilterCheckbox"
      v-tooltip="getLockTooltipBinding(option)"
      @click="onSemanticOptionInputClick(option, $event)"
      @change="onSemanticOptionChange(option, $event)"
      @keyup.enter="onSemanticOptionEnter(option)"
    />
    <div class="qpm_infoInline">
      <label
        :for="option.id"
        class="qpm_semanticFilterLabel"
        v-tooltip="getLockTooltipBinding(option)"
        @click="onSemanticOptionLabelClick(option, $event)"
      >
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
      <button
        v-if="option.locked"
        type="button"
        v-tooltip="elicitUnlockTooltipBinding"
        class="bx bx-lock-alt qpm_cursorPointer qpm_infoIcon qpm_semanticFilterLockIcon"
        :aria-label="getString('elicitUnlockButtonLabel') || 'Lås op'"
        @click.stop="onElicitUnlockClick"
      />
    </div>
  </div>
  <div class="qpm_simpleFiltersSpacer" />
</template>

<script>
  import { promptForElicitUnlockKey } from "@/config/config.js";

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
      lockedTranslationSources: {
        type: Array,
        default: () => [],
      },
      showElicitUnlockButton: {
        type: Boolean,
        default: false,
      },
    },
    emits: ["update-semantic-source"],
    computed: {
      elicitUnlockTooltipBinding() {
        return {
          content: this.getString("elicitUnlockTooltip") || "Lås op for ekstra AI-kilde",
          distance: 5,
          delay: this.helpTextDelay,
          theme: "infoTooltip",
        };
      },
      normalizedLockedSources() {
        // Locked sources are only surfaced when the integration opted in via
        // data-show-elicit-unlock-button; otherwise the locked row is omitted
        // entirely (which keeps the UI clean on widgets that shouldn't show it).
        if (this.showElicitUnlockButton !== true) return new Set();
        const list = Array.isArray(this.lockedTranslationSources)
          ? this.lockedTranslationSources
          : [];
        return new Set(list.map((value) => String(value || "").trim()).filter(Boolean));
      },
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
        const lockedSources = this.normalizedLockedSources;
        const visibleIds =
          allowedSources.size > 0 || lockedSources.size > 0
            ? new Set([...allowedSources, ...lockedSources])
            : null;
        const visibleOptions = visibleIds
          ? options.filter((option) => visibleIds.has(option.id))
          : options;
        return visibleOptions.map((option) => ({
          ...option,
          locked: lockedSources.has(option.id),
        }));
      },
    },
    methods: {
      getLockTooltipBinding(option) {
        // Always return an object (with a `disabled` flag) instead of toggling
        // between `null` and an object. floating-vue's v-tooltip doesn't always
        // attach hover listeners when the initial value is falsy, so keeping a
        // stable object shape ensures the tooltip shows reliably on re-renders.
        return {
          ...this.elicitUnlockTooltipBinding,
          disabled: !option?.locked,
        };
      },
      onElicitUnlockClick() {
        promptForElicitUnlockKey(this.getString);
      },
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
        if (option?.locked || this.getSemanticOptionDisabled(option)) {
          return;
        }
        const isChecked = event.target.checked;
        this.updateSemanticSource(option.id, isChecked);
      },
      onSemanticOptionEnter(option) {
        if (option?.locked || this.getSemanticOptionDisabled(option)) {
          return;
        }
        const nextValue = !this.isSemanticOptionChecked(option);
        this.updateSemanticSource(option.id, nextValue);
      },
      onSemanticOptionRowClick(option) {
        // Clicks anywhere on a locked row (checkbox, label, lock icon, surrounding
        // area) open the unlock prompt. Non-locked rows handle their own inputs.
        if (option?.locked) {
          this.onElicitUnlockClick();
        }
      },
      onSemanticOptionInputClick(option, event) {
        // Locked checkboxes must not toggle; they open the unlock prompt instead.
        // The checkbox is intentionally not `disabled` (disabled inputs swallow
        // all mouse events including hover, which would break the tooltip).
        if (option?.locked) {
          event.preventDefault();
          event.stopPropagation();
          this.onElicitUnlockClick();
        }
      },
      onSemanticOptionLabelClick(option, event) {
        // The browser fires the associated <input>'s click when a <label> is
        // clicked, so onSemanticOptionInputClick already opens the prompt. Stop
        // the label's own click from bubbling to the row to avoid a second prompt.
        if (option?.locked) {
          event.stopPropagation();
        }
      },
      updateSemanticSource(sourceKey, value) {
        this.$emit("update-semantic-source", sourceKey, value);
      },
    },
  };
</script>
