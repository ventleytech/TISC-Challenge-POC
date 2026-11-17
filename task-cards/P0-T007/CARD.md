# P0-T007 — `pulse-store` stub (MinIO config + evidence IDs)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog E01/E02; was listed as P0-T004 store) |
| Parallel | `ok` vs M* / T002 / T003 / T005 / T006 (app-only; do not touch compose) |
| Branch | `vp/P0-T007-pulse-store` |
| Deps | Prefer T001 `.env.template` / `store` profile present (compose owner stays T001) |

## Objective

Scaffold `apps/pulse-store`: MinIO-oriented settings from env, inspection-scoped evidence ID helper (E01/E02), and put/get smoke against optional MinIO **or** filesystem fallback for local proof — without rewriting Compose.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/storage-retention.md`
- `docs/product/requirements.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-store/**`
- `.env.template` (append store keys only; do not rewrite unrelated sections)
- `task-cards/P0-T007/evidence/**`
- `task-cards/P0-T007/CARD.md` (status flip)
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (add/status row only)
- `docs/repo-structure.md` (add `pulse-store/` under apps if missing)

Do **not** edit: `infra/compose/docker-compose.yml`, `apps/pulse-api/**`, `apps/pulse-notify/**`, `apps/pulse-web/**`, `apps/grid-rules/**`, `models-experiments/**`, `local-notes/Trinetra-POC/**`.

## Acceptance criteria

- [x] `apps/pulse-store` package exists with settings loaded from `PULSE_STORE_*` env (no hardcoded secrets/hosts in business logic)
- [x] Evidence key helper matches `docs/storage-retention.md` inspection-scoped layout (`…/insp_{id}/evidence/ev_{sha256_12}.{ext}`)
- [x] put/get works via filesystem fallback (default local proof)
- [x] MinIO/S3-oriented backend selectable via config; smoke skips cleanly if MinIO unreachable
- [x] Anti-leak: VoltPulse / `pulse-store` / `vp.*` only
- [x] Evidence under `./evidence/` with commands + short output

## Validation

```bash
cd apps/pulse-store && npm ci && npm test && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-store && exit 1 || true
# optional MinIO (skip OK if endpoint down):
# PULSE_STORE_BACKEND=minio npm run smoke
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-store-smoke.md`).

## Anti-leak

- [x] Service/package name `pulse-store`; bucket/topic wording VoltPulse-only
- [x] No proprietary storage contracts / path schemas paste beyond formal `docs/storage-retention.md`

## Notes

- Compose `pulse-store` profile already stubbed by T001 (alpine placeholder). This card owns **app** client/helper only.
- Card ID `P0-T007` (master plan row said P0-T004 for store; T004 used for API stubs — avoid collision).
