# P0-T230 evidence — wow UI

**Date:** 2026-11-18  
**Branch:** `vp/P0-T230-wow-ui`  
**Worktree:** `/home/ubuntu/voltpulse-P0-T230`  
**Base:** T170 tip `9950332` (schedule/assets + priority/alerts) elevated in-place

## Validation

```bash
cd apps/pulse-web
npx oxlint src          # clean
npm run build           # tsc -b && vite build — OK
```

Build output (abbrev):

- `dist/assets/index-*.css` ~31.8 kB
- `dist/assets/index-*.js` ~323.7 kB
- vite build ~300–360ms

Preview smoke: `curl -sI http://127.0.0.1:4173/` → `200 OK` (HTML).

## Routes elevated (demo-finished density)

| Route | Surface |
|-------|---------|
| `/` | Hero VoltPulse + corridor pulse KPIs + breach queue + top findings + lane grid |
| `/inspections` | Stat band, filters, dense table, row detail drawer |
| `/inspections/schedule` | Rich kind cards (ETA, last run, asset counts, payload) |
| `/inspections/schedule/:kind` | T060 3-step wizard preserved + restyled |
| `/assets` | Stat band, dense registry table, corridor map stub |
| `/assets/:id` | Detail + linked findings / inspections / evidence |
| `/priority` | Risk columns + filters + asset/alert actions |
| `/alerts` | Severity/SLA countdown + ack (T170) |
| `/evidence` | Inspection/kind/retention filters + preview panel |
| `/admin` | Utility stub + roles pick + pipeline health |

## Theme / motion

- Tokens: steel / volt (`packages/ui-tokens/tokens.css`)
- Fonts: Syne / Figtree / IBM Plex Mono
- Motion: corridor pulse, list/board inhabit, breach pulse; `prefers-reduced-motion` disables

## Anti-leak

- Brand **VoltPulse** only
- Inspiration read-only: `local-notes/ui-refereces/`, Trinetra UX patterns — no proprietary paste
- Grep clean: no Trinetra / T-Netra strings under `apps/pulse-web` or `packages/ui-tokens`

## Notes

- Screenshots deferred (agent browser cannot reach VM localhost); markdown + build/curl proof here
- Mock catalog densified (~12 assets, 9 inspections, 12 findings, 8 alerts, 10 evidence)
