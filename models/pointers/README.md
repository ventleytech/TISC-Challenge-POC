# Model pointers (no blobs)

Open-weight pointers for VoltPulse Gate0 detectors. Actual `.pt` / ONNX files live under gitignored `local-notes/models-experiments/` on the GPU host.

| Detector | Env key | Local Gate0 path (host) | Upstream | License |
|----------|---------|-------------------------|----------|---------|
| corrosion | `GP_WEIGHTS_CORROSION` | `local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt` | https://huggingface.co/Decizez/yolov-corrosion-detection | MIT |
| crack | `GP_WEIGHTS_CRACK` | `local-notes/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt` | train on https://github.com/phd-benel/vpmbgi (CC BY 4.0) | our smoke train |
| vegetation | `GP_WEIGHTS_VEGETATION` | `local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt` | https://github.com/Jessica-hub/PL-YOLOv8 | **AGPL-3.0** (smoke only) |

Do not commit weight binaries here.
