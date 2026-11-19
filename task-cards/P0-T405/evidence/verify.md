# P0-T405 evidence — CUDA perception corrosion smoke

## Commands

```bash
./apps/grid-perception/scripts/cuda-corrosion-smoke.sh
```

## Results (2026-11-18)

- Image: `voltpulse/grid-perception:cuda` (nvidia/cuda:12.6.0-base-ubuntu22.04 + code)
- Compose profile: `sense-cuda` (`grid-perception-cuda`, `gpus: all`, host venv + `/models` mounts)
- Sample: `corrosion/samples/test/images/KKR_DSCN1327_…jpg`
- Detections: **2 × corrosion** (best conf ≈ 0.714) on Tesla T4 via mounted Gate0 venv
- JSONL: `./cuda-corrosion-detect.jsonl`

## Notes

CPU alpine `sense` profile unchanged. Torch/ultralytics stay in host Gate0 venv mount (`/opt/gp-venv`) to avoid baking multi-GB layers on a tight disk.

## Anti-leak

VoltPulse service names; weight path under local-notes (untracked blobs).
