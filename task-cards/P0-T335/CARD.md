# P0-T335 — grid-rules Kafka producer

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `yes` (disjoint from pulse-api T330 consumer) |
| Branch | `vp/P0-T335-rules-kafka-producer` |
| Deps | T020, T210 (bus), T330 (consumer, counterpart) |

## Objective

grid-rules publishes `vp.findings.v1` and `vp.alerts.v1` to Kafka, matching `packages/contracts`. Off by default; stdout/memory bus unchanged.

## Allowed paths

- `apps/grid-rules/**`
- `task-cards/P0-T335/**`

## Acceptance criteria

- [x] Kafka producer publishes findings + alerts (payload = contract shape, JSON)
- [x] Brokers, topic names, client id from env/Settings only
- [x] Feature flag `GRID_RULES_KAFKA_PRODUCER_ENABLED` + `KAFKA_BROKERS`; either unset → no-op, file/stdout bus still works
- [x] Unit test (fake producer) + live smoke against compose `pulse-bus`
- [x] Anti-leak: only `vp.*` topics

## Evidence

`evidence/smoke-kafka-publish.md` — 17/17 tests, no-op run, live publish (offsets +3 findings / +2 alerts, consumed samples), enabled-without-brokers skip.

## Notes

- Message key = `inspection_id` (alerts fall back to `finding_id`). Older samples with null key in the topic came from other producers.
- Smoke needs compose Kafka (`pulse-bus`, host `localhost:9094`); unit test does not.
- Local `@voltpulse/*` packages must be built (`npm run build` in `packages/alert-policy`, `packages/responsibility`) before grid-rules tests — pre-existing.
