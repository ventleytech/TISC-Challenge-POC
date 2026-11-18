# P0-T384 — grid-perception compose runs real file-ingest path

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T384-perception-compose` |
| Parallel | `no` (compose file; T382 edits grid-rules service — union on merge) |
| Depends | P0-T010, P0-T240, P0-T340 |

## Objective

Container entrypoint was health-only. Make `grid-perception` also run the file-ingest / detector path: images dropped in an inbox dir produce `vp.detect.v1` JSON lines on a file bus.

## Allowed paths

`apps/grid-perception/**`, `infra/compose/docker-compose.yml` (grid-perception service + two volumes), `.env.template` (sense block), `task-cards/P0-T384/**`, plan row.

## Acceptance criteria

- [x] `/health` unchanged contract (`status: ok`) + loop counters; HEALTHCHECK still passes
- [x] Inbox watcher (`grid_perception/loop.py`): image → detectors → JSONL line; file moves to `processed/` or `failed/`
- [x] Compose env: inbox dir, bus file, detectors, poll, conf/imgsz, `GP_WEIGHTS_*_CONTAINER`; models mounted ro at `/models`
- [x] Default detectors = honest sag/thermal fallbacks (CPU, no weights); Gate0 weights path documented, no model files touched
- [x] MinIO digests / gateway / notify / rules services untouched; all 6 profiles `config` ok
- [x] Unit tests pass; build + up healthy + ingest smoke

## Evidence

`evidence/01-build-ingest-smoke.md`.

## Known limits

- CPU stub image has no ultralytics: Gate0-weight detectors log an error and the file goes to `failed/`. CUDA/ultralytics image = follow-up card.
- Shared bus: `pulse_bus_files` is mounted only into grid-perception. grid-rules (T382) tails `/data/bus/vp.detect.v1.jsonl` in its own container; mount the same volume there (or bind a host dir) to connect them.
- `GP_MODELS_HOST_DIR` default is relative to `infra/compose`; override with an absolute path from a worktree.
