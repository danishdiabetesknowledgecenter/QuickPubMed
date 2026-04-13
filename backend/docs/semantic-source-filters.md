# Semantiske source-filters

Denne note beskriver, hvordan `semanticConfig.sourceFilters` bruges i QuickPubMed, og hvornår feltet bør vedligeholdes.

## Formål

`hardFilters` er den kanoniske, kildeuafhængige model.

`sourceFilters` er et additivt lag til kilde-specifikke, eksplicitte filterværdier, når en kilde har egne enum-værdier eller egne filterfelter, som vi vil styre direkte.

Det betyder:

- `hardFilters` beskriver intentionen i et internt format
- `sourceFilters` beskriver den konkrete værdi, der sendes til en bestemt kilde
- `sourceFilters` bruges først, men eksisterende fallback fra `hardFilters` bevares
- `softHints` bruges kun til retrieval og reranking
- `postValidation.rules` bruges bagefter til metadata-baseret håndhævelse på ikke-PMID-records

## Hvor vedligeholdes hvad

- `data/content/shared/limits.json`
  - Her ligger de konkrete source-filters under `semanticConfig.sourceFilters`
  - Her ligger post-valideringsregler under `semanticConfig.postValidation.rules`

- `src/utils/semanticWordedIntent.js`
  - Samler `hardFilters`, `sourceFilters`, `softHints` og post-valideringsreferencer fra valgte emner og afgrænsninger

- `src/components/DropdownWrapper.vue`
  - Bygger den endelige source query plan
  - Bruger eksplicitte `sourceFilters` først
  - Falder tilbage til deterministisk mapping fra `hardFilters`, hvis `sourceFilters` mangler
  - Bruger ikke længere LLM som autoritativ kilde til hard filters

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

Understøttede felter:

- `publicationTypes`
- `publicationDateOrYear`
- `year`

Her bruges derudover:

- fri query
- kilde-specifikke hints

Eksempel:

```json
{
  "semanticConfig": {
    "sourceFilters": {
      "semanticScholar": {
        "publicationTypes": ["Review", "JournalArticle"],
        "year": "2022-2026"
      }
    }
  }
}
```

`publicationTypes` er her bevidst API-nær. Det betyder, at listen godt kan indeholde både:

- rigtige Semantic Scholar-publikationstyper som `Review`
- Semantic Scholar-værdier, der fungerer som proxy for vores interne `sourceFormat`, fx `JournalArticle`

## Praktiske regler for vedligeholdelse

- Hold `hardFilters` kanoniske og kildeuafhængige.
- Brug kun `sourceFilters`, når der er en sikker og bevidst kilde-specifik værdi.
- Brug kilde-native værdier i `sourceFilters`, ikke interne aliaser.
- Tilføj kun eksplicitte `sourceFilters`, når feltet allerede er understøttet i koden.
- Hvis en eksplicit værdi er usikker eller tvetydig, så lad fallbacken fra `hardFilters` styre det i stedet.
- Brug `postValidation.rules`, når et hard filter ikke kan udtrykkes sikkert nok i kilde-API'et alene.

## Hvornår skal man bruge hvad

Brug `hardFilters`, når:

- flere kilder skal kunne dele samme intention
- betydningen skal være stabil på tværs af kilder
- vi endnu ikke vil låse os til en bestemt API-værdi

Brug `sourceFilters`, når:

- en kilde kræver eksakte enum-værdier
- vi vil undgå implicit mapping for en bestemt limit
- der findes en sikker 1:1 værdi, som er bedre at vedligeholde eksplicit

Brug `postValidation.rules`, når:

- et hard filter skal gælde også efter retrieval
- PubMed og ikke-PMID-sporet skal håndhæve samme intention med forskellige tekniske midler
- metadata eller tekstsignaler er stærke nok til en konservativ eftervalidering

## Vigtig begrænsning

`sourceFilters` erstatter ikke `postValidation.rules` og erstatter ikke al efterfølgende hard-filtering.

Det er kun et ekstra, tidligt lag til bedre kilde-specifik retrieval.
