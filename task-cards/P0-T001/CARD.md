# P0-T001 — Compose profiles skeleton (`voltpulse`)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs `P0-M*` / `P0-T002` / `P0-T005`; **sole owner** of root compose file |
| Branch | `vp/P0-T001-compose` |
| Deps | — |

## Objective

Add a minimal Docker Compose project `voltpulse` with profile stubs for `sense` `media` `stream` `data` `obs` `store` and a tracked `.env.template` — no secrets, no full service implementations.

## Input docs

- `docs/architecture.md` (Planes ↔ Compose profiles)
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `infra/compose/**`
- `.env.template` (repo root)
- `task-cards/P0-T001/evidence/**`
- `task-cards/P0-T001/CARD.md` (status flip only)

Do **not** add real passwords, customer endpoints, or proprietary image names. Defer MinIO depth if it would fight a later store card — placeholder service OK.

## Acceptance criteria

- [x] Compose project name `voltpulse`
- [x] Profiles declared: `sense`, `media`, `stream`, `data`, `obs`, `store`
- [x] Placeholder / stub services use VoltPulse names (`pulse-*` / `grid-*` as appropriate)
- [x] `.env.template` documents required keys (no real secrets)
- [x] `docker compose … config` validates (or documented dry-run) for at least one profile
- [x] Anti-leak grep clean on touched paths
- [x] Evidence with commands + short output

## Validation

```bash
test -f .env.template
# adjust path to actual compose file under infra/compose/
docker compose -p voltpulse -f infra/compose/docker-compose.yml --profile data config >/dev/null
rg -ni 'trinetra|t-netra|tnetra' infra/compose .env.template && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-compose-config.md`).

## Anti-leak

- [x] Project `voltpulse`; profiles as in architecture
- [x] No proprietary compose chrome / internal hostnames
- [x] Never commit real `.env`

## Notes

- Overnight pick after M001→M002→T002 if capacity; safe parallel from tick 1 in separate worktree.
- Serialize any future store-only card that would edit the same compose file.
