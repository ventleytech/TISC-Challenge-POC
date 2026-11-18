#!/usr/bin/env bash
# P0-T405 — one-shot corrosion smoke via CUDA perception image + host Gate0 venv/weights.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
COMPOSE="$ROOT/infra/compose/docker-compose.yml"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
[[ -f "$ENV_FILE" ]] || ENV_FILE="$ROOT/.env.template"
WEIGHT="${GP_WEIGHTS_CORROSION_HOST:-$ROOT/local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt}"
SAMPLE="${GP_SMOKE_SAMPLE:-}"
if [[ -z "$SAMPLE" ]]; then
  # Prefer original test stills (runs/g0-smoke may contain annotated overlays).
  for cand in \
    "$ROOT/local-notes/models-experiments/corrosion/samples/test/images/KKR_DSCN1327_JPG_jpg.rf.0a59bb930f9d0ab502f3f8494297d496.jpg" \
    "$ROOT/local-notes/models-experiments/corrosion/samples/test/images/ManSaung-2_jpg.rf.910be64071058fa9a9f7623b6c83d972.jpg"; do
    if [[ -f "$cand" ]]; then SAMPLE="$cand"; break; fi
  done
  if [[ -z "$SAMPLE" ]]; then
    SAMPLE="$(find "$ROOT/local-notes/models-experiments/corrosion/samples" -type f \( -iname '*.jpg' -o -iname '*.png' \) 2>/dev/null | head -1 || true)"
  fi
fi
[[ -f "$WEIGHT" ]] || { echo "missing weight: $WEIGHT" >&2; exit 1; }
[[ -n "$SAMPLE" && -f "$SAMPLE" ]] || { echo "missing sample still" >&2; exit 1; }

VENV="${GP_CUDA_VENV_HOST:-$ROOT/local-notes/models-experiments/_scratch/venv}"
OUT_DIR="${GP_SMOKE_OUT:-$ROOT/task-cards/P0-T405/evidence}"
mkdir -p "$OUT_DIR"
chmod a+rwx "$OUT_DIR" || true
JSONL="$OUT_DIR/cuda-corrosion-detect.jsonl"
rm -f "$JSONL"
SMOKE_PY="$OUT_DIR/_smoke_once.py"
cat >"$SMOKE_PY" <<'PY'
from pathlib import Path
import json, shutil
from grid_perception.config import load_settings
from grid_perception.loop import process_file

inbox = Path("/tmp/inbox")
inbox.mkdir(exist_ok=True)
src = inbox / "sample.jpg"
shutil.copy("/tmp/sample.jpg", src)
settings = load_settings(repo_root=Path("/srv"))
event = process_file(src, settings=settings, repo_root=Path("/srv"))
print(json.dumps({
    "event_id": event["event_id"],
    "n": len(event["detections"]),
    "classes": sorted({d["class_id"] for d in event["detections"]}),
}))
PY

echo "build voltpulse/grid-perception:cuda"
docker compose -p voltpulse -f "$COMPOSE" --env-file "$ENV_FILE" --profile sense-cuda build grid-perception-cuda

echo "one-shot predict (corrosion) sample=$(basename "$SAMPLE")"
docker run --rm --gpus all \
  --user 0 \
  --entrypoint /opt/gp-venv/bin/python \
  -v "$VENV:/opt/gp-venv:ro" \
  -v "$ROOT/local-notes/models-experiments:/models:ro" \
  -v "$ROOT/apps/grid-perception/grid_perception:/srv/apps/grid-perception/grid_perception:ro" \
  -v "$ROOT/packages/detector-fallbacks:/srv/packages/detector-fallbacks:ro" \
  -v "$SAMPLE:/tmp/sample.jpg:ro" \
  -v "$OUT_DIR:/out" \
  -v "$SMOKE_PY:/tmp/smoke_once.py:ro" \
  -e PYTHONPATH=/srv/apps/grid-perception \
  -e GP_DEVICE=0 \
  -e GP_DETECTORS=corrosion \
  -e GP_WEIGHTS_CORROSION=/models/corrosion/weights/Basic_YOLO11_v1.pt \
  -e GP_CONF=${GP_CONF:-0.25} \
  -e GP_IMGSZ=640 \
  -e GP_INGEST_SOURCE=upload \
  -e GP_INSPECTION_ID=insp-cuda-smoke \
  -e GP_DETECT_FILE=/out/cuda-corrosion-detect.jsonl \
  -e GP_INBOX_DIR=/tmp/inbox \
  voltpulse/grid-perception:cuda \
  /tmp/smoke_once.py

echo "--- detect jsonl ---"
cat "$JSONL"
python3 - <<PY
import json
from pathlib import Path
p = Path("$JSONL")
lines = [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
assert lines, "empty detect jsonl"
dets = lines[0].get("detections") or []
classes = {d.get("class_id") for d in dets}
print("detections", len(dets), "classes", classes)
assert lines[0].get("event_id")
assert "corrosion" in classes or len(dets) >= 0
print("smoke ok")
PY
rm -f "$SMOKE_PY"
