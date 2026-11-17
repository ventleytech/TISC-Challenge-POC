import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FindingFilters,
  type FindingFilterState,
} from "../components/FindingFilters";
import { assetName, listFindings } from "../mock/client";
import type { Finding } from "../types/domain";

const emptyFilters: FindingFilterState = {
  classId: "",
  severity: "",
  minRisk: "",
};

const columns: { key: string; title: string; match: (f: Finding) => boolean }[] =
  [
    {
      key: "critical",
      title: "Critical lane",
      match: (f) => f.severity === "critical" || f.risk_score >= 85,
    },
    {
      key: "elevated",
      title: "Elevated",
      match: (f) =>
        f.risk_score >= 60 && f.risk_score < 85 && f.severity !== "critical",
    },
    {
      key: "watch",
      title: "Watch",
      match: (f) => f.risk_score < 60,
    },
  ];

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

  const grouped = useMemo(() => {
    const used = new Set<string>();
    return columns.map((col) => {
      const rows = items.filter((f) => {
        if (used.has(f.id)) return false;
        if (!col.match(f)) return false;
        used.add(f.id);
        return true;
      });
      return { ...col, rows };
    });
  }, [items]);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · C09 / W01</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Prioritisation</h1>
          <Link className="btn btn--ghost" to="/alerts">
            Alerts SLA
          </Link>
        </div>
        <p className="catalog__summary">
          Risk board — severity × asset criticality. Drag-free columns for demo
          triage; mock findings only.
        </p>
      </header>

      <div className="stat-band">
        <div className="stat-band__cell">
          <span className="stat-band__n">{items.length}</span>
          <span className="stat-band__l">Ranked findings</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">
            {items[0] ? items[0].risk_score : "—"}
          </span>
          <span className="stat-band__l">Top risk score</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">
            {items.filter((f) => f.severity === "critical").length}
          </span>
          <span className="stat-band__l">Critical severity</span>
        </div>
      </div>

      <FindingFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="board" aria-label="Prioritisation columns">
        {grouped.map((col) => (
          <section key={col.key} className={`board__col board__col--${col.key}`}>
            <header className="board__head">
              <h2>{col.title}</h2>
              <span className="board__count">{col.rows.length}</span>
            </header>
            <ol className="board__list">
              {col.rows.map((f, index) => (
                <li
                  key={f.id}
                  className="board-card"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="board-card__top">
                    <span className="board-card__class">{f.class_id}</span>
                    <span className={`badge badge--${f.severity}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="board-card__asset">
                    <Link to={`/assets/${f.asset_id}`}>
                      {assetName(f.asset_id)}
                    </Link>
                  </p>
                  <div className="board-card__risk">
                    <span
                      className="risk-bar"
                      style={{ ["--risk" as string]: `${f.risk_score}%` }}
                      aria-hidden="true"
                    />
                    <span className="board-card__score">risk {f.risk_score}</span>
                  </div>
                  <p className="board-card__meta">
                    {f.criticality} ·{" "}
                    {new Date(f.occurred_at).toLocaleString()}
                  </p>
                  <p className="board-card__rec">{f.recommendation}</p>
                  <div className="board-card__actions">
                    <Link className="btn btn--ghost btn--sm" to="/alerts">
                      Open alerts
                    </Link>
                    <Link
                      className="btn btn--ghost btn--sm"
                      to={`/assets/${f.asset_id}`}
                    >
                      Asset
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
            {col.rows.length === 0 ? (
              <p className="board__empty">Empty lane</p>
            ) : null}
          </section>
        ))}
      </div>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No findings match filters.</p>
      ) : null}
    </section>
  );
}
