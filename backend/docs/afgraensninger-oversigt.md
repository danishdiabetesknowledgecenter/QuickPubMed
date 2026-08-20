# Afgrænsninger — samlet oversigt over oversættelser og API-parametre

Dette dokument er referenceoversigt over hvordan alle afgrænsnings-kategorier (filtre) i Mugin Scholar oversættes til konkrete kald mod hver enkelt database, samt hvilke API-parametre der reelt bruges pr. kilde.

> Kilderne: `data/content/shared/limits.json` (filter-definitioner), `src/utils/semanticWordedIntent.js` (intent-sammensætning), `src/components/DropdownWrapper.vue` (query-plan), `backend/api/*.php` (kildespecifikke endpoints).

> **Om "M2"**: Referencer til "M2" i dette dokument peger på *Milestone 2* — projektet der udvidede søgningen til at inkludere non-PMID/DOI-records (herunder guidelines fra fx Sundhedsstyrelsen, WHO og NICE) via OpenAlex ID som tertiær identifier, samt introducerede den nye publikationstype-klassifikator (`pubTypeTier` / `pubTypeConfidence`).

## 1. Sådan bliver en afgrænsning til et kildekald

### 1.0 Trin 0: Kilde-toggles og fritekst-oversættelse (forudsætning)

Før nogen afgrænsning overhovedet kommer i spil, afgøres to ting:

**a) Hvilke kilder bruges?** (L095-gruppen, "Databaser" — se §2 nederst)
- Hver kilde (PubMed, OpenAlex, Semantic Scholar, Elicit) er en separat on/off-toggle.
- En afgrænsnings `sourceFilters.<kilde>`-blok evalueres **kun** hvis den pågældende kilde er tændt.

**b) Hvordan behandles brugerens fritekst?**

| Kilde | AI-toggle (`searchWithAI`) til | AI-toggle fra |
|---|---|---|
| PubMed | Fritekst oversættes af LLM til struktureret søgestreng med `[tiab]`/`[mh]`/booleske tags (`buildPubMedSearchStringFromFreeText` i `DropdownWrapper.vue`) | Fritekst sendes som ren tekst i PubMed's `term`-param (uden tags) |
| OpenAlex / Semantic Scholar / Elicit | Fritekst intent-oversættes altid til kort engelsk query via LLM (`deriveSemanticQueryForSources`) | Kilderne kaldes slet ikke (AI er en forudsætning for semantiske kilder) |

Det betyder:
- Hvis **kun PubMed** er valgt og AI er slået fra → fritekst går urørt til NLM sammen med afgrænsningerne.
- Hvis **AI er slået til og PubMed er valgt** → fritekst oversættes til en struktureret PubMed-søgestreng **og** til en engelsk semantic-query parallelt.
- Hvis **kun semantiske kilder** er valgt → AI er påkrævet; der genereres ingen PubMed-søgestreng.
- Hvis URL/API har `qpubmed` / `qsemanticscholar` / `qopenalex` / `qelicit` (eller JSON `queryOverrides`), bruges de strenge direkte for de pågældende kilder — LLM-oversættelsen af fritekst springes over for dem. Øvrige valgte kilder oversættes stadig. `qpubmed` erstatter kun emne/fritekst-delen; afgrænsninger AND’es stadig.

### 1.1 De tre oversættelseslag for selve afgrænsningerne

Når brugeren derefter vælger en afgrænsning (fx "Guidelines"), udløser det tre lag af oversættelse:

1. **PubMed-lag** — `searchStrings.normal/narrow/broad` tilføjes direkte til eSearch-queryen med `AND`-sammenbinding.
2. **Source-filter-lag** — `semanticConfig.sourceFilters.<kilde>` bliver til kildespecifikke API-parametre på hvert kildekald.
3. **Semantic post-validation-lag** — `semanticConfig.postValidation.rules` og `hardFilters` evalueres af `semanticRuleEngine.js` mod den enkelte kandidats metadata efter retrieval. Records der ikke matcher, excluderes før rerank.

`hardFilters` er kildeuafhængig intent; `sourceFilters` er den eksplicitte værdi der sendes til kilden. `DropdownWrapper.vue` bruger `sourceFilters` først og falder tilbage til deterministisk mapping fra `hardFilters` hvis det mangler.

## 2. Samlet tabel over afgrænsnings-kategorier

