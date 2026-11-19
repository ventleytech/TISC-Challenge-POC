# P0-T370 — Anti-leak scrub (tests)

| Field | Value |
|-------|-------|
| Status | `done` |
| Branch | `vp/P0-T370-antileak-scrub` |
| Deps | P0-T350 report |

## Objective

Remove internal-brand literals from tracked test code. Keep brand guards working without spelling the name.

## Allowed paths

- `apps/grid-perception/tests/test_fallback_route.py`
- `packages/detector-fallbacks/tests/test_stubs.py`
- `packages/i18n/tests/t.test.js`
- `task-cards/P0-T370/**`

Do **not** touch `local-notes/**`.

## Acceptance

- [x] No brand literal in app/package/infra/docs code paths
- [x] Guard tests still pass
- [x] Remaining hits are policy / guard-pattern only (see evidence)
