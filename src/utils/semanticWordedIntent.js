function normalizeString(value) {
  return String(value || "").trim();
}

function dedupeStrings(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).filter((value) => {
    const normalized = normalizeString(value);
    if (!normalized) return false;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupePositiveIntegers(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : [])
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isInteger(value) && value > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .sort((a, b) => a - b);
}

function dedupeItems(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = normalizeString(item?.id || item?.name || item?.preTranslation || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flattenItemGroups(groups) {
  return (Array.isArray(groups) ? groups : []).flatMap((group) => (Array.isArray(group) ? group : []));
}

function getItemSemanticConfig(item) {
  return item?.semanticConfig && typeof item.semanticConfig === "object" ? item.semanticConfig : {};
}

function getItemSemanticHardFilters(item) {
  const semanticConfig = getItemSemanticConfig(item);
  return semanticConfig?.hardFilters && typeof semanticConfig.hardFilters === "object"
    ? semanticConfig.hardFilters
    : {};
}

function getItemDoiOnlyRules(item) {
  const semanticConfig = getItemSemanticConfig(item);
  return Array.isArray(semanticConfig?.doiOnlyRules) ? semanticConfig.doiOnlyRules : [];
}

function getItemSourceFilters(item) {
  const semanticConfig = getItemSemanticConfig(item);
  return semanticConfig?.sourceFilters && typeof semanticConfig.sourceFilters === "object"
    ? semanticConfig.sourceFilters
    : {};
}

function flattenSoftHintValues(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenSoftHintValues(entry));
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => flattenSoftHintValues(entry));
  }
  const normalized = normalizeString(value);
  return normalized ? [normalized] : [];
}

function getItemSoftHints(item) {
  return dedupeStrings(flattenSoftHintValues(getItemSemanticConfig(item).softHints));
}

function normalizeOpenAlexSourceFilterConfig(input) {
  const safeInput = input && typeof input === "object" ? input : {};
  const publicationYears = dedupeStrings(
    Array.isArray(safeInput.publicationYear)
      ? safeInput.publicationYear
      : safeInput.publicationYear
      ? [safeInput.publicationYear]
      : []
  );

  return {
    language: dedupeStrings(Array.isArray(safeInput.language) ? safeInput.language : []),
    sourceType: dedupeStrings(Array.isArray(safeInput.sourceType) ? safeInput.sourceType : []),
    workType: dedupeStrings(Array.isArray(safeInput.workType) ? safeInput.workType : []),
    publicationYear: publicationYears.length === 1 ? publicationYears[0] : "",
  };
}

function normalizeElicitSourceFilterConfig(input) {
  const safeInput = input && typeof input === "object" ? input : {};
  return {
    typeTags: dedupeStrings(Array.isArray(safeInput.typeTags) ? safeInput.typeTags : []),
    includeKeywords: dedupeStrings(
      Array.isArray(safeInput.includeKeywords) ? safeInput.includeKeywords : []
    ),
    excludeKeywords: dedupeStrings(
      Array.isArray(safeInput.excludeKeywords) ? safeInput.excludeKeywords : []
    ),
  };
}

function collectSourceFilters(items) {
  const openAlexLanguage = [];
  const openAlexSourceType = [];
  const openAlexWorkType = [];
  const openAlexPublicationYears = [];
  const elicitTypeTags = [];
  const elicitIncludeKeywords = [];
  const elicitExcludeKeywords = [];

  (Array.isArray(items) ? items : []).forEach((item) => {
    const itemSourceFilters = getItemSourceFilters(item);
    const openAlexFilters = normalizeOpenAlexSourceFilterConfig(itemSourceFilters.openAlex);
    const elicitFilters = normalizeElicitSourceFilterConfig(itemSourceFilters.elicit);
    openAlexLanguage.push(...openAlexFilters.language);
    openAlexSourceType.push(...openAlexFilters.sourceType);
    openAlexWorkType.push(...openAlexFilters.workType);
    if (openAlexFilters.publicationYear) {
      openAlexPublicationYears.push(openAlexFilters.publicationYear);
    }
    elicitTypeTags.push(...elicitFilters.typeTags);
    elicitIncludeKeywords.push(...elicitFilters.includeKeywords);
    elicitExcludeKeywords.push(...elicitFilters.excludeKeywords);
  });
  const dedupedOpenAlexPublicationYears = dedupeStrings(openAlexPublicationYears);

  const openAlex = {
    language: dedupeStrings(openAlexLanguage),
    sourceType: dedupeStrings(openAlexSourceType),
    workType: dedupeStrings(openAlexWorkType),
    publicationYear:
      dedupedOpenAlexPublicationYears.length === 1 ? dedupedOpenAlexPublicationYears[0] : "",
  };
  const elicit = {
    typeTags: dedupeStrings(elicitTypeTags),
    includeKeywords: dedupeStrings(elicitIncludeKeywords),
    excludeKeywords: dedupeStrings(elicitExcludeKeywords),
  };

  const sourceFilters = {};
  if (
    openAlex.language.length > 0 ||
    openAlex.sourceType.length > 0 ||
    openAlex.workType.length > 0 ||
    openAlex.publicationYear
  ) {
    sourceFilters.openAlex = openAlex;
  }
  if (
    elicit.typeTags.length > 0 ||
    elicit.includeKeywords.length > 0 ||
    elicit.excludeKeywords.length > 0
  ) {
    sourceFilters.elicit = elicit;
  }
  return sourceFilters;
}

