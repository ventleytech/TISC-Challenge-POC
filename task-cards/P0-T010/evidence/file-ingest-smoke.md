# P0-T010 evidence — grid-perception file-ingest

Service: `grid-perception`  
Topic (config): `vp.detect.v1`  
Host: Tesla T4 · torch `2.14.1+cu126` · ultralytics via `local-notes/models-experiments/_scratch/venv`  
Date: 2026-11-18  
Deps: M002/M003/M004 Gate0 smokes green

## Commands

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
export GP_WEIGHTS_CORROSION=$PWD/local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt
export GP_WEIGHTS_CRACK=$PWD/local-notes/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt
export GP_WEIGHTS_VEGETATION=$PWD/local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt
export PULSE_DETECT_TOPIC=vp.detect.v1 GP_DEVICE=0 GP_CONF=0.25 GP_IMGSZ=640

cd apps/grid-perception
PYTHONPATH=. python tests/test_emit_schema.py
# → PASS test_emit_schema

PYTHONPATH=. python -m grid_perception \
  --source $ROOT/local-notes/models-experiments/corrosion/samples/test/images \
  --detectors corrosion --out /tmp/vp-detect-corrosion.json

PYTHONPATH=. python -m grid_perception \
  --source $ROOT/local-notes/models-experiments/corrosion/samples/test/images \
  --detectors corrosion,crack,vegetation --out /tmp/vp-detect-all-on-corrosion.json

PYTHONPATH=. python -m grid_perception \
  --source $ROOT/local-notes/models-experiments/crack-damage/samples/smoke \
  --detectors crack --out /tmp/vp-detect-crack.json

PYTHONPATH=. python -m grid_perception \
  --source $ROOT/local-notes/models-experiments/vegetation/samples/smoke \
  --detectors vegetation --out /tmp/vp-detect-veg.json
```

## Stdout / summary

```text
PASS test_emit_schema

predict corrosion … Basic_YOLO11_v1.pt
wrote /tmp/vp-detect-corrosion.json detections=5 topic=vp.detect.v1
n=5 classes=['corrosion'] best≈0.714

predict corrosion+crack+vegetation on corrosion stills
wrote /tmp/vp-detect-all-on-corrosion.json detections=14
classes=['corrosion','crack','vegetation'] best≈0.714

crack on crack smoke stills → n=13 class=crack best≈0.669
vegetation on veg smoke stills → n=13 class=vegetation best≈0.578
```

Sample detection (corrosion):

```json
{
  "class_id": "corrosion",
  "confidence": 0.7138081789016724,
  "bbox": [297.7, 339.7, 337.1, 381.3]
}
```

Event required keys present: `event_id`, `occurred_at`, `inspection_id`, `source`, `detections[]` with `detection_id` / `class_id` / `confidence` / `bbox`.

## Config note

Weights / device / conf / topic from env → `Settings` (`apps/grid-perception/.env.template`). No hardcoded Kafka hosts in business logic. Kafka produce deferred.

## Docker

Compose `sense` still alpine sleep. Host venv path documented in README; CUDA image = follow-up.

## Anti-leak

- VoltPulse `class_id` enum only in JSON.
- No proprietary DeepStream / internal brand strings in app tree.
- Weight blobs remain under `local-notes/` (untracked); `models/pointers/README.md` = URLs only.
- Vegetation pointer notes **AGPL-3.0** smoke-only.

## Result

**PASS** — file-ingest stub emits `vp.detect.v1`-shaped JSON for corrosion + crack + vegetation.
