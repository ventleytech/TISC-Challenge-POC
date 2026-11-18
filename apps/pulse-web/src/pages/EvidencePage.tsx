import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EvidenceArt } from "../components/EvidenceArt";
import { listEvidence, listInspections } from "../mock/client";
import type {
  DetectionClass,
  EvidenceKind,
  EvidenceObject,
} from "../types/domain";

const KINDS: Array<EvidenceKind | ""> = [
  "",
  "crop",
  "rgb_frame",
  "ir_frame",
  "clip",
  "report",
];
const RETENTIONS: Array<EvidenceObject["retention"] | ""> = [
  "",
  "hot",
  "warm",
  "expire",
  "legal_hold",
];

const CLASS_LABEL: Record<DetectionClass, string> = {
  corrosion: "Corrosion",
  crack: "Crack",
  vegetation: "Vegetation",
  thermal_hotspot: "Thermal hotspot",
  sag: "Sag",
};

/** Assumed source-frame size for the locator minimap (bbox is in frame px). */
const FRAME_W = 4096;
const FRAME_H = 3072;
/** Re-pull signed URLs before the 5-min server TTL lapses. */
const LIVE_REFRESH_MS = 240_000;

const pretty = (s: string) => s.replace(/_/g, " ");
const pct = (c?: number | null) =>
  c == null ? "—" : `${Math.round(c * 100)}%`;

