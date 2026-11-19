# P0-T396 — pulse-train Dockerfile + compose real service

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T396-train-compose` |
| Parallel | `yes` (pulse-train compose block only; no kafka e2e scripts) |

## Objective

Replace alpine stub `pulse-train` with built Node image (multi-stage, same pattern as `pulse-notify`), `/health` healthcheck, queue volume.

## Allowed paths

`apps/pulse-train/Dockerfile`, `infra/compose/docker-compose.yml` (pulse-train block + `pulse_train_data` volume only), `.env.template` (train keys), `infra/compose/README.md` (one line), `task-cards/P0-T396/**`.

## Acceptance criteria

- [x] Multi-stage Dockerfile, non-root `node`, `HEALTHCHECK` on `/health`
- [x] Compose `pulse-train` builds `voltpulse/pulse-train:dev`, env-driven (no hardcoded host/port), volume `pulse_train_data:/data/train`
- [x] Isolated `-p vp396` build + up → `(healthy)`; `/health` 200; O04 smoke (TP+FP) 202s; queue persists across restart
- [x] MinIO/mc image digests untouched; all-profile `config` valid; anti-leak grep clean

## Evidence

`evidence/` — `ps.txt`, `health.json`, `smoke-o04.txt`, `dataset-after-restart.json`, `user.txt`.
