function normalizeStringValue(value) {
  return String(value ?? "").trim();
}

export function normalizeDoiValue(value) {
  return normalizeStringValue(value)
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
}

export function normalizeOpenAlexIdValue(value) {
  const match = normalizeStringValue(value).match(/W\d+/i);
  return match ? match[0].toUpperCase() : "";
}

export function normalizePmidValue(value) {
  const raw = normalizeStringValue(value);
  if (/^[0-9]+$/.test(raw)) {
    return raw;
  }
  const match = raw.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i);
  return match ? match[1] : "";
}

export function isPlausibleDoiValue(value) {
  const doi = normalizeDoiValue(value);
  return /^10\.\d{4,9}\/\S+$/.test(doi);
}

export function parseSelectedIdentifierToken(value) {
  if (value && typeof value === "object") {
    const type = normalizeStringValue(value.type).toLowerCase();
    const raw = normalizeStringValue(value.value);
    if (type === "pmid") {
      const pmid = normalizePmidValue(raw);
      return pmid ? { type: "pmid", value: pmid } : null;
    }
    if (type === "doi") {
      const doi = normalizeDoiValue(raw);
      return isPlausibleDoiValue(doi) ? { type: "doi", value: doi } : null;
    }
    return null;
  }

  const raw = normalizeStringValue(value);
  if (!raw) return null;
  const pmidPrefixed = raw.match(/^pmid:\s*(.+)$/i);
  if (pmidPrefixed) {
    const pmid = normalizePmidValue(pmidPrefixed[1]);
    return pmid ? { type: "pmid", value: pmid } : null;
  }
  const doiPrefixed = raw.match(/^doi:\s*(.+)$/i);
  if (doiPrefixed) {
    const doi = normalizeDoiValue(doiPrefixed[1]);
    return isPlausibleDoiValue(doi) ? { type: "doi", value: doi } : null;
  }
  const pmid = normalizePmidValue(raw);
  if (pmid) return { type: "pmid", value: pmid };
  const doi = normalizeDoiValue(raw);
  return isPlausibleDoiValue(doi) ? { type: "doi", value: doi } : null;
}

export function formatSelectedIdentifierToken(type, value) {
  if (type === "pmid" && value) return `pmid:${value}`;
  if (type === "doi" && value) return `doi:${value}`;
  return "";
}

export function formatSelectedIdentifierFromResult(entry) {
  const pmid = normalizePmidValue(entry?.pmid || "");
  if (pmid) {
    return formatSelectedIdentifierToken("pmid", pmid);
  }
  const uid = normalizeStringValue(entry?.uid || entry?.id || "");
  if (/^[0-9]+$/.test(uid)) {
    return formatSelectedIdentifierToken("pmid", uid);
  }
  const doi = normalizeDoiValue(entry?.doi || uid);
  if (isPlausibleDoiValue(doi)) {
    return formatSelectedIdentifierToken("doi", doi);
  }
  return "";
}

export function normalizeSelectedIdentifierList(values) {
  const output = [];
  const seen = new Set();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const parsed = parseSelectedIdentifierToken(value);
    if (!parsed) return;
    const token = formatSelectedIdentifierToken(parsed.type, parsed.value);
    const key = `${parsed.type}:${parsed.type === "doi" ? parsed.value.toLowerCase() : parsed.value}`;
    if (!token || seen.has(key)) return;
    seen.add(key);
    output.push(token);
  });
  return output;
}

function buildPubMedArticleIds(pmid, doi, openAlexId = "") {
  const articleids = [];
  if (pmid) {
    articleids.push({ idtype: "pubmed", value: pmid });
  }
  if (doi) {
    articleids.push({ idtype: "doi", value: doi });
  }
  if (openAlexId) {
    articleids.push({ idtype: "openalex", value: openAlexId });
  }
  return articleids;
}

function extractAuthorInitials(value) {
  const letterGroups = String(value || "").match(/\p{L}+/gu) || [];
  return letterGroups.map((group) => group[0].toUpperCase()).join("");
}

function formatPersonNameAsFamilyInitials(name) {
  const normalizedName = normalizeStringValue(name).replace(/\s+/g, " ");
  if (!normalizedName) return "";

  const commaIndex = normalizedName.indexOf(",");
  if (commaIndex >= 0) {
    const familyName = normalizeStringValue(normalizedName.slice(0, commaIndex));
    const givenNames = normalizeStringValue(normalizedName.slice(commaIndex + 1));
    const initials = extractAuthorInitials(givenNames);
    return initials ? `${familyName} ${initials}` : familyName;
  }

  const nameParts = normalizedName.match(/\p{L}+/gu) || [];
  if (nameParts.length >= 2) {
    const familyName = nameParts[nameParts.length - 1];
    const givenNames = nameParts.slice(0, -1).join(" ");
    const initials = extractAuthorInitials(givenNames);
    return initials ? `${familyName} ${initials}` : normalizedName;
  }

  return normalizedName;
}

