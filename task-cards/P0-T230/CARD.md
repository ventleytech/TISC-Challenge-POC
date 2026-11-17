# P0-T230 — VoltPulse wow UI redesign

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `local-notes/05-roadmap-assumptions/10-ui-wow-feedback.md` + T005/T060 lineage |
| Parallel | `no` (owns `apps/pulse-web/**`, `packages/ui-tokens/**`) |
| Branch | `vp/P0-T230-wow-ui` |

## Objective

Elevate pulse-web from thin shells to demo-ready jaw-dropping VoltPulse UX: rich density, industrial-premium theme, motion, and finished feature surfaces (inspections, assets, schedule, priority, alerts/SLA, evidence, admin).

## Input docs

- `local-notes/05-roadmap-assumptions/10-ui-wow-feedback.md`
- `docs/architecture.md` (planes / service names)
- `docs/anti-leak.md`
- Inspiration only (RO): `local-notes/ui-refereces/`, `local-notes/Trinetra-POC/apps/` — patterns, never paste

## Allowed paths

- `apps/pulse-web/**`
- `packages/ui-tokens/**`
- `task-cards/P0-T230/**`

## Acceptance criteria

- [x] All main routes dense + themed (not bare stubs): `/`, `/inspections`, `/assets`, `/assets/:id`, `/inspections/schedule*`, `/alerts`, plus `/priority`, `/evidence`, `/admin`
- [x] Hero-level VoltPulse brand; steel/volt industrial theme; expressive fonts; atmosphere
- [x] Intentional motion (2–3+) with `prefers-reduced-motion` respect
- [x] T060 schedule/asset flows preserved (restyle + deepen, not deleted); T170 priority/alerts merged then elevated
- [x] `npm run build` OK in `apps/pulse-web`
- [x] Evidence notes + screenshots under `./evidence/`
- [x] Anti-leak: VoltPulse only; no proprietary brand/CSS token paste

## Validation

```bash
cd apps/pulse-web && npm ci && npm run build && npm run lint
```

## Evidence

Write under `./evidence/` (markdown required; pngs gitignored OK).

## Anti-leak

- [x] VoltPulse names only in new surfaces
- [x] No proprietary paste from Trinetra-POC or ui-refereces CSS tokens
- [x] Never commit `local-notes/Trinetra-POC`

## Notes

- Base branch: `vp/P0-T060-schedule-assets-ui` (T170 worktree active — do not trash routes).
- Deps: T005 shell + T060 schedule/assets.
