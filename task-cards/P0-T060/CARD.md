# P0-T060 — Schedule wizards + assets UI shells (S8 / A01)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` (web-only; disjoint from `pulse-api` auth) |
| Branch | `vp/P0-T060-schedule-assets-ui` |

## Objective

Thin **web-first** VoltPulse shells for scenario **S8** (schedule by asset type: line / feeder / substation) and feature **A01** (asset registry list/detail + filters), wired to a mock client (no `pulse-api` edits).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/product/feature-catalog.md`
- `docs/product/requirements.md`
- `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-web/**`
- `packages/ui-tokens/**`
- `task-cards/P0-T060/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Acceptance criteria

- [x] Routes for assets list, asset detail stub, inspection list filters, and schedule wizard shells (line / feeder / substation)
- [x] Mock client supplies seed assets + inspections (optional fetch behind env flag; default mock)
- [x] VoltPulse brand only; no proprietary chrome / names
- [x] `npm run build` + `oxlint src` pass in `apps/pulse-web`
- [x] Evidence under `./evidence/` (commands + screenshots/md)
- [x] No edits under `apps/pulse-api/**` (avoid P0-T050 collision)

## Validation

```bash
cd apps/pulse-web && npm ci && npm run lint && npm run build
# optional: npm run preview  # then capture /assets /inspections/schedule
```

## Evidence

Write under `./evidence/` (markdown notes OK; media gitignored).

## Anti-leak

- [x] VoltPulse names only in new surfaces
- [x] No proprietary paste

## Notes

Deps: `P0-T005` pulse-web shell. Prefer mock data over Nest schedule endpoints while auth worker owns `pulse-api`.
