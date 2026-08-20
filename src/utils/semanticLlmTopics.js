const LLM_TOPIC_SOURCE_PRIORITY = [
  "mesh",
  "openAlex",
  "openAlexTopic",
  "openAlexSubfield",
  "openAlexKeyword",
  "pubmedKeyword",
  "semanticScholar",
];

const LLM_TOPIC_SOURCE_SKIP = new Set([
  "openAlexConcept",
  "openAlexField",
  "openAlexDomain",
]);

export const LLM_TOPIC_CAP = 16;

/**
 * Build a capped, prioritized topics payload for LLM final rerank.
 * Fairness: missing topics means empty list (never a penalty signal).
 *
 * @param {unknown} entryTopics
 * @param {number} [cap=16]
 * @returns {Array<{label: string, source: string}>}
 */
export function buildLlmTopicsPayload(entryTopics, cap = LLM_TOPIC_CAP) {
  const max = Number.isFinite(cap) ? Math.max(0, Math.floor(cap)) : LLM_TOPIC_CAP;
  if (!Array.isArray(entryTopics) || max === 0) {
    return [];
  }

  const buckets = new Map(LLM_TOPIC_SOURCE_PRIORITY.map((source) => [source, []]));
  const extras = [];
  const seen = new Set();

  for (const entry of entryTopics) {
    if (!entry || typeof entry !== "object") continue;
    const label = String(entry.label || "").trim();
    const source = String(entry.source || "").trim();
    if (!label || !source || LLM_TOPIC_SOURCE_SKIP.has(source)) continue;
    const key = `${source.toLowerCase()}\0${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const item = { label, source };
    if (buckets.has(source)) {
      buckets.get(source).push(item);
    } else {
      extras.push(item);
    }
  }

  const out = [];
  for (const source of LLM_TOPIC_SOURCE_PRIORITY) {
    for (const item of buckets.get(source) || []) {
      if (out.length >= max) return out;
      out.push(item);
    }
  }
  for (const item of extras) {
    if (out.length >= max) break;
    out.push(item);
  }
  return out;
}
