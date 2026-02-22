/**
 * Options for formatting dates.
 * @constant {Object} dateOptions
 * @property {string} year - The year format.
 * @property {string} month - The month format.
 * @property {string} day - The day format.
 */
export const dateOptions = { year: "numeric", month: "long", day: "numeric" };

/**
 * Language format mappings.
 * @constant {Object} languageFormat
 * @property {string} da - Danish locale identifier.
 * @property {string} en - English locale identifier.
 * @property {string} de - German locale identifier.
 */
export const languageFormat = {
  da: "da-DK",
  en: "en-GB",
  de: "de-DE",
};

/**
 * Tooltips for custom input tags in different languages.
 * @constant {Object} customInputTagTooltip
 * @property {string} dk - Danish tooltip text.
 * @property {string} en - English tooltip text.
 */
export const customInputTagTooltip = {
  dk: "Klik for at redigere",
  en: "Click to edit",
};

/**
 * Available page sizes for pagination.
 * @constant {number[]} pageSizes
 */
export const pageSizes = [10, 25, 50];

/**
 * Mapping of scope identifiers to scope names.
 * @constant {Object} scopeIds
 * @property {string} n - "narrow" scope identifier.
 * @property {string} s - "normal" scope identifier.
 * @property {string} b - "broad" scope identifier.
 */
export const scopeIds = {
  n: "narrow", // narrow
  s: "normal", // standard
  b: "broad", // broad
};
