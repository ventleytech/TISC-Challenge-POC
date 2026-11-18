#!/usr/bin/env bash
# P0-T394: Compose perception E2E, isolated project (-p vp394).
#   sample image -> grid-perception inbox volume -> (CPU fallback detectors, sentinel rows)
#   -> vp.detect.v1.jsonl on shared pulse_bus_files -> grid-rules (tail)
#   -> vp.findings.v1.jsonl on the same bus; grid-rules /health loop counters asserted.
# No Kafka, no weights, no GPU: sag + thermal_hotspot fallbacks only. Sentinel rows are
# conf 0.01 -> severity info -> findings yes, alerts no (below GRID_RULES_ALERT_MIN_SEVERITY).
# API post is out of scope (bus proof is the AC; pulse-api glue is T390).
#
# Isolation: own project name, own volumes, own host port, container_name reset via temp
# override; long-lived voltpulse stack untouched. Teardown: `down -v` for vp394 only.
#
# Env: VP394_NO_BUILD=1 reuse images; VP394_KEEP=1 skip teardown; VP394_EVIDENCE_DIR;
#      VP394_GP_PORT (grid-perception health host port).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${VP394_PROJECT:-vp394}"
EVIDENCE_DIR="${VP394_EVIDENCE_DIR:-$ROOT/task-cards/P0-T394/evidence}"
COMPOSE_FILE="$ROOT/infra/compose/docker-compose.yml"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/vp394-XXXXXX")"
OVERRIDE="$TMP/override.yml"
GP_PORT="${VP394_GP_PORT:-8594}"
ASSET_ID="cccccccc-cccc-4ccc-8ccc-cccccccccccc" # matches grid-rules fixtures/assets.json
INSPECTION_ID="$(python3 -c 'import uuid;print(uuid.uuid4())')"

mkdir -p "$EVIDENCE_DIR" "$TMP/models"

# Shell env beats --env-file.
export GP_HEALTH_PORT="$GP_PORT"
export GP_DETECTORS="sag,thermal_hotspot"
export GP_FALLBACK_SENTINEL=1
export GP_POLL_MS=500
export GP_MODELS_HOST_DIR="$TMP/models" # empty: no Gate0 weights in this run

cat >"$OVERRIDE" <<YML
# Drop fixed container_name (no collision with default stack); pin inspection/asset ids.
services:
  grid-perception:
    container_name: !reset null
    environment:
      GP_INSPECTION_ID: "$INSPECTION_ID"
      GP_ASSET_ID: "$ASSET_ID"
  grid-rules: { container_name: !reset null }
YML

dc() {
  docker compose -p "$PROJECT" --env-file "$ROOT/.env.template" -f "$COMPOSE_FILE" -f "$OVERRIDE" \
    --profile sense --profile stream "$@"
}

cleanup() {
  local rc=$?
  if [[ "${VP394_KEEP:-0}" != "1" ]]; then
    echo "[t394] teardown: down -v (project $PROJECT only)" >&2
    dc down -v --remove-orphans >&2 2>&1 || true
  fi
  rm -rf "$TMP"
  exit $rc
}
trap cleanup EXIT

fail() { echo "[t394] FAIL: $*" >&2; dc logs --tail 30 >&2 2>&1 || true; exit 1; }

rules_health() {
  dc exec -T grid-rules node -e "fetch('http://127.0.0.1:'+(process.env.GRID_RULES_HEALTH_PORT||8080)+'/health').then(r=>r.text()).then(t=>console.log(t))"
}
gp_health() {
  dc exec -T grid-perception python -c "import os,urllib.request as u;print(u.urlopen('http://127.0.0.1:'+os.environ['GP_HEALTH_PORT']+'/health',timeout=3).read().decode())"
}

if docker compose -p "$PROJECT" ls -q 2>/dev/null | rg -qx "$PROJECT"; then
  echo "[t394] project $PROJECT already exists; run 'docker compose -p $PROJECT down -v' first" >&2
  trap - EXIT; rm -rf "$TMP"; exit 2
fi

echo "[t394] config check" >&2
dc config -q || fail "compose config invalid"

echo "[t394] up: grid-perception + grid-rules (no kafka, --no-deps)" >&2
BUILD=(--build); [[ "${VP394_NO_BUILD:-0}" == "1" ]] && BUILD=()
dc up -d "${BUILD[@]}" --no-deps grid-perception grid-rules >&2

for i in $(seq 1 60); do gp_health >/dev/null 2>&1 && break; sleep 1; done
gp_health >"$EVIDENCE_DIR/perception-health-before.json" || fail "grid-perception health"
for i in $(seq 1 40); do rules_health >/dev/null 2>&1 && break; sleep 1; done
rules_health >"$EVIDENCE_DIR/rules-health-before.json" || fail "grid-rules health"
python3 -c 'import json,sys;d=json.load(open(sys.argv[1]));assert d["ingest_loop"] is True and d["processed"]==0,d' \
  "$EVIDENCE_DIR/perception-health-before.json" || fail "perception ingest loop not on"
