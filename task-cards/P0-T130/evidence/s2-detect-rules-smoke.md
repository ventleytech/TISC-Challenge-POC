# P0-T130 evidence — S2 detect → rules file-bus smoke

| Field | Value |
|-------|-------|
| Mode | `perception` |
| Detect | `task-cards/P0-T130/evidence/detect.v1.json` (5 detections) |
| Rules out | `task-cards/P0-T130/evidence/findings-alerts.json` |
| Findings | 5 |
| Alerts | 3 |
| Top risk | 30.94 |
| Topics | `vp.detect.v1` → `vp.findings.v1` / `vp.alerts.v1` |

## Commands

```bash
./scripts/s2-detect-rules-smoke.sh
# fixture-only:
# GP_FORCE_FIXTURE=1 ./scripts/s2-detect-rules-smoke.sh
```

## Summary

- File-bus glue only (no Kafka / MinIO / pulse-api / pulse-web).
- Perception path used when Gate0 venv + corrosion weight + free GPU; otherwise fixture `apps/grid-rules/fixtures/synthetic-detect.v1.json`.
- `grid-rules` ranked findings (W01 risk) and SLA alerts written to evidence JSON.
- Smoke set `GRID_RULES_ALERT_MIN_SEVERITY=low` (Gate0 corrosion conf often demotes below medium). Sample `sla_due_at` present on alerts.

## Anti-leak

- VoltPulse service names only (`grid-perception`, `grid-rules`).
- Topics `vp.*` only; no proprietary brand strings in script/evidence.

## Result

**PASS** — detect → rules hop produced findings=5 alerts=3 (mode=perception).
