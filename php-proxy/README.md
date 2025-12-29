# PHP Proxy til QuickPubMed

Denne mappe indeholder PHP proxy filer der erstatter Azure Functions backend.

## Installation

### 1. Upload filer til din webserver

Upload hele `php-proxy` mappen til din webserver (f.eks. chosting.dk).

Struktur på serveren:
```
dit-domæne.dk/
├── php-proxy/
│   ├── config.php        ← Din API-nøgle her!
│   ├── .htaccess
│   └── api/
│       ├── SummarizeSearch.php
│       ├── TranslateTitle.php
│       ├── SummarizeHTMLArticle.php
│       ├── SummarizePDFArticle.php
│       └── CheckIfResourceIsForbidden.php
```

### 2. Konfigurer API-nøgle

Rediger `config.php` på serveren og indsæt din OpenAI API-nøgle:

```php
define('OPENAI_API_KEY', 'sk-din-rigtige-api-nøgle-her');
```

### 3. Opdater QuickPubMed frontend

I din `.env` fil (eller `.env.production`), opdater URL'en til din PHP proxy:

```
VITE_OPENAI_BASE_URL=https://dit-domæne.dk/php-proxy
```

## Sikkerhed

⚠️ **VIGTIGT:**
- `config.php` med din API-nøgle skal ALDRIG committes til git!
- `.htaccess` filen beskytter `config.php` mod direkte adgang
- Overvej at sætte `ALLOWED_ORIGIN` til dit specifikke domæne

## API Endpoints

| Endpoint | Beskrivelse |
|----------|-------------|
| `/api/SummarizeSearch` | Opsummerer søgeresultater (streaming) |
| `/api/TranslateTitle` | Oversætter titler (streaming) |
| `/api/SummarizeHTMLArticle` | Opsummerer HTML artikler |
| `/api/SummarizePDFArticle` | Opsummerer PDF artikler |
| `/api/CheckIfResourceIsForbidden` | Tjekker ressource tilgængelighed |

## Fejlfinding

### "500 Internal Server Error"
- Tjek at PHP er aktiveret på din webserver
- Tjek PHP error logs
- Sørg for at `curl` extension er aktiveret i PHP

### Streaming virker ikke
- Nogle webhoteller har output buffering aktiveret
- Tjek at `X-Accel-Buffering: no` header sendes

### PDF parsing fejler
- `pdftotext` skal være installeret på serveren (poppler-utils)
- Alternativt kan du installere et PHP PDF bibliotek som Smalot/PdfParser

