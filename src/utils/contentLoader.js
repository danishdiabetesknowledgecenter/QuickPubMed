/**
 * Loads topic modules for the specified domain.
 *
 * @param {string} domain - The domain name (e.g., 'diabetes', 'dementia').
 * @returns {Array<Object>} - An array of topic modules with their paths.
 */
export function loadTopics(domain) {
  const modules = import.meta.glob("/src/assets/content/**/qpm-content-topics-*.js", {
    eager: true,
  });
  return Object.keys(modules)
    .filter((key) => key.includes(`/src/assets/content/${domain}/`))
    .map((key) => ({
      path: key,
      topics: modules[key].topics, // Access the named export 'topics'
    }));
}

/**
 * Loads prompt rule modules for the specified domain.
 *
 * @param {string} domain - The domain name (e.g., 'diabetes', 'dementia').
 * @returns {Array<Object>} - An array of prompt rule modules with their paths.
 */
export function loadPromptRules(domain) {
  const modules = import.meta.glob("/src/assets/content/**/qpm-prompt-rules-*.js", {
    eager: true,
  });
  return Object.keys(modules)
    .filter((key) => key.includes(`/src/assets/content/${domain}/`))
    .map((key) => ({
      path: key,
      promptRules: modules[key].promptRules, // Access the named export 'promptRules'
    }));
}
