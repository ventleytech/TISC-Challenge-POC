import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminTabs } from "../components/AdminTabs";
import {
  complianceReportUrl,
  listFindings,
  listInspections,
  liveApiEnabled,
} from "../mock/client";
import { DEMO_UTILITY_ID } from "../mock/data";
import type { Finding, Inspection } from "../types/domain";

export function CompliancePage() {
  const [inspectionId, setInspectionId] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listFindings({}), listInspections({})]).then(([f, i]) => {
      if (cancelled) return;
      setFindings(f.items);
      setInspections(i.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const href = complianceReportUrl(
    DEMO_UTILITY_ID,
    inspectionId.trim() || undefined,
  );

  const closed = inspections.filter((i) => i.status === "closed").length;
  const completion = Math.round(
    (closed / Math.max(1, inspections.length)) * 100,
  );
  const sev = useMemo(() => {
    const m = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      if (f.severity === "critical") m.critical += 1;
      else if (f.severity === "high") m.high += 1;
      else if (f.severity === "medium") m.medium += 1;
      else m.low += 1;
    }
    return m;
  }, [findings]);

  return (
    <section className="page-view">
      <AdminTabs />
      <header className="page-heading">
        <div>
          <p className="eyebrow">REPORTS & ANALYTICS</p>
          <h1>Reports & analytics</h1>
          <p>
            Week overview plus compliance export
            {liveApiEnabled() ? " (live API)" : " (URL ready offline)"}.
          </p>
        </div>
        <div className="heading-actions">
          <a className="btn-primary" href={href} target="_blank" rel="noreferrer">
            Export report
          </a>
        </div>
      </header>

      <div className="stat-grid four">
        <article className="stat-card">
          <strong>{inspections.length}</strong>
          <span>Inspections this week</span>
        </article>
        <article className="stat-card">
          <strong>{completion}%</strong>
          <span>Completion rate</span>
        </article>
        <article className="stat-card warning">
          <strong>
            {findings.filter((f) => f.severity === "critical" || f.severity === "high").length}
          </strong>
          <span>SLA at risk</span>
        </article>
        <article className="stat-card">
          <strong>{findings.length}</strong>
          <span>Total findings</span>
        </article>
      </div>

      <div className="analytics-grid">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Inspection activity</h2>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            {closed} closed · {inspections.length - closed} still open in the
            loaded set.
          </p>
          <div className="severity-bar large" aria-hidden="true">
            <span style={{ width: `${completion}%`, background: "#5b43d9" }} />
            <span style={{ width: `${100 - completion}%`, background: "#e4e3f5" }} />
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Findings by severity</h2>
          </div>
          <div className="severity-bar large" aria-hidden="true">
            <span style={{ width: `${(sev.critical / Math.max(1, findings.length)) * 100}%` }} />
            <span style={{ width: `${(sev.high / Math.max(1, findings.length)) * 100}%` }} />
            <span style={{ width: `${(sev.medium / Math.max(1, findings.length)) * 100}%` }} />
            <span style={{ width: `${(sev.low / Math.max(1, findings.length)) * 100}%` }} />
          </div>
          <p className="muted" style={{ fontSize: 11 }}>
            C {sev.critical} · H {sev.high} · M {sev.medium} · L+ {sev.low}
          </p>
        </article>
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Users & roles</h2>
            <Link className="text-link" to="/admin/users">
              Admin
            </Link>
          </div>
          <p className="muted" style={{ fontSize: 12 }}>
            Manage operators and API-key stubs from Admin → Users.
          </p>
        </article>
      </div>

      <div className="panel form-panel" style={{ marginTop: 18 }}>
        <h2 className="panel-title">Compliance export</h2>
        <label>
          Inspection id (optional)
          <input
            className="field"
            value={inspectionId}
            onChange={(e) => setInspectionId(e.target.value)}
            placeholder="insp-03"
          />
        </label>
        <div className="button-row" style={{ marginTop: 12 }}>
          <a className="btn-primary" href={href} target="_blank" rel="noreferrer">
            Open compliance report
          </a>
          <a
            className="btn-outline"
            href={href}
            download={`compliance-${DEMO_UTILITY_ID}.html`}
          >
            Download stub
          </a>
        </div>
        <p className="mono muted" style={{ marginTop: 10, fontSize: 11 }}>
          {href}
        </p>
      </div>
    </section>
  );
}
