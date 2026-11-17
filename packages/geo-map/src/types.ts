/** VoltPulse asset kinds used by the lite map stub. */
export type AssetKind = 'feeder' | 'span' | 'tower' | 'line' | 'substation';

export interface LonLat {
  lon: number;
  lat: number;
}

/** Point asset with WGS84 lon/lat (demo fixtures only until registry lands). */
export interface AssetPoint {
  id: string;
  kind: AssetKind;
  lon: number;
  lat: number;
  name?: string;
  feederId?: string;
  criticality?: number;
}

/** Span polyline between towers / suspension points. */
export interface SpanSegment {
  id: string;
  feederId: string;
  coordinates: LonLat[];
  name?: string;
}

export interface MapRenderOptions {
  width?: number;
  height?: number;
  padding?: number;
  title?: string;
}
