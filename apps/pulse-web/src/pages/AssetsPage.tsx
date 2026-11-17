import { useEffect, useState } from "react";
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

  return (
    <section className="catalog">
      <header className="catalog__header">
        <p className="catalog__eyebrow">VoltPulse · A01</p>
        <h1 className="catalog__title">Assets</h1>
        <p className="catalog__summary">
          Line, feeder, substation hierarchy stubs. Filters only — not a GIS map.
        </p>
      </header>

      <AssetFilters value={filters} onChange={setFilters} />

      {error ? <p className="catalog__error">{error}</p> : null}

      <ul className="record-list" aria-label="Asset registry">
        {items.map((asset) => (
          <li key={asset.id}>
            <Link className="record-row" to={`/assets/${asset.id}`}>
              <span className="record-row__name">{asset.name}</span>
              <span className="record-row__meta">
                {asset.kind}
                {asset.criticality ? ` · ${asset.criticality}` : ""}
                {asset.voltage_class ? ` · ${asset.voltage_class}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {items.length === 0 && !error ? (
        <p className="catalog__empty">No assets match filters.</p>
      ) : null}
    </section>
  );
}
