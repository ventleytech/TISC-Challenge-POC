import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listEvidence, listInspections } from "../mock/client";
import type { EvidenceObject, Inspection } from "../types/domain";

const KINDS: Array<EvidenceObject["kind"] | ""> = [
  "",
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

export function EvidencePage() {
  const [items, setItems] = useState<EvidenceObject[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [inspectionId, setInspectionId] = useState("");
  const [kind, setKind] = useState<EvidenceObject["kind"] | "">("");
  const [retention, setRetention] = useState<EvidenceObject["retention"] | "">("");
  const [selected, setSelected] = useState<EvidenceObject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listInspections({}).then((res) => {
      if (!cancelled) setInspections(res.items);
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
        if (!cancelled) {
          setItems(res.items);
          setError(null);
          setSelected((prev) =>
            prev && res.items.some((e) => e.id === prev.id)
              ? prev
              : (res.items[0] ?? null),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load evidence",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inspectionId, kind, retention]);

  const retentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of items) {
      counts[e.retention] = (counts[e.retention] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · evidence lane</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Evidence</h1>
          <Link className="btn btn--ghost" to="/inspections">
            Inspections
          </Link>
        </div>
        <p className="catalog__summary">
          Inspection-scoped objects with retention tags, kind tabs, and preview
          stub. Mock store — not live MinIO.
        </p>
      </header>

      <div className="stat-band">
        <div className="stat-band__cell">
          <span className="stat-band__n">{items.length}</span>
          <span className="stat-band__l">In view</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">{retentionCounts.hot ?? 0}</span>
          <span className="stat-band__l">Hot</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">{retentionCounts.legal_hold ?? 0}</span>
          <span className="stat-band__l">Legal hold</span>
        </div>
        <div className="stat-band__cell stat-band__cell--warn">
          <span className="stat-band__n">{retentionCounts.expire ?? 0}</span>
          <span className="stat-band__l">Expire</span>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Evidence filters">
        <label className="filters__field">
          <span className="filters__label">Inspection</span>
          <select
            className="filters__select"
            value={inspectionId}
            onChange={(e) => setInspectionId(e.target.value)}
          >
            <option value="">All</option>
            {inspections.map((i) => (
              <option key={i.id} value={i.id}>
                {i.id} · {i.status}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">Kind</span>
          <select
            className="filters__select"
            value={kind}
            onChange={(e) =>
              setKind(e.target.value as EvidenceObject["kind"] | "")
            }
          >
            {KINDS.map((k) => (
              <option key={k || "all"} value={k}>
                {k || "All"}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field">
          <span className="filters__label">Retention</span>
          <select
            className="filters__select"
            value={retention}
            onChange={(e) =>
              setRetention(e.target.value as EvidenceObject["retention"] | "")
            }
          >
            {RETENTIONS.map((r) => (
              <option key={r || "all"} value={r}>
                {r || "All"}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="evidence-split">
        <ul className="evidence-grid" aria-label="Evidence objects">
          {items.map((ev, index) => (
            <li key={ev.id}>
              <button
                type="button"
                className={`evidence-tile retention--${ev.retention}${selected?.id === ev.id ? " is-selected" : ""}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setSelected(ev)}
              >
                <div className="evidence-tile__kind">
                  {ev.kind.replace("_", " ")}
                </div>
                <h2 className="evidence-tile__label">{ev.label}</h2>
                <p className="evidence-tile__meta">
                  <span className="mono">{ev.inspection_id}</span> ·{" "}
                  {ev.bytes_label}
                </p>
                <div className="evidence-tile__foot">
                  <span className={`chip chip--retention-${ev.retention}`}>
                    {ev.retention}
                  </span>
                  <span className="evidence-tile__when">
                    {new Date(ev.captured_at).toLocaleString()}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>

        <aside className="preview-panel" aria-label="Evidence preview">
          {selected ? (
            <>
              <header className="preview-panel__head">
                <h2>{selected.label}</h2>
                <span className={`chip chip--retention-${selected.retention}`}>
                  {selected.retention}
                </span>
              </header>
              <div
                className={`preview-panel__frame preview-panel__frame--${selected.kind}`}
                aria-hidden="true"
              >
                <span>{selected.kind.replace("_", " ")}</span>
              </div>
              <dl className="detail-grid detail-grid--compact">
                <div>
                  <dt>Object</dt>
                  <dd className="mono">{selected.id}</dd>
                </div>
                <div>
                  <dt>Inspection</dt>
                  <dd className="mono">{selected.inspection_id}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{selected.bytes_label}</dd>
                </div>
                <div>
                  <dt>Captured</dt>
                  <dd>{new Date(selected.captured_at).toLocaleString()}</dd>
                </div>
              </dl>
              <p className="preview-panel__note">
                Preview stub — RGB/IR/clip/report chrome only. Retention policy
                drives store plane later.
              </p>
            </>
          ) : (
            <p className="catalog__empty">Select an evidence object.</p>
          )}
        </aside>
      </div>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No evidence objects.</p>
      ) : null}
    </section>
  );
}
