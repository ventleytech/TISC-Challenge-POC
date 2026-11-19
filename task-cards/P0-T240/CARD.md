# P0-T240 — Wire perception fallbacks for sag / thermal_hotspot

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs pulse-web (T230 owns UI) — **do not** edit `apps/pulse-web` |
| Branch | `vp/P0-T240-perception-fallbacks` |
| Deps | `P0-T160` (`packages/detector-fallbacks`), `P0-T130` / `P0-T010` (`grid-perception`) |

## Objective

On branch from T130: bring in detector-fallbacks; wire `grid-perception` so requesting `sag` or `thermal_hotspot` uses the fallback package and emits honest empty / optional low-conf `vp.detect.v1` with a **reason** field (`fallback_reasons` + optional per-detection `reason`). No fake accuracy.

## Input docs

- `docs/anti-leak.md`
- `docs/product/requirements.md` (detection enum)
- `packages/contracts/events/detect/vp.detect.v1.schema.json`
- `packages/detector-fallbacks/README.md`
- `apps/grid-perception/README.md`
- `task-cards/P0-T160/CARD.md`

## Allowed paths

- `apps/grid-perception/**`
- `packages/detector-fallbacks/**` (via cherry-pick; no behavior rewrite unless needed)
- `packages/contracts/events/detect/vp.detect.v1.schema.json`
- `task-cards/P0-T240/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/pulse-web/**`, `local-notes/Trinetra-POC/**`, or delete Gate0 models/weights.

## Acceptance criteria

- [x] Branch based on T130 + detector-fallbacks present
- [x] `--detectors sag` / `thermal_hotspot` route to `packages/detector-fallbacks`
- [x] Default emit: empty `detections` + non-empty `fallback_reasons[].reason`
- [x] Optional low-conf sentinel ≤ 0.01 with per-detection `reason` (`--fallback-sentinel` / `GP_FALLBACK_SENTINEL`)
- [x] Contract schema allows `fallback_reasons` + detection `reason`
- [x] Unit + CLI smoke evidence under this card
- [x] Anti-leak skim clean; no accuracy theater

## Validation

```bash
PYTHONPATH=apps/grid-perception python3 apps/grid-perception/tests/test_emit_schema.py
PYTHONPATH=apps/grid-perception python3 apps/grid-perception/tests/test_fallback_route.py
PYTHONPATH=packages/detector-fallbacks python3 -m unittest discover -s packages/detector-fallbacks/tests -v
# CLI (any existing path as --source; fallbacks ignore pixels):
cd apps/grid-perception && PYTHONPATH=. python3 -m grid_perception \
  --source /tmp/any.jpg --detectors sag,thermal_hotspot \
  --out ../../task-cards/P0-T240/evidence/detect-fallback-empty.v1.json
rg -ni 'trinetra|t-netra|tnetra' apps/grid-perception packages/detector-fallbacks task-cards/P0-T240
graphify update .
```

## Evidence

- `evidence/perception-fallbacks-smoke.md`
- `evidence/detect-fallback-empty.v1.json`
- `evidence/detect-fallback-sentinel.v1.json`

## Anti-leak

- [x] VoltPulse `class_id`s / `vp.detect.v1` only
- [x] No proprietary paste / internal brand strings
- [x] No fake mAP / radiometric °C claims

## Notes

UI feedback / wow shell owned by T230 — this card does not touch `pulse-web`.
