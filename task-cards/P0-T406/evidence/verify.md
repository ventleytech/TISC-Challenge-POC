# P0-T406

```bash
cd apps/pulse-api && npm test -- --testPathPatterns=csv-assets
cd apps/pulse-web && npm run build
```

- `POST /utilities/:id/import-csv` dry_run default
- Admin CSV form dry-run / apply
- Tests: csv-assets + utilities green; web build green
