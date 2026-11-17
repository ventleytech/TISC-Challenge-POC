# grid-rules

VoltPulse Stream-plane rules service. Consumes `vp.detect.*`, emits ranked `vp.findings.*` and SLA-bearing `vp.alerts.*`.

**P0 posture:** mock-friendly TypeScript engine + fixture bus (no Kafka/Flink required). Emit shapes match `packages/contracts`. Flink packaging can wrap the same policy later.

## What it does

1. Map each detection → **severity** (class + confidence).
2. Compute **W01 risk score** = `f(severity, confidence, asset.criticality, voltage_class)` (0–100).
3. When asset fixture carries OEM / warranty / anti-corrosion SLA → call `@voltpulse/responsibility` `hintResponsibility` and attach `party_type` / `warranty_hint` under `finding.extensions` (S9).
4. Emit `vp.findings.v1` sorted by risk desc.
5. Emit `vp.alerts.v1` when severity ≥ configured floor, with `sla_due_at` + channel stubs.

## Local run

```bash
npm install
npm test
npm run smoke
# or:
npm start -- --fixture fixtures/synthetic-detect.v1.json --assets fixtures/assets.json
```

Smoke prints JSON: findings (`severity`, `risk_score`, optional `extensions.party_type` / `warranty_hint`) + alerts (`sla_due_at`). Default `fixtures/assets.json` includes synthetic OEM/warranty for S9.

## Config (env)

| Key | Default | Meaning |
|-----|---------|---------|
| `GRID_RULES_SERVICE_NAME` | `grid-rules` | Service id |
| `VP_TOPIC_DETECT` | `vp.detect.v1` | Input topic name |
| `VP_TOPIC_FINDINGS` | `vp.findings.v1` | Findings emit |
| `VP_TOPIC_ALERTS` | `vp.alerts.v1` | Alerts emit |
| `GRID_RULES_SLA_*_MIN` | 15/60/240/1440/10080 | SLA minutes by severity |
| `GRID_RULES_ALERT_MIN_SEVERITY` | `medium` | Alert floor |
| `KAFKA_BROKERS` | unset | Reserved; fixture mode ignores |

No secrets. Brokers only via env when Kafka adapter lands.

## Layout

```
src/
  policy/     # severity, W01 risk, SLA
  bus/        # fixture source + memory sink
  rules-engine.ts
  cli.ts
fixtures/     # synthetic vp.detect.v1
```

## Compose note

Profile target: `stream`. This card does **not** rewrite root Compose — run locally via `npm run smoke` until a tiny service fragment is owned by a compose card.
