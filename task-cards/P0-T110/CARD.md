# P0-T110 — Compose store profile → real MinIO

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `no` vs other compose editors; **sole owner** of store services in compose + store env keys |
| Branch | `vp/P0-T110-minio-compose` |
| Deps | `P0-T001` (compose skeleton), `P0-T007` / `P0-T070` (pulse-store client) |

## Objective

Upgrade Compose profile `store` from alpine stub to a real MinIO image, wire bucket env from `.env.template` (placeholder secrets only), and document how `apps/pulse-store` points at that MinIO endpoint.

## Input docs

- `docs/architecture.md` (Object store / `store` profile)
- `docs/anti-leak.md`
- `docs/storage-retention.md` (if present)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `infra/compose/**`
- `.env.template` (repo root — store-related keys only)
- `apps/pulse-store/README.md` (pointer doc only; no behavior change)
- `task-cards/P0-T110/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (T110 row / status only)

Do **not** edit `apps/pulse-api`, `pulse-web`, `grid-perception`, `packages/responsibility`, `packages/audit`. No live image pull required if disk/network tight — `docker compose … config` is enough.

## Acceptance criteria

- [x] `pulse-store` service uses a real MinIO image (not alpine stub)
- [x] Bucket-related env documented in `.env.template` (placeholder secrets only)
- [x] Optional bucket-init service creates buckets from env list
- [x] `docker compose … --profile store config` validates
- [x] Evidence documents how `apps/pulse-store` points at MinIO
- [x] Anti-leak clean on touched paths
- [x] Minimal diff — store-related compose/env only

## Validation

```bash
cp -n .env.template .env   # local only; gitignored
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile store config >/dev/null
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile store config | rg -n 'minio/minio|PULSE_STORE_BUCKET|pulse-store-buckets'
rg -ni 'trinetra|t-netra|tnetra' infra/compose .env.template task-cards/P0-T110 && exit 1 || true
```

## Evidence

Write under `./evidence/` (commands + short output; how pulse-store → MinIO).

## Anti-leak

- [x] Service / project names VoltPulse only (`voltpulse`, `pulse-store`)
- [x] No real secrets; template placeholders only
- [x] Never commit `.env`

## Notes

- Base branch: `vp/P0-T070-retention-hold` (includes T001 compose + T007/T070 store client).
- Live `docker pull` / `up` optional — config validation satisfies this card.
