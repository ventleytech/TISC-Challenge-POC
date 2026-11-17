# P0-T200 evidence — `@voltpulse/geo-map` stub

Date: 2026-11-18  
Branch: `vp/P0-T200-geo-map`  
Host: worktree `/home/ubuntu/voltpulse-P0-T200`

## Package tree

```
packages/geo-map/
  package.json
  README.md
  src/{types,geojson,map-svg,index}.ts
  fixtures/demo-feeder.json   # synthetic demo coords
  stub/map.html               # static SVG HTML stub
  tests/{geojson,map-svg}.test.ts
  scripts/render-stub.mjs
```

## Validation commands

```bash
cd packages/geo-map
npm test
# → 8 pass, 0 fail

npm run render-stub
# → wrote stub/map.html features=6

rg -ni 'trinetra|t-netra|tnetra' packages/geo-map --glob '!**/tests/**'
# → no matches (ANTI_LEAK_OK)
```

## Smoke notes

- `feederFeatureCollection` for `vp-demo-feeder-01` → 4 points + 2 spans = 6 features
- SVG contains `<polyline>` spans + `<circle>` towers/feeder; title VoltPulse
- Fixture labeled synthetic / not a real corridor

## Anti-leak

- Package `@voltpulse/geo-map`, VoltPulse naming only
- No proprietary GIS/UI paste; no pulse-web edits
