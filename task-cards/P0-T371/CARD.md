# P0-T371 — MinIO image re-pin

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `no` (compose file) |
| Branch | `vp/P0-T371-minio-image-pin` |
| Deps | P0-T110, P0-T350 |

## Objective

Replace unpullable `minio/minio` / `minio/mc` pins in `pulse-store` + `pulse-store-buckets` with pullable, **pinned** images that still serve `apps/pulse-store` and pulse-api evidence.

## Allowed paths

- `infra/compose/docker-compose.yml`
- `task-cards/P0-T371/**`, `task-cards/P0-T350/evidence/NOTES.md`

## Decision

Official `minio/minio` and `quay.io/minio/minio` tags no longer pull. Use `bitnamilegacy/minio:2025.4.22@sha256:50cec18a…` (same MinIO release as before) and `bitnamilegacy/minio-client:2025.4.16@sha256:8a86e441…`, both tag + digest. Bitnami images run non-root: data volume at `/bitnami/minio/data`, ports via `MINIO_API_PORT_NUMBER` / `MINIO_CONSOLE_PORT_NUMBER`, `MC_CONFIG_DIR=/tmp/.mc` for mc. `.env.template` unchanged (same `PULSE_STORE_*` keys; notify kafka keys untouched).

Ceiling: `bitnamilegacy` is a frozen archive (no security updates). Upgrade path: official image again if registry access returns, or build MinIO from source.

## Acceptance

- [x] Images pull
- [x] `compose --profile store config` shows pinned images
- [x] `up` → `/minio/health/live` 200, buckets `voltpulse-evidence`, `voltpulse-models` created
- [x] No internal brand strings

## Evidence

`evidence/00-pull.txt`, `evidence/01-compose-smoke.txt`