Kolonnerne:
- **PubMed-oversættelse**: hvad der tilføjes til eSearch-queryen.
- **OpenAlex**: hvilken `filter`-parameter der bruges.
- **Semantic Scholar**: hvilke felter i `/paper/search`-kaldet der sættes.
- **Elicit**: hvilke felter i Elicit-kaldet der sættes.
- **Post-validation / tier**: hvad der evalueres mod kandidat-metadata efter retrieval (herunder `pubTypeClassification.tier` som er nyt fra M2).

| ID | Kategori | PubMed `searchStrings.normal` | OpenAlex `filter=` | Semantic Scholar | Elicit | Post-validation / tier |
|---|---|---|---|---|---|---|
| **L010** | **Reviewtype** (gruppe) | | | | | |
| L010010 | Systematiske reviews | `"Systematic Review"[pt] OR "Meta-Analysis"[pt]` | `type:review` | `publicationTypes=Review,Meta-Analysis` | `typeTags=Systematic Review,Meta-Analysis` | `rule=systematicReview`, matcher `publicationType ⊇ {systematic review, meta-analysis}` |
| L010020 | Cochrane Reviews | `"Cochrane Database Syst Rev"[Journal]` | `primary_location.source.display_name` | `venue=Cochrane Database of Systematic Reviews` | `typeTags=Systematic Review, Review` | Post-val på `sourceTitle` |
| L010030 | Health Evidence | PMID-liste `(...PMID...) NOT "Retracted Publication"[pt] AND y_10[Filter]` | — | — | — | Kun PubMed (statisk PMID-liste) |
| **L010040** | **Guidelines** (M2-udvidet) | `"Guideline"[pt]` | — | — | — | `rule=guideline` matcher på `publicationType ⊇ {guideline, practice guideline}` **ELLER** `pubTypeTier ∈ {guideline_verified, guideline_candidate}` — NY |
| L010050 | Andre reviews | `"Review"[pt] NOT "Systematic Review"[pt]` | `type:review` | `publicationTypes=Review` | `typeTags=Review` | `rule=otherReview` |
| **L020** | **Studietype** (gruppe) | | | | | |
| L020010 | Case-kontrol-studier | `"Case-Control Studies"[mh] OR case-control[ti]` | — | — | — | Kun PubMed (ingen `semanticConfig`) |
| L020020 | Incidens- og prævalensstudier | `"Incidence"[mh] OR "Prevalence"[mh] OR prevalence[ti] OR incidence[ti]` | — | — | — | Kun `semanticConfig.sourceContext` (ingen hardFilters/postValidation) |
| L020030 | Kohortestudier | `"Cohort Studies"[mh] OR cohort[ti]` | — | — | — | Kun PubMed (ingen `semanticConfig`) |
| L020040 | Kvalitative studier | `"Qualitative Research"[mh] OR qualitative[ti]` | — | — | — | Kun PubMed (ingen `semanticConfig`) |
| L020050 | Randomiserede, kontrollerede forsøg (RCT) | `"Randomized Controlled Trial"[pt] OR randomi*[ti]` | — | — | `typeTags=RCT` | `hardFilters.studyDesign=[randomized controlled trial]` |
| L020060 | Økonomiske studier | `"Costs and Cost Analysis"[mh] OR cost*[ti] OR economic*[ti]` | — | — | — | Kun PubMed (ingen `semanticConfig`) |
| **L025** | **Kildeformat** (gruppe) | | | | | |
| L025010 | Videnskabelig artikel | — (findes ikke i PubMed, kun semantisk) | `workType=article` | `publicationTypes=JournalArticle` | — | `rule=source-format-journal`, `hardFilters.sourceFormat=[journal]`, matcher `candidateSourceType`/`openAlexSourceType=journal` |
| L025020 | Konferencepublikation | — (findes ikke i PubMed, kun semantisk) | `sourceType=conference` | `publicationTypes=Conference` | — | `rule=source-format-conference`, `hardFilters.sourceFormat=[conference]`, matcher `candidateSourceType`/`openAlexSourceType=conference` |
| L025030 | Preprint | — (findes ikke i PubMed) | `sourceType` afledt fra `hardFilters.sourceFormat=[preprint]` (fallback-mapping til `repository`) | `publicationTypes=Preprint` | — | `rule=source-format-preprint`, matcher `candidateSourceType`/`openAlexSourceType=repository` |
| **L030** | **Sprog** (gruppe) | | | | | |
| L030010 | Engelsk | `english[la]` | `language:en` | — | — | `hardFilters.language=[en]` |
| L030020 | Dansk | `danish[la]` | `language:da` | — | — | `hardFilters.language=[da]` |
| L030030 | Norsk | `norwegian[la]` | `language:no` | — | — | `hardFilters.language=[norwegian]` |
| L030040 | Svensk | `swedish[la]` | `language:sv` | — | — | `hardFilters.language=[swedish]` |
| **L040** | **Geografi** (gruppe) | | | | | |
| L040010 | Vestlige lande | Se note om `L040` under tabellen — **ID/indhold ikke verificeret i denne gennemgang** | — | — | — | — |
| L040020–L040110 | Europæiske lande, Nordiske lande (nested gruppe: Danmark, Finland, Færøerne, Grønland, Island, Norge, Sverige) | Se note om `L040` under tabellen | — | — | — | — |
| **L050** | **Køn** (gruppe) | | | | | |
| L050010 | Kvinder | `female[mh] NOT male[mh]` | — | — | — | `rule=female` |
| L050020 | Mænd | `male[mh] NOT female[mh]` | — | — | — | `rule=male` |
| **L060** | **Aldersgruppe** (gruppe) | | | | | |
| L060010 | Spædbørn (0-23 måneder) | Se note om `L060` under tabellen — **searchStrings ikke verificeret i denne gennemgang** | — | — | — | — |
| L060020 | Mindre børn (2-5 år) | Se note om `L060` under tabellen | — | — | — | — |
| L060030 | Større børn (6-12 år) | Se note om `L060` under tabellen | — | — | — | — |
| L060040 | Unge (13-18 år) | Se note om `L060` under tabellen | — | — | — | — |
| L060050 | Voksne (over 18 år) | Se note om `L060` under tabellen | — | — | — | — |
| L060060 | Unge voksne (19-24 år) | Se note om `L060` under tabellen | — | — | — | — |
| L060070 | Midaldrende (45-64 år) | Se note om `L060` under tabellen | — | — | — | — |
| **L070** | **Publiceringsdato** (gruppe) | | | | | |
| L070010 | Seneste 1 år | `y_1[Filter]` | `publication_year:>=<år-1>` | `year=<år-1>-<år>` | `minYear=<år>` (deterministisk fallback: currentYear − 1 + 1) | `hardFilters.publicationDateYears=[1]` |
| L070020 | Seneste 5 år | `y_5[Filter]` | `publication_year:>=<år-5>` | `year=<år-5>-<år>` | `minYear=<år-4>` (deterministisk fallback) | `publicationDateYears=[5]` |
| L070030 | Seneste 10 år | `y_10[Filter]` | `publication_year:>=<år-10>` | `year=<år-10>-<år>` | `minYear=<år-9>` (deterministisk fallback) | `publicationDateYears=[10]` |
| **L080** | **Tilhørsforhold** (gruppe) | | | | | |
| L080010 | Danske institutioner | `denmark[ad] OR danish[ad] OR danmark[ad] OR dansk[ad] OR copenhagen[ad] OR aarhus[ad] OR odense[ad] OR aalborg[ad] OR roskilde[ad] OR ...` | — | — | — | Kun PubMed (ingen `semanticConfig` fundet på dette niveau) |
| L080020 | Specifikke institutioner (nested) | Institution-specifik `[ad]`-query | — | — | — | Institution-match på semantisk metadata |
| L080020010–L080020080 | Region H, Rigshospitalet, AUH osv. | Institution-specifikke affiliation-queries | — | — | — | Samme som ovenfor |
| **L090** | **Tilgængelighed** (gruppe) | | | | | |
| L090010 | Kun resultater med abstracts | `fha[Filter]` | — | — | — | PubMed-only (ingen semantic config) |
| L090020 | Kun gratis tilgængelige artikler | `ffrft[Filter]` | — | — | `hasPdf=true` via `sourceFilters.elicit.hasPdf` | PubMed-only + Elicit-open-access |
| **L095** | **Databaser** (kilde-toggle) | Ingen query-tilføjelse | Slår kilden til/fra | Slår kilden til/fra | Slår kilden til/fra | Styrer `sourceSelection.<kilde>` |
| L095010 | PubMed | — | Ikke relevant | Ikke relevant | Ikke relevant | `sourceSelection.pubmed=true` |
| L095020 | Semantic Scholar | — | — | Aktiverer S2-kald | — | `sourceSelection.semanticScholar=true` |
| L095030 | OpenAlex | — | Aktiverer OpenAlex-kald | — | — | `sourceSelection.openAlex=true` |
| L095040 | Elicit | — | — | — | Aktiverer Elicit-kald | `sourceSelection.elicit=true` |

