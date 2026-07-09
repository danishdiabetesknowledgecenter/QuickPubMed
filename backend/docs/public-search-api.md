# Public Search API

Det offentlige search API eksponeres via en dedikeret public docroot, så de offentlige routes kan være rene og stabile:

- `POST /v1/search`
- `GET /v1/search`
- `GET /v1/health`
- `GET /v1/openapi.yaml`

`POST /v1/search` er den officielle integrationskontrakt. `GET /v1/search` er kun en enkel testvariant med et bevidst begrænset sæt URL-parametre.

Samme `v1/search` endpoint kan nu ogsaa returnere progress-events som `text/event-stream`, naar streaming er slaaet til.

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
- `focus`
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
  "focus": "highest-evidence",
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
    "includeDiagnostics": false,
    "stream": false,
    "language": "da"
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

Den simple URL-kontrakt accepterer:

- `q`
- `sources`
- `sort`
- `focus`
- `page`
- `pageSize`
- `translation`
- `apiKey` når konfigurationen tillader det
- `stream`
- `lang`

Samt tre convenience-aliaser, der matcher de samme parameternavne som søgeformularens URL bruger:

- `pagesize` — alias for `pageSize` (bruges kun hvis `pageSize` ikke er angivet)
- `databases` — alias for `sources`, accepterer både `;;`- og kommasepareret liste (bruges kun hvis `sources` er tom)
- `ai` — alias for `translation` (`ai=false`/`0` giver `translation=none`, ellers `auto`; bruges kun hvis `translation` ikke er angivet)

Eksempel:

```text
GET /v1/search?q=exercise+type+2+diabetes&sources=pubmed,openAlex&sort=relevance&focus=highest-evidence&page=1&pageSize=10&translation=auto
```

Samme søgning skrevet med søgeformular-aliaserne:

```text
GET /v1/search?q=exercise+type+2+diabetes&databases=pubmed;;openalex&sort=relevance&focus=highest-evidence&page=1&pagesize=10&ai=true
```

Avancerede filtre (`hardFilters`, `sourceFilters`) samt emne-/afgrænsnings-ID'er fra søgeformularens `topic`- og `limit`-parametre understøttes ikke i `GET`-varianten eller i det offentlige API generelt — disse ID'er opløses i dag kun client-side i webappen.

`translation` styrer AI-oversættelsen:

- `translation=auto`: AI-oversættelse slået til
- `translation=none`: AI-oversættelse slået fra, så input håndteres som skrevet

`stream` styrer progress-streaming:

- `stream=1`, `stream=true`: returner `text/event-stream`
- `stream=0`, `stream=false`: returner normalt JSON-svar

`lang` styrer sproget for progress-tekster i streamen:

- `lang=da`
- `lang=en`

URL-`apiKey` kan slås til og fra via:

- `NEMPUBMED_PUBLIC_API['urlApiKeyEnabled']`
- `NEMPUBMED_PUBLIC_API_URL_API_KEY_ENABLED`

For `POST /v1/search` kan streaming ogsaa slaas til i body via `responseOptions.stream`.

Progress-sproget kan ogsaa saettes i body via `responseOptions.language`.

Hvis `stream` eller `lang` findes baade i URL og i JSON body, vinder URL-parameteren.

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

### `focus`

Valgfrit resultat-fokus (rerank-profil). Samme profil-id'er som i søgeformularen:

- `balanced`
- `highest-evidence`
- `clinical-practice`
- `newest-research`
- `broad-mapping`

Hvis feltet udelades, eller værdien er ukendt, anvendes ingen profil-override (serverens generelle standard-vægte fra `QPM_RERANK_CONFIG` bruges, hvilket ikke nødvendigvis er identisk med at vælge `balanced` eksplicit).

