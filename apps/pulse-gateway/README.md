# pulse-gateway (C01 scaffold)

VoltPulse **Media** plane stub: MediaMTX-class session config + RTSP/RTMP pull URL registry.

- Config from env (see `.env.template`) — RTSP/RTMP ports, public host, session dir
- File-based session registry under `PULSE_GATEWAY_SESSION_DIR`
- Health + register + **handoff** for `grid-perception`
- **Not** a full MediaMTX / DeepStream deploy — later cards wire the live binary and sense plane

Compose already stubs this service under profile `media` (T001). This app is the control-plane body.

## Commands

```bash
npm ci
npm test
npm run smoke
npm run dev   # listens PULSE_GATEWAY_PORT (default 3020)
```

## HTTP

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness + port summary |
| `POST` | `/sessions` | Register RTSP/RTMP pull URL |
| `GET` | `/sessions` | List sessions |
| `GET` | `/sessions/:id` | Fetch session |
| `GET` | `/sessions/:id/handoff` | Handoff note for `grid-perception` |
| `GET` | `/pull/targets` | Configured `PULSE_GATEWAY_PULL_URLS` (comma list, rtsp/rtmp) |
| `POST` | `/pull/sync` | Register configured URLs as sessions (idempotent by URL) |
| `POST` | `/sessions/:id/frames` | Publish a **synthetic** `vp.detect.v1` event (`source: live`) → `202 { id, inspection_id, sink }` |

### Synthetic frames (T380, Sense-plane demo)

Env-gated by `PULSE_GATEWAY_DETECT_SINK` = `off` (default, `409 detect_sink_disabled`) | `file` (JSONL at `PULSE_GATEWAY_DETECT_FILE`) | `kafka` (needs `KAFKA_BROKERS`; topic `PULSE_DETECT_TOPIC`, key = `inspection_id`).
Optional body: `class_id`, `confidence`, `bbox` (xyxy), `inspection_id`, `asset_id` (uuid). Each detection carries an honest `reason`: no inference runs. Real pull + DeepStream remains `grid-perception`'s job.

`npm run smoke:curl` boots the service and exercises all of the above with curl (kafka: `PULSE_GATEWAY_DETECT_SINK=kafka KAFKA_BROKERS=localhost:9094`).

### Register body

```json
{
  "name": "feeder-demo",
  "protocol": "rtsp",
  "path": "live/feeder-demo"
}
```

Optional `url` overrides the env-built pull URL (must match `rtsp://` or `rtmp://`).

## Handoff → grid-perception

`GET /sessions/:id/handoff` returns:

| Field | Meaning |
|-------|---------|
| `service` | Always `pulse-gateway` |
| `target` | Always `grid-perception` |
| `sessionId` | Registry id |
| `protocol` | `rtsp` \| `rtmp` |
| `pullUrl` | URL perception should pull |
| `path` | Stream path |
| `status` | `registered` (scaffold) |
| `registeredAt` | ISO timestamp |
| `notes` | Scaffold guidance — shared inference path later |

Perception owns DeepStream/ONNX consume; gateway only publishes the pull URL.
