# Semantiske post-valideringsregler

Denne note beskriver, hvordan den semantiske post-validering er bygget op i QuickPubMed, og hvordan nye regler vedligeholdes.

> **Navngivning (M2):** Historisk hed dette lag "DOI-only-regler", fordi de kun var nødvendige for kandidater uden PMID. Fra M2 dækker reglerne også kandidater, der kun har et `openAlexId` — dvs. records hentet fra OpenAlex, som hverken har PMID eller DOI (typisk kliniske retningslinjer fra WHO/NICE/CDC/Sundhedsstyrelsen, bogkapitler, dissertationer og andre rapporter). Regelmotor, regel-format og evaluering er uændrede; det er kun *hvilke* kandidater, der løber gennem laget, som er udvidet.

## Formål

Den semantiske søgning kan finde kandidater, som ikke kan valideres direkte mod PubMed-hardfilterqueryen. Derfor bruges et separat, konservativt metadataregel-lag til at filtrere ikke-PMID-kandidater (inklusive `openAlexId`-only records), før de vises i hybridresultater.

Reglerne er bevidst:

- datadrevne
- additive
- konservative
- adskilt fra PubMed-only flowet

## Hvor vedligeholdes hvad

- `src/utils/semanticRuleSchema.js`
  - Kanonisk schema/kontrakt for post-valideringsregler
  - Defaults
  - Understøttede felter og operatorer
  - Normalisering af regeldata
  - Opbygning af aktiv rule-state

- `src/utils/semanticRuleEngine.js`
  - Evaluering af regler mod konkrete ikke-PMID-kandidater
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
  - Her ligger de konkrete regler under `semanticConfig.postValidation.rules`
  - Der er fortsat legacy-fallback fra `semanticConfig.doiOnlyRules`

- `backend/api/PublicContent.php`
  - Sørger for, at `semanticConfig` kan merges fra fælles limits og domæneoverrides

## Overordnet flow

1. Brugeren vælger emner og afgrænsninger.
2. `SearchForm.vue` samler de valgte items.
3. `buildActiveSemanticDoiOnlyRuleState()` laver et aktivt regelsæt ud fra `semanticConfig.postValidation.rules`.
4. Semantiske kilder returnerer kandidater med PMID, DOI og/eller `openAlexId`.
5. Ikke-PMID-kandidater (både DOI-only og `openAlexId`-only) vurderes af `semanticRuleEngine.js`.
6. Kun kandidater, der matcher de aktive regler, går videre til hybridlisten.
7. OpenAlex kan stadig bruges som metadataresolver for ikke-PMID-records, selv når `searchWithOpenAlex = false`. Hydration sker via `OpenAlexWorkLookup.php` batch-parameteren `dois[]` eller — for records uden DOI — `openAlexIds[]`.

## Vigtig produktregel

`searchWithOpenAlex = false` betyder kun:

- ingen OpenAlex semantic retrieval

Det betyder ikke:

- at OpenAlex metadataresolveren for ikke-PMID-records er slået fra

Det er bevidst, fordi OpenAlex fortsat bruges til metadata for ikke-PMID-poster fundet via andre kilder.

## Regel-format

Regler ligger på en limit-node sådan her:

```json
{
  "semanticConfig": {
    "postValidation": {
      "mode": "metadata",
      "rules": [
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
- `candidatePubTypeTier` *(M2: tier fra `pubTypeClassifier.js`, fx `guideline_verified`, `systematic_review_or_meta`, `clinical_trial`, `book_chapter`)*
- `candidatePubTypeConfidence` *(M2: `high`, `medium` eller `low`)*

## Understøttede metadata-operatorer

- `exists`
- `equalsAny`
- `includesAny`

## Sådan tilføjer du en ny regel

1. Vælg den relevante limit i `data/content/shared/limits.json`.
2. Tilføj eller udvid `semanticConfig`.
3. Tilføj en ny regel under `semanticConfig.postValidation.rules`.
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
- Gør ikke PubMed-only flowet afhængigt af post-valideringsregler.
- Lad hellere en regel være for smal end for aggressiv.

## Kendte begrænsninger

- Post-valideringsregler er ikke en erstatning for PubMed-filtrering.
- Ikke alle kilder leverer stabile metadatafelter.
- Sprog og aldersgrupper er typisk for svage til hård metadata-baseret post-validering uden ekstra evidens.
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
- om kandidaten er PMID-baseret, DOI-only eller `openAlexId`-only (regelmotoren bruger samme kodeflow for de sidste to)
- om metadatafeltet, du filtrerer på, faktisk findes på kilden
- for `openAlexId`-only records: om `candidatePubTypeTier` matcher dine forventninger (inspicer snapshot via `buildCandidateSemanticMetadataSnapshot` eller debug-logning)
