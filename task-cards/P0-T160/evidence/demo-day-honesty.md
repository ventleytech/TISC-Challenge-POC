# P0-T160 evidence — Demo Day honesty (sag / thermal)

Date: 2026-11-18  
Branch: `vp/P0-T160-sag-thermal-stubs`

## Claim (honest)

Catalog **C04** five detectors for Demo Day:

| class_id | Demo Day path |
|----------|---------------|
| `corrosion` | Gate0 smoke (M002) → `grid-perception` |
| `crack` | Gate0 smoke (M003) → `grid-perception` |
| `vegetation` | Gate0 smoke (M004, AGPL) → `grid-perception` |
| `sag` | **fallback stub** — empty detections + reason |
| `thermal_hotspot` | **fallback stub** — empty detections + reason |

**No accuracy / mAP / radiometric °C claims** for sag or thermal on this host.

## Validation run

```text
$ cd packages/detector-fallbacks && PYTHONPATH=. python3 -m unittest discover -s tests -v
test_default_empty_detections (test_stubs.StubHonestyTests) ... ok
test_fallback_ids_match_c04_remaining (test_stubs.StubHonestyTests) ... ok
test_low_conf_sentinel_optional (test_stubs.StubHonestyTests) ... ok
test_reasons_documented (test_stubs.StubHonestyTests) ... ok
test_unknown_class_raises (test_stubs.StubHonestyTests) ... ok
----------------------------------------------------------------------
Ran 5 tests in 0.001s
OK
```

Smoke print (truncated):

```text
{'class_id': 'sag', 'status': 'fallback', 'detections': [], 'confidence_ceiling': 0.0, ...}
{'class_id': 'thermal_hotspot', 'status': 'fallback', 'detections': [], 'confidence_ceiling': 0.0, ...}
```

## Why not grid-perception

`P0-T130` owns detect→rules glue. This card deliberately ships under `packages/detector-fallbacks` so stubs land without path collision.

## Local notes (not committed)

Pointers added under `local-notes/models-experiments/{sag,thermal}/NOTES.md` → tracked package path.
