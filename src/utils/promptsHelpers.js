import { applyOpenAiTaskSettings } from "@/utils/openAiTaskSettings.js";

/**
 * @typedef {Object} QuestionItem
 * @property {string} question - The question text.
 * @property {string} shortTitle - A short title for the question.
 */

/**
 * Collection of prompt questions categorized by language.
 *
 * @type {Object.<string, QuestionItem[]>}
 * @property {QuestionItem[]} dk - Questions in Danish.
 * @property {QuestionItem[]} en - Questions in English.
 */

/**
 * @typedef {Object.<string, string>} ShortTitleMap
 */

/**
 * Precomputed maps for quick lookup of short titles by question and language.
 *
 * @type {Object.<string, ShortTitleMap>}
 */
export function getPromptForLocale(prompt, locale, taskKey = null) {
  var localePrompt = {
    ...prompt,
    translations: null,
    name: null,
    prompt: prompt.prompt && prompt.prompt[locale],
    messages: prompt.messages && prompt.messages[locale],
  };
  Object.keys(localePrompt).forEach(function (key) {
    if (localePrompt[key] == null) delete localePrompt[key];
  });

  if (taskKey) {
    return applyOpenAiTaskSettings(localePrompt, taskKey);
  }

  return localePrompt;
}

/**
 *
 * @param {*} prompt an object containing the prompt for different languages
 * @returns the same object with prompts treated to make them more token friendly
 */
export function sanitizePrompt(prompt) {
  var langs = Object.keys(prompt);
  for (let k = 0; k < langs.length; k++) {
    var lg = langs[k];
    // Remove superfluous whitespace to reduce token count
    if (typeof prompt[lg] !== "string") continue;
    var sanitizedPrompt = prompt[lg]
      .split(" ")
      .filter(function (e) {
        return e;
      })
      .join(" ")
      .split("\n")
      .filter(function (e) {
        return e;
      })
      .join("\n");
    prompt[lg] = sanitizedPrompt;
  }

  return prompt;
}
