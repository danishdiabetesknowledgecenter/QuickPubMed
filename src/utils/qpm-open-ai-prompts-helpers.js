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
export function getPromptForLocale(prompt, locale) {
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
    // Remove suplurflous whitespace to reduce token count
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

/**
 *
 * @param {*} messages an object containing the message history for different languages
 * @returns the same object with messages treated to make them more token friendly
 */
export function sanitizeMessages(messages) {
  const langs = Object.keys(messages);
  for (let k = 0; k < langs.length; k++) {
    var lg = langs[k];
    var sanitizedMessages = messages[lg]
      .map((message) => {
        const sanitizedContent = message.content
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

        if (sanitizedContent.trim() == "") {
          return null;
        }

        const sanitizedMessage = Object.assign({}, message, {
          content: sanitizedContent,
        });
        return sanitizedMessage;
      })
      .filter((message) => message != null);

    // Explicitly let the messages be missing so it can be filtered out before sending to backend
    if (sanitizedMessages.length == 0) {
      sanitizedMessages = null;
    }

    messages[lg] = sanitizedMessages;
  }
  return messages;
}
