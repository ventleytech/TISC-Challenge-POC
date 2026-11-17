# P0-T310 evidence — merge onto main (T300 findings)

Merged `vp/P0-T310-pulse-api-postgres` (a807291) onto main @ 9f1e983 (T300 S2 findings/alerts).

## Conflicts resolved

- `apps/pulse-api/src/domain/memory.store.ts` — kept `DomainStore` base; added `findings` Map + `listFindings/getFinding/createFinding`.
- `apps/pulse-api/README.md` — Postgres wording + `findings` in durable route list.

## Follow-up to keep both T310 + T300

- `DomainStore` gains finding methods; `PostgresStore` implements them.
- `sql/002_findings.sql` — `findings` table (TEXT ids so rules `finding_id` round-trips).
- `FindingsController` now uses `DomainStore` (was `MemoryStore`, which no longer injects).

## Verification

```text
npm test      → 6 suites / 23 tests passed
npm run build → OK
npm run test:e2e → 11 passed (MemoryStore path, includes findings POST/GET)
PULSE_DATABASE_URL=… npm run db:migrate → skip 001, applied 002_findings.sql
Nest :3021 + PostgresStore: POST /api/v1/findings → 201; GET list returns row; psql findings row present (smoke row deleted after)
```