function formatOpenAlexAuthorName(rawAuthorName, displayName) {
  const normalizedRawAuthorName = normalizeStringValue(rawAuthorName).replace(/\s+/g, " ");
  if (normalizedRawAuthorName) {
    return formatPersonNameAsFamilyInitials(normalizedRawAuthorName);
  }

  const normalizedDisplayName = normalizeStringValue(displayName).replace(/\s+/g, " ");
  return formatPersonNameAsFamilyInitials(normalizedDisplayName);
}

function extractOpenAlexAuthors(work) {
  const authorships = Array.isArray(work?.authorships) ? work.authorships : [];
  return authorships
    .map((entry) => formatOpenAlexAuthorName(entry?.raw_author_name, entry?.author?.display_name))
    .filter(Boolean)
    .map((name) => ({ name }));
}

function reconstructOpenAlexAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";
  const positions = [];
  for (const [token, value] of Object.entries(invertedIndex)) {
    if (!Array.isArray(value)) continue;
    value.forEach((position) => {
      const parsed = Number(position);
      if (Number.isFinite(parsed) && parsed >= 0) {
        positions.push([parsed, token]);
      }
    });
  }
  if (positions.length === 0) return "";
  positions.sort((a, b) => a[0] - b[0]);
  return positions
    .map((entry) => entry[1])
    .join(" ")
    .trim();
}

