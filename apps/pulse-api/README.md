# pulse-api

VoltPulse NestJS data-plane API. Owns authoritative state (inspections, assets, alerts, findings).

## Status

- `GET /health` — liveness (public)
- `GET /api/openapi.yaml` + `GET /api/docs` — contracts OpenAPI / Swagger (public mount)
- In-memory stubs: `GET/POST /api/v1/inspections|assets|findings|alerts` (+ get by id)
- M01 onboarding stub: `POST/GET /api/v1/utilities`, `POST /api/v1/utilities/:id/seed`
- A07 work-order export: `POST /api/v1/work-orders/export?format=json|csv` (via `@voltpulse/work-order`)
- C10 auth stub: `X-API-Key` or `Authorization: Bearer` + Energy roles + `utility_id` scope
- `GET /api/v1/me` — current stub principal

Postgres / real IdP not yet.

## Config

| Key | Default | Role |
|-----|---------|------|
| `PULSE_API_PORT` | `3000` | Listen port |
| `PULSE_OPENAPI_PATH` | `packages/contracts/openapi/openapi.yaml` | Optional override |
| `PULSE_AUTH_ENABLED` | `true` | Fail closed on `/api/v1` when on |
| `PULSE_AUTH_STUB_KEYS` | _(empty)_ | `key:role:utility_id;…` principal map |

Roles: `platform_admin` · `utility_admin` · `energy_supervisor` · `energy_operator` · `viewer`.

## Scripts

```bash
npm test
npm run test:e2e
npm run start:dev
curl -sf http://127.0.0.1:${PULSE_API_PORT:-3000}/health
curl -sf -H 'X-API-Key: dev-operator' http://127.0.0.1:3000/api/v1/me
```
