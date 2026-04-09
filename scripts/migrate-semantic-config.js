import fs from "node:fs";
import path from "node:path";

const LIMITS_PATH = path.resolve(
  process.cwd(),
  "data",
  "content",
  "shared",
  "limits.json"
);

const HARD_FILTER_FIELD_MAP = Object.freeze({
  filterProfile: "filterProfile",
  publicationType: "publicationType",
  studyDesign: "studyDesign",
  ageGroup: "ageGroup",
  language: "language",
  sourceFormat: "sourceFormat",
});

const SOFT_HINT_FIELD_MAP = Object.freeze({
  general: "general",
  semanticScholar: "semanticScholar",
  openAlex: "openAlex",
  elicit: "elicit",
});

const DATE_FILTER_YEAR_MAP = Object.freeze({
  "y_1[filter]": 1,
  "y_5[filter]": 5,
  "y_10[filter]": 10,
});

const SKIPPED_LEGACY_FIELDS = new Set(["semanticHints", "semanticIntentContext"]);
const KNOWN_SEMANTIC_HINT_KEYS = new Set([
  ...Object.keys(HARD_FILTER_FIELD_MAP),
  ...Object.keys(SOFT_HINT_FIELD_MAP),
  "doiOnlyFilterRules",
  "softHints",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function getNodeLabel(node) {
  if (!isPlainObject(node)) return "";
  const translations = isPlainObject(node.translations) ? node.translations : {};
  return String(translations.dk || translations.en || node.id || "").trim();
}

function buildNodePath(parentPath, node) {
  const label = getNodeLabel(node);
  return label ? [...parentPath, label] : parentPath;
}

function getNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0 ? cloneValue(value) : [];
}

function getSemanticDateYearsFromSearchStrings(node) {
  const searchStrings = isPlainObject(node?.searchStrings) ? node.searchStrings : {};
  const seen = new Set();
  const years = [];

  Object.values(searchStrings).forEach((entries) => {
    (Array.isArray(entries) ? entries : []).forEach((entry) => {
      const normalized = String(entry || "").trim().toLowerCase();
      Object.entries(DATE_FILTER_YEAR_MAP).forEach(([filterValue, yearsValue]) => {
        if (normalized.includes(filterValue) && !seen.has(yearsValue)) {
          seen.add(yearsValue);
          years.push(yearsValue);
        }
      });
    });
  });

  return years.sort((a, b) => a - b);
}

function buildSemanticConfig(node, pathSegments, report) {
  const hasExistingSemanticConfig = isPlainObject(node?.semanticConfig);
  const semanticHints = isPlainObject(node?.semanticHints) ? node.semanticHints : null;
  const hasLegacyContext = node?.semanticIntentContext !== undefined;
  const legacyContext = hasLegacyContext ? cloneValue(node.semanticIntentContext) : null;
  const dateYears = getSemanticDateYearsFromSearchStrings(node);

  if (hasExistingSemanticConfig && !semanticHints && !hasLegacyContext) {
    return null;
  }

  if (!semanticHints && !hasLegacyContext && dateYears.length === 0) {
    return null;
  }

  const semanticConfig = {};
  const hardFilters = {};

  if (semanticHints) {
    Object.entries(HARD_FILTER_FIELD_MAP).forEach(([legacyKey, nextKey]) => {
      const values = getNonEmptyArray(semanticHints[legacyKey]);
      if (values.length > 0) {
        hardFilters[nextKey] = values;
      }
    });

    const softHints = isPlainObject(semanticHints.softHints) ? cloneValue(semanticHints.softHints) : {};
    Object.entries(SOFT_HINT_FIELD_MAP).forEach(([legacyKey, nextKey]) => {
      const values = getNonEmptyArray(semanticHints[legacyKey]);
      if (values.length > 0) {
        softHints[nextKey] = values;
      }
    });
    if (softHints && Object.keys(softHints).length > 0) {
      semanticConfig.softHints = softHints;
    }

    const doiOnlyRules = getNonEmptyArray(semanticHints.doiOnlyFilterRules);
    if (doiOnlyRules.length > 0) {
      semanticConfig.doiOnlyRules = doiOnlyRules;
    }

    const unexpectedKeys = Object.keys(semanticHints).filter(
      (key) => !KNOWN_SEMANTIC_HINT_KEYS.has(key)
    );
    if (unexpectedKeys.length > 0) {
      report.unexpectedSemanticHintKeys.push({
        path: pathSegments.join(" > "),
        keys: unexpectedKeys,
      });
    }
  }

  if (dateYears.length > 0) {
    hardFilters.publicationDateYears = dateYears;
    report.dateMappedNodes.push(pathSegments.join(" > "));
  }

  if (Object.keys(hardFilters).length > 0) {
    semanticConfig.hardFilters = hardFilters;
  }

  if (hasLegacyContext && legacyContext) {
    semanticConfig.sourceContext = legacyContext;
  }

  return Object.keys(semanticConfig).length > 0 ? semanticConfig : null;
}

function transformNode(node, parentPath, report) {
  if (!isPlainObject(node)) return { value: node, changed: false };

  const currentPath = buildNodePath(parentPath, node);
  let changed = false;
  const transformedChildren = new Map();

  ["groups", "children"].forEach((key) => {
    if (!Array.isArray(node[key])) return;
    const mapped = node[key].map((child) => transformNode(child, currentPath, report));
    transformedChildren.set(
      key,
      mapped.map((entry) => entry.value)
    );
    if (mapped.some((entry) => entry.changed)) {
      changed = true;
    }
  });

  const semanticConfig = buildSemanticConfig(node, currentPath, report);
  const hasLegacySemanticFields =
    Object.prototype.hasOwnProperty.call(node, "semanticHints") ||
    Object.prototype.hasOwnProperty.call(node, "semanticIntentContext");
  const shouldInsertSemanticConfig = semanticConfig !== null;

  const entries = [];
  let insertedSemanticConfig = false;

  Object.entries(node).forEach(([key, value]) => {
    const nextValue = transformedChildren.has(key) ? transformedChildren.get(key) : value;

    if (SKIPPED_LEGACY_FIELDS.has(key)) {
      if (shouldInsertSemanticConfig && !insertedSemanticConfig) {
        entries.push(["semanticConfig", semanticConfig]);
        insertedSemanticConfig = true;
      }
      changed = true;
      return;
    }

    if (key === "tooltip" && shouldInsertSemanticConfig && !insertedSemanticConfig) {
      entries.push(["semanticConfig", semanticConfig]);
      insertedSemanticConfig = true;
      changed = true;
    }

    entries.push([key, nextValue]);
  });

  if (shouldInsertSemanticConfig && !insertedSemanticConfig) {
    entries.push(["semanticConfig", semanticConfig]);
    insertedSemanticConfig = true;
    changed = true;
  }

  if (shouldInsertSemanticConfig && !hasLegacySemanticFields) {
    changed = true;
  }

  if (shouldInsertSemanticConfig) {
    report.changedNodes.push(currentPath.join(" > "));
  }

  return {
    value: Object.fromEntries(entries),
    changed,
  };
}

function buildReport(result, dryRun) {
  const summary = {
    mode: dryRun ? "dry-run" : "write",
    file: LIMITS_PATH,
    changedNodeCount: result.changedNodes.length,
    changedNodes: result.changedNodes,
    dateMappedNodeCount: result.dateMappedNodes.length,
    dateMappedNodes: result.dateMappedNodes,
    unexpectedSemanticHintKeyCount: result.unexpectedSemanticHintKeys.length,
    unexpectedSemanticHintKeys: result.unexpectedSemanticHintKeys,
  };
  return summary;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const source = fs.readFileSync(LIMITS_PATH, "utf8");
  const parsed = JSON.parse(source);

  if (!isPlainObject(parsed) || !Array.isArray(parsed.limits)) {
    throw new Error("limits.json har ikke det forventede topniveau med `limits`.");
  }

  const report = {
    changedNodes: [],
    dateMappedNodes: [],
    unexpectedSemanticHintKeys: [],
  };

  const transformedLimits = parsed.limits.map((node) => transformNode(node, [], report));
  const nextRoot = {
    ...parsed,
    limits: transformedLimits.map((entry) => entry.value),
  };
  const nextJson = `${JSON.stringify(nextRoot, null, 4)}\n`;

  if (!dryRun && nextJson !== source) {
    fs.writeFileSync(LIMITS_PATH, nextJson, "utf8");
  }

  console.log(JSON.stringify(buildReport(report, dryRun), null, 2));
}

main();
