# P0-T040 — `pulse-gateway` C01 live-pull scaffold

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master Stream H / C01) |
| Parallel | `ok` vs M* / T001 / T002 / notify / store / web / api (app-only) |
| Branch | `vp/P0-T040-pulse-gateway` |
| Deps | Compose shell preferred (`P0-T001`); DeepStream / real MediaMTX **out of scope** |

## Objective

Scaffold `apps/pulse-gateway` as a MediaMTX-class **session control stub**: load RTSP/RTMP listen config from env, register pull URLs into a file-based session registry, expose health, and document a handoff payload for `grid-perception` — no proprietary copy, no full DeepStream.

## Input docs

- `docs/architecture.md` (Media plane / `pulse-gateway`)
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/feature-catalog.md` (C01 Live RTSP/RTMP)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`

## Allowed paths

- `apps/pulse-gateway/**`
- `task-cards/P0-T040/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit: `apps/pulse-store/**`, `apps/grid-rules/**`, `apps/grid-perception/**`, `apps/pulse-notify/**`, `apps/pulse-web/**`, `apps/pulse-api/**`, `infra/compose/docker-compose.yml`, `models-experiments/**`, proprietary POC trees.

## Acceptance criteria

- [x] `apps/pulse-gateway` boots with `GET /health`
- [x] Session config (RTSP/RTMP ports, public host, registry dir) loaded from env / settings — not hardcoded in business logic
- [x] `POST /sessions` registers RTSP or RTMP pull URL; persisted in file-based registry
- [x] `GET /sessions/:id/handoff` returns VoltPulse handoff note for `grid-perception`
- [x] README documents handoff fields (no DeepStream install required)
- [x] Anti-leak: VoltPulse / `vp.*` names only; no proprietary paste
- [x] Evidence under `./evidence/` with smoke commands + short output

## Validation

```bash
cd apps/pulse-gateway && npm ci && npm test && npm run smoke
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-gateway && exit 1 || true
graphify update .
```

## Evidence

Write under `./evidence/` (e.g. `01-gateway-scaffold.md`).

## Anti-leak

- [x] VoltPulse names only (`pulse-gateway`, Media plane)
- [x] No proprietary gateway configs / topic catalogs / UI chrome

## Notes

- Compose already stubs `pulse-gateway` under profile `media` (T001); this card owns app code only.
- Real MediaMTX binary + live DeepStream pull are later cards — URL registry + handoff is enough for C01 scaffold.
