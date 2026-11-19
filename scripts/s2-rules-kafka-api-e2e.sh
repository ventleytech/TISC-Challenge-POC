#!/usr/bin/env bash
# S2 E2E (P0-T336): grid-rules CLI --(Kafka producer)--> vp.findings.v1 / vp.alerts.v1
# --> pulse-api Kafka consumer --> DomainStore --> GET /api/v1/{findings,alerts}.
#
# Producer is grid-rules itself (GRID_RULES_KAFKA_PRODUCER_ENABLED + KAFKA_BROKERS),
# not an ad-hoc kafkajs script (contrast: s2-kafka-ingest.sh).
# Needs: pulse-bus up + topics created (infra/kafka/README.md); built @voltpulse/* packages.
#
# Store mode:
#   PULSE_DATABASE_URL set   -> PostgresStore. Inspection row seeded via docker exec psql
#                               so utility resolves from the inspection (no default tenant).
#   PULSE_DATABASE_URL unset -> MemoryStore. Falls back to PULSE_KAFKA_DEFAULT_UTILITY_ID.
# Every run uses fresh inspection/asset/utility UUIDs + a fresh consumer group.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_DIR="${S2_E2E_EVIDENCE_DIR:-$ROOT/task-cards/P0-T336/evidence}"
BOOTSTRAP="${PULSE_KAFKA_HOST_BOOTSTRAP:-localhost:${PULSE_KAFKA_HOST_PORT:-9094}}"
API_PORT="${PULSE_API_PORT:-3036}"
API_BASE="http://127.0.0.1:${API_PORT}"
API_KEY="${S2_API_KEY:-dev-operator}"
PG_CONTAINER="${S2_PG_CONTAINER:-vp-pulse-postgres}"
PG_USER="${PULSE_PG_USER:-voltpulse}"
PG_DB="${PULSE_PG_DB:-voltpulse}"
GROUP="pulse-api-e2e-$(date +%s)"
DB_URL="${PULSE_DATABASE_URL:-}"
MODE="memory"; [[ -n "$DB_URL" ]] && MODE="postgres"
UTILITY_ID="$(python3 -c 'import uuid;print(uuid.uuid4())')"
INSPECTION_ID="$(python3 -c 'import uuid;print(uuid.uuid4())')"
ASSET_ID="$(python3 -c 'import uuid;print(uuid.uuid4())')"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vp-s2-e2e-XXXXXX")"
API_PID=""
mkdir -p "$EVIDENCE_DIR"

psql_exec() { docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -v ON_ERROR_STOP=1 -tA "$@"; }

