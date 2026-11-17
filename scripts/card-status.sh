#!/usr/bin/env bash
# List task-card statuses from CARD.md front tables / Status lines.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CARDS="$ROOT/task-cards"

shopt -s nullglob
found=0
for card in "$CARDS"/*/CARD.md; do
  id="$(basename "$(dirname "$card")")"
  [[ "$id" == _TEMPLATE ]] && continue
  status="$(grep -E '^\| Status \|' "$card" | head -1 | sed -E 's/.*\| Status \|[[:space:]]*`?([^`|]+)`?[[:space:]]*\|.*/\1/' | xargs || true)"
  if [[ -z "$status" ]]; then
    status="$(grep -Ei '^status:' "$card" | head -1 | sed 's/[Ss]tatus:[[:space:]]*//' | xargs || true)"
  fi
  printf '%-32s %s\n' "$id" "${status:-unknown}"
  found=1
done

if [[ "$found" -eq 0 ]]; then
  echo "No cards yet under task-cards/*/CARD.md"
fi
