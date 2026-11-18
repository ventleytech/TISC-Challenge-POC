# P0-T400 — pulse-web live-by-default

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | cost-efficient remaining build |
| Parallel | `no` (pulse-web client) |
| Branch | `main` (serial) |

## Objective

`pulse-web` prefers live Nest API by default; mock only with explicit `VITE_PULSE_MOCK=1`.

## Input docs

- `apps/pulse-web/README.md`
- `docs/anti-leak.md`

## Allowed paths

- `apps/pulse-web/**`
- `infra/compose/docker-compose.yml`
- `.env.template`
- `task-cards/P0-T400/**`

## Acceptance criteria

- [x] `liveApiEnabled()` true unless `VITE_PULSE_MOCK=1`
- [x] Dev/Compose bake default `VITE_PULSE_API_URL` / `PULSE_WEB_API_URL`
- [x] README documents live-default + mock opt-out
- [x] `npm run build` green

## Validation

```bash
cd apps/pulse-web && npm run build
```

## Evidence

`./evidence/verify.md`
