# Eksterne API-specifikationer (reference)

Denne mappe indeholder officielle OpenAPI-specifikationer (YAML/JSON) for de tredjeparts-API'er, QuickPubMed integrerer med. Filerne er **rå referencemateriale hentet fra udbyderne** — de er ikke skrevet af QuickPubMed-teamet og skal ikke redigeres manuelt. Erstat filen med en ny download, hvis udbyderens API ændrer sig.

Formålet er at have en versioneret, søgbar kopi af den kontrakt, vores egen kode (`backend/api/*.php`) implementerer imod — så man hurtigt kan slå et felt/parameter op uden at skulle ud på nettet, og så fremtidige migreringer (som Elicit v1→v2) har et konkret sammenligningsgrundlag.

## Filer

- `elicit-openapi.yaml` / `elicit-openapi.json` — Elicit API v2 (`https://elicit.com/api/v2`), hentet fra [docs.elicit.com](https://docs.elicit.com). Samme spec i to formater. Bruges af `backend/api/ElicitSearch.php` og `backend/app/public-search-lib.php` (`qpmPublicSearchFetchElicitSourceResult`).
- `openalex-openapi.json` — OpenAlex API (`https://api.openalex.org`, 43 paths, primært `/works` relevant for os). Bruges af `backend/api/OpenAlexSearch.php` og `backend/api/OpenAlexWorkLookup.php`.
- `semanticscholar-openapi.json` — Semantic Scholar "Academic Graph API" (Swagger 2.0, ikke OpenAPI 3; `basePath: /graph/v1`). Vi bruger `/paper/search` (relevans-rangeret, batch-hentet i sider af 100, cap 1.000 resultater totalt) — **ikke** `/paper/search/bulk`, som ikke er relevans-rangeret og derfor ville skade det RRF-baserede rerank. Bruges af `backend/api/SemanticScholarSearch.php` og `backend/app/public-search-lib.php` (`qpmPublicSearchFetchSemanticScholarSourceResult`).

Dette er **ikke** det samme som `backend/docs/public-search-openapi.yaml`, som er QuickPubMed's *egen* offentlige API-kontrakt (den, eksterne klienter integrerer imod), ikke en reference til en tredjeparts-API.
