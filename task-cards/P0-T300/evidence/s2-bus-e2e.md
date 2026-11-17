# P0-T300 evidence — S2 bus E2E (perception → rules → pulse-api)

| Field | Value |
|-------|-------|
| Detect mode | `perception` |
| Detect | `task-cards/P0-T300/evidence/detect.v1.json` (5 detections) |
| Rules out | `task-cards/P0-T300/evidence/findings-alerts.json` (findings=5 alerts=3) |
| API posted | `task-cards/P0-T300/evidence/api-posted.json` (findings=5 alerts=3) |
| API listed | `task-cards/P0-T300/evidence/api-listed.json` |
| API base | `http://127.0.0.1:3000` |
| Utility | `11111111-1111-4111-8111-111111111111` |
| Topics | `vp.detect.v1` → `vp.findings.v1` / `vp.alerts.v1` (file-bus + HTTP ingest) |

## Commands

```bash
./scripts/s2-bus-e2e.sh
# fixture-only:
# GP_FORCE_FIXTURE=1 ./scripts/s2-bus-e2e.sh
```

## Kafka / bus note

pulse-bus not running (compose project voltpulse). Fixture/file-bus + HTTP ingest only. Later: consumer on vp.findings.v1 / vp.alerts.v1.

## Summary

- Reused T130 `scripts/s2-detect-rules-smoke.sh` for detect → rules.
- Extended hop: `POST /api/v1/findings` then `POST /api/v1/alerts`; verified via list.
- Persist backend: pulse-api `MemoryStore` (Postgres later).

## Anti-leak

- VoltPulse services only (`grid-perception`, `grid-rules`, `pulse-api`).
- Topics `vp.*` only.

## Result

**PASS** — S2 E2E posted findings=5 alerts=3 (detect_mode=perception).
