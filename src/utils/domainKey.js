import { ref } from "vue";
import { getSearchFlowDebugUrlParams } from "@/utils/searchFlowDebug.js";

/**
 * null = URL did not specify domain (use data-domain / config).
 * string = URL override (may be empty when domain= is present but empty/invalid).
 */
export const urlDomainOverride = ref(null);

/**
 * Normalize a content domain key (same rules as backend qpmNormalizeDomainKey).
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeDomainKey(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  return /^[a-z0-9_-]+$/.test(normalized) ? normalized : "";
}

/**
 * Read domain= from the current location (search + hash query).
 * @returns {string|null} null when param absent; otherwise normalized key (possibly "").
 */
export function readDomainParamFromLocation(locationLike) {
  const params = getSearchFlowDebugUrlParams(locationLike);
  let found = false;
  let raw = "";
  params.forEach((value, key) => {
    if (found) return;
    const keyLower = String(key || "")
      .replace(/^amp;/i, "")
      .toLowerCase();
    if (keyLower === "domain") {
      found = true;
      raw = value;
    }
  });
  if (!found) return null;
  return normalizeDomainKey(raw);
}

/**
 * Sync the reactive URL domain override from the current location.
 * @returns {string|null}
 */
export function syncUrlDomainOverrideFromLocation(locationLike) {
  const value = readDomainParamFromLocation(locationLike);
  urlDomainOverride.value = value;
  return value;
}

// Sync as early as possible so Options API immediate watchers see URL domain=
// before created() (immediate watches run during init, before created).
if (typeof window !== "undefined" && window.location) {
  syncUrlDomainOverrideFromLocation();
}
