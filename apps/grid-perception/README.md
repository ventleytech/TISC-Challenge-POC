# grid-perception (Sense plane)

File-ingest stub: stills → Ultralytics predict → JSON aligned to `vp.detect.v1`.

Kafka produce is **out of scope** here (stdout / `--out` file only).

## Run (host venv — preferred tonight)

```bash
# from repo root
source local-notes/models-experiments/_scratch/venv/bin/activate
set -a && source apps/grid-perception/.env.template && set +a
# override weight paths to Gate0 local files:
export GP_WEIGHTS_CORROSION=local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt
export GP_WEIGHTS_CRACK=local-notes/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt
export GP_WEIGHTS_VEGETATION=local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt

python -m grid_perception \
  --source local-notes/models-experiments/corrosion/samples/test/images \
  --detectors corrosion,crack,vegetation \
  --out /tmp/vp-detect.json
```

Working directory may be repo root or `apps/grid-perception` (package is on `PYTHONPATH` via `-m` from this directory — prefer:

```bash
cd apps/grid-perception && PYTHONPATH=. python -m grid_perception ...
```

## Config

All runtime knobs via env → `grid_perception.config.Settings`. See `.env.template`. No hardcoded hosts/ports.

## Docker

Compose `sense` profile still uses alpine sleep stub. Real image + CUDA base = follow-up card. Until then use the scratch venv on the GPU host.

## Detectors

| VoltPulse `class_id` | Default weight env | Gate0 proof |
|----------------------|--------------------|-------------|
| `corrosion` | `GP_WEIGHTS_CORROSION` | M002 |
| `crack` | `GP_WEIGHTS_CRACK` | M003 |
| `vegetation` | `GP_WEIGHTS_VEGETATION` | M004 (AGPL smoke) |

Missing weight file → detector skipped with stderr warning (not a hard fail if ≥1 detector runs).

## Anti-leak

VoltPulse names only. Do not copy proprietary DeepStream configs or internal brands.
