# pulse-store

VoltPulse object-store helper (E01/E02): MinIO-oriented config from env, inspection-scoped evidence keys, put/get with filesystem fallback.

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

Compose profile `store` / service `pulse-store` is owned by T001 (placeholder). This package is the app-level client.

## Evidence keys

See `docs/storage-retention.md`:

```text
{utility_id}/insp_{inspection_id}/evidence/ev_{sha256_12}.{ext}
```

## Smoke

```bash
npm ci && npm test && npm run smoke
# optional:
PULSE_STORE_BACKEND=minio npm run smoke
```
