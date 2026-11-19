import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  AssetFilters,
  type AssetFilterState,
} from "../components/AssetFilters";
import { createAsset, listAssets, liveApiEnabled } from "../mock/client";
import { DEMO_UTILITY_ID } from "../mock/data";
import type { Asset, AssetKind, Criticality } from "../types/domain";
import { ASSET_KINDS, CRITICALITIES } from "../types/domain";

const emptyFilters: AssetFilterState = {
  kind: "",
  criticality: "",
  q: "",
};

export function AssetsPage() {
  const [filters, setFilters] = useState<AssetFilterState>(emptyFilters);
  const [items, setItems] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AssetKind>("tower");
  const [criticality, setCriticality] = useState<Criticality>("medium");
  const [voltage, setVoltage] = useState("");
  const [oem, setOem] = useState("");
  const [warranty, setWarranty] = useState("");
  const [circuit, setCircuit] = useState("");
  const [antiCorrosion, setAntiCorrosion] = useState("");
  const [installYear, setInstallYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listAssets(filters);
        if (!cancelled) {
          setItems(res.items);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assets");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, reloadTick]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Name required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const { id } = await createAsset({
        utility_id: DEMO_UTILITY_ID,
        name: name.trim(),
        kind,
        criticality,
        voltage_class: voltage.trim() || null,
        oem: oem.trim() || null,
        circuit: circuit.trim() || null,
        warranty_until: warranty.trim() || null,
        anti_corrosion_sla: antiCorrosion.trim() || null,
        install_year: installYear ? Number(installYear) : null,
      });
      setCreatedId(id);
      setName("");
      setVoltage("");
      setOem("");
      setWarranty("");
      setCircuit("");
      setAntiCorrosion("");
      setInstallYear("");
      setReloadTick((n) => n + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  const stats = useMemo(() => {
    const critical = items.filter((a) => a.criticality === "critical").length;
    const high = items.filter((a) => a.criticality === "high").length;
    const kinds = new Set(items.map((a) => a.kind)).size;
    return { critical, high, kinds };
  }, [items]);

  return (
    <section className="page-view">
      <header className="page-heading">
        <div>
          <p className="eyebrow">TPULSE · A01</p>
          <h1>Asset registry</h1>
          <p>
            Dense corridor registry — create writes through
            {liveApiEnabled() ? " live pulse-api" : " mock client"}; filters
            apply to the loaded set.
          </p>
        </div>
        <div className="heading-actions">
          <Link className="btn-outline" to="/map">
            Open corridor map
          </Link>
        </div>
      </header>

      <div className="stat-grid three">
        <article className="stat-card">
          <strong>{items.length}</strong>
          <span>In view</span>
        </article>
        <article className="stat-card danger">
          <strong>{stats.critical}</strong>
          <span>Critical</span>
        </article>
        <article className="stat-card warning">
          <strong>{stats.high}</strong>
          <span>High</span>
        </article>
      </div>

      <form className="panel form-panel" onSubmit={onCreate}>
        <h2 className="panel-title">Add asset</h2>
        <div className="form-grid six">
          <label>
            Name
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label>
            Kind
            <select
              className="field"
              value={kind}
              onChange={(e) => setKind(e.target.value as AssetKind)}
            >
              {ASSET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label>
            Criticality
            <select
              className="field"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as Criticality)}
            >
              {CRITICALITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Voltage
            <input
              className="field"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              placeholder="132kV"
            />
          </label>
          <label>
            OEM
            <input
              className="field"
              value={oem}
              onChange={(e) => setOem(e.target.value)}
            />
          </label>
          <label>
            Warranty until
            <input
              className="field"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <label>
            Circuit
            <input
              className="field"
              value={circuit}
              onChange={(e) => setCircuit(e.target.value)}
            />
          </label>
          <label>
            Anti-corrosion SLA
            <input
              className="field"
              value={antiCorrosion}
              onChange={(e) => setAntiCorrosion(e.target.value)}
            />
          </label>
          <label>
            Install year
            <input
              className="field"
              value={installYear}
              onChange={(e) => setInstallYear(e.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>
        {formError ? <p className="catalog__error">{formError}</p> : null}
        {createdId ? (
          <p className="muted">
            Created{" "}
            <Link to={`/assets/${createdId}`}>{createdId}</Link>
          </p>
        ) : null}
        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create asset"}
        </button>
      </form>

      <AssetFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="dense-table" aria-label="Assets">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Criticality</th>
                <th>Voltage</th>
                <th>Circuit</th>
                <th>Id</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/assets/${a.id}`}>{a.name}</Link>
                  </td>
                  <td>{a.kind}</td>
                  <td>
                    <span className={`severity-tag ${a.criticality === "critical" ? "critical" : a.criticality === "high" ? "high" : "low"}`}>
                      {a.criticality}
                    </span>
                  </td>
                  <td>{a.voltage_class ?? "—"}</td>
                  <td>{a.circuit ?? "—"}</td>
                  <td className="mono">{a.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 ? (
          <p className="muted" style={{ padding: 14 }}>
            No assets match filters.
          </p>
        ) : null}
      </div>
    </section>
  );
}
