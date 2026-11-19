import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EvidenceThumb } from "../components/EvidenceThumb";
import { RingGauge } from "../components/RingGauge";
import { formatClock, slaTone, useNow } from "../components/sla";
import {
  listAlerts,
  listAssets,
  listEvidence,
  listFindings,
  listInspections,
  liveApiEnabled,
} from "../mock/client";
import { MAP_H, MAP_W, buildGeo, type Pt } from "../mock/geo";
import {
  ASSET_KINDS,
  DETECTION_CLASSES,
  type Alert,
  type Asset,
  type AssetKind,
  type DetectionClass,
  type EvidenceObject,
  type Finding,
  type Inspection,
} from "../types/domain";

type HeatMode = "risk" | "criticality";
type View = { x: number; y: number; w: number };

const MIN_W = 220;
const pretty = (s: string) => s.replace(/_/g, " ");
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const hOf = (w: number) => (w * MAP_H) / MAP_W;

const CLASS_LABEL: Record<DetectionClass, string> = {
  corrosion: "Corrosion",
  crack: "Crack",
  vegetation: "Vegetation",
  thermal_hotspot: "Thermal hotspot",
  sag: "Sag",
};

const KIND_LABEL: Record<AssetKind, string> = {
  substation: "Substations",
  line: "Lines",
  feeder: "Feeders",
  tower: "Towers",
  span: "Spans",
};

const CRIT_COLOR: Record<string, string> = {
  critical: "#ff5a3c",
  high: "#ff9a3c",
  medium: "#e8c04a",
  low: "#5fcf7e",
};

function riskColor(risk: number): string {
  if (risk >= 75) return "#ff5a3c";
  if (risk >= 50) return "#ff9a3c";
  if (risk >= 25) return "#e8c04a";
  if (risk > 0) return "#5fcf7e";
  return "#2a9aad";
}

type Heat = {
  findings: Finding[];
  alerts: Alert[];
  own: number;
  roll: number;
  rollAlerts: number;
};

function Glyph({ kind }: { kind: AssetKind }) {
  switch (kind) {
    case "substation":
      return (
        <>
          <rect x="-12" y="-12" width="24" height="24" rx="4" className="mpx-g" />
          <path d="M-3 -7 L4 -7 L-1 0 L5 0 L-4 8 L-1 1 L-6 1 Z" className="mpx-g__ink" />
        </>
      );
    case "tower":
      return (
        <>
          <path d="M0 -13 L10 11 L-10 11 Z" className="mpx-g" />
          <path d="M-5 2 H5 M-7.5 7 H7.5" className="mpx-g__ink" />
        </>
      );
    case "feeder":
      return (
        <>
          <circle r="10" className="mpx-g" />
          <circle r="3.4" className="mpx-g__ink mpx-g__dot" />
        </>
      );
    case "span":
      return <path d="M0 -6 L6 0 L0 6 L-6 0 Z" className="mpx-g" />;
    default:
      return <circle r="6" className="mpx-g" />;
  }
}

