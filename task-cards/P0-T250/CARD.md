# P0-T250 — Work-order export API (`pulse-api`)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | Master catalog A07; spine optional |
| Parallel | `no` vs other `apps/pulse-api` writers; ok vs web/ML |
| Branch | `vp/P0-T250-work-order-api` |
| Deps | `P0-T140` (newest API base); `P0-T150` (`@voltpulse/work-order`) |

## Objective

Nest endpoint on `pulse-api` that exports work orders as JSON or CSV using `@voltpulse/work-order`. API only — no pulse-web.

## Input docs

- `docs/product/feature-catalog.md` (A07)
- `docs/product/requirements.md`
- `docs/architecture.md`
- `docs/anti-leak.md`
- `packages/work-order/README.md`
- Prior API cards: T004 / T050 / T140

## Allowed paths

- `apps/pulse-api/**`
- `packages/work-order/**` (workspace link / build only; prefer no behavior change)
- `task-cards/P0-T250/**`

Do **not** edit: `apps/pulse-web/**`, `local-notes/Trinetra-POC/**`.

## Acceptance criteria

- [x] `POST /api/v1/work-orders/export` accepts `utility_id` + finding/asset/party items
- [x] `format=json` → JSON rows; `format=csv` → `text/csv` body
- [x] Uses `@voltpulse/work-order` (`exportWorkOrders`) — no reimplemented CSV/JSON
- [x] Auth + `utility_id` scoping (401 unauthenticated; 403 cross-utility)
- [x] Hydrates assets from in-memory store when `asset_id` present
- [x] Smoke curl evidence under `./evidence/`
- [x] Anti-leak clean (VoltPulse names only)

## Validation

```bash
cd packages/work-order && npm ci && npm run build
cd apps/pulse-api && npm install && npm test && npm run test:e2e && npm run build
# smoke: start API, curl JSON + CSV export — see evidence/
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api packages/work-order --glob '!node_modules/**' && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary work-order / UI paste
- [x] No pulse-web T230 surface

## Notes

- Base: `vp/P0-T140-utility-onboarding` + cherry-pick `P0-T150` package.
- PDF export deferred (package CSV/JSON only).
