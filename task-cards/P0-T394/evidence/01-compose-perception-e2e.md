# P0-T394 evidence

Command: `./scripts/s2-compose-perception-e2e.sh` (second run with `VP394_NO_BUILD=1`; first run built images, ~21 s each)

Result (`result.txt`):

```
PASS inspection=4cb40a56-... perception=processed=1 detections=2 rules=detects=1 findings=2 alerts=0 rejected=0
```

- `perception-health-{before,after}.json`: ingest_loop true; processed 0 → 1, failed 0
- `rules-health-{before,after}.json`: loop detects 0 → 1, findings 2, alerts 0, rejected 0
- `bus-vp.detect.v1.jsonl`, `bus-vp.findings.v1.jsonl`, `bus-vp.alerts.v1.jsonl` (empty: info < medium)
- `inbox-listing.txt`: `sample-t394.png` in `processed/`
- After run: `docker ps -a | rg vp394` empty; `vp-pulse-bus`, `vp-pulse-postgres` still running.
