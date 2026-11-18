#!/usr/bin/env bash
# P0-T395: Compose Kafka-path E2E, isolated project (-p vp395).
#   pulse-gateway (kafka detect sink; or VP395_SYNTHETIC=1 console-producer) --> vp.detect.v1
#   --> grid-rules (Kafka in + Kafka out) --> vp.findings.v1 / vp.alerts.v1
#   --> pulse-api Kafka consumer (Postgres)          --> GET /api/v1/{findings,alerts} + psql rows
#   --> pulse-notify Kafka consumer (adapter=file)   --> /data/notify/alerts.jsonl lines
# The script only reads: it POSTs a frame to the gateway (or produces one synthetic detect) and nothing else.
# grid-rules HTTP sink stays OFF (pulse-api consumes Kafka; HTTP too would duplicate ids).
#
# Isolation: own project name, own volumes, own host ports (incl. broker), container_name reset via a
# temp override so the long-lived voltpulse stack (vp-pulse-bus, vp-pulse-postgres, MinIO...) is untouched.
# Teardown: `down -v` for project vp395 only. No MinIO / `store` profile involvement, no image pruning.
#
# Env: VP395_NO_BUILD=1 reuse images; VP395_KEEP=1 skip teardown; VP395_EVIDENCE_DIR;
#      VP395_SYNTHETIC=1 skip gateway, produce the detect event straight onto Kafka.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT="${VP395_PROJECT:-vp395}"
EVIDENCE_DIR="${VP395_EVIDENCE_DIR:-$ROOT/task-cards/P0-T395/evidence}"
COMPOSE_FILE="$ROOT/infra/compose/docker-compose.yml"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/vp395-XXXXXX")"
OVERRIDE="$TMP/override.yml"
SYNTHETIC="${VP395_SYNTHETIC:-0}"

# Host ports (distinct from the default stack and from vp393/vp394).
GW_PORT="${VP395_GATEWAY_PORT:-3395}"
API_PORT="${VP395_API_PORT:-3396}"
NOTIFY_PORT="${VP395_NOTIFY_PORT:-3397}"
PG_PORT="${VP395_PG_PORT:-5445}"
RTSP_PORT="${VP395_RTSP_PORT:-8595}"
KAFKA_PORT="${VP395_KAFKA_PORT:-19395}"
KAFKA_HOST_PORT="${VP395_KAFKA_HOST_PORT:-19396}"
API_BASE="http://127.0.0.1:$API_PORT"
GW_BASE="http://127.0.0.1:$GW_PORT"
API_KEY="dev-operator"
UTILITY_ID="11111111-1111-4111-8111-111111111111" # matches grid-rules fixtures/assets.json
ASSET_ID="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
INSPECTION_ID="$(python3 -c 'import uuid;print(uuid.uuid4())')"
NOTIFY_FILE="/data/notify/alerts.jsonl"

mkdir -p "$EVIDENCE_DIR"

# Shell env beats --env-file, so these override .env.template values.
export PULSE_KAFKA_PORT="$KAFKA_PORT" PULSE_KAFKA_HOST_PORT="$KAFKA_HOST_PORT"
export PULSE_GATEWAY_PORT="$GW_PORT" PULSE_GATEWAY_RTSP_PORT="$RTSP_PORT"
export PULSE_GATEWAY_DETECT_SINK=kafka
export PULSE_API_PORT="$API_PORT" PULSE_PG_PORT="$PG_PORT" PULSE_NOTIFY_PORT="$NOTIFY_PORT"
export PULSE_API_BASE_URL="http://pulse-api:$API_PORT"
export PULSE_AUTH_ENABLED=true
export PULSE_AUTH_STUB_KEYS="$API_KEY:energy_operator:$UTILITY_ID"
# pulse-api: Kafka consumer on (findings + alerts topics); pulse-api reads from beginning itself.
export PULSE_KAFKA_CONSUMER_ENABLED=true
# grid-rules: Kafka in + out. From-beginning so start order vs. the first event cannot race.
export GRID_RULES_KAFKA_CONSUMER_ENABLED=true GRID_RULES_KAFKA_PRODUCER_ENABLED=true
export GRID_RULES_KAFKA_FROM_BEGINNING=true
unset GRID_RULES_API_BASE_URL GRID_RULES_API_KEY
# pulse-notify: Kafka consumer + file sink.
export PULSE_NOTIFY_KAFKA_ENABLED=true PULSE_NOTIFY_KAFKA_FROM_BEGINNING=true
export PULSE_NOTIFY_ADAPTER=file PULSE_NOTIFY_FILE_PATH_CONTAINER="$NOTIFY_FILE"

