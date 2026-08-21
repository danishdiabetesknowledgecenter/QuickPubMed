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
  unifiedEndpoint.includes("muginPublicSearchRunSearch($request, $progressCallback)"),
  "First-party endpoint uses muginPublicSearchRunSearch"
);
assert(
  publicEndpoint.includes("muginPublicSearchRunSearch($request, $progressCallback)"),
  "Public API endpoint uses muginPublicSearchRunSearch"
);

const plannerMatch = searchForm.match(
  /getPlannedSemanticLoadingProcessStepIds\(\)\s*\{[\s\S]*?return stepIds;\s*\}/
);
assert(Boolean(plannerMatch), "SearchForm pre-plans process steps from a dedicated planner");
const planner = plannerMatch[0];
assert(
  planner.includes('stepIds.push("semanticIntent")'),
  "Planner includes semanticIntent when that step is known to run"
);
assert(
  planner.includes('stepIds.push("searchString")'),
  "Planner includes searchString when PubMed freetext translation will run"
);
assert(
  planner.includes('stepIds.push("finalizeHydrate")'),
  "Planner includes hydrate, which always runs after retrieval"
);
assert(
  !planner.includes("semanticQuery"),
  "Planner does not pre-plan semanticQuery"
);
assert(
  !planner.includes('"mesh"'),
  "Planner does not pre-plan mesh before searchString has decided"
);
assert(
  !planner.includes("finalizeValidatePmid") && !planner.includes("finalizeValidateDoiFetch"),
  "Planner does not pre-plan validation steps before candidates exist"
);
assert(
  !planner.includes('stepIds.push("finalRerank")') && !planner.includes('"finalRerank"'),
  "Planner does not pre-plan finalRerank before result count is known"
);
assert(
  !searchForm.includes("ensureMeshProcessStepDetailFromSearchString"),
  "SearchForm does not invent a mesh process step"
);
assert(
  !searchForm.includes("getSemanticQueryProcessLabel"),
  "SearchForm does not interpolate semanticQuery labels"
);
assert(
  searchForm.includes("context?.resolvedQueries"),
  "SearchForm applies streamed resolvedQueries to the search-string panel"
);
assert(
  searchForm.includes("applyResolvedQueriesToSearchStringDisplay"),
  "SearchForm has a dedicated helper for early PubMed string display"
);
assert(
  !searchForm.includes(
    "if (!generated && (this.draftSourceQueries?.[key] === undefined || this.draftSourceQueries?.[key] === null))"
  ),
  "Selected database search-string headers stay visible before queries arrive"
);
assert(
  searchForm.includes("seedPendingSourceSearchStringDisplays"),
  "SearchForm seeds selected database fields with freetext until resolved queries arrive"
);
assert(
  searchForm.includes(':pending-source-keys="pendingSourceSearchStringDisplay"'),
  "SearchForm marks pending source search-string fields for the live-translation spinner"
);
assert(
  searchForm.includes(':translating-label="searchLoadingStatusText"'),
  "SearchForm reuses the process status text inside pending search-string fields"
);

