# P0-T002 — Contracts stubs (`vp.*` + OpenAPI)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs all `P0-M*` and vs `P0-T001` / `P0-T005` |
| Branch | `vp/P0-T002-contracts` |
| Deps | — |

## Objective

Scaffold `packages/contracts` with VoltPulse event topic stubs (`vp.*`) and a minimal OpenAPI skeleton for `/api/v1/inspections`, `/assets`, `/alerts` — so Nest and rules can mount without inventing names later.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md` (detection enum, inspection status)
- `docs/adr/0001-final-architecture-now.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `packages/contracts/**`
- `task-cards/P0-T002/evidence/**`
- `task-cards/P0-T002/CARD.md` (status flip only)

Do **not** implement Nest handlers, Flink jobs, or perception emit logic here.

## Acceptance criteria

- [x] Package tree exists under `packages/contracts/` (README + stub layout)
- [x] Event/schema stubs name topics: `vp.detect.*`, `vp.findings.*`, `vp.alerts.*`, `vp.labels.*`, `vp.models.*` (at least one concrete stub file each domain or a catalog + examples)
- [x] OpenAPI stub lists `/api/v1/inspections`, `/api/v1/assets`, `/api/v1/alerts`
- [x] Detection enum uses VoltPulse ids: `crack | sag | corrosion | vegetation | thermal_hotspot`
- [x] Inspection status enum: `planned | in_progress | processing | review | closed | cancelled`
- [x] No internal product brand strings / proprietary topic prefixes
- [x] Evidence note with tree listing + anti-leak grep result

## Validation

```bash
test -d packages/contracts
rg -n 'vp\.(detect|findings|alerts|labels|models)' packages/contracts
rg -n '/api/v1/(inspections|assets|alerts)' packages/contracts
rg -ni 'trinetra|t-netra|tnetra' packages/contracts && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-stubs.md`).

## Anti-leak

- [x] VoltPulse names only (`vp.*`, pulse/grid services in comments if any)
- [x] No proprietary paste of topic catalogs or internal OpenAPI
- [x] Conceptual open stack OK; fresh contracts

## Notes

- Preferred parallel overnight track #2 while M001/M002 run.
- After `done`, unblock `P0-T003`.
- Before explore: `graphify query "contracts vp topics OpenAPI"`.
