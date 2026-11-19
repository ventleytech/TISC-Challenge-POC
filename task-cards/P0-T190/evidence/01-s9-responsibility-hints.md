# P0-T190 evidence — S9 responsibility hints on findings

**Branch:** `vp/P0-T190-rules-responsibility`  
**Base:** `vp/P0-T020-grid-rules` @ `d83b8cd` + cherry-pick `39ca95b` (`@voltpulse/responsibility`)  
**Date:** 2026-11-18

## What landed

- Cherry-picked `@voltpulse/responsibility` onto rules branch.
- `grid-rules` depends on `file:../../packages/responsibility`.
- Synthetic `fixtures/assets.json` includes OEM / warranty / anti-corrosion SLA / tender_ref.
- `processDetectEvent` calls `hintResponsibility` when OEM or warranty/SLA present; attaches under `finding.extensions`.
- Contract: optional `finding.extensions` on `vp.findings.v1` (additive, non-breaking).
- T130 glue script untouched.

## Commands

```bash
cd packages/responsibility && npm install && npm test && npm run build
# → 13 pass

cd apps/grid-rules && npm install && npm test
# → 11 pass (includes S9 attach + skip cases)

cd apps/grid-rules && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/grid-rules packages/responsibility
# → no matches
```

## Smoke (abridged)

| class_id | party_type | warranty_hint |
|----------|------------|---------------|
| thermal_hotspot | oem | warranty_breach_suspect |
| corrosion | oem | warranty_breach_suspect |
| vegetation | vegetation_contractor | in_warranty |

All three findings include `extensions.tender_ref = VP-TENDER-SYN-001`.

## Anti-leak

- Service / topics: `grid-rules`, `vp.findings.v1`, `vp.alerts.v1`
- Synthetic OEM / tender only; no proprietary matrices
- No internal product brand strings in touched paths
