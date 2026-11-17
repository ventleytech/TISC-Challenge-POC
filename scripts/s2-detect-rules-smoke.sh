#!/usr/bin/env bash
# S2 file-bus smoke: grid-perception (or fixture) → grid-rules → evidence JSON.
# No Kafka, MinIO, pulse-api, or pulse-web.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_DIR="${S2_EVIDENCE_DIR:-$ROOT/task-cards/P0-T130/evidence}"
DETECT_OUT="$EVIDENCE_DIR/detect.v1.json"
RULES_OUT="$EVIDENCE_DIR/findings-alerts.json"
NOTES_MD="$EVIDENCE_DIR/s2-detect-rules-smoke.md"

# Gate0 notes/weights live in the primary checkout; worktrees may not carry gitignored trees.
NOTES_ROOT="${VP_NOTES_ROOT:-}"
if [[ -z "$NOTES_ROOT" ]]; then
  if [[ -d "$ROOT/local-notes/models-experiments" ]]; then
    NOTES_ROOT="$ROOT/local-notes"
  elif [[ -d "$(dirname "$ROOT")/TISC-Challenge-POC/local-notes/models-experiments" ]]; then
    NOTES_ROOT="$(dirname "$ROOT")/TISC-Challenge-POC/local-notes"
  else
    NOTES_ROOT="$ROOT/local-notes"
  fi
fi

VENV="${GP_VENV:-$NOTES_ROOT/models-experiments/_scratch/venv}"
WEIGHT_CORROSION="${GP_WEIGHTS_CORROSION:-$NOTES_ROOT/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt}"
SAMPLE_DIR="${GP_SOURCE:-$NOTES_ROOT/models-experiments/corrosion/samples/test/images}"
FIXTURE_DETECT="${S2_FIXTURE_DETECT:-$ROOT/apps/grid-rules/fixtures/synthetic-detect.v1.json}"
ASSETS_JSON="${S2_ASSETS_JSON:-$ROOT/apps/grid-rules/fixtures/assets.json}"
ASSET_ID="${S2_ASSET_ID:-cccccccc-cccc-4ccc-8ccc-cccccccccccc}"
INSPECTION_ID="${S2_INSPECTION_ID:-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb}"
DETECTORS="${S2_DETECTORS:-corrosion}"
MODE="unset"

mkdir -p "$EVIDENCE_DIR"

gpu_busy() {
  # Treat >70% util or >2GiB used as busy; allow override.
  if [[ "${GP_FORCE_FIXTURE:-}" == "1" ]]; then
    return 0
  fi
  if [[ "${GP_ALLOW_BUSY:-}" == "1" ]]; then
    return 1
  fi
  if ! command -v nvidia-smi >/dev/null 2>&1; then
    return 1
  fi
  local util mem
  util="$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ' || echo 0)"
  mem="$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits 2>/dev/null | head -1 | tr -d ' ' || echo 0)"
  if [[ "${util:-0}" -gt 70 ]] || [[ "${mem:-0}" -gt 2048 ]]; then
    return 0
  fi
  return 1
}

can_run_perception() {
  [[ -x "$VENV/bin/python" ]] || return 1
  [[ -f "$WEIGHT_CORROSION" ]] || return 1
  [[ -d "$SAMPLE_DIR" ]] || return 1
  [[ -d "$ROOT/apps/grid-perception/grid_perception" ]] || return 1
  if gpu_busy; then
    return 1
  fi
  return 0
}

run_perception() {
  echo "[s2-smoke] perception file-ingest → $DETECT_OUT" >&2
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  export PULSE_DETECT_TOPIC="${PULSE_DETECT_TOPIC:-vp.detect.v1}"
  export GP_DEVICE="${GP_DEVICE:-0}"
  export GP_CONF="${GP_CONF:-0.25}"
  export GP_IMGSZ="${GP_IMGSZ:-640}"
  export GP_WEIGHTS_CORROSION="$WEIGHT_CORROSION"
  export GP_WEIGHTS_CRACK="${GP_WEIGHTS_CRACK:-$NOTES_ROOT/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt}"
  export GP_WEIGHTS_VEGETATION="${GP_WEIGHTS_VEGETATION:-$NOTES_ROOT/models-experiments/vegetation/weights/pl_yolov8s.pt}"

  cd "$ROOT/apps/grid-perception"
  PYTHONPATH=. python -m grid_perception \
    --source "$SAMPLE_DIR" \
    --detectors "$DETECTORS" \
    --ingest-source upload \
    --inspection-id "$INSPECTION_ID" \
    --asset-id "$ASSET_ID" \
    --out "$DETECT_OUT"
  MODE="perception"
}

use_fixture() {
  local reason="$1"
  echo "[s2-smoke] fixture detect ($reason) → $DETECT_OUT" >&2
  if [[ ! -f "$FIXTURE_DETECT" ]]; then
    echo "missing fixture: $FIXTURE_DETECT" >&2
    exit 2
  fi
  cp "$FIXTURE_DETECT" "$DETECT_OUT"
  MODE="fixture:$reason"
}

