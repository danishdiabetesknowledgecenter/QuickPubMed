# Backend struktur

`backend` er nu den kanoniske serverstruktur:
Denne mappe er den kanoniske web-indgang (`/backend`) til server-endpoints.

- `api/`: HTTP-endpoints.
- `app/`: intern delt kode (auth, content-store, helpers).
- `config/`: konfiguration og secrets (`config.php` holdes udenfor git).
- `storage/`: data der ændres i drift (editor content + runtime filer).
- `docs/`: dokumentation.

`php-proxy` kan bevares midlertidigt som kompatibilitetslag, men ny kode bør pege på `backend`.
