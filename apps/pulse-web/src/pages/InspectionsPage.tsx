import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  InspectionFilters,
  type InspectionFilterState,
} from "../components/InspectionFilters";
import { listInspections } from "../mock/client";
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
    <section className="catalog">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · S8</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Inspections</h1>
          <Link className="btn btn--primary" to="/inspections/schedule">
            Schedule
          </Link>
        </div>
        <p className="catalog__summary">
          List + filters shell. Schedule wizards pick line, feeder, or substation.
        </p>
      </header>

      <InspectionFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <ul className="record-list" aria-label="Inspections">
        {items.map((insp) => (
          <li key={insp.id} className="record-row record-row--static">
            <span className="record-row__name">{insp.id}</span>
            <span className="record-row__meta">
              {insp.status}
              {insp.schedule_kind ? ` · ${insp.schedule_kind}` : ""}
              {insp.planned_at
                ? ` · ${new Date(insp.planned_at).toLocaleString()}`
                : ""}
            </span>
          </li>
        ))}
      </ul>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No inspections match filters.</p>
      ) : null}
    </section>
  );
}
