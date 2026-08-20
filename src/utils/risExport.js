import {
  normalizeDoiValue,
  normalizeOpenAlexIdValue,
  normalizePmidValue,
} from "@/utils/resultAdapters.js";

const RIS_CRLF = "\r\n";
const RIS_MIME = "application/x-research-info-systems;charset=UTF-8";
const MONTHS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutAsterisks(value) {
  return normalizeText(value).replace(/\*/g, "");
}

function truncateField(value, maxLength) {
  const text = normalizeText(value);
  if (!maxLength || text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}

/**
 * RIS tag line per Thomson Reuters ResearchSoft spec (2008):
 * two letters, two spaces, hyphen, space. Lines end with CRLF.
 */
function risLine(tag, value = "") {
  return `${tag}  - ${value}${RIS_CRLF}`;
}

export function formatRisAuthorName(name) {
  const raw = withoutAsterisks(name);
  if (!raw) return "";
  if (raw.includes(",")) {
    return truncateField(raw, 255);
  }
  const parts = raw.split(" ");
  if (parts.length < 2) {
    return truncateField(raw, 255);
  }
  const lastToken = parts[parts.length - 1];
  if (/^[A-Z](?:\.?[A-Z]){0,3}\.?$/.test(lastToken)) {
    return truncateField(`${parts.slice(0, -1).join(" ")}, ${lastToken}`, 255);
  }
  return truncateField(raw, 255);
}

export function parseRisPublicationDate(rawDate) {
  const text = normalizeText(rawDate);
  const isoMatch = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: isoMatch[2],
      day: isoMatch[3] || "",
      other: "",
    };
  }
  const yearMatch = text.match(/\b(\d{4})\b/);
  if (!yearMatch) {
    return { year: "", month: "", day: "", other: "" };
  }
  const year = yearMatch[1];
  const monthMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i);
  const month = monthMatch ? MONTHS[monthMatch[1].slice(0, 3).toLowerCase()] || "" : "";
  let day = "";
  if (monthMatch) {
    const afterMonth = text.slice(text.indexOf(monthMatch[0]) + monthMatch[0].length);
    const dayMatch = afterMonth.match(/^\s*(\d{1,2})\b/);
    if (dayMatch) {
      const parsedDay = Number(dayMatch[1]);
      if (parsedDay >= 1 && parsedDay <= 31) {
        day = String(parsedDay).padStart(2, "0");
      }
    }
  }
  const otherMatch = text.match(/\b(Spring|Summer|Fall|Autumn|Winter)\b/i);
  return {
    year,
    month,
    day,
    other: otherMatch ? otherMatch[1] : "",
  };
}

function formatRisDate(dateParts) {
  if (!dateParts?.year) return "";
  const year = dateParts.year;
  const month = dateParts.month || "";
  const day = dateParts.day || "";
  const other = dateParts.other || "";
  if (other && !month) {
    return `${year}///${other}`;
  }
  if (day && month) {
    return other ? `${year}/${month}/${day}/${other}` : `${year}/${month}/${day}`;
  }
  if (month) {
    return `${year}/${month}`;
  }
  return "";
}

export function splitRisPages(pages) {
  const text = normalizeText(pages);
  if (!text) return { start: "", end: "" };
  const match = text.match(/^(.+?)[\u002D\u00AD\u2010-\u2015\u2212\u2E3A\u2E3B\s]+(.+)$/);
  if (match) {
    return { start: match[1].trim(), end: match[2].trim() };
  }
  return { start: text, end: "" };
}

function getArticleId(article, idType) {
  const ids = Array.isArray(article?.articleids) ? article.articleids : [];
  const match = ids.find((item) => String(item?.idtype || "").toLowerCase() === idType);
  return normalizeText(match?.value);
}

function getIssn(article) {
  const journal = article?.journal && typeof article.journal === "object" ? article.journal : {};
  return (
    withoutAsterisks(article?.issn) ||
    withoutAsterisks(article?.essn) ||
    withoutAsterisks(journal.issn) ||
    withoutAsterisks(article?.issn_l)
  );
}

function getPmcId(article) {
  const fromIds =
    getArticleId(article, "pmc") ||
    getArticleId(article, "pmcid") ||
    normalizeText(article?.pmcId || article?.pmcid);
  const match = fromIds.match(/PMC\d+/i);
  return match ? match[0].toUpperCase() : "";
}

function getKeywords(article) {
  const topics = Array.isArray(article?.topics) ? article.topics : [];
  const seen = new Set();
  const keywords = [];
  for (const topic of topics) {
    const label = truncateField(withoutAsterisks(topic?.label), 255);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    keywords.push(label);
  }
  return keywords;
}

