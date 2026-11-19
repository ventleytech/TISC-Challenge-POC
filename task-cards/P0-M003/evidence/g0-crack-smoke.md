# P0-M003 evidence — crack local smoke

Detector id: `crack` (VoltPulse)  
Host: Tesla T4 · torch `2.14.1+cu126` · ultralytics `8.4.215`  
Date: 2026-11-18  
Dep: `P0-M001` done

## License / attribution

| Asset | URL | License |
|-------|-----|---------|
| Train data + samples | https://github.com/phd-benel/vpmbgi (VPMBGI / IRASet) | **CC BY 4.0** |
| Try-first (no `.pt`) | https://github.com/bhagatpandey369/Insulator-Crack | Verify (train-only; Ultralytics AGPL risk) |
| Local weights | `weights/vpmbgi-yolo11n-best.pt` (8-epoch YOLO11n train) | our train on CC BY data |

## Why not Insulator-Crack weights

Repo has **no releases / no committed `.pt`**. README requires `scripts/train.py` first. Gate 0 used REFERENCES fallback #2: VPMBGI + short own train.

Also tried (failed / not box path):

- `hdwing/insulator-defect-detection-rtdetr-r18` — custom Ultralytics pickle (`ConvNormLayer`) incompatible with stock 8.4.215
- `Amr-1009/Rotated-Insulator-YOLO11m` — classify-only (`broken_insulator`); not boxes

## Commands

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
./local-notes/models-experiments/crack-damage/scripts/download.sh
./local-notes/models-experiments/crack-damage/scripts/train_smoke.sh   # EPOCHS=8
./local-notes/models-experiments/crack-damage/scripts/smoke_predict.sh
```

## Stdout (abridged)

```text
Ultralytics 8.4.215  torch-2.14.1+cu126 CUDA:0 (Tesla T4, 15095MiB)
YOLO11n summary (fused): 101 layers, 2,597,051 parameters

image 1/12 … 01-10-…jpg: 1 iso_broken_glass, 13.9ms
image 2/12 … 01-13-…jpg: (no detections)
image 3/12 … 01-14-…jpg: 2 iso_broken_glasss, 9.0ms
image 4/12 … 01-16-…jpg: 1 iso_broken_glass, 13.4ms
… (11/12 with ≥1 box)
Speed: 6.8ms preprocess, 11.0ms inference, 2.9ms postprocess per image
Results saved to …/crack-damage/runs/g0-smoke

SUMMARY images=12 with_det=11 boxes=13 best_conf=0.669
PASS
```

Train end val: mAP50 **0.811** / mAP50-95 **0.471** on 101 valid imgs (smoke train only).

## Annotated output

Path (blob gitignored):  
`local-notes/models-experiments/crack-damage/runs/g0-smoke/01-10-_jpg.rf.78bedb6a7b67378b86de672452856fba.jpg`  
(+ 10 more annotated stills with `iso_broken_glass` boxes)

## ONNX export

```bash
yolo export model=…/weights/vpmbgi-yolo11n-best.pt format=onnx imgsz=640 simplify=True
# → weights/vpmbgi-yolo11n-best.onnx (10.2 MB)
```

## Settings noted in NOTES.md

- imgsz=640 · conf=0.25 · ~11 ms/img inference on T4
- Fail: 1/12 miss; 8-epoch nano ≠ production Insulator-Crack metrics

## Anti-leak

- Public wording uses VoltPulse detector id `crack` only.
- No proprietary model filenames / DeepStream configs copied.
- Weights + annotated blobs untracked under `local-notes/`.

## Result

**PASS** — ≥1 annotated crack/breakage box on T4 (11/12 smoke stills).
