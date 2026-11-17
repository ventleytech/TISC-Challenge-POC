import type { GeoJsonFeatureCollection } from './geojson.ts';
import type { MapRenderOptions } from './types.ts';

interface BBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

function collectCoords(collection: GeoJsonFeatureCollection): [number, number][] {
  const out: [number, number][] = [];
  for (const f of collection.features) {
    if (f.geometry.type === 'Point') {
      out.push(f.geometry.coordinates);
    } else if (f.geometry.type === 'LineString') {
      out.push(...f.geometry.coordinates);
    }
  }
  return out;
}

export function boundingBox(collection: GeoJsonFeatureCollection): BBox {
  const coords = collectCoords(collection);
  if (coords.length === 0) {
    throw new Error('empty FeatureCollection: cannot compute bbox');
  }
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }
  // Degenerate single-point / zero-span: pad so SVG has room.
  if (minLon === maxLon) {
    minLon -= 0.001;
    maxLon += 0.001;
  }
  if (minLat === maxLat) {
    minLat -= 0.001;
    maxLat += 0.001;
  }
  return { minLon, minLat, maxLon, maxLat };
}

export function project(
  lon: number,
  lat: number,
  bbox: BBox,
  width: number,
  height: number,
  padding: number,
): { x: number; y: number } {
  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const x =
    padding + ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * innerW;
  // SVG y grows downward; flip lat so north is up.
  const y =
    padding +
    (1 - (lat - bbox.minLat) / (bbox.maxLat - bbox.minLat)) * innerH;
  return { x, y };
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Static SVG map from a GeoJSON FeatureCollection (no tiles). */
export function renderMapSvg(
  collection: GeoJsonFeatureCollection,
  opts: MapRenderOptions = {},
): string {
  const width = opts.width ?? 640;
  const height = opts.height ?? 400;
  const padding = opts.padding ?? 24;
  const title = opts.title ?? 'VoltPulse map stub';
  const bbox = boundingBox(collection);

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">`,
    `<title>${esc(title)}</title>`,
    `<rect width="100%" height="100%" fill="#f4f7f5"/>`,
  ];

  for (const f of collection.features) {
    if (f.geometry.type === 'LineString') {
      const pts = f.geometry.coordinates
        .map(([lon, lat]) => {
          const p = project(lon, lat, bbox, width, height, padding);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(' ');
      const name = esc(String(f.properties.name ?? f.id ?? 'span'));
      parts.push(
        `<polyline points="${pts}" fill="none" stroke="#1a5f4a" stroke-width="2" data-id="${esc(String(f.id ?? ''))}" data-kind="span"><title>${name}</title></polyline>`,
      );
    }
  }

  for (const f of collection.features) {
    if (f.geometry.type === 'Point') {
      const [lon, lat] = f.geometry.coordinates;
      const { x, y } = project(lon, lat, bbox, width, height, padding);
      const kind = String(f.properties.kind ?? 'point');
      const fill = kind === 'tower' ? '#c45c26' : '#0b3d91';
      const r = kind === 'tower' ? 5 : 7;
      const name = esc(String(f.properties.name ?? f.id ?? 'asset'));
      parts.push(
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" stroke="#fff" stroke-width="1.5" data-id="${esc(String(f.id ?? ''))}" data-kind="${esc(kind)}"><title>${name}</title></circle>`,
      );
    }
  }

  parts.push(`</svg>`);
  return parts.join('\n');
}

/** Standalone HTML document wrapping the SVG stub. */
export function renderMapHtml(
  collection: GeoJsonFeatureCollection,
  opts: MapRenderOptions = {},
): string {
  const title = opts.title ?? 'VoltPulse digital-twin lite map';
  const svg = renderMapSvg(collection, opts);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(title)}</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #e8eee9; color: #122;
           display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1.5rem; }
    h1 { font-size: 1.1rem; font-weight: 600; margin: 0; }
    .frame { background: #fff; padding: 0.5rem; border: 1px solid #c5d0c8; }
    .note { font-size: 0.8rem; color: #456; max-width: 40rem; text-align: center; }
  </style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <div class="frame">${svg}</div>
  <p class="note">Static SVG stub from @voltpulse/geo-map — synthetic demo coords, not a live GIS.</p>
</body>
</html>
`;
}
