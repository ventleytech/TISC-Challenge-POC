# P0-T393 evidence

- `cd apps/grid-rules && npx tsc --noEmit && npm test` → 25 pass / 0 fail (`unit-tests.txt`)
- `bash scripts/s2-compose-bus-e2e.sh` (project `vp393`, ports 3393/3394/5443/8593) → PASS, exit 0
  - `rules-health-after.json`: detects=1 findings=1 alerts=1 rejected=0 http.posted=2 http.failed=0
  - script only does GET; rows confirmed in compose Postgres: `findings=1 alerts=1`
  - teardown `down -v` for vp393; no leftover containers