Bemærk: Celler med `—` betyder at kilden/parameteren ikke bruges for netop dette filter. En tom celle betyder enten at feltet ikke er relevant for kategorien, eller at der p.t. ikke er nogen mapping (i så fald falder filteret alene tilbage på `hardFilters` + post-validation).

### Rettelser og kendte huller fra denne gennemgang

Ved denne gennemgang (i forbindelse med Elicit v1→v2-migreringen) blev tabellen ovenfor sammenholdt direkte med `data/content/shared/limits.json`. Følgende var forkerte og er rettet i tabellen:

- **L020 (Studietype)**: De tidligere ID'er/kategorier (`L020010=RCT`, `L020020=Klinisk studie`, `L020040=Case-control`, `L020050=Tværsnit`) matchede ikke `limits.json` og er rettet. "Klinisk studie" (Clinical Trial) og "Tværsnit" (Cross-Sectional) findes ikke længere som selvstændige afgrænsninger.
- **L025 (Kildeformat)**: Gruppen hed tidligere "Tidsskriftsartikel" (med PubMed `[pt]`-søgestreng) og "Bog / bogkapitel" — ingen af de to findes i `limits.json` i dag. Gruppen er nu "Videnskabelig artikel" / "Konferencepublikation" / "Preprint", alle uden PubMed-søgestreng.
- **L030 (Sprog)**: `L030030`/`L030040` var dokumenteret som en kombineret "Svensk/norsk" og en generisk "Øvrige"-kategori. Reelt er de to separate enkeltsprog: `L030030`=Norsk, `L030040`=Svensk. Der findes ingen generisk "øvrige sprog"-negation.
- **L070010**: Var dokumenteret som "Seneste 2 år" — er reelt "Seneste 1 år" (`publicationDateYears=[1]`, `y_1[Filter]`).
- **L080010**: Var dokumenteret som "Danske forfattere" — hedder reelt "Danske institutioner" og bruger en længere liste af by-/institutionsnavne i affiliation-feltet, ikke kun `Denmark[ad]`.
- **L095 (Databaser)**: `L095020` og `L095030` var byttet om — `L095020` er Semantic Scholar, `L095030` er OpenAlex (ikke omvendt, som tidligere dokumenteret).
- **Sektion 4 (`hardFilters`-oversigt)**: `publicationType`-rækken manglede Elicit `typeTags` som mål, selv om koden (`mapHardFiltersToElicitTypeTags` i `DropdownWrapper.vue`) allerede afleder `Review`/`Meta-Analysis`/`Systematic Review` herfra.

