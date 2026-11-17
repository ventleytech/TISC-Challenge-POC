import { useEffect, useState } from "react";
import { DEMO_UTILITY_ID } from "../mock/data";
import { listOpsMetrics } from "../mock/client";
import type { OpsMetric } from "../types/domain";

const roles = [
  {
    id: "role-ops",
    name: "Ops supervisor",
    scope: "utility",
    seats: 4,
  },
  {
    id: "role-analyst",
    name: "Analyst",
    scope: "findings + evidence",
    seats: 12,
  },
  {
    id: "role-field",
    name: "Field crew lead",
    scope: "ack + work orders",
    seats: 8,
  },
  {
    id: "role-admin",
    name: "Tenant admin",
    scope: "roles · utilities",
    seats: 2,
  },
];

const pipeline = [
  { name: "pulse-gateway", plane: "Sense", state: "up", lag: "—" },
  { name: "grid-perception", plane: "Media", state: "up", lag: "0.8s" },
  { name: "grid-rules", plane: "Data", state: "up", lag: "0.4s" },
  { name: "pulse-notify", plane: "Data", state: "degraded", lag: "2.1s" },
  { name: "pulse-store", plane: "Store", state: "up", lag: "—" },
  { name: "pulse-api", plane: "Data", state: "up", lag: "—" },
];

const utility = {
  id: DEMO_UTILITY_ID,
  name: "Demo Energy Cooperative",
  region: "North Ridge / South Basin corridors",
  timezone: "UTC",
  planes: "Sense · Media · Stream · Data",
};

export function AdminPage() {
  const [metrics, setMetrics] = useState<OpsMetric[]>([]);
  const [activeRole, setActiveRole] = useState(roles[0].id);

  useEffect(() => {
    let cancelled = false;
    void listOpsMetrics().then((res) => {
      if (!cancelled) setMetrics(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · admin</p>
        <h1 className="catalog__title">Admin &amp; pipeline</h1>
        <p className="catalog__summary">
          Utility stub, roles, and plane health for demo — not a real IAM
          console.
        </p>
      </header>

      <ul className="kpi-row kpi-row--admin">
        {metrics.map((m) => (
          <li key={m.id} className={`kpi kpi--${m.tone}`}>
            <span className="kpi__value">{m.value}</span>
            <span className="kpi__label">{m.label}</span>
            <span className="kpi__hint">{m.hint}</span>
          </li>
        ))}
      </ul>

      <div className="admin-split admin-split--3">
        <section className="admin-panel admin-panel--utility">
          <h2 className="admin-panel__title">Utility</h2>
          <dl className="detail-grid detail-grid--compact">
            <div>
              <dt>Name</dt>
              <dd>{utility.name}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd className="mono">{utility.id}</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{utility.region}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{utility.timezone}</dd>
            </div>
            <div>
              <dt>Planes</dt>
              <dd>{utility.planes}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn--ghost btn--sm" disabled>
            Edit utility (stub)
          </button>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel__title">Roles</h2>
          <ul className="admin-list">
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`role-pick${activeRole === r.id ? " is-active" : ""}`}
                  onClick={() => setActiveRole(r.id)}
                >
                  <span className="admin-list__name">{r.name}</span>
                  <span className="admin-list__meta mono">{r.id}</span>
                  <span className="admin-list__scope">
                    {r.scope} · {r.seats} seats
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="admin-panel__note">
            Selected: <span className="mono">{activeRole}</span> — edit
            affordance stub only.
          </p>
        </section>

        <section className="admin-panel">
          <h2 className="admin-panel__title">Pipeline health</h2>
          <ul className="admin-list">
            {pipeline.map((p) => (
              <li key={p.name}>
                <span className="admin-list__name mono">{p.name}</span>
                <span className={`chip chip--pipe-${p.state}`}>{p.state}</span>
                <span className="admin-list__scope">
                  {p.plane} · lag {p.lag}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