echo "[t394] up; perception: $(cat "$EVIDENCE_DIR/perception-health-before.json")" >&2

echo "[t394] drop sample image into inbox volume (as container user)" >&2
python3 - "$TMP/sample.png" <<'PY'
import struct, sys, zlib
w = h = 32
raw = b"".join(b"\x00" + bytes([180, 90, 40]) * w for _ in range(h))  # rust-coloured 32x32 RGB
def chunk(t, d):
    c = struct.pack(">I", len(d)) + t + d
    return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) \
    + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")
open(sys.argv[1], "wb").write(png)
PY
# Write under a dot-name then rename: watcher never sees a half-written file (suffix filter).
dc exec -T grid-perception sh -c 'cat > /data/inbox/.sample.tmp && mv /data/inbox/.sample.tmp /data/inbox/sample-t394.png' \
  <"$TMP/sample.png" || fail "inbox drop"

echo "[t394] wait perception processed=1, rules detects=1 findings>=1 rejected=0" >&2
OK=0
for i in $(seq 1 40); do
  GH="$(gp_health 2>/dev/null || true)"
  RH="$(rules_health 2>/dev/null || true)"
  if python3 -c '
import json,sys
g=json.loads(sys.argv[1]); r=json.loads(sys.argv[2])["loop"]
sys.exit(0 if g["processed"]==1 and g["failed"]==0 and r["detects"]==1 and r["findings"]>=1 and r["rejected"]==0 else 1)' "$GH" "$RH" 2>/dev/null; then OK=1; break; fi
  sleep 1
done
[[ "$OK" == "1" ]] || fail "counters never converged (perception: ${GH:-none}; rules: ${RH:-none})"
echo "$GH" >"$EVIDENCE_DIR/perception-health-after.json"
echo "$RH" >"$EVIDENCE_DIR/rules-health-after.json"

echo "[t394] read bus jsonl + inbox state from containers" >&2
dc exec -T grid-rules cat /data/bus/vp.detect.v1.jsonl >"$EVIDENCE_DIR/bus-vp.detect.v1.jsonl" || fail "read detect bus"
dc exec -T grid-rules cat /data/bus/vp.findings.v1.jsonl >"$EVIDENCE_DIR/bus-vp.findings.v1.jsonl" || fail "read findings bus"
dc exec -T grid-rules sh -c 'cat /data/bus/vp.alerts.v1.jsonl 2>/dev/null || true' >"$EVIDENCE_DIR/bus-vp.alerts.v1.jsonl"
dc exec -T grid-perception sh -c 'ls -l /data/inbox /data/inbox/processed' >"$EVIDENCE_DIR/inbox-listing.txt" || fail "inbox listing"

python3 - "$EVIDENCE_DIR" "$INSPECTION_ID" "$ASSET_ID" <<'PY'
import json, sys
ev, insp, asset = sys.argv[1:4]
rd = lambda n: [json.loads(l) for l in open(f"{ev}/bus-vp.{n}.v1.jsonl") if l.strip()]
detects, findings, alerts = rd("detect"), rd("findings"), rd("alerts")
assert len(detects) == 1, detects
d = detects[0]
assert d["inspection_id"] == insp and d["asset_id"] == asset and d["source"] == "upload", d
classes = sorted(x["class_id"] for x in d["detections"])
assert classes == ["sag", "thermal_hotspot"], classes
assert all(x["confidence"] <= 0.01 for x in d["detections"]), "fallback conf ceiling broken"
assert sorted(r["class_id"] for r in d["fallback_reasons"]) == classes, d.get("fallback_reasons")
src_ids = {x["detection_id"] for x in d["detections"]}
assert len(findings) == 2, findings
for w in findings:
    assert w["inspection_id"] == insp, w
    assert w["finding"]["severity"] == "info", w  # conf 0.01 -> demoted to info
    assert set(w["finding"]["source_detection_ids"]) <= src_ids, w
assert alerts == [], alerts  # info < alert min severity (medium): honest, no fake alert
listing = open(f"{ev}/inbox-listing.txt").read()
assert listing.split("processed:")[-1].count("sample-t394.png") == 1, listing  # moved to processed/
print(f"ok detects=1 detections={len(d['detections'])} findings={len(findings)} alerts={len(alerts)}")
PY

echo "[t394] PASS inspection=$INSPECTION_ID"
echo "PASS inspection=$INSPECTION_ID perception=$(python3 -c 'import json,sys;g=json.loads(sys.argv[1]);print("processed=%d detections=%d"%(g["processed"],g["detections"]))' "$GH") rules=$(python3 -c 'import json,sys;r=json.loads(sys.argv[1])["loop"];print("detects=%d findings=%d alerts=%d rejected=%d"%(r["detects"],r["findings"],r["alerts"],r["rejected"]))' "$RH")" \
  >"$EVIDENCE_DIR/result.txt"
