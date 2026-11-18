# P0-T340 — Compose real images

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `no` (touches `infra/compose/docker-compose.yml`) |
| Branch | `vp/P0-T340-compose-images` |
| Deps | T320, T330, T335 on main |

## Objective

Replace alpine `sleep` stubs for `pulse-api`, `pulse-web`, `grid-rules`, `grid-perception` with buildable images wired into Compose. Preserve Kafka (`pulse-bus`), Postgres, MinIO (`pulse-store`) services untouched.

## Allowed paths

- `apps/*/Dockerfile`, `apps/pulse-web/nginx.conf.template`, `.dockerignore`
- `apps/grid-rules/src/serve.ts`, `apps/grid-perception/grid_perception/serve.py` (health entrypoints)
- `infra/compose/docker-compose.yml`, `.env.template`
- `task-cards/P0-T340/**`

## Acceptance criteria

- [x] 4 images build via `docker compose build` (context = repo root)
- [x] `pulse-api` runs sql migrations then serves; `/health` healthy
- [x] `pulse-web` = nginx static of Vite build (SPA fallback); API base baked via build args
- [x] `grid-rules` image keeps Kafka producer (T335 `cli.ts` / `kafka-sink`) + `serve.js` health entrypoint; `KAFKA_BROKERS` + producer flag wired
- [x] `grid-perception` CPU stub image (no torch); GPU image = follow-up
- [x] Healthchecks on all four
- [x] No `.env`, models, `local-notes` in build context

## Known gaps (follow-up)

- `grid-rules` / `grid-perception` entrypoints serve `/health` only; no live consume loop yet.
- Host ports 3000/3010 were busy during smoke; verified `pulse-api` with `PULSE_API_PORT=3920`.

## Validation

See `evidence/01-compose-build.md`.