**Ikke fuldt afsluttet i denne gennemgang** (kræver en separat, dybere gennemgang, da strukturen er mere kompleks end en simpel ID-rettelse):

- **L040 (Geografi)**: Gruppen er omstruktureret til "Vestlige lande" (`L040010`), "Europæiske lande" (`L040020`) og en nestet "Nordiske lande"-undergruppe (`L040030`) med 7 lande som børn (`L040040`–`L040110`, inkl. Danmark som `L040050`). Der er ingen synlige USA- eller Afrika-afgrænsninger i den nuværende `limits.json`. Den nestede struktur passer ikke ind i tabellens flade format uden et redesign.
- **L060 (Aldersgruppe)**: Navne og aldersgrænser er ændret (fx findes "Nyfødt" og "Spædbarn" ikke længere som separate kategorier). De konkrete PubMed `[mh]`-søgestrenge pr. trin er ikke verificeret i denne gennemgang.

## 3. API-parametre pr. database

Dette er de konkrete felter hver kilde accepterer fra Mugin Scholar. Kilderne har flere API-muligheder, men kun disse bruges.

### PubMed (NCBI E-utilities)

Kaldes fra `backend/api/NlmSearch.php` (esearch) og `backend/api/NlmSummary.php` (esummary). Live søgning går via `UnifiedSearch.php` → `muginPublicSearchRunSearch()`, som bruger samme NLM-proxies.

| API-parameter | Bruges til | Kilde i kodebase |
|---|---|---|
| `db=pubmed` | Database-valg | Hardcoded |
| `term` | Hovedquery (fritekst + alle `searchStrings.normal` sammenkædet med `AND`) | Orkestrator / `SearchForm` payload |
| `retmode=json` | Response-format | Hardcoded |
| `retmax` | Max antal PMIDs (pagination) | `pageSize`-beregning |
| `retstart` | Offset | `page * pageSize` |
| `sort` | Sorteringskriterium — NCBI accepterer `relevance` eller `pub_date` (app-niveau `date_desc`/`date_asc` mappes til `pub_date`) | `sort.method` |
| `usehistory=y` | Cache søgehistorik på NCBI-siden | Hardcoded |

