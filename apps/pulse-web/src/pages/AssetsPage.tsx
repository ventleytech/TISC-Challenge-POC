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
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">TPulse · A01</p>
        <h1 className="catalog__title">Asset registry</h1>
        <p className="catalog__summary">
          Dense corridor registry — create writes through
          {liveApiEnabled() ? " live pulse-api" : " mock client"}; filters apply
          to the loaded set.
        </p>
      </header>

      <form className="wizard-panel wizard-panel--rich" onSubmit={onCreate}>
        <h2 className="catalog__subtitle">Add asset</h2>
        <div className="filters">
          <label className="filters__field">
            <span className="filters__label">Name</span>
            <input
              className="filters__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tower T-12"
              required
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Kind</span>
            <select
              className="filters__select"
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
          <label className="filters__field">
            <span className="filters__label">Criticality</span>
            <select
              className="filters__select"
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
          <label className="filters__field">
            <span className="filters__label">Voltage</span>
            <input
              className="filters__input"
              value={voltage}
              onChange={(e) => setVoltage(e.target.value)}
              placeholder="132kV"
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">OEM</span>
            <input
              className="filters__input"
              value={oem}
              onChange={(e) => setOem(e.target.value)}
              placeholder="LatticeForge"
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Warranty until</span>
            <input
              className="filters__input"
              type="date"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Circuit</span>
            <input
              className="filters__input"
              value={circuit}
              onChange={(e) => setCircuit(e.target.value)}
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Anti-corrosion SLA</span>
            <input
              className="filters__input"
              value={antiCorrosion}
              onChange={(e) => setAntiCorrosion(e.target.value)}
              placeholder="annual"
            />
          </label>
          <label className="filters__field">
            <span className="filters__label">Install year</span>
            <input
              className="filters__input"
              value={installYear}
              onChange={(e) => setInstallYear(e.target.value)}
              placeholder="2011"
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Saving…" : "Create asset"}
          </button>
        </div>
        <p className="catalog__summary">
          CSV import lives under{" "}
          <Link to="/admin/config">Admin · Config</Link>. Map deep-link from
          each row or the corridor sketch.
        </p>
        {formError ? <p className="catalog__error">{formError}</p> : null}
        {createdId ? (
          <p className="catalog__summary">
            Created <strong className="mono">{createdId}</strong> ·{" "}
            <Link to={`/map?asset=${createdId}`}>Open on map</Link>
          </p>
        ) : null}
      </form>

      <div className="stat-band">
        <div className="stat-band__cell">
          <span className="stat-band__n">{items.length}</span>
          <span className="stat-band__l">In view</span>
        </div>
        <div className="stat-band__cell stat-band__cell--danger">
          <span className="stat-band__n">{stats.critical}</span>
          <span className="stat-band__l">Critical</span>
        </div>
        <div className="stat-band__cell stat-band__cell--warn">
          <span className="stat-band__n">{stats.high}</span>
          <span className="stat-band__l">High</span>
        </div>
        <div className="stat-band__cell">
          <span className="stat-band__n">{stats.kinds}</span>
          <span className="stat-band__l">Kinds</span>
        </div>
      </div>

      <AssetFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <div className="registry-split">
        <div className="table-wrap">
          <table className="dense-table" aria-label="Asset registry">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Criticality</th>
                <th>Voltage</th>
                <th>Circuit</th>
                <th>OEM</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {items.map((asset, index) => (
                <tr
                  key={asset.id}
                  className="dense-table__row dense-table__row--link"
                  style={{ animationDelay: `${index * 35}ms` }}
                >
                  <td>
                    <Link to={`/assets/${asset.id}`}>{asset.name}</Link>
                    <div className="mono muted-id">{asset.id}</div>
                    <Link
                      className="btn btn--ghost btn--sm"
                      to={`/map?asset=${encodeURIComponent(asset.id)}`}
                    >
                      Map
                    </Link>
                  </td>
                  <td>{asset.kind}</td>
                  <td>
                    {asset.criticality ? (
                      <span className={`badge badge--crit-${asset.criticality}`}>
                        {asset.criticality}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="mono">{asset.voltage_class ?? "—"}</td>
                  <td>{asset.circuit ?? "—"}</td>
                  <td>{asset.oem ?? "—"}</td>
                  <td className="mono">{asset.install_year ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="map-stub" aria-label="Corridor map stub">
          <header className="map-stub__head">
            <h2>Corridor sketch</h2>
            <Link className="chip" to="/map">
              open full map
            </Link>
          </header>
          <div className="map-stub__canvas" aria-hidden="true">
            <span className="map-stub__line map-stub__line--a" />
            <span className="map-stub__line map-stub__line--b" />
            <span className="map-stub__node" style={{ top: "28%", left: "22%" }} />
            <span className="map-stub__node map-stub__node--hot" style={{ top: "46%", left: "58%" }} />
            <span className="map-stub__node" style={{ top: "68%", left: "40%" }} />
            <span className="map-stub__node" style={{ top: "36%", left: "74%" }} />
          </div>
          <p className="map-stub__note">
            {stats.critical + stats.high} elevated assets in filtered set —
            open the full corridor map for risk heat and alerts.
          </p>
        </aside>
      </div>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No assets match filters.</p>
      ) : null}
    </section>
  );
}
