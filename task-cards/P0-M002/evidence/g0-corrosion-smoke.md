# P0-M002 evidence — corrosion local smoke

Detector id: `corrosion` (VoltPulse)  
Host: Tesla T4 · torch `2.14.1+cu126` · ultralytics `8.4.215`  
Date: 2026-11-18  
Dep: `P0-M001` done

## License / attribution

| Asset | URL | License |
|-------|-----|---------|
| Weights | https://huggingface.co/Decizez/yolov-corrosion-detection | MIT |
| Sample stills | https://huggingface.co/datasets/LibreYOLO/corrosion-bi3q3 | CC-BY-4.0 |

Local weight file (untracked): `local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt`

## Commands

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
# download
./local-notes/models-experiments/corrosion/scripts/download.sh
# samples via huggingface_hub → corrosion/samples/test/images/ (8 jpgs)
yolo predict \
  model=local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt \
  source=local-notes/models-experiments/corrosion/samples/test/images \
  device=0 conf=0.25 imgsz=640 \
  project=local-notes/models-experiments/corrosion/runs \
  name=g0-smoke exist_ok=True save=True
```

## Stdout (abridged)

```text
Ultralytics 8.4.215  torch-2.14.1+cu126 CUDA:0 (Tesla T4, 15095MiB)
YOLO11l-seg summary (fused): 203 layers, 27,592,302 parameters

image 1/8 … Attaran7_…jpg: (no detections), 32.6ms
image 2/8 … KKR_DSCN1327_…jpg: 1 moderate-corrosion, 1 severe-corrosion, 37.4ms
image 3/8 … KwanLoneDSCN1716_…jpg: 2 severe-corrosions, 27.9ms
image 4/8 … ManSaung-2_…jpg: 1 corrosion, 31.2ms
image 5–8/8 … (no detections)
Speed: 4.8ms preprocess, 32.4ms inference, 7.1ms postprocess per image
Results saved to …/corrosion/runs/g0-smoke
```

Python confirm: `images=8 with_det=3` · best conf `0.714` · `PASS`

## Annotated output

Path (blob gitignored):  
`local-notes/models-experiments/corrosion/runs/g0-smoke/KKR_DSCN1327_JPG_jpg.rf.0a59bb930f9d0ab502f3f8494297d496.jpg`  
(+ `KwanLoneDSCN1716_…jpg`, `ManSaung-2_…jpg`)

## Settings noted in NOTES.md

- imgsz=640 · conf=0.25 · ~32 ms/img inference on T4
- Fail: 5/8 miss; domain gap vs tower hardware

## Anti-leak

- Public wording uses VoltPulse detector id `corrosion` only.
- No proprietary model filenames / DeepStream configs copied.
- Weights + annotated blobs untracked under `local-notes/`.

## Result

**PASS** — Gate 0.1 partial unlock (≥1 annotated corrosion detection on T4).
