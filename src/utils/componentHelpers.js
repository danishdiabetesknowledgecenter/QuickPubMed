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

const CITATION_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * PubMeds reference bruger "2012 Jun 30", ikke sorteringsformen "2012/06/30 00:00".
 * Strenge der allerede er citationsdatoer, sendes uændret videre.
 */
export function formatCitationPublicationDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const machine = text.match(
    /^(\d{4})[/-](\d{2})(?:[/-](\d{2}))?(?:[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
  );
  if (!machine) return text;
  const year = machine[1];
  const monthNumber = Number(machine[2]);
  const dayNumber = machine[3] === undefined ? 0 : Number(machine[3]);
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return year;
  }
  const month = CITATION_MONTHS[monthNumber - 1];
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
    return `${year} ${month}`;
  }
  return `${year} ${month} ${dayNumber}`;
}

/** Enkelt kalenderdag til den lokaliserede dato over titlen. Intervaller returnerer null. */
export function parseSinglePublicationDate(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const machine = text.match(/^(\d{4})[/-](\d{2})[/-](\d{2})(?:\b|[T\s])/);
  if (machine) {
    const year = Number(machine[1]);
    const month = Number(machine[2]);
    const day = Number(machine[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day);
    }
    return null;
  }
  const nlm = text.match(
    /^(\d{4})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b(.*)$/i
  );
  if (!nlm || /^\s*[-–—/]/.test(nlm[4] || "")) return null;
  const month = CITATION_MONTHS.findIndex(
    (name) => name.toLowerCase() === nlm[2].slice(0, 3).toLowerCase()
  );
  const day = Number(nlm[3]);
  if (month < 0 || day < 1 || day > 31) return null;
  return new Date(Number(nlm[1]), month, day);
}

/** Dag, måned og år, eller kun året. Opfinder ikke en dag, kilden ikke har. */
export function formatResultListDate(value, language) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const locale = languageFormat[language] || languageFormat.en;
  const parsed = parseSinglePublicationDate(text);
  if (parsed && !Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString(locale, dateOptions);
  }
  let year = 0;
  let monthIndex = -1;
  const yearFirst = text.match(/^(\d{4})(?:\s+|[-/])([A-Za-z]{3,9}|\d{1,2})\b/);
  if (yearFirst) {
    year = Number(yearFirst[1]);
    const monthToken = yearFirst[2];
    if (/^\d{1,2}$/.test(monthToken)) {
      const monthNumber = Number(monthToken);
      if (monthNumber >= 1 && monthNumber <= 12) monthIndex = monthNumber - 1;
    } else {
      monthIndex = CITATION_MONTHS.findIndex(
        (name) => name.toLowerCase() === monthToken.slice(0, 3).toLowerCase()
      );
    }
  }
  if (monthIndex < 0) {
    const monthFirst = text.match(/^([A-Za-z]{3,9})\s+(\d{4})\b/);
    if (monthFirst) {
      monthIndex = CITATION_MONTHS.findIndex(
        (name) => name.toLowerCase() === monthFirst[1].slice(0, 3).toLowerCase()
      );
      year = Number(monthFirst[2]);
    }
  }
  if (year >= 1000 && year <= 9999 && monthIndex >= 0) {
    return new Date(year, monthIndex, 1).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
    });
  }
  const yearOnly = text.match(/^(\d{4})$/);
  return yearOnly ? yearOnly[1] : "";
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
  const pubDate = formatCitationPublicationDate(value?.pubDate || value?.pubdate || "");
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
  return withTerminalPeriod(formatted);
}

function withTerminalPeriod(value) {
  const text = String(value ?? "").trimEnd();
  if (!text || text.endsWith(".")) return text;
  return `${text}.`;
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
