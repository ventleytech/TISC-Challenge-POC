#!/usr/bin/env bash
# P0-T390: full Compose file-bus E2E, isolated project (-p vp390).
#   pulse-gateway --POST frame--> vp.detect.v1.jsonl on shared pulse_bus_files
#   --> grid-rules (tail) --> vp.findings.v1.jsonl / vp.alerts.v1.jsonl
#   --> (HTTP glue, as T300) --> pulse-api (Postgres) --> GET /api/v1/{findings,alerts}.
# No Kafka needed (no pulse-bus); the Kafka hop is covered by s2-rules-kafka-api-e2e.sh (T336).
#
# Isolation: own project name, own volumes, own host ports, container_name reset via a
# temp override so the long-lived voltpulse stack (vp-pulse-bus, vp-pulse-postgres...) is untouched.
# Teardown: `down -v` for project vp390 only.
#
# Env: VP390_NO_BUILD=1 reuse existing images; VP390_KEEP=1 skip teardown; VP390_EVIDENCE_DIR.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${VP390_PROJECT:-vp390}"
EVIDENCE_DIR="${VP390_EVIDENCE_DIR:-$ROOT/task-cards/P0-T390/evidence}"
COMPOSE_FILE="$ROOT/infra/compose/docker-compose.yml"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/vp390-XXXXXX")"
OVERRIDE="$TMP/override.yml"

# Host ports (distinct from the default stack).
GW_PORT="${VP390_GATEWAY_PORT:-3390}"
API_PORT="${VP390_API_PORT:-3391}"
PG_PORT="${VP390_PG_PORT:-5439}"
RTSP_PORT="${VP390_RTSP_PORT:-8590}"
API_BASE="http://127.0.0.1:$API_PORT"
GW_BASE="http://127.0.0.1:$GW_PORT"
API_KEY="dev-operator"
UTILITY_ID="11111111-1111-4111-8111-111111111111" # matches grid-rules fixtures/assets.json
ASSET_ID="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
INSPECTION_ID="$(python3 -c 'import uuid;print(uuid.uuid4())')"

mkdir -p "$EVIDENCE_DIR"

# Shell env beats --env-file, so these override .env.template values.
export PULSE_GATEWAY_PORT="$GW_PORT" PULSE_GATEWAY_RTSP_PORT="$RTSP_PORT"
export PULSE_GATEWAY_DETECT_SINK=file
export PULSE_API_PORT="$API_PORT" PULSE_PG_PORT="$PG_PORT"
export PULSE_API_BASE_URL="http://pulse-api:$API_PORT"
export PULSE_AUTH_ENABLED=true
export PULSE_AUTH_STUB_KEYS="$API_KEY:energy_operator:$UTILITY_ID"

cat >"$OVERRIDE" <<'YML'
# Drop fixed container_name so project vp390 never collides with the default stack.
services:
  pulse-gateway: { container_name: !reset null }
  grid-rules: { container_name: !reset null }
  pulse-postgres: { container_name: !reset null }
  pulse-api: { container_name: !reset null }
YML

dc() {
  docker compose -p "$PROJECT" --env-file "$ROOT/.env.template" -f "$COMPOSE_FILE" -f "$OVERRIDE" \
    --profile media --profile stream --profile data "$@"
}

cleanup() {
  local rc=$?
  if [[ "${VP390_KEEP:-0}" != "1" ]]; then
    echo "[t390] teardown: down -v (project $PROJECT only)" >&2
    dc down -v --remove-orphans >&2 2>&1 || true
  fi
  rm -rf "$TMP"
  exit $rc
}
trap cleanup EXIT

fail() { echo "[t390] FAIL: $*" >&2; dc logs --tail 30 >&2 2>&1 || true; exit 1; }

wait_http() { # url label tries
  local i
  for i in $(seq 1 "${3:-60}"); do
    curl -sf "$1" >/dev/null 2>&1 && return 0
    sleep 1
  done
  fail "$2 not healthy at $1"
}

