/**
 * Shared helpers for reading cached semantic search rate-limit information and
 * formatting a tooltip suffix that explains how many API calls remain.
 *
 * The underlying data is produced by the backend search endpoints and mirrored
 * to localStorage via DropdownWrapper.publishSourceRateLimitInfo. This module
 * centralises the storage key + formatting so that SearchForm and individual
 * tag components can share the exact same behaviour without duplicating logic.
 */

export const SOURCE_RATE_LIMIT_KEYS = ["elicit", "openAlex", "semanticScholar"];

export function getSourceRateLimitStorageKey(sourceKey) {
  switch (String(sourceKey || "").trim()) {
    case "elicit":
      return "qpmElicitRateLimitInfo";
    case "openAlex":
      return "qpmOpenAlexRateLimitInfo";
    case "semanticScholar":
      return "qpmSemanticScholarRateLimitInfo";
    default:
      return "";
  }
}

export function getSourceRateLimitLabel(sourceKey) {
  switch (String(sourceKey || "").trim()) {
    case "elicit":
      return "Elicit";
    case "openAlex":
      return "OpenAlex";
    case "semanticScholar":
      return "Semantic Scholar";
    default:
      return "API";
  }
}

export function normalizeSourceRateLimitInfo(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const limitValue = value.limit;
  const limit = limitValue === null || limitValue === undefined ? null : Number(limitValue);
  const remainingValue = value.remaining;
  const remaining =
    remainingValue === null || remainingValue === undefined ? null : Number(remainingValue);
  const resetAt = String(value.resetAt || "").trim();
  const resetInSecondsValue = value.resetInSeconds;
  const resetInSeconds =
    resetInSecondsValue === null || resetInSecondsValue === undefined
      ? null
      : Number(resetInSecondsValue);
  const status = Number(value.status);
  const normalizedLimit =
    Number.isFinite(limit) && limit > 0 ? Math.max(1, Math.floor(limit)) : null;
  const normalizedRemaining = Number.isFinite(remaining) ? Math.max(0, Math.floor(remaining)) : null;
  const normalizedResetInSeconds = Number.isFinite(resetInSeconds)
    ? Math.max(0, Math.floor(resetInSeconds))
    : null;
  const normalizedStatus = Number.isFinite(status) ? Math.floor(status) : 0;
  if (
    normalizedLimit === null &&
    normalizedRemaining === null &&
    resetAt === "" &&
    normalizedResetInSeconds === null &&
    normalizedStatus <= 0
  ) {
    return null;
  }
  return {
    limit: normalizedLimit,
    remaining: normalizedRemaining,
    resetAt,
    resetInSeconds: normalizedResetInSeconds,
    status: normalizedStatus,
    isLimited:
      value.isLimited === true || (Number.isFinite(remaining) && remaining <= 0),
  };
}

