# P0-T310 — Postgres behind pulse-api (kill MemoryStore)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ morning gap #2) |
| Parallel | `ok` vs web/ML; **serialize** vs other `apps/pulse-api` writers; coordinate T300 — this card owns `apps/pulse-api`, Compose `pulse-postgres`, `.env.template` DB keys |
| Branch | `vp/P0-T310-pulse-api-postgres` |
| Deps | Compose `data` profile + `PULSE_DATABASE_URL` placeholders (T001); API stubs (T004) |

## Objective

Add/confirm Postgres on Compose `data` profile, wire `PULSE_DATABASE_URL`, and migrate Nest `pulse-api` inspections/assets/alerts from in-memory Maps to Postgres (minimal schema). Keep OpenAPI/HTTP shapes.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `.env.template`
- `infra/compose/docker-compose.yml`

## Allowed paths

- `apps/pulse-api/**`
- `infra/compose/docker-compose.yml` (postgres service + pulse-api DB env / health only)
- `infra/compose/README.md` (postgres note only)
- `.env.template` (DB URL / PG keys)
- `task-cards/P0-T310/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

## Acceptance criteria

- [x] Compose `pulse-postgres` on profile `data` with healthcheck; `pulse-api` receives `PULSE_DATABASE_URL`
- [x] `.env.template` documents compose + host `PULSE_DATABASE_URL` (placeholders only)
- [x] Minimal SQL schema + migrate script for `inspections`, `assets`, `alerts`
- [x] Nest domain store persists those three via Postgres when URL set (utilities/sites/memberships may stay process-local)
- [x] Unit tests still pass (memory backend for specs)
- [x] Evidence: migrate + smoke CRUD against live Postgres
- [x] Anti-leak clean; no secrets committed

## Validation

```bash
# from repo root / worktree
cp -n .env.template .env   # if missing
docker compose -p voltpulse -f infra/compose/docker-compose.yml --env-file .env --profile data up -d pulse-postgres
# host URL for local nest:
export PULSE_DATABASE_URL=postgres://voltpulse:change-me-local-only@127.0.0.1:5432/voltpulse
cd apps/pulse-api && npm ci && npm run db:migrate && npm test
# smoke: start API, POST/GET inspections|assets|alerts — see evidence/
```

## Evidence

Write under `./evidence/` (commands + short output).

## Anti-leak

- [ ] VoltPulse names only (`pulse-postgres`, `vp.*` untouched)
- [ ] No proprietary paste / real secrets

## Notes

- Do not rewrite Kafka/MinIO compose services (T300 / other owners).
- Auth stub stays env-keyed; no IdP users table in this card.
