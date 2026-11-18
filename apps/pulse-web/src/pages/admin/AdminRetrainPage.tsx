import { Link } from "react-router-dom";
import { AdminTabs } from "../../components/AdminTabs";

export function AdminRetrainPage() {
  return (
    <section className="catalog catalog--wide">
      <AdminTabs />
      <header className="catalog__header">
        <p className="catalog__eyebrow">Admin · retrain</p>
        <h1 className="catalog__title">Model retrain status</h1>
        <p className="catalog__summary">
          Stub cards for pulse-train story — activate disabled until registry
          lands.
        </p>
      </header>

      <ul className="kpi-row">
        <li className="kpi kpi--steel">
          <span className="kpi__value">142</span>
          <span className="kpi__label">Labeled frames</span>
          <span className="kpi__hint">From TP/FP queue</span>
        </li>
        <li className="kpi kpi--volt">
          <span className="kpi__value">idle</span>
          <span className="kpi__label">Job status</span>
          <span className="kpi__hint">No active retrain</span>
        </li>
        <li className="kpi kpi--ok">
          <span className="kpi__value">v0.3</span>
          <span className="kpi__label">Active model</span>
          <span className="kpi__hint">corrosion YOLO</span>
        </li>
      </ul>

      <div className="wizard-actions">
        <button type="button" className="btn btn--primary" disabled>
          Activate model (stub)
        </button>
        <Link className="btn btn--ghost" to="/labels">
          Open label queue
        </Link>
      </div>
    </section>
  );
}
