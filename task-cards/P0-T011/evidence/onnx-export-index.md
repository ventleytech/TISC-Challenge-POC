# P0-T011 evidence — ONNX export path index

Date: 2026-11-18  
Host blobs under `local-notes/models-experiments/` (gitignored).  
Source smokes: M002 / M003 / M004 / T010.

## Present

| Detector | `.pt` | `.onnx` | Size | Evidence |
|----------|-------|---------|------|----------|
| corrosion | `…/corrosion/weights/Basic_YOLO11_v1.pt` | `…/corrosion/weights/Basic_YOLO11_v1.onnx` | 105.6 MB | this card (§ Corrosion export) · Decizez / MIT · **YOLO11l-seg** |
| crack | `…/crack-damage/weights/vpmbgi-yolo11n-best.pt` | `…/crack-damage/weights/vpmbgi-yolo11n-best.onnx` | 10.2 MB | `task-cards/P0-M003/evidence/g0-crack-smoke.md` (§ ONNX export) |
| vegetation | `…/vegetation/weights/pl_yolov8s.pt` | `…/vegetation/weights/pl_yolov8s.onnx` | 43.7 MB | `task-cards/P0-M004/evidence/g0-vegetation-smoke.md` (§ ONNX export) · **AGPL-3.0** |

Export cmd (logged in M003/M004/T011):

```bash
yolo export model=<pt> format=onnx imgsz=640 simplify=True
```

## Corrosion export (this card)

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
cd local-notes/models-experiments/corrosion/weights
yolo export model=Basic_YOLO11_v1.pt format=onnx imgsz=640 simplify=True
# → Basic_YOLO11_v1.onnx (105.6 MB), ~11.4s, Ultralytics 8.4.215, opset 18
# .pt preserved: Basic_YOLO11_v1.pt (106.3 MB)
```

Stdout (abridged):

```
YOLO11l-seg summary (fused): 203 layers, 27,592,302 parameters
ONNX: export success, saved as 'Basic_YOLO11_v1.onnx' (105.6 MB)
```

Validation:

```bash
ls -lh local-notes/models-experiments/corrosion/weights/*.onnx
# -rw-rw-r-- … Basic_YOLO11_v1.onnx  105.6M
ls -lh local-notes/models-experiments/crack-damage/weights/*.onnx
# … vpmbgi-yolo11n-best.onnx  10.2M
ls -lh local-notes/models-experiments/vegetation/weights/*.onnx
# … pl_yolov8s.onnx  43.7M
```

## Consumers

- File-ingest stub (T010): Ultralytics `.pt` via env `GP_WEIGHTS_*` — see `task-cards/P0-T010/evidence/file-ingest-smoke.md`
- ONNX runtime / DeepStream path: **not started** (later card)
- Note: corrosion ONNX is **segment** task (`task=segment`); crack/veg are detect

## Anti-leak

- Detector ids: `corrosion` / `crack` / `vegetation` (VoltPulse)
- Vegetation **AGPL-3.0** called out
- No `.onnx` / `.pt` committed; paths only

## Result

**PASS** — all three Gate0 detectors have ONNX on disk + path/size evidence.