function getEnglishItemLabel(item) {
  const semanticQuery = normalizeString(item?.semanticScholarQuery || "");
  if (semanticQuery) return semanticQuery;
  const translationEn = normalizeString(item?.translations?.en || "");
  if (translationEn) return translationEn;
  return "";
}

function normalizeSemanticIntentContext(item) {
  const raw = getItemSemanticConfig(item).sourceContext;
  if (!raw) {
    return {
      en: "",
      semanticScholar: "",
      openAlex: "",
      elicit: "",
    };
  }
  if (typeof raw === "string") {
    const normalized = normalizeString(raw);
    return {
      en: normalized,
      semanticScholar: "",
      openAlex: "",
      elicit: "",
    };
  }
  if (typeof raw !== "object") {
    return {
      en: "",
      semanticScholar: "",
      openAlex: "",
      elicit: "",
    };
  }
  return {
    en: normalizeString(raw.en || raw.default || ""),
    semanticScholar: normalizeString(raw.semanticScholar || raw.semantic_scholar || ""),
    openAlex: normalizeString(raw.openAlex || raw.openalex || ""),
    elicit: normalizeString(raw.elicit || ""),
  };
}

function getSemanticIntentText(item, sourceKey = "") {
  const context = normalizeSemanticIntentContext(item);
  const sourceSpecific = sourceKey ? normalizeString(context[sourceKey] || "") : "";
  if (sourceSpecific) return sourceSpecific;
  if (context.en) return context.en;
  return getEnglishItemLabel(item);
}

function getRawFallbackLabel(item) {
  return normalizeString(item?.preTranslation || item?.name || "");
}

export function getItemSemanticPublicationDateYears(item) {
  const hardFilters = getItemSemanticHardFilters(item);
  const configuredYears = Array.isArray(hardFilters.publicationDateYears)
    ? hardFilters.publicationDateYears
    : [];
  return dedupePositiveIntegers(configuredYears);
}

export function normalizeSemanticPublicationDateYears(values) {
  return dedupePositiveIntegers(values);
}

export function buildOpenAlexPublicationYearFilter(publicationDateYears, now = new Date()) {
  const normalizedYears = normalizeSemanticPublicationDateYears(publicationDateYears);
  if (normalizedYears.length === 0) return "";
  const currentYear = now instanceof Date ? now.getFullYear() : new Date().getFullYear();
  const narrowestWindowYears = normalizedYears[0];
  const fromYear = currentYear - narrowestWindowYears + 1;
  return `${fromYear}-${currentYear}`;
}