function formatRisAuthorFromEntry(author) {
  if (!author) return "";
  if (typeof author === "string") return formatRisAuthorName(author);
  const family = withoutAsterisks(author.familyName);
  const given = withoutAsterisks(author.givenName);
  const initials = withoutAsterisks(author.initials);
  if (family && given) return truncateField(`${family}, ${given}`, 255);
  if (family && initials) return truncateField(`${family}, ${initials}`, 255);
  return formatRisAuthorName(author.name || family);
}

function getAuthors(article) {
  const authors = Array.isArray(article?.authors) ? article.authors : [];
  return authors.map((author) => formatRisAuthorFromEntry(author)).filter(Boolean);
}

function getPublicationTypeLabels(article) {
  const labels = [];
  const pushValue = (value) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => pushValue(entry));
      return;
    }
    const text = normalizeText(value);
    if (text) labels.push(text);
  };
  pushValue(article?.pubtype);
  pushValue(article?.pubType);
  pushValue(article?.publicationTypes);
  pushValue(article?.doctype);
  pushValue(article?.docType);
  const seen = new Set();
  return labels.filter((label) => {
    const key = label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getReferenceType(article) {
  const typeText = getPublicationTypeLabels(article).join(" ").toLowerCase();
  if (/\bbook[- ]?(section|chapter)\b|\bchapter\b/.test(typeText)) return "CHAP";
  if (/\bthesis\b|\bdissertation\b/.test(typeText)) return "THES";
  if (/\bconference\b|\bproceedings\b/.test(typeText)) return "CPAPER";
  if (/\bbook\b/.test(typeText) && !/\bjournal\b/.test(typeText)) return "BOOK";
  const booktitle = normalizeText(article?.booktitle);
  const journal = withoutAsterisks(article?.fulljournalname) || withoutAsterisks(article?.source);
  if (booktitle && !journal) return "BOOK";
  return "JOUR";
}

function flattenAbstract(value) {
  if (typeof value === "string") return normalizeText(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return normalizeText(entry);
        const body = normalizeText(entry?.text);
        if (!body) return "";
        const heading = normalizeText(entry?.label);
        return heading ? `${heading}: ${body}` : body;
      })
      .filter(Boolean)
      .join(" ");
  }
  if (!value || typeof value !== "object") return "";
  return Object.entries(value)
    .map(([label, text]) => {
      const body = normalizeText(text);
      if (!body) return "";
      const heading = normalizeText(label);
      return heading ? `${heading}: ${body}` : body;
    })
    .filter(Boolean)
    .join(" ");
}

function getLanguage(article) {
  const direct = normalizeText(article?.language);
  if (direct) return direct;
  if (Array.isArray(article?.lang)) return normalizeText(article.lang[0]);
  return normalizeText(article?.lang);
}

function getBiblioFallback(article) {
  const metadata =
    article?.mergedDoiMetadata && typeof article.mergedDoiMetadata === "object"
      ? article.mergedDoiMetadata
      : {};
  const biblio =
    metadata.primaryBibliography && typeof metadata.primaryBibliography === "object"
      ? metadata.primaryBibliography
      : {};
  return biblio;
}