PubMed-specifikke operatorer brugt i `searchStrings`:
- `[pt]` (publication type)
- `[mh]` (MeSH)
- `[la]` (language)
- `[ad]` (affiliation)
- `[sb]` (subset)
- `[ti]`, `[tiab]` (titel / titel+abstract)
- `[Filter]`, `y_N[Filter]` (recency)
- Boolske operatorer: `AND`, `OR`, `NOT`, parenteser

### OpenAlex

Kaldes fra `backend/api/OpenAlexSearch.php` og `backend/api/OpenAlexWorkLookup.php`.

| API-parameter | Bruges til | Kildeværdi |
|---|---|---|
| `search` | Keyword-query (når `searchMode=keyword`) | Fritekst efter intent-oversættelse |
| `search.semantic` | Semantic-query (når `searchMode=semantic`) | Samme |
| `per_page` | Sidesstørrelse (cap: 50) | `requestLimit` |
| `page` | Offset | Pagination |
| `select` | Kommaseparerede felter der hentes | Fast liste: `id, display_name, doi, ids, publication_year, publication_date, relevance_score, type, type_crossref, primary_location, fwci, cited_by_count, counts_by_year, is_retracted, open_access, primary_topic, authorships, abstract_inverted_index, language` |
| `filter` | Sammensat filterstreng (AND mellem clauses) | Bygges ud fra `sourceFilters.openAlex.*`: |
| &nbsp;&nbsp;&nbsp;`language:<iso>\|<iso>` | Sprogfilter | `sourceFilters.openAlex.language[]` |
| &nbsp;&nbsp;&nbsp;`primary_location.source.type:<type>` | Kildetype (journal, repository, conference) | `sourceFilters.openAlex.sourceType[]` |
| &nbsp;&nbsp;&nbsp;`type:<type>\|<type>` | Work-type (article, review, book, book-chapter, dataset, dissertation osv.) | `sourceFilters.openAlex.workType[]` |
| &nbsp;&nbsp;&nbsp;`publication_year:>=<år>` | Recency | `sourceFilters.openAlex.publicationYear` |
| &nbsp;&nbsp;&nbsp;`doi:<d1>\|<d2>\|...` (Work lookup) | Batch-hydration via DOI | `dois[]` i POST-body |
| &nbsp;&nbsp;&nbsp;`openalex:<id>\|<id>\|...` (Work lookup) | Batch-hydration via OpenAlex ID (NY fra M2) | `openAlexIds[]` i POST-body |

Tilladte `type`-værdier for `workType`: `article, book, book-chapter, dataset, dissertation, review, preprint, editorial, erratum, letter, libguides, other, paratext, peer-review, reference-entry, report, retraction, standard, supplementary-materials`.

Tilladte `source.type`-værdier: `journal, conference, ebook platform, other, repository`.

### Semantic Scholar (Graph API)

Kaldes fra `backend/api/SemanticScholarSearch.php` (endpoint `/graph/v1/paper/search` — relevans-rangeret søgning, batch-hentet i sider af 100 op til den konfigurerede grænse. **Ikke** `/paper/search/bulk`, som ikke er relevans-rangeret og derfor ville skade RRF-baseret rerank).

| API-parameter | Bruges til | Kildeværdi |
|---|---|---|
| `query` | Fritekst-query | Intent-oversat engelsk tekst |
| `limit` | Sidesstørrelse (cap: 100) | `requestLimit` |
| `offset` | Pagination | — |
| `fields` | Kommaseparerede felter der hentes | Fast liste: `paperId, title, abstract, externalIds, authors, year, venue, publicationTypes, openAccessPdf, citationCount, influentialCitationCount, fieldsOfStudy, tldr` |
| `publicationTypes` | Filter på pubtype | `sourceFilters.semanticScholar.publicationTypes[]` |
| `year` | Recency (enten `2020-2025` eller `2020`) | `sourceFilters.semanticScholar.year` eller afledt fra `publicationDateYears` |
| `publicationDateOrYear` | Alternativ recency-param | `sourceFilters.semanticScholar.publicationDateOrYear` |
| `venue` | Venue-filter (sjældent brugt) | — |