export function MapPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("asset");

  const [assets, setAssets] = useState<Asset[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [evidence, setEvidence] = useState<EvidenceObject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const [layers, setLayers] = useState<Set<AssetKind>>(new Set(ASSET_KINDS));
  const [classId, setClassId] = useState<DetectionClass | "">("");
  const [heatMode, setHeatMode] = useState<HeatMode>(() => {
    try {
      const v = localStorage.getItem("vp.map_heat");
      return v === "criticality" || v === "risk" ? v : "risk";
    } catch {
      return "risk";
    }
  });
  const [pulses, setPulses] = useState(() => {
    try {
      return localStorage.getItem("vp.map_pulses") !== "0";
    } catch {
      return true;
    }
  });
  const [labels, setLabels] = useState(false);
  const [q, setQ] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, w: MAP_W });
  const now = useNow(1000);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewRef = useRef(view);
  const raf = useRef(0);
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean } | null>(null);
  const lastMoved = useRef(false);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [a, f, al, i, e] = await Promise.all([
          listAssets({}),
          listFindings(),
          listAlerts({}),
          listInspections({}),
          listEvidence({}),
        ]);
        if (cancelled) return;
        setAssets(a.items);
        setFindings(f.items);
        setAlerts(al.items);
        setInspections(i.items);
        setEvidence(e.items);
        setError(null);
        setLoaded(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load map data");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const geo = useMemo(() => buildGeo(assets), [assets]);
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const heat = useMemo(() => {
    const m = new Map<string, Heat>();
    const slot = (id: string): Heat => {
      let h = m.get(id);
      if (!h) {
        h = { findings: [], alerts: [], own: 0, roll: 0, rollAlerts: 0 };
        m.set(id, h);
      }
      return h;
    };
    const walkUp = (assetId: string, risk: number, alerts: number) => {
      const seen = new Set<string>();
      let cur: string | null | undefined = assetId;
      while (cur && !seen.has(cur)) {
        seen.add(cur);
        const h = slot(cur);
        h.roll = Math.max(h.roll, risk);
        h.rollAlerts += alerts;
        cur = byId.get(cur)?.parent_id;
      }
    };
    const fAsset = new Map<string, string>();
    for (const f of findings) {
      fAsset.set(f.id, f.asset_id);
      if (classId && f.class_id !== classId) continue;
      const h = slot(f.asset_id);
      h.findings.push(f);
      h.own = Math.max(h.own, f.risk_score);
      walkUp(f.asset_id, f.risk_score, 0);
    }
    for (const a of alerts) {
      if (a.ack_at) continue;
      const assetId = fAsset.get(a.finding_id);
      if (!assetId) continue;
      const f = findings.find((x) => x.id === a.finding_id);
      if (classId && f?.class_id !== classId) continue;
      slot(assetId).alerts.push(a);
      walkUp(assetId, 0, 1);
    }
    return m;
  }, [findings, alerts, classId, byId]);

  const classCounts = useMemo(() => {
    const m = new Map<DetectionClass, number>();
    for (const f of findings) m.set(f.class_id, (m.get(f.class_id) ?? 0) + 1);
    return m;
  }, [findings]);

  const kindCounts = useMemo(() => {
    const m = new Map<AssetKind, number>();
    for (const a of assets) m.set(a.kind, (m.get(a.kind) ?? 0) + 1);
    return m;
  }, [assets]);

  const needle = q.trim().toLowerCase();
  const matches = useCallback(
    (a: Asset) =>
      !needle ||
      a.name.toLowerCase().includes(needle) ||
      a.id.toLowerCase().includes(needle) ||
      (a.circuit ?? "").toLowerCase().includes(needle),
    [needle],
  );

  const colorOf = useCallback(
    (a: Asset): string =>
      heatMode === "criticality"
        ? CRIT_COLOR[a.criticality ?? "low"]
        : riskColor(heat.get(a.id)?.roll ?? 0),
    [heat, heatMode],
  );

  const ranked = useMemo(
    () =>
      assets
        .map((a) => ({ a, h: heat.get(a.id) }))
        .filter((r) => r.h && r.h.roll > 0)
        .sort(
          (x, y) =>
            y.h!.roll - x.h!.roll || y.h!.findings.length - x.h!.findings.length,
        )
        .slice(0, 7),
    [assets, heat],
  );

  const stats = useMemo(() => {
    const hot = assets.filter((a) => (heat.get(a.id)?.own ?? 0) >= 50).length;
    const elevated = assets.filter(
      (a) => a.criticality === "critical" || a.criticality === "high",
    ).length;
    const open = alerts.filter((a) => !a.ack_at).length;
    return { hot, elevated, open };
  }, [assets, heat, alerts]);

  /* —— camera —— */
  const flyTo = useCallback((pt: Pt, w: number) => {
    cancelAnimationFrame(raf.current);
    const from = viewRef.current;
    const tw = clamp(w, MIN_W, MAP_W);
    const to = { x: pt.x - tw / 2, y: pt.y - hOf(tw) / 2, w: tw };
    const t0 = performance.now();
    const run = (t: number) => {
      const k = Math.min(1, (t - t0) / 650);
      const e = 1 - Math.pow(1 - k, 3);
      setView({
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e,
      });
      if (k < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
  }, []);

  const zoomAt = useCallback((factor: number, fx = 0.5, fy = 0.5) => {
    setView((v) => {
      const w = clamp(v.w * factor, MIN_W, MAP_W);
      const px = v.x + fx * v.w;
      const py = v.y + fy * hOf(v.w);
      return {
        w,
        x: clamp(px - fx * w, -120, MAP_W + 120 - w),
        y: clamp(py - fy * hOf(w), -120, MAP_H + 120 - hOf(w)),
      };
    });
  }, []);

  const fit = useCallback(() => {
    cancelAnimationFrame(raf.current);
    flyTo({ x: MAP_W / 2, y: MAP_H / 2 }, MAP_W);
  }, [flyTo]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(raf.current);
      const r = el.getBoundingClientRect();
      zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      const el = svgRef.current;
      if (!d || !el) return;
      if (Math.hypot(e.clientX - d.px, e.clientY - d.py) > 4) d.moved = true;
      if (!d.moved) return;
      const r = el.getBoundingClientRect();
      const k = viewRef.current.w / r.width;
      setView((v) => ({
        w: v.w,
        x: clamp(d.vx - (e.clientX - d.px) * k, -120, MAP_W + 120 - v.w),
        y: clamp(d.vy - (e.clientY - d.py) * k, -120, MAP_H + 120 - hOf(v.w)),
      }));
    };
    const up = () => {
      lastMoved.current = drag.current?.moved ?? false;
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    cancelAnimationFrame(raf.current);
    lastMoved.current = false;
    const v = viewRef.current;
    drag.current = { px: e.clientX, py: e.clientY, vx: v.x, vy: v.y, moved: false };
  };

  /* —— selection —— */
  const select = useCallback(
    (id: string | null) => setParams(id ? { asset: id } : {}, { replace: true }),
    [setParams],
  );
  /** Canvas-originated picks ignore the click that ends a pan drag. */
  const pick = useCallback(
    (id: string | null) => {
      if (!lastMoved.current) select(id);
    },
    [select],
  );

  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  useEffect(() => {
    if (!selectedId) return;
    const pt = geo.nodes.get(selectedId);
    if (pt) flyTo(pt, Math.min(viewRef.current.w, 480));
  }, [selectedId, geo, flyTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "Escape") select(null);
      else if (e.key === "+" || e.key === "=") zoomAt(1 / 1.3);
      else if (e.key === "-") zoomAt(1.3);
      else if (e.key === "0") fit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [select, zoomAt, fit]);

  const onSearchKey = (key: string) => {
    if (key !== "Enter") return;
    const hit = assets.find((a) => layers.has(a.kind) && matches(a));
    if (hit) select(hit.id);
  };

  const toggleLayer = (k: AssetKind) =>
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  /* —— selected detail —— */
  const selHeat = selected ? heat.get(selected.id) : undefined;
  const selParent = selected?.parent_id ? byId.get(selected.parent_id) : undefined;
  const selChildren = useMemo(
    () => (selected ? assets.filter((a) => a.parent_id === selected.id) : []),
    [assets, selected],
  );
  const selInspections = useMemo(
    () =>
      selected
        ? inspections.filter(
          (i) =>
            i.asset_ids.includes(selected.id) ||
            selChildren.some((c) => i.asset_ids.includes(c.id)),
        )
        : [],
    [inspections, selected, selChildren],
  );
  const selEvidence = useMemo(
    () =>
      selected
        ? evidence
          .filter(
            (e) =>
              e.asset_id === selected.id ||
              (e.finding_id && selHeat?.findings.some((f) => f.id === e.finding_id)),
          )
          .slice(0, 4)
        : [],
    [evidence, selected, selHeat],
  );

  const live = liveApiEnabled();
  const s = view.w / MAP_W;
  const h = hOf(view.w);
  const labelFor = (a: Asset) =>
    labels ||
    a.id === selectedId ||
    a.id === hover ||
    a.kind === "substation" ||
    a.kind === "line" ||
    view.w < 560;

  const visibleAssets = assets.filter((a) => layers.has(a.kind));
  const ORDER: AssetKind[] = ["line", "span", "feeder", "tower", "substation"];
  const drawOrder = [...visibleAssets].sort(
    (a, b) =>
      (a.id === selectedId ? 9 : ORDER.indexOf(a.kind)) -
      (b.id === selectedId ? 9 : ORDER.indexOf(b.kind)),
  );
  const classTotal = [...classCounts.values()].reduce((x, y) => x + y, 0);

  return (
    <section className="page-view mpx">
      <header className="corridor-hero">
        <div className="evx-hero__mesh" aria-hidden="true" />
        <div className="evx-hero__copy">
          <p className="evx-eyebrow">TPulse · corridor map</p>
          <h1 className="evx-title">
            Corridor map
          </h1>
          <p className="evx-sub">
            Substations, lines, feeders and towers coloured by their worst open
            finding. Pulsing rings mark unacknowledged alerts. Click any asset to
            fly in and open its record.
          </p>
          <div className="evx-hero__actions">
            <span className={`evx-source evx-source--${live ? "live" : "mock"}`}>
              <i aria-hidden="true" />
              {live ? "Live · pulse-api" : "Mock registry · offline"}
            </span>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setTick((n) => n + 1)}
            >
              Refresh
            </button>
            <Link className="btn-outline" to="/alerts">
              Alerts
            </Link>
            <Link className="btn-outline" to="/assets">
              Registry
            </Link>
          </div>
        </div>
        <div className="evx-metrics" aria-label="Map summary">
          <div className="evx-metric">
            <span className="evx-metric__n">{assets.length}</span>
            <span className="evx-metric__l">Assets mapped</span>
          </div>
          <div className="evx-metric">
            <span className="evx-metric__n">{stats.elevated}</span>
            <span className="evx-metric__l">Critical / high</span>
          </div>
          <div className="evx-metric evx-metric--bad">
            <span className="evx-metric__n">{stats.hot}</span>
            <span className="evx-metric__l">Hot (risk ≥ 50)</span>
          </div>
          <div className="evx-metric evx-metric--warn">
            <span className="evx-metric__n">{stats.open}</span>
            <span className="evx-metric__l">Open alerts</span>
          </div>
          <div className="evx-mix" role="group" aria-label="Finding class mix">
            <div className="evx-mix__bar">
              {DETECTION_CLASSES.filter((c) => classCounts.has(c)).map((c) => (
                <button
                  key={c}
                  type="button"
                  data-class={c}
                  title={`${CLASS_LABEL[c]} · ${classCounts.get(c)}`}
                  className={`evx-mix__seg${classId === c ? " selected" : ""}`}
                  style={{ flexGrow: classCounts.get(c) }}
                  onClick={() => setClassId(classId === c ? "" : c)}
                />
              ))}
              {classTotal === 0 ? <span className="evx-mix__empty" /> : null}
            </div>
            <p className="evx-mix__cap">
              {classId
                ? `Heat filtered to ${CLASS_LABEL[classId]}`
                : `${classTotal} findings drive the heat`}
            </p>
          </div>
        </div>
      </header>

      <div className="evx-toolbar" role="group" aria-label="Map layers">
        <div className="evx-pills">
          {ASSET_KINDS.filter((k) => kindCounts.has(k)).map((k) => (
            <button
              key={k}
              type="button"
              data-kind={k}
              className={`evx-pill mpx-layer${layers.has(k) ? " selected" : ""}`}
              onClick={() => toggleLayer(k)}
              aria-pressed={layers.has(k)}
            >
              <svg viewBox="-14 -14 28 28" width="14" height="14" aria-hidden="true" className="mpx-layer__g">
                <Glyph kind={k} />
              </svg>
              {KIND_LABEL[k]} <b>{kindCounts.get(k)}</b>
            </button>
          ))}
        </div>
        <div className="evx-selects">
          <label>
            <span>Find asset</span>
            <input
              className="filters__select alx-search"
              type="search"
              placeholder="name, circuit, id — Enter to fly"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => onSearchKey(e.key)}
            />
          </label>
          <label>
            <span>Colour by</span>
            <select
              className="filters__select"
              value={heatMode}
              onChange={(e) => {
                const next = e.target.value as HeatMode;
                setHeatMode(next);
                try {
                  localStorage.setItem("vp.map_heat", next);
                } catch {
                  /* */
                }
              }}
            >
              <option value="risk">Open-finding risk</option>
              <option value="criticality">Asset criticality</option>
            </select>
          </label>
          <label className="evx-toggle">
            <input
              type="checkbox"
              checked={pulses}
              onChange={(e) => {
                setPulses(e.target.checked);
                try {
                  localStorage.setItem("vp.map_pulses", e.target.checked ? "1" : "0");
                } catch {
                  /* */
                }
              }}
            />
            <span>Alert pulses</span>
          </label>
          <label className="evx-toggle">
            <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />
            <span>All labels</span>
          </label>
        </div>
      </div>

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="evx-stage mpx-stage">
        <div className="map-canvas">
          <svg
            ref={svgRef}
            className="mpx-svg"
            viewBox={`${view.x} ${view.y} ${view.w} ${h}`}
            role="img"
            aria-label="Schematic corridor map"
            onPointerDown={onPointerDown}
            onClick={() => pick(null)}
          >
            <defs>
              <pattern id="mpx-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M50 0H0V50" className="mpx-grid" />
              </pattern>
              <radialGradient id="mpx-glow-a" cx="22%" cy="55%" r="45%">
                <stop offset="0%" stopColor="#2a9aad" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#2a9aad" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="mpx-glow-b" cx="85%" cy="30%" r="40%">
                <stop offset="0%" stopColor="#5b43d9" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#5b43d9" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x="-400" y="-400" width={MAP_W + 800} height={MAP_H + 800} className="mpx-bg" />
            <rect x="-400" y="-400" width={MAP_W + 800} height={MAP_H + 800} fill="url(#mpx-glow-a)" />
            <rect x="-400" y="-400" width={MAP_W + 800} height={MAP_H + 800} fill="url(#mpx-glow-b)" />
            <rect x="-400" y="-400" width={MAP_W + 800} height={MAP_H + 800} fill="url(#mpx-grid)" />

            {/* terrain contours + river — decorative, fresh paths */}
            <g className="mpx-terrain" aria-hidden="true">
              <path d="M-40 520 C120 470 260 560 420 520 C580 480 700 560 880 500 C960 478 1010 500 1040 490" />
              <path d="M-40 560 C140 520 280 600 440 566 C600 530 720 610 900 548 C970 526 1010 546 1040 538" />
              <path d="M-40 90 C140 130 260 40 420 80 C560 114 700 30 880 70 C960 90 1010 70 1040 80" />
              <path d="M-40 50 C150 96 270 6 430 40 C570 70 710 -6 890 30 C965 46 1010 30 1040 40" />
              <path d="M520 -40 C560 120 470 240 520 330 C570 420 500 540 560 660" className="mpx-river" />
            </g>

            {/* conductor routes */}
            {geo.routes.map(({ asset, pts }) => {
              if (!layers.has("line")) return null;
              const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
              const hv = Number.parseInt(asset.voltage_class ?? "", 10) >= 200;
              const dim = !matches(asset);
              return (
                <g
                  key={asset.id}
                  className={`mpx-route${asset.id === selectedId ? " is-selected" : ""}${dim ? " is-dim" : ""}`}
                  style={{ "--n": colorOf(asset) } as CSSProperties}
                >
                  <path d={d} className={`mpx-route__base${hv ? " is-hv" : ""}`} />
                  <path d={d} className="mpx-route__flow" />
                  <path
                    d={d}
                    className="mpx-route__hit"
                    onClick={(e) => {
                      e.stopPropagation();
                      pick(asset.id);
                    }}
                    onPointerEnter={() => setHover(asset.id)}
                    onPointerLeave={() => setHover(null)}
                  />
                </g>
              );
            })}

            {/* feeder + span branches */}
            {geo.links.map((l) => {
              const a = byId.get(l.id);
              if (!a || !layers.has(a.kind)) return null;
              return (
                <g
                  key={l.id}
                  className={`mpx-link mpx-link--${l.kind}${l.id === selectedId ? " is-selected" : ""}${matches(a) ? "" : " is-dim"}`}
                  style={{ "--n": colorOf(a) } as CSSProperties}
                >
                  <line x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} />
                  {l.kind === "span" ? (
                    <line
                      x1={l.from.x}
                      y1={l.from.y}
                      x2={l.to.x}
                      y2={l.to.y}
                      className="mpx-link__hit"
                      onClick={(e) => {
                        e.stopPropagation();
                        pick(a.id);
                      }}
                    />
                  ) : null}
                </g>
              );
            })}

            {/* nodes */}
            {drawOrder.map((a) => {
              const pt = geo.nodes.get(a.id);
              if (!pt) return null;
              const hh = heat.get(a.id);
              const dim = !matches(a) || (classId !== "" && (hh?.roll ?? 0) === 0);
              const isSel = a.id === selectedId;
              const alerting = pulses && (hh?.rollAlerts ?? 0) > 0;
              return (
                <g
                  key={a.id}
                  transform={`translate(${pt.x} ${pt.y}) scale(${s})`}
                  className={`mpx-node mpx-node--${a.kind}${isSel ? " is-selected" : ""}${dim ? " is-dim" : ""}`}
                  style={{ "--n": colorOf(a) } as CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    pick(a.id);
                  }}
                  onPointerEnter={() => setHover(a.id)}
                  onPointerLeave={() => setHover(null)}
                >
                  {alerting ? <circle r="16" className="mpx-ping" /> : null}
                  {isSel ? <circle r="21" className="mpx-sel" /> : null}
                  {a.kind === "line" ? (
                    <g className="mpx-linepill">
                      <rect x="-30" y="-10" width="60" height="20" rx="10" />
                      <text y="4" textAnchor="middle">
                        {a.voltage_class ?? "line"}
                      </text>
                    </g>
                  ) : (
                    <Glyph kind={a.kind} />
                  )}
                  {(hh?.findings.length ?? 0) > 0 && a.kind !== "line" ? (
                    <g className="mpx-badge" transform="translate(11 -11)">
                      <circle r="7" />
                      <text y="3" textAnchor="middle">
                        {hh!.findings.length}
                      </text>
                    </g>
                  ) : null}
                  {labelFor(a) && a.kind !== "line" ? (
                    <text y={a.kind === "tower" ? 26 : 28} textAnchor="middle" className="mpx-label">
                      {a.name}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          <div className="mpx-hud mpx-hud--tl" aria-hidden="true">
            <span className="mpx-hud__tag">schematic plan · demo fixture coordinates</span>
          </div>
          <div className="mpx-hud mpx-hud--zoom">
            <button type="button" onClick={() => zoomAt(1 / 1.3)} aria-label="Zoom in">
              +
            </button>
            <button type="button" onClick={() => zoomAt(1.3)} aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={fit} aria-label="Fit corridor" className="mpx-hud__fit">
              fit
            </button>
          </div>
          <div className="mpx-hud mpx-hud--legend" aria-label="Legend">
            {heatMode === "risk" ? (
              <>
                <span className="mpx-hud__k">risk</span>
                <i style={{ background: riskColor(0) }} /> none
                <i style={{ background: riskColor(10) }} /> low
                <i style={{ background: riskColor(30) }} /> mid
                <i style={{ background: riskColor(60) }} /> high
                <i style={{ background: riskColor(90) }} /> critical
              </>
            ) : (
              <>
                <span className="mpx-hud__k">criticality</span>
                {Object.entries(CRIT_COLOR)
                  .reverse()
                  .map(([k, c]) => (
                    <span key={k}>
                      <i style={{ background: c }} /> {k}
                    </span>
                  ))}
              </>
            )}
            {pulses ? (
              <span>
                <i className="mpx-hud__ping" /> open alert
              </span>
            ) : null}
          </div>
          <div className="mpx-hud mpx-hud--zoomread mono" aria-hidden="true">
            {(MAP_W / view.w).toFixed(1)}×
          </div>
          {!loaded && !error ? <p className="mpx-loading">Loading corridor…</p> : null}
        </div>

        <aside className="evx-inspector mpx-inspector" aria-label="Asset inspector">
          {selected ? (
            <div
              key={selected.id}
              className="evx-inspector__in"
              data-crit={selected.criticality}
              style={{ "--n": colorOf(selected) } as CSSProperties}
            >
              <div className="mpx-focus">
                <RingGauge
                  value={(selHeat?.roll ?? 0) / 100}
                  size={104}
                  stroke={8}
                  tone={
                    (selHeat?.roll ?? 0) >= 75
                      ? "breach"
                      : (selHeat?.roll ?? 0) >= 40
                        ? "warn"
                        : (selHeat?.roll ?? 0) > 0
                          ? "volt"
                          : "steel"
                  }
                  label={selHeat?.roll ? String(selHeat.roll) : "—"}
                  sub="peak risk"
                />
                <div>
                  <span className="mpx-kind">{selected.kind}</span>
                  <h2>{selected.name}</h2>
                  <p className="mono">{selected.id}</p>
                </div>
                <button
                  type="button"
                  className="mpx-close"
                  onClick={() => select(null)}
                  aria-label="Clear selection"
                >
                  ×
                </button>
              </div>

              <dl className="evx-facts">
                <div>
                  <dt>Criticality</dt>
                  <dd>
                    {selected.criticality ? (
                      <span className={`badge badge--crit-${selected.criticality}`}>
                        {selected.criticality}
                      </span>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Voltage</dt>
                  <dd className="mono">{selected.voltage_class ?? "—"}</dd>
                </div>
                <div>
                  <dt>Circuit</dt>
                  <dd>{selected.circuit ?? "—"}</dd>
                </div>
                <div>
                  <dt>OEM · year</dt>
                  <dd>
                    {selected.oem ?? "—"} · {selected.install_year ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt>Parent</dt>
                  <dd>
                    {selParent ? (
                      <button type="button" className="mpx-linkbtn" onClick={() => select(selParent.id)}>
                        {selParent.name}
                      </button>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Children</dt>
                  <dd>
                    {selChildren.length === 0
                      ? "—"
                      : selChildren.slice(0, 3).map((c, i) => (
                        <span key={c.id}>
                          {i ? ", " : ""}
                          <button type="button" className="mpx-linkbtn" onClick={() => select(c.id)}>
                            {c.name}
                          </button>
                        </span>
                      ))}
                    {selChildren.length > 3 ? ` +${selChildren.length - 3}` : ""}
                  </dd>
                </div>
              </dl>

              {selHeat && selHeat.findings.length > 0 ? (
                <div className="inx-block">
                  <p className="alx-sub">Open findings</p>
                  <ul className="inx-flist">
                    {selHeat.findings.map((f) => (
                      <li key={f.id} data-class={f.class_id} title={f.recommendation}>
                        <i aria-hidden="true" />
                        <span>{pretty(f.class_id)}</span>
                        <span className={`badge badge--${f.severity}`}>{f.severity}</span>
                        <b className="mono">{f.risk_score}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selHeat && selHeat.alerts.length > 0 ? (
                <div className="inx-block">
                  <p className="alx-sub">Alerts on this asset</p>
                  <ul className="mpx-alerts">
                    {selHeat.alerts.map((a) => {
                      const ms = a.sla_due_at ? new Date(a.sla_due_at).getTime() - now : null;
                      return (
                        <li key={a.id} data-tone={slaTone(a.sla_due_at, now)}>
                          <span>{a.title}</span>
                          <b className="mono">
                            {ms == null ? "no SLA" : ms < 0 ? `+${formatClock(ms)}` : formatClock(ms)}
                          </b>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {selInspections.length > 0 ? (
                <div className="inx-block">
                  <p className="alx-sub">Inspections</p>
                  <ul className="mpx-insp">
                    {selInspections.slice(0, 4).map((i) => (
                      <li key={i.id}>
                        <span className="mono">{i.id}</span>
                        <span className={`chip chip--status-${i.status}`}>{pretty(i.status)}</span>
                        <span>{i.assignee ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selEvidence.length > 0 ? (
                <div className="alx-evid">
                  <p className="alx-sub">Evidence</p>
                  <ul>
                    {selEvidence.map((ev) => (
                      <li key={ev.id} data-class={ev.class_id ?? ev.kind}>
                        <EvidenceThumb ev={ev} className="alx-evid__img" />
                        <span>{ev.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="alx-actions">
                <Link className="btn-primary" to={`/assets/${selected.id}`}>
                  Asset record
                </Link>
                <Link className="btn btn--ghost btn--sm alx-ghost" to="/priority">
                  Priority
                </Link>
                <Link className="btn btn--ghost btn--sm alx-ghost" to="/alerts">
                  Alerts
                </Link>
              </div>
              <p className="evx-inspector__foot">Esc clears · +/− zoom · 0 fits · drag to pan</p>
            </div>
          ) : (
            <div className="mpx-rank">
              <p className="alx-sub">Hot assets</p>
              <h2>Where to look first</h2>
              <ol>
                {ranked.map(({ a, h: hh }, i) => (
                  <li key={a.id} style={{ animationDelay: `${i * 55}ms` }}>
                    <button
                      type="button"
                      style={{ "--n": colorOf(a) } as CSSProperties}
                      onClick={() => select(a.id)}
                    >
                      <span className="mpx-rank__n">{i + 1}</span>
                      <span className="mpx-rank__name">
                        {a.name}
                        <small>
                          {a.kind} · {hh!.findings.length} finding{hh!.findings.length === 1 ? "" : "s"}
                          {hh!.rollAlerts > 0 ? ` · ${hh!.rollAlerts} alert${hh!.rollAlerts === 1 ? "" : "s"}` : ""}
                        </small>
                      </span>
                      <span className="mpx-rank__bar">
                        <i style={{ width: `${hh!.roll}%` }} />
                      </span>
                      <b className="mono">{hh!.roll}</b>
                    </button>
                  </li>
                ))}
                {ranked.length === 0 ? (
                  <li className="mpx-rank__empty">
                    {loaded ? "No open findings in view." : "Loading…"}
                  </li>
                ) : null}
              </ol>
              <p className="evx-inspector__foot">Select a node or pick a row to fly in.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
