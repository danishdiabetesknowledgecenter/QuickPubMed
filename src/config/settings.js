/**
 * @typedef {settings} Settings
 */

const nlmKey = import.meta.env.VITE_NLM_KEY;
const openAiBaseUrl = import.meta.env.VITE_BASE_URL;
export const aiURL = "https://nempubmed.dk/om-nempubmed";

export const settings = {
  client: "videncenterfordiabetes",
  nlm: {
    email: "admin@videncenterfordiabetes.dk",
    key: nlmKey,
    myncbishare: "videncenterfordiabetes",
  },
  openAi: {
    domain: "diabetes",
    useAi: true,
    usePDFsummary: true, // If true, the AI will summarize the PDFs
    baseUrl: openAiBaseUrl,
    longAbstractLengthLimit: 5000, // The combined abstract length of the selected articles in characters
    waitTimeDisclaimerDelay: 5000, // The amount of milliseconds before the wait time disclaimer is shown
  },
  unpaywall: {
    email: "admin@videncenterfordiabetes.dk",
    baseUrl: "https://api.unpaywall.org/v2/",
  },
};
