# P0-T100 — Audit trail + board prioritisation packages

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog W09/C09/W01) |
| Parallel | `ok` vs apps (packages-only) |
| Branch | `vp/P0-T100-audit-priority` |
| Deps | — (contracts enums for severity; no app edits) |

## Objective

Ship shared TypeScript packages: append-only **audit** events (W09) and **prioritisation** board sort/filter helpers (C09 / W01 input) so `pulse-api` / `pulse-web` can consume without duplicating rules logic.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md` (severity, risk)
- `docs/product/feature-catalog.md` (C09, W01, W09)
- `packages/contracts/enums/severity.json`

## Allowed paths

- `packages/audit/**`
- `packages/prioritisation/**`
- `task-cards/P0-T100/**`

Do **not** edit `apps/pulse-api`, `pulse-web`, `pulse-store`, `grid-perception`, `pulse-train`, `pulse-gateway`, `grid-rules`.

## Acceptance criteria

- [x] `packages/audit` append-only helper: who / when / action / entity (+ utility scope); no update/delete API
- [x] Audit unit tests cover append, list/filter, and reject of mutation attempts
- [x] `packages/prioritisation` board sort (risk desc) + filter helpers for C09/W01 ranking input
- [x] Prioritisation unit tests cover sort stability and filters
- [x] Evidence under `task-cards/P0-T100/evidence/` with test output + anti-leak grep
- [x] No Trinetra / proprietary paste; VoltPulse names only

## Validation

```bash
cd packages/audit && npm install && npm test
cd packages/prioritisation && npm install && npm test
rg -ni 'trinetra|t-netra|tnetra' packages/audit packages/prioritisation && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse names only (`@voltpulse/*`, `vp.*` references OK)
- [x] No proprietary paste

## Notes

- Severity×criticality **score** stays in `grid-rules`; this package sorts/filters board rows that already carry `risk_score`.
- Optional later: Nest/web wire-up (separate cards).
