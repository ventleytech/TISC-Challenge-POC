# P0-T240 — perception fallbacks smoke

**Branch:** `vp/P0-T240-perception-fallbacks` (from T130 `8549d8e` + cherry-pick T160 detector-fallbacks)

## What changed

- `grid-perception` routes `sag` / `thermal_hotspot` → `packages/detector-fallbacks.run_fallback`
- `vp.detect.v1` gains optional `fallback_reasons[]` and optional detection `reason`
- Default: **empty** detections + documented reason (no fake boxes/confidence)
- Optional plumbing: `--fallback-sentinel` / `GP_FALLBACK_SENTINEL=1` → one row at `confidence=0.01`

## Commands

```bash
PYTHONPATH=apps/grid-perception python3 apps/grid-perception/tests/test_emit_schema.py
# → PASS test_emit_schema

PYTHONPATH=apps/grid-perception python3 apps/grid-perception/tests/test_fallback_route.py
# → PASS test_fallback_route

PYTHONPATH=packages/detector-fallbacks python3 -m unittest discover -s packages/detector-fallbacks/tests -v
# → Ran 5 tests … OK

cd apps/grid-perception
PYTHONPATH=. python3 -m grid_perception \
  --source <tiny.jpg> --detectors sag,thermal_hotspot \
  --out ../../task-cards/P0-T240/evidence/detect-fallback-empty.v1.json
PYTHONPATH=. python3 -m grid_perception \
  --source <tiny.jpg> --detectors sag --fallback-sentinel \
  --out ../../task-cards/P0-T240/evidence/detect-fallback-sentinel.v1.json
```

## Results

| Mode | detections | fallback_reasons | notes |
|------|------------|------------------|-------|
| empty (default) | 0 | 2 (`sag`, `thermal_hotspot`) | reasons non-empty; status=`fallback` |
| sentinel | 1 (`sag` @ 0.01) | 1 (`sag`) | detection carries `reason`; not a real find |

Gate0 YOLO path (`corrosion`/`crack`/`vegetation`) unchanged.

## Anti-leak

`rg -ni 'trinetra|t-netra|tnetra'` on touched surfaces → no hits.

## Honesty

No accuracy / mAP / radiometric °C claims. Stubs only until real weights land.