cleanup() {
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  if [[ "$MODE" == "postgres" && "${S2_KEEP_ROWS:-}" != "1" ]]; then
    psql_exec -c "DELETE FROM alerts WHERE utility_id='$UTILITY_ID'; DELETE FROM findings WHERE utility_id='$UTILITY_ID'; DELETE FROM inspections WHERE id='$INSPECTION_ID';" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "[e2e] mode=$MODE utility=$UTILITY_ID inspection=$INSPECTION_ID" >&2

# 1. Unique detect + assets so rows are attributable to this run.
python3 - "$ROOT" "$WORK_DIR" "$INSPECTION_ID" "$ASSET_ID" "$UTILITY_ID" <<'PY'
import json, sys
root, work, insp, asset, util = sys.argv[1:6]
d = json.load(open(f"{root}/apps/grid-rules/fixtures/synthetic-detect.v1.json"))
d["inspection_id"], d["asset_id"] = insp, asset
json.dump(d, open(f"{work}/detect.v1.json", "w"))
a = json.load(open(f"{root}/apps/grid-rules/fixtures/assets.json"))
ctx = next(iter(a.values()))
ctx["asset_id"], ctx["utility_id"] = asset, util
json.dump({asset: ctx}, open(f"{work}/assets.json", "w"))
PY

# 2. pulse-api with consumer on.
cd "$ROOT/apps/pulse-api"
[[ -f dist/main.js ]] || npx nest build >&2
API_ENV=(
  PULSE_API_PORT="$API_PORT"
  PULSE_AUTH_ENABLED=true
  PULSE_AUTH_STUB_KEYS="$API_KEY:energy_operator:$UTILITY_ID"
  PULSE_KAFKA_CONSUMER_ENABLED=true
  PULSE_KAFKA_BOOTSTRAP="$BOOTSTRAP"
  PULSE_KAFKA_GROUP_ID="$GROUP"
)
if [[ "$MODE" == "postgres" ]]; then
  API_ENV+=(PULSE_DATABASE_URL="$DB_URL")
  env PULSE_DATABASE_URL="$DB_URL" npm run db:migrate >&2
  psql_exec -c "INSERT INTO inspections (id, utility_id, status, asset_ids) VALUES ('$INSPECTION_ID','$UTILITY_ID','processing', ARRAY['$ASSET_ID']::uuid[]);" >&2
else
  API_ENV+=(PULSE_KAFKA_DEFAULT_UTILITY_ID="$UTILITY_ID")
fi
env "${API_ENV[@]}" node dist/main.js >"$EVIDENCE_DIR/pulse-api.log" 2>&1 &
API_PID=$!
for _ in $(seq 1 40); do
  curl -sf "$API_BASE/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "$API_BASE/health" >/dev/null || { echo "[e2e] FAIL api not healthy" >&2; exit 3; }

# 3. grid-rules publishes via its own Kafka producer.
echo "[e2e] grid-rules -> Kafka ($BOOTSTRAP)" >&2
cd "$ROOT/apps/grid-rules"
KAFKAJS_NO_PARTITIONER_WARNING=1 \
GRID_RULES_KAFKA_PRODUCER_ENABLED=true \
KAFKA_BROKERS="$BOOTSTRAP" \
GRID_RULES_ALERT_MIN_SEVERITY="${GRID_RULES_ALERT_MIN_SEVERITY:-low}" \
  npx --no-install tsx src/cli.ts --fixture "$WORK_DIR/detect.v1.json" --assets "$WORK_DIR/assets.json" \
  >"$EVIDENCE_DIR/rules-out.json"

# 4. Poll API until every id grid-rules emitted is visible.
echo "[e2e] poll GET /api/v1/{findings,alerts}" >&2
python3 - "$EVIDENCE_DIR/rules-out.json" "$API_BASE" "$API_KEY" "$UTILITY_ID" \
  "$EVIDENCE_DIR/api-listed.json" "$MODE" <<'PY'
import json, sys, time, urllib.request
rules, base, key, util, outp, mode = sys.argv[1:7]
r = json.load(open(rules))
published = r["summary"]["kafka_published"]
fids = {e["finding"]["finding_id"] for e in r["findings"]}
aids = {e["alert"]["alert_id"] for e in r["alerts"]}
if published != len(fids) + len(aids) or not fids:
    sys.exit(f"FAIL: kafka_published={published} expected {len(fids)+len(aids)} (>0 findings)")
def get(path):
    req = urllib.request.Request(f"{base}/api/v1{path}", headers={"X-API-Key": key})
    return json.load(urllib.request.urlopen(req, timeout=10))["items"]
f = a = set()
for _ in range(60):
    fi = get(f"/findings?utility_id={util}"); al = get(f"/alerts?utility_id={util}")
    f, a = {x["id"] for x in fi}, {x["id"] for x in al}
    if fids <= f and aids <= a:
        json.dump({"mode": mode, "utility_id": util, "findings": fi, "alerts": al}, open(outp, "w"), indent=2)
        print(f"ok mode={mode} kafka_published={published} findings={len(fids)} alerts={len(aids)} visible via API")
        sys.exit(0)
    time.sleep(0.5)
sys.exit(f"FAIL: missing findings={fids-f} alerts={aids-a}")
PY

# 5. Postgres: prove rows landed (before cleanup trap deletes them).
if [[ "$MODE" == "postgres" ]]; then
  {
    echo "findings | alerts for utility $UTILITY_ID:"
    psql_exec -c "SELECT (SELECT count(*) FROM findings WHERE utility_id='$UTILITY_ID') || ' | ' || (SELECT count(*) FROM alerts WHERE utility_id='$UTILITY_ID');"
    psql_exec -c "SELECT id, class_id, severity, risk_score, inspection_id FROM findings WHERE utility_id='$UTILITY_ID' ORDER BY risk_score DESC;"
  } | tee "$EVIDENCE_DIR/psql-rows.txt"
fi
echo "[e2e] PASS mode=$MODE"
