/**
 * MeSH Validator & Enhancer
 * Validates and enhances AI-translated search strings using NLM E-utilities MeSH database.
 *
 * Flow:
 * 1. Validate [mh] terms exist in NLM's MeSH database (ESearch db=mesh)
 * 2. Build rich MeSH context: scope notes, related terms, NLM suggestions (ESummary + ESearch)
 * 3. Send context to AI for intelligent optimization of the search string
 * 4. Validate final string against PubMed (ESearch db=pubmed)
 *
 * API calls go through the existing PHP proxy (settings.nlm.proxyUrl),
 * which automatically adds NLM_API_KEY, email and tool parameters server-side.
 * With API key, rate limit is 10 requests/second.
 */

import axiosInstance from "@/utils/axiosInstance.js";
import { meshFixPrompt, meshOptimizationPrompt } from "@/assets/prompts/mesh.js";
import {
  executionIntentAlignPrompt,
  executionIntentCheckPrompt,
} from "@/assets/prompts/searchflow.js";
import { getPromptForLocale } from "@/utils/promptsHelpers.js";

function envNumber(name, fallback) {
  const raw = import.meta.env?.[name];
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

const NLM_REQUEST_TIMEOUT_MS = Math.max(1000, envNumber("VITE_MESH_NLM_TIMEOUT_MS", 10000));
const NLM_RETRY_ATTEMPTS = Math.max(0, Math.floor(envNumber("VITE_MESH_NLM_RETRY_ATTEMPTS", 2)));
const MESH_VALIDATION_CONCURRENCY = Math.max(
  1,
  Math.floor(envNumber("VITE_MESH_VALIDATION_CONCURRENCY", 2))
);
const MESH_VALIDATION_CACHE_LIMIT = Math.max(
  50,
  Math.floor(envNumber("VITE_MESH_VALIDATION_CACHE_LIMIT", 500))
);
const MESH_VALIDATION_CACHE_TTL_MS = Math.max(
  0,
  Math.floor(envNumber("VITE_MESH_VALIDATION_CACHE_TTL_MS", 900000))
);
const meshValidationCache = new Map();

function buildMeshValidationCacheKey(proxyUrl, term) {
  return `${String(proxyUrl || "").trim()}::${String(term || "").trim().toLowerCase()}`;
}

function getCachedMeshValidation(proxyUrl, term) {
  const key = buildMeshValidationCacheKey(proxyUrl, term);
  if (!meshValidationCache.has(key)) return null;
  const value = meshValidationCache.get(key);
  if (!value) return null;
  if (MESH_VALIDATION_CACHE_TTL_MS > 0) {
    const ageMs = Date.now() - Number(value.cachedAt || 0);
    if (ageMs < 0 || ageMs > MESH_VALIDATION_CACHE_TTL_MS) {
      meshValidationCache.delete(key);
      return null;
    }
  }
  // Keep hot entries fresh in insertion order.
  meshValidationCache.delete(key);
  meshValidationCache.set(key, value);
  return value.result || null;
}

function setCachedMeshValidation(proxyUrl, term, value) {
  const key = buildMeshValidationCacheKey(proxyUrl, term);
  if (meshValidationCache.has(key)) {
    meshValidationCache.delete(key);
  }
  meshValidationCache.set(key, { result: value, cachedAt: Date.now() });
  while (meshValidationCache.size > MESH_VALIDATION_CACHE_LIMIT) {
    const oldestKey = meshValidationCache.keys().next().value;
    if (!oldestKey) break;
    meshValidationCache.delete(oldestKey);
  }
}

async function nlmGet(proxyUrl, endpoint, params) {
  const baseURL = String(proxyUrl || "").trim();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return axiosInstance.get(path, {
    baseURL,
    params,
    timeout: NLM_REQUEST_TIMEOUT_MS,
    retry: NLM_RETRY_ATTEMPTS,
  });
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const safeItems = Array.isArray(items) ? items : [];
  const limit = Math.max(1, Number(concurrency) || 1);
  const results = new Array(safeItems.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < safeItems.length) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= safeItems.length) break;
      results[index] = await mapper(safeItems[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, safeItems.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extraction helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts all MeSH terms from a PubMed search string.
 * Finds patterns like "Term"[mh] or "Term"[MH] (case-insensitive tag).
 *
 * @param {string} searchString - The PubMed search string to parse
 * @returns {Array<{term: string, fullMatch: string}>} Array of found MeSH terms
 */
export function extractMeshTerms(searchString) {
  if (!searchString) return [];

  // Match both "Term"[mh] (quoted) and Term[mh] (unquoted) patterns
  const regex = /(?:"([^"]+)"|([a-zA-Z][a-zA-Z0-9 ,\-]+?))\[mh\]/gi;
  const results = [];
  let match;

  while ((match = regex.exec(searchString)) !== null) {
    const term = (match[1] || match[2] || "").trim();
    if (!term) continue;
    results.push({
      term: term,
      fullMatch: match[0],
    });
  }

  return results;
}

/**
 * Lowercases all quoted and unquoted terms that are NOT tagged with [mh] or [au].
 * PubMed is case-insensitive, so this is purely cosmetic to match conventions
 * where only MeSH terms and author names use capitalization.
 *
 * @param {string} searchString - The PubMed search string
 * @returns {string} The search string with non-[mh]/[au] terms lowercased
 */
/**
 * Replaces PubMed's verbose field tag names with short equivalents.
 * E.g. [Title/Abstract] → [tiab], [MeSH Terms] → [mh], [Journal] → [ta]
 */
/**
 * Ensures all [mh] terms are wrapped in quotes.
 * E.g. Diabetes Mellitus[mh] → "Diabetes Mellitus"[mh]
 */
function quoteMeshTerms(searchString) {
  if (!searchString) return searchString;

  // Match unquoted terms before [mh] (not already in quotes)
  // Looks for: word(s)[mh] where word(s) is NOT preceded by a quote
  return searchString.replace(
    /(?<!")(\b[A-Za-z][A-Za-z0-9 ,\-]+?)\[mh\]/g,
    (match, term) => {
      // Don't double-quote if already quoted
      return `"${term.trim()}"[mh]`;
    }
  );
}

/**
 * Ensures there is always an explicit boolean operator (OR/AND) between adjacent terms.
 * If two terms with field tags are adjacent without an operator, inserts OR.
 * E.g. "Term1"[mh] "Term2"[tiab] → "Term1"[mh] OR "Term2"[tiab]
 */
function ensureOperatorsBetweenTerms(searchString) {
  if (!searchString) return searchString;

  // Match: ][tag] followed by whitespace then " or letter (start of next term)
  // without an OR/AND in between
  return searchString.replace(
    /(\]\s*)\s+(?!(OR|AND)\b)(?=["(A-Za-z])/gi,
    (match, bracket) => {
      // Check if bracket ends a field tag
      return bracket + " OR ";
    }
  );
}

function normalizeFieldTags(searchString) {
  if (!searchString) return searchString;

  const tagMap = {
    "Affiliation": "ad",
    "All Fields": "all",
    "Article Identifier": "aid",
    "Author": "au",
    "Author Identifier": "auid",
    "Book": "book",
    "Completion Date": "dcom",
    "Conflict of Interest Statement": "cois",
    "Corporate Author": "cn",
    "Create Date": "crdt",
    "EC/RN Number": "rn",
    "Editor": "ed",
    "Entry Date": "edat",
    "Filter": "filter",
    "First Author Name": "1au",
    "Full Author Name": "fau",
    "Full Investigator Name": "fir",
    "Grants and Funding": "gr",
    "Investigator": "ir",
    "ISBN": "isbn",
    "Issue": "ip",
    "Journal": "ta",
    "Language": "la",
    "Last Author Name": "lastau",
    "Location ID": "lid",
    "MeSH Date": "mhda",
    "MeSH Major Topic": "majr",
    "MeSH Subheadings": "sh",
    "Title/Abstract": "tiab",
    "Title": "ti",
    "MeSH Terms": "mh",
    "MeSH Subheading": "sh",
    "Modification Date": "lr",
    "NLM Unique ID": "jid",
    "Other Term": "ot",
    "Pagination": "pg",
    "Personal Name as Subject": "ps",
    "Pharmacological Action": "pa",
    "Place of Publication": "pl",
    "PMID": "pmid",
    "Publication Type": "pt",
    "Publication Date": "dp",
    "Publisher": "pubn",
    "Secondary Source ID": "si",
    "Subset": "sb",
    "Supplementary Concept": "nm",
    "Text Word": "tw",
    "Text Words": "tw",
    "Transliterated Title": "tt",
    "Volume": "vi",
  };

  let result = searchString;
  for (const [verbose, short] of Object.entries(tagMap)) {
    result = result.replace(new RegExp(`\\[${verbose}\\]`, "gi"), `[${short}]`);
  }
  return result;
}

/**
 * Normalizes unsupported shorthand tags used by AI outputs.
 * Current rule: [ab] is mapped to [tiab].
 */
function normalizeUnsupportedFieldTags(searchString) {
  if (!searchString) return searchString;
  return searchString.replace(/\[ab\]/gi, "[tiab]");
}

const ALLOWED_FIELD_TAGS = new Set([
  "ad", "all", "aid", "au", "auid", "book", "dcom", "cois", "cn", "crdt",
  "rn", "ed", "edat", "filter", "sb", "1au", "fau", "fir", "gr", "ir",
  "isbn", "ip", "ta", "la", "lastau", "lid", "mhda", "majr", "sh", "mh",
  "lr", "jid", "ot", "pg", "ps", "pa", "pl", "pmid", "dp", "pt", "pubn",
  "si", "nm", "tw", "ti", "tiab", "tt", "vi",
]);

function fixWildcardsInQuotedTerms(searchString) {
  if (!searchString) return searchString;
  return searchString.replace(/"([^"]*\*[^"]*)"\[([a-z0-9]+)\]/gi, (_m, term, tag) => {
    return `${term}[${tag}]`;
  });
}

function assertBalancedSyntax(searchString) {
  if (!searchString) return;
  let inQuotes = false;
  let parenDepth = 0;
  for (let i = 0; i < searchString.length; i++) {
    const ch = searchString[i];
    if (ch === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes) {
      if (ch === "(") parenDepth++;
      if (ch === ")") parenDepth--;
      if (parenDepth < 0) {
        throw new Error("Unbalanced parentheses in search string.");
      }
    }
  }
  if (inQuotes) throw new Error("Unbalanced quotation marks in search string.");
  if (parenDepth !== 0) throw new Error("Unbalanced parentheses in search string.");
}

function assertAllowedFieldTags(searchString) {
  if (!searchString) return;
  const tagRegex = /\[([a-z0-9/ ]+)\]/gi;
  let match;
  const invalidTags = [];
  while ((match = tagRegex.exec(searchString)) !== null) {
    const tag = (match[1] || "").trim().toLowerCase();
    if (!tag) continue;
    if (!ALLOWED_FIELD_TAGS.has(tag)) {
      invalidTags.push(tag);
    }
  }
  if (invalidTags.length > 0) {
    throw new Error(`Invalid field tag(s): ${[...new Set(invalidTags)].join(", ")}`);
  }
}

function sanitizeSearchStringDeterministic(searchString) {
  let result = searchString || "";
  result = normalizeFieldTags(result);
  result = normalizeUnsupportedFieldTags(result);
  result = fixWildcardsInQuotedTerms(result);
  result = quoteMeshTerms(result);
  result = removeDuplicateTerms(result);
  result = normalizeBooleanOperatorsOutsideQuotes(result);
  assertBalancedSyntax(result);
  assertAllowedFieldTags(result);
  return result;
}

/**
 * Removes duplicate terms from a PubMed search string.
 * Compares terms case-insensitively including their field tags.
 */
function removeDuplicateTerms(searchString) {
  if (!searchString) return searchString;

  // Split on OR (preserving AND groups)
  // We handle the simple case: terms joined by OR at the top level
  const parts = searchString.split(/\s+OR\s+/i);
  const seen = new Set();
  const unique = [];

  for (const part of parts) {
    const normalized = part.trim().toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(part.trim());
    }
  }

  return unique.join(" OR ");
}

function lowercaseNonMeshTerms(searchString) {
  if (!searchString) return searchString;

  // Match "quoted term"[tag] or unquoted_term[tag] patterns
  // Lowercase the term part only when tag is NOT mh or au
  return searchString.replace(
    /("([^"]+)"|\b([a-zA-Z][a-zA-Z0-9 *\-]*?))\[([\w]+)\]/g,
    (match, _fullTerm, quotedTerm, unquotedTerm, tag) => {
      const tagLower = tag.toLowerCase();
      // Keep [mh] and [au] terms unchanged
      if (tagLower === "mh" || tagLower === "au" || tagLower === "mesh") {
        return match;
      }
      if (quotedTerm) {
        return `"${quotedTerm.toLowerCase()}"[${tag}]`;
      }
      if (unquotedTerm) {
        // Preserve boolean operators if they were accidentally captured with the term.
        const trimmed = unquotedTerm.trimStart();
        const leadingWhitespace = unquotedTerm.slice(0, unquotedTerm.length - trimmed.length);
        const boolPrefix = trimmed.match(/^(AND|OR|NOT)\s+(.+)$/i);
        if (boolPrefix) {
          return `${leadingWhitespace}${boolPrefix[1].toUpperCase()} ${boolPrefix[2].toLowerCase()}[${tag}]`;
        }
        return `${unquotedTerm.toLowerCase()}[${tag}]`;
      }
      return match;
    }
  );
}

/**
 * Extracts English concept terms from a PubMed search string.
 * Picks up both quoted terms and unquoted terms before field tags.
 * Used to search NLM MeSH with English terms instead of the user's (possibly Danish) input.
 *
 * @param {string} searchString - The AI-generated PubMed search string
 * @returns {Array<string>} Unique English concept terms
 */
function extractEnglishConcepts(searchString) {
  if (!searchString) return [];

  // Match "quoted term"[any_tag] and unquoted_term[any_tag]
  const regex = /(?:"([^"]+)"|([a-zA-Z][a-zA-Z0-9 \-]+?))\[(?:mh|tiab|ti)\]/gi;
  const concepts = new Set();
  let match;

  while ((match = regex.exec(searchString)) !== null) {
    const term = (match[1] || match[2] || "").trim();
    if (!term) continue;

    // Remove leaked boolean operators from extracted concept fragments.
    const normalized = term
      .replace(/\b(AND|OR|NOT)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (normalized && normalized.length > 2) {
      concepts.add(normalized.toLowerCase());
    }
  }

  return [...concepts];
}

function normalizeMeshDescriptorKey(term) {
  return (term || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Restores canonical descriptor spellings for already validated [mh] terms.
 * Prevents AI from degrading valid descriptors, e.g. "Type 2" -> "Type2".
 */
function restoreCanonicalValidatedMeshTerms(searchString, termContexts) {
  if (!searchString || !Array.isArray(termContexts) || termContexts.length === 0) {
    return searchString;
  }

  const lockedDescriptors = new Map();
  for (const tc of termContexts) {
    if (!tc?.valid || !tc?.term) continue;
    const key = normalizeMeshDescriptorKey(tc.term);
    if (!key) continue;
    lockedDescriptors.set(key, tc.term);
  }
  if (lockedDescriptors.size === 0) return searchString;

  return searchString.replace(/"([^"]+)"\[mh\]/gi, (match, rawDescriptor) => {
    const descriptor = (rawDescriptor || "").trim();
    if (!descriptor) return match;

    const parts = descriptor.split("/");
    const base = (parts.shift() || "").trim();
    const key = normalizeMeshDescriptorKey(base);
    const canonicalBase = lockedDescriptors.get(key);
    if (!canonicalBase) return match;

    const suffix = parts.length > 0 ? `/${parts.join("/")}` : "";
    return `"${canonicalBase}${suffix}"[mh]`;
  });
}

/**
 * Canonicalizes all [mh] terms against NLM.
 * - Valid [mh] terms are rewritten to the official Descriptor Name in quotes.
 * - Invalid [mh] terms are downgraded to [tiab] to avoid invalid MeSH usage.
 */
async function canonicalizeAllMeshTermsWithNlm(searchString, proxyUrl) {
  if (!searchString || !proxyUrl) return searchString;

  const meshTerms = extractMeshTerms(searchString);
  if (meshTerms.length === 0) return searchString;

  const uniqueTerms = [...new Set(meshTerms.map((m) => m.term.toLowerCase()))];
  const validationMap = new Map();
  const originalTerms = uniqueTerms.map(
    (termKey) => meshTerms.find((m) => m.term.toLowerCase() === termKey)?.term || termKey
  );
  const validationResults = await mapWithConcurrency(originalTerms, MESH_VALIDATION_CONCURRENCY, (original) =>
    validateMeshTerm(original, proxyUrl)
  );
  uniqueTerms.forEach((termKey, idx) => {
    validationMap.set(termKey, validationResults[idx]);
  });

  const uids = [...new Set(
    [...validationMap.values()]
      .map((v) => v?.uid)
      .filter(Boolean)
      .map(String)
  )];
  const details = uids.length > 0 ? await fetchMeshDetails(uids, proxyUrl) : {};

  let result = searchString;
  for (const { term, fullMatch } of meshTerms) {
    const key = term.toLowerCase();
    const validation = validationMap.get(key);
    if (validation?.valid && validation?.uid && details[String(validation.uid)]?.name) {
      const canonical = details[String(validation.uid)].name;
      const replacement = `"${canonical}"[mh]`;
      if (replacement !== fullMatch) {
        result = result.replace(fullMatch, replacement);
      }
      continue;
    }

    if (validation && !validation.valid) {
      const replacement = `"${term}"[tiab]`;
      result = result.replace(fullMatch, replacement);
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// NLM API functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single MeSH term against NLM's MeSH database via ESearch.
 *
 * @param {string} term - The MeSH term to validate (without quotes or [mh] tag)
 * @param {string} proxyUrl - The NLM proxy URL
 * @returns {Promise<{valid: boolean, uid: string|null}>}
 */
export async function validateMeshTerm(term, proxyUrl) {
  const cached = getCachedMeshValidation(proxyUrl, term);
  if (cached) {
    return cached;
  }
  try {
    const params = {
      db: "mesh",
      term: `"${term}"[MeSH Terms]`,
      retmode: "json",
      retmax: "1",
    };

    const response = await nlmGet(proxyUrl, "NlmSearch.php", params);
    const count = parseInt(response.data?.esearchresult?.count || "0", 10);
    const uid = response.data?.esearchresult?.idlist?.[0] || null;
    const result = { valid: count > 0, uid };
    setCachedMeshValidation(proxyUrl, term, result);
    return result;
  } catch (error) {
    console.warn(`MeSH validation failed for "${term}":`, error.message);
    const fallback = { valid: true, uid: null };
    setCachedMeshValidation(proxyUrl, term, fallback);
    return fallback;
  }
}

/**
 * Fetches detailed MeSH information for a list of UIDs via ESummary.
 * Returns scope notes, related term UIDs, children UIDs, and term names.
 *
 * @param {Array<string>} uids - Array of MeSH UIDs to look up
 * @param {string} proxyUrl - The NLM proxy URL
 * @returns {Promise<Object>} Map of uid → { name, scopeNote, relatedUids, childrenUids, meshUi }
 */
async function fetchMeshDetails(uids, proxyUrl) {
  if (!uids || uids.length === 0) return {};

  try {
    const params = {
      db: "mesh",
      id: uids.join(","),
      retmode: "json",
    };

    const response = await nlmGet(proxyUrl, "NlmSummary.php", params);
    const result = response.data?.result;
    if (!result) return {};

    const details = {};
    for (const uid of (result.uids || [])) {
      const record = result[uid];
      if (!record) continue;

      const childrenUids = [];
      const parentUids = [];
      if (record.ds_idxlinks) {
        for (const link of record.ds_idxlinks) {
          if (link.children) {
            childrenUids.push(...link.children.map(String));
          }
          if (link.parent) {
            parentUids.push(String(link.parent));
          }
        }
      }

      details[uid] = {
        name: (record.ds_meshterms && record.ds_meshterms[0]) || "",
        scopeNote: record.ds_scopenote || "",
        relatedUids: (record.ds_seerelated || []).map(String),
        childrenUids: [...new Set(childrenUids)],
        parentUids: [...new Set(parentUids)],
        meshUi: record.ds_meshui || "",
      };
    }

    return details;
  } catch (error) {
    console.warn("fetchMeshDetails failed:", error.message);
    return {};
  }
}

/**
 * Searches the MeSH database with the user's original input to find
 * NLM's own MeSH suggestions via translationset, plus matching UIDs.
 *
 * @param {string} userInput - The user's original search text
 * @param {string} proxyUrl - The NLM proxy URL
 * @returns {Promise<{suggestions: Array<string>, uids: Array<string>}>}
 */
async function fetchMeshSuggestionsForInput(userInput, proxyUrl) {
  try {
    const params = {
      db: "mesh",
      term: userInput,
      retmode: "json",
      retmax: "10",
    };

    const response = await nlmGet(proxyUrl, "NlmSearch.php", params);
    const result = response.data?.esearchresult;
    if (!result) return { suggestions: [], uids: [] };

    // Extract MeSH terms from translationset
    const suggestions = [];
    if (result.translationset && result.translationset.length > 0) {
      for (const translation of result.translationset) {
        if (translation.to) {
          const meshMatches = translation.to.match(/"([^"]+)"\[MeSH Terms\]/gi);
          if (meshMatches) {
            for (const m of meshMatches) {
              const termMatch = m.match(/"([^"]+)"/);
              if (termMatch) suggestions.push(termMatch[1]);
            }
          }
        }
      }
    }

    return {
      suggestions,
      uids: result.idlist || [],
    };
  } catch (error) {
    console.warn("fetchMeshSuggestionsForInput failed:", error.message);
    return { suggestions: [], uids: [] };
  }
}

/**
 * Builds a rich MeSH context object by combining:
 * - Validation results for each [mh] term in the search string
 * - ESummary details (scope notes, related terms) for all found UIDs
 * - NLM's own MeSH suggestions for the user's original input
 *
 * @param {string} searchString - The AI-generated search string
 * @param {string} userInput - The user's original input text
 * @param {string} proxyUrl - The NLM proxy URL
 * @returns {Promise<Object>} MeSH context object
 */
async function buildMeshContext(searchString, userInput, proxyUrl) {
  const meshTerms = extractMeshTerms(searchString);

  // Extract English concepts from the AI search string for NLM MeSH lookup
  // (user input may be in Danish, so we use the English terms AI already identified)
  const englishConcepts = extractEnglishConcepts(searchString);
  const meshSearchQuery = englishConcepts.length > 0 ? englishConcepts.join(" ") : userInput;
  console.info(`  MeSH search query (English concepts): "${meshSearchQuery}"`);

  // Step A: Validate [mh] terms with controlled parallelism (small batch size)
  // while fetching NLM suggestions in parallel.
  const inputSuggestionsPromise = fetchMeshSuggestionsForInput(meshSearchQuery, proxyUrl);
  const validationResultsRaw = await mapWithConcurrency(meshTerms, MESH_VALIDATION_CONCURRENCY, ({ term }) =>
    validateMeshTerm(term, proxyUrl)
  );
  const validationResults = meshTerms.map(({ term, fullMatch }, idx) => ({
    term,
    fullMatch,
    ...(validationResultsRaw[idx] || { valid: true, uid: null }),
  }));
  const inputSuggestions = await inputSuggestionsPromise;

  // Collect all UIDs we need details for
  const allUids = new Set();
  for (const r of validationResults) {
    if (r.uid) allUids.add(r.uid);
  }
  for (const uid of inputSuggestions.uids) {
    allUids.add(String(uid));
  }

  // Step B: Fetch ESummary for all primary UIDs
  const primaryDetails = await fetchMeshDetails([...allUids], proxyUrl);

  // Collect related, parent and children UIDs from primary details
  const relatedUids = new Set();
  for (const detail of Object.values(primaryDetails)) {
    for (const rUid of detail.relatedUids) {
      if (!allUids.has(rUid)) relatedUids.add(rUid);
    }
    for (const pUid of detail.parentUids) {
      if (!allUids.has(pUid)) relatedUids.add(pUid);
    }
    for (const cUid of detail.childrenUids.slice(0, 5)) {
      if (!allUids.has(String(cUid))) relatedUids.add(String(cUid));
    }
  }

  // Step C: Fetch ESummary for related UIDs
  const relatedDetails = relatedUids.size > 0
    ? await fetchMeshDetails([...relatedUids], proxyUrl)
    : {};

  const allDetails = { ...primaryDetails, ...relatedDetails };

  // Build context for each [mh] term in the search string
  const termContexts = validationResults.map((r) => {
    const detail = r.uid ? allDetails[r.uid] : null;
    const related = detail
      ? detail.relatedUids
          .map((uid) => allDetails[uid])
          .filter(Boolean)
          .map((d) => ({ name: d.name, scopeNote: d.scopeNote }))
      : [];
    const parents = detail
      ? detail.parentUids
          .map((uid) => allDetails[uid])
          .filter(Boolean)
          .map((d) => ({ name: d.name, scopeNote: d.scopeNote }))
      : [];
    const children = detail
      ? detail.childrenUids.slice(0, 5)
          .map((uid) => allDetails[String(uid)])
          .filter(Boolean)
          .map((d) => ({ name: d.name, scopeNote: d.scopeNote }))
      : [];

    // Check if ESummary's preferred name differs from the term in the search string
    const preferredName = detail?.name || "";
    const nameNeedsUpdate = preferredName && r.valid &&
      preferredName.toLowerCase() !== r.term.toLowerCase();

    return {
      term: r.term,
      fullMatch: r.fullMatch,
      valid: r.valid,
      uid: r.uid,
      preferredName: preferredName,
      nameNeedsUpdate: nameNeedsUpdate,
      scopeNote: detail?.scopeNote || "",
      relatedTerms: related,
      parentTerms: parents,
      childrenTerms: children,
    };
  });

  // Build context for NLM's suggestions for the user input
  const nlmSuggestions = inputSuggestions.uids.map((uid) => {
    const detail = allDetails[String(uid)];
    return detail ? { name: detail.name, scopeNote: detail.scopeNote } : null;
  }).filter(Boolean);

  return {
    termContexts,
    nlmSuggestions,
    inputSuggestionNames: inputSuggestions.suggestions,
    meshSearchQuery,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI interaction functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper: calls the AI streaming endpoint and returns the full response text.
 */
async function callAiStreaming(prompt, title, openAiServiceUrl, client) {
  const requestBody = {
    prompt: {
      model: "gpt-5.5",
      max_output_tokens: 500,
      stream: true,
      reasoning: { effort: "none" },
      text: { verbosity: "medium" },
      prompt: prompt,
    },
    title: title,
    client: client,
  };

  const response = await fetch(openAiServiceUrl + "/api/TranslateTitle", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }
    throw Error(typeof errorBody === "string" ? errorBody : JSON.stringify(errorBody));
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let answer = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    done = readerDone;
    if (value) answer += value;
  }

  return answer.trim();
}

/**
 * Sends the search string + rich MeSH context to AI for optimization.
 * AI uses scope notes, related terms, and NLM suggestions to pick the best MeSH terms.
 *
 * @param {string} searchString - The current search string
 * @param {string} userInput - The user's original input
 * @param {Object} meshContext - The rich MeSH context from buildMeshContext
 * @param {string} openAiServiceUrl - The OpenAI proxy URL
 * @param {string} client - The client name
 * @param {string} language - The language code (e.g. "dk", "en")
 * @returns {Promise<string>} The optimized search string
 */
async function aiOptimizeWithMeshContext(searchString, userInput, meshContext, openAiServiceUrl, client, language = "dk") {
  // Build the MeSH context section for the prompt
  let meshInfo = "";

  if (meshContext.termContexts.length > 0) {
    meshInfo += "MeSH-termer i din søgestreng:\n";
    for (const tc of meshContext.termContexts) {
      meshInfo += `- "${tc.term}"[mh]: ${tc.valid ? "GYLDIG" : "UGYLDIG"}\n`;
      if (tc.scopeNote) meshInfo += `  Scope note: ${tc.scopeNote}\n`;
      if (tc.parentTerms.length > 0) {
        meshInfo += `  Overordnede MeSH-termer (parents):\n`;
        for (const pt of tc.parentTerms) {
          meshInfo += `    - "${pt.name}": ${pt.scopeNote}\n`;
        }
      }
      if (tc.childrenTerms.length > 0) {
        meshInfo += `  Undertermer (children):\n`;
        for (const ct of tc.childrenTerms) {
          meshInfo += `    - "${ct.name}": ${ct.scopeNote}\n`;
        }
      }
      if (tc.relatedTerms.length > 0) {
        meshInfo += `  Relaterede MeSH-termer (see also):\n`;
        for (const rt of tc.relatedTerms) {
          meshInfo += `    - "${rt.name}": ${rt.scopeNote}\n`;
        }
      }
    }
  }

  if (meshContext.nlmSuggestions.length > 0) {
    meshInfo += "\nNLM's MeSH-forslag for brugerens input:\n";
    for (const s of meshContext.nlmSuggestions) {
      meshInfo += `- "${s.name}": ${s.scopeNote}\n`;
    }
  }

  if (meshContext.inputSuggestionNames.length > 0) {
    meshInfo += `\nNLM's term-mapping for "${userInput}": ${meshContext.inputSuggestionNames.join(", ")}\n`;
  }

  // Get locale-specific prompt template and replace variables
  const localePrompt = getPromptForLocale(meshOptimizationPrompt, language);
  const prompt = localePrompt.prompt
    .replace(/\{searchString\}/g, searchString)
    .replace(/\{userInput\}/g, userInput)
    .replace(/\{meshInfo\}/g, meshInfo);

  try {
    console.info("AI optimization prompt:\n", prompt);
    return await callAiStreaming(prompt, "", openAiServiceUrl, client);
  } catch (error) {
    console.warn("|MeSH Validation| AI optimization failed:", error.message);
    return searchString;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main orchestration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Main function: validates, enriches, and optimizes a search string using NLM MeSH data + AI.
 *
 * @param {string} searchString - The AI-translated PubMed search string
 * @param {string} userInput - The user's original input text
 * @param {string} proxyUrl - The NLM proxy URL (settings.nlm.proxyUrl)
 * @param {string} openAiServiceUrl - The OpenAI proxy URL for AI correction
 * @param {string} client - The client name for the AI service
 * @param {string} [language="dk"] - Language code
 * @param {function(string): void} [onProgress] - Optional callback with stepKey (e.g. "translatingStepOptimize") before AI optimization
 * @returns {Promise<string>} The validated/enhanced search string
 */
export async function validateAndEnhanceMeshTerms(
  searchString,
  userInput,
  proxyUrl,
  openAiServiceUrl,
  client,
  language = "dk",
  onProgress,
  options = {}
) {
  if (!searchString || !proxyUrl) return searchString;

  const reportOptions = options && typeof options === "object" ? options : {};
  const observeOnly = !!reportOptions.observeOnly;
  const onReport =
    typeof reportOptions.onReport === "function" ? reportOptions.onReport : null;
  const report = {
    totalMeshTerms: 0,
    validCount: 0,
    invalidCount: 0,
    invalidTerms: [],
    renamedTerms: [],
    addedConcepts: [],
    removedConcepts: [],
    hallucinationRate: 0,
    meshSearchQuery: "",
    changed: false,
    observeOnly,
  };

  const initialMeshTerms = extractMeshTerms(searchString);
  const initialConcepts = new Set(extractEnglishConcepts(searchString));

  console.group("[MeSHFlow] validateAndEnhanceMeshTerms");
  console.info("[MeSHFlow] Raw input search string:", searchString);
  console.info("[MeSHFlow] User input:", userInput);
  if (observeOnly) {
    console.info("[MeSHFlow] observeOnly=true - report will be generated without altering query.");
  }

  let updatedString = searchString;

  // ── Step 1: Build rich MeSH context from NLM ──
  console.group("[MeSHFlow] Step 1 - Build MeSH context from NLM");
  const meshContext = await buildMeshContext(searchString, userInput, proxyUrl);
  report.meshSearchQuery = meshContext.meshSearchQuery || "";
  report.totalMeshTerms = meshContext.termContexts.length;
  for (const tc of meshContext.termContexts) {
    if (tc.valid) {
      report.validCount += 1;
    } else {
      report.invalidCount += 1;
      report.invalidTerms.push(tc.term);
    }
    if (tc.nameNeedsUpdate && tc.preferredName) {
      report.renamedTerms.push({ from: tc.term, to: tc.preferredName });
    }
  }
  report.hallucinationRate =
    report.totalMeshTerms > 0 ? report.invalidCount / report.totalMeshTerms : 0;

  // Log context details
  for (const tc of meshContext.termContexts) {
    const status = tc.valid ? "valid" : "INVALID";
    console.info(`  "${tc.term}" → ${status}${tc.uid ? ` (UID: ${tc.uid})` : ""}`);
    if (tc.scopeNote) console.info(`    Scope: ${tc.scopeNote}`);
    if (tc.parentTerms.length > 0) console.info(`    Parents: ${tc.parentTerms.map(p => p.name).join(", ")}`);
    if (tc.childrenTerms.length > 0) console.info(`    Children: ${tc.childrenTerms.map(c => c.name).join(", ")}`);
    if (tc.relatedTerms.length > 0) console.info(`    Related: ${tc.relatedTerms.map(r => r.name).join(", ")}`);
  }
  if (meshContext.nlmSuggestions.length > 0) {
    console.info(`  NLM suggestions for "${meshContext.meshSearchQuery}":`);
    for (const s of meshContext.nlmSuggestions) {
      console.info(`    - "${s.name}": ${s.scopeNote.substring(0, 100)}${s.scopeNote.length > 100 ? "..." : ""}`);
    }
  }
  if (meshContext.inputSuggestionNames.length > 0) {
    console.info(`  NLM term-mapping: ${meshContext.inputSuggestionNames.join(", ")}`);
  }

  // Auto-fix: replace outdated/inverted MeSH names with NLM's current preferred name
  // Also update meshContext so the AI prompt uses the correct names
  for (const tc of meshContext.termContexts) {
    if (tc.nameNeedsUpdate && tc.preferredName) {
      const oldFragment = tc.fullMatch;
      const newFragment = `"${tc.preferredName}"[mh]`;
      updatedString = updatedString.replace(oldFragment, newFragment);
      console.info(`  Auto-fix: ${oldFragment} → ${newFragment} (NLM preferred name)`);
      // Update the context so Step 2 AI prompt references the correct name
      tc.term = tc.preferredName;
      tc.fullMatch = newFragment;
      tc.nameNeedsUpdate = false;
    }
  }
  console.groupEnd();

  // ── Step 2: AI optimization with MeSH context ──
  const hasMeshData = meshContext.termContexts.length > 0 || meshContext.nlmSuggestions.length > 0;
  if (hasMeshData) {
    if (typeof onProgress === "function") onProgress("translatingStepOptimize");
    console.group("[MeSHFlow] Step 2 - AI optimization with MeSH context");
    console.info("[MeSHFlow] Sending MeSH context to AI for optimization...");
    const beforeAi = updatedString;
    updatedString = await aiOptimizeWithMeshContext(updatedString, userInput, meshContext, openAiServiceUrl, client, language);
    const beforeMeshGuard = updatedString;
    updatedString = restoreCanonicalValidatedMeshTerms(updatedString, meshContext.termContexts);
    if (updatedString !== beforeMeshGuard) {
      console.info("[MeSHFlow] Canonical MeSH descriptor guard applied.");
      console.info(`  Before guard: ${beforeMeshGuard}`);
      console.info(`  After guard:  ${updatedString}`);
    }
    if (updatedString !== beforeAi) {
      console.info("[MeSHFlow] AI optimized search string:");
      console.info(`  Before: ${beforeAi}`);
      console.info(`  After:  ${updatedString}`);
    } else {
      console.info("[MeSHFlow] AI returned no changes.");
    }
    console.groupEnd();
  } else {
    console.info("[MeSHFlow] Step 2 skipped - no MeSH data available.");
  }

  // ── Step 2b: Canonicalize ALL [mh] terms against NLM ──
  console.group("[MeSHFlow] Step 2b - Canonicalize all [mh] terms against NLM");
  const beforeCanonicalizeAll = updatedString;
  updatedString = await canonicalizeAllMeshTermsWithNlm(updatedString, proxyUrl);
  if (updatedString !== beforeCanonicalizeAll) {
    console.info("[MeSHFlow] Canonicalization updated MeSH terms:");
    console.info(`  Before: ${beforeCanonicalizeAll}`);
    console.info(`  After:  ${updatedString}`);
  } else {
    console.info("[MeSHFlow] No global MeSH canonicalization changes needed.");
  }
  console.groupEnd();

  // ── Step 3: Validate final search string against PubMed ──
  console.group("[MeSHFlow] Step 3 - Validate against PubMed");
  console.info("[MeSHFlow] Search string before PubMed check:", updatedString);
  updatedString = await validateSearchString(updatedString, proxyUrl, openAiServiceUrl, client, 1, language);
  console.info("[MeSHFlow] Search string after PubMed check:", updatedString);
  console.groupEnd();

  // ── Step 4: Deterministic post-processing (tags/syntax/wildcards/operators) ──
  const beforeDeterministic = updatedString;
  updatedString = sanitizeSearchStringDeterministic(updatedString);
  updatedString = lowercaseNonMeshTerms(updatedString);
  updatedString = normalizeBooleanOperatorsOutsideQuotes(updatedString);

  // ── Step 5: Final hard gate against PubMed after all local normalizations ──
  // Guarantees the exact final query shown in the form has been validated by NLM.
  if (updatedString !== beforeDeterministic) {
    console.group("[MeSHFlow] Step 5 - Final gate validation against PubMed");
    updatedString = await validateSearchString(updatedString, proxyUrl, openAiServiceUrl, client, 1, language);
    console.info("[MeSHFlow] Final gate passed query:", updatedString);
    console.groupEnd();
  } else {
    console.info("[MeSHFlow] Step 5 skipped - deterministic post-processing made no changes.");
  }

  // ── Summary ──
  if (updatedString !== searchString) {
    console.info("[MeSHFlow] Final result (changed):", updatedString);
  } else {
    console.info("[MeSHFlow] Final result (unchanged):", updatedString);
  }

  // Build report delta (added/removed concepts) by comparing initial -> final
  try {
    const finalMeshTerms = extractMeshTerms(updatedString);
    const finalConcepts = new Set(extractEnglishConcepts(updatedString));
    const initialMeshKeys = new Set(
      initialMeshTerms.map((m) => String(m.term || "").toLowerCase())
    );
    const finalMeshKeys = new Set(
      finalMeshTerms.map((m) => String(m.term || "").toLowerCase())
    );
    report.addedConcepts = [...finalConcepts].filter((c) => !initialConcepts.has(c));
    report.removedConcepts = [...initialConcepts].filter((c) => !finalConcepts.has(c));
    report.finalMeshTermCount = finalMeshTerms.length;
    report.addedMeshTerms = [...finalMeshKeys].filter((k) => !initialMeshKeys.has(k));
    report.removedMeshTerms = [...initialMeshKeys].filter((k) => !finalMeshKeys.has(k));
    report.changed = updatedString !== searchString;
  } catch (err) {
    console.warn("[MeSHFlow] Report delta calculation failed:", err?.message || err);
  }

  if (onReport) {
    try {
      onReport(report);
    } catch (err) {
      console.warn("[MeSHFlow] onReport callback failed:", err?.message || err);
    }
  }

  console.groupEnd();

  if (observeOnly) {
    console.info("[MeSHFlow] observeOnly=true - returning original searchString.");
    return searchString;
  }

  return updatedString;
}

// ─────────────────────────────────────────────────────────────────────────────
// PubMed validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the final search string against PubMed (db=pubmed).
 * If PubMed returns errors/warnings, asks AI to fix them.
 * Re-validates after AI correction to ensure the fixed string is clean.
 *
 * @param {string} searchString - The search string to validate
 * @param {string} proxyUrl - The NLM proxy URL
 * @param {string} openAiServiceUrl - The OpenAI proxy URL
 * @param {string} client - The client name
 * @param {number} [attempt=1] - Current attempt number (max 2 to avoid loops)
 * @returns {Promise<string>} The validated (and possibly corrected) search string
 */
async function validateSearchString(
  searchString,
  proxyUrl,
  openAiServiceUrl,
  client,
  attempt = 1,
  language = "dk"
) {
  try {
    const maxAttempts = 4;
    let candidate = searchString;

    for (let i = 1; i <= maxAttempts; i++) {
      const validation = await runPubmedValidation(candidate, proxyUrl);
      const count = validation.count;
      const queryTranslation = validation.queryTranslation || "";

      if (!validation.hasIssues) {
        console.info(`PubMed check passed — ${count} result(s), no errors or warnings.`);
        if (queryTranslation) console.info("PubMed query translation:", queryTranslation);
        return candidate;
      }

      const hasErrors = Object.values(validation.errorlist || {}).flat().filter(Boolean).length > 0;
      const hasWarnings = Object.values(validation.warninglist || {}).flat().filter(Boolean).length > 0;
      if (!hasErrors && hasWarnings && count > 0) {
        console.warn("PubMed check returned warnings only; keeping query because it is executable.", {
          count,
          warninglist: validation.warninglist,
        });
        return candidate;
      }

      console.warn(`PubMed check found issues (attempt ${i}/${maxAttempts}):`, {
        count,
        queryTranslation,
        errorlist: Object.keys(validation.errorlist || {}).length > 0 ? validation.errorlist : null,
        warninglist: Object.keys(validation.warninglist || {}).length > 0 ? validation.warninglist : null,
        issues: validation.issues,
      });

      // First correction strategy: querytranslation from PubMed.
      if (queryTranslation && queryTranslation !== candidate) {
        let corrected = sanitizeSearchStringDeterministic(queryTranslation);
        if (corrected && corrected !== candidate) {
          console.info("Applying querytranslation candidate and re-validating.");
          console.info(`  Previous: ${candidate}`);
          console.info(`  Candidate: ${corrected}`);
          candidate = corrected;
          continue;
        }
      }

      // Second correction strategy: AI fix based on PubMed issues.
      const aiFixed = await aiFixSearchString(
        candidate,
        validation.issues,
        openAiServiceUrl,
        client,
        language
      );
      if (aiFixed && aiFixed !== candidate) {
        const normalizedAiFixed = sanitizeSearchStringDeterministic(aiFixed);
        console.info("Applying AI fix candidate and re-validating.");
        console.info(`  Previous: ${candidate}`);
        console.info(`  Candidate: ${normalizedAiFixed}`);
        candidate = normalizedAiFixed;
        continue;
      }

      // No new candidate can be produced -> stop retrying.
      break;
    }

    // Hard fail: never return an unvalidated final query to the form.
    throw new Error("Could not produce a PubMed-valid query without errors/warnings.");
  } catch (error) {
    console.error("Final search string validation failed hard:", error.message);
    throw error;
  }
}

function normalizeBooleanOperatorsOutsideQuotes(searchString) {
  if (!searchString) return searchString;
  let inQuotes = false;
  let segment = "";
  let result = "";

  const flushSegment = () => {
    if (!segment) return;
    segment = segment
      .replace(/\band\b/gi, "AND")
      .replace(/\bor\b/gi, "OR")
      .replace(/\bnot\b/gi, "NOT");
    result += segment;
    segment = "";
  };

  for (let i = 0; i < searchString.length; i++) {
    const char = searchString[i];
    if (char === "\"") {
      flushSegment();
      inQuotes = !inQuotes;
      result += char;
      continue;
    }
    if (inQuotes) {
      result += char;
    } else {
      segment += char;
    }
  }
  flushSegment();
  return result;
}

async function runPubmedValidation(searchString, proxyUrl) {
  const params = {
    db: "pubmed",
    term: searchString,
    retmode: "json",
    retmax: "0",
  };

  const response = await nlmGet(proxyUrl, "NlmSearch.php", params);
  const result = response.data?.esearchresult || {};
  const count = parseInt(result?.count || "0", 10);
  const queryTranslation = result?.querytranslation || "";
  const errorlist = result?.errorlist || {};
  const warninglist = result?.warninglist || {};
  const allErrorFields = Object.values(errorlist).flat().filter(Boolean);
  const allWarningFields = Object.values(warninglist).flat().filter(Boolean);
  const issues = [...allErrorFields, ...allWarningFields];

  return {
    count,
    queryTranslation,
    errorlist,
    warninglist,
    issues,
    hasIssues: issues.length > 0,
  };
}

async function aiFixSearchString(searchString, issues, openAiServiceUrl, client, language = "dk") {
  if (!openAiServiceUrl) return searchString;
  const localePrompt = getPromptForLocale(meshFixPrompt, language);
  const issuesText = issues.length > 0 ? issues.join("\n- ") : "Ukendte fejl";
  const prompt = localePrompt.prompt
    .replace(/\{searchString\}/g, searchString)
    .replace(/\{issues\}/g, `- ${issuesText}`);
  return callAiStreaming(prompt, "", openAiServiceUrl, client);
}

async function aiCheckIntentCoverage(intentText, searchString, openAiServiceUrl, client, language = "dk") {
  if (!intentText || !openAiServiceUrl) return true;

  const localePrompt = getPromptForLocale(executionIntentCheckPrompt, language);
  const prompt = localePrompt.prompt
    .replace(/\{intentText\}/g, intentText)
    .replace(/\{searchString\}/g, searchString);

  const answer = await callAiStreaming(prompt, "", openAiServiceUrl, client);
  return /^yes\b/i.test((answer || "").trim());
}

async function aiAlignToIntent(intentText, searchString, openAiServiceUrl, client, language = "dk") {
  if (!intentText || !openAiServiceUrl) return searchString;

  const localePrompt = getPromptForLocale(executionIntentAlignPrompt, language);
  const prompt = localePrompt.prompt
    .replace(/\{intentText\}/g, intentText)
    .replace(/\{searchString\}/g, searchString);

  return callAiStreaming(prompt, "", openAiServiceUrl, client);
}

/**
 * Hybrid validator for execution-time queries.
 * Always checks query against NLM ESearch before the query is used.
 * If issues are found, applies automatic corrections and retries.
 * Additionally checks if the query still matches user intent.
 *
 * @param {string} searchString
 * @param {string} intentText
 * @param {string} proxyUrl
 * @param {string} openAiServiceUrl
 * @param {string} client
 * @param {string} [language="dk"]
 * @param {number} [maxAttempts=10]
 * @returns {Promise<string>}
 */
export async function validateQueryForExecution(
  searchString,
  intentText,
  proxyUrl,
  openAiServiceUrl,
  client,
  language = "dk",
  maxAttempts = 10
) {
  if (!searchString || !proxyUrl) return searchString;

  const flowId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.group(`[ExecutionFlow][${flowId}] validateQueryForExecution`);
  console.info(`[ExecutionFlow][${flowId}] Raw query:`, searchString);
  console.info(`[ExecutionFlow][${flowId}] Intent text:`, intentText || "<empty>");

  let candidate = searchString;
  let lastValid = "";
  let successQuery = "";

  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
    console.group(`[ExecutionFlow][${flowId}] Attempt ${attempt}/${maxAttempts}`);
    try {
      console.info("Candidate before normalize:", candidate);
      candidate = sanitizeSearchStringDeterministic(candidate);
      console.info("Candidate after normalize:", candidate);

      const validation = await runPubmedValidation(candidate, proxyUrl);
      console.info("NLM validation summary:", {
        count: validation.count,
        hasIssues: validation.hasIssues,
        issuesCount: validation.issues.length,
        hasQueryTranslation: !!validation.queryTranslation,
      });

      if (validation.hasIssues) {
        console.warn("Validation issues detected:", validation.issues);
        if (validation.queryTranslation) {
          console.info("Applying PubMed querytranslation correction.");
          candidate = sanitizeSearchStringDeterministic(validation.queryTranslation);
          console.info("Candidate after querytranslation correction:", candidate);
          continue;
        }
        console.info("No querytranslation available. Applying AI fix.");
        candidate = await aiFixSearchString(
          candidate,
          validation.issues,
          openAiServiceUrl,
          client,
          language
        );
        console.info("Candidate after AI fix:", candidate);
        continue;
      }

      lastValid = candidate;
      const intentOk = await aiCheckIntentCoverage(
        intentText,
        candidate,
        openAiServiceUrl,
        client,
        language
      );
      console.info("Intent coverage result:", intentOk ? "YES" : "NO");
      if (intentOk) {
        console.info(`[ExecutionFlow][${flowId}] Final status: success`);
        successQuery = candidate;
        break;
      }

      if (attempt < maxAttempts) {
        console.info("Intent mismatch. Applying AI alignment.");
        candidate = await aiAlignToIntent(intentText, candidate, openAiServiceUrl, client, language);
        console.info("Candidate after intent alignment:", candidate);
      }
    } catch (error) {
      console.warn(`Execution validation failed on attempt ${attempt}:`, error.message);
      // Continue retries to handle transient failures.
    } finally {
      console.groupEnd();
    }
  }

  if (successQuery) {
    console.groupEnd();
    return successQuery;
  }

  if (lastValid) {
    console.warn(`[ExecutionFlow][${flowId}] Final status: fallback_last_valid`);
    console.groupEnd();
    return lastValid;
  }

  console.warn(`[ExecutionFlow][${flowId}] Final status: fallback_original`);
  console.groupEnd();
  return searchString;
}
