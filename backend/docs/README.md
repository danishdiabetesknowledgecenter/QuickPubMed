# Backend struktur

`backend` er nu den kanoniske serverstruktur:
Denne mappe er den kanoniske web-indgang (`/backend`) til server-endpoints.

- `api/`: HTTP-endpoints.
- `app/`: intern delt kode (auth, content-store, helpers).
- `config/`: konfiguration og secrets (`config.php` holdes udenfor git).
- Data ligger i repo-roden under `data/` (editor content + runtime filer).
- `docs/`: dokumentation.

## Relevante docs

- `backend/docs/saadan-virker-soegningen.md`: intro-venlig forklaring af søgeflow og rerank i helt almindeligt sprog — god som introduktion eller til at forklare kodens opførsel til ikke-teknikere.
- `backend/docs/semantic-doi-only-rules.md`: vedligeholdelse af semantiske post-valideringsregler, schema, motor og eksempler på `postValidation.rules`.
- `backend/docs/semantic-source-filters.md`: vedligeholdelse af `semanticConfig.sourceFilters`, kilde-specifikke filterværdier og hvornår de bør bruges.
- `backend/docs/search-flow-readme.md`: pædagogisk gennemgang af det samlede search flow fra UI-valg til PubMed- og semantisk retrieval inkl. enrichment-laget og den hybride rerank-formel.
- `backend/docs/search-flow-diagram.md`: mermaid-diagrammer af hoveflowet, retrieval-subflow, enrichment og hybridvalidering.
- `backend/docs/semantic-filter-regression-checklist.md`: fast manuel regressionscheckliste for de vigtigste kanoniske semantiske filtercases, inkl. afsnittet `Reranking signals`.
- `backend/docs/public-search-api.md`: kontrakt og eksempler for det offentlige NemPubMed search API.
- `backend/docs/public-search-openapi.yaml`: formel OpenAPI-spec for det offentlige search API.
- `backend/docs/public-search-security.md`: auth, CORS, rate limits, audit og driftsregler for public API.
- `backend/docs/public-search-parity.md`: principper og teststrategi for rangering/paritet mellem web og API, inkl. hybride kvalitetssignaler.

### Rerank og enrichment

Den hybride rerank-model lever i:

- `src/utils/semanticReranking.js` — deterministisk rerank med RRF + kvalitetssignaler.
- `backend/api/ICiteLookup.php` — batch-lookup til NIH iCite (RCR, nih_percentile, is_clinical, cited_by_clin, apt).
- `backend/api/OpenAlexAuthorityLookup.php` — batch-lookup til OpenAlex (forfatter-h-index, journal 2yr_mean_citedness).
- `backend/api/SemanticFinalRerank.php` — valgfri LLM-slutrerank med berigede kvalitetssignaler.
- `QPM_RERANK_CONFIG` i `backend/config/config.php` — styrer alle vægte. Se `backend/config/config.example.php` for tuning-profiler (konservativ, moderat, aggressiv).
- `scripts/verify-rerank-parity.js` — Node-script der beviser at neutrale defaults giver 1:1 samme rangering som før kvalitetslaget.

`php-proxy` kan bevares midlertidigt som kompatibilitetslag, men ny kode bør pege på `backend`.

## CMS script-referencer (frontend assets)

Ved integration i CMS skal widget-scripts refereres med lowercase filnavne:

- `assets/searchform.js`
- `assets/searchstrings.js`
- `assets/references.js`
- `assets/editor.js`

CMS mount-containere bør bruge `qpm-` prefiks for at undgå selector-konflikter:
- SearchForm: `class="qpm-searchform"` + `id="qpm-searchform-<n>"`
- SearchStrings: `id="qpm-searchstrings"` + `class="qpm-searchstrings"`
- References: `class="qpm-references"` + `id="qpm-references-<n>"`
- Editor: `id="qpm-editor"` + `class="qpm-editor"`

## Naming conventions

- `backend/api`: PascalCase endpoint filnavne (fx `EditorContent.php`, `PublicContent.php`)
- `backend/app`: lowercase helper-filer (fx `helpers.php`, `editor-auth.php`)
- `backend/config`: lowercase config-filer (`config.php`, `config.example.php`)
- frontend widget-scripts, der kaldes fra CMS, skal refereres med lowercase assetnavne i `dist/assets` (se sektionen ovenfor)

## Editor-sikkerhed og drift

### Konfiguration

Editoren styres via `backend/config/config.php` (ikke i git):

- `EDITOR_REQUIRE_HTTPS`: skal være `true` i produktion.
- `EDITOR_USERS`: flerbrugeropsætning med rettigheder.
- `EDITOR_ALLOWED_CONTENT_DOMAINS`: global domæneallowlist.
- `EDITOR_MAX_REQUEST_BYTES`, `EDITOR_MAX_TREE_DEPTH`, `EDITOR_MAX_TOTAL_NODES`, `EDITOR_MAX_TEXT_LENGTH`: inputgrænser.
- `EDITOR_MAX_REVISIONS`: antal gemte revisioner pr. fil.
- `EDITOR_AUDIT_ENABLED`, `EDITOR_AUDIT_RETENTION_DAYS`: auditlog.

Derudover kan hvert domæne have egen backend-override i:
- `data/content/<domain>/domain-config.json`
- Mulige sektioner: `openai`, `nlm`, `unpaywall`, `theme_overrides`.
- Manglende værdier falder automatisk tilbage til `backend/config/config.php`.

Eksempel på `EDITOR_USERS`:

```php
define('EDITOR_USERS', [
    'editor' => [
        'password_hash' => '$2y$10$...',
        'allowed_domains' => ['diabetes', 'dementia'],
        'can_edit_limits' => true,
        'disabled' => false,
    ],
    'topics_only' => [
        'password_hash' => '$2y$10$...',
        'allowed_domains' => ['diabetes'],
        'can_edit_limits' => false,
        'disabled' => false,
    ],
]);
```

### Revisionshistorik og revert

- Ved hver `save` oprettes snapshot af den tidligere version automatisk.
- Revisionsfiler gemmes under `history/` ved siden af den redigerede content-fil.
- `limits` ligger i `data/content/shared/limits.json`.
- Kun de seneste `EDITOR_MAX_REVISIONS` beholdes (standard: 25).
- Revert kan udføres via editor-API (`action=revert`) og kræver auth + CSRF + samme rettigheder som save.

### Audit-log

- Audit events skrives til `data/runtime/editor-audit-YYYY-MM-DD.log`.
- Loggen inkluderer bl.a. event-type, bruger, IP/origin, path og kontekst.
- Ældre logfiler roteres automatisk ud fra `EDITOR_AUDIT_RETENTION_DAYS`.
