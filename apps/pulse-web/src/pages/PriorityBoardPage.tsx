import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FindingFilters,
  type FindingFilterState,
} from "../components/FindingFilters";
import { listFindings } from "../mock/client";
import type { Finding } from "../types/domain";

const emptyFilters: FindingFilterState = {
  classId: "",
  severity: "",
  minRisk: "",
};

export function PriorityBoardPage() {
  const [filters, setFilters] = useState<FindingFilterState>(emptyFilters);
  const [items, setItems] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const minRisk =
          filters.minRisk.trim() === ""
            ? undefined
            : Number(filters.minRisk);
        const res = await listFindings({
          classId: filters.classId,
          severity: filters.severity,
          minRisk:
            minRisk !== undefined && !Number.isNaN(minRisk)
              ? minRisk
              : undefined,
        });
        if (!cancelled) {
          setItems(res.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load findings",
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
        <p className="catalog__eyebrow">VoltPulse · C09 / W01</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Prioritisation</h1>
          <Link className="btn btn--ghost" to="/alerts">
            Alerts
          </Link>
        </div>
        <p className="catalog__summary">
          Findings ranked by severity × asset criticality. Mock board — not live
          rules bus.
        </p>
      </header>

      <FindingFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <ol className="priority-board" aria-label="Prioritised findings">
        {items.map((f, index) => (
          <li key={f.id} className="priority-row">
            <span className="priority-row__rank" aria-hidden="true">
              {index + 1}
            </span>
            <div className="priority-row__body">
              <div className="priority-row__title">
                <span className="priority-row__class">{f.class_id}</span>
                <span className={`badge badge--${f.severity}`}>{f.severity}</span>
                <span className="priority-row__risk" title="W01 risk score">
                  risk {f.risk_score}
                </span>
              </div>
              <p className="priority-row__meta">
                {f.asset_id} · criticality {f.criticality} ·{" "}
                {new Date(f.occurred_at).toLocaleString()}
              </p>
              <p className="priority-row__rec">{f.recommendation}</p>
            </div>
          </li>
        ))}
      </ol>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No findings match filters.</p>
      ) : null}
    </section>
  );
}
