# grid-perception (Sense plane)

File-ingest stub: stills → Ultralytics predict → JSON aligned to `vp.detect.v1`.

Kafka produce is **out of scope** here (stdout / `--out` file only).

## Run (host venv — preferred tonight)

```bash
# from repo root
source local-notes/models-experiments/_scratch/venv/bin/activate
set -a && source apps/grid-perception/.env.template && set +a
# override weight paths to Gate0 local files:
export GP_WEIGHTS_CORROSION=local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt
export GP_WEIGHTS_CRACK=local-notes/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt
export GP_WEIGHTS_VEGETATION=local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt

python -m grid_perception \
  --source local-notes/models-experiments/corrosion/samples/test/images \
  --detectors corrosion,crack,vegetation \
  --out /tmp/vp-detect.json
```

Working directory may be repo root or `apps/grid-perception` (package is on `PYTHONPATH` via `-m` from this directory — prefer:

```bash
cd apps/grid-perception && PYTHONPATH=. python -m grid_perception ...
```

## Config

All runtime knobs via env → `grid_perception.config.Settings`. See `.env.template`. No hardcoded hosts/ports.

## Docker (compose `sense` profile)

CPU stub image (alpine, no torch/ultralytics). `python -m grid_perception.serve` runs `/health` **and** an inbox watcher:

- `GP_INBOX_DIR` (compose `/data/inbox`, volume `pulse_perception_inbox`): each `*.jpg|png|…` → detectors in `GP_DETECTORS` → one `vp.detect.v1` JSON line appended to `GP_DETECT_FILE` (compose `/data/bus/vp.detect.v1.jsonl`, volume `pulse_bus_files`). File moves to `processed/` or `failed/`.
- Default `GP_DETECTORS=sag,thermal_hotspot` → honest fallbacks, runs on CPU with no weights.
- Gate0 weights (corrosion/crack/vegetation): `GP_MODELS_HOST_DIR` is mounted read-only at `/models`; set `GP_WEIGHTS_*_CONTAINER` to files under it and add them to `GP_DETECTORS`. Needs ultralytics, which this image lacks → those files land in `failed/` with a log line. CUDA image = follow-up card.
- `/health` JSON includes `processed`, `failed`, `detections` counters.

```bash
docker compose --env-file .env.template -f infra/compose/docker-compose.yml --profile sense up -d --build grid-perception
docker cp some.jpg vp-grid-perception:/data/inbox/
docker exec vp-grid-perception tail -n1 /data/bus/vp.detect.v1.jsonl
```

## Detectors

| VoltPulse `class_id` | Default weight env | Gate0 proof |
|----------------------|--------------------|-------------|
| `corrosion` | `GP_WEIGHTS_CORROSION` | M002 |
| `crack` | `GP_WEIGHTS_CRACK` | M003 |
| `vegetation` | `GP_WEIGHTS_VEGETATION` | M004 (AGPL smoke) |
| `sag` | *(fallback package)* | Demo Day honest stub — empty / optional ≤0.01 sentinel + `fallback_reasons` |
| `thermal_hotspot` | *(fallback package)* | Demo Day honest stub — empty / optional ≤0.01 sentinel + `fallback_reasons` |

Missing weight file → detector skipped with stderr warning (not a hard fail if ≥1 detector runs).

Requesting `sag` or `thermal_hotspot` always routes to `packages/detector-fallbacks` (no fake accuracy). Event includes `fallback_reasons[].reason`. Optional plumbing: `--fallback-sentinel` or `GP_FALLBACK_SENTINEL=1`.

## Anti-leak

VoltPulse names only. Do not copy proprietary DeepStream configs or internal brands.

## Evidence crops (P0-T403)

When `GP_EVIDENCE_ENABLED=1`, each detection with a bbox is POSTed to pulse-api
`POST /api/v1/evidence` (`kind=crop`). Nest stores bytes in MinIO/fs. Detection
rows gain `evidence_object_id` on success. Without Pillow (CPU alpine), the
source frame is uploaded with bbox metadata (real pixel crop on CUDA/ultralytics images).
