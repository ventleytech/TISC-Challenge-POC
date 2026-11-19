#!/usr/bin/env bash
# O04 smoke: POST TP + FP vp.labels.v1 payloads to pulse-train /internal/consume.
# Env:
#   PULSE_TRAIN_URL   default http://127.0.0.1:3020
#   PULSE_TRAIN_ROOT  optional path to apps/pulse-train — starts ephemeral server if health fails
set -euo pipefail

URL="${PULSE_TRAIN_URL:-http://127.0.0.1:3020}"
URL="${URL%/}"
STARTED_PID=""
TMPDIR_TRAIN=""

cleanup() {
  if [[ -n "${STARTED_PID}" ]] && kill -0 "${STARTED_PID}" 2>/dev/null; then
    kill "${STARTED_PID}" 2>/dev/null || true
    wait "${STARTED_PID}" 2>/dev/null || true
  fi
  if [[ -n "${TMPDIR_TRAIN}" && -d "${TMPDIR_TRAIN}" ]]; then
    rm -rf "${TMPDIR_TRAIN}"
  fi
}
trap cleanup EXIT

health_ok() {
  curl -sf "${URL}/health" >/dev/null 2>&1
}

if ! health_ok; then
  ROOT="${PULSE_TRAIN_ROOT:-}"
  if [[ -z "${ROOT}" ]]; then
    for cand in \
      "${PWD}/apps/pulse-train" \
      "${HOME}/voltpulse-P0-T030/apps/pulse-train" \
      "$(dirname "${PWD}")/voltpulse-P0-T030/apps/pulse-train"; do
      if [[ -f "${cand}/package.json" ]]; then
        ROOT="${cand}"
        break
      fi
    done
  fi
  if [[ -z "${ROOT}" || ! -f "${ROOT}/package.json" ]]; then
    echo "pulse-train not reachable at ${URL} and PULSE_TRAIN_ROOT not set" >&2
    exit 1
  fi
  TMPDIR_TRAIN="$(mktemp -d -t vp-o04-XXXXXX)"
  PORT="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()')"
  URL="http://127.0.0.1:${PORT}"
  (
    cd "${ROOT}"
    export PULSE_TRAIN_HOST=127.0.0.1
    export PULSE_TRAIN_PORT="${PORT}"
    export PULSE_LABELS_TOPIC=vp.labels.v1
    export PULSE_MODELS_TOPIC=vp.models.v1
    export PULSE_STORE_ENDPOINT=http://127.0.0.1:9000
    export PULSE_TRAIN_DATA_DIR="${TMPDIR_TRAIN}"
    export PULSE_TRAIN_RELOAD_MODE=log
    export PULSE_TRAIN_JOB_AUTO_ADVANCE=true
    if [[ ! -d node_modules ]]; then
      npm ci --silent
    fi
    npx --yes tsx src/index.ts
  ) >/tmp/vp-o04-train.log 2>&1 &
  STARTED_PID=$!
  for _ in $(seq 1 40); do
    if health_ok; then
      break
    fi
    sleep 0.25
  done
  if ! health_ok; then
    echo "failed to start pulse-train; log:" >&2
    tail -n 40 /tmp/vp-o04-train.log >&2 || true
    exit 1
  fi
fi

uuid() {
  python3 -c 'import uuid; print(uuid.uuid4())'
}

post_label() {
  local accepted="$1"
  local class_id="$2"
  local corrected="${3:-}"
  local event_id label_id finding_id payload
  event_id="$(uuid)"
  label_id="$(uuid)"
  finding_id="$(uuid)"
  if [[ -n "${corrected}" ]]; then
    payload=$(cat <<EOF
{"event_id":"${event_id}","occurred_at":"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)","label":{"label_id":"${label_id}","finding_id":"${finding_id}","class_id":"${class_id}","accepted":${accepted},"corrected_class_id":"${corrected}","labeler_role":"energy_operator"}}
EOF
)
  else
    payload=$(cat <<EOF
{"event_id":"${event_id}","occurred_at":"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)","label":{"label_id":"${label_id}","finding_id":"${finding_id}","class_id":"${class_id}","accepted":${accepted},"labeler_role":"energy_operator"}}
EOF
)
  fi
  curl -sS -o /tmp/vp-o04-resp.json -w "%{http_code}" \
    -X POST "${URL}/internal/consume" \
    -H 'content-type: application/json' \
    -d "${payload}"
}

echo "== health =="
curl -sS "${URL}/health"
echo

TP_CODE="$(post_label true corrosion)"
echo "== TP POST → ${TP_CODE} =="
cat /tmp/vp-o04-resp.json
echo

FP_CODE="$(post_label false crack vegetation)"
echo "== FP POST → ${FP_CODE} =="
cat /tmp/vp-o04-resp.json
echo

echo "== labels =="
curl -sS "${URL}/internal/labels"
echo

if [[ "${TP_CODE}" != "202" || "${FP_CODE}" != "202" ]]; then
  echo "smoke failed: expected 202 for TP and FP" >&2
  exit 1
fi

echo "O04 smoke OK (TP+FP → ${URL})"
