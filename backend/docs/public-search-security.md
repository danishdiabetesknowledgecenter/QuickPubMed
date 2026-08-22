# Public Search API Security

## Grundregler

- API-nøgler må kun ligge i server-side konfiguration.
- `public-api` må kun eksponere dokumenterede offentlige routes til eksterne klienter.
- `backend/app` må ikke eksponeres direkte via docroot.
- `backend/api` **er** first-party widget-overfladen (CMS script-tag embeds). Den er ikke den offentlige partner-API.
- HTTP search-responser sendes med `Cache-Control: no-store` (browser/proxy). Det er adskilt fra server-side TTL-cache under `data/runtime/` til pipeline/hydration.

## To trust boundaries

### A) Public Search API (`public-api/v1`)

Til eksterne integrationer:

- Auth via API-nøgle
- Per-klient rate limit
- Per-klient source ACL (`allowed_sources`, deny-all-by-default)
- Per-klient CORS (`allowed_origins` / `allow_all_origins`)

### B) First-party widget API (`backend/api`)

Til Mugin Scholar/VCD-widgetten (fx `UnifiedSearch.php`, Summarize*, TranslateTitle, SemanticFinalRerank, NLM/OpenAlex-proxies):

- CORS allowlist via `ALLOWED_DOMAINS` (+ hardcodede first-party hosts)
- **Tom Origin er tilladt** (same-origin GET, lokal Vite-proxy, curl/smoke). Kun *ikke-tom* disallowed Origin afvises med 403.
- Referer-fallback bruges hvor `muginApplyNlmCorsHeaders` anvendes.
- IP-baseret rate limit på dyre routes (`unifiedSearch`, `openaiProxy`) via `MUGIN_FIRST_PARTY_IP_RATE_LIMITS`
- OpenAI-modeller på first-party proxies allowlistes; ukendte modeller mappes til en sikker default
- Ingen per-bruger API-nøgle (samme trust-model som før unified engine)

## Auth-model (public-api)

Primær auth:

- `X-API-Key`
- `Authorization: Bearer <api-key>`

Valgfri test-auth:

- `GET /v1/search?...&apikey=...` (kanonisk lowercase; `apiKey=` accepteres også)

Query-string-baseret auth bør være slået fra som default og bruge en separat, lavprivilegeret testnøgle.

## URL-baseret `apikey`

`apikey` i URL er en convenience-funktion til test, men er sikkerhedsmæssigt svagere end header-baseret auth.

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

### Public API

Inbound rate limiting håndhæves pr. klient.

- `POST /v1/search`: højere integrationsgrænse
- `GET /v1/search`: strammere testgrænse

Når en klient rammer grænsen:

- returneres `429`
- hændelsen audit-logges
- credentials logges ikke i rå form

Hvis rate-limit store ikke kan låses (filesystem-fejl), returneres `503` (fail-closed).

### First-party (`backend/api`)

IP-rate-limit pr. minut (konfigurerbart):

- `unifiedSearch` (default 30)
- `openaiProxy` (default 60) — Summarize*, TranslateTitle, SemanticFinalRerank

ThemeConfig/PublicContent/Telemetry er bevidst uden IP-limit for ikke at knække page-load.

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

### Public API

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

### First-party widget

- CMS-sider (fx `*.videncenterfordiabetes.dk`) kalder typisk `backend/api` cross-origin
- Lokal Vite-dev bør videresende Origin/Referer til PHP (ikke strippe dem)
- Tom Origin afvises **ikke**

## Public docroot

Anbefalet deployment:

- webserver peger partner-API-subdomæne/path på `public-api`
- `public-api` eksponerer `v1/search`, `v1/health` og `v1/openapi.yaml`; alle øvrige stier (inkl. `/`) er search-alias til host-swap (`mugin.dk/…` → `api.mugin.dk/…`)
- Auth og source-ACL er de samme på alias-stier som på `/v1/search`
- widget-host eksponerer `backend/api` til allowlistede CMS-origins (first-party)
- `backend/app` og `backend/config` forbliver uden for public docroot

## Drift

Gode driftsregler:

- roter API-nøgler ved mistanke om kompromittering
- hold `GET`-testen slået fra i miljøer, hvor den ikke bruges
- overvåg `429` og `502`/`503`
- gennemgå audit-loggen jævnligt for ukendte origins eller usædvanlige mønstre
- hold `data/runtime` på lokal disk uden OneDrive/cloud-sync i produktion (fail-closed locks)
