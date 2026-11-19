import { useEffect, useState, type FormEvent } from "react";
import { DEMO_UTILITY_ID } from "../mock/data";
import {
  complianceReportUrl,
  importAssetsCsv,
  listOpsMetrics,
  liveApiEnabled,
} from "../mock/client";
import { getLocale, setLocale, t, type Locale, LOCALES } from "../i18n";
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

const SAMPLE_CSV = `name,site_name,criticality,voltage_class
Tower T-12,North Ridge,high,132kV
Feeder F-14,North Ridge,critical,33kV
`;

export function AdminPage() {
  const [metrics, setMetrics] = useState<OpsMetric[]>([]);
  const [activeRole, setActiveRole] = useState(roles[0].id);
  const [locale, setLoc] = useState<Locale>(getLocale());
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);
  const [csvErr, setCsvErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listOpsMetrics().then((res) => {
      if (!cancelled) setMetrics(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function onLocale(next: Locale) {
    setLocale(next);
    setLoc(next);
  }

  async function runCsv(dryRun: boolean, e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCsvErr(null);
    setCsvMsg(null);
    try {
      const res = await importAssetsCsv(DEMO_UTILITY_ID, csv, dryRun);
      if (res.errors.length) {
        setCsvErr(res.errors.join("; "));
      }
      setCsvMsg(
        `${res.dry_run ? "Dry-run" : "Applied"}: ${res.row_count} row(s)` +
          (res.asset_ids.length ? ` · assets ${res.asset_ids.length}` : "") +
          (liveApiEnabled() ? " · live API" : " · mock"),
      );
    } catch (err) {
      setCsvErr(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const complianceHref = complianceReportUrl(DEMO_UTILITY_ID);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">TPulse · admin</p>
        <h1 className="catalog__title">Admin &amp; pipeline</h1>
        <p className="catalog__summary">
          CSV import (M03), compliance export (W06), locale (W08) — utility stub
          remains demo IAM.
        </p>
      </header>

      <div className="filters" style={{ marginBottom: "1rem" }}>
        <label className="filters__field">
          <span className="filters__label">{t("admin.locale", locale)}</span>
          <select
            className="filters__select"
            value={locale}
            onChange={(e) => onLocale(e.target.value as Locale)}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <a className="btn btn--ghost" href={complianceHref} target="_blank" rel="noreferrer">
          {t("admin.compliance", locale)}
        </a>
      </div>

      <form className="wizard-panel wizard-panel--rich" onSubmit={(e) => void runCsv(true, e)}>
        <h2 className="catalog__subtitle">{t("admin.csv.title", locale)}</h2>
        <p className="catalog__summary">{t("admin.csv.hint", locale)}</p>
        <textarea
          className="filters__input filters__textarea"
          rows={6}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          spellCheck={false}
        />
        <div className="wizard-actions">
          <button type="submit" className="btn btn--ghost" disabled={busy}>
            Dry-run
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={(e) => void runCsv(false, e as unknown as FormEvent)}
          >
            Apply import
          </button>
        </div>
        {csvErr ? <p className="catalog__error">{csvErr}</p> : null}
        {csvMsg ? <p className="catalog__summary">{csvMsg}</p> : null}
      </form>

      <ul className="kpi-row kpi-row--admin">
        {metrics.map((m) => (
          <li key={m.id} className={`kpi kpi--${m.tone}`}>
            <span className="kpi__value">{m.value}</span>
            <span className="kpi__label">{m.label}</span>
            <span className="kpi__hint">{m.hint}</span>
          </li>
        ))}
      </ul>

      <div className="admin-grid">
        <section className="admin-panel">
          <h2>Utility</h2>
          <p className="mono">{utility.id}</p>
          <p>{utility.name}</p>
          <p>{utility.region}</p>
          <p>{utility.planes}</p>
        </section>
        <section className="admin-panel">
          <h2>Roles</h2>
          <ul className="role-list">
            {roles.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={activeRole === r.id ? "is-active" : undefined}
                  onClick={() => setActiveRole(r.id)}
                >
                  {r.name}
                </button>
                <span>
                  {r.scope} · {r.seats} seats
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="admin-panel">
          <h2>Pipeline</h2>
          <table className="dense-table" aria-label="Pipeline health">
            <thead>
              <tr>
                <th>Service</th>
                <th>Plane</th>
                <th>State</th>
                <th>Lag</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((row) => (
                <tr key={row.name}>
                  <td className="mono">{row.name}</td>
                  <td>{row.plane}</td>
                  <td>{row.state}</td>
                  <td>{row.lag}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </section>
  );
}
