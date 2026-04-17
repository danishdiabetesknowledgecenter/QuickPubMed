// Import of existing global styles
import "@/assets/styles/styles.css";
import "@/assets/styles/searchform.css";
import "@/assets/styles/searchstrings.css";

import { hideAllPoppers } from "floating-vue";
import SearchForm from "@/components/SearchForm.vue";
import { applyThemeFromConfig, config, loadThemeOverridesFromBackend } from "@/config/config";
import { getAiURL, settings } from "@/config/settings";
import { getSearchFlowDebugFlagFromLocation, normalizeSearchFlowDebugValue } from "@/utils/searchFlowDebug";
import { createConfiguredAppWithOptions } from "./createConfiguredApp";

/**
 * Vue.prototype.$dateFormat = "da-DK";
 * en-US for American, en-GB for British, de-DR for German and so on.
 * Full list https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes
 */

let mobileTooltipScrollGuardInstalled = false;
let keyboardInfoTooltipBehaviorInstalled = false;
const INFO_TOOLTIP_KEYBOARD_CLICK_SUPPRESSION_MS = 250;

function hideShownTooltips() {
  const activeElement = document.activeElement;
  if (
    activeElement &&
    typeof activeElement.closest === "function" &&
    activeElement.closest(".v-popper__popper") &&
    typeof activeElement.blur === "function"
  ) {
    activeElement.blur();
  }
  if (typeof hideAllPoppers === "function") {
    hideAllPoppers();
    return;
  }
  document.querySelectorAll(".v-popper--shown").forEach((el) => {
    const popperComponent = el.__vue__?.[0]?.$refs?.popper;
    if (popperComponent && typeof popperComponent.hide === "function") {
      popperComponent.hide();
    }
  });
}

function getInfoTooltipTrigger(target) {
  if (!(target instanceof Element) || typeof target.closest !== "function") {
    return null;
  }
  const trigger = target.closest(".qpm_infoIcon");
  return trigger instanceof HTMLElement && trigger.$_popper ? trigger : null;
}

function isInfoTooltipShown(element) {
  return Boolean(element?.$_popper?.item?.shown?.value);
}

function hideShownInfoTooltips() {
  document.querySelectorAll(".qpm_infoIcon").forEach((element) => {
    if (!(element instanceof HTMLElement) || !element.$_popper) return;
    if (!isInfoTooltipShown(element)) return;
    element.$_popper.hide();
  });
}

function toggleInfoTooltip(element) {
  if (!(element instanceof HTMLElement) || !element.$_popper) return;
  const wasShown = isInfoTooltipShown(element);
  hideShownInfoTooltips();
  if (!wasShown) {
    element.$_popper.show();
  }
}

function suppressNextInfoTooltipClick(element) {
  if (!(element instanceof HTMLElement)) return;
  element._qpmSuppressTooltipClickUntil = Date.now() + INFO_TOOLTIP_KEYBOARD_CLICK_SUPPRESSION_MS;
}

function shouldSuppressInfoTooltipClick(element) {
  if (!(element instanceof HTMLElement)) return false;
  return Number(element._qpmSuppressTooltipClickUntil || 0) > Date.now();
}

function installKeyboardInfoTooltipBehavior() {
  if (keyboardInfoTooltipBehaviorInstalled) return;
  keyboardInfoTooltipBehaviorInstalled = true;

  document.addEventListener(
    "keydown",
    (event) => {
      const trigger =
        getInfoTooltipTrigger(event.target) || getInfoTooltipTrigger(document.activeElement);
      if (!trigger || event.key !== "Enter") return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      suppressNextInfoTooltipClick(trigger);
      hideShownTooltips();
    },
    true
  );

  document.addEventListener(
    "click",
    (event) => {
      const trigger = getInfoTooltipTrigger(event.target);
      if (!trigger || !shouldSuppressInfoTooltipClick(trigger)) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === "function") {
        event.stopImmediatePropagation();
      }
      trigger._qpmSuppressTooltipClickUntil = 0;
    },
    true
  );

  document.addEventListener(
    "focusin",
    (event) => {
      const trigger = getInfoTooltipTrigger(event.target);
      if (trigger) {
        hideShownInfoTooltips();
        return;
      }

      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".v-popper__popper")) {
        hideShownInfoTooltips();
      }
    },
    true
  );
}

