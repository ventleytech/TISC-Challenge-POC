# P0-T397 — pulse-store HTTP app Dockerfile + compose service

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T397-store-compose` |
| Parallel | `yes` (store profile only; no kafka e2e scripts) |

## Objective

Compose `pulse-store` was already real MinIO (T110/T371), so elevate `apps/pulse-store` into a built HTTP service `pulse-store-api` (same pattern as notify/train), backed by MinIO in the `store` profile.

## Allowed paths

`apps/pulse-store/**`, `infra/compose/docker-compose.yml` (new `pulse-store-api` block + `pulse_store_api_data` volume only), `.env.template` (`PULSE_STORE_HTTP_*`), `infra/compose/README.md`, `task-cards/P0-T397/**`.

## Acceptance criteria

- [x] Multi-stage Dockerfile, non-root `node`, `HEALTHCHECK` on `/health`
- [x] HTTP app: health, object put/get/head/delete, evidence POST, legal hold, retention status
- [x] Compose `pulse-store-api` builds `voltpulse/pulse-store:dev`, env-driven, backend minio, depends on MinIO + bucket init
- [x] Isolated `-p vp397` build + up → `(healthy)`; roundtrip lands in MinIO; hold blocks delete; meta survives restart
- [x] MinIO + mc digests untouched; all-profile `config` valid; anti-leak grep clean; unit tests pass

## Evidence

`evidence/` — `ps.txt`, `health.json`, `smoke.txt`.
