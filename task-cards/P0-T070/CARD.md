# P0-T070 — Retention tiers + legal hold (E03/E04 + M07 thin)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog E03/E04/M07/S11) |
| Parallel | `ok` vs api/web/perception/train/gateway (store-only) |
| Branch | `vp/P0-T070-retention-hold` (from `vp/P0-T007-pulse-store`) |
| Deps | P0-T007 (`apps/pulse-store`) |

## Objective

Extend `apps/pulse-store` with retention policy (hot → warm → expire) from env and a legal-hold flag that blocks delete — thin M07 (config-only admin, no UI).

## Input docs

- `docs/storage-retention.md`
- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-store/**`
- `.env.template` (append retention keys only)
- `task-cards/P0-T070/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit: `apps/pulse-api/**`, `apps/pulse-web/**`, `apps/grid-perception/**`, `apps/pulse-train/**`, `apps/pulse-gateway/**`, `models-experiments/**`, `local-notes/Trinetra-POC/**`, `infra/compose/**`.

## Acceptance criteria

- [x] Retention policy loaded from `PULSE_STORE_HOT_DAYS` / `PULSE_STORE_WARM_DAYS` (tier = hot|warm|expire)
- [x] Object meta tracks `createdAt` + `legalHold`
- [x] `delete` blocked while legal hold is set; allowed after clear
- [x] Smoke proves hold blocks delete; expire candidates exclude held objects
- [x] Anti-leak clean; evidence under `./evidence/`

## Validation

```bash
cd apps/pulse-store && npm ci && npm test && npm run smoke && npm run smoke:retention
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-store && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-retention-hold-smoke.md`).

## Anti-leak

- [x] VoltPulse / `pulse-store` wording only
- [x] No proprietary retention contracts beyond `docs/storage-retention.md`

## Notes

- M07 thin = env policy only (no admin UI this card).
- Compose MinIO still optional; FS backend is local proof path.