function getDocumentScrollTop() {
  const scrollingElement = document.scrollingElement || document.documentElement;
  return Number(scrollingElement?.scrollTop || window.scrollY || 0);
}

function installMobileTooltipScrollGuard() {
  if (mobileTooltipScrollGuardInstalled) return;
  mobileTooltipScrollGuardInstalled = true;

  let touchStartY = null;
  let maxTouchDelta = 0;
  let lastScrollTop = getDocumentScrollTop();
  let accumulatedScrollDelta = 0;

  document.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches?.[0];
      touchStartY = touch ? touch.clientY : null;
      maxTouchDelta = 0;
      accumulatedScrollDelta = 0;
      lastScrollTop = getDocumentScrollTop();
    },
    { passive: true, capture: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (touchStartY === null) return;
      const touch = event.touches?.[0];
      if (!touch) return;
      maxTouchDelta = Math.max(maxTouchDelta, Math.abs(touch.clientY - touchStartY));
      // Close tooltips only for real scroll gestures (ignore tiny finger jitter).
      if (maxTouchDelta >= 24) {
        hideShownTooltips();
        touchStartY = touch.clientY;
        maxTouchDelta = 0;
      }
    },
    { passive: true, capture: true }
  );

  document.addEventListener(
    "scroll",
    () => {
      const currentScrollTop = getDocumentScrollTop();
      const delta = Math.abs(currentScrollTop - lastScrollTop);
      lastScrollTop = currentScrollTop;
      accumulatedScrollDelta += delta;
      // DevTools mobile emulation often emits scroll without touchmove.
      // Close only after a meaningful accumulated scroll distance.
      if (accumulatedScrollDelta >= 16) {
        hideShownTooltips();
        accumulatedScrollDelta = 0;
      }
    },
    { passive: true, capture: true }
  );
}

// Find alle elementer med klassen "qpm-searchform" (med fallback til legacy class)
const searchFormDivs = document.querySelectorAll(".qpm-searchform, .searchform");

