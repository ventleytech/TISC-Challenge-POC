# P0-T270 — W07 offline-sync + W08 i18n stubs

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` (W07/W08 from master catalog) |
| Parallel | `ok` vs pulse-web / perception (packages only) |
| Branch | `vp/P0-T270-offline-i18n` |

## Objective

Ship package stubs for WOW **W07** (offline edge sync protocol + queue) and **W08** (multi-language string catalog + `t()`), without touching `pulse-web` (T230 owns UI).

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/feature-catalog.md` (WOW row refs)

## Allowed paths

- `packages/offline-sync/**`
- `packages/i18n/**`
- `task-cards/P0-T270/**`
- `task-plans/2026-11-18-gate0-and-p0-spine.md` (status row only, if present)

## Acceptance criteria

- [x] `packages/offline-sync` exports queue ops + `vp.offline.sync.v1` / ack protocol builders
- [x] `packages/i18n` exports `en` + second locale keyset (`hi`) with matching keys + `t()`
- [x] Unit tests pass for both packages (`node --test`)
- [x] No `pulse-web` edits; VoltPulse brand only; no proprietary paste

## Validation

```bash
cd packages/offline-sync && npm test
cd packages/i18n && npm test
rg -n 'Trinetra|T-Netra|TNetra' packages/offline-sync packages/i18n || true
```

## Evidence

See `./evidence/01-stubs.md`.

## Anti-leak

- [x] VoltPulse names only in new surfaces
- [x] No proprietary paste
- [x] Topics use `vp.offline.sync.*` only

## Notes

Deps: none (protocol + catalog stubs). UI mount deferred to T230 / follow-up.
