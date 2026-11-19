# P0-T380 — pulse-gateway live-pull stub

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T380-gateway-pull` |
| Depends | P0-T040 |

## Objective

Extend T040 gateway beyond health/registry: configured pull-URL list + env-gated synthetic `vp.detect.v1` publish (file bus or Kafka).

## Allowed paths

`apps/pulse-gateway/**`, `.env.template` (gateway keys), `task-cards/P0-T380/**`. Compose untouched (no gateway Dockerfile yet; avoids T371 overlap).

## Acceptance criteria

- [x] `GET /pull/targets`, `POST /pull/sync` (idempotent) from `PULSE_GATEWAY_PULL_URLS`
- [x] `POST /sessions/:id/frames` → file or Kafka, default off (409)
- [x] Event matches `vp.detect.v1` required fields; honest `reason`
- [x] Tests (11 pass), curl smoke file + Kafka, consumed from topic
- [x] Anti-leak clean; no secrets

## Evidence

`evidence/01-tests.txt`, `02-smoke-curl-file.txt`, `03-smoke-curl-kafka.txt`, `04-kafka-consume.txt`.

## Known limits

No actual RTSP pull/frame decode. Compose still alpine sleep stub. Kafka producer connects at boot (fails fast). Bad stream `path` still yields 500 (pre-existing T040 plain Error).
