# pulse-web

VoltPulse React shell (Sense / Media / Stream / Data inspection OS UI).

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```

Theme tokens: `packages/ui-tokens` (steel / volt industrial).

Routes:

| Path | Surface |
|------|---------|
| `/` | Brand hero + corridor pulse |
| `/inspections` | Dense lifecycle table + filters |
| `/inspections/schedule` | S8 kind picker (line / feeder / substation) |
| `/inspections/schedule/:kind` | Schedule wizard |
| `/assets` | A01 registry tiles |
| `/assets/:assetId` | Asset detail |
| `/priority` | C09 risk board (W01 severity × criticality) |
| `/alerts` | C07 SLA countdown + ack |
| `/evidence` | Retention-tagged objects |
| `/admin` | Roles + pipeline health stubs |

Data: mock client in `src/mock/` (default). Optional live Nest: set `VITE_PULSE_API_URL` (or `VITE_PULSE_API_BASE=1` → `http://127.0.0.1:3000/api/v1`). Ack stays mock-local.
