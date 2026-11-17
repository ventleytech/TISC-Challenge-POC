# Handoff after P0-T003 / P0-T004

## Done

| Card | Branch | Commit tip |
|------|--------|------------|
| P0-T003 | `vp/P0-T003-pulse-api` | `0f5965d` health + OpenAPI mount |
| P0-T004 | `vp/P0-T004-api-stubs` | (this branch) in-memory `/api/v1` stubs |

Worktree: `/home/ubuntu/TISC-Challenge-POC-wt-P0-T003`  
Lineage includes T001 compose + T002 contracts.

## Suggested next API cards (do not block on UI)

1. **P0-T010 (suggested)** — Postgres persistence for inspections/assets/alerts (replace MemoryStore); wire `PULSE_DATABASE_URL` from `.env.template`.
2. **P0-T011 / C10** — Auth + Energy roles + `utility_id` scoping guards (S5).
3. **P0-T020 / S2** — Record-upload: evidence object refs + inspection status `processing` → store/MinIO (needs `pulse-store` / T001 compose).

## Merge order reminder

contracts → compose → **api (T003→T004)** → web; perception after Gate 0.1.

## Blockers

- None for stub API. Persistence needs Compose Postgres up (`infra/compose` from T001).
- Plan file `task-plans/2026-11-18-gate0-and-p0-spine.md` still lists T003 blocked on some worktrees — update status on merge morning.
