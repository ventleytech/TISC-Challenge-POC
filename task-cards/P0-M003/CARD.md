# P0-M003 — Crack local smoke

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs `P0-T*` after M001; **serialize** vs other M* on same GPU |
| Branch | `vp/P0-M003-crack` |
| Deps | `P0-M001` (done); prefer after `P0-M002` for GPU quiet |

## Objective

Run open insulator crack/breakage detector on public RGB stills on this T4; save ≥1 annotated `broken`/`breakage`/crack-class detection as Gate 0 crack proof.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/product/requirements.md` (detection id `crack`)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Private: `local-notes/05-roadmap-assumptions/08-model-gate-corrosion-crack-vegetation.md` (G0.1 crack row)
- Private: `local-notes/models-experiments/crack-damage/NOTES.md`
- Private: `local-notes/models-experiments/REFERENCES.md`

## Allowed paths

- `local-notes/models-experiments/crack-damage/**`
- `local-notes/models-experiments/_scratch/**` (read venv; optional sample/cache)
- `task-cards/P0-M003/evidence/**`
- `task-cards/P0-M003/CARD.md` (status flip only)
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/**`, `packages/**`, or claim `grid-perception` integration on this card.

## Acceptance criteria

- [x] Dep `P0-M001` done (CUDA + ultralytics proven)
- [x] Weights fetched via documented one-liner / `scripts/download.sh` under crack-damage folder
- [x] Prefer Insulator-Crack path; if no published `.pt`, document fallback (e.g. ready HF insulator-defect weights or short train on VPMBGI CC BY)
- [x] Predict on public/synthetic insulator stills — **no customer corridor media**
- [x] ≥1 image with crack/breakage/`broken` box above chosen threshold
- [x] Annotated output path recorded (blob may be gitignored)
- [x] License + attribution URL in evidence (Verify / AGPL risks noted)
- [x] `NOTES.md` updated: imgsz, conf thr, FPS note on T4, fail cases
- [x] Evidence markdown with cmds + 5–20 lines stdout

## Validation

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
nvidia-smi
./local-notes/models-experiments/crack-damage/scripts/download.sh
./local-notes/models-experiments/crack-damage/scripts/train_smoke.sh
./local-notes/models-experiments/crack-damage/scripts/smoke_predict.sh
ls local-notes/models-experiments/crack-damage/runs/g0-smoke/  # ≥1 annotated image
```

Logged: 11/12 detections; best conf 0.669; annotated under `local-notes/models-experiments/crack-damage/runs/g0-smoke/`.

## Evidence

Write `./evidence/g0-crack-smoke.md` (+ annotated image path note). Do not mark `done` without verification skill.

Logged: `./evidence/g0-crack-smoke.md`.

## Anti-leak

- [x] VoltPulse detector id `crack` in any public wording
- [x] No proprietary model filenames / internal brand strings in tracked notes
- [x] Do not copy proprietary DeepStream configs into tracked tree
- [x] Weights / large blobs untracked

## Notes

- Serialize GPU with M002/M004 — one infer job at a time.
- Insulator-Crack GH has **no release weights** (train-only); used VPMBGI CC BY short train.
- Gate0 crack proof does **not** wire Kafka.
