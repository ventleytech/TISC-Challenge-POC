# P0-T003 evidence — health + OpenAPI smoke

Branch: `vp/P0-T003-pulse-api`  
Worktree: `/home/ubuntu/TISC-Challenge-POC-wt-P0-T003`  
Lineage: `vp/P0-T002-contracts` + fast-forward `vp/P0-T001-compose`

## Commands

```bash
cd apps/pulse-api
npm test
npm run test:e2e
npm run build
PULSE_API_PORT=3000 node dist/main.js &
curl -sf http://127.0.0.1:3000/health
curl -sf http://127.0.0.1:3000/api/openapi.yaml | head
curl -sf -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/docs/
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api --glob '!node_modules/**' && exit 1 || true
```

## Results (2026-11-17)

### Unit tests

```
Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
```

### E2E

```
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

(`/health`, `/api/openapi.yaml` VoltPulse paths, `/api/docs` Swagger UI)

### Live smoke

```
GET /health → {"status":"ok","service":"pulse-api"}
GET /api/openapi.yaml → title: VoltPulse API; servers url /api/v1; paths /inspections|/assets|/alerts
GET /api/docs/ → 200
ANTI_LEAK_OK
```

### Config

- Listen port from `PULSE_API_PORT` (`.env.template` key); default 3000
- OpenAPI file from `packages/contracts/openapi/openapi.yaml` (optional `PULSE_OPENAPI_PATH`)
