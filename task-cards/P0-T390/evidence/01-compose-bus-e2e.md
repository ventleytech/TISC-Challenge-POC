# P0-T390 evidence

Command: `./scripts/s2-compose-bus-e2e.sh` (project `vp390`; first run built images ~6 min, rerun 28 s). rc=0.

```
[t390] services up; rules health before: ... "detects":0,"findings":0,"alerts":0,"rejected":0
gateway frame: {"id":"00a455a8-...","inspection_id":"fedb03c2-...","sink":"file"}      (gateway-frame-response.json)
rules health after: "detects":1,"findings":1,"alerts":1,"rejected":0                    (rules-health-after.json)
gateway /data/bus: vp.detect.v1.jsonl 398B, vp.findings.v1.jsonl 570B, vp.alerts.v1.jsonl 394B (bus-listing-gateway.txt)
ok findings_on_bus=1 alerts_on_bus=1 listed_f=1 listed_a=1                              (api-listed.json, api-posted.json)
postgres: findings=1 alerts=1                                                           (postgres-rows.txt)
[t390] PASS inspection=fedb03c2-633d-4e30-a633-63560090470b
[t390] teardown: down -v (project vp390 only)
```

Finding: corrosion, medium, risk 52.05, asset `cccccccc-...` (rules fixture), utility `1111...`.

Post-run: `docker ps` still shows `vp-pulse-bus`, `vp-pulse-postgres`; `docker volume ls | grep vp390` → none. `docker-compose.yml` not modified (MinIO pins intact).

Bug fixed during bring-up: grid-rules health counters live under `.loop`, not top level (first run failed on that).
