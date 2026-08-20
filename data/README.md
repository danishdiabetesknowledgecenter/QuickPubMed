# Runtime data

Denne mappe indeholder driftsdata, som ikke skal overskrives ved backend-deploy:

- `content/` - editorindhold (`<domain>/topics.json`, `<domain>/prompt-rules.json`, `shared/limits.json`, `<domain>/limits-settings.json`)
- `runtime/` - audit-logs, search-pipeline-cache og rate-limit-filer
- `cache/` - backend-cache (NLM-response, OpenAlex-work, text-fetch)

Cache/runtime holdes i skak uden cron: udløbne cache-filer slettes ved læsning
(lazy-delete), og writes triggerer en probabilistisk directory-sweep
(`backend/app/file-cache.php`). Justér evt. `MUGIN_FILE_CACHE_*` /
`MUGIN_IP_RATE_LIMIT_FILE_MAX_AGE_SECONDS` i `backend/config/config.php`.

Bemærk: eksisterende filer fra `backend/storage/content` skal flyttes til `data/content`.

Sikkerhed: `data/.htaccess` blokerer direkte webadgang til hele `data/` på Apache.

Ved Nginx kan du bruge snippetten i `data/nginx-data-deny.conf.example`.

Domænespecifik konfiguration:
- Opret evt. `data/content/<domain>/domain-config.json`.
- Se skabelon i `data/content/domain-config.example.json`.
- Mulige sektioner: `openai`, `nlm`, `unpaywall`, `theme_overrides`.
- Hvis en indstilling mangler i domænefilen, bruges backend-konfigurationen automatisk.
