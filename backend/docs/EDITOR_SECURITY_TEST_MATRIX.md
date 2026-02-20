# Editor Security Test Matrix

Denne testmatrix er lavet til den nye editor-sikkerhedsopsætning:

- multi-user (`EDITOR_USERS`)
- domæne-/filters-autorisation
- CSRF/session timeout
- revisionshistorik + revert
- audit logging

## Forudsætninger

- `EDITOR_REQUIRE_HTTPS=true` i produktion.
- Mindst to brugere i `EDITOR_USERS`:
  - `editor` (kan topics + filters)
  - `topics_only` (kan topics i udvalgte domæner, men **ikke** filters)
- Kendt testdomæne, fx `diabetes`.
- Backend URL (eksempel):
  - `https://<host>/backend/api`

## Variabler (eksempel)

```bash
BASE_URL="https://<host>/backend/api"
ORIGIN="https://<allowed-origin>"
TOPIC_DOMAIN="diabetes"
USER_FULL="editor"
PASS_FULL="<password>"
USER_TOPICS="topics_only"
PASS_TOPICS="<password>"
COOKIE_JAR="./editor-cookie.txt"
```

## A. Authentication + Session

### A1. Login success (gyldig bruger)
- Request: `POST /EditorLogin.php`
- Forventet:
  - HTTP `200`
  - `ok: true`
  - `csrfToken` til stede
  - `capabilities` til stede

```bash
curl -i -c "$COOKIE_JAR" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/EditorLogin.php" \
  --data "{\"user\":\"$USER_FULL\",\"password\":\"$PASS_FULL\"}"
```

### A2. Login fail (forkert password)
- Forventet:
  - HTTP `401`
  - `error: "Invalid credentials"`

### A3. Session status efter login
- Request: `GET /EditorSession.php`
- Forventet:
  - HTTP `200`
  - `authenticated: true`
  - `csrfToken`
  - `capabilities`

```bash
curl -i -b "$COOKIE_JAR" \
  -H "Origin: $ORIGIN" \
  "$BASE_URL/EditorSession.php"
```

### A4. Logout
- Request: `POST /EditorLogout.php` med CSRF
- Forventet:
  - HTTP `200`
  - `ok: true`
- Efterfølgende session-check:
  - `authenticated: false`

## B. CORS / Origin

### B1. Allowed origin
- Kald editor-endpoint med gyldig `Origin`.
- Forventet:
  - `Access-Control-Allow-Origin: <samme origin>`
  - `Access-Control-Allow-Credentials: true`

### B2. Ikke tilladt origin
- Kald editor-endpoint med ikke-allowlisted `Origin`.
- Forventet:
  - HTTP `403`
  - `error: "Origin is not allowed"`

## C. Authorization (domæner + filters)

### C1. Domains-list er brugerfiltreret
- Request: `GET /EditorContent.php?action=domains&type=domains`
- Forventet:
  - kun domæner som bruger må redigere

```bash
curl -i -b "$COOKIE_JAR" \
  -H "Origin: $ORIGIN" \
  "$BASE_URL/EditorContent.php?action=domains&type=domains"
```

### C2. topics_only: læs/skriv tilladt domæne
- `GET type=topics&domain=<allowed>`
- `POST type=topics&domain=<allowed>`
- Forventet:
  - HTTP `200`

### C3. topics_only: nægtet på ikke-tilladt domæne
- `GET/POST type=topics&domain=<not_allowed>`
- Forventet:
  - HTTP `403`
  - `error: "Forbidden for this domain"`

### C4. topics_only: filters er forbudt
- `GET/POST type=filters`
- Forventet:
  - HTTP `403`
  - `error: "Forbidden for filters"`

## D. CSRF og metodekontrol

### D1. POST uden CSRF
- `POST /EditorContent.php` uden header/body token
- Forventet:
  - HTTP `403`
  - `error: "Invalid CSRF token"`

### D2. POST med forkert CSRF
- Forventet:
  - HTTP `403`

### D3. Method not allowed
- fx `GET /EditorLogin.php`
- Forventet:
  - HTTP `405`

## E. Payload validation / limits

### E1. Ugyldig type
- `type=invalid`
- Forventet:
  - HTTP `400`

### E2. Manglende topics-array
- `POST type=topics` med `data` uden `topics`
- Forventet:
  - HTTP `400`

### E3. For stor request body
- overskrid `EDITOR_MAX_REQUEST_BYTES`
- Forventet:
  - HTTP `413`

### E4. For dybt / for mange noder
- generér payload over grænser
- Forventet:
  - HTTP `413`

## F. Revisionshistorik + revert

### F1. Save opretter revision-id
- `POST action=save` (default) på topics/filters
- Forventet:
  - HTTP `200`
  - `revisionId` i svar

### F2. Hent revisioner
- `GET action=revisions&type=topics&domain=<domain>`
- Forventet:
  - HTTP `200`
  - `revisions[]` med `revisionId`, `createdAt`, `user`, `checksum`

### F3. Revert gyldig revision
- `POST action=revert` + `revisionId`
- Forventet:
  - HTTP `200`
  - `revertedFromRevisionId`
  - filindhold matcher revision

### F4. Revert ugyldig revisionId
- Forventet:
  - HTTP `400` (format) eller `404` (ikke fundet)

### F5. Retention (25)
- Kør >25 saves på samme målfil.
- Forventet:
  - kun seneste `EDITOR_MAX_REVISIONS` beholdes i `history/...`

## G. Audit logging

### G1. Login/logout/save/revert events logges
- Kontroller `backend/storage/runtime/editor-audit-YYYY-MM-DD.log`
- Forventet:
  - JSONL entries med felter:
    - `ts`, `event`, `user`, `ip`, `origin`, `method`, `path`, `context`

### G2. Retention af audit-log
- Sæt lav `EDITOR_AUDIT_RETENTION_DAYS` i test.
- Forventet:
  - gamle `editor-audit-*.log` fjernes automatisk.

## H. UI checks (Editor.js)

### H1. Capabilities styrer UI
- `topics_only`:
  - `filters` option er skjult/deaktiveret
  - domæneliste viser kun tilladte domæner

### H2. Revisionspanel
- Historik vises efter login.
- “Opdater historik” henter ny liste.
- “Gendan valgt version” kræver bekræftelse og opdaterer data/status.

## Go-live minimum acceptance

- [ ] A1, A3, A4 passer
- [ ] B1 + B2 passer
- [ ] C2, C3, C4 passer
- [ ] D1 passer
- [ ] E3 passer
- [ ] F1, F2, F3 passer
- [ ] G1 passer
- [ ] H1 + H2 passer
