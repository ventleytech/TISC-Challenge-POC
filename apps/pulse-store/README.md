# pulse-store

VoltPulse object-store helper (E01–E04): MinIO-oriented config from env, inspection-scoped evidence keys, put/get, retention tiers, legal hold.

## Config (`PULSE_STORE_*`)

| Key | Role |
|-----|------|
| `PULSE_STORE_BACKEND` | `fs` (default) \| `minio` |
| `PULSE_STORE_ENDPOINT` | MinIO/S3 endpoint URL |
| `PULSE_STORE_BUCKET` | Bucket name (default `voltpulse-evidence`) |
| `PULSE_STORE_ACCESS_KEY` / `PULSE_STORE_SECRET_KEY` | Credentials from env only |
| `PULSE_STORE_REGION` | Region (default `us-east-1`) |
| `PULSE_STORE_FS_ROOT` | Local root for `fs` backend |
| `PULSE_STORE_USE_SSL` | Override SSL flag |
| `PULSE_STORE_HOT_DAYS` | Age &lt; N → hot (default 30) |
| `PULSE_STORE_WARM_DAYS` | Age &lt; N → warm; else expire (default 365) |

Compose profile `store` runs **MinIO** as service `pulse-store` (T110). This package is the app-level client:

1. Bring up store: `docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile store up -d`
2. Point client: `PULSE_STORE_BACKEND=minio` + `PULSE_STORE_ENDPOINT=http://pulse-store:9000` (same network) or `http://127.0.0.1:9000` (host + published ports)
3. Credentials / bucket: same `PULSE_STORE_ACCESS_KEY` / `SECRET_KEY` / `BUCKET` as `.env.template`

M07 thin = env policy only.

## Evidence keys

See `docs/storage-retention.md`:

```text
{utility_id}/insp_{inspection_id}/evidence/ev_{sha256_12}.{ext}
```

## Smoke

```bash
npm ci && npm test && npm run smoke && npm run smoke:retention
# optional:
PULSE_STORE_BACKEND=minio npm run smoke
```
