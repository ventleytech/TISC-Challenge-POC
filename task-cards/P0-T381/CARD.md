# P0-T381 — pulse-gateway real image + compose service

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T381-gateway-compose` |
| Parallel | `no` (compose file) |
| Depends | P0-T380, P0-T371 |

## Objective

Replace the alpine `sleep infinity` stub for `pulse-gateway` with a real Node image built from `apps/pulse-gateway`, wired in compose with a `/health` healthcheck and the T380 pull/detect-sink env.

## Allowed paths

`apps/pulse-gateway/Dockerfile`, `infra/compose/docker-compose.yml` (pulse-gateway service only), `.env.template` (gateway keys), `task-cards/P0-T381/**`, plan row.

## Acceptance criteria

- [x] `apps/pulse-gateway/Dockerfile` (pulse-api pattern: repo-root context, multi-stage, non-root, HEALTHCHECK on `/health`)
- [x] Compose `pulse-gateway` builds `voltpulse/pulse-gateway:dev`; env: port, pull URLs, detect sink/file/topic, Kafka brokers
- [x] MinIO `bitnamilegacy` digests, Kafka, Postgres, api/web/rules/perception untouched; all 6 profiles `config` ok
- [x] `docker compose build pulse-gateway` + `up` healthy + curl pull/sync + frame → bus file
- [x] Gateway tests still pass; anti-leak clean

## Evidence

`evidence/01-build-up-health.md`.

## Known limits

No RTSP/RTMP server binds `PULSE_GATEWAY_RTSP_PORT` (still a session registry stub; MediaMTX swap is a later card). Kafka sink in compose needs `pulse-bus` up (profile stream/data) — not a `depends_on`, so media profile alone stays light. File bus lives in container `/data/bus` (no volume).
