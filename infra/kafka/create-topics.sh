#!/usr/bin/env bash
# Create VoltPulse Kafka topics from packages/contracts/events/catalog.yaml.
# Brand: VoltPulse only. Topics must be vp.*.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DEFAULT_CATALOG="${REPO_ROOT}/packages/contracts/events/catalog.yaml"

CATALOG="${PULSE_TOPIC_CATALOG:-$DEFAULT_CATALOG}"
BOOTSTRAP="${PULSE_KAFKA_BOOTSTRAP:-localhost:9092}"
PARTITIONS="${PULSE_TOPIC_PARTITIONS:-1}"
REPLICATION="${PULSE_TOPIC_REPLICATION:-1}"
DRY_RUN=0
LIST_ONLY=0

usage() {
  cat <<'EOF'
Usage: create-topics.sh [options]

Create Kafka topics listed in the VoltPulse contracts catalog (vp.* only).

Options:
  -h, --help              Show this help
  -n, --dry-run           Print kafka-topics commands; do not execute
  -l, --list              List topic names from catalog and exit
  -c, --catalog PATH      Catalog YAML (default: packages/contracts/events/catalog.yaml
                          or PULSE_TOPIC_CATALOG)
  -b, --bootstrap HOST    Kafka bootstrap (default: PULSE_KAFKA_BOOTSTRAP or localhost:9092)
  --partitions N          Partitions per topic (default: PULSE_TOPIC_PARTITIONS or 1)
  --replication N         Replication factor (default: PULSE_TOPIC_REPLICATION or 1)

Environment:
  PULSE_KAFKA_BOOTSTRAP   Broker address
  PULSE_TOPIC_CATALOG     Override catalog path
  PULSE_TOPIC_PARTITIONS  Default partitions
  PULSE_TOPIC_REPLICATION Default replication factor
  PULSE_KAFKA_DLQ_TOPIC   Extra DLQ topic (default vp.dlq.v1; must start with vp.)

Requires: python3 + PyYAML **or** awk (catalog parse). For live create:
kafka-topics.sh / kafka-topics on PATH (Apache Kafka image tools).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    -l|--list) LIST_ONLY=1; shift ;;
    -c|--catalog) CATALOG="$2"; shift 2 ;;
    -b|--bootstrap) BOOTSTRAP="$2"; shift 2 ;;
    --partitions) PARTITIONS="$2"; shift 2 ;;
    --replication) REPLICATION="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

if [[ ! -f "$CATALOG" ]]; then
  echo "error: catalog not found: $CATALOG" >&2
  echo "hint: cherry-pick packages/contracts (P0-T002) or set PULSE_TOPIC_CATALOG" >&2
  exit 1
fi

# Prefer python3+PyYAML; fall back to awk for Kafka admin images (no python).
parse_topics_python() {
  python3 - "$CATALOG" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
try:
    import yaml
except ImportError as exc:
    raise SystemExit("error: PyYAML required (pip install pyyaml)") from exc

data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
topics = data.get("topics") or []
if not isinstance(topics, list) or not topics:
    raise SystemExit(f"error: no topics[] in {path}")

names = []
for entry in topics:
    if not isinstance(entry, dict) or "name" not in entry:
        raise SystemExit(f"error: invalid topic entry: {entry!r}")
    name = str(entry["name"]).strip()
    if not name.startswith("vp."):
        raise SystemExit(f"error: refusing non-VoltPulse topic (must start with vp.): {name}")
    names.append(name)

print("\n".join(names))
PY
}

parse_topics_awk() {
  # Catalog shape: topics: → list items with `name: vp.*` (VoltPulse stub YAML).
  awk '
    /^topics:[[:space:]]*$/ { in_topics=1; next }
    in_topics && /^[^[:space:]#]/ { in_topics=0 }
    in_topics && /^[[:space:]]*-[[:space:]]+name:[[:space:]]*/ {
      name=$0
      sub(/^[[:space:]]*-[[:space:]]+name:[[:space:]]*/, "", name)
      gsub(/[[:space:]]+$/, "", name)
      if (name == "") next
      if (name !~ /^vp\./) {
        print "error: refusing non-VoltPulse topic (must start with vp.): " name > "/dev/stderr"
        exit 1
      }
      print name
    }
  ' "$CATALOG"
}

TOPIC_LIST=""
if command -v python3 >/dev/null 2>&1; then
  if TOPIC_LIST="$(parse_topics_python)"; then
    :
  else
    echo "warning: python catalog parse failed; trying awk fallback" >&2
    TOPIC_LIST="$(parse_topics_awk)" || exit $?
  fi
else
  TOPIC_LIST="$(parse_topics_awk)" || exit $?
fi

mapfile -t TOPICS <<< "$TOPIC_LIST"

if [[ ${#TOPICS[@]} -eq 0 || -z "${TOPICS[0]:-}" ]]; then
  echo "error: catalog produced zero topics" >&2
  exit 1
fi

# Operational topic (not a contract event): pulse-api dead-letter (P0-T391).
DLQ_TOPIC="${PULSE_KAFKA_DLQ_TOPIC:-vp.dlq.v1}"
if [[ "$DLQ_TOPIC" != vp.* ]]; then
  echo "error: refusing non-VoltPulse DLQ topic (must start with vp.): $DLQ_TOPIC" >&2
  exit 1
fi
case " ${TOPICS[*]} " in *" $DLQ_TOPIC "*) ;; *) TOPICS+=("$DLQ_TOPIC") ;; esac

if [[ "$LIST_ONLY" -eq 1 ]]; then
  printf '%s\n' "${TOPICS[@]}"
  exit 0
fi

resolve_kafka_topics() {
  if command -v kafka-topics.sh >/dev/null 2>&1; then
    echo "kafka-topics.sh"
    return 0
  fi
  if command -v kafka-topics >/dev/null 2>&1; then
    echo "kafka-topics"
    return 0
  fi
  return 1
}

KAFKA_TOPICS_BIN=""
if [[ "$DRY_RUN" -eq 0 ]]; then
  if ! KAFKA_TOPICS_BIN="$(resolve_kafka_topics)"; then
    echo "error: kafka-topics.sh / kafka-topics not on PATH" >&2
    echo "hint: use --dry-run to print commands, or run inside a Kafka admin container" >&2
    exit 1
  fi
else
  KAFKA_TOPICS_BIN="$(resolve_kafka_topics 2>/dev/null || true)"
  KAFKA_TOPICS_BIN="${KAFKA_TOPICS_BIN:-kafka-topics.sh}"
fi

echo "catalog:   $CATALOG"
echo "bootstrap: $BOOTSTRAP"
echo "topics:    ${#TOPICS[@]}"
echo

for topic in "${TOPICS[@]}"; do
  cmd=(
    "$KAFKA_TOPICS_BIN"
    --bootstrap-server "$BOOTSTRAP"
    --create
    --if-not-exists
    --topic "$topic"
    --partitions "$PARTITIONS"
    --replication-factor "$REPLICATION"
  )
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run]'
    printf ' %q' "${cmd[@]}"
    printf '\n'
  else
    echo "+ ${cmd[*]}"
    "${cmd[@]}"
  fi
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo
  echo "dry-run complete; no topics created"
fi
