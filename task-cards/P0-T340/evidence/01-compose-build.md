# T340 evidence

```bash
cd infra/compose
docker compose --env-file ../../.env --profile sense --profile stream --profile data --profile store build
# Image voltpulse/{grid-perception,pulse-api,grid-rules,pulse-web}:dev Built
docker compose --env-file ../../.env --profile sense --profile stream --profile data up -d --no-deps \
  pulse-api pulse-web grid-rules grid-perception   # pulse-api with PULSE_API_PORT=3920 (3000/3010 busy)
```

All four `Up (healthy)`. Existing `vp-pulse-bus`, `vp-pulse-postgres`, MinIO untouched.

| Check | Result |
|---|---|
| `GET :3920/health` | `{"status":"ok","service":"pulse-api"}` |
| `GET :3920/api/v1/alerts?utility_id=…` + `x-api-key: dev-viewer` | 200, rows from Postgres (migrations ran in container) |
| `GET :5173/` | Vite index.html (VoltPulse) |
| `GET :5173/assets/index-*.js` | 200, 324922 B |
| `GET :5173/inspections/x` | 200 (SPA fallback) |
| grid-rules `/health` | `{"status":"ok","service":"grid-rules","detect_topic":"vp.detect.v1"}` |
| grid-perception `/health` | `{"status": "ok","service": "grid-perception","detect_topic": "vp.detect.v1"}` |

Sizes: pulse-api 293MB, grid-rules 247MB, pulse-web 74MB, grid-perception 83MB.

Rebased onto main `28f6269` (T335/T336): no conflicts; `cli.ts` Kafka producer and `serve.ts` coexist.
