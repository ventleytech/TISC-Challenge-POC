import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CorridorVisual } from "../components/CorridorVisual";
import { SlaCountdown } from "../components/SlaCountdown";
import {
  assetName,
  listAlerts,
  listFindings,
  listOpsMetrics,
} from "../mock/client";
import type { Alert, Finding, OpsMetric } from "../types/domain";

const lanes = [
  {
    to: "/inspections",
    title: "Inspections",
    copy: "Lifecycle list, filters, asset-type schedule wizards.",
  },
  {
    to: "/priority",
    title: "Priority",
    copy: "Findings ranked by severity × asset criticality.",
  },
  {
    to: "/alerts",
    title: "Alerts",
    copy: "Live SLA countdown, ack queue, breach emphasis.",
  },
  {
    to: "/evidence",
    title: "Evidence",
    copy: "Inspection-scoped objects with retention tags.",
  },
];

export function HomePage() {
  const [metrics, setMetrics] = useState<OpsMetric[]>([]);
  const [breachQueue, setBreachQueue] = useState<Alert[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      listOpsMetrics(),
      listAlerts({ openOnly: true }),
      listFindings({}),
    ]).then(([m, a, f]) => {
      if (cancelled) return;
      const now = Date.now();
      setMetrics(m.items);
      setBreachQueue(
        a.items
          .filter(
            (row) =>
              row.sla_due_at && new Date(row.sla_due_at).getTime() < now,
          )
          .slice(0, 4),
      );
      setFindings(f.items.slice(0, 5));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero" aria-labelledby="vp-brand">
        <div className="hero__atmosphere" aria-hidden="true">
          <CorridorVisual />
        </div>

        <div className="hero__copy">
          <p className="hero__plane">Sense · Media · Stream · Data</p>
          <h1 id="vp-brand" className="hero__brand">
            VoltPulse
          </h1>
          <p className="hero__lede">
            Drone and media inspection OS for energy corridors — detect, rank,
            alert, govern.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/inspections">
              Open inspections
            </Link>
            <Link className="btn btn--ghost" to="/priority">
              Priority board
            </Link>
          </div>
        </div>
      </section>

      <section className="pulse-strip" aria-label="Operations pulse">
        <header className="pulse-strip__head">
          <p className="catalog__eyebrow">Below fold · ops density</p>
          <h2 className="pulse-strip__title">Corridor pulse</h2>
        </header>
        <ul className="kpi-row">
          {metrics.map((m, i) => (
            <li
              key={m.id}
              className={`kpi kpi--${m.tone}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="kpi__value">{m.value}</span>
              <span className="kpi__label">{m.label}</span>
              <span className="kpi__hint">{m.hint}</span>
            </li>
          ))}
        </ul>

        <div className="ops-split">
          <section className="ops-panel" aria-label="Breach queue">
            <header className="ops-panel__head">
              <h3>Breach queue</h3>
              <Link to="/alerts">All alerts</Link>
            </header>
            {breachQueue.length === 0 ? (
              <p className="catalog__empty">No breached SLAs in open queue.</p>
            ) : (
              <ul className="ops-queue">
                {breachQueue.map((a, i) => (
                  <li
                    key={a.id}
                    className="ops-queue__row ops-queue__row--breach"
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <div>
                      <p className="ops-queue__title">{a.title}</p>
                      <p className="ops-queue__meta mono">{a.id}</p>
                    </div>
                    <SlaCountdown dueAt={a.sla_due_at} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ops-panel" aria-label="Top findings">
            <header className="ops-panel__head">
              <h3>Top risk findings</h3>
              <Link to="/priority">Board</Link>
            </header>
            <ul className="ops-queue">
              {findings.map((f, i) => (
                <li
                  key={f.id}
                  className="ops-queue__row"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <div>
                    <p className="ops-queue__title">
                      {f.class_id.replace("_", " ")} · {assetName(f.asset_id)}
                    </p>
                    <p className="ops-queue__meta">
                      <span className={`badge badge--${f.severity}`}>
                        {f.severity}
                      </span>{" "}
                      risk {f.risk_score}
                    </p>
                  </div>
                  <Link className="btn btn--ghost btn--sm" to={`/assets/${f.asset_id}`}>
                    Asset
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <ul className="lane-grid">
          {lanes.map((lane) => (
            <li key={lane.to}>
              <Link className="lane" to={lane.to}>
                <span className="lane__title">{lane.title}</span>
                <span className="lane__copy">{lane.copy}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
