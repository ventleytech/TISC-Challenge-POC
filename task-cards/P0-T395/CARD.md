# P0-T395 — Compose Kafka-path E2E (gateway → rules → api + notify)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T395-compose-kafka-e2e` |
| Parallel | `yes` (script + evidence only; no compose / app edits) |
| Depends | T393, T365, T335, T330 |

## Objective

Prove the real Kafka hop in Compose: `vp.detect.v1` → grid-rules (Kafka in + out) → `vp.findings.v1` / `vp.alerts.v1` → pulse-api consumer (Postgres) and pulse-notify consumer (file sink), isolated project `vp395`.

## Allowed paths

`scripts/s2-compose-kafka-e2e.sh`, `scripts/README.md`, `task-cards/P0-T395/**`, plan row.

## Acceptance criteria

- [x] Isolated `-p vp395`: own broker (host ports 19395/19396), Postgres (5445), API/notify/gateway ports; `container_name` reset via temp override; default stack (`vp-pulse-bus`, `vp-pulse-postgres`) and MinIO images/digests untouched
- [x] Services: pulse-bus, topics one-shot, postgres, pulse-api (`PULSE_KAFKA_CONSUMER_ENABLED=true`), grid-rules (consumer + producer on, HTTP sink off), pulse-notify (`KAFKA_ENABLED`, `ADAPTER=file`), gateway (`DETECT_SINK=kafka`) — or `VP395_SYNTHETIC=1` (console-producer, no gateway)
- [x] Topics dump (`kafka-vp.*.jsonl`) shows 1 detect → ≥1 finding → ≥1 alert for the run's inspection id
- [x] API: `GET /api/v1/findings` + `/alerts` ids == topic ids; Postgres `findings=1 alerts=1`
- [x] Notify file `/data/notify/alerts.jsonl`: alert ids == topic alert ids (2 lines: `push`, `sms`; email skipped)
- [x] pulse-api log has no `skip rejected` / `skip non-JSON`
- [x] `down -v` for `vp395` only (trap); no volumes left over

## Notes

- Host script only reads (plus one gateway POST / one synthetic produce). No grid-rules HTTP sink — would duplicate ids with the API consumer.
- Rules + notify consume from beginning so start order cannot race the first event.
- Full gateway run builds images (~90 s); `VP395_NO_BUILD=1` reuses them.

## Evidence

`evidence/` (gateway mode) and `evidence/synthetic/` (VP395_SYNTHETIC=1): `result.txt`, `asserted.json`, `kafka-vp.*.jsonl`, `api-listed.json`, `notify-alerts.jsonl`, `postgres-rows.txt`, health + service logs; `01-compose-kafka-e2e.md` summary.
