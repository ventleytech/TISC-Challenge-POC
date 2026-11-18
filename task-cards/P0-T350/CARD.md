# P0-T350 — Evidence API + MinIO store + Evidence page

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `no` (touches pulse-api, pulse-web, openapi) |
| Branch | `vp/P0-T350-evidence-minio` |
| Deps | P0-T337 (`utility_id` on findings) |

## Objective

Evidence objects (crops/frames) stored in an S3-compatible bucket (MinIO) behind `pulse-api`, indexed by tenant, served via HMAC-signed content paths, and shown in a rich `pulse-web` Evidence page (live when `VITE_PULSE_API_URL` is set, mock otherwise).

## Input docs

- `docs/architecture.md`, `docs/anti-leak.md`
- `packages/contracts/openapi/openapi.yaml`

## Allowed paths

- `apps/pulse-api/**`, `apps/pulse-web/**`
- `packages/contracts/openapi/openapi.yaml`
- `scripts/seed-evidence.py`, `.env.template`
- `task-cards/P0-T350/**`

## Acceptance criteria

- [x] `GET/POST /api/v1/evidence`, `GET /evidence/{id}`, `GET /evidence/{id}/content` (signed, no API key)
- [x] Backend `memory` (default) or `minio` via `PULSE_STORE_*` config; no hardcoded hosts/secrets
- [x] Tenant scoping (`utility_id`): wrong tenant 403, unauth 401, tampered signature 401
- [x] OpenAPI documents evidence routes and keeps `utility_id` on findings/inspections/assets
- [x] Unit + e2e tests green
- [x] `scripts/seed-evidence.py` seeds demo crops
- [x] `EvidencePage`: gallery, filters, detail/locator view, source badge (live vs mock)
- [x] Smoke against real MinIO (`evidence/smoke.sh`, output `evidence/smoke-minio.txt`)

## Validation

```bash
cd apps/pulse-api && npm run build && npx jest && npm run test:e2e
cd apps/pulse-web && npx tsc --noEmit && npm run build
bash task-cards/P0-T350/evidence/smoke.sh   # needs MinIO + API (backend=minio)
```

## Evidence

`./evidence/`: `smoke-minio.txt`, `smoke.sh`, `seed-output.txt`, `01-verify.md`.

## Anti-leak

- [x] VoltPulse names only (`vp`, `pulse-api`, `pulse-web`)
- [x] No proprietary paste; secrets only in env template placeholders

## Notes

Live web: set `VITE_PULSE_API_URL` (+ `VITE_PULSE_API_KEY`). Compose/Dockerfile changes out of scope.
