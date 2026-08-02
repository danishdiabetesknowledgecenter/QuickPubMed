// Phase 0 baseline capture for the unified-search-engine plan.
//
// Runs every fixture scenario in scripts/fixtures/rerank-parity-fixtures.json through
// the current JS engine (rerankSemanticCandidates, which internally calls
// pubTypeClassifier.js) and writes the result to
// scripts/fixtures/rerank-parity-baseline-js.json.
//
// This baseline is the ground truth that the PHP port (Phase 1-4) must match.
// A non-neutral rerank config is used deliberately so quality-signal code paths
// (citation impact cascade, retraction, data quality, authority, recency) are
// actually exercised, not left at their neutral (no-op) defaults.
//
// Run: node scripts/capture-js-baseline.js

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { rerankSemanticCandidates } from "../src/utils/semanticReranking.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixturesPath = path.join(__dirname, "fixtures", "rerank-parity-fixtures.json");
const outputPath = path.join(__dirname, "fixtures", "rerank-parity-baseline-js.json");

const fixtures = JSON.parse(readFileSync(fixturesPath, "utf8"));

// Non-neutral test config: exercises every quality-signal code path so parity
// gates cannot silently pass by never actually running them.
const testRerankConfig = {
  sourceWeights: { pubmed: 1.0, semanticScholar: 0.92, openAlex: 0.88, elicit: 0.9 },
  pmidBonus: 10,
  rankScale: 100,
  scoreScale: 20,
  fallbackSourceWeight: 0.8,
  overlapBonusPerExtraSource: 35,
  rrfK: 60,
  pubTypeWeights: {},
  recencyHalfLifeYears: 8,
  recencyBonusMax: 15,
  oaBonus: 5,
  citationImpactClamp: [0.8, 1.3],
  citationImpactSignalWeights: {
    rcr: 0.5,
    fwci: 0.5,
    nihPercentile: 0.3,
    fieldNormalizedCitationRatio: 0.3,
    influentialCitationCount: 0.15,
    citedByCount: 0.08,
  },
  retractionAction: "filter",
  retractionPenalty: 1.0,
  clinicalBonus: 10,
  clinicalCitedByThreshold: 1000,
  topicOverlapBonus: 20,
  authorityClamp: [0.95, 1.1],
  dataQualityPenalties: {
    missingAbstract: 0.9,
    shortAbstract: 0.95,
    veryShortAbstract: 0.98,
    missingAuthor: 0.95,
    missingYear: 0.95,
  },
  abstractMinLength: { short: 100, veryShort: 250 },
  pubTypeTiers: {
    guideline_verified: 40,
    guideline_candidate: 30,
    systematic_review_or_meta: 35,
    randomized_controlled_trial: 25,
    review: 12,
    clinical_trial: 15,
    research_article: 0,
    excluded: 0,
  },
  guidelinePublisherAllowList: [{ name: "World Health Organization", aliases: ["who"] }],
};

const results = {};
for (const scenario of fixtures.scenarios) {
  const rerankResult = rerankSemanticCandidates(scenario.sourceResults, testRerankConfig, {});
  results[scenario.id] = {
    description: scenario.description,
    order: rerankResult.candidates.map((c) => ({
      pmid: c.pmid,
      doi: c.doi,
      title: c.title,
      combinedScore: c.combinedScore,
      bestRank: c.bestRank,
      sourceCount: c.sourceCount,
      pubTypeTier: c.pubTypeClassification?.tier || "",
      pubTypeConfidence: c.pubTypeClassification?.confidence || "",
    })),
    filteredCount: rerankResult.filteredCandidates.length,
    rerankMode: rerankResult.rerankMode,
  };
}

writeFileSync(outputPath, JSON.stringify({ generatedAt: new Date().toISOString(), testRerankConfig, results }, null, 2));
console.log(`Baseline written to ${outputPath}`);
console.log(`Scenarios captured: ${Object.keys(results).length}`);
