/**
 * Central contract for semantic post-validation rules.
 *
 * The actual rule instances live in `data/content/shared/limits.json`
 * under `semanticConfig.postValidation.rules` (with legacy fallback
 * from `semanticConfig.doiOnlyRules`), while SearchForm.vue
 * consumes and evaluates them as metadata rules for non-PMID records.
 *
 * Supported top-level rule fields:
 * - id
 * - exclusiveGroup
 * - matchStrategy: "all" | "any"
 * - metadataFieldConditionMode: "all" | "any"
 * - textScopes
 * - requireAnyTextSignals
 * - requireAllTextSignals
 * - excludeAnyTextSignals
 * - allowSourceProviders
 * - excludeSourceProviders
 * - metadataFieldConditions
 *
 * Supported metadataFieldCondition fields:
 * - field
 * - operator: "exists" | "equalsAny" | "includesAny"
 * - values
 * - expectExists
 * - negate
 */

export const SEMANTIC_DOI_ONLY_RULE_DEFAULTS = Object.freeze({
  matchStrategy: "all",
  metadataFieldConditionMode: "all",
  textScopes: ["candidateTitle", "sourceCandidateTitles"],
});

export const SEMANTIC_DOI_ONLY_RULE_MATCH_STRATEGIES = Object.freeze(["all", "any"]);
export const SEMANTIC_DOI_ONLY_RULE_METADATA_CONDITION_MODES = Object.freeze(["all", "any"]);

export const SEMANTIC_DOI_ONLY_RULE_TEXT_SCOPES = Object.freeze([
  "candidateTitle",
  "sourceCandidateTitles",
  "allText",
]);

export const SEMANTIC_DOI_ONLY_RULE_METADATA_OPERATORS = Object.freeze([
  "exists",
  "equalsAny",
  "includesAny",
]);

export const SEMANTIC_DOI_ONLY_RULE_METADATA_FIELDS = Object.freeze([
  "candidateSource",
  "sourceProviders",
  "hasOpenAlexId",
  "hasDoi",
  "openAlexId",
  "candidatePublicationYear",
  "candidateVenue",
  "candidateSourceType",
  "candidatePublicationTypes",
  "semanticSourcePublicationTypes",
  "semanticSourceVenues",
  "semanticSourceTypes",
  "openAlexSourceType",
  "openAlexSourceDisplayName",
  "openAlexSourceAbbreviatedTitle",
  "openAlexPrimarySource",
  "openAlexPubDate",
]);

export const SEMANTIC_DOI_ONLY_RULE_TEMPLATE = Object.freeze({
  id: "example-rule",
  exclusiveGroup: "",
  matchStrategy: SEMANTIC_DOI_ONLY_RULE_DEFAULTS.matchStrategy,
  metadataFieldConditionMode: SEMANTIC_DOI_ONLY_RULE_DEFAULTS.metadataFieldConditionMode,
  textScopes: [...SEMANTIC_DOI_ONLY_RULE_DEFAULTS.textScopes],
  requireAnyTextSignals: [],
  requireAllTextSignals: [],
  excludeAnyTextSignals: [],
  allowSourceProviders: [],
  excludeSourceProviders: [],
  metadataFieldConditions: [],
});

function flattenSemanticRuleValues(value) {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => flattenSemanticRuleValues(entry));
  }
  if (value && typeof value === "object") {
    return Object.values(value).flatMap((entry) => flattenSemanticRuleValues(entry));
  }
  const normalized = String(value || "").trim();
  return normalized ? [normalized] : [];
}