searchFormDivs.forEach((searchFormDiv, index) => {
  // Generer et unikt ID for hver instans hvis det ikke allerede har et
  if (!searchFormDiv.id) {
    searchFormDiv.id = `qpm-searchform-${index + 1}`;
  }

  // Keep empty string as-is (don't convert to undefined)
  const domain = searchFormDiv.dataset.domain !== undefined ? searchFormDiv.dataset.domain : null;
  const useAI = searchFormDiv.dataset.useAI === "true";
  const useAISummarizer = searchFormDiv.dataset.useAISummarizer === "true";
  const useMeshValidation = searchFormDiv.dataset.useMeshValidation === "true";
  const datasetDebugSearchFlow = normalizeSearchFlowDebugValue(searchFormDiv.dataset.debugSearchFlow);
  const urlDebugSearchFlow = getSearchFlowDebugFlagFromLocation();
  const debugSearchFlow = datasetDebugSearchFlow || urlDebugSearchFlow;
  const openLimits = searchFormDiv.dataset.openLimits === "true";

  const parseDatasetList = (value, label) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value.replace(/'/g, '"'));
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => typeof item === "string" && item.trim() !== "");
    } catch (e) {
      console.warn(`Could not parse ${label} dataset:`, e);
      return [];
    }
  };

  const parsedHideTopics = parseDatasetList(searchFormDiv.dataset.hideTopics, "hideTopics");
  const parsedHideLimits = parseDatasetList(searchFormDiv.dataset.hideLimits, "hideLimits");
  const parsedCheckLimits = parseDatasetList(searchFormDiv.dataset.checkLimits, "checkLimits");
  const parsedOrderLimits = parseDatasetList(searchFormDiv.dataset.orderLimits, "orderLimits");
  const parsedTranslationSources =
    searchFormDiv.dataset.translationSources !== undefined
      ? parseDatasetList(searchFormDiv.dataset.translationSources, "translationSources")
      : null;
  const parsedDefaultTranslationSources =
    searchFormDiv.dataset.defaultTranslationSources !== undefined
      ? parseDatasetList(searchFormDiv.dataset.defaultTranslationSources, "defaultTranslationSources")
      : null;
  const language = searchFormDiv.dataset.language || undefined;
  const componentNoRaw = searchFormDiv.dataset.componentNo;
  const componentNo =
    componentNoRaw && componentNoRaw.trim() !== "" && Number.isFinite(Number(componentNoRaw))
      ? Number(componentNoRaw)
      : undefined;
  const instanceAiURL = getAiURL(searchFormDiv.dataset.aiUrl || "");
  const standardStringAdd = searchFormDiv.dataset.standardStringAdd === "true";
  const standardStringScopeRaw = searchFormDiv.dataset.standardStringScope;
  const standardStringScope =
    standardStringScopeRaw && ["narrow", "normal", "broad"].includes(standardStringScopeRaw)
      ? standardStringScopeRaw
      : "normal";
  const standardString = (searchFormDiv.dataset.standardString || "").trim();

  // Set global config (for backward compatibility with single-instance usage)
  if (domain) {
    config.domain = domain;
  }
  loadThemeOverridesFromBackend(domain || config.domain, settings.nlm.proxyUrl).finally(() => {
    applyThemeFromConfig(domain || config.domain);
  });
  if (language) {
    config.language = language;
  }
  config.useAI = useAI;
  config.useAISummarizer = useAISummarizer;
  config.useMeshValidation = useMeshValidation;

  const hasTouchPoints =
    typeof navigator !== "undefined" && Number(navigator.maxTouchPoints || 0) > 0;
  const hasNoHover =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(hover: none)").matches;
  const hasCoarsePointer =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;
  const isTouchLike = hasNoHover || hasCoarsePointer || hasTouchPoints;

  createConfiguredAppWithOptions(
    SearchForm,
    {
      hideTopics: parsedHideTopics,
      hideLimits: parsedHideLimits,
      checkLimits: parsedCheckLimits,
      orderLimits: parsedOrderLimits,
      openLimits: openLimits,
      language: language,
      componentNo: componentNo,
      domain: domain,
      translationSources: parsedTranslationSources,
      defaultTranslationSources: parsedDefaultTranslationSources,
      debugSearchFlow: debugSearchFlow,
      standardStringAdd: standardStringAdd,
      standardStringScope: standardStringScope,
      standardString: standardString,
    },
    {
      provide: {
        instanceDomain: domain,
        instanceLanguage: language,
        instanceUseAI: useAI,
        instanceUseAISummarizer: useAISummarizer,
        instanceUseMeshValidation: useMeshValidation,
        instanceAiURL: instanceAiURL,
      },
      floatingVueOptions: {
        themes: {
          tooltip: {
            html: true,
            // Default tooltips: desktop hover/focus only (no mobile tap).
            triggers: ["hover", "focus"],
            hideTriggers: ["hover"],
            autoHide: true,
            noAutoFocus: true,
          },
          infoTooltip: {
            $extend: "tooltip",
            html: true,
            // Info icons should open on keyboard focus, but still be keyboard-toggleable.
            triggers: ["hover", "focus", "click"],
            hideTriggers: ["hover", "focus", "click"],
            autoHide: true,
          },
        },
      },
      afterFloatingVueInstalled: () => {
        if (isTouchLike) {
          installMobileTooltipScrollGuard();
        }
        installKeyboardInfoTooltipBehavior();
      },
    }
  ).mount(`#${searchFormDiv.id}`);
});
