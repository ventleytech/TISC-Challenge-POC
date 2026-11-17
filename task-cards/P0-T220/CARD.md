# P0-T220 — O04 label stub (TP/FP → pulse-train)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (+ master catalog O04 / Stream J) |
| Parallel | `ok` vs pulse-web (no web edits); deps pulse-train API |
| Branch | `vp/P0-T220-label-ui-stub` |
| Deps | `P0-T030` pulse-train (`POST /internal/consume`); contracts `vp.labels.v1` |

## Objective

Ship a **non-web** O04 TP/FP labeling stub: static form package + curl smoke that posts `vp.labels.v1`-shaped events to `pulse-train`, so operators can label without colliding with `pulse-web` (T170).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/feature-catalog.md` (O04–O07)
- `packages/contracts/events/labels/vp.labels.v1.schema.json`
- `apps/pulse-train/README.md` (T030)

## Allowed paths

- `packages/label-ui-stub/**`
- `scripts/smoke-o04-labels.sh`
- `task-cards/P0-T220/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/pulse-web/**`, `apps/pulse-api/**`, `apps/pulse-train/**`.

## Acceptance criteria

- [x] `packages/label-ui-stub` static HTML form builds TP/FP `vp.labels.v1` JSON and POSTs to configurable train base URL (`/internal/consume`)
- [x] `scripts/smoke-o04-labels.sh` curls TP + FP against a running `pulse-train` (or starts from `PULSE_TRAIN_ROOT`)
- [x] Evidence under `task-cards/P0-T220/evidence/` with smoke output + anti-leak grep
- [x] No pulse-web / Trinetra paste; VoltPulse names only

## Validation

```bash
# with pulse-train reachable (default http://127.0.0.1:3020) or:
#   PULSE_TRAIN_ROOT=/path/to/apps/pulse-train ./scripts/smoke-o04-labels.sh
./scripts/smoke-o04-labels.sh
rg -ni 'trinetra|t-netra|tnetra' packages/label-ui-stub scripts/smoke-o04-labels.sh && exit 1 || true
```

## Evidence

Write under `./evidence/`.

## Anti-leak

- [x] VoltPulse names only (`vp.labels.v1`, `pulse-train`)
- [x] No proprietary paste

## Notes

- Full operator UI stays on later pulse-web card; this stub unblocks O04 demo without T170 lock.
- Severity board / audit are T100; this card is labels only.
- Spine plan file absent on `0d1d875` base — status row deferred to merge tip.
