# P0-T385 — Shared Compose volume for the file bus

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Branch | `vp/P0-T385-shared-bus-volume` |
| Parallel | `no` (compose file) |
| Depends | P0-T381, P0-T382 |

## Objective

Close the T382 gap: `pulse-gateway` and `grid-rules` each had a container-local `/data/bus`. Mount one named volume at `/data/bus` in both so the gateway's `vp.detect.v1.jsonl` is tailed by grid-rules and its findings/alerts jsonl are visible back.

## Allowed paths

`infra/compose/docker-compose.yml` (pulse-gateway, grid-rules, top-level `volumes`), `task-cards/P0-T385/**`, plan row.

## Acceptance criteria

- [x] Named volume `pulse_bus_files` (docker name `voltpulse_pulse_bus_files`) mounted at `/data/bus` in `pulse-gateway` and `grid-rules`
- [x] Kafka path untouched; MinIO pin/digests untouched (`git diff -U0 | grep -c bitnamilegacy` → 0)
- [x] Smoke: gateway frame write visible in grid-rules; findings/alerts jsonl visible back in gateway
- [x] `compose config` ok for all six profiles; anti-leak clean

## Evidence

`evidence/01-shared-bus-smoke.md`.

## Notes

`grid-perception` (T384, merged on main) already mounts the **same** `pulse_bus_files` at `/data/bus`, so all three producers/consumers converge on one volume. Both T381/T382 images already `chown node:node /data/bus`, so a fresh named volume inherits writable ownership. Volume persists across `down` (use `down -v` to reset); grid-rules tail re-reads from offset 0 after restart (T382 limit).
