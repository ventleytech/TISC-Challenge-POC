# grid-rules

VoltPulse Stream-plane rules service. Consumes `vp.detect.*`, emits ranked `vp.findings.*` and SLA-bearing `vp.alerts.*`.

**P0 posture:** mock-friendly TypeScript engine + fixture bus (Kafka/Flink optional; producer off unless enabled). Emit shapes match `packages/contracts`. Flink packaging can wrap the same policy later.

## What it does

1. Map each detection → **severity** (class + confidence).
2. Compute **W01 risk score** = `f(severity, confidence, asset.criticality, voltage_class)` (0–100).
3. When asset fixture carries OEM / warranty / anti-corrosion SLA → call `@voltpulse/responsibility` `hintResponsibility` and attach `party_type` / `warranty_hint` under `finding.extensions` (S9).
4. Emit `vp.findings.v1` sorted by risk desc.
5. Emit `vp.alerts.v1` when severity ≥ configured floor, with `sla_due_at` + channels from `@voltpulse/alert-policy`.

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
| `VP_ALERT_SLA_*_MIN` | package defaults | SLA minutes via `@voltpulse/alert-policy` |
| `VP_ALERT_DEFAULT_CHANNELS` | `push,sms` | Default notify channels (enabled only) |
| `VP_ALERT_CHANNEL_*` | see alert-policy `.env.template` | Channel enable / adapter |
| `GRID_RULES_SLA_*_MIN` | (legacy) | Mapped to `VP_ALERT_SLA_*` when modern unset |
| `GRID_RULES_ALERT_MIN_SEVERITY` | `medium` | Alert floor |
| `GRID_RULES_KAFKA_PRODUCER_ENABLED` | `false` | Publish findings/alerts to Kafka (also needs `KAFKA_BROKERS`) |
| `KAFKA_BROKERS` | unset | Comma-separated bootstrap list; unset → Kafka publish is a no-op |
| `GRID_RULES_KAFKA_CLIENT_ID` | `grid-rules` | Producer client id |

No secrets. Brokers only via env. SLA/channels are **not** hardcoded in grid-rules — they load from `packages/alert-policy`.

## Kafka producer (optional)

`src/bus/kafka-sink.ts` publishes the same records the stdout/memory bus emits to `VP_TOPIC_FINDINGS` / `VP_TOPIC_ALERTS` (JSON value, key = `inspection_id`, falling back to `finding_id`). Enabled only when `GRID_RULES_KAFKA_PRODUCER_ENABLED=true` **and** `KAFKA_BROKERS` is set; otherwise nothing connects and file/stdout behavior is unchanged.

```bash
GRID_RULES_KAFKA_PRODUCER_ENABLED=true KAFKA_BROKERS=localhost:9094 npm run smoke
```

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
