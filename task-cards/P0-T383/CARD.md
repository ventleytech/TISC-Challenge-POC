# P0-T383 — pulse-notify real image + compose service

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T383-notify-compose` |
| Parallel | `no` (compose file; T382 edits grid-rules service — union on merge) |
| Depends | P0-T360, P0-T365, P0-T381 |

## Objective

Replace the alpine `sleep infinity` stub for `pulse-notify` with a real Node image built from `apps/pulse-notify`, wired in compose with a `/health` healthcheck, T360 sink env and T365 Kafka consumer env.

## Allowed paths

`apps/pulse-notify/Dockerfile`, `infra/compose/docker-compose.yml` (pulse-notify service only), `.env.template` (notify keys), `task-cards/P0-T383/**`, plan row.

## Acceptance criteria

- [x] `apps/pulse-notify/Dockerfile` (gateway pattern: repo-root context, multi-stage, non-root `node`, HEALTHCHECK on `/health`)
- [x] Compose `pulse-notify` builds `voltpulse/pulse-notify:dev`; env: port, topic, adapter/webhook/file sink (T360), Kafka flag/client/group/from-beginning + brokers (T365), ack mode, API base
- [x] MinIO digests, Kafka, Postgres and other services untouched; all 6 profiles `config` ok
- [x] `docker compose build pulse-notify` + `up` healthy + Kafka backlog consumed to file sink
- [x] Notify tests pass; anti-leak clean

## Evidence

`evidence/01-build-up-health.md`.

## Known limits

Kafka consumer needs `pulse-bus` running (not a `depends_on`, so `data` profile services start independently). File sink lives in container `/data/notify` (no volume). `PULSE_NOTIFY_FILE_PATH_CONTAINER` maps to `PULSE_NOTIFY_FILE_PATH` so host-path values in `.env` do not leak into the container.