function appendUniqueUrl(urls, url) {
  const normalized = normalizeText(url);
  if (!normalized || !/^https?:\/\//i.test(normalized)) return;
  if (urls.some((entry) => entry.toLowerCase() === normalized.toLowerCase())) return;
  urls.push(normalized);
}

export function articleToRisRecord(article) {
  const safeArticle = article && typeof article === "object" ? article : {};
  const biblio = getBiblioFallback(safeArticle);
  const type = getReferenceType(safeArticle);
  const title = normalizeText(safeArticle.title) || normalizeText(safeArticle.booktitle);
  const translatedTitle = normalizeText(safeArticle.vernaculartitle);
  const journalFull =
    withoutAsterisks(safeArticle.fulljournalname) || withoutAsterisks(biblio.fulljournalname);
  const journalAbbrev =
    withoutAsterisks(safeArticle.sourceAbbreviatedTitle) ||
    withoutAsterisks(safeArticle.source) ||
    withoutAsterisks(biblio.source);
  const pmid = normalizePmidValue(safeArticle.pmid || "");
  const doi = normalizeDoiValue(safeArticle.doi || getArticleId(safeArticle, "doi"));
  const pmcId = getPmcId(safeArticle);
  const openAlexId = normalizeOpenAlexIdValue(
    safeArticle.openAlexId || getArticleId(safeArticle, "openalex")
  );
  const issn = getIssn(safeArticle);
  const essn = withoutAsterisks(safeArticle.essn);
  const language = getLanguage(safeArticle);
  const abstract =
    flattenAbstract(safeArticle.abstract) || flattenAbstract(safeArticle.abstractSections);
  const volume = normalizeText(safeArticle.volume) || normalizeText(biblio.volume);
  const issue = normalizeText(safeArticle.issue) || normalizeText(biblio.issue);
  const pages = splitRisPages(safeArticle.pages || biblio.pages);
  const publisher = withoutAsterisks(safeArticle.publisher || safeArticle.publishername);
  const workType = getPublicationTypeLabels(safeArticle)[0] || "";
  const dateParts = parseRisPublicationDate(
    safeArticle.publicationDate ||
      safeArticle.pubdate ||
      safeArticle.pubDate ||
      safeArticle.year ||
      ""
  );
  const da = formatRisDate(dateParts);
  const epubDate = formatRisDate(parseRisPublicationDate(safeArticle.epubdate || ""));
  const origin = normalizeText(safeArticle.originSource).toLowerCase();
  const urls = [];
  const fullTextUrl = normalizeText(safeArticle.openAccessUrl);
  const elocationId = normalizeText(safeArticle.elocationid);

  if (pmid) {
    appendUniqueUrl(urls, `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`);
  }
  if (pmcId) {
    appendUniqueUrl(urls, `https://www.ncbi.nlm.nih.gov/pmc/articles/${pmcId}/`);
  }
  if (doi) {
    appendUniqueUrl(urls, `https://doi.org/${doi}`);
  }
  if (openAlexId) {
    appendUniqueUrl(urls, `https://openalex.org/${openAlexId}`);
  }

  const notes = [];
  if (pmid) notes.push(`PMID: ${pmid}`);
  if (pmcId) notes.push(`PMCID: ${pmcId}`);
  if (safeArticle.isRetracted === true) notes.push("Retracted");

  let record = risLine("TY", type);
  for (const author of getAuthors(safeArticle)) {
    record += risLine("AU", author);
  }
  if (title) record += risLine("TI", title);
  if (translatedTitle && translatedTitle !== title) record += risLine("TT", translatedTitle);
  if (journalFull) record += risLine("T2", journalFull);
  else if (journalAbbrev) record += risLine("T2", journalAbbrev);
  if (journalAbbrev && journalAbbrev !== journalFull) {
    record += risLine("J2", journalAbbrev);
  }
  if (abstract) record += risLine("AB", abstract);
  if (dateParts.year) record += risLine("PY", dateParts.year);
  if (da) record += risLine("DA", da);
  if (epubDate) record += risLine("Y2", epubDate);
  if (volume) record += risLine("VL", volume);
  if (issue) record += risLine("IS", issue);
  if (pages.start) record += risLine("SP", pages.start);
  if (pages.end) record += risLine("EP", pages.end);
  if (!pages.start && elocationId && !/^doi:/i.test(elocationId)) {
    record += risLine("C7", elocationId);
  }
  if (issn) record += risLine("SN", issn);
  else if (essn) record += risLine("SN", essn);
  if (doi) record += risLine("DO", doi);
  if (publisher) record += risLine("PB", publisher);
  if (workType) record += risLine("M3", workType);
  if (language) record += risLine("LA", language);
  if (pmid) record += risLine("AN", pmid);
  if (origin === "pubmed" || pmid) {
    record += risLine("DB", "PubMed");
    record += risLine("DP", "National Library of Medicine");
  } else if (origin === "openalex") {
    record += risLine("DB", "OpenAlex");
  } else if (origin === "semanticscholar") {
    record += risLine("DB", "Semantic Scholar");
  } else if (origin === "elicit") {
    record += risLine("DB", "Elicit");
  }
  for (const url of urls) {
    record += risLine("UR", url);
  }
  if (fullTextUrl) record += risLine("L2", fullTextUrl);
  for (const keyword of getKeywords(safeArticle)) {
    record += risLine("KW", keyword);
  }
  if (notes.length) {
    record += risLine("N1", notes.join(". "));
  }
  record += risLine("ER");
  return record;
}

export function buildRisFile(articles) {
  const records = (Array.isArray(articles) ? articles : [])
    .map((article) => articleToRisRecord(article))
    .filter((record) => record.startsWith("TY  - "));
  // Blank line between ER and the next TY. Reference Manager/RefDB require
  // each record to start with a newline; Zotero's RIS export does the same.
  return records.join(RIS_CRLF);
}

function padTimePart(value) {
  return String(value).padStart(2, "0");
}

export function buildRisDownloadFilename(date = new Date()) {
  const stamp = [
    date.getFullYear(),
    padTimePart(date.getMonth() + 1),
    padTimePart(date.getDate()),
    "-",
    padTimePart(date.getHours()),
    padTimePart(date.getMinutes()),
    padTimePart(date.getSeconds()),
  ].join("");
  return `muginscholar-references-${stamp}.ris`;
}

export function downloadRisFile(risText, filename = buildRisDownloadFilename()) {
  const content = String(risText || "");
  if (!content) return;
  const blob = new Blob([content], { type: RIS_MIME });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
