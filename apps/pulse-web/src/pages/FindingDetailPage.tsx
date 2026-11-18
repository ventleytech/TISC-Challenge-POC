import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { EvidenceLightbox } from "../components/EvidenceLightbox";
import {
  assetName,
  exportWorkOrder,
  getFinding,
  listEvidence,
  patchFinding,
} from "../mock/client";
import {
  SEVERITIES,
  type EvidenceObject,
  type Finding,
  type LabelVerdict,
  type Severity,
} from "../types/domain";

export function FindingDetailPage() {
  const { findingId = "" } = useParams();
  const { canWrite } = useAuth();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [evidence, setEvidence] = useState<EvidenceObject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [override, setOverride] = useState<Severity | "">("");
  const [lightbox, setLightbox] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [f, e] = await Promise.all([
          getFinding(findingId),
          listEvidence({}),
        ]);
        if (cancelled) return;
        setFinding(f);
        setNote(f?.audit_note ?? "");
        setOverride(f?.severity_override ?? "");
        setEvidence(
          e.items.filter(
            (x) => x.finding_id === findingId || (f && x.asset_id === f.asset_id),
          ),
        );
        setError(f ? null : "Finding not found");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [findingId]);

  async function setLabel(label: LabelVerdict) {
    if (!finding || !canWrite) return;
    const next = await patchFinding(finding.id, { label });
    if (next) setFinding(next);
  }

  async function saveOverride() {
    if (!finding || !canWrite) return;
    const next = await patchFinding(finding.id, {
      severity_override: override || null,
      audit_note: note.trim() || null,
    });
    if (next) setFinding(next);
  }

  async function onExport() {
    if (!finding) return;
    const text = await exportWorkOrder(finding);
    setExportMsg(text.slice(0, 120) + (text.length > 120 ? "…" : ""));
  }

  if (error) {
    return (
      <section className="catalog">
        <p className="catalog__error">{error}</p>
        <Link to="/priority">Back to priority</Link>
      </section>
    );
  }

  if (!finding) {
    return <p className="catalog__empty">Loading finding…</p>;
  }

  return (
    <section className="catalog catalog--wide find-detail">
      <p className="catalog__eyebrow">
        <Link to="/priority">Priority</Link> / finding
      </p>
      <div className="catalog__title-row">
        <h1 className="catalog__title">
          {finding.class_id.replace(/_/g, " ")} · {assetName(finding.asset_id)}
        </h1>
        <span className={`badge badge--${finding.severity}`}>{finding.severity}</span>
      </div>
      <p className="catalog__summary mono">{finding.id}</p>

      <div className="find-detail__grid">
        <div className="wizard-panel wizard-panel--rich">
          <h2 className="catalog__subtitle">Evidence</h2>
          {evidence.length === 0 ? (
            <p className="catalog__empty">No linked evidence objects.</p>
          ) : (
            <ul className="find-detail__thumbs">
              {evidence.map((ev, i) => (
                <li key={ev.id}>
                  <button
                    type="button"
                    className="find-detail__thumb"
                    onClick={() => {
                      setLbIndex(i);
                      setLightbox(true);
                    }}
                  >
                    {ev.label}
                    <span className={`chip chip--retention-${ev.retention}`}>
                      {ev.retention.replace(/_/g, " ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h2 className="catalog__subtitle">Recommendation</h2>
          <p>{finding.recommendation}</p>
          <p className="catalog__summary">
            Risk {finding.risk_score} · criticality {finding.criticality} ·{" "}
            {new Date(finding.occurred_at).toLocaleString()}
          </p>
        </div>

        <aside className="wizard-panel wizard-panel--rich">
          <h2 className="catalog__subtitle">Vendor / warranty</h2>
          <p>{finding.vendor_hint ?? "No OEM hint yet — check asset registry."}</p>
          <p className="catalog__summary">
            {finding.warranty_hint ?? "Warranty unknown"}
          </p>
          <Link className="btn btn--ghost btn--sm" to={`/assets/${finding.asset_id}`}>
            Open asset
          </Link>

          <h2 className="catalog__subtitle">TP / FP label</h2>
          <div className="wizard-actions">
            <button
              type="button"
              className={`btn btn--sm${finding.label === "tp" ? " btn--primary" : " btn--ghost"}`}
              disabled={!canWrite}
              onClick={() => void setLabel("tp")}
            >
              True positive
            </button>
            <button
              type="button"
              className={`btn btn--sm${finding.label === "fp" ? " btn--primary" : " btn--ghost"}`}
              disabled={!canWrite}
              onClick={() => void setLabel("fp")}
            >
              False positive
            </button>
          </div>

          <h2 className="catalog__subtitle">Severity override</h2>
          <label className="filters__field">
            <span className="filters__label">Override</span>
            <select
              className="filters__select"
              value={override}
              disabled={!canWrite}
              onChange={(e) => setOverride(e.target.value as Severity | "")}
            >
              <option value="">Keep {finding.severity}</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="filters__field">
            <span className="filters__label">Audit note</span>
            <textarea
              className="filters__input filters__textarea"
              rows={3}
              value={note}
              disabled={!canWrite}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why override / label…"
            />
          </label>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!canWrite}
              onClick={() => void saveOverride()}
            >
              Save audit
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => void onExport()}
            >
              Export work order
            </button>
            <Link className="btn btn--ghost btn--sm" to="/alerts">
              Open alerts
            </Link>
          </div>
          {exportMsg ? <pre className="mono find-detail__export">{exportMsg}</pre> : null}
        </aside>
      </div>

      {lightbox ? (
        <EvidenceLightbox
          items={evidence}
          index={lbIndex}
          onClose={() => setLightbox(false)}
          onIndex={setLbIndex}
        />
      ) : null}
    </section>
  );
}
