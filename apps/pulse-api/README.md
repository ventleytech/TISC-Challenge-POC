# pulse-api

VoltPulse NestJS data-plane API. Owns authoritative state (inspections, assets, alerts, findings).

## This card (P0-T003)

- `GET /health` — liveness
- `GET /api/openapi.yaml` — mounts `packages/contracts/openapi/openapi.yaml`
- `GET /api/docs` — Swagger UI over that contract (stubs for `/api/v1/inspections|assets|alerts`)

No domain CRUD yet.

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
