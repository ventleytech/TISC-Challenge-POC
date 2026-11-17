#!/usr/bin/env bash
# File-ingest smoke using Gate0 scratch venv + weight paths from env.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
APP="$ROOT/apps/grid-perception"
VENV="${GP_VENV:-$ROOT/local-notes/models-experiments/_scratch/venv}"

if [[ ! -x "$VENV/bin/python" ]]; then
  echo "missing venv python: $VENV/bin/python" >&2
  echo "Docker CUDA image for grid-perception is a follow-up; use host venv for now." >&2
  exit 1
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

export PULSE_DETECT_TOPIC="${PULSE_DETECT_TOPIC:-vp.detect.v1}"
export GP_DEVICE="${GP_DEVICE:-0}"
export GP_CONF="${GP_CONF:-0.25}"
export GP_IMGSZ="${GP_IMGSZ:-640}"
export GP_WEIGHTS_CORROSION="${GP_WEIGHTS_CORROSION:-$ROOT/local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt}"
export GP_WEIGHTS_CRACK="${GP_WEIGHTS_CRACK:-$ROOT/local-notes/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt}"
export GP_WEIGHTS_VEGETATION="${GP_WEIGHTS_VEGETATION:-$ROOT/local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt}"

SOURCE="${1:-$ROOT/local-notes/models-experiments/corrosion/samples/test/images}"
DETECTORS="${2:-corrosion}"
OUT="${3:-/tmp/vp-detect.json}"

cd "$APP"
PYTHONPATH=. python -m grid_perception \
  --source "$SOURCE" \
  --detectors "$DETECTORS" \
  --out "$OUT"
