# P0-T398 evidence

## Commands

```bash
cd apps/pulse-web && npm run build && npm run lint
```

## Results (2026-11-18)

- `tsc -b && vite build` — green (48 modules; CSS 43.13 kB / JS 385.29 kB)
- `oxlint src` — green (1 non-blocking React Compiler memoization warning on AlertsPage)

## Delivered

- Alerts: hero, SLA gauge, severity mix, lanes, search/sort/filters, inspector + ack
- Inspections: hero, funnel, filters, table/board, inspector stepper/SLA
- Map: `/map` schematic corridor, layers, risk heat, asset inspector, `?asset=`
- Fixed PIPELINE typing so `cancelled` does not break `tsc`

## Anti-leak

VoltPulse brand only; demo geo fixtures; no proprietary paste.
