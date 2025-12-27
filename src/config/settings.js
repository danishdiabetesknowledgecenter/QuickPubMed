// Load the general environment variables
const ABOUT_AI_URL = import.meta.env.VITE_ABOUT_AI_URL;
const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME;

// Load the NLM environment variables (only myncbishare needed client-side)
const MY_NCBI_SHARE = import.meta.env.VITE_MY_NCBI_SHARE;

// API proxy URL - uses relative path by default (works on any domain)
const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || '/php-proxy';

// Azure Function URL for article summarization (works better for PDF downloads)
const AZURE_FUNCTION_URL = 'https://qpm-openai-service.azurewebsites.net';
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
    // Azure Function URL for article summarization (PDF/HTML) and resource check
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
