#!/usr/bin/env node
/**
 * Explore OpenAlex non-DOI coverage for canary queries.
 *
 * For each canary query, requests OpenAlex works and summarizes the
 * distribution of works without DOI / PMID, their types, publishers, abstract
 * coverage, and language coverage. The script does not modify any state or
 * write to disk; it only prints a human-readable report to stdout.
 *
 * Usage:
 *   node scripts/explore-openalex-nondoi.js            # default canary set
 *   node scripts/explore-openalex-nondoi.js --limit=50 # override per_page (default: 25)
 *   node scripts/explore-openalex-nondoi.js --mailto=you@example.org
 *
 * OpenAlex requires a mailto for the polite pool. Pass via --mailto or the
 * OPENALEX_MAILTO environment variable.
 */

const args = process.argv.slice(2);
function getArg(name, fallback = "") {
  const match = args.find((entry) => entry.startsWith(`--${name}=`));
  if (match) return match.slice(name.length + 3);
  return process.env[name.toUpperCase().replace(/-/g, "_")] || fallback;
}

const LIMIT = Math.max(1, Math.min(200, parseInt(getArg("limit", "25"), 10) || 25));
const MAILTO = getArg("mailto", process.env.OPENALEX_MAILTO || "");

const CANARY_QUERIES = [
  {
    label: "diabetes-guidelines",
    query: "type 2 diabetes clinical practice guideline",
  },
  {
    label: "covid-clinical-practice",
    query: "covid-19 clinical practice guideline management",
  },
  {
    label: "dementia-care",
    query: "dementia care recommendations",
  },
  {
    label: "hypertension-guidelines",
    query: "hypertension management guideline",
  },
  {
    label: "asthma-guidelines",
    query: "asthma clinical practice guideline",
  },
  {
    label: "cgm-accuracy-research",
    query: "continuous glucose monitor accuracy study",
  },
];

function reconstructAbstract(invertedIndex) {
  if (!invertedIndex || typeof invertedIndex !== "object") return "";
  const positions = [];
  for (const [word, indices] of Object.entries(invertedIndex)) {
    if (!Array.isArray(indices)) continue;
    for (const idx of indices) {
      if (Number.isFinite(idx)) positions[idx] = word;
    }
  }
  return positions.filter(Boolean).join(" ").trim();
}

async function fetchCanary(query) {
  const params = new URLSearchParams({
    "search.semantic": query,
    per_page: String(LIMIT),
    select:
      "id,display_name,doi,ids,type,type_crossref,publication_year,language,primary_location,abstract_inverted_index,authorships,is_retracted",
  });
  if (MAILTO) params.set("mailto", MAILTO);
  const url = `https://api.openalex.org/works?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "QuickPubMed-CanaryExplorer/1.0" },
  });
  if (!response.ok) {
    throw new Error(`OpenAlex HTTP ${response.status} for query "${query}"`);
  }
  return response.json();
}

function classify(work) {
  const ids = work?.ids || {};
  const hasPmid = Boolean(ids.pmid);
  const hasDoi = Boolean(work?.doi || ids.doi);
  return {
    hasPmid,
    hasDoi,
    hasOpenAlexId: Boolean(work?.id),
    isNonDoiNonPmid: !hasPmid && !hasDoi,
    type: String(work?.type || "").trim(),
    crossrefType: String(work?.type_crossref || "").trim(),
    sourceType: String(work?.primary_location?.source?.type || "").trim(),
    publisher: String(
      work?.primary_location?.source?.host_organization_name ||
        work?.primary_location?.source?.publisher ||
        ""
    ).trim(),
    sourceName: String(work?.primary_location?.source?.display_name || "").trim(),
    language: String(work?.language || "").trim(),
    hasAbstract: Boolean(work?.abstract_inverted_index),
    abstractLength: reconstructAbstract(work?.abstract_inverted_index).length,
  };
}

function tally(target, key) {
  const normalized = key || "(empty)";
  target[normalized] = (target[normalized] || 0) + 1;
}

async function main() {
  if (typeof fetch !== "function") {
    console.error("Error: global fetch is required (Node 18+)");
    process.exit(1);
  }
  console.log(`OpenAlex non-DOI exploration (limit=${LIMIT}${MAILTO ? `, mailto=${MAILTO}` : ""})\n`);

  const summary = [];
  for (const canary of CANARY_QUERIES) {
    try {
      const payload = await fetchCanary(canary.query);
      const results = Array.isArray(payload?.results) ? payload.results : [];
      const buckets = {
        total: results.length,
        withPmid: 0,
        withDoi: 0,
        nonDoiNonPmid: 0,
        withAbstract: 0,
        retracted: 0,
        byType: {},
        byCrossrefType: {},
        bySourceType: {},
        byLanguage: {},
        nonDoiByType: {},
        nonDoiPublishers: {},
        nonDoiExamples: [],
      };
      for (const work of results) {
        const info = classify(work);
        if (info.hasPmid) buckets.withPmid++;
        if (info.hasDoi) buckets.withDoi++;
        if (info.isNonDoiNonPmid) buckets.nonDoiNonPmid++;
        if (info.hasAbstract) buckets.withAbstract++;
        if (work?.is_retracted) buckets.retracted++;
        tally(buckets.byType, info.type);
        tally(buckets.byCrossrefType, info.crossrefType);
        tally(buckets.bySourceType, info.sourceType);
        tally(buckets.byLanguage, info.language);
        if (info.isNonDoiNonPmid) {
          tally(buckets.nonDoiByType, info.type);
          if (info.publisher) tally(buckets.nonDoiPublishers, info.publisher);
          if (buckets.nonDoiExamples.length < 5) {
            buckets.nonDoiExamples.push({
              title: String(work?.display_name || "").slice(0, 120),
              type: info.type,
              publisher: info.publisher || info.sourceName,
              abstractLength: info.abstractLength,
              language: info.language,
              openAlexId: String(work?.id || ""),
            });
          }
        }
      }
      summary.push({ label: canary.label, query: canary.query, buckets });
    } catch (err) {
      summary.push({ label: canary.label, query: canary.query, error: String(err?.message || err) });
    }
  }

  for (const entry of summary) {
    console.log(`=== ${entry.label} === "${entry.query}"`);
    if (entry.error) {
      console.log(`  ERROR: ${entry.error}\n`);
      continue;
    }
    const b = entry.buckets;
    console.log(
      `  total=${b.total}  withPmid=${b.withPmid}  withDoi=${b.withDoi}  nonDoiNonPmid=${b.nonDoiNonPmid}  withAbstract=${b.withAbstract}  retracted=${b.retracted}`
    );
    console.log(`  byType: ${JSON.stringify(b.byType)}`);
    console.log(`  bySourceType: ${JSON.stringify(b.bySourceType)}`);
    console.log(`  byLanguage: ${JSON.stringify(b.byLanguage)}`);
    if (b.nonDoiNonPmid > 0) {
      console.log(`  nonDoiByType: ${JSON.stringify(b.nonDoiByType)}`);
      console.log(`  nonDoiPublishers: ${JSON.stringify(b.nonDoiPublishers)}`);
      for (const ex of b.nonDoiExamples) {
        console.log(
          `  * [${ex.type}] ${ex.publisher || "(no publisher)"} | abstract=${ex.abstractLength} chars | lang=${ex.language || "?"} | ${ex.title}`
        );
      }
    }
    console.log("");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
