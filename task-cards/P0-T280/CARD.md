# P0-T280 — Wire alert-policy into grid-rules

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master M05/M06 consumers) |
| Parallel | `ok` vs pulse-web (T230); prefer worktree off T190/T020 |
| Branch | `vp/P0-T280-rules-alert-policy` |
| Deps | `P0-T180` `@voltpulse/alert-policy`, `P0-T020`/`P0-T190` grid-rules |

## Objective

`apps/grid-rules` loads SLA `sla_due_at` minutes and notify **channels** from `@voltpulse/alert-policy` defaults (JSON + `VP_ALERT_*` env) — not hardcoded service constants. Unit/smoke tests + evidence.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `packages/alert-policy/README.md`
- `apps/grid-rules/README.md`
- Cards: `task-cards/P0-T180/CARD.md`, `task-cards/P0-T020/CARD.md`, `task-cards/P0-T190/CARD.md`

## Allowed paths

- `apps/grid-rules/**`
- `packages/alert-policy/**` (via cherry-pick / file dep; no behavior fork)
- `task-cards/P0-T280/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit: `apps/pulse-web/**`, `apps/pulse-api/**`, `scripts/s2-detect-rules-smoke.sh`, proprietary trees under `local-notes/`.

## Acceptance criteria

- [x] `@voltpulse/alert-policy` present and depended by `grid-rules`
- [x] `loadSettings` sources `slaMinutes` + `defaultChannels` from `loadAlertPolicy` / `resolveChannels`
- [x] Alert emit uses policy `slaDueAt` + `resolveChannels` (no hardcoded SLA map / channel list in engine)
- [x] Legacy `GRID_RULES_SLA_*` still maps when `VP_ALERT_SLA_*` unset
- [x] Unit tests cover defaults + env overlay + channel enable filter
- [x] Smoke still emits `sla_due_at`
- [x] Evidence under `./evidence/`
- [x] Anti-leak: VoltPulse / `vp.*` only

## Validation

```bash
cd packages/alert-policy && npm ci && npm test && npm run build
cd apps/grid-rules && npm install && npm test && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules packages/alert-policy && exit 1 || true
graphify update .
```

## Evidence

`./evidence/01-rules-alert-policy.md`

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary SLA matrices or internal brand strings

## Notes

- Base from `vp/P0-T190-rules-responsibility` (or T020) + cherry-pick T180 alert-policy.
- If merge integrator fights on main: finish on branch; leave note — do not force-merge.
