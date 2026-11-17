# P0-T003 — `pulse-api` Nest health + OpenAPI mount

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs perception / M*; prefer branch from merged or shared T002 |
| Branch | `vp/P0-T003-pulse-api` |
| Deps | `P0-T002` |

## Objective

Scaffold `apps/pulse-api` Nest app with health endpoint and OpenAPI mount pointing at VoltPulse contract stubs — no full domain CRUD yet.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Contracts from `packages/contracts/**` (after T002)

## Allowed paths

- `apps/pulse-api/**`
- `task-cards/P0-T003/evidence/**`
- `task-cards/P0-T003/CARD.md` (status flip only)

Read-only consume `packages/contracts/**`. Do not rewrite contract schemas here (fix via T002 follow-up if needed).

## Acceptance criteria

- [x] `P0-T002` done (or worktree branched with contracts present)
- [x] Nest skeleton under `apps/pulse-api/`
- [x] Health route responds 200
- [x] OpenAPI/Swagger mount present; paths align with `/api/v1/inspections|assets|alerts` stubs
- [x] Config via settings/env template keys — no hardcoded secrets/hosts in business logic
- [x] Anti-leak clean; VoltPulse naming in package/service ids
- [x] Evidence with smoke commands

## Validation

```bash
# example — adjust to scaffold chosen
cd apps/pulse-api && npm test || npm run start:dev &
curl -sf http://127.0.0.1:${PULSE_API_PORT:-3000}/health
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] Service name `pulse-api`; VoltPulse OpenAPI only
- [x] No proprietary DTO/topic paste

## Notes

- Starts `blocked` until T002 clears. Overnight: do not start before contracts exist.
- Empty catch banned; typed errors at API boundary when handlers appear later.
