// Phase 3 parity gate: diffs the JS baseline (scripts/fixtures/rerank-parity-baseline-js.json)
// against the PHP port's output (scripts/fixtures/rerank-parity-baseline-php.json).
//
// Per the plan: compares (a) final candidate order (what actually matters for
// search quality) and (b) combinedScore within a small tolerance (1e-4), not
// bit-for-bit float equality.
//
// Run: node scripts/capture-js-baseline.js && php scripts/rerank-parity-harness.php > scripts/fixtures/rerank-parity-baseline-php.json && node scripts/compare-rerank-parity.js

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCORE_TOLERANCE = 1e-4;

const jsBaseline = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "rerank-parity-baseline-js.json"), "utf8"));
const phpBaseline = JSON.parse(readFileSync(path.join(__dirname, "fixtures", "rerank-parity-baseline-php.json"), "utf8"));

let totalScenarios = 0;
let passedScenarios = 0;
const failures = [];

for (const [scenarioId, jsResult] of Object.entries(jsBaseline.results)) {
  totalScenarios += 1;
  const phpResult = phpBaseline.results[scenarioId];
  if (!phpResult) {
    failures.push({ scenarioId, reason: "Missing from PHP output" });
    continue;
  }

  const scenarioFailures = [];

  // 1. Order (by identifying key: pmid, else doi, else title) must match exactly.
  const jsKeys = jsResult.order.map((c) => c.pmid || c.doi || c.title);
  const phpKeys = phpResult.order.map((c) => c.pmid || c.doi || c.title);
  if (JSON.stringify(jsKeys) !== JSON.stringify(phpKeys)) {
    scenarioFailures.push(`Order mismatch:\n  JS:  ${JSON.stringify(jsKeys)}\n  PHP: ${JSON.stringify(phpKeys)}`);
  }

  // 2. combinedScore within tolerance, per matching candidate.
  const phpByKey = new Map(phpResult.order.map((c) => [c.pmid || c.doi || c.title, c]));
  for (const jsCandidate of jsResult.order) {
    const key = jsCandidate.pmid || jsCandidate.doi || jsCandidate.title;
    const phpCandidate = phpByKey.get(key);
    if (!phpCandidate) continue; // already reported as order mismatch
    const diff = Math.abs((jsCandidate.combinedScore ?? 0) - (phpCandidate.combinedScore ?? 0));
    if (diff > SCORE_TOLERANCE) {
      scenarioFailures.push(
        `combinedScore mismatch for "${key}": JS=${jsCandidate.combinedScore} PHP=${phpCandidate.combinedScore} (diff=${diff})`
      );
    }
    if (jsCandidate.pubTypeTier !== phpCandidate.pubTypeTier) {
      scenarioFailures.push(
        `pubTypeTier mismatch for "${key}": JS=${jsCandidate.pubTypeTier} PHP=${phpCandidate.pubTypeTier}`
      );
    }
  }

  // 3. filteredCount must match (retraction-filter behavior).
  if (jsResult.filteredCount !== phpResult.filteredCount) {
    scenarioFailures.push(`filteredCount mismatch: JS=${jsResult.filteredCount} PHP=${phpResult.filteredCount}`);
  }

  // 4. rerankMode must match.
  if (jsResult.rerankMode !== phpResult.rerankMode) {
    scenarioFailures.push(`rerankMode mismatch: JS=${jsResult.rerankMode} PHP=${phpResult.rerankMode}`);
  }

  if (scenarioFailures.length === 0) {
    passedScenarios += 1;
  } else {
    failures.push({ scenarioId, description: jsResult.description, reasons: scenarioFailures });
  }
}

console.log(`\nParity check: ${passedScenarios}/${totalScenarios} scenarios passed.\n`);
if (failures.length > 0) {
  console.log("FAILURES:\n");
  for (const failure of failures) {
    console.log(`--- ${failure.scenarioId} ---`);
    if (failure.description) console.log(failure.description);
    if (failure.reason) console.log(failure.reason);
    if (failure.reasons) failure.reasons.forEach((r) => console.log(r));
    console.log("");
  }
  process.exitCode = 1;
} else {
  console.log("All scenarios match. PHP rerank engine has parity with the JS engine for this fixture set.");
}
