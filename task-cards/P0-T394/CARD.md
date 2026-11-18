# P0-T394 — Compose E2E via grid-perception inbox → shared bus → grid-rules

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T394-perception-e2e` |
| Parallel | `yes` (script + evidence only; no compose / app edits) |
| Depends | T384, T385, T382, T390 |

## Objective

Prove sample image → `grid-perception` inbox volume → CPU fallback detectors → `vp.detect.v1.jsonl` on shared `pulse_bus_files` → `grid-rules` → findings jsonl, in real containers, isolated project `vp394`.

## Allowed paths

`scripts/s2-compose-perception-e2e.sh`, `scripts/README.md`, `task-cards/P0-T394/**`.

## Acceptance criteria

- [x] Isolated project `-p vp394`: own volumes + host port (8594), `container_name` reset via temp override; default stack (`vp-pulse-bus`, `vp-pulse-postgres`) untouched
- [x] PNG dropped into inbox volume; perception `/health` processed=1 failed=0 detections=2; file lands in `processed/`
- [x] `vp.detect.v1.jsonl` has 1 event: pinned inspection/asset ids, `sag` + `thermal_hotspot` rows (conf ≤ 0.01), `fallback_reasons` present
- [x] grid-rules `/health` loop: detects=1 findings=2 alerts=0 rejected=0; `vp.findings.v1.jsonl` read back (2 findings, severity `info`)
- [x] `down -v` for `vp394` only (trap); MinIO / compose file untouched

## Notes

- Fallback detectors (CPU, `GP_FALLBACK_SENTINEL=1`): sentinel conf 0.01 → severity `info` → findings but **no alerts** (min alert severity `medium`). Script asserts `alerts == []` — honest, no fake alert.
- pulse-api POST not exercised; bus proof is the AC (API glue covered by T390).
- Gate0-weight detectors need ultralytics (not in CPU image) — out of scope.

## Evidence

`evidence/01-compose-perception-e2e.md` (+ health, bus jsonl, inbox listing, result.txt).
