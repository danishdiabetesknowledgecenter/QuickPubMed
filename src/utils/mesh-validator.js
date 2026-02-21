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

import axios from "axios";
import { meshFixPrompt, meshOptimizationPrompt } from "@/assets/content/qpm-prompts-mesh.js";
import { getPromptForLocale } from "@/utils/qpm-prompts-helpers.js";

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
    "Title/Abstract": "tiab",
    "Title": "ti",
    "MeSH Terms": "mh",
    "MeSH Subheading": "sh",
    "MeSH Major Topic": "majr",
    "Author": "au",
    "Journal": "ta",
    "Language": "la",
    "Publication Type": "pt",
    "Publication Date": "dp",
    "Affiliation": "ad",
    "Substance Name": "nm",
    "Subset": "sb",
    "Article Identifier": "aid",
    "Text Word": "tw",
  };

  let result = searchString;
  for (const [verbose, short] of Object.entries(tagMap)) {
    result = result.replace(new RegExp(`\\[${verbose}\\]`, "gi"), `[${short}]`);
  }
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
    if (term && term.length > 2) {
      concepts.add(term.toLowerCase());
    }
  }

  return [...concepts];
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
  try {
    const params = new URLSearchParams({
      db: "mesh",
      term: `"${term}"[MeSH Terms]`,
      retmode: "json",
      retmax: "1",
    });

    const response = await axios.get(`${proxyUrl}/NlmSearch.php?${params}`, { timeout: 10000 });
    const count = parseInt(response.data?.esearchresult?.count || "0", 10);
    const uid = response.data?.esearchresult?.idlist?.[0] || null;

    return { valid: count > 0, uid };
  } catch (error) {
    console.warn(`MeSH validation failed for "${term}":`, error.message);
    return { valid: true, uid: null };
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
    const params = new URLSearchParams({
      db: "mesh",
      id: uids.join(","),
      retmode: "json",
    });

    const response = await axios.get(`${proxyUrl}/NlmSummary.php?${params}`, { timeout: 10000 });
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
    const params = new URLSearchParams({
      db: "mesh",
      term: userInput,
      retmode: "json",
      retmax: "10",
    });

    const response = await axios.get(`${proxyUrl}/NlmSearch.php?${params}`, { timeout: 10000 });
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

  // Step A: Validate [mh] terms + fetch NLM suggestions in parallel
  const [validationResults, inputSuggestions] = await Promise.all([
    Promise.all(
      meshTerms.map(async ({ term, fullMatch }) => {
        const result = await validateMeshTerm(term, proxyUrl);
        return { term, fullMatch, ...result };
      })
    ),
    fetchMeshSuggestionsForInput(meshSearchQuery, proxyUrl),
  ]);

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
      model: "gpt-5.2",
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
export async function validateAndEnhanceMeshTerms(searchString, userInput, proxyUrl, openAiServiceUrl, client, language = "dk", onProgress) {
  if (!searchString || !proxyUrl) return searchString;

  console.group("|MeSH Validation|");
  console.info("Input search string:", searchString);
  console.info("User input:", userInput);

  let updatedString = searchString;

  // ── Step 1: Build rich MeSH context from NLM ──
  console.group("Step 1: Building MeSH context from NLM...");
  const meshContext = await buildMeshContext(searchString, userInput, proxyUrl);

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
    console.group("Step 2: AI optimization with MeSH context...");
    console.info("Sending MeSH context to AI for optimization...");
    const beforeAi = updatedString;
    updatedString = await aiOptimizeWithMeshContext(updatedString, userInput, meshContext, openAiServiceUrl, client, language);
    if (updatedString !== beforeAi) {
      console.info("AI optimized search string:");
      console.info(`  Before: ${beforeAi}`);
      console.info(`  After:  ${updatedString}`);
    } else {
      console.info("AI returned no changes.");
    }
    console.groupEnd();
  } else {
    console.info("Step 2: No MeSH data available — skipping AI optimization.");
  }

  // ── Step 3: Validate final search string against PubMed ──
  console.group("Step 3: Validating search string against PubMed...");
  console.info("Search string before PubMed check:", updatedString);
  updatedString = await validateSearchString(updatedString, proxyUrl, openAiServiceUrl, client);
  console.info("Search string after PubMed check:", updatedString);
  console.groupEnd();

  // ── Step 4: Normalize field tags, quote MeSH terms, remove duplicates, lowercase ──
  updatedString = normalizeFieldTags(updatedString);
  updatedString = quoteMeshTerms(updatedString);
  updatedString = removeDuplicateTerms(updatedString);
  updatedString = lowercaseNonMeshTerms(updatedString);
  updatedString = normalizeBooleanOperatorsOutsideQuotes(updatedString);

  // ── Summary ──
  if (updatedString !== searchString) {
    console.info("Final result (changed):", updatedString);
  } else {
    console.info("Final result (unchanged):", updatedString);
  }
  console.groupEnd();

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
async function validateSearchString(searchString, proxyUrl, openAiServiceUrl, client, attempt = 1) {
  try {
    const params = new URLSearchParams({
      db: "pubmed",
      term: searchString,
      retmode: "json",
      retmax: "0",
    });

    const response = await axios.get(`${proxyUrl}/NlmSearch.php?${params}`, { timeout: 10000 });
    const result = response.data?.esearchresult;
    const count = parseInt(result?.count || "0", 10);
    const queryTranslation = result?.querytranslation || "";

    // Collect ALL error/warning info from PubMed's response
    const errorlist = result?.errorlist || {};
    const warninglist = result?.warninglist || {};
    const allErrorFields = Object.values(errorlist).flat().filter(Boolean);
    const allWarningFields = Object.values(warninglist).flat().filter(Boolean);
    const allIssues = [...allErrorFields, ...allWarningFields];

    // If PubMed returned any error or warning at all, there is a problem
    const hasErrors = allIssues.length > 0;

    if (!hasErrors) {
      console.info(`PubMed check passed — ${count} result(s), no errors or warnings.`);
      if (queryTranslation) console.info("PubMed query translation:", queryTranslation);
      return searchString;
    }

    console.warn(`PubMed check found issues:`, {
      count,
      queryTranslation,
      errorlist: Object.keys(errorlist).length > 0 ? errorlist : null,
      warninglist: Object.keys(warninglist).length > 0 ? warninglist : null,
      issues: allIssues,
    });

    // Use PubMed's own querytranslation as the corrected search string.
    // This is what PubMed actually searched — guaranteed to work without errors.
    if (queryTranslation) {
      let corrected = normalizeFieldTags(queryTranslation);
      corrected = removeDuplicateTerms(corrected);
      console.info(`Using PubMed's querytranslation as corrected search string.`);
      console.info(`  Original: ${searchString}`);
      console.info(`  PubMed:   ${queryTranslation}`);
      console.info(`  Cleaned:  ${corrected}`);
      return corrected;
    }

    // Fallback: no querytranslation available, return as-is
    console.warn("No querytranslation available — returning original search string.");
    return searchString;
  } catch (error) {
    console.warn("Final search string validation failed:", error.message);
    return searchString;
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
  const params = new URLSearchParams({
    db: "pubmed",
    term: searchString,
    retmode: "json",
    retmax: "0",
  });

  const response = await axios.get(`${proxyUrl}/NlmSearch.php?${params}`, { timeout: 10000 });
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

async function aiCheckIntentCoverage(intentText, searchString, openAiServiceUrl, client) {
  if (!intentText || !openAiServiceUrl) return true;

  const prompt = `Vurder om PubMed-søgestrengen udtrykker brugerens søgeintention.
Brugerens intention:
"${intentText}"
Søgestreng:
${searchString}
Svar KUN med YES eller NO.`;

  const answer = await callAiStreaming(prompt, "", openAiServiceUrl, client);
  return /^yes\b/i.test((answer || "").trim());
}

async function aiAlignToIntent(intentText, searchString, openAiServiceUrl, client) {
  if (!intentText || !openAiServiceUrl) return searchString;

  const prompt = `Du skal justere en PubMed-søgestreng, så den matcher brugerens intention, uden at ødelægge syntaksen.
Brugerens intention:
"${intentText}"
Nuværende søgestreng:
${searchString}
Regler:
- Bevar boolske operatorer og parenteser så vidt muligt.
- Brug kun gyldig PubMed-syntaks.
- Svar KUN med den justerede søgestreng.`;

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

  let candidate = searchString;
  let lastValid = "";

  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
    try {
      candidate = normalizeBooleanOperatorsOutsideQuotes(candidate);
      candidate = normalizeFieldTags(candidate);
      candidate = quoteMeshTerms(candidate);
      candidate = removeDuplicateTerms(candidate);

      const validation = await runPubmedValidation(candidate, proxyUrl);
      if (validation.hasIssues) {
        console.warn(`Execution validation issues (attempt ${attempt}):`, validation.issues);
        if (validation.queryTranslation) {
          candidate = normalizeFieldTags(validation.queryTranslation);
          candidate = quoteMeshTerms(candidate);
          candidate = removeDuplicateTerms(candidate);
          continue;
        }
        candidate = await aiFixSearchString(
          candidate,
          validation.issues,
          openAiServiceUrl,
          client,
          language
        );
        continue;
      }

      lastValid = candidate;
      const intentOk = await aiCheckIntentCoverage(
        intentText,
        candidate,
        openAiServiceUrl,
        client
      );
      if (intentOk) {
        return candidate;
      }

      if (attempt < maxAttempts) {
        candidate = await aiAlignToIntent(intentText, candidate, openAiServiceUrl, client);
      }
    } catch (error) {
      console.warn(`Execution validation failed on attempt ${attempt}:`, error.message);
      break;
    }
  }

  if (lastValid) {
    console.warn("Using last NLM-valid query after max retries.");
    return lastValid;
  }

  console.warn("Falling back to original query after validation failure.");
  return searchString;
}

