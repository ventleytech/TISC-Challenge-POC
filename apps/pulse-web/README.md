# pulse-web

TPulse React shell (Sense / Media / Stream / Data inspection OS UI).

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

## Data mode

**Live-by-default** (P0-T400): `npm run dev` uses `.env.development` → Nest at `http://127.0.0.1:3000/api/v1`. List reads fall back to mock if API unreachable; **writes** (inspection/asset create) fail loudly when live.

Mock-only opt-out:

```bash
VITE_PULSE_MOCK=1 npm run dev
```

| Env | Role |
|-----|------|
| `VITE_PULSE_API_URL` | Base `/api/v1` URL (default in `.env.development`) |
| `VITE_PULSE_API_KEY` | Optional → `X-API-Key` (needed when Nest auth on) |
| `VITE_PULSE_MOCK=1` | Force mock client (offline demo) |
| `VITE_PULSE_API_BASE=1` | Legacy shorthand (same default URL) |

Live surfaces: inspections / assets / alerts / findings list + inspection create + asset create + alert ack (`POST …/alerts/{id}/ack`). Evidence (`/evidence`) also goes live via `GET /evidence` + signed image URLs (needs pulse-api `PULSE_API_CORS_ORIGINS` to include the dev origin); empty/unreachable → rich mock vault. Ops metrics stay mock.
