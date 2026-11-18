# P0-T382 — grid-rules compose runs the real rules loop

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T382-rules-compose-loop` |
| Parallel | `no` (compose file; T383 pulse-notify block → union on merge) |
| Depends | P0-T340, P0-T380, P0-T381 |

## Objective

Container `grid-rules` serves `/health` **and** runs detect → findings/alerts (file bus and/or Kafka, env-gated), instead of a health-only stub.

## Allowed paths

`apps/grid-rules/**`, `infra/compose/docker-compose.yml` (grid-rules service only), `.env.template` (grid-rules keys), `task-cards/P0-T382/**`, plan row.

## Acceptance criteria

- [x] `serve.ts` keeps `/health` (compose healthcheck) and starts the loop; `/health` reports loop inputs/outputs/counters
- [x] Inputs: file tail (`GRID_RULES_DETECT_FILE`), Kafka consumer (flag + `KAFKA_BROKERS`). Outputs: file (`GRID_RULES_OUT_DIR`), Kafka producer (flag + `KAFKA_BROKERS`)
- [x] Compose env wired from `.env.template`; Kafka flags default off; MinIO `bitnamilegacy`, gateway, api/web untouched
- [x] Unit tests (tail, loop file→file, idle) + compose build/up/smoke (file path and Kafka path)
- [x] Anti-leak clean

## Evidence

`evidence/01-compose-smoke.md`.

## Known limits

File bus is container-local (no shared volume with `pulse-gateway`); Kafka is the cross-container path. File tail restarts from offset 0 on container restart (no offset persistence). Failed emit on the file path is logged, not retried.
