function normalizeStringValue(value) {
  return String(value ?? "").trim();
}

export function normalizeDoiValue(value) {
  return normalizeStringValue(value)
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim();
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
    .map((entry) =>
      formatOpenAlexAuthorName(entry?.raw_author_name, entry?.author?.display_name)
    )
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
  return positions.map((entry) => entry[1]).join(" ").trim();
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
  const isPubMedNative = safeResult.trustedPmid === true || (safeResult.type === "pmid" && pmid !== "");
  const uid = pmid && isPubMedNative ? pmid : doi ? `doi:${doi.toLowerCase()}` : normalizeStringValue(safeResult.resultKey) || pmid || "";

  const journal = safeResult.journal && typeof safeResult.journal === "object" ? safeResult.journal : {};
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
        .map((author) => normalizeStringValue(author?.name))
        .filter(Boolean)
        .map((name) => ({ name }))
    : [];

  return {
    id: uid,
    uid,
    pmid: pmid || null,
    doi,
    title: normalizeStringValue(safeResult.title || ""),
    authors,
    source,
    fulljournalname,
    publicationDate: normalizeStringValue(safeResult.publicationDate || ""),
    pubDate,
    pubdate: pubDate,
    volume: normalizeStringValue(journal.volume || ""),
    issue: normalizeStringValue(journal.issue || ""),
    pages: normalizeStringValue(journal.pages || ""),
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
    isOpenAccess: typeof safeResult.isOpenAccess === "boolean" ? safeResult.isOpenAccess : null,
    openAccessUrl: normalizeStringValue(safeResult.openAccessUrl || ""),
    isRetracted: typeof safeResult.isRetracted === "boolean" ? safeResult.isRetracted : null,
    aiSummary: normalizeStringValue(safeResult.aiSummary || ""),
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
  const normalizedDoi = normalizeDoiValue(
    safeWork?.doi || safeWork?.ids?.doi || doi
  );
  const pmid = normalizeStringValue(
    safeWork?.pmid || safeWork?.ids?.pmid || ""
  ).replace(/[^\d]/g, "");
  const resolvedOpenAlexId = normalizeStringValue(safeWork?.id || openAlexId);
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
  const pages =
    firstPage && lastPage ? `${firstPage}-${lastPage}` : firstPage || lastPage || "";
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