cat >"$OVERRIDE" <<'YML'
# Drop fixed container_name so project vp395 never collides with the default stack.
services:
  pulse-bus: { container_name: !reset null }
  pulse-kafka-topics: { container_name: !reset null }
  pulse-gateway: { container_name: !reset null }
  grid-rules: { container_name: !reset null }
  pulse-postgres: { container_name: !reset null }
  pulse-api: { container_name: !reset null }
  pulse-notify: { container_name: !reset null }
YML

dc() {
  docker compose -p "$PROJECT" --env-file "$ROOT/.env.template" -f "$COMPOSE_FILE" -f "$OVERRIDE" \
    --profile media --profile stream --profile data "$@"
}

cleanup() {
  local rc=$?
  if [[ "${VP395_KEEP:-0}" != "1" ]]; then
    echo "[t395] teardown: down -v (project $PROJECT only)" >&2
    dc down -v --remove-orphans >&2 2>&1 || true
  fi
  rm -rf "$TMP"
  exit $rc
}
trap cleanup EXIT

fail() { echo "[t395] FAIL: $*" >&2; dc logs --tail 30 >&2 2>&1 || true; exit 1; }

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

# Replay a whole topic from the broker (evidence of what really crossed Kafka).
dump_topic() { # topic outfile
  dc exec -T pulse-bus /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
    --topic "$1" --from-beginning --timeout-ms 8000 2>/dev/null >"$2" || true
}

# Refuse to clobber an existing project of the same name.
if docker compose -p "$PROJECT" ls -q 2>/dev/null | rg -qx "$PROJECT"; then
  echo "[t395] project $PROJECT already exists; run 'docker compose -p $PROJECT down -v' first" >&2
  trap - EXIT; rm -rf "$TMP"; exit 2
fi

echo "[t395] config check" >&2
dc config -q || fail "compose config invalid"

BUILD=(--build); [[ "${VP395_NO_BUILD:-0}" == "1" ]] && BUILD=()
echo "[t395] up: pulse-bus + topics + postgres" >&2
dc up -d "${BUILD[@]}" --wait pulse-bus pulse-postgres >&2 || fail "bus/postgres not healthy"
dc run --rm -T --no-deps pulse-kafka-topics >"$EVIDENCE_DIR/topics-create.txt" 2>&1 || fail "topic create"

echo "[t395] up: pulse-api, grid-rules, pulse-notify$([[ $SYNTHETIC == 1 ]] || echo ', pulse-gateway')" >&2
dc up -d "${BUILD[@]}" --no-deps pulse-api grid-rules pulse-notify >&2
[[ "$SYNTHETIC" == "1" ]] || dc up -d "${BUILD[@]}" --no-deps pulse-gateway >&2

wait_http "$API_BASE/health" pulse-api 90
wait_http "http://127.0.0.1:$NOTIFY_PORT/health" pulse-notify 60
[[ "$SYNTHETIC" == "1" ]] || wait_http "$GW_BASE/health" pulse-gateway 60
OK=0
for i in $(seq 1 60); do
  rules_health >"$EVIDENCE_DIR/rules-health-before.json" 2>/dev/null \
    && python3 -c 'import json,sys;d=json.load(open(sys.argv[1]))["loop"];sys.exit(0 if d["inputs"]["kafka"] and d["outputs"]["kafka"] and not d["outputs"]["http"] else 1)' \
      "$EVIDENCE_DIR/rules-health-before.json" 2>/dev/null && { OK=1; break; }
  sleep 1
