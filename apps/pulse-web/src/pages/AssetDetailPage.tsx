import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getAsset,
  listEvidence,
  listFindings,
  listInspections,
} from "../mock/client";
import type {
  Asset,
  EvidenceObject,
  Finding,
  Inspection,
} from "../types/domain";

export function AssetDetailPage() {
  const { assetId = "" } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [evidence, setEvidence] = useState<EvidenceObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const [row, fRes, iRes, eRes] = await Promise.all([
          getAsset(assetId),
          listFindings({}),
          listInspections({}),
          listEvidence({}),
        ]);
        if (cancelled) return;
        setAsset(row);
        setError(row ? null : "Asset not found");
        const relatedFindings = fRes.items.filter((f) => f.asset_id === assetId);
        const relatedInsp = iRes.items.filter((i) =>
          i.asset_ids.includes(assetId),
        );
        const inspIds = new Set(relatedInsp.map((i) => i.id));
        setFindings(relatedFindings);
        setInspections(relatedInsp);
        setEvidence(eRes.items.filter((e) => inspIds.has(e.inspection_id)));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return (
    <section className="catalog catalog--wide">
      <p className="catalog__eyebrow">
        <Link to="/assets">Assets</Link> / detail
      </p>
      {loading ? <p className="catalog__empty">Loading…</p> : null}
      {error ? <p className="catalog__error">{error}</p> : null}
      {asset ? (
        <>
          <div className="catalog__title-row">
            <h1 className="catalog__title">{asset.name}</h1>
            {asset.criticality ? (
              <span className={`badge badge--crit-${asset.criticality}`}>
                {asset.criticality}
              </span>
            ) : null}
          </div>
          <p className="catalog__summary">
            Asset intelligence — registry fields plus linked findings,
            inspections, and evidence for demo triage.
          </p>

          <div className="detail-hero">
            <div className="detail-hero__mark" aria-hidden="true">
              <span>{asset.kind.slice(0, 2).toUpperCase()}</span>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>ID</dt>
                <dd className="mono">{asset.id}</dd>
              </div>
              <div>
                <dt>Kind</dt>
                <dd>{asset.kind}</dd>
              </div>
              <div>
                <dt>Voltage</dt>
                <dd>{asset.voltage_class ?? "—"}</dd>
              </div>
              <div>
                <dt>Circuit</dt>
                <dd>{asset.circuit ?? "—"}</dd>
              </div>
              <div>
                <dt>OEM</dt>
                <dd>{asset.oem ?? "—"}</dd>
              </div>
              <div>
                <dt>Install year</dt>
                <dd>{asset.install_year ?? "—"}</dd>
              </div>
              <div>
                <dt>Parent</dt>
                <dd>
                  {asset.parent_id ? (
                    <Link to={`/assets/${asset.parent_id}`}>
                      {asset.parent_id}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Utility</dt>
                <dd className="mono">{asset.utility_id}</dd>
              </div>
            </dl>
          </div>

          <div className="stat-band">
            <div className="stat-band__cell">
              <span className="stat-band__n">{findings.length}</span>
              <span className="stat-band__l">Findings</span>
            </div>
            <div className="stat-band__cell">
              <span className="stat-band__n">{inspections.length}</span>
              <span className="stat-band__l">Inspections</span>
            </div>
            <div className="stat-band__cell">
              <span className="stat-band__n">{evidence.length}</span>
              <span className="stat-band__l">Evidence objs</span>
            </div>
          </div>

          <div className="detail-panels">
            <section className="admin-panel">
              <h2 className="admin-panel__title">Linked findings</h2>
              {findings.length === 0 ? (
                <p className="catalog__empty">No findings on this asset.</p>
              ) : (
                <ul className="admin-list">
                  {findings.map((f) => (
                    <li key={f.id}>
                      <span className="admin-list__name">
                        {f.class_id} · risk {f.risk_score}
                      </span>
                      <span className={`badge badge--${f.severity}`}>
                        {f.severity}
                      </span>
                      <span className="admin-list__scope">{f.recommendation}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link className="btn btn--ghost btn--sm" to="/priority">
                Open priority board
              </Link>
            </section>

            <section className="admin-panel">
              <h2 className="admin-panel__title">Inspections</h2>
              {inspections.length === 0 ? (
                <p className="catalog__empty">No inspections linked.</p>
              ) : (
                <ul className="admin-list">
                  {inspections.map((i) => (
                    <li key={i.id}>
                      <span className="admin-list__name mono">{i.id}</span>
                      <span className={`chip chip--status-${i.status}`}>
                        {i.status}
                      </span>
                      <span className="admin-list__scope">
                        {i.assignee ?? "unassigned"} · findings{" "}
                        {i.finding_count ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link className="btn btn--ghost btn--sm" to="/inspections">
                Inspections list
              </Link>
            </section>

            <section className="admin-panel">
              <h2 className="admin-panel__title">Evidence</h2>
              {evidence.length === 0 ? (
                <p className="catalog__empty">No evidence for linked runs.</p>
              ) : (
                <ul className="admin-list">
                  {evidence.map((e) => (
                    <li key={e.id}>
                      <span className="admin-list__name">{e.label}</span>
                      <span className={`chip chip--retention-${e.retention}`}>
                        {e.retention}
                      </span>
                      <span className="admin-list__scope mono">
                        {e.inspection_id} · {e.bytes_label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link className="btn btn--ghost btn--sm" to="/evidence">
                Evidence lane
              </Link>
            </section>
          </div>

          <div className="wizard-actions">
            <Link className="btn btn--primary" to="/inspections/schedule">
              Schedule inspection
            </Link>
            <Link className="btn btn--ghost" to="/alerts">
              Alerts SLA
            </Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
