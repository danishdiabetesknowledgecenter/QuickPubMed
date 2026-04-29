export const RERANK_PROFILE_STORAGE_KEY = "qpmResultFocusProfile";
export const RERANK_PROFILE_URL_PARAM = "resultfocus";

const ALLOWED_RERANK_OVERRIDE_KEYS = new Set([
  "sourceWeights",
  "pmidBonus",
  "rrfK",
  "rankScale",
  "scoreScale",
  "fallbackSourceWeight",
  "overlapBonusPerExtraSource",
  "pubTypeWeights",
  "recencyHalfLifeYears",
  "recencyBonusMax",
  "recencyCurveEnabled",
  "recencyCurve",
  "recencyMultiplierCurve",
  "oaBonus",
  "citationImpactClamp",
  "citationImpactSignalWeights",
  "translationPotentialBonusMax",
  "translationPotentialAptScale",
  "retractionAction",
  "retractionPenalty",
  "clinicalBonus",
  "clinicalCitedByThreshold",
  "topicOverlapBonus",
  "authorityClamp",
  "dataQualityPenalties",
  "abstractMinLength",
  "pubTypeTiers",
  "guidelinePublisherAllowList",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cloneProfileValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneProfileValue(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneProfileValue(entry)])
    );
  }
  return value;
}

function mergeObjects(base = {}, overrides = {}) {
  const result = { ...(isPlainObject(base) ? base : {}) };
  if (!isPlainObject(overrides)) return result;

  Object.entries(overrides).forEach(([key, value]) => {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeObjects(result[key], value);
      return;
    }
    result[key] = cloneProfileValue(value);
  });

  return result;
}

export function normalizeRerankProfileId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeRerankProfileOverrides(overrides) {
  if (!isPlainObject(overrides)) return {};

  return Object.fromEntries(
    Object.entries(overrides)
      .filter(([key]) => ALLOWED_RERANK_OVERRIDE_KEYS.has(key))
      .map(([key, value]) => [key, cloneProfileValue(value)])
  );
}

export function normalizeRerankProfileConfig(rawConfig = {}) {
  const safeConfig = isPlainObject(rawConfig) ? rawConfig : {};
  const profiles = (Array.isArray(safeConfig.profiles) ? safeConfig.profiles : [])
    .map((profile) => {
      if (!isPlainObject(profile)) return null;
      const id = normalizeRerankProfileId(profile.id);
      if (!id) return null;
      return {
        id,
        labelKey: String(profile.labelKey || "").trim(),
        descriptionKey: String(profile.descriptionKey || "").trim(),
        overrides: sanitizeRerankProfileOverrides(profile.overrides),
      };
    })
    .filter(Boolean);

  const defaultProfileId = normalizeRerankProfileId(safeConfig.defaultProfileId);
  const fallbackDefault =
    profiles.find((profile) => profile.id === defaultProfileId)?.id || profiles[0]?.id || "";

  return {
    enabled: safeConfig.enabled !== false && profiles.length > 0,
    defaultProfileId: fallbackDefault,
    profiles,
  };
}

export function resolveRerankProfile(rawConfig = {}, selectedProfileId = "") {
  const profileConfig = normalizeRerankProfileConfig(rawConfig);
  if (!profileConfig.enabled) {
    return { profileConfig, profile: null, selectedProfileId: "" };
  }

  const normalizedSelected = normalizeRerankProfileId(selectedProfileId);
  const profile =
    profileConfig.profiles.find((entry) => entry.id === normalizedSelected) ||
    profileConfig.profiles.find((entry) => entry.id === profileConfig.defaultProfileId) ||
    profileConfig.profiles[0] ||
    null;

  return {
    profileConfig,
    profile,
    selectedProfileId: profile?.id || "",
  };
}

export function buildEffectiveRerankConfig(
  baseConfig = {},
  rawProfileConfig = {},
  selectedProfileId = ""
) {
  const { profile, selectedProfileId: resolvedProfileId } = resolveRerankProfile(
    rawProfileConfig,
    selectedProfileId
  );
  const rerankConfig = profile
    ? mergeObjects(baseConfig, profile.overrides)
    : mergeObjects(baseConfig, {});

  return {
    rerankConfig,
    profile,
    selectedProfileId: resolvedProfileId,
  };
}
