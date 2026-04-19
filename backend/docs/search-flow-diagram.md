# Search Flow Diagram

Dette dokument beskriver det nuvaerende search flow i `QuickPubMed` ud fra den aktuelle kode i:

- `src/components/SearchForm.vue`
- `src/components/DropdownWrapper.vue`
- `src/utils/semanticReranking.js`
- `backend/api/ICiteLookup.php` (NIH iCite enrichment)
- `backend/api/OpenAlexAuthorityLookup.php` (forfatter/journal enrichment)

Maalet er at vise alle de vigtigste grene i det nuvaerende flow: klassisk PubMed-soegning, hybridsoegning, semantiske kilder, PubMed som tidlig kilde, PubMed lexical rescue, enrichment af kandidater, hybrid rerank, hard-filtervalidering, DOI-only-regler og pagination.

## 1. Overblik Over Hovedflowet

```mermaid
flowchart TD
  A["Bruger klikker Soeg<br/>search()"] --> B["01 Prepare<br/>prepareSemanticSearchStateBeforeSearch()"]
  B --> C{"Semantiske kilder valgt?"}

  C -- "Nej" --> D["Byg klassisk query<br/>getSearchString()"]
  C -- "Ja" --> E["Forbered deferred tags<br/>og evt. globalt semantic intent"]
  E --> F["Koer semantisk retrieval-subflow<br/>buildResolvedSemanticTagState()"]
  F --> D

  D --> G{"Tom query?"}
  G -- "Ja" --> H["Stop / ingen soegning"]
  G -- "Nej" --> I["Gem finalQuery"]

  I --> J["06 Filter and validation"]
  J --> K{"Findes rerankede candidates?"}

  K -- "Ja, med candidate-metadata" --> L["Hybridflow<br/>buildHybridOrderedResultRefs()"]
  L --> L1["Valider rerankede PMIDs i PubMed<br/>resolveOrderedSearchPmids()"]
  L1 --> L2["Trust PMIDs der bestod PubMed-hardfilter"]
  L2 --> L3["Valider DOI-only / ikke-trusted refs<br/>via OpenAlex metadataregler"]
  L3 --> L4["Byg resultRefs i reranket orden"]

  K -- "Kun PMIDs" --> M["Valider PMIDs i PubMed<br/>og behold reranket orden"]
  K -- "Nej" --> N["Klassisk PubMed esearch<br/>paa finalQuery"]

  L4 --> O["07 Hydration"]
  M --> O
  N --> O

  O --> O1{"Hybrid refs?"}
  O1 -- "Ja" --> O2["Hydrer PMIDs via NLM<br/>og DOI-only via OpenAlex"]
  O1 -- "Nej" --> O3["Hydrer PubMed-id'er via NLM"]

  O2 --> P["Evt. LLM final rerank<br/>kun foerste side"]
  O3 --> P

  P --> Q["08 Final result composition<br/>vis resultater"]
```

## 2. Retrieval-Subflow For Semantiske Kilder

```mermaid
flowchart TD
  A["buildResolvedSemanticTagState()"] --> B{"AI + semantiske kilder?"}

  B -- "Ja" --> C["Derive semantic intent/query<br/>deriveSemanticQueryForSources()"]
  B -- "Nej" --> D["Brug raatekst / tag som semantic query"]

  C --> E["04 Source retrieval"]
  D --> E

  E --> SS["Semantic Scholar<br/>hvis valgt"]
  E --> OA["OpenAlex<br/>hvis valgt<br/>+ evt. keyword supplement ved cap"]
  E --> EL["Elicit<br/>hvis valgt"]

  E --> PM{"PubMed valgt som kilde?"}

  PM -- "Nej" --> PM0["Ingen PubMed rescue<br/>skipped-pubmed-not-selected"]

  PM -- "Ja" --> PM1{"Findes pubmedSourceQuery?"}
  PM1 -- "Ja" --> PM2["Tidlig PubMed-retrieval som reel kilde<br/>fetchPubMedBestMatchSourceResult()<br/>fuld PubMed-query inkl. filtre"]
  PM1 -- "Nej" --> PM3{"Foerste harvest for tynd?"}

  PM3 -- "Ja" --> PM4["PubMedLexicalRescue<br/>ekstra PubMed-soegning<br/>+ lexical scoring"]
  PM3 -- "Nej" --> PM5["Ingen rescue"]

  SS --> EN["04b Enrichment<br/>ICiteLookup + OpenAlexAuthorityLookup<br/>(parallel batch)"]
  OA --> EN
  EL --> EN
  PM0 --> EN
  PM2 --> EN
  PM4 --> EN
  PM5 --> EN

  EN --> M["05 Merge + hybrid rerank<br/>rerankSemanticCandidates()"]
  M --> N["Gem rerankede candidates / PMIDs / DOIs<br/>paa tag eller global semantic state"]
```

### Enrichment-detalje (`04b`)

```mermaid
flowchart LR
  A["Kandidater fra kilder"] --> B1["Saml unikke PMIDs"]
  A --> B2["Saml unikke OpenAlex<br/>author-ids og source-ids"]
  B1 --> C1["ICiteLookup.php<br/>batch 500 PMIDs"]
  B2 --> C2["OpenAlexAuthorityLookup.php<br/>batch 50 ids"]
  C1 --> D1["RCR, nih_percentile,<br/>is_clinical, cited_by_clin, apt"]
  C2 --> D2["h_index, 2yr_mean_citedness,<br/>is_in_doaj"]
  D1 --> E["Injicer i candidate.metadata"]
  D2 --> E
  E --> F["mergeSourceCandidates()<br/>flytter til entry.enriched"]
```

