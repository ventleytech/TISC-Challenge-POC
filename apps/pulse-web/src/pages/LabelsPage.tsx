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

  const unlabeled = items.filter((f) => !f.label).length;

  return (
    <section className="page-view">
      <header className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS · RETRAIN FEEDBACK</p>
          <h1>Label queue</h1>
          <p>
            TP/FP from findings feed the retrain loop. Persist via patch when
            write roles allow.
          </p>
        </div>
        <div className="heading-actions">
          <Link className="btn-outline" to="/admin/retrain">
            Retrain status
          </Link>
        </div>
      </header>

      <div className="stat-grid three">
        <article className="stat-card">
          <strong>{items.length}</strong>
          <span>Findings in queue</span>
        </article>
        <article className="stat-card warning">
          <strong>{unlabeled}</strong>
          <span>Unlabeled</span>
        </article>
        <article className="stat-card">
          <strong>{items.length - unlabeled}</strong>
          <span>Labeled</span>
        </article>
      </div>

      <div className="panel" style={{ marginBottom: 18, padding: 16 }}>
        <div className="panel-head">
          <h2 className="panel-title">Model settings</h2>
          <Link className="text-link" to="/admin/retrain">
            Open retrain
          </Link>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Active model versions and job status live under Admin → Retrain.
          Labels here become `vp.labels.*` inputs when the train plane is on.
        </p>
      </div>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="dense-table" aria-label="Label queue">
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
                      className="small-action"
                      disabled={!canWrite}
                      onClick={() => void setLabel(f.id, "tp")}
                    >
                      TP
                    </button>{" "}
                    <button
                      type="button"
                      className="small-action"
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
        </div>
      </div>
    </section>
  );
}
