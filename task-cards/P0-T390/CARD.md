# P0-T390 — Full Compose file-bus E2E smoke

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T390-compose-bus-e2e` |
| Parallel | `yes` (script + evidence only; no compose / app edits) |
| Depends | T300, T310, T381, T382, T385 |

## Objective

One script proving pulse-gateway → shared `pulse_bus_files` → grid-rules → pulse-api (Postgres) inside real Compose containers, isolated under project `vp390`.

## Allowed paths

`scripts/s2-compose-bus-e2e.sh`, `scripts/README.md`, `task-cards/P0-T390/**`, plan row.

## Acceptance criteria

- [x] Isolated project `-p vp390`: own volumes, host ports (3390/3391/5439/8590), `container_name` reset via temp override; default stack (`vp-pulse-bus`, `vp-pulse-postgres`) untouched
- [x] Gateway synthetic frame (`202 sink=file`) lands in `vp.detect.v1.jsonl`; grid-rules `/health` loop counters detects/findings/alerts = 1, rejected = 0
- [x] `vp.findings.v1.jsonl` / `vp.alerts.v1.jsonl` read back from the shared volume
- [x] Bus findings/alerts POSTed to compose `pulse-api`; `GET /api/v1/findings|alerts` list them; rows confirmed in compose Postgres
- [x] `down -v` for `vp390` only (trap); MinIO digests untouched (compose file not edited)

## Path used

File bus + HTTP glue (T300 style). **Not** Kafka (no `pulse-bus` in vp390); Kafka hop remains covered by T336 (`s2-rules-kafka-api-e2e.sh`).

## Follow-ups

- No in-container bus→API bridge: the script does the POST from the host. A pulse-api file-bus reader or grid-rules HTTP sink would remove the glue.
- `grid-perception` image-inbox variant not exercised (CPU stub image has no detector weights; T384).
- Full-Kafka compose variant (`GRID_RULES_KAFKA_*` + `PULSE_KAFKA_CONSUMER_ENABLED`) in one project: not done.

## Evidence

`evidence/01-compose-bus-e2e.md` (+ raw bus jsonl, health, API/psql outputs).
