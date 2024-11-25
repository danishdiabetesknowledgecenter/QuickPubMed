// Load the general environment variables
const NEMPUBMED_URL = import.meta.env.VITE_NEMPUBMED_URL;
const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME;

// Load the NLM environment variables
const NLM_EMAIL = import.meta.env.VITE_NLM_EMAIL;
const NLM_KEY = import.meta.env.VITE_NLM_KEY;
const MY_NCBI_SHARE = import.meta.env.VITE_MY_NCBI_SHARE;

// Load the OpenAI environment variables
const DOMAIN = import.meta.env.VITE_DOMAIN;
const USE_AI = import.meta.env.VITE_USE_AI;
const USE_AI_SUMMARIZER = import.meta.env.VITE_USE_AI_SUMMARIZER;
const OPENAI_BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL;
const LONG_ABSTRACT_LENGTH_LIMIT = import.meta.env.VITE_LONG_ABSTRACT_LENGTH_LIMIT;
const WAIT_TIME_DISCLAIMER_DELAY = import.meta.env.VITE_WAIT_TIME_DISCLAIMER_DELAY;

// Load the Unpaywall environment variables
const UNPAYWALL_EMAIL = import.meta.env.VITE_UNPAYWALL_EMAIL;
const UNPAYWALL_URL = import.meta.env.VITE_UNPAYWALL_URL;

// Export the settings
export const aiURL = NEMPUBMED_URL;

/**
 * @typedef {settings} Settings
 */
export const settings = {
  client: CLIENT_NAME,
  nlm: {
    email: NLM_EMAIL,
    key: NLM_KEY,
    myncbishare: MY_NCBI_SHARE,
  },
  openAi: {
    domain: DOMAIN,
    useAi: Boolean(USE_AI),
    usePDFsummary: Boolean(USE_AI_SUMMARIZER),
    baseUrl: OPENAI_BASE_URL,
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
