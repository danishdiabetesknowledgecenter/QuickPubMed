/**
 * Gate 0 runner: each smoke in its own process so define() constants cannot collide.
 *
 * Run: node scripts/run-offline-smokes.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const php = process.env.MUGIN_PHP_BIN || "php";
const node = process.execPath;

const phpTests = [
  "scripts/catalog-invariants-smoke-test.php",
  "scripts/production-gates-offline-smoke-test.php",
  "scripts/public-search-form-searchform-params-smoke-test.php",
  "scripts/access-control-smoke-test.php",
  "scripts/first-party-hardening-smoke-test.php",
  "scripts/execution-slot-rate-limit-smoke-test.php",
  "scripts/process-details-security-smoke-test.php",
  "scripts/process-details-contract-smoke-test.php",
  "scripts/process-details-no-extra-work-smoke-test.php",
  "scripts/process-pipeline-emit-contract-smoke-test.php",
  "scripts/include-process-details-response-smoke-test.php",
  "scripts/process-details-parity-quick-check.php",
  "scripts/progress-text-parity-smoke-test.php",
  "scripts/unified-engine-smoke-test.php",
  "scripts/rule-engine-smoke-test.php",
  "scripts/limits-json-rule-smoke-test.php",
  "scripts/intent-context-normalize-smoke-test.php",
  "scripts/query-overrides-smoke-test.php",
  "scripts/cached-freetext-queries-smoke-test.php",
  "scripts/semantic-query-fallback-smoke-test.php",
  "scripts/result-ranking-passthrough-smoke-test.php",
  "scripts/search-flow-searchform-api-parity-smoke-test.php",
  "scripts/validation-diagnostics-parity-smoke-test.php",
  "scripts/rerank-diagnostics-parity-smoke-test.php",
  "scripts/pubmed-translation-fallback-smoke-test.php",
  "scripts/catalog-semantic-intent-seed-smoke-test.php",
  "scripts/topic-signal-fairness-smoke-test.php",
  "scripts/openalex-fallback-parity-smoke-test.php",
  "scripts/phase1-translation-unify-smoke-test.php",
  "scripts/phase2-query-plan-unify-smoke-test.php",
  "scripts/phase2-real-limits-sourcefilters-check.php",
  "scripts/phase3-mesh-validation-smoke-test.php",
  "scripts/phase4-lexical-rescue-smoke-test.php",
  "scripts/phase6-pubmed-context-wiring-smoke-test.php",
  "scripts/phase6-llm-source-query-wiring-smoke-test.php",
  "scripts/phase7-source-prefetch-smoke-test.php",
  "scripts/llm-provider-switch-smoke-test.php",
];

const nodeTests = [
  "scripts/unified-frontend-engine-smoke-test.mjs",
  "scripts/searchform-url-target-smoke-test.mjs",
  "scripts/process-details-adapter-smoke-test.mjs",
  "scripts/summary-citations-smoke-test.js",
  "scripts/verify-mugin-invariants.mjs",
];

const env = {
  ...process.env,
  MUGIN_SKIP_LIVE_SMOKES: process.env.MUGIN_SKIP_LIVE_SMOKES || "1",
};

function runOne(bin, rel) {
  const started = Date.now();
  const result = spawnSync(bin, [path.join(root, rel)], {
    cwd: root,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const elapsed = Date.now() - started;
  const ok = result.status === 0;
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status}  ${rel}  (${elapsed} ms)`);
  if (!ok) {
    const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
    if (output) {
      console.log(output.split("\n").slice(-40).join("\n"));
    }
    if (result.error) {
      console.log(String(result.error));
    }
  }
  return ok;
}

let failed = 0;
for (const rel of phpTests) {
  if (!runOne(php, rel)) {
    failed += 1;
  }
}
for (const rel of nodeTests) {
  if (!runOne(node, rel)) {
    failed += 1;
  }
}

const total = phpTests.length + nodeTests.length;
if (failed > 0) {
  console.error(`\n${failed}/${total} offline smoke(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${total} offline smokes passed.`);
