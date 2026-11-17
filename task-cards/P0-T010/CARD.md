# P0-T010 — grid-perception file-ingest stub

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs pulse-api/notify/web/store/rules; **serialize** GPU vs other M* infer |
| Branch | `vp/P0-T010-grid-perception` |
| Deps | Gate 0.1 unlocked (M002 corrosion proven; M003/M004 smokes green) |

## Objective

Ship `apps/grid-perception` file-ingest stub: Ultralytics predict on stills → JSON aligned to `vp.detect.v1` (stdout/file). No Kafka yet. Prefer proven corrosion weights; plug crack + vegetation when weights present.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/requirements.md` (detection enum)
- `packages/contracts/events/detect/vp.detect.v1.schema.json`
- `packages/contracts/events/catalog.yaml`
- Plan: `task-plans/2026-11-18-gate0-and-p0-spine.md`
- Evidence: `task-cards/P0-M002/evidence/g0-corrosion-smoke.md` (+ M003/M004 if used)

## Allowed paths

- `apps/grid-perception/**`
- `models/pointers/**` (thin weight pointers only; no blobs)
- `task-cards/P0-T010/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/pulse-*`, `apps/grid-rules`, Compose ownership files, or `local-notes/Trinetra-POC/**`. Read-only ok for `local-notes/models-experiments/**` weights + venv.

## Acceptance criteria

- [x] Config object loads paths/device/conf/topic from env (no hardcoded hosts/ports/weight hosts)
- [x] CLI runs file/dir ingest via Ultralytics using scratch venv path (documented) **or** documents Docker follow-up
- [x] Output JSON validates structurally against `vp.detect.v1` required fields + detection enum `class_id`
- [x] Corrosion path works when `GP_WEIGHTS_CORROSION` points at Gate0 weight
- [x] Crack / vegetation plugged when weight env vars set and files exist (skip gracefully if missing)
- [x] Evidence under `./evidence/` with cmds + short stdout
- [x] Anti-leak clean (VoltPulse ids only; no proprietary paste)

## Validation

```bash
source local-notes/models-experiments/_scratch/venv/bin/activate
export GP_WEIGHTS_CORROSION=local-notes/models-experiments/corrosion/weights/Basic_YOLO11_v1.pt
export GP_WEIGHTS_CRACK=local-notes/models-experiments/crack-damage/weights/vpmbgi-yolo11n-best.pt
export GP_WEIGHTS_VEGETATION=local-notes/models-experiments/vegetation/weights/pl_yolov8s.pt
export PULSE_DETECT_TOPIC=vp.detect.v1
cd apps/grid-perception
python -m grid_perception \
  --source ../../local-notes/models-experiments/corrosion/samples/test/images \
  --detectors corrosion \
  --out /tmp/vp-detect-corrosion.json
python tests/test_emit_schema.py
python -c "import json; e=json.load(open('/tmp/vp-detect-corrosion.json')); assert e['detections']; print(len(e['detections']), e['detections'][0]['class_id'])"
```

Logged: corrosion `n=5` best≈0.714; crack `n=13` best≈0.669; veg `n=13` best≈0.578.

## Evidence

Write `./evidence/file-ingest-smoke.md`. Do not mark `done` without verification.

Logged: `./evidence/file-ingest-smoke.md`.

## Anti-leak

- [x] VoltPulse service name `grid-perception`, topic `vp.detect.v1`, detection ids only
- [x] No proprietary DeepStream / internal brand strings
- [x] Weights stay untracked under `local-notes/`; `models/pointers` = URLs/paths only

## Notes

- Kafka produce deferred (later card). This card = file → JSON contract alignment.
- Vegetation PL-YOLOv8 is **AGPL** smoke — pointer notes license; product retrain later.
- Do not delete curated models.
