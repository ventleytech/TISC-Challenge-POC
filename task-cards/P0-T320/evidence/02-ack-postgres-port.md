# P0-T320 evidence — ack ported to DomainStore / PostgresStore

Date: 2026-11-18 · merged onto main after T310 (`dd37e55`).

## Change
- `DomainStore.ackAlert(id)` abstract; `MemoryStore` (Map) + `PostgresStore` (`UPDATE alerts SET ack_at = COALESCE(ack_at, now()) ... RETURNING`).
- `AlertsController.ack` now async: `getAlert` -> 404 / utility access check -> `ackAlert`.
- `PostgresStore.getAlert/ackAlert`: non-UUID id returns undefined (404, not 500; `alerts.id` is UUID).
- Spec updated to async + `databaseUrl: null`.

## Unit
```
cd apps/pulse-api && npx tsc --noEmit -p . && npm test && npm run build
# Test Suites: 7 passed · Tests: 25 passed
```

## Live Postgres smoke (PULSE_DATABASE_URL set, PULSE_AUTH_ENABLED=false, port 3021)
| Step | Result |
|---|---|
| POST /alerts | `{id: a5cc56a6-...}` |
| POST /alerts/{id}/ack | ack_at `2026-11-17T23:44:02.975Z` |
| POST again | identical ack_at (idempotent) |
| POST /alerts/nope/ack | 404 |
| GET /alerts?utility_id | ack_at persisted |
| psql select | ack_at row present; smoke row deleted after |

Note: with Postgres, utility_id/ids must be UUIDs (pulse-web demo seeds with non-UUID ids only work against MemoryStore).
