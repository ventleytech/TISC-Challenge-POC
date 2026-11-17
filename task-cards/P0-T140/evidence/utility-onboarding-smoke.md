# P0-T140 evidence — M01 utility onboarding stub

Date: 2026-11-18  
Branch: `vp/P0-T140-utility-onboarding`  
Base: `vp/P0-T050-auth-roles` @ `6e3b4cf`

## What landed

- `POST /api/v1/utilities` (`platform_admin`) → utility + first `utility_admin` stub API key (in-memory)
- Runtime `AuthService.registerPrincipal` so onboarded keys authenticate immediately
- `POST /api/v1/utilities/:utilityId/seed` → thin sites + assets for that utility (`platform_admin` | owning `utility_admin`)
- `GET /api/v1/utilities` (+ get-by-id) with `utility_id` scoping
- Optional `site_id` on assets

## Validation

```text
cd apps/pulse-api
npm test          # 5 suites / 19 tests PASS
npm run test:e2e  # 10 tests PASS (incl. M01 onboarding + seed)
npm run build     # PASS
```

## Curl smoke (`PULSE_API_PORT=3140`, auth on)

```text
GET  /health                                              → 200
POST /api/v1/utilities (no creds)                         → 401
POST /api/v1/utilities X-API-Key:dev-operator             → 403
POST /api/v1/utilities X-API-Key:dev-platform             → 201 {id, admin.api_key}
GET  /api/v1/me X-API-Key:ua-smoke                        → 200 utility_admin + utility_id
POST /api/v1/utilities/:id/seed X-API-Key:ua-smoke        → 201 site_ids + asset_ids
GET  /api/v1/assets?utility_id=:id X-API-Key:ua-smoke     → 200 items
GET  /api/v1/utilities/:id X-API-Key:dev-operator         → 403
```

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api --glob '!node_modules/**'
# → clean
```

## Shortcut / follow-up

- `shortcut:` in-memory utilities/memberships + stub keys — upgrade to Postgres + IdP org membership.
- OpenAPI paths for `/utilities` not updated this card (API-only stub).
