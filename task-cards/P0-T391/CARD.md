# P0-T391 — Dead-letter stub for pulse-api Kafka ingest

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T391-kafka-dlq` |
| Parallel | `yes` (no compose edits; T390 owns compose E2E) |
| Depends | P0-T330 |

## Objective

Stop silently dropping skipped Kafka ingest messages (non-JSON, rejected such as unknown utility, unexpected topic). Env-gated DLQ: topic `vp.dlq.v1` or JSONL file.

## Allowed paths

`apps/pulse-api/src/{ingest,config}/**`, `apps/pulse-api/README.md`, `infra/kafka/**`, `.env.template`, `task-cards/P0-T391/**`.

## Acceptance criteria

- [x] `PULSE_KAFKA_DLQ_ENABLED` (default false), `PULSE_KAFKA_DLQ_TOPIC` (`vp.dlq.v1`), `PULSE_KAFKA_DLQ_FILE` (JSONL if set)
- [x] non_json / rejected / unexpected_topic produce a DLQ record; offset advance unchanged; store errors still throw
- [x] DLQ write failure logged, never blocks offset
- [x] Unit tests; `create-topics.sh` bootstraps `vp.dlq.v1`
- [x] Anti-leak clean

## Evidence

`evidence/01-dlq-tests.md`.

## Limits

Stub: no retry/backoff on DLQ write, no replay tool, no catalog/schema entry (operational topic, not a contract event), raw payload stored verbatim (no size cap).
