# P0-T006 evidence — pulse-notify mock

Date: 2026-11-18  
Branch: `vp/P0-T006-pulse-notify`  
Worktree: `/home/ubuntu/voltpulse-P0-T006`

## What landed

- `apps/pulse-notify` Node/TS mock worker
- Topic: **`vp.alerts.v1`** (aligned with `packages/contracts/events/alerts/vp.alerts.v1.schema.json`)
- Mock consume: `POST /internal/consume`
- Channels: mock **push** + **SMS** (log adapter); email skipped
- Ack hook: `PULSE_NOTIFY_ACK_MODE=log|http|off`
- Health: `GET /health`
- Compose **not** rewritten (T001 already stubs `pulse-notify` under profile `data`)

## Commands

```bash
cd apps/pulse-notify
npm ci
npm test
npm run smoke
npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-notify || true
```

## Results (short)

### `npm test` — 4/4 pass

- parseVpAlertsV1 accepts contract-shaped payload
- parseVpAlertsV1 rejects bad severity
- processAlertEvent delivers push+sms and log-acks
- sendAck http posts receipt URL (`…/api/v1/alerts/{id}/receipts`)

### `npm run smoke` — ok

```json
{
  "ok": true,
  "health": {
    "status": "ok",
    "service": "pulse-notify",
    "topic": "vp.alerts.v1",
    "adapter": "log",
    "ackMode": "log"
  },
  "consume": {
    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "topic": "vp.alerts.v1",
    "deliveries": [
      { "channel": "push", "status": "sent" },
      { "channel": "sms", "status": "sent" }
    ],
    "ack": { "mode": "log", "ok": true }
  }
}
```

### Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' apps/pulse-notify` → no matches.

## Notes

- Real Kafka consumer deferred; mock inject is P0 acceptance.
- `http` ack mode POSTs when Nest receipt route exists; default `log` for offline smoke.