run_rules() {
  echo "[s2-smoke] grid-rules ← $DETECT_OUT → $RULES_OUT" >&2
  cd "$ROOT/apps/grid-rules"
  if [[ ! -d node_modules ]]; then
    npm install --no-fund --no-audit
  fi
  # Smoke default: include low-severity findings as alerts so SLA fields show up
  # when Gate0 confidences demote corrosion below medium. Override via env.
  export GRID_RULES_ALERT_MIN_SEVERITY="${GRID_RULES_ALERT_MIN_SEVERITY:-low}"
  export VP_TOPIC_DETECT="${VP_TOPIC_DETECT:-vp.detect.v1}"
  export VP_TOPIC_FINDINGS="${VP_TOPIC_FINDINGS:-vp.findings.v1}"
  export VP_TOPIC_ALERTS="${VP_TOPIC_ALERTS:-vp.alerts.v1}"
  # Avoid npm start banner polluting JSON stdout.
  npx --no-install tsx src/cli.ts --fixture "$DETECT_OUT" --assets "$ASSETS_JSON" >"$RULES_OUT"
}

write_evidence_md() {
  local detect_n findings_n alerts_n top_risk
  detect_n="$(python3 -c "import json; print(len(json.load(open('$DETECT_OUT'))['detections']))")"
  findings_n="$(python3 -c "import json; print(len(json.load(open('$RULES_OUT'))['findings']))")"
  alerts_n="$(python3 -c "import json; print(len(json.load(open('$RULES_OUT'))['alerts']))")"
  top_risk="$(python3 -c "import json; d=json.load(open('$RULES_OUT')); print(d.get('summary',{}).get('top_risk'))")"

  cat >"$NOTES_MD" <<EOF
# P0-T130 evidence — S2 detect → rules file-bus smoke

| Field | Value |
|-------|-------|
| Mode | \`$MODE\` |
| Detect | \`task-cards/P0-T130/evidence/detect.v1.json\` ($detect_n detections) |
| Rules out | \`task-cards/P0-T130/evidence/findings-alerts.json\` |
| Findings | $findings_n |
| Alerts | $alerts_n |
| Top risk | $top_risk |
| Topics | \`vp.detect.v1\` → \`vp.findings.v1\` / \`vp.alerts.v1\` |

## Commands

\`\`\`bash
./scripts/s2-detect-rules-smoke.sh
# fixture-only:
# GP_FORCE_FIXTURE=1 ./scripts/s2-detect-rules-smoke.sh
\`\`\`

## Summary

- File-bus glue only (no Kafka / MinIO / pulse-api / pulse-web).
- Perception path used when Gate0 venv + corrosion weight + free GPU; otherwise fixture \`apps/grid-rules/fixtures/synthetic-detect.v1.json\`.
- \`grid-rules\` ranked findings (W01 risk) and SLA alerts written to evidence JSON.

## Anti-leak

- VoltPulse service names only (\`grid-perception\`, \`grid-rules\`).
- Topics \`vp.*\` only; no proprietary brand strings in script/evidence.

## Result

**PASS** — detect → rules hop produced findings=$findings_n alerts=$alerts_n (mode=$MODE).
EOF

  echo "[s2-smoke] wrote $NOTES_MD" >&2
  echo "[s2-smoke] PASS mode=$MODE detections=$detect_n findings=$findings_n alerts=$alerts_n top_risk=$top_risk"
}

main() {
  if [[ "${GP_FORCE_FIXTURE:-}" == "1" ]]; then
    use_fixture "GP_FORCE_FIXTURE=1"
  elif can_run_perception; then
    if ! run_perception; then
      use_fixture "perception_failed"
    fi
  else
    reason="missing_venv_or_weights_or_gpu_busy"
    if [[ "${GP_FORCE_FIXTURE:-}" == "1" ]]; then
      reason="GP_FORCE_FIXTURE=1"
    elif gpu_busy; then
      reason="gpu_busy"
    elif [[ ! -x "$VENV/bin/python" ]]; then
      reason="missing_venv"
    elif [[ ! -f "$WEIGHT_CORROSION" ]]; then
      reason="missing_weights"
    elif [[ ! -d "$SAMPLE_DIR" ]]; then
      reason="missing_samples"
    fi
    use_fixture "$reason"
  fi

  # Guard: empty detect still OK for fixture thermal/corrosion; fail if zero findings expected from empty list only when perception claimed detections.
  run_rules

  # Validate: detections must map to ≥1 finding; alerts expected for medium+ (W01).
  python3 -c "
import json, sys
detect = json.load(open('$DETECT_OUT'))
out = json.load(open('$RULES_OUT'))
n = len(detect.get('detections') or [])
f = len(out.get('findings') or [])
a = len(out.get('alerts') or [])
if n > 0 and f < 1:
    print(f'FAIL: {n} detections but 0 findings', file=sys.stderr)
    sys.exit(1)
if n > 0 and a < 1:
    print(f'WARN: findings={f} alerts={a} (severity floor may suppress)', file=sys.stderr)
print(f'ok detections={n} findings={f} alerts={a}')
"

  write_evidence_md
}

main "$@"