export function readStoredSourceRateLimitInfo(sourceKey) {
  if (typeof window === "undefined") {
    return null;
  }
  const storageKey = getSourceRateLimitStorageKey(sourceKey);
  if (!storageKey) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return normalizeSourceRateLimitInfo(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function getSourceRateLimitResetDate(resetAt, resetInSeconds = null) {
  const resetTimestamp = Date.parse(String(resetAt || "").trim());
  if (Number.isFinite(resetTimestamp)) {
    return new Date(resetTimestamp);
  }
  const fallbackSeconds = Number(resetInSeconds);
  if (Number.isFinite(fallbackSeconds)) {
    return new Date(Date.now() + Math.max(0, Math.floor(fallbackSeconds)) * 1000);
  }
  return null;
}

export function isSemanticSourceUnavailable(info) {
  if (!info) {
    return false;
  }
  const resetDate = getSourceRateLimitResetDate(info.resetAt, info.resetInSeconds);
  if (resetDate && resetDate.getTime() <= Date.now()) {
    return false;
  }
  if (Number.isFinite(info.remaining)) {
    return info.remaining <= 0;
  }
  return info.isLimited === true;
}

export function formatSourceResetCountdown(resetAt, resetInSeconds, language) {
  const resetDate = getSourceRateLimitResetDate(resetAt, resetInSeconds);
  const diffSeconds = resetDate
    ? Math.max(0, Math.round((resetDate.getTime() - Date.now()) / 1000))
    : null;
  if (diffSeconds === null) {
    return "";
  }
  if (diffSeconds <= 0) {
    return language === "en" ? "less than 1 minute" : "mindre end 1 minut";
  }
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const parts = [];
  if (days > 0) {
    parts.push(
      language === "en"
        ? `${days} day${days === 1 ? "" : "s"}`
        : `${days} dag${days === 1 ? "" : "e"}`
    );
  }
  if (hours > 0) {
    parts.push(
      language === "en"
        ? `${hours} hour${hours === 1 ? "" : "s"}`
        : `${hours} time${hours === 1 ? "" : "r"}`
    );
  }
  if (minutes > 0) {
    parts.push(
      language === "en"
        ? `${minutes} minute${minutes === 1 ? "" : "s"}`
        : `${minutes} minut${minutes === 1 ? "" : "ter"}`
    );
  }
  return parts.slice(0, 2).join(", ");
}

export function formatSourceResetClockTime(resetAt, resetInSeconds, language) {
  const resetDate = getSourceRateLimitResetDate(resetAt, resetInSeconds);
  if (!resetDate) {
    return "";
  }
  const locale = language === "en" ? "en-US" : "da-DK";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(resetDate);
}

/**
 * Build the HTML suffix appended to semantic-source tooltips that shows
 * remaining API calls and (if applicable) when the next search is possible.
 *
 * @param {string} sourceKey one of SOURCE_RATE_LIMIT_KEYS
 * @param {string} language "en" or any non-"en" value (treated as Danish)
 * @param {Object|null} info normalized rate limit info (see normalizeSourceRateLimitInfo)
 * @returns {string} HTML snippet (empty string when source is unsupported)
 */
export function formatSourceRateLimitTooltipSuffix(sourceKey, language, info) {
  const normalizedSourceKey = String(sourceKey || "").trim();
  if (!SOURCE_RATE_LIMIT_KEYS.includes(normalizedSourceKey)) {
    return "";
  }
  const sourceLabel = getSourceRateLimitLabel(normalizedSourceKey);
  if (!info) {
    if (normalizedSourceKey === "semanticScholar") {
      return language === "en"
        ? `<br><br><strong>${sourceLabel} API usage:</strong> Remaining requests are not exposed by the API. If ${sourceLabel} rate limits this widget, that status will be shown here.`
        : `<br><br><strong>${sourceLabel} API-forbrug:</strong> API'et eksponerer ikke det resterende antal kald. Hvis ${sourceLabel} rate limiter widgeten, vises den status her.`;
    }
    return language === "en"
      ? `<br><br><strong>${sourceLabel} API usage:</strong> Remaining requests are shown after ${sourceLabel} returns rate limit information.`
      : `<br><br><strong>${sourceLabel} API-forbrug:</strong> Resterende kald vises, når ${sourceLabel} har returneret rate limit-oplysninger.`;
  }
  const remainingText = Number.isFinite(info.remaining)
    ? language === "en"
      ? Number.isFinite(info.limit)
        ? `${info.remaining} of ${info.limit} requests remaining`
        : `${info.remaining} requests remaining`
      : Number.isFinite(info.limit)
        ? `${info.remaining} ud af ${info.limit} kald tilbage`
        : `${info.remaining} kald tilbage`
    : language === "en"
      ? Number.isFinite(info.limit)
        ? `remaining requests are currently unknown out of ${info.limit}`
        : "remaining requests are currently unknown"
      : Number.isFinite(info.limit)
        ? `det resterende antal kald er i øjeblikket ukendt ud af ${info.limit}`
        : "det resterende antal kald er i øjeblikket ukendt";
  const unknownUsageText = language === "en"
    ? `${sourceLabel} does not expose remaining request counts`
    : `${sourceLabel} eksponerer ikke det resterende antal kald`;
  const shouldShowNextSearchTime = isSemanticSourceUnavailable(info);
  const resetCountdown = shouldShowNextSearchTime
    ? formatSourceResetCountdown(info.resetAt, info.resetInSeconds, language)
    : "";
  const resetClockTime = shouldShowNextSearchTime
    ? formatSourceResetClockTime(info.resetAt, info.resetInSeconds, language)
    : "";
  const resetText = shouldShowNextSearchTime
    ? resetCountdown
      ? language === "en"
        ? `Next ${sourceLabel} search can be completed in ${resetCountdown}${resetClockTime ? ` (${resetClockTime})` : ""}.`
        : `Næste søgning i ${sourceLabel} kan gennemføres om ${resetCountdown}${resetClockTime ? ` (${resetClockTime})` : ""}.`
      : language === "en"
        ? `${sourceLabel} is temporarily unavailable.`
        : `${sourceLabel} er midlertidigt utilgængelig.`
    : "";
  const usageText =
    Number.isFinite(info.remaining) || Number.isFinite(info.limit)
      ? remainingText
      : unknownUsageText;
  return language === "en"
    ? `<br><br><strong>${sourceLabel} API usage:</strong> ${usageText}.${resetText ? `<br>${resetText}` : ""}`
    : `<br><br><strong>${sourceLabel} API-forbrug:</strong> ${usageText}.${resetText ? `<br>${resetText}` : ""}`;
}
