# @voltpulse/geo-map

Thin **W05 digital-twin lite** helpers for VoltPulse: GeoJSON from feeder/span asset coords, plus a static HTML/SVG map stub (no tile server, no full GIS).

## Layout

```
geo-map/
  src/           # types, GeoJSON, SVG/HTML render
  fixtures/      # synthetic demo assets (not real corridors)
  stub/          # generated static map.html
  tests/
  scripts/render-stub.mjs
```

## API (stub)

| Helper | Output |
|--------|--------|
| `pointFeature(asset)` | GeoJSON `Point` Feature |
| `lineFeature(span)` | GeoJSON `LineString` Feature |
| `feederFeatureCollection(points, spans, feederId?)` | FeatureCollection |
| `renderMapSvg(collection, opts?)` | SVG string |
| `renderMapHtml(collection, opts?)` | Standalone HTML wrapping SVG |

## Run

```bash
npm test
npm run render-stub   # writes stub/map.html
```

Consumers (e.g. `pulse-web`) import later — this package stays UI-agnostic.