done
[[ "$OK" == "1" ]] || fail "grid-rules never reported kafka in+out (http off)"
echo "[t395] services up; rules before: $(cat "$EVIDENCE_DIR/rules-health-before.json")" >&2

if [[ "$SYNTHETIC" == "1" ]]; then
  echo "[t395] synthetic: produce one vp.detect.v1 event straight onto Kafka" >&2
  python3 - "$INSPECTION_ID" "$ASSET_ID" <<'PY' | dc exec -T pulse-bus /opt/kafka/bin/kafka-console-producer.sh \
      --bootstrap-server localhost:9092 --topic vp.detect.v1 >&2 || fail "synthetic produce"
import json, sys, uuid, datetime
insp, asset = sys.argv[1:3]
print(json.dumps({
    "event_id": str(uuid.uuid4()),
    "occurred_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "inspection_id": insp, "asset_id": asset, "source": "live",
    "detections": [{"detection_id": str(uuid.uuid4()), "class_id": "corrosion", "confidence": 0.9,
                    "reason": "synthetic t395 producer; no inference run"}],
}))
PY
  echo '{"sink":"kafka","synthetic":true}' >"$EVIDENCE_DIR/gateway-frame-response.json"
else
  echo "[t395] gateway: register session + post synthetic frame (kafka sink)" >&2
  SID="$(curl -sf -X POST "$GW_BASE/sessions" -H 'Content-Type: application/json' \
    -d '{"name":"t395-feeder","protocol":"rtsp","path":"live/t395-feeder"}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')"
  FRAME_RESP="$(curl -sf -X POST "$GW_BASE/sessions/$SID/frames" -H 'Content-Type: application/json' \
    -d "{\"class_id\":\"corrosion\",\"confidence\":0.9,\"asset_id\":\"$ASSET_ID\",\"inspection_id\":\"$INSPECTION_ID\"}")" \
    || fail "frame post"
  echo "$FRAME_RESP" >"$EVIDENCE_DIR/gateway-frame-response.json"
  echo "$FRAME_RESP" | python3 -c 'import json,sys;d=json.load(sys.stdin);assert d.get("sink")=="kafka",d' || fail "gateway sink != kafka"
fi

echo "[t395] wait grid-rules counters (detects>=1, findings>=1, alerts>=1, rejected=0)" >&2
OK=0
for i in $(seq 1 60); do
  H="$(rules_health 2>/dev/null || true)"
  if echo "$H" | python3 -c 'import json,sys;d=json.load(sys.stdin)["loop"];sys.exit(0 if d["detects"]>=1 and d["findings"]>=1 and d["alerts"]>=1 and d["rejected"]==0 else 1)' 2>/dev/null; then OK=1; break; fi
  sleep 1
done
[[ "$OK" == "1" ]] || fail "grid-rules counters never converged (last: ${H:-none})"
echo "$H" >"$EVIDENCE_DIR/rules-health-after.json"

echo "[t395] dump kafka topics (from beginning)" >&2
for t in detect findings alerts; do dump_topic "vp.$t.v1" "$EVIDENCE_DIR/kafka-vp.$t.v1.jsonl"; done

echo "[t395] assert: topics -> API rows -> notify file lines" >&2
# Poll until API + notify file catch up with what is on the topics, then assert + write evidence.
OK=0
for i in $(seq 1 60); do
  dc exec -T pulse-notify sh -c "cat $NOTIFY_FILE 2>/dev/null || true" >"$EVIDENCE_DIR/notify-alerts.jsonl"
  if python3 - "$EVIDENCE_DIR" "$API_BASE" "$API_KEY" "$UTILITY_ID" "$INSPECTION_ID" "$ASSET_ID" <<'PY'
