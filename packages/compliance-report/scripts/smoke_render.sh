#!/usr/bin/env bash
# Smoke: sample JSON → HTML stub
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-/tmp/vp-compliance-stub.html}"
cd "$ROOT"
python3 -m tests.test_render
python3 -m compliance_report fixtures/sample_summary.json "$OUT"
test -f "$OUT"
echo "smoke ok: $OUT"
