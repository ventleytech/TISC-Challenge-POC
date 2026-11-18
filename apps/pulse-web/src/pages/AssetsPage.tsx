import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AssetFilters,
  type AssetFilterState,
} from "../components/AssetFilters";
import { listAssets } from "../mock/client";
import type { Asset } from "../types/domain";

const emptyFilters: AssetFilterState = {
  kind: "",
  criticality: "",
  q: "",
};

export function AssetsPage() {
  const [filters, setFilters] = useState<AssetFilterState>(emptyFilters);
  const [items, setItems] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  }, [filters]);

  const stats = useMemo(() => {
    const critical = items.filter((a) => a.criticality === "critical").length;
    const high = items.filter((a) => a.criticality === "high").length;
    const kinds = new Set(items.map((a) => a.kind)).size;
    return { critical, high, kinds };
  }, [items]);

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · A01</p>
        <h1 className="catalog__title">Asset registry</h1>
        <p className="catalog__summary">
          Dense corridor registry — criticality, voltage, circuit, OEM. Filters
          live; map panel is a layout stub for demo density.
        </p>
      </header>

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
