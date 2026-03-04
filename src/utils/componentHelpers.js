import { dateOptions, languageFormat } from "@/utils/contentHelpers";

export function cloneDeep(value) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch (error) {
      // Fallback for values that structuredClone cannot handle
      // (e.g. non-serializable browser objects inside runtime data).
    }
  }
  return JSON.parse(JSON.stringify(value));
}

export function debounce(fn, delay = 100) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, delay = 100) {
  let lastRun = 0;
  let timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = delay - (now - lastRun);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastRun = now;
      fn.apply(this, args);
      return;
    }
    if (!timer) {
      timer = setTimeout(() => {
        lastRun = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

export function isMobileViewport() {
  return /android|bb\d+|meego.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
    navigator.userAgent || navigator.vendor || window.opera || ""
  );
}

export function getAuthorNames(authors) {
  if (!Array.isArray(authors)) return "";
  return authors
    .map((author) => author?.name)
    .filter(Boolean)
    .join(", ");
}

export function hasAbstractAttribute(attributes) {
  if (!attributes || typeof attributes !== "object") return false;
  return Object.entries(attributes).some(
    ([key, value]) => key === "Has Abstract" || value === "Has Abstract"
  );
}

export function getFormattedEntrezDate(history, language) {
  if (!Array.isArray(history)) return "";
  const match = history.find((item) => item?.pubstatus === "entrez");
  if (!match?.date) return "";
  const date = new Date(match.date);
  return date.toLocaleDateString(languageFormat[language], dateOptions);
}

export function extractDoi(articleids) {
  if (!Array.isArray(articleids)) return "";
  const doiItem = articleids.find((item) => item?.idtype === "doi");
  return doiItem?.value || "";
}

export function getArticleSource(value = {}) {
  if (value?.booktitle) return value.booktitle;
  return value?.source || "";
}

export function formatPublicationInfo(value = {}) {
  const source = value?.source || "";
  const pubDate = value?.pubDate || value?.pubdate || "";
  const volume = value?.volume || "";
  const issue = value?.issue || "";
  const pages = value?.pages || "";

  let formatted = "";
  if (source) {
    formatted += `${source}. `;
  }
  if (pubDate) {
    formatted += `${pubDate};`;
  }
  if (volume) {
    formatted += `${volume}`;
  }
  if (issue) {
    formatted += `(${issue})`;
  }
  if (pages) {
    formatted += `:${pages}`;
  }
  return formatted;
}

export function parsePubMedXml(data) {
  let xmlDoc;
  if (window.DOMParser) {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(data, "text/xml");
  } else {
    // eslint-disable-next-line no-undef
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = false;
    xmlDoc.loadXML(data);
  }
  return xmlDoc;
}

export function hasXmlParserError(xmlDoc) {
  return Boolean(xmlDoc?.getElementsByTagName?.("parsererror")?.length > 0);
}

export function getAbstractEntriesFromPubMedXml(
  xmlDoc,
  { includeEmptySections = false, getSectionName } = {}
) {
  const articles = Array.from(xmlDoc?.getElementsByTagName?.("PubmedArticle") || []);
  return articles
    .map((article) => {
      const pmidEl = article.getElementsByTagName("PMID")[0];
      if (!pmidEl) return null;

      const pmid = pmidEl.textContent;
      const sections = article.getElementsByTagName("AbstractText");

      if (sections.length === 1) {
        return [pmid, sections[0].textContent];
      }

      if (sections.length > 1 || includeEmptySections) {
        const text = {};
        Array.from(sections).forEach((section, index) => {
          const sectionName =
            typeof getSectionName === "function"
              ? getSectionName(section, index)
              : section.getAttribute("Label");
          const sectionText = section.textContent;
          text[sectionName] = sectionText;
        });
        return [pmid, text];
      }

      return null;
    })
    .filter(Boolean);
}

function normalizeComparableId(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized === "" ? null : normalized;
}

export function hasDefinedValue(value) {
  return value !== null && value !== undefined;
}

export function areComparableIdsEqual(left, right) {
  const normalizedLeft = normalizeComparableId(left);
  const normalizedRight = normalizeComparableId(right);
  if (normalizedLeft === null || normalizedRight === null) return false;
  return normalizedLeft === normalizedRight;
}

export function getLocalizedTranslation(value, language, fallbackLanguage = "dk") {
  if (!value?.translations) return "";
  const translated = value.translations[language];
  if (translated !== undefined) return translated;
  return value.translations[fallbackLanguage] || "";
}

export function getLocalizedErrorTranslation(
  messagesMap,
  errorKey,
  language,
  fallbackKey = "unknownError"
) {
  const fallback = messagesMap?.[fallbackKey]?.[language] || "";
  if (!messagesMap || !errorKey) return fallback;
  return messagesMap?.[errorKey]?.[language] ?? fallback;
}

export function buildArticleSummaryClipboardText({
  authorsList = "",
  searchResultTitle = "",
  publicationInfo = "",
  summaryData = [],
  userQuestionsAndAnswers = [],
  getString,
  includeEmptyUserQuestionsSection = false,
}) {
  if (!Array.isArray(summaryData) || summaryData.length === 0) return "";
  if (typeof getString !== "function") return "";

  const firstSeven = summaryData
    .slice(0, 7)
    .map((qa) => `${qa.shortTitle}\n${qa.answer}`)
    .join("\n\n");

  const remaining = summaryData
    .slice(7)
    .map((qa) => `${qa.question}\n${qa.answer}`)
    .join("\n\n");

  const questionsSection = Array.isArray(userQuestionsAndAnswers)
    ? userQuestionsAndAnswers.map((qa) => `${qa.question}\n${qa.answer}`).join("\n\n")
    : "";

  const baseText =
    authorsList.trim() +
    ". " +
    searchResultTitle +
    " " +
    publicationInfo +
    ". " +
    "\n\n" +
    getString("summarizeArticleHeader") +
    ": " +
    "\n\n" +
    firstSeven +
    "\n\n" +
    getString("generateQuestionsHeader") +
    ": " +
    "\n\n" +
    remaining +
    "\n\n";

  const shouldIncludeUserQuestions =
    includeEmptyUserQuestionsSection || questionsSection.length > 0;

  if (!shouldIncludeUserQuestions) {
    return baseText;
  }

  return (
    baseText +
    getString("userQuestionsHeader") +
    ": " +
    "\n\n" +
    questionsSection +
    "\n\n"
  );
}
