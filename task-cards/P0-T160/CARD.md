# P0-T160 — Honest sag + thermal_hotspot stubs (C04 remaining)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` |
| Parallel | `ok` vs T130 / grid-perception glue — **do not** edit perception |
| Branch | `vp/P0-T160-sag-thermal-stubs` |
| Deps | Detection enum in `packages/contracts` (exists); Gate0 real detectors separate |

## Objective

Catalog **C04** remaining detectors (`sag`, `thermal_hotspot`) as **honest Demo Day stubs**: empty / optional low-conf sentinel + documented fallback reasons. No fake accuracy claims. Prefer `packages/detector-fallbacks` over fighting T130 detect-rules glue on `grid-perception`.

## Input docs

- `docs/anti-leak.md`
- `docs/product/requirements.md` (detection enum)
- `docs/product/feature-catalog.md` (C04)
- `packages/contracts/enums/detection.json`
- Local (gitignored, read only): `local-notes/models-experiments/{sag,thermal}/NOTES.md`

## Allowed paths

- `packages/detector-fallbacks/**`
- `task-cards/P0-T160/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only)

Do **not** edit `apps/grid-perception/**`, `apps/grid-rules/**`, or `local-notes/Trinetra-POC/**`.

## Acceptance criteria

- [x] Package `packages/detector-fallbacks` exports stubs for `sag` + `thermal_hotspot`
- [x] Default run returns **empty** detections with non-empty `fallback_reason`
- [x] Optional low-conf sentinel ≤ 0.01 (plumbing only — not a real find)
- [x] Unit tests prove honesty (no SOTA / fake mAP language; anti-leak brand skim)
- [x] Card evidence states Demo Day honesty for C04
- [x] Local NOTES updated with pointer to package (gitignored; not committed)

## Validation

```bash
cd packages/detector-fallbacks
PYTHONPATH=. python3 -m unittest discover -s tests -v
PYTHONPATH=. python3 -c "from detector_fallbacks import run_fallback; print(run_fallback('sag')); print(run_fallback('thermal_hotspot'))"
```

## Evidence

`./evidence/demo-day-honesty.md`

## Anti-leak

- [x] VoltPulse `class_id`s only
- [x] No proprietary paste / internal brand strings
- [x] No accuracy theater

## Notes

T130 owns detect→rules glue on perception paths — this card stays in `packages/detector-fallbacks` so C04 can be Demo-Day-honest without merge fights.
