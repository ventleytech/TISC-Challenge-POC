# P0-M001 — ML host baseline (CUDA torch + ultralytics)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `no` (owns GPU host install) |
| Branch | `vp/P0-M001-ml-host` |
| Deps | — |

## Objective

Prove this host can run CUDA PyTorch + Ultralytics (Tesla T4) so Gate 0 detector smokes can start. No product app code.

## Input docs

- `docs/architecture.md` (Sense plane / `grid-perception` context only)
- `docs/anti-leak.md`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Private Gate 0 playbook: `local-notes/05-roadmap-assumptions/08-model-gate-corrosion-crack-vegetation.md` (G0.0 section)
- Private refs: `local-notes/models-experiments/REFERENCES.md`

## Allowed paths

- `local-notes/models-experiments/_scratch/**`
- `task-cards/P0-M001/evidence/**`
- `task-cards/P0-M001/CARD.md` (status flip only)

Do **not** edit `apps/**`, `packages/**`, `infra/**`, or tracked `models/**` on this card.

## Acceptance criteria

- [x] `nvidia-smi` shows GPU (expect Tesla T4)
- [x] Venv under `local-notes/models-experiments/_scratch/venv/` (or documented equivalent under `_scratch/`)
- [x] `torch` installed with CUDA available: `torch.cuda.is_available() == True`
- [x] `ultralytics` importable; version recorded
- [x] `opencv-python-headless` + `huggingface_hub` installed (prep for M002)
- [x] Evidence note under `./evidence/` with commands + short stdout
- [x] Anti-leak: no proprietary brand strings introduced in any tracked file touched

## Validation

```bash
nvidia-smi
# activate venv created under local-notes/models-experiments/_scratch/
python -c "import torch; print(torch.__version__, torch.cuda.is_available()); assert torch.cuda.is_available()"
python -c "import ultralytics; print(ultralytics.__version__)"
python -c "import cv2, huggingface_hub; print('ok')"
```

## Evidence

Write under `./evidence/` (e.g. `g0-ml-host.md`). Media/logs gitignored; keep short `.md` tracked.

Logged: `./evidence/g0-ml-host.md` — torch `2.14.1+cu126`, ultralytics `8.4.215`, CUDA True on Tesla T4.

## Anti-leak

- [x] VoltPulse names only if any public surface touched (prefer none)
- [x] No proprietary paste; weights stay out of git
- [x] Never commit `local-notes/`, venv, or `graphify-out/`

## Notes

- First overnight pick. After `done`, flip `P0-M002` from `blocked` → `ready`.
- Disk: prefer slim install; stop and write `evidence/BLOCKED.md` if free disk &lt;10G or driver error.
- graphify: not required for pure `_scratch` pip work; run `graphify query` before any broader explore.
