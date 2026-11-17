# P0-T040 evidence — pulse-gateway C01 scaffold

Date: 2026-11-18  
Branch: `vp/P0-T040-pulse-gateway`  
Worktree: `/home/ubuntu/voltpulse-P0-T040`

## What landed

- `apps/pulse-gateway` Node/TS MediaMTX-class **session control stub**
- Env-driven RTSP/RTMP ports + public host + file session registry
- `POST /sessions` registers pull URL; `GET /sessions/:id/handoff` for `grid-perception`
- Health: `GET /health`
- Compose **not** rewritten (T001 already stubs `pulse-gateway` under profile `media`)
- No DeepStream / real MediaMTX binary in this card

## Commands

```bash
cd apps/pulse-gateway
npm ci
npm test
npm run smoke
npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-gateway || true
graphify update .
```

## Results (short)

### `npm test` — 6/6 pass

- loadSettings from env
- buildPullUrl rtsp/rtmp
- FileSessionRegistry persist + handoff target `grid-perception`
- reject bad protocol
- GET `/health`
- POST `/sessions` RTMP + handoff

### `npm run smoke` — ok

```json
{
  "ok": true,
  "health": {
    "status": "ok",
    "service": "pulse-gateway",
    "plane": "media",
    "rtspPort": 8554,
    "rtmpPort": 1935
  },
  "session": {
    "pullUrl": "rtsp://127.0.0.1:8554/live/smoke-feeder"
  },
  "handoff": {
    "service": "pulse-gateway",
    "target": "grid-perception",
    "protocol": "rtsp",
    "pullUrl": "rtsp://127.0.0.1:8554/live/smoke-feeder"
  }
}
```

### Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' apps/pulse-gateway` → no matches.

## Notes

- Live MediaMTX process + DeepStream pull remain follow-up cards.
- Perception consumes handoff `pullUrl` on shared inference path when sense plane ready.
