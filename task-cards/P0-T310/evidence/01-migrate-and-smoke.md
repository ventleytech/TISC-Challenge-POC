# P0-T310 evidence — migrate + CRUD smoke

Date: 2026-11-18 (UTC) · Branch: `vp/P0-T310-pulse-api-postgres` · Host Postgres via Compose

## Compose

```bash
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env \
  --profile data up -d pulse-postgres
# → vp-pulse-postgres healthy on :5432
```

## Migrate

```bash
export PULSE_DATABASE_URL=postgres://voltpulse:change-me-local-only@127.0.0.1:5432/voltpulse
cd apps/pulse-api && npm run db:migrate
# → applied 001_init.sql
# re-run → skip 001_init.sql (already applied)
```

## Unit tests / build

```bash
cd apps/pulse-api && npm test && npm run build
# Test Suites: 6 passed, 6 total · Tests: 23 passed
# nest build OK
```

## CRUD smoke (PostgresStore)

API on free port **3020** (3010 already occupied by another `node dist/main.js`).

```text
[PostgresStore] Postgres pool ready
[DomainModule] Using PostgresStore (PULSE_DATABASE_URL)
```

| Step | Result |
|------|--------|
| `POST /api/v1/assets` | `id=1f21abf2-3d33-4272-bb86-c1bdf3616248` name=Tower-T310 |
| `POST /api/v1/inspections` | `id=b2325153-19fa-4654-bead-418fb2331053` status=planned |
| `POST /api/v1/alerts` | `id=2991a583-9c32-412d-81fc-bc9c138447c4` finding_id=f-t310 |
| `psql` rows | all three ids present in `assets` / `inspections` / `alerts` |
| Restart Nest + GET by id | same rows returned (durable) |

## Anti-leak

No internal product brand strings in touched surfaces. `.env` not committed; placeholders only in `.env.template`.

## Notes

- Utilities / sites / memberships remain process-local Maps (out of minimal schema).
- Port 3010 had a separate Nest process during smoke — used 3020 to avoid collision (possible T300 / other agent).
