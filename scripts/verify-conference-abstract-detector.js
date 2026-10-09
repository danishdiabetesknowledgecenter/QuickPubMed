// Fixtures for the general conference-abstract detector.
// Run: node scripts/verify-conference-abstract-detector.js

import { isConferenceAbstract } from "../src/utils/conferenceAbstractDetector.js";

const SCENARIOS = [
  {
    label: "OpenAlex type conference-abstract",
    record: { title: "Treatment patterns in newly diagnosed patients", types: ["conference-abstract"], issue: "12", pages: "S641-S641" },
    expect: true,
  },
  {
    label: "DOI path meeting-abstracts",
    record: { title: "Outcomes after diagnosis", doi: "10.1000/meeting-abstracts.2024.1", types: ["article"] },
    expect: true,
  },
  {
    label: "Abstract source name and one S page",
    record: { title: "Glucose targets in adults", sourceName: "Abstracts of the Annual Meeting", pages: "S3", types: ["article"] },
    expect: true,
  },
  {
    label: "Meeting issue and a two-page S span",
    record: { title: "Caregiver burden after diagnosis", issue: "Annual Meeting", pages: "S10-S11", types: ["article"] },
    expect: true,
  },
  {
    label: "Congress issue and one S page",
    record: { title: "Education needs in the first year", issue: "Congress", pages: "S4", types: ["article"] },
    expect: true,
  },
  {
    label: "Supplement issue and one S page without a title code",
    record: { title: "Family experiences after diagnosis", issue: "Supplement_1", pages: "S12", types: ["article"] },
    expect: true,
  },
  {
    label: "Supplement issue and a digit-letter title code without pages",
    record: { title: "674-P: Information needs after diagnosis", issue: "Supplement_1", types: ["article"] },
    expect: true,
  },
  {
    label: "Letter-digit title code and a two-page S span",
    record: { title: "PS-045 Costs after a new diagnosis", pages: "S91-S92", issue: "6", types: ["review"] },
    expect: true,
  },
  {
    label: "Hyphenated session code and one S page",
    record: { title: "OR1-1: Insulin dosing in the first month", pages: "S4", types: ["article"] },
    expect: true,
  },
  {
    label: "Late-breaking code and a poster issue",
    record: { title: "LB001 Technology choices at diagnosis", issue: "Poster session", types: ["article"] },
    expect: true,
  },
  {
    label: "Digit-letter code and a supplement issue",
    record: { title: "500-P: Gaps in education at diagnosis", issue: "Supplement_1", types: ["article"] },
    expect: true,
  },
  {
    label: "Review without a code in a numbered issue",
    record: { title: "Humanistic burden of informal caregivers: a systematic literature review", issue: "1", types: ["review"] },
    expect: false,
  },
  {
    label: "Multi-page supplement article",
    record: { title: "Standards of care", issue: "Supplement_1", pages: "S5-S40", types: ["article"] },
    expect: false,
  },
  {
    label: "Multi-page article in a meeting issue",
    record: { title: "Long term outcomes", issue: "Annual Meeting", pages: "10-40", types: ["article"] },
    expect: false,
  },
  {
    label: "One-page introduction in a supplement",
    record: { title: "Introduction", issue: "Supplement_1", pages: "1", types: ["editorial"] },
    expect: false,
  },
  {
    label: "Abstract-named source with a long page span",
    record: { title: "Cohort follow-up after diagnosis", sourceName: "Abstracts of the Annual Meeting", pages: "10-40", types: ["article"] },
    expect: false,
  },
  {
    label: "IL17 title with ordinary pages",
    record: { title: "IL17 blockade in autoimmune disease", pages: "100-110", issue: "4", types: ["article"] },
    expect: false,
  },
  {
    label: "B12 title with ordinary pages",
    record: { title: "B12 deficiency and neuropathy", pages: "20-28", issue: "2", types: ["article"] },
    expect: false,
  },
  {
    label: "COVID-19 title in a multi-page supplement",
    record: { title: "COVID-19 outcomes", issue: "Supplement_1", pages: "S5-S20", types: ["article"] },
    expect: false,
  },
  {
    label: "Supplementation in the title is not an issue signal",
    record: { title: "Vitamin D supplementation", issue: "4", pages: "10-20", types: ["article"] },
    expect: false,
  },
  {
    label: "Title code without an abstract issue or a short page",
    record: { title: "EE181 Productivity after diagnosis", pages: "88-96", issue: "6", types: ["article"] },
    expect: false,
  },
  {
    label: "Conference paper type stays",
    record: { title: "A complete proceedings paper", types: ["conference-paper"], issue: "3", pages: "88-96" },
    expect: false,
  },
  {
    label: "Crossref journal-article type alone stays",
    record: { title: "A research article", types: ["journal-article"], issue: "5", pages: "100-110" },
    expect: false,
  },
  {
    label: "Single ordinary page without a title code",
    record: { title: "A short research note", issue: "6", pages: "441", types: ["article"] },
    expect: false,
  },
];

let failed = 0;
for (const scenario of SCENARIOS) {
  const actual = isConferenceAbstract(scenario.record);
  if (actual === scenario.expect) {
    console.log(`[PASS] ${scenario.label}`);
    continue;
  }
  failed += 1;
  console.log(`[FAIL] ${scenario.label}: expected ${scenario.expect}, got ${actual}`);
}

if (failed > 0) {
  console.log(`\n${failed} fixture(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${SCENARIOS.length} conference-abstract detector fixtures passed.`);