**Bemærk om `focus` i det offentlige API:** `focus` anvender kun profilens overrides for kilde-vægte (`sourceWeights`), pmid-bonus og overlap-bonus i den deterministiske sammenlægning af flere kilder, samt en kort instruktion i den LLM-baserede finjustering af rækkefølgen (når semantiske kilder og LLM-rerank er aktive). Det er **ikke** fuld paritet med webappens rerank-profiler, som derudover justerer kvalitetssignaler som publikationstype-vægtning, recency-kurver, citationsindflydelse og kliniske bonusser — det lag findes i dag kun i webappens frontend-kode.

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
  "focus": "highest-evidence",
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
  "timing": {
    "startedAt": "2026-07-09T00:00:00+00:00",
    "completedAt": "2026-07-09T00:00:01+00:00",
    "durationMs": 842,
    "durationFormatted": "00:00:00"
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
      "pmcId": "PMC1234567",
      "title": "Exercise interventions in type 2 diabetes",
      "authors": [
        { "name": "Doe JA", "familyName": "Doe", "givenName": "Jane A", "initials": "JA" },
        { "name": "Smith JB", "familyName": "Smith", "givenName": "John B", "initials": "JB" }
      ],
      "journal": {
        "name": "Diabetes Care",
        "issn": "0149-5992",
        "volume": "47",
        "issue": "1",
        "pages": "12-20"
      },
      "sourceLabel": "Diabetes Care",
      "publicationDate": "2024 Jan 15",
      "year": "2024",
      "language": "eng",
      "publicationTypes": ["Randomized Controlled Trial"],
      "topics": [
        { "label": "Type 2 diabetes", "source": "mesh" }
      ],
      "abstract": "Abstract text ...",
      "hasAbstract": true,
      "abstractSource": "pubmed",
      "abstractSections": [
        { "label": "BACKGROUND", "text": "..." },
        { "label": "METHODS", "text": "..." },
        { "label": "RESULTS", "text": "..." },
        { "label": "CONCLUSIONS", "text": "..." }
      ],
      "abstractParagraphs": "BACKGROUND: ...\n\nMETHODS: ...\n\nRESULTS: ...\n\nCONCLUSIONS: ...",
      "aiSummary": "Kort AI-genereret opsummering fra Semantic Scholar.",
      "citationCount": 12,
      "citationCountSource": "semanticScholar",
      "isOpenAccess": true,
      "openAccessUrl": "",
      "isRetracted": null,
      "trustedPmid": true,
      "canOpenInPubMed": true,
      "originSource": "semanticScholar",
      "mergedSources": ["semanticScholar", "pubmed"]
    }
  ]
}
```

## Streaming

Hvis streaming er slaaet til, returnerer `v1/search` `text/event-stream` i stedet for et enkelt JSON-svar.

Typiske events:

- `connected`: streamen er etableret
- `progress`: loebende status med samme oversaettelsesnoegler som webudgaven
- `result`: det endelige normale search-response som JSON payload
- `error`: fejl payload, hvis soegningen fejler efter streamen er startet

### `progress`-stadier omkring filtervalidering

Ved multi-kilde-soegninger (mere end `pubmed` alene) kan der gaa relativt lang tid mellem `finalizeCollect` og `finalizeHydrate`, fordi resultaterne her valideres mod PubMed/OpenAlex, foer de endelige resultater hentes. For at undgaa et langt, stille hul i streamen emitteres nu ekstra `progress`-events i denne periode (samme stadienavne som webappens egen fremdriftsvisning):

- `finalizeValidatePmid`: PMID-kandidater krydsvalideres mod PubMed.
- `finalizeValidateDoiFetch`: DOI-kandidater hydreres og valideres et for et mod OpenAlex. Ved mange DOI-only-kandidater emitteres dette event flere gange undervejs, med `current`/`total` i payloaden, der angiver hvor langt processen er.

Eksempel:

```text
GET /v1/search?q=exercise+type+2+diabetes&sources=pubmed,openAlex&stream=1
```

```text
event: progress
data: {
data:   "stage": "prepare",
data:   "language": "da",
data:   "messageKey": "semanticSearchProgressPreparing",
data:   "message": "Forbereder soegningen ud fra dine valgte soegeord, afgraensninger og databaser.",
data:   "stepId": "prepare",
data:   "groupId": "prepare",
data:   "groupKey": "semanticSearchProcessGroupPrepare",
data:   "groupLabel": "Forbereder soegningen",
data:   "label": "Forbereder soegningen",
data:   "timestamp": "2026-04-16T12:00:00Z"
data: }