import json, sys, urllib.request
ev, base, key, util, insp, asset = sys.argv[1:7]
lines = lambda p: [json.loads(l) for l in open(p) if l.strip()]
detects = [d for d in lines(f"{ev}/kafka-vp.detect.v1.jsonl") if d.get("inspection_id") == insp]
findings = [w for w in lines(f"{ev}/kafka-vp.findings.v1.jsonl") if (w.get("inspection_id") or w["finding"].get("inspection_id")) == insp]
fids = {w["finding"]["finding_id"] for w in findings}
alerts = [w for w in lines(f"{ev}/kafka-vp.alerts.v1.jsonl") if w["alert"]["finding_id"] in fids]
assert len(detects) == 1 and detects[0]["asset_id"] == asset, detects
if not findings or not alerts:
    raise SystemExit(1)
aids = {w["alert"]["alert_id"] for w in alerts}

def get(path):
    r = urllib.request.Request(base + path, headers={"X-API-Key": key})
    return json.loads(urllib.request.urlopen(r, timeout=10).read().decode()).get("items") or []

lf = get(f"/api/v1/findings?utility_id={util}&inspection_id={insp}")
la = [a for a in get(f"/api/v1/alerts?utility_id={util}") if a["finding_id"] in fids]
if {x["id"] for x in lf} != fids or {x["id"] for x in la} != aids:
    raise SystemExit(1)  # consumer not caught up yet

notified = [json.loads(l) for l in open(f"{ev}/notify-alerts.jsonl") if l.strip()]
nids = {n["alert_id"] for n in notified}
if nids != aids:
    raise SystemExit(1)  # notify not caught up yet
assert all(n["finding_id"] in fids and n["channel"] for n in notified), notified
json.dump({"findings": lf, "alerts": la}, open(f"{ev}/api-listed.json", "w"), indent=2)
json.dump({"inspection_id": insp, "finding_ids": sorted(fids), "alert_ids": sorted(aids),
           "notify_lines": len(notified), "notify_channels": sorted({n["channel"] for n in notified})},
          open(f"{ev}/asserted.json", "w"), indent=2)
print(f"ok findings={len(fids)} alerts={len(aids)} api_f={len(lf)} api_a={len(la)} notify_lines={len(notified)}")
PY
  then OK=1; break; fi
  sleep 1
done
[[ "$OK" == "1" ]] || fail "API rows / notify lines never matched topic contents"

# Postgres: rows live in compose Postgres, not a memory store.
PG_USER="$(dc exec -T pulse-postgres printenv POSTGRES_USER | tr -d '\r')"
PG_DB="$(dc exec -T pulse-postgres printenv POSTGRES_DB | tr -d '\r')"
PGOUT="$(dc exec -T pulse-postgres psql -U "$PG_USER" -d "$PG_DB" -tA -c \
  "SELECT 'findings='||(SELECT count(*) FROM findings WHERE inspection_id='$INSPECTION_ID')||' alerts='||(SELECT count(*) FROM alerts WHERE inspection_id='$INSPECTION_ID')")"
echo "$PGOUT" | tee "$EVIDENCE_DIR/postgres-rows.txt"
echo "$PGOUT" | rg -q 'findings=[1-9]' || fail "no finding rows in postgres"
echo "$PGOUT" | rg -q 'alerts=[1-9]' || fail "no alert rows in postgres"

# pulse-api must not have skipped any message (no rejected / DLQ-worthy ingest).
dc logs pulse-api 2>&1 | rg -v '^\s*$' >"$EVIDENCE_DIR/pulse-api.log" || true
! rg -q 'skip rejected|skip non-JSON' "$EVIDENCE_DIR/pulse-api.log" || fail "pulse-api skipped a Kafka message (see pulse-api.log)"
dc logs pulse-notify 2>&1 >"$EVIDENCE_DIR/pulse-notify.log" || true

echo "[t395] PASS inspection=$INSPECTION_ID mode=$([[ $SYNTHETIC == 1 ]] && echo synthetic || echo gateway)"
echo "PASS inspection=$INSPECTION_ID mode=$([[ $SYNTHETIC == 1 ]] && echo synthetic || echo gateway) $PGOUT $(python3 -c 'import json,sys;d=json.load(open(sys.argv[1]));print("notify_lines=%d"%d["notify_lines"])' "$EVIDENCE_DIR/asserted.json")" \
  >"$EVIDENCE_DIR/result.txt"
