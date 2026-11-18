# P0-T365 — pulse-notify Kafka consumer

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T365-notify-kafka` |
| Depends | P0-T360 |

## Objective

Optional Kafka consumer for `vp.alerts.v1` that feeds the existing T360 delivery pipeline (log/webhook/file).

## Allowed paths

`apps/pulse-notify/**`, `.env.template`, `task-cards/P0-T365/**`

## Design

- Gate: `PULSE_NOTIFY_KAFKA_ENABLED=true` **and** `KAFKA_BROKERS` (same pattern as grid-rules). Flag without brokers → warn, skip.
- Topic from `PULSE_ALERTS_TOPIC`; group/client/from-beginning via `PULSE_NOTIFY_KAFKA_*`.
- Reuses `parseVpAlertsV1` + `processAlertEvent`; `POST /internal/consume` unchanged.
- Malformed/non-JSON → warn + skip (offset advances). Sink failures already non-throwing.

## Acceptance criteria

- [x] Env-gated consumer, default off
- [x] Contract parse + T360 adapters reused; HTTP inject intact
- [x] Unit tests (gate, valid→file sink, malformed skip)
- [x] Live smoke vs pulse-bus (`localhost:9094`)
- [x] Only allowed paths touched; no secrets; anti-leak clean

## Evidence

`evidence/01-tests.txt` (10 tests, 3 new), `evidence/02-smoke-kafka.txt` (`ok: true`).

## Known limits

At-least-once; no dedupe on redelivery, no DLQ, `consumed` in-memory list unbounded (pre-existing mock). Compose env wiring not done (Dockerfile/compose out of scope).
