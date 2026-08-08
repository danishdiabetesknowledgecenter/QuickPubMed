import { adaptUnifiedProcessDetails } from "../src/utils/processDetailsAdapter.js";

function assert(condition, label) {
  console.log(`${condition ? "PASS" : "FAIL"}: ${label}`);
  if (!condition) process.exit(1);
}

const adapted = adaptUnifiedProcessDetails({
  version: "1",
  sourceQueryDetails: [
    {
      source: "pubmed",
      query: "diabetes[tiab]",
      request: { term: "diabetes[tiab]", retmax: 25 },
      requestMeta: { role: "pubmedBestMatchSource" },
      response: { candidateCount: 10, totalAvailable: 100 },
      context: "diabetes",
    },
    {
      source: "pubmed",
      query: "diabetes[tiab]",
      response: { candidateCount: 10 },
    },
  ],
  processStepDetails: [
    {
      stepId: "prepare",
      payload: {
        input: "diabetes",
        selectedSources: ["pubmed"],
        pageSize: 25,
        searchWithAI: true,
      },
      context: "",
    },
    {
      stepId: "semanticIntent",
      payload: { detectedConcepts: ["diabetes"], coreQuery: "diabetes" },
      context: "",
    },
    {
      stepId: "finalizeRender",
      payload: { renderedCount: 25, totalCount: 100, page: 1, pageSize: 25 },
      context: "",
    },
    {
      stepId: "finalizeCollect",
      payload: { candidateCount: 40, pmidCandidateCount: 30, doiCandidateCount: 20 },
      context: "",
    },
  ],
});

assert(adapted.sourceQueryDetails.length === 1, "Source details are deduped by source|query");
assert(adapted.processStepDetails.length === 3, "intent(+prepare) + folded collect→rerank + folded render→finalRerank");
const intent = adapted.processStepDetails.find((entry) => entry.stepId === "semanticIntent");
assert(intent?.payload?.searchBasis?.input === "diabetes", "Legacy prepare folds into semanticIntent.searchBasis");
assert(intent?.payload?.coreQuery === "diabetes", "semanticIntent payload is preserved when merging prepare");
const render = adapted.processStepDetails.find((entry) => entry.stepId === "finalRerank");
assert(render?.payload?.page === 0, "API page 1 converts to UI page 0 on folded finalRerank");
assert(render?.payload?.renderedCount === 25, "Folded finalizeRender payload is kept on finalRerank");
const collect = adapted.processStepDetails.find((entry) => entry.stepId === "rerank");
assert(collect?.payload?.candidateCount === 40, "Folded finalizeCollect payload lands on rerank");

const labeled = adaptUnifiedProcessDetails({
  version: "1",
  sourceQueryDetails: [],
  processStepDetails: [
    { stepId: "finalizeValidatePmid", payload: { orderedPmidCount: 1 }, context: "" },
    { stepId: "finalizeValidateDoiFetch", payload: { hydratedCount: 1 }, context: "" },
    { stepId: "finalRerank", payload: { endpoint: "unified-final-rerank" }, context: "" },
  ],
});
const pmidLabel = labeled.processStepDetails.find((entry) => entry.stepId === "finalizeValidatePmid")?.label;
const doiLabel = labeled.processStepDetails.find((entry) => entry.stepId === "finalizeValidateDoiFetch")?.label;
const rerankLabel = labeled.processStepDetails.find((entry) => entry.stepId === "finalRerank")?.label;
assert(pmidLabel === "PMID-validering", "PMID detail label is concrete");
assert(doiLabel === "DOI-validering", "DOI validation detail label is concrete");
assert(rerankLabel === "Slut-rerank", "Final rerank detail label is concrete");

console.log("\nAll process-details adapter smoke tests passed.");
