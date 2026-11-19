# P0-T060 evidence — schedule + assets UI shells

## Scope

Web-only thin slice on `vp/P0-T060-schedule-assets-ui` (from `P0-T005` @ `0db34d6`).

- A01: `/assets` list + filters, `/assets/:id` detail stub
- S8: `/inspections` filters, `/inspections/schedule` kinds, `/inspections/schedule/{line|feeder|substation}` wizard
- Data: `src/mock/*` (default). Optional Nest via `VITE_PULSE_API_URL` — **no `pulse-api` edits**

## Commands

```bash
cd apps/pulse-web
npm ci
./node_modules/.bin/oxlint src   # exit 0
npm run build                    # tsc -b && vite build — exit 0
npm run preview -- --host 127.0.0.1 --port 5173
```

Build excerpt (2026-11-18):

```
✓ 38 modules transformed.
dist/assets/index-*.css    ~8.7 kB
dist/assets/index-*.js   ~276 kB
✓ built in ~350ms
```

Wizard smoke (Playwright): open `/inspections/schedule/line` → Next → Create planned → saw `insp-mock-100`.

## Screenshots (gitignored png; local under this folder)

| File | Route |
|------|-------|
| `02-assets-list.png` | `/assets` |
| `03-asset-detail.png` | `/assets/ast-feeder-01` |
| `04-inspections-filters.png` | `/inspections` |
| `05-schedule-kinds.png` | `/inspections/schedule` |
| `06-schedule-wizard-feeder.png` | `/inspections/schedule/feeder` |
| `07-schedule-wizard-confirm.png` | line wizard confirm |

## Anti-leak

- Grep clean for internal product brands on touched web/card paths
- VoltPulse brand + `vp` tokens only
