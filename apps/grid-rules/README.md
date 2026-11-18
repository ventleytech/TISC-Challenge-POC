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
| `GRID_RULES_DETECT_FILE` | unset | Loop input: JSONL of `vp.detect.v1` to tail |
| `GRID_RULES_OUT_DIR` | unset | Loop output: writes `<topic>.jsonl` (findings, alerts) |
| `GRID_RULES_ASSETS_FILE` | unset | Asset context JSON (`fixtures/assets.json` shape) |
| `GRID_RULES_POLL_MS` | `1000` | File tail poll interval (≥50) |
| `GRID_RULES_KAFKA_CONSUMER_ENABLED` | `false` | Consume `VP_TOPIC_DETECT` (also needs `KAFKA_BROKERS`) |
| `GRID_RULES_KAFKA_GROUP_ID` | `grid-rules` | Consumer group |
| `GRID_RULES_KAFKA_FROM_BEGINNING` | `false` | Consumer starts at earliest offset on a new group |
| `GRID_RULES_API_BASE_URL` | unset | pulse-api base (e.g. `http://pulse-api:3000`); unset → HTTP sink off |
| `GRID_RULES_API_KEY` | unset | Sent as `X-API-Key`; needs a write role |
| `GRID_RULES_API_TIMEOUT_MS` | `5000` | Per-request timeout (≥100) |

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

## Service loop (`serve.ts` / container)

`dist/serve.js` serves `/health` **and** runs the rules loop (`src/loop.ts`). Inputs/outputs are env-gated and combine freely:

| Direction | Gate | Notes |
|-----------|------|-------|
| in: file | `GRID_RULES_DETECT_FILE` | Tails JSONL (byte offset, partial-line safe); pairs with `pulse-gateway` file sink |
| in: Kafka | `GRID_RULES_KAFKA_CONSUMER_ENABLED=true` + `KAFKA_BROKERS` | Group consumer on `VP_TOPIC_DETECT` |
| out: file | `GRID_RULES_OUT_DIR` | `<VP_TOPIC_FINDINGS>.jsonl`, `<VP_TOPIC_ALERTS>.jsonl` |
| out: Kafka | `GRID_RULES_KAFKA_PRODUCER_ENABLED=true` + `KAFKA_BROKERS` | Same records as file out |
| out: HTTP | `GRID_RULES_API_BASE_URL` | `POST /api/v1/findings` then `POST /api/v1/alerts` on pulse-api (see below) |

**HTTP sink (T393).** `src/bus/http-sink.ts` posts each emitted finding (id = rules `finding_id`) then alert to pulse-api, so no host script is needed to land bus output in the API/Postgres. Findings without `utility_id` (no asset context) and alerts whose tenant is unknown are skipped + logged. A non-2xx, timeout or network error is logged and counted in `/health` → `loop.http.failed`; it never stops the loop or blocks file/Kafka out. Alerts get their id from pulse-api. Don't run it alongside the pulse-api Kafka consumer for the same stream (duplicate finding ids are rejected with 400, logged).

Malformed lines/messages are logged and counted (`rejected` in `/health` → `loop`), not fatal. With no inputs set it only serves `/health`.

## Compose note

Profile `stream`. Compose defaults: tail `/data/bus/vp.detect.v1.jsonl`, write `/data/bus/vp.findings.v1.jsonl` + `vp.alerts.v1.jsonl` (container-local, no volume). Kafka in/out stay off until flagged in `.env`.
