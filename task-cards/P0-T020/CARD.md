# P0-T020 — `grid-rules` findings / alerts / W01 risk

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master Stream F) |
| Parallel | `ok` vs pulse-api / pulse-web / notify / models — **disjoint** `apps/grid-rules` |
| Branch | `vp/P0-T020-grid-rules` |
| Deps | `P0-T002` contracts (`vp.detect.*` / `vp.findings.*` / `vp.alerts.*`) |

## Objective

Scaffold `apps/grid-rules` that consumes synthetic `vp.detect.v1` (fixture / in-process mock bus), emits `vp.findings.v1` + `vp.alerts.v1` with severity, **W01** risk score (`severity × criticality × confidence`), and SLA fields — Flink-ready contracts, mock-friendly local run (no Kafka required).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md`
- `packages/contracts/events/**` + `enums/**`
- Plan / inventory: Stream F + W01 in `local-notes/05-roadmap-assumptions/06-master-execution-plan.md` (read-only)

## Allowed paths

- `apps/grid-rules/**`
- `task-cards/P0-T020/**`
- `task-cards/P0-T020/CARD.md` (status flip)

Read-only: `packages/contracts/**`. Do **not** edit `apps/pulse-notify`, `apps/pulse-web`, `models-experiments`, or rewrite whole Compose (README + local script only).

## Acceptance criteria

- [x] `apps/grid-rules` package with config via settings (no hardcoded secrets/hosts in logic)
- [x] Synthetic / fixture `vp.detect.v1` → ≥1 `vp.findings.v1` with `severity` + `risk_score` (W01)
- [x] Matching `vp.alerts.v1` emit includes `sla_due_at` (+ channels stub)
- [x] Asset criticality (and optional voltage class) influences risk score
- [x] Unit/smoke tests prove ranking + SLA mapping
- [x] Anti-leak: VoltPulse / `vp.*` / `grid-rules` only
- [x] Evidence under `./evidence/`

## Validation

```bash
cd apps/grid-rules && npm test
cd apps/grid-rules && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules && exit 1 || true
graphify update .
```

## Evidence

- `evidence/01-grid-rules-smoke.md`

## Anti-leak

- [x] Service name `grid-rules`; topics `vp.findings.*` / `vp.alerts.*`
- [x] No proprietary Flink job / topic paste

## Notes

- Prefer in-process fixture bus over Compose Kafka for this card.
- Real Flink packaging can follow; keep emit shapes aligned with contracts.
- Mock-friendly so notify/API can consume emitted JSON later.
