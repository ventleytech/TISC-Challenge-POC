# C01 ingest hold — record-upload primary (P0-T409)

## Policy (Demo Day)

**True RTSP camera ingest is on hold.** Demo and E2E use:

1. **Record-upload primary** — drop stills/clips into `grid-perception` inbox (`GP_INBOX_DIR`) or gateway frame inject.
2. **Optional HLS sim** — loop a sample MP4 through ffmpeg → HLS for UI/Media plane demos (`infra/media/hls-hold/`).

Do **not** claim live drone/RTSP camera in decks or UI copy.

## Gateway

`pulse-gateway` keeps the session registry + perception handoff document. Handoff notes state C01 hold: MediaMTX/DeepStream wiring later; pull URL may point at HLS sim or remain registry-only.

Env:

| Key | Role |
|-----|------|
| `PULSE_GATEWAY_INGEST_MODE` | `record_upload` (default) \| `hls_sim` \| `rtsp_hold` |
| `PULSE_GATEWAY_HLS_SAMPLE_URL` | Optional sample playlist when `hls_sim` |

## HLS hold recipe

```bash
# requires ffmpeg + a sample MP4 (not committed)
./infra/media/hls-hold/run-hls-sim.sh /path/to/sample.mp4 ./infra/media/hls-hold/out
# serve out/ with any static server; point gateway session URL at index.m3u8
```

Compose profile `media-hls` (optional) runs the script container — see `infra/compose/docker-compose.yml`.