## 3. PMID- Og DOI-Validering I Hybridflowet

```mermaid
flowchart TD
  A["Rerankede candidates"] --> B["Udtag orderedPmids"]
  B --> C["resolveOrderedSearchPmids()<br/>PMID-liste AND hardFilterQuery"]
  C --> D["PMIDs som matcher PubMed<br/>bliver trusted"]
  D --> E["buildAllowedSemanticRefKeys()"]

  E --> F{"Candidate har trusted PMID?"}
  F -- "Ja" --> G["Tillad direkte"]
  F -- "Nej" --> H{"DOI-only eller ikke-trusted ref?"}
  H -- "Ja" --> I["Hydrer via OpenAlex"]
  I --> J["Anvend metadataregler<br/>og evt. datofiltre"]
  J --> K{"Bestaar regler?"}
  K -- "Ja" --> L["Tillad ref"]
  K -- "Nej" --> M["Afvis ref"]

  H -- "Nej" --> M
  G --> N["Byg endelige resultRefs"]
  L --> N
```

## 4. Pagination

```mermaid
flowchart TD
  A["Bruger henter naeste side<br/>searchMore()"] --> B["Prepare igen"]
  B --> C["Genbrug finalValidatedQuery"]
  C --> D{"Har vi cached hybrid refs<br/>eller matched PMIDs?"}

  D -- "Ja" --> E["Slice naeste refs / PMIDs"]
  D -- "Nej, men rerankede candidates findes" --> F["Byg hybridOrdering eller orderedSearch"]
  F --> E
  D -- "Nej, ingen rerankede candidates" --> G["Klassisk PubMed pagination<br/>retstart/retmax paa validatedQuery"]

  E --> H["Hydrer appended records"]
  G --> H
  H --> I["Append til eksisterende resultatliste"]
```

## 5. Runtime-Matrix

| Scenario | Retrieval | Tidlig PubMed-kilde foer merge | PubMedLexicalRescue | PubMed-validering efter rerank | DOI-only metadataregler |
|---|---|---|---|---|---|
| Kun `PubMed` valgt | Klassisk `getSearchString()` -> PubMed | Nej | Nej | Nej | Nej |
| `PubMed` + semantiske kilder + praedefinerede emner | Semantiske kilder + global semantic state | Ja | Nej, springes over som `skipped-standard-pubmed-retrieval` | Ja | Ja |
| `PubMed` + semantiske kilder + ingen `pubmedSourceQuery` | Semantiske kilder | Nej | Ja, hvis harvest er for tynd | Ja | Ja |
| Kun semantiske kilder valgt | Semantiske kilder | Nej | Nej, springes over som `skipped-pubmed-not-selected` | Ja, for PMID-baserede candidates | Ja |

## 6. Vigtige Noter

- `getSearchString()` bygger den klassiske PubMed-basequery ud fra emner og filtre.
- `prepareSemanticSearchStateBeforeSearch()` opretter kun global semantic state, naar der findes semantiske kilder, ingen ventende tags er tilbage, og der findes et semantic intent-input.
- `pubmedSourceQuery` kommer i det nuvaerende flow fra `getGlobalSemanticPubMedSourceQuery()`, som bruges ved global semantic state for praedefinerede dropdown-emner.
- Hvis `PubMed` ikke er valgt som kilde, koeres `PubMedLexicalRescue` ikke.
- Hvis `PubMed` er valgt, men der allerede findes en standard PubMed-retrieval som reel kilde i samme gren, springes lexical rescue over.
- PMIDs, som har bestaaet PubMed-hardfiltervalidering, trusted i hybridflowet og afvises ikke bagefter af det semantiske metadataregel-lag.
- DOI-only og ikke-trusted refs gaar stadig gennem OpenAlex-baseret metadata-validering.
- Ved dato-sortering kan hybridrefs blive hydreres bredere og derefter sorteret paa dato.
- `searchMore()` genbruger caches og `finalValidatedQuery`, saa pagination ikke genstarter hele retrievallogikken fra bunden.
- Enrichment-sektionen `04b` koerer iCite og OpenAlex Authority parallelt og fejler graceful; ved fejl fortsaetter rerank uden de manglende signaler.
- iCite daekker kun PMIDs. DOI-only kandidater faar `null` paa RCR og falder tilbage til FWCI/citation count i `computeCitationImpactMultiplier`.
- Den hybride rerank bruger formlen `(baseScore + additiveQualityBonus) * qualityMultiplier`, hvor `baseScore` er den klassiske RRF og resten er kvalitetssignaler der defaulter til neutrale vaerdier.

## 7. Kort Opsummering

Det nuvaerende flow er et hybridt search flow med fem centrale principper:

1. Klassiske PubMed-soegestrenge er stadig det kanoniske query-lag.
2. Semantiske kilder kan udvide kandidatfeltet, beriges og derefter flettes i en samlet reranking.
3. Enrichment (`04b`) tilfoejer field-normaliserede citation- og klinikere-relevante signaler uden at aendre retrieval-resultatet.
4. PubMed bruges som valideringslag for PMID-baserede candidates.
5. DOI-only records kan stadig komme med, hvis de overlever de metadataregler, der er defineret for det aktive filterset.
