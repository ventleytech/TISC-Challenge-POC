# P0-T402 — Postgres utilities/sites/memberships

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | cost-efficient remaining build |
| Parallel | `no` (pulse-api domain) |
| Branch | `main` |

## Objective

Utilities, sites, and memberships survive restart via Postgres (M01/M02).

## Allowed paths

- `apps/pulse-api/sql/**`
- `apps/pulse-api/src/domain/**`
- `apps/pulse-api/src/utilities/**`
- `apps/pulse-api/src/auth/**`
- `task-cards/P0-T402/**`

## Acceptance criteria

- [x] SQL migration for utilities / sites / memberships
- [x] PostgresStore CRUD + MemoryStore methods
- [x] UtilitiesController uses store methods (async)
- [x] Memberships hydrate AuthService on boot
- [x] unit tests green

## Validation

```bash
cd apps/pulse-api && npm test -- --testPathPattern=utilities
```

## Evidence

`./evidence/verify.md`