rules_health() {
  dc exec -T grid-rules node -e "fetch('http://127.0.0.1:'+(process.env.GRID_RULES_HEALTH_PORT||8080)+'/health').then(r=>r.text()).then(t=>console.log(t))"
}

# Refuse to clobber an existing project of the same name.
if docker compose -p "$PROJECT" ls -q 2>/dev/null | rg -qx "$PROJECT"; then
  echo "[t390] project $PROJECT already exists; run 'docker compose -p $PROJECT down -v' first" >&2
  trap - EXIT; rm -rf "$TMP"; exit 2
fi

echo "[t390] config check" >&2
dc config -q || fail "compose config invalid"

echo "[t390] up: postgres, pulse-api, pulse-gateway, grid-rules (no kafka, --no-deps for rules)" >&2
BUILD=(--build); [[ "${VP390_NO_BUILD:-0}" == "1" ]] && BUILD=()
dc up -d "${BUILD[@]}" pulse-postgres pulse-api >&2
dc up -d "${BUILD[@]}" --no-deps pulse-gateway grid-rules >&2

wait_http "$API_BASE/health" pulse-api 90
wait_http "$GW_BASE/health" pulse-gateway 60
for i in $(seq 1 40); do rules_health >/dev/null 2>&1 && break; sleep 1; done
rules_health >"$EVIDENCE_DIR/rules-health-before.json" || fail "grid-rules health"
echo "[t390] services up; rules health before: $(cat "$EVIDENCE_DIR/rules-health-before.json")" >&2

echo "[t390] gateway: register session + post synthetic frame" >&2
SID="$(curl -sf -X POST "$GW_BASE/sessions" -H 'Content-Type: application/json' \
  -d '{"name":"t390-feeder","protocol":"rtsp","path":"live/t390-feeder"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')"
FRAME_RESP="$(curl -sf -X POST "$GW_BASE/sessions/$SID/frames" -H 'Content-Type: application/json' \
  -d "{\"class_id\":\"corrosion\",\"confidence\":0.9,\"asset_id\":\"$ASSET_ID\",\"inspection_id\":\"$INSPECTION_ID\"}")" \
  || fail "frame post"
echo "$FRAME_RESP" >"$EVIDENCE_DIR/gateway-frame-response.json"
echo "$FRAME_RESP" | python3 -c 'import json,sys;d=json.load(sys.stdin);assert d.get("sink")=="file",d' || fail "gateway sink != file"

echo "[t390] wait grid-rules counters (findings>=1, alerts>=1)" >&2
OK=0
for i in $(seq 1 30); do
  H="$(rules_health 2>/dev/null || true)"
  if echo "$H" | python3 -c 'import json,sys;d=json.load(sys.stdin)["loop"];sys.exit(0 if d.get("findings",0)>=1 and d.get("alerts",0)>=1 and d.get("rejected",0)==0 else 1)' 2>/dev/null; then OK=1; break; fi
  sleep 1
done
[[ "$OK" == "1" ]] || fail "grid-rules counters never reached findings>=1 alerts>=1 (last: ${H:-none})"
echo "$H" >"$EVIDENCE_DIR/rules-health-after.json"

echo "[t390] read bus jsonl from shared volume (via grid-rules container)" >&2
for f in detect findings alerts; do
  dc exec -T grid-rules cat "/data/bus/vp.$f.v1.jsonl" >"$EVIDENCE_DIR/bus-vp.$f.v1.jsonl" || fail "read vp.$f.v1.jsonl"
done
dc exec -T pulse-gateway ls -l /data/bus >"$EVIDENCE_DIR/bus-listing-gateway.txt" || fail "gateway bus listing"

echo "[t390] HTTP glue: bus findings/alerts -> pulse-api; assert via GET + psql" >&2
python3 - "$EVIDENCE_DIR" "$API_BASE" "$API_KEY" "$UTILITY_ID" "$INSPECTION_ID" <<'PY'
import json, sys, urllib.request, urllib.error
ev, base, key, util, insp = sys.argv[1:6]

