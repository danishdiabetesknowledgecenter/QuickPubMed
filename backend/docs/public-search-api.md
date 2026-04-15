# Public Search API

Det offentlige search API eksponeres via en dedikeret public docroot, så de offentlige routes kan være rene og stabile:

- `POST /v1/search`
- `GET /v1/search`
- `GET /v1/health`
- `GET /v1/openapi.yaml`

`POST /v1/search` er den officielle integrationskontrakt. `GET /v1/search` er kun en enkel testvariant med et bevidst begrænset sæt URL-parametre.

## Auth

Den officielle auth-mekanisme er `X-API-Key`.

```http
POST /v1/search HTTP/1.1
Content-Type: application/json
X-API-Key: <client-api-key>
```

`Authorization: Bearer <api-key>` accepteres også.

`apiKey` i query string understøttes kun for `GET /v1/search`, kun når det er slået til i serverkonfigurationen.

## Offentlig adresse

Hvis du vil bruge et rent API-hostnavn som `api.nempubmed.dk`, skal webserveren pege på `public-api`, ikke på `backend/api`.

- `public-api` er den offentlige docroot
- `backend/api` er fortsat intern backend-overflade

## Browser-origins

`allowed_origins` handler ikke om, hvor API'et selv ligger. Det handler om, hvilke frontend-domæner der må kalde API'et direkte fra browseren.

Model B understøttes nu pr. klient via:

- `allow_all_origins => true`

Når den er sat for en klient, accepteres browser-kald fra vilkårlige origins for netop den klient, så længe en gyldig API key sendes med.

Hvis `allow_all_origins` er `false`, bruges den normale `allowed_origins`-allowlist.

## POST request

### Tilladte topniveau-felter

- `apiVersion`
- `query`
- `domain`
- `sources`
- `sort`
- `page`
- `translation`
- `responseOptions`
- `hardFilters`
- `sourceFilters`

Ukendte felter afvises eksplicit.

### Eksempel

```json
{
  "apiVersion": "1",
  "query": {
    "text": "Hvilken effekt har motion ved type 2-diabetes?",
    "language": "da"
  },
  "sources": ["pubmed", "semanticScholar", "openAlex"],
  "sort": {
    "method": "relevance"
  },
  "page": {
    "number": 1,
    "size": 10
  },
  "translation": {
    "mode": "auto"
  },
  "responseOptions": {
    "includeAbstracts": true,
    "includeResolvedQueries": true,
    "includeDiagnostics": false
  },
  "hardFilters": {
    "languages": ["en"],
    "publicationYear": "2020-2026",
    "publicationTypes": ["systematic review"],
    "sourceFormats": ["journal"]
  },
  "sourceFilters": {
    "semanticScholar": {
      "publicationTypes": ["Review"]
    },
    "openAlex": {
      "language": ["en"]
    },
    "elicit": {
      "typeTags": ["Systematic Review"]
    }
  }
}
```

## GET request

Den simple URL-kontrakt accepterer kun:

- `q`
- `sources`
- `sort`
- `page`
- `pageSize`
- `apiKey` når konfigurationen tillader det

Eksempel:

```text
GET /v1/search?q=exercise+type+2+diabetes&sources=pubmed,openAlex&sort=relevance&page=1&pageSize=10
```

Avancerede filtre understøttes ikke i `GET`-varianten.

URL-`apiKey` kan slås til og fra via:

- `NEMPUBMED_PUBLIC_API['urlApiKeyEnabled']`
- `NEMPUBMED_PUBLIC_API_URL_API_KEY_ENABLED`

## Tilladte værdier

### `sources`

- `pubmed`
- `semanticScholar`
- `openAlex`
- `elicit`

### `sort.method`

- `relevance`
- `date_desc`
- `date_asc`

## Response

API'et returnerer den endelige ordnede liste i `results`.

```json
{
  "apiVersion": "1",
  "query": {
    "text": "Hvilken effekt har motion ved type 2-diabetes?",
    "language": "da"
  },
  "sources": ["pubmed", "semanticScholar", "openAlex"],
  "page": {
    "number": 1,
    "size": 10
  },
  "total": 42,
  "partial": false,
  "warnings": [],
  "order": {
    "requestedMethod": "relevance",
    "appliedMethod": "relevance",
    "finalStage": "deterministic_hybrid",
    "matchesWebOrdering": false
  },
  "resolvedQueries": {
    "pubmedQuery": "(exercise[tiab]) AND (type 2 diabetes[tiab])",
    "semanticIntent": "exercise type 2 diabetes",
    "hardFilterQuery": "english[la] AND 2020:2026[dp]",
    "sourceQueryPlan": {
      "semanticScholar": {
        "query": "exercise type 2 diabetes",
        "filters": {
          "publicationTypes": ["Review"],
          "publicationDateOrYear": "",
          "year": "2020-2026"
        }
      }
    }
  },
  "results": [
    {
      "rank": 1,
      "resultKey": "pmid:12345678",
      "type": "pmid",
      "pmid": "12345678",
      "doi": "10.1000/example",
      "title": "Exercise interventions in type 2 diabetes",
      "abstract": "Abstract text ...",
      "hasAbstract": true,
      "abstractSource": "pubmed",
      "publicationDate": "2024 Jan 15",
      "year": "2024",
      "originSource": "semanticScholar",
      "mergedSources": ["semanticScholar", "pubmed"],
      "trustedPmid": true,
      "canOpenInPubMed": true,
      "sourceLabel": "Diabetes Care"
    }
  ]
}
```

## `matchesWebOrdering`

`order.matchesWebOrdering` må kun være `true`, når deploymenten eksplicit er sat op til det. Den leveres derfor konservativt som `false` som standard, indtil web og public API reelt kører på samme kanoniske backend-pipeline.

## Abstracts

`abstract` er altid med i hvert resultat.

- Hvis et abstract blev fundet: `hasAbstract=true`
- Hvis intet abstract blev fundet: `abstract=""` og `hasAbstract=false`

PubMed abstracts hydreres via NLM. DOI-bårne resultater hydreres via OpenAlex.

## Fejl

Typiske fejlstatuskoder:

- `401`: manglende eller ugyldig API key
- `403`: origin ikke tilladt for klienten
- `405`: metode ikke tilladt eller `GET /v1/search` er slået fra
- `422`: request-validering fejlede
- `429`: rate limit overskredet
- `502`: upstream-kilde fejlede

## Cache

Search-responser sendes med:

- `Cache-Control: no-store, no-cache, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`
