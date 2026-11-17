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

## Data mode

Default: mock client in `src/mock/` (offline demo).

Live Nest (opt-in):

```bash
# URL form
VITE_PULSE_API_URL=http://127.0.0.1:3000/api/v1 \
VITE_PULSE_API_KEY=dev-operator \
npm run dev

# or shorthand base flag (same default URL)
VITE_PULSE_API_BASE=1 VITE_PULSE_API_KEY=dev-operator npm run dev
```

| Env | Role |
|-----|------|
| `VITE_PULSE_API_URL` | Base `/api/v1` URL — enables live mode |
| `VITE_PULSE_API_BASE=1` | Enables live mode at `http://127.0.0.1:3000/api/v1` |
| `VITE_PULSE_API_KEY` | Optional → `X-API-Key` (needed when Nest auth on) |

Live surfaces: inspections / assets / alerts / findings list + inspection create + alert ack (`POST …/alerts/{id}/ack`). On unset env or fetch failure → mock fallback. Evidence / ops metrics stay mock until store UI wire.