const wordedSearchString = await readFile(
  new URL("../src/components/WordedSearchString.vue", import.meta.url),
  "utf8"
);
assert(
  wordedSearchString.includes("pendingSourceKeys"),
  "WordedSearchString accepts pending source keys"
);
assert(
  wordedSearchString.includes("sourceQueryTranslatingText"),
  "WordedSearchString shows the live-translation process label in pending fields"
);
assert(
  wordedSearchString.includes("bx bx-pencil"),
  "WordedSearchString uses a pencil icon to enter search-string edit mode"
);
assert(
  searchForm.includes('labelKey: "searchStringPubmedTopics"'),
  "WordedSearchString splits source strings into a topics part"
);
assert(
  searchForm.includes('labelKey: "searchStringPubmedLimits"'),
  "WordedSearchString splits source strings into a limits part"
);
assert(
  searchForm.includes("searchStringSourceLimitsHint"),
  "Search string limits include a per-database info hint"
);
assert(
  wordedSearchString.includes("sourceQueryFieldInfo"),
  "WordedSearchString shows an info icon for source limits"
);
assert(
  searchForm.includes("getSourceLimitGroupsForDisplay"),
  "SearchForm builds per-database limit groups for Vis søgestrenge"
);
assert(
  searchForm.includes("getSourceSearchLinkFilters"),
  "SearchForm attaches source filters to Vis søgestrenge links"
);
assert(
  /getDisplayLimitGroups\(\)\s*\{[\s\S]*?searchDisplayLimitDropdowns/.test(searchForm),
  "Vis søgestrenge limit pills omit the Databaser group"
);
assert(
  wordedSearchString.includes("mugin_sourceSearchStringLimits"),
  "WordedSearchString renders source limits as worded pills"
);
assert(
  wordedSearchString.includes("sourceLimitGroupTooltip"),
  "WordedSearchString shows actual limit values on pill hover"
);
assert(
  wordedSearchString.includes('params.append("year[0]"'),
  "Semantic Scholar source links send year as year[0]/year[1]"
);
assert(
  wordedSearchString.includes("open_access.is_oa:true"),
  "OpenAlex source links include open_access.is_oa when selected"
);
assert(
  wordedSearchString.includes("sourceSearchLinkLimitsHint"),
  "Source search links explain that not all limits can be sent"
);
assert(
  searchForm.includes('parts.push("is_oa")'),
  "SearchForm hover shows the OpenAlex is_oa filter value"
);
assert(
  /limitAppliesToSemanticSource\([\s\S]*?return Array\.isArray\(years\) && years\.length > 0;/.test(
    searchForm
  ),
  "Health Evidence year limits appear on semantic sources without a bare y_N[Filter] string"
);
assert(
  wordedSearchString.includes("mugin_searchStringText"),
  "WordedSearchString shows search strings as ordinary text until edited"
);
assert(
  wordedSearchString.includes('class="mugin_searchStringTextareaSpinner mugin_inlineBlock"'),
  "WordedSearchString shows the live-translation spinner on the right of pending fields"
);
assert(
  wordedSearchString.includes('this.$emit("update:query"'),
  "WordedSearchString emits edited source queries"
);
assert(
  wordedSearchString.includes("flushSourceQueryEdits()"),
  "WordedSearchString can flush live textarea edits before search"
);
assert(
  searchForm.includes('@update:query="onSourceSearchQueryUpdate"'),
  "SearchForm stores edited search strings from Vis søgestrenge"
);
assert(
  searchForm.includes("flushSourceSearchStringDraftsFromDom()"),
  "SearchForm flushes live search-string edits before snapshotting overrides"
);

const searchMethodMatch = searchForm.match(
  /async search\(\)\s*\{[\s\S]*?\n      async searchMore\(\)/
);
assert(Boolean(searchMethodMatch), "SearchForm search() method is present");
const searchMethod = searchMethodMatch[0];
assert(
  searchMethod.indexOf("this.flushSourceSearchStringDraftsFromDom()") !== -1,
  "search() flushes live textarea edits before snapshotting overrides"
);
assert(
  searchMethod.indexOf("this.flushSourceSearchStringDraftsFromDom()") <
    searchMethod.indexOf("this.pendingQueryOverrideSnapshot = this.getQueryOverridesForSearch()"),
  "Live textarea edits are flushed before the override snapshot"
);
assert(
  searchMethod.indexOf("this.pendingQueryOverrideSnapshot = this.getQueryOverridesForSearch()") !==
    -1,
  "search() snapshots edited search strings before starting the engine run"
);
assert(
  searchMethod.indexOf("this.pendingQueryOverrideSnapshot = this.getQueryOverridesForSearch()") <
    searchMethod.indexOf("await this.runUnifiedEngineSearch(isCancelled)"),
  "Edited-search-string snapshot is taken before runUnifiedEngineSearch"
);

const runUnifiedMatch = searchForm.match(
  /async runUnifiedEngineSearch\(isCancelled\)\s*\{[\s\S]*?\n      async runUnifiedEngineSearchMore\(isCancelled\)/
);
assert(Boolean(runUnifiedMatch), "SearchForm runUnifiedEngineSearch() method is present");
const runUnified = runUnifiedMatch[0];
assert(
  runUnified.includes("this.buildUnifiedSearchRequestPayload("),
  "runUnifiedEngineSearch builds the unified request payload"
);
assert(
  runUnified.includes("this.pendingQueryOverrideSnapshot"),
  "runUnifiedEngineSearch sends the snapshot of edited search strings"
);
assert(
  runUnified.indexOf("this.buildUnifiedSearchRequestPayload(") <
    runUnified.indexOf("this.seedPendingSourceSearchStringDisplays("),
  "Request payload is built before freetext is seeded into search-string fields"
);
assert(
  searchForm.includes("payload.cachedFreetextQueries = cachedFreetextQueries"),
  "Translated freetext is sent as cachedFreetextQueries on later searches"
);
assert(
  searchForm.includes("payload.standardString = standardStringPayload"),
  "SearchForm sends standardString options to the unified engine"
);
assert(
  searchForm.includes("captureSessionFreetextQueries("),
  "SearchForm stores the translated freetext after a successful search"
);
assert(
  /editForm\(\)\s*\{[\s\S]*?this\.resetQueryOverrideState\(\)/.test(searchForm) === false,
  "editForm keeps translated freetext and edited search strings in the session"
);
assert(
  searchForm.includes("this.sessionFreetextQueries = null"),
  "Reset clears the session freetext translation cache"
);
assert(
  searchForm.includes("sessionFreetextInputKey(newValue)"),
  "Freetext session cache is invalidated from the original custom input, not catalog checkbox changes"
);
assert(
  searchForm.includes("String(cached[source] || \"\").trim() !== \"\""),
  "Planned translation steps are skipped when the session still has a translated freetext string"
);

const seedPendingMatch = searchForm.match(
  /seedPendingSourceSearchStringDisplays\(placeholderText\)\s*\{[\s\S]*?\n      applyResolvedQueriesToSearchStringDisplay\(/
);
assert(Boolean(seedPendingMatch), "SearchForm seeds pending search-string displays");
const seedPending = seedPendingMatch[0];
assert(
  seedPending.includes("this.pendingQueryOverrideSnapshot"),
  "Pending-field seeding reads the edited-search-string snapshot"
);
assert(
  seedPending.includes("this.isSourceQueryDirty(key)"),
  "Pending-field seeding does not overwrite a dirty edited search string"
);
assert(
  /if \(override \|\| this\.isSourceQueryDirty\(key\)\)/.test(seedPending),
  "Pending-field seeding keeps snapshot overrides visible instead of replacing them with freetext"
);
assert(
  searchForm.includes('payload.translationFallback === true'),
  "SearchForm treats searchString translationFallback as a process warning"
);
assert(
  searchForm.includes('messageKey: "pubmedTranslationFallbackWarning"'),
  "SearchForm maps translation fallback to pubmedTranslationFallbackWarning"
);

const [translations, limitsJson] = await Promise.all([
  readFile(new URL("../src/assets/content/translations.js", import.meta.url), "utf8"),
  readFile(new URL("../data/content/shared/limits.json", import.meta.url), "utf8"),
]);
assert(
  translations.includes("pubmedTranslationFallbackWarning"),
  "translations.js includes the PubMed translation-fallback warning"
);
assert(
  translations.includes("searchStringPubmedTopics"),
  "translations.js includes the PubMed topics search-string label"
);
assert(
  translations.includes("editSearchString"),
  "translations.js includes the edit-search-string label"
);
assert(
  translations.includes("sourceSearchLinkLimitsHint"),
  "translations.js includes the source-link limits hint"
);

const limitsCatalog = JSON.parse(limitsJson);
const flattenLimitNodes = (nodes = []) =>
  (Array.isArray(nodes) ? nodes : []).flatMap((node) => [
    node,
    ...flattenLimitNodes(node?.groups || node?.children || []),
  ]);
const limitNodes = flattenLimitNodes(limitsCatalog?.limits || []);
const rctLimit = limitNodes.find((node) => node?.id === "L020050");
const oaLimit = limitNodes.find((node) => node?.id === "L090020");
assert(
  Array.isArray(rctLimit?.semanticConfig?.sourceFilters?.semanticScholar?.publicationTypes) &&
    rctLimit.semanticConfig.sourceFilters.semanticScholar.publicationTypes.includes("ClinicalTrial"),
  "RCT limit maps to Semantic Scholar ClinicalTrial"
);
assert(
  rctLimit?.semanticConfig?.sourceFilters?.elicit?.typeTags?.includes("RCT"),
  "RCT limit still maps to Elicit RCT"
);
assert(
  oaLimit?.semanticConfig?.sourceFilters?.openAlex?.isOa === true,
  "Open access limit maps to OpenAlex isOa"
);
assert(
  oaLimit?.semanticConfig?.sourceFilters?.elicit?.hasPdf === true,
  "Open access limit still maps to Elicit hasPdf"
);

console.log("\nUnified frontend/API engine invariant passed.");
