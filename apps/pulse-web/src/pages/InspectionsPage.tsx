import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  InspectionFilters,
  type InspectionFilterState,
} from "../components/InspectionFilters";
import { assetName, listInspections } from "../mock/client";
import type { Inspection } from "../types/domain";

const emptyFilters: InspectionFilterState = {
  status: "",
  scheduleKind: "",
};

export function InspectionsPage() {
  const [filters, setFilters] = useState<InspectionFilterState>(emptyFilters);
  const [items, setItems] = useState<Inspection[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listInspections(filters);
        if (!cancelled) {
          setItems(res.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load inspections",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · S8</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Inspections</h1>
          <Link className="btn btn--primary" to="/inspections/schedule">
            Schedule wizard
          </Link>
        </div>
        <p className="catalog__summary">
          Full lifecycle surface — status chips, assignees, SLA hours, schedule
          kind. Mock catalog until Nest live.
        </p>
      </header>

      <div className="stat-band">
        <div className="stat-band__cell">
          <span className="stat-band__n">{items.length}</span>
          <span className="stat-band__l">In view</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">
            {items.filter((i) => i.status === "in_progress" || i.status === "processing").length}
          </span>
          <span className="stat-band__l">Live</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">
            {items.reduce((n, i) => n + (i.finding_count ?? 0), 0)}
          </span>
          <span className="stat-band__l">Findings linked</span>
        </div>
      </div>

      <InspectionFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="table-wrap">
        <table className="dense-table" aria-label="Inspections">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Assets</th>
              <th>Kind</th>
              <th>Assignee</th>
              <th>Planned</th>
              <th>SLA h</th>
              <th>Findings</th>
            </tr>
          </thead>
          <tbody>
            {items.map((insp, index) => (
              <tr
                key={insp.id}
                style={{ animationDelay: `${index * 40}ms` }}
                className="dense-table__row"
              >
                <td className="mono">{insp.id}</td>
                <td>
                  <span className={`chip chip--status-${insp.status}`}>
                    {insp.status}
                  </span>
                </td>
                <td>
                  {insp.asset_ids.map((id) => assetName(id)).join(", ") || "—"}
                </td>
                <td>{insp.schedule_kind ?? "—"}</td>
                <td>{insp.assignee ?? "—"}</td>
                <td>
                  {insp.planned_at
                    ? new Date(insp.planned_at).toLocaleString()
                    : "—"}
                </td>
                <td className="mono">
                  {insp.sla_hours_left == null ? "—" : insp.sla_hours_left}
                </td>
                <td className="mono">{insp.finding_count ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No inspections match filters.</p>
      ) : null}
    </section>
  );
}