event: result
data: {"apiVersion":"1","results":[...]}
```

Bemærk: naar `stream=1`, er svaret ikke laengere `application/json` men `text/event-stream`. Derfor viser Chrome normalt ikke den saedvanlige JSON "Pretty" toggle for hele responsen.

## Samtidighedsloft

Public search-laget har nu et loft for samtidige aktive soegninger.

- standard: `10` samtidige aktive soegninger
- naar loftet er naaet, returneres `503`
- serveren sender `Retry-After`
- klienten boer vise en besked om at vente og proeve igen senere

## `timing`

Hvert svar (også ved streaming, i `result`-eventet) indeholder et `timing`-objekt, der viser, hvor lang tid selve serverbehandlingen af søgningen tog:

- `startedAt`: tidspunkt (ISO 8601, UTC) for hvornår serveren begyndte at behandle requesten — dvs. før autentificering, rate-limiting og selve søgningen.
- `completedAt`: tidspunkt (ISO 8601, UTC) for hvornår responsen var færdigbygget, umiddelbart før den sendes til klienten.
- `durationMs`: forløbet tid i millisekunder mellem `startedAt` og `completedAt`.
- `durationFormatted`: samme forløbne tid som `durationMs`, men i `tt:mm:ss`-format (fx `"00:00:01"`). Afrundet ned til nærmeste hele sekund.

`durationMs` måler serverens behandlingstid — herunder evt. opslag hos PubMed/OpenAlex/Semantic Scholar/Elicit — men ikke netværkstiden til og fra klienten. Ved cache-hit (se `diagnostics.cache.hit`, hvis `includeDiagnostics=true`) vil `durationMs` typisk være meget lavt, da søgningen ikke skal gå til upstream-kilderne igen.

## `matchesWebOrdering`

`order.matchesWebOrdering` må kun være `true`, når deploymenten eksplicit er sat op til det. Den leveres derfor konservativt som `false` som standard, indtil web og public API reelt kører på samme kanoniske backend-pipeline.

## Abstracts

`abstract` er altid med i hvert resultat.

- Hvis et abstract blev fundet: `hasAbstract=true`
- Hvis intet abstract blev fundet: `abstract=""` og `hasAbstract=false`

PubMed abstracts hydreres via NLM. DOI-bårne resultater hydreres via OpenAlex.

## Berigede felter

Hvert resultat i `results` indeholder desuden en fast, ensartet mængde berigede felter, uanset om resultatet er hydreret via PubMed (`type=pmid`) eller OpenAlex (`type=doi`). Nøglerne er altid til stede; kun værdien varierer efter, hvad kilden kan levere.

- `authors`: liste af `{ name, familyName, givenName, initials }`. `[]` hvis ingen forfattere er fundet.
  - `name` er et **ensartet** visningsnavn på formen `"Efternavn Initialer"` (fx `"Setzler M"`), uanset om resultatet er hydreret via PubMed eller OpenAlex. Det løser den tidligere uensartethed, hvor PubMed typisk gav `"Setzler M"` og OpenAlex gav `"Mark Setzler"`.
  - `familyName`, `givenName` og `initials` leveres separat, så du selv kan sammensætte et andet format (fx `"Fornavn Efternavn"` eller `"Efternavn, Fornavn"`).
  - **Kilde og pålidelighed:** For PubMed-resultater (`type=pmid`) hentes efternavn/fornavn/initialer fra NLM's strukturerede XML-data (samme kald som henter abstract og MeSH), og er derfor pålidelige. Er `includeAbstracts=false`, er denne XML ikke hentet, og `name`/`familyName`/`initials` udledes i stedet ved at splitte esummary's flade navnestreng (fungerer godt for det gængse `"Efternavn Initialer"`-format, men er mindre robust for atypiske navne).
  - For OpenAlex-resultater (`type=doi`) leverer kilden ikke separate navnedele noget sted i deres API (bekræftet direkte mod OpenAlex' live API for både works- og authors-endpoints, ikke kun ud fra hvad vi selv henter). Navnet splittes derfor med samme heuristik og prioritering (`raw_author_name` foretrækkes over `author.display_name`, med understøttelse af både `"Efternavn, Fornavn"`- og `"Fornavn Efternavn"`-format), som webappens søgeformular allerede bruger (`formatOpenAlexAuthorName` i `src/utils/resultAdapters.js`) — så forfatternavne vises ens i webappen og det offentlige API. Heuristikken kan stadig fejle for sammensatte efternavne (fx "van der Berg") — i så fald indeholder `name` det oprindelige, uændrede navn, og `familyName`/`givenName`/`initials` er tomme.
- `publicationTypes`: liste af publikationstyper (fx `"Review"`, `"article"`). `[]` hvis ukendt.
- `journal`: `{ name, issn, volume, issue, pages }`. Tomme strenge, hvis oplysningen ikke findes.
- `language`: ISO-sprogkode, fx `"eng"`. `""` hvis ukendt.
- `pmcId`: PubMed Central-ID, hvis resultatet har et. `""` hvis ikke.
- `topics`: liste af `{ label, source }`, hvor `source` er `"mesh"` (PubMed MeSH-termer) eller `"openAlex"` (OpenAlex' primære emne). `[]` hvis intet er fundet.
- Der findes tre varianter af abstractet, så du selv kan vælge, hvilken der passer bedst til dit formål:
  - `abstract`: én flad, strippet streng uden linjeskift (uændret bagudkompatibel adfærd — samme som altid).
  - `abstractSections`: en liste af `{ label, text }`, der bevarer den oprindelige afsnitsstruktur som strukturerede data:
    - For strukturerede PubMed-abstracts (Background/Methods/Results/Conclusions) er der én indgang pr. sektion, med `label` sat til NLM's sektionsnavn (fx `"BACKGROUND"`).
    - For ustrukturerede PubMed-abstracts, og for OpenAlex-hydrerede resultater (`type=doi`), er der én indgang med `label: ""`, da der her ikke findes mere struktur at udtrække (OpenAlex' `abstract_inverted_index` indeholder ikke afsnitsinformation).
    - `[]` hvis der ikke er noget abstract.
  - `abstractParagraphs`: samme indhold som `abstractSections`, men som en enkelt plain text-streng, hvor sektionerne er skilt med et dobbelt linjeskift (`\n\n`) i stedet for et enkelt mellemrum. Nyttig til visning, hvis du vil have læsevenlige afsnit uden selv at skulle samle `abstractSections`. `""` hvis der ikke er noget abstract.
- `citationCount` / `citationCountSource`: antal citationer og hvilken kilde tallet stammer fra (`"openAlex"` eller `"semanticScholar"`). `citationCount` er `null`, og `citationCountSource` er `""`, når ingen af kilderne har data for det pågældende resultat.
- `isOpenAccess`: `true`/`false`, eller `null` hvis ingen kilde har afgjort det.
- `openAccessUrl`: link til open access-version, hvis kendt fra OpenAlex. `""` ellers.
- `isRetracted`: `true`/`false` fra OpenAlex, eller `null` for resultater der er hydreret via PubMed (PubMed esummary indeholder ikke denne oplysning).
- `aiSummary`: kort AI-genereret resumé fra Semantic Scholar (`tldr`), hvis resultatet har været en Semantic Scholar-kandidat. `""` ellers.

`citationCount` og `isOpenAccess` udfyldes fra Semantic Scholar-kandidatdata, når et resultat er hydreret via PubMed og selv har været en Semantic Scholar-kandidat i søgningen. Findes der ingen sådan kandidatdata, forbliver felterne `null`/`""` — dette er en bevidst "data findes ikke"-tilstand, ikke en fejl.

## Fejl

Typiske fejlstatuskoder:

- `401`: manglende eller ugyldig API key
- `403`: origin ikke tilladt for klienten
- `405`: metode ikke tilladt eller `GET /v1/search` er slået fra
- `422`: request-validering fejlede
- `429`: rate limit overskredet
- `502`: upstream-kilde fejlede
- `503`: serveren er midlertidigt fuldt optaget

### `502`-detaljer

`502 All selected search sources failed or returned no candidates` udløses, når ingen af de valgte `sources` gav brugbare kandidater. `error`-feltet indeholder nu (i parentes) den bagvedliggende årsag pr. kilde, fx:

```json
{
  "error": "All selected search sources failed or returned no candidates (Semantic Scholar matched 12 paper(s) for the resolved query, but none had a PubMed ID or DOI, so they were skipped.)"
}
```

Typiske underliggende årsager:

- Kilden svarede med en HTTP-fejlstatus (fx `HTTP 401`/`402`/`429`/`500`) — typisk pga. manglende/ugyldig/udløbet API-nøgle for kilden på serveren, eller upstream rate-limiting. Selve statuskoden er nu med i beskeden.
- Kilden havde et rent netværksproblem (DNS/timeout/TLS).
- Kilden svarede 200 OK, men fandt 0 resultater for det oversatte/opløste søgeord.
- Kilden svarede 200 OK og fandt resultater, men ingen af dem havde et PubMed-ID eller DOI — `semanticScholar`, `openAlex` og `elicit` kræver et af disse for at et resultat kan hydreres og indgå i `results`.

## Cache

Search-responser sendes med:

- `Cache-Control: no-store, no-cache, must-revalidate`
- `Pragma: no-cache`
- `Expires: 0`
