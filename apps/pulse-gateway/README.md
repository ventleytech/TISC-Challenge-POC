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
