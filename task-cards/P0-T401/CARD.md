# P0-T401 — schedule/assets write-through

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | cost-efficient remaining build |
| Parallel | `no` (pulse-web) |
| Branch | `main` (serial) |

## Objective

Schedule wizard + asset registry POST through live API (planned inspections + assets), not mock-only.

## Input docs

- `apps/pulse-web/src/mock/client.ts`
- `docs/anti-leak.md`

## Allowed paths

- `apps/pulse-web/src/**`
- `task-cards/P0-T401/**`

## Acceptance criteria

- [x] `createAsset` client → `POST /assets`
- [x] Assets page create form write-through
- [x] Schedule wizard loads candidates via `listAssets` + `createInspection` (throws on live failure)
- [x] `npm run build` green

## Validation

```bash
cd apps/pulse-web && npm run build
```

## Evidence

`./evidence/verify.md`
