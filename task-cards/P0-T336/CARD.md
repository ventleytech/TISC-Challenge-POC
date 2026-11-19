# P0-T336 — grid-rules → Kafka → pulse-api E2E smoke

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `yes` (script + evidence only; no compose / app source edits) |
| Branch | `vp/P0-T336-rules-kafka-api-e2e` |
| Deps | T330 (consumer), T335 (producer), T210 (`pulse-bus`), T310 (Postgres) — all on main `fcb6bf2` |

## Objective

Prove the full hop: `grid-rules` (own Kafka producer) → `vp.findings.v1` / `vp.alerts.v1` → `pulse-api` consumer → DomainStore (Postgres if `PULSE_DATABASE_URL`, else memory) → `GET /api/v1/findings|alerts`.

## Allowed paths

- `scripts/s2-rules-kafka-api-e2e.sh`, `scripts/README.md`
- `task-cards/P0-T336/**`

## Acceptance criteria

- [x] Producer is grid-rules CLI with `GRID_RULES_KAFKA_PRODUCER_ENABLED=true` + `KAFKA_BROKERS` (not an ad-hoc producer)
- [x] pulse-api consumer persists; findings + alerts visible via API (memory mode)
- [x] Same with `PULSE_DATABASE_URL`; rows confirmed via psql
- [x] `kafka_published` == emitted findings + alerts (6 = 3 + 3)
- [x] No compose edits; uses existing `pulse-bus` + `pulse-postgres`
- [x] Anti-leak: `vp.*` topics, VoltPulse service names only

## Evidence

`evidence/01-e2e.md` (+ `run-*.txt`, `memory/`, `postgres/` outputs).

## Notes — utility_id

No code fix needed. `vp.findings.v1` has no `utility_id`; pulse-api resolves inspection row → `PULSE_KAFKA_DEFAULT_UTILITY_ID` → reject (alerts carry `utility_id` from the asset). Smoke exercises both: memory uses default; Postgres seeds the inspection row and sets **no** default. Residual gap (not fixed, out of scope): finding with unknown inspection and no default is skipped + logged, offset advances (data dropped). Fix options later: add `utility_id` to findings contract, or DLQ.
