# Public Search API Parity

## Mål

Public Search API skal levere samme logiske slutrækkefølge som den eksisterende webudgave, når de samme kanoniske inputs og samme upstream-data ligger til grund.

## Hvad der er fælles nu

Denne implementering deler nu følgende backend-principper på tværs af alle public API-kald:

- samme normaliserede requestmodel for `GET` og `POST`
- samme deterministiske kandidatfusion og RRF-baserede rangering inkl. de hybride kvalitetssignaler
- samme PubMed-baserede PMID-validering
- samme DOI-hydrering via OpenAlex
- samme side-semantik: sideudsnit efter retrieval, fusion og validering
- samme valgfri LLM-slutrerank-regel for første side

## Hvorfor `matchesWebOrdering` stadig er konservativ

`matchesWebOrdering` returneres som `false` som standard.

Grunden er ikke, at public API'et ikke har en backend-pipeline, men at den nuværende webudgave endnu ikke er fuldt migreret til at bruge præcis samme public/backend-orchestrator for alle søgeforløb. Feltet må derfor først sættes til `true`, når deploymenten faktisk bruger samme kanoniske backend-flow for både web og API.

## Residuale risici

Selv med samme pipeline findes der stadig residual risiko:

- upstream-kilder ændrer resultater over tid
- upstream-kilder kan være delvist utilgængelige
- OpenAI-baseret oversættelse eller slutrerank kan variere, hvis model eller prompt ændres
- metadata for DOI-only resultater kan være ufuldstændige
- enrichment-kilder (NIH iCite, OpenAlex authority) kan fejle eller returnere delvise data; rerank fortsætter graceful uden de manglende signaler, men rækkefølgen kan afvige fra kald til kald

## Kvalitetssignaler og konfiguration

Rangeringen bruger nu en hybrid formel:

```
combinedScore = (baseScore + additiveQualityBonus) * qualityMultiplier
```

Alle hybride kvalitetssignaler er styret af `QPM_RERANK_CONFIG` i `backend/config/config.php` og defaulter til neutrale værdier, så en uopdateret installation har 1:1 samme adfærd som før kvalitetslaget blev indført. Parity mellem web og public API forudsætter derfor **ens `QPM_RERANK_CONFIG`** i begge miljøer — ikke kun ens upstream-data.

Signaler der indgår i multiplikatoren og bonuserne:

- `citationImpactMultiplier` — RCR (iCite) → FWCI (OpenAlex) → influentialCitationCount (S2) → citedByCount
- `authorityMultiplier` — forfatter-h-index og journal 2yr_mean_citedness (default disabled)
- `retractionMultiplier` — styret af `retractionAction` (`none`/`penalty`/`filter`)
- `pubTypeBonus`, `recencyBonus`, `oaBonus`, `clinicalBonus`, `topicOverlapBonus` — additive bidrag

Se `backend/docs/search-flow-readme.md` og `backend/config/config.example.php` for fulde detaljer om vægte og profilforslag.

## Teststrategi

Anbefalet paritetscheck:

1. Kør samme query som `POST /v1/search` og i webudgaven.
2. Sammenlign `results[*].resultKey` i rækkefølge.
3. Gentag for:
   - kun `pubmed`
   - `pubmed + semanticScholar`
   - `pubmed + openAlex + semanticScholar`
   - `relevance`
   - `date_desc`
   - `date_asc`
   - første side og senere sider

## GET vs POST

`GET /v1/search` og `POST /v1/search` bruger samme kanoniske backend-requestmodel. Derfor skal samme enkle request give samme:

- `resolvedQueries`
- `order`
- `results[*].resultKey`

## Når `matchesWebOrdering` kan aktiveres

Aktivér kun `matchesWebOrdering=true`, når alle disse betingelser er opfyldt:

- webudgaven bruger samme backend-orchestrator som public API'et
- samme konfiguration bruges begge steder (inkl. `QPM_RERANK_CONFIG` og alle hybride kvalitetssignaler)
- samme enrichment-kilder er tilgængelige begge steder (iCite + OpenAlex Authority)
- samme request-normalisering bruges begge steder
- LLM-relaterede feature flags er ens
