# P0-M004 evidence — vegetation local smoke

Detector id: `vegetation` (VoltPulse)  
Host: Tesla T4 · torch `2.14.1+cu126` · ultralytics `8.4.215`  
Date: 2026-11-18  
Dep: `P0-M001` done · after `P0-M003` (GPU serialize)

## License / attribution

| Asset | URL | License |
|-------|-----|---------|
| Weights (PL-YOLOv8s) | https://github.com/Jessica-hub/PL-YOLOv8 · Drive `weights.zip` | **AGPL-3.0** |
| Sample stills | Drive `images_vegmetric.zip` (same project) | project data; AGPL stack |
| Paper | https://arxiv.org/abs/2503.00044 | see publisher |

**Product note:** AGPL smoke only — retrain on permissive data before Demo Day ship.

Local weight (untracked): `local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt`

## Commands

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
./local-notes/models-experiments/vegetation/scripts/download.sh
./local-notes/models-experiments/vegetation/scripts/smoke_predict.sh
```

## Stdout (abridged)

```text
Ultralytics 8.4.215  torch-2.14.1+cu126 CUDA:0 (Tesla T4, 15095MiB)
YOLOv8s-obb summary (fused): 81 layers, 11,411,958 parameters

image 1/12 … 09_9180_0_1.jpg: 1 Powerline, 9.8ms
image 2–3/12 … (no detections)
image 4/12 … 09_9180_1_2.jpg: 1 Powerline, 11.1ms
…
image 12/12 … 11_00090_3_1.jpg: 1 Powerline, 7.9ms
Speed: 6.1ms preprocess, 10.6ms inference, 16.6ms postprocess per image
Results saved to …/vegetation/runs/g0-smoke

SUMMARY images=12 with_det=10 boxes=13 best_conf=0.578
PASS
```

## Annotated output

Path (blob gitignored):  
`local-notes/models-experiments/vegetation/runs/g0-smoke/09_9180_0_1.jpg`  
(+ 9 more annotated stills with Powerline OBB)

## ONNX export

```bash
yolo export model=…/weights/pl_yolov8s.pt format=onnx imgsz=640 simplify=True
# → weights/pl_yolov8s.onnx (43.7 MB)
```

## Settings noted in NOTES.md

- imgsz=640 · conf=0.25 · ~11 ms/img inference on T4
- Fail: 2/12 miss; line OBB ≠ tree encroachment score (metric deferred)

## Anti-leak

- Public wording uses VoltPulse detector id `vegetation` only.
- No proprietary civic encroachment weights / DeepStream configs copied.
- Weights + annotated blobs untracked under `local-notes/`.

## Result

**PASS** — ≥1 annotated Powerline OBB on T4 (10/12 smoke stills). Gate 0 crack+corrosion+vegetation smokes complete.
