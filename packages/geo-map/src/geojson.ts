import type { AssetPoint, SpanSegment } from './types.ts';

export type GeoJsonGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] };

export interface GeoJsonFeature {
  type: 'Feature';
  id?: string;
  geometry: GeoJsonGeometry;
  properties: Record<string, unknown>;
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

/** Asset point → GeoJSON Point Feature (lon, lat order). */
export function pointFeature(asset: AssetPoint): GeoJsonFeature {
  if (!Number.isFinite(asset.lon) || !Number.isFinite(asset.lat)) {
    throw new Error(`asset ${asset.id}: lon/lat must be finite numbers`);
  }
  return {
    type: 'Feature',
    id: asset.id,
    geometry: {
      type: 'Point',
      coordinates: [asset.lon, asset.lat],
    },
    properties: {
      kind: asset.kind,
      name: asset.name ?? asset.id,
      feederId: asset.feederId ?? null,
      criticality: asset.criticality ?? null,
    },
  };
}

/** Span segment → GeoJSON LineString Feature. */
export function lineFeature(span: SpanSegment): GeoJsonFeature {
  if (!span.coordinates || span.coordinates.length < 2) {
    throw new Error(`span ${span.id}: need ≥2 coordinates`);
  }
  for (const c of span.coordinates) {
    if (!Number.isFinite(c.lon) || !Number.isFinite(c.lat)) {
      throw new Error(`span ${span.id}: lon/lat must be finite numbers`);
    }
  }
  return {
    type: 'Feature',
    id: span.id,
    geometry: {
      type: 'LineString',
      coordinates: span.coordinates.map((c) => [c.lon, c.lat]),
    },
    properties: {
      kind: 'span',
      name: span.name ?? span.id,
      feederId: span.feederId,
    },
  };
}

/**
 * Build a FeatureCollection for a feeder (or all assets when feederId omitted).
 */
export function feederFeatureCollection(
  points: AssetPoint[],
  spans: SpanSegment[],
  feederId?: string,
): GeoJsonFeatureCollection {
  const pts = feederId
    ? points.filter((p) => p.feederId === feederId || p.id === feederId)
    : points;
  const lines = feederId ? spans.filter((s) => s.feederId === feederId) : spans;

  return {
    type: 'FeatureCollection',
    features: [...pts.map(pointFeature), ...lines.map(lineFeature)],
  };
}
