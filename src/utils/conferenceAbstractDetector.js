// General conference-abstract detector for the "scientific article" source-format
// filter. Signals are structural (type, issue, source name, pagination, title
// code) and are not tied to a journal, DOI prefix, or society code list.
//
// A weak signal never excludes on its own. Missing fields stay fail-open.
// The PHP port is muginSemanticQualityIsConferenceAbstract() in
// backend/app/semantic-quality-lib.php. Keep the two in step.

const ABSTRACT_TYPE_KEYS = new Set(["conferenceabstract", "meetingabstract", "congressabstract"]);

const TITLE_PROGRAM_CODE =
  /^(?:[A-Za-z]{1,4}\d{0,4}-\d{1,4}|[A-Za-z]{1,4}-?\d{2,5}|\d{2,4}-[A-Za-z]{1,4})(?=$|[\s:.|])/;

const PAGE_SEPARATOR = /[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/;

function normalizeTypeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function hasAbstractType(types) {
  return (Array.isArray(types) ? types : []).some((type) =>
    ABSTRACT_TYPE_KEYS.has(normalizeTypeKey(type))
  );
}

function hasMeetingAbstractDoi(doi) {
  const normalized = String(doi || "").trim().toLowerCase();
  return normalized.includes("meeting-abstract") || normalized.includes("meetingabstracts");
}

function isAbstractIssue(issue) {
  const text = String(issue || "");
  if (!text.trim()) return false;
  return (
    /\bsuppl/i.test(text) ||
    /\bmeeting\b/i.test(text) ||
    /\bcongress\b/i.test(text) ||
    /\bconference\b/i.test(text) ||
    /\bposter\b/i.test(text)
  );
}

function isAbstractSourceName(sourceName) {
  return /\babstracts?\b/i.test(String(sourceName || ""));
}

function parsePageToken(token) {
  const match = String(token || "")
    .trim()
    .match(/^([A-Za-z]*)(\d+)([A-Za-z]*)$/);
  if (!match) return null;
  return {
    prefix: match[1].toUpperCase(),
    number: Number.parseInt(match[2], 10),
    suffix: match[3].toUpperCase(),
  };
}

function classifyPages(pages) {
  const text = String(pages || "").trim();
  if (!text) return { short: false, shortS: false };
  const parts = text
    .split(PAGE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > 2) return { short: false, shortS: false };

  const first = parsePageToken(parts[0]);
  if (!first) return { short: false, shortS: false };
  if (parts.length === 1) {
    const shortS = first.prefix === "S" && first.suffix === "";
    return { short: true, shortS };
  }

  let second = parsePageToken(parts[1]);
  if (!second) return { short: false, shortS: false };
  if (second.prefix === "" && first.prefix !== "") {
    second = { ...second, prefix: first.prefix };
  }
  if (first.prefix !== second.prefix || first.suffix !== second.suffix) {
    return { short: false, shortS: false };
  }
  const span = Math.abs(second.number - first.number);
  const onePage = span === 0;
  const shortS = first.prefix === "S" && first.suffix === "" && span <= 1;
  return { short: onePage || shortS, shortS };
}

function hasTitleProgramCode(title) {
  return TITLE_PROGRAM_CODE.test(String(title || "").trim());
}

/**
 * @param {{ title?: string, doi?: string, types?: string[], issue?: string, pages?: string, sourceName?: string }} record
 * @returns {boolean}
 */
export function isConferenceAbstract(record = {}) {
  const title = String(record?.title || "");
  const doi = String(record?.doi || "");
  const types = Array.isArray(record?.types) ? record.types : [];
  const issue = String(record?.issue || "");
  const pages = String(record?.pages || "");
  const sourceName = String(record?.sourceName || "");

  if (hasAbstractType(types) || hasMeetingAbstractDoi(doi)) return true;

  const abstractIssue = isAbstractIssue(issue);
  const abstractSource = isAbstractSourceName(sourceName);
  const pageInfo = classifyPages(pages);
  const titleCode = hasTitleProgramCode(title);

  if (abstractSource && pageInfo.short) return true;
  if (abstractIssue && pageInfo.shortS) return true;
  if (titleCode && (abstractIssue || pageInfo.short)) return true;
  return false;
}
