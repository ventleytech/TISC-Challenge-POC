#!/usr/bin/env bash
# S2 bus E2E: grid-perception (or fixture) → grid-rules → pulse-api findings+alerts.
# Reuses scripts/s2-detect-rules-smoke.sh (P0-T130). Kafka optional (document only).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EVIDENCE_DIR="${S2_BUS_EVIDENCE_DIR:-$ROOT/task-cards/P0-T300/evidence}"
WORK_DIR="${S2_BUS_WORK_DIR:-}"
CLEAN_WORK=0
API_BASE="${PULSE_API_BASE:-http://127.0.0.1:${PULSE_API_PORT:-3000}}"
UTILITY_ID="${S2_UTILITY_ID:-11111111-1111-4111-8111-111111111111}"
API_KEY="${PULSE_API_KEY:-dev-operator}"
AUTH_KEYS="${PULSE_AUTH_STUB_KEYS:-dev-operator:energy_operator:${UTILITY_ID};dev-platform:platform_admin:}"
COMPOSE_FILE="${VP_COMPOSE_FILE:-$ROOT/infra/compose/docker-compose.yml}"
NOTES_MD="$EVIDENCE_DIR/s2-bus-e2e.md"
POSTED_JSON="$EVIDENCE_DIR/api-posted.json"
LIST_JSON="$EVIDENCE_DIR/api-listed.json"
API_PID=""
API_STARTED=0
DETECT_MODE="unknown"
KAFKA_NOTE="not checked"

mkdir -p "$EVIDENCE_DIR"

