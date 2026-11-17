# P0-T150 — Work-order export (A07)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | Master catalog A07 (`local-notes/05-roadmap-assumptions/06-master-execution-plan.md`); spine plan optional status row |
| Parallel | `ok` vs apps/* (pure package) |
| Branch | `vp/P0-T150-work-order` |
| Deps | Soft: A04 party hint shape (`packages/responsibility` or caller-supplied); contracts detection/severity enums |

## Objective

Ship pure `@voltpulse/work-order`: map finding + asset + party hint → work-order row(s), export as CSV and JSON. No Nest/UI/Kafka wiring.

## Input docs

- `docs/product/requirements.md` (detection enum; vendor/responsibility)
- `docs/product/feature-catalog.md` (A07 / A04)
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `packages/contracts/enums/detection.json`
- `packages/contracts/enums/severity.json`
- `packages/contracts/events/findings/vp.findings.v1.schema.json`
- Requirements note: work-order export CSV/JSON/PDF stub OK early

## Allowed paths

- `packages/work-order/**`
- `task-cards/P0-T150/**`
- `docs/repo-structure.md` (one-line package list only, optional)

Do **not** edit: `apps/**`, `infra/**`, `packages/contracts/**`, `packages/responsibility/**`, or other workers’ trees.

## Acceptance criteria

- [x] Package `@voltpulse/work-order` under `packages/work-order/` with README
- [x] Pure map: finding + asset + party hint → one work-order row (stable columns)
- [x] Batch helper → CSV string and JSON array/string
- [x] Detection ids + severity align with VoltPulse contracts
- [x] Party hint fields: at least `party_type` (A04); optional `warranty_hint` / `tender_ref`
- [x] Unit tests: single row, multi-row CSV header+cells, JSON round-trip, missing optional fields
- [x] No internal product brand strings / proprietary paste
- [x] Evidence under `./evidence/` with test output + anti-leak grep

## Validation

```bash
cd packages/work-order && npm install && npm test && npm run build
rg -ni 'trinetra|t-netra|tnetra' packages/work-order && exit 1 || true
test -f packages/work-order/README.md
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-unit-tests.md`).

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary work-order schemas / customer corridors
- [x] Synthetic demo field values only in fixtures/tests

## Notes

- Consumed later by `pulse-api` / `pulse-web` export endpoints — out of scope.
- Accept party hint as input (do not hard-depend on `@voltpulse/responsibility` until merged).
- PDF stub deferred; CSV + JSON satisfy A07 early stub.
