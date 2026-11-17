# pulse-api

VoltPulse NestJS data-plane API. Owns authoritative state (inspections, assets, alerts, findings).

## Status

- `GET /health` — liveness (public)
- `GET /api/openapi.yaml` + `GET /api/docs` — contracts OpenAPI / Swagger (public mount)
- Durable stubs (Postgres when `PULSE_DATABASE_URL` set): `GET/POST /api/v1/inspections|assets|findings|alerts` (+ get by id)
- M01 onboarding stub: `POST/GET /api/v1/utilities`, `POST /api/v1/utilities/:id/seed` (utilities/sites still process-local; seeded assets persist)
- A07 work-order export: `POST /api/v1/work-orders/export?format=json|csv` (via `@voltpulse/work-order`)
- C10 auth stub: `X-API-Key` or `Authorization: Bearer` + Energy roles + `utility_id` scope
- `GET /api/v1/me` — current stub principal

Real IdP not yet. Without `PULSE_DATABASE_URL`, inspections/assets/alerts fall back to `MemoryStore` (tests).

## Config

| Key | Default | Role |
|-----|---------|------|
| `PULSE_API_PORT` | `3000` | Listen port |
| `PULSE_DATABASE_URL` | _(unset)_ | Postgres URL; compose uses `pulse-postgres` host |
| `PULSE_OPENAPI_PATH` | `packages/contracts/openapi/openapi.yaml` | Optional override |
| `PULSE_AUTH_ENABLED` | `true` | Fail closed on `/api/v1` when on |
| `PULSE_AUTH_STUB_KEYS` | _(empty)_ | `key:role:utility_id;…` principal map |
| `PULSE_KAFKA_CONSUMER_ENABLED` | `false` | Consume `vp.findings.v1` / `vp.alerts.v1` into the store (P0-T330) |
| `PULSE_KAFKA_BOOTSTRAP` | _(empty)_ | Brokers; host `localhost:9094`, in-compose `pulse-bus:9092` |
| `PULSE_KAFKA_GROUP_ID` | `pulse-api` | Consumer group |
| `PULSE_KAFKA_TOPIC_FINDINGS` / `_ALERTS` | `vp.findings.v1` / `vp.alerts.v1` | Topic overrides |
| `PULSE_KAFKA_DEFAULT_UTILITY_ID` | _(unset)_ | Fallback tenant: finding events carry no `utility_id` (inspection row wins) |

Kafka ingest is idempotent on `finding_id` / `alert_id`; malformed or unattributable messages are logged and skipped, store errors retry. Smoke: `scripts/s2-kafka-ingest.sh`.

Roles: `platform_admin` · `utility_admin` · `energy_supervisor` · `energy_operator` · `viewer`.

## Scripts

```bash
npm test
npm run test:e2e
# after Compose pulse-postgres is up (host URL):
export PULSE_DATABASE_URL=postgres://voltpulse:change-me-local-only@127.0.0.1:5432/voltpulse
npm run db:migrate
npm run start:dev
curl -sf http://127.0.0.1:${PULSE_API_PORT:-3000}/health
curl -sf -H 'X-API-Key: dev-operator' http://127.0.0.1:3000/api/v1/me
```
