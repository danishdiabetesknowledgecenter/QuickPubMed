// Load the general environment variables
const ABOUT_AI_URL = import.meta.env.VITE_ABOUT_AI_URL;
const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME;

// Load the NLM environment variables (only myncbishare needed client-side)
const MY_NCBI_SHARE = import.meta.env.VITE_MY_NCBI_SHARE;

// API proxy URL - automatically detects base path from script location
// This works even when JS is loaded from a different domain than the page
function getProxyUrl() {
  if (import.meta.env.VITE_API_PROXY_URL) {
    return import.meta.env.VITE_API_PROXY_URL;
  }
  // Get base URL from the JS file location (import.meta.url)
  // Remove /assets/filename.js to get the base directory
  const scriptUrl = import.meta.url;
  const baseUrl = scriptUrl.replace(/\/assets\/[^/]+$/, '');
  return baseUrl + '/php-proxy';
}
const API_PROXY_URL = getProxyUrl();

// PHP proxy URL for article summarization
// PHP calls Azure (for text extraction) then OpenAI (for summarization)
const AZURE_FUNCTION_URL = getProxyUrl();
const LONG_ABSTRACT_LENGTH_LIMIT = import.meta.env.VITE_LONG_ABSTRACT_LENGTH_LIMIT;
const WAIT_TIME_DISCLAIMER_DELAY = import.meta.env.VITE_WAIT_TIME_DISCLAIMER_DELAY;

// Load the Unpaywall environment variables
const UNPAYWALL_EMAIL = import.meta.env.VITE_UNPAYWALL_EMAIL;
const UNPAYWALL_URL = import.meta.env.VITE_UNPAYWALL_URL;

// Export the settings
export const aiURL = ABOUT_AI_URL;

/**
 * @typedef {settings} Settings
 */
export const settings = {
  client: CLIENT_NAME,
  nlm: {
    // API credentials are now handled server-side via PHP proxy
    myncbishare: MY_NCBI_SHARE,
    proxyUrl: API_PROXY_URL + '/api/nlm',
  },
  openAi: {
    baseUrl: API_PROXY_URL,
    // PHP proxy URL for article summarization (calls Azure for text, then OpenAI)
    azureFunctionUrl: AZURE_FUNCTION_URL,
    // The combined abstract length of the selected articles in characters
    longAbstractLengthLimit: Number(LONG_ABSTRACT_LENGTH_LIMIT),
    // The amount of milliseconds before the wait time disclaimer is shown
    waitTimeDisclaimerDelay: Number(WAIT_TIME_DISCLAIMER_DELAY),
  },
  unpaywall: {
    email: UNPAYWALL_EMAIL,
    baseUrl: UNPAYWALL_URL,
  },
};
