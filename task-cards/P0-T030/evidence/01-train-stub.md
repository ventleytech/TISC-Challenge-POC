# P0-T030 evidence — pulse-train stub

Date: 2026-11-18  
Branch: `vp/P0-T030-pulse-train`  
Worktree: `/home/ubuntu/voltpulse-P0-T030`

## What landed

- `apps/pulse-train` Node/TS stub for O04–O07 story
- Topic in: **`vp.labels.v1`** (aligned with `packages/contracts/events/labels/vp.labels.v1.schema.json`)
- Topic out (reload event shape): **`vp.models.v1`**
- Mock consume: `POST /internal/consume` (TP/FP via `label.accepted`)
- Dataset queue: in-memory + file under `PULSE_TRAIN_DATA_DIR`
- Retrain job stub: enqueue + status (`queued` → `running` → `completed`)
- Model registry stub + reload hook (`PULSE_TRAIN_RELOAD_MODE=log|http|off`)
- Health: `GET /health`
- Compose **not** rewritten (T001 already stubs `pulse-train` under profile `data`)

## Commands

```bash
cd apps/pulse-train
npm ci
npm test
npm run smoke
npm run build
rg -ni 'trinetra|t-netra|tnetra' apps/pulse-train || true
```

## Results (short)

### `npm test` — 5/5 pass

- parseVpLabelsV1 accepts contract-shaped TP/FP payloads
- parseVpLabelsV1 rejects bad class_id
- processLabelEvent queues labels and persists file
- retrain stub completes and registers model
- sendReload http posts vp.models.v1-shaped event

### `npm run smoke` — ok

```json
{
  "ok": true,
  "health": {
    "status": "ok",
    "service": "pulse-train",
    "labelsTopic": "vp.labels.v1",
    "modelsTopic": "vp.models.v1",
    "reloadMode": "log"
  },
  "consume": [
    { "kind": "tp", "class_id": "corrosion", "topic": "vp.labels.v1" },
    { "kind": "fp", "class_id": "crack", "topic": "vp.labels.v1" }
  ],
  "datasetSize": 2,
  "retrain": { "status": "completed" },
  "reload": { "reload": { "mode": "log", "ok": true } }
}
```

### Anti-leak

`rg -ni 'trinetra|t-netra|tnetra' apps/pulse-train` → no matches.

## Notes

- Real Kafka / GPU retrain deferred; mock inject + stub job status is P0 acceptance.
- `http` reload mode POSTs `vp.models.v1`-shaped payload to `PULSE_TRAIN_RELOAD_URL`; default `log` for offline smoke.
