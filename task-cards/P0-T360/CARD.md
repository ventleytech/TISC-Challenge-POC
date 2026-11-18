# P0-T360 — pulse-notify real channel sink

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T360-notify-channel` |

## Objective

Move pulse-notify beyond log-only mock: config-driven real sink (webhook POST or JSONL file) per alert channel delivery.

## Allowed paths

`apps/pulse-notify/**`, `task-cards/P0-T360/**`

## Design

- `PULSE_NOTIFY_ADAPTER=log|webhook|file` (default `log` = unchanged mock).
- `webhook`: POST one JSON message per sent channel to `PULSE_NOTIFY_WEBHOOK_URL` (timeout `PULSE_NOTIFY_WEBHOOK_TIMEOUT_MS`, default 5000).
- `file`: append one JSON line per sent channel to `PULSE_NOTIFY_FILE_PATH` (dirs auto-created).
- Sink failure → delivery `status: failed` + detail; no throw; ack still fires with the record. `skipped` (email) never emitted.
- Entry stays `POST /internal/consume` (HTTP inject). Kafka consumer not in scope.
- `packages/alert-policy` not linked into pulse-notify; channel list still comes from the alert payload. Out of scope.

## Acceptance criteria

- [x] Config-driven sink, validated at startup (missing URL/path rejected)
- [x] Webhook + file both deliver; failures recorded not thrown
- [x] Tests + curl-style smoke show delivery records
- [x] No secrets, no changes outside allowed paths; anti-leak clean

## Evidence

`evidence/01-tests.txt`, `evidence/02-smoke-sink.json` (`npm run smoke:sink`).

## Known limits

No retry/backoff, no auth header on webhook (add `PULSE_NOTIFY_WEBHOOK_TOKEN` if a real receiver needs it), sequential per-channel posts.
