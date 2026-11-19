import type { Asset } from "../types/domain";

/**
 * Schematic corridor layout for the map page. The registry has no lon/lat yet,
 * so known demo ids get fixture coordinates and anything else is placed by a
 * stable hash. Units are an abstract 1000 × 620 plan, not WGS84.
 */
export const MAP_W = 1000;
export const MAP_H = 620;

export type Pt = { x: number; y: number };
type Ref = string | Pt;

const FIXTURE: Record<string, Pt> = {
  "ast-sub-01": { x: 120, y: 330 },
  "ast-sub-02": { x: 890, y: 200 },
  "ast-tower-01": { x: 330, y: 240 },
  "ast-tower-03": { x: 560, y: 180 },
  "ast-tower-02": { x: 420, y: 470 },
  "ast-feeder-01": { x: 300, y: 100 },
  "ast-feeder-02": { x: 690, y: 90 },
  "ast-feeder-03": { x: 700, y: 548 },
};

const ROUTES: Record<string, Ref[]> = {
  "ast-line-01": ["ast-sub-01", "ast-tower-01", "ast-tower-03", "ast-sub-02"],
  "ast-line-02": [
    "ast-sub-01",
    "ast-tower-02",
    { x: 640, y: 520 },
    { x: 790, y: 400 },
    "ast-sub-02",
  ],
};

const SPAN_ENDS: Record<string, [Ref, Ref]> = {
  "ast-span-01": ["ast-tower-01", "ast-tower-03"],
  "ast-span-02": ["ast-tower-02", { x: 640, y: 520 }],
};

const FEEDER_ANCHOR: Record<string, Ref> = {
  "ast-feeder-01": "ast-tower-01",
  "ast-feeder-02": "ast-tower-03",
  "ast-feeder-03": { x: 640, y: 520 },
};

export type GeoRoute = { asset: Asset; pts: Pt[] };
export type GeoLink = {
  id: string;
  kind: "feeder" | "span";
  from: Pt;
  to: Pt;
};
export type GeoModel = {
  nodes: Map<string, Pt>;
  routes: GeoRoute[];
  links: GeoLink[];
};

function hashUnit(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function hashed(id: string): Pt {
  return {
    x: 90 + hashUnit(id, 1) * (MAP_W - 180),
    y: 70 + hashUnit(id, 2) * (MAP_H - 140),
  };
}

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const dist2 = (a: Pt, b: Pt) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function buildGeo(assets: Asset[]): GeoModel {
  const byId = new Map(assets.map((a) => [a.id, a]));
  const nodes = new Map<string, Pt>();

  // Pass 1: point-like assets (towers, substations, feeders, unknown kinds).
  for (const a of assets) {
    if (a.kind === "line" || a.kind === "span") continue;
    nodes.set(a.id, FIXTURE[a.id] ?? hashed(a.id));
  }

  const resolve = (ref: Ref | undefined): Pt | undefined =>
    ref === undefined ? undefined : typeof ref === "string" ? nodes.get(ref) : ref;

  // Pass 2: line routes (fixture, else the line's placed towers west → east).
  const routes: GeoRoute[] = [];
  for (const a of assets) {
    if (a.kind !== "line") continue;
    const fixed = ROUTES[a.id]?.map(resolve).filter((p): p is Pt => !!p);
    const pts =
      fixed && fixed.length >= 2
        ? fixed
        : assets
            .filter((c) => c.parent_id === a.id && c.kind === "tower")
            .map((c) => nodes.get(c.id)!)
            .sort((p, q) => p.x - q.x);
    if (pts.length >= 2) {
      routes.push({ asset: a, pts });
      const k = Math.floor((pts.length - 1) / 2);
      nodes.set(a.id, mid(pts[k], pts[k + 1]));
    } else {
      nodes.set(a.id, hashed(a.id));
    }
  }

  // Pass 3: spans + feeder branches.
  const links: GeoLink[] = [];
  for (const a of assets) {
    if (a.kind === "span") {
      const ends = SPAN_ENDS[a.id];
      const from = resolve(ends?.[0]) ?? (a.parent_id ? nodes.get(a.parent_id) : undefined) ?? hashed(a.id);
      const to = resolve(ends?.[1]) ?? { x: from.x + 70, y: from.y + 36 };
      links.push({ id: a.id, kind: "span", from, to });
      nodes.set(a.id, mid(from, to));
    } else if (a.kind === "feeder") {
      const own = nodes.get(a.id)!;
      let from = resolve(FEEDER_ANCHOR[a.id]);
      const parent = a.parent_id ? byId.get(a.parent_id) : undefined;
      if (!from && parent) {
        const route = routes.find((r) => r.asset.id === parent.id);
        from = route
          ? route.pts.reduce((best, p) => (dist2(p, own) < dist2(best, own) ? p : best))
          : nodes.get(parent.id);
      }
      if (from) links.push({ id: a.id, kind: "feeder", from, to: own });
    }
  }

  return { nodes, routes, links };
}
