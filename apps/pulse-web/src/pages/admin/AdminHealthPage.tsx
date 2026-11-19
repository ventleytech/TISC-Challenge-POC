import { useEffect, useState } from "react";
import { AdminTabs } from "../../components/AdminTabs";
import { fetchHealth, listOpsMetrics, type HealthSnapshot } from "../../mock/client";
import type { OpsMetric } from "../../types/domain";

const pipeline = [
  { name: "pulse-gateway", plane: "Sense", state: "up", lag: "—" },
  { name: "grid-perception", plane: "Media", state: "up", lag: "0.8s" },
  { name: "grid-rules", plane: "Data", state: "up", lag: "0.4s" },
  { name: "pulse-notify", plane: "Data", state: "degraded", lag: "2.1s" },
  { name: "pulse-store", plane: "Store", state: "up", lag: "—" },
  { name: "pulse-api", plane: "Data", state: "up", lag: "—" },
];

export function AdminHealthPage() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [metrics, setMetrics] = useState<OpsMetric[]>([]);

  useEffect(() => {
    void Promise.all([fetchHealth(), listOpsMetrics()]).then(([h, m]) => {
      setHealth(h);
      setMetrics(m.items);
    });
  }, []);

  return (
    <section className="catalog catalog--wide">
      <AdminTabs />
      <header className="catalog__header">
        <p className="catalog__eyebrow">Admin · health</p>
        <h1 className="catalog__title">Pipeline health</h1>
        <p className="catalog__summary">
          Consumes /health + /metrics when reachable; KPI strip for Demo Day.
        </p>
      </header>

      <div className="stat-band">
        <div className="stat-band__cell">
          <span className="stat-band__n">{health?.api_ok ? "UP" : "—"}</span>
          <span className="stat-band__l">API health ({health?.source ?? "…"})</span>
        </div>
        {metrics.slice(0, 3).map((m) => (
          <div key={m.id} className="stat-band__cell">
            <span className="stat-band__n">{m.value}</span>
            <span className="stat-band__l">{m.label}</span>
          </div>
        ))}
      </div>

      <table className="dense-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Plane</th>
            <th>State</th>
            <th>Lag</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map((p) => (
            <tr key={p.name}>
              <td className="mono">{p.name}</td>
              <td>{p.plane}</td>
              <td>
                <span className={`chip chip--pipe-${p.state === "up" ? "up" : "degraded"}`}>
                  {p.state}
                </span>
              </td>
              <td>{p.lag}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {health?.metrics_text ? (
        <pre className="mono health-metrics">{health.metrics_text.slice(0, 600)}</pre>
      ) : null}
    </section>
  );
}