Tilladte `publicationTypes`-værdier: `JournalArticle, Review, CaseReport, ClinicalTrial, Dataset, Editorial, LettersAndComments, MetaAnalysis, News, Study, Book, BookSection, Conference`.

**Bemærk**: S2 giver kun selvstændige kandidater når records har PMID eller DOI. Records uden standard-identifier droppes (ingen cross-source fuzzy matching i denne milestone).

### Elicit

Kaldes fra `backend/api/ElicitSearch.php` (endpoint `https://elicit.com/api/v2/search/papers`, kaldt med `corpus=elicit` og `searchMode=semantic` explicit sat).

Elicit's API understøtter en relativt rig `filters`-kontrakt. Efter Elicit-udvidelsen bruger vi nu hele kontrakten for alle ikke-triviale signaler. Tabellen viser status pr. parameter.

| Brugt? | API-parameter | Bruges til | Kildeværdi hos os |
|---|---|---|---|
| ✔ | `query` | Forskningsspørgsmål i naturligt sprog | Intent-oversat engelsk spørgsmål |
| ✔ | `maxResults` (aka `numResults`) | Sidesstørrelse (range 1-5000, default 10) | `requestLimit` |
| ✔ | `filters.typeTags[]` | Filter på studietype | `sourceFilters.elicit.typeTags[]` |
| ✔ | `filters.includeKeywords[]` | Krav om tilstedeværende keywords | `sourceFilters.elicit.includeKeywords[]` |
| ✔ | `filters.excludeKeywords[]` | Udelukkende keywords | `sourceFilters.elicit.excludeKeywords[]` |
| ✔ | `filters.minYear` / `maxYear` | Publiceringsår-range | Deterministisk fallback fra `hardFilters.publicationDateYears` (L070010/020/030) + eksplicit via `sourceFilters.elicit.minYear/maxYear` |
| ✔ | `filters.minEpochS` / `maxEpochS` | Dato-range i Unix epoch sekunder | Kan sættes eksplicit via `sourceFilters.elicit.minEpochS/maxEpochS` (bruges p.t. ikke i limits.json, men propageres ende-til-ende) |
| ✔ | `filters.maxQuartile` | Journal-kvalitet (1 = top 25%) | Kan sættes via `sourceFilters.elicit.maxQuartile` |
| ✔ | `filters.hasPdf` | Kun papers med PDF | Sat automatisk til `true` for L090020 "Kun gratis tilgængelige artikler" |
| ✔ | `filters.pubmedOnly` | Kun PubMed-indekserede papers | Kan sættes via `sourceFilters.elicit.pubmedOnly` (bruges p.t. ikke, men propageres) |
| ✔ | `filters.retracted` | `exclude_retracted` (default), `include_retracted`, `only_retracted` | Default **`exclude_retracted`** sættes nu altid — overskrives kun hvis `sourceFilters.elicit.retracted` eksplicit angiver andet |

Tilladte `typeTags`-værdier: `Review`, `Meta-Analysis`, `Systematic Review`, `RCT`, `Longitudinal`.

**Brug i dag i `limits.json`** — efter udvidelsen:

| Filter | Elicit-felter sat direkte |
|---|---|
| L010010 Systematiske reviews | `typeTags=Systematic Review, Meta-Analysis` |
| L010020 Cochrane Reviews | `typeTags=Systematic Review, Review` |
| L010050 Andre reviews | `typeTags=Review` |
| L020010 RCT | `typeTags=RCT` |
| L090020 Kun gratis tilgængelige artikler | `hasPdf=true` |
| L070010 / L070020 / L070030 | Ingen direkte `sourceFilters.elicit`; `minYear` udledes **deterministisk** i `DropdownWrapper.vue.buildSourceQueryPlan()` fra `hardFilters.publicationDateYears` |
| Default (altid) | `retracted=exclude_retracted` (overskrives kun hvis filter eksplicit sætter andet) |

**Datapipeline for Elicit-felter** (for at sikre at nye felter propageres korrekt):

