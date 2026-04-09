# Semantiske source-filters

Denne note beskriver, hvordan `semanticConfig.sourceFilters` bruges i QuickPubMed, og hvornår feltet bør vedligeholdes.

## Formål

`hardFilters` er den kanoniske, kildeuafhaengige model.

`sourceFilters` er et additivt lag til kilde-specifikke, eksplicitte filtervaerdier, naar en kilde har egne enum-vaerdier eller egne filterfelter, som vi vil styre direkte.

Det betyder:

- `hardFilters` beskriver intentionen i et internt format
- `sourceFilters` beskriver den konkrete vaerdi, der sendes til en bestemt kilde
- `sourceFilters` bruges foerst, men eksisterende fallback fra `hardFilters` bevares

## Hvor vedligeholdes hvad

- `data/content/shared/limits.json`
  - Her ligger de konkrete source-filters under `semanticConfig.sourceFilters`

- `src/utils/semanticWordedIntent.js`
  - Samler `sourceFilters` fra valgte emner og afgraensninger

- `src/components/DropdownWrapper.vue`
  - Bygger den endelige source query plan
  - Bruger eksplicitte `sourceFilters` foerst
  - Falder tilbage til eksisterende mapping fra `hardFilters`, hvis `sourceFilters` mangler

## Understoettede kilder lige nu

### `openAlex`

Understoettede felter:

- `language`
- `sourceType`
- `workType`
- `publicationYear`

Eksempel:

```json
{
  "semanticConfig": {
    "hardFilters": {
      "sourceFormat": ["journal"]
    },
    "sourceFilters": {
      "openAlex": {
        "workType": ["article"]
      }
    }
  }
}
```

### `elicit`

Understoettede felter:

- `typeTags`
- `includeKeywords`
- `excludeKeywords`

Eksempel:

```json
{
  "semanticConfig": {
    "hardFilters": {
      "publicationType": ["systematic review", "meta-analysis"]
    },
    "sourceFilters": {
      "elicit": {
        "typeTags": ["Systematic Review", "Meta-Analysis"]
      }
    }
  }
}
```

### `semanticScholar`

Der er endnu ingen strukturerede `sourceFilters` for `semanticScholar`.

Her bruges i stedet:

- fri query
- kilde-specifikke hints

## Praktiske regler for vedligeholdelse

- Hold `hardFilters` kanoniske og kildeuafhaengige.
- Brug kun `sourceFilters`, naar der er en sikker og bevidst kilde-specifik vaerdi.
- Brug kilde-native vaerdier i `sourceFilters`, ikke interne aliaser.
- Tilfoej kun eksplicitte `sourceFilters`, naar feltet allerede er understoettet i koden.
- Hvis en eksplicit vaerdi er usikker eller tvetydig, saa lad fallbacken fra `hardFilters` styre det i stedet.

## Hvornår skal man bruge hvad

Brug `hardFilters`, naar:

- flere kilder skal kunne dele samme intention
- betydningen skal vaere stabil paa tvaers af kilder
- vi endnu ikke vil laase os til en bestemt API-vaerdi

Brug `sourceFilters`, naar:

- en kilde kraever eksakte enum-vaerdier
- vi vil undgaa implicit mapping for en bestemt limit
- der findes en sikker 1:1 vaerdi, som er bedre at vedligeholde eksplicit

## Vigtig begrænsning

`sourceFilters` erstatter ikke `doiOnlyRules` og erstatter ikke al efterfoelgende hard-filtering.

Det er kun et ekstra, tidligt lag til bedre kilde-specifik retrieval.
