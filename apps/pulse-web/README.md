# pulse-web

VoltPulse React shell (Sense / Media / Stream / Data inspection OS UI).

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

Theme tokens: `packages/ui-tokens`.

Routes:

| Path | Shell |
|------|-------|
| `/` | Brand home |
| `/inspections` | List + filters |
| `/inspections/schedule` | S8 kind picker (line / feeder / substation) |
| `/inspections/schedule/:kind` | Schedule wizard shell |
| `/assets` | A01 list + filters |
| `/assets/:assetId` | Asset detail stub |
| `/priority` | C09 board — findings by W01 risk |
| `/alerts` | C07 list — SLA countdown + ack |

Data: mock client in `src/mock/` (default). Optional live Nest: set `VITE_PULSE_API_URL` (or `VITE_PULSE_API_BASE=1` → `http://127.0.0.1:3000/api/v1`). Ack stays mock-local.