function ConfRing({ value, size = 64 }: { value?: number | null; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  return (
    <svg
      className="evx-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`confidence ${pct(value)}`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} className="evx-ring__track" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="evx-ring__arc"
        strokeDasharray={`${c * v} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dy="0.34em" textAnchor="middle" className="evx-ring__n">
        {value == null ? "—" : Math.round(v * 100)}
      </text>
    </svg>
  );
}

/** Real signed-URL image when live; procedural art when mock or on load error. */
function EvidenceImage({ ev, className }: { ev: EvidenceObject; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showImg =
    ev.content_url && !failed && (ev.content_type ?? "").startsWith("image/");
  return showImg ? (
    <img
      className={className}
      src={ev.content_url ?? undefined}
      alt={ev.label}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <EvidenceArt ev={ev} className={className} />
  );
}

function Locator({ bbox }: { bbox: [number, number, number, number] }) {
  const [x, y, w, h] = bbox;
  return (
    <svg className="evx-locator" viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} role="img" aria-label="Crop position in source frame">
      <rect width={FRAME_W} height={FRAME_H} className="evx-locator__frame" />
      {[1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={(FRAME_W / 4) * i} y1="0" x2={(FRAME_W / 4) * i} y2={FRAME_H} className="evx-locator__grid" />
          <line x1="0" y1={(FRAME_H / 4) * i} x2={FRAME_W} y2={(FRAME_H / 4) * i} className="evx-locator__grid" />
        </g>
      ))}
      <line x1={x + w / 2} y1="0" x2={x + w / 2} y2={FRAME_H} className="evx-locator__cross" />
      <line x1="0" y1={y + h / 2} x2={FRAME_W} y2={y + h / 2} className="evx-locator__cross" />
      <rect x={x} y={y} width={Math.max(w, 120)} height={Math.max(h, 90)} className="evx-locator__box" />
    </svg>
  );
}

export function EvidencePage() {
  const [items, setItems] = useState<EvidenceObject[]>([]);
  const [source, setSource] = useState<"live" | "mock" | null>(null);
  const [inspectionIds, setInspectionIds] = useState<string[]>([]);
  const [inspectionId, setInspectionId] = useState("");
  const [kind, setKind] = useState<EvidenceKind | "">("");
  const [retention, setRetention] = useState<EvidenceObject["retention"] | "">("");
  const [classId, setClassId] = useState<DetectionClass | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);

  // Inspection dropdown = registry ∪ ids seen in evidence (live DB may be empty).
  useEffect(() => {
    let cancelled = false;
    void listInspections({}).then((res) => {
      if (!cancelled) {
        setInspectionIds((prev) =>
          [...new Set([...prev, ...res.items.map((i) => i.id)])].sort(),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listEvidence({ inspectionId, kind, retention });
        if (cancelled) return;
        setItems(res.items);
        setSource(res.source);
        setError(null);
        setInspectionIds((prev) =>
          [...new Set([...prev, ...res.items.map((e) => e.inspection_id)])].sort(),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load evidence");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inspectionId, kind, retention, tick]);

  useEffect(() => {
    if (source !== "live") return;
    const t = window.setInterval(() => setTick((n) => n + 1), LIVE_REFRESH_MS);
    return () => window.clearInterval(t);
  }, [source]);

  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        a.captured_at === b.captured_at
          ? a.id.localeCompare(b.id)
          : b.captured_at.localeCompare(a.captured_at),
      ),
    [items],
  );

  const classCounts = useMemo(() => {
    const m = new Map<DetectionClass, number>();
    for (const e of sorted) {
      if (e.class_id) m.set(e.class_id, (m.get(e.class_id) ?? 0) + 1);
    }
    return m;
  }, [sorted]);

  const visible = useMemo(
    () => (classId ? sorted.filter((e) => e.class_id === classId) : sorted),
    [sorted, classId],
  );

  const selected = useMemo(
    () => visible.find((e) => e.id === selectedId) ?? visible[0] ?? null,
    [visible, selectedId],
  );

  const stats = useMemo(() => {
    const confs = visible.flatMap((e) => (e.confidence == null ? [] : [e.confidence]));
    const avg = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null;
    const hot = visible.filter((e) => e.retention === "hot").length;
    const hold = visible.filter((e) => e.retention === "legal_hold").length;
    return { avg, hot, hold, crops: visible.filter((e) => e.kind === "crop").length };
  }, [visible]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!visible.length || !selected) return;
      const i = visible.findIndex((e) => e.id === selected.id);
      setSelectedId(visible[(i + dir + visible.length) % visible.length].id);
    },
    [visible, selected],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const copyUri = useCallback(() => {
    if (!selected?.object_key) return;
    void navigator.clipboard
      ?.writeText(selected.object_key)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => setCopied(false));
  }, [selected]);

  const live = source === "live";
  const classOrder = (Object.keys(CLASS_LABEL) as DetectionClass[]).filter((c) =>
    classCounts.has(c),
  );
  const classTotal = [...classCounts.values()].reduce((a, b) => a + b, 0);

  return (
    <section className="evx">
      <header className="evx-hero">
        <div className="evx-hero__mesh" aria-hidden="true" />
        <div className="evx-hero__copy">
          <p className="evx-eyebrow">VoltPulse · evidence vault</p>
          <h1 className="evx-title">
            Every finding, <em>on the record.</em>
          </h1>
          <p className="evx-sub">
            Detection crops and frames land in the object store, content-addressed
            per inspection, and reach this wall through short-lived signed URLs.
          </p>
          <div className="evx-hero__actions">
            <span className={`evx-source evx-source--${source ?? "pending"}`}>
              <i aria-hidden="true" />
              {source === null
                ? "Connecting…"
                : live
                  ? `Live · ${visible[0]?.backend ?? "store"}`
                  : "Mock store · offline"}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTick((n) => n + 1)}>
              Refresh
            </button>
            <Link className="btn btn--ghost btn--sm" to="/inspections">
              Inspections
            </Link>
          </div>
        </div>

        <div className="evx-metrics" aria-label="Evidence summary">
          <div className="evx-metric">
            <span className="evx-metric__n">{visible.length}</span>
            <span className="evx-metric__l">Objects in view</span>
          </div>
          <div className="evx-metric">
            <span className="evx-metric__n">{stats.crops}</span>
            <span className="evx-metric__l">Detection crops</span>
          </div>
          <div className="evx-metric">
            <span className="evx-metric__n">{pct(stats.avg)}</span>
            <span className="evx-metric__l">Mean confidence</span>
          </div>
          <div className="evx-metric evx-metric--warn">
            <span className="evx-metric__n">{stats.hold}</span>
            <span className="evx-metric__l">Legal hold</span>
          </div>
          <div className="evx-mix" role="group" aria-label="Class mix">
            <div className="evx-mix__bar">
              {classOrder.map((c) => (
                <button
                  key={c}
                  type="button"
                  data-class={c}
                  title={`${CLASS_LABEL[c]} · ${classCounts.get(c)}`}
                  className={`evx-mix__seg${classId === c ? " is-on" : ""}`}
                  style={{ flexGrow: classCounts.get(c) }}
                  onClick={() => setClassId(classId === c ? "" : c)}
                />
              ))}
              {classOrder.length === 0 ? <span className="evx-mix__empty" /> : null}
            </div>
            <p className="evx-mix__cap">
              {classTotal} classified · {stats.hot} hot
            </p>
          </div>
        </div>
      </header>

      <div className="evx-toolbar" role="group" aria-label="Evidence filters">
        <div className="evx-pills">
          <button
            type="button"
            className={`evx-pill${classId === "" ? " is-on" : ""}`}
            onClick={() => setClassId("")}
          >
            All <b>{sorted.length}</b>
          </button>
          {classOrder.map((c) => (
            <button
              key={c}
              type="button"
              data-class={c}
              className={`evx-pill${classId === c ? " is-on" : ""}`}
              onClick={() => setClassId(classId === c ? "" : c)}
            >
              <i aria-hidden="true" />
              {CLASS_LABEL[c]} <b>{classCounts.get(c)}</b>
            </button>
          ))}
        </div>
        <div className="evx-selects">
          <label>
            <span>Inspection</span>
            <select className="filters__select" value={inspectionId} onChange={(e) => setInspectionId(e.target.value)}>
              <option value="">All</option>
              {inspectionIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Kind</span>
            <select className="filters__select" value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind | "")}>
              {KINDS.map((k) => (
                <option key={k || "all"} value={k}>
                  {k ? pretty(k) : "All"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Retention</span>
            <select
              className="filters__select"
              value={retention}
              onChange={(e) => setRetention(e.target.value as EvidenceObject["retention"] | "")}
            >
              {RETENTIONS.map((r) => (
                <option key={r || "all"} value={r}>
                  {r ? pretty(r) : "All"}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="evx-stage">
        <ul className="evx-wall" aria-label="Evidence objects">
          {visible.map((ev, i) => (
            <li key={ev.id} className={i === 0 && ev.kind === "crop" ? "evx-wall__feature" : undefined}>
              <button
                type="button"
                data-class={ev.class_id ?? ev.kind}
                className={`evx-card retention--${ev.retention}${selected?.id === ev.id ? " is-selected" : ""}`}
                style={{ animationDelay: `${Math.min(i, 14) * 45}ms` }}
                onClick={() => setSelectedId(ev.id)}
              >
                <span className="evx-card__media">
                  <EvidenceImage key={ev.content_url ?? ev.id} ev={ev} className="evx-card__img" />
                  <span className="evx-card__brk" aria-hidden="true" />
                  <span className="evx-card__kind">{pretty(ev.kind)}</span>
                  {ev.confidence != null ? (
                    <span className="evx-card__conf">
                      <ConfRing value={ev.confidence} size={44} />
                    </span>
                  ) : null}
                  <span className={`evx-card__ret chip chip--retention-${ev.retention}`}>
                    {pretty(ev.retention)}
                  </span>
                </span>
                <span className="evx-card__body">
                  <span className="evx-card__label">{ev.label}</span>
                  <span className="evx-card__meta">
                    <span className="mono">{ev.inspection_id}</span>
                    <span>{ev.bytes_label}</span>
                    <span>
                      {new Date(ev.captured_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <aside className="evx-inspector" aria-label="Evidence inspector">
          {selected ? (
            <div key={selected.id} className="evx-inspector__in" data-class={selected.class_id ?? selected.kind}>
              <div className="evx-inspector__view">
                <EvidenceImage key={selected.content_url ?? selected.id} ev={selected} className="evx-inspector__img" />
                <span className="evx-scan" aria-hidden="true" />
                <span className="evx-reticle" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="evx-inspector__tag">
                  {selected.class_id ? CLASS_LABEL[selected.class_id] : pretty(selected.kind)}
                </span>
                <div className="evx-inspector__nav">
                  <button type="button" onClick={() => step(-1)} aria-label="Previous evidence">
                    ‹
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Next evidence">
                    ›
                  </button>
                </div>
              </div>

              <div className="evx-inspector__head">
                <div>
                  <h2>{selected.label}</h2>
                  <p className="mono">{selected.id}</p>
                </div>
                <ConfRing value={selected.confidence} size={72} />
              </div>

              {selected.bbox ? (
                <div className="evx-inspector__loc">
                  <Locator bbox={selected.bbox} />
                  <p>
                    <span>Source frame</span>
                    <b className="mono">
                      {selected.bbox[0]}, {selected.bbox[1]} · {selected.bbox[2]}×{selected.bbox[3]}
                    </b>
                  </p>
                </div>
              ) : null}

              <dl className="evx-facts">
                <div>
                  <dt>Inspection</dt>
                  <dd className="mono">{selected.inspection_id}</dd>
                </div>
                <div>
                  <dt>Retention</dt>
                  <dd>
                    <span className={`chip chip--retention-${selected.retention}`}>{pretty(selected.retention)}</span>
                  </dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{selected.bytes_label}</dd>
                </div>
                <div>
                  <dt>Captured</dt>
                  <dd>{new Date(selected.captured_at).toLocaleString()}</dd>
                </div>
                {selected.asset_id ? (
                  <div>
                    <dt>Asset</dt>
                    <dd>
                      <Link to={`/assets/${selected.asset_id}`} className="mono">
                        {selected.asset_id}
                      </Link>
                    </dd>
                  </div>
                ) : null}
                {selected.finding_id ? (
                  <div>
                    <dt>Finding</dt>
                    <dd>
                      <Link to="/priority" className="mono">
                        {selected.finding_id}
                      </Link>
                    </dd>
                  </div>
                ) : null}
              </dl>

              {selected.object_key ? (
                <div className="evx-uri">
                  <span className="evx-uri__scheme">{selected.backend === "mock" ? "mock://" : "s3://"}</span>
                  <code title={selected.object_key}>{selected.object_key}</code>
                  <button type="button" onClick={copyUri}>
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : null}
              <p className="evx-inspector__foot">
                {selected.content_url
                  ? `Signed URL · expires ${selected.content_expires_at ? new Date(selected.content_expires_at).toLocaleTimeString() : "soon"}`
                  : "Procedural preview · connect pulse-api for stored bytes"}
                {" · ←/→ to browse"}
              </p>
            </div>
          ) : (
            <p className="evx-inspector__empty">Select an evidence object.</p>
          )}
        </aside>
      </div>

      {visible.length === 0 && !error ? (
        <p className="catalog__empty">
          No evidence in this view. Post a crop to <code>/api/v1/evidence</code> or clear filters.
        </p>
      ) : null}
    </section>
  );
}
