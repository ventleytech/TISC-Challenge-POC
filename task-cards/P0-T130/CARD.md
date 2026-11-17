# P0-T130 — S2 detect → rules file-bus smoke

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master S2 glue) |
| Parallel | `ok` vs pulse-api / pulse-web / pulse-store / MinIO worker — **avoid** those paths |
| Branch | `vp/P0-T130-detect-rules-glue` |
| Deps | `P0-T010` (`grid-perception` → `vp.detect.v1`), `P0-T020` (`grid-rules` findings/alerts) |

## Objective

Glue file-path smoke: perception ingest (or fixture detect JSON) → `grid-rules` → findings/alerts JSON under evidence. Proves S2 detect→rules hop without Kafka / MinIO / API.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md`
- `packages/contracts/events/detect/vp.detect.v1.schema.json`
- `packages/contracts/events/findings/**` + `alerts/**` (as present)
- `apps/grid-perception/README.md`
- `apps/grid-rules/README.md`
- Evidence: `task-cards/P0-T010/evidence/file-ingest-smoke.md`, `task-cards/P0-T020/evidence/01-grid-rules-smoke.md`

## Allowed paths

- `scripts/s2-detect-rules-smoke.sh`
- `task-cards/P0-T130/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Read-only: `apps/grid-perception/**`, `apps/grid-rules/**`, `packages/contracts/**`, Gate0 weights under `local-notes/models-experiments/**` (gitignored).

Do **not** edit `apps/pulse-api`, `apps/pulse-web`, `apps/pulse-store`, Compose MinIO worker ownership, or proprietary POC trees under `local-notes/`.

## Acceptance criteria

- [x] Smoke script runs end-to-end on file bus (no Kafka required)
- [x] Prefer live `grid-perception` file-ingest when venv + weights available; else fixture `vp.detect.v1` JSON
- [x] `grid-rules` consumes detect → writes findings + alerts JSON to `task-cards/P0-T130/evidence/`
- [x] Evidence note with commands + short summary (counts, top risk, SLA present)
- [x] Anti-leak: VoltPulse / `vp.*` / `grid-perception` / `grid-rules` only
- [x] Branch carries both apps (cherry-pick / merge T010 + T020)

## Validation

```bash
./scripts/s2-detect-rules-smoke.sh
# optional force fixture path:
GP_FORCE_FIXTURE=1 ./scripts/s2-detect-rules-smoke.sh
rg -ni 'trinetra|t-netra|tnetra' scripts/s2-detect-rules-smoke.sh task-cards/P0-T130/evidence && exit 1 || true
graphify update .
```

Logged: mode=`perception`, detections=5, findings=5, alerts=3, top_risk=30.94.

## Evidence

- `evidence/s2-detect-rules-smoke.md`
- `evidence/detect.v1.json`
- `evidence/findings-alerts.json`

## Anti-leak

- [x] Topics `vp.detect.v1` / `vp.findings.v1` / `vp.alerts.v1`
- [x] No proprietary DeepStream / internal brand paths in tracked smoke

## Notes

- File-bus only — Kafka glue is a later card.
- Smoke defaults `GRID_RULES_ALERT_MIN_SEVERITY=low` so Gate0 demoted confidences still emit SLA alerts; override via env.
- If GPU busy / venv missing, fixture mode still counts as green for rules glue; note mode in evidence.
