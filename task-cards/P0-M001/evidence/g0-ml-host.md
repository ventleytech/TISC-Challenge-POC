# P0-M001 evidence — ML host baseline

Host: Tesla T4 16GB · Driver 580.178.04 · CUDA toolkit 13.0  
Venv: `local-notes/models-experiments/_scratch/venv/` (gitignored)  
Date: 2026-11-18

## Disk before install

```text
/dev/root  243G  203G  40G  84% /
```

## Commands

```bash
nvidia-smi
python3 -m venv local-notes/models-experiments/_scratch/venv  # already present
source local-notes/models-experiments/_scratch/venv/bin/activate
pip install --upgrade pip
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
pip install ultralytics opencv-python-headless huggingface_hub
python -c "import torch; print(torch.__version__, torch.cuda.is_available()); assert torch.cuda.is_available()"
python -c "import ultralytics; print(ultralytics.__version__)"
python -c "import cv2, huggingface_hub; print('ok')"
```

## Validation stdout (abridged)

```text
GPU: Tesla T4, 15360 MiB
torch 2.14.1+cu126 cuda True device Tesla T4
ultralytics 8.4.215
cv2 5.1.0 hf 2.4.0 ok
```

## Disk after install

```text
/dev/root  243G  211G  32G  88% /
venv size: 7.1G
```

## Anti-leak

- No tracked product code touched.
- No proprietary brand strings in this evidence.
- Venv / weights stay under gitignored `local-notes/`.

## Result

**PASS** — CUDA torch + ultralytics ready for Gate 0 detector smokes (`P0-M002`).