function formatOpenAlexPublicationDate(work) {
  const publicationDate = normalizeStringValue(work?.publication_date || "");
  const publicationYear = normalizeStringValue(work?.publication_year || "");
  const match = publicationDate.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (match) {
    const months = [
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
    const monthIndex = Number(match[2]) - 1;
    if (monthIndex >= 0 && monthIndex < months.length) {
      const day = Number(match[3]);
      return Number.isFinite(day) && day > 0
        ? `${match[1]} ${months[monthIndex]} ${day}`
        : `${match[1]} ${months[monthIndex]}`;
    }
  }
  return publicationYear || publicationDate;
}

export function mapPubMedSummaryToResultDto(summary) {
  const safeSummary = summary && typeof summary === "object" ? summary : {};
  const pmid = normalizeStringValue(safeSummary.uid);
  const doi = normalizeDoiValue(
    Array.isArray(safeSummary.articleids)
      ? safeSummary.articleids.find((item) => item?.idtype === "doi")?.value
      : ""
  );

  return {
    ...safeSummary,
    id: pmid,
    uid: pmid,
    pmid,
    doi,
    originSource: "pubmed",
    isPubMedNative: true,
    canOpenInPubMed: pmid !== "",
    canFetchPubMedAbstract: pmid !== "",
    mergedDoiMetadata: null,
    articleids: Array.isArray(safeSummary.articleids)
      ? safeSummary.articleids
      : buildPubMedArticleIds(pmid, doi),
  };
}

// Maps a single `SearchResult` object from the unified public API
// (POST /v1/search, see backend/docs/public-search-openapi.yaml) to the same
// flat UI result DTO shape produced by mapPubMedSummaryToResultDto() /
// mapOpenAlexWorkToResultDto() above, so SearchForm.vue can render unified
// results (unified-search-engine-full-parity plan, Phase 7) through the
// existing SearchResult.vue/ResultEntry.vue components unchanged.
export function mapUnifiedApiResultToResultDto(apiResult) {
  const safeResult = apiResult && typeof apiResult === "object" ? apiResult : {};
  const pmid = normalizeStringValue(safeResult.pmid).replace(/[^\d]/g, "");
  const doi = normalizeDoiValue(safeResult.doi);
  const isPubMedNative =
    safeResult.trustedPmid === true || (safeResult.type === "pmid" && pmid !== "");
  const uid =
    pmid && isPubMedNative
      ? pmid
      : doi
      ? `doi:${doi.toLowerCase()}`
      : normalizeStringValue(safeResult.resultKey) || pmid || "";

  const journal =
    safeResult.journal && typeof safeResult.journal === "object" ? safeResult.journal : {};
  const source = normalizeStringValue(safeResult.sourceLabel || journal.name || "");
  const fulljournalname = normalizeStringValue(journal.name || source);
  const pubDate = normalizeStringValue(safeResult.publicationDate || safeResult.year || "");
  const publicationTypes = Array.isArray(safeResult.publicationTypes)
    ? safeResult.publicationTypes.map((value) => normalizeStringValue(value)).filter(Boolean)
    : [];
  const abstract = normalizeStringValue(safeResult.abstract || "");
  const hasAbstract = safeResult.hasAbstract === true || abstract !== "";
  const authors = Array.isArray(safeResult.authors)
    ? safeResult.authors
        .map((author) => {
          if (!author || typeof author !== "object") return null;
          const name = normalizeStringValue(author.name);
          const familyName = normalizeStringValue(author.familyName);
          if (!name && !familyName) return null;
          return {
            name: name || familyName,
            familyName,
            givenName: normalizeStringValue(author.givenName),
            initials: normalizeStringValue(author.initials),
          };
        })
        .filter(Boolean)
    : [];

  return {
    id: uid,
    uid,
    pmid: pmid || null,
    pmcId: normalizeStringValue(safeResult.pmcId || ""),
    doi,
    title: normalizeStringValue(safeResult.title || ""),
    authors,
    source,
    fulljournalname,
    publicationDate: normalizeStringValue(safeResult.publicationDate || ""),
    year: normalizeStringValue(safeResult.year || ""),
    pubDate,
    pubdate: pubDate,
    volume: normalizeStringValue(journal.volume || ""),
    issue: normalizeStringValue(journal.issue || ""),
    pages: normalizeStringValue(journal.pages || ""),
    issn: normalizeStringValue(journal.issn || ""),
    abstract,
    hasAbstract,
    pubType: publicationTypes[0] || "",
    pubtype: publicationTypes,
    docType: publicationTypes[0] || "",
    doctype: publicationTypes[0] || "",
    booktitle: "",
    vernaculartitle: "",
    history: [],
    articleids: buildPubMedArticleIds(pmid, doi),
    attributes: hasAbstract ? { "Has Abstract": "Has Abstract" } : {},
    originSource: normalizeStringValue(safeResult.originSource || (isPubMedNative ? "pubmed" : "")),
    isPubMedNative,
    canOpenInPubMed: safeResult.canOpenInPubMed === true,
    canFetchPubMedAbstract: isPubMedNative,
    mergedDoiMetadata: null,
    language: normalizeStringValue(safeResult.language || ""),
    pubTypeClassification: null,
    // Additive passthrough of unified-engine-only signals not produced by the
    // legacy local mappers above. Harmless if unused by current UI components.
    citationCount: Number.isFinite(safeResult.citationCount) ? safeResult.citationCount : null,
    citationCountSource: normalizeStringValue(safeResult.citationCountSource || ""),
    isOpenAccess: typeof safeResult.isOpenAccess === "boolean" ? safeResult.isOpenAccess : null,
    openAccessUrl: normalizeStringValue(safeResult.openAccessUrl || ""),
    isRetracted: typeof safeResult.isRetracted === "boolean" ? safeResult.isRetracted : null,
    aiSummary: normalizeStringValue(safeResult.aiSummary || ""),
    abstractSource: normalizeStringValue(safeResult.abstractSource || ""),
    mergedSources: Array.isArray(safeResult.mergedSources)
      ? safeResult.mergedSources.map((value) => normalizeStringValue(value)).filter(Boolean)
      : [],
    ranking:
      safeResult.ranking && typeof safeResult.ranking === "object" ? safeResult.ranking : null,
    topics: Array.isArray(safeResult.topics)
      ? safeResult.topics
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => ({
            label: normalizeStringValue(entry.label || ""),
            source: normalizeStringValue(entry.source || ""),
          }))
          .filter((entry) => entry.label && entry.source !== "openAlexConcept")
      : [],
    rank: Number.isFinite(safeResult.rank) ? safeResult.rank : null,
    resultKey: normalizeStringValue(safeResult.resultKey || ""),
    openAlexId: normalizeStringValue(safeResult.openAlexId || ""),
    trustedPmid: safeResult.trustedPmid === true,
  };
}

function namedOpenAlexDisplayName(entry) {
  if (typeof entry === "string" || typeof entry === "number") {
    return normalizeStringValue(entry);
  }
  if (entry && typeof entry === "object") {
    return normalizeStringValue(entry.display_name || entry.name || entry.keyword || "");
  }
  return "";
}

