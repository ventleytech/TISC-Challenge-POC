# Gate0 corrosion → live UI demo

Date: 2026-11-18

## Stack

- pulse-api: `node dist/main.js` on `:3000` (MemoryStore), auth `X-API-Key: dev-operator`
- pulse-web: `npm run dev` on `:5173`, `.env.development` → live API
- Model path: Gate0 corrosion YOLO via `s2-bus-e2e` → `vp.detect.v1` → rules → findings/alerts seed

## Seeded data (`util-demo-01`)

| Entity | Count | Notes |
|--------|------:|-------|
| Asset | 1 | North Ridge tower (Gate0 demo) |
| Inspection | 1 | `1d800a80-…` (UI enriches to `review` when findings exist) |
| Findings | 5 | class `corrosion`, risk ~11–31 |
| Alerts | 3 | severity `low`, open SLA ~24h |

## UI checks

- `/priority` — 5 ranked corrosion in Watch lane; asset name resolved
- `/inspections` — Live · pulse-api; 1 review; 5 findings linked
- `/alerts` — 3 open corrosion alerts on North Ridge tower

## URLs

- Web: http://127.0.0.1:5173/
- API: http://127.0.0.1:3000/api/v1/findings?utility_id=util-demo-01
