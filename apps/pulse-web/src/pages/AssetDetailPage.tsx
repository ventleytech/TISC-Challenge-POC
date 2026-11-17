import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAsset } from "../mock/client";
import type { Asset } from "../types/domain";

export function AssetDetailPage() {
  const { assetId = "" } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const row = await getAsset(assetId);
        if (!cancelled) {
          setAsset(row);
          setError(row ? null : "Asset not found");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Load failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return (
    <section className="catalog">
      <p className="catalog__eyebrow">
        <Link to="/assets">Assets</Link> / detail
      </p>
      {loading ? <p className="catalog__empty">Loading…</p> : null}
      {error ? <p className="catalog__error">{error}</p> : null}
      {asset ? (
        <>
          <h1 className="catalog__title">{asset.name}</h1>
          <dl className="detail-grid">
            <div>
              <dt>ID</dt>
              <dd>{asset.id}</dd>
            </div>
            <div>
              <dt>Kind</dt>
              <dd>{asset.kind}</dd>
            </div>
            <div>
              <dt>Criticality</dt>
              <dd>{asset.criticality ?? "—"}</dd>
            </div>
            <div>
              <dt>Voltage</dt>
              <dd>{asset.voltage_class ?? "—"}</dd>
            </div>
            <div>
              <dt>Parent</dt>
              <dd>
                {asset.parent_id ? (
                  <Link to={`/assets/${asset.parent_id}`}>{asset.parent_id}</Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Utility</dt>
              <dd>{asset.utility_id}</dd>
            </div>
          </dl>
          <p className="catalog__summary">
            Stub detail — geo / OEM / warranty fields land in later A* cards.
          </p>
        </>
      ) : null}
    </section>
  );
}
