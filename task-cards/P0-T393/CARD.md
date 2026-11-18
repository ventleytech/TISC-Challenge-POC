# P0-T393 — grid-rules HTTP sink → pulse-api

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T393-rules-http-api` |
| Parallel | `yes` (no perception paths; T394 untouched) |
| Depends | T390 |

## Objective

grid-rules posts emitted findings/alerts to pulse-api over HTTP from inside the container, replacing the host-side glue in the T390 script.

## Allowed paths

`apps/grid-rules/**`, `infra/compose/docker-compose.yml` (grid-rules env only), `.env.template`, `scripts/s2-compose-bus-e2e.sh`, `scripts/README.md`, `task-cards/P0-T393/**`, `task-cards/P0-T390/CARD.md`, plan row.

## Acceptance criteria

- [x] Env-gated: `GRID_RULES_API_BASE_URL` (+ `GRID_RULES_API_KEY` → `X-API-Key`, `GRID_RULES_API_TIMEOUT_MS`); unset = off
- [x] After emit: `POST /api/v1/findings` (id = rules `finding_id`), then `POST /api/v1/alerts` (existing pulse-api endpoints, no API change)
- [x] Failures (non-2xx, timeout, network, missing tenant) logged + counted in `/health` `loop.http`; never fatal, file/Kafka out unaffected
- [x] Compose env wired for grid-rules (default empty = off; smoke sets `http://pulse-api:<port>`)
- [x] Unit tests (`test/http-sink.test.ts`: gating, payloads/headers, failure paths, real HTTP server + dead API loop)
- [x] Compose smoke updated: host script no longer POSTs; E2E passes under `vp393`
- [x] MinIO / compose services other than grid-rules env untouched; `down -v` for `vp393` only

## Notes

- Default compose leaves the sink off: pulse-api's Kafka consumer on the same stream would produce duplicate finding ids (400, logged).
- Findings with no `utility_id` (no asset context) are skipped + logged.

## Evidence

`evidence/unit-tests.txt`, `evidence/result.txt`, `rules-health-after.json` (`http: {posted:2, failed:0}`), `api-listed.json`, `postgres-rows.txt`.
