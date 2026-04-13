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

## Hvis en case fejler

Start med at sammenholde fejlen med disse docs:

- `backend/docs/search-flow-readme.md`
- `backend/docs/semantic-source-filters.md`
- `backend/docs/semantic-doi-only-rules.md`
