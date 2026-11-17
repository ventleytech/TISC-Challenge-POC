# P0-T006 — `pulse-notify` mock (consume / SMS-push / ack)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog T006) |
| Parallel | `ok` vs M* / T001 / T002 / T003 / T005 (app-only) |
| Branch | `vp/P0-T006-pulse-notify` |
| Deps | Prefer contracts (`vp.alerts.v1`) present; Kafka optional (mock bus OK) |

## Objective

Scaffold `apps/pulse-notify` as a mock notify worker: consume `vp.alerts.v1`-shaped alerts, deliver via mock SMS/push adapters, and call an ack/receipt hook (log or POST toward pulse-api). App-only — do not rewrite root Compose (T001 already stubs the service).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `packages/contracts/events/catalog.yaml`
- `packages/contracts/events/alerts/vp.alerts.v1.schema.json`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-notify/**`
- `task-cards/P0-T006/evidence/**`
- `task-cards/P0-T006/CARD.md` (status flip only)

Do **not** edit: `apps/pulse-api/**`, `apps/pulse-web/**`, `models-experiments/**`, `infra/compose/docker-compose.yml` (T001 owner).

## Acceptance criteria

- [x] `apps/pulse-notify` boots (dev/start) with health endpoint
- [x] Mock consumer accepts `vp.alerts.v1`-shaped payloads (topic name `vp.alerts.v1`)
- [x] Mock SMS + push channel adapters record deliveries (log/in-memory)
- [x] Ack/receipt hook fires after delivery (log and/or configurable API POST)
- [x] Config via settings/env template — no hardcoded hosts/ports/secrets in logic
- [x] Anti-leak: VoltPulse / `vp.*` names only; no proprietary paste
- [x] Evidence under `./evidence/` with smoke commands + short output

## Validation

```bash
cd apps/pulse-notify && npm ci && npm test && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-notify && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-notify-mock.md`).

## Anti-leak

- [x] VoltPulse names only (`pulse-notify`, `vp.alerts.v1`)
- [x] No proprietary notify contracts / topic catalogs

## Notes

- Compose service shell already exists on T001 (`pulse-notify` profile `data`); this card owns the app image/code only.
- Real Kafka consumer is a later card — mock inject bus is enough for P0.
