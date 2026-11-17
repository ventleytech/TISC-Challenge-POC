# P0-T004 — `pulse-api` in-memory `/api/v1` stubs (C08 / S2 prep)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog C08/S2) |
| Parallel | `ok` vs web/ML; serialize vs other `apps/pulse-api` writers |
| Branch | `vp/P0-T004-api-stubs` |
| Deps | `P0-T003` |

## Objective

Add in-memory Nest handlers for `/api/v1/inspections`, `/assets`, `/alerts` matching `packages/contracts` OpenAPI stubs — foundation for C08 inspection history and S2 record-upload (no Postgres/auth yet).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `packages/contracts/openapi/openapi.yaml`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-api/**`
- `task-cards/P0-T004/evidence/**`
- `task-cards/P0-T004/CARD.md` (status flip only)

Read-only: `packages/contracts/**`.

## Acceptance criteria

- [x] `GET/POST /api/v1/inspections` (+ get by id) work in-memory; `utility_id` required on list
- [x] `GET/POST /api/v1/assets` (+ get by id) work in-memory
- [x] `GET/POST /api/v1/alerts` (+ get by id) work in-memory
- [x] Responses align with contract schemas (status / severity / detection enums)
- [x] Create returns `{ id }` (201); missing id → 404 typed
- [x] Config still via settings; no hardcoded secrets; anti-leak clean
- [x] Evidence with curl smoke

## Validation

```bash
cd apps/pulse-api && npm test && npm run test:e2e
npm run build && PULSE_API_PORT=3000 node dist/main.js &
curl -sf -X POST http://127.0.0.1:3000/api/v1/inspections \
  -H 'content-type: application/json' \
  -d '{"utility_id":"00000000-0000-4000-8000-000000000001"}'
curl -sf 'http://127.0.0.1:3000/api/v1/inspections?utility_id=00000000-0000-4000-8000-000000000001'
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api --glob '!node_modules/**' && exit 1 || true
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse paths/names only
- [x] No proprietary DTO paste

## Notes

- Memory store is intentional stub (`shortcut:` → Postgres in later card).
- C10 auth/RBAC **out of scope** — follow-up card.
- Do not edit OpenAPI here; open T002 follow-up if schema gap.
