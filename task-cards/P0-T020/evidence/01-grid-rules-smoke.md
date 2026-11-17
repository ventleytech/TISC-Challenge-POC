# P0-T020 evidence — grid-rules synthetic detect → findings/alerts

**Date:** 2026-11-18  
**Branch:** `vp/P0-T020-grid-rules`  
**Host:** worktree `/home/ubuntu/voltpulse-P0-T020`  
**Base:** contracts commit `0d1d875` (`packages/contracts` present)

## Commands

```bash
cd apps/grid-rules
npm install
npm test
npm run smoke -- --fixture fixtures/synthetic-detect.v1.json --assets fixtures/assets.json
rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules || true
graphify update .
```

## `npm test`

```
tests 9
pass 9
fail 0
suites: W01 computeRiskScore, processDetectEvent, slaDueAt
```

## Smoke summary (fixture bus, no Kafka)

| Metric | Value |
|--------|-------|
| input detections | 3 |
| findings | 3 |
| alerts (≥ medium) | 2 |
| top risk (W01) | 89.78 (`thermal_hotspot` / critical) |

Findings (class → severity → risk_score):

- `thermal_hotspot` → `critical` → `89.78`
- `corrosion` → `medium` → `52.35`
- `vegetation` → `low` → `29.05` (no alert; below floor)

Alerts (`sla_due_at` from `occurred_at=2026-11-18T00:00:00Z`):

- `critical` → `2026-11-18T00:15:00.000Z` (15 min)
- `medium` → `2026-11-18T04:00:00.000Z` (240 min)
- channels: `push`, `sms`

Topics emitted: `vp.findings.v1`, `vp.alerts.v1`.

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules` → clean.

## Notes

- Mock-friendly TS engine; Flink packaging later. Compose not rewritten (README + `scripts/smoke.sh` only).
- Asset criticality `high` + `132kV HV` applied via `fixtures/assets.json` for W01.
