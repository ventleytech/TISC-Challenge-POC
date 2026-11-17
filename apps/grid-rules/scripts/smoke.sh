#!/usr/bin/env bash
# Local mock-friendly smoke for grid-rules (no Kafka).
set -euo pipefail
cd "$(dirname "$0")/.."
npm test
npm run smoke -- --fixture fixtures/synthetic-detect.v1.json --assets fixtures/assets.json
