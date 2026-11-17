# P0-T260 — Overnight merge integration

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` + overnight Multitask |
| Parallel | `no` |
| Branch | `vp/overnight-integrate` |

## Objective

Integrate disjoint overnight worktree branches into one tip (`vp/overnight-integrate` → `main`) without overwriting mid-flight pulse-web / T230 wow UI.

## Input docs

- `local-notes/05-roadmap-assumptions/09-overnight-progress.md`
- `docs/anti-leak.md`
- `docs/architecture.md`

## Allowed paths

- merge integration across overnight card branches
- `task-cards/P0-T260/**`
- `local-notes/05-roadmap-assumptions/09-overnight-progress.md` (progress only)
- do **not** merge `apps/pulse-web/**` while T230 in flight

## Acceptance criteria

- [x] Ordered merges: contracts → compose → MinIO → kafka → store → api → notify/obs → rules (+T190/T180/T280) → perception (+T240) → packages (+T200/T220/T270) → train → gateway
- [x] T230 / pulse-web deferred
- [x] VoltPulse names only; no local-notes/weights/.env/graphify-out/Trinetra commits
- [x] Compose config smoke + package/unit smokes recorded under evidence
- [x] `09-overnight-progress.md` merge section updated

## Validation

```bash
docker compose -f infra/compose/docker-compose.yml --project-name voltpulse config
# package unit tests as in evidence/01-merge-and-smoke.md
```

## Evidence

`./evidence/01-merge-and-smoke.md`

## Anti-leak

- [x] VoltPulse names only in new surfaces
- [x] No proprietary paste

## Notes

Blockers: pulse-web deferred for T230; `label-ui-stub` has no npm test script; TS packages need local `npm run build` before grid-rules tests.
