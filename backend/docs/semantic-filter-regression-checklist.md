# Regressionscheckliste for kanoniske semantiske filtre

Denne checkliste er en lille, fast manuel regressionssuite for den kanoniske filterarkitektur.

Den dækker de tre cases, som aktuelt giver mest sikkerhed for:

- kildeprojektion fra `limits.json`
- hybrid håndhævelse via PubMed for PMID-records
- metadata/post-validering for ikke-PMID-records
- visningsmetadata for `title` og `abstract`

Brug den som smoke-test efter ændringer i:

- `data/content/shared/limits.json`
- `src/components/SearchForm.vue`
- `src/components/DropdownWrapper.vue`
- `src/utils/semanticWordedIntent.js`
- `backend/api/SemanticScholarSearch.php`
- `backend/api/OpenAlexSearch.php`

## Forudsætninger

1. Start lokal backend: `php -S 127.0.0.1:8080 -t .`
2. Start lokal frontend: `npm run dev`
3. Find den lokale Vite-port. Eksemplerne her bruger `127.0.0.1:<vite-port>`.
4. Åbn browserens console og netværksfane.

## Case 1

`Semantic Scholar` alene + `Systematiske reviews`

URL:

```text
http://127.0.0.1:<vite-port>/entries/widgets/searchform.html?apiBase=http%3A%2F%2F127.0.0.1%3A8080%2Fbackend%2Fapi&topic=%7B%7Bhvad%20virker%20bedst%3A%20online%20eller%20digital%20patientuddannelse%3F0%7D%7D%23s&L010=L010010%23s&semanticsources=semanticscholar&advanced=false&sort=relevance&collapsed=false&pagesize=25
```

Kør:

1. Åbn URL'en.
2. Klik på `Søg`.

Bestået når console viser:

- `Skipped auto-search because URL selected non-PubMed databases`
- `SemanticIntent Request`
- `SemanticSourceRequest] semanticScholar`
- `Hard-filter validation query`
- `Excluded semantic candidates after metadata validation`
- `Display mode: hybrid reranked semantic order`

Bestået når `SemanticIntent Request` indeholder:

- `selectedLimits=["Systematic reviews"]`
- `hardFilters.publicationTypes=["systematic review","meta-analysis"]`
- `sourceFilters.semanticScholar.publicationTypes=["Review","Meta-Analysis"]`
- `postValidation.ruleIds=["systematic-review"]`
- `sourceSelection.semanticScholar=true`
- `sourceSelection.openAlex=false`

Bestået når netværk viser:

- `SemanticScholarSearch.php`
- `NlmSearch.php`
- en eller flere `NlmSummary.php`-kald

Bestået når UI viser resultater, selv om `PubMed` ikke var valgt som retrieval-kilde.

## Case 2

`OpenAlex` alene + `Systematiske reviews`

URL:

```text
http://127.0.0.1:<vite-port>/entries/widgets/searchform.html?apiBase=http%3A%2F%2F127.0.0.1%3A8080%2Fbackend%2Fapi&topic=%7B%7Bhvad%20virker%20bedst%3A%20online%20eller%20digital%20patientuddannelse%3F0%7D%7D%23s&L010=L010010%23s&semanticsources=openalex&advanced=false&sort=relevance&collapsed=false&pagesize=25
```

Kør:

1. Åbn URL'en.
2. Klik på `Søg`.

Bestået når `SemanticIntent Request` indeholder:

- `selectedLimits=["Systematic reviews"]`
- `sourceSelection.semanticScholar=false`
- `sourceSelection.openAlex=true`
- `sourceFilters.openAlex.workType=["review"]`
- `postValidation.ruleIds=["systematic-review"]`

Bestået når console viser:

- `SemanticSourceRequest] openAlex`
- `Hard-filter validation query`
- `Excluded semantic candidates after metadata validation`
- `Display mode: hybrid reranked semantic order`

Bestået når netværk viser:

- `OpenAlexSearch.php`
- `OpenAlexWorkLookup.php`
- `NlmSearch.php`
- en eller flere `NlmSummary.php`-kald

Dette bekræfter, at den samme kanoniske filtertilstand også projiceres korrekt til `OpenAlex`.

## Case 3

`Semantic Scholar` + `Systematiske reviews` + `Konferencepublikation` i avanceret søgning

URL:

```text
http://127.0.0.1:<vite-port>/entries/widgets/searchform.html?apiBase=http%3A%2F%2F127.0.0.1%3A8080%2Fbackend%2Fapi&topic=%7B%7Bhvad%20virker%20bedst%3A%20online%20eller%20digital%20patientuddannelse%3F0%7D%7D%23s&limit=L010010%23s&limit=L025020%23s&semanticsources=semanticscholar&advanced=true&sort=relevance&collapsed=false&pagesize=25
```

Kør:

1. Åbn URL'en.
2. Bekræft at begge afgrænsninger er til stede i formularens state.
3. Klik på `Søg`.

Bestået når `SemanticIntent Request` indeholder:

- `selectedLimits=["Systematic reviews","Conference publication"]`
- `hardFilters.sourceFormats=["conference"]`
- `postValidation.ruleIds=["systematic-review","source-format-conference"]`
- `sourceFilters.semanticScholar.publicationTypes=["Review","Meta-Analysis","Conference"]`
- `sourceFilters.openAlex.sourceType=["conference"]`

Bestået når console viser:

