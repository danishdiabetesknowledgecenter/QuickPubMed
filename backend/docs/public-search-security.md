# Public Search API Security

## Grundregler

- API-nøgler må kun ligge i server-side konfiguration.
- `public-api` må kun eksponere dokumenterede offentlige routes.
- Interne backend-filer under `backend/app` og `backend/api` må ikke gøres direkte offentlige via docroot.
- Search-responser må ikke caches.

## Auth-model

Primær auth:

- `X-API-Key`
- `Authorization: Bearer <api-key>`

Valgfri test-auth:

- `GET /v1/search?...&apiKey=...`

Query-string-baseret auth bør være slået fra som default og bruge en separat, lavprivilegeret testnøgle.

## URL-baseret `apiKey`

`apiKey` i URL er en convenience-funktion til test, men er sikkerhedsmæssigt svagere end header-baseret auth.

Den kan lække via:

- webserverlogs
- reverse proxies
- browserhistorik
- tredjepartsmonitorering
- copy/paste af links

Konsekvens:

- slå den fra i produktion, hvis den ikke er nødvendig
- brug helst særskilte testnøgler
- giv strammere rate limits til `GET`

## Rate limiting

Inbound rate limiting håndhæves pr. klient.

- `POST /v1/search`: højere integrationsgrænse
- `GET /v1/search`: strammere testgrænse

Når en klient rammer grænsen:

- returneres `429`
- hændelsen audit-logges
- credentials logges ikke i rå form

## Audit-log

Audit-loggen skrives til `data/runtime/public-search-api-YYYY-MM-DD.log`.

Den logger blandt andet:

- tidspunkt
- klient-id
- metode og route
- origin
- query-tekst
- sources
- side og page size
- status
- partial/warnings
- latency

API-nøgler maskeres. Rå header- eller query-string-værdier må aldrig logges.

## CORS

Browserbrug fra tredjepartsdomæner kan køres i to modeller pr. klient:

- allowlist-model via `allowed_origins`
- model B via `allow_all_origins => true`

Regler:

- API-hostnavnet er uafhængigt af CORS. Et hostnavn som `api.nempubmed.dk` bør pege på `public-api`, ikke på `backend/api`.
- `allowed_origins` beskriver browser-domæner, ikke API'ets eget domæne.
- når `allow_all_origins` er slået til for en klient, bliver API key den primære browser-adgangskontrol sammen med rate limiting
- browser-origin skal ellers være kendt for klienten via `allowed_origins`
- server-to-server er stadig den sikreste integrationsform

Model B bør stadig bruges med omtanke:

- brug helst særskilte browser-nøgler pr. partner/app
- hold kvoterne strammere end for server-side integrationsnøgler
- forvent ikke, at en browser-nøgle kan holdes hemmelig

## Public docroot

Anbefalet deployment:

- webserver peger API-subdomæne eller API-path på `public-api`
- `public-api` indeholder kun ruterne `v1/search`, `v1/health` og `v1/openapi.yaml`
- intern kode bliver liggende uden for public docroot

## Drift

Gode driftsregler:

- roter API-nøgler ved mistanke om kompromittering
- hold `GET`-testen slået fra i miljøer, hvor den ikke bruges
- overvåg `429` og `502`
- gennemgå audit-loggen jævnligt for ukendte origins eller usædvanlige mønstre
