# pulse-api

VoltPulse NestJS data-plane API. Owns authoritative state (inspections, assets, alerts, findings).

## Status

- `GET /health` — liveness
- `GET /api/openapi.yaml` + `GET /api/docs` — contracts OpenAPI / Swagger
- In-memory stubs: `GET/POST /api/v1/inspections|assets|alerts` (+ get by id)

Postgres / auth (C10) not yet.

## Config

| Key | Default | Role |
|-----|---------|------|
| `PULSE_API_PORT` | `3000` | Listen port (from `.env.template`) |
| `PULSE_OPENAPI_PATH` | `packages/contracts/openapi/openapi.yaml` | Optional override |

## Scripts

```bash
npm test
npm run start:dev
curl -sf http://127.0.0.1:${PULSE_API_PORT:-3000}/health
```
