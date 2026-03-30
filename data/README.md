# Runtime data

Denne mappe indeholder driftsdata, som ikke skal overskrives ved backend-deploy:

- `content/` - editorindhold (`<domain>/topics.json`, `<domain>/prompt-rules.json`, `shared/limits.json`, `<domain>/limits-settings.json`)
- `runtime/` - audit-logs og rate-limit-filer
- `cache/` - backend-cache (fx text-fetch cache)

Bemærk: eksisterende filer fra `backend/storage/content` skal flyttes til `data/content`.

Sikkerhed: `data/.htaccess` blokerer direkte webadgang til hele `data/` på Apache.

Ved Nginx kan du bruge snippetten i `data/nginx-data-deny.conf.example`.

Domænespecifik konfiguration:
- Opret evt. `data/content/<domain>/domain-config.json`.
- Se skabelon i `data/content/domain-config.example.json`.
- Mulige sektioner: `openai`, `nlm`, `unpaywall`, `theme_overrides`.
- Hvis en indstilling mangler i domænefilen, bruges backend-konfigurationen automatisk.
