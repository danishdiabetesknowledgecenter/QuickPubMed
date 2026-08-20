# Public Search API Parity

## Mål

Public Search API skal levere samme logiske slutrækkefølge som webudgaven, når de samme kanoniske inputs og samme upstream-data ligger til grund.

## Samme orkestrator

Web og public API deler allerede den samme kanoniske backend-pipeline:

- Web: `SearchForm.vue` → `backend/api/UnifiedSearch.php` → `muginPublicSearchRunSearch()`
- Public API: `public-api/v1/search.php` → `muginPublicSearchRunSearch()`

Den gamle browser-side JS-pipeline i `SearchForm`/`DropdownWrapper` er dormant og vælges ikke ved runtime.

## Hvad der er fælles nu

På tværs af web (`UnifiedSearch.php`) og public API (`/v1/search`):

- samme normaliserede requestmodel for `GET` og `POST`
- samme PubMed-baserede PMID-validering
- samme DOI-hydrering via OpenAlex
- samme side-semantik: sideudsnit efter retrieval, fusion og validering
- samme valgfri LLM-slutrerank-regel for første side

## Hybrid ranking og `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED`

Den fulde hybride kvalitetssignal-rangering (klassifikation, iCite/OpenAlex Authority-enrichment, `pubTypeTier`, recency, citation impact, data-quality, DOI-only post-validering, fulde `focus`-profiler) kører i PHP **kun** når:

```php
define('MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED', true);
```

Når flaget er `false`, bruges den ældre RRF-only-sti i `muginPublicSearchRunSearch()` — stadig samme orkestrator for web og API, men uden de fulde hybrid-profiler.

## `matchesWebOrdering`

`order.matchesWebOrdering` spejler kun `MUGIN_PUBLIC_API['matchesWebOrderingByDefault']` (default `false`). Det er et konfigurationssignal til klienter — ikke et bevis for, at web stadig kører en anden pipeline.

Sæt `matchesWebOrderingByDefault => true`, når deploymenten eksplicit vil erklære ordningsparitet (typisk med unified engine enabled og ens rerank-config).

## Residuale risici

Selv med samme pipeline findes der stadig residual risiko:

- upstream-kilder ændrer resultater over tid
- upstream-kilder kan være delvist utilgængelige
- OpenAI-baseret oversættelse kan variere; LLM-slutrerank caches på payload-hash (`MUGIN_SEMANTIC_LLM_RERANK_CONFIG.cacheTtlSeconds`), så UnifiedSearch og public API genbruger samme permutation ved ens kandidater
- metadata for DOI-only resultater kan være ufuldstændige
- enrichment-kilder (NIH iCite, OpenAlex authority) kan fejle eller returnere delvise data; rerank fortsætter graceful uden de manglende signaler, men rækkefølgen kan afvige fra kald til kald
- forskellig værdi af `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED` mellem miljøer giver forskellig ranking-dybde

## Kvalitetssignaler og konfiguration

Når unified engine er enabled, bruger rangeringen den hybride formel:

```
combinedScore = (baseScore + additiveQualityBonus) * qualityMultiplier
```

Alle hybride kvalitetssignaler er styret af `MUGIN_RERANK_CONFIG` i `backend/config/config.php` og defaulter til neutrale værdier. Parity forudsætter **ens `MUGIN_RERANK_CONFIG`** og ens `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED` i begge miljøer.

Signaler der indgår i multiplikatoren og bonuserne:

- `citationImpactMultiplier` — RCR (iCite) → FWCI (OpenAlex) → influentialCitationCount (S2) → citedByCount
- `authorityMultiplier` — forfatter-h-index og journal 2yr_mean_citedness (default disabled)
- `retractionMultiplier` — styret af `retractionAction` (`none`/`penalty`/`filter`)
- `dataQualityMultiplier` *(M2)* — nedgraderer records uden abstract/forfatter/årstal via `dataQualityPenalties`
- `pubTypeTierBonus` *(M2)*, `recencyBonus`, `oaBonus`, `clinicalBonus`, `topicOverlapBonus` — additive bidrag (`topicOverlapBonus` er fair: manglende emner = 0, aldrig straf; DOI-only OA/S2-emner tæller)

`pubTypeTierBonus` afhænger af den deterministiske klassifikator i `backend/app/semantic-quality-lib.php` (PHP-port af `pubTypeClassifier.js`), som bl.a. læser `guidelinePublisherAllowList` fra `data/content/shared/limits.json` og `MUGIN_RERANK_CONFIG`.

Se `backend/docs/search-flow-readme.md` og `backend/config/config.example.php` for fulde detaljer om vægte og profilforslag.

## Teststrategi

Anbefalet paritetscheck:

1. Kør samme query som `POST /v1/search` og via webudgaven (UnifiedSearch).
2. Sammenlign `results[*].resultKey` i rækkefølge.
3. Gentag for:
   - kun `pubmed`
   - `pubmed + semanticScholar`
   - `pubmed + openAlex + semanticScholar`
   - `relevance`
   - `date_desc`
   - `date_asc`
   - første side og senere sider
4. Bekræft `MUGIN_UNIFIED_SEARCH_ENGINE_ENABLED=true` i det miljø, I tester hybrid-ranking i.

Nyttige scripts: `scripts/unified-engine-smoke-test.php`, `scripts/rerank-parity-harness.php`, `scripts/compare-rerank-parity.js`.

## GET vs POST

`GET /v1/search` og `POST /v1/search` bruger samme kanoniske backend-requestmodel. Derfor skal samme enkle request give samme:

- `resolvedQueries`
- `order`
- `results[*].resultKey`