cleanup() {
  if [[ "$API_STARTED" == "1" && -n "$API_PID" ]]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
  if [[ "$CLEAN_WORK" == "1" && -n "$WORK_DIR" && -d "$WORK_DIR" ]]; then
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

api_healthy() {
  curl -sf "$API_BASE/health" >/dev/null 2>&1
}

ensure_api() {
  if api_healthy; then
    echo "[s2-bus-e2e] pulse-api already up at $API_BASE" >&2
    return 0
  fi
  echo "[s2-bus-e2e] starting pulse-api on ${PULSE_API_PORT:-3000}" >&2
  cd "$ROOT/apps/pulse-api"
  if [[ ! -d node_modules ]]; then
    npm install --no-fund --no-audit
  fi
  export PULSE_AUTH_ENABLED="${PULSE_AUTH_ENABLED:-true}"
  export PULSE_AUTH_STUB_KEYS="$AUTH_KEYS"
  export PULSE_API_PORT="${PULSE_API_PORT:-3000}"
  # Prefer prod build if present; else nest start once.
  if [[ -f dist/main.js ]]; then
    node dist/main.js &
  else
    npx --no-install nest start &
  fi
  API_PID=$!
  API_STARTED=1
  local i
  for i in $(seq 1 40); do
    if api_healthy; then
      echo "[s2-bus-e2e] pulse-api ready (pid=$API_PID)" >&2
      return 0
    fi
    sleep 0.5
  done
  echo "[s2-bus-e2e] FAIL: pulse-api did not become healthy" >&2
  exit 3
}

run_detect_rules() {
  if [[ -z "$WORK_DIR" ]]; then
    WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vp-s2-bus-XXXXXX")"
    CLEAN_WORK=1
  fi
  mkdir -p "$WORK_DIR"
  echo "[s2-bus-e2e] T130 glue → $WORK_DIR" >&2
  S2_EVIDENCE_DIR="$WORK_DIR" "$ROOT/scripts/s2-detect-rules-smoke.sh"
  cp "$WORK_DIR/detect.v1.json" "$EVIDENCE_DIR/detect.v1.json"
  cp "$WORK_DIR/findings-alerts.json" "$EVIDENCE_DIR/findings-alerts.json"
  if [[ -f "$WORK_DIR/s2-detect-rules-smoke.md" ]]; then
    # Mode line from T130 note
    DETECT_MODE="$(rg -o 'Mode \| `[^`]+`' "$WORK_DIR/s2-detect-rules-smoke.md" | head -1 | sed 's/.*`\([^`]*\)`/\1/' || true)"
  fi
  if [[ -z "$DETECT_MODE" || "$DETECT_MODE" == "unknown" ]]; then
    DETECT_MODE="see T130 workdir"
  fi
}

check_kafka() {
  KAFKA_NOTE="Kafka path not required for green. HTTP ingest used."
  if command -v docker >/dev/null 2>&1 && [[ -f "$COMPOSE_FILE" ]]; then
    if docker compose -p voltpulse -f "$COMPOSE_FILE" ps --status running 2>/dev/null | rg -q 'pulse-bus'; then
      KAFKA_NOTE="pulse-bus running under compose project voltpulse. Topics remain vp.detect.v1 → vp.findings.v1 / vp.alerts.v1. This smoke still posts via HTTP ingest (no Nest Kafka consumer yet)."
    else
      KAFKA_NOTE="pulse-bus not running (compose project voltpulse). Fixture/file-bus + HTTP ingest only. Later: consumer on vp.findings.v1 / vp.alerts.v1."
    fi
  fi
}

post_to_api() {
  local rules_out="$EVIDENCE_DIR/findings-alerts.json"
  echo "[s2-bus-e2e] POST findings+alerts → $API_BASE/api/v1" >&2
  python3 - "$rules_out" "$API_BASE" "$API_KEY" "$UTILITY_ID" "$POSTED_JSON" "$LIST_JSON" <<'PY'
import json, sys, urllib.error, urllib.request

rules_path, api_base, api_key, utility_id, posted_path, listed_path = sys.argv[1:7]
out = json.load(open(rules_path))
findings = out.get("findings") or []
alerts = out.get("alerts") or []

def req(method, path, body=None):
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(
        f"{api_base.rstrip('/')}{path}",
        data=data,
        method=method,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        },
    )
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise SystemExit(f"HTTP {e.code} {method} {path}: {err}") from e

posted = {"findings": [], "alerts": []}
for wrap in findings:
    f = wrap.get("finding") or {}
    fid = f.get("finding_id")
    if not fid:
        raise SystemExit("finding missing finding_id")
    body = {
        "id": fid,
        "utility_id": utility_id,
        "class_id": f["class_id"],
        "severity": f["severity"],
        "risk_score": f["risk_score"],
        "inspection_id": wrap.get("inspection_id") or f.get("inspection_id"),
        "asset_id": f.get("asset_id"),
        "source_detection_ids": f.get("source_detection_ids") or [],
        "evidence_object_ids": f.get("evidence_object_ids") or [],
    }
    status, resp = req("POST", "/api/v1/findings", body)
    if status not in (200, 201):
        raise SystemExit(f"unexpected findings status {status}")
    posted["findings"].append({"id": resp.get("id", fid), "http": status})

for wrap in alerts:
    a = wrap.get("alert") or {}
    body = {
        "finding_id": a["finding_id"],
        "utility_id": a.get("utility_id") or utility_id,
        "severity": a["severity"],
        "inspection_id": a.get("inspection_id"),
        "sla_due_at": a.get("sla_due_at"),
    }
    status, resp = req("POST", "/api/v1/alerts", body)
    if status not in (200, 201):
        raise SystemExit(f"unexpected alerts status {status}")
    posted["alerts"].append({"id": resp["id"], "http": status, "finding_id": a["finding_id"]})

_, listed_f = req("GET", f"/api/v1/findings?utility_id={utility_id}")
_, listed_a = req("GET", f"/api/v1/alerts?utility_id={utility_id}")
listed = {"findings": listed_f.get("items") or [], "alerts": listed_a.get("items") or []}

# Verify every posted finding id is present
posted_fids = {p["id"] for p in posted["findings"]}
listed_fids = {f["id"] for f in listed["findings"]}
missing = posted_fids - listed_fids
if missing:
    raise SystemExit(f"FAIL: findings not listed after POST: {sorted(missing)}")
if posted["findings"] and not listed["findings"]:
    raise SystemExit("FAIL: posted findings but list empty")
if findings and not posted["findings"]:
    raise SystemExit("FAIL: rules emitted findings but none posted")
if alerts and not posted["alerts"]:
    raise SystemExit("FAIL: rules emitted alerts but none posted")
# Alerts: at least as many listed as posted in this run (MemoryStore may accumulate)
if len(listed["alerts"]) < len(posted["alerts"]):
    raise SystemExit(
        f"FAIL: listed alerts {len(listed['alerts'])} < posted {len(posted['alerts'])}"
    )

json.dump(posted, open(posted_path, "w"), indent=2)
json.dump(listed, open(listed_path, "w"), indent=2)
print(
    f"ok posted_findings={len(posted['findings'])} posted_alerts={len(posted['alerts'])} "
    f"listed_findings={len(listed['findings'])} listed_alerts={len(listed['alerts'])}"
)
PY
}

