# P0-T300 — S2 bus E2E: perception → rules → API findings/alerts

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master S2 primary) |
| Parallel | `ok` vs pulse-web / pulse-store / notify — **serialize** vs other pulse-api contract edits |
| Branch | `vp/P0-T300-s2-bus-e2e` |
| Deps | `P0-T130` (detect→rules file-bus), `P0-T003`/`P0-T050` (pulse-api alerts + auth) |

## Objective

Prove S2 record-upload path: file perception (or fixture) → `grid-rules` → persist findings + alerts in `pulse-api` via HTTP ingest. Document Kafka bus path when `pulse-bus` is up; do not require Kafka for green.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `packages/contracts/events/detect/vp.detect.v1.schema.json`
- `packages/contracts/events/findings/vp.findings.v1.schema.json`
- `packages/contracts/events/alerts/vp.alerts.v1.schema.json`
- `packages/contracts/openapi/openapi.yaml`
- `task-cards/P0-T130/CARD.md` + evidence
- `apps/pulse-api/README.md`

## Allowed paths

- `scripts/s2-bus-e2e.sh`
- `task-cards/P0-T300/**`
- `apps/pulse-api/src/**`
- `apps/pulse-api/test/**`
- `apps/pulse-api/README.md`
- `packages/contracts/openapi/openapi.yaml`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Read-only: `scripts/s2-detect-rules-smoke.sh`, `apps/grid-perception/**`, `apps/grid-rules/**`, other contracts schemas, Gate0 weights under `local-notes/models-experiments/**`.

Do **not** edit pulse-web, pulse-store, Compose ownership trees, or proprietary POC under `local-notes/`.

## Acceptance criteria

- [x] Card + smoke script `scripts/s2-bus-e2e.sh` exist
- [x] Reuses T130 detect→rules glue (`s2-detect-rules-smoke.sh` or equivalent file-bus)
- [x] `pulse-api` exposes findings persist (`POST/GET /api/v1/findings`) + existing alerts ingest
- [x] Script posts findings + alerts; verifies list/get counts
- [x] Evidence under `task-cards/P0-T300/evidence/` (commands + JSON refs + Kafka note)
- [x] Anti-leak: VoltPulse / `vp.*` only
- [x] OpenAPI updated for findings surface

## Validation

```bash
./scripts/s2-bus-e2e.sh
# fixture-only:
GP_FORCE_FIXTURE=1 ./scripts/s2-bus-e2e.sh
cd apps/pulse-api && npm test && npm run test:e2e
rg -ni 'trinetra|t-netra|tnetra' scripts/s2-bus-e2e.sh task-cards/P0-T300/evidence apps/pulse-api/src/findings packages/contracts/openapi/openapi.yaml && exit 1 || true
graphify update .
```

Logged: mode=`perception`, detections=5, findings=5, alerts=3, posted_f=5, posted_a=3.

## Evidence

- `evidence/s2-bus-e2e.md`
- `evidence/detect.v1.json`
- `evidence/findings-alerts.json`
- `evidence/api-posted.json`
- `evidence/api-listed.json`

## Anti-leak

- [x] VoltPulse names only (`grid-perception`, `grid-rules`, `pulse-api`, `vp.*`)
- [x] No proprietary paste / internal brand strings

## Notes

- HTTP ingest is the green path today (MemoryStore). Kafka consumer into Nest is later; script only documents bus when reachable.
- Prefer starting a local `pulse-api` if `/health` down; tear down only if script spawned it.
- Requires built local packages (`@voltpulse/alert-policy`, `@voltpulse/work-order`) before rules/api start — same as other host smokes.
