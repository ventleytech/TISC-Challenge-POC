# P0-T261 — Merge T230 wow pulse-web onto main

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `no` |
| Branch | `main` ← `vp/P0-T230-wow-ui` |

## Objective

Land T230 wow `pulse-web` + `ui-tokens` on `main` after overnight integrate (T260) deferred web.

## Input docs

- `local-notes/05-roadmap-assumptions/09-overnight-progress.md`
- `docs/anti-leak.md`
- `task-cards/P0-T230/CARD.md`

## Allowed paths

- merge `vp/P0-T230-wow-ui` → `main`
- `apps/pulse-web/**`, `packages/ui-tokens/**` (prefer T230 on conflict)
- `task-cards/P0-T261/**`
- `local-notes/05-roadmap-assumptions/09-overnight-progress.md`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (conflict resolve only)

## Acceptance criteria

- [x] `vp/P0-T230-wow-ui` merged into `main` (no force-push)
- [x] Plan conflict resolved; pulse-web/ui-tokens from T230
- [x] `cd apps/pulse-web && npm run build` OK
- [x] Anti-leak skim clean (VoltPulse only; no Trinetra/secrets)
- [x] Progress + evidence recorded

## Validation

```bash
cd apps/pulse-web && npm install && npm run build
rg -ni 'trinetra|t-netra' apps/pulse-web packages/ui-tokens
```

## Evidence

`./evidence/01-merge-web.md`

## Anti-leak

- [x] VoltPulse names only in new surfaces
- [x] No proprietary paste

## Notes

Depends on T230 done @ `0cc1055`; T260 deferred web intentionally.
