# P0-T050 evidence — C10 auth + Energy roles stub

Date: 2026-11-18  
Branch: `vp/P0-T050-auth-roles`  
Base: `vp/P0-T004-api-stubs` @ `4ea3129`

## What landed

- Energy roles: `platform_admin` | `utility_admin` | `energy_supervisor` | `energy_operator` | `viewer`
- Dev credentials via `PULSE_AUTH_STUB_KEYS` (`key:role:utility_id;…`)
- Accepts `X-API-Key` **or** `Authorization: Bearer <key>`
- Global `AuthGuard` + `RolesGuard`; `UtilityScopeInterceptor` on query/body `utility_id`
- Get-by-id checks resource `utility_id` via `AuthService.assertUtilityAccess`
- `POST` on inspections/assets/alerts requires `WRITE_ROLES` (viewer → 403)
- `GET /health` + OpenAPI mount remain public; `GET /api/v1/me` for smoke
- Config keys added to `.env.template` (local placeholders only)

## Validation

```text
cd apps/pulse-api
npm test          # 4 suites / 15 tests PASS
npm run test:e2e  # 9 tests PASS (401 / viewer 403 / scope 403 / platform OK)
npm run build     # PASS
```

## Curl smoke (`PULSE_API_PORT=3050`, auth on)

```text
GET  /health                                              → 200 {"status":"ok","service":"pulse-api"}
GET  /api/v1/inspections?utility_id=<A>   (no creds)      → 401
GET  /api/v1/me  Authorization: Bearer dev-operator       → 200 energy_operator + utility A
POST /api/v1/inspections  X-API-Key: dev-viewer           → 403
POST /api/v1/inspections  X-API-Key: dev-operator         → 201 {id}
GET  /api/v1/inspections?utility_id=<B>  X-API-Key: op    → 403
GET  /api/v1/inspections?utility_id=<B>  X-API-Key: plat  → 200 {items:[]}
```

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api --glob '!node_modules/**'
# → clean
```

## Shortcut / follow-up

- `shortcut:` stub API-key map — replace with OIDC/JWT IdP + real org membership store (later card).
- OpenAPI `securitySchemes` not updated this card (API-only stub).
