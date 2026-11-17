# P0-M004 — Vegetation local smoke

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs `P0-T*` after M001; **serialize** vs other M* on same GPU |
| Branch | `vp/P0-M004-vegetation` |
| Deps | `P0-M001` (done); run **after** `P0-M003` on this host (single GPU) |

## Objective

Run open power-line / vegetation encroachment smoke on public ROW stills on this T4; save ≥1 line OBB/box **or** vegetation proximity score as Gate 0 vegetation proof. **AGPL-3.0** smoke OK; product retrain preferred later.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/product/requirements.md` (detection id `vegetation`)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Private: `local-notes/05-roadmap-assumptions/08-model-gate-corrosion-crack-vegetation.md` (G0.1 vegetation row)
- Private: `local-notes/models-experiments/vegetation/NOTES.md`
- Private: `local-notes/models-experiments/REFERENCES.md`

## Allowed paths

- `local-notes/models-experiments/vegetation/**`
- `local-notes/models-experiments/_scratch/**` (read venv; optional sample/cache)
- `task-cards/P0-M004/evidence/**`
- `task-cards/P0-M004/CARD.md` (status flip only)
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/**`, `packages/**`, or claim `grid-perception` integration on this card.

## Acceptance criteria

- [x] Dep `P0-M001` done (CUDA + ultralytics proven)
- [x] Weights fetched via documented script (prefer PL-YOLOv8 Drive `weights.zip`; note AGPL-3.0)
- [x] Predict on public/synthetic aerial/ROW stills — **no customer corridor media**
- [x] ≥1 image with line OBB/box **or** documented veg encroachment score
- [x] Annotated output path recorded (blob may be gitignored)
- [x] License + attribution URL in evidence (**AGPL-3.0** called out)
- [x] `NOTES.md` updated: imgsz, conf thr, FPS note on T4, fail cases, product-retrain warning
- [x] Evidence markdown with cmds + 5–20 lines stdout

## Validation

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
nvidia-smi
./local-notes/models-experiments/vegetation/scripts/download.sh
./local-notes/models-experiments/vegetation/scripts/smoke_predict.sh
ls local-notes/models-experiments/vegetation/runs/g0-smoke/
```

Logged: 10/12 Powerline OBB; best conf 0.578; annotated under `local-notes/models-experiments/vegetation/runs/g0-smoke/`.

## Evidence

Write `./evidence/g0-vegetation-smoke.md` (+ annotated image path note). Do not mark `done` without verification skill.

Logged: `./evidence/g0-vegetation-smoke.md`.

## Anti-leak

- [x] VoltPulse detector id `vegetation` in any public wording
- [x] No proprietary model filenames / internal brand strings in tracked notes
- [x] Do not copy proprietary DeepStream configs / encroachment civic weights into tracked tree
- [x] Weights / large blobs untracked

## Notes

- Serialize GPU after M003.
- AGPL smoke only — do not promote PL-YOLOv8 into product ship without retrain/license review.
- Gate0 veg proof does **not** wire Kafka.
