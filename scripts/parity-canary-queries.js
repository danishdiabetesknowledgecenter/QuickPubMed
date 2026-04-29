/**
 * Canary queries for LLM/query-pipeline parity checks.
 *
 * Used to detect regressions when the semantic intent prompt, MeSH validator,
 * or query plan builder changes. Each entry contains a realistic free-text
 * input and the invariants the pipeline MUST keep true.
 *
 * Usage (manual):
 *   - Import into a dev harness or paste the query into the production UI.
 *   - After each change to prompts/schema/plan builder, walk through the list
 *     and ensure the expectations still hold. Deviations should be investigated
 *     before shipping.
 *
 * This file is intentionally data-only (no runtime behaviour changes).
 */

export const parityCanaryQueries = [
  {
    id: "canary-01-diabetes-type2-treatment",
    input: "Nyere behandlinger af type 2-diabetes",
    language: "dk",
    expectations: {
      intentTypeOneOf: ["therapy", "treatment", "comparison", "overview"],
      mustContainConcepts: ["diabetes", "type 2"],
      minConfidence: 0.5,
      requiresPubmedMesh: true,
    },
  },
  {
    id: "canary-02-screen-time-children",
    input: "Hvor lang tid må børn og unge bruge mobiltelefoner og andre skærme?",
    language: "dk",
    expectations: {
      intentTypeOneOf: ["guideline", "recommendation", "overview"],
      mustContainConcepts: ["screen time", "children"],
      minConfidence: 0.4,
      allowFallback: true,
    },
  },
  {
    id: "canary-03-covid-long",
    input: "Long COVID symptoms in adolescents",
    language: "en",
    expectations: {
      intentTypeOneOf: ["prognosis", "overview", "symptom"],
      mustContainConcepts: ["long covid", "adolescents"],
      minConfidence: 0.5,
    },
  },
  {
    id: "canary-04-aspirin-primary-prevention",
    input: "Aspirin til primær forebyggelse af hjerte-kar-sygdom hos ældre",
    language: "dk",
    expectations: {
      intentTypeOneOf: ["prevention", "therapy", "comparison"],
      mustContainConcepts: ["aspirin", "primary prevention", "elderly"],
      minConfidence: 0.5,
      requiresPubmedMesh: true,
    },
  },
  {
    id: "canary-05-ssri-pregnancy",
    input: "SSRI under graviditet og risiko for misdannelser",
    language: "dk",
    expectations: {
      intentTypeOneOf: ["etiology", "risk", "overview"],
      mustContainConcepts: ["ssri", "pregnancy"],
      minConfidence: 0.5,
    },
  },
  {
    id: "canary-06-antibiotics-otitis-children",
    input: "Antibiotika til otitis media hos børn",
    language: "dk",
    expectations: {
      intentTypeOneOf: ["therapy", "treatment", "overview"],
      mustContainConcepts: ["antibiotics", "otitis media", "children"],
      minConfidence: 0.5,
      requiresPubmedMesh: true,
    },
  },
  {
    id: "canary-07-breast-cancer-screening",
    input: "Mammography screening effectiveness in women aged 40-49",
    language: "en",
    expectations: {
      intentTypeOneOf: ["screening", "prevention", "overview"],
      mustContainConcepts: ["mammography", "screening", "women"],
      minConfidence: 0.5,
    },
  },
  {
    id: "canary-08-semaglutide-obesity",
    input: "Semaglutide versus liraglutide for weight loss in adults with obesity",
    language: "en",
    expectations: {
      intentTypeOneOf: ["comparison", "therapy", "treatment"],
      mustContainConcepts: ["semaglutide", "liraglutide", "obesity"],
      minConfidence: 0.5,
    },
  },
  {
    id: "canary-09-statin-primary-prevention",
    input: "Statin primary prevention guidelines",
    language: "en",
    expectations: {
      intentTypeOneOf: ["guideline", "prevention", "overview"],
      mustContainConcepts: ["statin", "primary prevention"],
      minConfidence: 0.5,
      requiresPubmedMesh: true,
    },
  },
  {
    id: "canary-10-depression-adolescents-cbt",
    input: "Kognitiv adfærdsterapi ved depression hos unge",
    language: "dk",
    expectations: {
      intentTypeOneOf: ["therapy", "treatment", "overview"],
      mustContainConcepts: ["cognitive behavioral therapy", "depression", "adolescents"],
      minConfidence: 0.5,
    },
  },
];

export default parityCanaryQueries;