function appendUniqueResultTopic(topics, label, source) {
  const normalizedLabel = namedOpenAlexDisplayName(label);
  const normalizedSource = normalizeStringValue(source);
  if (!normalizedLabel || !normalizedSource || normalizedSource === "openAlexConcept") {
    return;
  }
  const exists = topics.some(
    (entry) =>
      entry.source === normalizedSource &&
      entry.label.toLowerCase() === normalizedLabel.toLowerCase()
  );
  if (!exists) {
    topics.push({ label: normalizedLabel, source: normalizedSource });
  }
}

export function mergeResultTopicEntries(...lists) {
  const topics = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!entry || typeof entry !== "object") continue;
      appendUniqueResultTopic(topics, entry.label, entry.source);
    }
  }
  return topics;
}

export function extractOpenAlexWorkTopics(work) {
  const safeWork = work && typeof work === "object" ? work : {};
  const topics = [];
  const primary = namedOpenAlexDisplayName(safeWork.primary_topic);
  if (primary) {
    appendUniqueResultTopic(topics, primary, "openAlex");
  }
  const topicEntries = Array.isArray(safeWork.topics) ? safeWork.topics : [];
  const topicNames = new Set(primary ? [primary.toLowerCase()] : []);
  for (const entry of topicEntries) {
    const label = namedOpenAlexDisplayName(entry);
    if (!label || topicNames.has(label.toLowerCase())) continue;
    topicNames.add(label.toLowerCase());
    appendUniqueResultTopic(topics, label, "openAlexTopic");
  }
  const keywords = Array.isArray(safeWork.keywords) ? safeWork.keywords : [];
  for (const entry of keywords) {
    appendUniqueResultTopic(topics, namedOpenAlexDisplayName(entry), "openAlexKeyword");
  }
  const consider = [
    ...(safeWork.primary_topic && typeof safeWork.primary_topic === "object"
      ? [safeWork.primary_topic]
      : []),
    ...topicEntries.filter((entry) => entry && typeof entry === "object"),
  ];
  const subfieldSeen = new Set();
  for (const entry of consider) {
    const subfield = namedOpenAlexDisplayName(entry?.subfield);
    const key = subfield.toLowerCase();
    if (!subfield || topicNames.has(key) || subfieldSeen.has(key)) continue;
    subfieldSeen.add(key);
    appendUniqueResultTopic(topics, subfield, "openAlexSubfield");
  }
  return topics;
}

export function appendCandidateTopicSignals(topics, candidate) {
  const list = mergeResultTopicEntries(topics);
  const metadata =
    candidate?.metadata && typeof candidate.metadata === "object" ? candidate.metadata : {};
  const primary = normalizeStringValue(metadata.primaryTopicDisplayName || "");
  if (primary) {
    appendUniqueResultTopic(list, primary, "openAlex");
  }
  const extraTopics = Array.isArray(metadata.openAlexTopics) ? metadata.openAlexTopics : [];
  for (const label of extraTopics) {
    if (
      primary &&
      String(label || "")
        .trim()
        .toLowerCase() === primary.toLowerCase()
    )
      continue;
    appendUniqueResultTopic(list, label, "openAlexTopic");
  }
  const keywords = Array.isArray(metadata.openAlexKeywords) ? metadata.openAlexKeywords : [];
  for (const label of keywords) {
    appendUniqueResultTopic(list, label, "openAlexKeyword");
  }
  const subfields = Array.isArray(metadata.openAlexSubfields) ? metadata.openAlexSubfields : [];
  for (const label of subfields) {
    appendUniqueResultTopic(list, label, "openAlexSubfield");
  }
  const s2Fields = Array.isArray(metadata.s2FieldsOfStudy) ? metadata.s2FieldsOfStudy : [];
  for (const label of s2Fields) {
    appendUniqueResultTopic(list, label, "semanticScholar");
  }
  return list;
}

export function unwrapOpenAlexWorkLookupEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const nestedWork = entry.work && typeof entry.work === "object" ? entry.work : null;
  const rawWork =
    !nestedWork && (entry.id || entry.doi || entry.display_name) ? entry : null;
  const work = nestedWork || rawWork;
  if (!work) return null;
  return {
    doi: normalizeDoiValue(entry.doi || work.doi || work.ids?.doi || ""),
    openAlexId: entry.openAlexId || work.id,
    work,
  };
}

