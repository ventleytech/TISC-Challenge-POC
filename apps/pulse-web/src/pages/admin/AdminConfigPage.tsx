import { useState, type FormEvent } from "react";
import { getLocale, setLocale, LOCALES, type Locale } from "../../i18n";
import { AdminTabs } from "../../components/AdminTabs";
import {
  importAssetsCsv,
  liveApiEnabled,
  loadAdminConfig,
  saveAdminConfig,
  type AdminConfig,
} from "../../mock/client";
import { DEMO_UTILITY_ID } from "../../mock/data";
import { useAuth } from "../../auth/AuthContext";

const SAMPLE_CSV = `name,site_name,criticality,voltage_class
Tower T-12,North Ridge,high,132kV
Feeder F-14,North Ridge,critical,33kV
`;

export function AdminConfigPage() {
  const { canWrite } = useAuth();
  const [cfg, setCfg] = useState<AdminConfig>(() => loadAdminConfig());
  const [locale, setLoc] = useState<Locale>(getLocale());
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [csvMsg, setCsvMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSave(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    saveAdminConfig(cfg);
    setSaved(true);
  }

  async function runCsv(dry: boolean) {
    if (!canWrite) return;
    const res = await importAssetsCsv(DEMO_UTILITY_ID, csv, dry);
    setCsvMsg(
      `${res.dry_run ? "Dry-run" : "Applied"}: ${res.row_count} row(s)` +
        (liveApiEnabled() ? " · live" : " · mock"),
    );
  }

  return (
    <section className="page-view">
      <AdminTabs />
      <header className="catalog__header">
        <p className="catalog__eyebrow">Admin · config</p>
        <h1 className="catalog__title">Policy & CSV</h1>
        <p className="catalog__summary">
          SLA timers, channels, severity, retention — local persistence until Nest
          policies land. CSV import wired to import-csv.
        </p>
      </header>

      <form className="wizard-panel wizard-panel--rich" onSubmit={onSave}>
        <div className="filters">
          <label className="filters__field">
            <span className="filters__label">Critical SLA (min)</span>
            <input
              className="field"
              type="number"
              value={cfg.sla_critical_min}
              disabled={!canWrite}
              onChange={(e) =>
                setCfg({ ...cfg, sla_critical_min: Number(e.target.value) })
              }
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">High SLA (min)</span>
            <input
              className="field"
              type="number"
              value={cfg.sla_high_min}
              disabled={!canWrite}
              onChange={(e) =>
                setCfg({ ...cfg, sla_high_min: Number(e.target.value) })
              }
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Channels</span>
            <input
              className="field"
              value={cfg.channels}
              disabled={!canWrite}
              onChange={(e) => setCfg({ ...cfg, channels: e.target.value })}
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Hot retention (days)</span>
            <input
              className="field"
              type="number"
              value={cfg.retention_hot_days}
              disabled={!canWrite}
              onChange={(e) =>
                setCfg({ ...cfg, retention_hot_days: Number(e.target.value) })
              }
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Locale</span>
            <select
              className="field"
              value={locale}
              onChange={(e) => {
                const next = e.target.value as Locale;
                setLocale(next);
                setLoc(next);
              }}
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary" disabled={!canWrite}>
          Save config
        </button>
        {saved ? <p className="catalog__summary">Saved locally.</p> : null}
      </form>

      <div className="wizard-panel wizard-panel--rich">
        <h2 className="catalog__subtitle">Assets CSV import</h2>
        <textarea
          className="field filters__textarea"
          rows={5}
          value={csv}
          disabled={!canWrite}
          onChange={(e) => setCsv(e.target.value)}
        />
        <div className="wizard-actions">
          <button type="button" className="btn-outline" disabled={!canWrite} onClick={() => void runCsv(true)}>
            Dry-run
          </button>
          <button type="button" className="btn-primary" disabled={!canWrite} onClick={() => void runCsv(false)}>
            Apply
          </button>
        </div>
        {csvMsg ? <p className="catalog__summary">{csvMsg}</p> : null}
      </div>
    </section>
  );
}