export function matchesSemanticPublicationDateYears(
  { publicationDate = "", publicationYear = "" } = {},
  publicationDateYears = [],
  now = new Date()
) {
  const normalizedYears = normalizeSemanticPublicationDateYears(publicationDateYears);
  if (normalizedYears.length === 0) return true;

  const nowDate = now instanceof Date ? now : new Date();
  const cutoffDate = new Date(nowDate);
  cutoffDate.setHours(0, 0, 0, 0);
  cutoffDate.setFullYear(cutoffDate.getFullYear() - normalizedYears[0]);

  const normalizedPublicationDate = normalizeString(publicationDate);
  const exactDateMatch = normalizedPublicationDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (exactDateMatch) {
    const parsedDate = new Date(
      Number(exactDateMatch[1]),
      Number(exactDateMatch[2]) - 1,
      Number(exactDateMatch[3])
    );
    if (!Number.isNaN(parsedDate.getTime())) {
      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate >= cutoffDate;
    }
  }

  const currentYear = nowDate.getFullYear();
  const minimumYear = currentYear - normalizedYears[0] + 1;
  const parsedPublicationYear = Number.parseInt(publicationYear, 10);
  if (Number.isInteger(parsedPublicationYear)) {
    return parsedPublicationYear >= minimumYear;
  }

  const dateYearMatch = normalizedPublicationDate.match(/^(\d{4})/);
  if (dateYearMatch) {
    return Number.parseInt(dateYearMatch[1], 10) >= minimumYear;
  }

  return false;
}

export function hasHardSemanticHandling(item) {
  const publicationDateYears = getItemSemanticPublicationDateYears(item);
  if (publicationDateYears.length > 0) return true;
  const hardFilters = getItemSemanticHardFilters(item);
  const doiOnlyRules = getItemDoiOnlyRules(item);
  if (!hardFilters || typeof hardFilters !== "object") {
    return doiOnlyRules.length > 0;
  }
  return (
    Array.isArray(hardFilters?.filterProfile) ||
    Array.isArray(hardFilters?.publicationType) ||
    Array.isArray(hardFilters?.studyDesign) ||
    Array.isArray(hardFilters?.ageGroup) ||
    Array.isArray(hardFilters?.language) ||
    Array.isArray(hardFilters?.sourceFormat) ||
    doiOnlyRules.length > 0
  );
}

function collectHardFilterValues(items) {
  const hardFilters = {
    filterProfiles: [],
    publicationTypes: [],
    studyDesigns: [],
    ageGroups: [],
    languages: [],
    sourceFormats: [],
    publicationDateYears: [],
    doiOnlyRuleIds: [],
  };
  const hardFilterLabelsEnglish = [];

  (Array.isArray(items) ? items : []).forEach((item) => {
    const publicationDateYears = getItemSemanticPublicationDateYears(item);
    const itemHardFilters = getItemSemanticHardFilters(item);
    hardFilters.filterProfiles.push(
      ...(Array.isArray(itemHardFilters.filterProfile) ? itemHardFilters.filterProfile : [])
    );
    hardFilters.publicationTypes.push(
      ...(Array.isArray(itemHardFilters.publicationType) ? itemHardFilters.publicationType : [])
    );
    hardFilters.studyDesigns.push(
      ...(Array.isArray(itemHardFilters.studyDesign) ? itemHardFilters.studyDesign : [])
    );
    hardFilters.ageGroups.push(
      ...(Array.isArray(itemHardFilters.ageGroup) ? itemHardFilters.ageGroup : [])
    );
    hardFilters.languages.push(
      ...(Array.isArray(itemHardFilters.language) ? itemHardFilters.language : [])
    );
    hardFilters.sourceFormats.push(
      ...(Array.isArray(itemHardFilters.sourceFormat) ? itemHardFilters.sourceFormat : [])
    );
    const ruleIds = getItemDoiOnlyRules(item)
      .map((rule) => normalizeString(rule?.id || ""))
      .filter(Boolean);
    hardFilters.doiOnlyRuleIds.push(...ruleIds);
    hardFilters.publicationDateYears.push(...publicationDateYears);

    const englishLabel = getEnglishItemLabel(item);
    if (englishLabel && hasHardSemanticHandling(item)) {
      hardFilterLabelsEnglish.push(englishLabel);
    }
  });

  return {
    hardFilters: {
      filterProfiles: dedupeStrings(hardFilters.filterProfiles),
      publicationTypes: dedupeStrings(hardFilters.publicationTypes),
      studyDesigns: dedupeStrings(hardFilters.studyDesigns),
      ageGroups: dedupeStrings(hardFilters.ageGroups),
      languages: dedupeStrings(hardFilters.languages),
      sourceFormats: dedupeStrings(hardFilters.sourceFormats),
      publicationDateYears: dedupePositiveIntegers(hardFilters.publicationDateYears),
      doiOnlyRuleIds: dedupeStrings(hardFilters.doiOnlyRuleIds),
    },
    hardFilterLabelsEnglish: dedupeStrings(hardFilterLabelsEnglish),
  };
}