export function mapOpenAlexWorkToResultDto(
  work,
  { doi = "", openAlexId = "", pubTypeClassification = null } = {}
) {
  const safeWork = work && typeof work === "object" ? work : {};
  const sourceObject =
    safeWork?.primary_location?.source && typeof safeWork.primary_location.source === "object"
      ? safeWork.primary_location.source
      : {};
  const normalizedDoi = normalizeDoiValue(safeWork?.doi || safeWork?.ids?.doi || doi);
  const pmid = normalizeStringValue(safeWork?.pmid || safeWork?.ids?.pmid || "").replace(
    /[^\d]/g,
    ""
  );
  const resolvedOpenAlexId = normalizeOpenAlexIdValue(safeWork?.id || openAlexId);
  const fallbackId = resolvedOpenAlexId || normalizedDoi;
  const uid = normalizedDoi ? `doi:${normalizedDoi.toLowerCase()}` : `oa:${fallbackId}`;
  const sourceDisplayName = normalizeStringValue(sourceObject?.display_name || "");
  const sourceAbbreviatedTitle = normalizeStringValue(sourceObject?.abbreviated_title || "");
  const sourceId = normalizeStringValue(sourceObject?.id || "");
  const sourceType = normalizeStringValue(sourceObject?.type || "");
  const publisher = normalizeStringValue(
    sourceObject?.host_organization_name || sourceObject?.publisher || ""
  );
  const source = sourceAbbreviatedTitle || sourceDisplayName;
  const abstract = reconstructOpenAlexAbstract(safeWork?.abstract_inverted_index);
  const publicationDate = normalizeStringValue(safeWork?.publication_date || "");
  const pubDate = formatOpenAlexPublicationDate(safeWork);
  const firstPage = normalizeStringValue(safeWork?.biblio?.first_page || "");
  const lastPage = normalizeStringValue(safeWork?.biblio?.last_page || "");
  const pages = firstPage && lastPage ? `${firstPage}-${lastPage}` : firstPage || lastPage || "";
  const language = normalizeStringValue(safeWork?.language || "");
  const workType = normalizeStringValue(safeWork?.type || safeWork?.type_crossref || "");
  const normalizedClassification =
    pubTypeClassification && typeof pubTypeClassification === "object"
      ? {
          tier: normalizeStringValue(pubTypeClassification.tier || ""),
          confidence: normalizeStringValue(pubTypeClassification.confidence || ""),
          signals: Array.isArray(pubTypeClassification.signals)
            ? pubTypeClassification.signals.map((entry) => String(entry || ""))
            : [],
        }
      : null;

  return {
    id: uid,
    uid,
    pmid: pmid || null,
    pmcId: normalizeStringValue(safeWork?.ids?.pmcid || ""),
    doi: normalizedDoi,
    title: normalizeStringValue(safeWork?.display_name || safeWork?.title || ""),
    authors: extractOpenAlexAuthors(safeWork),
    source,
    fulljournalname: sourceDisplayName || source,
    publicationDate,
    pubDate,
    pubdate: pubDate,
    volume: normalizeStringValue(safeWork?.biblio?.volume || ""),
    issue: normalizeStringValue(safeWork?.biblio?.issue || ""),
    pages,
    issn: normalizeStringValue(
      sourceObject?.issn_l || (Array.isArray(sourceObject?.issn) ? sourceObject.issn[0] : "")
    ),
    abstract,
    hasAbstract: abstract !== "",
    pubType: workType,
    pubtype: workType ? [workType] : [],
    docType: workType,
    doctype: workType,
    booktitle: "",
    vernaculartitle: "",
    history: [],
    articleids: buildPubMedArticleIds(pmid, normalizedDoi, resolvedOpenAlexId),
    attributes: abstract !== "" ? { "Has Abstract": "Has Abstract" } : {},
    originSource: "openAlex",
    isPubMedNative: false,
    canOpenInPubMed: pmid !== "",
    canFetchPubMedAbstract: false,
    topics: extractOpenAlexWorkTopics(safeWork),
    mergedDoiMetadata: {
      primarySource: "openAlex",
      primaryBibliography: {
        source,
        fulljournalname: sourceDisplayName || source,
        pubDate,
        volume: normalizeStringValue(safeWork?.biblio?.volume || ""),
        issue: normalizeStringValue(safeWork?.biblio?.issue || ""),
        pages,
      },
      secondarySignals: {},
      candidateSignal: null,
    },
    openAlexId: resolvedOpenAlexId,
    sourceId,
    sourceType,
    sourceDisplayName,
    sourceAbbreviatedTitle,
    publisher,
    language,
    pubTypeClassification: normalizedClassification,
  };
}
