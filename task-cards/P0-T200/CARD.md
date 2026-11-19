# P0-T200 — Digital-twin lite map stub (`packages/geo-map`)

| Field | Value |
|-------|-------|
| Status | `done` |
| Plan | `task-plans/2026-11-18-gate0-and-p0-spine.md` + W05 in `local-notes/05-roadmap-assumptions/06-master-execution-plan.md` |
| Parallel | `ok` vs pulse-web / contracts / compose (packages only) |
| Branch | `vp/P0-T200-geo-map` |
| Deps | — |

## Objective

Ship `packages/geo-map`: GeoJSON helpers for feeder/span asset points plus a simple static HTML/SVG map stub from asset coordinates — thin W05 digital-twin lite map without full GIS or pulse-web edits.

## Input docs

- `docs/architecture.md`
- `docs/anti-leak.md`
- `docs/repo-structure.md`
- `docs/product/feature-catalog.md` (A01–A03 geo)
- W05 note: digital-twin lite map = corridor awareness without full GIS rewrite

## Allowed paths

- `packages/geo-map/**`
- `task-cards/P0-T200/**`

Do **not** edit `apps/pulse-web/**` (T170 / other UI owners). Do not touch Compose, contracts ownership, or `local-notes/Trinetra-POC/**`.

## Acceptance criteria

- [x] Package `@voltpulse/geo-map` exists under `packages/geo-map/` with README
- [x] GeoJSON helpers: asset point → Point Feature; span → LineString Feature; feeder FeatureCollection
- [x] Static HTML/SVG map stub renders from asset coords (no external map tiles required)
- [x] Unit tests cover helpers + SVG projection smoke
- [x] Sample fixture is synthetic demo data (no real customer corridors)
- [x] Anti-leak clean (VoltPulse names only; no proprietary paste)
- [x] Evidence under `./evidence/`

## Validation

```bash
cd packages/geo-map
node --test --experimental-strip-types tests/*.test.ts
node --experimental-strip-types scripts/render-stub.mjs
test -f stub/map.html
rg -ni 'trinetra|t-netra|tnetra' packages/geo-map --glob '!**/tests/**' && exit 1 || true
```

Logged: 8 tests pass; `stub/map.html` features=6; anti-leak clean.

## Evidence

Write under `./evidence/` (commands + short output).

Logged: `./evidence/01-geo-map-stub.md`.

## Anti-leak

- [x] VoltPulse package name `@voltpulse/geo-map` only
- [x] No proprietary GIS/UI chrome paste
- [x] Fixture coords labeled demo / synthetic

## Notes

- Packages-only card. pulse-web can import later.
- Before explore: `graphify query "geo-map GeoJSON map"`.
