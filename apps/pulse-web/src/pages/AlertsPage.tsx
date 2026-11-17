import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SlaCountdown } from "../components/SlaCountdown";
import { ackAlert, listAlerts } from "../mock/client";
import { SEVERITIES, type Alert, type Severity } from "../types/domain";

function slaTone(dueAt: string | null, now: number): "ok" | "warn" | "breach" {
  if (!dueAt) return "ok";
  const ms = new Date(dueAt).getTime() - now;
  if (ms < 0) return "breach";
  if (ms < 30 * 60_000) return "warn";
  return "ok";
}

export function AlertsPage() {
  const [severity, setSeverity] = useState<Severity | "">("");
  const [openOnly, setOpenOnly] = useState(true);
  const [items, setItems] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [acking, setAcking] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await listAlerts({ severity, openOnly });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    }
  }, [severity, openOnly]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listAlerts({ severity, openOnly });
        if (!cancelled) {
          setItems(res.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load alerts",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [severity, openOnly]);

  async function onAck(alertId: string) {
    setAcking(alertId);
    try {
      const updated = await ackAlert(alertId);
      if (!updated) {
        setError(`Alert ${alertId} not found`);
        return;
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ack failed");
    } finally {
      setAcking(null);
    }
  }

  const summary = useMemo(() => {
    const breach = items.filter(
      (a) => !a.ack_at && slaTone(a.sla_due_at, now) === "breach",
    ).length;
    const warn = items.filter(
      (a) => !a.ack_at && slaTone(a.sla_due_at, now) === "warn",
    ).length;
    const open = items.filter((a) => !a.ack_at).length;
    return { breach, warn, open };
  }, [items, now]);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · C07</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Alerts &amp; SLA</h1>
          <Link className="btn btn--ghost" to="/priority">
            Priority board
          </Link>
        </div>
        <p className="catalog__summary">
          Operator ack queue with live countdown. Breach rows pulse; mock state
          only — no SMS bus.
        </p>
      </header>

      <div className="stat-band">
        <div className="stat-band__cell stat-band__cell--danger">
          <span className="stat-band__n">{summary.breach}</span>
          <span className="stat-band__l">Breached</span>
        </div>
        <div className="stat-band__cell stat-band__cell--warn">
          <span className="stat-band__n">{summary.warn}</span>
          <span className="stat-band__l">Under 30m</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">{summary.open}</span>
          <span className="stat-band__l">Open in view</span>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Alert filters">
        <label className="filters__field">
          <span className="filters__label">Severity</span>
          <select
            className="filters__select"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | "")}
          >
            <option value="">All</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="filters__field filters__field--check">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => setOpenOnly(e.target.checked)}
          />
          <span className="filters__label">Open only</span>
        </label>
      </div>

      {error ? <p className="catalog__error">{error}</p> : null}

      <ul className="alert-grid" aria-label="Alerts">
        {items.map((alert, index) => {
          const acked = Boolean(alert.ack_at);
          const tone = slaTone(alert.sla_due_at, now);
          return (
            <li
              key={alert.id}
              className={`alert-tile alert-tile--${tone}${acked ? " is-acked" : ""}`}
              style={{ animationDelay: `${index * 55}ms` }}
            >
              <div className="alert-tile__main">
                <div className="alert-tile__title">
                  <span className="alert-tile__name">{alert.title}</span>
                  <span className={`badge badge--${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="alert-tile__meta">
                  <span className="mono">{alert.id}</span> · finding{" "}
                  <span className="mono">{alert.finding_id}</span>
                  {alert.inspection_id ? (
                    <>
                      {" "}
                      · <span className="mono">{alert.inspection_id}</span>
                    </>
                  ) : null}
                </p>
                <div className="alert-tile__sla">
                  <span className="alert-tile__sla-label">SLA</span>
                  <SlaCountdown dueAt={alert.sla_due_at} />
                  {acked && alert.ack_at ? (
                    <span className="alert-tile__acked">
                      acked {new Date(alert.ack_at).toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                disabled={acked || acking === alert.id}
                onClick={() => void onAck(alert.id)}
              >
                {acked ? "Acknowledged" : acking === alert.id ? "…" : "Ack"}
              </button>
            </li>
          );
        })}
      </ul>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No alerts match filters.</p>
      ) : null}
    </section>
  );
}
