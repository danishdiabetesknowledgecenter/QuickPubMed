// Test scenarios for the publication-type classifier.
// Run: node scripts/verify-pubtype-classifier.js

import { classifyPublicationType } from "../src/utils/pubTypeClassifier.js";

const DEFAULT_ALLOW_LIST = [
  { name: "World Health Organization", aliases: ["WHO", "World Health Organization"], openAlexInstitutionId: "I4210096875" },
  { name: "National Institute for Health and Care Excellence", aliases: ["NICE", "National Institute for Health and Care Excellence"] },
  { name: "Centers for Disease Control and Prevention", aliases: ["CDC", "Centers for Disease Control and Prevention"] },
  { name: "Sundhedsstyrelsen", aliases: ["Sundhedsstyrelsen", "Danish Health Authority"] },
  { name: "Cochrane Collaboration", aliases: ["Cochrane", "Cochrane Collaboration"] },
];

const SCENARIOS = [
  {
    label: "PubMed Practice Guideline with PMID",
    entry: {
      pmid: "111",
      title: "Clinical Practice Guideline for Management of Diabetes",
      enriched: { pubTypes: ["Practice Guideline", "Journal Article"], publisher: "", venue: "Diabetes Care" },
    },
    expectTier: "guideline_verified",
    expectConfidence: "high",
  },
  {
    label: "OpenAlex report from WHO (publisher allow-list)",
    entry: {
      openAlexId: "W123",
      title: "Living guideline for diabetes management",
      enriched: { pubTypes: [], workType: "report", publisher: "World Health Organization", venue: "WHO" },
    },
    expectTier: "guideline_verified",
    expectConfidence: "high",
  },
  {
    label: "NICE guideline, title match",
    entry: {
      openAlexId: "W456",
      title: "NG28: Type 2 diabetes in adults - management",
      enriched: { pubTypes: [], workType: "report", publisher: "NICE", venue: "" },
    },
    expectTier: "guideline_verified",
    expectConfidence: "high",
  },
  {
    label: "Unknown publisher, title contains 'guideline' + report workType → guideline_candidate",
    entry: {
      openAlexId: "W789",
      title: "Clinical practice guideline for acute stroke",
      enriched: { pubTypes: [], workType: "report", publisher: "Acme Medical Association", venue: "Journal of Made Up" },
    },
    expectTier: "guideline_candidate",
    expectConfidence: "medium",
  },
  {
    label: "Title 'recommendation' only, no report workType → guideline_candidate low confidence",
    entry: {
      doi: "10.1/abc",
      title: "Recommendation for exercise in heart failure",
      enriched: { pubTypes: ["journal-article"], workType: "article" },
    },
    expectTier: "guideline_candidate",
    expectConfidence: "low",
  },
  {
    label: "PubMed systematic review",
    entry: {
      pmid: "222",
      title: "A Systematic Review of X",
      enriched: { pubTypes: ["Systematic Review"] },
    },
    expectTier: "systematic_review_or_meta",
    expectConfidence: "high",
  },
  {
    label: "Title-only systematic review → medium confidence",
    entry: {
      pmid: "223",
      title: "Treatment of X: a systematic review",
      enriched: { pubTypes: ["Journal Article"] },
    },
    expectTier: "systematic_review_or_meta",
    expectConfidence: "medium",
  },
  {
    label: "Meta-analysis title pattern → medium confidence",
    entry: {
      pmid: "224",
      title: "Meta-Analysis of Treatment Y",
      enriched: { pubTypes: ["Journal Article"] },
    },
    expectTier: "systematic_review_or_meta",
    expectConfidence: "medium",
  },
  {
    label: "PubMed RCT",
    entry: {
      pmid: "333",
      title: "Trial of Something",
      enriched: { pubTypes: ["Randomized Controlled Trial"] },
    },
    expectTier: "randomized_controlled_trial",
    expectConfidence: "high",
  },
  {
    label: "Title-only RCT",
    entry: {
      pmid: "334",
      title: "A Randomized Controlled Trial of Y",
      enriched: { pubTypes: ["Journal Article"] },
    },
    expectTier: "randomized_controlled_trial",
    expectConfidence: "medium",
  },
  {
    label: "Clinical trial pubType",
    entry: {
      pmid: "444",
      title: "Phase II Trial of Z",
      enriched: { pubTypes: ["Clinical Trial"] },
    },
    expectTier: "clinical_trial",
    expectConfidence: "high",
  },
  {
    label: "PubMed review",
    entry: {
      pmid: "555",
      title: "A Review of Field",
      enriched: { pubTypes: ["Review"] },
    },
    expectTier: "review",
    expectConfidence: "high",
  },
  {
    label: "Dissertation from OpenAlex",
    entry: {
      openAlexId: "W901",
      title: "Towards an understanding of X: A dissertation",
      enriched: { pubTypes: [], workType: "dissertation" },
    },
    expectTier: "dissertation",
    expectConfidence: "high",
  },
  {
    label: "Book chapter",
    entry: {
      openAlexId: "W902",
      title: "Chapter 5: Advanced topics",
      enriched: { pubTypes: [], workType: "book-chapter" },
    },
    expectTier: "book_chapter",
    expectConfidence: "high",
  },
  {
    label: "Book (standalone)",
    entry: {
      openAlexId: "W903",
      title: "Modern Approaches to X",
      enriched: { pubTypes: [], workType: "book" },
    },
    expectTier: "book",
    expectConfidence: "high",
  },
  {
    label: "Preprint",
    entry: {
      openAlexId: "W904",
      title: "Novel findings in X",
      enriched: { pubTypes: [], workType: "preprint" },
    },
    expectTier: "preprint",
    expectConfidence: "high",
  },
  {
    label: "Report without allow-list match → report_generic",
    entry: {
      openAlexId: "W905",
      title: "Annual report 2023",
      enriched: { pubTypes: [], workType: "report", publisher: "Private Corp" },
    },
    expectTier: "report_generic",
    expectConfidence: "medium",
  },
  {
    label: "Report with allow-list match → guideline_verified (trusted publisher)",
    entry: {
      openAlexId: "W906",
      title: "Health report 2023",
      enriched: { pubTypes: [], workType: "report", publisher: "Centers for Disease Control and Prevention" },
    },
    expectTier: "guideline_verified",
    expectConfidence: "high",
  },
  {
    label: "Editorial",
    entry: {
      pmid: "666",
      title: "Our view on recent findings",
      enriched: { pubTypes: ["Editorial"] },
    },
    expectTier: "editorial_or_letter",
    expectConfidence: "high",
  },
  {
    label: "Letter pubType",
    entry: {
      pmid: "667",
      title: "Letter to the Editor",
      enriched: { pubTypes: ["Letter"] },
    },
    expectTier: "editorial_or_letter",
    expectConfidence: "high",
  },
  {
    label: "Regular journal article",
    entry: {
      pmid: "777",
      title: "Our new mechanism for X",
      enriched: { pubTypes: ["Journal Article"] },
    },
    expectTier: "research_article",
    expectConfidence: "high",
  },
  {
    label: "Unknown workType, has PMID → medium research_article",
    entry: {
      pmid: "778",
      title: "Interesting finding",
      enriched: { pubTypes: [] },
    },
    expectTier: "research_article",
    expectConfidence: "medium",
  },
  {
    label: "Unknown workType, no PMID → low research_article",
    entry: {
      openAlexId: "W999",
      title: "Some work",
      enriched: { pubTypes: [], workType: "" },
    },
    expectTier: "research_article",
    expectConfidence: "low",
  },
  {
    label: "Erratum → excluded",
    entry: {
      pmid: "888",
      title: "Correction to: previous paper",
      enriched: { pubTypes: ["Published Erratum"] },
    },
    expectTier: "excluded",
    expectConfidence: "high",
  },
  {
    label: "Dataset → excluded",
    entry: {
      openAlexId: "W3000",
      title: "Gene expression dataset",
      enriched: { pubTypes: [], workType: "dataset" },
    },
    expectTier: "excluded",
    expectConfidence: "high",
  },
  {
    label: "Peer review → excluded",
    entry: {
      openAlexId: "W3001",
      title: "Review of manuscript 2023-1234",
      enriched: { pubTypes: [], workType: "peer-review" },
    },
    expectTier: "excluded",
    expectConfidence: "high",
  },
  {
    label: "Title-only meta-analysis in report workType still classifies as systematic_review_or_meta",
    entry: {
      pmid: "999",
      title: "Network meta-analysis of treatments for X",
      enriched: { pubTypes: ["Journal Article"], workType: "article" },
    },
    expectTier: "systematic_review_or_meta",
    expectConfidence: "medium",
  },
  {
    label: "OpenAlex institutionId match (WHO)",
    entry: {
      openAlexId: "W3002",
      title: "WHO report on global health",
      enriched: { pubTypes: [], workType: "report", publisher: "", institutionIds: ["I4210096875"] },
    },
    expectTier: "guideline_verified",
    expectConfidence: "high",
  },
];

let passed = 0;
let failed = 0;
const failures = [];

for (const scenario of SCENARIOS) {
  const result = classifyPublicationType(scenario.entry, {
    guidelinePublisherAllowList: DEFAULT_ALLOW_LIST,
  });
  const tierOk = result.tier === scenario.expectTier;
  const confidenceOk = result.confidence === scenario.expectConfidence;
  if (tierOk && confidenceOk) {
    passed += 1;
    console.log(`[PASS] ${scenario.label}: tier=${result.tier} confidence=${result.confidence}`);
  } else {
    failed += 1;
    failures.push({ scenario: scenario.label, expected: scenario, got: result });
    console.log(
      `[FAIL] ${scenario.label}: expected tier=${scenario.expectTier} confidence=${scenario.expectConfidence}; got tier=${result.tier} confidence=${result.confidence}`
    );
  }
}

console.log("\n========================================");
console.log(`Total: ${SCENARIOS.length}  Passed: ${passed}  Failed: ${failed}`);
console.log("========================================");
if (failed > 0) {
  console.log("\nFailure details:");
  for (const failure of failures) {
    console.log(JSON.stringify(failure, null, 2));
  }
  process.exit(1);
}
