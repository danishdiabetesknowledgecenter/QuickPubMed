# Source clients (Fase 3)

Shared modules for OpenAlex, Semantic Scholar, and Elicit fetch/normalize logic.

- Proxy endpoints under `backend/api/*Search.php` and the unified path in `public-search-lib.php` should call these helpers instead of duplicating request/response parsing.
- Start small: `openalex-helpers.php` holds abstract reconstruction used by both `OpenAlexSearch.php` and `public-search-lib.php`.
- Prefer extracting only stable, side-effect-free helpers here; keep orchestration and rate-limit policy in the callers.
