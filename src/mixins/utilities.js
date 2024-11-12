/**
 * Mixin for utility functions that are reusable across components.
 *
 * @mixin
 */
export const utilitiesMixin = {
  methods: {
    getDomainSpecificPromptRules(domain, locale = "dk") {
      if (
        domainSpecificPromptingRules[domain] &&
        domainSpecificPromptingRules[domain][locale]
      ) {
        return domainSpecificPromptingRules[domain][locale];
      } else {
        return null;
      }
    },
    /**
     * Retrieves a localized string based on the current language.
     *
     * @param {string} string - The key for the message to retrieve.
     * @returns {string} - The localized string for the current language, or the default language ("dk") if not found.
     */
    getString(string) {
      const lg = this.language;
      const constant = messages[string][lg];
      return constant !== undefined ? constant : messages[string]["dk"];
    },
    /**
     * Performs a fetch request to the specified URL with the given body and method.
     *
     * @param {string} url - The URL to send the request to.
     * @param {Object} body - The body of the request, which will be JSON-stringified.
     * @param {string} [method="POST"] - The HTTP method to use for the request (default is "POST").
     * @param {string} [tag="default"] - A tag to identify the request in log messages (default is "default").
     * @returns {Promise<Response>} - A promise that resolves to the fetch response.
     * @throws {Error} - Throws an error if the fetch request fails.
     */
    async handleFetch(url, body, method = "POST", tag = "default") {
      try {
        const response = await fetch(url, {
          method: method,
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw Error(JSON.stringify(data));
        }
        return response;
      } catch (error) {
        console.log("From: " + tag + " Error fetching:", error);
        throw error;
      }
    },
  },
};
