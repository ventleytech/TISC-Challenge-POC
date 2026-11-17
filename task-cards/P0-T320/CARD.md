# P0-T320 — pulse-web live API + real ack/write

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ morning gap #3) |
| Parallel | `ok` vs ML / T310 Postgres core — **tiny** ack route only on `alerts.controller` + OpenAPI; no store rewrite |
| Branch | `vp/P0-T320-web-live-api` |
| Deps | `P0-T230` wow UI, `P0-T300` findings ingest (on main) |

## Objective

Wire `apps/pulse-web` to `VITE_PULSE_API_URL` (or `VITE_PULSE_API_BASE=1`) for inspections / assets / alerts / findings / ack. Keep mock fallback when unset or live fetch fails. Preserve T230 steel/volt wow UI — no visual simplification. Ship tiny `POST /alerts/{id}/ack` so operator ack can persist.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `apps/pulse-web/README.md`
- `apps/pulse-api/README.md`
- `packages/contracts/openapi/openapi.yaml`
- `local-notes/05-roadmap-assumptions/11-morning-readiness.md` (gap #3)

## Allowed paths

- `apps/pulse-web/**`
- `apps/pulse-api/src/alerts/**` (ack only)
- `apps/pulse-api/src/domain/{domain,memory,postgres}.store.ts` (`ackAlert` port only — post-T310 merge)
- `apps/pulse-api/test/**` (ack smoke only if needed)
- `packages/contracts/openapi/openapi.yaml` (ack op only)
- `task-cards/P0-T320/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit T310 Postgres/store/Compose trees. Do not restyle wow UI.

## Acceptance criteria

- [x] Live mode reads inspections/assets/alerts/findings when `VITE_PULSE_API_URL` or `VITE_PULSE_API_BASE=1` set
- [x] Mock fallback when env unset (default) or live request fails
- [x] `ackAlert` POSTs live ack when enabled; mock-local otherwise
- [x] Optional `VITE_PULSE_API_KEY` → `X-API-Key` on live requests
- [x] OpenAPI + Nest `POST /api/v1/alerts/{alertId}/ack`
- [x] Wow UI / tokens untouched (no densify rollback)
- [x] `npm run build` (+ lint) pass in pulse-web
- [x] Evidence under `./evidence/`
- [x] Anti-leak clean

## Validation

```bash
cd apps/pulse-web && npm run lint && npm run build
# optional live smoke (api up + auth stub):
# VITE_PULSE_API_URL=http://127.0.0.1:3000/api/v1 VITE_PULSE_API_KEY=dev-operator npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-web task-cards/P0-T320 packages/contracts/openapi/openapi.yaml apps/pulse-api/src/alerts && exit 1 || true
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse names only
- [x] No proprietary paste

## Notes

- T310 owns Postgres migration. Post-merge: `DomainStore.ackAlert` added; Memory + Postgres implement (idempotent `COALESCE(ack_at, now())`). See evidence/02.
- Findings API shape is thinner than UI board rows — client adapts defaults for missing criticality / recommendation / occurred_at.
