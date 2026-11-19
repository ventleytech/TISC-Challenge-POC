import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  assetName,
  listAlerts,
  listFindings,
  listInspections,
  listOpsMetrics,
} from "../mock/client";
import type { Alert, Finding, Inspection, OpsMetric } from "../types/domain";

export function HomePage() {
  const [metrics, setMetrics] = useState<OpsMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listOpsMetrics(),
      listAlerts({ openOnly: true }),
      listFindings({}),
      listInspections({}),
    ]).then(([m, a, f, i]) => {
      if (cancelled) return;
      setMetrics(m.items);
      setAlerts(a.items);
      setFindings(f.items);
      setInspections(i.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = Date.now();
  const slaAtRisk = useMemo(
    () =>
      alerts.filter(
        (a) => a.sla_due_at && new Date(a.sla_due_at).getTime() - now < 3_600_000,
      ).length,
    [alerts, now],
  );
  const liveRuns = inspections.filter((i) =>
    ["in_progress", "processing"].includes(i.status),
  ).length;
  const topRisks = useMemo(
    () => [...findings].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5),
    [findings],
  );
  const busLag =
    metrics.find((m) => /lag|bus/i.test(m.label))?.value ??
    metrics[0]?.value ??
    "—";

  const sevCounts = useMemo(() => {
    const m = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      if (f.severity === "critical") m.critical += 1;
      else if (f.severity === "high") m.high += 1;
      else if (f.severity === "medium") m.medium += 1;
      else m.low += 1;
    }
    const t = Math.max(1, findings.length);
    return {
      critical: (m.critical / t) * 100,
      high: (m.high / t) * 100,
      medium: (m.medium / t) * 100,
      low: (m.low / t) * 100,
      donePct: Math.min(
        100,
        Math.round(
          (inspections.filter((i) => i.status === "closed").length /
            Math.max(1, inspections.length)) *
          100,
        ),
      ),
    };
  }, [findings, inspections]);

  return (
    <section className="page-view" aria-label="Home">
      <div className="hero">
        <div className="hero-photo" aria-hidden="true" />
        <div className="hero-copy">
          <p className="greeting">Good day, operator</p>
          <h1>AI-powered grid inspections for safer, more reliable transmission</h1>
          <p>
            Detect defects on corridors, rank by severity × criticality, and clear
            SLA alerts before the next outage window.
          </p>
          <div className="hero-chips">
            <span>
              Open Findings <b>{findings.length}</b>
            </span>
            <span>
              SLA at Risk <b>{slaAtRisk}</b>
            </span>
            <span>
              Live Inspections <b>{liveRuns}</b>
            </span>
            <span>
              Bus Lag <b>{busLag}</b>
            </span>
          </div>
        </div>
      </div>

      <div className="kpis">
        <article className="kpi">
          <div className="kpi-icon" aria-hidden="true">
            ▤
          </div>
          <div>
            <div className="kpi-value">{findings.length}</div>
            <div className="kpi-label">Open findings</div>
            <div className="kpi-note">Across active inspections</div>
          </div>
        </article>
        <article className="kpi">
          <div className="kpi-icon" aria-hidden="true">
            ◷
          </div>
          <div>
            <div className="kpi-value">{slaAtRisk}</div>
            <div className="kpi-label">SLA at risk</div>
            <div className="kpi-note">Due within 1h or breached</div>
          </div>
        </article>
        <article className="kpi">
          <div className="kpi-icon" aria-hidden="true">
            ♧
          </div>
          <div>
            <div className="kpi-value">{liveRuns}</div>
            <div className="kpi-label">Live inspections</div>
            <div className="kpi-note">In progress / processing</div>
          </div>
        </article>
        <article className="kpi">
          <div className="kpi-icon" aria-hidden="true">
            ⌁
          </div>
          <div>
            <div className="kpi-value">{String(busLag)}</div>
            <div className="kpi-label">Ops signal</div>
            <div className="kpi-note">From metrics feed</div>
          </div>
        </article>
      </div>

      <div className="primary-grid">
        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Corridor Monitoring</h2>
            <Link className="text-link" to="/map">
              Open map
            </Link>
          </div>
          <div className="map" aria-hidden="true">
            <div className="map-controls">
              <button type="button">+</button>
              <button type="button">−</button>
            </div>
            <span className="map-point green p1">1</span>
            <span className="map-point red p2">2</span>
            <span className="map-point amber p3">3</span>
            <span className="map-point green p4">4</span>
            <div className="route-overlay" />
            <div className="map-legend">
              <span>
                <i style={{ background: "#23b766" }} /> Clear
              </span>
              <span>
                <i style={{ background: "#f3a51e" }} /> Watch
              </span>
              <span>
                <i style={{ background: "#eb4d58" }} /> Hot
              </span>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Active Risks</h2>
            <Link className="text-link" to="/priority">
              Prioritisation
            </Link>
          </div>
          <div className="risk-list">
            {topRisks.length === 0 ? (
              <p className="muted">No findings yet.</p>
            ) : (
              topRisks.map((f) => (
                <div className="risk" key={f.id}>
                  <div
                    className={`risk-photo ${f.class_id === "thermal_hotspot" ? "hot" : f.class_id}`}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="risk-name">
                      {f.class_id.replace(/_/g, " ")} · {assetName(f.asset_id)}
                    </div>
                    <div className="risk-info">
                      <span className={`severity-tag ${f.severity}`}>
                        {f.severity}
                      </span>
                      Risk {f.risk_score}
                    </div>
                  </div>
                  <Link
                    className="open-risk"
                    to={`/findings/${f.id}`}
                    aria-label="Open finding"
                  >
                    ›
                  </Link>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="analytics-grid">
        <article className="panel progress-panel">
          <div className="panel-head">
            <h2 className="panel-title">Inspection Progress</h2>
            <span className="period">This week</span>
          </div>
          <div className="progress-layout">
            <div className="donut" aria-hidden="true">
              <div className="donut-label">
                <strong>{sevCounts.donePct}%</strong>
                <small>closed</small>
              </div>
            </div>
            <div className="progress-stats">
              <div>
                <span>Total runs</span>
                <b>{inspections.length}</b>
              </div>
              <div>
                <span>Live</span>
                <b>{liveRuns}</b>
              </div>
              <div>
                <span>Findings</span>
                <b>{findings.length}</b>
              </div>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Findings by severity</h2>
          </div>
          <div className="severity-chart">
            <div className="severity-bar large" aria-hidden="true">
              <span style={{ width: `${sevCounts.critical}%` }} />
              <span style={{ width: `${sevCounts.high}%` }} />
              <span style={{ width: `${sevCounts.medium}%` }} />
              <span style={{ width: `${sevCounts.low}%` }} />
            </div>
            <p className="muted" style={{ fontSize: 11 }}>
              Critical / high / medium / low+info mix from current findings.
            </p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Activity</h2>
            <Link className="text-link" to="/alerts">
              Alerts
            </Link>
          </div>
          <div className="risk-list">
            {alerts.slice(0, 4).map((a) => (
              <div className="activity-row" key={a.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eeedf7" }}>
                <span className="activity-icon" aria-hidden="true">
                  ◷
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 10 }}>
                    {a.severity}
                    {a.sla_due_at
                      ? ` · due ${new Date(a.sla_due_at).toLocaleString()}`
                      : ""}
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 ? (
              <p className="muted">No open alerts.</p>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
