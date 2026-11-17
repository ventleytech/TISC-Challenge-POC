# P0-T140 — M01 Utility onboarding stub (`pulse-api`)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master M01) |
| Parallel | `ok` vs web/ML/perception; serialize vs other `apps/pulse-api` writers |
| Branch | `vp/P0-T140-utility-onboarding` |
| Deps | `P0-T050` (auth + Energy roles) |

## Objective

M01 stub on `pulse-api`: create a utility + first `utility_admin` (in-memory), plus a thin sites/assets seed endpoint — no pulse-web, no Postgres.

## Input docs

- `docs/product/requirements.md` (Roles — `utility_admin` onboarding)
- `docs/product/feature-catalog.md` (M01–M02)
- `docs/architecture.md`
- `docs/anti-leak.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-api/**`
- `task-cards/P0-T140/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (T140 / T050 rows only)

Read-only: `packages/contracts/**`, `docs/**`, `.env.template`.

## Acceptance criteria

- [x] `POST /api/v1/utilities` (`platform_admin`) creates utility + first `utility_admin` stub credential (in-memory)
- [x] New admin key authenticates and is scoped to that `utility_id`
- [x] Thin seed: `POST /api/v1/utilities/:utilityId/seed` creates sites + assets for the utility (`platform_admin` or owning `utility_admin`)
- [x] Non-owners / wrong role → 403; unauthenticated → 401
- [x] Unit + e2e (or curl smoke) evidence under `./evidence/`
- [x] Anti-leak clean (VoltPulse names only)

## Validation

```bash
cd apps/pulse-api && npm test && npm run test:e2e && npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api --glob '!node_modules/**' && exit 1 || true
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary onboarding/UI paste

## Notes

- In-memory only — Postgres/IdP membership is a later card.
- Do not touch pulse-web / pulse-store / grid-* in this card.
