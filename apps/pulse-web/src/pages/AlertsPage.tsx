import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SlaCountdown } from "../components/SlaCountdown";
import { ackAlert, listAlerts } from "../mock/client";
import { SEVERITIES, type Alert, type Severity } from "../types/domain";

export function AlertsPage() {
  const [severity, setSeverity] = useState<Severity | "">("");
  const [openOnly, setOpenOnly] = useState(true);
  const [items, setItems] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [acking, setAcking] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await listAlerts({
        severity,
        openOnly,
      });
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

  return (
    <section className="catalog">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · C07</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Alerts</h1>
          <Link className="btn btn--ghost" to="/priority">
            Priority board
          </Link>
        </div>
        <p className="catalog__summary">
          SLA countdown stub + operator acknowledge. Mock state — no push/SMS
          bus.
        </p>
      </header>

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

      <ul className="alert-list" aria-label="Alerts">
        {items.map((alert) => {
          const acked = Boolean(alert.ack_at);
          return (
            <li key={alert.id} className="alert-row">
              <div className="alert-row__main">
                <div className="alert-row__title">
                  <span className="alert-row__name">{alert.title}</span>
                  <span className={`badge badge--${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="alert-row__meta">
                  {alert.id} · finding {alert.finding_id}
                  {alert.inspection_id ? ` · ${alert.inspection_id}` : ""}
                </p>
                <p className="alert-row__sla">
                  SLA{" "}
                  <SlaCountdown dueAt={alert.sla_due_at} />
                  {acked && alert.ack_at
                    ? ` · acked ${new Date(alert.ack_at).toLocaleString()}`
                    : ""}
                </p>
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
