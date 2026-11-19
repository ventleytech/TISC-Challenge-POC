# P0-T391 evidence

## pulse-api jest (`apps/pulse-api`)
```
Test Suites: 9 passed, 9 total
Tests:       42 passed, 42 total
```

## topic bootstrap
```
vp.detect.v1
vp.findings.v1
vp.alerts.v1
vp.labels.v1
vp.models.v1
vp.dlq.v1
```

eslint src/ingest src/config: clean. `tsc` only error is pre-existing `minio` module missing in sandbox (src/evidence).
