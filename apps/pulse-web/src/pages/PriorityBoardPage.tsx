import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  FindingFilters,
  type FindingFilterState,
} from "../components/FindingFilters";
import {
  assetName,
  createTask,
  listFindings,
  patchFinding,
} from "../mock/client";
import type { Finding } from "../types/domain";

const emptyFilters: FindingFilterState = {
  classId: "",
  severity: "",
  minRisk: "",
};

const columns: {
  key: string;
  title: string;
  laneClass: string;
  match: (f: Finding) => boolean;
}[] = [
    {
      key: "critical",
      title: "Critical lane",
      laneClass: "lane critical-lane",
      match: (f) => f.severity === "critical" || f.risk_score >= 85,
    },
    {
      key: "elevated",
      title: "Elevated",
      laneClass: "lane",
      match: (f) =>
        f.risk_score >= 60 && f.risk_score < 85 && f.severity !== "critical",
    },
    {
      key: "watch",
      title: "Watch",
      laneClass: "lane",
      match: (f) => f.risk_score < 60,
    },
  ];

export function PriorityBoardPage() {
  const { canWrite } = useAuth();
  const [filters, setFilters] = useState<FindingFilterState>(emptyFilters);
  const [items, setItems] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const minRisk =
          filters.minRisk.trim() === "" ? undefined : Number(filters.minRisk);
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
    <section className="page-view" aria-label="Findings prioritisation">
      <header className="page-heading">
        <div>
          <p className="eyebrow">TPULSE · C09 / W01</p>
          <h1>Prioritisation</h1>
          <p>
            Risk board — severity × asset criticality. Drag-free columns for
            demo triage.
          </p>
        </div>
        <div className="heading-actions">
          <Link className="btn-outline" to="/alerts">
            Alerts SLA
          </Link>
        </div>
      </header>

      <div className="stat-grid three">
        <article className="stat-card">
          <strong>{items.length}</strong>
          <span>Ranked findings</span>
        </article>
        <article className="stat-card">
          <strong>{items[0] ? items[0].risk_score : "—"}</strong>
          <span>Top risk score</span>
        </article>
        <article className="stat-card danger">
          <strong>
            {items.filter((f) => f.severity === "critical").length}
          </strong>
          <span>Critical severity</span>
        </article>
      </div>

      <FindingFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}
      {msg ? <p className="muted">{msg}</p> : null}

      <div className="kanban" aria-label="Prioritisation columns">
        {grouped.map((col) => (
          <section key={col.key} className={col.laneClass}>
            <header className="lane-head">
              <h3>{col.title}</h3>
              <span>{col.rows.length}</span>
            </header>
            {col.rows.map((f) => (
              <article key={f.id} className="finding-card">
                <div className="card-top">
                  <span className="mono">{f.class_id}</span>
                  <span className={`severity-tag ${f.severity}`}>
                    {f.severity}
                  </span>
                </div>
                <h3>
                  <Link to={`/assets/${f.asset_id}`}>
                    {assetName(f.asset_id)}
                  </Link>
                </h3>
                <div className="risk-meter" aria-hidden="true">
                  <i style={{ width: `${Math.min(100, f.risk_score)}%` }} />
                </div>
                <p className="card-meta">
                  risk {f.risk_score} · {f.criticality} ·{" "}
                  {new Date(f.occurred_at).toLocaleString()}
                </p>
                <p>{f.recommendation}</p>
                <div className="button-row">
                  <Link className="small-action" to={`/findings/${f.id}`}>
                    Open finding
                  </Link>
                  <Link className="small-action" to="/alerts">
                    Open alert
                  </Link>
                  <button
                    type="button"
                    className="small-action"
                    disabled={!canWrite}
                    onClick={() =>
                      void createTask({
                        title: `Assign · ${f.class_id} · ${assetName(f.asset_id)}`,
                        assignee: "Crew North",
                        finding_id: f.id,
                        due_at: new Date(Date.now() + 86400000).toISOString(),
                      }).then(() => setMsg(`Task created for ${f.id}`))
                    }
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    className="small-action"
                    disabled={!canWrite}
                    onClick={() =>
                      void createTask({
                        title: `Scheduled follow-up · ${f.id}`,
                        assignee: "Scheduler",
                        finding_id: f.id,
                      }).then(() => setMsg(`Marked scheduled · ${f.id}`))
                    }
                  >
                    Mark scheduled
                  </button>
                  <button
                    type="button"
                    className="small-action"
                    disabled={!canWrite}
                    onClick={() =>
                      void patchFinding(f.id, { label: "tp" }).then(() =>
                        setMsg(`TP · ${f.id}`),
                      )
                    }
                  >
                    TP
                  </button>
                  <button
                    type="button"
                    className="small-action"
                    disabled={!canWrite}
                    onClick={() =>
                      void patchFinding(f.id, { label: "fp" }).then(() =>
                        setMsg(`FP · ${f.id}`),
                      )
                    }
                  >
                    FP
                  </button>
                </div>
              </article>
            ))}
            {col.rows.length === 0 ? (
              <p className="muted">Empty lane</p>
            ) : null}
          </section>
        ))}
      </div>

      {items.length === 0 && !error ? (
        <p className="muted">No findings match filters.</p>
      ) : null}
    </section>
  );
}
