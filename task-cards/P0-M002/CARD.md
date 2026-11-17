# P0-M002 — Corrosion local smoke (first detection proof)

| Field | Value |
|-------|-------|
| Status | `ready` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs `P0-T*` after M001; serialize vs other M* on same GPU |
| Branch | `vp/P0-M002-corrosion` |
| Deps | `P0-M001` (must be `done` with CUDA evidence) |

## Objective

Run open corrosion YOLO weights on sample RGB stills on this T4; save ≥1 annotated detection as Gate 0.1 partial unlock for perception work.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/product/requirements.md` (detection id `corrosion`)
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Private: `local-notes/05-roadmap-assumptions/08-model-gate-corrosion-crack-vegetation.md` (G0.1 corrosion row)
- Private: `local-notes/models-experiments/corrosion/NOTES.md`
- Private: `local-notes/models-experiments/REFERENCES.md`

## Allowed paths

- `local-notes/models-experiments/corrosion/**`
- `local-notes/models-experiments/_scratch/**` (read venv; optional sample cache)
- `task-cards/P0-M002/evidence/**`
- `task-cards/P0-M002/CARD.md` (status flip only)

Do **not** edit `apps/**`, `packages/**`, or claim `grid-perception` integration on this card.

## Acceptance criteria

- [ ] Dep `P0-M001` done (CUDA + ultralytics proven)
- [ ] Weights fetched via documented one-liner / `scripts/download.sh` under corrosion folder (prefer HF `Decizez/yolov-corrosion-detection`, MIT)
- [ ] `yolo predict` (or equiv) on 3–10 public/synthetic rusty stills — **no customer corridor media**
- [ ] ≥1 image with box/mask confidence above chosen threshold
- [ ] Annotated output path recorded (blob may be gitignored)
- [ ] License + attribution URL in evidence
- [ ] `NOTES.md` updated: imgsz, conf thr, FPS note on T4, fail cases
- [ ] Evidence markdown with cmds + 5–20 lines stdout

## Validation

```bash
# use M001 venv
nvidia-smi
# after download script / hf download into corrosion folder or HF cache
yolo predict model=<path-or-id> source=<sample-dir> device=0
# or python ultralytics API equivalent
ls <annotated-out>  # at least one annotated image
```

## Evidence

Write `./evidence/g0-corrosion-smoke.md` (+ optional annotated image path note). Do not mark `done` without verification skill.

## Anti-leak

- [ ] VoltPulse detector id `corrosion` in any public wording
- [ ] No proprietary model filenames / internal brand strings in tracked notes
- [ ] Do not copy proprietary DeepStream configs into tracked tree
- [ ] Weights / large blobs untracked

## Notes

- Status starts `blocked` until M001 clears. Overnight loop: after M001 done, set this card `ready` then implement.
- Gate0-partial unlocks later perception cards — this card alone does **not** wire Kafka.
- Prefer MIT Decizez path; if download fails, set `blocked` + reason — switch to `P0-T002`.
