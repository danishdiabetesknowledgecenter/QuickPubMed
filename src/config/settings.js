/**
 * @typedef {settings} Settings
 */

export const aiURL = "https://nempubmed.dk/om-nempubmed";

export const settings = {
  client: "videncenterfordiabetes",
  nlm: {
    email: "admin@videncenterfordiabetes.dk",
    key: "258a604944c9858b96739c730cd6a579c908",
    myncbishare: "videncenterfordiabetes",
  },
  openAi: {
    domain: "diabetes",
    useAi: true,
    usePDFsummary: true, // If true, the AI will summarize the PDFs
    baseUrl: "http://localhost:7071", // PROD "https://qpm-openai-service.azurewebsites.net",
    longAbstractLengthLimit: 5000, // The combined abstract length of the selected articles in characters
    waitTimeDisclaimerDelay: 5000, // The amount of milliseconds before the wait time disclaimer is shown
  },
  unpaywall: {
    email: "admin@videncenterfordiabetes.dk",
    baseUrl: "https://api.unpaywall.org/v2/",
  },
};