1. `limits.json` → `semanticConfig.sourceFilters.elicit.<felt>`
2. `src/utils/semanticWordedIntent.js` → `normalizeElicitSourceFilterConfig` + `collectSourceFilters` (aggregerer/merger scalar-felter når flere limits vælges: max for minYear, min for maxYear/maxQuartile, logisk AND for booleans, prioritering for retracted)
3. `DropdownWrapper.vue.buildSemanticSourceQueryPlan()` → læser `payloadElicitFilters.*`, supplerer med deterministisk fallback fra `hardFilters` (fx `minYear` fra `publicationDateYears`), sætter `retracted="exclude_retracted"` som default
4. `DropdownWrapper.vue.fetchElicitResults()` → normaliserer og videresender alle understøttede felter i `filters`-payload
5. `backend/api/ElicitSearch.php` → `muginNormalizeElicit*`-helpers (`Year`, `Epoch`, `Quartile`, `Boolean`, `Retracted`) sanity-tjekker input og sender til Elicit's v2 search endpoint (`/api/v2/search/papers`)
6. Ved 4xx fra Elicit: `buildElicitRequestRetryAttempt` + backend-`muginBuildElicitRetryHints` disabler det konkrete problem-felt og retrier

**Bemærk**: Elicit returnerer altid DOI-normaliserede records, så der er ingen non-DOI/PMID-problematik for denne kilde.

## 4. Oversigt over `hardFilters`-felter

`hardFilters` er den kildeuafhængige intent-model. Hvert felt oversættes til kildespecifikke parametre i `DropdownWrapper.vue.buildSourceQueryPlan()`:

| `hardFilters`-felt | Eksempel-værdier | Primært kilde-mapping |
|---|---|---|
| `publicationType` | `["guideline", "practice guideline", "systematic review"]` | PubMed `[pt]`, S2 `publicationTypes`, OpenAlex `type`, Elicit `typeTags` |
| `studyDesign` | `["RCT", "cohort", "caseControl"]` | PubMed `[pt]/[mh]`, Elicit `typeTags` |
| `ageGroup` | `["newborn", "infant", "child", "adolescent", "adult"]` | PubMed `[mh]`, post-validation |
| `language` | `["en", "da", "sv", "no"]` | PubMed `[la]`, OpenAlex `language:` |
| `sourceFormat` | `["journal", "book", "preprint"]` | PubMed `[pt]`, OpenAlex `type`/`source.type`, S2 `publicationTypes` |
| `publicationDateYears` | `[2]`, `[5]`, `[10]` | PubMed `y_N[Filter]`, OpenAlex `publication_year:>=`, S2 `year=` |
| `filterProfile` | `["guideline-only", "cochrane-only"]` | Ren dokumentations-flag (ingen kode-håndhævelse) |
| `pubTypeTier` (NY, M2) | `["guideline_verified", "guideline_candidate"]` | Matches mod `pubTypeClassifier`-output på kandidaten |

## 5. Hvordan flere afgrænsninger kombineres

Flere valgte afgrænsninger kombineres med **AND**:

- **PubMed**: `(fritekst) AND (afgrænsning1) AND (afgrænsning2)` — alle `searchStrings.normal` sammenkædes.
- **OpenAlex**: Alle `filter`-clauses sammenkædes med komma (svarer til AND hos OpenAlex).
- **Semantic Scholar**: Filtre på separate parametre kombineres automatisk som AND.
- **Elicit**: `filters.*`-arrays matches kumulativt.

Inden for samme afgrænsning kombineres flere børne-valg (fx flere aldersgrupper) typisk med **OR** via `|` i OpenAlex, `,` i S2 eller ` OR ` i PubMed.

## 6. Post-validation: hvornår et filter håndhæves efter retrieval

Hvis en afgrænsning har `semanticConfig.postValidation.rules`, håndhæves det efter kilderne har returneret kandidater, men før rerank. `src/utils/semanticRuleEngine.js` evaluerer hver kandidat mod reglen og dropper dem der ikke matcher.

Regel-strukturen:

```json
"postValidation": {
  "mode": "metadata",
  "rules": [
    {
      "id": "guideline",
      "exclusiveGroup": "publication-profile",
      "matchStrategy": "any",
      "metadataFieldConditionMode": "any",
      "textScopes": ["candidateTitle", "sourceCandidateTitles"],
      "requireAnyTextSignals": ["guideline", "consensus statement", "recommendation"],
      "metadataFieldConditions": [
        { "field": "candidatePublicationTypes", "operator": "includesAny", "values": ["guideline", "practice guideline"] },
        { "field": "candidatePubTypeTier", "operator": "includesAny", "values": ["guideline_verified", "guideline_candidate"] }
      ]
    }
  ]
}
```

Tilgængelige `field`-værdier i `metadataFieldConditions` (fra `buildSemanticSnapshotForCandidate`):

