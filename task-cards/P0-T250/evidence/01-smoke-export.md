# P0-T250 evidence — work-order export API

## Base

- Branch: `vp/P0-T250-work-order-api`
- From: `vp/P0-T140-utility-onboarding` + cherry-pick `bc7bcc9` (`@voltpulse/work-order`)
- Package linked: `"@voltpulse/work-order": "file:../../packages/work-order"` (CJS build for Nest/Jest)

## Commands

```bash
cd packages/work-order && npm ci && npm test && npm run build
cd apps/pulse-api && npm install && npm test && npm run test:e2e && npm run build

PULSE_API_PORT=3010 PULSE_AUTH_ENABLED=true \
PULSE_AUTH_STUB_KEYS='dev-platform:platform_admin:;dev-operator:energy_operator:00000000-0000-4000-8000-000000000001' \
node dist/main.js
```

## Unit / e2e

- `npm test` — 6 suites / 22 tests pass (includes `WorkOrdersService`)
- `npm run test:e2e` — 11 tests pass (includes A07 JSON+CSV+401+403)
- `packages/work-order` — 10/10 package tests pass after CJS emit

## Smoke curl (port 3010)

1. Create asset → id `6cb152bb-0336-4313-9818-1f60d47a0192`
2. `POST /api/v1/work-orders/export?format=json` with X-API-Key → 200

```json
{"items":[{"work_order_id":"wo-f-smoke-1","finding_id":"f-smoke-1","class_id":"corrosion","severity":"high","asset_name":"Tower-Smoke-1","party_type":"oem","oem":"DemoOem", ...}]}
```

3. `POST ...?format=csv` → `text/csv` header row + one data row (`corrosion`, `f-smoke-1`)
4. Same POST without credentials → **401**

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api packages/work-order --glob '!node_modules/**' --glob '!dist/**'
# no matches
```

## Endpoint

`POST /api/v1/work-orders/export?format=json|csv`

Body: `{ utility_id, items: [{ finding, party_hint, asset_id?, asset? }], exported_at?, id_prefix? }`

Uses `exportWorkOrders` from `@voltpulse/work-order`. No pulse-web.
