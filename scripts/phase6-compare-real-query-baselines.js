// Phase 6 (unified-engine full-parity plan): compares the legacy-JS browser
// baseline against the PHP unified-engine baseline for the same 6
// production-representative queries.
//
// Per the plan's realistic gate (LLM non-determinism accounted for):
//  (a) candidate SET overlap (how many of the top-10 PMIDs appear in both,
//      regardless of order) is the primary signal - a near-complete overlap
//      means the two engines are drawing from the same underlying candidate
//      pool and applying compatible relevance judgments.
//  (b) exact order match is reported but NOT required to be 100%, since
//      query translation + MeSH validation + LLM final-rerank all involve
//      non-deterministic OpenAI calls on both sides.
//
// Run: node scripts/phase6-compare-real-query-baselines.js

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const jsBaseline = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "real-query-baseline-legacy-js.json"), "utf8"));
const phpBaseline = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "real-query-baseline-php-unified-3source.json"), "utf8"));

const phpByQuery = new Map(phpBaseline.queries.map((q) => [q.query, q]));

console.log(`\nComparing ${jsBaseline.queries.length} queries (JS engine vs. PHP unified engine, sources: ${(jsBaseline.sourcesUsed || ["pubmed", "semanticScholar", "openAlex"]).join(", ")})\n`);
console.log("=".repeat(100));

let totalOverlapSum = 0;
let totalQueries = 0;

for (const jsQuery of jsBaseline.queries) {
  const phpQuery = phpByQuery.get(jsQuery.query);
  console.log(`\nQuery: "${jsQuery.query}"`);
  if (!phpQuery) {
    console.log("  MISSING from PHP baseline!");
    continue;
  }
  if (!jsQuery.resultOrder || jsQuery.resultOrder.length === 0) {
    console.log("  JS baseline has no results (see notes: " + (jsQuery.notes || "none") + ")");
    continue;
  }
  if (!phpQuery.resultOrder || phpQuery.resultOrder.length === 0) {
    console.log("  PHP baseline has no results (see notes: " + (phpQuery.notes || "none") + ")");
    continue;
  }

  const jsSet = new Set(jsQuery.resultOrder);
  const phpSet = new Set(phpQuery.resultOrder);
  const overlap = [...jsSet].filter((id) => phpSet.has(id));
  const overlapRatio = overlap.length / Math.max(jsSet.size, phpSet.size);
  totalOverlapSum += overlapRatio;
  totalQueries += 1;

  const exactOrderMatch = JSON.stringify(jsQuery.resultOrder) === JSON.stringify(phpQuery.resultOrder);

  console.log(`  JS  order:  ${jsQuery.resultOrder.join(", ")}`);
  console.log(`  PHP order:  ${phpQuery.resultOrder.join(", ")}`);
  console.log(`  Overlap: ${overlap.length}/${Math.max(jsSet.size, phpSet.size)} (${(overlapRatio * 100).toFixed(0)}%) - ${overlap.join(", ")}`);
  console.log(`  Exact order match: ${exactOrderMatch ? "YES" : "no"}`);
}

console.log("\n" + "=".repeat(100));
if (totalQueries > 0) {
  console.log(`\nAverage candidate-set overlap across ${totalQueries} queries: ${((totalOverlapSum / totalQueries) * 100).toFixed(1)}%`);
} else {
  console.log("\nNo comparable queries found.");
}
