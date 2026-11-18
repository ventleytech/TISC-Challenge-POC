import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { assetName, listFindings, patchFinding } from "../mock/client";
import type { Finding, LabelVerdict } from "../types/domain";

export function LabelsPage() {
  const { canWrite } = useAuth();
  const [items, setItems] = useState<Finding[]>([]);

  async function reload() {
    const res = await listFindings({});
    setItems(res.items);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function setLabel(id: string, label: LabelVerdict) {
    if (!canWrite) return;
    await patchFinding(id, { label });
    await reload();
  }

  return (
    <section className="catalog catalog--wide">
      <header className="catalog__header">
        <p className="catalog__eyebrow">Labels · retrain feedback</p>
        <div className="catalog__title-row">
          <h1 className="catalog__title">Label queue</h1>
          <Link className="btn btn--ghost" to="/admin/retrain">
            Retrain status
          </Link>
        </div>
        <p className="catalog__summary">
          TP/FP from findings — persists via mock patch (Nest PATCH pending).
        </p>
      </header>

      <table className="dense-table">
        <thead>
          <tr>
            <th>Finding</th>
            <th>Class</th>
            <th>Asset</th>
            <th>Label</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((f) => (
            <tr key={f.id}>
              <td>
                <Link to={`/findings/${f.id}`} className="mono">
                  {f.id}
                </Link>
              </td>
              <td>{f.class_id}</td>
              <td>{assetName(f.asset_id)}</td>
              <td>{f.label ?? "unlabeled"}</td>
              <td>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={!canWrite}
                  onClick={() => void setLabel(f.id, "tp")}
                >
                  TP
                </button>{" "}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={!canWrite}
                  onClick={() => void setLabel(f.id, "fp")}
                >
                  FP
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
