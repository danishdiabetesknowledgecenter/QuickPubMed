import { readFile } from "node:fs/promises";

function assert(condition, message) {
  console.log(`${condition ? "PASS" : "FAIL"}: ${message}`);
  if (!condition) process.exit(1);
}

const [searchForm, unifiedEndpoint, publicEndpoint] = await Promise.all([
  readFile(new URL("../src/components/SearchForm.vue", import.meta.url), "utf8"),
  readFile(new URL("../backend/api/UnifiedSearch.php", import.meta.url), "utf8"),
  readFile(new URL("../public-api/v1/search.php", import.meta.url), "utf8"),
]);

assert(
  /isUnifiedEngineActive\(\)\s*\{[\s\S]*?return true;[\s\S]*?\}/.test(searchForm),
  "SearchForm is permanently bound to the unified engine"
);
assert(
  searchForm.includes('/api/UnifiedSearch.php'),
  "SearchForm calls the first-party unified endpoint"
);
assert(
  searchForm.includes('mode: this.searchWithAI === true ? "auto" : "none"'),
  "SearchForm forwards the AI translation mode to the shared engine"
);
assert(
  unifiedEndpoint.includes("qpmPublicSearchRunSearch($request, $progressCallback)"),
  "First-party endpoint uses qpmPublicSearchRunSearch"
);
assert(
  publicEndpoint.includes("qpmPublicSearchRunSearch($request, $progressCallback)"),
  "Public API endpoint uses qpmPublicSearchRunSearch"
);

console.log("\nUnified frontend/API engine invariant passed.");
