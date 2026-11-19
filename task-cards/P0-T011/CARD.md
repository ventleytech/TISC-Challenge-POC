# P0-T011 — ONNX export notes (Gate0 detectors)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs pulse-*; **serialize** GPU vs infer cards |
| Branch | `vp/P0-T011-onnx-notes` (not cut yet) |
| Deps | Gate 0.1 smokes (M002/M003/M004); T010 file-ingest done |

## Objective

Notes-only index of Gate0 `.pt` → ONNX export paths for corrosion / crack / vegetation. No DeepStream wiring. No blob commits.

## Input docs

- `docs/anti-leak.md`
- `models/pointers/README.md`
- Evidence: `task-cards/P0-M003/evidence/g0-crack-smoke.md`, `task-cards/P0-M004/evidence/g0-vegetation-smoke.md`, `task-cards/P0-T010/evidence/file-ingest-smoke.md`

## Allowed paths

- `task-cards/P0-T011/**`
- `models/pointers/**` (path/URL notes only)
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/**`, `pulse-*`, or `local-notes/Trinetra-POC/**`. Weight blobs stay gitignored under `local-notes/models-experiments/`.

## Acceptance criteria

- [x] Index existing ONNX evidence paths (crack, vegetation) under `./evidence/`
- [x] Corrosion ONNX export noted or produced (`.pt` only today — gap)
- [x] Pointers README lists ONNX filenames when present (no blobs)
- [x] Anti-leak: VoltPulse detector ids; AGPL called out for vegetation

## Validation

```bash
ls -lh local-notes/models-experiments/crack-damage/weights/*.onnx
ls -lh local-notes/models-experiments/vegetation/weights/*.onnx
ls -lh local-notes/models-experiments/corrosion/weights/*.onnx
# Basic_YOLO11_v1.onnx 105.6M (2026-11-18)
```

## Evidence

`./evidence/onnx-export-index.md` — paths + sizes only.

## Anti-leak

- [x] No proprietary model names / DeepStream configs
- [x] Vegetation **AGPL-3.0** smoke noted
- [x] No `.onnx` / `.pt` in git
