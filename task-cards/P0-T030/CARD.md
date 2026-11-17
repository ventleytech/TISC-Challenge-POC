# P0-T030 — `pulse-train` stub (labels → queue → retrain → reload)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog O04–O07 / Stream J) |
| Parallel | `ok` vs store / rules / perception / notify (app-only) |
| Branch | `vp/P0-T030-pulse-train` |
| Deps | Prefer contracts (`vp.labels.v1`, `vp.models.v1`) present; Kafka optional (mock bus OK) |

## Objective

Scaffold `apps/pulse-train` as an O04–O07 story stub: accept `vp.labels.v1`-shaped TP/FP labels, keep a dataset queue, enqueue/status retrain jobs, hold a model registry stub, and fire a reload hook stub (log/HTTP noop). App-only — do not rewrite root Compose (T001 already stubs the service).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/feature-catalog.md` (O04–O07)
- `packages/contracts/events/catalog.yaml`
- `packages/contracts/events/labels/vp.labels.v1.schema.json`
- `packages/contracts/events/models/vp.models.v1.schema.json`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-train/**`
- `task-cards/P0-T030/evidence/**`
- `task-cards/P0-T030/CARD.md`

Do **not** edit: `apps/pulse-store/**`, `apps/grid-rules/**`, `apps/grid-perception/**`, `apps/pulse-notify/**`, `infra/compose/docker-compose.yml` (T001 owner).

## Acceptance criteria

- [x] `apps/pulse-train` boots (dev/start) with health endpoint
- [x] Mock consumer accepts `vp.labels.v1`-shaped TP/FP label payloads (topic `vp.labels.v1`)
- [x] Dataset queue lists accepted labels (in-memory and optional file persist)
- [x] Retrain job stub: enqueue + status (`queued` → `running` → `completed`/`failed`)
- [x] Model registry stub + reload hook stub (`log` / `http` noop)
- [x] Config via settings/env template — no hardcoded hosts/ports/secrets in logic
- [x] Anti-leak: VoltPulse / `vp.*` names only; no proprietary paste
- [x] Evidence under `./evidence/` with smoke commands + short output

## Validation

```bash
cd apps/pulse-train && npm ci && npm test && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-train && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-train-stub.md`).

## Anti-leak

- [x] VoltPulse names only (`pulse-train`, `vp.labels.v1`, `vp.models.v1`)
- [x] No proprietary train contracts / topic catalogs

## Notes

- Compose service shell already exists on T001 (`pulse-train` profile `data`); this card owns the app code only.
- Real Kafka + GPU retrain deferred — mock inject + stub job status is enough for P0 story spine.
