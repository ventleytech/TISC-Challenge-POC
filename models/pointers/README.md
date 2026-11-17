# Model pointers (no blobs)

Open-weight pointers for VoltPulse Gate0 detectors. Actual `.pt` / ONNX files live under gitignored `local-notes/models-experiments/` on the GPU host.

| Detector | Env key | Local Gate0 path (host) | ONNX (host) | Upstream | License |
|----------|---------|-------------------------|-------------|----------|---------|
| corrosion | `GP_WEIGHTS_CORROSION` | `…/corrosion/weights/Basic_YOLO11_v1.pt` | `…/corrosion/weights/Basic_YOLO11_v1.onnx` (105.6 MB, YOLO11l-seg) | https://huggingface.co/Decizez/yolov-corrosion-detection | MIT |
| crack | `GP_WEIGHTS_CRACK` | `…/crack-damage/weights/vpmbgi-yolo11n-best.pt` | `…/crack-damage/weights/vpmbgi-yolo11n-best.onnx` (10.2 MB) | train on https://github.com/phd-benel/vpmbgi (CC BY 4.0) | our smoke train |
| vegetation | `GP_WEIGHTS_VEGETATION` | `…/vegetation/weights/pl_yolov8s.pt` | `…/vegetation/weights/pl_yolov8s.onnx` (43.7 MB) | https://github.com/Jessica-hub/PL-YOLOv8 | **AGPL-3.0** (smoke only) |

`…` = `local-notes/models-experiments`. Export notes: `task-cards/P0-T011/evidence/onnx-export-index.md`.

Do not commit weight binaries here.
