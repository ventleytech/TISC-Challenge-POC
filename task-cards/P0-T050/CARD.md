# P0-T050 — C10 Auth + Energy roles stub (`pulse-api`)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master C10 / S5) |
| Parallel | `ok` vs web/ML/perception; serialize vs other `apps/pulse-api` writers |
| Branch | `vp/P0-T050-auth-roles` |
| Deps | `P0-T004` (API stubs) |

## Objective

Dev-friendly auth stub on `pulse-api`: Energy roles (S5), API key / Bearer principal map, `utility_id` scoping, and guards on sample `/api/v1` routes — no IdP, no pulse-web.

## Input docs

- `docs/product/requirements.md` (Roles)
- `docs/product/feature-catalog.md` (C10)
- `docs/architecture.md`
- `docs/anti-leak.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-api/**`
- `.env.template`
- `task-cards/P0-T050/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (T050 row / status only)

Read-only: `packages/contracts/**`, `docs/**`.

## Acceptance criteria

- [x] Roles enum stub: `platform_admin` \| `utility_admin` \| `energy_supervisor` \| `energy_operator` \| `viewer`
- [x] Dev auth via `X-API-Key` **or** `Authorization: Bearer <key>`; principals from env (no hardcoded secrets)
- [x] `utility_id` scoping: non-`platform_admin` cannot access other utilities (list/create + get-by-id)
- [x] Sample routes guarded: unauthenticated → 401; `viewer` cannot POST; health/OpenAPI stay public
- [x] `GET /api/v1/me` returns principal for smoke
- [x] Unit + e2e cover auth/roles/scope; evidence with curl
- [x] Anti-leak clean (VoltPulse names only)

## Validation

```bash
cd apps/pulse-api && npm test && npm run test:e2e && npm run build
# smoke (auth on) — see evidence/
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-api --glob '!node_modules/**' && exit 1 || true
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary auth/IdP paste; stub keys are local placeholders only

## Notes

- Stub only — real OIDC/JWT is a follow-up card.
- Do not touch pulse-web / pulse-store / grid-* in this card.
