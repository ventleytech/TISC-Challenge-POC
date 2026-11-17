# P0-T330 — pulse-api Kafka consumer (vp.findings / vp.alerts)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs pulse-web / grid-* ; serialize vs other pulse-api writers |
| Branch | `vp/P0-T330-kafka-consumer` |
| Deps | `P0-T300` (HTTP ingest), `P0-T310` (Postgres), `P0-T210` (compose Kafka) — all on main |

## Objective

Close the bus gap: Nest `pulse-api` consumes `vp.findings.v1` and `vp.alerts.v1` and persists through `DomainStore` (Postgres when configured), so rules output no longer needs the HTTP-POST shim.

## Input docs

- `docs/architecture.md`, `docs/anti-leak.md`
- `packages/contracts/events/{findings,alerts}/*.schema.json`
- `infra/kafka/README.md`, `task-cards/P0-T300/evidence/s2-bus-e2e.md`

## Allowed paths

- `apps/pulse-api/src/ingest/**`, `apps/pulse-api/src/{app.module,config/settings}.ts`
- `apps/pulse-api/{package.json,package-lock.json,README.md}`
- `scripts/s2-kafka-ingest.sh`, `.env.template` (consumer keys only)
- `task-cards/P0-T330/**`, `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row)

## Acceptance criteria

- [x] Consumer off by default (`PULSE_KAFKA_CONSUMER_ENABLED=false`); all config via settings
- [x] Findings + alerts persisted via `DomainStore` (Postgres verified)
- [x] Idempotent on `finding_id` / `alert_id` (at-least-once safe)
- [x] Poison / unattributable messages skipped + logged; store errors rethrown for retry
- [x] Utility resolution: inspection row → `PULSE_KAFKA_DEFAULT_UTILITY_ID` → reject
- [x] Unit tests + live Kafka→Postgres smoke with evidence
- [x] Anti-leak clean (`vp.*` topics, VoltPulse names only)

## Validation

```bash
cd apps/pulse-api && npx tsc --noEmit -p . && npm test && npm run build
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile stream up -d pulse-bus
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile stream run --rm pulse-kafka-topics
PULSE_DATABASE_URL=postgres://…@127.0.0.1:5432/voltpulse ./scripts/s2-kafka-ingest.sh
```

## Notes / known gaps

- `grid-rules` still does not *produce* to Kafka (file/HTTP only); smoke publishes rules output with a kafkajs producer. Follow-up: rules Kafka producer.
- `vp.findings.v1` has no `utility_id`; contract unchanged (additive field is a possible follow-up).
- No DLQ topic; skipped messages are log-only.
- Fresh worktrees need `npm run build` in `packages/*` (dist is gitignored) before grid-rules smoke.