export function normalizeSemanticSignalList(values) {
  const seen = new Set();
  return flattenSemanticRuleValues(values)
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

export function normalizeSemanticMetadataFieldCondition(condition) {
  if (!condition || typeof condition !== "object") return null;
  const field = String(condition.field || "").trim();
  const operator = String(condition.operator || "equalsAny").trim().toLowerCase();
  if (!field) return null;
  const values = normalizeSemanticSignalList(
    Array.isArray(condition.values)
      ? condition.values
      : condition.value !== undefined
      ? [condition.value]
      : []
  );
  const expectExists =
    condition.expectExists === undefined ? true : Boolean(condition.expectExists);
  const negate = Boolean(condition.negate);
  return {
    field,
    operator: SEMANTIC_DOI_ONLY_RULE_METADATA_OPERATORS.includes(operator)
      ? operator
      : "equalsAny",
    values,
    expectExists,
    negate,
  };
}

export function normalizeSemanticDoiOnlyFilterRule(rule) {
  if (!rule || typeof rule !== "object") return null;
  const matchStrategy = String(
    rule.matchStrategy || SEMANTIC_DOI_ONLY_RULE_DEFAULTS.matchStrategy
  )
    .trim()
    .toLowerCase();
  const metadataFieldConditionMode = String(
    rule.metadataFieldConditionMode || SEMANTIC_DOI_ONLY_RULE_DEFAULTS.metadataFieldConditionMode
  )
    .trim()
    .toLowerCase();
  const textScopes = normalizeSemanticSignalList(rule.textScopes);
  const requireAnyTextSignals = normalizeSemanticSignalList(
    rule.requireAnyTextSignals || rule.requireAnyTitleSignals
  );
  const requireAllTextSignals = normalizeSemanticSignalList(rule.requireAllTextSignals);
  const excludeAnyTextSignals = normalizeSemanticSignalList(
    rule.excludeAnyTextSignals || rule.excludeAnyTitleSignals
  );
  const allowSourceProviders = normalizeSemanticSignalList(rule.allowSourceProviders);
  const excludeSourceProviders = normalizeSemanticSignalList(rule.excludeSourceProviders);
  const metadataFieldConditions = (Array.isArray(rule.metadataFieldConditions)
    ? rule.metadataFieldConditions
    : []
  )
    .map((condition) => normalizeSemanticMetadataFieldCondition(condition))
    .filter(Boolean);

  if (
    requireAnyTextSignals.length === 0 &&
    requireAllTextSignals.length === 0 &&
    excludeAnyTextSignals.length === 0 &&
    allowSourceProviders.length === 0 &&
    excludeSourceProviders.length === 0 &&
    metadataFieldConditions.length === 0
  ) {
    return null;
  }

  const exclusiveGroup = String(rule.exclusiveGroup || "").trim().toLowerCase();
  const explicitId = String(rule.id || "").trim();
  const generatedId = JSON.stringify({
    exclusiveGroup,
    textScopes,
    requireAnyTextSignals,
    requireAllTextSignals,
    excludeAnyTextSignals,
    allowSourceProviders,
    excludeSourceProviders,
    metadataFieldConditions,
  });

  return {
    id: explicitId || generatedId,
    exclusiveGroup,
    matchStrategy: SEMANTIC_DOI_ONLY_RULE_MATCH_STRATEGIES.includes(matchStrategy)
      ? matchStrategy
      : SEMANTIC_DOI_ONLY_RULE_DEFAULTS.matchStrategy,
    metadataFieldConditionMode:
      SEMANTIC_DOI_ONLY_RULE_METADATA_CONDITION_MODES.includes(metadataFieldConditionMode)
        ? metadataFieldConditionMode
        : SEMANTIC_DOI_ONLY_RULE_DEFAULTS.metadataFieldConditionMode,
    textScopes:
      textScopes.length > 0 ? textScopes : [...SEMANTIC_DOI_ONLY_RULE_DEFAULTS.textScopes],
    requireAnyTextSignals,
    requireAllTextSignals,
    excludeAnyTextSignals,
    allowSourceProviders,
    excludeSourceProviders,
    metadataFieldConditions,
  };
}

export function buildActiveSemanticDoiOnlyRuleState(selectedItems) {
  const dedupedRules = new Map();
  (Array.isArray(selectedItems) ? selectedItems : []).forEach((item) => {
    const postValidation =
      item?.semanticConfig?.postValidation && typeof item.semanticConfig.postValidation === "object"
        ? item.semanticConfig.postValidation
        : {};
    const rawRules =
      Array.isArray(postValidation.rules) && postValidation.rules.length > 0
        ? postValidation.rules
        : item?.semanticConfig?.doiOnlyRules;
    const rules = Array.isArray(rawRules) ? rawRules : rawRules ? [rawRules] : [];
    rules.forEach((rule) => {
      const normalizedRule = normalizeSemanticDoiOnlyFilterRule(rule);
      if (!normalizedRule || dedupedRules.has(normalizedRule.id)) return;
      dedupedRules.set(normalizedRule.id, normalizedRule);
    });
  });

  const activeRules = Array.from(dedupedRules.values());
  const ruleGroupsMap = new Map();
  activeRules.forEach((rule) => {
    const groupKey = rule.exclusiveGroup
      ? `exclusive:${rule.exclusiveGroup}`
      : `rule:${rule.id}`;
    if (!ruleGroupsMap.has(groupKey)) {
      ruleGroupsMap.set(groupKey, {
        id: groupKey,
        exclusiveGroup: rule.exclusiveGroup || "",
        rules: [],
      });
    }
    ruleGroupsMap.get(groupKey).rules.push(rule);
  });

  return {
    activeRules,
    ruleGroups: Array.from(ruleGroupsMap.values()),
  };
}
