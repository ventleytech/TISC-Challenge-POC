# P0-T401 evidence

## Commands

```bash
cd apps/pulse-web && npm run build
```

## Results

- build green
- `createAsset` → POST `/assets` (throws on live failure)
- `createInspection` throws on live failure (no silent mock write)
- `listAssetsForScheduleKind` + ScheduleWizard write-through
- AssetsPage "Add asset" form

## Anti-leak

VoltPulse only; DEMO_UTILITY_ID fixture.
