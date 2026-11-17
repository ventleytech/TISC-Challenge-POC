# pulse-notify (mock)

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