write_evidence_md() {
  local detect_n findings_n alerts_n posted_f posted_a
  detect_n="$(python3 -c "import json; print(len(json.load(open('$EVIDENCE_DIR/detect.v1.json')).get('detections') or []))")"
  findings_n="$(python3 -c "import json; print(len(json.load(open('$EVIDENCE_DIR/findings-alerts.json')).get('findings') or []))")"
  alerts_n="$(python3 -c "import json; print(len(json.load(open('$EVIDENCE_DIR/findings-alerts.json')).get('alerts') or []))")"
  posted_f="$(python3 -c "import json; print(len(json.load(open('$POSTED_JSON')).get('findings') or []))")"
  posted_a="$(python3 -c "import json; print(len(json.load(open('$POSTED_JSON')).get('alerts') or []))")"

  cat >"$NOTES_MD" <<EOF
# P0-T300 evidence — S2 bus E2E (perception → rules → pulse-api)

| Field | Value |
|-------|-------|
| Detect mode | \`$DETECT_MODE\` |
| Detect | \`task-cards/P0-T300/evidence/detect.v1.json\` ($detect_n detections) |
| Rules out | \`task-cards/P0-T300/evidence/findings-alerts.json\` (findings=$findings_n alerts=$alerts_n) |
| API posted | \`task-cards/P0-T300/evidence/api-posted.json\` (findings=$posted_f alerts=$posted_a) |
| API listed | \`task-cards/P0-T300/evidence/api-listed.json\` |
| API base | \`$API_BASE\` |
| Utility | \`$UTILITY_ID\` |
| Topics | \`vp.detect.v1\` → \`vp.findings.v1\` / \`vp.alerts.v1\` (file-bus + HTTP ingest) |

## Commands

\`\`\`bash
./scripts/s2-bus-e2e.sh
# fixture-only:
# GP_FORCE_FIXTURE=1 ./scripts/s2-bus-e2e.sh
\`\`\`

## Kafka / bus note

$KAFKA_NOTE

## Summary

- Reused T130 \`scripts/s2-detect-rules-smoke.sh\` for detect → rules.
- Extended hop: \`POST /api/v1/findings\` then \`POST /api/v1/alerts\`; verified via list.
- Persist backend: pulse-api \`MemoryStore\` (Postgres later).

## Anti-leak

- VoltPulse services only (\`grid-perception\`, \`grid-rules\`, \`pulse-api\`).
- Topics \`vp.*\` only.

## Result

**PASS** — S2 E2E posted findings=$posted_f alerts=$posted_a (detect_mode=$DETECT_MODE).
EOF

  echo "[s2-bus-e2e] wrote $NOTES_MD" >&2
  echo "[s2-bus-e2e] PASS detect_mode=$DETECT_MODE detections=$detect_n findings=$findings_n alerts=$alerts_n posted_f=$posted_f posted_a=$posted_a"
}

main() {
  check_kafka
  run_detect_rules
  ensure_api
  post_to_api
  write_evidence_md
}

main "$@"
