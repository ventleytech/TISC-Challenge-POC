# P0-T320 — live API wire + ack

**Branch:** `vp/P0-T320-web-live-api` (from main `9f1e983` / T300)

## What changed

| Area | Change |
|------|--------|
| `apps/pulse-web/src/mock/client.ts` | Shared `apiFetch` + optional `VITE_PULSE_API_KEY`; live `listFindings`; live `ackAlert` → `POST /alerts/{id}/ack`; mock fallback when unset/fail |
| `apps/pulse-web/src/vite-env.d.ts` | Env typings |
| `apps/pulse-web/README.md` | Live mode docs |
| `apps/pulse-api/.../alerts.controller.ts` | Tiny MemoryStore `POST :alertId/ack` (idempotent) |
| `packages/contracts/openapi/openapi.yaml` | `POST /alerts/{alertId}/ack` |
| UI | Alerts copy only — no wow/token rollback |

## Build / lint

```bash
cd apps/pulse-web
./node_modules/.bin/oxlint src
# Found 0 warnings and 0 errors.
npm run build
# vite build OK — dist/assets/index-*.js ~325 kB
```

```bash
cd apps/pulse-api
npx jest src/alerts/alerts.controller.spec.ts
# PASS (2)
```

## Live ack smoke (Nest already up or start:dev)

```text
POST /api/v1/findings → id=adbadb64-…
POST /api/v1/alerts   → id=7a35e667-…
POST /api/v1/alerts/7a35e667-…/ack
→ ack_at=2026-11-17T23:39:43.728Z  ACK_OK
GET  /api/v1/findings?utility_id=util-demo-01 → items includes corrosion row
```

Auth: `PULSE_AUTH_STUB_KEYS` with `dev-operator:energy_operator:util-demo-01` + `X-API-Key: dev-operator`.

Web live demo:

```bash
VITE_PULSE_API_URL=http://127.0.0.1:3000/api/v1 \
VITE_PULSE_API_KEY=dev-operator \
npm run dev
```

Unset env → mock (default).

## Anti-leak

```bash
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-web/src apps/pulse-web/README.md \
  apps/pulse-api/src/alerts packages/contracts/openapi/openapi.yaml \
  task-cards/P0-T320/evidence
# no hits
```

## graphify

`graphify update .` after code change — AST graph refreshed.

## Blockers / follow-ups

- **T310** owns Postgres store rewrite — must port `ack` when rebasing MemoryStore → Postgres.
- Live findings adapter fills UI-only fields (`criticality`, `recommendation`, `occurred_at`) — API shape thinner than C09 board.
- Evidence / ops metrics still mock (store UI later).
- Utility id: demo mock uses `util-demo-01`; stub keys must match for scoped writes.