- `SemanticSourceRequest] semanticScholar`
- `Hard-filter validation query`
- `Excluded semantic candidates after metadata validation`
- `Display mode: hybrid reranked semantic order`

Bestået når netværk viser:

- `SemanticScholarSearch.php`
- `OpenAlexWorkLookup.php`
- en eller flere `NlmSummary.php`-kald
- `NlmSearch.php`

Vigtig forventning:

- `Hard-filter validation query` må gerne kun indeholde systematic-review-delen.
- Det er forventet, fordi `L025020` har tomme `searchStrings` i `limits.json`.
- `Konferencepublikation` håndhæves derfor via metadata og `postValidation.rules`, ikke via en ekstra PubMed-querystreng.

## Supplerende display-check

Brug resultaterne fra case 1.

1. Find et resultat uden `Åbn i PubMed`, men med `Vis abstract`.
2. Åbn abstractet.

Bestået når:

- abstractet faktisk vises i UI'et
- resultatet stadig kan være et ikke-PMID-resultat

Det er en hurtig smoke-test af den særskilte visningspolitik:

- `PubMed` først
- `Semantic Scholar` derefter
- `OpenAlex` kun som fallback til visning

## Reranking signals

Dette afsnit dækker det hybride rerank-lag (RRF + kvalitetssignaler) og enrichment-sektionen `04b`. Brug som smoke-test efter ændringer i:

- `src/utils/semanticReranking.js`
- `backend/api/ICiteLookup.php`
- `backend/api/OpenAlexAuthorityLookup.php`
- `backend/api/SemanticFinalRerank.php`
- `backend/config/config.example.php` og `backend/config/config.php` under `QPM_RERANK_CONFIG`

### Baseline-parity (default config)

Kør `node scripts/verify-rerank-parity.js`.

Bestået når:

- Scriptet udskriver `Rerank parity check passed.` og afslutter med exit-kode 0.
- Neutral config giver identisk rækkefølge og `combinedScore` for de indbyggede scenarier.
- Retraction-filter-mode fjerner nøjagtigt én kandidat i test-scenariet, og `enrichmentSummary.filteredByRetraction` er 1.
- Retraction-penalty-mode med `retractionPenalty=0.1` degraderer den retracted kandidat under den clean.
- RCR-cascade-scenariet placerer klinisk high-RCR-record over low-RCR-record selv ved højere FWCI på sidstnævnte.
- Topic-overlap-scenariet placerer den emne-matchende kandidat øverst og eksponerer `contributions[].matches`.

### Enrichment-sektion (search-flow-debug)

1. Åbn case 1 fra denne checkliste og aktivér `debugSearchFlow=true`.
2. I browserens console-log skal `04b Enrichment` dukke op før `05 Merge and rerank`.

Bestået når console viser:

- `[Enrichment] iCite lookup completed.` med `requestedPmids`, `records`, `withRcr`, `withClinical`.
- `[Enrichment] Authority lookup completed.` med `requestedAuthors`, `requestedSources`, `attachedAuthors`, `attachedJournals` (kan være 0 hvis kandidaterne mangler OpenAlex-ids — det er tilladt).
- Ved simuleret nedbrud (fx tilføj en midlertidig error-throw i `enrichSemanticSourceResultsWithICite`) logges `iCite enrichment failed` men rerank fortsætter og resultater vises.

### Contributions og scoreBreakdown

Med default config (alle neutrale):

- `contributions[]` må kun indeholde `pmidBonus`, `weightedRrfRank`, `overlapBonus` og `sourceScoreTieBreaker` — præcis som før enrichment-laget blev indført.
- `scoreBreakdown.citationImpactMultiplier`, `authorityMultiplier`, `retractionMultiplier` og `qualityMultiplier` må alle være `1.0`.
- `scoreBreakdown.additiveQualityBonus` må være `0`.

Med tuned config (fx `citationImpactClamp=[0.9, 1.25]`, `retractionAction='penalty'`, `recencyHalfLifeYears=7`, `recencyBonusMax=30`):

- Enabled signaler må dukke op som tydelige typer i `contributions[]` (`citationImpactMultiplier`, `recencyBonus`, `retractionImpact`, osv.).
- `scoreBreakdown.qualityMultiplier` må afvige fra `1.0` kun hvis kandidaten har gyldigt signal.

### DOI-only iCite-fallback

1. Vælg en case hvor OpenAlex returnerer en DOI-only kandidat.
2. Tjek `candidate.enriched`.

Bestået når:

- `rcr`, `nihPercentile`, `isClinical`, `citedByClin` er `null` for DOI-only records.
- `fwci` eller `citedByCount` alligevel kan udfylde citation-impact-multiplier via fallback-kaskaden.

### LLM-rerank beriget kontekst

Med `QPM_SEMANTIC_LLM_RERANK_CONFIG.enabled=true` og en semantisk case:

1. Åbn netværksfanen og find POST-requesten til `SemanticFinalRerank.php`.
2. Inspicer request body.

Bestået når `candidates[*]` rummer de berigede felter (`fwci`, `rcr`, `citationCount`, `isRetracted`, `isClinical`, `pubTypes`, `venue`, `year`) når data er tilgængelige, og LLM'ens respons stadig er en gyldig permutation af alle ids.

## Hvis en case fejler

Start med at sammenholde fejlen med disse docs:

- `backend/docs/search-flow-readme.md`
- `backend/docs/semantic-source-filters.md`
- `backend/docs/semantic-doi-only-rules.md`
