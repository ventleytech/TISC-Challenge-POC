# `@voltpulse/label-ui-stub` (O04)

Thin **static** TP/FP label form for VoltPulse. Posts `vp.labels.v1`-shaped JSON to `pulse-train` `POST /internal/consume`. Not `pulse-web` — avoids UI worktree collision.

## Use

1. Start `pulse-train` (`npm run dev` in `apps/pulse-train`, default port `3020`).
2. Open `static/index.html` in a browser (file:// or any static server).
3. Set train base URL (default `http://127.0.0.1:3020`).
4. Submit **TP** (`accepted: true`) or **FP** (`accepted: false` + optional `corrected_class_id`).

CLI smoke (repo root):

```bash
./scripts/smoke-o04-labels.sh
# or: PULSE_TRAIN_ROOT=/path/to/apps/pulse-train ./scripts/smoke-o04-labels.sh
```

## Contract

Aligns with `packages/contracts/events/labels/vp.labels.v1.schema.json` (topic `vp.labels.v1`).
