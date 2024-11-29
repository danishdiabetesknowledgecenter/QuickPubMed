/**
 * Represents an order option in the application.
 * @typedef {Object} OrderOption
 * @property {string} id - The unique identifier of the order option.
 * @property {string} method - The sorting method.
 * @property {Object} translations - The translations for different languages.
 * @property {string} translations.dk - Danish translation.
 * @property {string} translations.en - English translation.
 */

/** @type {Array<OrderOption>} */
export const order = [
  {
    id: "O01",
    method: "relevance",
    translations: {
      dk: "Sorter efter relevans",
      en: "Sort by relevance",
    },
  },
  {
    id: "O02",
    method: "date_desc",
    translations: {
      dk: "Vis nyeste først",
      en: "Show newest first",
    },
  },
  {
    id: "O03",
    method: "date_asc",
    translations: {
      dk: "Vis ældste først",
      en: "Show oldest first",
    },
  },
];
