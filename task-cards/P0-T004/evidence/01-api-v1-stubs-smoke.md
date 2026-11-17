# P0-T004 evidence — in-memory `/api/v1` stubs

Branch: `vp/P0-T004-api-stubs` (from `vp/P0-T003-pulse-api` @ `0f5965d`)  
Worktree: `/home/ubuntu/TISC-Challenge-POC-wt-P0-T003`

## Commands

```bash
cd apps/pulse-api
npm test
npm run test:e2e
npm run build
PULSE_API_PORT=3000 node dist/main.js &
curl -sf -X POST http://127.0.0.1:3000/api/v1/inspections \
  -H 'content-type: application/json' \
  -d '{"utility_id":"00000000-0000-4000-8000-000000000001"}'
```

## Results

### Tests

- Unit: 3 suites / 8 tests passed
- E2E: 1 suite / 4 tests passed (health, openapi, inspection CRUD path, asset+alert)

### Live smoke

```
HEALTH={"status":"ok","service":"pulse-api"}
CREATE={"id":"bb79ca90-4eec-41d0-afd8-4190cc5f0f8b"}
LIST={"items":[{"id":"…","utility_id":"…","status":"planned",…}]}
ASSET={"id":"69a93941-23f2-45c7-94bd-1fed820fddaa"}
ALERT={"id":"1bfc96ca-b323-4f63-9464-eb026d84c7fe"}
ANTI_LEAK_OK
```

## Notes

- Memory store is intentional stub for C08/S2 API surface; Postgres later.
- C10 auth/RBAC not started — see handoff below.
