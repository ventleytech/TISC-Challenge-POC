# P0-T005 evidence — pulse-web shell

## Commands

```bash
cd apps/pulse-web
npm install
npm run build
# tsc -b && vite build → OK (dist produced)

rg -ni 'trinetra|t-netra|tnetra' apps/pulse-web packages/ui-tokens
# → no matches (ANTI_LEAK_OK)

./node_modules/.bin/vite preview --host 0.0.0.0 --port 4173
# → http://127.0.0.1:4173/
```

## Brand / routes

- First viewport: hero-level **VoltPulse** (`#vp-brand`), planes line, lede, CTAs
- Stubs: `/inspections`, `/assets`, `/alerts` (empty RouteShell — no fake rows)
- Tokens: `packages/ui-tokens/tokens.css` (cool steel + volt accent)

## Screenshots (gitignored blobs)

| File | Notes |
|------|-------|
| `./01-home.png` | Hero brand + corridor SVG |
| `./02-inspections.png` | Inspections stub |
| `./03-assets.png` | Assets stub |
| `./04-alerts.png` | Alerts stub |

Captured via Playwright Chromium against local preview (`#vp-brand` text = `VoltPulse`).

## Anti-leak

- No internal product strings under `apps/pulse-web` / `packages/ui-tokens`
- Fresh SVG corridor — not proprietary UI chrome
