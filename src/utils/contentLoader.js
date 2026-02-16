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
    .filter((key) => key.includes(`/src/assets/content/${domain}/`) && modules[key]?.topics)
    .map((key) => ({
      path: key,
      topics: modules[key].topics, // Access the named export 'topics'
    }));
}

/**
 * Loads standardString for the specified domain (from qpm-content-topics-*.js).
 * Used to optionally add a domain-specific base query to free-text searches.
 *
 * @param {string} domain - The domain name (e.g., 'diabetes', 'dementia').
 * @returns {Object|null} - { narrow, normal, broad } or null if missing/empty.
 */
export function loadStandardString(domain) {
  if (!domain) return null;
  const modules = import.meta.glob("/src/assets/content/**/qpm-content-topics-*.js", {
    eager: true,
  });
  const key = Object.keys(modules).find(
    (k) =>
      k.includes(`/src/assets/content/${domain}/`) &&
      modules[k]?.standardString != null &&
      typeof modules[k].standardString === "object"
  );
  if (!key) return null;
  const standardString = modules[key].standardString;
  if (
    !standardString ||
    (Object.keys(standardString).length === 0)
  ) {
    return null;
  }
  return standardString;
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
    .filter((key) => key.includes(`/src/assets/content/${domain}/`) && modules[key]?.promptRules)
    .map((key) => ({
      path: key,
      promptRules: modules[key].promptRules, // Access the named export 'promptRules'
    }));
}
