#!/usr/bin/env bash
# Initialize graphify for VoltPulse Cursor workspace.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify not on PATH. Install: uv tool install graphifyy"
  exit 1
fi

echo "== graphify cursor install =="
graphify cursor install || graphify install --platform cursor

echo "== graphify update . (safe if little/no code yet) =="
graphify update . || true

echo "Done. Output: graphify-out/ (gitignored). Rule: .cursor/rules/graphify.mdc if install wrote it."
