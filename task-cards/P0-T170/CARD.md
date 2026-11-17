# P0-T170 — C09 prioritisation board + alerts SLA/ack (mock)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` (web-only; disjoint from `pulse-api`) |
| Branch | `vp/P0-T170-priority-alerts-ui` |
| Deps | `P0-T060` (pulse-web mock client) |

## Objective

Thin VoltPulse UI for **C09** prioritisation board (findings sorted by **W01** severity × criticality risk) and **C07** alerts list with SLA countdown stub + acknowledge action — mock client only (no `pulse-api` edits).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/product/feature-catalog.md` (C07, C09)
- `docs/product/requirements.md`
- `task-plans/2026-11-18-gate0-and-p0-spine.md`
- `task-cards/P0-T060/CARD.md` (mock pattern)

## Allowed paths

- `apps/pulse-web/**`
- `packages/ui-tokens/**`
- `task-cards/P0-T170/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Acceptance criteria

- [x] Route for C09 prioritisation board: mock findings sorted by risk (W01 severity × criticality)
- [x] Alerts list shows SLA countdown stub + ack action (mock state)
- [x] Mock client pattern matches T060 (default mock; optional live env flag unused for ack)
- [x] VoltPulse brand only; no proprietary chrome / names
- [x] `npm run build` + `oxlint src` pass in `apps/pulse-web`
- [x] Evidence under `./evidence/`
- [x] No edits under `apps/pulse-api/**` or foreign `packages/*` (avoid T050 / T100 collision)

## Validation

```bash
cd apps/pulse-web && npm ci && npm run lint && npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-web && exit 1 || true
```

## Evidence

Write under `./evidence/` (markdown notes OK; media gitignored).

## Anti-leak

- [x] VoltPulse names only in new surfaces
- [x] No proprietary paste

## Notes

Branch from `vp/P0-T060-schedule-assets-ui`. Local risk helper in `src/mock/` — do not import `@voltpulse/prioritisation` until that package merges (T100 owns packages).
