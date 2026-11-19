# P0-T398 — Densify Alerts, Inspections, Map pages (wow UI)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` (pulse-web only) |
| Branch | `vp/P0-T398-wow-ui-densify` |

## Objective

Alerts, Inspections and a new Corridor Map page match EvidencePage richness (hero, atmosphere, motion, filters, detail panes). User feedback: previous pages were simple shells.

## Input docs

- `apps/pulse-web/src/pages/EvidencePage.tsx` (richness bar)
- `docs/anti-leak.md`

## Allowed paths

- `apps/pulse-web/src/**`
- `task-cards/P0-T398/**`

## Acceptance criteria

- [x] Alerts: hero + SLA gauge + severity mix, lanes (breached / escalating / on track / acked), search + sort + filters, inspector with timeline, finding, evidence, inspection link, keyboard nav + ack.
- [x] Inspections: hero + lifecycle funnel, status/kind filters, table + board views, inspector with stepper, SLA gauge, assets, findings, alerts, evidence.
- [x] Map: `/map` schematic corridor map, layers, risk heat, alert pulses, pan/zoom, search, hot-asset ranking, asset inspector, deep link `?asset=`.
- [x] Live API client (`VITE_PULSE_API_*`) + mock fallback unchanged (`mock/client.ts` untouched).
- [x] T230 (SlaCountdown, schedule wizard) and T350 (evidence) untouched.
- [x] `npm run build` + `npm run lint` green.

## Validation

```bash
cd apps/pulse-web && npm ci && npm run build && npm run lint
```

## Evidence

`./evidence/verify.md`

## Anti-leak

VoltPulse brand only; fresh SVG/CSS; no proprietary paste; map coordinates are demo fixtures.
