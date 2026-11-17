# P0-T110 — MinIO compose config validation

Date: 2026-11-18  
Branch: `vp/P0-T110-minio-compose` (from `vp/P0-T070-retention-hold`)

## Commands

```bash
cp -n .env.template .env
docker compose -p voltpulse -f infra/compose/docker-compose.yml \
  --env-file .env --profile store config >/dev/null
# exit 0

docker compose -p voltpulse -f infra/compose/docker-compose.yml \
  --env-file .env --profile store config \
  | rg -n 'minio/minio|minio/mc|PULSE_STORE_BUCKET|vp-pulse-store|pulse_store_data'
```

## Short output (relevant lines)

```text
container_name: vp-pulse-store
PULSE_STORE_BUCKET: voltpulse-evidence
PULSE_STORE_BUCKETS: voltpulse-evidence,voltpulse-models
image: minio/minio:RELEASE.2025-04-22T22-12-26Z
source: pulse_store_data
container_name: vp-pulse-store-buckets
image: minio/mc:RELEASE.2025-04-16T18-13-26Z
pulse_store_data:
  name: voltpulse_pulse_store_data
```

Live `docker pull` / `up` **not** required for this card (disk/network optional). Config validates.

## How `apps/pulse-store` points at MinIO

| Layer | Setting |
|-------|---------|
| Compose service | `pulse-store` = MinIO server (`minio/minio`), ports 9000/9001 |
| Buckets | `pulse-store-buckets` (`minio/mc`) creates `PULSE_STORE_BUCKETS` |
| Template | Root `.env.template` `PULSE_STORE_*` (placeholders only) |
| Client | `apps/pulse-store` `loadSettings()` → `MinioObjectStore` when `PULSE_STORE_BACKEND=minio` |
| Endpoint in-network | `PULSE_STORE_ENDPOINT=http://pulse-store:9000` |
| Endpoint from host | `PULSE_STORE_ENDPOINT=http://127.0.0.1:9000` (published ports) |
| Auth / bucket | Same `PULSE_STORE_ACCESS_KEY` / `SECRET_KEY` / `BUCKET` as MinIO root + primary bucket |

Default template `PULSE_STORE_BACKEND=fs` keeps unit/smoke offline; switch to `minio` after `compose --profile store up`.

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' infra/compose .env.template apps/pulse-store/README.md
# no matches
```
