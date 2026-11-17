#!/usr/bin/env bash
# S2 Kafka ingest smoke (P0-T330): detect -> rules -> publish vp.findings.v1 / vp.alerts.v1
# -> pulse-api Kafka consumer -> DomainStore (Postgres when PULSE_DATABASE_URL set).
# Needs: pulse-bus up + topics created (see infra/kafka/README.md).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_DIR="${S2_KAFKA_EVIDENCE_DIR:-$ROOT/task-cards/P0-T330/evidence}"
BOOTSTRAP="${PULSE_KAFKA_HOST_BOOTSTRAP:-localhost:${PULSE_KAFKA_HOST_PORT:-9094}}"
UTILITY_ID="${S2_UTILITY_ID:-11111111-1111-4111-8111-111111111111}"
API_PORT="${PULSE_API_PORT:-3031}"
API_BASE="http://127.0.0.1:${API_PORT}"
API_KEY="dev-operator"
GROUP="pulse-api-smoke-$(date +%s)"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vp-s2-kafka-XXXXXX")"
API_PID=""
mkdir -p "$EVIDENCE_DIR"

cleanup() {
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "[s2-kafka] detect -> rules (T130 glue)" >&2
S2_EVIDENCE_DIR="$WORK_DIR" "$ROOT/scripts/s2-detect-rules-smoke.sh" >&2
cp "$WORK_DIR/findings-alerts.json" "$EVIDENCE_DIR/findings-alerts.json"

echo "[s2-kafka] start pulse-api (consumer on, bootstrap=$BOOTSTRAP, group=$GROUP)" >&2
cd "$ROOT/apps/pulse-api"
[[ -f dist/main.js ]] || npx nest build >&2
PULSE_API_PORT="$API_PORT" \
PULSE_AUTH_ENABLED=true \
PULSE_AUTH_STUB_KEYS="$API_KEY:energy_operator:$UTILITY_ID" \
PULSE_KAFKA_CONSUMER_ENABLED=true \
PULSE_KAFKA_BOOTSTRAP="$BOOTSTRAP" \
PULSE_KAFKA_GROUP_ID="$GROUP" \
PULSE_KAFKA_DEFAULT_UTILITY_ID="$UTILITY_ID" \
  node dist/main.js >"$EVIDENCE_DIR/pulse-api.log" 2>&1 &
API_PID=$!
for _ in $(seq 1 40); do
  curl -sf "$API_BASE/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "$API_BASE/health" >/dev/null || { echo "[s2-kafka] FAIL api not healthy" >&2; exit 3; }

echo "[s2-kafka] publish events" >&2
PUB_JSON="$EVIDENCE_DIR/published.json"
node - "$WORK_DIR/findings-alerts.json" "$BOOTSTRAP" "$PUB_JSON" <<'JS'
const { Kafka } = require('kafkajs');
const fs = require('node:fs');
const [rulesPath, brokers, outPath] = process.argv.slice(2);
const out = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
(async () => {
  const p = new Kafka({ clientId: 'vp-s2-smoke', brokers: [brokers] }).producer();
  await p.connect();
  const send = (topic, rows) =>
    p.send({ topic, messages: rows.map((v) => ({ value: JSON.stringify(v) })) });
  await send('vp.findings.v1', out.findings);
  await send('vp.alerts.v1', out.alerts);
  await p.disconnect();
  fs.writeFileSync(outPath, JSON.stringify({
    findings: out.findings.map((e) => e.finding.finding_id),
    alerts: out.alerts.map((e) => e.alert.alert_id),
  }, null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
JS

echo "[s2-kafka] poll API until all ids present" >&2
python3 - "$PUB_JSON" "$API_BASE" "$API_KEY" "$UTILITY_ID" "$EVIDENCE_DIR/api-listed.json" <<'PY'
import json, sys, time, urllib.request
pub, base, key, util, outp = sys.argv[1:6]
pub = json.load(open(pub))
def get(path):
    r = urllib.request.Request(f"{base}/api/v1{path}", headers={"X-API-Key": key})
    return json.load(urllib.request.urlopen(r, timeout=10))["items"]
for _ in range(40):
    f = {x["id"] for x in get(f"/findings?utility_id={util}")}
    a = {x["id"] for x in get(f"/alerts?utility_id={util}")}
    if set(pub["findings"]) <= f and set(pub["alerts"]) <= a:
        json.dump({"findings": sorted(f), "alerts": sorted(a)}, open(outp, "w"), indent=2)
        print(f"ok findings={len(pub['findings'])} alerts={len(pub['alerts'])} present via Kafka consumer")
        sys.exit(0)
    time.sleep(0.5)
sys.exit(f"FAIL: missing findings={set(pub['findings'])-f} alerts={set(pub['alerts'])-a}")
PY
