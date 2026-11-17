# pulse-train (stub)

VoltPulse ML-ops story stub for O04–O07 (labels → queue → retrain → reload).

- Consumes **`vp.labels.v1`**-shaped TP/FP labels via mock inject (`POST /internal/consume`)
- Maintains a **dataset queue** (in-memory + optional file under `PULSE_TRAIN_DATA_DIR`)
- **Retrain job** stub: enqueue + status
- **Model registry** stub + **`vp.models.v1`**-shaped reload hook (`log` / `http` / `off`)

Config: copy `.env.template` → `.env`. Compose shell already exists under profile `data` (T001); this app is the real image body later.

## Commands

```bash
npm ci
npm test
npm run smoke
npm run dev   # listens PULSE_TRAIN_PORT (default 3020)
```

## Health

`GET /health` → `{ status: "ok", service: "pulse-train", labelsTopic: "vp.labels.v1", ... }`
