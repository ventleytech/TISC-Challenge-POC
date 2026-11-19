# packages/detector-fallbacks

Honest **Demo Day** stubs for VoltPulse detectors that do **not** yet have open, smoke-proven weights.

| `class_id` | Status | Behavior |
|------------|--------|----------|
| `sag` | fallback stub | empty detections; documented reason |
| `thermal_hotspot` | fallback stub | empty detections; documented reason |

Gate0 live path (`corrosion` / `crack` / `vegetation`) stays in `apps/grid-perception`. This package does **not** claim accuracy, mAP, or radiometric °C.

## Why stubs

- **sag** — no strong public conductor-sag YOLO; geometry/catenary baseline still experimental.
- **thermal_hotspot** — no utility IR camera on host yet; public IR media not wired as a demo weight.

Catalog **C04** (five detectors) is covered for Demo Day by: three real Gate0 smokes + these two honest fallbacks.

## API

```python
from detector_fallbacks import run_fallback, FALLBACK_CLASS_IDS

result = run_fallback("sag")
assert result["detections"] == []
assert result["status"] == "fallback"
print(result["fallback_reason"])
```

Optional low-confidence sentinel (off by default): `run_fallback("sag", emit_low_conf_sentinel=True)` adds one `confidence=0.01` row so consumers can exercise the class_id path without implying a real find.

## Run tests

```bash
cd packages/detector-fallbacks
PYTHONPATH=. python3 -m unittest discover -s tests -v
```

## Anti-leak

VoltPulse detector ids only. No proprietary model names, topics, or UI chrome.
