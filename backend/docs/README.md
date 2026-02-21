# Backend struktur

`backend` er nu den kanoniske serverstruktur:
Denne mappe er den kanoniske web-indgang (`/backend`) til server-endpoints.

- `api/`: HTTP-endpoints.
- `app/`: intern delt kode (auth, content-store, helpers).
- `config/`: konfiguration og secrets (`config.php` holdes udenfor git).
- `storage/`: data der ændres i drift (editor content + runtime filer).
- `docs/`: dokumentation.

`php-proxy` kan bevares midlertidigt som kompatibilitetslag, men ny kode bør pege på `backend`.

## Editor-sikkerhed og drift

### Konfiguration

Editoren styres via `backend/config/config.php` (ikke i git):

- `EDITOR_REQUIRE_HTTPS`: skal være `true` i produktion.
- `EDITOR_USERS`: flerbrugeropsætning med rettigheder.
- `EDITOR_ALLOWED_CONTENT_DOMAINS`: global domæneallowlist.
- `EDITOR_MAX_REQUEST_BYTES`, `EDITOR_MAX_TREE_DEPTH`, `EDITOR_MAX_TOTAL_NODES`, `EDITOR_MAX_TEXT_LENGTH`: inputgrænser.
- `EDITOR_MAX_REVISIONS`: antal gemte revisioner pr. fil.
- `EDITOR_AUDIT_ENABLED`, `EDITOR_AUDIT_RETENTION_DAYS`: auditlog.

Eksempel på `EDITOR_USERS`:

```php
define('EDITOR_USERS', [
    'editor' => [
        'password_hash' => '$2y$10$...',
        'allowed_domains' => ['diabetes', 'dementia'],
        'can_edit_filters' => true,
        'disabled' => false,
    ],
    'topics_only' => [
        'password_hash' => '$2y$10$...',
        'allowed_domains' => ['diabetes'],
        'can_edit_filters' => false,
        'disabled' => false,
    ],
]);
```

### Revisionshistorik og revert

- Ved hver `save` oprettes snapshot af den tidligere version automatisk.
- Revisionsfiler gemmes under `history/` ved siden af den redigerede content-fil.
- `filters` ligger i `backend/storage/content/filters/filters.json`.
- Kun de seneste `EDITOR_MAX_REVISIONS` beholdes (standard: 25).
- Revert kan udføres via editor-API (`action=revert`) og kræver auth + CSRF + samme rettigheder som save.

### Audit-log

- Audit events skrives til `backend/storage/runtime/editor-audit-YYYY-MM-DD.log`.
- Loggen inkluderer bl.a. event-type, bruger, IP/origin, path og kontekst.
- Ældre logfiler roteres automatisk ud fra `EDITOR_AUDIT_RETENTION_DAYS`.
