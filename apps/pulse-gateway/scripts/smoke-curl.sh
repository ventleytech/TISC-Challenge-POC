#!/usr/bin/env bash
# curl smoke: boots gateway (file sink), syncs pull URLs, posts a synthetic frame, checks the bus file.
# Env: PULSE_GATEWAY_DETECT_SINK=kafka + KAFKA_BROKERS to smoke Kafka instead (no file check).
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${SMOKE_PORT:-3029}"
DIR="$(mktemp -d)"
export PULSE_GATEWAY_HOST=127.0.0.1 PULSE_GATEWAY_PORT="$PORT" PULSE_GATEWAY_SESSION_DIR="$DIR/sessions"
export PULSE_GATEWAY_PULL_URLS="${PULSE_GATEWAY_PULL_URLS:-rtsp://127.0.0.1:8554/live/feeder-demo}"
export PULSE_GATEWAY_DETECT_SINK="${PULSE_GATEWAY_DETECT_SINK:-file}"
export PULSE_GATEWAY_DETECT_FILE="$DIR/bus/vp.detect.v1.jsonl"
node --import tsx src/index.ts & PID=$!
trap 'kill $PID 2>/dev/null; rm -rf "$DIR"' EXIT
B="http://127.0.0.1:$PORT"
for _ in $(seq 40); do curl -sf "$B/health" >/dev/null && break; sleep 0.25; done
echo "== GET /health";        curl -sf "$B/health"; echo
echo "== GET /pull/targets";  curl -sf "$B/pull/targets"; echo
echo "== POST /pull/sync";    SYNC=$(curl -sf -X POST "$B/pull/sync"); echo "$SYNC"
SID=$(echo "$SYNC" | sed -E 's/.*"id":"([^"]+)".*/\1/')
echo "== POST /sessions/$SID/frames"
curl -sf -X POST "$B/sessions/$SID/frames" -H 'content-type: application/json' \
  -d '{"class_id":"corrosion","confidence":0.82,"bbox":[10,20,110,220]}'; echo
if [ "$PULSE_GATEWAY_DETECT_SINK" = file ]; then
  echo "== bus file"; cat "$PULSE_GATEWAY_DETECT_FILE"
fi
echo "== sink-off-style bad input (expect 400)"
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$B/sessions/$SID/frames" -d '{"class_id":"bogus"}'
echo "SMOKE OK"