function buildSourceSpecificBlocks(items) {
  return {
    semanticScholar: dedupeStrings(
      (Array.isArray(items) ? items : []).map((item) => getSemanticIntentText(item, "semanticScholar"))
    ),
    openAlex: dedupeStrings(
      (Array.isArray(items) ? items : []).map((item) => getSemanticIntentText(item, "openAlex"))
    ),
    elicit: dedupeStrings(
      (Array.isArray(items) ? items : []).map((item) => getSemanticIntentText(item, "elicit"))
    ),
  };
}

export function buildSemanticWordedIntentContext({ topicGroups, limitDropdowns, limitData } = {}) {
  const topicItems = dedupeItems(flattenItemGroups(topicGroups));
  const limitItems = dedupeItems([
    ...flattenItemGroups(limitDropdowns),
    ...flattenItemGroups(Object.values(limitData || {})),
  ]);

  const selectedTopicsEnglish = dedupeStrings(topicItems.map((item) => getEnglishItemLabel(item)));
  const selectedLimitsEnglish = dedupeStrings(limitItems.map((item) => getEnglishItemLabel(item)));
  const untranslatedSelections = dedupeStrings(
    [...topicItems, ...limitItems]
      .filter((item) => getEnglishItemLabel(item) === "")
      .map((item) => getRawFallbackLabel(item))
  );

  const hardLimitItems = limitItems.filter((item) => hasHardSemanticHandling(item));
  const semanticLimitItems = limitItems.filter((item) => !hasHardSemanticHandling(item));
  const semanticLimitLabelsEnglish = dedupeStrings(
    semanticLimitItems.map((item) => getEnglishItemLabel(item))
  );
  const selectedTopicIntentEnglish = dedupeStrings(
    topicItems.map((item) => getSemanticIntentText(item))
  );
  const selectedSemanticLimitIntentEnglish = dedupeStrings(
    semanticLimitItems.map((item) => getSemanticIntentText(item))
  );
  const { hardFilters, hardFilterLabelsEnglish } = collectHardFilterValues(hardLimitItems);
  const explicitSoftHintsEnglish = dedupeStrings(limitItems.flatMap((item) => getItemSoftHints(item)));
  const sourceFilters = collectSourceFilters([...topicItems, ...limitItems]);
  const sourceSpecificBlocks = {
    semanticScholar: dedupeStrings([
      ...buildSourceSpecificBlocks(topicItems).semanticScholar,
      ...buildSourceSpecificBlocks(semanticLimitItems).semanticScholar,
    ]),
    openAlex: dedupeStrings([
      ...buildSourceSpecificBlocks(topicItems).openAlex,
      ...buildSourceSpecificBlocks(semanticLimitItems).openAlex,
    ]),
    elicit: dedupeStrings([
      ...buildSourceSpecificBlocks(topicItems).elicit,
      ...buildSourceSpecificBlocks(semanticLimitItems).elicit,
    ]),
  };

  const semanticBlocks = dedupeStrings([
    ...selectedTopicIntentEnglish,
    ...selectedSemanticLimitIntentEnglish,
    ...untranslatedSelections,
  ]);

  const semanticCoreText = semanticBlocks.join(". ");
  const displaySegments = [];
  if (semanticCoreText) {
    displaySegments.push(`Semantic search focus: ${semanticCoreText}.`);
  }
  if (hardFilterLabelsEnglish.length > 0) {
    displaySegments.push(
      `Filters handled outside semantic text: ${hardFilterLabelsEnglish.join("; ")}.`
    );
  }

  return {
    semanticWordedIntent: displaySegments.join(" ").trim(),
    semanticCoreText,
    semanticBlocks,
    selectedTopicsEnglish,
    selectedLimitsEnglish,
    selectedTopicIntentEnglish,
    selectedSemanticLimitIntentEnglish,
    semanticLimitLabelsEnglish,
    hardFilterLabelsEnglish,
    hardFilters,
    sourceFilters,
    sourceSpecificBlocks,
    softHintsEnglish: dedupeStrings([...semanticLimitLabelsEnglish, ...explicitSoftHintsEnglish]),
    excludedFromSemanticText: hardFilterLabelsEnglish,
    untranslatedSelections,
  };
}