- `candidateSource` — `pubmed`, `openAlex`, `semanticScholar`, `elicit`
- `candidatePublicationTypes` — array af publikationstyper fra kilden
- `candidatePubTypeTier` — klassifikatorens tier (NY fra M2)
- `candidatePubTypeConfidence` — `high`, `medium`, `low` (NY fra M2)
- `candidateTitle`, `candidateAbstract`
- `candidateLanguage`, `candidateYear`
- `candidateVenue`, `candidateAffiliation`
- `sourceCandidateTitles`, `sourceCandidatePublicationTypes` — fra alle kryds-kilde metadata

## 7. Eksempel — hvad sker der når brugeren vælger "Guidelines" + "Dansk" + "Seneste 10 år"

**PubMed-kald:**
```
GET /esearch.fcgi?db=pubmed&term=(<fritekst>) AND "Guideline"[pt] AND danish[la] AND y_10[Filter]
```

**OpenAlex-kald (hvis OpenAlex er valgt):**
```
GET /works?search.semantic=<engelsk-intent>&per_page=50&filter=language:da,publication_year:>=2016
```
OpenAlex får kun `language` og `publication_year` som eksplicitte filtre — guideline-matching håndhæves **ikke** via OpenAlex's `type`-filter, fordi mange reelle guidelines ligger som `report` eller `other` i OpenAlex. I stedet vurderes hver returneret kandidat post-retrieval af `pubTypeClassifier`, som kan opgradere den til tier `guideline_verified` eller `guideline_candidate` baseret på udgiver/titel-signaler.

**Semantic Scholar-kald (hvis valgt):**
```
GET /paper/search?query=<engelsk>&year=2016-2026&limit=100
```

**Elicit-kald (hvis valgt):**
```
POST /search { "query": "<engelsk>", "maxResults": 50, "filters": { "minYear": 2017, "retracted": "exclude_retracted" } }
```
`minYear` kommer fra den deterministiske fallback-mapping (current year − 10 + 1 = 2017 for "Seneste 10 år"). `retracted=exclude_retracted` sættes automatisk som default.

**Bemærk**: Elicit har ikke et direkte sprog-filter, så "Dansk" håndhæves kun via post-validation (eftersom Elicit typisk returnerer engelsk-sprogede tidsskriftsartikler).

**Post-retrieval (alle kilder):**
1. `pubTypeClassifier` tildeler hver kandidat en tier.
2. `semanticRuleEngine` evaluerer L010040's guideline-regel → beholder kun records med `publicationType ⊇ {guideline, practice guideline}` eller `pubTypeTier ∈ {guideline_verified, guideline_candidate}`.
3. Sprog-filteret evaluerer `candidateLanguage="da"`.
4. Recency-filteret evaluerer `candidateYear >= 2016`.
5. Rerank anvender `pubTypeTierBonus`, `dataQualityMultiplier` osv. og producerer den endelige rækkefølge.

## 8. Hvor skal man kigge for at ændre noget

| Ændring | Fil |
|---|---|
| Tilføj ny afgrænsning | `data/content/shared/limits.json` |
| Ændre hvordan et filter oversættes til PubMed | `searchStrings` på den konkrete L-kode |
| Ændre hvordan et filter sendes til OpenAlex/S2/Elicit | `sourceFilters.<kilde>` på L-koden |
| Ændre post-retrieval-validering | `postValidation.rules` på L-koden + evt. `src/utils/semanticRuleEngine.js` |
| Ændre klassifikator-logik | `src/utils/pubTypeClassifier.js` |
| Ændre kildekald-parametre (fx tilføj nye OpenAlex-felter) | `backend/api/OpenAlexSearch.php` |
| Ændre allow-list for guideline-udgivere | `data/content/shared/limits.json` top-level `guidelinePublisherAllowList` |
| Deaktivere kilde globalt | `MUGIN_RERANK_CONFIG.sourceSelection` i `backend/config/config.php` |

## Se også

- [search-flow-readme.md](./search-flow-readme.md) — detaljeret teknisk beskrivelse af hele søgeflowet inkl. rerank-formel
- [search-flow-diagram.md](./search-flow-diagram.md) — flowchart-diagrammer
- [saadan-virker-soegningen.md](./saadan-virker-soegningen.md) — pædagogisk forklaring for ikke-tekniske læsere
- [semantic-source-filters.md](./semantic-source-filters.md) — dyb dyk i `sourceFilters`-mekanikken
- [semantic-doi-only-rules.md](./semantic-doi-only-rules.md) — regler for non-PubMed-records (DOI og OpenAlex ID)
- [public-search-api.md](./public-search-api.md) — public API-kontrakt med parity-krav
