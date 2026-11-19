# pulse-notify

VoltPulse notify worker stub for P0.

- Consumes **`vp.alerts.v1`**-shaped alerts via mock inject (`POST /internal/consume`)
- Delivers mock **SMS** + **push** (log adapter)
- Fires **ack/receipt** hook (`PULSE_NOTIFY_ACK_MODE=log|http|off`)

Config: copy `.env.template` → `.env`. Compose shell already exists under profile `data` (T001); this app is the real image body later.

## Commands

```bash
npm ci
npm test
npm run smoke
npm run dev   # listens PULSE_NOTIFY_PORT (default 3010)
```

## Health

`GET /health` → `{ status: "ok", service: "pulse-notify", topic: "vp.alerts.v1", ... }`

## Real sink (P0-T360)

`PULSE_NOTIFY_ADAPTER` = `log` (default mock) | `webhook` | `file`.

```bash
# webhook: POST one JSON message per channel
PULSE_NOTIFY_ADAPTER=webhook PULSE_NOTIFY_WEBHOOK_URL=http://127.0.0.1:9000/hook npm run dev
# file: JSON lines
PULSE_NOTIFY_ADAPTER=file PULSE_NOTIFY_FILE_PATH=./out/alerts.jsonl npm run dev
curl -X POST localhost:3010/internal/consume -H 'content-type: application/json' -d @alert.json
npm run smoke:sink   # self-contained webhook + file proof
```

Sink errors mark that delivery `failed` (response `deliveries[].status`); they do not 500.

## Kafka consumer (P0-T365)

Off by default. Starts only when **both** are set:

```bash
PULSE_NOTIFY_KAFKA_ENABLED=true KAFKA_BROKERS=localhost:9094 npm run dev
```

Subscribes `PULSE_ALERTS_TOPIC` (default `vp.alerts.v1`), group `PULSE_NOTIFY_KAFKA_GROUP_ID` (default `pulse-notify`), `PULSE_NOTIFY_KAFKA_FROM_BEGINNING` (default false). Each message goes through the same pipeline + T360 sinks as `POST /internal/consume` (which keeps working). Malformed messages are logged and skipped; sink failures are recorded as `failed` deliveries.

`KAFKA_BROKERS=localhost:9094 npm run smoke:kafka` — live check against pulse-bus (skips if unset).