def lines(name):
    return [json.loads(l) for l in open(f"{ev}/bus-vp.{name}.v1.jsonl") if l.strip()]

def req(method, path, body=None):
    r = urllib.request.Request(
        base + path, method=method,
        data=None if body is None else json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "X-API-Key": key})
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP {e.code} {method} {path}: {e.read().decode()}")

detects, findings, alerts = lines("detect"), lines("findings"), lines("alerts")
assert any(d.get("inspection_id") == insp for d in detects), "frame not in detect bus"
findings = [w for w in findings if (w.get("inspection_id") or w["finding"].get("inspection_id")) == insp]
assert findings, "no finding for this inspection on bus"
fids = {w["finding"]["finding_id"] for w in findings}
alerts = [w for w in alerts if w["alert"]["finding_id"] in fids]
assert alerts, "no alert for this inspection's findings on bus"

for w in findings:
    f = w["finding"]
    s, _ = req("POST", "/api/v1/findings", {
        "id": f["finding_id"], "utility_id": util, "class_id": f["class_id"],
        "severity": f["severity"], "risk_score": f["risk_score"],
        "inspection_id": insp, "asset_id": f.get("asset_id"),
        "source_detection_ids": f.get("source_detection_ids") or [],
        "evidence_object_ids": f.get("evidence_object_ids") or []})
    assert s in (200, 201), s
posted_alerts = []
for w in alerts:
    a = w["alert"]
    s, r = req("POST", "/api/v1/alerts", {
        "finding_id": a["finding_id"], "utility_id": a.get("utility_id") or util,
        "severity": a["severity"], "inspection_id": insp, "sla_due_at": a.get("sla_due_at")})
    assert s in (200, 201), s
    posted_alerts.append(r["id"])

_, lf = req("GET", f"/api/v1/findings?utility_id={util}")
_, la = req("GET", f"/api/v1/alerts?utility_id={util}")
lf, la = lf.get("items") or [], la.get("items") or []
missing = fids - {x["id"] for x in lf}
assert not missing, f"findings missing from GET: {missing}"
assert set(posted_alerts) <= {x["id"] for x in la}, "alerts missing from GET"
json.dump({"findings": lf, "alerts": la}, open(f"{ev}/api-listed.json", "w"), indent=2)
json.dump({"finding_ids": sorted(fids), "alert_ids": posted_alerts, "inspection_id": insp},
          open(f"{ev}/api-posted.json", "w"), indent=2)
print(f"ok findings_on_bus={len(findings)} alerts_on_bus={len(alerts)} listed_f={len(lf)} listed_a={len(la)}")
PY

# Prove the rows live in compose Postgres (not an in-memory store).
PG_USER="$(dc exec -T pulse-postgres printenv POSTGRES_USER | tr -d '\r')"
PG_DB="$(dc exec -T pulse-postgres printenv POSTGRES_DB | tr -d '\r')"
PGOUT="$(dc exec -T pulse-postgres psql -U "$PG_USER" -d "$PG_DB" -tA -c \
  "SELECT 'findings='||(SELECT count(*) FROM findings WHERE inspection_id='$INSPECTION_ID')||' alerts='||(SELECT count(*) FROM alerts WHERE inspection_id='$INSPECTION_ID')")"
echo "$PGOUT" | tee "$EVIDENCE_DIR/postgres-rows.txt"
echo "$PGOUT" | rg -q 'findings=[1-9]' || fail "no finding rows in postgres"
echo "$PGOUT" | rg -q 'alerts=[1-9]' || fail "no alert rows in postgres"

echo "[t390] PASS inspection=$INSPECTION_ID"
echo "PASS inspection=$INSPECTION_ID $PGOUT" >"$EVIDENCE_DIR/result.txt"
