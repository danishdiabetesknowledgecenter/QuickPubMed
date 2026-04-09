# Semantiske DOI-only regler

Denne note beskriver, hvordan den semantiske DOI-only filtrering er bygget op i QuickPubMed, og hvordan nye regler vedligeholdes.

## Formål

Den semantiske søgning kan finde kandidater uden PMID, men med DOI. Disse DOI-only kandidater kan ikke valideres mod PubMed på samme måde som PMID-kandidater. Derfor bruges et separat, konservativt regel-lag til at filtrere DOI-only kandidater, før de vises i hybridresultater.

Reglerne er bevidst:

- datadrevne
- additive
- konservative
- adskilt fra PubMed-only flowet

## Hvor vedligeholdes hvad

- `src/utils/semanticRuleSchema.js`
  - Kanonisk schema/kontrakt for `doiOnlyFilterRules`
  - Defaults
  - Understøttede felter og operatorer
  - Normalisering af regeldata
  - Opbygning af aktiv rule-state

- `src/utils/semanticRuleEngine.js`
  - Evaluering af regler mod konkrete DOI-only kandidater
  - Tekstsignaler
  - Kilde-signaler
  - Metadata snapshot
  - `metadataFieldConditions`

- `src/components/SearchForm.vue`
  - Samler valgte emner/afgrænsninger
  - Bygger og cacher DOI-metadata
  - Kalder schema + motor
  - Orkestrerer hybridflowet

- `data/content/shared/limits.json`
  - Her ligger de konkrete regler under `semanticConfig.doiOnlyRules`

- `backend/api/PublicContent.php`
  - Sørger for, at `semanticConfig` kan merges fra fælles limits og domæneoverrides

## Overordnet flow

1. Brugeren vælger emner og afgrænsninger.
2. `SearchForm.vue` samler de valgte items.
3. `buildActiveSemanticDoiOnlyRuleState()` laver et aktivt regelsæt ud fra `semanticConfig.doiOnlyRules`.
4. Semantiske kilder returnerer kandidater med PMID og/eller DOI.
5. DOI-only kandidater vurderes af `semanticRuleEngine.js`.
6. Kun kandidater, der matcher de aktive regler, går videre til hybridlisten.
7. OpenAlex kan stadig bruges som DOI-only metadataresolver, selv når `searchWithOpenAlex = false`.

## Vigtig produktregel

`searchWithOpenAlex = false` betyder kun:

- ingen OpenAlex semantic retrieval

Det betyder ikke:

- at OpenAlex DOI-only metadataresolver er slået fra

Det er bevidst, fordi OpenAlex fortsat bruges til metadata for DOI-only poster fundet via andre kilder.

## Regel-format

Regler ligger på en limit-node sådan her:

```json
{
  "semanticConfig": {
    "doiOnlyRules": [
      {
        "id": "guideline",
        "exclusiveGroup": "publication-profile",
        "matchStrategy": "any",
        "metadataFieldConditionMode": "any",
        "textScopes": ["candidateTitle", "sourceCandidateTitles"],
        "requireAnyTextSignals": [
          "guideline",
          "practice guideline",
          "consensus statement",
          "recommendation"
        ],
        "requireAllTextSignals": [],
        "excludeAnyTextSignals": [],
        "allowSourceProviders": [],
        "excludeSourceProviders": [],
        "metadataFieldConditions": [
          {
            "field": "candidatePublicationTypes",
            "operator": "includesAny",
            "values": ["guideline", "practice guideline"]
          }
        ]
      }
    ]
  }
}
```

## Understøttede regelfelter

- `id`
  - Unikt regel-id.

- `exclusiveGroup`
  - Regler i samme gruppe kombineres som `OR`.
  - Forskellige grupper kombineres som `AND`.

- `matchStrategy`
  - `all` eller `any`
  - Hvordan de positive checks kombineres.

- `metadataFieldConditionMode`
  - `all` eller `any`
  - Hvordan `metadataFieldConditions` kombineres internt.

- `textScopes`
  - Understøttet nu:
  - `candidateTitle`
  - `sourceCandidateTitles`
  - `allText`

- `requireAnyTextSignals`
  - Mindst ét af signalerne skal findes.

- `requireAllTextSignals`
  - Alle signalerne skal findes.

- `excludeAnyTextSignals`
  - Hvis ét findes, falder kandidaten ud.

- `allowSourceProviders`
  - Tillad kun bestemte kilder, fx `openAlex`, `semanticScholar`, `elicit`.

- `excludeSourceProviders`
  - Udeluk bestemte kilder.

- `metadataFieldConditions`
  - Liste af metadata-betingelser.

## Understøttede metadatafelter

De centrale felter er defineret i `src/utils/semanticRuleSchema.js`.

Eksempler:

- `candidateSource`
- `sourceProviders`
- `hasOpenAlexId`
- `hasDoi`
- `openAlexId`
- `candidatePublicationYear`
- `candidateVenue`
- `candidateSourceType`
- `candidatePublicationTypes`
- `semanticSourcePublicationTypes`
- `semanticSourceVenues`
- `semanticSourceTypes`
- `openAlexSourceType`
- `openAlexSourceDisplayName`
- `openAlexSourceAbbreviatedTitle`
- `openAlexPrimarySource`
- `openAlexPubDate`

## Understøttede metadata-operatorer

- `exists`
- `equalsAny`
- `includesAny`

## Sådan tilføjer du en ny regel

1. Vælg den relevante limit i `data/content/shared/limits.json`.
2. Tilføj eller udvid `semanticConfig`.
3. Tilføj en ny `doiOnlyFilterRules`-regel.
4. Brug titel-signaler først, hvis metadata er usikre.
5. Brug `metadataFieldConditions`, hvis du ved, at feltet er stabilt nok.
6. Brug `exclusiveGroup`, hvis flere regler skal høre til samme profilkategori og fungere som `OR`.
7. Kør `npm run build`.

## Praktiske anbefalinger

- Start konservativt.
- Brug stærke signaler først:
  - `systematic review`
  - `meta-analysis`
  - `cochrane`
  - `guideline`
- Undgå svage eller tvetydige signaler som eneste filter.
- Gør ikke PubMed-only flowet afhængigt af DOI-only regler.
- Lad hellere en regel være for smal end for aggressiv.

## Kendte begrænsninger

- DOI-only regler er ikke en erstatning for PubMed-filtrering.
- Ikke alle kilder leverer stabile metadatafelter.
- Sprog og aldersgrupper er typisk for svage til hård DOI-only filtrering uden ekstra evidens.
- OpenAlex metadata kan være nødvendige for endelig visning, men regler forsøger at arbejde så tidligt som muligt med det, der allerede er kendt.

## Fejlsøgning

Se console-logning fra:

- `SemanticIntentFlow`
- `SemanticFilterFlow`
- `OpenAlexWorkLookup`
- `SearchFlow`

Hvis regler opfører sig uventet, så tjek:

- om de valgte limits faktisk har `semanticConfig`
- om regler i samme `exclusiveGroup` faktisk er tænkt som alternativer (`OR`)
- om kandidaten er PMID-baseret eller DOI-only
- om metadatafeltet, du filtrerer på, faktisk findes på kilden
